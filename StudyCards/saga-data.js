'use strict';
/* ================= Lexicon Saga: world data (all original) =================
   A turn-based word adventure in the spirit of classic 8-bit role-playing games.
   Story (part one): the Unwriter is erasing words from the Kingdom of Aldermere. A young knight,
   a scribe and a cantor set out to the Hollow of Echoes to win back the first Lexicon Shard.
   saga.js is the engine; this file is the world: heroes, spells, monsters, items, maps and story. */

/* ---------- Heroes ---------- */
const SG_HEROES = {
  knight: { cls: 'Knight', icon: '🛡️', hp: [30, 9], mp: [2, 1.6], atk: [8, 3], def: [6, 2.4], agi: [5, 1.4], mag: [2, 0.6],
    look: { hair: 'peaked', capC: 2, shirt: 2, pants: 3, cape: 1 }, colors: { 0: '#f2c29a', 1: '#c9d3e0', 2: '#4f74c8', 3: '#141420' } },
  scribe: { cls: 'Scribe', icon: '🪶', hp: [22, 6], mp: [9, 4], atk: [5, 1.8], def: [3, 1.5], agi: [7, 2], mag: [8, 3],
    look: { hair: 'long', shirt: 1, body: 'dress', glasses: 1 }, colors: { 0: '#f2c29a', 1: '#c04a4a', 2: '#7a2f3a', 3: '#20140c' } },
  cantor: { cls: 'Cantor', icon: '🎶', hp: [24, 6.5], mp: [8, 3.4], atk: [5, 2], def: [4, 1.8], agi: [6, 1.8], mag: [7, 2.6],
    look: { hair: 'bun', shirt: 1, body: 'coat', scarf: 1 }, colors: { 0: '#f2c29a', 1: '#f4e3a2', 2: '#3f8f6f', 3: '#1a1a14' } },
};
const SG_NAMES = { scribe: 'Tamsin', cantor: 'Lyra' };

/* ---------- Spells and skills. kind: hit (one foe), all (every foe), heal (one ally), healAll, ward (party), revive, power (strong hit) ---------- */
const SG_SPELLS = {
  slash:   { name: 'Power Slash', who: 'knight', lv: 3, mp: 3, kind: 'power', mult: 2.0, desc: 'A mighty swing: double damage to one foe.' },
  shield:  { name: 'Shield Wall', who: 'knight', lv: 6, mp: 4, kind: 'ward', turns: 3, desc: 'Halves damage to the whole party for 3 rounds.' },
  flare:   { name: 'Flare', who: 'scribe', lv: 1, mp: 2, kind: 'hit', power: 10, desc: 'A burst of fire on one foe.' },
  frost:   { name: 'Frost', who: 'scribe', lv: 4, mp: 4, kind: 'all', power: 9, desc: 'Freezing wind that hits every foe.' },
  bolt:    { name: 'Bolt', who: 'scribe', lv: 8, mp: 6, kind: 'hit', power: 26, desc: 'A crack of lightning on one foe.' },
  mend:    { name: 'Mend', who: 'cantor', lv: 1, mp: 2, kind: 'heal', power: 30, desc: 'Heals one ally.' },
  hymn:    { name: 'Hymn of Iron', who: 'cantor', lv: 4, mp: 3, kind: 'ward', turns: 3, desc: 'Halves damage to the whole party for 3 rounds.' },
  chorus:  { name: 'Chorus', who: 'cantor', lv: 7, mp: 6, kind: 'healAll', power: 28, desc: 'Heals the whole party.' },
  rekindle:{ name: 'Rekindle', who: 'cantor', lv: 9, mp: 8, kind: 'revive', desc: 'Brings a fallen ally back with half their HP.' },
};

/* ---------- Items and equipment ---------- */
const SG_ITEMS = {
  herb:    { name: 'Herb', icon: '🌿', price: 8, heal: 30, desc: 'Heals 30 HP.' },
  bigherb: { name: 'Big herb', icon: '🍀', price: 30, heal: 80, desc: 'Heals 80 HP.' },
  ether:   { name: 'Ink ether', icon: '🧪', price: 40, mp: 12, desc: 'Restores 12 MP.' },
  feather: { name: 'Homeward feather', icon: '🪶', price: 25, desc: 'Flies the party back to the last town. Not in battle.' },
  phoenix: { name: 'Ember down', icon: '🔥', price: 120, revive: 0.5, desc: 'Wakes a fallen ally with half their HP.' },
};
const SG_GEAR = {
  stick:   { name: 'Oak stick', slot: 'weapon', atk: 2, price: 10, for: ['knight', 'scribe', 'cantor'] },
  copper:  { name: 'Copper sword', slot: 'weapon', atk: 7, price: 60, for: ['knight'] },
  iron:    { name: 'Iron sword', slot: 'weapon', atk: 14, price: 240, for: ['knight'] },
  quill:   { name: 'Quill staff', slot: 'weapon', atk: 4, mag: 3, price: 45, for: ['scribe', 'cantor'] },
  willow:  { name: 'Willow wand', slot: 'weapon', atk: 7, mag: 7, price: 180, for: ['scribe', 'cantor'] },
  cloth:   { name: 'Cloth tunic', slot: 'armor', def: 2, price: 20, for: ['knight', 'scribe', 'cantor'] },
  leather: { name: 'Leather vest', slot: 'armor', def: 5, price: 80, for: ['knight', 'scribe', 'cantor'] },
  chain:   { name: 'Chain mail', slot: 'armor', def: 11, price: 320, for: ['knight'] },
  robe:    { name: 'Sage robe', slot: 'armor', def: 8, mag: 2, price: 220, for: ['scribe', 'cantor'] },
};

/* ---------- Monsters (art is drawn by saga.js from these parts and colors) ----------
   pal: outline, dark, mid, light, accent, white, pupil */
const SG_MONSTERS = {
  blotling:  { name: 'Blotling', art: 'blot', pal: ['#1a0f26', '#3b1f5c', '#6a3fa0', '#9b72d0', '#f06292', '#ffffff', '#111111'], hp: 9, atk: 7, def: 3, agi: 4, xp: 4, gold: 3 },
  runerat:   { name: 'Rune Rat', art: 'rat', pal: ['#1d120a', '#5a3a22', '#8b5e3c', '#b98a5e', '#4fc3f7', '#ffffff', '#111111'], hp: 11, atk: 9, def: 4, agi: 8, xp: 5, gold: 4 },
  typoimp:   { name: 'Typo Imp', art: 'imp', pal: ['#250808', '#7a1c1c', '#c0392b', '#ef7a6a', '#f4c542', '#ffffff', '#111111'], hp: 13, atk: 9, def: 5, agi: 7, xp: 7, gold: 6, cast: { name: 'Spark', power: 7, chance: 0.3 } },
  papermoth: { name: 'Paper Moth', art: 'moth', pal: ['#2a2418', '#b8a77a', '#e8dcb5', '#fbf6e6', '#5d6d7e', '#ffffff', '#111111'], hp: 10, atk: 8, def: 3, agi: 10, xp: 6, gold: 5 },
  quillcrab: { name: 'Quill Crab', art: 'crab', pal: ['#2a1205', '#a3471a', '#e8742c', '#f7a76a', '#3b3b3b', '#ffffff', '#111111'], hp: 18, atk: 11, def: 9, agi: 3, xp: 9, gold: 8 },
  inkhound:  { name: 'Inkhound', art: 'hound', pal: ['#0b0b10', '#2b2d38', '#4a4d5e', '#7b7f94', '#e53935', '#ffffff', '#111111'], hp: 24, atk: 15, def: 8, agi: 10, xp: 14, gold: 12 },
  gloomcap:  { name: 'Gloomcap', art: 'shroom', pal: ['#1c0b24', '#5b2a6e', '#8e44ad', '#c39bd3', '#f7dc6f', '#ffffff', '#111111'], hp: 22, atk: 12, def: 9, agi: 4, xp: 12, gold: 10, cast: { name: 'Spore puff', power: 8, chance: 0.25, all: true } },
  hushwisp:  { name: 'Hush Wisp', art: 'wisp', pal: ['#0d2a2a', '#3a8f8f', '#7fd6d0', '#d4fbf7', '#1b4f72', '#ffffff', '#0d2a2a'], hp: 18, atk: 10, def: 12, agi: 9, xp: 13, gold: 11, drain: 0.3 },
  echobat:   { name: 'Echo Bat', art: 'bat', pal: ['#130a1c', '#3d2257', '#6c3d91', '#a57cc9', '#ffffff', '#ffffff', '#c0392b'], hp: 20, atk: 14, def: 7, agi: 14, xp: 15, gold: 12 },
  tomebiter: { name: 'Tome Biter', art: 'book', pal: ['#1f0a05', '#6e2c12', '#a0451f', '#cf7a4a', '#f4c542', '#fbf6e6', '#111111'], hp: 30, atk: 17, def: 10, agi: 6, xp: 20, gold: 18 },
  murkblot:  { name: 'Murk Blot', art: 'blot', pal: ['#07180c', '#1e5631', '#2e8b57', '#6fcf97', '#f4c542', '#ffffff', '#111111'], hp: 26, atk: 15, def: 9, agi: 5, xp: 17, gold: 14 },
  stoneglyph:{ name: 'Stone Glyph', art: 'golem', pal: ['#14161a', '#4b5058', '#7d838c', '#b3b8bf', '#4fc3f7', '#ffffff', '#4fc3f7'], hp: 44, atk: 20, def: 16, agi: 3, xp: 30, gold: 25 },
  lanternfly:{ name: 'Lanternfly', art: 'moth', pal: ['#241a02', '#a67c00', '#f1c40f', '#fcf3a0', '#e67e22', '#ffffff', '#111111'], hp: 26, atk: 16, def: 10, agi: 15, xp: 22, gold: 18, cast: { name: 'Glow burst', power: 11, chance: 0.3 } },
  erased:    { name: 'The Erased Knight', art: 'knight', boss: true, pal: ['#0e0e14', '#6d7380', '#b8bec9', '#eef1f5', '#5b2a6e', '#ffffff', '#ffffff'], hp: 300, atk: 25, def: 15, agi: 10, xp: 320, gold: 400,
    cast: { name: 'Erase', power: 14, chance: 0.3, all: true }, heavy: { name: 'Blank Strike', mult: 1.7, chance: 0.2 } },
};

/* ---------- Battles in each area: [monster, weight] and how many at once ---------- */
const SG_ZONES = {
  south: { list: [['blotling', 4], ['runerat', 3], ['typoimp', 2], ['papermoth', 2], ['quillcrab', 1]], max: 3 },
  north: { list: [['inkhound', 3], ['gloomcap', 3], ['hushwisp', 2], ['typoimp', 1], ['quillcrab', 1]], max: 3 },
  hollow1: { list: [['echobat', 3], ['tomebiter', 2], ['murkblot', 3], ['hushwisp', 1]], max: 3 },
  hollow2: { list: [['stoneglyph', 2], ['lanternfly', 3], ['tomebiter', 2], ['echobat', 2]], max: 3 },
};

/* ---------- Townspeople chatter ---------- */
const SG_CHAT = [
  'They say a knight with no face lives in the Hollow of Echoes. Brr!', 'The Inn is the best place to rest. Ten gold, and you wake up brand new.',
  'Answer fast in battle and you might land a critical hit!', 'Spells are harder: you have to spell the word yourself. But oh, they are strong.',
  'My grandmother forgot the word for “spoon” last week. Then the whole town did. Strange times.', 'Monsters in the forest attack more often. Stay on the road if you’re hurt.',
  'The Chronicle House writes down your journey so you can rest easy.', 'A Homeward feather will fly you back to town in a pinch.',
];

/* ---------- Maps ----------
   Field tiles: . plains  f forest  h hills  M mountain  W water  B bridge  P road  U town  V cave
   Town tiles:  # wall  K castle floor  L throne  R roof  H house  D door  S sign  F flowers  T tree
   Cave tiles:  X rock  C floor  c pebbles  r boulder  < way out  > stairs down */
const SG_WALK = new Set(['.', 'f', 'h', 'P', 'B', 'U', 'V', 'K', 'F', 'C', 'c', '<', '>', 'y']);
const SG_MAPS = {
  field: { name: 'Aldermere Plains', song: 'sg_field', rows: [
    'MMMMMMMMMMMMMMMMMMMMMMMM',
    'MMMMMffffMMMMMMMMffffMMM',
    'MMffffffffMMMMfffVfffMMM',
    'Mffff..fffffMMff.P.fffMM',
    'Mff.....ffffff...P..ffMM',
    'Mf....hh.......PPP...fMM',
    'M.....hhh.....P......fMM',
    'M..WWWWWWWWWWBWWWWWW..MM',
    'M..WWWWWWWWWWBWWWWWW...M',
    'M.......P....P.........M',
    'Mff.....P....P....ff...M',
    'Mfff....PPPPPP...ffff..M',
    'Mff.....P.........ff...M',
    'M.......P.......hh.....M',
    'M....PPPP......hhh..ff.M',
    'M....P..........h..fff.M',
    'M...PU.............ff..M',
    'M....................WWM',
    'MWWW.............WWWWWWM',
    'MMMMMMMMMMMMMMMMMMMMMMMM'],
    zone: (x, y) => y <= 6 ? 'north' : 'south',
    warps: { '5,16': { map: 'town', x: 9, y: 14, dir: 'up' }, '17,2': { map: 'hollow1', at: 'start' } } },
  town: { name: 'Quillhaven', song: 'sg_town', town: true, rows: [
    '####################',
    '#KKKKKKKKLKKKKKKKKK#',
    '#KKKKKKKKKKKKKKKKKK#',
    '#KKKKKKKKKKKKKKKKKK#',
    '#########KK#########',
    '#T.......PP.......T#',
    '#.RRRR...PP...RRRR.#',
    '#.HHDH...PP...HDHH.#',
    '#...P....PP.....P..#',
    '#...PPPPPPPPPPPPP..#',
    '#F......SPP.......F#',
    '#.RRRR...PP...RRRR.#',
    '#.HHDH...PP...HDHH.#',
    '#...P....PP.....P..#',
    '#F..PPPPPPPPPPPPP.F#',
    '#########PP#########'],
    exitTo: { map: 'field', x: 5, y: 17, dir: 'down' }, home: { x: 9, y: 9 },
    doors: { '4,7': 'inn', '15,7': 'shop', '4,12': 'smith', '15,12': 'chronicle' },
    signs: { '8,10': 'QUILLHAVEN, capital of Aldermere. Inn and item shop ahead, smithy and Chronicle House below.' },
    npcs: [
      { id: 'king', x: 9, y: 2, dir: 'down', look: 'king', king: true },
      { id: 'guardL', x: 8, y: 5, dir: 'down', look: 'guard', lines: ['Welcome to Castle Quillhaven. The King awaits brave souls.'] },
      { id: 'guardR', x: 11, y: 5, dir: 'down', look: 'guard', lines: ['Long live the King! And long live every word!'] },
      { id: 'tamsin', x: 12, y: 9, dir: 'left', look: 'scribe', join: 'scribe' },
      { id: 'tw1', x: 6, y: 13, dir: 'right', look: 'man', wander: 2, chat: true },
      { id: 'tw2', x: 14, y: 5, dir: 'down', look: 'lass', wander: 2, chat: true },
      { id: 'tw3', x: 3, y: 9, dir: 'right', look: 'kid', wander: 1, chat: true },
      { id: 'elder', x: 16, y: 13, dir: 'left', look: 'elder', lines: ['When I was young, the Hollow of Echoes sang.', 'Now it only whispers your words back to you… wrong.'] }] },
  hollow1: { name: 'Hollow of Echoes · 1F', song: 'sg_cave', theme: 'cave', zone: () => 'hollow1',
    gen: { w: 20, h: 18, seed: 2711, theme: 'cave', points: [[9, 15], [3, 11], [15, 9], [5, 5], [15, 2]], open: 0.6, grass: 0.5 },
    upTo: { map: 'field', x: 17, y: 3, dir: 'down' }, downTo: 'hollow2',
    objs: [{ id: 'h1c1', type: 'chest', at: 0.18, side: 1, give: { herb: 3 } }, { id: 'h1c2', type: 'chest', at: 0.42, side: -1, give: { gold: 60 } },
      { id: 'h1seal', type: 'seal', at: 1 }, { id: 'h1guard', type: 'foeSpot', at: 0.68, group: ['tomebiter', 'tomebiter'], lines: ['Two books snap their pages at you!'] },
      { id: 'lyra', type: 'npc', at: 0.76, look: 'cantor', join: 'cantor' }, { id: 'h1c3', type: 'chest', at: 0.88, side: 1, give: { gear: 'quill' } }] },
  hollow2: { name: 'Hollow of Echoes · 2F', song: 'sg_cave', theme: 'cave', zone: () => 'hollow2',
    gen: { w: 20, h: 20, seed: 6113, theme: 'cave', points: [[10, 17], [16, 12], [4, 10], [12, 5], [9, 2]], open: 0.6, grass: 0.5 },
    upTo: 'hollow1',
    objs: [{ id: 'h2c1', type: 'chest', at: 0.2, side: -1, give: { ether: 2 } }, { id: 'h2c2', type: 'chest', at: 0.35, side: 1, give: { gear: 'leather' } },
      { id: 'h2d1', type: 'lockChest', at: 0.5, side: 1, give: { bigherb: 2 } }, { id: 'h2c3', type: 'chest', at: 0.62, side: -1, give: { phoenix: 1 } },
      { id: 'h2d2', type: 'lockChest', at: 0.74, side: -1, give: { gear: 'willow' } }, { id: 'h2c4', type: 'chest', at: 0.82, side: 1, give: { gold: 150 } },
      { id: 'erased', type: 'boss', at: 0.93, group: ['erased'] }, { id: 'shard', type: 'chest', at: 1, give: { shard: 1 } }] },
};

/* ---------- Story text ---------- */
const SG_STORY = {
  intro: ['Long ago, the first words were written into the world itself.', 'They hold the rivers in their beds and the stars in the sky.',
    'But now a sorcerer called <b>the Unwriter</b> is erasing them, one by one.', 'In the Kingdom of Aldermere, a young knight is called to the castle…'],
  kingFirst: n => [`King Aldous: Ah, ${n}! Thank you for coming so quickly.`, 'The Unwriter has broken the great Lexicon into shards and hidden them across the land.',
    'The first shard lies in the <b>Hollow of Echoes</b>, north across the river.', 'A dark knight with no name guards it. No one who went in remembers their own name.',
    'Take this gold and these herbs. And find a companion. Tamsin the Scribe is waiting in the square.', '📜 You got <b>120 gold</b> and <b>3 Herbs</b>!'],
  kingAgain: ['King Aldous: The Hollow of Echoes is north across the river. Courage, knight!'],
  kingDone: n => [`King Aldous: ${n}… you brought back the first Lexicon Shard!`, 'Listen! The bells remember their sound. The river remembers its name.',
    'Seven more shards are hidden beyond the mountains. Rest now. Your saga has only begun.', '✨ <b>Part one complete!</b> More kingdoms are on the way.'],
  tamsin: { before: ['Tamsin: A knight! Have you seen the King yet? He’s looking for someone brave.'],
    join: n => ['Tamsin: The King sent you? Then I’m coming too!', 'I know every spell in the old books. Fire, frost… you’ll see.', `🪶 <b>Tamsin the Scribe</b> joined ${n}’s party!`] },
  lyra: { join: n => ['Lyra: Thank you! The books had me trapped in here for days.', 'I’m a Cantor. My songs can close wounds and steady shields.', `🎶 <b>Lyra the Cantor</b> joined the party!`] },
  bossIntro: ['A knight in pale armor blocks the way. Where his face should be, there is nothing at all.', 'The Erased Knight: …name… I had a name…', 'The Erased Knight: GIVE ME YOURS!'],
  bossWin: ['The pale armor cracks, and a voice comes back to it.', 'Sir Aldric: I… I remember. I am Aldric, knight of Aldermere. Thank you, friends.', 'Sir Aldric: The shard is just beyond. Take it home to the King.'],
  shard: ['💎 You found the <b>first Lexicon Shard</b>! It glows with a single word: <b>“Begin.”</b>', 'Take it back to King Aldous in Quillhaven.'],
};

/* ==================== PART TWO: the Kingdom of Seravel ====================
   The mountain pass east of the Aldermere Plains opens after the King's ending. Seravel is desert and sea:
   Mirage Well (a sage's word trial for the Tide Charm), Port Lumen (Queen Ysolde), the flooded Sunken Archive
   (boss: Inkmaw), and the Queen's ship, the Quill Swan, which sails to the Isle of Dawn. */
Object.assign(SG_SPELLS, {
  valor:     { name: 'Valor Strike', who: 'knight', lv: 10, mp: 7, kind: 'power', mult: 3.0, desc: 'A legendary swing: triple damage to one foe.' },
  tempest:   { name: 'Tempest', who: 'scribe', lv: 11, mp: 9, kind: 'all', power: 30, desc: 'A storm of wind and lightning on every foe.' },
  sanctuary: { name: 'Sanctuary', who: 'cantor', lv: 11, mp: 8, kind: 'heal', power: 120, desc: 'A great healing song for one ally.' },
});
Object.assign(SG_ITEMS, { inktonic: { name: 'Ink tonic', icon: '🫙', price: 120, mp: 30, desc: 'Restores 30 MP.' } });
Object.assign(SG_GEAR, {
  steel:    { name: 'Steel sword', slot: 'weapon', atk: 22, price: 700, for: ['knight'] },
  coral:    { name: 'Coral wand', slot: 'weapon', atk: 10, mag: 12, price: 620, for: ['scribe', 'cantor'] },
  silver:   { name: 'Silver mail', slot: 'armor', def: 18, price: 900, for: ['knight'] },
  tiderobe: { name: 'Tide robe', slot: 'armor', def: 13, mag: 4, price: 680, for: ['scribe', 'cantor'] },
  starwand: { name: 'Star wand', slot: 'weapon', atk: 12, mag: 18, for: ['scribe', 'cantor'] },
});
Object.assign(SG_MONSTERS, {
  dunebeetle: { name: 'Dune Beetle', art: 'beetle', pal: ['#1f1405', '#7a5214', '#c8892a', '#f0c070', '#2e86c1', '#ffffff', '#111111'], hp: 34, atk: 20, def: 14, agi: 8, xp: 28, gold: 22 },
  cactling:   { name: 'Cactling', art: 'cactus', pal: ['#0c2410', '#1e6b35', '#3fa34d', '#8fd694', '#ff8fb1', '#ffffff', '#111111'], hp: 30, atk: 19, def: 12, agi: 5, xp: 25, gold: 20, cast: { name: 'Needle rain', power: 10, chance: 0.3, all: true } },
  sandjackal: { name: 'Sand Jackal', art: 'hound', pal: ['#2a1a08', '#9a6b2f', '#d6a35a', '#f3d39a', '#c0392b', '#ffffff', '#111111'], hp: 36, atk: 23, def: 11, agi: 16, xp: 32, gold: 24 },
  miragewisp: { name: 'Mirage Wisp', art: 'wisp', pal: ['#3a2a05', '#c79a1a', '#f4d35e', '#fff3c4', '#7d3c98', '#ffffff', '#3a2a05'], hp: 28, atk: 16, def: 15, agi: 13, xp: 30, gold: 26, drain: 0.35 },
  dustimp:    { name: 'Dust Imp', art: 'imp', pal: ['#2a1d10', '#8a6a44', '#c4a173', '#ead3ae', '#e67e22', '#ffffff', '#111111'], hp: 30, atk: 20, def: 12, agi: 12, xp: 27, gold: 24, cast: { name: 'Sand spark', power: 13, chance: 0.3 } },
  scorpquill: { name: 'Scorpquill', art: 'crab', pal: ['#1a0a24', '#5b2a6e', '#9b59b6', '#d2b4de', '#f4c542', '#ffffff', '#111111'], hp: 44, atk: 24, def: 19, agi: 6, xp: 38, gold: 30 },
  gullwing:   { name: 'Gale Gull', art: 'bird', pal: ['#14202a', '#7f8c8d', '#ecf0f1', '#ffffff', '#f39c12', '#ffffff', '#111111'], hp: 32, atk: 22, def: 10, agi: 20, xp: 34, gold: 26 },
  inkeel:     { name: 'Ink Eel', art: 'serpent', pal: ['#050a18', '#1b2a6b', '#2e4fb0', '#7ea2f0', '#f4c542', '#ffffff', '#111111'], hp: 40, atk: 25, def: 13, agi: 14, xp: 40, gold: 30 },
  brineblot:  { name: 'Brine Blot', art: 'blot', pal: ['#04201f', '#117a74', '#1abc9c', '#a3f0dd', '#f4c542', '#ffffff', '#111111'], hp: 48, atk: 26, def: 16, agi: 8, xp: 46, gold: 34 },
  drownedpage:{ name: 'Drowned Page', art: 'book', pal: ['#051622', '#1b4f72', '#2e86c1', '#85c1e9', '#f4c542', '#eaf2f8', '#111111'], hp: 52, atk: 28, def: 18, agi: 10, xp: 52, gold: 40, cast: { name: 'Soggy verse', power: 14, chance: 0.3, all: true } },
  coralgolem: { name: 'Coral Golem', art: 'golem', pal: ['#2a0a12', '#a93246', '#e8687e', '#f8b4c0', '#f4c542', '#ffffff', '#f4c542'], hp: 80, atk: 32, def: 26, agi: 4, xp: 72, gold: 55 },
  inkmaw:     { name: 'Inkmaw, the Tide Serpent', art: 'serpent', boss: true, pal: ['#03060f', '#14215a', '#24479b', '#6f9ae8', '#e74c3c', '#ffffff', '#e74c3c'], hp: 950, atk: 38, def: 22, agi: 14, xp: 1000, gold: 1200,
    cast: { name: 'Ink Tide', power: 24, chance: 0.35, all: true }, heavy: { name: 'Maw Crush', mult: 1.8, chance: 0.2 } },
});
Object.assign(SG_ZONES, {
  sand: { list: [['dunebeetle', 3], ['cactling', 3], ['sandjackal', 3], ['miragewisp', 2], ['dustimp', 2], ['scorpquill', 1]], max: 3 },
  sea: { list: [['gullwing', 3], ['inkeel', 3], ['brineblot', 1]], max: 3 },
  archive1: { list: [['brineblot', 3], ['drownedpage', 3], ['inkeel', 2]], max: 3 },
  archive2: { list: [['coralgolem', 2], ['drownedpage', 3], ['brineblot', 2], ['inkeel', 2]], max: 3 },
});
SG_CHAT.push('In Seravel the sand sings at night. Or maybe that is the Cactlings.', 'Ink Tonics are pricey, but a Scribe with no MP is just a person with a book.');
['d', 'Q'].forEach(t => SG_WALK.add(t));
/* the mountain pass on the Aldermere Plains */
SG_MAPS.field.rows[5] = 'Mf....hh.......PPP...fYM';
SG_MAPS.field.warps['22,5'] = { map: 'seravel', x: 1, y: 3, dir: 'right', need: 'kingDone', block: ['Fallen rocks block the mountain pass.', 'Maybe the King knows when it will be cleared.'] };
SG_MAPS.town.shop = ['herb', 'bigherb', 'ether', 'feather', 'phoenix'];
SG_MAPS.town.smith = ['copper', 'iron', 'quill', 'willow', 'leather', 'chain', 'robe'];
SG_MAPS.town.inn = 10;
Object.assign(SG_MAPS, {
  seravel: { name: 'Seravel Sands', song: 'sg_desert', theme: 'desert', rows: [
    'MMMMMMMMMMMMMMMMMMMMWWWWWW',
    'MdddddkdddddddddMMMdWWWWWW',
    'MddkdddddddddkddddMdWWWWWW',
    'YdddddPPPPPPPdddddddWWWWWW',
    'MdddddPdddddPddkddddWWWWWW',
    'MddkddPddWWdPdddddPQWWWWWW',
    'MdddddPddWWdPdddddPWWWWWWW',
    'MdddddudddddPPPPPPPddWWWWW',
    'MdkdddddddddddddPddddWWWWW',
    'MddddddddkddddddPddddWWWWW',
    'MMddddddddddddddPddddWWWWW',
    'MMMddddkddddddddPdddWWWWWW',
    'MMMdddddddddddddPUdWWWWWWW',
    'MMddddddkdddddddddWWWWWWWW',
    'MddddddddddddddddWWWWWWWWW',
    'MddkdddddddddddVWWWWWWWWWW',
    'MddddddddddddddWWWWWddWWWW',
    'MddddddkdddddddWWWWdddZWWW',
    'MddddddddddddddWWWWWdddWWW',
    'MMddddddddddddWWWWWWWWWWWW',
    'MMMMMMMMMMMMMdWWWWWWWWWWWW',
    'MMMMMMMMMMMMMMWWWWWWWWWWWW'],
    zone: () => 'sand',
    warps: { '0,3': { map: 'field', x: 21, y: 5, dir: 'left' }, '6,7': { map: 'well', x: 7, y: 10, dir: 'up' }, '17,12': { map: 'port', x: 9, y: 14, dir: 'up' },
      '15,15': { map: 'archive1', at: 'start', need: 'tide', block: ['Seawater floods the old stairs down into the sand.', 'Something magic would be needed to hold the tide back.'] } } },
  well: { name: 'Mirage Well', song: 'sg_port', town: true, rows: [
    '################',
    '#d.RRR....RRR.d#',
    '#..HDH....HDH..#',
    '#...P......P...#',
    '#...PPPPPPPP...#',
    '#k.....WW.....k#',
    '#......WW......#',
    '#..RRRR...S....#',
    '#..HHDH..PP....#',
    '#....P..PP...T.#',
    '#....PPPPP.....#',
    '#######PP#######'],
    exitTo: { map: 'seravel', x: 6, y: 8, dir: 'down' }, home: { x: 7, y: 9 }, inn: 20,
    shop: ['herb', 'bigherb', 'ether', 'inktonic', 'feather', 'phoenix'],
    doors: { '4,2': 'inn', '11,2': 'shop', '5,8': 'sage' },
    signs: { '10,7': 'MIRAGE WELL. The oldest oasis in Seravel. Sage Orrin lives in the house by the well.' },
    npcs: [{ id: 'wl1', x: 3, y: 9, dir: 'right', look: 'man', wander: 1, chat: true }, { id: 'wl2', x: 12, y: 4, dir: 'left', look: 'lass', wander: 2, chat: true },
      { id: 'wl3', x: 12, y: 9, dir: 'left', look: 'kid', lines: ['The Sage gives tests. Hard ones. He made my dad spell “hippopotamus”.'] }] },
  port: { name: 'Port Lumen', song: 'sg_port', town: true, rows: SG_MAPS.town.rows.slice(),
    exitTo: { map: 'seravel', x: 17, y: 13, dir: 'down' }, home: { x: 9, y: 9 }, inn: 30,
    shop: ['bigherb', 'ether', 'inktonic', 'feather', 'phoenix'], smith: ['iron', 'steel', 'willow', 'coral', 'chain', 'silver', 'robe', 'tiderobe'],
    doors: { '4,7': 'inn', '15,7': 'shop', '4,12': 'smith', '15,12': 'chronicle' },
    signs: { '8,10': 'PORT LUMEN, jewel of Seravel. The royal dock is north of the city, past the old road.' },
    npcs: [
      { id: 'queen', x: 9, y: 2, dir: 'down', look: 'queen', queen: true },
      { id: 'pguardL', x: 8, y: 5, dir: 'down', look: 'guard', lines: ['The Queen has been waiting for a hero with a shard.'] },
      { id: 'pguardR', x: 11, y: 5, dir: 'down', look: 'guard', lines: ['The sea took our Archive. Now it takes our words, too.'] },
      { id: 'sailor', x: 12, y: 9, dir: 'left', look: 'sailor', lines: ['The Queen’s ship, the Quill Swan, sits at the royal dock north of here.', 'Only a true hero may sail her.'] },
      { id: 'pt1', x: 6, y: 13, dir: 'right', look: 'man', wander: 2, chat: true }, { id: 'pt2', x: 14, y: 5, dir: 'down', look: 'lass', wander: 2, chat: true },
      { id: 'pt3', x: 16, y: 13, dir: 'left', look: 'elder', lines: ['My grandfather read in the Sunken Archive before the water came.', 'He said the deepest room held a light that spelled one word.'] }] },
  archive1: { name: 'Sunken Archive · 1F', song: 'sg_archive', theme: 'archive', zone: () => 'archive1',
    gen: { w: 20, h: 18, seed: 4211, theme: 'cave', points: [[10, 15], [16, 11], [4, 9], [14, 5], [5, 2]], open: 0.55, grass: 0.5 },
    upTo: { map: 'seravel', x: 15, y: 14, dir: 'up' }, downTo: 'archive2',
    objs: [{ id: 'a1c1', type: 'chest', at: 0.15, give: { inktonic: 2 } }, { id: 'a1c2', type: 'chest', at: 0.32, give: { gold: 300 } },
      { id: 'a1l1', type: 'lockChest', at: 0.45, give: { gear: 'coral' } }, { id: 'a1guard', type: 'foeSpot', at: 0.6, group: ['coralgolem'], lines: ['A wall of coral stands up and blocks your way!'] },
      { id: 'a1c3', type: 'chest', at: 0.78, give: { bigherb: 3 } }, { id: 'a1seal', type: 'seal', at: 1 }] },
  archive2: { name: 'Sunken Archive · 2F', song: 'sg_archive', theme: 'archive', zone: () => 'archive2',
    gen: { w: 20, h: 20, seed: 7331, theme: 'cave', points: [[9, 17], [3, 12], [15, 10], [5, 5], [14, 2]], open: 0.55, grass: 0.5 },
    upTo: 'archive1',
    objs: [{ id: 'a2c1', type: 'chest', at: 0.15, give: { phoenix: 2 } }, { id: 'a2l1', type: 'lockChest', at: 0.3, give: { gear: 'tiderobe' } },
      { id: 'a2c2', type: 'chest', at: 0.45, give: { gold: 500 } }, { id: 'a2l2', type: 'lockChest', at: 0.62, give: { gear: 'silver' } },
      { id: 'a2c3', type: 'chest', at: 0.78, give: { inktonic: 2 } }, { id: 'inkmaw', type: 'boss', at: 0.93, group: ['inkmaw'], story: 'inkmaw' },
      { id: 'shard2', type: 'chest', at: 1, give: { shard: 2 }, guard: 'inkmaw', story: 'shard2' }] },
});
SG_MAPS.hollow2.objs.find(o => o.id === 'erased').story = 'erased';
Object.assign(SG_MAPS.hollow2.objs.find(o => o.id === 'shard'), { guard: 'erased', story: 'shard' });
Object.assign(SG_STORY, {
  kingDone: n => [`King Aldous: ${n}… you brought back the first Lexicon Shard!`, 'Listen! The bells remember their sound. The river remembers its name.',
    'My soldiers have cleared the <b>mountain pass</b> east of the plains. Beyond it lies the Kingdom of Seravel.', 'Queen Ysolde of Port Lumen will need your help. Seven shards remain!', '✨ <b>Part one complete!</b> The road to part two is open.'],
  kingAfter: ['King Aldous: The mountain pass east of the plains leads to Seravel. Good luck, hero!'],
  queenFirst: n => [`Queen Ysolde: A shard of the Lexicon… so you are ${n}, the hero from Aldermere.`, 'Our second shard sank with the great <b>Sunken Archive</b> when the sea rose.',
    'Its stairs lie under the tide, south of the city on the coast.', 'Only a <b>Tide Charm</b> can hold back the water. Old Sage Orrin of <b>Mirage Well</b> once made one.', 'Take this for the road. 💰 <b>300 gold</b>!'],
  queenAgain: ['Queen Ysolde: Sage Orrin lives at Mirage Well, in the northwest of the sands.'],
  queenCharm: ['Queen Ysolde: You have the Tide Charm! The Archive’s stairs are on the coast, south of the city.'],
  queenShip: n => [`Queen Ysolde: ${n}! The second shard! I can hear the gulls singing words again.`, 'You have earned this: my ship, the <b>Quill Swan</b>. ⛵',
    'She waits at the royal dock north of the city. Walk onto the dock, then sail onto the water.', 'They say a shrine of light sits on an island to the southeast. Perhaps it holds the next clue.'],
  queenAfter: ['Queen Ysolde: The Quill Swan is yours. The island shrine lies southeast across the water.'],
  sageNo: ['Sage Orrin: Hmm? A Tide Charm? Who sent you? Come back when the Queen of Seravel has spoken with you.'],
  sageTrial: ['Sage Orrin: The Queen sent you for a Tide Charm, eh?', 'Very well. The sea only listens to true words.', 'Spell three words for me. Get two right, and the charm is yours.'],
  sageWin: ['Sage Orrin: Well spelled! The sea will listen to you.', '🌊 You got the <b>Tide Charm</b>! It can hold back the water over the Sunken Archive.'],
  sageLose: ['Sage Orrin: Not yet, not yet. Study a little, rest a little, and try again.'],
  sageAfter: ['Sage Orrin: The Tide Charm only works on the coast stairs south of Port Lumen. Mind the eels!'],
  inkmaw: ['The water in the deepest room begins to swirl.', 'A huge serpent made of ink rises, words drifting inside it like fish.', 'Inkmaw: SSSO MANY WORDSSS… I WILL SSSWALLOW THEM ALL!'],
  inkmawWin: ['Inkmaw bursts into a shower of letters that float back onto the old pages.', 'The Archive is quiet. Somewhere, a book closes gently.'],
  erased: SG_STORY.bossIntro, erasedWin: SG_STORY.bossWin,
  shard2: ['💎 You found the <b>second Lexicon Shard</b>! It glows with a single word: <b>“Remember.”</b>', 'Take it to Queen Ysolde in Port Lumen.'],
  oracle: n => ['Inside the shrine, a figure made of light turns toward you.', `The Oracle: Welcome, ${n}, and friends. You have carried two shards across two kingdoms.`,
    'The Unwriter hides in the <b>Tower of Silence</b>, far beyond the eastern sea.', 'Six shards remain. Take this wand of starlight. It will help your spells shine.',
    '✨ You got the <b>Star wand</b> and <b>1000 gold</b>!', '🌅 <b>Part two complete!</b> The eastern sea awaits.'],
  oracleAfter: ['The Oracle: The eastern sea is wide. Rest often, study often.'],
});
