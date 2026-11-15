'use strict';
/* ================= Sentence Builder: Japanese =================
   Polite present-tense sentences (ます / です). What the checker teaches:
   • the verb (or です) comes last, and the phrases before it can be in any order
   • every noun needs a particle after it: は / が / も for who, を for what, に / へ for where you go,
     で for where you do something, に for where something is, と for who with, の between two nouns
   • あります for things, います for people and animals
   • い-adjectives go straight before a noun or です; な-adjectives take な before a noun, but not before です
   • the negative is ません (and じゃありません after a noun or a な-adjective)
   Words are written in kana; the little hint under each word gives the romaji and the English. Loaded after builder.js. */

//            kana       kanji     romaji        English            kind
const JA_PRON = [['わたし', '私', 'watashi', 'I', 'person'], ['あなた', 'あなた', 'anata', 'you', 'person'], ['かれ', '彼', 'kare', 'he', 'person'], ['かのじょ', '彼女', 'kanojo', 'she', 'person'], ['わたしたち', '私たち', 'watashitachi', 'we', 'person']];
//            kana          kanji       romaji          kind      English
const JA_NOUN = [
  ['せんせい', '先生', 'sensei', 'person', 'teacher'], ['がくせい', '学生', 'gakusei', 'person', 'student'], ['ともだち', '友達', 'tomodachi', 'person', 'friend'], ['はは', '母', 'haha', 'person', 'my mother'],
  ['ちち', '父', 'chichi', 'person', 'my father'], ['こども', '子供', 'kodomo', 'person', 'child'], ['いもうと', '妹', 'imouto', 'person', 'my little sister'], ['おとうと', '弟', 'otouto', 'person', 'my little brother'],
  ['いぬ', '犬', 'inu', 'animal', 'dog'], ['ねこ', '猫', 'neko', 'animal', 'cat'], ['とり', '鳥', 'tori', 'animal', 'bird'], ['うま', '馬', 'uma', 'animal', 'horse'],
  ['パン', 'パン', 'pan', 'food', 'bread'], ['ごはん', 'ご飯', 'gohan', 'food', 'rice'], ['りんご', 'りんご', 'ringo', 'food', 'apple'], ['にく', '肉', 'niku', 'food', 'meat'], ['さかな', '魚', 'sakana', 'food', 'fish'],
  ['すし', '寿司', 'sushi', 'food', 'sushi'], ['ケーキ', 'ケーキ', 'kēki', 'food', 'cake'],
  ['みず', '水', 'mizu', 'drink', 'water'], ['おちゃ', 'お茶', 'ocha', 'drink', 'tea'], ['コーヒー', 'コーヒー', 'kōhī', 'drink', 'coffee'], ['ぎゅうにゅう', '牛乳', 'gyūnyū', 'drink', 'milk'], ['ジュース', 'ジュース', 'jūsu', 'drink', 'juice'],
  ['ほん', '本', 'hon', 'read', 'book'], ['てがみ', '手紙', 'tegami', 'read', 'letter'], ['しんぶん', '新聞', 'shinbun', 'read', 'newspaper'], ['ざっし', '雑誌', 'zasshi', 'read', 'magazine'],
  ['いえ', '家', 'ie', 'place', 'house'], ['がっこう', '学校', 'gakkō', 'place', 'school'], ['こうえん', '公園', 'kōen', 'place', 'park'], ['みせ', '店', 'mise', 'place', 'store'], ['レストラン', 'レストラン', 'resutoran', 'place', 'restaurant'],
  ['としょかん', '図書館', 'toshokan', 'place', 'library'], ['えき', '駅', 'eki', 'place', 'station'], ['うみ', '海', 'umi', 'place', 'beach'], ['まち', '町', 'machi', 'place', 'town'], ['へや', '部屋', 'heya', 'place', 'room'],
  ['くるま', '車', 'kuruma', 'thing', 'car'], ['つくえ', '机', 'tsukue', 'thing', 'desk'], ['いす', '椅子', 'isu', 'thing', 'chair'], ['でんわ', '電話', 'denwa', 'thing', 'phone'], ['ボール', 'ボール', 'bōru', 'thing', 'ball'],
  ['はな', '花', 'hana', 'thing', 'flower'], ['かさ', '傘', 'kasa', 'thing', 'umbrella'], ['かばん', 'かばん', 'kaban', 'thing', 'bag'], ['テレビ', 'テレビ', 'terebi', 'thing', 'TV'], ['じてんしゃ', '自転車', 'jitensha', 'thing', 'bike'],
  ['まど', '窓', 'mado', 'thing', 'window'], ['ドア', 'ドア', 'doa', 'thing', 'door']];
const JA_OPENABLE = ['まど', 'ドア', 'みせ', 'かばん'];   // あけます / しめます: doors, windows, shops, bags (a book closes with とじます)
//            kana          kanji        romaji          い / な   English       describes (p people, a animals, f food & drink, t things, l places, r reading)
const JA_ADJ = [['おおきい', '大きい', 'ōkii', 'i', 'big', 'patl'], ['ちいさい', '小さい', 'chiisai', 'i', 'small', 'patl'], ['あたらしい', '新しい', 'atarashii', 'i', 'new', 'tlr'],
  ['ふるい', '古い', 'furui', 'i', 'old', 'tlr'], ['たかい', '高い', 'takai', 'i', 'expensive', 'tfr'], ['やすい', '安い', 'yasui', 'i', 'cheap', 'tfr'], ['おいしい', '美味しい', 'oishii', 'i', 'delicious', 'f'],
  ['つめたい', '冷たい', 'tsumetai', 'i', 'cold', 'f'], ['かわいい', '可愛い', 'kawaii', 'i', 'cute', 'pat'], ['しろい', '白い', 'shiroi', 'i', 'white', 'at'], ['くろい', '黒い', 'kuroi', 'i', 'black', 'at'],
  ['あかい', '赤い', 'akai', 'i', 'red', 'tf'], ['あおい', '青い', 'aoi', 'i', 'blue', 't'], ['はやい', '速い', 'hayai', 'i', 'fast', 'pat'], ['おもしろい', '面白い', 'omoshiroi', 'i', 'interesting', 'pr'],
  ['しずか', '静か', 'shizuka', 'na', 'quiet', 'pl'], ['きれい', '綺麗', 'kirei', 'na', 'pretty', 'ptl'], ['げんき', '元気', 'genki', 'na', 'lively', 'pa'], ['ゆうめい', '有名', 'yūmei', 'na', 'famous', 'pl'],
  ['しんせつ', '親切', 'shinsetsu', 'na', 'kind', 'p'], ['べんり', '便利', 'benri', 'na', 'handy', 'tl']];
//            dictionary    ます form        ません form        romaji (ます)      kind     takes                       needs one  English        he/she form    who
const JA_VERB = [['たべる', 'たべます', 'たべません', 'tabemasu', 'tr', ['food'], 0, 'eat', 'eats', 'a'], ['のむ', 'のみます', 'のみません', 'nomimasu', 'tr', ['drink'], 0, 'drink', 'drinks', 'a'],
  ['よむ', 'よみます', 'よみません', 'yomimasu', 'tr', ['read'], 0, 'read', 'reads', 'p'], ['かく', 'かきます', 'かきません', 'kakimasu', 'tr', ['read'], 0, 'write', 'writes', 'p'],
  ['かう', 'かいます', 'かいません', 'kaimasu', 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'buy', 'buys', 'p'], ['みる', 'みます', 'みません', 'mimasu', 'tr', ['*'], 1, 'see', 'sees', 'a'],
  ['つくる', 'つくります', 'つくりません', 'tsukurimasu', 'tr', ['food', 'drink'], 1, 'make', 'makes', 'p'], ['あける', 'あけます', 'あけません', 'akemasu', 'tr', ['open'], 1, 'open', 'opens', 'p'],
  ['しめる', 'しめます', 'しめません', 'shimemasu', 'tr', ['open'], 1, 'close', 'closes', 'p'], ['まつ', 'まちます', 'まちません', 'machimasu', 'tr', ['person', 'animal'], 1, 'wait for', 'waits for', 'a'],
  ['いく', 'いきます', 'いきません', 'ikimasu', 'go', null, 1, 'go', 'goes', 'a'], ['くる', 'きます', 'きません', 'kimasu', 'go', null, 1, 'come', 'comes', 'a'], ['かえる', 'かえります', 'かえりません', 'kaerimasu', 'go', null, 1, 'go home', 'goes home', 'a'],
  ['あそぶ', 'あそびます', 'あそびません', 'asobimasu', 'in', null, 0, 'play', 'plays', 'a'], ['はたらく', 'はたらきます', 'はたらきません', 'hatarakimasu', 'in', null, 0, 'work', 'works', 'p'],
  ['べんきょうする', 'べんきょうします', 'べんきょうしません', 'benkyō shimasu', 'in', null, 0, 'study', 'studies', 'p'], ['ねる', 'ねます', 'ねません', 'nemasu', 'in', null, 0, 'sleep', 'sleeps', 'a'],
  ['はしる', 'はしります', 'はしりません', 'hashirimasu', 'in', null, 0, 'run', 'runs', 'a'], ['およぐ', 'およぎます', 'およぎません', 'oyogimasu', 'in', null, 0, 'swim', 'swims', 'a'],
  ['はなす', 'はなします', 'はなしません', 'hanashimasu', 'in', null, 0, 'talk', 'talks', 'p'],
  ['ある', 'あります', 'ありません', 'arimasu', 'exist', null, 1, 'be there', 'is there', 't'], ['いる', 'います', 'いません', 'imasu', 'exist', null, 1, 'be there', 'is there', 'pa']];
const JA_PART = { 'は': ['wa', 'topic: who or what the sentence is about'], 'が': ['ga', 'subject: who or what (with あります / います)'], 'も': ['mo', 'also / too'], 'を': ['o', 'the thing the action is done to'],
  'に': ['ni', 'where you go, or where something is'], 'へ': ['e', 'toward a place'], 'で': ['de', 'where you do something'], 'と': ['to', 'together with'], 'の': ['no', '’s / of'], 'な': ['na', 'joins a な-adjective to a noun'] };
//            kana        romaji      English       how: time = a time word (no particle) · freq = how often · deg = very (before an adjective)
const JA_ADV = [['きょう', 'kyō', 'today', 'time'], ['あした', 'ashita', 'tomorrow', 'time'], ['まいにち', 'mainichi', 'every day', 'time'], ['いつも', 'itsumo', 'always', 'freq'], ['よく', 'yoku', 'often', 'freq'], ['とても', 'totemo', 'very', 'deg']];
const JA_KIND = { food: 'food', drink: 'drinks', read: 'things you read or write', thing: 'things', place: 'places', animal: 'animals', person: 'people', open: 'things you can open' };

/* chips (gloss = romaji · English, shown under the word) */
const jaPron = p => chip({ k: 'pron', w: p[0], e: p, cat: 'person', en: p[3], gloss: `${p[2]} · ${p[3]}` });
const jaNoun = n => chip({ k: 'noun', w: n[0], e: n, cat: n[3], en: n[4], gloss: `${n[2]} · ${n[4]}` });
const jaAdj = a => chip({ k: 'adj', w: a[0], e: a, en: a[4], na: a[3] === 'na', gloss: `${a[2]} · ${a[4]}` });
const jaVerb = (v, neg) => chip({ k: 'verb', w: neg ? v[2] : v[1], e: v, neg: !!neg, type: v[4], gloss: `${neg ? v[3].replace(/masu$/, 'masen') : v[3]} · ${neg ? 'not ' : ''}${v[7]}` });
const jaCop = neg => chip({ k: 'cop', w: neg ? 'じゃありません' : 'です', neg: !!neg, gloss: neg ? 'ja arimasen · is not' : 'desu · is' });
const JA_PART_SHORT = { 'は': 'topic', 'が': 'subject', 'も': 'also', 'を': 'object', 'に': 'to / at', 'へ': 'toward', 'で': 'at / by', 'と': 'with', 'の': '’s', 'な': 'na-adjective' };
const jaPart = w => chip({ k: 'part', w, gloss: `${JA_PART[w][0]} · ${JA_PART_SHORT[w]}` });
const jaAdv = w => { const a = JA_ADV.find(x => x[0] === w); return chip({ k: 'adv', w, how: a[3], en: a[2], gloss: `${a[1]} · ${a[2]}` }); };

/* ---------------- Japanese checker ---------------- */
function jaCheck(T) {
  let i = 0;
  const err = (msg, at = i) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length }), peek = (o = 0) => T[i + o], isErr = x => x && x.ok === false;
  if (!T.length) return err('Tap some words to build a sentence.');
  const isNounish = t => t && (t.k === 'noun' || t.k === 'pron');
  // a noun phrase: (とても) adjective (な) … noun (の noun)
  function NP() {
    const start = i, mods = [];
    for (;;) {
      if (peek()?.k === 'adv' && peek().how === 'deg') { i++; if (peek()?.k !== 'adj') return err('“とても” (very) goes right before a describing word: “とても おおきい”.', i - 1); }
      if (peek()?.k === 'adj') {
        const a = T[i++];
        if (a.na) { if (peek()?.k === 'part' && peek().w === 'な') { i++; if (peek()?.k === 'cop') return err(`Before “です”, a な-adjective has no “な”: “${a.w}です”.`, i - 1); } else if (isNounish(peek())) return err(`“${a.w}” is a な-adjective, so it needs “な” before a noun: “${a.w}な ${peek().w}”.`, i - 1); else return { adjOnly: a, start }; }
        else if (peek()?.k === 'part' && peek().w === 'な') return err(`“${a.w}” is an い-adjective, so it goes straight before the noun, with no “な”: “${a.w} ${peek(1)?.w || '…'}”.`, i);
        else if (!isNounish(peek())) return { adjOnly: a, start };
        mods.push(a); continue;
      }
      break;
    }
    const n = peek();
    if (!isNounish(n)) return err(mods.length ? 'A describing word goes right before a noun.' : 'A noun (a person, place or thing) should go here.', i);
    i++;
    let owner = null, head = n;
    if (peek()?.k === 'part' && peek().w === 'の' && (isNounish(peek(1)) || peek(1)?.k === 'adj')) { i++; const o = NP(); if (isErr(o)) return o; if (o.adjOnly) return err('After “の” comes a noun: “わたし の いぬ”.', i); owner = { n: head, mods }; return { n: o.n, mods: o.mods, owner, start, cat: o.n.cat }; }
    return { n: head, mods, owner, start, cat: head.cat };
  }
  const npJa = np => [np.owner ? [...np.owner.mods.map(a => a.w + (a.na ? 'な' : '')), np.owner.n.w, 'の'].join('') : '', ...np.mods.map(a => a.w + (a.na ? 'な' : '')), np.n.w].join('');
  const C = { time: [], freq: [], phrases: [], pred: null, verb: null };
  // everything before the verb: time words, phrases with their particle, and (before です) what something is
  while (i < T.length) {
    const t = peek();
    if (t.k === 'verb' || t.k === 'cop') break;
    if (t.k === 'adv' && t.how !== 'deg') { (t.how === 'time' ? C.time : C.freq).push(T[i++]); continue; }
    if (t.k === 'part') return err(i === 0 ? `A sentence can’t start with “${t.w}”. Particles go right after a noun: “わたし${t.w}”.` : `“${t.w}” goes right after a noun. Two particles can’t go in a row here.`);
    const np = NP(); if (isErr(np)) return np;
    if (np.adjOnly) { if (peek()?.k === 'cop') { C.pred = { adj: np.adjOnly }; break; } return err(`“${np.adjOnly.w}” describes something. Put it before a noun, or before “です” at the end: “${np.adjOnly.w}です”.`, np.start); }
    const p = peek();
    if (p?.k === 'cop') { C.pred = { np }; break; }
    if (!p || p.k !== 'part' || p.w === 'な') return err(p?.k === 'verb' ? `Japanese needs a particle after “${npJa(np)}”: for example を for the thing, で for the place, は for who.` : !p ? `Japanese needs a particle after “${npJa(np)}”, then a verb at the end.` : `Japanese needs a particle after “${npJa(np)}”: は, を, に, で…`, i - 1);
    i++; C.phrases.push({ np, p });
  }
  const v = peek();
  if (!v) return err('Japanese puts the verb at the end: finish with a verb (like “たべます”) or “です”.');
  i++; C.verb = v;
  if (i < T.length) return err(`In Japanese the verb (or です) comes last. Move “${T[i].w}” before “${v.w}”.`, i);
  const roles = { wa: [], o: [], ni: [], e: [], de: [], to: [] };
  for (const ph of C.phrases) { const r = { 'は': 'wa', 'が': 'wa', 'も': 'wa', 'を': 'o', 'に': 'ni', 'へ': 'e', 'で': 'de', 'と': 'to', 'の': null }[ph.p.w]; if (!r) return err('“の” joins two nouns: “わたし の いぬ”. Put a noun after it.', T.indexOf(ph.p)); roles[r].push(ph); }
  const at = ph => T.indexOf(ph.p);
  if (roles.wa.length > 1) return err('Use は / が for who (or what) the sentence is about only once.', at(roles.wa[1]));
  const subj = roles.wa[0];
  // です: X は Y です, X は おおきい です, X は しずか です
  if (v.k === 'cop') {
    if (!C.pred) return err('“です” needs what something is right before it: a noun (“がくせいです”) or a describing word (“おおきいです”).', i - 1);
    if (C.pred.adj?.na === false && v.neg) return err(`An い-adjective makes its own negative: “${C.pred.adj.w.slice(0, -1)}くないです” (not “${C.pred.adj.w} じゃありません”). Try “です” here.`, i - 1);
    for (const r of ['o', 'ni', 'e', 'de', 'to']) if (roles[r].length) { const ph = roles[r][0]; return err(`With “です”, say who or what with は, then what it is. “${ph.p.w}” doesn’t fit here.`, at(ph)); }
    C.subj = subj; return { ok: true, P: C };
  }
  if (C.pred) return err(`Only “です” goes right after “${C.pred.np ? npJa(C.pred.np) : C.pred.adj.w}” without a particle. Before a verb, add a particle.`, i - 2);
  const animate = np => ['person', 'animal'].includes(np.cat);
  // does it make sense? things can't eat or run, and animals can't read or talk
  if (subj && v.type !== 'exist') {
    if (!animate(subj.np)) return err(`That doesn’t make sense: a ${subj.np.n.en} can’t ${v.e[7]}. Use a person or an animal before は.`, subj.np.start);
    if (subj.np.cat === 'animal' && v.e[9] === 'p') return err(`That doesn’t make sense: a ${subj.np.n.en} can’t ${v.e[7]}. Only people ${v.e[7]}.`, subj.np.start);
  }
  if (v.type === 'exist') {
    if (!subj) return err(`“${v.w}” needs what is there, with が or は: “いぬが ${v.w}”.`, i - 1);
    const alive = animate(subj.np), want = alive ? 'います' : 'あります', wantW = v.neg ? (alive ? 'いません' : 'ありません') : want;
    if (v.e[0] === (alive ? 'ある' : 'いる')) return err(`“${npJa(subj.np)}” is ${alive ? 'alive' : 'a thing'}, so Japanese uses “${wantW}”${alive ? ' (for people and animals)' : ' (for things)'}.`, i - 1);
    if (roles.de.length) return err(`For where something is, use “に”, not “で”: “${npJa(roles.de[0].np)}に ${npJa(subj.np)}が ${v.w}”.`, at(roles.de[0]));
    for (const ph of roles.ni) if (!['place', 'thing'].includes(ph.np.cat)) return err(`“に” here means where it is, so it needs a place or a thing (“こうえんに”, “つくえに”). “${ph.np.n.w}” doesn’t fit.`, at(ph));
    if (roles.o.length || roles.e.length) return err(`“${v.w}” doesn’t take “${(roles.o[0] || roles.e[0]).p.w}”. Say where it is with に: “へやに いぬが います”.`, at(roles.o[0] || roles.e[0]));
  } else if (v.type === 'go') {
    if (roles.o.length) return err(`“${v.w}” doesn’t take “を”. For where you go, use “に” or “へ”: “${npJa(roles.o[0].np)}に ${v.w}”.`, at(roles.o[0]));
    if (roles.de.length && roles.de.some(ph => ph.np.cat === 'place') && !roles.ni.length && !roles.e.length) return err(`For where you go, use “に” or “へ”, not “で”: “${npJa(roles.de[0].np)}に ${v.w}”.`, at(roles.de[0]));
    for (const ph of [...roles.ni, ...roles.e]) if (ph.np.cat !== 'place') return err(`“${ph.p.w}” + where you go needs a place: “がっこう${ph.p.w}”. “${ph.np.n.w}” isn’t a place.`, at(ph));
    if (roles.ni.length + roles.e.length > 1) return err('Say where you go only once.', at([...roles.ni, ...roles.e][1]));
  } else {
    // actions: を for the thing, で for the place where it happens
    if (v.type === 'in' && roles.o.length) return err(`“${v.w}” (${v.e[7]}) doesn’t take “を”. You can add a place with で: “こうえんで ${v.w}”.`, at(roles.o[0]));
    if (v.type === 'tr') {
      if (roles.o.length > 1) return err('Only one thing with “を” here.', at(roles.o[1]));
      const obj = roles.o[0];
      if (!obj) {
        const fits = [...roles.ni, ...roles.de, ...roles.e].find(ph => v.e[5][0] === '*' || v.e[5].includes(ph.np.cat) || (v.e[5][0] === 'open' && JA_OPENABLE.includes(ph.np.n.w)));
        if (fits) return err(`The thing you ${v.e[7]} takes “を”: “${npJa(fits.np)}を ${v.w}”.`, at(fits));
        if (v.e[6]) return err(`“${v.w}” needs what you ${v.e[7]}, with を. For example “${{ food: 'りんごを', drink: 'みずを', read: 'ほんを', thing: 'かさを', animal: 'いぬを', person: 'ともだちを', open: 'まどを', '*': 'テレビを' }[v.e[5][0]]} ${v.w}”.`, i - 1);
      } else {
        const ok = v.e[5][0] === '*' || (v.e[5][0] === 'open' ? JA_OPENABLE.includes(obj.np.n.w) : v.e[5].includes(obj.np.cat));
        if (!ok) return err(`That doesn’t make sense: you can’t ${v.e[7]} a ${obj.np.n.en}. “${v.w}” goes with ${v.e[5].map(c => JA_KIND[c]).join(', ')}.`, at(obj));
      }
    }
    for (const ph of roles.ni) if (ph.np.cat === 'place') return err(`Where you do something takes “で”, not “に”: “${npJa(ph.np)}で ${v.w}”.`, at(ph)); else return err(`“に” doesn’t fit with “${v.w}” here.`, at(ph));
    for (const ph of roles.e) return err(`“へ” is for where you go (with いきます). Where you do something takes “で”.`, at(ph));
    for (const ph of roles.de) if (ph.np.cat !== 'place') return err(`“で” + the place where it happens: “こうえんで”. “${ph.np.n.w}” isn’t a place.`, at(ph));
    if (roles.de.length > 1) return err('One place with で is enough.', at(roles.de[1]));
  }
  for (const ph of roles.de) if (animate(ph.np)) return err(`“で” is for a place (or a way of going, like でんしゃで). “With someone” is “と”: “${npJa(ph.np)}と”.`, at(ph));
  for (const ph of roles.to) if (!animate(ph.np)) return err(`“と” means together with someone: “ともだちと”. “${ph.np.n.w}” isn’t a person or animal.`, at(ph));
  C.subj = subj; C.roles = roles;
  return { ok: true, P: C };
}

/* English meaning of a correct Japanese sentence */
function jaEnglish(C) {
  const npEn = np => { const a = np.mods.map(m => m.en).join(' '), base = (a ? a + ' ' : '') + np.n.en; const mine = /^my /.test(base); return np.owner ? `${np.owner.n.k === 'pron' ? { I: 'my', you: 'your', he: 'his', she: 'her', we: 'our' }[np.owner.n.en] : npEn(np.owner) + "'s"} ${base}` : np.n.k === 'pron' || mine ? base : 'the ' + base; };
  const v = C.verb, s = C.subj ? npEn(C.subj.np) : 'I', third = !!C.subj && !['I', 'you', 'we'].includes(s), also = C.subj?.p.w === 'も' ? ' too' : '';
  const freq = C.freq.map(a => a.en).join(' '), when = C.time.map(a => a.en).join(' ');
  let out;
  if (v.k === 'cop') {
    const be = s === 'I' ? 'am' : third ? 'is' : 'are', what = C.pred.adj ? C.pred.adj.en : (/^[aeiou]/i.test(npEn(C.pred.np).replace(/^the /, '')) ? 'an ' : 'a ') + npEn(C.pred.np).replace(/^the /, '');
    out = `${s} ${be}${v.neg ? ' not' : ''}${freq ? ' ' + freq : ''} ${what}`;
  } else if (v.type === 'exist') {
    const thing = npEn(C.subj.np).replace(/^the /, 'a '), place = C.roles.ni[0];
    out = `There ${v.neg ? 'is no' : 'is'} ${v.neg ? thing.replace(/^a /, '') : thing}${place ? ' in ' + npEn(place.np) : ''}`;
  } else {
    const base = v.e[7], s3 = v.e[8];
    out = v.neg ? `${s} ${third ? "doesn't" : "don't"}${freq ? ' ' + freq : ''} ${base}` : `${s} ${freq ? freq + ' ' : ''}${third ? s3 : base}`;
    const r = C.roles;
    if (r.o[0]) out += ' ' + npEn(r.o[0].np).replace(/^the (bread|rice|meat|fish|sushi|cake|water|tea|coffee|milk|juice)$/, '$1');
    for (const ph of [...r.ni, ...r.e]) if (!(v.e[0] === 'かえる' && ph.np.n.w === 'いえ')) out += ' to ' + npEn(ph.np);   // かえります = go home already
    for (const ph of r.de) out += ' at ' + npEn(ph.np);
    for (const ph of r.to) out += ' with ' + npEn(ph.np);
  }
  out = (out + also + (when ? ' ' + when : '')).replace(/\s+/g, ' ').trim();
  return out[0].toUpperCase() + out.slice(1) + '.';
}

/* ---------------- making a Japanese tray ---------------- */
function jaGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = list => { const fav = list.filter(x => pref.has(x[0]) || pref.has(x[1])); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const nounOf = cats => RP(JA_NOUN.filter(n => cats[0] === '*' || cats.includes(n[3]) || (cats[0] === 'open' && JA_OPENABLE.includes(n[0]))));
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
  const extra = [];
  const np = (n, out, opts = {}) => {
    if (opts.owner && coin(0.2)) { out.push(jaPron(R(JA_PRON.slice(0, 4))), jaPart('の')); }
    if (opts.adj !== false && coin(0.3)) { const a = RP(JA_ADJ.filter(x => x[5].includes(CAT[n[3]] || 'p'))); if (a) { if (coin(0.2)) out.push(jaAdv('とても')); out.push(jaAdj(a)); if (a[3] === 'na') out.push(jaPart('な')); else extra.push(jaPart('な')); } }
    out.push(jaNoun(n));
  };
  for (let tries = 0; tries < 120; tries++) {
    extra.length = 0;
    const out = [], kind = R(['tr', 'tr', 'tr', 'in', 'go', 'exist', 'cop', 'cop']), neg = coin(0.2);
    const time = kind !== 'cop' && coin(0.3) ? jaAdv(R(['きょう', 'あした', 'まいにち'])) : null;
    if (time && coin(0.5)) out.push(time);
    let verbChip, subjCat = 'person';
    if (kind === 'exist') {
      const thing = coin(0.5) ? nounOf(['person', 'animal']) : nounOf(['thing', 'food', 'read']), alive = ['person', 'animal'].includes(thing[3]);
      out.push(...(() => { const o = []; np(nounOf(['place']), o, { adj: false }); o.push(jaPart('に')); return o; })());
      np(thing, out, { adj: true }); out.push(jaPart('が'));
      const v = JA_VERB.find(x => x[0] === (alive ? 'いる' : 'ある')); verbChip = jaVerb(v, neg); extra.push(jaVerb(JA_VERB.find(x => x[0] === (alive ? 'ある' : 'いる')), neg), jaPart('で'));
    } else {
      // who: a pronoun or a noun with は (sometimes left out, like real Japanese)
      if (kind === 'cop' || coin(0.8)) {
        if (coin(0.5)) { out.push(jaPron(R(JA_PRON))); }
        else { const n = nounOf(['person', 'animal']); subjCat = n[3]; np(n, out, { adj: false, owner: true }); }
        out.push(jaPart(coin(0.15) ? 'も' : 'は')); extra.push(jaPart('を'));
      }
      if (time && !out.includes(time)) out.push(time);
      if (kind === 'cop') {
        if (coin(0.6)) { const a = RP(JA_ADJ.filter(x => x[5].includes(CAT[subjCat]))); if (coin(0.2)) out.push(jaAdv('とても')); out.push(jaAdj(a)); verbChip = jaCop(neg && a[3] === 'na'); if (a[3] === 'na') extra.push(jaPart('な')); }
        else { if (subjCat !== 'person' || out[0]?.k !== 'pron') continue; const who = R(['がくせい', 'せんせい']); out.push(jaNoun(JA_NOUN.find(x => x[0] === who))); verbChip = jaCop(neg); }
        extra.push(jaCop(!verbChip.neg));
      } else {
        const v = RP(JA_VERB.filter(x => x[4] === kind && (subjCat === 'person' || x[9] !== 'p')));
        if (kind === 'go') { np(v[0] === 'かえる' ? JA_NOUN.find(x => x[0] === 'いえ') : nounOf(['place']), out, { adj: false }); out.push(jaPart(coin(0.75) ? 'に' : 'へ')); extra.push(jaPart('で')); if (coin(0.25)) { np(nounOf(['person']), out, { adj: false }); out.push(jaPart('と')); } }
        else {
          if (coin(0.35)) { np(nounOf(['place']), out, { adj: false }); out.push(jaPart('で')); extra.push(jaPart('に')); }
          if (coin(0.15)) { np(nounOf(['person']), out, { adj: false }); out.push(jaPart('と')); }
          if (kind === 'tr') { np(nounOf(v[5]), out, { owner: true }); out.push(jaPart('を')); }
        }
        if (coin(0.2)) out.push(jaAdv(R(['いつも', 'よく'])));
        verbChip = jaVerb(v, neg); extra.push(jaVerb(v, !neg));
      }
    }
    out.push(verbChip);
    if (out.length < 3 || out.length > 13) continue;
    const res = jaCheck(out); if (!res.ok) continue;
    extra.push(jaPart(R(['は', 'を', 'に', 'で', 'が'])), jaNoun(nounOf(['*'])), jaAdv(R(['きょう', 'いつも'])));
    const seen = new Set(out.map(w => w.k + w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && !seen.has(x.k + x.w)) { seen.add(x.k + x.w); uniq.push(x); }
    return { words: out, extra: uniq.slice(0, Math.max(4, 15 - out.length)), english: jaEnglish(res.P) };
  }
  return null;
}

/* register: particles get their own word type and color (only shown for Japanese) */
BLD_TYPES.part = ['particle', 'marks what a word does: は, を, に, で…'];
BLD_LANGS.ja = { name: 'Japanese', check: jaCheck, gen: jaGenerate, voice: 'ja-JP', english: jaEnglish, types: ['pron', 'noun', 'verb', 'adj', 'part', 'adv'], noSpaces: true };
BLD_ORDER.ja = { rows: [
    ['A basic sentence', [['pron', 'who'], ['part', 'は'], ['noun', 'what'], ['part', 'を'], ['verb', 'verb']]],
    ['Going somewhere', [['pron', 'who'], ['part', 'は'], ['noun', 'place'], ['part', 'に / へ'], ['verb', 'いきます']]],
    ['Where you do something', [['pron', 'who'], ['part', 'は'], ['noun', 'place'], ['part', 'で'], ['noun', 'what'], ['part', 'を'], ['verb', 'verb']]],
    ['Saying what something is', [['noun', 'who / what'], ['part', 'は'], ['adj', 'adjective or noun'], ['verb', 'です']]],
    ['Something is there', [['noun', 'place'], ['part', 'に'], ['noun', 'what'], ['part', 'が'], ['verb', 'あります / います']]],
    ['Describing a noun', [['adv', '(とても)'], ['adj', 'adjective'], ['part', '(な)'], ['noun', 'noun']]],
  ], tips: [
    ['verb', 'The verb (or <b>です</b>) always comes <b>last</b>. The parts before it can go in any order.'],
    ['part', 'Every noun needs a particle after it: <b>は</b> who, <b>を</b> what, <b>に / へ</b> where you go, <b>で</b> where you do it, <b>と</b> with whom, <b>の</b> ’s.'],
    ['verb', '<b>あります</b> for things, <b>います</b> for people and animals. Where it is takes <b>に</b>.'],
    ['adj', '<b>い</b>-adjectives (おおきい) go straight before a noun. <b>な</b>-adjectives (しずか) need <b>な</b> before a noun, but not before です.'],
    ['verb', 'Negative: <b>ません</b> (たべません). After a noun or a な-adjective: <b>じゃありません</b>.'],
    ['adv', 'Time words like <b>きょう</b> and <b>あした</b> need no particle. <b>とても</b> goes right before an adjective.'],
    ['pron', 'You can leave out who does it when it’s clear (usually “I”).'] ] };

/* ---------------- Your own Japanese words (📚 Add my deck's words) ---------------- */
// kana → romaji, for the little hint under each word
const JA_ROMA = (() => {
  const h = 'あa いi うu えe おo かka きki くku けke こko さsa しshi すsu せse そso たta ちchi つtsu てte とto なna にni ぬnu ねne のno はha ひhi ふfu へhe ほho まma みmi むmu めme もmo やya ゆyu よyo らra りri るru れre ろro わwa をwo んn がga ぎgi ぐgu げge ごgo ざza じji ずzu ぜze ぞzo だda ぢji づzu でde どdo ばba びbi ぶbu べbe ぼbo ぱpa ぴpi ぷpu ぺpe ぽpo ぁa ぃi ぅu ぇe ぉo ゃya ゅyu ょyo';
  const m = {}; for (const p of h.split(' ')) m[p[0]] = p.slice(1); return m;
})();
function jaRomaji(t) {
  t = String(t || '').replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  let out = '';
  for (let i = 0; i < t.length; i++) {
    const c = t[i], n = t[i + 1];
    if (c === 'っ' && JA_ROMA[n]) { out += JA_ROMA[n][0]; continue; }
    if (c === 'ー') { out += out.slice(-1); continue; }
    if ('ゃゅょ'.includes(n) && JA_ROMA[c]) { const base = JA_ROMA[c].slice(0, -1); out += (/^(sh|ch|j)$/.test(base) ? base : base + 'y') + JA_ROMA[n].slice(1); i++; continue; }
    if (JA_ROMA[c] == null) return '';   // kanji or something else: no romaji
    out += JA_ROMA[c];
  }
  return out;
}
// dictionary form → [ます, ません]
const JA_GODAN_RU = /^(かえる|帰る|はいる|入る|はしる|走る|しる|知る|きる|切る|いる|要る|しゃべる|へる|減る|すべる|滑る|ける|蹴る|あせる|焦る)$/;
const JA_I_ROW = 'いきぎしじちぢにひびぴみりえけげせぜてでねへべぺめれ';
function jaConjugate(v) {
  const w = String(v || '').trim();
  let masu;
  if (/(する)$/.test(w)) masu = w.slice(0, -2) + 'します';
  else if (/^(くる|来る)$/.test(w)) masu = w === 'くる' ? 'きます' : '来ます';
  else if (/る$/.test(w) && JA_I_ROW.includes(w.slice(-2, -1)) && !JA_GODAN_RU.test(w)) masu = w.slice(0, -1) + 'ます';   // たべる → たべます
  else { const map = { う: 'い', く: 'き', ぐ: 'ぎ', す: 'し', つ: 'ち', ぬ: 'に', ぶ: 'び', む: 'み', る: 'り' }, last = w.slice(-1); masu = map[last] ? w.slice(0, -1) + map[last] + 'ます' : w + 'ます'; }
  return [masu, masu.replace(/ます$/, 'ません')];
}
const JA_NA_LOOKS_I = /^(きれい|綺麗|ゆうめい|有名|きらい|嫌い|とくい|得意|しつれい|失礼|ていねい|丁寧)$/;
const jaAdjGuess = w => /い$/.test(w) && !JA_NA_LOOKS_I.test(w) ? 'i' : 'na';
const JA_BASE = { n: JA_NOUN.length, a: JA_ADJ.length, v: JA_VERB.length };
const jaKnown = w => JA_NOUN.slice(0, JA_BASE.n).some(n => n[0] === w || n[1] === w) || JA_VERB.slice(0, JA_BASE.v).some(v => v.slice(0, 3).includes(w))
  || JA_ADJ.slice(0, JA_BASE.a).some(a => a[0] === w || a[1] === w) || JA_PRON.some(p => p[0] === w || p[1] === w) || !!JA_PART[w] || JA_ADV.some(a => a[0] === w);
function jaApplyMine() {
  JA_NOUN.length = JA_BASE.n; JA_ADJ.length = JA_BASE.a; JA_VERB.length = JA_BASE.v;
  for (const m of S.bldWords || []) {
    if (!m || m.lang !== 'ja' || !m.w || !m.en || jaKnown(m.w)) continue;
    const roma = jaRomaji(m.read || m.w);
    if (m.k === 'noun') JA_NOUN.push([m.w, m.w, roma || m.read || '', m.cat || 'thing', m.en]);
    if (m.k === 'verb' && Array.isArray(m.forms) && m.forms.length === 2) {
      const type = m.obj === 'in' ? 'in' : 'tr', objs = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read'];
      JA_VERB.push([m.w, m.forms[0], m.forms[1], jaRomaji(m.forms[0]) || roma, type, objs, 0, m.en, bld3sEn(m.en), m.who === 'a' ? 'a' : 'p']);
    }
    if (m.k === 'adj') JA_ADJ.push([m.w, m.w, roma, m.at === 'na' ? 'na' : 'i', m.en, 'patflr']);
  }
}
BLD_MINE.ja = { name: 'Japanese', forms: 'ます form, ません form', nForms: 2, noGender: true, conj: w => jaConjugate(w), pl: w => w, adj: w => [w],
  known: w => jaKnown(w), gender: () => 'm', isVerb: w => /[うくぐすつぬぶむる]$/.test(w), refl: () => false, adjType: w => jaAdjGuess(w),
  // 犬（いぬ）: the word as the card writes it, with its reading kept for the romaji hint
  parse: s => { const read = (s.match(/[（(]([^）)]+)[）)]/) || [])[1]; const w = s.replace(/[（(][^）)]*[）)]/g, '').replace(/\s+/g, '').trim();
    return /^[぀-ヿ一-鿿々ー]+$/.test(w) ? { w, read: read && /^[぀-ヿー]+$/.test(read.trim()) ? read.trim() : null } : null; },
  intro: 'words like <i>“to …”</i> are verbs). Verb forms (ます / ません) are filled in for you, including する and くる; check any that look wrong. For adjectives, pick い or な.' };
