'use strict';
/* ================= Esperanto (eo): what the whole app needs =================
   Browsers have no Esperanto voice and no Esperanto speech recognition, so:
   - Esperanto is read aloud with a Polish voice (pl-PL). Polish has the same five vowels, the same stress on the
     second-to-last syllable and nearly the same consonants, so the text is first spelled the Polish way (ĉ → cz,
     ŝ → sz, ĵ → ż, ĝ → dż, ŭ → ł, v → w). With no Polish voice on the PC, an Italian voice reads it instead.
   - 🎙️ Say it! is not offered for Esperanto decks (a short note says why).
   Typed answers on Esperanto decks: the x-system (cx gx hx jx sx ux) and the h-system (ch gh hh jh sh, u for ŭ)
   count the same as ĉ ĝ ĥ ĵ ŝ ŭ. Loaded after translate.js, the game files and builder-eo.js. */
const eoIs = l => String(l || '').toLowerCase().split(/[-_]/)[0] === 'eo';
/* the spelling typed answers are compared in: ĉ, cx and ch all become "ch"; ŭ and ux become "u" */
const eoFold = s => String(s ?? '').normalize('NFC').toLowerCase()
  .replace(/[ĉĝĥĵŝ]/g, c => ({ ĉ: 'ch', ĝ: 'gh', ĥ: 'hh', ĵ: 'jh', ŝ: 'sh' })[c]).replace(/ŭ/g, 'u')
  .replace(/([cghjs])x/g, '$1h').replace(/ux/g, 'u');
/* "ĉu vi ŝatas ĝin?" → "czu wi szatas dżin?" for a Polish voice. An i between a consonant and a vowel gets a j
   ("nia" → "nija"), or Polish would read it as a soft consonant ("nja"). */
const eoForPolish = s => String(s ?? '').normalize('NFC')
  .replace(/x/g, 'ks')
  .replace(/([^aeiouAEIOU\s'’-])([iI])(?=[aeouAEOU])/g, '$1$2j')
  .replace(/[ĉĈĝĜĥĤĵĴŝŜŭŬvV]/g, c => ({ ĉ: 'cz', Ĉ: 'Cz', ĝ: 'dż', Ĝ: 'Dż', ĥ: 'ch', Ĥ: 'Ch', ĵ: 'ż', Ĵ: 'Ż', ŝ: 'sz', Ŝ: 'Sz', ŭ: 'ł', Ŭ: 'Ł', v: 'w', V: 'W' })[c]);
const eoForItalian = s => String(s ?? '').normalize('NFD').replace(/[̂̆]/g, '').normalize('NFC');
const EO_VOICE = 'pl-PL', EO_VOICE2 = 'it-IT';

/* ---------- the deck language list: Esperanto, after the English ones ---------- */
if (typeof LANGS !== 'undefined' && !LANGS.some(l => l[0] === 'eo')) {
  let at = -1; LANGS.forEach((l, i) => { if (/^en-/.test(l[0])) at = i; });
  LANGS.splice(at + 1, 0, ['eo', 'Esperanto (read with a Polish voice)']);
}

/* ---------- speech: a Polish voice reads Esperanto (or an Italian one, when there is no Polish voice) ---------- */
let eoVoiceLang = null;
if (typeof voicesFor === 'function') {
  const voicesForAll = voicesFor;
  voicesFor = function (lang) {
    if (!eoIs(lang)) return voicesForAll(lang);
    const pl = voicesForAll(EO_VOICE); eoVoiceLang = pl.length ? EO_VOICE : voicesForAll(EO_VOICE2).length ? EO_VOICE2 : null;
    return pl.length ? pl : voicesForAll(EO_VOICE2);
  };
}
const eoSpoken = text => { if (typeof voicesFor === 'function') voicesFor('eo'); return eoVoiceLang === EO_VOICE2 ? eoForItalian(eoFromX(text)) : eoForPolish(eoFromX(text)); };
if (typeof speak === 'function') {
  const speakAll = speak;
  speak = function (text, lang, rateMul) {
    if (!eoIs(lang)) return speakAll(text, lang, rateMul);
    if (typeof warnedLangs !== 'undefined' && !voicesFor(lang).length && !warnedLangs.has('eo')) {   // a clearer note than "No Esperanto voice found"
      warnedLangs.add('eo'); warnedLangs.add(lang); toast('Esperanto is read with a Polish (or Italian) voice, and neither was found on this PC. See Settings.');
    }
    return speakAll(eoSpoken(text), lang, rateMul);
  };
}
if (typeof speakWith === 'function') { const sw = speakWith; speakWith = (text, lang, uri, rate) => sw(eoIs(lang) ? eoSpoken(text) : text, lang, uri, rate); }
if (typeof SAMPLE_SAY !== 'undefined') SAMPLE_SAY.eo = 'Saluton! Jen kiel mi sonas.';

/* ---------- typed answers: ĉ = cx = ch on Esperanto decks ---------- */
function eoDeckNow() {
  try { const d = typeof currentDeckId === 'function' ? deckById(currentDeckId()) : null; return !!d && (eoIs(d.frontLang) || eoIs(d.backLang)); } catch { return false; }
}
if (typeof norm === 'function') {
  const normAll = norm;
  norm = function (s) { return eoDeckNow() ? normAll(eoFold(s)) : normAll(s); };
}

/* ---------- 🎙️ Say it!: browsers can't hear Esperanto ---------- */
const EO_SAY_NOTE = 'Not for Esperanto yet: browsers can’t listen to Esperanto. Try 🎧 Listen & tap or ⌨️ Type the answer instead.';
if (typeof gameAvail === 'function') {
  const availAll = gameAvail;
  gameAvail = function (d) { const a = availAll(d); if (d && eoIs(d.frontLang) && a.speak) a.speak = { ok: false, info: EO_SAY_NOTE }; return a; };
}
if (typeof views !== 'undefined' && views.speakgame) {
  const sayView = views.speakgame;
  views.speakgame = () => {
    const d = deckById(view.deckId);
    if (!d || !eoIs(d.frontLang)) return sayView();
    return `<div class="crumbs"><a data-act="games" data-id="${d.id}">Games</a> / Say it!</div>
      <div class="panel stack" style="text-align:center"><div style="font-size:44px">💚🎙️</div>
        <h2 style="margin:0">Say it! isn’t ready for Esperanto</h2>
        <p class="muted" style="margin:0">Browsers can read Esperanto aloud (with a Polish voice, which sounds very close), but they can’t listen to it yet, so Estudiamos can’t check what you say.
          Try <b>🎧 Listen &amp; tap</b>, the <b>🧩 Sentence Builder</b> or a quiz where you type the answer.</p>
        <div class="row" style="justify-content:center"><button type="button" class="btn primary" data-act="games" data-id="${d.id}">Other games</button></div></div>`;
  };
}
if (typeof skStart === 'function') { const st = skStart; skStart = function () { const d = deckById(view.deckId); if (d && eoIs(d.frontLang)) return toast(EO_SAY_NOTE); return st(); }; }

/* ---------- 🔢 Numbers & ABC ---------- */
if (typeof NG_LANGS !== 'undefined') {
  NG_LANGS.eo = { name: 'Esperanto', flag: '💚', tts: 'eo' };
  // fully regular: 11 = dek unu, 20 = dudek, 345 = tricent kvardek kvin
  NG_WORDS.eo = n => {
    const u = ['nul', 'unu', 'du', 'tri', 'kvar', 'kvin', 'ses', 'sep', 'ok', 'naŭ'];
    const part = (x, word) => x === 0 ? '' : (x === 1 ? '' : u[x]) + word;
    if (n === 0) return 'nul'; if (n === 1000) return 'mil';
    const h = Math.floor(n / 100), t = Math.floor(n % 100 / 10), o = n % 10;
    return [part(h, 'cent'), part(t, 'dek'), o ? u[o] : ''].filter(Boolean).join(' ');
  };
  // the letters are named with -o: bo, co, ĉo… (vowels are just themselves)
  NG_ABC.eo = 'a:a b:bo c:co ĉ:ĉo d:do e:e f:fo g:go ĝ:ĝo h:ho ĥ:ĥo i:i j:jo ĵ:ĵo k:ko l:lo m:mo n:no o:o p:po r:ro s:so ŝ:ŝo t:to u:u ŭ:ŭo v:vo z:zo';
}
if (typeof ngAnswer === 'function') {   // ⌨️ Write the word: the x-system counts too (naux = naŭ)
  const ngaAll = ngAnswer;
  ngAnswer = function (given) { if (ng?.lang === 'eo' && ng.mode === 'type' && ng.q && eoFold(given).trim().replace(/\s+/g, ' ') === eoFold(ng.q.answer)) given = ng.q.answer; return ngaAll(given); };
}
if (typeof views !== 'undefined' && views.numgame) {
  const ngView = views.numgame;
  views.numgame = () => {
    const h = ngView();
    return !ng && typeof ngLang === 'function' && ngLang() === 'eo' ? h.replace('<div><b>Alphabet</b>', '<p class="muted small" style="margin:0">💚 Esperanto is read aloud with a Polish voice, the closest one browsers have. You can type ĉ ĝ ĥ ĵ ŝ ŭ as cx gx hx jx sx ux.</p><div><b>Alphabet</b>') : h;
  };
}

/* ---------- game text and reports: Esperanto's English name ---------- */
if (typeof GT_LANG_ENGLISH !== 'undefined') GT_LANG_ENGLISH.eo = 'Esperanto';
if (typeof GT_LANG_NAMES !== 'undefined') GT_LANG_NAMES.eo = 'Esperanto';
/* [[name]] in the Esperanto phrase book = this name is the object of the verb, so it takes -n: "Runa Rato B" → "Runan Raton B",
   "Klingo de la Heroo" → "Klingon de la Heroo". Names that stay as they are in English (Lyra, Fen) don't change. */
function eoObject(name, book) {
  const base = name.replace(/ [ABC]$/, '');
  if (!book || !(book.eoNames ||= new Set(Object.values(book.names))).has(base)) return name;
  const cut = name.search(/ (?:de|da|por|el|en|kun) | · /), head = cut < 0 ? name : name.slice(0, cut);
  return head.replace(/(\p{L}[oa]j?)(?![\p{L}])/gu, (w, x, at) => /(?:^|[^\p{L}])[Ll]$/u.test(head.slice(0, at + 1)) && /^[Ll]a$/.test(w) ? w : w + 'n') + (cut < 0 ? '' : name.slice(cut));
}
if (typeof gtLine === 'function') {
  const lineAll = gtLine;
  gtLine = function (html, lang, names) {
    const out = lineAll(html, lang, names);
    return lang === 'eo' && typeof out === 'string' && out.includes('[[') ? out.replace(/\[\[(.*?)\]\]/g, (_, n) => eoObject(n, GT_BOOKS.eo)) : out;
  };
}

/* ---------- 🌐 Auto-translate: Wiktionary has Esperanto; the real sentences and the builder's words help ---------- */
const eoFromX = s => String(s ?? '').replace(/([cghjsuCGHJSU])[xX]/g, (m, c) => ({ c: 'ĉ', g: 'ĝ', h: 'ĥ', j: 'ĵ', s: 'ŝ', u: 'ŭ', C: 'Ĉ', G: 'Ĝ', H: 'Ĥ', J: 'Ĵ', S: 'Ŝ', U: 'Ŭ' })[c]);
if (typeof txWiktionary === 'function') {
  const wik = txWiktionary;
  txWiktionary = (text, from, depth) => wik(eoIs(from) ? eoFromX(text) : text, from, depth);
}
if (typeof txCorpus === 'function') {
  const corpusAll = txCorpus;
  txCorpus = async lang => {
    if (lang !== 'eo') return corpusAll(lang);
    return (txCorpusCache.eo ||= fetch('data/real-eo.json').then(r => r.ok ? r.json() : null).then(j => (j?.items || []).map(it => ({ src: String(it[1] || '').toLowerCase(), en: String(it[2] || '').toLowerCase() }))).catch(() => null));
  };
}
if (typeof txAppIndex === 'function') {
  const appAll = txAppIndex;
  txAppIndex = lang => {
    if (lang !== 'eo' || txAppCache.eo?.esperanto) return appAll(lang);
    const idx = appAll('eo'), fwd = idx.fwd;
    const add = (w, en) => { w = eoFromX(w).toLowerCase().trim(); if (!w || !en) return; for (const g of String(en).split(/\s*\/\s*/)) { const t = g.trim(); if (!t) continue; if (!fwd.has(w)) fwd.set(w, []); if (!fwd.get(w).includes(t)) fwd.get(w).push(t); } };
    if (typeof eoWordList === 'function') for (const [w, en] of eoWordList()) add(w, en);
    if (typeof RS_DICT !== 'undefined' && RS_DICT.eo) for (const [w, [, g]] of RS_DICT.eo) add(w, g);
    if (typeof STARTERS !== 'undefined' && STARTERS.eo) for (const [f, b] of STARTERS.eo.cards) add(String(f).replace(/^la\s+/i, ''), String(b).replace(/^(the|a|an)\s+/i, ''));
    const back = new Map(); for (const [w, list] of fwd) for (const t of list) { const k = txKey(t); if (!k) continue; if (!back.has(k)) back.set(k, []); if (!back.get(k).includes(w)) back.get(k).push(w); }
    return (txAppCache.eo = { fwd, back, esperanto: true });
  };
}

/* ---------- 🎴 Word card packs: the Esperanto name of every card (in card order, 1–150) ---------- */
const EO_PACK = ('kato|hundo|pomo|pano|akvo|suno|luno|arbo|floro|domo|libro|aŭto|pluvo|lakto|fiŝo|birdo|ovo|seĝo|pordo|lernejo|'
  + 'amiko|feliĉa|ruĝa|blua|verda|fromaĝo|lito|ŝuo|mano|koro|ĉevalo|kuniklo|frago|kuko|neĝo|monto|maro|trajno|aviadilo|muziko|'
  + 'stelo|ombrelo|kuketo|kuracisto|kuraĝa|elefanto|pingveno|papilio|ĉielarko|insulo|kastelo|gitaro|fulmo|trezoro|vulkano|raketo|baleno|unukorno|drako|universo|'
  + 'muso|bovino|porko|kokino|rano|anaso|banano|oranĝo|rizo|supo|kafo|teo|salo|fenestro|sofo|ŝlosilo|horloĝo|krajono|papero|dorsosako|'
  + 'instruisto|bebo|familio|patrino|patro|malĝoja|kolera|laca|flava|nigra|blanka|okulo|nazo|buŝo|orelo|piedo|nubo|vento|fajro|ŝtono|'
  + 'buso|biciklo|mapo|ĉemizo|ĉapelo|pilko|leono|tigro|urso|simio|vulpo|testudo|pico|glaciaĵo|ĉokolado|akvomelono|sunfloro|folio|plaĝo|ŝipo|'
  + 'piano|tamburo|kuiristo|fajrobrigadisto|policano|surprizita|korbopilko|mantelo|ĝirafo|zebro|strigo|polpo|papago|kakto|dezerto|tornado|violono|kompaso|krono|sorĉisto|'
  + 'planedo|ŝarko|aglo|kometo|sireno|feino|kosmoŝipo|ĉampiono|dinosaŭro|falstelo').split('|');
if (typeof WORD_CARDS !== 'undefined' && typeof LANG_COL !== 'undefined' && !LANG_COL.eo) {
  const col = WORD_CARDS[0].length;   // a new column at the end, whatever other languages were added before it
  WORD_CARDS.forEach(c => { c[col] = EO_PACK[c[0] - 1] || c[2]; });
  LANG_COL.eo = col; PACK_LANGS.push(['eo', 'Esperanto', 'eo']);
}

/* ---------- an Esperanto starter deck (New deck window) ---------- */
if (typeof STARTERS !== 'undefined') STARTERS.eo = { name: 'Esperanto basics (sample)', flag: '💚', label: 'Esperanto', frontLang: 'eo', backLang: 'en-US', cards: [
  ['saluton', 'hello'], ['ĝis revido', 'goodbye'], ['dankon', 'thank you'], ['bonvolu', 'please'], ['jes', 'yes'], ['ne', 'no'],
  ['bonan matenon', 'good morning'], ['kiel vi fartas?', 'how are you?'], ['mi fartas bone', 'I am fine'],
  ['hundo', 'dog', 'Nouns end in -o. More than one: hundoj'], ['kato', 'cat'], ['domo', 'house'], ['akvo', 'water'], ['pano', 'bread'], ['pomo', 'apple'],
  ['libro', 'book'], ['lernejo', 'school', 'lern- (learn) + -ej- (place)'], ['amiko', 'friend', 'A female friend: amikino'],
  ['manĝi', 'to eat', 'Verbs end in -i: mi manĝas (now), manĝis (past), manĝos (future)'], ['trinki', 'to drink'], ['paroli', 'to speak'], ['iri', 'to go'], ['vidi', 'to see'], ['legi', 'to read'],
  ['granda', 'big', 'Adjectives end in -a'], ['malgranda', 'small', 'mal- makes the opposite'], ['bona', 'good'], ['nova', 'new'],
  ['bone', 'well', 'Adverbs end in -e'], ['hodiaŭ', 'today'], ['morgaŭ', 'tomorrow'], ['Kie estas la necesejo?', 'Where is the bathroom?']] };

/* ---------- 🧩 Sentence Builder: 📖 real Esperanto sentences, and 💚 build your own ----------
   Real sentences are rebuilt in the order their writer used. Esperanto allows other orders too (the -n shows the
   object), so when every word is right but the order differs, the message says so. */
if (typeof RS_LANGS !== 'undefined') RS_LANGS.eo = 'Esperanto';
if (typeof rsCheck === 'function') {
  const rsCheckAll = rsCheck;
  rsCheck = function () {
    rsCheckAll();
    if (rs?.lang !== 'eo' || rs.done || rs.frame) return;
    const k = w => eoFold(rsKey(w, 'eo')), built = rs.line.map(rsChip).map(c => k(c.w)).sort().join(' '), want = rs.words.map(k).sort().join(' ');
    if (rs.line.length === rs.words.length && built === want) { rs.msg = '💚 All the right words! Esperanto lets you put them in other orders too (the -n shows the object), but here, rebuild the order this sentence’s writer used. Tap 💡 Hint for help.'; render(); }
  };
}
if (typeof views !== 'undefined' && views.realsent) {
  const rsView = views.realsent;
  views.realsent = () => {
    const h = rsView();
    if (rs?.lang !== 'eo') return h;
    return h + `<div class="gt-report"><button type="button" class="btn sm" data-act="eoBuildOwn">💚 Build your own Esperanto sentences</button>
      <span class="muted small">Any word order the endings allow is right there. Sentences are read aloud with a Polish voice.</span></div>`;
  };
  Object.assign(actions, { eoBuildOwn: () => { if (typeof startBuilder !== 'function') return; const id = rs?.deckId; startBuilder(id); if (bld) { bld.lang = 'eo'; bldRound(); render(); } } });
}
if (typeof views !== 'undefined' && views.builder) {
  const bView = views.builder;
  views.builder = () => { const h = bView(); return bld?.lang === 'eo' ? h.replace('· Esperanto grammar</span>', '· Esperanto grammar · any word order the endings allow · read with a Polish voice</span>') : h; };
}

/* ---------- ⚔️ Lexicon Saga: spoken spells need speech recognition, which has no Esperanto, so spells are typed ---------- */
if (typeof sgSpellAsk === 'function' && typeof sgAskSpell === 'function') {
  const askAll = sgSpellAsk;
  sgSpellAsk = sp => typeof sg !== 'undefined' && eoIs(sg?.d?.frontLang) ? sgAskSpell : askAll(sp);
}
