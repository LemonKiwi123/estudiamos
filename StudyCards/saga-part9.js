'use strict';
/* ================= Lexicon Saga, part nine =================
   1. Twice as big: every overworld region (land and sea) is doubled in size after all the other parts have built it.
      Each tile becomes 2×2, except one-tile places (towns, caves, docks, shrines, the castle, graves…), which stay a single
      tile with open ground around them. Warps, exits, chests, NPCs, place names, harbors and graves move with the map.
      Saved games from before are moved to the same spot on the bigger map, once.
   2. Priests on the overworld are spread out: away from each other, from towns and from shrines.
   3. A wandering merchant sets up far from any town, somewhere new every morning, in a land you have visited.
   Loaded after saga.js. */
const SG_BIG = 2;
const SG_POINT = new Set([...(typeof SG_KEEP !== 'undefined' ? SG_KEEP : ['U', 'V', 'E', 'I', 'Q', 'Y', 'z', 'Z', 'u']), '+', '&', 'j']);
const SG_BIG_MAPS = [...new Set(SG_WORLD.flat())];
const sgBigMap = id => SG_BIG_MAPS.includes(id);
const SG_ANCHOR = {};   // map → 'x,y' (old) → [x, y] (new) for one-tile places
(function sgDoubleWorld() {
  const most = arr => { const n = {}; let best = null; for (const c of arr) { n[c] = (n[c] || 0) + 1; if (!best || n[c] > n[best]) best = c; } return best; };
  const landFill = c => c && SG_WALK.has(c) && c !== 'W' && !SG_POINT.has(c) && c !== 'B';
  // 1) the tiles
  for (const id of SG_BIG_MAPS) {
    const m = SG_MAPS[id], H = m.rows.length, W = m.rows[0].length, at = (x, y) => (m.rows[y] || '')[x];
    const g = Array.from({ length: H * 2 }, () => Array(W * 2).fill('.')), A = SG_ANCHOR[id] = new Map();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = at(x, y);
      if (!SG_POINT.has(ch)) { g[2 * y][2 * x] = g[2 * y][2 * x + 1] = g[2 * y + 1][2 * x] = g[2 * y + 1][2 * x + 1] = ch; continue; }
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ dx, dy, ch: at(x + dx, y + dy) }));
      const pref = ch === 'Q' ? nb.find(n => n.ch === 'W') : nb.find(n => n.ch === 'P') || nb.find(n => n.ch === 'B') || nb.find(n => landFill(n.ch));
      const ax = pref?.dx > 0 ? 1 : 0, ay = pref?.dy > 0 ? 1 : 0;
      const fill = most(nb.map(n => n.ch).filter(c => landFill(c) && c !== 'P')) || '.';
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) g[2 * y + dy][2 * x + dx] = dx === ax && dy === ay ? ch : fill;
      A.set(x + ',' + y, [2 * x + ax, 2 * y + ay]);
    }
    // roads stay one tile wide: each old road tile keeps only its top-left cell, plus the cell that joins it to the road (or place) on its right or below
    const roadish = c => c === 'P' || c === 'B' || SG_POINT.has(c);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (at(x, y) !== 'P') continue;
      const fill = most([[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => at(x + dx, y + dy)).filter(c => landFill(c) && c !== 'P')) || '.';
      g[2 * y][2 * x + 1] = roadish(at(x + 1, y)) ? 'P' : fill; g[2 * y + 1][2 * x] = roadish(at(x, y + 1)) ? 'P' : fill; g[2 * y + 1][2 * x + 1] = fill;
    }
    m.rows = g.map(r => r.join(''));
  }
  // where a single old tile lands: one-tile places → their tile; anything else → the top-left of its 2×2 block
  const spot = (id, x, y) => SG_ANCHOR[id]?.get(x + ',' + y) || [2 * x, 2 * y];
  const block = (x, y) => [[2 * x, 2 * y], [2 * x + 1, 2 * y], [2 * x, 2 * y + 1], [2 * x + 1, 2 * y + 1]];
  // 2) warps on the big maps (a warp on an ordinary tile, like the edge of the map, covers all four new tiles)
  const moveTarget = w => { if (w && sgBigMap(w.map) && Number.isFinite(w.x) && Number.isFinite(w.y)) { const [x, y] = spot(w.map, w.x, w.y); w.x = x; w.y = y; } return w; };
  for (const id of SG_BIG_MAPS) {
    const m = SG_MAPS[id], old = m.warps || {}, nw = {};
    for (const [k, w] of Object.entries(old)) {
      const [x, y] = k.split(',').map(Number); moveTarget(w);
      if (SG_ANCHOR[id].has(k)) { const [a, b] = SG_ANCHOR[id].get(k); nw[a + ',' + b] = w; } else for (const [a, b] of block(x, y)) nw[a + ',' + b] ||= w;
    }
    m.warps = nw;
    if (m.doors) m.doors = Object.fromEntries(Object.entries(m.doors).map(([k, v]) => { const [x, y] = k.split(',').map(Number), [a, b] = spot(id, x, y); return [a + ',' + b, v]; }));
    if (m.graves) for (const gv of m.graves) Object.assign(gv, { x0: gv.x0 * 2, y0: gv.y0 * 2, x1: gv.x1 * 2 + 1, y1: gv.y1 * 2 + 1 });
    if (typeof m.zone === 'function') { const z = m.zone; m.zone = (x, y) => z(Math.floor(x / 2), Math.floor(y / 2)); }
    for (const n of m.npcs || []) { const [x, y] = spot(id, n.x, n.y); n.x = x; n.y = y; }
    const objs = [];
    for (const o of m.objs || []) {
      if (!Number.isFinite(o.x)) { objs.push(o); continue; }
      const [x, y] = spot(id, o.x, o.y);
      if (o.type === 'hidden' || o.type === 'whirlpool') for (const [a, b] of block(o.x, o.y)) objs.push(a === x && b === y ? Object.assign(o, { x: a, y: b }) : { ...o, x: a, y: b });   // stepped-on things cover their whole block
      else { o.x = x; o.y = y; objs.push(o); }
    }
    m.objs = objs;
  }
  // 3) every way back onto a big map from a town, cave, temple…
  for (const [id, m] of Object.entries(SG_MAPS)) {
    if (sgBigMap(id)) continue;
    for (const k of ['exitTo', 'upTo', 'downTo']) if (m[k] && typeof m[k] === 'object') moveTarget(m[k]);
    for (const w of Object.values(m.warps || {})) moveTarget(w);
  }
  // 4) place names and harbors
  if (typeof SG_PLACES !== 'undefined') for (const id of Object.keys(SG_PLACES)) if (sgBigMap(id)) SG_PLACES[id] = Object.fromEntries(Object.entries(SG_PLACES[id]).map(([k, v]) => { const [x, y] = k.split(',').map(Number), [a, b] = spot(id, x, y); return [a + ',' + b, v]; }));
  if (typeof SG_HARBOR !== 'undefined') for (const h of Object.values(SG_HARBOR)) if (sgBigMap(h.map)) { const [x, y] = h.at.split(',').map(Number); h.at = sgBigShipSpot(h.map, x, y).join(','); }
})();
/* the water tile of an old ship spot that touches land, so the ship can still be boarded */
function sgBigShipSpot(map, x, y) {
  const rows = SG_MAPS[map].rows, t = (a, b) => (rows[b] || '')[a], land = (a, b) => { const c = t(a, b); return c && c !== 'W' && SG_WALK.has(c); };
  const cells = [[2 * x, 2 * y], [2 * x + 1, 2 * y], [2 * x, 2 * y + 1], [2 * x + 1, 2 * y + 1]].filter(([a, b]) => t(a, b) === 'W');
  return cells.find(([a, b]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => land(a + dx, b + dy))) || cells[0] || [2 * x, 2 * y];
}

/* ---------- reachable land on a big map (from its towns, caves and arrival spots) ---------- */
const sgBigReach = {};
function sgLandReach(id) {
  if (sgBigReach[id]) return sgBigReach[id];
  const m = SG_MAPS[id], H = m.rows.length, W = m.rows[0].length, t = (x, y) => (m.rows[y] || '')[x], ok = (x, y) => { const c = t(x, y); return c && c !== 'W' && SG_WALK.has(c); };
  const seen = new Set(), q = [];
  const seed = (x, y) => { if (ok(x, y) && !seen.has(x + ',' + y)) { seen.add(x + ',' + y); q.push([x, y]); } };
  m.rows.forEach((r, y) => [...r].forEach((c, x) => { if ('UVEQ'.includes(c)) seed(x, y); }));
  for (const k of Object.keys(m.warps || {})) { const [x, y] = k.split(',').map(Number); seed(x, y); }
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) seed(x + dx, y + dy); }
  return sgBigReach[id] = seen;
}
function sgFreeCells(id, test) {   // walkable, reachable, nothing standing there, not a one-tile place, not on the map edge
  const m = SG_MAPS[id], H = m.rows.length, W = m.rows[0].length, reach = sgLandReach(id), out = [];
  const taken = new Set([...(m.npcs || []), ...(m.objs || [])].filter(o => Number.isFinite(o.x)).map(o => o.x + ',' + o.y));
  for (const k of reach) { const [x, y] = k.split(',').map(Number), c = m.rows[y][x]; if (x < 3 || y < 3 || x > W - 4 || y > H - 4 || taken.has(k) || SG_POINT.has(c) || m.warps?.[k] || c === 'B') continue; if (!test || test(c, x, y)) out.push([x, y]); }
  return out;
}
const sgPlacesOf = (id, chars) => { const out = []; SG_MAPS[id].rows.forEach((r, y) => [...r].forEach((c, x) => { if (chars.includes(c)) out.push([x, y]); })); return out; };
const sgDist = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);

/* ---------- 2. priests spread out ---------- */
(function sgSpreadPriests() {
  for (const id of SG_BIG_MAPS) {
    const m = SG_MAPS[id], priests = (m.npcs || []).filter(n => n.priest || n.roadPriest); if (!priests.length) continue;
    const towns = sgPlacesOf(id, 'UVEQI'), shrines = sgPlacesOf(id, 'z'), placed = [];
    for (const p of priests) {
      const ox = p.x, oy = p.y; p.x = p.y = -99; const roadOnly = !!p.roadPriest;
      let cells = sgFreeCells(id, c => roadOnly ? c === 'P' : c !== 'P' && c !== 'W'); if (!cells.length) cells = sgFreeCells(id);
      let best = null, bestScore = -1;
      for (const c of cells) {
        const dTown = Math.min(99, ...towns.map(t => sgDist(c, t))), dShrine = Math.min(99, ...shrines.map(t => sgDist(c, t))), dPriest = Math.min(99, ...placed.map(t => sgDist(c, t)));
        if (dTown < 6) continue;   // not right next to a town (towns have their own church)
        const score = Math.min(dPriest, 40) * 3 + Math.min(dTown, 30) + Math.min(dShrine, 16) + ((c[0] * 7 + c[1] * 13) % 5) * 0.1;
        if (score > bestScore) { bestScore = score; best = c; }
      }
      if (!best) best = cells[0]; if (!best) { p.x = ox; p.y = oy; continue; }   // (an island with nowhere else to stand: keep the old spot)
      p.x = best[0]; p.y = best[1]; placed.push(best);
    }
  }
})();

/* ---------- 3. 🧳 the wandering merchant ---------- */
const SG_WANDER_GEAR = ['galebow', 'kris', 'coral', 'tiderobe', 'mythril', 'runestaff', 'mythmail', 'starrobe', 'tigerclaw', 'nightedge', 'shadowgarb', 'scalevest'].filter(k => typeof SG_GEAR !== 'undefined' && SG_GEAR[k]?.price);
const SG_WANDER_ITEMS = ['megaherb', 'inkflask', 'phoenix', 'ether', 'holywater', 'antidote', 'inktonic', 'feather'].filter(k => SG_ITEMS[k]?.price);
const sgDayNo = (s = sgS()) => Math.floor(((s?.steps || 0) + (s?.clockShift || 0)) / (typeof SG_DAY_STEPS !== 'undefined' ? SG_DAY_STEPS : 320));
function sgWanderPick(s, day) {
  const lands = SG_BIG_MAPS.filter(id => (typeof sgLand === 'function' ? sgLand(id) : !id.startsWith('sea_')) && (id === 'field' || s.seen?.[id]));
  let seed = (day * 9301 + (S.sagaSlot || 'a').charCodeAt(0) * 49297) % 233280; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let tries = 0; tries < 12; tries++) {
    const id = lands[Math.floor(rnd() * lands.length)] || 'field', towns = sgPlacesOf(id, 'UVEQIzY');
    for (const far of [16, 12, 8]) {
      const cells = sgFreeCells(id, c => c !== 'P' && c !== 'W').filter(c => Math.min(99, ...towns.map(t => sgDist(c, t))) >= far);
      if (cells.length) { const c = cells[Math.floor(rnd() * cells.length)]; return { day, map: id, x: c[0], y: c[1] }; }
    }
  }
  return null;
}
function sgWanderSync() {
  const s = sgS(); if (!s) return; const day = sgDayNo(s);
  if (!s.wander || s.wander.day !== day || !SG_MAPS[s.wander.map]) { const w = sgWanderPick(s, day); if (w) s.wander = w; }
  for (const id of SG_BIG_MAPS) { const m = SG_MAPS[id]; if (m.npcs?.some(n => n.wanderer)) m.npcs = m.npcs.filter(n => !n.wanderer); }
  const w = s.wander; if (!w) return;
  const gear = SG_WANDER_GEAR.filter((_, i) => (i * 7 + w.day * 3) % SG_WANDER_GEAR.length < 3), items = SG_WANDER_ITEMS.filter((_, i) => (i + w.day) % 3 !== 0);
  SG_MAPS[w.map].npcs.push({ id: 'wanderer', x: w.x, y: w.y, dir: 'down', look: 'pilgrim', name: 'Wandering merchant', wanderer: true, wGear: gear, wItems: items,
    lines: ['Wandering merchant: Well met, traveler! Not many find me out here.', 'I pack up and move on every morning, so buy while you can!'] });
}
function sgWanderTalk(n) {
  sgSay(n.lines, () => sgMenu('🧳 Wandering merchant', [
    { label: '🧪 Rare goods', sub: 'Potions and supplies you won’t find in every town.', fn: () => sgShop(n.wItems, 'items') },
    ...(n.wGear.length ? [{ label: '⚔️ Gear from faraway lands', sub: n.wGear.map(k => SG_GEAR[k].name).join(', '), fn: () => sgShop(n.wGear, 'gear') }] : []),
    { label: '💬 Where will you be tomorrow?', fn: () => sgSay('Wandering merchant: Somewhere far from the towns, where the road runs out. Keep your eyes open!') },
    { label: 'Goodbye', fn: () => {} }], () => {}));
}
{ const before = typeof sgTalkFirst === 'function' ? sgTalkFirst : null; sgTalkFirst = n => { if (n?.wanderer) { sgWanderTalk(n); return true; } return before ? before(n) : false; }; }
{ const before = sgWarp; sgWarp = function (map, x, y, dir, quiet) { const r = before.apply(this, arguments); try { if (sgBigMap(map)) sgWanderSync(); } catch (e) { console.error(e); } return r; }; }
if (typeof SG_CHAT !== 'undefined') SG_CHAT.push('A wandering merchant roams the wild lands, far from any town. He moves on every morning.', 'The lands feel so much bigger these days. Good thing you can make camp anywhere.');

/* ---------- saved games from before the lands grew ---------- */
function sgBigFix(s) {
  if (!s) return;
  if (!s.flags.big2) {
    if (sgBigMap(s.map) && Number.isFinite(s.x)) { const p = SG_ANCHOR[s.map]?.get(s.x + ',' + s.y) || [2 * s.x, 2 * s.y]; s.x = p[0]; s.y = p[1]; }
    if (s.shipAt && sgBigMap(s.shipMap)) { const [x, y] = s.shipAt.split(',').map(Number); s.shipAt = sgBigShipSpot(s.shipMap, x, y).join(','); }
    for (const k of ['campFrom', 'ghostFrom']) { const f = s[k]; if (f && sgBigMap(f.map) && Number.isFinite(f.x)) { const p = SG_ANCHOR[f.map]?.get(f.x + ',' + f.y) || [2 * f.x, 2 * f.y]; f.x = p[0]; f.y = p[1]; } }
    s.flags.big2 = 1;
  }
  if (sgBigMap(s.map) && !s.boat && !s.fly) {   // never stand inside a mountain or the sea
    const m = SG_MAPS[s.map], c = (m.rows[s.y] || '')[s.x];
    if (!c || !SG_WALK.has(c) || c === 'W') { const near = [...sgLandReach(s.map)].map(k => k.split(',').map(Number)).sort((a, b) => sgDist(a, [s.x, s.y]) - sgDist(b, [s.x, s.y]))[0]; if (near) { s.x = near[0]; s.y = near[1]; } }
  }
  try { sgWanderSync(); } catch (e) { console.error(e); }
}
{ const before = typeof sgFixMore === 'function' ? sgFixMore : null; sgFixMore = s => { before?.(s); sgBigFix(s); }; }
