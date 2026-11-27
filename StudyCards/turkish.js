'use strict';
/* ================= Turkish (tr): what the whole app needs =================
   Turkish (tr-TR voice) in the shared lists, registered from here so no shared file has to change: 🔢 Numbers & ABC,
   🎙️ Say it!, typed answers, the starter deck, the word card packs, 🌐 Auto-translate (the Sentence Builder's Turkish words
   and the Turkish real sentences), the voice sample and the games page. The deck language list already has tr-TR.
   Turkish has two i's: İ/i (dotted) and I/ı (dotless). Lower and upper case always keep them apart (trLow, trUp in builder-tr.js).
   Loaded after translate.js and the other Turkish files (builder-tr.js, rsdict-tr.js, rstag-tr.js, gametr-tr*.js). */

if (typeof SAMPLE_SAY !== 'undefined') SAMPLE_SAY.tr = 'Merhaba! Benim sesim böyle.';
if (typeof ISO3 !== 'undefined') ISO3.tr ||= 'tur';
const trLower = s => String(s || '').replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase();
// the plain letters: ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u (and â î û, which modern spelling often leaves out)
const trPlain = s => trLower(s).replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '');
const trSoftHat = s => trLower(s).replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');   // kâğıt = kağıt: both fully right
const trIsTr = s => /[ıİğĞ]/.test(s) || /[şŞ]/.test(s) && !/[ăâîțșĂÂÎȚȘ]/.test(s);

/* ---------- 🔢 Numbers & ABC ----------
   bir, iki… on, on bir, yirmi, yirmi bir, yüz (not “bir yüz”), iki yüz, bin. Written as separate words. */
if (typeof NG_LANGS !== 'undefined') {
  NG_LANGS.tr = { name: 'Turkish', flag: '🇹🇷', tts: 'tr-TR' };
  NG_WORDS.tr = function (n) {
    const u = ['sıfır', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'], t = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
    const two = x => x < 10 ? u[x] : t[Math.floor(x / 10)] + (x % 10 ? ' ' + u[x % 10] : '');
    if (n === 1000) return 'bin'; if (n < 100) return two(n);
    const c = Math.floor(n / 100), r = n % 100;
    return (c === 1 ? 'yüz' : u[c] + ' yüz') + (r ? ' ' + two(r) : '');
  };
  // the 29 letters: no q, w, x; ç ğ ı ö ş ü have their own place. ğ is “yumuşak ge” (soft g).
  NG_ABC.tr = 'a:a b:be c:ce ç:çe d:de e:e f:fe g:ge ğ:yumuşak ge h:he ı:ı i:i j:je k:ke l:le m:me n:ne o:o ö:ö p:pe r:re s:se ş:şe t:te u:u ü:ü v:ve y:ye z:ze';
}
// typed numbers: İKİ = iki, “bir yüz” for yüz and “bir bin” for bin are accepted; without ç ğ ı ö ş ü it is right but marked “watch the spelling”
if (typeof ngAnswer === 'function') {
  const prevAnswer = ngAnswer;
  ngAnswer = function (given) {
    if (typeof ng !== 'undefined' && ng?.lang === 'tr' && ng.mode === 'type' && ng.q && typeof given === 'string') {
      const a = ng.q.answer, g = trLower(given).trim().replace(/[-\s]+/g, ' ').replace(/^bir (yüz|bin)/, '$1');
      if (g === a) given = a;
      else if (g.length === a.length && trPlain(g) === trPlain(a)) {
        // keep it “close”: a dotless ı typed as i shows as i but no longer counts as exactly the answer
        given = [...g].map((ch, k) => a[k] === 'ı' && ch === 'i' ? 'ı̇' : ch).join('');
      }
    }
    return prevAnswer(given);
  };
}

/* ---------- ✍️ typed answers in quizzes: İ/i and I/ı lower-case the Turkish way; without ç ğ ı ö ş ü it is only “close” ---------- */
if (typeof checkTyped === 'function') {
  const prevTyped = checkTyped;
  const N = s => trSoftHat(s).normalize('NFKC').replace(/[¿?¡!.,;:"'“”‘’«»()[\]…\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
  const parts = ans => { const set = new Set(), add = x => { const n = N(x); if (n) set.add(n); }, noParen = x => x.replace(/\([^)]*\)/g, ' ');
    add(ans); add(noParen(ans)); for (const p of String(ans).split(/[\/;,]/)) { add(p); add(noParen(p)); } return [...set]; };
  checkTyped = function (input, ans) {
    // a Turkish answer: Turkish letters in it, or a quiz on a deck with Turkish on one side
    let deckTr = false; try { const d = typeof quiz !== 'undefined' && quiz?.deckId && deckById(quiz.deckId); deckTr = !!d && [d.frontLang, d.backLang].some(l => /^tr(-|$)/i.test(l || '')); } catch {}
    if (!deckTr && !trIsTr(String(ans || '')) && !trIsTr(String(input || ''))) return prevTyped(input, ans);
    const n = N(input); if (!n) return { ok: false };
    const vs = parts(ans);
    if (vs.includes(n)) return { ok: true };
    const near = (a, b) => { const d = lev(a, b); return b.length >= 5 && d <= 1 || b.length >= 10 && d <= 2; };
    for (const v of vs) if (near(n, v) || trPlain(n) === trPlain(v) || near(trPlain(n), trPlain(v)) && trPlain(v).length >= 5) return { ok: true, typo: true };
    return { ok: false };
  };
}

/* ---------- 🎙️ Say it!: İ/I lower-cased the Turkish way; İstanbul'da = istanbulda ---------- */
if (typeof SK_ARTICLES !== 'undefined') SK_ARTICLES.tr = [];
if (typeof skMatch === 'function') {
  const prevMatch = skMatch;
  const trSk = s => trLower(s).replace(/['’]/g, '').replace(/[.,!?;:"“”«»()]/g, ' ').replace(/\s+/g, ' ').trim();
  skMatch = function (heard, card, lang) {
    const tr = String(lang || '').split('-')[0].toLowerCase() === 'tr';
    const r = prevMatch(tr ? heard.map(trLower) : heard, card, lang);
    if (r.ok || !tr) return r;
    const answers = skAnswers(card, lang).map(trSk);
    for (const h of heard) {
      const said = trSk(h);
      for (const a of answers) {
        if (said === a || (' ' + said + ' ').includes(' ' + a + ' ')) return { ok: true, close: false, heard: h };
        if (trPlain(said) === trPlain(a)) return { ok: true, close: true, heard: h };
      }
    }
    return r;
  };
}

/* ---------- a Turkish starter deck (New deck window) ---------- */
if (typeof STARTERS !== 'undefined') STARTERS.tr = { name: 'Turkish basics (sample)', flag: '🇹🇷', label: 'Turkish', frontLang: 'tr-TR', backLang: 'en-US', cards: [
  ['merhaba', 'hello'], ['günaydın', 'good morning'], ['teşekkür ederim', 'thank you'], ['rica ederim', 'you’re welcome'], ['lütfen', 'please'], ['özür dilerim', 'I’m sorry'],
  ['hoşça kal', 'goodbye', 'Said by the one leaving; the one staying says güle güle'], ['evet', 'yes'], ['hayır', 'no'], ['değil', 'not', 'After a noun or describing word: yorgun değilim = I’m not tired'],
  ['ben', 'I'], ['sen', 'you'], ['o', 'he / she / it', 'One word for all three'], ['biz', 'we'], ['siz', 'you (all, or polite)'], ['onlar', 'they'],
  ['kedi', 'cat'], ['köpek', 'dog', 'the dog (object): köpeği'], ['ev', 'house / home', 'at home: evde · home(wards): eve'], ['su', 'water', 'the water (object): suyu'], ['ekmek', 'bread'], ['çay', 'tea'],
  ['kitap', 'book', 'the book (object): kitabı'], ['okul', 'school', 'to school: okula · at school: okulda'], ['arkadaş', 'friend'], ['öğretmen', 'teacher'],
  ['yemek', 'to eat', 'also “food, a meal”'], ['içmek', 'to drink', 'içiyorum = I’m drinking'], ['okumak', 'to read', 'okuyorum = I’m reading'], ['gitmek', 'to go', 'gidiyorum = I’m going'], ['gelmek', 'to come'], ['sevmek', 'to love / to like'],
  ['büyük', 'big'], ['küçük', 'small'], ['yeni', 'new'], ['güzel', 'beautiful / nice'], ['bugün', 'today'], ['yarın', 'tomorrow'], ['dün', 'yesterday'],
  ['var', 'there is / have', 'Bir kedim var = I have a cat'], ['yok', 'there isn’t / don’t have'], ['Nasılsın?', 'How are you?'], ['Tuvalet nerede?', 'Where is the bathroom?']] };

/* ---------- 🎴 Word card packs: the Turkish name of every card ---------- */
// in card order (1–150)
const TR_PACK = ('kedi|köpek|elma|ekmek|su|güneş|ay|ağaç|çiçek|ev|kitap|araba|yağmur|süt|balık|kuş|yumurta|sandalye|kapı|okul|'
  + 'arkadaş|mutlu|kırmızı|mavi|yeşil|peynir|yatak|ayakkabı|el|kalp|at|tavşan|çilek|pasta|kar|dağ|deniz|tren|uçak|müzik|'
  + 'yıldız|şemsiye|kurabiye|doktor|cesur|fil|penguen|kelebek|gökkuşağı|ada|kale|gitar|şimşek|hazine|yanardağ|roket|balina|tek boynuzlu at|ejderha|evren|'
  + 'fare|inek|domuz|tavuk|kurbağa|ördek|muz|portakal|pilav|çorba|kahve|çay|tuz|pencere|kanepe|anahtar|saat|kurşun kalem|kâğıt|sırt çantası|'
  + 'öğretmen|bebek|aile|anne|baba|üzgün|kızgın|yorgun|sarı|siyah|beyaz|göz|burun|ağız|kulak|ayak|bulut|rüzgâr|ateş|taş|'
  + 'otobüs|bisiklet|harita|gömlek|şapka|top|aslan|kaplan|ayı|maymun|tilki|kaplumbağa|pizza|dondurma|çikolata|karpuz|ayçiçeği|yaprak|plaj|gemi|'
  + 'piyano|davul|aşçı|itfaiyeci|polis|şaşkın|basketbol|mont|zürafa|zebra|baykuş|ahtapot|papağan|kaktüs|çöl|hortum|keman|pusula|taç|büyücü|'
  + 'gezegen|köpekbalığı|kartal|kuyruklu yıldız|deniz kızı|peri|uzay gemisi|şampiyon|dinozor|kayan yıldız').split('|');
if (typeof WORD_CARDS !== 'undefined' && typeof LANG_COL !== 'undefined' && !LANG_COL.tr) {
  const col = WORD_CARDS[0].length;   // a new column at the end, whatever other languages were added before it
  WORD_CARDS.forEach(c => { c[col] = TR_PACK[c[0] - 1] || c[2]; });
  LANG_COL.tr = col; PACK_LANGS.push(['tr', 'Türkçe', 'tr-TR']);
}

/* ---------- 🌐 Auto-translate: the Turkish real sentences help pick between meanings, and the builder's words are "built-in words" ---------- */
if (typeof txCorpus === 'function') {
  const prevCorpus = txCorpus;
  txCorpus = async function (lang) {
    if (lang !== 'tr') return prevCorpus(lang);
    return (txCorpusCache.tr ||= fetch('data/real-tr.json').then(r => r.ok ? r.json() : null).then(j => (j?.items || []).map(it => ({ src: trLower(it[1] || ''), en: String(it[2] || '').toLowerCase() }))).catch(() => null));
  };
}
if (typeof txAppIndex === 'function') {
  const prevIndex = txAppIndex;
  txAppIndex = function (lang) {
    if (lang !== 'tr' || txAppCache.tr?.turkish) return prevIndex(lang);
    const idx = prevIndex('tr'), fwd = idx.fwd;   // RS_DICT.tr and the starter deck are already in it
    const add = (w, en) => { w = trLower(w).trim(); if (!w || !en) return; for (const g of String(en).split(/\s*\/\s*/)) { const t = g.trim(); if (!t || /^\(/.test(t)) continue; if (!fwd.has(w)) fwd.set(w, []); if (!fwd.get(w).includes(t)) fwd.get(w).push(t); } };
    if (typeof TR_NOUN !== 'undefined') {
      for (const n of TR_NOUN) add(n[0], n[2]);
      for (const a of TR_ADJ) add(a[0], a[1]);
      for (const v of TR_VERB) add(v.w, v.be ? 'to be afraid' : 'to ' + v.en[0]);
      for (const p of TR_PRON) add(p[0], p[2] === 'he/she' ? 'he / she / it' : p[2]);
      for (const a of TR_ADV) add(a[0], a[1]);
    }
    const back = new Map(); for (const [w, list] of fwd) for (const t of list) { const k = txKey(t); if (!k) continue; if (!back.has(k)) back.set(k, []); if (!back.get(k).includes(w)) back.get(k).push(w); }
    return (txAppCache.tr = { fwd, back, turkish: true });
  };
}

/* ---------- the games page names the languages with real sentences ---------- */
if (typeof GAMES !== 'undefined' && GAMES.builder && !/Turkish/.test(GAMES.builder.desc)) GAMES.builder.desc = GAMES.builder.desc.replace(/,? and (\p{L}+)\.$/u, ', $1 and Turkish.');
