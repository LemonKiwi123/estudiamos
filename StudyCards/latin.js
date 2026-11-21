'use strict';
/* ================= Latin (la): what the whole app needs =================
   Classical Latin for students. Browsers have no Latin voice and no Latin speech recognition, so:
   - Latin is read aloud with an Italian voice (it-IT), the closest fit; macrons are taken off first so the voice reads them.
   - 🎙️ Say it! is not offered for Latin decks (a short note says why).
   Typed answers: ā ē ī ō ū ȳ count the same as a e i o u y, and i/j and u/v spellings count the same (iam = jam,
   uia = via), whenever the deck being studied has Latin on one side. Loaded after games.js and the other game files. */
const LA_MACRON = /[āēīōūȳĀĒĪŌŪȲăĕĭŏŭ]/;
/* "Rōma" -> "Roma": no macrons or breves */
const laPlain = s => String(s ?? '').normalize('NFD').replace(/[̄̆]/g, '').normalize('NFC');
/* the spelling every Latin answer is compared in: no macrons, j -> i, v -> u, lowercase */
const laFold = s => laPlain(s).toLowerCase().replace(/j/g, 'i').replace(/v/g, 'u');
const laIs = l => String(l || '').toLowerCase().split(/[-_]/)[0] === 'la';
const LA_VOICE = 'it-IT';

/* ---------- the deck language list: Latin, right after Italian ---------- */
if (typeof LANGS !== 'undefined' && !LANGS.some(l => l[0] === 'la')) {
  const at = LANGS.findIndex(l => l[0] === 'it-IT');
  LANGS.splice(at >= 0 ? at + 1 : LANGS.length, 0, ['la', 'Latin (read with an Italian voice)']);
}

/* ---------- speech: an Italian voice reads Latin ---------- */
if (typeof voicesFor === 'function') {
  const voicesForAll = voicesFor;
  voicesFor = function (lang) { return voicesForAll(laIs(lang) ? LA_VOICE : lang); };
}
if (typeof speak === 'function') {
  const speakAll = speak;
  speak = function (text, lang, rateMul) {
    if (!laIs(lang)) return speakAll(text, lang, rateMul);
    if (typeof warnedLangs !== 'undefined' && !voicesFor(lang).length && !warnedLangs.has('la')) {   // a clearer note than "No Latin voice found"
      warnedLangs.add('la'); warnedLangs.add(lang); toast('Latin is read with an Italian voice, and none was found on this PC. See Settings.');
    }
    return speakAll(laPlain(text), lang, rateMul);
  };
}
if (typeof speakWith === 'function') { const sw = speakWith; speakWith = (text, lang, uri, rate) => sw(laIs(lang) ? laPlain(text) : text, lang, uri, rate); }
if (typeof SAMPLE_SAY !== 'undefined') SAMPLE_SAY.la = 'Salvē! Sīc sonō.';

/* ---------- typed answers: macrons, i/j and u/v don't matter on Latin decks ---------- */
function laDeckNow() {
  try { const d = typeof currentDeckId === 'function' ? deckById(currentDeckId()) : null; return !!d && (laIs(d.frontLang) || laIs(d.backLang)); } catch { return false; }
}
if (typeof norm === 'function') {
  const normAll = norm;
  norm = function (s) { return laDeckNow() ? normAll(laFold(String(s ?? ''))) : normAll(s); };
}

/* ---------- 🎙️ Say it!: browsers can't hear Latin ---------- */
const LA_SAY_NOTE = 'Not for Latin: browsers can’t listen to Latin yet. Try 🎧 Listen & tap or ⌨️ Type the answer instead.';
if (typeof gameAvail === 'function') {
  const availAll = gameAvail;
  gameAvail = function (d) { const a = availAll(d); if (d && laIs(d.frontLang) && a.speak) a.speak = { ok: false, info: LA_SAY_NOTE }; return a; };
}
if (typeof views !== 'undefined' && views.speakgame) {
  const sayView = views.speakgame;
  views.speakgame = () => {
    const d = deckById(view.deckId);
    if (!d || !laIs(d.frontLang)) return sayView();
    return `<div class="crumbs"><a data-act="games" data-id="${d.id}">Games</a> / Say it!</div>
      <div class="panel stack" style="text-align:center"><div style="font-size:44px">🏛️🎙️</div>
        <h2 style="margin:0">Say it! isn’t ready for Latin</h2>
        <p class="muted" style="margin:0">Browsers can read Latin aloud (with an Italian voice), but they can’t listen to it yet, so Estudiamos can’t check what you say.
          Try <b>🎧 Listen &amp; tap</b>, the <b>🧩 Sentence Builder</b> or a quiz where you type the answer.</p>
        <div class="row" style="justify-content:center"><button type="button" class="btn primary" data-act="games" data-id="${d.id}">Other games</button></div></div>`;
  };
}
if (typeof skStart === 'function') { const st = skStart; skStart = function () { const d = deckById(view.deckId); if (d && laIs(d.frontLang)) return toast(LA_SAY_NOTE); return st(); }; }

/* ---------- 🔢 Numbers & ABC: Latin number words and Roman numerals ---------- */
if (typeof NG_LANGS !== 'undefined') {
  NG_LANGS.la = { name: 'Latin', flag: '🏛️', tts: 'la' };
  // cardinal numbers with macrons (typing them without macrons is fine). Latin has no word for zero: nihil = nothing.
  NG_WORDS.la = n => {
    const u = ['nihil', 'ūnus', 'duo', 'trēs', 'quattuor', 'quīnque', 'sex', 'septem', 'octō', 'novem', 'decem', 'ūndecim', 'duodecim', 'tredecim', 'quattuordecim', 'quīndecim', 'sēdecim', 'septendecim', 'duodēvīgintī', 'ūndēvīgintī'];
    const t = ['', '', 'vīgintī', 'trīgintā', 'quadrāgintā', 'quīnquāgintā', 'sexāgintā', 'septuāgintā', 'octōgintā', 'nōnāgintā'];
    const h = ['', 'centum', 'ducentī', 'trecentī', 'quadringentī', 'quīngentī', 'sescentī', 'septingentī', 'octingentī', 'nōngentī'];
    const next = ['', '', 'trīgintā', 'quadrāgintā', 'quīnquāgintā', 'sexāgintā', 'septuāgintā', 'octōgintā', 'nōnāgintā', 'centum'];
    // 28 = duodētrīgintā (two from thirty), 29 = ūndētrīgintā (one from thirty); the others: vīgintī ūnus, vīgintī duo…
    const two = x => x < 20 ? u[x] : x % 10 === 8 ? 'duodē' + next[Math.floor(x / 10)] : x % 10 === 9 ? 'ūndē' + next[Math.floor(x / 10)] : t[Math.floor(x / 10)] + (x % 10 ? ' ' + u[x % 10] : '');
    if (n === 1000) return 'mīlle'; if (n < 100) return two(n);
    return h[Math.floor(n / 100)] + (n % 100 ? ' ' + two(n % 100) : '');
  };
  // Classical names of the letters (no J, U or W yet: V was both u and v)
  NG_ABC.la = 'a:ā b:bē c:cē d:dē e:ē f:ef g:gē h:hā i:ī k:kā l:el m:em n:en o:ō p:pē q:kū r:er s:es t:tē v:ū x:ix y:ȳ Graeca z:zēta';
  NG_MODES.roman = { icon: '🏛️', label: 'Read the Roman numeral', desc: 'See a Roman numeral (like XLII), then pick the number.', latin: true };
  NG_MODES.romanWrite = { icon: '✒️', label: 'Find the Roman numeral', desc: 'See the digits, then pick the Roman numeral.', latin: true };
}
function laRoman(n) {
  let s = ''; for (const [v, r] of [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']]) while (n >= v) { s += r; n -= v; }
  return s;
}
if (typeof ngQuestion === 'function') {
  const ngqAll = ngQuestion;
  ngQuestion = function () {
    if (!NG_MODES[ng.mode]?.latin) return ngqAll();
    const pick = () => Math.max(1, ngPickNum());
    const n = pick(), near = new Set([n]);
    for (const x of shuffle([n + 1, n - 1, n + 10, n - 10, n + 4, n - 4, n + 5, n - 5, n + 40, n - 40, n + 100, n - 100])) { if (near.size >= 4) break; const [, lo, hi] = NG_RANGES[ng.range]; if (x >= Math.max(1, lo) && x <= hi) near.add(x); }
    for (let k = 0; near.size < 4 && k < 50; k++) near.add(pick());
    const opts = shuffle([...near]);
    const q = { mode: ng.mode, n, word: NG_WORDS.la(n), roman: laRoman(n), say: NG_WORDS.la(n) };
    if (ng.mode === 'roman') { q.opts = opts.map(String); q.answer = String(n); }
    else { q.opts = opts.map(laRoman); q.answer = q.roman; }
    ng.q = q; ng.t0 = Date.now();
  };
}
if (typeof ngAnswer === 'function') {   // ⌨️ Write the word: macrons and u/v don't matter (nōnāgintā = nonaginta)
  const ngaAll = ngAnswer;
  ngAnswer = function (given) { if (ng?.lang === 'la' && ng.mode === 'type' && ng.q && laFold(given).trim().replace(/\s+/g, ' ') === laFold(ng.q.answer)) given = ng.q.answer; return ngaAll(given); };
}
if (typeof views !== 'undefined' && views.numgame) {
  const ngView = views.numgame;
  views.numgame = () => {
    let h = ngView();
    if (!ng) {
      if (ngLang() !== 'la') h = h.replace(/<button type="button" class="ng-mode[^"]*" data-act="ngMode" data-k="roman(?:Write)?">[\s\S]*?<\/button>/g, '');
      else h = h.replace('<div><b>Alphabet</b>', '<p class="muted small" style="margin:0">🏛️ Latin is read aloud with an Italian voice, the closest one browsers have. Macrons (ā ē ī ō ū) are optional when you type.</p><div><b>Alphabet</b>');
    } else if (ng.q && ng.mode === 'roman') h = h.replace(`<div class="ng-big">${ng.q.n}</div>`, `<div class="ng-big">${ng.q.roman}</div>`);
    return h;
  };
  // a Roman numeral mode only makes sense in Latin: switching to another language goes back to "Hear the number"
  const ngLangAct = actions.ngLang;
  actions.ngLang = el => { if (el.dataset.k !== 'la' && NG_MODES[S.settings.ngMode]?.latin) S.settings.ngMode = 'hear'; return ngLangAct(el); };
}

/* ---------- game text and reports: Latin's English name ---------- */
if (typeof GT_LANG_ENGLISH !== 'undefined') GT_LANG_ENGLISH.la = 'Latin';
if (typeof GT_LANG_NAMES !== 'undefined') GT_LANG_NAMES.la = 'Latīna';

/* ---------- 🌐 Auto-translate: Wiktionary has Latin (its page names have no macrons) ---------- */
if (typeof txWiktionary === 'function') {
  const wik = txWiktionary;
  txWiktionary = (text, from, depth) => wik(laIs(from) ? laPlain(text) : text, from, depth);
}
if (typeof txCorpus === 'function') {
  const corpusAll = txCorpus;
  txCorpus = async lang => {
    if (lang !== 'la') return corpusAll(lang);
    return (txCorpusCache.la ||= fetch('data/real-la.json').then(r => r.ok ? r.json() : null).then(j => (j?.items || []).map(it => ({ src: laPlain(it[1] || '').toLowerCase(), en: String(it[2] || '').toLowerCase() }))).catch(() => null));
  };
}
if (typeof txAppIndex === 'function') {
  const appAll = txAppIndex;
  txAppIndex = lang => {
    if (lang !== 'la' || txAppCache.la) return appAll(lang);
    const fwd = new Map(), add = (w, en) => { w = laPlain(w).toLowerCase().trim(); if (!w || !en) return; for (const g of String(en).split(/\s*\/\s*/)) { const t = g.trim(); if (!t) continue; if (!fwd.has(w)) fwd.set(w, []); if (!fwd.get(w).includes(t)) fwd.get(w).push(t); } };
    if (typeof laWordList === 'function') for (const [w, en] of laWordList()) add(w, en);
    if (typeof RS_DICT !== 'undefined' && RS_DICT.la) for (const [w, [, g]] of RS_DICT.la) add(w, g);
    if (typeof STARTERS !== 'undefined' && STARTERS.la) for (const [f, b] of STARTERS.la.cards) { add(f, b); add(String(f).split(/,\s*/)[0], b); }
    const back = new Map(); for (const [w, list] of fwd) for (const t of list) { const k = txKey(t); if (!k) continue; if (!back.has(k)) back.set(k, []); if (!back.get(k).includes(w)) back.get(k).push(w); }
    return (txAppCache.la = { fwd, back });
  };
}

/* ---------- 🎴 Word card packs: the Latin name of every card ---------- */
// in card order (1–150). Modern things get the words Latin teachers and Neo-Latin dictionaries use.
const LA_PACK = ('fēlēs|canis|mālum|pānis|aqua|sōl|lūna|arbor|flōs|domus|liber|autocīnētum|pluvia|lac|piscis|avis|ōvum|sella|iānua|schola|'
  + 'amīcus|laetus|ruber|caeruleus|viridis|cāseus|lectus|calceus|manus|cor|equus|cunīculus|frāgum|placenta|nix|mōns|mare|trāmen|āëroplanum|mūsica|'
  + 'stēlla|umbella|crustulum|medicus|fortis|elephantus|sphēniscus|pāpiliō|arcus caelestis|īnsula|castellum|cithara|fulmen|thēsaurus|mōns ignivomus|pyraulus|bālaena|monocerōs|dracō|ūniversum|'
  + 'mūs|vacca|porcus|gallīna|rāna|anas|ariēna|mālum aurantium|oryza|iūs|cafēum|thea|sāl|fenestra|lectulus|clāvis|hōrologium|graphium|charta|pēra|'
  + 'magister|īnfāns|familia|māter|pater|trīstis|īrātus|fessus|flāvus|niger|albus|oculus|nāsus|ōs|auris|pēs|nūbēs|ventus|ignis|saxum|'
  + 'laophorum|birota|charta geōgraphica|tunica|pilleus|pila|leō|tigris|ursus|sīmia|vulpēs|testūdō|placenta Neāpolitāna|gelātum|socolāta|pepō|hēliotropium|folium|lītus|nāvis|'
  + 'clāvile|tympanum|coquus|vigil|custōs pūblicus|attonitus|pila canistrī|pallium|camēlopardalis|zebra|noctua|polypus|psittacus|cactus|dēsertum|turbō|fidicula|pyxis nautica|corōna|magus|'
  + 'planēta|squalus|aquila|comētēs|sīrēn|nympha|nāvis sīderea|victor|dīnosaurus|stēlla cadēns').split('|');
if (typeof WORD_CARDS !== 'undefined' && typeof LANG_COL !== 'undefined' && !LANG_COL.la) {
  const col = WORD_CARDS[0].length;   // a new column at the end, whatever other languages were added before it
  WORD_CARDS.forEach(c => { c[col] = LA_PACK[c[0] - 1] || c[2]; });
  LANG_COL.la = col; PACK_LANGS.push(['la', 'Latīna', 'la']);
}

/* ---------- a Latin starter deck (New deck window) ----------
   Fronts are written the way Latin dictionaries list words, so the Sentence Builder can read them:
   nouns with their genitive ending and gender (puella, -ae, f.), verbs with their principal parts (amō, amāre, amāvī, amātum). */
if (typeof STARTERS !== 'undefined') STARTERS.la = { name: 'Latin basics (sample)', flag: '🏛️', label: 'Latin', frontLang: 'la', backLang: 'en-US', cards: [
  ['salvē', 'hello', 'To more than one person: salvēte'], ['valē', 'goodbye', 'To more than one person: valēte'], ['grātiās tibi agō', 'thank you'], ['quaesō', 'please'],
  ['ita', 'yes'], ['minimē', 'no'], ['puella, -ae, f.', 'girl', '1st declension'], ['fēmina, -ae, f.', 'woman', '1st declension'], ['aqua, -ae, f.', 'water', '1st declension'],
  ['via, -ae, f.', 'road', '1st declension'], ['amīcus, -ī, m.', 'friend', '2nd declension'], ['servus, -ī, m.', 'slave', '2nd declension'], ['equus, -ī, m.', 'horse', '2nd declension'],
  ['puer, puerī, m.', 'boy', '2nd declension'], ['ager, agrī, m.', 'field', '2nd declension'], ['templum, -ī, n.', 'temple', '2nd declension, neuter'], ['bellum, -ī, n.', 'war', '2nd declension, neuter'],
  ['rēx, rēgis, m.', 'king', '3rd declension'], ['māter, mātris, f.', 'mother', '3rd declension'], ['pater, patris, m.', 'father', '3rd declension'], ['canis, canis, m.', 'dog', '3rd declension'],
  ['amō, amāre, amāvī, amātum', 'to love', '1st conjugation'], ['laudō, laudāre, laudāvī, laudātum', 'to praise', '1st conjugation'], ['videō, vidēre, vīdī, vīsum', 'to see', '2nd conjugation'],
  ['habeō, habēre, habuī, habitum', 'to have', '2nd conjugation'], ['dūcō, dūcere, dūxī, ductum', 'to lead', '3rd conjugation'], ['audiō, audīre, audīvī, audītum', 'to hear', '4th conjugation'],
  ['sum, esse, fuī, futūrus', 'to be', 'Irregular: sum, es, est, sumus, estis, sunt'], ['bonus, -a, -um', 'good'], ['magnus, -a, -um', 'big, great'], ['parvus, -a, -um', 'small'],
  ['et', 'and'], ['sed', 'but'], ['nōn', 'not'], ['hodiē', 'today'], ['crās', 'tomorrow'], ['ubi est…?', 'where is…?']] };

/* ---------- 🧩 Sentence Builder: 📖 real Latin sentences, and 🏛️ build your own ----------
   Real sentences are rebuilt in the order their writer used. Latin allows other orders too, so when every word is
   right but the order differs, the message says so. "Build your own" checks any grammatical order by its endings. */
if (typeof RS_LANGS !== 'undefined') RS_LANGS.la = 'Latin';
if (typeof rsCheck === 'function') {
  const rsCheckAll = rsCheck;
  rsCheck = function () {
    rsCheckAll();
    if (rs?.lang !== 'la' || rs.done || rs.frame) return;
    const k = w => laFold(rsKey(w, 'la')), built = rs.line.map(rsChip).map(c => k(c.w)).sort().join(' '), want = rs.words.map(k).sort().join(' ');
    if (rs.line.length === rs.words.length && built === want) { rs.msg = '🏛️ All the right words! Latin lets you put them in other orders too, but here, rebuild the order this sentence’s writer used. Tap 💡 Hint for help.'; render(); }
  };
}
if (typeof views !== 'undefined' && views.realsent) {
  const rsView = views.realsent;
  views.realsent = () => {
    const h = rsView();
    if (rs?.lang !== 'la') return h;
    return h + `<div class="gt-report"><button type="button" class="btn sm" data-act="laBuildOwn">🏛️ Build your own Latin sentences</button>
      <span class="muted small">Any word order the endings allow is right there. Sentences are read aloud with an Italian voice.</span></div>`;
  };
  Object.assign(actions, { laBuildOwn: () => { if (typeof startBuilder !== 'function') return; const id = rs?.deckId; startBuilder(id); if (bld) { bld.lang = 'la'; bldRound(); render(); } } });
}
if (typeof views !== 'undefined' && views.builder) {
  const bView = views.builder;
  views.builder = () => { const h = bView(); return bld?.lang === 'la' ? h.replace('· Latin grammar</span>', '· Latin grammar · any word order the endings allow</span>') : h; };
}

/* ---------- ⚔️ Lexicon Saga: spoken spells need speech recognition, which has no Latin, so Latin spells are typed ---------- */
if (typeof sgSpellAsk === 'function' && typeof sgAskSpell === 'function') {
  const askAll = sgSpellAsk;
  sgSpellAsk = sp => typeof sg !== 'undefined' && laIs(sg?.d?.frontLang) ? sgAskSpell : askAll(sp);
}
