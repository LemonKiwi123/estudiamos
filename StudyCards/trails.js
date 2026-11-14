'use strict';
/* ================= Wordling Trails: game engine =================
   An original creature-collecting word adventure in 4 shades of green. World data is in trails-data.js.
   Battles are your flashcards: every move asks a card from your deck. Saves live in your profile
   (S.trailsSlots, 3 slots) and sync like everything else. */
const trLearned = (sp, lv) => trLearnset(sp).filter(([l]) => l <= lv).map(([, k]) => k);   // everything it has learned by this level
const trMovesAt = (sp, lv) => trLearned(sp, lv).slice(-4);                                       // a fresh Wordling knows the last 4
const trOldMoves = (sp, lv) => [...(lv >= 18 ? [] : ['strike']), 'guard', ...(lv >= 5 ? [TR_SPECIAL[TR_SPECIES[sp].type]] : []), ...(lv >= 8 ? ['focus'] : []), ...(lv >= 18 ? ['surge'] : [])];
const TR_MOVE_SLOTS = 4;
const trMoves = m => (m.moves?.length ? m.moves : trMovesAt(m.sp, m.lv)).filter(k => TR_MOVES[k]);
const trHits = k => TR_MOVES[k].power > 0;
const trMaxHp = m => Math.floor(TR_SPECIES[m.sp].hp * m.lv / 18) + m.lv + 10;
const trStat = (m, k) => Math.floor(TR_SPECIES[m.sp][k] * m.lv / 25) + 5;
const trNeed = lv => 12 * lv + lv * lv;
const trMon = (sp, lv) => { const m = { id: uid(), sp, lv, xp: 0 }; m.hp = trMaxHp(m); return m; };
const trTile = (map, x, y) => (TR_MAPS[map].rows[y] || '')[x] || (TR_MAPS[map].indoor ? 'X' : '#');
const TR_DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const TR_BACK = { up: 'down', down: 'up', left: 'right', right: 'left' };

/* ---------- Saves: 3 slots ---------- */
function trSlots() {
  if (S.trails && !S.trailsSlots) { S.trailsSlots = { a: S.trails }; S.trailsSlot = 'a'; delete S.trails; }   // older single save
  return (S.trailsSlots ||= {});
}
const trS = () => trSlots()[S.trailsSlot || 'a'] || null;
function trFix(s) {   // fill in anything an older save doesn't have yet
  if (!s) return s;
  s.seals ||= {}; s.got ||= {}; s.key ||= {}; s.visited ||= { town: 1 }; s.bag ||= {}; s.beaten ||= {}; s.flags ||= {}; s.seen ||= {}; s.caught ||= {}; s.box ||= [];
  if (s.seal || s.beaten.iris) s.seals[1] = 1; delete s.seal;
  for (const m of [...(s.team || []), ...(s.box || [])]) if (m && !m.moves?.length && TR_SPECIES[m.sp]) m.moves = trOldMoves(m.sp, m.lv);
  if (!TR_MAPS[s.map]) Object.assign(s, { map: 'town', x: 5, y: 11 });
  if (s.team.length && !s.flags.starter) { const st = TR_STARTERS.find(k => s.caught[k]) || 'quillip'; s.flags.starter = st; s.flags.rivalSp = trRivalPick(st); s.flags.profSp = TR_STARTERS.find(k => k !== st && k !== s.flags.rivalSp); s.flags.metProf = 1; s.key.log = 1; }
  s.rematch ||= {};
  s.playMs ||= 0; return s;
}
/* Rio picks the starter that has the edge over yours, so the Professor keeps the third one */
function trRivalPick(mine) { return TR_STARTERS.find(k => TR_BEATS[TR_SPECIES[k].type] === TR_SPECIES[mine].type) || TR_STARTERS.find(k => k !== mine); }
function trNewSave(slot, name) {
  trSlots()[slot] = trFix({ v: 3, name: name.slice(0, 14) || 'Explorer', map: 'house_home_you', x: 6, y: 4, dir: 'up', team: [], box: [],
    bag: { potion: 3, charm: 0 }, coins: 100, seen: {}, caught: {}, beaten: {}, flags: {}, seals: {}, got: {}, key: {}, visited: { town: 1 },
    respawn: { map: 'town', x: 5, y: 11 }, steps: 0, started: Date.now(), playMs: 0 });
  S.trailsSlot = slot; save();
}
function trSaveNow(silent) {
  const s = trS(); if (!s || !tr) return;
  const now = Date.now(); s.playMs += now - (tr.tick || now); tr.tick = now; s.savedAt = now; save();
  if (!silent) trSay(`💾 Game saved in slot ${(S.trailsSlot || 'a').toUpperCase()}. You can pick up right here next time.`);
}

/* ---------- Controls (can be changed in the menu) ---------- */
const TR_ACTIONS = [['up', 'Move up'], ['down', 'Move down'], ['left', 'Move left'], ['right', 'Move right'], ['a', 'A: talk / confirm'], ['b', 'B: back / menu'], ['menu', 'Open menu'], ['scoot', 'Ride the scooter'], ['music', 'Music on / off']];
const TR_DEFAULT_KEYS = { up: ['ArrowUp', 'w'], down: ['ArrowDown', 's'], left: ['ArrowLeft', 'a'], right: ['ArrowRight', 'd'], a: ['z', 'Enter', ' '], b: ['x', 'Escape', 'Backspace'], menu: ['m'], scoot: ['r'], music: ['n'] };
const trKeys = () => ({ ...TR_DEFAULT_KEYS, ...(S.settings?.trKeys || {}) });
const trKeyName = k => ({ ' ': 'Space', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', Escape: 'Esc', Backspace: '⌫' }[k] || (k.length === 1 ? k.toUpperCase() : k));
function trActionFor(key) { const ks = trKeys(); for (const [act] of TR_ACTIONS) if ((ks[act] || []).includes(key)) return act; if (key === 'Enter') return 'a'; if (key === 'Escape') return 'b'; return null; }

/* ---------- Pixel art ---------- */
const trCache = {};
function trQuantize(cv, P4 = TR_PAL) {
  const g = cv.getContext('2d'), im = g.getImageData(0, 0, cv.width, cv.height), d = im.data, pal = P4.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 110) { d[i + 3] = 0; continue; }
    let best = 0, bd = 1e9; pal.forEach((p, k) => { const e = (p[0] - d[i]) ** 2 + (p[1] - d[i + 1]) ** 2 + (p[2] - d[i + 2]) ** 2; if (e < bd) { bd = e; best = k; } });
    [d[i], d[i + 1], d[i + 2], d[i + 3]] = [...pal[best], 255];
  }
  g.putImageData(im, 0, 0); return cv;
}
function trCanvas(w, h, draw, P4 = TR_PAL) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, i => P4[i]); return trQuantize(c, P4); }
/* ---------- 🌈 Full color: like a color handheld game, every tile and character gets its own 4 colors ---------- */
const trIsFull = () => S.settings?.trPalette === 'full';
const TR_G0 = '#e9f6c9';   // the light ground color shared by grass, trees, signs and flowers so tiles meet seamlessly
const TR_FULL_TILES = {
  out: { '.': [TR_G0, '#a3d873', '#4f9a3c', '#1d3f20'], ',': [TR_G0, '#79c45a', '#3b9140', '#15401e'], '#': [TR_G0, '#82d26c', '#2f8f45', '#163a1f'],
    v: [TR_G0, '#a3d873', '#4f9a3c', '#1d3f20'], '{': [TR_G0, '#a3d873', '#4f9a3c', '#1d3f20'], '}': [TR_G0, '#a3d873', '#4f9a3c', '#1d3f20'],
    P: ['#f4e3b2', '#dcc07e', '#aa8a52', '#4a3520'], '=': ['#f7e9bc', '#e2c787', '#b8965a', '#4a3520'], W: ['#eaf8ff', '#5aa8f0', '#2a6ac0', '#123060'], '~': ['#f8e8c8', '#c89860', '#8a5a2b', '#3a2410'],
    L: [TR_G0, '#a3d873', '#7a6a40', '#4a3520'], F: [TR_G0, '#ff8fb8', '#f4c542', '#c0392b'], S: [TR_G0, '#f4e3b2', '#c89860', '#5a3a1a'], o: [TR_G0, '#c8c8b8', '#8a8a7a', '#3a3a32'],
    R: ['#ffe2d4', '#f08070', '#c84a3a', '#5a1a14'], B: ['#ffffff', '#5ac0d8', '#2a88a8', '#103a4a'], M: ['#ffffff', '#8ab8f0', '#3a6ad0', '#132a5a'], G: ['#fff3c0', '#b48ae0', '#6a3aa8', '#24103e'],
    H: ['#f8ecd0', '#9ad0f0', '#c8a878', '#5a4028'], D: ['#f8ecd0', '#e0c080', '#a8703a', '#4a2a14'] },
  cave: { all: ['#ead2b0', '#8a6a4a', '#5a4030', '#22170f'] },
  library: { K: ['#f8e8d0', '#e07a5a', '#5a8ac8', '#2a1a24'], all: ['#f2e2c8', '#d6b890', '#9a6a44', '#3a2418'] },
  hall: { K: ['#f4f0ff', '#f4c542', '#7a5ac0', '#1e1a3a'], all: ['#f3f0ff', '#bcc2ea', '#6a70b0', '#20244a'] },
  archive: { K: ['#eef8f8', '#e8c060', '#3a7a8a', '#0e2a30'], all: ['#e8f2f2', '#8ab0b8', '#3a6070', '#102830'] },
  mart: { X: ['#ffffff', '#cfe3ff', '#3a6ad0', '#132a5a'], w: ['#ffffff', '#cfe3ff', '#3a6ad0', '#132a5a'], c: ['#fff3dd', '#cfe3ff', '#3a6ad0', '#132a5a'], r: ['#fff3dd', '#4fd1a0', '#3a6ad0', '#132a5a'],
    f: ['#eaf8ff', '#9ad0f0', '#e0604a', '#1a2028'], h: ['#fff8e0', '#f4c542', '#e0604a', '#3a2010'], p: ['#f8ecd0', '#7cc65a', '#2f8f45', '#3a2410'], u: ['#fff0f0', '#8ab8f0', '#3a6ad0', '#132a5a'], all: ['#ffffff', '#e6eef8', '#aab8cc', '#3a4a5a'] },
  center: { q: ['#ffffff', '#7fd6f0', '#8a98a6', '#1a2028'], X: ['#ffffff', '#bde8ee', '#5aaebf', '#1f3e48'], w: ['#ffffff', '#bde8ee', '#5aaebf', '#1f3e48'], c: ['#fff3dd', '#f2b8a0', '#d0604a', '#3a1a10'], m: ['#ffffff', '#c8d6e0', '#e06090', '#1a2028'],
    s: ['#f8e8f0', '#f0a0b8', '#c05070', '#3a1020'], p: ['#f8ecd0', '#7cc65a', '#2f8f45', '#3a2410'], u: ['#fff0f0', '#e88a9a', '#b04a6a', '#3a1424'], all: ['#ffffff', '#e2f0f2', '#a8c4c8', '#3a4a50'] },
  house: { X: ['#fdf0dc', '#e8b87a', '#a8703a', '#3a2410'], w: ['#eaf8ff', '#e8b87a', '#a8703a', '#3a2410'], K: ['#f8e8d0', '#e07a5a', '#5a8ac8', '#2a1a24'],
    t: ['#f8e8c8', '#c89860', '#8a5a2b', '#3a2410'], b: ['#ffffff', '#9ad0f0', '#d0504a', '#3a1414'], p: ['#f8e8c8', '#7cc65a', '#2f8f45', '#3a2410'], u: ['#fff0f0', '#e88a9a', '#b04a6a', '#3a1424'], all: ['#f8e8c8', '#e0c08a', '#b08a5a', '#4a3020'] },
};
const trTilePal = (ch, theme) => { if (!trIsFull()) return TR_PAL; const t = TR_FULL_TILES[theme] || TR_FULL_TILES.out; return t[ch] || t.all || TR_FULL_TILES.out['.']; };
const TR_FULL_PEOPLE = {   // 0 skin, 1 light clothes, 2 main clothes, 3 hair and outline
  player: ['#f8d0b0', '#5aa0f0', '#d0342c', '#1a1420'], man: ['#f8d0b0', '#a8d878', '#3a8a4a', '#20160c'], lass: ['#f8d0b0', '#ffa8c8', '#c8487a', '#2a1410'],
  kid: ['#f8d0b0', '#f4d03f', '#2e86c1', '#2a1a10'], granny: ['#f8d0b0', '#d8d0e8', '#7a5aa8', '#3a2a40'], elder: ['#f8d0b0', '#e8e8e8', '#6a4a2a', '#2a1a10'],
  scholar: ['#f8d0b0', '#c8e0f0', '#4a6a9a', '#1a1a2a'], scout: ['#f8d0b0', '#f4c542', '#4a8a3a', '#1a2010'], hiker: ['#f8d0b0', '#e8a858', '#8a5a2b', '#201408'],
  sailor: ['#f8d8c0', '#a8d0f0', '#2a5aa8', '#101830'], guard: ['#f8d0b0', '#c8d0e0', '#3a4a8a', '#101428'], shop: ['#f8d0b0', '#f8c8a0', '#c0702a', '#2a1808'],
  grunt: ['#f0d8c0', '#9aa0a8', '#4a4e58', '#14161c'], lieut: ['#f0d8c0', '#d8a0a0', '#5a4e60', '#14121a'], boss: ['#f0d8c0', '#c0a0e0', '#4a2a6a', '#0e0a16'],
  leaderM: ['#f8d0b0', '#f4c542', '#c0392b', '#1a1010'], leaderF: ['#f8d0b0', '#ffd0e8', '#8e44ad', '#1a1020'], nurse: ['#f8d0b0', '#ffb8d0', '#e0608a', '#3a1a24'], rival: ['#f8d0b0', '#ffe08a', '#2e8b57', '#2a1a10'],
};
const TR_FULL_MONS = {
  verb: [['#fff4d0', '#f7c04a', '#d07a1a', '#3a2008'], ['#eef8ff', '#7ec8f0', '#2a70c0', '#101c3a'], ['#ffe8e0', '#f08a6a', '#c03a2a', '#3a0c08']],
  noun: [['#f4ecd8', '#c8a870', '#7a5a3a', '#2a1a10'], ['#e8f4d8', '#98c870', '#4a8a3a', '#14280e'], ['#eeeeee', '#a8a8b8', '#5a5a70', '#1a1a24']],
  adj: [['#ffe8f8', '#f0a0d8', '#a04ab0', '#2a1030'], ['#f0fff8', '#90e0c8', '#2aa088', '#0a3028'], ['#fff8e0', '#ffd870', '#e0782a', '#3a1a08']],
};
const trMonPal = sp => { if (!trIsFull()) return TR_PAL; const list = TR_FULL_MONS[TR_SPECIES[sp]?.type] || TR_FULL_MONS.noun, key = TR_SPECIES[sp]?.from ? (() => { let k = sp; for (let i = 0; i < 4 && TR_SPECIES[k]?.from; i++) k = TR_SPECIES[k].from; return k; })() : sp;
  const h = [...key].reduce((a, c) => a * 31 + c.charCodeAt(0) >>> 0, 7); return list[h % list.length]; };   // a family keeps its colors when it evolves
const TR_FULL_GOLD = ['#fff8d0', '#f4c542', '#b07a1a', '#3a2408'], TR_FULL_ITEM = ['#ffffff', '#f08a8a', '#d0342c', '#2a0a0a'];
function trTileArt(ch, theme = 'out') {
  return trCache[`t${theme}${ch}`] ||= trCanvas(16, 16, (g, P) => {
    const R = (x, y, w, h, c) => { g.fillStyle = P(c); g.fillRect(x, y, w, h); };
    if (theme === 'mart') {   // shop: bright floor, product shelves, drink fridges, the register
      const floor = () => { R(0, 0, 16, 16, 0); R(0, 0, 16, 1, 1); R(0, 8, 16, 1, 1); R(0, 0, 1, 16, 1); R(8, 0, 1, 16, 1); };
      if (ch === 'X' || ch === 'w') { R(0, 0, 16, 16, 1); R(0, 12, 16, 4, 2); R(0, 12, 16, 1, 3); R(0, 3, 16, 2, 2); if (ch === 'w') { R(3, 1, 10, 9, 3); R(4, 2, 8, 7, 0); R(7, 2, 2, 7, 3); } return; }
      if (ch === 'c' || ch === 'r') { R(0, 0, 16, 16, 0); R(0, 4, 16, 3, 2); R(0, 4, 16, 1, 3); R(0, 7, 16, 9, 1); R(0, 15, 16, 1, 3);
        if (ch === 'r') { R(3, 0, 10, 5, 3); R(4, 1, 8, 3, 2); R(5, 2, 6, 1, 0); R(6, 5, 4, 2, 3); } return; }
      if (ch === 'f') { R(0, 0, 16, 16, 3); R(1, 1, 14, 14, 1); R(2, 2, 12, 11, 0); for (let y = 4; y < 13; y += 4) { R(2, y, 12, 1, 2); for (let x = 3; x < 13; x += 3) R(x, y - 2, 2, 2, 2); } R(13, 6, 1, 3, 3); return; }
      if (ch === 'h') { R(0, 0, 16, 16, 0); R(1, 1, 14, 14, 3); R(2, 2, 12, 12, 1); R(2, 7, 12, 1, 3); for (let x = 3; x < 13; x += 3) { R(x, 3, 2, 4, (x / 3) % 2 ? 2 : 0); R(x, 9, 2, 4, (x / 3) % 2 ? 0 : 2); } return; }
      floor();
      if (ch === 'p') { R(4, 10, 8, 5, 3); R(5, 10, 6, 4, 2); g.fillStyle = P(2); g.beginPath(); g.arc(8, 6, 5, 0, 7); g.fill(); g.fillStyle = P(1); g.beginPath(); g.arc(7, 5, 2.5, 0, 7); g.fill(); }
      if (ch === 'u') { R(0, 0, 16, 16, 2); R(1, 1, 14, 14, 1); R(3, 3, 10, 10, 2); }
      return;
    }
    if (theme === 'center') {   // Clinic: tiled floor, counter, healing machine, benches
      const floor = () => { R(0, 0, 16, 16, 0); R(0, 0, 8, 8, 1); R(8, 8, 8, 8, 1); };
      if (ch === 'X' || ch === 'w') { R(0, 0, 16, 16, 0); R(0, 11, 16, 5, 1); R(0, 11, 16, 1, 3); R(0, 4, 16, 1, 1); if (ch === 'w') { R(3, 1, 10, 8, 3); R(4, 2, 8, 6, 1); R(7, 2, 2, 6, 3); } else { R(6, 5, 4, 4, 2); R(7, 4, 2, 6, 2); R(5, 6, 6, 2, 2); } return; }
      if (ch === 'c') { R(0, 0, 16, 16, 0); R(0, 3, 16, 4, 2); R(0, 3, 16, 1, 3); R(0, 7, 16, 9, 1); R(0, 15, 16, 1, 3); for (let x = 2; x < 16; x += 5) R(x, 9, 2, 4, 2); return; }
      if (ch === 'm') { R(0, 0, 16, 16, 3); return; }   // the stove itself is drawn over these tiles
      if (ch === 'q') { floor(); R(1, 9, 14, 6, 3); R(2, 10, 12, 4, 2); R(3, 1, 10, 8, 3); R(4, 2, 8, 6, 1); R(5, 3, 3, 1, 0); R(7, 8, 2, 2, 3); R(4, 11, 8, 1, 1); return; }
      floor();
      if (ch === 's') { R(1, 4, 14, 9, 3); R(2, 5, 12, 4, 2); R(2, 9, 12, 3, 1); R(2, 13, 2, 3, 3); R(12, 13, 2, 3, 3); }
      if (ch === 'p') { R(4, 10, 8, 5, 3); R(5, 10, 6, 4, 2); g.fillStyle = P(2); g.beginPath(); g.arc(8, 6, 5, 0, 7); g.fill(); g.fillStyle = P(1); g.beginPath(); g.arc(7, 5, 2.5, 0, 7); g.fill(); }
      if (ch === 'u') { R(0, 0, 16, 16, 2); R(1, 1, 14, 14, 1); R(3, 3, 10, 10, 2); }
      return;
    }
    if (theme === 'house' && ch !== 'K') {   // cozy home interiors
      const floor = () => { R(0, 0, 16, 16, 0); R(0, 7, 16, 1, 1); R(0, 15, 16, 1, 1); R(5, 0, 1, 7, 1); R(11, 8, 1, 7, 1); };
      if (ch === 'X' || ch === 'w') { R(0, 0, 16, 10, 1); for (let x = 1; x < 16; x += 4) R(x, 0, 1, 10, 0); R(0, 10, 16, 6, 2); R(0, 10, 16, 1, 3); R(0, 15, 16, 1, 3);
        if (ch === 'w') { R(3, 1, 10, 8, 3); R(4, 2, 8, 6, 0); R(7, 2, 2, 6, 3); R(4, 4, 8, 1, 3); } return; }
      floor();
      if (ch === 't') { R(1, 3, 14, 9, 3); R(2, 4, 12, 7, 1); R(3, 5, 4, 1, 0); R(2, 12, 2, 3, 3); R(12, 12, 2, 3, 3); }
      if (ch === 'b') { R(1, 1, 14, 14, 3); R(2, 2, 12, 12, 0); R(3, 3, 10, 3, 1); R(2, 7, 12, 7, 2); R(2, 7, 12, 1, 3); }
      if (ch === 'p') { R(4, 10, 8, 5, 3); R(5, 10, 6, 4, 2); g.fillStyle = P(2); g.beginPath(); g.arc(8, 6, 5, 0, 7); g.fill(); g.fillStyle = P(1); g.beginPath(); g.arc(7, 5, 2.5, 0, 7); g.fill(); }
      if (ch === 'u') { R(0, 0, 16, 16, 2); R(1, 1, 14, 14, 1); R(3, 3, 10, 10, 2); R(5, 5, 6, 6, 1); }
      return;
    }
    const dark = theme === 'cave' || theme === 'archive';
    R(0, 0, 16, 16, dark ? 1 : 0);
    if (ch === '.') { R(3, 4, 1, 1, 1); R(11, 9, 1, 1, 1); R(7, 13, 1, 1, 1); }
    else if (ch === 'P') { R(2, 3, 2, 1, 1); R(10, 11, 2, 1, 1); R(12, 4, 1, 1, 1); }
    else if (ch === 'v') { R(3, 3, 1, 1, 1); R(11, 4, 1, 1, 1); R(0, 7, 16, 2, 1); R(0, 9, 16, 1, 3); R(0, 10, 16, 2, 2); R(2, 12, 1, 1, 2); R(9, 12, 1, 1, 2); R(13, 12, 1, 1, 2); }
    else if (ch === '{' || ch === '}') { const L = ch === '{'; R(L ? 7 : 7, 0, 2, 16, 1); R(L ? 6 : 9, 0, 1, 16, 3); R(L ? 4 : 10, 0, 2, 16, 2); R(L ? 12 : 3, 4, 1, 1, 1); }
    else if (ch === '=') { for (const [x, y] of [[1, 2], [5, 6], [9, 1], [13, 5], [3, 10], [7, 13], [11, 9], [14, 13]]) R(x, y, 1, 1, 1); R(4, 4, 3, 1, 1); R(10, 12, 3, 1, 1); }
    else if (ch === ',') { R(0, 0, 16, 16, 1); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { const x = 1 + i * 4, y = 2 + j * 7; R(x, y + 3, 1, 3, 3); R(x + 1, y + 1, 1, 5, 2); R(x + 2, y + 3, 1, 3, 3); } }
    else if (ch === '#') { g.fillStyle = P(3); g.beginPath(); g.arc(8, 7, 7.5, 0, 7); g.fill(); g.fillStyle = P(2); g.beginPath(); g.arc(8, 6.5, 6, 0, 7); g.fill(); g.fillStyle = P(1); g.beginPath(); g.arc(6, 4.5, 2.4, 0, 7); g.fill(); R(6, 12, 4, 4, 3); }
    else if (ch === 'W') { R(0, 0, 16, 16, 1); R(2, 4, 4, 1, 0); R(9, 9, 5, 1, 0); R(4, 13, 3, 1, 0); }
    else if (ch === '~') { R(0, 0, 16, 16, 1); R(0, 1, 16, 14, 2); for (let x = 0; x < 16; x += 4) R(x, 1, 1, 14, 3); R(0, 0, 16, 1, 3); R(0, 15, 16, 1, 3); }
    else if (ch === 'L') { R(0, 6, 16, 2, 3); R(0, 11, 16, 2, 3); R(2, 3, 2, 12, 3); R(12, 3, 2, 12, 3); }
    else if (ch === 'F') { R(3, 3, 3, 3, 1); R(4, 4, 1, 1, 3); R(10, 9, 3, 3, 2); R(11, 10, 1, 1, 0); R(4, 11, 2, 2, 1); }
    else if ('RBMG'.includes(ch)) { R(0, 0, 16, 16, ch === 'B' ? 1 : 2); for (let y = 2; y < 16; y += 4) R(0, y, 16, 1, 3); R(0, 15, 16, 1, 3);
      if (ch === 'B') { R(6, 5, 4, 6, 0); R(5, 6, 6, 4, 0); R(7, 6, 2, 4, 2); }
      if (ch === 'M') { g.fillStyle = P(0); g.beginPath(); g.arc(8, 8, 4, 0, 7); g.fill(); R(7, 6, 2, 4, 3); }
      if (ch === 'G') { R(4, 4, 8, 8, 0); R(5, 5, 6, 6, 3); R(6, 6, 4, 4, 1); } }
    else if (ch === 'H') { R(0, 0, 16, 1, 3); R(0, 15, 16, 1, 3); R(3, 4, 5, 5, 3); R(4, 5, 3, 3, 1); R(10, 4, 3, 3, 2); }
    else if (ch === 'D') { R(0, 0, 16, 1, 3); R(3, 3, 10, 13, 3); R(4, 4, 8, 12, 2); R(10, 10, 1, 1, 0); }
    else if (ch === 'S') { R(7, 9, 2, 7, 3); R(2, 3, 12, 7, 3); R(3, 4, 10, 5, 1); R(4, 5, 8, 1, 3); R(4, 7, 6, 1, 3); }
    else if (ch === 'C') { R(0, 0, 16, 16, 3); R(2, 3, 5, 4, 2); R(9, 8, 5, 5, 2); R(3, 3, 2, 1, 1); R(10, 8, 2, 1, 1); }
    else if (ch === ';') { if (theme === 'cave') { R(4, 5, 1, 1, 2); R(11, 11, 2, 1, 2); } else { R(0, 0, 16, 16, theme === 'archive' ? 1 : 0); R(0, 7, 16, 1, theme === 'archive' ? 2 : 1); R(0, 15, 16, 1, theme === 'archive' ? 2 : 1); R(5, 0, 1, 7, theme === 'archive' ? 2 : 1); R(11, 8, 1, 7, theme === 'archive' ? 2 : 1); } }
    else if (ch === ':') { if (theme === 'cave') { R(0, 0, 16, 16, 1); for (let i = 0; i < 9; i++) R((i * 7) % 15, (i * 5) % 15, 2, 2, i % 2 ? 2 : 3); } else { R(0, 0, 16, 16, 2); R(1, 1, 14, 14, 1); R(3, 3, 10, 10, 2); R(5, 5, 6, 6, 1); } }
    else if (ch === 'o') { if (theme === 'cave') { g.fillStyle = P(2); g.beginPath(); g.arc(8, 10, 5, 0, 7); g.fill(); R(5, 7, 3, 2, 0); } else { R(5, 4, 6, 10, 3); R(6, 5, 4, 8, 1); R(6, 3, 4, 2, 2); } }
    else if (ch === 'K') { R(0, 0, 16, 16, 3); for (let row = 0; row < 3; row++) { for (let b = 0; b < 5; b++) R(1 + b * 3, 1 + row * 5, 2, 4, (b + row) % 3 === 0 ? 0 : (b + row) % 3 === 1 ? 1 : 2); R(0, 5 + row * 5, 16, 1, 3); } }
    else if (ch === 'X') { R(0, 0, 16, 16, dark ? 3 : 2); R(0, 12, 16, 4, 3); R(2, 2, 4, 1, dark ? 2 : 1); }
  }, trTilePal(ch, theme));
}
/* ---------- People (original pixel sprites: big heads, dark outlines, 4 shades) ----------
   Each kind of person is built from parts: a hairstyle or hat, a body, and extras like a backpack or cape.
   Sprites are 16x18, face down / up / left (right is the mirror), with a walking step. */
const TR_ARCH = {
  player:  { hair: 'cap', capC: 2, shirt: 1, pants: 3, pack: 1, slim: 1, mouth: 1, jacket: 2 },
  man:     { hair: 'short', shirt: 2, pants: 3 },
  lass:    { hair: 'long', shirt: 1, body: 'dress' },
  kid:     { hair: 'tuft', shirt: 0, pants: 2, body: 'stripes', small: 1 },
  granny:  { hair: 'long', hairC: 1, shirt: 2, body: 'dress' },   // shaped like the lass, with silver hair
  elder:   { hair: 'bald', beard: 1, shirt: 2, body: 'coat' },
  scholar: { hair: 'short', glasses: 1, shirt: 0, body: 'coat' },
  scout:   { hair: 'cap', capC: 1, shirt: 2, pants: 3, pack: 1 },
  hiker:   { hair: 'wide', beard: 1, shirt: 1, pants: 3, pack: 1 },
  sailor:  { hair: 'sailorcap', shirt: 2, pants: 2, body: 'stripes' },
  guard:   { hair: 'peaked', capC: 3, shirt: 2, pants: 3, badge: 1 },
  shop:    { hair: 'bandana', shirt: 1, pants: 3, body: 'apron' },
  grunt:   { hair: 'hood', shirt: 2, pants: 3, body: 'coat' },
  lieut:   { hair: 'peaked', capC: 2, shirt: 2, pants: 3, body: 'coat', scarf: 1 },
  boss:    { hair: 'slick', shirt: 2, pants: 3, body: 'coat', cape: 1 },
  leaderM: { hair: 'spiky', shirt: 1, pants: 3, cape: 1 },
  leaderF: { hair: 'long', shirt: 1, body: 'dress', cape: 1 },
  nurse:   { hair: 'long', shirt: 1, pants: 2, body: 'apron' },
  rival:   { hair: 'short', shirt: 1, pants: 3, jacket: 2, slim: 1, mouth: 1 },
};
const TR_GIRLS = new Set(['mara', 'h1b', 'h2b', 'h3a', 'climber', 'h4a', 'skier', 'h5a', 'h6a', 'h7b', 'h8a', 'nomad']);
const TR_WHO = { iris: 'leaderF', marisol: 'leaderF', sora: 'leaderF', remy: 'sailor', oduya: 'elder', bramble: 'elder', calloway: 'leaderM', elio: 'leaderM', vex: 'boss',
  gran: 'granny', kid: 'kid', kid2: 'kid', h1a: 'kid', h1b: 'kid', h7a: 'kid', h7b: 'lass', cranekeeper: 'elder', scholar: 'scholar', teller: 'elder', carver: 'scholar', gazer: 'scholar', icefisher: 'sailor', pip: 'kid', tomas: 'scout' };
function trArchFor(n) {
  if (!n) return 'man';
  if (n.arch) return n.arch;
  if (TR_WHO[n.id]) return TR_WHO[n.id];
  const nm = n.trainer?.name || '';
  if (/^Lt\./.test(nm)) return 'lieut';
  if (n.trainer?.syndicate || n.look === 5) return 'grunt';
  if (n.gate) return 'guard';
  if (n.ferry) return 'sailor';
  if (n.shopkeeper) return 'shop';
  if (/Hiker|Climber|Mountaineer|Nomad/.test(nm)) return TR_GIRLS.has(n.id) ? 'scout' : 'hiker';
  if (/Sailor|Deckhand|Captain|Fisher/.test(nm)) return 'sailor';
  if (/Scout|Ranger|Skier/.test(nm)) return TR_GIRLS.has(n.id) ? 'lass' : 'scout';
  if (/Librarian|Bookbinder|Astronomer|Skywatcher|Archivist|Poet|Bard|Painter/.test(nm)) return TR_GIRLS.has(n.id) ? 'lass' : 'scholar';
  if (nm) return TR_GIRLS.has(n.id) ? 'lass' : 'man';
  const h = [...String(n.id)].reduce((a, c) => a * 31 + c.charCodeAt(0) >>> 0, 7);   // townspeople: a steady mix
  return ['man', 'lass', 'kid', 'granny', 'man', 'lass', 'scholar', 'kid'][h % 8];
}
function trSpriteGrid(A, face, step, ride) {
  const G = [...Array(18)].map(() => Array(16).fill(-1));
  const P = (x, y, c) => { if (x >= 0 && x < 16 && y >= 0 && y < 18) G[y][x] = c; };
  const Rc = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(x + i, y + j, c); };
  const down = face === 'down', back = face === 'up', side = face === 'side';
  const sh = A.small ? 1 : 0;                                         // kids are a little shorter
  const HEAD = { 2: [5, 10], 3: [4, 11], 4: [3, 12], 5: [3, 12], 6: [3, 12], 7: [3, 12], 8: [4, 11] };
  const headRows = (y0, y1, c) => { for (let y = y0; y <= y1; y++) { const [a, b] = HEAD[y]; Rc(a, y + sh, b - a + 1, 1, c); } };
  // body first (the head overlaps it)
  const shirt = A.shirt, pants = A.pants ?? 3;
  if (A.cape && (back || side)) back ? Rc(3, 9 + sh, 10, 6 - sh, 3) : Rc(9, 9 + sh, 4, 6 - sh, 3);
  if (A.slim) { Rc(5, 9 + sh, 6, 1, shirt); Rc(5, 10 + sh, 6, 3 - sh, shirt); Rc(6, 13, 4, 1, shirt); }   // a slimmer build
  if (A.jacket) {   // an open jacket over the shirt: jacket panels on the sides, the shirt showing down the middle, dark lapels
    const J = A.jacket, x0 = A.slim ? 5 : 4, w = A.slim ? 6 : 8;
    Rc(x0, 9 + sh, w, 4 - sh, J); Rc(x0 + 1, 13, w - 2, 1, J);
    if (down) { Rc(7, 10 + sh, 2, 4 - sh, shirt); Rc(7, 9 + sh, 2, 1, shirt); P(6, 9 + sh, 3); P(9, 9 + sh, 3); P(6, 10 + sh, 3); P(9, 10 + sh, 3); }
    if (side) { Rc(x0, 10 + sh, 1, 3 - sh, shirt); P(x0 + 1, 9 + sh, 3); }
  }
  else { Rc(5, 9 + sh, 6, 1, shirt); Rc(4, 10 + sh, 8, 3 - sh, shirt); Rc(5, 13, 6, 1, shirt); }
  if (A.body === 'coat') { Rc(4, 10 + sh, 8, 5 - sh, shirt); if (down) Rc(7, 10 + sh, 2, 5 - sh, shirt === 0 ? 1 : 3); }
  if (A.body === 'dress') Rc(3, 12, 10, 3, shirt);
  if (A.body === 'stripes') for (let y = 10 + sh; y <= 13; y += 2) Rc(4, y, 8, 1, shirt === 0 ? 2 : 0);
  if (A.body === 'apron' && !back) side ? Rc(4, 10, 3, 4, 0) : (Rc(6, 10, 4, 4, 0), P(6, 9, 0), P(9, 9, 0));
  if (A.scarf) { Rc(4, 9 + sh, 8, 1, 1); if (side) Rc(11, 10 + sh, 2, 2, 1); }
  if (A.cape && down) { P(3, 9 + sh, 3); P(12, 9 + sh, 3); Rc(4, 9 + sh, 8, 1, 3); }
  if (A.pack) { if (back) { Rc(5, 9 + sh, 6, 4, 2); Rc(6, 10 + sh, 4, 1, 3); } else if (side) Rc(10, 9 + sh, 3, 4, 2); else { Rc(5, 9 + sh, 1, 3, 3); Rc(10, 9 + sh, 1, 3, 3); } }
  if (A.badge && down) P(9, 10 + sh, 0);
  // arms swing a little while walking
  const sw = step ? 1 : 0;
  if (side) { Rc(7, 10 + sh, 2, 3 - sh, A.jacket ? 3 : shirt === 0 ? 1 : shirt === 1 ? 2 : 3); P(7 + (sw ? -1 : 1), 13, 0); }
  else { const l = A.slim ? 4 : 3, r = A.slim ? 11 : 12, sl = A.jacket || shirt; Rc(l, 10 + sh, 1, 3 - sh, sl); Rc(r, 10 + sh, 1, 3 - sh, sl); P(l, 13 - sw, 0); P(r, 12 + sw, 0); }
  // legs and the scooter
  if (ride) { Rc(5, 14, 2, 1, pants); Rc(9, 14, 2, 1, pants); Rc(2, 15, 12, 1, 3); Rc(3, 16, 2, 1, 2); Rc(11, 16, 2, 1, 2); if (side) Rc(3, 9, 1, 6, 3); else Rc(7, 9 + sh, 2, 1, 3); }
  else if (A.body !== 'dress' || step) {
    if (side) { Rc(6 - sw, 14, 2, 2 - sw, pants); Rc(8 + sw, 14, 2, 2, pants); }
    else { Rc(5, 14, 2, 2 - sw, pants); Rc(9, 14, 2, 2, pants); }
  } else Rc(5, 15, 6, 1, 3);
  // head
  headRows(2, 8, 0);
  const hair = (y1, c = 3) => headRows(2, y1, c);
  switch (A.hair) {
    case 'short': hair(3); if (down) { P(3, 4 + sh, 3); P(12, 4 + sh, 3); } if (side) Rc(9, 4 + sh, 4, 3, 3); if (back) hair(8); break;
    case 'tuft': hair(3); if (down) { P(3, 4 + sh, 3); P(12, 4 + sh, 3); } if (side) Rc(10, 4 + sh, 3, 2, 3); if (back) hair(7); break;   // a rounded mop
    case 'long': { const hc = A.hairC ?? 3; hair(3, hc); if (down) { Rc(3, 4 + sh, 2, 7, hc); Rc(11, 4 + sh, 2, 7, hc); } if (side) Rc(8, 4 + sh, 5, 7, hc); if (back) { hair(8, hc); Rc(4, 9, 8, 2, hc); } break; }
    case 'bun': hair(3, 1); Rc(6, 1, 4, 1, 1); if (down) { P(3, 4, 1); P(12, 4, 1); } if (side) { Rc(9, 4, 4, 2, 1); Rc(12, 2, 2, 3, 1); } if (back) { hair(6, 1); Rc(6, 2, 4, 3, 2); Rc(7, 1, 2, 1, 2); } break;   // a round bun at the back, not on top
    case 'bald': if (!back) { Rc(3, 4, 1, 2, 1); Rc(12, 4, 1, 2, 1); } if (side) Rc(10, 4, 3, 3, 1); if (back) Rc(3, 4, 10, 3, 1); break;
    case 'cap': hair(3, A.capC); if (down) { Rc(3, 4, 10, 1, 3); P(7, 2, 0); P(8, 2, 0); } if (side) { Rc(1, 4, 7, 1, 3); Rc(10, 4, 3, 2, 3); } if (back) { hair(4, A.capC); Rc(4, 5, 8, 3, 3); } break;
    case 'peaked': hair(3, A.capC); P(2, 3, A.capC); P(13, 3, A.capC); if (down) { Rc(3, 4, 10, 1, 3); P(7, 2, 1); P(8, 2, 1); } if (side) Rc(1, 4, 6, 1, 3); if (back) { hair(4, A.capC); Rc(4, 5, 8, 3, 3); } break;
    case 'wide': Rc(5, 0, 6, 3, 2); Rc(1, 3, 14, 1, 2); if (side) Rc(10, 4, 3, 2, 3); if (back) Rc(3, 4, 10, 4, 3); break;
    case 'sailorcap': hair(2, 0); Rc(4, 3, 8, 1, 3); P(7, 1, 0); P(8, 1, 0); if (side) Rc(10, 4, 3, 2, 3); if (back) Rc(3, 4, 10, 4, 3); break;
    case 'bandana': hair(3, 1); if (side) { Rc(10, 4, 3, 2, 3); P(13, 3, 1); P(13, 4, 1); } if (back) { hair(7); Rc(5, 2, 6, 2, 1); P(7, 4, 1); P(8, 4, 1); } break;
    case 'hood': headRows(2, 8, 2); if (down) { Rc(5, 4, 6, 4, 0); Rc(5, 7, 6, 1, 3); } if (side) { Rc(3, 4, 4, 4, 0); Rc(3, 7, 4, 1, 3); } break;   // a smooth, round hood
    case 'slick': hair(3); if (down) { Rc(3, 4, 1, 3, 3); Rc(12, 4, 1, 3, 3); } if (side) Rc(8, 4, 5, 3, 3); if (back) hair(8); break;
    case 'spiky': hair(3); if (down) { Rc(3, 4, 1, 2, 3); Rc(12, 4, 1, 2, 3); P(5, 4, 3); P(10, 4, 3); } if (side) Rc(9, 4, 4, 3, 3); if (back) hair(8); break;   // full, rounded hair with bangs (no spikes)
  }
  if (A.beard && !back) down ? (Rc(5, 7, 6, 2, 1), Rc(6, 6, 4, 1, 1), Rc(6, 9, 4, 1, 1)) : (Rc(3, 7, 4, 2, 1), P(4, 9, 1));
  // face
  const ey = 5 + sh;
  if (A.hair !== 'hood' || !back) {
    if (down) { Rc(6, ey, 1, 2, 3); Rc(9, ey, 1, 2, 3); if (!A.beard && A.hair !== 'hood' && !trIsFull()) P(3, 7 + sh, 1), P(12, 7 + sh, 1); }   // blush (Full color uses clothing colors for that shade)
    if (side) Rc(4, ey, 1, 2, 3);
    if (A.mouth && down) Rc(7, 8 + sh, 2, 1, 3);   // a little rectangle mouth
    if (A.mouth && side) Rc(5, 8 + sh, 2, 1, 3);
  }
  if (A.glasses && down) { Rc(5, ey, 2, 1, 3); Rc(9, ey, 2, 1, 3); P(7, ey, 3); P(8, ey, 3); P(5, ey + 1, 1); P(10, ey + 1, 1); }
  if (A.glasses && side) { Rc(3, ey, 3, 1, 3); }
  // dark outline around everything
  const out = G.map(r => r.slice());
  for (let y = 0; y < 18; y++) for (let x = 0; x < 16; x++) if (G[y][x] < 0 && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (G[y + dy]?.[x + dx] ?? -1) >= 0)) out[y][x] = 3;
  return out;
}
function trPersonArt(who, dir, step, ride) {
  const key = typeof who === 'string' ? who : who === 0 ? 'player' : 'man', A = TR_ARCH[key] || TR_ARCH.man;
  return trCache[`p${key}${dir}${step ? 1 : 0}${ride ? 'r' : ''}`] ||= trCanvas(16, 18, (g, P) => {
    const face = dir === 'up' ? 'up' : dir === 'down' ? 'down' : 'side';
    let G = trSpriteGrid(A, face, step, ride);
    if (dir === 'right') G = G.map(r => r.slice().reverse());
    G.forEach((r, y) => r.forEach((c, x) => { if (c >= 0) { g.fillStyle = P(c); g.fillRect(x, y, 1, 1); } }));
  }, trIsFull() ? TR_FULL_PEOPLE[key] || TR_FULL_PEOPLE.man : TR_PAL);
}
/* ---------- Hall badges (original designs) ---------- */
const TR_BADGES = [
  { name: 'Lexicon Badge', leader: 'Hall Leader Iris', town: 'Lexicon Town', motif: 'book', desc: 'An open book. Proof that you know your words.' },
  { name: 'Harbor Badge', leader: 'Captain Remy', town: 'Saltwick Harbor', motif: 'anchor', desc: 'A ship’s anchor on a wave. Verbs never stop moving.' },
  { name: 'Ember Badge', leader: 'Hall Leader Marisol', town: 'Cinderglen', motif: 'flame', desc: 'A bright little flame. Adjectives make words glow.' },
  { name: 'Summit Badge', leader: 'Archivist Oduya', town: 'Summit City', motif: 'mountain', desc: 'A snowy peak. Nouns are as solid as mountains.' },
  { name: 'Frost Badge', leader: 'Hall Leader Sora', town: 'Glimmerfrost', motif: 'snowflake', desc: 'A six-sided snowflake. Adjectives can be cool, too.' },
  { name: 'Fable Badge', leader: 'Storyteller Bramble', town: 'Fablemere', motif: 'scroll', desc: 'A quill on an open scroll. Every story is built from Nouns.' },
  { name: 'Echo Badge', leader: 'Maestro Calloway', town: 'Sandscript', motif: 'note', desc: 'A ringing music note. Verbs keep the rhythm going.' },
  { name: 'Star Badge', leader: 'Stargazer Elio', town: 'Starhaven', motif: 'star', desc: 'A shining star. You know every kind of word.' },
];
const TR_BADGE_COUNT = 8;
function trBadgeArt(n, empty) {
  return trCache[`badge${n}${empty ? 'e' : ''}`] ||= trCanvas(24, 24, (g, P) => {
    const R = (x, y, w, h, c) => { g.fillStyle = P(c); g.fillRect(x, y, w, h); };
    const poly = (pts, c) => { g.fillStyle = P(c); g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };
    const shapes = [
      [[12, 1], [20, 4], [23, 12], [20, 20], [12, 23], [4, 20], [1, 12], [4, 4]],          // octagon
      [[3, 2], [21, 2], [21, 12], [12, 23], [3, 12]],                                       // shield
      [[12, 0], [24, 12], [12, 24], [0, 12]],                                               // diamond
      [[12, 1], [23, 9], [19, 23], [5, 23], [1, 9]],                                        // pentagon
      [[12, 0], [22, 6], [22, 18], [12, 24], [2, 18], [2, 6]],                              // hexagon
      [[1, 4], [23, 4], [23, 20], [1, 20]],                                                 // banner
      [...Array(16)].map((_, i) => [12 + 11.6 * Math.cos(i * Math.PI / 8), 12 + 11.6 * Math.sin(i * Math.PI / 8)]), // circle
      [...Array(10)].map((_, i) => [12 + (i % 2 ? 6 : 12) * Math.sin(i * Math.PI / 5), 12.5 - (i % 2 ? 6 : 12) * Math.cos(i * Math.PI / 5)]), // star
    ][n - 1];
    poly(shapes, 3);
    const inner = shapes.map(([x, y]) => [12 + (x - 12) * 0.78, 12 + (y - 12) * 0.78]);
    poly(inner, empty ? 0 : 1);
    if (empty) return;
    if (n === 1) { poly([[5, 9], [12, 11], [12, 18], [5, 16]], 0); poly([[19, 9], [12, 11], [12, 18], [19, 16]], 0); R(11, 11, 2, 7, 3); R(6, 12, 4, 1, 2); R(14, 12, 4, 1, 2); R(6, 14, 4, 1, 2); R(14, 14, 4, 1, 2); }
    if (n === 2) { R(11, 5, 2, 12, 3); R(8, 7, 8, 2, 3); g.strokeStyle = P(3); g.lineWidth = 2; g.beginPath(); g.arc(12, 12, 5, 0.3, Math.PI - 0.3); g.stroke(); R(11, 4, 2, 2, 0); R(5, 17, 3, 1, 0); R(16, 17, 3, 1, 0); }
    if (n === 3) { poly([[12, 4], [17, 13], [15, 18], [9, 18], [7, 13]], 3); poly([[12, 8], [15, 14], [13, 17], [11, 17], [9, 14]], 0); R(11, 14, 2, 3, 1); }
    if (n === 4) { poly([[4, 19], [10, 8], [13, 12], [15, 10], [20, 19]], 3); poly([[8, 12], [10, 8], [12, 11]], 0); poly([[14, 12], [15, 10], [17, 13]], 0); R(5, 19, 15, 1, 2); }
    if (n === 5) { R(11, 5, 2, 14, 3); R(5, 11, 14, 2, 3); for (let i = -4; i <= 4; i++) { R(11 + i, 11 + i, 2, 2, 3); R(11 + i, 11 - i, 2, 2, 3); } R(11, 11, 2, 2, 0); R(10, 5, 4, 1, 3); R(10, 18, 4, 1, 3); }
    if (n === 6) { R(5, 8, 14, 9, 0); R(4, 7, 2, 11, 3); R(18, 7, 2, 11, 3); R(7, 10, 8, 1, 2); R(7, 12, 8, 1, 2); R(7, 14, 5, 1, 2); for (let i = 0; i < 5; i++) R(13 + i, 16 - i * 2, 2, 2, 3); R(18, 6, 2, 2, 3); }
    if (n === 7) { R(13, 6, 2, 10, 3); R(9, 14, 6, 4, 3); R(15, 6, 4, 2, 3); R(17, 8, 2, 2, 3); R(10, 15, 2, 1, 0); }
    if (n === 8) { R(11, 8, 2, 9, 0); R(8, 11, 8, 2, 0); R(10, 10, 4, 4, 0); return; }
    R(6, 4, 2, 1, 0); R(5, 5, 1, 2, 0);                                                    // shine
  }, trIsFull() ? TR_FULL_GOLD : TR_PAL);
}
const trBadgeImg = (n, size = 20, empty) => { try { return `<img class="tr-badge-img" src="${trBadgeArt(n, empty).toDataURL()}" width="${size}" height="${size}" alt="${esc(TR_BADGES[n - 1].name)}">`; } catch { return '🏅'; } };
const trBadgeRow = (s, size = 18) => TR_BADGES.map((_, i) => trBadgeImg(i + 1, size, !s.seals[i + 1])).join('');
const trItemArt = () => trCache.item ||= trCanvas(16, 16, (g, P) => { const R = (x, y, w, h, c) => { g.fillStyle = P(c); g.fillRect(x, y, w, h); };
  R(4, 6, 8, 7, 3); R(5, 7, 6, 5, 1); R(6, 4, 4, 2, 3); R(7, 9, 2, 1, 3); R(12, 2, 1, 3, 2); R(11, 3, 3, 1, 2); }, trIsFull() ? TR_FULL_ITEM : TR_PAL);
/* Block ball: the little cube a young Wordling sleeps in. 14x14, top face, front face, side face, seam and latch. */
const TR_FULL_BLOCK = { ball: ['#ffffff', '#a8d8ff', '#3a7ad8', '#10204a'], gold: TR_FULL_GOLD, verb: ['#fffbe0', '#ffe066', '#d89a18', '#3a2808'], noun: ['#f0ffe8', '#9ad87a', '#4a8a3a', '#14280e'], adj: ['#fff0f6', '#ffb0d0', '#d0508a', '#3a0a20'] };
const trBlockArt = (type = 'verb', open = 0) => trCache['block' + type + open] ||= trCanvas(14, 14, (g, P) => { const R = (x, y, w, h, c) => { g.fillStyle = P(c); g.fillRect(x, y, w, h); };
  const lift = open ? 3 : 0;
  // front and side faces
  R(0, 4, 12, 9, 3); R(1, 5, 10, 7, 1); R(12, 3, 1, 9, 3); R(11, 4, 1, 8, 2); R(13, 2, 1, 9, 3); R(12, 2, 1, 1, 3);
  R(1, 8, 10, 1, 3); R(11, 8, 1, 1, 3); R(1, 9, 10, 3, 2); R(2, 5, 2, 1, 0);
  R(4, 7, 4, 3, 3); R(5, 8, 2, 1, 0);   // the latch
  // top face (lifts up when it opens)
  R(3, 0 - lift, 11, 1, 3); R(2, 1 - lift, 1, 1, 3); R(1, 2 - lift, 1, 1, 3); R(0, 3 - lift, 13, 1, 3); R(3, 1 - lift, 10, 1, 0); R(2, 2 - lift, 10, 1, 0); R(12, 2 - lift, 1, 1, 2);
  if (open) { R(1, 4, 10, 1, 0); R(3, 5, 6, 1, 0); }
}, trIsFull() ? TR_FULL_BLOCK[type] : TR_PAL);
/* Wordling cries: the three starters each have their own; every other Wordling gets one from its name */
const TR_CRIES = {
  quillip:   [[0, 900, 1500, 0.08, 'square', 0.35], [0.1, 1000, 1700, 0.08, 'square', 0.35], [0.22, 1200, 2100, 0.18, 'triangle', 0.7]],          // chirp-chirp-tweet!
  mossling:  [[0, 200, 320, 0.13, 'sine', 0.9], [0.15, 170, 260, 0.14, 'sine', 0.9], [0.32, 280, 130, 0.32, 'triangle', 0.8]],                    // bwomp-bwomp-hmmm
  petalwisp: [[0, 1300, 1800, 0.1, 'sine', 0.6], [0.11, 1800, 1250, 0.12, 'sine', 0.6], [0.24, 1500, 2600, 0.36, 'triangle', 0.55], [0.3, 2400, 3000, 0.3, 'sine', 0.25]],   // a sparkly swirl
};
function trCry(sp) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ac = window.audioCtx ||= new AC(); if (ac.state === 'suspended') ac.resume();
    let notes = TR_CRIES[sp] || TR_CRIES[TR_SPECIES[sp]?.from];
    if (!notes) { let h = 7; for (const ch of String(sp)) h = (h * 31 + ch.charCodeAt(0)) % 9973; notes = [0, 1, 2].map(i => { const f = 250 + ((h >> i) % 9) * 110; return [i * 0.12, f, f * (i % 2 ? 0.8 : 1.3), 0.11 + (i === 2 ? 0.1 : 0), ['square', 'triangle', 'sawtooth'][(h + i) % 3], 0.4]; }); }
    const out = ac.createGain(); out.gain.value = 0.18; out.connect(ac.destination); const t0 = ac.currentTime + 0.03;
    for (const [dt, f1, f2, dur, type, vol] of notes) { const o = ac.createOscillator(), g = ac.createGain(), t = t0 + dt; o.type = type;
      o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.05);
      o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.1); }
    if (typeof trMusic !== 'undefined') { trMusic.setDuck(0.3); setTimeout(() => trMusic.setDuck(1), 900); }
  } catch {}
}
/* Creature kit: builds a Wordling from a body shape and parts (see trails-dex.js) */
function trKitDraw(g, P, spec, stage) {
  const [body, ears, horns, wings, tail, pattern, eyes, acc, shade] = spec.split(' '), c = +shade || 0, k = [0.78, 0.92, 1.06][Math.min(2, (stage || 1) - 1)];
  const E = (x, y, rx, ry, col, o = 1) => { if (o) { g.fillStyle = P(3); g.beginPath(); g.ellipse(x, y, rx + 1, ry + 1, 0, 0, 7); g.fill(); } g.fillStyle = P(col); g.beginPath(); g.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, 7); g.fill(); };
  const T = (pts, col, o = 1) => { g.fillStyle = P(col); g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); if (o) { g.strokeStyle = P(3); g.lineWidth = 1; g.stroke(); } };
  const R = (x, y, w, h, col) => { g.fillStyle = P(col); g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  const L = (pts, col, wd = 1.5) => { g.strokeStyle = P(col); g.lineWidth = wd; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
  const alt = c === 1 ? 2 : 1, cx = 16, cy = 19;
  let head = { x: cx, y: cy - 6 * k, r: 6 * k }, bb = { x: cx, y: cy + 2, rx: 9 * k, ry: 7 * k };
  const tailAt = (x, y) => {
    if (tail === 'long') L([[x, y], [x - 5 * k, y - 3], [x - 8 * k, y - 8 * k]], 3, 2);
    if (tail === 'fluffy') E(x - 4 * k, y - 3 * k, 4.5 * k, 3.5 * k, alt);
    if (tail === 'flame') { T([[x, y], [x - 8 * k, y - 10 * k], [x - 3 * k, y - 4 * k], [x - 2 * k, y - 12 * k]], 1); T([[x - 1, y - 1], [x - 5 * k, y - 7 * k], [x - 2 * k, y - 5 * k]], 0, 0); }
    if (tail === 'leaf') { E(x - 5 * k, y - 4 * k, 5 * k, 2.5 * k, 2); L([[x, y], [x - 9 * k, y - 6 * k]], 3, 1); }
    if (tail === 'fin') T([[x, y], [x - 7 * k, y - 6 * k], [x - 7 * k, y + 6 * k]], alt);
  };
  const wingsAt = (x, y) => {
    if (wings === 'feather') { E(x - 3, y - 4 * k, 6 * k, 4 * k, alt); L([[x - 7 * k, y - 4 * k], [x, y - 4 * k]], 3, 1); }
    if (wings === 'bat') { T([[x, y - 2], [x - 12 * k, y - 10 * k], [x - 9 * k, y - 2], [x - 13 * k, y + 1]], 3, 0); T([[x, y - 2], [x + 12 * k, y - 10 * k], [x + 9 * k, y - 2], [x + 13 * k, y + 1]], 3, 0); }
    if (wings === 'bug') { E(x - 6 * k, y - 7 * k, 5 * k, 4 * k, 0); E(x + 6 * k, y - 7 * k, 5 * k, 4 * k, 0); }
  };
  let drawHead = true;
  switch (body) {
    case 'blob': wingsAt(cx, cy); tailAt(cx - 8 * k, cy + 4); E(cx, cy + 4, 11 * k, 8 * k, c); E(cx, cy - 1, 8 * k, 6 * k, c, 0); head = { x: cx, y: cy, r: 7 * k }; bb = { x: cx, y: cy + 5, rx: 9 * k, ry: 5 * k }; drawHead = false; break;
    case 'bird': tailAt(cx - 7 * k, cy + 3); E(cx - 1, cy + 3, 8 * k, 6 * k, c); wingsAt(cx - 1, cy + 4); head = { x: cx + 6 * k, y: cy - 5 * k, r: 5.5 * k }; E(head.x, head.y, head.r, head.r, c); drawHead = false;
      T([[head.x + head.r - 1, head.y - 1], [head.x + head.r + 5 * k, head.y + 1], [head.x + head.r - 1, head.y + 3]], alt); R(cx - 3, cy + 9 * k, 1.5, 4, 3); R(cx + 2, cy + 9 * k, 1.5, 4, 3); bb = { x: cx - 1, y: cy + 3, rx: 7 * k, ry: 5 * k }; break;
    case 'beast': tailAt(cx - 8 * k, cy + 1); wingsAt(cx - 2, cy + 2); for (const lx of [-7, -3, 2, 6]) R(cx + lx * k, cy + 6 * k, 2.2 * k, 5 * k, 3);
      E(cx - 2, cy + 2, 9.5 * k, 6.5 * k, c); head = { x: cx + 7 * k, y: cy - 4 * k, r: 6 * k }; bb = { x: cx - 2, y: cy + 2, rx: 8 * k, ry: 5 * k }; break;
    case 'bug': wingsAt(cx, cy); tailAt(cx - 10 * k, cy + 3); for (let i = -1; i <= 1; i++) L([[cx + i * 5 * k, cy + 4], [cx + i * 6 * k - 2, cy + 11 * k]], 3, 1.2);
      E(cx - 7 * k, cy + 3, 5 * k, 4.5 * k, c); E(cx, cy + 3, 5.5 * k, 5 * k, alt); head = { x: cx + 7 * k, y: cy + 1, r: 5 * k }; bb = { x: cx - 3, y: cy + 3, rx: 8 * k, ry: 4 * k }; break;
    case 'fish': tailAt(cx - 10 * k, cy + 1); T([[cx - 2, cy - 5 * k], [cx + 3, cy - 11 * k], [cx + 5, cy - 5 * k]], alt); E(cx, cy + 1, 11 * k, 6.5 * k, c); wingsAt(cx, cy);
      head = { x: cx + 6 * k, y: cy, r: 4.5 * k }; bb = { x: cx - 2, y: cy + 1, rx: 8 * k, ry: 5 * k }; drawHead = false; break;
    case 'plant': tailAt(cx - 6 * k, cy + 6); R(cx - 1, cy + 3, 2, 9 * k, 3); E(cx - 6 * k, cy + 7, 4 * k, 2 * k, 2); E(cx + 6 * k, cy + 5, 4 * k, 2 * k, 2); R(cx - 6 * k, cy + 10 * k, 12 * k, 3, 3);
      wingsAt(cx, cy - 2); head = { x: cx, y: cy - 3 * k, r: 7.5 * k }; E(head.x, head.y, head.r, head.r * 0.95, c); bb = { x: cx, y: cy - 3 * k, rx: 6 * k, ry: 6 * k }; drawHead = false; break;
    case 'golem': tailAt(cx - 9 * k, cy + 4); wingsAt(cx, cy); R(cx - 10 * k, cy - 2, 20 * k, 12 * k, 3); R(cx - 9 * k, cy - 1, 18 * k, 10 * k, c); R(cx - 13 * k, cy, 4 * k, 7 * k, 3); R(cx + 9 * k, cy, 4 * k, 7 * k, 3); R(cx - 7 * k, cy + 9 * k, 4 * k, 4, 3); R(cx + 3 * k, cy + 9 * k, 4 * k, 4, 3);
      head = { x: cx, y: cy - 7 * k, r: 6 * k }; R(head.x - head.r - 1, head.y - head.r - 1, head.r * 2 + 2, head.r * 2 + 2, 3); R(head.x - head.r, head.y - head.r, head.r * 2, head.r * 2, c); bb = { x: cx, y: cy + 3, rx: 8 * k, ry: 4 * k }; drawHead = false; break;
    case 'serpent': tailAt(cx - 11 * k, cy + 9); for (let i = 0; i < 5; i++) E(cx - 10 * k + i * 4.5 * k, cy + 8 - Math.sin(i * 1.3) * 4 * k, 3.6 * k, 3.4 * k, i % 2 ? alt : c); wingsAt(cx + 4, cy);
      head = { x: cx + 9 * k, y: cy - 4 * k, r: 5.5 * k }; bb = { x: cx - 2, y: cy + 7, rx: 9 * k, ry: 3 * k }; break;
    case 'object': tailAt(cx - 9 * k, cy + 4); wingsAt(cx, cy); R(cx - 9 * k, cy - 7 * k, 18 * k, 18 * k, 3); R(cx - 8 * k, cy - 6 * k, 16 * k, 16 * k, c); R(cx - 8 * k, cy - 6 * k, 16 * k, 3, alt); R(cx + 9 * k, cy - 2, 3, 7 * k, 3);
      head = { x: cx, y: cy - 1, r: 6 * k }; bb = { x: cx, y: cy + 6 * k, rx: 7 * k, ry: 2.5 * k }; drawHead = false; break;
    case 'wisp': T([[cx - 7 * k, cy], [cx + 7 * k, cy], [cx + 2, cy + 13 * k], [cx - 3, cy + 10 * k]], c); wingsAt(cx, cy - 2); tailAt(cx - 4 * k, cy + 9 * k);
      head = { x: cx, y: cy - 3 * k, r: 8 * k }; E(head.x, head.y, head.r, head.r, c); bb = { x: cx, y: cy + 1, rx: 6 * k, ry: 4 * k }; drawHead = false; break;
  }
  if (drawHead) E(head.x, head.y, head.r, head.r * 0.92, c);
  const hx = head.x, hy = head.y, hr = head.r;
  if (ears === 'pointy') { T([[hx - hr * 0.8, hy - hr * 0.4], [hx - hr * 0.6, hy - hr * 1.7], [hx - hr * 0.05, hy - hr * 0.8]], c); T([[hx + hr * 0.8, hy - hr * 0.4], [hx + hr * 0.6, hy - hr * 1.7], [hx + hr * 0.05, hy - hr * 0.8]], c); }
  if (ears === 'round') { E(hx - hr * 0.75, hy - hr * 0.85, hr * 0.38, hr * 0.38, c); E(hx + hr * 0.75, hy - hr * 0.85, hr * 0.38, hr * 0.38, c); }
  if (ears === 'long') { E(hx - hr * 0.4, hy - hr * 1.5, hr * 0.28, hr * 0.85, c); E(hx + hr * 0.4, hy - hr * 1.5, hr * 0.28, hr * 0.85, c); }
  if (horns === 'single') T([[hx - 1.5, hy - hr * 0.85], [hx, hy - hr * 1.9], [hx + 1.5, hy - hr * 0.85]], alt);
  if (horns === 'double') { T([[hx - hr * 0.7, hy - hr * 0.6], [hx - hr * 1.1, hy - hr * 1.6], [hx - hr * 0.25, hy - hr * 0.85]], alt); T([[hx + hr * 0.7, hy - hr * 0.6], [hx + hr * 1.1, hy - hr * 1.6], [hx + hr * 0.25, hy - hr * 0.85]], alt); }
  if (horns === 'antler') { L([[hx - 2, hy - hr * 0.8], [hx - hr * 0.6, hy - hr * 1.8], [hx - hr * 1.2, hy - hr * 2]], 3, 1.6); L([[hx + 2, hy - hr * 0.8], [hx + hr * 0.6, hy - hr * 1.8], [hx + hr * 1.2, hy - hr * 2]], 3, 1.6); }
  const pc = c === 0 ? 2 : 0;
  if (pattern === 'spots' || (stage === 3 && pattern === 'none')) { E(bb.x - bb.rx * 0.4, bb.y, bb.rx * 0.18 + 0.6, bb.ry * 0.2 + 0.6, pc, 0); E(bb.x + bb.rx * 0.3, bb.y - bb.ry * 0.3, bb.rx * 0.14 + 0.6, bb.ry * 0.16 + 0.6, pc, 0); E(bb.x + bb.rx * 0.1, bb.y + bb.ry * 0.45, bb.rx * 0.12 + 0.5, bb.ry * 0.14 + 0.5, pc, 0); }
  if (pattern === 'stripes') for (let i = -1; i <= 1; i++) R(bb.x + i * bb.rx * 0.45 - 0.5, bb.y - bb.ry * 0.7, 1.4, bb.ry * 1.4, 3);
  if (pattern === 'letters') { g.fillStyle = P(pc); g.font = `bold ${Math.round(6 * k)}px monospace`; g.textAlign = 'center'; g.fillText('abc', bb.x, bb.y + 2); }
  const ex = hr * 0.42, ey = hy - hr * 0.05;
  if (eyes === 'sleepy') { R(hx - ex - 1.5, ey, 3, 1, 3); R(hx + ex - 1.5, ey, 3, 1, 3); }
  else { const er = eyes === 'big' ? 2.4 : 1.6; E(hx - ex, ey, er, er * 1.1, 3, 0); E(hx + ex, ey, er, er * 1.1, 3, 0); R(hx - ex, ey - er * 0.6, 1, 1, 0); R(hx + ex, ey - er * 0.6, 1, 1, 0);
    if (eyes === 'angry') { L([[hx - ex - 2, ey - 3], [hx - ex + 1.5, ey - 2]], 3, 1); L([[hx + ex + 2, ey - 3], [hx + ex - 1.5, ey - 2]], 3, 1); } }
  R(hx - 1, hy + hr * 0.45, 2, 1, 3);
  const a = stage === 3 && acc === '-' ? 'crown' : acc;
  if (a === 'scarf') { R(hx - hr * 0.9, hy + hr * 0.75, hr * 1.8, 2.2, 1); R(hx + hr * 0.4, hy + hr * 0.75, 2, 5, 1); }
  if (a === 'glasses') { g.strokeStyle = P(3); g.lineWidth = 1; g.beginPath(); g.arc(hx - ex, ey, 2.6, 0, 7); g.moveTo(hx + ex + 2.6, ey); g.arc(hx + ex, ey, 2.6, 0, 7); g.stroke(); }
  if (a === 'bow') { T([[hx, hy - hr * 0.9], [hx - 4, hy - hr * 1.3], [hx - 4, hy - hr * 0.5]], 1); T([[hx, hy - hr * 0.9], [hx + 4, hy - hr * 1.3], [hx + 4, hy - hr * 0.5]], 1); }
  if (a === 'crown') T([[hx - hr * 0.6, hy - hr * 0.85], [hx - hr * 0.6, hy - hr * 1.5], [hx - hr * 0.3, hy - hr * 1.15], [hx, hy - hr * 1.6], [hx + hr * 0.3, hy - hr * 1.15], [hx + hr * 0.6, hy - hr * 1.5], [hx + hr * 0.6, hy - hr * 0.85]], 0);
  if (a === 'candle') { R(hx - 1, hy - hr - 5, 2, 4, 0); T([[hx, hy - hr - 10], [hx - 2, hy - hr - 5], [hx + 2, hy - hr - 5]], 1, 0); }
}
function trMonArt(sp, flip) {
  return trCache[`m${sp}${flip ? 'f' : ''}`] ||= trCanvas(32, 32, (g, P) => {
    if (flip) { g.translate(32, 0); g.scale(-1, 1); }
    if (TR_SPECIES[sp].kit) return trKitDraw(g, P, TR_SPECIES[sp].kit, TR_SPECIES[sp].stage);
    const E = (x, y, rx, ry, c, o = 1) => { if (o) { g.fillStyle = P(3); g.beginPath(); g.ellipse(x, y, rx + 1, ry + 1, 0, 0, 7); g.fill(); } g.fillStyle = P(c); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
    const T = (pts, c, o = 1) => { g.fillStyle = P(c); g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); if (o) { g.strokeStyle = P(3); g.lineWidth = 1; g.stroke(); } };
    const eye = (x, y) => { E(x, y, 1.6, 1.8, 3, 0); g.fillStyle = P(0); g.fillRect(Math.round(x), Math.round(y - 1), 1, 1); };
    const R = (x, y, w, h, c) => { g.fillStyle = P(c); g.fillRect(x, y, w, h); };
    const L = (pts, c, wd = 1.5) => { g.strokeStyle = P(c); g.lineWidth = wd; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
    switch (sp) {
      case 'quillip': T([[5, 18], [2, 6], [9, 16]], 3, 0); T([[6, 17], [4, 8], [9, 15]], 2, 0); E(15, 21, 9, 7, 1); E(22, 13, 6, 6, 1); T([[27, 12], [31, 14], [27, 16]], 2); E(13, 21, 5, 3.5, 2); eye(23.5, 12); R(13, 28, 2, 3, 3); R(18, 28, 2, 3, 3); break;
      case 'mossling': E(15, 20, 11, 8, 2); E(9, 15, 2.5, 2, 1, 0); E(15, 13, 3, 2, 1, 0); E(21, 15, 2.5, 2, 1, 0); E(27, 21, 4.5, 4, 1); eye(28, 20); R(7, 27, 3, 3, 3); R(19, 27, 3, 3, 3); R(4, 23, 24, 1, 3); break;
      case 'petalwisp': for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; E(16 + Math.cos(a) * 8, 13 + Math.sin(a) * 8, 4.5, 4.5, 1); } E(16, 13, 6, 6, 0); eye(14, 12.5); eye(18.5, 12.5); R(15, 20, 2, 10, 3); E(20, 26, 3.5, 1.8, 2); break;
      case 'inkblob': E(16, 22, 12, 8, 3, 0); E(16, 17, 8, 7, 3, 0); E(12, 14, 2.5, 2, 2, 0); R(6, 27, 2, 4, 3); R(24, 26, 2, 5, 3); E(12.5, 19, 2.2, 2.4, 0, 0); E(19.5, 19, 2.2, 2.4, 0, 0); R(12, 19, 1, 1, 3); R(19, 19, 1, 1, 3); break;
      case 'buzzlet': E(9, 9, 5, 4, 0); E(19, 8, 5, 4, 0); E(15, 18, 9, 7, 1); R(11, 12, 2, 13, 3); R(17, 12, 2, 13, 3); E(24, 15, 4.5, 4.5, 1); eye(25.5, 14); T([[5, 18], [1, 19], [5, 21]], 3, 0); break;
      case 'bookmite': R(3, 18, 22, 11, 3); R(4, 19, 20, 9, 2); R(5, 20, 9, 7, 0); R(15, 20, 8, 7, 0); R(14, 19, 1, 9, 3); E(19, 16, 4, 4, 1); E(23, 12, 4.5, 4.5, 1); E(21.5, 11, 2, 2, 0); E(25.5, 11, 2, 2, 0); R(21, 11, 1, 1, 3); R(25, 11, 1, 1, 3); R(23, 11, 1, 1, 3); break;
      case 'hushmoth': E(9, 12, 7, 8, 1); E(23, 12, 7, 8, 1); E(10, 24, 5, 5, 2); E(22, 24, 5, 5, 2); E(9, 11, 2.5, 2.5, 0, 0); E(23, 11, 2.5, 2.5, 0, 0); E(16, 17, 3, 9, 3, 0); R(13, 4, 1, 5, 3); R(18, 4, 1, 5, 3); E(14.5, 13, 1, 1, 0, 0); E(17.5, 13, 1, 1, 0, 0); break;
      case 'fernfox': E(8, 14, 6, 9, 2); for (let i = 0; i < 4; i++) R(3 + i * 2, 8 + i * 4, 3, 1, 1); E(17, 21, 8, 6, 1); E(24, 13, 5.5, 5, 1); T([[20, 9], [21, 2], [24, 8]], 1); T([[25, 8], [28, 2], [28, 10]], 1); eye(25.5, 12); R(29, 14, 2, 2, 3); R(13, 26, 2, 4, 3); R(20, 26, 2, 4, 3); break;
      case 'zapwick': R(10, 14, 12, 16, 3); R(11, 15, 10, 15, 0); R(11, 15, 10, 2, 1); E(13.5, 21, 1.4, 1.8, 3, 0); E(18.5, 21, 1.4, 1.8, 3, 0); R(15, 24, 2, 1, 3); R(15, 10, 2, 5, 3); T([[16, 0], [11, 9], [16, 13], [21, 9]], 1); T([[16, 4], [13.5, 9], [16, 11], [18.5, 9]], 0, 0); break;
      case 'folduck': T([[3, 22], [14, 10], [29, 22], [16, 28]], 0); T([[10, 18], [17, 4], [22, 18]], 1); T([[22, 18], [27, 9], [30, 12], [26, 20]], 0); T([[29, 10], [32, 11], [29, 13]], 2, 0); R(27, 10, 1, 1, 3); R(8, 22, 18, 1, 3); break;
      case 'cobblepup': E(15, 21, 10, 7, 2); E(10, 19, 3, 2.5, 1, 0); E(19, 23, 3, 2, 1, 0); E(24, 13, 6.5, 6, 2); T([[19, 9], [20, 3], [24, 8]], 3); T([[26, 8], [30, 4], [29, 11]], 3); eye(25.5, 12); E(29, 15, 1.8, 1.5, 3, 0); R(8, 26, 3, 4, 3); R(19, 26, 3, 4, 3); R(13, 18, 4, 1, 3); break;
      case 'lumabat': T([[2, 8], [12, 12], [10, 20], [6, 16], [3, 19]], 3); T([[30, 8], [20, 12], [22, 20], [26, 16], [29, 19]], 3); E(16, 14, 6.5, 6.5, 2); T([[11, 9], [12, 3], [15, 8]], 2); T([[17, 8], [20, 3], [21, 9]], 2); E(13.5, 13, 1.6, 1.8, 0, 0); E(18.5, 13, 1.6, 1.8, 0, 0); R(15.5, 20, 1, 4, 3); E(16, 27, 3.5, 4, 0); R(14, 23, 4, 1, 3); break;
      case 'ripplet': T([[16, 2], [8, 17], [24, 17]], 1, 0); E(16, 20, 9, 9, 1); E(12, 16, 2.5, 3.5, 0, 0); eye(13.5, 21); eye(19.5, 21); L([[12, 26], [16, 28], [20, 26]], 3, 1); L([[3, 30], [8, 28], [13, 30], [18, 28], [23, 30], [28, 28]], 2, 1.5); break;
      case 'gustling': g.strokeStyle = P(3); g.lineWidth = 2.5; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(16, 15, 11 - i * 3.5, i, i + 4.2); g.stroke(); } E(17, 15, 5, 5, 0); eye(15.5, 14.5); eye(19.5, 14.5); L([[3, 24], [9, 22], [12, 26]], 2); L([[22, 27], [27, 24], [30, 27]], 2); break;
      case 'sparkhorn': E(14, 20, 9, 6, 1); R(8, 24, 2, 7, 3); R(18, 24, 2, 7, 3); E(23, 13, 5, 5, 1); eye(24.5, 12); R(27, 14, 2, 2, 3); L([[21, 9], [19, 4], [16, 5]], 3, 1.8); L([[24, 8], [25, 3], [28, 2]], 3, 1.8); R(15, 3, 2, 2, 0); R(28, 1, 2, 2, 0); R(5, 16, 3, 2, 2); break;
      case 'anchorcrab': E(16, 21, 11, 7, 2); E(5, 15, 3.5, 3, 1); E(27, 15, 3.5, 3, 1); R(9, 13, 2, 4, 3); R(21, 13, 2, 4, 3); R(15, 8, 2, 12, 3); g.strokeStyle = P(3); g.lineWidth = 2; g.beginPath(); g.arc(16, 15, 5, 0.2, Math.PI - 0.2); g.stroke(); E(16, 7, 2, 2, 1); eye(12, 18); eye(20, 18); R(6, 27, 2, 3, 3); R(24, 27, 2, 3, 3); break;
      case 'boulderbear': E(16, 20, 12, 10, 2); E(16, 10, 8, 7, 2); E(9, 4, 3, 3, 2); E(23, 4, 3, 3, 2); E(10, 20, 3.5, 3, 1, 0); E(22, 24, 3, 2.5, 1, 0); E(17, 15, 2, 1.5, 1, 0); eye(13, 9); eye(19, 9); E(16, 13, 2.5, 1.8, 3, 0); R(6, 28, 5, 3, 3); R(21, 28, 5, 3, 3); break;
      case 'tomeguard': R(7, 6, 18, 22, 3); R(8, 7, 16, 20, 2); R(23, 7, 2, 20, 0); R(10, 10, 12, 6, 1); eye(13, 13); eye(19, 13); R(10, 20, 12, 1, 3); R(10, 23, 8, 1, 3); T([[7, 7], [16, 1], [25, 7]], 1); R(26, 10, 2, 14, 0); R(25, 14, 4, 1, 3); R(9, 28, 4, 3, 3); R(19, 28, 4, 3, 3); break;
      case 'glimmeray': T([[2, 16], [16, 6], [30, 16], [16, 24]], 1); R(16, 22, 1, 9, 3); E(16, 15, 4, 3, 0, 0); eye(13.5, 13); eye(18.5, 13); R(7, 14, 1, 1, 0); R(24, 15, 1, 1, 0); R(10, 18, 1, 1, 0); R(22, 11, 1, 1, 0); break;
      case 'emberling': E(14, 22, 9, 6, 2); E(22, 14, 6, 5.5, 2); T([[17, 10], [18, 4], [21, 9]], 2); T([[23, 9], [27, 4], [27, 11]], 2); eye(22, 13.5); eye(26, 13.5); R(10, 26, 2, 4, 3); R(17, 26, 2, 4, 3); T([[5, 21], [1, 9], [4, 4], [8, 12]], 1); T([[4, 16], [2, 9], [6, 12]], 0, 0); break;
      case 'shadeowl': E(16, 19, 11, 11, 3); E(16, 22, 7, 7, 2); T([[6, 9], [7, 2], [12, 8]], 3, 0); T([[26, 9], [25, 2], [20, 8]], 3, 0); E(11.5, 14, 4, 4, 0); E(20.5, 14, 4, 4, 0); E(11.5, 14, 1.8, 2, 3, 0); E(20.5, 14, 1.8, 2, 3, 0); T([[15, 17], [17, 17], [16, 20]], 1, 0); R(12, 29, 3, 2, 1); R(18, 29, 3, 2, 1); break;
      case 'grammaroth': E(16, 20, 13, 10, 3); E(16, 21, 8, 6, 2); T([[6, 12], [3, 2], [11, 9]], 1); T([[26, 12], [29, 2], [21, 9]], 1); E(11, 15, 2.2, 1.6, 0, 0); E(21, 15, 2.2, 1.6, 0, 0);
        g.fillStyle = P(0); g.font = 'bold 9px monospace'; g.textAlign = 'center'; g.fillText('Aa', 16, 25); R(6, 28, 4, 3, 3); R(22, 28, 4, 3, 3); break;
      case 'mutewyrm': E(8, 26, 6, 4, 3); E(15, 22, 6, 5, 2); E(22, 17, 6, 5, 3); E(23, 9, 7, 6, 2); T([[18, 5], [16, 0], [21, 3]], 1); T([[27, 4], [30, 0], [29, 6]], 1); E(21, 8, 1.8, 1.8, 0, 0); E(26, 8, 1.8, 1.8, 0, 0); R(19, 12, 9, 1, 3); for (let x = 19; x < 28; x += 2) R(x, 11, 1, 3, 0); R(5, 26, 6, 1, 2); break;
    }
  }, trMonPal(sp));
}
const trMonImg = (sp, size = 40, flip = false) => { try { return `<img class="tr-mon-img" src="${trMonArt(sp, flip).toDataURL()}" width="${size}" height="${size}" alt="${esc(TR_SPECIES[sp].name)}">`; } catch { return ''; } };

/* ---------- Game state ---------- */
let tr = null;
function startTrails(deckId) {
  trFix(trS());
  tr = { deckId, d: deckById(deckId), pool: runnerPool(deckId), queue: [], ui: null, bt: null, moving: null, held: null, cool: 4, frame: 0, np: {}, tick: Date.now(),
    session: { start: Date.now(), results: [], nuts: 0, wins: 0 }, loop: 0, ended: false, flash: 0, banner: null };
  go({ name: 'trails' });
  setTimeout(() => { if (tr && !tr.bt) trRivalCheck(); }, 600);
}
const trLead = () => trS().team.find(m => m.hp > 0);

/* ---------- NPCs: who is here right now ---------- */
function trNpcHere(n, s) {
  if (n.legend && (s.caught[n.legend] || (n.needVex && !s.beaten.vex) || tr?.legendGone?.[n.id])) return false;
  if (n.rival && s.flags.starter && !s.flags.postgame && s.flags.rivalLeft) return false;
  if (n.prof && (n.plaza ? !(s.beaten.champion && !s.beaten.profFinal && s.flags.profWalk) : (s.beaten.champion && !s.beaten.profFinal))) return false;
  if (n.gate && n.gate.open(s)) return false;
  if (n.leaves && s.beaten[n.id]) return false;
  return true;
}
function trNpcs(map) {
  const s = trS();
  return TR_MAPS[map].npcs.filter(n => trNpcHere(n, s)).map(n => { const o = tr?.np[`${map}:${n.id}`]; return o ? Object.assign(Object.create(n), o) : n; });
}
const trNpcAt = (map, x, y) => trNpcs(map).find(n => n.x === x && n.y === y);
const trItemsHere = map => TR_MAPS[map].items.filter(i => !trS().got[i.id] && i.x != null);
const trItemAt = (map, x, y) => trItemsHere(map).find(i => i.x === x && i.y === y);
const trCanWalk = (map, x, y) => TR_WALKABLE.has(trTile(map, x, y)) && !trNpcAt(map, x, y) && !trItemAt(map, x, y) && !(trS().x === x && trS().y === y && trS().map === map);

/* ---------- Questions from the deck ---------- */
function trCard() { if (!tr.queue.length) tr.queue = shuffle(tr.pool.slice()); return tr.queue.pop(); }
function trAsk(title, then) {
  const c = trCard(), rev = Math.random() < 0.3, prompt = rev ? c.back : c.front, answer = rev ? c.front : c.back;
  const pool = tr.pool.filter(x => x.id !== c.id).map(x => rev ? x.front : x.back);
  const q = { card: c, title, prompt, answer, lang: rev ? tr.d.backLang : tr.d.frontLang, opts: pickOptions(answer, pool, 4), t0: Date.now(), then, given: null };
  q.power = !!tr.askPower; tr.askPower = false; q.limit = tr.bt ? trTimeLimit() : 0; if (q.limit) q.timer = setTimeout(() => trTimeUp(q), q.limit * 1000);
  tr.ui = { type: 'question', q }; trBox(); if (typeof trMusic !== 'undefined') trMusic.setDuck(0.4);
  if (S.settings.trAloud ?? (typeof autoplayOn === 'function' && autoplayOn())) setTimeout(() => speak(prompt, q.lang), 150);
}
/* Battle answer timer: run out and you lose your turn. Answer fast for more power, slower for less. */
const TR_TIMER_CHOICES = [[2, '2 seconds (lightning)'], [8, '8 seconds (hard)'], [12, '12 seconds'], [20, '20 seconds (relaxed)'], [0, 'Off (no time limit)']];
const trTimeLimit = () => { const v = S.settings?.trTimer; return v === 0 ? 0 : TR_TIMER_CHOICES.some(c => c[0] === v) ? v : 12; };
function trSpeedMult(secs, limit) {   // x1.5 within 2 seconds, then a little less every moment, down to x0.75 at the end
  const L = limit || 20, t = Math.max(0, secs - 2), span = Math.max(1, L - 2);
  return Math.max(0.75, Math.round((1.5 - 0.75 * Math.min(1, t / span)) * 20) / 20);
}
function trTimerMenu() {
  const cur = trTimeLimit();
  trMenu('⏱️ Battle answer timer<br><small>Answer before it runs out or your Wordling loses its turn. Faster answers hit harder!</small>', TR_TIMER_CHOICES.map(([v, label]) => ({ label: `${v === cur ? '✅ ' : ''}${label}`,
    fn: () => { S.settings.trTimer = v; save(); trSay(v ? `⏱️ You’ll have ${v} seconds to answer in battles.` : '⏱️ No time limit. Faster answers still hit harder!', trMainMenu); } })), () => trMainMenu());
}
function trTimeUp(q) {
  if (!tr || tr.ui?.q !== q || q.given != null) return;
  q.given = ''; q.ok = false; q.timeout = true; q.fast = false; q.mult = 0;
  tr.session.results.push({ cardId: q.card.id, q: q.prompt, a: q.answer, given: '(time ran out)', ok: false });
  if (typeof sdSound === 'function') sdSound('wrong');
  trBox();
  setTimeout(() => { if (typeof trMusic !== 'undefined') trMusic.setDuck(1); if (tr?.ui?.q === q) { tr.ui = null; q.then(false, false, q); } }, 1500);
}
function trAnswer(i) {
  const q = tr.ui?.q; if (!q || q.given != null || !q.opts[i]) return;
  clearTimeout(q.timer); q.secs = (Date.now() - q.t0) / 1000; q.given = q.opts[i]; q.ok = norm(q.given) === norm(q.answer); q.mult = q.ok ? trSpeedMult(q.secs, q.limit) : 0; q.fast = q.ok && q.mult >= 1.3;
  tr.session.results.push({ cardId: q.card.id, q: q.prompt, a: q.answer, given: q.given, ok: q.ok });
  if (typeof sdSound === 'function') sdSound(q.ok ? 'right' : 'wrong');
  trBox();
  setTimeout(() => { if (typeof trMusic !== 'undefined') trMusic.setDuck(1); if (tr?.ui?.q === q) { tr.ui = null; q.then(q.ok, q.fast, q); } }, q.ok ? 750 : 1500);
}

/* ---------- Text box and menus (drawn over the game screen) ---------- */
function trSay(lines, then) { tr.ui = { type: 'text', lines: [].concat(lines), i: 0, then }; trBox(); }
function trMenu(title, items, back) { tr.ui = { type: 'menu', title, items, sel: Math.max(0, items.findIndex(x => !x.disabled)), back }; trBox(); }
function trA() {
  const u = tr.ui; if (!u) return trInteract();
  if (u.type === 'text') { u.i++; if (u.i >= u.lines.length) { tr.ui = null; trBox(); u.then?.(); } else trBox(); }
  else if (u.type === 'menu') { const it = u.items[u.sel]; if (it && !it.disabled) { tr.ui = null; it.fn(); if (!tr.ui) trBox(); } }
  else if (u.type === 'map') { tr.ui = null; trBox(); }
}
function trB() {
  const u = tr.ui;
  if (!u) { if (!tr.bt) trMainMenu(); return; }
  if (u.type === 'map') { tr.ui = null; return trMainMenu(); }
  if (u.type === 'menu' && u.back) { tr.ui = null; u.back(); if (!tr.ui) trBox(); }
  else if (u.type === 'text') trA();
  else if (u.type === 'rebind') { tr.ui = null; trControlsMenu(); }
}
const trLang = () => gtWant(tr?.d?.frontLang);
function trNames() {
  const s = trS(), npcNames = [];
  for (const m of Object.values(TR_MAPS)) for (const n of m.npcs || []) { if (n.name) npcNames.push(n.name); if (n.t?.name) npcNames.push(n.t.name); }
  return [s?.name, ...Object.values(TR_SPECIES).map(x => x.name), ...Object.values(TR_MOVES).map(x => x.name), ...Object.values(TR_ITEMS).map(x => x.name), ...Object.values(TR_KEY_ITEMS).map(x => x.name),
    ...Object.values(TR_MAPS).map(m => m.name), ...npcNames, 'Rio', 'Professor Rowan', 'Director Vex'].filter(Boolean);
}
function trBox() { trBoxRaw(); const l = trLang(), q = tr?.ui?.q; if (l) gtBox($('#trBox'), l, trNames().concat(q ? [q.answer, q.given] : [])); }
function trLangMenu() {
  const b = gtBase(tr.d?.frontLang), ok = !!GT_BOOKS[b], on = !!trLang();
  trMenu('🌐 Game language', [{ label: `${!on ? '✅ ' : ''}English`, fn: () => { S.settings.gameLang = 'en'; save(); trLangMenu(); } },
    { label: `${on ? '✅ ' : ''}${ok ? GT_LANG_NAMES[b] : (langName(tr.d?.frontLang) || 'Your language')}`, sub: ok ? 'Menus, battles and talk in the language you are learning. Names stay the same.' : 'Not ready yet for this deck’s language. Spanish decks can use it.', disabled: !ok,
      fn: () => { S.settings.gameLang = 'target'; save(); trLangMenu(); } }], () => trMainMenu());
}
/* 📂 load another slot without leaving the game */
function trLoadMenu() {
  const slots = trSlots(), cur = S.trailsSlot || 'a';
  trMenu('📂 Load game · your adventure here is saved first', ['a', 'b', 'c'].map(k => { const v = slots[k]; return {
    label: `Slot ${k.toUpperCase()}${k === cur ? ' · playing now' : ''}`, sub: v ? `${esc(v.name)} · 📍 ${esc(TR_MAPS[v.map]?.name || '')} · 🏅 ${trSeals(v)} · ${(v.team || []).length} Wordlings${v.savedAt ? ` · saved ${new Date(v.savedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` : ''}` : 'Empty',
    disabled: !v || k === cur, fn: () => trLoadSlot(k) }; }), () => trMainMenu());
}
function trLoadSlot(k) {
  trSaveNow(true);
  const old = tr; if (old.loop) cancelAnimationFrame(old.loop); old.loop = 0;
  S.trailsSlot = k; save();
  startTrails(old.deckId); tr.session = old.session;
  setTimeout(() => tr && !tr.ui && trSay(`📂 Loaded slot ${k.toUpperCase()}. Welcome back, ${esc(trS().name)}!`), 350);
}
function trBoxRaw() {
  const el = $('#trBox'); if (!el || !tr) return;
  const u = tr.ui;
  if (u?.type !== 'map') gameMapClose();
  el.classList.toggle('open', !!u); el.classList.toggle('big', u?.type === 'question' || (u?.type === 'menu' && (u.items.length > 4 || u.list)));
  if (!u || u.type === 'wait') { el.classList.remove('open'); el.innerHTML = ''; return; }
  if (u.type === 'text') { el.innerHTML = `<div class="tr-text">${u.lines[u.i]}</div><button type="button" class="tr-next" data-act="trA" aria-label="Next">▼</button>`; return; }
  if (u.type === 'map') { el.classList.remove('open'); el.innerHTML = ''; gameMapPop(trMapHtml(u), 'tr'); trMapDraw(); return; }
  if (u.type === 'rebind') { el.innerHTML = `<div class="tr-text">Press the key you want for <b>${esc(u.label)}</b>…<br><small>Esc cancels.</small></div>`; return; }
  if (u.type === 'menu') {
    el.innerHTML = `${u.title ? `<div class="tr-mtitle">${u.title}</div>` : ''}<div class="tr-menu ${u.items.length > 4 || u.list ? 'long' : ''}">${u.items.map((it, i) =>
      `<button type="button" class="tr-mi ${i === u.sel ? 'sel' : ''}" data-act="trPick" data-i="${i}" ${it.disabled ? 'disabled' : ''}><span class="tr-ml">${it.label}</span>${it.sub ? `<small>${it.sub}</small>` : ''}</button>`).join('')}</div>
      ${u.back ? '<button type="button" class="tr-back" data-act="trB">B · Back</button>' : ''}`;
    el.querySelector('.tr-mi.sel')?.scrollIntoView({ block: 'nearest' });
    return;
  }
  if (u.type === 'question') {
    const q = u.q;
    el.innerHTML = `<div class="tr-q"><div class="tr-mtitle">${q.title}</div>
      <div class="tr-prompt"><span>${esc(q.prompt)}</span>${typeof speakBtn === 'function' ? speakBtn(q.prompt, q.lang) : ''}</div>
      ${q.limit ? `<div class="tr-timer" title="Time left"><div style="animation-duration:${q.limit}s;animation-delay:-${Math.min(q.limit, (Date.now() - q.t0) / 1000).toFixed(2)}s${q.given != null ? ';animation-play-state:paused' : ''}"></div></div>` : ''}
      <div class="tr-opts">${q.opts.map((o, i) => { const st = q.given == null ? '' : norm(o) === norm(q.answer) ? 'right' : o === q.given ? 'wrong' : 'dim';
        return `<button type="button" class="tr-opt ${st}" data-act="trAns" data-i="${i}" ${q.given != null ? 'disabled' : ''}><kbd>${i + 1}</kbd>${esc(o)}</button>`; }).join('')}</div>
      ${q.given != null ? `<div class="tr-verdict ${q.ok ? 'ok' : 'no'}">${q.timeout ? `⏰ Time’s up! It was: <b>${esc(q.answer)}</b>` : q.ok ? `${q.fast ? '⚡ Fast and right!' : '✓ Right!'}${q.power ? ` <small>Power ×${q.mult.toFixed(2).replace(/0$/, '')} · ${q.secs.toFixed(1)}s</small>` : ''}` : `✗ It was: <b>${esc(q.answer)}</b>`}</div>` : ''}</div>`;
  }
}
function trHud() {
  const el = $('#trHud'); if (!el || !tr) return;
  const s = trS(); if (tr.bt) { el.innerHTML = ''; return; }
  el.innerHTML = `<span>📍 ${esc(TR_MAPS[s.map].name)}</span><span>🪙 ${s.coins}</span><span class="tr-badges">${trBadgeRow(s, 14)}</span>${s.riding ? '<span>🛴</span>' : ''}`;
}

/* ---------- Moving around ---------- */
function trStep() {
  if (tr.ui || tr.bt || tr.moving || !tr.held || tr.scene) return;
  const s = trS(), [dx, dy] = TR_DIRS[tr.held]; s.dir = tr.held;
  const nx = s.x + dx, ny = s.y + dy, m = TR_MAPS[s.map];
  const door = m.doors?.[`${nx},${ny}`];
  if (door && typeof door === 'object' && door.hall) { tr.held = null; return trEnterHall(door); }
  const ledge = TR_LEDGES[trTile(s.map, nx, ny)];
  if (ledge) {   // hop down a ledge: only in its direction, landing on the far side
    if (ledge !== tr.held || !trCanWalk(s.map, nx + dx, ny + dy)) return;
    tr.moving = { fx: s.x, fy: s.y, tx: nx + dx, ty: ny + dy, t: 0, hop: true }; trSound('hop'); return;
  }
  if (!trCanWalk(s.map, nx, ny)) return;
  if (tr.rivalShow && tr.rivalShow.x === nx && tr.rivalShow.y === ny) return;
  tr.moving = { fx: s.x, fy: s.y, tx: nx, ty: ny, t: 0 };
}
function trOpenings(m, side) {
  const W = m.rows[0].length, H = m.rows.length, out = [];
  if (side === 'top' || side === 'bottom') { const y = side === 'top' ? 0 : H - 1; for (let x = 0; x < W; x++) if (TR_WALKABLE.has(m.rows[y][x])) out.push(x); }
  else { const x = side === 'left' ? 0 : W - 1; for (let y = 0; y < H; y++) if (TR_WALKABLE.has(m.rows[y][x])) out.push(y); }
  return out;
}
function trArrive() {
  const s = trS(), m = TR_MAPS[s.map], W = m.rows[0].length, H = m.rows.length; s.steps++;
  if (tr.cool > 0) tr.cool--;
  const side = s.y === 0 ? 'top' : s.y === H - 1 ? 'bottom' : s.x === 0 ? 'left' : s.x === W - 1 ? 'right' : null;
  if (side && m.indoor && m.back) return trWarp(m.back.map, m.back.x, m.back.y, 'down');
  if (side && m.exits?.[side] && !s.team.length) { s.y = Math.min(m.rows.length - 2, Math.max(1, s.y + (side === 'top' ? 1 : -1))); tr.held = null; return trSay(['Rio: Hey, wait! Don’t go into the tall grass without a Wordling!', 'Rio: Professor Rowan is at the school, on the east side of town. Come on!']); }
  if (side && m.exits?.[side]) {
    const to = TR_MAPS[m.exits[side]], opp = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side];
    const mine = trOpenings(m, side), theirs = trOpenings(to, opp), k = Math.max(0, mine.indexOf(side === 'top' || side === 'bottom' ? s.x : s.y));
    const c = theirs[Math.min(k, theirs.length - 1)] ?? 1, TH = to.rows.length, TW = to.rows[0].length;
    if (opp === 'bottom') return trWarp(m.exits[side], c, TH - 2, 'up');
    if (opp === 'top') return trWarp(m.exits[side], c, 1, 'down');
    if (opp === 'right') return trWarp(m.exits[side], TW - 2, c, 'left');
    return trWarp(m.exits[side], 1, c, 'right');
  }
  if (trRivalNear()) return;
  for (const n of trNpcs(s.map)) if (n.trainer && !n.noSight && !s.beaten[n.id] && trSees(n, s.x, s.y)) return trTrainerSpots(n);
  const t = trTile(s.map, s.x, s.y);
  if (s.repel > 0 && --s.repel === 0) { trSaveNow(true); const more = ['wordcharm', 'bigcharm'].find(k => s.bag[k]);
    return trSay('🍃 Your Word charm’s glow fades. Wild Wordlings can find you again.', more ? () => trMenu(`Use another ${TR_ITEMS[more].name}? (You have ${s.bag[more]}.)`, [{ label: `${TR_ITEMS[more].icon} Yes`, fn: () => trUseRepel(more) }, { label: 'No thanks', fn: () => { tr.ui = null; trBox(); } }], () => { tr.ui = null; trBox(); }) : undefined); }
  // caves: wild Wordlings can jump out anywhere on the floor (more often on the rough patches); outside: only in tall grass
  const cave = m.theme === 'cave', rate = cave ? (t === ':' ? 0.1 : 0.06) : t === ':' ? 0.075 : 0.11;
  if ((cave || t === ',' || t === ':') && m.wild && tr.cool <= 0 && !(s.repel > 0) && Math.random() < rate) {
    const e = trPickWild(m.wild); if (e) return trWild(e.sp, e.lv);
  }
  if (s.steps % 25 === 0) trSaveNow(true);
}
function trPickWild(list) {
  const s = trS(), ok = list.filter(w => w[4] !== 'after' || s.beaten.vex), total = ok.reduce((a, w) => a + (w[3] ?? 1), 0);
  let r = Math.random() * total;
  for (const w of ok) { r -= w[3] ?? 1; if (r <= 0) { const lv = w[1] + Math.floor(Math.random() * (w[2] - w[1] + 1)); return { sp: trGrownForm(w[0], lv), lv }; } }
  return null;
}
function trSees(n, x, y) {
  const [dx, dy] = TR_DIRS[n.dir]; let cx = n.x, cy = n.y;
  for (let i = 0; i < 4; i++) { cx += dx; cy += dy; if (!TR_WALKABLE.has(trTile(trS().map, cx, cy))) return false; if (cx === x && cy === y) return true; if (trNpcAt(trS().map, cx, cy)) return false; }
  return false;
}
const trTrainerOf = n => n.trainer.rio ? { ...n.trainer, team: trRioTeam(n.trainer.rio) } : n.trainer;
function trTrainerSpots(n) {
  const s = trS(); s.dir = TR_BACK[n.dir];
  trSay([n.noSight ? `⚔️ <b>${esc(n.trainer.name)}</b> challenges you!` : `❗ <b>${esc(n.trainer.name)}</b> ${n.trainer.syndicate ? '(Hush Syndicate) ' : ''}spotted you!`, ...n.trainer.intro.map(l => `${esc(n.trainer.name)}: ${esc(l)}`)], () => trTrainerBattle(n.id, trTrainerOf(n)));
}
function trWarp(map, x, y, dir, quiet) {
  const s = trS(); Object.assign(s, { map, x, y, dir }); tr.cool = 3; tr.np = {};
  if (TR_MAPS[map].indoor) s.riding = false;
  if (TR_MAPS[map].fly) s.visited[map] = 1;
  (s.mapSeen ||= {})[map] = 1;
  trSaveNow(true); tr.flash = 10; trHud();
  tr.banner = quiet ? null : { text: TR_MAPS[map].name, until: tr.frame + 110 };
  if (!quiet) setTimeout(() => { if (tr && trS()?.map === map) { trRivalCheck(); trStadiumCheck(); } }, 450);
}
function trEnterHall(door) {
  const s = trS(), h = TR_MAPS[door.hall];
  if (door.open && !door.open(s)) return trSay((door.shut || ['The door is locked.']).map(l => esc(l)));
  if (door.need && trSeals(s) < door.need) return trSay([`The great doors are sealed shut. A sign reads: “Only those with ${door.need} Badges may enter.”`, `You have ${trSeals(s)}.`]);
  const e = h.entry || { x: 5, y: 10 }; trWarp(door.hall, e.x, e.y, 'up');
}
function trInteract() {
  if (tr.bt || tr.moving || tr.scene) return;
  const s = trS(), [dx, dy] = TR_DIRS[s.dir], fx = s.x + dx, fy = s.y + dy, m = TR_MAPS[s.map], key = `${fx},${fy}`;
  const it = trItemAt(s.map, fx, fy);
  if (it) return trPickUp(it);
  if (m.school && trTile(s.map, fx, fy) === 't' && fy === 3 && fx >= 4 && fx <= 6) return trBlockBall(fx - 4);
  const n = trNpcAt(s.map, fx, fy) || ('crt'.includes(trTile(s.map, fx, fy)) ? trNpcAt(s.map, fx + dx, fy + dy) : null);   // talk across a counter or the register
  if (n) return trTalk(n);
  if (m.signs?.[key]) return trSay(`🪧 ${esc(m.signs[key])}`);
  if (m.center && trTile(s.map, fx, fy) === 'q') return trPC();
  if (m.theme === 'mart' && trTile(s.map, fx, fy) === 'h') return trSay(['🛒 Shelves of Potions, Tonics and Block balls, all neatly stacked.', 'Take your pick, then pay at the register.']);
  if (m.theme === 'mart' && trTile(s.map, fx, fy) === 'f') return trSay(['🧊 A humming fridge full of cold Tonics and fizzy berry juice.', 'Pay the clerk at the register to buy anything.']);
  if (m.theme === 'house' && trTile(s.map, fx, fy) === 'b') return m.bed ? trHeal(m.bed) : trSay('That’s someone else’s bed. Better not!');
  if (m.theme === 'house' && trTile(s.map, fx, fy) === 'K') return trSay(['📚 A shelf full of well-loved books.', ['One is titled “Verbs, Nouns and You.”', 'One is titled “101 Ways to Cook a Potion.” Hmm.', 'One is a photo album full of Wordlings.'][(fx + fy) % 3]]);
  if (trTile(s.map, fx, fy) === 'W' && m.water && !s.team.length) return trSay('You need a Wordling before you go fishing!');
  if (trTile(s.map, fx, fy) === 'W' && m.water) {
    if (Math.random() < 0.55) { const e = trPickWild(m.water); return trSay(['You lower a block ball on a string into the water…', '…', '❗ Something bites!'], () => trWild(e.sp, e.lv)); }
    return trSay(['You lower a block ball on a string into the water…', '…nothing. Try again!']);
  }
  const door = m.doors?.[key];
  if (door && typeof door === 'object') return trEnterHall(door);
  if (door === 'rest' || door === 'home' || door === 'home2' || door === 'home3') return trHeal(door === 'rest' ? 'Welcome to the Clinic! Let your Wordlings rest a moment… 🍃' : door === 'home' ? 'Home sweet home! You take a nap and your Wordlings rest too. 💤' : 'A kind family lets you rest by their fire. 🔥');
  if (door === 'shop') return trShop();
  if (door === 'elder') return trElderTalk();
}
function trElderTalk() {
  const s = trS();
  {
    if (!s.flags.elderGift) { s.flags.elderGift = 1; s.bag.charm = (s.bag.charm || 0) + 5; trSaveNow(true);
      return trSay(['Elder Ana: Oh, a new explorer!', 'Words have been disappearing from our signs. People in grey coats call themselves the <b>Hush Syndicate</b>.', 'They say they “protect” words… by locking them away and charging a fee. Hmph.', 'Take these <b>5 block balls</b> 🧊. Catch Wordlings, beat the eight Hall Leaders, and set our words free!']); }
    return trSay(trSeals(s) >= TR_BADGE_COUNT && !s.beaten.vex ? 'Elder Ana: Eight Badges! The Grand Archive in Summit City awaits. Be brave.' : s.beaten.vex ? 'Elder Ana: You did it! Every word is back where it belongs. 🌿' : `Elder Ana: You have ${trSeals(s)} of ${TR_BADGE_COUNT} Badges. Keep going, dear.`);
  }
}
function trTalk(n) {
  if (n.prof) return trProfessor(n);
  if (n.rival) return trRioTalk(n);
  if (n.legend) return trSay(['The air shimmers and the ground hums…', `✨ A legendary Wordling, <b>${esc(TR_SPECIES[n.legend].name)}</b>, appears!`, `Its ability: <b>${TR_ABILITIES[TR_SPECIES[n.legend].ability].name}</b>. ${TR_ABILITIES[TR_SPECIES[n.legend].ability].desc}`], () => { trWild(n.legend, n.lv); tr.bt.legend = n.id; tr.bt.boss = true; trBattleMusic(); });
  if (n.nurse) return trNurse(n);
  if (n.clerk) return trSay(['Clerk: Welcome! 🛒 What can I ring up for you today?'], trShop);
  if (n.elder) return trElderTalk();
  if (n.gift) {   // a one-time gift of items, then helpful hints
    const s = trS(), gv = n.gift;
    if (s.flags[gv.flag]) return trSay([...(n.lines || []), ...gv.after].map(l => esc(l)));
    if (gv.ready && !gv.ready(s)) return trSay([...(n.lines || []), ...(gv.before || [])].map(l => esc(l)));
    s.flags[gv.flag] = 1; for (const [k, v] of Object.entries(gv.items)) s.bag[k] = (s.bag[k] || 0) + v; trSaveNow(true); trJingle('heal');
    return trSay([...(n.lines || []).map(l => esc(l)), ...gv.lines.map(l => esc(l)), ...Object.entries(gv.items).map(([k, v]) => `🎁 You got <b>${v > 1 ? v + ' × ' : ''}${TR_ITEMS[k].name}</b> ${TR_ITEMS[k].icon}!`)]);
  }
  const s = trS(); tr.np[`${s.map}:${n.id}`] = { ...(tr.np[`${s.map}:${n.id}`] || { x: n.x, y: n.y }), dir: TR_BACK[s.dir] };
  if (n.trainer) { if (!s.beaten[n.id]) return trTrainerSpots(n); if (s.flags.postgame && !n.trainer.syndicate && !n.trainer.final) return trRematchOffer(n); return trSay((n.trainer.after || ['Good battle!']).map(l => `${esc(n.trainer.name)}: ${esc(l)}`)); }
  if (n.gate) return trSay(n.gate.lines.map(l => esc(l)));
  if (n.ferry) {
    const f = n.ferry; if (f.open && !f.open(s)) return trSay(f.closed.map(l => esc(l)));
    return trMenu(`Ferryman: All aboard for ${esc(f.name)}? ⛴️`, [{ label: `⛴️ Sail to ${esc(f.name)}`, fn: () => trSay(['The ferry sets sail… 🌊', '…waves splash against the hull…', `You arrive at ${esc(f.name)}!`], () => trWarp(f.to, f.x, f.y, f.dir)) }, { label: 'Not now', fn: () => {} }], () => {});
  }
  if (n.give) {
    const gv = n.give;
    if (s.key[gv.key]) return trSay(gv.after.map(l => esc(l)));
    if (!gv.ready(s)) return trSay(gv.before.map(l => esc(l)));
    s.key[gv.key] = 1; trSaveNow(true); trJingle('heal');
    return trSay([...gv.lines, `🎁 You got the <b>${TR_KEY_ITEMS[gv.key].name}</b> ${TR_KEY_ITEMS[gv.key].icon}!`]);
  }
  if (n.shopkeeper) return trSay(n.lines.map(l => esc(l)), trShop);
  const pool = [...(n.lines || []), ...(n.chat ? [...TR_CHAT.any, ...(s.beaten.vex ? TR_CHAT.after : TR_CHAT.syndicate)] : [])];
  const line = n.chat ? pool[Math.floor(Math.random() * pool.length)] : null;
  return trSay(line ? [esc(line)] : (n.lines || ['Hello!']).map(l => esc(l)));
}
function trPickUp(it) {
  const s = trS(), lines = []; s.got[it.id] = 1;
  for (const [k, v] of Object.entries(it.give)) {
    if (k === 'coins') { s.coins += v; lines.push(`You found 🪙 ${v}!`); }
    else { s.bag[k] = (s.bag[k] || 0) + v; lines.push(`You found ${v > 1 ? v + ' × ' : 'a '}${TR_ITEMS[k].icon} <b>${TR_ITEMS[k].name}</b>!`); }
  }
  trSaveNow(true); trSay(lines);
}
/* a short original healing chime: bright bell notes rising, played as a sound effect (it plays even with the music off) */
function trChime() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const ac = window.audioCtx ||= new AC(); if (ac.state === 'suspended') ac.resume();
    const out = ac.createGain(); out.gain.value = 0.16; out.connect(ac.destination);
    const notes = [[0, 1046.5], [0.14, 1318.5], [0.28, 1568], [0.42, 2093], [0.7, 1568], [0.84, 2093]], t0 = ac.currentTime + 0.03;
    for (const [dt, f] of notes) for (const [type, mul, vol] of [['triangle', 1, 0.9], ['sine', 2, 0.25]]) {
      const o = ac.createOscillator(), g = ac.createGain(), t = t0 + dt; o.type = type; o.frequency.value = f * mul;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + (dt > 0.6 ? 0.9 : 0.45));
      o.connect(g).connect(out); o.start(t); o.stop(t + 1);
    }
    if (typeof trMusic !== 'undefined') { trMusic.setDuck(0.25); setTimeout(() => trMusic.setDuck(1), 1500); }
  } catch {}
}
function trBlip(i) {
  try { const ac = window.audioCtx ||= new (window.AudioContext || window.webkitAudioContext)(), o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.type = 'square'; o.frequency.setValueAtTime(660 + i * 70, t); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.1); } catch {}
}
function trNurse(n) {
  const s = trS(), np = tr.np, key = `${s.map}:${n.id}`;
  trSay(['Nurse Pell: Welcome to the Clinic! 🌸'], () => trMenu('Shall I rest your Wordlings?', [
    { label: '💚 Yes, please', fn: () => {
      const count = s.team.length;
      np[key] = { x: n.x, y: n.y, dir: 'right' };                       // she turns to the machine
      tr.ui = { type: 'wait' }; trBox(); tr.machine = { map: s.map, count: 0, glow: 0 };
      trSay(['Nurse Pell: Let me take your Wordlings for a moment…'], () => {
        tr.ui = { type: 'wait' }; trBox();
        for (let i = 0; i < count; i++) setTimeout(() => { if (!tr?.machine) return; tr.machine.count = i + 1; trBlip(i); }, 380 * (i + 1));
        setTimeout(() => { if (!tr?.machine) return; tr.machine.glow = tr.frame; trChime(); }, 380 * (count + 1));
        setTimeout(() => {
          if (!tr) return;
          s.team.forEach(m => { m.hp = trMaxHp(m); }); s.respawn = { map: s.map, x: 5, y: 3 }; trSaveNow(true);
          tr.machine = null; np[key] = { x: n.x, y: n.y, dir: 'down' }; tr.ui = null;
          trSay(['Nurse Pell: All done! Your Wordlings are fully rested. ✨', 'Nurse Pell: Come back any time. We’ll be here!']);
        }, 380 * (count + 1) + 1700);
      });
    } },
    { label: 'No, thank you', fn: () => trSay('Nurse Pell: Take care out there!') }]));
}
/* the Clinic healing stove: six burners on top, an oven below. Each Wordling sits on its own burner. */
function trDrawStove(g, x, y, run) {
  const full = trIsFull(), C = full ? { body: '#d8e2ea', edge: '#1a2028', mid: '#8a98a6', top: '#2a3038', burner: '#55606c', hot: '#ff7a3a', hot2: '#ffd060', glass: '#3a2a20', warm: '#ffb060', knob: '#e0608a' }
    : { body: TR_PAL[0], edge: TR_PAL[3], mid: TR_PAL[1], top: TR_PAL[3], burner: TR_PAL[2], hot: TR_PAL[1], hot2: TR_PAL[0], glass: TR_PAL[3], warm: TR_PAL[1], knob: TR_PAL[2] };
  const R = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, h); }, O = (cx, cy, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(x + cx, y + cy, r, 0, 7); g.fill(); };
  const team = trS()?.team || [], placed = run ? run.count : 0, glow = run?.glow ? ((tr.frame - run.glow) % 16 < 8) : false;
  R(0, 0, 32, 32, C.edge); R(1, 1, 30, 30, C.body);
  R(1, 1, 30, 15, C.top);                                                   // the cooktop
  for (let i = 0; i < 6; i++) {
    const cx = 6 + (i % 3) * 10, cy = 5 + Math.floor(i / 3) * 7, on = i < placed;
    O(cx, cy, 3.6, on ? C.hot : C.burner); O(cx, cy, 2.2, on ? C.hot2 : C.top); O(cx, cy, 1, on ? C.hot : C.burner);
    if (on && team[i]) { try { g.drawImage(trMonArt(team[i].sp), x + cx - 5, y + cy - 6, 10, 10); } catch {} }
  }
  R(1, 16, 30, 3, C.mid); for (let i = 0; i < 4; i++) O(6 + i * 7, 17.5, 1.2, C.knob);   // knobs
  R(3, 20, 26, 10, C.edge); R(4, 21, 24, 8, C.mid); R(7, 23, 18, 5, C.glass);              // oven door and window
  if (placed || glow) R(8, 24, 16, 3, C.warm);
  R(6, 21, 20, 1, C.edge);                                                                 // handle
  if (glow) { g.globalAlpha = 0.35; g.fillStyle = full ? '#fff3a0' : TR_PAL[0]; g.fillRect(x, y, 32, 32); g.globalAlpha = 1; }
}
function trHeal(msg) {
  const s = trS(); s.team.forEach(m => { m.hp = trMaxHp(m); });
  s.respawn = { map: s.map, x: s.x, y: s.y }; trSaveNow(true);
  trJingle('heal'); trSay([msg, 'Your team is fully healed! ✨']);
}
/* ---------- USB drives: teach a move; if all 4 slots are full, one move has to be deleted ---------- */
function trDriveMenu(k) {
  const s = trS(), mv = TR_ITEMS[k].drive;
  trMenu(`💾 Plug in <b>${TR_MOVES[mv].name}</b> for which Wordling?`, s.team.map(m => ({ label: trMonLine(m), sub: trMoves(m).includes(mv) ? 'Already knows it.' : trMoves(m).map(x => TR_MOVES[x].name).join(' · '),
    disabled: trMoves(m).includes(mv), fn: () => trTeachMove(m, mv, () => trDriveMenu(k)) })), () => trBagMenu(false));
}
function trTeachMove(m, mv, back) {
  const nm = esc(TR_SPECIES[m.sp].name), cur = trMoves(m), done = list => { m.moves = list; trSaveNow(true); trBlip(4); };
  if (cur.length < TR_MOVE_SLOTS) { done([...cur, mv]); return trSay([`💾 Beep-boop… the drive uploads!`, `${nm} learned <b>${TR_MOVES[mv].name}</b>!`], back); }
  trMenu(`${nm} already knows 4 moves. Delete one to make room for <b>${TR_MOVES[mv].name}</b>?`, [
    ...cur.map(x => {
      const left = cur.filter(y => y !== x).concat(mv), noHit = !left.some(trHits);
      return { label: `🗑️ Delete ${TR_MOVES[x].name}`, sub: noHit ? 'It needs at least one move that hits!' : TR_MOVES[x].desc, disabled: noHit,
        fn: () => { done(cur.map(y => y === x ? mv : y)); trSay([`1, 2, and… poof! ${nm} forgot <b>${TR_MOVES[x].name}</b>.`, `💾 Beep-boop… the drive uploads!`, `${nm} learned <b>${TR_MOVES[mv].name}</b>!`], back); } };
    }),
    { label: 'Keep its moves', fn: () => back() }], () => back());
}
/* team menu: swap any slot for a move it learned by levelling up or a drive you own */
function trLearnPending(done) {
  const s = trS(), m = [...s.team, ...s.box].find(x => x.learnQ?.length);
  if (!m) return done?.();
  const k = m.learnQ.shift(); if (!m.learnQ.length) delete m.learnQ;
  const nm = esc(TR_SPECIES[m.sp].name), mv = TR_MOVES[k], cur = trMoves(m), next = () => trLearnPending(done);
  if (cur.includes(k)) return next();
  if (cur.length < TR_MOVE_SLOTS) { m.moves = [...cur, k]; trSaveNow(true); return trSay(`✨ ${nm} learned <b>${mv.name}</b>!`, next); }
  trMenu(`🌱 ${trMonImg(m.sp, 28, true)} ${nm} wants to learn <b>${mv.name}</b>${mv.power ? ` <small>power ${mv.power}${mv.hits ? ' ×' + mv.hits : ''}</small>` : ''}.<br><small>${esc(mv.desc)}</small><br>But it already knows 4 moves. Delete one?`, [
    ...cur.map(x => ({ label: `🗑️ Delete ${TR_MOVES[x].name}${TR_MOVES[x].power ? ` <small>power ${TR_MOVES[x].power}</small>` : ''}`, sub: TR_MOVES[x].desc,
      fn: () => { m.moves = cur.map(y => y === x ? k : y); trSaveNow(true); trBlip(4); trSay([`1, 2, and… poof! ${nm} forgot <b>${TR_MOVES[x].name}</b>.`, `✨ And… ${nm} learned <b>${mv.name}</b>!`], next); } })),
    { label: `🚫 Don’t learn ${mv.name}`, sub: 'You can still teach it later from “Change moves” in your team menu.', fn: () => { trSaveNow(true); trSay(`${nm} did not learn ${mv.name}.`, next); } }], null);
}
function trMoveChoices(m, back) {
  const s = trS(), cur = trMoves(m), nm = esc(TR_SPECIES[m.sp].name);
  const drives = Object.entries(TR_ITEMS).filter(([k, it]) => it.drive && s.bag[k]).map(([, it]) => it.drive);
  const options = [...new Set([...trLearned(m.sp, m.lv), ...drives])].filter(k => !cur.includes(k));
  trMenu(`${nm}’s moves (${cur.length}/${TR_MOVE_SLOTS}): ${cur.map(k => TR_MOVES[k].name).join(' · ')}<br><small>Pick a move to teach it.</small>`, [
    ...options.map(k => ({ label: `${drives.includes(k) ? '💾' : TR_MOVES[k].sig ? '⭐' : '🌱'} ${TR_MOVES[k].name}${TR_MOVES[k].power ? ` <small>power ${TR_MOVES[k].power}</small>` : ''}`, sub: (drives.includes(k) ? 'From your USB drive. ' : 'Learned by levelling up. ') + TR_MOVES[k].desc,
      fn: () => trTeachMove(m, k, () => trMoveChoices(m, back)) })),
    ...(options.length ? [] : [{ label: 'No other moves to teach yet. Buy USB drives in shops!', disabled: true, fn: () => {} }]),
    { label: 'Done', fn: () => back() }], () => back());
}
function trUseRepel(k) {
  const s = trS(), it = TR_ITEMS[k]; s.bag[k]--; s.repel = Math.max(s.repel || 0, it.repel); trSaveNow(true); trJingle('heal');
  trSay([`You hold up the ${it.name} ${it.icon}. It glows with a soft green light…`, `Wild Wordlings will stay away for <b>${s.repel} steps</b>.`]);
}
function trShop() {
  const s = trS(), stock = TR_MAPS[s.map].shop || ['potion', 'charm'];
  trMenu(`Shop · you have 🪙 ${s.coins}`, [...stock.map(k => { const it = TR_ITEMS[k]; return {
    label: `${it.icon} ${it.name} · 🪙 ${it.price}`, sub: it.drive ? (s.bag[k] ? '✅ You own this drive. It stays in your bag forever.' : it.desc) : `${it.desc} You have ${s.bag[k] || 0}.`, disabled: s.coins < it.price || (it.drive && s.bag[k]),
    fn: () => { s.coins -= it.price; s.bag[k] = it.drive ? 1 : (s.bag[k] || 0) + 1; trSaveNow(true); trSay(it.drive ? [`You bought the ${it.name}! 💾`, 'Open your bag and plug it in to teach a Wordling the move.'] : `You bought a ${it.name}! ${it.icon}`, trShop); } }; }),
    { label: 'Leave', fn: () => trSay('Come again!') }], () => {});
}
function trToggleScooter() {
  const s = trS(); if (!s.key.scooter || tr.bt || tr.ui) return;
  if (TR_MAPS[s.map].indoor) return trSay('No scooters indoors! 🛴');
  s.riding = !s.riding; trHud(); toast(s.riding ? 'Riding the scooter 🛴' : 'Walking');
}

/* ---------- Menu ---------- */
function trMainMenu() {
  const s = trS();
  trMenu(`📍 <b>${esc(TR_MAPS[s.map].name)}</b>${s.riding ? ' · 🛴' : ''}<br><small>${esc(s.name)} · 🪙 ${s.coins} coins · 🏅 ${trSeals(s)}/${TR_BADGE_COUNT} <span class="tr-badges">${trBadgeRow(s, 14)}</span></small>`, [
    { label: '🐾 Team', fn: () => trTeamMenu() },
    { label: '🎒 Bag', fn: () => trBagMenu(false) },
    { label: '📖 Spirit Log', sub: s.key.log ? `${Object.keys(s.caught).length} caught · ${Object.keys(s.seen).length} seen of ${TR_DEX.length}` : 'Professor Rowan will give you one.', disabled: !s.key.log, fn: () => trLog() },
    { label: '🏅 Badge case', sub: `${trSeals(s)} of ${TR_BADGE_COUNT} won`, fn: () => trSealsMenu() },
    { label: '📂 Load game', sub: 'Switch to another save slot.', fn: () => trLoadMenu() },
    { label: `🌐 Game language: ${gtLangLabel(tr.d?.frontLang)}`, sub: 'Play in the language you are learning.', fn: () => trLangMenu() },
    { label: '💾 Save game', sub: s.savedAt ? `Last saved ${new Date(s.savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : '', fn: () => trSaveNow() },
    { label: '🗣️ Voices', sub: 'Pick the voice for each language and how fast it talks.', fn: () => trVoiceMenu() },
    { label: '🗺️ Map', sub: 'See the whole route, or a close-up of this area.', fn: () => trMapOpen('world') },
    { label: `🖍️ Screen colors ${trSwatch(trPalette()[3] || trPalette()[2])}`, sub: `${trPalette()[1]} · classic green or color palettes.`, fn: () => trPaletteMenu(() => trMainMenu()) },
    { label: '🎨 Console color', sub: 'Pick the color of the handheld.', fn: () => trShellMenu((t, it, bk, sel) => { trMenu(t, it, bk); if (sel >= 0) { tr.ui.sel = sel; trBox(); } }, () => trMainMenu()) },
    { label: '🆘 I’m stuck', sub: 'Inside: go back out the door. Outside: move to the nearest open spot.', fn: () => trUnstick(true) },
    { label: `⏱️ Answer timer: ${trTimeLimit() ? trTimeLimit() + 's' : 'off'}`, sub: 'How long you have to answer in battles.', fn: () => trTimerMenu() },
    { label: '⌨️ Controls', fn: () => trControlsMenu() },
    { label: '🚪 Save and leave', fn: () => trQuit() },
  ], () => {});
}
function trSealsMenu() {
  const s = trS(), names = ['Lexicon Badge (Iris)', 'Harbor Badge (Captain Remy)', 'Ember Badge (Marisol)', 'Summit Badge (Archivist Oduya)'];
  const GOALS = ['Beat Hall Leader Iris in Lexicon Town.', 'Cross Rune Bridge and challenge Captain Remy in Saltwick Harbor.', 'Take the ferry to Ember Ridge, get through Ember Cave and reach Cinderglen.',
    'Climb the Highland Trail, pass the Silent Library and reach Summit City.', 'Take the north road out of Summit City over Frostwind Pass to Glimmerfrost.', 'Cross Mirewood Marsh to Fablemere.',
    'Cross the Echo Dunes to Sandscript.', 'Climb Stormcrown Steps to Starhaven.'];
  const n = trSeals(s), goal = n < TR_BADGE_COUNT ? GOALS[n] : !s.beaten.vex ? 'Fly back to Summit City, enter the Grand Archive and stop Director Vex!' : !s.beaten.champion ? 'Go through Starhaven’s north gate to the Ultimate Stadium. Beat the Elite Four, then Champion Rio!' : !s.beaten.profFinal ? 'Professor Rowan is waiting for you outside the Ultimate Stadium.' : 'You’re the Champion! Keep catching every Wordling.';
  trMenu(`🏅 Badge case · ${trSeals(s)}/${TR_BADGE_COUNT}<br><small>Next: ${goal}</small>`, [...TR_BADGES.map((bd, i) => ({ label: `${trBadgeImg(i + 1, 30, !s.seals[i + 1])} <b>${s.seals[i + 1] ? bd.name : '???'}</b>`,
      sub: s.seals[i + 1] ? `${bd.desc} Won from ${bd.leader} in ${bd.town}${s.seals[i + 1] > 1 ? ` on ${new Date(s.seals[i + 1]).toLocaleDateString([], { dateStyle: 'medium' })}` : ''}.` : `Beat ${bd.leader} in ${bd.town}.`, fn: () => s.seals[i + 1] ? trShowBadge(i + 1, trSealsMenu) : trSealsMenu() })),
    { label: `${s.beaten.quell ? '✅' : '⬜'} Lt. Quell · ${s.beaten.sable ? '✅' : '⬜'} Lt. Sable · ${s.beaten.murmur ? '✅' : '⬜'} Lt. Murmur · ${s.beaten.clamor ? '✅' : '⬜'} Lt. Clamor`, disabled: true, fn: () => {} },
    { label: `${s.beaten.vex ? '🌟 Director Vex defeated!' : '⬜ Director Vex'}`, disabled: true, fn: () => {} },
    ...(s.beaten.vex ? [{ label: `Elite Four: ${[1, 2, 3, 4].map(k => s.beaten['elite' + k] ? '✅' : '⬜').join(' ')} · ${s.beaten.champion ? '🏆 Champion Rio beaten!' : '⬜ Champion Rio'}`, disabled: true, fn: () => {} },
      { label: `${s.beaten.profFinal ? '🎓 Professor Rowan beaten!' : '⬜ Professor Rowan’s final challenge (outside the Ultimate Stadium)'}`, disabled: true, fn: () => {} }] : []),
    ...(s.flags.postgame ? [{ label: `🔁 Rematches won: ${Object.keys(s.rematch || {}).filter(k => k !== 're:rio').length} of ${trRematchTotal()}`, sub: 'Talk to any trainer or Hall Leader you’ve beaten.', disabled: true, fn: () => {} }] : [])], () => trMainMenu());
}
const trMonLine = m => `${trMonImg(m.sp, 28, true)} <b>${esc(TR_SPECIES[m.sp].name)}</b> Lv ${m.lv} · ${TR_TYPES[TR_SPECIES[m.sp].type].icon} · HP ${m.hp}/${trMaxHp(m)}`;
function trTeamMenu() {
  const s = trS();
  trMenu(`Your team (${s.team.length}/${TR_TEAM_MAX}). The first one battles first.`, s.team.map((m, i) => ({ label: trMonLine(m), sub: `XP ${m.xp}/${trNeed(m.lv)} · ${trMoves(m).map(k => TR_MOVES[k].name).join(', ')}`,
    fn: () => trMenu(`${esc(TR_SPECIES[m.sp].name)}: ${esc(TR_SPECIES[m.sp].blurb)}`, [
      { label: '⬆️ Make it lead', disabled: i === 0, fn: () => { s.team.splice(i, 1); s.team.unshift(m); trSaveNow(true); trTeamMenu(); } },
      { label: '🎛️ Change moves', sub: trMoves(m).map(k => TR_MOVES[k].name).join(' · '), fn: () => trMoveChoices(m, () => trTeamMenu()) },
      { label: '🖥️ Storage is on the computer in any Clinic', disabled: true, fn: () => {} },
    ], () => trTeamMenu()) })), () => trMainMenu());
}
function trPC() {
  const s = trS();
  trSay('🖥️ You switch on the Wordling storage computer. Beep boop!', () => trPCMenu());
}
function trPCMenu() {
  const s = trS();
  trMenu(`🖥️ Wordling storage · team ${s.team.length}/${TR_TEAM_MAX} · stored ${s.box.length}`, [
    { label: '📥 Store a Wordling', sub: 'Send one from your team to storage.', disabled: s.team.length < 2, fn: () => trPCDeposit() },
    { label: '📤 Take a Wordling out', sub: s.box.length ? 'Bring one from storage onto your team.' : 'Storage is empty.', disabled: !s.box.length, fn: () => trPCWithdraw() },
    { label: '🔌 Log off', fn: () => trSay('The computer hums off. Your Wordlings are safe, and every Clinic computer can reach them.') }], () => {});
}
function trPCDeposit() {
  const s = trS();
  trMenu('📥 Which Wordling should go into storage?', s.team.map((m, i) => ({ label: trMonLine(m), disabled: s.team.length < 2, fn: () => { s.team.splice(i, 1); m.hp = trMaxHp(m); s.box.push(m); trSaveNow(true); trSay(`${esc(TR_SPECIES[m.sp].name)} was sent to storage. 📦 It will rest there.`, trPCMenu); } })), () => trPCMenu());
}
function trPCWithdraw(page = 0) {
  const s = trS(), full = s.team.length >= TR_TEAM_MAX, per = 12, list = s.box.slice(page * per, page * per + per);
  trMenu(`📤 Storage (${s.box.length}) · page ${page + 1}/${Math.max(1, Math.ceil(s.box.length / per))}${full ? ' · your team is full' : ''}`, [
    ...(page > 0 ? [{ label: '◀ Previous page', fn: () => trPCWithdraw(page - 1) }] : []),
    ...list.map((m, j) => ({ label: trMonLine(m), disabled: full, sub: full ? `Your team is full (${TR_TEAM_MAX}). Store one first.` : 'Add to your team', fn: () => { s.box.splice(page * per + j, 1); s.team.push(m); trSaveNow(true); trSay(`${esc(TR_SPECIES[m.sp].name)} joined your team!`, () => trPCWithdraw(Math.min(page, Math.max(0, Math.ceil(s.box.length / per) - 1)))); } })),
    ...((page + 1) * per < s.box.length ? [{ label: 'Next page ▶', fn: () => trPCWithdraw(page + 1) }] : []),
  ], () => trPCMenu());
}
function trBoxMenu() {
  const s = trS(), full = s.team.length >= TR_TEAM_MAX;
  trMenu('Storage box', s.box.map((m, i) => ({ label: trMonLine(m), disabled: full, sub: full ? `Your team is full (${TR_TEAM_MAX}). Send one to the box first.` : 'Add to team',
    fn: () => { s.box.splice(i, 1); s.team.push(m); trSaveNow(true); trSay(`${esc(TR_SPECIES[m.sp].name)} joined your team!`, trBoxMenu); } })), () => trMainMenu());
}
function trLog(page = 0) {
  const s = trS(), per = 15, pages = Math.ceil(TR_DEX.length / per), ids = TR_DEX.slice(page * per, page * per + per);
  const evoText = k => { const e = TR_SPECIES[k].evo, f = TR_SPECIES[k].from; return [f && s.seen[f] ? `Grows from ${TR_SPECIES[f].name}.` : '', e ? `Evolves at level ${e[1]}${s.seen[e[0]] ? ` into ${TR_SPECIES[e[0]].name}` : ''}.` : ''].filter(Boolean).join(' '); };
  const where = k => { const out = []; for (const m of Object.values(TR_MAPS)) { if ((m.wild || []).some(w => w[0] === k)) out.push(m.name); if ((m.water || []).some(w => w[0] === k)) out.push(m.name + ' (fishing)'); } return out.length ? 'Found in: ' + [...new Set(out)].join(', ') + '.' : ''; };
  trMenu(`📖 Spirit Log · ${Object.keys(s.caught).length} caught · ${Object.keys(s.seen).length} seen of ${TR_DEX.length} · page ${page + 1}/${pages}`, [
    ...(page > 0 ? [{ label: '◀ Previous page', fn: () => trLog(page - 1) }] : []),
    ...ids.map(k => { const sp = TR_SPECIES[k], no = '#' + trDexNo(k); return {
      label: s.seen[k] ? `${trMonImg(k, 28, true)} <b>${no} ${esc(sp.name)}</b> ${TR_TYPES[sp.type].icon} ${TR_TYPES[sp.type].name}${s.caught[k] ? ' · 🍃' : ''}` : `❔ ${no} ???`,
      sub: s.seen[k] ? `${sp.legend ? '✨ Legendary. ' : ''}${sp.blurb} ${sp.ability ? `Ability: ${TR_ABILITIES[sp.ability].name}, ${TR_ABILITIES[sp.ability].desc} ` : ''}${evoText(k)} ${s.caught[k] ? where(k) : ''}` : 'Not met yet.', fn: () => trLog(page) }; }),
    ...(page < pages - 1 ? [{ label: 'Next page ▶', fn: () => trLog(page + 1) }] : []),
  ], () => trMainMenu());
}
function trBagMenu(inBattle) {
  const s = trS(), items = [];
  for (const k of ['potion', 'tonic', 'grandtonic', 'elixir', 'picnic', 'sprout', 'revive', 'bloom', 'rareink']) if (s.bag[k]) items.push({ label: `${TR_ITEMS[k].icon} ${TR_ITEMS[k].name} ×${s.bag[k]}`, sub: TR_ITEMS[k].desc, disabled: inBattle && k === 'rareink', fn: () => TR_ITEMS[k].teamHeal ? trUseTeam(k, inBattle) : trPickTarget(k, inBattle) });
  for (const [k, it] of Object.entries(TR_ITEMS)) if (it.drive && s.bag[k]) items.push({ label: `💾 ${TR_MOVES[it.drive].name} <small>USB drive</small>`, sub: inBattle ? 'Plug drives in outside of battle.' : TR_MOVES[it.drive].desc,
    disabled: inBattle, fn: () => trDriveMenu(k) });
  for (const k of ['wordcharm', 'bigcharm']) if (s.bag[k]) items.push({ label: `${TR_ITEMS[k].icon} ${TR_ITEMS[k].name} ×${s.bag[k]}`, sub: inBattle ? 'Use it outside of battle.' : `${TR_ITEMS[k].desc}${s.repel > 0 ? ` (Your charm has ${s.repel} steps left.)` : ''}`,
    disabled: inBattle, fn: () => trUseRepel(k) });
  for (const k of ['charm', 'goldcharm']) if (s.bag[k]) items.push({ label: `${TR_ITEMS[k].icon} ${TR_ITEMS[k].name} ×${s.bag[k]}`, sub: inBattle ? (tr.bt?.wild ? 'Try to catch it!' : 'You can’t catch another trainer’s Wordling.') : 'Use it in a wild battle.',
    disabled: !inBattle || !tr.bt?.wild, fn: () => trThrowCharm(k) });
  if (!inBattle) for (const [k, it] of Object.entries(TR_KEY_ITEMS)) if (s.key[k]) items.push({ label: `${it.icon} ${it.name}`, sub: it.desc, disabled: k === 'pass', fn: () => k === 'scooter' ? (tr.ui = null, trToggleScooter()) : trFlyMenu() });
  if (!items.length) items.push({ label: 'Your bag is empty. Visit a shop 🪙', disabled: true, fn: () => {} });
  trMenu('Bag', items, inBattle ? () => trBattleMenu() : () => trMainMenu());
}
function trFlyMenu() {
  const s = trS();
  if (TR_MAPS[s.map].indoor) return trSay('Your paper crane can’t fly indoors! Step outside first.');
  trMenu('🕊️ Where should the paper crane fly?', Object.entries(TR_MAPS).filter(([id, m]) => m.fly && s.visited[id]).map(([id, m]) => ({
    label: `🏘️ ${esc(m.name)}`, disabled: id === s.map, fn: () => trSay(['You blow the whistle… a giant paper crane swoops down! 🕊️', `…and gently lands in ${esc(m.name)}.`], () => trWarp(id, m.fly.x, m.fly.y, 'down')) })), () => trBagMenu(false));
}
function trPickTarget(k, inBattle) {
  const s = trS(), it = TR_ITEMS[k];
  trMenu(`Use ${it.name} on…`, s.team.map(m => ({ label: trMonLine(m),
    disabled: it.revive ? m.hp > 0 : k === 'rareink' ? m.lv >= 100 : (m.hp <= 0 || m.hp >= trMaxHp(m)),
    fn: () => {
      s.bag[k]--; const nm = esc(TR_SPECIES[m.sp].name); let msg;
      if (it.revive) { m.hp = Math.max(1, Math.ceil(trMaxHp(m) * it.revive)); msg = [`${nm} woke up with ${Math.round(it.revive * 100)}% of its HP! ${it.icon}`]; }
      else if (k === 'rareink') { const lines = []; trGainXp(m, trNeed(m.lv) - m.xp, lines); msg = [`You dab rare ink on ${nm}… 🖋️`, ...lines.slice(1)]; if (m.learnQ?.length) { trSaveNow(true); return trSay(msg, () => trLearnPending(() => trBagMenu(false))); } }
      else { const before = m.hp; m.hp = Math.min(trMaxHp(m), m.hp + Math.max(1, Math.ceil(trMaxHp(m) * it.heal))); msg = [`${nm} got ${m.hp - before} HP back! ${it.icon}`]; }
      trSaveNow(true); trSay(msg, inBattle ? () => trFoeTurn() : () => trBagMenu(false));
    } })), () => trBagMenu(inBattle));
}
/* items that help the whole team at once (Picnic basket) */
function trUseTeam(k, inBattle) {
  const s = trS(), it = TR_ITEMS[k], hurt = s.team.filter(m => m.hp > 0 && m.hp < trMaxHp(m));
  if (!hurt.length) return trSay('Everyone awake is already at full HP!', () => trBagMenu(inBattle));
  s.bag[k]--;
  const msg = [`You open the ${it.name}… ${it.icon}`];
  for (const m of hurt) { const before = m.hp; m.hp = Math.min(trMaxHp(m), m.hp + Math.max(1, Math.ceil(trMaxHp(m) * it.teamHeal))); msg.push(`${esc(TR_SPECIES[m.sp].name)} got ${m.hp - before} HP back!`); }
  trSaveNow(true); trSay(msg, inBattle ? () => trFoeTurn() : () => trBagMenu(false));
}
function trControlsMenu() {
  const ks = trKeys(), pad = S.settings?.trPad || 'auto';
  trMenu('Controls. Pick an action, then press the new key.', [
    ...TR_ACTIONS.map(([act, label]) => ({ label: `${label}`, sub: ks[act].map(trKeyName).join(' · '), fn: () => { tr.ui = { type: 'rebind', act, label }; trBox(); } })),
    { label: `📱 Touch buttons: ${{ auto: 'Automatic', on: 'Always show', off: 'Hide' }[pad]}`, sub: 'The D-pad, A/B, Menu and Scooter buttons on the console. Hide them to make the screen bigger.', fn: () => { S.settings.trPad = { auto: 'on', on: 'off', off: 'auto' }[pad]; save(); trApplyPad(); trControlsMenu(); } },
    { label: `🎨 Console color: ${TR_SHELLS.find(([k]) => k === trShell())[1]}`, sub: 'Pick the color of the handheld.', fn: () => trShellMenu((t, it, bk, sel) => { trMenu(t, it, bk); if (sel >= 0) { tr.ui.sel = sel; trBox(); } }, () => trControlsMenu()) },
    { label: `🎮 Game controller${[...(navigator.getGamepads?.() || [])].some(Boolean) ? ': connected ✅' : ''}`, sub: 'Plug in a USB or Bluetooth controller. D-pad or stick: move · bottom button: A · right button: B · Start: menu · left button: scooter. Answer cards with the D-pad and A.', fn: () => trSay(['🎮 Plug in a USB or Bluetooth game controller and press any button on it.', 'D-pad or left stick: move and pick in menus.', 'Bottom button: A · right button: B.', 'Start (or the top button): open the menu.', 'Left button or Select: scooter on and off.', 'On a question card, the D-pad moves the highlight and A picks the answer.'], trControlsMenu) },
    { label: '↩️ Reset to the normal keys', fn: () => { delete S.settings.trKeys; save(); trSay('Controls reset.', trControlsMenu); } },
  ], () => trMainMenu());
}
/* ---------- Voices (only change how the game sounds; the rest of the app keeps its own) ---------- */
const TR_RATES = [[0.6, 'Slow 🐢'], [0.8, 'A bit slow'], [0, 'Same as the app'], [1.1, 'A bit fast'], [1.3, 'Fast 🐇']];
function trVoiceLangs() { return [...new Set([tr.d?.frontLang, tr.d?.backLang].filter(Boolean))]; }
function trVoiceSample(lang) {
  const c = cardsOf(tr.deckId).find(x => x.front || x.back);
  const raw = c ? (lang === tr.d.frontLang ? c.front : c.back) : '';
  return String(raw || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || langName(lang);
}
function trVoiceName(lang) {
  const v = pickVoice(lang, ttsDeck()); return v ? v.name.replace(/^Microsoft\s+/, '').replace(/\s+Online.*$/, '').replace(/\s+-\s+.*$/, '') : 'No voice found';
}
function trVoiceMenu(sel = 0) {
  S.settings.trVoices ||= {};
  const rate = S.settings.trRate || 0, rateName = (TR_RATES.find(r => r[0] === rate) || TR_RATES[2])[1], aloud = S.settings.trAloud ?? autoplayOn();
  trMenu('🗣️ Voices for Wordling Trails', [
    ...trVoiceLangs().map(l => ({ label: `${esc(langName(l))}: <b>${esc(trVoiceName(l))}</b>`, sub: S.settings.trVoices[l] ? 'Picked for this game.' : 'Same voice as the rest of the app.', fn: () => trVoicePick(l) })),
    { label: `⏩ Speed: <b>${esc(rateName)}</b>`, sub: 'Press A to change it.', fn: () => { const i = TR_RATES.findIndex(r => r[0] === rate); S.settings.trRate = TR_RATES[(i + 1) % TR_RATES.length][0] || undefined; save(); const l = trVoiceLangs()[0]; if (l) speak(trVoiceSample(l), l); trVoiceMenu(trVoiceLangs().length); } },
    { label: `🔈 Read words out loud: <b>${aloud ? 'On' : 'Off'}</b>`, sub: 'Say each question word when it appears.', fn: () => { S.settings.trAloud = !aloud; save(); trVoiceMenu(trVoiceLangs().length + 1); } },
    ...(Object.keys(S.settings.trVoices).length || S.settings.trRate ? [{ label: '↩️ Use the app’s normal voices', fn: () => { delete S.settings.trVoices; delete S.settings.trRate; save(); trSay('The game now uses the same voices as the rest of the app.', trVoiceMenu); } }] : []),
  ], () => trMainMenu());
  if (sel) { tr.ui.sel = Math.min(sel, tr.ui.items.length - 1); trBox(); }
}
function trVoicePick(lang, sel = 0) {
  const list = voicesFor(lang), cur = S.settings.trVoices?.[lang];
  if (!list.length) return trSay([`There’s no ${esc(langName(lang))} voice on this device.`, 'On a PC: Windows Settings → Time & language → Speech → Add voices. On an iPhone: Settings → Accessibility → Spoken Content → Voices.'], trVoiceMenu);
  const pick = (uri, i) => { S.settings.trVoices ||= {}; if (uri) S.settings.trVoices[lang] = uri; else delete S.settings.trVoices[lang]; save(); speak(trVoiceSample(lang), lang); trVoicePick(lang, i); };
  trMenu(`🗣️ ${esc(langName(lang))} voice · press A to hear it`, [
    { label: `${cur ? '' : '✅ '}Same as the rest of the app`, fn: () => pick(null, 0) },
    ...list.map((v, i) => ({ label: `${v.voiceURI === cur ? '✅ ' : ''}${esc(v.name.replace(/^Microsoft\s+/, '').replace(/\s+Online.*$/, '').replace(/\s+-\s+.*$/, '').replace(/\s*\(.*\)$/, ''))}`, sub: `${esc(langName(v.lang))}${v.localService ? '' : ' · needs internet'}`, fn: () => pick(v.voiceURI, i + 1) })),
  ], () => trVoiceMenu());
  tr.ui.list = true; tr.ui.sel = Math.min(sel, tr.ui.items.length - 1); trBox();
}
/* ---------- 🖍️ Screen colors: the classic green screen, or a color-handheld palette (4 shades, light to dark) ---------- */
const TR_PALETTES = [
  ['dmg', 'Classic green', ['#e0ecc0', '#a8c66c', '#5a8a4a', '#1f3a2b']],
  ['full', '🌈 Full color', ['#f8f8f0', '#bfe0a8', '#4a7ab0', '#1a2040'], ['#79c45a', '#f08070', '#5aa8f0', '#f4c542']],
  ['pocket', 'Pocket gray', ['#e9e9e2', '#aeaea4', '#62625c', '#202020']],
  ['sepia', 'Old photo', ['#f6e7c8', '#cda66f', '#8a5a2b', '#33200f']],
  ['ocean', 'Ocean', ['#e3f2fd', '#8ec3f0', '#3a6fb0', '#11264f']],
  ['cherry', 'Cherry', ['#ffe6e6', '#f29191', '#b3364b', '#3a0d18']],
  ['grape', 'Grape', ['#f1e6ff', '#bb9be8', '#6c47a8', '#241341']],
  ['mint', 'Mint', ['#e6fff4', '#8fe3c1', '#2f9e7a', '#0d3328']],
  ['sunset', 'Sunset', ['#fff3c4', '#f7a24f', '#b2463b', '#2a183a']],
  ['candy', 'Candy', ['#fff8ec', '#ffb3a7', '#7fb2d8', '#3b3a6d']],
  ['forest', 'Forest', ['#f0f5d8', '#c3a663', '#4f7a3a', '#1c2614']],
  ['negative', 'Night', ['#14202a', '#3c5a6c', '#8bb3bf', '#e8f4f4']],
];
const trPalette = () => (TR_PALETTES.find(p => p[0] === S.settings?.trPalette) || TR_PALETTES[0]);
function trApplyPalette() {
  const c = trPalette()[2];
  const sig = trPalette()[0] + c.join();
  if (trApplyPalette.sig !== sig) { trApplyPalette.sig = sig; c.forEach((v, i) => { TR_PAL[i] = v; }); for (const k of Object.keys(trCache)) delete trCache[k]; }
  document.querySelectorAll('.tr-wrap, .game-map-pop.tr, .tr-slots').forEach(el => c.forEach((v, i) => el.style.setProperty('--g' + i, v)));
}
const trSwatch = c => `<span class="tr-swatch">${c.map(v => `<i style="background:${v}"></i>`).join('')}</span>`;
function trPaletteMenu(back) {
  const cur = trPalette()[0];
  trMenu('🖍️ Screen colors · the whole game changes color', TR_PALETTES.map(([k, label, c, sw]) => ({ label: `${k === cur ? '✅ ' : ''}${trSwatch(sw || c)} ${label}`, fn: () => { S.settings.trPalette = k; save(); trApplyPalette(); trPaletteMenu(back); } })), back);
  tr.ui.sel = Math.max(0, TR_PALETTES.findIndex(p => p[0] === cur)); tr.ui.list = true; trBox();
}
/* ---------- 🗺️ Map: the whole route, or a close-up of this area ---------- */
/* shared by Lexicon Saga: draws a tile map onto a canvas. color(ch) -> css color or null */
function trMiniMap(cv, rows, color, { pad = 6, maxW = cv.width, maxH = cv.height, x0 = 0, y0 = 0 } = {}) {
  const g = cv.getContext('2d'), H = rows.length, W = rows[0].length, t = Math.max(2, Math.floor(Math.min((maxW - pad * 2) / W, (maxH - pad * 2) / H)));
  const ox = x0 + Math.floor((maxW - W * t) / 2), oy = y0 + Math.floor((maxH - H * t) / 2);
  rows.forEach((r, y) => [...r].forEach((c, x) => { const col = color(c); if (col) { g.fillStyle = col; g.fillRect(ox + x * t, oy + y * t, t, t); } }));
  return { t, ox, oy, at: (x, y) => [ox + x * t, oy + y * t] };
}
const trMapRoute = () => {   // the main road from Inkwell Town to the last town, following exits and the ferry
  const out = [], seen = new Set(); let id = 'town';
  while (id && TR_MAPS[id] && !seen.has(id)) { seen.add(id); out.push(id); const m = TR_MAPS[id]; id = m.exits?.top || m.npcs.find(n => n.ferry && n.ferry.open)?.ferry.to || null; }
  return out;
};
const trMapHere = () => { const s = trS(), m = TR_MAPS[s.map]; return m.indoor && m.back ? m.back.map : s.map; };
function gameMapPop(html, theme) {   // the map opens in a big window over the console
  let p = $('#gameMapPop'); if (!p) { p = document.createElement('div'); p.id = 'gameMapPop'; p.setAttribute('role', 'dialog'); document.body.appendChild(p); }
  p.className = 'game-map-pop ' + theme; p.innerHTML = html;
  if (theme === 'tr') TR_PAL.forEach((v, i) => p.style.setProperty('--g' + i, v));
}
const gameMapClose = () => $('#gameMapPop')?.remove();
function trMapOpen(view = 'world') { tr.ui = { type: 'map', view }; trBox(); }
function trMapHtml(u) {
  const tab = (v, label) => `<button type="button" class="map-tab ${u.view === v ? 'on' : ''}" data-act="trMapView" data-v="${v}">${label}</button>`;
  return `<div class="map-head"><span>🗺️ <b>Map</b></span><span class="map-tabs">${tab('world', '🌍 World')}${tab('area', '📍 This area')}<button type="button" class="map-x" data-act="trB" aria-label="Close map">✕</button></span></div>
    <canvas id="mapCv" class="map-cv" width="760" height="540"></canvas>
    <div class="map-foot">${u.view === 'world' ? '✨ You are here · ❔ not visited yet · 🏅 Badge won' : '✨ You · 🎁 item · 🚪 door'} · ◀ ▶ switch · B back</div>`;
}
const trMix = (a, b, t) => '#' + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
const TR_MAP_REP = { q: 1, r: 2, f: 1, h: 2, c: 2, m: 2, s: 2, b: 2, t: 2, p: 2, u: 2, w: 1, v: 2, '{': 2, '}': 2, '=': 1, '.': 1, ',': 2, '#': 2, P: 1, W: 1, '~': 2, F: 1, R: 2, B: 1, M: 2, G: 2, H: 0, D: 2, S: 2, L: 2, C: 3, ';': 1, ':': 2, o: 2, K: 2, X: 2 };
const TR_MAP_COL = (c, theme) => trIsFull() ? trTilePal(c, theme || TR_MAPS[trS()?.map]?.theme || 'out')[TR_MAP_REP[c] ?? 1] : 'v{}'.includes(c) ? TR_PAL[2] : '#,CKXTk'.includes(c) ? TR_PAL[3] : 'W~w'.includes(c) ? TR_PAL[2] : ',:'.includes(c) ? trMix(TR_PAL[1], TR_PAL[2], 0.35) : 'P;='.includes(c) ? trMix(TR_PAL[0], TR_PAL[1], c === '=' ? 0.2 : 0.4) : 'HRBMGL'.includes(c) ? TR_PAL[2] : c === 'D' ? TR_PAL[3] : TR_PAL[0];
function trMapDraw() {
  const cv = $('#mapCv'), u = tr?.ui; if (!cv || u?.type !== 'map') return;
  const g = cv.getContext('2d'), s = trS(), W = cv.width, H = cv.height, here = trMapHere(), blink = Math.floor(Date.now() / 400) % 2;
  g.fillStyle = TR_PAL[0]; g.fillRect(0, 0, W, H);
  if (u.view === 'area') {
    const m = TR_MAPS[s.map], mm = trMiniMap(cv, m.rows, TR_MAP_COL);
    for (const it of trItemsHere(s.map)) { const [x, y] = mm.at(it.x, it.y); g.font = `${Math.max(9, mm.t)}px sans-serif`; g.textBaseline = 'top'; g.fillText('🎁', x - 1, y - 1); }
    for (const k of Object.keys(m.doors || {})) { const [dx, dy] = k.split(',').map(Number), [x, y] = mm.at(dx, dy); g.fillStyle = '#f4c542'; g.fillRect(x + 1, y + 1, mm.t - 2, mm.t - 2); }
    const [px, py] = mm.at(s.x, s.y); g.fillStyle = blink ? '#c0392b' : '#ffffff'; g.beginPath(); g.arc(px + mm.t / 2, py + mm.t / 2, Math.max(4, mm.t * 0.7), 0, 7); g.fill(); g.strokeStyle = '#1f3a2b'; g.lineWidth = 2; g.stroke();
    g.fillStyle = TR_PAL[3]; g.font = 'bold 18px ui-monospace,monospace'; g.textBaseline = 'top'; g.fillText(m.name, 8, 6);
    return;
  }
  const route = trMapRoute(), rowsPer = 6, cols = Math.ceil(route.length / rowsPer), cw = W / cols, ch = (H - 10) / rowsPer;
  const pos = route.map((id, i) => { const c = Math.floor(i / rowsPer), r0 = i % rowsPer, r = c % 2 ? r0 : rowsPer - 1 - r0; return [c * cw + cw / 2, 5 + r * ch + ch / 2]; });
  g.strokeStyle = TR_PAL[2]; g.lineWidth = 4; g.setLineDash([]); g.beginPath(); pos.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
  const seen = s.mapSeen || {}, beatTown = { lexicon: 1, saltwick: 2, cinderglen: 3, summit: 4, glimmerfrost: 5, fablemere: 6, sandscript: 7, starhaven: 8 };
  route.forEach((id, i) => {
    const m = TR_MAPS[id], [x, y] = pos[i], known = seen[id] || id === here || s.visited[id], town = !!m.fly, w = Math.min(cw - 12, 172), h = Math.min(ch - 12, 62);
    g.fillStyle = id === here ? (blink ? '#f4c542' : '#fff3b0') : known ? (town ? TR_PAL[2] : TR_PAL[1]) : trMix(TR_PAL[0], TR_PAL[1], 0.5);
    g.strokeStyle = TR_PAL[3]; g.lineWidth = id === here ? 3 : 2; g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, town ? 10 : 4); g.fill(); g.stroke();
    g.fillStyle = known && town && id !== here ? TR_PAL[0] : id === here ? '#1f3a2b' : TR_PAL[3]; g.font = `bold ${town ? 15 : 14}px ui-monospace,monospace`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const label = known ? m.name : '???', icon = town ? '🏘️' : m.theme === 'cave' ? '⛰️' : m.theme === 'library' ? '📚' : '🌿';
    g.fillText(`${known ? icon + ' ' : '❔ '}${label.length > 17 ? label.slice(0, 16) + '…' : label}`, x, y - (beatTown[id] ? 9 : 0));
    if (beatTown[id] && known) { g.font = '13px sans-serif'; g.fillText(s.seals[beatTown[id]] ? '🏅 Badge won' : '· Hall ·', x, y + 13); }
    if (id === here) { g.font = '16px sans-serif'; g.fillText('✨', x + w / 2 - 6, y - h / 2 + 2); }
  });
  g.textAlign = 'left';
}
setInterval(() => { if (tr?.ui?.type === 'map' && view.name === 'trails') trMapDraw(); }, 400);
/* ---------- Console color (shared by Wordling Trails and Lexicon Saga) ---------- */
const TR_SHELLS = [['grape', '🍇 Grape'], ['teal', '🩵 Teal'], ['berry', '🍓 Berry'], ['kiwi', '🥝 Kiwi'], ['dandelion', '🌼 Dandelion'], ['ember', '🧡 Ember'], ['ice', '🧊 Ice'], ['classic', '🩶 Classic gray'],
  ['clear', '🫧 Clear'], ['clearpurple', '🔮 Clear purple'], ['clearteal', '💎 Clear teal'], ['clearberry', '🍒 Clear red'],
  ['clearblue', '🫐 Clear blue'], ['clearlime', '🍏 Clear green'], ['clearorange', '🍊 Clear orange'], ['clearsmoke', '🌫️ Clear smoke']];
const trShellClear = () => trShell().startsWith('clear');   // see-through cases show the circuit board inside
const trShell = () => TR_SHELLS.some(([k]) => k === S.settings?.trShell) ? S.settings.trShell : 'grape';
const trShellAttrs = () => `class="tr-console${trShell() === 'classic' ? '' : ' gbc'}${trShellClear() ? ' clear' : ''}" data-shell="${trShell()}"`;
function trApplyShell() { document.querySelectorAll('.tr-console').forEach(c => { c.classList.toggle('gbc', trShell() !== 'classic'); c.classList.toggle('clear', trShellClear()); c.dataset.shell = trShell(); }); }
/* menuFn(title, items, back, sel) is each game's own menu; back returns to that game's menu */
function trShellMenu(menuFn, back) {
  const cur = trShell(), items = TR_SHELLS.map(([k, label]) => ({ label: `${k === cur ? '✅ ' : ''}${label}`, fn: () => { S.settings.trShell = k; save(); trApplyShell(); trShellMenu(menuFn, back); } }));
  menuFn('🎨 Console color · pick one', items, back, TR_SHELLS.findIndex(([k]) => k === cur));
}
/* ---------- Stuck in a wall? Find the nearest safe spot that connects to the area's exits and doors ---------- */
function trSafeSpot(mapId, px, py) {
  const m = TR_MAPS[mapId], H = m.rows.length, W = m.rows[0].length, walk = (x, y) => TR_WALKABLE.has((m.rows[y] || '')[x]);
  if (m.indoor) { const e = m.entry || { x: 5, y: 10 }; return { x: e.x, y: e.y, dir: 'up' }; }
  const seeds = [];
  for (let x = 0; x < W; x++) { if (walk(x, 0)) seeds.push([x, 0]); if (walk(x, H - 1)) seeds.push([x, H - 1]); }
  for (let y = 0; y < H; y++) { if (walk(0, y)) seeds.push([0, y]); if (walk(W - 1, y)) seeds.push([W - 1, y]); }
  for (const k of Object.keys(m.doors || {})) { const [x, y] = k.split(',').map(Number); if (walk(x, y + 1)) seeds.push([x, y + 1]); }
  if (m.fly && walk(m.fly.x, m.fly.y)) seeds.push([m.fly.x, m.fly.y]);
  const seen = new Set(seeds.map(([x, y]) => x + ',' + y)), q = seeds.slice();
  while (q.length) { const [x, y] = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && walk(nx, ny)) { seen.add(k); q.push([nx, ny]); } } }
  const npcs = trNpcs(mapId), taken = (x, y) => npcs.some(n => n.x === x && n.y === y) || trItemAt(mapId, x, y);
  let best = null, bd = 1e9;
  for (const k of seen) { const [x, y] = k.split(',').map(Number); if (y === 0 || y === H - 1 || x === 0 || x === W - 1 || taken(x, y)) continue; const d = Math.abs(x - px) + Math.abs(y - py); if (d < bd) { bd = d; best = { x, y, dir: 'down' }; } }
  return best;
}
const trSafeSpotNear = s => { const q = [[s.x, s.y]], seen = new Set([s.x + ',' + s.y]), m = TR_MAPS[s.map]; while (q.length) { const [x, y] = q.pop(); if (x === 0 || y === 0 || y === m.rows.length - 1 || x === m.rows[0].length - 1 || Object.keys(m.doors || {}).some(k => k === x + ',' + (y - 1))) return true; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (!seen.has(k) && TR_WALKABLE.has((m.rows[ny] || '')[nx])) { seen.add(k); q.push([nx, ny]); } } } return false; };
function trUnstick(fromMenu) {
  const s = trS(), m = TR_MAPS[s.map];
  if (m.indoor && m.back && fromMenu) { trWarp(m.back.map, m.back.x, m.back.y, 'down'); return trSay('🆘 You step back outside the door.'); }
  const spot = trSafeSpot(s.map, s.x, s.y);
  if (spot) { Object.assign(s, spot); tr.moving = null; trSaveNow(true); return trSay(fromMenu ? '🆘 You squeeze out to the nearest open spot.' : 'You were stuck in a wall, so you’ve been moved to a safe spot nearby. 🧭'); }
  const r = s.respawn || { map: 'town', x: 5, y: 11 }; trWarp(r.map, r.x, r.y, 'down'); trSay('🆘 You head back to the last place you rested.');
}
function trApplyPad() { const w = $('.tr-wrap'); if (w) { w.classList.toggle('pad-on', S.settings?.trPad === 'on'); w.classList.toggle('pad-off', S.settings?.trPad === 'off'); } }
function trQuit() { trSaveNow(true); trFinish(); go({ name: 'games', deckId: tr?.deckId || view.deckId }); }


/* ---------- The story: Professor Rowan, rival Rio, the final challenge and rematches ---------- */
const trRioTeam = (list, lv) => list.map(x => { const [sp, l] = x.split(' '); return [sp === '@' ? trS().flags.rivalSp : sp, +l]; });
function trProfessor(n) {
  const s = trS(), nm = esc(s.name);
  if (!s.flags.starter) {
    if (s.flags.ballIntro) return trSay(['Professor Rowan: Take your time! Walk up to my table and press A on a block ball to see who’s inside.']);
    s.flags.ballIntro = 1; trSaveNow(true);
    return trSay([`Professor Rowan: Ah, ${nm}! And here comes Rio. Perfect timing!`, 'Professor Rowan: Every Wordling holds a word inside it. Learn the words, and they will trust you.',
      'Professor Rowan: On my table are three <b>block balls</b>. 🧊 Each one has a young Wordling sleeping inside.', 'Professor Rowan: Walk up to the table and press A on a block ball to peek inside. When you find the one you like, it can be your partner!',
      'Rio: You go first! I already know which one I want. Hehe.']);
  }
  if (s.beaten.champion && !s.beaten.profFinal) return trSay([`Professor Rowan: Ready, Champion? My ${esc(TR_SPECIES[s.flags.profSp].name)} has been waiting for this.`], trProfBattle);
  if (s.beaten.vex && !s.beaten.champion) return trSay([`Professor Rowan: ${nm}… you saved every word in the land. I am so proud.`, 'Professor Rowan: Have you heard? Rio went to the Ultimate Stadium, north of Starhaven, and beat all of the Elite Four!',
    'Professor Rowan: He is the Wordling Champion now. Go and challenge him. I’ll be watching from the crowd!']);
  if (s.beaten.profFinal) return trSay(['Professor Rowan: Every trainer in the region is asking for a rematch, you know.', `Professor Rowan: Your Spirit Log has ${Object.keys(s.caught).length} of ${TR_DEX.length} Wordlings. Keep going!`]);
  return trSay([`Professor Rowan: How is your Spirit Log coming along, ${nm}? ${Object.keys(s.caught).length} caught, ${Object.keys(s.seen).length} seen.`,
    'Professor Rowan: Remember, Verbs beat Nouns, Nouns beat Adjectives, and Adjectives beat Verbs.']);
}
function trBlockBall(i) {
  const s = trS(), k = TR_STARTERS[i], sp = TR_SPECIES[k], ty = TR_TYPES[sp.type], name = esc(sp.name);
  if (s.flags.starter) return trSay(k === s.flags.profSp && !s.beaten.profFinal ? [`The block ball holds Professor Rowan’s partner, ${name}. It’s fast asleep. 💤`] : ['Professor Rowan’s research notes are spread across the table.']);
  tr.peek = { sp: k, t0: tr.frame }; trCry(k);
  const close = () => { tr.peek = null; };
  trSay(['🧊 You tap the block ball. Click! The lid pops open…', `It’s <b>${name}</b>! ${ty.icon} ${ty.name} type.`, esc(sp.blurb)], () => {
    if (!s.flags.ballIntro) { close(); return trSay('Professor Rowan: Ha! Curious already? Come talk to me first, then you can choose.'); }
    trMenu(`Choose ${name} as your partner?`, [{ label: `✅ Yes, ${name}!`, fn: () => { close(); trStarterChosen(k); } },
      { label: 'Let me look at the others', fn: () => { close(); trSay('You close the block ball gently. It wiggles a little.'); } }], () => { close(); trBox(); });
  });
}
function trStarterChosen(k) {
  const s = trS(), rv = trRivalPick(k), pf = TR_STARTERS.find(x => x !== k && x !== rv);
  trCry(k); Object.assign(s.flags, { starter: k, rivalSp: rv, profSp: pf, metProf: 1 }); s.team = [trMon(k, 5)]; s.seen[k] = s.caught[k] = 1; s.seen[rv] = s.seen[pf] = 1; trSaveNow(true); trJingle('heal');
  trSay([`🌿 <b>${esc(TR_SPECIES[k].name)}</b> is now your partner!`, `Rio grabs the block ball with ${esc(TR_SPECIES[rv].name)}.`, `Rio: Then I’ll take ${esc(TR_SPECIES[rv].name)}! It has the edge on yours. Hehe.`, `Professor Rowan: And ${esc(TR_SPECIES[pf].name)} will stay here with me.`,
    'Rio: Hey, let’s battle right now! Just a friendly one!'], () => trTrainerBattle('rival0', { name: 'Rio', friendly: true, team: [[rv, 5]], reward: 50, nuts: 2, intro: [], win: ['Aww, you got me! Good battle!'],
      then: won => trSay([won ? 'Rio: Okay, you win this one. But I’ll catch up!' : 'Rio: Yes! I won! Don’t worry, it was close.', 'Professor Rowan: What a battle! Both of you have the heart of an explorer.',
        'Professor Rowan: Now, I have a favor to ask. No one has ever made a full record of the Wordlings in our region.', 'Professor Rowan: Will you two catalogue every one? Here, a <b>Spirit Log</b> for each of you. 📖',
        '🎁 You got the <b>Spirit Log</b>! Open it from your menu. Every Wordling you see or catch is recorded.', 'Professor Rowan: And take these block balls to catch your first few. 🧊 ×5',
        'Rio: Race you! First one to fill the Spirit Log wins! See ya!'], () => { s.key.log = 1; s.bag.charm = (s.bag.charm || 0) + 5; s.flags.rivalLeft = 1; s.team.forEach(m => { m.hp = trMaxHp(m); }); trSaveNow(true); trBox(); }) }));
}
function trProfBattle() {
  const s = trS();
  trTrainerBattle('profFinal', { name: 'Professor Rowan', boss: true, friendly: true, team: [['cloudmane', 65], ['penhawk', 66], [s.flags.profSp, 70]], reward: 0, nuts: 12, intro: [], win: ['Wonderful. Simply wonderful.'],
    then: won => won ? trProfReward() : trSay('Professor Rowan: Not yet! Rest your team at the Clinic here. I’ll wait right outside the stadium.') });
}
/* ---------- The Ultimate Stadium: Rio beats the Elite Four first; after you beat him, the Professor walks up ---------- */
function trStadiumCheck() {
  const s = trS(); if (s.map !== 'plaza' || tr.bt || tr.ui || tr.scene) return;
  if (!s.flags.plazaIntro && !s.beaten.champion) {
    s.flags.plazaIntro = 1; trSaveNow(true);
    const spots = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [s.x + dx, s.y + dy]).filter(([x, y]) => TR_WALKABLE.has(trTile(s.map, x, y)) && !trNpcAt(s.map, x, y));
    const [rx, ry] = spots[0] || [s.x + 1, s.y];
    return trSay(['📣 Announcer: …and that’s FOUR wins in a row! The Elite Four have fallen!', '📣 Announcer: Please welcome our brand-new <b>Wordling Champion</b>… RIO! 🎉', '🎊 The crowd inside the stadium roars!'], () => {
      tr.rivalShow = { x: rx, y: ry, dir: rx < s.x ? 'right' : rx > s.x ? 'left' : ry < s.y ? 'down' : 'up' }; s.dir = TR_BACK[tr.rivalShow.dir];
      trSay(['❗ Rio: Oh! Hey, it’s you!', 'Rio: I did it! I beat all four of the Elite Four, one after another. I’m the Champion now!', 'Rio: But a Champion needs a challenger. And I want it to be you.',
        'Rio: Beat the Elite Four inside, then come find me in the Champion’s room at the very top. I’ll be waiting!'], () => { tr.rivalShow = null; trSay('Rio runs back into the Ultimate Stadium. 🏟️'); });
    });
  }
  if (s.beaten.champion && !s.beaten.profFinal && !s.flags.profWalk) {
    // the Professor walks up the path toward you
    const tx = s.x, ty = s.y + 1, open = (x, y) => TR_WALKABLE.has(trTile(s.map, x, y)) && !trNpcAt(s.map, x, y);
    let path = [];
    if (open(tx, ty)) { path = [[tx, ty]]; while (path.length < 6 && open(tx, path[path.length - 1][1] + 1)) path.push([tx, path[path.length - 1][1] + 1]); path.reverse(); }
    else { const a = [[1, 0], [-1, 0], [0, -1]].map(([dx, dy]) => [s.x + dx, s.y + dy]).find(([x, y]) => open(x, y)); path = [a || [s.x + 1, s.y]]; }
    tr.scene = true; tr.held = null; s.dir = 'down';
    const arch = 'scholar', face = ([x, y]) => x < s.x ? 'right' : x > s.x ? 'left' : y < s.y ? 'down' : 'up';
    trSay(`❗ Professor Rowan: ${esc(s.name)}! Wait up!`, () => {
      let i = 0; tr.profShow = { x: path[0][0], y: path[0][1], dir: 'up', arch };
      const walk = () => {
        if (!tr) return;
        i++; if (i < path.length) { tr.profShow = { x: path[i][0], y: path[i][1], dir: 'up', arch, step: i % 2 }; return setTimeout(walk, 230); }
        tr.profShow.dir = face(path[path.length - 1]); tr.profShow.step = 0; s.dir = TR_BACK[tr.profShow.dir]; tr.scene = false;
        trSay(['Professor Rowan: Phew! I ran all the way down from the stands.', 'Professor Rowan: What a battle! You and Rio… I could hardly breathe.', `Professor Rowan: The new <b>Wordling Champion</b>. Congratulations, ${esc(s.name)}! 🎉`,
          `Professor Rowan: Do you remember the third Wordling on my table? My partner, ${esc(TR_SPECIES[s.flags.profSp].name)}.`, 'Professor Rowan: We have trained together all this time, waiting for this day.',
          'Professor Rowan: One last lesson, Champion. Show me everything you’ve learned!'], () => { tr.profShow = null; s.flags.profWalk = 1; trSaveNow(true); trProfBattle(); });
      };
      setTimeout(walk, 230);
    });
  }
}
function trProfReward() {
  const s = trS(), sp = trGrownForm(s.flags.profSp, 70), m = trMon(sp, 70); s.caught[sp] = s.seen[sp] = 1; s.flags.postgame = 1;
  const where = s.team.length < TR_TEAM_MAX ? (s.team.push(m), 'It joined your team!') : (s.box.push(m), 'Your team is full, so it went to the storage computer. 🖥️');
  trSaveNow(true); trJingle('victory');
  trSay(['Professor Rowan: You are truly the greatest explorer this region has ever known.', `Professor Rowan: Please, take my partner, <b>${esc(TR_SPECIES[sp].name)}</b>. It wants to travel with you now.`, `🎁 You got <b>${esc(TR_SPECIES[sp].name)}</b> (Lv 70)! ${where}`,
    'Professor Rowan: And one more thing. Every trainer and Hall Leader you beat wants a rematch. They’ve been training hard!', '🔁 <b>Rematches are open!</b> Talk to any trainer you’ve beaten to battle again. No prizes, just the challenge.', '🏆 <b>You beat Wordling Trails!</b> Thank you for playing. Keep exploring, catching and studying. 🌿']);
}
function trRioTalk(n) {
  const s = trS();
  if (!s.flags.starter) return trSay(['Rio: Can you believe it? The Professor is giving us real Wordlings today! Go talk to him!']);
  if (s.flags.postgame) return trMenu('Rio: Hey, champion! Want to battle for old times’ sake?', [
    { label: '⚔️ Battle Rio', fn: () => trTrainerBattle('re:rio', { name: 'Rio', rematch: true, team: [['sparkhorn', 66], ['tomeguard', 66], ['fernfox', 67], ['anchorcrab', 67], [s.flags.rivalSp, 70]], reward: 0, nuts: 0, intro: [], win: ['You’re still the best. That’s what friends are for!'] }) },
    { label: 'Maybe later', fn: () => trSay('Rio: Anytime!') }], () => {});
  return trSay(['Rio: I’ll see you out there!']);
}
/* Rio waits for you on the route. Walk close and he runs up to battle; afterwards he heads off toward the next town. */
function trRivalPending(s) {
  if (!s?.flags.starter || typeof TR_RIVAL === 'undefined') return null;
  return TR_RIVAL.find(x => x.map === s.map && !s.beaten[x.id] && trSeals(s) >= x.seals && trSeals(s) <= x.seals + 1 && !TR_RIVAL.some(y => y.seals > x.seals && s.beaten[y.id])) || null;
}
/* the shortest walk between two spots (or to any spot in a list), on open ground */
function trRivalPath(map, from, goals, avoid) {
  const m = TR_MAPS[map], W = m.rows[0].length, H = m.rows.length, key = (x, y) => x + ',' + y, goal = new Set(goals.map(([x, y]) => key(x, y)));
  const prev = new Map([[key(...from), null]]), q = [from];
  while (q.length) {
    const [x, y] = q.shift(); if (goal.has(key(x, y))) { const path = []; let k = key(x, y); while (k) { path.unshift(k.split(',').map(Number)); k = prev.get(k); } return path; }
    for (const [dx, dy] of [[0, -1], [1, 0], [-1, 0], [0, 1]]) { const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev.has(k) || !TR_WALKABLE.has(m.rows[ny][nx]) || (trNpcAt(map, nx, ny) && !goal.has(k)) || avoid?.(nx, ny)) continue;
      prev.set(k, key(x, y)); q.push([nx, ny]); }
  }
  return null;
}
/* the edge of the map that leads on (the one farthest from where you came in) */
function trRivalExit(s) {
  const m = TR_MAPS[s.map], W = m.rows[0].length, H = m.rows.length; let best = null;
  for (const side of Object.keys(m.exits || {})) {
    const tiles = trOpenings(m, side).map(c => side === 'top' ? [c, 0] : side === 'bottom' ? [c, H - 1] : side === 'left' ? [0, c] : [W - 1, c]);
    if (!tiles.length) continue; const d = Math.min(...tiles.map(([x, y]) => Math.abs(x - s.x) + Math.abs(y - s.y)));
    if (!best || d > best.d) best = { d, tiles };
  }
  return best?.tiles || [];
}
function trRivalCheck() {
  const s = trS(); if (!tr || tr.bt) return;
  const r = trRivalPending(s); if (!r) { tr.rivalWait = null; return; }
  const path = trRivalPath(s.map, [s.x, s.y], trRivalExit(s)) || [];
  const at = path[Math.min(Math.max(4, Math.floor(path.length / 3)), path.length - 2)] || path[path.length - 1];
  if (!at || (at[0] === s.x && at[1] === s.y)) return;
  const before = path[path.indexOf(at) - 1] || [s.x, s.y];
  tr.rivalWait = { id: r.id, x: at[0], y: at[1], dir: before[0] < at[0] ? 'left' : before[0] > at[0] ? 'right' : before[1] < at[1] ? 'up' : 'down' };
  tr.rivalShow = { ...tr.rivalWait };
}
/* called after every step: close enough, and Rio runs up */
function trRivalNear() {
  const s = trS(), w = tr.rivalWait; if (!w || tr.bt || tr.scene || w.map && w.map !== s.map) return false;
  if (Math.abs(w.x - s.x) + Math.abs(w.y - s.y) > 3) return false;
  const r = TR_RIVAL.find(x => x.id === w.id); if (!r || s.beaten[r.id]) { tr.rivalWait = null; return false; }
  tr.scene = true; tr.held = null;
  const near = [[0, -1], [1, 0], [-1, 0], [0, 1]].map(([dx, dy]) => [s.x + dx, s.y + dy]).filter(([x, y]) => TR_WALKABLE.has(trTile(s.map, x, y)) && !trNpcAt(s.map, x, y));
  const path = trRivalPath(s.map, [w.x, w.y], near, (x, y) => x === s.x && y === s.y) || [[w.x, w.y]];
  tr.rivalShow = { x: w.x, y: w.y, dir: w.dir, bang: true }; s.dir = TR_BACK[w.dir] || s.dir; trSound('bump');
  setTimeout(() => trRivalWalk(path, () => {
    const at = path[path.length - 1], dir = at[0] < s.x ? 'right' : at[0] > s.x ? 'left' : at[1] < s.y ? 'down' : 'up';
    tr.rivalShow = { x: at[0], y: at[1], dir }; s.dir = TR_BACK[dir]; tr.rivalWait = null; tr.scene = false;
    trSay(['❗ Rio: ' + esc(r.intro[0]), ...r.intro.slice(1).map(l => 'Rio: ' + esc(l))], () => trTrainerBattle(r.id, { name: 'Rival Rio', team: trRioTeam(r.team), reward: 150 + 120 * r.seals, nuts: 3, intro: [], win: r.win,
      then: won => { if (won) trRivalLeave(); else tr.rivalShow = null; } }));
  }), 500);
  return true;
}
function trRivalWalk(path, done, ms = 190) {
  let i = 0;
  const step = () => {
    if (!tr) return;
    if (++i >= path.length) return done();
    const [x0, y0] = path[i - 1], [x, y] = path[i];
    tr.rivalShow = { x, y, dir: x > x0 ? 'right' : x < x0 ? 'left' : y > y0 ? 'down' : 'up', step: i % 2 };
    setTimeout(step, ms);
  };
  if (path.length < 2) return done();
  setTimeout(step, ms);
}
/* after the battle Rio waves and runs off toward the next town */
function trRivalLeave() {
  const s = trS(), from = tr.rivalShow ? [tr.rivalShow.x, tr.rivalShow.y] : null; if (!from) return;
  const path = trRivalPath(s.map, from, trRivalExit(s), (x, y) => x === s.x && y === s.y);
  const next = TR_MAPS[TR_MAPS[s.map].exits?.[Object.keys(TR_MAPS[s.map].exits || {}).find(k => path && trOpenings(TR_MAPS[s.map], k).length && (k === 'top' ? path.at(-1)[1] === 0 : k === 'bottom' ? path.at(-1)[1] === TR_MAPS[s.map].rows.length - 1 : k === 'left' ? path.at(-1)[0] === 0 : path.at(-1)[0] === TR_MAPS[s.map].rows[0].length - 1))]];
  tr.rivalShow.bang = false;
  trSay(`Rio: I’m heading on to ${next ? esc(next.name) : 'the next town'}! Catch you later! 👋`, () => {
    if (!path) { tr.rivalShow = null; return; }
    tr.scene = true;
    trRivalWalk(path, () => { tr.rivalShow = null; tr.scene = false; }, 150);
  });
}
/* rematches after the main story: same trainers, higher levels, no prizes */
const trRematchLv = lv => Math.min(85, Math.round(45 + lv * 0.9));
function trRematchOffer(n) {
  const s = trS(), t = trTrainerOf(n), done = !!s.rematch[n.id];
  trMenu(`${esc(t.name)}: ${done ? 'That rematch was amazing. Again?' : 'I’ve been training since our last battle. Rematch?'}`, [
    { label: `⚔️ Rematch${done ? ' again' : ''}`, sub: `Their team is now around level ${trRematchLv(Math.max(...t.team.map(x => x[1])))}.`, fn: () => trTrainerBattle('re:' + n.id, { ...t, then: undefined, rematch: true, rematchOf: n.id, reward: 0, nuts: 0, team: t.team.map(([sp, lv]) => [sp, trRematchLv(lv)]), intro: t.intro, win: ['Wow. You really are the champion.'] }) },
    { label: 'Not now', fn: () => trSay(`${esc(t.name)}: Come back anytime!`) }], () => {});
}
const trRematchTotal = () => Object.values(TR_MAPS).reduce((a, m) => a + m.npcs.filter(n => n.trainer && !n.trainer.syndicate && !n.trainer.final).length, 0);
/* ---------- special abilities of legendary Wordlings ---------- */
const trAbility = m => TR_SPECIES[m?.sp]?.ability;

/* ---------- Battles ---------- */
function trWild(sp, lv) {
  const s = trS();
  sp = trGrownForm(sp, lv); s.seen[sp] = 1;
  tr.bt = { wild: true, foes: [trMon(sp, lv)], fi: 0, me: s.team.indexOf(trLead()), meFocus: 0, meGuard: 0, flashFoe: 0, flashMe: 0, used: new Set() };
  tr.bt.used.add(trCurMe().id); tr.flash = 12; trBattleMusic();
  trSay([TR_SPECIES[sp].legend ? `✨ The legendary <b>${esc(TR_SPECIES[sp].name)}</b> is ready to battle!` : `A wild <b>${esc(TR_SPECIES[sp].name)}</b> jumps out!`, `Go, ${esc(TR_SPECIES[trCurMe().sp].name)}!`], trBattleMenu);
}
function trTrainerBattle(id, t) {
  const s = trS();
  tr.bt = { wild: false, id, t, foes: t.team.map(([sp, lv]) => trMon(trGrownForm(sp, lv), lv)), fi: 0, me: s.team.indexOf(trLead()), meFocus: 0, meGuard: 0, flashFoe: 0, flashMe: 0, used: new Set(), boss: !!(t.boss || t.seal) };
  tr.bt.used.add(trCurMe().id); tr.bt.foes.forEach(f => { s.seen[f.sp] = 1; }); tr.flash = 12; trBattleMusic();
  trSay([`<b>${esc(t.name)}</b> sends out ${esc(TR_SPECIES[tr.bt.foes[0].sp].name)}!${trAbility(tr.bt.foes[0]) ? ` ✨ (${TR_ABILITIES[trAbility(tr.bt.foes[0])].name})` : ''}`, `Go, ${esc(TR_SPECIES[trCurMe().sp].name)}!`], trBattleMenu);
}
const trCurMe = () => trS().team[tr.bt.me];
const trCurFoe = () => tr.bt.foes[tr.bt.fi];
function trBattleMenu() {
  const me = trCurMe(), b = tr.bt;
  trMenu(`What will ${esc(TR_SPECIES[me.sp].name)} do?`, [
    { label: '⚔️ Fight', fn: () => trMoveMenu() },
    { label: '🎒 Bag', fn: () => trBagMenu(true) },
    { label: '🐾 Team', disabled: trS().team.filter(m => m.hp > 0).length < 2, fn: () => trSwitchMenu(false) },
    { label: '🏃 Run', disabled: !b.wild, fn: () => trRun() },
  ]);
}
function trMoveMenu() {
  const me = trCurMe(), foe = trCurFoe();
  trMenu('Pick a move. You’ll answer a card to use it!', trMoves(me).map(k => {
    const mv = TR_MOVES[k], eff = mv.type ? (TR_BEATS[mv.type] === TR_SPECIES[foe.sp].type ? ' · strong here!' : TR_BEATS[TR_SPECIES[foe.sp].type] === mv.type ? ' · weak here' : '') : '';
    return { label: `${mv.type ? TR_TYPES[mv.type].icon + ' ' : ''}${mv.name}${mv.power ? ` <small>power ${mv.power}${mv.hits ? ' ×' + mv.hits : ''}</small>` : mv.heal ? ' <small>heals</small>' : ''}`, sub: mv.desc + eff, fn: () => trUseMove(k) };
  }), () => trBattleMenu());
}
function trTypeMult(moveType, defType) { if (!moveType) return 1; if (TR_BEATS[moveType] === defType) return 1.6; if (TR_BEATS[defType] === moveType) return 0.6; return 1; }
function trDamage(att, def, mv, crit, extra = 1) {
  const base = ((att.lv * 0.4 + 2) * mv.power * trStat(att, 'atk') / trStat(def, 'def')) / 25 + 2;
  return Math.max(1, Math.floor(base * trTypeMult(mv.type, TR_SPECIES[def.sp].type) * (crit ? 1.5 : 1) * extra * (trAbility(def) === 'bedrock' ? 0.66 : 1) * (0.85 + Math.random() * 0.15)));
}
function trUseMove(k) {
  const me = trCurMe(), foe = trCurFoe(), mv = TR_MOVES[k], b = tr.bt, nm = esc(TR_SPECIES[me.sp].name), fn = esc(TR_SPECIES[foe.sp].name);
  tr.askPower = true; trAsk(`${nm} uses <b>${mv.name}</b>! Answer to make it work:`, (ok, fast, q) => {
    if (q?.timeout) { b.meFocus = 0; return trSay(`⏰ Time’s up! ${nm} waited too long and lost its turn.`, () => trFoeTurn()); }
    if (!ok) return trSay(`${nm}'s ${mv.name} missed…`, () => trFoeTurn());
    const speed = q?.mult || 1;
    if (k === 'focus') { b.meFocus = 1; return trSay(`${nm} is focusing hard! 🔥 The next hit will be much stronger.`, () => trFoeTurn()); }
    if (k === 'guard') { b.meGuard = 1; return trSay(`${nm} gets ready to block! 🛡️`, () => trFoeTurn()); }
    if (mv.heal) { const before = me.hp; me.hp = Math.min(trMaxHp(me), me.hp + Math.ceil(trMaxHp(me) * mv.heal)); trSound('hop'); return trSay(`${nm} used ${mv.name}! It got ${me.hp - before} HP back. 💬`, () => trFoeTurn()); }
    const dmg = trDamage(me, foe, mv, false, (b.meFocus ? 1.8 : 1) * speed); b.meFocus = 0;
    foe.hp = Math.max(0, foe.hp - dmg); b.flashFoe = 10; trSound('hit');
    const mult = trTypeMult(mv.type, TR_SPECIES[foe.sp].type), lines = [`${nm} used ${mv.name}! ${fn} lost ${dmg} HP.`];
    if (speed >= 1.3) lines.push(`⚡ Lightning-fast answer! Power ×${speed.toFixed(2).replace(/0$/, '')}`); else if (speed > 1) lines.push(`💨 Quick answer! Power ×${speed.toFixed(2).replace(/0$/, '')}`); else if (speed < 1) lines.push(`🐢 Slow answer… Power ×${speed.toFixed(2).replace(/0$/, '')}`);
    if (mult > 1) lines.push('It’s super strong against that type!'); else if (mult < 1) lines.push('It isn’t very strong against that type…');
    if (mv.hits > 1 && foe.hp > 0) for (let h = 1; h < mv.hits && foe.hp > 0; h++) { const d2 = trDamage(me, foe, mv, false, speed); foe.hp = Math.max(0, foe.hp - d2); lines.push(`It hits again! ${fn} lost ${d2} more HP.`); }
    if (mv.drain) { const g = Math.max(1, Math.round(dmg * mv.drain)), before = me.hp; me.hp = Math.min(trMaxHp(me), me.hp + g); if (me.hp > before) lines.push(`🧲 ${nm} took back ${me.hp - before} HP.`); }
    if (mv.recoil) { const r = Math.max(1, Math.round(dmg * mv.recoil)); me.hp = Math.max(1, me.hp - r); lines.push(`💥 The echo hurts ${nm} for ${r} HP.`); }
    if (mv.stun && foe.hp > 0 && Math.random() < mv.stun) { b.stun = foe; lines.push(`❄️ ${fn} is frozen solid!`); }
    if (mv.guardUp) { b.meGuard = 1; lines.push(`🛡️ ${nm} braces for the next hit.`); }
    if (mv.focusUp) { b.meFocus = 1; lines.push(`🔥 ${nm} is focusing for the next hit!`); }
    if (trAbility(me) === 'swift' && foe.hp > 0) { const d2 = Math.max(1, Math.round(trDamage(me, foe, mv, false) * 0.6)); foe.hp = Math.max(0, foe.hp - d2); lines.push(`⚡ Swift Strike! ${nm} hits again for ${d2}!`); }
    if (trAbility(foe) === 'bedrock') lines.push(`🪨 ${fn}’s Bedrock softened the blow.`);
    trSay(lines, () => foe.hp <= 0 ? trFoeFainted() : trFoeTurn());
  });
}
function trFoeTurn() {
  const b = tr.bt, me = trCurMe(), foe = trCurFoe(); if (!b) return;
  if (b.stun && b.stun === foe) { b.stun = null; return trSay(`${b.wild ? 'The wild ' : ''}${esc(TR_SPECIES[foe.sp].name)} is frozen and can’t move! ❄️`, trBattleMenu); }
  const special = foe.lv >= 5 && Math.random() < (foe.lv >= 18 ? 0.35 : 0.45), surge = foe.lv >= 18 && Math.random() < 0.18;
  const sigK = 'sig_' + trFamilyOf(foe.sp), useSig = TR_MOVES[sigK] && foe.lv >= TR_MOVES[sigK].learn && Math.random() < 0.25;
  const mv = TR_MOVES[useSig ? sigK : surge ? 'surge' : special ? TR_SPECIAL[TR_SPECIES[foe.sp].type] : 'strike'];
  const fn = esc(TR_SPECIES[foe.sp].name), nm = esc(TR_SPECIES[me.sp].name), who = b.wild ? 'The wild ' : '';
  if (Math.random() < 0.08) { b.meGuard = 0; return trSay(`${who}${fn} used ${mv.name}… but missed!`, trBattleMenu); }
  const dmg = trDamage(foe, me, mv, false, b.meGuard ? 0.35 : 1), guarded = b.meGuard; b.meGuard = 0;
  me.hp = Math.max(0, me.hp - dmg); b.flashMe = 10; trSound('hurt');
  const lines = [`${who}${fn} used ${mv.name}! ${nm} lost ${dmg} HP.${guarded ? ' 🛡️ Guard blocked most of it.' : ''}`];
  if (trTypeMult(mv.type, TR_SPECIES[me.sp].type) > 1) lines.push('Ouch, that type is strong against yours!');
  if (trAbility(foe) === 'swift' && me.hp > 0) { const d2 = Math.max(1, Math.round(trDamage(foe, me, mv, false) * 0.6)); me.hp = Math.max(0, me.hp - d2); lines.push(`⚡ Swift Strike! ${who}${fn} hits again for ${d2}!`); }
  for (const [mon, label] of [[foe, `${who}${fn}`], [me, nm]]) if (trAbility(mon) === 'radiant' && mon.hp > 0 && mon.hp < trMaxHp(mon)) { const h = Math.max(1, Math.round(trMaxHp(mon) * 0.1)); mon.hp = Math.min(trMaxHp(mon), mon.hp + h); lines.push(`🌸 ${label}’s Radiant Glow restores ${h} HP.`); }
  trSay(lines, () => me.hp <= 0 ? trMeFainted() : trBattleMenu());
}
function trGainXp(m, amount, lines) {
  m.xp += amount; lines.push(`${esc(TR_SPECIES[m.sp].name)} got ${amount} XP.`);
  while (m.xp >= trNeed(m.lv) && m.lv < 100) {
    if (!m.moves?.length) m.moves = trMoves(m);
    m.xp -= trNeed(m.lv); const oldMax = trMaxHp(m), oldLearned = trLearned(m.sp, m.lv);
    m.lv++; m.hp += trMaxHp(m) - oldMax;
    lines.push(`🎉 ${esc(TR_SPECIES[m.sp].name)} grew to level ${m.lv}!`);
    for (const k of trLearned(m.sp, m.lv)) if (!oldLearned.includes(k) && !m.moves.includes(k)) {
      if (m.moves.length < TR_MOVE_SLOTS) { m.moves.push(k); lines.push(`✨ It learned <b>${TR_MOVES[k].name}</b>!`); }
      else { (m.learnQ ||= []).push(k); lines.push(`🌱 ${esc(TR_SPECIES[m.sp].name)} wants to learn <b>${TR_MOVES[k].name}</b>! You’ll choose what to do after this.`); }
    }
    let evo = TR_SPECIES[m.sp].evo;
    while (evo && m.lv >= evo[1]) {
      const before = TR_SPECIES[m.sp].name, max0 = trMaxHp(m);
      m.sp = evo[0]; m.hp = Math.max(1, m.hp + trMaxHp(m) - max0);
      const s = trS(); if (s) { s.seen[m.sp] = 1; s.caught[m.sp] = 1; }
      lines.push(`❗ What? ${esc(before)} is glowing…`, `🌟 ${esc(before)} evolved into <b>${esc(TR_SPECIES[m.sp].name)}</b>! (#${trDexNo(m.sp)})`);
      if (tr) tr.evolved = (tr.evolved || 0) + 1;
      evo = TR_SPECIES[m.sp].evo;
    }
  }
}
function trFoeFainted() {
  const b = tr.bt, foe = trCurFoe(), me = trCurMe(), s = trS(), lines = [`${b.wild ? 'The wild ' : ''}${esc(TR_SPECIES[foe.sp].name)} fainted!`];
  const xp = Math.round((8 * foe.lv + 6) * (b.wild ? 1 : 1.5));
  trGainXp(me, xp, lines);
  const share = Math.round(xp * 0.4), others = s.team.filter(m => m !== me && m.hp > 0);
  if (others.length && share) { const quiet = []; others.forEach(m => trGainXp(m, share, quiet)); lines.push(`The rest of your team got ${share} XP each.`, ...quiet.filter(l => /grew|learned/.test(l))); }
  if (!b.wild && b.fi < b.foes.length - 1) { b.fi++; lines.push(`${esc(b.t.name)} sends out ${esc(TR_SPECIES[trCurFoe().sp].name)}!`); return trSay(lines, trBattleMenu); }
  if (b.wild) { const c = 4 * foe.lv; s.coins += c; lines.push(`You found 🪙 ${c}.`); tr.session.nuts += 1; tr.session.wins++; return trEndBattle(lines, true); }
  if (b.t.rematch) { s.rematch[b.t.rematchOf || b.id] = Date.now(); tr.session.wins++; lines.push(`🔁 You won the rematch against ${esc(b.t.name)}!`, ...b.t.win.map(l => `${esc(b.t.name)}: ${esc(l)}`), `Rematches won: ${Object.keys(s.rematch).filter(k => k !== 're:rio').length}/${trRematchTotal()}`); return trEndBattle(lines, true); }
  s.coins += b.t.reward; s.beaten[b.id] = 1; lines.push(b.t.reward ? `You won! ${esc(b.t.name)} gives you 🪙 ${b.t.reward}.` : 'You won!', ...b.t.win.map(l => `${esc(b.t.name)}: ${esc(l)}`));
  tr.session.nuts += b.t.nuts; tr.session.wins++;
  let award = null;
  if (b.t.seal && !s.seals[b.t.seal]) { s.seals[b.t.seal] = Date.now(); award = b.t.seal; }
  const npc = TR_MAPS[s.map].npcs.find(n => n.id === b.id);
  if (npc?.leaves) lines.push(`${esc(b.t.name)} runs off in a hurry! 💨`);
  if (b.id === 'champion') lines.push('🏆 You are the new <b>Wordling Champion</b>! The whole stadium is on its feet!');
  if (b.t.final) { s.done = true; lines.push('🌟 The vault doors swing open, and thousands of words fly out like birds, back to every sign and book in the land!', '📣 Word spreads fast: Rio has gone to the <b>Ultimate Stadium</b>, north of Starhaven, to challenge the Elite Four!', 'The guards at Starhaven’s north gate will let you through now. 🏟️'); }
  trEndBattle(lines, true, award);
}
function trMeFainted() {
  const s = trS(), lines = [`${esc(TR_SPECIES[trCurMe().sp].name)} fainted!`];
  if (s.team.some(m => m.hp > 0)) return trSay(lines, () => trSwitchMenu(true));
  if (tr.bt?.t?.friendly || tr.bt?.t?.rematch) { s.team.forEach(m => { m.hp = trMaxHp(m); }); lines.push(`${esc(tr.bt.t.name)} wins this time! Your team gets a quick rest. 🍃`); return trEndBattle(lines, false); }
  const lost = Math.floor(s.coins / 2); s.coins -= lost;
  lines.push('Your whole team is tired out…', `You hurry back to rest and drop 🪙 ${lost} on the way.`);
  trSay(lines, () => {
    tr.bt = null; trWarp(s.respawn.map, s.respawn.x, s.respawn.y, 'down', true);
    s.team.forEach(m => { m.hp = trMaxHp(m); }); trSaveNow(true); trSay('Your Wordlings feel better after a long rest. 🍃');
  });
}
function trSwitchMenu(forced) {
  const s = trS();
  trMenu(forced ? 'Choose who goes next:' : 'Switch to…', s.team.map((m, i) => ({ label: trMonLine(m), disabled: m.hp <= 0 || i === tr.bt.me,
    fn: () => { tr.bt.me = i; tr.bt.meFocus = 0; tr.bt.used.add(m.id); trSay(`Go, ${esc(TR_SPECIES[m.sp].name)}!`, forced ? trBattleMenu : trFoeTurn); } })), forced ? null : () => trBattleMenu());
}
function trRun() { if (Math.random() < 0.85) { if (tr.bt?.legend) (tr.legendGone ||= {})[tr.bt.legend] = 1; return trEndBattle(['You got away safely! 💨']); } trSay('You couldn’t get away!', trFoeTurn); }
function trThrowCharm(kind = 'charm') {
  const s = trS(), foe = trCurFoe(), fn = esc(TR_SPECIES[foe.sp].name); s.bag[kind]--;
  trAsk(`You throw a ${TR_ITEMS[kind].name} ${TR_ITEMS[kind].icon} at ${fn}! Answer this bonus card to make it glow brighter:`, ok => {
    const chance = Math.min(0.97, Math.max(0.1, 0.22 + 0.62 * (1 - foe.hp / trMaxHp(foe)) + (ok ? 0.2 : 0) + (kind === 'goldcharm' ? 0.25 : 0) - (foe.lv > trCurMe().lv ? 0.08 : 0)));
    const caught = Math.random() < (TR_SPECIES[foe.sp].legend ? chance * 0.45 : chance), shakes = caught ? 3 : Math.floor(Math.random() * 3), lines = [ok ? 'The block ball glows bright! ✨' : 'The block ball flickers…'];
    for (let i = 0; i < shakes; i++) lines.push(['…wiggle…', '…wiggle… wiggle…', '…wiggle… wiggle… wiggle…'][i]);
    tr.bt.ball = { kind: kind === 'goldcharm' ? 'gold' : 'ball', t0: tr.frame };
    if (!caught) return trSay(lines, () => { tr.bt.ball = null; tr.bt.flashFoe = 8; trSay(`💥 Pop! Oh no! ${fn} broke free!`, trFoeTurn); });
    lines[lines.length - 1] += ' …Click!'; const nPre = lines.length;
    s.caught[foe.sp] = 1; foe.hp = Math.max(1, foe.hp); tr.session.nuts += 2;
    lines.push(`🧊 You caught <b>${fn}</b>! It’s safe inside the block ball.`);
    if (s.team.length < TR_TEAM_MAX) { s.team.push(foe); lines.push(`${fn} joined your team.`); } else { s.box.push(foe); lines.push(`Your team is full, so ${fn} went to your storage box. 📦`); }
    trSay(lines.slice(0, nPre), () => { if (tr.bt?.ball) tr.bt.ball.shut = tr.frame; trCry(foe.sp); trEndBattle(lines.slice(nPre), true); });
  });
}
function trEndBattle(lines, won, award) {
  if (won) trJingle('victory');
  const then = tr.bt?.t?.then, legend = tr.bt?.legend;
  if (legend && !won) { tr.legendGone ||= {}; }
  if (legend && won && !trS().caught[TR_MAPS[trS().map].npcs.find(n => n.id === legend)?.legend]) { (tr.legendGone ||= {})[legend] = 1; lines.push('The legendary Wordling flies off into the distance… It might come back if you leave and return.'); }
  const keepRio = tr.rivalShow; const finish = () => { tr.bt = null; tr.cool = 3; tr.np = {}; tr.rivalShow = won ? keepRio : null; trSaveNow(true); trBox(); trHud(); trMusicSync(); trLearnPending(() => { if (then) then(won); }); };
  trSay(lines, award ? () => { tr.bt = null; trShowBadge(award, finish, true); } : finish);
}
/* Big badge on the screen: when you win it, or when you look at it in the badge case */
function trShowBadge(n, then, fresh) {
  const bd = TR_BADGES[n - 1], s = trS();
  tr.award = { n, t0: tr.frame }; if (fresh) trJingle('victory');
  trSay(fresh ? [`🏅 You received the <b>${bd.name}</b> from ${esc(bd.leader)}!`, `${esc(bd.desc)} (${trSeals(s)}/${TR_BADGE_COUNT} Badges)`] : [`<b>${bd.name}</b>: ${esc(bd.desc)}`], () => { tr.award = null; then?.(); });
}

/* ---------- Music (see trmusic.js) ---------- */
const trMapSong = () => TR_MAPS[trS()?.map]?.song || 'town';
function trMusicSync() {
  if (typeof trMusic === 'undefined' || !tr || !trS()) return;
  if (trMusic.song?.once) return;
  const want = tr.bt ? (tr.bt.boss ? 'boss' : 'battle') : trMapSong();
  if (trMusic.name !== want || (!trMusic.song && trMusic.on())) trMusic.play(want);
}
function trBattleMusic() { if (typeof trMusic === 'undefined' || !trMusic.on()) return; trMusic.after = null; trMusic.song = null; trMusic.name = null; trMusicSync(); }
function trJingle(name) { if (typeof trMusic !== 'undefined' && trMusic.on()) trMusic.jingle(name, trMapSong()); }
function trWakeAudio() { if (typeof trMusic === 'undefined') return; const ac = trMusic.init(); if (ac?.state === 'suspended') ac.resume().catch(() => {}); }
function trSound(kind) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    window.audioCtx ||= new AC(); const ac = window.audioCtx, o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.type = 'square'; o.frequency.setValueAtTime(kind === 'hit' ? 520 : kind === 'hop' ? 300 : 180, t); o.frequency.exponentialRampToValueAtTime(kind === 'hit' ? 160 : kind === 'hop' ? 620 : 90, t + 0.15);
    g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.2);
  } catch {}
}

/* ---------- Drawing ---------- */
const TR_W = 160, TR_H = 144, TR_SCALE = 4;
function trDraw() {
  const cv = $('#trCanvas'); if (!cv || !tr) return;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.setTransform(TR_SCALE, 0, 0, TR_SCALE, 0, 0);
  if (tr.bt) trDrawBattle(g); else trDrawWorld(g);
  if (tr.award) {
    const k = Math.min(1, (tr.frame - tr.award.t0) / 25), size = Math.round(24 * (1 + 2.6 * k));
    g.fillStyle = TR_PAL[3]; g.globalAlpha = 0.75 * k; g.fillRect(0, 0, TR_W, TR_H); g.globalAlpha = 1;
    for (let i = 0; i < 8; i++) { const a = tr.frame / 30 + i * Math.PI / 4, r = 34 + 6 * Math.sin(tr.frame / 9 + i); g.fillStyle = TR_PAL[i % 2 ? 1 : 0]; g.fillRect(Math.round(80 + Math.cos(a) * r * k) - 1, Math.round(46 + Math.sin(a) * r * k) - 1, 3, 3); }
    g.drawImage(trBadgeArt(tr.award.n), Math.round(80 - size / 2), Math.round(46 - size / 2), size, size);
  }
  if (tr.peek && !tr.bt) {   // peeking inside a block ball
    const k = Math.min(1, (tr.frame - tr.peek.t0) / 18), size = Math.round(16 + 40 * k), bob = Math.round(Math.sin(tr.frame / 8) * 2 * k);
    g.fillStyle = TR_PAL[3]; g.globalAlpha = 0.7 * k; g.fillRect(0, 0, TR_W, TR_H); g.globalAlpha = 1;
    g.fillStyle = trIsFull() ? '#fff8d0' : TR_PAL[0]; g.globalAlpha = 0.85; g.beginPath(); g.arc(80, 42, 8 + 26 * k, 0, 7); g.fill(); g.globalAlpha = 1;
    for (let i = 0; i < 6; i++) { const a = tr.frame / 25 + i * Math.PI / 3, r = 36 * k; g.fillStyle = TR_PAL[i % 2 ? 1 : 0]; g.fillRect(Math.round(80 + Math.cos(a) * r) - 1, Math.round(42 + Math.sin(a) * r) - 1, 2, 2); }
    g.drawImage(trBlockArt(TR_SPECIES[tr.peek.sp].type, 1), 66, 66, 28, 28);
    g.drawImage(trMonArt(tr.peek.sp), Math.round(80 - size / 2), Math.round(42 - size / 2) + bob - Math.round(10 * (1 - k)), size, size);
  }
  if (tr.flash > 0) { g.fillStyle = tr.flash % 4 < 2 ? TR_PAL[3] : TR_PAL[0]; g.globalAlpha = tr.flash / 14; g.fillRect(0, 0, TR_W, TR_H); g.globalAlpha = 1; tr.flash--; }
}
function trDrawWorld(g) {
  const s = trS(), m = TR_MAPS[s.map], W = m.rows[0].length, H = m.rows.length;
  let px = s.x, py = s.y, step = 0;
  if (tr.moving) { const k = tr.moving.t; px = tr.moving.fx + (tr.moving.tx - tr.moving.fx) * k; py = tr.moving.fy + (tr.moving.ty - tr.moving.fy) * k; step = !tr.moving.hop && k > 0.25 && k < 0.75 ? 1 : 0; }
  const camX = W * 16 <= TR_W ? (W * 16 - TR_W) / 2 : Math.max(0, Math.min(W * 16 - TR_W, px * 16 - 72)), camY = H * 16 <= TR_H ? (H * 16 - TR_H) / 2 : Math.max(0, Math.min(H * 16 - TR_H, py * 16 - 64));
  g.fillStyle = TR_PAL[3]; g.fillRect(0, 0, TR_W, TR_H);
  const x0 = Math.max(0, Math.floor(camX / 16)), y0 = Math.max(0, Math.floor(camY / 16));
  for (let y = y0; y <= y0 + 10 && y < H; y++) for (let x = x0; x <= x0 + 11 && x < W; x++) g.drawImage(trTileArt(m.rows[y][x], m.theme), Math.round(x * 16 - camX), Math.round(y * 16 - camY));
  for (let y = y0; y <= y0 + 10 && y < H; y++) for (let x = x0; x <= x0 + 11 && x < W; x++) {
    if (m.rows[y][x] !== '=') continue;
    const sp = trTilePal('=', m.theme), wet = trIsFull() ? sp[1] : TR_PAL[1], foam = trIsFull() ? '#ffffff' : TR_PAL[0], X = Math.round(x * 16 - camX), Y = Math.round(y * 16 - camY), wave = Math.floor(tr.frame / 20 + x + y) % 2;
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      if (m.rows[y + dy]?.[x + dx] !== 'W') continue;
      const [rx, ry, rw, rh] = dy === -1 ? [0, 0, 16, 4] : dy === 1 ? [0, 12, 16, 4] : dx === -1 ? [0, 0, 4, 16] : [12, 0, 4, 16];
      g.fillStyle = wet; g.fillRect(X + rx, Y + ry, rw, rh); g.fillStyle = foam;
      const fx = dy ? X : X + (dx === -1 ? 0 : 15), fy = dx ? Y : Y + (dy === -1 ? 0 : 15);
      for (let i = wave; i < 16; i += 3) dy ? g.fillRect(fx + i, fy, 2, 1) : g.fillRect(fx, fy + i, 1, 2);
    }
  }
  if (m.center) trDrawStove(g, Math.round(8 * 16 - camX), Math.round(1 * 16 - camY), tr.machine && tr.machine.map === s.map ? tr.machine : null);
  for (const it of trItemsHere(s.map)) g.drawImage(trItemArt(), Math.round(it.x * 16 - camX), Math.round(it.y * 16 - camY + Math.sin(tr.frame / 12)));
  for (const n of trNpcs(s.map)) { const X = Math.round(n.x * 16 - camX), Y = Math.round(n.y * 16 - camY);
    if (n.legend) { const bob = Math.round(Math.sin(tr.frame / 10) * 2); if (tr.frame % 40 < 20) { g.fillStyle = trIsFull() ? '#fff3a0' : TR_PAL[0]; g.globalAlpha = 0.5; g.beginPath(); g.arc(X + 8, Y + 8, 9, 0, 7); g.fill(); g.globalAlpha = 1; } g.drawImage(trMonArt(n.legend), X - 2, Y - 6 + bob, 20, 20); continue; }
    g.drawImage(trPersonArt(trArchFor(n), n.dir, n.walk ? 1 : 0), X, Y - 2); }
  if (m.school) { const left = TR_STARTERS.filter(k => k !== s.flags.starter && k !== s.flags.rivalSp && !(k === s.flags.profSp && s.beaten.profFinal));
    TR_STARTERS.forEach((k, i) => { if (!left.includes(k) && s.flags.starter) return; const X = Math.round((4 + i) * 16 - camX), Y = Math.round(3 * 16 - camY); g.drawImage(trBlockArt(TR_SPECIES[k].type, tr.peek?.sp === k ? 1 : 0), X + 1, Y); }); }
  if (tr.profShow) g.drawImage(trPersonArt(tr.profShow.arch, tr.profShow.dir, tr.profShow.step || 0), Math.round(tr.profShow.x * 16 - camX), Math.round(tr.profShow.y * 16 - camY) - 2);
  if (tr.rivalShow) { const R = tr.rivalShow, X = Math.round(R.x * 16 - camX), Y = Math.round(R.y * 16 - camY); g.drawImage(trPersonArt('rival', R.dir, R.step || 0), X, Y - 2);
    if (R.bang) { g.fillStyle = TR_PAL[0]; g.fillRect(X + 4, Y - 14, 8, 11); g.fillStyle = TR_PAL[3]; g.fillRect(X + 7, Y - 12, 2, 5); g.fillRect(X + 7, Y - 6, 2, 2); } }
  const sx = Math.round(px * 16 - camX), sy = Math.round(py * 16 - camY), lift = tr.moving?.hop ? Math.round(Math.sin(tr.moving.t * Math.PI) * 9) : 0;
  if (lift) { g.fillStyle = TR_PAL[3]; g.globalAlpha = 0.35; g.beginPath(); g.ellipse(sx + 8, sy + 15, 6 - lift / 4, 2, 0, 0, 7); g.fill(); g.globalAlpha = 1; }
  g.drawImage(trPersonArt('player', s.dir, step, s.riding), sx, sy - 2 - lift);
  if (!tr.moving && trTile(s.map, s.x, s.y) === ',') g.drawImage(trTileArt(',', m.theme), 0, 9, 16, 7, sx, sy + 9, 16, 7);
  if (tr.banner && tr.frame < tr.banner.until && !tr.ui) {   // area name sign
    g.font = 'bold 8px monospace'; const w = Math.ceil(g.measureText(tr.banner.text).width) + 12;
    g.fillStyle = TR_PAL[3]; g.fillRect(4, 4, w, 15); g.fillStyle = TR_PAL[0]; g.fillRect(5, 5, w - 2, 13); g.fillStyle = TR_PAL[3]; g.textBaseline = 'top'; g.fillText(tr.banner.text, 10, 8);
  }
}
function trHpBar(g, x, y, w, m) {
  const f = Math.max(0, m.hp / trMaxHp(m));
  g.fillStyle = TR_PAL[3]; g.fillRect(x, y, w, 4); g.fillStyle = TR_PAL[0]; g.fillRect(x + 1, y + 1, w - 2, 2);
  g.fillStyle = trIsFull() ? (f > 0.5 ? '#3aa845' : f > 0.2 ? '#f4c542' : '#d0342c') : f > 0.5 ? TR_PAL[2] : f > 0.2 ? TR_PAL[1] : TR_PAL[3]; g.fillRect(x + 1, y + 1, Math.round((w - 2) * f), 2);
}
function trDrawBattle(g) {
  const b = tr.bt, me = trCurMe(), foe = trCurFoe(), t = tr.frame;
  g.fillStyle = TR_PAL[0]; g.fillRect(0, 0, TR_W, TR_H);
  for (let y = 0; y < 30; y += 6) { g.fillStyle = TR_PAL[1]; g.fillRect(0, y, TR_W, 1); }
  g.fillStyle = TR_PAL[1]; g.beginPath(); g.ellipse(118, 58, 32, 7, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(42, 122, 36, 8, 0, 0, 7); g.fill();
  const bob = Math.round(Math.sin(t / 14));
  const ball = b.ball, bk = ball ? Math.min(1, (t - ball.t0) / 16) : 0;
  if (ball && bk < 1) {   // flying in an arc toward the wild Wordling, which shrinks into it near the end
    if (bk < 0.75) g.drawImage(trMonArt(foe.sp, false), 94, 6 + bob, 48, 48);
    else { const sh = 48 * (1 - (bk - 0.75) * 4); g.globalAlpha = 0.6; g.drawImage(trMonArt(foe.sp, false), Math.round(118 - sh / 2), Math.round(30 - sh / 2), Math.round(sh), Math.round(sh)); g.globalAlpha = 1; }
    g.drawImage(trBlockArt(ball.kind), Math.round(30 + (112 - 30) * bk), Math.round(84 - 70 * Math.sin(bk * Math.PI * 0.9) + (44 - 84) * bk * 0.2), 14, 14);
  } else if (ball) {   // sitting on the ground: wiggles until it clicks shut
    const wig = ball.shut ? 0 : Math.sin(t / 3) * (Math.floor(t / 24) % 2 ? 0.35 : 0);
    g.save(); g.translate(119, 52); g.rotate(wig); g.drawImage(trBlockArt(ball.kind), -10, -18, 20, 20); g.restore();
    if (ball.shut) for (let i = 0; i < 3; i++) { const a = t / 10 + i * 2.1, r = 14 + Math.sin(t / 6) * 2; g.fillStyle = TR_PAL[i % 2 ? 2 : 1]; g.fillRect(Math.round(119 + Math.cos(a) * r), Math.round(42 + Math.sin(a) * r * 0.6), 2, 2); }
  } else if (!(b.flashFoe > 0 && b.flashFoe % 4 < 2) && foe.hp > 0) g.drawImage(trMonArt(foe.sp, false), 94, 6 + bob, 48, 48);
  if (!(b.flashMe > 0 && b.flashMe % 4 < 2) && me.hp > 0) g.drawImage(trMonArt(me.sp, true), 12, 66 - bob, 60, 60);
  if (b.flashFoe > 0) b.flashFoe--; if (b.flashMe > 0) b.flashMe--;
  g.font = 'bold 7px monospace'; g.textBaseline = 'top';
  const box = (x, y, w, h) => { g.fillStyle = TR_PAL[3]; g.fillRect(x, y, w, h); g.fillStyle = TR_PAL[0]; g.fillRect(x + 1, y + 1, w - 2, h - 2); };
  box(4, 6, 78, 26); g.fillStyle = TR_PAL[3];
  g.fillText(TR_SPECIES[foe.sp].name, 8, 9); g.fillText(`Lv${foe.lv} ${TR_TYPES[TR_SPECIES[foe.sp].type].name}`, 8, 17); trHpBar(g, 8, 26, 70, foe);
  if (!b.wild) for (let i = 0; i < b.foes.length; i++) { g.fillStyle = b.foes[i].hp > 0 ? TR_PAL[2] : TR_PAL[1]; g.fillRect(70 - (b.foes.length - 1 - i) * 5, 10, 3, 3); }
  box(80, 98, 76, 34); g.fillStyle = TR_PAL[3];
  g.fillText(TR_SPECIES[me.sp].name, 84, 101); g.fillText(`Lv${me.lv}  ${me.hp}/${trMaxHp(me)}`, 84, 109); trHpBar(g, 84, 118, 68, me);
  g.fillStyle = TR_PAL[2]; g.fillRect(84, 124, 68, 2); g.fillStyle = TR_PAL[3]; g.fillRect(84, 124, Math.round(68 * Math.min(1, me.xp / trNeed(me.lv))), 2);
}
/* safety net: if anyone ever ends up on the player's square (after a battle, a door or a sync), they step aside */
function trUnoverlap() {
  const s = trS(); if (!s || tr.moving) return;
  const m = TR_MAPS[s.map], H = m.rows.length, W = m.rows[0].length;
  for (const n of trNpcs(s.map)) {
    if (n.x !== s.x || n.y !== s.y) continue;
    const spot = [[0, 1], [1, 0], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [0, 2], [2, 0], [-2, 0], [0, -2]].map(([dx, dy]) => [n.x + dx, n.y + dy]).find(([x, y]) => x > 0 && y > 0 && x < W - 1 && y < H - 1 && trCanWalk(s.map, x, y) && !m.doors?.[`${x},${y - 1}`]);
    if (spot) { const key = `${s.map}:${n.id}`; tr.np[key] = { ...(tr.np[key] || {}), x: spot[0], y: spot[1], dir: n.dir }; }
  }
}
function trWander() {   // some townspeople stroll around
  const s = trS();
  for (const n of TR_MAPS[s.map].npcs) {
    if (!n.wander || !trNpcHere(n, s) || Math.random() > 0.35) continue;
    const key = `${s.map}:${n.id}`, cur = tr.np[key] || { x: n.x, y: n.y, dir: n.dir }, dirs = Object.keys(TR_DIRS), d = dirs[Math.floor(Math.random() * 4)], [dx, dy] = TR_DIRS[d];
    const nx = cur.x + dx, ny = cur.y + dy;
    if (Math.abs(nx - n.x) > n.wander || Math.abs(ny - n.y) > n.wander) { tr.np[key] = { ...cur, dir: d }; continue; }
    const blockedByMover = tr.moving && tr.moving.tx === nx && tr.moving.ty === ny;
    if (TR_WALKABLE.has(trTile(s.map, nx, ny)) && !trNpcAt(s.map, nx, ny) && !trItemAt(s.map, nx, ny) && !(s.x === nx && s.y === ny) && !blockedByMover && !TR_MAPS[s.map].doors?.[`${nx},${ny - 1}`] && ny > 0 && ny < TR_MAPS[s.map].rows.length - 1) tr.np[key] = { x: nx, y: ny, dir: d };
    else tr.np[key] = { ...cur, dir: d };
  }
}
function trFrame() {
  if (!tr || view.name !== 'trails' || !document.body.contains($('#trCanvas'))) { if (tr) { tr.loop = 0; if (view.name !== 'trails') trFinish(); } return; }
  tr.frame++;
  if (tr.frame % 10 === 0) trMusicSync();
  if (tr.frame % 70 === 0 && !tr.ui && !tr.bt) trWander();
  if (tr.moving) { tr.moving.t += tr.moving.hop ? (trS().riding ? 1 / 9 : 1 / 15) : trS().riding ? 1 / 4.5 : 1 / 9; if (tr.moving.t >= 1) { const s = trS(); s.x = tr.moving.tx; s.y = tr.moving.ty; tr.moving = null; trArrive(); trHud(); } }
  else trStep();
  if (tr.frame % 6 === 0 && !tr.bt) trUnoverlap();
  trDraw();
  tr.loop = requestAnimationFrame(trFrame);
}
function trInit() {
  if (!tr || !trS()) return;
  const cv = $('#trCanvas'); if (!cv) return;
  cv.width = TR_W * TR_SCALE; cv.height = TR_H * TR_SCALE;
  (trS().mapSeen ||= {})[trS().map] = 1;
  trApplyPalette();
  if (!tr.checkedStuck) { tr.checkedStuck = true; const s0 = trS(); if (!TR_WALKABLE.has(trTile(s0.map, s0.x, s0.y)) || (!TR_MAPS[s0.map].indoor && !trSafeSpotNear(s0))) setTimeout(() => trUnstick(false), 400); }
  trBox(); trHud(); trDraw(); trMusicSync(); trApplyPad();
  const wrap = $('.tr-wrap'); if (wrap) wrap.addEventListener('pointerdown', trWakeAudio);
  if (!tr.loop) tr.loop = requestAnimationFrame(trFrame);
  document.querySelectorAll('[data-trdir]').forEach(b => {
    const on = e => { e.preventDefault(); if (tr.ui?.type === 'menu') trMenuMove(b.dataset.trdir); else if (tr.ui?.type === 'map') { if (/left|right/.test(b.dataset.trdir)) trMapOpen(tr.ui.view === 'world' ? 'area' : 'world'); } else tr.held = b.dataset.trdir; }, off = e => { e.preventDefault(); if (tr.held === b.dataset.trdir) tr.held = null; };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
  });
}
function trMenuMove(dir) {
  const u = tr.ui; if (u?.type !== 'menu') return;
  const n = u.items.length, cols = n <= 4 ? 2 : 1;
  const d = dir === 'up' ? -cols : dir === 'down' ? cols : dir === 'left' ? -1 : 1;
  let i = u.sel; for (let t = 0; t < n; t++) { i = (i + d + n * 4) % n; if (!u.items[i].disabled) break; }
  u.sel = i; trBox();
}
function trFinish() {
  if (!tr || tr.ended) return; tr.ended = true; gameMapClose();
  if (typeof trMusic !== 'undefined') { trMusic.stop(); trMusic.name = null; }
  if (tr.loop) cancelAnimationFrame(tr.loop); tr.loop = 0;
  const s = trS(); if (s) { s.playMs += Date.now() - (tr.tick || Date.now()); tr.tick = Date.now(); s.savedAt = Date.now(); }
  const r = tr.session.results, right = r.filter(x => x.ok).length, real = Math.min(25, tr.session.nuts);
  if (real && typeof rw === 'function') rw().peanuts += real;
  if (r.length && typeof addHistory === 'function') addHistory({ type: 'trails', deckId: tr.deckId, deckName: tr.d?.name, correct: right, total: r.length,
    score: Math.round(right / r.length * 100), timeMs: Date.now() - tr.session.start, detail: `${tr.session.wins} battle${tr.session.wins === 1 ? '' : 's'} won${real ? ` · 🥜 ${real}` : ''}`, items: r });
  else save();
  if (r.length || real) toast(`Saved! ${r.length ? `${right}/${r.length} answers right` : ''}${real ? ` · +${real} 🥜` : ''}`);
}

/* ---------- Keys ---------- */
document.addEventListener('keydown', e => {
  if (view.name !== 'trails' || !tr || $('#dlg')?.open || e.ctrlKey || e.metaKey || e.altKey) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  trWakeAudio();
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key, u = tr.ui;
  if (u?.type === 'rebind') {
    e.preventDefault(); if (key === 'Escape') { tr.ui = null; return trControlsMenu(); }
    const ks = trKeys(); for (const [act] of TR_ACTIONS) if (act !== u.act) ks[act] = (ks[act] || []).filter(k => k !== key);
    ks[u.act] = [key, ...(['up', 'down', 'left', 'right'].includes(u.act) ? (TR_DEFAULT_KEYS[u.act].filter(k => k.startsWith('Arrow'))) : [])].filter((k, i, a) => a.indexOf(k) === i);
    S.settings.trKeys = ks; save(); tr.ui = null; return trSay(`${esc(u.label)} is now <b>${esc(trKeyName(key))}</b>.`, trControlsMenu);
  }
  if (u?.type === 'question') { if (/^[1-4]$/.test(key)) { e.preventDefault(); trAnswer(+key - 1); } return; }
  const act = trActionFor(key); if (!act) return;
  e.preventDefault();
  if (['up', 'down', 'left', 'right'].includes(act)) { if (u?.type === 'menu') return trMenuMove(act); if (u?.type === 'map') { if (act === 'left' || act === 'right') trMapOpen(u.view === 'world' ? 'area' : 'world'); return; } if (!u) tr.held = act; return; }
  if (e.repeat) return;
  if (act === 'a') trA(); else if (act === 'b') trB();
  else if (act === 'menu' && !u && !tr.bt) trMainMenu();
  else if (act === 'scoot') trToggleScooter();
  else if (act === 'music') actions.trMusicToggle();
});
document.addEventListener('keyup', e => { if (!tr) return; const key = e.key.length === 1 ? e.key.toLowerCase() : e.key, act = trActionFor(key); if (act && act === tr.held) tr.held = null; });
window.addEventListener('blur', () => { if (tr) tr.held = null; });

/* ---------- Screens ---------- */
let trNewDraft = { starter: 'quillip', slot: 'a' };
const trFmtTime = ms => { const m = Math.round(ms / 60000); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };
views.trailsTitle = () => {
  trApplyPalette();
  const d = deckById(view.deckId); if (!d) { view = { name: 'home' }; return views.home(); }
  const slots = trSlots(), me = typeof currentProfile === 'function' ? currentProfile() : null, starters = ['quillip', 'mossling', 'petalwisp'];
  Object.values(slots).forEach(trFix);
  const card = k => { const s = slots[k];
    return `<div class="tr-slot ${S.trailsSlot === k ? 'cur' : ''}"><div class="tr-slot-h"><b>Slot ${k.toUpperCase()}</b>${s ? `<span class="muted small">${s.savedAt ? 'saved ' + esc(new Date(s.savedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })) : ''}</span>` : ''}</div>
      ${s ? `<div><b>${esc(s.name)}</b> · 📍 ${esc(TR_MAPS[s.map]?.name || '')}</div><div class="muted small"><span class="tr-badges">${trBadgeRow(s, 16)}</span> · ${Object.keys(s.caught).length} caught · 🪙 ${s.coins} · ⏱ ${trFmtTime(s.playMs)}${s.done ? ' · 🌟 Finished' : ''}</div>
        <div class="row" style="gap:2px">${s.team.map(m => `<span title="${esc(TR_SPECIES[m.sp].name)} Lv ${m.lv}">${trMonImg(m.sp, 34, true)}</span>`).join('')}</div>
        <div class="row" style="gap:6px"><button type="button" class="btn primary" data-act="trContinue" data-slot="${k}" data-id="${d.id}">▶ Continue</button><button type="button" class="btn sm ghost" style="color:var(--again)" data-act="trDelSlot" data-slot="${k}">Delete</button></div>`
      : `<div class="muted small">Empty</div><button type="button" class="btn" data-act="trNewSlot" data-slot="${k}">＋ New adventure here</button>`}</div>`; };
  return `<div class="crumbs"><a data-act="home">Decks</a> / <a data-act="openDeck" data-id="${d.id}">${esc(d.name)}</a> / <a data-act="games" data-id="${d.id}">Games</a> / Wordling Trails</div>
    <h2 style="margin-bottom:6px">🌿 Wordling Trails</h2>
    <p class="muted" style="margin:0 0 14px">Explore nine towns, battle and catch Wordlings by answering cards from “${esc(d.name)}”, earn eight Hall Badges and stop the Hush Syndicate from locking up every word!</p>
    <div class="tr-slots">${['a', 'b', 'c'].map(card).join('')}</div>
    <form class="panel stack" id="trNewForm" style="margin-top:14px" ${view.trNew ? '' : 'hidden'}>
      <h3 style="margin:0">New adventure in slot ${(view.trNew || 'a').toUpperCase()}</h3>
      <input type="hidden" name="slot" value="${esc(view.trNew || 'a')}">
      <label class="field">Your explorer’s name<input name="name" maxlength="14" value="${esc(me?.name || 'Explorer')}"></label>
      <p class="muted small" style="margin:0">You start at home. Mom will send you to Professor Rowan, who lets you and your friend Rio pick your first Wordlings.</p>
      <div class="row-between"><span class="muted small">Your game saves by itself, and with 💾 Save game in the menu. Change the keys in the menu under ⌨️ Controls.</span>
        <button type="submit" class="btn primary big">Begin! 🌿</button></div>
    </form>`;
};
views.trails = () => {
  if (!tr || !trS()) { view = { name: 'home' }; return views.home(); }
  return `<div class="study-top">
      <button type="button" class="btn ghost" data-act="trLeave">← Save &amp; leave</button>
      <div class="prompt-label muted">🌿 Wordling Trails · ${esc(tr.d?.name || '')}</div>
      <div class="row" style="gap:6px"><button type="button" class="btn sm" id="trMusicBtn" data-act="trMusicToggle" title="Turn the music on or off">${S.settings?.trMusic !== false ? '🔊 Music' : '🔇 Music'}</button><button type="button" class="btn sm" data-act="trMenuBtn">☰ Menu</button></div>
    </div>
    <div class="tr-wrap">
      <div ${trShellAttrs()}>
        <div class="tr-bezel">
          <div class="tr-bezel-top"><span>WORDLING TRAILS · WORD-MATRIX SOUND</span></div>
          <div class="tr-bezel-row">
            <div class="tr-led" aria-hidden="true"><i></i><span>POWER</span></div>
            <div class="tr-screen-wrap">
              <canvas id="trCanvas" class="tr-screen" aria-label="Game screen"></canvas>
              <div id="trBox" class="tr-box" aria-live="polite"></div>
            </div>
          </div>
        </div>
        <div class="tr-brand" aria-hidden="true"><b>Estudiamos</b> <span>POCKET</span></div>
        <div class="tr-pad" aria-label="Game buttons">
          <div class="tr-dpad">
            <button type="button" data-trdir="up" aria-label="Up"></button><button type="button" data-trdir="left" aria-label="Left"></button>
            <i class="tr-dpad-mid" aria-hidden="true"></i>
            <button type="button" data-trdir="right" aria-label="Right"></button><button type="button" data-trdir="down" aria-label="Down"></button>
          </div>
          <div class="tr-ab">
            <div><button type="button" class="tr-bbtn" data-act="trB" aria-label="B button"></button><span>B</span></div>
            <div><button type="button" class="tr-abtn" data-act="trA" aria-label="A button"></button><span>A</span></div>
          </div>
          <div class="tr-mid">
            <div><button type="button" class="tr-small" data-act="trScoot" aria-label="Scooter"></button><span>SCOOTER</span></div>
            <div><button type="button" class="tr-small" data-act="trMenuBtn" aria-label="Menu"></button><span>MENU</span></div>
          </div>
          <div class="tr-speaker" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
        </div>
      </div>
      <p class="muted small tr-keys">${(() => { const k = trKeys(), f = a => k[a].map(trKeyName).join('/'); return `Move ${f('up')} ${f('left')} ${f('down')} ${f('right')} · A ${f('a')} · B ${f('b')} · Menu ${f('menu')} · Scooter ${f('scoot')} · 1–4 answer`; })()}</p>
    </div>`;
};
document.addEventListener('submit', e => {
  if (e.target.id !== 'trNewForm') return;
  e.preventDefault(); trWakeAudio();
  const f = e.target, name = f.name.value.trim(), slot = f.slot.value;
  const begin = () => { trNewSave(slot, name); startTrails(view.deckId);
    setTimeout(() => trSay([`Mom: Good morning, ${esc(trS().name)}! Today’s the big day! 🌿`, 'Mom: Professor Rowan asked to see you and Rio at the Inkwell School. It’s on the east side of town.', 'Mom: He’s going to give you each your very first Wordling!', 'Talk and read signs with A. Open your menu with B. Your game saves by itself.']), 300); };
  if (trSlots()[slot]) confirmDlg(`Replace slot ${slot.toUpperCase()}?`, 'The adventure saved in this slot will be replaced.', 'Replace', begin); else begin();
});
Object.assign(actions, {
  trMapView: el => { if (tr?.ui?.type === 'map') trMapOpen(el.dataset.v); },
  trContinue: el => { trWakeAudio(); S.trailsSlot = el.dataset.slot; startTrails(el.dataset.id); },
  trNewSlot: el => { view.trNew = el.dataset.slot; render(); setTimeout(() => $('#trNewForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); },
  trDelSlot: el => confirmDlg(`Delete slot ${el.dataset.slot.toUpperCase()}?`, 'This adventure will be deleted for good.', 'Delete', () => { delete trSlots()[el.dataset.slot]; save(); render(); }),
  trMusicToggle: () => { S.settings.trMusic = !(S.settings.trMusic !== false); save(); if (S.settings.trMusic) { trWakeAudio(); trMusic.name = null; trMusicSync(); } else trMusic.stop();
    const b = $('#trMusicBtn'); if (b) b.textContent = S.settings.trMusic ? '🔊 Music' : '🔇 Music'; toast(S.settings.trMusic ? 'Music on 🎵' : 'Music off'); },
  trLeave: () => trQuit(),
  trMenuBtn: () => { if (!tr) return; if (!tr.ui && !tr.bt) trMainMenu(); else if (tr.ui?.type === 'menu' && !tr.bt) { tr.ui = null; trBox(); } },
  trScoot: () => tr && trToggleScooter(),
  trA: () => tr && trA(),
  trB: () => tr && trB(),
  trPick: el => { const u = tr?.ui; if (u?.type !== 'menu') return; u.sel = +el.dataset.i; trA(); },
  trAns: el => trAnswer(+el.dataset.i),
});
