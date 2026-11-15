'use strict';
/* ================= Sentence Builder: French =================
   Same idea as Spanish: every word on the tray is one analysed word (a "chip"), and the checker explains the first mistake.
   French checks: le/la/les, un/une/des, du/de la/de l', possessives and ce/cet/cette/ces agree with the noun; elision before a
   vowel sound (j', l', n', m', t', s', d'); à + le = au, à + les = aux, de + le = du; ne … pas / ne … jamais around the verb, and
   "de" after them (je n'ai pas de chien); most adjectives after the noun, a few short everyday ones before it (bel, vieil,
   nouvel before a vowel); a subject is always needed; avoir faim / soif (not être); no "à" before a person you see; aller à + a
   place; reflexive verbs (je me lève, je m'habille); the verb agrees with the subject. Loaded after builder.js. */

const frV = w => /^[aeiouyàâäéèêëîïôöûüœæh]/i.test(w || '');   // starts with a vowel sound (every h in this list is silent)
//            word   form  gender  English          form: 0 je, 1 tu, 2 il/elle, 3 nous, 4 vous, 5 ils/elles
const FR_PRON = [['je', 0, 'x', 'I'], ["j'", 0, 'x', 'I'], ['tu', 1, 'x', 'you'], ['il', 2, 'm', 'he'], ['elle', 2, 'f', 'she'],
  ['nous', 3, 'x', 'we'], ['vous', 4, 'x', 'you'], ['ils', 5, 'm', 'they'], ['elles', 5, 'f', 'they']];
const FR_FORM = [[1, 's'], [2, 's'], [3, 's'], [1, 'p'], [2, 'p'], [3, 'p']];
//            word      family  kind    English
const FR_DET = [['le', 'le', 'art', 'the'], ['la', 'le', 'art', 'the'], ["l'", 'le', 'art', 'the'], ['les', 'le', 'art', 'the'],
  ['un', 'un', 'art', 'a'], ['une', 'un', 'art', 'a'], ['des', 'un', 'art', 'some'],
  ['du', 'part', 'part', 'some'], ['de la', 'part', 'part', 'some'], ["de l'", 'part', 'part', 'some'], ['de', 'de', 'de', 'any'], ["d'", 'de', 'de', 'any'],
  ['mon', 'mon', 'poss', 'my'], ['ma', 'mon', 'poss', 'my'], ['mes', 'mon', 'poss', 'my'], ['ton', 'ton', 'poss', 'your'], ['ta', 'ton', 'poss', 'your'], ['tes', 'ton', 'poss', 'your'],
  ['son', 'son', 'poss', 'his/her'], ['sa', 'son', 'poss', 'his/her'], ['ses', 'son', 'poss', 'his/her'], ['notre', 'notre', 'poss', 'our'], ['nos', 'notre', 'poss', 'our'],
  ['votre', 'votre', 'poss', 'your'], ['vos', 'votre', 'poss', 'your'], ['leur', 'leur', 'poss', 'their'], ['leurs', 'leur', 'poss', 'their'],
  ['ce', 'ce', 'dem', 'this'], ['cet', 'ce', 'dem', 'this'], ['cette', 'ce', 'dem', 'this'], ['ces', 'ce', 'dem', 'these'], ['deux', 'deux', 'num', 'two'], ['trois', 'trois', 'num', 'three']];
// the right determiner for a noun: family + gender + number + the word right after it (for l', cet, mon amie…)
function frWant(fam, g, num, next) {
  const v = frV(next), p = num === 'p';
  switch (fam) {
    case 'le': return p ? 'les' : v ? "l'" : g === 'f' ? 'la' : 'le';
    case 'un': return p ? 'des' : g === 'f' ? 'une' : 'un';
    case 'part': return p ? 'des' : v ? "de l'" : g === 'f' ? 'de la' : 'du';
    case 'de': return v ? "d'" : 'de';
    case 'mon': case 'ton': case 'son': return p ? { mon: 'mes', ton: 'tes', son: 'ses' }[fam] : g === 'f' && !v ? { mon: 'ma', ton: 'ta', son: 'sa' }[fam] : fam;
    case 'notre': return p ? 'nos' : 'notre';
    case 'votre': return p ? 'vos' : 'votre';
    case 'leur': return p ? 'leurs' : 'leur';
    case 'ce': return p ? 'ces' : g === 'f' ? 'cette' : v ? 'cet' : 'ce';
    default: return fam;   // deux, trois
  }
}
//            singular   plural     g    kind      English one / many       can't count
const FR_NOUN = [
  ['homme', 'hommes', 'm', 'person', 'man', 'men'], ['femme', 'femmes', 'f', 'person', 'woman', 'women'], ['garçon', 'garçons', 'm', 'person', 'boy', 'boys'], ['fille', 'filles', 'f', 'person', 'girl', 'girls'],
  ['ami', 'amis', 'm', 'person', 'friend', 'friends'], ['amie', 'amies', 'f', 'person', 'friend', 'friends'], ['mère', null, 'f', 'person', 'mother', null], ['père', null, 'm', 'person', 'father', null],
  ['frère', 'frères', 'm', 'person', 'brother', 'brothers'], ['sœur', 'sœurs', 'f', 'person', 'sister', 'sisters'], ['professeur', 'professeurs', 'm', 'person', 'teacher', 'teachers'],
  ['médecin', 'médecins', 'm', 'person', 'doctor', 'doctors'], ['enfant', 'enfants', 'm', 'person', 'child', 'children'],
  ['chien', 'chiens', 'm', 'animal', 'dog', 'dogs'], ['chat', 'chats', 'm', 'animal', 'cat', 'cats'], ['oiseau', 'oiseaux', 'm', 'animal', 'bird', 'birds'], ['cheval', 'chevaux', 'm', 'animal', 'horse', 'horses'],
  ['pain', null, 'm', 'food', 'bread', null, 1], ['riz', null, 'm', 'food', 'rice', null, 1], ['fromage', null, 'm', 'food', 'cheese', null, 1], ['poulet', null, 'm', 'food', 'chicken', null, 1],
  ['viande', null, 'f', 'food', 'meat', null, 1], ['soupe', null, 'f', 'food', 'soup', null, 1], ['pomme', 'pommes', 'f', 'food', 'apple', 'apples'], ['gâteau', 'gâteaux', 'm', 'food', 'cake', 'cakes'],
  ['biscuit', 'biscuits', 'm', 'food', 'cookie', 'cookies'], ['orange', 'oranges', 'f', 'food', 'orange', 'oranges'],
  ['eau', null, 'f', 'drink', 'water', null, 1], ['lait', null, 'm', 'drink', 'milk', null, 1], ['café', null, 'm', 'drink', 'coffee', null, 1], ['jus', null, 'm', 'drink', 'juice', null, 1], ['thé', null, 'm', 'drink', 'tea', null, 1],
  ['livre', 'livres', 'm', 'read', 'book', 'books'], ['lettre', 'lettres', 'f', 'read', 'letter', 'letters'], ['magazine', 'magazines', 'm', 'read', 'magazine', 'magazines'], ['journal', 'journaux', 'm', 'read', 'newspaper', 'newspapers'],
  ['maison', 'maisons', 'f', 'place', 'house', 'houses'], ['ville', 'villes', 'f', 'place', 'town', 'towns'], ['école', 'écoles', 'f', 'place', 'school', 'schools'], ['parc', 'parcs', 'm', 'place', 'park', 'parks'],
  ['plage', 'plages', 'f', 'place', 'beach', 'beaches'], ['magasin', 'magasins', 'm', 'place', 'store', 'stores'], ['restaurant', 'restaurants', 'm', 'place', 'restaurant', 'restaurants'], ['marché', 'marchés', 'm', 'place', 'market', 'markets'],
  ['bureau', 'bureaux', 'm', 'place', 'office', 'offices'], ['cuisine', 'cuisines', 'f', 'place', 'kitchen', 'kitchens'], ['bibliothèque', 'bibliothèques', 'f', 'place', 'library', 'libraries'], ['église', 'églises', 'f', 'place', 'church', 'churches'],
  ['voiture', 'voitures', 'f', 'thing', 'car', 'cars'], ['table', 'tables', 'f', 'thing', 'table', 'tables'], ['chaise', 'chaises', 'f', 'thing', 'chair', 'chairs'], ['téléphone', 'téléphones', 'm', 'thing', 'phone', 'phones'],
  ['ballon', 'ballons', 'm', 'thing', 'ball', 'balls'], ['fleur', 'fleurs', 'f', 'thing', 'flower', 'flowers'], ['porte', 'portes', 'f', 'thing', 'door', 'doors'], ['fenêtre', 'fenêtres', 'f', 'thing', 'window', 'windows'],
  ['argent', null, 'm', 'thing', 'money', null, 1], ['cadeau', 'cadeaux', 'm', 'thing', 'gift', 'gifts'], ['vélo', 'vélos', 'm', 'thing', 'bike', 'bikes'],
  // how you feel: French says "j'ai faim" (I have hunger), with no article
  ['faim', null, 'f', 'feel', 'hungry'], ['soif', null, 'f', 'feel', 'thirsty'], ['froid', null, 'm', 'feel', 'cold'], ['chaud', null, 'm', 'feel', 'hot'], ['peur', null, 'f', 'feel', 'scared']];
const FR_OPENABLE = ['porte', 'fenêtre', 'livre', 'magazine', 'magasin', 'bureau', 'restaurant', 'bibliothèque', 'journal', 'lettre', 'cadeau'];
//            m sing     f sing      m plural    f plural     English      describes   before/after the noun   m sing before a vowel
const FR_ADJ = [['bon', 'bonne', 'bons', 'bonnes', 'good', 'pafrl', 'pre'], ['mauvais', 'mauvaise', 'mauvais', 'mauvaises', 'bad', 'pafr', 'pre'],
  ['grand', 'grande', 'grands', 'grandes', 'big', 'patl', 'pre'], ['petit', 'petite', 'petits', 'petites', 'small', 'patl', 'pre'],
  ['nouveau', 'nouvelle', 'nouveaux', 'nouvelles', 'new', 'tlr', 'pre', 'nouvel'], ['vieux', 'vieille', 'vieux', 'vieilles', 'old', 'patlr', 'pre', 'vieil'],
  ['beau', 'belle', 'beaux', 'belles', 'beautiful', 'patl', 'pre', 'bel'], ['joli', 'jolie', 'jolis', 'jolies', 'pretty', 'patl', 'pre'], ['jeune', 'jeune', 'jeunes', 'jeunes', 'young', 'pa', 'pre'],
  ['rouge', 'rouge', 'rouges', 'rouges', 'red', 'tf', 'post'], ['bleu', 'bleue', 'bleus', 'bleues', 'blue', 't', 'post'], ['vert', 'verte', 'verts', 'vertes', 'green', 'tf', 'post'],
  ['noir', 'noire', 'noirs', 'noires', 'black', 'at', 'post'], ['blanc', 'blanche', 'blancs', 'blanches', 'white', 'atf', 'post'], ['jaune', 'jaune', 'jaunes', 'jaunes', 'yellow', 'tf', 'post'],
  ['cher', 'chère', 'chers', 'chères', 'expensive', 'tflr', 'post'], ['facile', 'facile', 'faciles', 'faciles', 'easy', 'r', 'post'], ['difficile', 'difficile', 'difficiles', 'difficiles', 'hard', 'r', 'post'],
  ['rapide', 'rapide', 'rapides', 'rapides', 'fast', 'pat', 'post'], ['sympathique', 'sympathique', 'sympathiques', 'sympathiques', 'nice', 'p', 'post'], ['intelligent', 'intelligente', 'intelligents', 'intelligentes', 'smart', 'p', 'post'],
  ['heureux', 'heureuse', 'heureux', 'heureuses', 'happy', 'pa', 'post'], ['triste', 'triste', 'tristes', 'tristes', 'sad', 'pa', 'post'], ['délicieux', 'délicieuse', 'délicieux', 'délicieuses', 'delicious', 'f', 'post'],
  ['froid', 'froide', 'froids', 'froides', 'cold', 'fl', 'post'], ['chaud', 'chaude', 'chauds', 'chaudes', 'hot', 'f', 'post'], ['propre', 'propre', 'propres', 'propres', 'clean', 'tl', 'post'], ['sale', 'sale', 'sales', 'sales', 'dirty', 'tl', 'post'],
  ['fatigué', 'fatiguée', 'fatigués', 'fatiguées', 'tired', 'pa', 'post'], ['content', 'contente', 'contents', 'contentes', 'glad', 'pa', 'post'], ['malade', 'malade', 'malades', 'malades', 'sick', 'pa', 'post']];
const frAdjIdx = (g, num) => (num === 'p' ? 2 : 0) + (g === 'f' ? 1 : 0);
const frAdjWant = (a, g, num, nextNoun) => a[6] === 'pre' && a[7] && g !== 'f' && num === 's' && nextNoun && frV(nextNoun) ? a[7] : a[frAdjIdx(g, num)];
//            infinitive  je, tu, il/elle, nous, vous, ils/elles                kind     what it takes   needs one  English        he/she form    who   -se verb
const FR_VERB = [['manger', ['mange', 'manges', 'mange', 'mangeons', 'mangez', 'mangent'], 'tr', ['food'], 0, 'eat', 'eats', 'a'],
  ['boire', ['bois', 'bois', 'boit', 'buvons', 'buvez', 'boivent'], 'tr', ['drink'], 0, 'drink', 'drinks', 'a'],
  ['préparer', ['prépare', 'prépares', 'prépare', 'préparons', 'préparez', 'préparent'], 'tr', ['food', 'drink'], 0, 'make', 'makes', 'p'],
  ['lire', ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'], 'tr', ['read'], 0, 'read', 'reads', 'p'],
  ['écrire', ['écris', 'écris', 'écrit', 'écrivons', 'écrivez', 'écrivent'], 'tr', ['read'], 0, 'write', 'writes', 'p'],
  ['acheter', ['achète', 'achètes', 'achète', 'achetons', 'achetez', 'achètent'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'buy', 'buys', 'p'],
  ['vendre', ['vends', 'vends', 'vend', 'vendons', 'vendez', 'vendent'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'sell', 'sells', 'p'],
  ['avoir', ['ai', 'as', 'a', 'avons', 'avez', 'ont'], 'avoir', ['*'], 1, 'have', 'has', 'a'],
  ['vouloir', ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'want', 'wants', 'a'],
  ['chercher', ['cherche', 'cherches', 'cherche', 'cherchons', 'cherchez', 'cherchent'], 'tr', ['*'], 1, 'look for', 'looks for', 'a'],
  ['voir', ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'], 'tr', ['*'], 1, 'see', 'sees', 'a'],
  ['regarder', ['regarde', 'regardes', 'regarde', 'regardons', 'regardez', 'regardent'], 'tr', ['person', 'animal', 'thing', 'read'], 1, 'look at', 'looks at', 'a'],
  ['aimer', ['aime', 'aimes', 'aime', 'aimons', 'aimez', 'aiment'], 'tr', ['*'], 1, 'like', 'likes', 'a'],
  ['visiter', ['visite', 'visites', 'visite', 'visitons', 'visitez', 'visitent'], 'tr', ['place'], 1, 'visit', 'visits', 'p'],
  ['ouvrir', ['ouvre', 'ouvres', 'ouvre', 'ouvrons', 'ouvrez', 'ouvrent'], 'tr', ['open'], 1, 'open', 'opens', 'p'],
  ['fermer', ['ferme', 'fermes', 'ferme', 'fermons', 'fermez', 'ferment'], 'tr', ['open'], 1, 'close', 'closes', 'p'],
  ['parler', ['parle', 'parles', 'parle', 'parlons', 'parlez', 'parlent'], 'in', null, 0, 'talk', 'talks', 'p'],
  ['travailler', ['travaille', 'travailles', 'travaille', 'travaillons', 'travaillez', 'travaillent'], 'in', null, 0, 'work', 'works', 'p'],
  ['étudier', ['étudie', 'étudies', 'étudie', 'étudions', 'étudiez', 'étudient'], 'in', null, 0, 'study', 'studies', 'p'],
  ['jouer', ['joue', 'joues', 'joue', 'jouons', 'jouez', 'jouent'], 'in', null, 0, 'play', 'plays', 'a'],
  ['courir', ['cours', 'cours', 'court', 'courons', 'courez', 'courent'], 'in', null, 0, 'run', 'runs', 'a'],
  ['marcher', ['marche', 'marches', 'marche', 'marchons', 'marchez', 'marchent'], 'in', null, 0, 'walk', 'walks', 'a'],
  ['dormir', ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'], 'in', null, 0, 'sleep', 'sleeps', 'a'],
  ['habiter', ['habite', 'habites', 'habite', 'habitons', 'habitez', 'habitent'], 'in', null, 0, 'live', 'lives', 'a'],
  ['aller', ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], 'aller', null, 1, 'go', 'goes', 'a'],
  ['être', ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], 'etre', null, 1, 'be', 'is', 'a'],
  // reflexive verbs: the 9th item (1) means they need me / te / se / nous / vous (m', t', s' before a vowel) right before them
  ['se lever', ['lève', 'lèves', 'lève', 'levons', 'levez', 'lèvent'], 'in', null, 0, 'get up', 'gets up', 'a', 1],
  ['se coucher', ['couche', 'couches', 'couche', 'couchons', 'couchez', 'couchent'], 'in', null, 0, 'go to bed', 'goes to bed', 'p', 1],
  ['se laver', ['lave', 'laves', 'lave', 'lavons', 'lavez', 'lavent'], 'in', null, 0, 'wash up', 'washes up', 'p', 1],
  ["s'habiller", ['habille', 'habilles', 'habille', 'habillons', 'habillez', 'habillent'], 'in', null, 0, 'get dressed', 'gets dressed', 'p', 1],
  ['se réveiller', ['réveille', 'réveilles', 'réveille', 'réveillons', 'réveillez', 'réveillent'], 'in', null, 0, 'wake up', 'wakes up', 'a', 1]];
const FR_REFL = ['me', 'te', 'se', 'nous', 'vous', 'se'];
const frReflWant = (f, verb) => f === 3 || f === 4 ? FR_REFL[f] : frV(verb) ? FR_REFL[f][0] + "'" : FR_REFL[f];
//            word            English       where it goes: edge = start or end · post = right after the verb (after pas) · end = at the end
const FR_ADV = [["aujourd'hui", 'today', 'edge'], ['demain', 'tomorrow', 'edge'], ['maintenant', 'now', 'edge'], ['toujours', 'always', 'post'], ['souvent', 'often', 'post'],
  ['beaucoup', 'a lot', 'post'], ['bien', 'well', 'post'], ['aussi', 'too', 'end'], ['ici', 'here', 'end']];
const FR_PREP = [['à', 'to / at'], ['au', 'to the / at the'], ['aux', 'to the / at the'], ['dans', 'in'], ['avec', 'with'], ['pour', 'for'], ['de', 'of / from'], ["d'", 'of / from'], ['du', 'of the']];
const FR_CONJ = [['et', 'and'], ['mais', 'but'], ['ou', 'or']];
const FR_KIND = { food: 'food', drink: 'drinks', read: 'things you read or write', thing: 'things', place: 'places', animal: 'animals', person: 'people', open: 'things you can open' };
const FR_ELIDE = { "j'": 'je', "n'": 'ne', "m'": 'me', "t'": 'te', "s'": 'se', "d'": 'de' };
const FR_NO_DANS = ['plage', 'marché'];   // you're "à la plage", not "dans la plage"
const FR_HOW_VERBS = /^(parler|travailler|étudier|jouer|courir|marcher|dormir|manger|boire|lire|écrire)$/;   // verbs that go with bien / beaucoup

/* chips */
const frPron = p => chip({ k: 'pron', w: p[0], f: p[1], per: FR_FORM[p[1]][0], num: FR_FORM[p[1]][1], g: p[2], en: p[3] });
const frPronW = w => frPron(FR_PRON.find(p => p[0] === w));
const frDetW = w => { const d = FR_DET.find(x => x[0] === w); return chip({ k: 'det', w, fam: d[1], cls: d[2], en: d[3] }); };
const frNoun = (n, num) => chip({ k: 'noun', w: num === 'p' ? n[1] : n[0], e: n, g: n[2], num, cat: n[3], mass: !!n[6], en: num === 'p' ? n[5] : n[4] });
const frAdj = (a, w) => chip({ k: 'adj', w, e: a, en: a[4], pos: a[6] });
const frVerb = (v, f) => chip({ k: 'verb', w: v[1][f], e: v, f, type: v[2], gloss: 'to ' + v[5] });
const frRefl = (w, f) => chip({ k: 'refl', w, f, en: 'oneself' });
const frPrep = w => chip({ k: 'prep', w, en: FR_PREP.find(p => p[0] === w)[1] });
const frConj = w => chip({ k: 'conj', w, en: FR_CONJ.find(c => c[0] === w)[1] });
const frAdv = w => { const a = FR_ADV.find(x => x[0] === w); return chip({ k: 'adv', w, en: a[1], pos: a[2] }); };
const frNe = next => chip({ k: 'neg', w: frV(next) ? "n'" : 'ne', en: 'not' });
const frPas = w => chip({ k: 'pas', w, en: w === 'jamais' ? 'never' : 'not' });
const frTres = () => chip({ k: 'int', w: 'très', en: 'very' });

/* ---------------- French checker ---------------- */
function frCheck(T) {
  let i = 0;
  const err = (msg, at = i) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length }), peek = (o = 0) => T[i + o], isErr = x => x && x.ok === false;
  if (!T.length) return err('Tap some words to build a sentence.');
  const gName = g => g === 'f' ? 'feminine' : 'masculine', nName = n => n === 'p' ? 'plural' : 'singular';
  const join = (...ws) => ws.filter(Boolean).reduce((s, w) => !s ? w : /'$/.test(s) ? s + w : s + ' ' + w, '');
  // elision: je, ne, me, te, se lose their e before a vowel sound, and the short forms only go before one
  for (let k = 0; k < T.length - 1; k++) {
    const t = T[k], nx = T[k + 1]; if (!['pron', 'neg', 'refl', 'prep'].includes(t.k) || (t.k === 'prep' && !['de', "d'"].includes(t.w))) continue;
    if (FR_ELIDE[t.w] && !frV(nx.w)) return err(`“${t.w}” is only used before a vowel sound. Before “${nx.w}” write “${FR_ELIDE[t.w]}”: “${FR_ELIDE[t.w]} ${nx.w}”.`, k);
    if (['je', 'ne', 'me', 'te', 'se', 'de'].includes(t.w) && frV(nx.w)) return err(`Before a vowel sound, “${t.w}” loses its e: “${t.w[0]}'${nx.w}”.`, k);
  }
  const npText = np => np.coord ? np.coord.map(npText).join(' et ') : join(np.det?.w, np.tres && np.pre ? 'très' : '', np.pre?.w, np.n.w, np.tres && np.post ? 'très' : '', np.post?.w);
  // a noun phrase: determiner (très) (adjective that goes before) noun (très) (adjective that goes after) (de + noun)
  function NP(role, neg) {
    const start = i; let det = null, pre = null, post = null, tres = false, of = null;
    if (peek()?.k === 'det') det = T[i++];
    if (peek()?.k === 'int' || peek()?.k === 'adj') {
      const at = i; if (peek().k === 'int') { tres = true; i++; }
      const a = peek(); if (!a || a.k !== 'adj') return err('“très” (very) goes right before a describing word: “très grand”.', at);
      if (a.pos === 'post') { const n = T.slice(i, i + 3).find(t => t.k === 'noun'); return err(`“${a.e[0]}” goes after the noun in French${n ? `: “${join(det?.w, n.w, a.w)}”` : ''}. Only a few short words like grand, petit, bon and beau go before it.`, at); }
      pre = a; i++;
    }
    const n = peek();
    if (!n || n.k !== 'noun') return err(det ? `“${det.w}” comes before a noun, so a noun has to follow it.` : role === 'subj' ? 'Start with who does it: a pronoun like “je” or “elle”, or a noun like “le chien”.' : 'A noun (a person, place or thing) should go here.', det ? i - 1 : i);
    i++;
    if (n.cat === 'feel') return err(`“${n.w}” is a feeling. French says it with avoir and no article: “j'ai ${n.w}”.`, start);
    if (!det) return err(`French needs a word like ${n.num === 'p' ? '“les” or “des”' : n.mass ? `“${frWant('part', n.g, 's', n.w)}” or “${frWant('le', n.g, 's', n.w)}”` : `“${frWant('un', n.g, n.num, n.w)}” or “${frWant('le', n.g, n.num, pre ? pre.w : n.w)}”`} before “${n.w}”.`, start);
    // which determiner
    const after = pre ? pre.w : n.w;
    if (det.cls === 'num' && n.num === 's') return err(`“${det.w}” means more than one, so the noun must be plural${n.e[1] ? `: “${det.w} ${n.e[1]}”` : ''}.`, start);
    if (neg === 'like' && ['un', 'part', 'de'].includes(det.fam)) return err(`With aimer (to like), French uses le, la or les, even after ne … pas: “pas ${join(frWant('le', n.g, n.num, after), pre?.w, n.w)}”.`, start);
    if (neg && neg !== 'like' && ['un', 'part'].includes(det.fam)) return err(`After ne … pas, “${det.w}” becomes “de”: “pas ${frWant('de', 'x', 's', after)}${/'$/.test(frWant('de', 'x', 's', after)) ? '' : ' '}${after}”.`, start);
    if (det.fam === 'de' && (!neg || neg === 'like') && !(pre && n.num === 'p')) return err(`“${det.w}” on its own is used after ne … pas (“pas de pain”). Here use “${frWant(n.mass ? 'part' : 'un', n.g, n.num, after)}” or “${frWant('le', n.g, n.num, after)}”.`, start);
    if (det.fam === 'un' && n.num === 'p' && pre) return err(`Before an adjective, “des” becomes “de”: “de ${pre.w} ${n.w}”.`, start);
    if (det.fam === 'part' && !n.mass) return err(`You can count “${n.w}”, so say “${frWant('un', n.g, n.num, after)} ${after}” (one) or “${frWant('le', n.g, n.num, after)}${/'$/.test(frWant('le', n.g, n.num, after)) ? '' : ' '}${after}” (the).`, start);
    if (det.fam === 'un' && n.mass) return err(`You can’t count “${n.w}”, so French says “${frWant('part', n.g, 's', after)}${/'$/.test(frWant('part', n.g, 's', after)) ? '' : ' '}${after}” (some).`, start);
    const want = frWant(det.fam, n.g, n.num, after);
    if (det.w !== want) {
      const vow = frV(after), why = det.fam === 'le' && n.num === 's' && (vow || det.w === "l'") ? (vow ? `“${after}” starts with a vowel sound` : `“l'” is only used before a vowel sound`)
        : det.fam === 'ce' && want === 'cet' ? `before a masculine word that starts with a vowel sound, “ce” becomes “cet”`
        : ['mon', 'ton', 'son'].includes(det.fam) && n.g === 'f' && n.num === 's' && vow ? `“${n.w}” starts with a vowel sound, so French uses “${want}” even though it is feminine`
        : `“${n.w}” is ${gName(n.g)} ${nName(n.num)}`;
      return err(`${why[0].toUpperCase() + why.slice(1)}, so use “${want}”: “${join(want, pre?.w, n.w)}”.`, start);
    }
    if (pre) { const w = frAdjWant(pre.e, n.g, n.num, n.w); if (pre.w !== w) return err(`“${pre.w}” has to match “${n.w}” (${gName(n.g)} ${nName(n.num)}${w === pre.e[7] ? ', and it starts with a vowel sound' : ''}): use “${w}”.`, start + 1 + (tres ? 1 : 0)); }
    if (peek()?.k === 'int' || peek()?.k === 'adj') {
      const at = i; let t2 = false; if (peek().k === 'int') { t2 = true; i++; }
      const a = peek(); if (!a || a.k !== 'adj') return err('“très” goes right before a describing word: “très rapide”.', at);
      if (pre) return err('Use one describing word per noun here.', at);
      if (a.pos === 'pre') return err(`“${a.e[0]}” is one of the few describing words that go before the noun: “${join(det.w === "l'" && !frV(a.e[frAdjIdx(n.g, n.num)]) ? frWant('le', n.g, n.num, a.e[0]) : det.w, a.w, n.w)}”.`, at);
      const w = frAdjWant(a.e, n.g, n.num, null); if (a.w !== w) return err(`“${a.w}” has to match “${n.w}” (${gName(n.g)} ${nName(n.num)}): use “${w}”.`, i);
      post = a; tres = tres || t2; i++;
      if (peek()?.k === 'adj') return err('Use one describing word per noun here.');
    }
    // de + noun: "le livre de mon ami", "la voiture du garçon"
    if (role !== 'of' && peek()?.k === 'prep' && ['de', "d'", 'du'].includes(peek().w)) {
      const p = T[i++];
      if (p.w === 'de' && peek()?.k === 'det' && peek().w === 'le') return err(`French joins “de” + “le” into “du”: “du ${peek(1)?.w || '…'}”.`, i - 1);
      if (p.w === 'de' && peek()?.k === 'det' && peek().w === 'les') return err('French joins “de” + “les” into “des”. Try one person instead: “de mon ami”.', i - 1);
      if (p.w === 'du') {
        if (peek()?.k === 'det') return err('“du” already means “de + le”, so don’t add another article.');
        const m = peek(); if (!m || m.k !== 'noun') return err('“du” needs a noun right after it: “du garçon”.', i - 1);
        if (m.g !== 'm' || m.num !== 's' || frV(m.w)) return err(`“du” is “de + le”, so it only goes before a masculine singular noun that starts with a consonant. Say “de ${join(frWant('le', m.g, m.num, m.w), m.w)}”.`, i - 1);
        i++; of = { det: { w: 'le', en: 'the', fam: 'le' }, n: m, num: 's', g: 'm', cat: m.cat };
      } else { const o = NP('of'); if (isErr(o)) return o; of = o; }
    }
    return { det, n, pre, post, tres, of, num: n.num, g: n.g, cat: n.cat };
  }
  function NPs(role, neg) {
    const a = NP(role, neg); if (isErr(a)) return a;
    const c = peek();
    if (c?.k === 'conj' && (c.w === 'et' || c.w === 'ou') && ['det', 'noun', 'pron'].includes(peek(1)?.k)) {
      const save = i; i++;
      if (peek().k === 'pron') { if (role === 'subj') return err(`After “et”, French uses moi, toi, lui or elle, not “${peek().w}”. Join two nouns instead: “le chien et le chat”.`, i); i = save; return a; }
      const b = NP(role, neg);
      if (isErr(b) || (role !== 'subj' && ['verb', 'neg', 'pron'].includes(peek()?.k))) { i = save; return a; }
      return { coord: [a, b], conj: c, num: 'p', g: a.g === 'm' || b.g === 'm' ? 'm' : 'f', per: 3, cat: a.cat };
    }
    return a;
  }
  // à / au / aux / dans / avec / pour + a noun phrase
  function PP(p, role) {
    if (p.w === 'au' || p.w === 'aux') {
      if (peek()?.k === 'det') return err(`“${p.w}” already means “à + ${p.w === 'au' ? 'le' : 'les'}”, so don’t add another article.`);
      const m = peek(); if (!m || m.k !== 'noun') return err(`“${p.w}” needs a noun right after it: “${p.w === 'au' ? 'au parc' : 'aux magasins'}”.`, i - 1);
      if (p.w === 'au' && (m.g !== 'm' || m.num !== 's' || frV(m.w))) return err(`“au” is “à + le”, so it only goes before a masculine singular noun that starts with a consonant. Say “à ${join(frWant('le', m.g, m.num, m.w), m.w)}”.`, i - 1);
      if (p.w === 'aux' && m.num !== 'p') return err(`“aux” is “à + les”, so the noun must be plural. For one, say “${m.g === 'm' && !frV(m.w) ? 'au' : 'à ' + frWant('le', m.g, 's', m.w)}${/'$/.test(frWant('le', m.g, 's', m.w)) && !(m.g === 'm' && !frV(m.w)) ? '' : ' '}${m.w}”.`, i - 1);
      i++; const np = { det: { w: p.w === 'au' ? 'le' : 'les', en: 'the', fam: 'le' }, n: m, num: m.num, g: m.g, cat: m.cat };
      if (peek()?.k === 'adj') { const a = T[i], w = frAdjWant(a.e, m.g, m.num, null); if (a.pos === 'pre') return err(`“${a.e[0]}” goes before the noun.`); if (a.w !== w) return err(`“${a.w}” has to match “${m.w}”: use “${w}”.`); np.post = a; i++; }
      return np;
    }
    if (p.w === 'à' && peek()?.k === 'det' && peek().w === 'le') return err(`French joins “à” + “le” into “au”: “au ${peek(1)?.w || '…'}”.`, i - 1);
    if (p.w === 'à' && peek()?.k === 'det' && peek().w === 'les') return err(`French joins “à” + “les” into “aux”: “aux ${peek(1)?.w || '…'}”.`, i - 1);
    return NP(role);
  }
  function clause() {
    const C = { lead: [], subj: null, neg: null, pas: null, refl: null, verb: null, comp: null, pps: [], tail: [] }, cStart = i;
    while (peek()?.k === 'adv') { const a = peek(); if (a.pos !== 'edge') return err(`“${a.w}” goes ${a.pos === 'post' ? 'right after the verb' : 'at the end'}, not at the start.`); C.lead.push(T[i++]); }
    if (peek()?.k === 'conj') return err(`“${peek().w}” joins two parts, so it can’t ${i === 0 ? 'start the sentence' : 'go here'}.`);
    if (peek()?.k === 'pron') { const p = T[i++]; C.subj = { pron: p, f: p.f, num: p.num, g: p.g }; }
    else if (['det', 'noun', 'adj', 'int'].includes(peek()?.k)) { const s = NPs('subj'); if (isErr(s)) return s; C.subj = s.coord ? { np: s, f: 5, num: 'p', g: s.g } : { np: s, f: s.num === 'p' ? 5 : 2, num: s.num, g: s.g }; }
    else if (['verb', 'neg', 'refl'].includes(peek()?.k)) return err('French always needs a subject (who does it): a pronoun like “je”, “il” or “nous”, or a noun like “le chat”.');
    if (peek()?.k === 'pas') return err(`“${peek().w}” goes after the verb, and “ne” goes before it: “je ne mange ${peek().w}”.`);
    if (peek()?.k === 'neg') { C.neg = T[i++]; if (!['verb', 'refl'].includes(peek()?.k)) return err(`“${C.neg.w}” goes right before the verb: “je ne mange pas”.`, i - 1); }
    if (peek()?.k === 'refl') {
      const at = i; C.refl = T[i++];
      if (peek()?.k === 'neg') return err(`“ne” goes before “${C.refl.w}”: “je ne me lève pas”.`, i);
      if (peek()?.k !== 'verb') return err(`“${C.refl.w}” goes right before a verb, like “${C.refl.w === "m'" ? "m'habille" : C.refl.w + ' lève'}”.`, at);
    }
    const v = peek(), sText = C.subj ? (C.subj.pron ? C.subj.pron.w : npText(C.subj.np)) : '';
    if (!v) return err(C.subj ? 'Now add a verb (an action word like “mange” or “est”).' : 'Every sentence needs a verb.');
    if (v.k !== 'verb') {
      if (v.k === 'pron' && C.subj) return err('A sentence has only one subject (who does it).');
      if (v.k === 'adv') return err(`“${v.w}” goes ${v.pos === 'post' ? 'right after the verb' : v.pos === 'end' ? 'at the end' : 'at the start or the end'}.`);
      return err(`After ${C.subj ? `“${sText}”` : 'that'} the next word should be a verb. “${v.w}” isn’t a verb.`);
    }
    i++; C.verb = v;
    const reflAt = C.refl ? i - 2 : -1;
    if (v.e[8] && !C.refl) return err(`“${v.e[0]}” needs “${frReflWant(v.f, v.w)}” right before the verb: “${join(frReflWant(v.f, v.w), v.w)}”.`, i - 1);
    if (C.refl && !v.e[8]) return err(`“${C.refl.w}” only goes with verbs like “se lever”. Take it out: just “${v.w}”.`, reflAt);
    if (C.refl && C.refl.w !== frReflWant(v.f, v.w)) return err(`“${C.refl.w}” doesn’t match “${v.w}”. Use “${join(frReflWant(v.f, v.w), v.w)}”.`, reflAt);
    if (C.subj && C.subj.f !== v.f) return err(`“${v.w}” doesn’t match the subject “${sText}”. Use “${v.e[1][C.subj.f]}”.`, i - 1);
    if (C.subj?.np && v.type !== 'etre') for (const part of C.subj.np.coord || [C.subj.np]) {
      const c = part.cat, what = part.num === 'p' ? part.n.en : 'a ' + part.n.en;
      if (c !== 'person' && c !== 'animal') return err(`That doesn’t make sense: ${what} can’t ${v.e[5]}. Use a person or an animal here.`, cStart);
      if (c === 'animal' && v.e[7] === 'p') return err(`That doesn’t make sense: ${what} can’t ${v.e[5]}. Only people ${v.e[5]}.`, cStart);
    }
    // ne … pas / ne … jamais: around the verb
    if (C.neg && peek()?.k !== 'pas') return err(peek()?.k === 'adv' && peek().pos === 'post' ? `“pas” comes right after the verb, then “${peek().w}”: “${v.w} pas ${peek().w}”.` : `“${C.neg.w}” goes with “pas” after the verb: “${join(C.neg.w, C.refl?.w, v.w)} pas”.`, i);
    if (!C.neg && peek()?.k === 'pas') return err(`French puts “ne” before the verb too: “${join(frV((C.refl || v).w) ? "n'" : 'ne', C.refl?.w, v.w)} ${peek().w}”.`, i);
    if (C.neg) C.pas = T[i++];
    while (peek()?.k === 'adv' && peek().pos === 'post') C.tail.push(T[i++]);
    const neg = !!C.neg, nx = peek(), sNum = C.subj ? C.subj.num : FR_FORM[v.f][1], sG = C.subj ? C.subj.g : 'x';
    if (v.type === 'etre') {
      if (!nx || nx.k === 'conj') return err(`“${v.w}” needs something after it: a describing word (“${v.w} ${sNum === 'p' ? 'fatigués' : 'fatigué'}”) or a place (“à la maison”).`, i - 1);
      if (nx.k === 'adj' || nx.k === 'int') {
        let tres = false; if (nx.k === 'int') { tres = true; i++; if (peek()?.k !== 'adj') return err('“très” goes right before a describing word: “très grand”.', i - 1); }
        const a = T[i], m = a.e[frAdjIdx('m', sNum)], f = a.e[frAdjIdx('f', sNum)];
        if (sG === 'x' ? ![m, f].includes(a.w) : a.w !== a.e[frAdjIdx(sG, sNum)]) return err(`“${a.w}” has to match the subject (${sG === 'x' ? '' : gName(sG) + ' '}${nName(sNum)}): use “${sG === 'f' ? f : m}”${sG === 'x' && f !== m ? ` or “${f}”` : ''}.`);
        i++; C.comp = { adj: a, tres };
      } else if (nx.k === 'noun' && nx.cat === 'feel') return err(`French says this with avoir, not être: “${C.subj?.pron?.w === 'je' || C.subj?.pron?.w === "j'" || v.f === 0 ? "j'ai" : ['ai', 'as', 'a', 'avons', 'avez', 'ont'][v.f]} ${nx.w}” (literally “have ${nx.e[4] === 'hungry' ? 'hunger' : nx.e[4] === 'thirsty' ? 'thirst' : nx.e[4]}”).`);
      else if (['det', 'noun'].includes(nx.k)) return err(`After “${v.w}”, put a describing word (“${sNum === 'p' ? 'contents' : 'content'}”) or a place (“à la maison”, “dans le parc”).`);
      else if (!(nx.k === 'prep' && ['à', 'au', 'aux', 'dans'].includes(nx.w)) && !(nx.k === 'adv' && nx.w === 'ici')) return err(`After “${v.w}”, put a describing word or a place (“à l'école”, “dans la cuisine”).`);
    } else if (v.type === 'avoir') {
      if (nx?.k === 'noun' && nx.cat === 'feel') { i++; C.comp = { feel: nx }; }
      else if (nx?.k === 'det' && peek(1)?.k === 'noun' && peek(1).cat === 'feel') return err(`No article here: French says “${v.w} ${peek(1).w}”.`);
      else if (nx && ['det', 'noun', 'adj', 'int'].includes(nx.k)) { const np = NPs('obj', neg); if (isErr(np)) return np; C.comp = { np }; }
      else return err(`“${v.w}” needs something after it: “${v.w} un chien”, “${v.w} faim”.`, i - 1);
    } else if (v.type === 'aller') {
      if (!nx || nx.k !== 'prep' || !['à', 'au', 'aux'].includes(nx.w)) return err(nx?.k === 'prep' && nx.w === 'dans' ? `With aller, use “à” for where you go: “${v.w} à l'école”, “${v.w} au parc”.` : `“${v.w}” (go) needs where you go: “${v.w} à la plage” or “${v.w} au parc”.`, nx ? i : i - 1);
      i++; const np = PP(nx, 'dest'); if (isErr(np)) return np;
      if (np.cat !== 'place') return err(`aller à needs a place: “${v.w} à la plage”. “${np.n.w}” isn’t a place.`, i - 1);
      C.comp = { dest: np, p: nx };
    } else if (v.type === 'tr') {
      if (nx?.k === 'prep' && ['à', 'au', 'aux'].includes(nx.w) && ['det', 'noun'].includes(peek(1)?.k)) {
        const n2 = T.slice(i + 1, i + 4).find(t => t.k === 'noun');
        if (n2 && ['person', 'animal'].includes(n2.cat)) return err(`French doesn’t put “à” before the person or animal you ${v.e[5]}: “${v.w} ${n2.w === T[i + 1].w ? n2.w : T[i + 1].w + ' ' + n2.w}”.`, i);
      }
      if (nx && ['det', 'noun', 'adj', 'int'].includes(nx.k)) {
        const np = NPs('obj', neg && v.e[0] === 'aimer' ? 'like' : neg); if (isErr(np)) return np;
        // aimer (to like) talks about things in general, so it takes le / la / les, even after ne … pas
        if (v.e[0] === 'aimer') for (const p of np.coord || [np]) if (p.det && ['un', 'part', 'de'].includes(p.det.fam)) return err(`With aimer (to like), French uses le, la or les: “${join(v.w, frWant('le', p.g, p.num, p.pre ? p.pre.w : p.n.w), p.pre?.w, p.n.w)}”${neg ? ', even after ne … pas' : ''}.`);
        for (const p of np.coord || [np]) if (v.e[3][0] === 'open' ? !FR_OPENABLE.includes(p.n.e[0]) : v.e[3][0] !== '*' && !v.e[3].includes(p.cat)) return err(`That doesn’t make sense: you can’t ${v.e[5]} ${p.num === 'p' || p.n.mass ? p.n.en : 'a ' + p.n.en}. “${v.e[0]}” goes with ${v.e[3].map(c => FR_KIND[c]).join(', ')}.`);
        C.comp = { np };
      } else if (v.e[4]) return err(`“${v.w}” needs something after it. What do you ${v.e[5]}? For example “${v.w} ${{ food: 'une pomme', drink: "de l'eau", read: 'un livre', thing: 'un ballon', place: 'la ville', animal: 'un chien', person: 'mon ami', open: 'la porte', '*': 'un livre' }[v.e[3][0]]}”.`, i - 1);
    } else if (nx && ['det', 'noun', 'adj'].includes(nx.k)) return err(`“${v.e[0]}” (to ${v.e[5]}) doesn’t take an object. You can add a place: “${v.w} dans le parc”, or a person: “${v.w} avec mon ami”.`);
    // à / au / aux / dans + a place, avec + someone, pour + someone, à + a person you talk to
    while (peek()?.k === 'prep') {
      const p = T[i++];
      if (['de', "d'", 'du'].includes(p.w)) return err('“de” joins two nouns: “le livre de mon ami”. It needs a noun right before it.', i - 1);
      if (v.type === 'aller' && ['à', 'au', 'aux'].includes(p.w)) return err('Say where you go only once.', i - 1);
      const np = PP(p, 'pp'); if (isErr(np)) return np;
      if (p.w === 'dans' && FR_NO_DANS.includes(np.n.e[0])) return err(`French says “à ${frWant('le', np.n.g, 's', np.n.w)}${/'$/.test(frWant('le', np.n.g, 's', np.n.w)) ? '' : ' '}${np.n.w}”${np.n.g === 'm' && !frV(np.n.w) ? ` (“au ${np.n.w}”)` : ''}, not “dans”.`, i - 1);
      if (p.w === 'dans' && np.cat !== 'place') return err(`“dans” + a place: “dans la cuisine”, “dans le parc”. “${np.n.w}” isn’t a place.`, i - 1);
      if (['à', 'au', 'aux'].includes(p.w) && np.cat !== 'place' && !(v.e[0] === 'parler' && np.cat === 'person')) return err(`“${p.w}” + a place here: “à la maison”, “au parc”.${v.e[0] === 'parler' ? '' : ` (You can talk “à” a person: “je parle à mon ami”.)`}`, i - 1);
      C.pps.push({ p, np });
    }
    while (peek()?.k === 'adv' && peek().pos !== 'post') C.tail.push(T[i++]);
    if (v.type === 'etre' && !C.comp && !C.pps.length && !C.tail.some(a => a.w === 'ici')) return err(`“${v.w}” needs something after it: a describing word (“content”) or a place (“à la maison”).`, i - 1);
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
    return err(x.k === 'adj' ? `“${x.w}” needs to go next to the noun it describes.` : x.k === 'det' ? `“${x.w}” needs its noun right after it, in the right place.` : x.k === 'verb' ? 'One verb per sentence part. Use “et” or “mais” to add another.'
      : x.k === 'pron' ? 'The subject (who does it) goes at the start. To add another sentence, use “et” first.' : x.k === 'neg' ? '“ne” goes right before the verb.' : x.k === 'pas' ? `“${x.w}” goes right after the verb.`
      : x.k === 'int' ? '“très” goes right before a describing word.' : x.k === 'prep' ? `“${x.w}” needs a noun after it, in the right place.` : `“${x.w}” doesn’t fit here.`);
  }
  return { ok: true, P };
}

/* English meaning of a correct French sentence */
function frEnglish(P) {
  const an = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
  const npEn = np => {
    if (np.coord) return np.coord.map(npEn).join(np.conj?.w === 'ou' ? ' or ' : ' and ');
    const a = np.pre || np.post, adj = a ? (np.tres ? 'very ' : '') + a.e[4] + ' ' : '', noun = np.n.en, d = np.det;
    let art = '';
    if (d) art = d.fam === 'le' ? 'the ' : d.fam === 'un' ? (np.num === 'p' ? 'some ' : an(adj || noun) + ' ') : d.fam === 'part' ? 'some ' : d.fam === 'de' ? 'any ' : d.en + ' ';
    const base = art + adj + noun;
    if (np.of) { const o = np.of; return ['person', 'animal'].includes(o.n.cat) ? `${npEn(o)}'s ${adj}${noun}` : `${base} of ${npEn(o)}`; }
    return base;
  };
  const one = C => {
    const v = C.verb, f = v.f;
    const subj = C.subj ? (C.subj.pron ? C.subj.pron.en : npEn(C.subj.np)) : ['I', 'you', 'he/she', 'we', 'you', 'they'][f];
    const third = f === 2 || (C.subj?.np && C.subj.num === 's'), never = C.pas?.w === 'jamais';
    // "always" and "often" go before the verb in English; "well" and "a lot" go at the end
    const how = C.tail.filter(x => x.pos === 'post'), freq = how.filter(a => ['toujours', 'souvent'].includes(a.w)).map(a => a.en).join(' '), endAdv = how.filter(a => !['toujours', 'souvent'].includes(a.w)).map(a => a.en);
    let vp;
    if (v.type === 'etre' || C.comp?.feel) {
      const be = f === 0 ? 'am' : third ? 'is' : 'are';
      const what = C.comp?.adj ? (C.comp.tres ? 'very ' : '') + C.comp.adj.e[4] : C.comp?.feel ? C.comp.feel.e[4] : '';
      vp = `${be}${never ? ' never' : C.neg ? ' not' : ''}${freq ? ' ' + freq : ''} ${what}`;
    } else {
      const base = v.e[5], s3 = v.e[6];
      vp = never ? `never ${third ? s3 : base}` : C.neg ? `${third ? 'does' : 'do'} not${freq ? ' ' + freq : ''} ${base}` : `${freq ? freq + ' ' : ''}${third ? s3 : base}`;
      if (C.comp?.np) vp += ' ' + npEn(C.comp.np);
      if (C.comp?.dest) vp += ' to ' + npEn(C.comp.dest);
    }
    if (endAdv.length) vp += ' ' + endAdv.join(' ');
    for (const { p, np } of C.pps) vp += ` ${p.w === 'dans' ? 'in' : p.w === 'avec' ? 'with' : p.w === 'pour' ? 'for' : v.e[0] === 'parler' && np.cat === 'person' ? 'to' : 'at'} ${npEn(np)}`;
    const tail = [...C.lead.map(a => a.en), ...C.tail.filter(a => a.pos !== 'post').map(a => a.en)].join(' ');
    return `${subj} ${vp}${tail ? ' ' + tail : ''}`.replace(/\s+/g, ' ').trim();
  };
  let s = one(P.clauses[0]);
  P.conjs.forEach((c, k) => { s += (c.w === 'et' ? ', and ' : c.w === 'mais' ? ', but ' : ', or ') + one(P.clauses[k + 1]); });
  return s[0].toUpperCase() + s.slice(1) + '.';
}

/* ---------------- making a French tray ---------------- */
function frGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = list => { const fav = list.filter(x => pref.has(x[0]) || (typeof x[1] === 'string' && pref.has(x[1]))); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const nounOf = cats => RP(FR_NOUN.filter(n => n[3] !== 'feel' && (cats[0] === '*' || cats.includes(n[3]) || (cats[0] === 'open' && FR_OPENABLE.includes(n[0])))));
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
  const adjFor = cat => RP(FR_ADJ.filter(a => !cat || a[5].includes(CAT[cat] || 'p')));
  const extra = [];
  const other = list => { const x = list.filter(Boolean); return x.length ? R(x) : null; };
  // a noun phrase with a determiner that fits (and a look-alike as a distractor)
  const np = (n, num, out, opts = {}) => {
    const g = n[2], mass = !!n[6];
    let fam;
    if (opts.like) fam = R(['le', 'le', 'le', 'mon', 'ce']);
    else if (opts.neg) fam = R(['de', 'le']);
    else if (num === 'p') fam = R(['le', 'le', 'un', 'mon', 'son', 'notre', 'ce', 'deux', 'trois']);
    else if (mass) fam = R(['part', 'part', 'le', 'mon', 'ce']);
    else fam = R(['le', 'le', 'un', 'un', 'mon', 'ton', 'son', 'notre', 'leur', 'ce']);
    if (opts.subj && fam === 'part') fam = 'le';
    if (opts.subj && fam === 'de') fam = 'le';
    const a = opts.adj !== false && coin(0.35) ? adjFor(n[3]) : null, tres = a && coin(0.2);
    if (a && a[6] === 'pre' && num === 'p' && fam === 'un') fam = 'le';
    const nw = num === 'p' ? n[1] : n[0], after = a && a[6] === 'pre' ? frAdjWant(a, g, num, nw) : nw;
    const d = frWant(fam, g, num, tres ? 'très' : after);
    out.push(frDetW(d)); const wrong = other(FR_DET.filter(x => x[1] === fam && x[0] !== d).map(x => x[0])); if (wrong) extra.push(frDetW(wrong));
    if (a && a[6] === 'pre') { if (tres) out.push(frTres()); out.push(frAdj(a, after)); }
    out.push(frNoun(n, num));
    if (a && a[6] === 'post') { if (tres) out.push(frTres()); out.push(frAdj(a, frAdjWant(a, g, num, null))); }
    if (a) extra.push(frAdj(a, a[frAdjIdx(g === 'm' ? 'f' : 'm', num === 's' ? 'p' : 's')]));
    if (opts.of && !['mon', 'ton', 'son', 'notre', 'votre', 'leur'].includes(fam) && coin(0.25)) { const o = nounOf(['person']);
      if (o[2] === 'm' && !frV(o[0]) && coin(0.5)) { out.push(frPrep('du'), frNoun(o, 's')); extra.push(frDetW('le')); }
      else { const t = []; np(o, 's', t, { adj: false }); out.push(frPrep(frV(t[0].w) ? "d'" : 'de'), ...t); } }
  };
  // à + a place (au, aux, à la, à l')
  const toPlace = (out, n) => { if (n[2] === 'm' && !frV(n[0])) { out.push(frPrep('au'), frNoun(n, 's')); extra.push(frPrep('à'), frDetW('le')); } else { out.push(frPrep('à'), frDetW(frWant('le', n[2], 's', n[0])), frNoun(n, 's')); extra.push(frPrep('au')); } };
  const clause = () => {
    const out = [], kind = R(['tr', 'tr', 'tr', 'in', 'etre', 'etre', 'avoir', 'aller', 'refl']);
    const verb = kind === 'etre' ? FR_VERB.find(v => v[0] === 'être') : kind === 'aller' ? FR_VERB.find(v => v[0] === 'aller') : kind === 'avoir' ? FR_VERB.find(v => v[0] === 'avoir')
      : kind === 'refl' ? RP(FR_VERB.filter(v => v[8])) : RP(FR_VERB.filter(v => v[2] === kind && !v[8]));
    const subjKinds = verb[7] === 'p' ? ['person'] : ['person', 'animal'];
    let f, g = 'x', subjCat = 'person';
    if (coin(0.5)) { const p = R(FR_PRON.filter(x => x[0] !== "j'")); f = p[1]; g = p[2]; out.push(null); out.pron = p; }
    else {
      const n = nounOf(subjKinds); g = n[2]; subjCat = n[3]; const num = n[1] && coin(0.3) ? 'p' : 's';
      np(n, num, out, { subj: true, of: true }); f = num === 'p' ? 5 : 2;
      if (coin(0.12)) { const n2 = nounOf(subjKinds); out.push(frConj('et')); np(n2, 's', out, { subj: true, adj: false }); f = 5; g = g === 'm' || n2[2] === 'm' ? 'm' : 'f'; }
    }
    const neg = kind !== 'etre' && coin(0.22) ? R(['pas', 'pas', 'jamais']) : kind === 'etre' && coin(0.12) ? 'pas' : null;
    const refl = verb[8] ? frReflWant(f, verb[1][f]) : null, vw = verb[1][f];
    const firstAfterSubj = neg ? 'ne' : refl || vw;
    if (out.pron) { const p = out.pron[0] === 'je' && frV(firstAfterSubj === 'ne' ? 'ne' : firstAfterSubj) ? "j'" : out.pron[0]; out[0] = frPronW(p); extra.push(frPronW(p === "j'" ? 'je' : p === 'je' ? "j'" : R(['tu', 'nous', 'ils']))); }
    if (neg) { const ne = frNe(refl || vw); out.push(ne); extra.push(chip({ k: 'neg', w: ne.w === 'ne' ? "n'" : 'ne', en: 'not' })); }
    if (refl) { out.push(frRefl(refl, f)); extra.push(frRefl(R(['me', 'te', 'se', 'nous'].filter(x => x !== refl)), f)); }
    out.push(frVerb(verb, f)); extra.push(frVerb(verb, (f + 1 + Math.floor(Math.random() * 5)) % 6));
    if (neg) out.push(frPas(neg));
    if (kind === 'etre') {
      const gg = g === 'x' ? R(['m', 'f']) : g, num = FR_FORM[f][1];
      if (coin(0.7)) { if (coin(0.25)) out.push(frTres()); const a = adjFor(subjCat); out.push(frAdj(a, a[frAdjIdx(gg, num)])); extra.push(frAdj(a, a[frAdjIdx(gg === 'm' ? 'f' : 'm', num === 's' ? 'p' : 's')]), frVerb(FR_VERB.find(v => v[0] === 'avoir'), f)); }
      else { const n = nounOf(['place']); if (coin(0.5) && !FR_NO_DANS.includes(n[0])) { out.push(frPrep('dans')); np(n, 's', out, { adj: false }); } else toPlace(out, n); }
    } else if (kind === 'avoir') {
      if (coin(0.35)) { out.push(frNoun(R(FR_NOUN.filter(n => n[3] === 'feel')), 's')); extra.push(frVerb(FR_VERB.find(v => v[0] === 'être'), f)); }
      else { const n = nounOf(['*']), on = n[1] && coin(0.3) ? 'p' : 's'; np(n, on, out, { neg: !!neg, of: true }); }
    } else if (kind === 'aller') {
      toPlace(out, nounOf(['place']));
      if (coin(0.3)) { out.push(frPrep('avec')); np(nounOf(['person']), 's', out, { adj: false }); }
      extra.push(frPrep('dans'));
    } else if (kind === 'tr') {
      const n = nounOf(verb[3]), on = n[1] && coin(0.3) ? 'p' : 's';
      np(n, on, out, { neg: !!neg, like: verb[0] === 'aimer', of: true });
      if (['person', 'animal'].includes(n[3])) extra.push(frPrep('à'));
      if (coin(0.2)) { out.push(frPrep(R(['avec', 'pour']))); np(nounOf(['person']), 's', out, { adj: false }); }
      else if (coin(0.15)) { out.push(frPrep('dans')); np(RP(FR_NOUN.filter(n => n[3] === 'place' && !FR_NO_DANS.includes(n[0]))), 's', out, { adj: false }); }
      extra.push(frNoun(nounOf(['*']), 's'));
    } else {
      const r = Math.random();
      if (r < 0.4) { out.push(frPrep('dans')); np(RP(FR_NOUN.filter(n => n[3] === 'place' && !FR_NO_DANS.includes(n[0]))), 's', out, { adj: false }); }
      else if (r < 0.65) { out.push(frPrep('avec')); np(nounOf(['person', 'animal']), 's', out, { adj: false }); }
      else if (r < 0.75 && verb[0] === 'parler') { out.push(frPrep('à')); np(nounOf(['person']), 's', out, { adj: false }); }
    }
    if (coin(0.2) && kind !== 'etre') out.push(frAdv(R(FR_HOW_VERBS.test(verb[0]) && kind !== 'tr' ? ['toujours', 'souvent', 'bien', 'beaucoup'] : ['toujours', 'souvent'])));   // placed by the fix-up below
    if (coin(0.22)) out.push(frAdv(R(FR_ADV.filter(x => x[2] === 'edge' || x[2] === 'end'))[0]));
    // a "post" adverb belongs right after the verb (after pas)
    const pi = out.findIndex(c => c?.k === 'adv' && c.pos === 'post');
    if (pi >= 0) { const [a] = out.splice(pi, 1); const vi = out.findIndex(c => c?.k === 'verb'), at = out[vi + 1]?.k === 'pas' ? vi + 2 : vi + 1; out.splice(at, 0, a); }
    return out;
  };
  for (let tries = 0; tries < 120; tries++) {
    extra.length = 0;
    let words = clause(); if (!words || words.includes(null)) continue;
    if (Math.random() < 0.25) { const c2 = clause(); if (c2 && !c2.includes(null)) words = [...words, frConj(R(['et', 'et', 'mais', 'ou'])), ...c2]; }
    if (words.length > 14 || words.length < 3) continue;
    const res = frCheck(words); if (!res.ok) continue;
    extra.push(frPronW(R(['je', 'il', 'elle', 'nous', 'vous', 'ils'])), frPrep(R(['à', 'dans', 'avec', 'de'])));
    if (!words.some(w => w.k === 'conj')) extra.push(frConj(R(['et', 'mais'])));
    if (!words.some(w => w.k === 'neg')) extra.push(chip({ k: 'neg', w: 'ne', en: 'not' }), frPas('pas'));
    const seen = new Set(words.map(w => w.k + w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && !seen.has(x.k + x.w)) { seen.add(x.k + x.w); uniq.push(x); }
    return { words, extra: uniq.slice(0, Math.max(4, 16 - words.length)), english: frEnglish(res.P) };
  }
  return null;
}

BLD_LANGS.fr = { name: 'French', check: frCheck, gen: frGenerate, voice: 'fr-FR', english: frEnglish };
BLD_LANGS.es.english = esEnglish;
BLD_ORDER.fr = { rows: [
    ['A basic sentence', [['det', 'determiner'], ['noun', 'noun'], ['adj', '(adjective)'], ['verb', 'verb'], ['det', 'determiner'], ['noun', 'noun'], ['adj', '(adjective)']]],
    ['Starting with a pronoun', [['pron', 'pronoun'], ['verb', 'verb'], ['det', 'determiner'], ['noun', 'noun']]],
    ['A short adjective (grand, petit, bon, beau…)', [['det', 'determiner'], ['adj', 'adjective'], ['noun', 'noun'], ['verb', 'verb']]],
    ['Saying what something is like (être)', [['det', 'determiner'], ['noun', 'noun'], ['verb', 'être'], ['adv', '(très)'], ['adj', 'adjective']]],
    ['A negative sentence', [['pron', 'pronoun'], ['adv', 'ne'], ['verb', 'verb'], ['adv', 'pas'], ['det', 'de'], ['noun', 'noun']]],
    ['A verb like se lever', [['pron', 'pronoun'], ['pron', 'me / te / se'], ['verb', 'verb']]],
    ['Going somewhere', [['pron', 'pronoun'], ['verb', 'aller'], ['prep', 'à / au'], ['det', '(determiner)'], ['noun', 'place']]],
    ['Joining two sentences', [['verb', 'sentence'], ['conj', 'conjunction'], ['verb', 'sentence']]],
  ], tips: [
    ['pron', 'French always needs a subject: a pronoun (je, il, nous…) or a noun.'],
    ['adj', 'Most adjectives come <b>after</b> the noun. A few short ones go <b>before</b>: bon, mauvais, grand, petit, beau, joli, jeune, vieux, nouveau.'],
    ['det', 'Every noun needs a determiner. Before a vowel sound: <b>l\'</b>, <b>cet</b>, <b>mon amie</b>. For things you can’t count: <b>du</b>, <b>de la</b>, <b>de l\'</b>.'],
    ['adv', '<b>ne</b> goes before the verb and <b>pas</b> (or <b>jamais</b>) right after it. After them, un / une / des / du become <b>de</b>.'],
    ['adv', '<b>toujours</b>, <b>souvent</b>, <b>bien</b> and <b>beaucoup</b> go right after the verb. <b>très</b> goes right before the adjective.'],
    ['prep', '<b>à + le = au</b>, <b>à + les = aux</b>, <b>de + le = du</b>. You see a person directly: <b>je vois mon ami</b> (no à).'],
    ['pron', 'je, ne, me, te, se lose their e before a vowel: <b>j\'aime</b>, <b>je n\'ai pas</b>, <b>je m\'habille</b>.'],
    ['noun', 'Feelings use avoir: <b>j\'ai faim</b>, <b>j\'ai soif</b>, <b>j\'ai froid</b>.'] ] };

/* ---------------- Your own French words (📚 Add my deck's words) ---------------- */
// Present tense of common irregular verbs: je, tu, il/elle, nous, vous, ils/elles
const FR_IRREG_FORMS = {
  être: 'suis es est sommes êtes sont', avoir: 'ai as a avons avez ont', aller: 'vais vas va allons allez vont', faire: 'fais fais fait faisons faites font',
  dire: 'dis dis dit disons dites disent', pouvoir: 'peux peux peut pouvons pouvez peuvent', vouloir: 'veux veux veut voulons voulez veulent',
  savoir: 'sais sais sait savons savez savent', devoir: 'dois dois doit devons devez doivent', venir: 'viens viens vient venons venez viennent',
  tenir: 'tiens tiens tient tenons tenez tiennent', revenir: 'reviens reviens revient revenons revenez reviennent', devenir: 'deviens deviens devient devenons devenez deviennent',
  prendre: 'prends prends prend prenons prenez prennent', comprendre: 'comprends comprends comprend comprenons comprenez comprennent', apprendre: 'apprends apprends apprend apprenons apprenez apprennent',
  mettre: 'mets mets met mettons mettez mettent', voir: 'vois vois voit voyons voyez voient', boire: 'bois bois boit buvons buvez boivent',
  lire: 'lis lis lit lisons lisez lisent', écrire: 'écris écris écrit écrivons écrivez écrivent', croire: 'crois crois croit croyons croyez croient',
  partir: 'pars pars part partons partez partent', sortir: 'sors sors sort sortons sortez sortent', dormir: 'dors dors dort dormons dormez dorment',
  sentir: 'sens sens sent sentons sentez sentent', servir: 'sers sers sert servons servez servent', mentir: 'mens mens ment mentons mentez mentent',
  courir: 'cours cours court courons courez courent', ouvrir: 'ouvre ouvres ouvre ouvrons ouvrez ouvrent', offrir: 'offre offres offre offrons offrez offrent',
  découvrir: 'découvre découvres découvre découvrons découvrez découvrent', souffrir: 'souffre souffres souffre souffrons souffrez souffrent',
  connaître: 'connais connais connaît connaissons connaissez connaissent', recevoir: 'reçois reçois reçoit recevons recevez reçoivent',
  vivre: 'vis vis vit vivons vivez vivent', suivre: 'suis suis suit suivons suivez suivent', rire: 'ris ris rit rions riez rient', conduire: 'conduis conduis conduit conduisons conduisez conduisent',
  appeler: 'appelle appelles appelle appelons appelez appellent', jeter: 'jette jettes jette jetons jetez jettent', envoyer: 'envoie envoies envoie envoyons envoyez envoient',
  asseoir: 'assieds assieds assied asseyons asseyez asseyent', plaire: 'plais plais plaît plaisons plaisez plaisent', craindre: 'crains crains craint craignons craignez craignent',
  peindre: 'peins peins peint peignons peignez peignent', éteindre: 'éteins éteins éteint éteignons éteignez éteignent', construire: 'construis construis construit construisons construisez construisent',
  détruire: 'détruis détruis détruit détruisons détruisez détruisent', produire: 'produis produis produit produisons produisez produisent', traduire: 'traduis traduis traduit traduisons traduisez traduisent',
};
const frReflStrip = inf => inf.replace(/^se\s+|^s'/, '');
// je, tu, il, nous, vous, ils: the table first, then the regular patterns (-er, -ir like finir, -re like vendre)
function frConjugate(inf) {
  inf = frReflStrip(inf);
  if (FR_IRREG_FORMS[inf]) return FR_IRREG_FORMS[inf].split(' ');
  const st = inf.slice(0, -2);
  if (/er$/.test(inf)) {
    const nous = /ger$/.test(inf) ? st + 'eons' : /cer$/.test(inf) ? st.slice(0, -1) + 'çons' : st + 'ons';
    let s = st;
    if (/[eé][^aeiouéèê]er$/.test(inf)) s = st.replace(/[eé]([^aeiouéèê])$/, 'è$1');   // acheter → achète, préférer → préfère
    if (/[ou]yer$/.test(inf)) s = st.slice(0, -1) + 'i';                                // nettoyer → nettoie
    return [s + 'e', s + 'es', s + 'e', nous, st + 'ez', s + 'ent'];
  }
  if (/ir$/.test(inf)) return [st + 'is', st + 'is', st + 'it', st + 'issons', st + 'issez', st + 'issent'];
  if (/re$/.test(inf)) return [st + 's', st + 's', st, st + 'ons', st + 'ez', st + 'ent'];
  return [inf, inf, inf, inf, inf, inf];
}
const frPl = w => /[sxz]$/.test(w) ? w : /(eau|au)$/.test(w) || (/eu$/.test(w) && !/(pneu|bleu)$/.test(w)) ? w + 'x' : /al$/.test(w) ? w.slice(0, -2) + 'aux' : w + 's';
const frGenderGuess = w => /^(poisson|garçon|hérisson|buisson)$/.test(w) ? 'm' : /(tion|sion|son|çon|té|ette|ure|ence|ance|ie|ée|ade|ise|euse|rice|esse|elle|ière|aine|ine|ude|onne)$/.test(w) ? 'f' : 'm';
const FR_ADJ_F = { gentil: 'gentille', blanc: 'blanche', frais: 'fraîche', long: 'longue', doux: 'douce', faux: 'fausse', sec: 'sèche', public: 'publique', gros: 'grosse', bas: 'basse', épais: 'épaisse', fou: 'folle', mou: 'molle' };
function frAdjForms(w) {
  const f = FR_ADJ_F[w] || (/e$/.test(w) ? w : /eux$/.test(w) ? w.slice(0, -1) + 'se' : /if$/.test(w) ? w.slice(0, -1) + 've' : /er$/.test(w) ? w.slice(0, -2) + 'ère'
    : /(eil|el|en|on|et)$/.test(w) ? w + w.slice(-1) + 'e' : w + 'e');
  return [w, f, /[sx]$/.test(w) ? w : w + 's', f + 's'];
}
const FR_BASE = { n: FR_NOUN.length, a: FR_ADJ.length, v: FR_VERB.length };
const frKnown = w => FR_NOUN.slice(0, FR_BASE.n).some(n => n[0] === w || n[1] === w) || FR_VERB.slice(0, FR_BASE.v).some(v => v[0] === w || frReflStrip(v[0]) === frReflStrip(w) || v[1].includes(w))
  || FR_ADJ.slice(0, FR_BASE.a).some(a => a.slice(0, 4).includes(w)) || [FR_PRON, FR_DET, FR_PREP, FR_CONJ, FR_ADV].some(L => L.some(x => x[0] === w)) || ['ne', 'pas', 'jamais', 'très'].includes(w);
function frApplyMine() {
  FR_NOUN.length = FR_BASE.n; FR_ADJ.length = FR_BASE.a; FR_VERB.length = FR_BASE.v;
  for (const m of S.bldWords || []) {
    if (!m || m.lang !== 'fr' || !m.w || !m.en || frKnown(m.w)) continue;
    if (m.k === 'noun') FR_NOUN.push([m.w, m.pl || null, m.g === 'f' ? 'f' : 'm', m.cat || 'thing', m.en, m.pl ? (m.enPl || bldPlEn(m.en)) : null]);
    if (m.k === 'verb' && Array.isArray(m.forms) && m.forms.length === 6) {
      const refl = /^(se\s|s')/.test(m.w) ? 1 : 0, type = m.obj === 'in' || refl ? 'in' : 'tr', objs = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read', 'place'];
      FR_VERB.push([m.w, m.forms, type, objs, 0, m.en, bld3sEn(m.en), m.who === 'a' ? 'a' : 'p', refl]);
    }
    if (m.k === 'adj') FR_ADJ.push([...frAdjForms(m.w), m.en, 'patflr', 'post']);
  }
}
/* what each language needs for "Add my deck's words" */
const BLD_MINE = {
  es: { name: 'Spanish', forms: 'yo, tú, él/ella, nosotros, ellos/ustedes', nForms: 5, m: 'el (masculine)', f: 'la (feminine)', conj: w => bldConj(w), pl: w => bldPlEs(w), adj: w => bldAdjForms(w),
    known: w => bldKnown(w), gender: w => bldGenderGuess(w), isVerb: w => /(ar|er|ir|ír)(se)?$/.test(w), refl: w => /se$/.test(w),
    parse: s => { const m = s.match(/^(el|la|un|una)\s+(\p{L}+)$/u); return m ? { w: m[2], g: /^(la|una)$/.test(m[1]) ? 'f' : 'm', art: true } : /^\p{L}+$/u.test(s) ? { w: s } : null; },
    intro: 'words with <i>el/la</i> are nouns, and words like <i>“to …”</i> are verbs). Verb forms are filled in for you, including common irregular verbs (tengo, pienso, duermo…); check any that look wrong. Verbs ending in “-se” (levantarse) work too: the game adds “me / te / se / nos” before them.' },
  fr: { name: 'French', forms: 'je, tu, il/elle, nous, vous, ils/elles', nForms: 6, m: 'le (masculine)', f: 'la (feminine)', conj: w => frConjugate(w), pl: w => frPl(w), adj: w => frAdjForms(w),
    known: w => frKnown(w), gender: w => frGenderGuess(w), isVerb: w => /(er|ir|re|oir)$/.test(frReflStrip(w)), refl: w => /^(se\s|s')/.test(w),
    parse: s => { let m = s.match(/^(le|la|un|une)\s+(\p{L}+)$/u); if (m) return { w: m[2], g: /^(la|une)$/.test(m[1]) ? 'f' : 'm', art: true };
      m = s.match(/^l['’](\p{L}+)$/u); if (m) return { w: m[1], art: true };
      m = s.match(/^(se\s|s['’])(\p{L}+)$/u); if (m) return { w: (m[1].startsWith('se') ? 'se ' : "s'") + m[2] };
      return /^\p{L}+$/u.test(s) ? { w: s } : null; },
    intro: 'words with <i>le/la/l\'</i> are nouns, and words like <i>“to …”</i> are verbs). Verb forms are filled in for you, including common irregular verbs (suis, vais, fais, prends…); check any that look wrong. Verbs with “se” (se laver) work too: the game adds “me / te / se / nous / vous” before them.' },
};
