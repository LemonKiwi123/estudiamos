'use strict';
/* ================= Rewards: ⭐ points, 🥜 peanuts, study badges, weekly trophies, shop =================
   Points: Study review +1 (new card +2), Quick review answer +1 (+5 when finished), quiz/game correct answer +2,
   +3 for finishing, +10 for a perfect score (5+ questions), daily goal +10.
   Peanuts: 1 per 5 points, plus bonuses from badges and trophy promotions. Spend them in the shop.
   Weekly trophies (1–10): each Monday the past week's points are checked. Reach the "move up" target to gain a
   trophy; earn less than the "keep" target and you drop one. */
const PEANUTS_PER_POINTS = 5;
const FREEZE_PRICE = 100;
const TROPHY_TIERS = [
  ['Peanut', '#b08968'], ['Sprout', '#7bc67e'], ['Pebble', '#9aa5b1'], ['Lotus', '#f49ab3'], ['Bamboo', '#4caf50'],
  ['River', '#4f9dde'], ['Baobab', '#a1662f'], ['Savanna', '#e9a64a'], ['Mountain', '#7d6bd6'], ['Golden Tusk', '#f2c14e'],
];
const promoteTarget = l => l >= 10 ? null : 120 + 60 * (l - 1);
const keepTarget = l => l <= 1 ? 0 : Math.round((l >= 10 ? 660 : promoteTarget(l)) * 0.4);
const mondayKey = (t = Date.now()) => { const d = new Date(t); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dateKey(d.getTime()); };

/* Study badges: [id, emoji, name, description, target, measure, peanut reward, gives a streak freeze] */
const STUDY_BADGES = [
  ['learn10', '🌱', 'First words', 'Learn 10 new cards', 10, 'learned', 10],
  ['learn50', '📗', 'Word collector', 'Learn 50 new cards', 50, 'learned', 25],
  ['learn200', '📚', 'Bookworm', 'Learn 200 new cards', 200, 'learned', 60, true],
  ['learn1000', '🏛️', 'Living dictionary', 'Learn 1,000 new cards', 1000, 'learned', 150, true],
  ['rev100', '🔁', 'Getting the hang of it', 'Do 100 reviews in Study', 100, 'reviews', 15],
  ['rev1000', '🧠', 'Memory muscle', 'Do 1,000 reviews in Study', 1000, 'reviews', 60, true],
  ['rev5000', '🐘', 'An elephant never forgets', 'Do 5,000 reviews in Study', 5000, 'reviews', 150, true],
  ['master10', '🎓', 'Mastery begins', 'Master 10 cards (21+ day interval)', 10, 'mastered', 20],
  ['master100', '🏅', 'Master mind', 'Master 100 cards', 100, 'mastered', 80, true],
  ['perfect1', '💯', 'Flawless', 'Get a perfect score in a quiz or game (5+ questions)', 1, 'perfect', 10],
  ['perfect10', '🌟', 'Perfectionist', 'Get 10 perfect scores', 10, 'perfect', 40, true],
  ['games5', '🎮', 'Game on', 'Finish 5 quizzes or games', 5, 'games', 10],
  ['games50', '🕹️', 'Game fan', 'Finish 50 quizzes or games', 50, 'games', 50, true],
  ['quick5', '⚡', 'Speed reader', 'Finish 5 quick reviews', 5, 'quick', 20],
  ['run10', '🦘', 'Hop to it', 'Make 10 jumps in one Elephant run', 10, 'runBest', 15],
  ['run30', '🚀', 'Unstoppable', 'Make 30 jumps in one Elephant run', 30, 'runBest', 50, true],
  ['goal7', '🎯', 'Goal getter', 'Reach your daily goal on 7 days', 7, 'goalDays', 25],
  ['pts1000', '⭐', 'Star student', 'Earn 1,000 points', 1000, 'points', 30],
  ['pts10000', '🌠', 'Superstar', 'Earn 10,000 points', 10000, 'points', 150, true],
  ['cards20', '🎴', 'Card collector', 'Collect 20 different word cards (any language)', 20, 'collected', 30],
  ['cards60', '🗃️', 'Big collection', 'Collect 60 different word cards in one language', 60, 'collected', 200, true],
  ['cards150', '👑', 'Complete set', 'Collect all 150 word cards in one language', 150, 'collected', 400, true],
  ['trophy5', '🏆', 'Halfway to the top', 'Reach trophy 5', 5, 'trophyBest', 50, true],
  ['trophy10', '👑', 'Golden Tusk', 'Reach trophy 10', 10, 'trophyBest', 200, true],
];

function rw() {
  S.rewards ||= {};
  const r = S.rewards;
  r.points ??= 0; r.peanuts ??= 0; r.peanutProgress ??= 0; r.badges ||= {};
  r.stats ||= { learned: S.cards.filter(c => c.state !== 'new').length, perfect: 0, games: 0, quick: 0 };
  r.trophy ||= { level: 1, best: 1, weekStart: mondayKey(), history: [] };
  return r;
}
function badgeMeasure(m) {
  const r = rw();
  switch (m) {
    case 'learned': return Math.max(r.stats.learned || 0, S.cards.filter(c => c.state !== 'new').length);
    case 'reviews': return Object.values(S.log).reduce((a, l) => a + (l.reviews || 0), 0);
    case 'mastered': return S.cards.filter(c => c.state === 'review' && c.interval >= 21).length;
    case 'perfect': return r.stats.perfect || 0;
    case 'games': return r.stats.games || 0;
    case 'quick': return r.stats.quick || 0;
    case 'runBest': return Math.max(0, ...Object.values(S.runnerBest || {}));
    case 'goalDays': return Object.values(S.log).filter(l => l.goalMet).length;
    case 'points': return r.points;
    case 'trophyBest': return r.trophy.best || 1;
    case 'collected': return Math.max(0, ...Object.values(S.packs?.collection || {}).map(c => Object.keys(c).length));
  }
  return 0;
}
const pendingPopups = [];
/* Add points (and the peanuts they earn). Callers save afterwards. */
function addPoints(n, quiet) {
  if (!n || !S.settings) return;
  const r = rw(), l = todayLog();
  l.points = Math.max(0, (l.points || 0) + n);
  r.points = Math.max(0, r.points + n);
  if (n > 0) {
    if (typeof packsAddPoints === 'function') packsAddPoints(n);   // fills the card pack meter
    r.peanutProgress += n;
    const earned = Math.floor(r.peanutProgress / PEANUTS_PER_POINTS);
    if (earned) { r.peanuts += earned; r.peanutProgress -= earned * PEANUTS_PER_POINTS; }
    if (!quiet) pointsPop(n);
  }
  checkBadges();
}
function checkBadges() {
  const r = rw();
  for (const [id, e, name, desc, target, m, nuts, freeze] of STUDY_BADGES) {
    if (r.badges[id] || badgeMeasure(m) < target) continue;
    r.badges[id] = Date.now();
    r.peanuts += nuts;
    let gotFreeze = false;
    if (freeze) gotFreeze = grantFreeze();
    pendingPopups.push({ kind: 'badge', emoji: e, name, desc, nuts, gotFreeze });
  }
  schedulePopups();
}
function grantFreeze() {
  const st = streakState();
  if (st.freezes >= MAX_FREEZES) { rw().peanuts += 50; return false; }   // full: give peanuts instead
  st.freezes++; return true;
}
/* Award points for a finished quiz or game (called from addHistory). */
function awardResult(entry) {
  const r = rw();
  let pts = (entry.correct || 0) * 2 + 3;
  if (entry.type === 'quick') pts = 5;
  const perfect = entry.type !== 'quick' && entry.total >= 5 && entry.correct === entry.total;
  if (perfect) { pts += 10; r.stats.perfect = (r.stats.perfect || 0) + 1; }
  if (entry.type === 'quick') r.stats.quick = (r.stats.quick || 0) + 1; else r.stats.games = (r.stats.games || 0) + 1;
  addPoints(pts);
  return pts;
}

/* ---------- Weekly trophies ---------- */
function weekPoints(startKey) { let s = 0; for (let i = 0; i < 7; i++) s += S.log[shiftKey(startKey, i)]?.points || 0; return s; }
function evaluateWeeks() {
  if (!S.settings) return;
  const r = rw(), t = r.trophy, now = mondayKey();
  let guard = 0;
  while (t.weekStart < now && guard++ < 60) {
    const pts = weekPoints(t.weekStart), lvl = t.level, up = promoteTarget(lvl), keep = keepTarget(lvl);
    let result = 'stay';
    if (up != null && pts >= up) { t.level++; result = 'up'; }
    else if (pts < keep && lvl > 1) { t.level--; result = 'down'; }
    t.history.unshift({ week: t.weekStart, points: pts, from: lvl, to: t.level, result });
    t.history.length = Math.min(t.history.length, 52);
    if (result === 'up') {
      t.best = Math.max(t.best || 1, t.level);
      const nuts = 20 + t.level * 10, gotFreeze = t.level % 3 === 0 || t.level === 10 ? grantFreeze() : false;
      r.peanuts += nuts;
      pendingPopups.push({ kind: 'up', level: t.level, pts, nuts, gotFreeze });
    } else if (result === 'down') pendingPopups.push({ kind: 'down', level: t.level, pts, keep });
    else if (guard === 1) pendingPopups.push({ kind: 'stay', level: t.level, pts });
    t.weekStart = shiftKey(t.weekStart, 7);
  }
  if (guard) { checkBadges(); save(); }
}
function trophySvg(level, size = 48, on = true) {
  const c = on ? TROPHY_TIERS[level - 1][1] : 'var(--border)';
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true">
    <path d="M18 10h28v8c0 10-6 18-14 18s-14-8-14-18z" fill="${c}"/>
    <path d="M18 14H9c0 9 5 14 11 14M46 14h9c0 9-5 14-11 14" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="28" y="35" width="8" height="10" fill="${c}"/><rect x="20" y="45" width="24" height="8" rx="3" fill="${c}"/>
    ${on ? `<path d="M24 14c0 8 3 13 6 15" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${size < 28 ? '' : `<text x="32" y="27" text-anchor="middle" font-family="Segoe UI, sans-serif" font-size="12" font-weight="800" fill="#fff">${level}</text>`}` : ''}
  </svg>`;
}

/* ---------- Popups & small UI ---------- */
const PLAYING = ['study', 'quick', 'quiz', 'game', 'builder', 'realsent', 'runner', 'tower', 'showdown', 'millionaire', 'priceParty', 'spinSpell', 'wordTown', 'trails', 'saga'];
let popupTimer = null;
function schedulePopups() { if (!popupTimer && pendingPopups.length) popupTimer = setTimeout(showPopups, 800); }
function showPopups() {
  popupTimer = null;
  if (!pendingPopups.length) return;
  const playing = PLAYING.includes(view.name) && !(view.name === 'runner' && run?.over);
  if ($('#dlg').open || playing || view.name === 'profiles') { popupTimer = setTimeout(showPopups, 1500); return; }
  const items = pendingPopups.splice(0);
  const badges = items.filter(x => x.kind === 'badge'), weeks = items.filter(x => x.kind !== 'badge');
  const nuts = items.reduce((a, x) => a + (x.nuts || 0), 0), freezes = items.filter(x => x.gotFreeze).length;
  const w = weeks.at(-1);
  const title = w?.kind === 'up' ? `You moved up to trophy ${w.level}!` : badges.length ? (badges.length > 1 ? `${badges.length} new badges!` : 'New badge unlocked!') : w?.kind === 'down' ? 'New week, new chance' : 'Weekly results';
  const pieces = Array.from({ length: 24 }, (_, i) => `<span style="left:${Math.random() * 100}%;animation-delay:${(Math.random() * 0.8).toFixed(2)}s;animation-duration:${(1.6 + Math.random()).toFixed(2)}s">${['⭐', '🥜', '✨', '🏆'][i % 4]}</span>`).join('');
  openDialog({
    title, ok: 'Yay!',
    body: `${w?.kind === 'down' ? '' : `<div class="confetti">${pieces}</div>`}
      <div class="celebrate">
        ${w ? `<div style="display:flex;align-items:flex-end;gap:6px;justify-content:center">${mascot(90, w.kind === 'down' ? 'sleepy' : 'party')}${trophySvg(w.level, 72)}</div>
          <div class="word sm">${w.kind === 'up' ? `${esc(TROPHY_TIERS[w.level - 1][0])} trophy` : w.kind === 'down' ? `Back to trophy ${w.level}` : `You kept trophy ${w.level}`}</div>
          <p class="muted" style="margin:0">Last week you earned <b>${w.pts}</b> points.${w.kind === 'down' ? ` You needed ${w.keep} to keep your trophy. Study a little each day to win it back!` : ''}</p>` : mascot(100, 'party')}
        ${badges.length ? `<div class="badge-row">${badges.map(b => `<div class="badge got"><div class="be">${b.emoji}</div><b>${esc(b.name)}</b><span class="muted small">${esc(b.desc)}</span></div>`).join('')}</div>` : ''}
        ${nuts ? `<div class="reward">🥜 +${nuts} peanuts${freezes ? ` and ❄️ ${freezes} streak freeze${freezes > 1 ? 's' : ''}` : ''}!</div>` : ''}
      </div>`,
    onOk: () => { render(); },
  });
  $('#dlg [data-dlg=cancel]')?.remove();
  save();
}
function pointsPop(n) {
  let el = $('#ptsPop');
  if (!el) { el = document.createElement('div'); el.id = 'ptsPop'; document.body.appendChild(el); }
  el.dataset.n = (+(el.dataset.n || 0) + n);
  el.textContent = `+${el.dataset.n} ⭐`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(el._t); el._t = setTimeout(() => { el.classList.remove('show'); el.dataset.n = 0; }, 1400);
}
let badgesCheckedFor = null;
function renderTrophyChip() {
  const b = $('#trophyBtn'); if (!b) return;
  const hide = view.name === 'profiles' || !S.settings || (typeof currentProfileId !== 'undefined' && !currentProfileId);
  b.hidden = hide; if (hide) return;
  evaluateWeeks();
  if (badgesCheckedFor !== currentProfileId) { badgesCheckedFor = currentProfileId; checkBadges(); }   // count progress made before badges existed
  const r = rw();
  b.innerHTML = `${trophySvg(r.trophy.level, 20)}<span>${r.trophy.level}</span><span class="nuts">🥜 ${r.peanuts}</span>`;
  b.title = `Trophy ${r.trophy.level} (${TROPHY_TIERS[r.trophy.level - 1][0]}) · ${weekPoints(mondayKey())} points this week · ${r.peanuts} peanuts`;
  schedulePopups();
}

/* ---------- Rewards page ---------- */
views.rewards = () => {
  evaluateWeeks();
  const r = rw(), t = r.trophy, lvl = t.level, wk = weekPoints(mondayKey()), up = promoteTarget(lvl), keep = keepTarget(lvl);
  const endsIn = 7 - dayDiff(mondayKey(), dateKey()), target = up ?? 660, pct = Math.min(100, wk / target * 100);
  const st = streakState(), today = todayLog().points || 0;
  const badges = STUDY_BADGES.map(([id, e, name, desc, target, m, nuts, freeze]) => {
    const got = r.badges[id], v = Math.min(target, badgeMeasure(m));
    return `<div class="badge ${got ? 'got' : ''}" title="${esc(desc)}${got ? ` · unlocked ${new Date(got).toLocaleDateString()}` : ''}">
      <div class="be">${got ? e : '🔒'}</div><b>${esc(name)}</b><span class="muted small">${esc(desc)}</span>
      ${got ? '<span class="small" style="color:var(--good)">✓ Unlocked</span>' : `<div class="pbar" style="max-width:none;width:100%;margin-top:4px"><span style="width:${(v / target * 100).toFixed(1)}%;background:var(--accent)"></span></div><span class="muted small">${v.toLocaleString()}/${target.toLocaleString()}</span>`}
      <span class="muted small">🥜 ${nuts}${freeze ? ' + ❄️' : ''}</span></div>`;
  }).join('');
  const got = STUDY_BADGES.filter(b => r.badges[b[0]]).length;
  return `
    <div class="row-between" style="margin-bottom:16px"><h2>Rewards</h2>
      <div class="row"><span class="pill" style="font-size:14px">⭐ ${today} today · ${r.points.toLocaleString()} total</span><span class="pill" style="font-size:14px">🥜 ${r.peanuts} peanuts</span></div></div>

    <section class="panel trophy-panel">
      <div class="tp-main">${trophySvg(lvl, 96)}
        <div><div class="muted small">Weekly trophy</div><div class="sp-n">${lvl}/10 · ${esc(TROPHY_TIERS[lvl - 1][0])}</div>
          <div class="muted small">Week ends in ${endsIn} day${endsIn === 1 ? '' : 's'} (resets Monday)</div></div></div>
      <div class="tp-goal">
        <div class="row-between small"><span>This week: <b>${wk}</b> points</span><span class="muted">${up != null ? `Move up at ${up}` : 'Top trophy reached!'}${keep ? ` · keep at ${keep}` : ''}</span></div>
        <div class="trophy-bar"><div class="fill" style="width:${pct.toFixed(1)}%"></div>${keep ? `<div class="keep" style="left:${Math.min(100, keep / target * 100).toFixed(1)}%" title="Earn at least ${keep} to keep trophy ${lvl}"></div>` : ''}</div>
        <div class="muted small">${up != null && wk >= up ? '🎉 You’ve earned your next trophy. It will be awarded on Monday!' : wk < keep ? `⚠️ Earn ${keep - wk} more points this week to keep trophy ${lvl}.` : up != null ? `${up - wk} more points to move up to trophy ${lvl + 1}.` : 'Stay above the keep line to hold the Golden Tusk.'}</div>
        <div class="trophy-row">${TROPHY_TIERS.map((_, i) => `<span title="${i + 1}. ${esc(TROPHY_TIERS[i][0])}">${trophySvg(i + 1, 30, i < lvl)}</span>`).join('')}</div>
      </div>
    </section>

    <section class="panel" style="margin-top:16px">
      <div class="row-between"><h3>🥜 Peanut shop</h3><span class="muted small">Earn 1 peanut for every ${PEANUTS_PER_POINTS} points, plus bonuses from badges and trophies</span></div>
      <div style="margin-top:12px">${typeof friendTip === 'function' ? friendTip('squirrel', 'shop') : ''}</div>
      <div class="shop">
        <div class="shop-item"><div class="be">❄️</div><div style="flex:1"><b>Streak freeze</b><div class="muted small">Protects your streak if you miss a day. You have ${st.freezes}/${MAX_FREEZES}.</div></div>
          <button type="button" class="btn ${r.peanuts >= FREEZE_PRICE && st.freezes < MAX_FREEZES ? 'primary' : ''}" data-act="buyFreeze" ${r.peanuts >= FREEZE_PRICE && st.freezes < MAX_FREEZES ? '' : 'disabled'}>${st.freezes >= MAX_FREEZES ? 'Full' : `Buy · 🥜 ${FREEZE_PRICE}`}</button></div>
      </div>
      <p class="muted small" style="margin:10px 0 0">You can also win free streak freezes: every 7-day streak, badges marked ❄️, and moving up to trophies 3, 6, 9 and 10.</p>
    </section>

    <section class="panel" style="margin-top:16px">
      <div class="row-between"><h3>Study badges</h3><span class="muted small">${got}/${STUDY_BADGES.length} unlocked</span></div>
      <div class="badges">${badges}</div>
    </section>

    ${badgesPanel()}

    <section class="panel" style="margin-top:16px">
      <h3>How to earn points</h3>
      <div class="earn">
        <span>Study a card</span><b>+1 ⭐ (new card +2)</b>
        <span>Quick review answer</span><b>+1 ⭐, +5 when finished</b>
        <span>Correct answer in a quiz or game</span><b>+2 ⭐</b>
        <span>Finish a quiz or game</span><b>+3 ⭐</b>
        <span>Perfect score (5+ questions)</span><b>+10 ⭐</b>
        <span>Reach your daily goal</span><b>+10 ⭐</b>
      </div>
    </section>

    ${t.history.length ? `<section class="panel" style="margin-top:16px"><h3>Past weeks</h3><div class="missed">${t.history.slice(0, 12).map(h => `
      <div class="item"><div class="cell">${trophySvg(h.to, 26)}<span>Week of ${new Date(h.week + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>
      <div>${h.points} points · ${h.result === 'up' ? `<b style="color:var(--good)">▲ up to ${h.to}</b>` : h.result === 'down' ? `<b style="color:var(--again)">▼ down to ${h.to}</b>` : `kept ${h.to}`}</div></div>`).join('')}</div></section>` : ''}`;
};

Object.assign(actions, {
  rewards: () => go({ name: 'rewards' }),
  buyFreeze: () => {
    const r = rw(), st = streakState();
    if (r.peanuts < FREEZE_PRICE || st.freezes >= MAX_FREEZES) return;
    r.peanuts -= FREEZE_PRICE; st.freezes++; save(); render();
    toast(`❄️ Streak freeze bought! You have ${st.freezes}/${MAX_FREEZES}.`);
  },
});
