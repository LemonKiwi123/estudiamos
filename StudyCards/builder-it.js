'use strict';
/* ================= Sentence Builder: Italian =================
   Same idea as French: every word on the tray is one analysed word (a "chip"), and the checker explains the first mistake.
   Italian checks: il / lo / l' / la / i / gli / le and un / uno / una / un' agree with the noun and with the sound of the next
   word (lo and gli before s + consonant, z, gn, ps; l' before a vowel); del / della (some); possessives come with the article
   (il mio libro) except one family member (mia madre); a + il = al, in + il = nel, di + il = del; non before the verb, and
   non … mai; most adjectives after the noun, a few (grande, piccolo, bello, buono, nuovo, vecchio, giovane) before or after it
   (bel, bell', buon before the noun); the subject can be left out (mangio = I eat); avere fame / sete (not essere); no "a"
   before a person you see; andare a scuola, a casa, in città, al parco; reflexive verbs (mi alzo); the verb agrees with
   the subject. Loaded after builder.js and builder-fr.js. */

const itV = w => /^[aeiouàèéìòùh]/i.test(w || '');                                   // starts with a vowel sound
const itS = w => /^(s[^aeiouàèéìòù]|z|gn|ps|pn|x|y|i[aeiouàèéìòù])/i.test(w || '');   // lo / gli / uno words: s + consonant, z, gn, ps…
//            word   form  gender  English          form: 0 io, 1 tu, 2 lui/lei, 3 noi, 4 voi, 5 loro
const IT_PRON = [['io', 0, 'x', 'I'], ['tu', 1, 'x', 'you'], ['lui', 2, 'm', 'he'], ['lei', 2, 'f', 'she'], ['noi', 3, 'x', 'we'], ['voi', 4, 'x', 'you'], ['loro', 5, 'x', 'they']];
const IT_FORM = [[1, 's'], [2, 's'], [3, 's'], [1, 'p'], [2, 'p'], [3, 'p']];
// the definite article for a noun (or for the word right after the article)
function itDef(g, num, next) {
  if (num === 'p') return g === 'f' ? 'le' : itS(next) || itV(next) ? 'gli' : 'i';
  if (itV(next)) return "l'";
  return g === 'f' ? 'la' : itS(next) ? 'lo' : 'il';
}
// a / di / in / da / su + the article: al, del, nel, dalla, sugli…
const IT_PBASE = { a: 'a', di: 'de', in: 'ne', da: 'da', su: 'su' }, IT_ATAIL = { il: 'l', lo: 'llo', "l'": "ll'", la: 'lla', i: 'i', gli: 'gli', le: 'lle' };
const itContr = (p, art) => IT_PBASE[p] + IT_ATAIL[art];
// the right determiner for a noun: family + gender + number + the word right after it
function itWant(fam, g, num, next) {
  const p = num === 'p', v = itV(next), s = itS(next);
  switch (fam) {
    case 'il': return itDef(g, num, next);
    case 'un': return p ? (g === 'f' ? 'delle' : s || v ? 'degli' : 'dei') : g === 'f' ? (v ? "un'" : 'una') : s ? 'uno' : 'un';
    case 'part': return itContr('di', itDef(g, num, next));
    case 'questo': return p ? (g === 'f' ? 'queste' : 'questi') : g === 'f' ? 'questa' : 'questo';
    case 'quello': return p ? (g === 'f' ? 'quelle' : s || v ? 'quegli' : 'quei') : v ? "quell'" : g === 'f' ? 'quella' : s ? 'quello' : 'quel';
    default: return fam;   // due, tre
  }
}
//            word      family  kind    English
const IT_DET = [['il', 'il', 'art', 'the'], ['lo', 'il', 'art', 'the'], ["l'", 'il', 'art', 'the'], ['la', 'il', 'art', 'the'], ['i', 'il', 'art', 'the'], ['gli', 'il', 'art', 'the'], ['le', 'il', 'art', 'the'],
  ['un', 'un', 'art', 'a'], ['uno', 'un', 'art', 'a'], ['una', 'un', 'art', 'a'], ["un'", 'un', 'art', 'a'], ['dei', 'un', 'art', 'some'], ['degli', 'un', 'art', 'some'], ['delle', 'un', 'art', 'some'],
  ['del', 'part', 'part', 'some'], ['dello', 'part', 'part', 'some'], ["dell'", 'part', 'part', 'some'], ['della', 'part', 'part', 'some'],
  ['questo', 'questo', 'dem', 'this'], ['questa', 'questo', 'dem', 'this'], ['questi', 'questo', 'dem', 'these'], ['queste', 'questo', 'dem', 'these'],
  ['quel', 'quello', 'dem', 'that'], ['quello', 'quello', 'dem', 'that'], ["quell'", 'quello', 'dem', 'that'], ['quella', 'quello', 'dem', 'that'], ['quei', 'quello', 'dem', 'those'], ['quegli', 'quello', 'dem', 'those'], ['quelle', 'quello', 'dem', 'those'],
  ['due', 'due', 'num', 'two'], ['tre', 'tre', 'num', 'three']];
//            m sing    f sing    m plural  f plural  English
const IT_POSS = [['mio', 'mia', 'miei', 'mie', 'my'], ['tuo', 'tua', 'tuoi', 'tue', 'your'], ['suo', 'sua', 'suoi', 'sue', 'his/her'],
  ['nostro', 'nostra', 'nostri', 'nostre', 'our'], ['vostro', 'vostra', 'vostri', 'vostre', 'your'], ['loro', 'loro', 'loro', 'loro', 'their']];
const itIdx = (g, num) => (num === 'p' ? 2 : 0) + (g === 'f' ? 1 : 0);
//            singular   plural   g    kind      English one / many   can't count (2: or one cup / scoop)   a place: how you go there (a casa, in città, al parco)   family
const IT_NOUN = [
  ['uomo', 'uomini', 'm', 'person', 'man', 'men'], ['donna', 'donne', 'f', 'person', 'woman', 'women'], ['ragazzo', 'ragazzi', 'm', 'person', 'boy', 'boys'], ['ragazza', 'ragazze', 'f', 'person', 'girl', 'girls'],
  ['amico', 'amici', 'm', 'person', 'friend', 'friends'], ['amica', 'amiche', 'f', 'person', 'friend', 'friends'], ['madre', null, 'f', 'person', 'mother', null, 0, null, 1], ['padre', null, 'm', 'person', 'father', null, 0, null, 1],
  ['fratello', 'fratelli', 'm', 'person', 'brother', 'brothers', 0, null, 1], ['sorella', 'sorelle', 'f', 'person', 'sister', 'sisters', 0, null, 1], ['insegnante', 'insegnanti', 'm', 'person', 'teacher', 'teachers'],
  ['medico', 'medici', 'm', 'person', 'doctor', 'doctors'], ['bambino', 'bambini', 'm', 'person', 'child', 'children'], ['studente', 'studenti', 'm', 'person', 'student', 'students'],
  ['cane', 'cani', 'm', 'animal', 'dog', 'dogs'], ['gatto', 'gatti', 'm', 'animal', 'cat', 'cats'], ['uccello', 'uccelli', 'm', 'animal', 'bird', 'birds'], ['cavallo', 'cavalli', 'm', 'animal', 'horse', 'horses'],
  ['pane', null, 'm', 'food', 'bread', null, 1], ['riso', null, 'm', 'food', 'rice', null, 1], ['formaggio', null, 'm', 'food', 'cheese', null, 1], ['pollo', null, 'm', 'food', 'chicken', null, 1],
  ['carne', null, 'f', 'food', 'meat', null, 1], ['zuppa', null, 'f', 'food', 'soup', null, 1], ['yogurt', null, 'm', 'food', 'yogurt', null, 1], ['gelato', null, 'm', 'food', 'ice cream', null, 2],
  ['mela', 'mele', 'f', 'food', 'apple', 'apples'], ['torta', 'torte', 'f', 'food', 'cake', 'cakes'], ['biscotto', 'biscotti', 'm', 'food', 'cookie', 'cookies'], ['arancia', 'arance', 'f', 'food', 'orange', 'oranges'],
  ['acqua', null, 'f', 'drink', 'water', null, 1], ['latte', null, 'm', 'drink', 'milk', null, 1], ['caffè', null, 'm', 'drink', 'coffee', null, 2], ['succo', null, 'm', 'drink', 'juice', null, 2], ['tè', null, 'm', 'drink', 'tea', null, 2],
  ['libro', 'libri', 'm', 'read', 'book', 'books'], ['lettera', 'lettere', 'f', 'read', 'letter', 'letters'], ['rivista', 'riviste', 'f', 'read', 'magazine', 'magazines'], ['giornale', 'giornali', 'm', 'read', 'newspaper', 'newspapers'],
  ['casa', 'case', 'f', 'place', 'house', 'houses', 0, 'a'], ['città', 'città', 'f', 'place', 'town', 'towns', 0, 'in'], ['scuola', 'scuole', 'f', 'place', 'school', 'schools', 0, 'a'], ['parco', 'parchi', 'm', 'place', 'park', 'parks', 0, 'art'],
  ['spiaggia', 'spiagge', 'f', 'place', 'beach', 'beaches', 0, 'in'], ['negozio', 'negozi', 'm', 'place', 'store', 'stores', 0, 'art'], ['ristorante', 'ristoranti', 'm', 'place', 'restaurant', 'restaurants', 0, 'art'],
  ['mercato', 'mercati', 'm', 'place', 'market', 'markets', 0, 'art'], ['ufficio', 'uffici', 'm', 'place', 'office', 'offices', 0, 'in'], ['cucina', 'cucine', 'f', 'place', 'kitchen', 'kitchens', 0, 'in'],
  ['biblioteca', 'biblioteche', 'f', 'place', 'library', 'libraries', 0, 'in'], ['chiesa', 'chiese', 'f', 'place', 'church', 'churches', 0, 'in'], ['stazione', 'stazioni', 'f', 'place', 'station', 'stations', 0, 'art'],
  ['zoo', 'zoo', 'm', 'place', 'zoo', 'zoos', 0, 'art'],
  ['macchina', 'macchine', 'f', 'thing', 'car', 'cars'], ['tavolo', 'tavoli', 'm', 'thing', 'table', 'tables'], ['sedia', 'sedie', 'f', 'thing', 'chair', 'chairs'], ['telefono', 'telefoni', 'm', 'thing', 'phone', 'phones'],
  ['palla', 'palle', 'f', 'thing', 'ball', 'balls'], ['fiore', 'fiori', 'm', 'thing', 'flower', 'flowers'], ['porta', 'porte', 'f', 'thing', 'door', 'doors'], ['finestra', 'finestre', 'f', 'thing', 'window', 'windows'],
  ['regalo', 'regali', 'm', 'thing', 'gift', 'gifts'], ['bicicletta', 'biciclette', 'f', 'thing', 'bike', 'bikes'], ['zaino', 'zaini', 'm', 'thing', 'backpack', 'backpacks'], ['specchio', 'specchi', 'm', 'thing', 'mirror', 'mirrors'],
  ['orologio', 'orologi', 'm', 'thing', 'watch', 'watches'],
  // how you feel: Italian says "ho fame" (I have hunger), with no article
  ['fame', null, 'f', 'feel', 'hungry'], ['sete', null, 'f', 'feel', 'thirsty'], ['freddo', null, 'm', 'feel', 'cold'], ['caldo', null, 'm', 'feel', 'hot'], ['paura', null, 'f', 'feel', 'scared'], ['sonno', null, 'm', 'feel', 'sleepy']];
const IT_OPENABLE = ['porta', 'finestra', 'libro', 'rivista', 'negozio', 'ufficio', 'ristorante', 'biblioteca', 'giornale', 'lettera', 'regalo', 'zaino'];
//            m sing     f sing     m plural    f plural    English      describes   both = before or after the noun, post = after it
const IT_ADJ = [['buono', 'buona', 'buoni', 'buone', 'good', 'pafrl', 'both'], ['cattivo', 'cattiva', 'cattivi', 'cattive', 'bad', 'paf', 'post'],
  ['grande', 'grande', 'grandi', 'grandi', 'big', 'patl', 'both'], ['piccolo', 'piccola', 'piccoli', 'piccole', 'small', 'patl', 'both'],
  ['nuovo', 'nuova', 'nuovi', 'nuove', 'new', 'tlr', 'both'], ['vecchio', 'vecchia', 'vecchi', 'vecchie', 'old', 'patlr', 'both'],
  ['bello', 'bella', 'belli', 'belle', 'beautiful', 'patl', 'both'], ['giovane', 'giovane', 'giovani', 'giovani', 'young', 'pa', 'both'],
  ['rosso', 'rossa', 'rossi', 'rosse', 'red', 'tf', 'post'], ['blu', 'blu', 'blu', 'blu', 'blue', 't', 'post'], ['verde', 'verde', 'verdi', 'verdi', 'green', 'tf', 'post'],
  ['nero', 'nera', 'neri', 'nere', 'black', 'at', 'post'], ['bianco', 'bianca', 'bianchi', 'bianche', 'white', 'atf', 'post'], ['giallo', 'gialla', 'gialli', 'gialle', 'yellow', 'tf', 'post'],
  ['caro', 'cara', 'cari', 'care', 'expensive', 'tflr', 'post'], ['facile', 'facile', 'facili', 'facili', 'easy', 'r', 'post'], ['difficile', 'difficile', 'difficili', 'difficili', 'hard', 'r', 'post'],
  ['veloce', 'veloce', 'veloci', 'veloci', 'fast', 'pat', 'post'], ['simpatico', 'simpatica', 'simpatici', 'simpatiche', 'nice', 'p', 'post'], ['intelligente', 'intelligente', 'intelligenti', 'intelligenti', 'smart', 'p', 'post'],
  ['felice', 'felice', 'felici', 'felici', 'happy', 'pa', 'post'], ['triste', 'triste', 'tristi', 'tristi', 'sad', 'pa', 'post'], ['delizioso', 'deliziosa', 'deliziosi', 'deliziose', 'delicious', 'f', 'post'],
  ['freddo', 'fredda', 'freddi', 'fredde', 'cold', 'fl', 'post'], ['caldo', 'calda', 'caldi', 'calde', 'hot', 'f', 'post'], ['pulito', 'pulita', 'puliti', 'pulite', 'clean', 'tl', 'post'], ['sporco', 'sporca', 'sporchi', 'sporche', 'dirty', 'tl', 'post'],
  ['stanco', 'stanca', 'stanchi', 'stanche', 'tired', 'pa', 'post'], ['contento', 'contenta', 'contenti', 'contente', 'glad', 'pa', 'post'], ['malato', 'malata', 'malati', 'malate', 'sick', 'pa', 'post']];
// before the noun, bello and buono change like the article: bel ragazzo, bello zaino, bell'amico, bei fiori, begli occhi; buon amico, buon'amica
function itAdjPre(a, g, num, next) {
  const v = itV(next), s = itS(next);
  if (a[0] === 'bello') return num === 'p' ? (g === 'f' ? 'belle' : s || v ? 'begli' : 'bei') : v ? "bell'" : g === 'f' ? 'bella' : s ? 'bello' : 'bel';
  if (a[0] === 'buono' && num === 's') return g === 'f' ? (v ? "buon'" : 'buona') : s ? 'buono' : 'buon';
  return a[itIdx(g, num)];
}
//            infinitive  io, tu, lui/lei, noi, voi, loro                          kind     what it takes   needs one  English        he/she form    who   reflexive
const IT_VERB = [['mangiare', ['mangio', 'mangi', 'mangia', 'mangiamo', 'mangiate', 'mangiano'], 'tr', ['food'], 0, 'eat', 'eats', 'a'],
  ['bere', ['bevo', 'bevi', 'beve', 'beviamo', 'bevete', 'bevono'], 'tr', ['drink'], 0, 'drink', 'drinks', 'a'],
  ['preparare', ['preparo', 'prepari', 'prepara', 'prepariamo', 'preparate', 'preparano'], 'tr', ['food', 'drink'], 0, 'make', 'makes', 'p'],
  ['leggere', ['leggo', 'leggi', 'legge', 'leggiamo', 'leggete', 'leggono'], 'tr', ['read'], 0, 'read', 'reads', 'p'],
  ['scrivere', ['scrivo', 'scrivi', 'scrive', 'scriviamo', 'scrivete', 'scrivono'], 'tr', ['read'], 0, 'write', 'writes', 'p'],
  ['comprare', ['compro', 'compri', 'compra', 'compriamo', 'comprate', 'comprano'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'buy', 'buys', 'p'],
  ['vendere', ['vendo', 'vendi', 'vende', 'vendiamo', 'vendete', 'vendono'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'sell', 'sells', 'p'],
  ['avere', ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'], 'avere', ['*'], 1, 'have', 'has', 'a'],
  ['volere', ['voglio', 'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'want', 'wants', 'a'],
  ['cercare', ['cerco', 'cerchi', 'cerca', 'cerchiamo', 'cercate', 'cercano'], 'tr', ['*'], 1, 'look for', 'looks for', 'a'],
  ['vedere', ['vedo', 'vedi', 'vede', 'vediamo', 'vedete', 'vedono'], 'tr', ['*'], 1, 'see', 'sees', 'a'],
  ['guardare', ['guardo', 'guardi', 'guarda', 'guardiamo', 'guardate', 'guardano'], 'tr', ['person', 'animal', 'thing', 'read'], 1, 'look at', 'looks at', 'a'],
  ['amare', ['amo', 'ami', 'ama', 'amiamo', 'amate', 'amano'], 'tr', ['*'], 1, 'love', 'loves', 'a'],
  ['visitare', ['visito', 'visiti', 'visita', 'visitiamo', 'visitate', 'visitano'], 'tr', ['place'], 1, 'visit', 'visits', 'p'],
  ['aprire', ['apro', 'apri', 'apre', 'apriamo', 'aprite', 'aprono'], 'tr', ['open'], 1, 'open', 'opens', 'p'],
  ['chiudere', ['chiudo', 'chiudi', 'chiude', 'chiudiamo', 'chiudete', 'chiudono'], 'tr', ['open'], 1, 'close', 'closes', 'p'],
  ['parlare', ['parlo', 'parli', 'parla', 'parliamo', 'parlate', 'parlano'], 'in', null, 0, 'talk', 'talks', 'p'],
  ['lavorare', ['lavoro', 'lavori', 'lavora', 'lavoriamo', 'lavorate', 'lavorano'], 'in', null, 0, 'work', 'works', 'p'],
  ['studiare', ['studio', 'studi', 'studia', 'studiamo', 'studiate', 'studiano'], 'in', null, 0, 'study', 'studies', 'p'],
  ['giocare', ['gioco', 'giochi', 'gioca', 'giochiamo', 'giocate', 'giocano'], 'in', null, 0, 'play', 'plays', 'a'],
  ['correre', ['corro', 'corri', 'corre', 'corriamo', 'correte', 'corrono'], 'in', null, 0, 'run', 'runs', 'a'],
  ['camminare', ['cammino', 'cammini', 'cammina', 'camminiamo', 'camminate', 'camminano'], 'in', null, 0, 'walk', 'walks', 'a'],
  ['dormire', ['dormo', 'dormi', 'dorme', 'dormiamo', 'dormite', 'dormono'], 'in', null, 0, 'sleep', 'sleeps', 'a'],
  ['abitare', ['abito', 'abiti', 'abita', 'abitiamo', 'abitate', 'abitano'], 'in', null, 0, 'live', 'lives', 'a'],
  ['andare', ['vado', 'vai', 'va', 'andiamo', 'andate', 'vanno'], 'andare', null, 1, 'go', 'goes', 'a'],
  ['essere', ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'], 'essere', null, 1, 'be', 'is', 'a'],
  // reflexive verbs: the 9th item (1) means they need mi / ti / si / ci / vi right before them
  ['alzarsi', ['alzo', 'alzi', 'alza', 'alziamo', 'alzate', 'alzano'], 'in', null, 0, 'get up', 'gets up', 'a', 1],
  ['lavarsi', ['lavo', 'lavi', 'lava', 'laviamo', 'lavate', 'lavano'], 'in', null, 0, 'wash up', 'washes up', 'p', 1],
  ['vestirsi', ['vesto', 'vesti', 'veste', 'vestiamo', 'vestite', 'vestono'], 'in', null, 0, 'get dressed', 'gets dressed', 'p', 1],
  ['svegliarsi', ['sveglio', 'svegli', 'sveglia', 'svegliamo', 'svegliate', 'svegliano'], 'in', null, 0, 'wake up', 'wakes up', 'a', 1]];
const IT_REFL = ['mi', 'ti', 'si', 'ci', 'vi', 'si'];
//            word       English       where it goes: edge = start or end · post = right after the verb (after mai) · end = at the end
const IT_ADV = [['oggi', 'today', 'edge'], ['domani', 'tomorrow', 'edge'], ['adesso', 'now', 'edge'], ['sempre', 'always', 'post'], ['spesso', 'often', 'post'],
  ['molto', 'a lot', 'post'], ['bene', 'well', 'post'], ['qui', 'here', 'end']];
// prepositions, and a / di / in joined with the article (al, del, nel…): word, preposition, article, English
const IT_PREP = [['a', 'a', null, 'to / at'], ['in', 'in', null, 'in'], ['con', 'con', null, 'with'], ['per', 'per', null, 'for'], ['di', 'di', null, 'of']];
for (const p of ['a', 'di', 'in']) for (const art of Object.keys(IT_ATAIL)) IT_PREP.push([itContr(p, art), p, art, { a: 'to the / at the', di: 'of the', in: 'in the' }[p]]);
const IT_CONJ = [['e', 'and'], ['ma', 'but'], ['o', 'or']];
const IT_KIND = { food: 'food', drink: 'drinks', read: 'things you read or write', thing: 'things', place: 'places', animal: 'animals', person: 'people', open: 'things you can open' };
const IT_HOW_VERBS = /^(parlare|lavorare|studiare|giocare|correre|camminare|dormire|mangiare|bere|leggere|scrivere)$/;   // verbs that go with bene / molto

/* chips (each one carries its own English for the word tag) */
const itChip = o => chip({ ...o, gloss: o.gloss || o.en });
const itPron = p => itChip({ k: 'pron', w: p[0], f: p[1], per: IT_FORM[p[1]][0], num: IT_FORM[p[1]][1], g: p[2], en: p[3] });
const itPronW = w => itPron(IT_PRON.find(p => p[0] === w));
const itDetW = w => { const d = IT_DET.find(x => x[0] === w); return itChip({ k: 'det', w, fam: d[1], cls: d[2], en: d[3] }); };
const itPossW = (row, w) => itChip({ k: 'det', w, fam: row[0], cls: 'poss', e: row, en: row[4] });
const itNoun = (n, num) => itChip({ k: 'noun', w: num === 'p' ? n[1] : n[0], e: n, g: n[2], num, cat: n[3], mass: !!n[6], fam: !!n[8], en: num === 'p' ? n[5] : n[4] });
const itAdj = (a, w) => itChip({ k: 'adj', w, e: a, en: a[4], pos: a[6] });
const itVerb = (v, f) => itChip({ k: 'verb', w: v[1][f], e: v, f, type: v[2], en: v[5], gloss: 'to ' + v[5] });
const itRefl = (w, f) => itChip({ k: 'refl', w, f, en: 'oneself' });
const itPrep = w => { const p = IT_PREP.find(x => x[0] === w); return itChip({ k: 'prep', w, base: p[1], art: p[2], en: p[3] }); };
const itConj = w => itChip({ k: 'conj', w, en: IT_CONJ.find(c => c[0] === w)[1] });
const itAdv = w => { const a = IT_ADV.find(x => x[0] === w); return itChip({ k: 'adv', w, en: a[1], pos: a[2] }); };
const itNon = () => itChip({ k: 'neg', w: 'non', en: 'not' });
const itMai = () => itChip({ k: 'pas', w: 'mai', en: 'never' });
const itMolto = () => itChip({ k: 'int', w: 'molto', en: 'very' });
const itJoin = (...ws) => ws.filter(Boolean).reduce((s, w) => !s ? w : /'$/.test(s) ? s + w : s + ' ' + w, '');
// the way you say "to / at" a place: a casa, in città, al parco
const itPlaceText = (n, num = 's') => { const w = num === 'p' ? n.e[1] : n.e[0]; return n.e[7] === 'a' || n.e[7] === 'in' ? 'a' === n.e[7] ? 'a ' + w : 'in ' + w : itJoin(itContr('a', itDef(n.g, num, w)), w); };

/* ---------------- Italian checker ---------------- */
function itCheck(T) {
  let i = 0;
  const err = (msg, at = i) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length }), peek = (o = 0) => T[i + o], isErr = x => x && x.ok === false;
  if (!T.length) return err('Tap some words to build a sentence.');
  const gName = g => g === 'f' ? 'feminine' : 'masculine', nName = n => n === 'p' ? 'plural' : 'singular', cap = s => s[0].toUpperCase() + s.slice(1);
  // "del" can be "some" (del pane) or "of the" (il libro del ragazzo): both chips work in both places
  const isDiArt = t => t && ((t.k === 'prep' && t.base === 'di' && t.art) || (t.k === 'det' && (t.fam === 'part' || ['dei', 'degli', 'delle'].includes(t.w))));
  const asDet = t => t.k === 'det' ? t : (() => { const d = IT_DET.find(x => x[0] === t.w); return d ? { ...t, k: 'det', fam: d[1], cls: d[2], en: d[3] } : t; })();
  const isMolto = t => t && t.w === 'molto' && (t.k === 'int' || t.k === 'adv');
  const npText = np => np.coord ? np.coord.map(npText).join(' e ') : itJoin(np.det?.w, np.poss?.w, np.pre?.w, np.n.w, np.molto ? 'molto' : '', np.post?.w);
  // a noun phrase: (article) (possessive) (adjective that can go before) noun (molto) (adjective) (di + noun)
  function NP(role, neg) {
    const start = i; let det = null, poss = null, pre = null, post = null, molto = false, of = null;
    if (peek()?.k === 'det' || (isDiArt(peek()) && role !== 'of')) {
      const d = asDet(T[i]);
      if (d.cls === 'poss') { poss = d; i++; }
      else { det = d; i++; if (peek()?.k === 'det' && peek().cls === 'poss') poss = T[i++]; }
    }
    if (isMolto(peek()) && peek(1)?.k === 'adj') return err('Italian puts “molto” + the describing word after the noun: “una casa molto bella”.', i);
    if (peek()?.k === 'adj') {
      const a = peek();
      if (a.pos === 'post') { const n = T.slice(i, i + 3).find(t => t.k === 'noun'); return err(`“${a.e[0]}” goes after the noun in Italian${n ? `: “${itJoin(det?.w, poss?.w, n.w, a.w)}”` : ''}. Only a few words like grande, piccolo, bello and buono can go before it.`, i); }
      pre = a; i++;
    }
    const n = peek();
    if (!n || n.k !== 'noun') return err(det || poss ? `“${(poss || det).w}” comes before a noun, so a noun has to follow it.` : role === 'subj' ? 'Start with who does it: a pronoun like “io” or “lei”, a noun like “il cane”, or just the verb.' : 'A noun (a person, place or thing) should go here.', det || poss ? i - 1 : i);
    i++;
    if (n.cat === 'feel') return err(`“${n.w}” is a feeling. Italian says it with avere and no article: “ho ${n.w}”.`, start);
    // describing word after the noun
    if (isMolto(peek()) || peek()?.k === 'adj') {
      const at = i; if (isMolto(peek())) { molto = true; i++; }
      const a = peek();
      if (!a || a.k !== 'adj') { if (molto) i = at, molto = false; }
      else {
        if (pre) return err('Use one describing word per noun here.', at);
        const w = a.e[itIdx(n.g, n.num)]; if (a.w !== w) return err(`“${a.w}” has to match “${n.w}” (${gName(n.g)} ${nName(n.num)}): use “${w}”.`, i);
        post = a; i++;
        if (peek()?.k === 'adj') return err('Use one describing word per noun here.');
      }
    }
    const famOne = n.fam && n.num === 's' && !pre && !post;
    if (!det && !poss) {
      const bare = (role === 'obj' || role === 'and') && (n.mass || n.num === 'p');
      if (!bare) return err(`Italian needs a word like ${n.num === 'p' ? `“${itWant('il', n.g, 'p', pre ? pre.w : n.w)}” or “${itWant('un', n.g, 'p', pre ? pre.w : n.w)}”` : n.mass ? `“${itWant('part', n.g, 's', pre ? pre.w : n.w)}” or “${itWant('il', n.g, 's', pre ? pre.w : n.w)}”` : `“${itWant('un', n.g, n.num, pre ? pre.w : n.w)}” or “${itWant('il', n.g, n.num, pre ? pre.w : n.w)}”`} before “${n.w}”.`, start);
    }
    if (poss) {
      const w = poss.e[itIdx(n.g, n.num)];
      if (poss.w !== w) return err(`“${poss.w}” has to match “${n.w}” (${gName(n.g)} ${nName(n.num)}): use “${w}”.`, det ? start + 1 : start);
      if (famOne && poss.fam !== 'loro' && det) return err(`With one family member, Italian leaves out the article: “${itJoin(poss.w, n.w)}”, not “${itJoin(det.w, poss.w, n.w)}”.`, start);
      if (!det && !(famOne && poss.fam !== 'loro')) return err(`Italian puts the article before “${poss.w}”: “${itJoin(itWant('il', n.g, n.num, poss.w), poss.w, pre?.w, n.w)}”.${n.fam && n.num === 's' && poss.fam === 'loro' ? ' “loro” always keeps it.' : ''}`, start);
      if (det && !['il', 'un', 'questo', 'quello'].includes(det.fam)) return err(`Use “${itWant('il', n.g, n.num, poss.w)}” before “${poss.w}”: “${itJoin(itWant('il', n.g, n.num, poss.w), poss.w, n.w)}”.`, start);
      if (det && det.fam === 'un' && n.num === 'p') return err(`Use “${itWant('il', n.g, 'p', poss.w)}” before “${poss.w}”: “${itJoin(itWant('il', n.g, 'p', poss.w), poss.w, n.w)}”.`, start);
    }
    if (det) {
      const after = poss ? poss.w : pre ? pre.w : n.w;
      if (det.cls === 'num' && n.num === 's') return err(`“${det.w}” means more than one, so the noun must be plural${n.e[1] ? `: “${det.w} ${n.e[1]}”` : ''}.`, start);
      if (det.fam === 'part' && !n.mass) return err(`You can count “${n.w}”, so say “${itJoin(itWant('un', n.g, n.num, after), after)}” (one) or “${itJoin(itWant('il', n.g, n.num, after), after)}” (the).`, start);
      if (det.fam === 'un' && n.num === 's' && n.mass && n.e[6] !== 2) return err(`You can’t count “${n.w}”, so Italian says “${itJoin(itWant('part', n.g, 's', after), after)}” (some) or just “${n.w}”.`, start);
      if (neg && (det.fam === 'part' || (det.fam === 'un' && n.num === 'p'))) return err(`After “non”, Italian leaves out “${det.w}”: “non … ${itJoin(pre?.w, n.w, post?.w)}”.`, start);
      const want = itWant(det.fam, n.g, n.num, after);
      if (det.w !== want) {
        const why = ['il', 'un', 'part', 'quello'].includes(det.fam) && itV(after) && n.num === 's' ? `“${after}” starts with a vowel sound`
          : ['il', 'un', 'part', 'quello'].includes(det.fam) && itV(after) && n.g === 'm' ? `“${after}” starts with a vowel`
          : ['il', 'un', 'part', 'quello'].includes(det.fam) && itS(after) && n.g === 'm' ? `“${after}” starts with ${/^z/i.test(after) ? 'z' : /^gn/i.test(after) ? 'gn' : /^p/i.test(after) ? 'ps' : 's + a consonant'}`
          : ["l'", "un'", "dell'", "quell'"].includes(det.w) ? `“${det.w}” is only used before a vowel sound, and “${n.w}” is ${gName(n.g)} ${nName(n.num)}`
          : ['lo', 'gli', 'uno', 'dello', 'degli', 'quello', 'quegli'].includes(det.w) ? `“${det.w}” is only used before s + a consonant, z or a vowel, and “${n.w}” is ${gName(n.g)} ${nName(n.num)}`
          : `“${n.w}” is ${gName(n.g)} ${nName(n.num)}`;
        return err(`${cap(why)}, so use “${want}”: “${itJoin(want, poss?.w, pre?.w, n.w)}”.`, start);
      }
    }
    if (pre) { const w = itAdjPre(pre.e, n.g, n.num, n.w); if (pre.w !== w) return err(`“${pre.w}” has to match “${n.w}” (${gName(n.g)} ${nName(n.num)})${['bello', 'buono'].includes(pre.e[0]) ? `; before a noun, ${pre.e[0]} changes like the article` : ''}: use “${w}”.`, i - 2); }
    // di + noun: "il libro di mio fratello", "il cane del ragazzo"
    if (role !== 'of' && (isDiArt(peek()) || (peek()?.k === 'prep' && peek().w === 'di'))) {
      const p = T[i++];
      if (p.w === 'di') {
        if (peek()?.k === 'det' && peek().cls === 'art' && peek().fam === 'il') return err(`Italian joins “di” + “${peek().w}” into “${itContr('di', peek().w)}”: “${itContr('di', peek().w)}${/'$/.test(peek().w) ? '' : ' '}${peek(1)?.w || '…'}”.`, i - 1);
        const o = NP('of'); if (isErr(o)) return o; of = o;
      } else {
        const art = p.art || IT_DET.find(x => x[0] === p.w) && { del: 'il', dello: 'lo', "dell'": "l'", della: 'la', dei: 'i', degli: 'gli', delle: 'le' }[p.w];
        if (peek()?.k === 'det') return err(`“${p.w}” already means “di + ${art}”, so don’t add another article.`);
        const m = peek(); if (!m || m.k !== 'noun') return err(`“${p.w}” needs a noun right after it: “${p.w}${/'$/.test(p.w) ? '' : ' '}ragazzo”.`, i - 1);
        const want = itDef(m.g, m.num, m.w);
        if (art !== want) return err(`“${m.w}” is ${gName(m.g)} ${nName(m.num)}, so “di” + “${want}” = “${itContr('di', want)}”: “${itJoin(itContr('di', want), m.w)}”.`, i - 1);
        i++; of = { det: { w: want, en: 'the', fam: 'il' }, n: m, num: m.num, g: m.g, cat: m.cat };
      }
    }
    return { det, poss, n, pre, post, molto, of, num: n.num, g: n.g, cat: n.cat };
  }
  function NPs(role, neg) {
    const a = NP(role, neg); if (isErr(a)) return a;
    const c = peek();
    if (c?.k === 'conj' && (c.w === 'e' || c.w === 'o') && (['det', 'noun', 'adj'].includes(peek(1)?.k) || isDiArt(peek(1)))) {
      const save = i; i++;
      const b = NP(role === 'obj' ? 'and' : role, neg);
      if (isErr(b) || (role !== 'subj' && ['verb', 'neg', 'pron', 'refl'].includes(peek()?.k))) { i = save; return a; }
      return { coord: [a, b], conj: c, num: 'p', g: a.g === 'm' || b.g === 'm' ? 'm' : 'f', per: 3, cat: a.cat };
    }
    return a;
  }
  // a / in / al / nel… + a place
  function PLACE(p, purpose) {
    const m0 = peek();
    if (!p.art) {
      if (m0?.k === 'det' && m0.fam === 'il') return err(`Italian joins “${p.base}” + “${m0.w}” into “${itContr(p.base, m0.w)}”: “${itContr(p.base, m0.w)}${/'$/.test(m0.w) ? '' : ' '}${peek(1)?.w || '…'}”.`, i - 1);
      if (m0?.k === 'det') return err(`After “${p.w}”, put the place right away: “${p.w} casa”, “${p.w === 'in' ? 'in città' : 'a scuola'}”.`, i);
      const m = m0; if (!m || m.k !== 'noun') return err(`“${p.w}” needs a place after it: “a casa”, “in città”, “al parco”.`, i - 1);
      if (m.cat !== 'place') return err(`“${p.w}” + a place here: “a casa”, “in cucina”, “al parco”. “${m.w}” isn’t a place.`, i);
      if (m.e[7] !== p.w || m.num === 'p') return err(`Italian says “${itPlaceText(m, m.num)}”.`, i - 1);
      i++; return { n: m, num: m.num, g: m.g, cat: m.cat, bare: p.w };
    }
    if (m0?.k === 'det') return err(`“${p.w}” already means “${p.base} + ${p.art}”, so don’t add another article.`);
    const m = m0; if (!m || m.k !== 'noun') return err(`“${p.w}” needs a noun right after it: “${p.base === 'a' ? 'al parco' : 'nel parco'}”.`, i - 1);
    const want = itDef(m.g, m.num, m.w);
    if (p.art !== want) return err(`“${m.w}” is ${gName(m.g)} ${nName(m.num)}${itV(m.w) ? ' and starts with a vowel' : itS(m.w) && m.g === 'm' ? ` and starts with ${/^z/i.test(m.w) ? 'z' : 's + a consonant'}` : ''}, so “${p.base}” + “${want}” = “${itContr(p.base, want)}”: “${itJoin(itContr(p.base, want), m.w)}”.`, i - 1);
    if (m.cat !== 'place') return err(`“${p.w}” + a place here: “al parco”, “nel negozio”. “${m.w}” isn’t a place.`, i);
    // a + the article: only for places you say that way (al parco), or "in the" (nel parco) for where you are
    if (p.base === 'a' && m.e[7] !== 'art') return err(`Italian says “${itPlaceText(m)}”, without the article.`, i - 1);
    if (p.base === 'in' && purpose === 'dest' && m.e[7] !== 'in') return err(`With andare, Italian says “${itPlaceText(m)}”.`, i - 1);
    i++;
    let post = null;
    if (peek()?.k === 'adj') { const a = T[i], w = a.e[itIdx(m.g, m.num)]; if (a.w !== w) return err(`“${a.w}” has to match “${m.w}”: use “${w}”.`); post = a; i++; }
    return { det: { w: want, en: 'the', fam: 'il' }, n: m, num: m.num, g: m.g, cat: m.cat, post, inThe: p.base === 'in' };
  }
  function clause() {
    const C = { lead: [], subj: null, neg: null, mai: null, refl: null, verb: null, comp: null, pps: [], tail: [] }, cStart = i;
    while (peek()?.k === 'adv') { const a = peek(); if (a.pos !== 'edge') return err(`“${a.w}” goes ${a.pos === 'post' ? 'right after the verb' : 'at the end'}, not at the start.`); C.lead.push(T[i++]); }
    if (peek()?.k === 'conj') return err(`“${peek().w}” joins two parts, so it can’t ${i === 0 ? 'start the sentence' : 'go here'}.`);
    if (peek()?.k === 'pron') { const p = T[i++]; C.subj = { pron: p, f: p.f, num: p.num, g: p.g }; }
    else if (['det', 'noun', 'adj'].includes(peek()?.k) || isMolto(peek()) && peek(1)?.k === 'adj' || isDiArt(peek())) { const s = NPs('subj'); if (isErr(s)) return s; C.subj = s.coord ? { np: s, f: 5, num: 'p', g: s.g } : { np: s, f: s.num === 'p' ? 5 : 2, num: s.num, g: s.g }; }
    if (peek()?.k === 'pas') return err(`“mai” goes after the verb, and “non” goes before it: “non mangio mai”.`);
    if (peek()?.k === 'neg') { C.neg = T[i++]; if (!['verb', 'refl'].includes(peek()?.k)) return err('“non” goes right before the verb: “non mangio”.', i - 1); }
    if (peek()?.k === 'refl') {
      const at = i; C.refl = T[i++];
      if (peek()?.k === 'neg') return err(`“non” goes before “${C.refl.w}”: “non mi alzo”.`, i);
      if (peek()?.k !== 'verb') return err(`“${C.refl.w}” goes right before a verb, like “${C.refl.w} alzo”.`, at);
    }
    const v = peek(), sText = C.subj ? (C.subj.pron ? C.subj.pron.w : npText(C.subj.np)) : '';
    if (!v) return err(C.subj ? 'Now add a verb (an action word like “mangia” or “è”).' : 'Every sentence needs a verb.');
    if (v.k !== 'verb') {
      if (v.k === 'pron' && C.subj) return err('A sentence has only one subject (who does it).');
      if (v.k === 'adv') return err(`“${v.w}” goes ${v.pos === 'post' ? 'right after the verb' : v.pos === 'end' ? 'at the end' : 'at the start or the end'}.`);
      return err(`After ${C.subj ? `“${sText}”` : 'that'} the next word should be a verb. “${v.w}” isn’t a verb.`);
    }
    i++; C.verb = v;
    const f = C.subj ? C.subj.f : v.f, reflAt = C.refl ? i - 2 : -1;
    C.f = f;
    if (v.e[8] && !C.refl) return err(`“${v.e[0]}” needs “${IT_REFL[f]}” right before the verb: “${IT_REFL[f]} ${v.e[1][f]}”.`, i - 1);
    if (C.refl && !v.e[8]) return err(`“${C.refl.w}” only goes with verbs like “alzarsi”. Take it out: just “${v.w}”.`, reflAt);
    if (C.subj && v.w !== v.e[1][f]) return err(`“${v.w}” doesn’t match the subject “${sText}”. Use “${v.e[1][f]}”.`, i - 1);
    if (C.refl && C.refl.w !== IT_REFL[f]) return err(`“${C.refl.w}” doesn’t match “${v.w}”. Use “${IT_REFL[f]} ${v.w}”.`, reflAt);
    if (C.subj?.np && v.type !== 'essere') for (const part of C.subj.np.coord || [C.subj.np]) {
      const c = part.cat, what = part.num === 'p' || part.n.mass ? part.n.en : (/^[aeiou]/i.test(part.n.en) ? 'an ' : 'a ') + part.n.en;
      if (c !== 'person' && c !== 'animal') return err(`That doesn’t make sense: ${what} can’t ${v.e[5]}. Use a person or an animal here.`, cStart);
      if (c === 'animal' && v.e[7] === 'p') return err(`That doesn’t make sense: ${what} can’t ${v.e[5]}. Only people ${v.e[5]}.`, cStart);
    }
    // non … mai: around the verb
    if (peek()?.k === 'pas') { if (!C.neg) return err(`Italian puts “non” before the verb too: “${itJoin('non', C.refl?.w, v.w)} mai”.`, i); C.mai = T[i++]; }
    while ((peek()?.k === 'adv' && peek().pos === 'post') || (isMolto(peek()) && peek(1)?.k !== 'adj')) { const a = T[i++]; C.tail.push(a.k === 'adv' ? a : { ...a, k: 'adv', pos: 'post', en: 'a lot' }); }
    const neg = !!C.neg, nx = peek(), sNum = C.subj ? C.subj.num : IT_FORM[f][1], sG = C.subj ? C.subj.g : 'x';
    if (v.type === 'essere') {
      if (!nx || nx.k === 'conj') return err(`“${v.w}” needs something after it: a describing word (“${v.w} ${sNum === 'p' ? 'stanchi' : 'stanco'}”) or a place (“a casa”).`, i - 1);
      if (nx.k === 'adj' || isMolto(nx)) {
        let molto = false; if (isMolto(nx)) { molto = true; i++; if (peek()?.k !== 'adj') return err('“molto” goes right before a describing word: “molto grande”.', i - 1); }
        const a = T[i], m = a.e[itIdx('m', sNum)], fem = a.e[itIdx('f', sNum)];
        if (sG === 'x' ? ![m, fem].includes(a.w) : a.w !== a.e[itIdx(sG, sNum)]) return err(`“${a.w}” has to match the subject (${sG === 'x' ? '' : gName(sG) + ' '}${nName(sNum)}): use “${sG === 'f' ? fem : m}”${sG === 'x' && fem !== m ? ` or “${fem}”` : ''}.`);
        i++; C.comp = { adj: a, molto };
      } else if (nx.k === 'noun' && nx.cat === 'feel') return err(`Italian says this with avere, not essere: “${['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'][f]} ${nx.w}” (literally “have ${nx.e[4] === 'hungry' ? 'hunger' : nx.e[4] === 'thirsty' ? 'thirst' : nx.e[4] === 'sleepy' ? 'sleep' : nx.e[4] === 'scared' ? 'fear' : nx.e[4]}”).`);
      else if (['det', 'noun'].includes(nx.k)) return err(`After “${v.w}”, put a describing word (“${sNum === 'p' ? 'contenti' : 'contento'}”) or a place (“a casa”, “al parco”).`);
      else if (!(nx.k === 'prep' && (['a', 'in'].includes(nx.w) || ['a', 'in'].includes(nx.base))) && !(nx.k === 'adv' && nx.w === 'qui')) return err(`After “${v.w}”, put a describing word or a place (“a scuola”, “in cucina”).`);
    } else if (v.type === 'avere') {
      if (nx?.k === 'noun' && nx.cat === 'feel') { i++; C.comp = { feel: nx }; }
      else if (nx?.k === 'det' && peek(1)?.k === 'noun' && peek(1).cat === 'feel') return err(`No article here: Italian says “${v.w} ${peek(1).w}”.`);
      else if (nx && (['det', 'noun', 'adj'].includes(nx.k) || isDiArt(nx))) { const np = NPs('obj', neg); if (isErr(np)) return np; C.comp = { np }; }
      else return err(`“${v.w}” needs something after it: “${v.w} un cane”, “${v.w} fame”.`, i - 1);
    } else if (v.type === 'andare') {
      if (!nx || nx.k !== 'prep' || !(['a', 'in'].includes(nx.w) || (nx.art && ['a', 'in'].includes(nx.base)))) return err(`“${v.w}” (go) needs where you go: “${v.w} a scuola”, “${v.w} in città” or “${v.w} al parco”.`, nx ? i : i - 1);
      i++; const np = PLACE(nx, 'dest'); if (isErr(np)) return np;
      C.comp = { dest: np, p: nx };
    } else if (v.type === 'tr') {
      if (nx?.k === 'prep' && (nx.w === 'a' || nx.base === 'a') && ['det', 'noun'].includes(peek(1)?.k || (nx.art ? 'det' : ''))) {
        const n2 = T.slice(i + 1, i + 4).find(t => t.k === 'noun');
        if (n2 && ['person', 'animal'].includes(n2.cat)) return err(`Italian doesn’t put “a” before the person or animal you ${v.e[5]}: “${v.w} ${nx.art ? itJoin(itDef(n2.g, n2.num, n2.w), n2.w) : T.slice(i + 1, T.indexOf(n2) + 1).map(t => t.w).join(' ')}”.`, i);
      }
      if (nx && (['det', 'noun', 'adj'].includes(nx.k) || isDiArt(nx))) {
        const np = NPs('obj', neg); if (isErr(np)) return np;
        for (const p of np.coord || [np]) if (v.e[3][0] === 'open' ? !IT_OPENABLE.includes(p.n.e[0]) : v.e[3][0] !== '*' && !v.e[3].includes(p.cat)) return err(`That doesn’t make sense: you can’t ${v.e[5]} ${p.num === 'p' || p.n.mass ? p.n.en : (/^[aeiou]/i.test(p.n.en) ? 'an ' : 'a ') + p.n.en}. “${v.e[0]}” goes with ${v.e[3].map(c => IT_KIND[c]).join(', ')}.`);
        C.comp = { np };
      } else if (v.e[4]) return err(`“${v.w}” needs something after it. What do you ${v.e[5]}? For example “${v.w} ${{ food: 'una mela', drink: "l'acqua", read: 'un libro', thing: 'una palla', place: 'la città', animal: 'un cane', person: 'mio fratello', open: 'la porta', '*': 'un libro' }[v.e[3][0]]}”.`, i - 1);
    } else if (nx && ['det', 'noun', 'adj'].includes(nx.k)) return err(`“${v.e[0]}” (to ${v.e[5]}) doesn’t take an object. You can add a place: “${v.w} al parco”, or a person: “${v.w} con mio fratello”.`);
    // a / in / al / nel + a place, con + someone, per + someone, a + a person you talk to
    while (peek()?.k === 'prep') {
      const p = T[i++];
      if (p.base === 'di') return err('“di” joins two nouns: “il libro di mio fratello”. It needs a noun right before it.', i - 1);
      if (v.type === 'andare' && ['a', 'in'].includes(p.base)) return err('Say where you go only once.', i - 1);
      let np;
      if (['a', 'in'].includes(p.base)) {
        const n2 = T.slice(i, i + 3).find(t => t.k === 'noun');
        if (p.base === 'a' && v.e[0] === 'parlare' && n2 && n2.cat === 'person') { if (p.art) { const m = peek(); if (m?.k !== 'noun') return err(`“${p.w}” already has the article in it.`); const want = itDef(m.g, m.num, m.w); if (p.art !== want) return err(`“${m.w}” is ${gName(m.g)} ${nName(m.num)}, so use “${itContr('a', want)}”.`, i - 1); i++; np = { det: { w: want, en: 'the', fam: 'il' }, n: m, num: m.num, g: m.g, cat: m.cat }; } else { np = NP('pp'); if (isErr(np)) return np; } np.to = true; }
        else { np = PLACE(p, 'loc'); if (isErr(np)) return np; }
      } else { np = NP('pp'); if (isErr(np)) return np; }
      C.pps.push({ p, np });
    }
    while (peek()?.k === 'adv' && peek().pos !== 'post') C.tail.push(T[i++]);
    if (v.type === 'essere' && !C.comp && !C.pps.length && !C.tail.some(a => a.w === 'qui')) return err(`“${v.w}” needs something after it: a describing word (“contento”) or a place (“a casa”).`, i - 1);
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
    return err(x.k === 'adj' ? `“${x.w}” needs to go next to the noun it describes.` : x.k === 'det' ? `“${x.w}” needs its noun right after it, in the right place.` : x.k === 'verb' ? 'One verb per sentence part. Use “e” or “ma” to add another.'
      : x.k === 'pron' ? 'The subject (who does it) goes at the start. To add another sentence, use “e” first.' : x.k === 'neg' ? '“non” goes right before the verb.' : x.k === 'pas' ? '“mai” goes right after the verb, with “non” before the verb.'
      : x.k === 'int' ? '“molto” goes right before a describing word, or right after the verb.' : x.k === 'refl' ? `“${x.w}” goes right before its verb.` : x.k === 'prep' ? `“${x.w}” needs a noun after it, in the right place.` : `“${x.w}” doesn’t fit here.`);
  }
  return { ok: true, P };
}

/* English meaning of a correct Italian sentence */
function itEnglish(P) {
  const an = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
  const npEn = np => {
    if (np.coord) return np.coord.map(npEn).join(np.conj?.w === 'o' ? ' or ' : ' and ');
    const a = np.pre || np.post, adj = a ? (np.molto ? 'very ' : '') + a.e[4] + ' ' : '', noun = np.n.en, d = np.det;
    let art = '';
    if (np.poss) art = np.poss.en + ' ';
    else if (d) art = d.fam === 'il' ? 'the ' : d.fam === 'un' ? (np.num === 'p' ? 'some ' : an(adj || noun) + ' ') : d.fam === 'part' ? 'some ' : d.en + ' ';
    const base = art + adj + noun;
    if (np.of) { const o = np.of; return ['person', 'animal'].includes(o.n.cat) && (!d || d.fam === 'il') && !np.poss ? `${npEn(o)}'s ${adj}${noun}` : `${base} of ${npEn(o)}`; }
    return base;
  };
  const placeEn = (np, dest) => {
    const w = np.n.e[0];
    if (np.bare) {
      if (w === 'casa') return dest ? 'home' : 'at home';
      if (w === 'città') return dest ? 'to town' : 'in town';
      if (w === 'scuola') return dest ? 'to school' : 'at school';
      if (w === 'chiesa') return dest ? 'to church' : 'at church';
      return (dest ? 'to the ' : w === 'cucina' || w === 'ufficio' ? 'in the ' : 'at the ') + np.n.en;
    }
    return (dest ? 'to ' : np.inThe ? 'in ' : 'at ') + npEn(np);
  };
  const one = C => {
    const v = C.verb, f = C.f;
    let subj = C.subj ? (C.subj.pron ? C.subj.pron.en : npEn(C.subj.np)) : ['I', 'you', 'he/she', 'we', 'you', 'they'][f];
    if (!C.subj && f === 2 && C.comp?.adj) { const a = C.comp.adj; if (a.w === a.e[1] && a.e[0] !== a.e[1]) subj = 'she'; else if (a.w === a.e[0] && a.e[0] !== a.e[1]) subj = 'he'; }
    const third = f === 2 || (C.subj?.np && C.subj.num === 's'), never = !!C.mai;
    // "always" and "often" go before the verb in English; "well" and "a lot" go at the end
    const how = C.tail.filter(x => x.pos === 'post'), freq = how.filter(a => ['sempre', 'spesso'].includes(a.w)).map(a => a.en).join(' '), endAdv = how.filter(a => !['sempre', 'spesso'].includes(a.w)).map(a => a.en);
    let vp;
    if (v.type === 'essere' || C.comp?.feel) {
      const be = f === 0 ? 'am' : third ? 'is' : 'are';
      const what = C.comp?.adj ? (C.comp.molto ? 'very ' : '') + C.comp.adj.e[4] : C.comp?.feel ? C.comp.feel.e[4] : '';
      vp = `${be}${never ? ' never' : C.neg ? ' not' : ''}${freq ? ' ' + freq : ''} ${what}`;
    } else {
      const base = v.e[5], s3 = v.e[6];
      vp = never ? `never ${third ? s3 : base}` : C.neg ? `${third ? 'does' : 'do'} not${freq ? ' ' + freq : ''} ${base}` : `${freq ? freq + ' ' : ''}${third ? s3 : base}`;
      if (C.comp?.np) vp += ' ' + npEn(C.comp.np);
      if (C.comp?.dest) vp += ' ' + placeEn(C.comp.dest, true);
    }
    if (endAdv.length) vp += ' ' + endAdv.join(' ');
    for (const { p, np } of C.pps) vp += ' ' + (p.w === 'con' ? 'with ' + npEn(np) : p.w === 'per' ? 'for ' + npEn(np) : np.to ? 'to ' + npEn(np) : placeEn(np, false));
    const tail = [...C.lead.map(a => a.en), ...C.tail.filter(a => a.pos !== 'post').map(a => a.en)].join(' ');
    return `${subj} ${vp}${tail ? ' ' + tail : ''}`.replace(/\s+/g, ' ').trim();
  };
  let s = one(P.clauses[0]);
  P.conjs.forEach((c, k) => { s += (c.w === 'e' ? ', and ' : c.w === 'ma' ? ', but ' : ', or ') + one(P.clauses[k + 1]); });
  return s[0].toUpperCase() + s.slice(1) + '.';
}

/* ---------------- making an Italian tray ---------------- */
function itGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = list => { const fav = list.filter(x => pref.has(x[0]) || (typeof x[1] === 'string' && pref.has(x[1]))); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const nounOf = cats => RP(IT_NOUN.filter(n => n[3] !== 'feel' && (cats[0] === '*' || cats.includes(n[3]) || (cats[0] === 'open' && IT_OPENABLE.includes(n[0])))));
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
  const adjFor = cat => RP(IT_ADJ.filter(a => !cat || a[5].includes(CAT[cat] || 'p')));
  const extra = [];
  const other = list => { const x = list.filter(Boolean); return x.length ? R(x) : null; };
  // a noun phrase with a determiner that fits (and a look-alike as a distractor)
  const np = (n, num, out, opts = {}) => {
    const g = n[2], mass = !!n[6], fam1 = !!n[8] && num === 's';
    let fam;
    if (opts.neg) fam = R(mass || num === 'p' ? ['il', 'bare'] : ['il', 'un']);
    else if (num === 'p') fam = R(['il', 'il', 'un', 'poss', 'questo', 'quello', 'due', 'tre', ...(opts.obj ? ['bare'] : [])]);
    else if (mass) fam = R(['part', 'part', 'il', 'poss', 'questo', ...(opts.obj ? ['bare', 'bare'] : [])]);
    else fam = R(['il', 'il', 'un', 'un', 'poss', 'poss', 'questo', 'quello']);
    if (opts.subj && (fam === 'part' || fam === 'bare')) fam = 'il';
    if (fam1 && coin(0.5)) fam = 'poss';
    const a = opts.adj !== false && coin(0.35) ? adjFor(n[3]) : null, molto = a && coin(0.2);
    const before = a && a[6] === 'both' && !molto && coin(0.5);
    const nw = num === 'p' ? n[1] : n[0], aw = a ? (before ? itAdjPre(a, g, num, nw) : a[itIdx(g, num)]) : null;
    let after = before ? aw : nw;
    if (fam === 'poss') {
      const row = R(IT_POSS), pw = row[itIdx(g, num)], noArt = fam1 && !a && row[0] !== 'loro';
      if (!noArt) { const d = itWant('il', g, num, pw); out.push(itDetW(d)); }
      else extra.push(itDetW(itWant('il', g, num, pw)));
      out.push(itPossW(row, pw)); const wrongP = other(row.slice(0, 4).filter(x => x !== pw)); if (wrongP) extra.push(itPossW(row, wrongP));
    } else if (fam !== 'bare') {
      const d = itWant(fam, g, num, after);
      out.push(itDetW(d)); const wrong = other(IT_DET.filter(x => x[1] === fam && x[0] !== d).map(x => x[0])); if (wrong) extra.push(itDetW(wrong));
    }
    if (before) out.push(itAdj(a, aw));
    out.push(itNoun(n, num));
    if (a && !before) { if (molto) out.push(itMolto()); out.push(itAdj(a, aw)); }
    if (a) extra.push(itAdj(a, a[itIdx(g === 'm' ? 'f' : 'm', num === 's' ? 'p' : 's')]));
    if (opts.of && fam !== 'poss' && coin(0.25)) { const o = nounOf(['person']);
      if (o[8] && coin(0.6)) { const row = R(IT_POSS.filter(r => r[0] !== 'loro')); out.push(itPrep('di'), itPossW(row, row[itIdx(o[2], 's')]), itNoun(o, 's')); }
      else { const art = itDef(o[2], 's', o[0]); out.push(itPrep(itContr('di', art)), itNoun(o, 's')); extra.push(itPrep('di'), itDetW(art)); } }
  };
  // a / in / al + a place: a casa, in città, al parco
  const toPlace = (out, n, loc) => {
    if (n[7] === 'a' || n[7] === 'in') { out.push(itPrep(n[7]), itNoun(n, 's')); extra.push(itPrep(n[7] === 'a' ? 'in' : 'a'), itDetW(itDef(n[2], 's', n[0]))); }
    else if (loc && coin(0.3)) { out.push(itPrep(itContr('in', itDef(n[2], 's', n[0]))), itNoun(n, 's')); extra.push(itPrep('in')); }
    else { out.push(itPrep(itContr('a', itDef(n[2], 's', n[0]))), itNoun(n, 's')); extra.push(itPrep('a'), itDetW(itDef(n[2], 's', n[0]))); }
  };
  const clause = () => {
    const out = [], kind = R(['tr', 'tr', 'tr', 'in', 'essere', 'essere', 'avere', 'andare', 'refl']);
    const verb = kind === 'essere' ? IT_VERB.find(v => v[0] === 'essere') : kind === 'andare' ? IT_VERB.find(v => v[0] === 'andare') : kind === 'avere' ? IT_VERB.find(v => v[0] === 'avere')
      : kind === 'refl' ? RP(IT_VERB.filter(v => v[8])) : RP(IT_VERB.filter(v => v[2] === kind && !v[8]));
    const subjKinds = verb[7] === 'p' ? ['person'] : ['person', 'animal'];
    let f, g = 'x', subjCat = 'person';
    const r0 = Math.random();
    if (r0 < 0.35) { const p = R(IT_PRON); f = p[1]; g = p[2]; out.push(itPron(p)); extra.push(itPronW(R(['io', 'tu', 'noi', 'loro'].filter(x => x !== p[0])))); }
    else if (r0 < 0.55) { f = Math.floor(Math.random() * 6); if (f === 5 && verb[0] === 'essere') f = 4; }   // no subject: the verb says who (sono could be io or loro)
    else {
      const n = nounOf(subjKinds); g = n[2]; subjCat = n[3]; const num = n[1] && coin(0.3) ? 'p' : 's';
      np(n, num, out, { subj: true, of: true }); f = num === 'p' ? 5 : 2;
      if (coin(0.12)) { const n2 = nounOf(subjKinds); out.push(itConj('e')); np(n2, 's', out, { subj: true, adj: false }); f = 5; g = g === 'm' || n2[2] === 'm' ? 'm' : 'f'; }
    }
    const neg = kind !== 'essere' && coin(0.22) ? R(['non', 'non', 'mai']) : kind === 'essere' && coin(0.12) ? 'non' : null;
    const refl = verb[8] ? IT_REFL[f] : null;
    if (neg) { out.push(itNon()); }
    if (refl) { out.push(itRefl(refl, f)); extra.push(itRefl(R(IT_REFL.filter(x => x !== refl)), f)); }
    out.push(itVerb(verb, f)); extra.push(itVerb(verb, (f + 1 + Math.floor(Math.random() * 5)) % 6));
    if (neg === 'mai') out.push(itMai());
    if (kind === 'essere') {
      const gg = g === 'x' ? R(['m', 'f']) : g, num = IT_FORM[f][1];
      if (coin(0.7)) { if (coin(0.25)) out.push(itMolto()); const a = adjFor(subjCat); out.push(itAdj(a, a[itIdx(gg, num)])); extra.push(itAdj(a, a[itIdx(gg === 'm' ? 'f' : 'm', num === 's' ? 'p' : 's')]), itVerb(IT_VERB.find(v => v[0] === 'avere'), f)); }
      else toPlace(out, nounOf(['place']), true);
    } else if (kind === 'avere') {
      if (coin(0.35)) { out.push(itNoun(R(IT_NOUN.filter(n => n[3] === 'feel')), 's')); extra.push(itVerb(IT_VERB.find(v => v[0] === 'essere'), f)); }
      else { const n = nounOf(['*']), on = n[1] && coin(0.3) ? 'p' : 's'; np(n, on, out, { neg: !!neg, of: true, obj: true }); }
    } else if (kind === 'andare') {
      toPlace(out, nounOf(['place']), false);
      if (coin(0.3)) { out.push(itPrep('con')); np(nounOf(['person']), 's', out, { adj: false }); }
    } else if (kind === 'tr') {
      const n = nounOf(verb[3]), on = n[1] && coin(0.3) ? 'p' : 's';
      np(n, on, out, { neg: !!neg, of: true, obj: true });
      if (['person', 'animal'].includes(n[3])) extra.push(itPrep('a'));
      if (coin(0.2)) { out.push(itPrep(R(['con', 'per']))); np(nounOf(['person']), 's', out, { adj: false }); }
      else if (coin(0.15)) toPlace(out, nounOf(['place']), true);
      extra.push(itNoun(nounOf(['*']), 's'));
    } else {
      const r = Math.random();
      if (r < 0.4) toPlace(out, nounOf(['place']), true);
      else if (r < 0.65) { out.push(itPrep('con')); np(nounOf(['person', 'animal']), 's', out, { adj: false }); }
      else if (r < 0.75 && verb[0] === 'parlare') { out.push(itPrep('con')); np(nounOf(['person']), 's', out, { adj: false }); }
    }
    if (coin(0.2) && kind !== 'essere' && neg !== 'mai') out.push(itAdv(R(IT_HOW_VERBS.test(verb[0]) && kind !== 'tr' ? ['sempre', 'spesso', 'bene', 'molto'] : ['sempre', 'spesso'])));   // placed by the fix-up below
    if (coin(0.22)) out.push(itAdv(R(IT_ADV.filter(x => x[2] === 'edge' || x[2] === 'end'))[0]));
    // a "post" adverb belongs right after the verb (after mai)
    const pi = out.findIndex(c => c?.k === 'adv' && c.pos === 'post');
    if (pi >= 0) { const [a] = out.splice(pi, 1); const vi = out.findIndex(c => c?.k === 'verb'), at = out[vi + 1]?.k === 'pas' ? vi + 2 : vi + 1; out.splice(at, 0, a); }
    return out;
  };
  for (let tries = 0; tries < 120; tries++) {
    extra.length = 0;
    let words = clause(); if (!words || words.includes(null)) continue;
    if (Math.random() < 0.25) { const c2 = clause(); if (c2 && !c2.includes(null)) words = [...words, itConj(R(['e', 'e', 'ma', 'o'])), ...c2]; }
    if (words.length > 14 || words.length < 2) continue;
    const res = itCheck(words); if (!res.ok) continue;
    extra.push(itPronW(R(['io', 'lui', 'lei', 'noi', 'voi', 'loro'])), itPrep(R(['a', 'in', 'con', 'di'])));
    if (!words.some(w => w.k === 'conj')) extra.push(itConj(R(['e', 'ma'])));
    if (!words.some(w => w.k === 'neg')) extra.push(itNon(), itMai());
    // one chip per spelling, so the tray never shows two "del" or two "molto"
    const seen = new Set(words.map(w => w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && !seen.has(x.w)) { seen.add(x.w); uniq.push(x); }
    return { words, extra: uniq.slice(0, Math.max(4, 16 - words.length)), english: itEnglish(res.P) };
  }
  return null;
}

BLD_LANGS.it = { name: 'Italian', check: itCheck, gen: itGenerate, voice: 'it-IT', english: itEnglish };
BLD_ORDER.it = { rows: [
    ['A basic sentence', [['det', 'determiner'], ['noun', 'noun'], ['adj', '(adjective)'], ['verb', 'verb'], ['det', 'determiner'], ['noun', 'noun'], ['adj', '(adjective)']]],
    ['No subject needed', [['verb', 'verb'], ['det', 'determiner'], ['noun', 'noun']]],
    ['My, your… (il mio libro)', [['det', 'il / la'], ['det', 'mio / mia'], ['noun', 'noun'], ['verb', 'verb']]],
    ['Saying what something is like (essere)', [['det', 'determiner'], ['noun', 'noun'], ['verb', 'essere'], ['adv', '(molto)'], ['adj', 'adjective']]],
    ['A negative sentence', [['pron', '(pronoun)'], ['adv', 'non'], ['verb', 'verb'], ['adv', '(mai)'], ['noun', 'noun']]],
    ['A verb like alzarsi', [['pron', '(pronoun)'], ['pron', 'mi / ti / si'], ['verb', 'verb']]],
    ['Going somewhere', [['pron', '(pronoun)'], ['verb', 'andare'], ['prep', 'a / in / al'], ['noun', 'place']]],
    ['Joining two sentences', [['verb', 'sentence'], ['conj', 'conjunction'], ['verb', 'sentence']]],
  ], tips: [
    ['pron', 'The verb already says who: <b>mangio</b> = I eat. Add <b>io</b>, <b>lei</b>… only when you want to.'],
    ['adj', 'Most adjectives come <b>after</b> the noun. A few go before or after: grande, piccolo, bello, buono, nuovo, vecchio, giovane. Before the noun: <b>bel</b> ragazzo, <b>buon</b> amico.'],
    ['det', '<b>il / un</b> for most masculine words, <b>lo / uno / gli</b> before s + consonant, z, gn, ps (lo zaino), <b>l\'</b> before a vowel (l\'amico, un\'amica).'],
    ['det', 'My, your… come with the article: <b>il mio libro</b>, <b>la tua casa</b>. One family member drops it: <b>mia madre</b>, <b>tuo fratello</b>.'],
    ['adv', '<b>non</b> goes right before the verb (and before mi / ti / si). Never: <b>non</b> mangio <b>mai</b>.'],
    ['adv', '<b>sempre</b>, <b>spesso</b>, <b>bene</b> and <b>molto</b> go right after the verb. <b>molto</b> also goes right before an adjective: molto bello.'],
    ['prep', '<b>a + il = al</b>, <b>in + il = nel</b>, <b>di + il = del</b>. Places: <b>a casa</b>, <b>a scuola</b>, <b>in città</b>, <b>in cucina</b>, <b>al parco</b>.'],
    ['noun', 'Feelings use avere: <b>ho fame</b>, <b>ho sete</b>, <b>ho freddo</b>, <b>ho sonno</b>.'] ] };

/* ---------------- Your own Italian words (📚 Add my deck's words) ---------------- */
// Present tense of common irregular verbs: io, tu, lui/lei, noi, voi, loro
const IT_IRREG_FORMS = {
  essere: 'sono sei è siamo siete sono', avere: 'ho hai ha abbiamo avete hanno', andare: 'vado vai va andiamo andate vanno', fare: 'faccio fai fa facciamo fate fanno',
  dire: 'dico dici dice diciamo dite dicono', potere: 'posso puoi può possiamo potete possono', volere: 'voglio vuoi vuole vogliamo volete vogliono',
  dovere: 'devo devi deve dobbiamo dovete devono', sapere: 'so sai sa sappiamo sapete sanno', venire: 'vengo vieni viene veniamo venite vengono',
  tenere: 'tengo tieni tiene teniamo tenete tengono', uscire: 'esco esci esce usciamo uscite escono', stare: 'sto stai sta stiamo state stanno',
  dare: 'do dai dà diamo date danno', bere: 'bevo bevi beve beviamo bevete bevono', rimanere: 'rimango rimani rimane rimaniamo rimanete rimangono',
  salire: 'salgo sali sale saliamo salite salgono', scegliere: 'scelgo scegli sceglie scegliamo scegliete scelgono', togliere: 'tolgo togli toglie togliamo togliete tolgono',
  morire: 'muoio muori muore moriamo morite muoiono', sedere: 'siedo siedi siede sediamo sedete siedono', piacere: 'piaccio piaci piace piacciamo piacete piacciono',
  tradurre: 'traduco traduci traduce traduciamo traducete traducono', produrre: 'produco produci produce produciamo producete producono', condurre: 'conduco conduci conduce conduciamo conducete conducono',
  porre: 'pongo poni pone poniamo ponete pongono', proporre: 'propongo proponi propone proponiamo proponete propongono', tacere: 'taccio taci tace taciamo tacete tacciono',
  udire: 'odo odi ode udiamo udite odono', apparire: 'appaio appari appare appariamo apparite appaiono', valere: 'valgo vali vale valiamo valete valgono',
  cuocere: 'cuocio cuoci cuoce cuociamo cuocete cuociono', spegnere: 'spengo spegni spegne spegniamo spegnete spengono', raccogliere: 'raccolgo raccogli raccoglie raccogliamo raccogliete raccolgono',
  divenire: 'divengo divieni diviene diveniamo divenite divengono', diventare: 'divento diventi diventa diventiamo diventate diventano', ottenere: 'ottengo ottieni ottiene otteniamo ottenete ottengono',
  mantenere: 'mantengo mantieni mantiene manteniamo mantenete mantengono', contenere: 'contengo contieni contiene conteniamo contenete contengono', riuscire: 'riesco riesci riesce riusciamo riuscite riescono',
};
// -ire verbs that add -isc- (finisco, capisco)
const IT_ISC = /^(finire|capire|preferire|pulire|spedire|costruire|unire|colpire|favorire|gestire|guarire|impedire|obbedire|sparire|suggerire|tradire|restituire|fornire|agire|ferire|stupire|definire|distribuire|contribuire|diminuire|inserire|trasferire|reagire|condire|arrossire|dimagrire|impazzire|ingrandire|istruire|chiarire|garantire|punire|riferire|sostituire|abolire|esaurire|fiorire|percepire|proibire|smarrire|zittire)$/;
const itReflStrip = inf => inf.replace(/(a|e|i)rsi$/, '$1re').replace(/rsi$/, 'rre');
// io, tu, lui, noi, voi, loro: the table first, then the regular patterns (-are, -ere, -ire, -ire with -isc-)
function itConjugate(inf) {
  inf = itReflStrip(String(inf || '').trim());
  if (IT_IRREG_FORMS[inf]) return IT_IRREG_FORMS[inf].split(' ');
  const st = inf.slice(0, -3);
  if (/are$/.test(inf)) {
    const h = /[cg]$/.test(st) ? 'h' : '', i2 = /i$/.test(st) ? '' : 'i';   // cercare → cerchi; studiare → studi, mangiare → mangi
    return [st + 'o', st + h + i2, st + 'a', st + h + i2 + 'amo', st + 'ate', st + 'ano'];
  }
  if (/ere$/.test(inf)) return [st + 'o', st + 'i', st + 'e', st + 'iamo', st + 'ete', st + 'ono'];
  if (/ire$/.test(inf)) return IT_ISC.test(inf) ? [st + 'isco', st + 'isci', st + 'isce', st + 'iamo', st + 'ite', st + 'iscono'] : [st + 'o', st + 'i', st + 'e', st + 'iamo', st + 'ite', st + 'ono'];
  return [inf, inf, inf, inf, inf, inf];
}
// the plural of a noun (a good guess: check the ones that look wrong)
function itPl(w) {
  if (/[àèéìòùy]$|[^aeiou]$/i.test(w)) return w;                    // città, caffè, sport, bar: no change
  if (/ico$/.test(w) && w.length > 5) return w.slice(0, -1) + 'i';  // medico → medici
  if (/[cg]o$/.test(w)) return w.slice(0, -1) + 'hi';               // parco → parchi, lago → laghi
  if (/io$/.test(w)) return w.slice(0, -1);                         // negozio → negozi
  if (/[cg]a$/.test(w)) return w.slice(0, -1) + 'he';               // amica → amiche
  if (/[^aeiou][cg]ia$/.test(w)) return w.slice(0, -2) + 'e';       // arancia → arance, spiaggia → spiagge
  if (/ma$/.test(w)) return w.slice(0, -1) + 'i';                   // problema → problemi
  if (/a$/.test(w)) return w.slice(0, -1) + 'e';
  return w.slice(0, -1) + 'i';                                      // libro → libri, fiore → fiori
}
const itGenderGuess = w => /(ma|ore|ere|ale)$/.test(w) && !/^(mamma|forma|fama|lama|norma|arma|crema|calma|cima|rima|stima|lima|gomma|schiuma|piuma|fiamma|trama|palma)$/.test(w) ? 'm'
  : /(a|zione|sione|tà|tù|ice|ie|si|ite|ione|igine|udine)$/.test(w) ? 'f' : 'm';
function itAdjForms(w) {
  if (/o$/.test(w)) {
    const st = w.slice(0, -1);
    const mp = /ico$/.test(w) && w.length > 5 ? st.slice(0, -1) + 'ci' : /[cg]o$/.test(w) ? st + 'hi' : /io$/.test(w) ? st : st + 'i';
    const fp = /[cg]o$/.test(w) ? st + 'he' : st + 'e';
    return [w, st + 'a', mp, fp];
  }
  if (/e$/.test(w)) return [w, w, w.slice(0, -1) + 'i', w.slice(0, -1) + 'i'];
  return [w, w, w, w];   // blu, rosa, viola: they don't change
}
const IT_BASE = { n: IT_NOUN.length, a: IT_ADJ.length, v: IT_VERB.length };
const itKnown = w => IT_NOUN.slice(0, IT_BASE.n).some(n => n[0] === w || n[1] === w) || IT_VERB.slice(0, IT_BASE.v).some(v => v[0] === w || itReflStrip(v[0]) === itReflStrip(w) || v[1].includes(w))
  || IT_ADJ.slice(0, IT_BASE.a).some(a => a.slice(0, 4).includes(w)) || [IT_PRON, IT_DET, IT_PREP, IT_CONJ, IT_ADV, IT_POSS].some(L => L.some(x => x[0] === w)) || ['non', 'mai', 'molto'].includes(w);
function itApplyMine() {
  IT_NOUN.length = IT_BASE.n; IT_ADJ.length = IT_BASE.a; IT_VERB.length = IT_BASE.v;
  for (const m of S.bldWords || []) {
    if (!m || m.lang !== 'it' || !m.w || !m.en || itKnown(m.w)) continue;
    if (m.k === 'noun') IT_NOUN.push([m.w, m.pl || null, m.g === 'f' ? 'f' : 'm', m.cat || 'thing', m.en, m.pl ? (m.enPl || bldPlEn(m.en)) : null, 0, m.cat === 'place' ? 'art' : null]);
    if (m.k === 'verb' && Array.isArray(m.forms) && m.forms.length === 6) {
      const refl = /rsi$/.test(m.w) ? 1 : 0, type = m.obj === 'in' || refl ? 'in' : 'tr', objs = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read', 'place'];
      IT_VERB.push([m.w, m.forms, type, objs, 0, m.en, bld3sEn(m.en), m.who === 'a' ? 'a' : 'p', refl]);
    }
    if (m.k === 'adj') IT_ADJ.push([...itAdjForms(m.w), m.en, 'patflr', 'post']);
  }
}
// builder.js calls bldApplyMine() when the game starts: add the Italian words to it
if (typeof bldApplyMine === 'function') { const prevApply = bldApplyMine; bldApplyMine = function () { prevApply(); itApplyMine(); }; }
BLD_MINE.it = { name: 'Italian', forms: 'io, tu, lui/lei, noi, voi, loro', nForms: 6, m: 'il (masculine)', f: 'la (feminine)', conj: w => itConjugate(w), pl: w => itPl(w), adj: w => itAdjForms(w),
  known: w => itKnown(w), gender: w => itGenderGuess(w), isVerb: w => /(are|ere|ire|rre|arsi|ersi|irsi|rsi)$/.test(w), refl: w => /rsi$/.test(w),
  parse: s => { let m = s.match(/^(il|lo|la|i|gli|le|un|uno|una)\s+(\p{L}+)$/u); if (m) return { w: m[2], g: /^(la|le|una)$/.test(m[1]) ? 'f' : 'm', art: true };
    m = s.match(/^(l|un)['’](\p{L}+)$/u); if (m) return { w: m[2], art: true, ...(m[1] === 'un' ? { g: 'f' } : {}) };
    return /^\p{L}+$/u.test(s) ? { w: s } : null; },
  intro: 'words with <i>il/la/l\'</i> are nouns, and words like <i>“to …”</i> are verbs). Verb forms are filled in for you, including common irregular verbs (sono, vado, faccio, posso…); check any that look wrong. Verbs ending in “-si” (lavarsi) work too: the game adds “mi / ti / si / ci / vi” before them.' };
