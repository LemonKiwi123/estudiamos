'use strict';
/* ================= Lexicon Saga, part ten: your tent, bags and spoken attacks =================
   1. ⛺ Your own tent at every campsite (the blue one with the flag). Inside: a bed, a lantern, a table with your journal,
      a plant from home and a chest where you can store items and equipment.
   2. 🎒 You can only carry so much. Items (herbs, potions, treasures…) and spare equipment (gear you aren't wearing) each
      have a limit, set by your bag. Bigger bags are sold in item shops as the story goes on; the last one, the Bag of
      holding, has no limit at all. If a find or a reward doesn't fit, it goes straight to the chest in your tent.
   3. 🎤 Spoken attacks (Options): attack and cast every spell by saying the word out loud, with a volume meter and up to
      25 seconds to speak. */

/* ---------- 🎒 Bags ---------- */
const SG_BAGS = [
  { name: 'Small pouch', icon: '👝', items: 20, gear: 6, price: 0, stage: 0 },
  { name: 'Satchel', icon: '👜', items: 30, gear: 10, price: 250, stage: 0 },
  { name: 'Traveler’s pack', icon: '🎒', items: 45, gear: 16, price: 900, stage: 4 },
  { name: 'Explorer’s rucksack', icon: '🎒', items: 70, gear: 24, price: 3000, stage: 9 },
  { name: 'Bag of holding', icon: '✨', items: Infinity, gear: Infinity, price: 12000, stage: 13 },
];
const sgBag = (s = sgS()) => SG_BAGS[Math.min(SG_BAGS.length - 1, s.bagLv || 0)];
function sgCarried(s = sgS()) {
  let items = 0, gear = 0;
  for (const [k, n] of Object.entries(s.bag || {})) if (n > 0 && SG_ITEMS[k]) items += n;
  for (const [k, n] of Object.entries(s.gearBag || {})) if (n > 0 && SG_GEAR[k]) gear += n;
  return { items, gear };
}
const sgCapText = n => n === Infinity ? '∞' : n;
function sgBagLine(s = sgS()) { const b = sgBag(s), c = sgCarried(s); return `${b.icon} ${b.name}: 🧪 ${c.items}/${sgCapText(b.items)} items · ⚔️ ${c.gear}/${sgCapText(b.gear)} gear`; }
const sgStash = (s = sgS()) => (s.stash ||= { bag: {}, gear: {} });

/* anything over the limit (a chest, a reward, a monster drop…) goes to the chest in your tent: the newest things first */
function sgBagOverflow(quietIfNone = true) {
  const s = sgS(); if (!s) return 0;
  const b = sgBag(s), c = sgCarried(s), snap = sg.bagSnap || { bag: {}, gear: {} }, st = sgStash(s);
  let moved = 0;
  const spill = (from, to, over, valid) => {
    if (over <= 0) return;
    const keys = Object.keys(from).filter(k => from[k] > 0 && valid(k));
    const newer = keys.filter(k => from[k] > (snap[from === s.bag ? 'bag' : 'gear'][k] || 0)), order = [...newer, ...keys.filter(k => !newer.includes(k)).sort((x, y) => from[y] - from[x])];
    for (const k of order) { if (over <= 0) break; const n = Math.min(over, from[k]); from[k] -= n; to[k] = (to[k] || 0) + n; over -= n; moved += n; }
  };
  spill(s.bag, st.bag, c.items - b.items, k => !!SG_ITEMS[k]);
  spill(s.gearBag, st.gear, c.gear - b.gear, k => !!SG_GEAR[k]);
  sg.bagSnap = { bag: { ...s.bag }, gear: { ...s.gearBag } };
  if (moved) { sgSaveNow(true); sg.banner = { text: `🎒 Your bag is full! ${moved} thing${moved === 1 ? '' : 's'} went to the chest in your tent.`, until: sg.frame + 260 }; }
  return moved;
}
// check now and then while you walk around (never in the middle of a battle or a menu)
{ const base = sgFrame; sgFrame = function () { if (sg && !sg.ui && !sg.bt && sg.frame % 20 === 0) { try { sgBagOverflow(); } catch (e) { console.error(e); } } return base.apply(this, arguments); }; }

// item shops sell the next bag once you've gone far enough in the story; shops won't sell what you can't carry
{ const base = sgShop; sgShop = function (list, kind, sel = 0) {
  base.apply(this, arguments);
  const s = sgS(), ui = sg.ui; if (!ui || ui.type !== 'menu') return;
  const bag = sgBag(s), c = sgCarried(s), full = kind === 'gear' ? c.gear >= bag.gear : c.items >= bag.items;
  if (full) ui.items.slice(0, list.length).forEach(it => { if (it && !it.disabled) { it.disabled = true; it.sub = `${it.sub || ''} 🎒 Your bag is full: sell something or store it in your tent.`.trim(); } });
  if (kind === 'items') {
    const next = SG_BAGS[(s.bagLv || 0) + 1];
    if (next && sgStage() >= next.stage) ui.items.splice(ui.items.length - 1, 0, { label: `${next.icon} ${next.name} · ${next.price} gold`,
      sub: `Carry ${next.items === Infinity ? 'as many items and as much gear as you like (no limit!)' : `${next.items} items and ${next.gear} pieces of gear`}. Now: ${sgBagLine(s)}.`, disabled: s.gold < next.price,
      fn: () => { s.gold -= next.price; s.bagLv = (s.bagLv || 0) + 1; sgSaveNow(true); sgJingle('sg_fanfare');
        sgSay([`${next.icon} You bought the <b>${next.name}</b>!`, next.items === Infinity ? '✨ It’s bigger on the inside. It can hold anything, as much as you like.' : `Now you can carry ${next.items} items and ${next.gear} pieces of spare gear.`], () => sgShop(list, kind, sel)); } });
    ui.title += `<br><small>${sgBagLine(s)}</small>`;
  } else ui.title += `<br><small>${sgBagLine(s)}</small>`;
  sgBox();
}; }
// the Items and Equipment menus show how full your bag is
for (const name of ['sgItemMenu', 'sgEquipMenu']) {
  const base = window[name]; if (typeof base !== 'function') continue;
  window[name] = function () { const out = base.apply(this, arguments); if (sg?.ui?.type === 'menu' && !String(sg.ui.title).includes('🧪')) { sg.ui.title += `<br><small>${sgBagLine()}</small>`; sgBox(); } return out; };
}

/* ---------- ⛺ Your tent ---------- */
// at camp, the tent on the top left is yours (a blue tent with a little flag)
{ const r = SG_MAPS.camp.rows; r[3] = r[3].slice(0, 4) + '8' + r[3].slice(5); }
SG_MAPS.mytent = { name: 'Your tent', song: 'sg_camp', inside: true, solo: true,   // your companions stay by the fire
  theme: 'field', npcs: [], objs: [],
  rows: ['1111111111', '1405227961', '1222222221', '1223333221', '1223333221', '1222222221', '1222222221', '1111221111'],   // bed, lantern, table, plant, chest; rug; door at the bottom
  exitTo: { map: 'camp', x: 4, y: 4, dir: 'down' }, entry: { x: 4, y: 6 } };
SG_WALK.add('2'); SG_WALK.add('3');
{ const base = typeof sgTileMore === 'function' ? sgTileMore : null;
  sgTileMore = function (ch, theme, g, R, H) {
    switch (ch) {
      case '8': {   // your tent at camp: blue canvas and a yellow pennant
        H.base(); g.fillStyle = '#3b6fd1'; g.beginPath(); g.moveTo(1, 15); g.lineTo(8, 2); g.lineTo(15, 15); g.fill();
        g.fillStyle = '#2a50a0'; g.beginPath(); g.moveTo(8, 2); g.lineTo(8, 15); g.lineTo(15, 15); g.fill();
        R(6, 10, 4, 5, '#18306a'); R(7, 11, 2, 4, '#0d1d44');
        R(8, 0, 1, 3, '#5a3a1a'); R(9, 0, 4, 2, '#f4c542'); R(12, 1, 1, 1, '#f4c542'); return true; }
      case '1': R(0, 0, 16, 16, '#d9c39a'); R(0, 0, 16, 2, '#b89e6e'); R(5, 0, 1, 16, '#c7ae80'); R(11, 0, 1, 16, '#c7ae80'); R(0, 14, 16, 2, '#a88c5c'); return true;   // tent canvas
      case '2': R(0, 0, 16, 16, '#b78350'); for (let y = 3; y < 16; y += 4) R(0, y, 16, 1, '#9a6a3c'); R(4, 0, 1, 3, '#9a6a3c'); R(10, 4, 1, 3, '#9a6a3c'); R(6, 8, 1, 3, '#9a6a3c'); R(12, 12, 1, 3, '#9a6a3c'); return true;   // wooden floor
      case '3': R(0, 0, 16, 16, '#a8323a'); R(1, 1, 14, 14, '#c0464c'); R(3, 3, 10, 10, '#a8323a'); R(5, 5, 6, 6, '#e0b04a'); R(7, 7, 2, 2, '#a8323a');
        for (let i = 2; i < 14; i += 3) { R(i, 0, 1, 1, '#f0d890'); R(i, 15, 1, 1, '#f0d890'); } return true;   // rug
      case '4': R(0, 0, 16, 16, '#b78350'); R(1, 2, 15, 13, '#6a4422'); R(2, 3, 14, 11, '#f2efe6'); R(3, 5, 7, 6, '#ffffff'); R(3, 10, 7, 1, '#d8d2c4'); R(11, 3, 5, 11, '#4a78c8'); R(11, 3, 5, 1, '#6a98e8'); return true;   // bed, pillow end
      case '0': R(0, 0, 16, 16, '#b78350'); R(0, 2, 15, 13, '#6a4422'); R(0, 3, 14, 11, '#4a78c8'); R(0, 3, 14, 1, '#6a98e8'); for (let x = 1; x < 14; x += 4) R(x, 6, 2, 2, '#f4c542'); R(13, 2, 2, 13, '#6a4422'); return true;   // bed, foot end with a quilt
      case '5': R(0, 0, 16, 16, '#b78350'); R(5, 10, 6, 5, '#6a4422'); R(6, 4, 4, 6, '#3a3a3a'); R(7, 5, 2, 4, '#ffd34d'); R(7, 6, 2, 2, '#fff3a0'); R(6, 3, 4, 1, '#3a3a3a'); R(7, 2, 2, 1, '#3a3a3a'); return true;   // lantern on a stool
      case '7': R(0, 0, 16, 16, '#b78350'); R(1, 6, 14, 3, '#7a4f2a'); R(2, 9, 2, 6, '#5a3a1a'); R(12, 9, 2, 6, '#5a3a1a'); R(3, 3, 6, 3, '#8e44ad'); R(4, 3, 4, 1, '#f2efe6'); R(11, 2, 2, 4, '#f2efe6'); R(11, 1, 2, 1, '#ffb066'); return true;   // table, journal, candle
      case '9': R(0, 0, 16, 16, '#b78350'); R(5, 10, 6, 5, '#b85a2a'); R(5, 10, 6, 1, '#d97a4a'); R(7, 4, 2, 6, '#2f8a2f'); R(4, 3, 4, 3, '#4fbf4f'); R(9, 5, 4, 3, '#4fbf4f'); R(6, 1, 3, 3, '#5fd85f'); return true;   // a plant from home
      case '6': R(0, 0, 16, 16, '#b78350'); R(2, 5, 12, 10, '#8b5a2b'); R(2, 5, 12, 3, '#a8703a'); R(2, 8, 12, 1, '#5a3a1a'); R(7, 8, 2, 3, '#f4c542'); R(2, 5, 1, 10, '#c79a4a'); R(13, 5, 1, 10, '#c79a4a'); return true;   // your storage chest
    }
    return base ? base(ch, theme, g, R, H) : false;
  }; }
{ const base = typeof sgInteractMore === 'function' ? sgInteractMore : null;
  sgInteractMore = function (fx, fy) {
    const s = sgS(), t = sgTile(s.map, fx, fy);
    if (t === '8' && SG_MAPS[s.map].camp) { sgWarp('mytent', 4, 6, 'up'); if (!s.flags.tentSeen) { s.flags.tentSeen = 1; sgSay(['⛺ Your own tent! Cozy and dry.', 'Store things in the 📦 chest, sleep in the bed, or read your journal on the table. Walk out the bottom to go back to camp.']); } return true; }
    if (s.map === 'mytent') {
      if (t === '6') { sgStashMenu(); return true; }
      if (t === '4' || t === '0') { sgTentBed(); return true; }
      if (t === '7') { sgTentJournal(); return true; }
      if (t === '5') { sgSay('🏮 Your lantern glows warm and steady.'); return true; }
      if (t === '9') { sgSay('🪴 A little plant from home. It looks happy to be here.'); return true; }
      if (t === '1') { sgSay('The canvas flaps gently in the wind.'); return true; }
    }
    return base ? base(fx, fy) : false;
  }; }
function sgTentBed() {
  const s = sgS();
  sgMenu('🛏️ Your bed. It looks very comfortable.', [
    { label: '😴 Sleep until morning', sub: 'Everyone gets back all their HP and MP, and the poison is gone. The game is saved.', fn: () => {
      const down = s.party.filter(h => h.hp <= 0);
      for (const h of s.party) { if (h.hp <= 0) continue; h.hp = sgMax(h, 'hp'); h.mp = sgMax(h, 'mp'); if (h.st) delete h.st.poison; }
      sg.flash = 20; sgJingle('sg_inn'); s.campN = (s.campN || 0) + 1; sgSaveNow(true);
      sgSay(['💤 You sleep soundly in your own bed…', '☀️ Good morning! Everyone is rested and ready.', ...(down.length ? [`${down.map(h => esc(h.name)).join(' and ')} ${down.length === 1 ? 'is' : 'are'} still knocked out. A priest, an inn or a Phoenix Down can help.`] : [])]); } },
    { label: 'Not now', fn: () => {} }], () => {});
}
function sgTentJournal() {
  const s = sgS(), st = sgStash(s), stored = Object.values(st.bag).reduce((a, n) => a + (n > 0 ? n : 0), 0) + Object.values(st.gear).reduce((a, n) => a + (n > 0 ? n : 0), 0);
  const next = SG_BAGS[(s.bagLv || 0) + 1];
  sgSay([`📖 <b>${esc(s.name)}’s journal</b>`, `${sgBagLine(s)}.`, `📦 In your chest: ${stored} thing${stored === 1 ? '' : 's'}.`,
    next ? (sgStage() >= next.stage ? `✏️ Note to self: item shops sell a ${next.name} now (${next.price} gold).` : '✏️ Note to self: bigger bags are sold in item shops as the journey goes on.') : '✨ Your Bag of holding can carry anything. No more packing!']);
}

/* ---------- 📦 The chest: store and take out items and gear ---------- */
function sgStashMenu(sel = 0) {
  const s = sgS(), st = sgStash(s);
  const inChest = Object.values(st.bag).reduce((a, n) => a + Math.max(0, n), 0) + Object.values(st.gear).reduce((a, n) => a + Math.max(0, n), 0);
  sgMenu(`📦 Your chest · ${inChest} thing${inChest === 1 ? '' : 's'} inside<br><small>${sgBagLine(s)}</small>`, [
    { label: '⬇️ Put things in the chest', sub: 'Items and spare gear from your bag.', fn: () => sgStashPut() },
    { label: '⬆️ Take things out', sub: 'Back into your bag, if there’s room.', disabled: !inChest, fn: () => sgStashTake() },
    { label: 'Close the chest', fn: () => {} }], () => {}, { sel });
}
function sgStashRows(from, back) {
  const rows = [];
  for (const [k, n] of Object.entries(from.bag)) if (n > 0 && SG_ITEMS[k]) rows.push({ kind: 'bag', k, n, label: `${SG_ITEMS[k].icon} ${SG_ITEMS[k].name} ×${n}` });
  for (const [k, n] of Object.entries(from.gear)) if (n > 0 && SG_GEAR[k]) rows.push({ kind: 'gear', k, n, label: `${SG_GEAR[k].slot === 'weapon' ? '⚔️' : '🛡️'} ${SG_GEAR[k].name} ×${n}` });
  return rows;
}
function sgStashPut(sel = 0) {
  const s = sgS(), st = sgStash(s), rows = sgStashRows({ bag: s.bag, gear: s.gearBag });
  if (!rows.length) return sgSay('Your bag is empty. Nothing to put away.', () => sgStashMenu());
  sgMenu(`⬇️ Put in the chest · tap one to store it<br><small>${sgBagLine(s)}</small>`, [...rows.map((r, i) => ({ label: r.label, sub: r.n > 1 ? 'Stores one. Tap again for more.' : '',
    fn: () => { const fromB = r.kind === 'bag' ? s.bag : s.gearBag, toB = r.kind === 'bag' ? st.bag : st.gear; fromB[r.k]--; toB[r.k] = (toB[r.k] || 0) + 1; sg.bagSnap = { bag: { ...s.bag }, gear: { ...s.gearBag } }; sgSaveNow(true); trSound('hop'); sgStashPut(Math.min(i, rows.length - 1)); } })),
    { label: '📦 Put everything in', sub: 'Your whole bag goes into the chest (what you’re wearing stays on).', fn: () => {
      for (const r of rows) { const fromB = r.kind === 'bag' ? s.bag : s.gearBag, toB = r.kind === 'bag' ? st.bag : st.gear; toB[r.k] = (toB[r.k] || 0) + fromB[r.k]; fromB[r.k] = 0; }
      sg.bagSnap = { bag: { ...s.bag }, gear: { ...s.gearBag } }; sgSaveNow(true); sgJingle('sg_level'); sgSay('📦 Everything is safely stored in your chest.', () => sgStashMenu()); } }],
    () => sgStashMenu(), { sel, big: true });
}
function sgStashTake(sel = 0) {
  const s = sgS(), st = sgStash(s), rows = sgStashRows(st), bag = sgBag(s);
  if (!rows.length) return sgSay('The chest is empty.', () => sgStashMenu(1));
  const c = sgCarried(s);
  sgMenu(`⬆️ Take from the chest · tap one to take it<br><small>${sgBagLine(s)}</small>`, rows.map((r, i) => {
    const full = r.kind === 'bag' ? c.items >= bag.items : c.gear >= bag.gear;
    return { label: r.label, sub: full ? `🎒 No room in your bag for more ${r.kind === 'bag' ? 'items' : 'gear'}.` : r.n > 1 ? 'Takes one. Tap again for more.' : '', disabled: full,
      fn: () => { const fromB = r.kind === 'bag' ? st.bag : st.gear, toB = r.kind === 'bag' ? s.bag : s.gearBag; fromB[r.k]--; toB[r.k] = (toB[r.k] || 0) + 1; sg.bagSnap = { bag: { ...s.bag }, gear: { ...s.gearBag } }; sgSaveNow(true); trSound('hop'); sgStashTake(Math.min(i, rows.length - 1)); } };
  }), () => sgStashMenu(1), { sel, big: true });
}

/* ---------- 🎤 Spoken attacks ---------- */
const sgSayAtkOn = () => S.settings.sgSayAtk === true;
const sgCanSay = () => typeof skSupport === 'function' && skSupport().ok;
{ const base = sgOptionsMore; sgOptionsMore = function () {
  return [...base.apply(this, arguments), { label: `🗣️ Spoken attacks: ${sgSayAtkOn() ? 'on' : 'off'}`,
    sub: sgCanSay() ? 'Attack and cast every spell by saying the word out loud. A meter shows how loud you are, and you have up to 25 seconds to speak.' : 'This browser can’t listen to the microphone. Try Chrome or Edge, or the Android app.',
    disabled: !sgCanSay() && !sgSayAtkOn(), fn: () => { S.settings.sgSayAtk = !sgSayAtkOn(); save(); sgOptions(5); } }];
}; }
{ const base = sgAsk; sgAsk = function (title, then) {
  if (sgSayAtkOn() && sgCanSay() && /^⚔️/.test(String(title))) return sgAskSay(String(title).replace(/Pick the meaning:?/, 'Say the word:'), then);
  return base.apply(this, arguments);
}; }
{ const base = sgSpellAsk; sgSpellAsk = function (sp) { return sgSayAtkOn() && sgCanSay() ? sgAskSay : base.apply(this, arguments); }; }
// when you chose to speak, the microphone opens by itself; speaking takes longer than tapping, so the speed bonus allows for it
{ const base = sgAskSay; sgAskSay = function () {
  const out = base.apply(this, arguments), q = sg?.ui?.q;
  if (q && q.mode === 'say') { q.limit = 14000; if (sgSayAtkOn()) setTimeout(() => { if (sg?.ui?.q === q && !q.listening && q.given == null) actions.sgMic(); }, 500); }
  return out;
}; }

/* ---------- saves ---------- */
{ const base = typeof sgFixMore === 'function' ? sgFixMore : null;
  sgFixMore = function (s) {
    if (base) base(s);
    s.bagLv ||= 0; s.stash ||= { bag: {}, gear: {} };
    if (s.map === 'mytent' && !s.campFrom) Object.assign(s, { map: 'field', x: 9, y: 9, dir: 'down' });
    if (s.map === 'mytent' && s.campFrom) Object.assign(SG_MAPS.camp, { theme: SG_MAPS[s.campFrom.map]?.theme || 'field', exitTo: { ...s.campFrom, dir: 'down' } });
  }; }

/* ---------- 🪟 clear handheld cases: line the circuit-board picture up with the real buttons ----------
   console-guts.svg has the board, and molded rings and contact pads under the D-pad and A/B buttons. Stretched over the whole
   case it only lined up on one screen size (on phones the buttons sit elsewhere, so it looked too low). Now it is moved
   and sized across to where the buttons really are; the rings around MUSIC/MENU and the speaker are drawn on the buttons. */
const TR_GUTS_SPOTS = [['.tr-dpad', 15.2, 107.1], ['.tr-ab', 81.85, 105.7], ['.tr-mid > :first-child .tr-small', 41.25, 118.9], ['.tr-mid > :last-child .tr-small', 53.75, 118.9], ['.tr-speaker', 87, 123.5]];
function trFitGuts() {
  for (const c of document.querySelectorAll('.tr-console.gbc.clear')) {
    const r = c.getBoundingClientRect(); if (!r.width) continue;
    const bz = c.querySelector('.tr-bezel')?.getBoundingClientRect(); if (bz?.height) c.style.setProperty('--gscreen', Math.round(bz.bottom - r.top + 4) + 'px');   // plain plastic down to just below the screen
    const pts = TR_GUTS_SPOTS.map(([sel, sx, sy]) => { const e = c.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return b.width ? { sx, sy, x: b.left - r.left + b.width / 2, y: b.top - r.top + b.height / 2 } : null; }).filter(Boolean);
    if (pts.length < 3) { c.style.removeProperty('--gx'); continue; }
    const fit = (a, b) => { const n = pts.length, ma = pts.reduce((s, p) => s + p[a], 0) / n, mb = pts.reduce((s, p) => s + p[b], 0) / n;
      const k = pts.reduce((s, p) => s + (p[a] - ma) * (p[b] - mb), 0) / (pts.reduce((s, p) => s + (p[a] - ma) ** 2, 0) || 1); return [k, mb - k * ma]; };
    const [kx, bx] = fit('sx', 'x'), ky = r.height / 133.6, top = pts.filter(p => p.sy < 110);   // the picture keeps its height (no stretching)
    const by = (top.length ? top : pts).reduce((s, p) => s + p.y - ky * p.sy, 0) / (top.length || pts.length);   // and moves so the D-pad and A/B rings sit on the buttons
    const key = [kx, bx, ky, by].map(v => v.toFixed(1)).join(); if (c.dataset.guts === key) continue; c.dataset.guts = key;
    c.style.setProperty('--gx', bx.toFixed(1) + 'px'); c.style.setProperty('--gy', by.toFixed(1) + 'px');
    c.style.setProperty('--gw', (100 * kx).toFixed(1) + 'px'); c.style.setProperty('--gh', (133.6 * ky).toFixed(1) + 'px');
  }
}
{ const r = window.render; if (typeof r === 'function') window.render = function () { const out = r.apply(this, arguments); requestAnimationFrame(trFitGuts); setTimeout(trFitGuts, 300); return out; }; }
window.addEventListener('resize', () => requestAnimationFrame(trFitGuts));
