'use strict';
/* ================= Sentence Builder: Latin =================
   Classical Latin for students. Latin word order is free: the endings show who does what, so the checker accepts any
   order that is grammatical, judging by the endings. New sentences are made in the usual school order
   (subject – object – verb: "puella rosam portat"), but "rosam puella portat" and "portat puella rosam" are right too.
   Checked: noun cases (nominative subject, accusative object, genitive "of", dative "to/for", ablative after a
   preposition) for the 1st, 2nd and 3rd declensions; present-tense verbs of the four conjugations plus sum, possum
   (+ infinitive) and eō; the verb agrees with its subject; adjectives agree with their noun in case, number and gender
   (or describe the subject after sum); prepositions take the right case and come right before their noun; nōn goes
   right before the verb. Words are shown with macrons (ā ē ī ō ū) to help with pronunciation. Loaded after builder.js. */

const LA_CASES = ['nom', 'gen', 'dat', 'acc', 'abl'];
const LA_CASE_NAME = { nom: 'nominative', gen: 'genitive', dat: 'dative', acc: 'accusative', abl: 'ablative' };
const LA_CASE_JOB = { nom: 'the subject (who does it)', gen: '“of …”', dat: '“to / for …”', acc: 'the object (who or what it is done to)', abl: 'used after a preposition' };
const laStrip = w => String(w || '').normalize('NFD').replace(/[̄̆]/g, '').normalize('NFC');
//            nominative   genitive     g  decl  kind      English one / many          1 = can't count, i = i-stem (genitive plural -ium)
const LA_NOUN = [
  ['puella', 'puellae', 'f', 1, 'person', 'girl', 'girls'], ['fēmina', 'fēminae', 'f', 1, 'person', 'woman', 'women'], ['fīlia', 'fīliae', 'f', 1, 'person', 'daughter', 'daughters'],
  ['rēgīna', 'rēgīnae', 'f', 1, 'person', 'queen', 'queens'], ['ancilla', 'ancillae', 'f', 1, 'person', 'maid', 'maids'], ['dea', 'deae', 'f', 1, 'person', 'goddess', 'goddesses'],
  ['nauta', 'nautae', 'm', 1, 'person', 'sailor', 'sailors'], ['agricola', 'agricolae', 'm', 1, 'person', 'farmer', 'farmers'], ['poēta', 'poētae', 'm', 1, 'person', 'poet', 'poets'],
  ['aqua', 'aquae', 'f', 1, 'drink', 'water', null, 1], ['cēna', 'cēnae', 'f', 1, 'food', 'dinner', 'dinners'], ['rosa', 'rosae', 'f', 1, 'thing', 'rose', 'roses'],
  ['epistula', 'epistulae', 'f', 1, 'read', 'letter', 'letters'], ['fābula', 'fābulae', 'f', 1, 'read', 'story', 'stories'], ['mēnsa', 'mēnsae', 'f', 1, 'thing', 'table', 'tables'],
  ['porta', 'portae', 'f', 1, 'thing', 'gate', 'gates'], ['pecūnia', 'pecūniae', 'f', 1, 'thing', 'money', null, 1], ['corōna', 'corōnae', 'f', 1, 'thing', 'crown', 'crowns'],
  ['via', 'viae', 'f', 1, 'place', 'road', 'roads'], ['silva', 'silvae', 'f', 1, 'place', 'forest', 'forests'], ['vīlla', 'vīllae', 'f', 1, 'place', 'farmhouse', 'farmhouses'],
  ['īnsula', 'īnsulae', 'f', 1, 'place', 'island', 'islands'], ['casa', 'casae', 'f', 1, 'place', 'cottage', 'cottages'], ['culīna', 'culīnae', 'f', 1, 'place', 'kitchen', 'kitchens'],
  ['amīcus', 'amīcī', 'm', 2, 'person', 'friend', 'friends'], ['servus', 'servī', 'm', 2, 'person', 'slave', 'slaves'], ['dominus', 'dominī', 'm', 2, 'person', 'master', 'masters'],
  ['fīlius', 'fīliī', 'm', 2, 'person', 'son', 'sons'], ['puer', 'puerī', 'm', 2, 'person', 'boy', 'boys'], ['vir', 'virī', 'm', 2, 'person', 'man', 'men'],
  ['magister', 'magistrī', 'm', 2, 'person', 'teacher', 'teachers'], ['equus', 'equī', 'm', 2, 'animal', 'horse', 'horses'], ['lupus', 'lupī', 'm', 2, 'animal', 'wolf', 'wolves'],
  ['cibus', 'cibī', 'm', 2, 'food', 'food', null, 1], ['liber', 'librī', 'm', 2, 'read', 'book', 'books'], ['gladius', 'gladiī', 'm', 2, 'thing', 'sword', 'swords'],
  ['hortus', 'hortī', 'm', 2, 'place', 'garden', 'gardens'], ['ager', 'agrī', 'm', 2, 'place', 'field', 'fields'], ['mūrus', 'mūrī', 'm', 2, 'thing', 'wall', 'walls'],
  ['templum', 'templī', 'n', 2, 'place', 'temple', 'temples'], ['oppidum', 'oppidī', 'n', 2, 'place', 'town', 'towns'], ['forum', 'forī', 'n', 2, 'place', 'forum', 'forums'],
  ['dōnum', 'dōnī', 'n', 2, 'thing', 'gift', 'gifts'], ['pōmum', 'pōmī', 'n', 2, 'food', 'apple', 'apples'], ['vīnum', 'vīnī', 'n', 2, 'drink', 'wine', null, 1], ['scūtum', 'scūtī', 'n', 2, 'thing', 'shield', 'shields'],
  ['rēx', 'rēgis', 'm', 3, 'person', 'king', 'kings'], ['māter', 'mātris', 'f', 3, 'person', 'mother', 'mothers'], ['pater', 'patris', 'm', 3, 'person', 'father', 'fathers'],
  ['frāter', 'frātris', 'm', 3, 'person', 'brother', 'brothers'], ['soror', 'sorōris', 'f', 3, 'person', 'sister', 'sisters'], ['mīles', 'mīlitis', 'm', 3, 'person', 'soldier', 'soldiers'],
  ['dux', 'ducis', 'm', 3, 'person', 'leader', 'leaders'], ['cīvis', 'cīvis', 'm', 3, 'person', 'citizen', 'citizens', 0, 'i'], ['canis', 'canis', 'm', 3, 'animal', 'dog', 'dogs'],
  ['leō', 'leōnis', 'm', 3, 'animal', 'lion', 'lions'], ['avis', 'avis', 'f', 3, 'animal', 'bird', 'birds', 0, 'i'], ['pānis', 'pānis', 'm', 3, 'food', 'bread', null, 1],
  ['urbs', 'urbis', 'f', 3, 'place', 'city', 'cities', 0, 'i'], ['nāvis', 'nāvis', 'f', 3, 'thing', 'ship', 'ships', 0, 'i'], ['carmen', 'carminis', 'n', 3, 'read', 'song', 'songs'],
  ['flūmen', 'flūminis', 'n', 3, 'place', 'river', 'rivers']];
const LA_OPENABLE = ['porta', 'epistula', 'liber', 'casa', 'vīlla', 'templum'];
// the endings of each declension: [case, number, ending]; the nominative singular is the dictionary word itself
const LA_END = {
  1: { sg: { gen: 'ae', dat: 'ae', acc: 'am', abl: 'ā' }, pl: { nom: 'ae', gen: 'ārum', dat: 'īs', acc: 'ās', abl: 'īs' } },
  2: { sg: { gen: 'ī', dat: 'ō', acc: 'um', abl: 'ō' }, pl: { nom: 'ī', gen: 'ōrum', dat: 'īs', acc: 'ōs', abl: 'īs' } },
  '2n': { sg: { gen: 'ī', dat: 'ō', abl: 'ō' }, pl: { nom: 'a', gen: 'ōrum', dat: 'īs', acc: 'a', abl: 'īs' } },
  3: { sg: { gen: 'is', dat: 'ī', acc: 'em', abl: 'e' }, pl: { nom: 'ēs', gen: 'um', dat: 'ibus', acc: 'ēs', abl: 'ibus' } },
  '3n': { sg: { gen: 'is', dat: 'ī', abl: 'e' }, pl: { nom: 'a', gen: 'um', dat: 'ibus', acc: 'a', abl: 'ibus' } } };
const laStem = (gen, decl) => decl === 1 ? gen.slice(0, -2) : decl === 2 ? gen.slice(0, -1) : gen.slice(0, -2);
/* every form of a noun: [{ w, c, n }] (one word can be several cases: puellae = genitive or dative singular, or nominative plural) */
function laNounForms(e) {
  const [nom, gen, g, decl, , , , mass, istem] = e, st = laStem(gen, decl), key = decl > 1 && g === 'n' ? decl + 'n' : decl, E = LA_END[key], out = [];
  out.push({ w: nom, c: 'nom', n: 's' });
  if (g === 'n') out.push({ w: nom, c: 'acc', n: 's' });
  for (const c of LA_CASES) if (E.sg[c]) out.push({ w: st + E.sg[c], c, n: 's' });
  if (!mass) for (const c of LA_CASES) out.push({ w: st + (c === 'gen' && istem === 'i' ? 'ium' : decl === 3 && g === 'n' && istem === 'i' && (c === 'nom' || c === 'acc') ? 'ia' : E.pl[c]), c, n: 'p' });
  return out;
}
const laNounForm = (e, c, n) => laNounForms(e).find(f => f.c === c && f.n === n)?.w || null;
//            m nom      f nom       n nom        English       describes: p person · a animal · f food/drink · t thing · l place · r read   3 = 3rd declension (genitive)
const LA_ADJ = [['bonus', 'bona', 'bonum', 'good', 'pafrl'], ['malus', 'mala', 'malum', 'bad', 'pafr'], ['magnus', 'magna', 'magnum', 'big', 'patl'], ['parvus', 'parva', 'parvum', 'small', 'patl'],
  ['laetus', 'laeta', 'laetum', 'happy', 'pa'], ['novus', 'nova', 'novum', 'new', 'tlr'], ['longus', 'longa', 'longum', 'long', 'tlr'], ['altus', 'alta', 'altum', 'tall', 'tl'],
  ['clārus', 'clāra', 'clārum', 'famous', 'pl'], ['fessus', 'fessa', 'fessum', 'tired', 'pa'], ['īrātus', 'īrāta', 'īrātum', 'angry', 'pa'], ['validus', 'valida', 'validum', 'strong', 'pa'],
  ['albus', 'alba', 'album', 'white', 'at'], ['pulcher', 'pulchra', 'pulchrum', 'beautiful', 'patl'], ['miser', 'misera', 'miserum', 'unhappy', 'pa'],
  ['niger', 'nigra', 'nigrum', 'black', 'at'], ['ruber', 'rubra', 'rubrum', 'red', 't'],
  ['fortis', 'fortis', 'forte', 'brave', 'pa', 3], ['trīstis', 'trīstis', 'trīste', 'sad', 'pa', 3], ['dulcis', 'dulcis', 'dulce', 'sweet', 'f', 3], ['facilis', 'facilis', 'facile', 'easy', 'r', 3],
  ['ingēns', 'ingēns', 'ingēns', 'huge', 'patl', 'ingentis']];
/* every form of an adjective: [{ w, c, n, g }] */
function laAdjForms(a) {
  const out = [], push = (g, list) => list.forEach(f => out.push({ ...f, g }));
  if (!a[5]) {   // 1st/2nd declension: bonus, bona, bonum · pulcher, pulchra, pulchrum
    const st = a[1].slice(0, -1);
    push('m', laNounForms([a[0], st + 'ī', 'm', 2]));
    push('f', laNounForms([a[1], st + 'ae', 'f', 1]));
    push('n', laNounForms([a[2], st + 'ī', 'n', 2]));
    return out;
  }
  // 3rd declension adjectives: ablative singular -ī, plural -ia for neuter, genitive plural -ium
  const st = a[5] === 3 ? a[0].slice(0, -2) : a[5].slice(0, -2);
  for (const g of ['m', 'f', 'n']) {
    const nomS = g === 'n' ? a[2] : a[0];
    out.push({ w: nomS, c: 'nom', n: 's', g }, { w: g === 'n' ? a[2] : st + 'em', c: 'acc', n: 's', g }, { w: st + 'is', c: 'gen', n: 's', g }, { w: st + 'ī', c: 'dat', n: 's', g }, { w: st + 'ī', c: 'abl', n: 's', g },
      { w: st + (g === 'n' ? 'ia' : 'ēs'), c: 'nom', n: 'p', g }, { w: st + (g === 'n' ? 'ia' : 'ēs'), c: 'acc', n: 'p', g }, { w: st + 'ium', c: 'gen', n: 'p', g }, { w: st + 'ibus', c: 'dat', n: 'p', g }, { w: st + 'ibus', c: 'abl', n: 'p', g });
  }
  return out;
}
const laAdjForm = (a, c, n, g) => laAdjForms(a).find(f => f.c === c && f.n === n && f.g === g)?.w || null;
//            1st part   infinitive   conj  kind   what it takes (object)            needs one  English          he/she form    who: a = people and animals, p = only people   extra: m = motion (ad / in + accusative), d = takes a dative (to someone)
const LA_VERB = [
  ['amō', 'amāre', 1, 'tr', ['*'], 0, 'love', 'loves', 'a'], ['laudō', 'laudāre', 1, 'tr', ['person', 'animal'], 1, 'praise', 'praises', 'p'],
  ['vocō', 'vocāre', 1, 'tr', ['person', 'animal'], 1, 'call', 'calls', 'p'], ['portō', 'portāre', 1, 'tr', ['food', 'drink', 'read', 'thing'], 1, 'carry', 'carries', 'p', 'm'],
  ['parō', 'parāre', 1, 'tr', ['food'], 1, 'prepare', 'prepares', 'p'], ['spectō', 'spectāre', 1, 'tr', ['*'], 1, 'watch', 'watches', 'a'],
  ['exspectō', 'exspectāre', 1, 'tr', ['person', 'animal'], 1, 'wait for', 'waits for', 'a'], ['nārrō', 'nārrāre', 1, 'tr', ['read'], 1, 'tell', 'tells', 'p', 'd'],
  ['dō', 'dare', 1, 'tr', ['food', 'drink', 'read', 'thing'], 1, 'give', 'gives', 'p', 'd'], ['mōnstrō', 'mōnstrāre', 1, 'tr', ['*'], 1, 'show', 'shows', 'p', 'd'],
  ['ambulō', 'ambulāre', 1, 'in', null, 0, 'walk', 'walks', 'a', 'm'], ['labōrō', 'labōrāre', 1, 'in', null, 0, 'work', 'works', 'p'],
  ['cantō', 'cantāre', 1, 'in', null, 0, 'sing', 'sings', 'a'], ['nāvigō', 'nāvigāre', 1, 'in', null, 0, 'sail', 'sails', 'p', 'm'], ['habitō', 'habitāre', 1, 'in', null, 0, 'live', 'lives', 'a'],
  ['videō', 'vidēre', 2, 'tr', ['*'], 0, 'see', 'sees', 'a'], ['habeō', 'habēre', 2, 'tr', ['*'], 1, 'have', 'has', 'p'], ['teneō', 'tenēre', 2, 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'hold', 'holds', 'p'],
  ['timeō', 'timēre', 2, 'tr', ['person', 'animal'], 0, 'fear', 'fears', 'a'], ['moneō', 'monēre', 2, 'tr', ['person'], 1, 'warn', 'warns', 'p'], ['doceō', 'docēre', 2, 'tr', ['person'], 1, 'teach', 'teaches', 'p'],
  ['terreō', 'terrēre', 2, 'tr', ['person', 'animal'], 1, 'frighten', 'frightens', 'a'], ['sedeō', 'sedēre', 2, 'in', null, 0, 'sit', 'sits', 'a'], ['rīdeō', 'rīdēre', 2, 'in', null, 0, 'laugh', 'laughs', 'p'],
  ['maneō', 'manēre', 2, 'in', null, 0, 'stay', 'stays', 'a'],
  ['dūcō', 'dūcere', 3, 'tr', ['person', 'animal'], 1, 'lead', 'leads', 'p', 'm'], ['legō', 'legere', 3, 'tr', ['read'], 0, 'read', 'reads', 'p'], ['scrībō', 'scrībere', 3, 'tr', ['read'], 0, 'write', 'writes', 'p'],
  ['mittō', 'mittere', 3, 'tr', ['read', 'thing', 'person'], 1, 'send', 'sends', 'p', 'm'], ['bibō', 'bibere', 3, 'tr', ['drink'], 0, 'drink', 'drinks', 'a'], ['cōnsūmō', 'cōnsūmere', 3, 'tr', ['food'], 1, 'eat', 'eats', 'a'],
  ['quaerō', 'quaerere', 3, 'tr', ['*'], 1, 'look for', 'looks for', 'a'], ['relinquō', 'relinquere', 3, 'tr', ['*'], 1, 'leave', 'leaves', 'p'], ['vincō', 'vincere', 3, 'tr', ['person'], 1, 'defeat', 'defeats', 'p'],
  ['claudō', 'claudere', 3, 'tr', ['open'], 1, 'close', 'closes', 'p'], ['currō', 'currere', 3, 'in', null, 0, 'run', 'runs', 'a', 'm'],
  ['capiō', 'capere', 5, 'tr', ['*'], 1, 'take', 'takes', 'p'], ['faciō', 'facere', 5, 'tr', ['food', 'thing'], 1, 'make', 'makes', 'p'], ['fugiō', 'fugere', 5, 'in', null, 0, 'run away', 'runs away', 'a', 'm'],
  ['audiō', 'audīre', 4, 'tr', ['person', 'animal', 'read'], 0, 'hear', 'hears', 'a'], ['inveniō', 'invenīre', 4, 'tr', ['*'], 1, 'find', 'finds', 'a'], ['custōdiō', 'custōdīre', 4, 'tr', ['*'], 1, 'guard', 'guards', 'p'],
  ['aperiō', 'aperīre', 4, 'tr', ['open'], 1, 'open', 'opens', 'p'], ['veniō', 'venīre', 4, 'in', null, 0, 'come', 'comes', 'a', 'm'], ['dormiō', 'dormīre', 4, 'in', null, 0, 'sleep', 'sleeps', 'a'],
  ['sum', 'esse', 0, 'sum', null, 1, 'be', 'is', 'a'], ['possum', 'posse', 0, 'posse', null, 1, 'can', 'can', 'a'], ['eō', 'īre', 0, 'in', null, 0, 'go', 'goes', 'a', 'm']];
const LA_IRREG = { sum: 'sum es est sumus estis sunt', possum: 'possum potes potest possumus potestis possunt', eō: 'eō īs it īmus ītis eunt', dō: 'dō dās dat damus datis dant' };
/* present tense: I, you, he/she/it, we, you (all), they. conj 5 = 3rd conjugation -iō (capiō) */
function laConjugate(first, inf, conj) {
  if (LA_IRREG[first]) return LA_IRREG[first].split(' ');
  if (conj === 1) { const s = inf.slice(0, -3); return [s + 'ō', s + 'ās', s + 'at', s + 'āmus', s + 'ātis', s + 'ant']; }
  if (conj === 2) { const s = inf.slice(0, -3); return [s + 'eō', s + 'ēs', s + 'et', s + 'ēmus', s + 'ētis', s + 'ent']; }
  if (conj === 3) { const s = inf.slice(0, -3); return [s + 'ō', s + 'is', s + 'it', s + 'imus', s + 'itis', s + 'unt']; }
  if (conj === 5) { const s = inf.slice(0, -3); return [s + 'iō', s + 'is', s + 'it', s + 'imus', s + 'itis', s + 'iunt']; }
  if (conj === 4) { const s = inf.slice(0, -3); return [s + 'iō', s + 'īs', s + 'it', s + 'īmus', s + 'ītis', s + 'iunt']; }
  return [first, first, first, first, first, first];
}
const laForms = v => v.forms || (v.forms = laConjugate(v[0], v[1], v[2]));
const LA_PERSON = ['I', 'you', 'he/she', 'we', 'you (all)', 'they'];
//            word     case   person  number  English (subject / object)
const LA_PRON = [['ego', 'nom', 1, 's', 'I'], ['mē', 'acc', 1, 's', 'me'], ['mihi', 'dat', 1, 's', 'me'], ['tū', 'nom', 2, 's', 'you'], ['tē', 'acc', 2, 's', 'you'], ['tibi', 'dat', 2, 's', 'you'],
  ['nōs', 'nom', 1, 'p', 'we'], ['nōs', 'acc', 1, 'p', 'us'], ['nōbīs', 'dat', 1, 'p', 'us'], ['vōs', 'nom', 2, 'p', 'you'], ['vōs', 'acc', 2, 'p', 'you'], ['vōbīs', 'dat', 2, 'p', 'you']];
//            word    takes            English
const LA_PREP = [['in', ['abl', 'acc'], 'in / into'], ['ad', ['acc'], 'to'], ['cum', ['abl'], 'with'], ['ex', ['abl'], 'out of'], ['ē', ['abl'], 'out of'], ['sine', ['abl'], 'without'],
  ['per', ['acc'], 'through'], ['prope', ['acc'], 'near']];
//            word        English        where: time = start or end · how = anywhere, usually before the verb
const LA_ADV = [['hodiē', 'today', 'time'], ['crās', 'tomorrow', 'time'], ['nunc', 'now', 'time'], ['cotīdiē', 'every day', 'time'], ['semper', 'always', 'freq'], ['saepe', 'often', 'freq'],
  ['numquam', 'never', 'freq'], ['bene', 'well', 'how'], ['male', 'badly', 'how'], ['ibi', 'there', 'end'], ['hīc', 'here', 'end']];
const LA_CONJ = [['et', 'and'], ['sed', 'but']];
const LA_KIND = { food: 'food', drink: 'drinks', read: 'things you read or write', thing: 'things', place: 'places', animal: 'animals', person: 'people', open: 'things you can open' };
const LA_VOWEL = /^[aeiouāēīōūy]/i;
const LA_HOW = /^(labōrō|cantō|dormiō|legō|scrībō|currō|nāvigō|doceō|habitō|ambulō)$/;   // verbs that go with bene / male

/* ---------------- chips (one tray word each) ---------------- */
const laGlossNoun = (e, reads) => { const sg = reads.some(r => r.n === 's'), pl = reads.some(r => r.n === 'p'); return sg && pl ? `${e[5]} / ${e[6] || e[5]}` : pl ? e[6] || e[5] : e[5]; };
function laNounChip(e, w, want) { const reads = laNounForms(e).filter(f => f.w === w).map(f => ({ c: f.c, n: f.n }));
  return chip({ k: 'noun', w, e, g: e[2], cat: e[4], mass: !!e[7], reads, rd: want || null, gloss: laGlossNoun(e, reads) }); }
const laNoun = (e, c, n) => laNounChip(e, laNounForm(e, c, n), { c, n });
function laAdjChip(a, w, want) { const reads = laAdjForms(a).filter(f => f.w === w).map(f => ({ c: f.c, n: f.n, g: f.g })); return chip({ k: 'adj', w, e: a, reads, rd: want || null, gloss: a[3] }); }
const laAdj = (a, c, n, g) => laAdjChip(a, laAdjForm(a, c, n, g), { c, n, g });
const laVerb = (v, f) => chip({ k: 'verb', w: laForms(v)[f], e: v, f, type: v[3], gloss: `(${LA_PERSON[f]}) ${f === 2 ? v[7] : v[6]}`.replace(/\(I\) be$/, '(I) am').replace(/\((you|we|you \(all\)|they)\) be$/, '($1) are') });
const laInf = v => chip({ k: 'verb', inf: true, w: v[1], e: v, type: v[3], gloss: 'to ' + v[6] });
function laPronChip(w) { const reads = LA_PRON.filter(p => p[0] === w).map(p => ({ c: p[1], per: p[2], n: p[3], en: p[4] })); return chip({ k: 'pron', w, reads, gloss: [...new Set(reads.map(r => r.en))].join(' / ') }); }
const laPrep = w => { const p = LA_PREP.find(x => x[0] === w); return chip({ k: 'prep', w, takes: p[1], gloss: p[2] }); };
const laConj = w => chip({ k: 'conj', w, gloss: LA_CONJ.find(c => c[0] === w)[1] });
const laAdv = w => { const a = LA_ADV.find(x => x[0] === w); return chip({ k: 'adv', w, pos: a[2], en: a[1], gloss: a[1] }); };
const laNon = () => chip({ k: 'neg', w: 'nōn', gloss: 'not' });
const laValde = () => chip({ k: 'int', w: 'valdē', gloss: 'very' });
const laIsMotion = v => v && (v.e[9] === 'm');

/* ---------------- Latin checker ----------------
   Word order is free, so the checker doesn't read left to right like the French one. It works out what each word's
   ending can mean (puellae = "of the girl", "to the girl" or "the girls"), tries every way the endings can fit together,
   and keeps the reading with the fewest problems. A sentence is right when one reading has none. */
const laAn = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
const laNumName = n => n === 'p' ? 'plural' : 'singular', laGName = g => ({ m: 'masculine', f: 'feminine', n: 'neuter' })[g] || '';
const laVF = (per, n) => (per - 1) + (n === 'p' ? 3 : 0);   // person 1–3 and number → the verb form 0–5
function laCheck(T) {
  const clampAt = at => Math.max(0, Math.min(at, T.length - 1));
  const err = (msg, at = 0, end = false) => ({ ok: false, msg, at: clampAt(at), end: !!end || at >= T.length });
  if (!T.length) return err('Tap some words to build a sentence.');
  // rules about the word right next to another one
  for (let k = 0; k < T.length; k++) {
    const t = T[k], nx = T[k + 1];
    if (t.k === 'conj' && k === 0) return err(`“${t.w}” (${t.gloss}) joins two parts, so it can’t start the sentence.`, 0);
    if (t.k === 'conj' && !nx) return err(`“${t.w}” (${t.gloss}) joins two parts, so something has to come after it.`, k, true);
    if (t.k === 'prep' && !nx) return err(`“${t.w}” (${t.gloss}) needs a noun right after it.`, k, true);
    if (t.k === 'prep' && t.w === 'ē' && LA_VOWEL.test(laStrip(nx.w))) return err(`Before a vowel, Latin uses “ex”, not “ē”: “ex ${nx.w}”.`, k);
    if (t.k === 'neg' && !nx) return err('“nōn” (not) goes right before the verb.', k, true);
    if (t.k === 'neg' && nx.k !== 'verb') { const v = T.find(x => x.k === 'verb' && !x.inf); return err(`“nōn” (not) goes right before the verb it makes negative${v ? `: “nōn ${v.w}”` : ''}.`, k); }
    if (t.k === 'int' && !nx) return err('“valdē” (very) goes right before a describing word, like “valdē laeta”.', k, true);
    if (t.k === 'int' && !['adj', 'adv', 'verb'].includes(nx.k)) return err('“valdē” (very) goes right before a describing word (“valdē magnus”) or a verb.', k);
  }
  // "et" can join two words or two whole sentences: try both. "sed" always starts a new sentence part.
  const ets = T.map((t, i) => t.k === 'conj' && t.w === 'et' ? i : -1).filter(i => i >= 0).slice(0, 4);
  let best = null;
  for (let mask = 0; mask < (1 << ets.length); mask++) {
    const cut = new Set(T.map((t, i) => t.k === 'conj' && (t.w !== 'et' || (ets.includes(i) && (mask & (1 << ets.indexOf(i))))) ? i : -1).filter(i => i >= 0));
    const parts = [[]], conjs = [];
    T.forEach((t, i) => { if (cut.has(i)) { conjs.push(t); parts.push([]); } else parts[parts.length - 1].push({ t, i }); });
    if (parts.some(p => !p.length)) continue;
    const res = parts.map(laClause), errs = res.flatMap(r => r.errs), miss = res.reduce((s, r) => s + r.miss, 0);
    const noVerb = parts.filter(p => !p.some(x => x.t.k === 'verb')).length;   // cutting off a part with no verb is the worse explanation
    const score = errs.length * 1000 + noVerb * 1500 + miss;
    if (!best || score < best.score) best = { score, errs, res, conjs };
    if (score === 0) break;
  }
  if (!best) return err('Something is missing after “et”.', T.length - 1, true);
  if (best.errs.length) { const e = best.errs[0]; return err(e.msg, e.at, e.end); }
  return { ok: true, P: { clauses: best.res.map(r => r.parse), conjs: best.conjs } };
}
/* one sentence part: one finite verb, its subject and objects, and prepositional phrases */
function laClause(toks) {
  const errs = [], E = (msg, at, end) => errs.push({ msg, at, end: !!end });
  const out = () => ({ errs, miss: 0, parse: null });
  const lastAt = toks[toks.length - 1].i;
  const finite = toks.filter(x => x.t.k === 'verb' && !x.t.inf), infs = toks.filter(x => x.t.k === 'verb' && x.t.inf);
  if (!finite.length) {
    if (infs.length) { const v = infs[0].t; E(`“${v.w}” is the infinitive (to ${v.e[6]}). Use a form like “${laForms(v.e)[2]}” (he/she ${v.e[7]}), or add “potest” (can): “${v.w} potest”.`, infs[0].i, true); }
    else E('Every sentence needs a verb (an action word like “amat” or “est”).', lastAt, true);
    return out();
  }
  if (finite.length > 1) { E('One verb per sentence part. Use “et” or “sed” to join two sentences.', finite[1].i); return out(); }
  const V = finite[0].t, Vi = finite[0].i, vf = V.f, vPer = vf % 3 + 1, vNum = vf < 3 ? 's' : 'p';
  let A = V, Ai = Vi;   // the verb that takes the objects: possum + infinitive → the infinitive
  if (infs.length > 1) E('Use only one infinitive (to …) with possum.', infs[1].i);
  if (V.type === 'posse') {
    if (!infs.length) E(`“${V.w}” (can) needs a second verb in the infinitive (to …), like “cantāre ${V.w}” (can sing).`, Vi, true);
    else if (infs[0].t.type === 'posse') E('“posse” can’t go with possum. Pick another verb, like “cantāre potest”.', infs[0].i);
    else { A = infs[0].t; Ai = infs[0].i; }
  } else if (infs.length) E(`“${infs[0].t.w}” (to ${infs[0].t.e[6]}) is the infinitive. Here it only goes with possum (can): “${infs[0].t.w} ${laForms(LA_VERB.find(v => v[0] === 'possum'))[vf]}”.`, infs[0].i);
  if (errs.length) return out();
  const motion = A.e[9] === 'm', dative = A.e[9] === 'd', isSum = A.type === 'sum';
  const negs = toks.filter(x => x.t.k === 'neg'), never = toks.find(x => x.t.k === 'adv' && x.t.w === 'numquam');
  if (negs.length > 1) E('Use “nōn” only once.', negs[1].i);
  if (negs.length && never) E('“numquam” already means “never”, so leave out “nōn”.', negs[0].i);
  for (const n of negs) { const nx = toks[toks.indexOf(n) + 1]; if (nx && nx.t.inf) E(`Put “nōn” right before “${V.w}”: “nōn ${V.w}”.`, n.i); }
  // prepositions come right before their noun (an adjective may sit just before or just after the noun)
  const used = new Set(), pps = [];
  toks.forEach((x, p) => {
    if (x.t.k !== 'prep') return;
    const P = x.t; used.add(x.i);
    let j = p + 1; const pre = toks[j]?.t.k === 'adj' ? toks[j++] : null, nx = toks[j];
    if (!nx || nx.t.k !== 'noun') { E(nx?.t.k === 'pron' ? `“${P.w}” goes with a noun here, like “${P.w} ${P.w === 'cum' ? 'amīcō' : P.takes[0] === 'acc' ? 'vīllam' : 'vīllā'}”.` : `“${P.w}” (${P.gloss}) needs its noun right after it.`, nx ? nx.i : x.i, !nx); return; }
    used.add(nx.i); if (pre) used.add(pre.i);
    const N = nx.t, ok = N.reads.filter(r => P.takes.includes(r.c));
    const ex = c => laNounForm(N.e, c, N.reads[0].n) || laNounForm(N.e, c, 's');
    if (!ok.length) { const c = P.w === 'in' ? (motion ? 'acc' : 'abl') : P.takes[0]; E(`“${P.w}” takes the ${LA_CASE_NAME[c]}${P.w === 'in' ? (c === 'abl' ? ' for where something is' : ' for where something goes') : ''}: “${P.w} ${ex(c)}”.`, nx.i); return; }
    const r = P.w === 'in' ? (motion && ok.find(q => q.c === 'acc')) || ok.find(q => q.c === 'abl') || ok[0] : ok[0];
    if (P.w === 'in' && r.c === 'acc' && !motion) E(`“in” with the accusative means “into”, so it needs a verb of motion (like it, venit or ambulat). For where something is, use the ablative: “in ${ex('abl')}”.`, nx.i);
    if (['ad', 'per', 'ex', 'ē'].includes(P.w) && !motion) E(`“${P.w}” (${P.gloss}) needs a verb of motion, like “it” (goes), “venit” (comes) or “ambulat” (walks).`, x.i);
    if (P.w === 'cum' && !['person', 'animal'].includes(N.cat)) E('“cum” (with) goes with a person or an animal here: “cum amīcō”.', x.i);
    if (['in', 'ex', 'ē', 'per'].includes(P.w) && !['place', 'thing'].includes(N.cat)) E(`“${P.w}” (${P.w === 'in' ? (r.c === 'acc' ? 'into' : 'in') : P.gloss}) goes with a place here, like “${P.w} ${r.c === 'acc' ? 'silvam' : 'silvā'}”.`, nx.i);
    if (P.w === 'ad' && !['place', 'person', 'thing'].includes(N.cat)) E('“ad” (to) goes with a place or a person here: “ad vīllam”, “ad amīcum”.', nx.i);
    const np = { tok: nx, n: N, r, adjs: [] };
    const agree = a => a.t.reads.find(q => q.c === r.c && q.n === r.n && q.g === N.g);
    if (pre) { const q = agree(pre); if (!q) E(`“${pre.t.w}” has to match “${N.w}” (${LA_CASE_NAME[r.c]} ${laNumName(r.n)}, ${laGName(N.g)}): use “${laAdjForm(pre.t.e, r.c, r.n, N.g)}”.`, pre.i); else np.adjs.push({ tok: pre, r: q }); }
    const post = toks[j + 1];
    if (post && post.t.k === 'adj' && agree(post)) { used.add(post.i); np.adjs.push({ tok: post, r: agree(post) }); }
    pps.push({ p: P, tok: x, np });
  });
  const rest = toks.filter(x => !used.has(x.i) && x.t.k !== 'verb');
  const nouns = rest.filter(x => x.t.k === 'noun'), prons = rest.filter(x => x.t.k === 'pron'), adjs = rest.filter(x => x.t.k === 'adj'), ets = rest.filter(x => x.t.k === 'conj');
  const items = [...nouns, ...prons].sort((a, b) => a.i - b.i);
  // try every reading of every noun and pronoun (a few thousand at most)
  const choices = items.map(x => x.t.reads);
  let total = choices.reduce((s, c) => s * c.length, 1);
  for (let k = 0; total > 6000 && k < choices.length; k++) if (choices[k].length > 1) { total /= choices[k].length; const rd = items[k].t.rd; choices[k] = [choices[k].find(r => rd && r.c === rd.c && r.n === rd.n) || choices[k][0]]; }
  const ctx = { V, Vi, A, Ai, vf, vPer, vNum, motion, dative, isSum, negs, never, toks };
  let best = null;
  const pick = new Array(items.length).fill(0);
  for (let combo = 0; combo < total; combo++) {
    let x = combo; for (let k = 0; k < items.length; k++) { pick[k] = x % choices[k].length; x = Math.floor(x / choices[k].length); }
    const r = laAssign(items.map((it, k) => ({ ...it, r: choices[k][pick[k]] })), adjs, ets, pps, ctx);
    const score = r.errs.length * 1000 + r.miss;
    if (!best || score < best.score) best = { ...r, score };
    if (score === 0) break;
  }
  errs.push(...best.errs); errs.sort((a, b) => a.at - b.at);
  return { errs, miss: best.miss, parse: best.parse };
}
/* how well one reading of the endings works: its problems (fewest wins) and the sentence it means */
function laAssign(items, adjs, ets, pps, C) {
  const errs = [], E = (msg, at, end) => errs.push({ msg, at, end: !!end });
  const { V, Vi, A, Ai, vf, vPer, vNum, motion, dative, isSum } = C;
  const forms = laForms(V.e);
  // which reading wins when several are right: the one the tray was made with, then the plainest (a subject before "of" or "to")
  const miss = items.filter(x => x.t.rd && (x.t.rd.c !== x.r.c || x.t.rd.n !== x.r.n)).length * 10 + items.filter(x => x.r.c === 'gen' || (x.r.c === 'dat' && !dative)).length
    + Math.max(0, items.filter(x => x.r.c === 'nom').length - (isSum ? 2 : 1));
  // et between two words: both in the same case
  const pair = new Map();
  for (const et of ets) {
    const L = [...items].reverse().find(x => x.i < et.i), R = items.find(x => x.i > et.i);
    if (!L || !R) { E('“et” (and) joins two nouns, or two whole sentences. Put a word on each side of it.', et.i, !R); continue; }
    if (L.r.c !== R.r.c) { const fix = R.t.k === 'noun' && laNounForm(R.t.e, L.r.c, R.r.n); E(`“et” joins two words in the same case: “${L.t.w}” is ${LA_CASE_NAME[L.r.c]} here, but “${R.t.w}” is ${LA_CASE_NAME[R.r.c]}${fix ? ` (use “${fix}”)` : ''}.`, R.i); continue; }
    pair.set(L, R); pair.set(R, L);
  }
  const groups = c => { const seen = new Set(), g = []; for (const x of items.filter(y => y.r.c === c)) { if (seen.has(x)) continue; const o = pair.get(x); seen.add(x); if (o && o.r.c === c) { seen.add(o); g.push([x, o]); } else g.push([x]); } return g; };
  const gText = g => g.map(x => x.t.w).join(' et ');
  const gNum = g => g.length > 1 ? 'p' : g[0].r.n;
  // the subject (nominative) and, after sum, what the subject is
  const noms = groups('nom'), pronSubj = noms.find(g => g.length === 1 && g[0].t.k === 'pron');
  let subj = null, pred = null;
  if (pronSubj) {
    const p = pronSubj[0];
    if (p.r.per !== vPer || p.r.n !== vNum) E(`“${V.w}” doesn’t match “${p.t.w}” (${p.r.en}). Use “${forms[laVF(p.r.per, p.r.n)]}”.`, Vi);
    subj = pronSubj;
    for (const g of noms.filter(g => g !== pronSubj)) { if (isSum && !pred) pred = { noun: g }; else E(`“${gText(g)}” is nominative (a subject), but the subject here is already “${p.t.w}”.`, g[0].i); }
  } else if (noms.length) {
    let order = noms;
    if (isSum && noms.length === 2 && gNum(noms[0]) !== vNum && gNum(noms[1]) === vNum) order = [noms[1], noms[0]];
    if (vPer !== 3) { if (isSum) pred = { noun: order[0] }; else E(`“${V.w}” means “${LA_PERSON[vf]} ${A.e[6]}”, so “${gText(order[0])}” can’t be its subject. With “${gText(order[0])}” as the subject, use “${forms[gNum(order[0]) === 'p' ? 5 : 2]}”.`, Vi); }
    else {
      subj = order[0];
      if (gNum(subj) !== vNum) E(`“${V.w}” doesn’t match the subject “${gText(subj)}” (${gNum(subj) === 'p' ? 'more than one' : 'just one'}). Use “${forms[gNum(subj) === 'p' ? 5 : 2]}”.`, Vi);
      if (order[1]) { if (isSum) pred = { noun: order[1] }; else E(`Two subjects: “${gText(order[0])}” and “${gText(order[1])}” are both nominative. Join them with “et”, or change one of them to another case.`, order[1][0].i); }
    }
    for (const g of order.slice(2)) E(`“${gText(g)}” is nominative too. A sentence part has only one subject.`, g[0].i);
  }
  const placeWord = C.toks.some(x => x.t.k === 'adv' && ['hīc', 'ibi'].includes(x.t.w));
  // "agricola est": with nothing else, the noun is what he/she is
  if (isSum && subj && !pronSubj && !pred && !pps.length && !adjs.length && !placeWord) { pred = { noun: subj }; subj = null; }
  // it has to make sense: a table can't walk
  if (subj && !pronSubj && A.type !== 'sum') for (const x of subj) {
    const c = x.t.cat, what = x.r.n === 'p' ? x.t.e[6] || x.t.e[5] : laAn(x.t.e[5]) + ' ' + x.t.e[5];
    if (c !== 'person' && c !== 'animal') E(`That doesn’t make sense: ${what} can’t ${A.e[6]}. Use a person or an animal here.`, x.i);
    else if (c === 'animal' && A.e[8] === 'p') E(`That doesn’t make sense: ${what} can’t ${A.e[6]}. Only people ${A.e[6]}.`, x.i);
  }
  // the object (accusative)
  const accs = groups('acc'), objs = [];
  if (A.type === 'tr') {
    accs.forEach((g, k) => { if (k) E('Only one object (accusative) here. To have two, join them with “et”.', g[0].i); else objs.push(...g); });
    for (const x of objs) {
      const cats = A.e[4], fits = x.t.k === 'pron' ? cats[0] === '*' || cats.includes('person') : cats[0] === '*' || (cats[0] === 'open' ? LA_OPENABLE.includes(x.t.e[0]) : cats.includes(x.t.cat));
      if (!fits) E(`That doesn’t make sense: you can’t ${A.e[6]} ${x.t.k === 'pron' ? x.r.en : x.r.n === 'p' || x.t.mass ? x.t.e[6] || x.t.e[5] : laAn(x.t.e[5]) + ' ' + x.t.e[5]}. “${A.e[0]}” goes with ${cats.map(c => LA_KIND[c]).join(', ')}.`, x.i);
    }
    if (!objs.length && A.e[5]) E(`“${A.w}” (${A.e[6]}) needs an object in the accusative. What ${vNum === 's' && vPer === 3 ? 'does he or she' : 'do you'} ${A.e[6]}? For example “${laExampleObj(A.e)} ${A.w}”.`, Ai, true);
  } else for (const g of accs) for (const x of g) {
    const nomF = x.t.k === 'noun' ? laNounForm(x.t.e, 'nom', x.r.n) : null;
    E(isSum ? `“${x.t.w}” is accusative. After “${V.w}”, the noun that says what the subject is stays in the nominative${nomF ? `: “${nomF}”` : ''}.`
      : `“${A.w}” (${A.e[6]}) doesn’t take an object, so “${x.t.w}” (accusative) doesn’t fit here.${motion && x.t.k === 'noun' ? ` To say where to, put “ad” before it: “ad ${x.t.w}”.` : ''}`, x.i);
  }
  // the dative (to / for someone): only with dō, nārrō, mōnstrō
  const dats = groups('dat'), datObj = [];
  dats.forEach((g, k) => {
    if (!dative) { for (const x of g) E(`“${x.t.w}” is dative (to / for …), and “${A.w}” (${A.e[6]}) doesn’t take one.${x.t.reads?.some(q => q.c === 'gen') ? ' If you mean “of”, put it next to the noun it belongs to.' : ''}`, x.i); }
    else if (k) E('Only one dative (to someone) here.', g[0].i); else datObj.push(...g);
  });
  // the genitive (of …) goes with another noun: the nearest one
  const heads = [...items.filter(x => x.r.c !== 'gen' && x.t.k === 'noun'), ...pps.map(p => p.np.tok)];
  const gens = [];
  for (const x of items.filter(y => y.r.c === 'gen')) {
    if (x.t.k === 'pron') { E(`“${x.t.w}” doesn’t fit here.`, x.i); continue; }
    const h = heads.filter(y => y !== x).sort((a, b) => Math.abs(a.i - x.i) - Math.abs(b.i - x.i))[0];
    if (!h) E(`“${x.t.w}” is genitive (“of the ${x.r.n === 'p' ? x.t.e[6] || x.t.e[5] : x.t.e[5]}”). It needs a noun to go with, like “fīlia ${x.t.w}”.`, x.i, true);
    else gens.push({ x, h });
  }
  // the ablative needs a preposition here
  for (const x of items.filter(y => y.r.c === 'abl')) E(`“${x.t.w}” is ablative. In these sentences the ablative goes after a preposition, like “cum ${x.t.w}” (with) or “in ${x.t.w}” (in).`, x.i);
  // adjectives match their noun (case, number, gender), or after sum they describe the subject
  const att = new Map(), subjNum = subj ? (pronSubj ? subj[0].r.n : gNum(subj)) : vNum;
  const subjG = subj && !pronSubj ? (subj.length > 1 ? (subj.some(x => x.t.g === 'm') ? 'm' : subj[0].t.g) : subj[0].t.g) : null;
  const predOK = q => isSum && q.c === 'nom' && q.n === subjNum && (subjG ? q.g === subjG : pronSubj || vPer < 3 ? q.g !== 'n' : true);
  const nounItems = items.filter(x => x.t.k === 'noun');
  for (const a of adjs) {
    const cands = nounItems.map(x => ({ x, q: a.t.reads.find(q => q.c === x.r.c && q.n === x.r.n && q.g === x.t.g) })).filter(o => o.q).sort((p, q) => Math.abs(p.x.i - a.i) - Math.abs(q.x.i - a.i));
    if (cands.length) { att.set(a, { to: cands[0].x, r: cands[0].q }); continue; }
    const pq = a.t.reads.find(predOK);
    if (pq && !pred) { pred = { adj: a, r: pq }; continue; }
    const sameCase = x => a.t.reads.some(q => q.c === x.r.c) ? 0 : 1;
    const near = nounItems.slice().sort((p, q) => sameCase(p) - sameCase(q) || Math.abs(p.i - a.i) - Math.abs(q.i - a.i))[0];
    const pn = isSum && !pred && a.t.reads.find(q => q.c === 'nom');
    if (pn && (!near || subj?.includes(near) || !sameCase(near) === false)) { pred = { adj: a, r: pn }; const g = subjG || 'm'; E(`After “${V.w}”, the describing word matches the subject${subj ? ` “${gText(subj)}”` : ''}: “${laAdjForm(a.t.e, 'nom', subjNum, g)}”${!subjG ? ` (or “${laAdjForm(a.t.e, 'nom', subjNum, 'f')}” for a woman or a girl)` : ''}.`, a.i); }
    else if (near) E(`“${a.t.w}” has to match “${near.t.w}” (${LA_CASE_NAME[near.r.c]} ${laNumName(near.r.n)}, ${laGName(near.t.g)}): use “${laAdjForm(a.t.e, near.r.c, near.r.n, near.t.g)}”.`, a.i);
    else if (isSum && !pred) { const g = subjG || 'm'; E(`After “${V.w}”, the describing word matches the subject: “${laAdjForm(a.t.e, 'nom', subjNum, g)}”${!subjG ? ` (or “${laAdjForm(a.t.e, 'nom', subjNum, 'f')}” for a woman or a girl)` : ''}.`, a.i); }
    else E(`“${a.t.w}” (${a.t.e[3]}) needs a noun to describe.`, a.i, true);
  }
  // "puella laeta est": the adjective next to the subject is what she is
  const hasPlace = pps.length || placeWord;
  if (isSum && !pred && !hasPlace && subj) { const a = [...att.entries()].find(([, v]) => subj.includes(v.to) && v.r.c === 'nom'); if (a) { att.delete(a[0]); pred = { adj: a[0], r: a[1].r }; } }
  if (isSum && !pred && !hasPlace) E(`“${V.w}” (${vf === 0 ? 'am' : vf === 2 ? 'is' : 'are'}) needs something with it: a describing word (“laeta est”), a noun (“agricola est”) or a place (“in vīllā est”).`, Vi, true);
  return { errs, miss, parse: { V, A, vf, subj, pred, objs, dats: datObj, pps, att, gens, items, toks: C.toks, neg: C.negs.length > 0, never: !!C.never } };
}
const laExampleObj = v => ({ food: 'cēnam', drink: 'aquam', read: 'epistulam', thing: 'rosam', place: 'vīllam', animal: 'equum', person: 'amīcum', open: 'portam', '*': 'puellam' })[v[4][0]] || 'rosam';

/* English meaning of a correct Latin sentence */
function laEnglish(P) {
  const one = C => {
    const veryOf = x => { const k = C.toks.indexOf(x); return k > 0 && C.toks[k - 1].t.k === 'int' ? 'very ' : ''; };
    const noun = (x, r) => r.n === 'p' ? x.t.e[6] || x.t.e[5] : x.t.e[5];
    const adjsOf = x => [...C.att.entries()].filter(([, v]) => v.to === x).map(([a]) => veryOf(a) + a.t.e[3]);
    const poss = s => /s$/.test(s) ? s + '’' : s + '’s';
    const np = (x, r, extra = []) => {
      if (x.t.k === 'pron') return x.r.en;
      const ad = [...extra, ...adjsOf(x)], base = (ad.length ? ad.join(', ') + ' ' : '') + noun(x, r || x.r);
      const gs = C.gens.filter(g => g.h === x).map(g => g.x);
      const own = gs.find(g => ['person', 'animal'].includes(g.t.cat));
      if (own) return `${poss(np(own, own.r))} ${base}` + gs.filter(g => g !== own).map(g => ' of ' + np(g, g.r)).join('');
      return 'the ' + base + gs.map(g => ' of ' + np(g, g.r)).join('');
    };
    const grp = g => g.map(x => np(x)).join(' and ');
    const f = C.vf, third = C.subj ? C.subj.length === 1 && C.subj[0].t.k === 'noun' && C.subj[0].r.n === 's' : f === 2;
    const who = C.subj ? grp(C.subj) : f === 2 && C.pred?.adj ? ({ m: 'he', f: 'she', n: 'it' })[C.pred.r.g] : LA_PERSON[f].replace(' (all)', '');
    const advs = C.toks.filter(x => x.t.k === 'adv'), freq = advs.filter(x => ['semper', 'saepe'].includes(x.t.w)).map(x => x.t.en).join(' ');
    const how = advs.filter(x => ['bene', 'male'].includes(x.t.w)).map(x => veryOf(x) + x.t.en), tail = advs.filter(x => ['time', 'end'].includes(x.t.pos)).map(x => x.t.en);
    const neg = C.neg, never = C.never, A = C.A;
    let vp;
    if (A.type === 'sum' && C.V.type !== 'posse') {
      const be = f === 0 ? 'am' : third ? 'is' : 'are';
      let what = '';
      if (C.pred?.adj) what = veryOf(C.pred.adj) + C.pred.adj.t.e[3];
      else if (C.pred?.noun) what = C.pred.noun.map(x => x.r.n === 'p' ? noun(x, x.r) : `${laAn(noun(x, x.r))} ${noun(x, x.r)}`).join(' and ');
      vp = `${be}${never ? ' never' : neg ? ' not' : ''}${freq ? ' ' + freq : ''} ${what}`;
    } else {
      const base = A.e[6], s3 = A.e[7];
      if (C.V.type === 'posse') vp = `${never ? 'can never' : neg ? 'cannot' : 'can'}${freq ? ' ' + freq : ''} ${A.type === 'sum' ? 'be' : base}`;
      else vp = never ? `never ${third ? s3 : base}` : neg ? `${third ? 'does' : 'do'} not${freq ? ' ' + freq : ''} ${base}` : `${freq ? freq + ' ' : ''}${third ? s3 : base}`;
      if (C.objs.length) vp += ' ' + C.objs.map(x => np(x)).join(' and ');
      if (C.dats.length) vp += ' to ' + C.dats.map(x => np(x)).join(' and ');
    }
    if (how.length) vp += ' ' + how.join(' ');
    for (const { p, np: q } of C.pps) {
      const pe = p.w === 'in' ? (q.r.c === 'acc' ? 'into' : 'in') : ({ ad: 'to', cum: 'with', ex: 'out of', ē: 'out of', sine: 'without', per: 'through', prope: 'near' })[p.w];
      vp += ` ${pe} ${np(q.tok, q.r, q.adjs.map(a => veryOf(a.tok) + a.tok.t.e[3]))}`;
    }
    if (tail.length) vp += ' ' + tail.join(' ');
    return `${who} ${vp}`.replace(/\s+/g, ' ').trim();
  };
  let s = one(P.clauses[0]);
  P.conjs.forEach((c, k) => { s += (c.w === 'sed' ? ', but ' : ', and ') + one(P.clauses[k + 1]); });
  return s[0].toUpperCase() + s.slice(1) + '.';
}

/* ---------------- making a Latin tray ----------------
   The sentence is made in the usual school order: (when) subject, (to whom), object, (where), (nōn) verb.
   The other words in the tray are look-alikes: the same noun in another case, the verb in another person… */
function laGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = list => { const fav = list.filter(x => pref.has(x[0]) || pref.has(laStrip(x[0]))); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const used = new Set();   // a noun once per sentence ("the kings love the kings" is no fun)
  const nounOf = cats => { const all = LA_NOUN.filter(n => cats[0] === '*' || cats.includes(n[4]) || (cats[0] === 'open' && LA_OPENABLE.includes(n[0]))), fresh = all.filter(n => !used.has(n)); return RP(fresh.length ? fresh : all); };
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
  const adjFor = cat => RP(LA_ADJ.filter(a => a[4].includes(CAT[cat] || 'p')));
  const extra = [];
  const other = (e, c, n) => { const alts = laNounForms(e).filter(f => f.w !== laNounForm(e, c, n)); return alts.length ? R(alts) : null; };
  const verbOf = test => RP(LA_VERB.filter(test));
  // a noun with (maybe) a describing word and (maybe) "of someone"
  const np = (e, c, n, out, opts = {}) => {
    const nn = e[7] ? 's' : n;
    used.add(e); out.push(laNoun(e, c, nn));
    const o = other(e, c, nn); if (o) extra.push(laNounChip(e, o.w));
    if (opts.adj !== false && coin(0.32)) {
      const a = adjFor(e[4]), v = opts.very && coin(0.2);
      if (v) out.push(laValde());
      out.push(laAdj(a, c, nn, e[2]));
      const wrongG = e[2] === 'm' ? 'f' : 'm', wrong = laAdjForm(a, c, nn, wrongG) !== laAdjForm(a, c, nn, e[2]) ? laAdjForm(a, c, nn, wrongG) : laAdjForm(a, c === 'nom' ? 'acc' : 'nom', nn, e[2]);
      if (wrong && wrong !== laAdjForm(a, c, nn, e[2])) extra.push(laAdjChip(a, wrong));
    }
    if (opts.of && coin(0.15)) { const g = nounOf(['person']); if (g !== e) { out.push(laNoun(g, 'gen', 's')); extra.push(laNounChip(g, g[0])); } }
    return nn;
  };
  const clause = () => {
    const out = [], kind = R(['tr', 'tr', 'tr', 'in', 'sum', 'sum', 'motion', 'posse', 'dat']);
    let V, A;
    if (kind === 'sum') V = A = LA_VERB.find(v => v[0] === 'sum');
    else if (kind === 'posse') { V = LA_VERB.find(v => v[0] === 'possum'); A = verbOf(v => ['tr', 'in'].includes(v[3]) && !v[9]); }
    else if (kind === 'motion') V = A = verbOf(v => v[9] === 'm');
    else if (kind === 'dat') V = A = verbOf(v => v[9] === 'd');
    else V = A = verbOf(v => v[3] === kind && v[9] !== 'd' && (kind !== 'tr' || v[9] !== 'm' || coin(0.4)));
    // who does it: left out (the verb shows it), a pronoun, or a noun
    let f, g = R(['m', 'f']), subjE = null, two = false;
    const r = Math.random();
    if (r < 0.4) f = Math.floor(Math.random() * 6);
    else if (r < 0.55) { f = R([0, 1, 3, 4]); out.push(laPronChip(['ego', 'tū', '', 'nōs', 'vōs'][f])); }
    else {
      subjE = nounOf(A[8] === 'p' || A[3] === 'sum' ? ['person'] : ['person', 'animal']); g = subjE[2];
      const n = coin(0.3) ? 'p' : 's'; np(subjE, 'nom', n, out, { very: true, of: true }); f = n === 'p' ? 5 : 2;
      if (coin(0.1)) { const e2 = nounOf(['person']); if (e2 !== subjE) { out.push(laConj('et')); np(e2, 'nom', 's', out, { adj: false }); f = 5; if (e2[2] === 'm') g = 'm'; } }
    }
    const num = f < 3 ? 's' : 'p', pre = [];
    if (coin(0.2)) out.unshift(laAdv(R(['hodiē', 'nunc', 'cotīdiē'])));
    let verbAt = null;
    if (kind === 'sum') {
      const x = Math.random();
      if (x < 0.6) { const a = adjFor(subjE ? subjE[4] : 'person'); if (coin(0.2)) out.push(laValde()); out.push(laAdj(a, 'nom', num, g)); extra.push(laAdjChip(a, laAdjForm(a, 'acc', num, g))); }
      else { const pl = nounOf(['place']); out.push(laPrep('in')); np(pl, 'abl', 's', out, { adj: false }); extra.push(laNounChip(pl, laNounForm(pl, 'acc', 's'))); }
    } else {
      if (A[9] === 'd' && coin(0.75)) { const d = nounOf(['person']); np(d, 'dat', coin(0.3) ? 'p' : 's', out, { adj: false }); }
      if (A[3] === 'tr') {
        if (coin(0.1) && (A[4][0] === '*' || A[4].includes('person'))) { const p = R(['mē', 'tē', 'nōs', 'vōs'].filter(w => !(w === 'mē' && f === 0) && !(w === 'tē' && f === 1) && !(w === 'nōs' && f === 3) && !(w === 'vōs' && f === 4))); out.push(laPronChip(p)); }
        else { const o = nounOf(A[4]); np(o, 'acc', o[7] ? 's' : coin(0.3) ? 'p' : 's', out, { of: true }); }
      }
      if (A[9] === 'm' && coin(0.65)) {
        const pl = A[0] === 'nāvigō' ? RP(LA_NOUN.filter(n => ['īnsula', 'urbs', 'oppidum'].includes(n[0]))) : RP(LA_NOUN.filter(n => n[4] === 'place' && (A[0] === 'eō' || A[0] === 'veniō' || n[0] !== 'culīna'))), p = R(['ad', 'ad', 'in', 'ex']);
        if (p === 'ex' && !LA_VOWEL.test(laStrip(pl[0])) && coin(0.5)) { out.push(laPrep('ē')); np(pl, 'abl', 's', out, { adj: false }); }
        else { out.push(laPrep(p)); np(pl, p === 'ex' ? 'abl' : 'acc', 's', out, { adj: false }); }
        extra.push(laNounChip(pl, laNounForm(pl, p === 'ex' ? 'acc' : 'abl', 's')));
      } else if (A[3] === 'in' && coin(0.6)) {
        if (coin(0.5) && !A[9]) { const pl = nounOf(['place']); out.push(laPrep('in')); np(pl, 'abl', 's', out, { adj: false }); }
        else { const w = nounOf(['person', 'animal']); out.push(laPrep('cum')); np(w, 'abl', 's', out, { adj: false }); }
      }
      if (coin(0.18)) out.push(laAdv(R(LA_HOW.test(A[0]) ? ['saepe', 'semper', 'bene'] : ['saepe', 'semper'])));
    }
    const neg = coin(0.18) && !out.some(c => c.k === 'adv' && c.w === 'numquam');
    if (neg) out.push(laNon()); else extra.push(laNon());
    if (V !== A) { out.push(laInf(A)); verbAt = out.length; }
    out.push(laVerb(V, f));
    extra.push(laVerb(V, (f + 1 + Math.floor(Math.random() * 5)) % 6));
    if (V === A && A[3] !== 'sum' && coin(0.3)) extra.push(laInf(A));
    return out;
  };
  for (let tries = 0; tries < 150; tries++) {
    extra.length = 0; used.clear();
    let words = clause();
    if (Math.random() < 0.18) words = [...words, laConj(R(['et', 'sed'])), ...clause()];
    if (words.length > 13 || words.length < 2) continue;
    const res = laCheck(words); if (!res.ok) continue;
    extra.push(laPrep(R(['in', 'ad', 'cum'])), laPronChip(R(['ego', 'tū', 'nōs'])));
    if (!words.some(w => w.k === 'conj')) extra.push(laConj(R(['et', 'sed'])));
    const seen = new Set(words.map(w => w.k + w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && !seen.has(x.k + x.w)) { seen.add(x.k + x.w); uniq.push(x); }
    return { words, extra: uniq.slice(0, Math.max(4, 15 - words.length)), english: laEnglish(res.P) };
  }
  return null;
}

BLD_LANGS.la = { name: 'Latin', check: laCheck, gen: laGenerate, voice: 'la', english: laEnglish, types: ['pron', 'noun', 'verb', 'adj', 'prep', 'conj', 'adv'] };
BLD_ORDER.la = { rows: [
    ['The usual order (subject, object, verb)', [['noun', 'subject (nominative)'], ['adj', '(adjective)'], ['noun', 'object (accusative)'], ['verb', 'verb']]],
    ['Any other order works too: the endings show who does what', [['noun', 'object (accusative)'], ['noun', 'subject (nominative)'], ['verb', 'verb']]],
    ['No subject word: the verb’s ending shows who', [['noun', 'object'], ['verb', 'verb (amō = I love)']]],
    ['Saying what something is like (sum)', [['noun', 'subject'], ['adv', '(valdē)'], ['adj', 'adjective (nominative)'], ['verb', 'est / sunt']]],
    ['Where: a preposition and its noun stay together', [['noun', 'subject'], ['prep', 'in / ad / cum'], ['noun', 'noun'], ['verb', 'verb']]],
    ['To someone (dative)', [['noun', 'subject'], ['noun', 'to whom (dative)'], ['noun', 'what (accusative)'], ['verb', 'dat / nārrat']]],
    ['Can do something (possum)', [['noun', '(subject)'], ['adv', '(nōn)'], ['verb', 'infinitive'], ['verb', 'potest']]],
    ['Joining two sentences', [['verb', 'sentence'], ['conj', 'et / sed'], ['verb', 'sentence']]],
  ], tips: [
    ['noun', 'The <b>ending</b> shows the job: <b>puella</b> (the girl does it), <b>puellam</b> (it is done to the girl), <b>puellae</b> (of / to the girl, or the girls), <b>cum puellā</b> (with the girl).'],
    ['verb', 'The verb’s ending shows who: <b>-ō</b> I, <b>-s</b> you, <b>-t</b> he/she, <b>-mus</b> we, <b>-tis</b> you all, <b>-nt</b> they. So you can leave out ego, tū, nōs, vōs.'],
    ['adj', 'An adjective matches its noun in case, number and gender: <b>puella bona</b>, <b>puellam bonam</b>, <b>servī bonī</b>, <b>templum magnum</b>. It usually goes after the noun.'],
    ['prep', '<b>ad</b>, <b>per</b>, <b>prope</b> + accusative; <b>cum</b>, <b>ex / ē</b>, <b>sine</b> + ablative; <b>in</b> + ablative = in, + accusative = into.'],
    ['adv', '<b>nōn</b> goes right before the verb. <b>valdē</b> (very) goes right before the adjective.'],
    ['verb', 'Latin has no words for “the” or “a”: <b>puella</b> is “the girl” or “a girl”.'] ] };

/* ---------------- Your own Latin words (📚 Add my deck's words) ----------------
   Cards written like a dictionary entry give the game everything it needs:
     nouns: "puella, -ae, f." · "rēx, rēgis, m." · "templum, -ī, n." (nominative, genitive, gender)
     verbs: "amō, amāre, amāvī, amātum" (principal parts; the infinitive shows the conjugation)
     adjectives: "bonus, -a, -um" · "fortis, -e" · "ingēns, ingentis" */
const LA_ENTRY = {};   // first word → the whole dictionary entry seen on a card
function laParseEntry(s) {
  const t = String(s || '').toLowerCase().replace(/[,;.]/g, ' ').replace(/\s+/g, ' ').trim(), p = t.split(' ');
  if (!p[0] || !/^\p{L}+$/u.test(p[0])) return null;
  const w = p[0], full = (x, ref) => !x ? null : x.startsWith('-') ? laJoinEnd(ref, x.slice(1)) : x;
  // noun: nominative, genitive, gender
  if (p.length >= 3 && /^(m|f|n|c)$/.test(p[p.length - 1])) {
    const gen = full(p[1], w), g = p[p.length - 1] === 'c' ? 'm' : p[p.length - 1], b = laStrip(gen || '');
    const decl = /ae$/.test(b) ? 1 : /i$/.test(b) ? 2 : /is$/.test(b) ? 3 : 0;
    return decl ? { kind: 'noun', w, gen, g, decl } : null;
  }
  // verb: principal parts (2nd part is the infinitive)
  if (p.length >= 2 && /re$/.test(laStrip(p[1])) && /(ō|o|m)$/.test(w)) {
    const inf = full(p[1], w), b = laStrip(inf), io = /io$/.test(laStrip(w));
    const conj = /are$/.test(b) ? 1 : /ēre$/.test(inf) ? 2 : /īre$/.test(inf) ? 4 : /ere$/.test(b) ? (io ? 5 : /eo$/.test(laStrip(w)) ? 2 : 3) : /ire$/.test(b) ? 4 : 0;
    return conj ? { kind: 'verb', w, inf, conj } : null;
  }
  // adjective: bonus, -a, -um · fortis, -e · ingēns, ingentis
  if (p.length === 3 && /a$/.test(laStrip(p[1])) && /um$/.test(laStrip(p[2]))) {
    const f = full(p[1], w), n = full(p[2], w); return { kind: 'adj', w, forms: [w, f, n] };
  }
  if (p.length === 2 && /^-e$/.test(p[1]) && /is$/.test(laStrip(w))) return { kind: 'adj', w, forms: [w, w, w.slice(0, -2) + 'e', 3] };
  if (p.length === 2 && /is$/.test(laStrip(p[1])) && !/^-/.test(p[1])) return { kind: 'adj', w, forms: [w, w, w, p[1]] };
  return null;
}
// "puella" + "ae" → "puellae", "pater" + "tris" → "patris", "mīles" + "itis" → "mīlitis", "puer" + "ī" → "puerī", "bonus" + "a" → "bona"
function laJoinEnd(w, end) {
  const b = laStrip(w), e0 = laStrip(end)[0] || '';
  if (/^(āre|ēre|ere|īre|are|ire)$/.test(laStrip(end).replace(/e$/, 'e'))) {   // verbs: amō → amāre, videō → vidēre, capiō → capere, audiō → audīre
    const cut = /eo$/.test(b) && /^ē/.test(end) ? 2 : /io$/.test(b) && /^(e|ī|i)/.test(end) ? 2 : 1;
    return w.slice(0, w.length - cut) + end;
  }
  if (end === 'ī' && /(er|ir)$/.test(b)) return w + end;   // puer → puerī, vir → virī
  if (e0 && !/[aeiouy]/.test(e0)) { const at = b.slice(0, -1).lastIndexOf(e0); if (at > 0) return w.slice(0, at) + end; }   // pater → patris, ager → agrī, pulcher → pulchra
  for (const cut of ['us', 'um', 'er', 'en', 'is', 'es', 'a', 'o', 'e', 'x', 's']) if (b.endsWith(cut)) return w.slice(0, w.length - cut.length) + end;
  return w + end;
}
const laIsVerbWord = w => /(ō|o)$/.test(w) || ['sum', 'possum'].includes(w);
const LA_BASE = { n: LA_NOUN.length, a: LA_ADJ.length, v: LA_VERB.length };
const laKnown = w => LA_NOUN.slice(0, LA_BASE.n).some(n => n[0] === w || laStrip(n[0]) === laStrip(w)) || LA_VERB.slice(0, LA_BASE.v).some(v => v[0] === w || laStrip(v[0]) === laStrip(w))
  || LA_ADJ.slice(0, LA_BASE.a).some(a => a.slice(0, 3).includes(w)) || [LA_PRON, LA_PREP, LA_CONJ, LA_ADV].some(L => L.some(x => x[0] === w)) || ['nōn', 'valdē'].includes(w);
function laApplyMine() {
  LA_NOUN.length = LA_BASE.n; LA_ADJ.length = LA_BASE.a; LA_VERB.length = LA_BASE.v;
  for (const m of S.bldWords || []) {
    if (!m || m.lang !== 'la' || !m.w || !m.en || laKnown(m.w)) continue;
    const e = laParseEntry(m.read || '') || {};
    if (m.k === 'noun') {
      const gen = e.kind === 'noun' ? e.gen : laGuessGen(m.w), b = laStrip(gen || ''), decl = e.decl || (/ae$/.test(b) ? 1 : /i$/.test(b) ? 2 : /is$/.test(b) ? 3 : 0);
      if (!gen || !decl) continue;
      LA_NOUN.push([m.w, gen, e.g || m.g || (decl === 1 ? 'f' : /um$/.test(m.w) ? 'n' : 'm'), decl, m.cat || 'thing', m.en, bldPlEn(m.en)]);
    }
    if (m.k === 'verb' && Array.isArray(m.forms) && m.forms.length === 6) {
      const inf = e.kind === 'verb' ? e.inf : laGuessInf(m.forms), conj = e.conj || 0; if (!inf) continue;
      const type = m.obj === 'in' ? 'in' : 'tr', objs = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read', 'place'];
      const v = [m.w, inf, conj, type, type === 'tr' ? objs : null, 0, m.en, bld3sEn(m.en), m.who === 'a' ? 'a' : 'p']; v.forms = m.forms; LA_VERB.push(v);
    }
    if (m.k === 'adj') { const f = e.kind === 'adj' ? e.forms : laGuessAdj(m.w); if (f) LA_ADJ.push([f[0], f[1], f[2], m.en, 'patflr', ...(f[3] ? [f[3]] : [])]); }
  }
}
// without a full dictionary entry: a best guess from the ending (puella → puellae, servus → servī, templum → templī)
const laGuessGen = w => /a$/.test(w) ? w.slice(0, -1) + 'ae' : /(us|um)$/.test(w) ? w.slice(0, -2) + 'ī' : null;
const laGuessInf = forms => { const s = laStrip(forms[1] || ''), f1 = forms[1] || ''; return /as$/.test(s) ? f1.slice(0, -2) + 'āre' : /ēs$/.test(f1) ? f1.slice(0, -2) + 'ēre' : /īs$/.test(f1) ? f1.slice(0, -2) + 'īre' : /is$/.test(s) ? f1.slice(0, -2) + 'ere' : null; };
const laGuessAdj = w => /us$/.test(w) ? [w, w.slice(0, -2) + 'a', w.slice(0, -2) + 'um'] : /is$/.test(w) ? [w, w, w.slice(0, -2) + 'e', 3] : null;
function laConjFor(w) {
  const e = LA_ENTRY[w] && laParseEntry(LA_ENTRY[w]), known = LA_VERB.find(v => v[0] === w);
  if (known) return laForms(known);
  if (LA_IRREG[w]) return LA_IRREG[w].split(' ');
  if (e?.kind === 'verb') return laConjugate(w, e.inf, e.conj);
  // only the first part: -eō is 2nd, -iō is 4th (or 3rd -iō: check the forms), -ō is 1st (the commonest)
  const b = laStrip(w), s = w.slice(0, -1);
  return /eo$/.test(b) ? laConjugate(w, s.slice(0, -1) + 'ēre', 2) : /io$/.test(b) ? laConjugate(w, s.slice(0, -1) + 'īre', 4) : laConjugate(w, s + 'āre', 1);
}
if (typeof bldApplyMine === 'function') { const applyAll = bldApplyMine; bldApplyMine = function () { applyAll(); laApplyMine(); }; }
BLD_MINE.la = { name: 'Latin', forms: 'I, you, he/she, we, you (all), they (amō, amās, amat, amāmus, amātis, amant)', nForms: 6, m: 'masculine', f: 'feminine', noGender: true,
  conj: w => laConjFor(w), pl: w => w, adj: w => (laParseEntry(LA_ENTRY[w] || '')?.forms || laGuessAdj(w) || [w]).slice(0, 3),
  known: w => laKnown(w), gender: w => laParseEntry(LA_ENTRY[w] || '')?.g || 'm', isVerb: w => laIsVerbWord(laStrip(w)), refl: () => false,
  // the card's text comes in without commas: "puella -ae f" · "amō amāre amāvī amātum" · "bonus -a -um"
  parse: s => {
    const e = laParseEntry(s); if (e) { LA_ENTRY[e.w] = s; return { w: e.w, art: e.kind === 'noun', g: e.g, read: s }; }
    return /^\p{L}+$/u.test(s) ? { w: s } : null; },
  intro: 'write the cards like a dictionary: <i>puella, -ae, f.</i> is a noun, <i>amō, amāre, amāvī, amātum</i> is a verb, <i>bonus, -a, -um</i> is an adjective). The endings and verb forms are worked out from that; check any that look wrong.' };
/* every word the Latin Sentence Builder knows, with its meaning (for 🌐 auto-translate and the word labels) */
function laWordList() {
  const out = [];
  for (const n of LA_NOUN) for (const f of laNounForms(n)) out.push([f.w, f.n === 'p' ? n[6] || n[5] : n[5], 'noun']);
  for (const a of LA_ADJ) for (const f of laAdjForms(a)) out.push([f.w, a[3], 'adj']);
  for (const v of LA_VERB) { out.push([v[1], 'to ' + v[6], 'verb']); laForms(v).forEach((f, i) => out.push([f, v[0] === 'sum' ? ['am', 'are', 'is', 'are', 'are', 'are'][i] : i === 2 ? v[7] : v[6], 'verb'])); }
  for (const p of LA_PRON) out.push([p[0], p[4], 'pron']);
  for (const p of LA_PREP) out.push([p[0], p[2], 'prep']);
  for (const a of LA_ADV) out.push([a[0], a[1], 'adv']);
  for (const c of LA_CONJ) out.push([c[0], c[1], 'conj']);
  out.push(['nōn', 'not', 'adv'], ['valdē', 'very', 'adv']);
  return out;
}
