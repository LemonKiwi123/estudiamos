'use strict';
/* ================= Sentence Builder: Catalan =================
   Same idea as Italian: every word on the tray is one analysed word (a "chip"), and the checker explains the first mistake.
   Catalan checks: el / l' / la / els / les and un / una / uns / unes agree with the noun (l' before a vowel or h, but
   "la" before an unstressed i or u: la idea); a + el = al, de + el = del (a + els = als, de + els = dels), but "a l'",
   "a la", "de la" stay apart; possessives always come with the article (el meu llibre, la meva mare); no before the verb,
   and no … mai; most adjectives after the noun, a few (bo, gran, petit, nou, vell, jove) before or after it (bon before a
   noun); ser for what something is like, estar for how someone feels (estic cansat), either for where (soc a casa);
   tenir gana / set / son (not estar); the subject can be left out (menjo = I eat); the past with anar + the infinitive
   (vaig menjar = I ate); reflexive verbs (em llevo, em vaig llevar); the verb agrees with the subject.
   Loaded after builder.js and builder-it.js. */

const caVowel = w => /^h?[aeiouàèéíïòóúü]/i.test(w || '');
// a feminine word starting with an unstressed i or u keeps "la": la idea, la universitat, la història (but l'illa, l'hora)
const CA_LA_STRESSED = /^(illa|illes|una|unes|ungla|ungles|índia|índex|urna|urnes|ira|hidra)$/i;
function caElide(w, g) {
  if (!caVowel(w)) return false;
  if (/^h?[iu][aeiouàèéíòóú]/i.test(w)) return false;              // el iogurt, la iaia, el hiat: i / u before a vowel is not a vowel sound
  if (g === 'f' && /^h?[iu]/i.test(w) && !CA_LA_STRESSED.test(w)) return false;
  return true;
}
//            word         form  gender  English          form: 0 jo, 1 tu, 2 ell/ella, 3 nosaltres, 4 vosaltres, 5 ells/elles
const CA_PRON = [['jo', 0, 'x', 'I'], ['tu', 1, 'x', 'you'], ['ell', 2, 'm', 'he'], ['ella', 2, 'f', 'she'], ['nosaltres', 3, 'x', 'we'], ['vosaltres', 4, 'x', 'you'],
  ['ells', 5, 'm', 'they'], ['elles', 5, 'f', 'they']];
const CA_FORM = [[1, 's'], [2, 's'], [3, 's'], [1, 'p'], [2, 'p'], [3, 'p']];
// the definite article for a noun (or for the word right after the article)
function caDef(g, num, next, ng) {
  if (num === 'p') return g === 'f' ? 'les' : 'els';
  if (caElide(next, ng || g)) return "l'";
  return g === 'f' ? 'la' : 'el';
}
// a / de / per + el or els join up: al, als, del, dels, pel, pels. Everything else stays apart: a l'escola, de la casa.
const CA_CONTR = { a: { el: 'al', els: 'als' }, de: { el: 'del', els: 'dels' }, per: { el: 'pel', els: 'pels' } };
const caContr = (p, art) => CA_CONTR[p]?.[art] || null;
const caJoin = (...ws) => ws.filter(Boolean).reduce((s, w) => !s ? w : /'$/.test(s) ? s + w : s + ' ' + w, '');
const caPA = (p, art) => caContr(p, art) || caJoin(p, art);   // "al", "a l'", "a la"
// the right determiner for a noun: family + gender + number + the word right after it (+ the noun's gender, for l')
function caWant(fam, g, num, next, ng) {
  const p = num === 'p';
  switch (fam) {
    case 'el': return caDef(g, num, next, ng);
    case 'un': return p ? (g === 'f' ? 'unes' : 'uns') : g === 'f' ? 'una' : 'un';
    case 'aquest': return p ? (g === 'f' ? 'aquestes' : 'aquests') : g === 'f' ? 'aquesta' : 'aquest';
    case 'aquell': return p ? (g === 'f' ? 'aquelles' : 'aquells') : g === 'f' ? 'aquella' : 'aquell';
    case 'dos': return g === 'f' ? 'dues' : 'dos';
    default: return fam;   // tres
  }
}
//            word      family  kind    English
const CA_DET = [['el', 'el', 'art', 'the'], ["l'", 'el', 'art', 'the'], ['la', 'el', 'art', 'the'], ['els', 'el', 'art', 'the'], ['les', 'el', 'art', 'the'],
  ['un', 'un', 'art', 'a'], ['una', 'un', 'art', 'a'], ['uns', 'un', 'art', 'some'], ['unes', 'un', 'art', 'some'],
  ['aquest', 'aquest', 'dem', 'this'], ['aquesta', 'aquest', 'dem', 'this'], ['aquests', 'aquest', 'dem', 'these'], ['aquestes', 'aquest', 'dem', 'these'],
  ['aquell', 'aquell', 'dem', 'that'], ['aquella', 'aquell', 'dem', 'that'], ['aquells', 'aquell', 'dem', 'those'], ['aquelles', 'aquell', 'dem', 'those'],
  ['dos', 'dos', 'num', 'two'], ['dues', 'dos', 'num', 'two'], ['tres', 'tres', 'num', 'three']];
//            m sing    f sing     m plural    f plural     English
const CA_POSS = [['meu', 'meva', 'meus', 'meves', 'my'], ['teu', 'teva', 'teus', 'teves', 'your'], ['seu', 'seva', 'seus', 'seves', 'his/her'],
  ['nostre', 'nostra', 'nostres', 'nostres', 'our'], ['vostre', 'vostra', 'vostres', 'vostres', 'your']];
const caIdx = (g, num) => (num === 'p' ? 2 : 0) + (g === 'f' ? 1 : 0);
//            singular   plural   g    kind      English one / many   can't count (2: or one cup / scoop)   a place: 'bare' = "a casa" with no article   family
const CA_NOUN = [
  ['home', 'homes', 'm', 'person', 'man', 'men'], ['dona', 'dones', 'f', 'person', 'woman', 'women'], ['noi', 'nois', 'm', 'person', 'boy', 'boys'], ['noia', 'noies', 'f', 'person', 'girl', 'girls'],
  ['amic', 'amics', 'm', 'person', 'friend', 'friends'], ['amiga', 'amigues', 'f', 'person', 'friend', 'friends'], ['mare', null, 'f', 'person', 'mother', null, 0, null, 1], ['pare', null, 'm', 'person', 'father', null, 0, null, 1],
  ['germà', 'germans', 'm', 'person', 'brother', 'brothers', 0, null, 1], ['germana', 'germanes', 'f', 'person', 'sister', 'sisters', 0, null, 1], ['professor', 'professors', 'm', 'person', 'teacher', 'teachers'],
  ['metge', 'metges', 'm', 'person', 'doctor', 'doctors'], ['nen', 'nens', 'm', 'person', 'child', 'children'], ['estudiant', 'estudiants', 'm', 'person', 'student', 'students'],
  ['gos', 'gossos', 'm', 'animal', 'dog', 'dogs'], ['gat', 'gats', 'm', 'animal', 'cat', 'cats'], ['ocell', 'ocells', 'm', 'animal', 'bird', 'birds'], ['cavall', 'cavalls', 'm', 'animal', 'horse', 'horses'],
  ['pa', null, 'm', 'food', 'bread', null, 1], ['arròs', null, 'm', 'food', 'rice', null, 1], ['formatge', null, 'm', 'food', 'cheese', null, 1], ['pollastre', null, 'm', 'food', 'chicken', null, 1],
  ['carn', null, 'f', 'food', 'meat', null, 1], ['sopa', null, 'f', 'food', 'soup', null, 2], ['gelat', null, 'm', 'food', 'ice cream', null, 2],
  ['poma', 'pomes', 'f', 'food', 'apple', 'apples'], ['pastís', 'pastissos', 'm', 'food', 'cake', 'cakes'], ['galeta', 'galetes', 'f', 'food', 'cookie', 'cookies'], ['taronja', 'taronges', 'f', 'food', 'orange', 'oranges'],
  ['aigua', null, 'f', 'drink', 'water', null, 1], ['llet', null, 'f', 'drink', 'milk', null, 1], ['cafè', null, 'm', 'drink', 'coffee', null, 2], ['suc', null, 'm', 'drink', 'juice', null, 2], ['te', null, 'm', 'drink', 'tea', null, 2],
  ['llibre', 'llibres', 'm', 'read', 'book', 'books'], ['carta', 'cartes', 'f', 'read', 'letter', 'letters'], ['revista', 'revistes', 'f', 'read', 'magazine', 'magazines'], ['diari', 'diaris', 'm', 'read', 'newspaper', 'newspapers'],
  ['casa', 'cases', 'f', 'place', 'house', 'houses', 0, 'bare'], ['ciutat', 'ciutats', 'f', 'place', 'city', 'cities', 0, 'art'], ['escola', 'escoles', 'f', 'place', 'school', 'schools', 0, 'art'], ['parc', 'parcs', 'm', 'place', 'park', 'parks', 0, 'art'],
  ['platja', 'platges', 'f', 'place', 'beach', 'beaches', 0, 'art'], ['botiga', 'botigues', 'f', 'place', 'store', 'stores', 0, 'art'], ['restaurant', 'restaurants', 'm', 'place', 'restaurant', 'restaurants', 0, 'art'],
  ['mercat', 'mercats', 'm', 'place', 'market', 'markets', 0, 'art'], ['oficina', 'oficines', 'f', 'place', 'office', 'offices', 0, 'art'], ['cuina', 'cuines', 'f', 'place', 'kitchen', 'kitchens', 0, 'art'],
  ['biblioteca', 'biblioteques', 'f', 'place', 'library', 'libraries', 0, 'art'], ['església', 'esglésies', 'f', 'place', 'church', 'churches', 0, 'art'], ['estació', 'estacions', 'f', 'place', 'station', 'stations', 0, 'art'],
  ['zoo', 'zoos', 'm', 'place', 'zoo', 'zoos', 0, 'art'],
  ['cotxe', 'cotxes', 'm', 'thing', 'car', 'cars'], ['taula', 'taules', 'f', 'thing', 'table', 'tables'], ['cadira', 'cadires', 'f', 'thing', 'chair', 'chairs'], ['telèfon', 'telèfons', 'm', 'thing', 'phone', 'phones'],
  ['pilota', 'pilotes', 'f', 'thing', 'ball', 'balls'], ['flor', 'flors', 'f', 'thing', 'flower', 'flowers'], ['porta', 'portes', 'f', 'thing', 'door', 'doors'], ['finestra', 'finestres', 'f', 'thing', 'window', 'windows'],
  ['regal', 'regals', 'm', 'thing', 'gift', 'gifts'], ['bicicleta', 'bicicletes', 'f', 'thing', 'bike', 'bikes'], ['motxilla', 'motxilles', 'f', 'thing', 'backpack', 'backpacks'], ['mirall', 'miralls', 'm', 'thing', 'mirror', 'mirrors'],
  ['rellotge', 'rellotges', 'm', 'thing', 'watch', 'watches'],
  // how you feel: Catalan says "tinc gana" (I have hunger), with no article
  ['gana', null, 'f', 'feel', 'hungry'], ['set', null, 'f', 'feel', 'thirsty'], ['fred', null, 'm', 'feel', 'cold'], ['calor', null, 'f', 'feel', 'hot'], ['por', null, 'f', 'feel', 'scared'], ['son', null, 'f', 'feel', 'sleepy']];
const CA_OPENABLE = ['porta', 'finestra', 'llibre', 'revista', 'botiga', 'oficina', 'restaurant', 'biblioteca', 'diari', 'carta', 'regal', 'motxilla'];
//            m sing     f sing     m plural    f plural    English      describes   both = before or after the noun, post = after it   ser / estar: s = ser, e = estar, b = either
const CA_ADJ = [['bo', 'bona', 'bons', 'bones', 'good', 'pafrl', 'both', 's'], ['dolent', 'dolenta', 'dolents', 'dolentes', 'bad', 'paf', 'post', 's'],
  ['gran', 'gran', 'grans', 'grans', 'big', 'patl', 'both', 's'], ['petit', 'petita', 'petits', 'petites', 'small', 'patl', 'both', 's'],
  ['nou', 'nova', 'nous', 'noves', 'new', 'tlr', 'both', 's'], ['vell', 'vella', 'vells', 'velles', 'old', 'patlr', 'both', 's'],
  ['bonic', 'bonica', 'bonics', 'boniques', 'pretty', 'patl', 'post', 's'], ['jove', 'jove', 'joves', 'joves', 'young', 'pa', 'both', 's'],
  ['vermell', 'vermella', 'vermells', 'vermelles', 'red', 'tf', 'post', 's'], ['blau', 'blava', 'blaus', 'blaves', 'blue', 't', 'post', 's'], ['verd', 'verda', 'verds', 'verdes', 'green', 'tf', 'post', 's'],
  ['negre', 'negra', 'negres', 'negres', 'black', 'at', 'post', 's'], ['blanc', 'blanca', 'blancs', 'blanques', 'white', 'atf', 'post', 's'], ['groc', 'groga', 'grocs', 'grogues', 'yellow', 'tf', 'post', 's'],
  ['car', 'cara', 'cars', 'cares', 'expensive', 'tflr', 'post', 's'], ['fàcil', 'fàcil', 'fàcils', 'fàcils', 'easy', 'r', 'post', 's'], ['difícil', 'difícil', 'difícils', 'difícils', 'hard', 'r', 'post', 's'],
  ['ràpid', 'ràpida', 'ràpids', 'ràpides', 'fast', 'pat', 'post', 's'], ['simpàtic', 'simpàtica', 'simpàtics', 'simpàtiques', 'nice', 'p', 'post', 's'], ['intel·ligent', 'intel·ligent', 'intel·ligents', 'intel·ligents', 'smart', 'p', 'post', 's'],
  ['feliç', 'feliç', 'feliços', 'feliços', 'happy', 'pa', 'post', 'b'], ['trist', 'trista', 'tristos', 'tristes', 'sad', 'pa', 'post', 'b'], ['deliciós', 'deliciosa', 'deliciosos', 'delicioses', 'delicious', 'f', 'post', 'b'],
  ['fred', 'freda', 'freds', 'fredes', 'cold', 'fl', 'post', 'b'], ['calent', 'calenta', 'calents', 'calentes', 'hot', 'f', 'post', 'b'], ['net', 'neta', 'nets', 'netes', 'clean', 'tl', 'post', 'b'], ['brut', 'bruta', 'bruts', 'brutes', 'dirty', 'tl', 'post', 'b'],
  ['cansat', 'cansada', 'cansats', 'cansades', 'tired', 'pa', 'post', 'e'], ['content', 'contenta', 'contents', 'contentes', 'glad', 'pa', 'post', 'b'], ['malalt', 'malalta', 'malalts', 'malaltes', 'sick', 'pa', 'post', 'e']];
// before the noun, bo turns into bon (un bon amic); the others don't change
const caAdjPre = (a, g, num) => a[0] === 'bo' && g === 'm' && num === 's' ? 'bon' : a[caIdx(g, num)];
//            infinitive  jo, tu, ell/ella, nosaltres, vosaltres, ells/elles             kind     what it takes   needs one  English        he/she form    who   reflexive  past
const CA_VERB = [['menjar', ['menjo', 'menges', 'menja', 'mengem', 'mengeu', 'mengen'], 'tr', ['food'], 0, 'eat', 'eats', 'a', 0, 'ate'],
  ['beure', ['bec', 'beus', 'beu', 'bevem', 'beveu', 'beuen'], 'tr', ['drink'], 0, 'drink', 'drinks', 'a', 0, 'drank'],
  ['preparar', ['preparo', 'prepares', 'prepara', 'preparem', 'prepareu', 'preparen'], 'tr', ['food', 'drink'], 0, 'make', 'makes', 'p', 0, 'made'],
  ['llegir', ['llegeixo', 'llegeixes', 'llegeix', 'llegim', 'llegiu', 'llegeixen'], 'tr', ['read'], 0, 'read', 'reads', 'p', 0, 'read'],
  ['escriure', ['escric', 'escrius', 'escriu', 'escrivim', 'escriviu', 'escriuen'], 'tr', ['read'], 0, 'write', 'writes', 'p', 0, 'wrote'],
  ['comprar', ['compro', 'compres', 'compra', 'comprem', 'compreu', 'compren'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'buy', 'buys', 'p', 0, 'bought'],
  ['vendre', ['venc', 'vens', 'ven', 'venem', 'veneu', 'venen'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'sell', 'sells', 'p', 0, 'sold'],
  ['tenir', ['tinc', 'tens', 'té', 'tenim', 'teniu', 'tenen'], 'tenir', ['*'], 1, 'have', 'has', 'a', 0, 'had'],
  ['voler', ['vull', 'vols', 'vol', 'volem', 'voleu', 'volen'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'want', 'wants', 'a', 0, 'wanted'],
  ['buscar', ['busco', 'busques', 'busca', 'busquem', 'busqueu', 'busquen'], 'tr', ['*'], 1, 'look for', 'looks for', 'a', 0, 'looked for'],
  ['veure', ['veig', 'veus', 'veu', 'veiem', 'veieu', 'veuen'], 'tr', ['*'], 1, 'see', 'sees', 'a', 0, 'saw'],
  ['mirar', ['miro', 'mires', 'mira', 'mirem', 'mireu', 'miren'], 'tr', ['person', 'animal', 'thing', 'read'], 1, 'look at', 'looks at', 'a', 0, 'looked at'],
  ['estimar', ['estimo', 'estimes', 'estima', 'estimem', 'estimeu', 'estimen'], 'tr', ['*'], 1, 'love', 'loves', 'a', 0, 'loved'],
  ['visitar', ['visito', 'visites', 'visita', 'visitem', 'visiteu', 'visiten'], 'tr', ['place'], 1, 'visit', 'visits', 'p', 0, 'visited'],
  ['obrir', ['obro', 'obres', 'obre', 'obrim', 'obriu', 'obren'], 'tr', ['open'], 1, 'open', 'opens', 'p', 0, 'opened'],
  ['tancar', ['tanco', 'tanques', 'tanca', 'tanquem', 'tanqueu', 'tanquen'], 'tr', ['open'], 1, 'close', 'closes', 'p', 0, 'closed'],
  ['parlar', ['parlo', 'parles', 'parla', 'parlem', 'parleu', 'parlen'], 'in', null, 0, 'talk', 'talks', 'p', 0, 'talked'],
  ['treballar', ['treballo', 'treballes', 'treballa', 'treballem', 'treballeu', 'treballen'], 'in', null, 0, 'work', 'works', 'p', 0, 'worked'],
  ['estudiar', ['estudio', 'estudies', 'estudia', 'estudiem', 'estudieu', 'estudien'], 'in', null, 0, 'study', 'studies', 'p', 0, 'studied'],
  ['jugar', ['jugo', 'jugues', 'juga', 'juguem', 'jugueu', 'juguen'], 'in', null, 0, 'play', 'plays', 'a', 0, 'played'],
  ['córrer', ['corro', 'corres', 'corre', 'correm', 'correu', 'corren'], 'in', null, 0, 'run', 'runs', 'a', 0, 'ran'],
  ['caminar', ['camino', 'camines', 'camina', 'caminem', 'camineu', 'caminen'], 'in', null, 0, 'walk', 'walks', 'a', 0, 'walked'],
  ['dormir', ['dormo', 'dorms', 'dorm', 'dormim', 'dormiu', 'dormen'], 'in', null, 0, 'sleep', 'sleeps', 'a', 0, 'slept'],
  ['viure', ['visc', 'vius', 'viu', 'vivim', 'viviu', 'viuen'], 'in', null, 0, 'live', 'lives', 'a', 0, 'lived'],
  ['anar', ['vaig', 'vas', 'va', 'anem', 'aneu', 'van'], 'anar', null, 1, 'go', 'goes', 'a', 0, 'went'],
  ['ser', ['soc', 'ets', 'és', 'som', 'sou', 'són'], 'ser', null, 1, 'be', 'is', 'a', 0, 'was'],
  ['estar', ['estic', 'estàs', 'està', 'estem', 'esteu', 'estan'], 'estar', null, 1, 'be', 'is', 'a', 0, 'was'],
  // reflexive verbs: the 9th item (1) means they need em / et / es / ens / us right before them
  ['llevar-se', ['llevo', 'lleves', 'lleva', 'llevem', 'lleveu', 'lleven'], 'in', null, 0, 'get up', 'gets up', 'a', 1, 'got up'],
  ['rentar-se', ['rento', 'rentes', 'renta', 'rentem', 'renteu', 'renten'], 'in', null, 0, 'wash up', 'washes up', 'p', 1, 'washed up'],
  ['vestir-se', ['vesteixo', 'vesteixes', 'vesteix', 'vestim', 'vestiu', 'vesteixen'], 'in', null, 0, 'get dressed', 'gets dressed', 'p', 1, 'got dressed'],
  ['despertar-se', ['desperto', 'despertes', 'desperta', 'despertem', 'desperteu', 'desperten'], 'in', null, 0, 'wake up', 'wakes up', 'a', 1, 'woke up']];
// em / et / es / ens / us; before a vowel or h: m' / t' / s'
const CA_REFL = ['em', 'et', 'es', 'ens', 'us', 'es'], CA_REFL_V = ["m'", "t'", "s'", 'ens', 'us', "s'"];
const caReflFor = (f, next) => (caVowel(next) ? CA_REFL_V : CA_REFL)[f];
// the past with anar: vaig, vas, va, vam, vau, van + the infinitive (vaig menjar = I ate). vàrem / vàreu are the older forms.
const CA_PAST = ['vaig', 'vas', 'va', 'vam', 'vau', 'van'], CA_PAST_ALT = { 'vàrem': 3, 'vàreu': 4 };
const caPastF = w => CA_PAST.includes(w) ? CA_PAST.indexOf(w) : CA_PAST_ALT[w] ?? -1;
const caInf = v => v[0].replace(/-se$|'s$/, '');   // llevar-se → llevar
//            word       English       where it goes: edge = start or end · post = right after the verb (sempre / sovint can also go before it) · end = at the end · when: past / now
const CA_ADV = [['avui', 'today', 'edge', 'now'], ['demà', 'tomorrow', 'edge', 'now'], ['ara', 'now', 'edge', 'now'], ['ahir', 'yesterday', 'edge', 'past'], ['sempre', 'always', 'post'], ['sovint', 'often', 'post'],
  ['molt', 'a lot', 'post'], ['bé', 'well', 'post'], ['aquí', 'here', 'end']];
// prepositions, and a / de joined with the article (al, als, del, dels): word, preposition, article, English
const CA_PREP = [['a', 'a', null, 'to / at'], ['amb', 'amb', null, 'with'], ['de', 'de', null, 'of'], ['al', 'a', 'el', 'to the / at the'], ['als', 'a', 'els', 'to the / at the'], ['del', 'de', 'el', 'of the'], ['dels', 'de', 'els', 'of the']];
const CA_CONJ = [['i', 'and'], ['però', 'but'], ['o', 'or']];
const CA_KIND = { food: 'food', drink: 'drinks', read: 'things you read or write', thing: 'things', place: 'places', animal: 'animals', person: 'people', open: 'things you can open' };
const CA_HOW_VERBS = /^(parlar|treballar|estudiar|jugar|córrer|caminar|dormir|menjar|beure|llegir|escriure)$/;   // verbs that go with bé / molt

/* chips (each one carries its own English for the word tag) */
const caChip = o => chip({ ...o, gloss: o.gloss || o.en });
const caPron = p => caChip({ k: 'pron', w: p[0], f: p[1], per: CA_FORM[p[1]][0], num: CA_FORM[p[1]][1], g: p[2], en: p[3] });
const caPronW = w => caPron(CA_PRON.find(p => p[0] === w));
const caDetW = w => { const d = CA_DET.find(x => x[0] === w); return caChip({ k: 'det', w, fam: d[1], cls: d[2], en: d[3] }); };
const caPossW = (row, w) => caChip({ k: 'det', w, fam: row[0], cls: 'poss', e: row, en: row[4] });
const caNoun = (n, num) => caChip({ k: 'noun', w: num === 'p' ? n[1] : n[0], e: n, g: n[2], num, cat: n[3], mass: !!n[6], fam: !!n[8], en: num === 'p' ? n[5] : n[4] });
const caAdj = (a, w) => caChip({ k: 'adj', w, e: a, en: a[4], pos: a[6] });
const caVerb = (v, f) => caChip({ k: 'verb', w: v[1][f], e: v, f, type: v[2], en: v[5], gloss: 'to ' + v[5] });
const caAux = f => caChip({ k: 'verb', w: CA_PAST[f], e: CA_VERB.find(v => v[0] === 'anar'), f, type: 'anar', aux: true, en: '(past)', gloss: 'did (past)' });
const caInfW = v => caChip({ k: 'verb', w: caInf(v), e: v, inf: true, type: v[2], en: v[5], gloss: 'to ' + v[5] });
const caRefl = (w, f) => caChip({ k: 'refl', w, f, en: 'oneself' });
const caPrep = w => { const p = CA_PREP.find(x => x[0] === w); return caChip({ k: 'prep', w, base: p[1], art: p[2], en: p[3] }); };
const caConj = w => caChip({ k: 'conj', w, en: CA_CONJ.find(c => c[0] === w)[1] });
const caAdv = w => { const a = CA_ADV.find(x => x[0] === w); return caChip({ k: 'adv', w, en: a[1], pos: a[2], when: a[3] }); };
const caNo = () => caChip({ k: 'neg', w: 'no', en: 'not' });
const caMai = () => caChip({ k: 'pas', w: 'mai', en: 'never' });
const caMolt = () => caChip({ k: 'int', w: 'molt', en: 'very' });
// the way you say "to / at" a place: a casa, a l'escola, al parc, a la platja
const caPlaceText = (n, num = 's') => { const w = num === 'p' ? n.e[1] : n.e[0]; return n.e[7] === 'bare' ? 'a ' + w : caJoin(caPA('a', caDef(n.g, num, w)), w); };
// a verb chip that can be the past helper: vaig / vas / va / vam / vau / van (the same words as "I go"… for the first three and the last)
const caIsAux = t => t && t.k === 'verb' && !t.inf && (t.aux || (t.e?.[0] === 'anar' && caPastF(t.w) >= 0));

/* ---------------- Catalan checker ---------------- */
function caCheck(T) {
  let i = 0;
  const err = (msg, at = i) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length }), peek = (o = 0) => T[i + o], isErr = x => x && x.ok === false;
  if (!T.length) return err('Tap some words to build a sentence.');
  const gName = g => g === 'f' ? 'feminine' : 'masculine', nName = n => n === 'p' ? 'plural' : 'singular', cap = s => s[0].toUpperCase() + s.slice(1);
  const isMolt = t => t && t.w === 'molt' && (t.k === 'int' || t.k === 'adv');
  const isDeArt = t => t && t.k === 'prep' && t.base === 'de' && t.art;
  const npText = np => np.coord ? np.coord.map(npText).join(' i ') : caJoin(np.det?.w, np.poss?.w, np.pre?.w, np.n.w, np.molt ? 'molt' : '', np.post?.w);
  // a noun phrase: (article) (possessive) (adjective that can go before) noun (molt) (adjective) (de + noun).
  // fixed = the article already inside "al" / "del" (al parc, del meu germà)
  function NP(role, fixed) {
    const start = i; let det = null, poss = null, pre = null, post = null, molt = false, of = null;
    if (fixed) det = { w: fixed.art, fam: 'el', cls: 'art', en: 'the', joined: fixed.p };
    if (fixed) {
      if (peek()?.k === 'det' && peek().cls !== 'poss') return err(`“${fixed.p.w}” already means “${fixed.p.base} + ${fixed.art}”, so don’t add another article.`, i);
      if (peek()?.k === 'det') poss = T[i++];   // del meu germà
    } else if (peek()?.k === 'det') {
      const d = T[i];
      if (d.cls === 'poss') { poss = d; i++; }
      else { det = d; i++; if (peek()?.k === 'det' && peek().cls === 'poss') poss = T[i++]; }
    }
    if (isMolt(peek()) && peek(1)?.k === 'adj') return err('Catalan puts “molt” + the describing word after the noun: “una casa molt bonica”.', i);
    if (peek()?.k === 'adj') {
      const a = peek();
      if (a.pos === 'post') { const n = T.slice(i, i + 3).find(t => t.k === 'noun'); return err(`“${a.e[0]}” goes after the noun in Catalan${n ? `: “${caJoin(det?.w, poss?.w, n.w, a.w)}”` : ''}. Only a few words like gran, petit, bo and nou can go before it.`, i); }
      pre = a; i++;
    }
    const n = peek();
    if (!n || n.k !== 'noun') return err(det || poss ? `“${(poss || det.joined || det).w}” comes before a noun, so a noun has to follow it.` : role === 'subj' ? 'Start with who does it: a pronoun like “jo” or “ella”, a noun like “el gos”, or just the verb.' : 'A noun (a person, place or thing) should go here.', det || poss ? i - 1 : i);
    i++;
    if (n.cat === 'feel') return err(`“${n.w}” is a feeling. Catalan says it with tenir and no article: “tinc ${n.w}”.`, start);
    // describing word after the noun
    if (isMolt(peek()) || peek()?.k === 'adj') {
      const at = i; if (isMolt(peek())) { molt = true; i++; }
      const a = peek();
      if (!a || a.k !== 'adj') { if (molt) i = at, molt = false; }
      else {
        if (pre) return err('Use one describing word per noun here.', at);
        const w = a.e[caIdx(n.g, n.num)]; if (a.w !== w) return err(`“${a.w}” has to match “${n.w}” (${gName(n.g)} ${nName(n.num)}): use “${w}”.`, i);
        post = a; i++;
        if (peek()?.k === 'adj') return err('Use one describing word per noun here.');
      }
    }
    if (!det && !poss) {
      const bare = (role === 'obj' || role === 'and') && (n.mass || n.num === 'p');
      if (!bare) return err(`Catalan needs a word like ${n.mass ? `“${caWant('el', n.g, 's', pre ? pre.w : n.w, n.g)}”` : `“${caWant('un', n.g, n.num, pre ? pre.w : n.w, n.g)}” or “${caWant('el', n.g, n.num, pre ? pre.w : n.w, n.g)}”`} before “${n.w}”${n.mass ? ', or nothing at all after a verb like menjar or beure' : ''}.`, start);
    }
    if (poss) {
      const w = poss.e[caIdx(n.g, n.num)];
      if (poss.w !== w) return err(`“${poss.w}” has to match “${n.w}” (${gName(n.g)} ${nName(n.num)}): use “${w}”.`, det && !det.joined ? start + 1 : start);
      if (!det) return err(`Catalan puts the article before “${poss.w}”: “${caJoin(caWant('el', n.g, n.num, poss.w), poss.w, pre?.w, n.w)}”${n.fam ? ' (Catalan keeps it even with family)' : ''}.`, start);
      if (det.fam !== 'el') return err(`Use “${caWant('el', n.g, n.num, poss.w)}” before “${poss.w}”: “${caJoin(caWant('el', n.g, n.num, poss.w), poss.w, n.w)}”.`, start);
    }
    if (det) {
      const after = poss ? poss.w : pre ? pre.w : n.w;
      if (det.cls === 'num' && n.num === 's') return err(`“${det.w}” means more than one, so the noun must be plural${n.e[1] ? `: “${caJoin(caWant(det.fam, n.g, 'p'), n.e[1])}”` : ''}.`, start);
      if (det.fam === 'un' && n.num === 's' && n.mass && n.e[6] !== 2) return err(`You can’t count “${n.w}”, so leave out “${det.w}”: just “${n.w}” (some ${n.en}), or “${caJoin(caWant('el', n.g, 's', after, n.g), after)}” (the).`, start);
      const want = caWant(det.fam, n.g, n.num, after, n.g);
      if (det.joined) {
        if (det.w !== want) return err(caContr(det.joined.base, want) ? `“${n.w}” is ${gName(n.g)} ${nName(n.num)}, so use “${caContr(det.joined.base, want)}”: “${caJoin(caContr(det.joined.base, want), poss?.w, pre?.w, n.w)}”.`
          : `“${det.joined.w}” is “${det.joined.base} + ${det.w}”, but “${n.w}” takes “${want}”${want === "l'" ? ` (it starts with a vowel sound)` : ''}. Keep them apart: “${caJoin(det.joined.base, want, poss?.w, pre?.w, n.w)}”.`, start - 1);
      } else if (det.w !== want) {
        const why = det.fam === 'el' && want === "l'" ? `“${after}” starts with a vowel sound`
          : det.w === "l'" && caVowel(after) && n.g === 'f' ? `before an unstressed i or u, a feminine word keeps “la”`
          : det.w === "l'" ? `“l'” is only used before a vowel sound or h, and “${n.w}” is ${gName(n.g)} ${nName(n.num)}`
          : `“${n.w}” is ${gName(n.g)} ${nName(n.num)}`;
        return err(`${cap(why)}, so use “${want}”: “${caJoin(want, poss?.w, pre?.w, n.w)}”.`, start);
      }
    }
    if (pre) { const w = caAdjPre(pre.e, n.g, n.num); if (pre.w !== w) return err(`“${pre.w}” has to match “${n.w}” (${gName(n.g)} ${nName(n.num)})${pre.e[0] === 'bo' ? '; before a masculine noun, bo turns into bon' : ''}: use “${w}”.`, i - 2); }
    // de + noun: "el llibre del meu germà", "el gos de la noia"
    if (role !== 'of' && peek()?.k === 'prep' && peek().base === 'de') {
      const p = T[i++];
      if (p.art) { const o = NP('of', { p, art: p.art }); if (isErr(o)) return o; of = o; }
      else {
        const d = peek();
        if (d?.k === 'det' && d.cls === 'art' && caContr('de', d.w)) return err(`Catalan joins “de” + “${d.w}” into “${caContr('de', d.w)}”: “${caContr('de', d.w)} ${peek(1)?.w || '…'}”.`, i - 1);
        if (d?.k === 'det' && d.fam === 'un') return err(`Before “${d.w}”, “de” becomes “d'”: “d'${d.w} ${peek(1)?.w || '…'}”. Here, use “el” or “la” instead.`, i - 1);
        if (d?.k === 'noun') return err(`Put “el” or “la” after “de” here: “${caJoin(caPA('de', caDef(d.g, d.num, d.w)), d.w)}”.`, i - 1);
        const o = NP('of'); if (isErr(o)) return o; of = o;
      }
    }
    return { det, poss, n, pre, post, molt, of, num: n.num, g: n.g, cat: n.cat };
  }
  function NPs(role) {
    const a = NP(role); if (isErr(a)) return a;
    const c = peek();
    if (c?.k === 'conj' && (c.w === 'i' || c.w === 'o') && ['det', 'noun', 'adj'].includes(peek(1)?.k)) {
      const save = i; i++;
      const b = NP(role === 'obj' ? 'and' : role);
      if (isErr(b) || (role !== 'subj' && ['verb', 'neg', 'pron', 'refl'].includes(peek()?.k))) { i = save; return a; }
      return { coord: [a, b], conj: c, num: 'p', g: a.g === 'm' || b.g === 'm' ? 'm' : 'f', per: 3, cat: a.cat };
    }
    return a;
  }
  // a / al / als + a place: a casa, a l'escola, al parc, a la platja
  function PLACE(p) {
    if (p.art) { const np = NP('pp', { p, art: p.art }); if (isErr(np)) return np; if (np.n.cat !== 'place') return err(`“${p.w}” + a place here: “al parc”, “al mercat”. “${np.n.w}” isn’t a place.`, i - 1); return { ...np, at: true }; }
    const m0 = peek();
    if (m0?.k === 'det' && m0.cls === 'art' && caContr('a', m0.w)) return err(`Catalan joins “a” + “${m0.w}” into “${caContr('a', m0.w)}”: “${caContr('a', m0.w)} ${peek(1)?.w || '…'}”.`, i - 1);
    if (m0?.k === 'noun') {
      if (m0.cat !== 'place') return err(`“a” + a place here: “a casa”, “a l'escola”, “al parc”. “${m0.w}” isn’t a place.`, i);
      if (m0.e[7] !== 'bare' || m0.num === 'p') return err(`Catalan says “${caPlaceText(m0, m0.num)}”, with the article.`, i - 1);
      i++; return { n: m0, num: m0.num, g: m0.g, cat: m0.cat, bare: true };
    }
    if (!m0 || !['det', 'adj'].includes(m0.k)) return err(`“a” needs a place after it: “a casa”, “a l'escola”, “al parc”.`, i - 1);
    const np = NP('pp'); if (isErr(np)) return np;
    if (np.n.cat !== 'place') return err(`“a” + a place here: “a casa”, “a la platja”, “al parc”. “${np.n.w}” isn’t a place.`, i - 1);
    if (np.n.e[7] === 'bare' && np.num === 's' && np.det?.fam === 'el' && !np.poss) return err('Catalan says “a casa” (home), without the article.', i - 1);
    return { ...np, at: true };
  }
  function clause() {
    const C = { lead: [], subj: null, neg: null, mai: null, refl: null, verb: null, past: null, comp: null, pps: [], tail: [] }, cStart = i;
    while (peek()?.k === 'adv') { const a = peek(); if (a.pos !== 'edge' && !['sempre', 'sovint'].includes(a.w)) return err(`“${a.w}” goes ${a.pos === 'post' ? 'right after the verb' : 'at the end'}, not at the start.`); C.lead.push(T[i++]); }
    if (peek()?.k === 'conj') return err(`“${peek().w}” joins two parts, so it can’t ${i === 0 ? 'start the sentence' : 'go here'}.`);
    if (peek()?.k === 'pron') { const p = T[i++]; C.subj = { pron: p, f: p.f, num: p.num, g: p.g }; }
    else if (['det', 'noun', 'adj'].includes(peek()?.k) || isMolt(peek()) && peek(1)?.k === 'adj') { const s = NPs('subj'); if (isErr(s)) return s; C.subj = s.coord ? { np: s, f: 5, num: 'p', g: s.g } : { np: s, f: s.num === 'p' ? 5 : 2, num: s.num, g: s.g }; }
    // "sempre" / "sovint" can also go after the subject, before the verb: "jo sempre menjo pa"
    while (peek()?.k === 'adv' && ['sempre', 'sovint'].includes(peek().w)) C.lead.push(T[i++]);
    if (peek()?.k === 'pas') return err(`“mai” goes after the verb, and “no” goes before it: “no menjo mai”.`);
    if (peek()?.k === 'neg') { C.neg = T[i++]; if (!['verb', 'refl'].includes(peek()?.k)) return err('“no” goes right before the verb: “no menjo”.', i - 1); }
    if (peek()?.k === 'refl') {
      const at = i; C.refl = T[i++];
      if (peek()?.k === 'neg') return err(`“no” goes before “${C.refl.w}”: “no em llevo”.`, i);
      if (peek()?.k !== 'verb') return err(`“${C.refl.w}” goes right before a verb, like “${/'$/.test(C.refl.w) ? C.refl.w + 'aixeco' : C.refl.w + ' llevo'}”.`, at);
    }
    const v0 = peek(), sText = C.subj ? (C.subj.pron ? C.subj.pron.w : npText(C.subj.np)) : '';
    if (!v0) return err(C.subj ? 'Now add a verb (an action word like “menja” or “és”).' : 'Every sentence needs a verb.');
    if (v0.k !== 'verb') {
      if (v0.k === 'pron' && C.subj) return err('A sentence has only one subject (who does it).');
      if (v0.k === 'adv') return err(`“${v0.w}” goes ${v0.pos === 'post' ? 'right after the verb' : v0.pos === 'end' ? 'at the end' : 'at the start or the end'}.`);
      return err(`After ${C.subj ? `“${sText}”` : 'that'} the next word should be a verb. “${v0.w}” isn’t a verb.`);
    }
    i++;
    let v = v0, f;
    // the past: vaig / vas / va / vam / vau / van + the infinitive (vaig menjar)
    if (caIsAux(v0) && peek()?.k === 'verb' && peek().inf) {
      const pf = caPastF(v0.w), inf = T[i++];
      v = { ...inf, f: pf, w: inf.w }; C.past = v0;
      f = C.subj ? C.subj.f : pf;
      if (C.subj && pf !== f) return err(`“${v0.w}” doesn’t match the subject “${sText}”. Use “${CA_PAST[f]} ${inf.w}”.`, i - 2);
    } else if (v0.inf) return err(`“${v0.w}” is the “to …” form. Use “${v0.e[1][C.subj ? C.subj.f : 0]}” (now), or put “vaig”, “vas”, “va”… before it for the past: “${caJoin(C.refl ? C.refl.w.replace(/^m'$/, 'em').replace(/^t'$/, 'et').replace(/^s'$/, 'es') : '', 'vaig', v0.w)}”.`, i - 1);
    else if (v0.aux && !(peek()?.k === 'verb' && peek().inf)) return err(`“${v0.w}” makes the past: put a verb in the “to …” form right after it, like “${v0.w} menjar”.`, i - 1);
    else f = C.subj ? C.subj.f : v.f;
    if (peek()?.k === 'verb' && !C.past) return err(peek().inf ? `For the past, put “vaig”, “vas”, “va”… right before “${peek().w}”.` : 'One verb per sentence part. Use “i” or “però” to add another.', i);
    C.verb = v; C.f = f;
    const vAt = C.past ? i - 2 : i - 1, reflAt = C.refl ? vAt - 1 : -1, vText = C.past ? caJoin(CA_PAST[f], caInf(v.e)) : v.e[1][f];
    const reflWant = caReflFor(f, C.past ? CA_PAST[f] : v.e[1][f]);
    if (v.e[8] && !C.refl) return err(`“${v.e[0]}” needs “${reflWant}” right before the verb: “${caJoin(reflWant, vText)}”.`, vAt);
    if (C.refl && !v.e[8]) return err(`“${C.refl.w}” only goes with verbs like “llevar-se”. Take it out: just “${C.past ? vText : v.w}”.`, reflAt);
    if (!C.past && C.subj && v.w !== v.e[1][f]) return err(`“${v.w}” doesn’t match the subject “${sText}”. Use “${v.e[1][f]}”.`, vAt);
    if (C.refl && C.refl.w !== reflWant) return err(`“${C.refl.w}” doesn’t match “${C.past ? C.past.w : v.w}”. Use “${caJoin(reflWant, C.past ? C.past.w : v.w)}”.`, reflAt);
    if (C.subj?.np && !['ser', 'estar'].includes(v.type)) for (const part of C.subj.np.coord || [C.subj.np]) {
      const c = part.cat, what = part.num === 'p' || part.n.mass ? part.n.en : (/^[aeiou]/i.test(part.n.en) ? 'an ' : 'a ') + part.n.en;
      if (c !== 'person' && c !== 'animal') return err(`That doesn’t make sense: ${what} can’t ${v.e[5]}. Use a person or an animal here.`, cStart);
      if (c === 'animal' && v.e[7] === 'p') return err(`That doesn’t make sense: ${what} can’t ${v.e[5]}. Only people ${v.e[5]}.`, cStart);
    }
    // no … mai: around the verb
    if (peek()?.k === 'pas') {
      if (C.past) return err('Leave “mai” out here: with the past (vaig …), just say “no vaig …”.', i);
      if (!C.neg) return err(`Catalan puts “no” before the verb too: “${caJoin('no', C.refl?.w, v.w)} mai”.`, i); C.mai = T[i++];
    }
    while ((peek()?.k === 'adv' && peek().pos === 'post') || (isMolt(peek()) && peek(1)?.k !== 'adj')) { const a = T[i++]; C.tail.push(a.k === 'adv' ? a : { ...a, k: 'adv', pos: 'post', en: 'a lot' }); }
    const nx = peek(), sNum = C.subj ? C.subj.num : CA_FORM[f][1], sG = C.subj ? C.subj.g : 'x', vw = C.past ? caInf(v.e) : v.w;
    const isPlacePrep = t => t?.k === 'prep' && t.base === 'a';
    if (v.type === 'ser' || v.type === 'estar') {
      if (!nx || nx.k === 'conj') return err(`“${vw}” needs something after it: a describing word (“${vw} ${sNum === 'p' ? 'contents' : 'content'}”) or a place (“a casa”).`, i - 1);
      if (nx.k === 'adj' || isMolt(nx)) {
        let molt = false; if (isMolt(nx)) { molt = true; i++; if (peek()?.k !== 'adj') return err('“molt” goes right before a describing word: “molt gran”.', i - 1); }
        const a = T[i], m = a.e[caIdx('m', sNum)], fem = a.e[caIdx('f', sNum)];
        if (sG === 'x' ? ![m, fem].includes(a.w) : a.w !== a.e[caIdx(sG, sNum)]) return err(`“${a.w}” has to match the subject (${sG === 'x' ? '' : gName(sG) + ' '}${nName(sNum)}): use “${sG === 'f' ? fem : m}”${sG === 'x' && fem !== m ? ` or “${fem}”` : ''}.`);
        const be = a.e[7] || 'b';
        if (v.type === 'ser' && be === 'e') return err(`“${a.e[0]}” is how someone is right now, so Catalan uses estar: “${['estic', 'estàs', 'està', 'estem', 'esteu', 'estan'][f]} ${a.w}”.`, vAt);
        if (v.type === 'estar' && be === 's') return err(`“${a.e[0]}” says what someone or something is like, so Catalan uses ser: “${['soc', 'ets', 'és', 'som', 'sou', 'són'][f]} ${a.w}”.`, vAt);
        i++; C.comp = { adj: a, molt };
      } else if (nx.k === 'noun' && nx.cat === 'feel') return err(`Catalan says this with tenir, not ${v.type}: “${['tinc', 'tens', 'té', 'tenim', 'teniu', 'tenen'][f]} ${nx.w}” (literally “have ${({ hungry: 'hunger', thirsty: 'thirst', sleepy: 'sleep', scared: 'fear', hot: 'heat' })[nx.e[4]] || nx.e[4]}”).`);
      else if (['det', 'noun'].includes(nx.k)) return err(`After “${vw}”, put a describing word (“${sNum === 'p' ? 'contents' : 'content'}”) or a place (“a casa”, “al parc”).`);
      else if (!isPlacePrep(nx) && !(nx.k === 'adv' && nx.w === 'aquí')) return err(`After “${vw}”, put a describing word or a place (“a casa”, “a la cuina”).`);
    } else if (v.type === 'tenir') {
      if (nx?.k === 'noun' && nx.cat === 'feel') { i++; C.comp = { feel: nx }; }
      else if (nx?.k === 'det' && peek(1)?.k === 'noun' && peek(1).cat === 'feel') return err(`No article here: Catalan says “${C.past ? vText : v.w} ${peek(1).w}”.`);
      else if (nx && ['det', 'noun', 'adj'].includes(nx.k)) { const np = NPs('obj'); if (isErr(np)) return np; C.comp = { np }; }
      else return err(`“${vw}” needs something after it: “${vw} un gos”, “${vw} gana”.`, i - 1);
    } else if (v.type === 'anar') {
      if (!isPlacePrep(nx)) return err(`“${C.past ? vText : v.w}” (go) needs where you go: “${C.past ? vText : v.w} a casa”, “… a l'escola” or “… al parc”.`, nx ? i : i - 1);
      i++; const np = PLACE(nx); if (isErr(np)) return np;
      C.comp = { dest: np, p: nx };
    } else if (v.type === 'tr') {
      if (nx?.k === 'prep' && nx.base === 'a' && ['det', 'noun'].includes(peek(1)?.k || (nx.art ? 'det' : ''))) {
        const n2 = T.slice(i + 1, i + 4).find(t => t.k === 'noun');
        if (n2 && ['person', 'animal'].includes(n2.cat)) return err(`Catalan doesn’t put “a” before the person or animal you ${v.e[5]}: “${vw} ${nx.art ? caJoin(caDef(n2.g, n2.num, n2.w), n2.w) : T.slice(i + 1, T.indexOf(n2) + 1).map(t => t.w).join(' ')}”.`, i);
      }
      if (nx && ['det', 'noun', 'adj'].includes(nx.k)) {
        const np = NPs('obj'); if (isErr(np)) return np;
        for (const p of np.coord || [np]) if (v.e[3][0] === 'open' ? !CA_OPENABLE.includes(p.n.e[0]) : v.e[3][0] !== '*' && !v.e[3].includes(p.cat)) return err(`That doesn’t make sense: you can’t ${v.e[5]} ${p.num === 'p' || p.n.mass ? p.n.en : (/^[aeiou]/i.test(p.n.en) ? 'an ' : 'a ') + p.n.en}. “${v.e[0]}” goes with ${v.e[3].map(c => CA_KIND[c]).join(', ')}.`);
        C.comp = { np };
      } else if (v.e[4]) return err(`“${vw}” needs something after it. What do you ${v.e[5]}? For example “${vw} ${{ food: 'una poma', drink: 'aigua', read: 'un llibre', thing: 'una pilota', place: 'la ciutat', animal: 'un gos', person: 'el meu germà', open: 'la porta', '*': 'un llibre' }[v.e[3][0]]}”.`, i - 1);
    } else if (nx && ['det', 'noun', 'adj'].includes(nx.k)) return err(`“${v.e[0]}” (to ${v.e[5]}) doesn’t take an object. You can add a place: “${vw} al parc”, or a person: “${vw} amb el meu germà”.`);
    // a / al + a place, amb + someone
    while (peek()?.k === 'prep') {
      const p = T[i++];
      if (p.base === 'de') return err('“de” joins two nouns: “el llibre del meu germà”. It needs a noun right before it.', i - 1);
      if (v.type === 'anar' && p.base === 'a') return err('Say where you go only once.', i - 1);
      let np;
      if (p.base === 'a') { np = PLACE(p); if (isErr(np)) return np; }
      else { np = NP('pp'); if (isErr(np)) return np; }
      C.pps.push({ p, np });
    }
    while (peek()?.k === 'adv' && peek().pos !== 'post') C.tail.push(T[i++]);
    if ((v.type === 'ser' || v.type === 'estar') && !C.comp && !C.pps.length && !C.tail.some(a => a.w === 'aquí')) return err(`“${vw}” needs something after it: a describing word (“content”) or a place (“a casa”).`, i - 1);
    // ahir (yesterday) goes with the past, demà / avui / ara with the present
    const when = [...C.lead, ...C.tail].find(a => a.when);
    if (when?.when === 'past' && !C.past) return err(`“ahir” means yesterday, so use the past: “${caJoin(C.refl ? caReflFor(f, CA_PAST[f]) : '', CA_PAST[f], caInf(v.e))}”.`, T.indexOf(when));
    if (when && when.when === 'now' && C.past && when.w !== 'avui') return err(`“${when.w}” (${when.en}) doesn’t go with the past (${C.past.w} …). Use the present: “${v.e[1][f]}”.`, T.indexOf(when));
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
    return err(x.k === 'adj' ? `“${x.w}” needs to go next to the noun it describes.` : x.k === 'det' ? `“${x.w}” needs its noun right after it, in the right place.` : x.k === 'verb' ? 'One verb per sentence part. Use “i” or “però” to add another.'
      : x.k === 'pron' ? 'The subject (who does it) goes at the start. To add another sentence, use “i” first.' : x.k === 'neg' ? '“no” goes right before the verb.' : x.k === 'pas' ? '“mai” goes right after the verb, with “no” before the verb.'
      : x.k === 'int' ? '“molt” goes right before a describing word, or right after the verb.' : x.k === 'refl' ? `“${x.w}” goes right before its verb.` : x.k === 'prep' ? `“${x.w}” needs a noun after it, in the right place.` : `“${x.w}” doesn’t fit here.`);
  }
  return { ok: true, P };
}

/* English meaning of a correct Catalan sentence */
function caEnglish(P) {
  const an = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
  const npEn = np => {
    if (np.coord) return np.coord.map(npEn).join(np.conj?.w === 'o' ? ' or ' : ' and ');
    const a = np.pre || np.post, adj = a ? (np.molt ? 'very ' : '') + a.e[4] + ' ' : '', noun = np.n.en, d = np.det;
    let art = '';
    if (np.poss) art = np.poss.en + ' ';
    else if (d) art = d.fam === 'el' ? 'the ' : d.fam === 'un' ? (np.num === 'p' ? 'some ' : an(adj || noun) + ' ') : d.en + ' ';
    const base = art + adj + noun;
    if (np.of) { const o = np.of; return ['person', 'animal'].includes(o.n.cat) && (!d || d.fam === 'el') && !np.poss ? `${npEn(o)}'s ${adj}${noun}` : `${base} of ${npEn(o)}`; }
    return base;
  };
  const placeEn = (np, dest) => {
    if (np.bare) return dest ? 'home' : 'at home';
    const w = np.n.e[0];
    return (dest ? 'to ' : ['cuina', 'oficina', 'ciutat', 'botiga', 'biblioteca', 'església', 'parc'].includes(w) ? 'in ' : 'at ') + npEn(np);
  };
  const one = C => {
    const v = C.verb, f = C.f, past = !!C.past;
    let subj = C.subj ? (C.subj.pron ? C.subj.pron.en : npEn(C.subj.np)) : ['I', 'you', 'he/she', 'we', 'you', 'they'][f];
    if (!C.subj && f === 2 && C.comp?.adj) { const a = C.comp.adj; if (a.w === a.e[1] && a.e[0] !== a.e[1]) subj = 'she'; else if (a.w === a.e[0] && a.e[0] !== a.e[1]) subj = 'he'; }
    const third = f === 2 || (C.subj?.np && C.subj.num === 's'), never = !!C.mai, plural = !third && f !== 0 || f === 1;
    // "always" and "often" go before the verb in English; "well" and "a lot" go at the end
    const all = [...C.lead, ...C.tail], freq = all.filter(a => ['sempre', 'sovint'].includes(a.w)).map(a => a.en).join(' '), endAdv = C.tail.filter(a => a.pos === 'post' && !['sempre', 'sovint'].includes(a.w)).map(a => a.en);
    let vp;
    if (v.type === 'ser' || v.type === 'estar' || C.comp?.feel) {
      const be = past ? (f === 0 || third ? 'was' : 'were') : f === 0 ? 'am' : third ? 'is' : 'are';
      const what = C.comp?.adj ? (C.comp.molt ? 'very ' : '') + C.comp.adj.e[4] : C.comp?.feel ? C.comp.feel.e[4] : '';
      vp = `${be}${never ? ' never' : C.neg ? ' not' : ''}${freq ? ' ' + freq : ''} ${what}`;
    } else {
      const base = v.e[5], s3 = v.e[6], pastEn = v.e[9] || caPastEn(base);
      if (past) vp = C.neg ? `did not${freq ? ' ' + freq : ''} ${base}` : `${freq ? freq + ' ' : ''}${pastEn}`;
      else vp = never ? `never ${third ? s3 : base}` : C.neg ? `${third ? 'does' : 'do'} not${freq ? ' ' + freq : ''} ${base}` : `${freq ? freq + ' ' : ''}${third ? s3 : base}`;
      if (C.comp?.np) vp += ' ' + npEn(C.comp.np);
      if (C.comp?.dest) vp += ' ' + placeEn(C.comp.dest, true);
    }
    void plural;
    if (endAdv.length) vp += ' ' + endAdv.join(' ');
    for (const { p, np } of C.pps) vp += ' ' + (p.w === 'amb' ? 'with ' + npEn(np) : placeEn(np, false));
    const tail = [...C.lead.filter(a => !['sempre', 'sovint'].includes(a.w)).map(a => a.en), ...C.tail.filter(a => a.pos !== 'post').map(a => a.en)].join(' ');
    return `${subj} ${vp}${tail ? ' ' + tail : ''}`.replace(/\s+/g, ' ').trim();
  };
  let s = one(P.clauses[0]);
  P.conjs.forEach((c, k) => { s += (c.w === 'i' ? ', and ' : c.w === 'però' ? ', but ' : ', or ') + one(P.clauses[k + 1]); });
  return s[0].toUpperCase() + s.slice(1) + '.';
}
// English past tense for your own verbs: "to take a walk" → "took a walk"
const CA_EN_PAST = { be: 'was', have: 'had', go: 'went', do: 'did', make: 'made', eat: 'ate', drink: 'drank', see: 'saw', read: 'read', write: 'wrote', buy: 'bought', sell: 'sold', run: 'ran', sleep: 'slept', get: 'got',
  take: 'took', give: 'gave', come: 'came', know: 'knew', think: 'thought', say: 'said', tell: 'told', find: 'found', leave: 'left', put: 'put', bring: 'brought', begin: 'began', sing: 'sang', swim: 'swam', speak: 'spoke',
  break: 'broke', choose: 'chose', drive: 'drove', fly: 'flew', forget: 'forgot', hear: 'heard', keep: 'kept', lose: 'lost', meet: 'met', pay: 'paid', send: 'sent', sit: 'sat', stand: 'stood', teach: 'taught',
  understand: 'understood', wear: 'wore', win: 'won', learn: 'learned', feel: 'felt', fall: 'fell', grow: 'grew', hold: 'held', ride: 'rode', rise: 'rose', shut: 'shut', spend: 'spent', throw: 'threw', wake: 'woke', cut: 'cut', draw: 'drew', build: 'built', catch: 'caught', fight: 'fought', hide: 'hid', lie: 'lay', set: 'set' };
function caPastEn(en) {
  const [w, ...rest] = String(en || '').split(' ');
  const p = CA_EN_PAST[w] || (/e$/.test(w) ? w + 'd' : /[^aeiou]y$/.test(w) ? w.slice(0, -1) + 'ied' : /^[^aeiou]*[aeiou][bdgmnpt]$/.test(w) && w.length <= 4 ? w + w.slice(-1) + 'ed' : w + 'ed');
  return [p, ...rest].join(' ');
}

/* ---------------- making a Catalan tray ---------------- */
function caGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = list => { const fav = list.filter(x => pref.has(x[0]) || (typeof x[1] === 'string' && pref.has(x[1]))); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const nounOf = cats => RP(CA_NOUN.filter(n => n[3] !== 'feel' && (cats[0] === '*' || cats.includes(n[3]) || (cats[0] === 'open' && CA_OPENABLE.includes(n[0])))));
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
  const adjFor = (cat, be) => RP(CA_ADJ.filter(a => (!cat || a[5].includes(CAT[cat] || 'p')) && (!be || (a[7] || 'b') === 'b' || a[7] === be)));
  const extra = [];
  const other = list => { const x = list.filter(Boolean); return x.length ? R(x) : null; };
  // a noun phrase with a determiner that fits (and a look-alike as a distractor). via = a / de to join with el / els (al, del)
  const np = (n, num, out, opts = {}) => {
    const g = n[2], mass = !!n[6];
    let fam;
    if (num === 'p') fam = R(['el', 'el', 'un', 'poss', 'aquest', 'aquell', 'dos', 'tres', ...(opts.obj ? ['bare', 'bare'] : [])]);
    else if (mass) fam = R(['el', 'poss', 'aquest', ...(opts.obj ? ['bare', 'bare', 'bare'] : [])]);
    else fam = R(['el', 'el', 'un', 'un', 'poss', 'poss', 'aquest', 'aquell']);
    if (opts.subj && fam === 'bare') fam = 'el';
    if (n[8] && num === 's' && coin(0.5)) fam = 'poss';
    if (opts.via && !['el', 'poss'].includes(fam)) fam = 'el';
    const a = opts.adj !== false && coin(0.35) ? adjFor(n[3]) : null, molt = a && coin(0.2);
    const before = a && a[6] === 'both' && !molt && coin(0.5);
    const nw = num === 'p' ? n[1] : n[0], aw = a ? (before ? caAdjPre(a, g, num) : a[caIdx(g, num)]) : null;
    const after = before ? aw : nw;
    const putArt = art => {
      if (opts.via) { const c = caContr(opts.via, art); if (c) { out.push(caPrep(c)); extra.push(caPrep(opts.via), caDetW(art)); } else { out.push(caPrep(opts.via), caDetW(art)); if (art !== "l'") extra.push(caDetW(art === 'la' ? 'el' : art === 'les' ? 'els' : art)); } }
      else { out.push(caDetW(art)); const wrong = other(CA_DET.filter(x => x[1] === 'el' && x[0] !== art).map(x => x[0])); if (wrong) extra.push(caDetW(wrong)); }
    };
    if (fam === 'poss') {
      const row = R(CA_POSS), pw = row[caIdx(g, num)];
      putArt(caWant('el', g, num, pw, g));
      out.push(caPossW(row, pw)); const wrongP = other(row.slice(0, 4).filter(x => x !== pw)); if (wrongP) extra.push(caPossW(row, wrongP));
    } else if (fam === 'el') putArt(caWant('el', g, num, after, g));
    else if (fam !== 'bare') {
      const d = caWant(fam, g, num, after, g);
      out.push(caDetW(d)); const wrong = other(CA_DET.filter(x => x[1] === fam && x[0] !== d).map(x => x[0])); if (wrong) extra.push(caDetW(wrong));
    }
    if (before) out.push(caAdj(a, aw));
    out.push(caNoun(n, num));
    if (a && !before) { if (molt) out.push(caMolt()); out.push(caAdj(a, aw)); }
    if (a) extra.push(caAdj(a, a[caIdx(g === 'm' ? 'f' : 'm', num === 's' ? 'p' : 's')]));
    if (opts.of && fam !== 'poss' && coin(0.25)) np(nounOf(['person']), 's', out, { via: 'de', adj: false });
  };
  // a + a place: a casa, a l'escola, al parc, a la platja
  const toPlace = out => {
    const n = nounOf(['place']);
    if (n[7] === 'bare') { out.push(caPrep('a'), caNoun(n, 's')); extra.push(caDetW('la')); }
    else np(n, 's', out, { via: 'a', adj: coin(0.3) ? undefined : false });
  };
  const clause = () => {
    const out = [], kind = R(['tr', 'tr', 'tr', 'in', 'ser', 'estar', 'estar', 'tenir', 'anar', 'refl']);
    const verb = ['ser', 'estar', 'anar', 'tenir'].includes(kind) ? CA_VERB.find(v => v[0] === kind)
      : kind === 'refl' ? RP(CA_VERB.filter(v => v[8])) : RP(CA_VERB.filter(v => v[2] === kind && !v[8]));
    const subjKinds = verb[7] === 'p' ? ['person'] : ['person', 'animal'];
    let f, g = 'x', subjCat = 'person';
    const r0 = Math.random();
    if (r0 < 0.35) { const p = R(CA_PRON); f = p[1]; g = p[2]; out.push(caPron(p)); extra.push(caPronW(R(['jo', 'tu', 'nosaltres', 'ells'].filter(x => x !== p[0])))); }
    else if (r0 < 0.55) f = Math.floor(Math.random() * 6);
    else {
      const n = nounOf(subjKinds); g = n[2]; subjCat = n[3]; const num = n[1] && coin(0.3) ? 'p' : 's';
      np(n, num, out, { subj: true, of: true }); f = num === 'p' ? 5 : 2;
      if (coin(0.12)) { const n2 = nounOf(subjKinds); out.push(caConj('i')); np(n2, 's', out, { subj: true, adj: false }); f = 5; g = g === 'm' || n2[2] === 'm' ? 'm' : 'f'; }
    }
    const past = coin(0.28);
    const neg = !past && !['ser', 'estar'].includes(kind) && coin(0.22) ? R(['no', 'no', 'mai']) : coin(0.12) ? 'no' : null;
    const vFirst = past ? CA_PAST[f] : verb[1][f], refl = verb[8] ? caReflFor(f, vFirst) : null;
    if (neg) out.push(caNo());
    if (refl) { out.push(caRefl(refl, f)); extra.push(caRefl(R(CA_REFL.filter(x => x !== refl)), f)); }
    if (past) { out.push(caAux(f), caInfW(verb)); extra.push(caAux((f + 1 + Math.floor(Math.random() * 5)) % 6), caVerb(verb, f)); }
    else { out.push(caVerb(verb, f)); extra.push(caVerb(verb, (f + 1 + Math.floor(Math.random() * 5)) % 6)); if (coin(0.3)) extra.push(caInfW(verb)); }
    if (neg === 'mai') out.push(caMai());
    if (kind === 'ser' || kind === 'estar') {
      const gg = g === 'x' ? R(['m', 'f']) : g, num = CA_FORM[f][1];
      if (coin(0.7)) { if (coin(0.25)) out.push(caMolt()); const a = adjFor(subjCat, kind === 'ser' ? 's' : 'e'); out.push(caAdj(a, a[caIdx(gg, num)])); extra.push(caAdj(a, a[caIdx(gg === 'm' ? 'f' : 'm', num === 's' ? 'p' : 's')]), caVerb(CA_VERB.find(v => v[0] === (kind === 'ser' ? 'estar' : 'ser')), f)); }
      else toPlace(out);
    } else if (kind === 'tenir') {
      if (coin(0.35)) { out.push(caNoun(R(CA_NOUN.filter(n => n[3] === 'feel')), 's')); extra.push(caVerb(CA_VERB.find(v => v[0] === 'estar'), f)); }
      else { const n = nounOf(['*']), on = n[1] && coin(0.3) ? 'p' : 's'; np(n, on, out, { of: true, obj: true }); }
    } else if (kind === 'anar') {
      toPlace(out);
      if (coin(0.3)) { out.push(caPrep('amb')); np(nounOf(['person']), 's', out, { adj: false }); }
    } else if (kind === 'tr') {
      const n = nounOf(verb[3]), on = n[1] && coin(0.3) ? 'p' : 's';
      np(n, on, out, { of: true, obj: true });
      if (['person', 'animal'].includes(n[3])) extra.push(caPrep('a'));
      if (coin(0.2)) { out.push(caPrep('amb')); np(nounOf(['person']), 's', out, { adj: false }); }
      else if (coin(0.15)) toPlace(out);
      extra.push(caNoun(nounOf(['*']), 's'));
    } else {
      const r = Math.random();
      if (r < 0.4) toPlace(out);
      else if (r < 0.65) { out.push(caPrep('amb')); np(nounOf(['person', 'animal']), 's', out, { adj: false }); }
    }
    if (coin(0.2) && !['ser', 'estar'].includes(kind) && neg !== 'mai') out.push(caAdv(R(CA_HOW_VERBS.test(verb[0]) && kind !== 'tr' ? ['sempre', 'sovint', 'bé', 'molt'] : ['sempre', 'sovint'])));   // placed by the fix-up below
    if (coin(0.22)) out.push(caAdv(R(CA_ADV.filter(x => (x[2] === 'edge' && (past ? ['past', 'now'].includes(x[3]) && x[0] !== 'demà' && x[0] !== 'ara' : x[3] === 'now' && (x[0] !== 'demà' || kind === 'anar'))) || x[2] === 'end'))[0]));
    // a "post" adverb belongs right after the verb (after mai, after the infinitive)
    const pi = out.findIndex(c => c?.k === 'adv' && c.pos === 'post');
    if (pi >= 0) { const [a] = out.splice(pi, 1); let vi = out.findIndex(c => c?.k === 'verb'); if (out[vi + 1]?.k === 'verb') vi++; const at = out[vi + 1]?.k === 'pas' ? vi + 2 : vi + 1; out.splice(at, 0, a); }
    // an edge adverb at the start half the time: "Avui menjo pa"
    const ei = out.findIndex(c => c?.k === 'adv' && c.pos === 'edge');
    if (ei >= 0 && coin(0.5)) { const [a] = out.splice(ei, 1); out.unshift(a); }
    return out;
  };
  for (let tries = 0; tries < 120; tries++) {
    extra.length = 0;
    let words = clause(); if (!words || words.includes(null)) continue;
    if (Math.random() < 0.25) { const c2 = clause(); if (c2 && !c2.includes(null) && c2[0]?.k !== 'adv') words = [...words, caConj(R(['i', 'i', 'però', 'o'])), ...c2]; }
    if (words.length > 14 || words.length < 2) continue;
    const res = caCheck(words); if (!res.ok) continue;
    extra.push(caPronW(R(['jo', 'ell', 'ella', 'nosaltres', 'vosaltres', 'ells'])), caPrep(R(['a', 'amb', 'de'])));
    if (!words.some(w => w.k === 'conj')) extra.push(caConj(R(['i', 'però'])));
    if (!words.some(w => w.k === 'neg')) extra.push(caNo(), caMai());
    // one chip per spelling, so the tray never shows two "al" or two "molt"
    const seen = new Set(words.map(w => w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && !seen.has(x.w)) { seen.add(x.w); uniq.push(x); }
    return { words, extra: uniq.slice(0, Math.max(4, 16 - words.length)), english: caEnglish(res.P) };
  }
  return null;
}

BLD_LANGS.ca = { name: 'Catalan', check: caCheck, gen: caGenerate, voice: 'ca-ES', english: caEnglish };
if (typeof BLD_ORDER !== 'undefined') BLD_ORDER.ca = { rows: [
    ['A basic sentence', [['det', 'determiner'], ['noun', 'noun'], ['adj', '(adjective)'], ['verb', 'verb'], ['det', 'determiner'], ['noun', 'noun'], ['adj', '(adjective)']]],
    ['No subject needed', [['verb', 'verb'], ['det', 'determiner'], ['noun', 'noun']]],
    ['My, your… (el meu llibre)', [['det', 'el / la'], ['det', 'meu / meva'], ['noun', 'noun'], ['verb', 'verb']]],
    ['Saying what something is like (ser / estar)', [['det', 'determiner'], ['noun', 'noun'], ['verb', 'ser / estar'], ['adv', '(molt)'], ['adj', 'adjective']]],
    ['The past (vaig menjar)', [['pron', '(pronoun)'], ['verb', 'vaig / vas / va…'], ['verb', 'verb ending in -r'], ['noun', 'noun']]],
    ['A negative sentence', [['pron', '(pronoun)'], ['adv', 'no'], ['verb', 'verb'], ['adv', '(mai)'], ['noun', 'noun']]],
    ['A verb like llevar-se', [['pron', '(pronoun)'], ['pron', 'em / et / es'], ['verb', 'verb']]],
    ['Going somewhere', [['pron', '(pronoun)'], ['verb', 'anar'], ['prep', 'a / al'], ['noun', 'place']]],
    ['Joining two sentences', [['verb', 'sentence'], ['conj', 'conjunction'], ['verb', 'sentence']]],
  ], tips: [
    ['pron', 'The verb already says who: <b>menjo</b> = I eat. Add <b>jo</b>, <b>ella</b>… only when you want to.'],
    ['adj', 'Most adjectives come <b>after</b> the noun. A few go before or after: gran, petit, bo, nou, vell, jove. Before a masculine noun, bo turns into <b>bon</b>: un bon amic.'],
    ['det', '<b>el / la</b>, and <b>l\'</b> before a vowel or h (l\'home, l\'escola). A feminine word with an unstressed i or u keeps <b>la</b>: la idea.'],
    ['det', 'My, your… always come with the article, even with family: <b>el meu llibre</b>, <b>la meva mare</b>.'],
    ['verb', 'The past: <b>vaig / vas / va / vam / vau / van</b> + the verb ending in -r: <b>vaig menjar</b> = I ate.'],
    ['verb', '<b>ser</b> says what something is like (és gran), <b>estar</b> how someone is now (estic cansat). Both work for places: soc a casa.'],
    ['adv', '<b>no</b> goes right before the verb (and before em / et / es). Never: <b>no</b> menjo <b>mai</b>.'],
    ['prep', '<b>a + el = al</b>, <b>de + el = del</b> (and als, dels), but <b>a l\'</b>, <b>a la</b>, <b>de la</b> stay apart. Home is just <b>a casa</b>.'],
    ['noun', 'Feelings use tenir: <b>tinc gana</b>, <b>tinc set</b>, <b>tinc fred</b>, <b>tinc son</b>.'] ] };

/* ---------------- Your own Catalan words (📚 Add my deck's words) ---------------- */
// Present tense of common irregular verbs: jo, tu, ell/ella, nosaltres, vosaltres, ells/elles
const CA_IRREG_FORMS = {
  ser: 'soc ets és som sou són', estar: 'estic estàs està estem esteu estan', anar: 'vaig vas va anem aneu van', fer: 'faig fas fa fem feu fan',
  tenir: 'tinc tens té tenim teniu tenen', haver: 'he has ha hem heu han', poder: 'puc pots pot podem podeu poden', voler: 'vull vols vol volem voleu volen',
  saber: 'sé saps sap sabem sabeu saben', dir: 'dic dius diu diem dieu diuen', venir: 'vinc vens ve venim veniu venen', veure: 'veig veus veu veiem veieu veuen',
  beure: 'bec beus beu bevem beveu beuen', viure: 'visc vius viu vivim viviu viuen', escriure: 'escric escrius escriu escrivim escriviu escriuen', descriure: 'descric descrius descriu descrivim descriviu descriuen',
  creure: 'crec creus creu creiem creieu creuen', seure: 'sec seus seu seiem seieu seuen', asseure: 'assec asseus asseu asseiem asseieu asseuen', caure: 'caic caus cau caiem caieu cauen',
  treure: 'trec treus treu traiem traieu treuen', riure: 'ric rius riu riem rieu riuen', moure: 'moc mous mou movem moveu mouen', deure: 'dec deus deu devem deveu deuen',
  plaure: 'plac plaus plau plaem plaeu plauen', jeure: 'jec jeus jeu jaiem jaieu jeuen', dur: 'duc duus duu duem dueu duen', coure: 'coc cous cou coem coeu couen',
  prendre: 'prenc prens pren prenem preneu prenen', aprendre: 'aprenc aprens aprèn aprenem apreneu aprenen', comprendre: 'comprenc comprens comprèn comprenem compreneu comprenen',
  entendre: 'entenc entens entén entenem enteneu entenen', vendre: 'venc vens ven venem veneu venen', encendre: 'encenc encens encén encenem enceneu encenen',
  respondre: 'responc respons respon responem responeu responen', defendre: 'defenso defenses defensa defensem defenseu defensen', rebre: 'rebo reps rep rebem rebeu reben',
  conèixer: 'conec coneixes coneix coneixem coneixeu coneixen', reconèixer: 'reconec reconeixes reconeix reconeixem reconeixeu reconeixen', néixer: 'neixo neixes neix naixem naixeu neixen',
  créixer: 'creixo creixes creix creixem creixeu creixen', aparèixer: 'aparec apareixes apareix apareixem apareixeu apareixen', merèixer: 'mereixo mereixes mereix mereixem mereixeu mereixen',
  córrer: 'corro corres corre correm correu corren', valer: 'valc vals val valem valeu valen', soler: 'solc sols sol solem soleu solen', doler: 'dolc dols dol dolem doleu dolen',
  cabre: 'cabo caps cap cabem cabeu caben', obtenir: 'obtinc obtens obté obtenim obteniu obtenen', mantenir: 'mantinc mantens manté mantenim manteniu mantenen',
  contenir: 'continc contens conté contenim conteniu contenen', obrir: 'obro obres obre obrim obriu obren', cobrir: 'cobreixo cobreixes cobreix cobrim cobriu cobreixen',
  sortir: 'surto surts surt sortim sortiu surten', collir: 'cullo culls cull collim colliu cullen', cosir: 'cuso cuses cus cosim cosiu cusen', tossir: 'tusso tusses tus tossim tossiu tussen',
  fugir: 'fujo fuges fuig fugim fugiu fugen', escopir: 'escupo escups escup escopim escopiu escupen', morir: 'moro mors mor morim moriu moren', omplir: 'omplo omples omple omplim ompliu omplen',
  dormir: 'dormo dorms dorm dormim dormiu dormen', sentir: 'sento sents sent sentim sentiu senten', mentir: 'mento ments ment mentim mentiu menten', bullir: 'bullo bulls bull bullim bulliu bullen',
  pujar: 'pujo puges puja pugem pugeu pugen', menjar: 'menjo menges menja mengem mengeu mengen', jugar: 'jugo jugues juga juguem jugueu juguen',
};
// -ir verbs that don't add -eix- (dormo, sento): the rest do (llegeixo, serveixo)
const CA_PURE_IR = /^(dormir|sentir|mentir|consentir|bullir|acudir|pudir|partir|eixir|ressentir|presentir)$/;
const caReflStrip = inf => String(inf || '').trim().replace(/-se$|'s$/, '');
// a stem before e or i: c → qu, g → gu, ç → c, j → g, qu → qü, gu → gü (busques, pagues, comences, menges)
const caSoft = st => st.replace(/qu$/, 'qü').replace(/gu$/, 'gü').replace(/c$/, 'qu').replace(/g$/, 'gu').replace(/ç$/, 'c').replace(/j$/, 'g');
const caCluster = st => /([bcdfgkptv][lr]|rr|ss)$/.test(st);   // obres, omples, corres: these stems need an e
// jo, tu, ell, nosaltres, vosaltres, ells: the table first, then the regular patterns (-ar, -re, -er, -ir, -ir with -eix-)
function caConjugate(inf) {
  inf = caReflStrip(inf);
  if (CA_IRREG_FORMS[inf]) return CA_IRREG_FORMS[inf].split(' ');
  for (const [base, forms] of Object.entries(CA_IRREG_FORMS)) if (inf.length > base.length + 1 && inf.endsWith(base) && /^(des|re|a|pre|sobre|con|ob|man|com|entre|per|dis|de)/.test(inf.slice(0, -base.length)) && !['ar', 'er'].includes(base)) {   // desfer, refer, prevenir…
    const pre = inf.slice(0, -base.length); return forms.split(' ').map(f => pre + f);
  }
  if (/ar$/.test(inf)) { const st = inf.slice(0, -2), so = caSoft(st); return [st + 'o', so + 'es', st + 'a', so + 'em', so + 'eu', so + 'en']; }
  if (/ndre$/.test(inf)) { const st = inf.slice(0, -3); return [st + 'c', st + 's', st, st + 'em', st + 'eu', st + 'en']; }   // atendre → atenc, atens, aten
  if (/[^u]re$/.test(inf) || /er$/.test(inf)) {   // perdre, batre, témer
    const st = inf.slice(0, /er$/.test(inf) ? -2 : -2).normalize('NFD').replace(/[̀́]/g, '').normalize('NFC'), fin = st.replace(/b$/, 'p'), cl = caCluster(st);
    return [st + 'o', cl ? st + 'es' : fin + 's', cl ? st + 'e' : fin, st + 'em', st + 'eu', st + 'en'];
  }
  if (/ir$/.test(inf)) {
    const st = inf.slice(0, -2);
    if (CA_PURE_IR.test(inf)) { const cl = caCluster(st); return [st + 'o', cl ? st + 'es' : st + 's', cl ? st + 'e' : st, st + 'im', st + 'iu', st + 'en']; }
    return [st + 'eixo', st + 'eixes', st + 'eix', st + 'im', st + 'iu', st + 'eixen'];
  }
  return [inf, inf, inf, inf, inf, inf];
}
// the plural of a noun (a good guess: check the ones that look wrong)
function caPl(w) {
  if (/ca$/.test(w)) return w.slice(0, -2) + 'ques';                 // vaca → vaques
  if (/ga$/.test(w)) return w.slice(0, -2) + 'gues';                 // botiga → botigues
  if (/ça$/.test(w)) return w.slice(0, -2) + 'ces';                  // plaça → places
  if (/ja$/.test(w)) return w.slice(0, -2) + 'ges';                  // platja → platges
  if (/qua$/.test(w)) return w.slice(0, -3) + 'qües';
  if (/gua$/.test(w)) return w.slice(0, -3) + 'gües';                // llengua → llengües
  if (/a$/.test(w)) return w.slice(0, -1) + 'es';                    // casa → cases
  if (/ió$/.test(w) || /[àíó]$/.test(w)) return w.replace(/[àíó]$/, c => ({ à: 'a', í: 'i', ó: 'o' })[c]) + 'ns';   // estació → estacions, germà → germans, camí → camins
  if (/[èéú]$/.test(w)) return w + 's';                              // cafè → cafès, menú → menús
  if (/(ç)$/.test(w)) return w + 'os';                               // braç → braços
  if (/(x|ix|tx|ig)$/.test(w) && !/ig$/.test(w)) return w + 'os';    // peix → peixos, despatx → despatxos
  if (/[àèéíòóú]s$/.test(w)) return w.replace(/[àèéíòóú]s$/, m => ({ à: 'a', è: 'e', é: 'e', í: 'i', ò: 'o', ó: 'o', ú: 'u' })[m[0]] + 'ssos');   // pastís → pastissos, interès → interessos
  if (/^[^aeiou]*[aeiou]s$/.test(w)) return w + 'sos';               // gos → gossos, nas → nassos
  return w + 's';                                                    // llibre → llibres, gat → gats
}
const caGenderGuess = w => /(a|ció|sió|tat|tud|ença|esa)$/.test(w) && !/^(dia|mapa|problema|programa|sistema|clima|tema|idioma|poema|planeta|pijama)$/.test(w) ? 'f' : 'm';
function caAdjForms(w) {
  if (/ós$/.test(w)) { const st = w.slice(0, -2); return [w, st + 'osa', st + 'osos', st + 'oses']; }         // deliciós
  if (/ès$/.test(w)) { const st = w.slice(0, -2); return [w, st + 'esa', st + 'esos', st + 'eses']; }         // francès
  if (/(ç|x)$/.test(w)) return [w, w, w + 'os', w + 'os'];                                                    // feliç, capaç
  if (/(e|al|il|el|ble|ant|ent|ar)$/.test(w) && !/^(content|calent|dolent|lent|valent|negre|pobre|car|clar|rar)$/.test(w)) return [w, w, w + 's', w + 's'];   // jove, fàcil, intel·ligent
  if (/e$/.test(w)) { const st = w.slice(0, -1); return [w, st + 'a', w + 's', st + 'es']; }                 // negre → negra
  if (/u$/.test(w)) { const st = w.slice(0, -1); return [w, st + 'va', w + 's', st + 'ves']; }                // blau → blava, nou → nova
  if (/c$/.test(w)) { const st = w.slice(0, -1); return [w, w + 'a', w + 's', st + 'ques']; }                 // simpàtic → simpàtica, simpàtiques
  if (/at$/.test(w) && w.length > 5) { const st = w.slice(0, -2); return [w, st + 'ada', w + 's', st + 'ades']; }   // cansat → cansada
  if (/it$/.test(w) && w.length > 5) { const st = w.slice(0, -2); return [w, st + 'ida', w + 's', st + 'ides']; }   // avorrit → avorrida
  if (/ut$/.test(w) && w.length > 4) { const st = w.slice(0, -2); return [w, st + 'uda', w + 's', st + 'udes']; }   // conegut → coneguda
  if (/[aeiou]$/.test(w)) return [w, w, w + 's', w + 's'];
  return [w, w + 'a', w + 's', w + 'es'];                                                                     // petit → petita, verd → verda
}
const CA_BASE = { n: CA_NOUN.length, a: CA_ADJ.length, v: CA_VERB.length };
const caKnown = w => CA_NOUN.slice(0, CA_BASE.n).some(n => n[0] === w || n[1] === w) || CA_VERB.slice(0, CA_BASE.v).some(v => v[0] === w || caReflStrip(v[0]) === caReflStrip(w) || v[1].includes(w))
  || CA_ADJ.slice(0, CA_BASE.a).some(a => a.slice(0, 4).includes(w)) || [CA_PRON, CA_DET, CA_PREP, CA_CONJ, CA_ADV, CA_POSS].some(L => L.some(x => x[0] === w)) || ['no', 'mai', 'molt'].includes(w);
function caApplyMine() {
  CA_NOUN.length = CA_BASE.n; CA_ADJ.length = CA_BASE.a; CA_VERB.length = CA_BASE.v;
  for (const m of S.bldWords || []) {
    if (!m || m.lang !== 'ca' || !m.w || !m.en || caKnown(m.w)) continue;
    if (m.k === 'noun') CA_NOUN.push([m.w, m.pl || null, m.g === 'f' ? 'f' : 'm', m.cat || 'thing', m.en, m.pl ? (m.enPl || bldPlEn(m.en)) : null, 0, m.cat === 'place' ? 'art' : null]);
    if (m.k === 'verb' && Array.isArray(m.forms) && m.forms.length === 6) {
      const refl = /(-se|'s)$/.test(m.w) ? 1 : 0, type = m.obj === 'in' || refl ? 'in' : 'tr', objs = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read', 'place'];
      CA_VERB.push([m.w, m.forms, type, objs, 0, m.en, bld3sEn(m.en), m.who === 'a' ? 'a' : 'p', refl, caPastEn(m.en)]);
    }
    if (m.k === 'adj') CA_ADJ.push([...caAdjForms(m.w), m.en, 'patflr', 'post', 'b']);
  }
}
// builder.js calls bldApplyMine() when the game starts: add the Catalan words to it
if (typeof bldApplyMine === 'function') { const prevApply = bldApplyMine; bldApplyMine = function () { prevApply(); caApplyMine(); }; }
BLD_MINE.ca = { name: 'Catalan', forms: 'jo, tu, ell/ella, nosaltres, vosaltres, ells/elles', nForms: 6, m: 'el (masculine)', f: 'la (feminine)', conj: w => caConjugate(w), pl: w => caPl(w), adj: w => caAdjForms(w),
  known: w => caKnown(w), gender: w => caGenderGuess(w), isVerb: w => /(ar|er|re|ir|-se|'s)$/.test(w) && !/(ura|era)$/.test(w), refl: w => /(-se|'s)$/.test(w),
  parse: s => { s = s.replace(/[’]/g, "'"); let m = s.match(/^(el|la|els|les|un|una|uns|unes)\s+(\p{L}[\p{L}·]*)$/u); if (m) return { w: m[2], g: /^(la|les|una|unes)$/.test(m[1]) ? 'f' : 'm', art: true };
    m = s.match(/^l'(\p{L}[\p{L}·]*)$/u); if (m) return { w: m[1], art: true };
    m = s.match(/^(\p{L}[\p{L}·]*(?:-se|'s)?)$/u); return m ? { w: m[1] } : null; },
  intro: 'words with <i>el/la/l\'</i> are nouns, and words like <i>“to …”</i> are verbs). Verb forms are filled in for you, including common irregular verbs (soc, vaig, faig, tinc, puc…); check any that look wrong. Verbs ending in “-se” (rentar-se) work too: the game adds “em / et / es / ens / us” before them. Every verb also works in the past: vaig + the verb.' };
