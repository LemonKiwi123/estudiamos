'use strict';
/* ================= Quick review (like Noji's Fast Review) =================
   Every card in the deck, answered "Not quite" or "Got it". Cards marked "Not quite" come back in
   further rounds until every card is "Got it". Progress is saved per card (card.fr) and does not
   change the spaced-repetition schedule. */
let qr = null;
/* Quick review can use the deck card list's filters and sort (cardlist.js): "only the cards my filters show" and "in my sort order". Saved per deck. */
const qrOpt = deckId => ((S.settings.qrOpt ||= {})[deckId] ||= { filter: false, sort: false });
const qrUseFilter = deckId => qrOpt(deckId).filter && typeof clPref === 'function' && clFilterCount(clPref(deckId)) > 0;
const qrUseSort = deckId => qrOpt(deckId).sort && typeof clPref === 'function';
/* “Selected cards only” (the card list's filter): Quick review goes through just those cards. A review that has started keeps
   the cards it started with (qr.sel), whatever is ticked later. */
function qrSel(deckId) {
  if (!/^quick/.test(view.name)) return null;
  if (qr && qr.deckId === deckId && view.name !== 'quickStart') return qr.sel || null;
  if (typeof clPref !== 'function') return null;
  const p = clPref(deckId); return p.f.sel.length ? new Set(cardsOf(deckId).filter(c => clMatches(c, p)).map(c => c.id)) : null;
}
function qrPool(deckId) { const cs = activeCardsOf(deckId), sel = qrSel(deckId); if (sel) return cs.filter(c => sel.has(c.id)); if (!qrUseFilter(deckId)) return cs; const p = clPref(deckId); return cs.filter(c => clMatches(c, p)); }
const qrOrder = (deckId, cs) => qrUseSort(deckId) ? clSort(cs.slice(), clPref(deckId).sort) : shuffle(cs);
function qrCounts(deckId) {
  const cs = qrPool(deckId);
  return { total: cs.length, got: cs.filter(c => c.fr === 'got').length, nq: cs.filter(c => c.fr === 'nq').length, ns: cs.filter(c => !c.fr).length };
}
function qrBar(k) {
  const t = Math.max(1, k.total), pc = n => (n / t * 100).toFixed(2) + '%';
  return `<div class="seg-bar qr-seg" title="${k.got} got it · ${k.nq} not quite · ${k.ns} not studied"><div class="g" style="width:${pc(k.got)}"></div><div class="n" style="width:${pc(k.nq)}"></div></div>`;
}
function startQuick(deckId, reset, all) {   // all: also the cards already marked Got it
  const sel = qrSel(deckId);
  if (reset) { (sel || qrUseFilter(deckId) ? qrPool(deckId) : cardsOf(deckId)).forEach(c => { delete c.fr; }); save(); }   // with filters on, Start over only resets the filtered cards
  const cs = qrPool(deckId), notStudied = cs.filter(c => !c.fr), notQuite = cs.filter(c => c.fr === 'nq');
  const ids = (all ? qrOrder(deckId, cs) : [...qrOrder(deckId, notStudied), ...qrOrder(deckId, notQuite)]).map(c => c.id);
  if (!ids.length) { go({ name: 'quickDone', deckId }); return; }
  qr = { deckId, sel, queue: ids, i: 0, revealed: false, round: 1, roundEnd: false, history: [], rounds: 1, start: Date.now(), missed: new Set(), seen: new Set(ids) };
  go({ name: 'quick', deckId }); speakQuick();
}
const qrCard = () => qr && S.cards.find(c => c.id === qr.queue[qr.i]);
function qrSides() {
  const d = deckById(qr.deckId), c = qrCard(), rev = d.direction === 'back', tag = side => typeof posTag === 'function' ? posTag(c, side, d) : '';
  const fh = sideHtml(c, 'front', d) + tag('front'), bh = sideHtml(c, 'back', d) + tag('back');
  return rev ? { q: c.back, a: c.front, qh: bh, ah: fh, ql: d.backLang, al: d.frontLang } : { q: c.front, a: c.back, qh: fh, ah: bh, ql: d.frontLang, al: d.backLang };
}
function speakQuick(force) {
  if (!qr || qr.roundEnd || !qrCard() || (!autoplayOn() && !force)) return;
  const s = qrSides(); qr.revealed ? speak(s.a, s.al) : speak(s.q, s.ql);
}
function qrFlip() { if (!qr || qr.roundEnd || !qrCard()) return; qr.revealed = !qr.revealed; render(); if (qr.revealed) speakQuick(); }
function qrAnswer(got) {
  const c = qrCard(); if (!c || qr.roundEnd) return;
  qr.history.push({ id: c.id, prev: c.fr, i: qr.i, round: qr.round, queue: qr.queue });
  const lg = todayLog(); lg.practice = (lg.practice || 0) + 1;   // counts toward the daily goal
  if (typeof addPoints === 'function') addPoints(1);
  c.fr = got ? 'got' : 'nq'; save();
  if (!got) qr.missed.add(c.id);
  if (qr.history.length % 10 === 0) friendToast('rabbit', 'cheer', { n: qr.history.length });
  qr.i++; qr.revealed = false;
  while (qr.i < qr.queue.length && !qrCard()) qr.i++;           // skip cards deleted meanwhile
  if (qr.i >= qr.queue.length) {
    if (!qrPool(qr.deckId).some(x => x.fr === 'nq')) { qr.finished = Date.now(); recordQuick(); go({ name: 'quickDone', deckId: qr.deckId }); return; }
    qr.roundEnd = true; render(); return;
  }
  render(); speakQuick();
}
function qrNextRound() {
  if (!qr) return;
  qr.queue = qrOrder(qr.deckId, qrPool(qr.deckId).filter(x => x.fr === 'nq')).map(x => x.id);
  qr.i = 0; qr.round++; qr.rounds = qr.round; qr.roundEnd = false; qr.revealed = false;
  render(); speakQuick();
}
function qrUndo() {
  const h = qr?.history.pop(); if (!h) return;
  const c = S.cards.find(x => x.id === h.id);
  if (c) { if (h.prev) c.fr = h.prev; else delete c.fr; }
  Object.assign(qr, { queue: h.queue, i: h.i, round: h.round, roundEnd: false, revealed: false });
  save();
  if (view.name !== 'quick') go({ name: 'quick', deckId: qr.deckId }); else render();
  toast('Undone');
}

function qrOptsHtml(d) {   // only shown when the card list has filters or a sort picked
  const p = typeof clPref === 'function' ? clPref(d.id) : null; if (!p) return '';
  const nf = clFilterCount(p), o = qrOpt(d.id), sortName = clSortName(p.sort), hasSort = p.sort && p.sort !== 'newest';
  if (!nf && !hasSort && !o.sort) return `<p class="muted small" style="margin:0">Tip: pick a sort or filters in the deck’s card list (Edit cards →) to quick review just those cards, in that order.</p>`;
  const n = activeCardsOf(d.id).filter(c => clMatches(c, p)).length, sel = qrSel(d.id), ice = sel ? sel.size - n : 0;
  return `<div class="qr-opts">
    ${sel ? `<div class="row-between" style="gap:8px"><span>☑ Only your <b>${n}</b> selected card${n === 1 ? '' : 's'}${ice ? ` <span class="muted small">(${ice} frozen card${ice === 1 ? ' is' : 's are'} skipped)</span>` : ''}</span>
      <button type="button" class="btn sm" data-act="qrSelOff" data-id="${d.id}" title="Turn off the “Selected cards only” filter">Use all cards</button></div>` : nf ? `<label class="check"><input type="checkbox" data-qro="filter" data-id="${d.id}" ${o.filter ? 'checked' : ''}><span>Only the cards my filters show <span class="muted small">(${nf} filter${nf === 1 ? '' : 's'} · ${n} card${n === 1 ? '' : 's'})</span></span></label>` : ''}
    <label class="check"><input type="checkbox" data-qro="sort" data-id="${d.id}" ${o.sort ? 'checked' : ''}><span>In my sort order <span class="muted small">(⇅ ${esc(sortName)})</span> instead of shuffled</span></label></div>`;
}
views.quickStart = () => {
  const d = deckById(view.deckId); if (!d) { view = { name: 'home' }; return views.home(); }
  const k = qrCounts(d.id), started = k.got + k.nq > 0, sel = qrSel(d.id), allGot = k.total > 0 && k.got === k.total;
  return `
    <div class="crumbs"><a data-act="home">Decks</a> / <a data-act="openDeck" data-id="${d.id}">${esc(d.name)}</a> / Quick review</div>
    <div class="flash" style="min-height:0;gap:14px">
      <div style="font-size:40px">⚡</div>
      <div class="word sm">Quick review</div>
      <p class="muted" style="margin:0;max-width:520px">Go through every card and answer <b>Not quite</b> or <b>Got it</b>.
        Cards you don’t know yet come back in new rounds until you’ve got them all. Quick review doesn’t change your study schedule.</p>
      ${friendTip('rabbit', 'quick', null, { compact: true })}
      <div style="width:100%;max-width:460px">${qrBar(k)}
        <div class="row" style="justify-content:space-between;margin-top:8px;font-size:13px">
          <span style="color:var(--qr-got)">● Got it ${k.got}</span><span style="color:var(--qr-nq-text)"><span class="qr-nq-dot">●</span> Not quite ${k.nq}</span><span class="muted">● Not studied ${k.ns}</span></div></div>
      ${qrOptsHtml(d)}
      <div class="row" style="justify-content:center">
        ${!k.total ? `<span class="muted">${sel ? 'All your selected cards are frozen, so there is nothing to review.' : qrUseFilter(d.id) ? 'No cards match your filters.' : 'This deck has no cards yet.'}</span>`
          : sel ? `<button type="button" class="btn primary big" data-act="qrStart" data-id="${d.id}" data-all="1">Start (${k.total} card${k.total === 1 ? '' : 's'})</button>
                   ${started && !allGot ? `<button type="button" class="btn" data-act="qrStart" data-id="${d.id}">Continue (${k.ns + k.nq} left)</button>` : ''}`
          : allGot ? `<span class="muted">Every card is marked Got it 🎉</span><button type="button" class="btn primary big" data-act="qrStart" data-id="${d.id}" data-reset="1">Review all again</button>`
          : started ? `<button type="button" class="btn primary big" data-act="qrStart" data-id="${d.id}">Continue (${k.ns + k.nq} left)</button>
                       <button type="button" class="btn" data-act="qrStart" data-id="${d.id}" data-reset="1">Start over</button>`
          : `<button type="button" class="btn primary big" data-act="qrStart" data-id="${d.id}">Start (${k.total} cards)</button>`}
      </div>
    </div>`;
};

views.quick = () => {
  const d = deckById(qr?.deckId); if (!d) { view = { name: 'home' }; return views.home(); }
  const k = qrCounts(d.id);
  const top = `<div class="study-top">
      <button type="button" class="btn ghost" data-act="quickStart" data-id="${d.id}">← Back</button>
      <div style="flex:1;max-width:420px">${qrBar(k)}</div>
      <div class="row" style="gap:6px"><span class="muted small" style="font-variant-numeric:tabular-nums">Round ${qr.round} · ${Math.min(qr.i + 1, qr.queue.length)}/${qr.queue.length}</span>
        <button type="button" class="icon-btn qr-tts ${autoplayOn(d) ? 'on' : ''}" data-act="qrTts" title="Read cards aloud automatically: ${autoplayOn(d) ? 'on' : 'off'} (A)" aria-pressed="${autoplayOn(d)}">${autoplayOn(d) ? '🔊' : '🔇'}</button>
        <button type="button" class="icon-btn" data-act="qrUndo" title="Undo (Ctrl+Z)" ${qr.history.length ? '' : 'disabled'}>${ICON.undo}</button>
        ${!qr.roundEnd && qrCard() ? `<button type="button" class="icon-btn" data-act="qrEdit" title="Edit this card (E)">${ICON.edit}</button>` : ''}</div>
    </div>`;
  if (qr.roundEnd) {
    const left = qrPool(d.id).filter(x => x.fr === 'nq');
    return `${top}<div class="flash" style="min-height:0">
      <div style="font-size:36px">💪</div>
      <div class="word sm">Round ${qr.round} done</div>
      <p class="muted" style="margin:0">${k.got} of ${k.total} cards are marked Got it. ${left.length} still to learn.</p>
      <button type="button" class="btn primary big" data-act="qrNext">Continue with ${left.length} card${left.length === 1 ? '' : 's'} <kbd style="background:transparent;color:inherit;border-color:currentColor;opacity:.7">Enter</kbd></button>
    </div>
    <div class="panel" style="margin-top:16px"><h3>Still learning</h3><div class="missed">
      ${left.map(c => `<div class="item"><div class="cell rich">${speakBtn(c.front, d.frontLang)}${sideHtml(c, 'front', d)}</div><div class="muted rich">${sideHtml(c, 'back', d)}</div></div>`).join('')}</div></div>`;
  }
  const c = qrCard(); if (!c) { qr.roundEnd = true; return views.quick(); }
  const s = qrSides(), long = t => t.length > 40;
  return `${top}
    <div class="flash" data-act="qrFlip" style="cursor:pointer" title="Click to flip (Space)">
      <span class="pill ${c.fr === 'nq' ? 'learn qr-nq-pill' : ''}">${c.fr === 'nq' ? 'Not quite last time' : 'New in this review'}</span>
      <div class="side"><div class="word${long(s.q) ? ' sm' : ''}">${s.qh}</div>${speakBtn(s.q, s.ql, true)}</div>
      ${qr.revealed ? `<hr><div class="side"><div class="word${long(s.a) ? ' sm' : ''}">${s.ah}</div>${speakBtn(s.a, s.al, true)}</div>
        ${c.example ? `<div class="notes">“${esc(plainSent(c.example))}”${c.exampleTr ? `<br><span class="small">${esc(c.exampleTr)}</span>` : ''}</div>` : ''}
        ${c.notes ? `<div class="notes">${esc(c.notes)}</div>` : ''}` : '<div class="muted small">Click the card or press Space to see the answer</div>'}
    </div>
    <div class="answer-bar qr-bar">
      <button type="button" class="btn big qr-nq" data-act="qrAns" data-got="0">✗ Not quite <kbd style="background:transparent;color:inherit;border-color:currentColor;opacity:.7">1</kbd></button>
      <button type="button" class="btn big qr-got" data-act="qrAns" data-got="1">✓ Got it <kbd style="background:transparent;color:inherit;border-color:currentColor;opacity:.7">2</kbd></button>
    </div>
    <div class="shortcuts">Keys: Space flip · 1 or ← Not quite · 2 or → Got it · R replay · A read aloud on/off · E edit · Ctrl+Z undo</div>`;
};

views.quickDone = () => {
  const d = deckById(view.deckId); if (!d) { view = { name: 'home' }; return views.home(); }
  const k = qrCounts(d.id), mins = qr && qr.deckId === d.id && qr.finished ? Math.max(1, Math.round((qr.finished - qr.start) / 60000)) : null;
  return `
    <div class="crumbs"><a data-act="home">Decks</a> / <a data-act="openDeck" data-id="${d.id}">${esc(d.name)}</a> / Quick review</div>
    <div class="flash" style="min-height:0">
      ${mascot(120, 'party')}
      <div class="word sm">You’ve got all ${k.total} cards!</div>
      ${friendTip('rabbit', 'done', null, { compact: true })}
      <p class="muted" style="margin:0">${qr && qr.deckId === d.id ? `Finished in ${qr.rounds} round${qr.rounds === 1 ? '' : 's'}${mins ? ` · about ${mins} min` : ''}.` : 'Every card in this deck is marked Got it.'}</p>
      ${qrBar(k)}
      <div class="row" style="justify-content:center;margin-top:8px">
        <button type="button" class="btn primary" data-act="qrStart" data-id="${d.id}" data-reset="1">Review again</button>
        <button type="button" class="btn" data-act="games" data-id="${d.id}" ${k.total >= 2 ? '' : 'disabled'}>Play a game</button>
        <button type="button" class="btn" data-act="openDeck" data-id="${d.id}">Back to deck</button>
      </div>
    </div>`;
};

Object.assign(actions, {
  quickStart: el => go({ name: 'quickStart', deckId: el.dataset.id }),
  qrStart: el => startQuick(el.dataset.id, !!el.dataset.reset, !!el.dataset.all),
  qrSelOff: el => { clPref(el.dataset.id).f.sel = []; render(); },
  qrFlip: (el, e) => { if (e.target.closest('button')) return; qrFlip(); },
  qrAns: el => qrAnswer(el.dataset.got === '1'),
  qrNext: () => qrNextRound(),
  qrUndo: () => qrUndo(),
  qrTts: () => { const d = deckById(qr?.deckId); if (!d) return; const on = !autoplayOn(d); d.autoplay = on; save(); if (!on && 'speechSynthesis' in window) speechSynthesis.cancel(); render(); toast(on ? '🔊 Cards are read aloud' : '🔇 Reading aloud is off'); if (on) speakQuick(); },
  qrEdit: () => { const c = qrCard(); if (c) cardDialog(c, () => { if (view.name === 'quick') render(); }); },
});
document.addEventListener('keydown', e => {
  if (view.name !== 'quick' || !qr || $('#dlg').open || e.altKey) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); qrUndo(); return; }
  if (e.ctrlKey) return;
  if (qr.roundEnd) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); qrNextRound(); } return; }
  const k = e.key.toLowerCase();
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); qrFlip(); }
  else if (e.key === '1' || e.key === 'ArrowLeft') { e.preventDefault(); qrAnswer(false); }
  else if (e.key === '2' || e.key === 'ArrowRight') { e.preventDefault(); qrAnswer(true); }
  else if (k === 'r') speakQuick(true);
  else if (k === 'e') { e.preventDefault(); actions.qrEdit(); }
  else if (k === 'a') { e.preventDefault(); actions.qrTts(); }
});
document.addEventListener('change', e => { const k = e.target.dataset?.qro; if (!k || view.name !== 'quickStart') return; qrOpt(e.target.dataset.id)[k] = e.target.checked; save(); render(); });
