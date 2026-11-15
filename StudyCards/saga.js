'use strict';
/* ================= Lexicon Saga: game engine =================
   An original turn-based word adventure. World data is in saga-data.js.
   Fight = pick the right meaning (fast answers are critical hits). Spells = type the word yourself.
   Saves live in your profile (S.sagaSlots, 3 slots) and sync like everything else.
   Shares the handheld console shell, key bindings and chip-tune player with Wordling Trails. */

/* ---------- Saves ---------- */
const sgSlots = () => (S.sagaSlots ||= {});
const sgS = () => sgSlots()[S.sagaSlot || 'a'] || null;
const sgHero = (key, name) => { const h = { key, name, lv: 1, xp: 0, gear: { weapon: 'stick', armor: 'cloth' } }; h.hp = sgMax(h, 'hp'); h.mp = sgMax(h, 'mp'); return h; };
function sgFix(s) {
  if (!s) return s;
  s.flags ||= {}; s.got ||= {}; s.bag ||= {}; s.gearBag ||= {}; s.beaten ||= {}; s.playMs ||= 0; s.bench ||= []; s.met ||= {};
  for (const h of [...s.party, ...s.bench]) { h.st ||= {}; s.met[h.key] = 1; }
  if (!SG_MAPS[s.map]) Object.assign(s, { map: 'town', x: 9, y: 9, dir: 'down' });
  if (typeof sgFixMore === 'function') sgFixMore(s);
  return s;
}
function sgNewSave(slot, name) {
  sgSlots()[slot] = sgFix({ v: 1, name: name.slice(0, 10) || 'Hero', party: [sgHero('knight', name.slice(0, 10) || 'Hero')], gold: 50, bag: { herb: 2 }, gearBag: {},
    map: SG_MAPS.castle_q ? 'castle_q' : 'town', x: SG_MAPS.castle_q ? 14 : 9, y: 3, dir: 'up', flags: {}, got: {}, beaten: {}, home: 'town', started: Date.now(), playMs: 0, steps: 0 });
  S.sagaSlot = slot; save();
}
function sgSaveNow(silent) {
  const s = sgS(); if (!s || !sg) return;
  const now = Date.now(); s.playMs += now - (sg.tick || now); sg.tick = now; s.savedAt = now; save();
  if (!silent) sgSay(`📜 The Chronicle is written. Your journey is saved in slot ${(S.sagaSlot || 'a').toUpperCase()}.`);
}

/* ---------- Heroes: stats, levels, spells ---------- */
const sgNeed = lv => Math.round(10 * lv ** 1.9);
function sgBase(h, k) { const [b, per] = SG_HEROES[h.key][k]; return Math.floor(b + per * (h.lv - 1)); }
function sgGearBonus(h, k) { let n = 0; for (const g of Object.values(h.gear || {})) n += SG_GEAR[g]?.[k] || 0; return n; }
const sgStat = (h, k) => { const v = sgBase(h, k) + sgGearBonus(h, k); return h.st?.curse && k !== 'agi' ? Math.floor(v * 0.6) : v; };
const SG_ST = { poison: ['☠️', 'poisoned', '#9b59b6'], curse: ['🌑', 'cursed', '#5b2a6e'] };
const sgStIcons = h => h.hp > 0 ? Object.keys(h.st || {}).filter(k => h.st[k] && SG_ST[k]).map(k => SG_ST[k][0]).join('') : '';
function sgFall(h) { if (h.hp <= 0) { h.hp = 0; h.st = {}; } }
const sgMax = (h, k) => sgBase(h, k);
const sgSpellsOf = h => Object.entries(SG_SPELLS).filter(([, sp]) => sp.who === h.key && h.lv >= sp.lv).map(([k]) => k);
const sgAlive = () => sgS().party.filter(h => h.hp > 0);
function sgGiveXp(lines, amount) {
  for (const h of sgAlive()) {
    h.xp += amount;
    while (h.xp >= sgNeed(h.lv)) {
      h.xp -= sgNeed(h.lv); const before = sgSpellsOf(h), oldHp = sgMax(h, 'hp'), oldMp = sgMax(h, 'mp'); h.lv++;
      h.hp += sgMax(h, 'hp') - oldHp; h.mp += sgMax(h, 'mp') - oldMp;
      lines.push(`🎉 ${esc(h.name)} reached level ${h.lv}!`);
      for (const k of sgSpellsOf(h)) if (!before.includes(k)) lines.push(`✨ ${esc(h.name)} learned <b>${SG_SPELLS[k].name}</b>!`);
      sgJingle('sg_level');
    }
  }
}

/* ---------- Building the caves (same layout every time) ---------- */
(function sgBuildWorld() {
  for (const m of Object.values(SG_MAPS)) {
    m.npcs ||= []; m.objs ||= []; m.theme ||= m.town ? 'town' : 'field';
    if (!m.gen) continue;
    const built = trGenMap(m.gen), swap = { C: 'X', ';': 'C', ':': 'c', o: 'c' };
    const grid = built.rows.map(r => [...r].map(c => swap[c] || c)), path = built.path, onPath = new Set(path.map(([x, y]) => x + ',' + y));
    const P = f => path[Math.max(0, Math.min(path.length - 1, Math.round(f * (path.length - 1))))];
    const [sx, sy] = path[0], [ex, ey] = path[path.length - 1];
    grid[sy][sx] = '<'; m.start = { x: sx, y: sy };
    if (m.downTo) { grid[ey][ex] = '>'; m.stairs = { x: ex, y: ey }; }
    const used = new Set([sx + ',' + sy, ex + ',' + ey]);
    const nearOff = (x, y) => {   // an open floor tile beside the path, so a chest never blocks the way
      for (let r = 1; r <= 4; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (grid[ny]?.[nx] && 'Cc'.includes(grid[ny][nx]) && !onPath.has(k) && !used.has(k)) return [nx, ny];
      }
      return null;
    };
    for (const o of m.objs) {
      let at = P(o.at);
      if (o.type === 'seal') at = [ex, ey];
      else if (o.type === 'chest' || o.type === 'lockChest') { const off = o.at >= 1 ? at : nearOff(...at); if (off) at = off; }
      else { let i = Math.round(o.at * (path.length - 1)); while (used.has(path[i][0] + ',' + path[i][1]) && i > 0) i--; at = path[i]; }
      if (o.at >= 1 && o.type === 'chest') { at = [ex, ey]; grid[ey][ex] = 'C'; }
      o.x = at[0]; o.y = at[1]; used.add(o.x + ',' + o.y);
    }
    m.rows = grid.map(r => r.join(''));
  }
})();

['Y', 'u'].forEach(t => SG_WALK.add(t));
/* ---------- State ---------- */
let sg = null;
const SG_DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const sgTile = (map, x, y) => (SG_MAPS[map].gates?.[x + ',' + y] && sgS()?.flags[SG_MAPS[map].gates[x + ',' + y]] ? 'C' : null) || (SG_MAPS[map].rows[y] || '')[x] || (['cave', 'archive', 'ember', 'tower', 'ice', 'crag', 'blight', 'ruins', 'mire', 'canyon', 'castle'].includes(SG_MAPS[map].theme) && !SG_OWP_THEMES.has(SG_MAPS[map].theme) ? 'X' : SG_MAPS[map].theme === 'desert' ? 'M' : SG_MAPS[map].theme === 'tavern' ? 'O' : '#');
function startSaga(deckId) {
  sgFix(sgS());
  const s = sgS();
  sg = { deckId, d: deckById(deckId), pool: runnerPool(deckId), queue: [], ui: null, bt: null, moving: null, held: null, frame: 0, np: {}, tick: Date.now(),
    trail: [], grace: 4, loop: 0, ended: false, flash: 0, shake: 0, banner: { text: SG_MAPS[s.map].name, until: 110 },
    session: { start: Date.now(), results: [], nuts: 0, wins: 0 } };
  go({ name: 'saga' });
  if (!s.flags.intro) { s.flags.intro = 1; setTimeout(() => sgSay(SG_STORY.intro, () => sgSay(['You stand in the great hall of Castle Quillhaven.', 'Talk to people with A. Open your menu with B.'])), 300); }
}
const sgNpcs = map => { const s = sgS(); return SG_MAPS[map].npcs.filter(n => !(n.join && s.party.some(h => h.key === n.join)) && !(n.hire && s.met?.[n.hire])).map(n => { const o = sg?.np[map + ':' + n.id]; return o ? Object.assign(Object.create(n), o) : n; }); };
const sgObjs = map => { const s = sgS(); return SG_MAPS[map].objs.filter(o => !((o.type === 'foeSpot' || o.type === 'boss' || o.type === 'ghostFoe') && s.beaten[o.id]) && !(o.type === 'npc' && s.party.some(h => h.key === o.join)) && !(o.type === 'seal' && s.flags[o.id]) && !(o.type === 'hidden' && s.got[o.id])); };
const sgNpcAt = (map, x, y) => sgNpcs(map).find(n => n.x === x && n.y === y);
const sgObjAt = (map, x, y) => sgObjs(map).find(o => o.x === x && o.y === y);
const sgBlocksObj = o => o && !['seal', 'plate', 'hidden', 'whirlpool'].includes(o.type);
const sgCanWalk = (map, x, y) => {
  const s = sgS(), t = sgTile(map, x, y);
  if (s.fly && typeof sgFlyWalk === 'function') return sgFlyWalk(map, x, y);
  if (t === 'W' && s.flags.ship) return s.boat || sgTile(map, s.x, s.y) === 'Q' || (s.shipMap === map && s.shipAt === x + ',' + y);
  if (s.boat && t === 'B') return true;
  if (s.boat && !SG_WALK.has(t)) return false;
  return SG_WALK.has(t) && !sgNpcAt(map, x, y) && !sgBlocksObj(sgObjAt(map, x, y));
};

/* ---------- Questions from the deck ---------- */
function sgCard() { return gmPick(sg); }   // words you miss come back sooner and more often (runner.js)
const sgHardScript = t => /[぀-ヿ㐀-鿿가-힯؀-ۿ֐-׿Ѐ-ӿ฀-๿]/.test(t || '');
function sgAsk(title, then) {
  const c = sgCard(), rev = Math.random() < 0.3, prompt = rev ? c.back : c.front, answer = rev ? c.front : c.back;
  const pool = sg.pool.filter(x => x.id !== c.id).map(x => rev ? x.front : x.back);
  const lim = sgTimeLimit(), q = { mode: 'mc', card: c, title, prompt, answer, lang: rev ? sg.d.backLang : sg.d.frontLang, opts: pickOptions(answer, pool, 4), t0: Date.now(), then, given: null, limit: lim ? lim * 1000 : 0 };
  sg.ui = { type: 'question', q }; sgBox(); trMusic.setDuck?.(0.4);
  if (q.limit) q.timer = setTimeout(() => { if (sg?.ui?.q === q && q.given == null) sgAnswer(null); }, q.limit + 150);
  if (S.settings.trAloud ?? (typeof autoplayOn === 'function' && autoplayOn())) setTimeout(() => speak(prompt, q.lang), 150);
}
/* spells: type the word in the language you're learning (falls back to 6 choices for non-Latin scripts or long answers) */
function sgAskSpell(title, then) {
  let c = null; for (let t = 0; t < 8; t++) { const x = sgCard(); if (!c || ((x.front || '').length <= 24 && !sgHardScript(x.front))) c = x; if ((c.front || '').length <= 24 && !sgHardScript(c.front)) break; }
  const typeIt = (c.front || '').length <= 24 && !sgHardScript(c.front);
  const pool = sg.pool.filter(x => x.id !== c.id).map(x => x.front);
  const q = { mode: typeIt ? 'type' : 'mc', spell: true, card: c, title, prompt: c.back, answer: c.front, lang: sg.d.frontLang, opts: typeIt ? [] : pickOptions(c.front, pool, 6), t0: Date.now(), then, given: null };
  sg.ui = { type: 'question', q }; sgBox(); trMusic.setDuck?.(0.4);
  if (typeIt) setTimeout(() => $('#sgType')?.focus(), 60);
}
function sgLev(a, b) {
  const m = a.length, n = b.length, d = [...Array(n + 1).keys()];
  for (let i = 1; i <= m; i++) { let prev = d[0]; d[0] = i; for (let j = 1; j <= n; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } }
  return d[n];
}
function sgGrade(given, answer) {
  const g = norm(given), alts = String(answer).split(/[,;/]|\bor\b/).map(norm).filter(Boolean).concat(norm(answer));
  if (alts.includes(g)) return 'exact';
  if (alts.some(a => a.length >= 4 && sgLev(g, a) <= 1)) return 'close';
  return 'wrong';
}
/* ⏱️ how long the word meter lasts in battle (seconds, 0 = no limit) */
const SG_TIMES = [0, 2, 4, 6, 8, 10, 15];
const sgTimeLimit = () => { const v = S.settings?.sgTime; return SG_TIMES.includes(v) ? v : 6; };
/* speed bonus: answer at once = up to +60% damage, at the end of the meter = +0% */
function sgSpeed(q) {
  const ms = q.ms ?? 99999, ref = q.limit || 6000, frac = Math.min(1, ms / ref);
  const mult = q.grade === 'exact' ? 1 + 0.6 * (1 - frac) : 1;
  return { mult, crit: q.grade === 'exact' && frac < 0.3, pct: Math.round((mult - 1) * 100) };
}
function sgAnswer(given) {
  const q = sg.ui?.q; if (!q || q.given != null) return;
  clearTimeout(q.timer); q.ms = Date.now() - q.t0;
  q.timeout = given == null; q.given = given ?? '';
  q.grade = q.timeout ? 'wrong' : q.mode === 'type' ? sgGrade(given, q.answer) : norm(given) === norm(q.answer) ? 'exact' : 'wrong';
  q.ok = q.grade !== 'wrong'; q.fast = q.mode === 'type' ? q.grade === 'exact' && q.ms < 9000 : sgSpeed(q).crit;
  sg.session.results.push({ cardId: q.card.id, q: q.prompt, a: q.answer, given: q.given, ok: q.ok }); gmResult(sg, q.card, q.ok);
  if (typeof sdSound === 'function') sdSound(q.ok ? 'right' : 'wrong');
  sgBox();
  setTimeout(() => { trMusic.setDuck?.(1); if (sg?.ui?.q === q) { sg.ui = null; q.then(q.grade, q.fast, q); } }, q.ok ? 800 : 1700);
}

/* ---------- Windows: text, menus, questions (drawn over the game screen) ---------- */
const sgFx = (kind, name) => `<i hidden data-fx="${kind || 'dark'}|${esc(name || '')}"></i>`;
function sgSay(lines, then) { sg.ui = { type: 'text', lines: [].concat(lines), i: 0, then }; sgBox(); }
function sgMenu(title, items, back, opts = {}) { sg.ui = { type: 'menu', title, items, sel: Math.max(0, Math.min(opts.sel ?? 0, items.length - 1)), back, ...opts }; if (sg.ui.items[sg.ui.sel]?.disabled) sg.ui.sel = Math.max(0, items.findIndex(x => !x.disabled)); sgBox(); }
function sgA() {
  const u = sg.ui; if (!u) return sgInteract();
  if (u.type === 'text') { u.i++; if (u.i >= u.lines.length) { sg.ui = null; sgBox(); u.then?.(); } else sgBox(); }
  else if (u.type === 'menu') { const it = u.items[u.sel]; if (it && !it.disabled) { sg.ui = null; it.fn(); if (!sg.ui) sgBox(); } }
  else if (u.type === 'map') { sg.ui = null; sgBox(); }
  else if (u.type === 'question' && u.q.mode === 'type' && u.q.given == null) { const v = $('#sgType')?.value || ''; if (v.trim()) sgAnswer(v); }
}
function sgB() {
  const u = sg.ui;
  if (!u) { if (!sg.bt) sgMainMenu(); return; }
  if (u.type === 'map') { sg.ui = null; return sgMainMenu(); }
  if (u.type === 'menu' && u.back) { sg.ui = null; u.back(); if (!sg.ui) sgBox(); }
  else if (u.type === 'text') sgA();
}
function sgMenuMove(dir) {
  const u = sg.ui; if (u?.type !== 'menu') return;
  const n = u.items.length, cols = u.cols || 1, d = dir === 'up' ? -cols : dir === 'down' ? cols : dir === 'left' ? -1 : 1;
  if (cols === 1 && (dir === 'left' || dir === 'right')) return;
  let i = u.sel; for (let t = 0; t < n; t++) { i = (i + d + n * 4) % n; if (!u.items[i].disabled) break; }
  u.sel = i; sgBox();
}
const sgLang = () => gtWant(sg?.d?.frontLang);
function sgNames() {
  const s = sgS(); return [s?.name, ...(s?.party || []).map(h => h.name), ...(s?.bench || []).map(h => h.name), ...Object.values(SG_NAMES), ...Object.values(SG_MONSTERS).map(m => m.name),
    ...Object.values(SG_MAPS).map(m => m.name), ...Object.values(SG_ITEMS).map(i => i.name), ...Object.values(SG_GEAR).map(g => g.name), ...Object.values(SG_SPELLS).map(x => x.name),
    ...Object.values(SG_MAPS).flatMap(m => (m.npcs || []).map(n => n.name)), 'King Aldous', 'Queen Ysolde', 'Sage Orrin', 'Archmage Veyra', 'Sir Aldric', 'The Oracle', 'Quill Swan', 'Lexicon'].filter(Boolean);
}
function sgLangLabel() { return gtLangLabel(sg?.d?.frontLang); }
function sgLangMenu() {
  sgMenu('🌐 Game language', gtLangItems(sg.d?.frontLang, sgLangMenu), () => sgOptions(3));
}
function sgBox() { sgBoxRaw(); const l = sgLang(), q = sg?.ui?.q; if (l) gtBox($('#sgBox'), l, sgNames().concat(q ? [q.answer, q.given] : [])); }
function sgBoxRaw() {
  const el = $('#sgBox'); if (!el || !sg) return;
  const u = sg.ui;
  if (u?.type !== 'map') gameMapClose();
  el.classList.toggle('open', !!u);
  el.classList.toggle('big', !!(u?.type === 'question' || (u?.type === 'menu' && (u.items.length > 5 || u.big))));
  el.classList.toggle('low', !!sg.bt && u?.type !== 'question' && !(u?.type === 'menu' && u.items.length > 5));
  if (!u) { el.innerHTML = ''; return; }
  if (u.type === 'text') { const fx = /data-fx="([^"|]*)\|([^"]*)"/.exec(u.lines[u.i]); if (fx && u.fxAt !== u.i) { u.fxAt = u.i; sg.fx = { kind: fx[1], name: fx[2].replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, '’'), t: 0 }; if (sg.bt) sg.shake = 8; }
    el.innerHTML = `<div class="sg-text">${u.lines[u.i]}</div><button type="button" class="sg-next" data-act="sgA" aria-label="Next">▼</button>`; return; }
  if (u.type === 'map') { el.classList.remove('open'); el.innerHTML = ''; gameMapPop(sgMapHtml(u), 'sg'); sgMapDraw(); return; }
  if (u.type === 'menu') {
    el.innerHTML = `${u.title ? `<div class="sg-mtitle">${u.title}</div>` : ''}<div class="sg-menu ${u.cols === 2 ? 'two' : ''}">${u.items.map((it, i) =>
      `<button type="button" class="sg-mi ${i === u.sel ? 'sel' : ''}" data-act="sgPick" data-i="${i}" ${it.disabled ? 'disabled' : ''}><span class="sg-cur">▶</span><span class="sg-ml">${it.label}${it.sub ? `<small>${it.sub}</small>` : ''}</span></button>`).join('')}</div>
      ${u.back ? '<button type="button" class="sg-back" data-act="sgB">B · Back</button>' : ''}`;
    el.querySelector('.sg-mi.sel')?.scrollIntoView({ block: 'nearest' });
    return;
  }
  if (u.type === 'question') {
    const q = u.q, done = q.given != null;
    const sp = q.mode === 'mc' && done ? sgSpeed(q) : null;
    const verdict = !done ? '' : q.timeout ? `⏱️ Time’s up! It was: <b>${esc(q.answer)}</b>` : q.grade === 'exact' ? (q.spell ? (q.fast ? '⚡ Perfect and fast!' : '✓ Right!') : sp.crit ? `⚡ Lightning fast! Critical! (+${sp.pct}%)` : sp.pct >= 5 ? `✓ Right! Speed bonus +${sp.pct}%` : '✓ Right!') : q.grade === 'close' ? `≈ Almost! It’s <b>${esc(q.answer)}</b>` : `✗ It was: <b>${esc(q.answer)}</b>`;
    el.innerHTML = `<div class="sg-q"><div class="sg-mtitle">${q.title}</div>
      <div class="sg-prompt"><span>${q.listen && !done ? '🎧 Listen…' : esc(q.prompt)}</span>${!q.spell && typeof speakBtn === 'function' ? speakBtn(q.prompt, q.lang) : ''}</div>
      ${q.mode === 'say' && typeof sgSayHtml === 'function' ? sgSayHtml(q, done) : q.mode === 'type'
        ? `<form class="sg-typeform" data-sgtype="1"><input id="sgType" autocomplete="off" autocapitalize="off" spellcheck="false" lang="${esc(q.lang || '')}" placeholder="Type the word…" aria-label="Spell it in ${esc(langName(q.lang) || 'the deck language')}" ${done ? 'disabled' : ''} value="${done ? esc(q.given) : ''}"><button type="submit" class="sg-cast" ${done ? 'disabled' : ''}>✨ Cast</button></form>`
        : `${q.limit ? `<div class="sg-timer"><div style="animation-duration:${q.limit / 1000}s;${done ? 'animation-play-state:paused' : ''}"></div></div>` : ''}<div class="sg-opts ${q.opts.length > 4 ? 'six' : ''}">${q.opts.map((o, i) => { const st = !done ? '' : norm(o) === norm(q.answer) ? 'right' : o === q.given ? 'wrong' : 'dim';
          return `<button type="button" class="sg-opt ${st}" data-act="sgAns" data-i="${i}" ${done ? 'disabled' : ''}><kbd>${i + 1}</kbd>${esc(o)}</button>`; }).join('')}</div>`}
      ${done ? `<div class="sg-verdict">${verdict}</div>` : ''}</div>`;
  }
}

/* ---------- Walking, warps and encounters ---------- */
function sgStep() {
  if (sg.ui || sg.bt || !sg.held) return;
  const s = sgS(), [dx, dy] = SG_DIRS[sg.held];
  if (s.dir !== sg.held) { s.dir = sg.held; if (!sg.turnHold) { sg.turnHold = 4; return; } }
  if (sg.turnHold > 0) { sg.turnHold--; if (sg.turnHold) return; }
  const nx = s.x + dx, ny = s.y + dy;
  if (!sgCanWalk(s.map, nx, ny)) { const door = SG_MAPS[s.map].doors?.[nx + ',' + ny]; if (door) { sg.held = null; sgDoor(door); } return; }
  sg.moving = { fx: s.x, fy: s.y, tx: nx, ty: ny, t: 0 };
}
function sgArrive(prev) {
  if (sgS().fly && typeof sgFlyArrive === 'function') return sgFlyArrive(prev);
  const s = sgS(), m = SG_MAPS[s.map], key = s.x + ',' + s.y, t = sgTile(s.map, s.x, s.y);
  s.steps++;
  const wasBoat = s.boat; s.boat = t === 'W' || (!!wasBoat && t === 'B');
  if (s.boat !== !!wasBoat) { sg.trail = []; if (s.boat) delete s.shipAt; else if (prev) { s.shipMap = s.map; s.shipAt = prev.x + ',' + prev.y; } sgMusicSync(); if (s.boat && !s.flags.sailed) { s.flags.sailed = 1; sg.held = null; return sgSay('⛵ All aboard the Quill Swan! Sail onto any shore to land.'); } }
  if (m.warps?.[key]) {
    const w = m.warps[key];
    if (w.need && !s.flags[w.need]) { sg.held = null; if (prev) Object.assign(s, { x: prev.x, y: prev.y }); return sgSay(w.block || 'The way is blocked.'); }
    if (w.need === 'tide' && !s.flags.tideUsed) { s.flags.tideUsed = 1; sg.held = null; return sgSay('🌊 The Tide Charm glows… the sea draws back from the old stairs!', () => sgWarp(w.map, SG_MAPS[w.map].start.x, SG_MAPS[w.map].start.y, 'up')); }
    return w.at === 'start' ? sgWarp(w.map, SG_MAPS[w.map].start.x, SG_MAPS[w.map].start.y, 'up') : sgWarp(w.map, w.x, w.y, w.dir);
  }
  if ((m.town || m.inside) && s.y === m.rows.length - 1) return sgWarp(m.exitTo.map, m.exitTo.x, m.exitTo.y, m.exitTo.dir);
  const here = sgObjs(s.map).find(o => o.x === s.x && o.y === s.y);
  if (here?.type === 'hidden') { sg.held = null; s.got[here.id] = 1; sgGive(here.give); sg.flash = 14; sgJingle('sg_fanfare'); sgSaveNow(true);
    const keysNow = s.flags.key1 && s.flags.key2 && s.flags.key3 && !s.flags.keysAll;
    if (keysNow) s.flags.keysAll = 1;
    return sgSay(SG_STORY[here.story] || ['You found something!'], keysNow ? () => sgSay(SG_STORY.keysAll) : null); }
  if (here?.type === 'plate') return sgPlate(here);
  if (s.steps % 4 === 0) { let hurt = false; for (const h of sgAlive()) if (h.st?.poison && h.hp > 1) { h.hp--; hurt = true; } if (hurt) { sg.shake = 4; sg.poisonFlash = 6; } }
  if (t === '<') { const u = m.upTo; return typeof u === 'string' ? sgWarp(u, SG_MAPS[u].stairs.x, SG_MAPS[u].stairs.y, 'down') : sgWarp(u.map, u.x, u.y, u.dir); }
  if (t === '>') {
    const seal = m.objs.find(o => o.type === 'seal' && o.x === s.x && o.y === s.y);
    if (seal && !s.flags[seal.id]) { sg.held = null; return sgSeal(seal); }
    return sgWarp(m.downTo, SG_MAPS[m.downTo].start.x, SG_MAPS[m.downTo].start.y, 'up');
  }
  if (typeof sgArriveMore === 'function' && sgArriveMore(prev, t)) return;
  // random battles
  const rate = { '.': 18, h: 14, f: 9, d: 15, C: 13, c: 12, W: 16 }[t];
  if (rate && m.zone && --sg.grace <= 0 && Math.random() < 1 / rate) { sg.held = null; sg.grace = 4; sgEncounter(s.boat ? (m.seaZone || 'sea') : m.zone(s.x, s.y)); }
}
function sgWarp(map, x, y, dir, quiet) {
  const s = sgS(); Object.assign(s, { map, x, y, dir, boat: s.flags.ship && sgTile(map, x, y) === 'W', fly: false }); sg.trail = []; sg.np = {}; sg.grace = 5; sg.flash = 8;
  if (s.boat) { delete s.shipAt; }
  if (map === 'castle1' && !s.flags.castleOpen) { s.flags.castleOpen = 1; setTimeout(() => sg && !sg.bt && sgSay(SG_STORY.castleGate), 400); }
  if (map === 'eastsea' && !s.flags.isles) { s.flags.isles = 1; setTimeout(() => sg && !sg.bt && sgSay(SG_STORY.isles), 400); }
  if (SG_MAPS[map].town) s.home = map;
  (s.seen ||= {})[map] = 1;
  sgSaveNow(true); sgMusicSync();
  sg.banner = quiet ? null : { text: SG_MAPS[map].name, until: sg.frame + 110 };
}
/* how far along the story you are (0 to 13), and the point where each area normally shows up */
const SG_STAGE_FLAGS = ['king', 'shard', 'kingDone', 'queen', 'tide', 'shard2', 'ship', 'oracle', 'isles', 'archmage', 'crystal', 'wayfare', 'lexicon'];
const sgStage = () => SG_STAGE_FLAGS.filter(k => sgS()?.flags[k]).length;
SG_STAGE_FLAGS.push('allshards', 'keyquest', 'key1', 'key2', 'key3');
const SG_ZONE_STAGE = { tundra: 13, icecave: 13, crag: 13, mine: 13, blight: 14, crypt: 14, jungle: 13, temple: 13, mire: 13, barrow: 13, canyon: 13, echocave: 13, castle: 16, south: 0, north: 1, hollow1: 1, hollow2: 2, sand: 4, sea: 7, archive1: 5, archive2: 5, isles: 9, deepsea: 9, ember1: 10, ember2: 10, tower1: 12, tower2: 12, tower3: 12, ...(typeof SG_ZONE_STAGE_MORE !== 'undefined' ? SG_ZONE_STAGE_MORE : {}) };
const SG_MAX_FOES = 8;
function sgEncounter(zone) {
  const z = SG_ZONES[zone]; if (!z) return;
  const total = z.list.reduce((a, [, w]) => a + w, 0), pick = () => { let r = Math.random() * total; for (const [k, w] of z.list) { r -= w; if (r <= 0) return k; } return z.list[0][0]; };
  const stage = sgStage(), max = Math.min(SG_MAX_FOES, z.max + Math.floor(stage / 2)), lo = Math.max(1, Math.ceil(max / 3));
  const n = Math.round((lo + Math.random() * (max - lo)) * (sgAlive().length >= 2 ? 1 : 0.7));
  sgBattle(Array.from({ length: Math.max(1, Math.min(max, n)) }, pick), { zone });
}

/* ---------- Talking, chests, seals ---------- */
function sgInteract() {
  if (sg.bt || sg.moving) return;
  const s = sgS(), [dx, dy] = SG_DIRS[s.dir], fx = s.x + dx, fy = s.y + dy, m = SG_MAPS[s.map];
  const o = sgObjAt(s.map, fx, fy); if (o) return sgUseObj(o);
  let n = sgNpcAt(s.map, fx, fy);
  if (!n && 'L=AJt'.includes(sgTile(s.map, fx, fy))) n = sgNpcAt(s.map, fx + dx, fy + dy);   // talk across the throne, the bar or the altar
  if (n) { n.dir && (sg.np[s.map + ':' + n.id] = { ...(sg.np[s.map + ':' + n.id] || { x: n.x, y: n.y }), dir: { up: 'down', down: 'up', left: 'right', right: 'left' }[s.dir] }); return sgTalk(n); }
  if (m.doors?.[fx + ',' + fy]) return sgDoor(m.doors[fx + ',' + fy]);
  if (sgTile(s.map, fx, fy) === 'Z') return sgOracle();
  if (typeof sgInteractMore === 'function' && sgInteractMore(fx, fy)) return;
  if (sgTile(s.map, fx, fy) === 'z') return sgShrine();
  if (m.signs?.[fx + ',' + fy]) return sgSay(`🪧 ${esc(m.signs[fx + ',' + fy])}`);
}
function sgTalk(n) {
  const s = sgS();
  if (typeof sgTalkFirst === 'function' && sgTalkFirst(n)) return;
  if (n.king) {
    if (s.flags.allshards && !s.flags.keyquest) { s.flags.keyquest = 1; sg.session.nuts += 5; sgSaveNow(true); return sgSay(SG_STORY.kingKeys(esc(s.name)), () => sgJingle('sg_fanfare')); }
    if (s.flags.keyquest) return sgSay(SG_STORY.kingKeysAgain());
    if (s.flags.shard) { if (!s.flags.kingDone) { s.flags.kingDone = 1; sg.session.nuts += 5; sgSaveNow(true); return sgSay(SG_STORY.kingDone(esc(s.name)), () => sgJingle('sg_fanfare')); } return sgSay(SG_STORY.kingAfter); }
    if (!s.flags.king) { s.flags.king = 1; s.gold += 120; s.bag.herb = (s.bag.herb || 0) + 3; sgSaveNow(true); return sgSay(SG_STORY.kingFirst(esc(s.name))); }
    return sgSay(SG_STORY.kingAgain);
  }
  if (n.queen) {
    if (s.flags.shard2) { if (!s.flags.ship) { s.flags.ship = 1; sg.session.nuts += 5; sgSaveNow(true); return sgSay(SG_STORY.queenShip(esc(s.name)), () => sgJingle('sg_fanfare')); } return sgSay(SG_STORY.queenAfter); }
    if (!s.flags.queen) { s.flags.queen = 1; s.gold += 300; sgSaveNow(true); return sgSay(SG_STORY.queenFirst(esc(s.name))); }
    return sgSay(s.flags.tide ? SG_STORY.queenCharm : SG_STORY.queenAgain);
  }
  if (n.priest) return sgPriest(n);
  if (n.merchant) return sgSay(n.lines || [], () => sgShop(n.merchant, 'items'));
  if (n.merchantGear) return sgSay(n.lines || [], () => sgShop(n.merchantGear, 'gear'));
  if (n.barkeep) return sgBarkeep(n);
  if (n.hire) return sgHire(n);
  if (n.archmage) {
    if (s.flags.crystal && !s.flags.wayfare) { s.flags.wayfare = 1; sg.session.nuts += 5; sgSaveNow(true); return sgSay(SG_STORY.archmageWayfare(esc(s.name)), () => sgJingle('sg_level')); }
    if (s.flags.wayfare) return sgSay(SG_STORY.archmageAfter);
    if (!s.flags.archmage) { s.flags.archmage = 1; sgSaveNow(true); return sgSay(SG_STORY.archmageFirst(esc(s.name))); }
    return sgSay(SG_STORY.archmageAgain);
  }
  if (n.join === 'scribe') {
    if (!s.flags.king) return sgSay(SG_STORY.tamsin.before);
    return sgSay(SG_STORY.tamsin.join(esc(s.name)), () => { sgJoin('scribe'); });
  }
  if (typeof sgTalkMore === 'function' && sgTalkMore(n)) return;
  if (n.chat) return sgSay(`${esc(n.name || 'Townsperson')}: ${SG_CHAT[Math.floor(Math.random() * SG_CHAT.length)]}`);
  if (n.lines) return sgSay(n.lines);
}
function sgJoin(key) {
  const s = sgS(); if (s.party.some(h => h.key === key) || s.bench.some(h => h.key === key)) return;
  const lead = s.party[0], h = sgHero(key, SG_NAMES[key]); h.st = {};
  while (h.lv < Math.max(1, lead.lv - 1)) { h.lv++; } h.hp = sgMax(h, 'hp'); h.mp = sgMax(h, 'mp');
  const kit = SG_START_GEAR[key]; if (kit) { const [w, a] = kit[lead.lv >= 18 ? 2 : lead.lv >= 9 ? 1 : 0]; h.gear = { weapon: w, armor: a }; }
  s.met[key] = 1;
  if (s.party.length >= SG_PARTY_MAX && typeof sgJoinFull === 'function') return sgJoinFull(h);
  if (s.party.length >= SG_PARTY_MAX) { s.bench.push(h); sgJingle('sg_level'); sgSaveNow(true); return sgSay(`Your party is full, so ${esc(h.name)} will wait at the tavern. Talk to any barkeep to change who travels with you.`); }
  s.party.push(h); sgJingle('sg_level'); sgSaveNow(true);
}
/* ⛪ priests: wake the fallen, cure poison and curses, sell holy water, and pray (save) */
function sgPriest(n, sel = 0) {
  const s = sgS(), fallen = s.party.filter(h => h.hp <= 0), sick = s.party.filter(h => h.hp > 0 && (h.st?.poison || h.st?.curse)), who = esc(n.name || 'The priest');
  const cureFee = sick.length * 10, inChurch = SG_MAPS[s.map].inside;
  sgMenu(`⛪ ${who}: “Bless you, child. How may I help?” · 💰 ${s.gold}`, [
    { label: '🙏 Pray', sub: inChurch ? 'Your journey is written down (saved) and you feel at peace.' : 'Ask for a blessing on the road.', fn: () => { sgSaveNow(true); sg.flash = 12; sgSay([`${who}: May the first words guide your steps.`, inChurch ? '📜 Your journey is saved.' : '✨ You feel calmer.'], () => sgPriest(n, 0)); } },
    ...fallen.map(h => { const fee = 10 * h.lv; return { label: `🕯️ Revive ${esc(h.name)} (${fee} gold)`, disabled: s.gold < fee, fn: () => { s.gold -= fee; h.hp = sgMax(h, 'hp'); h.st = {}; sg.flash = 16; sgSaveNow(true); sgSay(`✨ ${esc(h.name)} opens their eyes. Welcome back!`, () => sgPriest(n, 1)); } }; }),
    { label: `✨ Cure poison and curses${sick.length ? ` (${cureFee} gold)` : ''}`, sub: sick.length ? sick.map(h => `${esc(h.name)} ${sgStIcons(h)}`).join(', ') : 'Nobody needs it right now.', disabled: !sick.length || s.gold < cureFee,
      fn: () => { s.gold -= cureFee; for (const h of sick) h.st = {}; sg.flash = 16; sgSaveNow(true); sgSay(`${who} lays a hand on each of you. ✨ Everyone is cured!`, () => sgPriest(n, 2)); } },
    { label: `💧 Holy water (40 gold) · you have ${s.bag.holywater || 0}`, sub: 'Lifts a curse. Only priests have it.', disabled: s.gold < 40, fn: () => { s.gold -= 40; s.bag.holywater = (s.bag.holywater || 0) + 1; sgSaveNow(true); sgSay(`${who}: Here, blessed this morning. 💧`, () => sgPriest(n, 3)); } },
    { label: 'Leave', fn: () => sgSay(`${who}: Go in peace.`) }], () => {}, { sel });
}
/* 🛕 wayside shrines heal everyone, wake the fallen and cure poison and curses */
function sgShrine() {
  const s = sgS();
  sgSay(['You kneel at the old stone shrine and pray…', '✨ A warm light washes over the party.'], () => {
    for (const h of s.party) { if (h.hp <= 0) h.hp = 1; h.hp = sgMax(h, 'hp'); h.st = {}; }
    sg.flash = 22; sgJingle('sg_inn'); sgSaveNow(true); sgSay('Everyone is healed, the fallen stand up again, and every curse and poison is gone!', typeof sgShrineMore === 'function' ? sgShrineMore : null);
  });
}
/* 🍺 barkeeps: rumors (what to do next), stew, and who travels with you */
function sgBarkeep(n, sel = 0) {
  const s = sgS(), stew = 6 + 2 * s.party[0].lv;
  sgMenu(`🍺 ${esc(n.name || 'Barkeep')}: “What’ll it be, traveler?” · 💰 ${s.gold}`, [
    { label: '👂 Any rumors?', fn: () => sgSay(`${esc(n.name || 'Barkeep')}: ${sgHint(s)}`, () => sgBarkeep(n, 0)) },
    { label: `🍲 Hearty stew for everyone (${stew} gold)`, sub: 'Restores half of everyone’s HP.', disabled: s.gold < stew, fn: () => { s.gold -= stew; for (const h of sgAlive()) h.hp = Math.min(sgMax(h, 'hp'), h.hp + Math.ceil(sgMax(h, 'hp') / 2)); sgSaveNow(true); sgSay('Mmm! Hot, salty and full of beans. Everyone feels stronger. 🍲', () => sgBarkeep(n, 1)); } },
    { label: '👥 Change who travels with me', sub: s.bench.length ? `${s.bench.length} waiting here: ${s.bench.map(h => esc(h.name)).join(', ')}` : 'Nobody is waiting at the tavern.', disabled: !s.bench.length, fn: () => sgRoster(n) },
    { label: 'Leave', fn: () => sgSay(`${esc(n.name || 'Barkeep')}: Come back soon!`) }], () => {}, { sel });
}
function sgRoster(n) {
  const s = sgS(), lead = s.party[0];
  const train = h => { while (h.lv < lead.lv - 2) { const oh = sgMax(h, 'hp'), om = sgMax(h, 'mp'); h.lv++; h.hp += sgMax(h, 'hp') - oh; h.mp += sgMax(h, 'mp') - om; } };
  sgMenu(`👥 Who travels with you? (${SG_PARTY_MAX} at most) · pick someone to swap`, [
    ...s.party.map((h, i) => ({ label: `🚶 ${sgHeroLine(h)}`, sub: i === 0 ? 'The leader always travels.' : 'Travels with you. Pick to send to the tavern.', disabled: i === 0 || (!s.bench.length && s.party.length <= 1), fn: () => {
      s.party.splice(i, 1); s.bench.push(h); sgSaveNow(true); sgSay(`${esc(h.name)} sits down by the fire to wait.`, () => sgRoster(n)); } })),
    ...s.bench.map((h, i) => ({ label: `🪑 ${sgHeroLine(h)}`, sub: s.party.length >= SG_PARTY_MAX ? 'Waiting. Your party is full: send someone to the tavern first.' : 'Waiting here. Pick to bring along.', disabled: s.party.length >= SG_PARTY_MAX, fn: () => {
      s.bench.splice(i, 1); train(h); s.party.push(h); sgSaveNow(true); sgSay(`${esc(h.name)} joins the party again!${h.lv >= lead.lv - 2 ? '' : ''}`, () => sgRoster(n)); } }))], () => sgBarkeep(n, 2), { big: true });
}
function sgHire(n) {
  const s = sgS(), H = SG_HEROES[n.hire], name = SG_NAMES[n.hire];
  sgSay([`${name} the ${H.cls}: ${{ ranger: 'Need a sharp eye and a steady bow? I never miss. Well. Hardly ever.', rogue: 'Locks, pockets, shadows. I’m good with all three.', monk: 'I can heal wounds and lift poisons and curses with my hands.', paladin: 'My shield and my light are yours, if your cause is just.', druid: 'The forests are sick, and so is the world. I can heal you, and the earth itself will fight beside us.', alchemist: 'Fire flasks, healing tonics, and only a few explosions a week. Interested?' }[n.hire] || 'I could join you.'}`,
    `${name}: ${n.cost} gold, and I’m yours for the whole journey.`], () => sgMenu(`Hire ${name} the ${H.cls} for ${n.cost} gold? · 💰 ${s.gold}`, [
    { label: `${H.icon} Hire ${name} (${n.cost} gold)`, disabled: s.gold < n.cost, fn: () => { s.gold -= n.cost; sgSay(`${H.icon} <b>${name} the ${H.cls}</b> joined the party!`, () => sgJoin(n.hire)); } },
    { label: 'Not now', fn: () => sgSay(`${name}: Suit yourself. I’ll be here.`) }], () => {}));
}
/* 🧩 Castle puzzles */
function sgLeverState(id) { return !!sgS().flags['lv:' + id]; }
function sgUseLever(o) {
  const s = sgS(), m = SG_MAPS[s.map], gate = Object.values(m.gates || {})[0];
  if (gate && s.flags[gate]) return sgSay('The levers are stuck fast now. The gate is open.');
  const row = sgObjs(s.map).filter(x => x.type === 'lever' && x.group === o.group).sort((a, b) => a.x - b.x), i = row.indexOf(o);
  // every lever also flips the one beside it (the middle lever flips both neighbors)
  const flip = i === 0 ? [0, 1] : i === row.length - 1 ? [i - 1, i] : [i - 1, i, i + 1];
  for (const j of flip) s.flags['lv:' + row[j].id] = s.flags['lv:' + row[j].id] ? 0 : 1;
  sg.shake = 3; trSound('bump');
  const states = row.map(x => sgLeverState(x.id)), solved = states.join() === [true, false, true].join();
  const lines = [SG_STORY.lever(o.label, sgLeverState(o.id)), `Flames now: ${row.map(x => `${x.label} ${sgLeverState(x.id) ? '🔥' : '·'}`).join('  ')}`];
  if (solved && gate) { s.flags[gate] = 1; sg.flash = 16; sgJingle('sg_level'); sgSaveNow(true); return sgSay([...lines, ...SG_STORY.leverDone]); }
  sgSaveNow(true); sgSay(lines);
}
function sgPlate(o) {
  const s = sgS(), m = SG_MAPS[s.map], gate = Object.values(m.gates || {})[0];
  if (!gate || s.flags[gate]) return;
  const seq = (sg.plates ||= []), want = seq.length;
  if (seq.includes(o.id)) return;
  if (o.order !== want) { sg.plates = []; sg.held = null; sg.shake = 8; trSound('bump'); return sgSay([`You step on the ${o.symbol} plate…`, ...SG_STORY.plateBad]); }
  seq.push(o.id); trSound('hop');
  const total = sgObjs(s.map).filter(x => x.type === 'plate' && x.group === o.group).length;
  if (seq.length === total) { s.flags[gate] = 1; sg.plates = []; sg.held = null; sg.flash = 16; sgJingle('sg_level'); sgSaveNow(true); return sgSay(SG_STORY.plateDone); }
  sg.held = null; sgSay(`${o.symbol} ${SG_STORY.plateGood}`);
}
function sgUseStatue(o) {
  const s = sgS(), m = SG_MAPS[s.map], gate = Object.values(m.gates || {})[0];
  if (s.flags['st:' + o.id]) return sgSay(`🗿 ${esc(o.name)} glows softly. It has heard your true words.`);
  sgSay(SG_STORY.statueAsk(esc(o.name)), () => sgAsk(`🗿 ${esc(o.name)}: what does this mean?`, grade => {
    if (grade === 'wrong') return sgSay(SG_STORY.statueBad(esc(o.name)));
    s.flags['st:' + o.id] = 1; sgSaveNow(true);
    const all = sgObjs(s.map).filter(x => x.type === 'statue' && x.group === o.group).every(x => s.flags['st:' + x.id]);
    if (all && gate) { s.flags[gate] = 1; sg.flash = 16; sgJingle('sg_level'); sgSaveNow(true); return sgSay([SG_STORY.statueGood(esc(o.name)), ...SG_STORY.statueDone]); }
    sgSay(SG_STORY.statueGood(esc(o.name)));
  }));
}
function sgUseObj(o) {
  const s = sgS();
  if (typeof sgUseObjMore === 'function' && sgUseObjMore(o)) return;
  if (o.type === 'lever') return sgUseLever(o);
  if (o.type === 'plaque') return sgSay(o.lines);
  if (o.type === 'colorChest') return sgUseColorChest(o);
  if (o.type === 'statue') return sgUseStatue(o);
  if (o.type === 'chest' || o.type === 'lockChest') {
    if (s.got[o.id]) return sgSay('The chest is empty.');
    if (o.guard && !s.beaten[o.guard]) return sgSay(`${SG_MONSTERS[o.guard].name} guards this chest.`);
    const open = () => { s.got[o.id] = 1; const lines = sgGive(o.give); sgSaveNow(true); if (o.tier === 'epic' || o.tier === 'rare') sgJingle('sg_fanfare');
      sgSay([o.tier ? { common: 'You opened the chest!', uncommon: 'You opened the chest! ✨', rare: '🌟 A rare treasure chest!', epic: '👑 An EPIC treasure chest!' }[o.tier] : `You opened the chest!`, ...lines], o.story ? () => { const t = SG_STORY[o.story]; sgSay(typeof t === 'function' ? t(esc(s.name)) : t, o.story === 'lexicon' ? () => sgJingle('sg_fanfare') : null); } : null); };
    if (o.type === 'lockChest') return sgSay('A word-lock seals this chest. Spell the word to open it!', () => sgAskSpell('🔒 Word-lock: spell this word', g => g === 'wrong' ? sgSay('The lock stays shut. Try again!') : open()));
    return open();
  }
  if (o.type === 'npc' && o.join === 'cantor') {
    if (!s.beaten.h1guard) return sgSay('A woman in green calls out: “Watch out! The books!”');
    return sgSay(SG_STORY.lyra.join(esc(s.name)), () => sgJoin('cantor'));
  }
  if (o.type === 'foeSpot') return sgSay(o.lines || ['Monsters attack!'], () => sgBattle(o.group, { fixed: o.id }));
  if (o.type === 'boss') return sgSay(SG_STORY[o.story] || SG_STORY.bossIntro, () => sgBattle(o.group, { fixed: o.id, boss: true, story: o.story }));
  if (o.type === 'seal') return sgSeal(o);
}
function sgOracle() {
  const s = sgS();
  if (s.flags.oracle) return sgSay(SG_STORY.oracleAfter);
  s.flags.oracle = 1; s.gearBag.starwand = (s.gearBag.starwand || 0) + 1; s.gold += 1000; sg.session.nuts += 5; sgSaveNow(true);
  sgSay(SG_STORY.oracle(esc(s.name)), () => sgJingle('sg_fanfare'));
}
function sgSage() {
  const s = sgS();
  if (s.flags.tide) return sgSay(SG_STORY.sageAfter);
  if (!s.flags.queen) return sgSay(SG_STORY.sageNo);
  let right = 0, n = 0;
  const next = () => {
    if (n === 3) { if (right >= 2) { s.flags.tide = 1; sgSaveNow(true); sgJingle('sg_level'); return sgSay(SG_STORY.sageWin); } return sgSay([`You spelled ${right} of 3.`, ...SG_STORY.sageLose]); }
    n++; sgAskSpell(`📜 Sage Orrin’s trial · word ${n} of 3`, g => { if (g !== 'wrong') right++; sgSay(g === 'wrong' ? 'Sage Orrin: Hmm, no.' : 'Sage Orrin: Good!', next); });
  };
  sgSay(SG_STORY.sageTrial, next);
}
function sgSeal(o) {
  const s = sgS();
  sgSay('A glowing rune seals the stairs. It whispers a meaning… spell the word to break it!', () => sgAskSpell('🌀 Rune seal: spell this word', g => {
    if (g === 'wrong') return sgSay('The rune flickers but holds. Try again!');
    s.flags[o.id] = 1; sgSaveNow(true); const m = SG_MAPS[s.map]; sgSay('The rune shatters! The stairs are open. ✨', () => sgWarp(m.downTo, SG_MAPS[m.downTo].start.x, SG_MAPS[m.downTo].start.y, 'up'));
  }));
}
function sgGive(give) {
  const s = sgS(), out = [];
  for (const [k, v] of Object.entries(give)) {
    if (k === 'gold') { s.gold += v; out.push(`💰 You found <b>${v} gold</b>!`); }
    else if (k === 'gear') { s.gearBag[v] = (s.gearBag[v] || 0) + 1; out.push(`⚔️ You found a <b>${SG_GEAR[v].name}</b>! Equip it from the menu.`); }
    else if (k === 'shard') { s.flags[v > 1 ? 'shard' + v : 'shard'] = 1; }
    else if (k === 'flag') { s.flags[v] = 1; }
    else if (k === 'ckey') out.push(...sgGiveKey(v));
    else { s.bag[k] = (s.bag[k] || 0) + v; out.push(`${SG_ITEMS[k].icon} You found <b>${v > 1 ? v + ' × ' : ''}${SG_ITEMS[k].name}</b>!`); }
  }
  return out;
}

/* ---------- Town services ---------- */
function sgDoor(kind) {
  if (typeof sgDoorMore === 'function' && sgDoorMore(kind)) return;
  const s = sgS();
  const m = SG_MAPS[s.map];
  if (kind === 'sage') return sgSage();
  if (kind === 'jail') { const id = s.map + '_jail', r = SG_MAPS[id]; if (r) return sgWarp(id, r.entry.x, r.entry.y, 'up'); }
  if (kind === 'tavern' || kind === 'church') { const id = m[kind], r = SG_MAPS[id]; if (r) return sgWarp(id, r.entry.x, r.entry.y, 'up'); }
  if (kind === 'inn') {
    const cost = m.inn || 10;
    return sgMenu(`🛏️ Inn: “A warm bed is ${cost} gold for the whole party.” · 💰 ${s.gold}`, [
      { label: `Stay the night (${cost} gold)`, disabled: s.gold < cost, fn: () => { s.gold -= cost; if (typeof sgMorning === 'function') sgMorning(); const cursed = s.party.some(h => h.hp > 0 && h.st?.curse); for (const h of s.party) { if (h.hp > 0) { h.hp = sgMax(h, 'hp'); h.mp = sgMax(h, 'mp'); if (h.st) delete h.st.poison; } } sgSaveNow(true); sg.flash = 20; sgJingle('sg_inn');
        sgSay(['Good night…', '☀️ Good morning! Everyone is rested, and the poison is gone.', ...(s.party.some(h => h.hp <= 0) ? ['Innkeeper: Your fallen friend needs a priest. Try the church.'] : []), ...(cursed ? ['Innkeeper: That curse won’t sleep off. A priest or Holy water will lift it.'] : [])]); } },
      { label: 'No thanks', fn: () => sgSay('Come back any time!') }], () => {});
  }
  if (kind === 'shop') return sgShop(m.shop || ['herb', 'bigherb', 'ether', 'feather', 'phoenix'], 'items');
  if (kind === 'smith') return sgShop(m.smith || ['copper', 'iron', 'quill', 'willow', 'leather', 'chain', 'robe'], 'gear');
  if (kind === 'chronicle') {
    const fallen = s.party.filter(h => h.hp <= 0);
    return sgMenu('📜 Chronicle House: “Shall I write down your journey?”', [
      { label: '💾 Record my journey (save)', fn: () => sgSaveNow() },
      ...fallen.map(h => { const fee = 15 * h.lv; return { label: `🕯️ Wake ${esc(h.name)} (${fee} gold)`, disabled: s.gold < fee, fn: () => { s.gold -= fee; h.hp = sgMax(h, 'hp'); sgSaveNow(true); sgSay(`${esc(h.name)} opens their eyes. Welcome back!`); } }; }),
      { label: 'Leave', fn: () => sgSay('May your story be long and kind.') }], () => {});
  }
}
function sgShop(list, kind, sel = 0) {
  const s = sgS();
  sgMenu(`${kind === 'gear' ? '⚒️ Smithy' : '🧺 Item shop'} · 💰 ${s.gold} gold`, [...list.map(k => {
    const it = kind === 'gear' ? SG_GEAR[k] : SG_ITEMS[k], have = kind === 'gear' ? (s.gearBag[k] || 0) + s.party.filter(h => Object.values(h.gear).includes(k)).length : s.bag[k] || 0;
    const sub = kind === 'gear' ? `${it.atk ? `Attack +${it.atk} ` : ''}${it.def ? `Defense +${it.def} ` : ''}${it.mag ? `Magic +${it.mag} ` : ''}· for ${it.for.map(w => SG_HEROES[w].cls).join(', ')} · you have ${have}` : `${it.desc} You have ${have}.`;
    return { label: `${kind === 'gear' ? '⚔️' : it.icon} ${it.name} · ${it.price} gold`, sub, disabled: s.gold < it.price, fn: () => {
      s.gold -= it.price; if (kind === 'gear') s.gearBag[k] = (s.gearBag[k] || 0) + 1; else s.bag[k] = (s.bag[k] || 0) + 1;
      sgSaveNow(true); sgSay(`You bought a ${it.name}!${kind === 'gear' ? ' Equip it from the menu → Equipment.' : ''}`, () => sgShop(list, kind, list.indexOf(k)));
    } };
  }), ...(kind === 'items' && sgTreasures().length ? [{ label: `💰 Sell treasures (${sgTreasures().reduce((a, [, n]) => a + n, 0)})`, sub: 'Sea glass, pearls, crowns… turn them into gold.', fn: () => sgSellMenu(list, kind) }] : []),
    { label: 'Leave', fn: () => sgSay('Thank you, come again!') }], () => {}, { sel });
}
const sgTreasures = () => Object.entries(sgS().bag).filter(([k, n]) => n > 0 && SG_ITEMS[k]?.treasure);
function sgSellMenu(list, kind, sel = 0) {
  const s = sgS(), items = sgTreasures().map(([k, n]) => { const it = SG_ITEMS[k]; return { label: `${it.icon} ${it.name} ×${n} · ${it.sell} gold each`, sub: n > 1 ? `Sells one. All ${n} are worth ${it.sell * n} gold.` : it.desc,
    fn: () => { s.bag[k]--; s.gold += it.sell; sgSaveNow(true); trSound('hop'); sgSay(`You sold the ${it.name} for 💰 ${it.sell} gold.`, () => sgTreasures().length ? sgSellMenu(list, kind, sel) : sgShop(list, kind)); } }; });
  const total = sgTreasures().reduce((a, [k, n]) => a + SG_ITEMS[k].sell * n, 0);
  sgMenu(`💰 Sell treasures · you have 💰 ${s.gold} gold`, [...items,
    { label: `💰 Sell everything (${total} gold)`, fn: () => { for (const [k, n] of sgTreasures()) { s.gold += SG_ITEMS[k].sell * n; s.bag[k] = 0; } sgSaveNow(true); sgJingle('sg_level'); sgSay(`Sold! 💰 +${total} gold.`, () => sgShop(list, kind)); } }],
    () => sgShop(list, kind), { sel, big: true });
}

/* ---------- Menu ---------- */
const sgHeroLine = h => `${SG_HEROES[h.key].icon} <b>${esc(h.name)}</b> Lv ${h.lv} · ❤️ ${h.hp}/${sgMax(h, 'hp')} · 💧 ${h.mp}/${sgMax(h, 'mp')}${h.hp <= 0 ? ' · 💤 fallen' : ''}${h.hp > 0 && h.st?.poison ? ' · ☠️ poisoned' : ''}${h.hp > 0 && h.st?.curse ? ' · 🌑 cursed' : ''}`;
function sgMainMenu() {
  const s = sgS();
  sgMenu(`📍 <b>${esc(SG_MAPS[s.map].name)}</b><br><small>${typeof sgClockLabel === 'function' ? sgClockLabel() + ' · ' : ''}💰 ${s.gold} gold · ${s.party.map(h => `${SG_HEROES[h.key].icon} ${esc(h.name)} Lv${h.lv}`).join(' · ')}</small>`, [
    { label: '👥 Party', fn: () => sgPartyMenu() }, { label: '✨ Spells', fn: () => sgFieldSpells() },
    { label: '🎒 Items', fn: () => sgItemMenu(false) }, { label: '⚔️ Equipment', fn: () => sgEquipMenu() },
    { label: '🗺️ Map', fn: () => sgMapOpen('world') }, ...(s.flags.wayfare ? [{ label: '🌀 Wayfare', fn: () => sgWayfare(() => sgMainMenu()) }] : []),
    ...(typeof sgMainMenuMore === 'function' ? sgMainMenuMore() : []),
    { label: '💾 Save', fn: () => sgSaveNow() }, { label: '📂 Load game', fn: () => sgLoadMenu() },
    { label: '⚙️ Options', fn: () => sgOptions() }, { label: '🚪 Save and leave', fn: () => sgQuit() }], () => {}, { cols: 2 });
}
function sgOptions(sel = 0) {
  sgMenu('⚙️ Options', [
    { label: `🖍️ Screen colors: ${sgPalette()[1]}`, sub: 'Full color, or a classic 4-color handheld screen.', fn: () => sgPaletteMenu() },
    { label: '🎨 Console color', sub: 'Pick the color of the handheld.', fn: () => trShellMenu((t, it, bk, sl) => sgMenu(t, it, bk, { sel: sl }), () => sgOptions(1)) },
    { label: `⏱️ Answer timer: ${sgTimeLimit() ? sgTimeLimit() + ' seconds' : 'off'}`, sub: 'How long the word meter lasts in battle. Run out and you miss!', fn: () => sgTimerMenu() },
    { label: `🌐 Game language: ${sgLangLabel()}`, sub: 'Play the game’s words in the language you are learning.', fn: () => sgLangMenu() },
    ...(typeof sgOptionsMore === 'function' ? sgOptionsMore() : [])], () => sgMainMenu(), { sel });
}
function sgTimerMenu() {
  const cur = sgTimeLimit();
  sgMenu('⏱️ Answer timer · how long the word meter lasts', SG_TIMES.map(t => ({ label: `${t === cur ? '✅ ' : ''}${t ? t + ' seconds' : 'Off (no time limit)'}`, sub: t === 6 ? 'The usual.' : t === 0 ? 'No misses for slow answers. Speed still adds damage.' : '', fn: () => { S.settings.sgTime = t; save(); sgTimerMenu(); } })), () => sgOptions(2), { sel: SG_TIMES.indexOf(cur) });
}
/* 📂 load another slot without leaving the game */
function sgLoadMenu() {
  const slots = sgSlots(), cur = S.sagaSlot || 'a';
  sgMenu('📂 Load game · your journey here is saved first', ['a', 'b', 'c'].map(k => { const v = slots[k]; return {
    label: `Slot ${k.toUpperCase()}${k === cur ? ' · playing now' : ''}`, sub: v ? `${esc(v.name)} · 📍 ${esc(SG_MAPS[v.map]?.name || '')} · 💰 ${v.gold} · ${v.party.map(h => `${SG_HEROES[h.key]?.icon || ''} Lv${h.lv}`).join(' ')}${v.savedAt ? ` · saved ${new Date(v.savedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` : ''}` : 'Empty',
    disabled: !v || k === cur, fn: () => sgLoadSlot(k) }; }), () => sgMainMenu());
}
function sgLoadSlot(k) {
  sgSaveNow(true);
  const old = sg; if (old.loop) cancelAnimationFrame(old.loop); old.loop = 0;
  S.sagaSlot = k; save();
  startSaga(old.deckId); sg.session = old.session;
  setTimeout(() => sg && !sg.ui && sgSay(`📂 Loaded slot ${k.toUpperCase()}. Welcome back, ${esc(sgS().name)}!`), 350);
}
/* 🌀 Wayfare: fly to any town you have visited (taught by the Archmage near the end) */
function sgWayfare(back) {
  if (typeof sgJailed === 'function' && sgJailed()) return sgSay('👮 Jailer: No magic tricks in my jail!');
  const s = sgS(), caster = s.party.filter(h => h.hp > 0).sort((a, b) => b.mp - a.mp)[0], cost = 4;
  const towns = Object.entries(SG_MAPS).filter(([id, m]) => m.town && s.seen?.[id]);
  sgMenu(`🌀 Wayfare · ${caster ? `${esc(caster.name)} casts it (${cost} MP, has ${caster.mp})` : 'nobody can cast'} · pick a town`, towns.map(([id, m]) => ({
    label: `🏘️ ${esc(m.name)}${id === s.map ? ' · you are here' : ''}`, sub: SG_TOWN_REGION[sgMapRoot(id).map] || '', disabled: !caster || caster.mp < cost || id === s.map,
    fn: () => { caster.mp -= cost; const root = sgMapRoot(id).map, hb = SG_HARBOR[root] || SG_HARBOR.seravel; if (s.flags.ship) { s.shipMap = hb.map; s.shipAt = hb.at; }
      sgSay([`${esc(caster.name)} draws a glowing circle in the air… 🌀`, `Whoosh! The party flies to ${esc(m.name)}!`], () => sgWarp(id, m.home.x, m.home.y, 'down')); } })), back, { big: true });
}
const SG_TOWN_REGION = { field: 'Kingdom of Aldermere', seravel: 'Kingdom of Seravel', eastsea: 'The Eastern Isles', ...(typeof SG_TOWN_REGION_MORE !== 'undefined' ? SG_TOWN_REGION_MORE : {}) };

function sgPartyMenu() {
  const s = sgS();
  sgMenu('👥 Party', s.party.map(h => ({ label: sgHeroLine(h), sub: `${SG_HEROES[h.key].cls} · ⚔️ ${sgStat(h, 'atk')} · 🛡️ ${sgStat(h, 'def')} · 💨 ${sgStat(h, 'agi')} · 🔮 ${sgStat(h, 'mag')} · next level in ${sgNeed(h.lv) - h.xp} XP<br>${SG_GEAR[h.gear.weapon]?.name || 'No weapon'} · ${SG_GEAR[h.gear.armor]?.name || 'No armor'} · Spells: ${sgSpellsOf(h).map(k => SG_SPELLS[k].name).join(', ') || 'none yet'}`, fn: () => sgPartyMenu() })), () => sgMainMenu(), { big: true });
}
function sgFieldSpells() {
  const s = sgS(), items = [];
  if (s.flags.wayfare) items.push({ label: '🌀 <b>Wayfare</b> · 4 MP', sub: 'Fly to any town you have visited.', fn: () => sgWayfare(() => sgFieldSpells()) });
  for (const h of s.party) for (const k of sgSpellsOf(h)) { const sp = SG_SPELLS[k]; if (!['heal', 'healAll', 'revive', 'cure', 'cureAll'].includes(sp.kind)) continue;
    items.push({ label: `${SG_HEROES[h.key].icon} ${esc(h.name)}: <b>${sp.name}</b> · ${sp.mp} MP`, sub: sp.desc, disabled: h.hp <= 0 || h.mp < sp.mp, fn: () => sgFieldCast(h, k) }); }
  if (!items.length) items.push({ label: 'No healing spells yet. Lyra the Cantor knows some!', disabled: true, fn: () => {} });
  sgMenu('✨ Spells you can use here', items, () => sgMainMenu());
}
function sgFieldCast(h, k) {
  const s = sgS(), sp = SG_SPELLS[k];
  if (sp.kind === 'healAll') { h.mp -= sp.mp; for (const a of sgAlive()) a.hp = Math.min(sgMax(a, 'hp'), a.hp + sgHealAmt(h, sp)); sgSaveNow(true); return sgSay(`${esc(h.name)} sings ${sp.name}. Everyone feels better! 🎶`, sgFieldSpells); }
  if (sp.kind === 'cureAll') { h.mp -= sp.mp; for (const a of sgAlive()) a.st = {}; sgSaveNow(true); return sgSay(`${esc(h.name)} casts ${sp.name}. Every poison and curse is lifted! ✨`, sgFieldSpells); }
  sgMenu(`${sp.name} on…`, s.party.map(t => ({ label: sgHeroLine(t), disabled: sp.kind === 'revive' ? t.hp > 0 : sp.kind === 'cure' ? t.hp <= 0 || !(t.st?.poison || t.st?.curse) : t.hp <= 0 || t.hp >= sgMax(t, 'hp'), fn: () => {
    h.mp -= sp.mp;
    if (sp.kind === 'revive') t.hp = Math.ceil(sgMax(t, 'hp') / 2); else if (sp.kind === 'cure') t.st = {}; else t.hp = Math.min(sgMax(t, 'hp'), t.hp + sgHealAmt(h, sp));
    sgSaveNow(true); sgSay(`${esc(h.name)} casts ${sp.name}. ${esc(t.name)} ${sp.kind === 'revive' ? 'is back on their feet!' : sp.kind === 'cure' ? 'is cured!' : 'feels much better!'}`, sgFieldSpells);
  } })), () => sgFieldSpells());
}
function sgItemMenu(inBattle, user) {
  const s = sgS(), items = Object.entries(s.bag).filter(([k, n]) => n > 0 && SG_ITEMS[k] && !(inBattle && SG_ITEMS[k].treasure)).map(([k, n]) => ({ label: `${SG_ITEMS[k].icon} ${SG_ITEMS[k].name} ×${n}`, sub: SG_ITEMS[k].desc,
    disabled: inBattle && k === 'feather', fn: () => SG_ITEMS[k].treasure ? sgSay(`${SG_ITEMS[k].icon} ${SG_ITEMS[k].desc} Sell it at any item shop.`, () => sgItemMenu(false)) : k === 'feather' ? sgFeather() : sgItemTarget(k, inBattle, user) }));
  if (!items.length) items.push({ label: 'Your bag is empty. The item shop in Quillhaven sells herbs.', disabled: true, fn: () => {} });
  if (!inBattle) items.push({ label: '🔑 Key items', sub: sgKeyItems() || 'None yet.', disabled: true, fn: () => {} });
  sgMenu('🎒 Items', items, inBattle ? () => sgHeroTurn() : () => sgMainMenu());
}
function sgItemTarget(k, inBattle, user) {
  const s = sgS(), it = SG_ITEMS[k];
  sgMenu(`Use ${it.name} on…`, s.party.map(t => ({ label: sgHeroLine(t), disabled: it.revive ? t.hp > 0 : it.cure ? t.hp <= 0 || !t.st?.[it.cure] : t.hp <= 0 || (it.heal ? t.hp >= sgMax(t, 'hp') : t.mp >= sgMax(t, 'mp')), fn: () => {
    s.bag[k]--;
    let msg;
    if (it.cure) { delete t.st[it.cure]; msg = `${esc(t.name)} is ${it.cure === 'curse' ? 'free of the curse' : 'cured of poison'}! ${it.icon}`; }
    else if (it.revive) { t.hp = Math.ceil(sgMax(t, 'hp') * it.revive); msg = `${esc(t.name)} is back on their feet! ${it.icon}`; }
    else if (it.heal) { const b = t.hp; t.hp = Math.min(sgMax(t, 'hp'), t.hp + it.heal); msg = `${esc(t.name)} recovers ${t.hp - b} HP. ${it.icon}`; }
    else { const b = t.mp; t.mp = Math.min(sgMax(t, 'mp'), t.mp + it.mp); msg = `${esc(t.name)} recovers ${t.mp - b} MP. ${it.icon}`; }
    sgSaveNow(true); sgSay(msg, inBattle ? () => sgNextHero() : () => sgItemMenu(false));
  } })), () => sgItemMenu(inBattle, user));
}
const sgKeyItems = () => { const f = sgS().flags; return [f.shard && '💎 Lexicon Shard 1', f.shard2 && '💎 Lexicon Shard 2', f.allshards && '💎 All the Lexicon Shards', f.key1 && '🪶 Dawn Quill', f.key2 && '🫙 Dusk Inkwell', f.key3 && '⭐ Star Seal', f.tide && '🌊 Tide Charm', f.ship && '⛵ Quill Swan', f.crystal && '💠 Voice Crystal', f.wayfare && '🌀 Wayfare (spell)', f.lexicon && '📖 The whole Lexicon', ...(typeof sgColorKeyItems === 'function' ? sgColorKeyItems() : [])].filter(Boolean).join(' · '); };
function sgFeather() {
  const s = sgS();
  if (typeof sgJailed === 'function' && sgJailed()) return sgSay('👮 Jailer: No feathers in my jail! Hand it over… just kidding. But you’re staying.');
  s.bag.feather--; sgSay(['You toss the feather into the air… 🪶', 'A gust of wind carries the party home!'], () => { const h = SG_MAPS[s.home || 'town']; sgWarp(s.home || 'town', h.home.x, h.home.y, 'down'); });
}
function sgEquipMenu() {
  const s = sgS();
  sgMenu('⚔️ Equipment: pick a hero', s.party.map((h, i) => ({ label: `${SG_HEROES[h.key].icon} <b>${esc(h.name)}</b>`, sub: `Weapon: ${SG_GEAR[h.gear.weapon]?.name || 'none'} · Armor: ${SG_GEAR[h.gear.armor]?.name || 'none'}`, fn: () => sgEquipHero(i) })), () => sgMainMenu());
}
function sgEquipHero(i) {
  const s = sgS(), h = s.party[i], opts = [];
  for (const [k, n] of Object.entries(s.gearBag)) { const g = SG_GEAR[k]; if (!n || !g || !g.for.includes(h.key)) continue;
    const cur = SG_GEAR[h.gear[g.slot]], diff = st => (g[st] || 0) - (cur?.[st] || 0), d = ['atk', 'def', 'mag'].map(st => diff(st) ? `${{ atk: 'Attack', def: 'Defense', mag: 'Magic' }[st]} ${diff(st) > 0 ? '+' : ''}${diff(st)}` : '').filter(Boolean).join(' · ');
    opts.push({ label: `${g.slot === 'weapon' ? '⚔️' : '🛡️'} ${g.name}`, sub: d || 'Same as now', fn: () => { const old = h.gear[g.slot]; h.gear[g.slot] = k; s.gearBag[k]--; if (old) s.gearBag[old] = (s.gearBag[old] || 0) + 1; sgSaveNow(true); sgSay(`${esc(h.name)} equipped the ${g.name}!`, () => sgEquipHero(i)); } }); }
  if (!opts.length) opts.push({ label: 'Nothing new to equip. Visit the smithy or open chests!', disabled: true, fn: () => {} });
  sgMenu(`⚔️ ${esc(h.name)} · ${SG_GEAR[h.gear.weapon]?.name || 'no weapon'} · ${SG_GEAR[h.gear.armor]?.name || 'no armor'}`, opts, () => sgEquipMenu());
}
function sgQuit() { sgSaveNow(true); sgFinish(); go({ name: 'games', deckId: sg?.deckId || view.deckId }); }

/* ---------- 🗺️ Map: both kingdoms, or a close-up of this area ---------- */
const SG_OVERWORLDS = typeof SG_WORLD !== 'undefined' ? SG_WORLD.flat() : ['field', 'seravel', 'eastsea'];
const SG_PLACES = {
  field: { '5,16': ['Quillhaven', 'town'], '17,2': ['Hollow of Echoes', 'hollow1'], '22,5': ['Mountain pass', null], '21,12': ['Briarwick', 'briar'] },
  seravel: { '6,7': ['Mirage Well', 'well'], '17,12': ['Port Lumen', 'port'], '15,15': ['Sunken Archive', 'archive1'], '22,17': ['Isle shrine', null], '19,5': ['Royal dock', null], '4,17': ['Sandmere', 'sandmere'] },
  ...(typeof SG_PLACES_MORE !== 'undefined' ? SG_PLACES_MORE : {}),
  eastsea: { '5,11': ['Gullhaven', 'gull'], '12,4': ['Frosthold', 'frost'], '17,13': ['Lanternreach', 'lantern'], '24,20': ['Emberfall', 'emberfall'], '26,6': ['Last Light', 'lastlight'], '28,19': ['Ember Cave', 'ember1'], '31,4': ['Tower of Silence', 'tower1'] } };
if (typeof SG_PLACES_ADD !== 'undefined') for (const [k, v] of Object.entries(SG_PLACES_ADD)) Object.assign(SG_PLACES[k] ||= {}, v);
function sgMapRoot(map) {   // which overworld tile a town or dungeon floor sits on
  for (let guard = 0; guard < 6 && !SG_OVERWORLDS.includes(map); guard++) {
    const m = SG_MAPS[map];
    if (typeof m.upTo === 'string') { map = m.upTo; continue; }
    if (m.upTo) return { map: m.upTo.map, x: m.upTo.x, y: m.upTo.y };
    if (m.exitTo) { if (!SG_OVERWORLDS.includes(m.exitTo.map)) { map = m.exitTo.map; continue; } return { map: m.exitTo.map, x: m.exitTo.x, y: m.exitTo.y - (m.exitTo.dir === 'down' ? 1 : 0) }; }
    break;
  }
  const s = sgS(); return { map, x: s.x, y: s.y };
}
const SG_MAP_COL = c => ({ E: '#14101c', J: '#5a5a66', z: '#f4c542', I: '#2a1a40', g: '#2e7d32', N: '#5d6d7e', _: '#c8955a', O: '#6b4226', '=': '#8b5a2b', t: '#8b5a2b', b: '#a87440', p: '#6b4226', A: '#f6f6f0', G: '#7d3c98', '.': '#4caf50', f: '#1e6b35', h: '#81c784', M: '#7a6a58', W: '#2f6fd0', B: '#8b5a2b', P: '#d9b878', U: '#c0392b', V: '#3e2a1c', Y: '#c49a5a', d: '#e6c77a', k: '#2e8b4a', Q: '#8b5a2b', u: '#c0763a', Z: '#f5eef8',
  '#': '#666c75', n: '#a8a49c', e: '#b03a48', v: '#8b5a2b', q: '#c0392b', w: '#c9d3e0', a: '#2e8b4a', K: '#b03a48', L: '#f4c542', R: '#c0392b', H: '#f3e2c0', D: '#5e3a1a', S: '#8b5a2b', F: '#ff8fb1', T: '#1e6b35', X: '#2a1d12', C: '#7a5a3e', c: '#6d5038', '<': '#f6f6f0', '>': '#14141c' })[c] || '#444';
function sgMapOpen(view = 'world') { sg.ui = { type: 'map', view }; sgBox(); }
function sgMapHtml(u) {
  const tab = (v, label) => `<button type="button" class="map-tab ${u.view === v ? 'on' : ''}" data-act="sgMapView" data-v="${v}">${label}</button>`;
  return `<div class="map-head"><span>🗺️ <b>Map</b></span><span class="map-tabs">${tab('world', '🌍 World')}${tab('area', '📍 This area')}<button type="button" class="map-x" data-act="sgB" aria-label="Close map">✕</button></span></div>
    <canvas id="mapCv" class="map-cv sg" width="760" height="540"></canvas>
    <div class="map-foot">${u.view === 'world' ? '✨ Your party · ⛵ your ship' : '✨ You · 🎁 chest · 🔒 word-lock · 👾 guard'} · ◀ ▶ switch · B back</div>`;
}
function sgMapDraw() {
  const cv = $('#mapCv'), u = sg?.ui; if (!cv || u?.type !== 'map') return;
  const g = cv.getContext('2d'), s = sgS(), W = cv.width, H = cv.height, blink = Math.floor(Date.now() / 400) % 2;
  g.fillStyle = '#0a1450'; g.fillRect(0, 0, W, H);
  const star = (x, y, r) => { g.fillStyle = blink ? '#f4c542' : '#ffffff'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = '#14141c'; g.lineWidth = 2; g.stroke(); };
  g.textBaseline = 'top'; g.font = 'bold 16px ui-monospace,monospace';
  if (u.view === 'area') {
    const m = SG_MAPS[s.map], mm = trMiniMap(cv, m.rows, c => sgMapColor(c, m.theme), { y0: 24, maxH: H - 24 });
    g.fillStyle = '#ffffff'; g.fillText(m.name, 8, 4);
    for (const o of sgObjs(s.map)) { const [x, y] = mm.at(o.x, o.y); g.font = `${Math.max(10, mm.t + 2)}px sans-serif`;
      g.fillText(o.type === 'chest' ? (s.got[o.id] ? '▫️' : '🎁') : o.type === 'lockChest' ? (s.got[o.id] ? '▫️' : '🔒') : o.type === 'colorChest' ? (s.got[o.id] ? '▫️' : SG_CKEYS[o.color].icon) : o.type === 'seal' ? '🌀' : o.type === 'npc' ? '🙂' : '👾', x - 2, y - 2); }
    const [px, py] = mm.at(s.x, s.y); star(px + mm.t / 2, py + mm.t / 2, Math.max(4, mm.t * 0.7));
    return;
  }
  const seen = s.seen || {}, root = sgMapRoot(s.map), grid = typeof SG_WORLD !== 'undefined' ? SG_WORLD : [SG_OVERWORLDS], rowsN = grid.length, colsN = grid[0].length;
  const top = 4, cw = (W - 8) / colsN, ch = (H - top - 4) / rowsN;
  const known = id => id === 'field' || !!seen[id] || SG_MAPS[id]?.openSea || (id === 'seravel' && s.flags.kingDone);
  const later = [];   // labels and markers go on top of every region
  grid.forEach((row, r) => row.forEach((id, c) => {
    const m = SG_MAPS[id]; if (!m) return;
    const x0 = 4 + c * cw, y0 = top + r * ch, MW = m.rows[0].length, MH = m.rows.length, tw = cw / MW, th = ch / MH, at = (x, y) => [x0 + x * tw, y0 + y * th];
    if (!known(id)) {   // not explored yet: the land shows as gray fog, the sea stays sea blue
      for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const w = m.rows[y][x] === 'W'; g.fillStyle = w ? SG_MAP_COL('W') : (x * 7 + y * 13) % 5 ? '#8a8174' : '#7a7266'; g.fillRect(Math.floor(x0 + x * tw), Math.floor(y0 + y * th), Math.ceil(tw) + 1, Math.ceil(th) + 1); }
      g.fillStyle = '#2e2a24'; g.font = 'bold 20px ui-monospace,monospace'; g.textAlign = 'center'; g.fillText('???', x0 + cw / 2, y0 + ch / 2 - 12); g.textAlign = 'left'; return; }
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { g.fillStyle = sgMapColor(m.rows[y][x], m.theme); g.fillRect(Math.floor(x0 + x * tw), Math.floor(y0 + y * th), Math.ceil(tw) + 1, Math.ceil(th) + 1); }
    later.push(() => {
      g.font = `bold ${colsN > 3 ? 9 : 11}px ui-monospace,monospace`; const nm = m.openSea ? '' : m.name, nw = g.measureText(nm).width + 8;
      if (nm) { g.fillStyle = 'rgba(10,20,80,.7)'; g.fillRect(x0 + 3, y0 + 3, nw, 15); g.fillStyle = '#f4c542'; g.fillText(nm, x0 + 7, y0 + 5); }
      for (const [k, [name, target]] of Object.entries(SG_PLACES[id] || {})) {
        const [tx, ty] = k.split(',').map(Number); if (!m.rows[ty] || !'UVYZQuIE'.includes(m.rows[ty][tx])) continue;
        const [x, y] = at(tx, ty), ok = !target || seen[target] || target === s.map;
        g.font = 'bold 10px ui-monospace,monospace'; const label = ok ? name : '???', w = g.measureText(label).width + 6, lx = Math.max(x0 + 1, Math.min(x0 + cw - w - 1, x + tw / 2 - w / 2)), ly = Math.min(y0 + ch - 15, y + th + 1);
        g.fillStyle = 'rgba(10,20,80,.85)'; g.fillRect(lx, ly, w, 14); g.fillStyle = '#ffffff'; g.fillText(label, lx + 3, ly + 2);
      }
      if (s.shipAt && s.shipMap === id && !s.boat) { const [bx, by] = s.shipAt.split(',').map(Number), [x, y] = at(bx, by); g.font = '16px sans-serif'; g.fillText('⛵', x - 4, y - 6); }
      if (root.map === id) { const [x, y] = at(root.x, root.y); star(x + tw / 2, y + th / 2, 7); if (s.boat) { g.font = '16px sans-serif'; g.fillText('⛵', x - 4, y - 20); } }
    });
  }));
  later.forEach(f => f());
}
/* map colors that follow each region's biome */
const sgMapColor = (c, theme) => { const P = SG_OWP[theme]; return (P && { '.': P.g, f: P.tree, T: P.tree, h: P.hill, M: P.mount, P: P.road, B: P.road }[c]) || SG_MAP_COL(c); };
setInterval(() => { if (sg?.ui?.type === 'map' && view.name === 'saga') sgMapDraw(); }, 400);

/* ---------- Battles ---------- */
const sgRnd = (a, b) => a + Math.random() * (b - a);
function sgBattle(group, opts = {}) {
  // monsters level up as the story goes on: older areas catch up, newer ones get a little tougher too
  const ahead = Math.max(0, sgStage() - (SG_ZONE_STAGE[opts.zone] ?? sgStage())), boost = opts.zone ? 1 + 0.08 * ahead + 0.01 * sgStage() : 1;
  const counts = {}, foes = group.map(k => { counts[k] = (counts[k] || 0) + 1; const M = SG_MONSTERS[k], hp = Math.round(M.hp * boost);
    return { key: k, hp, max: hp, n: counts[k], mul: boost, lv: Math.max(1, Math.round(Math.sqrt(M.xp) * 1.3 * boost)) }; });
  for (const f of foes) if (counts[f.key] > 1) f.tag = 'ABCDEFGH'[f.n - 1]; else f.tag = '';
  sg.bt = { foes, hero: 0, round: 1, ward: 0, boss: !!opts.boss, final: foes.some(f => SG_MONSTERS[f.key].final), fixed: opts.fixed, story: opts.story, defend: {}, flashFoe: {}, intro: true };
  sg.held = null; sg.flash = 16; sgBattleMusic();
  const names = foes.map(f => SG_MONSTERS[f.key].name + (f.tag ? ' ' + f.tag : ''));
  sgSay(opts.boss ? [`⚠️ ${names[0]} attacks!`] : [`${names.length === 1 ? `A ${names[0]} appears!` : `${names.join(', ')} appear!`}`], () => { sg.bt.intro = false; sgHeroTurn(); });
}
const sgFoeName = f => `${SG_MONSTERS[f.key].name}${f.tag ? ' ' + f.tag : ''}`;
const sgFoeAtk = f => SG_MONSTERS[f.key].atk * (f.mul || 1);
const sgLiveFoes = () => sg.bt.foes.filter(f => f.hp > 0);
function sgHeroTurn() {
  const s = sgS(), b = sg.bt;
  while (b.hero < s.party.length && s.party[b.hero].hp <= 0) b.hero++;
  if (b.hero >= s.party.length) return sgFoesTurn();
  const h = s.party[b.hero], spells = sgSpellsOf(h);
  if (h.st?.curse && !b.cursed?.[b.hero] && Math.random() < 0.15) { (b.cursed ||= {})[b.hero] = 1; return sgSay(`🌑 The curse holds ${esc(h.name)} still! They can’t move this turn.`, sgNextHero); }
  sgMenu(`${SG_HEROES[h.key].icon} <b>${esc(h.name)}</b> · ❤️ ${h.hp}/${sgMax(h, 'hp')} · 💧 ${h.mp}/${sgMax(h, 'mp')}`, [
    { label: '⚔️ Fight', fn: () => sgPickFoe(f => sgFight(h, f), () => sgHeroTurn()) },
    { label: `✨ ${['knight', 'ranger', 'rogue'].includes(h.key) ? 'Skill' : 'Spell'}`, disabled: !spells.length, fn: () => sgSpellMenu(h) },
    { label: '🛡️ Defend', fn: () => { b.defend[b.hero] = true; sgSay(`${esc(h.name)} raises their guard.`, sgNextHero); } },
    { label: '🎒 Item', fn: () => sgItemMenu(true, h) },
    ...(b.hero === 0 ? [{ label: '🏃 Run', disabled: b.boss || !!b.fixed, fn: () => sgRun() }] : [])], null, { cols: 2 });
}
function sgNextHero() { if (!sg.bt) return; if (!sgLiveFoes().length) return sgWin(); sg.bt.hero++; sgHeroTurn(); }
function sgPickFoe(fn, back) {
  const live = sgLiveFoes(); if (live.length === 1) return fn(live[0]);
  sgMenu('Which foe?', live.map(f => ({ label: `👾 ${sgFoeName(f)} · Lv ${f.lv || 1}`, sub: `${Math.ceil(f.hp / f.max * 100)}% left`, fn: () => fn(f) })), back);
}
function sgHitFoe(f, dmg, lines) {
  f.hp = Math.max(0, f.hp - dmg); sg.bt.flashFoe[sg.bt.foes.indexOf(f)] = 14; trSound('hit');
  lines.push(`💥 ${esc(sgFoeName(f))} takes <b>${dmg}</b> damage!`);
  if (f.hp <= 0) lines.push(`✨ ${esc(sgFoeName(f))} is defeated!`);
}
function sgFight(h, f) {
  sgAsk(`⚔️ ${esc(h.name)} attacks ${esc(sgFoeName(f))}! Pick the meaning:`, (grade, fast, q) => {
    const lines = [], m = SG_MONSTERS[f.key];
    if (q?.timeout) { lines.push(`⏱️ Too slow! ${esc(h.name)} misses, and the enemy strikes first!`); return sgSay(lines, () => { sg.bt.hero = sgS().party.length; sgFoesTurn(); }); }
    if (grade === 'wrong') { lines.push(`${esc(h.name)} swings… and misses!`); return sgSay(lines, sgNextHero); }
    const sp = sgSpeed(q || {}), atk = sgStat(h, 'atk');
    const base = sp.crit ? atk * sgRnd(1.4, 1.7) : Math.max(1, (atk - m.def / 2) * sgRnd(0.85, 1.15));
    const dmg = Math.max(sp.crit ? 2 : 1, Math.round(base * (sp.crit ? 1 : sp.mult)));
    if (sp.crit) lines.push('⚡ Lightning fast! A critical hit!'); else if (sp.pct >= 5) lines.push(`💨 Quick answer: +${sp.pct}% damage!`);
    sgHitFoe(f, dmg, lines); sgSay(lines, sgNextHero);
  });
}
function sgSpellMenu(h) {
  sgMenu(`✨ ${esc(h.name)} · 💧 ${h.mp} MP`, sgSpellsOf(h).map(k => { const sp = SG_SPELLS[k]; return { label: `<b>${sp.name}</b> · ${sp.mp} MP`, sub: sp.desc, disabled: h.mp < sp.mp, fn: () => sgCastStart(h, k) }; }), () => sgHeroTurn());
}
const sgHealAmt = (h, sp) => Math.round((sp.power + sgStat(h, 'mag') * 1.0) * sgRnd(0.9, 1.1));
function sgCastStart(h, k) {
  const sp = SG_SPELLS[k], s = sgS(), go2 = target => (typeof sgSpellAsk === 'function' ? sgSpellAsk(sp) : sgAskSpell)(`✨ ${esc(h.name)} casts <b>${sp.name}</b>! Spell this word:`, grade => sgCast(h, k, target, grade));
  if (sp.kind === 'hit' || sp.kind === 'power' || sp.kind === 'steal') return sgPickFoe(f => go2(f), () => sgSpellMenu(h));
  if (sp.kind === 'heal' || sp.kind === 'revive' || sp.kind === 'cure') return sgMenu(`${sp.name} on…`, s.party.map(t => ({ label: sgHeroLine(t), disabled: sp.kind === 'revive' ? t.hp > 0 : sp.kind === 'cure' ? t.hp <= 0 || !(t.st?.poison || t.st?.curse) : t.hp <= 0, fn: () => go2(t) })), () => sgSpellMenu(h));
  go2(null);
}
function sgCast(h, k, target, grade) {
  const sp = SG_SPELLS[k], b = sg.bt, lines = [];
  if (grade === 'wrong') { h.mp -= Math.ceil(sp.mp / 2); lines.push(`The word slips away… the ${sp.kind === 'power' ? 'skill' : 'spell'} fizzles! (−${Math.ceil(sp.mp / 2)} MP)`); return sgSay(lines, sgNextHero); }
  h.mp -= sp.mp;
  const mult = grade === 'close' ? 0.6 : 1;
  if (grade === 'close') lines.push('≈ Almost right: the spell works at partial power.');
  if (sp.fx) lines.push(`${sgFx(sp.fx, sp.name)}${SG_HEROES[h.key].icon} ${esc(h.name)} uses <b>${sp.name}</b>!`);
  if (sp.kind === 'allatk') for (const f of sgLiveFoes()) { const m = SG_MONSTERS[f.key]; sgHitFoe(f, Math.max(2, Math.round((sgStat(h, 'atk') * sp.mult - m.def / 2) * sgRnd(0.85, 1.1) * mult)), lines); }
  if (sp.kind === 'steal') { const t = target.hp > 0 ? target : sgLiveFoes()[0], m = SG_MONSTERS[t.key];
    if (t.stolen || !m.gold) lines.push(`${esc(sgFoeName(t))} has nothing left to steal!`); else { t.stolen = 1; const gold = Math.max(1, Math.round(m.gold * sgRnd(0.8, 1.6) * mult)); sgS().gold += gold; lines.push(`🪙 ${esc(h.name)} lifts <b>${gold} gold</b> from ${esc(sgFoeName(t))}!`); } }
  if (sp.kind === 'cure') { target.st = {}; lines.push(`✨ ${esc(target.name)} is cured of poison and curses!`); }
  if (sp.kind === 'cureAll') { for (const a of sgAlive()) a.st = {}; lines.push('✨ Every poison and curse on the party is lifted!'); }
  if (sp.kind === 'power') { const t = target.hp > 0 ? target : sgLiveFoes()[0]; const m = SG_MONSTERS[t.key]; sgHitFoe(t, Math.max(2, Math.round((sgStat(h, 'atk') * sp.mult - m.def / 2) * sgRnd(0.9, 1.1) * mult)), lines); }
  if (sp.kind === 'hit') { const t = target.hp > 0 ? target : sgLiveFoes()[0]; sgHitFoe(t, Math.max(2, Math.round((sp.power + sgStat(h, 'mag') * 0.8) * sgRnd(0.9, 1.1) * mult)), lines); }
  if (sp.kind === 'all') for (const f of sgLiveFoes()) sgHitFoe(f, Math.max(2, Math.round((sp.power + sgStat(h, 'mag') * 0.6) * sgRnd(0.85, 1.1) * mult)), lines);
  if (sp.kind === 'heal') { const bf = target.hp; target.hp = Math.min(sgMax(target, 'hp'), target.hp + Math.round(sgHealAmt(h, sp) * mult)); lines.push(`💚 ${esc(target.name)} recovers ${target.hp - bf} HP!`); }
  if (sp.kind === 'healAll') for (const a of sgAlive()) { const bf = a.hp; a.hp = Math.min(sgMax(a, 'hp'), a.hp + Math.round(sgHealAmt(h, sp) * mult)); lines.push(`💚 ${esc(a.name)} recovers ${a.hp - bf} HP!`); }
  if (sp.kind === 'revive') { target.hp = Math.ceil(sgMax(target, 'hp') * 0.5 * mult); target.st = {}; lines.push(`🔥 ${esc(target.name)} is back on their feet!`); }
  if (sp.kind === 'ward') { b.ward = sp.turns + 1; lines.push('🛡️ A shining shield covers the whole party!'); }
  sg.flash = 6; sgSay(lines, sgNextHero);
}
function sgRun() { if (Math.random() < 0.65) { sg.bt = null; sgMusicSync(); return sgSay('You got away safely! 💨'); } sgSay('You couldn’t get away!', () => { sg.bt.hero = sgS().party.length; sgFoesTurn(); }); }
function sgFoesTurn() {
  const b = sg.bt, lines = [], party = sgS().party, crowd = Math.min(1, 4.5 / Math.max(1, sgLiveFoes().length));   // a big crowd of monsters each hits a little softer
  const soften = (dmg, v) => { const vi = party.indexOf(v); dmg = Math.round(dmg * crowd); if (b.defend[vi]) dmg = Math.ceil(dmg / 2); if (b.ward) dmg = Math.ceil(dmg / 2); return Math.max(1, dmg); };
  const hurt = (v, dmg) => { v.hp = Math.max(0, v.hp - dmg); const fell = v.hp <= 0; sgFall(v); return fell ? ` 💤 ${esc(v.name)} falls!` : ''; };
  const ail = (v, st, chance) => { if (!st || v.hp <= 0 || v.st?.[st] || Math.random() >= chance) return; (v.st ||= {})[st] = 1; lines.push(st === 'poison' ? `☠️ ${esc(v.name)} is poisoned!` : `🌑 ${esc(v.name)} is cursed! Their strength fades…`); };
  const special = (f, sp) => {
    const who = esc(sgFoeName(f)), targets = sgAlive();
    lines.push(`${sgFx(sp.fx, sp.name)}👾 ${who} uses <b>${sp.name}</b>!`);
    if (sp.mpAll) { for (const v of targets) { const n = Math.min(v.mp, sp.mpAll); v.mp -= n; } lines.push('The party’s magic drains away! (−MP)'); return; }
    for (const v of sp.all ? targets : [targets[Math.floor(Math.random() * targets.length)]]) {
      const atk = sgFoeAtk(f) * (b.rage && SG_MONSTERS[f.key].final ? 1.25 : 1);
      const raw = sp.mult ? (atk * sp.mult - sgStat(v, 'def') / 2) * sgRnd(0.85, 1.15) : sp.power * (f.mul || 1) * sgRnd(0.9, 1.25) * (b.rage && SG_MONSTERS[f.key].final ? 1.15 : 1);
      const dmg = soften(Math.round(raw), v);
      lines.push(`${esc(v.name)} takes ${dmg} damage!${hurt(v, dmg)}`);
      ail(v, sp.st, sp.stChance ?? 0.5);
    }
  };
  for (const f of sgLiveFoes()) {
    const m = SG_MONSTERS[f.key];
    if (m.final && !b.rage && f.hp <= f.max / 2) { b.rage = 1; lines.push(`${sgFx('void', 'Rage')}👾 The Unwriter’s robe of pages tears open. Black ink pours out!`, 'The Unwriter: ENOUGH! I will write you out of the story myself!', '⚠️ The Unwriter is enraged: he hits harder now!'); }
    for (let act = 0; act < (m.acts || 1); act++) {
      const targets = sgAlive(); if (!targets.length) break;
      const t = targets[Math.floor(Math.random() * targets.length)];
      if (m.final && b.rage && m.rage && Math.random() < 0.22) { special(f, m.rage); continue; }
      if (m.specials && Math.random() < 0.45) { special(f, m.specials[Math.floor(Math.random() * m.specials.length)]); continue; }
      if (m.cast && Math.random() < m.cast.chance) { special(f, { stChance: 0.5, ...m.cast }); continue; }
      if (m.drain && Math.random() < m.drain && t.mp > 0) { const n = Math.min(t.mp, 3 + Math.floor(Math.random() * (m.final ? 8 : 3))); t.mp -= n; lines.push(`👾 ${esc(sgFoeName(f))} whispers… ${esc(t.name)} loses ${n} MP!`); continue; }
      const heavy = m.heavy && Math.random() < m.heavy.chance, atk = sgFoeAtk(f) * (b.rage && m.final ? 1.25 : 1), raw = (atk * (heavy ? m.heavy.mult : 1) - sgStat(t, 'def') / 2) * sgRnd(0.85, 1.15);
      const dmg = soften(Math.round(raw), t);
      lines.push(heavy ? `${sgFx(m.heavy.fx || 'slash', m.heavy.name)}👾 ${esc(sgFoeName(f))} uses <b>${m.heavy.name}</b>! ${esc(t.name)} takes ${dmg} damage!${hurt(t, dmg)}` : `👾 ${esc(sgFoeName(f))} attacks! ${esc(t.name)} takes ${dmg} damage!${hurt(t, dmg)}`);
      ail(t, 'poison', m.poison || 0); ail(t, 'curse', m.curse || 0);
    }
  }
  // poison stings at the end of the round
  for (const v of sgAlive()) if (v.st?.poison) { const dmg = Math.max(1, Math.round(sgMax(v, 'hp') * 0.07)); lines.push(`☠️ The poison stings ${esc(v.name)}: −${dmg} HP.${hurt(v, dmg)}`); }
  sg.shake = 10; trSound('bump');
  sgSay(lines.length ? lines : ['…'], () => {
    if (!sgAlive().length) return sgLose();
    b.round++; b.hero = 0; b.defend = {}; b.cursed = {}; if (b.ward > 0) { b.ward--; if (!b.ward) return sgSay('The shining shield fades.', sgHeroTurn); }
    sgHeroTurn();
  });
}
function sgWin() {
  const s = sgS(), b = sg.bt, xp = Math.round(b.foes.reduce((a, f) => a + SG_MONSTERS[f.key].xp * (f.mul || 1), 0)), gold = Math.round(b.foes.reduce((a, f) => a + SG_MONSTERS[f.key].gold * (f.mul || 1), 0));
  const share = Math.max(1, Math.ceil(xp / Math.max(1, sgAlive().length))), lines = [`🏆 Victory! Each hero gains ${share} XP.`, `💰 You found ${gold} gold.`];
  s.gold += gold; sg.session.wins++; sg.session.nuts += b.boss ? 5 : 1;
  if (b.fixed) s.beaten[b.fixed] = 1;
  if (Math.random() < 0.12 && !b.boss) { s.bag.herb = (s.bag.herb || 0) + 1; lines.push('🌿 A monster dropped a Herb!'); }
  sgGiveXp(lines, share);
  sgJingle('sg_fanfare');
  const boss = b.boss, story = b.story, meet = !boss && !b.fixed && SG_ROAD_MEET[s.map]; sg.bt = null; sgSaveNow(true);
  sgSay(lines, () => { sgMusicSync();
    if (boss) return sgSay(SG_STORY[(story || 'erased') + 'Win'] || SG_STORY.bossWin);
    if (meet && !s.met[meet[0]] && Math.random() < 0.3) sgSay(SG_STORY[meet[1]](esc(s.name)), () => sgMenu(`Let ${SG_NAMES[meet[0]]} join you?`, [
      { label: `${SG_HEROES[meet[0]].icon} Yes, welcome!`, fn: () => sgSay(`${SG_HEROES[meet[0]].icon} <b>${SG_NAMES[meet[0]]} the ${SG_HEROES[meet[0]].cls}</b> joined the party!`, () => sgJoin(meet[0])) },
      { label: 'Not now', fn: () => sgSay(`${SG_NAMES[meet[0]]}: Then perhaps we’ll meet again. Or find me at a tavern.`) }], null));
  });
}
const SG_ROAD_MEET = { seravel: ['monk', 'roadMonk'], eastsea: ['paladin', 'roadPaladin'] };
function sgLose() {
  const s = sgS(); sg.bt = null;
  const lost = Math.floor(s.gold / 2); s.gold -= lost;
  sgSay(['The party has fallen…', `…You wake up at the inn in ${SG_MAPS[s.home || 'town'].name}. You lost ${lost} gold.`], () => {
    for (const h of s.party) { h.hp = sgMax(h, 'hp'); h.mp = sgMax(h, 'mp'); h.st = {}; }
    const t = SG_MAPS[s.home || 'town']; sgWarp(s.home || 'town', t.home.x, t.home.y, 'down');
  });
}

/* ---------- Music (original songs for this game, played by the Wordling Trails sound chip) ---------- */
Object.assign(TRM_SONGS, {
  sg_town: { bpm: 120, lead: ['C5 - E5 G5 - E5 C5 -', 'D5 - F5 A5 - G5 F5 -', 'E5 - G5 C6 - B5 A5 G5', 'F5 E5 D5 - G5 - . .', 'C5 - E5 G5 - A5 G5 F5', 'E5 - D5 C5 - D5 E5 -', 'F5 - A5 G5 F5 E5 D5 B4', 'C5 - - - - - . .'],
    bass: ['C3 - G3 - E3 - G3 -', 'D3 - A3 - F3 - A3 -', 'C3 - G3 - E3 - G3 -', 'G2 - D3 - G2 - B2 -', 'C3 - G3 - F3 - A3 -', 'C3 - G3 - A2 - E3 -', 'F2 - C3 - G2 - D3 -', 'C3 - G3 - C3 - . .'], drums: ['k . h . s . h h'], vol: 0.8 },
  sg_field: { bpm: 132, lead: ['G4 - B4 D5 - - G5 -', 'F#5 - E5 - D5 - B4 -', 'C5 - E5 G5 - - C6 -', 'B5 - A5 - G5 - - -', 'E5 - G5 - F#5 - D5 -', 'E5 - C5 - A4 - D5 -', 'G5 F#5 E5 D5 C5 B4 A4 F#4', 'G4 - - - D5 - . .'],
    bass: ['G2 - D3 - G2 - D3 -', 'D3 - A3 - D3 - F#3 -', 'C3 - G3 - C3 - G3 -', 'G2 - D3 - G2 - B2 -', 'C3 - G3 - D3 - A3 -', 'A2 - E3 - D3 - A3 -', 'C3 - G3 - D3 - F#3 -', 'G2 - D3 - G2 - . .'], drums: ['k . h k s . h .'], vol: 0.85 },
  sg_cave: { bpm: 96, lead: ['D5 - - F5 - - E5 -', 'C5 - - A4 - - . .', 'Bb4 - - D5 - - C5 -', 'A4 - - - - - . .', 'D5 - F5 - A5 - G5 F5', 'E5 - - C#5 - - . .', 'D5 - C5 - Bb4 - A4 -', 'D4 - - - - - . .'],
    bass: ['D3 - A3 - D3 - A3 -', 'A2 - E3 - A2 - E3 -', 'Bb2 - F3 - Bb2 - F3 -', 'A2 - E3 - A2 - C#3 -', 'D3 - A3 - F3 - A3 -', 'A2 - E3 - A2 - E3 -', 'Bb2 - F3 - A2 - E3 -', 'D3 - A3 - D3 - . .'], drums: ['k . . . . . h .'], vol: 0.75 },
  sg_battle: { bpm: 172, lead: ['E5 - G5 E5 B5 - A5 G5', 'F#5 - D5 - B4 - D5 -', 'E5 - G5 B5 E6 - D6 B5', 'C6 - B5 A5 B5 - - -', 'G5 A5 B5 G5 A5 B5 C6 A5', 'B5 - G5 - E5 - D#5 -', 'E5 F#5 G5 E5 C5 D5 D#5 F#5', 'E5 - - - B4 - . .'],
    bass: ['E2 E3 E2 E3 E2 E3 E2 E3', 'D2 D3 D2 D3 D2 D3 D2 D3', 'C2 C3 C2 C3 C2 C3 C2 C3', 'A2 A3 A2 A3 B2 B3 B2 B3', 'E2 E3 E2 E3 F#2 F#3 F#2 F#3', 'G2 G3 G2 G3 B2 B3 B2 B3', 'C3 C4 C3 C4 B2 B3 B2 B3', 'E2 E3 E2 E3 E2 - . .'], drums: ['k h s h k k s h'], vol: 0.85 },
  sg_boss: { bpm: 184, lead: ['A4 C5 E5 A5 G#5 - E5 -', 'F5 - D5 - B4 - G#4 -', 'A4 C5 E5 A5 C6 - B5 A5', 'G#5 - - - E5 - . .', 'D5 F5 A5 D6 C6 - A5 -', 'B5 - G#5 - E5 - D5 -', 'C5 D5 E5 F5 G#5 A5 B5 G#5', 'A5 - - - A4 - . .'],
    bass: ['A2 A3 A2 A3 A2 A3 A2 A3', 'D2 D3 D2 D3 E2 E3 E2 E3', 'A2 A3 A2 A3 A2 A3 A2 A3', 'E2 E3 E2 E3 E2 E3 G#2 G#3', 'D2 D3 D2 D3 D2 D3 D2 D3', 'E2 E3 E2 E3 E2 E3 E2 E3', 'F2 F3 F2 F3 E2 E3 E2 E3', 'A2 A3 A2 A3 A2 - . .'], drums: ['k s k s k k s s'], vol: 0.9 },
  sg_fanfare: { bpm: 150, once: true, lead: ['C5 E5 G5 - E5 G5 C6 -', 'D6 - C6 - - - . .'], bass: ['C3 - G3 - C3 - G3 -', 'G2 - C3 - - - . .'], drums: ['k . s . k . s .', 'k . . . . . . .'], vol: 0.9 },
  sg_level: { bpm: 170, once: true, lead: ['C5 E5 G5 C6 G5 C6 E6 -'], bass: ['C3 - - - G2 - C3 -'], drums: ['k . . . k . s .'], vol: 0.85 },
  sg_desert: { bpm: 112, lead: ['A4 - C5 D5 - E5 - D5', 'C5 - A4 - G#4 - A4 -', 'D5 - F5 E5 - D5 C5 -', 'B4 - G#4 - E4 - . .', 'A4 - C5 E5 - A5 - G#5', 'F5 - E5 - D5 - C5 -', 'D5 C5 B4 C5 D5 E5 G#4 B4', 'A4 - - - E4 - . .'],
    bass: ['A2 - E3 - A2 - E3 -', 'A2 - E3 - G#2 - E3 -', 'D3 - A3 - D3 - A3 -', 'E2 - B2 - E2 - G#2 -', 'A2 - E3 - C3 - E3 -', 'D3 - A3 - F2 - C3 -', 'D3 - A3 - E2 - B2 -', 'A2 - E3 - A2 - . .'], drums: ['k . h s . k h .'], vol: 0.8 },
  sg_port: { bpm: 126, lead: ['F5 - A5 - C6 - A5 F5', 'G5 - - - E5 - C5 -', 'D5 - F5 - Bb5 - A5 G5', 'A5 - - - - - . .', 'F5 G5 A5 - C6 - A5 -', 'Bb5 - A5 - G5 - E5 -', 'F5 - D5 - C5 - E5 -', 'F5 - - - - - . .'],
    bass: ['F2 - C3 - F2 - C3 -', 'C3 - G3 - C3 - G3 -', 'Bb2 - F3 - Bb2 - F3 -', 'F2 - C3 - F2 - A2 -', 'F2 - C3 - A2 - C3 -', 'G2 - D3 - C3 - G3 -', 'Bb2 - F3 - C3 - G3 -', 'F2 - C3 - F2 - . .'], drums: ['k . h . k . h s'], vol: 0.8 },
  sg_sea: { bpm: 120, lead: ['D5 - - E5 F#5 - A5 -', 'G5 - F#5 - E5 - - -', 'B4 - - C#5 D5 - F#5 -', 'E5 - - - - - . .', 'D5 - F#5 - A5 - D6 -', 'C#6 - B5 - A5 - F#5 -', 'G5 - E5 - C#5 - E5 -', 'D5 - - - - - . .'],
    bass: ['D3 - A3 - F#3 - A3 -', 'G2 - D3 - G2 - D3 -', 'B2 - F#3 - B2 - F#3 -', 'A2 - E3 - A2 - C#3 -', 'D3 - A3 - F#3 - A3 -', 'A2 - E3 - F#2 - C#3 -', 'G2 - D3 - A2 - E3 -', 'D3 - A3 - D3 - . .'], drums: ['k . . h k . . h'], vol: 0.8 },
  sg_archive: { bpm: 90, lead: ['E5 - - G5 - - F#5 -', 'D5 - - B4 - - . .', 'C5 - - E5 - - D5 -', 'B4 - - - - - . .', 'E5 - G5 - B5 - A5 G5', 'F#5 - - D#5 - - . .', 'E5 - D5 - C5 - B4 -', 'E4 - - - - - . .'],
    bass: ['E3 - B3 - E3 - B3 -', 'B2 - F#3 - B2 - F#3 -', 'C3 - G3 - C3 - G3 -', 'B2 - F#3 - B2 - D#3 -', 'E3 - B3 - G3 - B3 -', 'B2 - F#3 - B2 - F#3 -', 'C3 - G3 - B2 - F#3 -', 'E3 - B3 - E3 - . .'], drums: ['k . . . . h . .'], vol: 0.7 },
  sg_inn: { bpm: 100, once: true, lead: ['E5 - D5 C5 D5 - G4 -', 'C5 - - - - - . .'], bass: ['C3 - G2 - C3 - - -', 'C3 - - - - - . .'], drums: ['. . . . . . . .'], vol: 0.75 },
});
const sgMapSong = () => sgS()?.fly ? 'sg_sky' : sgS()?.boat ? 'sg_sea' : sgSongOf(sgS()?.map);   // (saga-part7.js: each kind of place has its own song)
function sgMusicSync() {
  if (!sg || !sgS()) return;
  if (trMusic.song?.once) return;
  const want = sg.bt ? sgBattleSong() : sgMapSong();
  if (trMusic.name !== want || (!trMusic.song && trMusic.on())) trMusic.play(want);
}
const sgBattleSong = () => sgBattleSongFor(sg?.bt, sgS());
function sgBattleMusic() { if (!trMusic.on()) return; trMusic.after = null; trMusic.song = null; trMusic.name = null; sgMusicSync(); }
function sgJingle(name) { if (trMusic.on()) trMusic.jingle(name, sg?.bt ? sgBattleSong() : sgMapSong()); }

/* ---------- Art ---------- */
const sgCache = {};
const sgCanvas = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; draw(g); return c; };
/* overworld biomes: snow, rocky highlands, cursed wastes, jungle, swamp, red canyon */
const SG_OWP = {
  snow:   { g: '#eef4f8', g2: '#d3e0ea', gL: '#ffffff', tree: '#2f5d4a', treeL: '#4f8a6f', trunk: '#5a4030', mount: '#9aa8b8', mountD: '#6a7888', cap: '#ffffff', water: '#5a8fc8', waterL: '#bfe0f8', road: '#c8d0d8', roadD: '#a8b4c0', hill: '#dce6ee', pine: 1 },
  crag:   { g: '#8f9a6a', g2: '#7a845a', gL: '#a8b080', tree: '#3f5a2f', treeL: '#5a7a3f', trunk: '#5a4030', mount: '#8a7d70', mountD: '#5a5046', cap: '#c8bfb4', water: '#3f6f9a', waterL: '#8fb8d8', road: '#b8a88a', roadD: '#968766', hill: '#a39684' },
  blight: { g: '#4a3d55', g2: '#3d3248', gL: '#5f4f6e', tree: '#2a1f30', treeL: '#4a3a52', trunk: '#2a1a20', mount: '#3a2f40', mountD: '#22192a', cap: '#7a6a88', water: '#2a2040', waterL: '#5a4a7a', road: '#6a5a6a', roadD: '#4f424f', hill: '#5a4a68', dead: 1 },
  jungle: { g: '#3a9a3a', g2: '#2f8a2f', gL: '#6fcf5f', tree: '#145a2a', treeL: '#2e8a3f', trunk: '#5a3a1a', mount: '#4a6a3a', mountD: '#2f4a26', cap: '#7a9a5a', water: '#2a8aa0', waterL: '#7fd6e0', road: '#a8865a', roadD: '#86683f', hill: '#5ab84a' },
  swamp:  { g: '#5a6b3a', g2: '#4a5a2f', gL: '#7a8a4f', tree: '#2a3a1f', treeL: '#4a5a2f', trunk: '#3a2a1a', mount: '#4a4a3a', mountD: '#2f2f24', cap: '#6a6a54', water: '#3f5a3a', waterL: '#6f8a5a', road: '#7a6a4a', roadD: '#5a4f36', hill: '#6b7a46' },
  canyon: { g: '#d8955a', g2: '#c4804a', gL: '#f0b07a', tree: '#4f7a3a', treeL: '#6f9a4f', trunk: '#5a3a1a', mount: '#b0502a', mountD: '#7a3418', cap: '#e08a5a', water: '#2f7fc0', waterL: '#8fc8f0', road: '#e8c08a', roadD: '#c49a66', hill: '#c8703f' },
};
const SG_OWP_THEMES = new Set(Object.keys(SG_OWP));
const SGC = { grass: '#4caf50', grass2: '#43a047', grassL: '#81c784', forest: '#1e6b35', forestL: '#2e8b4a', trunk: '#6b4226', mount: '#8d7b68', mountD: '#5d4f43', snow: '#f2f2f2', water: '#2f6fd0', waterL: '#7ab8f5',
  sand: '#d9b878', sandD: '#b8955a', stone: '#9aa0a6', stoneD: '#5f656e', roof: '#c0392b', roofD: '#8e2a20', cream: '#f3e2c0', wood: '#8b5a2b', woodD: '#5e3a1a', gold: '#f4c542', carpet: '#b03a48', carpetD: '#7d2633',
  cave: '#7a5a3e', caveD: '#3e2a1c', caveL: '#99785a', ink: '#14141c', white: '#f6f6f0', purple: '#8e44ad', flower: '#ff8fb1' };
function sgTileArt(ch, theme) {
  return sgCache['t' + theme + ch] ||= sgCanvas(16, 16, g => {
    const R = (x, y, w, h, c) => { g.fillStyle = SGC[c] || c; g.fillRect(x, y, w, h); };
    const OW = SG_OWP[theme];
    const grass = () => { if (OW) { R(0, 0, 16, 16, OW.g); R(3, 4, 1, 2, OW.g2); R(11, 9, 1, 2, OW.g2); R(7, 13, 1, 2, OW.g2); R(13, 2, 1, 1, OW.gL); return; } R(0, 0, 16, 16, 'grass'); R(3, 4, 1, 2, 'grass2'); R(11, 9, 1, 2, 'grass2'); R(7, 13, 1, 2, 'grass2'); R(13, 2, 1, 1, 'grassL'); };
    const arc = theme === 'archive', CP = { archive: ['#3f6f78', '#1d3a42', '#6fa3ab'], ember: ['#6a2a14', '#2a0a04', '#a8481c'], tower: ['#3a3450', '#16121f', '#5e5880'],
      ice: ['#8fc0d8', '#2f5f7a', '#d8f0fa'], crag: ['#7a6f66', '#3a332e', '#a69a8f'], blight: ['#3d2f4a', '#1a1222', '#6a5480'], ruins: ['#6d7f52', '#2f3a22', '#a3b57a'],
      mire: ['#4a5a3a', '#1e2a17', '#7d8f5c'], canyon: ['#b0603a', '#5a2a14', '#d89060'], castle: ['#3a3446', '#141018', '#5a5268'] }[theme] || ['cave', 'caveD', 'caveL'], [CF, CD, CL] = CP;
    const floor = () => { R(0, 0, 16, 16, '#c8955a'); for (let y = 3; y < 16; y += 4) R(0, y, 16, 1, '#a87440'); R(5, 0, 1, 3, '#a87440'); R(11, 4, 1, 3, '#a87440'); R(3, 8, 1, 3, '#a87440'); R(13, 12, 1, 3, '#a87440'); };
    const base = () => theme === 'desert' ? sand() : grass();
    const caveFloor = () => { R(0, 0, 16, 16, CF); R(3, 5, 2, 1, CL); R(11, 11, 2, 1, CL); R(8, 2, 1, 1, CD); if (arc) { R(0, 7, 16, 1, CD); R(7, 0, 1, 7, CD); R(3, 8, 1, 8, CD); } };
    const sand = () => { R(0, 0, 16, 16, '#e6c77a'); R(3, 4, 3, 1, '#d4b062'); R(10, 10, 3, 1, '#d4b062'); R(12, 3, 1, 1, '#f3dca0'); R(5, 12, 1, 1, '#f3dca0'); };
    if (typeof sgTileMore === 'function' && sgTileMore(ch, theme, g, R, { grass, base, sand, floor, caveFloor })) return;
    switch (ch) {
      case '.': grass(); break;
      case 'f': if (OW) { grass(); for (const [x, y] of [[1, 1], [8, 6]]) { R(x + 2, y + 6, 2, 3, OW.trunk); if (OW.pine) { R(x + 2, y, 2, 2, OW.tree); R(x + 1, y + 2, 4, 2, OW.tree); R(x, y + 4, 6, 2, OW.tree); R(x + 2, y + 1, 1, 4, OW.treeL); }
          else if (OW.dead) { R(x + 2, y, 2, 6, OW.trunk); R(x, y + 1, 2, 1, OW.trunk); R(x + 4, y + 2, 2, 1, OW.trunk); } else { R(x, y + 1, 6, 5, OW.tree); R(x + 1, y, 4, 7, OW.tree); R(x + 1, y + 1, 2, 2, OW.treeL); } } break; }
        grass(); for (const [x, y] of [[1, 1], [8, 6]]) { R(x + 2, y + 6, 2, 3, 'trunk'); R(x, y + 1, 6, 5, 'forest'); R(x + 1, y, 4, 7, 'forest'); R(x + 1, y + 1, 2, 2, 'forestL'); } break;
      case 'T': if (OW) { grass(); R(7, 11, 3, 4, OW.trunk); if (OW.dead) { R(7, 2, 2, 10, OW.trunk); R(4, 4, 3, 1, OW.trunk); R(9, 6, 3, 1, OW.trunk); } else if (OW.pine) { R(6, 1, 4, 3, OW.tree); R(4, 4, 8, 3, OW.tree); R(2, 7, 12, 4, OW.tree); R(7, 2, 1, 7, OW.treeL); } else { R(2, 2, 12, 9, OW.tree); R(4, 0, 8, 13, OW.tree); R(4, 2, 4, 3, OW.treeL); } break; }
        grass(); R(7, 11, 3, 4, 'trunk'); R(2, 2, 12, 9, 'forest'); R(4, 0, 8, 13, 'forest'); R(4, 2, 4, 3, 'forestL'); break;
      case 'h': if (OW) { grass(); R(2, 8, 12, 4, OW.hill); R(4, 6, 8, 2, OW.hill); R(2, 11, 12, 1, OW.g2); break; }
        grass(); R(2, 8, 12, 4, 'grassL'); R(4, 6, 8, 2, 'grassL'); R(2, 11, 12, 1, 'grass2'); break;
      case 'M': if (OW) { grass(); g.fillStyle = OW.mountD; g.beginPath(); g.moveTo(0, 16); g.lineTo(8, 1); g.lineTo(16, 16); g.fill(); g.fillStyle = OW.mount; g.beginPath(); g.moveTo(3, 16); g.lineTo(8, 4); g.lineTo(13, 16); g.fill(); R(6, 2, 4, 3, OW.cap); break; }
        if (theme === 'desert') { sand(); g.fillStyle = '#9a6a3a'; g.beginPath(); g.moveTo(0, 16); g.lineTo(8, 1); g.lineTo(16, 16); g.fill(); g.fillStyle = '#c8955a'; g.beginPath(); g.moveTo(3, 16); g.lineTo(8, 4); g.lineTo(13, 16); g.fill(); R(6, 3, 4, 2, '#e8c890'); break; }
        grass(); g.fillStyle = SGC.mountD; g.beginPath(); g.moveTo(0, 16); g.lineTo(8, 1); g.lineTo(16, 16); g.fill(); g.fillStyle = SGC.mount; g.beginPath(); g.moveTo(3, 16); g.lineTo(8, 4); g.lineTo(13, 16); g.fill(); R(6, 2, 4, 3, 'snow'); break;
      case 'W': R(0, 0, 16, 16, 'water'); R(2, 4, 4, 1, 'waterL'); R(9, 10, 4, 1, 'waterL'); R(12, 3, 2, 1, 'waterL'); break;
      case 'B': R(0, 0, 16, 16, 'water'); R(1, 0, 14, 16, 'wood'); for (let y = 1; y < 16; y += 4) R(1, y, 14, 1, 'woodD'); R(1, 0, 1, 16, 'woodD'); R(14, 0, 1, 16, 'woodD'); break;
      case 'P': if (OW) { R(0, 0, 16, 16, OW.road); R(3, 3, 2, 1, OW.roadD); R(10, 9, 2, 1, OW.roadD); R(6, 13, 1, 1, OW.roadD); break; }
        R(0, 0, 16, 16, 'sand'); R(3, 3, 2, 1, 'sandD'); R(10, 9, 2, 1, 'sandD'); R(6, 13, 1, 1, 'sandD'); break;
      case 'U': if (theme === 'desert') sand(); else grass(); R(2, 7, 12, 8, 'stone'); R(2, 7, 12, 1, 'stoneD'); R(1, 3, 4, 5, 'roof'); R(11, 3, 4, 5, 'roof'); R(6, 1, 4, 7, 'roofD'); R(7, 10, 2, 5, 'woodD'); R(4, 9, 1, 2, 'ink'); R(11, 9, 1, 2, 'ink'); break;
      case 'V': if (theme === 'desert') sand(); else grass(); g.fillStyle = theme === 'desert' ? '#b07a44' : SGC.mount; g.beginPath(); g.moveTo(0, 16); g.lineTo(8, 0); g.lineTo(16, 16); g.fill(); R(5, 9, 6, 7, 'ink'); R(6, 8, 4, 1, 'ink'); break;
      case '#': R(0, 0, 16, 16, 'stone'); for (let y = 0; y < 16; y += 4) { R(0, y, 16, 1, 'stoneD'); for (let x = (y / 4) % 2 ? 4 : 0; x < 16; x += 8) R(x, y, 1, 4, 'stoneD'); } break;
      case 'K': R(0, 0, 16, 16, 'carpet'); R(0, 0, 16, 1, 'carpetD'); R(0, 0, 1, 16, 'carpetD'); R(7, 7, 2, 2, 'gold'); break;
      case 'L': R(0, 0, 16, 16, 'carpet'); R(3, 1, 10, 14, 'gold'); R(4, 2, 8, 8, 'roofD'); R(3, 11, 10, 2, 'wood'); R(4, 0, 2, 2, 'gold'); R(10, 0, 2, 2, 'gold'); break;
      case 'R': R(0, 0, 16, 16, 'roof'); for (let y = 2; y < 16; y += 4) R(0, y, 16, 1, 'roofD'); for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < 16; x += 8) R(x, y, 1, 3, 'roofD'); break;
      case 'H': R(0, 0, 16, 16, 'cream'); R(0, 15, 16, 1, 'wood'); R(3, 4, 4, 4, 'water'); R(4, 5, 2, 2, 'waterL'); R(10, 4, 4, 4, 'water'); R(11, 5, 2, 2, 'waterL'); R(3, 4, 4, 1, 'wood'); R(10, 4, 4, 1, 'wood'); break;
      case 'D': R(0, 0, 16, 16, 'cream'); R(3, 2, 10, 14, 'wood'); R(4, 3, 8, 13, 'woodD'); R(10, 9, 1, 2, 'gold'); R(3, 2, 10, 1, 'woodD'); break;
      case 'S': grass(); R(7, 9, 2, 6, 'wood'); R(2, 3, 12, 7, 'wood'); R(3, 4, 10, 5, 'cream'); R(4, 5, 8, 1, 'woodD'); R(4, 7, 6, 1, 'woodD'); break;
      case 'F': grass(); for (const [x, y, c] of [[3, 4, 'flower'], [10, 3, 'gold'], [6, 10, 'white'], [12, 11, 'flower']]) { R(x, y, 3, 3, c); R(x + 1, y + 1, 1, 1, 'gold'); } break;
      case 'd': sand(); break;
      case 'k': sand(); R(7, 2, 3, 13, '#2e8b4a'); R(3, 6, 2, 5, '#2e8b4a'); R(3, 10, 4, 2, '#2e8b4a'); R(12, 4, 2, 5, '#2e8b4a'); R(10, 8, 4, 2, '#2e8b4a'); R(8, 3, 1, 11, '#5fbf6f'); R(8, 0, 1, 2, '#ff8fb1'); break;
      case 'Q': R(0, 0, 16, 16, 'water'); R(0, 2, 16, 12, 'wood'); for (let x = 0; x < 16; x += 4) R(x, 2, 1, 12, 'woodD'); R(1, 13, 2, 3, 'woodD'); R(13, 13, 2, 3, 'woodD'); break;
      case 'Y': if (theme === 'desert') sand(); else grass(); g.fillStyle = theme === 'desert' ? '#9a6a3a' : SGC.mountD; g.beginPath(); g.moveTo(0, 16); g.lineTo(8, 0); g.lineTo(16, 16); g.fill(); R(4, 7, 8, 9, 'sand'); R(5, 6, 6, 1, 'sand'); R(6, 9, 1, 1, 'sandD'); R(9, 12, 1, 1, 'sandD'); break;
      case 'u': sand(); R(2, 8, 5, 6, 'cream'); R(1, 6, 7, 3, '#c0763a'); R(9, 9, 5, 5, 'cream'); R(8, 7, 7, 3, '#c0763a'); R(4, 11, 1, 3, 'woodD'); R(11, 11, 1, 3, 'woodD'); R(12, 1, 1, 6, 'trunk'); R(10, 0, 5, 2, '#2e8b4a'); break;
      case 'Z': sand(); R(2, 4, 12, 12, '#f5eef8'); R(1, 3, 14, 2, 'gold'); R(4, 6, 2, 10, '#d7bde2'); R(10, 6, 2, 10, '#d7bde2'); R(6, 9, 4, 7, 'ink'); R(7, 0, 2, 3, 'gold'); R(7, 10, 2, 2, 'gold'); break;
      case 'z': base(); R(4, 13, 8, 3, 'stoneD'); R(5, 4, 6, 10, 'stone'); R(5, 4, 1, 10, 'white'); R(10, 4, 1, 10, 'stoneD'); R(4, 2, 8, 3, 'stoneD'); R(6, 0, 4, 2, 'gold'); R(7, 7, 2, 4, 'gold'); R(6, 8, 4, 1, 'gold'); break;
      case 'I': grass(); R(3, 1, 10, 15, '#2a1a40'); R(2, 0, 2, 3, '#2a1a40'); R(7, 0, 2, 3, '#2a1a40'); R(12, 0, 2, 3, '#2a1a40'); R(4, 2, 1, 13, '#4a3a6a'); R(6, 10, 4, 6, 'ink'); R(7, 4, 2, 3, '#c39bd3'); break;
      case 'g': R(0, 0, 16, 16, '#2e7d32'); for (let y = 2; y < 16; y += 4) R(0, y, 16, 1, '#1b5e20'); for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < 16; x += 8) R(x, y, 1, 3, '#1b5e20'); R(6, 9, 4, 5, 'gold'); R(7, 10, 2, 3, 'cream'); R(10, 10, 1, 2, 'gold'); break;
      case 'N': R(0, 0, 16, 16, '#5d6d7e'); for (let y = 2; y < 16; y += 4) R(0, y, 16, 1, '#34495e'); R(7, 2, 2, 12, 'gold'); R(4, 5, 8, 2, 'gold'); break;
      case '_': floor(); break;
      case 'n': R(0, 0, 16, 16, '#a8a49c'); R(0, 7, 16, 1, '#8a867e'); R(0, 15, 16, 1, '#8a867e'); R(7, 0, 1, 7, '#8a867e'); R(15, 8, 1, 7, '#8a867e'); R(3, 3, 1, 1, '#bcb8b0'); R(11, 11, 1, 1, '#bcb8b0'); break;
      case 'e': floor(); R(2, 1, 12, 14, '#5e3a1a'); R(3, 2, 10, 4, '#f6f6f0'); R(3, 6, 10, 8, '#b03a48'); R(3, 6, 10, 1, '#7d2633'); R(3, 9, 10, 1, '#d8586a'); break;
      case 'v': floor(); R(2, 3, 5, 11, '#8b5a2b'); R(2, 5, 5, 1, '#3a2010'); R(2, 11, 5, 1, '#3a2010'); R(9, 6, 5, 8, '#a87440'); R(9, 6, 5, 1, '#5e3a1a'); R(9, 9, 5, 1, '#5e3a1a'); R(11, 6, 1, 8, '#5e3a1a'); break;
      case 'q': R(0, 0, 16, 16, 'stone'); R(0, 0, 16, 2, 'stoneD'); R(2, 4, 12, 12, '#5f656e'); R(4, 7, 8, 9, '#14141c'); R(5, 11, 6, 4, '#ff7a1a'); R(6, 9, 4, 3, '#f4c542'); R(7, 13, 2, 2, '#fff3a0'); break;
      case 'w': R(0, 0, 16, 16, '#a8a49c'); R(5, 1, 6, 5, '#c9d3e0'); R(6, 3, 4, 1, '#141420'); R(4, 6, 8, 6, '#c9d3e0'); R(4, 6, 8, 1, '#8e9aae'); R(5, 12, 2, 3, '#8e9aae'); R(9, 12, 2, 3, '#8e9aae'); R(7, 0, 2, 1, '#c0392b'); R(3, 14, 10, 2, '#5f656e'); break;
      case 'a': floor(); R(5, 10, 6, 5, '#b0603a'); R(5, 10, 6, 1, '#7a3418'); R(3, 2, 10, 8, '#2e8b4a'); R(5, 1, 6, 3, '#4caf50'); R(4, 5, 2, 2, '#1e6b35'); R(10, 6, 2, 2, '#1e6b35'); break;
      case 'O': R(0, 0, 16, 16, '#6b4226'); for (let x = 3; x < 16; x += 4) R(x, 0, 1, 16, '#4a2c17'); R(0, 15, 16, 1, '#3a2010'); R(1, 5, 1, 1, '#2a1a10'); R(9, 11, 1, 1, '#2a1a10'); break;
      case '=': floor(); R(0, 3, 16, 13, '#6b4226'); R(0, 3, 16, 4, '#a87440'); R(0, 6, 16, 1, '#4a2c17'); R(3, 0, 3, 4, 'gold'); R(4, 1, 1, 2, 'cream'); R(10, 1, 3, 3, '#c0392b'); break;
      case 't': floor(); R(2, 4, 12, 8, '#6b4226'); R(3, 5, 10, 5, '#8b5a2b'); R(4, 12, 2, 3, 'woodD'); R(10, 12, 2, 3, 'woodD'); R(7, 3, 2, 3, 'gold'); R(7, 2, 2, 1, '#ff9a3a'); break;
      case 'b': floor(); R(3, 2, 10, 13, '#8b5a2b'); R(3, 5, 10, 1, '#3a2a14'); R(3, 11, 10, 1, '#3a2a14'); R(4, 2, 8, 2, '#a87440'); R(12, 3, 1, 11, '#5e3a1a'); break;
      case 'p': floor(); R(0, 3, 16, 4, '#5e3a1a'); R(0, 7, 16, 4, '#8b5a2b'); R(1, 11, 2, 3, '#3a2010'); R(13, 11, 2, 3, '#3a2010'); break;
      case 'A': floor(); R(1, 6, 14, 10, 'white'); R(1, 6, 14, 2, 'gold'); R(1, 14, 14, 2, '#d7d7cf'); R(3, 1, 2, 5, 'gold'); R(11, 1, 2, 5, 'gold'); R(3, 0, 2, 1, '#ff9a3a'); R(11, 0, 2, 1, '#ff9a3a'); break;
      case 'G': R(0, 0, 16, 16, 'stone'); R(0, 15, 16, 1, 'stoneD'); R(4, 1, 8, 13, 'ink'); R(5, 2, 3, 5, '#c0392b'); R(8, 2, 3, 5, '#2e86c1'); R(5, 7, 3, 6, '#f4c542'); R(8, 7, 3, 6, '#27ae60'); R(7, 2, 2, 11, 'ink'); break;
      case 'X': if (theme === 'ember') { R(0, 0, 16, 16, '#2a0a04'); R(1, 1, 6, 5, '#4a1a0a'); R(9, 3, 6, 6, '#4a1a0a'); R(3, 9, 7, 6, '#4a1a0a'); R(6, 6, 4, 1, '#ff7a1a'); R(9, 6, 1, 3, '#ff7a1a'); R(2, 13, 3, 1, '#ffb066'); break; }
        if (theme === 'tower') { R(0, 0, 16, 16, '#16121f'); for (let y = 0; y < 16; y += 4) { R(0, y, 16, 1, '#2a2440'); for (let x = (y / 4) % 2 ? 4 : 0; x < 16; x += 8) R(x, y, 1, 4, '#2a2440'); } R(6, 6, 2, 2, '#5b2a6e'); break; }
        if (arc) { R(0, 0, 16, 16, '#162b30'); for (let y = 1; y < 16; y += 5) { R(0, y + 3, 16, 1, '#4a3420'); for (let x = 1, i = 0; x < 15; x += 2, i++) R(x, y, 1, 3, ['#c0392b', '#2e86c1', '#f4c542', '#27ae60', '#8e44ad'][(i + y) % 5]); } break; }
        if (theme === 'castle') { R(0, 0, 16, 16, '#141018'); for (let y = 0; y < 16; y += 4) { R(0, y, 16, 1, '#2a2434'); for (let x = (y / 4) % 2 ? 4 : 0; x < 16; x += 8) R(x, y, 1, 4, '#2a2434'); } R(11, 9, 2, 2, '#c0392b'); break; }
        R(0, 0, 16, 16, CD); R(1, 1, 6, 5, CF); R(9, 3, 6, 6, CF); R(3, 9, 7, 6, CF); R(2, 2, 3, 1, CL); R(10, 4, 3, 1, CL); R(4, 10, 3, 1, CL); break;
      case 'J': caveFloor(); R(1, 0, 14, 2, '#3a3a44'); for (let x = 2; x < 15; x += 3) R(x, 0, 2, 16, '#5a5a66'); R(1, 8, 14, 2, '#3a3a44'); break;
      case 'E': base(); R(2, 3, 12, 13, '#14101c'); R(1, 0, 3, 5, '#14101c'); R(12, 0, 3, 5, '#14101c'); R(6, 1, 4, 4, '#14101c'); R(6, 10, 4, 6, '#3a1a2a'); R(7, 11, 2, 5, '#000000'); R(3, 6, 2, 2, '#c0392b'); R(11, 6, 2, 2, '#c0392b'); R(7, 2, 2, 2, '#7fff7f'); break;
      case 'C': caveFloor(); break;
      case 'c': caveFloor(); R(4, 9, 2, 2, 'caveD'); R(11, 4, 2, 2, 'caveD'); R(4, 9, 1, 1, 'caveL'); break;
      case '<': caveFloor(); R(2, 2, 12, 12, CL); R(4, 4, 8, 8, 'sand'); R(6, 6, 4, 4, 'white'); break;
      case '>': caveFloor(); for (let i = 0; i < 4; i++) R(2 + i, 3 + i * 3, 12 - i * 2, 3, i % 2 ? CD : 'ink'); break;
      default: R(0, 0, 16, 16, ['cave', 'ember', 'tower', 'ice', 'crag', 'blight', 'ruins', 'mire', 'canyon', 'castle'].includes(theme) && !OW || arc ? CD : OW ? OW.g : theme === 'tavern' ? '#6b4226' : theme === 'church' ? SGC.stone : 'grass');
    }
  });
}
const SG_LOOKS = {
  king:  { A: { hair: 'bald', beard: 1, shirt: 2, body: 'coat', cape: 1 }, colors: { 0: '#f2c29a', 1: '#f4c542', 2: '#8e2c3a', 3: '#1a1010' }, crown: true },
  guard: { A: { hair: 'peaked', capC: 1, shirt: 2, pants: 3, badge: 1 }, colors: { 0: '#f2c29a', 1: '#c9d3e0', 2: '#7f8c8d', 3: '#141420' } },
  man:   { A: TR_ARCH.man, colors: { 0: '#f2c29a', 1: '#a3d977', 2: '#3f7f3f', 3: '#2a1a10' } },
  lass:  { A: TR_ARCH.lass, colors: { 0: '#f2c29a', 1: '#f7a8c8', 2: '#b0477a', 3: '#3a2010' } },
  kid:   { A: TR_ARCH.kid, colors: { 0: '#f2c29a', 1: '#f4d03f', 2: '#2e86c1', 3: '#3a2010' } },
  elder: { A: TR_ARCH.elder, colors: { 0: '#f2c29a', 1: '#e5e5e5', 2: '#6c5b7b', 3: '#2a2030' } },
  queen: { A: { hair: 'long', shirt: 1, body: 'dress', cape: 1 }, colors: { 0: '#e8b48a', 1: '#7fd6d0', 2: '#1f618d', 3: '#2a1a10' }, crown: true },
  sailor: { A: TR_ARCH.sailor || TR_ARCH.man, colors: { 0: '#e8b48a', 1: '#ffffff', 2: '#2e86c1', 3: '#1a1a2a' } },
  priest: { A: { hair: 'short', shirt: 1, body: 'dress' }, colors: { 0: '#f2c29a', 1: '#f6f6f0', 2: '#d4ac0d', 3: '#3a3a3a' } },
  barkeep: { A: TR_ARCH.shop || TR_ARCH.man, colors: { 0: '#f2c29a', 1: '#f6f6f0', 2: '#8b5a2b', 3: '#2a1a10' } },
  archmage: { A: { hair: 'long', shirt: 1, body: 'dress', cape: 1 }, colors: { 0: '#f2c29a', 1: '#8e44ad', 2: '#f4c542', 3: '#e5e5e5' }, crown: false },
  ...(typeof SG_LOOKS_MORE !== 'undefined' ? SG_LOOKS_MORE : {}),
};
const sgShipArt = dir => sgCache['ship' + dir] ||= sgCanvas(16, 18, g => {
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); }, f = dir === 'right';
  R(1, 11, 14, 4, '#14141c'); R(2, 11, 12, 3, '#8b5a2b'); R(3, 14, 10, 1, '#5e3a1a'); R(f ? 1 : 13, 10, 2, 2, '#8b5a2b');
  R(7, 1, 1, 10, '#5e3a1a'); R(f ? 8 : 2, 2, 5, 8, '#14141c'); R(f ? 8 : 3, 3, 4, 6, '#f6f6f0'); R(f ? 9 : 4, 5, 2, 1, '#2e86c1'); R(6, 0, 3, 1, '#c0392b');
  R(0, 15, 16, 1, '#7ab8f5');
});
/* Your knight: steel helm with a red plume, red cape, blue tunic and a sword (drawn pixel by pixel) */
const SG_KNIGHT_PAL = { o: '#141420', s: '#dfe5ee', S: '#8e9aae', r: '#d0342c', R: '#7b1e17', b: '#3a5fb0', y: '#f4c542', k: '#f2c29a' };
const SG_KNIGHT = {   // sword in his right hand, a big kite shield on his left arm
  down: ['.......rr.......', '.s....orro......', '.s..oossssoo....', '.s.osssssssso...', '.s.osooooooso...', '.s.osssooSSSo...', '.s.oSSSooSSSo...', '.s..oSSSSSSo....',
    'ysy.obbyyboooooo', '.y.osbbbbbosrrso', '.k.osbbyyborrrro', '...okbbbbbosrrso', '....obbbbbosrrso', '...roSSSSSSosso.', '....oSSooSSo....', '....oSSooSSo....', '....ooo..ooo....', '................'],
  up: ['.......rr.......', '......orro......', '....oossssoo..s.', '...osssssssso.s.', '...osssssssso.s.', '...oSsssssSSo.s.', '...oSSSSSSSSo.s.', '....oSSSSSSo..s.',
    'oooooorrrrrroysy', 'oSSSSorrrrrro.y.', 'oSSSSorrrrRro.k.', 'oSSSSorrrrRro...', 'oSSSSoRrrRrro...', '.oSSo.rrrrrrro..', '...ooSSooSSoo...', '....oSSooSSo....', '....ooo..ooo....', '................'],
  side: ['........rr......', '.......orro...s.', '.....oossssoo.s.', '....osssssssso.s', '...ooooossssso.s', '....oSSSsssSso.s', '....oSSSSSSSSo.s', 'ooooooSSSSSSo.ys',
    'osrsobbbbborrry.', 'orrrobbbbborrk..', 'osrsoyybbborrr..', 'osrsobbbbborr...', 'osrsobbbbborrr..', '.osooSSSSSSorr..', '....oSSooSSo.r..', '....oSSooSSo....', '....ooo..ooo....', '................'],
};
const SG_KNIGHT_STEP = { down: ['....oSSooSSo....', '....oSSo.ooo....', '....ooo.........'], up: ['....oSSooSSo....', '....ooo.oSSo....', '.........ooo....'], side: ['...oSSo..oSSo...', '...oSSo...oSSo..', '...ooo....ooo...'] };
function sgKnightArt(dir, step) {
  return sgCache['kn' + dir + (step ? 1 : 0)] ||= sgCanvas(16, 18, g => {
    const face = dir === 'up' ? 'up' : dir === 'down' ? 'down' : 'side';
    let rows = SG_KNIGHT[face].slice(); if (step) rows.splice(14, 3, ...SG_KNIGHT_STEP[face]);
    if (dir === 'right') rows = rows.map(r => [...r].reverse().join(''));
    rows.forEach((r, y) => [...r].forEach((c, x) => { if (SG_KNIGHT_PAL[c]) { g.fillStyle = SG_KNIGHT_PAL[c]; g.fillRect(x, y, 1, 1); } }));
  });
}
function sgPersonArt(look, dir, step) {
  if (look === 'knight') return sgKnightArt(dir, step);
  return sgCache[`p${look}${dir}${step ? 1 : 0}`] ||= sgCanvas(16, 18, g => {
    const H = SG_HEROES[look], L = H ? { A: H.look, colors: H.colors } : SG_LOOKS[look] || SG_LOOKS.man;
    let G = trSpriteGrid(L.A, dir === 'up' ? 'up' : dir === 'down' ? 'down' : 'side', step, false);
    if (dir === 'right') G = G.map(r => r.slice().reverse());
    G.forEach((r, y) => r.forEach((c, x) => { if (c >= 0) { g.fillStyle = L.colors[c]; g.fillRect(x, y, 1, 1); } }));
    if (L.crown) { g.fillStyle = '#f4c542'; g.fillRect(5, 0, 6, 2); g.fillRect(5, 0, 1, 1); g.fillStyle = '#c0392b'; g.fillRect(7, 1, 2, 1); }
    if (H) sgClassGear(g, look, dir);
  });
}
/* what makes each class recognizable: bows, staffs, hoods, helmets, shields, books and lutes */
function sgClassGear(g, key, dir) {
  const face = dir === 'up' ? 'up' : dir === 'down' ? 'down' : 'side', flip = dir === 'right';
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(flip ? 16 - x - w : x, y, w, h); };
  const O = '#141420';
  const dome = (c, sides = 3) => { R(6, 1, 4, 1, c); R(5, 2, 6, 1, c); R(4, 3, 8, 1, c); if (sides) { R(3, 4, 1, sides, c); R(12, 4, 1, sides, c); } };   // follows the round head
  if (key === 'ranger') {
    dome('#2e6b2e'); R(7, 1, 2, 1, '#4f9a3c');   // green hood
    if (face === 'up') { R(9, 5, 3, 8, '#6b4226'); R(9, 4, 1, 2, '#f6f6f0'); R(11, 4, 1, 2, '#f6f6f0'); R(10, 3, 1, 2, '#c0392b'); }   // quiver of arrows
    else if (face === 'down') { R(13, 4, 1, 1, '#8b5a2b'); R(14, 5, 1, 7, '#8b5a2b'); R(13, 12, 1, 1, '#8b5a2b'); R(13, 5, 1, 7, '#e8e8e8'); }   // bow in the right hand
    else { R(1, 4, 1, 1, '#8b5a2b'); R(0, 5, 1, 7, '#8b5a2b'); R(1, 12, 1, 1, '#8b5a2b'); R(1, 5, 1, 7, '#e8e8e8'); R(10, 6, 2, 6, '#6b4226'); R(10, 5, 1, 1, '#f6f6f0'); }
  } else if (key === 'monk') {
    const x = face === 'side' ? 1 : 13;
    R(x, 1, 1, 16, '#8b5a2b'); R(x - 1, 0, 3, 2, '#f4c542');   // quarterstaff
    if (face !== 'up') { for (let i = 0; i < 4; i++) R(5 + i * 2, 9, 1, 1, '#5e3a1a'); R(7, 10, 2, 1, '#5e3a1a'); }   // prayer beads
    R(4, 13, 8, 1, '#c0392b');   // sash
  } else if (key === 'rogue') {
    dome('#2c2c3e', 4);   // dark hood
    if (face === 'down') { R(5, 7, 6, 2, '#2c2c3e'); R(13, 9, 1, 4, '#dfe5ee'); R(13, 13, 1, 1, '#f4c542'); R(2, 9, 1, 4, '#dfe5ee'); R(2, 13, 1, 1, '#f4c542'); }   // face mask, two daggers
    else if (face === 'side') { R(3, 7, 4, 2, '#2c2c3e'); R(1, 9, 1, 4, '#dfe5ee'); R(1, 13, 1, 1, '#f4c542'); }
    else { R(4, 3, 8, 6, '#2c2c3e'); R(6, 9, 4, 1, '#8e2c3a'); }   // hood from behind, belt
  } else if (key === 'paladin') {
    dome('#dfe5ee', 2); R(6, 1, 4, 1, '#8e9aae'); R(7, 0, 2, 2, '#f4c542');   // round silver helm with a small gold crest
    if (face === 'down') { R(1, 8, 4, 6, '#f6f6f0'); R(1, 8, 4, 1, '#f4c542'); R(2, 9, 2, 4, '#f6f6f0'); R(2, 10, 2, 1, '#f4c542'); R(2.5, 9, 1, 4, '#f4c542'); R(13, 5, 1, 7, '#dfe5ee'); R(12, 11, 3, 1, '#f4c542'); }
    else if (face === 'side') { R(0, 8, 3, 6, '#f6f6f0'); R(1, 9, 1, 4, '#f4c542'); R(0, 10, 3, 1, '#f4c542'); }
    else { R(5, 7, 6, 7, '#f6f6f0'); R(7, 8, 2, 5, '#f4c542'); R(6, 9, 4, 1, '#f4c542'); }   // cape with a gold cross
  } else if (key === 'scribe') {
    if (face !== 'up') { const x = face === 'side' ? 1 : 12; R(x, 9, 3, 4, '#7a2f3a'); R(x, 9, 3, 1, '#f4c542'); R(x + 1, 10, 1, 2, '#f6f6f0'); R(face === 'side' ? 2 : 3, 7, 1, 4, '#f6f6f0'); }   // spellbook and quill
  } else if (key === 'cantor') {
    if (face !== 'up') { const x = face === 'side' ? 0 : 11; R(x, 9, 4, 4, '#c8955a'); R(x + 1, 10, 2, 2, '#5e3a1a'); R(x + (face === 'side' ? 3 : 0), 6, 1, 4, '#8b5a2b'); }   // lute
    else { R(4, 7, 4, 5, '#c8955a'); R(5, 9, 2, 2, '#5e3a1a'); }
  }
}
function sgChestArt(open, locked) {
  return sgCache[`chest${open ? 1 : 0}${locked ? 1 : 0}`] ||= sgCanvas(16, 16, g => {
    const R = (x, y, w, h, c) => { g.fillStyle = SGC[c] || c; g.fillRect(x, y, w, h); };
    R(1, 5, 14, 10, 'ink'); R(2, 6, 12, 8, locked ? 'purple' : 'wood'); R(2, 9, 12, 1, 'woodD');
    if (open) { R(2, 2, 12, 4, 'ink'); R(3, 3, 10, 2, 'woodD'); R(3, 6, 10, 3, 'ink'); }
    else { R(2, 4, 12, 3, locked ? '#6c3483' : 'woodD'); R(7, 8, 2, 3, 'gold'); }
    R(2, 6, 1, 8, 'gold'); R(13, 6, 1, 8, 'gold');
    if (locked && !open) { R(6, 7, 4, 4, 'gold'); R(7, 8, 2, 2, 'ink'); }
  });
}
const sgSealArt = () => sgCache.seal ||= sgCanvas(16, 16, g => { g.strokeStyle = '#c39bd3'; g.lineWidth = 1; g.beginPath(); g.arc(8, 8, 6, 0, 7); g.stroke(); g.fillStyle = '#f5eef8'; g.fillRect(7, 3, 2, 10); g.fillRect(3, 7, 10, 2); g.fillStyle = '#8e44ad'; g.fillRect(6, 6, 4, 4); });

/* Monster kit: shapes on a 32x32 grid, shaded and outlined automatically. Colors: 0 outline, 1 dark, 2 mid, 3 light, 4 accent, 5 white, 6 pupil */
function sgMonsterArt(key) {
  return sgCache['m' + key] ||= sgCanvas(32, 32, g => {
    const M = SG_MONSTERS[key], G = [...Array(32)].map(() => Array(32).fill(-1));
    const P = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < 32 && y >= 0 && y < 32) G[y][x] = c; };
    const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(x + i, y + j, c); };
    const ell = (cx, cy, rx, ry, c) => { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) P(x, y, c); };
    const poly = (pts, c) => { const ys = pts.map(p => p[1]); for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++) { const xs = []; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; if ((y1 <= y + 0.5) !== (y2 <= y + 0.5)) xs.push(x1 + (y + 0.5 - y1) * (x2 - x1) / (y2 - y1)); } xs.sort((a, b) => a - b); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= xs[k + 1] - 0.5; x++) P(x, y, c); } };
    const line = (x0, y0, x1, y1, c, w = 1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) rect(Math.round(x0 + (x1 - x0) * i / n - (w - 1) / 2), Math.round(y0 + (y1 - y0) * i / n - (w - 1) / 2), w, w, c); };
    const eye = (x, y, r = 2.2) => { ell(x, y, r, r, 5); ell(x + 0.6, y + 0.6, r * 0.5, r * 0.5, 6); };
    switch (M.art) {
      case 'blot': ell(16, 20, 10, 7, 2); ell(8, 16, 4, 4, 2); ell(24, 15, 4, 4, 2); ell(12, 12, 4, 4, 2); ell(21, 11, 4.5, 4, 2); ell(16, 10, 3, 3, 2); rect(9, 25, 2, 4, 2); ell(10, 29, 1.6, 1.6, 2); rect(21, 25, 2, 3, 2); ell(26, 7, 1.6, 1.6, 2); ell(5, 9, 1.2, 1.2, 2);
        eye(12, 18, 3); eye(20, 18, 3); line(13, 23, 19, 23, 4); P(12, 22, 4); P(20, 22, 4); break;
      case 'rat': ell(18, 21, 9, 6, 2); ell(8, 17, 6, 5, 2); ell(5, 11, 2, 3, 3); ell(10, 11, 2, 3, 3); line(26, 22, 31, 14, 1, 2); rect(11, 25, 3, 4, 1); rect(21, 25, 3, 4, 1); eye(6, 16, 1.8); P(2, 18, 4); P(3, 18, 4);
        rect(15, 17, 2, 4, 4); rect(19, 16, 2, 2, 4); rect(19, 19, 4, 1, 4); break;
      case 'hound': ell(18, 19, 10, 7, 2); ell(7, 14, 6, 6, 2); rect(1, 15, 5, 4, 2); poly([[4, 9], [6, 3], [9, 9]], 1); poly([[8, 9], [11, 4], [12, 10]], 1); rect(10, 24, 3, 6, 1); rect(14, 24, 3, 6, 2); rect(21, 24, 3, 6, 1); rect(25, 24, 3, 6, 2);
        line(27, 16, 31, 9, 1, 3); P(5, 12, 4); P(6, 12, 4); P(1, 15, 6); rect(2, 18, 4, 1, 5); break;
      case 'imp': poly([[5, 8], [12, 14], [10, 22], [2, 16]], 1); poly([[27, 8], [20, 14], [22, 22], [30, 16]], 1); ell(16, 21, 6, 7, 2); ell(16, 11, 6, 6, 2); poly([[10, 7], [9, 1], [13, 5]], 4); poly([[22, 7], [23, 1], [19, 5]], 4);
        eye(13, 11, 1.8); eye(19, 11, 1.8); line(13, 15, 19, 15, 0); rect(12, 27, 3, 3, 1); rect(17, 27, 3, 3, 1); line(22, 26, 29, 29, 1, 1); poly([[29, 27], [31, 30], [28, 31]], 4); line(6, 30, 9, 6, 4, 1); poly([[7, 4], [11, 4], [9, 0]], 5); break;
      case 'moth': poly([[16, 14], [2, 3], [1, 13], [14, 17]], 2); poly([[16, 14], [30, 3], [31, 13], [18, 17]], 2); poly([[15, 17], [4, 19], [7, 28], [15, 21]], 1); poly([[17, 17], [28, 19], [25, 28], [17, 21]], 1);
        ell(16, 17, 2.5, 8, 3); line(15, 9, 11, 2, 0); line(17, 9, 21, 2, 0); ell(7, 9, 2, 2, 4); ell(25, 9, 2, 2, 4); rect(5, 13, 5, 1, 4); rect(22, 13, 5, 1, 4); eye(15, 11, 1.2); eye(17.5, 11, 1.2); if (key === 'lanternfly') ell(16, 26, 3, 3, 4); break;
      case 'crab': ell(16, 21, 10, 6, 2); ell(5, 12, 4.5, 4, 2); ell(27, 12, 4.5, 4, 2); rect(3, 9, 4, 2, -1); rect(25, 9, 4, 2, -1); line(9, 18, 6, 15, 2, 2); line(23, 18, 26, 15, 2, 2);
        for (const x of [8, 12, 20, 24]) line(x, 25, x + (x < 16 ? -3 : 3), 30, 1, 1); line(13, 15, 13, 10, 1); line(19, 15, 19, 10, 1); eye(13, 9, 1.8); eye(19, 9, 1.8); line(22, 17, 30, 4, 4, 1); poly([[29, 2], [31, 6], [27, 5]], 5); break;
      case 'shroom': ell(16, 11, 12, 8, 2); rect(4, 12, 25, 6, -1); rect(11, 13, 10, 13, 3); ell(16, 12, 12, 2, 1); ell(9, 8, 2, 2, 4); ell(17, 5, 2, 2, 4); ell(23, 9, 2.5, 2, 4);
        eye(13, 18, 1.8); eye(19, 18, 1.8); line(14, 22, 18, 22, 0); rect(9, 26, 5, 3, 1); rect(18, 26, 5, 3, 1); break;
      case 'wisp': ell(16, 13, 9, 9, 2); poly([[7, 14], [25, 14], [24, 26], [20, 22], [16, 29], [12, 22], [8, 26]], 2); ell(6, 17, 3, 2, 3); ell(26, 17, 3, 2, 3);
        ell(12, 12, 2, 2.5, 6); ell(20, 12, 2, 2.5, 6); ell(16, 18, 1.5, 2, 6); P(11, 11, 5); P(19, 11, 5); break;
      case 'bat': poly([[14, 15], [1, 6], [3, 13], [1, 20], [7, 18], [10, 23], [14, 19]], 1); poly([[18, 15], [31, 6], [29, 13], [31, 20], [25, 18], [22, 23], [18, 19]], 1); ell(16, 17, 5.5, 7, 2);
        poly([[11, 12], [12, 5], [15, 11]], 2); poly([[21, 12], [20, 5], [17, 11]], 2); eye(14, 15, 1.6); eye(18, 15, 1.6); P(14, 20, 5); P(18, 20, 5); P(14, 21, 5); P(18, 21, 5); break;
      case 'book': poly([[3, 9], [16, 12], [29, 9], [29, 25], [16, 28], [3, 25]], 2); poly([[5, 11], [16, 13], [16, 25], [5, 23]], 5); poly([[27, 11], [16, 13], [16, 25], [27, 23]], 5);
        for (let x = 6; x < 27; x += 3) poly([[x, 18], [x + 1.5, 21], [x + 3, 18]], 5); rect(5, 17, 22, 1, 0); line(16, 12, 16, 27, 1); eye(10, 6, 2.2); eye(22, 6, 2.2); rect(8, 13, 5, 1, 4); rect(19, 13, 5, 1, 4); break;
      case 'golem': rect(8, 12, 16, 14, 2); rect(11, 3, 10, 9, 2); rect(3, 13, 5, 11, 1); rect(24, 13, 5, 11, 1); rect(9, 26, 5, 5, 1); rect(18, 26, 5, 5, 1);
        rect(13, 7, 2, 2, 4); rect(17, 7, 2, 2, 4); line(12, 16, 20, 16, 4); line(16, 14, 16, 22, 4); line(12, 22, 20, 18, 4); break;
      case 'beetle': ell(16, 19, 11, 8, 2); rect(15, 11, 2, 16, 1); ell(16, 9, 5, 4, 2); line(13, 6, 8, 1, 0); line(19, 6, 24, 1, 0); poly([[12, 6], [9, 2], [14, 5]], 4);
        for (const [x, y] of [[6, 17], [5, 22], [7, 26]]) { line(x, y, x - 4, y + 2, 1, 1); line(32 - x, y, 36 - x, y + 2, 1, 1); } ell(11, 16, 2, 2, 3); ell(21, 16, 2, 2, 3); eye(14, 9, 1.3); eye(18, 9, 1.3); break;
      case 'cactus': rect(11, 6, 10, 22, 2); ell(16, 6, 5, 4, 2); rect(4, 12, 5, 9, 2); rect(4, 19, 8, 4, 2); rect(23, 9, 5, 9, 2); rect(20, 16, 8, 4, 2); ell(16, 2, 2.5, 2, 4); ell(13, 1.5, 1.5, 1.5, 4); ell(19, 1.5, 1.5, 1.5, 4);
        for (const [x, y] of [[12, 10], [19, 14], [13, 22], [5, 14], [26, 11]]) P(x, y, 3); eye(13.5, 12, 1.8); eye(18.5, 12, 1.8); line(14, 17, 18, 17, 0); rect(8, 28, 16, 3, 1); break;
      case 'bird': ell(16, 18, 7, 6, 2); ell(16, 10, 5, 5, 2); poly([[10, 15], [1, 6], [2, 14], [9, 21]], 3); poly([[22, 15], [31, 6], [30, 14], [23, 21]], 3); poly([[14, 12], [16, 16], [18, 12]], 4);
        line(13, 24, 12, 29, 4, 1); line(19, 24, 20, 29, 4, 1); poly([[12, 23], [16, 30], [20, 23]], 1); eye(13.5, 9, 1.5); eye(18.5, 9, 1.5); break;
      case 'serpent': for (let i = 0; i <= 20; i++) { const t = i / 20, x = 4 + t * 22, y = 26 - Math.sin(t * Math.PI * 1.5) * 9 - t * 6; ell(x, y, 4.2 - t * 0.8 + (i > 16 ? 1.6 : 0), 4.2 - t * 0.8 + (i > 16 ? 1.6 : 0), 2); }
        ell(26, 9, 5.5, 4.5, 2); poly([[24, 12], [31, 13], [26, 15]], 1); poly([[23, 5], [21, 0], [26, 4]], 4); poly([[28, 5], [30, 0], [30, 5]], 4); for (let i = 3; i <= 17; i += 4) ell(4 + i * 1.1, 24 - Math.sin(i / 20 * Math.PI * 1.5) * 9 - i * 0.3, 1.5, 1.5, 4);
        eye(25, 8, 1.8); P(29, 13, 5); P(27, 13, 5); break;
      case 'sorcerer': rect(1, 3, 4, 5, 5); rect(27, 2, 4, 5, 5); rect(25, 26, 4, 4, 5); rect(2, 24, 3, 4, 5); line(2, 5, 4, 5, 0); line(28, 4, 30, 4, 0);
        poly([[16, 3], [4, 31], [28, 31]], 2); poly([[9, 14], [1, 24], [6, 26], [12, 19]], 1); poly([[23, 14], [31, 22], [27, 25], [20, 19]], 1); ell(16, 10, 6.5, 7, 1); ell(16, 11, 4, 4.5, 0);
        P(14, 11, 6); P(18, 11, 6); P(14, 12, 6); P(18, 12, 6); rect(15, 18, 2, 13, 4); rect(9, 30, 14, 1, 4); rect(21, 17, 8, 6, 5); line(25, 17, 25, 22, 0); line(22, 19, 24, 19, 0); line(26, 19, 28, 19, 0); line(3, 9, 7, 22, 4, 1); poly([[2, 6], [5, 6], [3, 10]], 5); break;
      case 'knight': poly([[16, 4], [4, 30], [28, 30]], 4); rect(9, 13, 14, 15, 2); ell(16, 8, 6, 6.5, 2); rect(11, 7, 10, 5, 5); rect(11, 9, 10, 1, 3); rect(15, 1, 2, 4, 4);
        poly([[1, 14], [8, 14], [8, 23], [4.5, 27], [1, 23]], 3); ell(4.5, 19, 1.5, 2, 5); line(26, 4, 26, 26, 3, 2); rect(23, 21, 7, 2, 1); rect(10, 28, 4, 3, 1); rect(18, 28, 4, 3, 1); rect(11, 17, 10, 1, 1); break;
    }
    // shading: lower-right edges darker, upper-left edges lighter
    const S2 = G.map(r => r.slice());
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (G[y][x] === 2) { if ((G[y + 2]?.[x + 1] ?? -1) < 0) S2[y][x] = 1; else if ((G[y - 2]?.[x - 1] ?? -1) < 0) S2[y][x] = 3; }
    const out = S2.map(r => r.slice());
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) if (S2[y][x] < 0 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (S2[y + dy]?.[x + dx] ?? -1) >= 0)) out[y][x] = 0;
    out.forEach((r, y) => r.forEach((c, x) => { if (c >= 0) { g.fillStyle = M.pal[c]; g.fillRect(x, y, 1, 1); } }));
  });
}

/* ---------- Drawing ---------- */
const SG_W = 160, SG_H = 144, SG_SCALE = 4;
function sgDraw() {
  const cv = $('#sgCanvas'); if (!cv || !sg) return;
  const out = cv.getContext('2d'); out.imageSmoothingEnabled = false;
  const retro = sgPalette()[0] !== 'full', off = retro ? (sg.off ||= Object.assign(document.createElement('canvas'), { width: SG_W, height: SG_H })) : null, g = retro ? off.getContext('2d') : out;
  g.imageSmoothingEnabled = false;
  const sx = sg.shake > 0 ? Math.round(Math.sin(sg.shake * 2.3) * 2) : 0; if (sg.shake > 0) sg.shake--;
  if (retro) g.setTransform(1, 0, 0, 1, sx, 0); else g.setTransform(SG_SCALE, 0, 0, SG_SCALE, sx * SG_SCALE, 0);
  sg.coffins = [];
  if (sg.bt) sgDrawBattle(g); else sgDrawWorld(g);
  if (sg.flash > 0) { g.fillStyle = '#ffffff'; g.globalAlpha = sg.flash / 20; g.fillRect(0, 0, SG_W, SG_H); g.globalAlpha = 1; sg.flash--; }
  if (sg.poisonFlash > 0 && !sg.bt) { g.fillStyle = '#8e44ad'; g.globalAlpha = sg.poisonFlash / 14; g.fillRect(0, 0, SG_W, SG_H); g.globalAlpha = 1; sg.poisonFlash--; }
  if (retro) { sgQuantize(off); out.setTransform(1, 0, 0, 1, 0, 0); out.drawImage(off, 0, 0, SG_W * SG_SCALE, SG_H * SG_SCALE); }
  // night: the outdoors get dark (inside buildings stays bright)
  { const a = !sg.bt && typeof sgNightAlpha === 'function' ? sgNightAlpha() : 0; if (a > 0) { out.setTransform(1, 0, 0, 1, 0, 0); out.fillStyle = `rgba(8,14,46,${a.toFixed(3)})`; out.fillRect(0, 0, cv.width, cv.height); } }
  // a fallen friend follows along as a ⚰️ until revived: drawn last, at full screen size, so it is the device's own emoji, not a pixel sprite
  if (sg.coffins.length) {
    out.setTransform(1, 0, 0, 1, 0, 0); out.font = `${15 * SG_SCALE}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; out.textAlign = 'center'; out.textBaseline = 'middle';
    for (const [x, y] of sg.coffins) out.fillText('⚰️', (x + 8 + sx) * SG_SCALE, (y + 10) * SG_SCALE);
    out.textAlign = 'left';
  }
}
function sgDrawWorld(g) {
  const s = sgS(), m = SG_MAPS[s.map], W = m.rows[0].length, H = m.rows.length;
  let px = s.x, py = s.y, step = 0;
  if (sg.moving) { const k = sg.moving.t; px = sg.moving.fx + (sg.moving.tx - sg.moving.fx) * k; py = sg.moving.fy + (sg.moving.ty - sg.moving.fy) * k; step = k > 0.25 && k < 0.75 ? 1 : 0; }
  const camX = W * 16 <= SG_W ? (W * 16 - SG_W) / 2 : Math.max(0, Math.min(W * 16 - SG_W, px * 16 - 72)), camY = H * 16 <= SG_H ? (H * 16 - SG_H) / 2 : Math.max(0, Math.min(H * 16 - SG_H, py * 16 - 64));
  g.fillStyle = '#000'; g.fillRect(0, 0, SG_W, SG_H);
  const x0 = Math.max(0, Math.floor(camX / 16)), y0 = Math.max(0, Math.floor(camY / 16));
  for (let y = y0; y <= y0 + 10 && y < H; y++) for (let x = x0; x <= x0 + 11 && x < W; x++) g.drawImage(sgTileArt(m.gates ? sgTile(s.map, x, y) : m.rows[y][x], m.theme), Math.round(x * 16 - camX), Math.round(y * 16 - camY));
  const ox = x => Math.round(x * 16 - camX), oy = y => Math.round(y * 16 - camY);
  for (let y = y0; y <= y0 + 10 && y < H; y++) for (let x = x0; x <= x0 + 11 && x < W; x++) {
    if (!'dQV'.includes(m.rows[y][x]) || m.rows[y][x] !== 'd') continue;
    const wave = Math.floor(sg.frame / 20 + x + y) % 2, X = ox(x), Y = oy(y);
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      if ((m.rows[y + dy] || '')[x + dx] !== 'W') continue;
      const [rx, ry, rw, rh] = dy === -1 ? [0, 0, 16, 4] : dy === 1 ? [0, 12, 16, 4] : dx === -1 ? [0, 0, 4, 16] : [12, 0, 4, 16];
      g.fillStyle = '#c9a85e'; g.fillRect(X + rx, Y + ry, rw, rh);
      g.fillStyle = '#ffffff'; const fx = dy ? X : X + (dx === -1 ? 0 : 15), fy = dx ? Y : Y + (dy === -1 ? 0 : 15);
      for (let i = wave; i < 16; i += 3) dy ? g.fillRect(fx + i, fy, 2, 1) : g.fillRect(fx, fy + i, 1, 2);
    }
  }
  for (const o of sgObjs(s.map)) {
    if (o.type === 'chest' || o.type === 'lockChest') g.drawImage(sgChestArt(!!s.got[o.id], o.type === 'lockChest'), ox(o.x), oy(o.y));
    else if (o.type === 'colorChest') g.drawImage(sgColorChestArt(o.color, !!s.got[o.id]), ox(o.x), oy(o.y));
    else if (o.type === 'seal') { g.globalAlpha = 0.7 + 0.3 * Math.sin(sg.frame / 8); g.drawImage(sgSealArt(), ox(o.x), oy(o.y)); g.globalAlpha = 1; }
    else if (o.type === 'npc') g.drawImage(sgPersonArt(o.look, 'down', 0), ox(o.x), oy(o.y) - 2);
    else if (o.type === 'hidden') { if ((sg.frame + o.x * 37) % 140 < 10) { g.fillStyle = '#ffffff'; const X = ox(o.x) + 7, Y = oy(o.y) + 6; g.fillRect(X, Y - 2, 1, 5); g.fillRect(X - 2, Y, 5, 1); } }
    else if (o.type === 'lever') { const on = sgLeverState(o.id), X = ox(o.x), Y = oy(o.y); g.fillStyle = '#2a2434'; g.fillRect(X + 3, Y + 11, 10, 4); g.fillStyle = '#8a8a96'; g.fillRect(on ? X + 9 : X + 5, Y + 4, 2, 8); g.fillStyle = '#c0392b'; g.fillRect(on ? X + 9 : X + 4, Y + 2, 3, 3);
      if (on) { g.fillStyle = sg.frame % 10 < 5 ? '#ffb066' : '#f4c542'; g.fillRect(X + 1, Y + 1, 3, 4); g.fillStyle = '#ff7a1a'; g.fillRect(X + 1, Y + 4, 3, 2); } }
    else if (o.type === 'plate') { const lit = (sg.plates || []).includes(o.id) || sgS().flags[Object.values(SG_MAPS[sgS().map].gates || {})[0]], X = ox(o.x), Y = oy(o.y);
      g.fillStyle = lit ? '#f4c542' : '#5a5268'; g.fillRect(X + 2, Y + 2, 12, 12); g.fillStyle = lit ? '#fff3a0' : '#3a3446'; g.fillRect(X + 4, Y + 4, 8, 8); g.font = '8px sans-serif'; g.textBaseline = 'top'; g.fillText(o.symbol, X + 4, Y + 4); }
    else if (o.type === 'statue') { const ok = sgS().flags['st:' + o.id], X = ox(o.x), Y = oy(o.y) - 4; g.fillStyle = '#6a6478'; g.fillRect(X + 4, Y + 2, 8, 6); g.fillRect(X + 3, Y + 8, 10, 8); g.fillStyle = '#4a4458'; g.fillRect(X + 2, Y + 16, 12, 4);
      g.fillStyle = ok ? '#f4c542' : '#1a1622'; g.fillRect(X + 5, Y + 4, 2, 1); g.fillRect(X + 9, Y + 4, 2, 1); }
    else if (o.type === 'plaque') { const X = ox(o.x), Y = oy(o.y); g.fillStyle = '#6a6478'; g.fillRect(X + 3, Y + 2, 10, 13); g.fillStyle = '#4a4458'; g.fillRect(X + 3, Y + 13, 10, 2); g.fillStyle = '#2a2434'; for (let i = 0; i < 4; i++) g.fillRect(X + 5, Y + 4 + i * 2, 6, 1); }
    else if (typeof sgDrawObjMore === 'function' && sgDrawObjMore(g, o, ox, oy)) { /* drawn by saga-part8.js */ }
    else g.drawImage(sgMonsterArt(o.group[0]), ox(o.x) - (o.type === 'boss' ? 4 : 0), oy(o.y) - (o.type === 'boss' ? 8 : 0) + Math.round(Math.sin(sg.frame / 10)), o.type === 'boss' ? 24 : 16, o.type === 'boss' ? 24 : 16);
  }
  if (!s.boat && s.shipAt && s.shipMap === s.map) { const [bx, by] = s.shipAt.split(',').map(Number); g.drawImage(sgShipArt('left'), ox(bx), oy(by) - 2 + Math.round(Math.sin(sg.frame / 12))); }
  for (const n of sgNpcs(s.map)) g.drawImage(sgPersonArt(n.look, n.dir, 0), ox(n.x), oy(n.y) - 2);
  // party: followers walk behind the leader
  const party = s.party;
  for (let i = party.length - 1; i >= 1; i--) { const t = sg.trail[i - 1]; if (!t || s.boat || s.fly || SG_MAPS[s.map].camp || sgTile(s.map, t.x, t.y) === 'W') continue; if (party[i].hp <= 0) sg.coffins.push([ox(t.x), oy(t.y) - 2]); else g.drawImage(sgPersonArt(party[i].key, t.dir, step), ox(t.x), oy(t.y) - 2); }
  if (s.fly && typeof sgAirshipArt === 'function') { const X = Math.round(px * 16 - camX), Y = Math.round(py * 16 - camY); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(X + 3, Y + 15, 10, 2); g.drawImage(sgAirshipArt(s.dir), X, Y - 8 + Math.round(Math.sin(sg.frame / 12) * 1.5)); }
  else if (s.boat || (sg.moving && sgTile(s.map, sg.moving.tx, sg.moving.ty) === 'W' && s.flags.ship)) g.drawImage(sgShipArt(s.dir === 'right' ? 'right' : 'left'), Math.round(px * 16 - camX), Math.round(py * 16 - camY) - 2 + Math.round(Math.sin(sg.frame / 10)));
  else g.drawImage(sgPersonArt(party[0].key, s.dir, step), Math.round(px * 16 - camX), Math.round(py * 16 - camY) - 2);
  if (sg.banner && sg.frame < sg.banner.until && !sg.ui) { const bt = gtLine(sg.banner.text, sgLang(), sgNames()); sgWin2(g, 4, 4, Math.min(152, sgTextW(g, bt) + 14), 16, () => sgText(g, bt, 11, 8)); }
}
const sgTextW = (g, t) => { g.font = 'bold 7px monospace'; return Math.ceil(g.measureText(t).width); };
const sgText = (g, t, x, y, c = '#ffffff') => { g.font = 'bold 7px monospace'; g.textBaseline = 'top'; g.fillStyle = c; g.fillText(t, x, y); };
function sgWin2(g, x, y, w, h, inner) {   // classic window: dark blue, white rounded border
  g.fillStyle = '#0a1450'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = '#ffffff'; g.fillRect(x + 2, y, w - 4, 1); g.fillRect(x + 2, y + h - 1, w - 4, 1); g.fillRect(x, y + 2, 1, h - 4); g.fillRect(x + w - 1, y + 2, 1, h - 4);
  g.fillRect(x + 1, y + 1, 1, 1); g.fillRect(x + w - 2, y + 1, 1, 1); g.fillRect(x + 1, y + h - 2, 1, 1); g.fillRect(x + w - 2, y + h - 2, 1, 1);
  inner?.();
}
function sgDrawBattle(g) {
  const b = sg.bt, s = sgS(), th = s.boat ? 'sea' : SG_MAPS[s.map].theme;
  const BG = { snow: ['#9fc4e0', '#e8f0f6', '#ffffff'], crag: ['#6a7a9a', '#8f9a6a', '#a8b080'], blight: ['#1a1222', '#3d3248', '#5f4f6e'], jungle: ['#2a6a4a', '#2f8a2f', '#6fcf5f'],
    swamp: ['#3a4a3a', '#4a5a2f', '#7a8a4f'], canyon: ['#e8a060', '#c4804a', '#f0b07a'], ice: ['#1a3a4a', '#3d6f8a', '#9fc9dd'], ruins: ['#2f3a22', '#6d7f52', '#a3b57a'],
    mire: ['#1e2a17', '#4a5a3a', '#7d8f5c'], castle: ['#0a0612', '#2a2440', '#4a4458'], ember: ['#3a0a00', '#7a2a0a', '#b8541c'], tower: ['#0a0614', '#2a1a40', '#4a3a6a'], cave: ['#2a1d12', '#4a3420', '#5d432a'], archive: ['#10262b', '#2f5a62', '#4f8a93'], desert: ['#e8955a', '#d9b46a', '#f0cf8a'], sea: ['#2a6fb8', '#1f4f99', '#6fb0f5'] }[th] || ['#1d4f8a', '#3d8b45', '#5fb55f'];
  g.fillStyle = '#000'; g.fillRect(0, 0, SG_W, SG_H);
  g.fillStyle = BG[0]; g.fillRect(0, 30, SG_W, 44); g.fillStyle = BG[1]; g.fillRect(0, 74, SG_W, 26);
  g.fillStyle = BG[2]; for (let x = 0; x < SG_W; x += 12) g.fillRect(x + ((x / 12) % 2) * 4, 76, 6, 1);
  if (th === 'desert') { g.fillStyle = '#f7d774'; g.beginPath(); g.arc(130, 46, 9, 0, 7); g.fill(); }
  // party windows
  const n = s.party.length, w = Math.floor((SG_W - 4) / n);
  s.party.forEach((h, i) => {
    const x = 2 + i * w, active = !b.intro && b.hero === i && sg.ui?.type === 'menu';
    sgWin2(g, x, 2, w - 2, 28, () => {
      const c = h.hp <= 0 ? '#e74c3c' : h.hp < sgMax(h, 'hp') / 4 ? '#f39c12' : '#ffffff';
      const tight = w < 36, tx = tight ? x + 3 : x + 4; sgText(g, h.name.slice(0, w > 60 ? 9 : tight ? 5 : 6), tx, 4, active ? '#f4c542' : c); sgText(g, tight ? String(h.hp) : `H${String(h.hp).padStart(3)}`, tx, 12, c); sgText(g, tight ? String(h.mp) : `M${String(h.mp).padStart(3)}`, tight ? tx : x + 4, 20, c);
      if (!tight) sgText(g, `L${h.lv}`, x + w - 18, 20, '#aab7ff'); else { g.fillStyle = c; g.fillRect(x + w - 6, 13, 2, 5); g.fillStyle = '#7fb8ff'; g.fillRect(x + w - 6, 21, 2, 5); }
      let bx = x + w - 10; for (const [k, ch, col] of [['poison', 'P', '#8e44ad'], ['curse', 'C', '#3a1a5a']]) if (h.hp > 0 && h.st?.[k]) { g.fillStyle = col; g.fillRect(bx, 11, 7, 9); g.fillStyle = '#ffffff'; g.fillRect(bx, 11, 7, 1); sgText(g, ch, bx + 1, 12); bx -= 8; }
    });
  });
  // monsters
  const live = b.foes, cnt = live.length, two = cnt > 4, perRow = two ? Math.ceil(cnt / 2) : cnt;
  const big = b.boss && cnt === 1 ? 2.6 : two ? Math.min(1.1, 150 / perRow / 32) : cnt === 1 ? 2 : cnt === 2 ? 1.7 : cnt === 3 ? 1.35 : 1.15, size = Math.round(32 * big);
  const order = live.map((f, i) => i).sort((a, c) => (two && a < perRow ? 0 : 1) - (two && c < perRow ? 0 : 1));   // back row first
  order.forEach(i => {
    const f = live[i];
    if (f.hp <= 0 && !(b.flashFoe[i] > 0)) return;
    const blink = b.flashFoe[i] > 0 && b.flashFoe[i] % 4 < 2; if (b.flashFoe[i] > 0) b.flashFoe[i]--;
    if (blink) return;
    const row = two && i >= perRow ? 1 : 0, col = two ? (row ? i - perRow : i) : i, inRow = two ? (row ? cnt - perRow : perRow) : cnt, gap = (SG_W - inRow * size) / (inRow + 1);
    const x = Math.round(gap + col * (size + gap) + (two && !row ? size / 4 : 0)), y = Math.round((two ? (row ? 98 : 80) : 86) - size + Math.sin((sg.frame + i * 20) / 16) * 1.5);
    g.globalAlpha = f.hp <= 0 ? Math.max(0, (b.flashFoe[i] || 0) / 14) : 1;
    g.drawImage(sgMonsterArt(f.key), x, Math.max(30, y), size, size); g.globalAlpha = 1;
    if (f.tag && cnt > 1) sgText(g, f.tag, x + size - 5, Math.max(30, y) + size - 7, '#ffffff');
  });
  if (b.ward) sgText(g, '🛡', 150, 34);
  if (sg.fx) sgDrawFx(g);
}
/* special attacks show up on screen: a big name banner and an effect */
function sgDrawFx(g) {
  const f = sg.fx, t = f.t++; if (t > 64) { sg.fx = null; return; } if (t === 0 && sgLang()) f.name = gtLine(f.name, sgLang(), sgNames());
  const k = f.kind, fade = t < 8 ? t / 8 : t > 48 ? Math.max(0, (64 - t) / 16) : 1, cx = 80, cy = 62;
  g.save(); g.globalAlpha = fade;
  if (k === 'fire') for (let i = 0; i < 18; i++) { const x = (i * 37 + t * 2) % 160, y = 100 - ((i * 23 + t * 3) % 70), r = 2 + (i % 3); g.fillStyle = i % 3 ? '#ff7a1a' : '#ffd34d'; g.fillRect(x - r, y - r, r * 2, r * 2); }
  else if (k === 'ice') for (let i = 0; i < 16; i++) { const x = (i * 41 + 7) % 160, y = 30 + ((i * 17 + t * 2) % 72); g.fillStyle = i % 2 ? '#ffffff' : '#a8e6ff'; g.beginPath(); g.moveTo(x, y - 4); g.lineTo(x + 3, y); g.lineTo(x, y + 4); g.lineTo(x - 3, y); g.fill(); }
  else if (k === 'bolt') { if (t % 6 < 3) { g.fillStyle = 'rgba(255,255,200,.35)'; g.fillRect(0, 30, 160, 72); } g.strokeStyle = '#ffe04d'; g.lineWidth = 2; for (let j = 0; j < 3; j++) { let x = 40 + j * 40 + ((t * 7 + j * 13) % 9) - 4, y = 30; g.beginPath(); g.moveTo(x, y); while (y < 96) { y += 8; x += ((t + y + j * 5) % 3 - 1) * 6; g.lineTo(x, y); } g.stroke(); } }
  else if (k === 'dark' || k === 'void') { g.fillStyle = k === 'void' ? 'rgba(0,0,0,.55)' : 'rgba(40,10,70,.5)'; g.fillRect(0, 30, 160, 72); g.strokeStyle = k === 'void' ? '#ffffff' : '#c39bd3'; g.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { const r = ((t * 1.6 + i * 20) % 60) + 4; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); } if (k === 'void') { g.fillStyle = '#000000'; g.beginPath(); g.arc(cx, cy, Math.min(18, t / 2), 0, 7); g.fill(); } }
  else if (k === 'wave') for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#2f6fd0' : '#7ab8f5'; for (let x = 0; x < 160; x += 4) g.fillRect(x, 34 + i * 11 + Math.sin((x + t * 6 + i * 20) / 12) * 4, 4, 3); }
  else if (k === 'slash') { g.strokeStyle = '#ffffff'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { const p = Math.min(1, Math.max(0, (t - i * 6) / 10)); if (!p) continue; g.beginPath(); g.moveTo(30 + i * 30, 34); g.lineTo(30 + i * 30 + 60 * p, 34 + 60 * p); g.stroke(); } }
  else if (k === 'holy') for (let i = 0; i < 6; i++) { const x = 12 + i * 27, w = 6 + Math.sin((t + i * 9) / 5) * 3; g.fillStyle = 'rgba(255,230,120,.55)'; g.fillRect(x - w / 2, 30, w, 72); g.fillStyle = '#ffffff'; g.fillRect(x - 1, 30, 2, 72); }
  else if (k === 'heal') for (let i = 0; i < 12; i++) { const x = (i * 29 + 11) % 160, y = 100 - ((i * 19 + t * 2) % 70); g.fillStyle = '#5fe08a'; g.fillRect(x - 1, y - 4, 3, 9); g.fillRect(x - 4, y - 1, 9, 3); }
  g.restore();
  if (f.name && t < 56) { g.font = 'bold 9px monospace'; const w = Math.min(156, Math.ceil(g.measureText(f.name).width) + 14); sgWin2(g, 80 - w / 2, 32, w, 15, () => { g.font = 'bold 9px monospace'; g.textBaseline = 'top'; g.fillStyle = '#f4c542'; g.textAlign = 'center'; g.fillText(f.name, 80, 35); g.textAlign = 'left'; }); }
}
/* 🖍️ screen colors: full color, or every pixel squeezed into a 4-color handheld palette */
const SG_PALETTES = [['full', '🌈 Full color', ['#f8f8f0', '#79c45a', '#5aa8f0', '#f08070']], ...TR_PALETTES.filter(p => p[0] !== 'full').map(p => [p[0], p[1], p[2]])];
const sgPalette = () => SG_PALETTES.find(p => p[0] === S.settings?.sgPalette) || SG_PALETTES[0];
function sgPaletteMenu() {
  const cur = sgPalette()[0];
  sgMenu('🖍️ Screen colors · the whole screen changes', SG_PALETTES.map(([k, label, c]) => ({ label: `${k === cur ? '✅ ' : ''}${trSwatch(c)} ${label}`, fn: () => { S.settings.sgPalette = k; save(); sgPaletteMenu(); } })), () => sgOptions(0), { sel: SG_PALETTES.findIndex(p => p[0] === cur), big: true });
}
function sgQuantize(cv) {
  const pal = sgPalette(); if (pal[0] === 'full') return;
  if (sgQuantize.sig !== pal[0]) { sgQuantize.sig = pal[0]; sgQuantize.rgb = pal[2].map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16))); }
  const P = sgQuantize.rgb, g = cv.getContext('2d'), im = g.getImageData(0, 0, cv.width, cv.height), d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    // sea water is always the darkest shade (with light waves), so it never looks like grass or forest
    const sea = d[i] === 47 && d[i + 1] === 111 && d[i + 2] === 208, l = sea ? 0 : d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114, c = P[l > 178 ? 0 : l > 112 ? 1 : l > 52 ? 2 : 3]; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; }
  g.putImageData(im, 0, 0);
}

/* ---------- Main loop ---------- */
/* safety net: if anyone ever ends up on the hero's square (after a battle, a door or a sync), they step aside */
function sgUnoverlap() {
  const s = sgS(); if (!s || sg.moving) return;
  const m = SG_MAPS[s.map], H = m.rows.length, W = m.rows[0].length;
  for (const n of sgNpcs(s.map)) {
    if (n.x !== s.x || n.y !== s.y) continue;
    const spot = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 2], [2, 0], [-2, 0], [0, -2]].map(([dx, dy]) => [n.x + dx, n.y + dy]).find(([x, y]) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && !(x === s.x && y === s.y) && sgCanWalk(s.map, x, y) && !sg.trail.some(t => t.x === x && t.y === y) && !m.doors?.[`${x},${y}`]);
    if (spot) { const key = s.map + ':' + n.id; sg.np[key] = { ...(sg.np[key] || {}), x: spot[0], y: spot[1], dir: n.dir }; }
  }
}
function sgWander() {
  const s = sgS();
  for (const n of SG_MAPS[s.map].npcs) {
    if (!n.wander || Math.random() > 0.35) continue;
    const key = s.map + ':' + n.id, cur = sg.np[key] || { x: n.x, y: n.y, dir: n.dir }, d = Object.keys(SG_DIRS)[Math.floor(Math.random() * 4)], [dx, dy] = SG_DIRS[d], nx = cur.x + dx, ny = cur.y + dy;
    const ok = Math.abs(nx - n.x) <= n.wander && Math.abs(ny - n.y) <= n.wander && SG_WALK.has(sgTile(s.map, nx, ny)) && !sgNpcAt(s.map, nx, ny) && !(s.x === nx && s.y === ny) && !(sg.moving && sg.moving.tx === nx && sg.moving.ty === ny) && !sg.trail.some(t => t.x === nx && t.y === ny) && ny < SG_MAPS[s.map].rows.length - 1;
    sg.np[key] = ok ? { x: nx, y: ny, dir: d } : { ...cur, dir: d };
  }
}
function sgFrame() {
  if (!sg || view.name !== 'saga' || !document.body.contains($('#sgCanvas'))) { if (sg) { sg.loop = 0; if (view.name !== 'saga') sgFinish(); } return; }
  sg.frame++;
  if (sg.frame % 10 === 0) sgMusicSync();
  if (sg.frame % 70 === 0 && !sg.ui && !sg.bt) sgWander();
  if (sg.moving) {
    sg.moving.t += 1 / 8;
    if (sg.moving.t >= 1) { const s = sgS(); sg.trail.unshift({ x: sg.moving.fx, y: sg.moving.fy, dir: s.dir }); sg.trail.length = Math.min(sg.trail.length, Math.max(2, s.party.length - 1)); const prev = { x: sg.moving.fx, y: sg.moving.fy }; s.x = sg.moving.tx; s.y = sg.moving.ty; sg.moving = null; sgArrive(prev); }
  } else sgStep();
  if (sg.frame % 6 === 0 && !sg.bt) sgUnoverlap();
  sgDraw();
  sg.loop = requestAnimationFrame(sgFrame);
}
function sgInit() {
  if (!sg || !sgS()) return;
  const cv = $('#sgCanvas'); if (!cv) return;
  cv.width = SG_W * SG_SCALE; cv.height = SG_H * SG_SCALE;
  (sgS().seen ||= {})[sgS().map] = 1;
  sgBox(); sgDraw(); sgMusicSync();
  const w = $('.tr-wrap'); if (w) { w.classList.toggle('pad-on', S.settings?.trPad === 'on'); w.classList.toggle('pad-off', S.settings?.trPad === 'off'); w.addEventListener('pointerdown', trWakeAudio); }
  if (!sg.loop) sg.loop = requestAnimationFrame(sgFrame);
  document.querySelectorAll('[data-sgdir]').forEach(b => {
    const on = e => { e.preventDefault(); if (sg.ui?.type === 'menu') sgMenuMove(b.dataset.sgdir); else if (sg.ui?.type === 'map') { if (/left|right/.test(b.dataset.sgdir)) sgMapOpen(sg.ui.view === 'world' ? 'area' : 'world'); } else sg.held = b.dataset.sgdir; }, off = e => { e.preventDefault(); if (sg.held === b.dataset.sgdir) sg.held = null; };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
  });
}
function sgFinish() {
  if (!sg || sg.ended) return; sg.ended = true; gameMapClose();
  trMusic.stop(); trMusic.name = null;
  if (sg.loop) cancelAnimationFrame(sg.loop); sg.loop = 0;
  const s = sgS(); if (s) { s.playMs += Date.now() - (sg.tick || Date.now()); sg.tick = Date.now(); s.savedAt = Date.now(); }
  const r = sg.session.results, right = r.filter(x => x.ok).length, real = Math.min(25, sg.session.nuts);
  if (real && typeof rw === 'function') rw().peanuts += real;
  if (r.length && typeof addHistory === 'function') addHistory({ type: 'saga', deckId: sg.deckId, deckName: sg.d?.name, correct: right, total: r.length,
    score: Math.round(right / r.length * 100), timeMs: Date.now() - sg.session.start, detail: `${sg.session.wins} battle${sg.session.wins === 1 ? '' : 's'} won${real ? ` · 🥜 ${real}` : ''}`, items: r });
  else save();
  if (r.length || real) toast(`Saved! ${r.length ? `${right}/${r.length} answers right` : ''}${real ? ` · +${real} 🥜` : ''}`);
}

/* ---------- Keys ---------- */
document.addEventListener('keydown', e => {
  if (view.name !== 'saga' || !sg || $('#dlg')?.open || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  trWakeAudio();
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key, u = sg.ui;
  if (u?.type === 'question' && u.q.mode === 'mc') { if (/^[1-6]$/.test(key) && u.q.opts[+key - 1]) { e.preventDefault(); sgAnswer(u.q.opts[+key - 1]); } return; }
  const act = trActionFor(key); if (!act) return;
  e.preventDefault();
  if (['up', 'down', 'left', 'right'].includes(act)) { if (u?.type === 'menu') return sgMenuMove(act); if (u?.type === 'map') { if (act === 'left' || act === 'right') sgMapOpen(u.view === 'world' ? 'area' : 'world'); return; } if (!u) sg.held = act; return; }
  if (e.repeat) return;
  if (act === 'a') sgA(); else if (act === 'b') sgB();
  else if (act === 'menu' && !u && !sg.bt) sgMainMenu();
  else if (act === 'music') actions.sgMusicToggle();
});
document.addEventListener('keyup', e => { if (!sg) return; const key = e.key.length === 1 ? e.key.toLowerCase() : e.key, act = trActionFor(key); if (act && act === sg.held) sg.held = null; });
window.addEventListener('blur', () => { if (sg) sg.held = null; });
document.addEventListener('submit', e => {
  if (e.target.matches?.('[data-sgtype]')) { e.preventDefault(); const v = $('#sgType')?.value || ''; if (v.trim()) sgAnswer(v); return; }
  if (e.target.id !== 'sgNewForm') return;
  e.preventDefault(); trWakeAudio();
  const f = e.target, name = f.name.value.trim(), slot = f.slot.value;
  const begin = () => { sgNewSave(slot, name); startSaga(view.deckId); };
  if (sgSlots()[slot]) confirmDlg(`Replace slot ${slot.toUpperCase()}?`, 'The saga saved in this slot will be replaced.', 'Replace', begin); else begin();
});

/* ---------- Screens ---------- */
views.sagaTitle = () => {
  const d = deckById(view.deckId); if (!d) { view = { name: 'home' }; return views.home(); }
  const slots = sgSlots(), fmt = ms => { const m = Math.round(ms / 60000); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };
  const card = k => { const s = slots[k]; return `<div class="tr-slot ${S.sagaSlot === k && s ? 'cur' : ''}"><div class="tr-slot-h"><b>Slot ${k.toUpperCase()}</b>${s?.savedAt ? `<span class="muted small">${esc(new Date(s.savedAt).toLocaleDateString([], { dateStyle: 'medium' }))}</span>` : ''}</div>
    ${s ? `<div><b>${esc(s.name)}</b> · 📍 ${esc(SG_MAPS[s.map]?.name || '')}</div><div class="muted small">💰 ${s.gold} gold · ⏱️ ${fmt(s.playMs || 0)}${s.flags?.lexicon ? ' · 🏆 Saga complete!' : s.flags?.keysAll ? ' · 🔑 All three keys' : s.flags?.keyquest ? ` · 🔑 ${['key1', 'key2', 'key3'].filter(k => s.flags[k]).length}/3 keys` : s.flags?.allshards ? ' · 💎 All shards' : s.flags?.crystal ? ' · 💠 Voice Crystal' : s.flags?.isles ? ' · 🏝️ Part three' : s.flags?.oracle ? ' · 🌅 Part two complete' : s.flags?.shard2 ? ' · 💎 2 shards' : s.flags?.kingDone ? ' · 💎 Part one complete' : s.flags?.shard ? ' · 💎 1 shard' : ''}</div>
        <div class="row" style="gap:4px">${s.party.map(h => `<span class="sg-chip">${SG_HEROES[h.key].icon} ${esc(h.name)} Lv${h.lv}</span>`).join('')}</div>
        <div class="row" style="gap:6px"><button type="button" class="btn primary" data-act="sgContinue" data-slot="${k}" data-id="${d.id}">▶ Continue</button><button type="button" class="btn sm ghost" style="color:var(--again)" data-act="sgDelSlot" data-slot="${k}">Delete</button></div>`
      : `<div class="muted small">Empty</div><button type="button" class="btn" data-act="sgNewSlot" data-slot="${k}">＋ New saga here</button>`}</div>`; };
  const free = ['a', 'b', 'c'].find(k => !slots[k]) || 'a';
  return `<div class="crumbs"><a data-act="home">Decks</a> / <a data-act="openDeck" data-id="${d.id}">${esc(d.name)}</a> / <a data-act="games" data-id="${d.id}">Games</a> / Lexicon Saga</div>
    <h2 style="margin-bottom:6px">🗡️ Lexicon Saga</h2>
    <p class="muted" style="margin:0 0 14px">A turn-based word adventure. Lead a knight, a scribe and a cantor against the Unwriter. <b>Fight</b> by picking the right meaning from “${esc(d.name)}”, and cast <b>spells</b> by spelling the word yourself.</p>
    <div class="tr-slots">${['a', 'b', 'c'].map(card).join('')}</div>
    <form class="panel stack" id="sgNewForm" style="margin-top:14px" ${view.sgNew ? '' : 'hidden'}>
      <h3 style="margin:0">New saga in slot ${(view.sgNew || free).toUpperCase()}</h3>
      <input type="hidden" name="slot" value="${view.sgNew || free}">
      <label class="field">Your knight’s name<input name="name" maxlength="10" required placeholder="Hero" value="${esc((typeof currentProfile === 'function' && currentProfile()?.name) || '').slice(0, 10)}"></label>
      <div class="row-between"><span class="muted small">Your journey saves by itself, and with 💾 Save in the menu. It uses the same keys as Wordling Trails.</span>
        <button type="submit" class="btn primary big">Begin the saga ⚔️</button></div>
    </form>`;
};
views.saga = () => {
  if (!sg || !sgS()) { view = { name: 'home' }; return views.home(); }
  return `<div class="study-top">
      <button type="button" class="btn ghost" data-act="sgLeave">← Save &amp; leave</button>
      <div class="prompt-label muted">🗡️ Lexicon Saga · ${esc(sg.d?.name || '')}</div>
      <div class="row" style="gap:6px"><button type="button" class="btn sm" id="sgMusicBtn" data-act="sgMusicToggle">${S.settings?.trMusic !== false ? '🔊 Music' : '🔇 Music'}</button><button type="button" class="btn sm" data-act="sgMenuBtn">☰ Menu</button></div>
    </div>
    <div class="tr-wrap sg-wrap">
      <div ${trShellAttrs()}>
        <div class="tr-bezel">
          <div class="tr-bezel-top"><span>LEXICON SAGA · WORD-MATRIX SOUND</span></div>
          <div class="tr-bezel-row">
            <div class="tr-led" aria-hidden="true"><i></i><span>POWER</span></div>
            <div class="tr-screen-wrap">
              <canvas id="sgCanvas" class="tr-screen sg-screen" aria-label="Game screen"></canvas>
              <div id="sgBox" class="sg-box" aria-live="polite"></div>
            </div>
          </div>
        </div>
        <div class="tr-brand" aria-hidden="true"><b>Estudiamos</b> <span>POCKET</span></div>
        <div class="tr-pad" aria-label="Game buttons">
          <div class="tr-dpad">
            <button type="button" data-trdir="up" data-sgdir="up" aria-label="Up"></button><button type="button" data-trdir="left" data-sgdir="left" aria-label="Left"></button>
            <i class="tr-dpad-mid" aria-hidden="true"></i>
            <button type="button" data-trdir="right" data-sgdir="right" aria-label="Right"></button><button type="button" data-trdir="down" data-sgdir="down" aria-label="Down"></button>
          </div>
          <div class="tr-ab">
            <div><button type="button" class="tr-bbtn" data-act="sgB" aria-label="B button"></button><span>B</span></div>
            <div><button type="button" class="tr-abtn" data-act="sgA" aria-label="A button"></button><span>A</span></div>
          </div>
          <div class="tr-mid">
            <div><button type="button" class="tr-small" data-act="sgMusicToggle" aria-label="Music"></button><span>MUSIC</span></div>
            <div><button type="button" class="tr-small" data-act="sgMenuBtn" aria-label="Menu"></button><span>MENU</span></div>
          </div>
          <div class="tr-speaker" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
      <p class="muted small tr-keys">${(() => { const k = trKeys(), f = a => k[a].map(trKeyName).join('/'); return `Move ${f('up')} ${f('left')} ${f('down')} ${f('right')} · A ${f('a')} · B ${f('b')} · Menu ${f('menu')} · 1–6 answer · Enter casts a spell`; })()}</p>
      ${typeof gtReportBtn === 'function' ? gtReportBtn(sg.d?.frontLang, 'Lexicon Saga') : ''}
    </div>`;
};
Object.assign(actions, {
  sgMapView: el => { if (sg?.ui?.type === 'map') sgMapOpen(el.dataset.v); },
  sgContinue: el => { trWakeAudio(); S.sagaSlot = el.dataset.slot; startSaga(el.dataset.id); },
  sgNewSlot: el => { view.sgNew = el.dataset.slot; render(); setTimeout(() => $('#sgNewForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); },
  sgDelSlot: el => confirmDlg(`Delete slot ${el.dataset.slot.toUpperCase()}?`, 'This saga will be deleted for good.', 'Delete', () => { delete sgSlots()[el.dataset.slot]; save(); render(); }),
  sgMusicToggle: () => { S.settings.trMusic = !(S.settings.trMusic !== false); save(); if (S.settings.trMusic) { trWakeAudio(); trMusic.name = null; sgMusicSync(); } else trMusic.stop();
    const b = $('#sgMusicBtn'); if (b) b.textContent = S.settings.trMusic ? '🔊 Music' : '🔇 Music'; toast(S.settings.trMusic ? 'Music on 🎵' : 'Music off'); },
  sgLeave: () => sgQuit(),
  sgMenuBtn: () => { if (!sg) return; if (!sg.ui && !sg.bt) sgMainMenu(); else if (sg.ui?.type === 'menu' && !sg.bt && sg.ui.back) { sg.ui = null; sgBox(); } },
  sgA: () => { trWakeAudio(); sg && sgA(); }, sgB: () => sg && sgB(),
  sgPick: el => { if (!sg?.ui || sg.ui.type !== 'menu') return; sg.ui.sel = +el.dataset.i; sgA(); },
  sgAns: el => { const q = sg?.ui?.q; if (q) sgAnswer(q.opts[+el.dataset.i]); },
});
