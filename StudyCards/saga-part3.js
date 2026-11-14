'use strict';
/* ================= Lexicon Saga: part three, the Eastern Isles (all original) =================
   Ten towns, each with an enterable tavern and church. New companions to hire or meet on the road,
   priests and wayside shrines, poison and curses, the Ember Cave, the Tower of Silence and the Unwriter.
   Loaded after saga-data.js and before saga.js (the engine builds the dungeons when it loads). */

/* ---------- New companions ---------- */
Object.assign(SG_HEROES, {
  ranger:  { cls: 'Ranger', icon: '🏹', hp: [26, 7.5], mp: [4, 1.8], atk: [9, 3.2], def: [4, 1.8], agi: [9, 2.4], mag: [3, 0.8],
    look: { hair: 'cap', capC: 1, shirt: 2, pants: 3, pack: 1 }, colors: { 0: '#e8b48a', 1: '#3f7f3f', 2: '#6b8e23', 3: '#3a2a14' } },
  monk:    { cls: 'Monk', icon: '📿', hp: [28, 8], mp: [6, 2.6], atk: [8, 2.8], def: [5, 2], agi: [8, 2.2], mag: [5, 2],
    look: { hair: 'bald', shirt: 2, body: 'coat' }, colors: { 0: '#d9a173', 1: '#d9a173', 2: '#e67e22', 3: '#5a2a0a' } },
  rogue:   { cls: 'Rogue', icon: '🗡️', hp: [24, 6.5], mp: [5, 2], atk: [8, 2.9], def: [4, 1.6], agi: [12, 3], mag: [3, 1],
    look: { hair: 'bandana', shirt: 2, pants: 3, scarf: 1 }, colors: { 0: '#f2c29a', 1: '#8e2c3a', 2: '#2c3e50', 3: '#141420' } },
  paladin: { cls: 'Paladin', icon: '⚜️', hp: [34, 9.5], mp: [6, 2.4], atk: [9, 3], def: [8, 2.8], agi: [4, 1.2], mag: [5, 1.8],
    look: { hair: 'peaked', capC: 1, shirt: 2, pants: 3, cape: 1, badge: 1 }, colors: { 0: '#f2c29a', 1: '#f4e3a2', 2: '#e8e8f0', 3: '#3a3a5a' } },
});
Object.assign(SG_NAMES, { ranger: 'Bram', monk: 'Sefa', rogue: 'Wren', paladin: 'Corin' });
const SG_PARTY_MAX = 4;   // heroes who travel together; the rest wait at the tavern

/* spells and skills. New kinds: cure (one ally's poison and curse), cureAll, allatk (weapon hit on every foe), steal (gold) */
Object.assign(SG_SPELLS, {
  aimshot: { name: 'Aimed Shot', who: 'ranger', lv: 1, mp: 2, kind: 'power', mult: 1.8, fx: 'slash', desc: 'A careful arrow: strong damage to one foe.' },
  volley:  { name: 'Arrow Volley', who: 'ranger', lv: 5, mp: 5, kind: 'allatk', mult: 0.9, fx: 'slash', desc: 'Rains arrows on every foe.' },
  starfall:{ name: 'Starfall Arrow', who: 'ranger', lv: 14, mp: 9, kind: 'power', mult: 3.2, fx: 'holy', desc: 'A shining arrow: huge damage to one foe.' },
  chi:     { name: 'Inner Light', who: 'monk', lv: 1, mp: 2, kind: 'heal', power: 26, fx: 'heal', desc: 'Heals one ally.' },
  purify:  { name: 'Purify', who: 'monk', lv: 1, mp: 3, kind: 'cure', fx: 'heal', desc: 'Cures one ally of poison and curses.' },
  palm:    { name: 'Thunder Palm', who: 'monk', lv: 6, mp: 4, kind: 'power', mult: 2.2, fx: 'bolt', desc: 'A crackling strike on one foe.' },
  steal:   { name: 'Pickpocket', who: 'rogue', lv: 1, mp: 1, kind: 'steal', desc: 'Lifts gold from one foe.' },
  twin:    { name: 'Twin Blades', who: 'rogue', lv: 6, mp: 4, kind: 'power', mult: 2.4, fx: 'slash', desc: 'Two quick cuts on one foe.' },
  smoke:   { name: 'Smoke Bomb', who: 'rogue', lv: 10, mp: 6, kind: 'allatk', mult: 1.1, fx: 'wave', desc: 'Blinding smoke and daggers on every foe.' },
  holy:    { name: 'Holy Light', who: 'paladin', lv: 1, mp: 3, kind: 'hit', power: 16, fx: 'holy', desc: 'Sacred light on one foe.' },
  bless:   { name: 'Blessing', who: 'paladin', lv: 4, mp: 5, kind: 'cureAll', fx: 'heal', desc: 'Cures the whole party of poison and curses.' },
  aegis:   { name: 'Aegis', who: 'paladin', lv: 9, mp: 6, kind: 'ward', turns: 3, fx: 'holy', desc: 'Halves damage to the whole party for 3 rounds.' },
  judgment:{ name: 'Judgment', who: 'paladin', lv: 15, mp: 10, kind: 'all', power: 40, fx: 'holy', desc: 'Pillars of light on every foe.' },
});
/* the look of the old spells on screen */
Object.assign(SG_SPELLS.slash, { fx: 'slash' }); Object.assign(SG_SPELLS.valor, { fx: 'slash' }); Object.assign(SG_SPELLS.flare, { fx: 'fire' });
Object.assign(SG_SPELLS.frost, { fx: 'ice' }); Object.assign(SG_SPELLS.bolt, { fx: 'bolt' }); Object.assign(SG_SPELLS.tempest, { fx: 'bolt' });
for (const k of ['mend', 'chorus', 'sanctuary', 'rekindle']) SG_SPELLS[k].fx = 'heal';
for (const k of ['shield', 'hymn']) SG_SPELLS[k].fx = 'holy';

/* ---------- Items: cures, and stronger potions for the isles ---------- */
Object.assign(SG_ITEMS, {
  antidote:  { name: 'Antidote', icon: '🧴', price: 12, cure: 'poison', desc: 'Cures poison.' },
  holywater: { name: 'Holy water', icon: '💧', price: 40, cure: 'curse', desc: 'Lifts a curse. Only priests have it.' },
  megaherb:  { name: 'Mega herb', icon: '🌳', price: 140, heal: 220, desc: 'Heals 220 HP.' },
  inkflask:  { name: 'Ink flask', icon: '⚗️', price: 300, mp: 70, desc: 'Restores 70 MP.' },
});
/* who can use which gear */
const sgFor = (k, ...who) => { SG_GEAR[k].for = [...new Set([...SG_GEAR[k].for, ...who])]; };
['stick', 'cloth', 'leather'].forEach(k => sgFor(k, 'ranger', 'monk', 'rogue', 'paladin'));
['copper', 'iron', 'steel', 'chain', 'silver'].forEach(k => sgFor(k, 'paladin'));
['quill', 'willow', 'robe', 'tiderobe'].forEach(k => sgFor(k, 'monk'));
Object.assign(SG_GEAR, {
  shortbow:   { name: 'Short bow', slot: 'weapon', atk: 8, price: 70, for: ['ranger'] },
  longbow:    { name: 'Longbow', slot: 'weapon', atk: 20, price: 520, for: ['ranger'] },
  galebow:    { name: 'Gale bow', slot: 'weapon', atk: 36, price: 2400, for: ['ranger'] },
  dagger:     { name: 'Dagger', slot: 'weapon', atk: 7, price: 50, for: ['rogue'] },
  kris:       { name: 'Wave kris', slot: 'weapon', atk: 19, price: 480, for: ['rogue'] },
  nightedge:  { name: 'Night edge', slot: 'weapon', atk: 34, price: 2300, for: ['rogue'] },
  cestus:     { name: 'Iron cestus', slot: 'weapon', atk: 8, price: 60, for: ['monk'] },
  tigerclaw:  { name: 'Tiger claw', slot: 'weapon', atk: 20, mag: 4, price: 560, for: ['monk'] },
  mythril:    { name: 'Mythril sword', slot: 'weapon', atk: 36, price: 2800, for: ['knight', 'paladin'] },
  runestaff:  { name: 'Rune staff', slot: 'weapon', atk: 16, mag: 26, price: 2600, for: ['scribe', 'cantor', 'monk'] },
  mythmail:   { name: 'Mythril mail', slot: 'armor', def: 30, price: 3000, for: ['knight', 'paladin'] },
  starrobe:   { name: 'Star robe', slot: 'armor', def: 21, mag: 8, price: 2500, for: ['scribe', 'cantor', 'monk'] },
  shadowgarb: { name: 'Shadow garb', slot: 'armor', def: 24, price: 2400, for: ['ranger', 'rogue', 'monk'] },
  scalevest:  { name: 'Scale vest', slot: 'armor', def: 14, price: 700, for: ['ranger', 'rogue', 'monk', 'paladin'] },
});
/* what a new companion carries when they join, by the leader's level */
const SG_START_GEAR = {
  ranger: [['shortbow', 'leather'], ['longbow', 'scalevest'], ['galebow', 'shadowgarb']], monk: [['cestus', 'leather'], ['tigerclaw', 'scalevest'], ['tigerclaw', 'starrobe']],
  rogue: [['dagger', 'leather'], ['kris', 'scalevest'], ['nightedge', 'shadowgarb']], paladin: [['copper', 'leather'], ['steel', 'silver'], ['mythril', 'mythmail']],
};

/* ---------- Monsters of part three. poison / curse: chance a normal hit leaves it. cast.st: the spell can leave it. fx: what shows on screen ---------- */
Object.assign(SG_MONSTERS, {
  thornhound:  { name: 'Thornhound', art: 'hound', pal: ['#0d1a08', '#2f5a1c', '#4f8a2c', '#8fc46a', '#c0392b', '#ffffff', '#111111'], hp: 85, atk: 46, def: 22, agi: 18, xp: 130, gold: 70, poison: 0.25 },
  frostwisp:   { name: 'Frost Wisp', art: 'wisp', pal: ['#0a1a2a', '#5a8fc0', '#a8d8f0', '#ffffff', '#2e4fb0', '#ffffff', '#0a1a2a'], hp: 70, atk: 40, def: 24, agi: 16, xp: 110, gold: 60, drain: 0.3, cast: { name: 'Hailstorm', power: 26, chance: 0.25, all: true, fx: 'ice' } },
  gloomshade:  { name: 'Gloomshade', art: 'imp', pal: ['#0a0612', '#2a1a40', '#4a2f6e', '#7a5aa8', '#e74c3c', '#ffffff', '#111111'], hp: 75, atk: 44, def: 24, agi: 15, xp: 125, gold: 70, cast: { name: 'Hex', power: 28, chance: 0.28, st: 'curse', fx: 'dark' } },
  bramblecrab: { name: 'Bramble Crab', art: 'crab', pal: ['#0f1a05', '#3d5a14', '#6b8e23', '#a8c66c', '#8b4513', '#ffffff', '#111111'], hp: 110, atk: 48, def: 34, agi: 6, xp: 150, gold: 80 },
  stormgull:   { name: 'Storm Gull', art: 'bird', pal: ['#0a0f1a', '#3a4a5a', '#8fa3b8', '#e8eef5', '#f4c542', '#ffffff', '#111111'], hp: 80, atk: 46, def: 20, agi: 24, xp: 130, gold: 70, cast: { name: 'Gale', power: 26, chance: 0.25, all: true, fx: 'wave' } },
  venomtome:   { name: 'Venom Tome', art: 'book', pal: ['#061a0a', '#145a2a', '#27ae60', '#82e0aa', '#8e44ad', '#eafaf1', '#111111'], hp: 95, atk: 48, def: 28, agi: 12, xp: 145, gold: 85, poison: 0.3 },
  krakenling:  { name: 'Krakenling', art: 'serpent', pal: ['#140514', '#5a1a5a', '#8e3a8e', '#d28ad2', '#f4c542', '#ffffff', '#111111'], hp: 120, atk: 52, def: 28, agi: 16, xp: 170, gold: 90, heavy: { name: 'Crushing Coil', mult: 1.6, chance: 0.2, fx: 'slash' } },
  reefblot:    { name: 'Reef Blot', art: 'blot', pal: ['#1a0a05', '#a3471a', '#e8742c', '#f7c08a', '#2ecc71', '#ffffff', '#111111'], hp: 100, atk: 48, def: 30, agi: 10, xp: 150, gold: 85, poison: 0.3 },
  cinderimp:   { name: 'Cinder Imp', art: 'imp', pal: ['#1a0500', '#8a1a00', '#e8540c', '#ffb066', '#f4e04d', '#ffffff', '#111111'], hp: 95, atk: 52, def: 28, agi: 16, xp: 160, gold: 90, cast: { name: 'Fireball', power: 34, chance: 0.3, fx: 'fire' } },
  magmagolem:  { name: 'Magma Golem', art: 'golem', pal: ['#140500', '#5a1a0a', '#a03a14', '#e8742c', '#ffd34d', '#ffffff', '#ffd34d'], hp: 170, atk: 58, def: 42, agi: 5, xp: 220, gold: 120, heavy: { name: 'Lava Fist', mult: 1.7, chance: 0.2, fx: 'fire' } },
  ashbat:      { name: 'Ash Bat', art: 'bat', pal: ['#0a0a0a', '#3a3a3a', '#6a6a6a', '#a8a8a8', '#ff7a1a', '#ffffff', '#ff4a1a'], hp: 90, atk: 50, def: 24, agi: 24, xp: 150, gold: 85, poison: 0.2 },
  flamecap:    { name: 'Flamecap', art: 'shroom', pal: ['#1a0500', '#8a2a0a', '#e8541c', '#ffb066', '#f4e04d', '#ffffff', '#111111'], hp: 100, atk: 50, def: 30, agi: 8, xp: 155, gold: 90, cast: { name: 'Ember Spores', power: 24, chance: 0.25, all: true, st: 'poison', fx: 'fire' } },
  cinderwyrm:  { name: 'The Cinder Wyrm', art: 'serpent', boss: true, pal: ['#140200', '#7a1400', '#d0340c', '#ff9a3a', '#ffe04d', '#ffffff', '#ffe04d'], hp: 2000, atk: 62, def: 34, agi: 18, xp: 2600, gold: 2500,
    cast: { name: 'Inferno', power: 42, chance: 0.35, all: true, fx: 'fire' }, heavy: { name: 'Molten Bite', mult: 1.8, chance: 0.2, fx: 'fire' }, poison: 0.2 },
  silentknight:{ name: 'Silent Knight', art: 'knight', pal: ['#05050a', '#2a2a3a', '#4a4a6a', '#8a8aa8', '#8e44ad', '#ffffff', '#c39bd3'], hp: 190, atk: 66, def: 44, agi: 14, xp: 290, gold: 140, heavy: { name: 'Silent Cleave', mult: 1.7, chance: 0.2, fx: 'slash' } },
  hushwraith:  { name: 'Hush Wraith', art: 'wisp', pal: ['#05020a', '#3a1a5a', '#6a3a9a', '#b08ad8', '#e74c3c', '#ffffff', '#05020a'], hp: 140, atk: 60, def: 40, agi: 22, xp: 260, gold: 130, drain: 0.35, cast: { name: 'Mute Hex', power: 34, chance: 0.25, st: 'curse', fx: 'dark' } },
  blankpage:   { name: 'Blank Page', art: 'book', pal: ['#1a1a1a', '#9a9a9a', '#e8e8e8', '#ffffff', '#14141c', '#ffffff', '#14141c'], hp: 160, atk: 64, def: 38, agi: 14, xp: 270, gold: 130, cast: { name: 'Blank Verse', power: 32, chance: 0.3, all: true, fx: 'dark' } },
  voidbat:     { name: 'Void Bat', art: 'bat', pal: ['#000000', '#14141c', '#2a2a40', '#5a5a80', '#8e44ad', '#ffffff', '#c39bd3'], hp: 130, atk: 62, def: 32, agi: 28, xp: 250, gold: 120, poison: 0.25 },
  inkgolem:    { name: 'Ink Golem', art: 'golem', pal: ['#000000', '#0a0a1a', '#1a1a3a', '#3a3a6a', '#f4c542', '#ffffff', '#f4c542'], hp: 240, atk: 70, def: 52, agi: 6, xp: 340, gold: 160, heavy: { name: 'Ink Hammer', mult: 1.7, chance: 0.2, fx: 'dark' } },
  /* the final boss: acts twice a round, and grows stronger at half health */
  unwriter:    { name: 'The Unwriter', art: 'sorcerer', boss: true, final: true, pal: ['#000000', '#1a0a2a', '#3a1a5a', '#6a3a9a', '#f4c542', '#ffffff', '#e74c3c'], hp: 3600, atk: 86, def: 44, agi: 26, xp: 0, gold: 0, acts: 2, drain: 0.12,
    specials: [
      { name: 'Unwrite', power: 54, all: true, st: 'curse', stChance: 0.35, fx: 'dark' },
      { name: 'Silence Nova', power: 64, all: true, fx: 'void' },
      { name: 'Quill of Ruin', mult: 2.1, fx: 'slash' },
      { name: 'Black Ink Rain', power: 40, all: true, st: 'poison', stChance: 0.5, fx: 'wave' },
      { name: 'Drink the Words', mpAll: 8, fx: 'void' }],
    rage: { name: 'The Final Chapter', power: 92, all: true, fx: 'void' } },
});
Object.assign(SG_ZONES, {
  isles: { list: [['thornhound', 3], ['frostwisp', 2], ['gloomshade', 2], ['bramblecrab', 2], ['stormgull', 2], ['venomtome', 2]], max: 3 },
  deepsea: { list: [['krakenling', 3], ['reefblot', 3], ['stormgull', 2]], max: 3 },
  ember1: { list: [['cinderimp', 3], ['ashbat', 3], ['flamecap', 3], ['magmagolem', 1]], max: 3 },
  ember2: { list: [['cinderimp', 2], ['ashbat', 2], ['flamecap', 2], ['magmagolem', 2]], max: 3 },
  tower1: { list: [['silentknight', 2], ['hushwraith', 3], ['blankpage', 3], ['voidbat', 3]], max: 3 },
  tower2: { list: [['silentknight', 3], ['hushwraith', 2], ['blankpage', 2], ['voidbat', 2], ['inkgolem', 1]], max: 3 },
  tower3: { list: [['silentknight', 3], ['blankpage', 2], ['inkgolem', 2], ['voidbat', 2]], max: 3 },
});
/* a few old monsters learn nasty tricks */
SG_MONSTERS.gloomcap.cast.st = 'poison'; SG_MONSTERS.cactling.poison = 0.15; SG_MONSTERS.scorpquill.poison = 0.3; SG_MONSTERS.hushwisp.curse = 0.08;
SG_MONSTERS.drownedpage.cast.st = 'curse'; SG_MONSTERS.erased.cast.fx = 'dark'; SG_MONSTERS.erased.heavy.fx = 'slash'; SG_MONSTERS.inkmaw.cast.fx = 'wave'; SG_MONSTERS.inkmaw.heavy.fx = 'slash';
SG_MONSTERS.typoimp.cast.fx = 'fire'; SG_MONSTERS.lanternfly.cast.fx = 'fire'; SG_MONSTERS.cactling.cast.fx = 'slash'; SG_MONSTERS.dustimp.cast.fx = 'wave'; SG_MONSTERS.drownedpage.cast.fx = 'wave';

/* ---------- Tiles of part three ----------
   Overworld: z wayside shrine  I Tower of Silence     Town: g tavern roof  N church roof
   Inside:    _ floor  O wooden wall  = bar counter  t table  b barrel  p pew  A altar  G stained glass */
['_', 'I'].forEach(t => SG_WALK.add(t));

/* ---------- Old towns get a tavern and a church ---------- */
SG_MAPS.town.rows = [...SG_MAPS.town.rows.slice(0, 14), '#.gggg...PP...NNNN.#', '#.HDHH...PP...HHDH.#', '#...P....PP.....P..#', '#F..PPPPPPPPPPPPP.F#', '#........PP........#', '#########PP#########'];
SG_MAPS.port.rows = SG_MAPS.town.rows.slice();
SG_MAPS.field.warps['5,16'].y = 18; SG_MAPS.seravel.warps['17,12'].y = 18;
for (const id of ['town', 'port']) Object.assign(SG_MAPS[id].doors, { '3,15': 'tavern', '16,15': 'church' });
SG_MAPS.well.rows[1] = '#d.RRR.NN.RRR.d#'; SG_MAPS.well.rows[2] = '#..HDH.DH.HDH..#';
SG_MAPS.well.rows[7] = '#..RRRR...S.ggg#'; SG_MAPS.well.rows[8] = '#..HHDH..PP.HDH#'; SG_MAPS.well.rows[9] = '#....P..PP...PT#';
SG_MAPS.well.signs = { '10,7': 'MIRAGE WELL. Sage Orrin lives by the well. Tavern to the east, chapel up north.' };
Object.assign(SG_MAPS.well.doors, { '7,2': 'church', '13,8': 'tavern' });
SG_MAPS.town.signs['8,10'] = 'QUILLHAVEN, capital of Aldermere. Inn and item shop ahead, smithy and Chronicle House below, tavern and church at the south gate.';

/* ---------- The new overworld spots ---------- */
const sgSetTile = (map, x, y, ch) => { const r = SG_MAPS[map].rows; r[y] = r[y].slice(0, x) + ch + r[y].slice(x + 1); };
sgSetTile('field', 21, 12, 'U'); sgSetTile('field', 3, 5, 'z'); sgSetTile('field', 12, 15, 'z');
SG_MAPS.field.warps['21,12'] = { map: 'briar', x: 9, y: 14, dir: 'up' };
(SG_MAPS.field.npcs ||= []).push({ id: 'fpriest', x: 9, y: 13, dir: 'down', look: 'priest', priest: true, name: 'Brother Ansel' });
sgSetTile('seravel', 4, 17, 'U'); sgSetTile('seravel', 14, 9, 'z'); sgSetTile('seravel', 3, 13, 'z');
SG_MAPS.seravel.warps['4,17'] = { map: 'sandmere', x: 9, y: 14, dir: 'up' };
(SG_MAPS.seravel.npcs ||= []).push({ id: 'spriest', x: 13, y: 7, dir: 'down', look: 'priest', priest: true, name: 'Sister Imane' });
/* sail off the east edge of the Seravel sea to reach the isles (after the Oracle) */
for (let y = 0; y < SG_MAPS.seravel.rows.length; y++) SG_MAPS.seravel.warps[`25,${y}`] = { map: 'eastsea', x: 1, y: Math.min(23, y + 2), dir: 'right', need: 'oracle', block: ['The waves out east are wild and dark.', 'Better visit the island shrine in the southeast first.'] };

/* ---------- The Eastern Isles ---------- */
const SG_SEA_ROWS = [
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWW...MMh.WWWWWWWWWW.M.MMWWW',
  'WWWWWWWf.ff.fh.f..WWWWWWf......M.W',
  'WWWWWWW.Mhz.U...MfWWWWWWM..f..PI.W',
  'WWWWWWW.f.PPP.f...WWWWWW.....P...W',
  'WWWWWWWWW.....ffWWWWWWWWf.UfP...fW',
  'WWWWWh.fWWWWWWWWWWWWWWWW.fPPz.f..W',
  'WWWW..f..WWWWWWWWWWWWWWWWW...f.WWW',
  'WWWf......WWWWWWWfWWWWWWWWWWWWWWWW',
  'WWf.fh..hfhWWW..f.f.fWWWWWWWWWWWWW',
  'WW..fUh.hfhWWf.h..hf..WWWWWWWWWWWW',
  'WWQPPP.....W..f..f.....WWWWWWWWWWW',
  'WWh..PPP...fhfffhU......WWWWWWWWWW',
  'WW....fPz.h....PPP..h...WWWWWWWWWW',
  'WWW.f.....W..hf.hPPP...fWWWWWWWWWW',
  'WWWW...f.WWW.....f..zf.WWWWWWWWWWW',
  'WWWWW..fWWWWW.....f...W..MMfh.WWWW',
  'WWWWWWWWWWWWWW.ff.ff.W..h.fMM.fWWW',
  'WWWWWWWWWWWWWWWWW.WWWffh...fVMh.WW',
  'WWWWWWWWWWWWWWWWWWWWW.f.U..fPMM.WW',
  'WWWWWWWWWWWWWWWWWWWWWff.PPPMM.hhWW',
  'WWWWWWWWWWWWWWWWWWWWWW.f.f.....WWW',
  'WWWWWWWWWWWWWWWWWWWWWWW..f....WWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW'];
SG_MAPS.eastsea = { name: 'The Eastern Isles', song: 'sg_isles', theme: 'field', rows: SG_SEA_ROWS, seaZone: 'deepsea', zone: () => 'isles',
  warps: { '5,11': { map: 'gull', x: 9, y: 14, dir: 'up' }, '12,4': { map: 'frost', x: 9, y: 14, dir: 'up' }, '17,13': { map: 'lantern', x: 9, y: 14, dir: 'up' },
    '24,20': { map: 'emberfall', x: 9, y: 14, dir: 'up' }, '26,6': { map: 'lastlight', x: 9, y: 14, dir: 'up' }, '28,19': { map: 'ember1', at: 'start' },
    '31,4': { map: 'tower1', at: 'start', need: 'crystal', block: ['The Tower of Silence has no door. Only smooth black stone.', 'Archmage Veyra of Lanternreach may know how to open it.'] } },
  npcs: [{ id: 'epriest', x: 14, y: 14, dir: 'down', look: 'priest', priest: true, name: 'Mother Solenne' }, { id: 'epriest2', x: 27, y: 4, dir: 'down', look: 'priest', priest: true, name: 'Brother Tobiah' }] };
for (let y = 0; y < SG_SEA_ROWS.length; y++) SG_MAPS.eastsea.warps[`0,${y}`] = { map: 'seravel', x: 24, y: Math.max(0, Math.min(21, y - 2)), dir: 'left' };
const SG_HARBOR = { seravel: { map: 'seravel', at: '20,5' }, eastsea: { map: 'eastsea', at: '1,12' } };   // where the ship waits after Wayfare

/* ---------- Seven new towns ---------- */
const sgNewTown = (id, name, rows, exitTo, doors, extra) => { SG_MAPS[id] = { name, song: 'sg_town', town: true, rows, exitTo, home: { x: 9, y: 9 }, doors, signs: {}, npcs: [], ...extra }; };
sgNewTown('briar', 'Briarwick', ['####################', '#.RRRR........NNNN.#', '#.HDHH....T...HHDHF#', '#..P..FF.....T..P..#', '#..PPPPPPPPPPPPPP..#', '#........PP........#', '#.gggg...PP...RRRR.#', '#.HDHH...PPF..HHDH.#', '#..P.....PP.....P.T#', '#..PPPPPPPPPPPPPP..#', '#.......SPP........#', '#.RRRR...PP...RRRR.#', '#.HDHH...PP.TTHHDH.#', '#..P.....PP.....P..#', '#..PPPPPPPPPPPPPP..#', '#########PP#########'],
  { map: 'field', x: 21, y: 13, dir: 'down' }, { '3,2': 'inn', '16,2': 'church', '3,7': 'tavern', '16,7': 'shop', '3,12': 'smith' },
  { inn: 8, shop: ['herb', 'antidote', 'bigherb', 'ether', 'feather'], smith: ['copper', 'quill', 'shortbow', 'dagger', 'cestus', 'leather'],
    signs: { '8,10': 'BRIARWICK. A quiet village east of Quillhaven. Try the stew at the tavern!' },
    npcs: [{ id: 'bw1', x: 6, y: 12, dir: 'right', look: 'man', wander: 1, chat: true }, { id: 'bw2', x: 15, y: 5, dir: 'down', look: 'lass', wander: 2, chat: true },
      { id: 'bw3', x: 5, y: 10, dir: 'right', look: 'kid', lines: ['There’s a stone shrine in the fields. If you pray there, everyone feels better!'] }] });
sgNewTown('sandmere', 'Sandmere', ['####################', '#.gggg....d...RRRR.#', '#.HDHH........HHDH.#', '#..P............P..#', '#..PPPPPPPPPPPPPP..#', '#........PP........#', '#.RRRR.k.PP...NNNN.#', '#.HDHH...PP..dHHDH.#', '#..P.....PP.....P..#', '#..PPPPPPPPPPPPPPd.#', '#.......SPP........#', '#........PP...RRRR.#', '#.k..d...PP...HHDHk#', '#........PP.....P..#', '#k.PPPPPPPPPPPPPP.d#', '#########PP#########'],
  { map: 'seravel', x: 4, y: 18, dir: 'down' }, { '3,2': 'tavern', '16,2': 'inn', '3,7': 'shop', '16,7': 'church', '16,12': 'smith' },
  { song: 'sg_desert', theme: 'desert', inn: 18, shop: ['herb', 'bigherb', 'antidote', 'ether', 'feather', 'phoenix'], smith: ['iron', 'willow', 'longbow', 'kris', 'tigerclaw', 'scalevest', 'chain', 'robe'],
    signs: { '8,10': 'SANDMERE. Last water before the southern dunes. Scorpquills sting: carry Antidotes!' },
    npcs: [{ id: 'sm1', x: 13, y: 13, dir: 'left', look: 'man', wander: 1, chat: true }, { id: 'sm2', x: 15, y: 9, dir: 'down', look: 'lass', wander: 2, chat: true },
      { id: 'sm3', x: 7, y: 9, dir: 'down', look: 'elder', lines: ['A monk walks the desert roads, they say. Fights like a sandstorm, heals like rain.'] }] });
sgNewTown('gull', 'Gullhaven', ['####################', '#.RRRR........RRRR.#', '#.HDHH.T......HHDH.#', '#..P....FT......P.T#', '#..PPPPPPPPPPPPPP.F#', '#........PP........#', '#.NNNN...PP...gggg.#', '#.HDHHT..PP.T.HHDH.#', '#..P.....PPF....P..#', '#..PPPPPPPPPPPPPP..#', '#T......SPP........#', '#.RRRR...PP...RRRR.#', '#.HDHH...PP...HHDH.#', '#..P.....PP.....P..#', '#..PPPPPPPPPPPPPP..#', '#########PP#########'],
  { map: 'eastsea', x: 5, y: 12, dir: 'down' }, { '3,2': 'inn', '16,2': 'shop', '3,7': 'church', '16,7': 'tavern', '3,12': 'smith', '16,12': 'chronicle' },
  { song: 'sg_port', inn: 40, shop: ['bigherb', 'megaherb', 'antidote', 'inktonic', 'feather', 'phoenix'], smith: ['steel', 'coral', 'longbow', 'kris', 'tigerclaw', 'silver', 'tiderobe', 'scalevest'],
    signs: { '8,10': 'GULLHAVEN, first harbor of the Eastern Isles. Mind the Storm Gulls!' },
    npcs: [{ id: 'gh1', x: 13, y: 8, dir: 'left', look: 'sailor', wander: 1, chat: true }, { id: 'gh2', x: 5, y: 4, dir: 'down', look: 'lass', wander: 2, chat: true },
      { id: 'gh3', x: 7, y: 9, dir: 'down', look: 'elder', lines: ['Lanternreach is east of here, across the land bridge. The Archmage lives there.'] }] });
sgNewTown('frost', 'Frosthold', ['####################', '#.NNNN........RRRR.#', '#.HDHH........HHDH.#', '#..P............P..#', '#..PPPPPPPPPPPPPP..#', '#........PP.T......#', '#.RRRR...PP...RRRRT#', '#.HDHH...PP..THHDH.#', '#..P.....PP.....P..#', '#..PPPPPPPPPPPPPP.T#', '#.......SPP........#', '#.gggg..TPP........#', '#THDHH...PP......T.#', '#..P.....PP.....TT.#', '#..PPPPPPPPPPPPPP..#', '#########PP#########'],
  { map: 'eastsea', x: 12, y: 5, dir: 'down' }, { '3,2': 'church', '16,2': 'inn', '3,7': 'shop', '16,7': 'smith', '3,12': 'tavern' },
  { inn: 45, shop: ['megaherb', 'antidote', 'inktonic', 'inkflask', 'feather', 'phoenix'], smith: ['mythril', 'runestaff', 'galebow', 'nightedge', 'mythmail', 'starrobe', 'shadowgarb'],
    signs: { '8,10': 'FROSTHOLD. The best smiths in the isles work the mythril mines here.' },
    npcs: [{ id: 'fh1', x: 11, y: 11, dir: 'down', look: 'man', wander: 1, chat: true }, { id: 'fh2', x: 12, y: 3, dir: 'down', look: 'lass', wander: 2, chat: true },
      { id: 'fh3', x: 4, y: 8, dir: 'right', look: 'elder', lines: ['Mythril is light as a feather and hard as a promise. Pricey, mind you.'] }] });
sgNewTown('lantern', 'Lanternreach', ['####################', '#FRRRRF...F..FNNNN.#', '#.HDHH........HHDH.#', '#..P............P..#', '#..PPPPPPPPPPPPPP..#', '#........PP........#', '#.RRRR...PP...gggg.#', '#.HDHHFF.PP...HHDH.#', '#..P..F..PP.....P..#', '#..PPPPPPPPPPPPPP..#', '#.......SPP........#', '#.RRRR...PP...RRRR.#', '#.HDHH...PP...HHDH.#', '#..P...F.PP.....P..#', '#F.PPPPPPPPPPPPPP..#', '#########PP#########'],
  { map: 'eastsea', x: 17, y: 14, dir: 'down' }, { '3,2': 'shop', '16,2': 'church', '3,7': 'inn', '16,7': 'tavern', '3,12': 'chronicle', '16,12': 'smith' },
  { inn: 45, shop: ['megaherb', 'antidote', 'inktonic', 'inkflask', 'feather', 'phoenix'], smith: ['steel', 'coral', 'galebow', 'nightedge', 'silver', 'starrobe', 'shadowgarb'],
    signs: { '8,10': 'LANTERNREACH, city of lamps and learning. The Archmage’s tower-house is by the fountain.' },
    npcs: [{ id: 'archmage', x: 12, y: 5, dir: 'down', look: 'archmage', archmage: true }, { id: 'lr1', x: 13, y: 12, dir: 'left', look: 'man', wander: 1, chat: true },
      { id: 'lr2', x: 5, y: 5, dir: 'down', look: 'lass', wander: 2, chat: true }, { id: 'lr3', x: 16, y: 10, dir: 'left', look: 'kid', lines: ['The Archmage can fly anywhere she has ever been. I want to learn that!'] }] });
sgNewTown('emberfall', 'Emberfall', ['####################', '#.RRRR........RRRRT#', '#.HDHH....d...HHDH.#', '#..P............P..#', '#T.PPPPPPPPPPPPPP..#', '#.d......PP........#', '#.gggg...PP...NNNN.#', '#dHDHH...PP...HHDH.#', '#..P.....PP.....P..#', '#..PPPPPPPPPPPPPP..#', '#.......SPP..d.....#', '#.RRRR...PP.......T#', '#THDHH...PP.d......#', '#..P.....PP........#', '#..PPPPPPPPPPPPPP..#', '#########PP#########'],
  { map: 'eastsea', x: 24, y: 21, dir: 'down' }, { '3,2': 'inn', '16,2': 'smith', '3,7': 'tavern', '16,7': 'church', '3,12': 'shop' },
  { inn: 50, shop: ['megaherb', 'antidote', 'inkflask', 'feather', 'phoenix'], smith: ['mythril', 'runestaff', 'galebow', 'nightedge', 'mythmail', 'starrobe', 'shadowgarb'],
    signs: { '8,10': 'EMBERFALL, at the foot of the fire mountain. Ember Cave is just east of town.' },
    npcs: [{ id: 'ef1', x: 5, y: 4, dir: 'down', look: 'man', wander: 1, chat: true }, { id: 'ef2', x: 11, y: 9, dir: 'down', look: 'lass', wander: 2, chat: true },
      { id: 'ef3', x: 5, y: 8, dir: 'right', look: 'elder', lines: ['The Cinder Wyrm breathes poison smoke as well as fire. Bring Antidotes.'] }] });
sgNewTown('lastlight', 'Last Light', ['####################', '#FNNNN....F...RRRR.#', '#.HDHH........HHDH.#', '#..P............P..#', '#..PPPPPPPPPPPPPP..#', '#........PP......F.#', '#.ggggF..PP..FRRRR.#', '#.HDHH...PP...HHDH.#', '#..P.....PP.....P..#', '#..PPPPPPPPPPPPPP..#', '#.......SPP........#', '#FRRRR...PP..FRRRR.#', '#.HDHH...PP...HHDHF#', '#F.P.....PP.....P..#', '#..PPPPPPPPPPPPPP..#', '#########PP#########'],
  { map: 'eastsea', x: 26, y: 7, dir: 'down' }, { '3,2': 'church', '16,2': 'shop', '3,7': 'tavern', '16,7': 'inn', '3,12': 'smith', '16,12': 'chronicle' },
  { inn: 60, shop: ['megaherb', 'antidote', 'inkflask', 'feather', 'phoenix'], smith: ['mythril', 'runestaff', 'galebow', 'nightedge', 'mythmail', 'starrobe', 'shadowgarb'],
    signs: { '8,10': 'LAST LIGHT. The final lamp before the Tower of Silence. Rest well, hero.' },
    npcs: [{ id: 'll1', x: 14, y: 8, dir: 'left', look: 'man', wander: 1, chat: true }, { id: 'll2', x: 8, y: 4, dir: 'down', look: 'guard', lines: ['Nobody who climbed the Tower has ever come back down. Nobody.'] },
      { id: 'll3', x: 7, y: 5, dir: 'down', look: 'lass', wander: 1, chat: true }] });

/* ---------- Taverns and churches inside every town ---------- */
const SG_TAVERN_ROWS = ['OOOOOOOOOOOO', 'Ob________bO', 'OO========OO', 'O__________O', 'O_t__t__t__O', 'O__________O', 'O_t__t__t__O', 'O__________O', 'Ob________bO', 'OOOOO__OOOOO'];
const SG_CHURCH_ROWS = ['####GGGG####', '#____AA____#', '#__________#', '#_ppp__ppp_#', '#__________#', '#_ppp__ppp_#', '#__________#', '#_ppp__ppp_#', '#____KK____#', '#####KK#####'];
/* what people say in each town's tavern: hints, local news, and who you can hire */
const SG_TAVERNS = {
  town:      { barkeep: 'Old Hob', talk: [['man', 'The river bridge is the only way north. The Hollow of Echoes is past it, up in the hills.'], ['lass', 'Lost a fight? Feeling sick? The church by the south gate can help. Holy water fixes curses.'], ['elder', 'In my day we answered fast in a fight. The faster you answer, the harder you hit, you know!']] },
  briar:     { barkeep: 'Mabel', talk: [['man', 'The stone shrines out in the fields heal everyone who prays at them. Even the fallen!'], ['kid', 'Bram the Ranger always sits here. He shoots apples off trees from way far away.']], hire: ['ranger', 90] },
  well:      { barkeep: 'Jasir', talk: [['man', 'Sage Orrin gives spelling tests. Practise your words before you go in!'], ['lass', 'Scorpquills sting with poison. Keep Antidotes in your bag, or visit a priest.']] },
  port:      { barkeep: 'Captain Nell', talk: [['sailor', 'The Sunken Archive’s stairs are south of the city, on the coast.'], ['elder', 'Past the Oracle’s isle, sail off the eastern edge of the sea. The Eastern Isles are out there.']], hire: ['rogue', 350] },
  sandmere:  { barkeep: 'Zaid', talk: [['man', 'Curses make you weak. Only Holy water or a priest can lift one. The Sister on the road sells it.'], ['lass', 'The Oracle’s shrine is on an island. You need a ship to reach it.']], hire: ['monk', 260] },
  gull:      { barkeep: 'Pell', talk: [['sailor', 'Welcome to the isles! Lanternreach is east, over the land bridge.'], ['man', 'Frosthold is on the north isle. Finest mythril in the world, they say.'], ['lass', 'Gloomshades cast hexes. Carry Holy water before you go wandering.']], hire: ['rogue', 600] },
  frost:     { barkeep: 'Ingrid', talk: [['man', 'A paladin named Corin hunts monsters around the isles. Strong as an ox.'], ['elder', 'The Tower of Silence is on the far east isle. Its walls drink every sound.']], hire: ['paladin', 1400] },
  lantern:   { barkeep: 'Ottoline', talk: [['lass', 'Archmage Veyra lives here in town. She knows more about the Tower than anyone.'], ['man', 'Ember Cave is on the volcano isle, south-east of here.'], ['kid', 'Wayfare is the best spell. Whoosh! Any town you like!']] },
  emberfall: { barkeep: 'Brannoc', talk: [['man', 'The Cinder Wyrm sleeps on the Voice Crystal, deep in Ember Cave.'], ['elder', 'Two floors down, and the heat gets worse with every step. Bring Mega herbs.']] },
  lastlight: { barkeep: 'Sister Wynne', talk: [['guard', 'The Unwriter acts twice for every one of your turns. Use your shields and your strongest songs.'], ['lass', 'When he is half beaten he gets angry. Then he writes “The Final Chapter”. Keep everyone healed!'], ['man', 'Pray at the shrine just outside town before you climb.']], hire: ['paladin', 1400] },
};
const SG_TOWN_PRIEST = { town: 'Father Edric', briar: 'Sister Ama', well: 'Brother Kaveh', port: 'Mother Liane', sandmere: 'Brother Rafi', gull: 'Sister Moira', frost: 'Father Aksel', lantern: 'Mother Iris', emberfall: 'Brother Cael', lastlight: 'Father Lumen' };
for (const [town, info] of Object.entries(SG_TAVERNS)) {
  const t = SG_MAPS[town], door = k => Object.entries(t.doors).find(([, v]) => v === k)[0].split(',').map(Number);
  const [tx, ty] = door('tavern'), [cx, cy] = door('church'), spots = [[3, 4, 'left'], [6, 6, 'left'], [10, 3, 'down'], [1, 6, 'right'], [7, 4, 'left']];
  SG_MAPS[town + '_tav'] = { name: `${t.name} · Tavern`, song: 'sg_tavern', inside: true, theme: 'tavern', rows: SG_TAVERN_ROWS, exitTo: { map: town, x: tx, y: ty + 1, dir: 'down' }, entry: { x: 5, y: 8 },
    npcs: [{ id: 'barkeep', x: 5, y: 1, dir: 'down', look: 'barkeep', barkeep: true, name: info.barkeep },
      ...(info.hire ? [{ id: 'hire_' + info.hire[0], x: 3, y: 4, dir: 'left', look: info.hire[0], hire: info.hire[0], cost: info.hire[1] }] : []),
      ...info.talk.map(([look, line], i) => { const [x, y, dir] = spots[(i + (info.hire ? 1 : 0)) % spots.length]; return { id: 'tv' + i, x, y, dir, look, lines: [line] }; }),
      { id: 'tvchat', x: 9, y: 7, dir: 'left', look: 'man', chat: true, wander: 1 }] };
  SG_MAPS[town + '_church'] = { name: `${t.name} · Church`, song: 'sg_church', inside: true, theme: 'church', rows: SG_CHURCH_ROWS, exitTo: { map: town, x: cx, y: cy + 1, dir: 'down' }, entry: { x: 5, y: 8 },
    npcs: [{ id: 'priest', x: 5, y: 2, dir: 'down', look: 'priest', priest: true, name: SG_TOWN_PRIEST[town] },
      { id: 'pilgrim', x: 9, y: 4, dir: 'up', look: 'elder', lines: ['I come here every day to pray. The priest can wake the fallen and lift any curse.'] }] };
  t.tavern = town + '_tav'; t.church = town + '_church';
}

/* ---------- Part three dungeons ---------- */
Object.assign(SG_MAPS, {
  ember1: { name: 'Ember Cave · 1F', song: 'sg_ember', theme: 'ember', zone: () => 'ember1',
    gen: { w: 20, h: 18, seed: 9157, theme: 'cave', points: [[9, 15], [16, 11], [3, 9], [13, 4], [4, 2]], open: 0.55, grass: 0.5 },
    upTo: { map: 'eastsea', x: 28, y: 20, dir: 'down' }, downTo: 'ember2',
    objs: [{ id: 'e1c1', type: 'chest', at: 0.15, give: { megaherb: 2 } }, { id: 'e1c2', type: 'chest', at: 0.3, give: { antidote: 4 } }, { id: 'e1l1', type: 'lockChest', at: 0.45, give: { gear: 'tigerclaw' } },
      { id: 'e1guard', type: 'foeSpot', at: 0.6, group: ['magmagolem', 'cinderimp'], lines: ['The rock wall cracks open and glows red!'] }, { id: 'e1c3', type: 'chest', at: 0.8, give: { gold: 900 } }, { id: 'e1seal', type: 'seal', at: 1 }] },
  ember2: { name: 'Ember Cave · 2F', song: 'sg_ember', theme: 'ember', zone: () => 'ember2',
    gen: { w: 20, h: 20, seed: 3389, theme: 'cave', points: [[10, 17], [4, 12], [15, 9], [6, 5], [13, 2]], open: 0.55, grass: 0.5 },
    upTo: 'ember1',
    objs: [{ id: 'e2c1', type: 'chest', at: 0.15, give: { inkflask: 1 } }, { id: 'e2l1', type: 'lockChest', at: 0.3, give: { gear: 'galebow' } }, { id: 'e2c2', type: 'chest', at: 0.45, give: { phoenix: 2 } },
      { id: 'e2l2', type: 'lockChest', at: 0.62, give: { gear: 'starrobe' } }, { id: 'e2c3', type: 'chest', at: 0.78, give: { megaherb: 3 } },
      { id: 'cinderwyrm', type: 'boss', at: 0.93, group: ['cinderwyrm'], story: 'cinderwyrm' }, { id: 'crystal', type: 'chest', at: 1, give: { flag: 'crystal' }, guard: 'cinderwyrm', story: 'crystal' }] },
  tower1: { name: 'Tower of Silence · 1F', song: 'sg_tower', theme: 'tower', zone: () => 'tower1',
    gen: { w: 20, h: 18, seed: 5501, theme: 'cave', points: [[10, 15], [3, 12], [16, 9], [4, 5], [15, 2]], open: 0.5, grass: 0.4 },
    upTo: { map: 'eastsea', x: 30, y: 4, dir: 'left' }, downTo: 'tower2',
    objs: [{ id: 't1c1', type: 'chest', at: 0.15, give: { holywater: 3 } }, { id: 't1c2', type: 'chest', at: 0.35, give: { gear: 'mythmail' } },
      { id: 't1guard', type: 'foeSpot', at: 0.55, group: ['silentknight', 'silentknight'], lines: ['Two knights of black stone step out of the wall.'] }, { id: 't1l1', type: 'lockChest', at: 0.7, give: { gear: 'mythril' } },
      { id: 't1c3', type: 'chest', at: 0.85, give: { megaherb: 3 } }, { id: 't1seal', type: 'seal', at: 1 }] },
  tower2: { name: 'Tower of Silence · 2F', song: 'sg_tower', theme: 'tower', zone: () => 'tower2',
    gen: { w: 20, h: 20, seed: 6602, theme: 'cave', points: [[9, 17], [16, 13], [3, 10], [14, 5], [5, 2]], open: 0.5, grass: 0.4 },
    upTo: 'tower1', downTo: 'tower3',
    objs: [{ id: 't2c1', type: 'chest', at: 0.15, give: { inkflask: 2 } }, { id: 't2l1', type: 'lockChest', at: 0.3, give: { gear: 'runestaff' } }, { id: 't2c2', type: 'chest', at: 0.45, give: { phoenix: 2 } },
      { id: 't2guard', type: 'foeSpot', at: 0.6, group: ['inkgolem', 'hushwraith'], lines: ['The ink on the floor rises up into a giant!'] }, { id: 't2l2', type: 'lockChest', at: 0.75, give: { gear: 'nightedge' } },
      { id: 't2c3', type: 'chest', at: 0.88, give: { holywater: 3 } }, { id: 't2seal', type: 'seal', at: 1 }] },
  tower3: { name: 'Tower of Silence · Top', song: 'sg_tower', theme: 'tower', zone: () => 'tower3',
    gen: { w: 18, h: 18, seed: 7703, theme: 'cave', points: [[9, 15], [3, 10], [14, 7], [9, 2]], open: 0.5, grass: 0.4 },
    upTo: 'tower2',
    objs: [{ id: 't3c1', type: 'chest', at: 0.2, give: { megaherb: 4 } }, { id: 't3c2', type: 'chest', at: 0.4, give: { inkflask: 2 } },
      { id: 't3guard', type: 'foeSpot', at: 0.6, group: ['silentknight', 'inkgolem', 'silentknight'], lines: ['The Unwriter’s last guards block the stairs!'] },
      { id: 't3c3', type: 'chest', at: 0.75, give: { phoenix: 3 } }, { id: 'unwriter', type: 'boss', at: 0.93, group: ['unwriter'], story: 'unwriter' },
      { id: 'lexicon', type: 'chest', at: 1, give: { flag: 'lexicon' }, guard: 'unwriter', story: 'lexicon' }] },
});

/* ---------- Story ---------- */
Object.assign(SG_STORY, {
  isles: ['🌊 Beyond the edge of the sea, green islands rise out of the mist.', 'You have reached <b>the Eastern Isles</b>! A harbor town, Gullhaven, lies just ahead.'],
  archmageFirst: n => ['Archmage Veyra: So the hero with the shards has come at last. I am Veyra.', 'The Unwriter hides at the top of the <b>Tower of Silence</b>, on the far east isle.',
    'The tower has no door. It only opens for a voice that cannot be silenced: the <b>Voice Crystal</b>.', 'The crystal lies deep in <b>Ember Cave</b>, on the volcano isle to the south-east. A Cinder Wyrm sleeps on it.',
    `Go carefully, ${n}. And come back to me once you have it.`],
  archmageAgain: ['Archmage Veyra: Ember Cave is on the volcano isle, south-east of here. Bring the Voice Crystal back to me.'],
  archmageWayfare: n => [`Archmage Veyra: The Voice Crystal! You did it, ${n}.`, 'Hold it up to the black stone of the tower, and the tower will hear you.',
    'Before you go, let me teach you my oldest spell: <b>Wayfare</b>.', '🌀 You learned <b>Wayfare</b>! Open the menu and choose Wayfare to fly to any town you have visited.', 'Rest, get ready, and then end this.'],
  archmageAfter: ['Archmage Veyra: The Tower of Silence is on the far east isle, past Last Light. Use Wayfare if you need supplies.'],
  cinderwyrm: ['The cave floor is a lake of fire. In the middle, something huge uncurls.', 'A wyrm made of cinders opens one burning eye.', 'The Cinder Wyrm: SMALL THINGS… COME TO STEAL MY SHINY VOICE? BURN!'],
  cinderwyrmWin: ['The Cinder Wyrm crumbles into a heap of cooling ash.', 'Behind it, something glows and hums like a single held note.'],
  crystal: ['💠 You found the <b>Voice Crystal</b>! It hums a single clear note that nothing can silence.', 'Bring it to Archmage Veyra in Lanternreach.'],
  unwriter: ['At the top of the tower, the air is perfectly still. Not a sound. Not even your own steps.', 'A tall figure in a robe of blank pages turns around. Where his words should be, there is only ink.',
    'The Unwriter: Words. Noisy, messy, endless words. I am almost finished erasing them.', 'The Unwriter: Your little shards cannot stop me. I will unwrite you first.', 'The Unwriter: …and then, at last, SILENCE.'],
  unwriterWin: ['The Unwriter staggers. The ink pours out of his robe, and letters fly up like sparks.', 'The Unwriter: No… the words… they are writing themselves back…', 'With a sound like a book slamming shut, he is gone.'],
  lexicon: n => ['💎 The remaining shards of the Lexicon rise from the floor and join the two you carry.', 'The great Lexicon is whole again! It glows with every word that ever was.',
    'All over the world, rivers remember their names, bells remember their songs, and people remember their words.', `King Aldous, Queen Ysolde and Archmage Veyra will sing about ${n} and friends for a thousand years.`,
    '🏆 <b>THE END</b>, and thank you for playing Lexicon Saga!', 'You can keep exploring, fighting and studying. Every town is still open.'],
  roadMonk: n => ['When the dust settles, a woman in orange robes walks out of the dunes.', 'Sefa: You fight well, but you heal like a goat. I am Sefa, a monk of the sands.', `Sefa: I can cure poison and curses with my hands. Shall I walk with you, ${n}?`],
  roadPaladin: n => ['A tall warrior in white armor lowers his sword and nods at you.', 'Corin: I have been hunting the Unwriter’s beasts on these isles for a year.', `Corin: I am Corin, a paladin. Let me fight beside you, ${n}.`],
});
SG_CHAT.push('Poison hurts a little with every step. An Antidote or a priest will fix it.', 'Curses make your hero weak. Holy water lifts them, and only priests have it.',
  'Pray at a wayside shrine to heal everyone, even the fallen.', 'Answer before the meter runs out! Too slow, and the monsters attack first.',
  'The quicker you answer, the harder you hit. Answer in a flash for a critical!', 'Taverns are full of gossip. Talk to everyone!');

/* ---------- Progress hints (barkeeps share the next step) ---------- */
function sgHint(s) {
  const f = s.flags;
  if (!f.king) return 'King Aldous is looking for heroes. The castle is at the top of Quillhaven.';
  if (!f.shard) return 'The Hollow of Echoes is north across the river bridge. A knight with no face guards the first shard.';
  if (!f.kingDone) return 'Take the shard back to King Aldous in Quillhaven!';
  if (!f.queen) return 'The mountain pass east of the plains leads to Seravel. Queen Ysolde rules from Port Lumen.';
  if (!f.tide) return 'Sage Orrin of Mirage Well, in the north-west of the sands, makes Tide Charms. He tests your spelling.';
  if (!f.shard2) return 'The Sunken Archive’s stairs are on the coast south of Port Lumen. Use the Tide Charm there.';
  if (!f.ship) return 'Take the second shard to Queen Ysolde in Port Lumen.';
  if (!f.oracle) return 'Sail the Quill Swan to the island shrine in the south-east of Seravel.';
  if (!f.isles) return 'Sail east off the edge of the Seravel sea to reach the Eastern Isles.';
  if (!f.archmage) return 'Archmage Veyra in Lanternreach, on the big central isle, knows about the Tower of Silence.';
  if (!f.crystal) return 'Ember Cave is on the volcano isle in the south-east, next to Emberfall. A Cinder Wyrm guards the Voice Crystal.';
  if (!f.wayfare) return 'Bring the Voice Crystal to Archmage Veyra in Lanternreach.';
  if (!f.lexicon) return 'The Tower of Silence is on the far east isle, past Last Light. Stock up on Holy water and Mega herbs!';
  return 'They sing songs about you in every tavern now, hero!';
}

/* ---------- Music for part three (original tunes) ---------- */
Object.assign(TRM_SONGS, {
  sg_tavern: { bpm: 138, lead: ['G4 B4 D5 B4 G4 B4 D5 -', 'C5 E5 G5 E5 C5 E5 G5 -', 'D5 F#5 A5 F#5 D5 C5 B4 A4', 'G4 - B4 - D5 - . .', 'E5 - D5 C5 B4 - A4 G4', 'A4 - C5 - E5 - D5 -', 'B4 D5 G5 D5 C5 A4 F#4 A4', 'G4 - - - G4 - . .'],
    bass: ['G2 - D3 - G2 - D3 -', 'C3 - G3 - C3 - G3 -', 'D3 - A3 - D3 - F#3 -', 'G2 - D3 - G2 - . .', 'C3 - G3 - G2 - D3 -', 'A2 - E3 - D3 - A3 -', 'G2 - D3 - D3 - A2 -', 'G2 - D3 - G2 - . .'], drums: ['k . h k s . h .'], vol: 0.8 },
  sg_church: { bpm: 72, lead: ['C5 - - - E5 - - -', 'G5 - - - F5 - E5 -', 'D5 - - - F5 - - -', 'E5 - - - - - . .', 'A4 - - - C5 - - -', 'F5 - - - E5 - D5 -', 'C5 - - - B4 - - -', 'C5 - - - - - . .'],
    bass: ['C3 - - - G2 - - -', 'E3 - - - C3 - - -', 'G2 - - - D3 - - -', 'C3 - - - - - . .', 'F2 - - - A2 - - -', 'D3 - - - G2 - - -', 'F2 - - - G2 - - -', 'C3 - - - - - . .'], drums: ['. . . . . . . .'], vol: 0.6 },
  sg_isles: { bpm: 128, lead: ['D5 - F#5 A5 - G5 F#5 -', 'E5 - C5 - D5 - A4 -', 'D5 - F#5 A5 - B5 A5 G5', 'F#5 - - - E5 - . .', 'G5 - B5 - A5 F#5 D5 -', 'C5 - E5 - D5 - A4 -', 'B4 C5 D5 E5 F#5 G5 A5 F#5', 'D5 - - - A4 - . .'],
    bass: ['D3 - A3 - D3 - A3 -', 'C3 - G3 - D3 - A3 -', 'D3 - A3 - G2 - D3 -', 'D3 - A3 - A2 - . .', 'G2 - D3 - D3 - A3 -', 'C3 - G3 - D3 - A3 -', 'G2 - D3 - A2 - E3 -', 'D3 - A3 - D3 - . .'], drums: ['k . h . s . h h'], vol: 0.8 },
  sg_ember: { bpm: 104, lead: ['E5 - - G5 F#5 - E5 -', 'D#5 - - - B4 - . .', 'C5 - - E5 D5 - C5 -', 'B4 - - - - - . .', 'E5 - G5 - B5 - A5 G5', 'F#5 - D#5 - B4 - . .', 'C5 D5 E5 - D#5 - B4 -', 'E4 - - - - - . .'],
    bass: ['E2 E3 E2 E3 E2 E3 E2 E3', 'B1 B2 B1 B2 B1 B2 B1 B2', 'C2 C3 C2 C3 C2 C3 C2 C3', 'B1 B2 B1 B2 B1 B2 . .', 'E2 E3 E2 E3 G2 G3 G2 G3', 'B1 B2 B1 B2 B1 B2 B1 B2', 'A1 A2 A1 A2 B1 B2 B1 B2', 'E2 E3 E2 E3 E2 - . .'], drums: ['k . . s k . . s'], vol: 0.75 },
  sg_tower: { bpm: 84, lead: ['A4 - - C5 - - B4 -', 'G#4 - - - - - . .', 'F4 - - A4 - - G#4 -', 'E4 - - - - - . .', 'A4 - C5 - E5 - D#5 -', 'D5 - - B4 - - . .', 'C5 - B4 - A4 - G#4 -', 'A4 - - - - - . .'],
    bass: ['A2 - E3 - A2 - E3 -', 'E2 - B2 - E2 - B2 -', 'F2 - C3 - F2 - C3 -', 'E2 - B2 - E2 - G#2 -', 'A2 - E3 - C3 - E3 -', 'B2 - F3 - B2 - F3 -', 'F2 - C3 - E2 - B2 -', 'A2 - E3 - A2 - . .'], drums: ['k . . . . . . .'], vol: 0.7 },
  sg_final: { bpm: 196, lead: ['D5 F5 A5 D6 C#6 - A5 -', 'Bb5 - G5 - E5 - C#5 -', 'D5 F5 A5 D6 F6 - E6 D6', 'C#6 - - - A5 - . .', 'G5 Bb5 D6 G6 F6 - D6 -', 'E6 - C#6 - A5 - G5 -', 'F5 G5 A5 Bb5 C#6 D6 E6 C#6', 'D6 - - - D5 - . .'],
    bass: ['D2 D3 D2 D3 D2 D3 D2 D3', 'G2 G3 G2 G3 A2 A3 A2 A3', 'D2 D3 D2 D3 D2 D3 D2 D3', 'A2 A3 A2 A3 A2 A3 C#3 C#4', 'G2 G3 G2 G3 G2 G3 G2 G3', 'A2 A3 A2 A3 A2 A3 A2 A3', 'Bb2 Bb3 Bb2 Bb3 A2 A3 A2 A3', 'D2 D3 D2 D3 D2 - . .'], drums: ['k s k s k k s s'], vol: 0.95 },
});
