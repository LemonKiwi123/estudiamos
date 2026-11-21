'use strict';
/* ================= Progress: word retention from games =================
   Every finished game saves each answer (which card, right or wrong, when) in the saved results. From those we work out,
   per language, how well words stick: when a game brings a word back on a LATER day, did you still get it right first try?
   Only the first try of each word on each day counts, so a game repeating a missed word a minute later doesn't inflate it.
   Quizzes and Quick review are left out: this is about what the games teach. */
const RET_GAPS = [[1, 1, '1 day'], [2, 3, '2–3 days'], [4, 7, '4–7 days'], [8, 14, '1–2 weeks'], [15, 1e9, '2+ weeks']];
const RET_WEEKS = 8;
function retLangName(k) {
  if (k === '@other') return 'Other subjects';
  try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(k) || k; } catch { return k; }
}
function gameRetention() {
  const cardOf = new Map(S.cards.map(c => [c.id, c])), byCard = new Map();
  for (const h of S.history || []) {
    if (isQuizResult(h)) continue;
    for (const it of h.items || []) {
      if (!it.cardId || !cardOf.has(it.cardId)) continue;
      const list = byCard.get(it.cardId) || byCard.set(it.cardId, []).get(it.cardId);
      list.push({ t: h.when, ok: !!it.ok, type: h.type });
    }
  }
  const langs = new Map(), today = dateKey(), weekStart = startOfDay(Date.now()) - (RET_WEEKS * 7 - 1) * DAY;
  for (const [id, raw] of byCard) {
    const c = cardOf.get(id), d = deckById(c.deckId); if (!d) continue;
    const isLang = typeof deckSubject !== 'function' || deckSubject(d) === 'lang';
    const k = isLang ? (langBase(d.frontLang || '') || '@other') : '@other';
    const L = langs.get(k) || langs.set(k, { k, cards: [], tries: 0, right: 0, gaps: RET_GAPS.map(() => [0, 0]), weeks: Array.from({ length: RET_WEEKS }, () => [0, 0]),
      games: new Map(), remembered: 0, slipping: 0, justMet: 0, slipList: [], keepList: [] }).get(k);
    // first try of each day, oldest first
    const days = new Map();
    for (const a of raw.sort((x, y) => x.t - y.t)) { const dk = dateKey(a.t); if (!days.has(dk)) days.set(dk, a); }
    const firsts = [...days.entries()];
    for (const [, a] of firsts) {
      L.tries++; if (a.ok) L.right++;
      const g = L.games.get(a.type) || L.games.set(a.type, [0, 0]).get(a.type); g[0]++; if (a.ok) g[1]++;
      if (a.t >= weekStart) { const w = Math.min(RET_WEEKS - 1, Math.floor((a.t - weekStart) / (7 * DAY))); L.weeks[w][0]++; if (a.ok) L.weeks[w][1]++; }
    }
    for (let i = 1; i < firsts.length; i++) {   // came back on a later day: did it stick?
      const gap = dayDiff(firsts[i - 1][0], firsts[i][0]), b = RET_GAPS.findIndex(([lo, hi]) => gap >= lo && gap <= hi);
      if (b >= 0) { L.gaps[b][0]++; if (firsts[i][1].ok) L.gaps[b][1]++; }
    }
    const last = firsts[firsts.length - 1][1], info = { c, seen: firsts.length, lastT: last.t, misses: firsts.filter(([, a]) => !a.ok).length };
    if (firsts.length < 2) L.justMet++;
    else if (last.ok) { L.remembered++; L.keepList.push(info); }
    else { L.slipping++; L.slipList.push(info); }
    L.cards.push(c);
  }
  for (const L of langs.values()) {
    L.slipList.sort((a, b) => b.misses - a.misses || b.lastT - a.lastT);
    L.keepList.sort((a, b) => b.seen - a.seen);
    L.rate = L.remembered + L.slipping ? Math.round(L.remembered / (L.remembered + L.slipping) * 100) : null;
  }
  return [...langs.values()].sort((a, b) => b.tries - a.tries);
}
const retPct = ([n, ok]) => n ? Math.round(ok / n * 100) : null;
function gameRetentionHtml() {
  const all = gameRetention();
  const head = `<div class="row-between"><h3>🎮 Word retention from games</h3><span class="muted small">First try each day, when a game brings a word back</span></div>`;
  if (!all.length) return `<section class="panel" style="margin-top:16px">${head}<p class="muted" style="margin:8px 0 0">Play a few games with your decks, then come back on another day. You'll see here which words stick and which keep slipping.</p></section>`;
  const L = all.find(x => x.k === view.retLang) || all[0], sel = L.k;
  const chips = all.length > 1 ? `<div class="row ret-langs" style="gap:6px;flex-wrap:wrap;margin:6px 0 10px">${all.map(x => `<button type="button" class="btn sm ret-chip ${x.k === sel ? 'on' : ''}" data-act="retLang" data-k="${esc(x.k)}">${esc(retLangName(x.k))} <span class="muted small">${x.cards.length}</span></button>`).join('')}</div>` : `<div class="muted small" style="margin:4px 0 10px">${esc(retLangName(sel))}</div>`;
  const acc = L.tries ? Math.round(L.right / L.tries * 100) : null;
  const tile = (n, label, color) => `<div class="stat"><div class="n" style="${color ? `color:${color}` : ''}">${n}</div><div class="l">${label}</div></div>`;
  const tiles = `<section class="stats ret-stats">${tile(L.cards.length, 'Words played in games')}${tile(L.rate == null ? '–' : L.rate + '%', 'Still known on a later day', L.rate == null ? '' : scoreColor(L.rate))}
    ${tile(L.remembered, '✅ Remembered')}${tile(L.slipping, '🔁 Keep slipping', L.slipping ? 'var(--again)' : '')}</section>`;
  const gapRows = L.gaps.some(([n]) => n) ? `<div class="ret-block"><b>After a break</b><span class="muted small"> · how often you still knew a word when it came back</span>
    <div class="ret-rows">${RET_GAPS.map(([, , label], i) => { const p = retPct(L.gaps[i]);
      return `<div class="ret-row"><span>${label}</span><span class="ret-bar"><span style="width:${p ?? 0}%;background:${p == null ? 'transparent' : scoreColor(p)}"></span></span><span class="small">${p == null ? '<span class="muted">–</span>' : `<b style="color:${scoreColor(p)}">${p}%</b> <span class="muted">(${L.gaps[i][0]})</span>`}</span></div>`; }).join('')}</div></div>`
    : `<p class="muted small ret-block">Words show up here once a game brings them back on a later day.</p>`;
  const weekBars = L.weeks.some(([n]) => n) ? `<div class="ret-block"><b>Week by week</b><span class="muted small"> · first-try accuracy in games, last ${RET_WEEKS} weeks</span>
    <div class="trend" style="height:70px">${L.weeks.map(([n, ok], i) => { const p = n ? Math.round(ok / n * 100) : 0;
      return `<div class="bar" title="${RET_WEEKS - 1 - i === 0 ? 'This week' : `${RET_WEEKS - 1 - i} week${RET_WEEKS - 1 - i === 1 ? '' : 's'} ago`}: ${n ? `${p}% of ${n}` : 'no games'}" style="height:${n ? Math.max(4, p) : 2}%;background:${n ? scoreColor(p) : 'var(--surface2)'}"></div>`; }).join('')}</div>
    <div class="row-between muted small"><span>${RET_WEEKS} weeks ago</span><span>This week</span></div></div>` : '';
  const games = [...L.games.entries()].filter(([, [n]]) => n >= 3).sort((a, b) => retPct(b[1]) - retPct(a[1]));
  const gameRows = games.length ? `<div class="ret-block"><b>By game</b><span class="muted small"> · first-try accuracy</span>
    <div class="ret-rows">${games.map(([t, g]) => { const p = retPct(g); return `<div class="ret-row"><span>${RESULT_TYPES[t]?.emoji || '🎮'} ${esc(RESULT_TYPES[t]?.name || t)}</span><span class="ret-bar"><span style="width:${p}%;background:${scoreColor(p)}"></span></span><span class="small"><b style="color:${scoreColor(p)}">${p}%</b> <span class="muted">(${g[0]})</span></span></div>`; }).join('')}</div></div>` : '';
  const word = i => `<li><b>${esc(plainSent(i.c.front || ''))}</b> <span class="muted">→ ${esc(plainSent(i.c.back || ''))}</span> <span class="muted small">· missed ${i.misses} of ${i.seen} day${i.seen === 1 ? '' : 's'}</span></li>`;
  const slip = L.slipList.length ? `<div class="ret-block"><div class="row-between"><b>🔁 Keep slipping</b><button type="button" class="btn sm" data-act="retPractice" data-k="${esc(sel)}">Practice these</button></div>
    <ul class="ret-list">${L.slipList.slice(0, 8).map(word).join('')}</ul>${L.slipList.length > 8 ? `<div class="muted small">…and ${L.slipList.length - 8} more</div>` : ''}</div>` : '';
  const kept = L.keepList.length ? `<details class="ret-block"><summary><b>✅ Remembered</b> <span class="muted small">(${L.keepList.length})</span></summary><ul class="ret-list">${L.keepList.slice(0, 20).map(i => `<li><b>${esc(plainSent(i.c.front || ''))}</b> <span class="muted">→ ${esc(plainSent(i.c.back || ''))}</span></li>`).join('')}</ul></details>` : '';
  return `<section class="panel" style="margin-top:16px">${head}${chips}${tiles}
    ${L.justMet ? `<p class="muted small" style="margin:8px 0 0">🌱 ${L.justMet} word${L.justMet === 1 ? '' : 's'} played on one day so far: they count once a game brings them back.</p>` : ''}
    ${gapRows}${weekBars}${gameRows}${slip}${kept}</section>`;
}
function retPractice(k) {
  const L = gameRetention().find(x => x.k === k); if (!L || !L.slipList.length) return toast('Nothing slipping right now 🎉');
  const byDeck = new Map(); for (const { c } of L.slipList) (byDeck.get(c.deckId) || byDeck.set(c.deckId, []).get(c.deckId)).push(c.id);
  const [deckId, ids] = [...byDeck.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  if (cardsOf(deckId).length < 2) return toast('Add at least 2 cards to that deck to practice');
  toast(`🔁 A quiz on the words that keep slipping from “${deckById(deckId).name}”`);
  startQuiz(deckId, { ...(typeof QUIZ_DEFAULTS !== 'undefined' ? QUIZ_DEFAULTS : {}), ...(typeof quizPrefs !== 'undefined' ? quizPrefs : {}), count: 'all' }, ids.slice(0, 20));
}
Object.assign(actions, { retLang: el => { view.retLang = el.dataset.k; render(); }, retPractice: el => retPractice(el.dataset.k) });
{ const st = document.createElement('style');
  st.textContent = `.ret-stats{grid-template-columns:repeat(4,1fr);margin:0}.ret-block{margin-top:14px}.ret-rows{display:grid;gap:6px;margin-top:6px}
    .ret-row{display:grid;grid-template-columns:minmax(110px,170px) 1fr minmax(70px,auto);gap:10px;align-items:center;font-size:14px}
    .ret-bar{height:10px;background:var(--surface2);border-radius:99px;overflow:hidden}.ret-bar>span{display:block;height:100%;border-radius:99px}
    .ret-list{margin:6px 0 0;padding-left:18px;display:grid;gap:3px;font-size:14px}.ret-chip.on{background:var(--accent);color:var(--accent-ink,#fff);border-color:var(--accent)}
    @media (max-width:600px){.ret-stats{grid-template-columns:repeat(2,1fr)}.ret-row{grid-template-columns:96px 1fr auto}}`;
  document.head.appendChild(st); }
