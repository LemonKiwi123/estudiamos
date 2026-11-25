'use strict';
/* ================= Sentence Builder: German =================
   Every word on the tray is one chip; the checker explains the first mistake it finds.
   German checks: der / die / das, ein / eine and kein in the four cases (nominative for who does it, accusative for
   what you eat or see and after für / ohne, dative after mit / zu / von and for helfen, genitive for whose: das Buch
   meines Bruders); in / an / auf take the accusative when you go somewhere (in den Park) and the dative when you are
   there (im Park); im, ins, am, zum, zur join the article on; adjective endings after der, after ein and with no
   article (der große Hund, ein großer Hund, große Hunde); weak nouns (den Jungen); -n in the dative plural (mit den
   Kindern); the verb comes second in a main sentence (Heute spiele ich …) and last after weil / dass; separable verbs
   split in a main sentence (ich rufe dich an) and stay whole at the end (…, weil ich dich anrufe); modal verbs send the
   other verb to the end (ich will Wasser trinken); nicht and kein; nouns start with a capital letter.
   Loaded after builder.js and builder-ja.js (which adds the "particle" word type that an, auf, fern… use). */

const DE_CASE_NAME = { nom: 'nominative', acc: 'accusative', dat: 'dative', gen: 'genitive' };
const DE_G_NAME = { m: 'masculine', f: 'feminine', n: 'neuter' };
const DE_DER = { nom: { m: 'der', f: 'die', n: 'das', p: 'die' }, acc: { m: 'den', f: 'die', n: 'das', p: 'die' }, dat: { m: 'dem', f: 'der', n: 'dem', p: 'den' }, gen: { m: 'des', f: 'der', n: 'des', p: 'der' } };
const DE_DIES = { nom: { m: 'dieser', f: 'diese', n: 'dieses', p: 'diese' }, acc: { m: 'diesen', f: 'diese', n: 'dieses', p: 'diese' }, dat: { m: 'diesem', f: 'dieser', n: 'diesem', p: 'diesen' }, gen: { m: 'dieses', f: 'dieser', n: 'dieses', p: 'dieser' } };
const DE_EIN_END = { nom: { m: '', f: 'e', n: '', p: 'e' }, acc: { m: 'en', f: 'e', n: '', p: 'e' }, dat: { m: 'em', f: 'er', n: 'em', p: 'en' }, gen: { m: 'es', f: 'er', n: 'es', p: 'er' } };
// adjective endings: after der / dieser (weak), after ein / kein / mein (mixed), with no article (strong)
const DE_WEAK = { nom: { m: 'e', f: 'e', n: 'e', p: 'en' }, acc: { m: 'en', f: 'e', n: 'e', p: 'en' }, dat: { m: 'en', f: 'en', n: 'en', p: 'en' }, gen: { m: 'en', f: 'en', n: 'en', p: 'en' } };
const DE_MIXED = { nom: { m: 'er', f: 'e', n: 'es', p: 'en' }, acc: { m: 'en', f: 'e', n: 'es', p: 'en' }, dat: { m: 'en', f: 'en', n: 'en', p: 'en' }, gen: { m: 'en', f: 'en', n: 'en', p: 'en' } };
const DE_STRONG = { nom: { m: 'er', f: 'e', n: 'es', p: 'e' }, acc: { m: 'en', f: 'e', n: 'es', p: 'e' }, dat: { m: 'em', f: 'er', n: 'em', p: 'en' }, gen: { m: 'en', f: 'er', n: 'en', p: 'er' } };
const DE_CASES = ['nom', 'acc', 'dat', 'gen'];
//            stem     English (one / more than one)
const DE_POSS = [['mein', 'my'], ['dein', 'your'], ['sein', 'his'], ['ihr', 'her'], ['unser', 'our'], ['euer', 'your'], ['ihr', 'their']];
const deKey = (g, num) => num === 'p' ? 'p' : g;
// the determiner for a family (der, dies, ein, kein, mein…, zwei, drei) in a case
function deDet(fam, c, g, num) {
  const k = deKey(g, num);
  if (fam === 'der') return DE_DER[c][k];
  if (fam === 'dies') return DE_DIES[c][k];
  if (fam === 'zwei' || fam === 'drei') return num === 'p' ? fam : null;
  if (fam === 'ein' && num === 'p') return null;
  const end = DE_EIN_END[c][k];
  return fam === 'euer' && end ? 'eur' + end : fam + end;
}
const deAdjTable = fam => !fam || fam === 'zwei' || fam === 'drei' ? DE_STRONG : fam === 'der' || fam === 'dies' ? DE_WEAK : DE_MIXED;
const deAdjForm = (a, c, g, num, fam) => a.stem + deAdjTable(fam)[c][deKey(g, num)];
const deGenS = w => /(s|ß|x|z|sch)$/.test(w) ? w + 'es' : w + 's';
// the noun in a case: weak nouns (der Junge → den Jungen), -s / -es in the genitive, -n in the dative plural
function deNounForm(n, c, num) {
  if (num === 'p') { if (!n.pl) return null; return c === 'dat' && !/[ns]$/.test(n.pl) ? n.pl + 'n' : n.pl; }
  if (n.weak) return c === 'nom' ? n.w : n.weak;
  if (c === 'gen' && n.g !== 'f') return n.gen || deGenS(n.w);
  return n.w;
}
/* ---------- the word lists ---------- */
//  word, plural, gender, kind, English, English plural, extras: mass (1 = can't count, 2 = can also say "ein"), gen, weak,
//  p = the preposition for a place (in den Park / im Park, an den Strand / am Strand, auf den Markt / auf dem Markt), fam = family
const DN = (w, pl, g, cat, en, enPl, x = {}) => ({ w, pl, g, cat, en, enPl, ...x });
const DE_NOUN = [
  DN('Mann', 'Männer', 'm', 'person', 'man', 'men', { gen: 'Mannes' }), DN('Frau', 'Frauen', 'f', 'person', 'woman', 'women'), DN('Junge', 'Jungen', 'm', 'person', 'boy', 'boys', { weak: 'Jungen' }),
  DN('Mädchen', 'Mädchen', 'n', 'person', 'girl', 'girls'), DN('Kind', 'Kinder', 'n', 'person', 'child', 'children', { gen: 'Kindes' }), DN('Freund', 'Freunde', 'm', 'person', 'friend', 'friends', { gen: 'Freundes' }),
  DN('Freundin', 'Freundinnen', 'f', 'person', 'friend', 'friends'), DN('Mutter', 'Mütter', 'f', 'person', 'mother', 'mothers', { fam: 1 }), DN('Vater', 'Väter', 'm', 'person', 'father', 'fathers', { fam: 1 }),
  DN('Bruder', 'Brüder', 'm', 'person', 'brother', 'brothers', { fam: 1 }), DN('Schwester', 'Schwestern', 'f', 'person', 'sister', 'sisters', { fam: 1 }), DN('Oma', 'Omas', 'f', 'person', 'grandma', 'grandmas', { fam: 1 }),
  DN('Opa', 'Opas', 'm', 'person', 'grandpa', 'grandpas', { fam: 1 }), DN('Lehrer', 'Lehrer', 'm', 'person', 'teacher', 'teachers'), DN('Lehrerin', 'Lehrerinnen', 'f', 'person', 'teacher', 'teachers'),
  DN('Arzt', 'Ärzte', 'm', 'person', 'doctor', 'doctors', { gen: 'Arztes' }), DN('Student', 'Studenten', 'm', 'person', 'student', 'students', { weak: 'Studenten' }),
  DN('Hund', 'Hunde', 'm', 'animal', 'dog', 'dogs', { gen: 'Hundes' }), DN('Katze', 'Katzen', 'f', 'animal', 'cat', 'cats'), DN('Vogel', 'Vögel', 'm', 'animal', 'bird', 'birds'),
  DN('Pferd', 'Pferde', 'n', 'animal', 'horse', 'horses', { gen: 'Pferdes' }), DN('Maus', 'Mäuse', 'f', 'animal', 'mouse', 'mice'), DN('Fisch', 'Fische', 'm', 'animal', 'fish', 'fish', { gen: 'Fisches' }),
  DN('Brot', 'Brote', 'n', 'food', 'bread', 'loaves of bread', { mass: 2 }), DN('Käse', null, 'm', 'food', 'cheese', null, { mass: 1 }), DN('Reis', null, 'm', 'food', 'rice', null, { mass: 1 }),
  DN('Fleisch', null, 'n', 'food', 'meat', null, { mass: 1 }), DN('Suppe', 'Suppen', 'f', 'food', 'soup', 'soups', { mass: 2 }), DN('Schokolade', null, 'f', 'food', 'chocolate', null, { mass: 1 }),
  DN('Eis', null, 'n', 'food', 'ice cream', null, { mass: 2 }), DN('Apfel', 'Äpfel', 'm', 'food', 'apple', 'apples'), DN('Banane', 'Bananen', 'f', 'food', 'banana', 'bananas'),
  DN('Kuchen', 'Kuchen', 'm', 'food', 'cake', 'cakes', { mass: 2 }), DN('Ei', 'Eier', 'n', 'food', 'egg', 'eggs'), DN('Pizza', 'Pizzas', 'f', 'food', 'pizza', 'pizzas'),
  DN('Keks', 'Kekse', 'm', 'food', 'cookie', 'cookies'), DN('Salat', 'Salate', 'm', 'food', 'salad', 'salads', { mass: 2 }),
  DN('Wasser', null, 'n', 'drink', 'water', null, { mass: 1 }), DN('Milch', null, 'f', 'drink', 'milk', null, { mass: 1 }), DN('Kaffee', null, 'm', 'drink', 'coffee', null, { mass: 2 }),
  DN('Tee', null, 'm', 'drink', 'tea', null, { mass: 2 }), DN('Saft', null, 'm', 'drink', 'juice', null, { mass: 2 }),
  DN('Buch', 'Bücher', 'n', 'read', 'book', 'books'), DN('Brief', 'Briefe', 'm', 'read', 'letter', 'letters'), DN('Zeitung', 'Zeitungen', 'f', 'read', 'newspaper', 'newspapers'),
  DN('Zeitschrift', 'Zeitschriften', 'f', 'read', 'magazine', 'magazines'), DN('Geschichte', 'Geschichten', 'f', 'read', 'story', 'stories'),
  DN('Park', 'Parks', 'm', 'place', 'park', 'parks', { p: 'in' }), DN('Schule', 'Schulen', 'f', 'place', 'school', 'schools', { p: 'in', alt: ['auf', 'an'] }), DN('Kino', 'Kinos', 'n', 'place', 'movie theater', 'movie theaters', { p: 'in' }),
  DN('Stadt', 'Städte', 'f', 'place', 'town', 'towns', { p: 'in' }), DN('Küche', 'Küchen', 'f', 'place', 'kitchen', 'kitchens', { p: 'in' }), DN('Supermarkt', 'Supermärkte', 'm', 'place', 'supermarket', 'supermarkets', { p: 'in' }),
  DN('Restaurant', 'Restaurants', 'n', 'place', 'restaurant', 'restaurants', { p: 'in' }), DN('Bibliothek', 'Bibliotheken', 'f', 'place', 'library', 'libraries', { p: 'in' }),
  DN('Büro', 'Büros', 'n', 'place', 'office', 'offices', { p: 'in' }), DN('Bahnhof', 'Bahnhöfe', 'm', 'place', 'station', 'stations', { p: 'an', go: 'zu', alt: ['in', 'auf'] }), DN('Strand', 'Strände', 'm', 'place', 'beach', 'beaches', { p: 'an' }),
  DN('Markt', 'Märkte', 'm', 'place', 'market', 'markets', { p: 'auf' }), DN('Zoo', 'Zoos', 'm', 'place', 'zoo', 'zoos', { p: 'in' }), DN('Garten', 'Gärten', 'm', 'place', 'garden', 'gardens', { p: 'in' }),
  DN('Café', 'Cafés', 'n', 'place', 'café', 'cafés', { p: 'in' }), DN('Museum', 'Museen', 'n', 'place', 'museum', 'museums', { p: 'in' }),
  DN('Auto', 'Autos', 'n', 'thing', 'car', 'cars'), DN('Tisch', 'Tische', 'm', 'thing', 'table', 'tables'), DN('Stuhl', 'Stühle', 'm', 'thing', 'chair', 'chairs'), DN('Handy', 'Handys', 'n', 'thing', 'phone', 'phones'),
  DN('Ball', 'Bälle', 'm', 'thing', 'ball', 'balls'), DN('Blume', 'Blumen', 'f', 'thing', 'flower', 'flowers'), DN('Tür', 'Türen', 'f', 'thing', 'door', 'doors'), DN('Fenster', 'Fenster', 'n', 'thing', 'window', 'windows'),
  DN('Geschenk', 'Geschenke', 'n', 'thing', 'gift', 'gifts'), DN('Fahrrad', 'Fahrräder', 'n', 'thing', 'bike', 'bikes'), DN('Tasche', 'Taschen', 'f', 'thing', 'bag', 'bags'), DN('Uhr', 'Uhren', 'f', 'thing', 'watch', 'watches'),
  DN('Lampe', 'Lampen', 'f', 'thing', 'lamp', 'lamps'), DN('Computer', 'Computer', 'm', 'thing', 'computer', 'computers'), DN('Hut', 'Hüte', 'm', 'thing', 'hat', 'hats'),
  // with haben and no article: ich habe Hunger (I'm hungry), ich habe keine Zeit (I don't have time)
  DN('Hunger', null, 'm', 'feel', 'hungry', null, { mass: 1 }), DN('Durst', null, 'm', 'feel', 'thirsty', null, { mass: 1 }), DN('Angst', null, 'f', 'feel', 'scared', null, { mass: 1 }),
  DN('Zeit', null, 'f', 'feel', 'time', null, { mass: 1, have: 1 }),
  // only in "nach Hause" (home) and "zu Hause" (at home)
  DN('Hause', null, 'n', 'home', 'home', null, { mass: 1 })];
const DE_OPENABLE = ['Tür', 'Fenster', 'Buch', 'Brief', 'Tasche', 'Zeitung', 'Zeitschrift', 'Geschenk', 'Kino', 'Büro', 'Café', 'Restaurant', 'Supermarkt', 'Museum', 'Bibliothek'];
//            describes: p people, a animals, f food and drinks, t things, l places, r things you read
const DA = (pred, en, d, stem = pred) => ({ pred, stem, en, d });
const DE_ADJ = [DA('groß', 'big', 'patl'), DA('klein', 'small', 'patl'), DA('alt', 'old', 'patlr'), DA('neu', 'new', 'tlr'), DA('gut', 'good', 'pafrl'), DA('schön', 'beautiful', 'patl'),
  DA('jung', 'young', 'pa'), DA('rot', 'red', 'tf'), DA('blau', 'blue', 't'), DA('grün', 'green', 'tf'), DA('schwarz', 'black', 'at'), DA('weiß', 'white', 'atf'), DA('gelb', 'yellow', 'tf'),
  DA('teuer', 'expensive', 'tflr', 'teur'), DA('billig', 'cheap', 'tf'), DA('lecker', 'delicious', 'f'), DA('kalt', 'cold', 'f'), DA('warm', 'warm', 'f'), DA('heiß', 'hot', 'f'),
  DA('sauber', 'clean', 'tl'), DA('schmutzig', 'dirty', 'tl'), DA('müde', 'tired', 'pa', 'müd'), DA('glücklich', 'happy', 'pa'), DA('traurig', 'sad', 'pa'), DA('nett', 'nice', 'p'),
  DA('lustig', 'funny', 'pr'), DA('krank', 'sick', 'pa'), DA('schnell', 'fast', 'pat'), DA('interessant', 'interesting', 'r'), DA('langweilig', 'boring', 'rl'), DA('freundlich', 'friendly', 'pa'), DA('klug', 'smart', 'pa')];
/* verbs: ich, du, er/sie/es, wir, ihr, sie. t = what kind of verb: tr (takes the accusative), dat (takes the dative:
   ich helfe dir), in (no object), go (needs where you go), sein, werden, haben, say (can take a dass sentence), modal.
   part = the separable part (an + rufen: ich rufe dich an). who: p = only people do it, a = people and animals. */
const DV = (inf, forms, t, objs, need, en, en3, who, x = {}) => ({ inf, f: forms.split(' '), t, objs, need, en, en3, who, ...x });
const DE_VERB = [
  DV('essen', 'esse isst isst essen esst essen', 'tr', ['food'], 0, 'eat', 'eats', 'a'), DV('trinken', 'trinke trinkst trinkt trinken trinkt trinken', 'tr', ['drink'], 0, 'drink', 'drinks', 'a'),
  DV('kochen', 'koche kochst kocht kochen kocht kochen', 'tr', ['food'], 0, 'cook', 'cooks', 'p'), DV('lesen', 'lese liest liest lesen lest lesen', 'tr', ['read'], 0, 'read', 'reads', 'p'),
  DV('schreiben', 'schreibe schreibst schreibt schreiben schreibt schreiben', 'tr', ['read'], 0, 'write', 'writes', 'p'),
  DV('kaufen', 'kaufe kaufst kauft kaufen kauft kaufen', 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'buy', 'buys', 'p'),
  DV('verkaufen', 'verkaufe verkaufst verkauft verkaufen verkauft verkaufen', 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'sell', 'sells', 'p'),
  DV('haben', 'habe hast hat haben habt haben', 'haben', ['*'], 1, 'have', 'has', 'a'), DV('mögen', 'mag magst mag mögen mögt mögen', 'tr', ['*'], 1, 'like', 'likes', 'a'),
  DV('suchen', 'suche suchst sucht suchen sucht suchen', 'tr', ['*'], 1, 'look for', 'looks for', 'a'), DV('sehen', 'sehe siehst sieht sehen seht sehen', 'tr', ['*'], 1, 'see', 'sees', 'a'),
  DV('lieben', 'liebe liebst liebt lieben liebt lieben', 'tr', ['*'], 1, 'love', 'loves', 'a'), DV('besuchen', 'besuche besuchst besucht besuchen besucht besuchen', 'tr', ['person', 'place'], 1, 'visit', 'visits', 'p'),
  DV('finden', 'finde findest findet finden findet finden', 'tr', ['*'], 1, 'find', 'finds', 'a'), DV('nehmen', 'nehme nimmst nimmt nehmen nehmt nehmen', 'tr', ['food', 'drink', 'read', 'thing'], 1, 'take', 'takes', 'p'),
  DV('brauchen', 'brauche brauchst braucht brauchen braucht brauchen', 'tr', ['food', 'drink', 'read', 'thing'], 1, 'need', 'needs', 'a'),
  DV('öffnen', 'öffne öffnest öffnet öffnen öffnet öffnen', 'tr', ['open'], 1, 'open', 'opens', 'p'), DV('fragen', 'frage fragst fragt fragen fragt fragen', 'tr', ['person'], 1, 'ask', 'asks', 'p'),
  DV('treffen', 'treffe triffst trifft treffen trefft treffen', 'tr', ['person'], 1, 'meet', 'meets', 'p'), DV('tragen', 'trage trägst trägt tragen tragt tragen', 'tr', ['thing'], 1, 'carry', 'carries', 'p'),
  DV('aufmachen', 'mache machst macht machen macht machen', 'tr', ['open'], 1, 'open', 'opens', 'p', { part: 'auf' }),
  DV('zumachen', 'mache machst macht machen macht machen', 'tr', ['open'], 1, 'close', 'closes', 'p', { part: 'zu' }),
  DV('anrufen', 'rufe rufst ruft rufen ruft rufen', 'tr', ['person'], 1, 'call', 'calls', 'p', { part: 'an' }),
  DV('helfen', 'helfe hilfst hilft helfen helft helfen', 'dat', ['person', 'animal'], 1, 'help', 'helps', 'a'), DV('danken', 'danke dankst dankt danken dankt danken', 'dat', ['person'], 1, 'thank', 'thanks', 'p'),
  DV('spielen', 'spiele spielst spielt spielen spielt spielen', 'in', null, 0, 'play', 'plays', 'a'), DV('arbeiten', 'arbeite arbeitest arbeitet arbeiten arbeitet arbeiten', 'in', null, 0, 'work', 'works', 'p'),
  DV('lernen', 'lerne lernst lernt lernen lernt lernen', 'in', null, 0, 'study', 'studies', 'p'), DV('wohnen', 'wohne wohnst wohnt wohnen wohnt wohnen', 'in', null, 0, 'live', 'lives', 'a'),
  DV('schlafen', 'schlafe schläfst schläft schlafen schlaft schlafen', 'in', null, 0, 'sleep', 'sleeps', 'a'), DV('schwimmen', 'schwimme schwimmst schwimmt schwimmen schwimmt schwimmen', 'in', null, 0, 'swim', 'swims', 'a'),
  DV('singen', 'singe singst singt singen singt singen', 'in', null, 0, 'sing', 'sings', 'a'), DV('tanzen', 'tanze tanzt tanzt tanzen tanzt tanzen', 'in', null, 0, 'dance', 'dances', 'p'),
  DV('sprechen', 'spreche sprichst spricht sprechen sprecht sprechen', 'in', null, 0, 'talk', 'talks', 'p'), DV('warten', 'warte wartest wartet warten wartet warten', 'in', null, 0, 'wait', 'waits', 'a'),
  DV('bleiben', 'bleibe bleibst bleibt bleiben bleibt bleiben', 'in', null, 0, 'stay', 'stays', 'a'),
  DV('aufstehen', 'stehe stehst steht stehen steht stehen', 'in', null, 0, 'get up', 'gets up', 'a', { part: 'auf' }), DV('einkaufen', 'kaufe kaufst kauft kaufen kauft kaufen', 'in', null, 0, 'go shopping', 'goes shopping', 'p', { part: 'ein' }),
  DV('fernsehen', 'sehe siehst sieht sehen seht sehen', 'in', null, 0, 'watch TV', 'watches TV', 'p', { part: 'fern' }), DV('mitkommen', 'komme kommst kommt kommen kommt kommen', 'in', null, 0, 'come along', 'comes along', 'a', { part: 'mit' }),
  DV('gehen', 'gehe gehst geht gehen geht gehen', 'go', null, 1, 'go', 'goes', 'a'), DV('fahren', 'fahre fährst fährt fahren fahrt fahren', 'go', null, 1, 'go', 'goes', 'p', { gloss: 'to go (by car, bus, bike…)' }),
  DV('kommen', 'komme kommst kommt kommen kommt kommen', 'go', null, 1, 'come', 'comes', 'a'),
  DV('sein', 'bin bist ist sind seid sind', 'sein', null, 1, 'be', 'is', 'a'), DV('werden', 'werde wirst wird werden werdet werden', 'werden', null, 1, 'get', 'gets', 'a', { gloss: 'to become / get' }),
  DV('wissen', 'weiß weißt weiß wissen wisst wissen', 'say', null, 0, 'know', 'knows', 'p'), DV('denken', 'denke denkst denkt denken denkt denken', 'say', null, 0, 'think', 'thinks', 'p'),
  DV('glauben', 'glaube glaubst glaubt glauben glaubt glauben', 'say', null, 0, 'believe', 'believes', 'p'), DV('sagen', 'sage sagst sagt sagen sagt sagen', 'say', null, 0, 'say', 'says', 'p'),
  // modal verbs: the other verb goes to the end. m = English [I / you…, he / she, with not, he / she with not]
  DV('können', 'kann kannst kann können könnt können', 'modal', null, 1, 'can', 'can', 'a', { m: ['can', 'can', 'cannot', 'cannot'] }),
  DV('wollen', 'will willst will wollen wollt wollen', 'modal', null, 1, 'want', 'wants', 'a', { m: ['want to', 'wants to', 'do not want to', 'does not want to'] }),
  DV('müssen', 'muss musst muss müssen müsst müssen', 'modal', null, 1, 'have to', 'has to', 'a', { m: ['have to', 'has to', 'do not have to', 'does not have to'] }),
  DV('dürfen', 'darf darfst darf dürfen dürft dürfen', 'modal', null, 1, 'may', 'may', 'p', { m: ['may', 'may', 'may not', 'may not'], gloss: 'to be allowed to' }),
  DV('sollen', 'soll sollst soll sollen sollt sollen', 'modal', null, 1, 'should', 'should', 'p', { m: ['should', 'should', 'should not', 'should not'] }),
  DV('möchten', 'möchte möchtest möchte möchten möchtet möchten', 'modal', null, 1, 'would like', 'would like', 'a', { m: ['would like to', 'would like to', 'would not like to', 'would not like to'], gloss: 'would like to' })];
//            nominative, accusative, dative, English (who does it), English (object), form (0 ich … 5 sie)
const DE_PRON = [['ich', 'mich', 'mir', 'I', 'me', 0], ['du', 'dich', 'dir', 'you', 'you', 1], ['er', 'ihn', 'ihm', 'he', 'him', 2], ['sie', 'sie', 'ihr', 'she', 'her', 2],
  ['wir', 'uns', 'uns', 'we', 'us', 3], ['ihr', 'euch', 'euch', 'you', 'you', 4], ['sie', 'sie', 'ihnen', 'they', 'them', 5]];
//            word, kind: time (can start the sentence), freq, gern, how (gut, viel), place (hier)
const DE_ADV = [['heute', 'today', 'time'], ['morgen', 'tomorrow', 'time'], ['jetzt', 'now', 'time'], ['früh', 'early', 'time'], ['oft', 'often', 'freq'], ['immer', 'always', 'freq'],
  ['gern', 'like to', 'gern'], ['gut', 'well', 'how'], ['viel', 'a lot', 'how'], ['hier', 'here', 'place']];
//            word, the preposition, the article it has in it, case it takes (two = acc for going, dat for being), English
const DE_PREP = [['in', 'in', null, 'two', 'in / into'], ['an', 'an', null, 'two', 'at / to'], ['auf', 'auf', null, 'two', 'on / at'], ['zu', 'zu', null, 'dat', 'to'], ['mit', 'mit', null, 'dat', 'with'],
  ['von', 'von', null, 'dat', 'from / of'], ['bei', 'bei', null, 'dat', 'at (someone’s)'], ['für', 'für', null, 'acc', 'for'], ['ohne', 'ohne', null, 'acc', 'without'], ['nach', 'nach', null, 'dat', 'to'],
  ['im', 'in', 'dem', 'dat', 'in the'], ['ins', 'in', 'das', 'acc', 'into the'], ['am', 'an', 'dem', 'dat', 'at the'], ['ans', 'an', 'das', 'acc', 'to the'], ['zum', 'zu', 'dem', 'dat', 'to the'],
  ['zur', 'zu', 'der', 'dat', 'to the'], ['beim', 'bei', 'dem', 'dat', 'at the'], ['vom', 'von', 'dem', 'dat', 'from the']];
const DE_JOIN = { 'in dem': 'im', 'in das': 'ins', 'an dem': 'am', 'an das': 'ans', 'zu dem': 'zum', 'zu der': 'zur', 'bei dem': 'beim', 'von dem': 'vom' };
const DE_CONJ = [['und', 'and'], ['aber', 'but'], ['oder', 'or'], ['weil', 'because', 1], ['dass', 'that', 1]];
const DE_KIND = { food: 'food', drink: 'drinks', read: 'things you read or write', thing: 'things', place: 'places', animal: 'animals', person: 'people', open: 'things you can open' };
const DE_HOW_VERBS = /^(spielen|arbeiten|lernen|schlafen|schwimmen|singen|tanzen|sprechen|kochen|essen|lesen|schreiben)$/;   // verbs that go with gut / viel
const DE_PARTS = ['an', 'auf', 'zu', 'ein', 'fern', 'mit'];

/* chips (each one carries its own English for the word tag) */
const deChip = o => chip({ ...o, gloss: o.gloss || o.en });
const dePronC = (w, en) => deChip({ k: 'pron', w, en });
const deDetC = (w, fam, en) => deChip({ k: 'det', w, fam, en, cls: ['der', 'ein'].includes(fam) ? 'art' : fam });
const deNounC = (n, c, num) => deChip({ k: 'noun', w: deNounForm(n, c, num), e: n, num, en: num === 'p' ? n.enPl || n.en : n.en });
const deAdjC = (a, w) => deChip({ k: 'adj', w, e: a, en: a.en });
const deVerbC = (v, f, joined) => deChip({ k: 'verb', w: (joined ? v.part : '') + v.f[f], e: v, f, joined: !!joined, en: v.en, gloss: v.gloss || 'to ' + v.en });
const deInfC = v => deChip({ k: 'verb', w: v.inf, e: v, inf: true, en: v.en, gloss: v.gloss || 'to ' + v.en });
const dePartC = v => deChip({ k: 'part', w: v.part, e: v, en: `(${v.inf})`, gloss: `part of ${v.inf}` });
const dePrepC = w => { const p = DE_PREP.find(x => x[0] === w); return deChip({ k: 'prep', w, base: p[1], art: p[2], cs: p[3], en: p[4] }); };
const deAdvC = w => { const a = DE_ADV.find(x => x[0] === w); return deChip({ k: 'adv', w, en: a[1], cls: a[2] }); };
const deNichtC = () => deChip({ k: 'neg', w: 'nicht', en: 'not' });
const deSehrC = () => deChip({ k: 'int', w: 'sehr', en: 'very' });
const deConjC = w => { const c = DE_CONJ.find(x => x[0] === w); return deChip({ k: 'conj', w, en: c[1], sub: !!c[2] }); };
const dePossEn = w => ({ mein: 'my', dein: 'your', sein: 'his', ihr: 'her / their', unser: 'our', euer: 'your' })[w];

/* what a word can be, from its spelling: "der" is nominative masculine, or dative / genitive feminine, or genitive plural */
const deFams = () => ['der', 'dies', 'ein', 'kein', 'zwei', 'drei', ...new Set(DE_POSS.map(p => p[0]))];
let DE_DET_READ = null;
function deDetReads(w) {
  if (!DE_DET_READ) { DE_DET_READ = new Map();
    for (const fam of deFams()) for (const c of DE_CASES) for (const g of ['m', 'f', 'n']) for (const num of ['s', 'p']) { const x = deDet(fam, c, g, num); if (!x) continue; if (!DE_DET_READ.has(x)) DE_DET_READ.set(x, []); DE_DET_READ.get(x).push({ fam, c, g, num }); } }
  return DE_DET_READ.get(String(w).toLowerCase()) || [];
}
const dePronReads = w => { const out = []; for (const r of DE_PRON) ['nom', 'acc', 'dat'].forEach((c, k) => { if (r[k] === w) out.push({ r, c }); }); return out; };
const deNounReads = n => { const out = []; for (const c of DE_CASES) for (const num of ['s', 'p']) { const f = deNounForm(n.e, c, num); if (f && f === n.w) out.push({ c, num }); } return out; };

/* ---------------- German checker ---------------- */
function deCheck(T0) {
  const first = deCheckOnce(T0); if (first.ok) return first;
  const amb = []; for (let k = 0; k < T0.length; k++) { const t = T0[k]; if (t.k === 'verb' && t.e && t.w === t.e.inf && (t.inf || t.e.f.includes(t.w))) amb.push(k); }
  for (const k of amb.slice(0, 4)) {
    const t = T0[k], other = t.inf ? (t.e.f.includes(t.w) ? { ...t, inf: false, f: t.e.f.indexOf(t.w) } : null) : { ...t, inf: true };
    if (!other) continue;
    const r = deCheckOnce(T0.map((x, j) => j === k ? other : x)); if (r.ok) return r;
  }
  return first;
}
function deCheckOnce(T0) {
  // a few words are spelled the same as another kind of word: ihr / sein before a noun is "her / his", mit / zu at the end is a verb part
  const T = T0.map((t, k) => {
    const nx = k + 1 < T0.length ? T0[k + 1] : null, nounNext = nx && ['noun', 'adj', 'int'].includes(nx.k);
    if (t.k === 'part' && ['mit', 'zu', 'an', 'auf'].includes(t.w) && nx && ['det', 'noun', 'adj', 'int'].includes(nx.k)) return { ...t, k: 'prep', ...(() => { const p = DE_PREP.find(x => x[0] === t.w); return { base: p[1], art: p[2], cs: p[3], en: p[4] }; })() };
    if (t.k === 'prep' && DE_PARTS.includes(t.w) && (!nx || ['conj', 'verb', 'neg', 'adv'].includes(nx.k) && !(nx.k === 'adv' && nx.w === 'hier'))) return { ...t, k: 'part', e: null };
    if ((t.k === 'pron' || (t.k === 'verb' && t.inf)) && ['ihr', 'sein'].includes(t.w) && nounNext) return { ...t, k: 'det', fam: t.w, en: dePossEn(t.w) };
    if (t.k === 'det' && ['ihr', 'sie'].includes(t.w) && !nounNext) return { ...t, k: 'pron' };
    return t;
  });
  let i = 0;
  const err = (msg, at = i) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length }), peek = (o = 0) => T[i + o], isErr = x => x && x.ok === false;
  if (!T.length) return err('Tap some words to build a sentence.');
  const isFin = t => t && t.k === 'verb' && !t.inf, isNomPron = t => t && t.k === 'pron' && dePronReads(t.w).some(r => r.c === 'nom');
  const words = (a, b) => T.slice(a, b).map(t => t.w).join(' ');
  const cText = c => c ? words(c.start, c.end) : '';
  /* a noun phrase: (der / ein / mein…) (sehr) (adjective) noun (genitive: des Mannes) */
  function NP(opts = {}) {
    const start = i; let det = null, sehr = null, adj = null;
    if (peek()?.k === 'det') det = T[i++];
    if (peek()?.k === 'int') { sehr = T[i++]; if (peek()?.k !== 'adj') return err('“sehr” (very) goes right before a describing word: “sehr groß”.', peek() ? i - 1 : i); }
    if (peek()?.k === 'adj') adj = T[i++];
    const n = peek();
    if (!n || n.k !== 'noun') return err(det ? `“${det.w}” comes before a noun, so a noun has to follow it.` : `“${adj ? adj.w : T[start].w}” describes a noun, so the noun goes right after it.`, !n ? i : det && !adj ? i - 1 : start);
    i++;
    const np = { k: 'np', det, sehr, adj, n, start, end: i, cdet: opts.cdet || null };
    // whose: "der Hund der Frau", "das Buch meines Bruders"
    if (!opts.noGen && peek()?.k === 'det' && (peek(1)?.k === 'noun' || (peek(1)?.k === 'adj' && peek(2)?.k === 'noun')) && deDetReads(peek().w).some(r => r.c === 'gen')) {
      const save = i, g = NP({ noGen: true });
      if (!isErr(g) && npReads(g).some(r => r.c === 'gen') && ['person', 'animal'].includes(g.n.e.cat)) { np.gen = g; np.end = i; } else i = save;
    }
    return np;
  }
  // which cases (and number) a noun phrase can be in, from its spelling
  function npReads(np) {
    if (np.coord) return np.coord.map(npReads).reduce((a, b) => a.filter(x => b.some(y => y.c === x.c)));
    const n = np.n.e, d = np.det || np.cdet, out = [];
    for (const r of deNounReads(np.n)) {
      let fam = null;
      if (d) { const ok = deDetReads(d.w).filter(x => x.c === r.c && x.num === r.num && (r.num === 'p' || x.g === n.g)); if (!ok.length) continue; fam = ok[0].fam; }
      else if (!(r.num === 'p' || n.mass)) continue;
      if (np.adj && deAdjForm(np.adj.e, r.c, n.g, r.num, fam) !== np.adj.w) continue;
      out.push(r);
    }
    return out;
  }
  const npHas = (np, c) => np.k === 'pron' ? dePronReads(np.t.w).some(r => r.c === c) : npReads(np).some(r => r.c === c);
  // the right way to say this noun phrase in a case (for the messages)
  function npSay(np, c, num, fam0) {
    const n = np.n.e, d = np.det, fam = d ? fam0 || d.fam || deDetReads(d.w)[0]?.fam : null;
    const dw = d ? deDet(fam, c, n.g, num) || deDet('der', c, n.g, num) : '';
    return [dw, np.sehr?.w, np.adj ? deAdjForm(np.adj.e, c, n.g, num, d ? fam : null) : '', deNounForm(n, c, num)].filter(Boolean).join(' ');
  }
  /* is this noun phrase right for its job? c = the case it needs, why = what it does in the sentence */
  function npFix(np, c, why) {
    if (np.coord) { for (const p of np.coord) { const e = npFix(p, c, why); if (e) return e; } return null; }
    const n = np.n.e, reads = deNounReads(np.n), at = np.start;
    if (n.cat === 'home') return err('“Hause” only goes after “nach” (going home) or “zu” (at home).', at);
    const nums = [...new Set(reads.map(r => r.num))], whole = npReads(np).filter(r => r.c === c), num = whole.length ? (whole.find(r => r.num === np.n.num) || whole[0]).num : reads.some(r => r.c === c && r.num === np.n.num) ? np.n.num : reads.find(r => r.c === c)?.num || np.n.num || nums[0] || 's';
    const d = np.det || np.cdet, cn = DE_CASE_NAME[c];
    const fams = d ? [...new Set(deDetReads(d.w).map(x => x.fam))] : [];
    const fam = d ? (fams.includes(d.fam) ? d.fam : fams[0] || d.fam) : null;
    if (!d) {
      if (!(num === 'p' || n.mass)) return err(`German needs a word like “${deDet('ein', c, n.g, num)}” or “${deDet('der', c, n.g, num)}” before “${n.w}”.`, at);
    } else if (!np.cdet) {
      const want = deDet(fam, c, n.g, num);
      if (want == null && fam === 'ein') return err(`“${d.w}” means one. For more than one, leave it out (“${npSay({ ...np, det: null }, c, 'p')}”) or say “${deDet('der', c, n.g, 'p')} ${deNounForm(n, c, 'p')}”.`, at);
      if (want == null) return err(`“${d.w}” means more than one, so the noun must be plural${n.pl ? `: “${d.w} ${deNounForm(n, c, 'p')}”` : ''}.`, at);
      if (n.mass === 1 && num === 's' && fam === 'ein') return err(`You can’t count “${n.w}”, so leave the article out: just “${n.w}”, or say “${deDet('der', c, n.g, 's')} ${n.w}”.`, at);
      if (d.w !== want) {
        const other = deDetReads(d.w).filter(x => x.fam === fam && x.num === num && (num === 'p' || x.g === n.g)).map(x => DE_CASE_NAME[x.c]);
        return err(`“${n.w}” is ${num === 'p' ? 'plural' : DE_G_NAME[n.g]}, and here it is ${why}, so it takes the ${cn}: “${npSay(np, c, num, fam)}”.${other.length ? ` (“${d.w}” is the ${[...new Set(other)].join(' or ')}.)` : ''}`, at);
      }
    }
    if (np.adj) {
      const want = deAdjForm(np.adj.e, c, n.g, num, fam);
      if (np.adj.w !== want) return err(`${d ? `After “${d.w}”` : 'With no article before it'}, “${np.adj.e.pred}” needs the ending -${want.slice(np.adj.e.stem.length)} here (${cn}${num === 'p' ? ' plural' : ''}): “${npSay(np, c, num, fam)}”.`, np.adj ? T.indexOf(np.adj, at) : at);
    }
    const wn = deNounForm(n, c, num);
    if (wn && np.n.w !== wn) {
      const nAt = T.indexOf(np.n, at);
      if (n.weak && num === 's') return err(`“${n.w}” changes to “${n.weak}” in every case except the nominative (who does it): “${npSay(np, c, num, fam)}”.`, nAt);
      if (c === 'dat' && num === 'p') return err(`In the dative plural, the noun adds -n: “${npSay(np, c, num, fam)}”.`, nAt);
      if (c === 'gen') return err(`In the genitive, “${n.w}” adds -${wn.slice(n.w.length)}: “${npSay(np, c, num, fam)}”.`, nAt);
      return err(`Here it is “${wn}”: “${npSay(np, c, num, fam)}”.`, nAt);
    }
    np.c = c; np.num = num; np.fam = fam;
    if (np.gen) { const e = npFix(np.gen, 'gen', 'whose it is'); if (e) return e; }
    return null;
  }
  const npText = np => np.coord ? np.coord.map(npText).join(` ${np.conj.w} `) : np.k === 'pron' ? np.t.w : words(np.start, np.end);
  function NPs(where) {
    const a = NP(); if (isErr(a)) return a;
    const c = peek();
    if (c?.k === 'conj' && (c.w === 'und' || c.w === 'oder') && ['det', 'noun', 'adj', 'int'].includes(peek(1)?.k)) {
      const save = i; i++;
      const b = NP();
      if (isErr(b) || (where !== 'vf' && isFin(peek()))) { i = save; return a; }
      return { k: 'np', coord: [a, b], conj: c, start: a.start, end: i, n: a.n };
    }
    return a;
  }
  /* a preposition and what follows it */
  function PP() {
    const start = i, p = T[i++], nx = peek();
    if (['nach', 'zu'].includes(p.w) && nx?.k === 'noun' && nx.e.cat === 'home') { i++; return { k: 'pp', p, home: true, start, end: i }; }
    if (nx?.k === 'noun' && nx.e.cat === 'home') return err(p.art ? `Use “${p.base}” on its own here: “${p.base === 'zu' ? 'zu Hause' : 'nach Hause'}”.` : '“Hause” only goes after “nach” (going home) or “zu” (at home).', start);
    if (p.w === 'nach') return err('Here “nach” goes with “Hause”: “nach Hause” (home). To go to a place, use “in” or “zu”: “in den Park”, “zum Park”.', start);
    if (nx?.k === 'pron') { i++; return { k: 'pp', p, pron: { k: 'pron', t: nx, start: i - 1, end: i }, start, end: i }; }
    if (!nx || !['det', 'noun', 'adj', 'int'].includes(nx.k)) return err(`“${p.w}” needs a noun after it: “${p.art ? `${p.w} Park` : p.w === 'mit' ? 'mit dem Hund' : p.w === 'für' ? 'für meine Mutter' : `${p.w} den Park`}”.`, nx ? start : i);
    if (p.art) {
      if (nx.k === 'det') return err(`“${p.w}” already has the article in it (${p.base} + ${p.art}), so don’t add another one.`, i);
      const np = NP({ cdet: { w: p.art, fam: 'der' } }); if (isErr(np)) return np;
      return { k: 'pp', p, np, start, end: i };
    }
    if (nx.k === 'det' && DE_JOIN[p.w + ' ' + nx.w]) {
      const nn = T.slice(i, i + 4).find(t => t.k === 'noun'), j = DE_JOIN[p.w + ' ' + nx.w];
      return err(`German joins “${p.w}” + “${nx.w}” into “${j}”: “${j} ${T.slice(i + 1, nn ? T.indexOf(nn, i) + 1 : i + 2).map(t => t.w).join(' ')}”.`, start);
    }
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
      let sehr = null; if (t.k === 'int') { sehr = T[i++]; if (peek()?.k !== 'adj') return err('“sehr” (very) goes right before a describing word: “sehr groß”.', peek() ? i - 1 : i); }
      const a = T[i++]; return { k: 'pred', a, sehr, start, end: i };
    }
    if (t.k === 'prep') return PP();
    if (t.k === 'adv') { i++; return { k: 'adv', t, start, end: i }; }
    if (t.k === 'neg') { i++; return { k: 'nicht', t, start, end: i }; }
    if (t.k === 'part') { i++; return { k: 'part', t, start, end: i }; }
    if (t.k === 'verb') { i++; return { k: t.inf ? 'inf' : 'fin', t, start, end: i }; }
    i++; return { k: 'other', t, start, end: i };
  }
  /* check one clause once its parts are known. C: { kind: main | sub, vf, verb, items, shared, cj } */
  function analyse(C) {
    let V = C.verb; const items = C.items, main = C.kind === 'main';
    if (main) {
      const pt = items.find(x => x.k === 'part'), alt = pt ? (V.e.part === pt.t.w ? null : DE_VERB.find(v => v.part === pt.t.w && v.f.includes(V.w))) : V.e.part && !V.joined ? DE_VERB.find(v => !v.part && v.f.includes(V.w)) : null;
      if (alt) V = C.verb = { ...V, e: alt, f: alt.f.indexOf(V.w) };
    }
    // the verb that decides what comes after it: the one at the end when the first is a modal verb
    const infs = items.filter(x => x.k === 'inf'), modal = V.e.t === 'modal';
    if (infs.length > 1) return err('Use only one verb at the end.', infs[1].start);
    if (modal && !infs.length) return err(`“${V.w}” needs a second verb at the ${main ? 'very end' : 'end, just before it'}: “${main ? `${V.w} … essen` : `… essen ${V.w}`}”.`, main ? (items.length ? items[items.length - 1].end : C.vEnd) : C.vAt);
    if (!modal && infs.length) return err(`Only verbs like können, wollen and müssen send a second verb to the end. Take out “${infs[0].t.w}”.`, infs[0].start);
    const G = modal ? infs[0].t.e : V.e;
    if (modal && ['modal', 'say'].includes(G.t)) return err(`Try another verb after “${V.w}”: “${V.w} … spielen”, “${V.w} … essen”.`, infs[0].start);
    const inf = infs[0];
    // who does it
    let subj = null;
    const vfX = C.vf && C.vf.k !== 'sub' ? C.vf : null;
    const nomOk = x => x && ((x.k === 'pron' && dePronReads(x.t.w).some(r => r.c === 'nom')) || (x.k === 'np' && npHas(x, 'nom')));
    const rest = [...items];
    if (C.vf && (C.vf.k === 'np' || C.vf.k === 'pron') && (nomOk(C.vf) || !rest.some(nomOk))) subj = C.vf;
    else if (!C.shared) {
      const k = rest.findIndex(nomOk);
      if (k > 0) return err(`“${cText(rest[k])}” (who does it) goes right ${main ? 'after the verb' : `after “${C.cj.w}”`}: “${main ? `${vfX ? cText(vfX) + ' ' : ''}${V.w} ${cText(rest[k])}` : `${C.cj.w} ${cText(rest[k])}`} …”.`, rest[k].start);
      if (k === 0) subj = rest.shift();
    }
    if (!subj && !C.shared) {
      const cand = [C.vf, ...rest].find(x => x && (x.k === 'np' || x.k === 'pron'));
      if (cand && cand.k === 'np') { const e = npFix(cand, 'nom', 'who does it (the subject)'); if (e) return e; }
      if (cand && cand.k === 'pron') { const r = dePronReads(cand.t.w)[0]; return err(`Who does it uses the nominative: “${r ? r.r[0] : 'ich'}”, not “${cand.t.w}”.`, cand.start); }
      return err(main ? 'German needs who does it (the subject): for example “ich”, “er” or “der Hund”.' : `After “${C.cj.w}” comes who does it: “${C.cj.w} ich …”, “${C.cj.w} er …”.`, main && !rest.length ? C.vEnd : C.vAt);
    }
    if (C.shared) subj = C.shared;
    // the verb matches who does it
    let fset;
    if (C.shared) fset = C.shared.fset;
    else if (subj.k === 'pron') { fset = dePronReads(subj.t.w).filter(r => r.c === 'nom').map(r => r.r[5]); if (!fset.length) { const r = dePronReads(subj.t.w)[0]; return err(`Who does it uses the nominative: “${r ? r.r[0] : 'ich'}”, not “${subj.t.w}”.`, subj.start); } }
    else { const e = npFix(subj, 'nom', 'who does it (the subject)'); if (e) return e; fset = subj.coord ? (subj.conj.w === 'oder' ? [2, 5] : [5]) : [subj.num === 'p' ? 5 : 2]; }
    C.subj = subj; C.fset = fset;
    const vForm = f => (V.joined ? V.e.part : '') + V.e.f[f];
    const f = fset.find(x => vForm(x) === V.w);
    if (f == null) return err(`“${V.w}” doesn’t match “${subj.k === 'pron' ? subj.t.w : npText(subj)}”. Use “${[...new Set(fset.map(vForm))].join('” or “')}”.`, C.vAt);
    C.f = f;
    // separable verbs: split in a main sentence, one piece at the end after weil / dass
    const parts = rest.filter(x => x.k === 'part');
    if (main && V.joined) return err(`In a main sentence, “${V.e.inf}” splits in two: “${V.e.f[f]} … ${V.e.part}”.`, C.vAt);
    if (!main && V.e.part && !V.joined) return err(`After “${C.cj.w}”, “${V.e.inf}” stays in one piece at the end: “${V.e.part}${V.e.f[f]}”.`, C.vAt);
    if (!main && parts.length) return err(`After “${C.cj.w}”, the verb stays in one piece at the end. Take out “${parts[0].t.w}”.`, parts[0].start);
    if (main && V.e.part && !parts.length) return err(`“${V.e.inf}” splits in two: “${V.w} … ${V.e.part}”. Put “${V.e.part}” at the very end.`, rest.length ? rest[rest.length - 1].end : C.vEnd);
    if (parts.length > 1) return err('Use only one verb part at the end.', parts[1].start);
    if (parts.length && parts[0].t.w !== V.e.part) return err(V.e.part ? `“${V.e.inf}” splits into “${V.w} … ${V.e.part}”, not “${parts[0].t.w}”.` : `“${parts[0].t.w}” isn’t part of “${G.inf}”. Take it out.`, parts[0].start);
    // the end of the sentence: the verb part or the second verb goes last
    const last = rest[rest.length - 1];
    if (parts.length && last !== parts[0]) return err(`“${parts[0].t.w}” goes at the very end: “… ${parts[0].t.w}”.`, parts[0].start);
    if (inf && last !== inf) return err(`“${inf.t.w}” goes at the very end${main ? '' : `, right before “${V.w}”`}.`, inf.start);
    // nouns and pronouns that are objects
    const pool = [...(vfX && vfX !== subj ? [vfX] : []), ...rest];
    const objs = pool.filter(x => x.k === 'np' || x.k === 'pron');
    const preds = rest.filter(x => x.k === 'pred'), pps = pool.filter(x => x.k === 'pp'), advs = pool.filter(x => x.k === 'adv'), nichts = rest.filter(x => x.k === 'nicht');
    const odd = rest.find(x => x.k === 'fin' || x.k === 'other');
    if (odd) return err(odd.k === 'fin' ? (main ? 'One verb per sentence part. Use “und” or “aber” to add another.' : `After “${C.cj.w}”, the verb goes to the very end.`) : `“${odd.t.w}” doesn’t fit here.`, odd.start);
    if (nichts.length > 1) return err('Use “nicht” only once.', nichts[1].start);
    const en = G.en;
    // what kind of verb it is
    if (['tr', 'haben'].includes(G.t) || G.t === 'dat') {
      const cs = G.t === 'dat' ? 'dat' : 'acc';
      if (cs === 'dat' && !objs.length && subj.gen && npHas(subj.gen, 'dat')) { objs.push(subj.gen); subj.gen = null; }
      if (objs.length > 1) { const two = objs[1]; return err(objs[1].k === 'np' && objs[0].k === 'np' ? `Only one object here: what you ${en}. To say whose, use the genitive: “${npText(objs[0])} ${deDet('der', 'gen', two.n.e.g, two.n.num)} ${deNounForm(two.n.e, 'gen', two.n.num || 's')}”.` : 'Only one object here.', two.start); }
      if (!objs.length && G.need) return err(`“${G.inf}” needs ${G.t === 'dat' ? 'who you ' + en : 'what you ' + en} after it: “${inf ? `${V.w} … ${G.t === 'dat' ? 'dir' : 'einen Apfel'} ${inf.t.w}` : `${V.w} ${{ food: 'einen Apfel', drink: 'Wasser', read: 'ein Buch', thing: 'einen Ball', person: 'meinen Freund', open: 'die Tür', '*': 'einen Hund' }[G.objs?.[0]] || 'einen Hund'}`}”.`, last ? last.end : C.vEnd);
      for (const o of objs) {
        if (o.k === 'pron') {
          const rr = dePronReads(o.t.w), ok = rr.find(r => r.c === cs);
          if (!ok) { const r = rr[0]; return err(`“${G.inf}” takes the ${DE_CASE_NAME[cs]}: “${r ? r.r[cs === 'acc' ? 1 : 2] : 'mich'}”, not “${o.t.w}”.`, o.start); }
          o.pr = ok; if (!G.objs.includes('*') && !G.objs.includes('person') && !G.objs.includes('animal')) return err(`That doesn’t make sense: you can’t ${en} a person. “${G.inf}” goes with ${G.objs.map(c => DE_KIND[c]).join(', ')}.`, o.start);
          continue;
        }
        const e = npFix(o, cs, G.t === 'dat' ? `who you ${en} (“${G.inf}” takes the dative)` : `what you ${en}`); if (e) return e;
        for (const p of o.coord || [o]) {
          const cat = p.n.e.cat;
          if (cat === 'feel' && G.t !== 'haben') return err(`“${p.n.e.w}” goes with haben: “ich habe ${p.n.e.w}”.`, p.start);
          if (cat === 'feel' && p.det && p.fam !== 'kein') return err(`No article here: “${V.w} ${p.n.e.w}”, or with not: “${V.w} ${deDet('kein', 'acc', p.n.e.g, 's')} ${p.n.e.w}”.`, p.start);
          if (cat !== 'feel' && (G.objs[0] === 'open' ? !DE_OPENABLE.includes(p.n.e.w) : !G.objs.includes('*') && !G.objs.includes(cat))) return err(`That doesn’t make sense: you can’t ${en} ${deEnA(p)}. “${G.inf}” goes with ${G.objs.map(c => DE_KIND[c]).join(', ')}.`, p.start);
        }
      }
    } else if (objs.length) {
      const o = objs[0];
      if (G.t === 'sein' && o.k === 'np' && o.n.e.cat === 'feel') return err(`German says this with haben: “ich habe ${o.n.e.w}”.`, o.start);
      return err(G.t === 'sein' || G.t === 'werden' ? `After “${V.w}”, put a describing word (“müde”)${G.t === 'sein' ? ' or a place (“im Park”, “zu Hause”)' : ''}.` : G.t === 'go' ? `“${G.inf}” needs where you go: “in den Park”, “zur Schule”, “nach Hause”. “${npText(o)}” isn’t where you go.` : G.t === 'say' ? `After “${V.w}”, add what you ${en} with “dass”: “${V.w}, dass …”.` : `“${G.inf}” (to ${en}) doesn’t take an object. You can add a place: “im Park”, or who with: “mit meinem Freund”.`, o.start);
    }
    if (preds.length && !['sein', 'werden'].includes(G.t)) return err(`“${preds[0].a.w}” describes something: put it right before a noun (“der ${preds[0].a.e.stem}e Hund”), or use sein: “ist ${preds[0].a.e.pred}”.`, preds[0].start);
    if (preds.length > 1) return err('Use one describing word here.', preds[1].start);
    for (const p of preds) if (p.a.w !== p.a.e.pred) return err(`After “${V.w}”, the describing word has no ending: “${p.a.e.pred}”.`, p.start);
    if (preds.length && (inf ? rest[rest.length - 2] : last) !== preds[0]) return err(`The describing word goes at the end: “${V.w} … ${preds[0].sehr ? 'sehr ' : ''}${preds[0].a.w}”.`, preds[0].start);
    // prepositions
    let dest = 0;
    for (const x of pps) {
      const p = x.p, go = G.t === 'go';
      if (x.home) {
        if (p.w === 'nach' && !go) return err('“nach Hause” is for going home. At home is “zu Hause”.', x.start);
        if (p.w === 'zu' && go) return err('“zu Hause” means at home. Going home is “nach Hause”.', x.start);
        if (go) dest++; else x.loc = true; continue;
      }
      if (x.pron) {
        const cs = p.cs === 'two' ? (go ? 'acc' : 'dat') : p.cs, rr = dePronReads(x.pron.t.w), ok = rr.find(r => r.c === cs);
        if (!ok) { const r = rr[0]; return err(`After “${p.w}” comes the ${DE_CASE_NAME[cs]}: “${p.w} ${r ? r.r[cs === 'acc' ? 1 : 2] : 'mir'}”.`, x.start + 1); }
        x.pr = ok; if (go && p.w === 'zu') dest++; continue;
      }
      const np = x.np, n = np.n.e, two = ['in', 'an', 'auf'].includes(p.base), spot = n.cat === 'place' || n.cat === 'thing';
      if (two || (p.base === 'zu' && n.cat === 'place')) {
        if (!spot) return err(`“${p.w}” + a place here: “${go ? 'in den Park' : 'im Park'}”, “${go ? 'an den Strand' : 'am Strand'}”. “${n.w}” isn’t a place.`, x.start);
        if (p.base === 'zu' && !go) return err(`“${p.w}” is for going somewhere. Being there: “${deAt(n, 'dat')}”.`, x.start);
        const cs = p.base === 'zu' ? 'dat' : go ? 'acc' : 'dat';
        // in, an or auf? "am" (by, at) works with any place; "in" doesn't go with Strand or Markt, "auf" not with most places
        if (two && n.cat === 'place' && p.base !== n.p && !(n.alt || []).includes(p.base) && !(p.base === 'an' && cs === 'dat')) return err(`German says “${deAt(n, cs, np)}”.`, x.start);
        const at = { ...n, p: p.base };
        if (p.art && p.cs !== cs) return err(cs === 'acc' ? `With “${G.inf}” (going somewhere), “${p.base}” takes the accusative: “${deAt(at, 'acc', np)}”.` : `“${p.w}” is for going somewhere. Being there takes the dative: “${deAt(at, 'dat', np)}”.`, x.start);
        if (p.art) { const want = deDet('der', cs, n.g, deNumOf(np)); if (want !== p.art) return err(`“${n.w}” is ${deNumOf(np) === 'p' ? 'plural' : DE_G_NAME[n.g]}, so it is “${deAt(at, cs, np)}”.`, x.start); }
        const e = npFix(np, cs, cs === 'acc' ? `where you go (“${p.base}” + accusative)` : p.base === 'zu' ? 'after “zu” (always dative)' : `where something is (“${p.base}” + dative)`); if (e) return e;
        x.loc = !go; if (go) dest++;
        continue;
      }
      const cs = p.cs;
      if (p.art) { const num = deNumOf(np), want = deDet('der', cs, n.g, num); if (want !== p.art) return err(`“${n.w}” is ${num === 'p' ? 'plural' : DE_G_NAME[n.g]}, so say “${DE_JOIN[p.base + ' ' + want] || p.base + ' ' + want} ${deNounForm(n, cs, num)}”.`, x.start); }
      const e = npFix(np, cs, `after “${p.base}” (always ${DE_CASE_NAME[cs]})`); if (e) return e;
      if (p.base === 'zu' && go) dest++;
      else if (p.base === 'zu') return err('“zu” is for going somewhere: “ich gehe zu meinem Freund”.', x.start);
    }
    if (G.t === 'go' && dest > 1) return err('Say where you go only once.', pps[pps.length - 1].start);
    const locs = pps.filter(x => x.loc).length + advs.filter(a => a.t.cls === 'place').length;
    if (G.t === 'sein' && !preds.length && !locs) return err(`“${V.w}” needs something after it: a describing word (“müde”) or a place (“im Park”, “zu Hause”).`, last ? last.end : C.vEnd);
    if (G.t === 'werden' && !preds.length) return err(`“${V.w}” needs a describing word after it: “${V.w} müde”.`, last ? last.end : C.vEnd);
    if (G.t === 'sein' && preds.length && locs) return err('Say one thing after sein: how something is (“müde”) or where it is (“im Park”).', preds[0].start);
    // adverbs
    for (const a of advs) {
      if (a.t.cls === 'gern' && preds.length) return err('“gern” goes with action verbs: “ich spiele gern”, “ich esse gern Äpfel”.', a.start);
      if (a.t.cls === 'how' && !['in', 'tr', 'go'].includes(G.t)) return err(`“${a.t.w}” goes with action verbs: “sie spielt ${a.t.w}”.`, a.start);
    }
    if (advs.filter(a => a.t.cls === 'gern').length > 1) return err('Use “gern” only once.');
    // word order in the middle: short pronouns first, then the rest; nicht in its place
    const ni = rest.findIndex(x => x.k === 'nicht'), pronAt = rest.findIndex(x => x.k === 'pron');
    if (pronAt > 0 && rest.slice(0, pronAt).some(x => x.k !== 'pron')) return err(`Short words like “${rest[pronAt].t.w}” go right after ${main && !C.vf?.k?.match(/np|pron/) || C.kind === 'sub' ? 'who does it' : 'the verb'}: “${main ? `${V.w} ${rest[pronAt].t.w}` : `${cText(subj)} ${rest[pronAt].t.w}`} …”.`, rest[pronAt].start);
    const kein = [C.vf, ...rest].find(x => x && x.k === 'np' && (x.coord || [x]).some(p => p.fam === 'kein'));
    if (ni >= 0 && kein) return err('Use “kein” or “nicht”, not both.', rest[ni].start);
    if (ni >= 0) {
      const after = rest.slice(ni + 1), notAdv = after[0]?.k === 'adv' && ['gern', 'how', 'freq'].includes(after[0].t.cls);
      for (const x of after) {
        if (x.k === 'pron') return err(`“nicht” goes after “${x.t.w}”: “… ${x.t.w} nicht”.`, rest[ni].start);
        if (x.k === 'adv' && x.t.cls === 'time') return err(`“${x.t.w}” goes before “nicht”.`, x.start);
        if (x.k === 'np' && objs.includes(x)) {
          const defn = (x.coord || [x]).every(p => p.fam && !['ein', 'kein', 'zwei', 'drei'].includes(p.fam));
          if (defn) return err(`“nicht” goes after “${npText(x)}”: “… ${npText(x)} nicht”.`, rest[ni].start);
          if (!notAdv) { const p = x.coord ? x.coord[0] : x; return err(`German says “kein” instead of “nicht ${p.det ? 'ein' : ''}…”: “${[deDet('kein', p.c, p.n.e.g, p.num), p.adj ? deAdjForm(p.adj.e, p.c, p.n.e.g, p.num, 'kein') : '', deNounForm(p.n.e, p.c, p.num)].filter(Boolean).join(' ')}”.`, rest[ni].start); }
        }
      }
      for (const x of rest.slice(0, ni)) {
        if (x.k === 'np' && objs.includes(x) && !(x.coord || [x]).every(p => p.fam && !['ein', 'kein', 'zwei', 'drei'].includes(p.fam)) && !(rest[ni + 1]?.k === 'adv' && ['gern', 'how', 'freq'].includes(rest[ni + 1].t.cls))) {
          const p = x.coord ? x.coord[0] : x;
          return err(`German says “kein” here instead of “nicht”: “${[deDet('kein', p.c, p.n.e.g, p.num), p.adj ? deAdjForm(p.adj.e, p.c, p.n.e.g, p.num, 'kein') : '', deNounForm(p.n.e, p.c, p.num)].filter(Boolean).join(' ')}”.`, x.start);
        }
        if (x.k === 'pred' || (x.k === 'pp' && (x.loc || x.home || ['in', 'an', 'auf'].includes(x.p.base) || (G.t === 'go' && x.p.base === 'zu'))) || (x.k === 'adv' && ['gern', 'how', 'place'].includes(x.t.cls))) return err(`“nicht” goes before “${cText(x)}”.`, rest[ni].start);
      }
    }
    // makes sense? only people and animals do things
    if (subj.k === 'np' && !['sein', 'werden'].includes(G.t)) for (const p of subj.coord || [subj]) {
      const c = p.n.e.cat;
      if (c !== 'person' && c !== 'animal') return err(`That doesn’t make sense: ${deEnA(p)} can’t ${en}. Use a person or an animal here.`, p.start);
      if (c === 'animal' && G.who === 'p') return err(`That doesn’t make sense: ${deEnA(p)} can’t ${en}. Only people ${en}.`, p.start);
    }
    Object.assign(C, { G, inf, rest, objs, preds, pps, advs, nicht: ni >= 0 });
    return C;
  }
  // a clause after weil / dass: who does it, the rest, then the verb(s) at the end
  function subClause(cj) {
    const C = { kind: 'sub', cj, items: [], start: i };
    for (;;) {
      const t = peek();
      if (!t || t.k === 'conj') break;
      if (isFin(t)) {
        const nx = peek(1);
        if (!nx || nx.k === 'conj' || isFin(nx)) { C.verb = t; C.vAt = i; i++; C.vEnd = i; break; }
        // the verb came too early
        return err(`After “${cj.w}”, the verb goes to the very end: “${cj.w} … ${t.w}”.`, i);
      }
      const c = part('sub'); if (isErr(c)) return c; C.items.push(c);
    }
    if (!C.verb) return err(`After “${cj.w}” comes a whole sentence with its verb at the end: “${cj.w} ich müde bin”.`, i);
    const r = analyse(C); return r;
  }
  function mainClause(front, shared) {
    const C = { kind: 'main', items: [], start: i, vf: front || null };
    if (!front) {
      if (shared && isFin(peek())) C.shared = shared;
      else {
        const vf = part('vf'); if (isErr(vf)) return vf;
        if (!vf) return err('Every sentence needs a verb.');
        if (['fin'].includes(vf.k)) return err(`German puts something before the verb in a sentence like this: who does it (“ich ${vf.t.w} …”) or a word like “heute”.`, vf.start);
        if (vf.k === 'nicht') return err('“nicht” can’t start the sentence. Start with who does it: “ich … nicht”.', vf.start);
        if (vf.k === 'part' || vf.k === 'inf') return err(`“${vf.t.w}” goes at the end of the sentence.`, vf.start);
        if (vf.k === 'pred') return err(`Start with who does it, then the verb: “Der Hund ist ${vf.a.w}”.`, vf.start);
        C.vf = vf;
      }
    }
    const v = peek();
    if (!isFin(v)) {
      if (!v || v.k === 'conj') return err(C.vf ? `Now add a verb (an action word like “spielt” or “ist”).` : 'Every sentence needs a verb.', i);
      // something else before the verb: "Heute ich spiele" → the verb comes second
      const j = T.findIndex((t, k) => k > i && isFin(t) && !T.slice(i, k).some(x => x.k === 'conj'));
      if (j > 0) {
        const vfText = C.vf?.k === 'sub' ? '…' : cText(C.vf);
        return err(C.vf && (C.vf.k === 'np' || C.vf.k === 'pron') ? `The verb comes second in German: “${vfText} ${T[j].w} ${T.slice(i, j).map(t => t.w).join(' ')} …”.` : `In German the verb comes second: “${vfText} ${T[j].w} ${T.slice(i, j).map(t => t.w).join(' ')} …”.`, i);
      }
      return err(C.vf ? `After “${C.vf.k === 'sub' ? 'that part' : cText(C.vf)}”, the next word should be a verb. “${v.w}” isn’t one.` : 'Every sentence needs a verb.', i);
    }
    C.verb = v; C.vAt = i; i++; C.vEnd = i;
    while (peek() && peek().k !== 'conj') { const c = part('mf'); if (isErr(c)) return c; C.items.push(c); }
    return analyse(C);
  }
  const P = { clauses: [], links: [], commas: new Set() };
  if (peek()?.k === 'conj' && peek().w === 'dass') return err('Start with the main sentence: “Ich denke, dass …”.', 0);
  if (peek()?.k === 'conj' && !peek().sub) return err(`“${peek().w}” joins two parts, so it can’t start the sentence.`, 0);
  let prev = null;
  for (;;) {
    let C;
    if (peek()?.k === 'conj' && peek().w === 'weil') {   // "Weil ich müde bin, bleibe ich zu Hause."
      const cj = T[i++]; const s = subClause(cj); if (isErr(s)) return s;
      if (!peek()) return err('Now add the main sentence, verb first: “…, bleibe ich zu Hause”.', i);
      P.commas.add(i);
      C = mainClause({ k: 'sub', start: s.start, end: i, s }, null); if (isErr(C)) return C;
      C.front = s;
    } else { C = mainClause(null, prev && P.links.length ? prev.shareNext : null); if (isErr(C)) return C; }
    if (C.shared) C.sharedFrom = prev;
    C.subs = []; P.clauses.push(C); prev = C;
    // weil / dass after the clause
    while (peek()?.k === 'conj' && peek().sub) {
      const cj = T[i]; P.commas.add(i); i++;
      if (!peek()) return err(`“${cj.w}” needs a sentence after it.`, i);
      if (cj.w === 'dass' && C.G.t !== 'say') return err('“dass” (that) comes after verbs like denken, glauben, sagen and wissen: “Ich denke, dass …”.', i - 1);
      const s = subClause(cj); if (isErr(s)) return s; C.subs.push(s);
      if (peek()?.k === 'conj' && !peek().sub) P.commas.add(i);   // the weil sentence ends: "…, weil ich müde bin, und …"
    }
    if (!peek()) break;
    const cj = T[i];
    if (cj.k !== 'conj') return err(`“${cj.w}” doesn’t fit here.`, i);
    i++;
    if (!peek()) return err(`“${cj.w}” joins two parts, so something has to come after it.`, i);
    if (cj.w === 'aber') P.commas.add(i - 1);
    P.links.push(cj);
    C.shareNext = C.subj ? { ...C.subj, fset: [C.f] } : C.shared;
  }
  return { ok: true, P };
}
// the number of a noun after im / ins / zum: the noun's own spelling decides (Kind / Kinder), one when it could be both
const deNumOf = np => { const r = deNounReads(np.n); return r.some(x => x.num === 's') ? 's' : 'p'; };
const deEnA = p => p.n.num === 'p' || p.n.e.mass || p.n.e.cat === 'feel' ? p.n.en : (/^[aeiou]/i.test(p.n.en) ? 'an ' : 'a ') + p.n.en;
// how to say "to the park" or "in the park" for a place: in den Park / im Park, an den Strand / am Strand, auf den Markt
function deAt(n, c, np) {
  const num = np?.n?.num || 's', art = deDet('der', c, n.g, num), j = DE_JOIN[n.p + ' ' + art];
  const adj = np?.adj ? deAdjForm(np.adj.e, c, n.g, num, 'der') + ' ' : '';
  return `${j || n.p + ' ' + art} ${adj}${deNounForm(n, c, num)}`;
}

/* English meaning of a correct German sentence */
function deEnglish(P) {
  const an = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
  const pronEn = (x, obj) => x.pr ? x.pr.r[4] : obj ? dePronReads(x.t.w)[0]?.r[4] : dePronReads(x.t.w)[0]?.r[3];
  const npEn = (np, neg) => {
    if (np.k === 'pron') return pronEn(np, true);
    if (np.coord) return np.coord.map(p => npEn(p, neg)).join(np.conj?.w === 'oder' ? ' or ' : ' and ');
    const a = np.adj, adj = a ? (np.sehr ? 'very ' : '') + a.e.en + ' ' : '', pl = np.num === 'p', noun = pl ? np.n.e.enPl || np.n.e.en : np.n.e.en, fam = np.fam;
    let art = '';
    if (np.cdet || fam === 'der') art = 'the ';
    else if (fam === 'ein') art = an(adj || noun) + ' ';
    else if (fam === 'kein') art = neg === 'obj' ? (pl || np.n.e.mass ? 'any ' : an(adj || noun) + ' ') : 'no ';
    else if (fam === 'dies') art = pl ? 'these ' : 'this ';
    else if (fam === 'zwei' || fam === 'drei') art = fam === 'zwei' ? 'two ' : 'three ';
    else if (fam) art = ({ mein: 'my', dein: 'your', sein: 'his', ihr: np.det?.en === 'their' ? 'their' : 'her', unser: 'our', euer: 'your' })[fam] + ' ';
    const base = art + adj + noun;
    if (np.gen) { const o = np.gen; return (!fam || fam === 'der') ? `${npEn(o)}'s ${adj}${noun}` : `${base} of ${npEn(o)}`; }
    return base;
  };
  const placeEn = x => {
    if (x.home) return x.p.w === 'nach' ? 'home' : 'at home';
    if (x.pron) return `${({ mit: 'with', für: 'for', ohne: 'without', von: 'from', bei: 'at', zu: 'to' })[x.p.base] || x.p.base} ${pronEn(x, true)}`;
    const n = x.np.n.e, the = npEn(x.np);
      if (n.cat === 'thing' && ['in', 'an', 'auf'].includes(x.p.base)) return (x.p.base === 'in' ? (x.loc ? 'in ' : 'into ') : x.p.base === 'an' ? (x.loc ? 'at ' : 'to ') : (x.loc ? 'on ' : 'onto ')) + the;
      if (n.cat === 'place' && ['in', 'an', 'auf', 'zu'].includes(x.p.base)) return x.loc ? (x.p.base === 'in' ? 'in ' : 'at ') + the : 'to ' + the;
    return ({ mit: 'with', für: 'for', ohne: 'without', von: 'from', bei: 'at', zu: 'to' })[x.p.base] + ' ' + the;
  };
  const one = (C, sub) => {
    const V = C.verb, G = C.G, f = C.f, modal = V.e.t === 'modal';
    const subjNp = C.subj;
    let subj = C.shared ? '' : subjNp.k === 'pron' ? (subjNp.t.w === 'sie' ? (f === 5 ? 'they' : 'she') : dePronReads(subjNp.t.w).find(r => r.c === 'nom' && r.r[5] === f)?.r[3] || 'I') : npEn(subjNp);
    const third = f === 2, neg = C.nicht || (C.objs || []).some(o => o.k === 'np' && (o.coord || [o]).some(p => p.fam === 'kein'));
    const subjKein = subjNp.k === 'np' && (subjNp.coord || [subjNp]).some(p => p.fam === 'kein');
    const neg2 = neg && !subjKein;
    const advs = C.advs || [], has = c => advs.filter(a => a.t.cls === c);
    const freq = has('freq').map(a => a.t.en).join(' '), gern = has('gern').length, endAdv = [...has('how'), ...has('place')].map(a => a.t.en);
    const time = has('time').filter(a => a !== C.vf).map(a => a.t.en), frontTime = C.vf?.k === 'adv' && C.vf.t.cls === 'time' ? C.vf.t.en : '';
    const feel = (C.objs || []).find(o => o.k === 'np' && o.n?.e?.cat === 'feel' && !o.n.e.have);
    // the verb, then what comes after it
    let rest = '';
    if (G.t === 'sein' || G.t === 'werden' || feel) {
      const what = C.preds?.[0] ? (C.preds[0].sehr ? 'very ' : '') + C.preds[0].a.e.en : feel ? feel.n.e.en : '';
      rest = what;
    } else {
      for (const o of C.objs || []) rest += ' ' + npEn(o, 'obj');
    }
    const pp = (C.pps || []).map(placeEn);
    let vp;
    const be = f === 0 ? 'am' : third ? 'is' : 'are';
    const baseOf = () => G.t === 'sein' || feel ? 'be' : G.en;
    const lead = '';
    if (modal && gern && V.e.inf !== 'möchten') endAdv.push('gladly');
    if (modal) {
      const m = V.e.m[(neg2 ? 2 : 0) + (third ? 1 : 0)];
      vp = `${m}${freq ? ' ' + freq : ''} ${lead}${baseOf()}`;
    } else if (gern && G.t === 'haben' && !feel) vp = neg2 ? `${third ? 'does' : 'do'} not like` : third ? 'likes' : 'like';
    else if (gern && G.t === 'sein') vp = neg2 ? `${third ? 'does' : 'do'} not like to be` : `${third ? 'likes' : 'like'} to be`;
    else if (G.t === 'sein' || feel) vp = `${be}${neg2 ? ' not' : ''}${freq ? ' ' + freq : ''}`;
    else if (gern) vp = neg2 ? `${third ? 'does' : 'do'} not${freq ? ' ' + freq : ''} like to ${G.en}` : `${freq ? freq + ' ' : ''}${third ? 'likes' : 'like'} to ${G.en}`;
    else vp = neg2 ? `${third ? 'does' : 'do'} not${freq ? ' ' + freq : ''} ${G.en}` : `${freq ? freq + ' ' : ''}${third ? G.en3 : G.en}`;
    let s = `${subj} ${vp} ${rest} ${pp.join(' ')} ${endAdv.join(' ')} ${time.join(' ')}`;
    if (frontTime) s = `${frontTime} ${s}`;
    for (const sb of C.subs || []) s += (sb.cj.w === 'weil' ? ', because ' : ' that ') + one(sb, true);
    return s.replace(/\s+/g, ' ').replace(/ ,/g, ',').trim();
  };
  let s = '';
  P.clauses.forEach((C, k) => {
    let t = one(C);
    if (C.front) t = 'because ' + one(C.front, true) + ', ' + t;
    if (k) { const c = P.links[k - 1]; s += (c.w === 'und' ? (C.shared ? ' and ' : ', and ') : c.w === 'aber' ? ', but ' : (C.shared ? ' or ' : ', or ')) + t; }
    else s = t;
  });
  return s[0].toUpperCase() + s.slice(1) + '.';
}
// the sentence as text, with the commas German needs (before aber, weil, dass and after a weil sentence at the start)
function deText(words) {
  let r = null; try { r = deCheck(words); } catch {}
  const commas = r?.ok ? r.P.commas : new Set(words.map((w, k) => k && w.k === 'conj' && ['aber', 'weil', 'dass'].includes(w.w) ? k : -1).filter(k => k > 0));
  const s = words.map((w, k) => (k && commas.has(k) ? ', ' : k ? ' ' : '') + w.w).join('').replace(/ ,/g, ',');
  return s[0].toUpperCase() + s.slice(1) + '.';
}

/* ---------------- making a German tray ---------------- */
function deGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = (list, key) => { const fav = list.filter(x => pref.has(String(key(x)).toLowerCase())); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const nounOf = cats => RP(DE_NOUN.filter(n => !['feel', 'home'].includes(n.cat) && (cats[0] === '*' || cats.includes(n.cat) || (cats[0] === 'open' && DE_OPENABLE.includes(n.w)))), n => n.w);
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
  const adjFor = cat => RP(DE_ADJ.filter(a => a.d.includes(CAT[cat] || 'p')), a => a.pred);
  const extra = [];
  const verb = inf => DE_VERB.find(v => v.inf === inf);
  // a noun phrase in a case; fam: der, ein, kein, dies, poss, zwei, bare (or null to pick one)
  const np = (n, num, c, out, o = {}) => {
    let fam = o.fam;
    if (!fam) {
      if (num === 'p') fam = R(['der', 'der', 'poss', 'dies', 'zwei', 'drei', ...(o.bare ? ['bare', 'bare'] : [])]);
      else if (n.mass === 1) fam = R(['der', 'poss', ...(o.bare ? ['bare', 'bare', 'bare'] : [])]);
      else fam = R(['der', 'der', 'ein', 'ein', 'poss', 'dies', ...(n.mass === 2 && o.bare ? ['bare'] : [])]);
      if (n.fam && num === 's' && coin(0.9)) fam = 'poss';
      if (o.noBare && fam === 'bare') fam = 'der';
    }
    if (fam === 'ein' && num === 'p') fam = 'der';
    const p = { fam, num, c, n };
    const a = o.adj !== false && coin(0.3) ? adjFor(n.cat) : null, sehr = a && coin(0.15);
    let stem = fam;
    if (fam === 'poss') { const row = R(DE_POSS); stem = row[0]; out.push(deDetC(deDet(stem, c, n.g, num), stem, row[1])); }
    else if (fam !== 'bare') {
      const w = deDet(fam, c, n.g, num); out.push(deDetC(w, fam, fam === 'der' ? 'the' : fam === 'ein' ? 'a' : fam === 'kein' ? 'no' : fam === 'dies' ? (num === 'p' ? 'these' : 'this') : fam === 'zwei' ? 'two' : 'three'));
      const wrong = R(DE_CASES.filter(x => x !== c).map(x => deDet(fam, x, n.g, num)).filter(x => x && x !== w)); if (wrong) extra.push(deDetC(wrong, fam, 'the'));
    }
    if (a) { if (sehr) out.push(deSehrC()); const w = deAdjForm(a, c, n.g, num, fam === 'bare' ? null : stem); out.push(deAdjC(a, w));
      const wrongA = R(['e', 'en', 'er', 'es', 'em'].map(e => a.stem + e).filter(x => x !== w)); extra.push(deAdjC(a, wrongA)); }
    out.push(deNounC(n, c, num));
    if (n.weak && num === 's') extra.push(deNounC(n, c === 'nom' ? 'acc' : 'nom', 's'));
    if (c === 'dat' && num === 'p' && deNounForm(n, 'dat', 'p') !== n.pl) extra.push(deNounC(n, 'nom', 'p'));
    // whose: der Hund meiner Schwester
    if (o.gen && fam === 'der' && coin(0.25)) { const g = nounOf(['person']), gfam = g.fam ? 'poss' : 'der'; let gs = gfam;
      if (gfam === 'poss') { const row = R(DE_POSS.filter(r => r[0] !== 'euer')); gs = row[0]; out.push(deDetC(deDet(gs, 'gen', g.g, 's'), gs, row[1])); } else out.push(deDetC(deDet('der', 'gen', g.g, 's'), 'der', 'the'));
      out.push(deNounC(g, 'gen', 's')); if (g.g !== 'f') extra.push(deNounC(g, 'nom', 's')); }
    return p;
  };
  const pronObj = (c, notF) => { const r = R(DE_PRON.filter(r => r[5] !== notF && r[0] !== 'es')); return dePronC(r[c === 'acc' ? 1 : 2], r[4]); };
  // where you go / where you are
  const toPlace = (out, go) => {
    if (coin(0.18)) { out.push(dePrepC(go ? 'nach' : 'zu'), deNounC(DE_NOUN.find(n => n.cat === 'home'), 'nom', 's')); extra.push(dePrepC(go ? 'zu' : 'nach')); return; }
    const n = nounOf(['place']);
    if (go && (n.go === 'zu' || coin(0.3))) { const art = deDet('der', 'dat', n.g, 's'), j = DE_JOIN['zu ' + art]; out.push(dePrepC(j), deNounC(n, 'dat', 's')); extra.push(dePrepC('zu'), deDetC(art, 'der', 'the')); return; }
    const c = go ? 'acc' : 'dat', art = deDet('der', c, n.g, 's'), j = DE_JOIN[n.p + ' ' + art];
    if (j) { out.push(dePrepC(j)); const other = DE_JOIN[n.p + ' ' + deDet('der', go ? 'dat' : 'acc', n.g, 's')]; extra.push(other ? dePrepC(other) : dePrepC(n.p)); }
    else { out.push(dePrepC(n.p)); np(n, 's', c, out, { fam: 'der', adj: false }); extra.push(deDetC(deDet('der', go ? 'dat' : 'acc', n.g, 's'), 'der', 'the')); return; }
    out.push(deNounC(n, c, 's'));
  };
  const withWho = (out, cats = ['person']) => { const p = R(['mit', 'mit', 'für']), n = nounOf(p === 'für' ? ['person'] : cats); out.push(dePrepC(p)); np(n, 's', p === 'für' ? 'acc' : 'dat', out, { adj: false, noBare: true }); };
  /* one clause. o.sub: after weil / dass (verb last); o.shared: the subject of the clause before (und trinkt Milch) */
  const clause = (o = {}) => {
    const kind = o.kind || R(['tr', 'tr', 'tr', 'dat', 'in', 'in', 'sep', 'sein', 'sein', 'werden', 'haben', 'go', 'go', ...(o.sub || o.noSay ? [] : ['say'])]);
    let G = kind === 'sein' ? verb('sein') : kind === 'werden' ? verb('werden') : kind === 'haben' ? verb('haben') : kind === 'say' ? R(DE_VERB.filter(v => v.t === 'say'))
      : kind === 'go' ? R(DE_VERB.filter(v => v.t === 'go')) : kind === 'sep' ? RP(DE_VERB.filter(v => v.part), v => v.inf) : RP(DE_VERB.filter(v => v.t === kind && !v.part), v => v.inf);
    const modal = !['sein', 'werden', 'say'].includes(kind) && coin(0.18) ? RP(DE_VERB.filter(v => v.t === 'modal'), v => v.inf) : null;
    const who = G.who === 'p' || modal?.who === 'p' ? ['person'] : ['person', 'animal'];
    // who does it
    let f, subj = [], subjCat = 'person', sf;
    if (o.shared) f = o.shared.f;
    else if (coin(0.4)) { const r = R(DE_PRON); f = r[5]; subj.push(dePronC(r[0], r[3])); extra.push(dePronC(R(DE_PRON.filter(x => x[5] !== f))[0], 'I')); sf = f; }
    else {
      const n = nounOf(kind === 'sein' || kind === 'werden' ? ['*'] : who), num = n.pl && coin(0.25) ? 'p' : 's';
      subjCat = n.cat; np(n, num, 'nom', subj, { gen: kind !== 'sein', noBare: num === 's' }); f = num === 'p' ? 5 : 2;
      if (coin(0.1) && !o.sub) { subj.push(deConjC('und')); np(nounOf(who), 's', 'nom', subj, { adj: false, noBare: true }); f = 5; }
    }
    const FV = modal || G;   // the verb that changes with who does it
    const sep = !!G.part && !modal;
    // the parts after the verb
    let pron = [], obj = [], objDef = false, neg = coin(0.2) ? 'nicht' : null, how = [], pp = [], pred = [], freq = [], time = [];
    if (['tr', 'haben', 'sep', 'dat'].includes(kind) && (G.t === 'tr' || G.t === 'haben' || G.t === 'dat')) {
      const cs = G.t === 'dat' ? 'dat' : 'acc';
      if ((G.objs.includes('person') || G.objs.includes('*')) && coin(0.22) && G.t !== 'haben') pron.push(pronObj(cs, f));
      else if (G.t === 'haben' && coin(0.3)) { const n = R(DE_NOUN.filter(n => n.cat === 'feel')); if (neg) { obj.push(deDetC(deDet('kein', 'acc', n.g, 's'), 'kein', 'no')); neg = null; } obj.push(deNounC(n, 'acc', 's')); extra.push(deVerbC(verb('sein'), f)); }
      else {
        const n = nounOf(G.t === 'haben' ? ['thing', 'read', 'animal', 'food', 'drink'] : G.objs), num = n.pl && coin(0.3) ? 'p' : 's';
        let fam = null;
        if (neg && !G.part && coin(0.6)) { fam = 'kein'; neg = null; }
        const p = np(n, num, cs, obj, { bare: cs === 'acc' && !fam, gen: true, fam: fam || undefined });
        objDef = !['ein', 'kein', 'bare', 'zwei', 'drei'].includes(p.fam);
        if (neg && !objDef && !G.part) { // nicht + an indefinite object: make it kein instead
          obj.length = 0; np(n, num, cs, obj, { fam: 'kein', adj: false }); neg = null; objDef = false; }
        if (neg && !objDef) { obj.length = 0; np(n, num, cs, obj, { fam: 'der', adj: false }); objDef = true; }
        if (cs === 'acc' && ['person', 'animal'].includes(n.cat)) extra.push(dePrepC('mit'));
      }
      if (coin(0.15) && G.t !== 'haben') withWho(pp);
      else if (coin(0.12) && !G.objs.includes('place')) toPlace(pp, false);
    } else if (kind === 'in' || (kind === 'sep' && G.t === 'in')) {
      const r = G.part && !['einkaufen'].includes(G.inf) ? 1 : Math.random();
      if (r < 0.4) toPlace(pp, false);
      else if (r < 0.6) withWho(pp, ['person', 'animal']);
      if (DE_HOW_VERBS.test(G.inf) && coin(0.25)) how.push(deAdvC(R(['gut', 'viel'])));
    } else if (kind === 'go') { if (coin(0.25)) withWho(pp); toPlace(pp, true); extra.push(deVerbC(verb('sein'), f)); }
    else if (kind === 'sein') {
      if (coin(0.7)) { if (coin(0.2)) pred.push(deSehrC()); const a = adjFor(subjCat); pred.push(deAdjC(a, a.pred)); extra.push(deAdjC(a, a.stem + 'e')); }
      else if (coin(0.2)) pred.push(deAdvC('hier')); else toPlace(pp, false);
    } else if (kind === 'werden') { const a = adjFor(subjCat === 'person' ? 'person' : subjCat); pred.push(deAdjC(a, a.pred)); extra.push(deVerbC(verb('sein'), f)); neg = null; }
    if (kind === 'say') neg = null;
    if (['tr', 'in', 'sep', 'go', 'dat'].includes(kind) && !modal && G.inf !== 'mögen' && coin(0.12) && !how.length) how.push(deAdvC('gern'));
    if (coin(0.15) && !neg && !obj.some(c => c.fam === 'kein')) freq.push(deAdvC(R(['oft', 'immer'])));
    const timeW = coin(0.25) ? R(['heute', 'morgen', 'jetzt', ...(G.inf === 'aufstehen' ? ['früh', 'früh'] : [])]) : null;
    const front = !o.sub && !o.shared && timeW && timeW !== 'früh' && coin(0.6);
    if (timeW && !front) time.push(deAdvC(timeW));
    // the verb (and what goes at the end)
    const fin = deVerbC(FV, f, o.sub && sep), end = [];
    if (modal) { end.push(deInfC(G)); extra.push(deVerbC(G, f)); }
    else if (sep && !o.sub) { end.push(dePartC(G)); extra.push(deVerbC(G, f, true)); }
    else if (sep && o.sub) extra.push(deVerbC(G, f), dePartC(G));
    extra.push(deVerbC(FV, (f + 1 + Math.floor(Math.random() * 5)) % 6, o.sub && sep));
    // the middle: pronoun, time, how often, the object, nicht, gern / gut, places, describing word
    const nichtC = neg ? [deNichtC()] : [];
    if (!neg) extra.push(deNichtC());
    let middle;
    if (obj.length && !objDef) middle = [...pron, ...time, ...freq, ...nichtC, ...how, ...obj, ...pp, ...pred];
    else middle = [...pron, ...time, ...freq, ...obj, ...nichtC, ...how, ...pp, ...pred];
    if (neg && !obj.length && !pron.length && !pp.length && !pred.length && !how.length && !end.length && !o.sub) middle = [...middle];   // "Ich schlafe nicht."
    let out;
    if (o.sub) out = [...subj, ...middle, ...end, fin];
    else if (o.shared) out = [fin, ...middle, ...end];
    else if (front) out = [deAdvC(timeW), fin, ...subj, ...middle, ...end];
    else out = [...subj, fin, ...middle, ...end];
    return { out, f, kind, G };
  };
  for (let tries = 0; tries < 150; tries++) {
    extra.length = 0;
    const first = clause();
    let words = first.out;
    const r = Math.random();
    if (first.kind === 'say') { const s = clause({ sub: true }); words = [...words, deConjC('dass'), ...s.out]; }
    else if (r < 0.15) { const s = clause({ sub: true }); words = [...words, deConjC('weil'), ...s.out]; extra.push(deConjC('dass')); }
    else if (r < 0.2) { const s = clause({ sub: true }); words = [deConjC('weil'), ...s.out, ...first.out.slice(0, 0)]; const m = clause({ noSay: true }); const vi = m.out.findIndex(c => c.k === 'verb' && !c.inf);
      // "Weil ich müde bin, bleibe ich zu Hause": the verb comes right after the weil sentence
      const subjEnd = m.out.slice(0, vi); words = [...words, m.out[vi], ...subjEnd.filter(c => c.k !== 'adv'), ...m.out.slice(vi + 1)]; }
    else if (r < 0.32) { const share = coin(0.3); const c2 = clause(share ? { shared: { f: first.f } } : {}); words = [...words, deConjC(R(['und', 'und', 'aber', 'oder'])), ...c2.out]; }
    if (words.length > 16 || words.length < 2) continue;
    const res = deCheck(words); if (!res.ok) continue;
    extra.push(dePronC(R(['ich', 'er', 'sie', 'wir', 'du']), 'I'), dePrepC(R(['in', 'mit', 'zu', 'im', 'für'])));
    if (!words.some(w => w.k === 'conj')) extra.push(deConjC(R(['und', 'aber', 'weil'])));
    // one chip per spelling, so the tray never shows two "den" or two "nicht"
    const seen = new Set(words.map(w => w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && x.w && !seen.has(x.w)) { seen.add(x.w); uniq.push(x); }
    return { words, extra: uniq.slice(0, Math.max(4, 16 - words.length)), english: deEnglish(res.P) };
  }
  return null;
}

BLD_LANGS.de = { name: 'German', check: deCheck, gen: deGenerate, voice: 'de-DE', english: deEnglish, text: deText, types: ['pron', 'noun', 'verb', 'adj', 'det', 'prep', 'conj', 'adv', 'part'] };
BLD_ORDER.de = { rows: [
    ['A basic sentence', [['det', 'der / ein'], ['adj', '(adjective)'], ['noun', 'Noun'], ['verb', 'verb'], ['det', 'den / einen'], ['adj', '(adjective)'], ['noun', 'Noun']]],
    ['The verb comes second', [['adv', 'heute'], ['verb', 'verb'], ['pron', 'ich'], ['det', 'determiner'], ['noun', 'Noun']]],
    ['A verb that splits (anrufen)', [['pron', 'ich'], ['verb', 'rufe'], ['pron', '(dich)'], ['part', 'an']]],
    ['Can, want, must… + a second verb', [['pron', 'ich'], ['verb', 'will'], ['noun', '(Wasser)'], ['verb', 'trinken']]],
    ['Saying what something is like (sein)', [['det', 'der'], ['noun', 'Noun'], ['verb', 'ist'], ['adv', '(sehr)'], ['adj', 'adjective']]],
    ['A negative sentence', [['pron', 'ich'], ['verb', 'verb'], ['det', 'den'], ['noun', 'Noun'], ['adv', 'nicht']]],
    ['Going somewhere', [['pron', 'ich'], ['verb', 'gehe'], ['prep', 'in / ins / zum'], ['det', '(den)'], ['noun', 'place']]],
    ['Because… (verb at the end)', [['verb', 'sentence'], ['conj', ', weil'], ['pron', 'ich'], ['adj', '(…)'], ['verb', 'verb']]],
  ], tips: [
    ['noun', 'Every noun starts with a capital letter: <b>der Hund</b>, <b>die Katze</b>, <b>das Buch</b>.'],
    ['det', 'Who does it: <b>der / die / das</b>, <b>ein / eine</b>. What you see or eat: <b>den</b> / <b>einen</b> for masculine words (ich sehe <b>den</b> Hund). After mit, zu, von: <b>dem / der / dem</b>, plural <b>den</b> + -n (mit den Kinder<b>n</b>). Whose: <b>des</b> Mann<b>es</b>, <b>der</b> Frau.'],
    ['adj', 'Before a noun, adjectives get an ending: <b>der große</b> Hund, <b>ein großer</b> Hund, <b>große</b> Hunde. After sein there is no ending: der Hund ist <b>groß</b>.'],
    ['verb', 'The verb is always the <b>second</b> part: <b>Heute spiele ich</b> Fußball. After <b>weil</b> and <b>dass</b> it goes to the end: …, weil ich müde <b>bin</b>.'],
    ['part', 'Some verbs split: <b>anrufen</b> → ich <b>rufe</b> dich <b>an</b>. At the end of a weil sentence they join again: …, weil ich dich <b>anrufe</b>.'],
    ['verb', 'With können, wollen, müssen, möchten… the second verb goes to the end: ich <b>will</b> Wasser <b>trinken</b>.'],
    ['adv', '<b>nicht</b> goes after the object (ich esse den Apfel <b>nicht</b>) and before places and describing words (ich bin <b>nicht</b> müde). With ein or no article, say <b>kein</b>: ich habe <b>keinen</b> Hund.'],
    ['prep', 'Going somewhere: <b>in den</b> Park, <b>ins</b> Kino, <b>zur</b> Schule, <b>nach Hause</b>. Being there: <b>im</b> Park, <b>in der</b> Schule, <b>zu Hause</b>.'] ] };

/* ---------------- Your own German words (📚 Add my deck's words) ---------------- */
// Present tense of common irregular and stem-changing verbs: ich, du, er/sie/es, wir, ihr, sie
const DE_IRREG_FORMS = {
  sein: 'bin bist ist sind seid sind', haben: 'habe hast hat haben habt haben', werden: 'werde wirst wird werden werdet werden', wissen: 'weiß weißt weiß wissen wisst wissen',
  können: 'kann kannst kann können könnt können', wollen: 'will willst will wollen wollt wollen', müssen: 'muss musst muss müssen müsst müssen', dürfen: 'darf darfst darf dürfen dürft dürfen',
  sollen: 'soll sollst soll sollen sollt sollen', mögen: 'mag magst mag mögen mögt mögen', möchten: 'möchte möchtest möchte möchten möchtet möchten', tun: 'tue tust tut tun tut tun',
  essen: 'esse isst isst essen esst essen', vergessen: 'vergesse vergisst vergisst vergessen vergesst vergessen', fressen: 'fresse frisst frisst fressen fresst fressen', messen: 'messe misst misst messen messt messen',
  lesen: 'lese liest liest lesen lest lesen', sehen: 'sehe siehst sieht sehen seht sehen', geben: 'gebe gibst gibt geben gebt geben', nehmen: 'nehme nimmst nimmt nehmen nehmt nehmen',
  sprechen: 'spreche sprichst spricht sprechen sprecht sprechen', helfen: 'helfe hilfst hilft helfen helft helfen', treffen: 'treffe triffst trifft treffen trefft treffen', werfen: 'werfe wirfst wirft werfen werft werfen',
  sterben: 'sterbe stirbst stirbt sterben sterbt sterben', brechen: 'breche brichst bricht brechen brecht brechen', stehlen: 'stehle stiehlst stiehlt stehlen stehlt stehlen', empfehlen: 'empfehle empfiehlst empfiehlt empfehlen empfehlt empfehlen',
  fahren: 'fahre fährst fährt fahren fahrt fahren', schlafen: 'schlafe schläfst schläft schlafen schlaft schlafen', laufen: 'laufe läufst läuft laufen lauft laufen', tragen: 'trage trägst trägt tragen tragt tragen',
  waschen: 'wasche wäschst wäscht waschen wascht waschen', fallen: 'falle fällst fällt fallen fallt fallen', lassen: 'lasse lässt lässt lassen lasst lassen', halten: 'halte hältst hält halten haltet halten',
  fangen: 'fange fängst fängt fangen fangt fangen', schlagen: 'schlage schlägst schlägt schlagen schlagt schlagen', wachsen: 'wachse wächst wächst wachsen wachst wachsen', backen: 'backe bäckst bäckt backen backt backen',
  laden: 'lade lädst lädt laden ladet laden', raten: 'rate rätst rät raten ratet raten', braten: 'brate brätst brät braten bratet braten', stoßen: 'stoße stößt stößt stoßen stoßt stoßen',
  gelten: 'gelte giltst gilt gelten geltet gelten', vergeben: 'vergebe vergibst vergibt vergeben vergebt vergeben', erschrecken: 'erschrecke erschrickst erschrickt erschrecken erschreckt erschrecken',
};
const DE_SEP = /^(ab|an|auf|aus|bei|ein|fern|fest|her|hin|los|mit|nach|vor|weg|zu|zurück|zusammen|weiter|wieder|vorbei|heim|kennen|spazieren|statt|teil|um)(?=[a-zäöü]{3,})/;
// verbs that are often the second half of one that splits (abholen, ausmachen, vorstellen)
const DE_SEP_BASE = new Set('holen machen legen stellen setzen hören lernen sagen bauen packen kaufen räumen füllen stecken schalten leihen ziehen steigen springen kommen gehen stehen bringen denken schreiben schneiden suchen wachen zahlen fragen führen klären kleben drehen drücken hängen heben kehren klappen kochen rufen reisen rechnen reden richten schauen schicken schließen passen atmen bieten bleiben fliegen fließen gießen greifen hauen heizen knöpfen liegen lösen lehnen malen nähen probieren putzen reichen reißen schieben sitzen spielen spülen starten stimmen suchen tauschen teilen trennen trinken wandern warten wechseln weinen werten wischen ziehen zünden nutzen melden merken ordnen'.split(' '));
// ich, du, er, wir, ihr, sie: the table first, then the regular pattern (arbeiten → arbeitest, tanzen → tanzt, sammeln → sammle)
function deConjugate(inf, noSep) {
  inf = String(inf || '').trim().toLowerCase();
  const m = !noSep && inf.match(DE_SEP);
  if (m && !DE_IRREG_FORMS[inf] && (DE_IRREG_FORMS[inf.slice(m[1].length)] || DE_SEP_BASE.has(inf.slice(m[1].length)) || DE_VERB.some(v => !v.part && v.inf === inf.slice(m[1].length)))) {
    const pre = m[1], base = deConjugate(inf.slice(pre.length), true);
    return base.map(f => f + ' ' + pre);
  }
  if (DE_IRREG_FORMS[inf]) return DE_IRREG_FORMS[inf].split(' ');
  if (/[^e]n$/.test(inf) && /(el|er)n$/.test(inf)) { const st = inf.slice(0, -1); return [(/eln$/.test(inf) ? st.slice(0, -2) + 'le' : st + 'e').replace(/ele$/, 'le'), st + 'st', st + 't', inf, st + 't', inf]; }   // sammeln, wandern
  const st = inf.replace(/en$|n$/, '');
  const e = /([dt]|[^aeiouäöülrhnm][mn]|ch[mn])$/.test(st) ? 'e' : '';      // arbeiten → arbeitest, öffnen → öffnest
  const s = /(s|ß|x|z|tz)$/.test(st) ? '' : 's';                  // tanzen → du tanzt
  return [st + 'e', st + e + s + 't', st + e + 't', inf, st + e + 't', inf];
}
// the plural of a noun (a good guess: check the ones that look wrong)
function dePl(w, g) {
  const W = String(w || '');
  if (/(e)$/.test(W)) return W + 'n';
  if (/(ung|heit|keit|schaft|ion|tät|ei|ie)$/.test(W)) return W + 'en';
  if (/in$/.test(W) && g === 'f') return W + 'nen';
  if (/(er|el|en|chen|lein)$/.test(W)) return W;
  if (/[aiouy]$/.test(W)) return W + 's';
  if (g === 'f') return W + 'en';
  return W + 'e';
}
const deCap = w => { w = String(w || ''); return w ? w[0].toUpperCase() + w.slice(1) : w; };
const deGenderGuess = w => /(ung|heit|keit|schaft|ion|tät|ik|ei|ie|in|e)$/.test(w) && !/(chen|lein)$/.test(w) ? 'f' : /(chen|lein|um|ment|tum)$/.test(w) ? 'n' : 'm';
const deAdjForms = w => { const st = /^(teuer|sauer)$/.test(w) ? w.replace(/er$/, 'r') : /e$/.test(w) ? w.slice(0, -1) : w; return [w, st + 'er', st + 'e', st + 'es']; };
const DE_BASE = { n: DE_NOUN.length, a: DE_ADJ.length, v: DE_VERB.length };
const deKnown = w => { w = String(w || '').toLowerCase();
  return DE_NOUN.slice(0, DE_BASE.n).some(n => n.w.toLowerCase() === w || (n.pl || '').toLowerCase() === w) || DE_VERB.slice(0, DE_BASE.v).some(v => v.inf === w || v.f.includes(w))
    || DE_ADJ.slice(0, DE_BASE.a).some(a => a.pred === w) || DE_PRON.some(p => p.slice(0, 3).includes(w)) || deDetReads(w).length || DE_PREP.some(p => p[0] === w) || DE_CONJ.some(c => c[0] === w) || DE_ADV.some(a => a[0] === w) || ['nicht', 'sehr'].includes(w); };
function deApplyMine() {
  DE_NOUN.length = DE_BASE.n; DE_ADJ.length = DE_BASE.a; DE_VERB.length = DE_BASE.v;
  for (const m of S.bldWords || []) {
    if (!m || m.lang !== 'de' || !m.w || !m.en || deKnown(m.w)) continue;
    if (m.k === 'noun') { const g = ['m', 'f', 'n'].includes(m.g) ? m.g : 'm'; DE_NOUN.push(DN(deCap(m.w), m.pl ? deCap(m.pl) : null, g, m.cat || 'thing', m.en, m.pl ? (m.enPl || bldPlEn(m.en)) : null, { ...(m.pl ? {} : { mass: 2 }), ...(m.cat === 'place' ? { p: 'in' } : {}) })); }
    if (m.k === 'verb' && Array.isArray(m.forms) && m.forms.length === 6) {
      const sp = m.forms.every(f => / /.test(f)) ? m.forms[0].split(' ').pop() : null;
      const forms = sp ? m.forms.map(f => f.split(' ')[0]) : m.forms;
      if (forms.some(f => /\s/.test(f))) continue;
      const type = m.obj === 'in' ? 'in' : 'tr', objs = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read', 'place'];
      DE_VERB.push(DV(m.w.toLowerCase(), forms.join(' '), type, type === 'in' ? null : objs, 0, m.en, bld3sEn(m.en), m.who === 'a' ? 'a' : 'p', sp ? { part: sp } : {}));
    }
    if (m.k === 'adj') { const w = m.w.toLowerCase(), st = deAdjForms(w)[2].slice(0, -1); DE_ADJ.push(DA(w, m.en, 'patflr', st)); }
  }
}
// builder.js calls bldApplyMine() when the game starts: add the German words to it
if (typeof bldApplyMine === 'function') { const prevApply = bldApplyMine; bldApplyMine = function () { prevApply(); deApplyMine(); }; }
BLD_MINE.de = { name: 'German', forms: 'ich, du, er/sie/es, wir, ihr, sie (a verb that splits: rufe an, rufst an…)', nForms: 6, m: 'der (masculine)', f: 'die (feminine)', n: 'das (neuter)',
  conj: w => deConjugate(w), pl: w => dePl(deCap(w), deGenderGuess(w)), adj: w => deAdjForms(w),
  known: w => deKnown(w), gender: w => deGenderGuess(w), isVerb: w => /^[a-zäöüß]+(en|ern|eln)$/.test(w) || w === 'tun', refl: () => false,
  parse: s => { const m = s.match(/^(der|die|das)\s+(\p{L}+)$/u); if (m) return { w: deCap(m[2]), g: m[1] === 'der' ? 'm' : m[1] === 'die' ? 'f' : 'n', art: true };
    const e = s.match(/^(ein|eine)\s+(\p{L}+)$/u); if (e) return { w: deCap(e[2]), art: true, ...(e[1] === 'eine' ? { g: 'f' } : {}) };
    return /^\p{L}+$/u.test(s) ? { w: s } : null; },
  intro: 'words with <i>der/die/das</i> are nouns, and words like <i>“to …”</i> are verbs). Nouns get their capital letter in the game. Verb forms are filled in for you, including stem changes (du isst, er fährt) and verbs that split (anrufen → rufe an); check any that look wrong.' };
