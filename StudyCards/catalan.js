'use strict';
/* ================= Catalan (ca): what the whole app needs =================
   Catalan (ca-ES voice) in the shared lists, registered from here so no shared file has to change:
   the deck language list, 🔢 Numbers & ABC, 🎙️ Say it!, the starter deck, the word card packs, 🌐 Auto-translate
   (the Sentence Builder's Catalan words and the Catalan real sentences), the voice sample and the sentence search.
   Loaded after translate.js and the other Catalan files (builder-ca.js, rstag-ca.js, gametr-ca.js). */

/* ---------- the deck language list: Catalan, right after Spanish ---------- */
if (typeof LANGS !== 'undefined' && !LANGS.some(l => l[0] === 'ca-ES')) {
  const at = LANGS.findIndex(l => l[0] === 'es-MX');
  LANGS.splice(at >= 0 ? at + 1 : LANGS.length, 0, ['ca-ES', 'Catalan']);
}
if (typeof SAMPLE_SAY !== 'undefined') SAMPLE_SAY.ca = 'Hola! Així és com sono.';
if (typeof ISO3 !== 'undefined') ISO3.ca = 'cat';

/* ---------- 🔢 Numbers & ABC ----------
   Counting words: u, dos, tres… vint-i-u, trenta-dos, cent, dos-cents, mil. When you type a number, the forms you use
   with a noun count too: un / una for 1 (vint-i-un, vint-i-una), dues for 2, and dues-centes for 200 and so on. */
if (typeof NG_LANGS !== 'undefined') {
  NG_LANGS.ca = { name: 'Catalan', flag: '🇦🇩', tts: 'ca-ES' };
  NG_WORDS.ca = function (n) {
    const u = ['zero', 'u', 'dos', 'tres', 'quatre', 'cinc', 'sis', 'set', 'vuit', 'nou', 'deu', 'onze', 'dotze', 'tretze', 'catorze', 'quinze', 'setze', 'disset', 'divuit', 'dinou'];
    const t = ['', '', 'vint', 'trenta', 'quaranta', 'cinquanta', 'seixanta', 'setanta', 'vuitanta', 'noranta'];
    // 21–29 join with -i- (vint-i-u), the other tens with a hyphen (trenta-dos)
    const two = x => x < 20 ? u[x] : t[Math.floor(x / 10)] + (x % 10 ? (x < 30 ? '-i-' : '-') + u[x % 10] : '');
    if (n === 1000) return 'mil'; if (n < 100) return two(n);
    const c = Math.floor(n / 100), r = n % 100;
    return (c === 1 ? 'cent' : u[c] + '-cents') + (r ? ' ' + two(r) : '');
  };
  NG_ABC.ca = 'a:a b:be c:ce ç:ce trencada d:de e:e f:efa g:ge h:hac i:i j:jota k:ca l:ela m:ema n:ena o:o p:pe q:cu r:erra s:essa t:te u:u v:ve baixa w:ve doble x:ics y:i grega z:zeta';
}
// the other right ways to write the same number: un / una for u, dues for dos, dues-centes for dos-cents
const caNumAlts = w => {
  const s = String(w), out = new Set([s]);
  const ones = x => [x.replace(/(^|[- ])u$/, '$1un'), x.replace(/(^|[- ])u$/, '$1una'), x.replace(/(^|[- ])dos$/, '$1dues')];
  for (const a of ones(s)) out.add(a);
  if (/-cents/.test(s)) for (const x of [...out]) { out.add(x.replace(/-cents/, '-centes')); out.add(x.replace(/^dos-cents/, 'dues-centes')); }
  return [...out];
};
if (typeof ngAnswer === 'function') {
  const prevAnswer = ngAnswer;
  ngAnswer = function (given) {
    if (typeof ng !== 'undefined' && ng?.lang === 'ca' && ng.mode === 'type' && ng.q && typeof given === 'string') {
      const clean = given.trim().toLowerCase().replace(/\s+/g, ' ').replace(/ ?- ?/g, '-');
      if (caNumAlts(ng.q.answer).some(a => a === clean || (typeof ngNorm === 'function' && ngNorm(a) === ngNorm(clean)))) given = ng.q.answer;
    }
    return prevAnswer(given);
  };
}

/* ---------- 🎙️ Say it!: "el", "la", "l'", "un"… in front don't matter, and l·l counts the same as ll ---------- */
if (typeof SK_ARTICLES !== 'undefined') SK_ARTICLES.ca = ['el', 'la', 'els', 'les', "l'", 'un', 'una', 'uns', 'unes', 'en', 'na'];
if (typeof skMatch === 'function') {
  const prevMatch = skMatch;
  const caSk = s => String(s).replace(/[·.]l/g, 'l').replace(/-(se|me|te|nos|vos)$|'s$/g, '');   // intel·ligent = inteligent = intelligent, rentar-se = rentar
  skMatch = function (heard, card, lang) {
    const r = prevMatch(heard, card, lang);
    if (r.ok || String(lang || '').split('-')[0].toLowerCase() !== 'ca') return r;
    const answers = skAnswers(card, lang).map(caSk);
    for (const h of heard) { const said = caSk(skNorm(h, lang)); for (const a of answers) if (said === a || (' ' + said + ' ').includes(' ' + a + ' ')) return { ok: true, close: false, heard: h }; }
    return r;
  };
}

/* ---------- a Catalan starter deck (New deck window) ---------- */
if (typeof STARTERS !== 'undefined') STARTERS.ca = { name: 'Catalan basics (sample)', flag: '🇦🇩', label: 'Catalan', frontLang: 'ca-ES', backLang: 'en-US', cards: [
  ['hola', 'hi / hello'], ['bon dia', 'good morning'], ['gràcies', 'thank you'], ['si us plau', 'please'], ['adéu', 'goodbye'], ['sí', 'yes'], ['no', 'no'],
  ['el gos', 'the dog'], ['el gat', 'the cat'], ['la casa', 'the house'], ["l'aigua", 'the water', 'Feminine: l’aigua freda'], ['el pa', 'the bread'], ['la poma', 'the apple'],
  ['el llibre', 'the book'], ["l'escola", 'the school', 'Feminine: anar a l’escola'], ["l'amic", 'the friend', 'Masculine (a female friend: l’amiga)'], ['la motxilla', 'the backpack'],
  ['menjar', 'to eat'], ['beure', 'to drink', 'Irregular: bec, beus, beu, bevem, beveu, beuen'], ['parlar', 'to speak'], ['anar', 'to go', 'Irregular: vaig, vas, va, anem, aneu, van'],
  ['veure', 'to see', 'Irregular: veig, veus, veu, veiem, veieu, veuen'], ['llegir', 'to read', 'llegeixo, llegeixes, llegeix…'],
  ['gran', 'big'], ['petit', 'small'], ['bo', 'good', 'Before a masculine noun: bon (un bon amic)'], ['nou', 'new'], ['avui', 'today'], ['demà', 'tomorrow'], ['On és el lavabo?', 'Where is the bathroom?']] };

/* ---------- 🎴 Word card packs: the Catalan name of every card ---------- */
// in card order (1–150)
const CA_PACK = ('gat|gos|poma|pa|aigua|sol|lluna|arbre|flor|casa|llibre|cotxe|pluja|llet|peix|ocell|ou|cadira|porta|escola|'
  + 'amic|feliç|vermell|blau|verd|formatge|llit|sabata|mà|cor|cavall|conill|maduixa|pastís|neu|muntanya|mar|tren|avió|música|'
  + 'estrella|paraigua|galeta|metge|valent|elefant|pingüí|papallona|arc de Sant Martí|illa|castell|guitarra|llamp|tresor|volcà|coet|balena|unicorn|drac|univers|'
  + 'ratolí|vaca|porc|gallina|granota|ànec|plàtan|taronja|arròs|sopa|cafè|te|sal|finestra|sofà|clau|rellotge|llapis|paper|motxilla|'
  + 'professor|nadó|família|mare|pare|trist|enfadat|cansat|groc|negre|blanc|ull|nas|boca|orella|peu|núvol|vent|foc|pedra|'
  + 'autobús|bicicleta|mapa|camisa|barret|pilota|lleó|tigre|ós|mico|guineu|tortuga|pizza|gelat|xocolata|síndria|gira-sol|fulla|platja|vaixell|'
  + 'piano|tambor|cuiner|bomber|policia|sorprès|bàsquet|abric|girafa|zebra|mussol|pop|lloro|cactus|desert|tornado|violí|brúixola|corona|mag|'
  + 'planeta|tauró|àguila|cometa|sirena|fada|nau espacial|campió|dinosaure|estel fugaç').split('|');
if (typeof WORD_CARDS !== 'undefined' && typeof LANG_COL !== 'undefined' && !LANG_COL.ca) {
  const col = WORD_CARDS[0].length;   // a new column at the end, whatever other languages were added before it
  WORD_CARDS.forEach(c => { c[col] = CA_PACK[c[0] - 1] || c[2]; });
  LANG_COL.ca = col; PACK_LANGS.push(['ca', 'Català', 'ca-ES']);
}

/* ---------- 🌐 Auto-translate: the Catalan real sentences help pick between meanings, and the builder's words are "built-in words" ---------- */
if (typeof txCorpus === 'function') {
  const prevCorpus = txCorpus;
  txCorpus = async function (lang) {
    if (lang !== 'ca') return prevCorpus(lang);
    return (txCorpusCache.ca ||= fetch('data/real-ca.json').then(r => r.ok ? r.json() : null).then(j => (j?.items || []).map(it => ({ src: String(it[1] || '').toLowerCase(), en: String(it[2] || '').toLowerCase() }))).catch(() => null));
  };
}
if (typeof txAppIndex === 'function') {
  const prevIndex = txAppIndex;
  txAppIndex = function (lang) {
    if (lang !== 'ca' || txAppCache.ca?.catalan) return prevIndex(lang);
    const idx = prevIndex('ca'), fwd = idx.fwd;   // RS_DICT.ca and the starter deck are already in it
    const add = (w, en) => { w = String(w || '').toLowerCase().trim(); if (!w || !en) return; for (const g of String(en).split(/\s*\/\s*/)) { const t = g.trim(); if (!t) continue; if (!fwd.has(w)) fwd.set(w, []); if (!fwd.get(w).includes(t)) fwd.get(w).push(t); } };
    if (typeof CA_NOUN !== 'undefined') {
      for (const n of CA_NOUN) if (n[3] !== 'feel') { add(n[0], n[4]); add(n[1], n[5]); }
      for (const a of CA_ADJ) for (const w of a.slice(0, 4)) add(w, a[4]);
      for (const v of CA_VERB) { add(caInf(v), 'to ' + v[5]); add(v[0], 'to ' + v[5]); v[1].forEach((f, i) => add(f, i === 2 ? v[6] : v[5])); }
      for (const a of [...CA_ADV, ...CA_CONJ]) add(a[0], a[1]);
      for (const p of CA_PRON) add(p[0], p[3]);
    }
    if (typeof STARTERS !== 'undefined' && STARTERS.ca) for (const [f, b] of STARTERS.ca.cards) add(String(f).replace(/^(el|la|els|les|un|una)\s+|^l'/i, ''), b);   // "el gos" → gos
    const back = new Map(); for (const [w, list] of fwd) for (const t of list) { const k = txKey(t); if (!k) continue; if (!back.has(k)) back.set(k, []); if (!back.get(k).includes(w)) back.get(k).push(w); }
    return (txAppCache.ca = { fwd, back, catalan: true });
  };
}
