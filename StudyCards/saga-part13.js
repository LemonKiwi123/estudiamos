'use strict';
/* Lexicon Saga, part thirteen: walk into inns, item shops and smithies (the keepers stand behind their counters),
   a furnished inn, wooden barrels with loot in towns, buildings and dungeons, and a real flickering campfire. */

/* ---------- the people behind the counters ---------- */
Object.assign(SG_LOOKS, {
  innkeep:  { A: { hair: 'long', shirt: 1, pants: 2, body: 'apron' }, colors: { 0: '#f2c29a', 1: '#f6e7c8', 2: '#b0477a', 3: '#6a3a1a' } },
  shopkeep: { A: { hair: 'bandana', shirt: 1, pants: 3, body: 'apron' }, colors: { 0: '#e0a878', 1: '#2e86c1', 2: '#27ae60', 3: '#2a1a10' } },
  smith:    { A: { hair: 'bald', beard: 1, shirt: 2, pants: 3, body: 'apron' }, colors: { 0: '#c88a5a', 1: '#6a6a6a', 2: '#3a2a1a', 3: '#2a1a10' } },
});

/* ---------- the rooms ----------  O wooden wall  _ floor  = counter  v cupboard  e bed  t table  a plant  b barrel  K rug  w armor stand  q fireplace / forge
   new: ð shelf of potions and jars  ø display table  þ weapon rack  œ suit of armor on a wooden floor */
const SG_INN_ROWS = ['OOOOOOOqOOOO', 'Ov__ðOe_e_eO', 'O====O_____O', 'O__________O', 'O_t______t_O', 'Oa___KK____O', 'Oe_e_KK__b_O', 'O____KK____O', 'Ob___KK___aO', 'OOOOO__OOOOO'];
const SG_SHOP_ROWS = ['OOOOOOOOOOOO', 'Oðð_ð__ððvaO', 'OO========OO', 'O__________O', 'Ob_ø____ø_bO', 'O__________O', 'O_ø______ø_O', 'O__________O', 'Oa___KK___bO', 'OOOOO__OOOOO'];
const SG_SMITH_ROWS = ['OOOOOqOOOOOO', 'Oœþ_____þœbO', 'OO========OO', 'O__________O', 'Oœ_þ____þ_œO', 'O__________O', 'Ob________bO', 'O__________O', 'O____KK____O', 'OOOOO__OOOOO'];
const SG_ROOM = {
  inn: { rows: SG_INN_ROWS, label: 'Inn', song: 'sg_tavern', keeper: [2, 1, 'innkeep', 'Innkeeper'],
    hello: 'Innkeeper: Welcome, traveler! Rest your feet. A warm bed is waiting for you.',
    folk: [{ id: 'guest', x: 9, y: 5, dir: 'left', look: 'sailor', lines: ['Traveler: The beds here are soft as clouds. I sleep like a log every time.'] },
      { id: 'guest2', x: 3, y: 4, dir: 'right', look: 'lass', lines: ['Guest: A night at the inn heals everyone and wakes you up bright and early.'] }, { id: 'innchat', x: 8, y: 7, dir: 'left', look: 'man', chat: true, wander: 1 }] },
  shop: { rows: SG_SHOP_ROWS, label: 'Item shop', keeper: [5, 1, 'shopkeep', 'Shopkeeper'],
    hello: 'Shopkeeper: Welcome! Herbs, tonics, feathers… have a look around.',
    folk: [{ id: 'buyer', x: 3, y: 3, dir: 'up', look: 'elder', lines: ['Customer: Herbs work in battle too. I never leave town without a few.'] }, { id: 'shopchat', x: 6, y: 6, dir: 'left', look: 'kid', chat: true, wander: 1 }] },
  smith: { rows: SG_SMITH_ROWS, label: 'Smithy', keeper: [5, 1, 'smith', 'Blacksmith'],
    hello: 'Blacksmith: Need a sharper blade or thicker armor? You came to the right place.',
    folk: [{ id: 'buyer', x: 7, y: 5, dir: 'up', look: 'guard', name: 'Soldier', lines: ['Soldier: Better armor means monsters hit softer. Worth every coin!'] }] },
};
for (const [town, m] of Object.entries(SG_MAPS)) {
  if (!m.town || !m.doors) continue;
  for (const [at, kind] of Object.entries(m.doors)) {
    const R = SG_ROOM[kind]; if (!R) continue;
    const [dx, dy] = at.split(',').map(Number), id = `${town}_${kind}_${dx}_${dy}`, [kx, ky, look, name] = R.keeper;
    SG_MAPS[id] = { name: `${m.name} · ${R.label}`, song: R.song || m.song || 'sg_town', inside: true, theme: 'tavern', rows: R.rows, exitTo: { map: town, x: dx, y: dy + 1, dir: 'down' }, entry: { x: 5, y: 8 },
      inn: m.inn, shop: m.shop, smith: m.smith, room: kind,
      npcs: [{ id: 'keeper', x: kx, y: ky, dir: 'down', look, name, svc: kind }, ...R.folk.map(n => ({ ...n }))], objs: [] };
    (m.rooms ||= {})[at] = id;
  }
}
/* the door now takes you inside; the keeper offers what the door used to */
{ const base = sgDoor;
  sgDoor = function (kind) {
    const s = sgS(), m = SG_MAPS[s.map], [dx, dy] = SG_DIRS[s.dir], id = m.rooms?.[`${s.x + dx},${s.y + dy}`], r = SG_MAPS[id];
    if (!r) return base.apply(this, arguments);
    if (typeof sgDoorMore === 'function' && sgDoorMore(kind)) return;   // shops close at night
    sgWarp(id, r.entry.x, r.entry.y, 'up');
  };
}
SG_Q_SKIP.push('svc');   // keepers stay behind their counters: no quests from them
{ const before = sgTalkFirst;
  sgTalkFirst = function (n) {
    if (!n.svc) return before.apply(this, arguments);
    const s = sgS(), R = SG_ROOM[n.svc];
    if (n.svc !== 'inn' && typeof sgIsNight === 'function' && sgIsNight(s)) { sgSay(`${n.name}: We’re closed for the night. Come back in the morning!`); return true; }
    sgSay(R.hello, () => sgDoor(n.svc));   // inside, sgDoor runs the old service (the room isn't a town)
    return true;
  };
}

/* ---------- wooden barrels with loot ---------- */
const sgHash13 = str => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };
function sgBarrelPlaces(id, m, want, opt = {}) {
  const rows = m.rows, H = rows.length, W = Math.max(...rows.map(r => r.length)), gates = m.gates || {};
  const tile = (x, y) => (rows[y] || '')[x];
  const walk = (x, y) => SG_WALK.has(tile(x, y)) || !!gates[x + ',' + y];
  const start = m.home || m.start || m.entry; if (!start || !walk(start.x, start.y)) return [];
  const busy = new Set(), near = new Set(), mark = (x, y, r) => { for (let yy = y - r; yy <= y + r; yy++) for (let xx = x - r; xx <= x + r; xx++) near.add(xx + ',' + yy); };
  for (const o of m.objs || []) { busy.add(o.x + ',' + o.y); mark(o.x, o.y, 1); }
  for (const n of m.npcs || []) { busy.add(n.x + ',' + n.y); mark(n.x, n.y, (n.wander || 0) + 1); }
  for (const k of [...Object.keys(m.doors || {}), ...Object.keys(m.signs || {}), ...Object.keys(m.warps || {})]) { const [x, y] = k.split(',').map(Number); mark(x, y, 1); }
  for (const [x, y] of m.spots || []) mark(x, y, 1);
  mark(start.x, start.y, 2); if (m.stairs) mark(m.stairs.x, m.stairs.y, 2);
  const reach = block => {   // how many tiles you can walk to from the start
    const seen = new Set([start.x + ',' + start.y]), q = [[start.x, start.y]];
    while (q.length) { const [x, y] = q.pop(); for (const [ax, ay] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { const k = ax + ',' + ay; if (seen.has(k) || block.has(k) || !walk(ax, ay)) continue; seen.add(k); q.push([ax, ay]); } }
    return seen.size;
  };
  const wallish = c => c && !SG_WALK.has(c);
  const floorOk = m.town ? c => c === '.' || c === 'd' : c => c === 'C' || c === 'c';
  const cands = [];
  for (let y = 1; y < H - 2; y++) for (let x = 1; x < W - 1; x++) {
    const k = x + ',' + y; if (!floorOk(tile(x, y)) || busy.has(k) || near.has(k) || gates[k]) continue;
    const walls = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b]) => wallish(tile(a, b))).length;
    const [lo, hi] = opt.walls || [m.town ? 1 : 2, 2]; if (walls < lo || walls > hi) continue;   // barrels: tucked against a wall or into a corner, never in a doorway
    if ('DSz%^ŵ'.split('').some(c => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([a, b]) => tile(a, b) === c))) continue;
    cands.push([x, y, sgHash13(id + k)]);
  }
  cands.sort((a, b) => a[2] - b[2]);
  const out = [], block = new Set(), full = reach(block);
  for (const [x, y] of cands) {
    if (out.length >= want) break;
    if (out.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < (opt.gap || 5))) continue;
    block.add(x + ',' + y);
    if (reach(block) !== full - out.length - 1) { block.delete(x + ',' + y); continue; }   // never cut anything off
    out.push([x, y]);
  }
  return out;
}
/* ---------- town wells; some of them have a rope ladder down to a cave with a pond ----------
   ŵ well   ǒ cave water   ř rope ladder (climb back up)   ǐ glowing mushrooms */
const SG_WELL_CAVES = [
  ['XXXXXXXXXXXXXXXX', 'XXCCCXXXXXXCCCXX', 'XCCCCCXǒǒXCCǐCCX', 'XCǐCCǒǒǒǒǒCCCCCX', 'XXCCCǒǒǒǒǒǒCCCXX', 'XCCCCǒǒǒǒǒCCCCCX', 'XCCCCCǒǒǒCCCCCXX',
   'XXCCCCCǒCCCCCCCX', 'XCCCCCCǒCCCCXXXX', 'XCCCCCǒǒCCCCCCCX', 'XXCǐCǒǒCCCCCCCXX', 'XCCCCǒCCCCřCCCCX', 'XXCCCCCCCCCCCCXX', 'XXXXXXXXXXXXXXXX'],
  ['XXXXXXXXXXXXXXXX', 'XXCCCCXXXXCCCCXX', 'XCCCǐCCXXCCCCCCX', 'XCřCCCCCCCCǒǒCCX', 'XXCCCCCCCCǒǒǒǒCX', 'XXXCCCCCCǒǒǒǒǒCX', 'XCCCCCCCǒǒǒǒCCXX',
   'XCCCCCCǒǒCCCCCCX', 'XCCǐCCǒCCCCCCǐCX', 'XXCCCǒCCCCCCCCXX', 'XCCCǒǒCCCCCCCCCX', 'XCCǒǒCCCXXCCCCCX', 'XXCCCCCXXXXCCCXX', 'XXXXXXXXXXXXXXXX'],
];
['ř'].forEach(t => SG_WALK.add(t));
const sgPut13 = (m, x, y, ch) => { m.rows = m.rows.slice(); m.rows[y] = m.rows[y].slice(0, x) + ch + m.rows[y].slice(x + 1); };
let sgWellN = 0;
for (const [town, m] of Object.entries(SG_MAPS)) {
  if (!m.town || !m.rows) continue;
  const [spot] = sgBarrelPlaces(town + ':well', m, 1, { walls: [0, 0] }); if (!spot) continue;
  const [wx, wy] = spot; sgPut13(m, wx, wy, 'ŵ');
  const open = town === 'town' || sgHash13(town + ':wellcave') < 0.5; if (!open) continue;   // about half the wells go somewhere
  const id = town + '_well', rows = SG_WELL_CAVES[sgWellN++ % SG_WELL_CAVES.length], ry = rows.findIndex(r => r.includes('ř')), rx = rows[ry].indexOf('ř');
  const floor = []; rows.forEach((row, y) => [...row].forEach((c, x) => { if (c === 'C' && Math.abs(x - rx) + Math.abs(y - ry) > 3) floor.push([x, y, sgHash13(id + x + ',' + y)]); }));
  const nook = floor.filter(([x, y]) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].filter(([a, b2]) => (rows[b2] || '')[a] === 'X').length >= 2).sort((a, c) => a[2] - c[2]);
  const pick = []; for (const f of nook) { if (pick.length >= 4) break; if (pick.every(([a, b2]) => Math.abs(a - f[0]) + Math.abs(b2 - f[1]) >= 4)) pick.push(f); }
  const tier = Math.max(1, Math.round((m.inn || 10) / 10)), stage = SG_ITEMS.megaherb && tier >= 5 ? 'megaherb' : SG_ITEMS.bigherb && tier >= 2 ? 'bigherb' : 'herb';
  const objs = [];
  if (pick[0]) objs.push({ id: `wc:${town}:1`, type: 'chest', x: pick[0][0], y: pick[0][1], give: { gold: 60 * tier } });
  if (pick[1]) objs.push({ id: `wc:${town}:2`, type: 'chest', x: pick[1][0], y: pick[1][1], give: { [stage]: 2, ...(SG_ITEMS.seaglass ? { seaglass: 1 } : {}) } });
  for (const f of pick.slice(2)) objs.push({ id: `brl:${id}:${f[0]},${f[1]}`, type: 'barrel', x: f[0], y: f[1] });
  SG_MAPS[id] = { name: `${m.name} · Old Well`, song: 'sg_cave', theme: 'cave', inside: true, rows, entry: { x: rx, y: ry }, exitTo: { map: town, x: wx, y: wy + 1, dir: 'down' },
    warps: { [rx + ',' + ry]: { map: town, x: wx, y: wy + 1, dir: 'down' } }, npcs: [], objs, wellOf: town };
  (m.wells ||= {})[wx + ',' + wy] = id;
}
{ const base = sgTileMore;
  sgTileMore = function (ch, theme, g, R, t) {
    if (ch === 'ŵ') { t.base(); R(2, 15, 12, 1, 'rgba(0,0,0,.2)'); R(2, 7, 12, 8, '#9aa0a6'); R(2, 7, 12, 1, '#c4c8cc'); for (const x of [5, 9, 13]) R(x - 1, 9, 1, 6, '#6f757c'); R(2, 11, 12, 1, '#6f757c');
      R(4, 8, 8, 2, '#14283c'); R(5, 8, 3, 1, '#3f7fb0'); R(2, 2, 2, 6, '#6b4226'); R(12, 2, 2, 6, '#6b4226'); R(1, 0, 14, 3, '#a8323a'); R(1, 2, 14, 1, '#7d2633'); R(0, 2, 2, 1, '#7d2633'); R(14, 2, 2, 1, '#7d2633');
      R(4, 4, 8, 1, '#5e3a1a'); R(8, 5, 1, 2, '#d8c38a'); R(7, 6, 3, 2, '#8b5a2b'); R(7, 6, 3, 1, '#a87440'); return true; }
    if (ch === 'ǒ') { R(0, 0, 16, 16, '#1d4a72'); R(0, 0, 16, 1, '#123150'); R(2, 4, 4, 1, '#4f8fc0'); R(9, 9, 5, 1, '#4f8fc0'); R(5, 13, 3, 1, '#3f7fb0'); R(12, 3, 2, 1, '#8fc4e8'); return true; }
    if (ch === 'ř') { t.caveFloor(); R(3, 2, 10, 13, 'rgba(255,236,170,.22)'); R(5, 0, 1, 14, '#c8a86a'); R(10, 0, 1, 14, '#c8a86a'); for (let y = 1; y < 14; y += 3) R(5, y, 6, 1, '#a8884a'); return true; }
    if (ch === 'ǐ') { t.caveFloor(); for (const [x, y, c] of [[3, 8, '#7fe0d0'], [9, 5, '#a08cf0'], [11, 10, '#7fe0d0']]) { R(x + 1, y + 2, 1, 3, '#d8d2c4'); R(x, y, 3, 2, c); R(x + 1, y, 1, 1, '#ffffff'); } return true; }
    return base(ch, theme, g, R, t);
  };
}
const SG_WELL_PEEK = ['You peer down the well. Plop! A pebble falls a long way down.', 'Cool, clear water. You see your own face looking back up.', 'Someone dropped a coin in here for luck. It’s far too deep to reach.'];
{ const before = sgInteractMore;
  sgInteractMore = function (fx, fy) {
    const s = sgS(), m = SG_MAPS[s.map];
    if (sgTile(s.map, fx, fy) !== 'ŵ') return before.apply(this, arguments);
    const id = m.wells?.[fx + ',' + fy], r = SG_MAPS[id];
    if (!r) { sgSay(`🪣 ${SG_WELL_PEEK[Math.floor(sgHash13(s.map + fx + fy + (s.steps || 0)) * SG_WELL_PEEK.length)]}`); return true; }
    sgMenu('🪣 A rope ladder hangs down into the dark. Water echoes somewhere below.', [
      { label: '🧗 Climb down', fn: () => { const first = !s.flags['seen:' + id]; s.flags['seen:' + id] = 1; sgWarp(id, r.entry.x, r.entry.y, 'down'); if (first) sgSay(['You climb down the rope ladder into a cool, damp cave.', 'A stream trickles into a quiet pond. Was that a chest in the shadows?']); } },
      { label: 'Not now', fn: () => {} }], () => {});
    return true;
  };
}
for (const [id, m] of Object.entries(SG_MAPS)) {
  if (!m.rows || m.camp || m.solo) continue;
  m.objs ||= [];
  const add = (x, y) => { if (!m.objs.some(o => o.x === x && o.y === y)) m.objs.push({ id: `brl:${id}:${x},${y}`, type: 'barrel', x, y }); };
  if (m.inside) {   // the barrels standing in taverns, inns, shops and cellars: the ones you can reach
    const e = m.entry, seen = new Set(), q = e ? [[e.x, e.y]] : [];
    if (e) seen.add(e.x + ',' + e.y);
    while (q.length) { const [x, y] = q.pop(); for (const [a, b] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) { const k = a + ',' + b; if (!seen.has(k) && (SG_WALK.has((m.rows[b] || '')[a]) || m.gates?.[k])) { seen.add(k); q.push([a, b]); } } }
    m.rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'b' && [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([a, b]) => seen.has(a + ',' + b))) add(x, y); }));
  } else if (m.town) sgBarrelPlaces(id, m, 3).forEach(([x, y]) => add(x, y));
  else if (m.gen) sgBarrelPlaces(id, m, 2).forEach(([x, y]) => add(x, y));
}
const SG_BARREL_EMPTY = ['Just a few old apples. You leave them for the horses.', 'Only rainwater inside. A frog looks up at you.', 'Empty, except for a very surprised spider.', 'Nothing but sawdust and a smell of pickles.'];
function sgBarrelLoot(o) {
  const r = sgHash13(o.id + ':loot'), r2 = sgHash13(o.id + ':n'), st = typeof sgStage === 'function' ? sgStage() : 0, has = k => !!SG_ITEMS[k];
  const heal = st < 3 ? 'herb' : st < 7 ? 'bigherb' : 'megaherb', mana = st < 6 ? 'ether' : 'inktonic';
  if (r < 0.32) return { gold: Math.round((8 + st * 9) * (0.6 + r2 * 0.8)) };
  if (r < 0.57 && has(heal)) return { [heal]: r2 < 0.7 ? 1 : 2 };
  if (r < 0.68 && has('antidote')) return { antidote: 1 };
  if (r < 0.78 && has(mana)) return { [mana]: 1 };
  if (r < 0.85 && has('feather')) return { feather: 1 };
  if (r < 0.89 && has('phoenix')) return { phoenix: 1 };
  if (r < 0.92 && has('seaglass')) return { seaglass: 1 };
  return null;
}
{ const before = sgUseObjMore;
  sgUseObjMore = function (o) {
    if (o.type === 'campfire') { sgCampFire(); return true; }
    if (o.type !== 'barrel') return before.apply(this, arguments);
    const s = sgS();
    if (s.got[o.id]) { sgSay('🛢️ The barrel is empty.'); return true; }
    s.got[o.id] = 1; const loot = sgBarrelLoot(o), lines = loot ? sgGive(loot) : [SG_BARREL_EMPTY[Math.floor(sgHash13(o.id) * SG_BARREL_EMPTY.length)]];
    sgSaveNow(true); sgSay(['🛢️ You look inside the barrel…', ...lines]);
    return true;
  };
}
function sgBarrelArt(open) {
  return sgCache['barrel' + (open ? 1 : 0)] ||= sgCanvas(16, 16, g => {
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    R(4, 15, 9, 1, 'rgba(0,0,0,.28)');
    R(4, 3, 8, 12, '#8b5a2b'); R(3, 4, 10, 10, '#8b5a2b'); R(5, 3, 1, 12, '#a87440'); R(9, 3, 1, 12, '#7a4a22'); R(11, 4, 1, 10, '#5e3a1a'); R(12, 4, 1, 10, '#5e3a1a');
    R(3, 5, 10, 1, '#3a2a14'); R(3, 11, 10, 1, '#3a2a14'); R(4, 5, 2, 1, '#6a5a4a'); R(4, 11, 2, 1, '#6a5a4a');
    if (open) { R(4, 2, 8, 2, '#5e3a1a'); R(5, 2, 6, 2, '#1e120a'); R(12, 1, 3, 2, '#a87440'); R(13, 0, 1, 1, '#a87440'); }
    else { R(4, 2, 8, 2, '#a87440'); R(5, 2, 6, 1, '#c8955a'); R(7, 2, 2, 1, '#5e3a1a'); }
  });
}

{ const base = sgTileMore;   // shelves of goods, display tables, weapon racks
  sgTileMore = function (ch, theme, g, R, t) {
    if (ch === 'ð') { R(0, 0, 16, 16, '#6b4226'); R(1, 1, 14, 15, '#4a2c17'); R(1, 5, 14, 1, '#a87440'); R(1, 10, 14, 1, '#a87440'); R(1, 15, 14, 1, '#a87440');
      for (const [x, y, c] of [[2, 2, '#c0392b'], [6, 2, '#27ae60'], [10, 2, '#2e86c1'], [3, 7, '#8e44ad'], [7, 7, '#e67e22'], [11, 7, '#1abc9c'], [2, 12, '#f4c542'], [6, 12, '#d35400'], [10, 12, '#c0392b']]) { R(x, y, 3, 3, c); R(x + 1, y - 1, 1, 1, '#d8d2c4'); R(x, y, 1, 1, 'rgba(255,255,255,.45)'); }
      return true; }
    if (ch === 'ø') { t.floor(); R(1, 5, 14, 7, '#6b4226'); R(1, 5, 14, 2, '#a87440'); R(2, 12, 2, 3, '#4a2c17'); R(12, 12, 2, 3, '#4a2c17');
      R(3, 2, 3, 4, '#c0392b'); R(4, 1, 1, 1, '#d8d2c4'); R(7, 3, 3, 3, '#27ae60'); R(8, 2, 1, 1, '#d8d2c4'); R(11, 2, 2, 4, '#2e86c1'); R(11, 1, 2, 1, '#d8d2c4'); R(3, 2, 1, 1, 'rgba(255,255,255,.5)'); return true; }
    if (ch === 'œ') { t.floor(); R(5, 1, 6, 5, '#c9d3e0'); R(6, 3, 4, 1, '#141420'); R(4, 6, 8, 6, '#c9d3e0'); R(4, 6, 8, 1, '#8e9aae'); R(7, 7, 2, 4, '#f4c542'); R(5, 12, 2, 2, '#8e9aae'); R(9, 12, 2, 2, '#8e9aae'); R(7, 0, 2, 1, '#c0392b'); R(3, 14, 10, 2, '#4a2c17'); return true; }
    if (ch === 'þ') { t.floor(); R(1, 3, 14, 2, '#5e3a1a'); R(1, 12, 14, 2, '#5e3a1a'); R(2, 3, 1, 12, '#4a2c17'); R(13, 3, 1, 12, '#4a2c17');
      for (const x of [4, 7, 10]) { R(x, 1, 1, 11, '#c9d3e0'); R(x + 1, 2, 1, 9, '#8e9aae'); R(x - 1, 11, 3, 1, '#f4c542'); R(x, 12, 1, 2, '#6b4226'); } return true; }
    return base(ch, theme, g, R, t);
  };
}
/* ---------- the campfire: logs on the ground, live flames on top ---------- */
{ const base = sgTileMore;
  sgTileMore = function (ch, theme, g, R, t) {
    if (ch !== '%') return base(ch, theme, g, R, t);
    t.base(); for (const [x, y] of [[2, 11], [5, 13], [9, 13], [12, 11], [3, 8], [11, 8]]) { R(x, y, 3, 2, '#7a7466'); R(x, y, 3, 1, '#9a9488'); }
    R(4, 11, 8, 2, '#5e3a1a'); R(5, 10, 6, 1, '#7a4a22'); R(3, 12, 3, 2, '#4a2c17'); R(10, 12, 3, 2, '#4a2c17'); R(6, 9, 4, 2, '#2a1a10');
    return true;
  };
}
if (SG_MAPS.camp) SG_MAPS.camp.rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === '%') SG_MAPS.camp.objs.push({ id: 'campfire', type: 'campfire', x, y }); }));
function sgDrawCampfire(g, X, Y) {
  const f = sg.frame, n = (a, b) => Math.sin(f * a + b);
  g.save();
  g.globalAlpha = 0.13 + 0.05 * n(0.21, 0) + 0.03 * n(0.53, 1);   // warm glow on the grass
  g.fillStyle = '#ffb347'; g.beginPath(); g.arc(X + 8, Y + 9, 13 + 1.5 * n(0.3, 2), 0, Math.PI * 2); g.fill();
  g.globalAlpha = 1;
  const tongues = [[4, 0.9], [6, 1.25], [8, 1.5], [10, 1.2], [12, 0.85]];
  for (let i = 0; i < tongues.length; i++) {   // each tongue of flame leans, grows and shrinks on its own
    const [x0, k] = tongues[i], h = Math.max(2, Math.round(k * (6 + 2.4 * n(0.37, i * 1.9) + 1.6 * n(0.81, i * 3.1)))), lean = Math.round(0.8 * n(0.17, i));
    for (let j = 0; j < h; j++) {
      const t = j / h, w = t < 0.35 ? 3 : t < 0.75 ? 2 : 1, x = X + x0 - 1 + Math.round(lean * t) + (w === 1 ? 1 : 0), y = Y + 11 - j;
      g.fillStyle = t < 0.3 ? '#ff6a1a' : t < 0.65 ? '#ff9a2a' : '#e8401a'; g.fillRect(x, y, w, 1);
    }
  }
  for (let i = 0; i < 3; i++) {   // the bright heart of the fire
    const hh = Math.round(3 + 1.5 * n(0.45, i * 2.3)); g.fillStyle = i === 1 ? '#fff3a0' : '#ffd84a'; g.fillRect(X + 6 + i * 1.5, Y + 12 - hh, 2, hh);
  }
  for (let i = 0; i < 4; i++) {   // sparks drifting up into the night
    const p = ((f * 0.55 + i * 19) % 34) / 34, sx = X + 8 + Math.round(3.5 * Math.sin(f * 0.09 + i * 2.2) + (i - 1.5) * 1.5), sy = Y + 7 - p * 16;
    g.globalAlpha = 1 - p; g.fillStyle = p < 0.5 ? '#ffd84a' : '#ff8a3a'; g.fillRect(sx, Math.round(sy), 1, 1);
  }
  g.restore();
}
{ const before = sgDrawObjMore;
  sgDrawObjMore = function (g, o, ox, oy) {
    if (o.type === 'barrel') { g.drawImage(sgBarrelArt(!!sgS().got[o.id]), ox(o.x), oy(o.y)); return true; }
    if (o.type === 'campfire') { sgDrawCampfire(g, ox(o.x), oy(o.y)); return true; }
    return before.apply(this, arguments);
  };
}

/* ---------- Spanish, French and Japanese ---------- */
const GT13 = {
  es: { suffix: [[' · Inn', ' · Posada'], [' · Item shop', ' · Tienda'], [' · Smithy', ' · Herrería']], names: { Innkeeper: 'Posadera', Shopkeeper: 'Tendero', Blacksmith: 'Herrero', Soldier: 'Soldado' },
    lines: { 'Innkeeper: Welcome, traveler! Rest your feet. A warm bed is waiting for you.': 'Posadera: ¡Bienvenido, viajero! Descansa los pies. Una cama calentita te espera.',
      'Shopkeeper: Welcome! Herbs, tonics, feathers… have a look around.': 'Tendero: ¡Bienvenido! Hierbas, tónicos, plumas… echa un vistazo.',
      'Blacksmith: Need a sharper blade or thicker armor? You came to the right place.': 'Herrero: ¿Necesitas una hoja más afilada o una armadura más gruesa? Has venido al lugar indicado.',
      'Traveler: The beds here are soft as clouds. I sleep like a log every time.': 'Viajero: Las camas de aquí son suaves como nubes. Siempre duermo como un tronco.',
      'Guest: A night at the inn heals everyone and wakes you up bright and early.': 'Huésped: Una noche en la posada cura a todos y te despierta temprano y con energía.',
      'Customer: Herbs work in battle too. I never leave town without a few.': 'Cliente: Las hierbas también sirven en combate. Nunca salgo del pueblo sin unas cuantas.',
      'Soldier: Better armor means monsters hit softer. Worth every coin!': 'Soldado: Mejor armadura significa golpes más suaves. ¡Vale cada moneda!',
      '{p}: We’re closed for the night. Come back in the morning!': '{p}: Cerramos por la noche. ¡Vuelve por la mañana!',
      '🛢️ The barrel is empty.': '🛢️ El barril está vacío.', '🛢️ You look inside the barrel…': '🛢️ Miras dentro del barril…',
      'Just a few old apples. You leave them for the horses.': 'Solo unas manzanas viejas. Las dejas para los caballos.', 'Only rainwater inside. A frog looks up at you.': 'Solo agua de lluvia. Una rana te mira.',
      'Empty, except for a very surprised spider.': 'Vacío, salvo por una araña muy sorprendida.', 'Nothing but sawdust and a smell of pickles.': 'Nada más que serrín y olor a pepinillos.' } },
  fr: { suffix: [[' · Inn', ' · Auberge'], [' · Item shop', ' · Boutique'], [' · Smithy', ' · Forge']], names: { Innkeeper: 'Aubergiste', Shopkeeper: 'Marchand', Blacksmith: 'Forgeron', Soldier: 'Soldat' },
    lines: { 'Innkeeper: Welcome, traveler! Rest your feet. A warm bed is waiting for you.': 'Aubergiste : Bienvenue, voyageur ! Repose tes pieds. Un lit bien chaud t’attend.',
      'Shopkeeper: Welcome! Herbs, tonics, feathers… have a look around.': 'Marchand : Bienvenue ! Herbes, toniques, plumes… jette un œil.',
      'Blacksmith: Need a sharper blade or thicker armor? You came to the right place.': 'Forgeron : Besoin d’une lame plus tranchante ou d’une armure plus solide ? Tu es au bon endroit.',
      'Traveler: The beds here are soft as clouds. I sleep like a log every time.': 'Voyageur : Les lits ici sont doux comme des nuages. Je dors comme une souche à chaque fois.',
      'Guest: A night at the inn heals everyone and wakes you up bright and early.': 'Cliente : Une nuit à l’auberge soigne tout le monde, et on se réveille frais et dispos.',
      'Customer: Herbs work in battle too. I never leave town without a few.': 'Client : Les herbes marchent aussi en combat. Je ne quitte jamais la ville sans quelques-unes.',
      'Soldier: Better armor means monsters hit softer. Worth every coin!': 'Soldat : Une meilleure armure, et les monstres frappent moins fort. Ça vaut chaque pièce !',
      '{p}: We’re closed for the night. Come back in the morning!': '{p} : C’est fermé pour la nuit. Reviens demain matin !',
      '🛢️ The barrel is empty.': '🛢️ Le tonneau est vide.', '🛢️ You look inside the barrel…': '🛢️ Tu regardes dans le tonneau…',
      'Just a few old apples. You leave them for the horses.': 'Juste quelques vieilles pommes. Tu les laisses aux chevaux.', 'Only rainwater inside. A frog looks up at you.': 'Seulement de l’eau de pluie. Une grenouille te regarde.',
      'Empty, except for a very surprised spider.': 'Vide, à part une araignée très surprise.', 'Nothing but sawdust and a smell of pickles.': 'Rien que de la sciure et une odeur de cornichons.' } },
  ja: { suffix: [[' · Inn', '・宿屋'], [' · Item shop', '・道具屋'], [' · Smithy', '・かじ屋']], names: { Innkeeper: '宿屋の主人', Shopkeeper: '道具屋の主人', Blacksmith: 'かじ屋', Soldier: '兵士' },
    lines: { 'Innkeeper: Welcome, traveler! Rest your feet. A warm bed is waiting for you.': '宿屋の主人：いらっしゃい、旅の人！ ゆっくり休んでね。あたたかいベッドが待ってるよ。',
      'Shopkeeper: Welcome! Herbs, tonics, feathers… have a look around.': '道具屋の主人：いらっしゃい！ 薬草、トニック、羽…ゆっくり見ていって。',
      'Blacksmith: Need a sharper blade or thicker armor? You came to the right place.': 'かじ屋：よく切れる剣か、じょうぶなよろいが要るのか？ ここに来て正解だ。',
      'Traveler: The beds here are soft as clouds. I sleep like a log every time.': '旅人：ここのベッドは雲みたいにふかふか。いつもぐっすり眠れるよ。',
      'Guest: A night at the inn heals everyone and wakes you up bright and early.': '客：宿屋にひと晩泊まれば、みんな元気になって朝すっきり起きられるよ。',
      'Customer: Herbs work in battle too. I never leave town without a few.': '客：薬草は戦いでも使えるよ。わたしはいつも少し持って町を出るんだ。',
      'Soldier: Better armor means monsters hit softer. Worth every coin!': '兵士：いいよろいなら、モンスターの攻撃も軽くなる。お金を出す価値はあるぞ！',
      '{p}: We’re closed for the night. Come back in the morning!': '{p}：今夜はもう閉店だよ。朝にまた来てね！',
      '🛢️ The barrel is empty.': '🛢️ たるはからっぽだ。', '🛢️ You look inside the barrel…': '🛢️ たるの中をのぞいてみた…',
      'Just a few old apples. You leave them for the horses.': '古いリンゴが少しだけ。馬のために残しておこう。', 'Only rainwater inside. A frog looks up at you.': '雨水だけ。カエルがこっちを見ている。',
      'Empty, except for a very surprised spider.': 'からっぽ。びっくりしたクモが一匹いるだけ。', 'Nothing but sawdust and a smell of pickles.': 'おがくずと、ピクルスのにおいだけ。' } },
};
Object.assign(GT13.es, { s2: [[' · Old Well', ' · Pozo Viejo']] }); Object.assign(GT13.fr, { s2: [[' · Old Well', ' · Vieux Puits']] }); Object.assign(GT13.ja, { s2: [[' · Old Well', '・古井戸']] });
Object.assign(GT13.es.lines, { '🪣 You peer down the well. Plop! A pebble falls a long way down.': '🪣 Te asomas al pozo. ¡Plop! Una piedrita cae muy, muy abajo.', '🪣 Cool, clear water. You see your own face looking back up.': '🪣 Agua fresca y clara. Ves tu propia cara mirándote.',
  '🪣 Someone dropped a coin in here for luck. It’s far too deep to reach.': '🪣 Alguien tiró una moneda para la suerte. Está demasiado hondo para alcanzarla.', '🪣 A rope ladder hangs down into the dark. Water echoes somewhere below.': '🪣 Una escalera de cuerda cuelga hacia la oscuridad. Se oye agua allá abajo.',
  '🧗 Climb down': '🧗 Bajar', 'Not now': 'Ahora no', 'You climb down the rope ladder into a cool, damp cave.': 'Bajas por la escalera de cuerda a una cueva fresca y húmeda.', 'A stream trickles into a quiet pond. Was that a chest in the shadows?': 'Un arroyo cae en un estanque tranquilo. ¿Eso entre las sombras era un cofre?' });
Object.assign(GT13.fr.lines, { '🪣 You peer down the well. Plop! A pebble falls a long way down.': '🪣 Tu regardes au fond du puits. Plouf ! Un caillou tombe très, très bas.', '🪣 Cool, clear water. You see your own face looking back up.': '🪣 Une eau fraîche et claire. Ton propre visage te regarde.',
  '🪣 Someone dropped a coin in here for luck. It’s far too deep to reach.': '🪣 Quelqu’un a jeté une pièce pour la chance. C’est bien trop profond pour l’attraper.', '🪣 A rope ladder hangs down into the dark. Water echoes somewhere below.': '🪣 Une échelle de corde pend dans le noir. De l’eau résonne plus bas.',
  '🧗 Climb down': '🧗 Descendre', 'Not now': 'Pas maintenant', 'You climb down the rope ladder into a cool, damp cave.': 'Tu descends l’échelle de corde dans une grotte fraîche et humide.', 'A stream trickles into a quiet pond. Was that a chest in the shadows?': 'Un ruisseau coule dans un étang tranquille. Était-ce un coffre dans l’ombre ?' });
Object.assign(GT13.ja.lines, { '🪣 You peer down the well. Plop! A pebble falls a long way down.': '🪣 井戸をのぞいてみた。ポチャン！ 小石がずっと下まで落ちていった。', '🪣 Cool, clear water. You see your own face looking back up.': '🪣 つめたくてすんだ水。自分の顔がうつっている。',
  '🪣 Someone dropped a coin in here for luck. It’s far too deep to reach.': '🪣 だれかがおまじないにコインを投げたみたい。深すぎて手がとどかない。', '🪣 A rope ladder hangs down into the dark. Water echoes somewhere below.': '🪣 なわばしごが暗やみへたれている。下のほうで水の音がひびく。',
  '🧗 Climb down': '🧗 おりる', 'Not now': 'やめておく', 'You climb down the rope ladder into a cool, damp cave.': 'なわばしごをおりると、ひんやりしめった洞くつに出た。', 'A stream trickles into a quiet pond. Was that a chest in the shadows?': '小川が静かな池に流れこんでいる。かげにあるのは…宝箱？' });
for (const l of ['es', 'fr', 'ja']) GT13[l].suffix.push(...GT13[l].s2);
if (typeof GT_BOOKS !== 'undefined') for (const [l, b] of Object.entries(GT13)) { const B = GT_BOOKS[l]; if (!B) continue; Object.assign(B.names ||= {}, b.names); Object.assign(B.lines ||= {}, b.lines); (B.suffix ||= []).push(...b.suffix); B.ready = false; }

/* ---------- the airship becomes a winged galleon: a wooden sky-ship with a quill sail, held up by feathered wings that flap ---------- */
sgAirshipArt = function (dir) {
  const flap = sg ? Math.floor(sg.frame / 14) % 2 : 0, key = 'galleon' + (dir === 'left' ? 'L' : 'R') + flap;
  return sgCache[key] ||= sgCanvas(16, 18, g => {
    if (dir === 'left') { g.translate(16, 0); g.scale(-1, 1); }   // the bow points the way you fly
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    R(7, 0, 1, 11, '#5e3a1a'); R(8, 0, 3, 2, '#c0392b');                                           // mast and pennant
    R(3, 2, 9, 7, '#f6f6f0'); R(3, 8, 9, 1, '#d8d2c4'); R(6, 4, 3, 3, '#f4c542'); R(7, 3, 1, 1, '#f4c542');   // sail with a gold quill badge
    R(1, 11, 14, 3, '#8b5a2b'); R(2, 14, 12, 2, '#6b4226'); R(1, 11, 14, 1, '#a87440'); R(14, 9, 2, 3, '#a87440');   // hull and bow
    for (const x of [3, 6, 9]) R(x, 12, 1, 1, '#3a2010');                                           // portholes
    const w = flap ? -2 : 0;                                                                         // wings up, then down
    R(0, 8 + w, 4, 3, '#ffffff'); R(0, 7 + w * 1.5, 2, 1, '#ffffff'); R(1, 10 + w, 3, 1, '#c9d3e0');
    R(12, 8 + w, 4, 3, '#ffffff'); R(14, 7 + w * 1.5, 2, 1, '#ffffff'); R(12, 10 + w, 3, 1, '#c9d3e0');
  });
};
