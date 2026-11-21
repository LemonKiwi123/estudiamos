'use strict';
/* ================= Sentence Builder · 📖 Real sentences: Chinese word types, pinyin and meanings =================
   Chinese is written without spaces: the sentences in data/real-zh.json come split into words (with "|"), and your own
   cards' example sentences are split with the word list in zh-pinyin.js (a known word is never cut in two).
   Word types come from closed word lists (pronouns, measure words, particles…), the Sentence Builder's Chinese words,
   the word list in rsdict-zh.js and a few safe rules from the neighbours (a measure word comes after a number or 这 / 那).
   A word that can't be tagged with confidence gets no label. Under each word: its pinyin, then its meaning.
   Loaded after rstag.js, rsdict-zh.js and builder-zh.js. */
RS_LANGS.zh = 'Chinese';
RS_NOSPACE.add('zh');
RS_SPLIT.zh = text => zhSplit(text, rsZhDeckWords());
RS_POS_BY.zh = ['noun', 'verb', 'adj', 'adv', 'pron', 'det', 'mw', 'part', 'prep', 'conj'];
RS_CLOSED.zh = {
  pron: RS_W('我 你 您 他 她 它 我们 你们 他们 她们 它们 咱们 自己 大家 别人 谁 什么 哪儿 哪里 这儿 那儿 这里 那里 怎么 怎么样 为什么 多少 有人 什么样'),
  det: RS_W('这 那 哪 每 一些 这些 那些 几 一 二 两 三 四 五 六 七 八 九 十 百 千 万 半 所有 另 各 别的 其他 任何 很多 许多 第一'),
  mw: RS_W('个 本 杯 张 辆 件 位 条 块 碗 瓶 封 份 台 朵 束 匹 所 间 部 双 支 首 种 些 岁 句 次 遍 只 把 家 点 天 年 分钟 小时 公斤 米 层 场 顿 口 座 棵 片 套 班 节 篇 盒 包 斤 毛 元 块钱'),
  part: RS_W('了 的 吗 呢 吧 过 着 地 得 啊 呀 嘛 啦 里 上 下 们 之'),
  prep: RS_W('在 跟 从 对 向 往 比 被 离 给 和 为 关于 为了 除了 按照 通过 到 用 替 把'),
  conj: RS_W('和 但是 可是 所以 因为 如果 虽然 还是 或者 或 而且 然后 不过 而 但 要是 只要 只有 就是说 并且 于是 否则'),
  adv: RS_W('不 没 很 也 都 还 就 才 又 再 已经 常常 经常 总是 一起 非常 太 最 更 真 一定 马上 刚 刚才 正在 别 也许 大概 当然 特别 比较 有点 有点儿 一点 一点儿 越来越 一直 先 突然 终于 今天 明天 昨天 每天 现在 以前 以后 刚刚 互相 只 仍然 还是 立刻 已 曾经 从来 从不 从没 几乎 真的 一下 一会儿 一样 到处 有时 有时候 平时 后来 早就 快 慢慢 好好 那么 这么 多么 挺 相当 十分 极 果然 原来 其实 确实 恐怕 难道 究竟 到底'),
  verb: RS_W('是 有 没有 会 能 可以 要 想 应该 得 去 来 说 看 吃 喝 做 知道 觉得 喜欢 爱 叫 让 请 给 到 在 用 买 卖 走 跑 坐 住 开 关 听 写 读 学 学习 工作 睡觉 起床 回 回来 回去 出去 进来 认识 帮 帮助 告诉 问 等 找 带 拿 放 穿 打 玩 看见 听见 需要 希望 开始 喜爱 准备 打算 决定 记得 忘记 忘 懂 明白 相信 认为 讨厌 怕 担心 感谢 谢谢 欢迎 送 接 换 试 洗 做饭 吃饭 上班 下班 上课 下课 见 见面 遇到 发现 发生 变 变成 成为 离开 到达 参加 回答 解释 介绍 选择 练习 休息 生病 结束 完成 继续 停 停止 留 想要 想念'),
  adj: RS_W('好 大 小 多 少 新 旧 老 高 矮 长 短 快 慢 对 错 忙 累 饿 渴 冷 热 贵 便宜 好吃 好看 好听 漂亮 可爱 高兴 快乐 开心 难过 生气 聪明 安静 干净 重要 容易 难 简单 舒服 健康 年轻 美丽 有名 有趣 有意思 无聊 奇怪 危险 安全 清楚 认真 努力 幸福 满意 方便 合适 一样 不同 早 晚 远 近 真 假 红 白 黑 蓝 绿 黄 酷 棒 厉害 胖 瘦 帅 害怕 紧张 激动 着急 失望 孤独 疲倦 困 饱 忙碌 美 丑 好玩 成功 正确 特别 普通 奇妙 完美 糟糕'),
};
let RS_ZH_DECK = null;
function rsZhDeckWords() {   // the words on your own Chinese cards, so the splitter keeps them whole
  if (RS_ZH_DECK) return RS_ZH_DECK;
  const set = new Set();
  try { for (const d of S.decks) if (langBase(d.frontLang || '') === 'zh') for (const c of cardsOf(d.id)) { const f = plainSent(c.front || '').replace(/[（(][^）)]*[）)]/g, '').replace(/[^一-鿿]/g, ''); if (f.length > 1 && f.length <= 5) set.add(f); } } catch {}
  return (RS_ZH_DECK = set);
}
// the Sentence Builder's Chinese words, for word types and meanings
let RS_ZH_LEX = null;
function rsZhLex() {
  if (RS_ZH_LEX) return RS_ZH_LEX;
  const m = new Map(), put = (w, t, g) => { if (w && !m.has(w)) m.set(w, [t, g]); };
  if (typeof ZH_NOUN !== 'undefined') {
    ZH_NOUN.forEach(n => put(n[0], 'noun', n[3])); ZH_VERB.forEach(v => put(v[0], 'verb', v[0] === '看' ? 'to look / read / watch' : 'to ' + v[5][0]));
    ZH_ADJ.forEach(a => put(a[0], 'adj', a[2])); ZH_PRON.forEach(p => put(p[0], 'pron', p[2])); ZH_Q.forEach(q => put(q[0], 'pron', q[2] + '?'));
    Object.entries(ZH_MW).forEach(([w, x]) => put(w, 'mw', `(measure word for ${x[1]})`)); Object.entries(ZH_PART).forEach(([w, x]) => put(w, 'part', x[1]));
    ZH_ADV.forEach(a => put(a[0], 'adv', a[2])); ZH_DET.forEach(d => put(d[0], 'det', d[0] === '一' ? 'one / a' : d[2]));
  }
  return (RS_ZH_LEX = m);
}
const RS_ZH_NUM = /^[零一二两三四五六七八九十百千万几半]+$/;
function rsZhTag(w, i, words) {
  const C = RS_CLOSED.zh, prev = words[i - 1] || '', next = words[i + 1] || '', dict = RS_DICT_GET('zh', w);
  // words that change with their neighbours
  if (C.mw.has(w) && (RS_ZH_NUM.test(prev) || /^[这那哪每几]$/.test(prev) || /^[这那哪每]$/.test(prev.slice(-1)))) return 'mw';   // 一本, 这只, 几个
  if (w === '个') return 'mw';
  if (w === '在') return rsZhLex().has(next) && rsZhLex().get(next)[0] === 'verb' || C.verb.has(next) ? 'adv' : next && i < words.length - 1 ? 'prep' : 'verb';   // 在吃 (-ing), 在家吃 (at), 他在家 (is at)
  if (w === '和' || w === '跟') return 'prep';
  if (w === '把' || w === '被') return 'prep';
  if (w === '只') return C.verb.has(next) || rsZhLex().get(next)?.[0] === 'verb' ? 'adv' : null;
  if (w === '里' || w === '上' || w === '下') return /^(noun|pron)$/.test(rsZhTagSimple(prev) || '') ? 'part' : null;   // 房间里, 桌子上
  if (w === '给' || w === '到' || w === '对' || w === '用') return null;   // verb or preposition: it depends on the whole sentence
  if (/^[这那]$/.test(w)) return 'det';
  if (RS_ZH_NUM.test(w)) return /^(个|本|只|杯|张|岁|次|天|年|点|块|件|位|条)/.test(next) ? 'det' : 'det';
  return rsZhTagSimple(w);
}
function rsZhTagSimple(w) {
  const C = RS_CLOSED.zh, dict = RS_DICT_GET('zh', w), lex = rsZhLex().get(w);
  if (!w) return null;
  for (const t of ['pron', 'part', 'conj', 'det']) if (C[t].has(w)) return t;
  if (lex) return lex[0];
  if (C.adv.has(w)) return 'adv';
  if (C.adj.has(w)) return 'adj';
  if (C.verb.has(w)) return 'verb';
  if (C.prep.has(w)) return 'prep';
  if (dict?.[0]) return dict[0];
  const own = rsLex('zh').get(w); if (own) return own;   // your own cards' word labels
  if (/^(汤姆|玛丽|约翰|杰克)$/.test(w)) return 'noun';
  if (/(子|们|员|师|家|人|生|馆|店|院|车|机|国|市|天|年|月|日|期)$/.test(w) && w.length >= 2 && !/^(一|不|没|很|都)/.test(w)) return 'noun';   // 桌子, 服务员, 老师, 图书馆…
  return null;
}
{ const prevTag = rsTagWord; rsTagWord = function (w, i, low, lang) { return lang === 'zh' ? rsZhTag(w, i, low) : prevTag(w, i, low, lang); }; }
{ const prevSent = rsTagSentence; rsTagSentence = function (words, lang) { return lang === 'zh' ? words.map((w, i) => rsZhTag(w, i, words)) : prevSent(words, lang); }; }
/* meanings: the builder's words, then the word list; with the pinyin in front ("lǎoshī · teacher") */
{ const prevMap = rsGlossMap;
  rsGlossMap = function (lang) {
    if (lang !== 'zh' || RS_GLOSS.zh) return prevMap(lang);
    const m = prevMap('zh');
    for (const [w, [, g]] of rsZhLex()) if (!m.has(w)) m.set(w, g);
    for (const [w, g] of [['了', 'done (completed action)'], ['的', '’s / of'], ['吗', '? (yes/no question)'], ['呢', '(and you? / still)'], ['吧', '(let’s / I suppose)'], ['着', '(-ing, ongoing)'], ['地', '(-ly)'], ['得', '(how well: …)'], ['们', '(more than one person)'], ['啊', '(oh! / softens)'], ['把', '(puts the object before the verb)'], ['被', '(by: passive)']]) m.set(w, g);
    return m;
  };
}
{ const prevGloss = rsGloss;
  rsGloss = function (word, lang) {
    if (lang !== 'zh') return prevGloss(word, lang);
    const w = String(word || ''), m = rsGlossMap('zh'), lex = rsZhLex().get(w), dict = RS_DICT_GET('zh', w);
    const g = lex?.[1] || m.get(w) || dict?.[1] || '';
    const py = typeof zhPinyin === 'function' ? zhPinyin(w, '') : '';
    return g ? (py ? py + ' · ' + g : g) : '';
  };
}
/* words we have no meaning for still show their pinyin; 🌐 Look up missing words then adds the meaning from Wiktionary */
if (typeof rsFillMissing === 'function') {
  const prevFill = rsFillMissing;
  rsFillMissing = async function () {
    if (rs?.lang !== 'zh' || !rs.chips) return prevFill();
    const round = rs.s, py = c => zhPinyin(String(c.w), '');
    rs.chips.forEach(c => { if (c.pyOnly) { c.gloss = ''; c.pyOnly = false; } });
    await prevFill();
    if (!rs || rs.s !== round) return;
    let changed = false;
    rs.chips.forEach(c => { const p = py(c); if (!p) return; if (!c.gloss) { c.gloss = p; c.pyOnly = true; changed = true; } else if (!c.gloss.startsWith(p)) { c.gloss = p + ' · ' + c.gloss; changed = true; } });
    if (changed && view.name === 'realsent') render();
  };
}
if (typeof rsRound === 'function') {
  const prevRound = rsRound;
  rsRound = function () {
    prevRound();
    if (rs?.lang !== 'zh') return;
    for (const c of [...rs.chips, ...rs.tray]) if (!c.gloss) { c.gloss = zhPinyin(String(c.w), ''); c.pyOnly = true; }
  };
}
