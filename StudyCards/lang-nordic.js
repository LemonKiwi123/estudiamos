'use strict';
/* ================= Swedish (sv), Norwegian Bokmål (nb) and Danish (da): what the rest of the app needs =================
   Registered from here so no shared file has to change: voice samples and the sentence search's ISO codes, 🔢 Numbers &
   ABC, 🎙️ Say it!, typed answers (aa / ae / oe count as å / ä / ö in Swedish and å / æ / ø in Norwegian and Danish, only on
   decks in that language), the starter decks, the word card packs, 🌐 Auto-translate (the builder's words and the real
   sentences), and Norwegian decks set to "no" working like "nb" everywhere (voices, Sentence Builder, game text,
   real sentences). The deck language list already has sv-SE, nb-NO and da-DK.
   Loaded last of the Scandinavian files, after translate.js, numgame.js, speakgame.js, starters.js and packs.js. */
const NO_CODES = ['sv', 'nb', 'da'];
const noBaseOf = l => { const b = String(l || '').toLowerCase().split(/[-_]/)[0]; return b === 'no' || b === 'nn' ? 'nb' : b; };
if (typeof SAMPLE_SAY !== 'undefined') Object.assign(SAMPLE_SAY, { sv: 'Hej! Så här låter jag.', nb: 'Hei! Slik høres jeg ut.', no: 'Hei! Slik høres jeg ut.', da: 'Hej! Sådan lyder jeg.' });
if (typeof ISO3 !== 'undefined') Object.assign(ISO3, { sv: 'swe', nb: 'nob', no: 'nob', da: 'dan' });

/* ---------- "no" = "nb": hidden aliases, so the lists don't show Norwegian twice ---------- */
const noAlias = (obj, from, to) => { if (obj && obj[to] && !(from in obj)) Object.defineProperty(obj, from, { get: () => obj[to], enumerable: false, configurable: true }); };
for (const o of [typeof BLD_LANGS !== 'undefined' && BLD_LANGS, typeof BLD_MINE !== 'undefined' && BLD_MINE, typeof BLD_ORDER !== 'undefined' && BLD_ORDER, typeof RS_LANGS !== 'undefined' && RS_LANGS,
  typeof RS_CLOSED !== 'undefined' && RS_CLOSED, typeof RS_DICT !== 'undefined' && RS_DICT, typeof GT_BOOKS !== 'undefined' && GT_BOOKS, typeof GT_LANG_NAMES !== 'undefined' && GT_LANG_NAMES,
  typeof GT_LANG_ENGLISH !== 'undefined' && GT_LANG_ENGLISH]) noAlias(o, 'no', 'nb');
if (typeof startRealSentences === 'function') { const prev = startRealSentences; startRealSentences = function (deckId, lang) { return prev(deckId, lang === 'no' ? 'nb' : lang); }; }
// Windows calls the Norwegian voice nb-NO, some phones no-NO: either one reads both
if (typeof voicesFor === 'function') {
  const prevVoices = voicesFor;
  voicesFor = function (lang) {
    const own = prevVoices(lang), b = String(lang || '').toLowerCase().split('-')[0];
    if (own.length || !['nb', 'no', 'nn'].includes(b)) return own;
    return [...prevVoices('nb-NO'), ...prevVoices('no-NO'), ...prevVoices('nn-NO')];
  };
}

/* ---------- 🔢 Numbers & ABC ---------- */
if (typeof NG_LANGS !== 'undefined') {
  NG_LANGS.sv = { name: 'Swedish', flag: '🇸🇪', tts: 'sv-SE' };
  NG_LANGS.nb = { name: 'Norwegian', flag: '🇳🇴', tts: 'nb-NO' };
  NG_LANGS.da = { name: 'Danish', flag: '🇩🇰', tts: 'da-DK' };
  // Swedish: one word (tvåhundrafemtiotre), "ett" for 1
  NG_WORDS.sv = function (n) {
    const u = ['noll', 'ett', 'två', 'tre', 'fyra', 'fem', 'sex', 'sju', 'åtta', 'nio', 'tio', 'elva', 'tolv', 'tretton', 'fjorton', 'femton', 'sexton', 'sjutton', 'arton', 'nitton'];
    const t = ['', '', 'tjugo', 'trettio', 'fyrtio', 'femtio', 'sextio', 'sjuttio', 'åttio', 'nittio'];
    const two = x => x < 20 ? u[x] : t[Math.floor(x / 10)] + (x % 10 ? u[x % 10] : '');
    if (n === 1000) return 'tusen'; if (n < 100) return two(n);
    const c = Math.floor(n / 100), r = n % 100;
    return (c === 1 ? 'hundra' : u[c] + 'hundra') + (r ? two(r) : '');
  };
  // Norwegian: to hundre og femtitre, tjueen
  NG_WORDS.nb = function (n) {
    const u = ['null', 'en', 'to', 'tre', 'fire', 'fem', 'seks', 'sju', 'åtte', 'ni', 'ti', 'elleve', 'tolv', 'tretten', 'fjorten', 'femten', 'seksten', 'sytten', 'atten', 'nitten'];
    const t = ['', '', 'tjue', 'tretti', 'førti', 'femti', 'seksti', 'sytti', 'åtti', 'nitti'];
    const two = x => x < 20 ? u[x] : t[Math.floor(x / 10)] + (x % 10 ? u[x % 10] : '');
    if (n === 1000) return 'tusen'; if (n < 100) return two(n);
    const c = Math.floor(n / 100), r = n % 100;
    return (c === 1 ? 'hundre' : u[c] + ' hundre') + (r ? ' og ' + two(r) : '');
  };
  // Danish: the ones come first (enogtyve), and the tens count in twenties (halvtreds = 50, tres = 60, firs = 80)
  NG_WORDS.da = function (n) {
    const u = ['nul', 'en', 'to', 'tre', 'fire', 'fem', 'seks', 'syv', 'otte', 'ni', 'ti', 'elleve', 'tolv', 'tretten', 'fjorten', 'femten', 'seksten', 'sytten', 'atten', 'nitten'];
    const t = ['', '', 'tyve', 'tredive', 'fyrre', 'halvtreds', 'tres', 'halvfjerds', 'firs', 'halvfems'];
    const two = x => x < 20 ? u[x] : (x % 10 ? u[x % 10] + 'og' : '') + t[Math.floor(x / 10)];
    if (n === 1000) return 'tusind'; if (n < 100) return two(n);
    const c = Math.floor(n / 100), r = n % 100;
    return (c === 1 ? 'hundrede' : u[c] + ' hundrede') + (r ? ' og ' + two(r) : '');
  };
  NG_ABC.sv = 'a:a b:be c:ce d:de e:e f:äff g:ge h:hå i:i j:ji k:kå l:äll m:äm n:än o:o p:pe q:ku r:ärr s:äss t:te u:u v:ve w:dubbel-ve x:äks y:y z:säta å:å ä:ä ö:ö';
  NG_ABC.nb = 'a:a b:be c:se d:de e:e f:eff g:ge h:hå i:i j:je k:kå l:ell m:em n:en o:o p:pe q:ku r:ærr s:ess t:te u:u v:ve w:dobbelt-ve x:eks y:y z:sett æ:æ ø:ø å:å';
  NG_ABC.da = 'a:a b:be c:se d:de e:e f:æf g:ge h:hå i:i j:jod k:kå l:æl m:æm n:æn o:o p:pe q:ku r:ær s:æs t:te u:u v:ve w:dobbelt-ve x:æks y:y z:sæt æ:æ ø:ø å:å';
  for (const o of [NG_LANGS, NG_WORDS, NG_ABC]) noAlias(o, 'no', 'nb');
}
// aa / ae / oe for the special letters, in the deck's own language only
const noFold = (s, lang) => { s = String(s ?? '').toLowerCase().normalize('NFC');
  return lang === 'sv' ? s.replace(/å/g, 'aa').replace(/ä/g, 'ae').replace(/ö/g, 'oe') : s.replace(/å/g, 'aa').replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/é/g, 'e'); };
// the other right ways to write a number: "en" or "ett" for 1, "ett hundra", syv / sju, tyve / tjue (old Norwegian), "et hundrede"
const noNumAlts = (w, lang) => {
  const s = String(w), out = new Set([s, s.replace(/\s+/g, ''), s.replace(/ og /g, ' ')]);
  if (lang === 'sv') { out.add(s.replace(/^ett$/, 'en')); out.add(s.replace(/^hundra/, 'etthundra')); out.add(s.replace(/^tusen$/, 'ettusen')); }
  if (lang === 'nb') { for (const x of [...out]) { out.add(x.replace(/^en$/, 'ett')); out.add(x.replace(/^en$/, 'én')); out.add(x.replace(/sju/g, 'syv')); out.add(x.replace(/^hundre/, 'ett hundre')); out.add(x.replace(/^tusen$/, 'ett tusen')); } }
  if (lang === 'da') { for (const x of [...out]) { out.add(x.replace(/^en$/, 'et')); out.add(x.replace(/^hundrede/, 'et hundrede')); out.add(x.replace(/^tusind$/, 'et tusind')); } }
  return [...out];
};
if (typeof ngAnswer === 'function') {
  const prevAnswer = ngAnswer;
  ngAnswer = function (given) {
    if (typeof ng !== 'undefined' && NO_CODES.includes(ng?.lang) && ng.mode === 'type' && ng.q && typeof given === 'string') {
      const clean = s => noFold(s, ng.lang).trim().replace(/[\s-]+/g, ' ');
      if (noNumAlts(ng.q.answer, ng.lang).some(a => clean(a) === clean(given) || clean(a).replace(/ /g, '') === clean(given).replace(/ /g, ''))) given = ng.q.answer;
    }
    return prevAnswer(given);
  };
}

/* ---------- typed answers (cards and ⚔️ Lexicon Saga spells): aa = å, ae = ä / æ, oe = ö / ø ---------- */
function noDeckLang() {
  try { const d = typeof currentDeckId === 'function' ? deckById(currentDeckId()) : null; if (!d) return null;
    const f = noBaseOf(d.frontLang), b = noBaseOf(d.backLang); return NO_CODES.includes(f) ? f : NO_CODES.includes(b) ? b : null; } catch { return null; }
}
const noNormFold = (s, lang) => noFold(s, lang).replace(/[¿?¡!.,;:"'“”‘’«»()[\]…\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
const noParts = a => [String(a || ''), ...String(a || '').split(/[\/;,]/)].flatMap(p => [p, p.replace(/\([^)]*\)/g, ' ')]).map(p => p.trim()).filter(Boolean);
if (typeof checkTyped === 'function') {
  const prevCheck = checkTyped;
  checkTyped = function (input, ans) {
    const r = prevCheck(input, ans), lang = r.ok && !r.typo ? null : noDeckLang(); if (!lang) return r;
    const hit = noParts(ans).find(p => noNormFold(p, lang) === noNormFold(input, lang));
    return hit ? prevCheck(hit, ans) : r;
  };
}
if (typeof sgGrade === 'function') {
  const prevGrade = sgGrade;
  sgGrade = function (given, answer) {
    const r = prevGrade(given, answer), lang = r === 'exact' ? null : noDeckLang(); if (!lang) return r;
    const hit = noParts(answer).find(p => noNormFold(p, lang) === noNormFold(given, lang));
    return hit ? prevGrade(hit, answer) : r;
  };
}

/* ---------- 🎙️ Say it!: en / ett / den… in front don't matter, and a number heard as digits counts ---------- */
if (typeof SK_ARTICLES !== 'undefined') {
  SK_ARTICLES.sv = ['en', 'ett', 'den', 'det', 'de', 'att'];
  SK_ARTICLES.nb = ['en', 'ei', 'et', 'den', 'det', 'de', 'å'];
  SK_ARTICLES.da = ['en', 'et', 'den', 'det', 'de', 'at'];
  noAlias(SK_ARTICLES, 'no', 'nb');
}
if (typeof skNorm === 'function') {
  const prevNorm = skNorm;
  skNorm = function (text, lang) {
    const b = noBaseOf(lang); if (!NO_CODES.includes(b)) return prevNorm(text, lang);
    return prevNorm(String(text || '').replace(/\b\d{1,3}\b/g, n => +n <= 1000 && NG_WORDS?.[b] ? NG_WORDS[b](+n) : n), lang);
  };
}
if (typeof skMatch === 'function') {   // long compound words are sometimes heard as two: "glass bil" = glassbil
  const prevMatch = skMatch;
  skMatch = function (heard, card, lang) {
    const r = prevMatch(heard, card, lang); if (r.ok && !r.close || !NO_CODES.includes(noBaseOf(lang))) return r;
    const answers = skAnswers(card, lang).map(a => a.replace(/[\s-]/g, ''));
    const hit = heard.find(h => { const s = skNorm(h, lang).replace(/[\s-]/g, ''); return s.length > 4 && answers.includes(s); });
    return hit ? { ok: true, close: false, heard: hit } : r;
  };
}

/* ---------- starter decks (New deck window) ---------- */
if (typeof STARTERS !== 'undefined') {
  STARTERS.sv = { name: 'Swedish basics (sample)', flag: '🇸🇪', label: 'Swedish', frontLang: 'sv-SE', backLang: 'en-US', cards: [
    ['hej', 'hi / hello'], ['god morgon', 'good morning'], ['tack', 'thank you'], ['snälla', 'please'], ['hej då', 'goodbye'], ['ja', 'yes'], ['nej', 'no'],
    ['en hund', 'a dog', 'The dog: hunden'], ['en katt', 'a cat', 'The cat: katten'], ['ett hus', 'a house', 'An “ett” word: huset, det stora huset'], ['vatten', 'water', 'The water: vattnet'],
    ['bröd', 'bread'], ['ett äpple', 'an apple', 'Plural: äpplen'], ['en bok', 'a book', 'Plural: böcker'], ['en skola', 'a school'], ['en vän', 'a friend', 'Plural: vänner'], ['ett barn', 'a child', 'Plural: barn (the same)'],
    ['äta', 'to eat', 'jag äter, du äter (the same for everyone)'], ['dricka', 'to drink', 'jag dricker'], ['tala', 'to speak', 'jag talar'], ['gå', 'to go / walk', 'jag går'], ['vara', 'to be', 'jag är, du är, vi är'],
    ['ha', 'to have', 'jag har'], ['stor', 'big', 'ett stort hus, stora hus'], ['liten', 'small', 'ett litet hus, små hus'], ['bra', 'good'], ['ny', 'new', 'ett nytt hus'], ['i dag', 'today'], ['i morgon', 'tomorrow'],
    ['Var är toaletten?', 'Where is the bathroom?']] };
  STARTERS.nb = { name: 'Norwegian basics (sample)', flag: '🇳🇴', label: 'Norwegian', frontLang: 'nb-NO', backLang: 'en-US', cards: [
    ['hei', 'hi / hello'], ['god morgen', 'good morning'], ['takk', 'thank you'], ['vær så snill', 'please'], ['ha det', 'bye'], ['ja', 'yes'], ['nei', 'no'],
    ['en hund', 'a dog', 'The dog: hunden'], ['en katt', 'a cat', 'The cat: katten'], ['et hus', 'a house', 'An “et” word: huset, det store huset'], ['vann', 'water', 'The water: vannet'],
    ['brød', 'bread'], ['et eple', 'an apple', 'Plural: epler'], ['ei bok', 'a book', 'Feminine: boka (or boken). Plural: bøker'], ['en skole', 'a school'], ['en venn', 'a friend', 'Plural: venner'], ['ei jente', 'a girl', 'Feminine: jenta'],
    ['spise', 'to eat', 'jeg spiser, du spiser (the same for everyone)'], ['drikke', 'to drink', 'jeg drikker'], ['snakke', 'to speak', 'jeg snakker'], ['gå', 'to go / walk', 'jeg går'], ['være', 'to be', 'jeg er, du er, vi er'],
    ['ha', 'to have', 'jeg har'], ['stor', 'big', 'et stort hus, store hus'], ['liten', 'small', 'et lite hus, små hus'], ['god', 'good', 'et godt eple'], ['ny', 'new', 'et nytt hus'], ['i dag', 'today'], ['i morgen', 'tomorrow'],
    ['Hvor er toalettet?', 'Where is the bathroom?']] };
  STARTERS.da = { name: 'Danish basics (sample)', flag: '🇩🇰', label: 'Danish', frontLang: 'da-DK', backLang: 'en-US', cards: [
    ['hej', 'hi / hello'], ['godmorgen', 'good morning'], ['tak', 'thank you'], ['vær så venlig', 'please'], ['farvel', 'goodbye'], ['ja', 'yes'], ['nej', 'no'],
    ['en hund', 'a dog', 'The dog: hunden'], ['en kat', 'a cat', 'The cat: katten'], ['et hus', 'a house', 'An “et” word: huset, but det store hus'], ['vand', 'water', 'The water: vandet'],
    ['brød', 'bread'], ['et æble', 'an apple', 'Plural: æbler'], ['en bog', 'a book', 'Plural: bøger'], ['en skole', 'a school'], ['en ven', 'a friend', 'Plural: venner'], ['et barn', 'a child', 'Plural: børn'],
    ['spise', 'to eat', 'jeg spiser, du spiser (the same for everyone)'], ['drikke', 'to drink', 'jeg drikker'], ['tale', 'to speak', 'jeg taler'], ['gå', 'to go / walk', 'jeg går'], ['være', 'to be', 'jeg er, du er, vi er'],
    ['have', 'to have', 'jeg har'], ['stor', 'big', 'et stort hus, store huse'], ['lille', 'small', 'et lille hus, små huse'], ['god', 'good', 'et godt æble'], ['ny', 'new', 'et nyt hus'], ['i dag', 'today'], ['i morgen', 'tomorrow'],
    ['Hvor er toilettet?', 'Where is the bathroom?']] };
  noAlias(STARTERS, 'no', 'nb');
}

/* ---------- 🎴 Word card packs: the name of every card, in card order (1–150) ---------- */
const NO_PACK = {
  sv: 'katt|hund|äpple|bröd|vatten|sol|måne|träd|blomma|hus|bok|bil|regn|mjölk|fisk|fågel|ägg|stol|dörr|skola|vän|glad|röd|blå|grön|ost|säng|sko|hand|hjärta|häst|kanin|jordgubbe|tårta|snö|berg|hav|tåg|flygplan|musik|stjärna|paraply|kaka|läkare|modig|elefant|pingvin|fjäril|regnbåge|ö|slott|gitarr|blixt|skatt|vulkan|raket|val|enhörning|drake|universum|mus|ko|gris|höna|groda|anka|banan|apelsin|ris|soppa|kaffe|te|salt|fönster|soffa|nyckel|klocka|penna|papper|ryggsäck|lärare|bebis|familj|mamma|pappa|ledsen|arg|trött|gul|svart|vit|öga|näsa|mun|öra|fot|moln|vind|eld|sten|buss|cykel|karta|skjorta|hatt|boll|lejon|tiger|björn|apa|räv|sköldpadda|pizza|glass|choklad|vattenmelon|solros|löv|strand|skepp|piano|trumma|kock|brandman|polis|förvånad|basket|kappa|giraff|zebra|uggla|bläckfisk|papegoja|kaktus|öken|tornado|fiol|kompass|krona|trollkarl|planet|haj|örn|komet|sjöjungfru|fe|rymdskepp|mästare|dinosaurie|stjärnfall',
  nb: 'katt|hund|eple|brød|vann|sol|måne|tre|blomst|hus|bok|bil|regn|melk|fisk|fugl|egg|stol|dør|skole|venn|glad|rød|blå|grønn|ost|seng|sko|hånd|hjerte|hest|kanin|jordbær|kake|snø|fjell|hav|tog|fly|musikk|stjerne|paraply|kjeks|lege|modig|elefant|pingvin|sommerfugl|regnbue|øy|slott|gitar|lyn|skatt|vulkan|rakett|hval|enhjørning|drage|univers|mus|ku|gris|høne|frosk|and|banan|appelsin|ris|suppe|kaffe|te|salt|vindu|sofa|nøkkel|klokke|blyant|papir|ryggsekk|lærer|baby|familie|mor|far|trist|sint|trøtt|gul|svart|hvit|øye|nese|munn|øre|fot|sky|vind|ild|stein|buss|sykkel|kart|skjorte|hatt|ball|løve|tiger|bjørn|ape|rev|skilpadde|pizza|is|sjokolade|vannmelon|solsikke|blad|strand|skip|piano|tromme|kokk|brannmann|politi|overrasket|basketball|kåpe|sjiraff|sebra|ugle|blekksprut|papegøye|kaktus|ørken|tornado|fiolin|kompass|krone|trollmann|planet|hai|ørn|komet|havfrue|fe|romskip|mester|dinosaur|stjerneskudd',
  da: 'kat|hund|æble|brød|vand|sol|måne|træ|blomst|hus|bog|bil|regn|mælk|fisk|fugl|æg|stol|dør|skole|ven|glad|rød|blå|grøn|ost|seng|sko|hånd|hjerte|hest|kanin|jordbær|kage|sne|bjerg|hav|tog|fly|musik|stjerne|paraply|småkage|læge|modig|elefant|pingvin|sommerfugl|regnbue|ø|slot|guitar|lyn|skat|vulkan|raket|hval|enhjørning|drage|univers|mus|ko|gris|høne|frø|and|banan|appelsin|ris|suppe|kaffe|te|salt|vindue|sofa|nøgle|ur|blyant|papir|rygsæk|lærer|baby|familie|mor|far|ked af det|vred|træt|gul|sort|hvid|øje|næse|mund|øre|fod|sky|vind|ild|sten|bus|cykel|kort|skjorte|hat|bold|løve|tiger|bjørn|abe|ræv|skildpadde|pizza|is|chokolade|vandmelon|solsikke|blad|strand|skib|klaver|tromme|kok|brandmand|politibetjent|overrasket|basketball|frakke|giraf|zebra|ugle|blæksprutte|papegøje|kaktus|ørken|tornado|violin|kompas|krone|troldmand|planet|haj|ørn|komet|havfrue|fe|rumskib|mester|dinosaur|stjerneskud' };
if (typeof WORD_CARDS !== 'undefined' && typeof LANG_COL !== 'undefined') {
  for (const [code, label, voice] of [['sv', 'Svenska', 'sv-SE'], ['nb', 'Norsk', 'nb-NO'], ['da', 'Dansk', 'da-DK']]) {
    if (LANG_COL[code]) continue;
    const names = NO_PACK[code].split('|'), col = WORD_CARDS[0].length;   // a new column at the end, whatever other languages added before
    WORD_CARDS.forEach(c => { c[col] = names[c[0] - 1] || c[2]; });
    LANG_COL[code] = col; PACK_LANGS.push([code, label, voice]);
  }
  noAlias(LANG_COL, 'no', 'nb');
}

/* ---------- 🌐 Auto-translate: the real sentences help pick between meanings, and the builder's words are "built-in words" ---------- */
if (typeof txCorpus === 'function') {
  const prevCorpus = txCorpus;
  txCorpus = async function (lang) {
    const b = noBaseOf(lang); if (!NO_CODES.includes(b)) return prevCorpus(lang);
    return (txCorpusCache[b] ||= fetch(`data/real-${b}.json`).then(r => r.ok ? r.json() : null).then(j => (j?.items || []).map(it => ({ src: String(it[1] || '').toLowerCase(), en: String(it[2] || '').toLowerCase() }))).catch(() => null));
  };
}
if (typeof txAppIndex === 'function') {
  const prevIndex = txAppIndex;
  txAppIndex = function (lang) {
    const b = noBaseOf(lang); if (!NO_CODES.includes(b)) return prevIndex(lang);
    if (txAppCache[b]?.nordic) return txAppCache[b];
    const idx = prevIndex(b), fwd = idx?.fwd || new Map();
    const add = (w, en) => { w = String(w || '').toLowerCase().trim(); if (!w || !en) return; for (const g of String(en).split(/\s*\/\s*/)) { const t = g.trim(); if (!t || /\(/.test(t)) continue; if (!fwd.has(w)) fwd.set(w, []); if (!fwd.get(w).includes(t)) fwd.get(w).push(t); } };
    const L = typeof NO_LANG !== 'undefined' ? NO_LANG[b] : null;
    if (L) {
      for (const n of L.N) { add(n.w, n.en); add(n.def, n.en); if (n.pl) add(n.pl, n.enPl); }
      for (const a of L.A) add(a.b, a.en);
      for (const v of L.V) { add(v.inf, v.t === 'modal' ? v.en : 'to ' + v.en); add(v.pres, v.en); }
      for (const a of [...L.adv, ...L.conj]) add(a[0], a[1]);
      for (const p of L.pron) add(p[0], p[2]);
    }
    for (const [w, [, g]] of RS_DICT[b] || []) if (g && !/\(/.test(g)) add(w, g);
    if (typeof STARTERS !== 'undefined' && STARTERS[b]) for (const [f, bk] of STARTERS[b].cards) { add(f, bk); add(String(f).replace(/^(en|ett|et|ei)\s+/i, ''), String(bk).replace(/^(a|an)\s+/i, '')); }
    const back = new Map(); for (const [w, list] of fwd) for (const t of list) { const k = txKey(t); if (!k) continue; if (!back.has(k)) back.set(k, []); if (!back.get(k).includes(w)) back.get(k).push(w); }
    return (txAppCache[b] = { fwd, back, nordic: true });
  };
}
