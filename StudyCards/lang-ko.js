'use strict';
/* ================= Korean: Numbers & ABC, Say it!, the starter deck and auto-translate =================
   • 🔢 Numbers & ABC: Sino-Korean numbers (일, 이, 삼… 이십삼, 삼백) and native Korean numbers (하나, 둘, 셋… 스물셋),
     and the Hangul letters with their names (ㄱ 기역, ㅏ 아). Spelling a number goes letter by letter: 삼 → ㅅ ㅏ ㅁ.
   • 🎙️ Say it!: spaces don't matter, a particle or 요 on the end doesn't matter (개요 / 개는 for 개), and a verb card
     (먹다) also counts when you say its polite form (먹어요).
   • A Korean basics deck for the New deck window, and Korean in 🌐 Auto-translate (the Sentence Builder's words and the
     real sentences in data/real-ko.json). Loaded after builder-ko.js and rstag-ko.js. */

/* ---------- 🔢 Numbers & ABC ---------- */
if (typeof NG_LANGS !== 'undefined') {
  NG_LANGS.ko = { name: 'Korean (일, 이, 삼)', flag: '🇰🇷', tts: 'ko-KR', kana: true };
  NG_LANGS['ko-n'] = { name: 'Korean (하나, 둘, 셋)', flag: '🇰🇷', tts: 'ko-KR', kana: true };
  const SINO = ['영', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  // Sino-Korean, written together: 십 (10), 십일 (11), 이십삼 (23), 백 (100), 삼백사십오 (345), 천 (1000)
  NG_WORDS.ko = n => {
    if (n === 0) return '영'; if (n === 1000) return '천';
    const h = Math.floor(n / 100), t = Math.floor(n % 100 / 10), u = n % 10;
    return (h ? (h > 1 ? SINO[h] : '') + '백' : '') + (t ? (t > 1 ? SINO[t] : '') + '십' : '') + (u ? SINO[u] : '');
  };
  const NAT1 = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉'], NAT10 = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
  // native Korean, for counting things: 하나, 열둘, 스물셋, 아흔아홉. Above 99 Koreans say the hundreds the Sino-Korean way: 백스물셋 (123)
  NG_WORDS['ko-n'] = n => {
    if (n === 0) return '영'; if (n === 1000) return '천';
    const h = Math.floor(n / 100), r = n % 100;
    return (h ? (h > 1 ? SINO[h] : '') + '백' : '') + NAT10[Math.floor(r / 10)] + NAT1[r % 10];
  };
  NG_ABC.ko = 'ㄱ:기역 · giyeok ㄴ:니은 · nieun ㄷ:디귿 · digeut ㄹ:리을 · rieul ㅁ:미음 · mieum ㅂ:비읍 · bieup ㅅ:시옷 · siot ㅇ:이응 · ieung ㅈ:지읒 · jieut ㅊ:치읓 · chieut ㅋ:키읔 · kieuk ㅌ:티읕 · tieut ㅍ:피읖 · pieup ㅎ:히읗 · hieut '
    + 'ㄲ:쌍기역 · ssanggiyeok ㄸ:쌍디귿 · ssangdigeut ㅃ:쌍비읍 · ssangbieup ㅆ:쌍시옷 · ssangsiot ㅉ:쌍지읒 · ssangjieut '
    + 'ㅏ:아 · a ㅑ:야 · ya ㅓ:어 · eo ㅕ:여 · yeo ㅗ:오 · o ㅛ:요 · yo ㅜ:우 · u ㅠ:유 · yu ㅡ:으 · eu ㅣ:이 · i ㅐ:애 · ae ㅒ:얘 · yae ㅔ:에 · e ㅖ:예 · ye ㅘ:와 · wa ㅙ:왜 · wae ㅚ:외 · oe ㅝ:워 · wo ㅞ:웨 · we ㅟ:위 · wi ㅢ:의 · ui';
  NG_ABC['ko-n'] = NG_ABC.ko;
  // a Hangul letter's name, for the voice (ㄱ → 기역)
  const KO_JAMO_NAME = new Map(NG_ABC.ko.split(/ (?=\S:)/).map(p => [p.split(':')[0], p.split(':')[1].split(' · ')[0]]));
  const KO_FINAL_SPLIT = { 'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ', 'ㄼ': 'ㄹㅂ', 'ㄽ': 'ㄹㅅ', 'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ', 'ㅄ': 'ㅂㅅ' };
  const koLetters = w => [...String(w)].flatMap(ch => { const x = koSplit(ch); if (!x) return /\s/.test(ch) ? [] : [ch]; const t = KO_T[x.T].trim(); return [KO_L[x.L], KO_V[x.V], ...(t ? [...(KO_FINAL_SPLIT[t] || t)] : [])]; });
  const isKo = () => /^ko/.test(ng?.lang || '');
  const prevQ = ngQuestion;
  ngQuestion = function () {
    prevQ();
    if (!isKo() || !ng.q) return;
    const q = ng.q;
    if (ng.mode === 'abcHear' || ng.mode === 'abcName') q.say = KO_JAMO_NAME.get(q.letter) || q.say;   // the voice says 기역, not a lone ㄱ
    if (ng.mode === 'abcSpell') { q.spell = koLetters(q.answer); q.say = q.spell.map(l => KO_JAMO_NAME.get(l) || l).join(', '); }
  };
  // the cheat sheet's letter boxes speak the letter itself: say its name instead
  if (typeof speak === 'function') { const prevSpeak = speak; speak = function (text, lang, rateMul) { if (/^ko/i.test(String(lang || '')) && KO_JAMO_NAME.has(String(text).trim())) text = KO_JAMO_NAME.get(String(text).trim()); return prevSpeak(text, lang, rateMul); }; }
}

/* ---------- 🎙️ Say it! ---------- */
if (typeof skNorm === 'function') {
  const KO_SK_TAIL = /(은|는|이|가|을|를|도|요|에|에서)$/;
  const koSkNorm = t => String(t || '').normalize('NFC').replace(/[.,!?~…"“”'’()\[\]{}·]/g, ' ').replace(/\s+/g, '').trim();
  const prevNorm = skNorm; skNorm = function (text, lang) { return lang === 'ko' ? koSkNorm(text) : prevNorm(text, lang); };
  const prevMatch = skMatch;
  skMatch = function (heard, card, lang) {
    if (lang !== 'ko') return prevMatch(heard, card, lang);
    const base = skAnswers(card, lang), answers = new Set(base);
    for (const a of base) if (/다$/.test(a) && a.length > 1) { const p = typeof koPolite === 'function' ? koPolite(a) : null; if (p) { answers.add(p); answers.add(p.replace(/요$/, '')); } }   // 먹다 → 먹어요, 먹어
    const NFD = s => s.normalize('NFD');
    let best = { ok: false, close: false, heard: heard[0] || '' };
    for (const h of heard) {
      const said = koSkNorm(h); if (!said) continue;
      const bare = said.length > 1 ? said.replace(KO_SK_TAIL, '') : said;
      for (const a of answers) {
        if (said === a || bare === a || (a.length >= 2 && said.includes(a))) return { ok: true, close: false, heard: h };
        const A = NFD(a), slip = Math.max(1, Math.floor(A.length / 6));   // small slips, counted in letters (ㄱ ㅏ ㅁ), not syllables
        if (a.length >= 2 && (skLev(NFD(said), A) <= slip || skLev(NFD(bare), A) <= slip) && !best.ok) best = { ok: true, close: true, heard: h };
      }
    }
    return best;
  };
}

/* ---------- the starter deck ---------- */
if (typeof STARTERS !== 'undefined') STARTERS.ko = { name: 'Korean basics (sample)', flag: '🇰🇷', label: 'Korean', frontLang: 'ko-KR', backLang: 'en-US', cards: [
  ['안녕하세요', 'hello', 'annyeonghaseyo'], ['감사합니다', 'thank you', 'gamsahamnida'], ['안녕히 가세요', 'goodbye (to someone leaving)', 'annyeonghi gaseyo'], ['네', 'yes', 'ne'], ['아니요', 'no', 'aniyo'],
  ['죄송합니다', 'I’m sorry', 'joesonghamnida'], ['저', 'I', 'jeo (polite) · 저는 = I (topic)'], ['친구', 'friend', 'chingu'], ['선생님', 'teacher', 'seonsaengnim'], ['학생', 'student', 'haksaeng'],
  ['개', 'dog', 'gae'], ['고양이', 'cat', 'goyangi'], ['물', 'water', 'mul'], ['커피', 'coffee', 'keopi'], ['밥', 'rice', 'bap (also: a meal)'], ['빵', 'bread', 'ppang'], ['사과', 'apple', 'sagwa'],
  ['책', 'book', 'chaek'], ['집', 'house', 'jip (also: home)'], ['학교', 'school', 'hakgyo'], ['역', 'station', 'yeok'], ['차', 'car', 'cha (also: tea)'],
  ['먹다', 'to eat', 'meokda · polite: 먹어요'], ['마시다', 'to drink', 'masida · polite: 마셔요'], ['가다', 'to go', 'gada · polite: 가요'], ['보다', 'to see', 'boda · polite: 봐요'],
  ['읽다', 'to read', 'ikda · polite: 읽어요'], ['하다', 'to do', 'hada · polite: 해요'], ['크다', 'big', 'keuda · before a noun: 큰'], ['작다', 'small', 'jakda · before a noun: 작은'],
  ['오늘', 'today', 'oneul'], ['내일', 'tomorrow', 'naeil'], ['화장실이 어디예요?', 'Where is the bathroom?', 'hwajangsiri eodiyeyo?']] };

/* ---------- 🌐 Auto-translate ---------- */
// the Korean sentences help pick between meanings; Korean words carry particles (학교에), so each sentence also lists its
// words with the particle taken off, and a search for 학교 finds 학교에 too
if (typeof txCorpus === 'function') {
  const prevCorpus = txCorpus;
  txCorpus = async function (lang) {
    if (lang !== 'ko') return prevCorpus(lang);
    return (txCorpusCache.ko ||= fetch('data/real-ko.json').then(r => r.ok ? r.json() : null).then(j => (j?.items || []).map(it => {
      const src = String(it[1] || ''), roots = src.split(/\s+/).map(w => { w = w.replace(/[.,!?]/g, ''); const sp = typeof rsKoSplit === 'function' ? rsKoSplit(w) : null; const f = typeof RS_KO_FORMS !== 'undefined' ? RS_KO_FORMS.get(w) : null; return f ? f[2] : sp ? sp[0] : ''; }).filter(Boolean);
      return { src: (src + ' ' + roots.join(' ')).toLowerCase(), en: String(it[2] || '').toLowerCase() }; })).catch(() => null));
  };
}
// the Sentence Builder's Korean words and the real-sentence word list as "built-in words"
if (typeof txAppIndex === 'function') {
  const prevIndex = txAppIndex;
  txAppIndex = function (lang) {
    if (lang !== 'ko' || txAppCache.ko?.korean) return prevIndex(lang);
    const idx = prevIndex('ko'), fwd = idx.fwd;
    const add = (w, en) => { w = String(w || '').trim(); if (!w || !en) return; for (const g of String(en).split(/\s*\/\s*/)) { const t = g.trim(); if (!t) continue; if (!fwd.has(w)) fwd.set(w, []); if (!fwd.get(w).includes(t)) fwd.get(w).push(t); } };
    if (typeof KO_NOUN !== 'undefined') {
      for (const n of KO_NOUN) add(n[0], n[2].replace(/^my /, ''));
      for (const a of KO_ADJ) { add(a[0], a[1]); add(koAttr(a[0]), a[1]); }
      for (const v of KO_VERB) if (v[1] !== 'exist') { add(v[0], 'to ' + v[4]); add(koPolite(v[0]), v[4]); }
      for (const a of KO_ADV) add(a[0], a[1]);
      for (const p of KO_PRON) add(p[0], p[1]);
    }
    if (typeof RS_KO_WORDS !== 'undefined') for (const line of RS_KO_WORDS.split('\n')) { const [w, t, g] = line.split('|'); if (w && g) add(w, t === 'verb' ? g.split(' / ').map(x => 'to ' + x).join(' / ') : g); }
    for (const [f, b] of STARTERS.ko?.cards || []) add(f, b);
    const back = new Map(); for (const [w, list] of fwd) for (const t of list) { const k = txKey(t); if (!k) continue; if (!back.has(k)) back.set(k, []); if (!back.get(k).includes(w)) back.get(k).push(w); }
    return (txAppCache.ko = { fwd, back, korean: true });
  };
}
