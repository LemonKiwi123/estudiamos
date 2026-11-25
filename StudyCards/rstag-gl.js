'use strict';
/* ================= Sentence Builder · 📖 Real sentences in Galician: word types and meanings =================
   Closed word lists, the Sentence Builder's Galician words, the word list in rsdict-gl.js and a few safe rules.
   Galician has some words that can be two things ("a" is "the", "to" or "her"; "o" is "the" or "him"; "nos" is "in the" or
   "us"; "como" is "how" or "I eat"; "se" is "if" or "himself"): those are decided from the words around them, and left
   without a label when it isn't clear. Pronouns joined to the end of a verb (levántome, gústame, facelo) count as a verb.
   Loaded after rstag.js, rsdict-gl.js and builder-gl.js. */
RS_LANGS.gl = 'Galician';
RS_CLOSED.gl = { art: RS_W('un unha uns unhas'),
  clArt: RS_W('o a os as'),
  det: RS_W('este esta estes estas ese esa eses esas aquel aquela aqueles aquelas meu miña meus miñas teu túa teus túas seu súa seus súas noso nosa nosos nosas voso vosa vosos vosas cada outro outra outros outras algún algunha algúns algunhas ningún ningunha varios varias calquera ambos ambas dous dúas tres catro cinco seis sete oito nove dez cen mil'),
  flex: RS_W('moito moita moitos moitas pouco pouca poucos poucas todo toda todos todas tanto tanta tantos tantas demasiado'),
  pron: RS_W('cal cales eu ti el ela vostede nós vós eles elas vostedes min contigo comigo connosco convosco isto iso aquilo algo nada ninguén alguén quen del dela deles delas mesmo mesma che lle lles vos me te llo lla llelo cho cha mo ma'),
  clArt2: RS_W('nos se'),
  prep: RS_W('ó ós pra ante tras ata con contra de desde dende en entre para perante por sen sobre baixo cara durante mediante ao á aos ás do da dos das no na nas nun nunha nuns nunhas dun dunha duns dunhas polo pola polos polas co coa cos coas cun cunha cuns cunhas deste desta destes destas dese desa deses desas daquel daquela daqueles daquelas neste nesta nestes nestas nese nesa neses nesas niso nisto diso disto daquilo naquel naquela'),
  conj: RS_W('ca coma e ou pero mais nin que porque cando mentres pois senón'),
  adv: RS_W('mañá fóra debaixo enriba diante detrás atrás dentro arredor cerca pronto non si máis menos xa tamén tampouco nunca xamais sempre aquí aí alí acolá hoxe onte agora despois antes logo ben mal tan aínda case só soamente talvez quizais cedo tarde preto lonxe onde entón así xuntos moi abondo daquela axiña devagar'),
  verb: RS_W('é son es somos sodes está están estou estás estamos estades era eras eramos eran foi foron fun fomos estaba estaban estiven estivo ten teñen teño tes temos tedes tiña tiñan tivo tiven hai había houbo vai van vou vas imos ides ía ían fai fan fago fixen fixo fixeches fixemos facemos dixo di digo din dixen pode poden podo podes podemos puido puiden quere queren quero queres quería sei sabe sabes saben sabía vexo ve viu vin dá dou deu dan gusta gustan gustou gustaría ser estar ter ir facer haber dicir poder querer saber ver dar vir sido estado ido feito dito visto posto escrito aberto sexa sexan estea teña vaia faga poida queira saiba precisa preciso parece veña vén veñen veu creo cre penso pensa cómpre hei has ha habemos han')
};
const RS_GL_SUBJ = RS_W('eu ti el ela vostede nós vós eles elas vostedes non nunca se me te che lle lles nos vos tamén xa aínda');
const RS_GL_MODAL = RS_W('de para sen a que pode podes poden podo podemos quere quero queres queren vou vai vas imos van ides teño ten tes temos teñen debo debe debes deben gústame gústache gústalle sei sabe sabes ir non');
const RS_GL_NOT_VERB = RS_W('lugar mar par muller pracer azucre ar dólar altar colar xantar ollar poder ser haber deber azar líder calquera');
const RS_GL_NOT_GER = RS_W('cando lindo linda bando comando mundo segundo fundo profundo redondo tremendo estupendo ando');
const RS_GL_UNACC = s => s.replace(/[áéíóú]/g, c => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' })[c]);
/* the Sentence Builder's Galician words */
function rsGlLex() {
  const m = rsLex('gl'), put = (w, t) => { if (w && !m.has(String(w).toLowerCase())) m.set(String(w).toLowerCase(), t); };
  if (m._gl) return m; m._gl = true;
  if (typeof GL_NOUN !== 'undefined') GL_NOUN.forEach(n => { put(n[0], 'noun'); put(n[1], 'noun'); });
  if (typeof GL_ADJ !== 'undefined') GL_ADJ.forEach(a => a.slice(0, 4).forEach(w => put(w, 'adj')));
  if (typeof GL_VERB !== 'undefined') GL_VERB.forEach(v => { put(glBase(v[0]), 'verb'); put(v[0], 'verb'); v[1].forEach(w => put(w, 'verb')); (v[9] || []).forEach(w => put(w, 'verb')); put(glGer(v[0]), 'verb'); });
  if (typeof GL_IRREG_FORMS !== 'undefined') Object.entries(GL_IRREG_FORMS).forEach(([inf, f]) => { put(inf, 'verb'); String(f).split(/\s+/).forEach(w => put(w, 'verb')); });
  return m;
}
const RS_GL_FEM = () => rsGlFem || (rsGlFem = new Set((typeof GL_NOUN !== 'undefined' ? GL_NOUN : []).filter(n => n[2] === 'f').flatMap(n => [n[0], n[1]]).filter(Boolean)));
let rsGlFem = null;
// a verb with a pronoun joined on: levántome, gústame, déitase (an accent three syllables from the end), facelo, vela (the infinitive's r drops)
function rsGlEnclitic(w, prev) {
  const lex = rsGlLex();
  const m = /^(\p{L}*[áéíóú]\p{L}*?[aeo][ns]?)(me|te|se|che|lle|lles|nos|vos|o|a|os|as)$/u.exec(w);
  if (m && /[áéíóú]/.test(m[1])) { const stem = RS_GL_UNACC(m[1]); if (lex.get(stem) === 'verb' || RS_CLOSED.gl.verb.has(stem) || /(a|e|an|en|as|es|amos|emos|imos)$/.test(stem)) return true; }
  const r = /^(\p{L}{2,}[aei])(lo|la|los|las)$/u.exec(w);
  if (r && (lex.get(r[1] + 'r') === 'verb' || RS_GL_MODAL.has(prev))) return true;
  const p = /^(\p{L}{3,}(?:ou|eu|iu|ron))(me|te|se|che|lle|lles|nos|vos|o|a|os|as|no|na)$/u.exec(w) || /^(\p{L}{3,}mos)(nos|che|lle|lles|vos)$/u.exec(w);   // cubriuse, levantouse, deronme
  if (p && w.length > 6) return true;
  return false;
}
function rsGlTagWord(w, i, low, raw = []) {
  const C = RS_CLOSED.gl, lex = rsGlLex(), prev = low[i - 1] || '';
  if (!w) return null;
  if (/^\d+$/.test(w)) return null;
  if (C.art.has(w)) return 'det';
  if (C.clArt.has(w) || C.flex.has(w) || C.clArt2.has(w) || w === 'como') return null;   // decided from the neighbours
  if (C.pron.has(w)) return 'pron';
  if (C.prep.has(w)) return 'prep'; if (C.conj.has(w)) return 'conj'; if (C.adv.has(w)) return 'adv'; if (C.det.has(w)) return 'det'; if (C.verb.has(w)) return 'verb';
  if (RS_DICT_GET('gl', w)) return RS_DICT_GET('gl', w)[0];
  if (lex.has(w)) return lex.get(w);
  if (rsGlEnclitic(w, prev)) return 'verb';
  const afterNoun = C.art.has(prev) || C.det.has(prev) || C.clArt.has(prev) || (C.prep.has(prev) && !/^(de|para|sen|a|ata|por)$/.test(prev));
  if (/mente$/.test(w) && w.length > 6) return 'adv';
  if (/(ando|endo|indo)$/.test(w) && w.length > 5 && !RS_GL_NOT_GER.has(w)) return 'verb';
  if (RS_GL_SUBJ.has(prev) && !afterNoun && w.length > 1 && !/^\p{Lu}/u.test(raw[i] || '')) return 'verb';   // eu falo, non sabe, se lembra
  if (!afterNoun && /(aron|eron|iron|abamos|iamos|aremos|eremos|iremos|arían|erían|irían|ase|ese|ise|ches|aches|iches)$/.test(w) && w.length > 5) return 'verb';
  if (!C.art.has(prev) && !C.det.has(prev) && /[^o]ou$/.test(w) && w.length > 4) return 'verb';   // falou, chegou, "o atopou" (not "ou", "vou": those are listed)
  if (!afterNoun && /[^aeiou](rá|rán|rei|remos)$/.test(w) && w.length > 4) return 'verb';   // fará, chegará, irei   // falou, chegou (not "ou", "vou": those are listed)
  if (!afterNoun && /[^aeiou]iu$/.test(w) && w.length > 4) return 'verb';   // saíu, partiu
  if (/(ar|er|ir)$/.test(w) && w.length > 3 && !RS_GL_NOT_VERB.has(w) && RS_GL_MODAL.has(prev)) return 'verb';
  return null;
}
function rsGlTagSentence(words) {
  const C = RS_CLOSED.gl, low = words.map(w => w.toLowerCase().replace(/[.,!?¿¡;:«»"“”()]/g, ''));
  const out = low.map((w, i) => rsGlTagWord(w, i, low, words)), lex = rsGlLex();
  const verbish = k => out[k] === 'verb' || (low[k] && /(ar|er|ir)$/.test(low[k]) && low[k].length > 3 && !RS_GL_NOT_VERB.has(low[k]) && lex.get(low[k]) !== 'noun');
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < low.length; i++) {
    if (out[i] != null) continue;
    const w = low[i], prev = out[i - 1], next = out[i + 1], nw = low[i + 1] || '', pw = low[i - 1] || '', cap = /^\p{Lu}/u.test(words[i + 1] || '');
    if (w === 'como') { out[i] = RS_GL_SUBJ.has(pw) && pw !== 'se' ? 'verb' : i === 0 ? 'adv' : pass ? 'conj' : null; continue; }
    if (w === 'se' && next === 'pron') { out[i] = 'conj'; continue; }
    if (w === 'se') { out[i] = next === 'verb' || (pass && verbish(i + 1)) ? (next === 'verb' && /^(eu|ti|el|ela|vostede|nós|vós|eles|elas|vostedes)$/.test(nw) ? 'conj' : 'pron') : next === 'det' ? 'conj' : null; continue; }
    if (w === 'nos' && cap) { out[i] = 'prep'; continue; }
    if (w === 'nos') { out[i] = next === 'noun' || next === 'adj' || next === 'det' ? 'prep' : next === 'verb' || prev === 'verb' ? 'pron' : null; continue; }
    if ((w === 'o' || w === 'a' || w === 'os' || w === 'as') && nw === 'que') { out[i] = 'pron'; continue; }   // o que = what
    if (w === 'o' || w === 'os' || w === 'as') { out[i] = next === 'verb' && !(lex.get(nw) === 'noun') ? 'pron' : next === 'noun' || next === 'adj' || next === 'det' || (pass && !next && /^\p{L}+$/u.test(nw) && !cap) ? 'det' : null; continue; }
    if (w === 'a') {
      if (cap) { out[i] = 'prep'; continue; }
      if (next === 'det') { out[i] = C.det.has(nw) && /^(miña|túa|súa|nosa|vosa|miñas|túas|súas|nosas|vosas)$/.test(nw) ? 'det' : 'prep'; continue; }
      if (next === 'verb' || (pass && verbish(i + 1))) { out[i] = prev === 'verb' || prev === 'adj' || prev === 'noun' ? 'prep' : prev === 'pron' ? 'pron' : null; continue; }
      if (next === 'noun' || next === 'adj') { out[i] = prev !== 'verb' || RS_GL_FEM().has(nw) ? 'det' : null; continue; }
      if (pass && !next && /^\p{Ll}+$/u.test(words[i + 1] || '') && !verbish(i + 1)) { out[i] = 'det'; continue; }   // a + an unknown word: "a neve", "vexo a televisión"
      if (next === 'pron' && /^(min|ti|el|ela|nós|vós|eles|elas|vostede|vostedes)$/.test(nw)) { out[i] = 'prep'; continue; }   // a min, a ela
      continue;
    }
    if (C.flex.has(w)) { out[i] = next === 'noun' || next === 'adj' && /s$/.test(w) || next === 'det' ? 'det' : next === 'adj' ? 'adv' : next === 'pron' ? 'pron' : pass ? 'adv' : null; continue; }
    if (pass && i === 0 && /^\p{Lu}/u.test(words[0]) && RS_DATA.gl?.lower && !RS_DATA.gl.lower.has(w)) { out[i] = 'noun'; continue; }   // a name starting the sentence
    if (pass && i > 0 && /^\p{Lu}/u.test(words[i])) { out[i] = 'noun'; continue; }   // a name in the middle
    if (pass && (prev === 'det' || (prev === 'prep' && !/^(de|para|sen|a|ata|por)$/.test(pw))) && /^\p{L}+$/u.test(w) && w.length > 2) out[i] = 'noun';
  }
  return out;
}
{ const prev = rsTagWord; rsTagWord = function (w, i, low, lang) { return lang === 'gl' ? rsGlTagWord(w, i, low) : prev(w, i, low, lang); }; }
{ const prev = rsTagSentence; rsTagSentence = function (words, lang) { return lang === 'gl' ? rsGlTagSentence(words) : prev(words, lang); }; }

/* meanings under the words */
RS_GLOSS_COMMON.gl = 'é:is|son:am / are|es:you are|somos:we are|sodes:you are|está:is|están:are|estou:I am|estás:you are|estamos:we are|era:was|foi:was / went|fun:I was / went|estaba:was|ten:has|teñen:have|teño:I have|tes:you have|temos:we have|tiña:had|hai:there is / are|había:there was|vai:goes|van:go|vou:I go|vas:you go|imos:we go / let\'s|fai:does / makes|fago:I do / make|fixo:did|fixen:I did|dixo:said|di:says|pode:can|podo:I can|podes:you can|quere:wants|quero:I want|queres:you want|sei:I know|sabe:knows|sabes:you know|vexo:I see|viu:saw|vin:I saw / I came|gusta:pleases (likes)|gústame:I like|gústache:you like|gústalle:he / she likes|preciso:I need|precisa:needs|creo:I think|parece:seems|cómpre:it is necessary|eu:I|ti:you|el:he|ela:she|vostede:you|nós:we|vós:you|eles:they|elas:they|vostedes:you|me:me|te:you|che:(to) you|se:if / (him/her)self|lle:(to) him / her|lles:(to) them|nos:us / in the|vos:you|o:the / him|a:the / to / her|os:the / them|as:the / them|un:a|unha:a|uns:some|unhas:some|que:that / what|e:and|ou:or|pero:but|mais:but|porque:because|cando:when|como:how / like|moi:very|moito:a lot / much|moita:a lot of|moitos:many|moitas:many|máis:more|menos:less|non:not / no|si:yes|xa:already|aquí:here|alí:there|aí:there|iso:that|isto:this|aquilo:that|algo:something|nada:nothing|todo:everything / all|todos:everyone / all|tamén:also|sempre:always|nunca:never|ben:well|mal:badly|agora:now|hoxe:today|mañá:tomorrow / morning|onte:yesterday|quen:who|onde:where|por:for / by|para:for / to|con:with|sen:without|de:of / from|en:in|ao:to the|á:to the|aos:to the|ás:to the|do:of the|da:of the|dos:of the|das:of the|no:in the|na:in the|nas:in the|nun:in a|nunha:in a|dun:of a|dunha:of a|polo:by the / for the|pola:by the / for the|co:with the|coa:with the|cos:with the|coas:with the|cun:with a|cunha:with a|meu:my|miña:my|meus:my|miñas:my|teu:your|túa:your|seu:his / her / your|súa:his / her / your|noso:our|nosa:our|del:his|dela:her|deles:their|este:this|esta:this|ese:that|esa:that|aquel:that|aquela:that|outro:another|outra:another|tan:so|aínda:still|só:only|despois:after|antes:before|ata:until|sobre:about|entre:between|mesmo:same / even|cada:each|dous:two|dúas:two|tres:three|tom:Tom|mary:Mary|maría:Mary';
{ const prev = rsGlossMap; rsGlossMap = function (lang) {
  const m = prev(lang); if (lang !== 'gl' || m._gl) return m; m._gl = true;
  const put = (w, g) => { if (w && g && !m.has(String(w).toLowerCase())) m.set(String(w).toLowerCase(), String(g)); };
  (typeof GL_NOUN !== 'undefined' ? GL_NOUN : []).forEach(n => { put(n[0], n[4]); put(n[1], n[5] || n[4]); });
  (typeof GL_ADJ !== 'undefined' ? GL_ADJ : []).forEach(a => a.slice(0, 4).forEach(w => put(w, a[4])));
  (typeof GL_VERB !== 'undefined' ? GL_VERB : []).forEach(v => { put(glBase(v[0]), 'to ' + v[5]); v[1].forEach(w => put(w, v[5])); (v[9] || []).forEach(w => put(w, v[5])); put(glGer(v[0]), glIng(v[5])); });
  (typeof GL_PRON !== 'undefined' ? GL_PRON : []).forEach(p => put(p[0], p[3]));
  (typeof GL_DET !== 'undefined' ? GL_DET : []).forEach(d => put(d[0], d[3]));
  (typeof GL_PREP !== 'undefined' ? GL_PREP : []).forEach(p => put(p[0], p[1]));
  (typeof GL_ADV !== 'undefined' ? GL_ADV : []).forEach(a => put(a[0], a[1]));
  // your own cards like "o can" / "a casa"
  try { for (const d of S.decks) { if (langBase(d.frontLang || '') !== 'gl') continue;
    for (const c of cardsOf(d.id)) { const f = plainSent(c.front || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase(), b = plainSent(c.back || '').split(/[\n;,/]/)[0].trim(), p = f.split(/\s+/);
      if (b && b.length <= 30 && p.length === 2 && /^(o|a|os|as|un|unha)$/.test(p[0])) put(p[1], b.replace(/^(the|a|an) /i, '')); } } } catch {}
  return m;
}; }
{ const prev = rsGloss; rsGloss = function (word, lang) {
  const g = prev(word, lang); if (g || lang !== 'gl') return g;
  const w = String(word || '').toLowerCase().replace(/[.,!?¿¡;:«»"“”()]/g, ''), m = rsGlossMap('gl');
  // levántome = levanto + me, facelo = facer + it
  const h = /^(.+?)(lles|lle|che|me|te|se|nos|vos|lo|la|los|las|o|a|os|as)$/.exec(w);
  if (h && h[1].length > 1) {
    const st = RS_GL_UNACC(h[1]), a = m.get(st) || m.get(h[1]) || (/(lo|la|los|las)$/.test(h[2]) ? m.get(st + 'r') : ''), b = ({ lo: 'it / him', la: 'it / her', los: 'them', las: 'them', o: 'it / him', a: 'it / her', os: 'them', as: 'them', me: 'me', te: 'you', se: '(him/her)self', che: 'to you', lle: 'to him / her', lles: 'to them', nos: 'us', vos: 'you' })[h[2]];
    if (a) return [a, b].filter(Boolean).join(' + ');
  }
  return '';
}; }
