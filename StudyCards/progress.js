'use strict';
/* ================= Progress: saved results + progress bars ================= */
const HISTORY_MAX = 500;
const RESULT_TYPES = {
  quiz: { emoji: '📝', name: 'Quiz' }, match: { emoji: '🧩', name: 'Match words' }, sentence: { emoji: '✏️', name: 'Finish the sentence' },
  listen: { emoji: '🎧', name: 'Listen & tap' }, quick: { emoji: '⚡', name: 'Quick review' }, runner: { emoji: '🐘', name: 'Elephant run' }, tower: { emoji: '🧱', name: 'Word Tower' }, showdown: { emoji: '🎤', name: 'Word Showdown' }, millionaire: { emoji: '🥜', name: 'Peanut Millionaire' }, priceparty: { emoji: '🏷️', name: 'Price Party' }, spinspell: { emoji: '🎡', name: 'Spin & Spell' }, wordtown: { emoji: '🎲', name: 'Word Town' }, trails: { emoji: '🌿', name: 'Wordling Trails' }, saga: { emoji: '🗡️', name: 'Lexicon Saga' },
};
/* quizzes (quiz + quick review) and games are counted separately on the Progress page */
const QUIZ_KINDS = new Set(['quiz', 'quick']);
const isQuizResult = h => QUIZ_KINDS.has(h.type);
const QUIZ_MODE_NAMES = { mc: 'multiple choice', type: 'typing', listen: 'listening', mixed: 'mixed' };
function addHistory(entry) {
  S.history ||= [];
  S.history.unshift({ id: uid(), when: Date.now(), ...entry });
  if (entry.type !== 'quick') { const l = todayLog(); l.practice = (l.practice || 0) + (entry.total || 0); }   // counts toward the daily goal
  if (typeof awardResult === 'function') S.history[0].points = awardResult(entry);
  if (S.history.length > HISTORY_MAX) S.history.length = HISTORY_MAX;
  save();
}
function recordQuiz() {
  if (!quiz) return;
  const qs = quiz.questions, right = qs.filter(q => q.result === 'ok' || q.result === 'typo').length;
  addHistory({ type: 'quiz', deckId: quiz.deckId, deckName: deckById(quiz.deckId)?.name, detail: QUIZ_MODE_NAMES[quiz.prefs.mode],
    correct: right, total: qs.length, score: Math.round(right / qs.length * 100), timeMs: Date.now() - (quiz.start || Date.now()),
    items: qs.map(q => ({ cardId: q.cardId, q: q.prompt, a: q.answer, given: q.given ?? null, ok: q.result !== 'bad' })) });
}
function recordGame() {
  if (!game) return;
  const d = deckById(game.deckId), base = { type: game.type, deckId: game.deckId, deckName: d?.name, timeMs: game.time || 0 };
  if (game.type === 'match') {
    const cards = game.boards.flat();
    addHistory({ ...base, correct: game.total, total: game.total, mistakes: game.mistakes, score: Math.round(game.total / (game.total + game.mistakes) * 100),
      detail: `${game.mistakes} mistake${game.mistakes === 1 ? '' : 's'}`,
      items: cards.map(c => ({ cardId: c.id, q: c.front, a: c.back, ok: !game.missed.has(c.id) })) });
    return;
  }
  const right = game.items.filter(x => x.result === 'ok').length;
  addHistory({ ...base, correct: right, total: game.items.length, score: Math.round(right / game.items.length * 100),
    items: game.items.map(x => game.type === 'sentence'
      ? { cardId: x.card.id, q: `${x.blank.before}___${x.blank.after}`, a: x.blank.word, given: x.given ?? null, ok: x.result === 'ok' }
      : { cardId: x.card.id, q: x.text, a: x.tr || '', given: x.mode === 'tap' ? x.placed.map(k => x.tiles[k].t).join(' ') || null : x.given ?? null, ok: x.result === 'ok' }) });
}
function recordQuick() {
  if (!qr) return;
  const ids = [...qr.seen], firstTry = ids.filter(id => !qr.missed.has(id)).length;
  addHistory({ type: 'quick', deckId: qr.deckId, deckName: deckById(qr.deckId)?.name, correct: firstTry, total: ids.length,
    score: Math.round(firstTry / Math.max(1, ids.length) * 100), timeMs: (qr.finished || Date.now()) - qr.start,
    detail: `${qr.rounds} round${qr.rounds === 1 ? '' : 's'}, got right first time`,
    items: ids.map(id => { const c = S.cards.find(x => x.id === id); return { cardId: id, q: c?.front || '', a: c?.back || '', ok: !qr.missed.has(id) }; }) });
}

/* ---------- Progress levels ---------- */
const MASTERED_DAYS = 21;
const cardLevel = c => c.state === 'new' ? 'new' : (c.state === 'review' && c.interval >= MASTERED_DAYS ? 'mastered' : 'learning');
function levelCounts(cards) {
  const k = { total: cards.length, mastered: 0, learning: 0, new: 0 };
  for (const c of cards) k[cardLevel(c)]++;
  k.pct = k.total ? Math.round((k.mastered + k.learning) / k.total * 100) : 0;
  return k;
}
function levelBar(k, tall) {
  const t = Math.max(1, k.total), pc = n => (n / t * 100).toFixed(2) + '%';
  return `<div class="seg-bar${tall ? ' tall' : ''}" title="${k.mastered} mastered · ${k.learning} learning · ${k.new} new">
    <div class="g" style="width:${pc(k.mastered)}"></div><div class="m" style="width:${pc(k.learning)}"></div></div>`;
}
function deckProgressBar(d) {
  const k = levelCounts(cardsOf(d.id)); if (!k.total) return '';
  return `<div><div class="row-between small" style="margin-bottom:4px"><span class="muted">Progress</span><span><b>${k.pct}%</b> <span class="muted">studied · ${k.mastered} mastered</span></span></div>${levelBar(k)}</div>`;
}
const fmtDur = ms => { const s = Math.round(ms / 1000); return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`; };
const fmtWhen = t => {
  const d = new Date(t), days = Math.round((startOfDay(Date.now()) - startOfDay(t)) / DAY);
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return days === 0 ? `Today ${time}` : days === 1 ? `Yesterday ${time}` : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: days > 300 ? 'numeric' : undefined }) + ' ' + time;
};
const scoreColor = s => s >= 80 ? 'var(--good)' : s >= 50 ? 'var(--hard)' : 'var(--again)';

/* ---------- Progress page ---------- */
/* ---------- By part of speech: how well you know your nouns, verbs, adjectives… and what to work on ----------
   The kind of word comes from the same word labels as 🏷️ Word labels and the card list (clPos in cardlist.js).
   "Right in quizzes & games" uses every saved quiz and game answer for those cards. */
function posStanding() {
  if (typeof clPos !== 'function' || typeof POS_GROUPS === 'undefined') return null;
  const answers = new Map();   // cardId -> [right, total]
  for (const h of S.history || []) for (const it of h.items || []) { if (!it.cardId) continue; const a = answers.get(it.cardId) || [0, 0]; a[1]++; if (it.ok) a[0]++; answers.set(it.cardId, a); }
  const groups = new Map(); let unlabeled = 0;
  for (const c of S.cards) {
    const k = clPos(c); if (!k) { unlabeled++; continue; }
    const g = groups.get(k) || { k, cards: [], right: 0, asked: 0, lapses: 0 }; g.cards.push(c);
    const a = answers.get(c.id); if (a) { g.right += a[0]; g.asked += a[1]; }
    g.lapses += c.lapses || 0; groups.set(k, g);
  }
  const rows = POS_GROUPS.map(([k, name, cls]) => { const g = groups.get(k); if (!g) return null;
    const lv = levelCounts(g.cards), acc = g.asked ? Math.round(g.right / g.asked * 100) : null;
    const mast = lv.total ? Math.round(lv.mastered / lv.total * 100) : 0;
    // one number to compare types: mostly how much you've mastered, plus how often you get them right when practicing
    const score = acc == null ? mast : Math.round(mast * 0.5 + acc * 0.5);
    return { k, name, cls, cards: g.cards, lv, acc, asked: g.asked, mast, score, lapses: g.lapses };
  }).filter(Boolean);
  const weak = rows.filter(r => r.cards.length >= 5 && (r.lv.new < r.lv.total)).sort((a, b) => a.score - b.score).slice(0, 2)
    .filter(r => r.score < 70);
  return { rows, weak, unlabeled };
}
function posStandingHtml() {
  const st = posStanding(); if (!st || !st.rows.length) return '';
  const plural = r => ({ noun: 'Nouns', verb: 'Verbs', adj: 'Adjectives', adv: 'Adverbs', pron: 'Pronouns', det: 'Articles & determiners', prep: 'Prepositions', conj: 'Conjunctions', num: 'Numbers', int: 'Interjections', other: 'Phrases & other' })[r.k] || r.name;
  const best = [...st.rows].filter(r => r.cards.length >= 5 && r.lv.new < r.lv.total).sort((a, b) => b.score - a.score)[0];
  return `<section class="panel" style="margin-top:16px">
    <div class="row-between"><h3>By part of speech</h3><span class="muted small">From your word labels</span></div>
    ${st.weak.length ? `<div class="pos-work"><b>🎯 Work on:</b> ${st.weak.map(r => `<span class="pos-work-i"><span class="pos-tag ${r.cls}">${esc(plural(r).toLowerCase())}</span>
        <span class="muted small">${r.mast}% mastered${r.acc != null ? ` · ${r.acc}% right in practice` : ''}</span>
        <button type="button" class="btn sm" data-act="posPractice" data-k="${r.k}">Practice</button></span>`).join('')}</div>`
      : best ? `<div class="pos-work ok">🌟 You're doing well across the board. Strongest: <span class="pos-tag ${best.cls}">${esc(plural(best).toLowerCase())}</span></div>` : ''}
    <div class="pos-rows">${st.rows.map(r => `<div class="pos-row">
      <div><span class="pos-tag ${r.cls}">${esc(plural(r).toLowerCase())}</span> <span class="muted small">${r.cards.length} card${r.cards.length === 1 ? '' : 's'}</span></div>
      <div>${levelBar(r.lv)}<div class="muted small" style="margin-top:4px">${r.mast}% mastered · ${r.lv.learning} learning · ${r.lv.new} new${r.acc != null ? ` · <b style="color:${scoreColor(r.acc)}">${r.acc}%</b> right in quizzes &amp; games (${r.asked})` : ''}</div></div>
    </div>`).join('')}</div>
    ${st.unlabeled ? `<p class="muted small" style="margin:8px 0 0">${st.unlabeled} card${st.unlabeled === 1 ? ' has' : 's have'} no word label yet (stacked cards, or words not looked up). Turn on 🏷️ Word labels for a deck to include them.</p>` : ''}
  </section>`;
}
/* Practice a weak part of speech: a quiz on those cards from the deck that has the most of them, hardest first */
function posPractice(k) {
  const pick = S.cards.filter(c => clPos(c) === k && !c.frozen);
  if (pick.length < 2) return toast('Not enough cards of that kind yet');
  const byDeck = new Map(); for (const c of pick) (byDeck.get(c.deckId) || byDeck.set(c.deckId, []).get(c.deckId)).push(c);
  const [deckId, cards] = [...byDeck.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (cards.length < 2) return toast('Not enough cards of that kind in one deck yet');
  const answers = new Map(); for (const h of S.history || []) for (const it of h.items || []) if (it.cardId) { const a = answers.get(it.cardId) || [0, 0]; a[1]++; if (it.ok) a[0]++; answers.set(it.cardId, a); }
  const hard = c => (cardLevel(c) === 'mastered' ? 0 : 2) + (c.lapses || 0) + (answers.has(c.id) ? 1 - answers.get(c.id)[0] / answers.get(c.id)[1] : 0.5);
  const chosen = cards.sort((a, b) => hard(b) - hard(a)).slice(0, 15).map(c => c.id);
  toast(`🎯 A quiz on your hardest ${({ noun: 'nouns', verb: 'verbs', adj: 'adjectives', adv: 'adverbs', pron: 'pronouns', det: 'articles & determiners', prep: 'prepositions', conj: 'conjunctions', num: 'numbers', int: 'interjections', other: 'phrases' })[k] || 'cards'} from “${deckById(deckId).name}”`);
  startQuiz(deckId, { ...(typeof QUIZ_DEFAULTS !== 'undefined' ? QUIZ_DEFAULTS : {}), ...(typeof quizPrefs !== 'undefined' ? quizPrefs : {}), count: 'all' }, chosen);
}
Object.assign(actions, { posPractice: el => posPractice(el.dataset.k) });

views.progress = () => {
  const hist = S.history || [], all = levelCounts(S.cards);
  const f = view.filter || {}, typeOk = h => !f.type || (f.type === '@quiz' ? isQuizResult(h) : f.type === '@game' ? !isQuizResult(h) : h.type === f.type);
  const shown = hist.filter(h => (!f.deck || h.deckId === f.deck) && typeOk(h));
  const quizzes = hist.filter(isQuizResult), games = hist.filter(h => !isQuizResult(h));
  const avgOf = list => { const r = list.slice(0, 10); return r.length ? Math.round(r.reduce((a, h) => a + h.score, 0) / r.length) : null; };
  const qAvg = avgOf(quizzes), gAvg = avgOf(games);
  const limit = view.limit || 30;
  const last7 = Array.from({ length: 7 }, (_, i) => S.log[dateKey(Date.now() - i * DAY)]?.reviews || 0).reduce((a, b) => a + b, 0);
  // 30-day activity: reviews (from study) + practice sessions (quizzes/games/quick reviews)
  const days = Array.from({ length: 30 }, (_, i) => {
    const t = Date.now() - (29 - i) * DAY, k = dateKey(t);
    const that = hist.filter(h => dateKey(h.when) === k);
    return { t, reviews: S.log[k]?.reviews || 0, quizzes: that.filter(isQuizResult).length, games: that.filter(h => !isQuizResult(h)).length };
  });
  const maxV = Math.max(1, ...days.map(x => x.reviews + (x.quizzes + x.games) * 5));
  const trendHtml = (list, title) => list.length >= 2 ? `<div><h3>${title}</h3>
      <div class="trend">${list.slice(0, 20).reverse().map(h => `<div class="bar" title="${RESULT_TYPES[h.type]?.name}, ${esc(h.deckName || '')}: ${h.score}%" style="height:${Math.max(4, h.score)}%;background:${scoreColor(h.score)}"></div>`).join('')}</div>
      <div class="row-between muted small"><span>Older</span><span>Latest</span></div></div>` : `<div><h3>${title}</h3><p class="muted small">Not enough results yet.</p></div>`;
  return `
    <div class="row-between" style="margin-bottom:16px"><h2>Your progress</h2>
      ${typeof currentProfile === 'function' && currentProfile() ? `<div class="row" style="gap:8px">${avatarHtml(currentProfile(), 28)}<b>${esc(currentProfile().name || '')}</b></div>` : ''}</div>
    ${typeof friendTip === 'function' ? friendTip('giraffe', 'progress') : ''}
    <section class="panel stack">
      <div class="row-between"><h3>All cards</h3><span><b style="font-size:20px">${all.pct}%</b> <span class="muted">studied</span></span></div>
      ${levelBar(all, true)}
      <div class="row small" style="gap:18px"><span style="color:var(--good)">● Mastered ${all.mastered}</span><span style="color:var(--accent)">● Learning ${all.learning}</span><span class="muted">● New ${all.new}</span>
        <span class="muted">Mastered = remembered for ${MASTERED_DAYS}+ days in Study</span></div>
    </section>
    ${posStandingHtml()}
    <section class="stats six" style="margin-top:16px">
      <div class="stat"><div class="n">${streak()}</div><div class="l">Day streak</div></div>
      <div class="stat"><div class="n">${last7}</div><div class="l">Reviews, last 7 days</div></div>
      <div class="stat"><div class="n">${quizzes.length}</div><div class="l">📝 Quizzes taken</div></div>
      <div class="stat"><div class="n" style="color:${qAvg == null ? 'inherit' : scoreColor(qAvg)}">${qAvg == null ? '–' : qAvg + '%'}</div><div class="l">Quiz average (last 10)</div></div>
      <div class="stat"><div class="n">${games.length}</div><div class="l">🎮 Games played</div></div>
      <div class="stat"><div class="n" style="color:${gAvg == null ? 'inherit' : scoreColor(gAvg)}">${gAvg == null ? '–' : gAvg + '%'}</div><div class="l">Game average (last 10)</div></div>
    </section>
    ${typeof streakPanel === 'function' ? streakPanel() + badgesPanel() : ''}
    <section class="panel" style="margin-top:16px">
      <div class="row-between"><h3>Activity, last 30 days</h3><span class="small"><span style="color:var(--accent)">■</span> Study reviews <span style="color:var(--hard);margin-left:10px">■</span> Quizzes <span style="color:var(--good);margin-left:10px">■</span> Games</span></div>
      <div class="activity">${days.map(x => `<div class="day" title="${new Date(x.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${x.reviews} reviews, ${x.quizzes} quiz${x.quizzes === 1 ? '' : 'zes'}, ${x.games} game${x.games === 1 ? '' : 's'}">
        <div class="s" style="height:${(x.games * 5 / maxV * 100).toFixed(1)}%"></div><div class="q" style="height:${(x.quizzes * 5 / maxV * 100).toFixed(1)}%"></div><div class="r" style="height:${(x.reviews / maxV * 100).toFixed(1)}%"></div></div>`).join('')}</div>
      <div class="row-between muted small"><span>30 days ago</span><span>Today</span></div>
    </section>
    ${hist.length >= 2 ? `<section class="panel trend-pair" style="margin-top:16px">${trendHtml(quizzes, '📝 Recent quiz scores')}${trendHtml(games, '🎮 Recent game scores')}</section>` : ''}
    <section class="panel" style="margin-top:16px">
      <h3>Decks</h3>
      ${S.decks.length ? `<div class="deck-progress">${S.decks.map(d => {
        const k = levelCounts(cardsOf(d.id)), q = qrCounts(d.id), lastR = hist.find(h => h.deckId === d.id);
        return `<div class="dp-row"><div><a data-act="openDeck" data-id="${d.id}"><b>${esc(d.name)}</b></a><div class="muted small">${k.total} cards · ${k.mastered} mastered · ${k.learning} learning · ${k.new} new</div></div>
          <div>${levelBar(k)}<div class="muted small" style="margin-top:4px">${k.pct}% studied${q.total ? ` · Quick review ${Math.round(q.got / q.total * 100)}% got it` : ''}${lastR ? ` · last score <b style="color:${scoreColor(lastR.score)}">${lastR.score}%</b>` : ''}</div></div></div>`;
      }).join('')}</div>` : '<p class="muted">No decks yet.</p>'}
    </section>
    <section class="panel" style="margin-top:16px">
      <div class="row-between"><h3>Saved quizzes &amp; games</h3>
        <div class="row">
          <select class="inp" id="histDeck" style="margin:0;width:auto"><option value="">All decks</option>${S.decks.map(d => `<option value="${d.id}" ${f.deck === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select>
          <select class="inp" id="histType" style="margin:0;width:auto"><option value="">Quizzes and games</option>
            <option value="@quiz" ${f.type === '@quiz' ? 'selected' : ''}>📝 All quizzes</option><option value="@game" ${f.type === '@game' ? 'selected' : ''}>🎮 All games</option>
            ${[['Quizzes', true], ['Games', false]].map(([label, q]) => `<optgroup label="${label}">${Object.entries(RESULT_TYPES).filter(([k]) => QUIZ_KINDS.has(k) === q).map(([k, t]) => `<option value="${k}" ${f.type === k ? 'selected' : ''}>${t.emoji} ${t.name}</option>`).join('')}</optgroup>`).join('')}</select>
        </div></div>
      ${shown.length ? `<div class="hist">${shown.slice(0, limit).map(h => `
        <button type="button" class="hist-row" data-act="openResult" data-id="${h.id}">
          <span class="h-emoji">${RESULT_TYPES[h.type]?.emoji || '•'}</span>
          <span class="h-main"><b>${RESULT_TYPES[h.type]?.name || h.type}</b> <span class="muted">· ${esc(h.deckName || 'Deleted deck')}</span>
            <span class="muted small" style="display:block">${fmtWhen(h.when)} · ${h.correct}/${h.total}${h.detail ? ' · ' + esc(h.detail) : ''}${h.timeMs ? ' · ' + fmtDur(h.timeMs) : ''}</span></span>
          <span class="h-score"><span class="pbar"><span style="width:${h.score}%;background:${scoreColor(h.score)}"></span></span><b style="color:${scoreColor(h.score)}">${h.score}%</b></span>
        </button>`).join('')}</div>
        ${shown.length > limit ? `<div style="text-align:center;margin-top:10px"><button type="button" class="btn sm" data-act="histMore">Show more (${shown.length - limit} older)</button></div>` : ''}`
        : `<p class="muted">${hist.length ? 'No results match these filters.' : 'Finish a quiz, game or quick review and it will be saved here.'}</p>`}
    </section>`;
};
function openResult(id) {
  const h = (S.history || []).find(x => x.id === id); if (!h) return;
  const missed = h.items.filter(x => !x.ok), d = deckById(h.deckId);
  const practiceIds = missed.map(x => x.cardId).filter(cid => S.cards.some(c => c.id === cid));
  openDialog({
    title: `${RESULT_TYPES[h.type]?.emoji || ''} ${RESULT_TYPES[h.type]?.name || 'Result'}: ${h.score}%`, ok: practiceIds.length >= 1 && d ? `Practice the ${practiceIds.length} missed` : 'Close', wide: true,
    body: `
      <p class="muted" style="margin:0">${esc(h.deckName || 'Deleted deck')} · ${fmtWhen(h.when)} · ${h.correct} of ${h.total} right${h.detail ? ' · ' + esc(h.detail) : ''}${h.timeMs ? ' · ' + fmtDur(h.timeMs) : ''}</p>
      <div class="seg-bar"><div class="g" style="width:${h.score}%"></div><div style="width:${100 - h.score}%;background:var(--again)"></div></div>
      <div class="missed" style="max-height:340px;overflow:auto">
        ${h.items.map(x => `<div class="item"><div class="cell"><span style="color:${x.ok ? 'var(--good)' : 'var(--again)'};font-weight:700;width:18px">${x.ok ? '✓' : '✗'}</span><b>${esc(x.q || '[picture]')}</b></div>
          <div style="text-align:right">${esc(x.a)}${!x.ok && x.given ? `<div class="small" style="color:var(--again)">you: ${esc(x.given)}</div>` : ''}</div></div>`).join('')}
      </div>
      <div><a style="color:var(--again)" class="small" data-act="deleteResult" data-id="${h.id}">Delete this result</a></div>`,
    onOk: () => {
      if (!practiceIds.length || !d) return;
      if (practiceIds.length < 2 && cardsOf(d.id).length < 2) { toast('Need at least 2 cards in the deck to practice'); return false; }
      $('#dlg').close();
      startQuiz(d.id, { mode: 'mc', dir: 'fb', count: 'all', pool: 'all' }, practiceIds);
      return false;
    },
  });
}

Object.assign(actions, {
  progress: () => go({ name: 'progress' }),
  openResult: el => openResult(el.dataset.id),
  histMore: () => { view.limit = (view.limit || 30) + 30; render(); },
  deleteResult: el => { S.history = (S.history || []).filter(h => h.id !== el.dataset.id); save(); $('#dlg').close(); render(); toast('Result deleted'); },
});
document.addEventListener('change', e => {
  if (e.target.id === 'histDeck' || e.target.id === 'histType') {
    view.filter = { deck: $('#histDeck').value, type: $('#histType').value }; view.limit = 30; render();
  }
});
