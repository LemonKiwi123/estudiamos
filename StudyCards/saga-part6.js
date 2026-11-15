'use strict';
/* ================= Lexicon Saga: castles, colored keys, pickpockets and jails (all original) =================
   • The King and the Queen get real castles: a throne hall, library, kitchen, barracks, bedchamber, dining hall
     and treasury, with guards, royals and castle workers.
   • Three colored chests (ruby, sapphire, emerald) open only with the matching special key. Keys stay forever.
   • In towns you can try to pick a pocket: listen to a word and pick it. Guess wrong and you land in the town jail.
   • Shrines are spread out so no two sit close together.
   Loaded after saga-part5.js and before saga.js (saga.js calls the sgXxxMore hooks). */

/* ---------- new tiles: stone floor, bed, barrels, fireplace, suit of armor, potted plant ---------- */
SG_WALK.add('n');

/* ---------- new people ---------- */
const SG_LOOKS_MORE = {
  maid:      { A: { hair: 'long', shirt: 1, body: 'dress' }, colors: { 0: '#f2c29a', 1: '#f6f6f0', 2: '#2a2a3a', 3: '#5a3a1a' } },
  cook:      { A: TR_ARCH.shop || TR_ARCH.man, colors: { 0: '#e8b48a', 1: '#ffffff', 2: '#c0392b', 3: '#2a1a10' } },
  prince:    { A: { hair: 'short', shirt: 2, body: 'coat', cape: 1 }, colors: { 0: '#f2c29a', 1: '#f4c542', 2: '#2e4a9a', 3: '#6b3a1a' }, crown: true },
  princess:  { A: { hair: 'long', shirt: 1, body: 'dress', cape: 1 }, colors: { 0: '#f2c29a', 1: '#f7a8c8', 2: '#b0477a', 3: '#e0b040' }, crown: true },
  rguard:    { A: { hair: 'peaked', capC: 1, shirt: 2, pants: 3, badge: 1 }, colors: { 0: '#f2c29a', 1: '#f4c542', 2: '#a8323e', 3: '#141420' } },
  chancellor:{ A: { hair: 'bald', beard: 1, shirt: 2, body: 'coat' }, colors: { 0: '#f2c29a', 1: '#e5e5e5', 2: '#4a2a6a', 3: '#2a2030' } },
  librarian: { A: TR_ARCH.elder, colors: { 0: '#e8b48a', 1: '#d8c8a8', 2: '#6b4226', 3: '#3a3a3a' } },
  noble:     { A: TR_ARCH.lass, colors: { 0: '#f2c29a', 1: '#bfe0f8', 2: '#2e86c1', 3: '#c8a040' } },
  jailer:    { A: { hair: 'bald', beard: 1, shirt: 2, pants: 3 }, colors: { 0: '#d8a07a', 1: '#5a5a66', 2: '#3a3a44', 3: '#141420' } },
  prisoner:  { A: TR_ARCH.man, colors: { 0: '#f2c29a', 1: '#d8d8d0', 2: '#5a5a66', 3: '#2a1a10' } },
};

/* ---------- music ---------- */
Object.assign(TRM_SONGS, {
  sg_castle: { bpm: 104, lead: ['C5 - - G4 C5 - E5 -', 'G5 - - - E5 - C5 -', 'D5 - - B4 D5 - F5 -', 'E5 - - - - - . .', 'A4 - C5 - F5 - A5 -', 'G5 - F5 - E5 - D5 -', 'C5 - E5 - D5 - B4 -', 'C5 - - - G4 - C5 -'],
    bass: ['C3 - G2 - C3 - G2 -', 'C3 - G2 - C3 - E3 -', 'G2 - D3 - G2 - D3 -', 'C3 - G2 - C3 - . .', 'F2 - C3 - F2 - C3 -', 'C3 - G2 - G2 - D3 -', 'F2 - G2 - G2 - G2 -', 'C3 - G2 - C3 - . .'], drums: ['k . s . k k s .'], vol: 0.7 },
  sg_jail: { bpm: 70, lead: ['A4 - - - C5 - B4 -', 'A4 - - - E4 - - -', 'F4 - - - A4 - G4 -', 'E4 - - - - - . .', 'A4 - - - C5 - D5 -', 'E5 - - - D5 - C5 -', 'B4 - - - G#4 - - -', 'A4 - - - - - . .'],
    bass: ['A2 - - - E3 - - -', 'A2 - - - E3 - - -', 'F2 - - - C3 - - -', 'E2 - - - - - . .', 'A2 - - - E3 - - -', 'C3 - - - G2 - - -', 'E2 - - - B2 - - -', 'A2 - - - - - . .'], drums: ['. . . . k . . .'], vol: 0.55 },
});

/* ================= 1. Shrines: never two close together ================= */
(() => {
  const grid = typeof SG_WORLD !== 'undefined' ? SG_WORLD : [['field', 'seravel', 'eastsea']];
  const MIN = 11, pts = [];
  grid.forEach((row, r) => row.forEach((id, c) => {
    const m = SG_MAPS[id]; if (!m) return;
    const W = m.rows[0].length, H = m.rows.length, more = (typeof SG_MORE_SHRINES !== 'undefined' && SG_MORE_SHRINES[id]) || null;
    m.rows.forEach((line, y) => [...line].forEach((ch, x) => {
      if (ch !== 'z') return;
      // keep island shrines first, then the first shrines of each region; the extra "more shrines" go first when crowded
      const late = more && Math.abs(more[0] - x) <= 6 && Math.abs(more[1] - y) <= 6;
      pts.push({ id, x, y, gx: c * 28 + x * 28 / W, gy: r * 22 + y * 22 / H, rank: m.openSea ? 0 : late ? 2 : 1 });
    }));
  }));
  pts.sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id) || a.y - b.y || a.x - b.x);
  const kept = [];
  for (const p of pts) {
    if (kept.some(k => Math.hypot(k.gx - p.gx, k.gy - p.gy) < MIN)) {   // put back the ground around it (sand in the desert, snow up north…)
      const around = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => sgRowsGet(p.id, p.x + dx, p.y + dy)).filter(c => ['.', 'd', 'h'].includes(c));
      const ground = around.sort((a, b) => around.filter(c => c === b).length - around.filter(c => c === a).length)[0] || '.';
      sgRowsSet(p.id, p.x, p.y, ground);
    }
    else kept.push(p);
  }
})();

/* ================= 2. Royal castles ================= */
/* 30 × 24: library, kitchen and barracks on the left; the throne hall in the middle; bedchamber, dining hall and treasury on the right */
const SG_CASTLE_ROWS = (() => {
  const L = ['bbbbbbbb', '________', '_bb__bb_', '________', '_t____t_', '________', 'bb____bb', '########', 'q==__==q', '________', '_tt__vv_', '________', '_v____v_', '________', '########',
    'e_e__e_e', '________', 'v______v', '________', '_t____t_', '________', '########'];
  const C = ['nwnnLLnnwn', 'nnnnKKnnnn', 'nnnnKKnnnn', 'nnnnKKnnnn', 'nnnnKKnnnn', 'nnnnKKnnnn', 'n#nnKKnn#n', 'nnnnKKnnnn', 'wnnnKKnnnw', 'nnnnKKnnnn', 'nnnnKKnnnn', 'nnnnKKnnnn', 'n#nnKKnn#n', 'nnnnKKnnnn',
    'wnnnKKnnnw', 'nnnnKKnnnn', 'n#nnKKnn#n', 'nnnnKKnnnn', 'nnnnKKnnnn', 'nnnnKKnnnn', 'w#nnKKnn#w', 'nnnnKKnnnn'];
  const R = ['a_q_ee_a', '________', 'a______a', '________', '________', '_t____t_', 'bb____bb', '########', 'a______a', '________', '_tttttt_', '________', '________', 'a______a', '########',
    'v______v', '________', '________', '________', '________', 'vv____vv', '########'];
  const leftDoor = new Set([5, 12, 19]), rightDoor = new Set([4, 11, 18]);
  const top = [...'#'.repeat(30)]; for (const x of [3, 7, 13, 16, 22, 26]) top[x] = 'G';
  const rows = [top.join('')];
  for (let i = 0; i < 22; i++) { const y = i + 1; rows.push('#' + L[i] + (leftDoor.has(y) ? 'n' : '#') + C[i] + (rightDoor.has(y) ? 'n' : '#') + R[i] + '#'); }
  rows.push('#'.repeat(14) + 'KK' + '#'.repeat(14));
  return rows;
})();
function sgMakeCastle(id, town, name, royals, extra) {
  const t = SG_MAPS[town];
  SG_MAPS[id] = { name, song: 'sg_castle', inside: true, theme: 'palace', rows: SG_CASTLE_ROWS.slice(), exitTo: { map: town, x: 9, y: 5, dir: 'down' }, entry: { x: 14, y: 22 },
    npcs: [...royals, ...extra.npcs], objs: extra.objs };
  // the strip at the top of the town becomes the castle wall, with the gate in the middle
  const W = t.rows[0].length;
  for (let y = 1; y <= 3; y++) t.rows[y] = '#' + [...'#'.repeat(W - 2)].map((c, i) => y === 2 && [3, 6, 13, 16].includes(i + 1) ? 'G' : c).join('') + '#';
  t.warps ||= {}; t.warps['9,4'] = { map: id, x: 14, y: 22, dir: 'up' }; t.warps['10,4'] = { map: id, x: 15, y: 22, dir: 'up' };
  t.npcs = t.npcs.filter(n => !n.king && !n.queen);
  t.castle = id;
}
const sgCastleNpc = (id, x, y, look, name, lines, more = {}) => ({ id, x, y, dir: more.dir || 'down', look, name, lines: [].concat(lines).map(l => `${name}: ${l}`), ...more });
sgMakeCastle('castle_q', 'town', 'Castle Quillhaven', [
  { id: 'king', x: 14, y: 2, dir: 'down', look: 'king', king: true, name: 'King Aldous' },
  sgCastleNpc('consort', 15, 2, 'queen', 'Queen Maren', ['Welcome to our home, young hero. Do look around. The library is my favourite room.', 'The cook makes the best honey bread in the kingdom. Tell him I sent you.']),
], {
  npcs: [
    sgCastleNpc('rg1', 12, 2, 'rguard', 'Royal guard', 'Stand tall before the King!'),
    sgCastleNpc('rg2', 17, 2, 'rguard', 'Royal guard', 'Nobody gets near the thrones without our say-so.'),
    sgCastleNpc('prince', 16, 6, 'prince', 'Prince Edwin', ['One day I’ll go on an adventure too! Father says I must learn my words first.', 'Did you know there are chests in three colors? Ruby, sapphire and emerald. Each needs its own key.'], { wander: 1 }),
    sgCastleNpc('librarian', 4, 4, 'librarian', 'Librarian Ottilie', ['Shh! This is the royal library. Every book here was written with the old Lexicon.', 'Read a little every day and the words will stay with you.']),
    sgCastleNpc('reader', 6, 6, 'kid', 'Page boy', 'I’m supposed to be dusting the shelves… but this book about sea monsters is really good.'),
    sgCastleNpc('cook', 3, 10, 'cook', 'Cook Barnaby', ['Mind the hot stove! Honey bread for the King, stew for the guards.', 'Hungry? Inns are the place for a hot meal and a warm bed.'], { wander: 1 }),
    sgCastleNpc('kmaid', 5, 12, 'maid', 'Kitchen maid', 'Twelve loaves, six pies and a cake for the Prince. And the day has only started!'),
    sgCastleNpc('soldier', 3, 17, 'guard', 'Off-duty guard', 'Night shift tonight. I’m resting my feet while I can.'),
    sgCastleNpc('captain', 5, 20, 'rguard', 'Captain Hale', ['My guards keep the towns safe. If you see a pickpocket, call for us!', 'Every town has a jail now. Thieves spend a night behind bars, or pay a fine.']),
    sgCastleNpc('princess', 24, 3, 'princess', 'Princess Rosalind', ['Father keeps the Ruby Key in the treasury, downstairs on this side.', 'Queen Ysolde of Seravel keeps the Sapphire Key. And the Emerald Key? Lost at sea, somewhere far to the south-east.']),
    sgCastleNpc('lmaid', 26, 5, 'maid', 'Lady’s maid', 'The Princess’s room must be spotless. She notices every speck of dust!', { wander: 1 }),
    sgCastleNpc('chancellor', 23, 10, 'chancellor', 'Chancellor Voss', ['The royal dinner is at sundown. Forty guests, sixty candles.', 'Taxes, letters, maps… a chancellor’s work is never done.']),
    sgCastleNpc('noble', 26, 13, 'noble', 'Lady Abigail', 'I came all the way from Briarwick for the feast. Isn’t the hall lovely?'),
    sgCastleNpc('treasurer', 22, 17, 'rguard', 'Treasury guard', ['The King says you may open the treasury chests. The Ruby Key is in the locked one.', 'Spell its word to open the lock. Then the key opens every ruby-red chest you find.']),
    sgCastleNpc('hmaid', 12, 12, 'maid', 'Castle maid', 'Good day! The great hall gets so dusty with all these visitors.', { wander: 2 }),
    sgCastleNpc('gate1', 13, 21, 'guard', 'Gate guard', 'Welcome to Castle Quillhaven. The King is at the far end of the hall.'),
    sgCastleNpc('gate2', 16, 21, 'guard', 'Gate guard', 'The town is just outside. Enjoy your visit!'),
  ],
  objs: [
    { type: 'chest', id: 'cq_library', x: 2, y: 6, give: { ether: 2 }, tier: 'uncommon' },
    { type: 'chest', id: 'cq_bedroom', x: 27, y: 2, give: { gold: 120 }, tier: 'uncommon' },
    { type: 'chest', id: 'cq_treasury', x: 22, y: 20, give: { gold: 150, bigherb: 2 }, tier: 'uncommon' },
    { type: 'lockChest', id: 'ck_ruby', x: 24, y: 19, give: { ckey: 'ruby' }, tier: 'rare' },
    { type: 'colorChest', id: 'cc_ruby_castle', color: 'ruby', x: 26, y: 19, give: { gold: 250, megaherb: 1 } },
  ] });
sgMakeCastle('castle_s', 'port', 'Lumen Palace', [
  { id: 'queen', x: 14, y: 2, dir: 'down', look: 'queen', queen: true, name: 'Queen Ysolde' },
  sgCastleNpc('consort', 15, 2, 'prince', 'Prince Tariq', ['My mother rules Seravel from this throne. I’m learning to sail, so I can visit every coast!', 'The Sapphire Key? It’s in our treasury, of course. Ask the guard there.']),
], {
  npcs: [
    sgCastleNpc('rg1', 12, 2, 'rguard', 'Palace guard', 'Bow to Her Majesty, Queen Ysolde!'),
    sgCastleNpc('rg2', 17, 2, 'rguard', 'Palace guard', 'The sun never sets on Seravel. Well… it does. But slowly.'),
    sgCastleNpc('librarian', 4, 4, 'librarian', 'Map keeper Idris', ['These shelves hold maps of every coast and island. The seas link all the way round now!', 'Old charts say the Emerald Key sank with a ship near an island in the south-east.']),
    sgCastleNpc('reader', 6, 6, 'lass', 'Scholar', 'I am copying a map of the Sunken Archive. One wrong line and someone gets lost!'),
    sgCastleNpc('cook', 3, 10, 'cook', 'Cook Samira', ['Spiced rice, date cakes and mint tea. Palace food is the best in the desert!', 'Try not to steal from the townsfolk. The jail food is terrible, I hear.'], { wander: 1 }),
    sgCastleNpc('kmaid', 5, 12, 'maid', 'Kitchen maid', 'Fresh oranges from the oasis! The Queen loves them.'),
    sgCastleNpc('soldier', 3, 17, 'guard', 'Off-duty guard', 'Sand in my boots again. Sand everywhere!'),
    sgCastleNpc('captain', 5, 20, 'rguard', 'Captain Zara', ['My guards watch the market. Pickpockets end up in the town jail.', 'Pay the fine, or work it off with honest words. Your choice.']),
    sgCastleNpc('princess', 24, 3, 'princess', 'Princess Leila', ['A ruby chest, a sapphire chest, an emerald chest… a key for each color. Once you have a key, it’s yours for good.', 'I saw a blue sapphire chest in the desert once. Maybe you’ll find it!']),
    sgCastleNpc('lmaid', 26, 5, 'maid', 'Lady’s maid', 'The Princess wants her blue silk ready for the feast.', { wander: 1 }),
    sgCastleNpc('chancellor', 23, 10, 'chancellor', 'Vizier Omar', ['The dining hall is ready for the ambassadors from Aldermere.', 'Every ship that sails the Royal dock brings news from across the sea.']),
    sgCastleNpc('noble', 26, 13, 'noble', 'Ambassador Lys', 'I bring greetings from King Aldous. What a beautiful palace!'),
    sgCastleNpc('treasurer', 22, 17, 'rguard', 'Treasury guard', ['The Queen allows you into the treasury. The Sapphire Key is in the word-locked chest.', 'Spell its word, and every sapphire-blue chest in the world will open for you.']),
    sgCastleNpc('hmaid', 12, 12, 'maid', 'Palace maid', 'Mind the carpet, it’s freshly brushed!', { wander: 2 }),
    sgCastleNpc('gate1', 13, 21, 'guard', 'Gate guard', 'Welcome to Lumen Palace. Her Majesty is at the end of the hall.'),
    sgCastleNpc('gate2', 16, 21, 'guard', 'Gate guard', 'Port Lumen is right outside. Ships leave from the Royal dock.'),
  ],
  objs: [
    { type: 'chest', id: 'cs_library', x: 2, y: 6, give: { antidote: 3 }, tier: 'uncommon' },
    { type: 'chest', id: 'cs_bedroom', x: 27, y: 2, give: { gold: 200 }, tier: 'uncommon' },
    { type: 'chest', id: 'cs_treasury', x: 22, y: 20, give: { gold: 250, ether: 2 }, tier: 'uncommon' },
    { type: 'lockChest', id: 'ck_sapphire', x: 24, y: 19, give: { ckey: 'sapphire' }, tier: 'rare' },
    { type: 'colorChest', id: 'cc_sapphire_castle', color: 'sapphire', x: 26, y: 19, give: { gold: 400, sapphire: 1 } },
  ] });
/* old saves that stood in the old throne strip move into the castle */
function sgFixMore(s) {
  if (['town', 'port'].includes(s.map) && s.y <= 3) Object.assign(s, { map: s.map === 'town' ? 'castle_q' : 'castle_s', x: 14, y: 3, dir: 'up' });
  if (s.jailTown && !SG_MAPS[s.jailTown + '_jail']) delete s.jailTown;
}

/* ================= 3. Colored chests and their keys ================= */
const SG_CKEYS = {
  ruby:     { name: 'Ruby Key', icon: '🔴', flag: 'rubyKey', body: '#b0302a', dark: '#6e1a16', gem: '#ff7a6a', where: 'The Ruby Key is kept in the treasury of Castle Quillhaven.' },
  sapphire: { name: 'Sapphire Key', icon: '🔵', flag: 'sapphireKey', body: '#2a5fc0', dark: '#163a7a', gem: '#8ec8ff', where: 'The Sapphire Key is kept in the treasury of Lumen Palace, in Port Lumen.' },
  emerald:  { name: 'Emerald Key', icon: '🟢', flag: 'emeraldKey', body: '#1f8a4a', dark: '#0f5a2c', gem: '#7af0a8', where: 'Old charts say the Emerald Key lies on a far island in the south-east sea.' },
};
const sgColorKeyItems = () => { const f = sgS().flags; return Object.values(SG_CKEYS).filter(k => f[k.flag]).map(k => `${k.icon} ${k.name}`); };
function sgGiveKey(color) {
  const K = SG_CKEYS[color], s = sgS(); if (!K) return [];
  s.flags[K.flag] = 1;
  return [`🔑 You got the <b>${K.name}</b>! ${K.icon}`, `It opens every ${color} chest in the world, and it stays with you for good.`];
}
function sgUseColorChest(o) {
  const s = sgS(), K = SG_CKEYS[o.color];
  if (s.got[o.id]) return sgSay('The chest is empty.');
  if (!s.flags[K.flag]) return sgSay([`${K.icon} A ${o.color} chest! Its keyhole is shaped like a ${o.color}.`, `It only opens with the <b>${K.name}</b>.`, K.where]);
  s.got[o.id] = 1; const lines = sgGive(o.give); sgSaveNow(true); sgJingle('sg_fanfare');
  sgSay([`🔑 The ${K.name} turns with a click… ${K.icon}`, ...lines]);
}
function sgColorChestArt(color, open) {
  const K = SG_CKEYS[color];
  return sgCache[`cchest${color}${open ? 1 : 0}`] ||= sgCanvas(16, 16, g => {
    const R = (x, y, w, h, c) => { g.fillStyle = SGC[c] || c; g.fillRect(x, y, w, h); };
    R(1, 5, 14, 10, 'ink'); R(2, 6, 12, 8, K.body); R(2, 9, 12, 1, K.dark);
    if (open) { R(2, 2, 12, 4, 'ink'); R(3, 3, 10, 2, K.dark); R(3, 6, 10, 3, 'ink'); R(5, 7, 2, 1, 'gold'); R(9, 7, 2, 1, 'gold'); }
    else { R(2, 4, 12, 3, K.dark); R(6, 7, 4, 4, 'gold'); R(7, 8, 2, 2, K.gem); R(7, 10, 2, 1, 'ink'); }
    R(2, 6, 1, 8, 'gold'); R(13, 6, 1, 8, 'gold'); R(2, 13, 12, 1, K.dark);
  });
}
/* where the colored chests are: a safe open spot (all eight neighbours walkable) near a chosen point of each region */
function sgSafeSpot(map, fx, fy) {
  const m = SG_MAPS[map]; if (!m) return null;
  const H = m.rows.length, W = m.rows[0].length, tx = Math.round(fx * (W - 1)), ty = Math.round(fy * (H - 1));
  const busy = new Set([...(m.npcs || []), ...(m.objs || [])].filter(o => o.x != null).flatMap(o => [-1, 0, 1].flatMap(dx => [-1, 0, 1].map(dy => `${o.x + dx},${o.y + dy}`))));
  const warps = Object.keys(m.warps || {}).map(k => k.split(',').map(Number));
  const ok = c => c && c !== 'W' && SG_WALK.has(c);
  let best = null, bd = 1e9;
  for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
    if (!['.', 'd'].includes(m.rows[y][x]) || busy.has(x + ',' + y) || warps.some(([wx, wy]) => Math.abs(wx - x) <= 2 && Math.abs(wy - y) <= 2)) continue;
    let fine = true; for (let dy = -1; dy <= 1 && fine; dy++) for (let dx = -1; dx <= 1; dx++) if (!ok(m.rows[y + dy][x + dx])) { fine = false; break; }
    if (!fine) continue;
    const d = Math.hypot(x - tx, y - ty); if (d < bd) { bd = d; best = [x, y]; }
  }
  return best;
}
[['ruby', 'field', 0.35, 0.3, { gold: 300, inktonic: 1 }], ['ruby', 'south1', 0.6, 0.45, { gear: 'scalevest' }],
 ['sapphire', 'seravel', 0.3, 0.55, { gold: 450, phoenix: 2 }], ['sapphire', 'south2', 0.55, 0.5, { gold: 400, inkflask: 1 }],
 ['emerald', 'eastsea', 0.55, 0.35, { gold: 900, inkflask: 2 }], ['emerald', 'north3', 0.45, 0.6, { gear: 'mythmail' }], ['emerald', 'south3', 0.5, 0.4, { gold: 800, megaherb: 3, phoenix: 2 }],
].forEach(([color, map, fx, fy, give]) => { const at = sgSafeSpot(map, fx, fy); if (at) (SG_MAPS[map].objs ||= []).push({ type: 'colorChest', id: `cc_${color}_${map}`, color, x: at[0], y: at[1], give }); });
/* the Emerald Key: on a far island in the south-east sea (it takes the place of that island's ordinary chest) */
(() => {
  for (const id of ['sea_4_4', 'sea_4_3', 'sea_3_4', 'sea_4_2']) {
    const m = SG_MAPS[id]; if (!m) continue;
    const i = (m.objs ||= []).findIndex(o => o.type === 'chest' && o.x != null);
    if (i >= 0) { const o = m.objs[i]; m.objs[i] = { type: 'lockChest', id: 'ck_emerald', x: o.x, y: o.y, give: { ckey: 'emerald', gold: 200 }, tier: 'epic' }; return; }
    const at = sgSafeSpot(id, 0.5, 0.5); if (at) { m.objs.push({ type: 'lockChest', id: 'ck_emerald', x: at[0], y: at[1], give: { ckey: 'emerald', gold: 200 }, tier: 'epic' }); return; }
  }
})();

/* ================= 4. Town jails ================= */
const SG_JAIL_ROWS = ['############', '#__J___J___#', '#__J___J___#', '#JJJJJJJJJJ#', '#__________#', '#_t______t_#', '#__________#', '#__________#', '#__________#', '#####__#####'];
function sgJailPlace(town) {
  const m = SG_MAPS[town], H = m.rows.length, W = m.rows[0].length;
  const walk = (rows, x, y) => SG_WALK.has((rows[y] || '')[x]);
  const reach = rows => {   // everything you can walk to from the town gate
    const seen = new Set(), q = [];
    for (let x = 0; x < W; x++) if (walk(rows, x, H - 1)) { seen.add(x + ',' + (H - 1)); q.push([x, H - 1]); }
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && walk(rows, nx, ny)) { seen.add(k); q.push([nx, ny]); } } }
    return seen;
  };
  const needs = [...Object.keys(m.doors || {}).map(k => { const [x, y] = k.split(',').map(Number); return `${x},${y + 1}`; }), ...m.npcs.map(n => `${n.x},${n.y}`), ...Object.keys(m.warps || {})];
  const before = reach(m.rows), must = needs.filter(k => before.has(k));
  const people = new Set(m.npcs.map(n => `${n.x},${n.y}`));
  // first try a 4-wide jail on plain grass; small towns get a 3-wide one that may replace a tree or flowers
  for (const [w, ok, top, front, dd] of [[4, '.', '####', 'JJDJ', 2], [3, '.TFf', '###', 'JDJ', 1]]) for (let y = H - 4; y >= 1; y--) for (let x = 1; x + w - 1 < W - 1; x++) {
    let free = true;
    for (let dy = 0; dy < 2 && free; dy++) for (let dx = 0; dx < w; dx++) if (!ok.includes(m.rows[y + dy][x + dx]) || people.has(`${x + dx},${y + dy}`)) { free = false; break; }
    if (!free || !walk(m.rows, x + dd, y + 2) || people.has(`${x + dd},${y + 2}`)) continue;
    const rows = m.rows.slice();
    rows[y] = rows[y].slice(0, x) + top + rows[y].slice(x + w);
    rows[y + 1] = rows[y + 1].slice(0, x) + front + rows[y + 1].slice(x + w);
    const after = reach(rows);
    if (!must.every(k => after.has(k)) || !after.has(`${x + dd},${y + 2}`)) continue;
    m.rows = rows; return [x + dd, y + 1];
  }
  return null;
}
for (const [town, m] of Object.entries(SG_MAPS)) {
  if (!m.town) continue;
  const door = sgJailPlace(town); if (!door) continue;
  (m.doors ||= {})[`${door[0]},${door[1]}`] = 'jail';
  const jid = town + '_jail', prisoners = [['man', 'I only borrowed a loaf of bread! Honest!'], ['elder', 'Forty years I picked pockets. Then I picked the Captain’s. Big mistake.']];
  SG_MAPS[jid] = { name: `${m.name} · Jail`, song: 'sg_jail', inside: true, theme: 'jail', rows: SG_JAIL_ROWS, exitTo: { map: town, x: door[0], y: door[1] + 1, dir: 'down' }, entry: { x: 5, y: 8 },
    gates: { '6,3': 'jailOpen' },
    npcs: [{ id: 'jailer', x: 4, y: 4, dir: 'up', look: 'jailer', jailer: true, name: 'Jailer' },
      { id: 'pr1', x: 1, y: 1, dir: 'down', look: prisoners[0][0], name: 'Prisoner', lines: ['Prisoner: ' + prisoners[0][1]] },
      { id: 'pr2', x: 9, y: 2, dir: 'down', look: prisoners[1][0], name: 'Old prisoner', lines: ['Old prisoner: ' + prisoners[1][1]] },
      { id: 'jguard', x: 9, y: 7, dir: 'left', look: 'guard', name: 'Guard', lines: ['Guard: Keep your hands in your own pockets and you’ll never see the inside of a cell.'] }],
    objs: [] };
}
const sgJailed = () => { const s = sgS(); return !!s?.jailTown && s.map === s.jailTown + '_jail' && !s.flags.jailOpen; };
function sgJail(town) {
  const s = sgS(), jid = town + '_jail';
  if (!SG_MAPS[jid]) { const lost = Math.min(s.gold, 30); s.gold -= lost; sgSaveNow(true); return sgSay([`🚨 A guard makes you pay ${lost} gold back. Behave yourself!`]); }
  s.flags.jailOpen = 0; s.jailTown = town; sgSaveNow(true);
  sgWarp(jid, 5, 1, 'down', true);
  sgSay(['🔒 Clang! The cell door slams shut behind you.', 'Talk to the Jailer through the bars to get out.']);
}
function sgFreed(lines) {
  const s = sgS(); s.flags.jailOpen = 1; delete s.jailTown; sgSaveNow(true); sgJingle('sg_level');
  sgSay([...lines, '🔓 Clank! The cell door swings open.', 'Jailer: Off you go. And stay out of other folks’ pockets!']);
}
function sgJailer(n) {
  const s = sgS();
  if (!sgJailed()) return sgSay(['Jailer: Visiting? Keep your hands in your own pockets and you’ll never stay here.']);
  const fine = 40 + 20 * (typeof sgStage === 'function' ? sgStage() : 0);
  sgMenu(`👮 Jailer: “Caught with your hand in a pocket, eh?” · 💰 ${s.gold}`, [
    { label: `💰 Pay the fine (${fine} gold)`, disabled: s.gold < fine, fn: () => { s.gold -= fine; sgFreed([`You pay ${fine} gold.`]); } },
    { label: '🧽 Scrub the floors (answer 3 words right)', sub: 'Honest work, honest words.', fn: () => sgChores(0) },
    { label: '⏳ Wait', fn: () => sgSay('You sit on the cold stone floor. Nobody comes to let you out.') }], () => {});
}
function sgChores(done) {
  if (done >= 3) return sgFreed(['✨ The floors are sparkling!', 'Jailer: Not bad. Not bad at all.']);
  sgAsk(`🧽 Scrubbing the floor… ${done}/3`, grade => grade === 'wrong' ? sgSay('Jailer: Missed a spot! Keep going.', () => sgChores(done)) : sgChores(done + 1));
}

/* ================= 5. Picking pockets: listen and pick the word ================= */
function sgTalkPlain(n) {
  if (n.chat) return sgSay(`${esc(n.name || 'Townsperson')}: ${SG_CHAT[Math.floor(Math.random() * SG_CHAT.length)]}`);
  if (n.lines) return sgSay(n.lines);
}
function sgPickable(n) { const m = SG_MAPS[sgS().map]; return !!m.town && !['guard', 'rguard', 'jailer'].includes(n.look) && !!(n.chat || n.lines); }
function sgGuardNear() {
  const s = sgS(); return sgNpcs(s.map).some(g => ['guard', 'rguard'].includes(g.look) && Math.abs(g.x - s.x) + Math.abs(g.y - s.y) <= 3);
}
function sgTalkMore(n) {
  if (n.jailer) { sgJailer(n); return true; }
  if (!sgPickable(n)) return false;
  const s = sgS(), key = `pp:${s.map}:${n.id}`, done = s.got[key], watched = sgGuardNear(), who = esc(n.name || 'Townsperson');
  sgMenu(`🙂 ${who}`, [
    { label: '💬 Talk', fn: () => sgTalkPlain(n) },
    { label: '🤏 Pick their pocket', sub: done === 2 ? 'They’re watching you now.' : done ? 'Their pockets are empty now.' : watched ? 'A guard is watching! Move away first.' : 'Listen for the word and pick it. Wrong means jail!',
      disabled: !!done || watched, fn: () => sgPickpocket(n) }], () => {});
  return true;
}
function sgPickpocket(n) {
  const s = sgS(), town = s.map, key = `pp:${town}:${n.id}`, who = esc(n.name || 'Townsperson');
  let c = null; for (let t = 0; t < 10; t++) { const x = sgCard(); if (!c || (x.front || '').length <= 30) c = x; if ((c.front || '').length <= 30) break; }
  const word = plainSent ? plainSent(c.front) : c.front;
  const pool = [...new Set(sg.pool.filter(x => x.id !== c.id).map(x => plainSent ? plainSent(x.front) : x.front).filter(Boolean))];
  const lim = sgTimeLimit();
  const q = { mode: 'mc', listen: true, card: c, title: '🤏 Sneaky… which word do you hear?', prompt: word, answer: word, lang: sg.d.frontLang, opts: pickOptions(word, pool, 4), t0: Date.now(), given: null, limit: lim ? (lim + 4) * 1000 : 0,
    then: grade => {
      if (grade === 'wrong') {
        s.got[key] = 2; sgSaveNow(true);
        return sgSay([`${who}: “Hey! THIEF!”`, '🚨 A town guard grabs you by the collar!', 'Off to the jail you go…'], () => sgJail(town));
      }
      const stage = typeof sgStage === 'function' ? sgStage() : 0, gold = Math.round((10 + stage * 8) * (0.7 + Math.random() * 0.6));
      s.got[key] = 1; s.gold += gold; s.flags.pickpockets = (s.flags.pickpockets || 0) + 1;
      const bonus = Math.random() < 0.25 ? ['herb', 'antidote', 'ether'][Math.floor(Math.random() * 3)] : null;
      if (bonus) s.bag[bonus] = (s.bag[bonus] || 0) + 1;
      sgSaveNow(true);
      sgSay(['🤫 Your fingers slip into their pocket…', `💰 <b>${gold} gold</b>! ${who} didn’t notice a thing.`, ...(bonus ? [`${SG_ITEMS[bonus].icon} And a ${SG_ITEMS[bonus].name}, too!`] : [])]);
    } };
  sg.ui = { type: 'question', q }; sgBox(); trMusic.setDuck?.(0.4);
  if (q.limit) q.timer = setTimeout(() => { if (sg?.ui?.q === q && q.given == null) sgAnswer(null); }, q.limit + 150);
  setTimeout(() => speak(word, q.lang), 250);
}
SG_CHAT.push('Watch your purse in the market! There are pickpockets about.', 'Every town has a jail now. Thieves get a night behind bars.', 'Have you seen the colored chests? Ruby, sapphire, emerald… each wants its own key.');
