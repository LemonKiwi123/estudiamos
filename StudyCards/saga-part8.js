'use strict';
/* ================= Lexicon Saga: the big adventure update (all original) =================
   1. Wandering priests on the roads far from any shrine
   2. Banks in every town: keep your gold safe (you don't lose it when the party falls) and earn interest
   3. Swapping companions: asked when someone new wants to join, and at every shrine
   4. The airship (about two thirds into the story): fly anywhere, land anywhere, fewer battles, flying foes
   5. Spoken spells: healing and protecting spells are cast by SAYING the word (attack spells are typed)
   6. Camp: set up camp anywhere on the map, talk with your companions, hear their stories, rest, swap, music
   7. Ghost ships at sea, abandoned temples with the Hero's gear behind puzzles, graveyards
   8. The underwater kingdom (dive into the whirlpool) and its mini-boss
   9. Three more companions: Fen the Druid, Ilka the Alchemist and Dax the Sky Lancer
   Loaded after saga-part7.js and before saga.js (saga.js calls the sgXxxMore hooks). */

/* ---------- new tiles ---------- */
// % campfire  ^ tent  + grave  | iron fence  ~ ship deck  [ ship rail  i mast  $ sea floor  * coral  } kelp  & temple door  ! sealed gate  j pillar  r rubble
['~', '$', '}'].forEach(t => SG_WALK.add(t));
function sgTileMore(ch, theme, g, R, t) {
  const ground = () => (['cave', 'ruins', 'ember', 'tower', 'ice', 'crag', 'blight', 'mire', 'canyon', 'castle'].includes(theme) ? t.caveFloor() : theme === 'deep' ? seabed() : t.base());
  const seabed = () => { R(0, 0, 16, 16, '#2a5a7a'); R(3, 4, 3, 1, '#3a7a9a'); R(10, 11, 3, 1, '#3a7a9a'); R(12, 3, 1, 1, '#8fd0e8'); R(5, 13, 1, 1, '#8fd0e8'); };
  switch (ch) {
    case '%': t.base(); R(3, 11, 10, 3, '#5e3a1a'); R(2, 12, 12, 1, '#3a2010'); R(5, 4, 6, 8, '#ff7a1a'); R(6, 2, 4, 6, '#f4c542'); R(7, 1, 2, 3, '#fff3a0'); R(4, 9, 8, 2, '#c0392b'); return true;
    case '^': t.base(); g.fillStyle = '#c8955a'; g.beginPath(); g.moveTo(1, 15); g.lineTo(8, 1); g.lineTo(15, 15); g.fill(); g.fillStyle = '#8b5a2b'; g.beginPath(); g.moveTo(8, 1); g.lineTo(15, 15); g.lineTo(8, 15); g.fill(); R(6, 9, 4, 6, '#2a1a10'); return true;
    case '+': ground(); R(4, 3, 8, 12, '#8a8a96'); R(5, 2, 6, 1, '#8a8a96'); R(4, 14, 8, 1, '#5a5a66'); R(7, 5, 2, 7, '#5a5a66'); R(5, 7, 6, 2, '#5a5a66'); R(11, 3, 1, 12, '#6a6a76'); return true;
    case '|': ground(); R(0, 4, 16, 2, '#2a2a34'); R(0, 11, 16, 2, '#2a2a34'); for (let x = 1; x < 16; x += 4) { R(x, 1, 2, 15, '#3a3a46'); R(x, 0, 2, 1, '#8a8a96'); } return true;
    case '~': R(0, 0, 16, 16, '#2f3f3f'); for (let y = 3; y < 16; y += 4) R(0, y, 16, 1, '#1f2a2a'); R(5, 0, 1, 3, '#1f2a2a'); R(11, 4, 1, 3, '#1f2a2a'); R(2, 9, 2, 1, '#5f8f8a'); return true;
    case '[': R(0, 0, 16, 16, '#1a2424'); R(0, 0, 16, 3, '#4a5a56'); R(0, 13, 16, 3, '#0f1616'); for (let x = 2; x < 16; x += 5) R(x, 3, 2, 10, '#2f3f3f'); return true;
    case 'i': R(0, 0, 16, 16, '#2f3f3f'); R(6, 0, 4, 16, '#3a2a1a'); R(7, 0, 1, 16, '#5e4a2a'); R(1, 4, 14, 2, '#3a2a1a'); R(2, 6, 12, 6, 'rgba(200,230,220,.35)'); return true;
    case '$': seabed(); return true;
    case '*': R(0, 0, 16, 16, '#1a3a5a'); R(2, 8, 3, 8, '#ff6f91'); R(1, 6, 2, 3, '#ff6f91'); R(4, 5, 2, 4, '#ff6f91'); R(9, 4, 3, 12, '#f39c12'); R(8, 2, 2, 3, '#f39c12'); R(12, 3, 2, 4, '#f39c12'); R(13, 10, 2, 6, '#c39bd3'); return true;
    case '}': seabed(); for (const x of [3, 8, 12]) { R(x, 2, 2, 14, '#2e8b57'); R(x - 1, 5, 1, 3, '#3cb371'); R(x + 2, 9, 1, 3, '#3cb371'); } return true;
    case '&': t.base(); R(1, 2, 14, 14, '#7a7466'); R(1, 2, 14, 2, '#5a5448'); R(4, 6, 8, 10, '#14101c'); R(5, 5, 6, 1, '#14101c'); R(2, 10, 2, 3, '#3f6f3a'); R(12, 4, 2, 2, '#3f6f3a'); R(7, 3, 2, 2, '#f4c542'); return true;
    case '!': R(0, 0, 16, 16, '#4a4458'); R(0, 0, 16, 2, '#2a2434'); R(2, 2, 12, 14, '#5a5268'); R(5, 5, 6, 6, '#14101c'); R(7, 6, 2, 4, '#7fdbff'); R(6, 7, 4, 1, '#7fdbff'); return true;
    case 'j': ground(); R(4, 4, 8, 12, '#8a8478'); R(4, 4, 8, 2, '#a8a294'); R(11, 6, 1, 10, '#6a6458'); R(5, 1, 3, 3, '#8a8478'); R(9, 2, 2, 2, '#8a8478'); return true;
    case 'r': ground(); R(2, 9, 5, 5, '#7a7466'); R(8, 11, 6, 4, '#6a6458'); R(9, 6, 3, 3, '#8a8478'); R(3, 9, 5, 1, '#9a9488'); return true;
  }
  return false;
}
Object.assign(SG_LOOKS_MORE, {
  pilgrim:  { A: { hair: 'short', shirt: 1, body: 'coat' }, colors: { 0: '#e8b48a', 1: '#8a7a5a', 2: '#d4ac0d', 3: '#3a2a1a' } },
  banker:   { A: { hair: 'bald', beard: 1, shirt: 2, body: 'coat' }, colors: { 0: '#f2c29a', 1: '#f6f6f0', 2: '#1e5a3a', 3: '#2a2030' } },
  merfolk:  { A: { hair: 'long', shirt: 1, body: 'dress' }, colors: { 0: '#9fd8d0', 1: '#2e86c1', 2: '#1abc9c', 3: '#0e4a6a' } },
  merguard: { A: { hair: 'peaked', capC: 1, shirt: 2, pants: 3, badge: 1 }, colors: { 0: '#9fd8d0', 1: '#f4c542', 2: '#1a6b8a', 3: '#0a2a3a' } },
  merking:  { A: { hair: 'long', beard: 1, shirt: 2, body: 'coat', cape: 1 }, colors: { 0: '#9fd8d0', 1: '#f4c542', 2: '#16a085', 3: '#e8f8ff' }, crown: true },
  ghost:    { A: { hair: 'long', shirt: 1, body: 'dress' }, colors: { 0: '#e8f0f8', 1: '#c8d8e8', 2: '#a8b8c8', 3: '#e8f0f8' } },
  keeper:   { A: { hair: 'bald', beard: 1, shirt: 2, pants: 3 }, colors: { 0: '#d8b08a', 1: '#4a4a4a', 2: '#2a2a2a', 3: '#e5e5e5' } },
});

/* ---------- new monsters ---------- */
Object.assign(SG_MONSTERS, {
  // graveyards (the early one, then the late ones)
  zombie:    sgM('Shuffling Zombie', 'golem', ['#0a1405', '#3a5a2a', '#6b8a4a', '#a8c48a', '#c0392b', '#ffffff', '#111111'], 42, 16, 8, 4, 30, 18),
  gravewisp: sgM('Graveyard Ghost', 'wisp', ['#0a0f1a', '#8fa3b8', '#c8d8e8', '#f5f8fc', '#7fdbff', '#ffffff', '#111111'], 30, 18, 6, 14, 32, 20),
  skelly:    sgM('Rattling Skeleton', 'knight', ['#0a0a0a', '#8a8478', '#c8c0b0', '#f0ebe0', '#c0392b', '#ffffff', '#111111'], 46, 18, 12, 8, 36, 22),
  ghoul:     sgM('Grave Ghoul', 'golem', ['#050a05', '#2a3a1a', '#4a6b2f', '#8fae6a', '#7fff7f', '#ffffff', '#111111'], 230, 72, 50, 10, 380, 175),
  banshee:   sgM('Wailing Banshee', 'sorcerer', ['#05050a', '#6a7a9a', '#a8b8d8', '#eef4ff', '#7fdbff', '#ffffff', '#111111'], 170, 70, 40, 26, 360, 170),
  boneknight:sgM('Bone Knight', 'knight', ['#050505', '#6a6458', '#a8a294', '#e8e2d4', '#7fff7f', '#ffffff', '#7fff7f'], 260, 76, 58, 14, 410, 190),
  // ghost ships
  drowned:   sgM('Drowned Sailor', 'golem', ['#05100f', '#1f4a4a', '#3a7a72', '#8fc8c0', '#7fdbff', '#ffffff', '#111111'], 110, 48, 26, 12, 160, 90),
  seaspecter:sgM('Sea Specter', 'wisp', ['#05100f', '#4a8a8a', '#8fd0c8', '#e8fffa', '#7fdbff', '#ffffff', '#111111'], 90, 50, 22, 26, 160, 90),
  bonepirate:sgM('Bone Pirate', 'knight', ['#050505', '#5a4a3a', '#a8946a', '#e8dcc0', '#c0392b', '#ffffff', '#c0392b'], 130, 52, 32, 16, 180, 110),
  grimwake:  sgM('Captain Grimwake', 'sorcerer', ['#05100f', '#1a3a3a', '#2f6b64', '#8fd0c8', '#f4c542', '#ffffff', '#c0392b'], 420, 58, 34, 20, 700, 450),
  // under the sea
  reeflurker:sgM('Reef Lurker', 'crab', ['#140505', '#8a2a4a', '#d8547a', '#ffb0c8', '#f4c542', '#ffffff', '#111111'], 130, 50, 40, 8, 180, 95),
  glowjelly: sgM('Glow Jelly', 'wisp', ['#05051a', '#5a3a9a', '#a87af0', '#f0e0ff', '#7fdbff', '#ffffff', '#111111'], 100, 48, 24, 22, 170, 90),
  abysseel:  sgM('Abyss Eel', 'serpent', ['#05050f', '#1a2a5a', '#2f4a9a', '#8fa8e8', '#f4c542', '#ffffff', '#111111'], 140, 56, 30, 20, 190, 100),
  leviathan: sgM('The Abyssal Leviathan', 'serpent', ['#02040a', '#0a1a4a', '#1a3a8a', '#4f8ae8', '#e74c3c', '#ffffff', '#7fdbff'], 1800, 58, 36, 18, 2400, 1500, { boss: true }),
});
Object.assign(SG_ZONES, {
  grave1: { list: [['zombie', 3], ['gravewisp', 3], ['skelly', 2]], max: 3 },
  grave2: { list: [['ghoul', 3], ['banshee', 3], ['boneknight', 2]], max: 4 },
  ghostship: { list: [['drowned', 3], ['seaspecter', 3], ['bonepirate', 2]], max: 4 },
  abyss: { list: [['reeflurker', 3], ['glowjelly', 3], ['abysseel', 3]], max: 4 },
  // the sky: anything with wings (or that floats)
  sky: { list: Object.entries(SG_MONSTERS).filter(([, m]) => ['bird', 'bat', 'moth', 'wisp'].includes(m.art) && !m.boss && !m.final && m.hp >= 60).map(([k]) => [k, 1]), max: 3 },
});
const SG_ZONE_STAGE_MORE = { grave1: 1, grave2: 13, ghostship: 8, abyss: 9, sky: 12 };   // merged into SG_ZONE_STAGE by saga.js

/* ---------- three more companions ---------- */
Object.assign(SG_HEROES, {
  druid:     { cls: 'Druid', icon: '🌿', hp: [25, 7], mp: [8, 3.4], atk: [6, 2.2], def: [4, 1.8], agi: [7, 2], mag: [7, 2.8],
    look: { hair: 'long', shirt: 1, body: 'coat' }, colors: { 0: '#d9a173', 1: '#5a3a1a', 2: '#2e7d32', 3: '#1b3a10' } },
  alchemist: { cls: 'Alchemist', icon: '⚗️', hp: [23, 6.5], mp: [9, 3.6], atk: [6, 2], def: [4, 1.6], agi: [8, 2.2], mag: [8, 3],
    look: { hair: 'short', shirt: 1, body: 'coat', glasses: 1 }, colors: { 0: '#f2c29a', 1: '#e8e8e0', 2: '#8e44ad', 3: '#4a2a0a' } },
  lancer:    { cls: 'Sky Lancer', icon: '🔱', hp: [30, 8.8], mp: [5, 2], atk: [10, 3.3], def: [6, 2.2], agi: [9, 2.4], mag: [3, 1],
    look: { hair: 'peaked', capC: 1, shirt: 2, pants: 3, scarf: 1 }, colors: { 0: '#c98a5a', 1: '#2e86c1', 2: '#f4f4f8', 3: '#1a2a4a' } },
});
Object.assign(SG_NAMES, { druid: 'Fen', alchemist: 'Ilka', lancer: 'Dax' });
Object.assign(SG_SPELLS, {
  thorn:   { name: 'Thorn Lash', who: 'druid', lv: 1, mp: 2, kind: 'hit', power: 11, fx: 'slash', desc: 'Whipping thorns on one foe.' },
  bloom:   { name: 'Bloom', who: 'druid', lv: 3, mp: 3, kind: 'heal', power: 28, fx: 'heal', desc: 'Heals one friend with flowers and green light.' },
  renew:   { name: 'Renewal', who: 'druid', lv: 8, mp: 7, kind: 'healAll', power: 30, fx: 'heal', desc: 'Heals the whole party.' },
  quake:   { name: 'Earthshake', who: 'druid', lv: 12, mp: 8, kind: 'all', power: 30, fx: 'wave', desc: 'The ground heaves under every foe.' },
  bomb:    { name: 'Fire Flask', who: 'alchemist', lv: 1, mp: 2, kind: 'hit', power: 12, fx: 'fire', desc: 'A popping flask of fire on one foe.' },
  tonic:   { name: 'Clearing Tonic', who: 'alchemist', lv: 4, mp: 4, kind: 'cureAll', fx: 'heal', desc: 'Cures the whole party of poison and curses.' },
  acid:    { name: 'Acid Rain', who: 'alchemist', lv: 8, mp: 6, kind: 'all', power: 24, fx: 'wave', desc: 'Stinging drops on every foe.' },
  elixir:  { name: 'Grand Elixir', who: 'alchemist', lv: 14, mp: 10, kind: 'healAll', power: 45, fx: 'heal', desc: 'A big heal for the whole party.' },
  dive:    { name: 'Diving Lance', who: 'lancer', lv: 1, mp: 2, kind: 'power', mult: 1.9, fx: 'slash', desc: 'A leap and a strike on one foe.' },
  gale:    { name: 'Gale Sweep', who: 'lancer', lv: 6, mp: 5, kind: 'allatk', mult: 1.0, fx: 'wave', desc: 'A spinning sweep that hits every foe.' },
  skyfall: { name: 'Skyfall', who: 'lancer', lv: 12, mp: 8, kind: 'power', mult: 3.0, fx: 'bolt', desc: 'Drops from the sky like lightning on one foe.' },
});
// the new companions can use the gear their kind of fighter uses
for (const gd of Object.values(SG_GEAR)) {
  if (gd.for.includes('scribe')) gd.for.push('druid', 'alchemist');
  if (gd.for.includes('knight')) gd.for.push('lancer');
}
Object.assign(SG_GEAR, {
  heroblade: { name: 'Hero’s Blade', slot: 'weapon', atk: 56, mag: 6, for: ['knight', 'paladin', 'lancer', 'ranger', 'rogue', 'monk'] },
  heromail:  { name: 'Hero’s Armor', slot: 'armor', def: 46, mag: 6, for: Object.keys(SG_HEROES) },
  herostaff: { name: 'Hero’s Staff', slot: 'weapon', atk: 24, mag: 40, for: ['scribe', 'cantor', 'druid', 'alchemist', 'monk', 'paladin'] },
  tidetrident: { name: 'Tidecaller Trident', slot: 'weapon', atk: 42, mag: 10, for: ['knight', 'paladin', 'lancer', 'monk'] },
});
Object.assign(SG_START_GEAR, {
  druid: [['quill', 'leather'], ['willow', 'robe'], ['runestaff', 'starrobe']], alchemist: [['quill', 'leather'], ['willow', 'robe'], ['runestaff', 'starrobe']],
  lancer: [['copper', 'leather'], ['steel', 'silver'], ['mythril', 'mythmail']],
});
// where to find them: Fen in the Thornvale tavern, Ilka in the Redrock tavern (Dax comes with the airship)
for (const [town, key, cost] of [['thornvale', 'druid', 900], ['redrock', 'alchemist', 1100], ['briar', 'druid', 900]]) {
  const tav = SG_MAPS[town + '_tav']; if (!tav || SG_MAPS.thornvale_tav && town === 'briar') continue;
  const busy = new Set(tav.npcs.map(n => n.x + ',' + n.y)), spot = [[7, 4], [2, 6], [8, 6], [6, 4], [4, 6]].find(([x, y]) => !busy.has(x + ',' + y) && SG_WALK.has(tav.rows[y][x]));
  if (spot) tav.npcs.push({ id: 'hire_' + key, x: spot[0], y: spot[1], dir: 'left', look: key, hire: key, cost });
}

/* ---------- music ---------- */
Object.assign(TRM_SONGS, {
  sg_sky: { bpm: 132, wave: 'thin', vol: 0.85, drums: ['k . h . s . h .'],
    lead: ['C5 - F5 - A5 - C6 -', 'Bb5 - A5 - G5 - F5 -', 'D5 - G5 - Bb5 - D6 -', 'C6 - - - A5 - . .', 'F5 - A5 - C6 - F6 -', 'E6 - D6 - C6 - Bb5 -', 'A5 - G5 - F5 - E5 -', 'F5 - - - - - . .'],
    bass: ['F2 - C3 - F3 - C3 -', 'Bb2 - F3 - C3 - A2 -', 'G2 - D3 - G3 - D3 -', 'C3 - G3 - C3 - E3 -', 'F2 - C3 - A2 - C3 -', 'C3 - G3 - Bb2 - F3 -', 'Bb2 - F3 - C3 - G3 -', 'F2 - C3 - F2 - . .'] },
  sg_camp: { bpm: 80, wave: 'triangle', vol: 0.9, drums: ['. . . . . . . .'],
    lead: ['D5 - - B4 - - G4 -', 'A4 - B4 - D5 - - -', 'E5 - - D5 - - B4 -', 'A4 - - - - - . .', 'G4 - B4 - D5 - E5 -', 'D5 - B4 - A4 - G4 -', 'A4 - - B4 - - A4 -', 'G4 - - - - - . .'],
    bass: ['G2 - - - D3 - - -', 'D3 - - - G2 - - -', 'C3 - - - G2 - - -', 'D3 - - - - - . .', 'G2 - - - C3 - - -', 'G2 - - - D3 - - -', 'D3 - - - D3 - - -', 'G2 - - - - - . .'] },
  sg_coral: { bpm: 92, wave: 'triangle', vol: 0.9, drums: ['k . . h . . h .'],
    lead: ['E5 - G5 - B5 - A5 -', 'F#5 - - - D5 - . .', 'E5 - G5 - C#6 - B5 -', 'A5 - - - - - . .', 'G5 - F#5 - E5 - D5 -', 'C#5 - D5 - E5 - F#5 -', 'G5 - - F#5 - - D5 -', 'E5 - - - - - . .'],
    harm: ['B4 - B4 - E5 - E5 -', 'D5 - - - A4 - . .', 'C#5 - E5 - E5 - E5 -', 'E5 - - - - - . .', 'B4 - A4 - G4 - F#4 -', 'A4 - A4 - B4 - D5 -', 'B4 - - A4 - - A4 -', 'G4 - - - - - . .'],
    bass: ['E3 - B3 - E3 - B3 -', 'D3 - A3 - D3 - A3 -', 'A2 - E3 - A2 - E3 -', 'A2 - E3 - C#3 - E3 -', 'E3 - B3 - E3 - B3 -', 'A2 - E3 - A2 - E3 -', 'C3 - G3 - D3 - A3 -', 'E3 - B3 - E3 - . .'] },
  sg_ghost: { bpm: 88, wave: 'square', vol: 0.7, drums: ['k . . s . . h .'],
    lead: ['A4 - C5 - E5 - D#5 -', 'E5 - - - - - . .', 'F5 - E5 - D#5 - E5 -', 'B4 - - - - - . .', 'A4 - C5 - E5 - A5 -', 'G#5 - - - E5 - . .', 'F5 - E5 - D5 - B4 -', 'A4 - - - - - . .'],
    bass: ['A2 - - - E3 - - -', 'A2 - - - E3 - - -', 'D3 - - - A3 - - -', 'E2 - - - B2 - - -', 'A2 - - - E3 - - -', 'E2 - - - G#2 - - -', 'D3 - - - E3 - - -', 'A2 - - - - - . .'] },
  sg_battle_sky: { from: 'sg_battle_cold', shift: 3, bpm: 176 },
  // camp songs your companions play
  sg_lute: { bpm: 120, once: true, wave: 'triangle', vol: 0.9, drums: ['. . . . . . . .'],
    lead: ['G4 B4 D5 G5 D5 B4 G4 -', 'C5 E5 G5 E5 D5 - G4 -', 'A4 C5 E5 D5 B4 - G4 -', 'G4 - - - - - . .'], bass: ['G2 - D3 - G2 - D3 -', 'C3 - G3 - G2 - D3 -', 'D3 - A3 - G2 - D3 -', 'G2 - - - - - . .'] },
  sg_flute: { bpm: 100, once: true, wave: 'thin', vol: 0.85, drums: ['. . . . . . . .'],
    lead: ['E5 - G5 A5 - G5 E5 -', 'D5 - E5 - G5 - - -', 'A5 - G5 E5 - D5 C5 -', 'D5 - - - - - . .'], bass: ['C3 - - - G2 - - -', 'G2 - - - E2 - - -', 'A2 - - - F2 - - -', 'G2 - - - - - . .'] },
  sg_pipes: { bpm: 132, once: true, wave: 'square', vol: 0.7, drums: ['k . h . k . h .'],
    lead: ['D5 E5 F#5 A5 - F#5 E5 D5', 'B4 - D5 - A4 - - -', 'D5 E5 F#5 A5 - B5 A5 F#5', 'E5 - - - D5 - . .'], bass: ['D3 - A2 - D3 - A2 -', 'G2 - D3 - A2 - E3 -', 'D3 - A2 - G2 - D3 -', 'A2 - E3 - D3 - . .'] },
  sg_drum: { bpm: 112, once: true, wave: 'triangle', vol: 0.8, drums: ['k . k s . k s .', 'k k . s k . s s'],
    lead: ['A4 - - C5 - - A4 -', 'G4 - - E4 - - . .', 'A4 - - C5 - D5 E5 -', 'A4 - - - - - . .'], bass: ['A2 - - - A2 - - -', 'G2 - - - E2 - - -', 'A2 - - - C3 - - -', 'A2 - - - - - . .'] },
});
Object.assign(SG_MAP_SONGS, { camp: 'sg_camp', ghostship: 'sg_ghost', coral: 'sg_coral', abyss: 'sg_barrow', temple_n: 'sg_temple', temple_s: 'sg_temple', temple_c: 'sg_temple' });
SG_DEEP_SONGS.add('sg_ghost');
{ const base = sgBattleSongFor;
  sgBattleSongFor = (bt, s) => bt?.final || bt?.boss ? base(bt, s) : s?.fly ? 'sg_battle_sky' : ['coral', 'abyss', 'ghostship'].includes(s?.map) ? 'sg_battle_sea' : s && sgGraveAt(s.map, s.x, s.y) ? 'sg_battle_deep' : base(bt, s); }

/* ---------- helpers ---------- */
const SG_GRID5 = (r, c) => SG_WORLD.length >= 5 ? SG_WORLD[r]?.[c] || null : r >= 1 && r <= 3 && c >= 1 && c <= 3 ? SG_WORLD[r - 1][c - 1] : (SG_MAPS[`sea_${r}_${c}`] ? `sea_${r}_${c}` : null);
function sgGridPos(map) { for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (SG_GRID5(r, c) === map) return [r, c]; return null; }
const sgOverworld = map => !!sgGridPos(map);
const sgLand = map => SG_WORLD.flat().includes(map) && !String(map).startsWith('sea_');
/* a clear w × h patch of open ground (and a ring around it) near a point of the map, away from doors, warps and people */
function sgOpenArea(map, fx, fy, w, h, open = '.dhf', ring = '.dhfP', gate = null) {
  const m = SG_MAPS[map]; if (!m) return null;
  const H = m.rows.length, W = m.rows[0].length, tx = Math.round(fx * (W - 1)), ty = Math.round(fy * (H - 1));
  const busy = new Set([...(m.npcs || []), ...(m.objs || [])].filter(o => o.x != null).map(o => `${o.x},${o.y}`));
  const near = [...Object.keys(m.warps || {}), ...Object.keys(m.doors || {})].map(k => k.split(',').map(Number)).filter(([wx, wy]) => wx > 0 && wy > 0 && wx < W - 1 && wy < H - 1);   // (not the map-edge links)
  let best = null, bd = 1e9;
  for (let y = 1; y + h < H - 1; y++) for (let x = 1; x + w < W - 1; x++) {
    let ok = true;
    for (let dy = -1; dy <= h && ok; dy++) for (let dx = -1; dx <= w; dx++) { const c = m.rows[y + dy][x + dx], edge = dy < 0 || dx < 0 || dy === h || dx === w; if (!(edge ? ring : open).includes(c) || busy.has(`${x + dx},${y + dy}`)) { ok = false; break; } }
    if (!ok || near.some(([wx, wy]) => wx >= x - 2 && wx <= x + w + 1 && wy >= y - 2 && wy <= y + h + 1)) continue;
    if (gate && !gate.every(dx => '.dhfP'.includes(m.rows[y + h][x + dx]))) continue;   // the way out must lead onto ground
    const d = Math.hypot(x + w / 2 - tx, y + h / 2 - ty); if (d < bd) { bd = d; best = [x, y]; }
  }
  return best;
}
const sgStamp = (map, x, y, lines) => lines.forEach((ln, dy) => [...ln].forEach((ch, dx) => { if (ch !== ' ') sgRowsSet(map, x + dx, y + dy, ch); }));

/* ================= 1. Wandering priests where there are no shrines ================= */
(() => {
  const shrines = [];
  SG_WORLD.forEach((row, r) => row.forEach((id, c) => { const m = SG_MAPS[id], W = m.rows[0].length, H = m.rows.length;
    m.rows.forEach((ln, y) => [...ln].forEach((ch, x) => { if (ch === 'z') shrines.push([c * 28 + x * 28 / W, r * 22 + y * 22 / H]); })); }));
  const names = ['Pilgrim Anselm', 'Sister Hollis', 'Brother Tobin', 'Mother Wenna', 'Father Ivo', 'Sister Petra', 'Brother Osk', 'Pilgrim Mireille', 'Father Dunstan'];
  let i = 0;
  SG_WORLD.forEach((row, r) => row.forEach((id, c) => {
    const m = SG_MAPS[id], W = m.rows[0].length, H = m.rows.length;
    let best = null, bd = 0;
    for (const fy of [0.2, 0.35, 0.5, 0.65, 0.8]) for (const fx of [0.2, 0.35, 0.5, 0.65, 0.8]) {
      const at = sgOpenArea(id, fx, fy, 1, 1, '.dh', '.dhf'); if (!at) continue;
      const gx = c * 28 + at[0] * 28 / W, gy = r * 22 + at[1] * 22 / H, d = Math.min(...shrines.map(([sx, sy]) => Math.hypot(sx - gx, sy - gy)));
      if (d > bd) { bd = d; best = at; }
    }
    if (best && bd >= 9) m.npcs.push({ id: 'wpriest', x: best[0], y: best[1], dir: 'down', look: 'pilgrim', priest: true, name: names[i++ % names.length], roadPriest: true });
  }));
})();
SG_CHAT.push('There are no shrines in the wild parts of the land, but pilgrim priests walk those roads. They can wake the fallen.');

/* ================= 2. Banks ================= */
const SG_BANK_ROWS = ['############', '#v___vv___v#', '#====__====#', '#__________#', '#_t______t_#', '#__________#', '#__________#', '#__________#', '#####__#####'];
function sgBuildingPlace(town, top, front, dd) {
  const m = SG_MAPS[town], H = m.rows.length, W = m.rows[0].length, w = top.length;
  const walk = (rows, x, y) => SG_WALK.has((rows[y] || '')[x]);
  const reach = rows => { const seen = new Set(), q = [];
    for (let x = 0; x < W; x++) if (walk(rows, x, H - 1)) { seen.add(x + ',' + (H - 1)); q.push([x, H - 1]); }
    while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && walk(rows, nx, ny)) { seen.add(k); q.push([nx, ny]); } } }
    return seen; };
  const needs = [...Object.keys(m.doors || {}).map(k => { const [x, y] = k.split(',').map(Number); return `${x},${y + 1}`; }), ...m.npcs.map(n => `${n.x},${n.y}`), ...Object.keys(m.warps || {})];
  const before = reach(m.rows), must = needs.filter(k => before.has(k)), people = new Set(m.npcs.map(n => `${n.x},${n.y}`));
  for (const ok of ['.', '.TFf']) for (let y = H - 4; y >= 1; y--) for (let x = 1; x + w - 1 < W - 1; x++) {
    let free = true;
    for (let dy = 0; dy < 2 && free; dy++) for (let dx = 0; dx < w; dx++) if (!ok.includes(m.rows[y + dy][x + dx]) || people.has(`${x + dx},${y + dy}`)) { free = false; break; }
    if (!free || !walk(m.rows, x + dd, y + 2) || people.has(`${x + dd},${y + 2}`)) continue;
    const rows = m.rows.slice();
    rows[y] = rows[y].slice(0, x) + top + rows[y].slice(x + w); rows[y + 1] = rows[y + 1].slice(0, x) + front + rows[y + 1].slice(x + w);
    const after = reach(rows); if (!must.every(k => after.has(k)) || !after.has(`${x + dd},${y + 2}`)) continue;
    m.rows = rows; return [x + dd, y + 1];
  }
  return null;
}
for (const [town, m] of Object.entries(SG_MAPS)) {
  if (!m.town) continue;
  const door = sgBuildingPlace(town, 'RRRR', 'HHDH', 2) || sgBuildingPlace(town, 'RRR', 'HDH', 1); if (!door) continue;
  (m.doors ||= {})[`${door[0]},${door[1]}`] = 'bank';
  SG_MAPS[town + '_bank'] = { name: `${m.name} · Bank`, song: m.song, inside: true, theme: 'tavern', rows: SG_BANK_ROWS, exitTo: { map: town, x: door[0], y: door[1] + 1, dir: 'down' }, entry: { x: 5, y: 7 },
    npcs: [{ id: 'banker', x: 5, y: 1, dir: 'down', look: 'banker', banker: true, name: 'Banker' }, { id: 'teller', x: 8, y: 1, dir: 'down', look: 'noble', name: 'Teller', lines: ['Teller: Gold in the bank is safe, even if your whole party falls. The monsters can’t touch it!'] },
      { id: 'bguard', x: 9, y: 6, dir: 'left', look: 'guard', name: 'Guard', lines: ['Guard: Nobody gets into the vault. Not even me!'] }], objs: [] };
}
const SG_BANK_STEPS = 250, SG_BANK_RATE = 0.02;
function sgBankAccrue(s) {
  const b = s.bank ||= { bal: 0, at: s.steps }, n = Math.floor((s.steps - b.at) / SG_BANK_STEPS); if (n <= 0) return 0;
  b.at += n * SG_BANK_STEPS; if (!b.bal) return 0;
  const before = b.bal; b.bal = Math.floor(b.bal * Math.pow(1 + SG_BANK_RATE, Math.min(n, 40))); return b.bal - before;
}
function sgBank(sel = 0, note) {
  const s = sgS(), got = sgBankAccrue(s), b = s.bank, move = (amt, dep) => { amt = Math.floor(amt); if (amt <= 0) return;
    if (dep) { if (!b.bal) b.at = s.steps; s.gold -= amt; b.bal += amt; } else { b.bal -= amt; s.gold += amt; }
    trSound('hop'); sgSaveNow(true); sgBank(dep ? 0 : 3, `${dep ? 'Deposited' : 'Withdrew'} ${amt} gold.`); };
  const head = `Banker: “${got ? `Your savings earned ${got} gold in interest!` : note || 'How can I help?'}”<br><small>💰 With you: ${s.gold} · 🏦 In the bank: ${b.bal} · 📈 2% interest every ${SG_BANK_STEPS} steps you travel</small>`;
  sgMenu(head, [
    { label: '💰 Deposit everything', disabled: !s.gold, fn: () => move(s.gold, true) },
    { label: '💰 Deposit half', disabled: s.gold < 2, fn: () => move(s.gold / 2, true) },
    { label: '💰 Deposit 100', disabled: s.gold < 100, fn: () => move(100, true) },
    { label: '🪙 Take out everything', disabled: !b.bal, fn: () => move(b.bal, false) },
    { label: '🪙 Take out half', disabled: b.bal < 2, fn: () => move(b.bal / 2, false) },
    { label: '🪙 Take out 100', disabled: b.bal < 100, fn: () => move(100, false) },
    { label: 'Leave', fn: () => sgSay('Banker: Your gold is safe with us, in every town.') }], () => {}, { sel, big: true });
}
SG_CHAT.push('Put your gold in the bank! If your party falls, you only lose the gold you carry. And it earns interest.');

/* ================= 3. Swapping companions ================= */
function sgJoinFull(h) {
  const s = sgS(); sgJingle('sg_level');
  sgMenu(`👥 Your party is full (${SG_PARTY_MAX}). <b>${esc(h.name)}</b> wants to come along. Swap someone out?`, [
    ...s.party.map((p, i) => i === 0 ? null : { label: `🔁 ${sgHeroLine(p)}`, sub: `Swap out ${esc(p.name)}. Swap back at any tavern, shrine or camp.`, fn: () => {
      s.party.splice(i, 1, h); s.bench.push(p); sgSaveNow(true); sgSay(`${SG_HEROES[h.key].icon} ${esc(h.name)} joins the party! ${esc(p.name)} will wait for you.`); } }).filter(Boolean),
    { label: `🪑 ${esc(h.name)} waits for now`, sub: 'Bring them along later at a tavern, shrine or camp.', fn: () => { s.bench.push(h); sgSaveNow(true); sgSay(`${esc(h.name)} will wait for you. Swap at any tavern, shrine or camp.`); } }], null, { big: true });
}
function sgRosterAt(back, where = 'here') {
  const s = sgS(), lead = s.party[0];
  const train = h => { while (h.lv < lead.lv - 2) { const oh = sgMax(h, 'hp'), om = sgMax(h, 'mp'); h.lv++; h.hp += sgMax(h, 'hp') - oh; h.mp += sgMax(h, 'mp') - om; } };
  sgMenu(`👥 Who travels with you? (${SG_PARTY_MAX} at most)`, [
    ...s.party.map((h, i) => ({ label: `🚶 ${sgHeroLine(h)}`, sub: i === 0 ? 'The leader always travels.' : 'Travels with you. Pick to have them wait.', disabled: i === 0, fn: () => {
      s.party.splice(i, 1); s.bench.push(h); sgSaveNow(true); sgSay(`${esc(h.name)} will wait ${where}.`, () => sgRosterAt(back, where)); } })),
    ...s.bench.map((h, i) => ({ label: `🪑 ${sgHeroLine(h)}`, sub: s.party.length >= SG_PARTY_MAX ? 'Your party is full: have someone wait first.' : 'Waiting. Pick to bring along.', disabled: s.party.length >= SG_PARTY_MAX, fn: () => {
      s.bench.splice(i, 1); train(h); s.party.push(h); sgSaveNow(true); sgSay(`${esc(h.name)} joins the party again!`, () => sgRosterAt(back, where)); } }))], back, { big: true });
}
function sgShrineMore() {
  const s = sgS(); if (!s.bench.length) return;
  sgMenu('🛕 The shrine’s light glows. Your waiting friends could meet you here.', [
    { label: '👥 Change who travels with me', sub: `Friends waiting: ${s.bench.length}`, fn: () => sgRosterAt(() => {}, 'at the shrines') },
    { label: 'Not now', fn: () => {} }], () => {});
}

/* ================= 4. The airship ================= */
const SG_AIRSHIP_STAGE = 12;   // of 18 story steps: about two thirds of the way
function sgAirshipArt(dir) {
  return sgCache['air' + dir] ||= sgCanvas(16, 18, g => {
    const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
    R(2, 1, 12, 7, '#c0392b'); R(1, 2, 14, 5, '#c0392b'); R(4, 1, 2, 7, '#f6f6f0'); R(10, 1, 2, 7, '#f6f6f0'); R(7, 0, 2, 8, '#f4c542'); R(3, 2, 1, 2, '#ff8a7a');
    R(3, 8, 1, 4, '#5e3a1a'); R(12, 8, 1, 4, '#5e3a1a'); R(2, 12, 12, 4, '#8b5a2b'); R(2, 12, 12, 1, '#a87440'); R(2, 15, 12, 1, '#3a2010');
    if (dir === 'left') R(0, 12, 2, 2, '#f4c542'); else if (dir === 'right') R(14, 12, 2, 2, '#f4c542'); else R(7, 16, 2, 2, '#f4c542');
  });
}
const sgFlyWalk = (map, x, y) => true;   // in the sky you can go anywhere (off the edge takes you to the next region)
function sgFlyArrive(prev) {
  const s = sgS(), m = SG_MAPS[s.map], W = m.rows[0].length, H = m.rows.length; s.steps++;
  if (s.x < 0 || s.y < 0 || s.x >= W || s.y >= H) {
    const pos = sgGridPos(s.map), dr = s.y < 0 ? -1 : s.y >= H ? 1 : 0, dc = s.x < 0 ? -1 : s.x >= W ? 1 : 0, next = pos && SG_GRID5(pos[0] + dr, pos[1] + dc);
    if (!next) { Object.assign(s, { x: prev.x, y: prev.y }); sg.held = null; return sgSay('🌫️ Only clouds and endless sky that way. The captain turns the airship around.'); }
    const N = SG_MAPS[next], NW = N.rows[0].length, NH = N.rows.length;
    const nx = dc < 0 ? NW - 1 : dc > 0 ? 0 : Math.round(prev.x / Math.max(1, W - 1) * (NW - 1)), ny = dr < 0 ? NH - 1 : dr > 0 ? 0 : Math.round(prev.y / Math.max(1, H - 1) * (NH - 1));
    sgWarp(next, nx, ny, s.dir); s.fly = true; s.boat = false; sgMusicSync(); return;
  }
  if (--sg.grace <= 0 && Math.random() < 1 / 48) { sg.held = null; sg.grace = 6; sgEncounter('sky'); }
}
function sgAirshipEvent() {
  const s = sgS(); s.flags.airship = 1; s.fly = true; s.boat = false; sg.trail = []; sg.held = null; sgSaveNow(true); sgMusicSync();
  sgSay(['A shadow sweeps over the ground… something huge is coming down out of the clouds!', '🎈 A red-and-white airship drops anchor right beside you.',
    'Captain Dax: Ahoy down there! The Archmage sent word that the Lexicon’s heroes needed wings. Meet the <b>Wordwing</b>!',
    'Captain Dax: She flies over mountains, forests and seas. Land anywhere you like. Fewer monsters bother you up here… but watch for anything with wings.',
    '🎈 Open the menu and choose <b>Land here</b> to land, or <b>Call the airship</b> to fly again.'], () => {
    if (s.party.some(h => h.key === 'lancer') || s.bench.some(h => h.key === 'lancer')) return;
    sgMenu('Captain Dax: “And I’m a fair hand with a lance. Want me along?”', [
      { label: '🔱 Yes, welcome aboard!', fn: () => sgSay('🔱 <b>Dax the Sky Lancer</b> joined the party!', () => sgJoin('lancer')) },
      { label: 'Not now', fn: () => sgSay('Captain Dax: Then I’ll wait at camp and in the taverns. Call on me any time.', () => { const h = sgHero('lancer', SG_NAMES.lancer); h.st = {}; while (h.lv < Math.max(1, s.party[0].lv - 1)) h.lv++; h.hp = sgMax(h, 'hp'); h.mp = sgMax(h, 'mp'); h.gear = { weapon: 'mythril', armor: 'mythmail' }; s.met.lancer = 1; s.bench.push(h); sgSaveNow(true); }) }], null);
  });
}
function sgFlyToggle() {
  const s = sgS(), m = SG_MAPS[s.map];
  if (s.fly) {
    const t = sgTile(s.map, s.x, s.y);
    if (t === 'W' || !SG_WALK.has(t) || sgNpcAt(s.map, s.x, s.y) || sgObjAt(s.map, s.x, s.y) || m.warps?.[s.x + ',' + s.y]) return sgSay('🎈 You can’t land here. Find a clear patch of ground.');
    s.fly = false; sg.trail = []; sgSaveNow(true); sgMusicSync(); return sgSay('🛬 The Wordwing settles down gently. Everyone climbs out.');
  }
  if (s.boat) { s.shipMap = s.map; s.shipAt = s.x + ',' + s.y; }
  s.fly = true; s.boat = false; sg.trail = []; sgSaveNow(true); sgMusicSync(); sgSay(s.shipAt && s.shipMap === s.map ? '🎈 The Wordwing swoops down and lifts you off the Quill Swan. Up you go!' : '🎈 The Wordwing swoops down and you climb aboard. Up you go!');
}

/* ================= 5. Spoken spells ================= */
const SG_SAY_KINDS = new Set(['heal', 'healAll', 'ward', 'revive', 'cure', 'cureAll']);
const sgSayOn = () => S.settings.sgSay !== false;
function sgSpellAsk(sp) { return SG_SAY_KINDS.has(sp.kind) && sgSayOn() && typeof skSupport === 'function' && skSupport().ok ? sgAskSay : sgAskSpell; }
function sgAskSay(title, then) {
  let c = null; for (let t = 0; t < 8; t++) { const x = sgCard(), f = plainSent(x.front || ''); if (!c || (f.length <= 40 && !/\n/.test(f))) c = x; if (plainSent(c.front || '').length <= 40) break; }
  const q = { mode: 'say', spell: true, card: c, title: title.replace('Spell this word', 'Say this word'), prompt: plainSent(c.back), answer: plainSent(c.front), lang: sg.d.frontLang, opts: [], t0: Date.now(), then, given: null, tries: 0 };
  sg.ui = { type: 'question', q }; sgBox(); trMusic.setDuck?.(0.4);
}
function sgSayHtml(q, done) {
  if (done) return '';
  const l = sgLang(), T = t => l ? gtLine(t, l, []) : t;   // these buttons are outside the parts of the box the translator reads
  return `<div class="sg-say"><button type="button" class="sg-mic ${q.listening ? 'on' : ''}" data-act="sgMic">${q.listening ? T('⏹ Stop') : T('🎤 Speak')}</button>
    <div class="sg-lvl" aria-hidden="true"><i id="sgLvl"></i></div>
    <div class="sg-live" id="sgLive">${q.heard ? `${T('I heard:')} “${esc(q.heard)}” · ${T('Try again!')} (${3 - q.tries})` : q.err ? esc(q.err) : q.listening ? T('👂 Listening… say it now') : T('Say the word out loud.')}</div>
    <button type="button" class="sg-saytype" data-act="sgSayType">${T('⌨️ Type it instead')}</button></div>`;
}
function sgSayFinish(q, grade, heard) {
  q.listening = false; q.ms = Date.now() - q.t0; q.timeout = false; q.given = heard || ''; q.grade = grade; q.ok = grade !== 'wrong'; q.fast = grade === 'exact' && q.ms < 12000;
  sg.session.results.push({ cardId: q.card.id, q: q.prompt, a: q.answer, given: q.given, ok: q.ok }); if (typeof gmResult === 'function') gmResult(sg, q.card, q.ok);
  if (typeof sdSound === 'function') sdSound(q.ok ? 'right' : 'wrong');
  trMusic.setDuck?.(0.4); sgBox();
  setTimeout(() => { trMusic.setDuck?.(1); if (sg?.ui?.q === q) { sg.ui = null; q.then(q.grade, q.fast, q); } }, q.ok ? 900 : 1800);
  if (!q.ok) setTimeout(() => speak(q.answer, q.lang), 300);
}
Object.assign(actions, {
  sgMic: () => {
    const q = sg?.ui?.q; if (!q || q.mode !== 'say' || q.given != null) return;
    if (q.listening) { q.rec?.stop(); return; }
    q.listening = true; q.heard = null; q.err = null; trMusic.setDuck?.(0.05); sgBox();
    const base = skLang(sg.d), card = { front: q.answer, back: q.prompt };
    q.rec = skListen(q.lang, {
      check: list => skMatch(list, card, base).ok,
      done: list => { if (sg?.ui?.q !== q || q.given != null) return; const m = skMatch(list, card, base); q.tries++;
        if (m.ok) return sgSayFinish(q, m.close ? 'close' : 'exact', m.heard);
        if (q.tries >= 3) return sgSayFinish(q, 'wrong', m.heard);
        q.listening = false; q.heard = m.heard; trMusic.setDuck?.(0.4); sgBox(); },
      error: err => { if (sg?.ui?.q !== q || q.given != null) return; q.listening = false; q.err = SK_ERRORS[err] || `The microphone had a problem (${err}).`; trMusic.setDuck?.(0.4); sgBox(); },
      live: text => { const el = $('#sgLive'); if (el && text) el.textContent = `“${text}”`; },
      level: lv => { const el = $('#sgLvl'); if (el) el.style.width = Math.round(lv * 100) + '%'; },
    });
  },
  sgSayType: () => { const q = sg?.ui?.q; if (!q || q.mode !== 'say' || q.given != null) return; q.rec?.stop(); q.listening = false; q.mode = 'type'; sgBox(); setTimeout(() => $('#sgType')?.focus(), 60); },
});

/* ================= 6. Camp ================= */
const SG_CAMP_ROWS = (() => {
  const W = 20, H = 15, rows = [];
  for (let y = 0; y < H; y++) { let r = ''; for (let x = 0; x < W; x++) r += x === 0 || x === W - 1 || y === 0 || (y === H - 1 && x !== 9 && x !== 10) ? 'T' : '.'; rows.push(r); }
  const set = (x, y, c) => { rows[y] = rows[y].slice(0, x) + c + rows[y].slice(x + 1); };
  set(9, 7, '%'); set(4, 3, '^'); set(15, 3, '^'); set(3, 10, '^'); set(16, 10, '^'); set(2, 6, 'T'); set(17, 6, 'T'); set(7, 12, 'T');
  return rows;
})();
const SG_CAMP_SPOTS = [[8, 5, 'down'], [11, 5, 'down'], [7, 7, 'right'], [12, 7, 'left'], [8, 9, 'up'], [11, 9, 'up'], [6, 4, 'right'], [13, 4, 'left'], [6, 10, 'right'], [13, 10, 'left'], [5, 7, 'right'], [14, 7, 'left']];
SG_MAPS.camp = { name: 'Camp', song: 'sg_camp', inside: true, camp: true, theme: 'field', rows: SG_CAMP_ROWS, exitTo: { map: 'field', x: 9, y: 9, dir: 'down' }, entry: { x: 9, y: 12 }, npcs: [], objs: [] };
const SG_INSTRUMENT = { cantor: ['🪕 lute', 'sg_lute'], ranger: ['🪈 wooden flute', 'sg_flute'], druid: ['🎶 reed pipes', 'sg_pipes'], monk: ['🥁 hand drum', 'sg_drum'] };
const SG_CAMP_TALES = {
  scribe: ['I grew up in the archive of Quillhaven. My first word was “index”. My mother still tells everyone.', 'I write down every new word we hear on the road. One day I want to write a dictionary of my own.',
    'When the Unwriter erased the old books, I cried for a week. Then I picked up my quill and decided to fight back.', 'Thank you for letting me come along. Books taught me about the world, but you showed it to me.'],
  cantor: ['I sang in the choir of Briarwick until my voice cracked at the big festival. Everyone laughed. I practiced for a whole year after that.', 'Songs remember words longer than people do. That’s why my hymns can heal: they carry old, kind words.',
    'My grandmother taught me this lute. She said a song is just a word that refused to sit still.', 'When this is over, I want to travel to every town and learn one song from each.'],
  ranger: ['I learned to shoot by knocking apples off trees for my little sisters. Now they want me to teach them.', 'The forest is never quiet. Listen long enough and you can hear it talk.',
    'I left home because the monsters were coming closer every year. I wanted to meet them before they met my family.', 'Out here, under the stars, I feel like I can hear every word the wind has ever said.'],
  monk: ['At the monastery we spent a whole year saying only one word a day. Mine was “patience”. I didn’t like it at first.', 'My hands heal because I’m calm. When I’m angry, nothing works. Funny, isn’t it?',
    'I walked out of the desert with nothing but my sandals. Everything else I own, you’ve seen me get on this journey.', 'Breathe in, breathe out. Tomorrow’s battle is tomorrow’s. Tonight is for the fire.'],
  rogue: ['Yes, I used to pick pockets. No, I don’t anymore. Well… mostly.', 'My father was a locksmith. He said every lock is just a question waiting for the right answer.',
    'I joined you because the Unwriter took something from me: my real name. Nobody remembers it now. Not even me.', 'If we win, maybe I’ll find my name again. Until then, “Wren” will do.'],
  paladin: ['I took my oath at fifteen. My knees still hurt from kneeling all night in that chapel.', 'A shield isn’t for hiding. It’s for standing in front of someone who can’t stand alone.',
    'I lost my best friend to a monster near the Ember Cave. I fight so nobody else has to say goodbye like that.', 'You remind me of him. Brave, a little reckless. Don’t worry, I’ll keep my shield up for you.'],
  druid: ['I grew up in the treetops of the Verdant Wilds. I didn’t walk on flat ground until I was eight.', 'Every plant has a name, and every name has a story. Moss is my favourite. It never gives up.',
    'The blight in the north is killing the old forests. That’s why I left my grove to join you.', 'Listen… the fire is crackling in the old tongue. It says we’ll be fine.'],
  alchemist: ['My first potion turned my eyebrows green for a month. My teacher said it was the best mistake she’d ever seen.', 'Mixing potions is like making sentences. The right ingredients in the right order, or it all goes BOOM.',
    'I study the Unwriter’s ink. If I can understand how it erases words, maybe I can make an ink that brings them back.', 'Here, try this tea. It’s… mostly safe.'],
  lancer: ['I was born on a sky ship. My crib was a hammock between two clouds.', 'The Wordwing was my mother’s ship. She taught me to fly before I could spell my own name.',
    'From up high, the whole world looks like one big sentence. Roads are the lines, towns are the words.', 'When this is over, I’ll fly you anywhere you want. Free of charge. Well, maybe one sandwich.'],
};
function sgCampSet() {
  const s = sgS(), all = [...s.party.slice(1), ...s.bench];
  SG_MAPS.camp.npcs = all.slice(0, SG_CAMP_SPOTS.length).map((h, i) => { const [x, y, dir] = SG_CAMP_SPOTS[i]; return { id: 'c_' + h.key, x, y, dir, look: h.key, name: h.name, campHero: h.key }; });
}
function sgMakeCamp() {
  const s = sgS();
  s.campFrom = { map: s.map, x: s.x, y: s.y, dir: s.dir }; s.campN = (s.campN || 0) + 1;
  Object.assign(SG_MAPS.camp, { theme: SG_MAPS[s.map].theme, exitTo: { ...s.campFrom, dir: 'down' } });
  sgCampSet(); sgWarp('camp', 9, 11, 'up');
  sgSay(['⛺ You pitch the tents and light a fire. Your companions settle in around it.', 'Talk to them, play some music, or rest by the fire. Walk out of the clearing to break camp.']);
}
function sgCampTalk(n) {
  const s = sgS(), key = n.campHero, inParty = s.party.some(h => h.key === key), h = [...s.party, ...s.bench].find(x => x.key === key); if (!h) return;
  const tales = SG_CAMP_TALES[key] || ['It’s good to rest. Thank you for having me along.'], who = esc(h.name), inst = SG_INSTRUMENT[key];
  sgMenu(`${SG_HEROES[key].icon} <b>${who}</b>${inParty ? '' : ' · waiting at camp'}`, [
    { label: '💬 Talk', fn: () => {
      const heard = (s.campHeard ||= {}), told = (s.campTale ||= {});
      if (heard[key] !== s.campN) { heard[key] = s.campN; told[key] = Math.min((told[key] ?? -1) + 1, tales.length - 1); sgSaveNow(true); }
      sgSay(`${who}: ${tales[told[key] ?? 0]}`, () => sgCampTalk(n)); } },
    ...(inst ? [{ label: `🎵 Ask for a song (${inst[0]})`, fn: () => { sgJingle(inst[1]); sgSay(`${who} plays a little tune on the ${inst[0].replace(/^\S+ /, '')}. 🎶`, () => sgCampTalk(n)); } }] : []),
    inParty ? { label: '🪑 Stay at camp (wait)', sub: 'They’ll wait at camps, taverns and shrines.', fn: () => { const i = s.party.indexOf(h); s.party.splice(i, 1); s.bench.push(h); sgSaveNow(true); sgSay(`${who}: I’ll keep the fire warm.`, () => sgCampTalk(n)); } }
      : { label: '🚶 Travel with me', disabled: s.party.length >= SG_PARTY_MAX, sub: s.party.length >= SG_PARTY_MAX ? 'Your party is full: ask someone to stay first.' : 'Join the party again.', fn: () => { s.bench.splice(s.bench.indexOf(h), 1); while (h.lv < s.party[0].lv - 2) h.lv++; s.party.push(h); sgSaveNow(true); sgSay(`${who}: Let’s go!`, () => sgCampTalk(n)); } },
    { label: 'Leave', fn: () => {} }], () => {});
}
function sgCampFire() {
  const s = sgS();
  sgMenu('🔥 The campfire crackles.', [
    { label: '😴 Rest until morning', sub: 'Everyone gets back all their HP and MP, and the poison is gone. The game is saved.', fn: () => {
      const down = s.party.filter(h => h.hp <= 0);   // a campfire rests the living; it can't wake the fallen (a priest, an inn or Ember down can)
      for (const h of s.party) { if (h.hp <= 0) continue; h.hp = sgMax(h, 'hp'); h.mp = sgMax(h, 'mp'); if (h.st) delete h.st.poison; }
      sg.flash = 20; sgJingle('sg_inn'); s.campN = (s.campN || 0) + 1; sgSaveNow(true);
      sgSay(['You all fall asleep to the sound of the fire…', '☀️ Good morning! Everyone is rested and ready.', ...(s.party.some(h => h.st?.curse) ? ['A curse still lingers. A priest or Holy water will lift it.'] : []), ...(down.length ? [`${down.map(h => esc(h.name)).join(' and ')} ${down.length === 1 ? 'is' : 'are'} still knocked out. A priest, an inn or Ember down can wake ${down.length === 1 ? 'them' : 'them all'}.`] : [])]); } },
    { label: '👥 Change who travels with me', disabled: !s.bench.length && s.party.length <= 1, fn: () => sgRosterAt(() => { sgCampSet(); sgCampFire(); }, 'at camp') },
    { label: '🏕️ Break camp', fn: () => { const f = s.campFrom || SG_MAPS.camp.exitTo; sgWarp(f.map, f.x, f.y, 'down'); } },
    { label: 'Sit a while', fn: () => {} }], () => {});
}

/* ================= 7a. Ghost ships ================= */
const SG_GHOST_ROWS = ['[[[[[[[[[[[[[[[[[[[[[[', '[~~~~~~~~~~~~~~~~~~~~[', '[~~i~~~~~~~i~~~~~~i~~[', '[~~~~~~~~~~~~~~~~~~~~[', '[~~~~[[[[~~~~[[[[~~~~[', '[~~~~[~~[~~~~[~~[~~~~[',
  '[~~~~[~~~~~~~~~~[~~~~[', '[~~~~[[[[~~~~[[[[~~~~[', '[~~~~~~~~~~~~~~~~~~~~[', '[~~i~~~~~~~~~~~~~~i~~[', '[~~~~~~~~~~~~~~~~~~~~[', '[[[[[[[[[[~~[[[[[[[[[['];
SG_MAPS.ghostship = { name: 'The Drifting Ghost Ship', song: 'sg_ghost', inside: true, theme: 'ghost', rows: SG_GHOST_ROWS, exitTo: { map: 'sea_2_0', x: 5, y: 5, dir: 'down' }, entry: { x: 10, y: 10 }, npcs: [], objs: [] };
function sgGhostShip() {
  const s = sgS(), n = (s.ghostN || 0) + 1;
  sgMenu('🌫️ Fog rolls over the water… A ship with torn grey sails drifts out of it. No one is at the wheel. Lanterns glow green on deck.', [
    { label: '👻 Board the ghost ship', fn: () => {
      s.ghostN = n; s.ghostFrom = { map: s.map, x: s.x, y: s.y }; const id = k => `gs${n}_${k}`;
      Object.assign(SG_MAPS.ghostship, { exitTo: { map: s.map, x: s.x, y: s.y, dir: 'down' }, npcs: [{ id: 'ghostcook', x: 19, y: 3, dir: 'left', look: 'ghost', name: 'Ghostly cook', lines: ['Ghostly cook: Stew… there is always stew… nobody eats it…', 'Ghostly cook: The Captain keeps the good loot in his cabin. Left side. Mind his temper.'] }],
        objs: [{ type: 'ghostFoe', id: id('f1'), x: 10, y: 3, group: ['seaspecter', 'drowned'] }, { type: 'ghostFoe', id: id('f2'), x: 15, y: 9, group: ['bonepirate', 'drowned', 'seaspecter'] },
          { type: 'ghostFoe', id: id('cap'), x: 7, y: 6, group: ['grimwake', 'bonepirate', 'bonepirate'], captain: true },
          { type: 'chest', id: id('c1'), x: 6, y: 5, give: { gold: 300 + 60 * sgStage(), pearl: 1 }, tier: 'rare', guardFoe: id('cap') },
          { type: 'chest', id: id('c2'), x: 14, y: 5, give: { megaherb: 1, ether: 2 }, tier: 'uncommon' },
          { type: 'chest', id: id('c3'), x: 2, y: 10, give: [{ doubloons: 1 }, { seacrown: 1 }, { conch: 2 }, { coralidol: 1 }][n % 4], tier: 'rare' }] });
      sgWarp('ghostship', 10, 10, 'up'); sgSay(['You tie the Quill Swan alongside and climb up the slimy ladder…', '👻 The deck creaks. Somewhere below, someone is laughing. Walk off the gangplank (bottom) to leave.']); } },
    { label: '⛵ Sail away quickly', fn: () => sgSay('You steer away. When you look back, the fog and the ship are gone.') }], () => {});
}

/* ================= 7b. Abandoned temples and the Hero's gear ================= */
const SG_TEMPLE_ROWS = ['XXXXXXXXXXXXXXX', 'XrCCCCCCCCCCCrX', 'XCCCCCCCCCCCCCX', 'XXXXXXX!XXXXXXX', 'XCCCCCCCCCCCCCX', 'XCjCCCCCCCCCjCX', 'XCCCCCCCCCCCCCX', 'XCCCCCCCCCCCCCX',
  'XCCCCCCCCCCCCCX', 'XCjCCCCCCCCCjCX', 'XCCCCCCCCCCCCCX', 'XrCCCCCCCCCCCrX', 'XXXXXXXCXXXXXXX'];
const SG_TEMPLES = [
  { id: 'temple_n', map: 'north1', fx: 0.7, fy: 0.35, name: 'Temple of Frozen Flames', gear: 'heromail', flag: 'tmpN', puzzle: 'braziers',
    plaque: ['The plaque is cracked with ice:', '“Four fires once burned for the Hero. Light them all, and the door will remember.”', '(Each brazier you touch flips itself and its neighbours.)'] },
  { id: 'temple_s', map: 'south1', fx: 0.3, fy: 0.6, name: 'Temple of the Green Word', gear: 'heroblade', flag: 'tmpS', puzzle: 'stones',
    plaque: ['Vines cover the old plaque:', '“Three stones keep three words. Wake them all without a single mistake.”', '(Spell the word each stone asks for. One wrong word puts them all to sleep again.)'] },
  { id: 'temple_c', map: 'south3', fx: 0.6, fy: 0.7, name: 'Temple of the Sun Path', gear: 'herostaff', flag: 'tmpC', puzzle: 'plates',
    plaque: ['Sand has worn the letters almost smooth:', '“First the sun climbs. Then the stars wake. The moon follows them, and at last the sea swallows all.”'] },
];
for (const T of SG_TEMPLES) {
  const at = sgOpenArea(T.map, T.fx, T.fy, 3, 3); if (!at) continue;
  const [x, y] = at, ex = x + 1, ey = y + 1;
  sgStamp(T.map, x, y, ['j&j']);
  const om = SG_MAPS[T.map]; (om.doors ||= {})[`${ex},${y}`] = 'temple:' + T.id;
  const objs = [{ type: 'plaque', id: T.id + '_pl', x: 9, y: 11, lines: T.plaque }, { type: 'chest', id: T.id + '_gear', x: 7, y: 1, give: { gear: T.gear, gold: 1000 }, tier: 'epic' },
    { type: 'chest', id: T.id + '_c2', x: 1, y: 2, give: { megaherb: 2, phoenix: 1 }, tier: 'rare' }];
  if (T.puzzle === 'plates') [['☀️', 0, 3], ['⭐', 1, 9], ['🌙', 2, 5], ['🌊', 3, 11]].forEach(([symbol, order, px]) => objs.push({ type: 'plate', id: `${T.id}_p${order}`, x: px, y: 7, group: 'sun', order, symbol }));
  if (T.puzzle === 'stones') [3, 7, 11].forEach((px, i) => objs.push({ type: 'wordstone', id: `${T.id}_s${i}`, x: px, y: 6, group: T.id }));
  if (T.puzzle === 'braziers') [3, 6, 8, 11].forEach((px, i) => objs.push({ type: 'brazier', id: `${T.id}_b${i}`, x: px, y: 6, i, group: T.id, start: i === 0 || i === 3 }));
  SG_MAPS[T.id] = { name: T.name, theme: 'ruins', inside: true, rows: SG_TEMPLE_ROWS, zone: () => 'temple', gates: { '7,3': T.flag }, exitTo: { map: T.map, x: ex, y: ey, dir: 'down' }, entry: { x: 7, y: 11 }, npcs: [], objs };
}
const sgStoneLit = o => !!sgS().flags['ws:' + o.id];
function sgWordstone(o) {
  const s = sgS(), m = SG_MAPS[s.map], gate = Object.values(m.gates)[0];
  if (s.flags[gate]) return sgSay('The stones glow quietly. The door is already open.');
  if (sgStoneLit(o)) return sgSay('This stone is already awake.');
  sgAskSpell('🗿 The stone whispers a meaning… spell the word', g => {
    const row = sgObjs(s.map).filter(x => x.type === 'wordstone');
    if (g === 'wrong') { row.forEach(x => delete s.flags['ws:' + x.id]); sg.shake = 8; trSound('bump'); sgSaveNow(true); return sgSay(['The stone goes cold… and every stone falls asleep again!', 'Start over from the first stone you like.']); }
    s.flags['ws:' + o.id] = 1; trSound('hop');
    if (row.every(sgStoneLit)) { s.flags[gate] = 1; sg.flash = 16; sgJingle('sg_level'); sgSaveNow(true); return sgSay(['All three stones blaze with green light!', '🔓 With a deep grinding sound, the sealed door slides open.']); }
    sgSaveNow(true); sgSay(`✨ The stone wakes up. ${row.filter(sgStoneLit).length} of ${row.length} are awake.`);
  });
}
const sgBrazierLit = o => { const v = sgS().flags['bz:' + o.id]; return v == null ? !!o.start : !!v; };
function sgBrazier(o) {
  const s = sgS(), m = SG_MAPS[s.map], gate = Object.values(m.gates)[0];
  if (s.flags[gate]) return sgSay('All four fires burn bright. The door is open.');
  const row = sgObjs(s.map).filter(x => x.type === 'brazier').sort((a, b) => a.i - b.i), i = row.indexOf(o);
  for (const j of [i - 1, i, i + 1]) if (row[j]) s.flags['bz:' + row[j].id] = sgBrazierLit(row[j]) ? 0 : 1;
  sg.shake = 3; trSound('bump');
  const now = row.map(x => sgBrazierLit(x) ? '🔥' : '▫️').join(' ');
  if (row.every(sgBrazierLit)) { s.flags[gate] = 1; sg.flash = 16; sgJingle('sg_level'); sgSaveNow(true); return sgSay([now, 'All four fires roar at once!', '🔓 The frozen door melts away.']); }
  sgSaveNow(true); sgSay(['You touch the brazier.', now]);
}

/* ================= 7c. Graveyards ================= */
const SG_GRAVE_ROWS = ['||||||', '|+.++|', '|....|', '||..||'];
const SG_GRAVEYARDS = [['north1', 0.55, 0.65, 'grave2', 'Frostmark Barrow Field'], ['north2', 0.4, 0.45, 'grave2', 'Thundercrag Cemetery'], ['south2', 0.55, 0.25, 'grave2', 'Mirefen Burial Ground']];
const SG_EPITAPHS = ['“Here lies Old Tom. He finally finished his book.”', '“She taught a whole village to read. Rest well, teacher.”', '“Gone fishing. Back never.”', '“Beloved grandfather, terrible singer.”',
  '“He knew a word for everything except goodbye.”', '“Brave, kind, and always late.”', '“Here rests a baker. The town still smells of her bread.”', '“The words fade. The love does not.”', '“Don’t dig. Really. Don’t.”'];
for (const [map, fx, fy, zone, name] of SG_GRAVEYARDS) {
  const m = SG_MAPS[map], at = sgOpenArea(map, fx, fy, 6, 4, '.dhf', '.dhfPMWYVT', [2, 3]); if (!m || !at) continue;
  const [x, y] = at; sgStamp(map, x, y, SG_GRAVE_ROWS);
  (m.graves ||= []).push({ x0: x + 1, y0: y + 1, x1: x + 4, y1: y + 3, zone, name });   // (includes the gate)
  (m.objs ||= []).push({ type: 'chest', id: `gy_${map}`, x: x + 4, y: y + 2, give: zone === 'grave1' ? { gold: 120, holywater: 1 } : { gold: 900, holywater: 2, phoenix: 1 }, tier: 'rare' },
    { type: 'hidden', id: `gyh_${map}`, x: x + 2, y: y + 1, give: zone === 'grave1' ? { antidote: 2 } : { megaherb: 1 }, story: 'graveFind' });
  m.npcs.push({ id: 'keeper_' + map, x: x + 1, y: y + 2, dir: 'down', look: 'keeper', name: 'Gravekeeper', lines: [`Gravekeeper: Welcome to the ${name}. Mind your step. The dead don’t sleep well around here.`, 'Gravekeeper: At night the ghosts walk and the old bones rattle. Read the stones if you like. Just be quick.'] });
}
Object.assign(SG_STORY, {
  graveFind: ['Something glints between the old stones…', 'You found something left behind by a mourner long ago.'],
  leviathan: ['The water goes dark and cold. Two huge eyes open in the deep.', '⚠️ The Abyssal Leviathan uncoils from the trench!'],
  leviathanWin: ['The Leviathan sinks back into the trench and does not rise again.', 'Return to King Nereus in the Coral Kingdom.'],
});
const sgGraveAt = (map, x, y) => (SG_MAPS[map].graves || []).find(g => x >= g.x0 && x <= g.x1 && y >= g.y0 && y <= g.y1);

/* ================= 8. The underwater kingdom ================= */
const SG_CORAL_ROWS = ['**********************', '*}$$$$$$$*KKKK*$$$$$}*', '*$$$$$$$$*KLLK*$$$$$$*', '*$$*$$}$$*KKKK*$$}$$$*', '*$$*$$$$$$$KK$$$$$$$$*', '*$$$$$$$$$$KK$$$$**$$*',
  '*$}$$$$$$$$KK$$$$$$$$*', '*$$$$**$$$$KK$$$$$$}$*', '*$$$$$$$$$$KK$$$$$$$$*', '*}$$$$$$$$$$$$$$$$*$$*', '*$$$$$$$$$$$$$$$$$$$$*', '*$$$}$$$$$$$$$$$$$}$$*', '*$$$$$$$$$$$$$$$$$$$$*',
  '**********$$**********'];
SG_MAPS.coral = { name: 'The Coral Kingdom', song: 'sg_coral', inside: true, theme: 'deep', rows: SG_CORAL_ROWS, exitTo: { map: 'sea_4_1', x: 6, y: 6, dir: 'down' }, entry: { x: 10, y: 12 },
  warps: { '20,7': { map: 'abyss', x: 2, y: 11, dir: 'up' } },
  npcs: [{ id: 'merking', x: 11, y: 3, dir: 'down', look: 'merking', merking: true, name: 'King Nereus' },
    { id: 'mg1', x: 9, y: 4, dir: 'down', look: 'merguard', name: 'Coral guard', lines: ['Coral guard: Bow before King Nereus, lord of the deep!'] },
    { id: 'mg2', x: 14, y: 4, dir: 'down', look: 'merguard', name: 'Coral guard', lines: ['Coral guard: The trench is to the east. Past the kelp. Only the brave go there.'] },
    { id: 'mf1', x: 4, y: 6, dir: 'right', look: 'merfolk', name: 'Merfolk child', wander: 1, lines: ['Merfolk child: You have LEGS! Do they itch? They look itchy.'] },
    { id: 'mf2', x: 16, y: 10, dir: 'left', look: 'merfolk', name: 'Pearl diver', lines: ['Pearl diver: The bubble charm lets you breathe down here. Don’t take it off!', 'Pearl diver: Sell your pearls in any harbor town. Humans love them.'] },
    { id: 'mshop', x: 3, y: 2, dir: 'down', look: 'merfolk', merchant: ['bigherb', 'megaherb', 'ether', 'antidote', 'phoenix'], name: 'Shell trader', lines: ['Shell trader: Herbs from the sea garden. Very fresh. Very wet.'] }],
  objs: [{ type: 'whirlpool', id: 'coral_up', x: 10, y: 13 }] };
const SG_ABYSS_ROWS = ['********************', '*$$$$*$$$$$$$$*$$$$*', '*$$$$*$$}$$$$$*$$$$*', '*$$$$$$$$$**$$$$$$$*', '***$$$$$$$**$$$$$***', '*$$$$***$$$$$$$$$$$*', '*$}$$$$*$$$$$*****$*',
  '*$$$$$$*$$$$$$$$$$$*', '*$$***$$$$$}$$$$$$$*', '*$$$$$$$$$$$***$$$$*', '*$$$$$*$$$$$$$$$$$$*', '*$<$$$*$$$$$$$}$$$$*', '********************'];
SG_MAPS.abyss = { name: 'The Abyssal Trench', song: 'sg_barrow', inside: true, theme: 'deep', rows: SG_ABYSS_ROWS, upTo: { map: 'coral', x: 19, y: 7, dir: 'left' }, enc: { rate: 14, zone: 'abyss' },
  exitTo: { map: 'coral', x: 19, y: 7, dir: 'left' }, entry: { x: 2, y: 10 }, npcs: [],
  objs: [{ type: 'boss', id: 'leviathan', x: 17, y: 1, group: ['leviathan'], story: 'leviathan' }, { type: 'chest', id: 'ab_c1', x: 3, y: 1, give: { pearl: 3, ether: 2 }, tier: 'rare' },
    { type: 'chest', id: 'ab_c2', x: 12, y: 10, give: { megaherb: 2, gold: 600 }, tier: 'rare' }, { type: 'chest', id: 'ab_c3', x: 18, y: 6, give: { coralidol: 1, phoenix: 1 }, tier: 'epic' }] };
// the whirlpool: out in the Coral Sea
(() => {
  const m = SG_MAPS.sea_4_1 || SG_MAPS.sea_4_2; if (!m) return;
  const id = SG_MAPS.sea_4_1 ? 'sea_4_1' : 'sea_4_2', H = m.rows.length, W = m.rows[0].length;
  let at = null; for (let r = 0; r < 12 && !at; r++) for (let dy = -r; dy <= r && !at; dy++) for (let dx = -r; dx <= r; dx++) { const x = (W >> 1) + dx, y = (H >> 1) + dy;
    if ([-1, 0, 1].every(a => [-1, 0, 1].every(b => (m.rows[y + a] || '')[x + b] === 'W')) && !(m.objs || []).some(o => o.x === x && o.y === y)) { at = [x, y]; break; } }
  if (!at) return;
  (m.objs ||= []).push({ type: 'whirlpool', id: 'whirl', x: at[0], y: at[1], dive: true });
  SG_MAPS.coral.exitTo = { map: id, x: at[0], y: at[1] - 1, dir: 'up' };
})();
function sgMerking() {
  const s = sgS();
  if (s.flags.levReward) return sgSay('King Nereus: The deep sings your name now, surface-friend. The Tidecaller is yours forever.');
  if (s.beaten.leviathan) { s.flags.levReward = 1; const lines = sgGive({ gear: 'tidetrident', gold: 1500, pearl: 2, megaherb: 2 }); sg.session.nuts += 5; sgSaveNow(true); sgJingle('sg_fanfare');
    return sgSay(['King Nereus: You did it! The trench is quiet, and my people can swim freely again.', 'King Nereus: Take the <b>Tidecaller Trident</b>, forged from the coral of the first reef. And a little treasure for the road.', ...lines]); }
  if (!s.flags.nereus) { s.flags.nereus = 1; sgSaveNow(true); }
  sgSay(['King Nereus: A surface-dweller, in my kingdom? The whirlpool must have liked you.', 'King Nereus: We are in trouble. A great beast, the <b>Abyssal Leviathan</b>, has woken in the trench to the east. It eats our gardens and frightens our children.',
    'King Nereus: Defeat it, and I will give you the treasure of our kingdom.']);
}

/* ================= hooks called by saga.js ================= */
const SG_PASS_OBJS = new Set(['whirlpool']);
function sgArriveMore(prev, t) {
  const s = sgS(), m = SG_MAPS[s.map];
  if (!s.flags.airship && sgStage() >= SG_AIRSHIP_STAGE && sgLand(s.map) && !s.boat) { sgAirshipEvent(); return true; }
  const here = sgObjs(s.map).find(o => o.x === s.x && o.y === s.y);
  if (here?.type === 'whirlpool') { sg.held = null;
    if (here.dive) { sgMenu('🌀 A huge whirlpool spins under the ship! Deep below, something glows.', [{ label: '🫧 Dive in', fn: () => { s.diveFrom = { map: s.map, x: s.x, y: s.y - 1 }; sgWarp('coral', 10, 12, 'up'); sgSay(['You take a deep breath and let the whirlpool pull you down…', '🫧 A bubble of air wraps around your heads. You can breathe!', 'Welcome to the Coral Kingdom.']); } }, { label: 'Sail around it', fn: () => {} }], () => {}); return true; }
    const f = s.diveFrom || SG_MAPS.coral.exitTo; sgWarp(f.map, f.x, f.y, 'up'); sgSay('🫧 The current carries you up, up, up… and you pop out next to the Quill Swan!'); return true; }
  if (s.boat && t === 'W' && sgStage() >= 7 && (sg.ghostWait = (sg.ghostWait ?? 40) - 1) <= 0 && Math.random() < 1 / 260) { sg.held = null; sg.ghostWait = 120; sgGhostShip(); return true; }
  const gy = sgGraveAt(s.map, s.x, s.y);
  if (gy) { if (!s.flags['gy:' + s.map]) { s.flags['gy:' + s.map] = 1; sg.held = null; sgSay(`🪦 ${gy.name}. The air is cold here.`); return true; }
    if (--sg.grace <= 0 && Math.random() < 1 / 7) { sg.held = null; sg.grace = 4; sgEncounter(gy.zone); } return true; }
  if (m.enc && t !== '<' && --sg.grace <= 0 && Math.random() < 1 / m.enc.rate) { sg.held = null; sg.grace = 4; sgEncounter(m.enc.zone); return true; }
  return false;
}
function sgInteractMore(fx, fy) {
  const s = sgS(), t = sgTile(s.map, fx, fy);
  if (t === '%' && SG_MAPS[s.map].camp) { sgCampFire(); return true; }
  if (t === '+') { sgSay(['🪦 You read the old gravestone:', SG_EPITAPHS[(fx * 7 + fy * 13) % SG_EPITAPHS.length]]); return true; }
  if (t === '^' && SG_MAPS[s.map].camp) { sgSay('A cozy tent. Somebody snores inside.'); return true; }
  return false;
}
function sgDoorMore(kind) {
  const s = sgS();
  if (kind === 'bank') { const id = s.map + '_bank', r = SG_MAPS[id]; if (r) sgWarp(id, r.entry.x, r.entry.y, 'up'); return true; }
  if (String(kind).startsWith('temple:')) { const id = kind.slice(7), r = SG_MAPS[id]; if (r) { const first = !s.flags['seen:' + id]; s.flags['seen:' + id] = 1; sgWarp(id, r.entry.x, r.entry.y, 'up'); if (first) sgSay(['You step into the ruins. Dust and old magic hang in the air.', `📜 ${r.name}. Something precious is sealed behind the far door.`]); } return true; }
  return false;
}
function sgUseObjMore(o) {
  const s = sgS();
  if (o.type === 'wordstone') { sgWordstone(o); return true; }
  if (o.type === 'brazier') { sgBrazier(o); return true; }
  if (o.type === 'ghostFoe') { sgSay(o.captain ? ['Captain Grimwake: Who dares climb aboard MY ship? Hands off my treasure!'] : ['👻 Ghosts rise from the deck!'], () => sgBattle(o.group, { fixed: o.id, zone: 'ghostship' })); return true; }
  if (o.type === 'chest' && o.guardFoe && !s.beaten[o.guardFoe]) { sgSay('A ghostly lock holds the chest shut. The Captain’s curse, maybe?'); return true; }
  return false;
}
function sgDrawObjMore(g, o, ox, oy) {
  const X = ox(o.x), Y = oy(o.y);
  if (o.type === 'whirlpool') { const a = sg.frame / 8; g.strokeStyle = '#d8f4ff'; g.lineWidth = 1; for (let r = 2; r <= 7; r += 2.5) { g.beginPath(); g.arc(X + 8, Y + 8, r, a + r, a + r + 4.2); g.stroke(); } return true; }
  if (o.type === 'wordstone') { const lit = sgStoneLit(o) || sgS().flags[Object.values(SG_MAPS[sgS().map].gates || {})[0]]; g.fillStyle = '#6a6478'; g.fillRect(X + 3, Y + 2, 10, 13); g.fillStyle = lit ? '#7fff7f' : '#3a3446'; g.fillRect(X + 6, Y + 5, 4, 6); g.fillStyle = '#4a4458'; g.fillRect(X + 3, Y + 13, 10, 2); return true; }
  if (o.type === 'brazier') { const lit = sgBrazierLit(o) || sgS().flags[Object.values(SG_MAPS[sgS().map].gates || {})[0]]; g.fillStyle = '#5a5268'; g.fillRect(X + 4, Y + 9, 8, 6); g.fillRect(X + 3, Y + 8, 10, 2);
    if (lit) { g.fillStyle = sg.frame % 10 < 5 ? '#ffb066' : '#f4c542'; g.fillRect(X + 5, Y + 3, 6, 5); g.fillStyle = '#ff7a1a'; g.fillRect(X + 6, Y + 5, 4, 3); } return true; }
  if (o.type === 'ghostFoe') { g.globalAlpha = 0.75 + 0.2 * Math.sin(sg.frame / 9); g.drawImage(sgMonsterArt(o.group[0]), X, Y + Math.round(Math.sin(sg.frame / 10)), 16, 16); g.globalAlpha = 1; return true; }
  return false;
}
function sgTalkMore8(n) {
  if (n.banker) { sgBank(); return true; }
  if (n.campHero) { sgCampTalk(n); return true; }
  if (n.merking) { sgMerking(); return true; }
  return false;
}
{ const before = sgTalkMore; sgTalkMore = n => sgTalkMore8(n) || before(n); }
function sgMainMenuMore() {
  const s = sgS(), ow = sgOverworld(s.map), out = [];
  if (s.flags.airship && ow) out.push(s.fly ? { label: '🛬 Land here', fn: () => sgFlyToggle() } : { label: '🎈 Call the airship', fn: () => sgFlyToggle() });
  if (sgLand(s.map) && !s.fly && !s.boat) out.push({ label: '⛺ Make camp', fn: () => sgMakeCamp() });
  return out;
}
function sgOptionsMore() {
  return [{ label: `🎤 Spoken spells: ${sgSayOn() ? 'on' : 'off'}`, sub: 'Healing and protecting spells are cast by saying the word out loud. Off: type it instead.', fn: () => { S.settings.sgSay = !sgSayOn(); save(); sgOptions(4); } }];
}
function sgFix8(s) {
  if (s.map === 'camp' && !s.campFrom) Object.assign(s, { map: 'field', x: 9, y: 9, dir: 'down' });
  if (s.map === 'camp') { Object.assign(SG_MAPS.camp, { theme: SG_MAPS[s.campFrom.map]?.theme || 'field', exitTo: { ...s.campFrom, dir: 'down' } }); sgCampSet(); }
  if (s.map === 'ghostship') Object.assign(s, { map: s.ghostFrom?.map || 'sea_2_0', x: s.ghostFrom?.x ?? 5, y: s.ghostFrom?.y ?? 5, boat: true });
  if (s.fly && !sgOverworld(s.map)) s.fly = false;
}
{ const before = typeof sgFixMore === 'function' ? sgFixMore : null; sgFixMore = s => { before?.(s); sgFix8(s); }; }
SG_CHAT.push('Sailors say a ghost ship drifts on the open sea. Board it if you dare!', 'There’s a whirlpool in the Coral Sea. Some say a whole kingdom lives under it.',
  'Ancient temples stand in the wild lands of the north and south. The Hero’s own gear is sealed inside.', 'Tired? Make camp anywhere on the road. Your friends love a good campfire.');

/* ================= 10. Day and night =================
   The clock runs as you travel (one whole day = SG_DAY_STEPS steps). From 20:00 to 6:00 it is night: the screen
   gets dark outdoors, and in towns everything closes except the tavern and the inn. A night at the inn, or resting
   at camp, wakes you at 7:00. */
const SG_DAY_STEPS = 320;
const sgHour = (s = sgS()) => (8 + 24 * ((((s?.steps || 0) + (s?.clockShift || 0)) % SG_DAY_STEPS) / SG_DAY_STEPS)) % 24;
const sgIsNight = (s = sgS()) => { const h = sgHour(s); return h >= 20 || h < 6; };
function sgClockLabel() {
  const h = sgHour(), hh = Math.floor(h), mm = Math.floor((h - hh) * 4) * 15;
  return `${sgIsNight() ? '🌙' : h < 8 ? '🌅' : h >= 18 ? '🌇' : '☀️'} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
function sgNightAlpha() {
  const s = sgS(), m = SG_MAPS[s?.map]; if (!m || m.inside || sg?.bt) return 0;
  const h = sgHour(s); if (h >= 21 || h < 5) return 0.45; if (h >= 18) return 0.45 * (h - 18) / 3; if (h < 7) return 0.45 * (7 - h) / 2; return 0;
}
function sgMorning() {   // wake up at 7:00
  const s = sgS(), t = ((s.steps || 0) + (s.clockShift || 0)) % SG_DAY_STEPS, want = Math.round(SG_DAY_STEPS * 23 / 24);
  s.clockShift = ((s.clockShift || 0) + want - t + SG_DAY_STEPS * 2) % SG_DAY_STEPS; s.dayPhase = 'day';
}
function sgClockTick() {
  const s = sgS(), ph = sgIsNight(s) ? 'night' : 'day';
  if (s.dayPhase && s.dayPhase !== ph && !sg.bt) sg.banner = { text: ph === 'night' ? '🌙 Night falls. Shops close until morning.' : '☀️ Morning! The shops are open again.', until: sg.frame + 160 };
  s.dayPhase = ph;
}
const SG_NIGHT_CLOSED = { shop: '🌙 The shop is closed for the night.', smith: '🌙 The smithy is closed for the night.', bank: '🌙 The bank is closed for the night.',
  church: '🌙 The church is closed for the night.', chronicle: '🌙 The Chronicle House is closed for the night.', sage: '🌙 Sage Orrin’s house is closed for the night.' };
function sgClosedAtNight(kind) {
  const s = sgS(); if (!SG_NIGHT_CLOSED[kind] || !SG_MAPS[s.map].town || !sgIsNight(s)) return false;
  sgSay([SG_NIGHT_CLOSED[kind], 'Come back in the morning. The tavern and the inn are still open.']); return true;
}
function sgTalkFirst(n) {   // merchants on the street pack up at night too
  const s = sgS();
  if ((n.merchant || n.merchantGear) && SG_MAPS[s.map].town && sgIsNight(s)) { sgSay(`${esc(n.name || 'Merchant')}: We’re closed for the night. Come back in the morning!`); return true; }
  return false;
}
{ const before = sgDoorMore; sgDoorMore = kind => sgClosedAtNight(kind) || before(kind); }
{ const before = sgArriveMore; sgArriveMore = (prev, t) => { sgClockTick(); return before(prev, t); }; }
{ const before = sgFlyArrive; sgFlyArrive = prev => { const r = before(prev); sgClockTick(); return r; }; }
{ const before = sgCampFire; sgCampFire = () => { before(); const u = sg.ui; const it = u?.items?.find(i => /Rest until morning/.test(i.label)); if (it) { const fn = it.fn; it.fn = () => { sgMorning(); fn(); }; } }; }
SG_CHAT.push('At night the shops close. Only the tavern and the inn stay open until morning.');
