'use strict';
/* ================= Wordling Trails: world data (all original) =================
   Creatures, moves, items, maps and story. trails.js is the game engine.
   Story: the Hush Syndicate says it "protects" words by locking them in its Grand Archive,
   then charges people a WordLock fee to use them. Beat the eight Hall Leaders (one Badge each),
   their four lieutenants, and finally Director Vex to set the words free. */
const TR_PAL = ['#e0ecc0', '#a8c66c', '#5a8a4a', '#1f3a2b'];
const TR_TYPES = { verb: { name: 'Verb', icon: '⚡' }, noun: { name: 'Noun', icon: '🪨' }, adj: { name: 'Adjective', icon: '🌸' } };
const TR_BEATS = { verb: 'noun', noun: 'adj', adj: 'verb' };
const TR_SPECIES = {
  quillip:    { name: 'Quillip',    type: 'verb', hp: 42, atk: 54, def: 40, blurb: 'A quick ink bird. Its tail feather writes little notes in the air as it flies.' },
  mossling:   { name: 'Mossling',   type: 'noun', hp: 54, atk: 44, def: 54, blurb: 'A sleepy turtle with a garden growing on its shell. Slow, but very sturdy.' },
  petalwisp:  { name: 'Petalwisp',  type: 'adj',  hp: 46, atk: 50, def: 44, blurb: 'A flower sprite that changes how bright it glows to match its mood.' },
  inkblob:    { name: 'Inkblob',    type: 'noun', hp: 48, atk: 40, def: 42, blurb: 'A puddle of spilled ink that learned to wobble around. It leaves dotted trails.' },
  buzzlet:    { name: 'Buzzlet',    type: 'verb', hp: 38, atk: 46, def: 36, blurb: 'A tiny busy bee. It never stops doing something.' },
  bookmite:   { name: 'Bookmite',   type: 'noun', hp: 44, atk: 42, def: 48, blurb: 'A bookworm with round glasses. It lives inside dictionaries and nibbles the margins.' },
  hushmoth:   { name: 'Hushmoth',   type: 'adj',  hp: 46, atk: 50, def: 46, blurb: 'Its soft wings make the whole forest feel calm and quiet.' },
  fernfox:    { name: 'Fernfox',    type: 'adj',  hp: 50, atk: 56, def: 44, blurb: 'A clever fox whose tail is a curled fern leaf.' },
  zapwick:    { name: 'Zapwick',    type: 'verb', hp: 44, atk: 60, def: 40, blurb: 'A candle spirit. Its flame flickers faster when it gets excited.' },
  folduck:    { name: 'Folduck',    type: 'verb', hp: 48, atk: 56, def: 46, blurb: 'A paper duck folded from an old homework page. It floats on any breeze.' },
  cobblepup:  { name: 'Cobblepup',  type: 'noun', hp: 56, atk: 52, def: 58, blurb: 'A loyal puppy made of round river stones.' },
  lumabat:    { name: 'Lumabat',    type: 'adj',  hp: 48, atk: 58, def: 48, blurb: 'A bat that carries a little lantern to read in the dark.' },
  ripplet:    { name: 'Ripplet',    type: 'verb', hp: 46, atk: 54, def: 44, blurb: 'A raindrop that never stops splashing. It hums when it is happy.' },
  gustling:   { name: 'Gustling',   type: 'verb', hp: 44, atk: 60, def: 42, blurb: 'A little swirl of wind that loves to flip pages.' },
  sparkhorn:  { name: 'Sparkhorn',  type: 'verb', hp: 54, atk: 66, def: 50, blurb: 'A young deer whose antlers crackle with tiny sparks.' },
  anchorcrab: { name: 'Anchorcrab', type: 'noun', hp: 56, atk: 54, def: 64, blurb: 'It carries an old anchor on its back and never lets go of it.' },
  boulderbear:{ name: 'Boulderbear',type: 'noun', hp: 66, atk: 62, def: 64, blurb: 'A gentle giant covered in mossy rocks. It naps for weeks.' },
  tomeguard:  { name: 'Tomeguard',  type: 'noun', hp: 60, atk: 60, def: 68, blurb: 'A living book in armor that protects old libraries.' },
  glimmeray:  { name: 'Glimmeray',  type: 'adj',  hp: 52, atk: 62, def: 50, blurb: 'A sea ray whose skin sparkles like sunlight on water.' },
  emberling:  { name: 'Emberling',  type: 'adj',  hp: 50, atk: 64, def: 48, blurb: 'A warm little cat with a tail like a candle flame.' },
  shadeowl:   { name: 'Shadeowl',   type: 'adj',  hp: 56, atk: 62, def: 56, blurb: 'A dim, wise owl. It only hoots when everyone is quiet.' },
  grammaroth: { name: 'Grammaroth', type: 'noun', hp: 70, atk: 64, def: 62, blurb: 'An ancient guardian of the Lexicon. Its armor is covered in letters.' },
  mutewyrm:   { name: 'Mutewyrm',   type: 'adj',  hp: 78, atk: 70, def: 66, blurb: 'A serpent the Syndicate trained to swallow words. Its mouth is sealed with a zipper.' },
};
const TR_MOVES = {
  strike: { name: 'Strike', power: 40, desc: 'A simple hit.' },
  dash:   { name: 'Action Dash', power: 58, type: 'verb', desc: 'A Verb move. Strong against Nouns.' },
  heavy:  { name: 'Heavy Noun', power: 58, type: 'noun', desc: 'A Noun move. Strong against Adjectives.' },
  dazzle: { name: 'Dazzle', power: 58, type: 'adj', desc: 'An Adjective move. Strong against Verbs.' },
  focus:  { name: 'Focus', power: 0, desc: 'Your next hit is almost twice as strong.' },
  guard:  { name: 'Guard', power: 0, desc: 'Takes much less damage from the next hit.' },
  surge:  { name: 'Word Surge', power: 82, desc: 'A huge hit that works on every type. Learned at level 18.' },
  // moves that come on USB drives (sold in shops; a drive is never used up)
  peptalk:     { name: 'Pep Talk', power: 0, heal: 0.35, desc: 'Cheers itself up and gets back 35% of its HP.' },
  papercut:    { name: 'Paper Cut', power: 68, type: 'verb', desc: 'A sharp Verb move. Strong against Nouns.' },
  anchordrop:  { name: 'Anchor Drop', power: 68, type: 'noun', desc: 'A heavy Noun move. Strong against Adjectives.' },
  blazebright: { name: 'Blazing Bright', power: 68, type: 'adj', desc: 'A fiery Adjective move. Strong against Verbs.' },
  wordleech:   { name: 'Word Leech', power: 52, drain: 0.5, desc: 'Hits, then takes back half the damage as HP.' },
  freezeframe: { name: 'Freeze Frame', power: 44, type: 'adj', stun: 0.6, desc: 'An icy Adjective move. Often freezes the foe so it skips its next turn.' },
  plottwist:   { name: 'Plot Twist', power: 44, hits: 2, desc: 'A surprise attack that hits twice in a row.' },
  echoblast:   { name: 'Echo Blast', power: 100, recoil: 0.2, desc: 'A huge blast that works on every type, but the echo hurts your Wordling a little too.' },
  starfall:    { name: 'Starfall Syntax', power: 112, desc: 'The strongest move in the land. Works on every type.' },
};
const TR_SPECIAL = { verb: 'dash', noun: 'heavy', adj: 'dazzle' };
const TR_TEAM_MAX = 5;
const TR_ITEMS = {
  potion: { name: 'Potion', icon: '🧃', price: 30, heal: 0.25, desc: 'Heals 25% of a Wordling’s HP.' },
  tonic: { name: 'Tonic', icon: '🍵', price: 70, heal: 0.5, desc: 'Heals 50% of a Wordling’s HP.' },
  grandtonic: { name: 'Grand tonic', icon: '🧋', price: 140, heal: 0.75, desc: 'Heals 75% of a Wordling’s HP.' },
  elixir: { name: 'Elixir', icon: '🫖', price: 250, heal: 1, desc: 'Heals 100% of a Wordling’s HP.' },
  picnic: { name: 'Picnic basket', icon: '🧺', price: 320, teamHeal: 0.4, desc: 'Heals 40% HP for every awake Wordling on your team.' },
  sprout: { name: 'Revive sprout', icon: '🌱', price: 90, revive: 0.25, desc: 'Wakes up a fainted Wordling with 25% of its HP.' },
  revive: { name: 'Revive leaf', icon: '🌿', price: 160, revive: 0.5, desc: 'Wakes up a fainted Wordling with 50% of its HP.' },
  bloom: { name: 'Sunrise bloom', icon: '🌼', price: 420, revive: 1, desc: 'Wakes up a fainted Wordling with 100% of its HP.' },
  charm: { name: 'Block ball', icon: '🧊', price: 40, desc: 'Throw it at a weak wild Wordling to catch it.' },
  goldcharm: { name: 'Gold block ball', icon: '✨', price: 120, desc: 'A much better chance to catch.' },
  wordcharm: { name: 'Word charm', icon: '🍃', price: 60, repel: 100, desc: 'Wild Wordlings stay away for 100 steps.' },
  bigcharm: { name: 'Grand word charm', icon: '🍀', price: 150, repel: 250, desc: 'Wild Wordlings stay away for 250 steps.' },
  usb_peptalk: { name: 'USB drive', icon: '💾', price: 300, drive: 'peptalk', desc: '' },
  usb_papercut: { name: 'USB drive', icon: '💾', price: 600, drive: 'papercut', desc: '' },
  usb_anchordrop: { name: 'USB drive', icon: '💾', price: 900, drive: 'anchordrop', desc: '' },
  usb_blazebright: { name: 'USB drive', icon: '💾', price: 1300, drive: 'blazebright', desc: '' },
  usb_wordleech: { name: 'USB drive', icon: '💾', price: 1800, drive: 'wordleech', desc: '' },
  usb_freezeframe: { name: 'USB drive', icon: '💾', price: 2400, drive: 'freezeframe', desc: '' },
  usb_plottwist: { name: 'USB drive', icon: '💾', price: 3000, drive: 'plottwist', desc: '' },
  usb_echoblast: { name: 'USB drive', icon: '💾', price: 3800, drive: 'echoblast', desc: '' },
  usb_starfall: { name: 'USB drive', icon: '💾', price: 4800, drive: 'starfall', desc: '' },
  rareink: { name: 'Rare ink', icon: '🖋️', desc: 'Raises one Wordling by a level. Found, not sold.' },
};
const TR_KEY_ITEMS = { scooter: { name: 'Trail scooter', icon: '🛴', desc: 'Ride twice as fast outdoors. Press the scooter key (R).' }, whistle: { name: 'Crane whistle', icon: '🕊️', desc: 'Call a paper crane to fly to any town you have visited.' }, pass: { name: 'Ferry pass', icon: '🎫', desc: 'Lets you ride the ferry from Saltwick Harbor.' } };

/* ---------- Random chatter for townspeople ---------- */
const TR_CHAT = {
  any: ['I read three words today. Personal best!', 'Have you tried studying a little every day? It really adds up.', 'My Wordling ate my homework. It was a Bookmite, so… fair.',
    'Fast answers make critical hits. I practice with flashcards at breakfast.', 'Clinics heal your team for free. Don’t be shy!', 'Gold block balls are pricey, but they work wonders.',
    'Tall grass at night is spooky. Daytime grass is just… grass.', 'I named my Inkblob “Splotch”. It doesn’t answer to it.', 'If a Wordling is the same type as your move, nothing special happens. Mix your team!',
    'Did you know? Word Surge hits every type hard.', 'Somebody said the ferry captain once sailed around the whole map. Twice.'],
  syndicate: ['People in grey coats keep taking words off the signs. They say it’s “for safekeeping”.', 'The Hush Syndicate wants us to pay a WordLock fee to say “hello”. Can you believe it?',
    'A man in grey offered to “protect” my favorite word. I said no. Now I can’t remember it…', 'They call themselves helpers, but helpers don’t lock words in a vault.'],
  after: ['The words are back on the signs! Thank you!', 'I heard Director Vex now volunteers at the library. Funny how things work out.', 'Everyone is talking about the explorer who beat the Hush Syndicate. That’s you, right?'],
};

/* ---------- Map builder for routes, caves and the library ---------- */
function trRng(seed) { let s = seed >>> 0 || 1; return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296; }
const TR_THEMES = { out: { wall: '#', path: 'P', open: '.', grass: ',', deco: 'F' }, cave: { wall: 'C', path: ';', open: ';', grass: ':', deco: 'o' }, library: { wall: 'K', path: ';', open: ';', grass: ':', deco: 'o' } };
function trGenMap({ w, h, seed, theme = 'out', points, open = 0.6, grass = 0.55, clear = [] }) {
  const T = TR_THEMES[theme], R = trRng(seed), g = [...Array(h)].map(() => Array(w).fill(T.wall)), path = [];
  const inside = (x, y) => x > 0 && y > 0 && x < w - 1 && y < h - 1;
  const put = (x, y, c) => { if (inside(x, y)) g[y][x] = c; };
  const carve = (x, y) => { for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (inside(x + dx, y + dy) && g[y + dy][x + dx] !== T.path) { g[y + dy][x + dx] = T.path; path.push([x + dx, y + dy]); } };
  for (let i = 0; i < points.length - 1; i++) {
    let [x, y] = points[i]; const [tx, ty] = points[i + 1];
    x = Math.max(1, Math.min(w - 3, x)); y = Math.max(1, Math.min(h - 3, y));
    const gx = Math.max(1, Math.min(w - 3, tx)), gy = Math.max(1, Math.min(h - 3, ty));
    carve(x, y);
    while (x !== gx || y !== gy) {
      const horiz = x !== gx && (y === gy || R() < 0.5), len = 1 + Math.floor(R() * 4);
      for (let k = 0; k < len && (horiz ? x !== gx : y !== gy); k++) { if (horiz) x += Math.sign(gx - x); else y += Math.sign(gy - y); carve(x, y); }
    }
  }
  for (const [x, y] of path.slice()) if (R() < open) {               // open the land around the path
    const rx = 1 + Math.floor(R() * 3), ry = 1 + Math.floor(R() * 2);
    for (let yy = y - ry; yy <= y + ry; yy++) for (let xx = x - rx; xx <= x + rx; xx++) if (inside(xx, yy) && g[yy][xx] === T.wall) g[yy][xx] = T.open;
  }
  for (const [x0, y0, cw, ch] of clear) for (let y = y0; y < y0 + ch; y++) for (let x = x0; x < x0 + cw; x++) put(x, y, T.open);
  const blobs = Math.round(w * h / 60 * grass);                      // patches of tall grass (or gravel / carpet)
  for (let b = 0; b < blobs; b++) {
    const cx = 1 + Math.floor(R() * (w - 2)), cy = 1 + Math.floor(R() * (h - 2)), r = 1.2 + R() * 2.2;
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++)
      if (inside(x, y) && (x - cx) ** 2 + (y - cy) ** 2 <= r * r && g[y][x] === T.open) g[y][x] = T.grass;
  }
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (g[y][x] === T.open && R() < 0.035) g[y][x] = T.deco;
  for (const [x, y] of points) {                                     // openings on the edges, 2 tiles wide
    if (y === 0 || y === h - 1) { g[y][x] = g[y][x + 1] = T.path; g[y === 0 ? 1 : h - 2][x] = g[y === 0 ? 1 : h - 2][x + 1] = T.path; }
    if (x === 0 || x === w - 1) { g[y][x] = g[y + 1][x] = T.path; g[y][x === 0 ? 1 : w - 2] = g[y + 1][x === 0 ? 1 : w - 2] = T.path; }
  }
  return { rows: g.map(r => r.join('')), path, R };
}
/* place trainers on the path and items on open ground (deterministic) */
function trPlace(map, built, seed) {
  const R = trRng(seed + 77), rows = built.rows, T = TR_THEMES[map.theme || 'out'];
  const free = (x, y) => rows[y] && TR_WALKABLE.has(rows[y][x]) && !map.npcs.some(n => n.x === x && n.y === y) && !(map.items || []).some(i => i.x === x && i.y === y);
  for (const n of map.npcs) if (n.at != null) {
    const path = built.path.filter(([x, y]) => y > 2 && y < rows.length - 3);
    let [x, y] = path[Math.floor(n.at * (path.length - 1))];
    if (!free(x, y)) [x, y] = path.find(([a, b]) => free(a, b));
    n.x = x; n.y = y;
    n.dir = rows[y][x + 1] === T.path ? 'right' : rows[y][x - 1] === T.path ? 'left' : rows[y + 1]?.[x] === T.path ? 'down' : 'up';
    delete n.at;
  }
  const opens = []; rows.forEach((r, y) => [...r].forEach((c, x) => { if ((c === T.open || c === T.grass) && x > 1 && y > 1 && x < r.length - 2 && y < rows.length - 2) opens.push([x, y]); }));
  for (const it of map.items || []) if (it.x == null) { for (let t = 0; t < 50; t++) { const [x, y] = opens[Math.floor(R() * opens.length)]; if (free(x, y)) { it.x = x; it.y = y; break; } } }
}
/* Ledges: v hop down, { hop left, } hop right. You can only go over them in that direction. */
const TR_LEDGES = { v: 'down', '{': 'left', '}': 'right' };
const TR_WALKABLE = new Set(['.', ',', 'P', 'F', '~', ';', ':', 'o', '=', 'u']);   // 'u' is a rug indoors   // '=' is beach sand

/* ---------- Halls and the Grand Archive (inside rooms) ---------- */
const TR_HALL_ROWS = ['XXXXXXXXXXXX', 'XK;;;;;;;;KX', 'XK;;;;;;;;KX', 'XKKK;;;;KKKX', 'X;;;;;;;;;;X', 'X;KK;;;;KK;X', 'X;;;;;;;;;;X', 'XKKK;;;;KKKX', 'X;;;;;;;;;;X', 'X;;;;;;;;;;X', 'X;;;;;;;;;;X', 'XXXXX;;XXXXX'];
const trHall = (name, back, leader, t1, t2, theme = 'hall', song = 'town') => ({ name, theme, song, indoor: true, rows: TR_HALL_ROWS, back,
  npcs: [{ ...leader, x: 5, y: 2, dir: 'down', noSight: true }, { ...t1, x: 3, y: 8, dir: 'right' }, { ...t2, x: 8, y: 4, dir: 'left' }] });
const TR_ELITE_ROWS = ['XXXXXDXXXXXX', 'XK;;;;;;;;KX', 'X;;;;;;;;;;X', 'X;;;;;;;;;;X', 'XKK;;;;;;KKX', 'X;;;;;;;;;;X', 'X;;;;::;;;;X', 'X;;;;::;;;;X', 'XXXXX::XXXXX'];
const trElite = (name, theme, k, elite) => ({ name, theme, song: 'town', indoor: true, items: [], rows: TR_ELITE_ROWS, back: { map: 'plaza', x: 10, y: 4 }, entry: { x: 5, y: 7 },
  doors: { '5,0': { hall: k < 4 ? 'elite' + (k + 1) : 'champion', open: s => !!s.beaten['elite' + k], shut: [`The door is locked tight. Beat ${elite.trainer.name} first!`] } },
  npcs: [{ ...elite, x: 6, y: 2, dir: 'down', look: 1, noSight: true }] });
const trTeam = (...a) => a.map(x => x.split(' ')).map(([sp, lv]) => [sp, +lv]);
const GRUNT = (id, team, lines, after) => ({ id, look: 5, trainer: { name: 'Syndicate member', team: trTeam(...team), reward: 90, nuts: 2, syndicate: true, intro: lines, win: ['Hmph. This changes nothing. The Director will lock those words up anyway.'], after: [after || 'We’re just… keeping words safe. For a small fee.'] } });

const TR_MAPS = {
  town: { name: 'Inkwell Town', song: 'town', fly: { x: 5, y: 11 }, shop: ['potion', 'sprout', 'charm', 'wordcharm', 'usb_peptalk'], rows: [
    '#########PP#########', '#FF......PP......FF#', '#.RRRR...PP..RRRR..#', '#.HHHH...PP..HHHH..#', '#.HDHH...PP..HHDH..#', '#..P.....PP....P...#',
    '#..PPPPPPPPPPPPP...#', '#.......SPP........#', '#..BBBB..PP..MMMM..#', '#..HHHH..PP..HHHH..#', '#..HHDH..PP..HDHH..#', '#....P...PP...P....#',
    '#F...PPPPPPPPPP...F#', '#FF..............FF#', '#WWWW..........WWWW#', '####################'],
    exits: { top: 'route' }, doors: { '3,4': 'home', '15,4': 'elder', '5,10': 'rest', '14,10': 'shop' },
    signs: { '8,7': 'INKWELL TOWN. North: Quill Path, then Whisper Woods and Lexicon Town.' },
    npcs: [{ id: 'kid', x: 6, y: 13, dir: 'down', look: 2, wander: 1, chat: true, lines: ['Tall grass is where Wordlings hide! Answer cards right to hit them.'] },
      { id: 'gran', x: 12, y: 7, dir: 'down', look: 1, lines: ['Verbs beat Nouns, Nouns beat Adjectives, and Adjectives beat Verbs.', 'Remember that and you will do fine, dear.'] },
      { id: 'walker1', x: 16, y: 12, dir: 'left', look: 2, wander: 2, chat: true }] },
  route: { name: 'Quill Path', song: 'route', rows: [
    '#########PP#########', '#,,,,,,,,PP,,,,,,,,#', '#,,,,,,,,PP,,,,,,,,#', '#,,##....PP....##,,#', '#,,##....PP....##,,#', '#........PP........#',
    '#..,,,,,,PP,,,,,,..#', '#..,,,,,,PP,,,,,,..#', '#..,,,,,,PP,,,,,,..#', '#........PP........#', '###.....SPP.....####', '#,,,,...PPPP...,,,,#',
    '#,,,,...PPPP...,,,,#', '#vvvvvvv.PP.vvvvvvv#', '#....FF..PP..FF....#', '#WWW.....PP.....WWW#', '#WWW.....PP.....WWW#', '#,,,,,,,,PP,,,,,,,,#',
    '#,,,,,,,,PP,,,,,,,,#', '#########PP#########'],
    exits: { top: 'woods', bottom: 'town' }, signs: { '8,10': 'QUILL PATH. Wordlings love this grass. Keep a Potion handy!' },
    wild: [['inkblob', 2, 4], ['buzzlet', 2, 4], ['bookmite', 3, 4], ['inkblob', 3, 5]],
    items: [{ id: 'r1', x: 16, y: 5, give: { potion: 2 } }, { id: 'r2', x: 2, y: 12, give: { charm: 2 } }],
    npcs: [{ id: 'mara', x: 7, y: 9, dir: 'right', look: 3, trainer: { name: 'Scout Mara', team: trTeam('buzzlet 4', 'inkblob 5'), reward: 120, nuts: 3,
      intro: ['Hey! You look new. Let’s see what your Wordlings can do!'], win: ['Wow, you know your words!'], after: ['The woods up north have stronger Wordlings. Train here first!'] } }] },
  woods: { name: 'Whisper Woods', song: 'woods', rows: [
    '#########PP#########', '###,,,,,,PP,,,,,,###', '##,,,,,,,PP,,,,,,,##', '##,,###,,PP,,###,,##', '##,,###,,PP,,###,,##', '##,,,,,,,PPPPPP,,,##',
    '######,,,,,,,,PP####', '##,,,,,,,,,,,,PP,,##', '##,,PPPPPPPPPPPP,,##', '##,,PP##########,,##', '##,,PP,,,,S,,,,,,,##', '##,,PPPPPPP,,,,,,,##',
    '##vvvvvvvPPvvvvvvv##', '####,,,,,PP,,,,#####', '##,,,,,,,PP,,,,,,,##', '##FF,,,,,PP,,,,,FF##', '#########PP#########'],
    exits: { top: 'lexicon', bottom: 'route' }, signs: { '10,10': 'WHISPER WOODS. Lexicon Town is just north. Shh… something is fluttering.' },
    wild: [['hushmoth', 4, 6], ['fernfox', 4, 6], ['zapwick', 5, 6], ['folduck', 5, 7], ['cobblepup', 5, 7], ['lumabat', 6, 7]],
    items: [{ id: 'w1', x: 3, y: 14, give: { rareink: 1 } }, { id: 'w2', x: 16, y: 7, give: { potion: 2 } }],
    npcs: [{ id: 'tomas', x: 12, y: 11, dir: 'left', look: 4, trainer: { name: 'Ranger Tomás', team: trTeam('fernfox 7', 'cobblepup 7', 'hushmoth 8'), reward: 250, nuts: 4,
      intro: ['Halt! Only strong learners may pass to Lexicon Town.'], win: ['Excellent. Iris will be happy to meet you.'], after: ['Hall Leader Iris waits in the big hall in Lexicon Town.'] } }] },
  lexicon: { name: 'Lexicon Town', song: 'town', fly: { x: 5, y: 8 }, shop: ['potion', 'tonic', 'sprout', 'charm', 'wordcharm', 'usb_papercut'], rows: [
    '################PP##', '#FF....GGGGGG....LF#', '#......HHHHHH......#', '#......HHHDHH......#', '#.........P........#', '#..BBBB...P..MMMM..#',
    '#..HHHH...P..HHHH..#', '#..HHDH...P..HDHH..#', '#....P....P...P....#', '#....PPPPPPPPPP....#', '#F.......SP.......F#', '#........PPP.......#',
    '#FF......PP......FF#', '#########PP#########'],
    exits: { top: 'bridge', bottom: 'woods' }, doors: { '10,3': { hall: 'hall1' }, '5,7': 'rest', '14,7': 'shop' },
    signs: { '9,10': 'LEXICON TOWN. Home of the first Hall. North: Rune Bridge.' },
    npcs: [{ id: 'scholar', x: 3, y: 11, dir: 'right', look: 1, wander: 2, chat: true, lines: ['Hall Leaders give you a Badge when you beat them. There are eight in all.'] },
      { id: 'guard1', x: 16, y: 1, dir: 'down', look: 4, gate: { open: s => trSeals(s) >= 1, lines: ['Sorry! Rune Bridge is closed to beginners.', 'Beat Hall Leader Iris and show me her Lexicon Badge, then you can pass.'] } },
      GRUNT('g0', ['inkblob 7'], ['Oh! Uh… nothing to see here. Just borrowing the word on this sign.'], 'Move along. The Hush Syndicate is busy “helping”.')].map((n, i) => i === 2 ? { ...n, x: 15, y: 9, dir: 'left' } : n) },
  hall1: trHall('Lexicon Hall', { map: 'lexicon', x: 10, y: 4 },
    { id: 'iris', look: 1, trainer: { name: 'Hall Leader Iris', seal: 1, team: trTeam('lumabat 10', 'folduck 10', 'grammaroth 12'), reward: 600, nuts: 8,
      intro: ['Welcome to the Lexicon Hall.', 'Every card you learn makes your Wordlings stronger. Show me!'], win: ['Wonderful! Take the Lexicon Badge. ✨', 'The guard at the north gate will let you pass now.'], after: ['Rune Bridge leads to Saltwick Harbor. Be careful: people in grey coats have been seen there.'] } },
    { id: 'h1a', look: 2, trainer: { name: 'Student Leo', team: trTeam('bookmite 8', 'inkblob 8'), reward: 100, nuts: 2, intro: ['I’m Iris’s best student! Probably.'], win: ['I need more flashcards…'], after: ['Iris uses all three types. Bring a mixed team!'] } },
    { id: 'h1b', look: 3, trainer: { name: 'Student Nia', team: trTeam('petalwisp 9'), reward: 100, nuts: 2, intro: ['Let’s see how fast you answer!'], win: ['Fast AND right. Wow.'], after: ['Fast answers hit harder. Iris taught me that.'] } }),
  bridge: { name: 'Rune Bridge', song: 'route', rows: [
    '#########PP#########', '#,,,,,,,,PP,,,,,,,,#', '#,,,,....PP....,,,,#', '#,,,.....PP.....,,,#', '#WWWWWWWW~~WWWWWWWW#', '#WWWWWWWW~~WWWWWWWW#',
    '#WWWWWWWW~~WWWWWWWW#', '#WWWWWWWW~~WWWWWWWW#', '#WWWWWWWW~~WWWWWWWW#', '#....,,,.PP.,,,....#', '#.,,,,,,.PP.,,,,,,.#', '#.,,,,,,.PP.,,,,,,.#',
    '#...##...PP...##...#', '#...##...PP...##...#', '#,,,,,,,,PP,,,,,,,,#', '#,,,,,,,,PP,,,,,,,,#', '#........PP........#', '#WW......PP......WW#',
    '#WW......PP......WW#', '#########PP#########'],
    exits: { top: 'saltwick', bottom: 'lexicon' }, wild: [['ripplet', 9, 12], ['anchorcrab', 9, 11], ['gustling', 10, 12], ['buzzlet', 9, 11], ['glimmeray', 11, 12]],
    items: [{ id: 'b1', x: 4, y: 3, give: { tonic: 1 } }, { id: 'b2', x: 17, y: 16, give: { goldcharm: 1 } }, { id: 'b3', x: 2, y: 13, give: { coins: 150 } }],
    npcs: [{ id: 'quell', x: 9, y: 6, dir: 'down', look: 5, leaves: true, trainer: { name: 'Lt. Quell', boss: true, team: trTeam('zapwick 11', 'inkblob 12', 'buzzlet 13'), reward: 400, nuts: 6, syndicate: true,
        intro: ['Stop right there. This bridge is now WordLock property.', 'Crossing costs one word. Your favorite one. Hand it over!'], win: ['You… you kept all your words? Impossible!', 'The Director will hear about this. I’m out of here!'] } },
      { ...GRUNT('g1', ['ripplet 10', 'anchorcrab 10'], ['Lt. Quell says nobody crosses without paying!'], ''), x: 10, y: 6, dir: 'down', leaves: true }] },
  saltwick: { name: 'Saltwick Harbor', song: 'town', fly: { x: 6, y: 4 }, shop: ['potion', 'tonic', 'sprout', 'revive', 'charm', 'goldcharm', 'wordcharm', 'bigcharm', 'usb_anchordrop'], rows: [
    '####################', '#F..BBBB....MMMM..F#', '#...HHHH....HHHH...#', '#...HHDH....HDHH...#', '#.....P......P.....#', '#..PPPPPPPPPPPPPP..#',
    '#..P....S.......P..#', '#..P..GGGGGG....PWW#', '#..P..HHHHHH....~WW#', '#..P..HHHDHH....~WW#', '#..P.....P......~WW#', '#..PPPPPPP......WWW#',
    '#F.......PP.......F#', '#FF......PP.....FFF#', '#########PP#########'],
    exits: { bottom: 'bridge' }, doors: { '6,3': 'rest', '13,3': 'shop', '9,9': { hall: 'hall2' } },
    signs: { '8,6': 'SALTWICK HARBOR. Ferry to Ember Ridge at the end of the pier.' },
    npcs: [{ id: 'ferry1', x: 16, y: 10, dir: 'up', look: 4, ferry: { to: 'ember', x: 4, y: 19, dir: 'right', name: 'Ember Ridge', open: s => trSeals(s) >= 2, closed: ['Ahoy! The ferry only carries explorers with two Badges.', 'Beat Captain Remy in the Harbor Hall first.'] } },
      { id: 'pip', x: 12, y: 12, dir: 'left', look: 2, give: { flag: 'scooter', key: 'scooter', ready: s => s.beaten.quell, before: ['I’m Pip, an inventor! I built a scooter, but those grey coats on the bridge scare me.', 'If someone chased them away, I’d give that hero my scooter…'],
        lines: ['You chased off Lt. Quell? You’re my hero!', 'Here, take my <b>Trail scooter</b> 🛴. Press <b>R</b> outdoors to ride twice as fast!'], after: ['How’s the scooter? Don’t ride it indoors!'] } },
      { id: 'sailor', x: 4, y: 12, dir: 'right', look: 3, wander: 2, chat: true }, { id: 'kid2', x: 14, y: 5, dir: 'down', look: 2, wander: 2, chat: true }] },
  hall2: trHall('Harbor Hall', { map: 'saltwick', x: 9, y: 10 },
    { id: 'remy', look: 4, trainer: { name: 'Captain Remy', seal: 2, team: trTeam('gustling 14', 'folduck 15', 'sparkhorn 16'), reward: 900, nuts: 9,
      intro: ['Ahoy! My Verbs move faster than the tide.', 'Answer quick, or get washed away!'], win: ['Ha! You sail through words like a pro. Take the Harbor Badge! ⚓', 'With two Badges, the ferry will take you to Ember Ridge.'], after: ['The Syndicate set up camp in Ember Cave. Their lieutenant is a tough one.'] } },
    { id: 'h2a', look: 3, trainer: { name: 'Deckhand Bo', team: trTeam('ripplet 12', 'buzzlet 13'), reward: 160, nuts: 2, intro: ['All hands on deck!'], win: ['Man overboard!'], after: ['Verbs are weak to Adjectives. Just saying.'] } },
    { id: 'h2b', look: 2, trainer: { name: 'Sailor Juno', team: trTeam('gustling 13', 'anchorcrab 13'), reward: 160, nuts: 2, intro: ['The wind is on my side!'], win: ['The wind changed…'], after: ['Captain Remy has never lost a race.'] } }),
  ember: { name: 'Ember Ridge', song: 'route', gen: { w: 20, h: 22, seed: 4111, points: [[4, 19], [12, 14], [6, 8], [9, 0]], clear: [[2, 18, 5, 3]] },
    exits: { top: 'cave' }, wild: [['emberling', 13, 15], ['sparkhorn', 13, 15], ['cobblepup', 13, 14], ['fernfox', 14, 16]],
    items: [{ id: 'e1', give: { tonic: 2 } }, { id: 'e2', give: { rareink: 1 } }, { id: 'e3', give: { coins: 200 } }],
    npcs: [{ id: 'ferry2', x: 2, y: 19, dir: 'right', look: 4, ferry: { to: 'saltwick', x: 16, y: 9, dir: 'up', name: 'Saltwick Harbor' } },
      { ...GRUNT('g2', ['emberling 13', 'zapwick 13'], ['Lt. Sable is busy in the cave. And the cave is… closed. Forever. Bye!']), at: 0.35 },
      { id: 'hiker', at: 0.7, look: 3, trainer: { name: 'Hiker Dov', team: trTeam('cobblepup 14', 'sparkhorn 14'), reward: 220, nuts: 2, intro: ['The ridge is steep, but my Wordlings are steeper!'], win: ['That doesn’t make sense, does it?'], after: ['Ember Cave is just north. It gets dark in there.'] } }] },
  cave: { name: 'Ember Cave', song: 'woods', theme: 'cave', gen: { w: 20, h: 18, seed: 5303, theme: 'cave', points: [[9, 17], [5, 12], [14, 9], [8, 4], [10, 0]], open: 0.7, grass: 0.8 },
    exits: { bottom: 'ember', top: 'cinderglen' }, wild: [['boulderbear', 15, 17], ['shadeowl', 15, 17], ['lumabat', 15, 16], ['inkblob', 15, 16], ['anchorcrab', 16, 17]],
    items: [{ id: 'c1', give: { revive: 1 } }, { id: 'c2', give: { elixir: 1 } }, { id: 'c3', give: { goldcharm: 2 } }],
    npcs: [{ id: 'sable', edge: 'top', k: 0, look: 5, leaves: true, trainer: { name: 'Lt. Sable', boss: true, team: trTeam('lumabat 16', 'emberling 17', 'boulderbear 17'), reward: 600, nuts: 7, syndicate: true,
        intro: ['So you’re the explorer who embarrassed Quell.', 'The words in this cave belong to the Syndicate now. They shine so nicely in our vault.'], win: ['Fine. Keep your silly words.', 'But the Director is already moving everything to the Grand Archive in Summit City.'] } },
      { ...GRUNT('g3', ['shadeowl 15', 'inkblob 15'], ['You won’t get past Lt. Sable!']), edge: 'top', k: 1, leaves: true },
      { ...GRUNT('g4', ['lumabat 15'], ['It’s dark. I’m scared. I mean… halt!']), at: 0.5 }] },
  cinderglen: { name: 'Cinderglen', song: 'town', fly: { x: 5, y: 11 }, shop: ['potion', 'tonic', 'grandtonic', 'elixir', 'sprout', 'revive', 'charm', 'goldcharm', 'wordcharm', 'bigcharm', 'usb_blazebright'], rows: [
    '#########PP#########', '#FF......PP......FF#', '#.RRRR...PP..GGGGG.#', '#.HHHH...PP..HHHHH.#', '#.HHDH...PP..HHDHH.#', '#...P....PP....P...#',
    '#...PPPPPPPPPPPP...#', '#.......SPP........#', '#..BBBB..PP..MMMM..#', '#..HHHH..PP..HHHH..#', '#..HHDH..PP..HDHH..#', '#....P...PP...P....#',
    '#F...PPPPPPPPPP...F#', '#FF......PP......FF#', '#########PP#########'],
    exits: { bottom: 'cave', top: 'highland' }, doors: { '4,4': 'home2', '15,4': { hall: 'hall3' }, '5,10': 'rest', '14,10': 'shop' },
    signs: { '8,7': 'CINDERGLEN. A warm town at the foot of the highlands.' },
    npcs: [{ id: 'guard3', x: 9, y: 1, dir: 'down', look: 4, gate: { open: s => trSeals(s) >= 3, lines: ['The Highland Trail is dangerous.', 'Come back with three Badges. Hall Leader Marisol lives right here!'] } },
      { id: 'guard3b', x: 10, y: 1, dir: 'down', look: 4, gate: { open: s => trSeals(s) >= 3, lines: ['Three Badges, please. Rules are rules!'] } },
      { id: 'cranekeeper', x: 12, y: 12, dir: 'left', look: 1, give: { flag: 'whistle', key: 'whistle', ready: s => s.beaten.sable, before: ['The Syndicate scared away my paper cranes. They hide while Lt. Sable is in the cave…'],
        lines: ['You beat Lt. Sable! My cranes came home!', 'Take this <b>Crane whistle</b> 🕊️. Use it from your bag to fly to any town you’ve visited.'], after: ['My cranes can fly you anywhere you’ve been. Just whistle!'] } },
      { id: 'cind1', x: 3, y: 13, dir: 'right', look: 3, wander: 2, chat: true }, { id: 'cind2', x: 16, y: 6, dir: 'down', look: 2, wander: 2, chat: true }] },
  hall3: trHall('Ember Hall', { map: 'cinderglen', x: 15, y: 5 },
    { id: 'marisol', look: 3, trainer: { name: 'Hall Leader Marisol', seal: 3, team: trTeam('emberling 19', 'glimmeray 19', 'fernfox 20', 'shadeowl 21'), reward: 1200, nuts: 10,
      intro: ['Adjectives make the world colorful. Bright, warm, fierce!', 'Show me how vivid your words are.'], win: ['Brilliant! Take the Ember Badge. 🔥', 'The north gate will open for you now.'], after: ['The Silent Library is past the Highland Trail. The Syndicate hides there.'] } },
    { id: 'h3a', look: 2, trainer: { name: 'Painter Lia', team: trTeam('emberling 17', 'hushmoth 17'), reward: 200, nuts: 2, intro: ['Let me paint you a battle!'], win: ['A masterpiece… of losing.'], after: ['Verbs beat Nouns, but Adjectives beat Verbs. Remember!'] } },
    { id: 'h3b', look: 4, trainer: { name: 'Poet Ansel', team: trTeam('glimmeray 18', 'petalwisp 18'), reward: 200, nuts: 2, intro: ['Roses are red, my Wordlings are bright…'], win: ['…and you won the fight.'], after: ['Marisol writes poems about her Wordlings.'] } }, 'hall', 'town'),
  highland: { name: 'Highland Trail', song: 'route', gen: { w: 20, h: 24, seed: 7719, points: [[9, 23], [4, 17], [15, 11], [7, 5], [9, 0]] },
    exits: { bottom: 'cinderglen', top: 'library' }, wild: [['gustling', 19, 22], ['sparkhorn', 19, 22], ['tomeguard', 20, 22], ['glimmeray', 19, 21], ['hushmoth', 19, 21]],
    items: [{ id: 'hl1', give: { elixir: 1 } }, { id: 'hl2', give: { rareink: 1 } }, { id: 'hl3', give: { coins: 300 } }],
    npcs: [{ ...GRUNT('g5', ['sparkhorn 19', 'emberling 19'], ['The Director needs every word in the land. It’s called “protection”. Look it up! Oh wait, you can’t, we have it.']), at: 0.3 },
      { id: 'climber', at: 0.6, look: 3, trainer: { name: 'Climber Ines', team: trTeam('boulderbear 20', 'gustling 20'), reward: 320, nuts: 3, intro: ['Up here, only the strong study!'], win: ['You’re a peak performer.'], after: ['The library ahead is so quiet you can hear a Shadeowl blink.'] } },
      { ...GRUNT('g6', ['tomeguard 20'], ['Turn back! The library is… closed for “inventory”.']), at: 0.85 }] },
  library: { name: 'Silent Library', song: 'woods', theme: 'library', gen: { w: 20, h: 18, seed: 9013, theme: 'library', points: [[9, 17], [15, 13], [4, 9], [14, 5], [9, 0]], open: 0.55, grass: 0.9 },
    exits: { bottom: 'highland', top: 'summit' }, wild: [['tomeguard', 21, 23], ['bookmite', 21, 23], ['shadeowl', 21, 23], ['zapwick', 21, 22]],
    items: [{ id: 'l1', give: { elixir: 1 } }, { id: 'l2', give: { revive: 2 } }],
    npcs: [{ id: 'murmur', edge: 'top', k: 0, look: 5, leaves: true, trainer: { name: 'Lt. Murmur', boss: true, team: trTeam('shadeowl 22', 'tomeguard 22', 'hushmoth 23'), reward: 800, nuts: 8, syndicate: true,
        intro: ['Shhh. This is a library.', 'Every word in here now carries a WordLock fee. Reading is a privilege, explorer.'], win: ['…Fine. You may read.', 'But Director Vex has the biggest vault of all, in Summit City’s Grand Archive.'] } },
      { ...GRUNT('g7', ['bookmite 21', 'zapwick 21'], ['Late fees! LATE FEES!']), edge: 'top', k: 1, leaves: true },
      { ...GRUNT('g8', ['shadeowl 21'], ['Quiet, please. I’m stealing.']), at: 0.45 }] },
  summit: { name: 'Summit City', song: 'town', fly: { x: 5, y: 10 }, shop: ['tonic', 'grandtonic', 'elixir', 'picnic', 'revive', 'goldcharm', 'wordcharm', 'bigcharm', 'usb_wordleech'], rows: [
    '#################PP#', '#FF.GGGGGGGG.....PP#', '#...HHHHHHHH..RRR..#', '#...HHHHDHHH..HHH..#', '#.......P.....HDH..#', '#..PPPPPPPPPPPPP...#',
    '#..P.....S.....P...#', '#..P.BBBB...GGGG...#', '#..P.HHHH...HHHH...#', '#..P.HDHH...HHDH...#', '#..P..P.......P....#', '#..PPPPPPPPPPPP....#',
    '#F.......PP.......F#', '#FF......PP......FF#', '#########PP#########'],
    exits: { bottom: 'library', top: 'frostpass' }, doors: { '8,3': { hall: 'archive', need: 8 }, '15,4': 'home3', '6,9': 'rest', '14,9': { hall: 'hall4' } },
    signs: { '9,6': 'SUMMIT CITY. The Grand Archive is at the top of the hill. North road: Frostwind Pass.' },
    npcs: [{ id: 'guard4', x: 17, y: 1, dir: 'down', look: 4, gate: { open: s => trSeals(s) >= 4, lines: ['The north road is for explorers with four Badges.', 'Archivist Oduya’s Hall is right here in Summit City!'] } },
      { id: 'guard4b', x: 18, y: 1, dir: 'down', look: 4, gate: { open: s => trSeals(s) >= 4, lines: ['Four Badges, please. The pass is cold and dangerous!'] } },
      { id: 'sum1', x: 16, y: 11, dir: 'left', look: 2, wander: 2, chat: true }, { id: 'sum2', x: 2, y: 12, dir: 'right', look: 3, wander: 2, chat: true },
      { id: 'sumshop', x: 17, y: 6, dir: 'left', look: 1, shopkeeper: true, lines: ['Need supplies? I have the best stock in the land.'] }] },
  hall4: trHall('Summit Hall', { map: 'summit', x: 14, y: 10 },
    { id: 'oduya', look: 1, trainer: { name: 'Archivist Oduya', seal: 4, team: trTeam('tomeguard 24', 'cobblepup 24', 'boulderbear 25', 'grammaroth 26'), reward: 1600, nuts: 12,
      intro: ['Nouns are the bones of language. Solid. Unbreakable.', 'Let’s see if your words can move a mountain.'], win: ['Magnificent. Take the Summit Badge. 🏔️', 'But the Grand Archive has eight locks. Four more Hall Leaders live beyond the north road.', 'Cross Frostwind Pass to Glimmerfrost. The guards will let you through now.'], after: ['The north road leads to Glimmerfrost, Fablemere, Sandscript and Starhaven. Win all their Badges.'] } },
    { id: 'h4a', look: 3, trainer: { name: 'Librarian Ruth', team: trTeam('anchorcrab 22', 'bookmite 22'), reward: 260, nuts: 2, intro: ['Shh! Battle quietly, please.'], win: ['That was… loud. Well done.'], after: ['Oduya’s Grammaroth is very tough. Use Verb moves!'] } },
    { id: 'h4b', look: 4, trainer: { name: 'Sculptor Kai', team: trTeam('boulderbear 23'), reward: 260, nuts: 2, intro: ['My Wordling is carved from solid rock!'], win: ['Cracked…'], after: ['Word Surge hits every type. Get to level 18!'] } }),
  archive: trHall('Grand Archive', { map: 'summit', x: 8, y: 4 },
    { id: 'vex', look: 5, trainer: { name: 'Director Vex', final: true, boss: true, team: trTeam('silkit 46', 'bricklet 46', 'sparkhorn 47', 'scrollworm 47', 'mutewyrm 50'), reward: 6000, nuts: 20, syndicate: true,
      intro: ['So. The little explorer with eight Badges.', 'Do you know what words are worth? Everything. So I locked them up, and people pay to borrow them.', 'Safe, tidy and profitable. Why would anyone want words to be free?', 'Mutewyrm will swallow every word you know. Let’s begin.'],
      win: ['No… my Mutewyrm…', 'You answered everything. Every single card.', 'Perhaps… words are meant to be shared. The vault is open. Take them back.'], after: ['I’ve decided to volunteer at the Silent Library. Shelving books. For free.'] } },
    GRUNT('ga', ['shadeowl 43', 'zapwick 43'], ['The Director is busy counting words. You can’t go in!']),
    GRUNT('gb', ['boulderbear 44'], ['Last line of defense! Probably!']), 'archive', 'boss'),
  frostpass: { name: 'Frostwind Pass', song: 'route', gen: { w: 20, h: 22, seed: 1307, points: [[9, 21], [4, 15], [15, 9], [9, 0]] },
    exits: { bottom: 'summit', top: 'glimmerfrost' },
    wild: [['chillpip', 25, 28], ['shimmerling', 25, 28], ['glidelet', 25, 28], ['chalkit', 26, 28], ['gustling', 25, 28], ['cozycub', 26, 28], ['twinklit', 26, 28, 0.4], ['blizzarion', 42, 46, 0.15, 'after']],
    items: [{ id: 'fp1', give: { grandtonic: 2 } }, { id: 'fp2', give: { sprout: 2 } }, { id: 'fp3', give: { coins: 400 } }],
    npcs: [{ ...GRUNT('g9', ['chillpip 26', 'zapwick 26'], ['The pass is closed for “snow removal”. We remove the snow AND your words.']), at: 0.3 },
      { id: 'skier', at: 0.65, look: 3, trainer: { name: 'Skier Noor', team: trTeam('frostfinch 27', 'gustling 27'), reward: 420, nuts: 3, intro: ['Out of my way, I’m skiing… right into a battle!'], win: ['Wipeout!'], after: ['Glimmerfrost is just over the pass. It sparkles all winter.'] } }] },
  glimmerfrost: { name: 'Glimmerfrost', song: 'town', fly: { x: 5, y: 11 }, shop: ['tonic', 'grandtonic', 'elixir', 'picnic', 'revive', 'bloom', 'charm', 'goldcharm', 'wordcharm', 'bigcharm', 'usb_freezeframe'], rows: [
    '#########PP#########', '#FF......PP......FF#', '#.GGGGG..PP..RRRR..#', '#.HHHHH..PP..HHHH..#', '#.HHDHH..PP..HHHH..#', '#...P....PP........#',
    '#...PPPPPPPP.......#', '#.......SPP........#', '#..BBBB..PP..MMMM..#', '#..HHHH..PP..HHHH..#', '#..HHDH..PP..HDHH..#', '#....P...PP...P....#',
    '#WW..PPPPPPPPPP..WW#', '#WWW.....PP.....WWW#', '#########PP#########'],
    exits: { bottom: 'frostpass', top: 'mirelands' }, doors: { '4,4': { hall: 'hall5' }, '5,10': 'rest', '14,10': 'shop' },
    signs: { '8,7': 'GLIMMERFROST. Home of the Frost Hall. North: Mirewood Marsh.' },
    water: [['shimmerling', 26, 28], ['splashkin', 26, 28], ['wavelet', 26, 28], ['opalfin', 30, 32, 0.3]],
    npcs: [{ id: 'guard5', x: 9, y: 1, dir: 'down', look: 4, gate: { open: s => trSeals(s) >= 5, lines: ['Mirewood Marsh is deep and muddy.', 'Come back with five Badges. Hall Leader Sora is right here in town!'] } },
      { id: 'guard5b', x: 10, y: 1, dir: 'down', look: 4, gate: { open: s => trSeals(s) >= 5, lines: ['Five Badges, please. Rules are rules, even in the snow!'] } },
      { id: 'icefisher', x: 12, y: 7, dir: 'down', look: 1, lines: ['The lakes here never freeze. Face the water and press A to fish!'] },
      { id: 'gf1', x: 6, y: 13, dir: 'up', look: 2, wander: 2, chat: true }, { id: 'gf2', x: 16, y: 6, dir: 'left', look: 3, wander: 2, chat: true }] },
  hall5: trHall('Frost Hall', { map: 'glimmerfrost', x: 4, y: 5 },
    { id: 'sora', look: 3, trainer: { name: 'Hall Leader Sora', seal: 5, team: trTeam('chillpip 29', 'brightbug 30', 'silkit 30', 'frostfinch 31'), reward: 2000, nuts: 13,
      intro: ['Welcome to the Frost Hall. Mind the ice!', 'Adjectives can be cool, crisp and sparkling. Can you keep up?'], win: ['Brrr-illiant! Take the Frost Badge. ❄️', 'The guards at the north gate will let you into Mirewood Marsh now.'], after: ['Fablemere is past the marsh. Storyteller Bramble tells the longest stories in the land.'] } },
    { id: 'h5a', look: 2, trainer: { name: 'Skater Mika', team: trTeam('shimmerling 27', 'cozycub 27'), reward: 320, nuts: 2, intro: ['Watch me spin!'], win: ['I spun right out…'], after: ['Sora’s Wordlings love the cold.'] } },
    { id: 'h5b', look: 4, trainer: { name: 'Snowsculptor Ren', team: trTeam('chalkit 28'), reward: 320, nuts: 2, intro: ['I carved my Wordling out of a snowbank. Kidding!'], win: ['Melted…'], after: ['Verb moves do well against Adjectives.'] } }),
  mirelands: { name: 'Mirewood Marsh', song: 'woods', gen: { w: 20, h: 22, seed: 2417, points: [[9, 21], [15, 16], [4, 10], [12, 5], [9, 0]], grass: 0.8 },
    exits: { bottom: 'glimmerfrost', top: 'fablemere' },
    wild: [['jellywob', 29, 32], ['rootlet', 29, 32], ['twigit', 29, 32], ['honeymote', 29, 32], ['dimdrop', 30, 32], ['ripplet', 29, 31], ['mufflekit', 30, 32], ['minikin', 30, 32, 0.5], ['grovekeeper', 42, 46, 0.15, 'after']],
    items: [{ id: 'mm1', give: { picnic: 1 } }, { id: 'mm2', give: { rareink: 1 } }, { id: 'mm3', give: { goldcharm: 2 } }],
    npcs: [{ ...GRUNT('g10', ['jellywob 30', 'inkblob 30'], ['Mud is sticky. So are our WordLock contracts!']), at: 0.3 },
      { id: 'fisher', at: 0.7, look: 3, trainer: { name: 'Fisher Wade', team: trTeam('ripplet 31', 'folduck 31'), reward: 460, nuts: 3, intro: ['Shh, you’ll scare the fish. Battle me quietly!'], win: ['The one that got away…'], after: ['Try fishing in the pond in Fablemere.'] } }] },
  fablemere: { name: 'Fablemere', song: 'town', fly: { x: 5, y: 11 }, shop: ['tonic', 'grandtonic', 'elixir', 'picnic', 'revive', 'bloom', 'charm', 'goldcharm', 'wordcharm', 'bigcharm', 'usb_plottwist'], rows: [
    '#########PP#########', '#F.......PP.......F#', '#.RRRR...PP..GGGGG.#', '#.HHHH...PP..HHHHH.#', '#.HHHH...PP..HHDHH.#', '#........PP....P...#',
    '#....PPPPPPPPPPP...#', '#....P..SPP........#', '#..BBBB..PP..MMMM..#', '#..HHHH..PP..HHHH..#', '#..HHDH..PP..HDHH..#', '#....P...PP...P....#',
    '#.WWWWW..PP........#', '#.WWWWW..PP.....FF.#', '#########PP#########'],
    exits: { bottom: 'mirelands', top: 'dunes' }, doors: { '15,4': { hall: 'hall6' }, '5,10': 'rest', '14,10': 'shop' },
    signs: { '8,7': 'FABLEMERE. Every house here has a story. North: the Echo Dunes.' },
    water: [['ripplet', 30, 32], ['shellbit', 30, 32], ['splashkin', 30, 32], ['tidalord', 44, 46, 0.15, 'after']],
    npcs: [{ id: 'guard6', x: 9, y: 1, dir: 'down', look: 4, gate: { open: s => trSeals(s) >= 6, lines: ['The Echo Dunes are hot and endless.', 'Come back with six Badges. Storyteller Bramble’s Hall is up the hill!'] } },
      { id: 'guard6b', x: 10, y: 1, dir: 'down', look: 4, gate: { open: s => trSeals(s) >= 6, lines: ['Six Badges, please. That’s how this story goes!'] } },
      { id: 'teller', x: 12, y: 5, dir: 'down', look: 1, lines: ['Long ago, words were free for everyone. Then the Syndicate came…', 'But every story has a hero. Maybe that’s you!'] },
      { id: 'fb1', x: 3, y: 11, dir: 'right', look: 2, wander: 2, chat: true }, { id: 'fb2', x: 16, y: 7, dir: 'left', look: 3, wander: 2, chat: true }] },
  hall6: trHall('Story Hall', { map: 'fablemere', x: 15, y: 5 },
    { id: 'bramble', look: 1, trainer: { name: 'Storyteller Bramble', seal: 6, team: trTeam('scrollworm 33', 'penpot 33', 'mapmouse 34', 'rootlet 34', 'twigit 35'), reward: 2400, nuts: 14,
      intro: ['Ah, a new character enters our story!', 'Every tale is built from Nouns: a hero, a road, a dragon. Let’s write yours.'], win: ['What a twist! Take the Fable Badge. 📜', 'The road north crosses the Echo Dunes. Sandscript waits on the other side.'], after: ['They say the Syndicate is catching echoes in jars out in the dunes. Strange folk.'] } },
    { id: 'h6a', look: 2, trainer: { name: 'Bookbinder Tess', team: trTeam('bookmite 31', 'crumbun 31'), reward: 360, nuts: 2, intro: ['Let me bind you to a battle!'], win: ['Unbound…'], after: ['Bramble’s Wordlings are as tough as old books.'] } },
    { id: 'h6b', look: 4, trainer: { name: 'Bard Felix', team: trTeam('teapotto 32'), reward: 360, nuts: 2, intro: ['Gather round for a battle ballad!'], win: ['A sad song for me.'], after: ['Nouns beat Adjectives. That’s the moral of my story.'] } }),
  dunes: { name: 'Echo Dunes', song: 'route', gen: { w: 20, h: 22, seed: 3529, points: [[9, 21], [4, 14], [15, 7], [9, 0]], open: 0.8, grass: 0.35 },
    exits: { bottom: 'fablemere', top: 'sandscript' },
    wild: [['sprintail', 33, 36], ['zoomole', 33, 36], ['clockrab', 33, 36], ['keykin', 34, 36], ['grumpkin', 33, 36], ['crispleaf', 33, 36], ['scurrit', 33, 35], ['emberling', 33, 36], ['skyquill', 42, 46, 0.15, 'after']],
    items: [{ id: 'dn1', give: { bloom: 1 } }, { id: 'dn2', give: { elixir: 1 } }, { id: 'dn3', give: { coins: 600 } }],
    npcs: [{ ...GRUNT('g11', ['sprintail 34', 'emberling 34'], ['Lt. Clamor says every echo in the dunes is ours. HELLO! …see? Ours.']), at: 0.3 },
      { id: 'nomad', at: 0.7, look: 3, trainer: { name: 'Nomad Sela', team: trTeam('zoomole 35', 'clockrab 35'), reward: 500, nuts: 3, intro: ['The dunes shift every day. My Wordlings don’t!'], win: ['Swept away like sand.'], after: ['Sandscript is built on the oldest writing in the land.'] } }] },
  sandscript: { name: 'Sandscript', song: 'town', fly: { x: 5, y: 11 }, shop: ['tonic', 'grandtonic', 'elixir', 'picnic', 'revive', 'bloom', 'charm', 'goldcharm', 'wordcharm', 'bigcharm', 'usb_echoblast'], rows: [
    '#########PP#########', '#FF......PP......FF#', '#.RRRR...PP..GGGGG.#', '#.HHHH...PP..HHHHH.#', '#.HHHH...PP..HHDHH.#', '#...P....PP....P...#',
    '#...PPPPPPPPPPPP...#', '#.......SPP........#', '#..BBBB..PP..MMMM..#', '#..HHHH..PP..HHHH..#', '#..HHDH..PP..HDHH..#', '#....P...PP...P....#',
    '#F...PPPPPPPPPP...F#', '#FF......PP......FF#', '#########PP#########'],
    exits: { bottom: 'dunes', top: 'stormpeak' }, doors: { '15,4': { hall: 'hall7' }, '5,10': 'rest', '14,10': 'shop' },
    signs: { '8,7': 'SANDSCRIPT. Letters carved in stone, older than anyone remembers. North: Stormcrown Steps.' },
    npcs: [{ id: 'guard7', x: 9, y: 1, dir: 'down', look: 4, gate: { open: s => trSeals(s) >= 7, lines: ['Stormcrown Steps are full of thunder.', 'Come back with seven Badges. Maestro Calloway’s Hall is right here!'] } },
      { id: 'guard7b', x: 10, y: 1, dir: 'down', look: 4, gate: { open: s => trSeals(s) >= 7, lines: ['Seven Badges, please. Keep the rhythm!'] } },
      { id: 'carver', x: 12, y: 7, dir: 'down', look: 1, lines: ['These stones hold the first words ever written.', 'A loud man in grey keeps shouting at them to catch the echoes. Rude!'] },
      { id: 'ss1', x: 3, y: 13, dir: 'right', look: 2, wander: 2, chat: true }, { id: 'ss2', x: 16, y: 6, dir: 'left', look: 3, wander: 2, chat: true }] },
  hall7: trHall('Echo Hall', { map: 'sandscript', x: 15, y: 5 },
    { id: 'calloway', look: 4, trainer: { name: 'Maestro Calloway', seal: 7, team: trTeam('drumbuck 37', 'kickit 37', 'glidelet 38', 'sparkhorn 39'), reward: 2800, nuts: 15,
      intro: ['One, two, three, four!', 'Verbs are the beat of every sentence. Keep the rhythm, or lose the song.'], win: ['Bravo! Encore! Take the Echo Badge. 🎵', 'Stormcrown Steps lead up to Starhaven. Watch out for the loud one up there.'], after: ['The last Hall Leader studies the stars in Starhaven.'] } },
    { id: 'h7a', look: 2, trainer: { name: 'Drummer Zed', team: trTeam('drumbuck 35', 'zapwick 35'), reward: 400, nuts: 2, intro: ['Ba-dum TSS! Battle time!'], win: ['Off beat…'], after: ['Calloway answers right on the beat. Answer fast!'] } },
    { id: 'h7b', look: 3, trainer: { name: 'Singer Lulu', team: trTeam('blarebird 36'), reward: 400, nuts: 2, intro: ['La la LAAA! Can you hit the high notes?'], win: ['I missed the note.'], after: ['Adjectives beat Verbs. Bring some to this Hall!'] } }),
  stormpeak: { name: 'Stormcrown Steps', song: 'woods', theme: 'cave', gen: { w: 20, h: 20, seed: 6043, theme: 'cave', points: [[9, 19], [15, 14], [4, 9], [13, 4], [9, 0]], open: 0.7, grass: 0.8 },
    exits: { bottom: 'sandscript', top: 'starhaven' },
    wild: [['sparkhorn', 37, 40], ['blarebird', 37, 40], ['drumbuck', 37, 40], ['bellbud', 37, 40], ['lampkin', 37, 40], ['tomeguard', 38, 40], ['boulderbear', 38, 40], ['shadeowl', 37, 40], ['starlume', 38, 40, 0.4], ['wobbleking', 44, 48, 0.15, 'after']],
    items: [{ id: 'sp1', give: { bloom: 1 } }, { id: 'sp2', give: { rareink: 1 } }, { id: 'sp3', give: { picnic: 1 } }],
    npcs: [{ id: 'clamor', edge: 'top', k: 0, look: 5, leaves: true, trainer: { name: 'Lt. Clamor', boss: true, team: trTeam('blarebird 39', 'drumbuck 39', 'bellbud 40', 'shadeowl 41'), reward: 1500, nuts: 10, syndicate: true,
        intro: ['Too QUIET up here! Let’s make some NOISE!', 'I catch echoes in jars. Every word you shout up here belongs to the Syndicate now.', 'We sell them back at a lovely price. Want to hear your own voice? That’ll be ten coins!'],
        win: ['My jars! You broke all my jars!', 'The echoes are free… Director Vex won’t like this.', 'He’s waiting behind the eight locks of the Grand Archive in Summit City.'] } },
      { ...GRUNT('g12', ['drumbuck 38', 'shadeowl 38'], ['You’ll never get past Lt. Clamor! Wait, what? I can’t hear you over the thunder!']), edge: 'top', k: 1, leaves: true },
      { id: 'ivo', at: 0.5, look: 3, trainer: { name: 'Mountaineer Ivo', team: trTeam('boulderbear 39', 'bellbud 39'), reward: 560, nuts: 3, intro: ['Thunder can’t scare me. Can it scare you?'], win: ['Struck down!'], after: ['Starhaven is at the top. You can almost touch the stars there.'] } }] },
  starhaven: { name: 'Starhaven', song: 'town', fly: { x: 5, y: 10 }, shop: ['grandtonic', 'elixir', 'picnic', 'revive', 'bloom', 'goldcharm', 'wordcharm', 'bigcharm', 'usb_starfall'], rows: [
    '################..##', '#FF......GGGGGG..FF#', '#........HHHHHH....#', '#..RRRR..HHHDHH....#', '#..HHHH.....P......#', '#..PPPPPPPPPP......#',
    '#........SP........#', '#..BBBB...P..MMMM..#', '#..HHHH...P..HHHH..#', '#..HHDH...P..HDHH..#', '#....P...PP..P.....#', '#....PPPPPPPPPP....#',
    '#F.......PP.......F#', '#FF......PP......FF#', '#########PP#########'],
    exits: { bottom: 'stormpeak', top: 'plaza' }, doors: { '12,3': { hall: 'hall8' }, '5,9': 'rest', '14,9': 'shop' },
    signs: { '9,6': 'STARHAVEN. The town closest to the stars. The Star Hall sits on the hill. North gate: Victory Plaza and the Ultimate Stadium.' },
    npcs: [{ id: 'guard9', x: 16, y: 1, dir: 'down', look: 4, gate: { open: s => !!s.beaten.vex, lines: ['North of here is Victory Plaza and the Ultimate Stadium.', 'Only the explorer who stops the Hush Syndicate may enter. Director Vex is still out there!'] } },
      { id: 'guard9b', x: 17, y: 1, dir: 'down', look: 4, gate: { open: s => !!s.beaten.vex, lines: ['The Elite Four are the strongest trainers in the land. Stop Director Vex first!'] } },
      { id: 'gazer', x: 15, y: 11, dir: 'left', look: 1, lines: ['On a clear night you can see a star for every Badge you’ve won.', 'Yours is getting brighter!'] },
      { id: 'sh1', x: 3, y: 12, dir: 'right', look: 2, wander: 2, chat: true }, { id: 'sh2', x: 16, y: 5, dir: 'left', look: 3, wander: 2, chat: true }] },
  hall8: trHall('Star Hall', { map: 'starhaven', x: 12, y: 4 },
    { id: 'elio', look: 4, trainer: { name: 'Stargazer Elio', seal: 8, team: trTeam('twinklit 42', 'lampkin 42', 'hopscot 43', 'mapmouse 44', 'glimmeray 45'), reward: 3500, nuts: 16,
      intro: ['The stars are made of every kind of word.', 'I use all three types. Let’s see if you’re ready for the Grand Archive.'], win: ['You shine brighter than my telescope. Take the Star Badge. ⭐', 'Eight Badges! Fly back to Summit City. The Grand Archive will open for you now.'], after: ['Director Vex waits in the Grand Archive in Summit City. The whole land is counting on you.'] } },
    { id: 'h8a', look: 2, trainer: { name: 'Astronomer Pia', team: trTeam('lampkin 40', 'dimdrop 40'), reward: 440, nuts: 2, intro: ['Have you seen a shooting star? You’re about to!'], win: ['A falling star… that’s me.'], after: ['Elio’s team has every type. Mix yours too!'] } },
    { id: 'h8b', look: 3, trainer: { name: 'Skywatcher Omar', team: trTeam('glidelet 41', 'brightbug 41'), reward: 440, nuts: 2, intro: ['Look up! No, look at my Wordlings!'], win: ['Clouded over…'], after: ['The Star Badge is the hardest one to win.'] } }),
  /* ---------- Victory Plaza and the Ultimate Stadium: the Elite Four, then the Champion ---------- */
  plaza: { name: 'Victory Plaza', song: 'town', fly: { x: 10, y: 12 }, rows: [
    '####################', '#FF.RRRRRRRRRRRR.FF#', '#...RRRRRRRRRRRR...#', '#...GHHHHHDHHHHG...#', '#........PP........#', '#..F.....PP.....F..#',
    '#..PPPPPPPPPPPPPP..#', '#..P....SPP.....P..#', '#..P.BBBB.P.....P..#', '#..P.HHHH.P..F..P..#', '#..P.HDHH.P.....P..#', '#..PPPPPPPPPPPPPP..#',
    '#F.......PP.......F#', '#FF......PP......FF#', '#########PP#########'],
    exits: { bottom: 'starhaven' }, doors: { '10,3': { hall: 'elite1' }, '6,10': 'rest' },
    signs: { '8,7': 'THE ULTIMATE STADIUM. Home of the Elite Four. Beat all four, then face the Wordling Champion!' },
    npcs: [{ id: 'fan1', x: 14, y: 8, dir: 'left', arch: 'kid', look: 1, wander: 2, lines: ['Fan: Did you see Rio this morning? Four wins in a row! I want to be just like that.'] },
      { id: 'fan2', x: 3, y: 12, dir: 'right', arch: 'lass', look: 1, wander: 2, lines: ['Fan: The Elite Four never heal your team between rooms. Bring lots of Tonics and Revives!'] },
      { id: 'prof_plaza', x: 11, y: 5, dir: 'left', arch: 'scholar', look: 1, prof: true, plaza: true }] },
  elite1: trElite('Wren’s Room', 'hall', 1, { id: 'elite1', arch: 'leaderF', trainer: { name: 'Elite Wren', boss: true, team: trTeam('penhawk 52', 'stormhorn 52', 'tidalord 53', 'skyquill 54'), reward: 4000, nuts: 14,
    intro: ['Welcome to the Ultimate Stadium. I am Wren, first of the Elite Four.', 'Your friend Rio blew through this room like a storm this morning.', 'Verbs are action! Let’s see if you move just as fast.'],
    win: ['Swift and sure. The door behind me is open now.'], after: ['Go on. Basil is waiting in the next room. He is as hard as stone.'] } }),
  elite2: trElite('Basil’s Room', 'library', 2, { id: 'elite2', arch: 'hiker', trainer: { name: 'Elite Basil', boss: true, team: trTeam('fortressor 54', 'codexwyrm 54', 'atlasaur 55', 'gardenshell 56'), reward: 4400, nuts: 14,
    intro: ['I am Basil of the Elite Four. My Wordlings are as solid as mountains.', 'Rio cracked my wall of stone. Nobody had done that in years.', 'Can you do it too?'],
    win: ['Ha! Cracked again, twice in one day.'], after: ['Aurelia is next. Her Wordlings shine so bright it hurts.'] } }),
  elite3: trElite('Aurelia’s Room', 'archive', 3, { id: 'elite3', arch: 'lass', trainer: { name: 'Elite Aurelia', boss: true, team: trTeam('novaluxe 56', 'cloudmane 56', 'blossomira 57', 'blizzarion 58'), reward: 4800, nuts: 15,
    intro: ['I am Aurelia. Bright, bold, brilliant. That is how I battle.', 'Rio’s team sparkled like fireworks. Let me see how yours shines!'],
    win: ['Dazzling. Truly dazzling.'], after: ['Only Orrin is left. He uses every type of word.'] } }),
  elite4: trElite('Orrin’s Room', 'hall', 4, { id: 'elite4', arch: 'elder', trainer: { name: 'Elite Orrin', boss: true, team: trTeam('monolore 58', 'skybounder 58', 'royalsilk 59', 'elderbark 59', 'wobbleking 60'), reward: 5200, nuts: 16,
    intro: ['I am Orrin, the last of the Elite Four. I use Verbs, Nouns and Adjectives alike.', 'I had not lost in many years… until a cheerful kid named Rio walked in this morning.', 'Show me that the new generation is truly ready.'],
    win: ['Wonderful. The door to the Champion’s room is open.', 'Your friend is waiting for you up there.'], after: ['The Champion is through that door. Good luck.'] } }),
  champion: { name: 'Champion’s Room', theme: 'archive', song: 'town', indoor: true, items: [], back: { map: 'plaza', x: 10, y: 4 }, entry: { x: 5, y: 7 },
    rows: ['XXXXXXXXXXXX', 'XK;;;::;;;KX', 'X;;;;::;;;;X', 'X;;;;::;;;;X', 'XKK;;::;;KKX', 'X;;;;::;;;;X', 'X;;;;::;;;;X', 'X;;;;::;;;;X', 'XXXXX::XXXXX'],
    npcs: [{ id: 'champion', x: 5, y: 2, dir: 'down', arch: 'rival', look: 1, noSight: true, trainer: { name: 'Champion Rio', boss: true, rio: ['stormhorn 61', 'lumenarch 61', 'emberlynx 62', 'tidalord 62', 'grovekeeper 63', '@ 66'], team: [], reward: 10000, nuts: 25,
      intro: ['You made it! I knew you would.', 'Ever since the school, we’ve been racing each other. This is the finish line!', 'I’m not your practice battle anymore. I’m the Wordling Champion. Give me everything you’ve got!'],
      win: ['…I lost. And you know what? I’m not even mad.', 'You’re the Wordling Champion now. You earned it!', 'Go on outside. I bet someone is waiting to see you.'],
      after: ['Champion! Ha, it sounds good on you.', 'Go outside. Someone is waiting to see you!'] } }] },
};

const trSeals = s => Object.keys(s?.seals || {}).length;
/* Build the generated maps once (same layout every time) */
(function trBuildWorld() {
  for (const [id, m] of Object.entries(TR_MAPS)) {
    m.npcs ||= []; m.items ||= [];
    if (m.gen) {
      const built = trGenMap(m.gen); m.rows = built.rows; m.theme = m.gen.theme || m.theme || 'out';
      for (const n of m.npcs) if (n.edge) { const y = n.edge === 'top' ? 1 : m.rows.length - 2; const xs = [...m.rows[n.edge === 'top' ? 0 : m.rows.length - 1]].map((c, i) => TR_WALKABLE.has(c) ? i : -1).filter(i => i >= 0); n.x = xs[n.k] ?? xs[0]; n.y = y; n.dir = n.edge === 'top' ? 'down' : 'up'; delete n.edge; }
      trPlace(m, built, m.gen.seed);
    }
    m.theme ||= 'out';
  }
  // the ferry from Saltwick Harbor lands on a beach at Ember Ridge, with open sea off the west edge
  const e = TR_MAPS.ember, er = e.rows.map(r => [...r]), eH = er.length;
  for (let y = 15; y < eH; y++) { er[y][0] = 'W'; if (y >= 16) er[y][1] = 'W'; if (y === eH - 1) for (const x of [1, 2, 3]) er[y][x] = 'W'; else if (y >= 16) for (const x of [2, 3]) if (TR_WALKABLE.has(er[y][x])) er[y][x] = '='; }
  e.rows = er.map(r => r.join(''));
  // Saltwick Harbor opens onto the ocean to the east instead of a line of trees
  const sw = TR_MAPS.saltwick, sr = sw.rows.map(r => [...r]);
  for (let y = 4; y <= 13; y++) { sr[y][19] = 'W'; if (y >= 5) sr[y][18] = 'W'; }
  for (let x = 16; x <= 19; x++) sr[14][x] = 'W';
  sw.rows = sr.map(r => r.join(''));
  // every outdoor shore is beach: grass, tall grass and flowers next to the water become sand
  for (const m of Object.values(TR_MAPS)) {
    if (m.theme !== 'out') continue;
    const g = m.rows.map(r => [...r]), H = g.length, W = g[0].length;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ('.,F'.includes(g[y][x]) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => m.rows[y + dy]?.[x + dx] === 'W')) g[y][x] = '=';
    m.rows = g.map(r => r.join(''));
  }
})();

/* ---------- Homes you can walk into: residents share their lives, give hints, or give a gift once ---------- */
const TR_HOUSE_ROWS = {
  a: ['XXwXXXXwXX', 'XKK;;;;;bX', 'X;;;;;;;bX', 'X;;tt;;;;X', 'X;;tt;;p;X', 'X;;;;uu;;X', 'Xp;;;uu;;X', 'XXXX;;XXXX'],
  b: ['XwXXXXXXwX', 'Xb;;;;;KKX', 'Xb;;;;;;;X', 'X;;;;tt;;X', 'X;p;;tt;;X', 'X;;uu;;;;X', 'X;;uu;;;pX', 'XXXX;;XXXX'],
};
/* people: { id, x, y, dir, arch, name, lines } plus either gift: { flag, items, lines, after } or elder: true */
const TR_HOMES = [
  { map: 'town', door: '3,4', id: 'home_you', name: 'Your home', layout: 'a', bed: 'Home sweet home! You take a nap and your Wordlings rest too. 💤', people: [
    { id: 'mom', x: 6, y: 3, dir: 'down', arch: 'lass', name: 'Mom', lines: ['Mom: You’re really heading out on an adventure? I’m so proud of you.', 'Mom: Come home and nap in your bed any time. It heals your whole team.'],
      gift: { flag: 'momGift', ready: s => s.team.length > 0, before: ['Mom: Professor Rowan is waiting for you at the Inkwell School, on the east side of town. Rio is going too!'], items: { potion: 3 }, lines: ['Mom: Wait! Take these for the road. Every explorer needs Potions.'], after: ['Mom: Did you remember to answer quickly? Fast answers hit harder!', 'Mom: The world map is in your menu if you ever get lost. 🗺️'] } },
    { id: 'sib', x: 2, y: 5, dir: 'right', arch: 'kid', name: 'Your little brother', lines: ['Little brother: When I grow up I’m going to catch a Wordling bigger than the house!', 'Little brother: Did you know you can hop down ledges on Quill Path? It’s a shortcut home!'] }] },
  { map: 'town', door: '15,4', id: 'home_ana', name: 'Elder Ana’s house', layout: 'b', people: [
    { id: 'ana', x: 5, y: 2, dir: 'down', arch: 'elder', name: 'Elder Ana', elder: true },
    { id: 'anagrand', x: 7, y: 5, dir: 'left', arch: 'kid', name: 'Ana’s grandson', lines: ['Grandson: Grandma used to be a Hall Leader, a long, long time ago.', 'Grandson: She says the trick is to mix your team: Verbs, Nouns and Adjectives.'],
      gift: { flag: 'anaGift', ready: s => trSeals(s) >= 1, items: { rareink: 1 }, before: ['Grandson: Grandma keeps a bottle of Rare ink in her drawer. She says it’s for real explorers, the ones with a Badge.'],
        lines: ['Grandson: You got a Badge! Grandma said I could give you this. 🖋️'], after: ['Grandson: Rare ink makes a Wordling grow a level. Use it on your favorite!'] } }] },
  { map: 'cinderglen', door: '4,4', id: 'home_glass', name: 'The glassblowers’ house', layout: 'a', bed: 'A kind family lets you rest by their fire. 🔥', people: [
    { id: 'hale', x: 6, y: 3, dir: 'down', arch: 'man', name: 'Glassblower Hale', lines: ['Hale: My family has blown glass in Cinderglen for six generations.', 'Hale: The heat from the ridge keeps our furnace going. And keeps Emberlings warm too!'],
      gift: { flag: 'haleGift', items: { grandtonic: 1 }, lines: ['Hale: You look tired, traveler. Here, a Grand tonic in one of my own bottles.'], after: ['Hale: Marisol’s Hall uses Adjectives. Verb moves won’t do much there. Bring Nouns!'] } },
    { id: 'halekid', x: 2, y: 5, dir: 'right', arch: 'kid', name: 'Hale’s daughter', lines: ['Daughter: I’m practicing my words every morning so I can be a Hall Leader someday.', 'Daughter: The Crane keeper outside lost her paper cranes. Something in the cave scared them.'] }] },
  { map: 'summit', door: '15,4', id: 'home_ola', name: 'Ranger Ola’s cabin', layout: 'b', bed: 'Ranger Ola lets you rest by the stove. 🔥', people: [
    { id: 'ola', x: 5, y: 2, dir: 'down', arch: 'granny', name: 'Retired Ranger Ola', lines: ['Ola: I walked every trail in this land for forty years. My knees remember every one.', 'Ola: The Grand Archive has eight locks. Only someone with all eight Badges can open it.'],
      gift: { flag: 'olaGift', items: { revive: 2 }, lines: ['Ola: Take these Revive leaves. The north road is no place to run out.'], after: ['Ola: Word Surge hits every type hard. Your Wordlings learn it at level 18.'] } },
    { id: 'olacat', x: 7, y: 5, dir: 'left', arch: 'scholar', name: 'Ola’s nephew', lines: ['Nephew: I’m writing a guidebook. Chapter one: “Always carry a Picnic basket.”', 'Nephew: Chapter two: “The Picnic basket heals your whole team at once.” It’s a short book.'] }] },
  { map: 'glimmerfrost', door: '15,4', id: 'home_tova', name: 'Fisher Tova’s house', layout: 'a', people: [
    { id: 'tova', x: 6, y: 3, dir: 'down', arch: 'lass', name: 'Fisher Tova', lines: ['Tova: The lakes here never freeze, so the fish never stop biting.', 'Tova: Face any water and press A to fish. Rare Wordlings swim deep, so keep trying!'],
      gift: { flag: 'tovaGift', items: { goldcharm: 2 }, lines: ['Tova: Here, two Gold block balls. They’re much better for catching than the plain ones.'], after: ['Tova: Sora’s Frost Hall loves Adjectives. Verbs are weak against them, so lean on Nouns.'] } },
    { id: 'tovadad', x: 2, y: 5, dir: 'right', arch: 'hiker', name: 'Tova’s father', lines: ['Father: I came up from Saltwick Harbor when I was young. Never went back. Too much snow to shovel!'] }] },
  { map: 'fablemere', door: '4,4', id: 'home_penn', name: 'Author Penn’s study', layout: 'b', people: [
    { id: 'penn', x: 5, y: 2, dir: 'down', arch: 'elder', name: 'Author Penn', lines: ['Penn: I’m writing a book about a young explorer who saves every word in the land.', 'Penn: …Wait. Is that you? Hold still, I need to describe your hat.'],
      gift: { flag: 'pennGift', items: { rareink: 1 }, lines: ['Penn: For my hero, a bottle of my finest Rare ink. Use it well. 🖋️'], after: ['Penn: Storyteller Bramble uses Nouns. Verb moves hit Nouns hard!'] } },
    { id: 'pennaide', x: 7, y: 5, dir: 'left', arch: 'scholar', name: 'Penn’s assistant', lines: ['Assistant: He has written “The End” eleven times and crossed it out every time.'] }] },
  { map: 'sandscript', door: '4,4', id: 'home_carver', name: 'The stone carvers’ house', layout: 'a', people: [
    { id: 'sari', x: 6, y: 3, dir: 'down', arch: 'man', name: 'Carver Sari', lines: ['Sari: We carve the old letters back onto the stones when the sand wears them away.', 'Sari: A loud man in grey keeps shouting at the stones up on Stormcrown Steps. Watch out for him.'],
      gift: { flag: 'sariGift', items: { sprout: 3 }, lines: ['Sari: The steps are dangerous. Take these Revive sprouts.'], after: ['Sari: Maestro Calloway’s Hall is all Verbs. Adjectives will give him trouble.'] } },
    { id: 'sarikid', x: 2, y: 5, dir: 'right', arch: 'kid', name: 'Sari’s son', lines: ['Son: I carved my name in a rock! Then the wind erased it. Then I carved it again!'] }] },
  { map: 'starhaven', door: '5,4', id: 'home_lyn', name: 'Lyn’s house', layout: 'b', people: [
    { id: 'lyn', x: 5, y: 2, dir: 'down', arch: 'lass', name: 'Lyn', lines: ['Lyn: My brother is Stargazer Elio. He stays up all night looking at the sky.', 'Lyn: He uses all three types in battle, so bring a mixed team. And snacks.'],
      gift: { flag: 'lynGift', items: { elixir: 1 }, lines: ['Lyn: You’re going to face the Director soon, aren’t you? Take this Elixir.'], after: ['Lyn: When you win, come back and tell me everything!'] } },
    { id: 'lynpup', x: 7, y: 5, dir: 'left', arch: 'granny', name: 'Lyn’s grandmother', lines: ['Grandmother: I named every star you can see from this window. Twice.'] }] },
];
(function trBuildHomes() {
  for (const h of TR_HOMES) {
    const town = TR_MAPS[h.map], [dx, dy] = h.door.split(',').map(Number), id = 'house_' + h.id;
    const r = town.rows.map(row => [...row]); r[dy][dx] = 'D'; town.rows = r.map(row => row.join(''));   // give houses without a door one
    (town.doors ||= {})[h.door] = { hall: id };
    TR_MAPS[id] = { name: h.name, theme: 'house', song: 'town', indoor: true, rows: TR_HOUSE_ROWS[h.layout].slice(), back: { map: h.map, x: dx, y: dy + 1 }, entry: { x: 4, y: 6 }, bed: h.bed,
      npcs: h.people.map(p => ({ ...p, look: 1, wander: p.elder || p.gift ? 0 : 1 })), items: [] };
  }
})();

/* ---------- Clinics: walk in, the nurse puts your Wordlings in the healing machine ---------- */
const TR_CENTER_ROWS = ['XXwXXXXXXwXX', 'X;;;;;;;mm;X', 'XcccccccmmcX', 'X;;;;;;;;;;X', 'Xp;;;;;;;;qX', 'X;;ss;;ss;;X', 'X;;;;;;;;;;X', 'Xp;;;uu;;;pX', 'XXXXX;;XXXXX'];
const TR_CENTER_FOLK = {
  town: [['Young mother', 'lass', 'My son caught his first Wordling today. He hasn’t stopped smiling since.'], ['Old fisherman', 'elder', 'Nurse Pell has worked here since I was a boy. She never gets older. Strange, eh?']],
  lexicon: [['Student', 'scholar', 'I lost to Hall Leader Iris three times. Next time I’m bringing more Nouns!'], ['Traveler', 'man', 'Your Wordlings heal for free here. Free! In this economy!']],
  saltwick: [['Sailor', 'sailor', 'Back from a long voyage. Even my Anchorcrab gets seasick.'], ['Dock worker', 'hiker', 'The ferry to Ember Ridge needs two Badges. Captain Remy is tough, so heal up first.']],
  cinderglen: [['Miner', 'hiker', 'Ember Cave was full of grey coats last week. I came straight here after.'], ['Painter', 'lass', 'I paint every Wordling that comes through this door. I have 300 paintings now.']],
  summit: [['Climber', 'scout', 'The north road is cold. Fill your bag with Grand tonics before you go.'], ['Librarian', 'scholar', 'The Grand Archive used to be open to everyone. I hope it will be again.']],
  glimmerfrost: [['Skater', 'kid', 'I fell on the ice twelve times today! My Wordling only fell eleven.'], ['Grandfather', 'elder', 'Warm in here, isn’t it? I come in just to sit by the machine’s glow.']],
  fablemere: [['Poet', 'lass', 'Roses are red, healing is free, the nurse is so kind, she healed even me.'], ['Bookworm', 'scholar', 'Did you know the Spirit Log is in your menu? It shows every Wordling you’ve met.']],
  sandscript: [['Nomad', 'hiker', 'The dunes are hot. My Wordlings like to rest in the shade of the machine.'], ['Kid', 'kid', 'I heard a loud man shouting at the stones on Stormcrown Steps. So rude!']],
  plaza: [['Trainer', 'scout', 'I lost to Elite Wren again. Back to the healing stove!'], ['Reporter', 'man', 'I’m writing about the new Champion. Unless… you plan to beat him?']],
  starhaven: [['Astronomer', 'scholar', 'This is the last Clinic before the Grand Archive. Rest well!'], ['Explorer', 'scout', 'I made it all the way here with just Potions. Don’t be like me. Buy Elixirs.']],
};
(function trBuildCenters() {
  for (const [mid, m] of Object.entries(TR_MAPS)) {
    for (const [k, v] of Object.entries(m.doors || {})) {
      if (v !== 'rest') continue;
      const [dx, dy] = k.split(',').map(Number), id = 'center_' + mid, folk = TR_CENTER_FOLK[mid] || [];
      m.doors[k] = { hall: id };
      TR_MAPS[id] = { name: `${m.name} Clinic`, theme: 'center', song: 'town', indoor: true, center: true, rows: TR_CENTER_ROWS.slice(), back: { map: mid, x: dx, y: dy + 1 }, entry: { x: 5, y: 7 }, items: [],
        npcs: [{ id: id + '_nurse', x: 5, y: 1, dir: 'down', arch: 'nurse', look: 1, nurse: true },
          ...folk.map(([name, arch, line], i) => ({ id: id + '_v' + i, x: i ? 8 : 2, y: i ? 6 : 3, dir: i ? 'left' : 'right', arch, look: 1, wander: i ? 1 : 0, lines: [`${name}: ${line}`] }))] };
    }
  }
})();

/* ---------- Shops: a little convenience store; pay the clerk at the register ---------- */
const TR_MART_ROWS = ['XXXwXXXXwXXX', 'X;;;XffffffX', 'XcrcX;;;;;;X', 'X;;;;;;;;;;X', 'X;hhhh;hhh;X', 'X;;;;;;;;;;X', 'X;hhhh;hhh;X', 'Xp;;;uu;;;pX', 'XXXXX;;XXXXX'];
const TR_MART_FOLK = {
  town: [['Shopper', 'man', 'I always buy three Potions. Two for my Wordlings, one for luck.'], ['Kid', 'kid', 'Mom gave me 10 coins. That’s… not enough for anything.']],
  lexicon: [['Student', 'scholar', 'Tonics heal twice as much as Potions. Worth it before Iris!']],
  saltwick: [['Sailor', 'sailor', 'Gold block balls catch the tough ones. Save them for rare Wordlings.'], ['Old lady', 'granny', 'In my day a Potion cost five coins. And it tasted worse.']],
  cinderglen: [['Hiker', 'hiker', 'Revive sprouts are cheap and light. Always carry a few.']],
  glimmerfrost: [['Skier', 'lass', 'Picnic baskets heal your whole team. Perfect after a long ski… I mean battle.']],
  fablemere: [['Poet', 'scholar', 'I came in for an Elixir and left with a story. The clerk talks a lot.']],
  sandscript: [['Nomad', 'hiker', 'Buy Sunrise blooms before Stormcrown Steps. Trust me.']],
  starhaven: [['Explorer', 'scout', 'This shop has the best stock in the land. Fill your bag before the Archive!']],
};
(function trBuildMarts() {
  for (const [mid, m] of Object.entries(TR_MAPS)) {
    for (const [k, v] of Object.entries(m.doors || {})) {
      if (v !== 'shop') continue;
      const [dx, dy] = k.split(',').map(Number), id = 'mart_' + mid, folk = TR_MART_FOLK[mid] || [];
      m.doors[k] = { hall: id };
      TR_MAPS[id] = { name: `${m.name} Shop`, theme: 'mart', song: 'town', indoor: true, mart: true, shop: m.shop, rows: TR_MART_ROWS.slice(), back: { map: mid, x: dx, y: dy + 1 }, entry: { x: 5, y: 7 }, items: [],
        npcs: [{ id: id + '_clerk', x: 2, y: 1, dir: 'down', arch: 'shop', look: 1, clerk: true },
          ...folk.map(([name, arch, line], i) => ({ id: id + '_s' + i, x: i ? 9 : 6, y: i ? 5 : 3, dir: i ? 'left' : 'down', arch, look: 1, wander: 1, lines: [`${name}: ${line}`] }))] };
    }
  }
})();

/* ==================== The story: Professor Rowan, rival Rio, legends ====================
   You start at home. Mom sends you to Professor Rowan at the Inkwell School (east side of town), where you and
   your friendly rival Rio each pick a starter and battle. Rio pops up for a battle as the story goes on. After the
   Director, the Professor challenges you with the third starter at level 70, and every trainer wants a rematch. */
const TR_STARTERS = ['quillip', 'mossling', 'petalwisp'];
(function trBuildSchool() {
  // Inkwell Town grows a little to the east to make room for the school
  const ext = ['########', '.......#', '.RRRRR.#', '.HHHHH.#', '.HHDHH.#', '...P...#', 'PPPP...#', '.......#', '..F....#', '.......#', '....F..#', '.......#', '.......#', '=......#', '=......#', '########'];
  const t = TR_MAPS.town; t.rows = t.rows.map((r, y) => { let base = r.slice(0, 19); if (y === 6) base = base.slice(0, 16) + 'PPP'; return base + ext[y]; });
  t.doors['22,4'] = { hall: 'school' };
  t.signs ||= {}; t.signs['8,7'] = 'INKWELL TOWN. North: Quill Path. East: the Inkwell School, where Professor Rowan studies Wordlings.';
  TR_MAPS.school = { name: 'Inkwell School', theme: 'house', song: 'town', indoor: true, school: true,
    rows: ['XXwXXXXXXwXX', 'XKKK;;;;KKKX', 'X;;;;;;;;;;X', 'X;;;ttt;;;;X', 'X;;;;;;;;;;X', 'Xp;tt;;tt;pX', 'X;;;;;;;;;;X', 'X;;;;uu;;;;X', 'XXXXX;;XXXXX'],
    back: { map: 'town', x: 22, y: 5 }, entry: { x: 5, y: 7 }, items: [],
    npcs: [{ id: 'prof', x: 5, y: 2, dir: 'down', arch: 'scholar', look: 1, prof: true },
      { id: 'rio', x: 8, y: 4, dir: 'left', arch: 'rival', look: 1, rival: true },
      { id: 'pupil1', x: 2, y: 6, dir: 'right', arch: 'kid', look: 1, wander: 1, lines: ['Student: Professor Rowan says every Wordling has a word inside it. I think mine’s is “snack”.'] }] };
  // Rio battles you as the story goes on. "@" is his starter (it grows with him).
  globalThis.TR_RIVAL = [
    { id: 'rival1', map: 'woods', seals: 0, team: ['buzzlet 7', '@ 9'], intro: ['Hey! Wait up! I’ve been training in the tall grass all morning.', 'Let’s see whose Wordlings got stronger!'], win: ['Whoa, you’re good. Next time I’ll win, I swear!'] },
    { id: 'rival2', map: 'bridge', seals: 1, team: ['gustling 12', 'inkblob 12', '@ 14'], intro: ['You got a Badge too? Awesome! But I’m not going easy on you.'], win: ['Okay, okay. You’re still ahead. For now!'] },
    { id: 'rival3', map: 'ember', seals: 2, team: ['sparkhorn 17', 'folduck 17', '@ 19'], intro: ['I rode the ferry too! Did you see the Syndicate on the bridge? Let’s battle before they show up again!'], win: ['Man… you really are the best explorer in Inkwell Town.'] },
    { id: 'rival4', map: 'highland', seals: 3, team: ['boulderbear 22', 'glimmeray 22', 'lumabat 23', '@ 25'], intro: ['Three Badges each! This is the big one. Ready?'], win: ['You keep getting stronger. I guess I have to keep up!'] },
    { id: 'rival5', map: 'frostpass', seals: 4, team: ['sparkhorn 30', 'tomeguard 30', 'shadeowl 30', '@ 32'], intro: ['Brr! The north road is freezing. A battle will warm us up!'], win: ['My hands are too cold to throw block balls. That’s my excuse!'] },
    { id: 'rival6', map: 'dunes', seals: 6, team: ['anchorcrab 36', 'gustling 36', 'emberling 36', '@ 38'], intro: ['Sand in my shoes, sand in my bag… but my Wordlings are ready!'], win: ['Every time we battle I learn something new. Thanks, friend.'] },
    { id: 'rival7', map: 'summit', seals: 8, team: ['sparkhorn 44', 'tomeguard 44', 'fernfox 44', 'anchorcrab 45', '@ 47'], intro: ['Eight Badges! You’re going into the Grand Archive, aren’t you?', 'Then let me be your last practice battle. Give it everything!'], win: ['Go get the Director. The whole town is cheering for you. I am too!'] },
  ];
  // legendary Wordlings wait in quiet places
  const spot = (mid, fx, fy) => { const m = TR_MAPS[mid], H = m.rows.length, W = m.rows[0].length, ok = (x, y) => TR_WALKABLE.has((m.rows[y] || '')[x]) && !m.npcs.some(n => n.x === x && n.y === y) && !(m.items || []).some(i => i.x === x && i.y === y);
    let best = null, bd = 1e9; for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) if (ok(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => TR_WALKABLE.has(m.rows[y + dy][x + dx]))) { const d = Math.abs(x - fx * W) + Math.abs(y - fy * H); if (d < bd) { bd = d; best = { x, y }; } }
    return best; };
  for (const [mid, sp, lv, fx, fy, needVex] of [['stormpeak', 'voltquill', 48, 0.8, 0.5], ['library', 'grammadon', 50, 0.2, 0.45], ['woods', 'aurorune', 60, 0.85, 0.5, true]]) {
    const at = spot(mid, fx, fy); if (at) TR_MAPS[mid].npcs.push({ id: 'lg_' + sp, ...at, dir: 'down', look: 1, legend: sp, lv, needVex: !!needVex });
  }
})();

/* USB drives: name and description come from the move they hold */
for (const it of Object.values(TR_ITEMS)) if (it.drive) { const mv = TR_MOVES[it.drive]; it.name = `USB drive: ${mv.name}`; it.desc = `Teaches ${mv.name}. ${mv.desc} You keep the drive forever.`; }
