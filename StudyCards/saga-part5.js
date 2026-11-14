'use strict';
/* ================= Lexicon Saga: the continent and its seas (all original) =================
   The nine regions become one continent ringed by ocean, with small islands along the coast,
   rivers you can sail up, four harbor towns full of merchants and sailors, and more shrines everywhere.
   The coastal seas link up from region to region, so the Quill Swan can sail all the way around.
   Loaded after saga-part4.js and before saga.js. */
const SG_SEA_BAND = 3;   // how many tiles of ocean along the outer coast
const sgRowsSet = (map, x, y, ch) => { const r = SG_MAPS[map].rows; if (!r[y] || x < 0 || x >= r[y].length) return; r[y] = r[y].slice(0, x) + ch + r[y].slice(x + 1); };
const sgRowsGet = (map, x, y) => (SG_MAPS[map].rows[y] || '')[x];
const SG_KEEP = new Set(['U', 'V', 'E', 'I', 'Q', 'Y', 'z', 'Z', 'u']);
/* the outer coast of every border region becomes ocean */
function sgOceanSide(map, side) {
  const m = SG_MAPS[map], H = m.rows.length, W = m.rows[0].length, warpAt = new Set(Object.keys(m.warps || {}));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const inBand = side === 'left' ? x < SG_SEA_BAND : side === 'right' ? x >= W - SG_SEA_BAND : side === 'top' ? y < SG_SEA_BAND : y >= H - SG_SEA_BAND;
    if (!inBand || SG_KEEP.has(sgRowsGet(map, x, y)) || (warpAt.has(x + ',' + y) && sgRowsGet(map, x, y) !== 'W')) continue;
    sgRowsSet(map, x, y, 'W');
  }
}
const SG_COAST = { north1: ['left', 'top'], north2: ['top'], north3: ['top', 'right'], field: ['left'], eastsea: ['right'], south1: ['left', 'bottom'], south2: ['bottom'], south3: ['bottom', 'right'] };
for (const [map, sides] of Object.entries(SG_COAST)) sides.forEach(side => sgOceanSide(map, side));
/* little islands along the coast; some have a shrine you can only reach by boat */
const SG_ISLANDS = {
  north1: [[1, 6, '..'], [12, 1, 'z.'], [1, 17, 'f.']], north2: [[5, 1, '.f'], [20, 1, 'z.']], north3: [[9, 1, 'f.'], [26, 12, '.z'], [25, 19, '..']],
  field: [[1, 4, 'f.'], [1, 14, 'z.']], eastsea: [[32, 10, 'f'], [31, 16, 'z']],
  south1: [[1, 3, '.f'], [1, 10, 'z.'], [14, 20, 'f.']], south2: [[4, 20, '.f'], [21, 20, 'z.']], south3: [[11, 20, 'f.'], [26, 7, 'z'], [26, 14, '.']],
};
for (const [map, list] of Object.entries(SG_ISLANDS)) for (const [x, y, tiles] of list) [...tiles].forEach((ch, i) => sgRowsSet(map, x + i, y, ch));
/* rivers you can sail up from the sea (bridges stay where the roads cross) */
const SG_RIVERS = {
  north1: [[3, 14], [5, 14]], north2: [[12, 3], [12, 8]], north3: [[17, 14], [17, 17]], south1: [[13, 10], [13, 18]], south3: [[21, 4], [21, 10]],
  seravel: [[9, 10], [20, 10]],
};
for (const [map, [[x0, y0], [x1, y1]]] of Object.entries(SG_RIVERS)) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
    const t = sgRowsGet(map, x, y); if (SG_KEEP.has(t) || t === 'B') continue;
    sgRowsSet(map, x, y, t === 'P' ? 'B' : 'W');
  }
}
for (const id of ['field', 'seravel']) SG_MAPS[id].seaZone ||= 'deepsea';


/* ---------- four harbor towns ---------- */
const sgCarve = (map, [x0, y0], [x1, y1]) => { let x = x0, y = y0; const put = () => { const t = sgRowsGet(map, x, y); if (SG_KEEP.has(t) || t === 'B' || t === 'P') return; sgRowsSet(map, x, y, t === 'W' ? 'B' : 'P'); };
  put(); while (x !== x1) { x += x1 > x ? 1 : -1; put(); } while (y !== y1) { y += y1 > y ? 1 : -1; put(); } };
const SG_PLACES_ADD = {};
const SG_TAVERNS_MORE = {};

sgRowsSet('field', 4, 11, 'U'); sgRowsSet('field', 3, 11, 'Q'); sgCarve('field', [4, 12], [8, 12]);
sgNewTown('brinehold', "Brinehold", ["####################", "#.gggg.T.F....RRRR.#", "#.HDHH...TF...HHDH.#", "#..P............P.F#", "#..PPPPPPPPPPPPPP..#", "#........PP...T....#", "#.RRRR...PP...NNNN.#", "#.HDHH...PP...HHDHT#", "#..P.....PP.....P..#", "#F.PPPPPPPPPPPPPP..#", "#.......SPP......T.#", "#.RRRR...PP...RRRR.#", "#.HDHH...PP...HHDH.#", "#..P.....PP.....P..#", "#..PPPPPPPPPPPPPP..#", "#########PP#########"], { map: 'field', x: 4, y: 12, dir: 'down' }, {"3,2": "tavern", "16,2": "inn", "3,7": "shop", "16,7": "church", "3,12": "smith"}, { song: 'sg_port', inn: 60,
  shop: ['herb', 'bigherb', 'megaherb', 'antidote', 'ether', 'inktonic', 'feather', 'phoenix'], smith: ['steel', 'silver', 'coral', 'tiderobe', 'longbow', 'kris', 'tigerclaw', 'scalevest'], harbor: true });
SG_MAPS.field.warps['4,11'] = { map: 'brinehold', x: 9, y: 14, dir: 'up' };
SG_HARBOR.field = { map: 'field', at: '2,11' };
(SG_PLACES_ADD.field ||= {})['4,11'] = ["Brinehold", 'brinehold'];
{ const sp = [[17, 13], [2, 8], [11, 6], [4, 10], [6, 2], [11, 2]], people = [["sailor", "Welcome to Brinehold, the west harbor of Aldermere! Ships come and go all day."], ["sailor", "Sail north along the coast and you reach the Frostmark Tundra. South takes you to the jungle."], ["man", "There’s a shrine on a little island just south of here. Sailors pray there before a long trip."]];
  SG_MAPS.brinehold.npcs = [
    { id: 'merchant', x: sp[0][0], y: sp[0][1], dir: 'down', look: 'barkeep', name: 'Merchant', merchant: ["megaherb", "inkflask", "phoenix"], lines: ['Merchant: Rare goods from across the sea! Take a look.'] },
    { id: 'armorer', x: sp[1][0], y: sp[1][1], dir: 'down', look: 'man', name: 'Sea trader', merchantGear: ["galebow", "kris", "coral", "tiderobe"], lines: ['Sea trader: Blades and bows from faraway smithies!'] },
    ...people.map(([look, line], i) => ({ id: 'sea' + i, x: sp[2 + i][0], y: sp[2 + i][1], dir: 'down', look, lines: [line], wander: i === 0 ? 1 : 0 }))];
}
SG_TAVERNS_MORE['brinehold'] = { barkeep: 'Salty Brin', talk: [['sailor', 'Every coast of the continent is linked by sea now. Sail all the way round if you like!'], ['man', 'Island shrines heal the whole crew. Steer close and pray from the deck.']] };
sgRowsSet('north1', 16, 4, 'U'); sgRowsSet('north1', 16, 3, 'Q'); sgCarve('north1', [16, 5], [16, 9]);
sgNewTown('frostport', "Frostport", ["####################", "#.RRRR........gggg.#", "#THDHH.....T..HHDH.#", "#..P............P..#", "#..PPPPPPPPPPPPPP..#", "#........PPT.......#", "#.NNNN...PP...RRRR.#", "#.HDHH.T.PP...HHDH.#", "#..P.....PP.....P..#", "#..PPPPPPPPPPPPPP..#", "#.......SPP........#", "#.T..T...PP...RRRR.#", "#........PP..THHDH.#", "#........PP.....P.T#", "#..PPPPPPPPPPPPPP.T#", "#########PP#########"], { map: 'north1', x: 16, y: 5, dir: 'down' }, {"3,2": "inn", "16,2": "tavern", "3,7": "church", "16,7": "shop", "16,12": "smith"}, { theme: 'snow', song: 'sg_snow', inn: 60,
  shop: ['herb', 'bigherb', 'megaherb', 'antidote', 'ether', 'inktonic', 'feather', 'phoenix'], smith: ['steel', 'silver', 'coral', 'tiderobe', 'longbow', 'kris', 'tigerclaw', 'scalevest'], harbor: true });
SG_MAPS.north1.warps['16,4'] = { map: 'frostport', x: 9, y: 14, dir: 'up' };
SG_HARBOR.north1 = { map: 'north1', at: '16,2' };
(SG_PLACES_ADD.north1 ||= {})['16,4'] = ["Frostport", 'frostport'];
{ const sp = [[13, 8], [11, 10], [12, 4], [11, 9], [13, 3], [16, 10]], people = [["sailor", "Frostport never freezes. The sea keeps moving, so the ice can’t catch it."], ["sailor", "East along the north coast is the Thundercrag shore, and past that, the black Inkblight sea."], ["elder", "An island shrine sits just off the coast, north of here. Ice all around it, but warm inside."]];
  SG_MAPS.frostport.npcs = [
    { id: 'merchant', x: sp[0][0], y: sp[0][1], dir: 'down', look: 'barkeep', name: 'Merchant', merchant: ["megaherb", "inkflask", "antidote"], lines: ['Merchant: Rare goods from across the sea! Take a look.'] },
    { id: 'armorer', x: sp[1][0], y: sp[1][1], dir: 'down', look: 'man', name: 'Sea trader', merchantGear: ["mythril", "runestaff", "mythmail", "starrobe"], lines: ['Sea trader: Blades and bows from faraway smithies!'] },
    ...people.map(([look, line], i) => ({ id: 'sea' + i, x: sp[2 + i][0], y: sp[2 + i][1], dir: 'down', look, lines: [line], wander: i === 0 ? 1 : 0 }))];
}
SG_TAVERNS_MORE['frostport'] = { barkeep: 'Salty Fros', talk: [['sailor', 'Every coast of the continent is linked by sea now. Sail all the way round if you like!'], ['man', 'Island shrines heal the whole crew. Steer close and pray from the deck.']] };
sgRowsSet('south1', 8, 16, 'U'); sgRowsSet('south1', 8, 18, 'Q'); sgCarve('south1', [8, 17], [10, 14]);
sgNewTown('palmcove', "Palmcove", ["####################", "#.RRRR.....F..gggg.#", "#.HDHH........HHDH.#", "#..P............P..#", "#..PPPPPPPPPPPPPP..#", "#........PP........#", "#.RRRR...PP...NNNN.#", "#.HDHH...PP...HHDH.#", "#..P.....PP.T...P..#", "#..PPPPPPPPPPPPPP..#", "#F......SPP...T....#", "#.RRRR...PP.......T#", "#.HDHH...PP.T.T....#", "#..P.....PP.......T#", "#T.PPPPPPPPPPPPPP..#", "#########PP#########"], { map: 'south1', x: 8, y: 17, dir: 'down' }, {"3,2": "shop", "16,2": "tavern", "3,7": "inn", "16,7": "church", "3,12": "smith"}, { theme: 'jungle', song: 'sg_jungle', inn: 60,
  shop: ['herb', 'bigherb', 'megaherb', 'antidote', 'ether', 'inktonic', 'feather', 'phoenix'], smith: ['steel', 'silver', 'coral', 'tiderobe', 'longbow', 'kris', 'tigerclaw', 'scalevest'], harbor: true });
SG_MAPS.south1.warps['8,16'] = { map: 'palmcove', x: 9, y: 14, dir: 'up' };
SG_HARBOR.south1 = { map: 'south1', at: '8,19' };
(SG_PLACES_ADD.south1 ||= {})['8,16'] = ["Palmcove", 'palmcove'];
{ const sp = [[15, 12], [6, 6], [12, 9], [11, 3], [2, 8], [2, 13]], people = [["sailor", "Palmcove! Best fish on the whole continent. Don’t tell the Marsh folk I said that."], ["sailor", "You can sail up the river from here, right into the heart of the jungle."], ["lass", "East along the coast is Tidewater, then the red canyon. The whole south shore is one long sea road."]];
  SG_MAPS.palmcove.npcs = [
    { id: 'merchant', x: sp[0][0], y: sp[0][1], dir: 'down', look: 'barkeep', name: 'Merchant', merchant: ["megaherb", "antidote", "phoenix"], lines: ['Merchant: Rare goods from across the sea! Take a look.'] },
    { id: 'armorer', x: sp[1][0], y: sp[1][1], dir: 'down', look: 'man', name: 'Sea trader', merchantGear: ["tigerclaw", "nightedge", "galebow", "shadowgarb"], lines: ['Sea trader: Blades and bows from faraway smithies!'] },
    ...people.map(([look, line], i) => ({ id: 'sea' + i, x: sp[2 + i][0], y: sp[2 + i][1], dir: 'down', look, lines: [line], wander: i === 0 ? 1 : 0 }))];
}
SG_TAVERNS_MORE['palmcove'] = { barkeep: 'Salty Palm', talk: [['sailor', 'Every coast of the continent is linked by sea now. Sail all the way round if you like!'], ['man', 'Island shrines heal the whole crew. Steer close and pray from the deck.']] };
sgRowsSet('south2', 7, 16, 'U'); sgRowsSet('south2', 7, 18, 'Q'); sgCarve('south2', [7, 17], [4, 16]);
sgNewTown('tidewater', "Tidewater", ["####################", "#.NNNN......T.gggg.#", "#.HDHH....T...HHDHT#", "#..P...T.T......P..#", "#..PPPPPPPPPPPPPP..#", "#........PP......T.#", "#.RRRR...PP...RRRR.#", "#.HDHH...PP...HHDHT#", "#T.P.....PP.....P..#", "#..PPPPPPPPPPPPPP..#", "#.......SPP........#", "#....T...PP...RRRR.#", "#........PP...HHDH.#", "#........PP.....P..#", "#..PPPPPPPPPPPPPP..#", "#########PP#########"], { map: 'south2', x: 7, y: 17, dir: 'down' }, {"3,2": "church", "16,2": "tavern", "3,7": "inn", "16,7": "shop", "16,12": "smith"}, { theme: 'swamp', song: 'sg_swamp', inn: 60,
  shop: ['herb', 'bigherb', 'megaherb', 'antidote', 'ether', 'inktonic', 'feather', 'phoenix'], smith: ['steel', 'silver', 'coral', 'tiderobe', 'longbow', 'kris', 'tigerclaw', 'scalevest'], harbor: true });
SG_MAPS.south2.warps['7,16'] = { map: 'tidewater', x: 9, y: 14, dir: 'up' };
SG_HARBOR.south2 = { map: 'south2', at: '7,19' };
(SG_PLACES_ADD.south2 ||= {})['7,16'] = ["Tidewater", 'tidewater'];
{ const sp = [[6, 13], [13, 2], [2, 9], [16, 5], [12, 2], [16, 4]], people = [["sailor", "Tidewater sits where the marsh meets the sea. Mind the eels at low tide."], ["sailor", "The sea lanes go all the way round the continent now that the King opened them."], ["man", "Old story: there’s a shrine out on the water, east of here, that heals even the fallen."]];
  SG_MAPS.tidewater.npcs = [
    { id: 'merchant', x: sp[0][0], y: sp[0][1], dir: 'down', look: 'barkeep', name: 'Merchant', merchant: ["megaherb", "antidote", "inkflask"], lines: ['Merchant: Rare goods from across the sea! Take a look.'] },
    { id: 'armorer', x: sp[1][0], y: sp[1][1], dir: 'down', look: 'man', name: 'Sea trader', merchantGear: ["mythril", "galebow", "scalevest", "starrobe"], lines: ['Sea trader: Blades and bows from faraway smithies!'] },
    ...people.map(([look, line], i) => ({ id: 'sea' + i, x: sp[2 + i][0], y: sp[2 + i][1], dir: 'down', look, lines: [line], wander: i === 0 ? 1 : 0 }))];
}
SG_TAVERNS_MORE['tidewater'] = { barkeep: 'Salty Tide', talk: [['sailor', 'Every coast of the continent is linked by sea now. Sail all the way round if you like!'], ['man', 'Island shrines heal the whole crew. Steer close and pray from the deck.']] };

/* taverns and churches for the harbor towns */
for (const [tid, info] of Object.entries(SG_TAVERNS_MORE)) {
  const t = SG_MAPS[tid], door = k => Object.entries(t.doors).find(([, v]) => v === k)[0].split(',').map(Number), [tx, ty] = door('tavern'), [cx, cy] = door('church');
  SG_MAPS[tid + '_tav'] = { name: `${t.name} · Tavern`, song: 'sg_tavern', inside: true, theme: 'tavern', rows: SG_TAVERN_ROWS, exitTo: { map: tid, x: tx, y: ty + 1, dir: 'down' }, entry: { x: 5, y: 8 },
    npcs: [{ id: 'barkeep', x: 5, y: 1, dir: 'down', look: 'barkeep', barkeep: true, name: info.barkeep },
      ...info.talk.map(([look, line], i) => ({ id: 'tv' + i, x: [3, 6][i], y: [4, 6][i], dir: 'left', look, lines: [line] })),
      { id: 'tvsailor', x: 10, y: 3, dir: 'down', look: 'sailor', chat: true }, { id: 'tvchat', x: 9, y: 7, dir: 'left', look: 'man', chat: true, wander: 1 }] };
  SG_MAPS[tid + '_church'] = { name: `${t.name} · Church`, song: 'sg_church', inside: true, theme: 'church', rows: SG_CHURCH_ROWS, exitTo: { map: tid, x: cx, y: cy + 1, dir: 'down' }, entry: { x: 5, y: 8 },
    npcs: [{ id: 'priest', x: 5, y: 2, dir: 'down', look: 'priest', priest: true, name: 'Harbor priest' }, { id: 'pilgrim', x: 9, y: 4, dir: 'up', look: 'sailor', lines: ['I pray here before every voyage. The sea is kinder to the faithful.'] }] };
  t.tavern = tid + '_tav'; t.church = tid + '_church';
}
/* more shrines: one more on every region's mainland (the nearest open ground to each spot) */
const SG_MORE_SHRINES = { field: [19, 15], seravel: [9, 15], eastsea: [9, 13], north1: [21, 12], north2: [6, 13], north3: [22, 14], south1: [5, 8], south2: [20, 7], south3: [10, 15] };
for (const [map, [x0, y0]] of Object.entries(SG_MORE_SHRINES)) {
  const open = (x, y) => ['.', 'd', 'h', 'f'].includes(sgRowsGet(map, x, y)), warps = SG_MAPS[map].warps || {};
  let done = false;
  for (let r = 0; r < 6 && !done; r++) for (let dy = -r; dy <= r && !done; dy++) for (let dx = -r; dx <= r && !done; dx++) {
    const x = x0 + dx, y = y0 + dy;
    if (!open(x, y) || warps[`${x},${y}`] || !open(x, y + 1)) continue;
    sgRowsSet(map, x, y, 'z'); done = true;
  }
}
SG_CHAT.push('The whole continent is ringed by sea. With a ship you can reach every coast.', 'Island shrines! Sail up close and pray from your boat.');
/* ---------- a rounder continent: curved corners and wavy coasts (never cutting off towns, roads, docks or caves) ---------- */
{
  const protectedTiles = map => {
    const m = SG_MAPS[map], H = m.rows.length, W = m.rows[0].length, keep = new Set(), mark = (x, y, r) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) keep.add((x + dx) + ',' + (y + dy)); };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const t = m.rows[y][x]; if (SG_KEEP.has(t)) mark(x, y, 2); else if (t === 'P' || t === 'B') mark(x, y, 0); }
    for (const k of Object.keys(m.warps || {})) { const [x, y] = k.split(',').map(Number); if (m.rows[y][x] !== 'W') mark(x, y, 2); }
    for (const o of [...(m.objs || []), ...(m.npcs || [])]) if (o.x != null) mark(o.x, o.y, 2);
    return keep;
  };
  const wave = (i, seed) => Math.sin(i * 0.42 + seed) * 1.4 + Math.sin(i * 1.13 + seed * 2) * 0.7;
  const flood = (map, test) => {
    const m = SG_MAPS[map], H = m.rows.length, W = m.rows[0].length, keep = protectedTiles(map);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!keep.has(x + ',' + y) && m.rows[y][x] !== 'W' && test(x, y, W, H)) sgRowsSet(map, x, y, 'W');
  };
  // curved corners of the continent
  const CORNERS = { north1: [0, 0], north3: [1, 0], south1: [0, 1], south3: [1, 1] };
  for (const [map, [cxr, cyr]] of Object.entries(CORNERS)) flood(map, (x, y, W, H) => {
    const cx = cxr ? W - 1 : 0, cy = cyr ? H - 1 : 0, rx = W * 0.62, ry = H * 0.62;
    const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    return d < 1 + 0.12 * Math.sin(x * 0.9 + y * 0.7);
  });
  // wavy coasts: the sea bites a little further inland in places
  for (const [map, sides] of Object.entries(SG_COAST)) {
    if (map === 'eastsea') continue;
    sides.forEach((side, si) => flood(map, (x, y, W, H) => {
      const i = side === 'left' || side === 'right' ? y : x, depth = SG_SEA_BAND + Math.max(0, Math.round(2 + 1.4 * wave(i, map.length + si * 3)));
      return side === 'left' ? x < depth : side === 'right' ? x >= W - depth : side === 'top' ? y < depth : y >= H - depth;
    }));
  }
}
/* ---------- island loot: every island in the open sea has a chest, from cheap trinkets to legendary gear ---------- */
Object.assign(SG_ITEMS, {
  seaglass: { name: 'Sea glass', icon: '🔹', treasure: true, sell: 25, desc: 'A smooth, frosted pebble of glass. Worth 25 gold at any shop.' },
  conch:    { name: 'Conch shell', icon: '🐚', treasure: true, sell: 60, desc: 'Hold it to your ear and hear the sea. Worth 60 gold.' },
  silverring:{ name: 'Silver ring', icon: '💍', treasure: true, sell: 150, desc: 'A sailor’s ring, a little tarnished. Worth 150 gold.' },
  pearl:    { name: 'Pearl', icon: '⚪', treasure: true, sell: 300, desc: 'A perfect round pearl. Worth 300 gold.' },
  coralidol:{ name: 'Coral idol', icon: '🪸', treasure: true, sell: 600, desc: 'A tiny statue carved from red coral. Worth 600 gold.' },
  doubloons:{ name: 'Gold doubloons', icon: '🪙', treasure: true, sell: 1200, desc: 'A pouch of old pirate coins. Worth 1,200 gold.' },
  seacrown: { name: 'Sunken crown', icon: '👑', treasure: true, sell: 2500, desc: 'A crown from a kingdom lost to the sea. Worth 2,500 gold.' },
  sapphire: { name: 'Star sapphire', icon: '💎', treasure: true, sell: 5000, desc: 'A deep blue gem with a star inside. Worth 5,000 gold.' },
});
const SG_LOOT = {
  common:   [{ herb: 3 }, { antidote: 2 }, { seaglass: 2 }, { conch: 1 }, { gold: 150 }, { ether: 2 }, { seaglass: 1, gold: 80 }],
  uncommon: [{ bigherb: 3 }, { inktonic: 1 }, { silverring: 1 }, { pearl: 1 }, { gold: 600 }, { holywater: 2 }, { feather: 2, conch: 1 }, { gear: 'scalevest' }],
  rare:     [{ megaherb: 2 }, { phoenix: 2 }, { inkflask: 1 }, { coralidol: 1 }, { doubloons: 1 }, { gold: 1800 }, { gear: 'longbow' }, { gear: 'kris' }, { gear: 'tigerclaw' }],
  epic:     [{ seacrown: 1 }, { sapphire: 1 }, { gear: 'mythril' }, { gear: 'galebow' }, { gear: 'runestaff' }, { gear: 'mythmail' }, { gear: 'starrobe' }, { gear: 'nightedge' }, { gold: 5000, phoenix: 2 }],
};
/* ---------- the open ocean: a full ring of sea regions around the continent (the world becomes 5 x 5) ---------- */
const SG_SEA_NAMES = [
  ['Far Northwest Sea', 'Frozen Sea', 'Northern Sea', 'Ink Sea', 'Far Northeast Sea'],
  ['Frostwater Sea', null, null, null, 'Blackwater Sea'],
  ['Western Sea', null, null, null, 'Eastern Ocean'],
  ['Jungle Sea', null, null, null, 'Sunset Sea'],
  ['Far Southwest Sea', 'Coral Sea', 'Southern Sea', 'Ember Sea', 'Far Southeast Sea'],
];
function sgMakeSea(id, name, seed) {
  let r = seed * 7919 + 13; const rnd = () => { r = (r * 1103515245 + 12345) % 2147483648; return r / 2147483648; };
  const W = 28, H = 22, g = [...Array(H)].map(() => Array(W).fill('W')), objs = [];
  const n = 2 + Math.floor(rnd() * 3);
  for (let i = 0; i < n; i++) {   // small islands, kept away from the edges so every edge stays open sea
    const cx = 4 + Math.floor(rnd() * (W - 8)), cy = 4 + Math.floor(rnd() * (H - 8)), rx = 1.4 + rnd() * 2, ry = 1.2 + rnd() * 1.4;
    for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 4; x <= cx + 4; x++)
      if (y > 2 && y < H - 3 && x > 2 && x < W - 3 && ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) g[y][x] = rnd() < 0.3 ? 'f' : rnd() < 0.15 ? 'h' : '.';
    g[cy][cx] = '.'; g[cy][cx + 1] = g[cy][cx + 1] === 'W' ? '.' : g[cy][cx + 1];
    if (i === 0 && seed % 2) g[cy][cx + 1] = 'z';   // a shrine on every other sea
    // loot: common, uncommon, rare or epic (epic chests are word-locked)
    const roll = rnd(), tier = roll < 0.45 ? 'common' : roll < 0.75 ? 'uncommon' : roll < 0.93 ? 'rare' : 'epic', list = SG_LOOT[tier];
    objs.push({ id: `${id}_c${i}`, type: tier === 'epic' ? 'lockChest' : 'chest', x: cx, y: cy, tier, give: list[Math.floor(rnd() * list.length)] });
  }
  SG_MAPS[id] = { name, song: 'sg_sea', theme: 'field', rows: g.map(row => row.join('')), zone: () => 'deepsea', seaZone: 'deepsea', warps: {}, npcs: [], objs, openSea: true };
}
{
  const inner = SG_WORLD.map(row => row.slice());
  const grid = SG_SEA_NAMES.map((row, r) => row.map((nm, c) => {
    if (!nm) return inner[r - 1][c - 1];
    const id = `sea_${r}_${c}`; sgMakeSea(id, nm, 7 + r * 5 + c); return id;
  }));
  SG_WORLD.splice(0, SG_WORLD.length, ...grid);
}
/* sea lanes: wherever two neighboring regions both have water at their shared edge, a boat can sail across */
{
  const ROWS = SG_WORLD.length, COLS = SG_WORLD[0].length, at = (r, c) => SG_WORLD[r]?.[c];
  const MID = new Set(['field', 'seravel', 'eastsea']);
  const gate = (from, to) => MID.has(from) && !MID.has(to) ? { need: 'keyquest', block: ['Storms block the open sea.', 'King Aldous may know when the old sea lanes open.'] } : {};
  const link = (a, b, horizontal) => {
    const A = SG_MAPS[a], B = SG_MAPS[b], AW = A.rows[0].length, AH = A.rows.length, BW = B.rows[0].length, BH = B.rows.length;
    const n = horizontal ? AH : AW;
    for (let i = 0; i < n; i++) {
      const j = Math.max(1, Math.min((horizontal ? BH : BW) - 2, Math.round(i * ((horizontal ? BH : BW) - 1) / (n - 1))));
      const [ax, ay, ax2, ay2] = horizontal ? [AW - 1, i, AW - 2, i] : [i, AH - 1, i, AH - 2];
      const [bx, by, bx2, by2] = horizontal ? [0, j, 1, j] : [j, 0, j, 1];
      if (sgRowsGet(a, ax, ay) !== 'W' || sgRowsGet(b, bx, by) !== 'W' || sgRowsGet(b, bx2, by2) !== 'W' || sgRowsGet(a, ax2, ay2) !== 'W') continue;
      A.warps ||= {}; B.warps ||= {};
      if (!A.warps[`${ax},${ay}`]) A.warps[`${ax},${ay}`] = { map: b, x: bx2, y: by2, dir: horizontal ? 'right' : 'down', ...gate(a, b) };
      if (!B.warps[`${bx},${by}`]) B.warps[`${bx},${by}`] = { map: a, x: ax2, y: ay2, dir: horizontal ? 'left' : 'up', ...gate(b, a) };
    }
  };
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { if (at(r, c + 1)) link(at(r, c), at(r, c + 1), true); if (at(r + 1, c)) link(at(r, c), at(r + 1, c), false); }
}
