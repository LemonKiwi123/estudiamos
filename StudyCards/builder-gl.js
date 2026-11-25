'use strict';
/* ================= Sentence Builder: Galician =================
   Standard Galician (RAG spelling). Close to Portuguese, so it follows builder-pt.js, with what Galician does its own way:
   - six verb forms (eu, ti, el/ela/vostede, nós, vós, eles/elas/vostedes); ser has "son" for both eu and eles.
   - me / te / se / nos / vos go AFTER the verb, joined to it, in a plain sentence: "eu levántome", "lávase". After non,
     nunca, sempre or tamén they go before it: "non me levanto".
   - gustar works like Spanish: "gústame o café", "gústanme os gatos", "non lle gusta o leite" (che = to you, lle = to him/her).
   - the article comes before a possessive: "o meu libro", "a miña casa".
   - de + o = do, en + a = na, a + a = á, con + o = co (con + a = coa).
   - moi (very) before a describing word, moito (a lot) after the verb.
   - ser for what something is like, estar for how it is right now and where it is; ter fame / sede / frío.
   - "estou comendo" and "estou a comer" both mean "I am eating".
   Loaded after builder.js. */

//            word        form gender English  you?     form: 0 eu, 1 ti, 2 el/ela/vostede, 3 nós, 4 vós, 5 eles/elas/vostedes
const GL_PRON = [['eu', 0, 'x', 'I'], ['ti', 1, 'x', 'you', 1], ['el', 2, 'm', 'he'], ['ela', 2, 'f', 'she'], ['vostede', 2, 'x', 'you', 1],
  ['nós', 3, 'x', 'we'], ['vós', 4, 'x', 'you', 1], ['eles', 5, 'm', 'they'], ['elas', 5, 'f', 'they'], ['vostedes', 5, 'x', 'you', 1]];
const GL_FORM = [[1, 's'], [2, 's'], [3, 's'], [1, 'p'], [2, 'p'], [3, 'p']];
// determiner families: m sing, f sing, m plural, f plural
const GL_DETF = { o: ['o', 'a', 'os', 'as'], un: ['un', 'unha', 'uns', 'unhas'], meu: ['meu', 'miña', 'meus', 'miñas'], teu: ['teu', 'túa', 'teus', 'túas'],
  seu: ['seu', 'súa', 'seus', 'súas'], noso: ['noso', 'nosa', 'nosos', 'nosas'], voso: ['voso', 'vosa', 'vosos', 'vosas'],
  este: ['este', 'esta', 'estes', 'estas'], ese: ['ese', 'esa', 'eses', 'esas'], aquel: ['aquel', 'aquela', 'aqueles', 'aquelas'],
  dous: [null, null, 'dous', 'dúas'], tres: [null, null, 'tres', 'tres'] };
const GL_DET_EN = { o: ['the', 'the'], un: ['a', 'some'], meu: ['my', 'my'], teu: ['your', 'your'], seu: ['his/her/your', 'his/her/your'], noso: ['our', 'our'], voso: ['your', 'your'],
  este: ['this', 'these'], ese: ['that', 'those'], aquel: ['that', 'those'], dous: ['two', 'two'], tres: ['three', 'three'] };
const GL_POSS = ['meu', 'teu', 'seu', 'noso', 'voso'];
const GL_DET = [];
for (const [fam, ws] of Object.entries(GL_DETF)) ws.forEach((w, k) => { if (w && !GL_DET.some(d => d[0] === w)) GL_DET.push([w, fam, fam === 'o' || fam === 'un' ? 'art' : GL_POSS.includes(fam) ? 'poss' : fam === 'dous' || fam === 'tres' ? 'num' : 'dem', GL_DET_EN[fam][k >= 2 ? 1 : 0]]); });
const glIdx = (g, num) => (num === 'p' ? 2 : 0) + (g === 'f' ? 1 : 0);
const glWant = (fam, g, num) => GL_DETF[fam][glIdx(g, num)] || GL_DETF[fam][glIdx(g, 'p')];
// contractions: preposition + article in one word
const GL_CONTR = { do: ['de', 'o'], da: ['de', 'a'], dos: ['de', 'os'], das: ['de', 'as'], no: ['en', 'o'], na: ['en', 'a'], nos: ['en', 'os'], nas: ['en', 'as'],
  ao: ['a', 'o'], 'á': ['a', 'a'], aos: ['a', 'os'], 'ás': ['a', 'as'], co: ['con', 'o'], coa: ['con', 'a'], cos: ['con', 'os'], coas: ['con', 'as'] };
const glContr = (p, art) => Object.keys(GL_CONTR).find(k => GL_CONTR[k][0] === p && GL_CONTR[k][1] === art) || p + ' ' + art;
//            singular   plural     g    kind      English one / many   mass (1 can't count, 2 both)
const GL_NOUN = [
  ['home', 'homes', 'm', 'person', 'man', 'men'], ['muller', 'mulleres', 'f', 'person', 'woman', 'women'], ['neno', 'nenos', 'm', 'person', 'boy', 'boys'], ['nena', 'nenas', 'f', 'person', 'girl', 'girls'],
  ['amigo', 'amigos', 'm', 'person', 'friend', 'friends'], ['amiga', 'amigas', 'f', 'person', 'friend', 'friends'], ['nai', null, 'f', 'person', 'mother', null], ['pai', null, 'm', 'person', 'father', null],
  ['irmán', 'irmáns', 'm', 'person', 'brother', 'brothers'], ['irmá', 'irmás', 'f', 'person', 'sister', 'sisters'], ['profesor', 'profesores', 'm', 'person', 'teacher', 'teachers'],
  ['profesora', 'profesoras', 'f', 'person', 'teacher', 'teachers'], ['médico', 'médicos', 'm', 'person', 'doctor', 'doctors'],
  ['can', 'cans', 'm', 'animal', 'dog', 'dogs'], ['gato', 'gatos', 'm', 'animal', 'cat', 'cats'], ['paxaro', 'paxaros', 'm', 'animal', 'bird', 'birds'], ['cabalo', 'cabalos', 'm', 'animal', 'horse', 'horses'],
  ['pan', null, 'm', 'food', 'bread', null, 1], ['arroz', null, 'm', 'food', 'rice', null, 1], ['queixo', null, 'm', 'food', 'cheese', null, 1], ['peixe', null, 'm', 'food', 'fish', null, 1],
  ['carne', null, 'f', 'food', 'meat', null, 1], ['sopa', null, 'f', 'food', 'soup', null, 1], ['mazá', 'mazás', 'f', 'food', 'apple', 'apples'], ['bolo', 'bolos', 'm', 'food', 'cake', 'cakes'],
  ['laranxa', 'laranxas', 'f', 'food', 'orange', 'oranges'], ['xeado', 'xeados', 'm', 'food', 'ice cream', 'ice creams'],
  ['auga', null, 'f', 'drink', 'water', null, 1], ['leite', null, 'm', 'drink', 'milk', null, 1], ['café', null, 'm', 'drink', 'coffee', null, 2], ['zume', null, 'm', 'drink', 'juice', null, 1], ['té', null, 'm', 'drink', 'tea', null, 1],
  ['libro', 'libros', 'm', 'read', 'book', 'books'], ['carta', 'cartas', 'f', 'read', 'letter', 'letters'], ['revista', 'revistas', 'f', 'read', 'magazine', 'magazines'], ['xornal', 'xornais', 'm', 'read', 'newspaper', 'newspapers'],
  ['casa', 'casas', 'f', 'place', 'house', 'houses'], ['cidade', 'cidades', 'f', 'place', 'town', 'towns'], ['escola', 'escolas', 'f', 'place', 'school', 'schools'], ['parque', 'parques', 'm', 'place', 'park', 'parks'],
  ['praia', 'praias', 'f', 'place', 'beach', 'beaches'], ['tenda', 'tendas', 'f', 'place', 'store', 'stores'], ['restaurante', 'restaurantes', 'm', 'place', 'restaurant', 'restaurants'], ['mercado', 'mercados', 'm', 'place', 'market', 'markets'],
  ['oficina', 'oficinas', 'f', 'place', 'office', 'offices'], ['cociña', 'cociñas', 'f', 'place', 'kitchen', 'kitchens'], ['biblioteca', 'bibliotecas', 'f', 'place', 'library', 'libraries'], ['igrexa', 'igrexas', 'f', 'place', 'church', 'churches'],
  ['coche', 'coches', 'm', 'thing', 'car', 'cars'], ['mesa', 'mesas', 'f', 'thing', 'table', 'tables'], ['cadeira', 'cadeiras', 'f', 'thing', 'chair', 'chairs'], ['móbil', 'móbiles', 'm', 'thing', 'phone', 'phones'],
  ['pelota', 'pelotas', 'f', 'thing', 'ball', 'balls'], ['flor', 'flores', 'f', 'thing', 'flower', 'flowers'], ['porta', 'portas', 'f', 'thing', 'door', 'doors'], ['xanela', 'xanelas', 'f', 'thing', 'window', 'windows'],
  ['diñeiro', null, 'm', 'thing', 'money', null, 1], ['agasallo', 'agasallos', 'm', 'thing', 'gift', 'gifts'], ['bicicleta', 'bicicletas', 'f', 'thing', 'bike', 'bikes'],
  ['autobús', 'autobuses', 'm', 'thing', 'bus', 'buses'], ['tren', 'trens', 'm', 'thing', 'train', 'trains'],
  // how you feel: "teño fame" (I have hunger), with no article
  ['fame', null, 'f', 'feel', 'hungry'], ['sede', null, 'f', 'feel', 'thirsty'], ['frío', null, 'm', 'feel', 'cold'], ['calor', null, 'f', 'feel', 'hot'], ['medo', null, 'm', 'feel', 'scared'], ['sono', null, 'm', 'feel', 'sleepy']];
const glNW = (n, num) => num === 'p' ? n[1] : n[0];
const GL_OPENABLE = ['porta', 'xanela', 'libro', 'revista', 'tenda', 'oficina', 'restaurante', 'biblioteca', 'carta', 'agasallo', 'xornal'];
const GL_RIDE = ['autobús', 'tren', 'coche', 'bicicleta'];
//            m sing   f sing   m plural  f plural  English   describes   where (pre = can also go before the noun)   with ser / estar / both
const GL_ADJ = [['bo', 'boa', 'bos', 'boas', 'good', 'pafrl', 'pre', 'both'], ['malo', 'mala', 'malos', 'malas', 'bad', 'pafr', 'pre', 'ser'],
  ['grande', 'grande', 'grandes', 'grandes', 'big', 'patl', 'post', 'ser'], ['pequeno', 'pequena', 'pequenos', 'pequenas', 'small', 'patl', 'post', 'ser'],
  ['novo', 'nova', 'novos', 'novas', 'new', 'tlr', 'post', 'ser'], ['vello', 'vella', 'vellos', 'vellas', 'old', 'patlr', 'post', 'ser'],
  ['bonito', 'bonita', 'bonitos', 'bonitas', 'pretty', 'patl', 'post', 'both'], ['xove', 'xove', 'xoves', 'xoves', 'young', 'pa', 'post', 'ser'], ['alto', 'alta', 'altos', 'altas', 'tall', 'p', 'post', 'ser'],
  ['vermello', 'vermella', 'vermellos', 'vermellas', 'red', 'tf', 'post', 'ser'], ['azul', 'azul', 'azuis', 'azuis', 'blue', 't', 'post', 'ser'], ['verde', 'verde', 'verdes', 'verdes', 'green', 'tf', 'post', 'ser'],
  ['negro', 'negra', 'negros', 'negras', 'black', 'at', 'post', 'ser'], ['branco', 'branca', 'brancos', 'brancas', 'white', 'atf', 'post', 'ser'], ['amarelo', 'amarela', 'amarelos', 'amarelas', 'yellow', 'tf', 'post', 'ser'],
  ['caro', 'cara', 'caros', 'caras', 'expensive', 'tflr', 'post', 'both'], ['barato', 'barata', 'baratos', 'baratas', 'cheap', 'tflr', 'post', 'both'],
  ['doado', 'doada', 'doados', 'doadas', 'easy', 'r', 'post', 'ser'], ['difícil', 'difícil', 'difíciles', 'difíciles', 'hard', 'r', 'post', 'ser'],
  ['rápido', 'rápida', 'rápidos', 'rápidas', 'fast', 'pat', 'post', 'ser'], ['simpático', 'simpática', 'simpáticos', 'simpáticas', 'nice', 'p', 'post', 'ser'], ['intelixente', 'intelixente', 'intelixentes', 'intelixentes', 'smart', 'p', 'post', 'ser'],
  ['feliz', 'feliz', 'felices', 'felices', 'happy', 'pa', 'post', 'both'], ['triste', 'triste', 'tristes', 'tristes', 'sad', 'pa', 'post', 'both'], ['delicioso', 'deliciosa', 'deliciosos', 'deliciosas', 'delicious', 'f', 'post', 'both'],
  ['frío', 'fría', 'fríos', 'frías', 'cold', 'fl', 'post', 'both'], ['quente', 'quente', 'quentes', 'quentes', 'hot', 'f', 'post', 'both'], ['limpo', 'limpa', 'limpos', 'limpas', 'clean', 'tl', 'post', 'both'], ['sucio', 'sucia', 'sucios', 'sucias', 'dirty', 'tl', 'post', 'both'],
  ['canso', 'cansa', 'cansos', 'cansas', 'tired', 'pa', 'post', 'estar'], ['contento', 'contenta', 'contentos', 'contentas', 'glad', 'pa', 'post', 'estar'], ['enfermo', 'enferma', 'enfermos', 'enfermas', 'sick', 'pa', 'post', 'estar']];
//            infinitive  eu, ti, el/ela/vostede, nós, vós, eles/elas/vostedes     kind   what it takes   needs one  English   he/she form   who   -se verb   the forms with the pronoun joined on
const GL_VERB = [['comer', ['como', 'comes', 'come', 'comemos', 'comedes', 'comen'], 'tr', ['food'], 0, 'eat', 'eats', 'a'],
  ['beber', ['bebo', 'bebes', 'bebe', 'bebemos', 'bebedes', 'beben'], 'tr', ['drink'], 0, 'drink', 'drinks', 'a'],
  ['facer', ['fago', 'fas', 'fai', 'facemos', 'facedes', 'fan'], 'tr', ['food', 'drink'], 1, 'make', 'makes', 'p'],
  ['ler', ['leo', 'les', 'le', 'lemos', 'ledes', 'len'], 'tr', ['read'], 0, 'read', 'reads', 'p'],
  ['escribir', ['escribo', 'escribes', 'escribe', 'escribimos', 'escribides', 'escriben'], 'tr', ['read'], 0, 'write', 'writes', 'p'],
  ['comprar', ['compro', 'compras', 'compra', 'compramos', 'comprades', 'compran'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'buy', 'buys', 'p'],
  ['vender', ['vendo', 'vendes', 'vende', 'vendemos', 'vendedes', 'venden'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'sell', 'sells', 'p'],
  ['ter', ['teño', 'tes', 'ten', 'temos', 'tedes', 'teñen'], 'ter', ['*'], 1, 'have', 'has', 'a'],
  ['querer', ['quero', 'queres', 'quere', 'queremos', 'queredes', 'queren'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'want', 'wants', 'a'],
  ['buscar', ['busco', 'buscas', 'busca', 'buscamos', 'buscades', 'buscan'], 'tr', ['*'], 1, 'look for', 'looks for', 'a'],
  ['ver', ['vexo', 'ves', 've', 'vemos', 'vedes', 'ven'], 'tr', ['*'], 1, 'see', 'sees', 'a'],
  ['visitar', ['visito', 'visitas', 'visita', 'visitamos', 'visitades', 'visitan'], 'tr', ['place', 'person'], 1, 'visit', 'visits', 'p'],
  ['abrir', ['abro', 'abres', 'abre', 'abrimos', 'abrides', 'abren'], 'tr', ['open'], 1, 'open', 'opens', 'p'],
  ['pechar', ['pecho', 'pechas', 'pecha', 'pechamos', 'pechades', 'pechan'], 'tr', ['open'], 1, 'close', 'closes', 'p'],
  ['falar', ['falo', 'falas', 'fala', 'falamos', 'falades', 'falan'], 'in', null, 0, 'talk', 'talks', 'p'],
  ['traballar', ['traballo', 'traballas', 'traballa', 'traballamos', 'traballades', 'traballan'], 'in', null, 0, 'work', 'works', 'p'],
  ['estudar', ['estudo', 'estudas', 'estuda', 'estudamos', 'estudades', 'estudan'], 'in', null, 0, 'study', 'studies', 'p'],
  ['xogar', ['xogo', 'xogas', 'xoga', 'xogamos', 'xogades', 'xogan'], 'in', null, 0, 'play', 'plays', 'a'],
  ['correr', ['corro', 'corres', 'corre', 'corremos', 'corredes', 'corren'], 'in', null, 0, 'run', 'runs', 'a'],
  ['camiñar', ['camiño', 'camiñas', 'camiña', 'camiñamos', 'camiñades', 'camiñan'], 'in', null, 0, 'walk', 'walks', 'a'],
  ['durmir', ['durmo', 'dormes', 'dorme', 'durmimos', 'durmides', 'dormen'], 'in', null, 0, 'sleep', 'sleeps', 'a'],
  ['vivir', ['vivo', 'vives', 'vive', 'vivimos', 'vivides', 'viven'], 'in', null, 0, 'live', 'lives', 'a'],
  ['ir', ['vou', 'vas', 'vai', 'imos', 'ides', 'van'], 'ir', null, 1, 'go', 'goes', 'a'],
  ['ser', ['son', 'es', 'é', 'somos', 'sodes', 'son'], 'ser', null, 1, 'be', 'is', 'a'],
  ['estar', ['estou', 'estás', 'está', 'estamos', 'estades', 'están'], 'estar', null, 1, 'be', 'is', 'a'],
  // gustar: "gústame o café" (coffee pleases me). Its forms go with what you like (gusta / gustan), so they are made apart (glGustar)
  ['gustar', ['gusto', 'gustas', 'gusta', 'gustamos', 'gustades', 'gustan'], 'gustar', null, 1, 'like', 'likes', 'a'],
  // -se verbs: the 9th item (1) means they need me / te / se / nos / vos; the 10th has the forms with it joined on (levántome)
  ['levantarse', ['levanto', 'levantas', 'levanta', 'levantamos', 'levantades', 'levantan'], 'in', null, 0, 'get up', 'gets up', 'a', 1, ['levántome', 'levántaste', 'levántase', 'levantámonos', 'levantádesvos', 'levántanse']],
  ['deitarse', ['deito', 'deitas', 'deita', 'deitamos', 'deitades', 'deitan'], 'in', null, 0, 'go to bed', 'goes to bed', 'p', 1, ['déitome', 'déitaste', 'déitase', 'deitámonos', 'deitádesvos', 'déitanse']],
  ['lavarse', ['lavo', 'lavas', 'lava', 'lavamos', 'lavades', 'lavan'], 'in', null, 0, 'wash up', 'washes up', 'p', 1, ['lávome', 'lávaste', 'lávase', 'lavámonos', 'lavádesvos', 'lávanse']],
  ['vestirse', ['visto', 'vistes', 'viste', 'vestimos', 'vestides', 'visten'], 'in', null, 0, 'get dressed', 'gets dressed', 'p', 1, ['vístome', 'vísteste', 'vístese', 'vestímonos', 'vestídesvos', 'vístense']],
  ['sentarse', ['sento', 'sentas', 'senta', 'sentamos', 'sentades', 'sentan'], 'in', null, 0, 'sit down', 'sits down', 'a', 1, ['séntome', 'séntaste', 'séntase', 'sentámonos', 'sentádesvos', 'séntanse']]];
const GL_REFL = ['me', 'te', 'se', 'nos', 'vos', 'se'];
// gustar: to me, to you, to him / her, to us, to you all, to them
const GL_IOBJ = ['me', 'che', 'lle', 'nos', 'vos', 'lles'];
const GL_IOBJ_EN = ['I', 'you', 'he/she', 'we', 'you', 'they'];
const glInfOf = inf => String(inf).replace(/se$/, '').replace(/(ar|er|ir|ír|ór)$/, '$1');
const glBase = inf => /(ar|er|ir)se$/.test(inf) ? inf.slice(0, -2) : inf;
const glGer = inf => glBase(inf).replace(/r$/, 'ndo');
/* The stressed vowel gets an accent when a pronoun is joined on and the word becomes stressed three syllables from the end:
   levanto + me = levántome, levantamos + nos = levantámonos. A written accent on the last syllable goes (está + se = estase). */
const GL_V = 'aeiouáéíóú', GL_ACC = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }, GL_UNACC = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };
function glEnclitic(form, cl) {
  form = String(form);
  if (cl === 'nos' && /mos$/.test(form)) form = form.slice(0, -1);   // levantamos + nos = levantámonos
  if (/[áéíóú]$|[áéíóú][ns]$/.test(form)) return form.replace(/[áéíóú](?=[ns]?$)/, c => GL_UNACC[c]) + cl;   // está + se → estase
  if (/[áéíóú]/.test(form)) return form + cl;   // an accent already on the stem (fácil): keep it
  // vowel groups (a diphthong counts as one): find the second-to-last one, and in it the strong vowel (or the last one in ui / iu)
  const groups = []; let m; const re = /[aeiou]+/g;
  while ((m = re.exec(form))) groups.push([m.index, m[0]]);
  // ending in a consonant other than n / s (levantar): the stress is on the last syllable, and with the pronoun it needs no accent
  if (!/[aeiouns]$/.test(form) || groups.length < 2) return form + cl;   // one syllable (ve + se = vese) needs none either
  const [at, v] = groups[groups.length - 2]; let k = v.search(/[aeo]/); if (k < 0) k = v.length - 1;
  return form.slice(0, at + k) + GL_ACC[v[k]] + form.slice(at + k + 1) + cl;
}
//            word        English     where it can go: e = start or end, p = right before the verb, v = right after the verb, z = at the end
const GL_ADV = [['hoxe', 'today', 'ez'], ['mañá', 'tomorrow', 'ez'], ['agora', 'now', 'ez'], ['sempre', 'always', 'pv'], ['tamén', 'too', 'pz'],
  ['ben', 'well', 'vz'], ['moitas veces', 'often', 'evz'], ['aquí', 'here', 'z'], ['moito', 'a lot', 'vz']];
const GL_ATTRACT = ['sempre', 'tamén'];   // before the verb, these pull me / te / se in front of it, like non
const GL_PREP = [['a', 'to'], ['ao', 'to the'], ['á', 'to the'], ['aos', 'to the'], ['ás', 'to the'], ['en', 'in / at'], ['no', 'in the / at the'], ['na', 'in the / at the'],
  ['nos', 'in the / at the'], ['nas', 'in the / at the'], ['con', 'with'], ['co', 'with the'], ['coa', 'with the'], ['cos', 'with the'], ['coas', 'with the'],
  ['para', 'for / to'], ['de', 'of / from'], ['do', 'of the'], ['da', 'of the'], ['dos', 'of the'], ['das', 'of the']];
const GL_CONJ = [['e', 'and'], ['pero', 'but'], ['ou', 'or']];
const GL_KIND = { food: 'food', drink: 'drinks', read: 'things you read or write', thing: 'things', place: 'places', animal: 'animals', person: 'people', open: 'things you can open' };
const GL_HOW_VERBS = /^(falar|traballar|estudar|xogar|correr|camiñar|durmir|comer|beber|ler|escribir)$/;   // verbs that go with ben / moito
const glWhere = a => { const p = a.pos, s = []; if (p.includes('e')) s.push('at the start or the end'); if (p.includes('p')) s.push('right before the verb'); if (p.includes('v')) s.push('right after the verb'); if (p.includes('z') && !p.includes('e')) s.push('at the end'); return s.join(' or '); };
const glIng = en => en.replace(/^(\w+)/, w => /ie$/.test(w) ? w.slice(0, -2) + 'ying' : /[^aeiou][aeiou][bdgmnprt]$/.test(w) && !/^(visit|open|listen)$/.test(w) ? w + w.slice(-1) + 'ing' : /[^e]e$/.test(w) ? w.slice(0, -1) + 'ing' : w + 'ing');

/* chips (each carries its English, so the meanings under the words work) */
const glChip = o => chip({ gloss: o.en, ...o });
const glPron = p => glChip({ k: 'pron', w: p[0], f: p[1], per: GL_FORM[p[1]][0], num: GL_FORM[p[1]][1], g: p[2], en: p[3], you: !!p[4] });
const glPronW = w => glPron(GL_PRON.find(p => p[0] === w));
const glDetW = w => { const d = GL_DET.find(x => x[0] === w); return glChip({ k: 'det', w, fam: d[1], cls: d[2], en: d[3] }); };
const glNoun = (n, num) => glChip({ k: 'noun', w: glNW(n, num), e: n, g: n[2], num, cat: n[3], mass: n[6] || 0, en: num === 'p' ? n[5] : n[4] });
const glAdj = (a, w) => glChip({ k: 'adj', w, e: a, en: a[4], pos: a[6] });
const glVerb = (v, f) => glChip({ k: 'verb', w: v[1][f], e: v, f, type: v[2], gloss: 'to ' + v[5] });
const glVerbEncl = (v, f) => glChip({ k: 'verb', w: v[9] ? v[9][f] : glEnclitic(v[1][f], GL_REFL[f]), e: v, f, type: v[2], encl: 1, gloss: 'to ' + v[5] });
// gustar: num = what you like (s: gusta, p: gustan); who = the person who likes it (0-5) when the pronoun is joined on
const glGustar = (num, who = -1) => { const v = GL_VERB.find(x => x[0] === 'gustar'), base = num === 'p' ? 'gustan' : 'gusta';
  return glChip({ k: 'verb', w: who < 0 ? base : glEnclitic(base, GL_IOBJ[who]), e: v, f: num === 'p' ? 5 : 2, gnum: num, who, encl: who >= 0 ? 1 : 0, type: 'gustar', gloss: 'to like (to please)' }); };
const glGerC = v => glChip({ k: 'verb', w: glGer(v[0]), e: v, f: -1, ger: 1, type: v[2], gloss: glIng(v[5]) });
const glInfC = v => glChip({ k: 'verb', w: glBase(v[0]), e: v, f: -1, inf: 1, type: v[2], gloss: 'to ' + v[5] });
const glRefl = w => glChip({ k: 'refl', w, en: { che: 'to you', lle: 'to him / her', lles: 'to them' }[w] || 'oneself / to me…' });
const glPrep = w => glChip({ k: 'prep', w, en: GL_PREP.find(p => p[0] === w)[1] });
const glConj = w => glChip({ k: 'conj', w, en: GL_CONJ.find(c => c[0] === w)[1] });
const glAdv = w => { const a = GL_ADV.find(x => x[0] === w); return glChip({ k: 'adv', w, en: a[1], pos: a[2] }); };
const glNeg = w => glChip({ k: 'neg', w, en: w === 'nunca' ? 'never' : 'not' });
const glMoi = () => glChip({ k: 'int', w: 'moi', en: 'very', pos: 'a' });

/* ---------------- Galician checker ---------------- */
function glCheck(T) {
  let i = 0;
  const err = (msg, at = i) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length }), peek = (o = 0) => T[i + o], isErr = x => x && x.ok === false;
  if (!T.length) return err('Tap some words to build a sentence.');
  const gName = g => g === 'f' ? 'feminine' : 'masculine', nName = n => n === 'p' ? 'plural' : 'singular';
  const join = (...ws) => ws.filter(Boolean).join(' ');
  const npText = np => np.coord ? np.coord.map(npText).join(' e ') : join(np.det?.w, np.poss?.w, np.pre?.w, np.n.w, np.tres ? 'moi' : '', np.post?.w);
  const V = name => GL_VERB.find(v => v[0] === name)[1];
  const ser = f => V('ser')[f], estar = f => V('estar')[f], ter = f => V('ter')[f];
  // a noun phrase: (article) (possessive) (bo / malo) noun ((moi) adjective) (de / do / da + noun)
  // opt.art: the article is already inside a contraction like "na" (en + a); opt.p is that contraction
  function NP(role, opt = {}) {
    const start = i; let det = null, poss = null, pre = null, post = null, tres = false, of = null;
    if (peek()?.k === 'det') {
      const d = T[i++];
      if (opt.art && d.cls === 'art') return err(`“${opt.p.w}” already has the article in it (${GL_CONTR[opt.p.w].join(' + ')}), so don’t add “${d.w}”.`, i - 1);
      if (d.cls === 'poss') poss = d; else det = d;
      if (peek()?.k === 'det') {
        const d2 = T[i];
        if (det && det.fam === 'o' && d2.cls === 'poss') { poss = d2; i++; }
        else return err(det?.cls === 'poss' || d2.cls === 'poss' ? `The article goes first, then the possessive: “o meu libro”, “a miña casa”.` : 'One determiner is enough here.', i);
      }
    }
    if (peek()?.k === 'int') return err('“moi” (very) goes before a describing word that comes after the noun: “unha casa moi grande”.');
    if (peek()?.k === 'adj') {
      const a = peek();
      if (a.pos !== 'pre') { const n = T.slice(i, i + 3).find(t => t.k === 'noun'); return err(`“${a.e[0]}” goes after the noun in Galician${n ? `: “${join(det?.w, poss?.w, n.w, a.w)}”` : ''}. Only a few words like bo and malo can go before it.`); }
      pre = a; i++;
    }
    const n = peek();
    if (!n || n.k !== 'noun') return err(det || poss ? `“${(poss || det).w}” comes before a noun, so a noun has to follow it.` : role === 'subj' ? 'Start with who does it: a pronoun like “eu” or “ela”, or a noun like “o gato”.' : 'A noun (a person, place or thing) should go here.', det || poss ? i - 1 : i);
    i++;
    if (n.cat === 'feel') return err(`“${n.w}” is a feeling. Galician says it with ter and no article: “teño ${n.w}”.`, start);
    const art = det?.cls === 'art' && det.fam === 'o' ? det.w : opt.art || null;
    if (!det && !poss && !opt.art) {
      if (role === 'subj') return err(`Galician needs a word like “${glWant('o', n.g, n.num)}” or “${glWant('un', n.g, n.num)}” before “${n.w}” here.`, start);
      if (!(n.mass || n.num === 'p' || opt.bare)) return err(`“${n.w}” needs a word like “${glWant('un', n.g, n.num)}” (a) or “${glWant('o', n.g, n.num)}” (the) before it.`, start);
    }
    if (opt.art && opt.art !== glWant('o', n.g, n.num)) { const c = glContr(GL_CONTR[opt.p.w][0], glWant('o', n.g, n.num)); return err(`“${n.w}” is ${gName(n.g)} ${nName(n.num)}, so use “${c}”: “${join(c, poss?.w, n.w)}”.`, start - 1); }
    if (det) {
      if (det.cls === 'num' && n.num === 's') return err(`“${det.w}” means more than one, so the noun must be plural${n.e[1] ? `: “${glWant(det.fam, n.g, 'p')} ${glNW(n.e, 'p')}”` : ''}.`, start);
      if (det.fam === 'un' && n.mass === 1) return err(`You can’t count “${n.w}”. Say just “${n.w}”, or “${glWant('o', n.g, 's')} ${n.w}” (the).`, start);
      const want = glWant(det.fam, n.g, n.num);
      if (det.w !== want) return err(`“${n.w}” is ${gName(n.g)} ${nName(n.num)}, so use “${want}”: “${join(want, poss && glWant(poss.fam, n.g, n.num), pre && pre.e[glIdx(n.g, n.num)], n.w)}”.`, start);
    }
    if (poss) {
      const want = glWant(poss.fam, n.g, n.num);
      if (poss.w !== want) return err(`“${n.w}” is ${gName(n.g)} ${nName(n.num)}, so use “${want}”: “${join(det && det.w, want, n.w)}”.`, det ? start + 1 : start);
      if (!art && role !== 'pred') return err(`In Galician, “${poss.w}” comes with the article first: “${join(glWant('o', n.g, n.num), poss.w, n.w)}”.`, start);
    }
    if (pre) { const w = pre.e[glIdx(n.g, n.num)]; if (pre.w !== w) return err(`“${pre.w}” has to match “${n.w}” (${gName(n.g)} ${nName(n.num)}): use “${w}”.`, i - 2); }
    if ((peek()?.k === 'int' && peek(1)?.k === 'adj') || peek()?.k === 'adj') {
      const at = i; let t2 = false; if (peek().k === 'int') { t2 = true; i++; }
      const a = T[i];
      if (pre) return err('Use one describing word per noun here.', at);
      const w = a.e[glIdx(n.g, n.num)]; if (a.w !== w) return err(`“${a.w}” has to match “${n.w}” (${gName(n.g)} ${nName(n.num)}): use “${w}”.`, i);
      post = a; tres = t2; i++;
      if (peek()?.k === 'adj') return err('Use one describing word per noun here.');
    }
    if (peek()?.k === 'adv' && peek().w === 'moito' && peek(1)?.k === 'adj') return err('Before a describing word, Galician says “moi” (very): “moi grande”. “moito” means “a lot” and goes after a verb.');
    // de + noun: "o libro do neno", "a casa da miña nai"
    if (role !== 'of' && peek()?.k === 'prep' && ['de', 'do', 'da', 'dos', 'das'].includes(peek().w) && ['det', 'noun', 'adj'].includes(peek(1)?.k)) {
      const p = T[i++];
      if (p.w === 'de' && peek()?.k === 'det' && peek().fam === 'o') return err(`Galician joins “de” + “${peek().w}” into “${glContr('de', peek().w)}”: “${glContr('de', peek().w)} ${peek(1)?.w || '…'}”.`, i - 1);
      const o = NP('of', p.w === 'de' ? { bare: true } : { art: GL_CONTR[p.w][1], p }); if (isErr(o)) return o;
      of = { ...o, p };
    }
    return { det, poss, n, pre, post, tres, of, art, num: n.num, g: n.g, cat: n.cat };
  }
  function NPs(role, opt) {
    const a = NP(role, opt); if (isErr(a)) return a;
    const c = peek();
    if (c?.k === 'conj' && (c.w === 'e' || c.w === 'ou') && ['det', 'noun', 'pron'].includes(peek(1)?.k)) {
      const save = i; i++;
      if (peek().k === 'pron') { if (role === 'subj') return err('Join two nouns here: “o can e o gato”. (To add a person, start a new sentence part.)', i); i = save; return a; }
      const b = NP(role, opt);
      if (isErr(b) || (role !== 'subj' && ['verb', 'neg', 'pron', 'refl'].includes(peek()?.k))) { i = save; return a; }
      return { coord: [a, b], conj: c, num: 'p', g: a.g === 'm' || b.g === 'm' ? 'm' : 'f', per: 3, cat: a.cat };
    }
    return a;
  }
  // a / ao / á / en / no / na / con / co / coa / para + a noun phrase
  function PP(p, role) {
    const C = GL_CONTR[p.w];
    if (C) { if (peek()?.k === 'det' && peek().cls === 'art') return err(`“${p.w}” already has the article in it (${C.join(' + ')}), so don’t add “${peek().w}”.`); return NP(role, { art: C[1], p }); }
    if (['de', 'en', 'a', 'con'].includes(p.w) && peek()?.k === 'det' && peek().fam === 'o') { const c = glContr(p.w, peek().w); return err(`Galician joins “${p.w}” + “${peek().w}” into “${c}”: “${c} ${peek(1)?.w || '…'}”.`, i - 1); }
    // en casa / a casa / para casa: at home, home
    if (['en', 'para', 'a'].includes(p.w) && peek()?.k === 'noun' && peek().e[0] === 'casa' && peek().num === 's' && peek(1)?.k !== 'adj' && !(peek(1)?.k === 'prep' && /^d/.test(peek(1).w))) { const n = T[i++]; return { n, home: true, num: 's', g: 'f', cat: 'place' }; }
    return NP(role, { bare: p.w === 'con' });
  }
  function clause() {
    const C = { lead: [], subj: null, neg: null, pre: [], refl: null, verb: null, v2: null, comp: null, pps: [], tail: [] }, cStart = i;
    while (peek()?.k === 'adv' && /[ep]/.test(peek().pos)) C.lead.push(T[i++]);
    if (peek()?.k === 'adv' || peek()?.k === 'int') return err(peek().k === 'int' ? '“moi” (very) goes right before a describing word: “moi grande”.' : `“${peek().w}” goes ${glWhere(peek())}, not at the start.`);
    if (peek()?.k === 'conj') return err(`“${peek().w}” joins two parts, so it can’t ${i === 0 ? 'start the sentence' : 'go here'}.`);
    if (peek()?.k === 'pron') { const p = T[i++]; C.subj = { pron: p, f: p.f, num: p.num, g: p.g }; }
    else if (['det', 'noun', 'adj', 'int'].includes(peek()?.k)) { const s = NPs('subj'); if (isErr(s)) return s; C.subj = s.coord ? { np: s, f: 5, num: 'p', g: s.g } : { np: s, f: s.num === 'p' ? 5 : 2, num: s.num, g: s.g }; }
    if (peek()?.k === 'pron') return err('A sentence has only one subject (who does it).');
    while (C.subj && peek()?.k === 'adv' && peek().pos.includes('p')) C.pre.push(T[i++]);
    if (peek()?.k === 'adv' && C.subj) return err(`“${peek().w}” goes ${glWhere(peek())}.`);
    if (peek()?.k === 'neg') {
      C.neg = T[i++];
      if (peek()?.k === 'neg') return err('Use “non” or “nunca” before the verb, not both.', i);
      if (peek()?.k === 'adv') return err(`“${peek().w}” goes before “${C.neg.w}”, or ${glWhere(peek()).replace('right before the verb or ', '')}.`, i);
      if (!['verb', 'refl'].includes(peek()?.k)) return err(`“${C.neg.w}” goes right before the verb: “eu ${C.neg.w} como”.`, i - 1);
    }
    if (peek()?.k === 'refl') {
      const at = i; C.refl = T[i++];
      if (peek()?.k === 'neg') return err(`“${peek().w}” goes before “${C.refl.w}”: “${peek().w} ${C.refl.w} levanto”.`, i);
      if (peek()?.k !== 'verb') return err(`“${C.refl.w}” goes right next to a verb, like “non ${C.refl.w} levanto”.`, at);
    }
    const v = peek(), sText = C.subj ? (C.subj.pron ? C.subj.pron.w : npText(C.subj.np)) : '';
    if (!v) return err(C.subj ? 'Now add a verb (an action word like “come” or “é”).' : 'Every sentence needs a verb.');
    if (v.k !== 'verb') {
      if (v.k === 'adv' || v.k === 'int') return err(v.k === 'int' ? '“moi” (very) goes right before a describing word.' : `“${v.w}” goes ${glWhere(v)}.`);
      return err(`After ${C.subj ? `“${sText}”` : 'that'} the next word should be a verb. “${v.w}” isn’t a verb.`);
    }
    i++; C.verb = v;
    const sf = C.subj ? C.subj.f : 0, attract = C.neg || C.pre.find(a => GL_ATTRACT.includes(a.w)) || C.lead.find(a => GL_ATTRACT.includes(a.w));
    if (v.ger) return err(`“${v.w}” is the -ing form. It needs estar before it: “${estar(sf)} ${v.w}”.`, i - 1);
    if (v.inf) return err(`“${v.w}” is the to-form. Use the form that matches the subject: “${v.e[1][sf]}”.`, i - 1);
    /* gustar: "gústame o café", "non me gustan os gatos" */
    if (v.type === 'gustar') {
      if (C.subj) return err(`Galician says this the other way round: what you like comes after the verb, and the person is joined to it. “Gústame o café” (I like coffee), “Gústalle o café” (he / she likes coffee).`, cStart);
      const who = v.encl ? v.who : C.refl ? GL_IOBJ.indexOf(C.refl.w) : -1;
      if (C.refl && who < 0) return err(`With gustar, use me, che, lle, nos, vos or lles: “non ${C.refl.w === 'te' ? 'che' : C.refl.w === 'se' ? 'lle' : 'me'} ${v.w}”.`, i - 2);
      if (who < 0) return err(`“${v.w}” needs who likes it: “${glEnclitic(v.w, 'me')}” (I like), “${glEnclitic(v.w, 'lle')}” (he / she likes), or “non me ${v.w}”.`, i - 1);
      if (attract && v.encl) return err(`After “${attract.w}”, the person goes before the verb: “${attract.w} ${GL_IOBJ[who]} ${v.gnum === 'p' ? 'gustan' : 'gusta'}”.`, i - 1);
      if (!attract && C.refl) return err(`Here “${C.refl.w}” goes after the verb, joined to it: “${glEnclitic(v.w, C.refl.w)}”.`, i - 2);
      const nx = peek();
      if (!nx || !['det', 'noun', 'adj'].includes(nx.k)) return err(`Now say what is liked: “${v.w} o café”, “${v.gnum === 'p' ? v.w + ' os gatos' : v.w + ' a praia'}”.`, i - 1);
      const np = NPs('subj'); if (isErr(np)) return np;
      if ((np.coord ? 'p' : np.num) !== v.gnum) { const w2 = glGustar(np.coord ? 'p' : np.num, v.encl ? who : -1).w; return err(`${np.coord || np.num === 'p' ? 'More than one thing is liked' : 'One thing is liked'}, so use “${w2}”: “${join(C.neg?.w, v.encl ? '' : GL_IOBJ[who], w2, npText(np))}”.`, i - 1 - (np.coord ? 0 : 0)); }
      C.comp = { liked: np }; C.who = who;
      while ((peek()?.k === 'adv' && /[ez]/.test(peek().pos) && peek().w !== 'moito')) C.tail.push(T[i++]);
      return C;
    }
    // me / te / se / nos / vos
    const R = v.e[8], want = GL_REFL[v.f], formFor = f => v.e[1][f];
    if (!R && (C.refl || v.encl)) return err(`“${C.refl ? C.refl.w : 'that ending'}” only goes with verbs like levantarse. Take it out: just “${v.e[1][v.f]}”.`, C.refl ? i - 2 : i - 1);
    if (R) {
      const encl = f => v.e[9] ? v.e[9][f] : glEnclitic(v.e[1][f], GL_REFL[f]);
      const good = attract ? `${want} ${formFor(v.f)}` : encl(v.f);
      if (!C.refl && !v.encl) return err(`“${v.e[0]}” needs “${want}” with it: “${attract ? attract.w + ' ' : ''}${good}”.`, i - 1);
      if (C.refl && GL_IOBJ.includes(C.refl.w) && !GL_REFL.includes(C.refl.w)) return err(`“${C.refl.w}” is for gustar (to you, to him). With ${v.e[0]}, use “${want}”.`, i - 2);
      if (C.refl && C.refl.w !== want && !(C.subj && GL_REFL[C.subj.f] === C.refl.w)) return err(`“${C.refl.w}” doesn’t match “${v.w}”. Use “${good}”.`, i - 2);
      if (v.encl && attract) return err(`After “${attract.w}”, “${want}” goes before the verb: “${attract.w} ${want} ${formFor(v.f)}”.`, i - 1);
      if (C.refl && !attract) return err(`In Galician, “${C.refl.w}” goes after the verb, joined to it: “${encl(C.subj ? C.subj.f : v.f)}”. (It goes before the verb only after words like non, nunca, sempre and tamén.)`, i - 2);
    }
    // the verb agrees with the subject; ser has "son" for both eu and eles
    if (C.subj && formFor(C.subj.f) !== formFor(v.f)) return err(`“${v.w}” doesn’t match the subject “${sText}”. Use “${v.encl ? (v.e[9] ? v.e[9][C.subj.f] : glEnclitic(v.e[1][C.subj.f], GL_REFL[C.subj.f])) : formFor(C.subj.f)}”.`, i - 1);
    if (C.subj && C.refl && C.refl.w !== GL_REFL[C.subj.f]) return err(`“${C.refl.w}” doesn’t match the subject “${sText}”. Use “${GL_REFL[C.subj.f]}”.`, i - 2);
    const vf = C.subj ? C.subj.f : v.f;
    // estar + -ndo ("estou comendo") or estar a + the to-form ("estou a comer")
    let W = v;
    if (v.type === 'estar' && ((peek()?.k === 'verb' && peek().ger) || (peek()?.k === 'prep' && peek().w === 'a' && peek(1)?.k === 'verb' && peek(1).inf))) {
      if (peek().k === 'prep') C.progA = T[i++];
      C.v2 = W = T[i++];
      if (W.e[8] || ['ser', 'estar', 'ir', 'ter', 'gustar'].includes(W.type)) return err(`Keep it simple: say “${W.e[1][vf]}” without estar.`, i - 1);
    } else if (v.type === 'estar' && peek()?.k === 'verb' && peek().inf) return err(`For “is …ing”, say “${v.w} a ${peek().w}” or “${v.w} ${glGer(peek().e[0])}”.`, i);
    else if (peek()?.k === 'verb' && peek().ger) return err(`The -ing form goes with estar: “${estar(vf)} ${peek().w}”.`, i);
    if (C.subj?.np && !['ser', 'estar'].includes(W.type)) for (const part of C.subj.np.coord || [C.subj.np]) {
      const c = part.cat, what = part.num === 'p' ? part.n.en : 'a ' + part.n.en;
      if (c !== 'person' && c !== 'animal') return err(`That doesn’t make sense: ${what} can’t ${W.e[5]}. Use a person or an animal here.`, cStart);
      if (c === 'animal' && W.e[7] === 'p') return err(`That doesn’t make sense: ${what} can’t ${W.e[5]}. Only people ${W.e[5]}.`, cStart);
    }
    const afterVerb = () => { while (peek()?.k === 'adv' && peek().pos.includes('v') && !(peek().w === 'moito' && peek(1)?.k === 'adj')) C.tail.push(T[i++]); };
    afterVerb();
    const nx = peek(), sNum = C.subj ? C.subj.num : GL_FORM[v.f][1], sG = C.subj ? C.subj.g : 'x';
    const adjComp = (verbName) => {
      let tres = false; if (peek()?.k === 'int') { tres = true; i++; }
      else if (peek()?.k === 'adv' && peek().w === 'moito') return err('Before a describing word, Galician says “moi” (very): “é moi grande”.');
      const a = T[i], m = a.e[glIdx('m', sNum)], f = a.e[glIdx('f', sNum)];
      if (verbName === 'estar' && a.e[7] === 'ser') return err(`“${a.e[0]}” says what someone or something is like, so Galician uses ser: “${ser(vf)} ${a.w}”.`, i);
      if (verbName === 'ser' && a.e[7] === 'estar') return err(`“${a.e[0]}” says how someone is right now, so Galician uses estar: “${estar(vf)} ${a.w}”.`, i);
      if (sG === 'x' ? ![m, f].includes(a.w) : a.w !== a.e[glIdx(sG, sNum)]) return err(`“${a.w}” has to match the subject (${sG === 'x' ? '' : gName(sG) + ' '}${nName(sNum)}): use “${sG === 'f' ? f : m}”${sG === 'x' && f !== m ? ` or “${f}”` : ''}.`, i);
      i++; C.comp = { adj: a, tres }; return null;
    };
    const isAdjNext = () => nx.k === 'adj' || (nx.k === 'int' && peek(1)?.k === 'adj') || (nx.k === 'adv' && nx.w === 'moito' && peek(1)?.k === 'adj');
    if (W.type === 'ser') {
      if (!nx || nx.k === 'conj') return err(`“${v.w}” needs something after it: a describing word (“${v.w} ${sNum === 'p' ? 'simpáticos' : 'simpático'}”) or who someone is (“${v.w} profesor”).`, i - 1);
      if (isAdjNext()) { const e = adjComp('ser'); if (e) return e; }
      else if (nx.k === 'noun' && nx.cat === 'feel') return err(`Galician says this with ter: “${ter(vf)} ${nx.w}”.`);
      else if (['det', 'noun'].includes(nx.k)) {
        const np = NP('pred', { bare: true }); if (isErr(np)) return np;
        if (!np.det && !np.poss && np.cat !== 'person') return err(`Add a word like “${glWant('un', np.g, np.num)}” before “${np.n.w}”.`, i - 1);
        if (np.num !== sNum && !C.subj?.np?.coord) return err(`“${np.n.w}” has to match the subject (${nName(sNum)}).`, i - 1);
        C.comp = { np };
      } else if (nx.k === 'prep' && /^(en|no|na|nos|nas)$/.test(nx.w)) return err(`For where someone or something is, Galician uses estar: “${estar(vf)} ${nx.w} …”.`);
      else return err(`After “${v.w}”, put a describing word (“${v.w} ${sNum === 'p' ? 'grandes' : 'grande'}”) or a noun (“${v.w} profesor”).`);
    } else if (W.type === 'estar') {
      if (!nx || nx.k === 'conj') return err(`“${v.w}” needs something after it: how someone is (“${v.w} ${sNum === 'p' ? 'cansos' : 'canso'}”) or where (“${v.w} na casa”).`, i - 1);
      if (isAdjNext()) { const e = adjComp('estar'); if (e) return e; }
      else if (nx.k === 'prep' && nx.w === 'con' && peek(1)?.k === 'noun' && peek(1).cat === 'feel') return err(`Galician says this with ter: “${ter(vf)} ${peek(1).w}”.`);
      else if (nx.k === 'noun' && nx.cat === 'feel') return err(`Galician says “${ter(vf)} ${nx.w}”, with ter.`);
      else if (['det', 'noun'].includes(nx.k)) return err(`After “${v.w}”, put how someone is (“${sNum === 'p' ? 'contentos' : 'contento'}”) or where (“na escola”, “en casa”). For who or what something is, use ser.`);
      else if (!(nx.k === 'prep' && /^(en|no|na|nos|nas)$/.test(nx.w)) && !(nx.k === 'adv' && nx.w === 'aquí')) return err(`After “${v.w}”, put how someone is or where (“en casa”, “na cociña”).`);
    } else if (W.type === 'ter') {
      if (nx?.k === 'noun' && nx.cat === 'feel') { i++; C.comp = { feel: nx }; }
      else if (nx?.k === 'det' && peek(1)?.k === 'noun' && peek(1).cat === 'feel') return err(`No article here: Galician says “${v.w} ${peek(1).w}”.`);
      else if (nx && ['det', 'noun', 'adj', 'int'].includes(nx.k)) { const np = NPs('obj'); if (isErr(np)) return np; C.comp = { np }; }
      else return err(`“${v.w}” needs something after it: “${v.w} un gato”, “${v.w} fame”.`, i - 1);
    } else if (W.type === 'ir') {
      if (!nx || nx.k !== 'prep' || !['a', 'ao', 'á', 'aos', 'ás', 'para'].includes(nx.w)) return err(nx?.k === 'prep' && /^(en|no|na|nos|nas)$/.test(nx.w) ? `With ir, use “a” or “para” for where you go: “${v.w} á praia”, “${v.w} para a escola”.` : `“${v.w}” (go) needs where you go: “${v.w} á praia” or “${v.w} ao parque”.`, nx ? i : i - 1);
      i++; const np = PP(nx, 'dest'); if (isErr(np)) return np;
      if (np.cat !== 'place') return err(`ir needs a place: “${v.w} á praia”. “${np.n.w}” isn’t a place.`, i - 1);
      C.comp = { dest: np, p: nx };
    } else if (W.type === 'tr') {
      if (nx?.k === 'prep' && ['a', 'ao', 'á', 'aos', 'ás'].includes(nx.w) && ['det', 'noun'].includes(peek(1)?.k)) {
        const n2 = T.slice(i + 1, i + 4).find(t => t.k === 'noun');
        if (n2 && ['person', 'animal'].includes(n2.cat)) return err(`Galician doesn’t put “a” before the person or animal you ${W.e[5]}: “${W.w} ${glWant('o', n2.g, n2.num)} ${n2.w}”.`, i);
      }
      if (nx?.k === 'prep' && ['ao', 'á', 'aos', 'ás'].includes(nx.w) && peek(1)?.k === 'noun' && ['person', 'animal'].includes(peek(1).cat)) return err(`Galician doesn’t put “a” before the person or animal you ${W.e[5]}: “${W.w} ${GL_CONTR[nx.w][1]} ${peek(1).w}”.`, i);
      if (nx && ['det', 'noun', 'adj', 'int'].includes(nx.k)) {
        const np = NPs('obj'); if (isErr(np)) return np;
        for (const p of np.coord || [np]) if (W.e[3][0] === 'open' ? !GL_OPENABLE.includes(p.n.e[0]) : W.e[3][0] !== '*' && !W.e[3].includes(p.cat)) return err(`That doesn’t make sense: you can’t ${W.e[5]} ${p.num === 'p' || p.n.mass ? p.n.en : 'a ' + p.n.en}. “${W.e[0]}” goes with ${W.e[3].map(c => GL_KIND[c]).join(', ')}.`);
        C.comp = { np };
      } else if (W.e[4]) return err(`“${W.w}” needs something after it. What do you ${W.e[5]}? For example “${W.w} ${{ food: 'unha mazá', drink: 'auga', read: 'un libro', thing: 'unha pelota', place: 'a cidade', animal: 'un gato', person: 'a miña amiga', open: 'a porta', '*': 'un libro' }[W.e[3][0]]}”.`, i - 1);
    } else if (nx && ['det', 'noun', 'adj'].includes(nx.k)) return err(`“${W.e[0]}” (to ${W.e[5]}) doesn’t take an object. You can add a place: “${W.w} no parque”, or a person: “${W.w} coa miña amiga”.`);
    afterVerb();
    // en / no / na + a place, con / co / coa + someone, para + someone or a place
    while (peek()?.k === 'prep') {
      const p = T[i++];
      if (['de', 'do', 'da', 'dos', 'das'].includes(p.w)) return err('“de” joins two nouns: “o libro do neno”. It needs a noun right before it.', i - 1);
      const toward = ['a', 'ao', 'á', 'aos', 'ás'].includes(p.w);
      if (W.type === 'ir' && (toward || p.w === 'para') && !(p.w === 'para' && ['det', 'noun'].includes(peek()?.k) && T.slice(i, i + 3).find(t => t.k === 'noun')?.cat === 'person')) return err('Say where you go only once.', i - 1);
      if (toward && W.type !== 'ir') return err(`“${p.w}” is for where you go (with ir). For where something happens, use “en”: “no parque”, “na escola”.`, i - 1);
      const np = PP(p, 'pp'); if (isErr(np)) return np;
      if (/^(en|no|na|nos|nas)$/.test(p.w) && np.cat !== 'place' && !(np.n && GL_RIDE.includes(np.n.e[0]))) return err(`“${p.w}” + a place: “na cociña”, “no parque”. “${np.n.w}” isn’t a place.`, i - 1);
      C.pps.push({ p, np });
    }
    while (peek()?.k === 'adv' && /[ez]/.test(peek().pos)) {
      if (peek().w === 'moito' && !GL_HOW_VERBS.test(W.e[0]) && !['tr', 'in'].includes(W.type)) break;
      C.tail.push(T[i++]);
    }
    { const advs = [...C.lead, ...C.pre, ...C.tail].map(a => a.w), twice = advs.find((w, k) => advs.indexOf(w) !== k); if (twice) return err(`“${twice}” is in the sentence twice. Once is enough.`, i - 1); }
    if (W.type === 'estar' && !C.v2 && !C.comp && !C.pps.length && !C.tail.some(a => a.w === 'aquí')) return err(`“${v.w}” needs something after it: how someone is (“contento”) or where (“en casa”).`, i - 1);
    return C;
  }
  const P = { clauses: [], conjs: [] };
  for (;;) {
    const c = clause(); if (isErr(c)) return c; P.clauses.push(c);
    if (peek()?.k === 'conj') { const cj = T[i++]; if (!peek()) return err(`“${cj.w}” joins two parts, so something has to come after it.`, i - 1); P.conjs.push(cj); continue; }
    break;
  }
  if (i < T.length) {
    const x = T[i];
    return err(x.k === 'adj' ? `“${x.w}” needs to go next to the noun it describes.` : x.k === 'det' ? `“${x.w}” needs its noun right after it, in the right place.` : x.k === 'verb' ? 'One verb per sentence part. Use “e” or “pero” to add another.'
      : x.k === 'pron' ? 'The subject (who does it) goes at the start. To add another sentence, use “e” first.' : x.k === 'neg' ? `“${x.w}” goes right before the verb.` : x.k === 'refl' ? `“${x.w}” goes right next to the verb.`
      : x.k === 'int' ? '“moi” (very) goes right before a describing word.' : x.k === 'adv' ? `“${x.w}” goes ${glWhere(x)}.` : x.k === 'prep' ? `“${x.w}” needs a noun after it, in the right place.` : `“${x.w}” doesn’t fit here.`);
  }
  return { ok: true, P };
}

/* English meaning of a correct Galician sentence */
function glEnglish(P) {
  const an = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
  const npEn = (np, general) => {
    if (np.coord) return np.coord.map(x => npEn(x, general)).join(np.conj?.w === 'ou' ? ' or ' : ' and ');
    if (np.home) return 'home';
    const a = np.pre || np.post, adj = a ? (np.tres ? 'very ' : '') + a.e[4] + ' ' : '', noun = np.n.en;
    let art = '';
    if (np.poss) art = np.poss.en + ' ';
    else if (np.det) art = np.det.fam === 'o' ? (general && (np.num === 'p' || np.n.mass) && !np.of ? '' : 'the ') : np.det.fam === 'un' ? (np.num === 'p' ? 'some ' : an(adj || noun) + ' ') : np.det.en + ' ';
    else if (np.art) art = 'the ';
    const base = art + adj + noun;
    if (np.of) { const o = np.of; return ['person', 'animal'].includes(o.n.cat) && (o.det || o.poss || o.art) ? `${npEn(o)}'s ${adj}${noun}` : `${base} of ${npEn(o)}`; }
    return base;
  };
  const one = C => {
    const v = C.verb, V = C.v2 || v, f = C.subj ? C.subj.f : v.f, youS = C.subj?.pron?.you;
    const never = C.neg?.w === 'nunca';
    if (v.type === 'gustar') {
      const who = C.who, third = who === 2, s = GL_IOBJ_EN[who];
      const tl = [...C.lead.map(a => a.w === 'tamén' ? '' : a.en), ...C.tail.map(a => a.w === 'tamén' ? '' : a.en)].filter(Boolean).join(' '), too = [...C.lead, ...C.tail].some(a => a.w === 'tamén');
      const always = [...C.lead, ...C.tail].filter(a => a.w === 'sempre' || a.w === 'moitas veces').map(a => a.en);
      const tl2 = [...C.lead, ...C.tail].filter(a => !['sempre', 'moitas veces', 'tamén'].includes(a.w)).map(a => a.en).join(' ');
      const vp = never ? `never ${third ? 'likes' : 'like'}` : C.neg ? `${third ? 'does' : 'do'} not like` : `${always.length ? always.join(' ') + ' ' : ''}${third ? 'likes' : 'like'}`;
      return `${s} ${vp} ${npEn(C.comp.liked, true)}${tl2 ? ' ' + tl2 : ''}${too ? ' too' : ''}`.replace(/\s+/g, ' ').trim() || tl;
    }
    const subj = C.subj ? (C.subj.pron ? C.subj.pron.en : npEn(C.subj.np)) : ['I', 'you', 'he/she', 'we', 'you', 'they'][f];
    const third = !youS && (f === 2 || (C.subj?.np && C.subj.num === 's'));
    const be = f === 0 ? 'am' : third ? 'is' : 'are';
    const all = [...C.pre, ...C.tail], freq = all.filter(a => ['sempre', 'moitas veces'].includes(a.w)).map(a => a.en).join(' ');
    const endAdv = C.tail.filter(a => ['ben', 'moito', 'aquí'].includes(a.w)).map(a => a.en), too = [...C.lead, ...all].some(a => a.w === 'tamén');
    let vp;
    if (C.v2) {
      vp = `${be}${never ? ' never' : C.neg ? ' not' : ''}${freq ? ' ' + freq : ''} ${glIng(V.e[5])}`;
      if (C.comp?.np) vp += ' ' + npEn(C.comp.np);
    } else if (v.type === 'ser' || v.type === 'estar' || C.comp?.feel) {
      const what = C.comp?.adj ? (C.comp.tres ? 'very ' : '') + C.comp.adj.e[4] : C.comp?.feel ? C.comp.feel.e[4] : C.comp?.np ? npEn(C.comp.np.det || C.comp.np.poss ? C.comp.np : { ...C.comp.np, det: { fam: 'un' } }) : '';
      vp = `${be}${never ? ' never' : C.neg ? ' not' : ''}${freq ? ' ' + freq : ''} ${what}`;
    } else {
      const base = v.e[5], s3 = v.e[6];
      vp = never ? `never ${third ? s3 : base}` : C.neg ? `${third ? 'does' : 'do'} not${freq ? ' ' + freq : ''} ${base}` : `${freq ? freq + ' ' : ''}${third ? s3 : base}`;
      if (C.comp?.np) vp += ' ' + npEn(C.comp.np);
      if (C.comp?.dest) vp += (C.comp.dest.home ? ' ' : ' to ') + npEn(C.comp.dest);
    }
    if (endAdv.length) vp += ' ' + endAdv.join(' ');
    for (const { p, np } of C.pps) vp += np.home ? (p.w === 'para' || p.w === 'a' ? ' home' : ' at home') : ` ${/^(no|na|nos|nas|en)$/.test(p.w) ? (np.n && GL_RIDE.includes(np.n.e[0]) ? 'on' : np.cat === 'place' && ['praia', 'escola', 'igrexa', 'mercado'].includes(np.n.e[0]) ? 'at' : 'in') : /^(con|co|coa|cos|coas)$/.test(p.w) ? 'with' : p.w === 'para' ? 'for' : 'to'} ${npEn(np)}`;
    const tail = [...C.lead.filter(a => !['sempre', 'moitas veces', 'tamén'].includes(a.w)).map(a => a.en), ...C.tail.filter(a => ['hoxe', 'mañá', 'agora'].includes(a.w)).map(a => a.en), too ? 'too' : ''].filter(Boolean).join(' ');
    const lf = C.lead.filter(a => a.w === 'sempre' || a.w === 'moitas veces').map(a => a.en).join(' ');
    if (lf && !freq) vp = C.v2 || v.type === 'ser' || v.type === 'estar' || C.comp?.feel ? vp.replace(/^(am|is|are)/, `$1 ${lf}`) : `${lf} ${vp}`;
    return `${subj} ${vp}${tail ? ' ' + tail : ''}`.replace(/\s+/g, ' ').trim();
  };
  let s = one(P.clauses[0]);
  P.conjs.forEach((c, k) => { s += (c.w === 'e' ? ', and ' : c.w === 'pero' ? ', but ' : ', or ') + one(P.clauses[k + 1]); });
  return s[0].toUpperCase() + s.slice(1) + '.';
}

/* ---------------- making a Galician tray ---------------- */
function glGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = list => { const fav = list.filter(x => pref.has(x[0]) || (typeof x[1] === 'string' && pref.has(x[1]))); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const nounOf = cats => RP(GL_NOUN.filter(n => n[3] !== 'feel' && (cats[0] === '*' || cats.includes(n[3]) || (cats[0] === 'open' && GL_OPENABLE.includes(n[0])))));
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
  const adjFor = (cat, wth) => RP(GL_ADJ.filter(a => (!cat || a[5].includes(CAT[cat] || 'p')) && (!wth || a[7] === wth || a[7] === 'both')));
  const extra = [];
  const other = list => { const x = list.filter(Boolean); return x.length ? R(x) : null; };
  const flip = (g, num) => [g === 'm' ? 'f' : 'm', num === 's' ? 'p' : 's'];
  // a noun phrase with a determiner that fits (and a look-alike as a distractor). opts.art: the article is already in a contraction
  const np = (n, num, out, opts = {}) => {
    const g = n[2], mass = n[6] === 1;
    let fam;
    if (opts.art) fam = coin(0.35) ? R(GL_POSS) : null;
    else if (opts.bare && (mass || num === 'p') && coin(0.5)) fam = null;
    else if (num === 'p') fam = R(['o', 'o', 'un', 'meu', 'seu', 'noso', 'este', 'ese', 'dous', 'tres']);
    else if (mass) fam = R(['o', 'o', 'meu', 'este']);
    else fam = R(['o', 'o', 'un', 'un', 'meu', 'teu', 'seu', 'noso', 'voso', 'este', 'ese', 'aquel']);
    if (opts.subj && !fam) fam = 'o';
    if (opts.general) fam = 'o';
    const poss = GL_POSS.includes(fam);
    const a = opts.adj !== false && coin(0.35) ? adjFor(n[3]) : null, pre = a && a[6] === 'pre' && coin(0.6), tres = a && !pre && coin(0.2);
    if (poss && !opts.art) out.push(glDetW(glWant('o', g, num)));
    if (fam) { const d = glWant(fam, g, num); out.push(glDetW(d)); const wrong = other(GL_DETF[fam].filter(x => x && x !== d)); if (wrong) extra.push(glDetW(wrong)); }
    if (pre) out.push(glAdj(a, a[glIdx(g, num)]));
    out.push(glNoun(n, num));
    if (a && !pre) { if (tres) out.push(glMoi()); out.push(glAdj(a, a[glIdx(g, num)])); }
    if (a) { const [g2, n2] = flip(g, num), w = a[glIdx(g2, n2)]; extra.push(glAdj(a, w)); }
    if (opts.of && !poss && n[3] !== 'person' && coin(0.25)) { const o = nounOf(['person']), c = glContr('de', glWant('o', o[2], 's')); out.push(glPrep(c)); np(o, 's', out, { art: true, adj: false }); extra.push(glPrep('de')); }
  };
  const inPlace = (out, n) => { if (n[0] === 'casa' && coin(0.35)) { out.push(glPrep('en'), glNoun(n, 's')); return; } out.push(glPrep(glContr('en', glWant('o', n[2], 's')))); np(n, 's', out, { art: true, adj: false }); extra.push(glPrep('en'), glDetW(glWant('o', n[2], 's'))); };
  const toPlace = (out, n) => {
    if (n[0] === 'casa' && coin(0.4)) { out.push(glPrep(R(['para', 'a'])), glNoun(n, 's')); extra.push(glPrep('en')); return; }
    if (coin(0.35)) { out.push(glPrep('para')); np(n, 's', out, { adj: false, subj: true }); }
    else { out.push(glPrep(glContr('a', glWant('o', n[2], 's')))); np(n, 's', out, { art: true, adj: false }); }
    extra.push(glPrep(glContr('en', glWant('o', n[2], 's'))));
  };
  const withSomeone = (out, n) => { const c = glContr('con', glWant('o', n[2], 's')); if (coin(0.3)) { out.push(glPrep('con'), glDetW(glWant('un', n[2], 's')), glNoun(n, 's')); } else { out.push(glPrep(c)); np(n, 's', out, { art: true, adj: false }); } extra.push(glPrep('con')); };
  const pick = name => GL_VERB.find(v => v[0] === name);
  const pronList = ['eu', 'eu', 'ti', 'ti', 'el', 'ela', 'nós', 'vós', 'eles', 'elas', 'vostede', 'vostedes'];
  const clause = () => {
    const out = [], kind = R(['tr', 'tr', 'tr', 'in', 'ser', 'estar', 'ter', 'ir', 'refl', 'gustar', 'prog']);
    if (kind === 'gustar') {
      const n = nounOf(['*']), on = n[1] && coin(0.4) ? 'p' : 's', who = Math.floor(Math.random() * 6);
      const neg = coin(0.3) ? R(['non', 'non', 'nunca']) : null, pre = !neg && coin(0.12) ? 'tamén' : null;
      if (pre) out.push(glAdv(pre));
      if (neg) out.push(glNeg(neg));
      if (neg || pre) { out.push(glRefl(GL_IOBJ[who]), glGustar(on)); extra.push(glGustar(on, who), glGustar(on === 'p' ? 's' : 'p')); }
      else { out.push(glGustar(on, who)); extra.push(glRefl(GL_IOBJ[who]), glGustar(on === 'p' ? 's' : 'p', who)); }
      np(n, on, out, { general: coin(0.7), subj: true });
      extra.push(glPronW(R(['eu', 'ti', 'el', 'ela'])));
      return out;
    }
    const verb = kind === 'ser' || kind === 'estar' || kind === 'ter' || kind === 'ir' ? pick(kind)
      : kind === 'refl' ? RP(GL_VERB.filter(v => v[8])) : kind === 'prog' ? RP(GL_VERB.filter(v => /^(comer|beber|facer|ler|escribir|comprar|buscar|falar|traballar|estudar|xogar|correr|camiñar|durmir)$/.test(v[0])))
      : RP(GL_VERB.filter(v => v[2] === kind && !v[8]));
    const subjKinds = verb[7] === 'p' ? ['person'] : ['person', 'animal'];
    let f, g = 'x', subjCat = 'person', dropped = false;
    const ptype = kind === 'prog' ? verb[2] : kind;
    if (coin(0.5)) {
      const p = glPronW(R(pronList)); f = p.f; g = p.g;
      if (['eu', 'nós', 'ti', 'vós'].includes(p.w) && coin(0.3) && kind !== 'ser') dropped = true; else { out.push(p); extra.push(glPronW(R(GL_PRON.filter(x => x[1] !== f && verb[1][x[1]] !== verb[1][f]))[0])); }
    } else {
      const n = nounOf(subjKinds); g = n[2]; subjCat = n[3]; const num = n[1] && coin(0.3) ? 'p' : 's';
      np(n, num, out, { subj: true, of: true }); f = num === 'p' ? 5 : 2;
      if (coin(0.12)) { const n2 = nounOf(subjKinds); out.push(glConj('e')); np(n2, 's', out, { subj: true, adj: false }); f = 5; g = g === 'm' || n2[2] === 'm' ? 'm' : 'f'; }
    }
    const neg = coin(0.22) ? (kind === 'ser' || kind === 'estar' ? 'non' : R(['non', 'non', 'nunca'])) : null;
    const preAdv = !neg && coin(0.12) && !dropped && kind !== 'ser' ? R(['sempre', 'tamén']) : null;
    if (preAdv) out.push(glAdv(preAdv));
    if (neg) { out.push(glNeg(neg)); extra.push(glNeg(neg === 'non' ? 'nunca' : 'non')); }
    const wrongF = () => { const fs = [0, 1, 2, 3, 4, 5].filter(x => verb[1][x] !== verb[1][f]); return R(fs); };
    if (kind === 'refl') {
      const attract = neg || preAdv, want = GL_REFL[f];
      if (!attract) { out.push(glVerbEncl(verb, f)); extra.push(glRefl(want), glVerb(verb, f)); }
      else { out.push(glRefl(want), glVerb(verb, f)); extra.push(glRefl(R(GL_REFL.filter(x => x !== want))), glVerbEncl(verb, f)); }
    } else if (kind === 'prog') {
      out.push(glVerb(pick('estar'), f));
      if (coin(0.5)) { out.push(glPrep('a'), glInfC(verb)); extra.push(glGerC(verb)); } else { out.push(glGerC(verb)); extra.push(glInfC(verb)); }
    } else { out.push(glVerb(verb, f)); extra.push(glVerb(verb, wrongF())); }
    if (kind === 'ser') {
      const num = GL_FORM[f][1], gg = g === 'x' ? R(['m', 'f']) : g;
      if (subjCat === 'person' && coin(0.25)) { const prof = R(GL_NOUN.filter(n => ['profesor', 'profesora', 'médico', 'amigo', 'amiga'].includes(n[0]) && n[2] === gg)); if (prof && (num === 's' || prof[1])) { if (num === 's' && (coin(0.4) || prof[0].startsWith('amig'))) out.push(glDetW(glWant('un', gg, num))); out.push(glNoun(prof, num)); extra.push(glVerb(pick('estar'), f)); } else return null; }
      else { if (coin(0.25)) out.push(glMoi()); const a = adjFor(subjCat, 'ser'); out.push(glAdj(a, a[glIdx(gg, num)])); extra.push(glAdj(a, a[glIdx(...flip(gg, num))]), glVerb(pick('estar'), f)); }
    } else if (kind === 'estar') {
      const num = GL_FORM[f][1], gg = g === 'x' ? R(['m', 'f']) : g, r = Math.random();
      if (r < 0.5) { if (coin(0.25)) out.push(glMoi()); const a = adjFor(subjCat, 'estar'); out.push(glAdj(a, a[glIdx(gg, num)])); extra.push(glAdj(a, a[glIdx(...flip(gg, num))]), glVerb(pick('ser'), f)); }
      else { inPlace(out, nounOf(['place'])); extra.push(glVerb(pick('ser'), f)); }
    } else if (kind === 'ter') {
      if (coin(0.35) && subjCat === 'person') { out.push(glNoun(R(GL_NOUN.filter(n => n[3] === 'feel')), 's')); extra.push(glVerb(pick('estar'), f), glDetW('a')); }
      else { const n = nounOf(['thing', 'animal', 'read', 'food', 'drink']), on = n[1] && coin(0.3) ? 'p' : 's'; np(n, on, out, { of: true, bare: true }); }
    } else if (kind === 'ir') {
      toPlace(out, nounOf(['place']));
      if (coin(0.3)) withSomeone(out, nounOf(['person']));
    } else if (ptype === 'tr') {
      const n = nounOf(verb[3]), on = n[1] && coin(0.3) ? 'p' : 's';
      np(n, on, out, { of: kind !== 'prog', bare: true });
      if (['person', 'animal'].includes(n[3])) extra.push(glPrep('a'));
      if (coin(0.1)) withSomeone(out, nounOf(['person']));
      else if (coin(0.1)) { out.push(glPrep('para')); np(nounOf(['person']), 's', out, { adj: false, subj: true }); }
      else if (coin(0.15)) inPlace(out, nounOf(['place']));
      extra.push(glNoun(nounOf(['*']), 's'));
    } else {
      const r = Math.random();
      if (r < 0.4) inPlace(out, nounOf(['place']));
      else if (r < 0.65) withSomeone(out, nounOf(['person', 'animal']));
    }
    if (coin(0.2) && !['ser', 'estar', 'ir'].includes(kind) && GL_HOW_VERBS.test(verb[0]) && ptype === 'in' && out[out.length - 1]?.k === 'verb') { out.push(glAdv(coin(0.5) ? 'ben' : 'moito')); extra.push(glMoi()); }
    if (coin(0.22)) { const a = R(GL_ADV.filter(x => /[ez]/.test(x[2]) && !['ben', 'moito'].includes(x[0]) && !(x[0] === 'tamén' && preAdv) && !(x[0] === 'aquí' && out.some(c => c?.k === 'prep')))); if (/e/.test(a[2]) && coin(0.4)) out.unshift(glAdv(a[0])); else out.push(glAdv(a[0])); }
    return out;
  };
  for (let tries = 0; tries < 150; tries++) {
    extra.length = 0;
    let words = clause(); if (!words) continue;
    if (Math.random() < 0.25) { const c2 = clause(); if (c2) words = [...words, glConj(R(['e', 'e', 'pero', 'ou'])), ...c2]; }
    if (words.length > 14 || words.length < 2) continue;
    const res = glCheck(words); if (!res.ok) continue;
    extra.push(glPronW(R(['eu', 'ti', 'el', 'ela', 'nós', 'eles'])), glPrep(R(['en', 'con', 'de', 'para'])));
    if (!words.some(w => w.k === 'conj')) extra.push(glConj(R(['e', 'pero'])));
    if (!words.some(w => w.k === 'neg')) extra.push(glNeg('non'));
    const seen = new Set(words.map(w => w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && !seen.has(x.w)) { seen.add(x.w); uniq.push(x); }
    return { words, extra: uniq.slice(0, Math.max(4, 16 - words.length)), english: glEnglish(res.P) };
  }
  return null;
}

BLD_LANGS.gl = { name: 'Galician', check: glCheck, gen: glGenerate, voice: 'gl-ES', english: glEnglish };
BLD_ORDER.gl = { rows: [
    ['A basic sentence', [['det', 'determiner'], ['noun', 'noun'], ['adj', '(adjective)'], ['verb', 'verb'], ['det', '(determiner)'], ['noun', 'noun'], ['adj', '(adjective)']]],
    ['Starting with a pronoun', [['pron', '(pronoun)'], ['verb', 'verb'], ['det', 'determiner'], ['noun', 'noun']]],
    ['My, your, our…', [['det', 'o / a'], ['det', 'meu / miña…'], ['noun', 'noun'], ['verb', 'verb']]],
    ['Saying what something is like (ser / estar)', [['det', 'determiner'], ['noun', 'noun'], ['verb', 'ser / estar'], ['adv', '(moi)'], ['adj', 'adjective']]],
    ['A negative sentence', [['pron', 'pronoun'], ['adv', 'non'], ['verb', 'verb'], ['det', 'determiner'], ['noun', 'noun']]],
    ['A verb like levantarse', [['pron', '(pronoun)'], ['verb', 'verb + me / te / se (levántome)']]],
    ['…and after non', [['adv', 'non'], ['pron', 'me / te / se'], ['verb', 'verb']]],
    ['Liking something (gustar)', [['verb', 'gústame / gústanme'], ['det', 'o / a / os / as'], ['noun', 'what you like']]],
    ['Doing it right now', [['pron', 'pronoun'], ['verb', 'estar'], ['prep', '(a)'], ['verb', '-ndo / to-form']]],
    ['Going somewhere', [['pron', 'pronoun'], ['verb', 'ir'], ['prep', 'a / ao / á / para'], ['det', '(determiner)'], ['noun', 'place']]],
    ['Joining two sentences', [['verb', 'sentence'], ['conj', 'conjunction'], ['verb', 'sentence']]],
  ], tips: [
    ['pron', 'You can leave out eu, ti, nós and vós: the verb already shows who. <b>vostede</b> is the polite “you” and goes with the el / ela form.'],
    ['adj', 'Most adjectives come <b>after</b> the noun: <b>unha casa grande</b>. <b>bo</b> and <b>malo</b> can go before it: <b>un bo libro</b>.'],
    ['det', 'Possessives come after the article and match the thing you have: <b>a miña casa</b>, <b>os meus libros</b>.'],
    ['prep', '<b>de + o = do</b>, <b>en + a = na</b>, <b>a + a = á</b>, <b>con + o = co</b>. Go somewhere with <b>a</b> or <b>para</b>; be somewhere with <b>en</b>.'],
    ['verb', '<b>ser</b>: what something is like (é grande). <b>estar</b>: how it is right now, and where (está canso, está na casa).'],
    ['adv', '<b>non</b> and <b>nunca</b> go right before the verb. <b>moi</b> before an adjective means “very”; <b>moito</b> after the verb means “a lot”.'],
    ['pron', 'me / te / se go <b>after</b> the verb, joined to it: <b>levántome</b>, <b>lávase</b>. After non, nunca, sempre and tamén they go before it: <b>non me levanto</b>.'],
    ['verb', '<b>gustar</b>: <b>gústame o café</b> (I like coffee), <b>gústanme os gatos</b> (I like cats), <b>non lle gusta</b> (he / she doesn’t like). me, che, lle, nos, vos, lles say who.'],
    ['noun', 'Feelings use ter: <b>teño fame</b>, <b>teño sede</b>, <b>teño frío</b>, <b>teño sono</b>.'] ] };

/* ---------------- Your own Galician words (📚 Add my deck's words) ---------------- */
// Present tense of common irregular verbs: eu, ti, el/ela/vostede, nós, vós, eles/elas/vostedes
const GL_IRREG_FORMS = {
  ser: 'son es é somos sodes son', estar: 'estou estás está estamos estades están', ter: 'teño tes ten temos tedes teñen', ir: 'vou vas vai imos ides van',
  haber: 'hei has ha habemos habedes han', facer: 'fago fas fai facemos facedes fan', dicir: 'digo dis di dicimos dicides din', traer: 'traio traes trae traemos traedes traen',
  poder: 'podo podes pode podemos podedes poden', querer: 'quero queres quere queremos queredes queren', saber: 'sei sabes sabe sabemos sabedes saben', caber: 'caibo cabes cabe cabemos cabedes caben',
  ver: 'vexo ves ve vemos vedes ven', vir: 'veño vés vén vimos vides veñen', dar: 'dou dás dá damos dades dan', ler: 'leo les le lemos ledes len', crer: 'creo cres cre cremos credes cren',
  'pór': 'poño pos pon poñemos poñedes poñen', 'oír': 'oio oes oe oímos oídes oen', pedir: 'pido pides pide pedimos pedides piden', medir: 'mido mides mide medimos medides miden',
  repetir: 'repito repites repite repetimos repetides repiten', sentir: 'sinto sentes sente sentimos sentides senten', mentir: 'minto mentes mente mentimos mentides menten',
  vestir: 'visto vistes viste vestimos vestides visten', seguir: 'sigo segues segue seguimos seguides seguen', servir: 'sirvo serves serve servimos servides serven',
  durmir: 'durmo dormes dorme durmimos durmides dormen', subir: 'subo sobes sobe subimos subides soben', fuxir: 'fuxo foxes foxe fuximos fuxides foxen', cubrir: 'cubro cobres cobre cubrimos cubrides cobren',
  'saír': 'saio saes sae saímos saídes saen', caer: 'caio caes cae caemos caedes caen', rir: 'río ris ri rimos rides rin', 'construír': 'constrúo constrúes constrúe construímos construídes constrúen',
  valer: 'vallo vales vale valemos valedes valen', morrer: 'morro morres morre morremos morredes morren', coñecer: 'coñezo coñeces coñece coñecemos coñecedes coñecen',
};
// eu, ti, el, nós, vós, eles: the table first, then the regular patterns (-ar, -er, -ir), with the spelling change of -cer / -cir (coñezo)
function glConjugate(inf) {
  inf = glBase(String(inf).trim().toLowerCase());
  if (GL_IRREG_FORMS[inf]) return GL_IRREG_FORMS[inf].split(' ');
  const st = inf.slice(0, -2), e = inf.slice(-2);
  if (e === 'ar') return [st + 'o', st + 'as', st + 'a', st + 'amos', st + 'ades', st + 'an'];
  const eu = /c$/.test(st) ? st.slice(0, -1) + 'zo' : st + 'o';
  if (e === 'er') return [eu, st + 'es', st + 'e', st + 'emos', st + 'edes', st + 'en'];
  if (e === 'ir') return [eu, st + 'es', st + 'e', st + 'imos', st + 'ides', st + 'en'];
  return [inf, inf, inf, inf, inf, inf];
}
const GL_PL_EX = { 'mes': 'meses', 'país': 'países', 'deus': 'deuses', 'lapis': 'lapis', 'luns': 'luns', 'xoves': 'xoves' };
const glPl = w => GL_PL_EX[w] || (/[aeiouáéíóú]$/.test(w) ? w + 's' : /n$/.test(w) ? w + 's' : /z$/.test(w) ? w.slice(0, -1) + 'ces'
  : /l$/.test(w) ? (/[áéíóú]/.test(w.slice(0, -2)) ? w + 'es' : /al$/.test(w) ? w.slice(0, -1) + 'is' : /el$/.test(w) ? w.slice(0, -1) + 'is' : /ol$/.test(w) ? w.slice(0, -1) + 'is' : /ul$/.test(w) ? w.slice(0, -1) + 'is' : /il$/.test(w) ? w.slice(0, -2) + 'ís' : w + 'es')
  : /[áéíóú]s$/.test(w) ? w.slice(0, -2) + GL_UNACC[w.slice(-2, -1)] + 'ses' : /s$/.test(w) ? w : /[rx]$/.test(w) ? w + 'es' : w + 's');
const glGenderGuess = w => /(ema|dia|mapa|planeta|sofá|día)$/.test(w) ? 'm' : /(a|á|ción|sión|dade|tude|axe|ise|ume)$/.test(w) ? (/ume$/.test(w) ? 'm' : 'f') : 'm';
function glAdjForms(w) {
  const f = /o$/.test(w) ? w.slice(0, -1) + 'a' : /és$/.test(w) ? w.slice(0, -2) + 'esa' : /án$/.test(w) ? w.slice(0, -2) + 'á' : /ón$/.test(w) ? w.slice(0, -2) + 'oa'
    : /or$/.test(w) && !/(maior|menor|mellor|peor|anterior|posterior|superior|inferior|interior|exterior)$/.test(w) ? w + 'a' : w;
  return [w, f, glPl(w), /a$|á$/.test(f) && f !== w ? f + 's' : glPl(w)];
}
const GL_BASE_N = { n: GL_NOUN.length, a: GL_ADJ.length, v: GL_VERB.length };
const glKnown = w => GL_NOUN.slice(0, GL_BASE_N.n).some(n => n[0] === w || n[1] === w) || GL_VERB.slice(0, GL_BASE_N.v).some(v => v[0] === w || glBase(v[0]) === glBase(w) || v[1].includes(w) || (v[9] || []).includes(w))
  || GL_ADJ.slice(0, GL_BASE_N.a).some(a => a.slice(0, 4).includes(w)) || [GL_PRON, GL_DET, GL_PREP, GL_CONJ, GL_ADV].some(L => L.some(x => x[0] === w)) || ['non', 'nunca', 'moi'].includes(w);
function glApplyMine() {
  GL_NOUN.length = GL_BASE_N.n; GL_ADJ.length = GL_BASE_N.a; GL_VERB.length = GL_BASE_N.v;
  for (const m of (typeof S !== 'undefined' && S.bldWords) || []) {
    if (!m || m.lang !== 'gl' || !m.w || !m.en || glKnown(m.w)) continue;
    if (m.k === 'noun') GL_NOUN.push([m.w, m.pl || null, m.g === 'f' ? 'f' : 'm', m.cat || 'thing', m.en, m.pl ? (m.enPl || bldPlEn(m.en)) : null]);
    if (m.k === 'verb' && Array.isArray(m.forms) && m.forms.length === 6) {
      const refl = /(ar|er|ir)se$/.test(m.w) ? 1 : 0, type = m.obj === 'in' || refl ? 'in' : 'tr', objs = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read', 'place'];
      GL_VERB.push([m.w, m.forms, type, objs, 0, m.en, bld3sEn(m.en), m.who === 'a' ? 'a' : 'p', refl, refl ? m.forms.map((x, f) => glEnclitic(x, GL_REFL[f])) : undefined]);
    }
    if (m.k === 'adj') GL_ADJ.push([...glAdjForms(m.w), m.en, 'patflr', 'post', 'both']);
  }
}
// builder.js calls bldApplyMine() when the game starts: add the Galician words to it
if (typeof bldApplyMine === 'function') { const prevApply = bldApplyMine; bldApplyMine = function () { prevApply(); glApplyMine(); }; }
BLD_MINE.gl = { name: 'Galician', forms: 'eu, ti, el/ela, nós, vós, eles/elas', nForms: 6, m: 'o (masculine)', f: 'a (feminine)', conj: w => glConjugate(w), pl: w => glPl(w), adj: w => glAdjForms(w),
  known: w => glKnown(w), gender: w => glGenderGuess(w), isVerb: w => /(ar|er|ir|ír|ór)(se)?$/.test(w) && w.length > 3, refl: w => /(ar|er|ir)se$/.test(w),
  parse: s => { const m = s.match(/^(o|a|un|unha)\s+(\p{L}[\p{L}-]*)$/u); if (m) return { w: m[2], g: /^(a|unha)$/.test(m[1]) ? 'f' : 'm', art: true };
    return /^\p{L}[\p{L}-]*$/u.test(s) ? { w: s } : null; },
  intro: 'words with <i>o/a</i> are nouns, and words like <i>“to …”</i> are verbs). Verb forms are filled in for you, including common irregular verbs (son, teño, vou, fago…); check any that look wrong. Verbs ending in “-se” (lavarse) work too: the game joins “me / te / se / nos / vos” to them (lávome).' };
