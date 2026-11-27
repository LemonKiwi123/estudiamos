'use strict';
/* ================= Russian (ru) and Ukrainian (uk): what the rest of the app needs =================
   Registered from here so no shared file has to change: the Ukrainian voice sample, 🔢 Numbers & ABC (the Cyrillic
   alphabets), typed answers on Russian and Ukrainian decks (stress marks don't matter, ё counts as е in Russian, and
   ' ’ ʼ are the same Ukrainian apostrophe), 🎙️ Say it!, the starter decks, the word card packs and 🌐 Auto-translate
   (the builder's words and the real sentences). The deck language list and ISO3 already have ru-RU and uk-UA.
   Typing in Latin letters (privet for привет) is not accepted: there are several ways to write Russian and Ukrainian
   in Latin letters (ш = sh or š, х = kh, h or x), so a guess would often be wrong.
   Loaded last of the East Slavic files, after translate.js, numgame.js, speakgame.js, starters.js and packs.js. */
const ESV_CODES = ['ru', 'uk'];
const esvBase = l => String(l || '').toLowerCase().split(/[-_]/)[0];
if (typeof SAMPLE_SAY !== 'undefined') { SAMPLE_SAY.ru ||= 'Привет! Вот так звучит мой голос.'; SAMPLE_SAY.uk = 'Привіт! Ось так звучить мій голос.'; }
if (typeof ISO3 !== 'undefined') Object.assign(ISO3, { ru: ISO3.ru || 'rus', uk: ISO3.uk || 'ukr' });

/* the same word written two ways: stress marks off, ё = е (Russian), one kind of apostrophe (Ukrainian) */
const esvFold = (s, lang) => { s = String(s ?? '').toLowerCase().normalize('NFC').replace(/[́̀]/g, '').replace(/[’ʼ`]/g, "'").normalize('NFC');
  return lang === 'ru' ? s.replace(/ё/g, 'е') : s; };

/* ---------- 🔢 Numbers & ABC ---------- */
if (typeof NG_LANGS !== 'undefined') {
  NG_LANGS.ru = { name: 'Russian', flag: '🇷🇺', tts: 'ru-RU' };
  NG_LANGS.uk = { name: 'Ukrainian', flag: '🇺🇦', tts: 'uk-UA' };
  const make = (u, t, h, thousand) => n => {
    const two = x => x < 20 ? u[x] : t[Math.floor(x / 10)] + (x % 10 ? ' ' + u[x % 10] : '');
    if (n === 1000) return thousand; if (n < 100) return two(n);
    const r = n % 100; return h[Math.floor(n / 100)] + (r ? ' ' + two(r) : '');
  };
  // двадцать один, сто двадцать три, двести, тысяча
  NG_WORDS.ru = make(['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'],
    ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'],
    ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'], 'тысяча');
  NG_WORDS.uk = make(['нуль', 'один', 'два', 'три', 'чотири', "п'ять", 'шість', 'сім', 'вісім', "дев'ять", 'десять', 'одинадцять', 'дванадцять', 'тринадцять', 'чотирнадцять', "п'ятнадцять", 'шістнадцять', 'сімнадцять', 'вісімнадцять', "дев'ятнадцять"],
    ['', '', 'двадцять', 'тридцять', 'сорок', "п'ятдесят", 'шістдесят', 'сімдесят', 'вісімдесят', "дев'яносто"],
    ['', 'сто', 'двісті', 'триста', 'чотириста', "п'ятсот", 'шістсот', 'сімсот', 'вісімсот', "дев'ятсот"], 'тисяча');
  NG_ABC.ru = 'а:а б:бэ в:вэ г:гэ д:дэ е:е ё:ё ж:жэ з:зэ и:и й:и краткое к:ка л:эль м:эм н:эн о:о п:пэ р:эр с:эс т:тэ у:у ф:эф х:ха ц:цэ ч:че ш:ша щ:ща ъ:твёрдый знак ы:ы ь:мягкий знак э:э ю:ю я:я';
  NG_ABC.uk = "а:а б:бе в:ве г:ге ґ:ґе д:де е:е є:є ж:же з:зе и:и і:і ї:ї й:йот к:ка л:ел м:ем н:ен о:о п:пе р:ер с:ес т:те у:у ф:еф х:ха ц:це ч:че ш:ша щ:ща ь:м'який знак ю:ю я:я";
}
// ё = е, any apostrophe, and the other words for 0 (нуль / ноль) and 1000 (одна тысяча)
if (typeof ngAnswer === 'function') {
  const prevAnswer = ngAnswer;
  ngAnswer = function (given) {
    if (typeof ng !== 'undefined' && ESV_CODES.includes(ng?.lang) && ng.mode === 'type' && ng.q && typeof given === 'string') {
      const clean = s => esvFold(s, ng.lang).trim().replace(/[\s-]+/g, ' ');
      const alts = [ng.q.answer, ng.q.answer === 'ноль' ? 'нуль' : '', ng.q.answer === 'нуль' ? 'ноль' : '', ng.q.answer === 'тысяча' ? 'одна тысяча' : '', ng.q.answer === 'тисяча' ? 'одна тисяча' : ''];
      if (alts.some(a => a && clean(a) === clean(given))) given = ng.q.answer;
    }
    return prevAnswer(given);
  };
}

/* ---------- typed answers (cards and ⚔️ Lexicon Saga spells) on Russian and Ukrainian decks ---------- */
function esvDeckLang() {
  try { const d = typeof currentDeckId === 'function' ? deckById(currentDeckId()) : null; if (!d) return null;
    const f = esvBase(d.frontLang), b = esvBase(d.backLang); return ESV_CODES.includes(f) ? f : ESV_CODES.includes(b) ? b : null; } catch { return null; }
}
const esvNormFold = (s, lang) => esvFold(s, lang).replace(/'/g, 'ʼ').replace(/[¿?¡!.,;:"“”‘«»()[\]…\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
const esvParts = a => [String(a || ''), ...String(a || '').split(/[\/;,]/)].flatMap(p => [p, p.replace(/\([^)]*\)/g, ' ')]).map(p => p.trim()).filter(Boolean);
if (typeof checkTyped === 'function') {
  const prevCheck = checkTyped;
  checkTyped = function (input, ans) {
    const r = prevCheck(input, ans), lang = r.ok && !r.typo ? null : esvDeckLang(); if (!lang) return r;
    const hit = esvParts(ans).find(p => esvNormFold(p, lang) === esvNormFold(input, lang));
    return hit ? prevCheck(hit, ans) : r;
  };
}
if (typeof sgGrade === 'function') {
  const prevGrade = sgGrade;
  sgGrade = function (given, answer) {
    const r = prevGrade(given, answer), lang = r === 'exact' ? null : esvDeckLang(); if (!lang) return r;
    const hit = esvParts(answer).find(p => esvNormFold(p, lang) === esvNormFold(given, lang));
    return hit ? prevGrade(hit, answer) : r;
  };
}

/* ---------- 🎙️ Say it!: no articles to drop; a number heard as digits counts, and so does ё / е ---------- */
if (typeof SK_ARTICLES !== 'undefined') { SK_ARTICLES.ru = []; SK_ARTICLES.uk = []; }
if (typeof skNorm === 'function') {
  const prevNorm = skNorm;
  skNorm = function (text, lang) {
    const b = esvBase(lang); if (!ESV_CODES.includes(b)) return prevNorm(text, lang);
    const t = esvFold(String(text || '').replace(/\b\d{1,3}\b/g, n => +n <= 1000 && NG_WORDS?.[b] ? NG_WORDS[b](+n) : n), b);
    return prevNorm(t, lang).replace(/'/g, '');   // п'ять and пять (heard without the apostrophe) are the same
  };
}

/* ---------- starter decks (New deck window) ---------- */
if (typeof STARTERS !== 'undefined') {
  STARTERS.ru = { name: 'Russian basics (sample)', flag: '🇷🇺', label: 'Russian', frontLang: 'ru-RU', backLang: 'en-US', cards: [
    ['привет', 'hi'], ['здравствуйте', 'hello (polite)'], ['доброе утро', 'good morning'], ['спасибо', 'thank you'], ['пожалуйста', 'please / you’re welcome'], ['извините', 'excuse me / sorry'],
    ['до свидания', 'goodbye'], ['да', 'yes'], ['нет', 'no'], ['я', 'I'], ['ты', 'you', 'For one friend. Use вы for more people, or to be polite'], ['он / она', 'he / she'],
    ['мама', 'mom'], ['папа', 'dad'], ['кошка', 'cat', 'I see a cat: я вижу кошку'], ['собака', 'dog'], ['дом', 'house', 'at home: дома · going home: домой'], ['вода', 'water'], ['хлеб', 'bread'],
    ['книга', 'book', 'I read a book: я читаю книгу'], ['школа', 'school', 'at school: в школе · to school: в школу'], ['друг', 'friend', 'Plural: друзья'],
    ['читать / прочитать', 'to read', 'я читаю, ты читаешь. The first verb is for doing it (again and again), the second for getting it done'], ['писать / написать', 'to write', 'я пишу, ты пишешь'],
    ['говорить / сказать', 'to speak / to say', 'я говорю, ты говоришь'], ['делать / сделать', 'to do / to make', 'я делаю, ты делаешь'], ['есть / съесть', 'to eat', 'я ем, ты ешь, он ест'],
    ['пить / выпить', 'to drink', 'я пью, ты пьёшь'], ['идти / пойти', 'to go (on foot)', 'я иду, ты идёшь'], ['хотеть / захотеть', 'to want', 'я хочу, ты хочешь, мы хотим'],
    ['большой', 'big', 'большая кошка, большое окно'], ['маленький', 'small'], ['хороший', 'good'], ['сегодня', 'today'], ['завтра', 'tomorrow'],
    ['У меня есть…', 'I have…', 'У меня есть кошка = I have a cat'], ['Как дела?', 'How are you?'], ['Где туалет?', 'Where is the bathroom?']] };
  STARTERS.uk = { name: 'Ukrainian basics (sample)', flag: '🇺🇦', label: 'Ukrainian', frontLang: 'uk-UA', backLang: 'en-US', cards: [
    ['привіт', 'hi'], ['добрий день', 'hello / good afternoon'], ['доброго ранку', 'good morning'], ['дякую', 'thank you'], ['будь ласка', 'please / you’re welcome'], ['вибачте', 'excuse me / sorry'],
    ['до побачення', 'goodbye'], ['так', 'yes'], ['ні', 'no'], ['я', 'I'], ['ти', 'you', 'For one friend. Use ви for more people, or to be polite'], ['він / вона', 'he / she'],
    ['мама', 'mom', 'Calling her: мамо!'], ['тато', 'dad', 'Calling him: тату!'], ['кішка', 'cat', 'I see a cat: я бачу кішку'], ['собака', 'dog', 'Masculine in Ukrainian: великий собака'],
    ['будинок', 'house'], ['вдома', 'at home', 'going home: додому'], ['вода', 'water'], ['хліб', 'bread'], ['книга', 'book', 'I read a book: я читаю книгу'],
    ['школа', 'school', 'at school: у школі · to school: до школи'], ['друг', 'friend', 'Calling him: друже! Plural: друзі'],
    ['читати / прочитати', 'to read', 'я читаю, ти читаєш. The first verb is for doing it (again and again), the second for getting it done'], ['писати / написати', 'to write', 'я пишу, ти пишеш'],
    ['говорити / сказати', 'to speak / to say', 'я говорю, ти говориш'], ['робити / зробити', 'to do / to make', 'я роблю, ти робиш'], ["їсти / з'їсти", 'to eat', 'я їм, ти їси, він їсть'],
    ['пити / випити', 'to drink', "я п'ю, ти п'єш"], ['йти / піти', 'to go (on foot)', 'я йду, ти йдеш'], ['хотіти / захотіти', 'to want', 'я хочу, ти хочеш'], ['мати', 'to have', 'я маю кота = I have a cat'],
    ['великий', 'big', 'велика кішка, велике вікно'], ['маленький', 'small'], ['гарний', 'beautiful / nice'], ['сьогодні', 'today'], ['завтра', 'tomorrow'],
    ['Як справи?', 'How are you?'], ['Де туалет?', 'Where is the bathroom?']] };
}

/* ---------- 🎴 Word card packs: the name of every card, in card order (1–150) ---------- */
const ESV_PACK = {
  ru: 'кошка|собака|яблоко|хлеб|вода|солнце|луна|дерево|цветок|дом|книга|машина|дождь|молоко|рыба|птица|яйцо|стул|дверь|школа|друг|счастливый|красный|синий|зелёный|сыр|кровать|ботинок|рука|сердце|лошадь|кролик|клубника|торт|снег|гора|море|поезд|самолёт|музыка|звезда|зонт|печенье|врач|смелый|слон|пингвин|бабочка|радуга|остров|замок|гитара|молния|сокровище|вулкан|ракета|кит|единорог|дракон|вселенная|мышь|корова|свинья|курица|лягушка|утка|банан|апельсин|рис|суп|кофе|чай|соль|окно|диван|ключ|часы|карандаш|бумага|рюкзак|учитель|малыш|семья|мама|папа|грустный|злой|усталый|жёлтый|чёрный|белый|глаз|нос|рот|ухо|нога|облако|ветер|огонь|камень|автобус|велосипед|карта|рубашка|шляпа|мяч|лев|тигр|медведь|обезьяна|лиса|черепаха|пицца|мороженое|шоколад|арбуз|подсолнух|лист|пляж|корабль|пианино|барабан|повар|пожарный|полицейский|удивлённый|баскетбол|пальто|жираф|зебра|сова|осьминог|попугай|кактус|пустыня|торнадо|скрипка|компас|корона|волшебник|планета|акула|орёл|комета|русалка|фея|космический корабль|чемпион|динозавр|падающая звезда',
  uk: "кіт|собака|яблуко|хліб|вода|сонце|місяць|дерево|квітка|будинок|книга|машина|дощ|молоко|риба|птах|яйце|стілець|двері|школа|друг|щасливий|червоний|синій|зелений|сир|ліжко|черевик|рука|серце|кінь|кролик|полуниця|торт|сніг|гора|море|потяг|літак|музика|зірка|парасолька|печиво|лікар|сміливий|слон|пінгвін|метелик|веселка|острів|замок|гітара|блискавка|скарб|вулкан|ракета|кит|єдиноріг|дракон|всесвіт|миша|корова|свиня|курка|жаба|качка|банан|апельсин|рис|суп|кава|чай|сіль|вікно|диван|ключ|годинник|олівець|папір|рюкзак|вчитель|немовля|сім'я|мама|тато|сумний|сердитий|втомлений|жовтий|чорний|білий|око|ніс|рот|вухо|нога|хмара|вітер|вогонь|камінь|автобус|велосипед|карта|сорочка|капелюх|м'яч|лев|тигр|ведмідь|мавпа|лисиця|черепаха|піца|морозиво|шоколад|кавун|соняшник|листок|пляж|корабель|піаніно|барабан|кухар|пожежник|поліцейський|здивований|баскетбол|пальто|жираф|зебра|сова|восьминіг|папуга|кактус|пустеля|торнадо|скрипка|компас|корона|чарівник|планета|акула|орел|комета|русалка|фея|космічний корабель|чемпіон|динозавр|падаюча зірка" };
if (typeof WORD_CARDS !== 'undefined' && typeof LANG_COL !== 'undefined') {
  for (const [code, label, voice] of [['ru', 'Русский', 'ru-RU'], ['uk', 'Українська', 'uk-UA']]) {
    if (LANG_COL[code]) continue;
    const names = ESV_PACK[code].split('|'), col = WORD_CARDS[0].length;   // a new column at the end, whatever other languages added before
    WORD_CARDS.forEach(c => { c[col] = names[c[0] - 1] || c[2]; });
    LANG_COL[code] = col; PACK_LANGS.push([code, label, voice]);
  }
}

/* ---------- 🌐 Auto-translate: the real sentences help pick between meanings, and the builder's words are "built-in words" ---------- */
if (typeof txCorpus === 'function') {
  const prevCorpus = txCorpus;
  txCorpus = async function (lang) {
    const b = esvBase(lang); if (!ESV_CODES.includes(b)) return prevCorpus(lang);
    return (txCorpusCache[b] ||= fetch(`data/real-${b}.json`).then(r => r.ok ? r.json() : null).then(j => (j?.items || []).map(it => ({ src: String(it[1] || '').toLowerCase(), en: String(it[2] || '').toLowerCase() }))).catch(() => null));
  };
}
if (typeof txAppIndex === 'function') {
  const prevIndex = txAppIndex;
  txAppIndex = function (lang) {
    const b = esvBase(lang); if (!ESV_CODES.includes(b)) return prevIndex(lang);
    if (txAppCache[b]?.eslav) return txAppCache[b];
    const idx = prevIndex(b), fwd = idx?.fwd || new Map();
    const add = (w, en) => { w = String(w || '').toLowerCase().trim(); if (!w || !en) return; for (const g of String(en).split(/\s*\/\s*/)) { const t = g.trim(); if (!t || /\(/.test(t)) continue; if (!fwd.has(w)) fwd.set(w, []); if (!fwd.get(w).includes(t)) fwd.get(w).push(t); } };
    const L = typeof ESV !== 'undefined' ? ESV[b] : null;
    if (L) {
      for (const n of L.N) { add(n.w, n.en.toLowerCase()); if (n.F.pnom) add(n.F.pnom[0], n.enPl); }
      for (const a of L.A) add(a.m, a.en);
      for (const v of L.V) { add(v.inf, 'to ' + v.en); if (v.pf) add(v.pf, 'to ' + v.en); }
      for (const a of [...L.adv, ...L.conj]) add(a[0], a[1]);
      for (const p of L.pron) if (p[1] === 'nom') add(p[0], p[5]);
    }
    for (const [w, [, g]] of (typeof RS_DICT !== 'undefined' && RS_DICT[b]) || []) if (g && !/\(/.test(g)) add(w, g);
    if (typeof STARTERS !== 'undefined' && STARTERS[b]) for (const [f, bk] of STARTERS[b].cards) { add(f, bk); for (const part of String(f).split(/\s*\/\s*/)) if (part !== f) add(part, bk); }
    const back = new Map(); for (const [w, list] of fwd) for (const t of list) { const k = txKey(t); if (!k) continue; if (!back.has(k)) back.set(k, []); if (!back.get(k).includes(w)) back.get(k).push(w); }
    return (txAppCache[b] = { fwd, back, eslav: true });
  };
}
