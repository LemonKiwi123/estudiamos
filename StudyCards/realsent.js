'use strict';
/* ================= Sentence Builder: 📖 Real sentences =================
   Rebuild real sentences written by people, instead of sentences the game puts together.
   You see the English; the words of the real sentence are shuffled below; put them back in order.
   Sentences come first from your own cards (their example sentences), then from the built-in sets in data/real-<lang>.json:
     - Tatoeba (tatoeba.org), CC BY 2.0 FR: real sentences with translations checked by its community
     - Spanish Short Sentences (Busto-Castiñeira et al., Zenodo record 13936988), CC BY 4.0: only its natural word-order
       sentences; their English is ours.
   Sentences that use your deck's words come up more often. */
const RS_LANGS = { es: 'Spanish', fr: 'French', ja: 'Japanese' };
const RS_DATA = {};   // lang -> { items, lower: Set of words seen in lowercase }
let rs = null;
async function rsLoad(lang) {
  if (RS_DATA[lang]) return RS_DATA[lang];
  const r = await fetch(`data/real-${lang}.json`); if (!r.ok) throw new Error('missing');
  const j = await r.json(), lower = new Set();
  for (const it of j.items) rsTokens(it[1], lang).slice(1).forEach(w => { if (w === w.toLowerCase()) lower.add(w); });
  return (RS_DATA[lang] = { items: j.items, credit: j.credit, lower });
}
/* the words of a sentence, without the opening ¿¡ and the closing . ? ! (those are shown for you) */
function rsTokens(text, lang) {
  if (lang === 'ja') return String(text).replace(/[。．！？!?]+$/, '').split('|').filter(Boolean);
  return String(text).trim().replace(/^[¿¡\s]+/, '').replace(/[\s.!?…»"]+$/, '').split(/\s+/).filter(Boolean);
}
const rsEnd = (text, lang) => lang === 'ja' ? (/[。！？]$/.exec(text)?.[0] || '。') : (/[.!?…]+$/.exec(String(text).trim())?.[0] || '.');
const rsPlain = (text, lang) => lang === 'ja' ? String(text).replace(/\|/g, '') : String(text).trim();
const rsKey = (w, lang) => (lang === 'ja' ? w : w.toLowerCase()).replace(/[^\p{L}\p{N}'’-]/gu, '');
/* your deck's cards that have an example sentence in this language (and its English) */
function rsFromCards(deckId, lang) {
  const d = deckById(deckId), out = [];
  if (langBase(d?.frontLang || '') !== lang || lang === 'ja') return out;   // (Japanese examples have no word breaks)
  for (const c of cardsOf(deckId)) {
    const ex = typeof plainSent === 'function' ? plainSent(c.example || '') : String(c.example || ''), tr = typeof plainSent === 'function' ? plainSent(c.exampleTr || '') : String(c.exampleTr || '');
    const n = rsTokens(ex, lang).length;
    if (ex && tr && n >= 3 && n <= 12) out.push({ id: 'card:' + c.id, text: ex, en: tr, src: c.exampleSrc ? `${c.exampleSrc} (tatoeba.org, CC BY 2.0 FR)` : 'From your card', mine: true });
  }
  return out;
}
async function startRealSentences(deckId, lang) {
  const d = deckById(deckId);
  lang = lang || [langBase(d?.frontLang || ''), langBase(d?.backLang || '')].find(l => RS_LANGS[l]) || 'es';
  rs = { deckId, lang, level: S.settings.rsLevel || 0, score: 0, streak: 0, loading: true, seen: new Set(), err: '' };
  go({ name: 'realsent', deckId });
  try { await rsLoad(lang); } catch { rs.err = 'Couldn’t load the sentences. Check your connection to the Estudiamos PC and try again.'; }
  rs.loading = false; rs.mine = rsFromCards(deckId, lang);
  // words from your deck: sentences that use them come up more often
  rs.pref = new Set(); for (const c of cardsOf(deckId)) for (const side of [c.front, c.back]) for (const w of String(side || '').toLowerCase().split(/[^\p{L}]+/u)) if (w.length > 1) rs.pref.add(w);
  if (!rs.err) rsRound();
  if (view.name === 'realsent') render();
}
function rsPick() {
  const D = RS_DATA[rs.lang], lvl = rs.level, fresh = x => !rs.seen.has(x.id);
  const mine = rs.mine.filter(fresh);
  if (mine.length && Math.random() < 0.5) return mine[Math.floor(Math.random() * mine.length)];
  const pool = D.items.filter(it => (!lvl || it[3] === lvl) && !rs.seen.has(it[0]));
  if (!pool.length) { rs.seen.clear(); return rsPick(); }
  // try a few: prefer one that uses a word from your deck
  let best = null;
  for (let t = 0; t < 40; t++) {
    const it = pool[Math.floor(Math.random() * pool.length)];
    if (!best) best = it;
    if (rs.pref.size && rsTokens(it[1], rs.lang).some(w => rs.pref.has(rsKey(w, rs.lang)) || (rs.lang === 'ja' && [...rs.pref].some(p => p.length > 1 && w.includes(p))))) { best = it; break; }
  }
  return { id: best[0], text: best[1], en: best[2], level: best[3],
    src: String(best[0]).startsWith('z') ? D.credit.zenodo : `Tatoeba #${best[0]} (tatoeba.org, CC BY 2.0 FR)` };
}
function rsRound() {
  const s = rsPick(); rs.seen.add(s.id);
  const words = rsTokens(s.text, rs.lang), D = RS_DATA[rs.lang];
  // don't give away the first word with its capital letter (but keep names like Tom or María)
  const shown = words.map((w, i) => i === 0 && rs.lang !== 'ja' && D.lower.has(w.toLowerCase()) ? w.toLowerCase() : w);
  Object.assign(rs, { s, words, tray: shuffle(shown.map((w, i) => ({ id: i, w, used: false }))), line: [], done: false, fails: 0, bad: -1, hint: -1, msg: null, gap: null });
  if (rs.tray.every((c, i) => c.w === shown[i]) && rs.tray.length > 1) rs.tray.push(rs.tray.shift());   // never already in order
}
function rsCheck() {
  const got = rs.line.map(id => rs.tray.find(t => t.id === id).w), want = rs.words;
  const bad = want.findIndex((w, i) => rsKey(w, rs.lang) !== rsKey(got[i] || '', rs.lang));
  if (bad < 0 && got.length === want.length) {
    rs.done = true; rs.score++; rs.streak++; rs.bad = -1;
    const pts = rs.fails ? 2 : 3; if (typeof addPoints === 'function') addPoints(pts);
    rs.msg = `🎉 Right! +${pts} points`;
    const d = deckById(rs.deckId), voice = langBase(d?.frontLang || '') === rs.lang ? d.frontLang : ({ es: 'es-ES', fr: 'fr-FR', ja: 'ja-JP' })[rs.lang];
    if (typeof speak === 'function') speak(rsPlain(rs.s.text, rs.lang), voice);
    if (typeof gtRemember === 'function') gtRemember(rs.lang, rs.s.en, rsPlain(rs.s.text, rs.lang), rs.s.src);
  } else {
    rs.fails++; rs.streak = 0; rs.bad = bad < 0 ? got.length : bad;
    rs.msg = got.length < want.length && bad < 0 ? `So far so good. ${want.length - got.length} more word${want.length - got.length > 1 ? 's' : ''} to go.` : `✋ Not quite: the word in spot ${rs.bad + 1} isn’t right yet.${rs.fails >= 2 ? ' Tap 💡 Hint for help.' : ''}`;
  }
  render();
}
views.realsent = () => {
  if (!rs) { view = { name: 'home' }; return views.home(); }
  const top = `<div class="study-top"><button type="button" class="btn ghost" data-act="games" data-id="${rs.deckId}">← Games</button>
      <div style="flex:1"><b>🧩 Sentence Builder</b> <span class="muted small">· 📖 Real ${esc(RS_LANGS[rs.lang])} sentences</span></div>
      <span class="muted small">✅ ${rs.score}${rs.streak > 1 ? ` · 🔥 ${rs.streak} in a row` : ''}</span></div>
    ${bldModeTabs('real')}`;
  if (rs.loading) return top + '<div class="flash"><p class="muted">Loading sentences…</p></div>';
  if (rs.err) return top + `<div class="flash"><p>${esc(rs.err)}</p></div>`;
  const chip = (c, where, i) => `<button type="button" class="bld-chip${where === 'line' && i === rs.bad ? ' bad' : ''}${where === 'tray' && rs.hint === c.id ? ' hint' : ''}" data-act="${where === 'line' ? 'rsRemove' : 'rsPick'}" data-id="${c.id}" ${rs.done ? 'disabled' : ''} lang="${rs.lang}"><span class="w">${esc(c.w)}</span></button>`;
  const line = rs.line.map(id => rs.tray.find(t => t.id === id));
  const ja = rs.lang === 'ja', s = rs.s;
  return top + `
    <div class="flash bld-board" style="min-height:0">
      <div class="muted small">Put the words in order to say this in ${esc(RS_LANGS[rs.lang])}:</div>
      <div class="rs-en">“${esc(s.en)}”${s.mine ? ' <span class="pill">from your card</span>' : ''}</div>
      <div class="bld-line ${rs.done ? 'done' : ''}" aria-label="Your sentence">${line.length ? line.map((c, i) => (rs.gap === i ? '<span class="bld-gap" aria-label="empty spot"></span>' : '') + chip(c, 'line', i)).join('') + `<span class="rs-end">${esc(rsEnd(s.text, rs.lang))}</span>` : '<span class="muted">Your sentence goes here…</span>'}</div>
      ${rs.msg ? `<div class="bld-msg ${rs.done ? 'ok' : 'no'}">${rs.msg}${rs.done ? `<br><b lang="${rs.lang}">${esc(rsPlain(s.text, rs.lang))}</b>` : ''}</div>` : ''}
      ${rs.showAns && !rs.done ? `<div class="bld-msg ex">💡 The sentence: <b lang="${rs.lang}">${esc(rsPlain(s.text, rs.lang))}</b></div>` : ''}
      <div class="muted small rs-src">Sentence: ${esc(s.src)}</div>
    </div>
    <div class="bld-tray">${rs.tray.filter(c => !c.used).map(c => chip(c, 'tray')).join('') || '<span class="muted small">All the words are in your sentence.</span>'}</div>
    <div class="bld-actions">
      ${rs.done ? `<button type="button" class="btn" data-act="rsSay">🔊 Hear it again</button><button type="button" class="btn primary big" data-act="rsNext">Next sentence ▶</button>` : `
      <button type="button" class="btn" data-act="rsUndo" ${line.length ? '' : 'disabled'}>↩️ Undo</button>
      <button type="button" class="btn" data-act="rsClear" ${line.length ? '' : 'disabled'}>🧹 Clear</button>
      <button type="button" class="btn" data-act="rsHint">💡 Hint</button>
      <button type="button" class="btn" data-act="rsSkip">⏭️ Skip</button>
      <button type="button" class="btn primary big" data-act="rsCheck" ${line.length ? '' : 'disabled'}>✅ Check</button>`}
    </div>
    <div class="row" style="justify-content:center;gap:8px;margin-top:10px;flex-wrap:wrap">
      <select class="inp" id="rsLevel" style="margin:0;width:auto">${[[0, 'Any length'], [1, '⭐ Easier'], [2, '⭐⭐ Medium'], [3, '⭐⭐⭐ Harder']].map(([v, l]) => `<option value="${v}" ${v === rs.level ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <select class="inp" id="rsLang" style="margin:0;width:auto">${Object.entries(RS_LANGS).map(([k, n]) => `<option value="${k}" ${k === rs.lang ? 'selected' : ''}>${n} sentences</option>`).join('')}</select>
    </div>
    ${bldReportBtn(rs.lang)}
    <p class="muted small" style="text-align:center;margin-top:14px">Real sentences from <a href="https://tatoeba.org" target="_blank" rel="noopener">Tatoeba</a> (CC BY 2.0 FR)${rs.lang === 'es' ? ' and the <a href="https://zenodo.org/records/13936988" target="_blank" rel="noopener">Spanish Short Sentences</a> set (CC BY 4.0)' : ''}, plus your own cards’ example sentences.${ja ? ' Japanese word breaks come from Tatoeba’s word index.' : ''}</p>`;
};
Object.assign(actions, {
  rsPick: el => { const c = rs.tray.find(t => t.id === +el.dataset.id); if (!c || c.used || rs.done) return; c.used = true;
    if (rs.gap != null && rs.gap <= rs.line.length) rs.line.splice(rs.gap, 0, c.id); else rs.line.push(c.id);
    rs.gap = null; rs.msg = null; rs.bad = -1; rs.hint = -1;
    if (rs.line.length === rs.words.length) return rsCheck();   // all the words are in: check right away
    render(); },
  rsRemove: el => { if (rs.done) return; const id = +el.dataset.id, at = rs.line.indexOf(id); rs.line = rs.line.filter(x => x !== id); const c = rs.tray.find(t => t.id === id); if (c) c.used = false;
    rs.gap = at < rs.line.length ? at : null; rs.msg = null; rs.bad = -1; render(); },
  rsUndo: () => { const id = rs.line.pop(); const c = rs.tray.find(t => t.id === id); if (c) c.used = false; rs.gap = null; rs.msg = null; rs.bad = -1; render(); },
  rsClear: () => { rs.line = []; rs.tray.forEach(c => { c.used = false; }); rs.gap = null; rs.msg = null; rs.bad = -1; render(); },
  rsCheck: () => rsCheck(),
  rsHint: () => {
    // keep the right start of your sentence, then light up the next word
    const got = rs.line.map(id => rs.tray.find(t => t.id === id));
    let ok = 0; while (ok < got.length && rsKey(got[ok].w, rs.lang) === rsKey(rs.words[ok], rs.lang)) ok++;
    for (const c of got.slice(ok)) c.used = false; rs.line = rs.line.slice(0, ok); rs.gap = null;
    const want = rsKey(rs.words[ok] || '', rs.lang), c = rs.tray.find(t => !t.used && rsKey(t.w, rs.lang) === want);
    rs.hint = c ? c.id : -1; rs.fails = Math.max(rs.fails, 1);
    if (rs.fails >= 3) rs.showAns = true;
    rs.msg = c ? `💡 Next comes “${esc(c.w)}”.` : null; rs.fails++; render(); },
  rsSkip: () => { rs.streak = 0; rs.showAns = false; rsRound(); render(); },
  rsNext: () => { rs.showAns = false; rsRound(); render(); },
  rsSay: () => { const d = deckById(rs.deckId); if (typeof speak === 'function') speak(rsPlain(rs.s.text, rs.lang), langBase(d?.frontLang || '') === rs.lang ? d.frontLang : ({ es: 'es-ES', fr: 'fr-FR', ja: 'ja-JP' })[rs.lang]); },
  bldModeReal: () => { const lang = RS_LANGS[bld?.lang] ? bld.lang : null; startRealSentences(bld?.deckId ?? rs?.deckId, lang); },
  bldModeBuild: () => { const id = rs?.deckId ?? bld?.deckId; if (bld && bld.deckId === id) { if (RS_LANGS[rs?.lang] && BLD_LANGS[rs.lang] && bld.lang !== rs.lang) { bld.lang = rs.lang; bldRound(); } go({ name: 'builder', deckId: id }); } else startBuilder(id); },
});
document.addEventListener('change', e => {
  if (view.name !== 'realsent' || !rs) return;
  if (e.target.id === 'rsLevel') { rs.level = S.settings.rsLevel = +e.target.value; save(); rs.seen.clear(); rsRound(); render(); }
  if (e.target.id === 'rsLang') startRealSentences(rs.deckId, e.target.value);
});
/* the two ways to play, at the top of the Sentence Builder */
function bldModeTabs(cur) {
  return `<div class="rs-tabs" role="tablist"><button type="button" role="tab" class="btn sm ${cur === 'build' ? 'primary' : ''}" aria-selected="${cur === 'build'}" data-act="bldModeBuild">🧩 Build your own</button>
    <button type="button" role="tab" class="btn sm ${cur === 'real' ? 'primary' : ''}" aria-selected="${cur === 'real'}" data-act="bldModeReal">📖 Real sentences</button></div>`;
}
/* 🌐 report a translation problem (the sentences you finished most recently are listed) */
function bldReportBtn(lang) {
  if (!RS_LANGS[lang] || typeof gtReportDialog !== 'function') return '';
  return `<div class="gt-report"><button type="button" class="btn sm" data-act="gtReport" data-lang="${lang}" data-game="Sentence Builder">🌐 Report a translation problem</button>
    <span class="muted small">A sentence or its English that looks wrong? Tell us.</span></div>`;
}
