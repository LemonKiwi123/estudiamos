'use strict';
/* ================= Sentence Builder: Turkish =================
   Everyday present-tense sentences. What the checker teaches:
   • the verb (or var / yok, or the describing word) comes last; the parts before it can move around
   • endings do the work of English little words, and they follow vowel harmony: -ı/-i/-u/-ü “the thing you act on”
     (kitabı), -a/-e “to” (okula), -da/-de/-ta/-te “at, in” (parkta), -dan/-den “from” (evden), -ın/-in “’s” (çocuğun)
   • p ç t k at the end of many longer words soften before a vowel: kitap → kitabı, köpek → köpeği
   • a thing with no ending (kitap = a book) goes right before the verb; with -ı it is “the” thing (kitabı = the book)
   • -iyor (is doing, okuyorum) and the simple present (okurum: I read, as a habit); the person goes on the end:
     -um / -sun / – / -uz / -sunuz / -lar
   • “not” is -me- / -ma- inside the verb (okumuyorum), değil after nouns and describing words (yorgun değilim)
   • the question word mı / mi / mu / mü is written apart and follows the last vowel: okuyor musun?
   • after a number there is no plural: iki kedi; benim kitabım (my book), çocuğun kedisi (the child’s cat)
   • var / yok: there is / there isn’t, and with -im: bir kedim var (I have a cat)
   Every word chip is a whole word with its endings; the tray also has the same word with the wrong ending.
   Loaded after builder.js. */

/* ---------------- letters, harmony and endings ---------------- */
const TR_V = 'aeıioöuü';
const trLow = s => String(s || '').replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
const trUp = s => String(s || '').replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
const trCap = s => s ? trUp(s[0]) + s.slice(1) : s;
let TR_FLIP = false;   // only for making a wrong-harmony distractor
const trLastV = w => { for (let i = w.length - 1; i >= 0; i--) if (TR_V.includes(w[i])) return w[i]; return 'e'; };
const trA = w => { const back = 'aıou'.includes(trLastV(w)); return back !== TR_FLIP ? 'a' : 'e'; };
const trI = w => { const v = trLastV(w), r = { a: 'ı', ı: 'ı', o: 'u', u: 'u', e: 'i', i: 'i', ö: 'ü', ü: 'ü' }[v]; return TR_FLIP ? { ı: 'i', i: 'ı', u: 'ü', ü: 'u' }[r] : r; };
const trEndV = w => TR_V.includes(String(w).slice(-1));
const trSyl = w => [...String(w)].filter(c => TR_V.includes(c)).length;
const trD = w => 'çfhkpsşt'.includes(String(w).slice(-1)) ? 't' : 'd';
const trSoft = w => { const c = w.slice(-1); if (c === 'k' && w.slice(-2, -1) === 'n') return w.slice(0, -1) + 'g'; return ({ p: 'b', ç: 'c', t: 'd', k: 'ğ' })[c] ? w.slice(0, -1) + { p: 'b', ç: 'c', t: 'd', k: 'ğ' }[c] : w; };
const TR_PERS = ['1s', '2s', '3s', '1p', '2p', '3p'];
// the “I am / you are…” ending on a noun or describing word: öğretmenim, yorgunsun, hastayız
function trCopEnd(w, per, soft) {
  const I = trI(w), y = trEndV(w) ? 'y' : '', b = soft && !y ? trSoft(w) : w;
  return { '1s': b + y + I + 'm', '2s': w + 's' + I + 'n', '3s': w, '1p': b + y + I + 'z', '2p': w + 's' + I + 'n' + I + 'z', '3p': w + 'l' + trA(w) + 'r' }[per];
}
/* a noun with its endings: plural, owner (-im, -in, -i, -imiz, -iniz) and case.
   o: { pl, poss: '1s'…'2p', cs: 'nom' | 'acc' | 'dat' | 'loc' | 'abl' | 'gen', nosoft } */
function trNF(n, o = {}) {
  const fl = n[3] || '', soft = fl.includes('s') && !o.nosoft, yb = fl.includes('y');
  let w = n[0], bare = true, buf = false;
  const endV = () => trEndV(w) && !(bare && yb);
  const glue = suf => { w = (bare && soft ? trSoft(w) : bare && yb ? w + 'y' : w) + suf; bare = false; };
  if (o.pl) { w += 'l' + trA(w) + 'r'; bare = false; }
  if (o.poss) {
    const P = o.poss, I = trI(w);
    if (endV()) w += { '1s': 'm', '2s': 'n', '3s': 's' + I, '1p': 'm' + I + 'z', '2p': 'n' + I + 'z' }[P];
    else glue(I + { '1s': 'm', '2s': 'n', '3s': '', '1p': 'm' + I + 'z', '2p': 'n' + I + 'z' }[P]);
    bare = false; buf = P === '3s';
  }
  const A = trA(w), I = trI(w);
  switch (o.cs) {
    case 'acc': if (buf) w += 'n' + I; else if (endV()) w += 'y' + I; else glue(I); break;
    case 'dat': if (buf) w += 'n' + A; else if (endV()) w += 'y' + A; else glue(A); break;
    case 'loc': w += (buf ? 'nd' : trD(w)) + A; break;
    case 'abl': w += (buf ? 'nd' : trD(w)) + A + 'n'; break;
    case 'gen': if (buf || endV()) w += 'n' + I + 'n'; else glue(I + 'n'); break;
  }
  return w;
}
const trFlip = f => { TR_FLIP = true; try { return f(); } finally { TR_FLIP = false; } };

/* ---------------- words ---------------- */
// [Turkish, ‘ben’ person, English, owner form, owner person]
const TR_PRON = [['ben', '1s', 'I', 'benim'], ['sen', '2s', 'you', 'senin'], ['o', '3s', 'he/she', 'onun'], ['biz', '1p', 'we', 'bizim'], ['siz', '2p', 'you', 'sizin'], ['onlar', '3p', 'they', '']];
// [word, kind, English, flags (s softens, y su→suyu, m you can make it, o you can open it, M no “a” in English), place word, English plural]
const TR_NOUN = [
  ['öğretmen', 'person', 'teacher'], ['öğrenci', 'person', 'student'], ['doktor', 'person', 'doctor'], ['çocuk', 'person', 'child', 's', '', 'children'], ['arkadaş', 'person', 'friend'],
  ['kadın', 'person', 'woman', '', '', 'women'], ['adam', 'person', 'man', '', '', 'men'], ['kız', 'person', 'girl'], ['bebek', 'person', 'baby', 's'], ['aşçı', 'person', 'cook'],
  ['anne', 'person', 'mother', 'F'], ['baba', 'person', 'father', 'F'], ['kardeş', 'person', 'brother / sister', 'F'],
  ['kedi', 'animal', 'cat'], ['köpek', 'animal', 'dog', 's'], ['kuş', 'animal', 'bird'], ['at', 'animal', 'horse'], ['balık', 'animal', 'fish', 's', '', 'fish'], ['inek', 'animal', 'cow', 's'], ['tavşan', 'animal', 'rabbit'],
  ['ekmek', 'food', 'bread', 'smM'], ['elma', 'food', 'apple'], ['peynir', 'food', 'cheese', 'M'], ['pilav', 'food', 'rice', 'mM'], ['çorba', 'food', 'soup', 'mM'], ['pasta', 'food', 'cake', 'm'],
  ['yumurta', 'food', 'egg'], ['muz', 'food', 'banana'], ['et', 'food', 'meat', 'M'], ['salata', 'food', 'salad', 'mM'],
  ['su', 'drink', 'water', 'yM'], ['çay', 'drink', 'tea', 'mM'], ['kahve', 'drink', 'coffee', 'mM'], ['süt', 'drink', 'milk', 'M'], ['limonata', 'drink', 'lemonade', 'mM'],
  ['kitap', 'read', 'book', 'so'], ['gazete', 'read', 'newspaper'], ['mektup', 'read', 'letter', 's'], ['dergi', 'read', 'magazine'],
  ['masa', 'thing', 'table', '', 'on'], ['kalem', 'thing', 'pen'], ['çanta', 'thing', 'bag', 'o', 'in'], ['araba', 'thing', 'car', '', 'in'], ['telefon', 'thing', 'phone'], ['bilgisayar', 'thing', 'computer'],
  ['kapı', 'thing', 'door', 'o'], ['pencere', 'thing', 'window', 'o'], ['top', 'thing', 'ball'], ['anahtar', 'thing', 'key'],
  ['televizyon', 'watch', 'TV', 'M'], ['film', 'watch', 'film'], ['müzik', 'hear', 'music', 'M'], ['şarkı', 'hear', 'song'],
  ['ev', 'place', 'house', '', 'in'], ['okul', 'place', 'school', 'B', 'at'], ['park', 'place', 'park', '', 'in'], ['bahçe', 'place', 'garden', '', 'in'], ['market', 'place', 'shop', '', 'at'],
  ['mutfak', 'place', 'kitchen', 's', 'in'], ['oda', 'place', 'room', '', 'in'], ['sinema', 'place', 'cinema', '', 'at'], ['ofis', 'place', 'office', '', 'at'], ['hastane', 'place', 'hospital', '', 'at'],
  ['kütüphane', 'place', 'library', '', 'at'], ['plaj', 'place', 'beach', '', 'at'], ['deniz', 'place', 'sea', '', 'in']];
// [word, English, who/what it fits (p people, a animals, f food and drink, t things, l places), flags (s softens), note]
const TR_ADJ = [['büyük', 'big', 'patl', 's'], ['küçük', 'small', 'patl', 's'], ['güzel', 'beautiful', 'patl'], ['yeni', 'new', 'tl'], ['eski', 'old', 'tl', '', 'old (things)'], ['sıcak', 'hot', 'f', 's'],
  ['soğuk', 'cold', 'f', 's'], ['lezzetli', 'delicious', 'f'], ['temiz', 'clean', 'tl'], ['kirli', 'dirty', 'tl'], ['ucuz', 'cheap', 'ft'], ['pahalı', 'expensive', 'ft'], ['mutlu', 'happy', 'pa'],
  ['yorgun', 'tired', 'pa'], ['hasta', 'ill', 'pa'], ['genç', 'young', 'p'], ['yaşlı', 'old', 'pa', '', 'old (people, animals)'], ['hızlı', 'fast', 'a'], ['tatlı', 'sweet', 'f'], ['kırmızı', 'red', 't'],
  ['mavi', 'blue', 't'], ['beyaz', 'white', 'at'], ['siyah', 'black', 'at'], ['akıllı', 'clever', 'pa'], ['sessiz', 'quiet', 'pl']];
/* verbs: w, t (acc: a thing with -ı or no ending · dat: -e · abl: -den · in: nothing), o (kinds it goes with), en [base, -s, -ing],
   who (p people · a people and animals), st (English says it in the simple present), ir (simple present -ir: gelir), soft (git → gidiyor), be (English “be …”), prep */
const TR_VERB = [
  { w: 'okumak', t: 'acc', o: ['read'], en: ['read', 'reads', 'reading'], who: 'p' },
  { w: 'yazmak', t: 'acc', o: ['read'], en: ['write', 'writes', 'writing'], who: 'p' },
  { w: 'yemek', t: 'acc', o: ['food'], en: ['eat', 'eats', 'eating'], who: 'a' },
  { w: 'içmek', t: 'acc', o: ['drink'], en: ['drink', 'drinks', 'drinking'], who: 'a' },
  { w: 'almak', t: 'acc', o: ['food', 'drink', 'read', 'thing'], en: ['buy', 'buys', 'buying'], who: 'p', ir: 1 },
  { w: 'sevmek', t: 'acc', o: ['*'], en: ['love', 'loves', 'loving'], who: 'a', st: 1 },
  { w: 'görmek', t: 'acc', o: ['person', 'animal', 'thing', 'read', 'place'], en: ['see', 'sees', 'seeing'], who: 'a', st: 1, ir: 1 },
  { w: 'izlemek', t: 'acc', o: ['watch'], en: ['watch', 'watches', 'watching'], who: 'p' },
  { w: 'dinlemek', t: 'acc', o: ['hear', 'person'], en: ['listen to', 'listens to', 'listening to'], who: 'p' },
  { w: 'yapmak', t: 'acc', o: ['make'], en: ['make', 'makes', 'making'], who: 'p' },
  { w: 'açmak', t: 'acc', o: ['open'], en: ['open', 'opens', 'opening'], who: 'p' },
  { w: 'kapatmak', t: 'acc', o: ['open'], en: ['close', 'closes', 'closing'], who: 'p' },
  { w: 'beklemek', t: 'acc', o: ['person', 'animal'], en: ['wait for', 'waits for', 'waiting for'], who: 'a' },
  { w: 'aramak', t: 'acc', o: ['person', 'animal', 'thing', 'read', 'place'], en: ['look for', 'looks for', 'looking for'], who: 'a' },
  { w: 'gitmek', t: 'dat', o: ['place'], en: ['go', 'goes', 'going'], who: 'a', soft: 1, prep: 'to', from: 1 },
  { w: 'gelmek', t: 'dat', o: ['place'], en: ['come', 'comes', 'coming'], who: 'a', ir: 1, prep: 'to', from: 1 },
  { w: 'bakmak', t: 'dat', o: ['person', 'animal', 'thing', 'read'], en: ['look', 'looks', 'looking'], who: 'a', prep: 'at' },
  { w: 'korkmak', t: 'abl', o: ['animal', 'person'], en: ['afraid', 'afraid', 'afraid'], who: 'a', be: 1, st: 1, prep: 'of' },
  { w: 'uyumak', t: 'in', en: ['sleep', 'sleeps', 'sleeping'], who: 'a' },
  { w: 'oynamak', t: 'in', en: ['play', 'plays', 'playing'], who: 'a' },
  { w: 'çalışmak', t: 'in', en: ['work', 'works', 'working'], who: 'p' },
  { w: 'koşmak', t: 'in', en: ['run', 'runs', 'running'], who: 'a' },
  { w: 'yüzmek', t: 'in', en: ['swim', 'swims', 'swimming'], who: 'a' },
  { w: 'gülmek', t: 'in', en: ['laugh', 'laughs', 'laughing'], who: 'p' },
  { w: 'konuşmak', t: 'in', en: ['talk', 'talks', 'talking'], who: 'p' },
  { w: 'yaşamak', t: 'in', en: ['live', 'lives', 'living'], who: 'a', st: 1 },
  { w: 'oturmak', t: 'in', en: ['sit', 'sits', 'sitting'], who: 'a' }];
// [word, English, kind: time / freq / deg]
const TR_ADV = [['bugün', 'today', 'time'], ['yarın', 'tomorrow', 'time'], ['şimdi', 'now', 'time'], ['her gün', 'every day', 'time'], ['her zaman', 'always', 'freq'], ['sık sık', 'often', 'freq'],
  ['bazen', 'sometimes', 'freq'], ['çok', 'very / a lot', 'deg']];
// [word, English, kind]
const TR_DET = [['bir', 'a, one', 'num1'], ['iki', 'two', 'num'], ['üç', 'three', 'num'], ['bu', 'this', 'dem'], ['o', 'that', 'dem']];
const TR_CASE = { nom: '', acc: '-ı/-i/-u/-ü: the thing you act on', dat: '-a/-e: to', loc: '-da/-de: at, in', abl: '-dan/-den: from', gen: '-ın/-in: ’s' };
const TR_POSS = { '1s': 'my', '2s': 'your', '3s': 'his/her', '1p': 'our', '2p': 'your' };

/* ---------------- verb forms ---------------- */
const trStem = v => v.w.slice(0, -3);
const trSoftV = v => v.soft ? trSoft(trStem(v)) : trStem(v);
// -iyor: okuyorum, gidiyorsun, bekliyor; not: okumuyorum
function trProg(v, neg, per) {
  const st = trStem(v);
  let b;
  if (neg) b = st + 'm' + trI(st) + 'yor';
  else if (v.w === 'yemek') b = 'yiyor';
  else if (trEndV(st)) { const s2 = st.slice(0, -1); b = s2 + trI(s2) + 'yor'; }
  else b = trSoftV(v) + trI(st) + 'yor';
  return b + { '1s': 'um', '2s': 'sun', '3s': '', '1p': 'uz', '2p': 'sunuz', '3p': 'lar' }[per];
}
// the simple present: okurum, içersin, gelir, gider; not: okumam, içmezsin, gelmez, okumayız
function trAor(v, neg, per) {
  const st = trStem(v);
  if (neg) {
    const A = trA(st);
    if (per === '1s') return st + 'm' + A + 'm';
    if (per === '1p') return st + 'm' + A + 'y' + (A === 'a' ? 'ı' : 'i') + 'z';
    const b = st + 'm' + A + 'z';
    return b + { '2s': 's' + trI(b) + 'n', '3s': '', '2p': 's' + trI(b) + 'n' + trI(b) + 'z', '3p': 'l' + trA(b) + 'r' }[per];
  }
  const b = trEndV(st) ? st + 'r' : trSoftV(v) + (v.ir || trSyl(st) > 1 ? trI(st) : trA(st)) + 'r';
  const I = trI(b);
  return b + { '1s': I + 'm', '2s': 's' + I + 'n', '3s': '', '1p': I + 'z', '2p': 's' + I + 'n' + I + 'z', '3p': 'l' + trA(b) + 'r' }[per];
}
const trVerbW = (v, tense, neg, per) => tense === 'ao' ? trAor(v, neg, per) : trProg(v, neg, per);
// mı / mi / mu / mü after a word, with the person: musun, miyim
const trQW = (prev, per) => { const I = trI(prev), m = 'm' + I; return { '1s': m + 'y' + I + 'm', '2s': m + 's' + I + 'n', '3s': m, '1p': m + 'y' + I + 'z', '2p': m + 's' + I + 'n' + I + 'z', '3p': m }[per]; };

/* ---------------- chips ---------------- */
const trPerEn = { '1s': 'I', '2s': 'you', '3s': 'he/she', '1p': 'we', '2p': 'you (all)', '3p': 'they' };
const trPron = p => chip({ k: 'pron', w: p[0], per: p[1], en: p[2], gloss: `${p[2] === 'you' && p[1] === '2p' ? 'you (all, or polite)' : p[2]}` });
const trPronGen = p => chip({ k: 'pron', w: p[3], gen: true, per: p[1], en: TR_POSS[p[1]], gloss: `${TR_POSS[p[1]]} (${p[0]} + -im)` });
const trBu = () => chip({ k: 'pron', w: 'bu', per: '3s', en: 'this', bu: true, gloss: 'this (one)' });
function trNoun(n, o = {}) {
  const w = trNF(n, o), en = o.pl ? trPlEn(n) : n[2];
  const bits = [o.pl ? '-lar/-ler: more than one' : '', o.poss ? TR_POSS[o.poss] : '', TR_CASE[o.cs || 'nom']].filter(Boolean);
  return chip({ k: 'noun', w, e: n, cat: n[1], en, pl: !!o.pl, poss: o.poss || null, cs: o.cs || 'nom', gloss: en + (bits.length ? ' (' + bits.join(' · ') + ')' : '') });
}
// the noun as the end of “I am a …”: öğretmenim
const trNounPred = (n, per, pl) => { const base = pl ? trNF(n, { pl: true }) : n[0], w = per === '3s' ? base : trCopEnd(base, per, (n[3] || '').includes('s') && !pl);
  return chip({ k: 'noun', w, e: n, cat: n[1], en: pl ? trPlEn(n) : n[2], pl: !!pl, cs: 'nom', cop: per, gloss: `${per === '3s' ? '' : trPerEn[per] + ' am/are '}${pl ? trPlEn(n) : n[2]}` }); };
const trAdj = (a, per) => { const w = per && per !== '3s' ? trCopEnd(a[0], per, (a[3] || '').includes('s')) : a[0];
  return chip({ k: 'adj', w, e: a, en: a[1], cop: per || null, gloss: (per && per !== '3s' ? `${trPerEn[per]} am/are ` : '') + (a[4] || a[1]) }); };
const trVerb = (v, tense, neg, per) => { const w = trVerbW(v, tense, neg, per);
  return chip({ k: 'verb', w, e: v, tense, neg: !!neg, per, gloss: `${per === '3s' ? '' : trPerEn[per] + ' · '}${neg ? 'not ' : ''}${v.be ? 'be afraid' : v.en[0]} (${tense === 'ao' ? 'usually, in general' : 'now / these days'})` }); };
const trDeg = () => chip({ k: 'cop', c: 'degil', w: 'değil', per: '3s', gloss: 'not (after a noun or describing word)' });
const trDegil = per => chip({ k: 'cop', c: 'degil', w: trCopEnd('değil', per), per, gloss: `${per === '3s' ? '' : trPerEn[per] + ' '}not` });
const trEx = c => chip({ k: 'cop', c, w: c, gloss: c === 'var' ? 'there is / have' : 'there isn’t / don’t have' });
const trQ = (prev, per) => chip({ k: 'part', w: trQW(prev, per), per, gloss: `question word${per === '3s' || per === '3p' ? '' : ' (' + trPerEn[per] + ')'}` });
const trAdv = w => { const a = TR_ADV.find(x => x[0] === w); return chip({ k: 'adv', w, how: a[2], en: a[1], gloss: a[1] }); };
const trDet = (w, which) => { const d = TR_DET.find(x => x[0] === w && (!which || x[2] === which)); return chip({ k: 'det', w, how: d[2], en: d[1], gloss: d[1] }); };
// distractors that aren't real words: the wrong vowel (okule) or no softening (kitapı)
const trWrongNoun = (n, o) => {
  const right = trNF(n, o), harm = trFlip(() => trNF(n, o));
  if (harm !== right && Math.random() < 0.7) return chip({ k: 'noun', w: harm, e: n, cat: n[1], en: n[2], cs: o.cs, pl: !!o.pl, poss: o.poss || null, wrong: `Vowel harmony: the ending follows the last vowel of “${n[0]}” (${trLastV(n[0])}), so it is ${right}.`, gloss: n[2] });
  const ns = trNF(n, { ...o, nosoft: true });
  if (ns !== right) return chip({ k: 'noun', w: ns, e: n, cat: n[1], en: n[2], cs: o.cs, pl: !!o.pl, poss: o.poss || null, wrong: `“${n[0]}” softens before a vowel: ${n[0].slice(-1)} → ${trSoft(n[0]).slice(-1)}, so it is ${right}.`, gloss: n[2] });
  return null;
};
const trJoin = words => { const s = words.map(w => w.w).join(' '); return trCap(s) + (words.some(w => w.k === 'part') ? '?' : '.'); };

/* ---------------- English ---------------- */
const trPlEn = n => n[5] || (/(s|sh|ch|x)$/.test(n[2]) ? n[2] + 'es' : /[^aeiou]y$/.test(n[2]) ? n[2].slice(0, -1) + 'ies' : n[2] + 's');
const trMass = n => (n[3] || '').includes('M');
const trAn = x => (/^[aeiou]/i.test(x) ? 'an ' : 'a ') + x;
// how a noun phrase says itself in English; role: subj / bare / acc / dat / loc / abl / thing (after var) / pred
function trNpEn(ph, role, generic) {
  if (ph.pron) return ph.pron.en;
  const n = ph.n, e = n.e, adj = ph.mods.filter(m => m.k === 'adj').map(m => m.en).join(' '), det = ph.mods.find(m => m.k === 'det');
  const pl = n.pl || det && det.how === 'num';
  let word = (adj ? adj + ' ' : '') + (pl ? trPlEn(e) : e[2]);
  const plain = !det && !ph.owner && !n.poss && !adj;
  if (e[0] === 'ev' && plain && !n.pl && /^(dat|loc|abl)$/.test(role)) return 'home';
  if ((e[3] || '').includes('B') && plain && !n.pl && /^(dat|loc|abl)$/.test(role)) return word;   // to school, at school
  let own = ph.owner ? (ph.owner.pron ? ph.owner.pron.en : trNpEn(ph.owner.np, 'own') + '\'s') : n.poss ? TR_POSS[n.poss] : '';
  if (own) return own + ' ' + word;
  if (det) { if (det.how === 'num1') return trMass(e) && !adj ? word : trAn(word); if (det.how === 'num') return det.en + ' ' + word; return (det.w === 'bu' ? (pl ? 'these' : 'this') : (pl ? 'those' : 'that')) + ' ' + word; }
  if (role === 'bare' || role === 'thing' || role === 'pred') { if (trMass(e) || pl) return word; return generic ? (e[1] === 'watch' && e[0] === 'televizyon' ? word : trPlEn(e).replace(/^/, adj ? adj + ' ' : '')) : trAn(word); }
  if (generic && !pl && !trMass(e)) return (adj ? adj + ' ' : '') + trPlEn(e);
  return (e[0] === 'televizyon' ? '' : 'the ') + word;
}
const trBe = (s, P) => P === '1s' ? 'am' : P === '3s' ? 'is' : 'are';
const trNeg = x => ({ am: 'am not', is: "isn't", are: "aren't", does: "doesn't", do: "don't", will: "won't" })[x];
function trEnglish(C) {
  const P0 = C.per, sp = C.subj && !C.subj.pron && (C.subj.n.pl || C.subj.mods.some(m => m.how === 'num')), P = sp ? '3p' : C.subj?.pron && !C.subj.pron.bu ? C.subj.pron.per : P0, s0 = C.subj ? trNpEn(C.subj, 'subj') : { '1s': 'I', '2s': 'you', '3s': 'he/she', '1p': 'we', '2p': 'you', '3p': 'they' }[P];
  const s = s0 === 'this' && C.kind !== 'nom' ? 'this' : s0;
  const q = !!C.q, neg = C.kind === 'verb' ? !!C.verb.neg : !!C.neg;
  const time = C.time ? C.time.en : '', freq = C.freq ? C.freq.en : '';
  const loc = ph => { const w = trNpEn(ph, 'loc'); return w === 'home' ? 'at home' : (ph.n.e[4] || (ph.n.e[1] === 'place' ? 'at' : 'on')) + ' ' + w; };
  const third = P === '3s';
  let out;
  const asQ = (aux, rest) => `${neg ? trNeg(aux) : aux} ${s}${rest}`;
  if (C.kind === 'nom') {
    const be = trBe(s, P), deg = C.deg ? 'very ' : '';
    let pred;
    if (C.adj) pred = deg + C.adj.en;
    else { const ph = C.pred, w = trNpEn(ph, 'pred'); pred = P === '3p' || P === '1p' || P === '2p' ? (ph.owner || ph.n.poss ? w : trNpEn({ ...ph, mods: ph.mods.filter(m => m.how !== 'num1'), n: { ...ph.n, pl: true } }, 'pred')) : w; }
    const where = C.loc ? ' ' + loc(C.loc) : '';
    out = q ? asQ(be, ` ${pred}${where}`) : `${s} ${neg ? trNeg(be) : be}${freq ? ' ' + freq : ''} ${pred}${where}`;
  } else if (C.kind === 'ex') {
    const th = C.thing, yok = C.c === 'yok', thPl = th.n.pl || th.mods.some(m => m.how === 'num');
    if (C.have) {
      const who = C.haveWho, w3 = who.third, tw = trNpEn({ ...th, owner: null, n: { ...th.n, poss: null } }, 'thing');
      const any = trMass(th.n.e) && !th.mods.length ? (yok ? 'any ' : '') + tw : tw;
      const aux = w3 ? 'does' : 'do';
      out = q ? `${yok ? trNeg(aux) : aux.replace(/^./, c => c)} ${who.en} have ${any}` : yok ? `${who.en} ${trNeg(aux)} have ${any}` : `${who.en} ${w3 ? 'has' : 'have'} ${tw}`;
      if (C.loc) out += ' ' + loc(C.loc);
    } else {
      const tw = trNpEn(th, 'thing'), be = thPl ? 'are' : 'is', where = C.loc ? ' ' + loc(C.loc) : '';
      if (yok) { const nw = tw.replace(/^an? /, ''); out = q ? `${trNeg(be)} there ${thPl || trMass(th.n.e) ? 'any ' : 'a '}${nw.replace(/^a /, '')}${where}` : `There ${be} no ${nw}${where}`; }
      else out = q ? `${be} there ${tw}${where}` : `There ${be} ${tw}${where}`;
    }
  } else {
    const v = C.verb.e, r = C.roles, gen = C.verb.tense === 'ao' && (!time || C.time.w === 'her gün');
    const will = C.verb.tense === 'ao' && C.time?.w === 'yarın';
    const simple = !v.be && (C.verb.tense === 'ao' || v.st || freq || C.time?.w === 'her gün');
    let vp;
    if (v.be) { const be = trBe(s, P); vp = q ? asQ(be, `${freq ? ' ' + freq : ''} afraid`) : `${s} ${neg ? trNeg(be) : be}${freq ? ' ' + freq : ''} afraid`; }
    else if (will) vp = q ? asQ('will', ' ' + v.en[0]) : `${s} ${neg ? "won't" : 'will'} ${v.en[0]}`;
    else if (simple) { const aux = third ? 'does' : 'do'; vp = q ? asQ(aux, `${freq ? ' ' + freq : ''} ${v.en[0]}`) : neg ? `${s} ${trNeg(aux)}${freq ? ' ' + freq : ''} ${v.en[0]}` : `${s}${freq ? ' ' + freq : ''} ${third ? v.en[1] : v.en[0]}`; }
    else { const be = trBe(s, P); vp = q ? asQ(be, ' ' + v.en[2]) : `${s} ${neg ? trNeg(be) : be} ${v.en[2]}`; }
    out = vp;
    if (r.obj) out += ' ' + trNpEn(r.obj, r.obj.n.cs === 'acc' ? 'acc' : 'bare', r.obj.n.cs !== 'acc' && gen);
    if (r.dat) { const w = trNpEn(r.dat, 'dat'); out += w === 'home' && v.prep === 'to' ? ' home' : ' ' + v.prep + ' ' + w; }
    if (r.abl) out += ' ' + (v.from ? 'from' : v.prep) + ' ' + trNpEn(r.abl, 'abl', !v.from);
    if (r.loc) out += ' ' + loc(r.loc);
    if (C.lot) out += ' a lot';
  }
  if (time) out += ' ' + time;
  out = out.replace(/\s+/g, ' ').trim();
  out = out[0].toUpperCase() + out.slice(1);
  return out.replace(/^He\/she /, 'He/she ') + (q ? '?' : '.');
}

/* ---------------- the checker ---------------- */
const trFits = (cats, n) => cats.includes('*') || cats.includes(n.cat) || cats.includes('make') && (n.e[3] || '').includes('m') || cats.includes('open') && (n.e[3] || '').includes('o');
const trAdjFits = (a, cat) => a.e[2].includes({ person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', read: 't', watch: 't', hear: 't', place: 'l' }[cat] || 't');
const trPhW = ph => ph.chips.map(c => c.w).join(' ');
function trCheck(T) {
  const err = (msg, at) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length });
  if (!T.length) return err('Tap some words to build a sentence.', 0);
  for (let k = 0; k < T.length; k++) if (T[k].wrong) return err(T[k].wrong, k);
  // the end: (verb | var/yok | noun/describing word) (değil) (mı)
  let end = T.length, q = null, neg = null;
  if (T[end - 1].k === 'part') { q = T[end - 1]; end--; }
  for (let k = 0; k < end; k++) if (T[k].k === 'part') return err(`“${T[k].w}” (the question word) goes at the very end here, after the verb: “okuyor musun?”`, k);
  if (end && T[end - 1].c === 'degil') { neg = T[end - 1]; end--; }
  for (let k = 0; k < end; k++) if (T[k].c === 'degil') return err('“değil” (not) goes at the end, after the describing word or noun: “yorgun değilim”.', k);
  if (!end) return err('Put a noun or a describing word before it: “yorgun değilim”, “öğretmen misin?”', 0);
  const head = T[end - 1];
  for (let k = 0; k < end - 1; k++) {
    if (T[k].k === 'verb') return err(`In Turkish the verb goes at the end: move “${T[k].w}” to the end.`, k);
    if (T[k].k === 'cop' && T[k].c !== 'degil') return err(`“${T[k].w}” goes at the end of the sentence: “Evde bir kedi ${T[k].w}.”`, k);
  }
  const kind = head.k === 'verb' ? 'verb' : head.k === 'cop' ? 'ex' : head.k === 'adj' || head.k === 'noun' ? 'nom' : null;
  if (!kind || head.k === 'noun' && head.cs !== 'nom' || head.k === 'noun' && (q || neg) && head.cop && head.cop !== '3s') {
    if (head.k === 'noun' && head.cs !== 'nom') return err('A Turkish sentence ends with the verb (or var / yok). Add a verb at the end.', end);
    if (head.k === 'noun') return err(`With ${neg ? 'değil' : 'the question word'}, the person ending goes on “${neg ? 'değil' : 'mı'}”: “öğretmen ${neg ? 'değilim' : 'misin'}”.`, end - 1);
    return err('A Turkish sentence ends with the verb (or var / yok, or a describing word).', end - 1);
  }
  if (q) { const right = trQW(neg ? neg.w : head.w, q.per); if (trI(right) !== trI(q.w)) return err(`The question word follows the last vowel of the word before it: “${neg ? neg.w : head.w} ${right}”.`, T.length - 1); }
  // the parts before the end
  let i = 0;
  const lim = kind === 'nom' ? end : end - 1, phs = [];
  const peek = (o = 0) => i + o < lim ? T[i + o] : null;
  function NP() {
    const start = i, mods = [];
    let owner = null;
    for (;;) {
      const t = peek();
      if (!t) break;
      if (t.k === 'adv' && t.how === 'deg') { if (peek(1)?.k !== 'adj') break; mods.push(t); i++; continue; }
      if (t.k === 'det' || t.k === 'adj') { mods.push(t); i++; continue; }
      break;
    }
    const t = peek();
    if (!t || t.k !== 'noun' && t.k !== 'pron') {
      const last = mods.at(-1);
      if (last && last.k === 'adj' && kind === 'nom' && i === lim) return { adjPred: last, deg: mods.includes(mods.find(m => m.how === 'deg')), mods, start, chips: T.slice(start, i) };
      if (last && last.k === 'adj') return err(`A describing word goes right before its noun: “${last.w} ev”.${kind === 'nom' ? '' : ' To say “is …”, put it at the end.'}`, i - 1);
      if (last) return err(`“${last.w}” goes right before a noun: “${last.w} kedi”.`, i - 1);
      return null;
    }
    i++;
    if (t.k === 'pron') {
      if (mods.length) return err(`A describing word can’t go before “${t.w}”. Use a noun: “büyük ev”.`, start);
      if (t.gen) {
        const o = NP(); if (o?.ok === false) return o;
        if (!o || !o.n) return err(`“${t.w}” means ${t.en}: put the thing it owns right after it, with its ending: “${t.w} ${trNF(TR_NOUN.find(n => n[0] === 'kitap'), { poss: t.per })}”.`, i - 1);
        if (o.owner) return err('One owner is enough.', start);
        if (o.n.poss !== t.per) return err(`After “${t.w}” the thing owned ends in ${t.per === '3s' ? '-ı/-i/-u/-ü (-sı after a vowel)' : t.per === '1s' ? '-ım/-im/-um/-üm' : t.per === '2s' ? '-ın/-in/-un/-ün' : t.per === '1p' ? '-ımız/-imiz' : '-ınız/-iniz'}: “${t.w} ${trNF(o.n.e, { poss: t.per, cs: o.n.cs, pl: o.n.pl })}”.`, o.start);
        return { ...o, owner: { pron: t }, start, chips: T.slice(start, i) };
      }
      return { pron: t, mods: [], start, chips: T.slice(start, i) };
    }
    const n = t;
    if (n.cs === 'gen') {
      const o = NP(); if (o?.ok === false) return o;
      if (!o || !o.n) return err(`“${n.w}” means “the ${n.en}’s”: put the thing it owns right after it, ending in -ı/-i (-sı after a vowel): “${n.w} ${trNF(TR_NOUN.find(x => x[0] === 'kedi'), { poss: '3s' })}”.`, i - 1);
      if (o.owner) return err('One owner is enough.', start);
      if (o.n.poss !== '3s') return err(`After “${n.w}” (’s), the thing owned ends in -ı/-i/-u/-ü (-sı after a vowel): “${n.w} ${trNF(o.n.e, { poss: '3s', cs: o.n.cs, pl: o.n.pl })}”.`, o.start);
      const own = { n, mods, owner: null, start, chips: T.slice(start, o.start) };
      const bad = trMods(own); if (bad) return bad;
      return { ...o, owner: { np: own }, start, chips: T.slice(start, i) };
    }
    const ph = { n, mods, owner: null, start, chips: T.slice(start, i) };
    const bad = trMods(ph); if (bad) return bad;
    return ph;
  }
  function trMods(ph) {
    const dets = ph.mods.filter(m => m.k === 'det'), n = ph.n;
    if (dets.length > 1) return err(`One of “${dets.map(d => d.w).join('” / “')}” is enough.`, ph.start);
    const d = dets[0];
    if (d && d.how === 'num' && n.pl) return err(`After a number, Turkish doesn’t use the plural: “${d.w} ${n.e[0]}”, not “${d.w} ${n.w}”.`, ph.start + ph.mods.length);
    if (d && d.how === 'num1' && n.pl) return err(`“bir” means “a, one”: it doesn’t go with a plural (${n.w}).`, ph.start);
    if (d && d.how === 'num1' && n.cs === 'acc') return err(`“bir ${n.e[0]}” (a ${n.e[2]}) has no -ı ending: “bir ${n.e[0]} okuyorum”. With -ı it is “the”: “${n.w}” without bir.`, ph.start);
    if (d && d.how === 'dem' && ph.mods.indexOf(d) > 0) return err(`“${d.w}” (this/that) goes first: “${d.w} ${ph.mods.filter(m => m !== d).map(m => m.w).join(' ')} ${n.w}”.`, ph.start);
    if (d && d.how === 'num' && ph.mods.indexOf(d) > 0) return err(`The number goes first: “${d.w} ${ph.mods.filter(m => m !== d).map(m => m.w).join(' ')} ${n.w}”.`, ph.start);
    for (const m of ph.mods) if (m.k === 'adj') {
      if (m.cop && m.cop !== '3s') return err(`“${m.w}” means “${trPerEn[m.cop]} am/are ${m.en}”. Before a noun, use “${m.e[0]}”.`, ph.chips.indexOf(m) + ph.start);
      if (!trAdjFits(m, n.cat)) return err(`That doesn’t make sense: a ${n.en} can’t be ${m.en}.`, ph.chips.indexOf(m) + ph.start);
    }
    if (n.cop && n.cop !== '3s' && (kind !== 'nom' || ph.n !== head)) return err(`“${n.w}” means “${trPerEn[n.cop]} am/are ${n.en}”. Here use “${n.e[0]}” with its ending.`, ph.start + ph.mods.length);
    return null;
  }
  const time = [], freq = [];
  let lot = null;
  while (i < lim) {
    const t = peek();
    if (t.k === 'adv' && t.how !== 'deg') { (t.how === 'time' ? time : freq).push(t); i++; continue; }
    if (t.k === 'adv' && t.how === 'deg' && peek(1)?.k !== 'adj') { if (kind === 'verb' && i === lim - 1) { lot = t; i++; continue; } return err(kind === 'verb' ? '“çok” (a lot) goes right before the verb: “çok çalışıyorum”. Before a describing word it means “very”.' : '“çok” (very) goes right before a describing word: “çok yorgun”.', i); }
    const ph = NP();
    if (ph?.ok === false) return ph;
    if (!ph) return err(`“${t.w}” doesn’t fit here.`, i);
    phs.push(ph);
  }
  if (time.length > 1) return err('One time word is enough.', T.indexOf(time[1]));
  if (freq.length > 1) return err('One word for how often is enough.', T.indexOf(freq[1]));
  if (time[0] && freq[0] && time[0].w === 'şimdi') return err('“şimdi” (now) and a word for how often don’t go together.', T.indexOf(freq[0]));
  const C = { kind, q, neg, time: time[0] || null, freq: freq[0] || null, lot };
  const subjOf = ph => ph.pron ? ph.pron.per : ph.n.pl ? '3p' : '3s';
  const agree = (sPer, vPer) => sPer === vPer || sPer === '3p' && vPer === '3s' && true;
  const isAnim = ph => ph.pron ? !ph.pron.bu : ['person', 'animal'].includes(ph.n.cat);
  const firstOf = (list, cs) => list.filter(p => !p.adjPred && (p.pron ? cs === 'nom' : p.n.cs === cs));
  for (const ph of phs) if (ph.pron?.gen) return err(`“${ph.pron.w}” means ${ph.pron.en}: the thing owned comes right after it.`, ph.start);

  if (kind === 'verb') {
    const v = head, e = v.e;
    if (neg) return err(`For verbs, “not” goes inside the verb: “${trVerbW(e, v.tense, true, v.per)}”. değil is for nouns and describing words.`, T.indexOf(neg));
    if (lot && e.be) return err('“çok” doesn’t go with korkmak here.', T.indexOf(lot));
    if (C.time?.w === 'şimdi' && v.tense === 'ao') return err(`“şimdi” (now) goes with the -iyor form: “${trProg(e, v.neg, v.per)}”.`, end - 1);
    if (C.freq && v.tense === 'pr' && C.time && C.time.w !== 'her gün') return err('Use one of them: a time word or a word for how often.', T.indexOf(C.time));
    const noms = firstOf(phs, 'nom');
    const roles = { obj: null, dat: null, loc: null, abl: null };
    let subj = null;
    const last = phs.at(-1), lastEnd = last ? last.start + last.chips.length : -1;
    for (const ph of noms) {
      const right = ph === last && lastEnd === end - 1;
      if (!ph.pron && e.t === 'acc' && right && (noms.length > 1 || !isAnim(ph))) {
        if (ph.n.pl) return err(`More than one thing you act on takes -ı: “${trNF(ph.n.e, { pl: true, cs: 'acc' })}”.`, ph.start);
        if (ph.owner || ph.n.poss || ph.mods.some(m => m.how === 'dem')) return err(`This is one definite thing, so it takes -ı: “${trPhW({ chips: ph.chips.slice(0, -1) })}${ph.chips.length > 1 ? ' ' : ''}${trNF(ph.n.e, { poss: ph.n.poss, cs: 'acc' })}”.`, ph.start + ph.chips.length - 1);
        if (['person', 'animal'].includes(ph.n.cat)) return err(`A person or animal you act on takes -ı: “${trNF(ph.n.e, { cs: 'acc' })}”.`, ph.start + ph.chips.length - 1);
        roles.obj = ph; continue;
      }
      if (subj) {
        if (e.t === 'acc' && !ph.pron) return err(`A thing with no ending goes right before the verb: “… ${trPhW(ph)} ${v.w}”. Or give it -ı (the …): “${trNF(ph.n.e, { cs: 'acc' })}”.`, ph.start);
        return err('Only one who-does-it, please.', ph.start);
      }
      subj = ph;
    }
    if (subj && !subj.pron && e.t === 'acc' && !roles.obj && noms.length === 1 && subj === last && lastEnd === end - 1 && !trFits(e.o, subj.n) && !['person', 'animal'].includes(subj.n.cat))
      return err(`That doesn’t make sense: you can’t ${e.en[0]} a ${subj.n.en}.`, subj.start);
    for (const cs of ['acc', 'dat', 'loc', 'abl']) {
      const l = firstOf(phs, cs);
      if (l.length > 1) return err(`One “${TR_CASE[cs].split(':')[0]}” word is enough here.`, l[1].start);
      if (!l.length) continue;
      const ph = l[0];
      if (cs === 'acc') {
        if (e.t !== 'acc') return err(e.t === 'dat' ? `“${e.w}” takes -a/-e: “${trNF(ph.n.e, { cs: 'dat', poss: ph.n.poss, pl: ph.n.pl })}”.` : e.t === 'abl' ? `“korkmak” (to be afraid) takes -dan/-den: “${trNF(ph.n.e, { cs: 'abl', poss: ph.n.poss, pl: ph.n.pl })}”.` : `“${e.w}” (to ${e.en[0]}) doesn’t take a thing with -ı.`, ph.start);
        if (roles.obj) return err('One thing you act on is enough.', ph.start);
        roles.obj = ph;
      }
      if (cs === 'dat') {
        if (e.t !== 'dat') return err(e.t === 'acc' ? `“${e.w}” takes the thing with -ı, or no ending: “${trNF(ph.n.e, { cs: 'acc', poss: ph.n.poss, pl: ph.n.pl })}”.` : e.t === 'abl' ? `“korkmak” takes -dan/-den: “${trNF(ph.n.e, { cs: 'abl' })}”.` : `-a/-e means “to” a place you go: it doesn’t go with “${e.w}”. For where it happens use -da/-de: “${trNF(ph.n.e, { cs: 'loc' })}”.`, ph.start);
        roles.dat = ph;
      }
      if (cs === 'loc') {
        if (e.t === 'dat' && e.prep === 'to') return err(`Where you go takes -a/-e: “${trNF(ph.n.e, { cs: 'dat', poss: ph.n.poss, pl: ph.n.pl })}”, not “${ph.n.w}”.`, ph.start);
        if (ph.n.cat !== 'place') return err(`-da/-de here is the place where it happens: “parkta”. A ${ph.n.en} isn’t a place.`, ph.start);
        roles.loc = ph;
      }
      if (cs === 'abl') {
        if (!(e.t === 'abl' || e.from)) return err(`-dan/-den means “from”: it doesn’t go with “${e.w}”. For where it happens use -da/-de: “${trNF(ph.n.e, { cs: 'loc' })}”.`, ph.start);
        roles.abl = ph;
      }
    }
    const fit = (ph, what) => { if (!trFits(e.o, ph.n)) return err(`That doesn’t make sense: you can’t ${e.be ? 'be afraid of' : e.en[0]} ${what} ${ph.n.en}.`, ph.start); return null; };
    if (roles.obj) { const f = fit(roles.obj, 'a'); if (f) return f; }
    if (roles.dat) { const f = fit(roles.dat, e.prep === 'to' ? 'to a' : 'a'); if (f) return f; }
    if (roles.abl && e.t === 'abl') { const f = fit(roles.abl, 'a'); if (f) return f; }
    if (roles.abl && e.from) { if (roles.abl.n.cat !== 'place') return err(`-dan/-den here is the place you come from: “okuldan”. A ${roles.abl.n.en} isn’t a place.`, roles.abl.start); if (roles.dat && roles.dat.n.e[0] === roles.abl.n.e[0]) return err('From a place to the same place? Pick two different places.', roles.abl.start); }
    if (roles.loc && roles.obj && roles.loc.n.e === roles.obj.n.e) return err('Pick a different place.', roles.loc.start);
    // who does it
    let per = v.per;
    if (q) {
      if (v.per !== '3s' && v.per !== '3p') return err(`In a question the person ending goes on the question word: “${trVerbW(e, v.tense, v.neg, '3s')} ${trQW(trVerbW(e, v.tense, v.neg, '3s'), v.per)}”.`, end - 1);
      if (v.per === '3p' && q.per !== '3p' && q.per !== '3s') return err(`“${v.w}” already says “they”: the question word is just “${trQW(v.w, '3s')}”.`, T.length - 1);
      per = v.per === '3p' ? '3p' : q.per;
    }
    if (subj) {
      const sp = subjOf(subj);
      if (subj.pron?.bu) return err('“bu” (this) is for things: use it in “Bu bir kitap.”', subj.start);
      if (!agree(sp, per)) return err(`With “${trPhW(subj)}” the verb is “${trVerbW(e, v.tense, v.neg, sp === '3p' && !subj.pron ? '3s' : sp)}${q ? ' ' + trQW(trVerbW(e, v.tense, v.neg, sp === '3p' ? '3p' : '3s'), sp === '3p' ? '3s' : sp) : ''}”.`, q && v.per === '3s' ? T.length - 1 : end - 1);
      if (!subj.pron && e.who === 'p' && subj.n.cat !== 'person') return err(`Only people ${e.en[0]}: a ${subj.n.en} can’t.`, subj.start);
      if (!subj.pron && e.who === 'a' && !isAnim(subj)) return err(`A ${subj.n.en} can’t ${e.be ? 'be afraid' : e.en[0]}. Pick a person or an animal.`, subj.start);
    }
    if (roles.obj && subj && !subj.pron && roles.obj.n.e === subj.n.e) return err('Pick someone or something else for one of them.', roles.obj.start);
    Object.assign(C, { verb: v, subj, roles, per });
    return { ok: true, P: C };
  }
  if (kind === 'ex') {
    if (neg) return err(`“${head.w}” already says it: use “yok” for “there isn’t”, without değil.`, T.indexOf(neg));
    const noms = firstOf(phs, 'nom'), locs = firstOf(phs, 'loc');
    for (const ph of phs) if (!ph.pron && !['nom', 'loc'].includes(ph.n.cs)) return err(`With var / yok, use the place with -da/-de (“evde”) and the thing with no ending (“bir kedi”).`, ph.start);
    if (locs.length > 1) return err('One place is enough.', locs[1].start);
    const prons = noms.filter(p => p.pron), things = noms.filter(p => !p.pron);
    if (prons.length) return err(`For “I have”, the thing takes -im and the owner is benim: “(Benim) bir ${trNF(TR_NOUN.find(n => n[0] === 'kedi'), { poss: '1s' })} var.” For “there is”, use a place: “Evde bir kedi var.”`, prons[0].start);
    if (!things.length) return err(`Say what there is: “Evde bir kedi ${head.w}.”`, end - 1);
    if (things.length > 1) return err(`Say one thing that there ${head.w === 'var' ? 'is' : 'isn’t'}, right before “${head.w}”.`, things[0].start);
    const th = things[0];
    if (th !== phs.at(-1)) return err(`The thing goes right before “${head.w}”: “… ${trPhW(th)} ${head.w}”.`, th.start);
    if (head.c === 'yok' && th.mods.some(m => m.how === 'num1')) return err(`With yok, leave out “bir”: “${th.chips.filter(c => c.w !== 'bir').map(c => c.w).join(' ')} yok”.`, th.start + th.chips.findIndex(c => c.w === 'bir'));
    if (th.mods.some(m => m.how === 'dem')) return err(`“${th.mods.find(m => m.how === 'dem').w} ${th.n.w}” is one definite thing: say where it is instead (“Kedi evde.”), or leave out “${th.mods.find(m => m.how === 'dem').w}”.`, th.start);
    if (locs[0] && th.n.e === locs[0].n.e) return err('Pick a different place.', locs[0].start);
    if (locs[0] && !['place', 'thing'].includes(locs[0].n.cat)) return err(`A ${locs[0].n.en} isn’t a place to put things: try “evde” or “masada”.`, locs[0].start);
    if (locs[0] && locs[0].n.cat === 'thing' && !/^(masa|çanta|araba)$/.test(locs[0].n.e[0])) return err(`Things go on a table or in a bag or car here: “masada”, “çantada”. Try a place.`, locs[0].start);
    if (head.c === 'var' && !th.n.poss && !th.owner && !locs[0] && !th.mods.length) return err(`Say where: “Evde ${th.n.w} var.” Or who has it: “Bir ${trNF(th.n.e, { poss: '1s' })} var.”`, th.start);
    C.c = head.c; C.thing = th; C.loc = locs[0] || null;
    if (th.n.poss || th.owner) {
      C.have = true;
      if (th.owner?.np) C.haveWho = { en: trNpEn(th.owner.np, 'subj'), third: !th.owner.np.n.pl };
      else { const P = th.n.poss; C.haveWho = { en: { '1s': 'I', '2s': 'you', '3s': 'he/she', '1p': 'we', '2p': 'you' }[P], third: P === '3s' }; }
      if (th.owner?.np && th.owner.np.n.cat !== 'person' && th.owner.np.n.cat !== 'animal') return err(`A ${th.owner.np.n.en} can’t have things here: use a person.`, th.start);
      if (['person'].includes(th.n.cat) && !/F/.test(th.n.e[3] || '') && th.n.e[0] !== 'arkadaş') return err(`Try a family word or a friend for “I have …”: “Bir kardeşim var.”`, th.start);
    }
    C.per = '3s';
    if (q && q.per !== '3s') return err(`After var / yok the question word is just “${trQW(head.w, '3s')}”.`, T.length - 1);
    return { ok: true, P: C };
  }
  // a noun or describing word at the end: Ben öğretmenim. Ev büyük. Bu bir kitap.
  const predPh = phs.at(-1);
  if (!predPh) return err('Say who or what: “Ev büyük.”', 0);
  const rest = phs.slice(0, -1);
  for (const ph of rest) if (!ph.pron && !['nom', 'loc'].includes(ph.n.cs)) return err(`This sentence needs a verb for “${ph.n.w}”: “${ph.n.w} …”. Or use the plain word.`, ph.start);
  const subs = rest.filter(p => p.pron || p.n.cs === 'nom'), locs = rest.filter(p => !p.pron && p.n.cs === 'loc');
  if (subs.length > 1) return err('Only one who-or-what, please.', subs[1].start);
  if (locs.length > 1) return err('One place is enough.', locs[1].start);
  const subj = subs[0] || null;
  let per = q ? q.per : neg ? neg.per : head.cop || '3s';
  if ((q || neg) && head.cop && head.cop !== '3s') return err(`With ${neg ? 'değil' : 'the question word'} the person ending moves onto “${neg ? 'değil' : 'mı'}”: “${head.e[0]} ${neg ? trCopEnd('değil', head.cop) : trQW(head.e[0], head.cop)}”.`, end - 1);
  if (q && neg && neg.per !== '3s') return err(`With the question word, the person ending goes on it: “değil ${trQW('değil', neg.per)}”.`, T.indexOf(neg));
  if (q && neg) per = q.per;
  if (!subj && per === '3s' && !locs.length) return err(`Say who or what: “Ev ${trPhW(predPh)}.”`, 0);
  if (!subj && per === '3s') return err(`Say who or what: “Kedi ${locs[0].n.w} ${head.w}.”`, 0);
  if (predPh.adjPred) {
    const a = predPh.adjPred, cat = subj ? (subj.pron ? (subj.pron.bu ? 'thing' : 'person') : subj.n.cat) : 'person';
    if (!trAdjFits(a, cat)) return err(`That doesn’t make sense: ${subj ? (subj.pron ? subj.pron.en : 'a ' + subj.n.en) : 'you'} can’t be ${a.en}.`, T.indexOf(a));
    C.adj = a; C.deg = predPh.deg;
  } else {
    if (predPh.pron) return err('End the sentence with a noun, a describing word or a verb.', predPh.start);
    if (predPh.n !== head) return err('End the sentence with a noun, a describing word or a verb.', end - 1);
    const pn = predPh.n;
    if (subj && !subj.pron && !subj.mods.some(m => m.how === 'dem') && !predPh.owner && !pn.poss && pn.cat !== 'person') return err(`This sounds like “the ${subj.n.en} ${pn.en}”: put a verb or a describing word at the end, or start with “Bu”: “Bu bir ${pn.e[0]}.”`, end - 1);
    if (subj && (subj.pron && !subj.pron.bu || !subj.pron && ['person', 'animal'].includes(subj.n.cat)) && pn.cat !== 'person') return err(`That doesn’t make sense: ${subj.pron ? subj.pron.en : 'a ' + subj.n.en} can’t be a ${pn.en}.`, end - 1);
    if (pn.pl && per !== '3p') return err(`“${pn.w}” is plural: here use “${trCopEnd(pn.e[0], per, (pn.e[3] || '').includes('s'))}”.`, end - 1);
    if (predPh.mods.some(m => m.how === 'num1') && (per !== '3s' && per !== '1s' && per !== '2s')) return err('“bir” means “a, one”: leave it out for more than one person.', predPh.start);
    if (predPh.mods.some(m => m.how === 'dem')) return err(`For “this is …” start with “Bu”: “Bu ${pn.w}.”`, predPh.start);
    if (pn.e[1] !== 'person' && !subj?.pron?.bu && !(subj && !subj.pron && subj.mods.some(m => m.how === 'dem'))) return err(`Start with “Bu” (this): “Bu bir ${pn.e[0]}.”`, 0);
    C.pred = predPh;
  }
  if (subj) {
    const sp = subjOf(subj);
    if (!agree(sp, per) && !(sp === '3p' && per === '3p')) return err(`With “${trPhW(subj)}” it is “${predPh.adjPred ? '' : ''}${neg ? 'değil' + (sp === '3s' ? '' : trCopEnd('değil', sp).slice(5)) : q ? trQW(head.w, sp) : trCopEnd(head.e[0], sp, (head.e[3] || '').includes('s'))}”.`, q ? T.length - 1 : neg ? T.indexOf(neg) : end - 1);
  }
  if (locs[0] && locs[0].n.cat !== 'place') return err(`-da/-de here is a place: “evde”, “parkta”.`, locs[0].start);
  C.subj = subj; C.per = per; C.loc = locs[0] || null;
  return { ok: true, P: C };
}

/* ---------------- making a tray ---------------- */
// where each kind of thing usually happens (for the trays only; the checker takes any place)
const TR_AT = { yüzmek: 'deniz', koşmak: 'park bahçe plaj', oynamak: 'park bahçe oda ev plaj', uyumak: 'ev oda', çalışmak: 'ofis ev okul kütüphane hastane', yaşamak: 'ev',
  oturmak: 'park bahçe oda mutfak', gülmek: 'ev okul park', konuşmak: 'ev okul park ofis', okumak: 'kütüphane ev okul oda park bahçe', yazmak: 'ev okul oda ofis', yemek: 'mutfak ev okul park',
  içmek: 'mutfak ev bahçe ofis', yapmak: 'mutfak ev', izlemek: 'ev oda sinema', dinlemek: 'ev oda', almak: 'market', aramak: 'ev oda okul park' };
// verbs that sound natural with a thing that has no ending (kitap okuyorum, çay içiyorum)
const TR_BARE = /^(okumak|yazmak|yemek|içmek|almak|izlemek|dinlemek|yapmak|aramak)$/;
function trGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = list => { const fav = list.filter(x => pref.has(x[0] || x.w)); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const nounOf = cats => RP(TR_NOUN.filter(n => trFits(cats, { cat: n[1], e: n })));
  const extra = [];
  const wrong = (n, o) => { if (coin(0.18)) { const w = trWrongNoun(n, o); if (w) extra.push(w); } };
  const adjFor = n => RP(TR_ADJ.filter(a => a[2].includes({ person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', read: 't', watch: 't', hear: 't', place: 'l' }[n[1]])));
  // a noun phrase; o: { cs, pl, owner, adj, det }
  const np = (n, out, o = {}) => {
    const f = { cs: o.cs || 'nom' };
    if (o.pl) f.pl = true;
    const fam = (n[3] || '').includes('F');
    if (fam && o.owner == null) o.owner = R([0, 1, 3]);   // annem, babam: family words come with an owner
    if (fam) o.adj = false;
    if (o.det === 'bir' && trMass(n)) o.det = null;
    if (o.owner != null && o.owner !== false) {
      if (o.owner === 'noun') { const on = RP(TR_NOUN.filter(x => x[1] === 'person' && !(x[3] || '').includes('F'))); if (on[0] !== n[0]) { out.push(trNoun(on, { cs: 'gen' })); extra.push(trNoun(on)); f.poss = '3s'; } }
      else { const p = TR_PRON[o.owner]; if (coin(0.6)) out.push(trPronGen(p)); f.poss = p[1]; }
    }
    if (o.det) { out.push(trDet(o.det, o.det === 'o' ? 'dem' : undefined)); }
    if (o.adj) { const a = adjFor(n); if (a) out.push(trAdj(a)); }
    if (o.det === 'bir' && o.adj && coin(0.6)) { const d = out.length - 2; [out[d], out[d + 1]] = [out[d + 1], out[d]]; }   // büyük bir ev
    out.push(trNoun(n, f));
    const others = ['nom', 'acc', 'dat', 'loc', 'abl'].filter(c => c !== f.cs);
    extra.push(trNoun(n, { ...f, cs: R(o.alt || others) }));
    wrong(n, f);
    return f;
  };
  for (let tries = 0; tries < 200; tries++) {
    extra.length = 0;
    const out = [], kind = R(['acc', 'acc', 'acc', 'acc', 'go', 'go', 'in', 'in', 'look', 'fear', 'ex', 'ex', 'have', 'nom', 'nom', 'nomN']);
    const pi = Math.floor(Math.random() * 6), q = pi !== 0 && coin(0.2), neg = coin(0.22);
    let per = '3s', tail = [];
    const subject = (animalsOK, need) => {
      if (coin(need ? 0.55 : 0.4)) { const p = TR_PRON[pi]; out.push(trPron(p)); per = p[1]; extra.push(trPron(R(TR_PRON))); return 'person'; }
      if (coin(0.4) || need) { const n = nounOf(animalsOK ? ['person', 'animal'] : ['person']); const pl = coin(0.2) && !(n[3] || '').includes('F');
        const o = { pl, owner: (n[3] || '').includes('F') ? R([0, 1, 3]) : coin(0.1) ? 'noun' : null, adj: coin(0.2), alt: ['acc', 'gen', 'dat'] };
        if (o.owner === 'noun' && (n[3] || '').includes('F')) o.owner = 0;
        np(n, out, o); per = pl && coin(0.5) ? '3p' : '3s'; return n[1]; }
      per = TR_PRON[pi][1]; return 'person';
    };
    const time = coin(0.35) ? trAdv(R(['bugün', 'yarın', 'şimdi', 'her gün'])) : null;
    const freq = !time && coin(0.2) ? trAdv(R(['her zaman', 'sık sık', 'bazen'])) : null;
    if (time && coin(0.5)) out.push(time);
    if (kind === 'ex' || kind === 'have') {
      if (time && time.w === 'şimdi') continue;
      const c = neg ? 'yok' : 'var';
      if (kind === 'have') {
        const n = nounOf(coin(0.3) ? ['person'] : ['animal', 'thing', 'read']); if (/^(kapı|pencere|masa)$/.test(n[0])) continue; if (n[1] === 'person' && !/F/.test(n[3] || '') && n[0] !== 'arkadaş') continue;
        if (time && !out.includes(time)) out.push(time);
        const own = q ? R([1, 2, 4]) : R([0, 1, 2, 3, 4]); np(n, out, { owner: own, det: c === 'var' && coin(0.6) ? 'bir' : null, adj: coin(0.2), alt: ['nom', 'acc'] });
        if (n[1] === 'person' && out.some(x => x.k === 'adj')) continue;
        extra.push(trNoun(n, { poss: TR_PRON[(own + 1) % 5][1] }));
      } else {
        const place = coin(0.2) ? R(TR_NOUN.filter(n => /^(masa|çanta|araba)$/.test(n[0]))) : R(TR_NOUN.filter(n => /^(ev|oda|bahçe|park|market|okul|mutfak|ofis|kütüphane)$/.test(n[0])));
        np(place, out, { cs: 'loc', alt: ['dat', 'nom'] });
        if (time && !out.includes(time)) out.push(time);
        const n = place[1] === 'thing' ? R(TR_NOUN.filter(x => /^(kitap|kalem|telefon|anahtar|dergi|gazete|elma)$/.test(x[0]) && !(place[0] === 'araba' && false))) : nounOf(['person', 'animal', 'thing', 'food', 'read', 'drink']);
        if (n[0] === place[0] || (n[3] || '').includes('F') || place[0] === 'market' && /person|animal/.test(n[1])) continue;
        const two = coin(0.15);
        np(n, out, { det: two ? R(['iki', 'üç']) : c === 'var' && coin(0.5) ? 'bir' : null, adj: coin(0.2), pl: !two && coin(0.1), alt: ['acc', 'loc'] });
        if (two) extra.push(trNoun(n, { pl: true }));
        if (c === 'yok' && !out.some(x => x.w === 'bir')) extra.push(trDet('bir'));
      }
      out.push(trEx(c)); extra.push(trEx(c === 'var' ? 'yok' : 'var'), trDeg());
      if (q) { out.push(trQ(c, '3s')); extra.push(trQ(c === 'var' ? 'yok' : 'var', '3s')); }
    } else if (kind === 'nom' || kind === 'nomN') {
      if (time && (time.w !== 'bugün' || kind === 'nomN')) continue;
      let cat = 'person', bu = false, predN = null, sp;
      if (kind === 'nomN') {
        if (coin(0.4)) { out.push(trBu()); extra.push(trPron(TR_PRON[2])); bu = true; sp = '3s'; predN = nounOf(['thing', 'read', 'food', 'animal']); }
        else { const p = TR_PRON[pi]; if (coin(0.8)) { out.push(trPron(p)); extra.push(trPron(TR_PRON[(pi + 2) % 6])); } else if (p[1] === '3s') continue; sp = p[1]; predN = RP(TR_NOUN.filter(n => n[1] === 'person' && !/F/.test(n[3] || ''))); }
        if (time && !out.includes(time)) out.push(time);
        const one = (bu || ['1s', '2s', '3s'].includes(sp)) && coin(bu ? 0.85 : 0.3);
        if (coin(0.2)) { const a = adjFor(predN); if (a) out.push(trAdj(a)); }   // güzel bir kitap
        if (one) out.push(trDet('bir'));
        const pl = sp === '3p' && coin(0.5);
        if (q) { out.push(trNounPred(predN, '3s', pl)); out.push(trQ(predN[0], sp)); extra.push(trNounPred(predN, sp === '3s' ? '1s' : sp, false), trQ(predN[0], R(['1s', '2s', '3s'].filter(x => x !== sp)))); }
        else if (neg) { out.push(trNounPred(predN, '3s', pl)); out.push(trDegil(sp)); extra.push(trNounPred(predN, sp === '3s' ? '2s' : sp, false), trDegil(sp === '3s' ? '1s' : '3s')); }
        else { out.push(trNounPred(predN, sp, pl)); extra.push(trNounPred(predN, sp === '1s' ? '2s' : '1s', false)); if (sp === '3p') extra.push(trNounPred(predN, '3s', !pl)); }
        if (!bu && predN) extra.push(trNoun(predN, { cs: 'acc' }));
      } else {
        if (coin(0.45)) { const p = TR_PRON[pi]; if (coin(0.8)) out.push(trPron(p)); else if (p[1] === '3s') continue; sp = p[1]; }
        else { const n = nounOf(['*']); cat = n[1]; const o = { det: coin(0.25) ? R(['bu', 'o']) : null, owner: coin(0.15) ? R([0, 1, 'noun']) : null, pl: coin(0.15), alt: ['acc', 'gen'] }; if ((n[3] || '').includes('F')) o.owner = 0; if (o.owner != null && o.det) o.det = null; np(n, out, o); sp = o.pl ? '3p' : '3s'; }
        if (time && !out.includes(time)) out.push(time);
        const a = RP(TR_ADJ.filter(x => (!/F/.test(out.find(c => c.k === 'noun')?.e[3] || '') || /^(mutlu|yorgun|hasta|genç|yaşlı|akıllı)$/.test(x[0])) && x[2].includes({ person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', read: 't', watch: 't', hear: 't', place: 'l' }[cat]))); if (!a) continue;
        if (coin(0.15) && cat !== 'place' && /^(mutlu|yorgun|hasta|sessiz)$/.test(a[0])) { const pl = R(TR_NOUN.filter(x => /^(ev|okul|ofis|oda)$/.test(x[0]))); np(pl, out, { cs: 'loc', alt: ['dat'] }); }
        if (coin(0.25)) out.push(trAdv('çok'));
        const vp = sp === '3p' && coin(0.6) ? '3s' : sp;
        if (q) { out.push(trAdj(a)); out.push(trQ(a[0], vp)); extra.push(trAdj(a, vp === '3s' ? '1s' : vp), trFlip(() => trQ(a[0], vp))); extra.at(-1).wrong = `The question word follows the last vowel: “${a[0]} ${trQW(a[0], vp)}”.`; }
        else if (neg) { out.push(trAdj(a)); out.push(trDegil(vp)); extra.push(trAdj(a, vp === '3s' ? '2s' : vp), trDegil(vp === '3s' ? '1s' : '3s')); }
        else { out.push(trAdj(a, vp)); extra.push(trAdj(a, vp === '1s' ? '2s' : vp === '3s' ? '1p' : '1s'), trDeg()); }
      }
    } else {
      // a verb sentence
      const vs = TR_VERB.filter(v => kind === 'acc' ? v.t === 'acc' : kind === 'go' ? v.t === 'dat' && v.prep === 'to' : kind === 'look' ? v.w === 'bakmak' : kind === 'fear' ? v.t === 'abl' : v.t === 'in');
      const favV = vs.filter(x => pref.has(x.w)), v = favV.length && coin(0.6) ? R(favV) : R(vs);
      const subjCat = subject(v.who === 'a', false);
      if (v.who === 'p' && subjCat === 'animal') continue;
      if (time && !out.includes(time) && coin(0.5)) out.push(time);
      if (freq) out.push(freq);
      if (kind === 'go') {
        if (v.w === 'gelmek' && coin(0.35)) np(nounOf(['place']), out, { cs: 'abl', alt: ['loc', 'dat'] });
        if (!(v.w === 'gelmek' && coin(0.3))) { const pl = nounOf(['place']); if (out.some(c => c.e && c.e[0] === pl[0])) continue; np(pl, out, { cs: 'dat', owner: coin(0.1) ? R([0, 1, 3]) : null, alt: ['loc', 'nom'] }); }
      } else if (kind === 'look') { const n = nounOf(['person', 'animal', 'thing', 'read']); np(n, out, { cs: 'dat', owner: coin(0.15) ? R([0, 1, 'noun']) : null, adj: coin(0.2), alt: ['acc', 'loc'] }); }
      else if (kind === 'fear') { const n = nounOf(['animal']); np(n, out, { cs: 'abl', pl: coin(0.2), alt: ['acc', 'dat'] }); }
      else {
        const where = TR_AT[v.w] || (v.t === 'acc' ? 'ev oda park bahçe okul' : '');
        if (where && coin(0.3)) { const pl = R(TR_NOUN.filter(x => x[1] === 'place' && where.split(' ').includes(x[0]))); if (pl) np(pl, out, { cs: 'loc', alt: ['dat'] }); }
        if (time && !out.includes(time)) out.push(time);
        if (kind === 'acc') {
          const n = nounOf(v.o); if (out.some(c => c.e && c.e[0] === n[0])) continue;
          const anim = ['person', 'animal'].includes(n[1]);
          const style = anim || !TR_BARE.test(v.w) ? R(['acc', 'acc', 'own', 'dem', 'pl']) : R(['bare', 'bare', 'bir', 'acc', 'acc', 'own', 'pl', 'dem']);
          if (style === 'bare') np(n, out, { adj: coin(0.2), alt: ['acc'] });
          else if (style === 'bir') { np(n, out, { det: 'bir', adj: coin(0.3), alt: ['acc'] }); }
          else if (style === 'own') np(n, out, { cs: 'acc', owner: (n[3] || '').includes('F') ? R([0, 1, 3]) : R([0, 1, 2, 3, 'noun']), alt: ['nom', 'dat'] });
          else if (style === 'dem') np(n, out, { cs: 'acc', det: R(['bu', 'o']), alt: ['nom', 'dat'] });
          else np(n, out, { cs: 'acc', pl: style === 'pl', adj: coin(0.2), alt: ['nom', 'dat'] });
        }
      }
      if (time && !out.includes(time)) out.push(time);
      if (kind === 'in' && !freq && coin(0.15) && /^(çalışmak|koşmak|yüzmek|gülmek|konuşmak|uyumak|oynamak)$/.test(v.w)) out.push(trAdv('çok'));
      let tense = (time && /^(şimdi|bugün)$/.test(time.w)) ? 'pr' : freq ? (coin(0.65) ? 'ao' : 'pr') : coin(0.3) ? 'ao' : 'pr';
      if (neg && freq?.w === 'bazen') continue;
      if (v.st && time && time.w !== 'her gün') continue;
      if (time && time.w === 'yarın' && tense === 'ao' && coin(0.5)) tense = 'pr';
      const vper = q ? (per === '3p' ? '3p' : '3s') : per;
      const vc = trVerb(v, tense, neg, vper);
      out.push(vc);
      if (q) out.push(trQ(vc.w, per === '3p' ? '3s' : per));
      extra.push(trVerb(v, tense, !neg, vper));
      if (!(time && time.w === 'şimdi')) extra.push(trVerb(v, tense === 'ao' ? 'pr' : 'ao', neg, vper));
      extra.push(trVerb(v, tense, neg, R(TR_PERS.filter(x => x !== vper))));
      if (q) { const wq = trFlip(() => trQ(vc.w, per === '3p' ? '3s' : per)); wq.wrong = `The question word follows the last vowel of the verb: “${vc.w} ${trQW(vc.w, per === '3p' ? '3s' : per)}”.`; extra.push(wq); }
      else if (neg) extra.push(trDeg());
    }
    if (out.length < 2 || out.length > 11) continue;
    const res = trCheck(out); if (!res.ok) continue;
    extra.push(trNoun(nounOf(['*'])), trAdv(R(['bugün', 'her zaman', 'şimdi'])));
    const seen = new Set(out.map(w => w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && !seen.has(x.w)) { seen.add(x.w); uniq.push(x); }
    return { words: out, extra: uniq.slice(0, Math.max(4, 14 - out.length)), english: trEnglish(res.P) };
  }
  return null;
}

/* register: the question word mı gets the particle color */
if (!BLD_TYPES.part) BLD_TYPES.part = ['particle', 'marks what a word does: 은/는, 을/를, 에, 에서…'];
BLD_LANGS.tr = { name: 'Turkish', check: trCheck, gen: trGenerate, voice: 'tr-TR', english: trEnglish, types: ['pron', 'noun', 'verb', 'adj', 'det', 'adv', 'part'], text: trJoin };
BLD_ORDER.tr = { rows: [
    ['A basic sentence', [['pron', '(who)'], ['adv', '(time)'], ['noun', 'what (no ending)'], ['verb', 'verb + person']]],
    ['“The” thing', [['pron', '(who)'], ['noun', 'what + -ı / -i'], ['verb', 'verb']]],
    ['Going somewhere', [['pron', '(who)'], ['noun', '(from + -den)'], ['noun', 'place + -a / -e'], ['verb', 'gidiyorum']]],
    ['Where it happens', [['pron', '(who)'], ['noun', 'place + -da / -de'], ['noun', 'what'], ['verb', 'verb']]],
    ['Saying what someone is', [['pron', '(who)'], ['noun', 'noun + -im / -sin…'], ['verb', '(değil)']]],
    ['Describing', [['noun', 'who / what'], ['adv', '(çok)'], ['adj', 'describing word']]],
    ['There is / I have', [['noun', 'place + -da / -de'], ['det', '(bir)'], ['noun', 'thing (+ -im for mine)'], ['verb', 'var / yok']]],
    ['A question', [['noun', '…'], ['verb', 'verb'], ['part', 'mı / mi / mu / mü + person']]],
  ], tips: [
    ['verb', 'The verb (or <b>var / yok</b>, or the describing word) comes <b>last</b>. The parts before it can move around.'],
    ['noun', 'Endings follow <b>vowel harmony</b>: after a, ı, o, u → <b>-a, -da, -dan, -ı/-u</b>; after e, i, ö, ü → <b>-e, -de, -den, -i/-ü</b>. After ç f h k p s ş t, -da becomes <b>-ta</b>: parkta.'],
    ['noun', '<b>-ı</b> marks “the” thing you act on: <b>kitabı</b> okuyorum (the book). With no ending it is “a book”, and it goes right before the verb: <b>kitap okuyorum</b>. Many longer words soften p ç t k before a vowel: kitap → kitabı, köpek → köpeği.'],
    ['verb', '<b>-iyor</b> = doing it now or these days (okuyorum); the simple present = as a habit (okurum). Person endings: <b>-um, -sun, –, -uz, -sunuz, -lar</b>. “Not” goes inside: <b>okumuyorum, okumam</b>.'],
    ['part', 'Questions: <b>mı / mi / mu / mü</b>, written apart, follows the last vowel and takes the person ending: <b>okuyor musun?</b> <b>yorgun musun?</b>'],
    ['det', 'After a number there is no plural: <b>iki kedi</b>. A describing word can go before bir: <b>büyük bir ev</b>.'],
    ['pron', 'You can leave out ben, sen… because the ending already says who. Owners: <b>benim kitabım</b>, <b>çocuğun kedisi</b>.'] ] };

/* ---------------- Your own Turkish words (📚 Add my deck's words) ---------------- */
const TR_BASE = { n: TR_NOUN.length, a: TR_ADJ.length, v: TR_VERB.length };
const trKnown = w => TR_NOUN.slice(0, TR_BASE.n).some(n => n[0] === w) || TR_VERB.slice(0, TR_BASE.v).some(v => v.w === w) || TR_ADJ.slice(0, TR_BASE.a).some(a => a[0] === w)
  || TR_PRON.some(p => p[0] === w || p[3] === w) || TR_ADV.some(a => a[0] === w) || TR_DET.some(d => d[0] === w) || ['var', 'yok', 'değil', 'mi', 'mı', 'mu', 'mü'].includes(w);
// p ç t k at the end of a longer word usually soften (kitap → kitabı, ağaç → ağacı, köpek → köpeği); words ending in t often don't (saat)
const trSoftGuess = w => trSyl(w) > 1 && /[pçk]$/.test(w);
function trApplyMine() {
  TR_NOUN.length = TR_BASE.n; TR_ADJ.length = TR_BASE.a; TR_VERB.length = TR_BASE.v;
  for (const m of S.bldWords || []) {
    if (!m || m.lang !== 'tr' || !m.w || !m.en || trKnown(m.w)) continue;
    if (m.k === 'noun' && /^[a-zçğıöşüâîû]+$/.test(m.w)) TR_NOUN.push([m.w, m.cat || 'thing', m.en, (trSoftGuess(m.w) ? 's' : '') + (m.cat === 'food' || m.cat === 'drink' ? 'M' : ''), m.cat === 'place' ? 'at' : '']);
    if (m.k === 'verb' && /m[ae]k$/.test(m.w)) {
      const t = m.obj === 'in' ? 'in' : 'acc', o = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read', 'watch', 'hear'];
      const v = { w: m.w, t, o, en: [m.en, bld3sEn(m.en), bldIngEn(m.en)], who: m.who === 'a' ? 'a' : 'p', mine: true };
      // the simple present the card gives (gelir, okur) decides -ir / -ar
      if (Array.isArray(m.forms) && m.forms[1] && /[ıiuü]r$/.test(m.forms[1]) && trSyl(trStem(v)) === 1 && !trEndV(trStem(v))) v.ir = 1;
      TR_VERB.push(v);
    }
    if (m.k === 'adj' && /^[a-zçğıöşü]+$/.test(m.w)) TR_ADJ.push([m.w, m.en, 'patlf', trSoftGuess(m.w) ? 's' : '']);
  }
}
const bldIngEn = w => { const [h, ...r] = w.split(' '); const g = /ie$/.test(h) ? h.slice(0, -2) + 'ying' : /[^aeiou]e$/.test(h) && h !== 'be' ? h.slice(0, -1) + 'ing' : /^[^aeiou]*[aeiou][bdgmnpt]$/.test(h) ? h + h.slice(-1) + 'ing' : h + 'ing'; return [g, ...r].join(' '); };
if (typeof bldApplyMine === 'function') { const prevTrApply = bldApplyMine; bldApplyMine = function () { prevTrApply(); trApplyMine(); }; }
BLD_MINE.tr = { name: 'Turkish', forms: '-iyor form, simple present (geliyor, gelir)', nForms: 2, noGender: true,
  conj: w => { if (!/m[ae]k$/.test(w)) return []; const v = { w }; return [trProg(v, false, '3s'), trAor(v, false, '3s')]; }, pl: w => w + 'l' + trA(w) + 'r',
  adj: w => [w], known: w => trKnown(trLow(w)), gender: () => 'm', isVerb: w => /m[ae]k$/.test(trLow(w)), refl: () => false, minLen: 2,
  guess: (w, en) => /^(hello|hi|thanks?|thank you|bye|goodbye|good|sorry|excuse|please|welcome|you.?re|yes|no|not|how|what|who|where|why|when|which|and|but|or|of|in|on|at)( |$)/i.test(en) ? '' : 'noun',
  parse: s => { const w = trLow(String(s || '').replace(/[（(][^）)]*[）)]/g, '')).replace(/\s+/g, ' ').trim(); return /^[a-zçğıöşüâîû]+$/.test(w) ? { w } : null; },
  intro: 'words ending in -mek / -mak are verbs). The -iyor form and the simple present are filled in for you: check the simple present (gelir, okur, yazar), since a few short verbs take -ir instead of -er.' };
// Turkish has its own I/ı and İ/i: the deck's words are lower-cased the Turkish way
if (typeof bldCandidates === 'function') {
  const prevTrCands = bldCandidates;
  bldCandidates = function (deckId) {
    const d = deckById(deckId), sides = bldSides(d);
    if (!sides || sides[2] !== 'tr') return prevTrCands(deckId);
    const out = [], seen = new Set(), L = BLD_MINE.tr;
    for (const c of cardsOf(deckId)) {
      const tr = trLow(bldClean(c[sides[0]])).replace(/[!?.,;:]/g, '').replace(/’/g, "'").trim();
      const enRaw = bldClean(c[sides[1]]).toLowerCase().split(/[,;/]| or /)[0].replace(/[!?.]/g, '').trim();
      const toVerb = /^to\s/.test(enRaw), en = enRaw.replace(/^(to|the|a|an|some)\s+/, '').trim();
      if (!en || !/^[a-z][a-z' -]*$/.test(en) || en.split(' ').length > (toVerb ? 4 : 2)) continue;
      const m = L.parse(tr), w = m?.w;
      if (!w || w.length < 2 || seen.has(w) || L.known(w)) continue;
      seen.add(w);
      const lab = BLD_FROM_LABEL[bldLabelOf(c, sides[0], d)] || '', isVerb = L.isVerb(w);
      let k = lab && (lab !== 'verb' || isVerb) ? lab : isVerb ? 'verb' : toVerb ? '' : L.guess(w, en);
      out.push({ w, en, k, g: 'm', verbOK: isVerb, fromLabel: !!lab && k === lab, lang: 'tr', read: null });
    }
    return out;
  };
}
