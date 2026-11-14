'use strict';
/* ================= Lexicon Saga: the wider world (all original) =================
   Three new regions north of Aldermere, Seravel and the Eastern Isles, and three to the south, so the world is a 3 x 3 grid:
     Frostmark Tundra   | Thundercrag Highlands | Inkblight Wastes (the Unwriter's castle)
     Aldermere          | Seravel               | Eastern Isles
     Verdant Wilds      | Mirefen Marsh         | Sunscorch Canyon
   Each new region has its own biome, a town with a tavern and church, a two-floor dungeon with a mini-boss, and new monsters.
   Story: the Tower of Silence now ends with the Silent Herald, who guards the last Lexicon Shards. King Aldous then tells you
   about three hidden keys (Dawn Quill, Dusk Inkwell, Star Seal) that open Castle Unwritten. Inside: lever, plate and word puzzles,
   then the Unwriter himself. Loaded after saga-part3.js and before saga.js. */
const SG_WORLD = [['north1', 'north2', 'north3'], ['field', 'seravel', 'eastsea'], ['south1', 'south2', 'south3']];
/* ---------- Monsters of the six new regions (art is reused with new colors). Late-game strength. ---------- */
const sgM = (name, art, pal, hp, atk, def, agi, xp, gold, extra = {}) => ({ name, art, pal, hp, atk, def, agi, xp, gold, ...extra });
Object.assign(SG_MONSTERS, {
  // Frostmark Tundra
  frostwolf:  sgM('Frost Wolf', 'hound', ['#0d1a26', '#6f97b8', '#c8e2f5', '#ffffff', '#2e86c1', '#ffffff', '#0d1a26'], 150, 62, 38, 24, 290, 130, { poison: 0 }),
  snowowl:    sgM('Snow Owl', 'bird', ['#1a1f26', '#b8c4cf', '#eef3f8', '#ffffff', '#f4c542', '#ffffff', '#111111'], 130, 58, 34, 28, 270, 120, { cast: { name: 'Blizzard Wing', power: 36, chance: 0.25, all: true, fx: 'ice' } }),
  icecrab:    sgM('Ice Crab', 'crab', ['#0a1f2e', '#5aa8d8', '#a8e0ff', '#ffffff', '#ffffff', '#ffffff', '#111111'], 190, 64, 52, 8, 320, 140),
  frostmoth:  sgM('Frost Moth', 'moth', ['#102030', '#8fb8d8', '#dff2ff', '#ffffff', '#5aa8f0', '#ffffff', '#111111'], 120, 56, 32, 30, 260, 120, { drain: 0.3 }),
  icegolem:   sgM('Ice Golem', 'golem', ['#0a1a26', '#4f8fb8', '#9fd2f0', '#e8f8ff', '#ffffff', '#ffffff', '#2e86c1'], 260, 72, 58, 6, 380, 170, { heavy: { name: 'Glacier Fist', mult: 1.7, chance: 0.2, fx: 'ice' } }),
  // Thundercrag Highlands
  cragrat:    sgM('Crag Rat', 'rat', ['#1d1a16', '#6b6157', '#a39684', '#d1c6b6', '#f4c542', '#ffffff', '#111111'], 140, 60, 40, 22, 280, 130, { poison: 0.2 }),
  thunderhawk:sgM('Thunder Hawk', 'bird', ['#141420', '#4a4f6b', '#8f97c4', '#d8dcf5', '#ffe04d', '#ffffff', '#111111'], 150, 64, 34, 30, 300, 140, { cast: { name: 'Thunderclap', power: 40, chance: 0.28, all: true, fx: 'bolt' } }),
  stormimp:   sgM('Storm Imp', 'imp', ['#10141f', '#3a4a6b', '#6a85b8', '#b8c9ef', '#ffe04d', '#ffffff', '#111111'], 135, 62, 36, 24, 290, 135, { cast: { name: 'Spark Storm', power: 38, chance: 0.3, fx: 'bolt' } }),
  ironbeetle: sgM('Iron Beetle', 'beetle', ['#141414', '#4a4a4a', '#7d7d7d', '#b8b8b8', '#c0392b', '#ffffff', '#111111'], 220, 66, 60, 8, 340, 160),
  boulder:    sgM('Boulder Brute', 'golem', ['#1d1a16', '#5a5046', '#8a7d6e', '#b8ab9a', '#f4c542', '#ffffff', '#f4c542'], 280, 74, 56, 5, 390, 180, { heavy: { name: 'Rockslide', mult: 1.8, chance: 0.2, fx: 'slash' } }),
  // Inkblight Wastes
  inkooze:    sgM('Ink Ooze', 'blot', ['#000000', '#1a0a2a', '#3a1a5a', '#6a3a9a', '#e74c3c', '#ffffff', '#e74c3c'], 170, 66, 42, 12, 320, 150, { poison: 0.3 }),
  blightwraith:sgM('Blight Wraith', 'wisp', ['#0a0612', '#3a1a4a', '#6a2f7a', '#a86ab8', '#7fff7f', '#ffffff', '#0a0612'], 160, 68, 44, 26, 330, 150, { cast: { name: 'Withering Curse', power: 38, chance: 0.28, st: 'curse', fx: 'dark' } }),
  rotbat:     sgM('Rot Bat', 'bat', ['#0a0a05', '#3a3a1a', '#6a6a2f', '#a8a86a', '#7fff7f', '#ffffff', '#c0392b'], 145, 66, 36, 32, 310, 140, { poison: 0.3 }),
  hollowknight:sgM('Hollow Knight', 'knight', ['#05050a', '#2a1a3a', '#4a2f6a', '#8a6ab8', '#7fff7f', '#ffffff', '#7fff7f'], 240, 76, 56, 16, 400, 190, { heavy: { name: 'Hollow Blade', mult: 1.8, chance: 0.22, fx: 'slash' } }),
  grimoire:   sgM('Cursed Grimoire', 'book', ['#0a0505', '#4a1a1a', '#7a2f2f', '#b86a6a', '#7fff7f', '#f5e6d3', '#111111'], 190, 70, 46, 18, 360, 170, { cast: { name: 'Black Page', power: 42, chance: 0.3, all: true, st: 'curse', fx: 'dark' } }),
  // Verdant Wilds
  vinesnake:  sgM('Vine Serpent', 'serpent', ['#05140a', '#1e5a2a', '#3a9a4a', '#8fd69a', '#ff8fb1', '#ffffff', '#111111'], 170, 64, 40, 22, 300, 140, { poison: 0.35 }),
  toadstool:  sgM('Jungle Toadstool', 'shroom', ['#140a05', '#8a2a14', '#e8541c', '#ffb066', '#ffffff', '#ffffff', '#111111'], 160, 62, 42, 10, 290, 135, { cast: { name: 'Sleepy Spores', power: 32, chance: 0.28, all: true, st: 'poison', fx: 'heal' } }),
  thornsprite:sgM('Thorn Sprite', 'cactus', ['#0a1a05', '#2f6b14', '#5aa82a', '#a8e07a', '#ff4d6d', '#ffffff', '#111111'], 150, 66, 38, 24, 300, 140, { cast: { name: 'Thorn Burst', power: 36, chance: 0.28, all: true, fx: 'slash' } }),
  parrot:     sgM('Jungle Parrot', 'bird', ['#140505', '#c0392b', '#f39c12', '#f7dc6f', '#2e86c1', '#ffffff', '#111111'], 140, 62, 34, 32, 290, 135),
  jbeetle:    sgM('Jade Beetle', 'beetle', ['#051405', '#1a6b3a', '#2ecc71', '#a8f0c4', '#f4c542', '#ffffff', '#111111'], 210, 66, 56, 10, 340, 160),
  // Mirefen Marsh
  bogblob:    sgM('Bog Blob', 'blot', ['#0a0f05', '#3a4a1a', '#6b7a2f', '#a8b86a', '#f4c542', '#ffffff', '#111111'], 190, 64, 46, 10, 310, 150, { poison: 0.3 }),
  rotcap:     sgM('Rot Cap', 'shroom', ['#0a0a05', '#4a3a1a', '#7a6a2f', '#b8a86a', '#8e44ad', '#ffffff', '#111111'], 170, 64, 44, 10, 300, 145, { cast: { name: 'Rot Cloud', power: 34, chance: 0.3, all: true, st: 'poison', fx: 'wave' } }),
  swampeel:   sgM('Swamp Eel', 'serpent', ['#050a05', '#2a3a1a', '#4a6b2f', '#8fae6a', '#f4c542', '#ffffff', '#111111'], 180, 68, 42, 22, 320, 150),
  mudcrab:    sgM('Mud Crab', 'crab', ['#140a05', '#5a3a1a', '#8a6b3a', '#c4a87a', '#3a3a3a', '#ffffff', '#111111'], 230, 66, 60, 6, 350, 165),
  marshmoth:  sgM('Marsh Moth', 'moth', ['#0a0a05', '#5a6b2f', '#a8b86a', '#e0e8b8', '#8e44ad', '#ffffff', '#111111'], 140, 60, 36, 30, 290, 135, { curse: 0.12 }),
  // Sunscorch Canyon
  coyote:     sgM('Dust Coyote', 'hound', ['#1a0f05', '#8a4a1a', '#d08a4a', '#f3c48a', '#c0392b', '#ffffff', '#111111'], 160, 68, 38, 28, 310, 145),
  saguaro:    sgM('Saguaro Brute', 'cactus', ['#0a1a05', '#2f6b2a', '#4f9a3c', '#8fd67a', '#ff8fb1', '#ffffff', '#111111'], 220, 70, 50, 8, 350, 165, { cast: { name: 'Needle Storm', power: 40, chance: 0.28, all: true, fx: 'slash' } }),
  vulture:    sgM('Canyon Vulture', 'bird', ['#14080a', '#5a2a2a', '#8a4a3a', '#c48a6a', '#f4c542', '#ffffff', '#111111'], 150, 66, 34, 30, 300, 140, { drain: 0.2 }),
  mesagolem:  sgM('Mesa Golem', 'golem', ['#1a0a05', '#8a3a1a', '#c4602a', '#f09a5a', '#f4c542', '#ffffff', '#f4c542'], 290, 76, 58, 5, 400, 185, { heavy: { name: 'Mesa Slam', mult: 1.8, chance: 0.2, fx: 'slash' } }),
  scarab:     sgM('Sun Scarab', 'beetle', ['#1a1405', '#8a6b14', '#f4c542', '#fff3a0', '#c0392b', '#ffffff', '#111111'], 200, 68, 52, 14, 340, 160, { cast: { name: 'Solar Flare', power: 38, chance: 0.25, fx: 'fire' } }),
  // mini-bosses (one at the bottom of each new dungeon) and the Silent Herald (top of the Tower of Silence)
  glacierwyrm:sgM('The Glacier Wyrm', 'serpent', ['#05101a', '#2e6b9a', '#7fbfe8', '#e8f8ff', '#ffffff', '#ffffff', '#2e86c1'], 2600, 76, 46, 18, 3200, 2600, { boss: true, cast: { name: 'Frozen Breath', power: 50, chance: 0.35, all: true, fx: 'ice' }, heavy: { name: 'Ice Fang', mult: 1.9, chance: 0.2, fx: 'ice' } }),
  stormroc:   sgM('The Storm Roc', 'bird', ['#0a0a14', '#3a3f6b', '#6f7ac4', '#c8cff5', '#ffe04d', '#ffffff', '#ffe04d'], 2500, 78, 42, 30, 3200, 2600, { boss: true, cast: { name: 'Thunderstorm', power: 52, chance: 0.35, all: true, fx: 'bolt' }, heavy: { name: 'Talon Dive', mult: 1.9, chance: 0.2, fx: 'slash' } }),
  lichscribe: sgM('The Lich Scribe', 'sorcerer', ['#000000', '#0a1a0a', '#1a3a1a', '#3a6a3a', '#7fff7f', '#ffffff', '#7fff7f'], 2700, 80, 48, 20, 3400, 2800, { boss: true, specials: [{ name: 'Death Verse', power: 48, all: true, st: 'curse', stChance: 0.4, fx: 'dark' }, { name: 'Bone Quill', mult: 1.9, fx: 'slash' }], drain: 0.15 }),
  vinehydra:  sgM('The Vine Hydra', 'serpent', ['#051405', '#1a6b2a', '#4fbf5a', '#b8f0a8', '#ff4d6d', '#ffffff', '#ff4d6d'], 2600, 76, 46, 18, 3200, 2600, { boss: true, acts: 2, cast: { name: 'Thorn Lash', power: 40, chance: 0.3, all: true, st: 'poison', fx: 'slash' } }),
  mirequeen:  sgM('The Mire Queen', 'blot', ['#050a05', '#2a3a14', '#5a7a2a', '#a8c46a', '#f4c542', '#ffffff', '#c0392b'], 2800, 76, 50, 12, 3300, 2700, { boss: true, cast: { name: 'Swamp Tide', power: 50, chance: 0.35, all: true, st: 'poison', fx: 'wave' }, heavy: { name: 'Mud Crush', mult: 1.8, chance: 0.2, fx: 'slash' } }),
  canyonwyvern:sgM('The Canyon Wyvern', 'bird', ['#1a0505', '#8a2a14', '#d8602a', '#f8b07a', '#f4c542', '#ffffff', '#f4c542'], 2600, 80, 44, 26, 3300, 2700, { boss: true, cast: { name: 'Scorching Gale', power: 52, chance: 0.35, all: true, fx: 'fire' }, heavy: { name: 'Wyvern Claw', mult: 1.9, chance: 0.2, fx: 'slash' } }),
  herald:     sgM('The Silent Herald', 'knight', ['#000000', '#1a1a1a', '#3a3a3a', '#7a7a7a', '#f4c542', '#ffffff', '#f4c542'], 2600, 78, 50, 18, 3000, 2500, { boss: true, cast: { name: 'Hush', power: 46, chance: 0.3, all: true, st: 'curse', stChance: 0.3, fx: 'void' }, heavy: { name: 'Herald’s Edge', mult: 1.9, chance: 0.2, fx: 'slash' } }),
  // castle guards
  castleguard:sgM('Ink Sentinel', 'knight', ['#000000', '#14141c', '#2a2a40', '#5a5a80', '#e74c3c', '#ffffff', '#e74c3c'], 280, 80, 60, 16, 450, 200, { heavy: { name: 'Ink Halberd', mult: 1.8, chance: 0.22, fx: 'slash' } }),
});
/* the Unwriter waits in his own castle now, a little stronger to match the bigger journey */
Object.assign(SG_MONSTERS.unwriter, { hp: 4800, atk: 96, def: 48 });
Object.assign(SG_ZONES, {
  tundra: { list: [['frostwolf', 3], ['snowowl', 3], ['icecrab', 2], ['frostmoth', 2]], max: 4 }, icecave: { list: [['icegolem', 2], ['frostwolf', 2], ['frostmoth', 2], ['icecrab', 2]], max: 4 },
  crag: { list: [['cragrat', 3], ['thunderhawk', 3], ['stormimp', 2], ['ironbeetle', 2]], max: 4 }, mine: { list: [['boulder', 2], ['ironbeetle', 3], ['stormimp', 2], ['cragrat', 2]], max: 4 },
  blight: { list: [['inkooze', 3], ['blightwraith', 3], ['rotbat', 3], ['grimoire', 1]], max: 4 }, crypt: { list: [['hollowknight', 2], ['grimoire', 3], ['blightwraith', 2], ['rotbat', 2]], max: 4 },
  jungle: { list: [['vinesnake', 3], ['toadstool', 3], ['thornsprite', 2], ['parrot', 3]], max: 4 }, temple: { list: [['jbeetle', 3], ['vinesnake', 2], ['thornsprite', 2], ['toadstool', 2]], max: 4 },
  mire: { list: [['bogblob', 3], ['rotcap', 3], ['swampeel', 2], ['marshmoth', 2]], max: 4 }, barrow: { list: [['mudcrab', 3], ['swampeel', 2], ['rotcap', 2], ['bogblob', 2]], max: 4 },
  canyon: { list: [['coyote', 3], ['vulture', 3], ['saguaro', 2], ['scarab', 2]], max: 4 }, echocave: { list: [['mesagolem', 2], ['scarab', 3], ['coyote', 2], ['vulture', 2]], max: 4 },
  castle: { list: [['castleguard', 3], ['hollowknight', 2], ['grimoire', 2], ['blankpage', 2], ['inkgolem', 1]], max: 4 },
});
/* guards before each dungeon's sealed stairs */
const SG_REGION_GUARD = { north1: ['icegolem', 'frostwolf'], north2: ['boulder', 'thunderhawk'], north3: ['hollowknight', 'grimoire'], south1: ['jbeetle', 'vinesnake'], south2: ['mudcrab', 'rotcap'], south3: ['mesagolem', 'scarab'] };

SG_MAPS.north1 = { name: "Frostmark Tundra", song: "sg_snow", theme: "snow", rows: ["MMMMMMMMMMMMMMMMMMMMMMMMMMMM", "Mf...................f..f..M", "M..MMMMMM.f..h.............M", "MfMMMMMMM..........fff.....M", "M.MMMMMMM......f..fffffVf.hM", "M.MMMMMMM..f...ffffffffPfhfM", "M..MMMMMf....f..fffffffPff.M", "M...f.f.....f...fffffffPf.hM", "M........fh.U....ffffffP...M", "M.....PPPPPPPPPPPPPPPPPPPPPM", "M.f..hP.f....hP.f..f...f..PY", "M.ffh.z.f.f.h.P..........f.M", "M.....P..W....P...........fM", "Mh....WWWWWWW.P....hhhhh..fM", "M....hWWWWWWW.P...hhhhhhh..M", "M.ffffWWWWWWW.P.h.hhhhhhhh.M", "M.fffff......fPf..hhhhhhhf.M", "M.ffffff....f.P.f..hhhhhh..M", "Mffffff.f.f...P....ff......M", "M..fff.ff..ff.P......f....fM", "M..fffh....f..P.fff...f...hM", "MMMMMMMMMMMMMMYMMMMMMMMMMMMM"], zone: () => "tundra", seaZone: 'deepsea', warps: {}, npcs: [] };
SG_MAPS.north2 = { name: "Thundercrag Highlands", song: "sg_field", theme: "crag", rows: ["MMMMMMMMMMMMMMMMMMMMMMMMMMMM", "M.f..hf............f..f....M", "M..f..MM........f.......f..M", "M..hMMMMMVf...........MMMMMM", "M.MPPPPPPPM......hf...MMMMMM", "MMMMMMMMMPMM..f....h..MMMMMM", "M.MMMMMMMPM...f......h.....M", "M..MMMMMMP....h.h..f.hfh...M", "M........Ph..h........f..hPY", "Mf.......Phhhhhhhhhf......PM", "YP...fh.fPhhhhhhhhhhz.....PM", "MP......hPhhhhhhhhhhP.....PM", "MP...f.hhPhhhhhhhhhhP.f.f.PM", "MP.....f.PhhhhhhhhhhPMMMM.PM", "MP....f.fPhhhhhhhhhhPMMMMMPM", "MP.fffff.P.hhhhUhh.MPMMMMMPM", "MPPPPPPPPPPPPPPPPPPPPPPPPPPM", "M.hfffff......P....MMMMMMM.M", "Mf.f.f.......fP.....h.M....M", "M..f.f........P............M", "M.........f.fhP...fh....h.hM", "MMMMMMMMMMMMMMYMMMMMMMMMMMMM"], zone: () => "crag", seaZone: 'deepsea', warps: {}, npcs: [] };
SG_MAPS.north3 = { name: "Inkblight Wastes", song: "sg_tower", theme: "blight", rows: ["MMMMMMMMMMMMMMMMMMMMMMMMMMMM", "M....h.......f.....f..M..f.M", "M...............MMMMMMMMMM.M", "M...h...f......fMMMMMMMMMMMM", "M..hVfffff......MMMMMMMMMMMM", "M.f.Pffffff.f.h..h..M.....fM", "M..fPffffff.....f...hE.....M", "M...Pffffff.f.......fPf....M", "YP..Pffffff..h....f..Pf....M", "MP..P..ff...f.zhhhhhhP...h.M", "MPh.P.....fff.PhhhhhhPh....M", "MP.hP......f.hPhhhhhhPh....M", "MP.MPM..U.ff.fPhhhhhhPh.f..M", "MPPPPPPPPPPPPPPPPPPPPP....hM", "M..MMM......P.....f........M", "M.h.M.h.h..fP...h.......f..M", "Mf.......f.fP..f..f....f..hM", "Mf.......f..Q..............M", "WWWWWWWWWWWWWWWWWWWWWWWWWWWW", "WWWWWWWWWWWWWWWWWWWWWWWWWWWW", "WWWWWWWWWWWWWWWWWWWWWWWWWWWW", "WWWWWWWWWWWWWWWWWWWWWWWWWWWW"], zone: () => "blight", seaZone: 'deepsea', warps: {}, npcs: [] };
SG_MAPS.south1 = { name: "Verdant Wilds", song: "sg_jungle", theme: "jungle", rows: ["MMMMMMMMMMMMMMYMMMMMMMMMMMMM", "M.f...........P..........ffM", "M......f....h.P............M", "M...hffffff...P.f...fh..f..M", "M..ffffffff.f.Pf.....ff....M", "M.ffffffffff..P..f....V....M", "M..fffffffff.fPWh..f..P....M", "Mhffffffffff.WBWWW...fP...hM", "M..ffffffff.WWBWWW...fP.ff.M", "M..fffffff...WBWWW....P....M", "M....h.....f..P.......P...fM", "M...f..f....h.P.......P...PY", "M.....f.......PfffffffPf..PM", "M......f..U..fP.ffffffPff.PM", "M.fh......PPPPPPPPPPPPPPPPPM", "Mh.hhhhhf....h.ffPfffffffffM", "M.hhhhhh..f.hffffPffffffff.M", "M..hhhhh....f..ffPfffffff.hM", "M....h.f...f...f.zfffffff..M", "Mff.........f...fP.f.f.....M", "M.f........f...........f...M", "MMMMMMMMMMMMMMMMMMMMMMMMMMMM"], zone: () => "jungle", seaZone: 'deepsea', warps: {}, npcs: [] };
SG_MAPS.south2 = { name: "Mirefen Marsh", song: "sg_swamp", theme: "swamp", rows: ["MMMMMMMMMMMMMMYMMMMMMMMMMMMM", "M.f.........f.P.........f.hM", "M.f...........Ph.fh........M", "Mh......ff...fP.f........f.M", "Mf.....f.....hPffffff.z.f..M", "M.f....Wf.....PfffffffP....M", "M..f.WWWWWW...PfffffffPf..fM", "M....WWWWWWWf.PfffffffPff..M", "M...WWWWWWWWWfP.fffff.P....M", "M...fWWWWWWW..P.f.f...P...PY", "M.f.f.WWWWWfhfP.f..f..P...PM", "YP..hf..f..f.UP...f...Pf..PM", "MPPPPPPPPPPPPPPPPPPPPPPBPPPM", "M...P............WWWWWWW..fM", "Mf..P.........h..WWWWWWWf..M", "M..fV..h.f.......WWWWWWW...M", "M..hPhhhh.....h...WWWWWh...M", "M..hhhhhhhf..W.ff..Whf..h.hM", "Mfhhhhhhhh.WWWWW...h.......M", "M.....h....h..........h.f..M", "M.....h........f.f.h.f.h...M", "MMMMMMMMMMMMMMMMMMMMMMMMMMMM"], zone: () => "mire", seaZone: 'deepsea', warps: {}, npcs: [] };
SG_MAPS.south3 = { name: "Sunscorch Canyon", song: "sg_desert", theme: "canyon", rows: ["WWWWWWWWWWWWWWWWWWWWWWWWWWWW", "WWWWWWWWWWWWWWWWWWWWWWWWWWWW", "WWWWWWWWWWWWWWWWWWWWWWWWWWWW", "WWWWWWWWWWWWWWWWWWWWWWWWWWWW", "M...f..........Q....f.f....M", "M.........f....P.h..f..f...M", "M..h.f.....h...P...........M", "Mh.P...MMM.hhhhPhh..hhhhh..M", "M..Pf.MMMMMhhhhPhh.hhhhhhf.M", "YP.PPfMMMMMhhhhPhh.fhhhhh..M", "MP...MMMMMM....P.....fhf...M", "MP...hMMMMM..hfPU......f...M", "MPPPPPPPPPPPPPPPPPPPPPPPP..M", "M....P.MMM...f.f.MMMMM..P..M", "M....P.....hh....MMMMM..P..M", "M....P...........MMMMMf.Pf.M", "M....P..f....fM...MMMM..P..M", "M....z....MMMMMMM.......V.fM", "M....P....MMMMMMM.hf....P..M", "Mf...f...hMMMMMMM...hf....fM", "Mh..f....f...M..h...f.f....M", "MMMMMMMMMMMMMMMMMMMMMMMMMMMM"], zone: () => "canyon", seaZone: 'deepsea', warps: {}, npcs: [] };
const SG_PASS_BLOCK = ['Snow and fallen rock block the way.', 'King Aldous may know how to open the old roads north and south.'];
sgSetTile('field', 6, 0, 'Y'); sgSetTile('field', 10, 19, 'Y'); sgSetTile('seravel', 8, 0, 'Y'); sgSetTile('seravel', 13, 21, 'Y');
SG_MAPS.field.warps['6,0'] = { map: 'north1', x: 14, y: 20, dir: 'up', need: 'keyquest', block: SG_PASS_BLOCK };
SG_MAPS.north1.warps['14,21'] = { map: 'field', x: 6, y: 1, dir: 'down' };
SG_MAPS.field.warps['10,19'] = { map: 'south1', x: 14, y: 1, dir: 'down', need: 'keyquest', block: SG_PASS_BLOCK };
SG_MAPS.south1.warps['14,0'] = { map: 'field', x: 10, y: 18, dir: 'up' };
SG_MAPS.seravel.warps['8,0'] = { map: 'north2', x: 14, y: 20, dir: 'up', need: 'keyquest', block: SG_PASS_BLOCK };
SG_MAPS.north2.warps['14,21'] = { map: 'seravel', x: 8, y: 1, dir: 'down' };
SG_MAPS.seravel.warps['13,21'] = { map: 'south2', x: 14, y: 1, dir: 'down', need: 'keyquest', block: SG_PASS_BLOCK };
SG_MAPS.south2.warps['14,0'] = { map: 'seravel', x: 13, y: 20, dir: 'up' };
SG_MAPS.north1.warps['27,10'] = { map: 'north2', x: 1, y: 10, dir: 'right' };
SG_MAPS.north2.warps['0,10'] = { map: 'north1', x: 26, y: 10, dir: 'left' };
SG_MAPS.north2.warps['27,8'] = { map: 'north3', x: 1, y: 8, dir: 'right' };
SG_MAPS.north3.warps['0,8'] = { map: 'north2', x: 26, y: 8, dir: 'left' };
SG_MAPS.south1.warps['27,11'] = { map: 'south2', x: 1, y: 11, dir: 'right' };
SG_MAPS.south2.warps['0,11'] = { map: 'south1', x: 26, y: 11, dir: 'left' };
SG_MAPS.south2.warps['27,9'] = { map: 'south3', x: 1, y: 9, dir: 'right' };
SG_MAPS.south3.warps['0,9'] = { map: 'south2', x: 26, y: 9, dir: 'left' };
/* by boat: the top of the Eastern Isles sea leads to the Inkblight Wastes, the bottom to the Sunscorch Canyon */
for (let x = 1; x < 33; x++) {
  const rx = Math.max(1, Math.min(26, Math.round(x * 27 / 33)));
  SG_MAPS.eastsea.warps[`${x},0`] = { map: 'north3', x: rx, y: 20, dir: 'up', need: 'keyquest', block: ['Thick black fog hangs over the sea to the north.', 'King Aldous may know what lies beyond it.'] };
  SG_MAPS.eastsea.warps[`${x},25`] = { map: 'south3', x: rx, y: 1, dir: 'down', need: 'keyquest', block: ['A wall of storms blocks the southern sea.', 'King Aldous may know what lies beyond it.'] };
}
for (let x = 1; x < 27; x++) {
  const ex = Math.max(1, Math.min(32, Math.round(x * 33 / 27)));
  SG_MAPS.north3.warps[`${x},21`] = { map: 'eastsea', x: ex, y: 1, dir: 'down' };
  SG_MAPS.south3.warps[`${x},0`] = { map: 'eastsea', x: ex, y: 24, dir: 'up' };
}
Object.assign(SG_HARBOR, { north3: { map: 'north3', at: '12,18' }, south3: { map: 'south3', at: '15,3' } });
const SG_TOWN_REGION_MORE = { north1: 'Frostmark Tundra', north2: 'Thundercrag Highlands', north3: 'Inkblight Wastes', south1: 'Verdant Wilds', south2: 'Mirefen Marsh', south3: 'Sunscorch Canyon' };
sgNewTown('rimeholt', "Rimeholt", ["####################", "#.RRRR..T.T...NNNN.#", "#.HDHH........HHDH.#", "#..P............P..#", "#..PPPPPPPPPPPPPP..#", "#........PP........#", "#Tgggg...PP...RRRR.#", "#THDHH...PPT..HHDH.#", "#..P.....PP.....P..#", "#..PPPPPPPPPPPPPP..#", "#.T.....SPP........#", "#.RRRR...PP........#", "#THDHHT..PP..T.....#", "#..P.....PP........#", "#..PPPPPPPPPPPPPP..#", "#########PP#########"], { map: 'north1', x: 12, y: 9, dir: 'down' }, {"3,2": "inn", "16,2": "church", "3,7": "tavern", "16,7": "shop", "3,12": "smith"}, { theme: 'snow', song: 'sg_snow', inn: 70, shop: ['megaherb', 'antidote', 'inkflask', 'feather', 'phoenix'], smith: ['mythril', 'runestaff', 'galebow', 'nightedge', 'mythmail', 'starrobe', 'shadowgarb', 'tigerclaw'], spots: [[5, 13], [15, 5], [6, 5], [13, 3], [2, 8], [5, 5]] });
SG_MAPS.north1.warps['12,8'] = { map: 'rimeholt', x: 9, y: 14, dir: 'up' };
sgNewTown('stormwatch', "Stormwatch", ["####################", "#.gggg........RRRR.#", "#.HDHH.......hHHDH.#", "#..P............P..#", "#..PPPPPPPPPPPPPP..#", "#.h......PP........#", "#.NNNN...PP...RRRRh#", "#.HDHH...PP...HHDH.#", "#h.P.....PP.....P..#", "#..PPPPPPPPPPPPPP..#", "#.......SPP.h..h...#", "#..h.....PP...RRRR.#", "#.h....h.PP...HHDH.#", "#........PP.....P..#", "#..PPPPPPPPPPPPPP..#", "#########PP#########"], { map: 'north2', x: 15, y: 16, dir: 'down' }, {"3,2": "tavern", "16,2": "inn", "3,7": "church", "16,7": "smith", "16,12": "shop"}, { theme: 'crag', song: 'sg_town', inn: 70, shop: ['megaherb', 'antidote', 'inkflask', 'feather', 'phoenix'], smith: ['mythril', 'runestaff', 'galebow', 'nightedge', 'mythmail', 'starrobe', 'shadowgarb', 'tigerclaw'], spots: [[16, 5], [6, 8], [7, 7], [13, 9], [2, 8], [13, 6]] });
SG_MAPS.north2.warps['15,15'] = { map: 'stormwatch', x: 9, y: 14, dir: 'up' };
sgNewTown('hollowmere', "Hollowmere", ["####################", "#TNNNN......T.RRRR.#", "#.HDHH........HHDH.#", "#..P.........T..P..#", "#..PPPPPPPPPPPPPP.T#", "#........PP........#", "#.RRRR...PP...gggg.#", "#.HDHH...PP...HHDH.#", "#..P..T..PP.....P..#", "#..PPPPPPPPPPPPPP..#", "#T......SPP..T.....#", "#.RRRR...PP...RRRR.#", "#THDHH...PP...HHDH.#", "#..P.....PP.....P..#", "#..PPPPPPPPPPPPPPT.#", "#########PP#########"], { map: 'north3', x: 8, y: 13, dir: 'down' }, {"3,2": "church", "16,2": "shop", "3,7": "inn", "16,7": "tavern", "3,12": "smith", "16,12": "chronicle"}, { theme: 'blight', song: 'sg_tower', inn: 80, shop: ['megaherb', 'antidote', 'inkflask', 'feather', 'phoenix'], smith: ['mythril', 'runestaff', 'galebow', 'nightedge', 'mythmail', 'starrobe', 'shadowgarb', 'tigerclaw'], spots: [[13, 9], [11, 12], [12, 8], [17, 9], [13, 11], [13, 5]] });
SG_MAPS.north3.warps['8,12'] = { map: 'hollowmere', x: 9, y: 14, dir: 'up' };
sgNewTown('thornvale', "Thornvale", ["####################", "#.RRRR........gggg.#", "#.HDHH........HHDH.#", "#..P............P.F#", "#..PPPPPPPPPPPPPP..#", "#........PP..T...T.#", "#.RRRR...PP..FNNNN.#", "#.HDHH...PP..THHDH.#", "#..P.....PP.....P..#", "#..PPPPPPPPPPPPPP..#", "#.......SPPF.......#", "#.RRRR...PP.....F..#", "#FHDHH...PP........#", "#..P.....PP......T.#", "#..PPPPPPPPPPPPPP..#", "#########PP#########"], { map: 'south1', x: 10, y: 14, dir: 'down' }, {"3,2": "inn", "16,2": "tavern", "3,7": "shop", "16,7": "church", "3,12": "smith"}, { theme: 'jungle', song: 'sg_jungle', inn: 70, shop: ['megaherb', 'antidote', 'inkflask', 'feather', 'phoenix'], smith: ['mythril', 'runestaff', 'galebow', 'nightedge', 'mythmail', 'starrobe', 'shadowgarb', 'tigerclaw'], spots: [[15, 8], [12, 4], [8, 12], [5, 3], [12, 6], [4, 3]] });
SG_MAPS.south1.warps['10,13'] = { map: 'thornvale', x: 9, y: 14, dir: 'up' };
sgNewTown('bogsend', "Bogsend", ["####################", "#.RRRR........NNNN.#", "#.HDHH........HHDH.#", "#..P............P..#", "#..PPPPPPPPPPPPPP..#", "#........PP........#", "#.gggg...PP...RRRR.#", "#.HDHH...PP...HHDH.#", "#..P.....PP.....P..#", "#..PPPPPPPPPPPPPP..#", "#.......SPP........#", "#T.T.T...PP..TRRRRT#", "#.TT.....PP..THHDH.#", "#........PP.....P..#", "#..PPPPPPPPPPPPPPT.#", "#########PP#########"], { map: 'south2', x: 13, y: 12, dir: 'down' }, {"3,2": "shop", "16,2": "church", "3,7": "tavern", "16,7": "inn", "16,12": "smith"}, { theme: 'swamp', song: 'sg_swamp', inn: 70, shop: ['megaherb', 'antidote', 'inkflask', 'feather', 'phoenix'], smith: ['mythril', 'runestaff', 'galebow', 'nightedge', 'mythmail', 'starrobe', 'shadowgarb', 'tigerclaw'], spots: [[16, 10], [8, 11], [15, 10], [4, 5], [3, 10], [6, 9]] });
SG_MAPS.south2.warps['13,11'] = { map: 'bogsend', x: 9, y: 14, dir: 'up' };
sgNewTown('redrock', "Redrock", ["####################", "#.gggg...h.h..RRRR.#", "#.HDHH.....h..HHDH.#", "#h.P............P..#", "#..PPPPPPPPPPPPPP..#", "#........PP........#", "#.RRRR...PP...RRRR.#", "#.HDHHh..PP...HHDH.#", "#..P.....PP.....P..#", "#..PPPPPPPPPPPPPP..#", "#.......SPP.h......#", "#.NNNN...PP........#", "#.HDHH...PP...h....#", "#..P...h.PP....h...#", "#..PPPPPPPPPPPPPP..#", "#########PP#########"], { map: 'south3', x: 16, y: 12, dir: 'down' }, {"3,2": "tavern", "16,2": "inn", "3,7": "smith", "16,7": "shop", "3,12": "church"}, { theme: 'canyon', song: 'sg_desert', inn: 75, shop: ['megaherb', 'antidote', 'inkflask', 'feather', 'phoenix'], smith: ['mythril', 'runestaff', 'galebow', 'nightedge', 'mythmail', 'starrobe', 'shadowgarb', 'tigerclaw'], spots: [[7, 2], [11, 6], [12, 6], [12, 3], [14, 4], [8, 8]] });
SG_MAPS.south3.warps['16,11'] = { map: 'redrock', x: 9, y: 14, dir: 'up' };
SG_MAPS.frost1 = { name: 'Hoarfrost Cavern · 1F', song: 'sg_cave', theme: 'ice', zone: () => 'icecave',
  gen: { w: 20, h: 18, seed: 1101, theme: 'cave', points: [[9, 15], [16, 11], [3, 9], [14, 5], [5, 2]], open: 0.55, grass: 0.5 },
  upTo: { map: 'north1', x: 23, y: 5, dir: 'down' }, downTo: 'frost2',
  objs: [{ id: 'frostc1', type: 'chest', at: 0.2, give: { megaherb: 2 } }, { id: 'frostc2', type: 'chest', at: 0.4, give: { gold: 1500 } }, { id: 'frostl1', type: 'lockChest', at: 0.6, give: { inkflask: 2 } },
    { id: 'frostg1', type: 'foeSpot', at: 0.75, group: SG_REGION_GUARD.north1, lines: ['The way ahead is guarded!'] }, { id: 'frostseal', type: 'seal', at: 1 }] };
SG_MAPS.frost2 = { name: 'Hoarfrost Cavern · 2F', song: 'sg_cave', theme: 'ice', zone: () => 'icecave',
  gen: { w: 20, h: 20, seed: 1102, theme: 'cave', points: [[10, 17], [4, 12], [15, 9], [6, 5], [13, 2]], open: 0.55, grass: 0.5 },
  upTo: 'frost1',
  objs: [{ id: 'frostc3', type: 'chest', at: 0.25, give: { phoenix: 2 } }, { id: 'frostl2', type: 'lockChest', at: 0.5, give: { gear: 'mythmail' } }, { id: 'frostc4', type: 'chest', at: 0.75, give: { megaherb: 3 } },
    { id: 'glacierwyrm', type: 'boss', at: 0.93, group: ['glacierwyrm'], story: 'glacierwyrm' }, { id: 'frostprize', type: 'chest', at: 1, give: { gear: 'starrobe', gold: 2500 }, guard: 'glacierwyrm', story: 'glacierwyrmPrize' }] };
SG_MAPS.north1.warps['23,4'] = { map: 'frost1', at: 'start' };
SG_MAPS.mine1 = { name: 'Thunder Mine · 1F', song: 'sg_cave', theme: 'crag', zone: () => 'mine',
  gen: { w: 20, h: 18, seed: 2201, theme: 'cave', points: [[9, 15], [16, 11], [3, 9], [14, 5], [5, 2]], open: 0.55, grass: 0.5 },
  upTo: { map: 'north2', x: 9, y: 4, dir: 'down' }, downTo: 'mine2',
  objs: [{ id: 'minec1', type: 'chest', at: 0.2, give: { megaherb: 2 } }, { id: 'minec2', type: 'chest', at: 0.4, give: { gold: 1500 } }, { id: 'minel1', type: 'lockChest', at: 0.6, give: { inkflask: 2 } },
    { id: 'mineg1', type: 'foeSpot', at: 0.75, group: SG_REGION_GUARD.north2, lines: ['The way ahead is guarded!'] }, { id: 'mineseal', type: 'seal', at: 1 }] };
SG_MAPS.mine2 = { name: 'Thunder Mine · 2F', song: 'sg_cave', theme: 'crag', zone: () => 'mine',
  gen: { w: 20, h: 20, seed: 2202, theme: 'cave', points: [[10, 17], [4, 12], [15, 9], [6, 5], [13, 2]], open: 0.55, grass: 0.5 },
  upTo: 'mine1',
  objs: [{ id: 'minec3', type: 'chest', at: 0.25, give: { phoenix: 2 } }, { id: 'minel2', type: 'lockChest', at: 0.5, give: { gear: 'galebow' } }, { id: 'minec4', type: 'chest', at: 0.75, give: { megaherb: 3 } },
    { id: 'stormroc', type: 'boss', at: 0.93, group: ['stormroc'], story: 'stormroc' }, { id: 'mineprize', type: 'chest', at: 1, give: { gear: 'nightedge', gold: 2500 }, guard: 'stormroc', story: 'stormrocPrize' }] };
SG_MAPS.north2.warps['9,3'] = { map: 'mine1', at: 'start' };
SG_MAPS.crypt1 = { name: 'Blighted Crypt · 1F', song: 'sg_cave', theme: 'blight', zone: () => 'crypt',
  gen: { w: 20, h: 18, seed: 3301, theme: 'cave', points: [[9, 15], [16, 11], [3, 9], [14, 5], [5, 2]], open: 0.55, grass: 0.5 },
  upTo: { map: 'north3', x: 4, y: 5, dir: 'down' }, downTo: 'crypt2',
  objs: [{ id: 'cryptc1', type: 'chest', at: 0.2, give: { megaherb: 2 } }, { id: 'cryptc2', type: 'chest', at: 0.4, give: { gold: 1500 } }, { id: 'cryptl1', type: 'lockChest', at: 0.6, give: { inkflask: 2 } },
    { id: 'cryptg1', type: 'foeSpot', at: 0.75, group: SG_REGION_GUARD.north3, lines: ['The way ahead is guarded!'] }, { id: 'cryptseal', type: 'seal', at: 1 }] };
SG_MAPS.crypt2 = { name: 'Blighted Crypt · 2F', song: 'sg_cave', theme: 'blight', zone: () => 'crypt',
  gen: { w: 20, h: 20, seed: 3302, theme: 'cave', points: [[10, 17], [4, 12], [15, 9], [6, 5], [13, 2]], open: 0.55, grass: 0.5 },
  upTo: 'crypt1',
  objs: [{ id: 'cryptc3', type: 'chest', at: 0.25, give: { phoenix: 2 } }, { id: 'cryptl2', type: 'lockChest', at: 0.5, give: { gear: 'runestaff' } }, { id: 'cryptc4', type: 'chest', at: 0.75, give: { megaherb: 3 } },
    { id: 'lichscribe', type: 'boss', at: 0.93, group: ['lichscribe'], story: 'lichscribe' }, { id: 'cryptprize', type: 'chest', at: 1, give: { gear: 'shadowgarb', gold: 2500 }, guard: 'lichscribe', story: 'lichscribePrize' }] };
SG_MAPS.north3.warps['4,4'] = { map: 'crypt1', at: 'start' };
SG_MAPS.temple1 = { name: 'Overgrown Temple · 1F', song: 'sg_cave', theme: 'ruins', zone: () => 'temple',
  gen: { w: 20, h: 18, seed: 4401, theme: 'cave', points: [[9, 15], [16, 11], [3, 9], [14, 5], [5, 2]], open: 0.55, grass: 0.5 },
  upTo: { map: 'south1', x: 22, y: 6, dir: 'down' }, downTo: 'temple2',
  objs: [{ id: 'templec1', type: 'chest', at: 0.2, give: { megaherb: 2 } }, { id: 'templec2', type: 'chest', at: 0.4, give: { gold: 1500 } }, { id: 'templel1', type: 'lockChest', at: 0.6, give: { inkflask: 2 } },
    { id: 'templeg1', type: 'foeSpot', at: 0.75, group: SG_REGION_GUARD.south1, lines: ['The way ahead is guarded!'] }, { id: 'templeseal', type: 'seal', at: 1 }] };
SG_MAPS.temple2 = { name: 'Overgrown Temple · 2F', song: 'sg_cave', theme: 'ruins', zone: () => 'temple',
  gen: { w: 20, h: 20, seed: 4402, theme: 'cave', points: [[10, 17], [4, 12], [15, 9], [6, 5], [13, 2]], open: 0.55, grass: 0.5 },
  upTo: 'temple1',
  objs: [{ id: 'templec3', type: 'chest', at: 0.25, give: { phoenix: 2 } }, { id: 'templel2', type: 'lockChest', at: 0.5, give: { gear: 'mythril' } }, { id: 'templec4', type: 'chest', at: 0.75, give: { megaherb: 3 } },
    { id: 'vinehydra', type: 'boss', at: 0.93, group: ['vinehydra'], story: 'vinehydra' }, { id: 'templeprize', type: 'chest', at: 1, give: { gear: 'tigerclaw', gold: 2500 }, guard: 'vinehydra', story: 'vinehydraPrize' }] };
SG_MAPS.south1.warps['22,5'] = { map: 'temple1', at: 'start' };
SG_MAPS.barrow1 = { name: 'Drowned Barrow · 1F', song: 'sg_cave', theme: 'mire', zone: () => 'barrow',
  gen: { w: 20, h: 18, seed: 5501, theme: 'cave', points: [[9, 15], [16, 11], [3, 9], [14, 5], [5, 2]], open: 0.55, grass: 0.5 },
  upTo: { map: 'south2', x: 4, y: 16, dir: 'down' }, downTo: 'barrow2',
  objs: [{ id: 'barrowc1', type: 'chest', at: 0.2, give: { megaherb: 2 } }, { id: 'barrowc2', type: 'chest', at: 0.4, give: { gold: 1500 } }, { id: 'barrowl1', type: 'lockChest', at: 0.6, give: { inkflask: 2 } },
    { id: 'barrowg1', type: 'foeSpot', at: 0.75, group: SG_REGION_GUARD.south2, lines: ['The way ahead is guarded!'] }, { id: 'barrowseal', type: 'seal', at: 1 }] };
SG_MAPS.barrow2 = { name: 'Drowned Barrow · 2F', song: 'sg_cave', theme: 'mire', zone: () => 'barrow',
  gen: { w: 20, h: 20, seed: 5502, theme: 'cave', points: [[10, 17], [4, 12], [15, 9], [6, 5], [13, 2]], open: 0.55, grass: 0.5 },
  upTo: 'barrow1',
  objs: [{ id: 'barrowc3', type: 'chest', at: 0.25, give: { phoenix: 2 } }, { id: 'barrowl2', type: 'lockChest', at: 0.5, give: { gear: 'starrobe' } }, { id: 'barrowc4', type: 'chest', at: 0.75, give: { megaherb: 3 } },
    { id: 'mirequeen', type: 'boss', at: 0.93, group: ['mirequeen'], story: 'mirequeen' }, { id: 'barrowprize', type: 'chest', at: 1, give: { gear: 'mythmail', gold: 2500 }, guard: 'mirequeen', story: 'mirequeenPrize' }] };
SG_MAPS.south2.warps['4,15'] = { map: 'barrow1', at: 'start' };
SG_MAPS.echo1 = { name: 'Echo Canyon Caves · 1F', song: 'sg_cave', theme: 'canyon', zone: () => 'echocave',
  gen: { w: 20, h: 18, seed: 6601, theme: 'cave', points: [[9, 15], [16, 11], [3, 9], [14, 5], [5, 2]], open: 0.55, grass: 0.5 },
  upTo: { map: 'south3', x: 24, y: 18, dir: 'down' }, downTo: 'echo2',
  objs: [{ id: 'echoc1', type: 'chest', at: 0.2, give: { megaherb: 2 } }, { id: 'echoc2', type: 'chest', at: 0.4, give: { gold: 1500 } }, { id: 'echol1', type: 'lockChest', at: 0.6, give: { inkflask: 2 } },
    { id: 'echog1', type: 'foeSpot', at: 0.75, group: SG_REGION_GUARD.south3, lines: ['The way ahead is guarded!'] }, { id: 'echoseal', type: 'seal', at: 1 }] };
SG_MAPS.echo2 = { name: 'Echo Canyon Caves · 2F', song: 'sg_cave', theme: 'canyon', zone: () => 'echocave',
  gen: { w: 20, h: 20, seed: 6602, theme: 'cave', points: [[10, 17], [4, 12], [15, 9], [6, 5], [13, 2]], open: 0.55, grass: 0.5 },
  upTo: 'echo1',
  objs: [{ id: 'echoc3', type: 'chest', at: 0.25, give: { phoenix: 2 } }, { id: 'echol2', type: 'lockChest', at: 0.5, give: { gear: 'galebow' } }, { id: 'echoc4', type: 'chest', at: 0.75, give: { megaherb: 3 } },
    { id: 'canyonwyvern', type: 'boss', at: 0.93, group: ['canyonwyvern'], story: 'canyonwyvern' }, { id: 'echoprize', type: 'chest', at: 1, give: { gear: 'mythril', gold: 2500 }, guard: 'canyonwyvern', story: 'canyonwyvernPrize' }] };
SG_MAPS.south3.warps['24,17'] = { map: 'echo1', at: 'start' };
SG_MAPS.north3.warps['21,6'] = { map: 'castle1', x: 7, y: 11, dir: 'up', need: 'keysAll', block: ['Black gates as tall as trees. Three empty sockets glow faintly in the stone:', 'a quill, an inkwell and a star. Without all three keys, the castle will not open.'] };
const SG_PLACES_MORE = {"north1": {"12,8": ["Rimeholt", "rimeholt"], "23,4": ["Hoarfrost Cavern", "frost1"]}, "north2": {"15,15": ["Stormwatch", "stormwatch"], "9,3": ["Thunder Mine", "mine1"]}, "north3": {"8,12": ["Hollowmere", "hollowmere"], "4,4": ["Blighted Crypt", "crypt1"], "21,6": ["Castle Unwritten", "castle1"]}, "south1": {"10,13": ["Thornvale", "thornvale"], "22,5": ["Overgrown Temple", "temple1"]}, "south2": {"13,11": ["Bogsend", "bogsend"], "4,15": ["Drowned Barrow", "barrow1"]}, "south3": {"16,11": ["Redrock", "redrock"], "24,17": ["Echo Canyon Caves", "echo1"]}};
(SG_MAPS.north2.objs ||= []).push({ id: 'key1', type: 'hidden', x: 3, y: 3, give: { flag: 'key1' }, story: 'key1' });
(SG_MAPS.south1.objs ||= []).push({ id: 'key2', type: 'hidden', x: 24, y: 17, give: { flag: 'key2' }, story: 'key2' });
(SG_MAPS.south3.objs ||= []).push({ id: 'key3', type: 'hidden', x: 3, y: 6, give: { flag: 'key3' }, story: 'key3' });
SG_MAPS.north1.npcs.push({ id: 'north1priest', x: 14, y: 9, dir: 'down', look: 'priest', priest: true, name: 'Wandering priest' });
SG_MAPS.north2.npcs.push({ id: 'north2priest', x: 14, y: 16, dir: 'down', look: 'priest', priest: true, name: 'Wandering priest' });
SG_MAPS.north3.npcs.push({ id: 'north3priest', x: 14, y: 13, dir: 'down', look: 'priest', priest: true, name: 'Wandering priest' });
SG_MAPS.south1.npcs.push({ id: 'south1priest', x: 14, y: 14, dir: 'down', look: 'priest', priest: true, name: 'Wandering priest' });
SG_MAPS.south2.npcs.push({ id: 'south2priest', x: 16, y: 12, dir: 'down', look: 'priest', priest: true, name: 'Wandering priest' });
SG_MAPS.south3.npcs.push({ id: 'south3priest', x: 15, y: 12, dir: 'down', look: 'priest', priest: true, name: 'Wandering priest' });

/* ---------- People in the new towns, and their taverns and churches ---------- */
const SG_NEW_TOWNS = {
  rimeholt:   { priest: 'Mother Frida', barkeep: 'Olaf', talk: [['man', 'The Hoarfrost Cavern is north-east of town. Something huge sleeps in the ice down there.'], ['elder', 'The old road south goes back to Aldermere. The King opened it for you, they say.']],
    folk: [['man', 'Keep warm! The Frost Wolves hunt in packs out on the tundra.'], ['lass', 'East of here the land turns to rock and thunder: the Thundercrag Highlands.'], ['kid', 'I built a snow knight yesterday. It has a sword made of an icicle!']] },
  stormwatch: { priest: 'Brother Hale', barkeep: 'Greta', talk: [['man', 'The Dawn Quill? A shepherd swore she saw a golden glint on the peak above the old mine, in the north-west.'], ['elder', 'The Thunder Mine runs deep. A Storm Roc nests at the bottom.']],
    folk: [['man', 'Thunder Hawks steal our hats. Every. Single. Day.'], ['elder', 'Further east the land goes black. Nothing grows in the Inkblight Wastes.'], ['lass', 'The mine’s gold paid for this town. Now monsters dig there instead.']] },
  hollowmere: { priest: 'Father Grey', barkeep: 'Mags', talk: [['guard', 'Castle Unwritten is east of town. Its gate has three sockets: a quill, an inkwell and a star.'], ['elder', 'Inside the castle, the old guards say, the doors only open for the clever. Levers, plates and talking statues.']],
    folk: [['man', 'We are the last town before the castle. Buy Holy water: the wraiths out there love curses.'], ['lass', 'The Blighted Crypt is north-west of here. A Lich Scribe writes death verses down there.'], ['kid', 'Mum says not to look at the castle at night. I looked. It looked back.']] },
  thornvale:  { priest: 'Sister Ivy', barkeep: 'Kofi', talk: [['man', 'The Dusk Inkwell? Old Ma Wren talks about a grove nobody can find, deep in the trees in the south-east.'], ['lass', 'The Overgrown Temple is north-east. A Vine Hydra grew out of the floor in there!']],
    folk: [['man', 'Vine Serpents bite. Carry Antidotes, always.'], ['elder', 'North is Aldermere. East is the Mirefen Marsh. Mind your boots.'], ['kid', 'A parrot taught me a rude word. I won’t say it.']] },
  bogsend:    { priest: 'Brother Moss', barkeep: 'Pip', talk: [['man', 'The Drowned Barrow is south-west of town, past the reeds. The Mire Queen rules it.'], ['elder', 'The canyon east of here is dry as bone. Opposite of here, really.']],
    folk: [['man', 'Rot Caps puff poison. Hold your breath. Or just bring Antidotes.'], ['lass', 'The road north goes back up to Seravel, through the canyon road.'], ['kid', 'I caught a frog the size of my head! Then it caught me.']] },
  redrock:    { priest: 'Mother Sol', barkeep: 'Dusty', talk: [['man', 'The Star Seal? There’s a gully in the far west, past the red cliffs, where the stars fall at night.'], ['elder', 'The Echo Canyon Caves are south-east. A Canyon Wyvern roosts at the bottom.']],
    folk: [['man', 'The sea north of here leads back to the Eastern Isles, if you have a boat.'], ['lass', 'Sun Scarabs flash so bright you can’t see. Squint!'], ['kid', 'Yell in the canyon and it yells back. I yelled my name forty times.']] },
};
for (const [tid, info] of Object.entries(SG_NEW_TOWNS)) {
  const t = SG_MAPS[tid], spots = t.spots || [];
  const looks = ['man', 'lass', 'kid', 'elder'];
  t.npcs = info.folk.map(([look, line], i) => { const [x, y] = spots[i] || [5 + i * 3, 5]; return { id: tid + 'f' + i, x, y, dir: 'down', look, lines: [line], wander: i === 0 ? 1 : 0 }; });
  if (spots[3]) t.npcs.push({ id: tid + 'chat', x: spots[3][0], y: spots[3][1], dir: 'down', look: looks[3], chat: true });
  const door = k => Object.entries(t.doors).find(([, v]) => v === k)[0].split(',').map(Number), [tx, ty] = door('tavern'), [cx, cy] = door('church');
  const tspots = [[3, 4, 'left'], [6, 6, 'left'], [10, 3, 'down'], [1, 6, 'right']];
  SG_MAPS[tid + '_tav'] = { name: `${t.name} · Tavern`, song: 'sg_tavern', inside: true, theme: 'tavern', rows: SG_TAVERN_ROWS, exitTo: { map: tid, x: tx, y: ty + 1, dir: 'down' }, entry: { x: 5, y: 8 },
    npcs: [{ id: 'barkeep', x: 5, y: 1, dir: 'down', look: 'barkeep', barkeep: true, name: info.barkeep },
      ...info.talk.map(([look, line], i) => { const [x, y, dir] = tspots[i]; return { id: 'tv' + i, x, y, dir, look, lines: [line] }; }),
      { id: 'tvchat', x: 9, y: 7, dir: 'left', look: 'man', chat: true, wander: 1 }] };
  SG_MAPS[tid + '_church'] = { name: `${t.name} · Church`, song: 'sg_church', inside: true, theme: 'church', rows: SG_CHURCH_ROWS, exitTo: { map: tid, x: cx, y: cy + 1, dir: 'down' }, entry: { x: 5, y: 8 },
    npcs: [{ id: 'priest', x: 5, y: 2, dir: 'down', look: 'priest', priest: true, name: info.priest },
      { id: 'pilgrim', x: 9, y: 4, dir: 'up', look: 'elder', lines: ['Pray, rest, and be brave. The Unwriter fears words spoken with courage.'] }] };
  t.tavern = tid + '_tav'; t.church = tid + '_church';
}

/* ---------- Castle Unwritten: three floors of puzzles, then the throne ----------
   1F  The Hall of Flames: three linked levers open the gate (each lever also flips its neighbor).
   2F  The Hall of Hours: step on the four plates in the right order.
   3F  The Hall of Voices: three statues each ask you a word. Answer all three, then face the Unwriter. */
SG_WALK.add('E');
Object.assign(SG_MAPS, {
  castle1: { name: 'Castle Unwritten · Hall of Flames', song: 'sg_tower', theme: 'castle', zone: () => 'castle', rows: [
    'XXXXXXXXXXXXXXXX',
    'XXXXXXX>XXXXXXXX',
    'XCCCCCCJCCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCXXCCCCXXCCCX',
    'XCCCXXCCCCXXCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCC<CCCCCCCX',
    'XXXXXXXXXXXXXXXX'],
    start: { x: 7, y: 11 }, upTo: { map: 'north3', x: 21, y: 7, dir: 'down' }, downTo: 'castle2', stairs: { x: 7, y: 1 }, gates: { '7,2': 'cg1' },
    objs: [{ id: 'lv_sun', type: 'lever', x: 3, y: 4, label: 'Sun', group: 'hall1' }, { id: 'lv_moon', type: 'lever', x: 7, y: 4, label: 'Moon', group: 'hall1' }, { id: 'lv_star', type: 'lever', x: 11, y: 4, label: 'Star', group: 'hall1' },
      { id: 'pl1', type: 'plaque', x: 9, y: 11, lines: ['🪨 Words are carved into the stone:', '“Wake the Sun and the Star, but let the Moon sleep.”', '“Beware: every lever stirs the one beside it.”'] },
      { id: 'cg_guard', type: 'foeSpot', x: 7, y: 6, group: ['castleguard', 'castleguard'], lines: ['Two Ink Sentinels step out of the shadows!'] }] },
  castle2: { name: 'Castle Unwritten · Hall of Hours', song: 'sg_tower', theme: 'castle', zone: () => 'castle', rows: [
    'XXXXXXXXXXXXXXXX',
    'XXXXXXXX>XXXXXXX',
    'XCCCCCCCJCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCXXCCCCCCXXCCX',
    'XCCXXCCCCCCXXCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCXXCCCCCCXXCCX',
    'XCCXXCCCCCCXXCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCC<CCCCCCX',
    'XXXXXXXXXXXXXXXX'],
    start: { x: 8, y: 11 }, upTo: 'castle1', downTo: 'castle3', stairs: { x: 8, y: 1 }, gates: { '8,2': 'cg2' },
    objs: [{ id: 'pq_quill', type: 'plate', x: 2, y: 3, symbol: '🪶', order: 0, group: 'hall2' }, { id: 'pq_sun', type: 'plate', x: 13, y: 3, symbol: '☀️', order: 1, group: 'hall2' },
      { id: 'pq_moon', type: 'plate', x: 13, y: 10, symbol: '🌙', order: 2, group: 'hall2' }, { id: 'pq_star', type: 'plate', x: 2, y: 10, symbol: '⭐', order: 3, group: 'hall2' },
      { id: 'pl2', type: 'plaque', x: 10, y: 11, lines: ['🪨 A poem is carved into the stone:', '“First the quill writes the dawn, then the sun climbs high,”', '“the moon follows after, and a star closes the sky.”', 'Four plates are set into the floor: 🪶 ☀️ 🌙 ⭐'] }] },
  castle3: { name: 'Castle Unwritten · Hall of Voices', song: 'sg_tower', theme: 'castle', zone: () => 'castle', rows: [
    'XXXXXXXXXXXXXXXX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XXXXXXXJJXXXXXXX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCCCCCCCCCX',
    'XCCCCCCC<CCCCCCX',
    'XXXXXXXXXXXXXXXX'],
    start: { x: 8, y: 10 }, upTo: 'castle2', gates: { '7,4': 'cg3', '8,4': 'cg3' },
    objs: [{ id: 'st1', type: 'statue', x: 3, y: 6, group: 'hall3', name: 'The Statue of Dawn' }, { id: 'st2', type: 'statue', x: 7, y: 6, group: 'hall3', name: 'The Statue of Noon' },
      { id: 'st3', type: 'statue', x: 12, y: 6, group: 'hall3', name: 'The Statue of Dusk' },
      { id: 'pl3', type: 'plaque', x: 10, y: 10, lines: ['🪨 “Speak true words to the three statues, and the last door will open.”'] },
      { id: 'unwriter', type: 'boss', x: 7, y: 2, group: ['unwriter'], story: 'unwriter' },
      { id: 'lexicon', type: 'chest', x: 8, y: 1, give: { flag: 'lexicon' }, guard: 'unwriter', story: 'lexicon' }] },
});
/* the Tower of Silence now ends with the Silent Herald, who guards the last shards */
{ const t3 = SG_MAPS.tower3.objs, u = t3.find(o => o.id === 'unwriter'), c = t3.find(o => o.id === 'lexicon');
  Object.assign(u, { id: 'herald', group: ['herald'], story: 'herald' }); Object.assign(c, { id: 'allshards', give: { flag: 'allshards' }, guard: 'herald', story: 'allshards' }); }

/* ---------- Story ---------- */
Object.assign(SG_STORY, {
  herald: ['At the top of the tower, a knight in black armor stands perfectly still.', 'He has no mouth. When he speaks, the words appear in the air like smoke.', 'The Silent Herald: My master is not here. But his shards are. And I will keep them.'],
  heraldWin: ['The Herald’s armor falls apart, empty. A last smoky word drifts away: “castle”.', 'Behind him, the shards of the Lexicon glow on a stone table.'],
  allshards: n => ['💎 You found the <b>last Lexicon Shards</b>! Every shard is together at last, but they are silent.', 'The Unwriter has hidden away the Lexicon’s voice.', `Take the shards home to King Aldous in Quillhaven, ${n}.`],
  kingKeys: n => [`King Aldous: ${n}… all the shards. I never dreamed I would see the whole Lexicon again.`, 'But listen: it does not sing. The Unwriter has locked its voice away in <b>Castle Unwritten</b>, in the Inkblight Wastes far to the north-east.',
    'The castle gate opens only for three keys, hidden long ago at the edges of the world:', '🪶 the <b>Dawn Quill</b>, high in the Thundercrag Highlands in the north,',
    '🫙 the <b>Dusk Inkwell</b>, lost in the Verdant Wilds in the south,', '⭐ and the <b>Star Seal</b>, fallen into the Sunscorch Canyon in the far south.',
    'I have ordered the old roads opened: north and south of Aldermere, north and south of Seravel. Your ship can sail north and south from the Eastern Isles too.',
    'Ask in the taverns. People remember more than they think. Go, and bring back our words!'],
  kingKeysAgain: () => { const f = sgS().flags, have = [f.key1 && '🪶 Dawn Quill', f.key2 && '🫙 Dusk Inkwell', f.key3 && '⭐ Star Seal'].filter(Boolean);
    return have.length === 3 ? ['King Aldous: All three keys! Castle Unwritten is in the Inkblight Wastes, far to the north-east. End this, hero.']
      : [`King Aldous: You have ${have.length ? have.join(', ') : 'none of the keys yet'}.`, 'The Dawn Quill is in the north highlands, the Dusk Inkwell in the southern wilds, the Star Seal in the far southern canyon.']; },
  key1: ['✨ Something glints between the rocks… you dig it out.', '🪶 You found the <b>Dawn Quill</b>! A golden quill that writes light. (Key 1 of 3)'],
  key2: ['✨ Deep in the trees, a little pool of shadow… no, an inkwell, sitting on a mossy stone.', '🫙 You found the <b>Dusk Inkwell</b>! Its ink is the color of the evening sky. (Key 2 of 3)'],
  key3: ['✨ Something in the dust of the gully twinkles like a fallen star.', '⭐ You found the <b>Star Seal</b>! A silver seal shaped like a star. (Key 3 of 3)'],
  keysAll: ['🔑 The quill, the inkwell and the star hum together in your bag.', 'Castle Unwritten’s gate will open for you now. It stands in the Inkblight Wastes, in the far north-east.'],
  glacierwyrm: ['The cave floor is a frozen lake. Under the ice, two cold eyes open.', 'A wyrm of ice smashes up through the floor!'], glacierwyrmWin: ['The Glacier Wyrm shatters into a thousand glittering pieces.'],
  stormroc: ['Wind howls up the shaft. A giant bird made of storm clouds lands in front of you.', 'The Storm Roc: SKREEEEE!'], stormrocWin: ['The Storm Roc dissolves into a harmless spring rain.'],
  lichscribe: ['A skeleton in a scholar’s robe looks up from a book of black pages.', 'The Lich Scribe: Ah, visitors. Let me write you… an ending.'], lichscribeWin: ['The Lich Scribe’s book slams shut, and he crumbles to dust with it.'],
  vinehydra: ['The temple floor cracks. Vines as thick as trees rise up, each with a snapping head.', 'The Vine Hydra hisses from three mouths at once!'], vinehydraWin: ['The Vine Hydra withers and sinks back into the ground.'],
  mirequeen: ['The water in the barrow bubbles. A huge shape of mud and weeds rises, wearing a crown of reeds.', 'The Mire Queen: You are tracking mud into my palace!'], mirequeenWin: ['The Mire Queen slumps back into a harmless puddle. Her crown floats away.'],
  canyonwyvern: ['Hot wind fills the cave. A red wyvern drops from the ceiling, wings spread wide.', 'The Canyon Wyvern roars, and the whole canyon roars with it!'], canyonwyvernWin: ['The Canyon Wyvern flees out of a crack in the rock, never to return.'],
  glacierwyrmPrize: ['💰 The Glacier Wyrm guarded a pile of treasure!'], stormrocPrize: ['💰 The Storm Roc’s nest is full of shiny things!'], lichscribePrize: ['💰 The Lich Scribe’s hoard is yours!'],
  vinehydraPrize: ['💰 Treasure hidden among the roots!'], mirequeenPrize: ['💰 The Mire Queen’s treasure, a little muddy.'], canyonwyvernPrize: ['💰 The wyvern’s hoard glitters in the dark!'],
  castleGate: ['The three keys rise out of your bag and fit into the sockets.', 'With a sound like a book opening, Castle Unwritten’s gate swings wide.'],
  lever: (label, on) => `You pull the ${label} lever. ${on ? 'A flame bursts up beside it! 🔥' : 'Its flame goes out.'}`,
  leverDone: ['🔥 Sun, star… and the moon asleep. The iron gate grinds upward!'],
  plateGood: '✨ The plate glows.', plateBad: ['The plates sink back into the floor with a groan.', 'Read the poem again: in what order does the night pass?'], plateDone: ['🔥 All four plates blaze with light. The iron gate grinds upward!'],
  statueAsk: name => `🗿 ${name}: “Answer my word, traveler.”`, statueGood: name => `🗿 ${name}: “True words.” Its eyes glow gold.`, statueBad: name => `🗿 ${name}: “Not true. Come back when you know.”`,
  statueDone: ['🗿 All three statues glow. The great doors to the throne room swing open!'],
  unwriter: ['Through the doors, a throne of black ink. The air goes perfectly still. Not a sound. Not even your own steps.', 'A tall figure in a robe of blank pages rises from it. Where his words should be, there is only ink.',
    'The Unwriter: You found my keys. You solved my riddles. How tiresome.', 'The Unwriter: Words. Noisy, messy, endless words. I will unwrite you first.', 'The Unwriter: …and then, at last, SILENCE.'],
});
SG_STORY.lexicon = n => ['💎 The Lexicon’s voice bursts out of the Unwriter’s throne, and the shards begin to sing.', 'The great Lexicon is whole again! It glows with every word that ever was.',
  'All over the world, rivers remember their names, bells remember their songs, and people remember their words.', `King Aldous, Queen Ysolde and Archmage Veyra will sing about ${n} and friends for a thousand years.`,
  '🏆 <b>THE END</b>, and thank you for playing Lexicon Saga!', 'You can keep exploring, fighting and studying. Every town is still open.'];
SG_CHAT.push('The roads north and south of the old kingdoms are open again. Strange lands out there!', 'Some treasures are hidden in plain sight. Walk where nobody walks.');

/* progress hints from the barkeeps: the late game */
{ const base = sgHint;
  sgHint = s => {
    const f = s.flags;
    if (f.lexicon) return 'They sing songs about you in every tavern now, hero!';
    if (f.wayfare && !f.allshards) return 'The Tower of Silence is on the far east isle, past Last Light. A silent knight guards its top.';
    if (f.allshards && !f.keyquest) return 'You have every shard! Take them to King Aldous in Quillhaven.';
    if (f.keyquest && !f.key1) return 'The Dawn Quill: people in Stormwatch, in the Thundercrag Highlands north of Seravel, talk about a glint on a high peak.';
    if (f.keyquest && !f.key2) return 'The Dusk Inkwell: ask in Thornvale, in the Verdant Wilds south of Aldermere, about a hidden grove.';
    if (f.keyquest && !f.key3) return 'The Star Seal: ask in Redrock, in the Sunscorch Canyon in the far south, about the gully where stars fall.';
    if (f.keyquest) return 'You have all three keys! Castle Unwritten stands in the Inkblight Wastes, in the far north-east.';
    return base(s);
  }; }

/* music for the new lands (original tunes) */
Object.assign(TRM_SONGS, {
  sg_snow: { bpm: 96, lead: ['E5 - - B4 - - G5 -', 'F#5 - - - E5 - . .', 'C5 - - E5 - - B5 -', 'A5 - - - G5 - . .', 'E5 - G5 - B5 - A5 G5', 'F#5 - D5 - B4 - . .', 'C5 - E5 - D5 - B4 -', 'E5 - - - - - . .'],
    bass: ['E3 - B3 - E3 - B3 -', 'D3 - A3 - D3 - A3 -', 'C3 - G3 - C3 - G3 -', 'D3 - A3 - B2 - F#3 -', 'E3 - B3 - G3 - B3 -', 'B2 - F#3 - B2 - F#3 -', 'C3 - G3 - D3 - A3 -', 'E3 - B3 - E3 - . .'], drums: ['k . . . h . . .'], vol: 0.7 },
  sg_jungle: { bpm: 132, lead: ['A4 C5 E5 - D5 C5 A4 -', 'G4 - A4 - C5 - . .', 'A4 C5 E5 - G5 E5 D5 -', 'E5 - - - D5 - . .', 'C5 D5 E5 - E5 D5 C5 -', 'A4 - G4 - A4 - . .', 'C5 - D5 E5 G5 E5 D5 C5', 'A4 - - - A4 - . .'],
    bass: ['A2 - E3 A2 - E3 A2 -', 'G2 - D3 G2 - D3 G2 -', 'A2 - E3 A2 - E3 A2 -', 'E2 - B2 E2 - B2 E2 -', 'F2 - C3 F2 - C3 F2 -', 'G2 - D3 G2 - D3 G2 -', 'F2 - C3 G2 - D3 G2 -', 'A2 - E3 A2 - . .'], drums: ['k h s h k k s h'], vol: 0.8 },
  sg_swamp: { bpm: 88, lead: ['D5 - - F5 E5 - D5 -', 'C5 - - A4 - - . .', 'D5 - F5 - A5 - G5 -', 'F5 - - E5 - - . .', 'Bb4 - D5 - F5 - E5 D5', 'C5 - A4 - G4 - . .', 'A4 - C5 - D5 - E5 -', 'D5 - - - - - . .'],
    bass: ['D2 - - D3 - - A2 -', 'F2 - - C3 - - . .', 'D2 - - D3 - - A2 -', 'A2 - - E3 - - . .', 'Bb2 - - F3 - - Bb2 -', 'F2 - - C3 - - . .', 'G2 - - D3 - A2 -', 'D2 - - A2 - - . .'], drums: ['k . . s . . k .'], vol: 0.7 },
});
