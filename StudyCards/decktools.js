'use strict';
/* ================= Deck tools: duplicate, merge and unmerge =================
   Duplicate: a copy of the deck and all its cards (with or without your study progress).
   Merge: move every card of one deck into another. The merged deck is remembered inside the target,
          so it can be split back out later (Unmerge) with its own name, settings, folder and cards.
   Cards moved by a merge keep their study progress. */
const DT_PROGRESS = { state: 'new', due: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0, step: 0 };
const dtSameCard = (a, b) => norm(a.front) === norm(b.front) && norm(a.back) === norm(b.back);
const dtDeckCopy = d => JSON.parse(JSON.stringify(d));

function duplicateDeckDialog(d) {
  if (!d) return;
  const n = cardsOf(d.id).length;
  openDialog({
    title: `Duplicate “${d.name}”`, ok: 'Duplicate',
    body: `<label class="field">Name of the copy<input name="name" maxlength="80" required value="${esc(d.name)} (copy)"></label>
      <label class="check"><input type="radio" name="prog" value="fresh" checked><span><b>Start fresh</b><br><span class="muted small">All ${n} card${n === 1 ? '' : 's'} are new again in the copy.</span></span></label>
      <label class="check"><input type="radio" name="prog" value="keep"><span><b>Keep my study progress</b><br><span class="muted small">The copy remembers what you already know.</span></span></label>
      <p class="muted small" style="margin:0">The original deck isn’t changed. Pictures and sounds are shared, not copied twice.</p>`,
    onOk: f => {
      const name = f.name.value.trim() || `${d.name} (copy)`, keep = f.prog.value === 'keep';
      const copy = { ...dtDeckCopy(d), id: uid(), name, created: Date.now() }; delete copy.merged;
      const cards = cardsOf(d.id).map(c => { const x = { ...dtDeckCopy(c), id: uid(), deckId: copy.id, created: Date.now() }; delete x.mergedFrom; delete x.mergedPath; if (!keep) { Object.assign(x, DT_PROGRESS); delete x.frozen; } return x; });
      S.decks.splice(S.decks.indexOf(d) + 1, 0, copy); S.cards.push(...cards); save();
      toast(`Made “${name}” with ${cards.length} card${cards.length === 1 ? '' : 's'} 📄`); go({ name: 'deck', deckId: copy.id });
    },
  });
}

/* Duplicate cards inside the same deck: each copy goes right after its original and starts as a new card */
function duplicateCards(cards) {
  if (!cards.length) return toast('Select some cards first');
  const made = [];
  for (const c of cards) {
    const x = { ...dtDeckCopy(c), id: uid(), created: Date.now() }; delete x.mergedFrom; delete x.mergedPath; Object.assign(x, DT_PROGRESS); delete x.frozen;
    S.cards.splice(S.cards.indexOf(c) + 1, 0, x); made.push(x.id);
  }
  save(); if (typeof renderCardTable === 'function') renderCardTable(); else render();
  const n = made.length, ids = new Set(made);
  undoToast(n === 1 ? `Card duplicated: “${plainSent(cards[0].front).slice(0, 30)}” 📄` : `Duplicated ${n} cards 📄`, () => { S.cards = S.cards.filter(x => !ids.has(x.id)); save(); render(); toast('Change undone'); });
}

function mergeDeckDialog(target) {
  if (!target) return;
  const others = S.decks.filter(x => x.id !== target.id);
  if (!others.length) { toast('You need at least two decks to merge'); return; }
  openDialog({
    title: `Merge a deck into “${target.name}”`, ok: 'Merge',
    body: `<label class="field">Which deck should be merged in?<select name="from" class="inp">${others.map(x => `<option value="${x.id}">${esc(x.name)} · ${cardsOf(x.id).length} cards</option>`).join('')}</select></label>
      <div class="warn-box" id="mergeInfo"></div>
      <label class="check"><input type="checkbox" name="skipDupes" checked><span>Skip cards that are already in “${esc(target.name)}” (same front and back)</span></label>
      <p class="muted small" style="margin:0">All cards keep their study progress. The other deck disappears from your list, but “${esc(target.name)}” remembers it, so you can <b>unmerge</b> it later from the ⋯ menu.</p>`,
    onOpen: dlg => {
      const sel = dlg.querySelector('[name=from]'), info = dlg.querySelector('#mergeInfo'), mine = cardsOf(target.id);
      const show = () => { const from = deckById(sel.value), cs = cardsOf(from.id), dup = cs.filter(c => mine.some(m => dtSameCard(c, m))).length;
        info.innerHTML = `“${esc(from.name)}” has <b>${cs.length}</b> card${cs.length === 1 ? '' : 's'}${dup ? `, and <b>${dup}</b> ${dup === 1 ? 'is' : 'are'} already in “${esc(target.name)}”` : ''}.`
          + (from.frontLang !== target.frontLang || from.backLang !== target.backLang ? `<br>⚠️ The languages are different (${esc(langName(from.frontLang) || '—')} → ${esc(langName(from.backLang) || '—')}). Merged cards will use “${esc(target.name)}”’s voices.` : ''); };
      sel.addEventListener('change', show); show();
    },
    onOk: f => {
      const from = deckById(f.from.value); if (!from) return;
      const mine = cardsOf(target.id), moving = cardsOf(from.id), skip = f.skipDupes.checked;
      const skipped = skip ? moving.filter(c => mine.some(m => dtSameCard(c, m))) : [], skippedIds = new Set(skipped.map(c => c.id)), at = Date.now();
      for (const c of moving) if (!skippedIds.has(c.id)) { c.deckId = target.id; if (c.mergedFrom) (c.mergedPath ||= []).push(c.mergedFrom); c.mergedFrom = from.id; }
      (target.merged ||= []).push({ deck: dtDeckCopy(from), at, skipped: skipped.map(dtDeckCopy) });
      S.cards = S.cards.filter(c => !skippedIds.has(c.id)); S.decks = S.decks.filter(x => x.id !== from.id); save();
      const moved = moving.length - skipped.length;
      toast(`Merged “${from.name}” into “${target.name}”: ${moved} card${moved === 1 ? '' : 's'} added${skipped.length ? `, ${skipped.length} duplicate${skipped.length === 1 ? '' : 's'} skipped` : ''} 🔗`);
      go({ name: 'deck', deckId: target.id });
    },
  });
}

function unmergeDeckDialog(target) {
  const list = target?.merged || [];
  if (!list.length) { toast('Nothing has been merged into this deck'); return; }
  const count = m => S.cards.filter(c => c.deckId === target.id && c.mergedFrom === m.deck.id).length;
  openDialog({
    title: `Unmerge from “${target.name}”`, ok: 'Unmerge',
    body: `<p class="muted small" style="margin:0 0 8px">Pick the deck to split back out. It comes back with its name, settings and folder, and the cards that came from it return with their progress.</p>
      <div class="stack">${list.map((m, i) => `<label class="check"><input type="radio" name="which" value="${i}" ${i === list.length - 1 ? 'checked' : ''}><span><b>${esc(m.deck.name)}</b><br><span class="muted small">Merged ${esc(new Date(m.at).toLocaleDateString([], { dateStyle: 'medium' }))} · ${count(m)} card${count(m) === 1 ? '' : 's'} to move back${m.skipped?.length ? ` · ${m.skipped.length} skipped duplicate${m.skipped.length === 1 ? '' : 's'} restored` : ''}</span></span></label>`).join('')}</div>
      <p class="muted small" style="margin:8px 0 0">Cards you added to “${esc(target.name)}” after the merge stay where they are.</p>`,
    onOk: f => {
      const i = +f.which.value, m = list[i]; if (!m) return;
      const back = { ...m.deck }; if (S.decks.some(x => x.id === back.id)) back.id = uid();
      if (back.folderId && typeof folderById === 'function' && !folderById(back.folderId)) back.folderId = null;
      const moved = S.cards.filter(c => c.deckId === target.id && c.mergedFrom === m.deck.id);
      for (const c of moved) { c.deckId = back.id; const up = c.mergedPath?.pop(); if (up) c.mergedFrom = up; else { delete c.mergedFrom; delete c.mergedPath; } if (c.mergedPath && !c.mergedPath.length) delete c.mergedPath; }
      const restored = (m.skipped || []).map(c => ({ ...c, deckId: back.id, id: S.cards.some(x => x.id === c.id) ? uid() : c.id }));
      S.cards.push(...restored);
      S.decks.splice(S.decks.indexOf(target) + 1, 0, back); list.splice(i, 1); if (!list.length) delete target.merged; save();
      toast(`“${back.name}” is its own deck again with ${moved.length + restored.length} card${moved.length + restored.length === 1 ? '' : 's'} ✂️`);
      render();
    },
  });
}

Object.assign(actions, {
  duplicateDeck: el => duplicateDeckDialog(deckById(el.dataset.id)),
  duplicateCard: el => { const c = S.cards.find(x => x.id === el.dataset.id); if (c) duplicateCards([c]); },
  bulkDup: () => duplicateCards(cardsOf(view.deckId).filter(c => bulkSel.has(c.id))),
  mergeDeck: el => mergeDeckDialog(deckById(el.dataset.id)),
  unmergeDeck: el => unmergeDeckDialog(deckById(el.dataset.id)),
});

/* ---------- 🏷️ Select cards by their word label, and 📦 make a new deck from just the selected cards ---------- */
function deckSelTools(d) {
  const counts = new Map();
  for (const c of cardsOf(d.id)) { const k = typeof clPos === 'function' ? clPos(c) : ''; if (k) counts.set(k, (counts.get(k) || 0) + 1); }
  const groups = (typeof POS_GROUPS !== 'undefined' ? POS_GROUPS : []).filter(([k]) => counts.has(k));
  const pick = groups.length ? `<select class="inp" id="selByPos" style="margin:0;width:auto;padding:4px 8px;font-size:13px" title="Select every card with this word label">
      <option value="">🏷️ Select by label…</option>${groups.map(([k, name]) => `<option value="${k}">${esc(name)}s (${counts.get(k)})</option>`).join('')}</select>` : '';
  return `${pick}<button type="button" class="btn sm ghost" id="deckFromSelBtn" data-act="deckFromSel" data-id="${d.id}" title="Make a new deck with copies of only the cards you selected">📦 New deck from selected${bulkSel?.size ? ` (${bulkSel.size})` : ''}</button>`;
}
function deckFromSelDialog(d) {
  if (typeof bulkSync === 'function') bulkSync();
  const cards = cardsOf(d.id).filter(c => bulkSel.has(c.id));
  if (!cards.length) return toast('Select some cards first: tick their boxes, or use 🏷️ Select by label');
  const kinds = [...new Set(cards.map(c => typeof clPos === 'function' ? clPos(c) : '').filter(Boolean))];
  const label = kinds.length === 1 ? (POS_GROUPS.find(([k]) => k === kinds[0])?.[1] || kinds[0]) + 's' : 'selected';
  openDialog({
    title: `New deck from ${cards.length} selected card${cards.length === 1 ? '' : 's'}`, ok: 'Make deck',
    body: `<label class="field">Name of the new deck<input name="name" maxlength="80" required value="${esc(`${d.name} · ${label}`)}"></label>
      <label class="check"><input type="radio" name="prog" value="fresh" checked><span><b>Start fresh</b><br><span class="muted small">The cards are new again in the new deck.</span></span></label>
      <label class="check"><input type="radio" name="prog" value="keep"><span><b>Keep my study progress</b><br><span class="muted small">The new deck remembers what you already know.</span></span></label>
      <p class="muted small" style="margin:0">Only the cards you selected are copied. “${esc(d.name)}” isn’t changed.</p>`,
    onOk: f => {
      const name = f.name.value.trim() || `${d.name} · ${label}`, keep = f.prog.value === 'keep';
      const copy = { ...dtDeckCopy(d), id: uid(), name, created: Date.now() }; delete copy.merged;
      const made = cards.map(c => { const x = { ...dtDeckCopy(c), id: uid(), deckId: copy.id, created: Date.now() }; delete x.mergedFrom; delete x.mergedPath; if (!keep) { Object.assign(x, DT_PROGRESS); delete x.frozen; } return x; });
      S.decks.splice(S.decks.indexOf(d) + 1, 0, copy); S.cards.push(...made); bulkSel.clear(); save();
      toast(`Made “${name}” with ${made.length} card${made.length === 1 ? '' : 's'} 📦`); go({ name: 'deck', deckId: copy.id });
    },
  });
}
Object.assign(actions, { deckFromSel: el => deckFromSelDialog(deckById(el.dataset.id || view.deckId)) });
document.addEventListener('change', e => {
  if (e.target.id !== 'selByPos' || view.name !== 'deck') return;
  const k = e.target.value; if (!k) return;
  if (typeof bulkSync === 'function') bulkSync();
  bulkSel.clear(); let n = 0; for (const c of cardsOf(view.deckId)) if (clPos(c) === k) { bulkSel.add(c.id); n++; }
  e.target.value = ''; if (typeof renderCardTable === 'function') renderCardTable(); renderBulkBar();
  toast(`Selected ${n} ${(POS_GROUPS.find(([g]) => g === k)?.[1] || k)}${n === 1 ? '' : 's'}`);
});

/* ================= ⇄ Swap front and back: one card, the selected cards, or a whole deck =================
   One card or a few: only the two sides change places (the deck's languages stay, for cards typed the wrong way round).
   A whole deck: the deck's languages swap too, and so do the example sentence and its translation, so voices and games stay right. */
function swapCardSides(c, withExample) {
  const sw = (a, b) => { const t = c[a]; c[a] = c[b]; c[b] = t; if (c[a] === undefined) delete c[a]; if (c[b] === undefined) delete c[b]; };
  sw('front', 'back'); sw('frontHtml', 'backHtml'); sw('frontRaw', 'backRaw');
  if (c.pos && typeof c.pos === 'object') { const t = c.pos.front; c.pos.front = c.pos.back; c.pos.back = t; }
  if (withExample) sw('example', 'exampleTr');
}
Object.assign(actions, {
  swapCard: el => { const c = S.cards.find(x => x.id === el.dataset.id); if (!c) return; swapCardSides(c, false); save(); if ($('#dlg').open) $('#dlg').close(); cardDialog(c); toast('⇄ Front and back swapped'); },
  bulkSwap: () => { const ids = [...(bulkSel || [])]; if (!ids.length) return; ids.forEach(id => { const c = S.cards.find(x => x.id === id); if (c) swapCardSides(c, false); }); save(); render(); toast(`⇄ Swapped front and back on ${ids.length} card${ids.length === 1 ? '' : 's'}`); },
  swapDeck: el => {
    const d = deckById(el.dataset.id); if (!d) return; const cs = cardsOf(d.id);
    if (!confirm(`Swap the front and back of all ${cs.length} cards in “${d.name}”?\n\nThe deck’s languages swap too (${langName(d.frontLang)} ⇄ ${langName(d.backLang)}). Your study progress is kept. You can swap back the same way.`)) return;
    cs.forEach(c => swapCardSides(c, true)); const t = d.frontLang; d.frontLang = d.backLang; d.backLang = t; save(); render(); toast('⇄ Deck swapped');
  },
});
