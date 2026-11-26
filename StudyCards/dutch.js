'use strict';
/* ================= Dutch (nl): what the whole app needs =================
   Dutch (nl-NL voice) in the shared lists, registered from here so no shared file has to change much:
   🔢 Numbers & ABC, 🎙️ Say it!, the starter deck, the word card packs, typed answers (ij typed as y counts),
   🌐 Auto-translate (the Sentence Builder's Dutch words and the Dutch real sentences) and the Sentence Builder's
   description. The deck language list, the voice sample and the sentence search already know Dutch.
   Loaded after translate.js, numgame.js, speakgame.js, starters.js, packs.js, saga.js and the other Dutch files. */

/* ---------- 🔢 Numbers & ABC ----------
   eenentwintig, tweeëntwintig (ë after a word ending in e), honderdeen, tweehonderd, duizend. Typing without the
   dots (tweeentwintig) or één for een counts too. */
if (typeof NG_LANGS !== 'undefined') {
  NG_LANGS.nl = { name: 'Dutch', flag: '🇳🇱', tts: 'nl-NL' };
  NG_WORDS.nl = function (n) {
    const u = ['nul', 'een', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf', 'dertien', 'veertien', 'vijftien', 'zestien', 'zeventien', 'achttien', 'negentien'];
    const t = ['', '', 'twintig', 'dertig', 'veertig', 'vijftig', 'zestig', 'zeventig', 'tachtig', 'negentig'];
    const two = x => x < 20 ? u[x] : (x % 10 ? u[x % 10] + (/e$/.test(u[x % 10]) ? 'ën' : 'en') : '') + t[Math.floor(x / 10)];
    if (n === 1000) return 'duizend'; if (n < 100) return two(n);
    const c = Math.floor(n / 100), r = n % 100;
    return (c === 1 ? 'honderd' : u[c] + 'honderd') + (r ? two(r) : '');
  };
  NG_ABC.nl = 'a:a b:bee c:cee d:dee e:ee f:ef g:gee h:ha i:i j:jee k:ka l:el m:em n:en o:o p:pee q:ku r:er s:es t:tee u:u v:vee w:wee x:iks y:i-grec z:zet ij:ij';
}

/* ---------- typed answers on Dutch decks: ij typed as y counts (ijs = ys, blij = bly) ---------- */
const nlFold = s => String(s ?? '').toLowerCase().normalize('NFC').replace(/ĳ/g, 'ij').replace(/ij/g, 'y');
const nlIs = l => String(l || '').toLowerCase().split(/[-_]/)[0] === 'nl';
function nlDeckNow() { try { const d = typeof currentDeckId === 'function' ? deckById(currentDeckId()) : null; return !!d && (nlIs(d.frontLang) || nlIs(d.backLang)); } catch { return false; } }
const nlNormFold = s => nlFold(typeof norm === 'function' ? norm(s) : s).replace(/[¿?¡!.,;:"'“”‘’«»()[\]…\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
if (typeof checkTyped === 'function') {
  const checkAll = checkTyped;
  checkTyped = function (input, ans) {
    const r = checkAll(input, ans);
    if (r.ok && !r.typo || !nlDeckNow() || !/y/i.test(String(input || ''))) return r;
    const parts = [String(ans || ''), ...String(ans || '').split(/[\/;,]/)].flatMap(p => [p, p.replace(/\([^)]*\)/g, ' ')]).map(p => p.trim()).filter(Boolean);
    const hit = parts.find(p => nlNormFold(p) === nlNormFold(input));
    if (hit) return checkAll(hit, ans);
    // a typo after the y: check again with ij put back
    const back = String(input).replace(/y/gi, m => m === 'Y' ? 'IJ' : 'ij'), r2 = checkAll(back, ans);
    return r2.ok ? r2 : r;
  };
}
if (typeof sgGrade === 'function') {   // ⚔️ Lexicon Saga spells
  const gradeAll = sgGrade;
  sgGrade = function (given, answer) {
    const r = gradeAll(given, answer);
    if (r === 'exact' || !nlDeckNow() || !/y/i.test(String(given || ''))) return r;
    const hit = [String(answer), ...String(answer).split(/[,;/]/)].map(p => p.trim()).find(p => p && nlNormFold(p) === nlNormFold(given));
    return hit ? gradeAll(hit, answer) : gradeAll(String(given).replace(/y/gi, m => m === 'Y' ? 'IJ' : 'ij'), answer);
  };
}

/* ---------- 🎙️ Say it!: de / het / een in front don't matter (speakgame.js has them), and a number heard as digits counts (3 = drie) ---------- */
if (typeof SK_ARTICLES !== 'undefined' && !SK_ARTICLES.nl) SK_ARTICLES.nl = ['de', 'het', 'een'];
if (typeof skNorm === 'function') {
  const normAll = skNorm;
  skNorm = function (text, lang) {
    if (String(lang || '').split('-')[0].toLowerCase() !== 'nl') return normAll(text, lang);
    return normAll(String(text || '').replace(/ĳ/g, 'ij').replace(/\b\d{1,3}\b/g, n => typeof NG_WORDS !== 'undefined' && NG_WORDS.nl ? NG_WORDS.nl(+n) : n), lang);
  };
}
if (typeof skMatch === 'function') {   // long Dutch words are sometimes heard as two: "super markt" = supermarkt
  const matchAll = skMatch;
  skMatch = function (heard, card, lang) {
    const r = matchAll(heard, card, lang); if (String(lang || '').split('-')[0].toLowerCase() !== 'nl' || r.ok && !r.close) return r;
    const answers = skAnswers(card, lang).map(a => a.replace(/[\s-]/g, ''));
    const hit = heard.find(h => { const s = skNorm(h, lang).replace(/[\s-]/g, ''); return s.length > 5 && answers.includes(s); });
    return hit ? { ok: true, close: false, heard: hit } : r;
  };
}

/* ---------- a Dutch starter deck (New deck window) ---------- */
if (typeof STARTERS !== 'undefined') STARTERS.nl = { name: 'Dutch basics (sample)', flag: '🇳🇱', label: 'Dutch', frontLang: 'nl-NL', backLang: 'en-US', cards: [
  ['hallo', 'hello'], ['goedemorgen', 'good morning'], ['dank je wel', 'thank you'], ['alsjeblieft', 'please', 'Also: here you are'], ['doei', 'bye'], ['ja', 'yes'], ['nee', 'no'],
  ['de hond', 'the dog', 'Plural: de honden'], ['de kat', 'the cat', 'Plural: de katten'], ['het huis', 'the house', 'Plural: de huizen'], ['het water', 'the water'], ['het brood', 'the bread'],
  ['de appel', 'the apple', 'Plural: de appels'], ['het boek', 'the book', 'Plural: de boeken'], ['de school', 'the school', 'naar school, op school (no article)'], ['de vriend', 'the friend', 'A female friend: de vriendin'],
  ['het meisje', 'the girl', 'Words ending in -je are always “het”'],
  ['eten', 'to eat', 'ik eet, jij eet, hij eet'], ['drinken', 'to drink', 'ik drink, jij drinkt'], ['spreken', 'to speak', 'ik spreek, jij spreekt'], ['gaan', 'to go', 'ik ga, jij gaat'],
  ['zien', 'to see', 'ik zie, jij ziet'], ['lezen', 'to read', 'ik lees, jij leest'], ['opbellen', 'to call (on the phone)', 'It splits: ik bel je op'],
  ['groot', 'big', 'de grote hond, een groot huis'], ['klein', 'small'], ['goed', 'good'], ['nieuw', 'new'], ['vandaag', 'today'], ['morgen', 'tomorrow'], ['Waar is het toilet?', 'Where is the bathroom?']] };

/* ---------- 🎴 Word card packs: the Dutch name of every card ---------- */
// in card order (1–150)
const NL_PACK = ('kat|hond|appel|brood|water|zon|maan|boom|bloem|huis|boek|auto|regen|melk|vis|vogel|ei|stoel|deur|school|'
  + 'vriend|blij|rood|blauw|groen|kaas|bed|schoen|hand|hart|paard|konijn|aardbei|taart|sneeuw|berg|zee|trein|vliegtuig|muziek|'
  + 'ster|paraplu|koekje|dokter|dapper|olifant|pinguïn|vlinder|regenboog|eiland|kasteel|gitaar|bliksem|schat|vulkaan|raket|walvis|eenhoorn|draak|heelal|'
  + 'muis|koe|varken|kip|kikker|eend|banaan|sinaasappel|rijst|soep|koffie|thee|zout|raam|bank|sleutel|klok|potlood|papier|rugzak|'
  + 'leraar|baby|familie|moeder|vader|verdrietig|boos|moe|geel|zwart|wit|oog|neus|mond|oor|voet|wolk|wind|vuur|steen|'
  + 'bus|fiets|kaart|overhemd|hoed|bal|leeuw|tijger|beer|aap|vos|schildpad|pizza|ijsje|chocola|watermeloen|zonnebloem|blad|strand|schip|'
  + 'piano|trommel|kok|brandweerman|politieagent|verrast|basketbal|jas|giraf|zebra|uil|octopus|papegaai|cactus|woestijn|tornado|viool|kompas|kroon|tovenaar|'
  + 'planeet|haai|adelaar|komeet|zeemeermin|fee|ruimteschip|kampioen|dinosaurus|vallende ster').split('|');
if (typeof WORD_CARDS !== 'undefined' && typeof LANG_COL !== 'undefined' && !LANG_COL.nl) {
  const col = WORD_CARDS[0].length;   // a new column at the end, whatever other languages were added before it
  WORD_CARDS.forEach(c => { c[col] = NL_PACK[c[0] - 1] || c[2]; });
  LANG_COL.nl = col; PACK_LANGS.push(['nl', 'Nederlands', 'nl-NL']);
}

/* ---------- 🌐 Auto-translate: the Dutch real sentences help pick between meanings, and the builder's words are "built-in words" ---------- */
if (typeof txCorpus === 'function') {
  const prevCorpus = txCorpus;
  txCorpus = async function (lang) {
    if (lang !== 'nl') return prevCorpus(lang);
    return (txCorpusCache.nl ||= fetch('data/real-nl.json').then(r => r.ok ? r.json() : null).then(j => (j?.items || []).map(it => ({ src: String(it[1] || '').toLowerCase(), en: String(it[2] || '').toLowerCase() }))).catch(() => null));
  };
}
if (typeof txAppIndex === 'function') {
  const prevIndex = txAppIndex;
  txAppIndex = function (lang) {
    if (lang !== 'nl' || txAppCache.nl?.dutch) return prevIndex(lang);
    const idx = prevIndex('nl'), fwd = idx.fwd;   // RS_DICT.nl and the starter deck are already in it
    const add = (w, en) => { w = String(w || '').toLowerCase().trim(); if (!w || !en) return; for (const g of String(en).split(/\s*\/\s*/)) { const t = g.trim(); if (!t || /\(/.test(t)) continue; if (!fwd.has(w)) fwd.set(w, []); if (!fwd.get(w).includes(t)) fwd.get(w).push(t); } };
    if (typeof NL_NOUN !== 'undefined') {
      for (const n of NL_NOUN) if (n.cat !== 'feel') { add(n.w, n.en); add(n.pl, n.enPl); }
      for (const a of NL_ADJ) { add(a.pred, a.en); add(a.attr, a.en); }
      for (const v of NL_VERB) { add(v.inf, v.t === 'modal' ? v.en : 'to ' + v.en); if (!v.part) v.f.forEach((f, i) => fwd.has(f) || add(f, i === 2 ? v.en3 : v.en)); }
      for (const a of [...NL_ADV, ...NL_CONJ, ...NL_PREP]) add(a[0], a[1]);
      for (const p of NL_PRON) add(p[0], p[2]);
    }
    if (typeof STARTERS !== 'undefined' && STARTERS.nl) for (const [f, b] of STARTERS.nl.cards) add(String(f).replace(/^(de|het|een)\s+/i, ''), b);   // "de hond" → hond
    const back = new Map(); for (const [w, list] of fwd) for (const t of list) { const k = txKey(t); if (!k) continue; if (!back.has(k)) back.set(k, []); if (!back.get(k).includes(w)) back.get(k).push(w); }
    return (txAppCache.nl = { fwd, back, dutch: true });
  };
}

/* the Sentence Builder's description in the games list names the languages: add Dutch */
if (typeof GAMES !== 'undefined' && GAMES.builder && !/Dutch/.test(GAMES.builder.desc)) GAMES.builder.desc = GAMES.builder.desc.replace(/,? and (\p{L}+)\.$/u, ', $1 and Dutch.');
