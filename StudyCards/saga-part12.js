'use strict';
/* ================= Lexicon Saga, part twelve: 🥚 secrets to find =================
   Little nods to classic game habits, all our own. Each one is found by doing something curious; the Quest log counts them
   (🥚 Secrets found: 3 of 8) without saying what they are.
   1. 🌟 The old cheat code: ↑ ↑ ↓ ↓ ← → ← → B A, anywhere in the game → a golden handheld and a bag of gold.
   2. 🗺️ A wall in Quillhaven that isn't a wall: push on it (A) → the Mapmaker's hidden room.
   3. 💬 Talk to the same person ten times in a row → they finally crack.
   4. 💤 Leave the game alone for a minute and a half → the hero dozes off.
   5. 🌀 Spin on the spot (turn all the way round three times without stepping) → dizzy!
   6. 🎵 Press MUSIC seven times quickly → a sound test with every song in the game.
   7. 🌊 Sail to the very top-left corner of the world map → the edge of the world.
   8. 🦉 Name your hero after the app's owl (Ollie) → someone recognizes you. */
const SG_EGGS = [
  ['code', '🌟 The old cheat code'], ['room', '🗺️ The Mapmaker’s hidden room'], ['chatter', '💬 Ten times in a row'], ['nap', '💤 Forty winks'],
  ['dizzy', '🌀 Round and round'], ['sound', '🎵 Sound test'], ['edge', '🌊 The edge of the world'], ['name', '🦉 A familiar name'],
];
const sgEggs = (s = sgS()) => (s.eggs ||= {});
function sgEgg(id, lines = [], gold = 100) {
  const s = sgS(); if (!s || sgEggs(s)[id]) return false;
  sgEggs(s)[id] = 1; s.gold += gold;
  const n = Object.keys(sgEggs(s)).filter(k => SG_EGGS.some(e => e[0] === k)).length, e = SG_EGGS.find(x => x[0] === id);
  sgJingle('sg_fanfare'); sg.flash = 10; sgSaveNow(true);
  sgSay([...lines, `🥚 <b>Secret found: ${e ? e[1] : id}</b> (${n} of ${SG_EGGS.length})`, ...(gold ? [`💰 +${gold} gold`] : [])]);
  return true;
}

/* ---------- every button press, for the codes ---------- */
const SG_CODE = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
function sgEggInput(act) {
  if (!sg || view.name !== 'saga') return;
  sg.lastInput = performance.now();
  (sg.eggKeys ||= []).push(act); if (sg.eggKeys.length > 12) sg.eggKeys.shift();
  if (sg.eggKeys.slice(-10).join() === SG_CODE.join()) { sg.eggKeys = []; setTimeout(() => sgEggCode(), 60); }
}
document.addEventListener('keydown', e => {
  if (view.name !== 'saga' || !sg || e.repeat || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key, act = typeof trActionFor === 'function' ? trActionFor(key) : null;
  if (act) sgEggInput(act); else sg.lastInput = performance.now();
}, true);
document.addEventListener('pointerdown', e => {
  if (view.name !== 'saga' || !sg) return;
  const d = e.target.closest?.('[data-sgdir]'), a = e.target.closest?.('[data-act="sgA"],[data-act="sgB"],[data-act="sgMusicToggle"]');
  if (d) sgEggInput(d.dataset.sgdir); else if (a) sgEggInput(a.dataset.act === 'sgA' ? 'a' : a.dataset.act === 'sgB' ? 'b' : 'music'); else sg.lastInput = performance.now();
}, true);
function sgEggCode() {
  const s = sgS(); sg.ui = null;
  if (!S.settings.sgGold) { S.settings.sgGold = true; save(); sgGoldShell(); }
  if (!sgEgg('code', ['🌟 Somewhere, a very old game smiles.', '✨ Your handheld turns <b>gold</b>! Pick it any time: menu → ⚙️ Options → 🎨 Console color.'], 777))
    sgSay('🌟 The code still works. Old habits die hard!');
  S.settings.trShell = 'gold'; save(); if (typeof trApplyShell === 'function') trApplyShell();
}
function sgGoldShell() { if (S.settings.sgGold && !TR_SHELLS.some(([k]) => k === 'gold')) TR_SHELLS.push(['gold', '🌟 Golden (secret)']); }
sgGoldShell();

/* ---------- 🎵 MUSIC seven times quickly: the sound test ---------- */
{ const base = actions.sgMusicToggle; actions.sgMusicToggle = function () {
  const out = base.apply(this, arguments);
  if (sg) { const now = performance.now(); sg.musicTaps = (sg.musicTaps || []).filter(t => now - t < 5000); sg.musicTaps.push(now);
    if (sg.musicTaps.length >= 7) { sg.musicTaps = []; setTimeout(() => sgSoundTest(true), 80); } }
  return out;
}; }
function sgSoundTest(first) {
  if (S.settings.trMusic === false) { S.settings.trMusic = true; save(); }
  trWakeAudio?.();
  const songs = Object.keys(TRM_SONGS).filter(k => k.startsWith('sg_')).sort();
  const nice = k => k.replace(/^sg_/, '').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
  const show = () => sgMenu(`🎵 <b>SOUND TEST</b> · ${songs.length} songs<br><small>Pick a song to hear it. B to stop.</small>`,
    songs.map(k => ({ label: `${sg.soundTest === k ? '▶️' : '🎼'} ${nice(k)}`, fn: () => { sg.soundTest = k; trMusic.name = null; trMusic.play(k); show(); } })),
    () => { sg.soundTest = null; trMusic.name = null; sgMusicSync(); }, { big: true, sel: Math.max(0, songs.indexOf(sg.soundTest)) });
  if (first && !sgEggs()['sound']) { sgEgg('sound', ['🎵 Tap, tap, tap… a hidden menu pops up!'], 100); const u = sg.ui; if (u?.type === 'text') { const t = u.then; u.then = () => { t?.(); show(); }; return; } }
  show();
}
{ const base = sgMusicSync; sgMusicSync = function () { if (sg?.soundTest) return; return base.apply(this, arguments); }; }

/* ---------- 🗺️ the Mapmaker's hidden room, behind a wall in Quillhaven ---------- */
const SG_SECRET_DOOR = (() => {   // a wall or tree near the bottom-left of town, right next to a path you can walk on
  const m = SG_MAPS.town; if (!m) return null; const H = m.rows.length, W = m.rows[0].length;
  for (let y = H - 2; y > 1; y--) for (let x = 1; x < W - 1; x++) {
    const c = m.rows[y][x]; if (SG_WALK.has(c) || m.doors?.[x + ',' + y] || m.warps?.[x + ',' + y]) continue;
    if (SG_WALK.has(m.rows[y][x + 1] || '') && !m.objs?.some(o => o.x === x + 1 && o.y === y) && !(m.npcs || []).some(n => n.x === x + 1 && n.y === y)) return { x, y };
  }
  return null;
})();
SG_MAPS.secretroom = { name: 'The Mapmaker’s room', song: 'sg_camp', inside: true, theme: 'field', objs: [],
  rows: ['1111111111', '1922222961', '1223333221', '1223333221', '1222222221', '1111221111'],
  exitTo: SG_SECRET_DOOR ? { map: 'town', x: SG_SECRET_DOOR.x + 1, y: SG_SECRET_DOOR.y, dir: 'right' } : { map: 'town', x: 9, y: 9, dir: 'down' }, entry: { x: 4, y: 4 },
  npcs: [{ id: 'mapmaker', x: 5, y: 2, dir: 'down', look: 'elder', name: 'The Mapmaker', lines: [
    'The Mapmaker: Oh! Nobody has found this door in years.', 'The Mapmaker: I drew every map in this land. I always leave a secret room for curious people like you.',
    'The Mapmaker: Take what’s in the chest. And keep pushing on walls, wherever you go. You never know!'] }] };
{ const base = sgInteractMore; sgInteractMore = function (fx, fy) {
  const s = sgS();
  if (s.map === 'town' && SG_SECRET_DOOR && fx === SG_SECRET_DOOR.x && fy === SG_SECRET_DOOR.y) {
    sgSay(['You push on the wall… it creaks… and swings open! 😮'], () => { sgWarp('secretroom', 4, 4, 'up'); setTimeout(() => sgEgg('room', ['🗺️ A tiny room full of maps and ink. Someone has been expecting you.'], 150), 400); });
    return true;
  }
  if (s.map === 'secretroom') {
    const t = sgTile(s.map, fx, fy);
    if (t === '6') { if (s.got.mapmakerChest) sgSay('The chest is empty now. The Mapmaker winks at you.'); else { s.got.mapmakerChest = 1; s.gold += 500; s.bag.phoenix = (s.bag.phoenix || 0) + 1; sgJingle('sg_fanfare'); sgSaveNow(true); sgSay(['📦 You open the Mapmaker’s chest!', '💰 500 gold and 🔥 an Ember down!']); } return true; }
    if (t === '9') { sgSay('🪴 A very well-watered plant. The Mapmaker talks to it.'); return true; }
  }
  return base(fx, fy);
}; }

/* ---------- 💬 the same person, ten times in a row ---------- */
{ const base = sgTalkFirst; sgTalkFirst = function (n) {
  const key = sgS().map + ':' + n.id;
  sg.talkRun = sg.talkRun?.key === key ? { key, n: sg.talkRun.n + 1 } : { key, n: 1 };
  if (sg.talkRun.n === 10) { const who = n.name || 'They'; sgEgg('chatter', [`${esc(who)}: …`, `${esc(who)}: Okay, okay! You win. I have nothing else to say. Here, take this and let me get back to work!`], 120); sg.talkRun = null; return true; }
  return base.apply(this, arguments);
}; }

/* ---------- 💤 a nap, 🌀 a spin, 🌊 the edge of the world, 🦉 a familiar name ---------- */
{ const base = sgFrame; sgFrame = function () {
  try {
    if (sg && sgS() && view.name === 'saga') {
      const s = sgS(), now = performance.now(); sg.lastInput ||= now;
      if (!sg.ui && !sg.bt && !sg.moving && !document.hidden && now - sg.lastInput > 90000 && !sgEggs(s).nap) { sg.lastInput = now; sgEgg('nap', ['💤 Zzz… Your hero sits down for a little rest…', '💤 …and wakes up with a start. How long was that?'], 60); }
      // turning on the spot: count turns while standing still
      if (!sg.moving && !sg.ui) {
        const at = s.map + ':' + s.x + ',' + s.y;
        if (sg.spinAt !== at) { sg.spinAt = at; sg.spinDir = s.dir; sg.spinTurns = 0; sg.spinWay = 0; }
        else if (sg.spinDir !== s.dir) {
          const order = ['up', 'right', 'down', 'left'], d = (order.indexOf(s.dir) - order.indexOf(sg.spinDir) + 4) % 4, way = d === 1 ? 1 : d === 3 ? -1 : 0;
          sg.spinTurns = way && (way === sg.spinWay || !sg.spinWay) ? sg.spinTurns + 1 : 0; sg.spinWay = way; sg.spinDir = s.dir;
          if (sg.spinTurns >= 12 && !sgEggs(s).dizzy) { sg.spinTurns = 0; sg.held = null; sg.shake = 12; sgEgg('dizzy', ['🌀 You spin, and spin, and spin…', '😵‍💫 Whoa. The whole world is spinning. Better sit down for a second.'], 80); }
        }
      }
      if (!sg.ui && !sg.bt && s.map === 'sea_0_0' && s.x <= 3 && s.y <= 3 && !sgEggs(s).edge) sgEgg('edge', ['🌊 The sea just… stops. A sign floats in the water:', '📜 “End of the map. Please turn around.” Someone has signed it: the Mapmaker.'], 200);
      if (!sg.ui && !sg.bt && !sgEggs(s).name && /^ollie$/i.test(String(s.name || '').trim())) sgEgg('name', ['🦉 A passing traveler stops and stares at you.', '“Ollie? Like the wise old owl in the study app? Hoo! What a great name!”'], 50);
    }
  } catch (e) { console.error(e); }
  return base.apply(this, arguments);
}; }

/* ---------- 🥚 the quest log counts them ---------- */
{ const base = sgQuestLog; sgQuestLog = function (sel) {
  base.apply(this, arguments);
  const u = sg.ui; if (!u || u.type !== 'menu') return;
  const found = SG_EGGS.filter(([k]) => sgEggs()[k]);
  u.items.push({ label: `🥚 Secrets found: ${found.length} of ${SG_EGGS.length}`, sub: found.length ? found.map(e => e[1]).join(' · ') : 'This world hides a few secrets. Be curious!', fn: () => sgEggList() });
  sgBox();
}; }
function sgEggList() {
  sgMenu(`🥚 Secrets · ${SG_EGGS.filter(([k]) => sgEggs()[k]).length} of ${SG_EGGS.length} found`, SG_EGGS.map(([k, label]) => ({ label: sgEggs()[k] ? `✅ ${label}` : '❔ ???', sub: sgEggs()[k] ? '' : 'Still hidden.', disabled: !sgEggs()[k], fn: () => sgEggList() })),
    () => sgQuestLog(), { big: true });
}
{ const base = sgFixMore; sgFixMore = function (s) { base(s); s.eggs ||= {}; if (s.map === 'secretroom' && !SG_MAPS.secretroom) Object.assign(s, { map: 'town', x: 9, y: 9, dir: 'down' }); }; }
