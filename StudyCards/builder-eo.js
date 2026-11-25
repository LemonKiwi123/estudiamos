'use strict';
/* ================= Sentence Builder: Esperanto =================
   Esperanto is fully regular, and its endings show what every word does: -o noun, -a adjective, -e adverb, -j more
   than one, -n the object (accusative). Verbs end in -as (now), -is (past), -os (future), -i (to …) and are the same
   for every person (mi manĝas, ŝi manĝas, ili manĝas). Because the -n shows the object, word order is free:
   "La knabo manĝas pomon", "Pomon manĝas la knabo" and "La knabo pomon manĝas" all mean the same thing, and the
   checker accepts any of them, judging by the endings. It checks: one subject (no -n) and one finite verb; the object
   takes -n and only goes with verbs that take one; adjectives and mia/via… match their noun (-j and -n); after esti
   the describing word has no -n and matches the subject; "la" (the only article) and prepositions come before their
   noun; after a preposition there is no -n, except en / sur / sub + -n for "into / onto" with a verb of motion;
   "ne" goes right before the verb and "tre" (very) right before an adjective or adverb; hieraŭ goes with -is and
   morgaŭ with -os. Loaded after builder.js. */

const eoLow = w => String(w || '').toLowerCase();
const EO_VOWEL_EN = /^[aeiou]/i;
//            word         kind      English one / many          1 = can't count
const EO_NOUN = [
  ['knabo', 'person', 'boy', 'boys'], ['knabino', 'person', 'girl', 'girls'], ['viro', 'person', 'man', 'men'], ['virino', 'person', 'woman', 'women'],
  ['amiko', 'person', 'friend', 'friends'], ['instruisto', 'person', 'teacher', 'teachers'], ['lernanto', 'person', 'student', 'students'],
  ['patro', 'person', 'father', 'fathers'], ['patrino', 'person', 'mother', 'mothers'], ['frato', 'person', 'brother', 'brothers'], ['fratino', 'person', 'sister', 'sisters'],
  ['infano', 'person', 'child', 'children'], ['kuracisto', 'person', 'doctor', 'doctors'], ['kuiristo', 'person', 'cook', 'cooks'], ['najbaro', 'person', 'neighbor', 'neighbors'],
  ['reĝo', 'person', 'king', 'kings'], ['reĝino', 'person', 'queen', 'queens'],
  ['hundo', 'animal', 'dog', 'dogs'], ['kato', 'animal', 'cat', 'cats'], ['ĉevalo', 'animal', 'horse', 'horses'], ['birdo', 'animal', 'bird', 'birds'],
  ['fiŝo', 'animal', 'fish', 'fish'], ['muso', 'animal', 'mouse', 'mice'], ['bovino', 'animal', 'cow', 'cows'], ['kuniklo', 'animal', 'rabbit', 'rabbits'],
  ['pomo', 'food', 'apple', 'apples'], ['pano', 'food', 'bread', null, 1], ['kuko', 'food', 'cake', 'cakes'], ['fromaĝo', 'food', 'cheese', null, 1],
  ['ovo', 'food', 'egg', 'eggs'], ['supo', 'food', 'soup', null, 1], ['banano', 'food', 'banana', 'bananas'], ['sandviĉo', 'food', 'sandwich', 'sandwiches'],
  ['akvo', 'drink', 'water', null, 1], ['lakto', 'drink', 'milk', null, 1], ['kafo', 'drink', 'coffee', null, 1], ['teo', 'drink', 'tea', null, 1], ['suko', 'drink', 'juice', null, 1],
  ['libro', 'read', 'book', 'books'], ['letero', 'read', 'letter', 'letters'], ['gazeto', 'read', 'newspaper', 'newspapers'], ['rakonto', 'read', 'story', 'stories'], ['kanto', 'read', 'song', 'songs'],
  ['tablo', 'thing', 'table', 'tables'], ['seĝo', 'thing', 'chair', 'chairs'], ['pordo', 'thing', 'door', 'doors'], ['fenestro', 'thing', 'window', 'windows'],
  ['pilko', 'thing', 'ball', 'balls'], ['aŭto', 'thing', 'car', 'cars'], ['biciklo', 'thing', 'bicycle', 'bicycles'], ['floro', 'thing', 'flower', 'flowers'],
  ['ŝlosilo', 'thing', 'key', 'keys'], ['sako', 'thing', 'bag', 'bags'], ['ĉapelo', 'thing', 'hat', 'hats'], ['telefono', 'thing', 'phone', 'phones'], ['skatolo', 'thing', 'box', 'boxes'],
  ['domo', 'place', 'house', 'houses'], ['lernejo', 'place', 'school', 'schools'], ['parko', 'place', 'park', 'parks'], ['urbo', 'place', 'city', 'cities'],
  ['ĝardeno', 'place', 'garden', 'gardens'], ['kuirejo', 'place', 'kitchen', 'kitchens'], ['butiko', 'place', 'shop', 'shops'], ['arbaro', 'place', 'forest', 'forests'],
  ['strato', 'place', 'street', 'streets'], ['ĉambro', 'place', 'room', 'rooms'], ['maro', 'place', 'sea', 'seas'], ['plaĝo', 'place', 'beach', 'beaches'], ['biblioteko', 'place', 'library', 'libraries']];
const EO_OPENABLE = ['pordo', 'fenestro', 'libro', 'letero', 'sako', 'skatolo', 'butiko'];
const EO_HEARABLE = ['kanto', 'rakonto'];
const EO_CONTAINER = ['sako', 'skatolo', 'aŭto'];   // things you can be or put something "en" (in)
const EO_SURFACE = ['tablo', 'seĝo', 'biciklo', 'ĉevalo'];   // things you can be "sur" (on)
/* every form of a noun or adjective: [{ w, c, n }] (Esperanto: -j more than one, -n the object) */
const eoForms = w => [{ w, c: 'nom', n: 's' }, { w: w + 'j', c: 'nom', n: 'p' }, { w: w + 'n', c: 'acc', n: 's' }, { w: w + 'jn', c: 'acc', n: 'p' }];
const eoForm = (w, c, n) => w + (n === 'p' ? 'j' : '') + (c === 'acc' ? 'n' : '');
/* reading of any -o / -a word: its dictionary form, case and number */
function eoRead(w) { const m = /^(.*[oa])(j?)(n?)$/.exec(w); return m ? { base: m[1], n: m[2] ? 'p' : 's', c: m[3] ? 'acc' : 'nom' } : null; }
//            word          English         describes: p person · a animal · f food/drink · t thing · l place · r read
const EO_ADJ = [['granda', 'big', 'patl'], ['malgranda', 'small', 'patl'], ['bona', 'good', 'pafrl'], ['bela', 'beautiful', 'patl'], ['nova', 'new', 'tlr'],
  ['malnova', 'old', 'tlr'], ['juna', 'young', 'pa'], ['maljuna', 'old', 'pa'], ['feliĉa', 'happy', 'pa'], ['malĝoja', 'sad', 'pa'], ['laca', 'tired', 'pa'],
  ['afabla', 'kind', 'p'], ['forta', 'strong', 'pa'], ['malsata', 'hungry', 'pa'], ['rapida', 'fast', 'at'], ['ruĝa', 'red', 'tf'], ['blua', 'blue', 't'],
  ['verda', 'green', 'tf'], ['blanka', 'white', 'at'], ['nigra', 'black', 'at'], ['varma', 'warm', 'fl'], ['malvarma', 'cold', 'fl'], ['dolĉa', 'sweet', 'f'],
  ['bongusta', 'tasty', 'f'], ['interesa', 'interesting', 'r'], ['longa', 'long', 'tlr'], ['pura', 'clean', 'tl'], ['bruna', 'brown', 'at']];
//            infinitive  type   what it takes (object)                needs one  English       he/she       past         who: a people and animals, p only people   extra: m motion, d "al" someone
const EO_VERB = [
  ['manĝi', 'tr', ['food'], 0, 'eat', 'eats', 'ate', 'a'], ['trinki', 'tr', ['drink'], 0, 'drink', 'drinks', 'drank', 'a'],
  ['vidi', 'tr', ['*'], 0, 'see', 'sees', 'saw', 'a'], ['havi', 'tr', ['*'], 1, 'have', 'has', 'had', 'a'], ['ami', 'tr', ['*'], 0, 'love', 'loves', 'loved', 'a'],
  ['ŝati', 'tr', ['*'], 1, 'like', 'likes', 'liked', 'a'], ['legi', 'tr', ['read'], 0, 'read', 'reads', 'read', 'p'], ['skribi', 'tr', ['read'], 0, 'write', 'writes', 'wrote', 'p'],
  ['aĉeti', 'tr', ['food', 'drink', 'read', 'thing'], 1, 'buy', 'buys', 'bought', 'p'], ['serĉi', 'tr', ['*'], 1, 'look for', 'looks for', 'looked for', 'a'],
  ['trovi', 'tr', ['*'], 1, 'find', 'finds', 'found', 'a'], ['preni', 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'take', 'takes', 'took', 'p'],
  ['porti', 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'carry', 'carries', 'carried', 'p'], ['kuiri', 'tr', ['food'], 0, 'cook', 'cooks', 'cooked', 'p'],
  ['lavi', 'tr', ['thing', 'animal'], 1, 'wash', 'washes', 'washed', 'p'], ['helpi', 'tr', ['person', 'animal'], 1, 'help', 'helps', 'helped', 'p'],
  ['atendi', 'tr', ['person', 'animal'], 1, 'wait for', 'waits for', 'waited for', 'a'], ['renkonti', 'tr', ['person'], 1, 'meet', 'meets', 'met', 'p'],
  ['voki', 'tr', ['person', 'animal'], 1, 'call', 'calls', 'called', 'p'], ['viziti', 'tr', ['person', 'place'], 1, 'visit', 'visits', 'visited', 'p'],
  ['purigi', 'tr', ['thing', 'place'], 1, 'clean', 'cleans', 'cleaned', 'p'], ['malfermi', 'tr', ['open'], 1, 'open', 'opens', 'opened', 'p'],
  ['fermi', 'tr', ['open'], 1, 'close', 'closes', 'closed', 'p'], ['aŭdi', 'tr', ['person', 'animal', 'hear'], 0, 'hear', 'hears', 'heard', 'a'],
  ['doni', 'tr', ['food', 'drink', 'read', 'thing'], 1, 'give', 'gives', 'gave', 'p', 'd'], ['montri', 'tr', ['*'], 1, 'show', 'shows', 'showed', 'p', 'd'],
  ['sendi', 'tr', ['read', 'thing'], 1, 'send', 'sends', 'sent', 'p', 'd'], ['rakonti', 'tr', ['read'], 1, 'tell', 'tells', 'told', 'p', 'd'],
  ['dormi', 'in', null, 0, 'sleep', 'sleeps', 'slept', 'a'], ['labori', 'in', null, 0, 'work', 'works', 'worked', 'p'], ['kanti', 'in', null, 0, 'sing', 'sings', 'sang', 'a'],
  ['ludi', 'in', null, 0, 'play', 'plays', 'played', 'a'], ['ridi', 'in', null, 0, 'laugh', 'laughs', 'laughed', 'p'], ['sidi', 'in', null, 0, 'sit', 'sits', 'sat', 'a'],
  ['resti', 'in', null, 0, 'stay', 'stays', 'stayed', 'a'], ['loĝi', 'in', null, 0, 'live', 'lives', 'lived', 'a'], ['danci', 'in', null, 0, 'dance', 'dances', 'danced', 'p'],
  ['studi', 'in', null, 0, 'study', 'studies', 'studied', 'p'], ['naĝi', 'in', null, 0, 'swim', 'swims', 'swam', 'a'],
  ['iri', 'in', null, 0, 'go', 'goes', 'went', 'a', 'm'], ['veni', 'in', null, 0, 'come', 'comes', 'came', 'a', 'm'], ['kuri', 'in', null, 0, 'run', 'runs', 'ran', 'a', 'm'],
  ['marŝi', 'in', null, 0, 'walk', 'walks', 'walked', 'a', 'm'], ['vojaĝi', 'in', null, 0, 'travel', 'travels', 'traveled', 'p', 'm'],
  ['esti', 'sum', null, 1, 'be', 'is', 'was', 'a'], ['povi', 'modal', null, 1, 'can', 'can', 'could', 'a'], ['voli', 'modal', null, 1, 'want', 'wants', 'wanted', 'a']];
const EO_TENSE = { as: 'present', is: 'past', os: 'future', i: 'infinitive' };
const eoRoot = v => v[0].slice(0, -1);
const eoVerbForm = (v, t) => eoRoot(v) + t;
//            word   person  number  English (subject / object)
const EO_PRON = [['mi', 1, 's', 'I', 'me'], ['vi', 2, '*', 'you', 'you'], ['li', 3, 's', 'he', 'him'], ['ŝi', 3, 's', 'she', 'her'], ['ĝi', 3, 's', 'it', 'it'],
  ['ni', 1, 'p', 'we', 'us'], ['ili', 3, 'p', 'they', 'them']];
const EO_POSS = [['mia', 'my'], ['via', 'your'], ['lia', 'his'], ['ŝia', 'her'], ['ĝia', 'its'], ['nia', 'our'], ['ilia', 'their']];
//            word    English    with -n
const EO_PREP = [['en', 'in', 'into'], ['al', 'to'], ['kun', 'with'], ['el', 'out of'], ['sen', 'without'], ['sur', 'on', 'onto'], ['sub', 'under', 'under'],
  ['por', 'for'], ['de', 'of'], ['apud', 'next to'], ['tra', 'through']];
//            word         English        where it goes in English: time / freq (before the verb) / how / end
const EO_ADV = [['hodiaŭ', 'today', 'time'], ['hieraŭ', 'yesterday', 'time'], ['morgaŭ', 'tomorrow', 'time'], ['nun', 'now', 'time'], ['ĉiutage', 'every day', 'time'],
  ['ĉiam', 'always', 'freq'], ['ofte', 'often', 'freq'], ['neniam', 'never', 'freq'], ['bone', 'well', 'how'], ['rapide', 'quickly', 'how'], ['malrapide', 'slowly', 'how'],
  ['tie', 'there', 'end'], ['hejme', 'at home', 'end']];
const EO_CONJ = [['kaj', 'and'], ['sed', 'but']];
const EO_KIND = { food: 'food', drink: 'drinks', read: 'things you read, write or tell', thing: 'things', place: 'places', animal: 'animals', person: 'people', open: 'things you can open', hear: 'songs and stories' };
const EO_HOW = /^(labori|kanti|dormi|legi|skribi|kuri|naĝi|danci|studi|marŝi|ludi|kuiri|manĝi)$/;   // verbs that go with bone / rapide / malrapide

/* ---------------- chips (one tray word each) ---------------- */
const eoNounE = w => { const r = eoRead(w); return r && EO_NOUN.find(n => n[0] === r.base); };
const eoGlossNoun = (e, n) => n === 'p' ? e[3] || e[2] : e[2];
function eoNounChip(e, w) { const r = eoRead(w); return chip({ k: 'noun', w, e, c: r.c, n: r.n, cat: e[1], mass: !!e[4], gloss: eoGlossNoun(e, r.n) }); }
const eoNoun = (e, c, n) => eoNounChip(e, eoForm(e[0], c, n));
function eoAdjChip(a, w) { const r = eoRead(w); return chip({ k: 'adj', w, e: a, c: r.c, n: r.n, gloss: a[1] }); }
const eoAdj = (a, c, n) => eoAdjChip(a, eoForm(a[0], c, n));
const eoVerbGloss = (v, t) => t === 'i' ? 'to ' + v[4] : t === 'is' ? (v[1] === 'sum' ? 'was / were' : v[6]) : t === 'os' ? 'will ' + (v[1] === 'modal' && v[0] === 'povi' ? 'be able to' : v[4]) : (v[1] === 'sum' ? 'am / is / are' : v[1] === 'modal' && v[0] === 'povi' ? 'can' : v[4] + ' / ' + v[5]);
const eoVerb = (v, t) => chip({ k: 'verb', w: eoVerbForm(v, t), e: v, t, inf: t === 'i', type: v[1], gloss: eoVerbGloss(v, t) });
function eoPronChip(w) { const acc = /n$/.test(w) && w !== 'n', b = acc ? w.slice(0, -1) : w, p = EO_PRON.find(x => x[0] === b); return chip({ k: 'pron', w, e: p, c: acc ? 'acc' : 'nom', per: p[1], n: p[2], gloss: acc ? p[4] : p[3] }); }
function eoPossChip(w) { const r = eoRead(w), p = EO_POSS.find(x => x[0] === r.base); return chip({ k: 'det', cls: 'poss', w, e: p, c: r.c, n: r.n, gloss: p[1] }); }
const eoLa = () => chip({ k: 'det', cls: 'art', w: 'la', gloss: 'the' });
const eoPrep = w => { const p = EO_PREP.find(x => x[0] === w); return chip({ k: 'prep', w, e: p, gloss: p[1] }); };
const eoConj = w => chip({ k: 'conj', w, gloss: EO_CONJ.find(c => c[0] === w)[1] });
const eoAdv = w => { const a = EO_ADV.find(x => x[0] === w); return chip({ k: 'adv', w, pos: a[2], en: a[1], gloss: a[1] }); };
const eoNe = () => chip({ k: 'neg', w: 'ne', gloss: 'not' });
const eoTre = () => chip({ k: 'int', w: 'tre', gloss: 'very' });
const eoIsMotion = v => v && v[8] === 'm';
const eoAn = s => (EO_VOWEL_EN.test(s) ? 'an ' : 'a ') + s;

/* ---------------- Esperanto checker ----------------
   Every ending has one meaning (-n = object, -j = more than one), so each word is read from its ending. The words are
   grouped into noun phrases (la / mia + adjectives + noun), prepositional phrases and the verb; then the jobs are
   checked: who does it (no -n), what it is done to (-n), where, and what the subject is like after esti. */
function eoCheck(T) {
  const clampAt = at => Math.max(0, Math.min(at, T.length - 1));
  const err = (msg, at = 0, end = false) => ({ ok: false, msg, at: clampAt(at), end: !!end || at >= T.length });
  if (!T.length) return err('Tap some words to build a sentence.');
  for (let k = 0; k < T.length; k++) {
    const t = T[k], nx = T[k + 1];
    if (t.k === 'conj' && k === 0) return err(`“${t.w}” (${t.gloss}) joins two parts, so it can’t start the sentence.`, 0);
    if (t.k === 'conj' && !nx) return err(`“${t.w}” (${t.gloss}) joins two parts, so something has to come after it.`, k, true);
    if (t.k === 'conj' && nx.k === 'conj') return err(`Use only one joining word here.`, k + 1);
    if (t.k === 'prep' && !nx) return err(`“${t.w}” (${t.gloss}) needs a noun right after it.`, k, true);
    if (t.k === 'det' && t.cls === 'art') {
      if (!nx) return err('“la” (the) goes right before a noun, like “la hundo”.', k, true);
      if (nx.k === 'det') return err(nx.cls === 'art' ? 'Use “la” only once.' : `Use “la” or “${nx.w}”, not both: “${nx.w} ${T[k + 2]?.k === 'noun' ? T[k + 2].w : 'hundo'}”.`, k + 1);
      if (nx.k === 'pron') return err(`“la” (the) doesn’t go with “${nx.w}”. Leave out “la”.`, k);
      if (!['noun', 'adj', 'int'].includes(nx.k)) return err('“la” (the) goes right before a noun (or its adjective), like “la hundo” or “la granda hundo”.', k + 1);
    }
    if (t.k === 'det' && t.cls === 'poss') {
      if (!nx) return err(`“${t.w}” (${t.gloss}) goes right before a noun, like “${t.e[0]} hundo”.`, k, true);
      if (!['noun', 'adj', 'int'].includes(nx.k)) return err(`“${t.w}” (${t.gloss}) goes right before a noun, like “${t.e[0]} hundo”.`, k + 1);
    }
    if (t.k === 'neg' && !nx) return err('“ne” (not) goes right before the verb.', k, true);
    if (t.k === 'neg' && nx.k !== 'verb') { const v = T.find(x => x.k === 'verb' && !x.inf); return err(`“ne” (not) goes right before the verb it makes negative${v ? `: “ne ${v.w}”` : ''}.`, k); }
    if (t.k === 'int' && !nx) return err('“tre” (very) goes right before a describing word, like “tre granda”.', k, true);
    if (t.k === 'int' && !['adj', 'adv'].includes(nx.k)) return err('“tre” (very) goes right before a describing word (“tre granda”) or an adverb (“tre bone”).', k + 1);
    if (t.k === 'int' && nx.k === 'adv' && ['time', 'end'].includes(nx.pos) || t.k === 'int' && nx.w === 'neniam') return err(`“tre” (very) doesn’t go with “${nx.w}”.`, k);
  }
  // "kaj" can join two words or two whole sentences: try both. "sed" always starts a new sentence part.
  const kajs = T.map((t, i) => t.k === 'conj' && t.w === 'kaj' ? i : -1).filter(i => i >= 0).slice(0, 4);
  let best = null;
  for (let mask = 0; mask < (1 << kajs.length); mask++) {
    const cut = new Set(T.map((t, i) => t.k === 'conj' && (t.w !== 'kaj' || (mask & (1 << kajs.indexOf(i)))) ? i : -1).filter(i => i >= 0));
    const parts = [[]], conjs = [];
    T.forEach((t, i) => { if (cut.has(i)) { conjs.push(t); parts.push([]); } else parts[parts.length - 1].push({ t, i }); });
    if (parts.some(p => !p.length)) continue;
    const res = parts.map(eoClause), errs = res.flatMap(r => r.errs);
    const noVerb = parts.filter(p => !p.some(x => x.t.k === 'verb')).length;
    const score = errs.length * 1000 + noVerb * 1500 + res.reduce((s, r) => s + r.miss, 0);
    if (!best || score < best.score) best = { score, errs, res, conjs };
    if (score === 0) break;
  }
  if (!best) return err('Something is missing after “kaj”.', T.length - 1, true);
  if (best.errs.length) { const e = best.errs[0]; return err(e.msg, e.at, e.end); }
  return { ok: true, P: { clauses: best.res.map(r => r.parse), conjs: best.conjs } };
}
const eoFix = (x, c, n) => x.k === 'pron' ? (c === 'acc' ? x.e[0] + 'n' : x.e[0]) : x.k === 'det' ? eoForm(x.e[0], c, n) : eoForm(x.e[0], c, n);
const eoWhat = x => x.k === 'pron' ? x.e[4] : x.n === 'p' || x.mass ? x.e[3] || x.e[2] : eoAn(x.e[2]);
/* one sentence part */
function eoClause(toks) {
  const errs = [], E = (msg, at, end) => errs.push({ msg, at, end: !!end });
  const out = () => { errs.sort((a, b) => a.at - b.at); return { errs, miss: 0, parse: null }; };
  const lastAt = toks[toks.length - 1].i;
  const finite = toks.filter(x => x.t.k === 'verb' && !x.t.inf), infs = toks.filter(x => x.t.k === 'verb' && x.t.inf);
  if (!finite.length) {
    if (infs.length) { const v = infs[0].t; E(`“${v.w}” is the infinitive (to ${v.e[4]}). Use a form like “${eoVerbForm(v.e, 'as')}” (now), “${eoVerbForm(v.e, 'is')}” (past) or “${eoVerbForm(v.e, 'os')}” (future).`, infs[0].i, true); }
    else E('Every sentence needs a verb (an action word like “manĝas” or “estas”).', lastAt, true);
    return out();
  }
  if (finite.length > 1) { E('One verb per sentence part. Use “kaj” or “sed” to join two sentences.', finite[1].i); return out(); }
  const V = finite[0].t, Vi = finite[0].i;
  let A = V, Ai = Vi;
  if (infs.length > 1) E('Use only one infinitive (-i) with povi or voli.', infs[1].i);
  if (V.type === 'modal') {
    if (!infs.length) E(`“${V.w}” (${V.e[4]}) needs a second verb ending in -i, like “${V.w} kanti” (${V.e[0] === 'povi' ? 'can' : 'want to'} sing).`, Vi, true);
    else if (infs[0].t.type === 'modal') E(`“${infs[0].t.w}” doesn’t go with “${V.w}”. Pick another verb, like “${V.w} kanti”.`, infs[0].i);
    else { A = infs[0].t; Ai = infs[0].i; }
  } else if (infs.length) E(`“${infs[0].t.w}” (to ${infs[0].t.e[4]}) is the infinitive. Here it only goes with povi (can) or voli (want): “${eoVerbForm(EO_VERB.find(v => v[0] === 'povi'), V.t)} ${infs[0].t.w}”.`, infs[0].i);
  if (errs.length) return out();
  const motion = eoIsMotion(A.e), dative = A.e[8] === 'd', isSum = A.type === 'sum', tense = V.t;
  const negs = toks.filter(x => x.t.k === 'neg'), never = toks.find(x => x.t.k === 'adv' && x.t.w === 'neniam');
  if (negs.length > 1) E('Use “ne” only once.', negs[1].i);
  if (negs.length && never) E('“neniam” already means “never”, so leave out “ne”.', negs[0].i);
  for (const n of negs) { const nx = toks[toks.indexOf(n) + 1]; if (nx && nx.t.inf) E(`Put “ne” right before “${V.w}”: “ne ${V.w}”.`, n.i); }
  for (const x of toks.filter(y => y.t.k === 'adv')) {
    if (x.t.w === 'hieraŭ' && tense !== 'is') E(`“hieraŭ” (yesterday) is in the past, so the verb ends in -is: “${eoVerbForm(V.e, 'is')}”.`, Vi);
    if (x.t.w === 'morgaŭ' && tense !== 'os') E(`“morgaŭ” (tomorrow) is in the future, so the verb ends in -os: “${eoVerbForm(V.e, 'os')}”.`, Vi);
  }
  const advs = toks.filter(x => x.t.k === 'adv');
  for (const w of new Set(advs.map(x => x.t.w))) { const same = advs.filter(x => x.t.w === w); if (same.length > 1) E(`“${w}” is in the sentence twice.`, same[1].i); }
  // group the words into units: noun phrases, prepositional phrases, describing words on their own
  const units = [];
  const W = toks.map(x => x.t);
  let p = 0;
  const np = () => {   // a noun phrase starting at p: (la | mia) (tre) adjectives noun (adjectives)
    const st = p, art = W[p]?.k === 'det' && W[p].cls === 'art' ? toks[p++] : null, det = W[p]?.k === 'det' && W[p].cls === 'poss' ? toks[p++] : null;
    const pre = [];
    while (W[p] && (W[p].k === 'adj' || (W[p].k === 'int' && W[p + 1]?.k === 'adj'))) { if (W[p].k === 'int') p++; pre.push(toks[p++]); }
    const h = W[p];
    if (h && h.k === 'pron' && pre.length && !art && !det) return { kind: 'adj', adjs: pre, st, en: p - 1 };   // "laca mi estas": the describing word is what I am
    if (h && h.k === 'pron') {
      if (art || det || pre.length) E(pre.length ? `Describing words don’t go with “${h.w}”.` : `“${(art || det).t.w}” doesn’t go with “${h.w}”.`, (pre[0] || art || det).i);
      return { kind: 'np', head: toks[p++], art: null, det: null, adjs: [], c: h.c, n: h.n, st, en: p - 1, pron: true };
    }
    if (!h || h.k !== 'noun') {
      if (art || det) { E(`“${(art || det).t.w}” needs a noun after it${pre.length ? '' : `, like “${(art || det).t.w} hundo”`}.`, toks[p] ? toks[p].i : (art || det).i, !toks[p]); return null; }
      return pre.length ? { kind: 'adj', adjs: pre, st, en: p - 1 } : null;
    }
    const head = toks[p++], u = { kind: 'np', head, art, det, adjs: [], c: h.c, n: h.n, st, en: p - 1 };
    for (const a of [det, ...pre].filter(Boolean)) {
      if (a.t.c !== h.c || a.t.n !== h.n) E(`“${a.t.w}” has to match “${h.w}”${h.c === 'acc' ? ' (it has -n' + (h.n === 'p' ? ' and -j' : '') + ')' : h.n === 'p' ? ' (it has -j)' : ''}: use “${eoForm(a.t.e[0], h.c, h.n)}”.`, a.i);
      else u.adjs.push(a);
    }
    if (det) u.adjs = u.adjs.filter(a => a !== det);
    // describing words right after the noun, when they match it ("domo granda")
    while (W[p] && (W[p].k === 'adj' || (W[p].k === 'int' && W[p + 1]?.k === 'adj'))) {
      const q = W[p].k === 'int' ? p + 1 : p;
      if (W[q].c !== h.c || W[q].n !== h.n) break;
      // an adjective between two nouns describes the next one ("al la domo laca patro" = a tired father): adjectives usually come first
      if (W[q + 1]?.k === 'noun' && W[q + 1].c === W[q].c && W[q + 1].n === W[q].n) break;
      u.adjs.push(toks[q]); p = q + 1; u.en = p - 1;
    }
    return u;
  };
  while (p < toks.length) {
    const t = W[p];
    if (['verb', 'neg', 'adv'].includes(t.k)) { p++; continue; }
    if (t.k === 'int') { p++; continue; }   // "tre" before an adverb ("tre bone")
    if (t.k === 'conj') { units.push({ kind: 'kaj', tok: toks[p], st: p, en: p }); p++; continue; }
    if (t.k === 'prep') {
      const pt = toks[p++], u = np();
      if (!u || u.kind !== 'np') { if (!errs.length) E(`“${pt.t.w}” (${pt.t.gloss}) needs its noun right after it.`, toks[p] ? toks[p].i : pt.i, !toks[p]); if (u) units.push(u); continue; }
      units.push({ kind: 'pp', p: pt, np: u, st: u.st - 1, en: u.en });
      continue;
    }
    const u = np();
    if (u) units.push(u); else p++;
  }
  if (errs.length) return out();
  // "kaj" inside a sentence part joins two noun phrases (or two describing words) of the same kind
  const groups = [];
  for (let k = 0; k < units.length; k++) {
    const u = units[k];
    if (u.kind !== 'kaj') { groups.push({ ...u, list: [u.kind === 'pp' ? u.np : u] }); continue; }
    const L = groups[groups.length - 1], R = units[k + 1];
    if (!L || !R || R.kind === 'kaj') { E('“kaj” (and) joins two nouns, or two whole sentences. Put a word on each side of it.', u.tok.i, !R); continue; }
    k++;
    if (L.kind === 'pp' && R.kind === 'np') {   // "kun la hundo kaj la kato"
      if (R.c === 'acc' && L.np.c !== 'acc') E(`After “${L.p.t.w}”, the noun has no -n: “${eoFix(R.head.t, 'nom', R.n)}”.`, R.head.i);
      L.list.push(R); continue;
    }
    if (L.kind === 'adj' && R.kind === 'adj') { L.list.push(R); continue; }
    if (L.kind !== 'np' || R.kind !== 'np') { E('“kaj” (and) joins two words of the same kind here, like “la hundo kaj la kato”.', u.tok.i); continue; }
    if (L.c !== R.c) { E(`“kaj” joins two words that do the same job: “${L.head.t.w}” ${L.c === 'acc' ? 'has' : 'has no'} -n, so “${R.head.t.w}” needs the same: “${eoFix(R.head.t, L.c, R.n)}”.`, R.head.i); continue; }
    L.list.push(R);
  }
  if (errs.length) return out();
  const gText = g => g.list.map(u => u.kind === 'np' ? u.head.t.w : u.adjs.map(a => a.t.w).join(' ')).join(' kaj ');
  const gNum = g => g.list.length > 1 ? 'p' : g.list[0].n;
  const noms = groups.filter(g => g.kind === 'np' && g.c === 'nom'), accs = groups.filter(g => g.kind === 'np' && g.c === 'acc');
  const pps = groups.filter(g => g.kind === 'pp'), adjUnits = groups.filter(g => g.kind === 'adj');
  // the subject (no -n) and, after esti, what the subject is
  let subj = null, pred = null;
  if (!noms.length) {
    if (accs.length && !isSum) { const g = accs[0], h = g.list[0].head.t; E(`Who ${tense === 'is' ? 'did' : 'does'} it? Every sentence needs a subject without -n. “${h.w}” has -n, so it is the object. ${A.type === 'tr' ? `Add a subject, like “mi” or “la knabo”.` : `As the subject, write “${eoFix(h, 'nom', h.n)}”.`}`, g.list[0].head.i); }
    else E('Who does it? Add a subject, like “mi”, “ŝi” or “la knabo”. Esperanto always says who.', Vi, true);
    return out();
  }
  let order = noms;
  if (isSum && noms.length === 2) {
    const prS = g => g.list.some(u => u.pron) ? 2 : g.list.some(u => u.art || u.det) ? 1 : 0;
    if (prS(noms[1]) > prS(noms[0])) order = [noms[1], noms[0]];
  }
  subj = order[0];
  if (order[1]) {
    if (isSum) pred = { noun: order[1] };
    else { const h = order[1].list[0].head; E(A.type === 'tr' ? `“${h.t.w}” has no -n, so it reads as a second subject. If it is what ${subj.list[0].pron ? subj.list[0].head.t.w : gText(subj)} ${A.e[4] === A.e[5] ? A.e[4] : A.e[4] + 's'}, add -n: “${eoFix(h.t, 'acc', h.t.n)}”.`
      : `Two subjects: “${gText(order[0])}” and “${gText(order[1])}” both have no -n. Join them with “kaj”.`, h.i); }
  }
  for (const g of order.slice(2)) E(`“${gText(g)}” has no -n too. A sentence part has only one subject.`, g.list[0].head.i);
  const subjNum = gNum(subj), subjVi = subj.list.length === 1 && subj.list[0].pron && subj.list[0].head.t.w === 'vi';
  // it has to make sense: a table can't walk
  if (!isSum) for (const u of subj.list) {
    if (u.pron) continue;
    const c = u.head.t.cat, what = eoWhat(u.head.t);
    if (c !== 'person' && c !== 'animal') E(`That doesn’t make sense: ${what} can’t ${A.e[4]}. Use a person or an animal here.`, u.head.i);
    else if (c === 'animal' && A.e[7] === 'p') E(`That doesn’t make sense: ${what} can’t ${A.e[4]}. Only people ${A.e[4]}.`, u.head.i);
  }
  // the object (-n)
  const objs = [];
  if (A.type === 'tr') {
    accs.forEach((g, k) => { if (k) E('Only one object (-n) here. To have two, join them with “kaj”.', g.list[0].head.i); else objs.push(...g.list); });
    for (const u of objs) {
      const cats = A.e[2], x = u.head.t;
      const fits = u.pron ? cats[0] === '*' || cats.includes('person') : cats[0] === '*' || cats.includes(x.cat) || (cats.includes('open') && EO_OPENABLE.includes(x.e[0])) || (cats.includes('hear') && EO_HEARABLE.includes(x.e[0]));
      if (!fits) E(`That doesn’t make sense: you can’t ${A.e[4]} ${eoWhat(x)}. “${A.e[0]}” goes with ${cats.map(c => EO_KIND[c] || c).join(', ')}.`, u.head.i);
      if (u.pron && subj.list.length === 1 && subj.list[0].pron && subj.list[0].head.t.w === x.e[0]) E(`“${x.w}” is the same person as “${x.e[0]}”. For “myself / yourself”, Esperanto uses other words; pick someone else here.`, u.head.i);
    }
    if (!objs.length && A.e[3]) E(`“${A.w}” (${A.e[4]}) needs an object with -n. What ${tense === 'is' ? 'did' : 'does'} ${subj.list[0].pron ? subj.list[0].head.t.e[3].replace(/^I$/, 'I') : 'the subject'} ${A.e[4]}? For example “${A.w} ${eoExampleObj(A.e)}”.`, Ai, true);
  } else for (const g of accs) for (const u of g.list) {
    const x = u.head.t;
    E(isSum ? `“${x.w}” has -n. After “${V.w}”, what the subject is has no -n: “${eoFix(x, 'nom', x.n)}”.`
      : `“${A.w}” (${A.e[4]}) doesn’t take an object, so “${x.w}” (with -n) doesn’t fit here.${motion && !u.pron ? ` To say where to, use “al”: “al ${u.art ? 'la ' : ''}${eoFix(x, 'nom', x.n)}”.` : ''}`, u.head.i);
  }
  // prepositions: no -n after them, except "into / onto" with a verb of motion
  const dats = [], gens = [], places = [];
  for (const g of pps) {
    const P = g.p.t;
    for (const u of g.list) {
      const x = u.head.t, cat = u.pron ? 'person' : x.cat, acc = u.c === 'acc';
      if (acc && !['en', 'sur', 'sub'].includes(P.w)) { E(`After “${P.w}” (${P.gloss}), the noun has no -n: “${P.w} ${u.art ? 'la ' : ''}${eoFix(x, 'nom', x.n)}”.`, u.head.i); continue; }
      if (acc && !motion) { E(`“${P.w}” with -n means “${P.e[2]}”, so it needs a verb of motion (like iras, venas or kuras). For where something is, leave out -n: “${P.w} ${u.art ? 'la ' : ''}${eoFix(x, 'nom', x.n)}”.`, u.head.i); continue; }
      if (P.w === 'en' && !acc && motion && !['el'].includes(P.w)) { /* "iras en la parko" = goes (around) in the park: fine */ }
      if (P.w === 'kun' && !['person', 'animal'].includes(cat)) E('“kun” (with) goes with a person or an animal here: “kun la amiko”.', g.p.i);
      if (P.w === 'por' && !['person', 'animal'].includes(cat)) E('“por” (for) goes with a person or an animal here: “por la amiko”.', g.p.i);
      if (P.w === 'en' && !(cat === 'place' || EO_CONTAINER.includes(x.e?.[0]))) E(`“en” (${acc ? 'into' : 'in'}) goes with a place here, like “en la ${acc ? 'parkon' : 'parko'}”.`, u.head.i);
      if (P.w === 'sur' && !(EO_SURFACE.includes(x.e?.[0]) || ['strato', 'plaĝo'].includes(x.e?.[0]))) E(`“sur” (${acc ? 'onto' : 'on'}) goes with something you can be on here, like “sur la ${acc ? 'tablon' : 'tablo'}”.`, u.head.i);
      if (P.w === 'sub' && !['thing'].includes(cat)) E('“sub” (under) goes with a thing here, like “sub la tablo”.', u.head.i);
      if (['el', 'tra'].includes(P.w) && !motion) E(`“${P.w}” (${P.gloss}) needs a verb of motion, like “iras” (goes), “venas” (comes) or “kuras” (runs).`, g.p.i);
      if (['el', 'tra'].includes(P.w) && cat !== 'place') E(`“${P.w}” (${P.gloss}) goes with a place here, like “${P.w} la ${P.w === 'el' ? 'domo' : 'parko'}”.`, u.head.i);
      if (P.w === 'al') {
        if (dative && !motion) { if (!['person', 'animal'].includes(cat)) E(`With “${A.e[0]}”, “al” says who gets it: “al la amiko”.`, u.head.i); }
        else if (!motion) E(`“al” (to) needs a verb of motion (like iras or venas) or a verb like “donas” (gives).`, g.p.i);
        else if (!['place', 'person'].includes(cat)) E('“al” (to) goes with a place or a person here: “al la parko”, “al la amiko”.', u.head.i);
      }
      if (P.w === 'de') {
        const prev = groups[groups.indexOf(g) - 1], adj = prev && prev.en === g.st - 1 && (prev.kind === 'np' || prev.kind === 'pp');
        if (!adj) E('“de” (of) goes right after the noun it belongs to, like “la hundo de la knabo”.', g.p.i);
        else if (!['person', 'animal'].includes(cat)) E('“de” (of) goes with a person or an animal here: “la libro de la knabo”.', u.head.i);
        else { gens.push({ g, to: prev.kind === 'pp' ? prev.list[prev.list.length - 1] : prev.list[prev.list.length - 1] }); continue; }
      }
    }
    if (P.w === 'al' && dative && !motion) dats.push(g); else if (P.w !== 'de') places.push(g);
  }
  if (dats.length > 1) E('Only one “al” (to someone) here.', dats[1].p.i);
  // describing words on their own: after esti they say what the subject is like
  for (const g of adjUnits) {
    const a = g.list[0].adjs[0];
    const near = groups.find(h => h.kind === 'np' && (h.en === g.st - 1 || h.st === g.en + 1));
    if (isSum && !pred) {
      pred = { adj: g };
      for (const u of g.list) for (const x of u.adjs) {
        if (x.t.c === 'acc') E(`After “${V.w}”, the describing word has no -n: “${eoForm(x.t.e[0], 'nom', x.t.n)}”.`, x.i);
        else if (!subjVi && x.t.n !== subjNum) E(`“${x.t.w}” has to match the subject “${gText(subj)}”${subjNum === 'p' ? ' (more than one, so add -j)' : ' (just one, so no -j)'}: “${eoForm(x.t.e[0], 'nom', subjNum)}”.`, x.i);
      }
      continue;
    }
    if (near) { const h = near.list[0].head.t; E(`“${a.t.w}” has to match “${h.w}”: use “${eoForm(a.t.e[0], near.c, near.n)}”.`, a.i); }
    else E(`“${a.t.w}” (${a.t.e[1]}) needs a noun to describe${isSum ? '' : ', or the verb “estas” (is)'}.`, a.i, true);
  }
  if (pred?.noun) for (const u of pred.noun.list) if (!subjVi && u.n !== subjNum && !u.head.t.mass) E(`“${u.head.t.w}” has to match the subject “${gText(subj)}”${subjNum === 'p' ? ' (more than one, so add -j)' : ' (just one, so no -j)'}: “${eoForm(u.head.t.e[0], 'nom', subjNum)}”.`, u.head.i);
  const placeWord = advs.some(x => ['tie', 'hejme'].includes(x.t.w));
  // "la infano maljuna estas", "granda amiko estas": with nothing else after esti, the subject's describing word is what it is like
  if (isSum && !pred && !places.length && !placeWord && !accs.length && subj.list.length === 1 && subj.list[0].adjs.length) {
    const u = subj.list[0], post = u.adjs.filter(a => a.i > u.head.i), take = post.length ? post : [u.adjs[0]];
    u.adjs = u.adjs.filter(a => !take.includes(a));
    pred = { adj: { list: [{ adjs: take }] } };
  }
  if (isSum && !pred && !places.length && !placeWord && !accs.length) E(`“${V.w}” (${tense === 'is' ? 'was' : tense === 'os' ? 'will be' : 'is'}) needs something with it: a describing word (“feliĉa”), a noun (“instruisto”) or a place (“en la domo”).`, Vi, true);
  if (isSum && pred && subj.list.some(u => !u.pron) && !pred.noun) {
    // "la pomo estas feliĉa" is grammatical but odd: describing words have to suit the subject
    const a = pred.adj.list[0].adjs[0], code = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' }[subj.list[0].head.t.cat];
    if (code && !a.t.e[2].includes(code)) E(`That doesn’t make sense: ${eoWhat(subj.list[0].head.t)} can’t be ${a.t.e[1]}.`, a.i);
  }
  errs.sort((a, b) => a.at - b.at);
  return { errs, miss: 0, parse: { V, A, tense, subj, pred, objs, dats, places, gens, toks, neg: negs.length > 0, never: !!never, advs } };
}
const eoExampleObj = v => ({ food: 'pomon', drink: 'akvon', read: 'libron', thing: 'pilkon', place: 'la domon', animal: 'la hundon', person: 'la amikon', open: 'la pordon', hear: 'kanton', '*': 'la hundon' })[v[2][0]] || 'pomon';

/* English meaning of a correct Esperanto sentence */
function eoEnglish(P) {
  const one = C => {
    const toks = C.toks, veryOf = x => { const k = toks.indexOf(x); return k > 0 && toks[k - 1].t.k === 'int' ? 'very ' : ''; };
    const nounEn = u => u.n === 'p' ? u.head.t.e[3] || u.head.t.e[2] : u.head.t.e[2];
    const np = (u, asObj) => {
      if (u.pron) return asObj ? u.head.t.e[4] : u.head.t.e[3];
      const ad = u.adjs.map(a => veryOf(a) + a.t.e[1]), base = (ad.length ? ad.join(' ') + ' ' : '') + nounEn(u);
      const own = C.gens.filter(x => x.to === u).map(x => x.g.list[0]);
      if (own.length) { const o = own[0], s = np(o, true), poss = o.pron ? ({ me: 'my', you: 'your', him: 'his', her: 'her', it: 'its', us: 'our', them: 'their' })[s] : /s$/.test(s) ? s + '’' : s + '’s'; return `${poss} ${base}`; }
      if (u.det) return u.det.t.e[1] + ' ' + base;
      if (u.art) return 'the ' + base;
      return u.n === 'p' || u.head.t.mass ? base : eoAn(base);
    };
    const grp = (g, asObj) => g.list.map(u => np(u, asObj)).join(' and ');
    const s1 = C.subj.list.length === 1 ? C.subj.list[0] : null;
    const third = s1 && (s1.pron ? ['he', 'she', 'it'].includes(s1.head.t.e[3]) : s1.n === 's');
    const isI = s1?.pron && s1.head.t.w === 'mi';
    const who = grp(C.subj);
    const freq = C.advs.filter(x => ['ĉiam', 'ofte'].includes(x.t.w)).map(x => x.t.en).join(' ');
    const how = C.advs.filter(x => x.t.pos === 'how').map(x => veryOf(x) + x.t.en), tail = C.advs.filter(x => ['time', 'end'].includes(x.t.pos)).map(x => x.t.en);
    const neg = C.neg, never = C.never, A = C.A, V = C.V, t = C.tense, f = freq ? ' ' + freq : '';
    let vp;
    if (A.type === 'sum') {
      const be = t === 'is' ? (isI || third ? 'was' : 'were') : t === 'os' ? 'will be' : isI ? 'am' : third ? 'is' : 'are';
      const be2 = t === 'os' ? (never ? 'will never be' : neg ? 'will not be' : 'will' + f + ' be') : be + (never ? ' never' : neg ? ' not' : '') + f;
      let what = '';
      if (C.pred?.adj) what = C.pred.adj.list.map(u => u.adjs.map(a => veryOf(a) + a.t.e[1]).join(' ')).join(' and ');
      else if (C.pred?.noun) what = grp(C.pred.noun);
      vp = `${be2} ${what}`;
    } else {
      const base = A.e[4], s3 = A.e[5], past = A.e[6];
      if (V.type === 'modal') {
        const can = V.e[0] === 'povi', b = A.type === 'sum' ? 'be' : base;
        if (can) vp = t === 'is' ? `${never ? 'could never' : neg ? 'could not' : 'could'}${f} ${b}` : t === 'os' ? `${never ? 'will never' : neg ? 'will not' : 'will' + f} be able to ${b}` : `${never ? 'can never' : neg ? 'cannot' : 'can'}${f} ${b}`;
        else vp = t === 'is' ? (never ? `never wanted to ${b}` : neg ? `did not${f} want to ${b}` : `${freq ? freq + ' ' : ''}wanted to ${b}`)
          : t === 'os' ? `${never ? 'will never' : neg ? 'will not' : 'will' + f} want to ${b}`
          : never ? `never ${third ? 'wants' : 'want'} to ${b}` : neg ? `${third ? 'does' : 'do'} not${f} want to ${b}` : `${freq ? freq + ' ' : ''}${third ? 'wants' : 'want'} to ${b}`;
      } else if (t === 'is') vp = never ? `never ${past}` : neg ? `did not${f} ${base}` : `${freq ? freq + ' ' : ''}${past}`;
      else if (t === 'os') vp = `${never ? 'will never' : neg ? 'will not' : 'will' + f} ${base}`;
      else vp = never ? `never ${third ? s3 : base}` : neg ? `${third ? 'does' : 'do'} not${f} ${base}` : `${freq ? freq + ' ' : ''}${third ? s3 : base}`;
      if (C.objs.length) vp += ' ' + C.objs.map(u => np(u, true)).join(' and ');
      for (const g of C.dats) vp += ' to ' + grp(g, true);
    }
    if (how.length) vp += ' ' + how.join(' ');
    for (const g of C.places) { const P = g.p.t, pe = g.list[0].c === 'acc' ? P.e[2] : P.e[1]; vp += ` ${pe} ${grp(g, true)}`; }
    if (tail.length) vp += ' ' + tail.join(' ');
    return `${who} ${vp}`.replace(/\s+/g, ' ').trim();
  };
  let s = one(P.clauses[0]);
  P.conjs.forEach((c, k) => { s += (c.w === 'sed' ? ', but ' : ', and ') + one(P.clauses[k + 1]); });
  return s[0].toUpperCase() + s.slice(1) + '.';
}

/* ---------------- making an Esperanto tray ----------------
   The sentence is made in the usual order: (when) subject (ne) verb object (where) (how). Now and then the object
   comes first ("Pomon manĝas la knabo"), to show that the -n, not the order, marks the object.
   The other words in the tray are look-alikes: the same noun with or without -n or -j, the verb in another tense… */
function eoGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = list => { const fav = list.filter(x => pref.has(x[0]) || pref.has(eoLow(x[0]))); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const used = new Set();
  const nounOf = cats => { const all = EO_NOUN.filter(n => cats[0] === '*' || cats.includes(n[1]) || (cats.includes('open') && EO_OPENABLE.includes(n[0])) || (cats.includes('hear') && EO_HEARABLE.includes(n[0]))), fresh = all.filter(n => !used.has(n)); return RP(fresh.length ? fresh : all); };
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
  const adjFor = cat => RP(EO_ADJ.filter(a => a[2].includes(CAT[cat] || 'p')));
  const extra = [];
  const verbOf = test => RP(EO_VERB.filter(test));
  // a noun phrase: (la | mia) (adjective) noun (de la …)
  const np = (e, c, n, out, opts = {}) => {
    const nn = e[4] ? 's' : n; used.add(e);
    const art = opts.art ?? coin(0.65), poss = !art && opts.poss !== false && coin(0.15);
    if (art) out.push(eoLa()); else if (poss) out.push(eoPossChip(eoForm(R(EO_POSS)[0], c, nn)));
    let adj = null;
    if (opts.adj !== false && coin(0.3)) { adj = adjFor(e[1]); if (opts.very && coin(0.2)) out.push(eoTre()); out.push(eoAdj(adj, c, nn)); }
    out.push(eoNoun(e, c, nn));
    extra.push(eoNoun(e, c === 'nom' ? 'acc' : 'nom', nn));
    if (!e[4] && coin(0.3)) extra.push(eoNoun(e, c, nn === 's' ? 'p' : 's'));
    if (adj) extra.push(eoAdj(adj, c === 'nom' ? 'acc' : 'nom', nn));
    if (opts.of && coin(0.12)) { const g = nounOf(['person']); if (g !== e) { out.push(eoPrep('de'), eoLa(), eoNoun(g, 'nom', 's')); used.add(g); extra.push(eoNoun(g, 'acc', 's')); } }
    return nn;
  };
  const clause = () => {
    const out = [], kind = R(['tr', 'tr', 'tr', 'in', 'sum', 'sum', 'motion', 'modal', 'dat']);
    let V, A;
    if (kind === 'sum') V = A = EO_VERB.find(v => v[0] === 'esti');
    else if (kind === 'modal') { V = RP(EO_VERB.filter(v => v[1] === 'modal')); A = verbOf(v => ['tr', 'in'].includes(v[1]) && !v[8]); }
    else if (kind === 'motion') V = A = verbOf(v => v[8] === 'm');
    else if (kind === 'dat') V = A = verbOf(v => v[8] === 'd');
    else V = A = verbOf(v => v[1] === kind && !v[8]);
    const tense = R(['as', 'as', 'as', 'is', 'os']);
    // who does it: a pronoun or a noun
    const subj = [], obj = [], rest = [];
    let num = 's', subjE = null;
    if (coin(0.4)) { const p = R(EO_PRON.filter(x => x[0] !== 'ĝi' || A[7] === 'a')); subj.push(eoPronChip(p[0])); num = p[2] === '*' ? 'p' : p[2]; }
    else {
      subjE = nounOf(A[7] === 'p' || A[1] === 'sum' ? ['person'] : ['person', 'animal']);
      num = np(subjE, 'nom', coin(0.3) ? 'p' : 's', subj, { very: true, of: true });
      if (coin(0.08)) { const e2 = nounOf(['person']); if (e2 !== subjE) { subj.push(eoConj('kaj')); np(e2, 'nom', 's', subj, { adj: false, poss: false }); num = 'p'; } }
    }
    const time = coin(0.22) ? (tense === 'is' ? R(['hieraŭ', 'hodiaŭ']) : tense === 'os' ? R(['morgaŭ', 'hodiaŭ']) : R(['hodiaŭ', 'nun', 'ĉiutage'])) : null;
    let objFirst = false;
    if (kind === 'sum') {
      const x = Math.random();
      if (x < 0.55) { const a = adjFor(subjE ? subjE[1] : 'person'); if (coin(0.2)) rest.push(eoTre()); rest.push(eoAdj(a, 'nom', num)); extra.push(eoAdj(a, 'acc', num)); extra.push(eoAdj(a, 'nom', num === 's' ? 'p' : 's')); }
      else if (x < 0.75 && (!subjE || subjE[1] === 'person')) { const pn = nounOf(['person']); np(pn, 'nom', num, rest, { art: false, poss: false, adj: coin(0.3) }); }
      else { const pl = nounOf(['place']); rest.push(eoPrep(R(['en', 'en', 'apud']))); np(pl, 'nom', 's', rest, { adj: false, art: true }); extra.push(eoNoun(pl, 'acc', 's')); }
    } else {
      if (A[1] === 'tr') {
        if (coin(0.12) && (A[2].includes('person') || ['vidi', 'ami', 'ŝati'].includes(A[0]))) { const p = R(EO_PRON.filter(x => !subj.some(s => s.k === 'pron' && s.e === x))); obj.push(eoPronChip(p[0] + 'n')); extra.push(eoPronChip(p[0])); }
        else { const o = nounOf(A[2]); np(o, 'acc', coin(0.3) ? 'p' : 's', obj, { of: true }); }
        objFirst = coin(0.12);
      }
      if (A[8] === 'd' && coin(0.7)) { const d = nounOf(['person']); rest.push(eoPrep('al')); np(d, 'nom', 's', rest, { adj: false }); }
      if (A[8] === 'm' && coin(0.7)) {
        const pl = nounOf(['place']), p = R(['al', 'al', 'en', 'el']);
        rest.push(eoPrep(p)); np(pl, p === 'en' ? 'acc' : 'nom', 's', rest, { adj: false, art: true });
        if (p === 'el') extra.push(eoNoun(pl, 'acc', 's'));
      } else if (A[1] === 'in' && !A[8] && coin(0.55)) {
        if (A[0] === 'sidi' && coin(0.6)) { rest.push(eoPrep('sur')); np(RP(EO_NOUN.filter(n => ['tablo', 'seĝo'].includes(n[0]))), 'nom', 's', rest, { adj: false, art: true }); }
        else if (coin(0.5)) { const pl = A[0] === 'naĝi' ? RP(EO_NOUN.filter(n => n[0] === 'maro')) : nounOf(['place']); rest.push(eoPrep('en')); np(pl, 'nom', 's', rest, { adj: false, art: true }); }
        else { const w = nounOf(['person', 'animal']); rest.push(eoPrep('kun')); np(w, 'nom', 's', rest, { adj: false }); }
      }
      if (coin(0.18) && (EO_HOW.test(A[0]) || (!A[8] && !rest.some(c => c.k === 'prep')))) rest.push(eoAdv(R(EO_HOW.test(A[0]) ? ['bone', 'rapide', 'malrapide'] : ['tie', 'hejme'])));
    }
    const freq = coin(0.12) ? R(['ĉiam', 'ofte', 'neniam']) : null;
    const neg = !freq && coin(0.16);
    const verb = [];
    if (freq) verb.push(eoAdv(freq));
    if (neg) verb.push(eoNe()); else extra.push(eoNe());
    verb.push(eoVerb(V, tense));
    if (V !== A) verb.push(eoVerb(A, 'i'));
    extra.push(eoVerb(V, R(['as', 'is', 'os', 'i'].filter(t => t !== tense))));
    const words = objFirst && !neg && !freq ? [...obj, ...verb, ...subj, ...rest] : [...subj, ...verb, ...obj, ...rest];
    if (time) words.unshift(eoAdv(time));
    return words;
  };
  for (let tries = 0; tries < 150; tries++) {
    extra.length = 0; used.clear();
    let words = clause();
    if (Math.random() < 0.15) words = [...words, eoConj(R(['kaj', 'sed'])), ...clause()];
    if (words.length > 14 || words.length < 2) continue;
    const res = eoCheck(words); if (!res.ok) continue;
    extra.push(eoPrep(R(['en', 'al', 'kun'])), eoPronChip(R(['mi', 'vi', 'ni'])), eoLa());
    if (!words.some(w => w.k === 'conj')) extra.push(eoConj(R(['kaj', 'sed'])));
    const seen = new Set(words.map(w => w.k + w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && !seen.has(x.k + x.w)) { seen.add(x.k + x.w); uniq.push(x); }
    return { words, extra: uniq.slice(0, Math.max(4, 15 - words.length)), english: eoEnglish(res.P) };
  }
  return null;
}

BLD_LANGS.eo = { name: 'Esperanto', check: eoCheck, gen: eoGenerate, voice: 'eo', english: eoEnglish, types: ['pron', 'noun', 'verb', 'adj', 'det', 'prep', 'conj', 'adv'] };
BLD_ORDER.eo = { rows: [
    ['The usual order', [['det', '(la)'], ['adj', '(adjective)'], ['noun', 'subject'], ['verb', 'verb'], ['det', '(la)'], ['adj', '(adjective + n)'], ['noun', 'object + n']]],
    ['Other orders work too: the -n shows the object', [['noun', 'object + n'], ['verb', 'verb'], ['noun', 'subject']]],
    ['Starting with a pronoun', [['pron', 'mi / vi / li / ŝi…'], ['verb', 'verb'], ['noun', 'object + n']]],
    ['Saying what something is like (esti)', [['det', '(la)'], ['noun', 'subject'], ['verb', 'estas'], ['adv', '(tre)'], ['adj', 'adjective (no -n)']]],
    ['Adding where, who with, or for whom', [['pron', 'subject'], ['verb', 'verb'], ['prep', 'preposition'], ['det', '(la)'], ['noun', 'noun (no -n)']]],
    ['A negative sentence', [['pron', 'subject'], ['adv', 'ne'], ['verb', 'verb'], ['noun', 'object + n']]],
    ['Can / want to do something', [['pron', 'subject'], ['verb', 'povas / volas'], ['verb', 'verb in -i']]],
    ['Joining two sentences', [['verb', 'sentence'], ['conj', 'kaj / sed'], ['verb', 'sentence']]],
  ], tips: [
    ['noun', 'The <b>-n</b> ending marks the object: <b>La knabo vidas la hundon</b> = the boy sees the dog. <b>-j</b> means more than one: <b>hundoj</b>, <b>hundojn</b>.'],
    ['verb', 'Verbs are the same for everyone: <b>mi manĝas</b>, <b>ŝi manĝas</b>, <b>ili manĝas</b>. <b>-as</b> now, <b>-is</b> past, <b>-os</b> future, <b>-i</b> to … .'],
    ['adj', 'Adjectives (<b>-a</b>) match their noun: <b>granda hundo</b>, <b>grandaj hundoj</b>, <b>grandan hundon</b>. After <b>estas</b> there is no -n: <b>La hundo estas granda</b>.'],
    ['det', '<b>la</b> (the) is the only article and never changes. There is no word for “a”: <b>hundo</b> = a dog.'],
    ['prep', 'After a preposition there is no -n: <b>kun la amiko</b>, <b>en la domo</b>. With a verb of motion, <b>en</b> + -n means “into”: <b>Ŝi iras en la domon</b>.'],
    ['adv', '<b>ne</b> goes right before the verb. <b>tre</b> (very) goes right before the adjective. <b>hieraŭ</b> goes with -is, <b>morgaŭ</b> with -os.'],
    ['pron', 'Esperanto always says who does it: <b>Mi manĝas</b>, not just “manĝas”.'] ] };

/* ---------------- Your own Esperanto words (📚 Add my deck's words) ----------------
   The ending tells the game what kind of word each card is: hundo (noun), granda (adjective), manĝi (verb).
   Everything else (hundoj, hundon, manĝas, manĝis, manĝos) follows from that, with no exceptions. */
const eoFoldX = s => eoLow(s).replace(/([cghjsu])x/g, (m, c) => ({ c: 'ĉ', g: 'ĝ', h: 'ĥ', j: 'ĵ', s: 'ŝ', u: 'ŭ' })[c]);   // x-system: cx → ĉ … ux → ŭ (x is not an Esperanto letter)
const eoKindOf = w => /[^aeiou]?o$/.test(w) && w.length > 2 ? 'noun' : /a$/.test(w) && w.length > 2 && !EO_POSS.some(p => p[0] === w) ? 'adj' : /i$/.test(w) && w.length > 2 && !EO_PRON.some(p => p[0] === w) ? 'verb' : '';
const EO_BASE = { n: EO_NOUN.length, a: EO_ADJ.length, v: EO_VERB.length };
const eoKnown = w => EO_NOUN.slice(0, EO_BASE.n).some(n => n[0] === w) || EO_VERB.slice(0, EO_BASE.v).some(v => v[0] === w) || EO_ADJ.slice(0, EO_BASE.a).some(a => a[0] === w)
  || [EO_PRON, EO_POSS, EO_PREP, EO_ADV, EO_CONJ].some(L => L.some(x => x[0] === w)) || ['la', 'ne', 'tre'].includes(w);
const EO_PAST_EN = { be: 'was', go: 'went', come: 'came', eat: 'ate', drink: 'drank', see: 'saw', have: 'had', make: 'made', take: 'took', give: 'gave', buy: 'bought',
  bring: 'brought', think: 'thought', find: 'found', get: 'got', know: 'knew', run: 'ran', sing: 'sang', swim: 'swam', write: 'wrote', read: 'read', speak: 'spoke',
  sleep: 'slept', sit: 'sat', stand: 'stood', meet: 'met', send: 'sent', tell: 'told', say: 'said', hear: 'heard', feel: 'felt', leave: 'left', lose: 'lost', win: 'won',
  begin: 'began', break: 'broke', choose: 'chose', drive: 'drove', fly: 'flew', forget: 'forgot', grow: 'grew', hold: 'held', keep: 'kept', learn: 'learned', put: 'put',
  ride: 'rode', sell: 'sold', show: 'showed', teach: 'taught', throw: 'threw', understand: 'understood', wear: 'wore', draw: 'drew', build: 'built', catch: 'caught', cut: 'cut', pay: 'paid', spend: 'spent' };
const eoPastEn = en => { const [h, ...t] = String(en).split(' '), p = EO_PAST_EN[h] || (/e$/.test(h) ? h + 'd' : /[^aeiou]y$/.test(h) ? h.slice(0, -1) + 'ied' : h + 'ed'); return [p, ...t].join(' '); };
function eoApplyMine() {
  EO_NOUN.length = EO_BASE.n; EO_ADJ.length = EO_BASE.a; EO_VERB.length = EO_BASE.v;
  for (const m of S.bldWords || []) {
    if (!m || m.lang !== 'eo' || !m.w || !m.en || eoKnown(m.w)) continue;
    if (m.k === 'noun' && /o$/.test(m.w)) EO_NOUN.push([m.w, m.cat || 'thing', m.en, bldPlEn(m.en)]);
    if (m.k === 'verb' && /i$/.test(m.w)) {
      const type = m.obj === 'in' ? 'in' : 'tr', objs = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read', 'place'];
      const words = m.en.split(' '), s3 = [bld3sEn(words[0]), ...words.slice(1)].join(' ');
      EO_VERB.push([m.w, type, type === 'tr' ? objs : null, 0, m.en, s3, eoPastEn(m.en), m.who === 'a' ? 'a' : 'p']);
    }
    if (m.k === 'adj' && /a$/.test(m.w)) EO_ADJ.push([m.w, m.en, 'patflr']);
  }
}
if (typeof bldApplyMine === 'function') { const applyAll = bldApplyMine; bldApplyMine = function () { applyAll(); eoApplyMine(); }; }
BLD_MINE.eo = { name: 'Esperanto', forms: 'now, past, future (manĝas, manĝis, manĝos)', nForms: 3, m: 'masculine', f: 'feminine', noGender: true,
  conj: w => /i$/.test(w) ? ['as', 'is', 'os'].map(t => w.slice(0, -1) + t) : [w], pl: w => w + 'j', adj: w => eoForms(w).map(f => f.w),
  known: w => eoKnown(eoFoldX(w)), gender: () => 'm', isVerb: w => /i$/.test(eoFoldX(w)), refl: () => false,
  // "la hundo" → hundo (a noun); Esperanto in the x-system ("cxevalo") is turned into ĉ ĝ ĥ ĵ ŝ ŭ
  parse: s => { const f = eoFoldX(s).trim(), art = /^la\s+/.test(f), t = f.replace(/^la\s+/, ''); if (!/^\p{L}+$/u.test(t)) return null; return { w: t, art: art || /o$/.test(t) }; },
  intro: 'in Esperanto the ending shows the kind of word: <i>-o</i> is a noun (hundo), <i>-a</i> an adjective (granda), <i>-i</i> a verb (manĝi). All the other forms follow from that, with no exceptions).' };
// bldCandidates guesses nouns from an article; in Esperanto the ending says it all
if (typeof bldCandidates === 'function') {
  const candAll = bldCandidates;
  bldCandidates = function (deckId) {
    const out = candAll(deckId);
    if (out) for (const c of out) if (c.lang === 'eo') { const k = eoKindOf(c.w); if (k && (!c.k || !c.fromLabel)) c.k = k; c.verbOK = k === 'verb'; }
    return out;
  };
}
/* every word the Esperanto Sentence Builder knows, with its meaning (for 🌐 auto-translate and the word labels) */
function eoWordList() {
  const out = [];
  for (const n of EO_NOUN) for (const f of eoForms(n[0])) out.push([f.w, f.n === 'p' ? n[3] || n[2] : n[2], 'noun']);
  for (const a of EO_ADJ) for (const f of eoForms(a[0])) out.push([f.w, a[1], 'adj']);
  for (const v of EO_VERB) { out.push([v[0], 'to ' + v[4], 'verb']); for (const t of ['as', 'is', 'os']) out.push([eoVerbForm(v, t), t === 'as' ? (v[1] === 'sum' ? 'is / are' : v[4]) : t === 'is' ? (v[1] === 'sum' ? 'was / were' : v[6]) : 'will ' + (v[0] === 'povi' ? 'be able to' : v[4]), 'verb']); out.push([eoVerbForm(v, 'us'), 'would ' + v[4], 'verb'], [eoVerbForm(v, 'u'), v[4] + '!', 'verb']); }
  for (const p of EO_PRON) out.push([p[0], p[3], 'pron'], [p[0] + 'n', p[4], 'pron']);
  for (const p of EO_POSS) for (const f of eoForms(p[0])) out.push([f.w, p[1], 'det']);
  for (const p of EO_PREP) out.push([p[0], p[1], 'prep']);
  for (const a of EO_ADV) out.push([a[0], a[1], 'adv']);
  for (const c of EO_CONJ) out.push([c[0], c[1], 'conj']);
  out.push(['la', 'the', 'det'], ['ne', 'not', 'adv'], ['tre', 'very', 'adv']);
  return out;
}
