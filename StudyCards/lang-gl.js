'use strict';
/* ================= Galician (gl): what the rest of the app needs =================
   - Galician in the deck language list (gl-ES, right after Portuguese).
   - Speech: a Galician voice (gl-ES) when the PC has one. Edge's online voices include Galician; when there is none,
     Galician is read with a Spanish voice (Galician spelling reads much like Spanish) or a Portuguese one, and a note says so once.
   - 🔢 Numbers & ABC: Galician number words (un, dous, vinte e un, cento un, douscentos) and the Galician alphabet.
     Typed numbers can use the feminine forms too (unha, dúas, duascentas).
   - 🎤 Say it!: o / a / os / as / un / unha in front don't matter.
   - A Galician starter deck, and Galician in 🌐 Auto-translate: the Sentence Builder's Galician words count as
     "built-in words", and the Galician real sentences (data/real-gl.json) help pick between two meanings.
   - Tatoeba example sentences (✨ Suggest a sentence) look for Galician (glg).
   Loaded last, after translate.js and the other games (it wraps shared functions instead of changing them). */
const glIs = l => String(l || '').toLowerCase().replace('_', '-').split('-')[0] === 'gl';
const GL_FALLBACK_VOICE = 'es-ES';

/* ---------- the deck language list ---------- */
if (typeof LANGS !== 'undefined' && !LANGS.some(l => l[0] === 'gl-ES')) {
  const at = LANGS.findIndex(l => l[0] === 'pt-PT');
  LANGS.splice(at >= 0 ? at + 1 : LANGS.length, 0, ['gl-ES', 'Galician']);
}

/* ---------- speech: a Galician voice, or a Spanish one when the PC has no Galician voice ---------- */
let glVoiceNoted = false;
if (typeof voicesFor === 'function') {
  const voicesForAll = voicesFor;
  voicesFor = function (lang) {
    const own = voicesForAll(lang);
    if (own.length || !glIs(lang)) return own;
    const es = [...voicesForAll(GL_FALLBACK_VOICE), ...voicesForAll('pt-PT')];
    if (es.length && !glVoiceNoted && typeof toast === 'function' && voices.length) { glVoiceNoted = true; setTimeout(() => toast('No Galician voice on this PC, so Galician is read with a ' + langName(es[0].lang).replace(/ \(.*/, '') + ' voice. See Settings for voices.'), 0); }
    return es;
  };
}
if (typeof SAMPLE_SAY !== 'undefined') SAMPLE_SAY.gl = 'Ola! Así soa a miña voz.';
if (typeof ISO3 !== 'undefined') ISO3.gl = 'glg';

/* ---------- 🔢 Numbers & ABC ---------- */
if (typeof NG_LANGS !== 'undefined') {
  NG_LANGS.gl = { name: 'Galician', flag: '🇪🇸', tts: 'gl-ES' };
  NG_WORDS.gl = function (n) {
    const u = ['cero', 'un', 'dous', 'tres', 'catro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dezaseis', 'dezasete', 'dezaoito', 'dezanove'];
    const t = ['', '', 'vinte', 'trinta', 'corenta', 'cincuenta', 'sesenta', 'setenta', 'oitenta', 'noventa'];
    const h = ['', 'cento', 'douscentos', 'trescentos', 'catrocentos', 'quiñentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    const two = x => x < 20 ? u[x] : t[Math.floor(x / 10)] + (x % 10 ? ' e ' + u[x % 10] : '');
    if (n === 1000) return 'mil'; if (n === 100) return 'cen'; if (n < 100) return two(n);
    return h[Math.floor(n / 100)] + (n % 100 ? ' ' + two(n % 100) : '');   // cento un, douscentos trinta e dous
  };
  NG_ABC.gl = 'a:a b:be c:ce d:de e:e f:efe g:gue h:hache i:i l:ele m:eme n:ene ñ:eñe o:o p:pe q:que r:erre s:ese t:te u:u v:uve x:xe z:zeta';
  // the feminine way to say the same number: un → unha, dous → dúas, douscentos → duascentas; and 500 as cincocentos
  const glNumOther = w => [String(w).replace(/\bun$/, 'unha').replace(/\bdous$/, 'dúas').replace(/douscentos/, 'duascentas').replace(/centos\b/g, 'centas').replace(/quiñentos/, 'quiñentas'), String(w).replace(/quiñentos/, 'cincocentos')];
  const prevAnswer = ngAnswer;
  ngAnswer = function (given) {
    if (ng?.lang === 'gl' && ng.mode === 'type' && ng.q && typeof given === 'string') {
      const a = ng.q.answer;
      if (glNumOther(a).some(x => x !== a && ngNorm(given) === ngNorm(x))) given = a;
    }
    return prevAnswer(given);
  };
}

/* ---------- 🎤 Say it! ---------- */
if (typeof SK_ARTICLES !== 'undefined') SK_ARTICLES.gl = ['o', 'a', 'os', 'as', 'un', 'unha', 'uns', 'unhas'];

/* ---------- the starter deck ---------- */
if (typeof STARTERS !== 'undefined') STARTERS.gl = { name: 'Galician basics (sample)', flag: '🇪🇸', label: 'Galician', frontLang: 'gl-ES', backLang: 'en-US', cards: [
  ['ola', 'hello'], ['bos días', 'good morning'], ['grazas', 'thank you'], ['por favor', 'please'], ['adeus', 'goodbye', 'Also: ata logo (see you later)'], ['si', 'yes'], ['non', 'no'],
  ['o can', 'the dog'], ['o gato', 'the cat'], ['a casa', 'the house'], ['a auga', 'the water'], ['o pan', 'the bread'], ['a mazá', 'the apple'],
  ['o libro', 'the book'], ['a escola', 'the school'], ['o amigo', 'the friend', 'Masculine (a female friend: a amiga)'],
  ['comer', 'to eat', 'eu como, ti comes, el come'], ['beber', 'to drink', 'eu bebo, ti bebes, el bebe'], ['falar', 'to speak', 'eu falo, ti falas, el fala'],
  ['ir', 'to go', 'eu vou, ti vas, el vai'], ['ver', 'to see', 'eu vexo, ti ves, el ve'], ['ler', 'to read', 'eu leo, ti les, el le'],
  ['ser', 'to be', 'eu son, ti es, el é'], ['ter', 'to have', 'eu teño, ti tes, el ten'],
  ['grande', 'big'], ['pequeno', 'small', 'Feminine: pequena'], ['bo', 'good', 'Feminine: boa'], ['novo', 'new', 'Feminine: nova'],
  ['hoxe', 'today'], ['mañá', 'tomorrow'], ['Onde está o baño?', 'Where is the bathroom?']] };

/* ---------- 🌐 Auto-translate ---------- */
if (typeof txCorpus === 'function') {
  const prevCorpus = txCorpus;
  txCorpus = async function (lang) {
    if (lang !== 'gl') return prevCorpus(lang);
    return (txCorpusCache.gl ||= fetch('data/real-gl.json').then(r => r.ok ? r.json() : null).then(j => (j?.items || []).map(it => ({ src: String(it[1] || '').toLowerCase(), en: String(it[2] || '').toLowerCase() }))).catch(() => null));
  };
}
if (typeof txAppIndex === 'function') {
  const prevIndex = txAppIndex;
  txAppIndex = function (lang) {
    const idx = prevIndex(lang);
    if (lang !== 'gl' || idx.glWords || typeof GL_NOUN === 'undefined') return idx;
    idx.glWords = true;
    const add = (w, en) => { w = String(w || '').toLowerCase().trim(); if (!w || !en) return;
      for (const g of String(en).split(/\s*\/\s*/)) { const t = g.trim(); if (!t) continue;
        if (!idx.fwd.has(w)) idx.fwd.set(w, []); if (!idx.fwd.get(w).includes(t)) idx.fwd.get(w).push(t);
        const k = txKey(t); if (!k) continue; if (!idx.back.has(k)) idx.back.set(k, []); if (!idx.back.get(k).includes(w)) idx.back.get(k).push(w); } };
    for (const n of GL_NOUN) if (n[3] !== 'feel') { add(n[0], n[4]); add(n[1], n[5]); }
    for (const a of GL_ADJ) for (const w of a.slice(0, 4)) add(w, a[4]);
    for (const v of GL_VERB) { add(glBase(v[0]), 'to ' + v[5]); v[1].forEach((f, i) => add(f, i === 2 ? v[6] : v[5])); }
    for (const a of [...GL_ADV, ...GL_CONJ]) add(a[0], a[1]);
    for (const p of GL_PRON) add(p[0], p[3]);
    for (const [f, b] of STARTERS.gl.cards) if (!/\s/.test(String(f).replace(/^(o|a|os|as|un|unha)\s+/i, ''))) add(String(f).replace(/^(o|a|os|as|un|unha)\s+/i, ''), b.replace(/^the /, ''));   // "o can" → can
    return idx;
  };
}

/* ---------- the Sentence Builder's card on the Games page names its languages ---------- */
if (typeof GAMES !== 'undefined' && GAMES.builder && !/Galician/.test(GAMES.builder.desc)) GAMES.builder.desc = GAMES.builder.desc.replace(/ and ([A-Z]\p{L}+)\.$/u, ', $1 and Galician.');
