'use strict';
/* ================= Sentence Builder: Romanian =================
   Same idea as French and Spanish: every word on the tray is one analysed word (a "chip"), and the checker explains the
   first mistake. Romanian checks: the definite article is joined to the END of the noun (câinele, casa, câinii, casele),
   so there is no separate word for "the"; un / o / niște / acest / doi / două go before a noun WITHOUT that ending; three
   genders, where a neuter noun acts masculine in the singular and feminine in the plural (un măr, două mere, merele
   roșii); describing words go after the noun and agree with it; possessives (meu, mea, mei, mele…) go after a noun WITH
   the ending (câinele meu, casa mea); after în and la the ending is left off (în parc, la școală) unless something
   describes the noun; nu right before the verb, and niciodată needs nu too (nu mănânc niciodată); reflexive verbs need
   mă / te / se / ne / vă (mă trezesc); the subject can be left out, because the verb already shows who.
   Loaded after builder.js and builder-fr.js. */

//            word  form  gender  English          form: 0 eu, 1 tu, 2 el/ea, 3 noi, 4 voi, 5 ei/ele
const RO_PRON = [['eu', 0, 'x', 'I'], ['tu', 1, 'x', 'you'], ['el', 2, 'm', 'he'], ['ea', 2, 'f', 'she'],
  ['noi', 3, 'x', 'we'], ['voi', 4, 'x', 'you'], ['ei', 5, 'm', 'they'], ['ele', 5, 'f', 'they']];
const RO_FORM = [[1, 's'], [2, 's'], [3, 's'], [1, 'p'], [2, 'p'], [3, 'p']];
//            word      family   agrees as  number  English
const RO_DET = [['un', 'un', 'm', 's', 'a'], ['o', 'un', 'f', 's', 'a'], ['niște', 'niste', 'x', 'x', 'some'],
  ['acest', 'acest', 'm', 's', 'this'], ['această', 'acest', 'f', 's', 'this'], ['acești', 'acest', 'm', 'p', 'these'], ['aceste', 'acest', 'f', 'p', 'these'],
  ['doi', 'doi', 'm', 'p', 'two'], ['două', 'doi', 'f', 'p', 'two'], ['trei', 'trei', 'x', 'p', 'three']];
// a neuter noun agrees like a masculine one in the singular and like a feminine one in the plural
const roAg = (g, num) => g === 'n' ? (num === 'p' ? 'f' : 'm') : g;
const roIdx = (g, num) => (num === 'p' ? 2 : 0) + (roAg(g, num) === 'f' ? 1 : 0);
function roDetWant(fam, g, num) {
  const a = roAg(g, num);
  switch (fam) {
    case 'un': return a === 'f' ? 'o' : 'un';
    case 'acest': return num === 'p' ? (a === 'f' ? 'aceste' : 'acești') : (a === 'f' ? 'această' : 'acest');
    case 'doi': return a === 'f' ? 'două' : 'doi';
    case 'niste': return 'niște';
    default: return fam;   // trei
  }
}
//            m sing     f sing      m plural    f plural     English
const RO_POSS = [['meu', 'mea', 'mei', 'mele', 'my'], ['tău', 'ta', 'tăi', 'tale', 'your'], ['nostru', 'noastră', 'noștri', 'noastre', 'our'],
  ['vostru', 'voastră', 'voștri', 'voastre', 'your'], ['lui', 'lui', 'lui', 'lui', 'his'], ['lor', 'lor', 'lor', 'lor', 'their']];
//            sing      sing + "the"  plural     plural + "the"  g    kind      English one / many     can't count (1 = never "un/o", 2 = "o cafea" is fine)
const RO_NOUN = [
  ['bărbat', 'bărbatul', 'bărbați', 'bărbații', 'm', 'person', 'man', 'men'], ['femeie', 'femeia', 'femei', 'femeile', 'f', 'person', 'woman', 'women'],
  ['băiat', 'băiatul', 'băieți', 'băieții', 'm', 'person', 'boy', 'boys'], ['fată', 'fata', 'fete', 'fetele', 'f', 'person', 'girl', 'girls'],
  ['prieten', 'prietenul', 'prieteni', 'prietenii', 'm', 'person', 'friend', 'friends'], ['prietenă', 'prietena', 'prietene', 'prietenele', 'f', 'person', 'friend', 'friends'],
  ['mamă', 'mama', null, null, 'f', 'person', 'mother', null], ['tată', 'tatăl', null, null, 'm', 'person', 'father', null],
  ['frate', 'fratele', 'frați', 'frații', 'm', 'person', 'brother', 'brothers'], ['soră', 'sora', 'surori', 'surorile', 'f', 'person', 'sister', 'sisters'],
  ['profesor', 'profesorul', 'profesori', 'profesorii', 'm', 'person', 'teacher', 'teachers'], ['medic', 'medicul', 'medici', 'medicii', 'm', 'person', 'doctor', 'doctors'],
  ['copil', 'copilul', 'copii', 'copiii', 'm', 'person', 'child', 'children'],
  ['câine', 'câinele', 'câini', 'câinii', 'm', 'animal', 'dog', 'dogs'], ['pisică', 'pisica', 'pisici', 'pisicile', 'f', 'animal', 'cat', 'cats'],
  ['pasăre', 'pasărea', 'păsări', 'păsările', 'f', 'animal', 'bird', 'birds'], ['cal', 'calul', 'cai', 'caii', 'm', 'animal', 'horse', 'horses'],
  ['pâine', 'pâinea', null, null, 'f', 'food', 'bread', null, 2], ['orez', 'orezul', null, null, 'n', 'food', 'rice', null, 1], ['brânză', 'brânza', null, null, 'f', 'food', 'cheese', null, 1],
  ['carne', 'carnea', null, null, 'f', 'food', 'meat', null, 1], ['supă', 'supa', null, null, 'f', 'food', 'soup', null, 2],
  ['măr', 'mărul', 'mere', 'merele', 'n', 'food', 'apple', 'apples'], ['ou', 'oul', 'ouă', 'ouăle', 'n', 'food', 'egg', 'eggs'],
  ['prăjitură', 'prăjitura', 'prăjituri', 'prăjiturile', 'f', 'food', 'cake', 'cakes'], ['biscuit', 'biscuitul', 'biscuiți', 'biscuiții', 'm', 'food', 'cookie', 'cookies'],
  ['portocală', 'portocala', 'portocale', 'portocalele', 'f', 'food', 'orange', 'oranges'],
  ['apă', 'apa', null, null, 'f', 'drink', 'water', null, 1], ['lapte', 'laptele', null, null, 'n', 'drink', 'milk', null, 1], ['cafea', 'cafeaua', null, null, 'f', 'drink', 'coffee', null, 2],
  ['suc', 'sucul', null, null, 'n', 'drink', 'juice', null, 2], ['ceai', 'ceaiul', null, null, 'n', 'drink', 'tea', null, 2],
  ['carte', 'cartea', 'cărți', 'cărțile', 'f', 'read', 'book', 'books'], ['scrisoare', 'scrisoarea', 'scrisori', 'scrisorile', 'f', 'read', 'letter', 'letters'],
  ['revistă', 'revista', 'reviste', 'revistele', 'f', 'read', 'magazine', 'magazines'], ['ziar', 'ziarul', 'ziare', 'ziarele', 'n', 'read', 'newspaper', 'newspapers'],
  ['casă', 'casa', 'case', 'casele', 'f', 'place', 'house', 'houses'], ['oraș', 'orașul', 'orașe', 'orașele', 'n', 'place', 'town', 'towns'],
  ['școală', 'școala', 'școli', 'școlile', 'f', 'place', 'school', 'schools'], ['parc', 'parcul', 'parcuri', 'parcurile', 'n', 'place', 'park', 'parks'],
  ['plajă', 'plaja', 'plaje', 'plajele', 'f', 'place', 'beach', 'beaches'], ['magazin', 'magazinul', 'magazine', 'magazinele', 'n', 'place', 'store', 'stores'],
  ['restaurant', 'restaurantul', 'restaurante', 'restaurantele', 'n', 'place', 'restaurant', 'restaurants'], ['piață', 'piața', 'piețe', 'piețele', 'f', 'place', 'market', 'markets'],
  ['birou', 'biroul', 'birouri', 'birourile', 'n', 'place', 'office', 'offices'], ['bucătărie', 'bucătăria', 'bucătării', 'bucătăriile', 'f', 'place', 'kitchen', 'kitchens'],
  ['bibliotecă', 'biblioteca', 'biblioteci', 'bibliotecile', 'f', 'place', 'library', 'libraries'], ['biserică', 'biserica', 'biserici', 'bisericile', 'f', 'place', 'church', 'churches'],
  ['mașină', 'mașina', 'mașini', 'mașinile', 'f', 'thing', 'car', 'cars'], ['masă', 'masa', 'mese', 'mesele', 'f', 'thing', 'table', 'tables'],
  ['scaun', 'scaunul', 'scaune', 'scaunele', 'n', 'thing', 'chair', 'chairs'], ['telefon', 'telefonul', 'telefoane', 'telefoanele', 'n', 'thing', 'phone', 'phones'],
  ['minge', 'mingea', 'mingi', 'mingile', 'f', 'thing', 'ball', 'balls'], ['floare', 'floarea', 'flori', 'florile', 'f', 'thing', 'flower', 'flowers'],
  ['ușă', 'ușa', 'uși', 'ușile', 'f', 'thing', 'door', 'doors'], ['fereastră', 'fereastra', 'ferestre', 'ferestrele', 'f', 'thing', 'window', 'windows'],
  ['cadou', 'cadoul', 'cadouri', 'cadourile', 'n', 'thing', 'gift', 'gifts'], ['bicicletă', 'bicicleta', 'biciclete', 'bicicletele', 'f', 'thing', 'bike', 'bikes']];
const RO_OPENABLE = ['ușă', 'fereastră', 'carte', 'revistă', 'magazin', 'birou', 'restaurant', 'bibliotecă', 'ziar', 'scrisoare', 'cadou'];
const RO_NO_IN = ['plajă', 'piață'];   // you're "la plajă", "la piață", not "în plajă"
//            m sing     f sing      m plural    f plural     English      describes
const RO_ADJ = [['bun', 'bună', 'buni', 'bune', 'good', 'pafrl'], ['rău', 'rea', 'răi', 'rele', 'bad', 'pa'],
  ['mare', 'mare', 'mari', 'mari', 'big', 'patl'], ['mic', 'mică', 'mici', 'mici', 'small', 'patl'],
  ['nou', 'nouă', 'noi', 'noi', 'new', 'tlr'], ['vechi', 'veche', 'vechi', 'vechi', 'old', 'tlr'],
  ['frumos', 'frumoasă', 'frumoși', 'frumoase', 'beautiful', 'patl'], ['tânăr', 'tânără', 'tineri', 'tinere', 'young', 'pa'],
  ['roșu', 'roșie', 'roșii', 'roșii', 'red', 'tf'], ['albastru', 'albastră', 'albaștri', 'albastre', 'blue', 't'], ['verde', 'verde', 'verzi', 'verzi', 'green', 'tf'],
  ['negru', 'neagră', 'negri', 'negre', 'black', 'at'], ['alb', 'albă', 'albi', 'albe', 'white', 'atf'], ['galben', 'galbenă', 'galbeni', 'galbene', 'yellow', 'tf'],
  ['scump', 'scumpă', 'scumpi', 'scumpe', 'expensive', 'tflr'], ['ușor', 'ușoară', 'ușori', 'ușoare', 'easy', 'r'], ['greu', 'grea', 'grei', 'grele', 'hard', 'r'],
  ['rapid', 'rapidă', 'rapizi', 'rapide', 'fast', 'pat'], ['simpatic', 'simpatică', 'simpatici', 'simpatice', 'nice', 'p'], ['deștept', 'deșteaptă', 'deștepți', 'deștepte', 'smart', 'p'],
  ['fericit', 'fericită', 'fericiți', 'fericite', 'happy', 'pa'], ['trist', 'tristă', 'triști', 'triste', 'sad', 'pa'], ['delicios', 'delicioasă', 'delicioși', 'delicioase', 'delicious', 'f'],
  ['rece', 'rece', 'reci', 'reci', 'cold', 'fl'], ['cald', 'caldă', 'calzi', 'calde', 'hot', 'f'], ['curat', 'curată', 'curați', 'curate', 'clean', 'tl'], ['murdar', 'murdară', 'murdari', 'murdare', 'dirty', 'tl'],
  ['obosit', 'obosită', 'obosiți', 'obosite', 'tired', 'pa'], ['vesel', 'veselă', 'veseli', 'vesele', 'cheerful', 'pa'], ['bolnav', 'bolnavă', 'bolnavi', 'bolnave', 'sick', 'pa']];
//            infinitive  eu, tu, el/ea, noi, voi, ei/ele                                   kind    what it takes   needs one  English   he/she form  who  reflexive
const RO_VERB = [['mânca', ['mănânc', 'mănânci', 'mănâncă', 'mâncăm', 'mâncați', 'mănâncă'], 'tr', ['food'], 0, 'eat', 'eats', 'a'],
  ['bea', ['beau', 'bei', 'bea', 'bem', 'beți', 'beau'], 'tr', ['drink'], 0, 'drink', 'drinks', 'a'],
  ['găti', ['gătesc', 'gătești', 'gătește', 'gătim', 'gătiți', 'gătesc'], 'tr', ['food'], 0, 'cook', 'cooks', 'p'],
  ['citi', ['citesc', 'citești', 'citește', 'citim', 'citiți', 'citesc'], 'tr', ['read'], 0, 'read', 'reads', 'p'],
  ['scrie', ['scriu', 'scrii', 'scrie', 'scriem', 'scrieți', 'scriu'], 'tr', ['read'], 0, 'write', 'writes', 'p'],
  ['cumpăra', ['cumpăr', 'cumperi', 'cumpără', 'cumpărăm', 'cumpărați', 'cumpără'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'buy', 'buys', 'p'],
  ['vinde', ['vând', 'vinzi', 'vinde', 'vindem', 'vindeți', 'vând'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'sell', 'sells', 'p'],
  ['avea', ['am', 'ai', 'are', 'avem', 'aveți', 'au'], 'avea', ['*'], 1, 'have', 'has', 'a'],
  ['vrea', ['vreau', 'vrei', 'vrea', 'vrem', 'vreți', 'vor'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'want', 'wants', 'a'],
  ['căuta', ['caut', 'cauți', 'caută', 'căutăm', 'căutați', 'caută'], 'tr', ['*'], 1, 'look for', 'looks for', 'a'],
  ['vedea', ['văd', 'vezi', 'vede', 'vedem', 'vedeți', 'văd'], 'tr', ['*'], 1, 'see', 'sees', 'a'],
  ['iubi', ['iubesc', 'iubești', 'iubește', 'iubim', 'iubiți', 'iubesc'], 'tr', ['food', 'drink', 'read', 'thing', 'animal', 'place'], 1, 'love', 'loves', 'a'],
  ['vizita', ['vizitez', 'vizitezi', 'vizitează', 'vizităm', 'vizitați', 'vizitează'], 'tr', ['place'], 1, 'visit', 'visits', 'p'],
  ['deschide', ['deschid', 'deschizi', 'deschide', 'deschidem', 'deschideți', 'deschid'], 'tr', ['open'], 1, 'open', 'opens', 'p'],
  ['închide', ['închid', 'închizi', 'închide', 'închidem', 'închideți', 'închid'], 'tr', ['open'], 1, 'close', 'closes', 'p'],
  ['vorbi', ['vorbesc', 'vorbești', 'vorbește', 'vorbim', 'vorbiți', 'vorbesc'], 'in', null, 0, 'talk', 'talks', 'p'],
  ['lucra', ['lucrez', 'lucrezi', 'lucrează', 'lucrăm', 'lucrați', 'lucrează'], 'in', null, 0, 'work', 'works', 'p'],
  ['învăța', ['învăț', 'înveți', 'învață', 'învățăm', 'învățați', 'învață'], 'in', null, 0, 'study', 'studies', 'p'],
  ['alerga', ['alerg', 'alergi', 'aleargă', 'alergăm', 'alergați', 'aleargă'], 'in', null, 0, 'run', 'runs', 'a'],
  ['dormi', ['dorm', 'dormi', 'doarme', 'dormim', 'dormiți', 'dorm'], 'in', null, 0, 'sleep', 'sleeps', 'a'],
  ['locui', ['locuiesc', 'locuiești', 'locuiește', 'locuim', 'locuiți', 'locuiesc'], 'in', null, 0, 'live', 'lives', 'a'],
  ['merge', ['merg', 'mergi', 'merge', 'mergem', 'mergeți', 'merg'], 'merge', null, 1, 'go', 'goes', 'a'],
  ['fi', ['sunt', 'ești', 'este', 'suntem', 'sunteți', 'sunt'], 'fi', null, 1, 'be', 'is', 'a'],
  // reflexive verbs: the 9th item (1) means they need mă / te / se / ne / vă right before them
  ['se juca', ['joc', 'joci', 'joacă', 'jucăm', 'jucați', 'joacă'], 'in', null, 0, 'play', 'plays', 'a', 1],
  ['se trezi', ['trezesc', 'trezești', 'trezește', 'trezim', 'treziți', 'trezesc'], 'in', null, 0, 'wake up', 'wakes up', 'a', 1],
  ['se spăla', ['spăl', 'speli', 'spală', 'spălăm', 'spălați', 'spală'], 'in', null, 0, 'wash up', 'washes up', 'p', 1],
  ['se îmbrăca', ['îmbrac', 'îmbraci', 'îmbracă', 'îmbrăcăm', 'îmbrăcați', 'îmbracă'], 'in', null, 0, 'get dressed', 'gets dressed', 'p', 1],
  ['se culca', ['culc', 'culci', 'culcă', 'culcăm', 'culcați', 'culcă'], 'in', null, 0, 'go to bed', 'goes to bed', 'p', 1]];
const RO_REFL = ['mă', 'te', 'se', 'ne', 'vă', 'se'];
//            word        English      where it goes: edge = start or end · post = after the verb (or at the end) · end = at the end
const RO_ADV = [['azi', 'today', 'edge'], ['mâine', 'tomorrow', 'edge'], ['acum', 'now', 'edge'], ['mereu', 'always', 'post'], ['des', 'often', 'post'],
  ['mult', 'a lot', 'post'], ['bine', 'well', 'post'], ['aici', 'here', 'end']];
const RO_PREP = [['în', 'in'], ['la', 'to / at'], ['cu', 'with'], ['pentru', 'for']];
const RO_CONJ = [['și', 'and'], ['dar', 'but'], ['sau', 'or']];
const RO_KIND = { food: 'food', drink: 'drinks', read: 'things you read or write', thing: 'things', place: 'places', animal: 'animals', person: 'people', open: 'things you can open' };
const RO_HOW_VERBS = /^(vorbi|lucra|învăța|se juca|alerga|dormi|mânca|bea|citi|scrie|găti)$/;   // verbs that go with bine / mult

/* chips (each has its own English "gloss" for the little word label) */
const roPron = p => chip({ k: 'pron', w: p[0], f: p[1], per: RO_FORM[p[1]][0], num: RO_FORM[p[1]][1], g: p[2], en: p[3], gloss: p[3] });
const roPronW = w => roPron(RO_PRON.find(p => p[0] === w));
const roDetW = w => { const d = RO_DET.find(x => x[0] === w); return chip({ k: 'det', w, fam: d[1], cls: d[1] === 'un' ? 'art' : d[1] === 'acest' ? 'dem' : d[1] === 'niste' ? 'qty' : 'num', en: d[4], gloss: d[4] }); };
const roNounW = (n, num, def) => num === 'p' ? (def ? n[3] : n[2]) : (def ? n[1] : n[0]);
const roNoun = (n, num, def) => { const en = num === 'p' ? n[7] : n[6]; return chip({ k: 'noun', w: roNounW(n, num, def), e: n, g: n[4], num, def: !!def, cat: n[5], mass: n[8] || 0, en, gloss: def ? 'the ' + en : en }); };
const roPoss = (p, w) => chip({ k: 'det', cls: 'poss', w, e: p, en: p[4], gloss: p[4] });   // a determiner that goes after its noun
const roIsPoss = t => t?.k === 'det' && t.cls === 'poss';
const roAdj = (a, w) => chip({ k: 'adj', w, e: a, en: a[4], gloss: a[4] });
const roVerb = (v, f) => chip({ k: 'verb', w: v[1][f], e: v, f, type: v[2], gloss: 'to ' + v[5] });
const roRefl = w => chip({ k: 'refl', w, en: 'oneself', gloss: 'oneself' });
const roPrep = w => chip({ k: 'prep', w, en: RO_PREP.find(p => p[0] === w)[1], gloss: RO_PREP.find(p => p[0] === w)[1] });
const roConj = w => chip({ k: 'conj', w, en: RO_CONJ.find(c => c[0] === w)[1], gloss: RO_CONJ.find(c => c[0] === w)[1] });
const roAdv = w => { const a = RO_ADV.find(x => x[0] === w); return chip({ k: 'adv', w, en: a[1], pos: a[2], gloss: a[1] }); };
const roNu = () => chip({ k: 'neg', w: 'nu', en: 'not', gloss: 'not' });
const roNever = () => chip({ k: 'pas', w: 'niciodată', en: 'never', gloss: 'never' });
const roFoarte = () => chip({ k: 'int', w: 'foarte', en: 'very', gloss: 'very' });

/* ---------------- Romanian checker ---------------- */
function roCheck(T) {
  let i = 0;
  const err = (msg, at = i) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length }), peek = (o = 0) => T[i + o], isErr = x => x && x.ok === false;
  if (!T.length) return err('Tap some words to build a sentence.');
  const gName = (g, num) => g === 'n' ? (num === 'p' ? 'neuter (plural neuter words act feminine)' : 'neuter (singular neuter words act masculine)') : g === 'f' ? 'feminine' : 'masculine';
  const nName = n => n === 'p' ? 'plural' : 'singular';
  const indefW = n => n.num === 'p' ? n.e[2] : n.e[0], defW = n => n.num === 'p' ? n.e[3] : n.e[1];
  const npText = np => np.coord ? np.coord.map(npText).join(' și ') : [np.det?.w, np.n.w, np.poss?.w, np.tres ? 'foarte' : '', np.adj?.w].filter(Boolean).join(' ');
  // a noun phrase: (determiner) noun (possessive) (foarte) (describing word)
  // role: subj · obj · cu (after cu / pentru) · bare (after în / la) · obj-bare (after avea, where "am mașină" is fine)
  function NP(role, prep) {
    const start = i; let det = null, poss = null, adj = null, tres = false;
    if (peek()?.k === 'det' && !roIsPoss(peek())) det = T[i++];
    if (peek()?.k === 'int' || peek()?.k === 'adj') {
      const n = T.slice(i, i + 3).find(t => t.k === 'noun'), a = T.slice(i, i + 2).find(t => t.k === 'adj');
      return err(`In Romanian the describing word goes after the noun${n && a ? `: “${[det?.w, n.w, a.w].filter(Boolean).join(' ')}”` : ''}.`, i);
    }
    if (roIsPoss(peek())) return err(`“${peek().w}” goes after the noun, and the noun keeps its “the” ending: “câinele meu”, “casa mea”.`, i);
    const n = peek();
    if (!n || n.k !== 'noun') return err(det ? `“${det.w}” comes before a noun, so a noun has to follow it.` : role === 'subj' ? 'Start with who does it: a pronoun like “eu” or “ea”, a noun like “câinele”, or go straight to the verb.' : 'A noun (a person, place or thing) should go here.', det ? i - 1 : i);
    i++;
    if (det) {
      if (n.def) return err(`After “${det.w}”, use the noun without its “the” ending: “${det.w} ${indefW(n)}”, not “${det.w} ${n.w}”.`, start + 1);
      if (det.fam === 'un' && n.num === 'p') return err(`“${det.w}” means one. For more than one, use “niște” (some): “niște ${n.w}”.`, start);
      if (det.fam === 'un' && n.mass === 1) return err(`You can’t count “${n.w}”, so say “niște ${n.w}” (some), or just “${n.w}”.`, start);
      if (det.fam === 'niste' && n.num === 's' && !n.mass) return err(`“niște” means some (more than one), so the noun must be plural${n.e[2] ? `: “niște ${n.e[2]}”` : ''}. For one, use “${roDetWant('un', n.g, 's')} ${n.w}”.`, start);
      if ((det.fam === 'doi' || det.fam === 'trei') && n.num === 's') return err(`“${det.w}” means more than one, so the noun must be plural${n.e[2] ? `: “${roDetWant(det.fam, n.g, 'p')} ${n.e[2]}”` : ''}.`, start);
      if (det.fam === 'acest' && det.w !== roDetWant('acest', n.g, n.num) || det.fam === 'un' && det.w !== roDetWant('un', n.g, 's') || det.fam === 'doi' && det.w !== roDetWant('doi', n.g, 'p')) {
        const want = roDetWant(det.fam, n.g, n.num);
        return err(`“${n.w}” is ${gName(n.g, n.num)} ${nName(n.num)}, so use “${want}”: “${want} ${n.w}”.`, start);
      }
      if (prep === 'în' && det.fam === 'un') return err(`Romanian joins “în” + “${det.w}” into “într-${det.w}”. Here, just say “în ${n.w}” (in the ${n.en}).`, start - 1);
    } else if (!n.def) {
      const both = n.num === 'p' ? `“${defW(n)}” (the ${n.en}) or “niște ${n.w}” (some ${n.en})` : `“${defW(n)}” (the ${n.en}) or “${roDetWant('un', n.g, 's')} ${n.w}” (a ${n.en})`;
      if (role === 'subj' && !roIsPoss(peek())) return err(`Romanian needs the “the” ending or a word like “un / o” here: ${both}.`, start);
      if ((role === 'obj' || role === 'cu') && n.num === 's' && !n.mass && !roIsPoss(peek())) return err(`Say ${both}. On its own, “${n.w}” needs one of them here.`, start);
    }
    if (roIsPoss(peek())) {
      const p = T[i];
      if (det) return err(`A word like “${p.w}” goes after a noun that has its “the” ending, with no “${det.w}”: “${defW(n)} ${p.e[roIdx(n.g, n.num)]}”.`, start);
      if (!n.def) return err(`Before “${p.w}”, the noun needs its “the” ending: “${defW(n)} ${p.e[roIdx(n.g, n.num)]}”.`, i - 1);
      const want = p.e[roIdx(n.g, n.num)];
      if (p.w !== want) return err(`“${p.w}” has to match “${n.w}” (${gName(n.g, n.num)} ${nName(n.num)}): use “${want}”.`, i);
      poss = p; i++;
    }
    if (peek()?.k === 'int' || peek()?.k === 'adj') {
      const at = i; if (peek().k === 'int') { tres = true; i++; }
      const a = peek(); if (!a || a.k !== 'adj') return err('“foarte” (very) goes right before a describing word: “foarte mare”.', at);
      const want = a.e[roIdx(n.g, n.num)];
      if (a.w !== want) return err(`“${a.w}” has to match “${n.w}” (${gName(n.g, n.num)} ${nName(n.num)}): use “${want}”.`, i);
      adj = a; i++;
      if (peek()?.k === 'adj') return err('Use one describing word per noun here.');
      if (roIsPoss(peek())) return err(`Put “${peek().w}” right after the noun, before the describing word: “${n.w} ${peek().w} ${a.w}”.`);
    }
    if (role === 'bare' && n.def && !poss && !adj) return err(`After “${prep}”, Romanian leaves off the “the” ending: “${prep} ${indefW(n)}”, not “${prep} ${n.w}”.`, start);
    return { det, n, poss, adj, tres, num: n.num, g: n.g, cat: n.cat, role };
  }
  function NPs(role, prep) {
    const a = NP(role, prep); if (isErr(a)) return a;
    const c = peek();
    if (c?.k === 'conj' && (c.w === 'și' || c.w === 'sau') && ['det', 'noun', 'pron'].includes(peek(1)?.k)) {
      const save = i; i++;
      if (peek().k === 'pron') { if (role === 'subj') return err(`Join two nouns here, like “câinele și pisica”. To add “${peek().w}”, start a new part of the sentence with “și”.`, i); i = save; return a; }
      const b = NP(role, prep);
      if (isErr(b) || (role !== 'subj' && ['verb', 'neg', 'pron', 'refl'].includes(peek()?.k))) { i = save; return a; }
      // more than one: masculine if any of them is masculine, otherwise feminine (plural neuter words count as feminine)
      return { coord: [a, b], conj: c, num: 'p', g: [a, b].some(x => roAg(x.g, x.num) === 'm') ? 'm' : 'f', per: 3, cat: a.cat };
    }
    return a;
  }
  // a definite person after see / look for / like needs "îl văd pe…", which this game doesn't build
  const personDef = np => (np.coord || [np]).find(p => p.cat === 'person' && (p.n.def || p.poss));
  function clause() {
    const C = { lead: [], subj: null, neg: null, never: null, refl: null, verb: null, comp: null, pps: [], tail: [], post: [] }, cStart = i;
    while (peek()?.k === 'adv') { const a = peek(); if (a.pos !== 'edge') return err(`“${a.w}” goes ${a.pos === 'post' ? 'after the verb' : 'at the end'}, not at the start.`); C.lead.push(T[i++]); }
    if (peek()?.k === 'conj') return err(`“${peek().w}” joins two parts, so it can’t ${i === 0 ? 'start the sentence' : 'go here'}.`);
    if (peek()?.k === 'pron') { const p = T[i++]; C.subj = { pron: p, f: p.f, num: p.num, g: p.g }; }
    else if (['det', 'noun', 'adj', 'int'].includes(peek()?.k)) { const s = NPs('subj'); if (isErr(s)) return s; C.subj = s.coord ? { np: s, f: 5, num: 'p', g: s.g } : { np: s, f: s.num === 'p' ? 5 : 2, num: s.num, g: roAg(s.g, s.num) }; }
    if (peek()?.k === 'pas') return err('“niciodată” (never) goes after the verb, with “nu” before the verb: “nu mănânc niciodată”.');
    if (peek()?.k === 'neg') { C.neg = T[i++]; if (!['verb', 'refl'].includes(peek()?.k)) return err('“nu” goes right before the verb (or before mă / te / se): “nu mănânc”, “nu mă trezesc”.', i - 1); }
    if (peek()?.k === 'refl') {
      const at = i; C.refl = T[i++];
      if (peek()?.k === 'neg') return err(`“nu” goes before “${C.refl.w}”: “nu ${C.refl.w} …”.`, i);
      if (peek()?.k !== 'verb') return err(`“${C.refl.w}” goes right before a verb, like “${C.refl.w} ${RO_VERB.find(v => v[0] === 'se trezi')[1][Math.max(0, RO_REFL.indexOf(C.refl.w))]}”.`, at);
    }
    const v = peek(), sText = C.subj ? (C.subj.pron ? C.subj.pron.w : npText(C.subj.np)) : '';
    if (!v) return err(C.subj ? 'Now add a verb (an action word like “mănâncă” or “este”).' : 'Every sentence needs a verb.');
    if (v.k !== 'verb') {
      if (v.k === 'pron' && C.subj) return err('A sentence has only one subject (who does it).');
      if (v.k === 'adv') return err(`“${v.w}” goes ${v.pos === 'post' ? 'after the verb' : v.pos === 'end' ? 'at the end' : 'at the start or the end'}.`);
      return err(`After ${C.subj ? `“${sText}”` : 'that'} the next word should be a verb. “${v.w}” isn’t a verb.`);
    }
    i++; C.verb = v;
    const reflAt = C.refl ? i - 2 : -1, f = C.subj ? C.subj.f : v.f;
    C.f = f;
    if (v.e[8] && !C.refl) return err(`“${v.e[0]}” needs “${RO_REFL[f]}” right before the verb: “${RO_REFL[f]} ${v.e[1][f]}”.`, i - 1);
    if (C.refl && !v.e[8]) return err(`“${C.refl.w}” only goes with verbs like “a se trezi”. Take it out: just “${v.w}”.`, reflAt);
    // the same word can be two forms (sunt = I am / they are), so compare words, not form numbers
    if (C.subj && v.e[1][C.subj.f] !== v.w) return err(`“${v.w}” doesn’t match the subject “${sText}”. Use “${v.e[1][C.subj.f]}”.`, i - 1);
    if (C.refl && C.refl.w !== RO_REFL[f]) return err(`“${C.refl.w}” doesn’t match “${v.w}”. Use “${RO_REFL[f]} ${v.w}”.`, reflAt);
    if (C.subj?.np && v.type !== 'fi') for (const part of C.subj.np.coord || [C.subj.np]) {
      const c = part.cat, what = part.num === 'p' ? part.n.en : 'a ' + part.n.en;
      if (c !== 'person' && c !== 'animal') return err(`That doesn’t make sense: ${what} can’t ${v.e[5]}. Use a person or an animal here.`, cStart);
      if (c === 'animal' && v.e[7] === 'p') return err(`That doesn’t make sense: ${what} can’t ${v.e[5]}. Only people ${v.e[5]}.`, cStart);
    }
    const postAdv = () => { while (peek()?.k === 'pas' || (peek()?.k === 'adv' && peek().pos === 'post')) { const a = T[i++]; if (a.k === 'pas') C.never = a; else C.post.push(a); } };
    postAdv();
    if (C.never && !C.neg) return err(`“niciodată” needs “nu” before the verb too: “nu ${[C.refl?.w, v.w].filter(Boolean).join(' ')} niciodată”.`, i - 1);
    const nx = peek(), sNum = C.subj ? C.subj.num : RO_FORM[f][1], sG = C.subj ? C.subj.g : 'x';
    if (v.type === 'fi') {
      if (!nx || nx.k === 'conj') return err(`“${v.w}” needs something after it: a describing word (“${v.w} ${sNum === 'p' ? 'obosiți' : 'obosit'}”) or a place (“în parc”, “la școală”).`, i - 1);
      if (nx.k === 'adj' || nx.k === 'int') {
        let tres = false; if (nx.k === 'int') { tres = true; i++; if (peek()?.k !== 'adj') return err('“foarte” goes right before a describing word: “foarte mare”.', i - 1); }
        const a = T[i], m = a.e[sNum === 'p' ? 2 : 0], fe = a.e[sNum === 'p' ? 3 : 1];
        if (sG === 'x' ? ![m, fe].includes(a.w) : a.w !== a.e[(sNum === 'p' ? 2 : 0) + (sG === 'f' ? 1 : 0)]) {
          const sub = C.subj?.np && !C.subj.np.coord && C.subj.np.g === 'n' ? ` (“${C.subj.np.n.w}” is neuter, so it acts ${sNum === 'p' ? 'feminine in the plural' : 'masculine in the singular'})` : '';
          return err(`“${a.w}” has to match the subject (${sG === 'x' ? '' : (sG === 'f' ? 'feminine' : 'masculine') + ' '}${nName(sNum)})${sub}: use “${sG === 'f' ? fe : m}”${sG === 'x' && fe !== m ? ` or “${fe}”` : ''}.`);
        }
        i++; C.comp = { adj: a, tres };
      } else if (['det', 'noun'].includes(nx.k)) return err(`After “${v.w}”, put a describing word (“${sNum === 'p' ? 'fericiți' : 'fericit'}”) or a place (“în parc”, “la școală”).`);
      else if (!(nx.k === 'prep' && ['în', 'la'].includes(nx.w)) && !(nx.k === 'adv' && nx.w === 'aici')) return err(`After “${v.w}”, put a describing word or a place (“la școală”, “în bucătărie”).`);
    } else if (v.type === 'merge') {
      if (!nx || nx.k !== 'prep' || !['la', 'în'].includes(nx.w)) return err(`“${v.w}” (go) needs where you go: “${v.w} la școală” or “${v.w} în parc”.`, nx ? i : i - 1);
      i++; const np = NP('bare', nx.w); if (isErr(np)) return np;
      if (np.cat !== 'place') return err(`“${v.w} ${nx.w}” needs a place: “${v.w} la plajă”. “${np.n.w}” isn’t a place.`, i - 1);
      if (nx.w === 'în' && RO_NO_IN.includes(np.n.e[0])) return err(`Romanian says “la ${np.n.e[0]}”, not “în ${np.n.e[0]}”.`, i - 2);
      C.comp = { dest: np, p: nx };
    } else if (v.type === 'tr' || v.type === 'avea') {
      if (nx && ['det', 'noun', 'adj', 'int'].includes(nx.k)) {
        const np = NPs(v.type === 'avea' ? 'obj-bare' : 'obj'); if (isErr(np)) return np;
        for (const p of np.coord || [np]) if (v.e[3][0] === 'open' ? !RO_OPENABLE.includes(p.n.e[0]) : v.e[3][0] !== '*' && !v.e[3].includes(p.cat)) return err(`That doesn’t make sense: you can’t ${v.e[5]} ${p.num === 'p' || p.n.mass ? p.n.en : 'a ' + p.n.en}. “a ${v.e[0]}” goes with ${v.e[3].map(c => RO_KIND[c]).join(', ')}.`);
        // a iubi (to love) talks about things in general, so it takes the "the" ending: iubesc cărțile
        if (v.e[0] === 'iubi') for (const p of np.coord || [np]) if (!p.n.def) return err(`With “a iubi” (to love), Romanian uses the “the” ending, because you mean ${p.n.e[7] || p.n.e[6]} in general: “${v.w} ${p.num === 'p' ? p.n.e[3] : p.n.e[1]}”.`);
        const pd = v.type === 'tr' && personDef(np);
        if (pd) return err(`With a particular person, Romanian says “îl văd pe ${pd.n.e[0]}” (with “pe”), which this game doesn’t build yet. Try “${v.w} ${roDetWant('un', pd.n.g, 's')} ${pd.n.e[0]}” (a ${pd.n.e[6]}).`);
        C.comp = { np };
      } else if (v.e[4]) return err(`“${v.w}” needs something after it. What do you ${v.e[5]}? For example “${v.w} ${{ food: 'un măr', drink: 'apă', read: 'o carte', thing: 'o minge', place: 'orașul', animal: 'un câine', person: 'un prieten', open: 'ușa', '*': 'o carte' }[v.e[3][0]]}”.`, i - 1);
    } else if (nx && ['det', 'noun', 'adj'].includes(nx.k)) return err(`“a ${v.e[0]}” (to ${v.e[5]}) doesn’t take an object. You can add a place: “${v.w} în parc”, or a person: “${v.w} cu un prieten”.`);
    postAdv();
    if (C.never && !C.neg) return err('“niciodată” needs “nu” before the verb too.', i - 1);
    // în / la + a place, cu / pentru + someone
    while (peek()?.k === 'prep') {
      const p = T[i++];
      if (v.type === 'merge' && ['la', 'în'].includes(p.w)) return err('Say where you go only once.', i - 1);
      const bare = p.w === 'în' || p.w === 'la';
      const np = NP(bare ? 'bare' : 'cu', p.w); if (isErr(np)) return np;
      if (bare && np.cat !== 'place') return err(`“${p.w}” + a place: “${p.w === 'în' ? 'în bucătărie' : 'la școală'}”. “${np.n.w}” isn’t a place.${v.e[0] === 'vorbi' ? ' (You talk “cu” a person: “vorbesc cu un prieten”.)' : ''}`, i - 1);
      if (p.w === 'în' && RO_NO_IN.includes(np.n.e[0])) return err(`Romanian says “la ${np.n.e[0]}”, not “în ${np.n.e[0]}”.`, i - 1);
      if (!bare && !['person', 'animal'].includes(np.cat)) return err(`“${p.w}” + a person or an animal here: “${p.w} un prieten”, “${p.w} mama”.`, i - 1);
      C.pps.push({ p, np });
    }
    while (peek()?.k === 'pas' || (peek()?.k === 'adv' && peek().pos !== 'edge-only')) { const a = T[i++]; if (a.k === 'pas') { if (!C.neg) return err('“niciodată” needs “nu” before the verb too.', i - 1); C.never = a; } else C.tail.push(a); }
    if (v.type === 'fi' && !C.comp && !C.pps.length && !C.tail.some(a => a.w === 'aici')) return err(`“${v.w}” needs something after it: a describing word (“fericit”) or a place (“în parc”).`, i - 1);
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
    return err(x.k === 'adj' ? `“${x.w}” needs to go right after the noun it describes.` : roIsPoss(x) ? `“${x.w}” goes right after its noun.` : x.k === 'det' ? `“${x.w}” needs its noun right after it, in the right place.` : x.k === 'verb' ? 'One verb per sentence part. Use “și” or “dar” to add another.'
      : x.k === 'pron' ? 'The subject (who does it) goes at the start. To add another sentence, use “și” first.' : x.k === 'neg' ? '“nu” goes right before the verb.'
      : x.k === 'int' ? '“foarte” goes right before a describing word.' : x.k === 'prep' ? `“${x.w}” needs a noun after it, in the right place.` : `“${x.w}” doesn’t fit here.`);
  }
  return { ok: true, P };
}

/* English meaning of a correct Romanian sentence */
function roEnglish(P) {
  const an = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
  const npEn = (np, generic) => {
    if (np.coord) return np.coord.map(x => npEn(x, generic)).join(np.conj?.w === 'sau' ? ' or ' : ' and ');
    const adj = np.adj ? (np.tres ? 'very ' : '') + np.adj.e[4] + ' ' : '', noun = np.n.en, d = np.det;
    let art = '';
    if (d) art = d.fam === 'un' ? an(adj || noun) + ' ' : d.fam === 'niste' ? 'some ' : d.en + ' ';
    else if (np.poss) art = np.poss.en + ' ';
    else if (np.n.def) art = generic ? '' : 'the ';
    else if (np.role === 'bare') art = 'the ';
    else if (np.num === 's' && !np.n.mass) art = an(adj || noun) + ' ';   // "am mașină": I have a car
    return art + adj + noun;
  };
  const one = C => {
    const v = C.verb, f = C.f;
    const subj = C.subj ? (C.subj.pron ? C.subj.pron.en : npEn(C.subj.np)) : ['I', 'you', 'he/she', 'we', 'you', 'they'][f];
    const third = f === 2, never = !!C.never;
    // "always" and "often" go before the verb in English; "well" and "a lot" go at the end
    const how = [...C.post, ...C.tail.filter(a => a.pos === 'post')], freq = how.filter(a => ['mereu', 'des'].includes(a.w)).map(a => a.en).join(' '), endAdv = how.filter(a => !['mereu', 'des'].includes(a.w)).map(a => a.en);
    let vp;
    if (v.type === 'fi') {
      const be = f === 0 ? 'am' : third ? 'is' : 'are';
      const what = C.comp?.adj ? (C.comp.tres ? 'very ' : '') + C.comp.adj.e[4] : '';
      vp = `${be}${never ? ' never' : C.neg ? ' not' : ''}${freq ? ' ' + freq : ''} ${what}`;
    } else {
      const base = v.e[5], s3 = v.e[6];
      vp = never ? `never ${third ? s3 : base}` : C.neg ? `${third ? 'does' : 'do'} not${freq ? ' ' + freq : ''} ${base}` : `${freq ? freq + ' ' : ''}${third ? s3 : base}`;
      if (C.comp?.np) vp += ' ' + npEn(C.comp.np, v.e[0] === 'iubi');
      if (C.comp?.dest) vp += ' to ' + npEn(C.comp.dest);
    }
    if (endAdv.length) vp += ' ' + endAdv.join(' ');
    for (const { p, np } of C.pps) vp += ` ${p.w === 'în' ? 'in' : p.w === 'cu' ? 'with' : p.w === 'pentru' ? 'for' : 'at'} ${npEn(np)}`;
    const tail = [...C.lead.map(a => a.en), ...C.tail.filter(a => a.pos !== 'post').map(a => a.en)].join(' ');
    return `${subj} ${vp}${tail ? ' ' + tail : ''}`.replace(/\s+/g, ' ').trim();
  };
  let s = one(P.clauses[0]);
  P.conjs.forEach((c, k) => { s += (c.w === 'și' ? ', and ' : c.w === 'dar' ? ', but ' : ', or ') + one(P.clauses[k + 1]); });
  return s[0].toUpperCase() + s.slice(1) + '.';
}

/* ---------------- making a Romanian tray ---------------- */
function roGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = list => { const fav = list.filter(x => pref.has(x[0]) || (typeof x[1] === 'string' && pref.has(x[1]))); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const nounOf = cats => RP(RO_NOUN.filter(n => cats[0] === '*' || cats.includes(n[5]) || (cats[0] === 'open' && RO_OPENABLE.includes(n[0]))));
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
  const adjFor = cat => RP(RO_ADJ.filter(a => !cat || a[5].includes(CAT[cat] || 'p')));
  const extra = [];
  const other = list => { const x = list.filter(Boolean); return x.length ? R(x) : null; };
  // a noun phrase in one of Romanian's patterns (and look-alikes as distractors)
  // role: subj · obj · cu · bare ; opts.like = a iubi (needs the "the" ending) ; opts.noPerson = no "the" person (needs pe)
  const np = (n, num, out, opts = {}) => {
    const g = n[4], mass = n[8] || 0, role = opts.role || 'obj';
    let mode;
    if (role === 'bare') mode = 'bare';
    else if (opts.like) mode = R(['def', 'def', 'poss']);
    else if (role === 'subj') mode = num === 'p' ? R(['def', 'def', 'poss', 'acest', 'num']) : R(['def', 'def', 'poss', 'un', 'acest']);
    else if (role === 'cu') mode = R(['def', 'def', 'poss', ...(num === 's' ? ['un'] : [])]);
    else if (num === 'p') mode = R(['def', 'poss', 'niste', 'bare', 'num', 'acest']);
    else if (mass) mode = R(['bare', 'bare', 'def', 'niste', ...(mass === 2 ? ['un'] : [])]);
    else mode = R(['def', 'un', 'un', 'poss', 'acest', ...(opts.bareOk ? ['bare'] : [])]);
    if (opts.noPerson && n[5] === 'person' && ['def', 'poss'].includes(mode)) mode = num === 'p' ? 'num' : 'un';
    const def = ['def', 'poss'].includes(mode);
    if (['un', 'acest', 'num', 'niste'].includes(mode)) {
      const fam = mode === 'num' ? R(['doi', 'doi', 'trei']) : mode, d = roDetWant(fam, g, num);
      out.push(roDetW(d)); const wrong = other(RO_DET.filter(x => x[1] === fam && x[0] !== d).map(x => x[0])); if (wrong) extra.push(roDetW(wrong));
    }
    out.push(roNoun(n, num, def)); extra.push(roNoun(n, num, !def));
    if (mode === 'poss') { const p = R(RO_POSS), w = p[roIdx(g, num)]; out.push(roPoss(p, w)); const wr = other(p.slice(0, 4).filter(x => x !== w)); if (wr) extra.push(roPoss(p, wr)); }
    const a = opts.adj !== false && mode !== 'bare' && coin(0.35) ? adjFor(n[5]) : null;
    if (a) {
      if (coin(0.2)) out.push(roFoarte());
      out.push(roAdj(a, a[roIdx(g, num)]));
      const wr = other(a.slice(0, 4).filter(x => x !== a[roIdx(g, num)])); if (wr) extra.push(roAdj(a, wr));
    }
  };
  const clause = () => {
    const out = [], kind = R(['tr', 'tr', 'tr', 'in', 'fi', 'fi', 'avea', 'merge', 'refl']);
    const verb = kind === 'fi' ? RO_VERB.find(v => v[0] === 'fi') : kind === 'merge' ? RO_VERB.find(v => v[0] === 'merge') : kind === 'avea' ? RO_VERB.find(v => v[0] === 'avea')
      : kind === 'refl' ? RP(RO_VERB.filter(v => v[8])) : RP(RO_VERB.filter(v => v[2] === kind && !v[8]));
    const subjKinds = verb[7] === 'p' ? ['person'] : ['person', 'animal'];
    let f, g = 'x', subjCat = 'person';
    if (coin(0.55)) { const p = R(RO_PRON); f = p[1]; g = p[2]; if (coin(0.7) || g !== 'x') out.push(roPron(p)); extra.push(roPronW(R(['eu', 'tu', 'noi', 'ei', 'ea'].filter(x => x !== p[0])))); }
    else {
      const n = nounOf(subjKinds); subjCat = n[5]; const num = n[2] && coin(0.3) ? 'p' : 's';
      np(n, num, out, { role: 'subj' }); f = num === 'p' ? 5 : 2; g = roAg(n[4], num);
      if (coin(0.12)) { const n2 = nounOf(subjKinds); out.push(roConj('și')); np(n2, 's', out, { role: 'subj', adj: false }); f = 5; g = roAg(n[4], num) === 'm' || n2[4] !== 'f' ? 'm' : 'f'; }
    }
    const neg = kind !== 'fi' && coin(0.22) ? R(['nu', 'nu', 'never']) : kind === 'fi' && coin(0.12) ? 'nu' : null;
    if (neg) out.push(roNu()); else extra.push(roNu());
    if (verb[8]) { out.push(roRefl(RO_REFL[f])); extra.push(roRefl(R(['mă', 'te', 'se', 'ne', 'vă'].filter(x => x !== RO_REFL[f])))); }
    out.push(roVerb(verb, f)); extra.push(roVerb(verb, (f + 1 + Math.floor(Math.random() * 5)) % 6));
    if (neg === 'never') out.push(roNever());
    if (kind === 'fi') {
      const gg = g === 'x' ? R(['m', 'f']) : g, num = RO_FORM[f][1];
      if (coin(0.7)) { if (coin(0.25)) out.push(roFoarte()); const a = adjFor(subjCat), k = (num === 'p' ? 2 : 0) + (gg === 'f' ? 1 : 0); out.push(roAdj(a, a[k])); const wr = other(a.slice(0, 4).filter(x => x !== a[k])); if (wr) extra.push(roAdj(a, wr)); }
      else { const n = nounOf(['place']), p = RO_NO_IN.includes(n[0]) ? 'la' : R(['în', 'la']); out.push(roPrep(p)); np(n, 's', out, { role: 'bare' }); }
    } else if (kind === 'avea') {
      const n = nounOf(['*']), on = n[2] && coin(0.3) ? 'p' : 's'; np(n, on, out, { role: 'obj', bareOk: true, noPerson: true });
    } else if (kind === 'merge') {
      const n = nounOf(['place']), p = RO_NO_IN.includes(n[0]) ? 'la' : R(['la', 'la', 'în']);
      out.push(roPrep(p)); np(n, 's', out, { role: 'bare' }); extra.push(roPrep(p === 'la' ? 'în' : 'la'));
      if (coin(0.3)) { out.push(roPrep('cu')); np(nounOf(['person']), 's', out, { role: 'cu', adj: false }); }
    } else if (kind === 'tr') {
      const n = nounOf(verb[3]), on = n[2] && coin(0.3) ? 'p' : 's';
      np(n, on, out, { role: 'obj', like: verb[0] === 'iubi', noPerson: true });
      if (coin(0.2)) { out.push(roPrep(R(['cu', 'pentru']))); np(nounOf(['person']), 's', out, { role: 'cu', adj: false }); }
      else if (coin(0.15)) { out.push(roPrep('în')); np(RP(RO_NOUN.filter(n => n[5] === 'place' && !RO_NO_IN.includes(n[0]))), 's', out, { role: 'bare' }); }
      extra.push(roNoun(nounOf(['*']), 's', coin(0.5)));
    } else {
      const r = verb[0] === 'locui' ? 0 : Math.random();   // you live somewhere
      if (r < 0.4) { const n = nounOf(['place']), p = RO_NO_IN.includes(n[0]) ? 'la' : R(['în', 'la']); out.push(roPrep(p)); np(n, 's', out, { role: 'bare' }); }
      else if (r < 0.7) { out.push(roPrep('cu')); np(nounOf(['person', 'animal']), 's', out, { role: 'cu', adj: false }); }
    }
    if (coin(0.2) && kind !== 'fi') out.push(roAdv(R(RO_HOW_VERBS.test(verb[0]) && kind !== 'tr' ? ['mereu', 'des', 'bine', 'mult'] : ['mereu', 'des'])));   // placed by the fix-up below
    if (coin(0.22)) out.push(roAdv(R(RO_ADV.filter(x => x[2] === 'edge' || x[2] === 'end'))[0]));
    // a "post" adverb goes right after the verb (after niciodată)
    const pi = out.findIndex(c => c?.k === 'adv' && c.pos === 'post');
    if (pi >= 0) { const [a] = out.splice(pi, 1); const vi = out.findIndex(c => c?.k === 'verb'), at = out[vi + 1]?.k === 'pas' ? vi + 2 : vi + 1; out.splice(at, 0, a); }
    // an edge adverb can also open the sentence
    const ei = out.findIndex(c => c?.k === 'adv' && c.pos === 'edge');
    if (ei >= 0 && coin(0.4)) { const [a] = out.splice(ei, 1); out.unshift(a); }
    return out;
  };
  for (let tries = 0; tries < 120; tries++) {
    extra.length = 0;
    let words = clause(); if (!words || words.includes(null)) continue;
    if (Math.random() < 0.25) { const c2 = clause(); if (c2 && !c2.includes(null) && c2[0]?.k !== 'adv') words = [...words, roConj(R(['și', 'și', 'dar', 'sau'])), ...c2]; }
    if (words.length > 14 || words.length < 2) continue;
    const res = roCheck(words); if (!res.ok) continue;
    extra.push(roPrep(R(['în', 'la', 'cu', 'pentru'])), roDetW(R(['un', 'o', 'niște'])));
    if (!words.some(w => w.k === 'conj')) extra.push(roConj(R(['și', 'dar'])));
    const seen = new Set(words.map(w => w.k + w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && !seen.has(x.k + x.w)) { seen.add(x.k + x.w); uniq.push(x); }
    return { words, extra: uniq.slice(0, Math.max(4, 16 - words.length)), english: roEnglish(res.P) };
  }
  return null;
}

BLD_LANGS.ro = { name: 'Romanian', check: roCheck, gen: roGenerate, voice: 'ro-RO', english: roEnglish };
BLD_ORDER.ro = { rows: [
    ['A basic sentence', [['det', '(un / o)'], ['noun', 'noun'], ['adj', '(adjective)'], ['verb', 'verb'], ['det', '(un / o)'], ['noun', 'noun'], ['adj', '(adjective)']]],
    ['Starting with a pronoun (or with the verb)', [['pron', '(pronoun)'], ['verb', 'verb'], ['det', '(un / o)'], ['noun', 'noun']]],
    ['“My”, “your”…', [['noun', 'noun + “the” ending'], ['det', 'meu / mea…'], ['adj', '(adjective)']]],
    ['Saying what something is like (a fi)', [['noun', 'noun + “the” ending'], ['verb', 'este / sunt'], ['adv', '(foarte)'], ['adj', 'adjective']]],
    ['A negative sentence', [['pron', '(pronoun)'], ['adv', 'nu'], ['verb', 'verb'], ['adv', '(niciodată)'], ['noun', 'noun']]],
    ['A verb like a se trezi', [['pron', '(pronoun)'], ['pron', 'mă / te / se'], ['verb', 'verb']]],
    ['Going somewhere', [['pron', '(pronoun)'], ['verb', 'merg'], ['prep', 'la / în'], ['noun', 'place (no ending)']]],
    ['Joining two sentences', [['verb', 'sentence'], ['conj', 'conjunction'], ['verb', 'sentence']]],
  ], tips: [
    ['noun', '“The” is the end of the noun: <b>câine</b> → <b>câinele</b>, <b>casă</b> → <b>casa</b>, <b>câini</b> → <b>câinii</b>. After <b>un</b>, <b>o</b>, <b>niște</b> or <b>acest</b>, the noun has no ending.'],
    ['noun', 'Three genders: a <b>neuter</b> noun is masculine in the singular (<b>un măr</b>) and feminine in the plural (<b>două mere</b>, <b>merele roșii</b>).'],
    ['adj', 'Adjectives come <b>after</b> the noun and match it: <b>o casă mare</b>, <b>câinii negri</b>.'],
    ['det', '<b>meu</b>, <b>mea</b>, <b>mei</b>, <b>mele</b> go <b>after</b> a noun with its ending: <b>câinele meu</b>, <b>casa mea</b>.'],
    ['prep', 'After <b>în</b> and <b>la</b>, leave the ending off: <b>în parc</b>, <b>la școală</b>.'],
    ['adv', '<b>nu</b> goes right before the verb. <b>niciodată</b> goes after it and needs <b>nu</b> too: <b>nu mănânc niciodată</b>.'],
    ['pron', 'You can leave out the pronoun, because the verb already shows who: <b>mănânc</b> = I eat.'] ] };

/* ---------------- Your own Romanian words (📚 Add my deck's words) ---------------- */
// Present tense of common irregular verbs: eu, tu, el/ea, noi, voi, ei/ele
const RO_IRREG_FORMS = {
  fi: 'sunt ești este suntem sunteți sunt', avea: 'am ai are avem aveți au', vrea: 'vreau vrei vrea vrem vreți vor', bea: 'beau bei bea bem beți beau',
  lua: 'iau iei ia luăm luați iau', da: 'dau dai dă dăm dați dau', sta: 'stau stai stă stăm stați stau', ști: 'știu știi știe știm știți știu',
  face: 'fac faci face facem faceți fac', zice: 'zic zici zice zicem ziceți zic', spune: 'spun spui spune spunem spuneți spun', pune: 'pun pui pune punem puneți pun',
  putea: 'pot poți poate putem puteți pot', veni: 'vin vii vine venim veniți vin', ține: 'țin ții ține ținem țineți țin', mânca: 'mănânc mănânci mănâncă mâncăm mâncați mănâncă',
  vedea: 'văd vezi vede vedem vedeți văd', scrie: 'scriu scrii scrie scriem scrieți scriu', vinde: 'vând vinzi vinde vindem vindeți vând', merge: 'merg mergi merge mergem mergeți merg',
  cumpăra: 'cumpăr cumperi cumpără cumpărăm cumpărați cumpără', învăța: 'învăț înveți învață învățăm învățați învață', dormi: 'dorm dormi doarme dormim dormiți dorm',
  juca: 'joc joci joacă jucăm jucați joacă', cânta: 'cânt cânți cântă cântăm cântați cântă', ajuta: 'ajut ajuți ajută ajutăm ajutați ajută', aștepta: 'aștept aștepți așteaptă așteptăm așteptați așteaptă',
  intra: 'intru intri intră intrăm intrați intră', căuta: 'caut cauți caută căutăm căutați caută', purta: 'port porți poartă purtăm purtați poartă', alerga: 'alerg alergi aleargă alergăm alergați aleargă',
  deschide: 'deschid deschizi deschide deschidem deschideți deschid', închide: 'închid închizi închide închidem închideți închid', crede: 'cred crezi crede credem credeți cred',
  trimite: 'trimit trimiți trimite trimitem trimiteți trimit', pleca: 'plec pleci pleacă plecăm plecați pleacă', ieși: 'ies ieși iese ieșim ieșiți ies', simți: 'simt simți simte simțim simțiți simt',
  auzi: 'aud auzi aude auzim auziți aud', fugi: 'fug fugi fuge fugim fugiți fug', spăla: 'spăl speli spală spălăm spălați spală', culca: 'culc culci culcă culcăm culcați culcă',
  îmbrăca: 'îmbrac îmbraci îmbracă îmbrăcăm îmbrăcați îmbracă', sui: 'sui sui suie suim suiți suie', bucura: 'bucur bucuri bucură bucurăm bucurați bucură', uita: 'uit uiți uită uităm uitați uită',
  cere: 'cer ceri cere cerem cereți cer', râde: 'râd râzi râde râdem râdeți râd', plăcea: 'plac placi place plăcem plăceți plac', tăcea: 'tac taci tace tăcem tăceți tac',
};
// a plain -a verb (cânt, cânți, cântă…) rather than the -ez kind (lucrez, lucrezi, lucrează…)
const RO_PLAIN_A = /^(urca|lăsa|arăta|asculta|încerca|întreba|ruga|fuma|cina)$/;
const roReflStrip = inf => String(inf || '').replace(/^a\s+/, '').replace(/^se\s+/, '').trim();
// t → ț, d → z, s → ș, st → șt: the sound change before an -i ending (cânt → cânți, văd → vezi)
const roPal = st => st.replace(/st$/, 'șt').replace(/t$/, 'ț').replace(/d$/, 'z').replace(/s$/, 'ș');
function roConjugate(inf) {
  const w = roReflStrip(inf);
  if (RO_IRREG_FORMS[w]) return RO_IRREG_FORMS[w].split(' ');
  if (/ui$/.test(w)) { const st = w.slice(0, -1); return [st + 'iesc', st + 'iești', st + 'iește', st + 'im', st + 'iți', st + 'iesc']; }    // locui → locuiesc
  if (/[^aeiouăâî]i$/.test(w)) { const st = w.slice(0, -1); return [st + 'esc', st + 'ești', st + 'ește', st + 'im', st + 'iți', st + 'esc']; }   // citi → citesc
  if (/î$/.test(w)) { const st = w.slice(0, -1); return [st + 'ăsc', st + 'ăști', st + 'ăște', st + 'âm', st + 'âți', st + 'ăsc']; }   // hotărî → hotărăsc
  if (/ea$/.test(w)) { const st = w.slice(0, -2); return [st, roPal(st) + 'i', st + 'e', st + 'em', st + 'eți', st]; }              // tăcea-type
  if (/ia$/.test(w)) { const st = w.slice(0, -1); return [st + 'ez', st + 'ezi', st + 'ază', st + 'em', st + 'ați', st + 'ază']; }    // studia → studiez
  if (/a$/.test(w)) { const st = w.slice(0, -1);
    if (RO_PLAIN_A.test(w)) return [st, roPal(st) + 'i', st + 'ă', st + 'ăm', st + 'ați', st + 'ă'];
    return [st + 'ez', st + 'ezi', st + 'ează', st + 'ăm', st + 'ați', st + 'ează']; }                                                 // lucra → lucrez
  if (/e$/.test(w)) { const st = w.slice(0, -1); return [st, roPal(st) + 'i', st + 'e', st + 'em', st + 'eți', st]; }                // merge-type
  return [w, w, w, w, w, w];
}
// the "the" form of a noun, and its plural (a best guess: the dialog lets you fix the plural)
const roDefGuess = (w, g) => g === 'f' ? (/ie$/.test(w) ? w.slice(0, -1) + 'a' : /ea$/.test(w) ? w + 'ua' : /[ăa]$/.test(w) ? w.slice(0, -1) + 'a' : /e$/.test(w) ? w.slice(0, -1) + 'ea' : w + 'a')
  : /e$/.test(w) ? w + 'le' : /[uă]$/.test(w) ? w + 'l' : /i$/.test(w) ? w + 'ul' : w + 'ul';
const roPl = (w, g) => g === 'f' ? (/ie$/.test(w) ? w.slice(0, -1) + 'i' : /ea$/.test(w) ? w.slice(0, -1) + 'le' : /ă$/.test(w) ? w.slice(0, -1) + 'e' : /e$/.test(w) ? w.slice(0, -1) + 'i' : w + 'e')
  : g === 'n' ? (/u$/.test(w) ? w + 'ri' : /[eă]$/.test(w) ? w.slice(0, -1) + 'uri' : w + 'uri')
  : /e$/.test(w) ? w.slice(0, -1) + 'i' : /u$/.test(w) ? w.slice(0, -1) + 'i' : roPal(w) + 'i';
const roPlDef = (pl, g) => g === 'm' ? pl + 'i' : pl + 'le';
const roGenderGuess = w => /(ă|ie|ea|are|ere|ire|une|ință)$/.test(w) ? 'f' : /(ment|aj|ism|um|on|ar|or|et)$/.test(w) && !/(tor|or)$/.test(w) ? 'n' : 'm';
function roAdjForms(w) {
  if (/os$/.test(w)) { const st = w.slice(0, -2); return [w, st + 'oasă', st + 'oși', st + 'oase']; }   // frumos
  if (/e$/.test(w)) { const st = w.slice(0, -1); return [w, w, st + 'i', st + 'i']; }                     // mare
  if (/[^aeiou]u$/.test(w)) { const st = w.slice(0, -1); return [w, st + 'ă', roPal(st) + 'i', st + 'e']; }  // albastru
  if (/[ăâîaeiou]$/.test(w)) return [w, w, w, w];
  return [w, w + 'ă', roPal(w) + 'i', w + 'e'];                                                          // bun, deștept
}
const RO_BASE = { n: RO_NOUN.length, a: RO_ADJ.length, v: RO_VERB.length };
const roKnown = w => RO_NOUN.slice(0, RO_BASE.n).some(n => n.slice(0, 4).includes(w)) || RO_VERB.slice(0, RO_BASE.v).some(v => v[0] === roReflStrip(w) || roReflStrip(v[0]) === roReflStrip(w) || v[1].includes(w))
  || RO_ADJ.slice(0, RO_BASE.a).some(a => a.slice(0, 4).includes(w)) || [RO_PRON, RO_DET, RO_PREP, RO_CONJ, RO_ADV].some(L => L.some(x => x[0] === w)) || RO_POSS.some(p => p.slice(0, 4).includes(w)) || ['nu', 'niciodată', 'foarte'].includes(w);
function roApplyMine() {
  RO_NOUN.length = RO_BASE.n; RO_ADJ.length = RO_BASE.a; RO_VERB.length = RO_BASE.v;
  for (const m of S.bldWords || []) {
    if (!m || m.lang !== 'ro' || !m.w || !m.en || roKnown(m.w)) continue;
    const g = ['m', 'f', 'n'].includes(m.g) ? m.g : 'm';
    if (m.k === 'noun') RO_NOUN.push([m.w, roDefGuess(m.w, g), m.pl || null, m.pl ? roPlDef(m.pl, g) : null, g, m.cat || 'thing', m.en, m.pl ? (m.enPl || bldPlEn(m.en)) : null]);
    if (m.k === 'verb' && Array.isArray(m.forms) && m.forms.length === 6) {
      const refl = /^(a\s+)?se\s/.test(m.w) ? 1 : 0, type = m.obj === 'in' || refl ? 'in' : 'tr', objs = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read', 'place'];
      RO_VERB.push([(refl ? 'se ' : '') + roReflStrip(m.w), m.forms, type, objs, 0, m.en, bld3sEn(m.en), m.who === 'a' ? 'a' : 'p', refl]);
    }
    if (m.k === 'adj') RO_ADJ.push([...roAdjForms(m.w), m.en, 'patflr']);
  }
}
// your Romanian words are added each time the Sentence Builder starts, along with the other languages'
{ const prevMine = bldApplyMine; bldApplyMine = function () { prevMine(); roApplyMine(); }; }
BLD_MINE.ro = { name: 'Romanian', forms: 'eu, tu, el/ea, noi, voi, ei/ele', nForms: 6, m: 'un (masculine)', f: 'o (feminine)', n: 'neuter (un măr, două mere)',
  conj: w => roConjugate(w), pl: w => roPl(w, roGenderGuess(w)), adj: w => roAdjForms(w),
  known: w => roKnown(w), gender: w => roGenderGuess(w), isVerb: w => /^a\s/.test(w), refl: w => /^a\s+se\s/.test(w),
  // "un câine", "o casă", "a mânca", "a se spăla", or one word
  parse: s => { s = s.replace(/ş/g, 'ș').replace(/ţ/g, 'ț').replace(/Ş/g, 'Ș').replace(/Ţ/g, 'Ț');
    let m = s.match(/^(un|o)\s+(\p{L}+)$/u); if (m) return { w: m[2], g: m[1] === 'o' ? 'f' : roGenderGuess(m[2]) === 'n' ? 'n' : 'm', art: true };
    m = s.match(/^a\s+(se\s+)?(\p{L}+)$/u); if (m) return { w: 'a ' + (m[1] ? 'se ' : '') + m[2] };
    return /^\p{L}+$/u.test(s) ? { w: s } : null; },
  intro: 'words with <i>un/o</i> are nouns, and words like <i>“a mânca”</i> are verbs). Verb forms are filled in for you, including common irregular verbs (sunt, am, merg, vreau…); check any that look wrong. Verbs with “se” (a se spăla) work too: the game adds “mă / te / se / ne / vă” before them. Neuter nouns (un măr, două mere) have their own choice.' };
