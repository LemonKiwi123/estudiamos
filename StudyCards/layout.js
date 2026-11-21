'use strict';
/* ================= Wide-screen layout =================
   - Wide windows: the top menu becomes a sidebar on the left (pure CSS, see "Wide layout" in index.html).
   - Extra-wide windows: a right column with your streak, trophy and today's goals (#rail).
   - Home: a big "continue" card for the deck that needs you most, and decks shown as a folder list
     (or the old cards grid; toggle with List / Cards). Phones keep the normal layout. */
const RAIL_VIEWS = ['home', 'deck', 'dictionary', 'progress', 'rewards', 'packsHome', 'gallery', 'settings'];

/* ---------- Home: deck that needs you most ---------- */
function homeFeatured(now = Date.now()) {
  if (!S.decks.length) return '';
  let best = null, bestDue = -1;
  for (const d of S.decks) {
    const c = deckCounts(d, now), due = c.new + c.learn + c.review;
    if (due > bestDue || (due === bestDue && c.total > (best?.c.total || 0))) { best = { d, c }; bestDue = due; }
  }
  if (!best || !best.c.total) return '';
  const { d, c } = best, all = cardsOf(d.id), learned = all.filter(x => x.state !== 'new').length;
  const pct = all.length ? learned / all.length * 100 : 0;
  return `<section class="feat-deck">
    <div class="row-between fd-head" style="align-items:flex-start;gap:10px">
      <div><div class="muted small">${bestDue ? 'Continue studying' : 'All caught up for today 🎉'}</div>
        <h2 style="margin:2px 0 0"><a data-act="openDeck" data-id="${d.id}">${esc(d.name)}</a></h2></div>
      <button type="button" class="icon-btn" data-act="deckMenu" data-id="${d.id}" title="Deck options">⋯</button>
    </div>
    <div class="fd-bar"><div style="width:${pct.toFixed(1)}%"></div></div>
    <div class="muted small">Cards learned: <b>${learned}</b> / ${all.length}</div>
    ${bestDue ? `<button type="button" class="btn primary fd-go" data-act="study" data-id="${d.id}">Study ${bestDue} card${bestDue === 1 ? '' : 's'}</button>`
      : `<button type="button" class="btn fd-go" data-act="quickStart" data-id="${d.id}">⚡ Quick review instead</button>`}
  </section>`;
}

/* ---------- Home: one deck as a list row ---------- */
function deckRow(d, now = Date.now()) {
  const c = deckCounts(d, now), due = c.new + c.learn + c.review;
  const k = typeof levelCounts === 'function' ? levelCounts(cardsOf(d.id)) : null;
  return `<article class="deck deck-row" data-deck="${d.id}" draggable="true">
    <div class="dr-main" data-act="openDeck" data-id="${d.id}" title="Open ${esc(d.name)}">
      <div class="dr-name">${typeof deckSubject === 'function' ? `<span title="${esc(subjName(deckSubject(d)))}">${subjEmoji(deckSubject(d))}</span> ` : ''}${esc(d.name)}</div>
      <div class="dr-sub">${due ? `🕒 ${due} card${due === 1 ? '' : 's'} to study today` : c.total ? '✓ Done for today' : 'No cards yet'}<span class="muted"> · ${c.total} card${c.total === 1 ? '' : 's'} · ${esc(langName(d.frontLang))} → ${esc(langName(d.backLang))}</span></div>
      ${k && k.total ? levelBar(k) : ''}
    </div>
    <div class="dr-btns">
      ${c.total ? `<button type="button" class="btn sm ${due ? 'primary' : ''}" data-act="study" data-id="${d.id}" title="${due ? `Study ${due} card${due === 1 ? '' : 's'}` : 'Nothing due right now'}">${due ? 'Study' : 'Done ✓'}</button>` : ''}
      ${c.total ? `<button type="button" class="btn sm" data-act="quickStart" data-id="${d.id}" title="Quick review: go through cards without changing your schedule">⚡ Quick review</button>` : ''}
      ${c.total ? `<button type="button" class="btn sm" data-act="quizSetup" data-id="${d.id}" ${c.total >= 2 ? 'title="Take a quiz on this deck"' : 'disabled title="Quizzes need at least 2 cards"'}>Quiz</button>` : ''}
      ${c.total ? `<button type="button" class="btn sm" data-act="games" data-id="${d.id}" ${c.total >= 2 ? 'title="Play games with this deck"' : 'disabled title="Games need at least 2 cards"'}>🎮 Games</button>` : ''}
    </div>
    ${typeof favStar === 'function' ? favStar(d) : ''}
    <button type="button" class="icon-btn" data-act="deckMenu" data-id="${d.id}" title="Deck options: edit, move to folder, delete">⋯</button>
  </article>`;
}
const homeListMode = () => (S.settings?.deckView || 'list') === 'list';
function deckViewToggle() {
  const list = homeListMode();
  return `<div class="seg-mini" role="group" aria-label="Show decks as">
    <button type="button" class="${list ? 'on' : ''}" data-act="deckView" data-v="list" title="Show decks as a list">☰ List</button>
    <button type="button" class="${list ? '' : 'on'}" data-act="deckView" data-v="grid" title="Show decks as cards">▦ Cards</button></div>`;
}

/* ---------- Right column ---------- */
function railHtml() {
  const now = Date.now(), parts = [];
  if (typeof displayStreak === 'function') {
    const s = displayStreak(), act = dayActivity(), goal = dailyGoal(), done = act >= goal, st = streakState(), kept = typeof streakDoneToday === 'function' ? streakDoneToday() : done;
    parts.push(`<section class="rail-card">
      <div class="row-between"><b>Daily streak</b><a class="small" data-act="streakCalendar">CALENDAR</a></div>
      <div class="rail-big"><span style="filter:${kept ? 'none' : 'grayscale(1)'}">🔥</span><span>${s.n}</span><span class="muted small">day${s.n === 1 ? '' : 's'}</span></div>
      <div class="muted small">${done ? 'Goal reached today ✓' : kept ? `Streak kept today ✓ · ${goal - act} more for your daily goal` : typeof freezePlan === 'function' && freezePlan().kind === 'todayFrozen' ? '❄️ Today is covered by a streak freeze.' : (typeof streakRule === 'function' && streakRule() === 'any' ? `Study a card, play a game or take a quiz to ${s.n ? 'keep your streak' : 'start a streak'}.` : `Study ${goal - Math.min(act, goal)} more card${goal - act === 1 ? '' : 's'} today to ${s.n ? 'keep it going' : 'start a streak'}.`)}</div>
      <div class="muted small row-between" style="gap:6px"><span>❄️ ${st.freezes} freeze${st.freezes === 1 ? '' : 's'} · best ${st.best || 0}</span>${typeof freezeUseBtn === 'function' ? freezeUseBtn() : ''}</div></section>`);
  }
  if (typeof rw === 'function' && typeof TROPHY_TIERS !== 'undefined') {
    const r = rw(), lvl = r.trophy.level, tier = TROPHY_TIERS[lvl - 1] || ['Trophy'];
    parts.push(`<section class="rail-card">
      <div class="row-between"><b>${esc(tier[0])} trophy</b><a class="small" data-act="rewards">VIEW</a></div>
      <div class="row" style="gap:12px;align-items:center">${typeof trophySvg === 'function' ? trophySvg(lvl, 46) : '🏆'}
        <div><div><b>Level ${lvl}</b></div><div class="muted small">${typeof weekPoints === 'function' ? weekPoints(mondayKey()) : r.points} points this week · 🥜 ${r.peanuts}</div></div></div></section>`);
  }
  // Today's goals
  let due = 0, top = null, topDue = 0;
  for (const d of S.decks) { const c = deckCounts(d, now), n = c.new + c.learn + c.review; due += n; if (n > topDue) { topDue = n; top = d; } }
  const act = typeof dayActivity === 'function' ? dayActivity() : (S.log[dateKey()]?.reviews || 0), goal = typeof dailyGoal === 'function' ? dailyGoal() : 10;
  const t = S.log[dateKey()] || {}, packs = typeof packsReadyCount === 'function' ? packsReadyCount() : 0;
  const quest = (icon, label, n, of, btn = '') => `<div class="quest"><span class="q-ic">${icon}</span><div class="q-body"><div class="q-l">${label}</div>
      ${of ? `<div class="q-bar"><div style="width:${Math.min(100, n / of * 100).toFixed(1)}%"></div><span>${Math.min(n, of)} / ${of}</span></div>` : ''}</div>${btn}</div>`;
  parts.push(`<section class="rail-card">
    <div class="row-between"><b>Today</b><a class="small" data-act="progress">PROGRESS</a></div>
    ${quest('⚡', `Reach your goal of ${goal} cards`, act, goal)}
    ${quest('🎯', due ? `${due} card${due === 1 ? '' : 's'} to study now` : 'Nothing due right now ✓', t.reviews || 0, (t.reviews || 0) + due,
      top ? `<button type="button" class="btn sm primary" data-act="study" data-id="${top.id}" title="Study ${esc(top.name)}">Go</button>` : '')}
    ${packs ? quest('<svg class="pack-ico" viewBox="0 0 24 30" aria-hidden="true"><use href="#icoPack"/></svg>', `${packs} word pack${packs === 1 ? '' : 's'} ready to open`, 0, 0, '<button type="button" class="btn sm" data-act="packsHome">Open</button>') : ''}
  </section>`);
  if (typeof homeBoxesHtml === 'function') parts.push(homeBoxesHtml());   // reminders and sticky notes (homebox.js); the home dashboard that also has them is hidden when this column shows
  return parts.join('');
}
function renderRail() {
  let el = $('#rail');
  const show = RAIL_VIEWS.includes(view.name) && !!S.settings && (typeof currentProfileId === 'undefined' || !!currentProfileId);
  document.body.classList.toggle('has-rail', show);
  if (!show) { if (el) el.hidden = true; return; }
  if (!el) { el = document.createElement('aside'); el.id = 'rail'; el.setAttribute('aria-label', 'Your day'); document.body.appendChild(el); }
  el.hidden = false;
  try { el.innerHTML = railHtml(); } catch (e) { console.error(e); el.hidden = true; document.body.classList.remove('has-rail'); }
}

Object.assign(actions, {
  deckView: el => { S.settings.deckView = el.dataset.v; save(); render(); },
});
