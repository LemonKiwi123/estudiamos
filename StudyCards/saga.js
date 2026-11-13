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
  s.flags ||= {}; s.got ||= {}; s.bag ||= {}; s.gearBag ||= {}; s.beaten ||= {}; s.playMs ||= 0;
  if (!SG_MAPS[s.map]) Object.assign(s, { map: 'town', x: 9, y: 9, dir: 'down' });
  return s;
}
function sgNewSave(slot, name) {
  sgSlots()[slot] = sgFix({ v: 1, name: name.slice(0, 10) || 'Hero', party: [sgHero('knight', name.slice(0, 10) || 'Hero')], gold: 50, bag: { herb: 2 }, gearBag: {},
    map: 'town', x: 9, y: 3, dir: 'up', flags: {}, got: {}, beaten: {}, home: 'town', started: Date.now(), playMs: 0, steps: 0 });
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
const sgStat = (h, k) => sgBase(h, k) + sgGearBonus(h, k);
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
const sgTile = (map, x, y) => (SG_MAPS[map].rows[y] || '')[x] || (['cave', 'archive'].includes(SG_MAPS[map].theme) ? 'X' : SG_MAPS[map].theme === 'desert' ? 'M' : '#');
function startSaga(deckId) {
  sgFix(sgS());
  const s = sgS();
  sg = { deckId, d: deckById(deckId), pool: runnerPool(deckId), queue: [], ui: null, bt: null, moving: null, held: null, frame: 0, np: {}, tick: Date.now(),
    trail: [], grace: 4, loop: 0, ended: false, flash: 0, shake: 0, banner: { text: SG_MAPS[s.map].name, until: 110 },
    session: { start: Date.now(), results: [], nuts: 0, wins: 0 } };
  go({ name: 'saga' });
  if (!s.flags.intro) { s.flags.intro = 1; setTimeout(() => sgSay(SG_STORY.intro, () => sgSay(['You stand in the great hall of Castle Quillhaven.', 'Talk to people with A. Open your menu with B.'])), 300); }
}
const sgNpcs = map => { const s = sgS(); return SG_MAPS[map].npcs.filter(n => !(n.join && s.party.some(h => h.key === n.join))).map(n => { const o = sg?.np[map + ':' + n.id]; return o ? Object.assign(Object.create(n), o) : n; }); };
const sgObjs = map => { const s = sgS(); return SG_MAPS[map].objs.filter(o => !((o.type === 'foeSpot' || o.type === 'boss') && s.beaten[o.id]) && !(o.type === 'npc' && s.party.some(h => h.key === o.join)) && !(o.type === 'seal' && s.flags[o.id])); };
const sgNpcAt = (map, x, y) => sgNpcs(map).find(n => n.x === x && n.y === y);
const sgObjAt = (map, x, y) => sgObjs(map).find(o => o.x === x && o.y === y);
const sgBlocksObj = o => o && o.type !== 'seal';
const sgCanWalk = (map, x, y) => {
  const s = sgS(), t = sgTile(map, x, y);
  if (t === 'W' && s.flags.ship) return s.boat || sgTile(map, s.x, s.y) === 'Q' || (s.shipMap === map && s.shipAt === x + ',' + y);
  if (s.boat && !SG_WALK.has(t)) return false;
  return SG_WALK.has(t) && !sgNpcAt(map, x, y) && !sgBlocksObj(sgObjAt(map, x, y));
};

/* ---------- Questions from the deck ---------- */
function sgCard() { if (!sg.queue.length) sg.queue = shuffle(sg.pool.slice()); return sg.queue.pop(); }
const sgHardScript = t => /[぀-ヿ㐀-鿿가-힯؀-ۿ֐-׿Ѐ-ӿ฀-๿]/.test(t || '');
function sgAsk(title, then) {
  const c = sgCard(), rev = Math.random() < 0.3, prompt = rev ? c.back : c.front, answer = rev ? c.front : c.back;
  const pool = sg.pool.filter(x => x.id !== c.id).map(x => rev ? x.front : x.back);
  const q = { mode: 'mc', card: c, title, prompt, answer, lang: rev ? sg.d.backLang : sg.d.frontLang, opts: pickOptions(answer, pool, 4), t0: Date.now(), then, given: null };
  sg.ui = { type: 'question', q }; sgBox(); trMusic.setDuck?.(0.4);
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
function sgAnswer(given) {
  const q = sg.ui?.q; if (!q || q.given != null) return;
  q.given = given;
  q.grade = q.mode === 'type' ? sgGrade(given, q.answer) : norm(given) === norm(q.answer) ? 'exact' : 'wrong';
  q.ok = q.grade !== 'wrong'; q.fast = q.grade === 'exact' && Date.now() - q.t0 < (q.mode === 'type' ? 9000 : 5000);
  sg.session.results.push({ cardId: q.card.id, q: q.prompt, a: q.answer, given: q.given, ok: q.ok });
  if (typeof sdSound === 'function') sdSound(q.ok ? 'right' : 'wrong');
  sgBox();
  setTimeout(() => { trMusic.setDuck?.(1); if (sg?.ui?.q === q) { sg.ui = null; q.then(q.grade, q.fast); } }, q.ok ? 800 : 1700);
}

/* ---------- Windows: text, menus, questions (drawn over the game screen) ---------- */
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
function sgBox() {
  const el = $('#sgBox'); if (!el || !sg) return;
  const u = sg.ui;
  if (u?.type !== 'map') gameMapClose();
  el.classList.toggle('open', !!u);
  el.classList.toggle('big', !!(u?.type === 'question' || (u?.type === 'menu' && (u.items.length > 5 || u.big))));
  el.classList.toggle('low', !!sg.bt && u?.type !== 'question' && !(u?.type === 'menu' && u.items.length > 5));
  if (!u) { el.innerHTML = ''; return; }
  if (u.type === 'text') { el.innerHTML = `<div class="sg-text">${u.lines[u.i]}</div><button type="button" class="sg-next" data-act="sgA" aria-label="Next">▼</button>`; return; }
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
    const verdict = !done ? '' : q.grade === 'exact' ? (q.fast ? (q.spell ? '⚡ Perfect and fast!' : '⚡ Fast and right! Critical!') : '✓ Right!') : q.grade === 'close' ? `≈ Almost! It’s <b>${esc(q.answer)}</b>` : `✗ It was: <b>${esc(q.answer)}</b>`;
    el.innerHTML = `<div class="sg-q"><div class="sg-mtitle">${q.title}</div>
      <div class="sg-prompt"><span>${esc(q.prompt)}</span>${!q.spell && typeof speakBtn === 'function' ? speakBtn(q.prompt, q.lang) : ''}</div>
      ${q.mode === 'type'
        ? `<form class="sg-typeform" data-sgtype="1"><input id="sgType" autocomplete="off" autocapitalize="off" spellcheck="false" lang="${esc(q.lang || '')}" placeholder="Type the word…" aria-label="Spell it in ${esc(langName(q.lang) || 'the deck language')}" ${done ? 'disabled' : ''} value="${done ? esc(q.given) : ''}"><button type="submit" class="sg-cast" ${done ? 'disabled' : ''}>✨ Cast</button></form>`
        : `<div class="sg-timer"><div style="animation-duration:5s"></div></div><div class="sg-opts ${q.opts.length > 4 ? 'six' : ''}">${q.opts.map((o, i) => { const st = !done ? '' : norm(o) === norm(q.answer) ? 'right' : o === q.given ? 'wrong' : 'dim';
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
  const s = sgS(), m = SG_MAPS[s.map], key = s.x + ',' + s.y, t = sgTile(s.map, s.x, s.y);
  s.steps++;
  const wasBoat = s.boat; s.boat = t === 'W';
  if (s.boat !== !!wasBoat) { sg.trail = []; if (s.boat) delete s.shipAt; else if (prev) { s.shipMap = s.map; s.shipAt = prev.x + ',' + prev.y; } sgMusicSync(); if (s.boat && !s.flags.sailed) { s.flags.sailed = 1; sg.held = null; return sgSay('⛵ All aboard the Quill Swan! Sail onto any shore to land.'); } }
  if (m.warps?.[key]) {
    const w = m.warps[key];
    if (w.need && !s.flags[w.need]) { sg.held = null; if (prev) Object.assign(s, { x: prev.x, y: prev.y }); return sgSay(w.block || 'The way is blocked.'); }
    if (w.need === 'tide' && !s.flags.tideUsed) { s.flags.tideUsed = 1; sg.held = null; return sgSay('🌊 The Tide Charm glows… the sea draws back from the old stairs!', () => sgWarp(w.map, SG_MAPS[w.map].start.x, SG_MAPS[w.map].start.y, 'up')); }
    return w.at === 'start' ? sgWarp(w.map, SG_MAPS[w.map].start.x, SG_MAPS[w.map].start.y, 'up') : sgWarp(w.map, w.x, w.y, w.dir);
  }
  if (m.town && s.y === m.rows.length - 1) return sgWarp(m.exitTo.map, m.exitTo.x, m.exitTo.y, m.exitTo.dir);
  if (t === '<') { const u = m.upTo; return typeof u === 'string' ? sgWarp(u, SG_MAPS[u].stairs.x, SG_MAPS[u].stairs.y, 'down') : sgWarp(u.map, u.x, u.y, u.dir); }
  if (t === '>') {
    const seal = m.objs.find(o => o.type === 'seal' && o.x === s.x && o.y === s.y);
    if (seal && !s.flags[seal.id]) { sg.held = null; return sgSeal(seal); }
    return sgWarp(m.downTo, SG_MAPS[m.downTo].start.x, SG_MAPS[m.downTo].start.y, 'up');
  }
  // random battles
  const rate = { '.': 18, h: 14, f: 9, d: 15, C: 13, c: 12, W: 16 }[t];
  if (rate && m.zone && --sg.grace <= 0 && Math.random() < 1 / rate) { sg.held = null; sg.grace = 4; sgEncounter(s.boat ? 'sea' : m.zone(s.x, s.y)); }
}
function sgWarp(map, x, y, dir, quiet) {
  const s = sgS(); Object.assign(s, { map, x, y, dir, boat: false }); sg.trail = []; sg.np = {}; sg.grace = 5; sg.flash = 8;
  if (SG_MAPS[map].town) s.home = map;
  (s.seen ||= {})[map] = 1;
  sgSaveNow(true); sgMusicSync();
  sg.banner = quiet ? null : { text: SG_MAPS[map].name, until: sg.frame + 110 };
}
function sgEncounter(zone) {
  const z = SG_ZONES[zone]; if (!z) return;
  const total = z.list.reduce((a, [, w]) => a + w, 0), pick = () => { let r = Math.random() * total; for (const [k, w] of z.list) { r -= w; if (r <= 0) return k; } return z.list[0][0]; };
  const n = 1 + Math.floor(Math.random() * z.max * (sgAlive().length >= 2 ? 1 : 0.7));
  sgBattle(Array.from({ length: Math.max(1, Math.min(z.max, n)) }, pick));
}

/* ---------- Talking, chests, seals ---------- */
function sgInteract() {
  if (sg.bt || sg.moving) return;
  const s = sgS(), [dx, dy] = SG_DIRS[s.dir], fx = s.x + dx, fy = s.y + dy, m = SG_MAPS[s.map];
  const o = sgObjAt(s.map, fx, fy); if (o) return sgUseObj(o);
  let n = sgNpcAt(s.map, fx, fy);
  if (!n && sgTile(s.map, fx, fy) === 'L') n = sgNpcAt(s.map, fx + dx, fy + dy);   // talk across the throne
  if (n) { n.dir && (sg.np[s.map + ':' + n.id] = { ...(sg.np[s.map + ':' + n.id] || { x: n.x, y: n.y }), dir: { up: 'down', down: 'up', left: 'right', right: 'left' }[s.dir] }); return sgTalk(n); }
  if (m.doors?.[fx + ',' + fy]) return sgDoor(m.doors[fx + ',' + fy]);
  if (sgTile(s.map, fx, fy) === 'Z') return sgOracle();
  if (m.signs?.[fx + ',' + fy]) return sgSay(`🪧 ${esc(m.signs[fx + ',' + fy])}`);
}
function sgTalk(n) {
  const s = sgS();
  if (n.king) {
    if (s.flags.shard) { if (!s.flags.kingDone) { s.flags.kingDone = 1; sg.session.nuts += 5; sgSaveNow(true); return sgSay(SG_STORY.kingDone(esc(s.name)), () => sgJingle('sg_fanfare')); } return sgSay(SG_STORY.kingAfter); }
    if (!s.flags.king) { s.flags.king = 1; s.gold += 120; s.bag.herb = (s.bag.herb || 0) + 3; sgSaveNow(true); return sgSay(SG_STORY.kingFirst(esc(s.name))); }
    return sgSay(SG_STORY.kingAgain);
  }
  if (n.queen) {
    if (s.flags.shard2) { if (!s.flags.ship) { s.flags.ship = 1; sg.session.nuts += 5; sgSaveNow(true); return sgSay(SG_STORY.queenShip(esc(s.name)), () => sgJingle('sg_fanfare')); } return sgSay(SG_STORY.queenAfter); }
    if (!s.flags.queen) { s.flags.queen = 1; s.gold += 300; sgSaveNow(true); return sgSay(SG_STORY.queenFirst(esc(s.name))); }
    return sgSay(s.flags.tide ? SG_STORY.queenCharm : SG_STORY.queenAgain);
  }
  if (n.join === 'scribe') {
    if (!s.flags.king) return sgSay(SG_STORY.tamsin.before);
    return sgSay(SG_STORY.tamsin.join(esc(s.name)), () => { sgJoin('scribe'); });
  }
  if (n.chat) return sgSay(`${esc(n.name || 'Townsperson')}: ${SG_CHAT[Math.floor(Math.random() * SG_CHAT.length)]}`);
  if (n.lines) return sgSay(n.lines);
}
function sgJoin(key) {
  const s = sgS(); if (s.party.some(h => h.key === key)) return;
  const lead = s.party[0], h = sgHero(key, SG_NAMES[key]);
  while (h.lv < Math.max(1, lead.lv - 1)) { h.lv++; } h.hp = sgMax(h, 'hp'); h.mp = sgMax(h, 'mp');
  s.party.push(h); sgJingle('sg_level'); sgSaveNow(true);
}
function sgUseObj(o) {
  const s = sgS();
  if (o.type === 'chest' || o.type === 'lockChest') {
    if (s.got[o.id]) return sgSay('The chest is empty.');
    if (o.guard && !s.beaten[o.guard]) return sgSay(`${SG_MONSTERS[o.guard].name} guards this chest.`);
    const open = () => { s.got[o.id] = 1; const lines = sgGive(o.give); sgSaveNow(true); sgSay([`You opened the chest!`, ...lines], o.story ? () => sgSay(SG_STORY[o.story]) : null); };
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
    else { s.bag[k] = (s.bag[k] || 0) + v; out.push(`${SG_ITEMS[k].icon} You found <b>${v > 1 ? v + ' × ' : ''}${SG_ITEMS[k].name}</b>!`); }
  }
  return out;
}

/* ---------- Town services ---------- */
function sgDoor(kind) {
  const s = sgS();
  const m = SG_MAPS[s.map];
  if (kind === 'sage') return sgSage();
  if (kind === 'inn') {
    const cost = m.inn || 10;
    return sgMenu(`🛏️ Inn: “A warm bed is ${cost} gold for the whole party.” · 💰 ${s.gold}`, [
      { label: `Stay the night (${cost} gold)`, disabled: s.gold < cost, fn: () => { s.gold -= cost; for (const h of s.party) { h.hp = sgMax(h, 'hp'); h.mp = sgMax(h, 'mp'); } sgSaveNow(true); sg.flash = 20; sgJingle('sg_inn'); sgSay(['Good night…', '☀️ Good morning! Everyone is fully rested.']); } },
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
  }), { label: 'Leave', fn: () => sgSay('Thank you, come again!') }], () => {}, { sel });
}

/* ---------- Menu ---------- */
const sgHeroLine = h => `${SG_HEROES[h.key].icon} <b>${esc(h.name)}</b> Lv ${h.lv} · ❤️ ${h.hp}/${sgMax(h, 'hp')} · 💧 ${h.mp}/${sgMax(h, 'mp')}${h.hp <= 0 ? ' · 💤 fallen' : ''}`;
function sgMainMenu() {
  const s = sgS();
  sgMenu(`📍 <b>${esc(SG_MAPS[s.map].name)}</b><br><small>💰 ${s.gold} gold · ${s.party.map(h => `${SG_HEROES[h.key].icon} ${esc(h.name)} Lv${h.lv}`).join(' · ')}</small>`, [
    { label: '👥 Party', fn: () => sgPartyMenu() }, { label: '✨ Spells', fn: () => sgFieldSpells() },
    { label: '🎒 Items', fn: () => sgItemMenu(false) }, { label: '⚔️ Equipment', fn: () => sgEquipMenu() },
    { label: '🗺️ Map', fn: () => sgMapOpen('world') }, { label: '💾 Save', fn: () => sgSaveNow() }, { label: '🎨 Console color', fn: () => trShellMenu((t, it, bk, sel) => sgMenu(t, it, bk, { sel }), () => sgMainMenu()) },
    { label: '🚪 Save and leave', fn: () => sgQuit() }], () => {}, { cols: 2 });
}
function sgPartyMenu() {
  const s = sgS();
  sgMenu('👥 Party', s.party.map(h => ({ label: sgHeroLine(h), sub: `${SG_HEROES[h.key].cls} · ⚔️ ${sgStat(h, 'atk')} · 🛡️ ${sgStat(h, 'def')} · 💨 ${sgStat(h, 'agi')} · 🔮 ${sgStat(h, 'mag')} · next level in ${sgNeed(h.lv) - h.xp} XP<br>${SG_GEAR[h.gear.weapon]?.name || 'No weapon'} · ${SG_GEAR[h.gear.armor]?.name || 'No armor'} · Spells: ${sgSpellsOf(h).map(k => SG_SPELLS[k].name).join(', ') || 'none yet'}`, fn: () => sgPartyMenu() })), () => sgMainMenu(), { big: true });
}
function sgFieldSpells() {
  const s = sgS(), items = [];
  for (const h of s.party) for (const k of sgSpellsOf(h)) { const sp = SG_SPELLS[k]; if (!['heal', 'healAll', 'revive'].includes(sp.kind)) continue;
    items.push({ label: `${SG_HEROES[h.key].icon} ${esc(h.name)}: <b>${sp.name}</b> · ${sp.mp} MP`, sub: sp.desc, disabled: h.hp <= 0 || h.mp < sp.mp, fn: () => sgFieldCast(h, k) }); }
  if (!items.length) items.push({ label: 'No healing spells yet. Lyra the Cantor knows some!', disabled: true, fn: () => {} });
  sgMenu('✨ Spells you can use here', items, () => sgMainMenu());
}
function sgFieldCast(h, k) {
  const s = sgS(), sp = SG_SPELLS[k];
  if (sp.kind === 'healAll') { h.mp -= sp.mp; for (const a of sgAlive()) a.hp = Math.min(sgMax(a, 'hp'), a.hp + sgHealAmt(h, sp)); sgSaveNow(true); return sgSay(`${esc(h.name)} sings ${sp.name}. Everyone feels better! 🎶`, sgFieldSpells); }
  sgMenu(`${sp.name} on…`, s.party.map(t => ({ label: sgHeroLine(t), disabled: sp.kind === 'revive' ? t.hp > 0 : t.hp <= 0 || t.hp >= sgMax(t, 'hp'), fn: () => {
    h.mp -= sp.mp;
    if (sp.kind === 'revive') t.hp = Math.ceil(sgMax(t, 'hp') / 2); else t.hp = Math.min(sgMax(t, 'hp'), t.hp + sgHealAmt(h, sp));
    sgSaveNow(true); sgSay(`${esc(h.name)} casts ${sp.name}. ${esc(t.name)} ${sp.kind === 'revive' ? 'is back on their feet!' : 'feels much better!'}`, sgFieldSpells);
  } })), () => sgFieldSpells());
}
function sgItemMenu(inBattle, user) {
  const s = sgS(), items = Object.entries(s.bag).filter(([k, n]) => n > 0 && SG_ITEMS[k]).map(([k, n]) => ({ label: `${SG_ITEMS[k].icon} ${SG_ITEMS[k].name} ×${n}`, sub: SG_ITEMS[k].desc,
    disabled: inBattle && k === 'feather', fn: () => k === 'feather' ? sgFeather() : sgItemTarget(k, inBattle, user) }));
  if (!items.length) items.push({ label: 'Your bag is empty. The item shop in Quillhaven sells herbs.', disabled: true, fn: () => {} });
  sgMenu('🎒 Items', items, inBattle ? () => sgHeroTurn() : () => sgMainMenu());
}
function sgItemTarget(k, inBattle, user) {
  const s = sgS(), it = SG_ITEMS[k];
  sgMenu(`Use ${it.name} on…`, s.party.map(t => ({ label: sgHeroLine(t), disabled: it.revive ? t.hp > 0 : t.hp <= 0 || (it.heal ? t.hp >= sgMax(t, 'hp') : t.mp >= sgMax(t, 'mp')), fn: () => {
    s.bag[k]--;
    let msg;
    if (it.revive) { t.hp = Math.ceil(sgMax(t, 'hp') * it.revive); msg = `${esc(t.name)} is back on their feet! ${it.icon}`; }
    else if (it.heal) { const b = t.hp; t.hp = Math.min(sgMax(t, 'hp'), t.hp + it.heal); msg = `${esc(t.name)} recovers ${t.hp - b} HP. ${it.icon}`; }
    else { const b = t.mp; t.mp = Math.min(sgMax(t, 'mp'), t.mp + it.mp); msg = `${esc(t.name)} recovers ${t.mp - b} MP. ${it.icon}`; }
    sgSaveNow(true); sgSay(msg, inBattle ? () => sgNextHero() : () => sgItemMenu(false));
  } })), () => sgItemMenu(inBattle, user));
}
function sgFeather() {
  const s = sgS();
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
const SG_OVERWORLDS = ['field', 'seravel'];
const SG_PLACES = { '5,16': ['Quillhaven', 'town'], '17,2': ['Hollow of Echoes', 'hollow1'], '22,5': ['Mountain pass', null], '6,7': ['Mirage Well', 'well'], '17,12': ['Port Lumen', 'port'], '15,15': ['Sunken Archive', 'archive1'], '22,17': ['Isle shrine', null], '19,5': ['Royal dock', null] };
function sgMapRoot(map) {   // which overworld tile a town or dungeon floor sits on
  for (let guard = 0; guard < 6 && !SG_OVERWORLDS.includes(map); guard++) {
    const m = SG_MAPS[map];
    if (typeof m.upTo === 'string') { map = m.upTo; continue; }
    if (m.upTo) return { map: m.upTo.map, x: m.upTo.x, y: m.upTo.y };
    if (m.exitTo) return { map: m.exitTo.map, x: m.exitTo.x, y: m.exitTo.y - (m.exitTo.dir === 'down' ? 1 : 0) };
    break;
  }
  const s = sgS(); return { map, x: s.x, y: s.y };
}
const SG_MAP_COL = c => ({ '.': '#4caf50', f: '#1e6b35', h: '#81c784', M: '#7a6a58', W: '#2f6fd0', B: '#8b5a2b', P: '#d9b878', U: '#c0392b', V: '#3e2a1c', Y: '#c49a5a', d: '#e6c77a', k: '#2e8b4a', Q: '#8b5a2b', u: '#c0763a', Z: '#f5eef8',
  '#': '#666c75', K: '#b03a48', L: '#f4c542', R: '#c0392b', H: '#f3e2c0', D: '#5e3a1a', S: '#8b5a2b', F: '#ff8fb1', T: '#1e6b35', X: '#2a1d12', C: '#7a5a3e', c: '#6d5038', '<': '#f6f6f0', '>': '#14141c' })[c] || '#444';
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
    const m = SG_MAPS[s.map], mm = trMiniMap(cv, m.rows, SG_MAP_COL, { y0: 24, maxH: H - 24 });
    g.fillStyle = '#ffffff'; g.fillText(m.name, 8, 4);
    for (const o of sgObjs(s.map)) { const [x, y] = mm.at(o.x, o.y); g.font = `${Math.max(10, mm.t + 2)}px sans-serif`;
      g.fillText(o.type === 'chest' ? (s.got[o.id] ? '▫️' : '🎁') : o.type === 'lockChest' ? (s.got[o.id] ? '▫️' : '🔒') : o.type === 'seal' ? '🌀' : o.type === 'npc' ? '🙂' : '👾', x - 2, y - 2); }
    const [px, py] = mm.at(s.x, s.y); star(px + mm.t / 2, py + mm.t / 2, Math.max(4, mm.t * 0.7));
    return;
  }
  const seen = s.seen || {}, known = { field: true, seravel: !!(seen.seravel || s.flags.kingDone) }, root = sgMapRoot(s.map), half = (W - 12) / 2;
  SG_OVERWORLDS.forEach((id, i) => {
    const m = SG_MAPS[id], x0 = 4 + i * (half + 4);
    g.fillStyle = '#ffffff'; g.font = 'bold 15px ui-monospace,monospace'; g.fillText(id === 'field' ? '👑 Kingdom of Aldermere' : '🏜️ Kingdom of Seravel', x0 + 2, 4);
    if (!known[id]) { g.fillStyle = '#1b2266'; g.fillRect(x0, 24, half, H - 30); g.fillStyle = '#8f98d8'; g.font = 'bold 22px ui-monospace,monospace'; g.textAlign = 'center'; g.fillText('???', x0 + half / 2, H / 2 - 12); g.font = '12px ui-monospace,monospace'; g.fillText('Not explored yet', x0 + half / 2, H / 2 + 16); g.textAlign = 'left'; return; }
    const mm = trMiniMap(cv, m.rows, SG_MAP_COL, { x0, y0: 26, maxW: half, maxH: H - 30, pad: 2 });
    for (const [k, [name, target]] of Object.entries(SG_PLACES)) {
      const [tx, ty] = k.split(',').map(Number); if (!m.rows[ty] || !'UVYZQu'.includes(m.rows[ty][tx])) continue;
      const [x, y] = mm.at(tx, ty), ok = !target || seen[target] || target === s.map;
      g.font = 'bold 13px ui-monospace,monospace'; const label = ok ? name : '???', w = g.measureText(label).width + 8, lx = Math.max(x0 + 1, Math.min(x0 + half - w - 1, x + mm.t / 2 - w / 2)), ly = y + mm.t + 2 > H - 20 ? y - 20 : y + mm.t + 2;
      g.fillStyle = 'rgba(10,20,80,.85)'; g.fillRect(lx, ly, w, 18); g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.strokeRect(lx + 0.5, ly + 0.5, w - 1, 17); g.fillStyle = '#ffffff'; g.fillText(label, lx + 4, ly + 3);
    }
    if (s.shipAt && s.shipMap === id && !s.boat) { const [bx, by] = s.shipAt.split(',').map(Number), [x, y] = mm.at(bx, by); g.font = `${mm.t + 6}px sans-serif`; g.fillText('⛵', x - 3, y - 4); }
    if (root.map === id) { const [x, y] = mm.at(root.x, root.y); star(x + mm.t / 2, y + mm.t / 2, Math.max(5, mm.t * 0.8)); if (s.boat) { g.font = `${mm.t + 6}px sans-serif`; g.fillText('⛵', x - 3, y - 4 - mm.t); } }
  });
}
setInterval(() => { if (sg?.ui?.type === 'map' && view.name === 'saga') sgMapDraw(); }, 400);

/* ---------- Battles ---------- */
const sgRnd = (a, b) => a + Math.random() * (b - a);
function sgBattle(group, opts = {}) {
  const counts = {}, foes = group.map(k => { counts[k] = (counts[k] || 0) + 1; return { key: k, hp: SG_MONSTERS[k].hp, max: SG_MONSTERS[k].hp, n: counts[k] }; });
  for (const f of foes) if (counts[f.key] > 1) f.tag = 'ABC'[f.n - 1]; else f.tag = '';
  sg.bt = { foes, hero: 0, round: 1, ward: 0, boss: !!opts.boss, fixed: opts.fixed, story: opts.story, defend: {}, flashFoe: {}, intro: true };
  sg.held = null; sg.flash = 16; sgBattleMusic();
  const names = foes.map(f => SG_MONSTERS[f.key].name + (f.tag ? ' ' + f.tag : ''));
  sgSay(opts.boss ? [`⚠️ ${names[0]} attacks!`] : [`${names.length === 1 ? `A ${names[0]} appears!` : `${names.join(', ')} appear!`}`], () => { sg.bt.intro = false; sgHeroTurn(); });
}
const sgFoeName = f => `${SG_MONSTERS[f.key].name}${f.tag ? ' ' + f.tag : ''}`;
const sgLiveFoes = () => sg.bt.foes.filter(f => f.hp > 0);
function sgHeroTurn() {
  const s = sgS(), b = sg.bt;
  while (b.hero < s.party.length && s.party[b.hero].hp <= 0) b.hero++;
  if (b.hero >= s.party.length) return sgFoesTurn();
  const h = s.party[b.hero], spells = sgSpellsOf(h);
  sgMenu(`${SG_HEROES[h.key].icon} <b>${esc(h.name)}</b> · ❤️ ${h.hp}/${sgMax(h, 'hp')} · 💧 ${h.mp}/${sgMax(h, 'mp')}`, [
    { label: '⚔️ Fight', fn: () => sgPickFoe(f => sgFight(h, f), () => sgHeroTurn()) },
    { label: `✨ ${h.key === 'knight' ? 'Skill' : 'Spell'}`, disabled: !spells.length, fn: () => sgSpellMenu(h) },
    { label: '🛡️ Defend', fn: () => { b.defend[b.hero] = true; sgSay(`${esc(h.name)} raises their guard.`, sgNextHero); } },
    { label: '🎒 Item', fn: () => sgItemMenu(true, h) },
    ...(b.hero === 0 ? [{ label: '🏃 Run', disabled: b.boss || !!b.fixed, fn: () => sgRun() }] : [])], null, { cols: 2 });
}
function sgNextHero() { if (!sg.bt) return; if (!sgLiveFoes().length) return sgWin(); sg.bt.hero++; sgHeroTurn(); }
function sgPickFoe(fn, back) {
  const live = sgLiveFoes(); if (live.length === 1) return fn(live[0]);
  sgMenu('Which foe?', live.map(f => ({ label: `👾 ${sgFoeName(f)}`, sub: `${Math.ceil(f.hp / f.max * 100)}% left`, fn: () => fn(f) })), back);
}
function sgHitFoe(f, dmg, lines) {
  f.hp = Math.max(0, f.hp - dmg); sg.bt.flashFoe[sg.bt.foes.indexOf(f)] = 14; trSound('hit');
  lines.push(`💥 ${esc(sgFoeName(f))} takes <b>${dmg}</b> damage!`);
  if (f.hp <= 0) lines.push(`✨ ${esc(sgFoeName(f))} is defeated!`);
}
function sgFight(h, f) {
  sgAsk(`⚔️ ${esc(h.name)} attacks ${esc(sgFoeName(f))}! Pick the meaning:`, (grade, fast) => {
    const lines = [], m = SG_MONSTERS[f.key];
    if (grade === 'wrong') { lines.push(`${esc(h.name)} swings… and misses!`); return sgSay(lines, sgNextHero); }
    const atk = sgStat(h, 'atk'), dmg = fast ? Math.max(2, Math.round(atk * sgRnd(1.4, 1.7))) : Math.max(1, Math.round((atk - m.def / 2) * sgRnd(0.85, 1.15)));
    if (fast) lines.push('⚡ A critical hit!');
    sgHitFoe(f, dmg, lines); sgSay(lines, sgNextHero);
  });
}
function sgSpellMenu(h) {
  sgMenu(`✨ ${esc(h.name)} · 💧 ${h.mp} MP`, sgSpellsOf(h).map(k => { const sp = SG_SPELLS[k]; return { label: `<b>${sp.name}</b> · ${sp.mp} MP`, sub: sp.desc, disabled: h.mp < sp.mp, fn: () => sgCastStart(h, k) }; }), () => sgHeroTurn());
}
const sgHealAmt = (h, sp) => Math.round((sp.power + sgStat(h, 'mag') * 1.0) * sgRnd(0.9, 1.1));
function sgCastStart(h, k) {
  const sp = SG_SPELLS[k], s = sgS(), go2 = target => sgAskSpell(`✨ ${esc(h.name)} casts <b>${sp.name}</b>! Spell this word:`, grade => sgCast(h, k, target, grade));
  if (sp.kind === 'hit' || sp.kind === 'power') return sgPickFoe(f => go2(f), () => sgSpellMenu(h));
  if (sp.kind === 'heal' || sp.kind === 'revive') return sgMenu(`${sp.name} on…`, s.party.map(t => ({ label: sgHeroLine(t), disabled: sp.kind === 'revive' ? t.hp > 0 : t.hp <= 0, fn: () => go2(t) })), () => sgSpellMenu(h));
  go2(null);
}
function sgCast(h, k, target, grade) {
  const sp = SG_SPELLS[k], b = sg.bt, lines = [];
  if (grade === 'wrong') { h.mp -= Math.ceil(sp.mp / 2); lines.push(`The word slips away… the ${sp.kind === 'power' ? 'skill' : 'spell'} fizzles! (−${Math.ceil(sp.mp / 2)} MP)`); return sgSay(lines, sgNextHero); }
  h.mp -= sp.mp;
  const mult = grade === 'close' ? 0.6 : 1;
  if (grade === 'close') lines.push('≈ Almost right: the spell works at partial power.');
  if (sp.kind === 'power') { const t = target.hp > 0 ? target : sgLiveFoes()[0]; const m = SG_MONSTERS[t.key]; sgHitFoe(t, Math.max(2, Math.round((sgStat(h, 'atk') * sp.mult - m.def / 2) * sgRnd(0.9, 1.1) * mult)), lines); }
  if (sp.kind === 'hit') { const t = target.hp > 0 ? target : sgLiveFoes()[0]; sgHitFoe(t, Math.max(2, Math.round((sp.power + sgStat(h, 'mag') * 0.8) * sgRnd(0.9, 1.1) * mult)), lines); }
  if (sp.kind === 'all') for (const f of sgLiveFoes()) sgHitFoe(f, Math.max(2, Math.round((sp.power + sgStat(h, 'mag') * 0.6) * sgRnd(0.85, 1.1) * mult)), lines);
  if (sp.kind === 'heal') { const bf = target.hp; target.hp = Math.min(sgMax(target, 'hp'), target.hp + Math.round(sgHealAmt(h, sp) * mult)); lines.push(`💚 ${esc(target.name)} recovers ${target.hp - bf} HP!`); }
  if (sp.kind === 'healAll') for (const a of sgAlive()) { const bf = a.hp; a.hp = Math.min(sgMax(a, 'hp'), a.hp + Math.round(sgHealAmt(h, sp) * mult)); lines.push(`💚 ${esc(a.name)} recovers ${a.hp - bf} HP!`); }
  if (sp.kind === 'revive') { target.hp = Math.ceil(sgMax(target, 'hp') * 0.5 * mult); lines.push(`🔥 ${esc(target.name)} is back on their feet!`); }
  if (sp.kind === 'ward') { b.ward = sp.turns + 1; lines.push('🛡️ A shining shield covers the whole party!'); }
  sg.flash = 6; sgSay(lines, sgNextHero);
}
function sgRun() { if (Math.random() < 0.65) { sg.bt = null; sgMusicSync(); return sgSay('You got away safely! 💨'); } sgSay('You couldn’t get away!', () => { sg.bt.hero = sgS().party.length; sgFoesTurn(); }); }
function sgFoesTurn() {
  const b = sg.bt, lines = [];
  for (const f of sgLiveFoes()) {
    const m = SG_MONSTERS[f.key], targets = sgAlive(); if (!targets.length) break;
    const t = targets[Math.floor(Math.random() * targets.length)], ti = sgS().party.indexOf(t);
    const soften = dmg => { if (b.defend[ti]) dmg = Math.ceil(dmg / 2); if (b.ward) dmg = Math.ceil(dmg / 2); return Math.max(1, dmg); };
    if (m.cast && Math.random() < m.cast.chance) {
      lines.push(`👾 ${esc(sgFoeName(f))} uses <b>${m.cast.name}</b>!`);
      for (const v of m.cast.all ? targets : [t]) { const vi = sgS().party.indexOf(v); let dmg = Math.round(m.cast.power * sgRnd(0.9, 1.25)); if (b.defend[vi]) dmg = Math.ceil(dmg / 2); if (b.ward) dmg = Math.ceil(dmg / 2); v.hp = Math.max(0, v.hp - dmg); lines.push(`${esc(v.name)} takes ${dmg} damage!${v.hp <= 0 ? ` 💤 ${esc(v.name)} falls!` : ''}`); }
    } else if (m.drain && Math.random() < m.drain && t.mp > 0) {
      const n = Math.min(t.mp, 3 + Math.floor(Math.random() * 3)); t.mp -= n; lines.push(`👾 ${esc(sgFoeName(f))} whispers… ${esc(t.name)} loses ${n} MP!`);
    } else {
      const heavy = m.heavy && Math.random() < m.heavy.chance, raw = (m.atk * (heavy ? m.heavy.mult : 1) - sgStat(t, 'def') / 2) * sgRnd(0.85, 1.15);
      const dmg = soften(Math.round(raw));
      t.hp = Math.max(0, t.hp - dmg);
      lines.push(heavy ? `👾 ${esc(sgFoeName(f))} uses <b>${m.heavy.name}</b>! ${esc(t.name)} takes ${dmg} damage!` : `👾 ${esc(sgFoeName(f))} attacks! ${esc(t.name)} takes ${dmg} damage!`);
      if (t.hp <= 0) lines.push(`💤 ${esc(t.name)} falls!`);
    }
  }
  sg.shake = 10; trSound('bump');
  sgSay(lines.length ? lines : ['…'], () => {
    if (!sgAlive().length) return sgLose();
    b.round++; b.hero = 0; b.defend = {}; if (b.ward > 0) { b.ward--; if (!b.ward) return sgSay('The shining shield fades.', sgHeroTurn); }
    sgHeroTurn();
  });
}
function sgWin() {
  const s = sgS(), b = sg.bt, xp = b.foes.reduce((a, f) => a + SG_MONSTERS[f.key].xp, 0), gold = b.foes.reduce((a, f) => a + SG_MONSTERS[f.key].gold, 0);
  const share = Math.max(1, Math.ceil(xp / Math.max(1, sgAlive().length))), lines = [`🏆 Victory! Each hero gains ${share} XP.`, `💰 You found ${gold} gold.`];
  s.gold += gold; sg.session.wins++; sg.session.nuts += b.boss ? 5 : 1;
  if (b.fixed) s.beaten[b.fixed] = 1;
  if (Math.random() < 0.12 && !b.boss) { s.bag.herb = (s.bag.herb || 0) + 1; lines.push('🌿 A monster dropped a Herb!'); }
  sgGiveXp(lines, share);
  sgJingle('sg_fanfare');
  const boss = b.boss, story = b.story; sg.bt = null; sgSaveNow(true);
  sgSay(lines, () => { sgMusicSync(); if (boss) sgSay(SG_STORY[(story || 'erased') + 'Win'] || SG_STORY.bossWin); });
}
function sgLose() {
  const s = sgS(); sg.bt = null;
  const lost = Math.floor(s.gold / 2); s.gold -= lost;
  sgSay(['The party has fallen…', `…You wake up at the inn in ${SG_MAPS[s.home || 'town'].name}. You lost ${lost} gold.`], () => {
    for (const h of s.party) { h.hp = sgMax(h, 'hp'); h.mp = sgMax(h, 'mp'); }
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
const sgMapSong = () => sgS()?.boat ? 'sg_sea' : SG_MAPS[sgS()?.map]?.song || 'sg_town';
function sgMusicSync() {
  if (!sg || !sgS()) return;
  if (trMusic.song?.once) return;
  const want = sg.bt ? (sg.bt.boss ? 'sg_boss' : 'sg_battle') : sgMapSong();
  if (trMusic.name !== want || (!trMusic.song && trMusic.on())) trMusic.play(want);
}
function sgBattleMusic() { if (!trMusic.on()) return; trMusic.after = null; trMusic.song = null; trMusic.name = null; sgMusicSync(); }
function sgJingle(name) { if (trMusic.on()) trMusic.jingle(name, sg?.bt ? (sg.bt.boss ? 'sg_boss' : 'sg_battle') : sgMapSong()); }

/* ---------- Art ---------- */
const sgCache = {};
const sgCanvas = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; draw(g); return c; };
const SGC = { grass: '#4caf50', grass2: '#43a047', grassL: '#81c784', forest: '#1e6b35', forestL: '#2e8b4a', trunk: '#6b4226', mount: '#8d7b68', mountD: '#5d4f43', snow: '#f2f2f2', water: '#2f6fd0', waterL: '#7ab8f5',
  sand: '#d9b878', sandD: '#b8955a', stone: '#9aa0a6', stoneD: '#5f656e', roof: '#c0392b', roofD: '#8e2a20', cream: '#f3e2c0', wood: '#8b5a2b', woodD: '#5e3a1a', gold: '#f4c542', carpet: '#b03a48', carpetD: '#7d2633',
  cave: '#7a5a3e', caveD: '#3e2a1c', caveL: '#99785a', ink: '#14141c', white: '#f6f6f0', purple: '#8e44ad', flower: '#ff8fb1' };
function sgTileArt(ch, theme) {
  return sgCache['t' + theme + ch] ||= sgCanvas(16, 16, g => {
    const R = (x, y, w, h, c) => { g.fillStyle = SGC[c] || c; g.fillRect(x, y, w, h); };
    const grass = () => { R(0, 0, 16, 16, 'grass'); R(3, 4, 1, 2, 'grass2'); R(11, 9, 1, 2, 'grass2'); R(7, 13, 1, 2, 'grass2'); R(13, 2, 1, 1, 'grassL'); };
    const arc = theme === 'archive', CF = arc ? '#3f6f78' : 'cave', CD = arc ? '#1d3a42' : 'caveD', CL = arc ? '#6fa3ab' : 'caveL';
    const caveFloor = () => { R(0, 0, 16, 16, CF); R(3, 5, 2, 1, CL); R(11, 11, 2, 1, CL); R(8, 2, 1, 1, CD); if (arc) { R(0, 7, 16, 1, CD); R(7, 0, 1, 7, CD); R(3, 8, 1, 8, CD); } };
    const sand = () => { R(0, 0, 16, 16, '#e6c77a'); R(3, 4, 3, 1, '#d4b062'); R(10, 10, 3, 1, '#d4b062'); R(12, 3, 1, 1, '#f3dca0'); R(5, 12, 1, 1, '#f3dca0'); };
    switch (ch) {
      case '.': grass(); break;
      case 'f': grass(); for (const [x, y] of [[1, 1], [8, 6]]) { R(x + 2, y + 6, 2, 3, 'trunk'); R(x, y + 1, 6, 5, 'forest'); R(x + 1, y, 4, 7, 'forest'); R(x + 1, y + 1, 2, 2, 'forestL'); } break;
      case 'T': grass(); R(7, 11, 3, 4, 'trunk'); R(2, 2, 12, 9, 'forest'); R(4, 0, 8, 13, 'forest'); R(4, 2, 4, 3, 'forestL'); break;
      case 'h': grass(); R(2, 8, 12, 4, 'grassL'); R(4, 6, 8, 2, 'grassL'); R(2, 11, 12, 1, 'grass2'); break;
      case 'M': if (theme === 'desert') { sand(); g.fillStyle = '#9a6a3a'; g.beginPath(); g.moveTo(0, 16); g.lineTo(8, 1); g.lineTo(16, 16); g.fill(); g.fillStyle = '#c8955a'; g.beginPath(); g.moveTo(3, 16); g.lineTo(8, 4); g.lineTo(13, 16); g.fill(); R(6, 3, 4, 2, '#e8c890'); break; }
        grass(); g.fillStyle = SGC.mountD; g.beginPath(); g.moveTo(0, 16); g.lineTo(8, 1); g.lineTo(16, 16); g.fill(); g.fillStyle = SGC.mount; g.beginPath(); g.moveTo(3, 16); g.lineTo(8, 4); g.lineTo(13, 16); g.fill(); R(6, 2, 4, 3, 'snow'); break;
      case 'W': case 'w': R(0, 0, 16, 16, 'water'); R(2, 4, 4, 1, 'waterL'); R(9, 10, 4, 1, 'waterL'); R(12, 3, 2, 1, 'waterL'); break;
      case 'B': R(0, 0, 16, 16, 'water'); R(1, 0, 14, 16, 'wood'); for (let y = 1; y < 16; y += 4) R(1, y, 14, 1, 'woodD'); R(1, 0, 1, 16, 'woodD'); R(14, 0, 1, 16, 'woodD'); break;
      case 'P': R(0, 0, 16, 16, 'sand'); R(3, 3, 2, 1, 'sandD'); R(10, 9, 2, 1, 'sandD'); R(6, 13, 1, 1, 'sandD'); break;
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
      case 'X': if (arc) { R(0, 0, 16, 16, '#162b30'); for (let y = 1; y < 16; y += 5) { R(0, y + 3, 16, 1, '#4a3420'); for (let x = 1, i = 0; x < 15; x += 2, i++) R(x, y, 1, 3, ['#c0392b', '#2e86c1', '#f4c542', '#27ae60', '#8e44ad'][(i + y) % 5]); } break; }
        R(0, 0, 16, 16, 'caveD'); R(1, 1, 6, 5, 'cave'); R(9, 3, 6, 6, 'cave'); R(3, 9, 7, 6, 'cave'); R(2, 2, 3, 1, 'caveL'); R(10, 4, 3, 1, 'caveL'); R(4, 10, 3, 1, 'caveL'); break;
      case 'C': caveFloor(); break;
      case 'c': caveFloor(); R(4, 9, 2, 2, 'caveD'); R(11, 4, 2, 2, 'caveD'); R(4, 9, 1, 1, 'caveL'); break;
      case '<': caveFloor(); R(2, 2, 12, 12, CL); R(4, 4, 8, 8, 'sand'); R(6, 6, 4, 4, 'white'); break;
      case '>': caveFloor(); for (let i = 0; i < 4; i++) R(2 + i, 3 + i * 3, 12 - i * 2, 3, i % 2 ? CD : 'ink'); break;
      default: R(0, 0, 16, 16, theme === 'cave' || arc ? CD : 'grass');
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
  });
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
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const sx = sg.shake > 0 ? Math.round(Math.sin(sg.shake * 2.3) * 2) : 0; if (sg.shake > 0) sg.shake--;
  g.setTransform(SG_SCALE, 0, 0, SG_SCALE, sx * SG_SCALE, 0);
  if (sg.bt) sgDrawBattle(g); else sgDrawWorld(g);
  if (sg.flash > 0) { g.fillStyle = '#ffffff'; g.globalAlpha = sg.flash / 20; g.fillRect(0, 0, SG_W, SG_H); g.globalAlpha = 1; sg.flash--; }
}
function sgDrawWorld(g) {
  const s = sgS(), m = SG_MAPS[s.map], W = m.rows[0].length, H = m.rows.length;
  let px = s.x, py = s.y, step = 0;
  if (sg.moving) { const k = sg.moving.t; px = sg.moving.fx + (sg.moving.tx - sg.moving.fx) * k; py = sg.moving.fy + (sg.moving.ty - sg.moving.fy) * k; step = k > 0.25 && k < 0.75 ? 1 : 0; }
  const camX = W * 16 <= SG_W ? (W * 16 - SG_W) / 2 : Math.max(0, Math.min(W * 16 - SG_W, px * 16 - 72)), camY = H * 16 <= SG_H ? (H * 16 - SG_H) / 2 : Math.max(0, Math.min(H * 16 - SG_H, py * 16 - 64));
  g.fillStyle = '#000'; g.fillRect(0, 0, SG_W, SG_H);
  const x0 = Math.max(0, Math.floor(camX / 16)), y0 = Math.max(0, Math.floor(camY / 16));
  for (let y = y0; y <= y0 + 10 && y < H; y++) for (let x = x0; x <= x0 + 11 && x < W; x++) g.drawImage(sgTileArt(m.rows[y][x], m.theme), Math.round(x * 16 - camX), Math.round(y * 16 - camY));
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
    else if (o.type === 'seal') { g.globalAlpha = 0.7 + 0.3 * Math.sin(sg.frame / 8); g.drawImage(sgSealArt(), ox(o.x), oy(o.y)); g.globalAlpha = 1; }
    else if (o.type === 'npc') g.drawImage(sgPersonArt(o.look, 'down', 0), ox(o.x), oy(o.y) - 2);
    else g.drawImage(sgMonsterArt(o.group[0]), ox(o.x) - (o.type === 'boss' ? 4 : 0), oy(o.y) - (o.type === 'boss' ? 8 : 0) + Math.round(Math.sin(sg.frame / 10)), o.type === 'boss' ? 24 : 16, o.type === 'boss' ? 24 : 16);
  }
  if (!s.boat && s.shipAt && s.shipMap === s.map) { const [bx, by] = s.shipAt.split(',').map(Number); g.drawImage(sgShipArt('left'), ox(bx), oy(by) - 2 + Math.round(Math.sin(sg.frame / 12))); }
  for (const n of sgNpcs(s.map)) g.drawImage(sgPersonArt(n.look, n.dir, 0), ox(n.x), oy(n.y) - 2);
  // party: followers walk behind the leader
  const party = s.party;
  for (let i = party.length - 1; i >= 1; i--) { const t = sg.trail[i - 1]; if (!t || s.boat || sgTile(s.map, t.x, t.y) === 'W') continue; g.drawImage(sgPersonArt(party[i].key, t.dir, step), ox(t.x), oy(t.y) - 2); }
  if (s.boat || (sg.moving && sgTile(s.map, sg.moving.tx, sg.moving.ty) === 'W' && s.flags.ship)) g.drawImage(sgShipArt(s.dir === 'right' ? 'right' : 'left'), Math.round(px * 16 - camX), Math.round(py * 16 - camY) - 2 + Math.round(Math.sin(sg.frame / 10)));
  else g.drawImage(sgPersonArt(party[0].key, s.dir, step), Math.round(px * 16 - camX), Math.round(py * 16 - camY) - 2);
  if (sg.banner && sg.frame < sg.banner.until && !sg.ui) sgWin2(g, 4, 4, Math.min(152, sgTextW(g, sg.banner.text) + 14), 16, () => sgText(g, sg.banner.text, 11, 8));
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
  const BG = { cave: ['#2a1d12', '#4a3420', '#5d432a'], archive: ['#10262b', '#2f5a62', '#4f8a93'], desert: ['#e8955a', '#d9b46a', '#f0cf8a'], sea: ['#2a6fb8', '#1f4f99', '#6fb0f5'] }[th] || ['#1d4f8a', '#3d8b45', '#5fb55f'];
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
      sgText(g, h.name.slice(0, w > 60 ? 9 : 6), x + 4, 4, active ? '#f4c542' : c); sgText(g, `H${String(h.hp).padStart(3)}`, x + 4, 12, c); sgText(g, `M${String(h.mp).padStart(3)}`, x + 4, 20, c);
      sgText(g, `L${h.lv}`, x + w - 18, 20, '#aab7ff');
    });
  });
  // monsters
  const live = b.foes, cnt = live.length, big = b.boss ? 2.6 : cnt === 1 ? 2 : cnt === 2 ? 1.7 : 1.35, size = Math.round(32 * big), gap = (SG_W - cnt * size) / (cnt + 1);
  live.forEach((f, i) => {
    if (f.hp <= 0 && !(b.flashFoe[i] > 0)) return;
    const blink = b.flashFoe[i] > 0 && b.flashFoe[i] % 4 < 2; if (b.flashFoe[i] > 0) b.flashFoe[i]--;
    if (blink) return;
    const x = Math.round(gap + i * (size + gap)), y = Math.round(86 - size + Math.sin((sg.frame + i * 20) / 16) * 1.5);
    g.globalAlpha = f.hp <= 0 ? Math.max(0, (b.flashFoe[i] || 0) / 14) : 1;
    g.drawImage(sgMonsterArt(f.key), x, Math.max(30, y), size, size); g.globalAlpha = 1;
  });
  if (b.ward) sgText(g, '🛡', 150, 34);
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
    if (sg.moving.t >= 1) { const s = sgS(); sg.trail.unshift({ x: sg.moving.fx, y: sg.moving.fy, dir: s.dir }); sg.trail.length = Math.min(sg.trail.length, 2); const prev = { x: sg.moving.fx, y: sg.moving.fy }; s.x = sg.moving.tx; s.y = sg.moving.ty; sg.moving = null; sgArrive(prev); }
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
    ${s ? `<div><b>${esc(s.name)}</b> · 📍 ${esc(SG_MAPS[s.map]?.name || '')}</div><div class="muted small">💰 ${s.gold} gold · ⏱️ ${fmt(s.playMs || 0)}${s.flags?.oracle ? ' · 🌅 Part two complete' : s.flags?.shard2 ? ' · 💎 2 shards' : s.flags?.kingDone ? ' · 💎 Part one complete' : s.flags?.shard ? ' · 💎 1 shard' : ''}</div>
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
