'use strict';
/* ================= Indonesian (id): what the whole app needs =================
   Indonesian (id-ID voice) in the shared lists, registered from here so no shared file has to change: 🔢 Numbers & ABC,
   🎙️ Say it!, the starter deck, the word card packs, 🌐 Auto-translate (the Sentence Builder's Indonesian words and the
   Indonesian real sentences), the voice sample and the games page. The deck language list already has id-ID.
   Malay (ms) is not covered: it is close, but its spelling and many everyday words differ.
   Loaded after translate.js and the other Indonesian files (builder-id.js, rsdict-id.js, rstag-id.js, gametr-id*.js). */

if (typeof SAMPLE_SAY !== 'undefined') SAMPLE_SAY.id = 'Halo! Beginilah suara saya.';
if (typeof ISO3 !== 'undefined') ISO3.id ||= 'ind';

/* ---------- 🔢 Numbers & ABC ----------
   satu, dua… sepuluh, sebelas, dua belas, dua puluh, dua puluh satu, seratus, dua ratus, seribu: "one" becomes se- in
   sepuluh, sebelas, seratus and seribu. */
if (typeof NG_LANGS !== 'undefined') {
  NG_LANGS.id = { name: 'Indonesian', flag: '🇮🇩', tts: 'id-ID' };
  NG_WORDS.id = function (n) {
    const u = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
    const two = x => x < 10 ? u[x] : x === 10 ? 'sepuluh' : x === 11 ? 'sebelas' : x < 20 ? u[x - 10] + ' belas' : u[Math.floor(x / 10)] + ' puluh' + (x % 10 ? ' ' + u[x % 10] : '');
    if (n === 1000) return 'seribu'; if (n < 100) return two(n);
    const c = Math.floor(n / 100), r = n % 100;
    return (c === 1 ? 'seratus' : u[c] + ' ratus') + (r ? ' ' + two(r) : '');
  };
  NG_ABC.id = 'a:a b:be c:ce d:de e:e f:ef g:ge h:ha i:i j:je k:ka l:el m:em n:en o:o p:pe q:ki r:er s:es t:te u:u v:fe w:we x:eks y:ye z:zet';
}
// the other ways people write a number: "satu ratus" for seratus, "satu ribu" for seribu, and kosong for nol (0)
if (typeof ngAnswer === 'function') {
  const prevAnswer = ngAnswer;
  ngAnswer = function (given) {
    if (typeof ng !== 'undefined' && ng?.lang === 'id' && ng.mode === 'type' && ng.q && typeof given === 'string') {
      const clean = given.trim().toLowerCase().replace(/[-\s]+/g, ' ');
      const alts = new Set([ng.q.answer, ng.q.answer.replace(/^seratus/, 'satu ratus').replace(/^seribu/, 'satu ribu').replace(/^sepuluh$/, 'satu puluh'), ng.q.answer === 'nol' ? 'kosong' : '']);
      if ([...alts].some(a => a && a === clean)) given = ng.q.answer;
    }
    return prevAnswer(given);
  };
}

/* ---------- 🎙️ Say it!: anak-anak = anak anak = anak2, and -nya, -lah, -kah at the end don't matter ---------- */
if (typeof SK_ARTICLES !== 'undefined') SK_ARTICLES.id = ['si', 'sang'];
if (typeof skMatch === 'function') {
  const prevMatch = skMatch;
  const idSk = s => String(s).toLowerCase().replace(/(\p{L}+)2(?!\d)/gu, '$1 $1').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
  const idBare = s => s.replace(/(nya|lah|kah)\b/g, '');
  skMatch = function (heard, card, lang) {
    const r = prevMatch(heard, card, lang);
    if (r.ok || String(lang || '').split('-')[0].toLowerCase() !== 'id') return r;
    const answers = skAnswers(card, lang).map(idSk);
    for (const h of heard) {
      const said = idSk(skNorm(h, lang));
      for (const a of answers) if (said === a || (' ' + said + ' ').includes(' ' + a + ' ') || idBare(said) === idBare(a)) return { ok: true, close: false, heard: h };
    }
    return r;
  };
}

/* ---------- an Indonesian starter deck (New deck window) ---------- */
if (typeof STARTERS !== 'undefined') STARTERS.id = { name: 'Indonesian basics (sample)', flag: '🇮🇩', label: 'Indonesian', frontLang: 'id-ID', backLang: 'en-US', cards: [
  ['halo', 'hello'], ['selamat pagi', 'good morning'], ['terima kasih', 'thank you'], ['sama-sama', 'you’re welcome'], ['tolong', 'please (help me)'], ['maaf', 'sorry'],
  ['sampai jumpa', 'goodbye'], ['ya', 'yes'], ['tidak', 'no / not', 'For verbs and describing words: tidak makan, tidak besar'], ['bukan', 'not (a noun)', 'Dia bukan guru = He/she isn’t a teacher'],
  ['saya', 'I / me'], ['kamu', 'you'], ['dia', 'he / she', 'One word for both'], ['kita', 'we (and you)'], ['kami', 'we (not you)'],
  ['kucing', 'cat', 'a cat: seekor kucing'], ['anjing', 'dog'], ['rumah', 'house / home', 'at home: di rumah'], ['air', 'water'], ['nasi', 'rice (cooked)'], ['roti', 'bread'],
  ['buku', 'book', 'a book: sebuah buku · books: buku-buku'], ['sekolah', 'school'], ['teman', 'friend'], ['guru', 'teacher', 'a teacher: seorang guru'],
  ['makan', 'to eat'], ['minum', 'to drink'], ['membaca', 'to read', 'From baca'], ['bekerja', 'to work', 'From kerja'], ['pergi', 'to go', 'go to: pergi ke'], ['punya', 'to have'], ['suka', 'to like'],
  ['besar', 'big', 'After the noun: rumah besar'], ['kecil', 'small'], ['baru', 'new'], ['enak', 'tasty'], ['hari ini', 'today'], ['besok', 'tomorrow'], ['kemarin', 'yesterday'],
  ['sudah', 'already (done)', 'Saya sudah makan = I have eaten'], ['belum', 'not yet'], ['Apa kabar?', 'How are you?'], ['Di mana toilet?', 'Where is the bathroom?']] };

/* ---------- 🎴 Word card packs: the Indonesian name of every card ---------- */
// in card order (1–150)
const ID_PACK = ('kucing|anjing|apel|roti|air|matahari|bulan|pohon|bunga|rumah|buku|mobil|hujan|susu|ikan|burung|telur|kursi|pintu|sekolah|'
  + 'teman|senang|merah|biru|hijau|keju|tempat tidur|sepatu|tangan|hati|kuda|kelinci|stroberi|kue|salju|gunung|laut|kereta|pesawat|musik|'
  + 'bintang|payung|biskuit|dokter|berani|gajah|penguin|kupu-kupu|pelangi|pulau|kastil|gitar|petir|harta karun|gunung api|roket|paus|unikorn|naga|alam semesta|'
  + 'tikus|sapi|babi|ayam|katak|bebek|pisang|jeruk|nasi|sup|kopi|teh|garam|jendela|sofa|kunci|jam|pensil|kertas|ransel|'
  + 'guru|bayi|keluarga|ibu|ayah|sedih|marah|lelah|kuning|hitam|putih|mata|hidung|mulut|telinga|kaki|awan|angin|api|batu|'
  + 'bus|sepeda|peta|kemeja|topi|bola|singa|harimau|beruang|monyet|rubah|kura-kura|piza|es krim|cokelat|semangka|bunga matahari|daun|pantai|kapal|'
  + 'piano|drum|juru masak|pemadam kebakaran|polisi|terkejut|bola basket|mantel|jerapah|zebra|burung hantu|gurita|burung beo|kaktus|gurun|tornado|biola|kompas|mahkota|penyihir|'
  + 'planet|hiu|elang|komet|putri duyung|peri|pesawat luar angkasa|juara|dinosaurus|bintang jatuh').split('|');
if (typeof WORD_CARDS !== 'undefined' && typeof LANG_COL !== 'undefined' && !LANG_COL.id) {
  const col = WORD_CARDS[0].length;   // a new column at the end, whatever other languages were added before it
  WORD_CARDS.forEach(c => { c[col] = ID_PACK[c[0] - 1] || c[2]; });
  LANG_COL.id = col; PACK_LANGS.push(['id', 'Bahasa Indonesia', 'id-ID']);
}

/* ---------- 🌐 Auto-translate: the Indonesian real sentences help pick between meanings, and the builder's words are "built-in words" ---------- */
if (typeof txCorpus === 'function') {
  const prevCorpus = txCorpus;
  txCorpus = async function (lang) {
    if (lang !== 'id') return prevCorpus(lang);
    return (txCorpusCache.id ||= fetch('data/real-id.json').then(r => r.ok ? r.json() : null).then(j => (j?.items || []).map(it => ({ src: String(it[1] || '').toLowerCase(), en: String(it[2] || '').toLowerCase() }))).catch(() => null));
  };
}
if (typeof txAppIndex === 'function') {
  const prevIndex = txAppIndex;
  txAppIndex = function (lang) {
    if (lang !== 'id' || txAppCache.id?.indonesian) return prevIndex(lang);
    const idx = prevIndex('id'), fwd = idx.fwd;   // RS_DICT.id and the starter deck are already in it
    const add = (w, en) => { w = String(w || '').toLowerCase().trim(); if (!w || !en) return; for (const g of String(en).split(/\s*\/\s*/)) { const t = g.trim(); if (!t || /^\(/.test(t)) continue; if (!fwd.has(w)) fwd.set(w, []); if (!fwd.get(w).includes(t)) fwd.get(w).push(t); } };
    if (typeof ID_NOUN !== 'undefined') {
      for (const n of ID_NOUN) add(n[0], n[2]);
      for (const a of ID_ADJ) add(a[0], a[1]);
      for (const v of ID_VERB) { add(v[0], 'to ' + v[4][0]); if (v[1]) add(v[1], v[4][0]); }
      for (const p of ID_PRON) add(p[0], p[1] === 'he/she' ? 'he / she' : p[1]);
      for (const a of ID_ADV) add(a[0], a[1].replace(/\s*\(.*\)/, ''));
      for (const m of ID_MOD) add(m[0], m[2].split(',')[0]);
    }
    const back = new Map(); for (const [w, list] of fwd) for (const t of list) { const k = txKey(t); if (!k) continue; if (!back.has(k)) back.set(k, []); if (!back.get(k).includes(w)) back.get(k).push(w); }
    return (txAppCache.id = { fwd, back, indonesian: true });
  };
}

/* ---------- the games page names the languages with real sentences ---------- */
if (typeof GAMES !== 'undefined' && GAMES.builder && !/Indonesian/.test(GAMES.builder.desc)) GAMES.builder.desc = GAMES.builder.desc.replace(/,? and (\p{L}+)\.$/u, ', $1 and Indonesian.');
