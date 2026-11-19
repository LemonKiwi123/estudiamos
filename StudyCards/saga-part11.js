'use strict';
/* ================= Lexicon Saga, part eleven: the quest log and side quests =================
   📜 Quest log (menu): where you are in the main story (chapters you've done, the next one with a hint, the rest kept
   secret), and your side quests with their progress.
   ❗ Side quests: every in-game day, one or two ordinary townspeople in each town have a request (a ❗ over their head).
   Bring them items, defeat monsters, deliver a parcel to another town, or help with words right there: pick meanings,
   spell words, or say them out loud. Rewards: gold, experience and sometimes an item. Up to 5 side quests at a time. */

/* ---------- 📖 Main quest: the story chapters, in order ---------- */
const SG_MAIN = [
  ['king', 'Answer King Aldous’s call'], ['shard', 'Win the first Lexicon Shard'], ['kingDone', 'Bring the shard to King Aldous'],
  ['queen', 'Meet Queen Ysolde in Seravel'], ['tide', 'Earn a Tide Charm from Sage Orrin'], ['shard2', 'Find the second shard in the Sunken Archive'],
  ['ship', 'Win the Quill Swan'], ['oracle', 'Visit the island Oracle'], ['isles', 'Reach the Eastern Isles'], ['archmage', 'Meet Archmage Veyra'],
  ['crystal', 'Take the Voice Crystal from Ember Cave'], ['wayfare', 'Bring the Voice Crystal to Veyra'], ['allshards', 'Defeat the Silent Herald'],
  ['keyquest', 'Bring every shard to King Aldous'], ['key1', 'Find the Dawn Quill'], ['key2', 'Find the Dusk Inkwell'], ['key3', 'Find the Star Seal'],
  ['lexicon', 'Defeat the Unwriter and free the Lexicon'],
];
function sgMainStatus(s = sgS()) {
  const f = s.flags, done = SG_MAIN.filter(([k]) => f[k]).length, next = SG_MAIN.find(([k]) => !f[k]);
  return { done, total: SG_MAIN.length, next, hint: typeof sgHint === 'function' ? sgHint(s) : '' };
}

/* ---------- ❗ Side quests ---------- */
const SG_Q_MAX = 5;
const sgQ = (s = sgS()) => (s.quests ||= { active: [], done: 0, log: [], offered: {} });
const SG_Q_SKIP = ['king', 'queen', 'archmage', 'barkeep', 'hire', 'join', 'merchant', 'merchantGear', 'priest', 'roadPriest', 'banker', 'campHero', 'jailer', 'leviathan', 'merking', 'wanderer', 'sage', 'oracle', 'teacher'];
const sgQName = n => n.name || ({ man: 'A townsman', woman: 'A townswoman', old: 'An old timer', oldman: 'An old timer', oldwoman: 'An old woman', kid: 'A kid', girl: 'A girl', boy: 'A boy', sailor: 'A sailor', farmer: 'A farmer', guard: 'A guard', merchant: 'A trader' }[n.look] || 'A villager');
const sgQHash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const sgQCan = n => !!(n && (n.lines || n.chat) && !SG_Q_SKIP.some(k => n[k]) && n.look !== 'guard' && !/guard/i.test(n.id || ''));   // gate guards stay on duty
const sgQMid = who => /^(A|An) /.test(who) ? who[0].toLowerCase() + who.slice(1) : who;   // “a townswoman” in the middle of a sentence
// today's quest givers in this town: the same ones all day, new ones tomorrow
function sgQGivers(map, s = sgS()) {
  const m = SG_MAPS[map]; if (!m?.town) return [];
  const day = typeof sgDayNo === 'function' ? sgDayNo(s) : 0, key = map + ':' + day;
  sg.qGivers ||= {}; if (sg.qGivers[key]) return sg.qGivers[key];
  const pool = (m.npcs || []).filter(sgQCan).sort((a, b) => sgQHash(key + a.id) - sgQHash(key + b.id));
  return (sg.qGivers[key] = pool.slice(0, pool.length > 5 ? 2 : 1).map(n => n.id));
}
const sgQOfferKey = (map, id, s = sgS()) => `${map}:${id}:${typeof sgDayNo === 'function' ? sgDayNo(s) : 0}`;
const sgQMine = (map, id, s = sgS()) => sgQ(s).active.find(q => q.map === map && q.npc === id);
const sgQReady = q => q.type === 'fetch' ? (sgS().bag[q.item] || 0) >= q.n : q.type === 'hunt' ? q.got >= q.n : false;
function sgQTowns(s = sgS(), not) { return Object.keys(SG_MAPS).filter(k => SG_MAPS[k].town && k !== not && (s.seen?.[k] || k === 'town') && SG_MAPS[k].name); }
function sgQReward(s, type) {
  const st = typeof sgStage === 'function' ? sgStage() : 0, r = sgQHash(type + st + (s.steps || 0));
  const gold = Math.round((40 + st * 30) * ({ fetch: 1, hunt: 1.4, deliver: 1.2, words: 1, spell: 1.1, say: 1.1 }[type] || 1) / 5) * 5;
  const xp = Math.round(12 + st * 18 + (type === 'hunt' ? 10 : 0));
  const items = ['herb', 'bigherb', 'ether', 'feather', 'phoenix'].filter(k => SG_ITEMS[k]), item = r % 3 === 0 ? items[r % items.length] : null;
  return { gold, xp, item };
}
const sgQRewardText = r => `💰 ${r.gold} gold · ⭐ ${r.xp} XP${r.item ? ` · ${SG_ITEMS[r.item].icon} ${SG_ITEMS[r.item].name}` : ''}`;
// make the request a giver has today
function sgQMake(map, n) {
  const s = sgS(), key = sgQOfferKey(map, n.id), r = sgQHash(key), st = typeof sgStage === 'function' ? sgStage() : 0, name = sgQName(n), town = SG_MAPS[map].name;
  const types = ['fetch', 'hunt', 'words', 'spell', ...(sgQTowns(s, map).length ? ['deliver'] : []), ...(typeof skSupport === 'function' && skSupport().ok ? ['say'] : [])];
  const type = types[r % types.length], q = { id: key, map, npc: n.id, who: name, town, type, reward: sgQReward(s, type), day: typeof sgDayNo === 'function' ? sgDayNo(s) : 0 };
  if (type === 'fetch') {
    const cheap = ['herb', 'bigherb', 'ether', 'feather'].filter(k => SG_ITEMS[k] && SG_ITEMS[k].price <= 40 + st * 15);
    q.item = cheap[(r >> 3) % cheap.length] || 'herb'; q.n = SG_ITEMS[q.item].price > 20 ? 1 + (r >> 5) % 2 : 2 + (r >> 5) % 3;
    q.ask = [`My little one has a fever and I’m all out of ${SG_ITEMS[q.item].name}. Could you bring me ${q.n}?`, `I’m making a remedy for the whole street. I need ${q.n} × ${SG_ITEMS[q.item].name}.`, `My travel bag was stolen on the road! Could you spare ${q.n} × ${SG_ITEMS[q.item].name}?`][(r >> 7) % 3];
    q.desc = `Bring ${q.n} × ${SG_ITEMS[q.item].icon} ${SG_ITEMS[q.item].name} to ${sgQMid(name)} in ${town}`;
  } else if (type === 'hunt') {
    q.n = 4 + (r >> 4) % 5 + Math.min(4, Math.floor(st / 4)); q.got = 0;
    q.ask = [`Monsters keep trampling my garden. Could you thin them out? Defeat ${q.n} monsters out there.`, `The road to the next town isn’t safe anymore. Defeat ${q.n} monsters and come tell me.`, `I bet you can’t beat ${q.n} monsters! Prove me wrong and I’ll pay you.`][(r >> 7) % 3];
    q.desc = `Defeat ${q.n} monsters, then tell ${sgQMid(name)} in ${town}`;
  } else if (type === 'deliver') {
    const towns = sgQTowns(s, map), to = towns[(r >> 4) % towns.length]; q.to = to; q.toName = SG_MAPS[to].name;
    q.what = ['a sealed letter', 'a jar of honey', 'a wrapped book', 'a little wooden toy', 'a bundle of letters'][(r >> 6) % 5];
    q.ask = `Could you take ${q.what} to my family in ${q.toName}? Just walk into town and they’ll find you.`;
    q.desc = `Take ${q.what} to ${q.toName}`;
  } else if (type === 'words') {
    q.n = 4 + (r >> 4) % 3; q.need = q.n - 1;
    q.ask = `I’m learning words for a test tomorrow. Quiz me? Get ${q.need} of ${q.n} meanings right and I’ll thank you properly.`;
    q.desc = `Help ${sgQMid(name)} with word meanings`;
  } else if (type === 'spell') {
    q.n = 3; q.need = 2;
    q.ask = `I’m writing a letter, but I can’t spell! Spell ${q.n} words for me (${q.need} right is enough).`;
    q.desc = `Spell words for ${sgQMid(name)}`;
  } else {
    q.n = 3; q.need = 2;
    q.ask = `My parrot only learns words it hears. Say ${q.n} words out loud so it can learn them! (${q.need} is enough.)`;
    q.desc = `Say words for ${sgQMid(name)}’s parrot`;
  }
  return q;
}
function sgQFinish(q, lines = []) {
  const s = sgS(), log = sgQ(s);
  log.active = log.active.filter(x => x !== q); log.done++; (log.log ||= []).unshift({ desc: q.desc, at: Date.now() }); log.log.length = Math.min(log.log.length, 12);
  log.offered[q.id] = 'done';
  s.gold += q.reward.gold; if (q.reward.item) s.bag[q.reward.item] = (s.bag[q.reward.item] || 0) + 1;
  lines.push(`🎁 Reward: ${sgQRewardText(q.reward)}`);
  sgGiveXp(lines, q.reward.xp); sgJingle('sg_fanfare'); sgSaveNow(true);
  return lines;
}
// a word challenge right there: meanings, spelling, or saying them out loud
function sgQChallenge(q, i = 0, right = 0) {
  if (i >= q.n) {
    if (right >= q.need) return sgSay(sgQFinish(q, [`${esc(q.who)}: You got ${right} of ${q.n}! Thank you so much!`]));
    sgQ().offered[q.id] = 'tried'; sgSaveNow(true);
    return sgSay([`${esc(q.who)}: ${right} of ${q.n}… so close! Come back tomorrow and we’ll try again.`]);
  }
  const title = `${q.type === 'words' ? '📖' : q.type === 'spell' ? '✍️' : '🦜'} ${esc(q.who)} · word ${i + 1} of ${q.n}${q.type === 'words' ? ': what does this mean?' : q.type === 'spell' ? ': spell this word' : ''}`;
  const ask = q.type === 'words' ? sgAsk : q.type === 'spell' ? sgAskSpell : typeof sgAskSay === 'function' && typeof skSupport === 'function' && skSupport().ok ? sgAskSay : sgAskSpell;
  ask(q.type === 'say' ? `🦜 ${esc(q.who)}’s parrot · word ${i + 1} of ${q.n}: say this word` : title, grade => sgQChallenge(q, i + 1, right + (grade === 'wrong' ? 0 : 1)));
}
function sgQOffer(map, n) {
  const s = sgS(), log = sgQ(s), q = sgQMake(map, n);
  if (log.active.length >= SG_Q_MAX) return sgSay(`${esc(q.who)}: You look busy already! Finish one of your quests and come back.`);
  sgMenu(`❗ <b>${esc(q.who)}</b>: ${esc(q.ask)}<br><small>${sgQRewardText(q.reward)}</small>`, [
    { label: q.type === 'words' || q.type === 'spell' || q.type === 'say' ? '✅ Sure, let’s do it now' : '✅ I’ll do it', fn: () => {
      log.offered[q.id] = 'taken';
      if (['words', 'spell', 'say'].includes(q.type)) return sgQChallenge(q);
      log.active.push(q); sgSaveNow(true);
      sgSay([`📜 New quest: <b>${esc(q.desc)}</b>.`, 'You can see it any time in the menu → 📜 Quest log.']);
    } },
    { label: 'Not now', fn: () => sgSay(`${esc(q.who)}: All right. I’ll be here today if you change your mind.`) }], () => {});
}
function sgQTalk(n) {
  const s = sgS(), map = s.map, q = sgQMine(map, n.id);
  if (q) {
    if (q.type === 'fetch') {
      const have = s.bag[q.item] || 0, it = SG_ITEMS[q.item];
      if (have < q.n) { sgSay(`${esc(q.who)}: Did you find ${q.n} × ${it.name}? You have ${have} so far.`); return true; }
      sgMenu(`${esc(q.who)}: Oh! Is that ${it.name}?`, [{ label: `🎁 Give ${q.n} × ${it.icon} ${it.name}`, fn: () => { s.bag[q.item] -= q.n; sgSay(sgQFinish(q, [`${esc(q.who)}: Thank you, thank you! You’re a hero.`])); } },
        { label: 'Not yet', fn: () => {} }], () => {});
      return true;
    }
    if (q.type === 'hunt') {
      if (q.got < q.n) { sgSay(`${esc(q.who)}: ${q.got} down, ${q.n - q.got} to go. Be careful out there!`); return true; }
      sgSay(sgQFinish(q, [`${esc(q.who)}: ${q.n} monsters?! The roads feel safer already. Thank you!`])); return true;
    }
    if (q.type === 'deliver') { sgSay(`${esc(q.who)}: Please take it to ${q.toName}. My family there is waiting!`); return true; }
  }
  if (sgQGivers(map).includes(n.id) && sgQCan(n)) {
    const st = sgQ(s).offered[sgQOfferKey(map, n.id)];
    if (st === 'done' || st === 'tried') { sgSay(`${esc(sgQName(n))}: Thanks again for today! Maybe I’ll need help tomorrow.`); return true; }
    if (st !== 'taken') { sgQOffer(map, n); return true; }
  }
  return false;
}
{ const base = sgTalkFirst; sgTalkFirst = function (n) { if (base.apply(this, arguments)) return true; try { return sgQTalk(n); } catch (e) { console.error(e); return false; } }; }
// monsters defeated count toward every "defeat monsters" quest
{ const base = sgWin; sgWin = function () {
  try { const b = sg.bt, n = b?.foes?.length || 0; for (const q of sgQ().active) if (q.type === 'hunt' && q.got < q.n) { q.got = Math.min(q.n, q.got + n); if (q.got >= q.n) sg.qNote = `📜 Quest: you’ve defeated ${q.n} monsters! Go tell ${sgQMid(q.who)} in ${q.town}.`; } } catch (e) { console.error(e); }
  return base.apply(this, arguments);
}; }
// walking into the town a parcel is for delivers it
{ const base = sgWarp; sgWarp = function (map) {
  const out = base.apply(this, arguments);
  try { const q = sgQ().active.find(x => x.type === 'deliver' && x.to === map); if (q) sg.qDeliver = q; } catch (e) { console.error(e); }
  return out;
}; }
{ const base = sgFrame; sgFrame = function () {
  if (sg && !sg.ui && !sg.bt && !sg.moving) {
    if (sg.qDeliver) { const q = sg.qDeliver; sg.qDeliver = null; if (sgQ().active.includes(q)) sgSay(sgQFinish(q, [`📦 Someone runs up to you: “Is that ${q.what} from ${q.town}? From ${sgQMid(q.who)}! Oh, thank you!”`])); }
    else if (sg.qNote) { sg.banner = { text: sg.qNote, until: sg.frame + 260 }; sg.qNote = null; }
  }
  return base.apply(this, arguments);
}; }
// ❗ over today's quest givers, ❓ over someone whose quest you can hand in
{ const base = sgDrawWorld; sgDrawWorld = function (g) {
  base.apply(this, arguments);
  try {
    const s = sgS(), m = SG_MAPS[s.map]; if (!m.town) return;
    const W = m.rows[0].length, H = m.rows.length; let px = s.x, py = s.y;
    if (sg.moving) { const k = sg.moving.t; px = sg.moving.fx + (sg.moving.tx - sg.moving.fx) * k; py = sg.moving.fy + (sg.moving.ty - sg.moving.fy) * k; }
    const camX = W * 16 <= SG_W ? (W * 16 - SG_W) / 2 : Math.max(0, Math.min(W * 16 - SG_W, px * 16 - 72)), camY = H * 16 <= SG_H ? (H * 16 - SG_H) / 2 : Math.max(0, Math.min(H * 16 - SG_H, py * 16 - 64));
    const givers = sgQGivers(s.map), log = sgQ(s), bob = Math.round(Math.sin(sg.frame / 9));
    for (const n of sgNpcs(s.map)) {
      const mine = sgQMine(s.map, n.id), st = log.offered[sgQOfferKey(s.map, n.id)];
      const mark = mine ? (sgQReady(mine) ? '?' : '') : givers.includes(n.id) && sgQCan(n) && !st ? '!' : '';
      if (!mark) continue;
      const X = Math.round(n.x * 16 - camX) + 6, Y = Math.round(n.y * 16 - camY) - 11 + bob;
      g.fillStyle = '#1a1a1a'; g.fillRect(X - 1, Y - 1, 6, 10); g.fillStyle = mark === '!' ? '#f4c542' : '#7fd0ff';
      if (mark === '!') { g.fillRect(X + 1, Y, 2, 5); g.fillRect(X + 1, Y + 6, 2, 2); }
      else { g.fillRect(X, Y, 4, 1); g.fillRect(X + 3, Y + 1, 1, 2); g.fillRect(X + 1, Y + 3, 2, 1); g.fillRect(X + 1, Y + 4, 2, 1); g.fillRect(X + 1, Y + 6, 2, 2); }
    }
  } catch (e) { console.error(e); }
}; }

/* ---------- 📜 The quest log ---------- */
function sgQuestLog(sel = 0) {
  const s = sgS(), ms = sgMainStatus(s), log = sgQ(s);
  sgMenu(`📜 Quest log<br><small>📖 Main quest: chapter ${Math.min(ms.done + 1, ms.total)} of ${ms.total}${ms.next ? ` · ${esc(ms.next[1])}` : ' · complete!'}</small>`, [
    { label: `📖 Main quest${ms.next ? `: ${ms.next[1]}` : ': complete! 🏆'}`, sub: ms.next ? `👉 ${ms.hint}` : 'You freed the Lexicon. They sing about you in every tavern!', fn: () => sgMainLog() },
    ...log.active.map(q => ({ label: `${{ fetch: '🧺', hunt: '⚔️', deliver: '📦' }[q.type] || '❗'} ${q.desc}`,
      sub: q.type === 'fetch' ? `You have ${s.bag[q.item] || 0} of ${q.n}.${sgQReady(q) ? ' Ready to hand in!' : ''} · ${sgQRewardText(q.reward)}` : q.type === 'hunt' ? `${q.got} of ${q.n} defeated.${sgQReady(q) ? ' Go tell them!' : ''} · ${sgQRewardText(q.reward)}` : `Walk into ${q.toName}. · ${sgQRewardText(q.reward)}`,
      fn: () => sgMenu(`${esc(q.desc)}`, [{ label: '↩️ Back', fn: () => sgQuestLog() }, { label: '🗑️ Give up this quest', fn: () => { log.active = log.active.filter(x => x !== q); sgSaveNow(true); sgSay('You drop the quest. Maybe someone else will help.', () => sgQuestLog()); } }], () => sgQuestLog()) })),
    ...(log.active.length ? [] : [{ label: '❗ No side quests right now', sub: 'Look for a ❗ over someone’s head in town. New requests every day.', fn: () => sgQuestLog() }]),
    { label: `✅ Side quests finished: ${log.done}`, sub: (log.log || []).slice(0, 3).map(x => x.desc).join(' · ') || 'None yet.', fn: () => sgQuestLog(log.active.length + 1) }],
    () => sgMainMenu(), { sel, big: true });
}
function sgMainLog() {
  const s = sgS(), ms = sgMainStatus(s);
  sgMenu(`📖 Main quest · ${ms.done} of ${ms.total} chapters done`, SG_MAIN.map(([k, label], i) => {
    const done = !!s.flags[k], now = ms.next && ms.next[0] === k;
    return { label: done ? `✅ ${label}` : now ? `👉 ${label}` : '❔ ???', sub: now ? ms.hint : done ? '' : 'Keep playing to find out.', disabled: !done && !now, fn: () => now ? sgSay(`👉 ${ms.hint}`, () => sgMainLog()) : sgMainLog() };
  }), () => sgQuestLog(), { sel: Math.max(0, ms.done), big: true });
}
{ const base = sgMainMenuMore; sgMainMenuMore = function () { return [{ label: '📜 Quest log', fn: () => sgQuestLog() }, ...base.apply(this, arguments)]; }; }
{ const base = sgFixMore; sgFixMore = function (s) { base(s); s.quests ||= { active: [], done: 0, log: [], offered: {} }; s.quests.offered ||= {}; s.quests.active ||= []; }; }
