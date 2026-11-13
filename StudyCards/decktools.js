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
