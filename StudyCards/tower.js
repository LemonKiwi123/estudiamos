'use strict';
/* ================= Word Tower: a two-player stacking-blocks word game =================
   Each block in the tower shows a meaning. On your turn you're given a word: click the block with its meaning.
   Correct: the block slides out and is stacked on top, and the tower gets wobblier.
   Wrong (or out of time): the tower crashes and the other player wins. */
const TW_ROWS = 10, TW_COLORS = ['#3b54e8', '#cf3f3f', '#23905a', '#f2a516', '#8e44ad', '#16a085', '#ef8354', '#d63384'];
let tower = null, towerPrefs = { p1: '', p2: 'Player 2', c1: TW_COLORS[0], c2: TW_COLORS[1], timer: 0, dir: 'fb' };

function towerLabel(card, dir) { return dir === 'fb' ? card.back : card.front; }
function towerPrompt(card, dir) { return dir === 'fb' ? card.front : card.back; }
function newTower(deckId, prefs) {
  const d = deckById(deckId), pool = shuffle(runnerPool(deckId));
  let k = 0; const nextCard = () => pool[k++ % pool.length];
  const rows = [];
  for (let r = 0; r < TW_ROWS; r++) rows.push([0, 1, 2].map(() => { const c = nextCard(); return { id: uid(), cardId: c.id, label: towerLabel(c, prefs.dir) }; }));
  tower = { deckId, d, prefs, pool, k, rows, turn: 0, pulls: [0, 0], results: [], phase: 'play', prompt: null, start: Date.now(), deadline: 0, pulledId: null };
  tower.nextCard = () => tower.pool[tower.k++ % tower.pool.length];
  newPrompt();
}
/* A block can be taken unless it's in the top row(s) or it is the last block left in its row. */
function towerAvailable() {
  const rows = tower.rows, top = rows.length - 1, topFull = rows[top].filter(b => !b.removed).length === 3 && rows[top].length === 3;
  const lockedFrom = topFull ? top : top - 1;
  const out = [];
  rows.forEach((row, r) => {
    if (r >= lockedFrom) return;
    const left = row.filter(b => !b.removed).length;
    if (left <= 1) return;
    row.forEach(b => { if (!b.removed) out.push(b); });
  });
  return out;
}
function newPrompt() {
  const avail = towerAvailable();
  if (!avail.length) { tower.phase = 'draw'; return; }
  const b = avail[Math.floor(Math.random() * avail.length)], card = S.cards.find(c => c.id === b.cardId);
  tower.prompt = { card, text: towerPrompt(card, tower.prefs.dir), answer: b.label };
  tower.deadline = tower.prefs.timer ? Date.now() + tower.prefs.timer * 1000 : 0;
  const lang = tower.prefs.dir === 'fb' ? tower.d.frontLang : tower.d.backLang;
  if (autoplayOn()) setTimeout(() => speak(tower.prompt.text, lang), 250);
}
function towerGaps() { return tower.rows.reduce((a, r) => a + r.filter(b => b.removed).length, 0); }
function towerPick(blockId) {
  if (!tower || tower.phase !== 'play' || tower.busy) return;
  const avail = towerAvailable(), b = avail.find(x => x.id === blockId); if (!b) { toast('That block is locked. Try a lower one!'); return; }
  const p = tower.prompt, ok = norm(b.label) === norm(p.answer);
  tower.results.push({ player: tower.turn, cardId: p.card.id, q: p.text, a: p.answer, given: b.label, ok });
  if (!ok) { towerCollapse(blockId, `${towerName(tower.turn)} picked “${b.label}”`); return; }
  tower.busy = true; tower.pulls[tower.turn]++;
  const el = document.querySelector(`.tblock[data-id="${b.id}"]`); el?.classList.add('pulled');
  towerSound('slide');
  setTimeout(() => {
    b.removed = true;
    let top = tower.rows.at(-1); if (top.length === 3) { top = []; tower.rows.push(top); }
    const c = tower.nextCard(); top.push({ id: uid(), cardId: c.id, label: towerLabel(c, tower.prefs.dir), fresh: true });
    tower.turn = 1 - tower.turn; tower.busy = false;
    newPrompt(); render();
  }, 520);
}
function towerTimeout() {
  if (!tower || tower.phase !== 'play' || !tower.deadline || tower.busy) return;
  const p = tower.prompt;
  tower.results.push({ player: tower.turn, cardId: p.card.id, q: p.text, a: p.answer, given: null, ok: false });
  towerCollapse(null, `${towerName(tower.turn)} ran out of time`);
}
const towerName = i => (i === 0 ? tower.prefs.p1 : tower.prefs.p2) || `Player ${i + 1}`;
function towerCollapse(wrongId, why) {
  tower.phase = 'crash'; tower.loser = tower.turn; tower.why = why; tower.busy = true;
  towerSound('crash');
  const blocks = [...document.querySelectorAll('.tblock')], wrap = $('.tower');
  if (wrap) wrap.classList.add('crashing');
  const H = wrap ? wrap.getBoundingClientRect().height : 400;
  blocks.forEach(el => {
    const r = el.getBoundingClientRect(), fall = (wrap ? wrap.getBoundingClientRect().bottom : r.bottom) - r.bottom;
    const dx = (Math.random() - 0.5) * 360, rot = (Math.random() - 0.5) * 220, delay = Math.random() * 0.25 + (1 - fall / H) * 0.15;
    el.style.transition = `transform ${0.9 + Math.random() * 0.4}s cubic-bezier(.55,.05,.85,.5) ${delay.toFixed(2)}s`;
    el.style.transform = `translate(${dx.toFixed(0)}px, ${(fall + 10 + Math.random() * 30).toFixed(0)}px) rotate(${rot.toFixed(0)}deg)`;
    if (el.dataset.id === wrongId) el.classList.add('wrong');
  });
  setTimeout(() => { tower.phase = 'over'; tower.busy = false; recordTower(); render(); }, 1700);
}
function recordTower() {
  const winner = 1 - tower.loser, mine = tower.results.filter(r => r.player === 0);
  if (typeof addHistory === 'function') addHistory({ type: 'tower', deckId: tower.deckId, deckName: tower.d.name, correct: mine.filter(r => r.ok).length, total: mine.length,
    score: mine.length ? Math.round(mine.filter(r => r.ok).length / mine.length * 100) : 0, timeMs: Date.now() - tower.start,
    detail: `${towerName(0)} vs ${towerName(1)}: ${towerName(winner)} won`, items: tower.results.map(r => ({ cardId: r.cardId, q: r.q, a: r.a, given: r.given, ok: r.ok })) });
}
/* Wood knocks and a crash, synthesised. */
function towerSound(kind) {
  if (S.settings?.mascotSound === false) return;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  audioCtx ||= new AC(); const ac = audioCtx; if (ac.state === 'suspended') ac.resume();
  const knock = (t, f, vol) => {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle';
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.12);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.18);
  };
  const t0 = ac.currentTime + 0.01;
  if (kind === 'slide') { knock(t0, 520, 0.25); knock(t0 + 0.3, 380, 0.3); return; }
  for (let i = 0; i < 14; i++) knock(t0 + i * 0.06 + Math.random() * 0.05, 180 + Math.random() * 420, 0.18 + Math.random() * 0.15);
  const len = Math.floor(ac.sampleRate * 0.9), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
  const n = ac.createBufferSource(), lp = ac.createBiquadFilter(), g = ac.createGain(); lp.type = 'lowpass'; lp.frequency.value = 900; g.gain.value = 0.35;
  n.buffer = buf; n.connect(lp); lp.connect(g); g.connect(ac.destination); n.start(t0);
}

/* ---------- Views ---------- */
views.towerSetup = () => {
  const d = deckById(view.deckId); if (!d) { view = { name: 'home' }; return views.home(); }
  const me = typeof currentProfile === 'function' ? currentProfile() : null, others = (typeof profiles !== 'undefined' ? profiles.list : []).filter(p => p.id !== me?.id);
  const p = towerPrefs; p.p1 ||= me?.name || 'Player 1';
  const fb = esc(langName(d.frontLang)), bk = esc(langName(d.backLang));
  const swatches = (name, cur) => `<div class="row" style="gap:6px;margin-top:6px">${TW_COLORS.map(c => `<label class="swatch" style="background:${c}"><input type="radio" name="${name}" value="${c}" ${c === cur ? 'checked' : ''}></label>`).join('')}</div>`;
  return `
    <div class="crumbs"><a data-act="home">Decks</a> / <a data-act="openDeck" data-id="${d.id}">${esc(d.name)}</a> / <a data-act="games" data-id="${d.id}">Games</a> / Word Tower</div>
    <div class="row-between" style="margin-bottom:12px"><h2>🧱 Word Tower</h2></div>
    ${typeof friendTip === 'function' ? friendTip('monkey', 'tower') : ''}
    <form class="panel stack" id="towerForm">
      <p class="muted" style="margin:0">Two players take turns on this PC. Each turn you get a word: click the block with its meaning to pull it out and stack it on top.
        <b>Pick the wrong block and the tower crashes</b>, and the other player wins!</p>
      <div class="grid2">
        <div class="feat"><h4>Player 1</h4><label class="field">Name<input name="p1" maxlength="24" value="${esc(p.p1)}" required></label>${swatches('c1', p.c1)}</div>
        <div class="feat"><h4>Player 2</h4><label class="field">Name<input name="p2" id="twP2" maxlength="24" value="${esc(p.p2)}" required list="twProfiles"></label>
          ${others.length ? `<datalist id="twProfiles">${others.map(o => `<option value="${esc(o.name)}">`).join('')}</datalist><div class="muted small" style="margin-top:4px">Tip: start typing to pick another profile’s name.</div>` : ''}
          ${swatches('c2', p.c2)}</div>
      </div>
      <div class="grid2">
        <div><b>Each turn shows</b><div class="seg">
          <label><input type="radio" name="dir" value="fb" ${p.dir === 'fb' ? 'checked' : ''}>${fb} word → find the ${bk} block</label>
          <label><input type="radio" name="dir" value="bf" ${p.dir === 'bf' ? 'checked' : ''}>${bk} → find the ${fb} block</label></div></div>
        <div><b>Turn timer</b><div class="seg">${[[0, 'Off'], [10, '10 s'], [20, '20 s'], [30, '30 s']].map(([v, l]) => `<label><input type="radio" name="timer" value="${v}" ${p.timer === v ? 'checked' : ''}>${l}</label>`).join('')}</div></div>
      </div>
      <div class="row-between"><span class="muted small">Uses the ${runnerPool(d.id).length} cards in “${esc(d.name)}”.</span><button type="submit" class="btn primary big">Build the tower!</button></div>
    </form>`;
};
views.tower = () => {
  if (!tower) { view = { name: 'home' }; return views.home(); }
  const t = tower, p = t.prefs, avail = new Set(towerAvailable().map(b => b.id)), gaps = towerGaps();
  const wob = Math.min(3.2, gaps * 0.22), dur = Math.max(1.4, 3.2 - gaps * 0.07);
  const playerCard = i => `<div class="tw-player ${t.phase === 'play' && t.turn === i ? 'active' : ''} ${t.phase === 'over' && t.loser !== i ? 'winner' : ''}" style="--pc:${i ? p.c2 : p.c1}">
      <span class="tw-dot"></span><div><b>${esc(towerName(i))}</b><div class="muted small">${t.pulls[i]} block${t.pulls[i] === 1 ? '' : 's'} pulled</div></div>
      ${t.phase === 'play' && t.turn === i ? '<span class="pill" style="margin-left:auto">Your turn!</span>' : ''}${t.phase === 'over' && t.loser !== i ? '<span style="margin-left:auto;font-size:22px">🏆</span>' : ''}</div>`;
  const lang = p.dir === 'fb' ? t.d.frontLang : t.d.backLang;
  const fallen = (b, r) => {   // after a crash, blocks stay knocked down in a pile at the base
    if (t.phase !== 'over') return '';
    let h = 0; for (const ch of b.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const rnd = k => ((h >>> k) % 1000) / 1000;
    return ` style="transform:translate(${((rnd(1) - 0.5) * 340).toFixed(0)}px, ${(r * 41 + rnd(5) * 14 - 6).toFixed(0)}px) rotate(${((rnd(9) - 0.5) * 160).toFixed(0)}deg)"`;
  };
  const rows = t.rows.map((row, r) => `<div class="trow ${r % 2 ? 'alt' : ''}">${[0, 1, 2].map(i => {
      const b = row[i]; if (!b) return '<span class="tblock ghost"></span>';
      if (b.removed) return '<span class="tblock gap"></span>';
      if (t.phase === 'over') return `<span class="tblock locked fallen"${fallen(b, r)}><span>${esc(b.label)}</span></span>`;
      const can = avail.has(b.id) && t.phase === 'play';
      return `<button type="button" class="tblock ${can ? '' : 'locked'} ${b.fresh ? 'fresh' : ''}" data-act="towerPick" data-id="${b.id}" title="${esc(b.label)}" ${can ? '' : 'tabindex="-1"'}><span>${esc(b.label)}</span></button>`;
    }).join('')}</div>`).reverse().join('');
  t.rows.forEach(row => row.forEach(b => { b.fresh = false; }));
  const over = t.phase === 'over', winner = over ? 1 - t.loser : null, lastWrong = t.results.at(-1);
  return `
    <div class="study-top"><button type="button" class="btn ghost" data-act="towerQuit">← Games</button>
      <div class="prompt-label muted">🧱 Word Tower · ${esc(t.d.name)}</div><span class="muted small">${gaps} gap${gaps === 1 ? '' : 's'} · ${t.rows.length} levels</span></div>
    <div class="tw-players">${playerCard(0)}${playerCard(1)}</div>
    ${over ? `<div class="panel tw-over">
        ${mascot(96, 'party')}
        <div class="word sm" style="color:${winner ? p.c2 : p.c1}">${esc(towerName(winner))} wins! 🏆</div>
        <p class="muted" style="margin:0">💥 Crash! ${esc(t.why)}.${lastWrong && !lastWrong.ok ? ` The right answer for <b>${esc(lastWrong.q)}</b> was <b>${esc(lastWrong.a)}</b>.` : ''}</p>
        <p class="muted small" style="margin:0">${esc(towerName(0))} pulled ${t.pulls[0]} · ${esc(towerName(1))} pulled ${t.pulls[1]} · ${t.rows.length} levels high</p>
        <div class="row" style="justify-content:center"><button type="button" class="btn primary" data-act="towerAgain">Rematch</button>
          <button type="button" class="btn" data-act="towerSetup" data-id="${t.deckId}">Change players</button><button type="button" class="btn" data-act="games" data-id="${t.deckId}">Other games</button></div></div>`
      : t.phase === 'draw' ? `<div class="panel tw-over"><div class="word sm">No more blocks can be pulled. It’s a tie! 🤝</div><button type="button" class="btn primary" data-act="towerAgain">Play again</button></div>`
      : `<div class="tw-prompt" style="--pc:${t.turn ? p.c2 : p.c1}"><span class="muted small">${esc(towerName(t.turn))}, find the meaning of</span>
          <div class="row" style="justify-content:center;gap:8px"><span class="tw-word" lang="${esc(lang)}">${esc(t.prompt.text)}</span>${speakBtn(t.prompt.text, lang)}</div>
          ${p.timer ? `<div class="tw-timer"><div id="twTimer" style="width:100%"></div></div>` : ''}</div>`}
    <div class="tower-stage"><div class="tower ${t.phase === 'crash' || t.phase === 'over' ? 'crashing' : ''}" style="--wob:${wob}deg;--wobdur:${dur}s">${rows}</div><div class="tower-base"></div></div>
    <div class="shortcuts">Only blocks that are safe to pull can be clicked. The top rows and the last block in a row are locked.</div>`;
};

Object.assign(actions, {
  towerSetup: el => go({ name: 'towerSetup', deckId: el.dataset.id }),
  towerPick: el => towerPick(el.dataset.id),
  towerAgain: () => { const id = tower.deckId; newTower(id, tower.prefs); go({ name: 'tower' }); },
  towerQuit: () => {
    if (tower?.phase === 'play' && tower.results.length) confirmDlg('Leave the game?', 'The tower will be knocked down and this game won’t be saved.', 'Leave', () => go({ name: 'games', deckId: tower.deckId }));
    else go({ name: 'games', deckId: tower.deckId });
  },
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'towerForm') return;
  e.preventDefault(); const f = e.target;
  towerPrefs = { p1: f.p1.value.trim() || 'Player 1', p2: f.p2.value.trim() || 'Player 2', c1: f.c1.value, c2: f.c2.value === f.c1.value ? TW_COLORS.find(c => c !== f.c1.value) : f.c2.value, timer: +f.timer.value, dir: f.dir.value };
  newTower(view.deckId, towerPrefs); go({ name: 'tower' });
});
setInterval(() => {
  if (view.name !== 'tower' || !tower || tower.phase !== 'play' || !tower.deadline || tower.busy || $('#dlg').open) return;
  const left = tower.deadline - Date.now(), bar = $('#twTimer');
  if (bar) { bar.style.width = Math.max(0, left / (tower.prefs.timer * 1000) * 100) + '%'; bar.classList.toggle('low', left < 4000); }
  if (left <= 0) towerTimeout();
}, 100);
