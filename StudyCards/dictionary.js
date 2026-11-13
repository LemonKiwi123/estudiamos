'use strict';
/* ================= Dictionary: every word you've studied or collected, in one searchable place ================= */
const langBase = l => (l || '').split('-')[0];
const LEVEL_INFO = {
  new: { name: 'New', cls: 'new' }, learning: { name: 'Learning', cls: 'learn' }, mastered: { name: 'Mastered', cls: 'due' }, collected: { name: 'Collected card', cls: '' },
};
function dictEntries() {
  const out = [];
  for (const c of S.cards) {
    const d = deckById(c.deckId); if (!d) continue;
    out.push({ kind: 'card', key: c.id, word: c.front, meaning: c.back, html: sideHtml(c, 'front', d), mhtml: sideHtml(c, 'back', d), lang: d.frontLang, mlang: d.backLang,
      deck: d, level: cardLevel(c), example: plainSent(c.example), exTr: c.exampleTr, notes: c.notes, reps: c.reps || 0, created: c.created || 0, card: c });
  }
  // word cards collected from packs (merged into a deck entry when the same word is already there)
  if (typeof WORD_CARDS !== 'undefined') for (const [lang, col] of Object.entries(S.packs?.collection || {})) for (const [idStr, copies] of Object.entries(col)) {
    const wc = cardById(+idStr), w = cardWord(wc, lang), L = PACK_LANGS.find(l => l[0] === lang);
    const same = out.find(e => e.kind === 'card' && langBase(e.lang) === lang && norm(e.word) === norm(w.word));
    if (same) { same.collected = { emoji: wc[1], copies }; continue; }
    out.push({ kind: 'collect', key: `w-${lang}-${idStr}`, word: w.word, reading: w.reading, meaning: wc[2], lang: L[2], mlang: 'en-US', emoji: wc[1],
      level: 'collected', collected: { emoji: wc[1], copies }, reps: 0, created: 0, cardId: +idStr });
  }
  return out;
}
function dictFiltered() {
  const f = view.df || {}, q = norm(f.q || ''), status = f.status || 'learned';
  let list = dictEntries().filter(e =>
    (!f.lang || langBase(e.lang) === f.lang) && (!f.deck || e.deck?.id === f.deck) &&
    (status === 'all' || (status === 'learned' ? e.level !== 'new' : e.level === status)) &&
    (!q || norm([e.word, e.reading, e.meaning, e.example, e.exTr, e.notes].filter(Boolean).join(' ')).includes(q)));
  const sort = f.sort || 'az';
  const sk = w => String(w).replace(/^[¿¡"'“«(\s]+/, '');
  if (sort === 'az') list.sort((a, b) => sk(a.word).localeCompare(sk(b.word), langBase(a.lang) || undefined, { sensitivity: 'base' }));
  else if (sort === 'recent') list.sort((a, b) => b.created - a.created);
  else list.sort((a, b) => b.reps - a.reps || a.word.localeCompare(b.word));
  return list;
}
const firstLetter = w => { const ch = [...String(w).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^[¿¡"'“(\s]+/, '')][0] || '#'; return /\p{L}/u.test(ch) ? ch.toLocaleUpperCase() : '#'; };

views.dictionary = () => {
  const all = dictEntries(), f = view.df || {};
  const learned = all.filter(e => e.level !== 'new').length, mastered = all.filter(e => e.level === 'mastered').length;
  const langs = [...new Set(all.map(e => langBase(e.lang)).filter(Boolean))];
  const status = f.status || 'learned';
  return `
    <div class="row-between" style="margin-bottom:12px"><h2>📖 My dictionary</h2>
      <button type="button" class="btn sm" data-act="dictExport">Export as CSV</button></div>
    ${typeof friendTip === 'function' ? friendTip('owl', 'dict', { learned, mastered }) : ''}
    <section class="stats" style="margin-bottom:16px">
      <div class="stat"><div class="n">${learned}</div><div class="l">Words learned</div></div>
      <div class="stat"><div class="n">${mastered}</div><div class="l">Mastered</div></div>
      <div class="stat"><div class="n">${all.length}</div><div class="l">Words in total</div></div>
      <div class="stat"><div class="n">${langs.length}</div><div class="l">Language${langs.length === 1 ? '' : 's'}</div></div>
    </section>
    <section class="panel dict-tools">
      <input type="search" class="inp" id="dictQ" placeholder="Search words, meanings and example sentences…" value="${esc(f.q || '')}" style="margin:0">
      <div class="row">
        <select class="inp" id="dictLang" style="margin:0;width:auto"><option value="">All languages</option>${langs.map(l => `<option value="${l}" ${f.lang === l ? 'selected' : ''}>${esc(langName(l))}</option>`).join('')}</select>
        <select class="inp" id="dictDeck" style="margin:0;width:auto"><option value="">All decks</option>${S.decks.map(d => `<option value="${d.id}" ${f.deck === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select>
        <select class="inp" id="dictSort" style="margin:0;width:auto">${[['az', 'A to Z'], ['recent', 'Recently added'], ['reviews', 'Most reviewed']].map(([v, l]) => `<option value="${v}" ${(f.sort || 'az') === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
      </div>
      <div class="seg" style="margin:0">${[['learned', 'Learned'], ['all', 'All words'], ['learning', 'Learning'], ['mastered', 'Mastered'], ['new', 'Not studied yet'], ['collected', '🎴 Collected cards']].map(([v, l]) => `<label><input type="radio" name="dictStatus" value="${v}" ${status === v ? 'checked' : ''}>${l}</label>`).join('')}</div>
    </section>
    <div id="dictList" style="margin-top:14px"></div>`;
};
function renderDictList() {
  const box = $('#dictList'); if (!box) return;
  const list = dictFiltered(), f = view.df || {}, limit = view.dlimit || 300, az = (f.sort || 'az') === 'az';
  if (!list.length) {
    box.innerHTML = `<div class="empty">${mascotSays(dictEntries().length ? 'No words match. Try another search or filter!' : 'Your dictionary fills up as you study. Learn a few cards and they’ll appear here!', 'happy', 90)}</div>`;
    return;
  }
  const shown = list.slice(0, limit);
  const letters = az ? [...new Set(shown.map(e => firstLetter(e.word)))] : [];
  let html = letters.length > 1 ? `<div class="letter-index">${letters.map(l => `<a data-act="dictJump" data-l="${esc(l)}">${esc(l)}</a>`).join('')}</div>` : '';
  html += `<div class="muted small" style="margin:0 0 8px">${list.length} word${list.length === 1 ? '' : 's'}${list.length > limit ? ` (showing ${limit})` : ''}</div><div class="dict">`;
  let cur = null;
  for (const e of shown) {
    if (az) { const l = firstLetter(e.word); if (l !== cur) { cur = l; html += `<div class="dict-letter" id="dl-${encodeURIComponent(l)}">${esc(l)}</div>`; } }
    const lv = LEVEL_INFO[e.level];
    html += `<div class="dict-entry" ${e.kind === 'card' ? `data-act="dictOpen" data-id="${e.key}"` : `data-act="cardDetail" data-id="${e.cardId}" data-lang="${langBase(e.lang)}"`}>
      <div class="de-head">
        <span class="de-word rich" lang="${esc(e.lang)}">${e.kind === 'card' ? e.html : `${e.emoji} ${esc(e.word)}`}</span>
        ${e.reading ? `<span class="muted small">${esc(e.reading)}</span>` : ''}
        ${speakBtn(e.word, e.lang)}
        <span class="pill ${lv.cls}">${lv.name}</span>
        ${e.collected && e.kind === 'card' ? `<span class="pill" title="Also in your card collection">🎴 ${e.collected.emoji}</span>` : ''}
      </div>
      <div class="de-meaning rich">${e.kind === 'card' ? e.mhtml : esc(e.meaning)}</div>
      ${e.example ? `<div class="de-ex"><span lang="${esc(e.lang)}">“${esc(e.example)}”</span>${e.exTr ? ` <span class="muted">· ${esc(e.exTr)}</span>` : ''}</div>` : ''}
      ${e.notes ? `<div class="muted small">${esc(e.notes)}</div>` : ''}
      <div class="de-meta muted small">${e.deck ? `📚 ${esc(e.deck.name)}` : '🎴 From card packs'}${e.reps ? ` · reviewed ${e.reps} time${e.reps === 1 ? '' : 's'}` : ''}${e.card?.state === 'review' ? (() => { const dd = Math.round((e.card.due - startOfDay(Date.now())) / DAY); return dd <= 0 ? ' · due for review today' : ` · next review in ${fmtDays(dd)}`; })() : ''}</div>
    </div>`;
  }
  html += '</div>';
  if (list.length > limit) html += `<div style="text-align:center;margin-top:12px"><button type="button" class="btn" data-act="dictMore">Show more</button></div>`;
  box.innerHTML = html;
}
function dictExport() {
  const rows = dictFiltered().map(e => [e.word, e.reading || '', e.meaning, langName(langBase(e.lang)), e.deck?.name || 'Card packs', LEVEL_INFO[e.level].name, e.example || '', e.exTr || ''].map(csvCell).join(','));
  rows.unshift(['Word', 'Reading', 'Meaning', 'Language', 'Deck', 'Status', 'Example', 'Example translation'].join(','));
  saveBlob(`estudiar-dictionary-${dateKey()}.csv`, new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv' }));
  toast('Dictionary saved to Downloads');
}
Object.assign(actions, {
  dictionary: () => go({ name: 'dictionary', df: view.df }),
  dictOpen: (el, e) => { if (e.target.closest('button')) return; const c = S.cards.find(x => x.id === el.dataset.id); if (c) cardDialog(c, () => render()); },
  dictJump: el => document.getElementById('dl-' + encodeURIComponent(el.dataset.l))?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
  dictMore: () => { view.dlimit = (view.dlimit || 300) + 300; renderDictList(); },
  dictExport: () => dictExport(),
});
document.addEventListener('input', e => { if (e.target.id === 'dictQ') { (view.df ||= {}).q = e.target.value; view.dlimit = 300; renderDictList(); } });
document.addEventListener('change', e => {
  const map = { dictLang: 'lang', dictDeck: 'deck', dictSort: 'sort' };
  if (map[e.target.id]) { (view.df ||= {})[map[e.target.id]] = e.target.value; renderDictList(); }
  if (e.target.name === 'dictStatus') { (view.df ||= {}).status = e.target.value; renderDictList(); }
});
