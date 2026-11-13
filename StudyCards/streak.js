'use strict';
/* ================= Daily streak, goal, badges and streak freezes =================
   A day counts when you reach your daily goal: cards reviewed in Study plus answers in
   Quick review, quizzes and games. Every 7 days in a row earns a streak freeze (max 2) that
   automatically covers a missed day. Milestones unlock badges. */
const STREAK_BADGES = [
  [3, '🌱', 'Getting started'], [7, '🔥', 'One week'], [14, '⭐', 'Two weeks'], [30, '🏅', 'One month'],
  [50, '💎', '50 days'], [100, '🏆', '100 days'], [200, '🚀', '200 days'], [365, '👑', 'One year'],
];
const MAX_FREEZES = 3;
const dayDiff = (a, b) => Math.round((startOfDay(new Date(b + 'T12:00')) - startOfDay(new Date(a + 'T12:00'))) / DAY);   // b - a in days
const shiftKey = (k, n) => { const d = new Date(k + 'T12:00'); d.setDate(d.getDate() + n); return dateKey(d.getTime()); };
function dailyGoal() { return S.settings.dailyGoal || 10; }
function dayActivity(k = dateKey()) { const l = S.log[k] || {}; return (l.reviews || 0) + (l.practice || 0); }
function streakState() {
  if (!S.streak) {
    // First time: rebuild from past study days so an existing streak isn't lost.
    let cur = 0, k = dateKey(); if (dayActivity(k) < dailyGoal()) k = shiftKey(k, -1);   // today counts once the goal is reached
    let last = null; while (dayActivity(k) > 0) { if (!last) last = k; cur++; k = shiftKey(k, -1); }
    S.streak = { current: cur, best: cur, lastDay: last, freezes: 0, frozen: [], badges: {} };
    for (const [n] of STREAK_BADGES) if (cur >= n) S.streak.badges[n] = Date.now();
  }
  return S.streak;
}
/* Streak to show right now (counts freezes that will cover days missed since the last goal). */
function displayStreak() {
  const st = streakState(); if (!st.lastDay) return { n: 0, atRisk: false, freezeNeeded: 0 };
  const gap = dayDiff(st.lastDay, dateKey()) - 1;          // full days missed, not counting today
  if (gap <= 0) return { n: st.current, atRisk: gap === 0 && dayActivity() < dailyGoal(), freezeNeeded: 0 };
  if (gap <= st.freezes) return { n: st.current, atRisk: true, freezeNeeded: gap };
  return { n: 0, atRisk: false, freezeNeeded: 0, lost: st.current };
}
function goalMetToday() { return dayActivity() >= dailyGoal(); }
let streakBusy = false;
function updateStreak() {
  if (streakBusy || !S.settings) return;
  const st = streakState(), today = dateKey();
  if (!goalMetToday() || st.lastDay === today) return;
  streakBusy = true;
  const events = [];
  const gap = st.lastDay ? dayDiff(st.lastDay, today) - 1 : 0;
  if (st.lastDay && gap <= 0) st.current++;
  else if (st.lastDay && gap <= st.freezes) {
    st.freezes -= gap;
    for (let i = 1; i <= gap; i++) st.frozen.push(shiftKey(st.lastDay, i));
    st.current++; events.push(`❄️ ${gap} streak freeze${gap === 1 ? '' : 's'} saved your streak`);
  } else { if (st.current > 1 && st.lastDay) events.push(`Your previous streak was ${st.current} days. A fresh start!`); st.current = 1; }
  st.lastDay = today; st.best = Math.max(st.best || 0, st.current);
  (S.log[today] ||= { reviews: 0, intro: {}, extra: {} }).goalMet = true;
  const newBadges = STREAK_BADGES.filter(([n]) => st.current >= n && !st.badges[n]);
  newBadges.forEach(([n]) => { st.badges[n] = Date.now(); });
  let freezeEarned = false;
  if (st.current % 7 === 0 && st.freezes < MAX_FREEZES) { st.freezes++; freezeEarned = true; }
  if (typeof addPoints === 'function') addPoints(10);   // daily goal bonus
  save();
  streakBusy = false;
  setTimeout(() => celebrate({ streak: st.current, badges: newBadges, freezeEarned, events }), 450);
  if (typeof renderStreakChip === 'function') renderStreakChip();
}
function celebrate({ streak, badges, freezeEarned, events }) {
  if ($('#dlg').open) { setTimeout(() => celebrate({ streak, badges, freezeEarned, events }), 1500); return; }
  const big = badges.at(-1);
  const pieces = Array.from({ length: 28 }, (_, i) => `<span style="left:${Math.random() * 100}%;animation-delay:${(Math.random() * 0.8).toFixed(2)}s;animation-duration:${(1.6 + Math.random()).toFixed(2)}s">${['🎉', '✨', '⭐', '🔥', '🎊'][i % 5]}</span>`).join('');
  openDialog({
    title: big ? 'New badge unlocked!' : 'Daily goal reached!', ok: 'Keep going',
    body: `<div class="confetti">${pieces}</div>
      <div class="celebrate">
        <div class="big">${big ? `<span style="display:inline-flex;align-items:center;gap:4px">${mascot(96, 'party')}<span>${big[1]}</span></span>` : mascot(120, 'party')}</div>
        <div class="word sm">${big ? esc(big[2]) : `${streak}-day streak!`}</div>
        <p class="muted" style="margin:0">${big ? `You studied ${streak} days in a row.` : `You reached your goal of ${dailyGoal()} cards today. Come back tomorrow to keep it going.`}</p>
        ${badges.length > 1 ? `<div class="row" style="justify-content:center">${badges.map(b => `<span class="badge-mini" title="${esc(b[2])}">${b[1]}</span>`).join('')}</div>` : ''}
        ${freezeEarned ? `<div class="reward">❄️ You earned a <b>streak freeze</b>! It protects your streak if you miss a day. (You have ${S.streak.freezes}/${MAX_FREEZES}.)</div>` : ''}
        ${events.map(e => `<div class="muted small">${esc(e)}</div>`).join('')}
      </div>`,
    onOk: () => {},
  });
  $('#dlg [data-dlg=cancel]')?.remove();
}

/* ---------- UI ---------- */
function weekStrip() {
  const st = streakState(), cells = [];
  for (let i = 6; i >= 0; i--) {
    const k = dateKey(Date.now() - i * DAY), d = new Date(Date.now() - i * DAY);
    const met = !!S.log[k]?.goalMet || (dayActivity(k) >= dailyGoal() && k !== dateKey()), frozen = st.frozen.includes(k), today = i === 0;
    cells.push(`<div class="wk ${met ? 'met' : frozen ? 'frozen' : ''} ${today ? 'today' : ''}" title="${d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}${met ? ': goal reached' : frozen ? ': covered by a streak freeze' : ''}">
      <span class="wd">${d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span><span class="dot">${met ? '🔥' : frozen ? '❄️' : today ? '○' : '·'}</span></div>`);
  }
  return `<div class="week">${cells.join('')}</div>`;
}
function streakPanel() {
  const s = displayStreak(), st = streakState(), act = dayActivity(), goal = dailyGoal(), done = act >= goal;
  const next = STREAK_BADGES.find(([n]) => n > s.n);
  return `<section class="panel streak-panel">
    <div class="sp-main">
      <div class="flame ${done ? 'lit' : ''}">🔥</div>
      <div><div class="sp-n">${s.n} day${s.n === 1 ? '' : 's'}</div>
        <div class="muted small">${done ? 'Goal reached today ✓' : s.n ? (s.freezeNeeded ? 'A streak freeze will cover the missed day. Study today!' : 'Reach today’s goal to keep your streak going!') : s.lost ? `Your ${s.lost}-day streak ended. Start a new one today!` : 'Reach your daily goal to start a streak'}</div></div>
    </div>
    <div class="sp-goal">
      <div class="row-between small"><span>Today: <b>${Math.min(act, goal)}/${goal}</b> cards</span><span class="row" style="gap:8px"><span class="muted">❄️ ${st.freezes}/${MAX_FREEZES} freezes · best ${st.best || 0}</span><button type="button" class="btn sm" data-act="streakCalendar">📅 Calendar</button></span></div>
      <div class="seg-bar"><div class="${done ? 'g' : 'm'}" style="width:${Math.min(100, act / goal * 100).toFixed(1)}%"></div></div>
      ${weekStrip()}
      ${next ? `<div class="muted small">${next[0] - s.n} more day${next[0] - s.n === 1 ? '' : 's'} to unlock ${next[1]} <b>${esc(next[2])}</b></div>` : '<div class="muted small">You’ve unlocked every badge 👑</div>'}
    </div>
  </section>`;
}
function badgesPanel() {
  const st = streakState();
  return `<section class="panel" style="margin-top:16px"><div class="row-between"><h3>Streak badges</h3><span class="muted small">Best streak: ${st.best || 0} day${st.best === 1 ? '' : 's'}</span></div>
    <div class="badges">${STREAK_BADGES.map(([n, e, name]) => { const got = st.badges[n];
      return `<div class="badge ${got ? 'got' : ''}" title="${got ? `Unlocked ${new Date(got).toLocaleDateString()}` : `Reach a ${n}-day streak`}"><div class="be">${got ? e : '🔒'}</div><b>${esc(name)}</b><span class="muted small">${n} days</span></div>`; }).join('')}</div></section>`;
}
function renderStreakChip() {
  const b = $('#streakBtn'); if (!b) return;
  const hidden = view.name === 'profiles' || !S.settings || (typeof currentProfileId !== 'undefined' && !currentProfileId);
  b.hidden = hidden; if (hidden) return;
  const s = displayStreak(), done = goalMetToday();
  b.innerHTML = `<span style="filter:${done ? 'none' : 'grayscale(1)'}">🔥</span>${s.n}`;
  b.title = `${s.n}-day streak · today ${Math.min(dayActivity(), dailyGoal())}/${dailyGoal()} cards`;
}
