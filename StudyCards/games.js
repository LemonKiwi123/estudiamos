'use strict';
/* ================= Memory games: Match words, Finish the sentence, Listen & tap ================= */
const ARTICLES = new Set('el la los las un una unos unas lo the a an to le les l der die das den dem des ein eine einen il gli i o os as het een de'.split(' '));
const NOSPACE = l => /^(ja|zh|th|lo|km|my)(-|$)/i.test(l || '');
function plainSent(s) { return String(s || '').replace(/\[([^\]]+)\]/g, '$1'); }
function wordTokens(s) { return [...String(s || '').matchAll(/[\p{L}\p{M}\p{N}'’-]+/gu)].map(m => ({ t: m[0], i: m.index })); }
const fold = s => String(s).toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function commonPrefix(a, b) { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; }
const coreOf = front => wordTokens(front).map(x => x.t).filter(w => !ARTICLES.has(w.toLowerCase()));
function fmtTime(ms) { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }

/* Find which word of an example sentence to blank out. [brackets] in the sentence mark it explicitly. */
function findBlank(sentence, front, lang) {
  if (!sentence) return null;
  const br = sentence.match(/\[([^\]]+)\]/);
  if (br) return { before: plainSent(sentence.slice(0, br.index)), word: br[1], after: plainSent(sentence.slice(br.index + br[0].length)) };
  const s = sentence, cut = (i, len) => ({ before: s.slice(0, i), word: s.slice(i, i + len), after: s.slice(i + len) });
  if (NOSPACE(lang)) { const f = front.trim(), i = s.indexOf(f); return i < 0 ? null : cut(i, f.length); }
  const cores = coreOf(front);
  if (!cores.length) return null;
  if (cores.length > 1) { const m = s.match(new RegExp(cores.map(escRe).join('[\\s,]+'), 'iu')); if (m) return cut(m.index, m[0].length); }
  const toks = wordTokens(s);
  for (const w of [...cores].sort((a, b) => b.length - a.length)) {
    const t = toks.find(t => fold(t.t) === fold(w)); if (t) return cut(t.i, t.t.length);
  }
  if (cores.length === 1 && cores[0].length >= 4) {      // conjugated / inflected forms: comer → como, hablar → hablas
    const w = fold(cores[0]); let best = null, bestLen = 0;
    for (const t of toks) {
      const tt = fold(t.t), p = commonPrefix(tt, w), need = Math.max(3, Math.min(w.length, tt.length) - 2);
      if (p >= need && p > bestLen) { best = t; bestLen = p; }
    }
    if (best) return cut(best.i, best.t.length);
  }
  return null;
}
function pickOptions(correct, pool, n) {
  const seen = new Set([norm(correct)]), others = [];
  for (const t of shuffle(pool)) { const k = norm(t); if (k && !seen.has(k)) { seen.add(k); others.push(t); } if (others.length >= n - 1) break; }
  return shuffle([correct, ...others]);
}
function sentenceItems(d) {
  return cardsOf(d.id).map(c => { const b = c.example && findBlank(c.example, c.front, d.frontLang); return b ? { card: c, blank: b } : null; }).filter(Boolean);
}
function listenItems(d) {
  if (NOSPACE(d.frontLang)) return [];
  const out = [];
  for (const c of cardsOf(d.id)) {
    const ex = plainSent(c.example), wt = wordTokens(ex);
    if (ex && wt.length >= 2 && wt.length <= 14) out.push({ card: c, text: ex, tr: c.exampleTr, words: wt.map(x => x.t) });
    else { const fw = wordTokens(c.front); if (fw.length >= 2 && fw.length <= 10) out.push({ card: c, text: c.front, tr: c.back, words: fw.map(x => x.t) }); }
  }
  return out;
}
function gameAvail(d) {
  const n = cardsOf(d.id).length, sent = sentenceItems(d).length, lis = listenItems(d).length, rp = runnerPool(d.id).length, rw = runWordPool(d.id).length, best = (S.runnerBest || {})[d.id];
  return {
    trails: { ok: rp >= 4, info: rp >= 4 ? '🗺️ Adventure · saves your progress' : 'Needs at least 4 cards with text on both sides' },
    saga: { ok: rp >= 4, info: rp >= 4 ? '⚔️ Turn-based RPG · saves your progress' : 'Needs at least 4 cards with text on both sides' },
    wordtown: { ok: rp >= 4, info: rp >= 4 ? '👥 2–4 players · play the computer' : 'Needs at least 4 cards with text on both sides' },
    priceparty: { ok: rp >= 4, info: rp >= 4 ? '👤 or 👥 · win real peanuts' : 'Needs at least 4 cards with text on both sides' },
    spinspell: { ok: ssUsable(d.id).length >= 3 || ssSentences(d.id).length >= 3, info: ssUsable(d.id).length >= 3 || ssSentences(d.id).length >= 3 ? '👤 or 👥 · words or sentences' : 'Needs 3+ words with letters (not available for character-based languages)' },
    millionaire: { ok: rp >= 6, info: rp >= 6 ? 'Win real peanuts for the shop!' : 'Needs at least 6 cards with text on both sides' },
    showdown: { ok: rp >= 5, info: rp >= 5 ? '👥 2 players on this PC' : 'Needs at least 5 cards with text on both sides' },
    tower: { ok: rp >= 3, info: rp >= 3 ? '👥 2 players on this PC' : 'Needs at least 3 cards with text on both sides' },
    runner: { ok: rw >= 3, info: rw >= 3 ? (best ? `Your best: ${best} jumps` : `Endless: how far can you go? (${rw} cards)`) : 'Needs at least 3 cards with one line on each side (not stacked like a verb chart)' },
    chess: { ok: true, info: '🤖 vs computer or 👥 2 players · works with any deck' },
    numbers: { ok: true, info: '🎧 Listening, reading and writing · no cards needed' },
    match: { ok: n >= 3, info: n >= 3 ? `Up to ${Math.min(n, 18)} pairs per game` : 'Needs at least 3 cards' },
    builder: { ok: true, info: '📖 Real sentences, with word types, meanings and a hot/cold meter · your cards’ sentences first' },
    sentence: { ok: sent >= 1 && n >= 2, info: sent ? `${sent} sentence${sent > 1 ? 's' : ''} ready` : 'Add example sentences to your cards first' },
    speak: (() => { const n = skPool(d.id).length, sup = skSupport(); return { ok: n >= 1 && !!d.frontLang && sup.ok, info: !d.frontLang ? 'Set a front language for this deck first' : !sup.ok ? 'Needs Chrome, Edge or Safari on a secure address' : `🎙️ Uses your microphone · ${n} card${n === 1 ? '' : 's'}` }; })(),
    listen: { ok: !!d.frontLang && d.tts !== false && n >= 2, info: d.tts === false ? 'Read aloud is turned off for this deck' : !d.frontLang ? 'Set a front language for this deck first' : lis >= 3 ? `${lis} sentences & phrases` : 'Single words. Add example sentences to hear full sentences.' },
  };
}

let game = null;
const GAMES = {
  match: { emoji: '🧩', title: 'Match words', desc: 'Tap a word, then tap its meaning. Clear the board as fast as you can.' },
  sentence: { emoji: '✏️', title: 'Finish the sentence', desc: 'Pick the missing word in an example sentence.' },
  builder: { emoji: '🧩', title: 'Sentence Builder', desc: 'Put real sentences, written by people, back together word by word. Each word shows what kind of word it is and what it means, a hot/cold meter shows how close you are, and 🎯 Practice lets you fill in just the nouns, verbs or other kinds of words. Spanish, French, Japanese, Italian, Romanian and Esperanto.' },
  speak: { emoji: '🎙️', title: 'Say it!', desc: 'See what a word means, then say it out loud. Estudiamos listens through your microphone and checks it.' },
  listen: { emoji: '🎧', title: 'Listen & tap', desc: 'Hear a sentence, then tap the words you heard in the right order.' },
  priceparty: { emoji: '🏷️', title: 'Price Party', desc: 'Name the products to win drop chips, then bounce them down the peg board for prizes! 1–2 players.' },
  saga: { emoji: '🗡️', title: 'Lexicon Saga', desc: 'A turn-based word RPG! Lead a knight, a scribe and a cantor through towns, fields and dungeons. Fight by picking meanings, cast spells by spelling words.' },
  trails: { emoji: '🌿', title: 'Wordling Trails', desc: 'A pixel adventure! Explore towns and tall grass, battle and catch word-spirits by answering cards, level them up and beat Deck Master Iris.' },
  wordtown: { emoji: '🎲', title: 'Word Town', desc: 'Roll the dice, travel the board and answer words to buy places, build bookshelves and collect rent. 2–4 players, animal pieces!' },
  spinspell: { emoji: '🎡', title: 'Spin & Spell', desc: 'Spin the wheel, guess letters and solve the hidden word. Beware of Bankrupt! 1–2 players.' },
  millionaire: { emoji: '🥜', title: 'Peanut Millionaire', desc: 'Answer 15 harder-and-harder questions to climb to 1,000,000 peanuts. Use your lifelines wisely!' },
  showdown: { emoji: '🎤', title: 'Word Showdown', desc: 'A quiz-show board for 2 players: pick tiles worth 100–500, steal wrong answers, and find the Double Down!' },
  tower: { emoji: '🧱', title: 'Word Tower', desc: 'Two players take turns pulling the block with the right meaning. One wrong pick and the tower crashes!' },
  numbers: { emoji: '🔢', title: 'Numbers & ABC', desc: 'Hear, read and write numbers and letters in the language you’re learning. Works without any cards.' },
  chess: { emoji: '♟️', title: 'Chess', desc: 'Play chess against the computer (easy, medium or hard) or a friend. Turn on 📚 study mode to answer a card before each move.' },
  runner: { emoji: '🐘', title: 'Elephant run', desc: 'Help the elephant jump over stacks of books by picking the right meaning before they arrive.' },
};

function startGame(type, deckId) {
  if (type === 'builder') { typeof startSentenceBuilder === 'function' ? startSentenceBuilder(deckId) : startBuilder(deckId); return; }
  if (type === 'runner') { startRunner(deckId); return; }
  if (type === 'chess') { chessSetupDialog(deckId); return; }
  if (type === 'numbers') { startNumGame(deckId); return; }
  if (type === 'speak') { startSpeak(deckId); return; }
  if (type === 'tower') { go({ name: 'towerSetup', deckId }); return; }
  if (type === 'showdown') { go({ name: 'showdownSetup', deckId }); return; }
  if (type === 'millionaire') { startMillionaire(deckId); return; }
  if (type === 'priceparty') { go({ name: 'priceSetup', deckId }); return; }
  if (type === 'wordtown') { go({ name: 'townSetup', deckId }); return; }
  if (type === 'trails') { go({ name: 'trailsTitle', deckId }); return; }
  if (type === 'saga') { go({ name: 'sagaTitle', deckId }); return; }
  if (type === 'spinspell') { go({ name: 'spinSetup', deckId }); return; }
  const d = deckById(deckId), all = cardsOf(deckId);
  if (type === 'match') {
    const picked = [], fs = new Set(), bs = new Set();
    for (const c of shuffle(all)) {
      const f = norm(c.front) || (/<img /.test(c.frontHtml || '') ? 'img:' + c.id : ''), b = norm(c.back) || (/<img /.test(c.backHtml || '') ? 'img:' + c.id : '');
      if (!f || !b || fs.has(f) || bs.has(b)) continue;
      fs.add(f); bs.add(b); picked.push(c); if (picked.length >= 18) break;
    }
    if (picked.length < 3) { toast('Need at least 3 cards with different words'); return; }
    const boards = []; for (let i = 0; i < picked.length; i += 6) boards.push(picked.slice(i, i + 6));
    if (boards.length > 1 && boards.at(-1).length < 3) boards.at(-2).push(...boards.pop());
    game = { type, deckId, boards, b: 0, start: Date.now(), mistakes: 0, missed: new Set(), matched: new Set(), sel: null, total: picked.length };
    setupBoard();
  } else if (type === 'sentence') {
    const items = shuffle(sentenceItems(d)).slice(0, 10);
    if (!items.length) { toast('Add example sentences to your cards first'); return; }
    items.forEach(it => {
      const pool = all.filter(c => c.id !== it.card.id).map(c => coreOf(c.front).join(' ').toLocaleLowerCase()).filter(Boolean);
      it.options = pickOptions(it.blank.word.toLocaleLowerCase(), pool, 4);
    });
    game = { type, deckId, items, i: 0, start: Date.now() };
  } else {
    if (!d.frontLang || d.tts === false) { toast(d.tts === false ? 'Read aloud is turned off for this deck' : 'Set a front language for this deck first'); return; }
    const li = listenItems(d); let items;
    if (li.length >= 3) {
      items = shuffle(li).slice(0, 10).map(it => {
        const have = new Set(it.words.map(norm));
        const pool = [...new Set(li.filter(x => x !== it).flatMap(x => x.words).filter(w => !have.has(norm(w))))];
        const decoys = shuffle(pool).slice(0, Math.min(3, Math.max(1, Math.round(it.words.length / 3))));
        return { ...it, mode: 'tap', tiles: shuffle([...it.words, ...decoys]).map((t, k) => ({ k, t })), placed: [] };
      });
    } else {
      items = shuffle(all).slice(0, 10).map(c => ({ card: c, mode: 'pick', text: c.front, tr: c.back, options: pickOptions(c.front, all.filter(x => x.id !== c.id).map(x => x.front), 6) }));
    }
    game = { type, deckId, items, i: 0, start: Date.now() };
  }
  go({ name: 'game' });
  if (type === 'listen') setTimeout(playGameAudio, 250);
}
function setupBoard() {
  const bd = game.boards[game.b];
  game.left = shuffle(bd.map(c => c.id)); game.right = shuffle(bd.map(c => c.id)); game.sel = null;
}
const gItem = () => game?.items?.[game.i];
function playGameAudio(slow) {
  const it = gItem(), d = deckById(game?.deckId); if (!it || !d) return;
  speak(it.text, d.frontLang, slow ? 0.65 : 1);
}

function matchPick(side, id, el) {
  if (!game || game.type !== 'match' || game.matched.has(id) || game.lock) return;
  const d = deckById(game.deckId), c = S.cards.find(x => x.id === id);
  if (side === 'L' && autoplayOn()) speak(c.front, d.frontLang);
  if (!game.sel || game.sel.side === side) { game.sel = game.sel && game.sel.side === side && game.sel.id === id ? null : { side, id }; render(); return; }
  const other = game.sel; game.sel = null;
  const elA = document.querySelector(`.mtile[data-side="${other.side}"][data-id="${other.id}"]`);
  elA?.classList.remove('sel'); game.lock = true;
  if (other.id === id) {
    game.matched.add(id); el.classList.add('right'); elA?.classList.add('right');
    setTimeout(() => {
      game.lock = false;
      if (game.boards[game.b].every(c => game.matched.has(c.id))) {
        if (typeof playFanfare === 'function') playFanfare();   // 🎺 board cleared
        if (game.b < game.boards.length - 1) { game.b++; setupBoard(); render(); }
        else { game.time = Date.now() - game.start; recordGame(); go({ name: 'gameResults' }); }
      } else render();
    }, 350);
  } else {
    game.mistakes++; game.missed.add(side === 'L' ? id : other.id);
    el.classList.add('wrong'); elA?.classList.add('wrong');
    setTimeout(() => { game.lock = false; render(); }, 450);
  }
}
function gameAnswer(result) {
  const it = gItem(); if (!it || it.result) return;
  it.result = result; render();
  const d = deckById(game.deckId), wait = result === 'ok' && typeof rightSound === 'function' ? rightSound() : 0;   // 🎺 then read it out
  const say = (t, l) => setTimeout(() => { if (gItem() === it) speak(t, l); }, wait);
  if (game.type === 'sentence' && autoplayOn()) say(plainSent(it.card.example), d.frontLang);
  if (game.type === 'listen' && it.mode === 'pick' && autoplayOn()) say(it.card.front, d.frontLang);
  setTimeout(() => $('#gameNextBtn')?.focus({ preventScroll: true }), 0);
}
function gamePick(i) {
  const it = gItem(); if (!it || it.result || !it.options[i]) return;
  it.given = it.options[i];
  const correct = game.type === 'sentence' ? it.blank.word : it.text;
  gameAnswer(norm(it.given) === norm(correct) ? 'ok' : 'bad');
}
function gameCheck() {
  const it = gItem(); if (!it || it.result || it.mode !== 'tap' || !it.placed.length) return;
  const got = it.placed.map(k => it.tiles[k].t);
  gameAnswer(got.length === it.words.length && got.every((w, i) => norm(w) === norm(it.words[i])) ? 'ok' : 'bad');
}
function gamePlace(k) { const it = gItem(); if (!it || it.result || it.placed.includes(k)) return; it.placed.push(k); render(); }
function gameUnplace(k) { const it = gItem(); if (!it || it.result) return; it.placed = it.placed.filter(x => x !== k); render(); }
function gameNext() {
  if (!game?.items) return;
  if (game.i < game.items.length - 1) { game.i++; render(); if (game.type === 'listen') setTimeout(playGameAudio, 150); }
  else { game.time = Date.now() - (game.start || Date.now()); recordGame(); go({ name: 'gameResults' }); }
}
setInterval(() => { const t = $('#gTimer'); if (t && game?.type === 'match' && view.name === 'game') t.textContent = '⏱ ' + fmtTime(Date.now() - game.start); }, 500);

/* ---------- Views ---------- */
views.games = () => {
  const d = deckById(view.deckId); if (!d) { view = { name: 'home' }; return views.home(); }
  const av = gameAvail(d);
  return `
    <div class="crumbs"><a data-act="home">Decks</a> / <a data-act="openDeck" data-id="${d.id}">${esc(d.name)}</a> / Games</div>
    <h2 style="margin-bottom:4px">Memory games</h2>
    <p class="muted" style="margin:0 0 18px">Practice with the cards in “${esc(d.name)}”. Games don’t change your study schedule.</p>
    ${friendTip('monkey', 'games')}
    <div class="game-grid">${Object.entries(GAMES).filter(([k]) => typeof gameFitsSubject !== 'function' || gameFitsSubject(k, d)).map(([k, g]) => `
      <article class="game-card"><div class="emoji">${k === 'runner' ? (mascot(40) || g.emoji) : g.emoji}</div><h3>${g.title}</h3>
        <p class="muted small" style="margin:0">${g.desc}</p>
        <div class="small" style="color:${av[k].ok ? 'var(--muted)' : 'var(--hard)'}">${esc(av[k].info)}</div>
        ${(k === 'sentence' || k === 'listen') && (typeof deckSubject !== 'function' || deckSubject(d) === 'lang') && cardsOf(d.id).some(c => !c.example && c.front) ? `<button type="button" class="btn sm" data-act="fillExamples" data-id="${d.id}">✨ Add example sentences</button>` : ''}
        <button type="button" class="btn ${av[k].ok ? 'primary' : ''}" data-act="startGame" data-type="${k}" data-id="${d.id}" ${av[k].ok ? '' : 'disabled'}>Play</button>
      </article>`).join('')}</div>
    <div class="panel" style="margin-top:18px"><h3>Tip: add example sentences</h3>
      <p class="muted small" style="margin:6px 0 0">“Finish the sentence” and “Listen &amp; tap” work best when your cards have example sentences.
      Edit a card and fill in <b>Example sentence</b>. The game finds the word in the sentence automatically. If the word is spelled differently there
      (for example a verb form), put it in square brackets: <i>Yo [como] pan.</i></p></div>`;
};

views.game = () => {
  if (!game) { view = { name: 'home' }; return views.home(); }
  const d = deckById(game.deckId); if (!d) { view = { name: 'home' }; return views.home(); }
  const g = GAMES[game.type];
  if (game.type === 'match') {
    const byId = id => S.cards.find(c => c.id === id);
    const done = game.boards.slice(0, game.b).reduce((a, b) => a + b.length, 0) + game.boards[game.b].filter(c => game.matched.has(c.id)).length;
    const tile = (side, id) => {
      const c = byId(id), sel = game.sel && game.sel.side === side && game.sel.id === id;
      return `<button type="button" class="mtile${game.matched.has(id) ? ' done' : ''}${sel ? ' sel' : ''}" data-act="mpick" data-side="${side}" data-id="${id}">${sideHtml(c, side === 'L' ? 'front' : 'back', d)}</button>`;
    };
    return `
      <div class="study-top">
        <button type="button" class="btn ghost" data-act="games" data-id="${d.id}">← Games</button>
        <div class="progress"><div style="width:${Math.round(done / game.total * 100)}%"></div></div>
        <span class="timer" id="gTimer">⏱ ${fmtTime(Date.now() - game.start)}</span>
        ${typeof fanfarePicker === 'function' ? fanfarePicker() : ''}
      </div>
      <div class="row-between"><div class="prompt-label muted">${g.emoji} Match each word with its meaning</div>
        <span class="muted small">Board ${game.b + 1} of ${game.boards.length} · ${game.mistakes} mistake${game.mistakes === 1 ? '' : 's'}</span></div>
      <div class="match"><div class="col">${game.left.map(id => tile('L', id)).join('')}</div><div class="col">${game.right.map(id => tile('R', id)).join('')}</div></div>`;
  }
  const it = gItem(), total = game.items.length, pct = Math.round((game.i + (it.result ? 1 : 0)) / total * 100);
  const top = `
    <div class="study-top">
      <button type="button" class="btn ghost" data-act="games" data-id="${d.id}">← Games</button>
      <div class="progress"><div style="width:${pct}%"></div></div>
      <span class="muted small" style="font-variant-numeric:tabular-nums">${game.i + 1} / ${total}</span>
      ${typeof fanfarePicker === 'function' ? fanfarePicker() : ''}
    </div>`;
  const nextBtn = `<button type="button" class="btn primary" id="gameNextBtn" data-act="gameNext">${game.i < total - 1 ? 'Next' : 'See results'} <kbd style="background:transparent;color:inherit;border-color:currentColor;opacity:.7">Enter</kbd></button>`;
  const feedback = (extra = '') => !it.result ? '' : `<div class="feedback ${it.result === 'ok' ? 'ok' : 'bad'}">
      <div>${it.result === 'ok' ? '<b class="ok">Correct!</b>' : `<b class="bad">${it.given == null ? 'Answer:' : 'Not quite.'}</b>`} ${extra}</div>
      <div class="row">${nextBtn}</div></div>`;
  const options = (opts, correct) => `<div class="options">${opts.map((o, i) => {
      let cls = ''; if (it.result) { if (norm(o) === norm(correct)) cls = 'correct'; else if (o === it.given) cls = 'wrong'; }
      return `<button type="button" class="opt ${cls}" data-act="gpick" data-i="${i}" ${it.result ? 'disabled' : ''}><span class="k">${i + 1}</span><span>${esc(o)}</span></button>`;
    }).join('')}</div>`;

  if (game.type === 'sentence') {
    const b = it.blank, sent = plainSent(it.card.example);
    return `${top}
      <div class="flash" style="min-height:230px">
        <div class="prompt-label">${g.emoji} Choose the missing word</div>
        <div class="sentence">${esc(b.before)}<span class="blank">${it.result ? esc(b.word) : '&nbsp;'}</span>${esc(b.after)}</div>
        ${it.card.exampleTr ? `<div class="muted">${esc(it.card.exampleTr)}</div>` : `<div class="muted small">Hint: ${esc(it.card.back)}</div>`}
        ${it.result ? speakBtn(sent, d.frontLang, true) : ''}
      </div>
      ${options(it.options, b.word)}
      ${feedback(it.result === 'ok' ? `<span class="muted">${esc(it.card.front)} = ${esc(it.card.back)}</span>` : `The missing word is <b>${esc(b.word)}</b> (${esc(it.card.front)} = ${esc(it.card.back)}).`)}
      <div class="shortcuts">Keys 1–4 to answer · Enter for next</div>`;
  }
  // listen
  const audio = `<div class="row" style="justify-content:center">
      <button type="button" class="icon-btn speak lg" data-act="gplay" title="Play again (R)">${ICON.speak}</button>
      <button type="button" class="btn sm" data-act="gplay" data-slow="1" title="Play slowly (S)">🐢 Slower</button></div>`;
  if (it.mode === 'pick') {
    return `${top}
      <div class="flash" style="min-height:200px">
        <div class="prompt-label">${g.emoji} Which word did you hear?</div>${audio}
        ${it.result ? `<div class="word sm">${esc(it.text)}</div><div class="muted">${esc(it.tr)}</div>` : ''}
      </div>
      ${options(it.options, it.text)}
      ${feedback(it.result === 'ok' ? '' : `You heard <b>${esc(it.text)}</b>.`)}
      <div class="shortcuts">Keys 1–6 to answer · R replay · S slower · Enter for next</div>`;
  }
  const placed = it.placed.map(k => `<button type="button" class="tile" data-act="gunplace" data-k="${k}" ${it.result ? 'disabled' : ''}>${esc(it.tiles[k].t)}</button>`).join('');
  return `${top}
    <div class="flash" style="min-height:190px">
      <div class="prompt-label">${g.emoji} Tap the words you hear, in order</div>${audio}
      ${it.result ? `<div class="sentence">${esc(it.text)}</div>${it.tr ? `<div class="muted">${esc(it.tr)}</div>` : ''}` : ''}
    </div>
    <div class="answer-line ${it.result ? (it.result === 'ok' ? 'ok' : 'bad') : ''}">${placed || '<span class="hint">Tap the words below to build what you heard</span>'}</div>
    <div class="tiles">${it.tiles.map(t => `<button type="button" class="tile ${it.placed.includes(t.k) ? 'used' : ''}" data-act="gplace" data-k="${t.k}" ${it.result ? 'disabled' : ''}>${esc(t.t)}</button>`).join('')}</div>
    ${it.result ? feedback(it.result === 'ok' ? '' : `It was: <b>${esc(it.text)}</b>`) : `
      <div class="answer-bar"><button type="button" class="btn" data-act="gskip">I don’t know</button>
        <button type="button" class="btn primary" data-act="gcheck" ${it.placed.length ? '' : 'disabled'}>Check <kbd style="background:transparent;color:inherit;border-color:currentColor;opacity:.7">Enter</kbd></button></div>`}
    <div class="shortcuts">Click a placed word to remove it · Backspace undo · R replay · S slower</div>`;
};

views.gameResults = () => {
  if (!game) { view = { name: 'home' }; return views.home(); }
  const d = deckById(game.deckId), g = GAMES[game.type];
  let score, sub, missed;
  if (game.type === 'match') {
    const acc = Math.round(game.total / (game.total + game.mistakes) * 100);
    score = fmtTime(game.time || 0); sub = `${game.total} pairs matched · ${game.mistakes} mistake${game.mistakes === 1 ? '' : 's'} · ${acc}% accuracy`;
    missed = [...game.missed].map(id => S.cards.find(c => c.id === id)).filter(Boolean).map(c => ({ a: c.front, b: c.back }));
  } else {
    const right = game.items.filter(x => x.result === 'ok').length;
    score = Math.round(right / game.items.length * 100) + '%'; sub = `${right} of ${game.items.length} correct`;
    missed = game.items.filter(x => x.result !== 'ok').map(x => game.type === 'sentence' ? { a: plainSent(x.card.example), b: x.card.exampleTr || `${x.card.front} = ${x.card.back}` } : { a: x.text, b: x.tr });
  }
  return `
    <div class="crumbs"><a data-act="home">Decks</a> / <a data-act="openDeck" data-id="${d.id}">${esc(d.name)}</a> / <a data-act="games" data-id="${d.id}">Games</a> / Results</div>
    <div class="flash" style="min-height:0">
      ${mascot(100, game.type === 'match' ? (game.mistakes <= 2 ? 'party' : 'happy') : (game.items.filter(x => x.result === 'ok').length / game.items.length >= 0.8 ? 'party' : 'happy'))}
      <div class="score">${score}</div>
      <div class="muted">${sub}</div>
      ${friendTip('monkey', 'result', { pct: game.type === 'match' ? Math.round(game.total / (game.total + game.mistakes) * 100) : Math.round(game.items.filter(x => x.result === 'ok').length / game.items.length * 100) }, { compact: true })}
      <div class="row" style="justify-content:center;margin-top:8px">
        <button type="button" class="btn primary" data-act="startGame" data-type="${game.type}" data-id="${d.id}">Play again</button>
        <button type="button" class="btn" data-act="games" data-id="${d.id}">Other games</button>
        <button type="button" class="btn" data-act="openDeck" data-id="${d.id}">Back to deck</button>
      </div>
    </div>
    ${missed.length ? `<div class="panel" style="margin-top:18px"><h3>${game.type === 'match' ? 'Pairs you mixed up' : 'To review'}</h3><div class="missed">
      ${missed.map(m => `<div class="item"><div class="cell">${speakBtn(m.a, d.frontLang)}<b>${esc(m.a)}</b></div><div class="muted">${esc(m.b || '')}</div></div>`).join('')}</div></div>` : ''}`;
};

Object.assign(actions, {
  games: el => go({ name: 'games', deckId: el.dataset.id }),
  startGame: el => startGame(el.dataset.type, el.dataset.id),
  mpick: el => matchPick(el.dataset.side, el.dataset.id, el),
  gpick: el => gamePick(+el.dataset.i),
  gplace: el => gamePlace(+el.dataset.k),
  gunplace: el => gameUnplace(+el.dataset.k),
  gcheck: () => gameCheck(),
  gskip: () => gameAnswer('bad'),
  gplay: el => playGameAudio(!!el.dataset.slow),
  gameNext: () => gameNext(),
});

document.addEventListener('keydown', e => {
  if (view.name !== 'game' || !game || $('#dlg').open || e.ctrlKey || e.altKey) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (game.type === 'match') return;
  const it = gItem(); if (!it) return;
  const k = e.key.toLowerCase();
  if (it.result) { if (e.key === 'Enter') { e.preventDefault(); gameNext(); } return; }
  if (it.options && /^[1-9]$/.test(e.key)) { e.preventDefault(); gamePick(+e.key - 1); }
  else if (game.type === 'listen') {
    if (k === 'r') playGameAudio(false);
    else if (k === 's') playGameAudio(true);
    else if (it.mode === 'tap' && e.key === 'Backspace') { e.preventDefault(); it.placed.pop(); render(); }
    else if (it.mode === 'tap' && e.key === 'Enter') { e.preventDefault(); gameCheck(); }
  }
});
