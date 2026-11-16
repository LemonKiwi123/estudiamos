'use strict';
/* ================= 📖 Subject dictionaries (glossaries) =================
   Languages keep the word dictionary (dictionary.js). Every other subject gets its own dictionary:
   - words you add yourself (term + meaning + notes), saved in S.settings.glossary[subject]
   - plus every card in that subject's decks, gathered automatically ("from your decks")
   Add any word to a deck in one tap, or make a whole deck from your own words. */
const glAll = k => ((S.settings.glossary ||= {})[k] ||= []);
function glEntries(k) {
  const mine = glAll(k).map(e => ({ ...e, mine: true }));
  const seen = new Set(mine.map(e => norm(e.term)));
  const fromDecks = [];
  for (const d of (typeof subjAllDecks === 'function' ? subjAllDecks() : S.decks).filter(d => deckSubject(d) === k))
    for (const c of cardsOf(d.id)) { const t = String(c.front || '').trim(); if (!t || seen.has(norm(t))) continue; seen.add(norm(t)); fromDecks.push({ id: 'card:' + c.id, term: t, def: String(c.back || '').trim(), note: c.notes || '', deck: d, card: c }); }
  return [...mine, ...fromDecks];
}
function glHtml(k) {
  const f = view.gf || {}, q = norm(f.q || ''), [, e, name] = subjInfo(k);
  let list = glEntries(k);
  if (f.only === 'mine') list = list.filter(x => x.mine); else if (f.only === 'decks') list = list.filter(x => !x.mine);
  if (q) list = list.filter(x => norm(`${x.term} ${x.def} ${x.note}`).includes(q));
  list.sort((a, b) => a.term.localeCompare(b.term, undefined, { sensitivity: 'base', numeric: true }));
  const total = glEntries(k), mineN = total.filter(x => x.mine).length;
  let letter = '';
  const rows = list.map(x => { const L = (x.term.match(/[\p{L}\p{N}]/u)?.[0] || '#').toUpperCase(), head = L !== letter ? `<div class="gl-letter">${esc(letter = L)}</div>` : '';
    return `${head}<div class="gl-row"><div class="gl-main"><b class="gl-term">${esc(x.term)}</b>${x.def ? `<span class="gl-def">${esc(x.def)}</span>` : ''}${x.note ? `<div class="muted small">${esc(x.note)}</div>` : ''}
        <div class="muted small">${x.mine ? '✏️ Added by you' : `📇 From “${esc(x.deck.name)}”`}</div></div>
      <div class="gl-btns">${x.mine ? `<button type="button" class="btn sm" data-gl="toDeck" data-id="${x.id}" title="Add to a deck">＋ Deck</button><button type="button" class="btn sm ghost" data-gl="edit" data-id="${x.id}" title="Edit">✏️</button>`
        : `<button type="button" class="btn sm ghost" data-act="openDeck" data-id="${x.deck.id}" title="Open the deck">Open deck</button>`}</div></div>`; }).join('');
  return `<div class="row-between" style="margin-bottom:6px"><h2 style="margin:0">📖 ${e} ${esc(name)} dictionary</h2>
      <div class="row" style="gap:6px;flex-wrap:wrap"><button type="button" class="btn primary" data-gl="add">＋ Add a word</button>
        ${mineN ? `<button type="button" class="btn" data-gl="deckAll" title="Make flashcards from the words you added">📇 Make a deck</button>` : ''}
        ${total.length ? `<button type="button" class="btn sm" data-gl="export">Export as CSV</button>` : ''}</div></div>
    <p class="muted" style="margin:0 0 12px">Your own ${esc(name)} words with what they mean. Words from your ${esc(name)} decks are added here automatically.</p>
    <section class="stats" style="margin-bottom:14px"><div class="stat"><div class="n">${total.length}</div><div class="l">Words in total</div></div>
      <div class="stat"><div class="n">${mineN}</div><div class="l">Added by you</div></div><div class="stat"><div class="n">${total.length - mineN}</div><div class="l">From your decks</div></div></section>
    <section class="panel dict-tools"><input type="search" class="inp" id="glQ" placeholder="Search words and meanings…" value="${esc(f.q || '')}" style="margin:0">
      <select class="inp" id="glOnly" style="margin:0;width:auto">${[['', 'All words'], ['mine', 'Added by me'], ['decks', 'From my decks']].map(([v, l]) => `<option value="${v}" ${(f.only || '') === v ? 'selected' : ''}>${l}</option>`).join('')}</select></section>
    <div class="gl-list">${rows || `<div class="empty"><p class="muted">${total.length ? 'No words match your search.' : `No ${esc(name)} words yet. Tap <b>＋ Add a word</b>, or make a ${esc(name)} deck and its cards show up here.`}</p></div>`}</div>`;
}
function glWordDialog(k, x) {
  openDialog({
    title: x ? 'Edit word' : `Add a ${subjName(k)} word`, ok: x ? 'Save' : 'Add',
    body: `<label class="field">Word or term<input name="term" required maxlength="160" value="${esc(x?.term || '')}" placeholder="e.g. Photosynthesis"></label>
      <label class="field">What it means<textarea name="def" rows="3" maxlength="1000" placeholder="e.g. How plants use sunlight to make food">${esc(x?.def || '')}</textarea></label>
      <label class="field">Notes <span class="hint muted">(optional)</span><input name="note" maxlength="300" value="${esc(x?.note || '')}"></label>
      ${!x ? `<label class="field">Also add it to a deck <span class="hint muted">(optional)</span><select name="deck">${glDeckOptions(k)}</select></label>` : `<button type="button" class="btn sm danger" id="glDel">🗑️ Delete this word</button>`}`,
    onOpen: dlg => dlg.querySelector('#glDel')?.addEventListener('click', () => { const l = glAll(k), i = l.findIndex(e => e.id === x.id); if (i >= 0) l.splice(i, 1); save(); dlg.close(); render(); }),
    onOk: f => {
      const term = f.term.value.trim(); if (!term) return false;
      if (!x && glEntries(k).some(e => norm(e.term) === norm(term))) { toast('That word is already in this dictionary'); return false; }
      const vals = { term, def: f.def.value.trim(), note: f.note.value.trim() };
      if (x) Object.assign(glAll(k).find(e => e.id === x.id) || {}, vals); else glAll(k).push({ id: uid(), created: Date.now(), ...vals });
      if (!x && f.deck?.value) glToDeck(k, vals, f.deck.value, true);
      save(); render(); if (!x) toast('📖 Word added');
    },
  });
}
const glDeckOptions = k => `<option value="">Don’t add to a deck</option>${S.decks.filter(d => deckSubject(d) === k).map(d => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}<option value="@new">＋ A new ${esc(subjName(k))} deck</option>`;
function glToDeck(k, x, deckId, quiet) {
  let d = deckId === '@new' ? null : deckById(deckId);
  if (!d) { d = { id: uid(), created: Date.now(), name: `${subjName(k)} words`, frontLang: 'en-US', backLang: 'en-US', newPerDay: 20, direction: 'front', subject: k }; S.decks.push(d); }
  if (cardsOf(d.id).some(c => norm(c.front) === norm(x.term))) { if (!quiet) toast(`“${x.term}” is already in “${d.name}”`); return d; }
  S.cards.push({ id: uid(), deckId: d.id, front: x.term, back: x.def || '—', notes: x.note || '', example: '', exampleTr: '', state: 'new', due: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0, step: 0, created: Date.now() });
  save(); if (!quiet) toast(`📇 Added to “${d.name}”`); return d;
}
function glPickDeck(k, x) {
  openDialog({ title: `Add “${x.term}” to a deck`, ok: 'Add', body: `<label class="field">Deck<select name="deck">${glDeckOptions(k).replace('<option value="">Don’t add to a deck</option>', '')}</select></label>`,
    onOk: f => { glToDeck(k, x, f.deck.value); render(); } });
}
function glSubject() { const k = typeof homeSubj === 'function' ? homeSubj() : ''; return k && k !== 'lang' ? k : ''; }
{
  const dict = views.dictionary;
  views.dictionary = function () {
    const k = view.gl || glSubject();
    if (k) return glHtml(k);
    const html = typeof homeSubj === 'function' && homeSubj() === 'lang' ? subjWithDecks(S.decks.filter(d => deckSubject(d) === 'lang'), () => dict.apply(this, arguments)) : dict.apply(this, arguments);
    const others = subjShown().filter(([s]) => s !== 'lang');
    return html + (others.length ? `<section class="panel" style="margin-top:16px"><h3 style="margin-top:0">Other subject dictionaries</h3>
      <div class="row" style="gap:6px;flex-wrap:wrap">${others.map(([s, e, n]) => `<button type="button" class="btn sm" data-gl="open" data-k="${s}">${e} ${esc(n)} <span class="muted">${glEntries(s).length}</span></button>`).join('')}</div></section>` : '');
  };
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-gl]'); if (!b || view.name !== 'dictionary') return;
  const k = view.gl || glSubject(), x = k ? glAll(k).find(w => w.id === b.dataset.id) : null;
  switch (b.dataset.gl) {
    case 'open': return go({ name: 'dictionary', gl: b.dataset.k });
    case 'add': return glWordDialog(k);
    case 'edit': return x && glWordDialog(k, x);
    case 'toDeck': return x && glPickDeck(k, x);
    case 'deckAll': { const mine = glAll(k); if (!mine.length) return; let d = null; for (const w of mine) d = glToDeck(k, w, d?.id || '@new', true); toast(`📇 Your ${mine.length} words are in “${d.name}”`); return go({ name: 'deck', deckId: d.id }); }
    case 'export': { const rows = [['Word', 'Meaning', 'Notes', 'From'], ...glEntries(k).map(x => [x.term, x.def, x.note || '', x.mine ? 'Added by me' : x.deck.name])];
      const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n'), a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = `${subjName(k)} dictionary.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); return; }
  }
});
document.addEventListener('input', e => { if (e.target.id !== 'glQ' || view.name !== 'dictionary') return; view.gf = { ...(view.gf || {}), q: e.target.value }; clearTimeout(glHtml.t); glHtml.t = setTimeout(() => { const pos = e.target.selectionStart; render(); const el = document.getElementById('glQ'); el?.focus(); try { el.setSelectionRange(pos, pos); } catch {} }, 200); });
document.addEventListener('change', e => { if (e.target.id !== 'glOnly' || view.name !== 'dictionary') return; view.gf = { ...(view.gf || {}), only: e.target.value }; render(); });
