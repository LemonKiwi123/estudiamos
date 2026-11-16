'use strict';
/* ================= 🏅 Badges for each subject =================
   Worked out from what you've done in that subject (cards, study, quizzes, games, timelines, dictionary…).
   The date you first earn each one is kept in S.settings.subjBadges[subject][badge id]. */
const SB_TIERS = [['bronze', '🥉'], ['silver', '🥈'], ['gold', '🥇']];
/* [id, emoji, name, what it counts, tier goals, which subjects (empty = all)] */
const SB_DEFS = [
  ['decks', '🌱', 'Getting started', 'decks in this subject', [1, 3, 6]],
  ['cards', '📚', 'Collector', 'cards in this subject', [25, 150, 500]],
  ['studied', '🧠', 'Learner', 'cards studied', [10, 100, 400]],
  ['mastered', '🏅', 'Master', 'cards mastered', [10, 75, 300]],
  ['days', '🔥', 'Steady', 'days you studied this subject', [3, 10, 30]],
  ['quiz', '📝', 'Quiz whiz', 'quizzes with 80% or more', [1, 10, 40]],
  ['games', '🎮', 'Game on', 'games played', [3, 20, 75]],
  ['gloss', '📖', 'Word collector', 'words you added to this subject’s dictionary', [5, 25, 100], s => s !== 'lang'],
  ['timeline', '🕰️', 'Time traveler', 'events on your timelines', [5, 20, 60], s => ['art', 'science', 'history'].includes(s) || /^c-/.test(s)],
  ['ear', '👂', 'Golden ears', 'ear-training answers right', [10, 50, 200], s => s === 'music'],
  ['songs', '🎹', 'Composer', 'songs saved in the Music maker', [1, 5, 15], s => s === 'music'],
  ['calc', '🧮', 'Number cruncher', 'calculations worked out', [10, 100, 500], s => s === 'math'],
  ['chess', '♟️', 'Grandmaster', 'chess games won against the computer', [1, 5, 20], s => s === 'other'],
];
function sbCounts(k) {
  const ids = new Set(S.decks.filter(d => deckSubject(d) === k).map(d => d.id)), cards = S.cards.filter(c => ids.has(c.deckId)), hist = (S.history || []).filter(h => ids.has(h.deckId));
  const lv = typeof levelCounts === 'function' ? levelCounts(cards) : { mastered: 0, learning: 0 };
  let days = 0; for (const key in S.log || {}) if (S.log[key]?.bySubj?.[k]) days++;
  const m = S.settings.music || {}, quiz = hist.filter(h => typeof isQuizResult === 'function' && isQuizResult(h));
  return {
    decks: ids.size, cards: cards.length, studied: cards.filter(c => c.state !== 'new').length, mastered: lv.mastered || 0, days,
    quiz: quiz.filter(h => h.score >= 80).length, games: hist.length - quiz.length,
    gloss: (S.settings.glossary?.[k] || []).length,
    timeline: (S.settings.timelines || []).filter(t => t.subject === k).reduce((a, t) => a + t.events.length, 0),
    ear: m.ear?.right || 0, songs: (m.saved || []).length, calc: Math.max(S.settings.math?.calcCount || 0, (S.settings.math?.hist || []).length),
    chess: S.settings.chessWins || 0,
  };
}
function sbList(k) {
  const n = sbCounts(k);
  return SB_DEFS.filter(d => !d[5] || d[5](k)).map(([id, emoji, name, what, goals]) => {
    const v = n[id] || 0, tier = goals.filter(g => v >= g).length, next = goals[tier];
    return { id, emoji, name, what, v, tier, next, goal: next ?? goals.at(-1) };
  });
}
function sbCheck(k, quiet) {   // record newly earned tiers; say so once
  const got = ((S.settings.subjBadges ||= {})[k] ||= {}), fresh = [];
  for (const b of sbList(k)) for (let t = 1; t <= b.tier; t++) { const key = `${b.id}:${t}`; if (!got[key]) { got[key] = Date.now(); fresh.push(`${SB_TIERS[t - 1][1]} ${b.name}`); } }
  if (fresh.length) { save(); if (!quiet) toast(`🏅 New ${subjName(k)} badge${fresh.length > 1 ? 's' : ''}: ${fresh.slice(0, 3).join(', ')}${fresh.length > 3 ? '…' : ''}`); }
  return fresh.length;
}
function sbHtml(k) {
  const list = sbList(k), earned = list.reduce((a, b) => a + b.tier, 0), max = list.length * 3;
  return `<section class="panel" style="margin-top:16px"><div class="row-between"><h3 style="margin:0">🏅 ${esc(subjName(k))} badges</h3><span class="muted small">${earned} of ${max} earned</span></div>
    <div class="sb-grid">${list.map(b => `<div class="sb ${b.tier ? SB_TIERS[b.tier - 1][0] : 'none'}" title="${esc(b.name)}: ${b.v} ${esc(b.what)}">
      <div class="sb-icon">${b.emoji}${b.tier ? `<span class="sb-medal">${SB_TIERS[b.tier - 1][1]}</span>` : ''}</div>
      <b>${esc(b.name)}</b>
      <div class="muted small">${b.next != null ? `${Math.min(b.v, b.goal)} / ${b.goal} ${esc(b.what)}` : `All three medals! ${b.v} ${esc(b.what)}`}</div>
      <div class="sb-bar"><i style="width:${Math.min(100, Math.round(b.v / b.goal * 100))}%"></i></div></div>`).join('')}</div></section>`;
}
const sbEarnedCount = k => sbList(k).reduce((a, b) => a + b.tier, 0);
/* count calculations and chess wins (they live in other files, so add to them here) */
{ const eq = window.mathEquals; if (typeof eq === 'function') window.mathEquals = function () { const last = S.settings.math?.hist?.at(-1), r = eq.apply(this, arguments), m = S.settings.math; if (m?.hist?.at(-1) && m.hist.at(-1) !== last) { m.calcCount = Math.max(m.calcCount || 0, m.hist.length - 1) + 1; save(); } return r; }; }
{ const cp = window.chPlay; if (typeof cp === 'function') window.chPlay = function () { const r = cp.apply(this, arguments); if (ch?.st?.mate && ch.mode === 'cpu' && ch.st.winner === ch.side && !ch.counted) { ch.counted = true; S.settings.chessWins = (S.settings.chessWins || 0) + 1; save(); } return r; }; }
/* show badges on each subject's progress page, and a count on the subject cards */
{
  const prog = views.progress;
  views.progress = function () {
    let html = prog.apply(this, arguments);
    const k = view.subj && view.subj !== '@all' ? view.subj : '';
    if (k) { sbCheck(k); const at = html.indexOf('<section class="stats six"'); html = at < 0 ? html + sbHtml(k) : html.slice(0, at) + sbHtml(k) + html.slice(at); }
    else if (!view.subj) {
      for (const [s] of subjList()) sbCheck(s, true);
      html = html.replace(/(<button type="button" class="subj-card" data-act="progSubject" data-k="([^"]+)"[^>]*>)/g, (m0, open, s) => `${open}<span class="sb-count" title="Badges earned">🏅 ${sbEarnedCount(s)}</span>`);
    }
    return html;
  };
}
