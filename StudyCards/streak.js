'use strict';
/* ================= Daily streak, goal, badges and streak freezes =================
   By default any study keeps the streak going: one card in Study, a quick review, a quiz or a game.
   (Settings can make it stricter: only days you reach your daily goal.) The daily goal is its own target
   with a points bonus: cards reviewed in Study plus answers in Quick review, quizzes and games. Every 7 days in a row earns a streak freeze (max 2) that
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
  if (gap <= 0) return { n: st.current, atRisk: gap === 0 && !streakDoneToday(), freezeNeeded: 0 };
  if (gap <= st.freezes) return { n: st.current, atRisk: true, freezeNeeded: gap };
  return { n: 0, atRisk: false, freezeNeeded: 0, lost: st.current };
}
function goalMetToday() { return dayActivity() >= dailyGoal(); }
const streakRule = () => S.settings?.streakRule === 'goal' ? 'goal' : 'any';
/* Did this day keep the streak? 'any': anything studied, played or quizzed that day. 'goal': the daily goal. */
function streakKeptOn(k = dateKey()) {
  if (dayActivity(k) >= dailyGoal()) return true;
  if (streakRule() === 'goal') return false;
  if (dayActivity(k) > 0 || S.log[k]?.kept) return true;
  for (const h of S.history || []) { const hk = dateKey(h.when); if (hk === k) return true; if (hk < k) break; }   // newest first: quick reviews, quizzes, games
  return false;
}
const streakDoneToday = () => streakKeptOn(dateKey());
const streakHowTo = () => streakRule() === 'goal' ? 'Reach today’s goal to keep your streak going!' : 'Study a card, play a game or take a quiz today to keep your streak!';
let streakBusy = false;
function updateStreak() {
  if (streakBusy || !S.settings) return;
  const st = streakState(), today = dateKey();
  if (streakDoneToday() && st.lastDay === today && st.frozen.includes(today)) {   // you froze today but studied anyway: the freeze comes back
    st.frozen = st.frozen.filter(k => k !== today); st.freezes = Math.min(MAX_FREEZES, st.freezes + 1); st.lastDay = shiftKey(today, -1);
  }
  const log = (S.log[today] ||= { reviews: 0, intro: {}, extra: {} });
  if (st.lastDay === today && goalMetToday() && !log.goalMet) {   // streak already kept today; now the daily goal too
    log.goalMet = true; if (typeof addPoints === 'function') addPoints(10);   // daily goal bonus
    setTimeout(() => toast(`🎯 Daily goal reached: ${dailyGoal()} cards today! +10 points`), 300);
  }
  if (!streakDoneToday() || st.lastDay === today) return;
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
  log.kept = true;
  const goalNow = goalMetToday(); if (goalNow) log.goalMet = true;
  const newBadges = STREAK_BADGES.filter(([n]) => st.current >= n && !st.badges[n]);
  newBadges.forEach(([n]) => { st.badges[n] = Date.now(); });
  let freezeEarned = false;
  if (st.current % 7 === 0 && st.freezes < MAX_FREEZES) { st.freezes++; freezeEarned = true; }
  if (goalNow && typeof addPoints === 'function') addPoints(10);   // daily goal bonus
  save();
  streakBusy = false;
  setTimeout(() => celebrate({ streak: st.current, badges: newBadges, freezeEarned, events, goal: goalNow }), 450);
  if (typeof renderStreakChip === 'function') renderStreakChip();
}
function celebrate({ streak, badges, freezeEarned, events, goal = true }) {
  if ($('#dlg').open) { setTimeout(() => celebrate({ streak, badges, freezeEarned, events, goal }), 1500); return; }
  const big = badges.at(-1);
  const pieces = Array.from({ length: 28 }, (_, i) => `<span style="left:${Math.random() * 100}%;animation-delay:${(Math.random() * 0.8).toFixed(2)}s;animation-duration:${(1.6 + Math.random()).toFixed(2)}s">${['🎉', '✨', '⭐', '🔥', '🎊'][i % 5]}</span>`).join('');
  openDialog({
    title: big ? 'New badge unlocked!' : goal ? 'Daily goal reached!' : 'Streak kept!', ok: 'Keep going',
    body: `<div class="confetti">${pieces}</div>
      <div class="celebrate">
        <div class="big">${big ? `<span style="display:inline-flex;align-items:center;gap:4px">${mascot(96, 'party')}<span>${big[1]}</span></span>` : mascot(120, 'party')}</div>
        <div class="word sm">${big ? esc(big[2]) : `${streak}-day streak!`}</div>
        <p class="muted" style="margin:0">${big ? `You studied ${streak} days in a row.` : goal ? `You reached your goal of ${dailyGoal()} cards today. Come back tomorrow to keep it going.` : `Your streak is safe for today. Reach ${dailyGoal()} cards for your daily goal bonus, or come back tomorrow!`}</p>
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
    const met = !!S.log[k]?.goalMet || !!S.log[k]?.kept || (streakKeptOn(k) && k !== dateKey()), frozen = st.frozen.includes(k), today = i === 0;
    cells.push(`<div class="wk ${met ? 'met' : frozen ? 'frozen' : ''} ${today ? 'today' : ''}" title="${d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}${met ? ': streak kept' : frozen ? ': covered by a streak freeze' : ''}">
      <span class="wd">${d.toLocaleDateString(undefined, { weekday: 'narrow' })}</span><span class="dot">${met ? '🔥' : frozen ? '❄️' : today ? '○' : '·'}</span></div>`);
  }
  return `<div class="week">${cells.join('')}</div>`;
}
let streakMin = false;   // phones can fold the streak box; kept only in memory, so it opens fully each time the page loads
function streakPanel() {
  const s = displayStreak(), st = streakState(), act = dayActivity(), goal = dailyGoal(), done = act >= goal, kept = streakDoneToday();
  const next = STREAK_BADGES.find(([n]) => n > s.n);
  return `<section class="panel streak-panel ${streakMin ? 'min' : ''}">
    <div class="sp-main">
      <div class="flame ${kept ? 'lit' : ''}">🔥</div>
      <div style="flex:1;min-width:0"><div class="sp-n">${s.n} day${s.n === 1 ? '' : 's'}</div>
        <div class="muted small sp-min-sum">Today: <b>${Math.min(act, goal)}/${goal}</b> cards${done ? ' ✓' : ''}</div>
        <div class="muted small sp-msg">${done ? 'Goal reached today ✓' : kept ? `Streak kept today ✓ · ${goal - act} more card${goal - act === 1 ? '' : 's'} for your daily goal` : freezePlan().kind === 'todayFrozen' ? '❄️ Today is covered by a streak freeze. Studying still counts!' : s.n ? (s.freezeNeeded ? 'A streak freeze will cover the missed day. Study today!' : streakHowTo()) : s.lost ? `Your ${s.lost}-day streak ended. Start a new one today!` : 'Reach your daily goal to start a streak'}</div></div>
      <button type="button" class="hb-min sp-min" data-act="streakMin" aria-expanded="${!streakMin}" title="${streakMin ? 'Show' : 'Minimize'} your streak" aria-label="${streakMin ? 'Show' : 'Minimize'} your streak">${streakMin ? '▸' : '▾'}</button>
    </div>
    <div class="sp-goal">
      <div class="row-between small"><span>Today: <b>${Math.min(act, goal)}/${goal}</b> cards</span><span class="row" style="gap:8px"><span class="muted">❄️ ${st.freezes}/${MAX_FREEZES} freezes · best ${st.best || 0}</span>${freezeUseBtn()}<button type="button" class="btn sm" data-act="streakCalendar">📅 Calendar</button></span></div>
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
  const s = displayStreak(), done = streakDoneToday();
  b.innerHTML = `<span style="filter:${done ? 'none' : 'grayscale(1)'}">🔥</span>${s.n}`;
  b.title = `${s.n}-day streak · today ${Math.min(dayActivity(), dailyGoal())}/${dailyGoal()} cards`;
}

/* ---------- using your streak freezes yourself ----------
   Freezes still work on their own when you come back, but you can also use them now: cover the days you missed
   (so the streak shows as safe), or cover today in advance when you know you can't study. Studying on a frozen day
   gives that freeze back. */
function freezePlan() {
  const st = streakState(), today = dateKey();
  if (!st.lastDay || !st.current) return { kind: 'none' };
  if (st.lastDay === today) return { kind: st.frozen.includes(today) ? 'todayFrozen' : 'done' };
  const gap = dayDiff(st.lastDay, today) - 1, missed = Array.from({ length: Math.max(0, gap) }, (_, i) => shiftKey(st.lastDay, i + 1));
  if (gap > st.freezes) return { kind: 'lost', days: missed };
  if (gap > 0) return { kind: 'cover', days: missed };
  return { kind: st.freezes ? 'today' : 'noFreezes' };
}
const freezeDay = k => new Date(k + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
function freezeUseBtn() {
  const k = freezePlan().kind;
  return k === 'cover' || k === 'today' ? `<button type="button" class="btn sm" data-act="streakFreeze" title="Use a streak freeze now">❄️ Use</button>` : '';
}
function openFreezeDialog() {
  const st = streakState(), p = freezePlan(), n = st.freezes;
  const have = `<p class="muted" style="margin:0 0 10px">You have <b>${n}</b> of ${MAX_FREEZES} streak freezes. You earn one for every 7 days in a row.</p>`;
  const body = p.kind === 'cover' ? `${have}<p style="margin:0 0 10px">You missed ${p.days.length === 1 ? freezeDay(p.days[0]) : `${p.days.length} days (${p.days.map(freezeDay).join(', ')})`}.
        Use ${p.days.length === 1 ? 'a freeze' : `${p.days.length} freezes`} to keep your <b>${st.current}-day streak</b>?</p>`
    : p.kind === 'today' ? `${have}<p style="margin:0 0 10px">Can’t study today? Use a freeze to cover <b>today</b> and keep your <b>${st.current}-day streak</b> safe.
        If you study after all, you get the freeze back.</p>`
    : p.kind === 'todayFrozen' ? `${have}<p style="margin:0">❄️ Today is already covered by a freeze. Studying today still counts, and gives the freeze back.</p>`
    : p.kind === 'done' ? `${have}<p style="margin:0">You reached your goal today ✓ Nothing needs a freeze.</p>`
    : p.kind === 'lost' ? `${have}<p style="margin:0">You missed ${p.days.length} days, and that’s more freezes than you have, so the streak can’t be saved. Reach today’s goal to start a new one!</p>`
    : p.kind === 'noFreezes' ? `${have}<p style="margin:0">You have no freezes right now. Keep a 7-day streak to earn one.</p>`
    : `${have}<p style="margin:0">Start a streak first: reach your daily goal today.</p>`;
  const can = p.kind === 'cover' || p.kind === 'today';
  openDialog({ title: '❄️ Streak freezes', ok: can ? (p.kind === 'cover' ? `Use ${p.days.length === 1 ? 'a freeze' : p.days.length + ' freezes'}` : 'Freeze today') : 'Close', body,
    onOk: () => { if (can) useFreeze(); } });
  if (!can) $('#dlg [data-dlg=cancel]')?.remove();
}
function useFreeze() {
  const st = streakState(), p = freezePlan(), today = dateKey();
  if (p.kind === 'cover') { st.freezes -= p.days.length; st.frozen.push(...p.days); st.lastDay = shiftKey(today, -1); toast(`❄️ Your ${st.current}-day streak is safe. Study today to keep it growing!`); }
  else if (p.kind === 'today') { st.freezes--; st.frozen.push(today); st.lastDay = today; toast('❄️ Today is covered. See you tomorrow!'); }
  else return;
  save(); render(); renderStreakChip();
}
Object.assign(actions, { streakFreeze: () => openFreezeDialog() });
Object.assign(actions, { streakMin:() => { streakMin = !streakMin; document.querySelectorAll('.streak-panel').forEach(el => { const t = document.createElement('div'); t.innerHTML = streakPanel(); el.replaceWith(t.firstElementChild); }); } });

/* ---------- ⏳ streak warning: a countdown near the end of the day ----------
   From the hour you pick in Settings (6 pm by default), if you have a streak and haven't kept it today, a bar shows
   how long is left until midnight. In the last hour it turns red, and Estudiamos sends one notification if you allowed
   notifications for reminders. ✕ hides it until the last hour (then until the last 10 minutes). */
const streakWarnFrom = () => S.settings?.streakWarnAt ?? 18;
const SW_SKIP = new Set(['profiles', 'study', 'quiz', 'quick', 'saga', 'sagaTitle', 'trails', 'trailsTitle', 'runner', 'game', 'wordTown', 'tower', 'spinSpell', 'showdown', 'millionaire', 'priceParty', 'chess', 'speakgame', 'numgame', 'realsent', 'builder', 'packOpen']);
let swHide = { day: '', until: 0 }, swTimer = null;
function streakWarnState() {
  if (!S?.settings || view?.name === 'profiles') return null;
  const from = streakWarnFrom(); if (!from) return null;
  const now = new Date(); if (now.getHours() < from) return null;
  const s = displayStreak(); if (!s.n || streakDoneToday() || freezePlan().kind === 'todayFrozen') return null;
  const end = new Date(now); end.setHours(24, 0, 0, 0);
  return { n: s.n, left: end - now, freeze: streakState().freezes > 0 };
}
function swFmt(ms) {
  const t = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), sec = t % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : m >= 10 ? `${m} min` : `${m}:${String(sec).padStart(2, '0')}`;
}
function swNotifyOnce(w) {
  if (w.left > 3600e3) return;
  const key = 'sw-notified-' + dateKey();
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1'); } catch { return; }
  try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('⏳ Your streak ends in less than an hour', { body: `Keep your ${w.n}-day streak: study a card, play a game or take a quiz.`, tag: 'streak-warn', icon: 'icon-192.png' }); } catch {}
}
function streakWarnTick() {
  let el = document.getElementById('streakWarn');
  const w = streakWarnState(), show = w && !SW_SKIP.has(view?.name) && w.left <= (swHide.day === dateKey() && swHide.until || Infinity);
  if (w) swNotifyOnce(w);
  if (!show) { el?.remove(); return reschedule(w); }
  if (!el) { el = document.createElement('div'); el.id = 'streakWarn'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  const urgent = w.left <= 3600e3, how = streakRule() === 'goal' ? `Reach your daily goal (${Math.max(0, dailyGoal() - dayActivity())} more cards) to keep it.` : 'Study a card, play a game or take a quiz to keep it.';
  el.className = urgent ? 'urgent' : '';
  el.innerHTML = `<span class="sw-ico">⏳</span><span class="sw-txt">Your <b>${w.n}-day streak</b> ends in <b class="sw-t">${swFmt(w.left)}</b>. ${how}${w.freeze ? ' <span class="sw-note">(If you miss today, a streak freeze will cover it.)</span>' : ''}</span>
    <button type="button" class="btn sm primary" data-act="streakWarnGo">Quick review</button><button type="button" class="sw-x" data-act="streakWarnHide" title="Hide for now" aria-label="Hide for now">✕</button>`;
  reschedule(w);
  function reschedule(w) { clearTimeout(swTimer); swTimer = setTimeout(streakWarnTick, w && w.left <= 600e3 ? 1000 : 15000); }
}
Object.assign(actions, {
  streakWarnGo: () => { const now = Date.now(), d = [...S.decks].sort((a, b) => cardsOf(b.id).filter(c => c.due <= now).length - cardsOf(a.id).filter(c => c.due <= now).length)[0]; if (d) go({ name: 'quickStart', deckId: d.id }); },
  streakWarnHide: () => { const w = streakWarnState(); swHide = { day: dateKey(), until: w && w.left > 3600e3 ? 3600e3 : 600e3 }; streakWarnTick(); },
});
{ const st = document.createElement('style');
  st.textContent = `#streakWarn{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:55;display:flex;align-items:center;gap:10px;max-width:min(760px,calc(100vw - 24px));padding:8px 10px 8px 14px;border-radius:12px;background:var(--surface,#fff);color:var(--text);border:1px solid #f0b429;box-shadow:0 6px 20px rgba(0,0,0,.15);font-size:14px}
    #streakWarn.urgent{border-color:#d64545;background:color-mix(in srgb,#d64545 10%,var(--surface,#fff))}
    #streakWarn .sw-ico{font-size:20px}#streakWarn .sw-txt{flex:1;min-width:0}#streakWarn .sw-t{font-variant-numeric:tabular-nums}#streakWarn.urgent .sw-t{color:#d64545}
    #streakWarn .sw-note{opacity:.75}#streakWarn .sw-x{background:none;border:0;cursor:pointer;font-size:15px;color:inherit;opacity:.6;padding:4px}
    @media (max-width:600px){#streakWarn{top:auto;bottom:calc(76px + env(safe-area-inset-bottom));font-size:13px;flex-wrap:wrap}#streakWarn .sw-txt{flex-basis:calc(100% - 60px)}}`;
  document.head.appendChild(st); }
{ const base = render; render = function () { const r = base.apply(this, arguments); try { streakWarnTick(); } catch (e) { console.error(e); } return r; }; }
document.addEventListener('visibilitychange', () => { if (!document.hidden) streakWarnTick(); });
setTimeout(streakWarnTick, 1500);
