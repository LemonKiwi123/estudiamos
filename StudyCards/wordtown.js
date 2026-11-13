'use strict';
/* ================= Word Town: a property-trading board game powered by your words =================
   2–4 players (any can be the computer). Roll, move around 24 spaces, and answer words to buy places,
   pay half rent, skip the Peanut Tax, leave the Library, and win Word Chance rewards. Own a whole color
   group to add bookshelves (higher rent). Richest player after the last turn wins (or last one standing). */
const WT_GROUPS = {
  brown: '#8d5b3e', sky: '#5bc0eb', pink: '#e86fa0', orange: '#f08c2e', red: '#e0473c', yellow: '#f2c14e', green: '#2fa36b', navy: '#3646a8',
};
const WT_SPACES = [
  { t: 'start', name: 'Start', icon: '🏁' },
  { t: 'prop', name: 'Alphabet Alley', g: 'brown', price: 60 },
  { t: 'chance', name: 'Word Chance', icon: '❓' },
  { t: 'prop', name: 'Accent Avenue', g: 'brown', price: 80 },
  { t: 'tax', name: 'Peanut Tax', icon: '🥜' },
  { t: 'prop', name: 'Vocab Valley', g: 'sky', price: 100 },
  { t: 'library', name: 'Library', icon: '📚' },
  { t: 'prop', name: 'Verb Village', g: 'sky', price: 120 },
  { t: 'prop', name: 'Noun Nook', g: 'pink', price: 140 },
  { t: 'chance', name: 'Word Chance', icon: '❓' },
  { t: 'prop', name: 'Pronoun Park', g: 'pink', price: 160 },
  { t: 'prop', name: 'Grammar Gardens', g: 'orange', price: 180 },
  { t: 'rest', name: 'Rest Stop', icon: '🌴' },
  { t: 'prop', name: 'Gerund Grove', g: 'orange', price: 200 },
  { t: 'prop', name: 'Syntax Street', g: 'red', price: 220 },
  { t: 'chance', name: 'Word Chance', icon: '❓' },
  { t: 'prop', name: 'Sentence Square', g: 'red', price: 240 },
  { t: 'prop', name: 'Idiom Island', g: 'yellow', price: 260 },
  { t: 'golib', name: 'Go to the Library', icon: '🚌' },
  { t: 'prop', name: 'Proverb Pier', g: 'yellow', price: 280 },
  { t: 'prop', name: 'Fluency Fields', g: 'green', price: 300 },
  { t: 'tax', name: 'Peanut Tax', icon: '🥜' },
  { t: 'prop', name: 'Polyglot Plaza', g: 'green', price: 320 },
  { t: 'prop', name: 'Dictionary Heights', g: 'navy', price: 400 },
];
const WT_PIECES = [['elephant', 'Elephant'], ['owl', 'Ollie'], ['monkey', 'Momo'], ['giraffe', 'Gigi'], ['rabbit', 'Rosie'], ['squirrel', 'Nutmeg'], ['turtle', 'Tito'], ['penguin', 'Pip'], ['pawn', 'Pawn']];
const WT_START_MONEY = 1500, WT_PASS = 200, WT_TAX = 100, WT_LIB_FEE = 50, WT_MAX_SHELVES = 3;
let wt = null, wtPrefs = { n: 2, length: 12, players: [
  { name: '', piece: 'elephant', color: '#3b54e8', cpu: false }, { name: 'Computer', piece: 'owl', color: '#cf3f3f', cpu: true },
  { name: 'Player 3', piece: 'monkey', color: '#23905a', cpu: true }, { name: 'Player 4', piece: 'penguin', color: '#f2a516', cpu: true }] };
const wtRent = (sp) => { const base = Math.round(sp.price * 0.12 / 5) * 5 || 5; if (sp.shelves) return base * [1, 4, 10, 20][sp.shelves]; return wtOwnsGroup(sp.owner, sp.g) ? base * 2 : base; };
const wtShelfCost = sp => Math.round(sp.price / 2 / 10) * 10;
function wtOwnsGroup(owner, g) { return owner != null && wt.board.filter(s => s.g === g).every(s => s.owner === owner); }
function wtPiece(p, size = 26) {
  if (p.piece === 'elephant') return mascot(size);
  if (p.piece === 'pawn') return `<svg width="${size}" height="${size}" viewBox="0 0 40 40"><circle cx="20" cy="12" r="8" fill="${p.color}" stroke="#fff" stroke-width="2"/><path d="M10 36 Q20 14 30 36 Z" fill="${p.color}" stroke="#fff" stroke-width="2"/></svg>`;
  return friendSvg(p.piece, size);
}
function startWordTown(deckId, prefs) {
  const pool = runnerPool(deckId);
  wt = { deckId, d: deckById(deckId), pool, queue: [], prefs,
    board: WT_SPACES.map((s, i) => ({ ...s, i, owner: null, shelves: 0 })),
    players: prefs.players.slice(0, prefs.n).map(p => ({ ...p, money: WT_START_MONEY, pos: 0, lib: 0, out: false, turns: 0, freeCard: false })),
    turn: 0, phase: 'roll', dice: [1, 1], doubles: 0, log: [], pot: 0, q: null, pending: null, results: [], start: Date.now(), busy: false };
  wtLog(`Welcome to Word Town! Everyone starts with 🪙 ${WT_START_MONEY}.`);
  go({ name: 'wordTown' }); wtMaybeCpu();
}
const wtCur = () => wt.players[wt.turn];
const wtCard = () => { if (!wt.queue.length) wt.queue = shuffle(wt.pool); return wt.queue.pop(); };
function wtLog(msg) { wt.log.unshift(msg); wt.log.length = Math.min(wt.log.length, 40); }
function wtPay(p, amount, to) {          // to: player, 'pot', or null (bank)
  p.money -= amount;
  if (to === 'pot') wt.pot += amount; else if (to) to.money += amount;
  wtCheckBroke(p, to);
}
function wtCheckBroke(p, creditor) {
  if (p.money >= 0) return;
  // sell bookshelves, then places, at half price until out of debt
  for (const sp of wt.board.filter(s => s.owner === wt.players.indexOf(p)).sort((a, b) => b.shelves - a.shelves || b.price - a.price)) {
    while (sp.shelves && p.money < 0) { sp.shelves--; p.money += wtShelfCost(sp) / 2; }
    if (p.money < 0) { sp.owner = null; p.money += sp.price / 2; wtLog(`${p.name} sold ${sp.name} to pay debts.`); }
    if (p.money >= 0) return;
  }
  p.out = true; p.money = 0; wtLog(`💸 ${p.name} is out of coins and leaves Word Town!`);
}
/* ---------- Questions ---------- */
function wtAsk(purpose, onDone, extra = {}) {
  const c = wtCard(), rev = Math.random() < 0.3, prompt = rev ? c.back : c.front, answer = rev ? c.front : c.back;
  const pool = wt.pool.filter(x => x.id !== c.id).map(x => rev ? x.front : x.back);
  wt.q = { card: c, prompt, answer, promptLang: rev ? wt.d.backLang : wt.d.frontLang, answerLang: rev ? wt.d.frontLang : wt.d.backLang, opts: pickOptions(answer, pool, 4), purpose, onDone, given: null, ok: null, ...extra };
  wt.phase = 'question'; render();
  if (autoplayOn()) setTimeout(() => speak(prompt, wt.q.promptLang), 200);
  if (wtCur().cpu) setTimeout(() => { if (!wt?.q || wt.q.ok != null) return; const right = wt.q.opts.findIndex(o => norm(o) === norm(answer)); wtAnswer(Math.random() < 0.7 ? right : (right + 1) % wt.q.opts.length); }, 1300);
}
function wtAnswer(i) {
  const q = wt.q; if (!q || q.ok != null) return;
  q.given = q.opts[i]; q.ok = norm(q.given) === norm(q.answer);
  wt.results.push({ player: wt.turn, cardId: q.card.id, q: q.prompt, a: q.answer, given: q.given, ok: q.ok });
  sdSound(q.ok ? 'right' : 'wrong'); render();
  setTimeout(() => { const cb = q.onDone; wt.q = null; cb(q.ok); }, wtCur().cpu ? 1100 : 1300);
}
/* ---------- Turn flow ---------- */
function wtRoll() {
  if (wt.phase !== 'roll' || wt.busy) return;
  const p = wtCur(); wt.busy = true;
  const d1 = 1 + Math.floor(Math.random() * 6), d2 = 1 + Math.floor(Math.random() * 6);
  let k = 0; const roll = setInterval(() => { wt.dice = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]; const el = $('#wtDice'); if (el) el.innerHTML = wtDiceHtml(); if (++k > 8) { clearInterval(roll); wt.dice = [d1, d2]; wtAfterRoll(p, d1, d2); } }, 70);
  wtDiceSound();
}
function wtAfterRoll(p, d1, d2) {
  const dbl = d1 === d2;
  if (p.lib) {   // in the Library: only doubles get you out by rolling
    if (dbl) { p.lib = 0; wtLog(`🎲 ${p.name} rolled doubles and leaves the Library!`); }
    else { p.lib++; wtLog(`${p.name} is studying in the Library (${d1}+${d2}).`); if (p.lib > 3) { wtPay(p, WT_LIB_FEE, 'pot'); p.lib = 0; wtLog(`${p.name} pays 🪙 ${WT_LIB_FEE} to leave.`); } wt.busy = false; wtEndTurn(); return; }
  }
  wt.doubles = dbl ? wt.doubles + 1 : 0;
  if (wt.doubles >= 3) { wtLog(`😵 Three doubles in a row! ${p.name} goes to the Library.`); wtToLibrary(p); wt.busy = false; wtEndTurn(); return; }
  wtLog(`🎲 ${p.name} rolled ${d1} + ${d2} = ${d1 + d2}${dbl ? ' (doubles!)' : ''}.`);
  wtMove(p, d1 + d2, () => { wt.busy = false; wtLand(p); });
}
function wtMove(p, steps, done) {
  let left = steps; const n = wt.board.length;
  const tick = () => {
    if (left <= 0) { done(); return; }
    p.pos = (p.pos + 1) % n; left--;
    if (p.pos === 0) { p.money += WT_PASS; wtLog(`🏁 ${p.name} passed Start: +🪙 ${WT_PASS}.`); }
    render(); wtStepSound(); setTimeout(tick, 170);
  };
  tick();
}
function wtToLibrary(p) { p.pos = 6; p.lib = 1; wt.doubles = 0; }
function wtLand(p) {
  const sp = wt.board[p.pos], me = wt.turn;
  if (sp.t === 'prop') {
    if (sp.owner == null) {
      if (p.money < sp.price) { wtLog(`${p.name} can’t afford ${sp.name} (🪙 ${sp.price}).`); return wtFinishLanding(); }
      wt.pending = { kind: 'buy', sp }; wt.phase = 'decide'; render(); return wtMaybeCpu();
    }
    if (sp.owner === me) {
      if (wtOwnsGroup(me, sp.g) && sp.shelves < WT_MAX_SHELVES && p.money >= wtShelfCost(sp)) { wt.pending = { kind: 'build', sp }; wt.phase = 'decide'; render(); return wtMaybeCpu(); }
      wtLog(`${p.name} visits their own ${sp.name}.`); return wtFinishLanding();
    }
    const owner = wt.players[sp.owner];
    if (owner.out) return wtFinishLanding();
    wt.pending = { kind: 'rent', sp, rent: wtRent(sp), owner }; wt.phase = 'decide'; render(); return wtMaybeCpu();
  }
  if (sp.t === 'chance') return wtAsk('chance', ok => {
    const p2 = wtCur();
    if (ok) {
      const r = [() => { p2.money += 150; return '+🪙 150!'; }, () => { p2.money += 100; return '+🪙 100!'; },
        () => { const others = wt.players.filter(x => x !== p2 && !x.out); others.forEach(x => wtPay(x, 25, p2)); return `collects 🪙 25 from everyone!`; },
        () => { p2.freeCard = true; return 'gets a 🎟️ Free Library Pass!'; }][Math.floor(Math.random() * 4)]();
      wtLog(`❓ Word Chance: ${p2.name} answered right and ${r}`);
    } else { const pen = Math.random() < 0.5 ? 50 : 30; wtPay(p2, pen, 'pot'); wtLog(`❓ Word Chance: wrong answer. ${p2.name} puts 🪙 ${pen} in the Rest Stop pot.`); }
    wtFinishLanding();
  });
  if (sp.t === 'tax') return wtAsk('tax', ok => {
    const p2 = wtCur();
    if (ok) wtLog(`🥜 ${p2.name} answered right and skips the Peanut Tax!`); else { wtPay(p2, WT_TAX, 'pot'); wtLog(`🥜 ${p2.name} pays 🪙 ${WT_TAX} Peanut Tax into the pot.`); }
    wtFinishLanding();
  });
  if (sp.t === 'rest') { if (wt.pot) { p.money += wt.pot; wtLog(`🌴 ${p.name} relaxes at the Rest Stop and collects the pot: 🪙 ${wt.pot}!`); wt.pot = 0; sdSound('end'); } else wtLog(`🌴 ${p.name} takes a break at the Rest Stop.`); return wtFinishLanding(); }
  if (sp.t === 'golib') {
    if (p.freeCard) { p.freeCard = false; wtLog(`🎟️ ${p.name} uses a Free Library Pass!`); return wtFinishLanding(); }
    wtLog(`🚌 ${p.name} is sent to the Library!`); wtToLibrary(p); render(); return wtEndTurn();
  }
  if (sp.t === 'library') wtLog(`📚 ${p.name} is just visiting the Library.`);
  wtFinishLanding();
}
function wtDecide(yes) {
  const pd = wt.pending, p = wtCur(); if (!pd || wt.phase !== 'decide') return;
  wt.pending = null;
  if (pd.kind === 'buy') {
    if (!yes) { wtLog(`${p.name} passes on ${pd.sp.name}.`); return wtFinishLanding(); }
    return wtAsk('buy', ok => {
      if (ok) { wtPay(p, pd.sp.price, null); pd.sp.owner = wt.turn; wtLog(`🏠 ${p.name} answered right and bought ${pd.sp.name} for 🪙 ${pd.sp.price}!`); }
      else wtLog(`${p.name} missed the word, so ${pd.sp.name} stays for sale.`);
      wtFinishLanding();
    });
  }
  if (pd.kind === 'build') {
    if (!yes) return wtFinishLanding();
    wtPay(p, wtShelfCost(pd.sp), null); pd.sp.shelves++; wtLog(`📚 ${p.name} added a bookshelf to ${pd.sp.name} (rent now 🪙 ${wtRent(pd.sp)}).`); sdSound('right');
    return wtFinishLanding();
  }
  if (pd.kind === 'rent') {
    if (!yes) { wtPay(p, pd.rent, pd.owner); wtLog(`${p.name} pays 🪙 ${pd.rent} rent to ${pd.owner.name}.`); return wtFinishLanding(); }
    return wtAsk('rent', ok => {
      const amt = ok ? Math.ceil(pd.rent / 2) : pd.rent;
      wtPay(p, amt, pd.owner); wtLog(`${p.name} ${ok ? 'answered right and pays only half' : 'missed and pays full'} rent: 🪙 ${amt} to ${pd.owner.name}.`);
      wtFinishLanding();
    });
  }
}
function wtLibraryChoice(kind) {
  const p = wtCur(); if (!p.lib || wt.phase !== 'roll') return;
  if (kind === 'pay') { if (p.money < WT_LIB_FEE) return toast('Not enough coins'); wtPay(p, WT_LIB_FEE, 'pot'); p.lib = 0; wtLog(`${p.name} pays 🪙 ${WT_LIB_FEE} to leave the Library.`); render(); return wtMaybeCpu(); }
  if (kind === 'pass') { p.freeCard = false; p.lib = 0; wtLog(`🎟️ ${p.name} uses a Free Library Pass.`); render(); return wtMaybeCpu(); }
  wtAsk('library', ok => { if (ok) { p.lib = 0; wtLog(`📖 ${p.name} answered right and leaves the Library!`); } else wtLog(`${p.name} keeps studying in the Library.`); wt.phase = 'roll'; if (!ok) wtEndTurn(); else { render(); wtMaybeCpu(); } });
}
function wtFinishLanding() {
  const p = wtCur(); render();
  if (p.out || wtGameOver()) return wtEndTurn();
  if (wt.doubles && !p.lib) { wtLog(`${p.name} rolls again for doubles!`); wt.phase = 'roll'; render(); return wtMaybeCpu(); }
  wtEndTurn();
}
function wtGameOver() {
  const alive = wt.players.filter(p => !p.out);
  return alive.length <= 1 || wt.players.every(p => p.out || p.turns >= (wt.prefs.length || 40));
}
function wtEndTurn() {
  const p = wtCur(); p.turns++; wt.doubles = 0;
  if (wtGameOver()) return wtFinish();
  let n = wt.turn; do { n = (n + 1) % wt.players.length; } while (wt.players[n].out);
  wt.turn = n; wt.phase = 'roll'; render(); wtMaybeCpu();
}
const wtWorth = p => p.money + wt.board.filter(s => s.owner === wt.players.indexOf(p)).reduce((a, s) => a + s.price + s.shelves * wtShelfCost(s), 0);
function wtFinish() {
  wt.phase = 'over'; sdSound('end');
  const ranked = wt.players.map((p, i) => ({ p, i, worth: p.out ? -1 : wtWorth(p) })).sort((a, b) => b.worth - a.worth);
  wt.ranked = ranked;
  const me = wt.players[0], mine = wt.results.filter(r => r.player === 0);
  wt.real = me.out ? 2 : Math.min(25, Math.round(wtWorth(me) / 400) + (ranked[0].i === 0 ? 5 : 0));
  if (typeof rw === 'function') rw().peanuts += wt.real;
  if (typeof addHistory === 'function') addHistory({ type: 'wordtown', deckId: wt.deckId, deckName: wt.d.name, correct: mine.filter(r => r.ok).length, total: mine.length,
    score: mine.length ? Math.round(mine.filter(r => r.ok).length / mine.length * 100) : 0, timeMs: Date.now() - wt.start,
    detail: `${ranked[0].p.name} won with 🪙 ${ranked[0].worth.toLocaleString()}`, items: wt.results });
  render();
}
/* ---------- Computer players ---------- */
function wtMaybeCpu() {
  const p = wtCur(); if (!wt || !p.cpu || p.out || wt.phase === 'over') return;
  setTimeout(() => {
    if (!wt || view.name !== 'wordTown' || wtCur() !== p) return;
    if (wt.phase === 'roll') {
      if (p.lib) { if (p.freeCard) return wtLibraryChoice('pass'); if (p.money > 300 && Math.random() < 0.5) return wtLibraryChoice('pay'); return wtLibraryChoice('answer'); }
      return wtRoll();
    }
    if (wt.phase === 'decide') {
      const pd = wt.pending;
      if (pd.kind === 'buy') return wtDecide(p.money - pd.sp.price >= 150);
      if (pd.kind === 'build') return wtDecide(p.money - wtShelfCost(pd.sp) >= 250);
      if (pd.kind === 'rent') return wtDecide(true);
    }
  }, 1000);
}
/* ---------- Sounds ---------- */
function wtDiceSound() { if (S.settings?.mascotSound === false) return; for (let i = 0; i < 6; i++) setTimeout(() => ppTick && ppTick(), i * 70); }
function wtStepSound() { if (S.settings?.mascotSound === false) return; const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; audioCtx ||= new AC(); const ac = audioCtx, o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime; o.type = 'sine'; o.frequency.value = 520; g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.09); }

/* ---------- Views ---------- */
const WT_DICE = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const wtDiceHtml = () => wt.dice.map(v => `<span class="wt-die">${WT_DICE[v]}</span>`).join('');
function wtCellPos(i) {   // 7×7 grid perimeter, Start at the bottom-right corner, moving clockwise visually (left along the bottom)
  if (i <= 6) return [7, 7 - i];
  if (i <= 11) return [7 - (i - 6), 1];
  if (i <= 18) return [1, 1 + (i - 12)];
  return [1 + (i - 18), 7];
}
views.townSetup = () => {
  const d = deckById(view.deckId); if (!d) { view = { name: 'home' }; return views.home(); }
  const me = typeof currentProfile === 'function' ? currentProfile() : null, pr = wtPrefs;
  pr.players[0].name ||= me?.name || 'Player 1';
  const row = (p, k) => `<div class="feat wt-setup-player ${k >= pr.n ? 'dim' : ''}" data-k="${k}">
      <div class="row-between"><h4 style="margin:0">Player ${k + 1}</h4>
        <div class="seg" style="margin:0"><label><input type="radio" name="cpu${k}" value="0" ${!p.cpu ? 'checked' : ''}>🙂 Person</label><label><input type="radio" name="cpu${k}" value="1" ${p.cpu ? 'checked' : ''}>🤖 Computer</label></div></div>
      <label class="field">Name<input name="name${k}" maxlength="20" value="${esc(p.name)}"></label>
      <div class="wt-pieces">${WT_PIECES.map(([id, label]) => `<label class="wt-piece" title="${label}"><input type="radio" name="piece${k}" value="${id}" ${p.piece === id ? 'checked' : ''}><span>${wtPiece({ piece: id, color: p.color }, 40)}</span><small>${label}</small></label>`).join('')}</div>
      <div class="row" style="gap:6px;margin-top:6px">${TW_COLORS.map(c => `<label class="swatch" style="background:${c}"><input type="radio" name="color${k}" value="${c}" ${c === p.color ? 'checked' : ''}></label>`).join('')}</div>
    </div>`;
  return `
    <div class="crumbs"><a data-act="home">Decks</a> / <a data-act="openDeck" data-id="${d.id}">${esc(d.name)}</a> / <a data-act="games" data-id="${d.id}">Games</a> / Word Town</div>
    <h2 style="margin-bottom:12px">🎲 Word Town</h2>
    ${friendTip('giraffe', 'town')}
    <form class="panel stack" id="wtForm">
      <p class="muted" style="margin:0">Roll the dice and travel around Word Town! Answer words from “${esc(d.name)}” to <b>buy places</b>, <b>pay half rent</b>, skip the <b>🥜 Peanut Tax</b> and escape the <b>📚 Library</b>.
        Own every place in a color to add <b>bookshelves</b> and raise the rent. Pass 🏁 Start to collect 🪙 ${WT_PASS}. The richest player at the end wins!</p>
      <div class="grid2"><div><b>Players</b><div class="seg">${[2, 3, 4].map(n => `<label><input type="radio" name="n" value="${n}" ${pr.n === n ? 'checked' : ''}>${n} players</label>`).join('')}</div></div>
        <div><b>Game length</b><div class="seg">${[[8, 'Quick (8 turns)'], [12, 'Normal (12)'], [20, 'Long (20)'], [0, 'Until one is left (max 40)']].map(([v, l]) => `<label><input type="radio" name="len" value="${v}" ${pr.length === v ? 'checked' : ''}>${l}</label>`).join('')}</div></div></div>
      <div class="wt-setup-grid">${pr.players.map(row).join('')}</div>
      <div class="row-between"><span class="muted small">Pick a different piece for each player. The animal friends are all here!</span><button type="submit" class="btn primary big">Open Word Town! 🏘️</button></div>
    </form>`;
};
views.wordTown = () => {
  if (!wt) { view = { name: 'home' }; return views.home(); }
  const p = wtCur();
  const cells = wt.board.map((sp, i) => {
    const [r, c] = wtCellPos(i), owner = sp.owner != null ? wt.players[sp.owner] : null, here = wt.players.filter(x => !x.out && x.pos === i);
    const corner = [0, 6, 12, 18].includes(i);
    return `<div class="wt-cell ${corner ? 'corner' : ''} ${sp.t}" data-act="wtCellInfo" style="grid-row:${r};grid-column:${c};${owner ? `--oc:${owner.color}` : ''}" title="${esc(sp.name)}${sp.t === 'prop' ? ` · 🪙 ${sp.price} · rent ${wtRent(sp)}${owner ? ` · owned by ${owner.name}` : ''}` : ''}">
      ${sp.t === 'prop' ? `<div class="wt-band" style="background:${WT_GROUPS[sp.g]}">${sp.shelves ? '📚'.repeat(sp.shelves) : ''}</div>` : `<div class="wt-icon">${sp.icon}</div>`}
      <div class="wt-name">${esc(sp.name)}</div>
      ${sp.t === 'prop' ? `<div class="wt-price">${owner ? `<span class="wt-owner" style="background:${owner.color}"></span>${esc(owner.name.slice(0, 8))}` : `🪙 ${sp.price}`}</div>` : sp.t === 'rest' && wt.pot ? `<div class="wt-price">pot 🪙 ${wt.pot}</div>` : ''}
      <div class="wt-tokens">${here.map(x => `<span class="wt-token ${x === p ? 'cur' : ''}" style="--pc:${x.color}">${wtPiece(x, 26)}</span>`).join('')}</div>
    </div>`;
  }).join('');
  // centre panel
  let action = '';
  if (wt.phase === 'over') {
    action = `<div class="wt-over">${mascot(80, 'party')}<div class="word">${esc(wt.ranked[0].p.name)} wins Word Town! 🏆</div>
      <ol class="wt-rank">${wt.ranked.map((x, k) => `<li style="--pc:${x.p.color}">${wtPiece(x.p, 24)} <b>${esc(x.p.name)}</b> <span>${x.worth < 0 ? 'out' : `🪙 ${x.worth.toLocaleString()}`}</span></li>`).join('')}</ol>
      ${wt.real ? `<div class="reward">🥜 +${wt.real} real peanuts for the shop!</div>` : ''}
      <div class="row" style="justify-content:center"><button type="button" class="btn primary" data-act="wtAgain">Play again</button><button type="button" class="btn" data-act="games" data-id="${wt.deckId}">Other games</button></div></div>`;
  } else if (wt.phase === 'question' && wt.q) {
    const q = wt.q, title = { buy: '🏠 Answer to buy it!', rent: '💰 Answer to pay half rent!', tax: '🥜 Answer to skip the tax!', chance: '❓ Word Chance!', library: '📖 Answer to leave the Library!' }[q.purpose];
    action = `<div class="wt-q"><div class="muted small">${title}</div>
      <div class="row" style="justify-content:center;gap:6px"><span class="wt-word">${esc(q.prompt)}</span>${speakBtn(q.prompt, q.promptLang)}</div>
      <div class="wt-opts">${q.opts.map((o, i) => { let cls = ''; if (q.ok != null) { if (norm(o) === norm(q.answer)) cls = 'correct'; else if (o === q.given) cls = 'wrong'; }
        return `<button type="button" class="opt ${cls}" data-act="wtAns" data-i="${i}" ${q.ok != null || p.cpu ? 'disabled' : ''}><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`; }).join('')}</div>
      ${p.cpu && q.ok == null ? '<div class="muted small">🤖 thinking…</div>' : ''}</div>`;
  } else if (wt.phase === 'decide' && wt.pending) {
    const pd = wt.pending, sp = pd.sp, cpu = p.cpu ? 'disabled' : '';
    const card = `<div class="wt-deed"><div class="wt-deed-band" style="background:${WT_GROUPS[sp.g]}">${esc(sp.name)}</div><div class="small">Price 🪙 ${sp.price} · Rent 🪙 ${wtRent(sp)}${sp.shelves ? ` · ${sp.shelves} 📚` : ''}</div></div>`;
    if (pd.kind === 'buy') action = `${card}<p style="margin:6px 0">Buy it for 🪙 ${sp.price}? You’ll need to answer a word first!</p><div class="row" style="justify-content:center"><button type="button" class="btn" data-act="wtNo" ${cpu}>No thanks</button><button type="button" class="btn primary" data-act="wtYes" ${cpu}>🏠 Try to buy</button></div>`;
    else if (pd.kind === 'build') action = `${card}<p style="margin:6px 0">You own the whole color! Add a bookshelf for 🪙 ${wtShelfCost(sp)}?</p><div class="row" style="justify-content:center"><button type="button" class="btn" data-act="wtNo" ${cpu}>Not now</button><button type="button" class="btn primary" data-act="wtYes" ${cpu}>📚 Build</button></div>`;
    else action = `${card}<p style="margin:6px 0">This is ${esc(pd.owner.name)}’s place. Rent is 🪙 ${pd.rent}. Answer a word to pay only half!</p><div class="row" style="justify-content:center"><button type="button" class="btn" data-act="wtNo" ${cpu}>Pay 🪙 ${pd.rent}</button><button type="button" class="btn primary" data-act="wtYes" ${cpu}>💡 Answer for half</button></div>`;
  } else if (wt.phase === 'roll') {
    action = p.lib ? `<p style="margin:0">📚 ${esc(p.name)} is in the Library.</p><div class="row" style="justify-content:center">
        <button type="button" class="btn primary" data-act="wtLib" data-k="answer" ${p.cpu ? 'disabled' : ''}>📖 Answer to leave</button>
        <button type="button" class="btn" data-act="wtLib" data-k="pay" ${p.cpu || p.money < WT_LIB_FEE ? 'disabled' : ''}>Pay 🪙 ${WT_LIB_FEE}</button>
        ${p.freeCard ? `<button type="button" class="btn" data-act="wtLib" data-k="pass" ${p.cpu ? 'disabled' : ''}>🎟️ Use pass</button>` : ''}
        <button type="button" class="btn" data-act="wtRoll" ${p.cpu ? 'disabled' : ''}>🎲 Try for doubles</button></div>`
      : `<button type="button" class="btn primary big" data-act="wtRoll" ${p.cpu || wt.busy ? 'disabled' : ''}>🎲 Roll the dice</button>${p.cpu ? '<div class="muted small">🤖 Computer’s turn…</div>' : ''}`;
  } else action = '<div class="muted">…</div>';
  const players = wt.players.map((x, i) => `<div class="wt-pl ${i === wt.turn && wt.phase !== 'over' ? 'active' : ''} ${x.out ? 'out' : ''}" style="--pc:${x.color}">${wtPiece(x, 28)}<div><b>${esc(x.name)}</b>${x.cpu ? ' 🤖' : ''}<div class="small muted">${wt.board.filter(s => s.owner === i).length} places${x.lib ? ' · 📚 in Library' : ''}${x.freeCard ? ' · 🎟️' : ''}</div></div><span class="wt-money">🪙 ${x.money.toLocaleString()}</span></div>`).join('');
  const center = `<div class="wt-center">
      <div class="wt-turn" style="--pc:${p.color}">${wtPiece(p, 34)}<b>${esc(p.name)}</b>${wt.prefs.length ? `<span class="muted small">turn ${Math.min(p.turns + 1, wt.prefs.length)}/${wt.prefs.length}</span>` : ''}<span class="wt-dice" id="wtDice">${wtDiceHtml()}</span></div>
      <div class="wt-action">${action}</div>
      <div class="wt-log">${wt.log.slice(0, 6).map((l, k) => `<div class="${k ? 'muted' : ''}">${esc(l)}</div>`).join('')}</div>
    </div>`;
  return `<div class="study-top"><button type="button" class="btn ghost" data-act="wtQuit">← Games</button><div class="prompt-label muted">🎲 Word Town · ${esc(wt.d.name)}</div><span></span></div>
    <div class="wt-layout"><div class="wt-board">${cells}${center}</div><div class="wt-side">${players}</div></div>`;
};
Object.assign(actions, {
  wtRoll: () => wtRoll(),
  wtCellInfo: el => { if (matchMedia('(hover: none)').matches) toast(el.title.replace(/ · /g, ' · ')); },
  wtAns: el => wtAnswer(+el.dataset.i),
  wtYes: () => wtDecide(true),
  wtNo: () => wtDecide(false),
  wtLib: el => { if (el.dataset.k === 'roll') wtRoll(); else wtLibraryChoice(el.dataset.k); },
  wtAgain: () => startWordTown(wt.deckId, wt.prefs),
  wtQuit: () => { if (wt && wt.phase !== 'over') confirmDlg('Leave Word Town?', 'This game won’t be saved.', 'Leave', () => { const id = wt.deckId; wt = null; go({ name: 'games', deckId: id }); }); else go({ name: 'games', deckId: wt.deckId }); },
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'wtForm') return;
  e.preventDefault(); const f = e.target, pr = wtPrefs;
  pr.n = +f.n.value; pr.length = +f.len.value;
  pr.players.forEach((p, k) => { p.name = f['name' + k].value.trim() || `Player ${k + 1}`; p.piece = f['piece' + k].value; p.color = f['color' + k].value; p.cpu = f['cpu' + k].value === '1'; });
  const used = pr.players.slice(0, pr.n).map(p => p.piece).filter(x => x !== 'pawn');
  if (new Set(used).size !== used.length) { toast('Each player needs a different animal piece (pawns can repeat)'); return; }
  if (pr.players.slice(0, pr.n).every(p => p.cpu)) { toast('At least one player should be a person!'); return; }
  startWordTown(view.deckId, pr);
});
document.addEventListener('change', e => { if (e.target.name === 'n' && $('#wtForm')) { const n = +e.target.value; document.querySelectorAll('.wt-setup-player').forEach(el => el.classList.toggle('dim', +el.dataset.k >= n)); } });
document.addEventListener('keydown', e => {
  if (view.name !== 'wordTown' || !wt || $('#dlg').open || wtCur().cpu) return;
  if (wt.phase === 'question' && wt.q?.ok == null && /^[1-4]$/.test(e.key)) wtAnswer(+e.key - 1);
  else if (wt.phase === 'roll' && !wtCur().lib && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); wtRoll(); }
});
