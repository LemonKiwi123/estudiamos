'use strict';
/* ================= Elephant run: an endless runner where answering correctly makes the elephant jump =================
   Book stacks roll toward the elephant, each labelled with a word (card front). Pick its meaning before it arrives
   to jump over it. A wrong answer or running out of time means a bump and one lost heart. Speed increases. */
const RW = 800, RH = 270, GROUND = 222, ELE_X = 70, ELE = 92, JUMP_T = 0.82, JUMP_H = 118;
let run = null;
const runnerPool = deckId => cardsOf(deckId).filter(c => c.front.trim() && c.back.trim());   // (used by several games)
/* Words you struggle with come back more often (Lexicon Saga and Wordling Trails).
   S.gameMiss[cardId] is a struggle score: +2 for a miss, -1 for a right answer (0 to 6), kept between sessions.
   - A missed word comes back again 3 to 5 questions later.
   - Each time the shuffled list is rebuilt, a word with a struggle score is put in it 1 or 2 extra times.
   g is the game's state: { pool, queue, retry, asked }. */
const gmScore = id => (S.gameMiss || {})[id] || 0;
function gmPick(g) {
  g.retry ||= []; g.asked ||= 0;
  g.retry = g.retry.filter(r => g.asked <= r.at + 8 && g.pool.some(c => c.id === r.id));   // forget stale ones
  const due = g.retry.find(r => g.asked >= r.at && r.id !== g.last);
  if (due) { const c = g.pool.find(x => x.id === due.id); if (c) return (g.last = c.id, c); }
  if (!g.queue.length) {
    const list = g.pool.slice();
    for (const c of g.pool) { const s = gmScore(c.id); for (let k = 0; k < Math.min(2, Math.ceil(s / 2)); k++) list.push(c); }
    g.queue = shuffle(list);
  }
  let c = g.queue.pop();
  if (c && c.id === g.last && g.queue.length) { const i = g.queue.findIndex(x => x.id !== c.id); if (i >= 0) [c, g.queue[i]] = [g.queue[i], c]; }
  g.last = c?.id; return c;
}
function gmResult(g, card, ok) {
  if (!card) return;
  g.retry ||= []; g.asked = (g.asked || 0) + 1;
  g.retry = g.retry.filter(r => r.id !== card.id);
  const m = S.gameMiss ||= {}, s = Math.max(0, Math.min(6, (m[card.id] || 0) + (ok ? -1 : 2)));
  if (s) m[card.id] = s; else delete m[card.id];
  if (!ok) g.retry.push({ id: card.id, at: g.asked + 3 + Math.floor(Math.random() * 3) });
}
/* Elephant run uses cards that have one line on each side: a word, a phrase or a sentence are all fine.
   "Stacked" cards with several lines (like a verb chart: Golpear / Yo golpeo / Tú golpeas…) are left out,
   and so are cards with the same text on both sides (the answer would be the question). */
const runOneWord = t => {
  const s = String(t || '').trim();
  if (!s || /[\r\n]/.test(s)) return '';
  return s.replace(/\s*[\[(][^\])]*[\])]/g, '').replace(/[¡!¿?.,;:]+/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
};
const runWordPool = deckId => cardsOf(deckId).filter(c => { const f = runOneWord(c.front), b = runOneWord(c.back); return f && b && f !== b; });
const svgImg = svg => { const i = new Image(); i.src = 'data:image/svg+xml,' + encodeURIComponent(svg); return i; };
let RUN_IMGS = null;
function runImgs() {   // the elephant is the star of this game, so it's drawn in every look (also the professional one)
  return RUN_IMGS ||= { happy: svgImg(mascot(ELE, 'happy', { always: true })), party: svgImg(mascot(ELE, 'party', { always: true })), hurt: svgImg(mascot(ELE, 'sleepy', { always: true })) };
}
// split text into lines no wider than max (canvas units); a single very long word is kept whole
function runWrap(ctx, text, max) {
  const words = String(text).split(/\s+/), lines = []; let line = '';
  for (const w of words) { const t = line ? line + ' ' + w : w; if (line && ctx.measureText(t).width > max) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}
const imgReady = img => img && img.complete && img.naturalWidth > 0;   // a picture that failed to load can't be drawn (it throws)
function startRunner(deckId) {
  const pool = runWordPool(deckId);
  if (pool.length < 3) { toast('Elephant run needs at least 3 cards with one line on each side (not stacked like a verb chart)'); return; }
  runImgs();
  run = { deckId, pool, queue: [], obstacles: [], speed: 175, dist: 0, hearts: 3, score: 0, results: [], over: false, paused: false,
    jump: null, bump: 0, start: Date.now(), gap: 1.1, last: 0, loop: 0, cheer: 0,
    clouds: Array.from({ length: 4 }, (_, i) => ({ x: 120 + i * 210, y: 30 + Math.random() * 50, s: 0.6 + Math.random() * 0.6 })) };
  initWorld();
  for (let x = 40; x < RW; x += 130 + Math.random() * 120) run.props.push({ x, type: BIOMES[0].prop, s: 0.75 + Math.random() * 0.45, gap: 120, hue: Math.random() });
  go({ name: 'runner', deckId });
}
function nextRunCard() {
  if (!run.queue.length) run.queue = shuffle(run.pool);
  return run.queue.pop();
}
function spawnObstacle() {
  const c = nextRunCard(), books = 2 + Math.floor(Math.random() * 2);
  const opts = pickOptions(c.back, run.pool.filter(x => x.id !== c.id).map(x => x.back), 3);
  run.obstacles.push({ card: c, x: RW + 20, w: 54, h: books * 17, books, colors: shuffle(['#ef8354', '#4f9dde', '#f2c14e', '#7bc67e', '#c77dff', '#ff7aa2']).slice(0, books), state: 'pending', hit: false, opts, picked: null });
  if (autoplayOn()) speak(c.front, deckById(run.deckId).frontLang);
  updateRunUI();
}
const pendingObstacle = () => run?.obstacles.find(o => o.state === 'pending');
function runPick(i) {
  const o = pendingObstacle(); if (!o || run.over || run.paused) return;
  o.picked = i;
  const ok = norm(o.opts[i]) === norm(o.card.back);
  o.state = ok ? 'cleared' : 'failed';
  run.results.push({ cardId: o.card.id, q: o.card.front, a: o.card.back, given: o.opts[i], ok });
  if (ok) { run.score++; run.speed = Math.min(480, run.speed + 10); run.cheer = 0.9; }
  updateRunUI(true);
}
function loseHeart(o) {
  run.hearts--; run.bump = 0.6; o.hit = true;
  if (o.state === 'pending') { o.state = 'failed'; run.results.push({ cardId: o.card.id, q: o.card.front, a: o.card.back, given: null, ok: false }); updateRunUI(true); }
  if (run.hearts <= 0) setTimeout(endRunner, 700);
}
function endRunner() {
  if (!run || run.over) return;
  run.over = true;
  S.runnerBest ||= {};
  const prev = S.runnerBest[run.deckId] || 0, best = Math.max(prev, run.score);
  S.runnerBest[run.deckId] = best;
  const right = run.results.filter(r => r.ok).length;
  addHistory({ type: 'runner', deckId: run.deckId, deckName: deckById(run.deckId)?.name, correct: right, total: run.results.length,
    score: run.results.length ? Math.round(right / run.results.length * 100) : 0, timeMs: Date.now() - run.start,
    detail: `${run.score} jump${run.score === 1 ? '' : 's'}${run.score > prev && prev > 0 ? ' · new best!' : ''}`, items: run.results });
  const missed = run.results.filter(r => !r.ok), d = deckById(run.deckId);
  const box = $('#runOver'); if (!box) return;
  box.innerHTML = `<div class="run-card">
      ${mascot(96, run.score > prev ? 'party' : 'happy')}
      <div class="word sm">${run.score > prev && prev > 0 ? 'New best score!' : 'Game over'}</div>
      <div><span class="score" style="font-size:44px">${run.score}</span> <span class="muted">jump${run.score === 1 ? '' : 's'} · best ${best}</span></div>
      ${friendTip('monkey', 'result', { pct: run.results.length ? right / run.results.length * 100 : 0 }, { compact: true, size: 48 })}
      ${missed.length ? `<div class="muted small" style="max-width:420px">Missed: ${missed.map(m => `<b>${esc(m.q)}</b> = ${esc(m.a)}`).join(' · ')}</div>` : '<div class="muted small">No mistakes. Amazing!</div>'}
      <div class="row" style="justify-content:center">
        <button type="button" class="btn primary" data-act="runAgain" data-id="${d.id}">Play again <kbd style="background:transparent;color:inherit;border-color:currentColor;opacity:.7">Enter</kbd></button>
        <button type="button" class="btn" data-act="games" data-id="${d.id}">Other games</button>
      </div></div>`;
  box.hidden = false;
  setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  $('#runOpts').innerHTML = ''; $('#runQ').innerHTML = '';
}
function updateRunUI(flash) {
  const qEl = $('#runQ'), oEl = $('#runOpts'); if (!qEl || !run || run.over) return;
  const o = pendingObstacle();
  if (!o) {
    const last = [...run.obstacles].reverse().find(x => x.picked != null);
    if (flash && last) {
      oEl.querySelectorAll('.opt').forEach((b, i) => {
        b.disabled = true;
        if (norm(last.opts[i]) === norm(last.card.back)) b.classList.add('correct'); else if (i === last.picked) b.classList.add('wrong');
      });
      qEl.innerHTML = last.state === 'cleared' ? '<b style="color:var(--good)">Jump! ✓</b>' : `<b style="color:var(--again)">Oops!</b> <b>${esc(last.card.front)}</b> = ${esc(last.card.back)}`;
    } else if (!oEl.children.length) qEl.innerHTML = '<span class="muted">Get ready…</span>';
    return;
  }
  if (run.shown === o) return;
  run.shown = o;
  const d = deckById(run.deckId);
  qEl.innerHTML = `What does <b class="run-word">${esc(o.card.front)}</b> mean? ${speakBtn(o.card.front, d.frontLang)}`;
  oEl.innerHTML = o.opts.map((t, i) => `<button type="button" class="opt" data-act="runPick" data-i="${i}"><span class="k">${i + 1}</span><span>${esc(t)}</span></button>`).join('');
}

/* ---------- Game loop ---------- */
function initRunnerCanvas() {
  const cv = $('#runCanvas'); if (!cv || !run) return;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  cv.width = RW * dpr; cv.height = RH * dpr;
  run.ctx = cv.getContext('2d'); run.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); run.dpr = dpr;
  cv.onclick = e => {   // click the elephant to make it trumpet
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * RW / r.width, y = (e.clientY - r.top) * RH / r.height;
    if (x > ELE_X && x < ELE_X + ELE && y > GROUND - ELE - JUMP_H && y < GROUND + 6) trumpet();
  };
  run.shown = null; updateRunUI();
  if (run.over) { run.over = false; endRunner(); }
  if (!run.loop) { run.last = performance.now(); run.loop = requestAnimationFrame(runFrame); }
  runStartBackup();
}
/* The game runs on real time, not on how often the browser draws.
   Browsers slow animation down a lot (battery saver, Edge "efficiency mode", a window that isn't in front: sometimes only
   2 frames a second). The game used to slow down with it and seemed stuck on "Get ready…". Now each frame catches up on the
   real time that passed, in small steps, and a backup clock keeps it going if the browser stops drawing frames often. */
let runBackupTimer = 0;
function runTick(now) {
  if (!run || view.name !== 'runner') return false;
  let el = (now - run.last) / 1000; run.last = now;
  if (!(el >= 0)) el = 0;
  if (el > 0.5) el = 0.05;   // back after a long break (another app, the PC asleep): carry on instead of jumping ahead
  const paused = run.paused || $('#dlg').open || document.hidden;
  if (!paused && !run.over) while (el > 0 && !run.over) { const step = Math.min(0.05, el); runUpdate(step); el -= step; }
  try { runDraw(); }
  catch (e) {   // a drawing problem must never stop the game
    if (!run.drawErr) { run.drawErr = true; console.error('Elephant run: drawing problem', e); }
    try { run.ctx?.restore(); } catch {}
  }
  const p = $('#runPause'); if (p) p.hidden = !run.paused;
  run.lastTick = performance.now();
  return true;
}
function runFrame(ts) {
  if (!runTick(ts)) { if (run) run.loop = 0; return; }
  run.loop = requestAnimationFrame(runFrame);
}
function runStartBackup() {
  clearInterval(runBackupTimer);
  runBackupTimer = setInterval(() => {
    if (!run || view.name !== 'runner') { clearInterval(runBackupTimer); runBackupTimer = 0; return; }
    if (performance.now() - (run.lastTick || 0) > 120) runTick(performance.now());   // the browser is holding back frames
  }, 50);
}
function runUpdate(dt) {
  run.dist += run.speed * dt;
  run.clouds.forEach(c => { c.x -= run.speed * 0.12 * c.s * dt; if (c.x < -80) { c.x = RW + 40; c.y = 25 + Math.random() * 55; } });
  worldUpdate(dt);
  if (run.bump > 0) run.bump -= dt;
  if (run.cheer > 0) run.cheer -= dt;
  const front = ELE_X + ELE - 22;
  for (const o of run.obstacles) {
    o.x -= run.speed * dt;
    // jump early enough to sail over the books: at slow speeds the jump starts closer, so it still clears
    if (o.state === 'cleared' && !o.jumped && o.x - front < Math.max(18, run.speed * JUMP_T * 0.32 - Math.max(0, 230 - run.speed) * 0.25)) { o.jumped = true; run.jump = { t: 0 }; }
    if (o.state !== 'cleared' && !o.hit && o.x <= front - 4) loseHeart(o);
  }
  if (run.jump) { run.jump.t += dt / JUMP_T; if (run.jump.t >= 1) run.jump = null; }
  run.obstacles = run.obstacles.filter(o => o.x + o.w > -30);
  const last = run.obstacles.at(-1);
  if (!run.hearts) return;
  if (!last || last.x + last.w < ELE_X) { run.gap -= dt; if (run.gap <= 0) { spawnObstacle(); run.gap = Math.max(0.35, 0.9 - run.score * 0.02); } }
  if (!pendingObstacle() && run.obstacles.every(o => o.x + o.w < ELE_X)) updateRunUI();
}
function drawHeart(ctx, cx, cy, r, full, dark) {
  ctx.save(); ctx.translate(cx, cy); ctx.beginPath();
  ctx.moveTo(0, r * 0.9);
  ctx.bezierCurveTo(-r * 1.6, -r * 0.2, -r * 0.8, -r * 1.3, 0, -r * 0.45);
  ctx.bezierCurveTo(r * 0.8, -r * 1.3, r * 1.6, -r * 0.2, 0, r * 0.9);
  ctx.fillStyle = full ? '#ef476f' : (dark ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.12)'); ctx.fill();
  if (full) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-r * 0.45, -r * 0.45, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
/* ---------- World: landscapes that change with distance + day/night cycle ---------- */
const BIOME_LEN = 4500, CYCLE = 75;    // px of running per landscape, seconds per full day
const BIOMES = [
  { name: 'Meadow', emoji: '🌼', far: '#b9dcae', near: '#94cc84', ground: '#e9d8b4', line: '#c9b48c', amp: 16, jag: 0, prop: 'flower' },
  { name: 'Savanna', emoji: '🦒', far: '#eed39a', near: '#ddb86c', ground: '#e8c98f', line: '#c49e5c', amp: 10, jag: 0, prop: 'acacia' },
  { name: 'Desert', emoji: '🌵', far: '#f0cf98', near: '#e4b46e', ground: '#f1d6a0', line: '#d2ad72', amp: 22, jag: 0.25, prop: 'cactus' },
  { name: 'Jungle', emoji: '🌴', far: '#72b585', near: '#3f8f57', ground: '#b49c72', line: '#8c7650', amp: 20, jag: 0, prop: 'palm' },
  { name: 'Snowy peaks', emoji: '🏔️', far: '#b9c8e2', near: '#e6eef9', ground: '#f3f6fb', line: '#c4d0e2', amp: 46, jag: 1, prop: 'pine' },
  { name: 'Beach', emoji: '🏖️', far: '#6cc0e6', near: '#4aa9d8', ground: '#f2e2b2', line: '#d6c087', amp: 3, jag: 0, prop: 'umbrella' },
];
const SKY = { day: ['#7cc8ff', '#e4f5ff'], dusk: ['#ff8f6b', '#ffd59a'], night: ['#0a1230', '#28305e'], dawn: ['#95a9ff', '#ffc9d6'] };
const NIGHT_TINT = '#10173a';
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mix(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
function skyAt(p) {   // p = 0..1 through the day: day → dusk → night → dawn → day
  const seg = [[0, 'day', 0], [0.44, 'day', 0], [0.5, 'dusk', 0.45], [0.56, 'night', 1], [0.88, 'night', 1], [0.94, 'dawn', 0.4], [1, 'day', 0]];
  for (let i = 1; i < seg.length; i++) if (p <= seg[i][0]) {
    const [p0, a, n0] = seg[i - 1], [p1, b, n1] = seg[i], t = (p - p0) / (p1 - p0 || 1);
    return { top: mix(SKY[a][0], SKY[b][0], t), bottom: mix(SKY[a][1], SKY[b][1], t), night: n0 + (n1 - n0) * t };
  }
  return { top: SKY.day[0], bottom: SKY.day[1], night: 0 };
}
function biomeAt(dist) {
  const s = Math.max(0, dist) / BIOME_LEN, i = Math.floor(s), f = s - i, a = BIOMES[i % BIOMES.length], b = BIOMES[(i + 1) % BIOMES.length];
  const t = f > 0.82 ? (f - 0.82) / 0.18 : 0;
  const c = k => mix(a[k], b[k], t);
  return { index: i, cur: a, next: b, t, far: c('far'), near: c('near'), ground: c('ground'), line: c('line'), amp: a.amp + (b.amp - a.amp) * t, jag: a.jag + (b.jag - a.jag) * t, prop: f > 0.9 ? b.prop : a.prop };
}
function initWorld() {
  run.time = CYCLE * 0.08;       // start in the morning
  run.props = []; run.biome = 0; run.banner = { text: `${BIOMES[0].emoji} ${BIOMES[0].name}`, t: 2.4 };
  run.stars = Array.from({ length: 46 }, () => ({ x: Math.random() * RW, y: Math.random() * (GROUND - 90), r: Math.random() * 1.3 + 0.4, tw: Math.random() * 6 }));
}
function worldUpdate(dt) {
  if (run.time == null) initWorld();
  run.time += dt;
  for (const p of run.props) p.x -= run.speed * 0.55 * dt;
  run.props = run.props.filter(p => p.x > -80);
  const last = run.props.at(-1);
  if (!last || last.x < RW - last.gap) {
    const b = biomeAt(run.dist + RW * 1.8);
    run.props.push({ x: RW + 60, type: b.prop, s: 0.75 + Math.random() * 0.45, gap: 90 + Math.random() * 170, hue: Math.random() });
  }
  const bi = biomeAt(run.dist).index;
  if (bi !== run.biome && biomeAt(run.dist).t === 0) { run.biome = bi; const b = BIOMES[bi % BIOMES.length]; run.banner = { text: `${b.emoji} ${b.name}`, t: 2.4 }; }
  if (run.banner) { run.banner.t -= dt; if (run.banner.t <= 0) run.banner = null; }
}
function hillPath(ctx, base, amp, jag, wave, offset) {
  ctx.beginPath(); ctx.moveTo(0, GROUND);
  for (let x = 0; x <= RW; x += 8) {
    const u = (x + offset) / wave, smooth = 0.6 + 0.4 * Math.sin(u) * Math.cos(u * 0.37), tri = 1 - Math.abs((u / Math.PI) % 2 - 1) * 1.6;
    ctx.lineTo(x, base - amp * ((1 - jag) * smooth + jag * Math.max(0.05, tri)));
  }
  ctx.lineTo(RW, GROUND); ctx.closePath();
}
function drawProp(ctx, p, night) {
  const s = p.s, x = p.x, g = GROUND;
  ctx.save(); ctx.translate(x, g); ctx.scale(s, s);
  const dim = c => mix(c, NIGHT_TINT, night * 0.55);
  switch (p.type) {
    case 'flower': {
      ctx.strokeStyle = dim('#4e9a51'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -26); ctx.stroke();
      ctx.fillStyle = dim(['#ff7aa2', '#ffd166', '#c77dff', '#ffffff'][Math.floor(p.hue * 4)]);
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(Math.cos(k * 1.26) * 6, -28 + Math.sin(k * 1.26) * 6, 4.5, 0, 7); ctx.fill(); }
      ctx.fillStyle = dim('#f5a623'); ctx.beginPath(); ctx.arc(0, -28, 3.6, 0, 7); ctx.fill(); break;
    }
    case 'acacia': {
      ctx.fillStyle = dim('#7a5230'); ctx.fillRect(-4, -54, 8, 54); ctx.beginPath(); ctx.moveTo(-2, -40); ctx.lineTo(-22, -60); ctx.lineTo(-18, -62); ctx.lineTo(2, -46); ctx.fill();
      ctx.fillStyle = dim('#6f9a3c'); ctx.beginPath(); ctx.ellipse(0, -66, 46, 11, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(-20, -62, 24, 8, 0, 0, 7); ctx.fill(); break;
    }
    case 'cactus': {
      ctx.fillStyle = dim('#4caf6a'); roundRect(ctx, -8, -60, 16, 60, 8); ctx.fill();
      roundRect(ctx, -24, -42, 10, 24, 5); ctx.fill(); ctx.fillRect(-18, -24, 12, 8);
      roundRect(ctx, 14, -50, 10, 22, 5); ctx.fill(); ctx.fillRect(6, -32, 12, 8);
      ctx.strokeStyle = dim('#3a8f55'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, -56); ctx.lineTo(0, -4); ctx.stroke(); break;
    }
    case 'palm': {
      ctx.strokeStyle = dim('#8b6a3e'); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -40, 2, -78); ctx.stroke();
      ctx.fillStyle = dim('#2f8f4e');
      for (let k = 0; k < 6; k++) { ctx.save(); ctx.translate(2, -78); ctx.rotate(-2.6 + k * 0.95); ctx.beginPath(); ctx.ellipse(22, 0, 24, 6, 0.25, 0, 7); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = dim('#6b4a2a'); ctx.beginPath(); ctx.arc(0, -74, 4, 0, 7); ctx.arc(6, -73, 4, 0, 7); ctx.fill(); break;
    }
    case 'pine': {
      ctx.fillStyle = dim('#6b4a2a'); ctx.fillRect(-4, -14, 8, 14);
      for (let k = 0; k < 3; k++) {
        const y = -14 - k * 20, w = 30 - k * 7;
        ctx.fillStyle = dim('#2f6f55'); ctx.beginPath(); ctx.moveTo(-w, y); ctx.lineTo(0, y - 30); ctx.lineTo(w, y); ctx.fill();
        ctx.fillStyle = dim('#ffffff'); ctx.beginPath(); ctx.moveTo(-w * 0.45, y - 16); ctx.lineTo(0, y - 30); ctx.lineTo(w * 0.45, y - 16); ctx.quadraticCurveTo(0, y - 12, -w * 0.45, y - 16); ctx.fill();
      }
      break;
    }
    case 'umbrella': {
      if (p.hue < 0.5) {
        ctx.strokeStyle = dim('#8a7a66'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-6, -58); ctx.stroke();
        const cols = ['#ef476f', '#ffffff', '#4f9dde', '#ffffff'];
        for (let k = 0; k < 4; k++) { ctx.fillStyle = dim(cols[k]); ctx.beginPath(); ctx.moveTo(-6, -64); ctx.arc(-6, -54, 34, Math.PI + k * Math.PI / 4, Math.PI + (k + 1) * Math.PI / 4); ctx.closePath(); ctx.fill(); }
      } else {
        ctx.fillStyle = dim('#ff9f80'); ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(0, -22, 12, 0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = dim('#e57a5a'); ctx.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(k * 5, 0); ctx.stroke(); }
      }
      break;
    }
  }
  ctx.restore();
}
function drawWorld(ctx) {
  const phase = ((run.time || 0) % CYCLE) / CYCLE, sky = skyAt(phase), night = sky.night, b = biomeAt(run.dist);
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, sky.top); g.addColorStop(1, sky.bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, RW, RH);
  // stars
  if (night > 0.05) for (const s of run.stars) {
    ctx.globalAlpha = night * (0.55 + 0.45 * Math.sin((run.time || 0) * 2 + s.tw));
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // sun (day half) and moon (night half) travel across the sky
  const arc = f => [40 + f * (RW - 80), 168 - Math.sin(f * Math.PI) * 132];
  if (phase < 0.56) {
    const [x, y] = arc(phase / 0.56), warm = Math.max(0, 1 - Math.sin(phase / 0.56 * Math.PI) * 1.6);
    ctx.fillStyle = mix('#ffe27a', '#ff8a4c', warm);
    ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(x, y, 34, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(x, y, 22, 0, 7); ctx.fill();
  }
  if (phase > 0.48) {
    const [x, y] = arc((phase - 0.48) / 0.52);
    ctx.globalAlpha = Math.min(1, night * 1.4);
    ctx.fillStyle = '#f4f1dc'; ctx.beginPath(); ctx.arc(x, y, 18, 0, 7); ctx.fill();
    ctx.fillStyle = sky.top; ctx.beginPath(); ctx.arc(x + 8, y - 5, 15, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // clouds
  ctx.fillStyle = mix('#ffffff', '#3b4470', night * 0.8); ctx.globalAlpha = 0.9 - night * 0.45;
  for (const c of run.clouds) for (const [dx, dy, rx, ry] of [[0, 0, 34, 13], [22, -8, 22, 13], [-20, -4, 18, 10]]) { ctx.beginPath(); ctx.ellipse(c.x + dx * c.s, c.y + dy * c.s, rx * c.s, ry * c.s, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
  // far + near hills (beach: the far layer is the sea)
  const dimc = c => mix(c, NIGHT_TINT, night * 0.6);
  ctx.fillStyle = dimc(b.far); hillPath(ctx, GROUND - 34, b.amp * 1.4, b.jag, 120, run.dist * 0.12); ctx.fill();
  if (b.jag > 0.5) { ctx.fillStyle = `rgba(255,255,255,${0.75 * b.jag * (1 - night * 0.5)})`; hillPath(ctx, GROUND - 34 - b.amp * 0.9, b.amp * 0.5, 1, 120, run.dist * 0.12); ctx.fill(); }
  ctx.fillStyle = dimc(b.near); hillPath(ctx, GROUND - 8, b.amp * 0.7, b.jag * 0.6, 80, run.dist * 0.3); ctx.fill();
  // scenery
  for (const p of run.props || []) drawProp(ctx, p, night);
  // ground
  ctx.fillStyle = dimc(b.ground); ctx.fillRect(0, GROUND, RW, RH - GROUND);
  ctx.strokeStyle = dimc(b.line); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, GROUND); ctx.lineTo(RW, GROUND); ctx.stroke();
  ctx.fillStyle = dimc(b.line);
  for (let i = 0; i < 18; i++) { const x = ((i * 53 - run.dist) % (RW + 60) + RW + 60) % (RW + 60) - 30; ctx.fillRect(x, GROUND + 12 + (i % 3) * 11, 10 + (i % 4) * 4, 3); }
  return night;
}
function drawBanner(ctx) {
  if (!run.banner) return;
  const a = Math.min(1, run.banner.t / 0.5, (2.4 - run.banner.t) / 0.3);
  ctx.globalAlpha = Math.max(0, a);
  ctx.font = '700 20px "Segoe UI", "Segoe UI Emoji", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(run.banner.text).width + 40;
  ctx.fillStyle = 'rgba(255,255,255,.92)'; roundRect(ctx, RW / 2 - w / 2, 46, w, 38, 19); ctx.fill();
  ctx.fillStyle = '#1c1b19'; ctx.fillText(run.banner.text, RW / 2, 66);
  ctx.globalAlpha = 1;
}
function runDraw() {
  const ctx = run.ctx; if (!ctx) return;
  // start every frame from a clean slate, so one bad frame can never leave the picture shifted or dimmed
  ctx.setTransform(run.dpr || 1, 0, 0, run.dpr || 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  const night = drawWorld(ctx), dark = night > 0.5;
  // obstacles: stacks of books with a word label
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (const o of run.obstacles) {
    ctx.save();
    const tilt = o.hit ? Math.min(1, (o.hitT = (o.hitT || 0) + 0.04)) : 0;
    ctx.translate(o.x + o.w / 2, GROUND); ctx.rotate(tilt * 0.5);
    for (let b = 0; b < o.books; b++) {
      const y = -(b + 1) * 17, inset = (b % 2) * 4 - 2;
      ctx.fillStyle = o.colors[b]; roundRect(ctx, -o.w / 2 + inset, y, o.w - 4, 15, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(-o.w / 2 + inset + 6, y + 4, o.w - 16, 2.5);
      ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(o.w / 2 + inset - 10, y, 4, 15);
    }
    ctx.restore();
    // the sign shows the whole word or sentence: long ones wrap onto more lines instead of being cut off
    const text = (o.state === 'cleared' ? '✓ ' : o.state === 'failed' ? '✗ ' : '') + o.card.front;
    const size = text.length > 40 ? 13 : 15, lh = size + 4;
    ctx.font = `600 ${size}px "Segoe UI", sans-serif`;
    const lines = o.lines && o.linesFor === text ? o.lines : (o.linesFor = text, o.lines = runWrap(ctx, text, 230));
    const lw = Math.max(44, Math.max(...lines.map(l => ctx.measureText(l).width)) + 22), bh = lines.length * lh + 10;
    const bottom = GROUND - o.h - 12, top = bottom - bh, cx = Math.min(RW - lw / 2 - 4, Math.max(lw / 2 + 4, o.x + o.w / 2));
    ctx.fillStyle = o.state === 'cleared' ? '#23905a' : o.state === 'failed' ? '#cf3f3f' : (dark ? '#2a2f45' : '#ffffff');
    roundRect(ctx, cx - lw / 2, top, lw, bh, Math.min(14, bh / 2)); ctx.fill();
    ctx.strokeStyle = o.state === 'pending' ? cssVar('--accent') : 'transparent'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = o.state === 'pending' ? (dark ? '#fff' : '#1c1b19') : '#fff';
    lines.forEach((l, i) => ctx.fillText(l, cx, top + 5 + lh / 2 + i * lh + 1));
  }
  // elephant
  const imgs = runImgs(), img = run.bump > 0 ? imgs.hurt : (run.jump || run.cheer > 0 ? imgs.party : imgs.happy);
  let y = GROUND - ELE + 8, x = ELE_X, rot = 0;
  if (run.jump) { const p = run.jump.t; y -= JUMP_H * 4 * p * (1 - p); rot = (0.5 - p) * -0.25; }
  else if (!run.over && run.hearts > 0) y -= Math.abs(Math.sin(run.dist / 38)) * 5;
  if (run.bump > 0) { x += Math.sin(run.bump * 60) * 4; rot = -0.12; }
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.ellipse(ELE_X + ELE / 2, GROUND + 3, 30 * (run.jump ? 0.7 : 1), 5, 0, 0, Math.PI * 2); ctx.fill();
  if (!imgReady(img)) { ctx.font = `${ELE - 6}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🐘', x + ELE / 2, y + ELE / 2); }
  else { ctx.save(); ctx.translate(x + ELE / 2, y + ELE / 2); ctx.rotate(rot); ctx.filter = night > 0.05 ? `brightness(${(1 - night * 0.28).toFixed(2)})` : 'none'; ctx.drawImage(img, -ELE / 2, -ELE / 2, ELE, ELE); ctx.restore(); }
  drawBanner(ctx);
  // HUD
  for (let i = 0; i < 3; i++) drawHeart(ctx, 26 + i * 28, 24, 11, i < run.hearts, dark);
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.font = '700 18px "Segoe UI", sans-serif'; ctx.fillStyle = dark ? '#fff' : '#1c1b19';
  ctx.fillText(`${run.score}  ·  best ${Math.max(run.score, (S.runnerBest || {})[run.deckId] || 0)}`, RW - 16, 24);
}

/* ---------- View ---------- */
views.runner = () => {
  const d = deckById(run?.deckId); if (!d) { view = { name: 'home' }; return views.home(); }
  return `
    <div class="study-top">
      <button type="button" class="btn ghost" data-act="games" data-id="${d.id}">← Games</button>
      <div class="prompt-label muted">🐘 Elephant run · ${esc(d.name)}</div>
      <button type="button" class="btn sm" data-act="runPause">Pause <kbd>P</kbd></button>
    </div>
    <div class="runner-wrap">
      <canvas id="runCanvas" aria-label="Elephant run game"></canvas>
      <div class="run-over" id="runOver" hidden></div>
      <div class="run-over" id="runPause" hidden><div class="run-card"><div class="word sm">Paused</div><button type="button" class="btn primary" data-act="runPause">Continue <kbd style="background:transparent;color:inherit;border-color:currentColor;opacity:.7">P</kbd></button></div></div>
    </div>
    <div class="run-q" id="runQ"></div>
    <div class="options run-opts" id="runOpts"></div>
    <div class="shortcuts">Pick the meaning before the books reach you · keys 1–3 · P pause</div>`;
};
Object.assign(actions, {
  runPick: el => runPick(+el.dataset.i),
  runAgain: el => startRunner(el.dataset.id),
  runPause: () => { if (run && !run.over) { run.paused = !run.paused; run.last = performance.now(); } },
});
document.addEventListener('keydown', e => {
  if (view.name !== 'runner' || !run || $('#dlg').open || e.ctrlKey || e.altKey) return;
  if (run.over) { if (e.key === 'Enter') { e.preventDefault(); startRunner(run.deckId); } return; }
  if (/^[1-3]$/.test(e.key)) { e.preventDefault(); runPick(+e.key - 1); }
  else if (e.key.toLowerCase() === 'p' || e.key === 'Escape') { e.preventDefault(); actions.runPause(); }
});
