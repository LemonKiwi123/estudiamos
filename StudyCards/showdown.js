'use strict';
/* ================= Word Showdown: a two-player quiz-show board game =================
   5 categories × 5 tiles (100–500). Pick a tile, answer the question. Right: you win the points and pick next.
   Wrong: the other player can steal. One hidden "Double Down" tile lets you bet your points. Highest score wins. */
const SD_VALUES = [100, 200, 300, 400, 500];
const SD_TYPES = {
  meaning: { emoji: '🔤', title: 'Meaning' }, reverse: { emoji: '🔁', title: 'Reverse' }, listen: { emoji: '🎧', title: 'Listen' },
  blank: { emoji: '✏️', title: 'Fill the blank' }, type: { emoji: '⌨️', title: 'Type it' },
};
let sd = null, sdPrefs = { p1: '', p2: 'Player 2', c1: '#3b54e8', c2: '#cf3f3f', timer: 0, penalty: false, mode: 'types', decks: [] };
const sdPool = deckId => runnerPool(deckId);
const sdDifficulty = c => (c.lapses || 0) * 2 + (c.state === 'new' ? 1 : 0) + Math.max(0, 2.5 - (c.ease || 2.5)) * 4 + Math.min(3, c.front.length / 8);
function sdCategories(prefs, deckId) {
  if (prefs.mode === 'decks') return prefs.decks.map(id => deckById(id)).filter(Boolean).map(d => ({ key: d.id, emoji: '📚', title: d.name, deckId: d.id, kind: 'deck' }));
  const d = deckById(deckId), cats = [];
  cats.push({ key: 'meaning', ...SD_TYPES.meaning, deckId, kind: 'meaning' }, { key: 'reverse', ...SD_TYPES.reverse, deckId, kind: 'reverse' });
  if (d.frontLang && d.tts !== false) cats.push({ key: 'listen', ...SD_TYPES.listen, deckId, kind: 'listen' });
  if (sentenceItems(d).length >= 3) cats.push({ key: 'blank', ...SD_TYPES.blank, deckId, kind: 'blank' });
  cats.push({ key: 'type', ...SD_TYPES.type, deckId, kind: 'type' });
  return cats.slice(0, 5);
}
function newShowdown(deckId, prefs) {
  const cats = sdCategories(prefs, deckId);
  const used = new Set();
  const board = cats.map(cat => {
    let pool = cat.kind === 'blank' ? sentenceItems(deckById(cat.deckId)).map(x => x.card) : sdPool(cat.deckId);
    pool = shuffle(pool).sort((a, b) => sdDifficulty(a) - sdDifficulty(b));         // easier cards → lower values
    const fresh = pool.filter(c => !used.has(c.id)), src = fresh.length >= 5 ? fresh : pool;
    const picks = SD_VALUES.map((_, i) => src[Math.min(src.length - 1, Math.floor(i * src.length / 5))]);
    picks.forEach(c => used.add(c.id));
    return SD_VALUES.map((value, r) => ({ value, cardId: picks[r].id, cat, used: false, by: null }));
  });
  const flat = board.flat().filter(c => c.value >= 200); flat[Math.floor(Math.random() * flat.length)].dd = true;
  sd = { deckId, prefs, cats, board, players: [{ name: prefs.p1, color: prefs.c1, score: 0 }, { name: prefs.p2, color: prefs.c2, score: 0 }],
    turn: 0, phase: 'board', q: null, results: [], start: Date.now() };
}
/* Build the question for a tile. Higher values: more choices, then typed answers. */
function sdBuildQ(cell) {
  const c = S.cards.find(x => x.id === cell.cardId), d = deckById(c.deckId), r = SD_VALUES.indexOf(cell.value);
  const others = sdPool(c.deckId).filter(x => x.id !== c.id);
  let kind = cell.cat.kind;
  if (kind === 'deck') kind = r <= 2 ? 'meaning' : r === 3 ? 'reverse' : 'type';
  const n = [3, 4, 4, 5, 6][r];
  const q = { cell, card: c, kind, lang: d.frontLang, mlang: d.backLang };
  if (kind === 'meaning' || kind === 'listen') { q.prompt = c.front; q.answer = c.back; q.answerLang = d.backLang; q.options = pickOptions(c.back, others.map(x => x.back), n); }
  else if (kind === 'reverse') { q.prompt = c.back; q.answer = c.front; q.answerLang = d.frontLang; q.promptLang = d.backLang; q.options = pickOptions(c.front, others.map(x => x.front), n); }
  else if (kind === 'blank') {
    const b = findBlank(c.example, c.front, d.frontLang); q.blank = b; q.prompt = plainSent(c.example); q.answer = b.word; q.answerLang = d.frontLang;
    q.options = pickOptions(b.word.toLocaleLowerCase(), others.map(x => coreOf(x.front).join(' ').toLocaleLowerCase()).filter(Boolean), n);
  } else { q.prompt = c.back; q.answer = c.front; q.answerLang = d.frontLang; q.promptLang = d.backLang; q.typed = true; }
  q.promptLang ||= d.frontLang;
  return q;
}
function sdPick(ci, ri) {
  if (!sd || sd.phase !== 'board') return;
  const cell = sd.board[ci][ri]; if (cell.used) return;
  const q = sdBuildQ(cell); q.player = sd.turn; q.stealing = false;
  sd.q = q;
  if (cell.dd) { sd.phase = 'wager'; sdSound('dd'); render(); return; }
  sdAsk();
}
function sdAsk() {
  sd.phase = 'q'; sd.q.answered = false; sd.q.deadline = sd.prefs.timer ? Date.now() + sd.prefs.timer * 1000 : 0;
  render();
  const q = sd.q;
  if (q.kind === 'listen' || autoplayOn()) setTimeout(() => speak(q.kind === 'blank' ? plainSent(q.card.example) : q.prompt, q.promptLang), 200);
  if (q.typed) setTimeout(() => $('#sdType')?.focus(), 50);
}
function sdAnswer(given) {
  const q = sd.q; if (!q || sd.phase !== 'q' || q.answered) return;
  const ok = given != null && (q.typed ? checkTyped(given, q.answer).ok : norm(given) === norm(q.answer));
  q.answered = true; q.given = given; q.ok = ok;
  const p = sd.players[q.player], stake = q.wager ?? q.cell.value;
  sd.results.push({ player: q.player, cardId: q.card.id, q: q.prompt, a: q.answer, given, ok });
  if (ok) { p.score += stake; q.cell.by = q.player; sdSound('right'); }
  else { if (q.wager != null || sd.prefs.penalty) p.score -= stake; sdSound('wrong'); }
  q.delta = ok ? stake : (q.wager != null || sd.prefs.penalty) ? -stake : 0;
  sd.phase = 'reveal'; render();
  if (ok && autoplayOn()) speak(q.answer, q.answerLang);
}
function sdSteal(accept) {
  const q = sd.q;
  if (accept) { q.player = 1 - q.player; q.stealing = true; q.wager = null; q.options = q.options?.filter(o => o !== q.given); sdAsk(); }
  else sdFinishTile(null);
}
function sdContinue() {
  const q = sd.q;
  if (!q.ok && !q.stealing && q.wager == null) { sd.phase = 'steal'; render(); return; }   // offer a steal
  sdFinishTile(q.ok ? q.player : null);
}
function sdFinishTile(winner) {
  const q = sd.q; q.cell.used = true;
  sd.turn = winner != null ? winner : 1 - sd.turn;      // a correct answer keeps control of the board
  sd.q = null;
  if (sd.board.flat().every(c => c.used)) { sd.phase = 'over'; sdSound('end'); sdRecord(); }
  else sd.phase = 'board';
  render();
}
function sdRecord() {
  const mine = sd.results.filter(r => r.player === 0), [a, b] = sd.players;
  const winner = a.score === b.score ? 'tie' : a.score > b.score ? a.name : b.name;
  if (typeof addHistory === 'function') addHistory({ type: 'showdown', deckId: sd.deckId, deckName: deckById(sd.deckId)?.name, correct: mine.filter(r => r.ok).length, total: mine.length,
    score: mine.length ? Math.round(mine.filter(r => r.ok).length / mine.length * 100) : 0, timeMs: Date.now() - sd.start,
    detail: `${a.name} ${a.score} – ${b.score} ${b.name}${winner === 'tie' ? ' (tie)' : `: ${winner} won`}`, items: sd.results });
}
function sdSound(kind) {
  if (S.settings?.mascotSound === false) return;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  audioCtx ||= new AC(); const ac = audioCtx; if (ac.state === 'suspended') ac.resume();
  const t0 = ac.currentTime + 0.01;
  const tone = (s, dur, f, type = 'sine', vol = 0.2) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0 + s); g.gain.exponentialRampToValueAtTime(vol, t0 + s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + s + dur);
    o.connect(g); g.connect(ac.destination); o.start(t0 + s); o.stop(t0 + s + dur + 0.02); };
  if (kind === 'right') { tone(0, 0.15, 660); tone(0.12, 0.25, 990); }
  else if (kind === 'wrong') { tone(0, 0.35, 150, 'sawtooth', 0.12); tone(0.05, 0.35, 140, 'sawtooth', 0.12); }
  else if (kind === 'dd') { [523, 659, 784, 1047].forEach((f, i) => tone(i * 0.11, 0.2, f, 'triangle', 0.18)); }
  else if (kind === 'end') { [392, 523, 659, 784, 659, 784].forEach((f, i) => tone(i * 0.14, 0.24, f, 'triangle', 0.18)); }
}

/* ---------- Views ---------- */
views.showdownSetup = () => {
  const d = deckById(view.deckId); if (!d) { view = { name: 'home' }; return views.home(); }
  const me = typeof currentProfile === 'function' ? currentProfile() : null, others = (typeof profiles !== 'undefined' ? profiles.list : []).filter(p => p.id !== me?.id);
  const p = sdPrefs; p.p1 ||= me?.name || 'Player 1';
  const sw = (name, cur) => `<div class="row" style="gap:6px;margin-top:6px">${TW_COLORS.map(c => `<label class="swatch" style="background:${c}"><input type="radio" name="${name}" value="${c}" ${c === cur ? 'checked' : ''}></label>`).join('')}</div>`;
  const typeCats = sdCategories({ mode: 'types' }, d.id);
  const decks = S.decks.filter(x => sdPool(x.id).length >= 5);
  return `
    <div class="crumbs"><a data-act="home">Decks</a> / <a data-act="openDeck" data-id="${d.id}">${esc(d.name)}</a> / <a data-act="games" data-id="${d.id}">Games</a> / Word Showdown</div>
    <h2 style="margin-bottom:12px">🎤 Word Showdown</h2>
    ${typeof friendTip === 'function' ? friendTip('monkey', 'showdown') : ''}
    <form class="panel stack" id="sdForm">
      <p class="muted" style="margin:0">Two players take turns picking tiles from the board. Bigger numbers mean harder questions. Answer right to win the points and pick again.
        Get it wrong and your opponent can <b>steal</b>! Find the hidden ⭐ <b>Double Down</b> tile to bet your points. Highest score at the end wins.</p>
      <div class="grid2">
        <div class="feat"><h4>Player 1</h4><label class="field">Name<input name="p1" maxlength="24" value="${esc(p.p1)}" required></label>${sw('c1', p.c1)}</div>
        <div class="feat"><h4>Player 2</h4><label class="field">Name<input name="p2" maxlength="24" value="${esc(p.p2)}" required list="sdProfiles"></label>
          ${others.length ? `<datalist id="sdProfiles">${others.map(o => `<option value="${esc(o.name)}">`).join('')}</datalist>` : ''}${sw('c2', p.c2)}</div>
      </div>
      <div><b>Categories</b>
        <div class="stack" style="margin-top:8px">
          <label class="check"><input type="radio" name="mode" value="types" ${p.mode !== 'decks' ? 'checked' : ''}><span><b>Question types from “${esc(d.name)}”</b><br><span class="muted small">${typeCats.map(c => `${c.emoji} ${c.title}`).join(' · ')}</span></span></label>
          <label class="check"><input type="radio" name="mode" value="decks" ${p.mode === 'decks' ? 'checked' : ''} ${decks.length >= 2 ? '' : 'disabled'}><span><b>Use my decks as categories</b> <span class="muted small">(pick 2–5)${decks.length >= 2 ? '' : ' · needs 2+ decks with at least 5 cards'}</span></span></label>
          <div class="sd-decks">${decks.map(x => `<label class="check"><input type="checkbox" name="dk_${x.id}" ${(p.decks.length ? p.decks.includes(x.id) : x.id === d.id) ? 'checked' : ''}><span>${esc(x.name)} <span class="muted small">(${sdPool(x.id).length})</span></span></label>`).join('')}</div>
        </div></div>
      <div class="grid2">
        <div><b>Answer timer</b><div class="seg">${[[0, 'Off'], [15, '15 s'], [30, '30 s']].map(([v, l]) => `<label><input type="radio" name="timer" value="${v}" ${p.timer === v ? 'checked' : ''}>${l}</label>`).join('')}</div></div>
        <div><b>Rules</b><label class="check" style="margin-top:8px"><input type="checkbox" name="penalty" ${p.penalty ? 'checked' : ''}><span>Wrong answers lose points</span></label></div>
      </div>
      <div class="row-between"><span class="muted small">${sdPool(d.id).length < 5 ? '⚠️ This deck needs at least 5 cards.' : ''}</span><button type="submit" class="btn primary big" ${sdPool(d.id).length >= 5 ? '' : 'disabled'}>Start the show!</button></div>
    </form>`;
};
views.showdown = () => {
  if (!sd) { view = { name: 'home' }; return views.home(); }
  const s = sd, [A, B] = s.players;
  const pcard = i => { const P = s.players[i], active = (s.phase === 'board' && s.turn === i) || (['q', 'wager'].includes(s.phase) && s.q?.player === i);
    return `<div class="tw-player ${active ? 'active' : ''} ${s.phase === 'over' && P.score > s.players[1 - i].score ? 'winner' : ''}" style="--pc:${P.color}"><span class="tw-dot"></span>
      <div><b>${esc(P.name)}</b><div class="muted small">${s.phase === 'board' && s.turn === i ? 'Pick a tile!' : ''}</div></div><span class="sd-score">${P.score}</span></div>`; };
  const board = `<div class="sd-board" style="grid-template-columns:repeat(${s.cats.length},1fr)">
    ${s.cats.map(c => `<div class="sd-cat"><span>${c.emoji}</span>${esc(c.title)}</div>`).join('')}
    ${SD_VALUES.map((v, r) => s.cats.map((c, ci) => { const cell = s.board[ci][r];
      return cell.used ? `<div class="sd-tile used" style="${cell.by != null ? `--pc:${s.players[cell.by].color}` : ''}">${cell.by != null ? '✓' : ''}</div>`
        : `<button type="button" class="sd-tile" data-act="sdPick" data-c="${ci}" data-r="${r}" ${s.phase === 'board' ? '' : 'disabled'}>${v}</button>`; }).join('')).join('')}
  </div>`;
  let panel = '';
  const q = s.q;
  if (s.phase === 'wager') {
    const P = s.players[q.player], max = Math.max(P.score, 500);
    panel = `<div class="sd-q dd"><div class="sd-dd">⭐ DOUBLE DOWN! ⭐</div><p style="margin:0">${esc(P.name)}, how many points do you want to bet? (up to ${max})</p>
      <form id="sdWager" class="type-row" style="max-width:320px;margin:10px auto 0"><input id="sdWagerIn" type="number" min="0" max="${max}" step="50" value="${Math.min(max, Math.max(100, Math.round(P.score / 2 / 50) * 50))}"><button class="btn primary" type="submit">Bet!</button></form></div>`;
  } else if (s.phase === 'q' || s.phase === 'reveal' || s.phase === 'steal') {
    const P = s.players[q.player], val = q.wager ?? q.cell.value;
    const promptHtml = q.kind === 'listen' && s.phase === 'q'
      ? `<div class="row" style="justify-content:center">${speakBtn(q.prompt, q.promptLang, true)}<button type="button" class="btn sm" data-act="sdReplay" data-slow="1">🐢 Slower</button></div>`
      : q.kind === 'blank' ? `<div class="sentence">${esc(q.blank.before)}<span class="blank">${s.phase === 'q' ? '&nbsp;' : esc(q.blank.word)}</span>${esc(q.blank.after)}</div>`
      : `<div class="row" style="justify-content:center;gap:8px"><span class="tw-word">${esc(q.prompt)}</span>${speakBtn(q.prompt, q.promptLang)}</div>`;
    const label = { meaning: 'What does this mean?', reverse: `How do you say this in ${langName(q.lang)}?`, listen: 'Listen. What does it mean?', blank: 'Pick the missing word', type: `Type it in ${langName(q.lang)}` }[q.kind];
    let answer = '';
    if (s.phase === 'q') answer = q.typed
      ? `<form id="sdTypeForm" class="type-row"><input id="sdType" autocomplete="off" spellcheck="false" lang="${esc(q.answerLang)}" placeholder="Your answer…"><button class="btn primary" type="submit">Answer</button></form>`
      : `<div class="options">${q.options.map((o, i) => `<button type="button" class="opt" data-act="sdOpt" data-i="${i}"><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`).join('')}</div>`;
    else if (s.phase === 'reveal') answer = `<div class="feedback ${q.ok ? 'ok' : 'bad'}"><div>${q.ok ? `<b class="ok">Correct! ${esc(P.name)} +${val}</b>` : `<b class="bad">${q.given == null ? 'Time’s up!' : 'Not quite.'}</b> ${q.delta ? `${esc(P.name)} ${q.delta}` : ''} The answer was <b>${esc(q.answer)}</b>`}
        <div class="muted small">${esc(q.card.front)} = ${esc(q.card.back)}</div></div><button type="button" class="btn primary" id="sdNext" data-act="sdContinue">Continue <kbd style="background:transparent;color:inherit;border-color:currentColor;opacity:.7">Enter</kbd></button></div>`;
    else answer = `<div class="feedback bad"><div><b>${esc(s.players[1 - q.player].name)}, do you want to steal it for ${val} points?</b></div>
        <div class="row"><button type="button" class="btn" data-act="sdSteal" data-v="0">Pass</button><button type="button" class="btn primary" data-act="sdSteal" data-v="1">Steal! 🦝</button></div></div>`;
    panel = `<div class="sd-q" style="--pc:${P.color}">
      <div class="row-between small"><span>${q.cell.cat.emoji} <b>${esc(q.cell.cat.title)}</b> · ${q.wager != null ? `⭐ Double Down: ${val}` : val} points</span><span style="color:${P.color};font-weight:700">${q.stealing ? '🦝 Steal: ' : ''}${esc(P.name)}</span></div>
      <div class="prompt-label muted" style="margin-top:8px">${label}</div>${promptHtml}
      ${s.prefs.timer && s.phase === 'q' ? '<div class="tw-timer"><div id="sdTimer" style="width:100%"></div></div>' : ''}
      ${answer}</div>`;
  } else if (s.phase === 'over') {
    const tie = A.score === B.score, W = A.score > B.score ? A : B;
    panel = `<div class="panel tw-over">${mascot(100, 'party')}<div class="word sm" style="color:${tie ? 'inherit' : W.color}">${tie ? 'It’s a tie! 🤝' : `${esc(W.name)} wins the showdown! 🏆`}</div>
      <p class="muted" style="margin:0">${esc(A.name)} ${A.score} · ${esc(B.name)} ${B.score}</p>
      ${friendTip('monkey', 'result', { pct: 90 }, { compact: true })}
      <div class="row" style="justify-content:center"><button type="button" class="btn primary" data-act="sdAgain">Rematch</button>
        <button type="button" class="btn" data-act="sdSetup" data-id="${s.deckId}">Change setup</button><button type="button" class="btn" data-act="games" data-id="${s.deckId}">Other games</button></div></div>`;
  }
  return `
    <div class="study-top"><button type="button" class="btn ghost" data-act="sdQuit">← Games</button><div class="prompt-label muted">🎤 Word Showdown</div>
      <span class="muted small">${s.board.flat().filter(c => !c.used).length} tiles left</span></div>
    <div class="tw-players">${pcard(0)}${pcard(1)}</div>
    ${panel}${s.phase === 'over' ? '' : board}
    <div class="shortcuts">Keys 1–6 to answer · Enter to continue</div>`;
};
Object.assign(actions, {
  sdSetup: el => go({ name: 'showdownSetup', deckId: el.dataset.id }),
  sdPick: el => sdPick(+el.dataset.c, +el.dataset.r),
  sdOpt: el => sdAnswer(sd.q.options[+el.dataset.i]),
  sdContinue: () => sdContinue(),
  sdSteal: el => sdSteal(el.dataset.v === '1'),
  sdReplay: el => speak(sd.q.prompt, sd.q.promptLang, el.dataset.slow ? 0.65 : 1),
  sdAgain: () => { newShowdown(sd.deckId, sd.prefs); go({ name: 'showdown' }); },
  sdQuit: () => { if (sd && sd.phase !== 'over' && sd.results.length) confirmDlg('Leave the showdown?', 'This game won’t be saved.', 'Leave', () => go({ name: 'games', deckId: sd.deckId })); else go({ name: 'games', deckId: sd.deckId }); },
});
document.addEventListener('submit', e => {
  if (e.target.id === 'sdForm') {
    e.preventDefault(); const f = e.target;
    const decks = S.decks.filter(x => f['dk_' + x.id]?.checked).map(x => x.id).slice(0, 5);
    const mode = f.mode.value;
    if (mode === 'decks' && decks.length < 2) { toast('Pick at least 2 decks for the categories'); return; }
    sdPrefs = { p1: f.p1.value.trim() || 'Player 1', p2: f.p2.value.trim() || 'Player 2', c1: f.c1.value, c2: f.c2.value === f.c1.value ? TW_COLORS.find(c => c !== f.c1.value) : f.c2.value,
      timer: +f.timer.value, penalty: f.penalty.checked, mode, decks };
    newShowdown(view.deckId, sdPrefs); go({ name: 'showdown' });
  }
  if (e.target.id === 'sdTypeForm') { e.preventDefault(); const v = $('#sdType').value; if (!v.trim()) { toast('Type an answer'); return; } sdAnswer(v); }
  if (e.target.id === 'sdWager') {
    e.preventDefault(); const P = sd.players[sd.q.player], max = Math.max(P.score, 500);
    sd.q.wager = Math.max(0, Math.min(max, Math.round(+$('#sdWagerIn').value || 0))); sdAsk();
  }
});
document.addEventListener('keydown', e => {
  if (view.name !== 'showdown' || !sd || $('#dlg').open || e.ctrlKey || e.altKey) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (sd.phase === 'q' && !sd.q.typed && /^[1-9]$/.test(e.key) && sd.q.options[+e.key - 1]) { e.preventDefault(); sdAnswer(sd.q.options[+e.key - 1]); }
  else if (sd.phase === 'reveal' && e.key === 'Enter') { e.preventDefault(); sdContinue(); }
  else if (sd.phase === 'q' && e.key.toLowerCase() === 'r') speak(sd.q.prompt, sd.q.promptLang);
});
setInterval(() => {
  if (view.name !== 'showdown' || !sd || sd.phase !== 'q' || !sd.q.deadline || $('#dlg').open) return;
  const left = sd.q.deadline - Date.now(), bar = $('#sdTimer');
  if (bar) { bar.style.width = Math.max(0, left / (sd.prefs.timer * 1000) * 100) + '%'; bar.classList.toggle('low', left < 5000); }
  if (left <= 0) sdAnswer(null);
}, 100);
