'use strict';
/* ================= ♟️ Chess =================
   Full rules: castling, en passant, promotion (you pick the piece), check, checkmate, stalemate,
   draws by the 50-move rule, threefold repetition and too little material.
   Play the computer (Easy / Medium / Hard) or a friend on this device.
   📚 Study mode: answer a card from your deck before each of your moves. A wrong answer skips your move. */

/* ---------- rules engine (board: 64 squares, a8 = 0 … h1 = 63; white = uppercase) ---------- */
const CH_START = 'rnbqkbnrpppppppp' + '.'.repeat(32) + 'PPPPPPPPRNBQKBNR';
const chWhite = p => p !== '.' && p === p.toUpperCase(), chColor = p => p === '.' ? null : chWhite(p) ? 'w' : 'b';
const chFile = i => i % 8, chRank = i => 8 - Math.floor(i / 8), chSq = i => 'abcdefgh'[chFile(i)] + chRank(i);
function chNew() { return { b: CH_START.split(''), turn: 'w', castle: { K: 1, Q: 1, k: 1, q: 1 }, ep: -1, half: 0, full: 1, hist: [], seen: {} }; }
const CH_N = [-17, -15, -10, -6, 6, 10, 15, 17], CH_K = [-9, -8, -7, -1, 1, 7, 8, 9];
const chOn = (from, to, d) => to >= 0 && to < 64 && Math.abs(chFile(to) - chFile(from)) <= d;
function chAttacked(b, sq, by) {   // is square sq attacked by color `by`?
  const own = p => chColor(p) === by;
  for (const f of by === 'w' ? [sq + 7, sq + 9] : [sq - 7, sq - 9])   // a white pawn attacks up the board, a black one down
    if (f >= 0 && f < 64 && Math.abs(chFile(f) - chFile(sq)) === 1 && b[f] === (by === 'w' ? 'P' : 'p')) return true;
  for (const d of CH_N) { const f = sq + d; if (f >= 0 && f < 64 && Math.abs(chFile(f) - chFile(sq)) <= 2 && b[f] === (by === 'w' ? 'N' : 'n')) return true; }
  for (const d of CH_K) { const f = sq + d; if (f >= 0 && f < 64 && Math.abs(chFile(f) - chFile(sq)) <= 1 && b[f] === (by === 'w' ? 'K' : 'k')) return true; }
  for (const [dirs, kinds] of [[[-8, 8, -1, 1], 'RQ'], [[-9, -7, 7, 9], 'BQ']]) for (const d of dirs) {
    let f = sq; for (;;) { const nf = f + d; if (nf < 0 || nf >= 64 || Math.abs(chFile(nf) - chFile(f)) > 1) break; f = nf; const p = b[f]; if (p === '.') continue; if (own(p) && kinds.includes(p.toUpperCase())) return true; break; }
  }
  return false;
}
const chKing = (b, c) => b.indexOf(c === 'w' ? 'K' : 'k');
const chInCheck = (g, c = g.turn) => chAttacked(g.b, chKing(g.b, c), c === 'w' ? 'b' : 'w');
function chPseudo(g) {
  const b = g.b, c = g.turn, out = [], enemy = c === 'w' ? 'b' : 'w';
  const add = (from, to, extra = {}) => out.push({ from, to, ...extra });
  for (let i = 0; i < 64; i++) {
    const p = b[i]; if (chColor(p) !== c) continue; const t = p.toUpperCase();
    if (t === 'P') {
      const dir = c === 'w' ? -8 : 8, start = c === 'w' ? 6 : 1, last = c === 'w' ? 0 : 7, one = i + dir;
      const push = (to, extra) => { if (Math.floor(to / 8) === last) for (const pr of 'QRBN') add(i, to, { ...extra, promo: pr }); else add(i, to, extra); };
      if (one >= 0 && one < 64 && b[one] === '.') { push(one); if (Math.floor(i / 8) === start && b[one + dir] === '.') add(i, one + dir, { double: true }); }
      for (const d of [-1, 1]) { const to = one + d; if (to < 0 || to >= 64 || Math.abs(chFile(to) - chFile(i)) !== 1) continue;
        if (chColor(b[to]) === enemy) push(to); else if (to === g.ep) add(i, to, { epCap: true }); }
    } else if (t === 'N' || t === 'K') {
      for (const d of t === 'N' ? CH_N : CH_K) { const to = i + d; if (to < 0 || to >= 64 || Math.abs(chFile(to) - chFile(i)) > (t === 'N' ? 2 : 1)) continue; if (chColor(b[to]) !== c) add(i, to); }
      if (t === 'K' && !chInCheck(g)) {   // castling: rook and king unmoved, empty between, not through check
        const row = c === 'w' ? 56 : 0, [ks, qs] = c === 'w' ? ['K', 'Q'] : ['k', 'q'];
        if (i === row + 4) {
          if (g.castle[ks] && b[row + 5] === '.' && b[row + 6] === '.' && b[row + 7] === (c === 'w' ? 'R' : 'r') && !chAttacked(b, row + 5, enemy) && !chAttacked(b, row + 6, enemy)) add(i, row + 6, { castle: 'k' });
          if (g.castle[qs] && b[row + 3] === '.' && b[row + 2] === '.' && b[row + 1] === '.' && b[row] === (c === 'w' ? 'R' : 'r') && !chAttacked(b, row + 3, enemy) && !chAttacked(b, row + 2, enemy)) add(i, row + 2, { castle: 'q' });
        }
      }
    } else {
      const dirs = t === 'R' ? [-8, 8, -1, 1] : t === 'B' ? [-9, -7, 7, 9] : [-9, -8, -7, -1, 1, 7, 8, 9];
      for (const d of dirs) { let f = i; for (;;) { const nf = f + d; if (nf < 0 || nf >= 64 || Math.abs(chFile(nf) - chFile(f)) > 1) break; f = nf; if (chColor(b[f]) === c) break; add(i, f); if (b[f] !== '.') break; } }
    }
  }
  return out;
}
function chDo(g, m) {   // play a move; returns an undo record
  const b = g.b, p = b[m.from], cap = m.epCap ? b[m.to + (g.turn === 'w' ? 8 : -8)] : b[m.to];
  const u = { m, p, cap, castle: { ...g.castle }, ep: g.ep, half: g.half, full: g.full };
  b[m.to] = m.promo ? (g.turn === 'w' ? m.promo : m.promo.toLowerCase()) : p; b[m.from] = '.';
  if (m.epCap) b[m.to + (g.turn === 'w' ? 8 : -8)] = '.';
  if (m.castle) { const row = g.turn === 'w' ? 56 : 0; if (m.castle === 'k') { b[row + 5] = b[row + 7]; b[row + 7] = '.'; } else { b[row + 3] = b[row]; b[row] = '.'; } }
  if (p === 'K') g.castle.K = g.castle.Q = 0; if (p === 'k') g.castle.k = g.castle.q = 0;
  for (const [sq, r] of [[63, 'K'], [56, 'Q'], [7, 'k'], [0, 'q']]) if (m.from === sq || m.to === sq) g.castle[r] = 0;
  g.ep = m.double ? (m.from + m.to) / 2 : -1;
  g.half = p.toUpperCase() === 'P' || cap !== '.' ? 0 : g.half + 1;
  if (g.turn === 'b') g.full++;
  g.turn = g.turn === 'w' ? 'b' : 'w';
  return u;
}
function chUndo(g, u) {
  const b = g.b, m = u.m; g.turn = g.turn === 'w' ? 'b' : 'w';
  b[m.from] = u.p; b[m.to] = m.epCap ? '.' : u.cap;
  if (m.epCap) b[m.to + (g.turn === 'w' ? 8 : -8)] = u.cap;
  if (m.castle) { const row = g.turn === 'w' ? 56 : 0; if (m.castle === 'k') { b[row + 7] = b[row + 5]; b[row + 5] = '.'; } else { b[row] = b[row + 3]; b[row + 3] = '.'; } }
  Object.assign(g, { castle: u.castle, ep: u.ep, half: u.half, full: u.full });
}
function chLegal(g) { const c = g.turn; return chPseudo(g).filter(m => { const u = chDo(g, m), ok = !chInCheck(g, c); chUndo(g, u); return ok; }); }
const chKey = g => g.b.join('') + g.turn + Object.entries(g.castle).filter(([, v]) => v).map(([k]) => k).join('') + g.ep;
function chNoMaterial(b) {   // K v K, K+B v K, K+N v K
  const left = b.filter(p => p !== '.' && p.toUpperCase() !== 'K');
  return !left.length || (left.length === 1 && 'BN'.includes(left[0].toUpperCase()));
}
function chStatus(g) {
  const legal = chLegal(g), check = chInCheck(g);
  if (!legal.length) return check ? { over: true, mate: true, winner: g.turn === 'w' ? 'b' : 'w', text: 'Checkmate!' } : { over: true, text: 'Stalemate: a draw.' };
  if (g.half >= 100) return { over: true, text: 'Draw by the 50-move rule.' };
  if ((g.seen[chKey(g)] || 0) >= 3) return { over: true, text: 'Draw by repeating the same position 3 times.' };
  if (chNoMaterial(g.b)) return { over: true, text: 'Draw: not enough pieces left to checkmate.' };
  return { over: false, check, legal };
}
function chSan(g, m, legal) {   // short algebraic notation: Nf3, exd5, O-O, e8=Q+
  const p = g.b[m.from].toUpperCase(); let s;
  if (m.castle) s = m.castle === 'k' ? 'O-O' : 'O-O-O';
  else {
    const cap = g.b[m.to] !== '.' || m.epCap;
    if (p === 'P') s = (cap ? 'abcdefgh'[chFile(m.from)] + 'x' : '') + chSq(m.to) + (m.promo ? '=' + m.promo : '');
    else {
      const twins = legal.filter(o => o.to === m.to && o.from !== m.from && g.b[o.from].toUpperCase() === p);
      let dis = ''; if (twins.length) dis = twins.some(o => chFile(o.from) === chFile(m.from)) ? (twins.some(o => chRank(o.from) === chRank(m.from)) ? chSq(m.from) : String(chRank(m.from))) : 'abcdefgh'[chFile(m.from)];
      s = p + dis + (cap ? 'x' : '') + chSq(m.to);
    }
  }
  const seen = g.seen; g.seen = {}; const u = chDo(g, m), check = chInCheck(g), mate = check && !chLegal(g).length; chUndo(g, u); g.seen = seen;
  return s + (mate ? '#' : check ? '+' : '');
}

/* ---------- the computer: alpha-beta search on material + piece placement ---------- */
const CH_VAL = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };
const CH_PST = {   // from white's side, a8 first
  P: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
  N: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
  B: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
  R: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
  Q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
  K: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
};
function chEval(b) {   // + is good for white
  let s = 0;
  for (let i = 0; i < 64; i++) { const p = b[i]; if (p === '.') continue; const t = p.toUpperCase(), w = p === t;
    s += (w ? 1 : -1) * (CH_VAL[t] + CH_PST[t][w ? i : (7 - Math.floor(i / 8)) * 8 + chFile(i)]); }
  return s;
}
function chSearch(g, depth, alpha, beta, ply) {
  const moves = chLegal(g);
  if (!moves.length) return chInCheck(g) ? -100000 + ply : 0;
  if (depth === 0) return (g.turn === 'w' ? 1 : -1) * chEval(g.b);
  moves.sort((a, b) => (g.b[b.to] !== '.' ? CH_VAL[g.b[b.to].toUpperCase()] : 0) - (g.b[a.to] !== '.' ? CH_VAL[g.b[a.to].toUpperCase()] : 0) + (b.promo ? 800 : 0) - (a.promo ? 800 : 0));
  for (const m of moves) { const u = chDo(g, m), v = -chSearch(g, depth - 1, -beta, -alpha, ply + 1); chUndo(g, u); if (v >= beta) return beta; if (v > alpha) alpha = v; }
  return alpha;
}
function chBest(g, level) {
  const depth = { easy: 1, medium: 2, hard: 3 }[level] || 2, moves = shuffle(chLegal(g)); let best = null, bestV = -Infinity;
  for (const m of moves) {
    const u = chDo(g, m); let v = -chSearch(g, depth - 1, -Infinity, Infinity, 1); chUndo(g, u);
    if (level === 'easy') v += Math.random() * 180 - 90;   // easy makes human-ish mistakes
    if (v > bestV) { bestV = v; best = m; }
  }
  return best;
}

/* ---------- game screen ---------- */
let ch = null;
const CH_GLYPH = { K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙', k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
function chessStart(opts = {}) {
  const prev = S.settings.chess || {}, o = { mode: prev.mode || 'cpu', side: prev.side || 'w', level: prev.level || 'medium', study: !!prev.study, ...opts };
  S.settings.chess = { mode: o.mode, side: o.side, level: o.level, study: o.study }; save();
  ch = { g: chNew(), ...o, sel: -1, last: null, sans: [], undo: [], msg: '', promo: null, quiz: null, deckId: o.deckId ?? view.deckId ?? null, thinking: false, flip: o.mode === 'cpu' && o.side === 'b' };
  ch.g.seen[chKey(ch.g)] = 1; ch.st = chStatus(ch.g);
  go({ name: 'chess' });
  chMaybeQuiz(); chMaybeCpu();
}
const chMine = () => ch.mode === '2p' || ch.g.turn === ch.side;
function chPlay(m) {
  const legal = ch.st.legal || chLegal(ch.g), san = chSan(ch.g, m, legal);
  ch.undo.push(chDo(ch.g, m)); ch.sans.push(san); ch.last = m; ch.sel = -1;
  const k = chKey(ch.g); ch.g.seen[k] = (ch.g.seen[k] || 0) + 1;
  ch.st = chStatus(ch.g);
  if (typeof muNote === 'function') try { muNote(m.castle ? 67 : ch.g.b[m.to] && /x/.test(san) ? 52 : 60, 0, 0.12, 'marimba', 0.35, false); } catch {}
  if (ch.st.over) { ch.msg = ch.st.mate ? (ch.mode === 'cpu' ? (ch.st.winner === ch.side ? '🏆 Checkmate! You win!' : '😵 Checkmate. The computer wins.') : `🏆 Checkmate! ${ch.st.winner === 'w' ? 'White' : 'Black'} wins.`) : '🤝 ' + ch.st.text;
    if (ch.st.mate && ch.mode === 'cpu' && ch.st.winner === ch.side) { if (typeof rightSound === 'function') rightSound(); if (typeof addPoints === 'function') addPoints({ easy: 5, medium: 10, hard: 20 }[ch.level] || 10); }
  } else ch.msg = ch.st.check ? 'Check!' : ch.note || ''; ch.note = '';
  render(); chMaybeQuiz(); chMaybeCpu();
}
function chMaybeCpu() {
  if (!ch || ch.st.over || ch.mode !== 'cpu' || ch.g.turn === ch.side) return;
  ch.thinking = true; render();
  setTimeout(() => { if (!ch || view.name !== 'chess') return; const m = chBest(ch.g, ch.level); ch.thinking = false; if (m) chPlay(m); }, 350);
}
/* 📚 study mode: a card question before each of your moves */
function chMaybeQuiz() {
  if (!ch || !ch.study || ch.st.over || !chMine() || ch.mode !== 'cpu') return;
  const cs = cardsOf(ch.deckId || '').filter(c => c.front && c.back); if (cs.length < 4) { ch.study = false; return; }
  const c = cs[Math.floor(Math.random() * cs.length)], opts = shuffle([c, ...shuffle(cs.filter(x => x.id !== c.id && norm(x.back) !== norm(c.back))).slice(0, 3)]);
  ch.quiz = { c, opts: opts.map(x => x.back), answer: c.back, given: null }; render();
}
function chPick(i) {
  if (!ch || ch.st.over || ch.thinking || ch.quiz || ch.promo || !chMine()) return;
  const p = ch.g.b[i];
  if (ch.sel >= 0) {
    const ms = ch.st.legal.filter(m => m.from === ch.sel && m.to === i);
    if (ms.length) { if (ms.length > 1) { ch.promo = ms; render(); return; } return chPlay(ms[0]); }
  }
  ch.sel = chColor(p) === ch.g.turn && ch.sel !== i ? i : -1; render();
}
views.chess = () => {
  if (!ch) { view = { name: 'home' }; return views.home(); }
  const g = ch.g, legalTo = ch.sel >= 0 ? new Set(ch.st.legal.filter(m => m.from === ch.sel).map(m => m.to)) : new Set();
  const kingSq = ch.st.check || ch.st.mate ? chKing(g.b, g.turn) : -1;
  const order = Array.from({ length: 64 }, (_, i) => ch.flip ? 63 - i : i);
  const caps = c => { const start = { P: 8, N: 2, B: 2, R: 2, Q: 1 }, have = {}; for (const p of g.b) if (chColor(p) === c) have[p.toUpperCase()] = (have[p.toUpperCase()] || 0) + 1;
    return Object.entries(start).map(([t, n]) => (c === 'w' ? CH_GLYPH[t] : CH_GLYPH[t.toLowerCase()]).repeat(Math.max(0, n - (have[t] || 0)))).join(''); };
  const turnTxt = ch.st.over ? '' : ch.thinking ? '🤔 The computer is thinking…' : ch.mode === 'cpu' ? (chMine() ? 'Your move' : '') : `${g.turn === 'w' ? 'White' : 'Black'} to move`;
  const d = ch.deckId ? deckById(ch.deckId) : null;
  return `<div class="study-top"><button type="button" class="btn ghost" data-act="${d ? 'games' : 'home'}" data-id="${d?.id || ''}">← ${d ? 'Games' : 'Back'}</button>
      <div class="prompt-label muted">♟️ Chess · ${ch.mode === 'cpu' ? `vs computer (${({ easy: 'Easy', medium: 'Medium', hard: 'Hard' })[ch.level]})` : '2 players'}${ch.study ? ' · 📚 study mode' : ''}</div></div>
    <div class="ch-wrap">
      <div class="ch-side">
        <div class="ch-caps" title="Pieces taken">${caps(ch.flip ? 'w' : 'b')}</div>
        <div class="ch-board ${ch.flip ? 'flip' : ''}" role="grid" aria-label="Chess board">${order.map(i => {
          const p = g.b[i], dark = (chFile(i) + Math.floor(i / 8)) % 2 === 1;
          const cls = [dark ? 'dk' : 'lt', ch.sel === i ? 'sel' : '', legalTo.has(i) ? (p !== '.' ? 'cap' : 'dot') : '', ch.last && (ch.last.from === i || ch.last.to === i) ? 'last' : '', i === kingSq ? 'check' : ''].join(' ');
          const lab = (ch.flip ? chRank(i) === 8 : chRank(i) === 1) ? `<span class="ch-f">${'abcdefgh'[chFile(i)]}</span>` : '', labR = (ch.flip ? chFile(i) === 7 : chFile(i) === 0) ? `<span class="ch-r">${chRank(i)}</span>` : '';
          return `<button type="button" class="ch-sq ${cls}" data-chsq="${i}" aria-label="${chSq(i)}${p !== '.' ? ' ' + p : ''}">${p !== '.' ? `<span class="ch-pc ${chWhite(p) ? 'w' : 'b'}">${CH_GLYPH[p]}</span>` : ''}${lab}${labR}</button>`; }).join('')}</div>
        <div class="ch-caps" title="Pieces taken">${caps(ch.flip ? 'b' : 'w')}</div>
      </div>
      <div class="ch-panel">
        <div class="ch-msg ${ch.st.over ? 'over' : ch.st.check ? 'chk' : ''}">${esc(ch.msg || turnTxt)}</div>
        ${ch.quiz ? `<div class="ch-quiz"><div class="muted small">📚 Answer to make your move${d ? ` (${esc(d.name)})` : ''}:</div><div class="ch-qf">${esc(ch.quiz.c.front)}</div>
          <div class="ch-qopts">${ch.quiz.opts.map((o, i) => `<button type="button" class="btn" data-chq="${i}">${esc(o)}</button>`).join('')}</div></div>` : ''}
        ${ch.promo ? `<div class="ch-quiz"><div class="muted small">Promote your pawn to:</div><div class="ch-qopts">${ch.promo.map((m, i) => `<button type="button" class="btn ch-promo" data-chpromo="${i}">${CH_GLYPH[g.turn === 'w' ? m.promo : m.promo.toLowerCase()]}</button>`).join('')}</div></div>` : ''}
        <div class="ch-moves">${ch.sans.length ? ch.sans.reduce((a, s, i) => a + (i % 2 ? ` ${esc(s)}</span>` : `<span><b>${i / 2 + 1}.</b> ${esc(s)}`), '') + (ch.sans.length % 2 ? '</span>' : '') : '<span class="muted small">Moves show here.</span>'}</div>
        <div class="row" style="gap:6px;flex-wrap:wrap">
          <button type="button" class="btn sm" data-chact="undo" ${ch.undo.length && !ch.thinking ? '' : 'disabled'}>↩️ Take back</button>
          <button type="button" class="btn sm" data-chact="flip">🔄 Turn board</button>
          <button type="button" class="btn sm" data-chact="new">♟️ New game</button>
        </div>
        <details class="ch-help"><summary>How the pieces move</summary><ul class="small">
          <li>♙ Pawn: one step forward (two on its first move), takes one step diagonally. Reach the far side to promote.</li>
          <li>♘ Knight: an L shape, and can jump over pieces.</li><li>♗ Bishop: any distance diagonally.</li><li>♖ Rook: any distance straight.</li>
          <li>♕ Queen: any distance, any direction.</li><li>♔ King: one step any way. Castle by moving the king two squares toward a rook.</li>
          <li>Checkmate: the king is attacked and can’t escape. You win!</li></ul></details>
      </div>
    </div>`;
};
function chessSetupDialog(deckId) {
  const p = S.settings.chess || {}, d = deckId ? deckById(deckId) : null, enough = d && cardsOf(d.id).filter(c => c.front && c.back).length >= 4;
  openDialog({
    title: '♟️ Chess', ok: 'Start game',
    body: `<label class="field">Play against<select name="mode"><option value="cpu" ${p.mode !== '2p' ? 'selected' : ''}>🤖 The computer</option><option value="2p" ${p.mode === '2p' ? 'selected' : ''}>👥 A friend on this device</option></select></label>
      <div class="grid2"><label class="field">Level<select name="level">${[['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']].map(([k, n]) => `<option value="${k}" ${(p.level || 'medium') === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="field">You play<select name="side"><option value="w" ${p.side !== 'b' ? 'selected' : ''}>♔ White (moves first)</option><option value="b" ${p.side === 'b' ? 'selected' : ''}>♚ Black</option></select></label></div>
      ${d ? `<label class="check"><input type="checkbox" name="study" ${p.study && enough ? 'checked' : ''} ${enough ? '' : 'disabled'}><span>📚 Study mode: answer a card from “${esc(d.name)}” before each move (a wrong answer skips your move)${enough ? '' : ' · needs 4 cards'}</span></label>` : ''}`,
    onOpen: dlg => { const f = dlg.querySelector('form'), sync = () => { const cpu = f.mode.value === 'cpu'; f.level.disabled = f.side.disabled = !cpu; if (f.study) f.study.disabled = !cpu || !enough; }; f.mode.onchange = sync; sync(); },
    onOk: f => chessStart({ mode: f.mode.value, level: f.level.value, side: f.side.value, study: !!f.study?.checked && f.mode.value === 'cpu', deckId: deckId || null }),
  });
}
document.addEventListener('click', e => {
  if (view.name !== 'chess' || !ch) return;
  const sq = e.target.closest('[data-chsq]'); if (sq) return chPick(+sq.dataset.chsq);
  const pr = e.target.closest('[data-chpromo]'); if (pr && ch.promo) { const m = ch.promo[+pr.dataset.chpromo]; ch.promo = null; return chPlay(m); }
  const q = e.target.closest('[data-chq]');
  if (q && ch.quiz) {
    const answer = ch.quiz.answer, ok = norm(ch.quiz.opts[+q.dataset.chq]) === norm(answer); ch.quiz = null;
    if (ok) { if (typeof rightSound === 'function') rightSound(); ch.msg = '✓ Right! Make your move.'; return render(); }
    if (typeof sdSound === 'function') sdSound('wrong');
    if (ch.st.check) { ch.msg = `✗ It was “${answer}”. You’re in check, so you still move this time.`; return render(); }
    ch.msg = ch.note = `✗ It was “${answer}”, so you skipped a move.`;
    ch.undo.push({ skip: true, ep: ch.g.ep }); ch.sans.push('…'); ch.g.turn = ch.g.turn === 'w' ? 'b' : 'w'; ch.g.ep = -1; ch.st = chStatus(ch.g); render(); chMaybeCpu();
    return;
  }
  const a = e.target.closest('[data-chact]'); if (!a) return;
  if (a.dataset.chact === 'flip') { ch.flip = !ch.flip; return render(); }
  if (a.dataset.chact === 'new') return chessSetupDialog(ch.deckId);
  if (a.dataset.chact === 'undo') {   // against the computer, take back your move and its answer
    const n = ch.mode === 'cpu' ? (ch.g.turn === ch.side ? 2 : 1) : 1;
    for (let k = 0; k < n && ch.undo.length; k++) { const key = chKey(ch.g), u = ch.undo.pop(); ch.g.seen[key] = Math.max(0, (ch.g.seen[key] || 1) - 1);
      if (u.skip) { ch.g.turn = ch.g.turn === 'w' ? 'b' : 'w'; ch.g.ep = u.ep; } else chUndo(ch.g, u); ch.sans.pop(); }
    ch.last = [...ch.undo].reverse().find(u => !u.skip)?.m || null; ch.sel = -1; ch.quiz = null; ch.promo = null; ch.msg = ''; ch.st = chStatus(ch.g); render(); chMaybeQuiz(); chMaybeCpu();
  }
});
Object.assign(actions, { chess: el => chessSetupDialog(el?.dataset?.id || view.deckId || null) });
