'use strict';
/* ================= Sentence Builder · 📖 Real sentences: Indonesian word types and meanings =================
   Closed word lists, the Sentence Builder's Indonesian words, the word list in rsdict-id.js and a few safe rules:
   a doubled word (anak-anak) is tagged like its single form, and the endings -nya / -ku / -mu (bukunya = his/her book)
   and -lah / -kah (apakah, bisakah) are taken off first; mem- / men- / meng- / meny- and ber- words are verbs, and so are
   di- words whose base is a known verb (dibaca). ini / itu right after a noun point at it ("buku itu" = that book); at the
   start of a sentence they stand alone ("Itu buku" = That is a book). A word that can't be tagged with confidence gets no label.
   Loaded after rstag.js, rsdict-id.js and builder-id.js. */
RS_LANGS.id = 'Indonesian';
RS_POS_BY.id = ['noun', 'verb', 'adj', 'adv', 'pron', 'det', 'prep', 'conj', 'part'];
RS_CLOSED.id = {
  pron: RS_W('aku saya kamu kau engkau anda dia ia beliau kita kami mereka kalian siapa apa sesuatu seseorang semuanya segalanya apapun apa-apa yang diri dirinya dirimu diriku'),
  dem: RS_W('ini itu'),
  det: RS_W('semua setiap tiap beberapa banyak para sebuah seorang seekor sebutir sepotong segelas secangkir satu dua tiga empat lima enam tujuh delapan sembilan sepuluh sebelas seratus seribu puluh belas ratus ribu tersebut kedua ketiga'),
  prep: RS_W('di ke dari dengan untuk pada kepada oleh tentang dalam seperti bagi tanpa sejak menuju terhadap antara selama sekitar ketimbang daripada'),
  conj: RS_W('dan atau tetapi tapi karena jika kalau bahwa ketika sebelum setelah sehingga agar supaya walaupun meskipun lalu kemudian sampai hingga serta maupun'),
  adv: RS_W('tidak tak bukan belum sudah telah akan sedang masih pernah sangat terlalu lebih paling juga saja hanya lagi selalu sering jarang sekali sekarang nanti tadi kemarin besok dulu segera hampir mungkin pasti sungguh cukup agak sini sana situ mana kapan mengapa kenapa bagaimana berapa seberapa bersama sendiri sendirian berdua bertiga pun jangan tolong mari ayo seharusnya sebaiknya sebenarnya biasanya akhirnya sepertinya tentu memang bahkan semakin secara saling segera sedikit begitu benar-benar baik-baik ya kan lah dong'),
  verb: RS_W('adalah ada punya bisa dapat harus mau ingin boleh perlu butuh suka tahu kenal pikir merupakan jadi tinggal pergi datang pulang tidur mandi duduk makan minum masuk keluar naik turun tiba kembali lahir jatuh ikut pindah lupa ingat coba beli baca lihat tunggu tutup buka kerja bicara bilang kira harap terima mulai selesai bangun hidup tertawa tersenyum terjadi terlihat tertidur terbang terbuat ketahui pikirkan inginkan butuhkan katakan lakukan berikan biarkan sukai kulakukan'),
};
// the Sentence Builder's Indonesian words, for tagging
let RS_ID_LEX = null;
function rsIdLex() {
  if (RS_ID_LEX) return RS_ID_LEX;
  const m = new Map(), put = (w, t) => { if (w && !m.has(String(w).toLowerCase())) m.set(String(w).toLowerCase(), t); };
  if (typeof ID_NOUN !== 'undefined') {
    ID_VERB.forEach(v => { put(v[0], 'verb'); if (v[1]) put(v[1], 'verb'); if (v[2] === 'tr') put(idPassW(v), 'verb'); });
    ID_MOD.forEach(x => put(x[0], 'verb'));
    ID_NOUN.forEach(n => put(n[0], 'noun'));
    ID_ADJ.forEach(a => put(a[0], 'adj'));
  }
  return (RS_ID_LEX = m);
}
const RS_ID_NOT_ME = /^(meja|merah|mereka|menit|menu|meter|mesin|memang|mentega|menteri|menara|mentah|menantu|melon|mewah|mekar|medan|media|meski|meskipun|menuju)$/;
const RS_ID_NOT_BER = /^(berapa|berat|beras|berita|bersih|bersama|berani|beruang|berlian|berdua|bertiga|beserta|besar|berbahaya)$/;
// the plain word, its type, and what was taken off
function rsIdBase(w) {
  const C = RS_CLOSED.id, known = x => rsIdLex().has(x) || !!RS_DICT_GET('id', x) || Object.values(C).some(s => s.has(x));
  if (/^([a-z]+)-\1$/.test(w)) return { b: w.split('-')[0], how: 'double' };   // anak-anak, buku-buku
  for (const [end, how] of [['nya', 'nya'], ['ku', 'ku'], ['mu', 'mu'], ['lah', 'lah'], ['kah', 'kah']]) {
    if (w.length > end.length + 2 && w.endsWith(end) && !known(w)) { const b = w.slice(0, -end.length); if (known(b) || /^(mem|men|meng|meny|ber|di)/.test(b)) return { b, how }; }
  }
  return null;
}
function rsIdTag(w, i, low) {
  const C = RS_CLOSED.id, lex = rsIdLex(), dict = RS_DICT_GET('id', w);
  if (dict) return dict[0];
  if (C.dem.has(w)) return null;   // decided from the word before it
  for (const k of ['pron', 'prep', 'conj', 'adv', 'det', 'verb']) if (C[k].has(w)) return k;
  if (lex.has(w)) return lex.get(w);
  const r = rsLex('id'); if (r.has(w)) return r.get(w);   // your own cards' word labels
  const base = rsIdBase(w);
  if (base) { const t = rsIdTag(base.b, i, low); if (t) return base.how === 'nya' && t === 'adj' && i > 0 ? 'noun' : t === 'pron' && base.how !== 'kah' && base.how !== 'lah' ? 'pron' : t; }
  if (/^(mem|men|meng|meny)[a-z]{3,}$/.test(w) && !RS_ID_NOT_ME.test(w)) return 'verb';   // membaca, menulis, mengerti
  if (/^ber[a-z]{3,}$/.test(w) && !RS_ID_NOT_BER.test(w)) return 'verb';   // bekerja, berbicara
  if (/^di[a-z]{3,}$/.test(w) && (lex.get(w.slice(2)) === 'verb' || C.verb.has(w.slice(2)) || /(kan|i)$/.test(w) && w.length > 6)) return 'verb';   // dibaca, dilakukan
  if (/^ke[a-z]{3,}an$/.test(w) && w.length > 7) return 'noun';   // kesalahan, kesempatan
  if (/^pe(r|n|m|ng)?[a-z]{3,}an$/.test(w) && w.length > 7) return 'noun';   // pekerjaan, pertanyaan
  return null;
}
{ const prevTag = rsTagWord; rsTagWord = function (w, i, low, lang) { return lang === 'id' ? rsIdTag(w, i, low) : prevTag(w, i, low, lang); }; }
{ const prevSent = rsTagSentence;
  rsTagSentence = function (words, lang) {
    const out = prevSent(words, lang); if (lang !== 'id') return out;
    const low = words.map(w => w.toLowerCase().replace(/[.,!?;:«»"“”()]/g, ''));
    for (let i = 0; i < out.length; i++) {
      const w = low[i];
      // ini / itu: after a noun (or its describing word or owner) they point at it; on their own they stand for "this / that"
      if (RS_CLOSED.id.dem.has(w)) out[i] = i > 0 && /^(noun|adj)$/.test(out[i - 1] || '') || i > 1 && out[i - 1] === 'pron' && out[i - 2] === 'noun' ? 'det' : 'pron';
      // baru: "rumah baru" (new) after a noun, "baru datang" (just) before a verb
      if (w === 'baru') out[i] = out[i + 1] === 'verb' ? 'adv' : 'adj';
      // a name: a capitalized word that no list knows
      if (out[i] == null && /^[A-Z]/.test(words[i]) && i > 0) out[i] = 'noun';
    }
    return out;
  };
}

/* meanings for the word tags */
RS_GLOSS_COMMON.id = 'ini:this|itu:that / the|yang:who / which / that|adalah:is / are|ada:there is / is (somewhere)|tidak:not|tak:not|bukan:not (a noun) / isn’t it?|belum:not yet|sudah:already|telah:already (has)|akan:will|sedang:(is) -ing|masih:still|pernah:ever|di:at / in|ke:to|dari:from|dengan:with|untuk:for|pada:on / at|kepada:to (a person)|oleh:by|dan:and|atau:or|tetapi:but|tapi:but|karena:because|jika:if|kalau:if|bahwa:that|juga:also|saja:just / only|hanya:only|lagi:again / more|sangat:very|sekali:very / once|terlalu:too|lebih:more|paling:most|apa:what|siapa:who|mana:where / which|kapan:when|mengapa:why|kenapa:why|bagaimana:how|berapa:how many / how much|aku:I / me|saya:I / me|kamu:you|kau:you|anda:you (polite)|dia:he / she|ia:he / she|kita:we (and you)|kami:we (not you)|mereka:they|kalian:you all|bisa:can|dapat:can|harus:must|mau:want|ingin:want|boleh:may|perlu:need|punya:have|tahu:know|semua:all|setiap:every|banyak:many / a lot|beberapa:some / a few|para:(the group of)';
{ const prevMap = rsGlossMap;
  rsGlossMap = function (lang) {
    if (lang !== 'id' || RS_GLOSS.id) return prevMap(lang);
    const m = prevMap('id'), put = (w, g) => { if (w && g && !m.has(String(w).toLowerCase())) m.set(String(w).toLowerCase(), String(g)); };
    if (typeof ID_NOUN !== 'undefined') {
      ID_NOUN.forEach(n => put(n[0], n[2]));
      ID_ADJ.forEach(a => put(a[0], a[1]));
      ID_VERB.forEach(v => { put(v[0], 'to ' + v[4][0]); if (v[1]) put(v[1], v[4][0]); if (v[2] === 'tr') put(idPassW(v), 'is ' + v[4][4]); });
      ID_MOD.forEach(x => put(x[0], x[2])); ID_PRON.forEach(p => put(p[0], p[3])); ID_ADV.forEach(a => put(a[0], a[1].replace(/\s*\(.*\)/, '')));
      ID_DET.forEach(d => put(d[0], d[1] === 'cl' ? 'a, one' : d[2]));
    }
    return m;
  };
}
{ const prevGloss = rsGloss;
  rsGloss = function (word, lang) {
    const g = prevGloss(word, lang); if (g || lang !== 'id') return g;
    const w = String(word || '').toLowerCase().replace(/[.,!?;:«»"“”()]/g, ''), base = rsIdBase(w);
    if (!base) { if (/^di[a-z]{3,}$/.test(w)) { const a = prevGloss(w.slice(2), lang); if (a) return a.replace(/^to /, '') + ' (di- = it is done to it)'; } return ''; }
    const b = prevGloss(base.b, lang) || rsGloss(base.b, lang); if (!b) return '';
    return { double: b + ' (more than one)', nya: b + ' + his / her / its / the', ku: b + ' + my / me', mu: b + ' + your / you', lah: b + ' (!)', kah: b + ' (?)' }[base.how];
  };
}
