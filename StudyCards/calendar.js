'use strict';
/* ================= Streak calendar: browse your study days month by month ================= */
let cal = null;   // { y, m, sel }
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const keyOf = (y, m, d) => dateKey(new Date(y, m, d, 12).getTime());
function dayState(k) {
  const l = S.log[k] || {}, act = (l.reviews || 0) + (l.practice || 0);
  const met = !!l.goalMet || act >= dailyGoal(), frozen = !met && (streakState().frozen || []).includes(k);
  const games = (S.history || []).filter(h => dateKey(h.when) === k);
  return { act, met, frozen, some: act > 0 || games.length > 0, points: l.points || 0, reviews: l.reviews || 0, practice: l.practice || 0, games };
}
function firstActiveKey() {
  const keys = Object.keys(S.log).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k) && dayState(k).some).sort();
  const h = (S.history || []).map(x => dateKey(x.when)).sort();
  return [keys[0], h[0]].filter(Boolean).sort()[0] || dateKey();
}
function openStreakCalendar() {
  const now = new Date(); cal = { y: now.getFullYear(), m: now.getMonth(), sel: dateKey() };
  openDialog({ title: '📅 Streak calendar', ok: 'Close', wide: true, body: '<div id="calBody"></div>', onOpen: () => renderCal(), onOk: () => {} });
  $('#dlg [data-dlg=cancel]')?.remove();
}
function renderCal() {
  const box = $('#calBody'); if (!box || !cal) return;
  const { y, m } = cal, today = dateKey(), now = new Date();
  const first = new Date(y, m, 1), lead = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  const isCurMonth = y === now.getFullYear() && m === now.getMonth();
  const firstKey = firstActiveKey(), [fy, fm] = firstKey.split('-').map(Number), atStart = y < fy || (y === fy && m <= fm - 1);
  const on = k => { const s = dayState(k); return s.met || s.frozen; };
  let cells = '', metDays = 0, frozenDays = 0, cards = 0, points = 0, run = 0, bestRun = 0;
  for (let i = 0; i < lead; i++) cells += '<div class="cal-day cal-empty"></div>';
  for (let d = 1; d <= days; d++) {
    const k = keyOf(y, m, d), s = dayState(k), future = k > today;
    if (s.met) metDays++; if (s.frozen) frozenDays++;
    cards += s.reviews + s.practice; points += s.points;
    run = on(k) ? run + 1 : 0; bestRun = Math.max(bestRun, run);
    const prevOn = on(keyOf(y, m, d - 1)), nextOn = on(keyOf(y, m, d + 1)) && keyOf(y, m, d + 1) <= today;
    const runCls = on(k) ? (prevOn && nextOn ? 'run-mid' : prevOn ? 'run-end' : nextOn ? 'run-start' : 'run-solo') : '';
    const cls = ['cal-day', s.met ? 'met' : s.frozen ? 'frozen' : s.some ? 'some' : '', runCls, k === today ? 'today' : '', future ? 'future' : '', k === cal.sel ? 'sel' : ''].join(' ');
    const icon = future ? '' : s.met ? '🔥' : s.frozen ? '❄️' : s.some ? '<span class="cal-dot"></span>' : '';
    cells += `<button type="button" class="${cls}" ${future ? 'disabled' : `data-act="calDay" data-k="${k}"`} title="${new Date(y, m, d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${s.met ? ': goal reached' : s.frozen ? ': saved by a streak freeze' : s.some ? `: ${s.act} cards` : ''}">
      <span class="cal-num">${d}</span><span class="cal-ic">${icon}</span></button>`;
  }
  const monthName = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  // selected day details
  const sk = cal.sel, ss = dayState(sk), sd = new Date(sk + 'T12:00');
  const detail = sk > today ? '' : `<div class="cal-detail">
      <div class="row-between"><b>${sd.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</b>
        <span class="pill ${ss.met ? 'due' : ''}">${ss.met ? '🔥 Goal reached' : ss.frozen ? '❄️ Saved by a streak freeze' : ss.some ? '🙂 Studied a little' : sk === today ? '⏳ Not yet today' : '💤 No study'}</span></div>
      <div class="cal-stats">
        <div><b>${ss.reviews}</b><span>cards studied</span></div><div><b>${ss.practice}</b><span>answers in games &amp; reviews</span></div>
        <div><b>${ss.points}</b><span>⭐ points</span></div><div><b>${Math.min(ss.act, dailyGoal())}/${dailyGoal()}</b><span>daily goal</span></div></div>
      ${ss.games.length ? `<div class="cal-games">${ss.games.map(h => `<button type="button" class="hist-row" data-act="openResult" data-id="${h.id}"><span class="h-emoji">${RESULT_TYPES[h.type]?.emoji || '•'}</span>
          <span class="h-main"><b>${RESULT_TYPES[h.type]?.name || h.type}</b> <span class="muted">· ${esc(h.deckName || '')}</span><span class="muted small" style="display:block">${new Date(h.when).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}${h.detail ? ' · ' + esc(h.detail) : ''}</span></span>
          <b style="color:${scoreColor(h.score)}">${h.score}%</b></button>`).join('')}</div>` : `<p class="muted small" style="margin:8px 0 0">No quizzes or games played this day.</p>`}
    </div>`;
  const st = streakState();
  box.innerHTML = `
    <div class="cal-head">
      <button type="button" class="icon-btn" data-act="calNav" data-d="-1" ${atStart ? 'disabled' : ''} title="Previous month (←)">◀</button>
      <div class="cal-title">${esc(monthName)}</div>
      <button type="button" class="icon-btn" data-act="calNav" data-d="1" ${isCurMonth ? 'disabled' : ''} title="Next month (→)">▶</button>
      <button type="button" class="btn sm" data-act="calToday" ${isCurMonth && cal.sel === today ? 'disabled' : ''}>Today</button>
    </div>
    <div class="cal-sum"><span>🔥 <b>${metDays}</b> day${metDays === 1 ? '' : 's'} on goal</span><span>❄️ <b>${frozenDays}</b> frozen</span><span>📈 longest streak this month: <b>${bestRun}</b></span>
      <span>🃏 <b>${cards}</b> cards</span><span>⭐ <b>${points}</b> points</span><span class="muted">Current streak ${displayStreak().n} · best ${st.best || 0}</span></div>
    <div class="cal-grid">${DOW.map(d => `<div class="cal-dow">${d}</div>`).join('')}${cells}</div>
    <div class="cal-legend muted small"><span>🔥 goal reached</span><span>❄️ streak freeze</span><span><span class="cal-dot"></span> studied a little</span><span>Click a day to see what you did</span></div>
    ${detail}`;
}
function calNav(delta) {
  if (!cal) return; let { y, m } = cal; m += delta; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
  const now = new Date(); if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth())) return;
  const [fy, fm] = firstActiveKey().split('-').map(Number); if (y < fy || (y === fy && m < fm - 1)) return;   // nothing before your first study day
  cal.y = y; cal.m = m;
  const last = new Date(y, m + 1, 0).getDate(), selDay = Math.min(+cal.sel.slice(8), last), k = keyOf(y, m, selDay);
  cal.sel = k > dateKey() ? dateKey() : k; renderCal();
}
Object.assign(actions, {
  streakCalendar: () => openStreakCalendar(),
  calNav: el => calNav(+el.dataset.d),
  calToday: () => { const n = new Date(); cal = { y: n.getFullYear(), m: n.getMonth(), sel: dateKey() }; renderCal(); },
  calDay: el => { cal.sel = el.dataset.k; renderCal(); },
});
document.addEventListener('keydown', e => {
  if (!$('#calBody') || !$('#dlg').open) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); calNav(-1); }
  else if (e.key === 'ArrowRight') { e.preventDefault(); calNav(1); }
});
