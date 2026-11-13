'use strict';
/* ================= Price Party: name the products to earn drop chips, then drop them down the peg board =================
   1–2 players, 3 rounds. Each turn: 3 "products" (cards). Name each one right to win a 🥜 chip
   (all 3 right = a bonus chip). Then drop your chips down the peg board into prize slots. */
const PP_SLOTS = [100, 500, 1000, 0, 5000, 0, 1000, 500, 100];
const PP_ROWS = 9, PP_W = 540, PP_H = 520;
let pp = null, ppPrefs = { players: 2, p1: '', p2: 'Player 2', c1: '#3b54e8', c2: '#cf3f3f' };
function startPriceParty(deckId, prefs) {
  const pool = runnerPool(deckId);
  const players = [{ name: prefs.p1, color: prefs.c1, score: 0 }];
  if (prefs.players === 2) players.push({ name: prefs.p2, color: prefs.c2, score: 0 });
  pp = { deckId, d: deckById(deckId), prefs, pool, queue: [], players, round: 1, rounds: 3, turn: 0, phase: 'intro', items: [], i: 0, chips: 0, results: [], start: Date.now(), drops: [] };
  go({ name: 'priceParty' });
}
const ppCard = () => { if (!pp.queue.length) pp.queue = shuffle(pp.pool); return pp.queue.pop(); };
function ppStartTurn() {
  pp.items = [0, 1, 2].map(() => {
    const c = ppCard(), opts = pickOptions(c.back, pp.pool.filter(x => x.id !== c.id).map(x => x.back), 4);
    return { card: c, opts, given: null, ok: null, price: [199, 349, 499, 799, 999, 1299][Math.floor(Math.random() * 6)] + Math.floor(Math.random() * 10) * 10 };
  });
  pp.i = 0; pp.chips = 0; pp.phase = 'ask'; render(); ppSpeak();
}
function ppSpeak() { const it = pp.items[pp.i]; if (it && autoplayOn()) setTimeout(() => speak(it.card.front, pp.d.frontLang), 250); }
function ppAnswer(i) {
  const it = pp.items[pp.i]; if (!it || it.ok != null) return;
  it.given = it.opts[i]; it.ok = norm(it.given) === norm(it.card.back);
  pp.results.push({ player: pp.turn, cardId: it.card.id, q: it.card.front, a: it.card.back, given: it.given, ok: it.ok });
  if (it.ok) { pp.chips++; sdSound('right'); } else sdSound('wrong');
  render();
}
function ppNextItem() {
  if (pp.i < 2) { pp.i++; render(); ppSpeak(); return; }
  if (pp.items.every(x => x.ok)) pp.chips++;            // bonus chip for a perfect turn
  pp.phase = pp.chips ? 'drop' : 'nochips'; pp.dropping = false; render();
  if (pp.phase === 'drop') setTimeout(ppDrawBoard, 30);
}
function ppEndTurn() {
  if (pp.turn < pp.players.length - 1) pp.turn++;
  else { pp.turn = 0; pp.round++; }
  if (pp.round > pp.rounds) { bwStart(); return; }   // final round: the Big Wheel
  pp.phase = 'intro'; render();
}
function ppFinish() {
  const mine = pp.results.filter(r => r.player === 0), P = pp.players;
  const best = P.length > 1 ? (P[0].score === P[1].score ? null : P[0].score > P[1].score ? P[0] : P[1]) : P[0];
  pp.real = Math.min(20, Math.floor(P[0].score / 1000));
  if (pp.real && typeof rw === 'function') rw().peanuts += pp.real;
  if (typeof addHistory === 'function') addHistory({ type: 'priceparty', deckId: pp.deckId, deckName: pp.d.name, correct: mine.filter(r => r.ok).length, total: mine.length,
    score: mine.length ? Math.round(mine.filter(r => r.ok).length / mine.length * 100) : 0, timeMs: Date.now() - pp.start,
    detail: P.length > 1 ? `${P[0].name} ${P[0].score} – ${P[1].score} ${P[1].name}${best ? `: ${best.name} won` : ' (tie)'}` : `${P[0].score.toLocaleString()} points`, items: pp.results });
}

/* ---------- Peg board ---------- */
const ppGeom = () => { const cols = PP_SLOTS.length, gap = PP_W / cols; return { cols, gap, top: 70, rowH: (PP_H - 160) / PP_ROWS }; };
function ppDrawBoard(ball, trail) {
  const cv = $('#ppCanvas'); if (!cv) return;
  const dpr = Math.max(1, devicePixelRatio || 1); if (cv.width !== PP_W * dpr) { cv.width = PP_W * dpr; cv.height = PP_H * dpr; }
  const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const { cols, gap, top, rowH } = ppGeom(), dark = document.documentElement.dataset.theme === 'dark';
  const g = ctx.createLinearGradient(0, 0, 0, PP_H); g.addColorStop(0, dark ? '#24204a' : '#fff4d6'); g.addColorStop(1, dark ? '#171433' : '#ffe0a6');
  ctx.fillStyle = g; ctx.fillRect(0, 0, PP_W, PP_H);
  // drop zone arrows
  ctx.fillStyle = dark ? '#c9c2ff' : '#7a5a1a'; ctx.font = '700 13px "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let c = 0; c < cols; c++) ctx.fillText('▼', gap * c + gap / 2, 30);
  ctx.fillText('Click a ▼ to drop a chip', PP_W / 2, 12);
  // pegs
  ctx.fillStyle = dark ? '#8b7bff' : '#c9973a';
  for (let r = 0; r < PP_ROWS; r++) { const off = r % 2 ? gap / 2 : 0; for (let c = 0; c <= cols; c++) { const x = c * gap + off; if (x < 6 || x > PP_W - 6) continue; ctx.beginPath(); ctx.arc(x, top + r * rowH + rowH / 2, 5, 0, 7); ctx.fill(); } }
  // slots
  const sy = PP_H - 80;
  PP_SLOTS.forEach((v, i) => {
    const x = i * gap; ctx.fillStyle = v === 5000 ? '#f2a516' : v === 0 ? (dark ? '#3a2a2a' : '#e9c9c9') : i % 2 ? '#3b54e8' : '#23905a';
    ctx.fillRect(x + 2, sy, gap - 4, 76); ctx.fillStyle = '#fff'; ctx.font = `800 ${v >= 1000 ? 15 : 16}px "Segoe UI", sans-serif`;
    ctx.fillText(v ? v.toLocaleString() : '0', x + gap / 2, sy + 38);
  });
  if (trail) { ctx.strokeStyle = 'rgba(242,165,22,.35)'; ctx.lineWidth = 3; ctx.beginPath(); trail.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
  if (ball) { ctx.font = '26px "Segoe UI Emoji", sans-serif'; ctx.fillText('🥜', ball[0], ball[1]); }
}
function ppDrop(col) {
  if (!pp || pp.phase !== 'drop' || pp.dropping || pp.chips <= 0) return;
  pp.dropping = true; const { cols, gap, top, rowH } = ppGeom();
  // path: bounce left or right at every row, staying on the board
  let x = gap * col + gap / 2; const pts = [[x, 40]];
  for (let r = 0; r < PP_ROWS; r++) { x += (Math.random() < 0.5 ? -1 : 1) * gap / 2; x = Math.max(gap / 2, Math.min(PP_W - gap / 2, x)); pts.push([x, top + r * rowH + rowH / 2 - 12]); }
  const slot = Math.max(0, Math.min(cols - 1, Math.floor(x / gap))); pts.push([slot * gap + gap / 2, PP_H - 46]);
  let seg = 0, t = 0, last = performance.now(); const trail = [pts[0]];
  const step = now => {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt * 6.5;
    while (t >= 1 && seg < pts.length - 1) { t -= 1; seg++; trail.push(pts[seg]); if (seg < pts.length - 1) ppTick(); }
    if (seg >= pts.length - 1) { ppDrawBoard(pts.at(-1), trail); ppLanded(slot); return; }
    const [x0, y0] = pts[seg], [x1, y1] = pts[seg + 1], e = t * t * (3 - 2 * t);
    ppDrawBoard([x0 + (x1 - x0) * e, y0 + (y1 - y0) * e - Math.sin(t * Math.PI) * 10], trail.concat([[x0 + (x1 - x0) * e, y0 + (y1 - y0) * e]]));
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
function ppTick() {
  if (S.settings?.mascotSound === false) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  audioCtx ||= new AC(); const ac = audioCtx, o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
  o.type = 'triangle'; o.frequency.value = 900 + Math.random() * 500; g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.07);
}
function ppLanded(slot) {
  const v = PP_SLOTS[slot], P = pp.players[pp.turn];
  P.score += v; pp.chips--; pp.drops.push(v); pp.dropping = false;
  sdSound(v >= 1000 ? 'end' : v ? 'right' : 'wrong');
  toast(v ? `🥜 ${P.name} +${v.toLocaleString()}!` : 'Oops, 0!');
  const info = $('#ppInfo'); if (info) info.innerHTML = ppDropInfo();
  if (!pp.chips) setTimeout(() => { pp.phase = 'dropped'; render(); }, 900);
}
const ppDropInfo = () => { const P = pp.players[pp.turn]; return `<b style="color:${P.color}">${esc(P.name)}</b>: ${pp.chips} chip${pp.chips === 1 ? '' : 's'} left · score <b>${P.score.toLocaleString()}</b>`; };

/* ---------- Views ---------- */
function twoPlayerFields(prefs, allowSolo) {
  const me = typeof currentProfile === 'function' ? currentProfile() : null, others = (typeof profiles !== 'undefined' ? profiles.list : []).filter(p => p.id !== me?.id);
  prefs.p1 ||= me?.name || 'Player 1';
  const sw = (name, cur) => `<div class="row" style="gap:6px;margin-top:6px">${TW_COLORS.map(c => `<label class="swatch" style="background:${c}"><input type="radio" name="${name}" value="${c}" ${c === cur ? 'checked' : ''}></label>`).join('')}</div>`;
  return `${allowSolo ? `<div><b>Players</b><div class="seg"><label><input type="radio" name="players" value="1" ${prefs.players === 1 ? 'checked' : ''}>👤 1 player</label><label><input type="radio" name="players" value="2" ${prefs.players !== 1 ? 'checked' : ''}>👥 2 players</label></div></div>` : ''}
    <div class="grid2">
      <div class="feat"><h4>Player 1</h4><label class="field">Name<input name="p1" maxlength="24" value="${esc(prefs.p1)}" required></label>${sw('c1', prefs.c1)}</div>
      <div class="feat p2box"><h4>Player 2</h4><label class="field">Name<input name="p2" maxlength="24" value="${esc(prefs.p2)}" list="gpProfiles"></label>
        ${others.length ? `<datalist id="gpProfiles">${others.map(o => `<option value="${esc(o.name)}">`).join('')}</datalist>` : ''}${sw('c2', prefs.c2)}</div>
    </div>`;
}
function readPlayerFields(f, prefs) {
  prefs.players = f.players ? +f.players.value : 2;
  prefs.p1 = f.p1.value.trim() || 'Player 1'; prefs.p2 = f.p2.value.trim() || 'Player 2';
  prefs.c1 = f.c1.value; prefs.c2 = f.c2.value === f.c1.value ? TW_COLORS.find(c => c !== f.c1.value) : f.c2.value;
  return prefs;
}
views.priceSetup = () => {
  const d = deckById(view.deckId); if (!d) { view = { name: 'home' }; return views.home(); }
  return `
    <div class="crumbs"><a data-act="home">Decks</a> / <a data-act="openDeck" data-id="${d.id}">${esc(d.name)}</a> / <a data-act="games" data-id="${d.id}">Games</a> / Price Party</div>
    <h2 style="margin-bottom:12px">🏷️ Price Party</h2>
    ${friendTip('squirrel', 'price')}
    <form class="panel stack" id="ppForm">
      <p class="muted" style="margin:0">Come on down! Each turn you’re shown 3 products from “${esc(d.name)}”. Name each one to win a <b>🥜 drop chip</b> (all 3 right = a bonus chip).
        Then drop your chips down the <b>peg board</b> and watch them bounce into the prize slots. The middle slot is worth 5,000! After 3 rounds comes the final 🎡 <b>Big Wheel</b>: get close to 100 without going over for bonus points. Highest score wins.</p>
      ${twoPlayerFields(ppPrefs, true)}
      <div class="row-between"><span></span><button type="submit" class="btn primary big">Come on down! 🎉</button></div>
    </form>`;
};
views.priceParty = () => {
  if (!pp) { view = { name: 'home' }; return views.home(); }
  const P = pp.players[pp.turn];
  const scores = `<div class="tw-players" style="${pp.players.length === 1 ? 'grid-template-columns:1fr' : ''}">${pp.players.map((p, i) => `<div class="tw-player ${i === pp.turn && pp.phase !== 'over' ? 'active' : ''}" style="--pc:${p.color}"><span class="tw-dot"></span><b>${esc(p.name)}</b><span class="sd-score">${p.score.toLocaleString()}</span></div>`).join('')}</div>`;
  let body = '';
  if (pp.phase === 'intro') body = `<div class="panel tw-over"><div class="pp-round">Round ${pp.round} of ${pp.rounds}</div><div class="word">${esc(P.name)}, come on down! 🎉</div>
      <button type="button" class="btn primary big" data-act="ppGo">See the products</button></div>`;
  else if (pp.phase === 'ask') {
    const it = pp.items[pp.i], pic = /<img /.test(it.card.frontHtml || '') ? sideHtml(it.card, 'front', pp.d) : '';
    body = `<div class="pp-stage"><div class="pp-product"><div class="pp-tag">🏷️ ${it.price.toLocaleString()}</div>
        ${pic ? `<div class="pp-pic">${pic}</div>` : ''}<div class="row" style="justify-content:center;gap:8px"><span class="tw-word">${esc(it.card.front)}</span>${speakBtn(it.card.front, pp.d.frontLang)}</div>
        <div class="muted small">Product ${pp.i + 1} of 3 · What is it in ${esc(langName(pp.d.backLang))}?</div></div>
      <div class="options">${it.opts.map((o, i) => { let cls = ''; if (it.ok != null) { if (norm(o) === norm(it.card.back)) cls = 'correct'; else if (o === it.given) cls = 'wrong'; }
        return `<button type="button" class="opt ${cls}" data-act="ppAns" data-i="${i}" ${it.ok != null ? 'disabled' : ''}><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`; }).join('')}</div>
      ${it.ok != null ? `<div class="feedback ${it.ok ? 'ok' : 'bad'}"><div>${it.ok ? '<b class="ok">Correct! +1 🥜 chip</b>' : `<b class="bad">Not quite.</b> It’s <b>${esc(it.card.back)}</b>`}</div>
        <button type="button" class="btn primary" id="ppNextBtn" data-act="ppNext">${pp.i < 2 ? 'Next product' : 'To the peg board!'} <kbd style="background:transparent;color:inherit;border-color:currentColor;opacity:.7">Enter</kbd></button></div>` : ''}
      <div class="pp-chips">${'🥜'.repeat(pp.chips)}<span class="muted small"> ${pp.chips} chip${pp.chips === 1 ? '' : 's'} so far</span></div></div>`;
  } else if (pp.phase === 'drop' || pp.phase === 'dropped') {
    body = `<div class="pp-board-wrap"><div class="pp-info" id="ppInfo">${ppDropInfo()}</div>
      <canvas id="ppCanvas" class="pp-canvas" data-act="ppBoard"></canvas>
      ${pp.phase === 'dropped' ? `<div class="row" style="justify-content:center;margin-top:10px"><button type="button" class="btn primary big" data-act="ppEnd">${pp.round === pp.rounds && pp.turn === pp.players.length - 1 ? 'See the results' : 'Next turn'}</button></div>` : ''}</div>`;
  } else if (pp.phase === 'nochips') body = `<div class="panel tw-over"><div class="word">No chips this time 😅</div><p class="muted" style="margin:0">Name the products right to earn chips next turn!</p>
      <button type="button" class="btn primary" data-act="ppEnd">Next turn</button></div>`;
  else if (pp.phase === 'bwIntro' || pp.phase === 'bw' || pp.phase === 'bwDone') body = bwView();
  else if (pp.phase === 'over') {
    const [a, b] = pp.players, tie = b && a.score === b.score, W = b ? (a.score >= b.score ? a : b) : a;
    body = `<div class="panel tw-over">${mascot(100, 'party')}<div class="word" style="color:${tie ? 'inherit' : W.color}">${b ? (tie ? 'It’s a tie! 🤝' : `${esc(W.name)} wins the Price Party! 🏆`) : `You scored ${a.score.toLocaleString()}! 🎉`}</div>
      <p class="muted" style="margin:0">${pp.players.map(p => `${esc(p.name)} ${p.score.toLocaleString()}`).join(' · ')}</p>
      ${pp.real ? `<div class="reward">🥜 +${pp.real} real peanuts for the shop!</div>` : ''}
      <div class="row" style="justify-content:center"><button type="button" class="btn primary" data-act="ppAgain">Play again</button><button type="button" class="btn" data-act="games" data-id="${pp.deckId}">Other games</button></div></div>`;
  }
  return `<div class="study-top"><button type="button" class="btn ghost" data-act="games" data-id="${pp.deckId}">← Games</button><div class="prompt-label muted">🏷️ Price Party · ${pp.bw && pp.phase !== 'over' ? 'Final round: 🎡 Big Wheel' : `Round ${Math.min(pp.round, pp.rounds)}/${pp.rounds}`}</div><span></span></div>
    ${scores}${body}`;
};
Object.assign(actions, {
  ppGo: () => ppStartTurn(),
  ppAns: el => ppAnswer(+el.dataset.i),
  ppNext: () => ppNextItem(),
  ppEnd: () => ppEndTurn(),
  ppAgain: () => startPriceParty(pp.deckId, pp.prefs),
  ppBoard: (el, e) => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) * PP_W / r.width, y = (e.clientY - r.top) * PP_H / r.height; if (y < 60) ppDrop(Math.floor(x / ppGeom().gap)); else toast('Click a ▼ at the top to drop a chip'); },
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'ppForm') return;
  e.preventDefault(); readPlayerFields(e.target, ppPrefs); startPriceParty(view.deckId, ppPrefs);
});
document.addEventListener('keydown', e => {
  if (view.name !== 'priceParty' || !pp || $('#dlg').open || e.ctrlKey || e.altKey) return;
  const it = pp.items[pp.i];
  if (pp.phase === 'ask' && it.ok == null && /^[1-4]$/.test(e.key)) ppAnswer(+e.key - 1);
  else if (pp.phase === 'ask' && it.ok != null && e.key === 'Enter') { e.preventDefault(); ppNextItem(); }
});

/* ================= Final round: the Big Wheel =================
   Each player spins once, then may stay or spin again (the second spin is earned by answering a word).
   Closest to 100 without going over: total × 10 bonus points. Exactly 100 = 5,000 bonus. Over 100 = bust. */
const BW_VALUES = [15, 80, 35, 60, 20, 40, 75, 55, 95, 50, 85, 30, 65, 10, 45, 70, 25, 90, 5, 100];
const BW_CELL = 62, BW_VIS = 5, BW_REPEAT = 14;
function bwStart() {
  pp.bw = { p: 0, idx: BW_VALUES.length * 2, spins: pp.players.map(() => []), stayed: pp.players.map(() => false), q: null, spinning: false, earned: false };
  pp.phase = 'bwIntro'; render(); sdSound('dd');
}
const bwTotal = i => pp.bw.spins[i].reduce((a, b) => a + b, 0);
const bwOffset = idx => -(idx * BW_CELL) + Math.floor(BW_VIS / 2) * BW_CELL;
function bwSpin() {
  const b = pp.bw; if (!b || b.spinning || pp.phase !== 'bw') return;
  const mine = b.spins[b.p]; if (mine.length >= 2 || b.stayed[b.p] || (mine.length === 1 && !b.earned)) return;
  b.spinning = true; b.earned = false; b.q = null;
  const n = BW_VALUES.length, land = Math.floor(Math.random() * n);
  // reset to an equivalent early position (no animation), then travel forward 2–3 loops to the landing value
  const strip = $('.bw-strip'), start = n * 2 + (b.idx % n);
  if (strip) { strip.style.transition = 'none'; strip.style.transform = `translateY(${bwOffset(start)}px)`; void strip.offsetWidth; }
  b.idx = n * (4 + Math.floor(Math.random() * 2)) + land;
  if (strip) { strip.style.transition = 'transform 3.4s cubic-bezier(.15,.75,.2,1)'; strip.style.transform = `translateY(${bwOffset(b.idx)}px)`; }
  render();
  const s2 = $('.bw-strip'); if (s2) { s2.style.transition = 'none'; s2.style.transform = `translateY(${bwOffset(start)}px)`; void s2.offsetWidth; s2.style.transition = 'transform 3.4s cubic-bezier(.15,.75,.2,1)'; s2.style.transform = `translateY(${bwOffset(b.idx)}px)`; }
  ssClicks();
  setTimeout(() => {
    b.spinning = false; mine.push(BW_VALUES[land]);
    const t = bwTotal(b.p);
    sdSound(t > 100 ? 'wrong' : t === 100 ? 'end' : 'right');
    if (t >= 100 || mine.length >= 2) bwNextPlayer(true); else render();
  }, 3500);
}
function bwEarnSpin() {   // answer a word to earn the second spin
  const c = ppCard(); pp.bw.q = { card: c, opts: pickOptions(c.back, pp.pool.filter(x => x.id !== c.id).map(x => x.back), 4), given: null, ok: null };
  render(); if (autoplayOn()) setTimeout(() => speak(c.front, pp.d.frontLang), 200);
}
function bwAnswer(i) {
  const q = pp.bw.q; if (!q || q.ok != null) return;
  q.given = q.opts[i]; q.ok = norm(q.given) === norm(q.card.back);
  pp.results.push({ player: pp.bw.p, cardId: q.card.id, q: q.card.front, a: q.card.back, given: q.given, ok: q.ok });
  sdSound(q.ok ? 'right' : 'wrong');
  if (q.ok) pp.bw.earned = true; else pp.bw.stayed[pp.bw.p] = true;
  render();
}
function bwStay() { pp.bw.stayed[pp.bw.p] = true; bwNextPlayer(); }
function bwNextPlayer(delay) {
  const next = () => {
    if (pp.bw.p < pp.players.length - 1) { pp.bw.p++; pp.bw.q = null; pp.bw.earned = false; render(); }
    else bwFinish();
  };
  if (delay) { render(); setTimeout(next, 1600); } else next();
}
function bwFinish() {
  pp.bw.bonus = pp.players.map((P, i) => { const t = bwTotal(i), bonus = t > 100 ? 0 : t === 100 ? 5000 : t * 10; P.score += bonus; return bonus; });
  pp.phase = 'bwDone'; render();
}
function bwView() {
  const b = pp.bw, i = b.p, P = pp.players[i], mine = b.spins[i], t = bwTotal(i);
  if (pp.phase === 'bwIntro') return `<div class="panel tw-over"><div class="pp-round">Final round</div><div class="word">🎡 The Big Wheel!</div>
      <p class="muted" style="margin:0;max-width:560px">Spin once, then stay or spin again. Your second spin is earned by naming a word! Get as close to <b>100</b> as you can <b>without going over</b>:
        your total × 10 is added to your score. Hit exactly <b>100</b> for a <b>5,000 bonus</b>! Over 100 is a bust.</p>
      <button type="button" class="btn primary big" data-act="bwGo">Let’s spin!</button></div>`;
  const strip = Array.from({ length: BW_REPEAT }, () => BW_VALUES).flat().map(v => `<div class="bw-cell ${v === 100 ? 'hundred' : ''}">${v}</div>`).join('');
  const drum = `<div class="bw-drum" data-act="bwSpin" title="Click to spin"><div class="bw-strip" style="transform:translateY(${bwOffset(b.idx)}px)">${strip}</div><div class="bw-pointer">◀</div><div class="bw-shade"></div></div>`;
  const table = `<div class="bw-table">${pp.players.map((p, k) => { const tt = bwTotal(k), bust = tt > 100;
      return `<div class="bw-row ${k === i && pp.phase === 'bw' ? 'active' : ''}" style="--pc:${p.color}"><span class="tw-dot"></span><b>${esc(p.name)}</b>
        <span class="bw-spins">${b.spins[k].map(v => `<span class="bw-chip">${v}</span>`).join(' + ') || '<span class="muted small">waiting…</span>'}</span>
        <span class="bw-total ${bust ? 'bust' : tt === 100 ? 'perfect' : ''}">${b.spins[k].length ? (bust ? `${tt} 💥 Bust` : tt) : ''}</span>
        ${pp.phase === 'bwDone' ? `<span class="bw-bonus">+${(b.bonus[k] || 0).toLocaleString()}</span>` : ''}</div>`; }).join('')}</div>`;
  let side;
  if (pp.phase === 'bwDone') {
    side = `<div class="word sm">Final round results</div>${table}
      <p class="muted small" style="margin:0">${pp.players.map((p, k) => { const tt = bwTotal(k); return `${esc(p.name)}: ${tt > 100 ? 'bust, no bonus' : tt === 100 ? 'a perfect 100! 🎉' : `${tt} × 10`}`; }).join(' · ')}</p>
      <button type="button" class="btn primary big" data-act="bwResults">See the winner</button>`;
  } else {
    const q = b.q; let action;
    if (b.spinning) action = '<div class="pp-msg">🎡 Spinning…</div>';
    else if (q && q.ok === false) action = `<div class="feedback bad"><div><b class="bad">Not quite.</b> It’s <b>${esc(q.card.back)}</b>. ${esc(P.name)} stays at ${t}.</div><button type="button" class="btn primary" data-act="bwNextP">Continue</button></div>`;
    else if (t >= 100 || mine.length >= 2 || b.stayed[i]) action = `<div class="pp-msg">${t > 100 ? '💥 Over 100. Bust!' : t === 100 ? '🎉 Exactly 100!' : `${esc(P.name)} stays at ${t}.`}</div>`;
    else if (!mine.length) action = `<button type="button" class="btn primary big" data-act="bwSpin">🎡 Spin the wheel</button>`;
    else if (q && q.ok == null) action = `<div class="pp-product" style="padding:14px"><div class="muted small">Name this word to earn your second spin:</div>
        <div class="row" style="justify-content:center;gap:8px"><span class="tw-word">${esc(q.card.front)}</span>${speakBtn(q.card.front, pp.d.frontLang)}</div></div>
        <div class="options">${q.opts.map((o, k) => `<button type="button" class="opt" data-act="bwAns" data-i="${k}"><span class="k">${k + 1}</span><span>${esc(o)}</span></button>`).join('')}</div>`;
    else if (b.earned) action = `<div class="feedback ok"><b class="ok">Correct! Spin again if you dare…</b><div class="row"><button type="button" class="btn" data-act="bwStay">✋ Stay at ${t}</button><button type="button" class="btn primary" data-act="bwSpin">🎡 Spin again</button></div></div>`;
    else action = `<p style="margin:0">You have <b>${t}</b>. Stay, or try for a second spin?</p>
        <div class="row"><button type="button" class="btn big" data-act="bwStay">✋ Stay at ${t}</button><button type="button" class="btn primary big" data-act="bwEarn">🎯 Earn a second spin</button></div>`;
    side = `<div class="word sm" style="color:${P.color}">${esc(P.name)}’s turn</div>${table}${action}`;
  }
  return `<div class="bw-layout"><div class="bw-left">${drum}</div><div class="bw-right">${side}</div></div>`;
}
Object.assign(actions, {
  bwGo: () => { pp.phase = 'bw'; render(); },
  bwSpin: () => bwSpin(),
  bwEarn: () => bwEarnSpin(),
  bwAns: el => bwAnswer(+el.dataset.i),
  bwStay: () => bwStay(),
  bwNextP: () => bwNextPlayer(),
  bwResults: () => { pp.phase = 'over'; ppFinish(); render(); },
});
document.addEventListener('keydown', e => {
  if (view.name !== 'priceParty' || pp?.phase !== 'bw' || $('#dlg').open) return;
  if (pp.bw.q && pp.bw.q.ok == null && /^[1-4]$/.test(e.key)) bwAnswer(+e.key - 1);
  else if (e.key === ' ') { e.preventDefault(); bwSpin(); }
});
