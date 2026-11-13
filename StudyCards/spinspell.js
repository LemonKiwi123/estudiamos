'use strict';
/* ================= Spin & Spell: spin the wheel, guess letters, solve the hidden word =================
   1–2 players, 3 puzzles (words or example sentences from the deck; the meaning is the hint).
   Spin, call a consonant: each one in the puzzle earns the wedge value. Buy vowels for 250. Solve to bank your points.
   Bankrupt loses this puzzle's points; Lose a Turn passes the turn (solo: costs a strike, 3 strikes ends the puzzle). */
const SS_WEDGES = [300, 500, 'BANKRUPT', 400, 650, 350, 800, 'LOSE A TURN', 450, 700, 300, 1000, 550, 250, 900, 600];
const SS_COLORS = ['#ef476f', '#f2a516', '#2b2f45', '#23905a', '#3b82f6', '#8e44ad', '#16a085', '#f5f4f0', '#ff7aa2', '#ef8354', '#4f9dde', '#f2c14e', '#7bc67e', '#c77dff', '#e63946', '#2a9d8f'];
const SS_VOWELS = new Set([...'aeiouаеёиоуыэюяαεηιουω']);
const VOWEL_COST = 250;
let ss = null, ssPrefs = { players: 2, p1: '', p2: 'Player 2', c1: '#3b54e8', c2: '#cf3f3f', source: 'words' };
const ssFold = ch => fold(ch).replace(/[^\p{L}\p{N}]/gu, '');
const isLetter = ch => /[\p{L}]/u.test(ch);
function ssUsable(deckId) {
  const d = deckById(deckId); if (!d || NOSPACE(d.frontLang) || /^(ko|ar|he|fa|hi|bn|ta|th)/.test(d.frontLang || '')) return [];
  return runnerPool(deckId).filter(c => [...c.front].filter(isLetter).length >= 3 && c.front.length <= 40);
}
function ssSentences(deckId) {
  return runnerPool(deckId).filter(c => c.example && plainSent(c.example).length <= 48 && [...plainSent(c.example)].filter(isLetter).length >= 6);
}
function startSpinSpell(deckId, prefs) {
  const d = deckById(deckId);
  let pool = prefs.source === 'sentences' ? ssSentences(deckId) : ssUsable(deckId);
  if (pool.length < 3) { toast(prefs.source === 'sentences' ? 'Not enough short example sentences. Try “Words” instead.' : 'This deck needs at least 3 words of 3+ letters'); return; }
  const players = [{ name: prefs.p1, color: prefs.c1, total: 0, round: 0 }];
  if (prefs.players === 2) players.push({ name: prefs.p2, color: prefs.c2, total: 0, round: 0 });
  ss = { deckId, d, prefs, players, puzzles: shuffle(pool).slice(0, 3), n: 0, turn: 0, phase: 'spin', angle: 0, wedge: null, used: new Set(), strikes: 0, results: [], start: Date.now(), msg: '' };
  ssNewPuzzle(); go({ name: 'spinSpell' });
}
function ssNewPuzzle() {
  const c = ss.puzzles[ss.n];
  ss.text = (ss.prefs.source === 'sentences' ? plainSent(c.example) : c.front).toLocaleUpperCase();
  ss.hint = ss.prefs.source === 'sentences' ? (c.exampleTr || c.back) : c.back;
  ss.card = c; ss.used = new Set(); ss.players.forEach(p => { p.round = 0; }); ss.strikes = 0; ss.phase = 'spin'; ss.wedge = null; ss.msg = '';
}
const ssLettersLeft = () => [...ss.text].some(ch => isLetter(ch) && !ss.used.has(ssFold(ch)));
const ssConsonantsLeft = () => [...ss.text].some(ch => isLetter(ch) && !SS_VOWELS.has(ssFold(ch)) && !ss.used.has(ssFold(ch)));
function ssSpin() {
  if (ss.phase !== 'spin' || ss.spinning) return;
  if (!ssConsonantsLeft()) { toast('No consonants left. Buy a vowel or solve!'); return; }
  ss.spinning = true; const n = SS_WEDGES.length, idx = Math.floor(Math.random() * n), seg = 360 / n;
  // the pointer is at the top; rotate so wedge idx ends under it
  const target = 360 * (5 + Math.floor(Math.random() * 3)) + (360 - (idx * seg + seg / 2)) + (Math.random() - 0.5) * seg * 0.6;
  ss.angle = Math.floor(ss.angle / 360) * 360 + target;
  const wheel = $('.ss-wheel'); if (wheel) wheel.style.transform = `rotate(${ss.angle}deg)`;
  ssClicks();
  setTimeout(() => {
    ss.spinning = false; ss.wedge = SS_WEDGES[idx];
    const P = ss.players[ss.turn];
    if (ss.wedge === 'BANKRUPT') { P.round = 0; sdSound('wrong'); ss.msg = `💸 Bankrupt! ${P.name} loses this puzzle’s points.`; ssPass(); }
    else if (ss.wedge === 'LOSE A TURN') { sdSound('wrong'); ss.msg = `😬 Lose a turn!`; ssPass(); }
    else { ss.phase = 'letter'; ss.msg = `${P.name} spun ${ss.wedge}! Pick a consonant.`; }
    render();
  }, 3600);
}
function ssClicks() {
  if (S.settings?.mascotSound === false) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  audioCtx ||= new AC(); const ac = audioCtx; if (ac.state === 'suspended') ac.resume(); let t = ac.currentTime + 0.02, gap = 0.04;
  while (t < ac.currentTime + 3.4) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.value = 1800; g.gain.setValueAtTime(0.03, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.02); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.03); t += gap; gap *= 1.09; }
}
/* No-match / Bankrupt / Lose a turn: pass the turn (2 players) or take a strike (solo). */
function ssPass() {
  if (ss.players.length > 1) { ss.turn = 1 - ss.turn; ss.phase = 'spin'; ss.msg += ` It’s ${ss.players[ss.turn].name}’s turn.`; return; }
  ss.strikes++; ss.phase = 'spin';
  if (ss.strikes >= 3) { ss.msg += ' That’s 3 strikes!'; ssReveal(null); } else ss.msg += ` Strike ${ss.strikes} of 3.`;
}
function ssGuess(letter) {
  const P = ss.players[ss.turn], vowel = SS_VOWELS.has(letter);
  if (ss.used.has(letter)) return;
  if (vowel) { if (ss.phase !== 'spin' && ss.phase !== 'letter') return; if (P.round < VOWEL_COST) { toast(`You need ${VOWEL_COST} points this puzzle to buy a vowel`); return; } P.round -= VOWEL_COST; }
  else if (ss.phase !== 'letter') { toast(ss.phase === 'spin' ? 'Spin the wheel first!' : ''); return; }
  ss.used.add(letter);
  const count = [...ss.text].filter(ch => isLetter(ch) && ssFold(ch) === letter).length;
  if (count) {
    if (!vowel) P.round += ss.wedge * count;
    ss.msg = `✅ There ${count === 1 ? 'is' : 'are'} ${count} “${letter.toUpperCase()}”${!vowel ? ` (+${(ss.wedge * count).toLocaleString()})` : ''}!`; sdSound('right'); ss.phase = 'spin';
    if (!ssLettersLeft()) { ssReveal(ss.turn); return render(); }
  } else { ss.msg = `❌ No “${letter.toUpperCase()}”.`; sdSound('wrong'); ssPass(); }
  render();
}
function ssSolve(guess) {
  if (!['spin', 'letter'].includes(ss.phase)) return;
  const ok = norm(guess) === norm(ss.text) || checkTyped(guess, ss.text).ok;
  if (ok) ssReveal(ss.turn);
  else { ss.msg = `❌ “${guess}” isn’t right.`; sdSound('wrong'); ssPass(); }
  render();
}
function ssReveal(winner) {
  [...ss.text].forEach(ch => { if (isLetter(ch)) ss.used.add(ssFold(ch)); });
  ss.results.push({ player: winner ?? -1, cardId: ss.card.id, q: ss.hint, a: ss.text, ok: winner === 0 || (winner != null && ss.players.length === 1) });
  if (winner != null) { const P = ss.players[winner]; P.round = Math.max(P.round, 300); P.total += P.round; ss.msg = `🎉 ${P.name} solved it and banks ${P.round.toLocaleString()}!`; sdSound('end'); }
  else ss.msg = `The answer was “${ss.text}”.`;
  ss.phase = 'solved';
  if (autoplayOn()) speak(ss.prefs.source === 'sentences' ? plainSent(ss.card.example) : ss.card.front, ss.d.frontLang);
}
function ssNextPuzzle() {
  ss.n++;
  if (ss.n >= ss.puzzles.length) { ss.phase = 'over'; ssFinish(); render(); return; }
  ss.turn = ss.n % ss.players.length; ssNewPuzzle(); render();
}
function ssFinish() {
  const P = ss.players, solved = ss.results.filter(r => r.player === 0 || (P.length === 1 && r.ok)).length;
  ss.real = Math.min(20, Math.floor(P[0].total / 1500));
  if (ss.real && typeof rw === 'function') rw().peanuts += ss.real;
  if (typeof addHistory === 'function') addHistory({ type: 'spinspell', deckId: ss.deckId, deckName: ss.d.name, correct: solved, total: ss.results.length,
    score: Math.round(solved / ss.results.length * 100), timeMs: Date.now() - ss.start,
    detail: P.length > 1 ? `${P[0].name} ${P[0].total} – ${P[1].total} ${P[1].name}` : `${P[0].total.toLocaleString()} points`,
    items: ss.results.map(r => ({ cardId: r.cardId, q: r.q, a: r.a, ok: r.ok })) });
}

/* ---------- Views ---------- */
function ssWheelSvg() {
  const n = SS_WEDGES.length, seg = 360 / n, R = 150, C = 160;
  const pt = (a, r) => [C + r * Math.sin(a * Math.PI / 180), C - r * Math.cos(a * Math.PI / 180)];
  return `<svg viewBox="0 0 320 320" class="ss-svg">${SS_WEDGES.map((w, i) => {
    const a0 = i * seg, a1 = a0 + seg, [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R), [tx, ty] = pt(a0 + seg / 2, R * 0.66), col = SS_COLORS[i % SS_COLORS.length];
    const label = typeof w === 'number' ? w : w === 'BANKRUPT' ? '💸' : '⏭️', txt = col === '#f5f4f0' ? '#2b2f45' : '#fff';
    return `<path d="M${C} ${C} L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="${col}" stroke="#fff" stroke-width="2"/>
      <text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" fill="${txt}" font-family="Segoe UI, sans-serif" font-weight="800" font-size="${typeof w === 'number' ? 15 : 18}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${(a0 + seg / 2).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})">${label}</text>`;
  }).join('')}<circle cx="${C}" cy="${C}" r="26" fill="#2b2f45" stroke="#f2c14e" stroke-width="4"/><text x="${C}" y="${C + 1}" text-anchor="middle" dominant-baseline="middle" font-size="22">🐘</text></svg>`;
}
views.spinSetup = () => {
  const d = deckById(view.deckId); if (!d) { view = { name: 'home' }; return views.home(); }
  const words = ssUsable(d.id).length, sents = ssSentences(d.id).length;
  return `
    <div class="crumbs"><a data-act="home">Decks</a> / <a data-act="openDeck" data-id="${d.id}">${esc(d.name)}</a> / <a data-act="games" data-id="${d.id}">Games</a> / Spin & Spell</div>
    <h2 style="margin-bottom:12px">🎡 Spin & Spell</h2>
    ${friendTip('rabbit', 'spin')}
    <form class="panel stack" id="ssForm">
      <p class="muted" style="margin:0">Spin the wheel and guess the letters of a hidden word from “${esc(d.name)}”. Its meaning is your hint.
        Each consonant earns the wheel’s points, vowels cost ${VOWEL_COST}, and solving banks your points. Watch out for 💸 <b>Bankrupt</b> and ⏭️ <b>Lose a Turn</b>! 3 puzzles per game.</p>
      ${twoPlayerFields(ssPrefs, true)}
      <div><b>Puzzles</b><div class="seg">
        <label><input type="radio" name="source" value="words" ${ssPrefs.source !== 'sentences' ? 'checked' : ''} ${words >= 3 ? '' : 'disabled'}>🔤 Words (${words})</label>
        <label><input type="radio" name="source" value="sentences" ${ssPrefs.source === 'sentences' ? 'checked' : ''} ${sents >= 3 ? '' : 'disabled'}>💬 Example sentences (${sents})</label></div>
        ${sents < 3 ? '<div class="muted small" style="margin-top:4px">Turn on example sentences for this deck to unlock sentence puzzles.</div>' : ''}</div>
      <div class="row-between"><span></span><button type="submit" class="btn primary big" ${words >= 3 || sents >= 3 ? '' : 'disabled'}>Let’s spin! 🎡</button></div>
    </form>`;
};
views.spinSpell = () => {
  if (!ss) { view = { name: 'home' }; return views.home(); }
  const P = ss.players[ss.turn], playing = ['spin', 'letter'].includes(ss.phase);
  const scores = `<div class="tw-players" style="${ss.players.length === 1 ? 'grid-template-columns:1fr' : ''}">${ss.players.map((p, i) => `<div class="tw-player ${i === ss.turn && playing ? 'active' : ''}" style="--pc:${p.color}"><span class="tw-dot"></span>
      <div><b>${esc(p.name)}</b><div class="muted small">this puzzle: ${p.round.toLocaleString()}</div></div><span class="sd-score">${p.total.toLocaleString()}</span></div>`).join('')}</div>`;
  const words = ss.text.split(' ');
  const board = `<div class="ss-board">${words.map(w => `<span class="ss-word">${[...w].map(ch => isLetter(ch)
      ? `<span class="ss-tile ${ss.used.has(ssFold(ch)) ? 'shown' : ''}">${ss.used.has(ssFold(ch)) ? esc(ch) : ''}</span>`
      : `<span class="ss-tile punct">${esc(ch)}</span>`).join('')}</span>`).join('')}</div>`;
  const letters = [...new Set([...'abcdefghijklmnopqrstuvwxyz', ...[...ss.text].filter(isLetter).map(ssFold)])].filter(Boolean);
  const kb = `<div class="ss-keys">${letters.map(l => { const v = SS_VOWELS.has(l), used = ss.used.has(l), can = playing && !used && (v ? P.round >= VOWEL_COST : ss.phase === 'letter');
      return `<button type="button" class="ss-key ${v ? 'vowel' : ''} ${used ? 'used' : ''}" data-act="ssKey" data-l="${esc(l)}" ${can ? '' : 'disabled'} title="${v ? `Buy vowel (${VOWEL_COST})` : 'Consonant'}">${esc(l.toLocaleUpperCase())}</button>`; }).join('')}</div>`;
  let body;
  if (ss.phase === 'over') {
    const [a, b] = ss.players, tie = b && a.total === b.total, W = b ? (a.total >= b.total ? a : b) : a;
    body = `<div class="panel tw-over">${mascot(100, 'party')}<div class="word" style="color:${tie ? 'inherit' : W.color}">${b ? (tie ? 'It’s a tie! 🤝' : `${esc(W.name)} wins! 🏆`) : `You banked ${a.total.toLocaleString()}! 🎉`}</div>
      <p class="muted" style="margin:0">${ss.players.map(p => `${esc(p.name)} ${p.total.toLocaleString()}`).join(' · ')}</p>
      ${ss.real ? `<div class="reward">🥜 +${ss.real} real peanuts for the shop!</div>` : ''}
      <div class="row" style="justify-content:center"><button type="button" class="btn primary" data-act="ssAgain">Play again</button><button type="button" class="btn" data-act="games" data-id="${ss.deckId}">Other games</button></div></div>`;
  } else body = `
    <div class="ss-layout">
      <div class="ss-wheel-wrap"><div class="ss-pointer">▼</div><div class="ss-wheel" style="transform:rotate(${ss.angle}deg)">${ssWheelSvg()}</div>
        <button type="button" class="btn primary big" data-act="ssSpin" ${ss.phase === 'spin' && !ss.spinning ? '' : 'disabled'}>🎡 Spin</button></div>
      <div class="ss-right">
        <div class="ss-hint">💡 Hint (${esc(langName(ss.d.backLang))}): <b>${esc(ss.hint)}</b> <span class="muted small">· Puzzle ${ss.n + 1} of ${ss.puzzles.length}</span></div>
        ${board}
        <div class="ss-msg">${esc(ss.msg || `${P.name}, spin the wheel!`)}${ss.players.length === 1 && ss.phase !== 'solved' ? ` <span class="muted small">· strikes ${'❌'.repeat(ss.strikes)}${'⚪'.repeat(3 - ss.strikes)}</span>` : ''}</div>
        ${ss.phase === 'solved' ? `<div class="row" style="justify-content:center;gap:8px">${speakBtn(ss.prefs.source === 'sentences' ? plainSent(ss.card.example) : ss.card.front, ss.d.frontLang)}<button type="button" class="btn primary big" data-act="ssNextP">${ss.n < ss.puzzles.length - 1 ? 'Next puzzle' : 'See the results'}</button></div>`
          : `${kb}<form id="ssSolveForm" class="type-row"><input id="ssSolveIn" autocomplete="off" spellcheck="false" placeholder="I’d like to solve…" ${playing && !ss.spinning ? '' : 'disabled'}><button class="btn" type="submit" ${playing && !ss.spinning ? '' : 'disabled'}>Solve</button></form>`}
      </div>
    </div>`;
  return `<div class="study-top"><button type="button" class="btn ghost" data-act="games" data-id="${ss.deckId}">← Games</button><div class="prompt-label muted">🎡 Spin & Spell · ${esc(ss.d.name)}</div><span></span></div>
    ${scores}${body}`;
};
Object.assign(actions, {
  ssSpin: () => ssSpin(),
  ssKey: el => ssGuess(el.dataset.l),
  ssNextP: () => ssNextPuzzle(),
  ssAgain: () => startSpinSpell(ss.deckId, ss.prefs),
});
document.addEventListener('submit', e => {
  if (e.target.id === 'ssForm') { e.preventDefault(); readPlayerFields(e.target, ssPrefs); ssPrefs.source = e.target.source.value; startSpinSpell(view.deckId, ssPrefs); }
  if (e.target.id === 'ssSolveForm') { e.preventDefault(); const v = $('#ssSolveIn').value.trim(); if (v) ssSolve(v); }
});
document.addEventListener('keydown', e => {
  if (view.name !== 'spinSpell' || !ss || $('#dlg').open || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
  if (e.key === ' ' && ss.phase === 'spin') { e.preventDefault(); ssSpin(); }
  else if (e.key.length === 1 && isLetter(e.key)) { const l = ssFold(e.key); if (l) ssGuess(l); }
});
