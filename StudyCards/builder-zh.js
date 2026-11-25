'use strict';
/* ================= Sentence Builder: Chinese (Mandarin, Simplified) =================
   What the checker teaches:
   • subject – verb – object order, with time (今天) and place (在家) before the verb, never at the end
   • a number or 这 / 那 needs a measure word before the noun: 一本书, 两只猫, 这杯茶; and “two” is 两 there, not 二
   • 的 for possession (我的书; family words can drop it: 我妈妈) and between a longer describing word and its noun (漂亮的花)
   • adjectives need no 是: 他很忙 (很 links them, it doesn’t always mean “very”)
   • 不 for now and later, 没 for the past and for 有 (没有); 了 for something done, 过 for something you have ever done, 在 for -ing
   • questions: 吗 at the end, or a question word (谁, 什么, 哪儿, 几) right where the answer would go, with no 吗
   No spaces between words. The hint under each word gives its pinyin and English. Loaded after builder.js. */

//            hanzi   pinyin    English   object   possessive  person (1 I, 2 you, 3 he/she, p plural)
const ZH_PRON = [['我', 'wǒ', 'I', 'me', 'my', '1'], ['你', 'nǐ', 'you', 'you', 'your', '2'], ['他', 'tā', 'he', 'him', 'his', '3'], ['她', 'tā', 'she', 'her', 'her', '3'],
  ['我们', 'wǒmen', 'we', 'us', 'our', 'p'], ['你们', 'nǐmen', 'you', 'you', 'your', 'p'], ['他们', 'tāmen', 'they', 'them', 'their', 'p']];
const ZH_MINE = { my: 'mine', your: 'yours', his: 'his', her: 'hers', our: 'ours', their: 'theirs' };
//            hanzi     pinyin        kind      English        measure words (first = the usual one)  flags: f family (的 can be left out), m no plural in English, n can't be counted, a "the" in English
const ZH_NOUN = [
  ['老师', 'lǎoshī', 'person', 'teacher', '个位', 'a'], ['学生', 'xuésheng', 'person', 'student', '个', 'a'], ['朋友', 'péngyou', 'person', 'friend', '个位', 'a'], ['医生', 'yīshēng', 'person', 'doctor', '个位', 'a'],
  ['孩子', 'háizi', 'person', 'child', '个', 'a'], ['妈妈', 'māma', 'person', 'mom', '', 'f'], ['爸爸', 'bàba', 'person', 'dad', '', 'f'], ['妹妹', 'mèimei', 'person', 'little sister', '', 'fa'], ['弟弟', 'dìdi', 'person', 'little brother', '', 'fa'],
  ['狗', 'gǒu', 'animal', 'dog', '只条', 'a'], ['猫', 'māo', 'animal', 'cat', '只', 'a'], ['鸟', 'niǎo', 'animal', 'bird', '只', 'a'], ['马', 'mǎ', 'animal', 'horse', '匹', 'a'],
  ['苹果', 'píngguǒ', 'food', 'apple', '个', 'a'], ['面包', 'miànbāo', 'food', 'bread', '块个', 'ma'], ['米饭', 'mǐfàn', 'food', 'rice', '碗', 'ma'], ['面条', 'miàntiáo', 'food', 'noodles', '碗', 'ma'],
  ['鱼', 'yú', 'food', 'fish', '条', 'ma'], ['鸡蛋', 'jīdàn', 'food', 'egg', '个', 'a'], ['蛋糕', 'dàngāo', 'food', 'cake', '块个', 'a'], ['饺子', 'jiǎozi', 'food', 'dumpling', '个', 'a'],
  ['水', 'shuǐ', 'drink', 'water', '杯瓶', 'ma'], ['茶', 'chá', 'drink', 'tea', '杯', 'ma'], ['咖啡', 'kāfēi', 'drink', 'coffee', '杯', 'ma'], ['牛奶', 'niúnǎi', 'drink', 'milk', '杯瓶', 'ma'], ['果汁', 'guǒzhī', 'drink', 'juice', '杯瓶', 'ma'],
  ['书', 'shū', 'read', 'book', '本', 'a'], ['杂志', 'zázhì', 'read', 'magazine', '本', 'a'], ['报纸', 'bàozhǐ', 'read', 'newspaper', '份张', 'a'], ['信', 'xìn', 'read', 'letter', '封', 'a'],
  ['家', 'jiā', 'place', 'home', '', 'n'], ['学校', 'xuéxiào', 'place', 'school', '个所', ''], ['公园', 'gōngyuán', 'place', 'park', '个', 'a'], ['商店', 'shāngdiàn', 'place', 'store', '个家', 'a'], ['饭馆', 'fànguǎn', 'place', 'restaurant', '个家', 'a'],
  ['图书馆', 'túshūguǎn', 'place', 'library', '个', 'a'], ['房间', 'fángjiān', 'place', 'room', '个间', 'a'], ['医院', 'yīyuàn', 'place', 'hospital', '个家', 'a'], ['中国', 'Zhōngguó', 'place', 'China', '', 'n'], ['北京', 'Běijīng', 'place', 'Beijing', '', 'n'],
  ['车', 'chē', 'thing', 'car', '辆', 'a'], ['自行车', 'zìxíngchē', 'thing', 'bike', '辆', 'a'], ['桌子', 'zhuōzi', 'thing', 'table', '张', 'a'], ['椅子', 'yǐzi', 'thing', 'chair', '把', 'a'], ['伞', 'sǎn', 'thing', 'umbrella', '把', 'a'],
  ['手机', 'shǒujī', 'thing', 'phone', '个部', 'a'], ['电脑', 'diànnǎo', 'thing', 'computer', '台个', 'a'], ['衣服', 'yīfu', 'thing', 'shirt', '件', 'a'], ['花', 'huā', 'thing', 'flower', '朵束', 'a'], ['电视', 'diànshì', 'thing', 'TV', '台个', 'a'],
  ['中文', 'Zhōngwén', 'lang', 'Chinese', '', 'nm'], ['英文', 'Yīngwén', 'lang', 'English', '', 'nm']];
//            measure word  pinyin   what it counts            English (containers: "a cup of")
const ZH_MW = { '个': ['gè', 'most people and things'], '本': ['běn', 'books'], '只': ['zhī', 'animals'], '杯': ['bēi', 'cups and glasses', 'cup'], '张': ['zhāng', 'flat things: tables, paper'],
  '辆': ['liàng', 'cars and bikes'], '把': ['bǎ', 'things you hold: chairs, umbrellas'], '件': ['jiàn', 'clothes'], '位': ['wèi', 'people (polite)'], '条': ['tiáo', 'long things: fish, dogs'],
  '块': ['kuài', 'pieces', 'piece'], '碗': ['wǎn', 'bowls', 'bowl'], '瓶': ['píng', 'bottles', 'bottle'], '封': ['fēng', 'letters'], '份': ['fèn', 'newspapers'], '台': ['tái', 'machines'],
  '朵': ['duǒ', 'flowers'], '束': ['shù', 'bunches', 'bunch'], '匹': ['pǐ', 'horses'], '所': ['suǒ', 'schools'], '家': ['jiā', 'shops and restaurants'], '间': ['jiān', 'rooms'], '部': ['bù', 'phones'] };
//            hanzi  pinyin  English    describes (p people, a animals, f food & drink, t things, l places, r reading)   1 = can go straight before a noun (大狗); the others take 的 (贵的书)
const ZH_ADJ = [['大', 'dà', 'big', 'atlr', 1], ['小', 'xiǎo', 'small', 'atlr', 1], ['新', 'xīn', 'new', 'tlr', 1], ['旧', 'jiù', 'old', 'tr', 1], ['好', 'hǎo', 'good', 'patflr', 1], ['高', 'gāo', 'tall', 'pa'],
  ['贵', 'guì', 'expensive', 'tfr'], ['便宜', 'piányi', 'cheap', 'tfr'], ['好吃', 'hǎochī', 'tasty', 'f'], ['好看', 'hǎokàn', 'nice-looking', 'tlr'], ['漂亮', 'piàoliang', 'pretty', 'ptl'],
  ['忙', 'máng', 'busy', 'p'], ['累', 'lèi', 'tired', 'pa'], ['热', 'rè', 'hot', 'f'], ['可爱', 'kě’ài', 'cute', 'pa'], ['快', 'kuài', 'fast', 'pat'], ['安静', 'ānjìng', 'quiet', 'pl'], ['红', 'hóng', 'red', 'tf', 1]];
//            hanzi   pinyin     kind   takes            needs one  English base / he-she / past / -ing / done      who (p people only, a animals too)   places where it makes sense (for made-up sentences)
const ZH_VERB = [
  ['吃', 'chī', 'tr', ['food'], 1, ['eat', 'eats', 'ate', 'eating', 'eaten'], 'a', '家饭馆学校'], ['喝', 'hē', 'tr', ['drink'], 1, ['drink', 'drinks', 'drank', 'drinking', 'drunk'], 'a', '家饭馆'],
  ['看', 'kàn', 'tr', ['read', 'thing', 'person', 'animal'], 1, ['read', 'reads', 'read', 'reading', 'read'], 'p', '家图书馆房间公园'], ['买', 'mǎi', 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, ['buy', 'buys', 'bought', 'buying', 'bought'], 'p', '商店北京'],
  ['喜欢', 'xǐhuan', 'like', ['*'], 1, ['like', 'likes', 'liked', 'liking', 'liked'], 'a', ''], ['写', 'xiě', 'tr', ['read'], 0, ['write', 'writes', 'wrote', 'writing', 'written'], 'p', '家图书馆房间'],
  ['做', 'zuò', 'tr', ['food'], 1, ['make', 'makes', 'made', 'making', 'made'], 'p', '家'], ['等', 'děng', 'tr', ['person', 'animal'], 1, ['wait for', 'waits for', 'waited for', 'waiting for', 'waited for'], 'a', '学校公园医院商店'],
  ['找', 'zhǎo', 'tr', ['person', 'animal', 'thing', 'read'], 1, ['look for', 'looks for', 'looked for', 'looking for', 'looked for'], 'a', '家学校公园房间'],
  ['说', 'shuō', 'tr', ['lang'], 1, ['speak', 'speaks', 'spoke', 'speaking', 'spoken'], 'p', '学校中国北京家'], ['学', 'xué', 'tr', ['lang'], 1, ['learn', 'learns', 'learned', 'learning', 'learned'], 'p', '学校中国北京'],
  ['去', 'qù', 'go', null, 1, ['go', 'goes', 'went', 'going', 'been'], 'a', ''], ['来', 'lái', 'go', null, 1, ['come', 'comes', 'came', 'coming', 'come'], 'a', ''], ['回', 'huí', 'go', null, 1, ['go back', 'goes back', 'went back', 'going back', 'gone back'], 'a', ''],
  ['工作', 'gōngzuò', 'in', null, 0, ['work', 'works', 'worked', 'working', 'worked'], 'p', '学校医院商店饭馆图书馆北京'], ['睡觉', 'shuìjiào', 'in', null, 0, ['sleep', 'sleeps', 'slept', 'sleeping', 'slept'], 'a', '家房间'],
  ['跑步', 'pǎobù', 'in', null, 0, ['run', 'runs', 'ran', 'running', 'run'], 'a', '公园学校'], ['游泳', 'yóuyǒng', 'in', null, 0, ['swim', 'swims', 'swam', 'swimming', 'swum'], 'a', ''], ['学习', 'xuéxí', 'in', null, 0, ['study', 'studies', 'studied', 'studying', 'studied'], 'p', '学校图书馆家房间'],
  ['有', 'yǒu', 'have', null, 1, ['have', 'has', 'had', 'having', 'had'], 'a', ''], ['是', 'shì', 'be', null, 1, ['be', 'is', 'was', 'being', 'been'], 'a', '']];
// 看 means read, watch or look at, by what you look at
const zhKanEn = cat => cat === 'read' ? null : cat === 'tv' ? ['watch', 'watches', 'watched', 'watching', 'watched'] : ['look at', 'looks at', 'looked at', 'looking at', 'looked at'];
//            hanzi   pinyin       English      how: time = when (before the verb) · also / all / freq · neg · deg = 很 / 非常 (before an adjective) · prog = -ing · with = together
const ZH_ADV = [['今天', 'jīntiān', 'today', 'time'], ['明天', 'míngtiān', 'tomorrow', 'time'], ['昨天', 'zuótiān', 'yesterday', 'time'], ['每天', 'měitiān', 'every day', 'time'], ['现在', 'xiànzài', 'now', 'time'],
  ['也', 'yě', 'also', 'also'], ['都', 'dōu', 'all', 'all'], ['常常', 'chángcháng', 'often', 'freq'], ['不', 'bù', 'not', 'neg'], ['没', 'méi', 'not (did not)', 'neg'],
  ['很', 'hěn', 'very / (links)', 'deg'], ['非常', 'fēicháng', 'really', 'deg'], ['一起', 'yìqǐ', 'together', 'with']];
// numbers and 这 / 那 (determiners); 二 is the trap: before a measure word, two is 两
const ZH_DET = [['一', 'yī', 'a', 1], ['两', 'liǎng', 'two', 2], ['三', 'sān', 'three', 3], ['四', 'sì', 'four', 4], ['五', 'wǔ', 'five', 5], ['十', 'shí', 'ten', 10], ['二', 'èr', 'two (counting)', 2],
  ['这', 'zhè', 'this', 'this'], ['那', 'nà', 'that', 'that'], ['几', 'jǐ', 'how many', 'q']];
const ZH_PART = { '了': ['le', 'done (completed action)'], '过': ['guo', 'ever (have done before)'], '吗': ['ma', '? (yes/no question)'], '的': ['de', '’s / of'], '里': ['lǐ', 'in / inside'] };
const ZH_Q = [['谁', 'shéi', 'who'], ['什么', 'shénme', 'what'], ['哪儿', 'nǎr', 'where']];
const ZH_PREP = { '在': ['zài', 'at / in (a place)'], '跟': ['gēn', 'with'] };
const ZH_KIND = { food: 'food', drink: 'drinks', read: 'things you read or write', thing: 'things', place: 'places', animal: 'animals', person: 'people', lang: 'languages' };
const ZH_CAT_CODE = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
const ZH_NUM_EN = ['', 'a', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/* chips (gloss = pinyin · English, shown under the word) */
const zhPron = p => chip({ k: 'pron', w: p[0], e: p, en: p[2], gloss: `${p[1]} · ${p[2]}` });
const zhQ = w => { const q = ZH_Q.find(x => x[0] === w); return chip({ k: 'pron', w, q: q[2], en: q[2], gloss: `${q[1]} · ${q[2]}?` }); };
const zhNoun = n => chip({ k: 'noun', w: n[0], e: n, cat: n[2], en: n[3], gloss: `${n[1]} · ${n[3]}` });
const zhAdj = a => chip({ k: 'adj', w: a[0], e: a, en: a[2], gloss: `${a[1]} · ${a[2]}` });
const zhVerb = v => chip({ k: 'verb', w: v[0], e: v, type: v[2], gloss: `${v[1]} · ${v[0] === '看' ? 'read / watch / look at' : v[2] === 'be' ? 'to be (is, are)' : v[5][0]}` });
const zhAdv = w => { const a = ZH_ADV.find(x => x[0] === w); return chip({ k: 'adv', w, how: a[3], en: a[2], gloss: `${a[1]} · ${a[2]}` }); };
const zhDet = w => { const d = ZH_DET.find(x => x[0] === w); return chip({ k: 'det', w, n: d[3], en: d[2], gloss: `${d[1]} · ${d[0] === '一' ? 'one / a' : d[2]}` }); };
const zhMw = w => chip({ k: 'mw', w, gloss: `${ZH_MW[w][0]} · (for ${ZH_MW[w][1]})` });
const zhPart = w => chip({ k: 'part', w, gloss: `${ZH_PART[w][0]} · ${ZH_PART[w][1]}` });
const zhPrep = w => chip({ k: 'prep', w, gloss: `${ZH_PREP[w][0]} · ${ZH_PREP[w][1]}` });
const zhNounBy = w => ZH_NOUN.find(n => n[0] === w);
const zhMws = n => [...(n.e?.[4] ?? n[4] ?? '')];

/* ---------------- Chinese checker ---------------- */
function zhCheck(T) {
  let i = 0;
  const err = (msg, at = i) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length }), peek = (o = 0) => T[i + o], isErr = x => x && x.ok === false;
  if (!T.length) return err('Tap some words to build a sentence.');
  const is = (t, k, w) => t && t.k === k && (w == null || [].concat(w).includes(t.w));
  const isNounish = t => t && (t.k === 'noun' || (t.k === 'pron' && !t.q) || (t.k === 'pron' && t.q && t.w !== '哪儿'));
  const startsNP = t => t && (t.k === 'noun' || t.k === 'pron' || t.k === 'det' || t.k === 'mw' || t.k === 'adj' || is(t, 'adv', ['很', '非常']));
  // a noun phrase: (owner 的) (number / 这 / 那 / 几 + measure word) (describing word (的)) noun
  function NP(opts = {}) {
    const start = i, np = { start, adjs: [] };
    // the owner: 我的…, 老师的…, 我妈妈
    const a = peek(), b = peek(1);
    if (isNounish(a) && !a.q && is(b, 'part', '的')) {
      i += 2; np.owner = { n: a };
      if (!startsNP(peek()) || peek().k === 'pron') { np.deOnly = true; np.end = i; return np; }   // 我的: “mine”
    } else if (a?.k === 'pron' && !a.q && b?.k === 'noun' && b.e?.[5]?.includes('f')) { i++; np.owner = { n: a, noDe: true }; }
    if (peek()?.k === 'det') {
      const d = T[i++]; np.det = d;
      if (peek()?.k === 'mw') np.mw = T[i++];
      else if ((d.w === '这' || d.w === '那') && (is(peek(), 'verb', '是') || is(peek(), 'adv') && !['很', '非常'].includes(peek().w) || is(peek(), 'adv', ['很', '非常']) || peek()?.k === 'adj' && !isNounish(peek(1)) || !peek() || is(peek(), 'part', '吗'))) { np.thisAlone = true; np.end = i; return np; }   // 这是…, 这很好
      else if (peek()?.k === 'noun' || peek()?.k === 'adj') { const n = T.slice(i).find(t => t.k === 'noun'); const good = n ? zhMws(n)[0] : '个';
        if (!n || !zhMws(n).length) return err(`“${d.w}” can’t go right before “${(n || peek()).w}”.`, i - 1);
        return err(`Chinese needs a measure word between “${d.w}” and the noun: “${d.w === '二' ? '两' : d.w}${good}${n.w}”.`, i - 1); }
      else return err(`After “${d.w}” comes a measure word and a noun: “${d.w === '二' ? '两' : d.w}本书”, “${d.w === '二' ? '两' : d.w}个人”.`, i - 1);
      if (d.w === '二') return err(`Before a measure word, “two” is “两”, not “二”: “两${np.mw.w}…”. (二 is for counting: 一, 二, 三.)`, i - 2);
    } else if (peek()?.k === 'mw') return err(`A measure word like “${peek().w}” comes after a number or 这 / 那: “一${peek().w}…”, “这${peek().w}…”.`, i);
    // describing words: 大狗, 漂亮的花, 很大的狗
    for (;;) {
      if (is(peek(), 'adv', ['很', '非常']) && peek(1)?.k === 'adj') {
        if (!is(peek(2), 'part', '的')) { if (isNounish(peek(2))) return err(`With “${peek().w}”, put 的 between the describing word and the noun: “${peek().w}${peek(1).w}的${peek(2).w}”.`, i + 2); break; }
        np.adjs.push({ a: T[i + 1], deg: T[i], de: true }); i += 3; continue;
      }
      if (peek()?.k === 'adj') {
        const ad = peek();
        if (is(peek(1), 'part', '的')) { if (!isNounish(peek(2)) || peek(2).k === 'pron') { if (!np.owner && !np.det) break; return err('After 的 comes the noun it describes.', i + 2); } np.adjs.push({ a: ad, de: true }); i += 2; continue; }
        if (isNounish(peek(1)) && peek(1).k === 'noun') {
          if (!ad.e?.[4]) return err(`Put 的 between “${ad.w}” and the noun: “${ad.w}的${peek(1).w}”. (Only a few short ones like 大, 小, 新, 好 go straight before a noun.)`, i + 1);
          np.adjs.push({ a: ad }); i++; continue;
        }
        break;
      }
      break;
    }
    if (np.det && peek()?.k === 'det') return err('Use one number (or 这 / 那) before the measure word.', i);
    const n = peek();
    if (!n || !isNounish(n) && !(n.k === 'pron' && n.q)) {
      if (np.adjs.length || np.det || np.owner) return err(np.det ? `After “${np.det.w}${np.mw.w}” comes a noun: “${np.det.w}${np.mw.w}${zhNounBy(ZH_NOUN.find(x => zhMws(x).includes(np.mw.w))?.[0] || '书')?.[0] || '书'}”.` : 'A noun (a person, place or thing) should go here.', i);
      return { none: true, start };
    }
    if (n.k === 'pron' && !n.q && (np.det || np.adjs.length)) return err(`“${n.w}” is a pronoun, so it doesn’t take a number or a describing word.`, i);
    if (n.q && n.w !== '什么' && (np.det || np.adjs.length || np.owner)) return err(`“${n.w}” stands alone here.`, i);
    i++; np.n = n; np.cat = n.q === 'what' ? '*' : n.q === 'who' ? 'person' : n.cat || (n.k === 'pron' ? 'person' : null);
    for (const a of np.adjs) { const code = ZH_CAT_CODE[n.cat]; if (n.k === 'noun' && a.a.e && (!code || !a.a.e[3].includes(code))) return err(`That doesn’t sound right: “${a.a.w}” (${a.a.en}) doesn’t describe ${ZH_KIND[n.cat] || 'that'}.`, T.indexOf(a.a)); }
    if (np.mw && n.k === 'noun') {
      const ok = zhMws(n);
      if (!ok.length) return err(`“${n.w}” isn’t counted with a measure word.`, np.start);
      if (!ok.includes(np.mw.w)) return err(`“${n.w}” goes with the measure word “${ok[0]}” (${ZH_MW[ok[0]][0]}), not “${np.mw.w}”: “${np.det.w}${ok[0]}${n.w}”.`, T.indexOf(np.mw));
    }
    if (np.det?.n === 'q' && n.k !== 'noun') return err('几 asks “how many”: 几 + measure word + noun, like “几本书”.', np.start);
    np.end = i; return np;
  }
  const npZh = np => T.slice(np.start, np.end).map(t => t.w).join('');
  const P = { time: [], adv: [], kind: null };
  const takeTime = () => { while (is(peek(), 'adv') && peek().how === 'time') P.time.push(T[i++]); };
  takeTime();
  if (is(peek(), 'adv') || peek()?.k === 'verb' || peek()?.k === 'part' || peek()?.k === 'prep' && peek().w !== '在') {
    const t = peek();
    if (t.k === 'part') return err(`A sentence can’t start with “${t.w}”.`, i);
    return err(`Start with who (or what) the sentence is about: “我${t.w}…”, “他${t.w}…”.`, i);
  }
  // who: a noun phrase. A place with 里 (房间里) or a place before 有 is where something is.
  let subj = null, where = null;
  if (peek()?.k === 'prep' && peek().w === '在') { const s0 = i; i++; const pl = NP(); if (isErr(pl)) return pl; if (pl.none || pl.cat !== 'place') return err('After 在 comes a place: “在家”, “在学校”.', s0 + 1);
    return err(`Put who first, then 在 and the place: “我在${npZh(pl)}…”.`, s0); }
  const s = NP(); if (isErr(s)) return s;
  if (s.none) return err('Start with who (or what) the sentence is about: 我, 你, 老师…', i);
  if (is(peek(), 'part', '里')) { if (s.cat !== 'place') return err(`“里” (inside) goes after a place: “房间里”.`, i); i++; where = s; }
  else if (s.cat === 'place' && is(peek(), 'verb', '有') || s.cat === 'place' && is(peek(), 'adv', ['也', '没']) && is(peek(1), 'verb', '有')) where = s;
  else subj = s;
  if (subj?.deOnly) return err(`“${npZh(subj)}” means “mine / yours…”. To start a sentence, add a noun after 的: “${npZh(subj)}书”.`, subj.start);
  takeTime();
  // the little words before the verb: 也 都 常常 不 / 没, then 跟 someone (一起) and 在 + place
  const ORDER = { also: 1, all: 2, freq: 3, neg: 3 };
  let last = 0, place = null, withNP = null, prog = null;
  for (;;) {
    const t = peek();
    if (is(t, 'adv') && ORDER[t.how]) {
      if (ORDER[t.how] < last) return err(t.how === 'also' ? '“也” goes right after who: “我也…”, before 都 and 不.' : t.how === 'all' ? '“都” goes before 不 and 常常: “我们都不…”.' : `“${t.w}” is in the wrong spot.`, i);
      if (place || withNP) return err(`Put “${t.w}” before ${place ? '在 + the place' : '跟 + who'}: “${t.w}${place ? '在' + npZh(place) : '跟' + npZh(withNP)}…”.`, i);
      if (t.how === 'neg' && P.neg) return err('One 不 or 没 is enough.', i);
      if (t.how === 'neg') { P.neg = t; P.negAfterFreq = !!P.freq; } else if (t.how === 'freq') P.freq = t; else if (t.how === 'also') P.also = t; else P.all = t;
      P.adv.push(t); last = ORDER[t.how]; i++; continue;
    }
    if (is(t, 'adv') && t.how === 'time') return err(`Time words like “${t.w}” go at the start or right after who: “${t.w}我…” or “我${t.w}…”.`, i);
    if (is(t, 'prep', '跟')) {
      if (withNP) return err('Say who you do it with only once.', i);
      i++; const w = NP(); if (isErr(w)) return w; if (w.none || !['person', 'animal'].includes(w.cat)) return err('After 跟 comes a person (or an animal): “跟朋友”.', i);
      withNP = w; if (is(peek(), 'adv', '一起')) { w.together = true; i++; } continue;
    }
    if (is(t, 'adv', '一起')) return err('“一起” (together) goes after 跟 + who: “跟朋友一起”.', i);
    if (is(t, 'prep', '在')) {
      // 在 + place (where), 在 + verb (-ing), or 在 + place at the end (be at)
      if (peek(1)?.k === 'verb') { if (prog) return err('One 在 is enough here.', i); if (place) return err(`“在${npZh(place)}” already comes before the verb, so leave out this 在: “在${npZh(place)}${peek(1).w}”.`, i); prog = T[i++]; continue; }
      if (place) return err('Say the place only once.', i);
      const at = i; i++;
      if (is(peek(), 'pron', '哪儿')) { place = { q: true, n: T[i++], start: at + 1, end: i, cat: 'place' }; }
      else { const pl = NP(); if (isErr(pl)) return pl; if (pl.none || pl.cat !== 'place') return err(pl.none ? 'After 在 comes a place: “在家”, “在学校”.' : `“在” + a place: “在学校”. “${npZh(pl)}” isn’t a place.`, at + 1); place = pl; }
      if (is(peek(), 'part', '里')) { i++; place.li = true; }
      place.zaiAt = at; continue;
    }
    break;
  }
  // the verb, the adjective, or the end (在 + place: be at)
  const v = peek();
  const endOK = () => !peek() || (is(peek(), 'part', '吗') && i === T.length - 1);
  if (where) {
    if (P.neg && P.neg.w !== '没') return err('“有” is made negative with 没: “没有”.', T.indexOf(P.neg));
    if (!is(v, 'verb', '有')) return err(`To say what is in ${npZh(where)}, use 有: “${npZh(where)}${where.li ? '' : '里'}有一只猫”.`, i);
    i++; const o = NP(); if (isErr(o)) return o; if (o.none) return err('After 有 comes what is there: “一只猫”, “两本书”.', i);
    if (o.cat === 'lang' || o.cat === 'place' && (where.li || o.n.e?.[5]?.includes('n'))) return err(`“${npZh(o)}” can’t be inside ${npZh(where)}.`, o.start);
    if (o.det && typeof o.det.n !== 'number' && o.det.n !== 'q') return err(`With 有 (“there is”), count it with a number, not “${o.det.w}”: “${npZh(where)}${where.li ? '' : '里'}有一${o.mw.w}${o.n.w}”.`, o.start);
    P.kind = 'exist'; P.where = where; P.obj = o; P.verb = v;
  } else if (!v || is(v, 'part', '吗')) {
    if (place && !prog) { if (P.neg && P.neg.w === '没') return err('For “not at a place” now, use 不: “我不在家”.', T.indexOf(P.neg)); P.kind = 'at'; P.place = place; }
    else if (subj?.thisAlone) return err(`Add what this is: “${subj.det.w}是…”, or a describing word: “${subj.det.w}很好”.`, i);
    else return err('Add a verb (like 吃 or 去) or a describing word (like 很忙).', i);
  } else if (v.k === 'adj' || is(v, 'adv', ['很', '非常'])) {
    if (place || withNP || prog) return err('A describing word doesn’t take 在 + a place or 跟 here. Try a verb.', i);
    if (P.neg?.w === '没') return err(`Describing words are made negative with 不, not 没: “不${v.k === 'adj' ? v.w : peek(1)?.w || ''}”.`, T.indexOf(P.neg));
    if (v.k !== 'adj') { P.deg = T[i++]; if (peek()?.k !== 'adj') return err(`“${P.deg.w}” goes right before a describing word: “${P.deg.w}忙”, “${P.deg.w}大”.`, i - 1); }
    P.adj = T[i++]; P.kind = 'adj';
    if (P.deg && P.neg) { /* 不很忙 is rare; 很不… is not taught here */ return err(`Use either 不 or “${P.deg.w}”: “他不忙” or “他${P.deg.w}忙”.`, T.indexOf(P.deg)); }
    const isQ = T.some(t => is(t, 'part', '吗'));
    if (!P.deg && !P.neg && !isQ && !P.also) return err(`In a statement, Chinese puts 很 before the describing word: “${subj ? npZh(subj) : ''}很${P.adj.w}”. Here 很 just links them, it doesn’t have to mean “very”.`, T.indexOf(P.adj));
    const fit = subj?.n?.k === 'noun' ? { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' }[subj.cat] : 'p';
    if (fit && P.adj.e && !P.adj.e[3].includes(fit) && !subj.thisAlone) return err(`That doesn’t sound right: “${P.adj.w}” (${P.adj.en}) doesn’t describe ${ZH_KIND[subj.cat] || 'that'}.`, T.indexOf(P.adj));
  } else if (v.k === 'verb') {
    i++; P.verb = v;
    const type = v.type;
    if (is(peek(), 'part', ['了', '过'])) P.asp = T[i++];
    if (P.asp && is(peek(), 'part', ['了', '过'])) return err('Use 了 or 过, not both.', i);
    if (type === 'be') {
      if (P.asp) return err('“是” doesn’t take 了 or 过.', T.indexOf(P.asp));
      if (P.neg?.w === '没') return err('“是” is made negative with 不: “不是”.', T.indexOf(P.neg));
      if (place || withNP || prog) return err('“是” says what something is, so it doesn’t take 在 or 跟 here.', i - 1);
      if (peek()?.k === 'adj' || is(peek(), 'adv', ['很', '非常'])) return err(`Chinese doesn’t use 是 before a describing word: “${subj ? npZh(subj) : '他'}很${peek().k === 'adj' ? peek().w : peek(1)?.w || '忙'}”.`, i - 1);
      const o = NP(); if (isErr(o)) return o; if (o.none) return err('After 是 comes what someone or something is: “学生”, “我的书”.', i);
      P.kind = 'be'; P.obj = o;
    } else {
      if (subj?.thisAlone) return err(`“${subj.det.w}” on its own means “this / that”: use it with 是. Before a verb, add a measure word and a noun: “${subj.det.w}只猫…”.`, subj.start);
      if (type === 'have') {
        if (P.neg && P.neg.w !== '没') return err('“有” is made negative with 没, never 不: “没有”.', T.indexOf(P.neg));
        if (prog) return err('“有” doesn’t take 在 (-ing).', T.indexOf(prog));
        if (P.asp?.w === '过') return err('“有过” is unusual here. Try just “有”.', T.indexOf(P.asp));
      }
      if (type === 'go') {
        if (place) return err(`“${v.w}” takes the place right after it, with no 在: “${v.w}${npZh(place.q ? { start: place.start, end: place.end } : place)}”.`, place.zaiAt);
        if (is(peek(), 'prep', '在')) return err(`“${v.w}” takes the place right after it, with no 在: “${v.w}${peek(1)?.w || '学校'}”.`, i);
        const o = is(peek(), 'pron', '哪儿') ? { q: true, n: T[i++], cat: 'place', start: i - 1, end: i } : NP(); if (isErr(o)) return o;
        if (o.none) return err(`After “${v.w}” comes where: “${v.w}学校”, “${v.w}公园”.`, i);
        if (o.cat !== 'place') return err(`“${v.w}” + a place: “${v.w}学校”. “${npZh(o)}” isn’t a place.`, o.start);
        if (v.w !== '回' && o.n.w === '家' && !o.owner) return err('“Go home” is 回家. With 去 or 来, say whose home it is: “去我家”, “来我家”.', o.start);
        if (v.w === '回' && !o.q && !['家', '中国', '学校'].includes(o.n.w)) return err('“回” means going back to where you belong: 回家, 回中国, 回学校.', o.start);
        P.obj = o;
      } else if (['tr', 'like'].includes(type) || type === 'have') {
        const o = NP(); if (isErr(o)) return o;
        if (o.none) { if (v.e[4]) return err(`“${v.w}” needs what you ${v.e[5][0]}: for example “${v.w}${{ food: '苹果', drink: '茶', read: '书', thing: '电视', animal: '猫', person: '朋友', lang: '中文', '*': '猫' }[(v.e[3] || ['*'])[0]]}”.`, i); }
        else {
          const cats = v.e[3] || ['*'], c = o.cat;
          if (o.deOnly || o.thisAlone) return err(`After “${v.w}” comes a noun: “${v.w}我的书”.`, o.start);
          if (type === 'tr' && c !== '*' && !cats.includes(c) && !(v.w === '看' && o.n.w === '电视')) return err(`That doesn’t make sense: you can’t ${v.e[5][0]} ${o.n.k === 'pron' ? npZh(o) : 'a ' + (o.n.en || npZh(o))}. “${v.w}” goes with ${cats.map(k => ZH_KIND[k]).join(', ')}.`, o.start);
          if (type === 'have' && ['place', 'lang'].includes(c)) return err(`“有” means to have: “我有一只狗”. “${npZh(o)}” doesn’t fit.`, o.start);
          P.obj = o;
        }
      } else if (type === 'in') {
        if (peek() && startsNP(peek())) return err(`“${v.w}” (${v.e[5][0]}) doesn’t take an object here.`, i);
      }
      // 了 after the object (sentence end): 我吃苹果了
      if (is(peek(), 'part', '了')) { if (P.asp) return err('One 了 is enough.', i); P.asp = T[i++]; P.endLe = true; }
      if (is(peek(), 'part', '过')) return err('“过” goes right after the verb: “去过中国”, “吃过饺子”.', i);
      P.kind = 'act'; P.place = place; P.with = withNP; P.prog = prog;
      const future = P.time.some(t => t.w === '明天');
      if (P.asp?.w === '了') {
        if (P.neg?.w === '不') return err('“不” and “了” don’t go together here. For “didn’t”, use 没 and leave out 了: “我没吃”.', T.indexOf(P.neg));
        if (P.neg?.w === '没') return err('With 没, leave out 了: “我没吃苹果”.', T.indexOf(P.asp));
        if (future) return err('“明天” is in the future, so leave out 了.', T.indexOf(P.asp));
        if (prog) return err('“在” (-ing) and “了” don’t go together. Use one of them.', T.indexOf(P.asp));
        if (P.freq || P.time.some(t => t.w === '每天')) return err('“了” is for one time something happened, not for “often” or “every day”.', T.indexOf(P.asp));
        if (type === 'like') return err('“喜欢” doesn’t take 了 here.', T.indexOf(P.asp));
      }
      if (P.asp?.w === '过') {
        if (P.neg?.w === '不') return err('With 过 (ever), use 没: “我没去过中国”.', T.indexOf(P.neg));
        if (future || prog) return err('“过” is for things you have done before, so it doesn’t fit here.', T.indexOf(P.asp));
      }
      if (P.neg?.w === '没' && future) return err('“明天” is in the future: use 不, not 没.', T.indexOf(P.neg));
      if (prog && P.neg) return err('Keep 在 (-ing) sentences positive here: “我在吃饭”.', T.indexOf(P.neg));
      if (prog && (type === 'have' || type === 'like')) return err(`“${v.w}” doesn’t take 在 (-ing).`, T.indexOf(prog));
      if (prog && future) return err('“在” (-ing) is for now, not tomorrow.', T.indexOf(prog));
    }
  } else if (v.k === 'det' || v.k === 'mw') { const o = NP(); if (isErr(o)) return o; return err(`Add a verb before “${npZh(o)}”: “${subj ? npZh(subj) : '我'}有${npZh(o)}”, “${subj ? npZh(subj) : '我'}买${npZh(o)}”.`, o.start); }
  else if (v.k === 'noun' || v.k === 'pron') return err(`Chinese puts the verb between who and what: “${subj ? npZh(subj) : '我'} + verb + ${v.w}”.`, i);
  else if (is(v, 'adv', 'time')) return err('Time words go before the verb.', i);
  else return err(`“${v.w}” doesn’t fit here.`, i);
  // after the verb phrase: only 吗 may follow
  if (is(peek(), 'part', '吗')) { P.ma = T[i++]; }
  if (i < T.length) {
    const t = peek();
    if (is(t, 'adv') && t.how === 'time') return err(`Time words go before the verb in Chinese: “…${t.w}…” moves to the front, like “我${t.w}…”.`, i);
    if (is(t, 'prep', '在')) return err('“在” + the place goes before the verb in Chinese: “我在家吃饭”, not “我吃饭在家”.', i);
    if (is(t, 'part', '吗')) return err('“吗” goes at the very end.', i);
    if (P.ma) return err('“吗” goes at the very end.', T.indexOf(P.ma));
    return err(`“${t.w}” doesn’t fit here. Chinese order: who · when · where · verb · what.`, i);
  }
  // questions: 吗, or a question word, not both
  const qWords = T.filter(t => t.k === 'pron' && t.q || t.k === 'det' && t.n === 'q');
  if (qWords.length > 1) return err('Use one question word at a time.', T.indexOf(qWords[1]));
  if (qWords.length && P.ma) return err(`With a question word like “${qWords[0].w}”, leave out 吗.`, T.indexOf(P.ma));
  if (subj && P.all && !(subj.n?.e?.[5] === 'p' || ['我们', '你们', '他们'].includes(subj.n?.w) || (typeof subj.det?.n === 'number' && subj.det.n > 1))) return err('“都” (all) needs more than one: “我们都…”, “他们都…”.', T.indexOf(P.all));
  // does it make sense? things can't eat or run, and animals can't read or talk
  if (subj && P.kind === 'act' && !subj.n?.q) {
    const alive = ['person', 'animal'].includes(subj.cat);
    if (!alive && P.verb.type !== 'have') return err(`That doesn’t make sense: ${subj.n.en ? 'a ' + subj.n.en : npZh(subj)} can’t ${P.verb.e[5][0]}. Start with a person or an animal.`, subj.start);
    if (subj.cat === 'animal' && P.verb.e[6] === 'p') return err(`That doesn’t make sense: a ${subj.n.en} can’t ${P.verb.e[5][0]}. Only people ${P.verb.e[5][0]}.`, subj.start);
  }
  if (P.kind === 'at' && subj && subj.cat === 'place') return err(`${npZh(subj)} is a place, so it can’t be 在 another place here.`, subj.start);
  P.subj = subj; P.q = qWords[0] || null;
  return { ok: true, P };
}

/* ---------------- English meaning of a correct Chinese sentence ---------------- */
const zhPlEn = w => ({ child: 'children', fish: 'fish', 'little sister': 'little sisters', 'little brother': 'little brothers', noodles: 'noodles', bread: 'bread', rice: 'rice', TV: 'TVs', shirt: 'shirts' })[w] || bldPlEn(w);
function zhNpEn(np, role = 'subj', ctx = {}) {
  if (!np) return '';
  if (np.q || np.n?.q) { const q = np.q ? 'where' : np.n.q; return q === 'what' && np.det ? 'what' : q; }
  if (np.thisAlone) return np.det.en;
  const own = np.owner ? (np.owner.n.k === 'pron' ? np.owner.n.e[4] : zhNpEn({ n: np.owner.n, adjs: [] }, 'subj') + "'s") : '';
  if (np.deOnly) return np.owner.n.k === 'pron' ? ZH_MINE[np.owner.n.e[4]] || own : own;
  const n = np.n;
  if (n.k === 'pron') return role === 'obj' ? n.e[3] : n.e[2];
  const flags = n.e?.[5] || '', mass = flags.includes('m'), adj = np.adjs.map(a => (a.deg?.w === '非常' ? 'really ' : '') + a.a.en).join(' ');
  const count = typeof np.det?.n === 'number' ? np.det.n : null, cont = np.mw && ZH_MW[np.mw.w][2];
  const base = n.en, many = count > 1 || ctx.generic && !mass && !count && !np.det && !own && !/[fn]/.test(flags);
  const word = (adj ? adj + ' ' : '') + (many && !cont ? zhPlEn(base) : base);
  let core = cont ? `${many ? zhPlEn(cont) : cont} of ${word}` : word;
  if (np.det?.n === 'q') return `how many ${cont ? zhPlEn(cont) + ' of ' + word : zhPlEn((adj ? adj + ' ' : '') + base)}`;
  if (np.det?.n === 'this' || np.det?.n === 'that') return (count > 1 ? (np.det.n === 'this' ? 'these' : 'those') : np.det.n) + ' ' + core;
  if (own) return `${own}${count ? ' ' + ZH_NUM_EN[count] : ''} ${core}`;
  if (count === 1) return (/^[aeiou]/i.test(core) ? 'an ' : 'a ') + core;
  if (count) return `${ZH_NUM_EN[count]} ${core}`;
  if (flags.includes('f')) return flags.includes('a') ? 'my ' + core : core[0].toUpperCase() + core.slice(1);   // 妈妈 = Mom, 妹妹 = my little sister
  if (flags.includes('n')) return core;   // China, home, Chinese
  if (role === 'obj' && ctx.generic) return mass ? core : zhPlEn((adj ? adj + ' ' : '') + base);
  if (role === 'obj' && ctx.one && !mass) return (/^[aeiou]/i.test(core) ? 'an ' : 'a ') + core;
  if (mass && role === 'obj') return core;
  return 'the ' + core;
}
const ZH_PLACE_IN = new Set(['房间', '公园']);
const ZH_PLACE_EN = { 家: ['home', 'at home'], 学校: ['school', 'at school'], 中国: ['China', 'in China'], 北京: ['Beijing', 'in Beijing'] };
function zhPlaceEn(np, how) {   // how: 'to' (go), 'at' (be or do something there), 'in' (something is inside)
  if (np.q) return 'where';
  const plain = !np.owner && !np.det && !np.adjs.length && ZH_PLACE_EN[np.n.w];
  if (plain) return how === 'to' ? (np.n.w === '家' ? 'home' : 'to ' + plain[0]) : plain[1];
  const s = zhNpEn(np, 'obj');
  return (how === 'to' ? 'to ' : how === 'in' || np.li || ZH_PLACE_IN.has(np.n.w) ? 'in ' : 'at ') + s;
}
function zhEnglish(P) {
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const subj = P.subj, sEn = subj ? zhNpEn(subj, 'subj') : 'I';
  const sp = !subj ? '1' : subj.n?.k === 'pron' && !subj.n.q ? subj.n.e[5] : (typeof subj.det?.n === 'number' && subj.det.n > 1) ? 'p' : '3';
  const third = sp === '3', be = { 1: 'am', 2: 'are', 3: 'is', p: 'are' }[sp], beP = sp === '1' || sp === '3' ? 'was' : 'were';
  const whenW = P.time.map(t => t.en), future = P.time.some(t => t.w === '明天'), pastT = P.time.some(t => t.w === '昨天');
  const q = P.ma ? 'yn' : P.q ? 'wh' : null, neg = !!P.neg;
  const often = P.freq ? 'often' : '', also = P.also ? (neg ? 'either' : 'too') : '', all = P.all ? 'all' : '';
  let tail = [];
  const end = s => { s = s.replace(/\s+/g, ' ').trim(); return cap(s) + (q ? '?' : '.'); };
  const wrap = (s) => { const t = [...tail, also, whenW.join(' ')].filter(Boolean).join(' '); return end(s + (t ? ' ' + t : '')); };
  // is / are: adjectives, 是, 在 + place
  const beSentence = (compl, whIsCompl) => {
    const b = future ? 'will be' : pastT ? beP : be;
    const notB = future ? "won't be" : pastT ? beP + "n't" : sp === '1' ? 'am not' : be + "n't";
    if (q === 'yn') return wrap(future ? `${neg ? "Won't" : 'Will'} ${sEn} ${all} be ${often} ${compl}` : `${cap(neg ? (pastT ? beP + "n't" : sp === '1' ? 'am I not' : be + "n't") : (pastT ? beP : be))} ${sp === '1' && neg && !pastT ? '' : sEn} ${all} ${often} ${compl}`);
    if (q === 'wh') {
      if (P.q.q === 'who' && subj?.n?.q) return wrap(`who ${future ? 'will be' : pastT ? 'was' : 'is'} ${neg ? 'not' : ''} ${compl}`);
      if (whIsCompl) return wrap(`${whIsCompl} ${future ? 'will ' + sEn + ' be' : (pastT ? beP : be) + ' ' + sEn}`);
    }
    return wrap(`${sEn} ${neg ? notB : b} ${all} ${often} ${compl}`);
  };
  if (P.kind === 'adj') return beSentence((P.deg?.w === '非常' ? 'really ' : '') + P.adj.en);
  if (P.kind === 'be') {
    const o = P.obj, plural = sp === 'p' || (typeof o.det?.n === 'number' && o.det.n > 1);
    let c = o.n?.q ? o.n.q : o.deOnly ? zhNpEn(o) : (o.n?.k === 'noun' && !o.det && !o.owner ? ((plural ? zhPlEn(((o.adjs.map(a => a.a.en).join(' ') + ' ').trimStart()) + o.n.en) : (o.n.e[5]?.includes('f') && !o.n.e[5].includes('a') ? cap(o.n.en) : (/^[aeiou]/i.test(o.adjs[0]?.a.en || o.n.en) ? 'an ' : 'a ') + [...o.adjs.map(a => a.a.en), o.n.en].join(' ')))) : zhNpEn(o, 'obj'));
    if (o.n?.e?.[5]?.includes('n')) c = zhNpEn(o, 'obj');
    return beSentence(c, o.n?.q ? o.n.q : null);
  }
  if (P.kind === 'at') {
    const pl = P.place;
    if (pl.q) return q === 'wh' ? wrap(`where ${future ? 'will ' + sEn + ' be' : (pastT ? beP : be) + ' ' + sEn}`) : beSentence('');
    return beSentence(zhPlaceEn(pl, 'at'));
  }
  if (P.kind === 'exist') {
    const o = P.obj, many = typeof o.det?.n === 'number' && o.det.n > 1, w = zhPlaceEn(P.where, 'in');
    if (o.n?.q === 'what') return end(`what is there ${w}`);
    if (o.det?.n === 'q') return end(`${zhNpEn(o, 'obj')} are there ${w}`);
    const thing = zhNpEn(o, 'obj', { one: true });
    if (neg) return end(`there ${many ? "aren't" : "isn't"} ${o.det ? thing : (o.n.e?.[5]?.includes('m') ? 'any ' + thing : thing.replace(/^the /, 'a '))} ${w}`);
    return end(q === 'yn' ? `${many ? 'are' : 'is'} there ${thing.replace(/^the /, 'a ')} ${w}` : `there ${many ? 'are' : 'is'} ${thing.replace(/^the /, 'a ')} ${w}`);
  }
  // actions (and 有 = have)
  const v = P.verb, objCat = P.obj?.n?.w === '电视' ? 'tv' : P.obj?.cat;
  let F = v.e[5]; if (v.w === '看') F = zhKanEn(objCat) || F; if (v.w === '说' && P.obj?.n?.q === 'what') F = ['say', 'says', 'said', 'saying', 'said'];
  if (v.type === 'go' && v.w === '回' && P.obj?.n?.w === '家') F = ['go', 'goes', 'went', 'going', 'gone'];
  const tense = P.prog ? 'prog' : P.asp?.w === '过' && !pastT && !P.time.some(t => t.w === '今天') ? 'perf' : future ? 'fut' : P.asp?.w === '了' || P.neg?.w === '没' && v.type !== 'have' || pastT ? 'past' : 'pres';
  const generic = tense === 'pres' || tense === 'fut' || tense === 'perf';
  // the object, then where and with whom
  let objEn = '', whObj = null;
  if (v.type === 'go') { if (P.obj.q) whObj = 'where'; else objEn = (v.w === '回' && P.obj.n.w === '家' && !P.obj.owner) ? 'home' : zhPlaceEn(P.obj, 'to'); }
  else if (P.obj) {
    if (P.obj.n?.q) whObj = P.obj.n.q === 'who' ? 'who' : 'what';
    else if (P.obj.det?.n === 'q') whObj = zhNpEn(P.obj, 'obj');
    else objEn = zhNpEn(P.obj, 'obj', { generic: generic && v.type !== 'have', one: !generic || v.type === 'have' });
  }
  if (tense === 'perf' && v.w === '去') F = [F[0], F[1], F[2], F[3], 'been'];
  if (P.place) tail.push(P.place.q ? '' : zhPlaceEn(P.place, 'at'));
  if (P.with) tail.push('with ' + zhNpEn(P.with, 'obj', { one: true }));
  if (tense === 'perf' && !neg && q !== 'yn') tail.push('before');
  const whPlace = P.place?.q;
  tail = [objEn, ...tail].filter(Boolean);
  const has = third ? 'has' : 'have', does = third ? 'does' : 'do';
  const nf = s => s.replace(/\s+/g, ' ').trim();
  const verbFor = (aux) => ({ pres: F[0], past: F[0], fut: F[0], perf: F[4], prog: F[3] })[tense];
  const auxOf = { pres: does, past: 'did', fut: 'will', perf: has, prog: be }[tense];
  if (q === 'wh' && P.q.q === 'who' && subj?.n?.q) {   // who does it?
    const vv = { pres: F[1], past: F[2], fut: 'will ' + F[0], perf: 'has ' + F[4], prog: 'is ' + F[3] }[tense];
    return wrap(nf(`who ${neg ? { pres: "doesn't " + F[0], past: "didn't " + F[0], fut: "won't " + F[0], perf: 'has never ' + F[4], prog: 'is not ' + F[3] }[tense] : vv}`));
  }
  if (q === 'wh') {
    const wh = whObj || (whPlace ? 'where' : 'what');
    // 你去哪儿？ = “Where are you going?”
    if (wh === 'where' && v.type === 'go' && tense === 'pres' && !neg && !often) return wrap(nf(`where ${be} ${sEn} ${F[3]}`));
    return wrap(nf(`${wh} ${auxOf}${neg && tense !== 'perf' ? "n't" : ''} ${sEn} ${all} ${neg && tense === 'perf' ? 'never' : ''} ${often} ${verbFor()}`));
  }
  if (q === 'yn') {
    const A = neg ? (tense === 'prog' ? (sp === '1' ? 'am' : be + "n't") : tense === 'fut' ? "won't" : tense === 'perf' ? has + "n't" : auxOf + "n't") : auxOf;
    return wrap(nf(`${A} ${sEn} ${all} ${tense === 'perf' && !neg ? 'ever' : ''} ${often} ${verbFor()}`));
  }
  let vp;
  if (!neg) vp = { pres: third ? F[1] : F[0], past: F[2], fut: 'will ' + F[0], perf: has + ' ' + F[4], prog: be + ' ' + F[3] }[tense];
  else vp = { pres: (third ? "doesn't " : "don't ") + F[0], past: "didn't " + F[0], fut: "won't " + F[0], perf: has + ' never ' + F[4], prog: (sp === '1' ? 'am not ' : be + "n't ") + F[3] }[tense];
  // often: “I often eat”, “I don't often eat” (不常常), “I often don't eat” (常常不)
  if (often) vp = neg && !P.negAfterFreq ? vp.replace(/^(\S+)/, '$1 often') : neg ? 'often ' + vp : /^(will|has|have|am|is|are)\b/.test(vp) ? vp.replace(/^(\S+)/, '$1 often') : 'often ' + vp;
  if (all) vp = /^(will|has|have|am|is|are|don't|doesn't|didn't|won't)\b/.test(vp) ? vp.replace(/^(\S+)/, '$1 all') : 'all ' + vp;
  return wrap(nf(`${sEn} ${vp}`));
}

/* ---------------- making a Chinese tray ---------------- */
function zhGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = list => { const fav = list.filter(x => pref.has(x[0]) || pref.has(x[3])); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const nounOf = cats => RP(ZH_NOUN.filter(n => cats[0] === '*' ? n[2] !== 'lang' : cats.includes(n[2])));
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
  const extra = [];
  // a noun phrase: sometimes with an owner, a number + measure word, or a describing word
  const np = (n, out, o = {}) => {
    const mws = zhMws(n), counted = mws.length && !o.bare;
    if (o.owner && coin(0.25)) { const p = R(ZH_PRON); out.push(zhPron(p)); if (!(n[5].includes('f') && p[5] !== 'p' && coin(0.5))) out.push(zhPart('的')); else extra.push(zhPart('的')); }
    else if (counted && (o.count || coin(0.35))) {
      const d = o.det || (coin(0.25) ? R(['这', '那']) : R(['一', '一', '两', '三', '五'])), mw = mws[0];
      out.push(zhDet(d), zhMw(mw));
      if (d === '两') extra.push(zhDet('二'));
      const wrong = R(Object.keys(ZH_MW).filter(m => !mws.includes(m) && m !== '家')); extra.push(zhMw(wrong));
    }
    if (o.adj !== false && !n[5].includes('f') && CAT[n[2]] && coin(0.25)) { const a = RP(ZH_ADJ.filter(x => x[3].includes(CAT[n[2]] || 'p'))); if (a) { const two = !a[4]; if (two || coin(0.3)) { if (coin(0.3)) out.push(zhAdv('很')); out.push(zhAdj(a), zhPart('的')); if (out.at(-3)?.w !== '很') {} } else { out.push(zhAdj(a)); extra.push(zhPart('的')); } } }
    out.push(zhNoun(n));
  };
  for (let tries = 0; tries < 150; tries++) {
    extra.length = 0;
    const out = [], kind = R(['tr', 'tr', 'tr', 'in', 'go', 'go', 'adj', 'adj', 'be', 'have', 'exist', 'at', 'prog']);
    const ask = coin(0.25) ? (coin(0.5) ? 'ma' : 'wh') : null;
    let time = null;
    if (!['be', 'exist', 'have', 'adj'].includes(kind) && coin(0.3)) time = zhAdv(R(['今天', '明天', '昨天', '每天', '现在']));
    if (time && coin(0.3)) out.push(time);
    // who
    let subjCat = 'person', plural = false;
    const pushSubj = (animalsOK = true) => {
      if (ask === 'wh' && coin(0.3) && kind !== 'be') { out.push(zhQ('谁')); return 'who'; }
      if (coin(0.55)) { const p = R(ZH_PRON); out.push(zhPron(p)); plural = p[5] === 'p'; }
      else { const n = nounOf(animalsOK ? ['person', 'animal'] : ['person']); subjCat = n[2]; np(n, out, { owner: true, adj: false }); }
      return null;
    };
    let whoQ = null;
    if (kind === 'exist') {
      const pl = RP(ZH_NOUN.filter(n => n[2] === 'place' && !['中国', '北京', '家'].includes(n[0]))); np(pl, out, { adj: false, bare: true });
      out.push(zhPart('里'));
    } else whoQ = pushSubj(!['be', 'have'].includes(kind));
    if (time && !out.includes(time)) out.push(time);
    const neg = !ask && coin(0.2);
    if (kind === 'adj') {
      const fit = CAT[subjCat], a = RP(ZH_ADJ.filter(x => x[3].includes(fit)));
      if (coin(0.15) && !neg) out.push(zhAdv('也'));
      if (neg) { out.push(zhAdv('不')); extra.push(zhAdv('没')); }
      else if (!(ask === 'ma' && coin(0.4))) out.push(zhAdv(coin(0.8) ? '很' : '非常'));
      out.push(zhAdj(a)); extra.push(zhVerb(ZH_VERB.find(x => x[0] === '是')));
    } else if (kind === 'be') {
      if (!out.some(t => t.k === 'pron' && !t.q)) continue;
      if (neg) { out.push(zhAdv('不')); extra.push(zhAdv('没')); }
      out.push(zhVerb(ZH_VERB.find(x => x[0] === '是')));
      if (ask === 'wh') out.push(zhQ('谁')); else out.push(zhNoun(zhNounBy(R(['学生', '老师', '医生', '朋友']))));
      if (plural && ask !== 'wh' && coin(0.3)) out.splice(out.length - 2, 0, zhAdv('都'));
    } else if (kind === 'at') {
      if (neg) out.push(zhAdv('不'));
      out.push(zhPrep('在'));
      if (ask === 'wh' && whoQ !== 'who') out.push(zhQ('哪儿')); else { const sp = subjCat === 'animal' ? zhNounBy(R(['家', '公园'])) : nounOf(['place']); np(sp, out, { adj: false, bare: true }); if (sp[0] === '房间' || sp[0] === '公园' && coin(0.5)) out.push(zhPart('里')); }
    } else if (kind === 'exist') {
      if (neg) out.push(zhAdv('没'));
      out.push(zhVerb(ZH_VERB.find(x => x[0] === '有'))); extra.push(zhAdv('不'));
      if (ask === 'wh') out.push(zhQ('什么')); else { const n = RP(ZH_NOUN.filter(x => ['person', 'animal', 'thing', 'read', 'food'].includes(x[2]) && !x[5].includes('f'))); if (!zhMws(n).length) continue; np(n, out, { adj: false, bare: neg, count: !neg, det: R(['一', '一', '两', '三']) }); }
    } else if (kind === 'have') {
      if (neg) out.push(zhAdv('没')); extra.push(zhAdv('不'));
      out.push(zhVerb(ZH_VERB.find(x => x[0] === '有')));
      const n = nounOf(['animal', 'thing', 'read']);
      if (ask === 'wh') { out.push(zhDet('几'), zhMw(zhMws(n)[0]), zhNoun(n)); } else np(n, out, { count: !neg && coin(0.6) });
    } else {
      // actions: 去 / 来 / 回 + place, verbs with an object, verbs on their own, 在 + verb (-ing)
      const type = kind === 'prog' ? R(['tr', 'in']) : kind;
      const v = RP(ZH_VERB.filter(x => x[2] === (type === 'tr' ? (coin(0.15) ? 'like' : 'tr') : type) && (subjCat === 'person' || x[6] !== 'p' && (type !== 'tr' || '吃喝'.includes(x[0])) && x[0] !== '回') && !(ask === 'wh' && x[0] === '回')));
      if (!v) continue;
      const isProg = kind === 'prog' && !time?.w.match(/明天|昨天|每天/);
      if (plural && coin(0.25) && !isProg) out.push(zhAdv('都'));
      if (!isProg && (!time || time.w === '每天') && coin(0.15)) out.push(zhAdv('常常'));
      let negW = null;
      if (neg && !isProg) { negW = time?.w === '昨天' || coin(0.35) && time?.w !== '明天' && time?.w !== '现在' && !out.some(t => t.w === '常常') && time?.w !== '每天' ? '没' : '不'; out.push(zhAdv(negW)); extra.push(zhAdv(negW === '没' ? '不' : '没')); }
      const spots = ZH_NOUN.filter(n => n[2] === 'place' && (subjCat !== 'animal' || '家公园'.includes(n[0])) && [...(v[7] || '')].length && (v[7] || '').includes(n[0]) && (n[0].length > 1 || v[7].replace(/图书馆|饭馆/g, '').includes(n[0])));
      if (type !== 'go' && !isProg && spots.length && coin(0.3)) { const sp = R(spots); out.push(zhPrep('在')); np(sp, out, { adj: false, bare: true }); if (sp[0] === '房间') out.push(zhPart('里')); extra.push(zhPrep('在')); }
      if (coin(0.15)) { out.push(zhPrep('跟')); np(RP(ZH_NOUN.filter(n => n[2] === 'person' && !out.some(t => t.w === n[0]))), out, { adj: false, bare: true }); if (coin(0.6)) out.push(zhAdv('一起')); }
      if (isProg) out.push(zhPrep('在'));
      out.push(zhVerb(v));
      const past = !isProg && !negW && time?.w !== '明天' && time?.w !== '每天' && !out.some(t => t.w === '常常') && v[2] !== 'like';
      const asp = past && time?.w !== '现在' && coin(0.35) ? (coin(0.6) || time ? '了' : '过') : negW === '没' && !time && coin(0.3) ? '过' : null;
      if (asp) out.push(zhPart(asp)); else extra.push(zhPart(coin(0.5) ? '了' : '过'));
      if (type === 'go') {
        if (ask === 'wh' && whoQ !== 'who') out.push(zhQ('哪儿'));
        else { const home = R(['家', '家', '中国']), pl = v[0] === '回' ? zhNounBy(home) : subjCat === 'animal' ? zhNounBy('公园') : RP(ZH_NOUN.filter(n => n[2] === 'place' && n[0] !== '家')); np(pl, out, { adj: false, bare: true }); extra.push(zhPrep('在')); }
      } else if (type !== 'in') {
        if (ask === 'wh' && whoQ !== 'who' && coin(0.7)) out.push(zhQ(v[3].includes('person') && coin(0.5) ? '谁' : '什么'));
        else { const objs = subjCat === 'animal' ? ZH_NOUN.filter(n => ['水', '鱼', '米饭', '面包', '猫', '鸟'].includes(n[0]) && v[3].includes(n[2])) : null; if (objs && !objs.length) continue;
          np(objs ? R(objs) : nounOf(v[3]), out, { count: asp === '了' && coin(0.6) }); }
      }
      if (time && coin(0.3)) extra.push(time.w === '今天' ? zhAdv('明天') : zhAdv('今天'));
    }
    if (ask === 'ma' && !out.some(t => t.q)) out.push(zhPart('吗')); else if (!out.some(t => t.q)) extra.push(zhPart('吗'));
    if (out.length < 3 || out.length > 13) continue;
    const res = zhCheck(out); if (!res.ok) continue;
    extra.push(zhNoun(nounOf(['*'])), zhAdv(R(['今天', '也', '常常'])), zhMw(R(Object.keys(ZH_MW))));
    const seen = new Set(out.map(w => w.k + w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && !seen.has(x.k + x.w)) { seen.add(x.k + x.w); uniq.push(x); }
    return { words: out, extra: uniq.slice(0, Math.max(4, 15 - out.length)), english: zhEnglish(res.P) };
  }
  return null;
}

/* register: measure words and particles get their own word type and color */
BLD_TYPES.part ||= ['particle', 'marks what a word does: は, を, 了, 吗…'];
BLD_TYPES.mw = ['measure word', 'goes between a number (or 这 / 那) and a noun: 个, 本, 只…'];
if (typeof document !== 'undefined' && document.head && !document.getElementById('zhStyle')) { const st = document.createElement('style'); st.id = 'zhStyle'; st.textContent = '.t-mw{--tc:#a0522d}'; document.head.append(st); }
BLD_LANGS.zh = { name: 'Chinese', check: zhCheck, gen: zhGenerate, voice: 'zh-CN', english: zhEnglish, types: ['pron', 'noun', 'verb', 'adj', 'det', 'mw', 'part', 'prep', 'adv'], noSpaces: true,
  end: words => words.some(w => w.w === '吗' || w.q || w.n === 'q') ? '？' : '。' };
BLD_ORDER.zh = { rows: [
    ['A basic sentence', [['adv', '(time)'], ['pron', 'who'], ['adv', '(time)'], ['verb', 'verb'], ['noun', 'what']]],
    ['Where you do it', [['pron', 'who'], ['prep', '在'], ['noun', 'place'], ['verb', 'verb'], ['noun', 'what']]],
    ['Counting things', [['det', 'number / 这 / 那'], ['mw', 'measure word'], ['adj', '(describing word)'], ['noun', 'noun']]],
    ['Describing someone', [['pron', 'who'], ['adv', '很 / 不'], ['adj', 'describing word']]],
    ['Whose is it?', [['pron', 'owner'], ['part', '的'], ['noun', 'thing']]],
    ['Done, ever, -ing', [['pron', 'who'], ['verb', 'verb'], ['part', '了 / 过'], ['noun', 'what']]],
    ['A yes/no question', [['pron', 'who'], ['verb', 'verb'], ['noun', 'what'], ['part', '吗']]],
  ], tips: [
    ['verb', 'Chinese order is <b>who · when · where · verb · what</b>. Time (<b>今天</b>) and place (<b>在家</b>) go before the verb, never at the end.'],
    ['mw', 'Between a number (or <b>这 / 那</b>) and a noun goes a measure word: <b>一本书</b>, <b>两只猫</b>, <b>这杯茶</b>. <b>个</b> is the most common one.'],
    ['det', 'Before a measure word, “two” is <b>两</b> (两个人), not 二. <b>二</b> is for counting and in bigger numbers (十二).'],
    ['adj', 'No <b>是</b> before a describing word: <b>他很忙</b>. In a statement, <b>很</b> links them and doesn’t have to mean “very”.'],
    ['part', '<b>的</b> = ’s: <b>我的书</b>. Family can drop it: <b>我妈妈</b>. <b>了</b> = done, <b>过</b> = ever done, <b>吗</b> at the end makes a question.'],
    ['adv', '<b>不</b> for now and the future; <b>没</b> for the past and for <b>有</b> (没有). With 没, leave out 了.'],
    ['pron', 'Question words (<b>谁, 什么, 哪儿, 几</b>) go where the answer goes, and then there’s no 吗: <b>你吃什么？</b>'] ] };

/* ---------------- Your own Chinese words (📚 Add my deck's words) ---------------- */
const ZH_BASE = { n: ZH_NOUN.length, a: ZH_ADJ.length, v: ZH_VERB.length };
const zhKnown = w => ZH_NOUN.slice(0, ZH_BASE.n).some(n => n[0] === w) || ZH_VERB.slice(0, ZH_BASE.v).some(v => v[0] === w) || ZH_ADJ.slice(0, ZH_BASE.a).some(a => a[0] === w)
  || ZH_PRON.some(p => p[0] === w) || ZH_ADV.some(a => a[0] === w) || ZH_DET.some(d => d[0] === w) || !!ZH_MW[w] || !!ZH_PART[w] || ZH_Q.some(q => q[0] === w) || !!ZH_PREP[w];
const zhPyOf = (w, read) => read || (typeof zhPinyin === 'function' ? zhPinyin(w).replace(/\s+/g, '') : '');
function zhApplyMine() {
  ZH_NOUN.length = ZH_BASE.n; ZH_ADJ.length = ZH_BASE.a; ZH_VERB.length = ZH_BASE.v;
  for (const m of S.bldWords || []) {
    if (!m || m.lang !== 'zh' || !m.w || !m.en || zhKnown(m.w)) continue;
    const py = zhPyOf(m.w, m.read);
    if (m.k === 'noun') ZH_NOUN.push([m.w, py, m.cat || 'thing', m.en, m.cat === 'place' ? '个' : m.cat === 'animal' ? '只' : m.cat === 'read' ? '本' : m.cat === 'drink' ? '杯' : '个', m.cat === 'drink' || m.cat === 'food' ? 'm' : 'a']);
    if (m.k === 'verb') {
      const en = m.en.replace(/^to\s+/, ''), type = m.obj === 'in' ? 'in' : 'tr', objs = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read'];
      const past = /e$/.test(en) ? en + 'd' : en + 'ed', ing = /e$/.test(en) && !/ee$/.test(en) ? en.slice(0, -1) + 'ing' : en + 'ing';
      ZH_VERB.push([m.w, py, type, type === 'tr' ? objs : null, 0, [en, bld3sEn(en), past, ing, past], m.who === 'a' ? 'a' : 'p']);
    }
    if (m.k === 'adj') ZH_ADJ.push([m.w, py, m.en, 'patflr']);
  }
}
if (typeof bldApplyMine === 'function') { const prevApply = bldApplyMine; bldApplyMine = function () { prevApply(); zhApplyMine(); }; }
BLD_MINE.zh = { name: 'Chinese', forms: 'the verb (Chinese verbs don’t change)', nForms: 1, noGender: true, conj: w => [w], pl: w => w, adj: w => [w], minLen: 1, guess: (w, en) => /^(hello|hi|thanks?|thank you|bye|goodbye|good|sorry|excuse|please|welcome|you.?re|yes|no|not|how|what|who|where|why|when|which|and|but|or|of|in|on|at)( |$)/i.test(en) ? '' : 'noun',
  known: w => zhKnown(w), gender: () => 'm', isVerb: () => true, refl: () => false,
  // 狗 (gǒu), 狗 gǒu, 狗: the word as the card writes it, with its pinyin kept for the hint
  parse: s => { const read = (s.match(/[（(]([^）)]+)[）)]/) || [])[1] || (s.match(/[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü' ]{2,}/i) || [])[0]; const w = s.replace(/[（(][^）)]*[）)]/g, '').replace(/[^一-鿿]/g, '');
    return w && w.length <= 4 ? { w, read: read && /[a-zü]/i.test(read) ? read.trim() : null } : null; },
  intro: 'words like <i>“to …”</i> are verbs). Chinese verbs don’t change, so there are no forms to fill in. Nouns get the measure word 个 (or 只 for animals, 本 for things you read, 杯 for drinks).' };
