'use strict';
/* ================= Sentence Builder: Indonesian (Bahasa Indonesia) =================
   What the checker teaches:
   • verbs never change for who or when: time words (kemarin, besok) and sudah / akan / sedang / belum do that job
   • describing words come after the noun (rumah besar), and so do ini / itu (buku ini) and the owner (buku saya)
   • tidak for verbs and describing words, bukan for nouns (Dia bukan guru); belum = not yet
   • no "is" before a describing word (Rumah itu besar); adalah is only for nouns, and it can be left out
   • plural by doubling (anak-anak), but never after a number or banyak (dua buku, not dua buku-buku)
   • seorang / seekor / sebuah = "a", for people, animals and things
   • ke for where you go, di for where you are; the meN- / ber- form of a verb in a full sentence (membaca, not baca);
     the di- form is the passive (Buku itu dibaca oleh guru)
   • questions: Apakah at the start, or apa / siapa / mana where the answer goes
   Loaded after builder.js. */

//            word      English    person (1 I, 2 you, 3 he/she, p plural)   gloss
const ID_PRON = [['saya', 'I', '1', 'I, me'], ['aku', 'I', '1', 'I, me (casual)'], ['kamu', 'you', '2', 'you'], ['Anda', 'you', '2', 'you (polite)'], ['dia', 'he/she', '3', 'he, she, him, her'],
  ['kami', 'we', 'p', 'we (not you)'], ['kita', 'we', 'p', 'we (and you)'], ['mereka', 'they', 'p', 'they, them']];
const ID_POSS_EN = { saya: 'my', aku: 'my', kamu: 'your', Anda: 'your', dia: 'his/her', kami: 'our', kita: 'our', mereka: 'their' };
const ID_OBJ_EN = { saya: 'me', aku: 'me', kamu: 'you', Anda: 'you', dia: 'him/her', kami: 'us', kita: 'us', mereka: 'them' };
//            word      kind     English      plural English   flags: m can't be counted, f family (my mother), n a name (Jakarta), h home   counter: orang / ekor / buah ('' = none)
const ID_NOUN = [
  ['guru', 'person', 'teacher', 'teachers', '', 'orang'], ['murid', 'person', 'student', 'students', '', 'orang'], ['dokter', 'person', 'doctor', 'doctors', '', 'orang'], ['teman', 'person', 'friend', 'friends', '', 'orang'],
  ['anak', 'person', 'child', 'children', '', 'orang'], ['pria', 'person', 'man', 'men', '', 'orang'], ['wanita', 'person', 'woman', 'women', '', 'orang'],
  ['ibu', 'person', 'mother', 'mothers', 'f', ''], ['ayah', 'person', 'father', 'fathers', 'f', ''], ['adik', 'person', 'little brother/sister', 'little brothers/sisters', 'f', ''], ['kakak', 'person', 'big brother/sister', 'big brothers/sisters', 'f', ''],
  ['kucing', 'animal', 'cat', 'cats', '', 'ekor'], ['anjing', 'animal', 'dog', 'dogs', '', 'ekor'], ['burung', 'animal', 'bird', 'birds', '', 'ekor'], ['ikan', 'animal', 'fish', 'fish', '', 'ekor'], ['kuda', 'animal', 'horse', 'horses', '', 'ekor'],
  ['nasi', 'food', 'rice', null, 'm', ''], ['roti', 'food', 'bread', null, 'm', ''], ['mi', 'food', 'noodles', null, 'm', ''], ['apel', 'food', 'apple', 'apples', '', 'buah'], ['pisang', 'food', 'banana', 'bananas', '', 'buah'],
  ['kue', 'food', 'cake', 'cakes', '', 'buah'], ['ikan', 'food', 'fish', null, 'm', ''], ['telur', 'food', 'egg', 'eggs', '', ''],
  ['air', 'drink', 'water', null, 'm', ''], ['kopi', 'drink', 'coffee', null, 'm', ''], ['teh', 'drink', 'tea', null, 'm', ''], ['susu', 'drink', 'milk', null, 'm', ''], ['jus', 'drink', 'juice', null, 'm', ''],
  ['buku', 'read', 'book', 'books', '', 'buah'], ['surat', 'read', 'letter', 'letters', '', 'buah'], ['koran', 'read', 'newspaper', 'newspapers', '', 'buah'], ['majalah', 'read', 'magazine', 'magazines', '', 'buah'],
  ['rumah', 'place', 'house', 'houses', 'h', 'buah'], ['sekolah', 'place', 'school', 'schools', '', 'buah'], ['pasar', 'place', 'market', 'markets', '', 'buah'], ['kantor', 'place', 'office', 'offices', '', 'buah'],
  ['taman', 'place', 'park', 'parks', '', 'buah'], ['toko', 'place', 'store', 'stores', '', 'buah'], ['restoran', 'place', 'restaurant', 'restaurants', '', 'buah'], ['perpustakaan', 'place', 'library', 'libraries', '', 'buah'],
  ['kamar', 'place', 'room', 'rooms', '', 'buah'], ['pantai', 'place', 'beach', 'beaches', '', 'buah'], ['kota', 'place', 'city', 'cities', '', 'buah'], ['Jakarta', 'place', 'Jakarta', null, 'n', ''],
  ['mobil', 'thing', 'car', 'cars', '', 'buah'], ['sepeda', 'thing', 'bike', 'bikes', '', 'buah'], ['meja', 'thing', 'table', 'tables', '', 'buah'], ['kursi', 'thing', 'chair', 'chairs', '', 'buah'],
  ['pintu', 'thing', 'door', 'doors', '', 'buah'], ['jendela', 'thing', 'window', 'windows', '', 'buah'], ['tas', 'thing', 'bag', 'bags', '', 'buah'], ['bola', 'thing', 'ball', 'balls', '', 'buah'],
  ['bunga', 'thing', 'flower', 'flowers', '', 'buah'], ['payung', 'thing', 'umbrella', 'umbrellas', '', 'buah'], ['baju', 'thing', 'shirt', 'shirts', '', 'buah'], ['ponsel', 'thing', 'phone', 'phones', '', 'buah']];
// how English says "at / to" a place: at home, at school, in the park
const ID_PLACE_AT = { rumah: 'at home', sekolah: 'at school', taman: 'in the park', kamar: 'in the room', kota: 'in the city', Jakarta: 'in Jakarta' };
const ID_PLACE_TO = { rumah: 'home', sekolah: 'to school', Jakarta: 'to Jakarta' };
//            word     English       describes (p people, a animals, f food & drink, t things, l places, r reading)
const ID_ADJ = [['besar', 'big', 'atlr'], ['kecil', 'small', 'atlr'], ['baru', 'new', 'tlr'], ['lama', 'old', 'tlr'], ['tua', 'old', 'pa'], ['muda', 'young', 'p'], ['bagus', 'nice', 'tlr'],
  ['baik', 'kind', 'p'], ['cantik', 'pretty', 'pt'], ['mahal', 'expensive', 'tfr'], ['murah', 'cheap', 'tfr'], ['enak', 'tasty', 'f'], ['panas', 'hot', 'f'], ['dingin', 'cold', 'f'],
  ['merah', 'red', 'tf'], ['biru', 'blue', 't'], ['putih', 'white', 'at'], ['hitam', 'black', 'at'], ['senang', 'happy', 'pa'], ['sedih', 'sad', 'pa'], ['lapar', 'hungry', 'pa'],
  ['haus', 'thirsty', 'pa'], ['lelah', 'tired', 'pa'], ['sibuk', 'busy', 'p'], ['pintar', 'smart', 'pa'], ['cepat', 'fast', 'pa'], ['bersih', 'clean', 'tl'], ['kotor', 'dirty', 'tl']];
const ID_CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
const ID_KIND = { food: 'food', drink: 'drinks', read: 'things you read or write', thing: 'things', place: 'places', animal: 'animals', person: 'people' };
//            word        root    kind   takes             English: base, he/she, past, -ing, done         who (p people only, a animals too)   1 = the object can be left out
const ID_VERB = [
  ['makan', 'makan', 'tr', ['food'], ['eat', 'eats', 'ate', 'eating', 'eaten'], 'a', 1], ['minum', 'minum', 'tr', ['drink'], ['drink', 'drinks', 'drank', 'drinking', 'drunk'], 'a', 1],
  ['membaca', 'baca', 'tr', ['read'], ['read', 'reads', 'read', 'reading', 'read'], 'p', 1], ['menulis', 'tulis', 'tr', ['read'], ['write', 'writes', 'wrote', 'writing', 'written'], 'p', 1],
  ['membeli', 'beli', 'tr', ['food', 'drink', 'read', 'thing', 'animal'], ['buy', 'buys', 'bought', 'buying', 'bought'], 'p'], ['menjual', 'jual', 'tr', ['food', 'drink', 'read', 'thing', 'animal'], ['sell', 'sells', 'sold', 'selling', 'sold'], 'p'],
  ['melihat', 'lihat', 'tr', ['*'], ['see', 'sees', 'saw', 'seeing', 'seen'], 'a'], ['mencari', 'cari', 'tr', ['*'], ['look for', 'looks for', 'looked for', 'looking for', 'looked for'], 'a'],
  ['menunggu', 'tunggu', 'tr', ['person', 'animal'], ['wait for', 'waits for', 'waited for', 'waiting for', 'waited for'], 'a'], ['memasak', 'masak', 'tr', ['food'], ['cook', 'cooks', 'cooked', 'cooking', 'cooked'], 'p', 1],
  ['suka', '', 'like', ['*'], ['like', 'likes', 'liked', 'liking', 'liked'], 'a'], ['punya', '', 'have', ['animal', 'thing', 'read', 'food'], ['have', 'has', 'had', 'having', 'had'], 'a'],
  ['bekerja', 'kerja', 'in', null, ['work', 'works', 'worked', 'working', 'worked'], 'p'], ['belajar', '', 'in', null, ['study', 'studies', 'studied', 'studying', 'studied'], 'p'],
  ['tidur', '', 'in', null, ['sleep', 'sleeps', 'slept', 'sleeping', 'slept'], 'a'], ['berlari', 'lari', 'in', null, ['run', 'runs', 'ran', 'running', 'run'], 'a'],
  ['berenang', 'renang', 'in', null, ['swim', 'swims', 'swam', 'swimming', 'swum'], 'a'], ['bermain', 'main', 'in', null, ['play', 'plays', 'played', 'playing', 'played'], 'a'],
  ['menari', 'tari', 'in', null, ['dance', 'dances', 'danced', 'dancing', 'danced'], 'p'], ['mandi', '', 'in', null, ['take a bath', 'takes a bath', 'took a bath', 'taking a bath', 'taken a bath'], 'a'],
  ['duduk', '', 'in', null, ['sit', 'sits', 'sat', 'sitting', 'sat'], 'a'],
  ['pergi', '', 'go', null, ['go', 'goes', 'went', 'going', 'gone'], 'a'], ['datang', '', 'go', null, ['come', 'comes', 'came', 'coming', 'come'], 'a'], ['pulang', '', 'home', null, ['go home', 'goes home', 'went home', 'going home', 'gone home'], 'a']];
//            word      English           how: time (when; past / fut / now / hab) · neg · asp (sudah, akan, sedang, belum) · mod (mau, bisa, harus) · freq · also · deg (sangat, before) · degEnd (sekali, after)
const ID_ADV = [['hari ini', 'today', 'time', 'now'], ['besok', 'tomorrow', 'time', 'fut'], ['kemarin', 'yesterday', 'time', 'past'], ['sekarang', 'now', 'time', 'now'], ['nanti', 'later', 'time', 'fut'], ['setiap hari', 'every day', 'time', 'hab'],
  ['tidak', 'not (verbs, describing words)', 'neg'], ['bukan', 'not (nouns)', 'neg'], ['sudah', 'already (done)', 'asp'], ['akan', 'will', 'asp'], ['sedang', '(be) -ing, right now', 'asp'], ['belum', 'not yet', 'asp'],
  ['sering', 'often', 'freq'], ['selalu', 'always', 'freq'], ['juga', 'also, too', 'also'], ['sangat', 'very', 'deg'], ['sekali', 'very (after the word)', 'degEnd']];
const ID_MOD = [['mau', ['want to', 'wants to', 'wanted to'], 'want, want to'], ['bisa', ['can', 'can', 'could'], 'can'], ['harus', ['must', 'must', 'had to'], 'must, have to']];
//            word       kind: num (a number), cl (se- = "a", for a counter), many    English    counter
const ID_DET = [['dua', 'num', 'two', 2], ['tiga', 'num', 'three', 3], ['lima', 'num', 'five', 5], ['banyak', 'many', 'many'], ['beberapa', 'many', 'some'],
  ['seorang', 'cl', 'a', 'orang'], ['seekor', 'cl', 'a', 'ekor'], ['sebuah', 'cl', 'a', 'buah'], ['ini', 'dem', 'this'], ['itu', 'dem', 'that']];
const ID_CL_FOR = { orang: 'seorang', ekor: 'seekor', buah: 'sebuah' };
const ID_CL_WHAT = { orang: 'people', ekor: 'animals', buah: 'things' };
const ID_PREP = { di: 'at, in (where you are)', ke: 'to (where you go)', dengan: 'with', oleh: 'by' };
const ID_Q = [['apa', 'what'], ['siapa', 'who'], ['mana', 'where (di mana, ke mana)']];

/* chips (gloss = the English, shown under the word) */
const idPron = p => chip({ k: 'pron', w: p[0], e: p, en: p[1], per: p[2], gloss: p[3] });
const idQ = w => chip({ k: 'pron', w, q: w, en: ID_Q.find(x => x[0] === w)[1], gloss: ID_Q.find(x => x[0] === w)[1] + '?' });
const idNoun = (n, pl) => chip({ k: 'noun', w: pl ? n[0] + '-' + n[0] : n[0], e: n, cat: n[1], pl: !!pl, en: pl ? n[3] : n[2], gloss: pl ? n[3] + ' (doubled = more than one)' : n[2] });
const idAdj = a => chip({ k: 'adj', w: a[0], e: a, en: a[1], gloss: a[1] });
const idVerb = v => chip({ k: 'verb', w: v[0], e: v, type: v[2], gloss: v[2] === 'go' && v[0] !== 'pulang' ? v[4][0] + ' (ke = to)' : 'to ' + v[4][0] });
const idRoot = v => chip({ k: 'verb', w: v[1], e: v, type: 'root', gloss: v[4][0] + ' (the root of ' + v[0] + ')' });
const idPassW = v => 'di' + (v[1] || v[0]);
const idPass = v => chip({ k: 'verb', w: idPassW(v), e: v, type: 'pass', gloss: 'is ' + v[4][4] + ' (di- = passive)' });
const idMod = w => { const m = ID_MOD.find(x => x[0] === w); return chip({ k: 'verb', w, e: m, type: 'mod', gloss: m[2] }); };
const idAdv = w => { const a = ID_ADV.find(x => x[0] === w); return chip({ k: 'adv', w, how: a[2], when: a[3], en: a[1], gloss: a[1] }); };
const idDet = w => { const d = ID_DET.find(x => x[0] === w); return chip({ k: 'det', w, kind: d[1], en: d[2], n: d[3], gloss: d[1] === 'cl' ? `a, one (for ${ID_CL_WHAT[d[3]]})` : d[2] }); };
const idPrep = w => chip({ k: 'prep', w, gloss: ID_PREP[w] });
const idCop = () => chip({ k: 'verb', w: 'adalah', type: 'cop', gloss: 'is, are (before a noun)' });
const idAda = () => chip({ k: 'verb', w: 'ada', type: 'ada', gloss: 'there is, is (somewhere)' });
const idApakah = () => chip({ k: 'part', w: 'apakah', gloss: '(starts a yes/no question)' });
const idDan = () => chip({ k: 'conj', w: 'dan', gloss: 'and' });
const idNounBy = w => ID_NOUN.find(n => n[0] === w);
const idVerbBy = w => ID_VERB.find(v => v[0] === w);
// where each verb makes sense, for the made-up sentences
const ID_VERB_AT = { makan: 'rumah restoran sekolah taman pantai', minum: 'rumah restoran kantor', membaca: 'rumah perpustakaan kamar sekolah taman', menulis: 'rumah kamar sekolah kantor',
  membeli: 'pasar toko Jakarta', menjual: 'pasar toko', melihat: 'taman pantai kota', mencari: 'rumah kamar sekolah taman', menunggu: 'sekolah kantor taman restoran', memasak: 'rumah restoran',
  bekerja: 'kantor sekolah toko restoran pasar Jakarta', belajar: 'sekolah perpustakaan rumah kamar', tidur: 'rumah kamar', berlari: 'taman pantai', berenang: 'pantai', bermain: 'taman rumah sekolah pantai',
  menari: 'sekolah rumah', mandi: 'rumah', duduk: 'taman kamar restoran' };
const ID_MOOD = /^(senang|sedih|lapar|haus|lelah|sibuk)$/;

/* ---------------- Indonesian checker ---------------- */
function idCheck(T) {
  let i = 0;
  const err = (msg, at = i) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length }), peek = (o = 0) => T[i + o], isErr = x => x && x.ok === false;
  if (!T.length) return err('Tap some words to build a sentence.');
  const is = (t, k, w) => t && t.k === k && (w == null || [].concat(w).includes(t.w));
  const how = (t, h) => t && t.k === 'adv' && [].concat(h).includes(t.how);
  const isDem = t => is(t, 'det') && t.kind === 'dem';
  // a noun phrase: (number / se- / banyak) noun (describing words) (owner) (ini / itu)
  function NP() {
    const np = { start: i, adjs: [] };
    const d = peek();
    if (is(d, 'det') && d.kind !== 'dem') { np.det = d; i++; }
    else if (isDem(d) && (peek(1)?.k === 'noun')) return err(`“${d.w}” goes after the noun: “${peek(1).w} ${d.w}” (${peek(1).en} ${d.w === 'ini' ? 'this' : 'that'} → the ${peek(1).en}).`, i);
    if (peek()?.k === 'adj' && peek(1)?.k === 'noun') return err(`In Indonesian the describing word comes after the noun: “${peek(1).w} ${peek().w}”.`, i);
    const n = peek();
    if (!n || !(n.k === 'noun' || n.k === 'pron' && !n.q)) {
      if (np.det) return err(`After “${np.det.w}” comes a noun: “${np.det.w} ${np.det.kind === 'cl' ? { orang: 'guru', ekor: 'kucing', buah: 'buku' }[np.det.n] : 'buku'}”.`, i);
      return { none: true, start: i };
    }
    if (n.k === 'pron') {
      if (np.det) return err(`“${n.w}” is a pronoun, so it doesn’t take “${np.det.w}”.`, i);
      i++; np.n = n; np.cat = 'person'; np.end = i; return np;
    }
    i++; np.n = n; np.cat = n.cat;
    const mass = n.e[4].includes('m');
    if (np.det) {
      const D = np.det;
      if (n.pl) return err(`After “${D.w}” the noun isn’t doubled: “${D.w} ${n.e[0]}”. ${D.kind === 'cl' ? '' : 'The number already says there’s more than one.'}`, i - 1);
      if (D.kind === 'num' && mass) return err(`“${n.w}” (${n.en}) can’t be counted like that. Leave out “${D.w}”, or say “banyak ${n.w}” (a lot of ${n.en}).`, np.start);
      if (D.kind === 'cl') {
        if (mass || !n.e[5]) return err(`“${D.w}” doesn’t go with “${n.w}”. Just say “${n.w}”.`, np.start);
        if (D.n !== n.e[5]) return err(`“${n.w}” takes “${ID_CL_FOR[n.e[5]]}”, not “${D.w}”: “${ID_CL_FOR[n.e[5]]} ${n.w}”. (seorang for people, seekor for animals, sebuah for things)`, np.start);
      }
      if (D.en === 'some' && mass) return err(`“beberapa” (some, a few) is for things you can count. For “${n.w}”, say “sedikit ${n.w}” or just “${n.w}”.`, np.start);
    }
    if (n.pl && mass) return err(`“${n.e[0]}” isn’t doubled: just “${n.e[0]}”.`, i - 1);
    while (peek()?.k === 'adj') {
      const a = peek(), code = ID_CAT[n.cat];
      if (a.e && code && !a.e[2].includes(code)) return err(`That doesn’t sound right: “${a.w}” (${a.en}) doesn’t describe ${ID_KIND[n.cat] || 'that'}.`, i);
      if (np.adjs.some(x => x.w === a.w)) return err(`“${a.w}” is there twice.`, i);
      np.adjs.push(a); i++;
    }
    if (peek()?.k === 'pron' && !peek().q && !np.det) { np.owner = T[i++]; }
    if (isDem(peek())) { np.dem = T[i++]; if (np.det && np.det.kind !== 'num') return err(`“${np.det.w}” and “${np.dem.w}” don’t go together: “${n.w} ${np.dem.w}”.`, np.start); }
    np.end = i; return np;
  }
  const P = { time: null, adv: [], kind: null };
  const takeTime = () => { while (how(peek(), 'time')) { if (P.time) return err('One time word is enough.', i); P.time = T[i++]; } return null; };
  // Apakah … ? (or Apa … ? in everyday speech)
  if (is(peek(), 'part', 'apakah')) { P.yn = T[i++]; if (!peek()) return err('After “Apakah” comes a whole sentence: “Apakah kamu lapar?”', i); }
  else if (is(peek(), 'pron', 'apa') && peek(1) && !(isDem(peek(1)) && T.length === 2)) { P.yn = T[i++]; }
  let e = takeTime(); if (e) return e;
  // what / who is that? (Apa itu? Siapa dia?)
  if (is(peek(), 'pron', ['apa', 'siapa']) && !P.yn) {
    const q = T[i++]; if (!peek()) return err(`“${q.w}” asks a question about something: “${q.w === 'apa' ? 'Apa itu?' : 'Siapa dia?'}”`, i - 1);
    let s; if (isDem(peek())) s = { dem: T[i++], alone: true, start: i - 1, end: i, cat: '*' }; else { s = NP(); if (isErr(s)) return s; if (s.none) return err(`Start with who (or what) the sentence is about.`, i); }
    if (peek()) return err(`To ask about more than “${q.w} + ${T.slice(s.start, s.end).map(t => t.w).join(' ')}”, put “${q.w}” where the answer goes: “Kamu makan apa?”`, i);
    if (q.w === 'siapa' && s.cat !== 'person' && s.cat !== '*') return err('“siapa” (who) is for people. For things, ask with “apa”.', 0);
    if (q.w === 'apa' && s.cat === 'person' && s.n?.k === 'pron') return err('“apa” (what) is for things. For people, ask with “siapa”.', 0);
    P.subj = s; P.kind = 'noun'; P.predQ = q; return { ok: true, P };
  }
  // where something is: Di taman ada kucing. / Ada kucing di taman.
  if (is(peek(), 'prep', 'di') && !P.yn || is(peek(), 'prep', 'di') && P.yn) {
    const at = i; i++;
    const pl = NP(); if (isErr(pl)) return pl;
    if (pl.none || pl.cat !== 'place') return err('After “di” comes a place: “di rumah”, “di sekolah”.', at + 1);
    if (!(is(peek(), 'verb', 'ada') || how(peek(), 'neg') && is(peek(1), 'verb', 'ada')))
      return err(`Start with who (or what) the sentence is about, then the place: “Saya … di ${T.slice(pl.start, pl.end).map(t => t.w).join(' ')}”. (Di + place + ada: “Di taman ada kucing”.)`, at);
    P.where = pl;
  }
  if (P.where || is(peek(), 'verb', 'ada') || how(peek(), 'neg') && is(peek(1), 'verb', 'ada')) {
    if (how(peek(), 'neg')) { if (peek().w !== 'tidak') return err('“ada” is made negative with tidak: “tidak ada”.', i); P.neg = T[i++]; }
    if (!is(peek(), 'verb', 'ada')) return err('“ada” (there is) goes here.', i);
    i++;
    const o = NP(); if (isErr(o)) return o;
    if (o.none || o.n.k === 'pron') return err('After “ada” comes what is there: “ada kucing”, “ada dua buku”.', i);
    if (o.dem) return err(`With “ada” (there is), leave out “${o.dem.w}”: “ada ${o.n.w}”.`, T.indexOf(o.dem));
    P.obj = o; P.kind = 'exist';
    if (!P.where && is(peek(), 'prep', 'di')) { const at = i; i++; const pl = NP(); if (isErr(pl)) return pl; if (pl.none || pl.cat !== 'place') return err('After “di” comes a place: “di rumah”, “di taman”.', at + 1); P.where = pl; }
    else if (P.where && is(peek(), 'prep', 'di')) return err('Say the place only once.', i);
    if (!P.where) return err('Say where it is: “di taman”, “di rumah”.', i);
    e = takeTime(); if (e) return e;
    if (peek()) return err('The sentence is done before this word.', i);
    return { ok: true, P };
  }
  // who: a pronoun, ini / itu, or a noun phrase
  let s;
  if (isDem(peek()) && !(peek(1)?.k === 'noun')) s = { dem: T[i++], alone: true, start: i - 1, end: i, cat: '*' };
  else if (isDem(peek())) s = { dem: T[i++], alone: true, start: i - 1, end: i, cat: '*' };   // Ini buku. = This is a book.
  else { s = NP(); if (isErr(s)) return s; }
  if (s.none) {
    const t = peek();
    if (t.k === 'verb' || t.k === 'adv' || t.k === 'adj') return err(`Start with who (or what) the sentence is about: “Saya ${t.w} …”, “Dia ${t.w} …”.`, i);
    return err(`A sentence can’t start with “${t.w}”.`, i);
  }
  // "Kucing lapar." = the cat is hungry: the last describing word is the predicate when nothing else follows
  if (s.adjs?.length && !s.owner && !s.dem && (!peek() || how(peek(), 'time') || is(peek(), 'adv', 'sekali'))) { const a = s.adjs.pop(); i = T.indexOf(a); s.end = i; }
  P.subj = s;
  e = takeTime(); if (e) return e;
  // the little words before the verb: juga, tidak / bukan, sudah / akan / sedang / belum, mau / bisa / harus, sering / selalu
  const ORDER = { also: 1, neg: 2, asp: 3, mod: 4, freq: 5 };
  let last = 0;
  for (;;) {
    const t = peek(), h = t?.k === 'adv' ? t.how : t?.k === 'verb' && t.type === 'mod' ? 'mod' : null;
    if (!h || !ORDER[h]) break;
    if (ORDER[h] <= last) {
      if (h === 'neg' && P.neg || h === 'asp' && P.asp || h === 'mod' && P.mod || h === 'freq' && P.freq || h === 'also' && P.also) return err(`Use only one “${t.w}”-type word here.`, i);
      if (h === 'neg' && P.asp?.w === 'akan') return err('Say “tidak akan” (will not), with tidak first.', i);
      if (h === 'also') return err('“juga” (also) goes right after who: “Saya juga …”.', i);
      return err(`“${t.w}” goes before “${T[i - 1].w}”.`, i);
    }
    if (h === 'mod' && P.asp) return err(`“${P.asp.w}” and “${t.w}” don’t go together here. Use one of them.`, i);
    if (h === 'neg') P.neg = t; else if (h === 'asp') {
      if (P.neg) { if (t.w !== 'akan') return err(t.w === 'sudah' ? '“tidak sudah” isn’t used: “not yet” is “belum”.' : `“tidak” and “${t.w}” don’t go together. ${t.w === 'belum' ? '“belum” already means “not yet”.' : 'Use one of them.'}`, i); if (P.neg.w !== 'tidak') return err('Before akan, use “tidak”: “tidak akan”.', i - 1); }
      P.asp = t;
    } else if (h === 'mod') P.mod = t; else if (h === 'freq') { if (P.asp) return err(`Use “${P.asp.w}” or “${t.w}”, not both.`, i); P.freq = t; } else P.also = t;
    last = ORDER[h]; i++;
  }
  if (how(peek(), 'time')) return err(`Time words like “${peek().w}” go at the start, right after who, or at the end of the sentence.`, i);
  const T0 = P.time;
  const v = peek();
  const persons = x => x?.n?.k === 'pron' ? x.n : null;
  // the predicate
  if (!v) return err('Add what happens, or what they are like: a verb, a describing word, or a noun.', i);
  if (v.k === 'adj' || how(v, 'deg') && peek(1)?.k === 'adj') {
    if (P.mod) return err(`After “${P.mod.w}” comes a verb.`, i);
    if (P.freq) return err(`“${P.freq.w}” goes with a verb: “selalu makan”.`, T.indexOf(P.freq));
    if (P.neg?.w === 'bukan') return err(`Before a describing word, “not” is “tidak”: “tidak ${how(v, 'deg') ? peek(1).w : v.w}”. (“bukan” is for nouns.)`, T.indexOf(P.neg));
    if (P.asp?.w === 'sedang') return err('“sedang” goes with a verb (doing something right now), not with a describing word.', T.indexOf(P.asp));
    if (how(v, 'deg')) { P.deg = T[i++]; }
    const a = T[i++]; P.adj = a; P.kind = 'adj';
    const code = ID_CAT[s.n?.cat] || (s.n?.k === 'pron' ? 'p' : null);
    if (a.e && code && !a.e[2].includes(code)) return err(`That doesn’t sound right: “${a.w}” (${a.en}) doesn’t describe ${ID_KIND[s.n?.cat] || 'people'}.`, i - 1);
    if (is(peek(), 'adv', 'sekali')) { if (P.deg) return err('Use “sangat” or “sekali”, not both: “sangat besar” or “besar sekali”.', i); P.deg = T[i++]; }
    if (peek()?.k === 'adj') return err('One describing word is enough here.', i);
  } else if (P.mod?.w === 'mau' && (v.k === 'noun' || is(v, 'det') && v.kind !== 'dem')) {
    if (s.alone || s.cat !== 'person' && s.cat !== 'animal') return err('Start with a person or an animal.', s.start);
    const o = NP(); if (isErr(o)) return o;
    P.verb = { k: 'verb', w: 'mau', e: ['mau', '', 'tr', ['*'], ['want', 'wants', 'wanted', 'wanting', 'wanted'], 'a'], type: 'tr' }; P.want = P.mod; P.mod = null; P.obj = o; P.kind = 'act';
  } else if (is(v, 'verb', 'adalah') || v.k === 'noun' || is(v, 'det') && v.kind !== 'dem' || v.k === 'pron' && v.q !== 'apa' && v.q !== 'mana') {
    if (P.mod || P.freq || P.asp) { const x = P.mod || P.freq || P.asp; return err(`“${x.w}” doesn’t go before a noun. ${P.mod?.w === 'mau' ? '' : ''}`.trim(), T.indexOf(x)); }
    if (is(v, 'verb', 'adalah')) {
      if (P.neg) return err(`Leave out “adalah” after “${P.neg.w}”: “bukan ${peek(1)?.w || 'guru'}”.`, i);
      P.cop = T[i++];
      if (peek()?.k === 'adj' || how(peek(), 'deg')) return err(`No “adalah” before a describing word: just “${T.slice(0, i - 1).map(t => t.w).join(' ')} ${peek().w}”.`, i - 1);
    }
    if (P.neg?.w === 'tidak') return err(`Before a noun, “not” is “bukan”: “bukan ${peek().w}”. (“tidak” is for verbs and describing words.)`, T.indexOf(P.neg));
    if (is(peek(), 'pron', 'siapa')) { P.predQ = T[i++]; P.kind = 'noun'; }
    else {
      const o = NP(); if (isErr(o)) return o;
      if (o.none) return err('A noun goes here: “guru”, “teman saya”.', i);
      if (o.n.k === 'pron' && !s.alone) return err(`“${o.n.w}” here doesn’t make a sentence. Try a noun: “Dia guru”.`, o.start);
      if (s.n && s.cat !== '*' && o.cat !== s.cat) return err(`That doesn’t sound right: ${T.slice(s.start, s.end).map(t => t.w).join(' ')} isn’t ${ID_KIND[o.cat] ? 'one of the ' + ID_KIND[o.cat] : 'that'}.`, o.start);
      P.obj = o; P.kind = 'noun';
    }
  } else if (is(v, 'prep', 'di') || is(v, 'verb', 'ada') && is(peek(1), 'prep', 'di')) {
    if (P.mod || P.freq || P.asp && P.asp.w !== 'akan' && P.asp.w !== 'sudah') { const x = P.mod || P.freq || P.asp; return err(`“${x.w}” goes with a verb.`, T.indexOf(x)); }
    if (P.neg?.w === 'bukan') return err('To say someone isn’t somewhere, use “tidak”: “Saya tidak di rumah”.', T.indexOf(P.neg));
    if (is(v, 'verb', 'ada')) i++;
    const at = i; i++;
    if (is(peek(), 'pron', 'mana')) { P.place = { q: T[i++] }; }
    else { const pl = NP(); if (isErr(pl)) return pl; if (pl.none || pl.cat !== 'place') return err('After “di” comes a place: “di rumah”, “di sekolah”.', at + 1); P.place = pl; }
    P.kind = 'at';
  } else if (is(v, 'prep', 'ke')) {
    return err(`Add a verb before “ke”: “${T.slice(0, i).map(t => t.w).join(' ')} pergi ke …”.`, i);
  } else if (v.k === 'verb') {
    i++;
    if (v.type === 'root') return err(`“${v.w}” is the root. In a full sentence, say “${v.e[0]}”. (In casual talk people drop the ${v.e[0].replace(v.e[1], '')}-, but the game uses the standard form.)`, i - 1);
    if (v.type === 'cop') return err('“adalah” goes before a noun.', i - 1);
    if (v.type === 'ada') return err('Put “ada” at the start (Ada kucing di taman), or say where with “di”.', i - 1);
    if (v.type === 'mod') return err(`After “${v.w}” comes a verb${v.w === 'mau' ? ' (or what you want)' : ''}.`, i);
    if (P.mod && v.type === 'pass') return err(`After “${P.mod.w}”, use the active verb: “${v.e[0]}”.`, i - 1);
    const who = s.alone ? null : s.n;
    if (v.type === 'pass') {
      if (who?.k === 'pron' && who.per !== '3') return err(`“${v.w}” is the passive (is ${v.e[4][4]}). For “${who.en} ${v.e[4][0]}”, say “${who.w} ${v.e[0]}”.`, i - 1);
      if (s.cat && s.cat !== '*' && v.e[3] && !v.e[3].includes('*') && !v.e[3].includes(s.cat)) return err(`That doesn’t sound right: you don’t ${v.e[4][0]} ${ID_KIND[s.cat]}.`, i - 1);
      if (P.asp?.w === 'sedang') return err('Use “sedang” with an active verb: “Guru sedang membaca buku”.', T.indexOf(P.asp));
      P.verb = v; P.kind = 'pass';
      const byAt = i;
      if (is(peek(), 'prep', 'oleh')) i++;
      if (peek()?.k === 'noun' || peek()?.k === 'pron' && !peek().q || is(peek(), 'det') && peek().kind !== 'dem') {
        const ag = NP(); if (isErr(ag)) return ag;
        if (ag.n.k === 'pron' && ag.n.per !== '3') return err(`With “${ag.n.w}” as the doer, say it the active way: “${ag.n.w[0].toUpperCase() + ag.n.w.slice(1)} ${v.e[0]} …”.`, ag.start);
        if (ag.cat !== 'person' && ag.cat !== 'animal') return err(`After “oleh” (by) comes who does it.`, ag.start);
        P.by = ag;
      } else if (i > byAt) return err('After “oleh” (by) comes who does it: “oleh guru”.', i);
    } else {
      if (s.alone || s.cat && s.cat !== 'person' && s.cat !== 'animal') return err(`${s.alone ? '“' + s.dem.w + '”' : 'Things'} can’t ${v.e[4][0]}. Start with a person or an animal.`, s.start);
      if (s.cat === 'animal' && v.e[5] === 'p') return err(`That doesn’t sound right: animals don’t ${v.e[4][0]}.`, i - 1);
      if (P.asp?.w === 'sedang' && T0?.when === 'hab') return err('“sedang” is for right now. For every day, leave it out.', T.indexOf(P.asp));
      P.verb = v; P.kind = 'act';
      if (v.type === 'go' || v.type === 'home') {
        if (is(peek(), 'prep', 'di') && (peek(1)?.k === 'noun' || is(peek(1), 'pron', 'mana'))) return err(`For where you go, use “ke”: “${v.w} ke ${peek(1).w}”. (“di” is for where you are.)`, i);
        if (is(peek(), 'prep', 'ke')) {
          const at = i; i++;
          if (is(peek(), 'pron', 'mana')) P.obj = { q: T[i++] };
          else { const pl = NP(); if (isErr(pl)) return pl; if (pl.none || pl.cat !== 'place') return err('After “ke” comes a place: “ke sekolah”, “ke pasar”.', at + 1); P.obj = pl; }
        } else if (v.type === 'go') {
          if (peek()?.k === 'noun') return err(`Put “ke” (to) before the place: “${v.w} ke ${peek().w}”.`, i);
          if (v.w === 'pergi' && !is(peek(), 'prep', 'dengan')) return err(`Say where: “pergi ke sekolah”, “pergi ke pasar”.`, i);
        }
      } else if (v.type === 'in') {
        if (peek()?.k === 'noun' || is(peek(), 'det') && peek().kind !== 'dem') return err(`“${v.w}” (${v.e[4][0]}) doesn’t take an object.`, i);
      } else {
        if (P.mod?.w === 'mau' && false) {}
        if (is(peek(), 'pron', ['apa', 'siapa'])) { const q = T[i++]; if (q.w === 'siapa' && !(v.e[3].includes('*') || v.e[3].includes('person'))) return err(`You don’t ${v.e[4][0]} people. Ask with “apa”.`, i - 1); if (q.w === 'apa' && v.e[3].length === 2 && v.e[3].includes('person')) return err('For people, ask with “siapa”.', i - 1); P.obj = { q }; }
        else {
          const o = NP(); if (isErr(o)) return o;
          if (o.none && v.e[6] && !peek()?.k?.match(/^(noun|adj)$/)) { o.skip = true; }
          else if (o.none) return err(`Say what: “${v.w} ${idNounBy(v.e[3][0] === '*' ? 'buku' : ID_NOUN.find(n => n[1] === v.e[3][0])?.[0] || 'buku')?.[0] || 'buku'}”.`, i);
          if (o.skip) {} else {
          if (!v.e[3].includes('*') && !v.e[3].includes(o.cat)) return err(`That doesn’t sound right: you don’t ${v.e[4][0]} ${ID_KIND[o.cat] || 'that'}.`, o.start);
          if (o.n.k === 'pron' && persons(s) && o.n.w === persons(s).w) return err(`“${o.n.w}” twice: for “myself, yourself…”, Indonesian says “diri sendiri”.`, o.start);
          if (!o.skip) P.obj = o;
          if (!o.skip && is(peek(), 'conj', 'dan')) {
            i++; const o2 = NP(); if (isErr(o2)) return o2;
            if (o2.none || o2.n.k === 'pron') return err('After “dan” comes another noun: “nasi dan ikan”.', i);
            if (!v.e[3].includes('*') && !v.e[3].includes(o2.cat)) return err(`That doesn’t sound right: you don’t ${v.e[4][0]} ${ID_KIND[o2.cat] || 'that'}.`, o2.start);
            P.obj2 = o2;
          }
          }
        }
      }
    }
  } else if (is(v, 'pron', ['apa', 'mana'])) {
    return err(`“${v.w}” goes after the verb: “Kamu makan ${v.w === 'apa' ? 'apa' : '…'}?”${v.w === 'mana' ? ' (where = di mana / ke mana)' : ''}`, i);
  } else if (isDem(v)) return err(`“${v.w}” goes right after the noun it points to: “buku ${v.w}”.`, i);
  else if (v.k === 'conj') return err('“dan” (and) goes between two nouns: “nasi dan ikan”.', i);
  else return err(`“${v.w}” can’t go here.`, i);
  // after the verb: di + place, dengan + someone, then a time word
  for (;;) {
    const t = peek();
    if (is(t, 'prep', 'di') && P.kind === 'act' || is(t, 'prep', 'di') && P.kind === 'pass') {
      if (P.place) return err('Say the place only once.', i);
      if (P.verb.type === 'go' && P.obj) return err('Say the place only once.', i);
      const at = i; i++;
      if (is(peek(), 'pron', 'mana')) P.place = { q: T[i++] };
      else { const pl = NP(); if (isErr(pl)) return pl; if (pl.none || pl.cat !== 'place') return err('After “di” comes a place: “di rumah”, “di sekolah”.', at + 1); P.place = pl; }
      continue;
    }
    if (is(t, 'prep', 'ke')) return err(P.kind === 'act' && P.verb.type !== 'go' && P.verb.type !== 'home' ? `For where you do it, use “di”: “di ${peek(1)?.w || 'rumah'}”. (“ke” is for where you go.)` : 'Say the place only once.', i);
    if (is(t, 'prep', 'dengan') && P.kind === 'act') {
      if (P.with) return err('Say who it’s with only once.', i);
      const at = i; i++; const w = NP(); if (isErr(w)) return w;
      if (w.none || w.cat !== 'person' && w.cat !== 'animal') return err('After “dengan” (with) comes a person or an animal: “dengan teman”.', at + 1);
      if (w.n.k === 'pron' && persons(s) && w.n.w === persons(s).w) return err(`“${w.n.w}” twice.`, w.start);
      P.with = w; continue;
    }
    break;
  }
  if (how(peek(), 'time')) { if (P.time) return err('One time word is enough.', i); P.time = T[i++]; }
  if (is(peek(), 'adv', 'juga')) return err('“juga” (also) goes right after who: “Saya juga …”.', i);
  if (peek()) return err(peek().k === 'pron' && peek().q ? `Put “${peek().w}” where the answer goes.` : peek().k === 'noun' && T[i - 1]?.k === 'noun' ? `Two nouns in a row. To say whose it is, put the owner after the thing as a pronoun: “${T[i - 1].w} saya” (my ${T[i - 1].en}).` : `The sentence is done before “${peek().w}”.`, i);
  // whole-sentence checks
  const when = P.time?.when;
  if (when === 'past' && P.asp?.w === 'akan') return err('“kemarin” (yesterday) and “akan” (will) don’t go together.', T.indexOf(P.asp));
  if (when === 'fut' && (P.asp?.w === 'sudah' || P.asp?.w === 'belum')) return err(`With “${P.time.w}”, use “akan” or just the verb.`, T.indexOf(P.asp));
  if (when === 'past' && P.mod?.w === 'bisa' && P.neg) {}
  const qs = T.filter(t => t.k === 'pron' && t.q && t !== P.yn);
  if (P.yn && qs.length) return err(`A question with “${qs[0].w}” doesn’t need “${P.yn.w}” at the start.`, 0);
  if (qs.length > 1) return err('Ask one thing at a time.', T.indexOf(qs[1]));
  P.q = qs[0] || null;
  if (P.q && P.with?.n?.q) return err('Ask one thing at a time.', i);
  return { ok: true, P };
}

/* ---------------- what it means in English ---------------- */
const nNegX = P => !!P.neg || P.asp?.w === 'belum';
function idNpEn(np, role, ctx = {}) {
  if (!np) return '';
  if (np.q) return np.q.q === 'mana' ? 'where' : np.q.en;
  if (np.alone) return np.dem.w === 'ini' ? (ctx.pl ? 'these' : 'this') : (ctx.pl ? 'those' : 'that');
  const n = np.n;
  if (n.k === 'pron') return role === 'subj' ? n.e[1] : ID_OBJ_EN[n.w];
  const pl = n.pl || np.det && (np.det.kind === 'num' || np.det.kind === 'many'), mass = n.e[4].includes('m');
  const flags = n.e[4], adjs = np.adjs.map(a => a.en).join(' ');
  let core = [adjs, pl && !mass ? n.e[3] : n.e[2]].filter(Boolean).join(' ');
  if (np.det?.kind === 'num') return `${np.det.en} ${core}` + (np.dem ? '' : '');
  if (np.det?.kind === 'many') return `${mass ? 'a lot of' : np.det.en} ${core}`;
  if (np.det?.kind === 'cl') return (/^[aeiou]/i.test(core) ? 'an ' : 'a ') + core;
  if (np.owner) return ID_POSS_EN[np.owner.w] + ' ' + core;
  if (np.dem) return (np.dem.w === 'ini' ? (pl ? 'these ' : 'this ') : (pl ? 'those ' : 'that ')) + core;
  if (flags.includes('n')) return core;
  if (flags.includes('f') && !adjs) return core === 'mother' ? 'Mom' : core === 'father' ? 'Dad' : 'my ' + core;
  if (role === 'subj' || ctx.the) return 'the ' + core;
  if (mass || pl) return core;
  return (/^[aeiou]/i.test(core) ? 'an ' : 'a ') + core;
}
function idPlaceEn(np, how) {   // how: 'at' or 'to'
  if (np.q) return '';
  const plain = !np.owner && !np.dem && !np.adjs.length && !np.det;
  if (plain && how === 'to' && ID_PLACE_TO[np.n.w]) return ID_PLACE_TO[np.n.w];
  if (plain && how === 'at' && ID_PLACE_AT[np.n.w]) return ID_PLACE_AT[np.n.w];
  const s = idNpEn(np, 'obj', { the: true });
  return (how === 'to' ? 'to ' : /park|room|city|Jakarta/.test(np.n.e[2]) ? 'in ' : 'at ') + s;
}
function idEnglish(P) {
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const s = P.subj, plPred = P.obj?.n?.pl || P.obj?.det && P.obj.det.kind !== 'cl';
  const sEn = s ? idNpEn(s, 'subj', { pl: s.alone && P.kind === 'noun' && plPred }) : '';
  const sp = !s ? '3' : s.n?.k === 'pron' ? s.n.per : s.alone ? (plPred ? 'p' : '3') : (s.n?.pl || s.det && s.det.kind !== 'cl') && !s.n?.e[4].includes('m') ? 'p' : '3';
  const third = sp === '3', be = { 1: 'am', 2: 'are', 3: 'is', p: 'are' }[sp], beP = sp === '1' || sp === '3' ? 'was' : 'were';
  const q = P.yn ? 'yn' : P.q || P.predQ ? 'wh' : null, neg = !!P.neg;
  const when = P.time?.when, asp = P.asp?.w;
  const tail = [];
  const timeEn = P.time ? P.time.en : '';
  const also = P.also ? (neg || asp === 'belum' ? 'either' : 'too') : '';
  const fin = (x) => { const t = [x, ...tail, also, timeEn].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim(); return cap(t) + (q ? '?' : '.'); };
  // is / are / was / will be
  const beForm = (n) => {
    const fut = when === 'fut' || asp === 'akan', past = when === 'past';
    if (q === 'yn') return { aux: fut ? (n ? "won't" : 'will') : past ? beP + (n ? "n't" : '') : (n ? (sp === '1' ? 'am' : be + "n't") : be), rest: fut ? 'be' : '', notAfter: n && !fut && !past && sp === '1' };
    return { v: fut ? (n ? "won't be" : 'will be') : past ? beP + (n ? "n't" : '') : n ? (sp === '1' ? 'am not' : be + "n't") : be };
  };
  const beSentence = (compl, whWord) => {
    const extra = asp === 'sudah' ? 'already' : asp === 'belum' ? '' : '';
    const n = neg || asp === 'belum';
    if (asp === 'belum') tail.push('yet');
    if (whWord) { const b = beForm(false); return fin(`${whWord} ${b.aux || b.v} ${sEn}${b.rest ? ' ' + b.rest : ''}`.replace(/^(\w+) will (\S+) be$/, '$1 will $2 be')); }
    const b = beForm(n);
    if (q === 'yn') return fin(`${b.aux} ${sEn}${b.notAfter ? ' not' : ''} ${b.rest} ${extra} ${compl}`);
    return fin(`${sEn} ${b.v} ${extra} ${compl}`);
  };
  if (P.kind === 'adj') return beSentence((P.deg ? 'very ' : '') + P.adj.en);
  if (P.kind === 'noun') {
    if (P.predQ) { const w = P.predQ.w === 'siapa' ? 'who' : 'what'; const b = beForm(false); return fin(`${w} ${b.aux || b.v} ${sEn}`); }
    const o = P.obj, opl = o.n.pl || o.det && o.det.kind !== 'cl';
    let c = o.n.k === 'pron' ? ID_OBJ_EN[o.n.w] : idNpEn(o, 'obj');
    if (o.n.k === 'noun' && !o.det && !o.owner && !o.dem && o.n.e[3] && sp === 'p') c = [...o.adjs.map(a => a.en), o.n.e[3]].join(' ');
    else if (o.n.k === 'noun' && o.n.e[4].includes('f') && !o.owner && !o.adjs.length) c = 'a ' + o.n.e[2];
    if (P.q?.q === 'siapa') return fin(`who ${beForm(false).aux || beForm(false).v} ${sEn}`);
    return beSentence(c);
  }
  if (P.kind === 'at') {
    if (P.place.q) { const b = beForm(neg); return fin(`where ${b.aux || b.v} ${sEn}${b.rest ? ' ' + b.rest : ''}`); }
    return beSentence(idPlaceEn(P.place, 'at'));
  }
  if (P.kind === 'exist') {
    const o = P.obj, many = o.n.pl || o.det && o.det.kind !== 'cl' && !o.n.e[4].includes('m'), w = idPlaceEn(P.where, 'at').replace(/^at home$/, 'at home');
    const fut = when === 'fut', past = when === 'past';
    const isW = fut ? 'will be' : past ? (many ? 'were' : 'was') : many ? 'are' : 'is';
    const thing = idNpEn(o, 'obj');
    if (neg) { const t2 = o.det ? thing : o.n.e[4].includes('m') || many ? 'any ' + thing : thing; return fin(`there ${fut ? "won't be" : past ? (many ? "weren't" : "wasn't") : many ? "aren't" : "isn't"} ${t2} ${w}`); }
    if (q === 'yn') return fin(fut ? `will there be ${thing} ${w}` : `${past ? (many ? 'were' : 'was') : many ? 'are' : 'is'} there ${thing} ${w}`);
    return fin(`there ${isW} ${thing} ${w}`);
  }
  // actions and the passive
  const v = P.verb, F = v.e[4];
  let tense = asp === 'sedang' ? (when === 'past' ? 'pastprog' : when === 'fut' ? 'futprog' : 'prog') : asp === 'akan' || when === 'fut' ? 'fut' : asp === 'sudah' ? (when === 'past' ? 'past' : 'perf') : asp === 'belum' ? (when === 'past' ? 'pastperf' : 'perf') : when === 'past' ? 'past' : when === 'now' && P.time?.w === 'sekarang' && P.kind === 'act' && !P.mod && !P.freq && v.type !== 'like' && v.type !== 'have' && !P.want ? 'prog' : (v.type === 'go' || v.type === 'home') && P.q?.q === 'mana' && !P.mod && !P.freq && !when && !nNegX(P) ? 'prog' : 'pres';
  const nNeg = neg || asp === 'belum';
  if (asp === 'belum' || asp === 'sudah' && q && tense === 'perf') tail.push('yet');   // Sudah makan? = Have you eaten yet?
  // the object, the place, who with
  let objEn = '';
  if (P.kind === 'act') {
    if (v.type === 'go' || v.type === 'home') {
      if (P.obj && !P.obj.q) objEn = v.type === 'home' ? (P.obj.n.w === 'rumah' && !P.obj.owner && !P.obj.dem && !P.obj.adjs.length ? '' : idPlaceEn(P.obj, 'to').replace(/^to /, 'to ')) : idPlaceEn(P.obj, 'to');
    } else if (P.obj && !P.obj.q) {
      objEn = idNpEn(P.obj, 'obj');
      if (P.obj2) objEn += ' and ' + idNpEn(P.obj2, 'obj');
    }
  }
  const tl = [];
  if (P.kind === 'pass' && P.by) tl.push('by ' + idNpEn(P.by, 'obj', { the: true }));
  if (P.place && !P.place.q) tl.push(idPlaceEn(P.place, 'at'));
  if (P.with) tl.push('with ' + idNpEn(P.with, 'obj', { the: true }));
  tail.unshift(...tl);
  let F2 = F;
  if (v.type === 'home' && objEn) F2 = ['go back', 'goes back', 'went back', 'going back', 'gone back'];
  const has = third ? 'has' : 'have', does = third ? 'does' : 'do';
  const wh = P.q ? (P.q.q === 'mana' ? 'where' : P.q.en) : null;
  // the passive: is read / was read / will be read / has been read
  if (P.kind === 'pass') {
    const pp = F[4], b = { pres: be, past: beP, fut: 'will be', perf: has + ' been', pastperf: 'had been', prog: be + ' being', pastprog: beP + ' being', futprog: 'will be' }[tense];
    const nb = { pres: sp === '1' ? 'am not' : be + "n't", past: beP + "n't", fut: "won't be", perf: has + "n't been", pastperf: "hadn't been", prog: be + "n't being", pastprog: beP + "n't being", futprog: "won't be" }[tense];
    if (q === 'yn') { const [a, ...r] = (nNeg ? nb : b).split(' '); return fin(`${a} ${sEn} ${r.join(' ')} ${pp}`); }
    if (wh === 'where') { const [a, ...r] = b.split(' '); return fin(`where ${a} ${sEn} ${r.join(' ')} ${pp}`); }
    return fin(`${sEn} ${nNeg ? nb : b} ${pp}`);
  }
  // the verb group, with mau / bisa / harus
  let vp, aux = null, main;
  const often = P.freq ? (P.freq.w === 'selalu' ? 'always' : 'often') : '';
  if (P.mod) {
    const M = P.mod.e[1], w = P.mod.w, base = P.verb ? F2[0] : '';
    const past = tense === 'past';
    if (w === 'bisa') { aux = past ? (nNeg ? "couldn't" : 'could') : tense === 'fut' ? (nNeg ? "won't be able to" : 'will be able to') : nNeg ? "can't" : 'can'; main = base; }
    else if (w === 'harus') { aux = past ? (nNeg ? "didn't have to" : 'had to') : tense === 'fut' ? (nNeg ? "won't have to" : 'will have to') : nNeg ? (third ? "doesn't have to" : "don't have to") : 'must'; main = base; }
    else { aux = past ? (nNeg ? "didn't want to" : 'wanted to') : tense === 'fut' ? (nNeg ? "won't want to" : 'will want to') : nNeg ? (third ? "doesn't want to" : "don't want to") : third ? 'wants to' : 'want to'; main = base; }
    if (q === 'yn') {
      const yn = { bisa: past ? 'could' : 'can', harus: past ? 'did' : third ? 'does' : 'do', mau: past ? 'did' : third ? 'does' : 'do' }[w], rest = { bisa: '', harus: 'have to', mau: 'want to' }[w];
      return fin(`${yn}${nNeg && w !== 'bisa' ? "n't" : nNeg ? "n't" : ''} ${sEn} ${often} ${rest} ${main} ${objEn}`);
    }
    if (wh) {
      const yn = { bisa: past ? 'could' : 'can', harus: past ? 'did' : third ? 'does' : 'do', mau: past ? 'did' : third ? 'does' : 'do' }[w], rest = { bisa: '', harus: 'have to', mau: 'want to' }[w];
      return fin(`${wh} ${yn}${nNeg ? "n't" : ''} ${sEn} ${often} ${rest} ${main} ${objEn}`);
    }
    return fin(`${sEn} ${often} ${aux} ${main} ${objEn}`);
  }
  const forms = {
    pres: [nNeg ? does + "n't" : null, nNeg ? F2[0] : third ? F2[1] : F2[0]], past: [nNeg ? "didn't" : null, nNeg ? F2[0] : (asp === 'sudah' ? 'already ' : '') + F2[2]], fut: [nNeg ? "won't" : 'will', F2[0]],
    perf: [has + (nNeg ? "n't" : ''), F2[4]], pastperf: ['had' + (nNeg ? "n't" : ''), F2[4]], prog: [nNeg ? (sp === '1' ? 'am not' : be + "n't") : be, F2[3]],
    pastprog: [beP + (nNeg ? "n't" : ''), F2[3]], futprog: [nNeg ? "won't be" : 'will be', F2[3]] }[tense];
  if (q === 'yn' || wh) {
    const qa = { pres: does, past: 'did', fut: 'will', perf: has, pastperf: 'had', prog: be, pastprog: beP, futprog: 'will' }[tense] + (nNeg ? "n't" : '');
    const qm = { pres: F2[0], past: (asp === 'sudah' ? 'already ' : '') + F2[0], fut: F2[0], perf: F2[4], pastperf: F2[4], prog: F2[3], pastprog: F2[3], futprog: 'be ' + F2[3] }[tense];
    return fin(`${wh ? wh + ' ' : ''}${qa} ${sEn} ${often} ${qm} ${objEn}`);
  }
  vp = forms[0] ? `${forms[0]} ${often} ${forms[1]}` : `${often} ${forms[1]}`;
  if (asp === 'sudah' && tense === 'perf') vp = vp.replace(/^(has|have)\s+/, '$1 already ');
  return fin(`${sEn} ${vp} ${objEn}`);
}

/* ---------------- making an Indonesian tray ---------------- */
function idGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = list => { const fav = list.filter(x => pref.has(x[0])); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const nounOf = cats => RP(ID_NOUN.filter(n => cats[0] === '*' ? true : cats.includes(n[1])));
  const extra = [];
  // a noun phrase: sometimes doubled, counted, described, owned or pointed at
  const np = (n, out, o = {}) => {
    const mass = n[4].includes('m'), fam = n[4].includes('f'), name = n[4].includes('n');
    let pl = false;
    if (!mass && !fam && !name && !o.bare && coin(0.3)) {
      const r = Math.random();
      if (r < 0.35) { out.push(idDet(R(['dua', 'tiga', 'lima', 'banyak', 'beberapa']))); extra.push(idNoun(n, true)); }
      else if (r < 0.65 && n[5] && !o.noCl) { out.push(idDet(ID_CL_FOR[n[5]])); extra.push(idDet(R(Object.values(ID_CL_FOR).filter(c => c !== ID_CL_FOR[n[5]])))); o.noDem = true; }
      else pl = true;
    } else if (mass && !o.bare && coin(0.1)) out.push(idDet('banyak'));
    out.push(idNoun(n, pl));
    if (pl) extra.push(idNoun(n));
    if (!name && o.adj !== false && coin(0.3)) { const a = RP(ID_ADJ.filter(x => x[2].includes(ID_CAT[n[1]]))); if (a) out.push(idAdj(a)); }
    let owned = false;
    if (!name && !o.noOwner && (n[1] !== 'place' || /^(rumah|kamar)$/.test(n[0])) && !out.some(t => t.k === 'det' && t.kind !== 'dem') && (fam ? coin(0.7) : coin(0.2))) { out.push(idPron(R(ID_PRON.filter(p => p[0] !== 'aku' && p[0] !== 'Anda')))); owned = true; }
    if (!name && !owned && !o.noDem && !out.slice(-3).some(t => t.k === 'det') && coin(o.dem ?? 0.25)) out.push(idDet(R(['ini', 'itu'])));
  };
  for (let tries = 0; tries < 200; tries++) {
    extra.length = 0;
    const out = [], kind = R(['tr', 'tr', 'tr', 'in', 'go', 'go', 'adj', 'adj', 'noun', 'at', 'exist', 'have', 'pass', 'mod']);
    const ask = coin(0.2) ? (coin(0.55) ? 'yn' : 'wh') : null;
    if (ask === 'yn') out.push(idApakah());
    let time = null, timeAt = null;
    if (!['noun'].includes(kind) && coin(0.35)) { time = idAdv(R(['hari ini', 'besok', 'kemarin', 'sekarang', 'nanti', 'setiap hari'])); timeAt = R(['start', 'end', 'end']); }
    let subjCat = 'person', subjPron = null;
    const pushSubj = (cats = ['person', 'animal']) => {
      if (coin(0.5)) { subjPron = R(ID_PRON); out.push(idPron(subjPron)); }
      else { const n = nounOf(cats); subjCat = n[1]; np(n, out, { dem: 0.5, noOwner: n[4].includes('f') ? false : coin(0.5), noCl: !['tr', 'in', 'go', 'mod'].includes(kind) }); }
    };
    const negW = !ask && coin(0.25);
    if (kind === 'exist') {
      const front = coin(0.4), pl = RP(ID_NOUN.filter(n => n[1] === 'place' && n[0] !== 'Jakarta'));
      const where = []; where.push(idPrep('di')); np(pl, where, { adj: false, bare: true, noDem: true });
      if (front) out.push(...where);
      if (negW) { out.push(idAdv('tidak')); extra.push(idAdv('bukan')); }
      out.push(idAda());
      const n = RP(ID_NOUN.filter(x => ['animal', 'thing', 'read', 'food', 'person'].includes(x[1]) && !x[4].includes('f')));
      np(n, out, { noDem: true, noOwner: true, adj: false, bare: negW });
      if (!front) out.push(...where);
    } else if (kind === 'pass') {
      const v = R(ID_VERB.filter(x => x[2] === 'tr' && !x[3].includes('person') && x[3][0] !== '*' || x[2] === 'tr' && x[0] === 'melihat'));
      const n = nounOf(v[3][0] === '*' ? ['thing', 'read', 'food'] : v[3]);
      np(n, out, { dem: 0.7, noCl: true });
      if (negW) { out.push(idAdv('tidak')); extra.push(idAdv('bukan')); }
      else if (coin(0.35)) out.push(idAdv(R(['sudah', 'akan'])));
      out.push(idPass(v));
      extra.push(idVerb(v));
      if (coin(0.8)) { if (coin(0.6)) out.push(idPrep('oleh')); const who = coin(0.4) ? R(['dia', 'mereka']) : null; if (who) out.push(idPron(ID_PRON.find(p => p[0] === who))); else np(nounOf(['person']), out, { adj: false, noDem: true, bare: true, noOwner: true }); }
      if (time && (out.find(t => t.w === 'akan') && time.when === 'past' || out.find(t => t.w === 'sudah') && time.when === 'fut')) time = null;
    } else {
      pushSubj(kind === 'adj' ? ['person', 'animal', 'thing', 'place', 'food'] : kind === 'at' ? ['person', 'animal', 'thing'] : kind === 'noun' || kind === 'have' || kind === 'mod' ? ['person'] : ['person', 'animal']);
      if (kind === 'noun' && coin(0.3)) { out.length = out[0]?.w === 'apakah' ? 1 : 0; out.push(idDet(R(['ini', 'itu']))); subjPron = null; subjCat = '*'; }
      if (coin(0.1) && kind !== 'noun') out.push(idAdv('juga'));
      if (time && timeAt === 'mid') out.push(time);
      if (kind === 'adj') {
        const code = subjPron ? 'p' : ID_CAT[subjCat], a = RP(ID_ADJ.filter(x => x[2].includes(code)));
        if (!a) continue;
        if (negW) { out.push(idAdv('tidak')); extra.push(idAdv('bukan')); }
        else if (coin(0.15)) out.push(idAdv('sudah'));
        const deg = !negW && coin(0.3) ? R(['sangat', 'sekali']) : null;
        if (deg === 'sangat') out.push(idAdv('sangat'));
        out.push(idAdj(a));
        if (deg === 'sekali') out.push(idAdv('sekali'));
        extra.push(idCop());
        if (time && (time.when === 'hab' || !ID_MOOD.test(a[0]))) time = null;
        if (time && out.some(t => t.w === 'sudah') && time.when === 'fut') time = null;
      } else if (kind === 'noun') {
        const n = subjCat === '*' ? nounOf(['*']) : RP(ID_NOUN.filter(x => x[1] === 'person' && !x[4].includes('f')));
        if (negW) { out.push(idAdv('bukan')); extra.push(idAdv('tidak')); }
        else if (coin(0.35)) out.push(idCop());
        if (ask === 'wh') { out.push(idQ('siapa')); if (subjCat === '*' || out.some(t => t.w === 'adalah')) continue; }
        else np(n, out, { dem: 0, noCl: subjCat !== '*', adj: true, noOwner: false });
        time = null;
      } else if (kind === 'at') {
        if (negW) out.push(idAdv('tidak'));
        out.push(idPrep('di'));
        if (ask === 'wh') out.push(idQ('mana'));
        else np(subjCat === 'place' ? idNounBy('Jakarta') : nounOf(['place']), out, { bare: true, adj: false, noDem: true });
        extra.push(idPrep('ke'));
        if (subjCat !== 'person' && subjCat !== 'animal' && subjCat !== 'place' || subjCat === 'place' && out.at(-1).w === 'Jakarta' && out.filter(t => t.k === 'noun').length < 2) {}
        if (time?.when === 'hab') time = null;
      } else {
        // verbs: with an object, on their own, going somewhere, have, mau / bisa / harus + verb
        const type = kind === 'mod' ? R(['tr', 'in']) : kind;
        const pool = ID_VERB.filter(x => (type === 'have' ? x[2] === 'have' : type === 'tr' ? x[2] === 'tr' || x[2] === 'like' && coin(0.3) : type === 'go' ? x[2] === 'go' || x[2] === 'home' : x[2] === 'in') && (subjCat === 'person' || subjPron || x[5] !== 'p'));
        const v = RP(pool); if (!v) continue;
        let asp = null;
        if (negW) {
          const nw = time?.when !== 'fut' && coin(0.3) && kind !== 'mod' && v[2] !== 'have' && v[2] !== 'like' ? 'belum' : coin(0.2) && kind !== 'mod' ? 'tidak akan' : 'tidak';
          if (nw === 'tidak akan') { out.push(idAdv('tidak'), idAdv('akan')); asp = 'akan'; } else { out.push(idAdv(nw)); if (nw === 'belum') asp = 'belum'; }
          extra.push(idAdv(nw === 'belum' ? 'sudah' : 'bukan'));
        } else if (kind !== 'mod' && coin(0.3)) { asp = R(['sudah', 'akan', 'sedang']); out.push(idAdv(asp)); }
        if (kind === 'mod' && coin(0.25)) { out.push(idMod('mau')); np(nounOf(['food', 'drink', 'thing', 'read']), out, { dem: 0.1 }); if (time?.when === 'hab') time = null; if (time) { if (timeAt === 'start') out.splice(out[0]?.w === 'apakah' ? 1 : 0, 0, time); else out.push(time); } time = null; const r0 = idCheck(out); if (!r0.ok) continue; extra.push(idVerb(idVerbBy('makan'))); return idFinish(out, extra, r0, nounOf); }
        if (kind === 'mod') out.push(idMod(R(['mau', 'bisa', 'harus'])));
        else if (!asp && v[2] !== 'have' && v[2] !== 'like' && (!time || time.when === 'hab') && coin(0.12)) out.push(idAdv(R(['sering', 'selalu'])));
        if (time && (asp === 'akan' && time.when !== 'fut' || (asp === 'sudah' || asp === 'belum') && time.when === 'fut' || asp === 'sedang' && time.when !== 'now' || (v[2] === 'have' || v[2] === 'like') && time.when === 'hab')) time = null;
        out.push(idVerb(v));
        if (v[1] && coin(0.7)) extra.push(idRoot(v));
        if (v[2] === 'tr' && v[1] && coin(0.4)) extra.push(idPass(v));
        if (v[2] === 'home' && ask === 'wh' && !out.some(t => t.q)) continue;
        if (v[2] === 'go' || v[2] === 'home') {
          if (v[2] === 'go' || coin(0.5)) {
            out.push(idPrep('ke')); extra.push(idPrep('di'));
            if (ask === 'wh') out.push(idQ('mana'));
            else { const pl = v[2] === 'home' ? idNounBy('rumah') : subjCat === 'animal' && !subjPron ? idNounBy(R(['rumah', 'taman'])) : RP(ID_NOUN.filter(n => n[1] === 'place')); np(pl, out, { bare: true, adj: false, noDem: true, noOwner: v[2] !== 'home' && coin(0.6) }); }
          }
        } else if (v[2] !== 'in') {
          if (ask === 'wh' && coin(0.7)) out.push(idQ(v[3].includes('person') && v[3].length === 2 ? 'siapa' : v[3][0] === '*' && coin(0.4) ? 'siapa' : 'apa'));
          else {
            const objs = subjCat === 'animal' && !subjPron ? ID_NOUN.filter(n => ['air', 'ikan', 'nasi', 'roti', 'susu', 'kucing', 'burung', 'bola'].includes(n[0]) && (v[3].includes(n[1]) || v[3][0] === '*')) : null;
            if (objs && !objs.length) continue;
            const o = objs ? R(objs) : nounOf(v[3][0] === '*' ? ['person', 'animal', 'thing', 'read', 'food', 'place'] : v[3]);
            if (subjPron && o[4].includes('f') && false) continue;
            np(o, out, { dem: 0.2 });
            if (coin(0.1) && ['food', 'drink'].includes(o[1])) { const o2 = R(ID_NOUN.filter(n => n[1] === o[1] && n[0] !== o[0])); out.push(idDan(), idNoun(o2)); }
          }
        }
        const spots = ID_NOUN.filter(n => n[1] === 'place' && (ID_VERB_AT[v[0]] || '').split(' ').includes(n[0]) && (subjCat !== 'animal' || subjPron || ['rumah', 'taman', 'pantai'].includes(n[0])));
        if (v[2] !== 'go' && v[2] !== 'have' && spots.length && coin(0.25)) {
          if (ask === 'wh' && !out.some(t => t.q) && coin(0.5)) out.push(idPrep('di'), idQ('mana'));
          else { out.push(idPrep('di')); np(R(spots), out, { bare: true, adj: false, noDem: true, noOwner: true }); }
          extra.push(idPrep('ke'));
        }
        if ((subjCat === 'person' || subjPron) && coin(0.12) && v[2] !== 'have') { out.push(idPrep('dengan')); np(RP(ID_NOUN.filter(n => n[1] === 'person' && !out.some(t => t.w === n[0]))), out, { bare: true, adj: false, noDem: true, noOwner: true }); }
      }
    }
    if (time) { if (timeAt === 'start') out.splice(out[0]?.w === 'apakah' ? 1 : 0, 0, time); else out.push(time); }
    if (time) extra.push(idAdv(R(['hari ini', 'besok', 'kemarin'].filter(w => w !== time.w))));
    if (ask === 'wh' && !out.some(t => t.q)) continue;
    if (out.length < 2 || out.length > 13) continue;
    const res = idCheck(out); if (!res.ok) continue;
    return idFinish(out, extra, res, nounOf);
  }
  return null;
}
function idFinish(out, extra, res, nounOf) {
  const R = a => a[Math.floor(Math.random() * a.length)];
  if (!out.some(t => t.w === 'apakah')) extra.push(idApakah());
  extra.push(idNoun(nounOf(['*'])), idAdv(R(['juga', 'sudah', 'akan'])), idAdj(R(ID_ADJ)));
  const seen = new Set(out.map(w => w.w)), uniq = [];
  for (const x of extra.sort(() => Math.random() - 0.5)) if (x && !seen.has(x.w)) { seen.add(x.w); uniq.push(x); }
  return { words: out, extra: uniq.slice(0, Math.max(4, 15 - out.length)), english: idEnglish(res.P) };
}

/* register */
BLD_TYPES.part ||= ['particle', 'marks what a word does: は, を, 了, 吗…'];
BLD_LANGS.id = { name: 'Indonesian', check: idCheck, gen: idGenerate, voice: 'id-ID', english: idEnglish, types: ['pron', 'noun', 'verb', 'adj', 'det', 'prep', 'adv', 'conj', 'part'],
  text: words => { const s = words.map(w => w.w).join(' '); return s[0].toUpperCase() + s.slice(1) + (words.some(w => w.w === 'apakah' || w.q) || words[0]?.w === 'apa' ? '?' : '.'); } };
BLD_ORDER.id = { rows: [
    ['A basic sentence', [['adv', '(time)'], ['pron', 'who'], ['adv', '(sudah / akan / tidak)'], ['verb', 'verb'], ['noun', 'what'], ['prep', '(di + place)'], ['adv', '(time)']]],
    ['A noun with more', [['det', '(dua / sebuah)'], ['noun', 'noun'], ['adj', '(describing word)'], ['pron', '(owner)'], ['det', '(ini / itu)']]],
    ['Describing someone', [['pron', 'who'], ['adv', '(tidak / sangat)'], ['adj', 'describing word'], ['adv', '(sekali)']]],
    ['Who someone is', [['pron', 'who'], ['verb', '(adalah) / bukan'], ['noun', 'noun']]],
    ['Going somewhere', [['pron', 'who'], ['verb', 'pergi'], ['prep', 'ke'], ['noun', 'place']]],
    ['There is…', [['verb', 'ada'], ['noun', 'what'], ['prep', 'di'], ['noun', 'place']]],
    ['A yes/no question', [['part', 'Apakah'], ['pron', 'who'], ['verb', 'verb'], ['noun', 'what'], ['part', '?']]],
  ], tips: [
    ['verb', 'Verbs never change: <b>saya makan</b>, <b>dia makan</b>, <b>kemarin saya makan</b>. For when, add a time word or <b>sudah</b> (done), <b>akan</b> (will), <b>sedang</b> (-ing), <b>belum</b> (not yet).'],
    ['adj', 'Describing words go after the noun: <b>rumah besar</b> (a big house). With no noun after them, they need no “is”: <b>Rumah itu besar.</b>'],
    ['adv', '<b>tidak</b> for verbs and describing words (<b>tidak makan</b>, <b>tidak besar</b>); <b>bukan</b> for nouns (<b>bukan guru</b>).'],
    ['det', '<b>ini</b> (this) and <b>itu</b> (that) go after the noun: <b>buku ini</b>. <b>seorang</b> / <b>seekor</b> / <b>sebuah</b> = “a” for people / animals / things.'],
    ['noun', 'More than one: double the noun (<b>anak-anak</b>), or use a number with the plain noun (<b>dua anak</b>), never both.'],
    ['prep', '<b>ke</b> = to (where you go), <b>di</b> = at / in (where you are or do something): <b>pergi ke pasar</b>, <b>makan di rumah</b>.'],
    ['pron', 'The owner comes after the thing: <b>buku saya</b> (my book), <b>ibu dia</b> (his/her mother). Question words go where the answer goes: <b>Kamu makan apa?</b>'] ] };

/* ---------------- Your own Indonesian words (📚 Add my deck's words) ---------------- */
const ID_BASE = { n: ID_NOUN.length, a: ID_ADJ.length, v: ID_VERB.length };
const idKnown = w => ID_NOUN.slice(0, ID_BASE.n).some(n => n[0] === w) || ID_VERB.slice(0, ID_BASE.v).some(v => v[0] === w || v[1] === w || idPassW(v) === w) || ID_ADJ.slice(0, ID_BASE.a).some(a => a[0] === w)
  || ID_PRON.some(p => p[0].toLowerCase() === w) || ID_ADV.some(a => a[0] === w) || ID_DET.some(d => d[0] === w) || !!ID_PREP[w] || ID_Q.some(q => q[0] === w) || ID_MOD.some(m => m[0] === w) || /^(adalah|ada|apakah|dan)$/.test(w);
function idApplyMine() {
  ID_NOUN.length = ID_BASE.n; ID_ADJ.length = ID_BASE.a; ID_VERB.length = ID_BASE.v;
  for (const m of S.bldWords || []) {
    if (!m || m.lang !== 'id' || !m.w || !m.en || idKnown(m.w)) continue;
    const en = String(m.en).replace(/^(to|the|a|an)\s+/, '');
    if (m.k === 'noun') { const cat = m.cat || 'thing', mass = cat === 'food' || cat === 'drink'; ID_NOUN.push([m.w, cat, en, mass ? null : bldPlEn(en), mass ? 'm' : '', mass ? '' : cat === 'person' ? 'orang' : cat === 'animal' ? 'ekor' : 'buah']); }
    if (m.k === 'verb') {
      const type = m.obj === 'in' ? 'in' : 'tr', objs = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read'];
      const past = /e$/.test(en) ? en + 'd' : en + 'ed', ing = /e$/.test(en) && !/ee$/.test(en) ? en.slice(0, -1) + 'ing' : en + 'ing';
      ID_VERB.push([m.w, '', type, type === 'tr' ? objs : null, [en, bld3sEn(en), past, ing, past], m.who === 'a' ? 'a' : 'p']);
    }
    if (m.k === 'adj') ID_ADJ.push([m.w, en, 'patflr']);
  }
}
if (typeof bldApplyMine === 'function') { const prevApply = bldApplyMine; bldApplyMine = function () { prevApply(); idApplyMine(); }; }
BLD_MINE.id = { name: 'Indonesian', forms: 'the verb (Indonesian verbs don’t change)', nForms: 1, noGender: true, conj: w => [w], pl: w => w + '-' + w, adj: w => [w], minLen: 2,
  guess: (w, en) => /^(hello|hi|thanks?|thank you|bye|goodbye|good|sorry|excuse|please|welcome|you.?re|yes|no|not|how|what|who|where|why|when|which|and|but|or|of|in|on|at)( |$)/i.test(en) ? '' : 'noun',
  known: w => idKnown(w), gender: () => 'm', isVerb: () => true, refl: () => false,
  parse: s => { const m = String(s).trim().match(/^(\p{L}+(?:-\p{L}+)?)$/u); return m ? { w: m[1] } : null; },
  intro: 'words like <i>“to …”</i> are verbs). Indonesian verbs don’t change, so there are no forms to fill in. Use the form you’d say in a sentence (membaca, bekerja), not the root.' };
