'use strict';
/* ================= 🌐 Auto-translate cards =================
   Two free sources, no account needed (both need the internet, and the words you translate are sent to them):
   - Wiktionary (en.wiktionary.org): the best for single words into English. It lists each meaning, like
     banco → "bank", "bench", so you can pick the right one.
   - MyMemory (mymemory.translated.net): phrases and every other language pair. Its answers come with a quality
     score; the best-scored ones are shown first (an unscored crowd answer can be plain wrong).
   In the card editor, 🌐 on one side translates it into the other side (you pick from the suggestions).
   With cards selected in the card list, "🌐 Translate" fills a side for all of them, with a preview to check first. */
const txBase = l => (l || '').split('-')[0].toLowerCase();
const txCache = new Map();
const txClean = s => String(s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/\s+/g, ' ').trim();
const TX_FORM_OF = /^(?:(?:first|second|third)[- ]person|(?:feminine|masculine|neuter)?\s*(?:singular|plural)|plural|feminine|masculine|inflection|alternative (?:form|spelling)|obsolete (?:form|spelling)|(?:present|past|gerund|imperative|infinitive|participle|preterite|imperfect|subjunctive|indicative)\b).*\bof\b/i;
async function txWiktionary(text, from) {
  const tryWord = async w => { const r = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(w)}`); if (r.status === 404) return null; if (!r.ok) throw new Error('wiktionary'); return r.json(); };
  let j = await tryWord(text); if (!j?.[from] && text !== text.toLowerCase()) j = await tryWord(text.toLowerCase());
  const out = [];
  for (const e of j?.[from] || []) for (const d of e.definitions || []) {
    const g = txClean(d.definition); if (!g || TX_FORM_OF.test(g)) continue;
    // "bank (financial institution)" → keep the note; split "to eat; to dine" into separate choices
    for (const part of g.split(/;\s*/)) { const t = part.replace(/\.$/, '').trim(); const ins = t.replace(/\s*\([^)]*\)/g, '').trim() || t;   // "bank (financial institution)": the card gets "bank", the list shows the note
      if (t && t.length <= 80 && !out.some(o => o.ins.toLowerCase() === ins.toLowerCase())) out.push({ t, ins, note: (e.partOfSpeech || '').toLowerCase() }); }
    if (out.length >= 8) break;
  }
  return out.slice(0, 8);
}
async function txMyMemory(text, from, to) {
  const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 450))}&langpair=${from}|${to}`);
  if (!r.ok) throw new Error(r.status === 429 ? 'limit' : 'mymemory');
  const j = await r.json();
  if (+j.responseStatus === 429 || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(j.responseData?.translatedText || '')) throw new Error('limit');
  const seen = new Set(), out = [];
  const add = (t, q) => { t = txClean(t); const k = t.toLowerCase(); if (!t || seen.has(k) || k === text.toLowerCase()) return; seen.add(k); out.push({ t, q }); };
  const ms = (j.matches || []).map(m => ({ t: m.translation, q: +m.quality || 0, m: +m.match || 0 })).sort((a, b) => (b.q > 0) - (a.q > 0) || b.m - a.m || b.q - a.q);
  ms.filter(m => m.q > 0).forEach(m => add(m.t, m.q));
  if (!out.length) add(j.responseData?.translatedText, 0);   // nothing scored: take its best guess
  ms.filter(m => m.q === 0).forEach(m => add(m.t, 0));
  return out.slice(0, 6).map(o => ({ t: o.t, ins: o.t, note: '' }));
}
/* suggestions for text in language `from`, in language `to`: { list: [{t, note}], src } */
async function txSuggest(text, from, to) {
  text = txClean(text); from = txBase(from); to = txBase(to);
  if (!text || !from || !to || from === to) return { list: [], src: '' };
  const key = `${from}|${to}|${text}`; if (txCache.has(key)) return txCache.get(key);
  let res = { list: [], src: '' };
  if (to === 'en' && from !== 'en' && text.split(/\s+/).length <= 3) {
    try { const list = await txWiktionary(text, from); if (list.length) res = { list, src: 'Wiktionary' }; } catch {}
  }
  if (!res.list.length) res = { list: await txMyMemory(text, from, to), src: 'MyMemory' };
  if (res.list.length) txCache.set(key, res);
  return res;
}
const txErrText = e => navigator.onLine === false ? 'You’re offline. Translating needs the internet.' : e?.message === 'limit' ? 'The free translator’s daily limit is used up. Try again tomorrow.' : 'Couldn’t reach the translator. Try again in a moment.';
const txCanDeck = d => !!(d && txBase(d.frontLang) && txBase(d.backLang) && txBase(d.frontLang) !== txBase(d.backLang));

/* ---------- 🌐 in the card editor ---------- */
const txPartner = id => document.getElementById(/f$/.test(id) ? id.replace(/f$/, 'b') : id.replace(/b$/, 'f'));
function txSetField(el, t) {
  if (el.isContentEditable) el.textContent = t; else el.value = t;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
actions.edTranslate = async btn => {
  let src = document.getElementById(btn.dataset.ed), dst = src && txPartner(src.id);
  if (!src || !dst) return;
  const val = el => el.isContentEditable ? readEditor(el.id).text : el.value.trim();
  if (!val(src) && val(dst)) [src, dst] = [dst, src];   // this side is empty: translate the other side into it
  const text = val(src); if (!text) return toast('Type a word first, then press 🌐 to translate it');
  const from = src.getAttribute('lang'), to = dst.getAttribute('lang');
  if (!txBase(from) || !txBase(to) || txBase(from) === txBase(to)) return toast('Set two different languages for this deck to translate');
  closePalette();
  const m = document.createElement('div'); m.className = 'palette ed-menu tr-pop'; m.id = 'palette';
  const head = `<div class="pal-title">${esc(langName(from))} → ${esc(langName(to))}</div>`;
  m.innerHTML = head + '<div class="muted small" style="padding:6px 2px">Translating…</div>';
  (btn.closest('dialog[open]') || document.body).appendChild(m); palShow(m, btn);
  let res; try { res = await txSuggest(text, from, to); } catch (e) { m.innerHTML = head + `<div class="muted small" style="padding:6px 2px">${esc(txErrText(e))}</div>`; palShow(m, btn); return; }
  if (!m.isConnected) return;
  const had = !!val(dst);
  m.innerHTML = head + (res.list.length
    ? `<div class="ed-menu-list">${res.list.map((o, i) => `<button type="button" data-tr="${i}">${esc(o.t)}${o.note ? ` <span class="muted small">${esc(o.note)}</span>` : ''}</button>`).join('')}</div>
       <div class="muted small" style="margin-top:6px">${had ? 'Replaces what’s on the other side. ' : ''}From ${res.src}. Check it before saving.</div>`
    : '<div class="muted small" style="padding:6px 2px">No translation found. Try a simpler word.</div>');
  palShow(m, btn);
  m.addEventListener('click', e => { const b = e.target.closest('[data-tr]'); if (!b) return; txSetField(dst, res.list[+b.dataset.tr].ins); closePalette(); dst.focus?.(); toast('🌐 Translation added'); });
};

/* ---------- 🌐 Translate the selected cards (card list) ---------- */
actions.bulkTranslate = () => {
  const ids = [...(bulkSel || [])], d = deckById(view.deckId); if (!ids.length || !d) return;
  if (!txCanDeck(d)) return toast('Give this deck two different languages (Deck settings) to translate its cards');
  const cards = ids.map(id => S.cards.find(c => c.id === id)).filter(Boolean).slice(0, 150);
  const emptyBacks = cards.filter(c => !c.back?.trim()).length, emptyFronts = cards.filter(c => !c.front?.trim()).length;
  let dir = emptyFronts > emptyBacks ? 'bf' : 'fb', onlyEmpty = true, rows = null, busy = false, stop = false;
  const fromL = () => dir === 'fb' ? d.frontLang : d.backLang, toL = () => dir === 'fb' ? d.backLang : d.frontLang;
  const srcOf = c => (dir === 'fb' ? c.front : c.back) || '', dstOf = c => (dir === 'fb' ? c.back : c.front) || '';
  const todo = () => cards.filter(c => srcOf(c).trim() && (!onlyEmpty || !dstOf(c).trim()));
  const body = () => {
    if (!rows) return `<p style="margin:0 0 10px">Translate <b>${cards.length}</b> selected card${cards.length === 1 ? '' : 's'}${ids.length > cards.length ? ` (the first ${cards.length})` : ''}. You’ll see every translation before anything changes.</p>
      <div class="seg" style="margin-bottom:10px">${[['fb', `Front → Back (${langName(d.frontLang)} → ${langName(d.backLang)})`], ['bf', `Back → Front (${langName(d.backLang)} → ${langName(d.frontLang)})`]].map(([v, l]) => `<label><input type="radio" name="trDir" value="${v}" ${dir === v ? 'checked' : ''}>${esc(l)}</label>`).join('')}</div>
      <label class="check"><input type="checkbox" name="trEmpty" ${onlyEmpty ? 'checked' : ''}><span>Only cards whose ${dir === 'fb' ? 'back' : 'front'} is empty</span></label>
      <p class="muted small" style="margin:10px 0 0" id="trCount">${todo().length} card${todo().length === 1 ? '' : 's'} to translate. The words are sent to Wiktionary or MyMemory (free translators).</p>`;
    return `<div class="tr-prog muted small" id="trProg">${busy ? `Translating… ${rows.filter(r => r.done).length} of ${rows.length}` : `${rows.filter(r => r.list.length).length} of ${rows.length} translated. Untick any you don’t want, or edit them.`}</div>
      <div class="tr-rows">${rows.map((r, i) => `<div class="tr-row"><input type="checkbox" data-tr-on="${i}" ${r.on ? 'checked' : ''} ${r.list.length ? '' : 'disabled'} aria-label="Use this translation">
        <span class="tr-src">${esc(srcOf(r.c))}</span><span class="tr-arrow">→</span>
        ${r.done ? r.list.length ? `<span class="tr-pick"><input class="inp" data-tr-val="${i}" value="${esc(r.val)}" list="trl${i}"><datalist id="trl${i}">${r.list.map(o => `<option value="${esc(o.ins)}">${o.ins !== o.t ? esc(o.t) : ''}</option>`).join('')}</datalist>${dstOf(r.c).trim() ? `<span class="muted small">now: ${esc(dstOf(r.c))}</span>` : ''}</span>` : `<span class="muted small">${esc(r.err || 'Not found')}</span>` : '<span class="muted small">…</span>'}</div>`).join('')}</div>`;
  };
  const redraw = () => { const b = $('#dlg .dlg-body'); if (b) b.innerHTML = body(); const ok = $('#dlg button[type=submit]'); if (ok) { ok.textContent = rows ? busy ? 'Translating…' : `Apply ${rows.filter(r => r.on).length}` : 'Translate'; ok.disabled = busy || (rows ? !rows.some(r => r.on) : !todo().length); } };
  async function run() {
    busy = true; rows = todo().map(c => ({ c, list: [], val: '', on: false, done: false })); redraw();
    for (const r of rows) {
      if (stop) break;
      try { const res = await txSuggest(srcOf(r.c), fromL(), toL()); r.list = res.list; r.val = res.list[0]?.ins || ''; r.on = !!r.val; }
      catch (e) { r.err = txErrText(e); if (e?.message === 'limit') { rows.filter(x => !x.done).forEach(x => { x.done = true; x.err = r.err; }); break; } }
      r.done = true; redraw();
      await new Promise(res => setTimeout(res, 250));   // be gentle with the free services
    }
    busy = false; redraw();
  }
  openDialog({ title: '🌐 Translate cards', ok: 'Translate', wide: true, body: body(),
    onOpen: dlg => {
      dlg.addEventListener('change', e => {
        if (e.target.name === 'trDir') { dir = e.target.value; redraw(); }
        else if (e.target.name === 'trEmpty') { onlyEmpty = e.target.checked; redraw(); }
        else if (e.target.dataset.trOn != null) { rows[+e.target.dataset.trOn].on = e.target.checked; const ok = $('#dlg button[type=submit]'); if (ok) { ok.textContent = `Apply ${rows.filter(r => r.on).length}`; ok.disabled = !rows.some(r => r.on); } }
      });
      dlg.addEventListener('input', e => { const i = e.target.dataset?.trVal; if (i != null) rows[+i].val = e.target.value; });
      dlg.addEventListener('close', () => { stop = true; }, { once: true });
      redraw();
    },
    onOk: () => {
      if (!rows) { run(); return false; }
      if (busy) return false;
      const use = rows.filter(r => r.on && r.val.trim());
      for (const r of use) { const t = r.val.trim(); if (dir === 'fb') { r.c.back = t; delete r.c.backHtml; } else { r.c.front = t; delete r.c.frontHtml; } }
      save(); render(); toast(`🌐 Translated ${use.length} card${use.length === 1 ? '' : 's'}`);
    } });
};
