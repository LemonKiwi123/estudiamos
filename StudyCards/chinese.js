'use strict';
/* ================= Chinese (zh, Mandarin, Simplified characters): what the whole app needs =================
   - Typed answers: pinyin counts for a Chinese answer, with tone marks, tone numbers or no tones (nǐ hǎo = ni3 hao3 = nihao).
   - 🎙️ Say it!: what the recognizer hears is compared by its pinyin, so another character with the same sound still counts.
   - 🔢 Numbers & ABC: Chinese numbers, a 两 or 二? game, and the pinyin sounds (b p m f…) instead of an alphabet.
   - The starter deck, 🌐 Auto-translate, and the credit and 🧩 button on the Sentence Builder's page.
   Loaded last of the Chinese files (after zh-pinyin.js, builder-zh.js, rsdict-zh.js, rstag-zh.js and gametr-zh*.js). */
const zhIs = l => String(l || '').toLowerCase().split(/[-_]/)[0] === 'zh';
const zhMandarin = l => zhIs(l) && !/hk|mo|yue/i.test(String(l));   // zh-HK is Cantonese: its sounds aren't pinyin

/* ---------- typed answers: pinyin, with or without tones ---------- */
/* the ways an answer can be typed in pinyin: "你好", "你好 (nǐ hǎo)" and "nǐ hǎo" all give "nihao" */
function zhAnswerKeys(ans) {
  const out = new Set(), a = String(ans || '');
  for (const p of [a.replace(/[（(][^）)]*[）)]/g, ' '), ...[...a.matchAll(/[（(]([^）)]*)[）)]/g)].map(m => m[1])].flatMap(x => x.split(/[\/;,，、；|]/))) {
    const t = p.replace(/[。！？!?.…]/g, '').trim(); if (!t) continue;
    if (zhHasHan(t)) { if (!/[A-Za-z぀-ヿ]/.test(t)) out.add(zhToneless(zhPinyin(t, ''))); }   // only a purely Chinese answer
    else if (/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/i.test(t) || /[a-zü:]+[1-5]/i.test(t)) out.add(zhToneless(t));
  }
  out.delete(''); return out;
}
function zhPinyinOk(input, ans) {
  const t = String(input || '').replace(/[。！？!?.…,，]/g, ' ').trim();
  if (!t || !zhIsPinyin(t)) return false;
  return zhAnswerKeys(ans).has(zhToneless(t));
}
function zhDeckNow() {
  try { const d = typeof currentDeckId === 'function' ? deckById(currentDeckId()) : null; return d ? zhMandarin(d.frontLang) || zhMandarin(d.backLang) : false; } catch { return false; }
}
if (typeof checkTyped === 'function') {
  const typedAll = checkTyped;
  checkTyped = function (input, ans) { const r = typedAll(input, ans); return (!r.ok || r.typo) && (zhHasHan(ans) || /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(ans)) && zhDeckNow() && zhPinyinOk(input, ans) ? { ok: true } : r; };
}
if (typeof sgGrade === 'function') {   // ⚔️ Lexicon Saga: spelling a word
  const gradeAll = sgGrade;
  sgGrade = function (given, answer) { const g = gradeAll(given, answer); return g === 'exact' || !(typeof sg !== 'undefined' && zhMandarin(sg?.d?.frontLang)) || !zhPinyinOk(given, answer) ? g : 'exact'; };
}

/* ---------- 🎙️ Say it!: compare by sound ---------- */
if (typeof skMatch === 'function') {
  const zhSkChars = s => String(s || '').normalize('NFKC').replace(/\d+/g, n => +n <= 1000 && typeof NG_WORDS !== 'undefined' && NG_WORDS.zh ? NG_WORDS.zh(+n) : n).replace(/[\s\p{P}\p{S}]/gu, '').toLowerCase();   // "3" -> 三
  const matchAll = skMatch;
  skMatch = function (heard, card, lang) {
    if (!zhMandarin(lang)) return matchAll(heard, card, lang);
    const f = plainSent(card.front), parts = [f.replace(/[（(][^）)]*[）)]/g, ' '), ...[...f.matchAll(/[（(]([^）)]*)[）)]/g)].map(m => m[1])].flatMap(x => x.split(/[\/;,，、；|]/)).map(x => x.trim()).filter(Boolean);
    const answers = parts.map(p => ({ c: zhHasHan(p) ? zhSkChars(p) : '', toned: zhHasHan(p) ? zhPinyin(zhSkChars(p), '') : p.toLowerCase().replace(/[\s'’-]/g, ''), flat: zhToneless(zhHasHan(p) ? zhPinyin(p, '') : p) })).filter(a => a.flat);
    let best = { ok: false, close: false, heard: heard[0] || '' };
    for (const h of heard) {
      const c = zhSkChars(h); if (!c) continue;
      const toned = zhPinyin(c, ''), flat = zhToneless(toned);
      for (const a of answers) {
        if (a.c && c === a.c || toned === a.toned) return { ok: true, close: false, heard: h };   // the same characters, or the same sounds and tones
        if (a.c && (a.c.length >= 2 ? c.includes(a.c) : c.length <= 4 && c.includes(a.c))) return { ok: true, close: false, heard: h };   // said inside a longer phrase
        if (flat === a.flat || a.flat.length >= 5 && flat.includes(a.flat)) best = best.ok ? best : { ok: true, close: true, heard: h };   // the right sounds with another tone
        else if (a.flat.length >= 8 && skLev(flat, a.flat) <= 1 && !best.ok) best = { ok: true, close: true, heard: h };
      }
    }
    return best;
  };
}

/* ---------- 🔢 Numbers & ABC ---------- */
if (typeof NG_LANGS !== 'undefined') {
  NG_LANGS.zh = { name: 'Chinese', flag: '🇨🇳', tts: 'zh-CN', kana: true };
  NG_WORDS.zh = n => {   // 十二, 二十, 一百零五, 一百一十, 两百, 一千
    const u = '零一二三四五六七八九'; if (n === 1000) return '一千';
    const two = x => x < 10 ? u[x] : (x >= 20 ? u[Math.floor(x / 10)] : '') + '十' + (x % 10 ? u[x % 10] : '');
    if (n < 100) return two(n);
    const r = n % 100; return (n < 300 && n >= 200 ? '两' : u[Math.floor(n / 100)]) + '百' + (!r ? '' : r < 10 ? '零' + u[r] : r < 20 ? '一' + two(r) : two(r));
  };
  // the sounds a syllable can start with, each with a common character (b: 爸 bà)
  NG_ABC.zh = 'b:爸 p:朋 m:妈 f:饭 d:大 t:他 n:你 l:来 g:个 k:看 h:好 j:家 q:去 x:小 r:人 z:在 c:菜 s:三 y:一 w:我';
  NG_MODES.liang = { icon: '✌️', label: '两 or 二?', desc: 'Two ways to say “two”: pick the right one for each phrase.', zh: true };
}
// ngAbc splits on one-letter names, so the two-letter sounds (zh, ch, sh) need their own list
const ZH_SOUNDS = [['b', '爸'], ['p', '朋'], ['m', '妈'], ['f', '饭'], ['d', '大'], ['t', '他'], ['n', '你'], ['l', '来'], ['g', '个'], ['k', '看'], ['h', '好'], ['j', '家'], ['q', '去'], ['x', '小'], ['zh', '中'], ['ch', '吃'], ['sh', '书'], ['r', '人'], ['z', '在'], ['c', '菜'], ['s', '三'], ['y', '一'], ['w', '我']];
// measure words take 两; counting, ordinals, dates and the tens take 二
const ZH_LIANG = [['＿个人', '两', 'two people'], ['＿本书', '两', 'two books'], ['＿杯茶', '两', 'two cups of tea'], ['＿只猫', '两', 'two cats'], ['＿点', '两', 'two o’clock'], ['＿天', '两', 'two days'], ['＿岁', '两', 'two years old'], ['＿次', '两', 'two times'], ['＿千', '两', 'two thousand'], ['＿张桌子', '两', 'two tables'], ['＿辆车', '两', 'two cars'], ['＿个月', '两', 'two months'],
  ['十＿', '二', 'twelve'], ['＿十', '二', 'twenty'], ['第＿', '二', 'second (number two)'], ['＿月', '二', 'February'], ['星期＿', '二', 'Tuesday'], ['一、＿、三', '二', 'one, two, three'], ['十＿个人', '二', 'twelve people'], ['＿十本书', '二', 'twenty books'], ['五月＿号', '二', 'May 2nd'], ['三十＿', '二', 'thirty-two'], ['＿楼', '二', 'second floor'], ['一百零＿', '二', 'one hundred and two']];
if (typeof ngQuestion === 'function') {
  const ngqAll = ngQuestion;
  ngQuestion = function () {
    if (ng.lang !== 'zh') return ngqAll();
    const R = a => a[Math.floor(Math.random() * a.length)];
    if (ng.mode === 'liang') {
      const left = ZH_LIANG.filter(x => !ng.log.some(q => q.phrase === x[0])), [phrase, answer, en] = R(left.length ? left : ZH_LIANG), full = phrase.replace('＿', answer);
      ng.q = { mode: 'liang', phrase, en, opts: ['两', '二'], answer, name: `${full} · ${en}`, say: full, letter: '2' }; ng.t0 = Date.now(); return;
    }
    if (ng.mode === 'abcHear' || ng.mode === 'abcName') {
      const pick = R(ZH_SOUNDS), others = shuffle(ZH_SOUNDS.filter(x => x[0] !== pick[0])).slice(0, 3), hear = ng.mode === 'abcHear';
      const q = { mode: ng.mode, letter: pick[0], name: pick[1], opts: shuffle([pick, ...others]).map(x => x[hear ? 0 : 1]), answer: pick[hear ? 0 : 1], say: pick[1] };
      ng.q = q; ng.t0 = Date.now(); if (hear) setTimeout(() => ng?.q === q && ngSay(q.say), 250); return;
    }
    return ngqAll();
  };
}
if (typeof ngAnswer === 'function') {   // ⌨️ Write the word: pinyin counts, and so does 二百 for 两百
  const ngaAll = ngAnswer;
  ngAnswer = function (given) {
    if (ng?.lang === 'zh' && ng.mode === 'type' && ng.q && typeof given === 'string') {
      const t = given.replace(/\s+/g, ''), a = ng.q.answer;
      if (t.replace(/^二百/, '两百').replace(/^一十/, '十') === a || zhPinyinOk(given, a) || zhPinyinOk(given, a.replace(/^两百/, '二百'))) given = a;
    }
    return ngaAll(given);
  };
}
if (typeof views !== 'undefined' && views.numgame) {
  const ngView = views.numgame, small = w => `<small class="muted" lang="zh-Latn">${esc(zhPinyin(w, ''))}</small>`;
  views.numgame = () => {
    let h = ngView();
    if (!ng) {
      if (ngLang() !== 'zh') return h.replace(/<button type="button" class="ng-mode[^"]*" data-act="ngMode" data-k="liang">[\s\S]*?<\/button>/, '');
      h = h.replace('<div><b>Alphabet</b>', '<div><b>Pinyin sounds</b><p class="muted small" style="margin:2px 0 6px">Chinese has no alphabet. Its sounds are written in pinyin, and these are the sounds a word can start with, each with a common character. When you type a number, pinyin counts too (with or without tones).</p>');
      h = h.replace(/<div class="ng-sheet abc">[\s\S]*?<\/div>/, `<div class="ng-sheet abc">${ZH_SOUNDS.map(([l, c]) => `<button type="button" class="ng-cell" data-act="ngSayIt" data-t="${c}"><b>${l}</b><span>${c}</span></button>`).join('')}</div><p class="muted small"><b>两</b> goes before measure words and 百, 千, 万 (两个人, 两百). <b>二</b> is for counting, the tens, dates and “second” (十二, 二十, 二月, 第二).</p>`);
      h = h.replace(/Practice numbers and the alphabet in/, 'Practice numbers and sounds in').replace('Hear a letter', 'Hear a sound').replace('Listen to the letter’s name, then pick the letter.', 'Listen to a word, then pick the sound it starts with.').replace('Name the letter', 'Find the sound').replace('See a letter, then pick its name.', 'See a sound, then pick the character that starts with it.').replace('Hear a number word spelled letter by letter, then pick the word.', 'Hear a number character by character, then pick it.');
    } else if (ng.lang === 'zh' && ng.q) {
      if (ng.mode === 'liang') h = h.replace(`<div class="ng-big">${ng.q.n}</div>`, `<div class="ng-big word">${esc(ng.q.given == null ? ng.q.phrase : ng.q.phrase.replace('＿', ng.q.answer))}</div><div class="muted">${esc(ng.q.en)}</div>`);
      else if (ng.mode === 'read') h = h.replace(`<div class="ng-big word">${esc(ng.q.word)}</div>`, `<div class="ng-big word">${esc(ng.q.word)}</div><div>${small(ng.q.word)}</div>`);
      if (ng.q.given != null && ng.mode !== 'liang') h = h.replace(/(<div class="ng-verdict[^>]*>)([\s\S]*?)( <button)/, (_, a, b, c) => `${a}${b} ${small(ng.q.say)}${c}`);
    }
    if (ng?.lang === 'zh') h = h.replace('Listen to the letter’s name, then pick the letter.', 'Listen to a word, then pick the sound it starts with.').replace('See a letter, then pick its name.', 'See a sound, then pick the character that starts with it.').replace('Hear a letter', 'Hear a sound').replace('Name the letter', 'Find the sound').replace('Hear a number word spelled letter by letter, then pick the word.', 'Hear a number character by character, then pick it.');
    if ((ng ? ng.lang : ngLang()) === 'zh') h = h.replace(/(<button type="button" class="ng-cell[^>]*><b>[^<]*<\/b><span>)([一-鿿]+)(<\/span>)/g, (_, a, w, b) => `${a}${w}<br>${small(w)}${b}`);
    return h;
  };
  const langAct = actions.ngLang;
  actions.ngLang = el => { if (el.dataset.k !== 'zh' && S.settings.ngMode === 'liang') S.settings.ngMode = 'hear'; return langAct(el); };
}

/* ---------- 📖 Sentence Builder: build your own, and the credit ---------- */
if (typeof views !== 'undefined' && views.realsent) {
  const rsView = views.realsent;
  views.realsent = () => {
    const h = rsView();
    if (rs?.lang !== 'zh' || rs.loading || rs.err) return h;
    return h + `<p class="muted small" style="text-align:center">Pinyin, word breaks and word meanings come from <a href="https://cc-cedict.org" target="_blank" rel="noopener">CC-CEDICT</a> (<a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>).</p>`;
  };
  Object.assign(actions, { zhBuildOwn: () => { if (typeof startBuilder !== 'function') return; const id = rs?.deckId; startBuilder(id); if (bld) { bld.lang = 'zh'; bldRound(); render(); } } });
}
if (typeof views !== 'undefined' && views.builder) {
  const bView = views.builder;
  views.builder = () => { const h = bView(); return bld?.lang === 'zh' && typeof S !== 'undefined' && (S.bldWords || []).some(m => m.lang === 'zh') ? h + '<p class="muted small" style="text-align:center">Pinyin for your own words comes from CC-CEDICT (cc-cedict.org, CC BY-SA 4.0).</p>' : h; };
}
// the games page names the languages with real sentences
if (typeof GAMES !== 'undefined' && GAMES.builder && !/Chinese/.test(GAMES.builder.desc)) GAMES.builder.desc = GAMES.builder.desc.replace(/,? and (\p{L}+)\.$/u, ', $1 and Chinese.');

/* ---------- a Chinese starter deck (New deck window) ---------- */
if (typeof STARTERS !== 'undefined') STARTERS.zh = { name: 'Chinese basics (sample)', flag: '🇨🇳', label: 'Chinese', frontLang: 'zh-CN', backLang: 'en-US', cards: [
  ['你好', 'hello', 'nǐ hǎo'], ['谢谢', 'thank you', 'xièxie'], ['不客气', 'you’re welcome', 'bú kèqi'], ['再见', 'goodbye', 'zàijiàn'], ['对不起', 'sorry', 'duìbuqǐ'], ['请', 'please', 'qǐng'],
  ['我', 'I', 'wǒ'], ['你', 'you', 'nǐ'], ['他', 'he', 'tā (she is 她, also said tā)'], ['是', 'to be', 'shì (also used for “yes”)'], ['不', 'not / no', 'bù'],
  ['朋友', 'friend', 'péngyou'], ['老师', 'teacher', 'lǎoshī'], ['学生', 'student', 'xuésheng'], ['妈妈', 'mom', 'māma'], ['爸爸', 'dad', 'bàba'],
  ['狗', 'dog', 'gǒu · measure word 只: 一只狗'], ['猫', 'cat', 'māo · measure word 只: 一只猫'], ['水', 'water', 'shuǐ · a glass of water: 一杯水'], ['茶', 'tea', 'chá · a cup of tea: 一杯茶'],
  ['米饭', 'rice', 'mǐfàn · a bowl of rice: 一碗米饭'], ['苹果', 'apple', 'píngguǒ · measure word 个: 一个苹果'], ['书', 'book', 'shū · measure word 本: 一本书'], ['家', 'home', 'jiā (also: family)'], ['学校', 'school', 'xuéxiào'],
  ['吃', 'to eat', 'chī'], ['喝', 'to drink', 'hē'], ['去', 'to go', 'qù'], ['看', 'to look', 'kàn (also: to read, to watch)'], ['说', 'to speak', 'shuō'], ['有', 'to have', 'yǒu · not have: 没有'], ['喜欢', 'to like', 'xǐhuan'],
  ['大', 'big', 'dà'], ['小', 'small', 'xiǎo'], ['好', 'good', 'hǎo'], ['很', 'very', 'hěn · links who and how: 我很好'], ['今天', 'today', 'jīntiān'], ['明天', 'tomorrow', 'míngtiān'],
  ['一', 'one', 'yī'], ['二', 'two (counting)', 'èr'], ['两', 'two (of something)', 'liǎng · before a measure word: 两个'], ['三', 'three', 'sān'], ['什么', 'what', 'shénme'], ['谁', 'who', 'shéi'], ['哪儿', 'where', 'nǎr'],
  ['你好吗？', 'How are you?', 'nǐ hǎo ma?'], ['厕所在哪儿？', 'Where is the bathroom?', 'cèsuǒ zài nǎr?']] };

/* ---------- 🌐 Auto-translate ---------- */
if (typeof txCorpus === 'function') {   // the Chinese sentence set helps decide between meanings (its words are already split)
  const corpusAll = txCorpus;
  txCorpus = async function (lang) {
    if (lang !== 'zh') return corpusAll(lang);
    return (txCorpusCache.zh ||= fetch('data/real-zh.json').then(r => r.ok ? r.json() : null).then(j => (j?.items || []).map(it => ({ src: String(it[1] || '').replace(/\|/g, ' '), en: String(it[2] || '').toLowerCase() }))).catch(() => null));
  };
}
if (typeof txAppIndex === 'function') {   // the Sentence Builder's words, the starter deck, then the word list
  const appAll = txAppIndex;
  txAppIndex = function (lang) {
    if (lang !== 'zh') return appAll(lang);
    if (txAppCache.zh) return txAppCache.zh;
    const fwd = new Map(), add = (w, en) => { w = String(w || '').trim(); if (!w || !en) return; for (const g of String(en).split(/\s*[\/;]\s*/)) { const t = g.trim(); if (!t || /…|^\(|\.\.\./.test(t)) continue; if (!fwd.has(w)) fwd.set(w, []); if (!fwd.get(w).includes(t)) fwd.get(w).push(t); } };
    if (typeof ZH_NOUN !== 'undefined') {
      ZH_NOUN.forEach(n => add(n[0], n[3])); ZH_ADJ.forEach(a => add(a[0], a[2])); ZH_PRON.forEach(p => add(p[0], p[2])); ZH_Q.forEach(q => add(q[0], q[2]));
      ZH_VERB.forEach(v => add(v[0], v[0] === '看' ? 'to look / to read / to watch' : 'to ' + v[5][0])); ZH_ADV.forEach(a => add(a[0], a[0] === '很' ? 'very' : a[2].replace(/\s*\(.*\)/, '')));
    }
    if (typeof STARTERS !== 'undefined' && STARTERS.zh) for (const [f, b] of STARTERS.zh.cards) add(f.replace(/[？！。]$/, ''), b.replace(/\s*\(.*\)/, ''));
    if (typeof RS_DICT !== 'undefined' && RS_DICT.zh) for (const [w, [, g]] of RS_DICT.zh) add(w, g);
    const back = new Map(); for (const [w, list] of fwd) for (const t of list) { const k = txKey(t); if (!k) continue; if (!back.has(k)) back.set(k, []); if (!back.get(k).includes(w)) back.get(k).push(w); }
    return (txAppCache.zh = { fwd, back });
  };
}

/* ---------- game text and reports: Chinese's name ---------- */
if (typeof GT_LANG_ENGLISH !== 'undefined') GT_LANG_ENGLISH.zh = 'Chinese';
if (typeof GT_LANG_NAMES !== 'undefined') GT_LANG_NAMES.zh = '中文';
