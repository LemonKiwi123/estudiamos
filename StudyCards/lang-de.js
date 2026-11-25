'use strict';
/* ================= German: starter deck, auto-translate, Say it!, typed answers, numbers =================
   - STARTERS.de: a German basics deck for the New deck window.
   - 🌐 Auto-translate: the Sentence Builder's German words count as "built-in words", and the German real sentences
     (data/real-de.json) help pick between two meanings. Nouns keep their capital letter.
   - Typed answers: ae / oe / ue / ss count the same as ä / ö / ü / ß (fuer = für, Strasse = Straße).
   - 🎙️ Say it!: every form of der and ein can be left out, ß = ss, and a number heard as digits counts (3 = drei).
   Loaded after translate.js, numgame.js, speakgame.js, starters.js and saga.js. */
STARTERS.de = { name: 'German basics (sample)', flag: '🇩🇪', label: 'German', frontLang: 'de-DE', backLang: 'en-US', cards: [
  ['hallo', 'hello'], ['guten Morgen', 'good morning'], ['danke', 'thank you'], ['bitte', 'please', 'Also: you’re welcome'], ['tschüss', 'bye'], ['ja', 'yes'], ['nein', 'no'],
  ['der Hund', 'the dog', 'Plural: die Hunde'], ['die Katze', 'the cat', 'Plural: die Katzen'], ['das Haus', 'the house', 'Plural: die Häuser'], ['das Wasser', 'the water'], ['das Brot', 'the bread'],
  ['der Apfel', 'the apple', 'Plural: die Äpfel'], ['das Buch', 'the book', 'Plural: die Bücher'], ['die Schule', 'the school', 'Plural: die Schulen'], ['der Freund', 'the friend', 'A female friend: die Freundin'], ['das Mädchen', 'the girl', 'Words ending in -chen are always “das”'],
  ['essen', 'to eat', 'ich esse, du isst, er isst'], ['trinken', 'to drink', 'ich trinke, du trinkst'], ['sprechen', 'to speak', 'ich spreche, du sprichst, er spricht'], ['gehen', 'to go', 'ich gehe, du gehst'], ['sehen', 'to see', 'ich sehe, du siehst, er sieht'], ['lesen', 'to read', 'ich lese, du liest, er liest'],
  ['anrufen', 'to call', 'It splits: ich rufe dich an'], ['groß', 'big'], ['klein', 'small'], ['gut', 'good'], ['neu', 'new'], ['heute', 'today'], ['morgen', 'tomorrow'], ['Wo ist die Toilette?', 'Where is the bathroom?']] };

/* ---------- 🌐 auto-translate ---------- */
if (typeof txCorpus === 'function') {
  const prevCorpus = txCorpus;
  txCorpus = async function (lang) {
    if (lang !== 'de') return prevCorpus(lang);
    return (txCorpusCache.de ||= fetch('data/real-de.json').then(r => r.ok ? r.json() : null).then(j => (j?.items || []).map(it => ({ src: String(it[1] || '').toLowerCase(), en: String(it[2] || '').toLowerCase() }))).catch(() => null));
  };
}
const deNoArt = s => String(s || '').replace(/^(der|die|das|den|dem|ein|eine|einen)\s+(?=\S)/i, '');
if (typeof txAppIndex === 'function') {
  const prevIndex = txAppIndex;
  txAppIndex = function (lang) {
    if (lang !== 'de') return prevIndex(lang);
    if (txAppCache.de?.german) return txAppCache.de;
    const fwd = new Map(), back = new Map();   // fwd: lowercase word -> meanings; back: meaning -> words (nouns keep their capital letter)
    const add = (w, en) => {
      w = String(w || '').trim(); if (!w || !en) return; const low = w.toLowerCase();
      for (const g of String(en).split(/\s*\/\s*/)) { const t = g.trim(); if (!t || /\(/.test(t)) continue;
        if (!fwd.has(low)) fwd.set(low, []); if (!fwd.get(low).includes(t)) fwd.get(low).push(t);
        const k = txKey(t); if (!k) continue; if (!back.has(k)) back.set(k, []); if (!back.get(k).includes(w)) back.get(k).push(w); }
    };
    for (const n of DE_NOUN) if (!['feel', 'home'].includes(n.cat)) { add(n.w, n.en); add(n.pl, n.enPl); }
    for (const a of DE_ADJ) add(a.pred, a.en);
    for (const v of DE_VERB) { add(v.inf, v.t === 'modal' ? v.en : 'to ' + v.en); if (!v.part) v.f.forEach((f, i) => fwd.has(f) || add(f, i === 2 ? v.en3 : v.en)); }
    for (const [w, g] of RS_DE_NOUN_MAP) add(w, g);
    for (const [w, [t, g]] of RS_DICT.de) if (t !== 'verb' ? !/(e|en|er|es|em)$/.test(w) || w.length < 5 : /^to /.test(g)) add(w, g);
    for (const a of DE_ADV) add(a[0], a[1]);
    for (const c of DE_CONJ) add(c[0], c[1]);
    for (const p of DE_PRON) add(p[0], p[3]);
    for (const [f, b] of STARTERS.de.cards) { add(deNoArt(f), b); add(f, b); }
    return (txAppCache.de = { fwd, back, german: true });
  };
}
// Wiktionary's German nouns are under their capital letter, without the article: "der Hund", "hund" → Hund
if (typeof txWiktionary === 'function') {
  const wik = txWiktionary;
  txWiktionary = async function (text, from, depth) {
    if (from !== 'de') return wik(text, from, depth);
    const t = deNoArt(text), art = t !== String(text).trim(), capd = t ? t[0].toUpperCase() + t.slice(1) : t;
    const r = await wik(art && !/\s/.test(t) ? capd : t, from, depth);
    return r?.length || capd === t || art || /\s/.test(t) ? r : wik(capd, from, depth);
  };
}

/* ---------- typed answers on German decks: ae = ä, oe = ö, ue = ü, ss = ß ---------- */
const deFold = s => String(s ?? '').toLowerCase().normalize('NFC').replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
const deIs = l => String(l || '').toLowerCase().split(/[-_]/)[0] === 'de';
function deDeckNow() { try { const d = typeof currentDeckId === 'function' ? deckById(currentDeckId()) : null; return !!d && (deIs(d.frontLang) || deIs(d.backLang)); } catch { return false; } }
// with "ignore accents" on, ß and ss are the same too: grosse = Größe
function deSameTyped(given, answer) {
  const g = norm(given); if (!g) return false;
  const loose = s => S.settings.ignoreAccents ? s.replace(/ß/g, 'ss') : s;
  return variants(String(answer || '')).some(v => loose(g) === loose(v));
}
// like norm(), but keeps ä ö ü (norm drops their dots when "ignore accents" is on) and then folds them
function deNormFold(s) { return deFold(s).replace(/[¿?¡!.,;:"'“”‘’«»()[\]…\-–—]/g, ' ').replace(/\s+/g, ' ').trim(); }
if (typeof checkTyped === 'function') {
  const checkAll = checkTyped;
  checkTyped = function (input, ans) {
    const r = checkAll(input, ans);
    if (r.ok && !r.typo || !deDeckNow()) return r;
    const parts = [String(ans || ''), ...String(ans || '').split(/[\/;,]/)].flatMap(p => [p, p.replace(/\([^)]*\)/g, ' ')]).map(p => p.trim()).filter(Boolean);
    const hit = parts.find(p => deNormFold(p) === deNormFold(input));
    return hit ? checkAll(hit, ans) : deSameTyped(input, ans) ? checkAll(ans, ans) : r;
  };
}
if (typeof sgGrade === 'function') {   // ⚔️ Lexicon Saga spells
  const gradeAll = sgGrade;
  sgGrade = function (given, answer) {
    const r = gradeAll(given, answer);
    if (r === 'exact' || !deDeckNow()) return r;
    const hit = [String(answer), ...String(answer).split(/[,;/]/)].map(p => p.trim()).find(p => p && deNormFold(p) === deNormFold(given));
    return hit ? gradeAll(hit, answer) : r;
  };
}

/* ---------- 🎙️ Say it! ---------- */
if (typeof SK_ARTICLES !== 'undefined') for (const a of ['des', 'einem', 'einer', 'eines']) if (!SK_ARTICLES.de.includes(a)) SK_ARTICLES.de.push(a);
if (typeof skNorm === 'function') {
  const normAll = skNorm;
  skNorm = function (text, lang) {
    if (lang !== 'de') return normAll(text, lang);
    return normAll(String(text || '').replace(/ß/g, 'ss').replace(/\b\d{1,3}\b/g, n => typeof NG_WORDS !== 'undefined' && NG_WORDS.de ? NG_WORDS.de(+n) : n).replace(/ß/g, 'ss'), lang);
  };
}
if (typeof skMatch === 'function') {   // long German words are sometimes heard as two: "Super Markt" = Supermarkt
  const matchAll = skMatch;
  skMatch = function (heard, card, lang) {
    const r = matchAll(heard, card, lang); if (lang !== 'de' || r.ok && !r.close) return r;
    const answers = skAnswers(card, lang).map(a => a.replace(/[\s-]/g, ''));
    const hit = heard.find(h => { const s = skNorm(h, lang).replace(/[\s-]/g, ''); return s.length > 5 && answers.includes(s); });
    return hit ? { ok: true, close: false, heard: hit } : r;
  };
}

/* ---------- 🔢 Numbers & ABC: typing dreissig, fuenf, zwoelf or einhundert is right too ---------- */
if (typeof ngAnswer === 'function') {
  const ngAll = ngAnswer;
  const one = s => deFold(s).replace(/[\s-]+/g, '').replace(/und(?=hundert|tausend)/g, '').replace(/^ein(?=hundert|tausend)/, '').replace(/hundertund/, 'hundert');
  ngAnswer = function (given) {
    if (ng?.lang === 'de' && ng.mode === 'type' && ng.q && typeof given === 'string' && one(given) === one(ng.q.answer)) given = ng.q.answer;
    return ngAll(given);
  };
}

/* the Sentence Builder's description in the games list names the languages: add German */
if (typeof GAMES !== 'undefined' && GAMES.builder && !/German/.test(GAMES.builder.desc)) GAMES.builder.desc = GAMES.builder.desc.replace(/,? and (\p{L}+)\.$/u, ', $1 and German.');
