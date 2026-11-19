'use strict';
let clSearchT = 0;
/* ================= Deck card list: progress bar, sort, filters and frozen cards =================
   A frozen card stays in the deck (and in games) but is skipped by Study and Quick review until it is unfrozen. */
const CL_SORTS = [['next', 'Next review'], ['newest', 'Newest'], ['oldest', 'Oldest'], ['az', 'A-Z'], ['za', 'Z-A']];
const CL_FILTERS = [
  ['level', 'Learning status', [['new', 'Not studied'], ['learning', 'Learning'], ['mastered', 'Mastered']]],
  ['quick', 'Quick review', [['none', 'Not studied'], ['nq', 'Not quite'], ['got', 'Got it']]],
  ['card', 'Card status', [['active', 'Active'], ['frozen', 'Frozen']]],
  ['dup', 'Duplicates', [['exact', 'Exact duplicates'], ['front', 'Same front'], ['back', 'Same back']]],
  ['blank', 'Blank sides', [['front', 'Front is blank'], ['back', 'Back is blank']]],
  ['tr', 'Translations', [['auto', 'Auto-translated'], ['grammar', 'Grammar note instead of a translation']]],
  ['ex', 'Example sentences', [['hasfront', 'Has front sentence'], ['nofront', 'Missing front sentence'], ['hasback', 'Has back translation'], ['noback', 'Missing back translation']]],
];
/* a blank side: no text and no picture */
const clBlank = (c, side) => !String(c[side] || '').replace(/\u00a0/g, ' ').trim() && !/<img\b/i.test(c[side + 'Html'] || '');
const clBlankTag = (c, side) => clBlank(c, side) ? `<span class="blank-tag" title="This side of the card is empty">⚠️ Blank ${side}</span>` : '';
/* empty lines at the end of a card side (trailing <br>, blank <div>s) are dropped in the list; a <br> with text after it is kept */
const clTrimEnd = html => String(html || '').replace(/(?:\s|&nbsp;|<br\s*\/?>|<(div|p)>\s*(?:<br\s*\/?>)?\s*<\/\1>)+$/i, '');
const CHEV = dir => `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="${dir === 'l' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const activeCardsOf = id => S.cards.filter(c => c.deckId === id && !c.frozen);

/* Remembered per deck while the app is open */
const clPrefs = {};
const clPref = id => { const p = (clPrefs[id] ||= { sort: 'newest', f: { level: [], quick: [], card: [], dup: [] } }); p.f.dup ||= []; p.f.ex ||= []; p.f.blank ||= []; p.f.tr ||= []; return p; };
const clFilterCount = p => p.f.level.length + p.f.quick.length + p.f.card.length + (p.f.dup || []).length + (p.f.ex || []).length + (p.f.blank || []).length + (p.f.tr || []).length;

/* ---------- Duplicates: cards in the same deck with the same front (and maybe the same back) ----------
   "exact" = same front AND same back (almost certainly an extra copy); "front" = same front, different back (maybe two meanings). */
const dupKey = t => String(t || '').normalize('NFC').toLowerCase().replace(/\s+/g, ' ').replace(/^[\s¡¿"“'«]+|[\s.!?"”'»]+$/g, '').trim();
const dupCache = { deck: null, map: new Map(), fresh: false };
function dupInfo(deckId) {   // card id -> { kind: 'exact' | 'front', n: how many cards share it }  (worked out once per screen update)
  if (dupCache.fresh && dupCache.deck === deckId) return dupCache.map;
  const cs = cardsOf(deckId);
  const byFront = new Map(), map = new Map();
  for (const c of cs) { const k = dupKey(c.front); if (!k) continue; (byFront.get(k) || byFront.set(k, []).get(k)).push(c); }
  for (const group of byFront.values()) if (group.length > 1) for (const c of group) {
    const same = group.filter(x => dupKey(x.back) === dupKey(c.back));
    map.set(c.id, same.length > 1 ? { kind: 'exact', n: same.length, others: group.length - 1 } : { kind: 'front', n: group.length, others: group.length - 1 });
  }
  const byBack = new Map();   // same back but a different front (two words with one meaning, or a mix-up)
  for (const c of cs) { const k = dupKey(c.back); if (!k) continue; (byBack.get(k) || byBack.set(k, []).get(k)).push(c); }
  for (const group of byBack.values()) if (group.length > 1) for (const c of group) {
    if (!group.some(x => dupKey(x.front) !== dupKey(c.front))) continue;
    const i = map.get(c.id) || { kind: null }; i.back = group.length; map.set(c.id, i);
  }
  Object.assign(dupCache, { deck: deckId, map, fresh: true }); queueMicrotask(() => { dupCache.fresh = false; }); return map;
}
function dupTag(c, info) {
  const i = info.get(c.id); if (!i) return '';
  const backTag = i.back ? `<span class="dup-tag" title="${i.back - 1} other card${i.back === 2 ? ' has' : 's have'} the same back but a different front.">⚠️ Same back ×${i.back}</span>` : '';
  if (!i.kind) return backTag;
  return backTag + (i.kind === 'exact'
    ? `<span class="dup-tag exact" title="This card appears ${i.n} times in this deck with the same front and back.">⚠️ Duplicate ×${i.n}</span>`
    : `<span class="dup-tag" title="${i.others} other card${i.others === 1 ? ' has' : 's have'} the same front but a different back. That might be on purpose (two meanings).">⚠️ Same front ×${i.n}</span>`);
}
function dupBanner(d) {
  const info = dupInfo(d.id); if (!info.size) return '';
  const vals = [...info.values()], exact = vals.filter(i => i.kind === 'exact').length, front = vals.filter(i => i.kind === 'front').length, back = vals.filter(i => i.back).length, p = clPref(d.id), on = (p.f.dup || []).length;
  const parts = [exact ? `<b>${exact}</b> card${exact === 1 ? ' is an exact duplicate' : 's are exact duplicates'}` : '', front ? `<b>${front}</b> share${front === 1 ? 's' : ''} a front with a different back` : '', back ? `<b>${back}</b> share${back === 1 ? 's' : ''} a back with a different front` : ''].filter(Boolean).join(', ').replace(/, ([^,]*)$/, ' and $1');
  return `<div class="banner dup-banner"><span>⚠️ ${parts}.</span>${on ? '<button type="button" class="btn sm" data-act="clReset">Show all cards</button>' : '<button type="button" class="btn sm" data-act="dupShow">Show only duplicates</button>'}</div>`;
}

function clMatches(c, p) {
  const f = p.f;
  if (f.level.length && !f.level.includes(cardLevel(c))) return false;
  if (f.quick.length && !f.quick.includes(c.fr || 'none')) return false;
  if (f.card.length && !f.card.includes(c.frozen ? 'frozen' : 'active')) return false;
  if (f.dup?.length) { const i = dupInfo(c.deckId).get(c.id); if (!i || !f.dup.some(k => k === 'back' ? i.back : i.kind === k)) return false; }
  if (f.tr?.length && !f.tr.some(k => k === 'auto' ? !!c.autoTr : typeof txIsGrammar === 'function' && (txIsGrammar(c.back) || txIsGrammar(c.front)))) return false;
  if (f.blank?.length && !f.blank.some(side => clBlank(c, side))) return false;
  if (f.ex?.length && !f.ex.some(v => (v.endsWith('front') ? clExF(c) : clExB(c)) === v.startsWith('has'))) return false;
  return true;
}
/* Part of speech of a card (the same one its word label shows): the front first, then the back. '' = not known yet */
function clPos(c) {
  if (typeof posGuess !== 'function') return '';
  const d = deckById(c.deckId);
  for (const side of ['front', 'back']) {
    if (!posEligible(c[side])) continue;
    const r = c.pos?.[side], v = posGuess(c[side], posLang(d, side)) || (r && r.t === (c[side] || '') && r.v?.length ? r.v : null);
    if (v) return posGroup(v[0]);
  }
  return '';
}
const clPosOrder = k => { const i = typeof POS_GROUPS !== 'undefined' ? POS_GROUPS.findIndex(g => g[0] === k) : -1; return i < 0 ? 99 : i; };
const clPosName = k => ({ noun: 'Nouns', verb: 'Verbs', adj: 'Adjectives', adv: 'Adverbs', pron: 'Pronouns', det: 'Articles & determiners', prep: 'Prepositions', conj: 'Conjunctions', num: 'Numbers', int: 'Interjections', other: 'Other (phrases…)' })[k] || k;
/* example sentences: front = the sentence on the card (c.example), back = its translation (c.exampleTr) */
const CL_EX = { both: ['Both sentences', c => clExF(c) && clExB(c)], front: ['Front sentence', c => clExF(c)], back: ['Back sentence', c => clExB(c)] };
const clExF = c => !!String(c.example || '').replace(/<[^>]*>/g, '').trim(), clExB = c => !!String(c.exampleTr || '').replace(/<[^>]*>/g, '').trim();
const clExName = s => { const [, k, h] = s.split(':'); return `${h === 'has' ? 'Has' : 'Missing'} ${CL_EX[k]?.[0].toLowerCase() || 'example sentence'} first`; };
const clSortName = s => /^ex:/.test(s) ? clExName(s) : s === 'pos' ? 'Part of speech' : /^pos:/.test(s) ? clPosName(s.slice(4)) + ' first' : CL_SORTS.find(x => x[0] === s)?.[1] || 'Newest';
const clText = c => String(c.front || '').trim().replace(/^[^\p{L}\p{N}]+/u, '');   // "¿Dónde…" sorts under D
function clSort(cs, sort) {
  const coll = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
  const nextKey = c => c.frozen ? 3e15 : c.state === 'new' ? 2e15 + (c.created || 0) : (c.due || 0);
  const fn = {
    next: (a, b) => nextKey(a) - nextKey(b),
    newest: (a, b) => (b.created || 0) - (a.created || 0),
    oldest: (a, b) => (a.created || 0) - (b.created || 0),
    az: (a, b) => coll.compare(clText(a), clText(b)),
    za: (a, b) => coll.compare(clText(b), clText(a)),
  }[sort] || ((a, b) => (b.created || 0) - (a.created || 0));
  if (/^ex:/.test(sort)) {   // "ex:front:has" = cards with a front example sentence first, "ex:back:none" = cards missing the back one first; A-Z inside
    const [, k, h] = sort.split(':'), test = CL_EX[k]?.[1] || CL_EX.both[1], want = h === 'has';
    return cs.sort((a, b) => (test(a) === want ? 0 : 1) - (test(b) === want ? 0 : 1) || coll.compare(clText(a), clText(b)));
  }
  if (sort === 'pos' || /^pos:/.test(sort)) {
    // grouped by part of speech (noun, verb, adjective…), A-Z inside each group; "pos:verb" puts that group first
    const first = sort.slice(4), key = new Map(cs.map(c => { const k = clPos(c); return [c.id, (k === first ? -1 : clPosOrder(k))]; }));
    const bare = c => clText(c).replace(/^(el|la|los|las|un|una|unos|unas|the|a|an|to)\s+/i, '');   // "el caballo" sorts under C
    return cs.sort((a, b) => key.get(a.id) - key.get(b.id) || coll.compare(bare(a), bare(b)));
  }
  return cs.sort(fn);
}
/* The cards shown in the list, after search, filters and sort */
function clShownCards(d, q) {
  const p = clPref(d.id);
  return clSort(cardsOf(d.id).filter(c => (!q || norm([c.front, c.back, c.notes, c.example, c.exampleTr].join(' ')).includes(q)) && clMatches(c, p)), p.sort);
}

function clHeadHtml(d) {
  const all = cardsOf(d.id), k = levelCounts(all), p = clPref(d.id), nf = clFilterCount(p), frozen = all.filter(c => c.frozen).length;
  const sortName = clSortName(p.sort);
  return `<section class="panel cl-head">
    <div class="row-between"><h3 style="margin:0">Cards in deck (${all.length})</h3>
      <button type="button" class="icon-btn" data-act="clHelp" title="What do these mean?">?</button></div>
    ${levelBar(k, true)}
    <div class="cl-legend">
      <span><i class="g"></i><b>${k.mastered}</b> Mastered</span>
      <span><i class="m"></i><b>${k.learning}</b> Learning</span>
      <span><i></i><b>${k.new}</b> Not studied</span>
      ${frozen ? `<span>❄️ <b>${frozen}</b> Frozen</span>` : ''}
    </div>
    <div class="cl-tools">
      <button type="button" class="btn sm" data-act="clSort" title="Sort cards">⇅ ${esc(sortName)}</button>
      <input type="search" class="inp" id="cardSearch" placeholder="Search cards…" value="${esc(view.q || '')}">
      <button type="button" class="btn sm ${nf ? 'primary' : ''}" data-act="clFilter" title="Filter cards">☰ Filters${nf ? ` (${nf})` : ''}</button>
      ${nf ? '<button type="button" class="btn sm ghost" data-act="clReset">Clear filters</button>' : ''}
    </div>
  </section>`;
}
function clRenderHead() {
  const box = $('#cardListHead'), d = deckById(view.deckId); if (!box || !d) return;
  const a = document.activeElement, hadFocus = a?.id === 'cardSearch', pos = hadFocus ? a.selectionStart : 0;
  box.innerHTML = clHeadHtml(d);
  const s = $('#cardSearch');
  s.addEventListener('input', e => { view.q = e.target.value; clearTimeout(clSearchT); clSearchT = setTimeout(renderCardTable, 180); });
  if (hadFocus) { s.focus(); try { s.setSelectionRange(pos, pos); } catch {} }
}

function clSortDialog() {
  const p = clPref(view.deckId);
  openDialog({
    title: 'Sort by', ok: 'Close',
    body: `<div class="cl-opts">${CL_SORTS.map(([v, l]) => `<button type="button" class="cl-opt ${p.sort === v ? 'on' : ''}" data-sort="${v}">${l}${p.sort === v ? '<span class="cl-check">✓</span>' : ''}</button>`).join('')}</div>
      ${typeof POS_GROUPS !== 'undefined' ? (() => {
        const cs = cardsOf(view.deckId), n = {}; for (const c of cs) { const k = clPos(c); n[k] = (n[k] || 0) + 1; }
        const opt = (v, label, count) => `<button type="button" class="cl-opt ${p.sort === v ? 'on' : ''}" data-sort="${v}">${label}${count != null ? `<span class="muted small">${count}</span>` : ''}${p.sort === v ? '<span class="cl-check">✓</span>' : ''}</button>`;
        return `<div class="cl-group"><div class="cl-gname">Part of speech</div>
          <p class="muted small" style="margin:0 0 6px">Groups the cards by the kind of word on them, using the same word labels as 🏷️ Word labels.${n[''] ? ` ${n['']} card${n[''] === 1 ? ' has' : 's have'} no label yet (longer phrases, or words not looked up yet).` : ''}</p>
          <div class="cl-opts">${opt('pos', 'All, grouped by part of speech')}</div>
          <div class="cl-opts cl-opts-pos">${POS_GROUPS.filter(([k]) => n[k]).map(([k, , cls]) => opt('pos:' + k, `<span><span class="pos-tag ${cls}">${esc(clPosName(k).toLowerCase())}</span> first</span>`, n[k])).join('')}</div></div>`;
      })() : ''}
      ${(() => {
        const cs = cardsOf(view.deckId), d = deckById(view.deckId), side = (k, l) => l ? `${k === 'front' ? 'Front' : 'Back'} (${esc(langName(l).replace(/ \(.*\)$/, ''))})` : (k === 'front' ? 'Front' : 'Back');
        const opt = (v, label, count) => `<button type="button" class="cl-opt ${p.sort === v ? 'on' : ''}" data-sort="${v}">${label}<span class="muted small">${count}</span>${p.sort === v ? '<span class="cl-check">✓</span>' : ''}</button>`;
        const row = (k, name) => { const has = cs.filter(CL_EX[k][1]).length; return `<div class="cl-exrow"><div class="small"><b>${name}</b></div><div class="cl-opts">${opt(`ex:${k}:has`, '✅ Has it first', has)}${opt(`ex:${k}:none`, '❌ Missing it first', cs.length - has)}</div></div>`; };
        return `<div class="cl-group"><div class="cl-gname">Example sentences</div>
          <p class="muted small" style="margin:0 0 6px">Check which cards have their example sentence on the front (the sentence itself) and on the back (its translation).</p>
          ${row('front', side('front', d?.frontLang) + ' sentence')}${row('back', side('back', d?.backLang) + ' translation')}${row('both', 'Both')}</div>`;
      })()}`,
    onOpen: dlg => {
      dlg.querySelector('[data-dlg=cancel]').hidden = true;
      dlg.querySelectorAll('[data-sort]').forEach(b => b.onclick = () => { p.sort = b.dataset.sort; dlg.close(); renderCardTable(); });
    },
    onOk: () => {},
  });
}
function clFilterDialog() {
  const p = clPref(view.deckId), draft = JSON.parse(JSON.stringify(p.f)), cs = cardsOf(view.deckId);
  const count = (g, v) => cs.filter(c => clMatches(c, { f: { level: [], quick: [], card: [], [g]: [v] } })).length;
  openDialog({
    title: 'Filter by', ok: 'Apply',
    body: `<p class="muted small" style="margin:0">Pick as many as you like. Inside a group, a card can match any choice. Across groups, it has to match every group.</p>
      ${CL_FILTERS.map(([g, name, opts]) => `<div class="cl-group"><div class="cl-gname">${name}</div><div class="cl-opts">
        ${opts.map(([v, l]) => `<button type="button" class="cl-opt ${draft[g].includes(v) ? 'on' : ''}" data-g="${g}" data-v="${v}" aria-pressed="${draft[g].includes(v)}">${l}<span class="muted small">${count(g, v)}</span></button>`).join('')}
      </div></div>`).join('')}
      <div><button type="button" class="btn sm" id="clResetDraft">Reset</button></div>`,
    onOpen: dlg => {
      const paint = () => dlg.querySelectorAll('[data-g]').forEach(b => { const on = draft[b.dataset.g].includes(b.dataset.v); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      dlg.querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
        const list = draft[b.dataset.g], i = list.indexOf(b.dataset.v);
        if (i >= 0) list.splice(i, 1); else list.push(b.dataset.v);
        paint();
      });
      dlg.querySelector('#clResetDraft').onclick = () => { for (const g in draft) draft[g] = []; paint(); };
    },
    onOk: () => { p.f = draft; renderCardTable(); },
  });
}
function clToggleFreeze(cards, freeze) {
  const undo = cards.map(c => [c, !!c.frozen]);
  for (const c of cards) { if (freeze) c.frozen = true; else delete c.frozen; }
  save(); renderCardTable();
  const msg = `${cards.length} card${cards.length === 1 ? '' : 's'} ${freeze ? 'frozen ❄️ (skipped when you study)' : 'unfrozen'}`;
  const restore = () => { for (const [c, was] of undo) { if (was) c.frozen = true; else delete c.frozen; } save(); renderCardTable(); };
  if (typeof undoToast === 'function') undoToast(msg, restore); else toast(msg);
}

/* ---------- Quick card preview: tap a card in the list, then use ← → (or swipe) to flip through ---------- */
let clPv = null;   // { ids: [...shown card ids], i }
function clPreviewOpen(id) {
  const d = deckById(view.deckId); if (!d) return;
  const ids = clShownCards(d, norm(view.q || '')).map(c => c.id), i = ids.indexOf(id);
  if (i < 0) return;
  clPv = { ids, i, deckId: d.id };
  let el = $('#cardPreview');
  if (!el) {
    el = document.createElement('div'); el.id = 'cardPreview'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
    document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target === el) clPreviewClose(); });
    let sx = null, sy = 0;
    el.addEventListener('touchstart', e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
    el.addEventListener('touchend', e => {
      if (sx == null) return; const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) clPreviewStep(dx < 0 ? 1 : -1);
    });
  }
  document.body.classList.add('pv-open');
  clPreviewRender();
  el.querySelector('.pv-close')?.focus();
}
function clPreviewClose() {
  clPv = null; $('#cardPreview')?.remove(); document.body.classList.remove('pv-open');
  if (view.name === 'deck') renderCardTable();
}
function clPreviewStep(n) {
  if (!clPv) return;
  const j = clPv.i + n; if (j < 0 || j >= clPv.ids.length) return;
  clPv.i = j; clPreviewRender();
}
function clPreviewRender() {
  const el = $('#cardPreview'); if (!el || !clPv) return;
  const d = deckById(clPv.deckId);
  clPv.ids = clPv.ids.filter(id => S.cards.some(c => c.id === id));          // a card may have been deleted
  if (!d || !clPv.ids.length) { clPreviewClose(); return; }
  clPv.i = Math.min(clPv.i, clPv.ids.length - 1);
  const c = S.cards.find(x => x.id === clPv.ids[clPv.i]), n = clPv.ids.length, total = cardsOf(d.id).length;
  const big = (text, lang) => speakBtn(text, lang, true);
  el.innerHTML = `<div class="pv-top">
      <span class="pv-count"><b>${clPv.i + 1}</b>/${n}${n < total ? ` <span class="muted">shown</span>` : ' cards'}</span>
    </div>
    <div class="pv-row">
      <button type="button" class="pv-nav" data-act="clPvPrev" ${clPv.i ? '' : 'disabled'} title="Previous card (←)" aria-label="Previous card">${CHEV('l')}</button>
      <div class="pv-card ${c.frozen ? 'frozen' : ''}">
        <div class="pv-side" lang="${esc(d.frontLang || '')}"><div class="rich">${sideHtml(c, 'front', d)}${typeof posTag === 'function' ? posTag(c, 'front', d) : ''}</div>${big(c.front, d.frontLang)}</div>
        <hr>
        <div class="pv-side" lang="${esc(d.backLang || '')}"><div class="rich">${sideHtml(c, 'back', d)}${typeof posTag === 'function' ? posTag(c, 'back', d) : ''}</div>${big(c.back, d.backLang)}</div>
        ${c.example ? `<div class="pv-extra"><div>“${esc(plainSent(c.example))}”</div>${c.exampleTr ? `<div class="muted">${esc(c.exampleTr)}</div>` : ''}</div>` : ''}
        ${c.notes ? `<div class="pv-extra muted">${esc(c.notes).replace(/\n/g, '<br>')}</div>` : ''}
        <div class="pv-status">${c.frozen ? '<span class="pill frozen">❄️ Frozen</span>' : cardStatus(c)}</div>
      </div>
      <button type="button" class="pv-nav" data-act="clPvNext" ${clPv.i < n - 1 ? '' : 'disabled'} title="Next card (→)" aria-label="Next card">${CHEV('r')}</button>
    </div>
    <div class="pv-bottom">
      <button type="button" class="pv-round pv-close" data-act="clPvClose" title="Close (Esc)" aria-label="Close">✕</button>
      <div class="pv-mid">
        <button type="button" class="pv-round pv-mnav" data-act="clPvPrev" ${clPv.i ? '' : 'disabled'} aria-label="Previous card">${CHEV('l')}</button>
        <button type="button" class="pv-round pv-mnav" data-act="clPvNext" ${clPv.i < n - 1 ? '' : 'disabled'} aria-label="Next card">${CHEV('r')}</button>
      </div>
      <button type="button" class="pv-round ${c.frozen ? 'on' : ''}" data-act="clPvFreeze" title="${c.frozen ? 'Unfreeze' : 'Freeze (skip when studying)'}" aria-label="Freeze">❄️</button>
      <button type="button" class="pv-round" data-act="clPvEdit" title="Edit card (E)" aria-label="Edit card">${ICON.edit}</button>
    </div>`;
}
document.addEventListener('keydown', e => {
  if (!clPv || $('#dlg')?.open) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); clPreviewStep(1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); clPreviewStep(-1); }
  else if (e.key === 'Escape') { e.preventDefault(); clPreviewClose(); }
  else if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); actions.clPvEdit(); }
  else if (e.key.toLowerCase() === 'r') { const b = $('#cardPreview .speak'); b?.click(); }
}, true);

Object.assign(actions, {
  clPreview: (el, e) => { if (e?.target.closest('a,button,input')) return; clPreviewOpen(el.dataset.id); },
  clPvPrev: () => clPreviewStep(-1),
  clPvNext: () => clPreviewStep(1),
  clPvClose: () => clPreviewClose(),
  clPvEdit: () => { const c = clPv && S.cards.find(x => x.id === clPv.ids[clPv.i]); if (c) cardDialog(c, () => clPreviewRender()); },
  clPvFreeze: () => { const c = clPv && S.cards.find(x => x.id === clPv.ids[clPv.i]); if (!c) return; if (c.frozen) delete c.frozen; else c.frozen = true; save(); clPreviewRender(); toast(c.frozen ? 'Card frozen ❄️ (skipped when studying)' : 'Card unfrozen'); },
  clSort: () => clSortDialog(),
  clFilter: () => clFilterDialog(),
  dupShow: () => { const p = clPref(view.deckId); p.f.dup = ['exact', 'front', 'back']; p.sort = 'az'; renderCardTable(); },
  clReset: () => { clPref(view.deckId).f = { level: [], quick: [], card: [] }; renderCardTable(); },
  clFreeze: el => { const c = S.cards.find(x => x.id === el.dataset.id); if (c) clToggleFreeze([c], !c.frozen); },
  bulkFreeze: el => { const cs = S.cards.filter(c => bulkSel.has(c.id)); if (cs.length) clToggleFreeze(cs, el.dataset.on === '1'); },
  clHelp: () => openDialog({
    title: 'Cards in deck', ok: 'Got it',
    body: `<p style="margin:0"><b>🟩 Mastered:</b> you know it well; the next review is ${MASTERED_DAYS}+ days away.</p>
      <p style="margin:0"><b>🟦 Learning:</b> you have studied it, but it still needs practice.</p>
      <p style="margin:0"><b>⬜ Not studied:</b> new cards you haven’t studied yet.</p>
      <p style="margin:0"><b>❄️ Frozen:</b> cards you set aside. Study and Quick review skip them; press ❄️ on a card to unfreeze it.</p>
      <p class="muted small" style="margin:0">The “Quick review” filter uses your answers in ⚡ Quick review (Not quite / Got it).</p>`,
    onOk: () => {},
  }),
});
