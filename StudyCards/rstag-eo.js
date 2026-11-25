'use strict';
/* ================= Sentence Builder · 📖 Real sentences: Esperanto word types and meanings =================
   Esperanto makes this easy: the ending of every content word shows its type (-o noun, -a adjective, -e adverb,
   -as -is -os -us -u -i verb, with -j and -n added to nouns and adjectives). The little words that don't follow the
   rule (pronouns, prepositions, the "table words" like kiu, tio, ĉiam…) are in closed lists. Meanings come from the
   Sentence Builder's word lists, the word list in rsdict-eo.js (RS_DICT_SRC.eo), and from the word's root: "hundojn"
   is looked up as hundo. Words in the x-system (cx, gx…) are read as ĉ, ĝ… Loaded after rstag.js and builder-eo.js. */
const eoRsF = w => String(w || '').toLowerCase().replace(/([cghjsu])x/g, (m, c) => ({ c: 'ĉ', g: 'ĝ', h: 'ĥ', j: 'ĵ', s: 'ŝ', u: 'ŭ' })[c]).replace(/[’']/g, '');
const EO_RS_W = s => new Set(s.split(/\s+/).filter(Boolean));
/* the "table words": ki- (which/what), ti- (that), i- (some), ĉi- (every), neni- (no) + their endings */
const EO_TABLE = (() => {
  const m = new Map();
  for (const st of ['ki', 'ti', 'i', 'ĉi', 'neni']) {
    for (const [e, t] of [['o', 'pron'], ['on', 'pron'], ['u', 'pron'], ['un', 'pron'], ['uj', 'pron'], ['ujn', 'pron'], ['a', 'det'], ['an', 'det'], ['aj', 'det'], ['ajn', 'det'], ['es', 'det'],
      ['e', 'adv'], ['en', 'adv'], ['el', 'adv'], ['am', 'adv'], ['al', 'adv'], ['om', 'adv']]) m.set(st + e, t);
  }
  return m;
})();
RS_CLOSED.eo = { art: EO_RS_W('la'), clArt: new Set(), flex: new Set(), clitic: new Set(),
  det: EO_RS_W('mia miaj mian miajn via viaj vian viajn lia liaj lian liajn ŝia ŝiaj ŝian ŝiajn ĝia ĝiaj ĝian ĝiajn nia niaj nian niajn ilia iliaj ilian iliajn sia siaj sian siajn onia ambaŭ unu du tri kvar kvin ses sep ok naŭ dek cent mil multaj multajn kelkaj kelkajn'),
  pron: EO_RS_W('mi min vi vin li lin ŝi ŝin ĝi ĝin ni nin ili ilin oni onin si sin ci cin mem'),
  prep: EO_RS_W('al el en kun sen sur sub por de da pri pro per apud ĉe ĝis inter kontraŭ laŭ malgraŭ post antaŭ super tra trans ekster krom anstataŭ ĉirkaŭ je preter dum'),
  conj: EO_RS_W('kaj sed aŭ ke se ĉar kvankam nek do kvazaŭ ol'),
  adv: EO_RS_W('ne jes nun jam ankoraŭ ankaŭ eĉ tre tro ĉi nur baldaŭ hodiaŭ hieraŭ morgaŭ tuj preskaŭ apenaŭ almenaŭ plu pli plej for ja ju des ĉu nu tamen kvazaŭ mem jen tiel ĉiam neniam kiam tiam iam kie tie ie ĉie nenie kien tien kiel tiel kial tial kiom tiom multe pli plej ofte bone'),
  verb: new Set() };
const EO_RS_INTERJ = EO_RS_W('saluton dankon ve ho ha');
/* meanings of the little words */
const EO_RS_COMMON = Object.fromEntries(('mi:I|min:me|vi:you|vin:you|li:he|lin:him|ŝi:she|ŝin:her|ĝi:it|ĝin:it|ni:we|nin:us|ili:they|ilin:them|oni:people / one|si:himself / herself|sin:himself / herself|mem:self / itself|'
  + 'mia:my|via:your|lia:his|ŝia:her|ĝia:its|nia:our|ilia:their|sia:his / her own|la:the|unu:one|du:two|tri:three|kvar:four|kvin:five|ses:six|sep:seven|ok:eight|naŭ:nine|dek:ten|cent:hundred|mil:thousand|ambaŭ:both|'
  + 'al:to|el:out of / from|en:in|kun:with|sen:without|sur:on|sub:under|por:for|de:of / from|da:of (an amount)|pri:about|pro:because of|per:with (using)|apud:next to|ĉe:at|ĝis:until / up to|inter:between|kontraŭ:against|laŭ:according to / along|malgraŭ:in spite of|post:after / behind|antaŭ:before / in front of|super:above|tra:through|trans:across|ekster:outside|krom:besides|anstataŭ:instead of|ĉirkaŭ:around|je:at (time)|dum:during / while|'
  + 'kaj:and|sed:but|aŭ:or|ke:that|se:if|ĉar:because|kvankam:although|nek:nor|do:so|kvazaŭ:as if|ol:than|'
  + 'ne:not / no|jes:yes|nun:now|jam:already|ankoraŭ:still / yet|ankaŭ:also|eĉ:even|tre:very|tro:too|ĉi:(here, near)|nur:only|baldaŭ:soon|hodiaŭ:today|hieraŭ:yesterday|morgaŭ:tomorrow|tuj:at once|preskaŭ:almost|apenaŭ:hardly|almenaŭ:at least|plu:any more / further|pli:more|plej:most|for:away|ja:indeed|ĉu:(yes/no question)|nu:well|tamen:however|jen:here is|ofte:often|bone:well|multe:a lot|'
  + 'kio:what|kion:what|kiu:who / which|kiun:whom / which|kiuj:who / which|kiujn:which|kia:what kind of|kies:whose|kie:where|kien:where to|kiel:how|kiam:when|kial:why|kiom:how much|'
  + 'tio:that|tion:that|tiu:that one / that|tiun:that|tiuj:those|tiujn:those|tia:such|ties:that one’s|tie:there|tien:there (to)|tiel:so / like that|tiam:then|tial:therefore|tiom:so much|'
  + 'io:something|ion:something|iu:someone|iun:someone|iuj:some|ia:some kind of|ie:somewhere|iel:somehow|iam:ever / once|iom:a little|'
  + 'ĉio:everything|ĉion:everything|ĉiu:everyone / each|ĉiun:everyone|ĉiuj:all|ĉiujn:all|ĉia:every kind of|ĉie:everywhere|ĉiam:always|ĉiel:in every way|ĉiom:all of it|'
  + 'nenio:nothing|nenion:nothing|neniu:nobody / no|neniun:nobody|nenia:no kind of|nenie:nowhere|neniam:never|neniel:in no way|neniom:none|'
  + 'saluton:hello|dankon:thank you|bonvolu:please (be so kind as to)|estas:is / are|estis:was / were|estos:will be|estus:would be|esti:to be').split('|').map(p => { const i = p.indexOf(':'); return [p.slice(0, i), p.slice(i + 1)]; }));
let EO_RS_GLOSS = null;
function eoRsGlossMap() {
  if (EO_RS_GLOSS) return EO_RS_GLOSS;
  const g = new Map(), put = (w, en) => { const k = eoRsF(w); if (k && en && !g.has(k)) g.set(k, en); };
  for (const [k, en] of Object.entries(EO_RS_COMMON)) put(k, en);
  if (typeof eoWordList === 'function') for (const [w, en] of eoWordList()) put(w, en);
  return (EO_RS_GLOSS = g);
}
const eoRsDict = w => { if (typeof RS_DICT === 'undefined' || !RS_DICT.eo) return null; return RS_DICT.eo.get(w) || null; };
/* the type from the ending: -o noun, -a adjective, -e adverb, verb endings */
function eoRsEnding(k) {
  if (k.length < 3) return null;
  if (/o(j|n|jn)?$/.test(k)) return 'noun';
  if (/a(j|n|jn)?$/.test(k)) return 'adj';
  if (/(as|is|os|us)$/.test(k) || (/[^aeiou]u$/.test(k) && k.length > 3) || (/[^aeiou]i$/.test(k) && k.length > 3)) return 'verb';
  if (/[^aeiou]en?$/.test(k)) return 'adv';
  return null;
}
function eoRsTag(w, i, low) {
  const C = RS_CLOSED.eo, k = eoRsF(w);
  if (!k || /^\d+$/.test(k)) return null;
  if (/^ĉi-./.test(k)) return eoRsTag(k.slice(3), i, low);   // ĉi-vespere = this evening
  if (k === 'la') return 'det';
  if (C.pron.has(k)) return 'pron'; if (C.prep.has(k)) return 'prep'; if (C.conj.has(k)) return 'conj'; if (C.det.has(k)) return 'det';
  if (EO_TABLE.has(k)) { const t = EO_TABLE.get(k); if (t === 'pron' && /^(ki|ti|i|ĉi|neni)u/.test(k)) { const nx = eoRsTag(low[i + 1] || '', i + 1, low); if (nx === 'noun' || nx === 'adj') return 'det'; } return t; }   // "tiu hundo" = that dog
  if (C.adv.has(k)) return 'adv';
  if (EO_RS_INTERJ.has(k)) return null;
  const d = eoRsDict(k); if (d) return d[0];
  const cards = typeof rsLex === 'function' ? rsLex('eo') : null; if (cards?.has(k)) return cards.get(k);
  return eoRsEnding(k);
}
if (typeof rsTagWord === 'function') { const tagAll = rsTagWord; rsTagWord = function (w, i, low, lang) { return lang === 'eo' ? eoRsTag(w, i, low) : tagAll(w, i, low, lang); }; }
/* a meaning from the root: hundojn → hundo (dog), manĝis → manĝi (to eat → ate), rapide → rapida (fast → quickly) */
function eoRsRootGloss(k) {
  const g = eoRsGlossMap(), dict = x => eoRsDict(x)?.[1] || g.get(x) || null;
  const m = /^(.+?)(oj?n?|aj?n?|en?|as|is|os|us|u|i)$/.exec(k); if (!m || m[1].length < 2) return '';
  const root = m[1], end = m[2], noun = dict(root + 'o'), adj = dict(root + 'a'), verb = dict(root + 'i'), adv = dict(root + 'e');
  const clean = s => String(s).split(' / ')[0].replace(/^to /, '');
  if (/^o/.test(end) && noun) return end.includes('j') ? (typeof bldPlEn === 'function' ? bldPlEn(clean(noun)) : clean(noun)) : clean(noun);
  if (/^a/.test(end) && adj) return clean(adj);
  if (/^e/.test(end) && (adv || adj)) return adv ? clean(adv) : /y$/.test(clean(adj)) ? clean(adj).slice(0, -1) + 'ily' : clean(adj) + 'ly';
  if (/^(as|is|os|us|u|i)$/.test(end) && verb) { const v = clean(verb); return end === 'i' ? 'to ' + v : end === 'is' ? (typeof eoPastEn === 'function' ? eoPastEn(v) : v) : end === 'os' ? 'will ' + v : end === 'us' ? 'would ' + v : end === 'u' ? v + '!' : v; }
  // the same root as another kind of word: "la manĝo" (the meal) from manĝi, "kanto" from kanti
  const any = noun || adj || verb || adv; if (any) return clean(any);
  if (/^mal/.test(root)) { const o = eoRsRootGloss(k.slice(3)); if (o) return 'not ' + o; }
  return '';
}
if (typeof rsGloss === 'function') {
  const glossAll = rsGloss;
  rsGloss = function (word, lang) {
    if (lang !== 'eo') return glossAll(word, lang);
    const k = eoRsF(String(word || '').replace(/[.,!?;:«»"“”()]/g, ''));
    if (/^ĉi-./.test(k)) { const r = rsGloss(k.slice(3), lang); return r ? 'this ' + r.replace(/^(in the|at|by) /, '') : ''; }
    const d = eoRsDict(k); if (d?.[1]) return d[1];
    const g = eoRsGlossMap(); if (g.has(k)) return g.get(k);
    const own = glossAll(word, lang); if (own) return own;
    return eoRsRootGloss(k);
  };
}
if (typeof RS_LANGS !== 'undefined') RS_LANGS.eo = 'Esperanto';
