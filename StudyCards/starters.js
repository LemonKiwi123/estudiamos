'use strict';
/* ================= Starter decks =================
   Ready-made beginner decks you can add from the New deck window, so every language the games and the Sentence Builder
   know can be tried right away. (The Spanish one is the sample deck every new profile already gets.) */
const STARTERS = {
  ja: { name: 'Japanese basics (sample)', flag: '🇯🇵', label: 'Japanese', frontLang: 'ja-JP', backLang: 'en-US', cards: [
    ['こんにちは', 'hello', 'konnichiwa'], ['おはよう', 'good morning', 'ohayou'], ['ありがとう', 'thank you', 'arigatou'], ['さようなら', 'goodbye', 'sayounara'], ['すみません', 'excuse me', 'sumimasen'],
    ['はい', 'yes', 'hai'], ['いいえ', 'no', 'iie'], ['わたし', 'I', 'watashi · 私'], ['ともだち', 'friend', 'tomodachi · 友達'], ['せんせい', 'teacher', 'sensei · 先生'],
    ['いぬ', 'dog', 'inu · 犬'], ['ねこ', 'cat', 'neko · 猫'], ['みず', 'water', 'mizu · 水'], ['おちゃ', 'tea', 'ocha · お茶'], ['ごはん', 'rice', 'gohan · ご飯 (also: a meal)'],
    ['パン', 'bread', 'pan'], ['りんご', 'apple', 'ringo'], ['ほん', 'book', 'hon · 本'], ['いえ', 'house', 'ie · 家'], ['がっこう', 'school', 'gakkou · 学校'],
    ['えき', 'station', 'eki · 駅'], ['くるま', 'car', 'kuruma · 車'], ['たべる', 'to eat', 'taberu · 食べる (polite: たべます)'], ['のむ', 'to drink', 'nomu · 飲む (polite: のみます)'],
    ['いく', 'to go', 'iku · 行く (polite: いきます)'], ['みる', 'to see', 'miru · 見る (polite: みます)'], ['よむ', 'to read', 'yomu · 読む (polite: よみます)'], ['かく', 'to write', 'kaku · 書く (polite: かきます)'],
    ['ねる', 'to sleep', 'neru · 寝る (polite: ねます)'], ['はなす', 'to speak', 'hanasu · 話す (polite: はなします)'], ['おおきい', 'big', 'ookii · 大きい (い-adjective)'], ['ちいさい', 'small', 'chiisai · 小さい (い-adjective)'],
    ['あたらしい', 'new', 'atarashii · 新しい (い-adjective)'], ['おいしい', 'delicious', 'oishii · 美味しい (い-adjective)'], ['しずか', 'quiet', 'shizuka · 静か (な-adjective)'], ['きれい', 'pretty', 'kirei · 綺麗 (な-adjective)'],
    ['きょう', 'today', 'kyou · 今日'], ['あした', 'tomorrow', 'ashita · 明日'], ['いち', 'one', 'ichi · 一'], ['に', 'two', 'ni · 二'], ['さん', 'three', 'san · 三']] },
  fr: { name: 'French basics (sample)', flag: '🇫🇷', label: 'French', frontLang: 'fr-FR', backLang: 'en-US', cards: [
    ['bonjour', 'hello'], ['merci', 'thank you'], ["s'il vous plaît", 'please'], ['au revoir', 'goodbye'], ['oui', 'yes'], ['non', 'no'],
    ['le chien', 'the dog'], ['le chat', 'the cat'], ['la maison', 'the house'], ["l'eau", 'the water', 'Feminine: l’eau froide'], ['le pain', 'the bread'], ['la pomme', 'the apple'],
    ['le livre', 'the book'], ["l'école", 'the school', 'Feminine'], ["l'ami", 'the friend', 'Masculine (a female friend: l’amie)'], ['manger', 'to eat'], ['boire', 'to drink'], ['parler', 'to speak'],
    ['aller', 'to go'], ['voir', 'to see'], ['lire', 'to read'], ['grand', 'big'], ['petit', 'small'], ['bon', 'good'], ['nouveau', 'new'],
    ["aujourd'hui", 'today'], ['demain', 'tomorrow'], ['Où sont les toilettes ?', 'Where is the bathroom?']] },
};
function startersHtml() {
  const have = new Set(S.decks.map(d => d.name));
  const btns = Object.entries(STARTERS).map(([k, s]) => `<button type="button" class="btn sm" data-act="addStarter" data-k="${k}" ${have.has(s.name) ? 'disabled title="Already in your decks"' : ''}>${s.flag} ${esc(s.label)} basics</button>`).join('');
  return `<div class="starter-row"><span class="muted small">Or start with a ready-made deck:</span>${btns}</div>`;
}
function addStarter(k) {
  const s = STARTERS[k]; if (!s) return;
  if (S.decks.some(d => d.name === s.name)) return toast(`“${s.name}” is already in your decks`);
  const d = { id: uid(), name: s.name, frontLang: s.frontLang, backLang: s.backLang, newPerDay: 20, direction: 'front', created: Date.now() };
  S.decks.push(d);
  for (const [f, b, n] of s.cards) S.cards.push(newCard(d.id, f, b, n || ''));
  save(); $('#dlg')?.close();
  toast(`${s.flag} Added “${s.name}” with ${s.cards.length} cards`);
  go({ name: 'deck', deckId: d.id });
}
Object.assign(actions, { addStarter: el => addStarter(el.dataset.k) });
