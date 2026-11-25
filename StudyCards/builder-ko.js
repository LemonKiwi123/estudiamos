'use strict';
/* ================= Sentence Builder: Korean =================
   Polite present-tense sentences (-아요 / -어요, 이에요 / 예요). What the checker teaches:
   • the verb (or 이에요 / 예요) comes last, and the phrases before it can be in any order
   • every noun needs a particle stuck on the end: 은/는 / 이/가 / 도 for who, 을/를 for what, 에 for where you go or
     where something is, 에서 for where you do something, 하고 for who with, 의 for ’s
   • the particle's form depends on the last letter: after a consonant 은 / 이 / 을 / 이에요, after a vowel 는 / 가 / 를 / 예요
   • 저 + 가 becomes 제가, and “my” is 제
   • describing words have two forms: 큰 before a noun (큰 개), 커요 at the end (개가 커요)
   • the negative is 안 before the verb (안 먹어요), 공부 안 해요 for 하다 verbs, 없어요 for 있어요, 이/가 아니에요 for 이에요
   Words are written in Hangul; the little hint under each word gives the romanization (Revised Romanization) and the English.
   Loaded after builder.js. */

/* ---------------- Hangul helpers ---------------- */
const KO_L = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', KO_V = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ', KO_T = ' ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ';
const koSplit = ch => { const c = String(ch || '').charCodeAt(0) - 0xAC00; return c >= 0 && c < 11172 ? { L: Math.floor(c / 588), V: Math.floor(c % 588 / 28), T: c % 28 } : null; };
const koMake = (L, V, T = 0) => String.fromCharCode(0xAC00 + (L * 21 + V) * 28 + T);
const koLast = w => koSplit(String(w || '').slice(-1));
// does the word end in a consonant (a 받침)? Digits are read out: 1 일, 2 이, 3 삼…
const koHas = w => { const s = String(w || '').trim(), c = s.slice(-1); if (/\d/.test(c)) return '013678'.includes(c); const x = koSplit(c); return !!(x && x.T); };
const koFinal = w => KO_T[koLast(w)?.T || 0].trim();
const koSetT = (w, T) => { const x = koLast(w); return x ? w.slice(0, -1) + koMake(x.L, x.V, T) : w; };
const koSetV = (w, V) => { const x = koLast(w); return x ? w.slice(0, -1) + koMake(x.L, V, x.T) : w; };
const KO_PAIR = { '은': '는', '는': '은', '이': '가', '가': '이', '을': '를', '를': '을', '이에요': '예요', '예요': '이에요' };
const koPick = (w, afterCons, afterVowel) => koHas(w) ? afterCons : afterVowel;

/* ---------------- romanization (Revised Romanization), with the usual sound changes inside a word ---------------- */
const KO_RL = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const KO_RV = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
// each final: [sound at the end, [stays, moves on] before a vowel]
const KO_RT = [null, ['k', ['', 'g']], ['k', ['', 'kk']], ['k', ['k', 's']], ['n', ['', 'n']], ['n', ['n', 'j']], ['n', ['', 'n']], ['t', ['', 'd']], ['l', ['', 'r']], ['k', ['l', 'g']],
  ['m', ['l', 'm']], ['l', ['l', 'b']], ['l', ['l', 's']], ['l', ['l', 't']], ['p', ['l', 'p']], ['l', ['', 'r']], ['m', ['', 'm']], ['p', ['', 'b']], ['p', ['p', 's']], ['t', ['', 's']],
  ['t', ['', 'ss']], ['ng', ['ng', '']], ['t', ['', 'j']], ['t', ['', 'ch']], ['k', ['', 'k']], ['t', ['', 't']], ['p', ['', 'p']], ['t', ['', '']]];
function koRoman(text) {
  return String(text || '').split(/(\s+)/).map(word => {
    const chars = [...word], S = chars.map(koSplit), ov = [];
    let out = '';
    for (let i = 0; i < S.length; i++) {
      const s = S[i]; if (!s) { out += chars[i]; continue; }
      out += (ov[i] != null ? ov[i] : KO_RL[s.L]) + KO_RV[s.V];
      if (!s.T) continue;
      const T = s.T, [end, [stay, move]] = KO_RT[T], next = S[i + 1];
      if (!next) { out += end; continue; }
      const nl = next.L, put = (a, b) => { out += a; if (b != null) ov[i + 1] = b; };
      if (nl === 11) {   // a vowel next: the final moves over (먹어 meogeo, 읽어 ilgeo, 좋아 joa); 같이 gachi
        if ((T === 25 || T === 7) && next.V === 20) put('', T === 25 ? 'ch' : 'j'); else put(stay, move); continue;
      }
      if (T === 27 || T === 6 || T === 15) {   // ㅎ (and ㄶ ㅀ): 좋고 joko, 많다 manta, 좋네 jonne, 좋습니다 jotseumnida
        const pre = T === 6 ? 'n' : T === 15 ? 'l' : '';
        if (nl === 0) put(pre, 'k'); else if (nl === 3) put(pre, 't'); else if (nl === 12) put(pre, 'ch');
        else if (nl === 2) put(pre || 'n', T === 15 ? 'l' : null); else if (nl === 9) put(pre, 'ss'); else put(pre || 't');
        continue;
      }
      if (nl === 18 && (end === 'k' || end === 'p' || end === 't')) { put('', T === 22 || T === 23 ? 'ch' : end); continue; }   // 축하 chuka, 입학 ipak
      if (nl === 2 || nl === 6) {   // ㄴ ㅁ next: nasal sounds (합니다 hamnida, 국물 gungmul)
        if (end === 'k') put('ng'); else if (end === 'p') put('m'); else if (end === 't') put('n');
        else if (end === 'l' && nl === 2) put('l', 'l'); else put(end);
        continue;
      }
      if (nl === 5) {   // ㄹ next: 신라 silla, 별로 byeollo, 종로 jongno, 독립 dongnip
        if (end === 'l' || end === 'n') put('l', 'l'); else if (end === 'm' || end === 'ng') put(end, 'n'); else if (end === 'k') put('ng', 'n'); else if (end === 'p') put('m', 'n'); else put(end, 'n');
        continue;
      }
      put(end);
    }
    return out;
  }).join('');
}

/* ---------------- polite present (-아요 / -어요) and the form before a noun ---------------- */
const KO_IRR_POLITE = { '이다': '이에요', '아니다': '아니에요', '그렇다': '그래요', '하얗다': '하얘요', '빨갛다': '빨개요', '노랗다': '노래요', '파랗다': '파래요', '까맣다': '까매요',
  '돕다': '도와요', '곱다': '고와요', '낫다': '나아요', '짓다': '지어요', '붓다': '부어요', '잇다': '이어요', '푸다': '퍼요', '따르다': '따라요', '치르다': '치러요', '들르다': '들러요' };
const KO_D_IRR = /^(듣|걷|묻|싣|깨닫)$/;           // 듣다 → 들어요 (받다, 닫다, 믿다 stay regular)
const KO_B_REG = /(입|잡|씹|업|뽑|좁|접|굽히|뽑)$/;   // 입다 → 입어요; other ㅂ words: 춥다 → 추워요
const KO_H_REG = /(좋|놓|넣|낳|쌓|닿)$/;             // 좋다 → 좋아요; other ㅎ describing words: 빨갛다 → 빨개요
const koBright = V => V === 0 || V === 2 || V === 8;   // ㅏ ㅑ ㅗ take -아요
function koPolite(dict) {
  const w = String(dict || '').trim(); if (!/다$/.test(w) || w.length < 2) return null;
  if (KO_IRR_POLITE[w]) return KO_IRR_POLITE[w];
  for (const [k, v] of Object.entries(KO_IRR_POLITE)) if (w.length > k.length && w.endsWith(k) && k.length > 2) return w.slice(0, -k.length) + v;
  const st = w.slice(0, -1), x = koLast(st); if (!x) return null;
  if (/하$/.test(st)) return st.slice(0, -1) + '해요';
  if (x.T) {
    if (x.T === 7 && KO_D_IRR.test(st.slice(-1))) { const s2 = koSetT(st, 8); return s2 + (koBright(x.V) ? '아요' : '어요'); }
    if (x.T === 17 && !KO_B_REG.test(st)) return koSetT(st, 0) + '워요';
    if (x.T === 27 && !KO_H_REG.test(st)) return koSetV(koSetT(st, 0), x.V === 2 ? 3 : 1) + '요';
    return st + (koBright(x.V) ? '아요' : '어요');
  }
  if (st.slice(-1) === '르' && st.length > 1) { const before = st.slice(0, -1), b = koLast(before); return koSetT(before, 8) + (b && koBright(b.V) ? '라요' : '러요'); }
  const V = x.V;
  if (V === 0 || V === 4 || V === 6 || V === 1 || V === 5 || V === 2) return st + '요';            // 가요, 서요, 켜요, 보내요
  if (V === 8) return koSetV(st, 9) + '요';                                                        // 보다 → 봐요, 오다 → 와요
  if (V === 13) return koSetV(st, 14) + '요';                                                       // 배우다 → 배워요
  if (V === 20) return koSetV(st, 6) + '요';                                                        // 마시다 → 마셔요
  if (V === 11) return koSetV(st, 10) + '요';                                                       // 되다 → 돼요
  if (V === 18) { const b = koLast(st.slice(0, -1)); return koSetV(st, b && koBright(b.V) ? 0 : 4) + '요'; }   // 쓰다 → 써요, 바쁘다 → 바빠요
  return st + '어요';                                                                                // 쉬다 → 쉬어요
}
// the form before a noun: 큰 개, 작은 집, 맛있는 빵, 조용한 방, 귀여운 고양이, 긴 편지, 빨간 꽃
function koAttr(dict) {
  const w = String(dict || '').trim(); if (!/다$/.test(w)) return w;
  const st = w.slice(0, -1), x = koLast(st); if (!x) return w;
  if (/(있|없)$/.test(st)) return st + '는';
  if (/하$/.test(st)) return st.slice(0, -1) + '한';
  if (!x.T) return koSetT(st, 4);
  if (x.T === 8) return koSetT(st, 4);
  if (x.T === 17 && !KO_B_REG.test(st)) return koSetT(st, 0) + '운';
  if (x.T === 27 && !KO_H_REG.test(st)) return koSetT(st, 4);
  return st + '은';
}
// the negative: 안 먹어요, but 공부 안 해요 (a noun + 하다); 있다 → 없어요
function koNeg(dict, polite) {
  if (dict === '있다') return '없어요'; if (dict === '이다') return '아니에요';
  const st = dict.slice(0, -1);
  if (/하$/.test(st) && st.length >= 3 && !/[아어여]하$/.test(st)) return st.slice(0, -1) + ' 안 해요';
  return '안 ' + polite;
}

/* ---------------- word lists ---------------- */
//            Hangul   English  kind
const KO_PRON = [['저', 'I', 'person'], ['우리', 'we', 'person'], ['그', 'he', 'person'], ['그녀', 'she', 'person'], ['이것', 'this', 'thing']];
//            Hangul     kind      English
const KO_NOUN = [
  ['선생님', 'person', 'teacher'], ['학생', 'person', 'student'], ['친구', 'person', 'friend'], ['엄마', 'person', 'my mom'], ['아빠', 'person', 'my dad'], ['아이', 'person', 'child'],
  ['동생', 'person', 'my little brother or sister'], ['의사', 'person', 'doctor'], ['가수', 'person', 'singer'],
  ['개', 'animal', 'dog'], ['고양이', 'animal', 'cat'], ['새', 'animal', 'bird'], ['말', 'animal', 'horse'], ['토끼', 'animal', 'rabbit'],
  ['빵', 'food', 'bread'], ['밥', 'food', 'rice'], ['사과', 'food', 'apple'], ['고기', 'food', 'meat'], ['생선', 'food', 'fish'], ['김치', 'food', 'kimchi'], ['케이크', 'food', 'cake'], ['라면', 'food', 'ramen'],
  ['물', 'drink', 'water'], ['녹차', 'drink', 'green tea'], ['커피', 'drink', 'coffee'], ['우유', 'drink', 'milk'], ['주스', 'drink', 'juice'],
  ['책', 'read', 'book'], ['편지', 'read', 'letter'], ['신문', 'read', 'newspaper'], ['잡지', 'read', 'magazine'],
  ['음악', 'hear', 'music'], ['노래', 'hear', 'song'], ['라디오', 'hear', 'radio'],
  ['집', 'place', 'house'], ['학교', 'place', 'school'], ['공원', 'place', 'park'], ['가게', 'place', 'store'], ['식당', 'place', 'restaurant'], ['도서관', 'place', 'library'],
  ['역', 'place', 'station'], ['바다', 'place', 'sea'], ['시장', 'place', 'market'], ['방', 'place', 'room'], ['회사', 'place', 'office'],
  ['차', 'thing', 'car'], ['책상', 'thing', 'desk'], ['의자', 'thing', 'chair'], ['핸드폰', 'thing', 'phone'], ['공', 'thing', 'ball'], ['꽃', 'thing', 'flower'], ['우산', 'thing', 'umbrella'],
  ['가방', 'thing', 'bag'], ['텔레비전', 'thing', 'TV'], ['자전거', 'thing', 'bike'], ['창문', 'thing', 'window'], ['문', 'thing', 'door'], ['컴퓨터', 'thing', 'computer']];
const KO_OPENABLE = ['창문', '문', '가방', '가게'];   // 열어요 / 닫아요: doors, windows, bags, shops
//            dictionary  English      describes (p people, a animals, f food & drink, t things, l places, r things you read or hear)
const KO_ADJ = [['크다', 'big', 'patl'], ['작다', 'small', 'patl'], ['좋다', 'good', 'ptlfr'], ['비싸다', 'expensive', 'tfr'], ['싸다', 'cheap', 'tfr'], ['맛있다', 'delicious', 'f'],
  ['차갑다', 'cold', 'f'], ['뜨겁다', 'hot', 'f'], ['귀엽다', 'cute', 'pa'], ['예쁘다', 'pretty', 'ptl'], ['빠르다', 'fast', 'pat'], ['재미있다', 'interesting', 'pr'],
  ['조용하다', 'quiet', 'pl'], ['깨끗하다', 'clean', 'tl'], ['친절하다', 'kind', 'p'], ['바쁘다', 'busy', 'p'], ['길다', 'long', 'r'], ['빨갛다', 'red', 'tf']];
//            dictionary   kind     takes                                  needs one  English       he/she form    who
const KO_VERB = [['먹다', 'tr', ['food'], 0, 'eat', 'eats', 'a'], ['마시다', 'tr', ['drink'], 0, 'drink', 'drinks', 'a'], ['읽다', 'tr', ['read'], 0, 'read', 'reads', 'p'],
  ['쓰다', 'tr', ['read'], 0, 'write', 'writes', 'p'], ['사다', 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'buy', 'buys', 'p'], ['보다', 'tr', ['*'], 1, 'see', 'sees', 'a'],
  ['만들다', 'tr', ['food', 'drink', 'thing'], 1, 'make', 'makes', 'p'], ['좋아하다', 'tr', ['*'], 1, 'like', 'likes', 'a'], ['기다리다', 'tr', ['person', 'animal'], 1, 'wait for', 'waits for', 'a'],
  ['만나다', 'tr', ['person'], 1, 'meet', 'meets', 'p'], ['열다', 'tr', ['open'], 1, 'open', 'opens', 'p'], ['닫다', 'tr', ['open'], 1, 'close', 'closes', 'p'],
  ['듣다', 'tr', ['hear'], 1, 'listen to', 'listens to', 'p'],
  ['가다', 'go', null, 1, 'go', 'goes', 'a'], ['오다', 'go', null, 1, 'come', 'comes', 'a'],
  ['자다', 'in', null, 0, 'sleep', 'sleeps', 'a'], ['놀다', 'in', null, 0, 'play', 'plays', 'a'], ['일하다', 'in', null, 0, 'work', 'works', 'p'], ['공부하다', 'in', null, 0, 'study', 'studies', 'p'],
  ['운동하다', 'in', null, 0, 'exercise', 'exercises', 'p'], ['수영하다', 'in', null, 0, 'swim', 'swims', 'a'], ['이야기하다', 'in', null, 0, 'talk', 'talks', 'p'],
  ['걷다', 'in', null, 0, 'walk', 'walks', 'a'], ['뛰다', 'in', null, 0, 'run', 'runs', 'a'],
  ['있다', 'exist', null, 1, 'be there', 'is there', 't']];
const KO_PART = { '은': ['topic: who or what the sentence is about (after a consonant)', 'topic'], '는': ['topic: who or what the sentence is about (after a vowel)', 'topic'],
  '이': ['subject: who or what (after a consonant)', 'subject'], '가': ['subject: who or what (after a vowel)', 'subject'], '도': ['also / too', 'also'],
  '을': ['the thing the action is done to (after a consonant)', 'object'], '를': ['the thing the action is done to (after a vowel)', 'object'],
  '에': ['where you go, or where something is', 'to / at'], '에서': ['where you do something', 'at / in'], '하고': ['together with', 'with'], '의': ['’s / of', '’s'] };
//            Hangul   English     how: time = a time word (no particle) · freq = how often · deg = very (before a describing word)
const KO_ADV = [['오늘', 'today', 'time'], ['내일', 'tomorrow', 'time'], ['매일', 'every day', 'time'], ['항상', 'always', 'freq'], ['자주', 'often', 'freq'], ['아주', 'very', 'deg'], ['정말', 'really', 'deg']];
const KO_KIND = { food: 'food', drink: 'drinks', read: 'things you read or write', hear: 'things you listen to', thing: 'things', place: 'places', animal: 'animals', person: 'people', open: 'things you can open' };

/* chips (gloss = romanization · English, shown under the word) */
const koPron = p => chip({ k: 'pron', w: p[0], e: p, cat: p[2], en: p[1], gloss: `${koRoman(p[0])} · ${p[1]}` });
const koMy = () => chip({ k: 'pron', w: '제', my: true, cat: 'person', en: 'my', gloss: 'je · my / I (before 가)' });
const koNoun = n => chip({ k: 'noun', w: n[0], e: n, cat: n[1], en: n[2], gloss: `${koRoman(n[0])} · ${n[2]}` });
const koAdjC = (a, pred) => { const w = pred ? (a[4] || koPolite(a[0])) : (a[3] || koAttr(a[0])); return chip({ k: 'adj', w, e: a, en: a[1], pred: !!pred, gloss: `${koRoman(w)} · ${pred ? 'is ' : ''}${a[1]}` }); };
const koVerbForm = (v, neg) => neg ? (v[8] || koNeg(v[0], v[7] || koPolite(v[0]))) : (v[7] || koPolite(v[0]));
const koVerb = (v, neg) => { const w = koVerbForm(v, neg); return chip({ k: 'verb', w, e: v, neg: !!neg, type: v[1], gloss: `${koRoman(w)} · ${v[1] === 'exist' ? (neg ? 'there is no / not have' : 'there is / have') : (neg ? 'not ' : '') + v[4]}` }); };
const koCop = w => chip({ k: 'cop', w, neg: w === '아니에요', attach: w !== '아니에요', gloss: w === '아니에요' ? 'anieyo · is not' : `${koRoman(w)} · is` });
const koPart = w => chip({ k: 'part', w, attach: true, gloss: `${koRoman(w)} · ${KO_PART[w][1]}` });
const koAdv = w => { const a = KO_ADV.find(x => x[0] === w); return chip({ k: 'adv', w, how: a[2], en: a[1], gloss: `${koRoman(w)} · ${a[1]}` }); };
const koJoin = words => words.reduce((t, w, i) => i && !w.attach ? t + ' ' + w.w : t + w.w, '') + '.';

/* ---------------- Korean checker ---------------- */
function koCheck(T) {
  let i = 0;
  const err = (msg, at = i) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length }), peek = (o = 0) => T[i + o], isErr = x => x && x.ok === false;
  if (!T.length) return err('Tap some words to build a sentence.');
  const isNounish = t => t && (t.k === 'noun' || t.k === 'pron');
  const isPart = (t, ...ws) => t?.k === 'part' && (!ws.length || ws.includes(t.w));
  // a noun phrase: (아주) describing word … (owner 의 / 제 / 우리 / 그) noun
  function NP() {
    const start = i, mods = [];
    let owner = null;
    for (;;) {
      if (peek()?.k === 'adv' && peek().how === 'deg') { if (peek(1)?.k !== 'adj') return err(`“${peek().w}” (${peek().en}) goes right before a describing word: “${peek().w} 커요”, “${peek().w} 큰 개”.`, i); i++; }
      if (peek()?.k === 'adj') {
        const a = T[i];
        if (a.pred) return { adjPred: a, start, mods };
        i++;
        if (!isNounish(peek())) return err(`“${a.w}” is the form that goes before a noun (“${a.w} ${peek()?.w && isNounish(peek()) ? peek().w : '개'}”). At the end of a sentence, use “${koPolite(a.e[0])}”.`, i - 1);
        mods.push(a); continue;
      }
      break;
    }
    const n = peek();
    if (!isNounish(n)) return err(mods.length ? 'A describing word goes right before a noun.' : 'A noun (a person, place or thing) should go here.', i);
    if (mods.length && n.k === 'pron') return err(`A describing word can’t go before “${n.w}”. Use a noun: “큰 개”.`, start);
    i++;
    // 제 개 (my dog), 우리 집 (our house), 그 책 (that book): straight before another noun, no particle
    if (n.k === 'pron' && (n.my || n.w === '우리' || n.w === '그') && (isNounish(peek()) || peek()?.k === 'adj')) {
      if (mods.length) return err('A describing word goes right before the noun it describes, after the owner: “제 큰 개”.', start);
      const o = NP(); if (isErr(o)) return o; if (o.adjPred) return err(`After “${n.w}” comes a noun: “${n.w} 개”.`, i);
      return { n: o.n, mods: o.mods, owner: { n, det: n.w === '그' }, start, cat: o.n.cat, ownerOf: o };
    }
    if (n.k === 'pron' && n.w === '저' && isNounish(peek())) return err(`For “my”, Korean uses “제”: “제 ${peek().w}”.`, i - 1);
    if (n.my && !isPart(peek(), '가')) return err(isPart(peek()) ? `“제” is “my” (or “I” before 가: “제가”). For “I” with “${peek().w}”, use 저: “저${peek().w === '은' || peek().w === '는' ? '는' : peek().w}”.` : '“제” means “my”: put a noun after it, like “제 친구”.', i - 1);
    // 친구의 책 (a friend's book), 그녀의 가방 (her bag)
    if (isPart(peek(), '의')) {
      if (!(isNounish(peek(1)) || peek(1)?.k === 'adj' || peek(1)?.how === 'deg')) return err('“의” joins two nouns: “친구의 책”. Put a noun after it.', i);
      if (n.w === '저') { /* 저의 is fine too (제 is shorter) */ }
      i++; const o = NP(); if (isErr(o)) return o; if (o.adjPred) return err('After “의” comes a noun: “친구의 책”.', i);
      return { n: o.n, mods: o.mods, owner: { n, mods, of: true }, start, cat: o.n.cat };
    }
    return { n, mods, owner: null, start, cat: n.cat };
  }
  const npKo = np => [np.owner ? [...(np.owner.mods || []).map(a => a.w), np.owner.n.w + (np.owner.of ? '의' : '')].join(' ') : '', ...np.mods.map(a => a.w), np.n.w].filter(Boolean).join(' ');
  // is this the right form of the particle for the word before it? 학교는 / 집은, 친구가 / 학생이, 사과를 / 빵을
  function form(np, p) {
    const w = np.n.w;
    if (np.n.my) return p.w === '가' ? null : err('“제” only goes with 가 (“제가” = I) or before a noun (“제 책” = my book).', T.indexOf(p));
    if (w === '저' && p.w === '가') return err('저 + 가 becomes “제가”. Use the word “제” with 가, or say “저는”.', T.indexOf(p));
    if (w === '저' && p.w === '이') return err('“저” ends in a vowel, so it takes 가, and 저 + 가 becomes “제가”. You can also say “저는”.', T.indexOf(p));
    const other = KO_PAIR[p.w]; if (!other || ['이에요', '예요'].includes(p.w)) return null;
    const want = koHas(w) ? (['은', '이', '을'].includes(p.w) ? p.w : other) : (['는', '가', '를'].includes(p.w) ? p.w : other);
    if (want === p.w) return null;
    return err(koHas(w) ? `“${w}” ends in a consonant (${koFinal(w)}), so it takes “${want}”, not “${p.w}”: “${w}${want}”.` : `“${w}” ends in a vowel, so it takes “${want}”, not “${p.w}”: “${w}${want}”.`, T.indexOf(p));
  }
  const C = { time: [], freq: [], phrases: [], pred: null, verb: null, deg: null };
  while (i < T.length) {
    const t = peek();
    if (t.k === 'verb' || (t.k === 'cop' && !t.attach)) break;
    if (t.k === 'adv' && t.how !== 'deg') { (t.how === 'time' ? C.time : C.freq).push(T[i++]); continue; }
    if (t.k === 'adv' && t.how === 'deg' && peek(1)?.k === 'verb' && peek(1).e[0] === '좋아하다') { C.deg = T[i++]; continue; }   // 정말 좋아해요
    if (t.k === 'adv' && t.how === 'deg' && peek(1)?.k === 'adj' && peek(1).pred) { C.deg = T[i++]; continue; }   // 아주 커요
    if (t.k === 'adj' && t.pred) break;
    if (t.k === 'part') return err(i === 0 ? `A sentence can’t start with “${t.w}”. Particles go right after a noun: “저${t.w === '은' ? '는' : t.w === '이' ? '가' : t.w === '을' ? '를' : t.w}”.` : `“${t.w}” goes right after a noun. Two particles can’t go in a row here.`);
    if (t.k === 'cop') return err(`“${t.w}” goes right after a noun: “학생이에요”, “의사예요”.`);
    const np = NP(); if (isErr(np)) return np;
    if (np.adjPred) break;
    const p = peek();
    if (p?.k === 'cop' && p.attach) {
      const want = koHas(np.n.w) ? '이에요' : '예요';
      if (np.n.my) return err('“제” means “my”: put a noun after it before 이에요 / 예요.', i - 1);
      if (p.w !== want) return err(koHas(np.n.w) ? `“${np.n.w}” ends in a consonant (${koFinal(np.n.w)}), so it takes “이에요”: “${np.n.w}이에요”.` : `“${np.n.w}” ends in a vowel, so it takes “예요”: “${np.n.w}예요”.`, i);
      i++; C.pred = { np }; C.verb = p; break;
    }
    if (!p || p.k !== 'part') return err(p?.k === 'verb' || (p?.k === 'adj' && p.pred) ? `Korean needs a particle after “${npKo(np)}”: for example 을/를 for the thing, 에서 for the place, 은/는 for who.` : !p ? `Korean needs a particle after “${npKo(np)}”, then a verb at the end.` : `Korean needs a particle after “${npKo(np)}”: 은/는, 을/를, 에, 에서…`, i - 1);
    const bad = form(np, p); if (bad) return bad;
    i++; C.phrases.push({ np, p });
  }
  let v = C.verb;
  if (!v) {
    v = peek();
    if (!v) return err('Korean puts the verb at the end: finish with a verb (like “먹어요”) or 이에요 / 예요.');
    if (v.k === 'adj' && !v.pred) return err(`“${v.w}” goes before a noun. At the end, use “${koPolite(v.e[0])}”.`, i);
    i++; C.verb = v;
  }
  if (i < T.length) return err(`In Korean the verb (or 이에요 / 예요) comes last. Move “${T[i].w}” before “${v.w}”.`, i);
  const roles = { wa: [], o: [], ni: [], de: [], to: [] };
  for (const ph of C.phrases) roles[{ '은': 'wa', '는': 'wa', '이': 'wa', '가': 'wa', '도': 'wa', '을': 'o', '를': 'o', '에': 'ni', '에서': 'de', '하고': 'to' }[ph.p.w]].push(ph);
  const at = ph => T.indexOf(ph.p), topic = ph => ['은', '는', '도'].includes(ph.p.w);
  const animate = np => ['person', 'animal'].includes(np.cat);
  const only = (allowed, what) => { for (const r of ['o', 'ni', 'de', 'to']) if (!allowed.includes(r) && roles[r].length) { const ph = roles[r][0]; return err(`${what} “${ph.p.w}” doesn’t fit here.`, at(ph)); } return null; };
  // 이에요 / 예요: 저는 학생이에요, 이것은 책이에요
  if (v.k === 'cop' && v.attach) {
    if (roles.wa.length > 1) return err('Say who or what with 은/는 only once.', at(roles.wa[1]));
    const o = only([], 'With 이에요 / 예요, say who or what with 은/는, then what it is.'); if (o) return o;
    const s = roles.wa[0], pc = C.pred.np.cat, sc = s ? s.np.cat : 'person';
    if (s && ['place'].includes(pc)) return err('That doesn’t make sense here. Try a person or a thing before 이에요 / 예요.', C.pred.np.start);
    if ((sc === 'person') !== (pc === 'person')) return err(sc === 'person' ? `That doesn’t make sense: a person isn’t a ${C.pred.np.n.en}. Try 학생, 선생님, 의사…` : `That doesn’t make sense: a ${s ? s.np.n.en : 'thing'} isn’t a person.`, C.pred.np.start);
    C.subj = s; C.roles = roles; return { ok: true, P: C };
  }
  // 아니에요: 저는 학생이 아니에요 (what it isn't takes 이/가)
  if (v.k === 'cop') {
    const last = C.phrases[C.phrases.length - 1];
    if (!last || !['이', '가'].includes(last.p.w)) return err('Before “아니에요”, what something isn’t takes 이/가: “학생이 아니에요”, “의사가 아니에요”.', i - 1);
    const o = only([], 'With 아니에요, say who with 은/는 and what they aren’t with 이/가.'); if (o) return o;
    const rest = roles.wa.filter(ph => ph !== last);
    if (rest.length > 1 || rest.some(ph => !topic(ph))) return err('Say who it is about with 은/는: “저는 학생이 아니에요”.', at(rest[rest.length - 1]));
    const s = rest[0], sc = s ? s.np.cat : 'person', pc = last.np.cat;
    if ((sc === 'person') !== (pc === 'person')) return err(sc === 'person' ? `That doesn’t make sense: a person isn’t a ${last.np.n.en} anyway.` : `That doesn’t make sense: a ${s.np.n.en} isn’t a person anyway.`, last.np.start);
    C.subj = s; C.pred = { np: last.np }; C.roles = roles; return { ok: true, P: C };
  }
  // 개가 커요, 저는 바빠요
  if (v.k === 'adj') {
    if (roles.wa.length > 1) return err('Say who or what you describe only once, with 은/는 or 이/가.', at(roles.wa[1]));
    const o = only([], `“${v.w}” describes who or what has 은/는 or 이/가.`); if (o) return o;
    const s = roles.wa[0], CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r', hear: 'r' };
    if (!v.e[2].includes(CAT[s ? s.np.cat : 'person'] || 't')) return err(`That doesn’t make sense: ${s ? `a ${s.np.n.en}` : 'you'} can’t really be “${v.e[1]}”. Try another describing word.`, s ? s.np.start : i - 1);
    C.subj = s; C.pred = { adj: v }; C.roles = roles; return { ok: true, P: C };
  }
  // 있어요 / 없어요: 공원에 개가 있어요, 저는 집에 있어요, 저는 개가 있어요 (I have a dog)
  if (v.type === 'exist') {
    if (!roles.wa.length) return err(`“${v.w}” needs who or what is there, with 이/가: “개가 ${v.w}”.`, i - 1);
    if (roles.wa.length > 2) return err('Too many 은/는 / 이/가 words here.', at(roles.wa[2]));
    if (roles.wa.length === 2) {
      const [own, thing] = roles.wa;
      if (!topic(own) || topic(thing)) return err(`For “have”, say who with 은/는 and what with 이/가: “저는 개가 ${v.w}”.`, at(topic(own) ? thing : own));
      if (own.np.cat !== 'person') return err(`For “have”, put a person first: “저는 개가 ${v.w}”.`, own.np.start);
      if (roles.ni.length) return err('Say either who has it or where it is, not both here.', at(roles.ni[0]));
    }
    if (roles.de.length) return err(`For where something is, use “에”, not “에서”: “${npKo(roles.de[0].np)}에 ${v.w}”.`, at(roles.de[0]));
    for (const ph of roles.ni) if (!['place', 'thing'].includes(ph.np.cat)) return err(`“에” here means where it is, so it needs a place or a thing (“공원에”, “책상에”). “${ph.np.n.w}” doesn’t fit.`, at(ph));
    if (roles.ni.length > 1) return err('Say where it is only once.', at(roles.ni[1]));
    if (roles.o.length || roles.to.length) return err(`“${v.w}” doesn’t take “${(roles.o[0] || roles.to[0]).p.w}”. Say where it is with 에: “방에 고양이가 있어요”.`, at(roles.o[0] || roles.to[0]));
    C.subj = roles.wa[roles.wa.length - 1]; C.owner = roles.wa.length === 2 ? roles.wa[0] : null; C.roles = roles; return { ok: true, P: C };
  }
  if (roles.wa.length > 1) return err('Use 은/는 or 이/가 for who does it only once.', at(roles.wa[1]));
  const subj = roles.wa[0];
  // does it make sense? things can't eat or run, and animals can't read or talk
  if (subj) {
    if (!animate(subj.np)) return err(`That doesn’t make sense: a ${subj.np.n.en} can’t ${v.e[4]}. Use a person or an animal with 은/는 or 이/가.`, subj.np.start);
    if (subj.np.cat === 'animal' && v.e[6] === 'p') return err(`That doesn’t make sense: a ${subj.np.n.en} can’t ${v.e[4]}. Only people ${v.e[4]}.`, subj.np.start);
  }
  if (C.deg && v.e[0] !== '좋아하다') return err(`“${C.deg.w}” goes right before a describing word.`, T.indexOf(C.deg));
  if (v.type === 'go') {
    if (roles.o.length) return err(`“${v.w}” doesn’t take “${roles.o[0].p.w}”. For where you go, use “에”: “${npKo(roles.o[0].np)}에 ${v.w}”.`, at(roles.o[0]));
    for (const ph of [...roles.ni, ...roles.de]) if (ph.np.cat !== 'place') return err(`“${ph.p.w}” + ${ph.p.w === '에' ? 'where you go' : 'where you come from'} needs a place: “학교${ph.p.w}”. “${ph.np.n.w}” isn’t a place.`, at(ph));
    if (roles.ni.length > 1) return err('Say where you go only once.', at(roles.ni[1]));
    if (roles.de.length > 1) return err('Say where you come from only once.', at(roles.de[1]));
    if (roles.de.length && !roles.ni.length && v.e[0] === '가다') return err(`For where you go, use “에”, not “에서” (에서 here means “from”): “${npKo(roles.de[0].np)}에 ${v.w}”.`, at(roles.de[0]));
    if (roles.de.length && roles.ni.length && roles.de[0].np.n.w === roles.ni[0].np.n.w) return err('You can’t go from a place to the same place.', at(roles.de[0]));
  } else {
    if (v.type === 'in' && roles.o.length) return err(`“${v.w}” (${v.e[4]}) doesn’t take “${roles.o[0].p.w}”. You can add a place with 에서: “공원에서 ${v.w}”.`, at(roles.o[0]));
    if (v.type === 'tr') {
      if (roles.o.length > 1) return err('Only one thing with 을/를 here.', at(roles.o[1]));
      const obj = roles.o[0], fitsCat = np => v.e[2][0] === '*' || v.e[2].includes(np.cat) || (v.e[2][0] === 'open' && KO_OPENABLE.includes(np.n.w));
      if (!obj) {
        const fits = [...roles.ni, ...roles.de].find(ph => fitsCat(ph.np));
        if (fits) { const w = fits.np.n.w, pw = koPick(w, '을', '를'); return err(`The thing you ${v.e[4]} takes 을/를: “${npKo(fits.np)}${pw} ${v.w}”.`, at(fits)); }
        if (v.e[3]) return err(`“${v.w}” needs what you ${v.e[4]}, with 을/를. For example “${{ food: '사과를', drink: '물을', read: '책을', thing: '우산을', animal: '개를', person: '친구를', open: '창문을', hear: '음악을', '*': '텔레비전을' }[v.e[2][0]]} ${v.w}”.`, i - 1);
      } else if (!fitsCat(obj.np)) return err(`That doesn’t make sense: you can’t ${v.e[4]} a ${obj.np.n.en}. “${v.w}” goes with ${v.e[2].map(c => KO_KIND[c]).join(', ')}.`, at(obj));
    }
    for (const ph of roles.ni) return err(ph.np.cat === 'place' ? `Where you do something takes “에서”, not “에”: “${npKo(ph.np)}에서 ${v.w}”.` : `“에” doesn’t fit with “${v.w}” here.`, at(ph));
    for (const ph of roles.de) if (ph.np.cat !== 'place') return err(`“에서” + the place where it happens: “공원에서”. “${ph.np.n.w}” isn’t a place.`, at(ph));
    if (roles.de.length > 1) return err('One place with 에서 is enough.', at(roles.de[1]));
  }
  for (const ph of roles.to) if (!animate(ph.np)) return err(`“하고” means together with someone: “친구하고”. “${ph.np.n.w}” isn’t a person or an animal.`, at(ph));
  if (roles.to.length > 1) return err('Say who with 하고 only once.', at(roles.to[1]));
  for (const ph of roles.to) if (subj && ph.np.n.w === subj.np.n.w) return err('You can’t do it with yourself: pick someone else for 하고.', at(ph));
  C.subj = subj; C.roles = roles;
  return { ok: true, P: C };
}

/* English meaning of a correct Korean sentence */
function koEnglish(C) {
  const POSS = { I: 'my', we: 'our', he: 'his', she: 'her', this: 'this' };
  const npEn = np => {
    const a = np.mods.map(m => m.en).join(' '), base = (a ? a + ' ' : '') + np.n.en, mine = /^my /.test(np.n.en);
    if (np.owner) { const o = np.owner.n; const who = o.my ? 'my' : o.w === '우리' && !np.owner.of ? 'our' : np.owner.det ? 'that' : o.k === 'pron' ? POSS[o.en] : npEn({ n: o, mods: np.owner.mods || [] }) + "'s"; return `${who} ${base.replace(/^my /, '')}`; }
    return np.n.k === 'pron' ? (np.n.my ? 'I' : base) : mine ? (a ? 'my ' + a + ' ' + np.n.en.slice(3) : base) : 'the ' + base;
  };
  const plainHome = np => !np.owner && !np.mods.length && np.n.w === '집';
  const v = C.verb, s = C.subj ? npEn(C.subj.np) : 'I', third = !!C.subj && !['I', 'you', 'we'].includes(s), also = C.subj?.p.w === '도' ? ' too' : '';
  const freq = C.freq.map(a => a.en).join(' '), when = C.time.map(a => a.en).join(' '), deg = C.deg ? C.deg.en + ' ' : '';
  const be = s === 'I' ? 'am' : s === 'we' ? 'are' : third ? 'is' : 'are';
  const MASS = /^(?:\w+ )*(bread|rice|meat|fish|kimchi|ramen|water|green tea|coffee|milk|juice|music)$/;
  const aOf = x => MASS.test(x) ? x : (/^[aeiou]/i.test(x) ? 'an ' : 'a ') + x;
  const plural = x => x.replace(/child$/, 'children').replace(/([^s])$/, '$1s');
  let out;
  if (v.k === 'cop') {
    const p = npEn(C.pred.np), what = p.startsWith('the ') ? (s === 'we' && C.pred.np.cat === 'person' ? plural(p.slice(4)) : aOf(p.slice(4))) : p;
    out = `${s === 'this' ? 'This' : s} ${s === 'this' ? 'is' : be}${v.neg ? ' not' : ''}${freq ? ' ' + freq : ''} ${what}`;
  } else if (v.k === 'adj') out = `${s} ${be}${freq ? ' ' + freq : ''} ${deg}${v.en}`;
  else if (v.type === 'exist') {
    const thingNp = C.subj.np, place = C.roles.ni[0], where = place ? (plainHome(place.np) ? ' at home' : (place.np.cat === 'thing' ? ' on ' : ' in ') + npEn(place.np)) : '';
    if (C.owner) { const h = npEn(C.owner.np), th = /^(I|we|you|they)$/.test(h) ? false : true, t = npEn(thingNp).replace(/^the /, ''), art = /^(my|our|his|her|that|this) /.test(t) || /'s /.test(t) ? t : aOf(t);
      out = v.neg ? `${h} ${th ? "doesn't" : "don't"} have ${art.replace(/^an? /, 'a ')}` : `${h} ${th ? 'has' : 'have'} ${art}`; }
    else if (animate(thingNp) && (thingNp.n.k === 'pron' || /^(my|our|his|her|that) /.test(npEn(thingNp)))) out = `${npEn(thingNp)} ${npEn(thingNp) === 'I' ? 'am' : npEn(thingNp) === 'we' ? 'are' : 'is'}${v.neg ? ' not' : ''}${where || ' here'}`;
    else { const t = npEn(thingNp); const bare = t.replace(/^the /, ''); out = v.neg ? `There is no ${bare}${where}` : `There ${MASS.test(bare) ? 'is some' : 'is'} ${/^(my|our|his|her|that|this) /.test(bare) || /'s /.test(bare) ? bare : aOf(bare)}${where}`; }
  } else {
    const r = C.roles, watch = v.e[0] === '보다' && r.o[0] && ['텔레비전'].includes(r.o[0].np.n.w);
    const base = watch ? 'watch' : v.e[4], s3 = watch ? 'watches' : v.e[5];
    out = v.neg ? `${s} ${third ? "doesn't" : "don't"}${freq ? ' ' + freq : ''} ${base}` : `${s} ${freq ? freq + ' ' : ''}${deg}${third ? s3 : base}`;
    if (r.o[0]) out += ' ' + npEn(r.o[0].np).replace(/^the (bread|rice|meat|fish|kimchi|cake|ramen|water|green tea|coffee|milk|juice|music)$/, '$1');
    for (const ph of r.ni) out += plainHome(ph.np) ? ' home' : ' to ' + npEn(ph.np);
    for (const ph of r.de) out += v.type === 'go' ? (plainHome(ph.np) ? ' from home' : ' from ' + npEn(ph.np)) : plainHome(ph.np) ? ' at home' : ' at ' + npEn(ph.np);
    for (const ph of r.to) out += ' with ' + npEn(ph.np);
  }
  out = (out + also + (when ? ' ' + when : '')).replace(/\s+/g, ' ').trim();
  return out[0].toUpperCase() + out.slice(1) + '.';
  function animate(np) { return ['person', 'animal'].includes(np.cat); }
}

/* ---------------- making a Korean tray ---------------- */
function koGenerate(pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = list => { const fav = list.filter(x => pref.has(x[0]) || pref.has(String(x[2] || ''))); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const nounOf = cats => RP(KO_NOUN.filter(n => cats[0] === '*' || cats.includes(n[1]) || (cats[0] === 'open' && KO_OPENABLE.includes(n[0]))));
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r', hear: 'r' };
  const extra = [];
  const np = (n, out, opts = {}) => {
    if (opts.owner && coin(0.2)) { if (coin(0.5)) out.push(koMy()); else { const o = R(KO_PRON.slice(2, 4)); out.push(koPron(o), koPart('의')); } }
    if (opts.adj !== false && coin(0.3)) { const a = RP(KO_ADJ.filter(x => x[2].includes(CAT[n[1]] || 'p'))); if (a) { out.push(koAdjC(a)); extra.push(koAdjC(a, true)); } }
    out.push(koNoun(n));
    return n[0];
  };
  const part = (w, which, out) => { const p = koPick(w, which[0], which[1]); out.push(koPart(p)); if (KO_PAIR[p]) extra.push(koPart(KO_PAIR[p])); };
  for (let tries = 0; tries < 150; tries++) {
    extra.length = 0;
    const out = [], kind = R(['tr', 'tr', 'tr', 'in', 'go', 'exist', 'cop', 'cop', 'adj']), neg = coin(0.2);
    const time = kind !== 'cop' && kind !== 'adj' && coin(0.3) ? koAdv(R(['오늘', '내일', '매일'])) : null;
    if (time && coin(0.5)) out.push(time);
    let verbChip, subjCat = 'person';
    const subject = (forceTopic) => {
      if (coin(0.5)) { const p = R(KO_PRON.slice(0, 4)); if (p[0] === '저' && !forceTopic && coin(0.3)) { out.push(koMy(), koPart('가')); extra.push(koPron(p)); return '저'; } out.push(koPron(p)); part(p[0], forceTopic || coin(0.7) ? ['은', '는'] : ['이', '가'], out); return p[0]; }
      const n = nounOf(['person', 'animal']); subjCat = n[1]; np(n, out, { adj: false, owner: true });
      if (coin(0.12)) { out.push(koPart('도')); extra.push(koPart(koPick(n[0], '은', '는'))); } else part(n[0], forceTopic || coin(0.6) ? ['은', '는'] : ['이', '가'], out);
      return n[0];
    };
    if (kind === 'exist') {
      if (coin(0.3)) {   // 저는 개가 있어요 (I have a dog)
        const p = R(KO_PRON.slice(0, 4)); out.push(koPron(p)); part(p[0], ['은', '는'], out);
        const thing = nounOf(['animal', 'thing', 'read', 'person']); np(thing, out, { adj: true }); part(thing[0], ['이', '가'], out);
      } else {
        const place = nounOf(['place']); np(place, out, { adj: false }); out.push(koPart('에')); extra.push(koPart('에서'));
        const thing = coin(0.5) ? nounOf(['person', 'animal']) : nounOf(['thing', 'food', 'read']); np(thing, out, { adj: true }); part(thing[0], ['이', '가'], out);
      }
      const v = KO_VERB.find(x => x[0] === '있다'); verbChip = koVerb(v, neg); extra.push(koVerb(v, !neg));
    } else if (kind === 'cop') {
      if (coin(0.25)) { out.push(koPron(KO_PRON[4])); out.push(koPart('은')); extra.push(koPart('는'));
        const n = nounOf(['thing', 'food', 'drink', 'read']); np(n, out, { adj: true, owner: true });
        if (neg) { part(n[0], ['이', '가'], out); verbChip = koCop('아니에요'); extra.push(koCop(koPick(n[0], '이에요', '예요'))); } else { verbChip = koCop(koPick(n[0], '이에요', '예요')); extra.push(koCop(KO_PAIR[verbChip.w]), koCop('아니에요')); }
      } else {
        const p = R(KO_PRON.slice(0, 4)); if (coin(0.85)) { out.push(koPron(p)); part(p[0], ['은', '는'], out); }
        const n = RP(KO_NOUN.filter(x => x[1] === 'person' && !/^my /.test(x[2]) && x[0] !== '친구')) || KO_NOUN[1];
        out.push(koNoun(n));
        if (neg) { part(n[0], ['이', '가'], out); verbChip = koCop('아니에요'); extra.push(koCop(koPick(n[0], '이에요', '예요'))); } else { verbChip = koCop(koPick(n[0], '이에요', '예요')); extra.push(koCop(KO_PAIR[verbChip.w])); }
      }
      if (out.length < 3 && !neg) continue;
    } else if (kind === 'adj') {
      let cat = 'person';
      if (coin(0.6)) { const n = nounOf(['*']); cat = n[1]; np(n, out, { adj: false, owner: true }); part(n[0], coin(0.5) ? ['은', '는'] : ['이', '가'], out); }
      else { const p = R(KO_PRON.slice(0, 4)); out.push(koPron(p)); part(p[0], ['은', '는'], out); }
      const a = RP(KO_ADJ.filter(x => x[2].includes(CAT[cat]))); if (!a) continue;
      if (coin(0.3)) out.push(koAdv(R(['아주', '정말'])));
      verbChip = koAdjC(a, true); extra.push(koAdjC(a));
    } else {
      if (coin(0.8)) subject();
      if (time && !out.includes(time)) out.push(time);
      const v = RP(KO_VERB.filter(x => x[1] === kind && (subjCat === 'person' || x[6] !== 'p')));
      if (kind === 'go') {
        if (coin(0.2) && v[0] === '오다') { const from = nounOf(['place']); np(from, out, { adj: false }); out.push(koPart('에서')); }
        const to = v[0] === '오다' && coin(0.5) ? null : nounOf(['place']);
        if (to) { np(to, out, { adj: false }); out.push(koPart('에')); extra.push(koPart('에서')); } else if (!out.some(c => c.w === '에서')) { const h = KO_NOUN.find(x => x[0] === '집'); np(h, out, { adj: false }); out.push(koPart('에')); }
        if (coin(0.25)) { const w = nounOf(['person']); np(w, out, { adj: false }); out.push(koPart('하고')); }
      } else {
        if (coin(0.35)) { np(nounOf(['place']), out, { adj: false }); out.push(koPart('에서')); extra.push(koPart('에')); }
        if (coin(0.15)) { np(nounOf(['person']), out, { adj: false }); out.push(koPart('하고')); }
        if (kind === 'tr') { const o = nounOf(v[2]); np(o, out, { owner: true }); part(o[0], ['을', '를'], out); }
      }
      if (coin(0.2)) out.push(koAdv(R(['항상', '자주'])));
      if (!neg && v[0] === '좋아하다' && coin(0.3)) out.push(koAdv('정말'));
      verbChip = koVerb(v, neg); extra.push(koVerb(v, !neg));
    }
    out.push(verbChip);
    if (out.length < 3 || out.length > 13) continue;
    const res = koCheck(out); if (!res.ok) continue;
    extra.push(koPart(R(['은', '는', '을', '를', '에', '에서', '이', '가'])), koNoun(nounOf(['*'])), koAdv(R(['오늘', '항상'])));
    const seen = new Set(out.map(w => w.k + w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && !seen.has(x.k + x.w)) { seen.add(x.k + x.w); uniq.push(x); }
    return { words: out, extra: uniq.slice(0, Math.max(4, 15 - out.length)), english: koEnglish(res.P) };
  }
  return null;
}

/* register: particles get their own word type and color (as in Japanese) */
if (!BLD_TYPES.part) BLD_TYPES.part = ['particle', 'marks what a word does: 은/는, 을/를, 에, 에서…'];
BLD_LANGS.ko = { name: 'Korean', check: koCheck, gen: koGenerate, voice: 'ko-KR', english: koEnglish, types: ['pron', 'noun', 'verb', 'adj', 'part', 'adv'], join: koJoin };
BLD_ORDER.ko = { rows: [
    ['A basic sentence', [['pron', 'who'], ['part', '은/는'], ['noun', 'what'], ['part', '을/를'], ['verb', 'verb']]],
    ['Going somewhere', [['pron', 'who'], ['part', '은/는'], ['noun', 'place'], ['part', '에'], ['verb', '가요 / 와요']]],
    ['Where you do something', [['pron', 'who'], ['part', '은/는'], ['noun', 'place'], ['part', '에서'], ['noun', 'what'], ['part', '을/를'], ['verb', 'verb']]],
    ['Saying what something is', [['noun', 'who / what'], ['part', '은/는'], ['noun', 'what it is'], ['verb', '이에요 / 예요']]],
    ['Describing something', [['noun', 'who / what'], ['part', '이/가'], ['adv', '(아주)'], ['adj', '커요']]],
    ['Something is there', [['noun', 'place'], ['part', '에'], ['noun', 'what'], ['part', '이/가'], ['verb', '있어요 / 없어요']]],
    ['Describing a noun', [['adj', 'describing word (큰)'], ['noun', 'noun']]],
  ], tips: [
    ['verb', 'The verb (or <b>이에요 / 예요</b>) always comes <b>last</b>. The parts before it can go in any order.'],
    ['part', 'Every noun gets a particle stuck on the end: <b>은/는</b> who (the topic), <b>이/가</b> who, <b>을/를</b> what, <b>에</b> where you go or where it is, <b>에서</b> where you do it, <b>하고</b> with whom, <b>의</b> ’s.'],
    ['part', 'After a consonant: <b>은, 이, 을, 이에요</b> (책은, 책이에요). After a vowel: <b>는, 가, 를, 예요</b> (사과는, 의사예요).'],
    ['pron', '저 + 가 becomes <b>제가</b>, and “my” is <b>제</b> (제 친구). You can leave out who does it when it’s clear (usually “I”).'],
    ['adj', 'Describing words have two forms: <b>큰</b> before a noun (큰 개), <b>커요</b> at the end (개가 커요). <b>아주</b> (very) goes right before them.'],
    ['verb', 'Negative: <b>안</b> before the verb (안 먹어요). 하다 verbs: <b>공부 안 해요</b>. <b>있어요 → 없어요</b>, and <b>이에요 → 이/가 아니에요</b>.'],
    ['adv', 'Time words like <b>오늘</b> and <b>내일</b> need no particle.'] ] };

/* ---------------- Your own Korean words (📚 Add my deck's words) ---------------- */
const KO_BASE = { n: KO_NOUN.length, a: KO_ADJ.length, v: KO_VERB.length };
const koKnown = w => KO_NOUN.slice(0, KO_BASE.n).some(n => n[0] === w) || KO_VERB.slice(0, KO_BASE.v).some(v => v[0] === w || koPolite(v[0]) === w)
  || KO_ADJ.slice(0, KO_BASE.a).some(a => a[0] === w || koAttr(a[0]) === w) || KO_PRON.some(p => p[0] === w) || !!KO_PART[w] || KO_ADV.some(a => a[0] === w);
function koApplyMine() {
  KO_NOUN.length = KO_BASE.n; KO_ADJ.length = KO_BASE.a; KO_VERB.length = KO_BASE.v;
  for (const m of S.bldWords || []) {
    if (!m || m.lang !== 'ko' || !m.w || !m.en || koKnown(m.w)) continue;
    if (m.k === 'noun' && /^[가-힣]+$/.test(m.w)) KO_NOUN.push([m.w, m.cat || 'thing', m.en]);
    if (m.k === 'verb' && /다$/.test(m.w) && Array.isArray(m.forms) && m.forms.length === 2) {
      const type = m.obj === 'in' ? 'in' : 'tr', objs = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read', 'hear'];
      KO_VERB.push([m.w, type, objs, 0, m.en, bld3sEn(m.en), m.who === 'a' ? 'a' : 'p', m.forms[0], m.forms[1]]);
    }
    if (m.k === 'adj' && /다$/.test(m.w)) KO_ADJ.push([m.w, m.en, 'patflr']);
  }
}
if (typeof bldApplyMine === 'function') { const prevKoApply = bldApplyMine; bldApplyMine = function () { prevKoApply(); koApplyMine(); }; }
BLD_MINE.ko = { name: 'Korean', forms: 'polite form, negative (먹어요, 안 먹어요)', nForms: 2, noGender: true, conj: w => { const p = koPolite(w); return p ? [p, koNeg(w, p)] : []; }, pl: w => w,
  adj: w => [koAttr(w), koPolite(w) || w], known: w => koKnown(w), gender: () => 'm', isVerb: w => /[가-힣]다$/.test(w), refl: () => false,
  // 개 (dog), 먹다: the word as the card writes it, without notes in brackets
  parse: s => { const w = String(s || '').replace(/[（(][^）)]*[）)]/g, '').replace(/\s+/g, ' ').trim(); return /^[가-힣]+$/.test(w) ? { w } : null; },
  intro: 'words ending in -다 are verbs or describing words). The polite form (-아요 / -어요) and the negative are filled in for you, including 하다 verbs; check any that look wrong.' };
// Korean words can be one syllable (개, 책, 집), and describing words end in -다 like verbs: 크다 = big
if (typeof bldCandidates === 'function') {
  const prevKoCands = bldCandidates;
  bldCandidates = function (deckId) {
    const d = deckById(deckId), sides = bldSides(d);
    if (!sides || sides[2] !== 'ko') return prevKoCands(deckId);
    const out = [], seen = new Set(), L = BLD_MINE.ko;
    for (const c of cardsOf(deckId)) {
      const ko = bldClean(c[sides[0]]).replace(/[!?.,;:]/g, '').trim();
      const enRaw = bldClean(c[sides[1]]).toLowerCase().split(/[,;/]| or /)[0].replace(/[!?.]/g, '').trim();
      const toVerb = /^to\s/.test(enRaw), en = enRaw.replace(/^(to|the|a|an|some)\s+/, '').trim();
      if (!en || !/^[a-z][a-z' -]*$/.test(en) || en.split(' ').length > (toVerb ? 4 : 2)) continue;
      const m = L.parse(ko), w = m?.w;
      if (!w || seen.has(w) || L.known(w)) continue;
      seen.add(w);
      const lab = BLD_FROM_LABEL[bldLabelOf(c, sides[0], d)] || '', isVerb = L.isVerb(w);
      let k = lab && (lab === 'noun' || isVerb) ? lab : isVerb ? (toVerb ? 'verb' : 'adj') : 'noun';
      out.push({ w, en, k, g: 'm', verbOK: isVerb, fromLabel: !!lab && k === lab, lang: 'ko', read: null });
    }
    return out;
  };
}
