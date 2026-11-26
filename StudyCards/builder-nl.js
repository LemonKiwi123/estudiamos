'use strict';
/* ================= Sentence Builder: Dutch =================
   Every word on the tray is one chip; the checker explains the first mistake it finds.
   Dutch checks: de / het and een (every plural takes de, and words ending in -je are always het-words: het hondje);
   deze / dit, ons / onze; adjective endings (de grote hond, een groot huis, het grote huis); the verb comes second in a
   main sentence (Vandaag speel ik …) and jij after the verb drops the -t (Morgen werk jij); the verb goes to the end after
   omdat / dat (…, omdat ik moe ben), but not after want; verbs that split (opbellen → ik bel je op) stay whole at the end
   (…, omdat ik je opbel); kunnen, willen, moeten, mogen and gaan send the other verb to the end (ik wil water drinken);
   niet and geen (ik heb geen hond, ik zie de hond niet); naar (going) and in / op (being there), naar huis and thuis.
   Loaded after builder.js and builder-ja.js (which adds the "particle" word type that op, mee, af… use). */

/* ---------- the word lists ---------- */
//  word, plural, de / het, kind, English, English plural, extras: mass (1 = can't count, 2 = can also say "een"),
//  fam (family: mijn moeder), p = the preposition for being there (in het park, op het strand), alt = others that work too,
//  bare = no article after these (naar school, op school). dim = a -je word (always het).
const NN = (w, pl, g, cat, en, enPl, x = {}) => ({ w, pl, g, cat, en, enPl, dim: /je$/.test(w), ...x });
const NL_NOUN = [
  NN('man', 'mannen', 'de', 'person', 'man', 'men'), NN('vrouw', 'vrouwen', 'de', 'person', 'woman', 'women'), NN('jongen', 'jongens', 'de', 'person', 'boy', 'boys'),
  NN('meisje', 'meisjes', 'het', 'person', 'girl', 'girls'), NN('kind', 'kinderen', 'het', 'person', 'child', 'children'), NN('vriend', 'vrienden', 'de', 'person', 'friend', 'friends'),
  NN('vriendin', 'vriendinnen', 'de', 'person', 'friend', 'friends'), NN('moeder', 'moeders', 'de', 'person', 'mother', 'mothers', { fam: 1 }), NN('vader', 'vaders', 'de', 'person', 'father', 'fathers', { fam: 1 }),
  NN('broer', 'broers', 'de', 'person', 'brother', 'brothers', { fam: 1 }), NN('zus', 'zussen', 'de', 'person', 'sister', 'sisters', { fam: 1 }), NN('oma', "oma's", 'de', 'person', 'grandma', 'grandmas', { fam: 1 }),
  NN('opa', "opa's", 'de', 'person', 'grandpa', 'grandpas', { fam: 1 }), NN('leraar', 'leraren', 'de', 'person', 'teacher', 'teachers'), NN('dokter', 'dokters', 'de', 'person', 'doctor', 'doctors'),
  NN('student', 'studenten', 'de', 'person', 'student', 'students'), NN('buurman', 'buren', 'de', 'person', 'neighbor', 'neighbors'),
  NN('hond', 'honden', 'de', 'animal', 'dog', 'dogs'), NN('kat', 'katten', 'de', 'animal', 'cat', 'cats'), NN('vogel', 'vogels', 'de', 'animal', 'bird', 'birds'),
  NN('paard', 'paarden', 'het', 'animal', 'horse', 'horses'), NN('muis', 'muizen', 'de', 'animal', 'mouse', 'mice'), NN('vis', 'vissen', 'de', 'animal', 'fish', 'fish'),
  NN('konijn', 'konijnen', 'het', 'animal', 'rabbit', 'rabbits'), NN('hondje', 'hondjes', 'het', 'animal', 'little dog', 'little dogs'), NN('katje', 'katjes', 'het', 'animal', 'kitten', 'kittens'),
  NN('brood', 'broden', 'het', 'food', 'bread', 'loaves of bread', { mass: 2 }), NN('kaas', null, 'de', 'food', 'cheese', null, { mass: 1 }), NN('rijst', null, 'de', 'food', 'rice', null, { mass: 1 }),
  NN('vlees', null, 'het', 'food', 'meat', null, { mass: 1 }), NN('soep', null, 'de', 'food', 'soup', null, { mass: 2 }), NN('chocola', null, 'de', 'food', 'chocolate', null, { mass: 1 }),
  NN('ijs', null, 'het', 'food', 'ice cream', null, { mass: 2 }), NN('appel', 'appels', 'de', 'food', 'apple', 'apples'), NN('banaan', 'bananen', 'de', 'food', 'banana', 'bananas'),
  NN('taart', 'taarten', 'de', 'food', 'cake', 'cakes', { mass: 2 }), NN('ei', 'eieren', 'het', 'food', 'egg', 'eggs'), NN('pizza', "pizza's", 'de', 'food', 'pizza', 'pizzas'),
  NN('koekje', 'koekjes', 'het', 'food', 'cookie', 'cookies'), NN('broodje', 'broodjes', 'het', 'food', 'sandwich', 'sandwiches'), NN('salade', 'salades', 'de', 'food', 'salad', 'salads', { mass: 2 }),
  NN('water', null, 'het', 'drink', 'water', null, { mass: 1 }), NN('melk', null, 'de', 'drink', 'milk', null, { mass: 1 }), NN('koffie', null, 'de', 'drink', 'coffee', null, { mass: 2 }),
  NN('thee', null, 'de', 'drink', 'tea', null, { mass: 2 }), NN('sap', null, 'het', 'drink', 'juice', null, { mass: 2 }),
  NN('boek', 'boeken', 'het', 'read', 'book', 'books'), NN('brief', 'brieven', 'de', 'read', 'letter', 'letters'), NN('krant', 'kranten', 'de', 'read', 'newspaper', 'newspapers'),
  NN('tijdschrift', 'tijdschriften', 'het', 'read', 'magazine', 'magazines'), NN('verhaal', 'verhalen', 'het', 'read', 'story', 'stories'),
  NN('park', 'parken', 'het', 'place', 'park', 'parks', { p: 'in' }), NN('school', 'scholen', 'de', 'place', 'school', 'schools', { p: 'op', alt: ['in'], bare: ['naar', 'op'] }),
  NN('bioscoop', 'bioscopen', 'de', 'place', 'movie theater', 'movie theaters', { p: 'in' }), NN('stad', 'steden', 'de', 'place', 'town', 'towns', { p: 'in' }),
  NN('keuken', 'keukens', 'de', 'place', 'kitchen', 'kitchens', { p: 'in' }), NN('supermarkt', 'supermarkten', 'de', 'place', 'supermarket', 'supermarkets', { p: 'in' }),
  NN('restaurant', 'restaurants', 'het', 'place', 'restaurant', 'restaurants', { p: 'in' }), NN('bibliotheek', 'bibliotheken', 'de', 'place', 'library', 'libraries', { p: 'in' }),
  NN('kantoor', 'kantoren', 'het', 'place', 'office', 'offices', { p: 'op', alt: ['in'] }), NN('station', 'stations', 'het', 'place', 'station', 'stations', { p: 'op' }),
  NN('strand', 'stranden', 'het', 'place', 'beach', 'beaches', { p: 'op' }), NN('markt', 'markten', 'de', 'place', 'market', 'markets', { p: 'op' }),
  NN('dierentuin', 'dierentuinen', 'de', 'place', 'zoo', 'zoos', { p: 'in' }), NN('tuin', 'tuinen', 'de', 'place', 'garden', 'gardens', { p: 'in' }),
  NN('huis', 'huizen', 'het', 'place', 'house', 'houses', { p: 'in' }), NN('café', 'cafés', 'het', 'place', 'café', 'cafés', { p: 'in' }), NN('museum', 'musea', 'het', 'place', 'museum', 'museums', { p: 'in' }),
  NN('auto', "auto's", 'de', 'thing', 'car', 'cars'), NN('tafel', 'tafels', 'de', 'thing', 'table', 'tables'), NN('stoel', 'stoelen', 'de', 'thing', 'chair', 'chairs'),
  NN('telefoon', 'telefoons', 'de', 'thing', 'phone', 'phones'), NN('bal', 'ballen', 'de', 'thing', 'ball', 'balls'), NN('bloem', 'bloemen', 'de', 'thing', 'flower', 'flowers'),
  NN('deur', 'deuren', 'de', 'thing', 'door', 'doors'), NN('raam', 'ramen', 'het', 'thing', 'window', 'windows'), NN('cadeau', 'cadeaus', 'het', 'thing', 'gift', 'gifts'),
  NN('fiets', 'fietsen', 'de', 'thing', 'bike', 'bikes'), NN('tas', 'tassen', 'de', 'thing', 'bag', 'bags'), NN('horloge', 'horloges', 'het', 'thing', 'watch', 'watches'),
  NN('lamp', 'lampen', 'de', 'thing', 'lamp', 'lamps'), NN('computer', 'computers', 'de', 'thing', 'computer', 'computers'), NN('hoed', 'hoeden', 'de', 'thing', 'hat', 'hats'),
  NN('kopje', 'kopjes', 'het', 'thing', 'cup', 'cups'),
  // with hebben and no article: ik heb honger (I'm hungry), ik heb geen tijd (I don't have time)
  NN('honger', null, 'de', 'feel', 'hungry', null, { mass: 1 }), NN('dorst', null, 'de', 'feel', 'thirsty', null, { mass: 1 }), NN('tijd', null, 'de', 'feel', 'time', null, { mass: 1, have: 1 })];
const NL_OPENABLE = ['deur', 'raam', 'boek', 'brief', 'tas', 'krant', 'tijdschrift', 'cadeau', 'bioscoop', 'kantoor', 'café', 'restaurant', 'supermarkt', 'museum', 'bibliotheek'];
//            describes: p people, a animals, f food and drinks, t things, l places, r things you read. attr = the form with -e (null: only after zijn)
const NA = (pred, attr, en, d) => ({ pred, attr, en, d });
const NL_ADJ = [NA('groot', 'grote', 'big', 'patl'), NA('klein', 'kleine', 'small', 'patl'), NA('oud', 'oude', 'old', 'patlr'), NA('nieuw', 'nieuwe', 'new', 'tlr'), NA('goed', 'goede', 'good', 'pafdrl'),
  NA('mooi', 'mooie', 'beautiful', 'patl'), NA('jong', 'jonge', 'young', 'pa'), NA('rood', 'rode', 'red', 'tf'), NA('blauw', 'blauwe', 'blue', 't'), NA('groen', 'groene', 'green', 'tf'),
  NA('zwart', 'zwarte', 'black', 'at'), NA('wit', 'witte', 'white', 'atf'), NA('geel', 'gele', 'yellow', 'tf'), NA('duur', 'dure', 'expensive', 'tfdlr'), NA('goedkoop', 'goedkope', 'cheap', 'tfd'),
  NA('lekker', 'lekkere', 'delicious', 'fd'), NA('koud', 'koude', 'cold', 'fd'), NA('warm', 'warme', 'warm', 'fd'), NA('heet', 'hete', 'hot', 'fd'), NA('vies', 'vieze', 'dirty', 'tl'),
  NA('moe', null, 'tired', 'pa'), NA('bang', null, 'scared', 'pa'), NA('blij', 'blije', 'happy', 'pa'), NA('verdrietig', 'verdrietige', 'sad', 'pa'), NA('aardig', 'aardige', 'nice', 'p'),
  NA('grappig', 'grappige', 'funny', 'pr'), NA('ziek', 'zieke', 'sick', 'pa'), NA('snel', 'snelle', 'fast', 'pat'), NA('interessant', 'interessante', 'interesting', 'r'), NA('saai', 'saaie', 'boring', 'rl'),
  NA('vriendelijk', 'vriendelijke', 'friendly', 'pa'), NA('slim', 'slimme', 'smart', 'pa'), NA('lief', 'lieve', 'sweet', 'pa')];
/* verbs: ik, jij, hij/zij, wij, jullie, zij. t = what kind of verb: tr (takes an object), in (no object), go (needs where
   you go), zijn, worden, hebben, say (can take a dat sentence), modal. part = the part that splits off (op + bellen:
   ik bel je op). who: p = only people do it, a = people and animals. inv = the form when jij comes after the verb. */
const NV = (inf, forms, t, objs, need, en, en3, who, x = {}) => ({ inf, f: forms.split(' '), t, objs, need, en, en3, who, ...x });
const NL_VERB = [
  NV('eten', 'eet eet eet eten eten eten', 'tr', ['food'], 0, 'eat', 'eats', 'a'), NV('drinken', 'drink drinkt drinkt drinken drinken drinken', 'tr', ['drink'], 0, 'drink', 'drinks', 'a'),
  NV('koken', 'kook kookt kookt koken koken koken', 'tr', ['food'], 0, 'cook', 'cooks', 'p'), NV('lezen', 'lees leest leest lezen lezen lezen', 'tr', ['read'], 0, 'read', 'reads', 'p'),
  NV('schrijven', 'schrijf schrijft schrijft schrijven schrijven schrijven', 'tr', ['read'], 0, 'write', 'writes', 'p'),
  NV('kopen', 'koop koopt koopt kopen kopen kopen', 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'buy', 'buys', 'p'),
  NV('verkopen', 'verkoop verkoopt verkoopt verkopen verkopen verkopen', 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'sell', 'sells', 'p'),
  NV('hebben', 'heb hebt heeft hebben hebben hebben', 'hebben', ['person', 'animal', 'food', 'drink', 'read', 'thing', 'place'], 1, 'have', 'has', 'a'),
  NV('zoeken', 'zoek zoekt zoekt zoeken zoeken zoeken', 'tr', ['*'], 1, 'look for', 'looks for', 'a'), NV('zien', 'zie ziet ziet zien zien zien', 'tr', ['*'], 1, 'see', 'sees', 'a'),
  NV('bezoeken', 'bezoek bezoekt bezoekt bezoeken bezoeken bezoeken', 'tr', ['person', 'place'], 1, 'visit', 'visits', 'p'),
  NV('vinden', 'vind vindt vindt vinden vinden vinden', 'tr', ['*'], 1, 'find', 'finds', 'a'), NV('nemen', 'neem neemt neemt nemen nemen nemen', 'tr', ['food', 'drink', 'read', 'thing'], 1, 'take', 'takes', 'p'),
  NV('openen', 'open opent opent openen openen openen', 'tr', ['open'], 1, 'open', 'opens', 'p'), NV('vragen', 'vraag vraagt vraagt vragen vragen vragen', 'tr', ['person'], 1, 'ask', 'asks', 'p'),
  NV('helpen', 'help helpt helpt helpen helpen helpen', 'tr', ['person', 'animal'], 1, 'help', 'helps', 'a'), NV('bedanken', 'bedank bedankt bedankt bedanken bedanken bedanken', 'tr', ['person'], 1, 'thank', 'thanks', 'p'),
  NV('ontmoeten', 'ontmoet ontmoet ontmoet ontmoeten ontmoeten ontmoeten', 'tr', ['person'], 1, 'meet', 'meets', 'p'), NV('dragen', 'draag draagt draagt dragen dragen dragen', 'tr', ['thing'], 1, 'carry', 'carries', 'p'),
  NV('opbellen', 'bel belt belt bellen bellen bellen', 'tr', ['person'], 1, 'call', 'calls', 'p', { part: 'op' }),
  NV('uitnodigen', 'nodig nodigt nodigt nodigen nodigen nodigen', 'tr', ['person'], 1, 'invite', 'invites', 'p', { part: 'uit' }),
  NV('opendoen', 'doe doet doet doen doen doen', 'tr', ['open'], 1, 'open', 'opens', 'p', { part: 'open' }), NV('dichtdoen', 'doe doet doet doen doen doen', 'tr', ['open'], 1, 'close', 'closes', 'p', { part: 'dicht' }),
  NV('opruimen', 'ruim ruimt ruimt ruimen ruimen ruimen', 'tr', ['thing', 'place'], 0, 'tidy up', 'tidies up', 'p', { part: 'op' }),
  NV('spelen', 'speel speelt speelt spelen spelen spelen', 'in', null, 0, 'play', 'plays', 'a'), NV('werken', 'werk werkt werkt werken werken werken', 'in', null, 0, 'work', 'works', 'p'),
  NV('leren', 'leer leert leert leren leren leren', 'in', null, 0, 'study', 'studies', 'p'), NV('wonen', 'woon woont woont wonen wonen wonen', 'in', null, 0, 'live', 'lives', 'a', { loc: 1 }),
  NV('slapen', 'slaap slaapt slaapt slapen slapen slapen', 'in', null, 0, 'sleep', 'sleeps', 'a'), NV('zwemmen', 'zwem zwemt zwemt zwemmen zwemmen zwemmen', 'in', null, 0, 'swim', 'swims', 'a', { move: 1 }),
  NV('zingen', 'zing zingt zingt zingen zingen zingen', 'in', null, 0, 'sing', 'sings', 'a'), NV('dansen', 'dans danst danst dansen dansen dansen', 'in', null, 0, 'dance', 'dances', 'p'),
  NV('praten', 'praat praat praat praten praten praten', 'in', null, 0, 'talk', 'talks', 'p'), NV('wachten', 'wacht wacht wacht wachten wachten wachten', 'in', null, 0, 'wait', 'waits', 'a'),
  NV('blijven', 'blijf blijft blijft blijven blijven blijven', 'in', null, 0, 'stay', 'stays', 'a'), NV('lopen', 'loop loopt loopt lopen lopen lopen', 'in', null, 0, 'walk', 'walks', 'a', { move: 1 }),
  NV('fietsen', 'fiets fietst fietst fietsen fietsen fietsen', 'in', null, 0, 'ride a bike', 'rides a bike', 'p', { move: 1 }),
  NV('opstaan', 'sta staat staat staan staan staan', 'in', null, 0, 'get up', 'gets up', 'a', { part: 'op' }), NV('meekomen', 'kom komt komt komen komen komen', 'in', null, 0, 'come along', 'comes along', 'a', { part: 'mee' }),
  NV('afwassen', 'was wast wast wassen wassen wassen', 'in', null, 0, 'do the dishes', 'does the dishes', 'p', { part: 'af' }),
  NV('gaan', 'ga gaat gaat gaan gaan gaan', 'go', null, 1, 'go', 'goes', 'a'), NV('komen', 'kom komt komt komen komen komen', 'go', null, 0, 'come', 'comes', 'a'),
  NV('zijn', 'ben bent is zijn zijn zijn', 'zijn', null, 1, 'be', 'is', 'a'), NV('worden', 'word wordt wordt worden worden worden', 'worden', null, 1, 'get', 'gets', 'a', { gloss: 'to become / get' }),
  NV('weten', 'weet weet weet weten weten weten', 'say', null, 0, 'know', 'knows', 'p'), NV('denken', 'denk denkt denkt denken denken denken', 'say', null, 0, 'think', 'thinks', 'p'),
  NV('geloven', 'geloof gelooft gelooft geloven geloven geloven', 'say', null, 0, 'believe', 'believes', 'p'), NV('zeggen', 'zeg zegt zegt zeggen zeggen zeggen', 'say', null, 0, 'say', 'says', 'p'),
  // modal verbs: the other verb goes to the end. m = English [I / you…, he / she, with not, he / she with not]
  NV('kunnen', 'kan kunt kan kunnen kunnen kunnen', 'modal', null, 1, 'can', 'can', 'a', { m: ['can', 'can', 'cannot', 'cannot'], inv: ['kun', 'kan'], alt1: ['kan'] }),
  NV('willen', 'wil wilt wil willen willen willen', 'modal', null, 1, 'want', 'wants', 'a', { m: ['want to', 'wants to', 'do not want to', 'does not want to'] }),
  NV('moeten', 'moet moet moet moeten moeten moeten', 'modal', null, 1, 'have to', 'has to', 'a', { m: ['have to', 'has to', 'do not have to', 'does not have to'] }),
  NV('mogen', 'mag mag mag mogen mogen mogen', 'modal', null, 1, 'may', 'may', 'p', { m: ['may', 'may', 'may not', 'may not'], gloss: 'to be allowed to' })];
//            who does it, the object form, English (who does it), English (object), verb form (0 ik … 5 zij)
const NL_PRON = [['ik', 'mij', 'I', 'me', 0], ['jij', 'jou', 'you', 'you', 1], ['hij', 'hem', 'he', 'him', 2], ['zij', 'haar', 'she', 'her', 2],
  ['wij', 'ons', 'we', 'us', 3], ['jullie', 'jullie', 'you', 'you', 4], ['zij', 'hen', 'they', 'them', 5], ['ze', 'ze', 'she', 'her', 2], ['ze', 'ze', 'they', 'them', 5]];
const NL_POSS = [['mijn', 'my'], ['jouw', 'your'], ['zijn', 'his'], ['haar', 'her'], ['ons', 'our'], ['jullie', 'your'], ['hun', 'their']];
//            word, English, kind: time (can start the sentence), freq, graag, how (goed, veel), place (hier, thuis)
const NL_ADV = [['vandaag', 'today', 'time'], ['morgen', 'tomorrow', 'time'], ['nu', 'now', 'time'], ['vroeg', 'early', 'time'], ['vaak', 'often', 'freq'], ['altijd', 'always', 'freq'],
  ['graag', 'like to', 'graag'], ['goed', 'well', 'how'], ['veel', 'a lot', 'how'], ['hier', 'here', 'place'], ['thuis', 'at home', 'place']];
const NL_PREP = [['in', 'in'], ['op', 'on / at'], ['naar', 'to'], ['met', 'with'], ['voor', 'for'], ['zonder', 'without'], ['bij', 'at / near'], ['van', 'of / from']];
const NL_CONJ = [['en', 'and'], ['maar', 'but'], ['of', 'or'], ['want', 'because'], ['omdat', 'because', 1], ['dat', 'that', 1]];
const NL_KIND = { food: 'food', drink: 'drinks', read: 'things you read or write', thing: 'things', place: 'places', animal: 'animals', person: 'people', open: 'things you can open' };
const NL_PARTS = ['op', 'mee', 'af', 'uit', 'open', 'dicht'];
const NL_HOW_VERBS = /^(spelen|werken|leren|slapen|zwemmen|zingen|dansen|praten|koken|eten|lezen|schrijven|lopen|fietsen)$/;   // verbs that go with goed / veel

/* determiners: de / het, een, geen, deze / dit, mijn…, ons / onze, twee, drie */
function nlDet(fam, g, num) {
  if (fam === 'def') return num === 'p' ? 'de' : g;
  if (fam === 'een') return num === 'p' ? null : 'een';
  if (fam === 'geen') return 'geen';
  if (fam === 'dem') return num === 'p' || g === 'de' ? 'deze' : 'dit';
  if (fam === 'ons') return num === 's' && g === 'het' ? 'ons' : 'onze';
  if (fam === 'twee' || fam === 'drie') return num === 'p' ? fam : null;
  return NL_POSS.some(p => p[0] === fam) ? fam : null;
}
const NL_FAMS = ['def', 'een', 'geen', 'dem', 'twee', 'drie', ...NL_POSS.map(p => p[0])];
let NL_DET_READ = null;
function nlDetReads(w) {
  if (!NL_DET_READ) { NL_DET_READ = new Map();
    for (const fam of NL_FAMS) for (const g of ['de', 'het']) for (const num of ['s', 'p']) { const x = nlDet(fam, g, num); if (!x) continue; if (!NL_DET_READ.has(x)) NL_DET_READ.set(x, []); NL_DET_READ.get(x).push({ fam, g, num }); } }
  return NL_DET_READ.get(String(w).toLowerCase()) || [];
}
// the describing word before a noun: -e, except after een / geen / no word for a het-word (een groot huis, geen klein kind)
const nlAdjForm = (a, fam, g, num) => !a.attr ? null : num === 's' && g === 'het' && (!fam || fam === 'een' || fam === 'geen') ? a.pred : a.attr;
const nlNounForm = (n, num) => num === 'p' ? n.pl : n.w;
const nlPronReads = w => { const out = []; for (const r of NL_PRON) { if (r[0] === w) out.push({ r, c: 'nom' }); if (r[1] === w) out.push({ r, c: 'obj' }); } return out; };
const nlPossEn = w => ({ mijn: 'my', jouw: 'your', zijn: 'his', haar: 'her', ons: 'our', onze: 'our', jullie: 'your', hun: 'their' })[w];

/* chips (each one carries its own English for the word tag) */
const nlChip = o => chip({ ...o, gloss: o.gloss || o.en });
const nlPronEn = w => [...new Set(NL_PRON.flatMap(r => [r[0] === w ? r[2] : '', r[1] === w ? r[3] : '']).filter(Boolean))].slice(0, 3).join(' / ');
const nlPronC = w => nlChip({ k: 'pron', w, en: nlPronEn(w) });
const nlFamEn = (fam, w) => ({ def: 'the', een: 'a', geen: 'no', dem: w === 'dit' ? 'this' : 'this / these', twee: 'two', drie: 'three' })[fam] || nlPossEn(w) || '';
const nlDetC = (w, fam) => nlChip({ k: 'det', w, fam, en: nlFamEn(fam, w), cls: ['def', 'een'].includes(fam) ? 'art' : fam });
const nlNounC = (n, num) => nlChip({ k: 'noun', w: nlNounForm(n, num), e: n, num, en: num === 'p' ? n.enPl || n.en : n.en });
const nlAdjC = (a, w) => nlChip({ k: 'adj', w, e: a, en: a.en });
const nlVerbC = (v, x, joined) => nlChip({ k: 'verb', w: (joined ? v.part : '') + (Array.isArray(x) ? x[0] : v.f[x]), e: v, joined: !!joined, en: v.en, gloss: v.gloss || 'to ' + v.en });
const nlInfC = v => nlChip({ k: 'verb', w: v.inf, e: v, inf: true, joined: !!v.part, en: v.en, gloss: v.gloss || 'to ' + v.en });
const nlPartC = v => nlChip({ k: 'part', w: v.part, e: v, en: `(${v.inf})`, gloss: `part of ${v.inf}` });
const nlPrepC = w => nlChip({ k: 'prep', w, en: NL_PREP.find(x => x[0] === w)[1] });
const nlAdvC = w => { const a = NL_ADV.find(x => x[0] === w); return nlChip({ k: 'adv', w, en: a[1], cls: a[2] }); };
const nlNietC = () => nlChip({ k: 'neg', w: 'niet', en: 'not' });
const nlHeelC = () => nlChip({ k: 'int', w: 'heel', en: 'very' });
const nlConjC = w => { const c = NL_CONJ.find(x => x[0] === w); return nlChip({ k: 'conj', w, en: c[1], sub: !!c[2] }); };
const nlVerbByInf = inf => NL_VERB.find(v => v.inf === inf);
// is this verb chip spelled like the infinitive (the wij / jullie / zij form always is)?
const nlAmb = t => t && t.k === 'verb' && t.e && t.w === t.e.inf;
const nlIsModal = v => v.t === 'modal' || v.inf === 'gaan';

/* ---------------- Dutch checker ---------------- */
function nlCheck(T0) {
  const r = nlCheckOnce(T0, false); if (r.ok) return r;
  if (T0.some(t => ['haar', 'zijn', 'ons', 'jullie', 'op'].includes(t.w))) { const r2 = nlCheckOnce(T0, true); if (r2.ok) return r2; }
  return r;
}
function nlCheckOnce(T0, asGiven) {
  // a few words are spelled the same as another kind of word: zijn / haar / ons / jullie before a noun mean his / her / our / your,
  // op at the end is a verb part
  const nounAhead = k => { let j = k + 1; if (T0[j]?.k === 'int') j++; if (T0[j]?.k === 'adj') j++; return T0[j]?.k === 'noun'; };
  const T = T0.map((t, k) => {
    const nx = T0[k + 1] || null;
    if (asGiven && t.k !== 'verb') return t;
    if (t.k === 'part' && t.w === 'op' && nx && ['det', 'noun', 'adj', 'int', 'pron'].includes(nx.k)) return { ...t, k: 'prep', en: 'on / at', e: null };
    if (t.k === 'prep' && NL_PARTS.includes(t.w) && (!nx || ['conj', 'verb', 'neg'].includes(nx.k))) return { ...t, k: 'part', e: null };
    if ((t.k === 'pron' || t.k === 'verb') && ['haar', 'zijn', 'ons', 'jullie'].includes(t.w) && nounAhead(k)) return { ...t, k: 'det', fam: t.w, en: nlPossEn(t.w) };
    if (t.k === 'det' && ['haar', 'ons', 'jullie'].includes(t.w) && !nounAhead(k)) return { ...t, k: 'pron' };
    if (t.k === 'det' && t.w === 'zijn' && !nounAhead(k)) return { ...t, k: 'verb', e: nlVerbByInf('zijn'), joined: false };
    if (t.k === 'verb' && t.e) { const v = t.e, joined = !!(v.part && t.w.startsWith(v.part) && (t.w === v.inf || v.f.some(f => v.part + f === t.w))); return { ...t, joined }; }
    return t;
  });
  let i = 0;
  const err = (msg, at = i) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length }), peek = (o = 0) => T[i + o], isErr = x => x && x.ok === false;
  if (!T.length) return err('Tap some words to build a sentence.');
  const words = (a, b) => T.slice(a, b).map(t => t.w).join(' ');
  const cText = c => c ? (c.k === 'pron' ? c.t.w : words(c.start, c.end)) : '';
  const isVerb = t => t && t.k === 'verb';
  /* a noun phrase: (de / een / mijn…) (heel) (adjective) noun (van mijn broer) */
  function NP(opts = {}) {
    const start = i; let det = null, heel = null, adj = null;
    if (peek()?.k === 'det') det = T[i++];
    if (peek()?.k === 'int') { heel = T[i++]; if (peek()?.k !== 'adj') return err('“heel” (very) goes right before a describing word: “heel groot”.', peek() ? i - 1 : i); }
    if (peek()?.k === 'adj') adj = T[i++];
    const n = peek();
    if (!n || n.k !== 'noun') return err(det ? `“${det.w}” comes before a noun, so a noun has to follow it.` : `“${adj ? adj.w : T[start].w}” describes a noun, so the noun goes right after it.`, !n ? i : det && !adj ? i - 1 : start);
    i++;
    const np = { k: 'np', det, heel, adj, n, start, end: i, num: n.num || (n.e.pl === n.w && n.e.w !== n.w ? 'p' : 's') };
    // whose: "het boek van mijn broer"
    if (!opts.noOf && peek()?.k === 'prep' && peek().w === 'van' && ['det', 'noun', 'adj', 'int', 'pron'].includes(peek(1)?.k)) {
      i++;
      if (peek().k === 'pron') { np.of = { k: 'pron', t: T[i], start: i, end: i + 1 }; i++; }
      else { const o = NP({ noOf: true }); if (isErr(o)) return o; np.of = o; }
      np.end = i;
    }
    return np;
  }
  const npSay = (np, fam0) => { const n = np.n.e, fam = fam0 || np.fam || np.det?.fam;
    const d = np.det ? nlDet(fam, n.g, np.num) || nlDet('def', n.g, np.num) : ''; const a = np.adj ? nlAdjForm(np.adj.e, np.det ? fam : null, n.g, np.num) || np.adj.e.pred : '';
    return [d, np.heel?.w, a, nlNounForm(n, np.num)].filter(Boolean).join(' '); };
  /* is this noun phrase right? de / het, een, deze / dit, ons / onze and the adjective ending */
  function npFix(np) {
    if (np.coord) { for (const p of np.coord) { const e = npFix(p); if (e) return e; } return null; }
    const n = np.n.e, num = np.num, at = np.start, d = np.det;
    let fam = null;
    if (!d) {
      if (num === 's' && !n.mass && !np.bareOK) return err(`Dutch needs a word like “een” or “${n.g}” before “${n.w}”.`, at);
    } else {
      const reads = nlDetReads(d.w), fams = [...new Set(reads.map(r => r.fam))];
      fam = fams.includes(d.fam) ? d.fam : fams[0] || d.fam;
      if (d.w === 'het' && num === 'p') return err(`Every plural takes “de”: “de ${n.pl}”.`, at);
      if (d.w === 'de' && num === 's' && n.g === 'het') return err(`“${n.w}” is a het-word: “het ${n.w}”.${n.dim ? ' Words ending in -je are always het-words.' : ''}`, at);
      if (d.w === 'het' && n.g === 'de') return err(`“${n.w}” is a de-word: “de ${n.w}”.`, at);
      const want = nlDet(fam, n.g, num);
      if (want == null && fam === 'een') return err(`“een” means one. For more than one, leave it out (“${npSay({ ...np, det: null })}”) or say “de ${n.pl}”.`, at);
      if (want == null) return err(`“${d.w}” means more than one, so the noun must be plural${n.pl ? `: “${d.w} ${n.pl}”` : ''}.`, at);
      if (n.mass === 1 && num === 's' && fam === 'een') return err(`You can’t count “${n.w}”, so leave “een” out: just “${n.w}”, or “${n.g} ${n.w}”.`, at);
      if (d.w !== want) {
        if (fam === 'dem') return err(`For ${num === 'p' ? 'plural words' : n.g === 'het' ? 'het-words' : 'de-words'}, say “${want}”: “${want} ${nlNounForm(n, num)}”.`, at);
        if (fam === 'ons') return err(`Before ${num === 'p' ? 'a plural' : n.g === 'het' ? 'a het-word' : 'a de-word'}, “our” is “${want}”: “${want} ${nlNounForm(n, num)}”.`, at);
        return err(`Here it is “${want}”: “${npSay(np, fam)}”.`, at);
      }
    }
    if (np.adj) {
      const want = nlAdjForm(np.adj.e, fam, n.g, num), aAt = T.indexOf(np.adj, at);
      if (want == null) return err(`“${np.adj.e.pred}” only comes after zijn: “… is ${np.adj.e.pred}”.`, aAt);
      if (np.adj.w !== want) return err(want === np.adj.e.pred
        ? `With ${fam === 'een' ? '“een”' : fam === 'geen' ? '“geen”' : 'no word before it'} and a het-word, the describing word has no -e: “${npSay(np, fam)}”.`
        : `Here the describing word ends in -e: “${npSay(np, fam)}”.${num === 's' && n.g === 'het' ? ' Only een, geen or no word + a het-word leave the -e off.' : ''}`, aAt);
    }
    np.fam = fam;
    if (np.of && np.of.k === 'np') { const e = npFix(np.of); if (e) return e; }
    return null;
  }
  const npText = np => np.coord ? np.coord.map(npText).join(` ${np.conj.w} `) : np.k === 'pron' ? np.t.w : words(np.start, np.end);
  function NPs(where) {
    const a = NP(); if (isErr(a)) return a;
    const c = peek();
    if (c?.k === 'conj' && (c.w === 'en' || c.w === 'of') && ['det', 'noun', 'adj', 'int'].includes(peek(1)?.k)) {
      const save = i; i++;
      const b = NP();
      if (isErr(b) || (where !== 'vf' && isVerb(peek()) && (!nlAmb(peek()) || (peek(1) && peek(1).k !== 'conj')))) { i = save; return a; }
      return { k: 'np', coord: [a, b], conj: c, start: a.start, end: i, n: a.n, num: 'p' };
    }
    return a;
  }
  /* a preposition and what follows it */
  function PP() {
    const start = i, p = T[i++], nx = peek();
    if (p.w === 'naar' && nx?.k === 'noun' && nx.e.w === 'huis' && nx.w === 'huis') { i++; return { k: 'pp', p, home: true, start, end: i }; }
    if (nx?.k === 'noun' && nx.e.bare?.includes(p.w) && nx.w === nx.e.w) { i++; const np = { k: 'np', n: nx, start: i - 1, end: i, num: 's', bareOK: true }; return { k: 'pp', p, np, bare: true, start, end: i }; }
    if (p.w === 'van') return err('“van” joins two nouns: “het boek van mijn broer”. It needs a noun right before it.', start);
    if (nx?.k === 'pron') { i++; return { k: 'pp', p, pron: { k: 'pron', t: nx, start: i - 1, end: i }, start, end: i }; }
    if (!nx || !['det', 'noun', 'adj', 'int'].includes(nx.k)) return err(`“${p.w}” needs a noun after it: “${p.w === 'naar' ? 'naar het park' : p.w === 'met' ? 'met de hond' : p.w === 'voor' ? 'voor mijn moeder' : p.w + ' het park'}”.`, nx ? start : i);
    const np = NP(); if (isErr(np)) return np;
    return { k: 'pp', p, np, start, end: i };
  }
  /* one part of the sentence */
  function part(where) {
    const t = peek(), start = i;
    if (!t || t.k === 'conj') return null;
    if (t.k === 'pron') { i++; return { k: 'pron', t, start, end: i }; }
    if (t.k === 'det' || t.k === 'noun') return NPs(where);
    if (t.k === 'int' || t.k === 'adj') {
      let j = i; if (T[j].k === 'int') j++; if (T[j]?.k === 'adj') j++;
      if (T[j]?.k === 'noun') return NPs(where);
      let heel = null; if (t.k === 'int') { heel = T[i++]; if (peek()?.k !== 'adj') return err('“heel” (very) goes right before a describing word: “heel groot”.', peek() ? i - 1 : i); }
      const a = T[i++]; return { k: 'pred', a, heel, start, end: i };
    }
    if (t.k === 'prep') return PP();
    if (t.k === 'adv') { i++; return { k: 'adv', t, start, end: i }; }
    if (t.k === 'neg') { i++; return { k: 'niet', t, start, end: i }; }
    if (t.k === 'part') { i++; return { k: 'part', t, start, end: i }; }
    if (t.k === 'verb') { i++; return { k: nlAmb(t) || t.inf ? 'inf' : 'fin', t, start, end: i }; }
    i++; return { k: 'other', t, start, end: i };
  }
  const subjPron = x => x && x.k === 'pron' && nlPronReads(x.t.w).some(r => r.c === 'nom');
  const onlySubjPron = x => subjPron(x) && !nlPronReads(x.t.w).some(r => r.c === 'obj');
  /* check one clause once its parts are known. C: { kind: main | sub, vf, verb, items, shared, cj } */
  function analyse(C) {
    let V = C.verb; const items = C.items, main = C.kind === 'main';
    if (!main && V.e.part && !V.joined) { const alt = NL_VERB.find(v => !v.part && v.f.includes(V.w)); if (alt) V = C.verb = { ...V, e: alt }; }
    if (main && !V.joined) {   // "kom … mee" is meekomen, "kom" on its own is komen
      const pt = items.find(x => x.k === 'part'), same = v => v.f.includes(V.w);
      const alt = pt ? (V.e.part === pt.t.w ? null : NL_VERB.find(v => v.part === pt.t.w && same(v))) : V.e.part ? NL_VERB.find(v => !v.part && same(v)) : null;
      if (alt) V = C.verb = { ...V, e: alt };
    }
    const infs = main ? items.filter(x => x.k === 'inf') : C.infs, modal = V.e.t === 'modal' || (V.e.inf === 'gaan' && infs.length > 0);
    if (infs.length > 1) return err('Use only one verb at the end.', infs[1].start);
    if (V.e.t === 'modal' && !infs.length) return err(`“${V.w}” needs a second verb at the ${main ? 'very end' : 'end'}: “${main ? `${V.w} … zwemmen` : `… ${V.w} zwemmen`}”.`, main ? (items.length ? items[items.length - 1].end : C.vEnd) : C.vAt);
    if (!modal && infs.length) return err(`Only verbs like kunnen, willen, moeten and gaan send a second verb to the end. Take out “${infs[0].t.w}”.`, infs[0].start);
    const G = modal ? infs[0].t.e : V.e, inf = infs[0];
    if (modal && ['modal', 'say'].includes(G.t)) return err(`Try another verb after “${V.w}”: “${V.w} … spelen”, “${V.w} … eten”.`, inf.start);
    if (inf && V.e.inf === 'gaan' && G.inf === 'gaan') return err(`Try another verb after “${V.w}”: “${V.w} … zwemmen”.`, inf.start);
    // who does it
    const rest = [...items].filter(x => x.k !== 'inf' || main);
    let subj = null;
    const vfX = C.vf && C.vf.k !== 'sub' ? C.vf : null;
    const npOrSubj = x => x && (x.k === 'np' || subjPron(x));
    if (C.shared) subj = C.shared;
    else if (main && vfX && npOrSubj(vfX) && !onlySubjPron(rest[0])) subj = vfX;
    else {
      const k = rest.findIndex(x => onlySubjPron(x) || (x.k === 'np' && !(vfX && vfX.k === 'np')) || subjPron(x));
      if (k > 0) return err(`“${cText(rest[k])}” (who does it) goes right ${main ? 'after the verb' : `after “${C.cj.w}”`}: “${main ? `${vfX ? cText(vfX) + ' ' : ''}${V.w} ${cText(rest[k])}` : `${C.cj.w} ${cText(rest[k])}`} …”.`, rest[k].start);
      if (k === 0) subj = rest.shift();
    }
    if (!subj) {
      const cand = [vfX, ...rest].find(x => x && x.k === 'pron');
      if (cand) { const r = nlPronReads(cand.t.w)[0]; return err(`Who does it is “${r ? r.r[0] : 'ik'}”, not “${cand.t.w}”.`, cand.start); }
      return err(main ? 'Dutch needs who does it (the subject): for example “ik”, “hij” or “de hond”.' : `After “${C.cj.w}” comes who does it: “${C.cj.w} ik …”, “${C.cj.w} hij …”.`, main && !rest.length ? C.vEnd : C.vAt);
    }
    if (subj.k === 'pron' && !subjPron(subj)) { const r = nlPronReads(subj.t.w)[0]; return err(`Who does it is “${r ? r.r[0] : 'ik'}”, not “${subj.t.w}”.`, subj.start); }
    if (subj.k === 'np') { const e = npFix(subj); if (e) return e; }
    // the verb matches who does it; jij after the verb drops the -t (Morgen werk jij)
    let fset;
    if (C.shared) fset = C.shared.fset;
    else if (subj.k === 'pron') fset = nlPronReads(subj.t.w).filter(r => r.c === 'nom').map(r => r.r[4]);
    else fset = subj.coord ? (subj.conj.w === 'of' ? [2, 5] : [5]) : [subj.num === 'p' ? 5 : 2];
    const inverted = main && subj !== vfX && !C.shared && subj.k === 'pron' && subj.t.w === 'jij';
    const pre = V.joined ? V.e.part : '';
    const spell = x => x === 1 && inverted ? (V.e.inv || [V.e.f[0]]).map(s => pre + s) : [pre + V.e.f[x], ...(x === 1 && V.e.alt1 ? V.e.alt1.map(s => pre + s) : [])];
    const f = fset.find(x => spell(x).includes(V.w));
    if (f == null) {
      const want = [...new Set(fset.flatMap(spell))];
      if (inverted && V.e.f[1] === V.w) return err(`When “jij” comes after the verb, the verb drops its -t: “${want[0]} jij”.`, C.vAt);
      return err(`“${V.w}” doesn’t match “${subj.k === 'pron' ? subj.t.w : npText(subj)}”. Use “${want.join('” or “')}”.`, C.vAt);
    }
    C.subj = subj; C.fset = fset; C.f = f;
    // verbs that split: in two in a main sentence, one piece at the end after omdat / dat
    const parts = rest.filter(x => x.k === 'part');
    if (main && V.joined) return err(`In a main sentence, “${V.e.inf}” splits in two: “${V.e.f[f === 1 && inverted ? 0 : f]} … ${V.e.part}”.`, C.vAt);
    if (!main && V.e.part && !V.joined && !modal) return err(`After “${C.cj.w}”, “${V.e.inf}” stays in one piece at the end: “${V.e.part}${V.e.f[f]}”.`, C.vAt);
    if (inf && G.part && !inf.t.joined) return err(`“${G.inf}” stays in one piece here: “${G.inf}”.`, inf.start);
    if (!main && parts.length) return err(`After “${C.cj.w}”, the verb stays in one piece at the end. Take out “${parts[0].t.w}”.`, parts[0].start);
    if (main && V.e.part && !modal && !parts.length) return err(`“${V.e.inf}” splits in two: “${V.w} … ${V.e.part}”. Put “${V.e.part}” at the very end.`, rest.length ? rest[rest.length - 1].end : C.vEnd);
    if (main && modal && parts.length) return err(`With “${V.w}”, the second verb stays in one piece at the end: “${G.inf}”.`, parts[0].start);
    if (parts.length > 1) return err('Use only one verb part at the end.', parts[1].start);
    if (parts.length && parts[0].t.w !== V.e.part) return err(V.e.part ? `“${V.e.inf}” splits into “${V.w} … ${V.e.part}”, not “${parts[0].t.w}”.` : `“${parts[0].t.w}” isn’t part of “${G.inf}”. Take it out.`, parts[0].start);
    const last = rest[rest.length - 1];
    if (parts.length && last !== parts[0]) return err(`“${parts[0].t.w}” goes at the very end: “… ${parts[0].t.w}”.`, parts[0].start);
    if (main && inf && last !== inf) return err(`“${inf.t.w}” goes at the very end.`, inf.start);
    // nouns and pronouns that are objects
    const pool = [...(vfX && vfX !== subj ? [vfX] : []), ...rest];
    const objs = pool.filter(x => x.k === 'np' || x.k === 'pron');
    let preds = pool.filter(x => x.k === 'pred'), advs = pool.filter(x => x.k === 'adv');
    const pps = pool.filter(x => x.k === 'pp'), niets = rest.filter(x => x.k === 'niet');
    const odd = rest.find(x => x.k === 'fin' || x.k === 'other');
    if (odd) return err(odd.k === 'fin' ? (main ? 'One verb per sentence part. Use “en” or “maar” to add another.' : `After “${C.cj.w}”, the verb goes to the very end.`) : `“${odd.t.w}” doesn’t fit here.`, odd.start);
    if (niets.length > 1) return err('Use “niet” only once.', niets[1].start);
    // goed is "good" after zijn and "well" with other verbs
    const be = ['zijn', 'worden'].includes(G.t);
    for (const p of [...preds]) if (!be && p.a.e.pred === 'goed' && p.a.w === 'goed' && !p.heel) { preds = preds.filter(x => x !== p); const a = { k: 'adv', t: { ...p.a, k: 'adv', en: 'well', cls: 'how' }, start: p.start, end: p.end }; advs.push(a); if (rest.includes(p)) rest[rest.indexOf(p)] = a; }
    for (const a of [...advs]) if (be && a.t.w === 'goed') { advs = advs.filter(x => x !== a); const p = { k: 'pred', a: { ...a.t, k: 'adj', e: NL_ADJ.find(x => x.pred === 'goed') }, start: a.start, end: a.end }; preds.push(p); if (rest.includes(a)) rest[rest.indexOf(a)] = p; }
    const en = G.en;
    if (['tr', 'hebben'].includes(G.t)) {
      if (objs.length > 1) { const two = objs[1]; return err(objs[0].k === 'np' && two.k === 'np' ? `Only one object here: what you ${en}. To say whose, use “van”: “${npText(objs[0])} van ${npText(two)}”.` : 'Only one object here.', two.start); }
      if (!objs.length && G.need) return err(`“${G.inf}” needs ${'what you ' + en} after it: “${inf ? `${V.w} … ${{ person: 'mijn vriend', open: 'de deur' }[G.objs?.[0]] || 'een appel'} ${inf.t.w}` : `${V.w} ${{ food: 'een appel', drink: 'water', read: 'een boek', thing: 'een bal', person: 'mijn vriend', open: 'de deur', '*': 'een hond' }[G.objs?.[0]] || 'een hond'}`}”.`, last ? last.end : C.vEnd);
      for (const o of objs) {
        if (o.k === 'pron') {
          if (!nlPronReads(o.t.w).some(r => r.c === 'obj')) { const r = nlPronReads(o.t.w)[0]; return err(`After the verb, “${o.t.w}” becomes “${r ? r.r[1] : 'mij'}”: “${V.w} ${r ? r.r[1] : 'mij'}”.`, o.start); }
          if (!G.objs.includes('*') && !G.objs.includes('person') && !G.objs.includes('animal')) return err(`That doesn’t make sense: you can’t ${en} a person. “${G.inf}” goes with ${G.objs.map(c => NL_KIND[c]).join(', ')}.`, o.start);
          continue;
        }
        const e = npFix(o); if (e) return e;
        for (const p of o.coord || [o]) {
          const cat = p.n.e.cat;
          if (cat === 'feel' && G.t !== 'hebben') return err(`“${p.n.e.w}” goes with hebben: “ik heb ${p.n.e.w}”.`, p.start);
          if (cat === 'feel' && p.det && p.fam !== 'geen') return err(`No article here: “${V.w} ${p.n.e.w}”, or with not: “${V.w} geen ${p.n.e.w}”.`, p.start);
          if (cat !== 'feel' && (G.objs[0] === 'open' ? !NL_OPENABLE.includes(p.n.e.w) : !G.objs.includes('*') && !G.objs.includes(cat))) return err(`That doesn’t make sense: you can’t ${en} ${nlEnA(p)}. “${G.inf}” goes with ${G.objs.map(c => NL_KIND[c]).join(', ')}.`, p.start);
        }
      }
    } else if (objs.length) {
      const o = objs[0];
      if (G.t === 'zijn' && o.k === 'np' && o.n.e.cat === 'feel') return err(`Dutch says this with hebben: “ik heb ${o.n.e.w}”.`, o.start);
      return err(be ? `After “${V.w}”, put a describing word (“moe”)${G.t === 'zijn' ? ' or a place (“in het park”, “thuis”)' : ''}.` : G.t === 'go' ? `“${G.inf}” needs where you go: “naar het park”, “naar school”, “naar huis”. “${npText(o)}” isn’t where you go.` : G.t === 'say' ? `After “${V.w}”, add what you ${en} with “dat”: “${V.w} dat …”.` : `“${G.inf}” (to ${en}) doesn’t take an object. You can add a place: “in het park”, or who with: “met mijn vriend”.`, o.start);
    }
    if (preds.length && !be) return err(`“${preds[0].a.w}” describes something: put it right before a noun (“de ${preds[0].a.e.attr || preds[0].a.e.pred} hond”), or use zijn: “is ${preds[0].a.e.pred}”.`, preds[0].start);
    if (preds.length > 1) return err('Use one describing word here.', preds[1].start);
    for (const p of preds) if (p.a.w !== p.a.e.pred) return err(`After “${V.w}”, the describing word has no -e: “${p.a.e.pred}”.`, p.start);
    if (preds.length && main && (inf ? rest[rest.length - 2] : last) !== preds[0]) return err(`The describing word goes at the end: “${V.w} … ${preds[0].heel ? 'heel ' : ''}${preds[0].a.w}”.`, preds[0].start);
    if (preds.length && !main && last !== preds[0]) return err(`The describing word goes right before the verb: “… ${preds[0].a.w} ${V.w}”.`, preds[0].start);
    // prepositions: naar for going, in / op for being there
    let dest = 0;
    const go = G.t === 'go';
    for (const x of pps) {
      const p = x.p;
      if (x.home) { if (!go && !G.move) return err('“naar huis” is for going home. At home is “thuis”.', x.start); dest++; continue; }
      if (x.pron) {
        if (!nlPronReads(x.pron.t.w).some(r => r.c === 'obj')) { const r = nlPronReads(x.pron.t.w)[0]; return err(`After “${p.w}”, say “${p.w} ${r ? r.r[1] : 'mij'}”.`, x.start + 1); }
        if (p.w === 'naar') { if (!go && !G.move) return err('“naar” is for going somewhere.', x.start); dest++; }
        else if (['in', 'op'].includes(p.w)) return err(`“${p.w}” needs a place or thing after it: “${p.w} het park”.`, x.start + 1);
        continue;
      }
      const np = x.np, n = np.n.e;
      if (!x.bare) { const e = npFix(np); if (e) return e; }
      if (p.w === 'naar') {
        if (!go && !G.move) return err(`“naar” is for going somewhere. Being there: “${nlAt(n, np)}”.`, x.start);
        if (n.cat === 'feel' || n.cat === 'food' || n.cat === 'drink') return err(`You can’t go to ${nlEnA(np)}. Try a place: “naar het park”.`, x.start);
        dest++; continue;
      }
      if (['in', 'op'].includes(p.w)) {
        if (!['place', 'thing', 'read'].includes(n.cat)) return err(`“${p.w}” + a place here: “in het park”, “op school”. “${n.w}” isn’t a place.`, x.start);
        if (go) return err(`To say where you go, Dutch uses “naar”: “naar ${x.bare ? n.w : npSay(np)}”.`, x.start);
        if (n.cat === 'place' && p.w !== n.p && !(n.alt || []).includes(p.w)) return err(`Dutch says “${nlAt(n, np)}”.`, x.start);
        x.loc = true; continue;
      }
      if (p.w === 'bij') { if (go) return err(`To say where you go, Dutch uses “naar”: “naar ${npSay(np)}”.`, x.start); x.loc = true; continue; }
    }
    if (go && dest > 1) return err('Say where you go only once.', pps[pps.length - 1].start);
    if (go && G.need && !dest && !modal && !pps.length) return err(`“${V.w}” needs where you go: “naar het park”, “naar school”, “naar huis”.`, last ? last.end : C.vEnd);
    for (const a of advs) if (a.t.w === 'thuis' && (go || dest)) return err('“thuis” means at home. Going home is “naar huis”.', a.start);
    const locs = pps.filter(x => x.loc).length + advs.filter(a => a.t.cls === 'place').length;
    if (G.loc && !locs) return err(`Say where: “${V.w} in de stad”, “${V.w} hier”.`, last ? last.end : C.vEnd);
    if (G.t === 'zijn' && !preds.length && !locs) return err(`“${V.w}” needs something after it: a describing word (“moe”) or a place (“in het park”, “thuis”).`, last ? last.end : C.vEnd);
    if (G.t === 'worden' && !preds.length) return err(`“${V.w}” needs a describing word after it: “${V.w} moe”.`, last ? last.end : C.vEnd);
    if (G.t === 'zijn' && preds.length && locs) return err('Say one thing after zijn: how something is (“moe”) or where it is (“in het park”).', preds[0].start);
    for (const a of advs) {
      if (a.t.cls === 'graag' && (G.t === 'worden' || preds.length)) return err('“graag” goes with action verbs: “ik speel graag”, “ik eet graag appels”.', a.start);
      if (a.t.cls === 'how' && !['in', 'tr', 'go'].includes(G.t)) return err(`“${a.t.w}” goes with action verbs: “zij speelt ${a.t.w}”.`, a.start);
    }
    if (advs.filter(a => a.t.cls === 'graag').length > 1) return err('Use “graag” only once.');
    // word order in the middle: short pronouns first, then the rest; niet in its place
    const ni = rest.findIndex(x => x.k === 'niet'), pronAt = rest.findIndex(x => x.k === 'pron');
    if (pronAt > 0 && rest.slice(0, pronAt).some(x => x.k !== 'pron')) return err(`Short words like “${rest[pronAt].t.w}” go right after ${main ? 'the verb' : 'who does it'}: “${main ? `${V.w} ${rest[pronAt].t.w}` : `${cText(subj)} ${rest[pronAt].t.w}`} …”.`, rest[pronAt].start);
    const geen = [vfX, ...rest].find(x => x && x.k === 'np' && (x.coord || [x]).some(p => p.fam === 'geen'));
    const defn = x => (x.coord || [x]).every(p => p.fam && !['een', 'geen', 'twee', 'drie'].includes(p.fam));
    if (ni >= 0 && geen) return err('Use “geen” or “niet”, not both.', rest[ni].start);
    if (ni >= 0) {
      const after = rest.slice(ni + 1), notAdv = after[0]?.k === 'adv' && ['graag', 'how', 'freq'].includes(after[0].t.cls);
      for (const x of after) {
        if (x.k === 'pron') return err(`“niet” goes after “${x.t.w}”: “… ${x.t.w} niet”.`, rest[ni].start);
        if (x.k === 'adv' && x.t.cls === 'time') return err(`“${x.t.w}” goes before “niet”.`, x.start);
        if (x.k === 'np' && objs.includes(x)) {
          if (defn(x)) return err(`“niet” goes after “${npText(x)}”: “… ${npText(x)} niet”.`, rest[ni].start);
          if (!notAdv) { const p = x.coord ? x.coord[0] : x; return err(`Dutch says “geen” instead of “niet ${p.det ? 'een ' : ''}…”: “geen ${[p.adj ? nlAdjForm(p.adj.e, 'geen', p.n.e.g, p.num) : '', nlNounForm(p.n.e, p.num)].filter(Boolean).join(' ')}”.`, rest[ni].start); }
        }
      }
      for (const x of rest.slice(0, ni)) {
        if (x.k === 'np' && objs.includes(x) && !defn(x) && !notAdv) {
          const p = x.coord ? x.coord[0] : x;
          return err(`Dutch says “geen” here instead of “niet”: “geen ${[p.adj ? nlAdjForm(p.adj.e, 'geen', p.n.e.g, p.num) : '', nlNounForm(p.n.e, p.num)].filter(Boolean).join(' ')}”.`, x.start);
        }
        if (x.k === 'pred' || x.k === 'pp' && (x.loc || x.home || x.p.w === 'naar') || (x.k === 'adv' && ['graag', 'how', 'place'].includes(x.t.cls))) return err(`“niet” goes before “${cText(x)}”.`, rest[ni].start);
      }
    }
    // makes sense? only people and animals do things
    if (subj.k === 'np' && !be) for (const p of subj.coord || [subj]) {
      const c = p.n.e.cat;
      if (c !== 'person' && c !== 'animal') return err(`That doesn’t make sense: ${nlEnA(p)} can’t ${en}. Use a person or an animal here.`, p.start);
      if (c === 'animal' && G.who === 'p') return err(`That doesn’t make sense: ${nlEnA(p)} can’t ${en}. Only people ${en}.`, p.start);
    }
    if (subj.k === 'np') for (const p of subj.coord || [subj]) if (p.n.e.cat === 'feel') return err(`“${p.n.e.w}” goes with hebben: “ik heb ${p.n.e.w}”.`, p.start);
    Object.assign(C, { G, V, inf, rest, objs, preds, pps, advs, niet: ni >= 0, modal, inverted });
    return C;
  }
  // a sentence after omdat / dat: who does it, the rest, then the verb(s) at the end
  function subClause(cj, front) {
    const C = { kind: 'sub', cj, items: [], infs: [], start: i };
    for (;;) {
      const t = peek();
      if (!t || t.k === 'conj') break;
      if (isVerb(t)) {
        let j = i; while (isVerb(T[j])) j++;
        if (T[j] && T[j].k !== 'conj' && front && j - i >= 2) j--;   // "Omdat ik moe ben, blijf ik thuis": the last verb starts the main sentence
        else if (T[j] && T[j].k !== 'conj') return err(`After “${cj.w}”, the verb goes to the very end: “${cj.w} … ${t.w}”.`, i);
        const vs = T.slice(i, j).map((t, k) => ({ t, at: i + k }));
        if (vs.length > 2) return err('Too many verbs at the end. Use one, or two with kunnen, willen, moeten or gaan.', vs[2].at);
        let fin = vs[0], other = vs[1];
        if (vs.length === 2) {
          const a = vs[0], b = vs[1];
          if (!nlAmb(a.t) && !nlAmb(b.t)) return err('Only one of the two verbs can match who does it; the other one stays like “zwemmen”.', b.at);
          fin = !nlAmb(a.t) ? a : !nlAmb(b.t) ? b : nlIsModal(a.t.e) ? a : b; other = fin === a ? b : a;
          if (!nlAmb(other.t)) return err(`“${other.t.w}” should stay like this: “${other.t.e.inf}”.`, other.at);
          C.infs = [{ k: 'inf', t: other.t, start: other.at, end: other.at + 1 }];
        }
        C.verb = fin.t; C.vAt = fin.at; i = j; C.vEnd = j; break;
      }
      const c = part('sub'); if (isErr(c)) return c; C.items.push(c);
    }
    if (!C.verb) return err(`After “${cj.w}” comes a whole sentence with its verb at the end: “${cj.w} ik moe ben”.`, i);
    return analyse(C);
  }
  function mainClause(front, shared) {
    const C = { kind: 'main', items: [], start: i, vf: front || null };
    if (!front) {
      if (shared && isVerb(peek())) C.shared = shared;
      else {
        const vf = part('vf'); if (isErr(vf)) return vf;
        if (!vf) return err('Every sentence needs a verb.');
        if (vf.k === 'fin' || vf.k === 'inf') return err(`Dutch puts something before the verb in a sentence like this: who does it (“ik ${vf.t.w} …”) or a word like “vandaag”.`, vf.start);
        if (vf.k === 'niet') return err('“niet” can’t start the sentence. Start with who does it: “ik … niet”.', vf.start);
        if (vf.k === 'part') return err(`“${vf.t.w}” goes at the end of the sentence.`, vf.start);
        if (vf.k === 'pred') return err(`Start with who does it, then the verb: “De hond is ${vf.a.w}”.`, vf.start);
        if (vf.k === 'adv' && ['graag', 'how'].includes(vf.t.cls)) return err(`Start with who does it, then the verb: “Ik speel ${vf.t.w}”.`, vf.start);
        C.vf = vf;
      }
    }
    const v = peek();
    if (!isVerb(v)) {
      if (!v || v.k === 'conj') return err(C.vf ? 'Now add a verb (an action word like “speelt” or “is”).' : 'Every sentence needs a verb.', i);
      // something else before the verb: "Vandaag ik speel" → the verb comes second
      const j = T.findIndex((t, k) => k > i && isVerb(t) && !T.slice(i, k).some(x => x.k === 'conj'));
      if (j > 0) return err(`In Dutch the verb comes second: “${C.vf?.k === 'sub' ? '…' : cText(C.vf)} ${T[j].w} ${T.slice(i, j).map(t => t.w).join(' ')} …”.`, i);
      return err(C.vf ? `After “${C.vf.k === 'sub' ? 'that part' : cText(C.vf)}”, the next word should be a verb. “${v.w}” isn’t one.` : 'Every sentence needs a verb.', i);
    }
    C.verb = v; C.vAt = i; i++; C.vEnd = i;
    while (peek() && peek().k !== 'conj') { const c = part('mf'); if (isErr(c)) return c; C.items.push(c); }
    return analyse(C);
  }
  const P = { clauses: [], links: [], commas: new Set() };
  if (peek()?.k === 'conj' && peek().w === 'dat') return err('Start with the main sentence: “Ik denk dat …”.', 0);
  if (peek()?.k === 'conj' && !peek().sub) return err(`“${peek().w}” joins two parts, so it can’t start the sentence.`, 0);
  let prev = null;
  for (;;) {
    let C;
    if (peek()?.k === 'conj' && peek().w === 'omdat') {   // "Omdat ik moe ben, blijf ik thuis."
      const cj = T[i++]; const s = subClause(cj, true); if (isErr(s)) return s;
      if (!peek()) return err('Now add the main sentence, verb first: “…, blijf ik thuis”.', i);
      if (peek().k === 'conj') return err('After the omdat part, go on with the verb: “Omdat ik moe ben, blijf ik thuis”.', i);
      P.commas.add(i);
      C = mainClause({ k: 'sub', start: s.start, end: i, s }, null); if (isErr(C)) return C;
      C.front = s;
    } else { C = mainClause(null, prev && P.links.length && P.links.at(-1).w !== 'want' ? prev.shareNext : null); if (isErr(C)) return C; }
    C.subs = []; P.clauses.push(C); prev = C;
    while (peek()?.k === 'conj' && peek().sub) {
      const cj = T[i]; if (cj.w === 'omdat') P.commas.add(i); i++;
      if (!peek()) return err(`“${cj.w}” needs a sentence after it.`, i);
      if (cj.w === 'dat' && C.G.t !== 'say') return err('“dat” (that) comes after verbs like denken, geloven, zeggen and weten: “Ik denk dat …”.', i - 1);
      const s = subClause(cj); if (isErr(s)) return s; C.subs.push(s);
      if (peek()?.k === 'conj' && !peek().sub) P.commas.add(i);
    }
    if (!peek()) break;
    const cj = T[i];
    if (cj.k !== 'conj') return err(`“${cj.w}” doesn’t fit here.`, i);
    i++;
    if (!peek()) return err(`“${cj.w}” joins two parts, so something has to come after it.`, i);
    if (cj.w === 'maar' || cj.w === 'want') P.commas.add(i - 1);
    P.links.push(cj);
    C.shareNext = C.subj ? { ...C.subj, fset: [C.f] } : C.shared;
  }
  return { ok: true, P };
}
const nlEnA = p => p.num === 'p' || p.n.e.mass || p.n.e.cat === 'feel' ? (p.num === 'p' ? p.n.e.enPl || p.n.e.en : p.n.e.en) : (/^[aeiou]/i.test(p.n.e.en) ? 'an ' : 'a ') + p.n.e.en;
// how to say "in the park" for a place: in het park, op het strand, op school
const nlAt = (n, np) => n.bare?.includes(n.p) ? `${n.p} ${n.w}` : `${n.p || 'in'} ${np?.num === 'p' ? 'de' : n.g} ${nlNounForm(n, np?.num || 's')}`;

/* English meaning of a correct Dutch sentence */
function nlEnglish(P) {
  const an = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
  const pronObj = w => nlPronReads(w).find(r => r.c === 'obj')?.r[3] || nlPronReads(w)[0]?.r[3];
  const npEn = (np, neg) => {
    if (np.k === 'pron') return pronObj(np.t.w);
    if (np.coord) return np.coord.map(p => npEn(p, neg)).join(np.conj?.w === 'of' ? ' or ' : ' and ');
    const a = np.adj, adj = a ? (np.heel ? 'very ' : '') + a.e.en + ' ' : '', pl = np.num === 'p', noun = pl ? np.n.e.enPl || np.n.e.en : np.n.e.en, fam = np.fam;
    let art = '';
    if (fam === 'def') art = 'the ';
    else if (fam === 'een') art = an(adj || noun) + ' ';
    else if (fam === 'geen') art = neg === 'obj' ? (pl || np.n.e.mass ? 'any ' : an(adj || noun) + ' ') : 'no ';
    else if (fam === 'dem') art = pl ? 'these ' : 'this ';
    else if (fam === 'twee' || fam === 'drie') art = fam === 'twee' ? 'two ' : 'three ';
    else if (fam) art = nlPossEn(fam) + ' ';
    if (np.of) { const o = np.of, owner = o.k === 'pron' ? pronObj(o.t.w) : npEn(o); const person = o.k === 'pron' || ['person', 'animal'].includes(o.n.e.cat);
      return (!fam || fam === 'def') && person && o.k !== 'pron' ? `${owner}'s ${adj}${noun}` : `${art}${adj}${noun} of ${owner}`; }
    return art + adj + noun;
  };
  const PREP_EN = { met: 'with', voor: 'for', zonder: 'without', bij: 'at', van: 'from', naar: 'to', in: 'in', op: 'on' };
  const placeEn = x => {
    if (x.home) return 'home';
    if (x.pron) return `${PREP_EN[x.p.w]} ${pronObj(x.pron.t.w)}`;
    const n = x.np.n.e, the = x.bare ? '' : npEn(x.np);
    if (x.bare) return x.p.w === 'naar' ? 'to school' : 'at school';
    if (x.p.w === 'naar') return 'to ' + the;
    if (x.p.w === 'in') return 'in ' + the;
    if (x.p.w === 'op') return (n.cat === 'place' ? 'at ' : 'on ') + the;
    if (x.p.w === 'bij') return n.cat === 'person' ? `at ${the}'s` : 'near ' + the;
    return PREP_EN[x.p.w] + ' ' + the;
  };
  const one = C => {
    const V = C.verb, G = C.G, f = C.f, modal = C.modal;
    const subjNp = C.subj;
    let subj = C.shared ? '' : subjNp.k === 'pron' ? NL_PRON.find(r => r[0] === subjNp.t.w && r[4] === f)?.[2] || 'I' : npEn(subjNp);
    const third = f === 2, neg = C.niet || (C.objs || []).some(o => o.k === 'np' && (o.coord || [o]).some(p => p.fam === 'geen'));
    const subjGeen = subjNp.k === 'np' && (subjNp.coord || [subjNp]).some(p => p.fam === 'geen');
    const neg2 = neg && !subjGeen;
    const advs = C.advs || [], has = c => advs.filter(a => a.t.cls === c);
    const freq = has('freq').map(a => a.t.en).join(' '), graag = has('graag').length, endAdv = [...has('how'), ...has('place')].map(a => a.t.en);
    const time = has('time').filter(a => a !== C.vf).map(a => a.t.en), frontTime = C.vf?.k === 'adv' && C.vf.t.cls === 'time' ? C.vf.t.en : '';
    const feel = (C.objs || []).find(o => o.k === 'np' && o.n?.e?.cat === 'feel' && !o.n.e.have);
    let rest = '';
    if (G.t === 'zijn' || G.t === 'worden' || feel) rest = C.preds?.[0] ? (C.preds[0].heel ? 'very ' : '') + C.preds[0].a.e.en : feel ? feel.n.e.en : '';
    else for (const o of C.objs || []) rest += ' ' + npEn(o, 'obj');
    const pp = (C.pps || []).map(placeEn);
    const be = f === 0 ? 'am' : third ? 'is' : 'are';
    const base = G.t === 'zijn' || feel ? 'be' : G.en;
    let vp;
    if (modal && graag) endAdv.push('gladly');
    if (modal && V.e.inf === 'gaan') vp = `${be}${neg2 ? ' not' : ''} going to${freq ? ' ' + freq : ''} ${base}`;
    else if (modal) vp = `${V.e.m[(neg2 ? 2 : 0) + (third ? 1 : 0)]}${freq ? ' ' + freq : ''} ${base}`;
    else if (graag && G.t === 'hebben' && !feel) vp = neg2 ? `${third ? 'does' : 'do'} not like` : third ? 'likes' : 'like';
    else if (G.t === 'zijn' || feel) vp = `${be}${neg2 ? ' not' : ''}${freq ? ' ' + freq : ''}`;
    else if (G.t === 'worden') vp = neg2 ? `${third ? 'does' : 'do'} not${freq ? ' ' + freq : ''} get` : `${freq ? freq + ' ' : ''}${third ? 'gets' : 'get'}`;
    else if (graag) vp = neg2 ? `${third ? 'does' : 'do'} not${freq ? ' ' + freq : ''} like to ${G.en}` : `${freq ? freq + ' ' : ''}${third ? 'likes' : 'like'} to ${G.en}`;
    else vp = neg2 ? `${third ? 'does' : 'do'} not${freq ? ' ' + freq : ''} ${G.en}` : `${freq ? freq + ' ' : ''}${third ? G.en3 : G.en}`;
    let s = `${subj} ${vp} ${rest} ${pp.join(' ')} ${endAdv.join(' ')} ${time.join(' ')}`;
    if (frontTime) s = `${frontTime} ${s}`;
    for (const sb of C.subs || []) s += (sb.cj.w === 'omdat' ? ', because ' : ' that ') + one(sb);
    return s.replace(/\s+/g, ' ').replace(/ ,/g, ',').trim();
  };
  let s = '';
  P.clauses.forEach((C, k) => {
    let t = one(C);
    if (C.front) t = 'because ' + one(C.front) + ', ' + t;
    if (k) { const c = P.links[k - 1]; s += (c.w === 'en' ? (C.shared ? ' and ' : ', and ') : c.w === 'maar' ? ', but ' : c.w === 'want' ? ', because ' : (C.shared ? ' or ' : ', or ')) + t; }
    else s = t;
  });
  return s[0].toUpperCase() + s.slice(1) + '.';
}
// the sentence as text, with the commas Dutch uses (before maar, want and omdat, and after an omdat part at the start)
function nlText(words) {
  let r = null; try { r = nlCheck(words); } catch {}
  const commas = r?.ok ? r.P.commas : new Set(words.map((w, k) => k && w.k === 'conj' && ['maar', 'want', 'omdat'].includes(w.w) ? k : -1).filter(k => k > 0));
  const s = words.map((w, k) => (k && commas.has(k) ? ', ' : k ? ' ' : '') + w.w).join('').replace(/ ,/g, ',');
  return s[0].toUpperCase() + s.slice(1) + '.';
}

/* ---------------- making a Dutch tray ---------------- */
function nlGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = (list, key) => { const fav = list.filter(x => pref.has(String(key(x)).toLowerCase())); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const nounOf = cats => RP(NL_NOUN.filter(n => n.cat !== 'feel' && (cats[0] === '*' || cats.includes(n.cat) || (cats[0] === 'open' && NL_OPENABLE.includes(n.w)))), n => n.w);
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'd', thing: 't', place: 'l', read: 'r' };
  const adjFor = cat => RP(NL_ADJ.filter(a => a.d.includes(CAT[cat] || 'p')), a => a.pred);
  const extra = [];
  // a noun phrase; fam: def, een, geen, dem, poss, twee, drie, bare (or null to pick one)
  const np = (n, num, out, o = {}) => {
    let fam = o.fam;
    if (!fam) {
      if (num === 'p') fam = R(['def', 'def', 'poss', 'dem', 'twee', 'drie', ...(o.bare ? ['bare', 'bare'] : [])]);
      else if (n.mass === 1) fam = R(['def', 'poss', ...(o.bare ? ['bare', 'bare', 'bare'] : [])]);
      else fam = R(['def', 'def', 'een', 'een', 'poss', 'dem', ...(n.mass === 2 && o.bare ? ['bare'] : [])]);
      if (n.fam && num === 's' && coin(0.9)) fam = 'poss';
      if (o.noBare && fam === 'bare') fam = 'def';
    }
    if (fam === 'een' && num === 'p') fam = 'def';
    if (fam === 'een' && n.mass === 1) fam = 'def';
    const a = o.adj !== false && n.cat !== 'feel' && coin(0.3) ? adjFor(n.cat) : null, heel = a && coin(0.15);
    let dfam = fam;
    if (fam === 'poss') { dfam = R(NL_POSS)[0]; }
    if (fam !== 'bare') { const w = nlDet(dfam, n.g, num); out.push(nlDetC(w, dfam === 'ons' ? 'ons' : dfam));
      if (fam === 'def') extra.push(nlDetC(num === 'p' || n.g === 'de' ? 'het' : 'de', 'def')); }
    if (a && a.attr) { const w = nlAdjForm(a, fam === 'bare' ? null : dfam, n.g, num); if (heel) out.push(nlHeelC()); out.push(nlAdjC(a, w)); extra.push(nlAdjC(a, w === a.pred ? a.attr : a.pred)); }
    out.push(nlNounC(n, num));
    return { fam, num, n };
  };
  const subjOf = (who, f0) => {   // [chips, verb form]
    if (coin(0.5)) { const r = R(NL_PRON.filter(r => r[0] !== 'ze')); return [[nlPronC(r[0])], r[4]]; }
    const n = nounOf(who === 'p' ? ['person'] : ['person', 'animal']), num = n.pl && coin(0.3) ? 'p' : 's', out = [];
    np(n, num, out, { noBare: true }); return [out, num === 'p' ? 5 : 2];
  };
  // one sentence part: o.sub = after omdat / dat, o.front = start with a time word, o.shared = same subject (no subject)
  const clause = (o = {}) => {
    const pick = R(['tr', 'tr', 'tr', 'in', 'in', 'go', 'zijn', 'zijn', 'hebben', 'feel', 'sep', 'modal', 'gaan', ...(o.noSay ? [] : ['say'])]);
    let FV, G, modal = null, sep = false;
    const vs = t => NL_VERB.filter(v => v.t === t && !v.part);
    if (pick === 'modal' || pick === 'gaan') { modal = pick === 'gaan' ? nlVerbByInf('gaan') : R(vs('modal')); G = R(NL_VERB.filter(v => ['tr', 'in'].includes(v.t))); }
    else if (pick === 'sep') G = R(NL_VERB.filter(v => v.part));
    else if (pick === 'feel') G = nlVerbByInf('hebben');
    else G = R(vs(pick === 'hebben' ? 'hebben' : pick)) || R(vs('tr'));
    if (pick === 'say' && o.sub) G = R(vs('in'));
    sep = !!G.part;
    FV = modal || G;
    const who = G.who;
    let [subj, f] = o.shared ? [[], o.shared.f] : subjOf(who);
    const neg = coin(0.25);
    const obj = [], pp = [], pred = [], adv = [], objPron = [];
    let objDef = false, negDone = false;
    if (['tr', 'hebben'].includes(G.t) && (G.need || coin(0.7))) {
      if (pick === 'feel') { const n = R(NL_NOUN.filter(n => n.cat === 'feel')); if (neg) { obj.push(nlDetC('geen', 'geen')); negDone = true; } obj.push(nlNounC(n, 's')); }
      else if (G.objs.includes('person') && coin(0.4)) { const r = R(NL_PRON.filter(r => r[0] !== 'ze' && r[4] !== f)); objPron.push(nlPronC(r[1])); objDef = true; }
      else {
        const n = nounOf(G.t === 'hebben' ? G.objs.filter(c => c !== 'place') : G.objs), num = n.pl && coin(0.35) ? 'p' : 's';
        let fam = null;
        if (neg && coin(0.6)) { fam = 'geen'; negDone = true; }
        const r = np(n, num, obj, { bare: true, fam });
        objDef = !['een', 'geen', 'bare', 'twee', 'drie'].includes(r.fam);
        if (neg && !negDone && !objDef) { obj.length = 0; const r2 = np(n, num, obj, { bare: true, fam: 'geen' }); negDone = true; }
      }
    }
    if (G.t === 'go' && (G.need || coin(0.7))) {
      const x = R(['home', 'school', 'place', 'place', 'person']);
      if (x === 'home') pp.push(nlPrepC('naar'), nlNounC(nlNounOf('huis'), 's'));
      else if (x === 'school') pp.push(nlPrepC('naar'), nlNounC(nlNounOf('school'), 's'));
      else { pp.push(nlPrepC('naar')); np(nounOf([x]), 's', pp, { noBare: true, adj: false }); }
      extra.push(nlPrepC('in'));
    }
    if (G.t === 'zijn') {
      if (coin(0.6)) { const a = R(NL_ADJ.filter(a => a.d.includes('p'))); if (coin(0.2)) pred.push(nlHeelC()); pred.push(nlAdjC(a, a.pred)); if (a.attr) extra.push(nlAdjC(a, a.attr)); }
      else if (coin(0.5)) adv.push(nlAdvC(R(['thuis', 'hier'])));
      else { const n = nounOf(['place']); if (n.bare && coin(0.5)) pp.push(nlPrepC(n.p), nlNounC(n, 's')); else { pp.push(nlPrepC(n.p)); np(n, 's', pp, { noBare: true, adj: false }); } extra.push(nlPrepC('naar')); }
    }
    if (G.loc && coin(0.3)) adv.push(nlAdvC('hier'));
    else if (['in'].includes(G.t) && (G.loc || coin(0.35))) { const n = nounOf(['place']); pp.push(nlPrepC(n.p)); np(n, 's', pp, { noBare: true, adj: false, fam: 'def' }); }
    if (G.t === 'in' && coin(0.15)) { pp.push(nlPrepC('met')); np(nounOf(['person']), 's', pp, { noBare: true, adj: false }); }
    if (['in', 'tr'].includes(G.t) && NL_HOW_VERBS.test(G.inf) && coin(0.2)) adv.push(nlAdvC(R(['goed', 'veel'])));
    else if (['in', 'tr'].includes(G.t) && !modal && coin(0.15)) adv.push(nlAdvC('graag'));
    const timeW = coin(0.3) ? R(NL_ADV.filter(a => a[2] === 'time' && (a[0] !== 'vroeg' || G.inf === 'opstaan')))[0] : null, freqW = !timeW && coin(0.15) ? R(['vaak', 'altijd']) : null;
    const front = timeW && timeW !== 'vroeg' && !o.sub && !o.shared && coin(0.5);
    // jij after the verb: the form without -t
    const jijInv = front && subj.length === 1 && subj[0].w === 'jij';
    const finX = jijInv ? (FV.inv || [FV.f[0]]) : f;
    const nietC = neg && !negDone ? [nlNietC()] : [];
    if (!neg) extra.push(nlNietC());
    const time = timeW && !front ? [nlAdvC(timeW)] : [], freq = freqW ? [nlAdvC(freqW)] : [];
    const middle = objDef || !obj.length
      ? [...objPron, ...time, ...freq, ...obj, ...nietC, ...adv, ...pp, ...pred]
      : [...objPron, ...time, ...freq, ...nietC, ...adv, ...obj, ...pp, ...pred];
    let out;
    if (o.sub) {
      const cluster = modal ? [nlVerbC(FV, f), nlInfC(G)] : [nlVerbC(FV, f, sep)];
      out = [...subj, ...middle, ...cluster];
      if (sep) extra.push(nlPartC(G));
    } else {
      const fin = nlVerbC(FV, finX), end = modal ? [nlInfC(G)] : sep ? [nlPartC(G)] : [];
      if (modal) extra.push(nlVerbC(G, f));
      if (front) out = [nlAdvC(timeW), fin, ...subj, ...middle, ...end];
      else out = [...subj, fin, ...middle, ...end];
      if (o.shared) out = [fin, ...middle, ...end];
    }
    extra.push(nlVerbC(FV, (f + 1 + Math.floor(Math.random() * 5)) % 6));
    return { out, f, kind: pick, subjChips: subj };
  };
  for (let tries = 0; tries < 150; tries++) {
    extra.length = 0;
    const first = clause();
    let words = first.out;
    const r = Math.random();
    if (first.kind === 'say') { const s = clause({ sub: true }); words = [...words, nlConjC('dat'), ...s.out]; }
    else if (r < 0.15) { const s = clause({ sub: true }); words = [...words, nlConjC('omdat'), ...s.out]; extra.push(nlConjC('want')); }
    else if (r < 0.2) { const s = clause({ sub: true }); const m = clause({ noSay: true }); const vi = m.out.findIndex(c => c.k === 'verb');
      // "Omdat ik moe ben, blijf ik thuis": the verb comes right after the omdat part
      words = [nlConjC('omdat'), ...s.out, m.out[vi], ...m.out.slice(0, vi).filter(c => c.k !== 'adv'), ...m.out.slice(vi + 1)]; }
    else if (r < 0.26) { const c2 = clause({ noSay: true }); words = [...words, nlConjC('want'), ...c2.out]; extra.push(nlConjC('omdat')); }
    else if (r < 0.36) { const share = coin(0.3); const c2 = clause(share ? { shared: { f: first.f }, noSay: true } : { noSay: true }); words = [...words, nlConjC(R(['en', 'en', 'maar', 'of'])), ...c2.out]; }
    if (words.length > 16 || words.length < 2) continue;
    const res = nlCheck(words); if (!res.ok) continue;
    extra.push(nlPronC(R(['ik', 'hij', 'zij', 'wij', 'jij'])), nlPrepC(R(['in', 'met', 'naar', 'op', 'voor'])));
    if (!words.some(w => w.k === 'conj')) extra.push(nlConjC(R(['en', 'maar', 'omdat'])));
    const seen = new Set(words.map(w => w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && x.w && !seen.has(x.w)) { seen.add(x.w); uniq.push(x); }
    return { words, extra: uniq.slice(0, Math.max(4, 16 - words.length)), english: nlEnglish(res.P) };
  }
  return null;
}
const nlNounOf = w => NL_NOUN.find(n => n.w === w);

BLD_LANGS.nl = { name: 'Dutch', check: nlCheck, gen: nlGenerate, voice: 'nl-NL', english: nlEnglish, text: nlText, types: ['pron', 'noun', 'verb', 'adj', 'det', 'prep', 'conj', 'adv', 'part'] };
BLD_ORDER.nl = { rows: [
    ['A basic sentence', [['det', 'de / het / een'], ['adj', '(adjective)'], ['noun', 'noun'], ['verb', 'verb'], ['det', 'de / een'], ['adj', '(adjective)'], ['noun', 'noun']]],
    ['The verb comes second', [['adv', 'vandaag'], ['verb', 'verb'], ['pron', 'ik'], ['det', 'determiner'], ['noun', 'noun']]],
    ['A verb that splits (opbellen)', [['pron', 'ik'], ['verb', 'bel'], ['pron', '(je)'], ['part', 'op']]],
    ['Can, want, must… + a second verb', [['pron', 'ik'], ['verb', 'wil'], ['noun', '(water)'], ['verb', 'drinken']]],
    ['Saying what something is like (zijn)', [['det', 'de'], ['noun', 'noun'], ['verb', 'is'], ['adv', '(heel)'], ['adj', 'adjective']]],
    ['A negative sentence', [['pron', 'ik'], ['verb', 'verb'], ['det', 'de'], ['noun', 'noun'], ['adv', 'niet']]],
    ['Going somewhere', [['pron', 'ik'], ['verb', 'ga'], ['prep', 'naar'], ['det', '(het)'], ['noun', 'place']]],
    ['Because… (verb at the end)', [['verb', 'sentence'], ['conj', ', omdat'], ['pron', 'ik'], ['adj', '(…)'], ['verb', 'verb']]],
  ], tips: [
    ['det', 'Nouns are <b>de</b>-words or <b>het</b>-words: <b>de</b> hond, <b>het</b> huis. Every plural takes <b>de</b> (de huizen), and words ending in <b>-je</b> are always het-words: <b>het</b> hondje. One: <b>een</b>. None: <b>geen</b>.'],
    ['adj', 'Before a noun, describing words get <b>-e</b>: de <b>grote</b> hond, het <b>grote</b> huis. With een, geen or no word before a het-word, no -e: een <b>groot</b> huis. After zijn, never: de hond is <b>groot</b>.'],
    ['verb', 'The verb is always the <b>second</b> part: <b>Vandaag speel ik</b> buiten. When <b>jij</b> comes after the verb, the -t goes: <b>werk jij</b>. After <b>omdat</b> and <b>dat</b> the verb goes to the end: …, omdat ik moe <b>ben</b>. After <b>want</b> it stays second.'],
    ['part', 'Some verbs split: <b>opbellen</b> → ik <b>bel</b> je <b>op</b>. At the end of an omdat sentence they join again: …, omdat ik je <b>opbel</b>.'],
    ['verb', 'With kunnen, willen, moeten, mogen and gaan, the second verb goes to the end: ik <b>wil</b> water <b>drinken</b>, ik <b>ga</b> morgen <b>zwemmen</b>.'],
    ['adv', '<b>niet</b> goes after de / het words and short words like hem (ik zie de hond <b>niet</b>) and before places and describing words (ik ben <b>niet</b> moe). With een or no word, say <b>geen</b>: ik heb <b>geen</b> hond.'],
    ['prep', 'Going somewhere: <b>naar</b> het park, <b>naar</b> school, <b>naar huis</b>. Being there: <b>in</b> het park, <b>op</b> school, <b>thuis</b>.'] ] };

/* ---------------- Your own Dutch words (📚 Add my deck's words) ---------------- */
// ik, jij, hij/zij, wij, jullie, zij of verbs that don't follow the pattern
const NL_IRREG_FORMS = {
  zijn: 'ben bent is zijn zijn zijn', hebben: 'heb hebt heeft hebben hebben hebben', gaan: 'ga gaat gaat gaan gaan gaan', staan: 'sta staat staat staan staan staan',
  slaan: 'sla slaat slaat slaan slaan slaan', doen: 'doe doet doet doen doen doen', zien: 'zie ziet ziet zien zien zien', komen: 'kom komt komt komen komen komen',
  kunnen: 'kan kunt kan kunnen kunnen kunnen', willen: 'wil wilt wil willen willen willen', mogen: 'mag mag mag mogen mogen mogen', zullen: 'zal zult zal zullen zullen zullen',
  moeten: 'moet moet moet moeten moeten moeten', weten: 'weet weet weet weten weten weten', worden: 'word wordt wordt worden worden worden', vinden: 'vind vindt vindt vinden vinden vinden',
};
const NL_SEP = /^(op|mee|af|uit|aan|terug|weg|binnen|buiten|open|dicht|schoon|thuis|voor|na|langs|door|over|toe|bij|in)(?=[a-z]{4,}$)/;
const NL_SEP_BASE = new Set('bellen staan komen wassen ruimen doen nodigen maken halen zetten leggen brengen geven nemen gaan kijken zoeken pakken vullen lopen trekken stappen schrijven ruimen letten passen vallen houden bouwen hangen sluiten slaan zeggen spreken bieden horen roepen'.split(' '));
const nlVowelGroups = s => (s.match(/[aeiouyéë]+/g) || []).length;
// a word + -e / -en: groot → grote, kat → katten, huis → huizen, lief → lieve
function nlAddE(w, suf) {
  let s = String(w || '');
  if (/(aa|ee|oo|uu)[^aeiou]$/.test(s)) s = s.replace(/(aa|ee|oo|uu)([^aeiou])$/, (m, v, c) => v[0] + c);
  else if (/(^|[^aeiou])[aeiou][^aeiouwjy]$/.test(s) && !(nlVowelGroups(s) > 1 && /(el|er|en|em|ig)$/.test(s))) s = s + s.slice(-1);
  if (/([aeiou]{2}|ie|ui|ei|ij|ou|au|eu|oe|[^aeiou][aeiou])f$/.test(s) && !/ff$/.test(s)) s = s.slice(0, -1) + 'v';
  else if (/([aeiou]{2}|ie|ui|ei|ij|ou|au|eu|oe|[^aeiou][aeiou])s$/.test(s) && !/ss$/.test(s)) s = s.slice(0, -1) + 'z';
  return s + suf;
}
// the ik form of a regular verb: spelen → speel, zwemmen → zwem, schrijven → schrijf, lezen → lees
function nlStem(inf) {
  let s = inf.replace(/en$/, '');
  if (/([^aeiou])\1$/.test(s)) s = s.slice(0, -1);
  else if (/(^|[^aeiou])[aeiou][^aeiouwjy]$/.test(s) && !(nlVowelGroups(s) > 1 && /(el|er|en|em|ig)$/.test(s))) s = s.replace(/([aeiou])([^aeiou])$/, '$1$1$2');
  return s.replace(/v$/, 'f').replace(/z$/, 's');
}
function nlConjugate(inf, noSep) {
  inf = String(inf || '').trim().toLowerCase();
  const m = !noSep && inf.match(NL_SEP);
  if (m && !NL_IRREG_FORMS[inf] && !/^(be|ge|ver|ont|her)/.test(inf)) {
    const base = inf.slice(m[1].length);
    if (NL_IRREG_FORMS[base] || NL_SEP_BASE.has(base) || NL_VERB.some(v => !v.part && v.inf === base)) return nlConjugate(base, true).map(f => f + ' ' + m[1]);
  }
  if (NL_IRREG_FORMS[inf]) return NL_IRREG_FORMS[inf].split(' ');
  const st = nlStem(inf), t = /t$/.test(st) ? st : st + 't';
  return [st, t, t, inf, inf, inf];
}
// the plural of a noun (a good guess: check the ones that look wrong)
function nlPl(w) {
  const W = String(w || '');
  if (/je$/.test(W)) return W + 's';
  if (/(el|er|em|en|ie|é)$/.test(W) && nlVowelGroups(W) > 1) return W + 's';
  if (/[aiouy]$/.test(W)) return W + "'s";
  if (/e$/.test(W)) return W + 's';
  return nlAddE(W, 'en');
}
const nlGenderGuess = w => /(je|um|ment)$/.test(w) ? 'f' : 'm';   // f stands for het (the dialog's second choice)
const nlAdjForms = w => { w = String(w || ''); const attr = /(en|e)$/.test(w) ? w : nlAddE(w, 'e'); return [w, attr]; };
const NL_BASE = { n: NL_NOUN.length, a: NL_ADJ.length, v: NL_VERB.length };
const nlKnown = w => { w = String(w || '').toLowerCase();
  return NL_NOUN.slice(0, NL_BASE.n).some(n => n.w === w || n.pl === w) || NL_VERB.slice(0, NL_BASE.v).some(v => v.inf === w || v.f.includes(w))
    || NL_ADJ.slice(0, NL_BASE.a).some(a => a.pred === w || a.attr === w) || NL_PRON.some(p => p[0] === w || p[1] === w) || nlDetReads(w).length || NL_PREP.some(p => p[0] === w)
    || NL_CONJ.some(c => c[0] === w) || NL_ADV.some(a => a[0] === w) || ['niet', 'heel'].includes(w); };
function nlApplyMine() {
  NL_NOUN.length = NL_BASE.n; NL_ADJ.length = NL_BASE.a; NL_VERB.length = NL_BASE.v;
  for (const m of S.bldWords || []) {
    if (!m || m.lang !== 'nl' || !m.w || !m.en || nlKnown(m.w)) continue;
    const w = String(m.w).toLowerCase();
    if (m.k === 'noun') { const g = m.g === 'f' || m.g === 'n' || /je$/.test(w) ? 'het' : 'de'; NL_NOUN.push(NN(w, m.pl || null, g, m.cat || 'thing', m.en, m.pl ? (m.enPl || bldPlEn(m.en)) : null, { ...(m.pl ? {} : { mass: 2 }), ...(m.cat === 'place' ? { p: 'in' } : {}) })); }
    if (m.k === 'verb' && Array.isArray(m.forms) && m.forms.length === 6) {
      const sp = m.forms.every(f => / /.test(f)) ? m.forms[0].split(' ').pop() : null;
      const forms = sp ? m.forms.map(f => f.split(' ')[0]) : m.forms;
      if (forms.some(f => /\s/.test(f))) continue;
      const type = m.obj === 'in' ? 'in' : 'tr', objs = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read', 'place'];
      NL_VERB.push(NV(w, forms.join(' '), type, type === 'in' ? null : objs, 0, m.en, bld3sEn(m.en), m.who === 'a' ? 'a' : 'p', sp ? { part: sp } : {}));
    }
    if (m.k === 'adj') { const [pred, attr] = nlAdjForms(w); NL_ADJ.push(NA(pred, attr, m.en, 'patflr')); }
  }
}
// builder.js calls bldApplyMine() when the game starts: add the Dutch words to it
if (typeof bldApplyMine === 'function') { const prevApply = bldApplyMine; bldApplyMine = function () { prevApply(); nlApplyMine(); }; }
BLD_MINE.nl = { name: 'Dutch', forms: 'ik, jij, hij/zij, wij, jullie, zij (a verb that splits: bel op, belt op…)', nForms: 6, m: 'de (a de-word)', f: 'het (a het-word)',
  conj: w => nlConjugate(w), pl: w => nlPl(w), adj: w => nlAdjForms(w),
  known: w => nlKnown(w), gender: w => nlGenderGuess(w), isVerb: w => /^[a-zëé]+(en|n)$/.test(w) && w.length > 3, refl: () => false,
  parse: s => { const m = s.match(/^(de|het)\s+(\p{L}+)$/u); if (m) return { w: m[2], g: m[1] === 'het' ? 'f' : 'm', art: true };
    const e = s.match(/^een\s+(\p{L}+)$/u); if (e) return { w: e[1], art: true };
    return /^\p{L}+$/u.test(s) ? { w: s } : null; },
  intro: 'words with <i>de/het</i> are nouns, and words like <i>“to …”</i> are verbs). Verb forms are filled in for you, including verbs that split (opbellen → bel op); check any that look wrong.' };
