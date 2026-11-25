'use strict';
/* ================= Sentence Builder =================
   Build a sentence from a tray of everyday words. It only counts if it follows the grammar of the language.
   Spanish checks: articles and other determiners agree with the noun (gender + number), adjectives agree and go after
   the noun, the verb agrees with the subject (two subjects joined with "y" make it plural), "no" right before the verb,
   ser vs estar, the personal "a", a + el = al, de + el = del, "el agua", ir + a + place, prepositions with the right
   kind of noun, "mucho" only with things you can't count, "muy" before an adjective, and two sentences joined with
   y / pero / o. English checks the same ideas the English way.
   Each word on the tray is one analysed word (a "chip"), so the checker always knows exactly what it is. */

/* ---------------- Spanish words (common, everyday) ---------------- */
const ES_PRON = [['yo', 1, 's', 'x', 'I'], ['tú', 2, 's', 'x', 'you'], ['él', 3, 's', 'm', 'he'], ['ella', 3, 's', 'f', 'she'], ['usted', 3, 's', 'x', 'you'],
  ['nosotros', 1, 'p', 'm', 'we'], ['nosotras', 1, 'p', 'f', 'we'], ['ellos', 3, 'p', 'm', 'they'], ['ellas', 3, 'p', 'f', 'they'], ['ustedes', 3, 'p', 'x', 'you']];
//            word       kind   family     g    num  English       (articles: def/ind)
const ES_DET = [['el', 'art', 'el', 'm', 's', 'the', 'def'], ['la', 'art', 'el', 'f', 's', 'the', 'def'], ['los', 'art', 'el', 'm', 'p', 'the', 'def'], ['las', 'art', 'el', 'f', 'p', 'the', 'def'],
  ['un', 'art', 'un', 'm', 's', 'a', 'ind'], ['una', 'art', 'un', 'f', 's', 'a', 'ind'], ['unos', 'art', 'un', 'm', 'p', 'some', 'ind'], ['unas', 'art', 'un', 'f', 'p', 'some', 'ind'],
  ['mi', 'poss', 'mi', 'x', 's', 'my'], ['mis', 'poss', 'mi', 'x', 'p', 'my'], ['tu', 'poss', 'tu', 'x', 's', 'your'], ['tus', 'poss', 'tu', 'x', 'p', 'your'],
  ['su', 'poss', 'su', 'x', 's', 'his/her'], ['sus', 'poss', 'su', 'x', 'p', 'his/her'],
  ['nuestro', 'poss', 'nuestro', 'm', 's', 'our'], ['nuestra', 'poss', 'nuestro', 'f', 's', 'our'], ['nuestros', 'poss', 'nuestro', 'm', 'p', 'our'], ['nuestras', 'poss', 'nuestro', 'f', 'p', 'our'],
  ['este', 'dem', 'este', 'm', 's', 'this'], ['esta', 'dem', 'este', 'f', 's', 'this'], ['estos', 'dem', 'este', 'm', 'p', 'these'], ['estas', 'dem', 'este', 'f', 'p', 'these'],
  ['ese', 'dem', 'ese', 'm', 's', 'that'], ['esa', 'dem', 'ese', 'f', 's', 'that'], ['esos', 'dem', 'ese', 'm', 'p', 'those'], ['esas', 'dem', 'ese', 'f', 'p', 'those'],
  ['mucho', 'qty', 'mucho', 'm', 's', 'a lot of'], ['mucha', 'qty', 'mucho', 'f', 's', 'a lot of'], ['muchos', 'qty', 'mucho', 'm', 'p', 'many'], ['muchas', 'qty', 'mucho', 'f', 'p', 'many'],
  ['poco', 'qty', 'poco', 'm', 's', 'a little'], ['poca', 'qty', 'poco', 'f', 's', 'a little'], ['pocos', 'qty', 'poco', 'm', 'p', 'few'], ['pocas', 'qty', 'poco', 'f', 'p', 'few'],
  ['dos', 'num', 'dos', 'x', 'p', 'two'], ['tres', 'num', 'tres', 'x', 'p', 'three']];
//            singular   plural   g    kind      English one / many   can't count  "el agua"
const ES_NOUN = [
  ['hombre', 'hombres', 'm', 'person', 'man', 'men'], ['mujer', 'mujeres', 'f', 'person', 'woman', 'women'], ['niño', 'niños', 'm', 'person', 'boy', 'boys'], ['niña', 'niñas', 'f', 'person', 'girl', 'girls'],
  ['amigo', 'amigos', 'm', 'person', 'friend', 'friends'], ['amiga', 'amigas', 'f', 'person', 'friend', 'friends'], ['madre', null, 'f', 'person', 'mother', null], ['padre', 'padres', 'm', 'person', 'father', 'parents'],
  ['hermano', 'hermanos', 'm', 'person', 'brother', 'brothers'], ['hermana', 'hermanas', 'f', 'person', 'sister', 'sisters'], ['maestro', 'maestros', 'm', 'person', 'teacher', 'teachers'], ['maestra', 'maestras', 'f', 'person', 'teacher', 'teachers'],
  ['doctora', 'doctoras', 'f', 'person', 'doctor', 'doctors'],
  ['perro', 'perros', 'm', 'animal', 'dog', 'dogs'], ['gato', 'gatos', 'm', 'animal', 'cat', 'cats'], ['pájaro', 'pájaros', 'm', 'animal', 'bird', 'birds'], ['caballo', 'caballos', 'm', 'animal', 'horse', 'horses'],
  ['pan', null, 'm', 'food', 'bread', null, 1], ['arroz', null, 'm', 'food', 'rice', null, 1], ['queso', null, 'm', 'food', 'cheese', null, 1], ['pollo', null, 'm', 'food', 'chicken', null, 1],
  ['manzana', 'manzanas', 'f', 'food', 'apple', 'apples'], ['fruta', 'frutas', 'f', 'food', 'fruit', 'fruits', 1], ['sopa', null, 'f', 'food', 'soup', null, 1], ['comida', null, 'f', 'food', 'food', null, 1],
  ['pastel', 'pasteles', 'm', 'food', 'cake', 'cakes'], ['galleta', 'galletas', 'f', 'food', 'cookie', 'cookies'],
  ['agua', null, 'f', 'drink', 'water', null, 1, 1], ['leche', null, 'f', 'drink', 'milk', null, 1], ['café', null, 'm', 'drink', 'coffee', null, 1], ['jugo', null, 'm', 'drink', 'juice', null, 1], ['té', null, 'm', 'drink', 'tea', null, 1],
  ['libro', 'libros', 'm', 'read', 'book', 'books'], ['carta', 'cartas', 'f', 'read', 'letter', 'letters'], ['revista', 'revistas', 'f', 'read', 'magazine', 'magazines'], ['periódico', 'periódicos', 'm', 'read', 'newspaper', 'newspapers'],
  ['casa', 'casas', 'f', 'place', 'house', 'houses'], ['ciudad', 'ciudades', 'f', 'place', 'city', 'cities'], ['escuela', 'escuelas', 'f', 'place', 'school', 'schools'], ['parque', 'parques', 'm', 'place', 'park', 'parks'],
  ['playa', 'playas', 'f', 'place', 'beach', 'beaches'], ['tienda', 'tiendas', 'f', 'place', 'store', 'stores'], ['restaurante', 'restaurantes', 'm', 'place', 'restaurant', 'restaurants'], ['mercado', 'mercados', 'm', 'place', 'market', 'markets'],
  ['oficina', 'oficinas', 'f', 'place', 'office', 'offices'], ['cocina', 'cocinas', 'f', 'place', 'kitchen', 'kitchens'], ['biblioteca', 'bibliotecas', 'f', 'place', 'library', 'libraries'],
  ['coche', 'coches', 'm', 'thing', 'car', 'cars'], ['mesa', 'mesas', 'f', 'thing', 'table', 'tables'], ['silla', 'sillas', 'f', 'thing', 'chair', 'chairs'], ['teléfono', 'teléfonos', 'm', 'thing', 'phone', 'phones'],
  ['pelota', 'pelotas', 'f', 'thing', 'ball', 'balls'], ['flor', 'flores', 'f', 'thing', 'flower', 'flowers'], ['puerta', 'puertas', 'f', 'thing', 'door', 'doors'], ['ventana', 'ventanas', 'f', 'thing', 'window', 'windows'],
  ['dinero', null, 'm', 'thing', 'money', null, 1], ['ropa', null, 'f', 'thing', 'clothes', null, 1], ['regalo', 'regalos', 'm', 'thing', 'gift', 'gifts'], ['bicicleta', 'bicicletas', 'f', 'thing', 'bike', 'bikes']];
//            m sing     f sing     m plural    f plural    English     goes with
const ES_ADJ = [['bueno', 'buena', 'buenos', 'buenas', 'good', 'ser', 'pafrl'], ['malo', 'mala', 'malos', 'malas', 'bad', 'ser', 'pafr'], ['grande', 'grande', 'grandes', 'grandes', 'big', 'ser', 'patl'],
  ['pequeño', 'pequeña', 'pequeños', 'pequeñas', 'small', 'ser', 'patl'], ['nuevo', 'nueva', 'nuevos', 'nuevas', 'new', 'ser', 'tlr'], ['viejo', 'vieja', 'viejos', 'viejas', 'old', 'ser', 'patlr'],
  ['bonito', 'bonita', 'bonitos', 'bonitas', 'pretty', 'both', 'patl'], ['feo', 'fea', 'feos', 'feas', 'ugly', 'ser', 'patl'], ['alto', 'alta', 'altos', 'altas', 'tall', 'ser', 'pl'], ['bajo', 'baja', 'bajos', 'bajas', 'short', 'ser', 'p'],
  ['rojo', 'roja', 'rojos', 'rojas', 'red', 'ser', 'tf'], ['azul', 'azul', 'azules', 'azules', 'blue', 'ser', 't'], ['verde', 'verde', 'verdes', 'verdes', 'green', 'ser', 'tf'], ['negro', 'negra', 'negros', 'negras', 'black', 'ser', 'at'],
  ['blanco', 'blanca', 'blancos', 'blancas', 'white', 'ser', 'atf'], ['amarillo', 'amarilla', 'amarillos', 'amarillas', 'yellow', 'ser', 'tf'], ['caro', 'cara', 'caros', 'caras', 'expensive', 'ser', 'tflr'], ['barato', 'barata', 'baratos', 'baratas', 'cheap', 'ser', 'tflr'],
  ['fácil', 'fácil', 'fáciles', 'fáciles', 'easy', 'ser', 'r'], ['difícil', 'difícil', 'difíciles', 'difíciles', 'hard', 'ser', 'r'], ['rápido', 'rápida', 'rápidos', 'rápidas', 'fast', 'ser', 'pat'], ['simpático', 'simpática', 'simpáticos', 'simpáticas', 'nice', 'ser', 'p'],
  ['feliz', 'feliz', 'felices', 'felices', 'happy', 'both', 'pa'], ['triste', 'triste', 'tristes', 'tristes', 'sad', 'both', 'pa'], ['delicioso', 'deliciosa', 'deliciosos', 'deliciosas', 'delicious', 'both', 'f'],
  ['frío', 'fría', 'fríos', 'frías', 'cold', 'both', 'fl'], ['caliente', 'caliente', 'calientes', 'calientes', 'hot', 'both', 'f'], ['limpio', 'limpia', 'limpios', 'limpias', 'clean', 'both', 'tl'], ['sucio', 'sucia', 'sucios', 'sucias', 'dirty', 'both', 'tl'],
  ['cansado', 'cansada', 'cansados', 'cansadas', 'tired', 'estar', 'pa'], ['contento', 'contenta', 'contentos', 'contentas', 'glad', 'estar', 'pa'], ['enfermo', 'enferma', 'enfermos', 'enfermas', 'sick', 'estar', 'pa']];
//            infinitive  yo, tú, él/ella/usted, nosotros, ellos/ustedes    kind   what it takes (* = anything)  needs one  English     he/she form
const ES_VERB = [['comer', ['como', 'comes', 'come', 'comemos', 'comen'], 'tr', ['food'], 0, 'eat', 'eats', 'a'],
  ['beber', ['bebo', 'bebes', 'bebe', 'bebemos', 'beben'], 'tr', ['drink'], 0, 'drink', 'drinks', 'a'],
  ['cocinar', ['cocino', 'cocinas', 'cocina', 'cocinamos', 'cocinan'], 'tr', ['food'], 0, 'cook', 'cooks', 'p'],
  ['leer', ['leo', 'lees', 'lee', 'leemos', 'leen'], 'tr', ['read'], 0, 'read', 'reads', 'p'],
  ['escribir', ['escribo', 'escribes', 'escribe', 'escribimos', 'escriben'], 'tr', ['read'], 0, 'write', 'writes', 'p'],
  ['comprar', ['compro', 'compras', 'compra', 'compramos', 'compran'], 'tr', ['food', 'drink', 'read', 'thing', 'animal', 'p'], 1, 'buy', 'buys'],
  ['vender', ['vendo', 'vendes', 'vende', 'vendemos', 'venden'], 'tr', ['food', 'drink', 'read', 'thing', 'animal', 'p'], 1, 'sell', 'sells'],
  ['tener', ['tengo', 'tienes', 'tiene', 'tenemos', 'tienen'], 'tr', ['*'], 1, 'have', 'has', 'a'],
  ['necesitar', ['necesito', 'necesitas', 'necesita', 'necesitamos', 'necesitan'], 'tr', ['*'], 1, 'need', 'needs', 'a'],
  ['querer', ['quiero', 'quieres', 'quiere', 'queremos', 'quieren'], 'tr', ['*'], 1, 'want', 'wants', 'a'],
  ['buscar', ['busco', 'buscas', 'busca', 'buscamos', 'buscan'], 'tr', ['*'], 1, 'look for', 'looks for', 'a'],
  ['ver', ['veo', 'ves', 've', 'vemos', 'ven'], 'tr', ['*'], 1, 'see', 'sees', 'a'],
  ['visitar', ['visito', 'visitas', 'visita', 'visitamos', 'visitan'], 'tr', ['place', 'person', 'p'], 1, 'visit', 'visits'],
  ['llevar', ['llevo', 'llevas', 'lleva', 'llevamos', 'llevan'], 'tr', ['thing', 'food', 'drink', 'read', 'p'], 1, 'carry', 'carries'],
  ['abrir', ['abro', 'abres', 'abre', 'abrimos', 'abren'], 'tr', ['open'], 1, 'open', 'opens', 'p'],
  ['cerrar', ['cierro', 'cierras', 'cierra', 'cerramos', 'cierran'], 'tr', ['open'], 1, 'close', 'closes', 'p'],
  ['hablar', ['hablo', 'hablas', 'habla', 'hablamos', 'hablan'], 'in', null, 0, 'talk', 'talks', 'p'],
  ['trabajar', ['trabajo', 'trabajas', 'trabaja', 'trabajamos', 'trabajan'], 'in', null, 0, 'work', 'works', 'p'],
  ['estudiar', ['estudio', 'estudias', 'estudia', 'estudiamos', 'estudian'], 'in', null, 0, 'study', 'studies', 'p'],
  ['jugar', ['juego', 'juegas', 'juega', 'jugamos', 'juegan'], 'in', null, 0, 'play', 'plays', 'a'],
  ['correr', ['corro', 'corres', 'corre', 'corremos', 'corren'], 'in', null, 0, 'run', 'runs', 'a'],
  ['caminar', ['camino', 'caminas', 'camina', 'caminamos', 'caminan'], 'in', null, 0, 'walk', 'walks', 'a'],
  ['dormir', ['duermo', 'duermes', 'duerme', 'dormimos', 'duermen'], 'in', null, 0, 'sleep', 'sleeps', 'a'],
  ['vivir', ['vivo', 'vives', 'vive', 'vivimos', 'viven'], 'in', null, 0, 'live', 'lives', 'a'],
  ['ir', ['voy', 'vas', 'va', 'vamos', 'van'], 'ir', null, 1, 'go', 'goes', 'a'],
  ['ser', ['soy', 'eres', 'es', 'somos', 'son'], 'ser', null, 1, 'be', 'is', 'a'],
  ['estar', ['estoy', 'estás', 'está', 'estamos', 'están'], 'estar', null, 1, 'be', 'is', 'a'],
  // "-se" verbs: the 9th item (1) means they need me / te / se / nos right before them ("me levanto")
  ['levantarse', ['levanto', 'levantas', 'levanta', 'levantamos', 'levantan'], 'in', null, 0, 'get up', 'gets up', 'a', 1],
  ['acostarse', ['acuesto', 'acuestas', 'acuesta', 'acostamos', 'acuestan'], 'in', null, 0, 'go to bed', 'goes to bed', 'p', 1],
  ['ducharse', ['ducho', 'duchas', 'ducha', 'duchamos', 'duchan'], 'in', null, 0, 'shower', 'showers', 'p', 1],
  ['despertarse', ['despierto', 'despiertas', 'despierta', 'despertamos', 'despiertan'], 'in', null, 0, 'wake up', 'wakes up', 'a', 1],
  ['sentarse', ['siento', 'sientas', 'sienta', 'sentamos', 'sientan'], 'in', null, 0, 'sit down', 'sits down', 'a', 1],
  ['vestirse', ['visto', 'vistes', 'viste', 'vestimos', 'visten'], 'in', null, 0, 'get dressed', 'gets dressed', 'p', 1],
  ['lavarse', ['lavo', 'lavas', 'lava', 'lavamos', 'lavan'], 'in', null, 0, 'wash up', 'washes up', 'p', 1]];
const ES_OPENABLE = ['puerta', 'ventana', 'libro', 'revista', 'tienda', 'oficina', 'restaurante', 'biblioteca', 'periódico', 'carta', 'regalo'];
//            word       English    where it goes: edge = start or end · pre = right before the verb · post = right after the verb · end = at the end
const ES_ADV = [['hoy', 'today', 'edge'], ['mañana', 'tomorrow', 'edge'], ['ahora', 'now', 'edge'], ['siempre', 'always', 'pre'], ['nunca', 'never', 'pre'],
  ['también', 'too', 'end'], ['aquí', 'here', 'end'], ['mucho', 'a lot', 'post'], ['bien', 'well', 'post']];
const ES_PREP = [['en', 'in'], ['con', 'with'], ['para', 'for'], ['de', 'of'], ['a', 'to'], ['al', 'to the'], ['del', 'of the']];
const ES_CONJ = [['y', 'and'], ['pero', 'but'], ['o', 'or']];
const ES_FORM = [[1, 's'], [2, 's'], [3, 's'], [1, 'p'], [3, 'p']];
const esFormIdx = (per, num) => num === 's' ? per - 1 : per === 1 ? 3 : 4;
const ES_KIND = { food: 'food', drink: 'drinks', read: 'things you read or write', thing: 'things', place: 'places', animal: 'animals', person: 'people', open: 'things you can open' };

/* chips: one analysed word each */
let bldId = 0;
const chip = o => ({ id: ++bldId, ...o });
const esPron = p => chip({ k: 'pron', w: p[0], per: p[1], num: p[2], g: p[3], en: p[4] });
const esDetE = d => chip({ k: 'det', w: d[0], cls: d[1], fam: d[2], g: d[3], num: d[4], en: d[5], def: d[6] });
const esDetFind = (fam, g, num) => ES_DET.find(d => d[2] === fam && (d[3] === g || d[3] === 'x') && d[4] === num);
const esDet = (fam, g, num) => esDetE(esDetFind(fam, g, num));
const esNoun = (n, num) => chip({ k: 'noun', w: num === 'p' ? n[1] : n[0], e: n, g: n[2], num, cat: n[3], mass: !!n[6], elA: !!n[7], en: num === 'p' ? n[5] : n[4] });
const esAdjIdx = (g, num) => (num === 'p' ? 2 : 0) + (g === 'f' ? 1 : 0);
const esAdj = (a, g, num) => chip({ k: 'adj', w: a[esAdjIdx(g, num)], e: a, en: a[4] });
const esVerb = (v, f) => chip({ k: 'verb', w: v[1][f], e: v, f, type: v[2] });
const esPrep = w => chip({ k: 'prep', w, en: ES_PREP.find(p => p[0] === w)[1] });
const esConj = w => chip({ k: 'conj', w, en: ES_CONJ.find(c => c[0] === w)[1] });
const esAdv = w => { const a = ES_ADV.find(x => x[0] === w); return chip({ k: 'adv', w, en: a[1], pos: a[2] }); };
const esNeg = () => chip({ k: 'neg', w: 'no', en: 'not' });
const ES_REFL = [['me', 'myself'], ['te', 'yourself'], ['se', 'himself, herself'], ['nos', 'ourselves'], ['se', 'themselves']];   // by verb form: yo, tú, él, nosotros, ellos
const esRefl = f => chip({ k: 'refl', w: ES_REFL[f][0], f, en: ES_REFL[f][1] });
const esMuy = () => chip({ k: 'int', w: 'muy', en: 'very' });
const esWord = (k, w, extra) => chip({ k, w, ...extra });   // kept for older callers

/* ---------------- Spanish checker ---------------- */
function esCheck(T) {
  let i = 0;
  const err = (msg, at = i) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length }), peek = (o = 0) => T[i + o], isErr = x => x && x.ok === false;
  if (!T.length) return err('Tap some words to build a sentence.');
  const gName = g => g === 'f' ? 'feminine' : 'masculine', nName = n => n === 'p' ? 'plural' : 'singular';
  const npText = np => np.coord ? np.coord.map(npText).join(' y ') : np.pron ? np.pron.w : [np.det?.w, np.n.w, np.muy ? 'muy' : '', np.adj?.w, np.of ? (np.of.viaDel ? 'del ' + np.of.n.w : 'de ' + npText(np.of)) : ''].filter(Boolean).join(' ');
  const detFix = (det, n) => { const g = n.elA && n.num === 's' && det.cls === 'art' ? 'm' : n.g, d = esDetFind(det.fam, g, n.num) || (det.cls === 'qty' || det.cls === 'num' ? null : esDetFind(det.fam, g, det.num)); return d ? d[0] : det.w; };
  const detAgree = (det, n) => {
    if (det.cls === 'art' && n.elA && n.num === 's') { if (det.g === 'f') return `“${n.w}” starts with a stressed “a”, so Spanish says “${det.def === 'def' ? 'el' : 'un'} ${n.w}” (the word is still feminine).`; return null; }
    if (det.cls === 'num' && n.num === 's') return `“${det.w}” means more than one, so the noun must be plural${n.e[1] ? `: “${det.w} ${n.e[1]}”` : ''}.`;
    if (det.cls === 'qty' && n.num === 's' && !n.mass) return `You can count “${n.w}”, so say “${esDetFind(det.fam, n.g, 'p')[0]} ${n.e[1]}”.`;
    if (det.g !== 'x' && det.g !== n.g) return `“${n.w}” is ${gName(n.g)}, so it takes “${detFix(det, n)}”, not “${det.w}”.`;
    if (det.num !== n.num) return `“${n.w}” is ${nName(n.num)}, but “${det.w}” is ${nName(det.num)}. Use “${detFix(det, n)} ${n.w}”.`;
    return null;
  };
  const needsDet = (role, n) => role === 'subj' || !(n.num === 'p' || n.mass || (role === 'pred' && n.cat === 'person') || ((role === 'dest' || role === 'pp') && n.w === 'casa'));
  // a noun phrase: (determiner) noun (muy) (adjective) (de + noun)
  function NP(role) {
    const start = i; let det = null, adj = null, muy = false, of = null;
    if (peek()?.k === 'det') det = T[i++];
    if (peek()?.k === 'adj' || peek()?.k === 'int') {
      const a = peek(), n = T.slice(i, i + 3).find(t => t.k === 'noun');
      return err(n ? `In Spanish, describing words go after the noun: “${[det?.w, n.w, a.k === 'int' ? 'muy' : '', T.slice(i, i + 3).find(t => t.k === 'adj')?.w].filter(Boolean).join(' ')}”.` : `“${a.w}” is a describing word, so it goes right after a noun.`);
    }
    const n = peek();
    if (!n || n.k !== 'noun') return err(det ? `“${det.w}” comes before a noun, so a noun has to go right after it.` : role === 'subj' ? 'Start with who does it: a pronoun like “yo” or a noun like “el perro”.' : 'A noun (a person, place or thing) should go here.', det ? i - 1 : i);
    i++;
    if (det) { const e = detAgree(det, n); if (e) return err(e, start); }
    else if (needsDet(role, n)) return err(role === 'subj' ? `Spanish needs an article before “${n.w}” here: “${esDetFind(n.elA && n.num === 's' ? 'el' : 'el', n.elA && n.num === 's' ? 'm' : n.g, n.num)[0]} ${n.w}”.`
      : `A single “${n.w}” needs a word like “${esDetFind('un', n.g, 's')[0]}” or “${esDetFind('el', n.g, 's')[0]}” in front of it.`, start);
    if (peek()?.k === 'int') { muy = true; i++; if (peek()?.k !== 'adj') return err('“muy” (very) goes right before a describing word: “muy grande”.', i - 1); }
    if (peek()?.k === 'adj') {
      adj = T[i]; const want = adj.e[esAdjIdx(n.g, n.num)];
      if (adj.w !== want) return err(`“${adj.w}” has to match “${n.w}” (${gName(n.g)} ${nName(n.num)}): use “${want}”.`);
      i++; if (peek()?.k === 'adj') return err('Use one describing word per noun here.');
    }
    if (role !== 'of' && peek()?.k === 'prep' && (peek().w === 'de' || peek().w === 'del')) {
      const p = T[i++];
      if (p.w === 'de' && peek()?.k === 'det' && peek().w === 'el') return err(`Spanish joins “de” + “el” into “del”: “del ${peek(1)?.w || '…'}”.`, i - 1);
      if (p.w === 'del') {
        if (peek()?.k === 'det') return err('“del” already means “de + el”, so don’t add another article after it.');
        const m = peek(); if (!m || m.k !== 'noun') return err('“del” needs a noun right after it: “del niño”.', i - 1);
        if (m.g !== 'm' || m.num !== 's') return err(`“del” is “de + el”, so it only goes before a masculine singular noun. For “${m.w}” use “de ${esDetFind('el', m.g, m.num)[0]} ${m.w}”.`, i - 1);
        i++; of = { det: { w: 'el', en: 'the', cls: 'art', def: 'def' }, n: m, num: 's', g: 'm', viaDel: true };
      } else { const o = NP('of'); if (isErr(o)) return o; of = o; }
    }
    return { det, n, adj, muy, of, num: n.num, g: n.g, cat: n.cat };
  }
  // NP (y/o NP): two nouns joined make a plural subject or object. Backs off if a verb follows (then "y" joins two sentences).
  function NPs(role) {
    const a = NP(role); if (isErr(a)) return a;
    const c = peek();
    if (c?.k === 'conj' && (c.w === 'y' || c.w === 'o') && ['det', 'noun', 'pron'].includes(peek(1)?.k)) {
      const save = i; i++;
      if (role === 'subj' && peek().k === 'pron') { const p = T[i++]; return { coord: [a, { pron: p }], conj: c, num: 'p', g: a.g === 'm' || p.g === 'm' ? 'm' : 'f', per: p.per === 1 ? 1 : 3 }; }
      if (peek().k === 'pron') { i = save; return a; }
      const b = NP(role);
      if (isErr(b) || (role !== 'subj' && ['verb', 'neg'].includes(peek()?.k)) || (role !== 'subj' && peek()?.k === 'pron')) { i = save; return a; }
      return { coord: [a, b], conj: c, num: 'p', g: a.g === 'm' || b.g === 'm' ? 'm' : 'f', per: 3, cat: a.cat };
    }
    return a;
  }
  function clause() {
    const C = { lead: [], subj: null, neg: false, verb: null, comp: null, pps: [], tail: [] }, cStart = i;
    while (peek()?.k === 'adv') { const a = peek(); if (a.pos === 'post' || a.pos === 'end') return err(`“${a.w}” goes ${a.pos === 'post' ? 'right after the verb' : 'at the end'}, not at the start.`); C.lead.push(T[i++]); }
    if (peek()?.k === 'conj') return err(`“${peek().w}” joins two parts, so it can’t ${i === 0 ? 'start the sentence' : 'go here'}.`);
    if (peek()?.k === 'pron') { const p = T[i++]; C.subj = { pron: p, per: p.per, num: p.num, g: p.g }; }
    else if (['det', 'noun', 'adj', 'int'].includes(peek()?.k)) { const s = NPs('subj'); if (isErr(s)) return s; C.subj = s.coord ? s : { np: s, per: 3, num: s.num, g: s.g }; }
    while (peek()?.k === 'adv' && peek().pos === 'pre') C.lead.push(T[i++]);
    if (peek()?.k === 'neg' && C.lead.some(a => a.pos === 'pre')) { const a = C.lead.find(x => x.pos === 'pre'); return err(a.w === 'nunca' ? '“nunca” already means “never”, so don’t add “no”: “nunca como”.' : `“no” comes first: “no ${a.w} como”.`); }
    if (peek()?.k === 'neg') { C.neg = true; i++; if (peek()?.k === 'adv' && peek().pos === 'pre') C.lead.push(T[i++]); if (peek()?.k !== 'verb' && peek()?.k !== 'refl') return err('“no” goes right before the verb: “no como”.', i - 1); }
    // me / te / se / nos: only right before a "-se" verb ("me levanto", "no me levanto", "siempre me levanto")
    let refl = null, reflAt = -1;
    if (peek()?.k === 'refl') {
      reflAt = i; refl = T[i++];
      if (peek()?.k === 'neg') return err(`“no” goes before “${refl.w}”: “no ${refl.w} …”.`, i);
      if (peek()?.k === 'adv' && peek().pos === 'pre') return err(`“${peek().w}” goes before “${refl.w}”: “${peek().w} ${refl.w} …”.`, i);
      if (peek()?.k === 'refl') return err(`Only one “me / te / se / nos” before the verb.`, i);
      if (peek()?.k !== 'verb') return err(`“${refl.w}” goes right before a verb, like “${refl.w} levanto”.`, reflAt);
    }
    const v = peek(), sText = C.subj ? (C.subj.pron ? C.subj.pron.w : npText(C.subj.coord ? C.subj : C.subj.np)) : '';
    if (!v) return err(C.subj ? 'Now add a verb (an action word like “come” or “es”).' : 'Every sentence needs a verb.');
    if (v.k !== 'verb') {
      if (v.k === 'pron' && C.subj) return err('A sentence only has one subject (who does it). Join two with “y”.');
      if (v.k === 'adv' && v.pos === 'pre') return err(`“${v.w}” goes before “no” and the verb.`);
      return err(`After ${C.subj ? `“${sText}”` : 'that'} the next word should be a verb. “${v.w}” isn’t a verb.`);
    }
    i++; C.verb = v;
    if (v.e[8] && !refl) return err(`“${v.e[0]}” needs “${ES_REFL[v.f][0]}” right before the verb: “${ES_REFL[v.f][0]} ${v.w}”.`, i - 1);
    if (refl && !v.e[8]) return err(`“${refl.w}” only goes with verbs like “levantarse”. Take it out: just “${v.w}”.`, reflAt);
    if (refl && refl.w !== ES_REFL[v.f][0]) return err(`“${refl.w}” doesn’t match “${v.w}”. Use “${ES_REFL[v.f][0]} ${v.w}”.`, reflAt);
    C.refl = refl;
    const sPer = C.subj ? C.subj.per : ES_FORM[v.f][0], sNum = C.subj ? C.subj.num : ES_FORM[v.f][1], sG = C.subj ? C.subj.g : 'x';
    if (C.subj) { const want = esFormIdx(sPer, sNum); if (want !== v.f) return err(`“${v.w}” doesn’t match the subject “${sText}”. Use “${v.e[1][want]}”.`, i - 1); }
    // does it make sense? things can't eat or run, and animals can't read or talk
    if (C.subj && v.type !== 'ser' && v.type !== 'estar') for (const part of C.subj.coord || [C.subj.np].filter(Boolean)) {
      if (!part?.n) continue; const c = part.cat, what = part.num === 'p' ? part.n.en : 'a ' + part.n.en;
      if (c !== 'person' && c !== 'animal') return err(`That doesn’t make sense: ${what} can’t ${v.e[5]}. Use a person or an animal here.`, cStart);
      if (c === 'animal' && v.e[7] === 'p') return err(`That doesn’t make sense: ${what} can’t ${v.e[5]}. Only people ${v.e[5]}.`, cStart);
    }
    if (peek()?.k === 'adv' && peek().pos === 'post') C.tail.push(T[i++]);
    const nx = peek(), serF = ES_VERB.find(x => x[0] === 'ser')[1][v.f], estarF = ES_VERB.find(x => x[0] === 'estar')[1][v.f];
    const adjPhrase = () => {
      let muy = false; if (peek()?.k === 'int') { muy = true; i++; if (peek()?.k !== 'adj') return err('“muy” goes right before a describing word: “muy alto”.', i - 1); }
      const a = T[i], cop = a.e[5], base = a.e[0];
      if (v.type === 'ser' && cop === 'estar') return err(`“${base}” is a feeling or state, so Spanish uses estar: “${estarF} ${a.w}”.`);
      if (v.type === 'estar' && cop === 'ser') return err(`“${base}” says what something is like, so Spanish uses ser: “${serF} ${a.w}”.`);
      const ok = sG === 'x' ? [a.e[esAdjIdx('m', sNum)], a.e[esAdjIdx('f', sNum)]].includes(a.w) : a.w === a.e[esAdjIdx(sG, sNum)];
      if (!ok) return err(`“${a.w}” has to match the subject (${sG === 'x' ? '' : gName(sG) + ' '}${nName(sNum)}): use “${a.e[esAdjIdx(sG === 'x' ? 'm' : sG, sNum)]}”${sG === 'x' && a.e[esAdjIdx('f', sNum)] !== a.e[esAdjIdx('m', sNum)] ? ` or “${a.e[esAdjIdx('f', sNum)]}”` : ''}.`);
      i++; return { adj: a, muy };
    };
    if (v.type === 'ser' || v.type === 'estar') {
      if (!nx || ['conj'].includes(nx.k)) return err(`“${v.w}” needs something after it, like a describing word (“${v.w} ${v.type === 'ser' ? (sNum === 'p' ? 'altos' : 'alto') : (sNum === 'p' ? 'cansados' : 'cansado')}”)${v.type === 'estar' ? ' or a place (“en la casa”)' : ''}.`, i - 1);
      if (nx.k === 'adj' || nx.k === 'int') { const r = adjPhrase(); if (isErr(r)) return r; C.comp = r; }
      else if (['det', 'noun'].includes(nx.k)) {
        if (v.type === 'estar') return err(`To say what someone or something is, Spanish uses ser: “${serF} …”. Estar is for feelings and places.`);
        const np = NPs('pred'); if (isErr(np)) return np;
        if (np.num !== sNum) return err(`The subject is ${nName(sNum)}, so what it “is” has to be ${nName(sNum)} too.`, i - 1);
        C.comp = { np };
      } else if (nx.k === 'prep' && (nx.w === 'de' || nx.w === 'del') && v.type === 'ser') { i++; if (nx.w === 'de' && peek()?.w === 'el') return err('Spanish joins “de” + “el” into “del”.', i - 1); const np = nx.w === 'del' ? (() => { const m = peek(); if (!m || m.k !== 'noun') return err('“del” needs a noun after it.', i - 1); i++; return { det: { w: 'el', en: 'the' }, n: m, num: 's', g: 'm' }; })() : NP('of'); if (isErr(np)) return np; C.comp = { from: np }; }
      else if (nx.k === 'prep' && nx.w === 'en') { if (v.type === 'ser') return err(`For where something is, Spanish uses estar: “${estarF} en …”.`); }
      else if (nx.k === 'adv' && nx.w === 'aquí') { if (v.type === 'ser') return err(`For where something is, Spanish uses estar: “${estarF} aquí”.`); }
      else return err(`After “${v.w}” put a describing word (like “${sNum === 'p' ? 'felices' : 'feliz'}”)${v.type === 'ser' ? ' or a noun' : ' or “en” + a place'}.`);
    } else if (v.type === 'ir') {
      if (!nx || !(nx.k === 'prep' && (nx.w === 'a' || nx.w === 'al'))) return err(nx?.k === 'prep' && nx.w === 'en' ? `With “ir” (to go) use “a” for where you go: “${v.w} a la playa”.` : `“${v.w}” (go) needs where you go: “${v.w} a la escuela” or “${v.w} al parque”.`, nx ? i : i - 1);
      i++;
      let np;
      if (nx.w === 'al') { if (peek()?.k === 'det') return err('“al” already means “a + el”, so don’t add another article.'); const m = peek(); if (!m || m.k !== 'noun') return err('“al” needs a place right after it: “al parque”.', i - 1);
        if (m.g !== 'm' || m.num !== 's') return err(`“al” is “a + el”, so it only goes before a masculine singular noun. Say “a ${esDetFind('el', m.g, m.num)[0]} ${m.w}”.`, i - 1); i++; np = { det: { w: 'el', en: 'the' }, n: m, num: 's', g: 'm', cat: m.cat };
        if (peek()?.k === 'adj') { const ad = T[i]; if (ad.w !== ad.e[0]) return err(`“${ad.w}” has to match “${m.w}”: use “${ad.e[0]}”.`); np.adj = ad; i++; } }
      else { if (peek()?.k === 'det' && peek().w === 'el') return err(`Spanish joins “a” + “el” into “al”: “al ${peek(1)?.w || '…'}”.`, i - 1); np = NP('dest'); if (isErr(np)) return np; }
      if (np.cat !== 'place') return err(`“ir a” needs a place: “${v.w} a la tienda”. “${np.n.w}” isn’t a place.`, i - 1);
      C.comp = { dest: np };
    } else if (v.type === 'tr') {
      if (nx && ['prep', 'det', 'noun', 'adj', 'int'].includes(nx.k) && !(nx.k === 'prep' && !['a', 'al'].includes(nx.w))) {
        let a = false, np;
        if (nx.k === 'prep' && nx.w === 'al') {
          i++; a = true;
          if (peek()?.k === 'det') return err('“al” already means “a + el”, so don’t add another article after it.');
          const m = peek(); if (!m || m.k !== 'noun') return err('“al” needs a noun right after it: “al perro”.', i - 1);
          if (m.g !== 'm' || m.num !== 's') return err(`“al” is “a + el”, so it only goes before a masculine singular noun. For “${m.w}” use “a ${esDetFind('el', m.g, m.num)[0]} ${m.w}”.`, i - 1);
          i++; np = { det: { w: 'el', en: 'the', cls: 'art', def: 'def' }, n: m, num: 's', g: 'm', cat: m.cat, viaAl: true };
          if (peek()?.k === 'adj') { const ad = T[i], want = ad.e[esAdjIdx('m', 's')]; if (ad.w !== want) return err(`“${ad.w}” has to match “${m.w}”: use “${want}”.`); np.adj = ad; i++; }
        } else {
          if (nx.k === 'prep') { i++; a = true; if (peek()?.k === 'det' && peek().w === 'el') return err(`Spanish joins “a” + “el” into “al”: “al ${peek(1)?.w || '…'}”.`, i - 1); }
          np = NPs('obj'); if (isErr(np)) return np;
        }
        const parts = np.coord || [np], inf = v.e[0];
        for (const p of parts) {
          const animate = ['person', 'animal'].includes(p.cat), txt = npText(p);
          if (inf === 'tener' && a) return err('With “tener” you don’t use “a”: “tengo un perro”.');
          if (animate && !a && inf !== 'tener') return err(`When the object is a person or a pet, Spanish puts “a” in front: “${v.w} a ${txt}”${p.det?.w === 'el' ? ` (a + el = “al”: “${v.w} al ${p.n.w}”)` : ''}.`);
          if (a && !animate) return err(`Only people and pets get “a” in front. Take out “a”: “${v.w} ${txt}”.`);
          if (v.e[3][0] === 'open' ? !ES_OPENABLE.includes(p.n.e[0]) : v.e[3][0] !== '*' && !v.e[3].includes(p.cat)) return err(`That doesn’t make sense: you can’t ${v.e[5]} ${p.num === 'p' || p.n.mass ? p.n.en : 'a ' + p.n.en}. “${inf}” goes with ${v.e[3].map(c => ES_KIND[c]).join(', ')}.`);
        }
        C.comp = { np, a };
      } else if (v.e[4]) return err(`“${v.w}” needs something after it. What do you ${v.e[5]}? For example “${v.w} ${{ food: 'una manzana', drink: 'agua', read: 'un libro', thing: 'una pelota', place: 'la ciudad', animal: 'un perro', person: 'a mi madre', open: 'la puerta', '*': 'un libro' }[v.e[3][0]]}”.`, i - 1);
    } else if (nx && ['det', 'noun', 'adj'].includes(nx.k)) return err(`“${v.e[0]}” (to ${v.e[5]}) doesn’t take an object. You can add a place: “${v.w} en la casa”, or a person: “${v.w} con mi amigo”.`);
    else if (nx && nx.k === 'prep' && (nx.w === 'a' || nx.w === 'al')) return err(`“${v.w}” doesn’t use “a” here. For a place use “en”: “${v.w} en el parque”.`);
    // prepositions: en + place, con + someone/something, para + someone/something
    while (peek()?.k === 'prep') {
      const p = peek();
      if (p.w === 'de' || p.w === 'del') return err('“de” joins two nouns: “el libro de la niña”. It needs a noun right before it.');
      if (p.w === 'a' || p.w === 'al') return err(v.type === 'ir' ? 'Say where you go only once.' : '“a” goes right before a person or pet the action is done to, or after “ir” for a place.');
      i++; const np = NP(p.w === 'en' ? 'pp' : 'pp'); if (isErr(np)) return np;
      if (p.w === 'en' && np.cat !== 'place') return err(`“en” + a place: “en la casa”, “en el parque”. “${np.n.w}” isn’t a place.`, i - 1);
      C.pps.push({ p, np });
    }
    while (peek()?.k === 'adv' && peek().pos !== 'pre') { const a = T[i++]; C.tail.push(a); }
    if (v.type === 'estar' && !C.comp && !C.pps.length && !C.tail.some(a => a.w === 'aquí')) return err(`“${v.w}” needs something after it: a feeling (“cansado”) or a place (“en la casa”).`, i - 1);
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
    return err(x.k === 'adj' ? `“${x.w}” needs to go right after the noun it describes.` : x.k === 'det' ? `“${x.w}” needs its noun right after it, in the right place.` : x.k === 'verb' ? 'One verb per sentence part. Use “y” or “pero” to add another.'
      : x.k === 'pron' ? 'The subject (who does it) goes at the start. To add another sentence, use “y” first.' : x.k === 'neg' ? '“no” goes right before the verb.' : x.k === 'int' ? '“muy” goes right before a describing word.' : x.k === 'prep' ? `“${x.w}” needs a noun after it, in the right place.` : `“${x.w}” doesn’t fit here.`);
  }
  return { ok: true, P };
}

/* English meaning of a correct Spanish sentence */
function esEnglish(P) {
  const an = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
  const npEn = np => {
    if (np.coord) return np.coord.map(npEn).join(np.conj?.w === 'o' ? ' or ' : ' and ');
    if (np.pron) return np.pron.w === 'yo' ? 'I' : np.pron.en;
    const adj = np.adj ? (np.muy ? 'very ' : '') + np.adj.e[4] + ' ' : '', noun = np.n.en, d = np.det;
    let art = '';
    if (d) art = d.cls === 'art' ? (d.def === 'def' || !d.def ? 'the ' : np.num === 'p' ? 'some ' : an(adj || noun) + ' ') : d.en + ' ';
    const base = art + adj + noun;
    if (np.of) { const o = np.of; return ['person', 'animal'].includes(o.n.cat) ? `${npEn(o)}'s ${adj}${noun}` : `${base} of ${npEn(o)}`; }
    return base;
  };
  const one = C => {
    const v = C.verb, f = v.f;
    const subj = C.subj ? (C.subj.pron ? C.subj.pron.en : npEn(C.subj.coord ? C.subj : C.subj.np)) : ['I', 'you', 'he/she', 'we', 'they'][f];
    const third = C.subj ? (C.subj.pron ? (C.subj.per === 3 && C.subj.num === 's' && C.subj.pron.w !== 'usted') : C.subj.num === 's') : f === 2;
    const pre = C.lead.filter(a => a.pos === 'pre').map(a => a.en).join(' '), edge = C.lead.filter(a => a.pos === 'edge').map(a => a.en);
    let vp;
    if (v.type === 'ser' || v.type === 'estar') {
      const be = subj === 'I' ? 'am' : third ? 'is' : 'are';
      const what = C.comp?.adj ? (C.comp.muy ? 'very ' : '') + C.comp.adj.e[4] : C.comp?.np ? npEn(C.comp.np) : C.comp?.from ? 'from ' + npEn(C.comp.from) : '';
      vp = `${be}${C.neg ? ' not' : ''}${pre ? ' ' + pre : ''} ${what}`;
    } else {
      const loves = v.e[0] === 'querer' && C.comp?.a;
      const base = loves ? 'love' : v.e[5], s3 = loves ? 'loves' : v.e[6];
      if (C.lead.some(a => a.w === 'nunca')) vp = `${pre} ${third ? s3 : base}`;
      else vp = C.neg ? `${third ? 'does' : 'do'} not${pre ? ' ' + pre : ''} ${base}` : `${pre ? pre + ' ' : ''}${third ? s3 : base}`;
      if (C.comp?.np) vp += ' ' + npEn(C.comp.np);
      if (C.comp?.dest) vp += ' to ' + npEn(C.comp.dest);
    }
    for (const { p, np } of C.pps) vp += ` ${p.en} ${npEn(np)}`;
    const tail = [...edge, ...C.tail.map(a => a.en)].join(' ');
    return `${subj} ${vp}${tail ? ' ' + tail : ''}`.replace(/\s+/g, ' ').trim();
  };
  let s = one(P.clauses[0]);
  P.conjs.forEach((c, k) => { s += (c.w === 'y' ? ', and ' : c.w === 'pero' ? ', but ' : ', or ') + one(P.clauses[k + 1]); });
  return s[0].toUpperCase() + s.slice(1) + '.';
}

/* ---------------- making a tray ---------------- */
function esGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = list => { const fav = list.filter(x => pref.has(x[0]) || (x[1] && typeof x[1] === 'string' && pref.has(x[1]))); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const nounOf = cats => RP(ES_NOUN.filter(n => cats[0] === '*' || cats.includes(n[3]) || (cats[0] === 'open' && ES_OPENABLE.includes(n[0]))));
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
  const adjFor = (cop, cat) => RP(ES_ADJ.filter(a => (cop === 'estar' ? a[5] !== 'ser' : a[5] !== 'estar') && (!cat || a[6].includes(CAT[cat] || 'p'))));
  const extra = [];
  // a noun phrase with a determiner that fits (and a look-alike determiner as a distractor)
  const np = (n, num, role, out, opts = {}) => {
    const g = n[2], elA = n[7] && num === 's', mass = n[6];
    let fam;
    if (num === 'p') fam = R(['el', 'el', 'un', 'mi', 'su', 'nuestro', 'este', 'ese', 'mucho', 'dos', 'tres']);
    else if (mass) fam = R(['el', 'el', 'mucho', 'poco', 'mi', 'este', null]);
    else fam = R(['el', 'el', 'un', 'un', 'mi', 'tu', 'su', 'nuestro', 'este', 'ese']);
    if (fam === null && role === 'subj') fam = 'el';
    if (fam) { const dg = elA && (fam === 'el' || fam === 'un') ? 'm' : g; const d = esDetFind(fam, dg, num); out.push(esDetE(d)); const wrong = ES_DET.find(x => x[2] === fam && x !== d && (x[3] !== dg || x[4] !== num)); if (wrong) extra.push(esDetE(wrong)); }
    out.push(esNoun(n, num));
    if (opts.adj !== false && coin(0.35)) { if (coin(0.2)) out.push(esMuy()); const a = adjFor('any', n[3]); out.push(esAdj(a, g, num)); extra.push(esAdj(a, g === 'm' ? 'f' : 'm', num === 's' ? 'p' : 's')); }
    if (opts.of && coin(0.25)) { const o = nounOf(['person']); if (o[2] === 'm' && coin(0.5)) { out.push(esPrep('del'), esNoun(o, 's')); extra.push(esPrep('de'), esDet('el', 'm', 's')); } else { out.push(esPrep('de')); np(o, 's', 'of', out, { adj: false }); } }
  };
  const clause = (first) => {
    const out = [], kind = R(['tr', 'tr', 'tr', 'in', 'ser', 'estar', 'ir']);
    const verb = kind === 'ser' || kind === 'estar' || kind === 'ir' ? ES_VERB.find(v => v[0] === kind) : RP(ES_VERB.filter(v => v[2] === kind));
    const subjKinds = verb[7] === 'p' ? ['person'] : ['person', 'animal'];
    let per, num, g = 'x', subjCat = 'person';
    const sr = Math.random();
    if (sr < 0.4) { const p = R(ES_PRON); per = p[1]; num = p[2]; g = p[3]; out.push(esPron(p)); }
    else if (sr < 0.85) {
      const n = nounOf(subjKinds); per = 3; g = n[2]; num = n[1] && coin(0.3) ? 'p' : 's'; subjCat = n[3];
      np(n, num, 'subj', out, { of: true });
      if (coin(0.15)) { const n2 = nounOf(subjKinds); out.push(esConj('y')); np(n2, 's', 'subj', out, { adj: false }); num = 'p'; g = g === 'm' || n2[2] === 'm' ? 'm' : 'f'; }
    } else [per, num] = ES_FORM[Math.floor(Math.random() * 5)];
    const f = esFormIdx(per, num), gg = g === 'x' ? R(['m', 'f']) : g;
    if (coin(0.12)) out.push(esAdv(R(['siempre', 'nunca'])));
    else if (coin(0.18)) out.push(esNeg());
    if (verb[8]) { out.push(esRefl(f)); const wrong = [0, 1, 2, 3].filter(x => ES_REFL[x][0] !== ES_REFL[f][0]); extra.push(esRefl(R(wrong))); }
    out.push(esVerb(verb, f)); extra.push(esVerb(verb, (f + 1 + Math.floor(Math.random() * 4)) % 5));
    if (kind === 'ser') {
      if (coin(0.75)) { if (coin(0.25)) out.push(esMuy()); const a = adjFor('ser', subjCat); out.push(esAdj(a, gg, num)); extra.push(esAdj(a, gg === 'm' ? 'f' : 'm', num === 's' ? 'p' : 's'), esVerb(ES_VERB.find(v => v[0] === 'estar'), f)); }
      else { if (subjCat !== 'person' || g === 'x') return null; const n = RP(ES_NOUN.filter(x => x[3] === 'person' && x[2] === g && (num === 's' || x[1]) && !['madre', 'padre'].includes(x[0]))); np(n, num, 'pred', out, { adj: false }); }
    } else if (kind === 'estar') {
      if (coin(0.5)) { const a = adjFor('estar', subjCat); out.push(esAdj(a, gg, num)); extra.push(esVerb(ES_VERB.find(v => v[0] === 'ser'), f)); }
      else { const n = nounOf(['place']); out.push(esPrep('en')); np(n, 's', 'pp', out, { adj: false }); extra.push(esVerb(ES_VERB.find(v => v[0] === 'ser'), f)); }
    } else if (kind === 'ir') {
      const n = nounOf(['place']);
      if (n[2] === 'm' && coin(0.6)) { out.push(esPrep('al'), esNoun(n, 's')); extra.push(esPrep('a'), esDet('el', 'm', 's')); }
      else { out.push(esPrep('a'), esDet('el', n[2], 's'), esNoun(n, 's')); extra.push(esPrep('en')); }
      if (coin(0.3)) { out.push(esPrep('con')); np(nounOf(['person']), 's', 'pp', out, { adj: false }); }
    } else if (kind === 'tr') {
      const n = nounOf(verb[3]), on = n[1] && coin(0.35) ? 'p' : 's', animate = ['person', 'animal'].includes(n[3]);
      if (animate && verb[0] !== 'tener') { if (n[2] === 'm' && on === 's' && coin(0.5)) { out.push(esPrep('al'), esNoun(n, 's')); extra.push(esDet('el', 'm', 's')); } else { out.push(esPrep('a')); np(n, on, 'obj', out); } }
      else np(n, on, 'obj', out, { of: true });
      if (coin(0.25)) { out.push(esPrep(R(['con', 'para']))); np(nounOf(['person']), 's', 'pp', out, { adj: false }); }
      else if (coin(0.2)) { out.push(esPrep('en')); np(nounOf(['place']), 's', 'pp', out, { adj: false }); }
      extra.push(esNoun(nounOf(['*']), 's'));
    } else {
      const r = Math.random();
      if (r < 0.45) { out.push(esPrep('en')); np(nounOf(['place']), 's', 'pp', out, { adj: false }); }
      else if (r < 0.75) { out.push(esPrep('con')); np(nounOf(['person', 'animal']), 's', 'pp', out, { adj: false }); }
    }
    if (coin(0.25)) { const a = R(ES_ADV.filter(x => x[2] === 'edge' || x[2] === 'end')); out.push(esAdv(a[0])); }
    return out;
  };
  for (let tries = 0; tries < 80; tries++) {
    extra.length = 0;
    let words = clause(true); if (!words) continue;
    if (Math.random() < 0.3) { const c2 = clause(false); if (c2) words = [...words, esConj(R(['y', 'y', 'pero', 'o'])), ...c2]; }
    if (words.length > 14 || words.length < 4) continue;
    const res = esCheck(words); if (!res.ok) continue;
    extra.push(esPron(R(ES_PRON)), esPrep(R(['en', 'con', 'a', 'de'])));
    if (!words.some(w => w.k === 'conj')) extra.push(esConj(R(['y', 'pero'])));
    if (!words.some(w => w.k === 'neg')) extra.push(esNeg());
    // only keep distractors that differ from the words already in the sentence
    const seen = new Set(words.map(w => w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (!seen.has(x.w)) { seen.add(x.w); uniq.push(x); }
    return { words, extra: uniq.slice(0, Math.max(4, 16 - words.length)), english: esEnglish(res.P) };
  }
  return null;
}

/* ---------------- English words and checker ---------------- */
const EN_PRON = [['I', 1, 's'], ['you', 2, 's'], ['he', 3, 's'], ['she', 3, 's'], ['it', 3, 's'], ['we', 1, 'p'], ['they', 3, 'p']];
//            word     needs         gloss
const EN_DET = [['the', 'any'], ['a', 'one'], ['an', 'one'], ['some', 'many'], ['my', 'any'], ['your', 'any'], ['his', 'any'], ['her', 'any'], ['our', 'any'], ['their', 'any'],
  ['this', 'one'], ['that', 'one'], ['these', 'plural'], ['those', 'plural'], ['two', 'plural'], ['three', 'plural']];
const EN_NOUN = ES_NOUN.map(n => [n[4], n[5], n[3], n[6], n[0]]);   // one, many, kind, can't count, Spanish
const EN_ADJ = ES_ADJ.map(a => [a[4], a[5], a[0], a[6]]);   // English, goes with, Spanish, kinds of nouns it describes
const EN_VERB = ES_VERB.filter(v => v[2] !== 'ser' && v[2] !== 'estar').map(v => [v[5], v[6], v[2], v[3], v[4], v[0], v[7]]);   // ..., who can do it   // base, he/she form, kind, objects, needs one, Spanish
const EN_OPENABLE = ES_NOUN.filter(n => ES_OPENABLE.includes(n[0])).map(n => n[4]);
const EN_ADV = [['today', 'edge'], ['tomorrow', 'edge'], ['now', 'edge'], ['always', 'pre'], ['never', 'pre'], ['too', 'end'], ['here', 'end'], ['a lot', 'end'], ['well', 'end']];
const vowel = w => /^[aeiou]/i.test(w) && !/^(uni|use|eu)/i.test(w) || /^hour/i.test(w);
function enCheck(T) {
  let i = 0;
  const err = (msg, at = i) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length }), peek = (o = 0) => T[i + o], isErr = x => x && x.ok === false;
  if (!T.length) return err('Tap some words to build a sentence.');
  function NP(role) {
    const start = i; let det = null, adj = null;
    if (peek()?.k === 'det') det = T[i++];
    if (peek()?.k === 'int') { i++; if (peek()?.k !== 'adj') return err('“very” goes right before a describing word: “very big”.', i - 1); }
    if (peek()?.k === 'adj') adj = T[i++];
    const n = peek();
    if (!n || n.k !== 'noun') return err(adj ? `“${adj.w}” is a describing word, so a noun has to come after it.` : det ? `“${det.w}” needs a noun after it.` : role === 'subj' ? 'Start with who does it: “I”, “she”, “the dog”…' : 'A noun (a person, place or thing) should go here.', det || adj ? i - 1 : i);
    i++;
    if (peek()?.k === 'adj') return err(`In English, the describing word goes before the noun: “${[det?.w, peek().w, n.w].filter(Boolean).join(' ')}”.`);
    if (det) {
      const nextW = (adj || n).w, d = det.w;
      if ((d === 'a' || d === 'an') && (n.num === 'p' || n.mass)) return err(n.mass ? `You can’t count “${n.w}”, so don’t use “${d}”. Try “the ${n.w}” or “some ${n.w}”.` : `“${d}” means just one. With “${n.w}” use “the” or “some”.`, start);
      if (d === 'a' && vowel(nextW)) return err(`Before a vowel sound English uses “an”: “an ${nextW}”.`, start);
      if (d === 'an' && !vowel(nextW)) return err(`“an” only goes before a vowel sound. Use “a ${nextW}”.`, start);
      if (d === 'some' && n.num === 's' && !n.mass) return err(`“some” goes with more than one: “some ${n.e[1]}”, or say “a ${n.w}”.`, start);
      if ((d === 'this' || d === 'that') && n.num === 'p') return err(`“${d}” is for one. For more than one use “${d === 'this' ? 'these' : 'those'} ${n.w}”.`, start);
      if (['these', 'those', 'two', 'three'].includes(d) && n.num === 's') return err(n.mass ? `You can’t count “${n.w}”. Try “this ${n.w}”.` : `“${d}” is for more than one: “${d} ${n.e[1]}”.`, start);
    } else if (n.num === 's' && !n.mass) return err(`A single “${n.w}” needs a word like “a”, “the” or “my” in front: “the ${adj ? adj.w + ' ' : ''}${n.w}”.`, start);
    let of = null;
    return { det, adj, n, num: n.num, cat: n.cat, of };
  }
  function NPs(role) {
    const a = NP(role); if (isErr(a)) return a;
    const c = peek();
    if (c?.k === 'conj' && (c.w === 'and' || c.w === 'or') && ['det', 'noun', 'adj'].includes(peek(1)?.k)) {
      const save = i; i++; const b = NP(role);
      if (isErr(b) || (role !== 'subj' && ['verb', 'be', 'dont', 'pron'].includes(peek()?.k))) { i = save; return a; }
      return { coord: [a, b], num: c.w === 'and' ? 'p' : b.num, cat: a.cat };
    }
    return a;
  }
  function clause() {
    while (peek()?.k === 'adv' && peek().pos === 'edge') i++;
    if (peek()?.k === 'conj') return err(`“${peek().w}” joins two parts, so it can’t go here.`);
    let subj = null, third = false, isI = false;
    if (peek()?.k === 'pron') { const p = T[i++]; subj = p; third = p.per === 3 && p.num === 's'; isI = p.w === 'I';
      if (peek()?.k === 'conj' && peek().w === 'and' && ['det', 'noun', 'pron'].includes(peek(1)?.k)) { i++; if (peek().k === 'pron') i++; else { const b = NP('subj'); if (isErr(b)) return b; } third = false; isI = false; } }
    else if (['det', 'noun', 'adj', 'int'].includes(peek()?.k)) { const np = NPs('subj'); if (isErr(np)) return np; subj = np; third = np.num === 's'; }
    if (!subj) return err('Start with who does it: “I”, “she”, “the dog”…');
    const sw = subj.w || 'that subject';
    while (peek()?.k === 'adv' && peek().pos === 'pre') i++;
    let v = peek();
    if (!v) return err('Now add a verb (an action word like “eats” or “is”).');
    if (v.k === 'dont') {
      i++;
      if (v.w === "doesn't" && !third) return err(`“doesn't” is only for he, she, it or one thing. Use “don't”.`, i - 1);
      if (v.w === "don't" && third) return err(`With ${subj.w ? `“${subj.w}”` : 'one person or thing'} use “doesn't”.`, i - 1);
      while (peek()?.k === 'adv' && peek().pos === 'pre') i++;
      v = peek(); if (!v || v.k !== 'verb') return err(`After “${T[i - 1].w}” comes a verb: “${T[i - 1].w} eat”.`, i - 1);
      if (v.form !== 'base') return err(`After “don't” / “doesn't” the verb stays plain: “${v.e[0]}”, not “${v.w}”.`);
    } else if (v.k === 'be') {
      const want = isI ? 'am' : third ? 'is' : 'are';
      if (v.w !== want) return err(`With “${sw}” use “${want}”, not “${v.w}”.`);
    } else if (v.k === 'verb') {
      if (third && v.form !== 's') return err(`With he, she, it or one thing, the verb gets an -s: “${v.e[1]}”.`);
      if (!third && v.form === 's') return err(`“${v.w}” is only for he, she, it or one thing. Use “${v.e[0]}”.`);
    } else if (v.k === 'pron') return err('A sentence part has one subject. Join two with “and”.');
    else return err(`After the subject, the next word should be a verb. “${v.w}” isn't a verb.`);
    if (v.k === 'verb') for (const part of subj.coord || (subj.n ? [subj] : [])) {
      const c = part.cat, what = part.num === 'p' ? part.n.w : 'a ' + part.n.w;
      if (c !== 'person' && c !== 'animal') return err(`That doesn’t make sense: ${what} can’t ${v.e[0]}. Use a person or an animal here.`, 0);
      if (c === 'animal' && v.e[6] === 'p') return err(`That doesn’t make sense: ${what} can’t ${v.e[0]}. Only people ${v.e[0]}.`, 0);
    }
    if (false) {}
    i++;
    if (v.k === 'be') {
      if (peek()?.k === 'not') i++;
      while (peek()?.k === 'adv' && peek().pos === 'pre') i++;
      const n = peek();
      if (!n || n.k === 'conj') return err(`“${v.w}” needs something after it: “${v.w} happy”, “${v.w} in the park”…`, i - 1);
      if ((n.k === 'adj' || n.k === 'int') && !['det', 'noun'].includes(T[i + (n.k === 'int' ? 2 : 1)]?.k)) { if (n.k === 'int') { i++; if (peek()?.k !== 'adj') return err('“very” goes right before a describing word.', i - 1); } i++; }
      else if (n.k === 'prep') { if (n.w !== 'in') return err(`To say where, use “in”: “${v.w} in the park”.`); }
      else if (n.k === 'adv' && n.w === 'here') {}
      else if (['det', 'noun', 'adj'].includes(n.k)) { const np = NPs('pred'); if (isErr(np)) return np; const many = !third && !isI && subj.w !== 'you'; if ((np.num === 'p') !== many) return err(many ? 'For more than one subject, what they “are” is more than one too: “they are friends”.' : `For one subject, use one thing: “${v.w} a ${np.n?.w || 'friend'}”.`, i - 1); }
      else return err(`After “${v.w}” put a describing word (“happy”) or a place (“in the park”).`);
    } else {
      const nx = peek(), type = v.type;
      if (type === 'ir') {
        if (!nx || nx.k !== 'prep' || nx.w !== 'to') return err(`“${v.w}” needs where you go: “${v.w} to the park”.`, nx ? i : i - 1);
        i++; const np = NP('dest'); if (isErr(np)) return np; if (np.cat !== 'place') return err(`“go to” needs a place: “go to the store”. “${np.n.w}” isn't a place.`, i - 1);
      } else if (type === 'tr' && nx && ['det', 'noun', 'adj', 'int'].includes(nx.k)) {
        const np = NPs('obj'); if (isErr(np)) return np;
        for (const p of np.coord || [np]) if (v.e[3][0] === 'open' ? !EN_OPENABLE.includes(p.n.e[0]) : v.e[3][0] !== '*' && !v.e[3].includes(p.cat)) return err(`That doesn’t make sense: you can’t ${v.e[0]} ${p.num === 'p' || p.n.mass ? p.n.w : 'a ' + p.n.w}.`, i - 1);
      } else if (type === 'tr' && v.e[4]) return err(`“${v.w}” needs something after it. What do you ${v.e[0]}?`, i - 1);
      else if (type === 'in' && nx && ['det', 'noun', 'adj'].includes(nx.k)) return err(`“${v.e[0]}” doesn’t take an object. Add a place: “${v.w} in the park”, or a person: “${v.w} with my friend”.`);
    }
    while (peek()?.k === 'prep') {
      const p = T[i++];
      if (p.w === 'to') return err('“to” goes after “go” for a place: “go to the park”.', i - 1);
      const np = NP('pp'); if (isErr(np)) return np;
      if (p.w === 'in' && np.cat !== 'place') return err(`“in” + a place: “in the park”. “${np.n.w}” isn't a place.`, i - 1);
    }
    while (peek()?.k === 'adv' && peek().pos !== 'pre') i++;
    return { ok: true };
  }
  for (;;) {
    const c = clause(); if (isErr(c)) return c;
    if (peek()?.k === 'conj') { i++; if (!peek()) return err(`“${T[i - 1].w}” joins two parts, so something has to come after it.`, i - 1); continue; }
    break;
  }
  if (i < T.length) { const x = T[i]; return err(x.k === 'adj' ? `“${x.w}” goes right before the noun it describes.` : x.k === 'det' ? `“${x.w}” needs its noun right after it.` : x.k === 'pron' ? 'The subject (who does it) goes at the start. To add another part, use “and” first.' : x.k === 'verb' || x.k === 'be' ? 'One verb per sentence part. Use “and” or “but” to add another.' : `“${x.w}” doesn’t fit here.`); }
  return { ok: true };
}
function enGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const N = (n, num) => chip({ k: 'noun', w: num === 'p' ? n[1] : n[0], e: n, num, cat: n[2], mass: !!n[3] });
  const D = w => chip({ k: 'det', w }), A = a => chip({ k: 'adj', w: a[0], e: a }), P = p => chip({ k: 'pron', w: p[0], per: p[1], num: p[2] });
  const V = (v, form) => chip({ k: 'verb', w: form === 's' ? v[1] : v[0], e: v, form, type: v[2] });
  const W = (k, w, extra) => chip({ k, w, ...extra }), adv = w => W('adv', w, { pos: EN_ADV.find(a => a[0] === w)[1] });
  const extra = [];
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
  const adjFit = cat => R(EN_ADJ.filter(a => a[3].includes(CAT[cat] || 'p') && a[1] !== 'estar'));
  const np = (n, num, out, adjOK = true) => {
    let adj = adjOK && coin(0.35) ? adjFit(n[2]) : null, very = adj && coin(0.2);
    const first = very ? 'very' : (adj ? adj[0] : n[0]);
    let d;
    if (num === 'p') d = R(['the', 'some', 'my', 'our', 'their', 'these', 'those', 'two', 'three']);
    else if (n[3]) d = R(['the', 'some', 'my', 'this', null]);
    else d = R(['the', 'the', vowel(first) ? 'an' : 'a', 'my', 'your', 'his', 'her', 'this', 'that']);
    if (d) { out.push(D(d)); if (d === 'a' || d === 'an') extra.push(D(d === 'a' ? 'an' : 'a')); if (d === 'this') extra.push(D('these')); }
    if (very) out.push(W('int', 'very')); if (adj) out.push(A(adj)); out.push(N(n, num));
  };
  const clause = () => {
    const out = []; let third, isI = false, subjCat = 'person';
    const kind = R(['tr', 'tr', 'in', 'be', 'ir']), v = kind === 'be' ? null : R(EN_VERB.filter(x => x[2] === kind)), who = v && v[6] === 'p' ? ['person'] : ['person', 'animal'];
    if (coin(0.5)) { const p = R(EN_PRON.filter(p => p[0] !== 'it')); out.push(P(p)); third = p[1] === 3 && p[2] === 's'; isI = p[0] === 'I'; extra.push(P(R(EN_PRON))); }
    else { const n = R(EN_NOUN.filter(x => who.includes(x[2]))), num = n[1] && coin(0.3) ? 'p' : 's'; third = num === 's'; subjCat = n[2]; np(n, num, out);
      if (coin(0.15)) { out.push(W('conj', 'and')); np(R(EN_NOUN.filter(x => x[2] === 'person')), 's', out, false); third = false; } }
    if (kind === 'be') {
      const be = isI ? 'am' : third ? 'is' : 'are'; out.push(W('be', be)); extra.push(W('be', be === 'is' ? 'are' : 'is'));
      if (coin(0.55)) { if (coin(0.25)) out.push(W('int', 'very')); out.push(A(adjFit(subjCat))); } else { out.push(W('prep', 'in')); np(R(EN_NOUN.filter(x => x[2] === 'place')), 's', out, false); }
    } else {
      const neg = coin(0.2);
      if (coin(0.12)) out.push(adv(R(['always', 'never'])));
      else if (neg) { out.push(W('dont', third ? "doesn't" : "don't")); extra.push(W('dont', third ? "don't" : "doesn't")); }
      const plain = neg && !out.some(x => x.k === 'adv');
      out.push(V(v, plain ? 'base' : third ? 's' : 'base')); extra.push(V(v, plain || third ? (plain ? 's' : 'base') : 's'));
      if (kind === 'ir') { out.push(W('prep', 'to')); np(R(EN_NOUN.filter(x => x[2] === 'place')), 's', out, false); extra.push(W('prep', 'in')); }
      else if (kind === 'tr') { const n = R(EN_NOUN.filter(x => v[3][0] === '*' || (v[3][0] === 'open' ? EN_OPENABLE.includes(x[0]) : v[3].includes(x[2])))), num = n[1] && coin(0.35) ? 'p' : 's'; np(n, num, out); extra.push(N(R(EN_NOUN.filter(x => x[1])), 's')); }
      if (coin(0.3)) { const p = R(['in', 'with', 'for']); out.push(W('prep', p)); np(R(EN_NOUN.filter(x => p === 'in' ? x[2] === 'place' : x[2] === 'person')), 's', out, false); }
    }
    if (coin(0.25)) out.push(adv(R(['today', 'now', 'too', 'here'])));
    return out;
  };
  for (let t = 0; t < 80; t++) {
    extra.length = 0;
    let words = clause();
    if (coin(0.3)) words = [...words, W('conj', R(['and', 'but', 'or'])), ...clause()];
    if (words.length > 14 || words.length < 4 || !enCheck(words).ok) continue;
    extra.push(A(R(EN_ADJ)), D(R(['a', 'an', 'some', 'these'])), W('prep', R(['in', 'with', 'to'])));
    if (!words.some(w => w.k === 'conj')) extra.push(W('conj', R(['and', 'but'])));
    const seen = new Set(words.map(w => w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (!seen.has(x.w)) { seen.add(x.w); uniq.push(x); }
    return { words, extra: uniq.slice(0, Math.max(4, 16 - words.length)), english: null };
  }
  return null;
}
const BLD_LANGS = { es: { name: 'Spanish', check: esCheck, gen: esGenerate, voice: 'es-ES' }, en: { name: 'English', check: enCheck, gen: enGenerate, voice: 'en-US' } };
let bld = null;
/* Word types: each gets its own color, a tag on the word, and a line in the color key */
const BLD_TYPES = {
  pron: ['pronoun', 'who does it: yo, ella, we…'], noun: ['noun', 'a person, place or thing'], verb: ['verb', 'an action or a state: como, es…'],
  adj: ['adjective', 'describes a noun: grande, roja…'], det: ['determiner', 'comes before a noun: el, una, mi, este…'], prep: ['preposition', 'links words: en, con, para, de…'],
  conj: ['conjunction', 'joins two parts: y, pero, o'], adv: ['adverb', 'how, when or where: hoy, siempre, no, muy…'] };
const bldType = c => ({ neg: 'adv', int: 'adv', be: 'verb', dont: 'verb', not: 'adv', pa: 'prep', al: 'prep', refl: 'pron', pas: 'adv', cop: 'verb' })[c.k] || c.k;
const bldTag = c => { if (c.k === 'det') return c.cls === 'art' || ['the', 'a', 'an'].includes(c.w) ? 'article' : 'determiner'; return BLD_TYPES[bldType(c)]?.[0] || ''; };
function startBuilder(deckId) {
  const d = deckById(deckId), fl = langBase(d?.frontLang || ''), bl = langBase(d?.backLang || '');
  const lang = BLD_LANGS[fl] ? fl : BLD_LANGS[bl] ? bl : 'es';
  // words from your deck that the game knows get picked more often
  const pref = new Set(); for (const c of cardsOf(deckId)) for (const side of [c.front, c.back]) for (const w of String(side || '').toLowerCase().split(/[^\p{L}]+/u)) if (w) pref.add(w);
  if (typeof bldApplyMine === 'function') bldApplyMine();   // your own words from your decks
  bld = { deckId, lang, pref, score: 0, streak: 0, best: 0, meanings: S.settings.bldMeanings !== false, tags: S.settings.bldTags !== false };
  bldRound(); go({ name: 'builder', deckId });
}
function bldRound() {
  const g = BLD_LANGS[bld.lang].gen(bld.pref) || BLD_LANGS[bld.lang].gen(new Set());
  const tray = shuffle([...g.words, ...g.extra]).map(c => ({ ...c, used: false }));
  Object.assign(bld, { heatShown: 0, gap: null, tray, line: [], example: g.words, english: g.english, msg: null, bad: -1, fails: 0, done: false, hint: -1, showEx: false });
}
// French l' and j' join the next word with no space
const bldSentence = (words, lang) => { if (BLD_LANGS[lang]?.join) return BLD_LANGS[lang].join(words); if (BLD_LANGS[lang]?.noSpaces) return words.map(w => w.w).join('') + '。'; const s = words.reduce((t, w, i) => i && !/'$/.test(words[i - 1].w) ? t + ' ' + w.w : t + w.w, ''); return (lang === 'es' && /^¿/.test(s) ? s : s[0].toUpperCase() + s.slice(1)) + '.'; };
const bldGloss = c => c.gloss || (bld.lang === 'es' || bld.lang === 'fr' ? (c.k === 'verb' ? 'to ' + c.e[5] : c.en) : (c.k === 'noun' ? c.e[4] : c.k === 'adj' ? c.e[2] : c.k === 'verb' ? c.e[5] : '')) || (c.e && (c.k === 'noun' ? c.e[4] : c.k === 'adj' ? c.e[4] : ''))
  || ({ el: 'the', la: 'the', los: 'the', las: 'the', un: 'a', una: 'a', unos: 'some', unas: 'some', no: 'not', en: 'in', a: '(to)', al: '(to the)' })[c.w] || '';

views.builder = () => {
  if (!bld) { view = { name: 'home' }; return views.home(); }
  const d = deckById(bld.deckId), L = BLD_LANGS[bld.lang], line = bld.line.map(id => bld.tray.find(t => t.id === id));
  const chipH = (c, where, idx) => `<button type="button" class="bld-chip t-${bldType(c)}${where === 'line' && idx === bld.bad ? ' bad' : ''}${where === 'tray' && bld.hint === c.id ? ' hint' : ''}" data-act="${where === 'line' ? 'bldRemove' : 'bldPick'}" data-id="${c.id}" ${bld.done ? 'disabled' : ''} title="${esc(bldTag(c))}: ${esc(BLD_TYPES[bldType(c)]?.[1] || '')}">
      ${bld.tags ? `<span class="t">${esc(bldTag(c))}</span>` : ''}<span class="w">${esc(c.w)}</span>${bld.meanings && where === 'tray' && bldGloss(c) ? `<span class="g">${esc(bldGloss(c))}</span>` : ''}</button>`;
  const types = [...new Set(bld.tray.map(bldType))];
  return `
    <div class="study-top"><button type="button" class="btn ghost" data-act="games" data-id="${bld.deckId}">← Games</button>
      <div style="flex:1"><b>🧩 Sentence Builder</b> <span class="muted small">· ${esc(L.name)} grammar</span></div>
      <span class="muted small">✅ ${bld.score}${bld.streak > 1 ? ` · 🔥 ${bld.streak} in a row` : ''}</span></div>
    ${typeof bldModeTabs === 'function' ? bldModeTabs('build') : ''}
    <div class="flash bld-board" style="min-height:0">
      <div class="muted small">${bld.frame ? `Fill each blank with the right ${esc(bldPosNames())}. The other words are already in place. It only counts if it follows the grammar rules.` : `Tap or drag words to build a sentence in ${esc(L.name)}. Drag a word out to take it back. It only counts if it follows the grammar rules.`}</div>
      <div class="bld-line ${bld.done ? 'done' : ''}" aria-label="Your sentence">${bld.frame ? bldFrameHtml(chipH) : line.length ? line.map((c, i) => (bld.gap === i ? '<span class="bld-gap" aria-label="empty spot"></span>' : '') + chipH(c, 'line', i)).join('') : '<span class="muted">Your sentence goes here…</span>'}</div>
      ${bldHeatHTML(line)}
      ${bld.msg ? `<div class="bld-msg ${bld.done ? 'ok' : bld.gap != null ? 'ex' : 'no'}">${bld.msg}</div>` : ''}
      ${bld.showEx && !bld.done ? `<div class="bld-msg ex">💡 One sentence you could make: <b>${esc(bldSentence(bld.example, bld.lang))}</b>${bld.english ? ` <span class="muted">(${esc(bld.english)})</span>` : ''}</div>` : ''}
    </div>
    <div class="bld-key" aria-label="Color key">${Object.entries(BLD_TYPES).filter(([k]) => types.includes(k)).map(([k, [name, what]]) => `<span class="bld-key-i t-${k}" title="${esc(what)}"><i></i>${name}</span>`).join('')}</div>
    <div class="bld-tray">${bld.tray.filter(c => !c.used).map(c => chipH(c, 'tray')).join('') || '<span class="muted small">All the words are in your sentence.</span>'}</div>
    <div class="bld-actions">
      ${bld.done ? `<button type="button" class="btn primary big" data-act="bldNew">Next sentence ▶</button>` : `
      <button type="button" class="btn" data-act="bldUndo" ${line.length ? '' : 'disabled'}>↩️ Undo</button>
      <button type="button" class="btn" data-act="bldClear" ${line.length ? '' : 'disabled'}>🧹 Clear</button>
      <button type="button" class="btn" data-act="bldHint">💡 Hint</button>
      <button type="button" class="btn" data-act="bldOrder" title="The order the parts of speech go in">❓ Word order</button>
      <button type="button" class="btn" data-act="bldNew">🔀 New words</button>
      <button type="button" class="btn primary big" data-act="bldCheck" ${line.length ? '' : 'disabled'}>✅ Check</button>`}
    </div>
    <div class="row" style="justify-content:center;gap:8px;margin-top:10px;flex-wrap:wrap">
      <label class="row muted small" style="gap:6px;font-weight:400"><input type="checkbox" id="bldTags" ${bld.tags ? 'checked' : ''}> Word types</label>
      <label class="row muted small" style="gap:6px;font-weight:400"><input type="checkbox" id="bldMeanings" ${bld.meanings ? 'checked' : ''}> Meanings</label>
      <label class="row muted small" style="gap:6px;font-weight:400"><input type="checkbox" id="bldMeter" ${S.settings.bldMeter !== false ? 'checked' : ''}> Hot/cold meter</label>
      <label class="row muted small" style="gap:6px;font-weight:400" title="When you press New words, keep the sentence you're building and only change the words below"><input type="checkbox" id="bldKeep" ${S.settings.bldKeep !== false ? 'checked' : ''}> Keep my sentence</label>
      <button type="button" class="btn small" data-act="bldWords">📚 Add my deck's words${(S.bldWords || []).length ? ` (${S.bldWords.length})` : ''}</button>
      <select class="inp" id="bldLang" style="margin:0;width:auto">${Object.entries(BLD_LANGS).map(([k, l]) => `<option value="${k}" ${k === bld.lang ? 'selected' : ''}>Build in ${l.name}</option>`).join('')}</select>
    </div>
    ${bldPosPicker()}
    ${typeof bldReportBtn === 'function' ? bldReportBtn(bld.lang) : ''}`;
};
function bldCheckNow() {
  const line = bld.line.map(id => bld.tray.find(t => t.id === id)), r = BLD_LANGS[bld.lang].check(line);
  if (r.ok) {
    const L = BLD_LANGS[bld.lang], d = deckById(bld.deckId), text = bldSentence(line, bld.lang), meaning = L.english ? L.english(r.P) : null;
    bld.done = true; bld.bad = -1; bld.score++; bld.streak++; bld.best = Math.max(bld.best, bld.streak);
    const pts = bld.fails ? 2 : 3; if (typeof addPoints === 'function') addPoints(pts);
    bld.msg = `🎉 <b>${esc(text)}</b>${meaning ? `<br><span class="muted">${esc(meaning)}</span>` : ''}<br><span class="small">Correct ${L.name}! +${pts} points</span>`;
    const lang = langBase(d?.frontLang || '') === bld.lang ? d.frontLang : langBase(d?.backLang || '') === bld.lang ? d.backLang : L.voice;
    if (typeof speak === 'function') speak(text, lang);
    if (meaning && typeof gtRemember === 'function') gtRemember(bld.lang, meaning, text, 'Made by the Sentence Builder (its English meaning)');   // for 🌐 Report a translation problem
  } else { bld.fails++; bld.streak = 0; bld.bad = r.at; bld.msg = `✋ ${esc(r.msg)}${bld.fails >= 2 && !bld.showEx ? '<br><span class="small">Stuck? Tap 💡 Hint, or 🔀 New words for a fresh set.</span>' : ''}`; }
  render();
}
Object.assign(actions, {
  // a word you take out of the sentence leaves a gap; the next word you tap fills that gap
  bldPick: el => { const c = bld.tray.find(t => t.id === +el.dataset.id); if (!c || c.used || bld.done) return; if (bld.frame) return bldFill(c);
    c.used = true;
    if (bld.gap != null && bld.gap <= bld.line.length) bld.line.splice(bld.gap, 0, c.id); else bld.line.push(c.id);
    bld.gap = null; bld.msg = null; bld.bad = -1; bld.hint = -1; render(); },
  bldRemove: el => { if (bld.done) return; if (bld.frame) return bldUnfill(+el.dataset.id); const id = +el.dataset.id, at = bld.line.indexOf(id); bld.line = bld.line.filter(x => x !== id); const c = bld.tray.find(t => t.id === id); if (c) c.used = false;
    bld.gap = at < bld.line.length ? at : null; bld.msg = at < bld.line.length ? '✏️ Tap a word below to put it in that spot.' : null; bld.bad = -1; render(); },
  bldUndo: () => { if (bld.frame) return bldUnfill(bld.filled.at(-1)); bld.gap = null; const id = bld.line.pop(); const c = bld.tray.find(t => t.id === id); if (c) c.used = false; bld.msg = null; bld.bad = -1; render(); },
  bldClear: () => { if (bld.frame) { [...bld.filled].forEach(id => bldUnfill(id, true)); return render(); } bld.gap = null; bld.line = []; bld.tray.forEach(c => { c.used = false; }); bld.msg = null; bld.bad = -1; render(); },
  bldNew: () => { if (!bld.done) bld.streak = 0; bldRound(); render(); },
  bldCheck: () => bldCheckNow(),
  bldHint: () => {
    // if your sentence so far matches mine, light up my next word; otherwise show my whole sentence
    if (bld.frame) { const i = bld.frame.findIndex((f, j) => !f.fixed && bld.fill[j] == null), want = bld.example[i], c = want && bld.tray.find(t => !t.used && t.w === want.w);
      bld.hint = c ? c.id : -1; bld.msg = c ? `💡 Try “${esc(c.w)}” in the ${i === bld.frame.findIndex((f, j) => !f.fixed) ? 'first' : 'next'} blank.` : null; if (!c) bld.showEx = true; bld.fails = Math.max(bld.fails, 1); return render(); }
    const ex = bld.example, line = bld.line.map(id => bld.tray.find(t => t.id === id));
    const prefix = line.every((c, i) => ex[i] && ex[i].w === c.w);
    if (prefix && line.length < ex.length) { const want = ex[line.length], c = bld.tray.find(t => !t.used && t.w === want.w); bld.hint = c ? c.id : -1; bld.msg = c ? `💡 Try “${esc(c.w)}” next.` : null; }
    else bld.showEx = true;
    bld.fails = Math.max(bld.fails, 1); render();
  },
});
document.addEventListener('change', e => {
  if (view.name !== 'builder' || !bld) return;
  if (e.target.id === 'bldMeanings') { bld.meanings = S.settings.bldMeanings = e.target.checked; save(); render(); }
  if (e.target.id === 'bldKeep') { S.settings.bldKeep = e.target.checked; save(); }
  if (e.target.id === 'bldMeter') { S.settings.bldMeter = e.target.checked; save(); render(); }
  if (e.target.id === 'bldTags') { bld.tags = S.settings.bldTags = e.target.checked; save(); render(); }
  if (e.target.id === 'bldLang') { bld.lang = e.target.value; bld.streak = 0; bldRound(); render(); }
});

/* Present tense of common irregular and stem-changing verbs: yo, tú, él/ella/usted, nosotros, ellos/ustedes.
   Used when your deck's verbs are added to the Sentence Builder, so they get their real forms (tengo, not "teno"). */
const ES_IRREG_FORMS = {
  ser: 'soy eres es somos son', estar: 'estoy estás está estamos están', ir: 'voy vas va vamos van', tener: 'tengo tienes tiene tenemos tienen',
  hacer: 'hago haces hace hacemos hacen', poder: 'puedo puedes puede podemos pueden', querer: 'quiero quieres quiere queremos quieren',
  decir: 'digo dices dice decimos dicen', venir: 'vengo vienes viene venimos vienen', poner: 'pongo pones pone ponemos ponen',
  salir: 'salgo sales sale salimos salen', saber: 'sé sabes sabe sabemos saben', conocer: 'conozco conoces conoce conocemos conocen',
  dar: 'doy das da damos dan', ver: 'veo ves ve vemos ven', oír: 'oigo oyes oye oímos oyen', traer: 'traigo traes trae traemos traen',
  caer: 'caigo caes cae caemos caen', haber: 'he has ha hemos han', caber: 'quepo cabes cabe cabemos caben', valer: 'valgo vales vale valemos valen',
  conducir: 'conduzco conduces conduce conducimos conducen', traducir: 'traduzco traduces traduce traducimos traducen', producir: 'produzco produces produce producimos producen',
  construir: 'construyo construyes construye construimos construyen', destruir: 'destruyo destruyes destruye destruimos destruyen', incluir: 'incluyo incluyes incluye incluimos incluyen', huir: 'huyo huyes huye huimos huyen',
  oler: 'huelo hueles huele olemos huelen', reír: 'río ríes ríe reímos ríen', sonreír: 'sonrío sonríes sonríe sonreímos sonríen', freír: 'frío fríes fríe freímos fríen',
  pedir: 'pido pides pide pedimos piden', servir: 'sirvo sirves sirve servimos sirven', repetir: 'repito repites repite repetimos repiten', medir: 'mido mides mide medimos miden', vestir: 'visto vistes viste vestimos visten',
  seguir: 'sigo sigues sigue seguimos siguen', conseguir: 'consigo consigues consigue conseguimos consiguen', elegir: 'elijo eliges elige elegimos eligen',
  sentir: 'siento sientes siente sentimos sienten', preferir: 'prefiero prefieres prefiere preferimos prefieren', mentir: 'miento mientes miente mentimos mienten',
  dormir: 'duermo duermes duerme dormimos duermen', morir: 'muero mueres muere morimos mueren', jugar: 'juego juegas juega jugamos juegan',
  pensar: 'pienso piensas piensa pensamos piensan', empezar: 'empiezo empiezas empieza empezamos empiezan', comenzar: 'comienzo comienzas comienza comenzamos comienzan',
  cerrar: 'cierro cierras cierra cerramos cierran', despertar: 'despierto despiertas despierta despertamos despiertan', sentar: 'siento sientas sienta sentamos sientan',
  entender: 'entiendo entiendes entiende entendemos entienden', perder: 'pierdo pierdes pierde perdemos pierden', encender: 'enciendo enciendes enciende encendemos encienden', defender: 'defiendo defiendes defiende defendemos defienden',
  volver: 'vuelvo vuelves vuelve volvemos vuelven', devolver: 'devuelvo devuelves devuelve devolvemos devuelven', resolver: 'resuelvo resuelves resuelve resolvemos resuelven', mover: 'muevo mueves mueve movemos mueven',
  contar: 'cuento cuentas cuenta contamos cuentan', costar: 'cuesto cuestas cuesta costamos cuestan', encontrar: 'encuentro encuentras encuentra encontramos encuentran',
  recordar: 'recuerdo recuerdas recuerda recordamos recuerdan', mostrar: 'muestro muestras muestra mostramos muestran', probar: 'pruebo pruebas prueba probamos prueban',
  soñar: 'sueño sueñas sueña soñamos sueñan', volar: 'vuelo vuelas vuela volamos vuelan', almorzar: 'almuerzo almuerzas almuerza almorzamos almuerzan',
  colgar: 'cuelgo cuelgas cuelga colgamos cuelgan', acostar: 'acuesto acuestas acuesta acostamos acuestan',
  acordar: 'acuerdo acuerdas acuerda acordamos acuerdan', divertir: 'divierto diviertes divierte divertimos divierten', despedir: 'despido despides despide despedimos despiden',
  convertir: 'convierto conviertes convierte convertimos convierten', sugerir: 'sugiero sugieres sugiere sugerimos sugieren', 
  parecer: 'parezco pareces parece parecemos parecen', ofrecer: 'ofrezco ofreces ofrece ofrecemos ofrecen', crecer: 'crezco creces crece crecemos crecen', nacer: 'nazco naces nace nacemos nacen',
  merecer: 'merezco mereces merece merecemos merecen', agradecer: 'agradezco agradeces agradece agradecemos agradecen', obedecer: 'obedezco obedeces obedece obedecemos obedecen',
  aparecer: 'aparezco apareces aparece aparecemos aparecen', desaparecer: 'desaparezco desapareces desaparece desaparecemos desaparecen', reconocer: 'reconozco reconoces reconoce reconocemos reconocen',
  leer: 'leo lees lee leemos leen', creer: 'creo crees cree creemos creen', andar: 'ando andas anda andamos andan',
};
const ES_NO_PERSON_VERBS = /^(llover|nevar|granizar|amanecer|anochecer)$/;   // weather verbs: only "llueve", no yo/tú forms
/* ---------------- Your own words: add words from your deck to the Sentence Builder ---------------- */
// The built-in word lists stay as they are; your words are added on top each time the game starts.
const BLD_BASE = { n: ES_NOUN.length, a: ES_ADJ.length, v: ES_VERB.length, en: EN_NOUN.length, ea: EN_ADJ.length, ev: EN_VERB.length };
const BLD_KINDS = [['person', 'a person'], ['animal', 'an animal'], ['food', 'food'], ['drink', 'a drink'], ['thing', 'a thing'], ['place', 'a place'], ['read', 'something you read']];
const bldPlEs = w => /[aeiouáéó]$/.test(w) ? w + 's' : /z$/.test(w) ? w.slice(0, -1) + 'ces' : w.replace(/ón$/, 'on').replace(/án$/, 'an').replace(/én$/, 'en').replace(/és$/, 'es').replace(/ín$/, 'in') + 'es';
const bldPlEn = w => /(s|x|z|ch|sh)$/.test(w) ? w + 'es' : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + 'ies' : w + 's';
const bld3sEn = w => /(o|s|x|z|ch|sh)$/.test(w) ? w + 'es' : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + 'ies' : w + 's';
// yo, tú, él, nosotros, ellos: the table above first, then the common patterns, then the regular rule
function bldConj(inf) {
  if (/(ar|er|ir|ír)se$/.test(inf)) inf = inf.slice(0, -2);   // levantarse → levantar: same forms, with me/te/se/nos in front
  if (ES_IRREG_FORMS[inf]) return ES_IRREG_FORMS[inf].split(' ');
  const r = bldConjRegular(inf);
  if (/[aeiou]cer$|[aeiou]cir$/.test(inf)) r[0] = inf.slice(0, -3) + 'zco';                       // conocer → conozco, lucir → luzco
  else if (/[^gq]uir$/.test(inf)) { const st = inf.slice(0, -2); return [st + 'yo', st + 'yes', st + 'ye', st + 'imos', st + 'yen']; }   // concluir → concluyo
  return r;
}
const bldConjRegular = inf => { const e = inf.slice(-2).replace('í', 'i'), st = inf.slice(0, -2);
  return e === 'ar' ? [st + 'o', st + 'as', st + 'a', st + 'amos', st + 'an'] : e === 'er' ? [st + 'o', st + 'es', st + 'e', st + 'emos', st + 'en'] : [st + 'o', st + 'es', st + 'e', st + 'imos', st + 'en']; };
const bldAdjForms = w => /o$/.test(w) ? [w, w.slice(0, -1) + 'a', w + 's', w.slice(0, -1) + 'as'] : /[aeiou]$/.test(w) ? [w, w, w + 's', w + 's'] : [w, w, bldPlEs(w), bldPlEs(w)];
const bldGenderGuess = w => /(a|ción|sión|dad|tad|tud|umbre)$/.test(w) ? 'f' : 'm';
const bldKnown = w => ES_NOUN.slice(0, BLD_BASE.n).some(n => n[0] === w || n[1] === w) || ES_VERB.slice(0, BLD_BASE.v).some(v => v[0] === w || v[1].includes(w))
  || ES_ADJ.slice(0, BLD_BASE.a).some(a => a.slice(0, 4).includes(w)) || [ES_PRON, ES_DET, ES_PREP, ES_CONJ, ES_ADV].some(L => L.some(x => x[0] === w)) || ['no', 'muy'].includes(w);

function bldApplyMine() {
  ES_NOUN.length = BLD_BASE.n; ES_ADJ.length = BLD_BASE.a; ES_VERB.length = BLD_BASE.v; EN_NOUN.length = BLD_BASE.en; EN_ADJ.length = BLD_BASE.ea; EN_VERB.length = BLD_BASE.ev;
  for (const m of S.bldWords || []) {
    if (!m || (m.lang && m.lang !== 'es') || !m.w || !m.en || bldKnown(m.w)) continue;
    if (m.k === 'noun') { ES_NOUN.push([m.w, m.pl || null, m.g === 'f' ? 'f' : 'm', m.cat || 'thing', m.en, m.pl ? (m.enPl || bldPlEn(m.en)) : null]); EN_NOUN.push([m.en, m.pl ? (m.enPl || bldPlEn(m.en)) : null, m.cat || 'thing', 0, m.w]); }
    if (m.k === 'verb' && Array.isArray(m.forms) && m.forms.length === 5) { const type = m.obj === 'in' ? 'in' : 'tr', who = m.who === 'a' ? 'a' : 'p', objs = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read', 'place'];
      const refl = /(ar|er|ir|ír)se$/.test(m.w) ? 1 : 0;   // "-se" verbs need me/te/se/nos before them
      ES_VERB.push([m.w, m.forms, refl && type === 'tr' && !m.objSet ? 'in' : type, objs, 0, m.en, bld3sEn(m.en), who, refl]); EN_VERB.push([m.en, bld3sEn(m.en), refl ? 'in' : type, objs, 0, m.w, who]); }
    if (m.k === 'adj') { const f = bldAdjForms(m.w); ES_ADJ.push([...f, m.en, 'both', 'patflr']); EN_ADJ.push([m.en, 'both', m.w, 'patflr']); }
  }
  if (typeof frApplyMine === 'function') frApplyMine();
  if (typeof jaApplyMine === 'function') jaApplyMine();
}
const bldMineKey = m => (m.lang || 'es') + ':' + m.w;
const bldClean = s => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\[[^\]]*\]|\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
function bldSides(d) { const f = langBase(d?.frontLang || ''), b = langBase(d?.backLang || ''), ok = l => typeof BLD_MINE !== 'undefined' ? !!BLD_MINE[l] : l === 'es';
  return ok(f) && b === 'en' ? ['front', 'back', f] : ok(b) && f === 'en' ? ['back', 'front', b] : null; }
// words on this deck's cards that the game doesn't know yet, with a best guess at what kind of word each one is
/* The deck's word labels (🏷️ Word labels: from the built-in word list or Wiktionary) tell the Sentence Builder what kind of word each card is. */
const BLD_FROM_LABEL = { noun: 'noun', verb: 'verb', adjective: 'adj' };
function bldLabelOf(c, side, d) {
  if (typeof posGuess !== 'function') return '';
  const lang = side === 'front' ? d?.frontLang : d?.backLang, r = c.pos?.[side];
  const v = posGuess(c[side], lang) || (r && r.t === (c[side] || '') && r.v?.length ? r.v : null);
  return v ? v[0] : '';
}
function bldCandidates(deckId) {
  const d = deckById(deckId), sides = bldSides(d); if (!sides) return null;
  const out = [], seen = new Set(), L = BLD_MINE[sides[2]];
  for (const c of cardsOf(deckId)) {
    let es = bldClean(c[sides[0]]).toLowerCase().replace(/[¡!¿?.,;:]/g, '').replace(/’/g, "'").trim();
    let enRaw = bldClean(c[sides[1]]).toLowerCase().split(/[,;/]| or /)[0].replace(/[!?.]/g, '').trim();
    const toVerb = /^to\s/.test(enRaw), en = enRaw.replace(/^(to|the|a|an|some)\s+/, '').trim();
    if (!en || !/^[a-z][a-z' -]*$/.test(en) || en.split(' ').length > (toVerb ? 4 : 2)) continue;   // "to take a shower", "to go for a walk" are fine for a verb
    const m = L.parse(es), w = m?.w;
    if (!w || w.length < (sides[2] === 'ja' ? 1 : 2) || seen.has(w) || L.known(w)) continue;   // one kanji (犬) is a whole word
    seen.add(w);
    let k = '', g = m.g || L.gender(w);
    // the deck's word labels (noun, verb, adjective…) come first; otherwise guess from "el/la" and "to …"
    const lab = BLD_FROM_LABEL[bldLabelOf(c, sides[0], d)] || '';
    const isVerb = L.isVerb(w);   // levantar / levantarse, parler / se laver
    if (lab && (lab !== 'verb' || isVerb)) k = lab;
    else if (m.art) k = 'noun'; else if (toVerb && isVerb) k = 'verb';
    else if (sides[2] === 'ja' && !toVerb) k = /い$/.test(w) ? 'adj' : 'noun';   // Japanese has no articles: most single words are nouns, and many ending in い are adjectives
    out.push({ w, en, k, g, verbOK: isVerb, fromLabel: !!lab && k === lab, lang: sides[2], read: m.read || null });
  }
  return out;
}
function bldWordsDialog() {
  const cands = bldCandidates(bld.deckId), d = deckById(bld.deckId), lang = bldSides(d)?.[2] || 'es', L = BLD_MINE[lang], mine = (S.bldWords || []).filter(m => (m.lang || 'es') === lang);
  if (!cands) { openDialog({ title: '📚 Words from your deck', ok: 'OK', body: `<p style="margin:0">This works with ${Object.values(BLD_MINE).map(l => l.name).join(', ').replace(/, ([^,]*)$/, ' and $1')} decks that have English on the other side. Set this deck's front and back languages in Deck settings (for example French and English), then come back.</p>`, onOk: () => {} }); return; }
  // words you already added (from any deck) come first, with what you picked last time
  const rows = [...mine.filter(m => !cands.some(c => c.w === m.w)).map(m => ({ ...m, saved: true })), ...cands.map(c => ({ ...c, ...(mine.find(m => m.w === c.w) || {}), saved: mine.some(m => m.w === c.w) }))];
  const opt = (v, cur, label) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(label)}</option>`;
  const row = (r, i) => `<div class="bldw" data-k="${r.k || ''}" data-i="${i}">
      <div class="bldw-w"><b>${esc(r.w)}</b> <span class="muted">= ${esc(r.en)}</span>${r.saved ? ' <span class="pill">in the game</span>' : ''}
        <input type="hidden" name="w${i}" value="${esc(r.w)}"><input type="hidden" name="en${i}" value="${esc(r.en)}"></div>
      <select class="inp" name="k${i}" aria-label="Kind of word">${opt('', r.k, r.saved ? '✖ Take it out' : 'Don’t use')}${opt('noun', r.k, 'Noun')}${r.verbOK !== false || r.k === 'verb' ? opt('verb', r.k, 'Verb') : ''}${opt('adj', r.k, 'Adjective')}</select>
      <div class="bldw-f f-noun">
        ${L.noGender ? '' : `<select class="inp" name="g${i}" aria-label="Gender">${opt('m', r.g, L.m)}${opt('f', r.g, L.f)}${L.n ? opt('n', r.g, L.n) : ''}</select>`}<input type="hidden" name="read${i}" value="${esc(r.read || '')}">
        <select class="inp" name="cat${i}" aria-label="What it is">${BLD_KINDS.map(([v, l]) => opt(v, r.cat || 'thing', 'It is ' + l)).join('')}</select>
        ${L.noGender ? '' : `<label class="row small" style="gap:6px;font-weight:400"><input type="checkbox" name="pl${i}" ${r.k !== 'noun' || r.pl !== null ? 'checked' : ''}> Plural:</label>
        <input class="inp" name="plw${i}" value="${esc(r.pl || L.pl(r.w))}" aria-label="${L.name} plural" style="width:9em">`}
      </div>
      <div class="bldw-f f-verb">
        <input class="inp" name="forms${i}" value="${esc((r.forms || (r.verbOK !== false ? L.conj(r.w) : [])).join(', '))}" aria-label="${L.forms}" title="${L.forms}" style="flex:2 1 16em">
        <select class="inp" name="obj${i}" aria-label="Object">${opt('tr', r.obj || 'tr', 'Takes a thing (“I ___ a song”)')}${opt('trp', r.obj, 'Takes a person (“I ___ my friend”)')}${opt('in', r.obj, 'No object (“I ___”)')}</select>
        <select class="inp" name="who${i}" aria-label="Who does it">${opt('p', r.who || 'p', 'People do it')}${opt('a', r.who, 'People and animals do it')}</select>
      </div>
      <div class="bldw-f f-adj muted small">${L.adjType ? `<select class="inp" name="at${i}" aria-label="Kind of adjective">${opt('i', r.at || L.adjType(r.w), 'い-adjective (おおきい)')}${opt('na', r.at || L.adjType(r.w), 'な-adjective (しずか)')}</select>` : `Forms: ${esc(L.adj(r.w).join(', '))}`}</div>
    </div>`;
  const body = `<p class="muted small" style="margin-top:0">These are words on the cards in <b>${esc(d.name)}</b> that the Sentence Builder doesn't know yet. Tell it what kind of word each one is and it will mix them into your sentences. I've made a guess where I could (${L.intro}</p>
    ${rows.length ? `<div class="bldw-list">${rows.map(row).join('')}</div>` : '<p style="margin:0">Every single word on this deck\'s cards is already in the game (or the cards are longer phrases). 👍</p>'}`;
  openDialog({ title: '📚 Add words from your deck', wide: true, ok: 'Save words', body,
    onOpen: dlg => dlg.querySelector('form').addEventListener('change', e => { if (/^k\d+$/.test(e.target.name)) e.target.closest('.bldw').dataset.k = e.target.value; }),
    onOk: form => {
      const F = n => form.elements[n], keep = new Map((S.bldWords || []).map(m => [bldMineKey(m), m])); let added = 0, bad = '';
      rows.forEach((r, i) => {
        const w = F('w' + i).value, en = F('en' + i).value, k = F('k' + i).value;
        if (!k) { keep.delete(lang + ':' + w); return; }
        const m = { w, en, k, deck: bld.deckId, lang };
        if (F('read' + i)?.value) m.read = F('read' + i).value;
        if (k === 'noun') Object.assign(m, L.noGender ? { cat: F('cat' + i).value } : { g: F('g' + i).value, cat: F('cat' + i).value, pl: F('pl' + i).checked ? F('plw' + i).value.trim().toLowerCase() || null : null });
        if (k === 'adj' && F('at' + i)) m.at = F('at' + i).value;
        if (k === 'verb') { const forms = F('forms' + i).value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean); if (forms.length !== L.nForms) { bad ||= w; return; } Object.assign(m, { forms, obj: F('obj' + i).value, who: F('who' + i).value }); }
        if (!keep.has(lang + ':' + w)) added++; keep.set(lang + ':' + w, m);
      });
      if (bad) { toast(`“${bad}” needs ${L.nForms} verb forms: ${L.forms}`); return false; }
      S.bldWords = [...keep.values()]; save(); bldApplyMine(); bldRound(); render();
      toast(added ? `Added ${added} word${added > 1 ? 's' : ''} to the Sentence Builder` : 'Saved');
    } });
}
Object.assign(actions, { bldWords: () => bldWordsDialog() });

/* ---------------- Drag words into place (or out of the sentence) ---------------- */
// A quick tap still works like before. Move your finger or mouse a little and the word comes with you:
// drop it in the sentence where you want it, or drag it out of the sentence to take it out.
(() => {
  let d = null, noClick = false;
  const lineEl = () => document.querySelector('.bld-line');
  const dropIndex = (line, x, y) => {
    const chips = [...line.querySelectorAll('.bld-chip')].filter(c => +c.dataset.id !== d.id);
    for (let i = 0; i < chips.length; i++) { const r = chips[i].getBoundingClientRect(); if (y < r.top) return i; if (y <= r.bottom && x < r.left + r.width / 2) return i; }
    return chips.length;
  };
  const clearMark = () => { document.querySelectorAll('.bld-mark').forEach(m => m.remove()); lineEl()?.classList.remove('drop'); };
  const end = () => { if (!d) return; d.ghost?.remove(); d.el.classList.remove('dragging'); clearMark(); document.body.classList.remove('bld-dragging'); d = null; };
  document.addEventListener('pointerdown', e => {
    if (view.name !== 'builder' || !bld || bld.done || e.button > 0) return;
    const el = e.target.closest('.bld-chip'); if (!el || el.disabled) return;
    d = { el, id: +el.dataset.id, from: el.closest('.bld-line') ? 'line' : 'tray', x: e.clientX, y: e.clientY, pid: e.pointerId, moved: false, at: null };
  });
  document.addEventListener('pointermove', e => {
    if (!d || e.pointerId !== d.pid) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
      d.moved = true; const r = d.el.getBoundingClientRect();
      d.dx = d.x - r.left; d.dy = d.y - r.top;
      d.ghost = d.el.cloneNode(true); d.ghost.classList.add('bld-ghost'); d.ghost.classList.remove('hint', 'bad'); d.ghost.style.width = r.width + 'px';
      document.body.append(d.ghost); d.el.classList.add('dragging'); document.body.classList.add('bld-dragging');
    }
    e.preventDefault();
    d.ghost.style.transform = `translate(${e.clientX - d.dx}px, ${e.clientY - d.dy}px)`;
    const line = lineEl(); if (!line) return;
    const lr = line.getBoundingClientRect(), inside = e.clientX > lr.left - 24 && e.clientX < lr.right + 24 && e.clientY > lr.top - 24 && e.clientY < lr.bottom + 24;
    const at = inside ? dropIndex(line, e.clientX, e.clientY) : null;
    if (at === d.at && inside === line.classList.contains('drop')) return;
    clearMark(); d.at = at;
    if (inside) {
      line.classList.add('drop');
      const chips = [...line.querySelectorAll('.bld-chip')].filter(c => +c.dataset.id !== d.id), mark = document.createElement('span'); mark.className = 'bld-mark';
      if (chips[at]) chips[at].before(mark); else line.append(mark);
    }
  }, { passive: false });
  document.addEventListener('pointerup', e => {
    if (!d || e.pointerId !== d.pid) return;
    if (!d.moved) { d = null; return; }   // just a tap: the normal click handles it
    noClick = true; setTimeout(() => { noClick = false; }, 400);
    const { id, from, at } = d; end();
    const c = bld.tray.find(t => t.id === id); if (!c || bld.done) return;
    if (bld.frame) { if (c.locked) return; const slot = document.elementFromPoint(e.clientX, e.clientY)?.closest('.bld-slot'); if (at != null) { if (from === 'line') bldUnfill(id, true); bldFill(c, slot ? +slot.dataset.i : null); } else if (from === 'line') bldUnfill(id); return; }
    bld.line = bld.line.filter(x => x !== id);
    if (at != null) { c.used = true; bld.line.splice(Math.min(at, bld.line.length), 0, id); }
    else c.used = false;   // dragged out of the sentence: back to the word list
    Object.assign(bld, { gap: null, msg: null, bad: -1, hint: -1 });
    render();
  });
  document.addEventListener('pointercancel', end);
  // after a drag, don't also treat it as a tap
  document.addEventListener('click', e => { if (noClick && e.target.closest('.bld-chip')) { e.stopPropagation(); e.preventDefault(); noClick = false; } }, true);
})();

/* ---------------- Cold-to-hot meter ---------------- */
// How close is your sentence? Find the longest start of it that is still right (or right so far, just not finished),
// then: finished and correct = hot; right so far = warm, warmer as it gets as long as a full sentence; wrong words after that cool it down.
function bldHeat(line) {
  if (!line.length) return { v: 0, label: 'Start building', icon: '🧊' };
  const check = BLD_LANGS[bld.lang].check, want = Math.max(3, bld.example?.length || 5);
  // "right so far" = the checker had to look past your last word to find a problem (it was waiting for more words)
  const soFar = words => { let past = false; const T = new Proxy(words, { get: (t, key) => { if (typeof key === 'string' && /^\d+$/.test(key) && +key >= t.length) past = true; return t[key]; } });
    const r = check(T); return r.ok ? 2 : r.end || past ? 1 : 0; };
  const score = words => {
    if (!words.length) return 0;
    const full = soFar(words); if (full === 2) return 100;
    let good = 0; if (full) good = words.length; else for (let k = words.length - 1; k > 0; k--) if (soFar(words.slice(0, k))) { good = k; break; }
    return good === words.length ? 40 + 50 * Math.min(1, good / want) : 8 + 40 * Math.min(1, good / want) - 10 * (words.length - good);
  };
  let v = score(line);
  if (v === 100) return { v, label: 'Hot! Press Check', icon: '🔥' };
  // one word in the wrong place or one word too many: still fairly warm
  if (line.length > 1) for (let i = 0; i < line.length; i++) v = Math.max(v, Math.min(score(line.filter((_, j) => j !== i)), 98) - 22);
  v = Math.round(Math.max(3, Math.min(95, v)));
  const [label, icon] = v >= 80 ? ['Very warm, almost there', '♨️'] : v >= 60 ? ['Warm', '☀️'] : v >= 40 ? ['Cool', '🌤️'] : v >= 20 ? ['Cold', '❄️'] : ['Freezing', '🧊'];
  return { v, label, icon };
}
function bldHeatHTML(line) {
  if (S.settings.bldMeter === false) return '';
  const h = bld.done ? { v: 100, label: 'Correct!', icon: '🔥' } : bldHeat(line), from = bld.heatShown ?? h.v;
  bld.heatShown = h.v;
  return `<div class="bld-heat" role="meter" aria-label="How close you are" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${h.v}" aria-valuetext="${esc(h.label)}">
    <div class="bld-heat-bar"><i style="--from:${from}%;--to:${h.v}%"></i></div>
    <div class="bld-heat-l"><span>❄️ Cold</span><b>${h.icon} ${esc(h.label)}</b><span>Hot 🔥</span></div></div>`;
}

/* ---------------- Word order help: the order of the parts of speech ---------------- */
// [type, label] pieces; a label in ( ) means "you can leave it out"
const BLD_ORDER = {
  es: { rows: [
      ['A basic sentence', [['det', '(determiner)'], ['noun', 'noun'], ['adj', '(adjective)'], ['verb', 'verb'], ['det', '(determiner)'], ['noun', 'noun'], ['adj', '(adjective)']]],
      ['Starting with a pronoun', [['pron', 'pronoun'], ['verb', 'verb'], ['det', 'determiner'], ['noun', 'noun']]],
      ['Saying what something is like (ser / estar)', [['det', 'determiner'], ['noun', 'noun'], ['verb', 'ser / estar'], ['adv', '(muy)'], ['adj', 'adjective']]],
      ['Adding where, who with, or for whom', [['pron', 'pronoun'], ['verb', 'verb'], ['prep', 'preposition'], ['det', 'determiner'], ['noun', 'noun']]],
      ['A negative sentence', [['pron', 'pronoun'], ['adv', 'no'], ['verb', 'verb'], ['det', 'determiner'], ['noun', 'noun']]],
      ['Joining two sentences', [['verb', 'sentence'], ['conj', 'conjunction'], ['verb', 'sentence']]],
    ], tips: [
      ['adj', 'Adjectives usually come <b>after</b> the noun.'], ['det', 'Determiners always come <b>before</b> the noun.'],
      ['adv', '<b>no</b>, <b>siempre</b> and <b>nunca</b> go right before the verb. <b>muy</b> goes right before the adjective.'],
      ['adv', '<b>hoy</b>, <b>mañana</b>, <b>ahora</b> and <b>aquí</b> go at the start or the end.'],
      ['pron', 'You can leave out the pronoun, because the verb already shows who.'], ['prep', 'A person you see or visit gets <b>a</b> before them.'] ] },
  en: { rows: [
      ['A basic sentence', [['det', '(determiner)'], ['adj', '(adjective)'], ['noun', 'noun'], ['verb', 'verb'], ['det', '(determiner)'], ['adj', '(adjective)'], ['noun', 'noun']]],
      ['Starting with a pronoun', [['pron', 'pronoun'], ['verb', 'verb'], ['det', 'determiner'], ['noun', 'noun']]],
      ['Saying what something is like', [['det', 'determiner'], ['noun', 'noun'], ['verb', 'am / is / are'], ['adv', '(very)'], ['adj', 'adjective']]],
      ['Adding where, who with, or for whom', [['pron', 'pronoun'], ['verb', 'verb'], ['prep', 'preposition'], ['det', 'determiner'], ['noun', 'noun']]],
      ['A negative sentence', [['pron', 'pronoun'], ['verb', "don't / doesn't"], ['verb', 'verb'], ['det', 'determiner'], ['noun', 'noun']]],
      ['Joining two sentences', [['verb', 'sentence'], ['conj', 'conjunction'], ['verb', 'sentence']]],
    ], tips: [
      ['adj', 'Adjectives come <b>before</b> the noun.'], ['det', 'Determiners come before the noun (and before any adjective).'],
      ['adv', '<b>always</b> and <b>never</b> go right before the verb. <b>very</b> goes right before the adjective.'],
      ['adv', '<b>today</b>, <b>now</b> and <b>here</b> go at the end.'], ['pron', 'English always needs a subject: a pronoun or a noun.'] ] },
};
function bldOrderDialog() {
  const O = BLD_ORDER[bld.lang] || BLD_ORDER.es, piece = ([t, l]) => `<span class="bld-op t-${t}${/^\(/.test(l) ? ' bld-opt' : ''}">${esc(l.replace(/[()]/g, ''))}</span>`;
  openDialog({ title: `❓ Word order in ${BLD_LANGS[bld.lang].name}`, ok: 'Got it', wide: true, onOk: () => {},
    body: `<p class="muted small" style="margin-top:0">Put the parts of speech in this order. Dashed boxes are optional.</p>
      ${O.rows.map(([name, ps]) => `<div class="bld-orow"><div class="small"><b>${esc(name)}</b></div><div class="bld-ops">${ps.map(piece).join('<span class="bld-arr">→</span>')}</div></div>`).join('')}
      <div class="bld-otips">${O.tips.map(([t, s]) => `<div class="t-${t}"><i></i><span>${s}</span></div>`).join('')}</div>` });
  document.querySelector('#dlg [data-dlg=cancel]')?.remove();
}
Object.assign(actions, { bldOrder: () => bldOrderDialog() });

/* Phones: the sentence stays on one line, with no scrolling. The word boxes shrink until it fits; when space is tight the
   little type labels are hidden (each box keeps its color). A sentence too long even then wraps onto a second line. */
function bldShowEnd() {
  const line = document.querySelector('.bld-line'); if (!line) return;
  line.classList.remove('tight', 'wrap'); line.style.removeProperty('--bf');
  if (!matchMedia('(max-width:640px)').matches) return;
  const fits = () => line.scrollWidth <= line.clientWidth + 1;
  for (const px of [15, 14, 13, 12, 11, 10]) {
    line.style.setProperty('--bf', px + 'px'); line.classList.toggle('tight', px <= 12);
    if (fits()) return;
  }
  // still too long: use a second line rather than scrolling, at a size that's comfortable to read
  line.style.setProperty('--bf', '13px'); line.classList.add('tight', 'wrap');
}

/* When the Sentence Builder opens, labeled words from the deck are added by themselves, verbs with their real forms
   (ES_IRREG_FORMS). Verbs ending in -se, and weather verbs, are left out: the game can't check "me / te / se" yet. */
const BLD_IRREGULAR = /^(ser|estar|ir|tener|hacer|poder|querer|decir|venir|poner|salir|saber|conocer|dar|ver|oír|traer|caer|conducir|traducir|construir|oler|reír|haber|caber|valer|andar|producir|pedir|servir|repetir|seguir|conseguir|elegir|sentir|preferir|mentir|dormir|morir|jugar|pensar|empezar|comenzar|cerrar|despertar|entender|perder|querer|volver|mover|poder|contar|costar|encontrar|recordar|mostrar|probar|soñar|volar|almorzar|acostar|llover|nevar|vestir|medir|reír|sonreír|freír|huir|incluir|destruir|leer|creer|oír|parecer|ofrecer|crecer|nacer|merecer|agradecer|obedecer|aparecer|desaparecer|reconocer)$/;
function bldAutoAdd(deckId) {
  let cands; try { cands = bldCandidates(deckId); } catch { return 0; }
  if (!cands) return 0;
  const mine = (S.bldWords ||= []), have = new Set(mine.map(bldMineKey)); let n = 0;
  for (const c of cands) {
    const L = BLD_MINE[c.lang], key = c.lang + ':' + c.w;
    if (!c.fromLabel || !c.k || have.has(key)) continue;
    if (c.k === 'verb' && c.lang === 'es' && ES_NO_PERSON_VERBS.test(c.w)) continue;   // weather verbs have no yo/tú forms
    const e = { w: c.w, en: c.en, k: c.k, deck: deckId, auto: true, lang: c.lang, ...(c.read ? { read: c.read } : {}) };
    if (c.k === 'noun') Object.assign(e, L.noGender ? { cat: 'thing' } : { g: c.g, cat: 'thing', pl: L.pl(c.w) });
    if (c.k === 'adj' && L.adjType) e.at = L.adjType(c.w);
    if (c.k === 'verb') Object.assign(e, { forms: L.conj(c.w), obj: L.refl(c.w) ? 'in' : 'tr', who: 'p' });
    mine.push(e); have.add(key); n++;
  }
  if (n) save();
  return n;
}
{ const openBuilder = startBuilder;
  startBuilder = function (deckId) {
    const n = bldAutoAdd(deckId);
    openBuilder(deckId);
    if (n) toast(`🏷️ Added ${n} word${n === 1 ? '' : 's'} from this deck's word labels. Check them in 📚 Add my deck's words.`);
  }; }

/* 🔀 New words with "Keep my sentence" on: the words already in your sentence stay; only the word list below changes.
   The new list always holds a full sentence of its own (for 💡 Hint), plus look-alike words. */
function bldNewWords(keep) {
  const kept = keep ? bld.line.map(id => bld.tray.find(t => t.id === id)).filter(Boolean) : [];
  bldRound();
  if (!kept.length) return;
  const have = new Set(kept.map(c => c.w)), sentenceIds = new Set(bld.example.map(w => w.id));
  bld.tray = [...kept.map(c => ({ ...c, used: true })), ...bld.tray.filter(c => sentenceIds.has(c.id) || !have.has(c.w))];
  bld.line = kept.map(c => c.id);
  bld.msg = '🔀 New words below. Your sentence is still here.';
}
Object.assign(actions, { bldNew: () => { if (!bld.done) bld.streak = 0; bldNewWords(!bld.done && S.settings.bldKeep !== false); render(); } });

/* 🎯 Practice certain parts of speech: pick all of them, or just some (verbs, nouns…).
   New sentences then use the types you picked, and the extra words below the sentence are only those types.
   The sentence still gets whatever else it needs to be correct (a verb needs a subject, a noun may need an article). */
const bldPosSel = () => { const v = S.settings.bldPos; return Array.isArray(v) && v.length && v.length < Object.keys(BLD_TYPES).length ? v.filter(k => BLD_TYPES[k]) : null; };
function bldPosPicker() {
  const sel = bldPosSel(), on = k => !sel || sel.includes(k);
  return `<div class="bld-pos" role="group" aria-label="Parts of speech to practice"><span class="muted small">🎯 Practice:</span>
    <button type="button" class="bld-pos-b all ${sel ? '' : 'on'}" data-act="bldPos" data-k="all" aria-pressed="${!sel}">All</button>
    ${Object.entries(BLD_TYPES).filter(([k]) => (BLD_LANGS[bld?.lang]?.types || Object.keys(BLD_TYPES).filter(x => x !== 'part')).includes(k)).map(([k, [name]]) => `<button type="button" class="bld-pos-b t-${k} ${sel && on(k) ? 'on' : ''}" data-act="bldPos" data-k="${k}" aria-pressed="${!!(sel && on(k))}">${name}s</button>`).join('')}</div>`;
}
const bldGenOne = () => BLD_LANGS[bld.lang].gen(bld.pref) || BLD_LANGS[bld.lang].gen(new Set());
const bldRoundAll = bldRound;
bldRound = function () {
  const sel = bldPosSel(); if (!sel) return bldRoundAll();
  const types = g => new Set(g.words.map(bldType)), score = g => sel.filter(k => types(g).has(k)).length;
  let g = bldGenOne(), best = score(g);
  for (let i = 0; i < 60 && best < sel.length; i++) { const x = bldGenOne(); if (!x) continue; const sc = score(x); if (sc > best) { g = x; best = sc; } }
  // the extra words: only the picked types, gathered from a few more sentences
  const have = new Set(g.words.map(w => w.w)), pool = [];
  const take = c => { if (sel.includes(bldType(c)) && !have.has(c.w)) { have.add(c.w); pool.push(chip({ ...c })); } };
  g.extra.forEach(take);
  for (let i = 0; i < 25 && pool.length < 10; i++) { const x = bldGenOne(); if (x) [...x.words, ...x.extra].forEach(take); }
  const tray = shuffle([...g.words, ...shuffle(pool).slice(0, Math.max(4, 14 - g.words.length))]).map(c => ({ ...c, used: false }));
  Object.assign(bld, { heatShown: 0, gap: null, tray, line: [], example: g.words, english: g.english, msg: null, bad: -1, fails: 0, done: false, hint: -1, showEx: false });
};
Object.assign(actions, {
  bldPos: el => {
    const all = Object.keys(BLD_TYPES), k = el.dataset.k; let sel = bldPosSel();
    if (k === 'all') sel = null;
    else if (!sel) sel = [k];   // from "All", tapping a type picks just that type
    else sel = sel.includes(k) ? sel.filter(x => x !== k) : [...sel, k];
    S.settings.bldPos = sel && sel.length && sel.length < all.length ? sel : null; save();
    if (!bld.done) bld.streak = 0;
    bldNewWords(!bld.done && S.settings.bldKeep !== false); render();
  },
});

/* ✏️ Fill-in mode: when you practice only some word types, the other words of the sentence are put in place and locked,
   and you fill the blanks from a word list that has only the types you picked (just nouns, just verbs…). */
const bldPosNames = () => { const s = bldPosSel() || []; const n = s.map(k => BLD_TYPES[k][0] + 's'); return n.length > 1 ? n.slice(0, -1).join(', ') + ' and ' + n.at(-1) : n[0] || 'words'; };
function bldFrameLine() { bld.line = bld.frame.map((f, i) => f.fixed ?? bld.fill[i]).filter(x => x != null); }
function bldFill(c, at) {
  let i = at != null && bld.frame[at] && !bld.frame[at].fixed ? at : bld.slotSel != null && bld.fill[bld.slotSel] == null ? bld.slotSel : bld.frame.findIndex((f, j) => !f.fixed && bld.fill[j] == null);
  if (i < 0) { bld.msg = '✏️ Every blank is full. Tap a word in the sentence to take it out first.'; return render(); }
  if (bld.fill[i] != null) bldUnfill(bld.fill[i], true);
  bld.fill[i] = c.id; c.used = true; bld.filled.push(c.id); bld.slotSel = null; bldFrameLine();
  Object.assign(bld, { msg: null, bad: -1, hint: -1 }); render();
}
function bldUnfill(id, quiet) {
  const i = bld.fill.indexOf(id); if (id == null || i < 0) return quiet ? null : render();
  bld.fill[i] = null; bld.filled = bld.filled.filter(x => x !== id); const c = bld.tray.find(t => t.id === id); if (c) c.used = false;
  bld.slotSel = i; bldFrameLine(); Object.assign(bld, { msg: null, bad: -1, hint: -1 }); if (!quiet) render();
}
function bldFrameHtml(chipH) {
  return bld.frame.map((f, i) => {
    if (f.fixed != null) { const c = bld.tray.find(t => t.id === f.fixed); return chipH(c, 'line', bld.line.indexOf(c.id)).replace('<button type="button" class="bld-chip', '<button type="button" disabled class="bld-chip locked'); }
    const id = bld.fill[i]; if (id != null) return chipH(bld.tray.find(t => t.id === id), 'line', bld.line.indexOf(id));
    return `<button type="button" class="bld-chip bld-slot t-${f.type}${bld.slotSel === i ? ' sel' : ''}" data-act="bldSlot" data-i="${i}" ${bld.done ? 'disabled' : ''} aria-label="Blank: ${esc(BLD_TYPES[f.type][0])}">${bld.tags ? `<span class="t">${esc(BLD_TYPES[f.type][0])}</span>` : ''}<span class="w">＿＿</span></button>`;
  }).join('');
}
const bldRoundPicked = bldRound;
bldRound = function () {
  bld.frame = null;
  const sel = bldPosSel(); if (!sel) return bldRoundPicked();
  // a sentence that has at least one of the picked types (try a few)
  let tries = 0; do { bldRoundPicked(); } while (++tries < 120 && !bld.example.some(w => sel.includes(bldType(w))));
  if (!bld.example.some(w => sel.includes(bldType(w)))) return;   // none found: plain round
  const ids = new Set(bld.example.map(w => w.id));
  bld.frame = bld.example.map(w => sel.includes(bldType(w)) ? { type: bldType(w) } : { fixed: w.id });
  bld.tray.forEach(t => { if (ids.has(t.id) && !sel.includes(bldType(t))) { t.used = true; t.locked = true; } });
  bld.tray = bld.tray.filter(t => t.locked || sel.includes(bldType(t)));   // the word list: only the picked types
  Object.assign(bld, { fill: bld.frame.map(() => null), filled: [], slotSel: null }); bldFrameLine();
};
const bldNewWordsBase = bldNewWords;
bldNewWords = keep => bldPosSel() ? bldRound() : bldNewWordsBase(keep);
Object.assign(actions, { bldSlot: el => { if (!bld?.frame || bld.done) return; bld.slotSel = +el.dataset.i; bld.msg = '✏️ Now tap a word below to put it in that blank.'; render(); } });
