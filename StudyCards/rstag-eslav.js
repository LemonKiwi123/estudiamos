'use strict';
/* ================= Sentence Builder · 📖 Real sentences: Russian and Ukrainian word types and meanings =================
   One file for both: each language's closed word lists, every form of the Sentence Builder's words (ESV), the word
   lists in rsdict-eslav.js and a few safe rules (-ться / -тися are verbs, -ость / -ість and -ание / -ання nouns,
   -ский / -ський describing words). его / её / их (його / її / їх) are "his / her / their" before a noun and
   "him / her / them" otherwise. A word that can't be tagged with confidence gets no label.
   Loaded after rstag.js, rsdict-eslav.js and the builder-eslav.js files. */
RS_LANGS.ru = 'Russian'; RS_LANGS.uk = 'Ukrainian';
const RS_ESV = new Set(['ru', 'uk']);
const rsEsvClean = w => String(w || '').toLowerCase().replace(/[́̀]/g, '').replace(/[’ʼ`]/g, "'");
RS_CLOSED.ru = { art: new Set(), clArt: new Set(), clitic: new Set(), flex: RS_W('его её ее их'),
  pron: RS_W('я меня мне мной ты тебя тебе тобой он него нему ним нём она неё нее ней оно мы нас нам нами вы вас вам вами они них ними им ей ему это то что кто ничего никто ничто себя себе собой всё все всем всех всего сам сама сами кого кому чем чём кем'),
  det: RS_W('мой моя моё мое мои моего моей моему моим моих моими мою твой твоя твоё твое твои твоего твоей твоему твоим твоих твою наш наша наше наши нашего нашей нашему нашим наших нашу ваш ваша ваше ваши вашего вашей вашему вашим ваших вашу свой своя своё свое свои своего своей своему своим своих свою этот эта эти этого этой этому этим этих эту тот та те того той тех ту каждый каждая каждое каждого какой какая какое какие какого каком каким какую каких который которая которое которые которого которой котором которым которую которых весь вся один одна одно два две три четыре пять шесть семь восемь девять десять сто много несколько'),
  prep: RS_W('в во на к ко с со у из о об обо без для от до по за под над перед при через между около после про из-за'),
  conj: RS_W('и а но или что чтобы потому если когда как хотя пока либо ни да'),
  adv: RS_W('не ни нет да очень уже ещё еще тоже также только всегда никогда иногда часто редко сегодня завтра вчера сейчас теперь потом тогда здесь тут там туда сюда где куда откуда когда почему зачем как сколько так дома домой хорошо плохо быстро медленно много мало немного вместе наверное конечно очень опять снова сразу скоро рано поздно утром вечером днём ночью давно вообще почти совсем слишком лучше больше меньше'),
  verb: RS_W('есть был была было были быть будет будут буду будешь будем будете могу может можешь можем можете могут мог могла могли хочу хочет хочешь хотим хотите хотят хотел хотела хотели знаю знает знаешь знаем знаете знают знал знала надо нужно нельзя можно люблю любит любишь пошёл пошел пошла сказал сказала сказали думаю думает') };
RS_CLOSED.uk = { art: new Set(), clArt: new Set(), clitic: new Set(), flex: RS_W('його її їх'),
  pron: RS_W("я мене мені мною ти тебе тобі тобою він нього ньому ним вона неї ній нею воно ми нас нам нами ви вас вам вами вони них ними їм їй йому це те що хто ніщо ніхто нічого себе собі собою все всі всім всіх всього сам сама самі кого кому чим ким"),
  det: RS_W("мій моя моє мої мого моєї моєму моїм моїх моїми мою твій твоя твоє твої твого твоєї твоєму твоїм твоїх твою наш наша наше наші нашого нашої нашому нашим наших нашу ваш ваша ваше ваші вашого вашої вашому вашим ваших вашу свій своя своє свої свого своєї своєму своїм своїх свою їхній їхня їхнє їхні цей ця ці цього цієї цьому цим цих цю той та ті того тієї тому тих ту кожен кожна кожне кожного який яка яке які якого якої якому якій яким яку яких котрий один одна одне два дві три чотири п'ять шість сім вісім дев'ять десять сто багато кілька декілька"),
  prep: RS_W('в у на до з із зі про без для від по за під над перед при через між біля після'),
  conj: RS_W('і й та а але або чи що щоб бо тому якщо коли як хоча поки ні'),
  adv: RS_W("не ні так дуже вже ще теж також тільки лише завжди ніколи іноді часто рідко сьогодні завтра вчора зараз тепер потім тоді тут там туди сюди де куди звідки коли чому навіщо як скільки так вдома додому добре погано швидко повільно багато мало трохи разом мабуть звичайно знову одразу скоро рано пізно вранці увечері вдень вночі давно взагалі майже зовсім занадто краще більше менше"),
  verb: RS_W("є був була було були бути буде будуть буду будеш будемо будете можу може можеш можемо можете можуть міг могла могли хочу хоче хочеш хочемо хочете хочуть хотів хотіла хотіли знаю знає знаєш знаємо знаєте знають знав знала треба потрібно можна мушу маю має маєш мають любить люблю сказав сказала думаю думає немає") };
// every form of the builder's words, with its English
const RS_ESV_LEX = {};
function rsEsvLex(lang) {
  if (RS_ESV_LEX[lang]) return RS_ESV_LEX[lang];
  const m = new Map(), L = typeof ESV !== 'undefined' ? ESV[lang] : null;
  if (L && L.N) for (const [w, g, t] of esvWordList(L)) { const k = rsEsvClean(w); if (!m.has(k)) m.set(k, [t, g]); else if (m.get(k)[0] !== t) m.set(k, [null, m.get(k)[1] + ' / ' + g]); }
  if (lang === 'ru') for (const [k, v] of [...m]) { const e = k.replace(/ё/g, 'е'); if (!m.has(e)) m.set(e, v); }   // written without ё
  return (RS_ESV_LEX[lang] = m);
}
const RS_ESV_NOT_VERB = { ru: RS_W('путь суть муть жуть ртуть мать'), uk: RS_W('діти мати брати світи') };
function rsEsvTag(w, i, low, lang) {
  const lex = rsEsvLex(lang);
  if (lex.has(w)) return lex.get(w)[0];   // null when the builder has it as two kinds of word (дома: house / at home)
  // a past-tense verb right after who does it: я сделал, она пришла, вони прийшли
  const SUBJ = lang === 'ru' ? /^(я|ты|он|она|оно|мы|вы|они|кто|никто)$/ : /^(я|ти|він|вона|воно|ми|ви|вони|хто|ніхто)$/;
  if (SUBJ.test(low[i - 1] || '') && (lang === 'ru' ? /[^аеёиоуыэюя](л|ла|ло|ли)$|[аеиоуяы](л|ла|ло|ли)$/ : /(в|ла|ло|ли)$/).test(w) && w.length > 3) return 'verb';
  if (lang === 'ru') {
    if (/(ться|тся|ешься|ется|ются|ишься|ится|ятся|атся)$/.test(w) && w.length > 4) return 'verb';
    if (/[аеиоуяю]ть$/.test(w) && w.length > 3 && !RS_ESV_NOT_VERB.ru.has(w)) return 'verb';
    if (/(ость|ание|ение|ания|ения|анию|ению|анием|ением)$/.test(w) && w.length > 5) return 'noun';
    if (/ск(ий|ая|ое|ие|ого|ой|ому|им|их|ую)$/.test(w) && w.length > 5) return 'adj';
  } else {
    if (/(тися|тись|ється|еться|ються|уться|иться|яться|аться)$/.test(w) && w.length > 4) return 'verb';
    if (/[аиіяу]ти$/.test(w) && w.length > 4 && !RS_ESV_NOT_VERB.uk.has(w)) return 'verb';
    if (/(ість|ання|ення|анням|енням|анні|енні)$/.test(w) && w.length > 5) return 'noun';
    if (/ськ(ий|а|е|і|ого|ої|ому|им|их|у)$/.test(w) && w.length > 5) return 'adj';
  }
  return null;
}
{ const prev = rsTagWord; rsTagWord = function (w, i, low, lang) { if (!RS_ESV.has(lang)) return prev(w, i, low, lang); w = rsEsvClean(w);
  const t = prev(w, i, low, lang); if (t != null || RS_CLOSED[lang].flex.has(w)) return t; return rsEsvTag(w, i, low, lang); }; }
{ const prev = rsTagSentence; rsTagSentence = function (words, lang) {
  const out = prev(words, lang); if (!RS_ESV.has(lang)) return out;
  const low = words.map(w => rsEsvClean(w).replace(/[.,!?;:«»"“”()—–-]/g, ''));
  for (let i = 0; i < words.length; i++) {
    // его / її before a noun or a describing word: "his / her"; otherwise "him / her"
    if (RS_CLOSED[lang].flex.has(low[i])) out[i] = /^(noun|adj)$/.test(out[i + 1] || '') ? 'det' : 'pron';
    // a name: a capitalized word in the middle that no list knows
    if (out[i] == null && i > 0 && /^[А-ЯЁЄІЇҐ]/.test(words[i])) out[i] = 'noun';
  }
  return out;
}; }
/* meanings under the words */
RS_GLOSS_COMMON.ru = 'это:this / it|что:what / that|кто:who|не:not|нет:no / there is no|да:yes|и:and|а:and / but|но:but|или:or|в:in / to|на:on / at / to|с:with|у:at / has|из:from|о:about|к:to|по:along / by|за:behind / for|от:from|до:until / to|для:for|без:without|был:was|была:was|было:was|были:were|есть:there is / to eat|будет:will be|могу:I can|может:can / maybe|хочу:I want|знаю:I know|надо:must / need|нужно:need|можно:may / can|нельзя:must not|очень:very|уже:already|ещё:still / more|еще:still / more|тоже:too|только:only|где:where|как:how / like|почему:why|когда:when|сколько:how many|так:so|его:his / him|её:her|ее:her|их:their / them|свой:one’s own|себя:oneself|всё:everything|все:all / everyone|мне:me / to me|меня:me';
RS_GLOSS_COMMON.uk = "це:this / it|що:what / that|хто:who|не:not|ні:no|так:yes / so|і:and|й:and|та:and|а:and / but|але:but|або:or|чи:or / whether|в:in / to|у:in / at|на:on / at / to|з:with / from|із:with / from|зі:with / from|до:to|про:about|по:along / by|за:behind / for|від:from|для:for|без:without|був:was|була:was|було:was|були:were|є:there is / is|буде:will be|можу:I can|може:can / maybe|хочу:I want|знаю:I know|треба:must / need|можна:may / can|немає:there is no|дуже:very|вже:already|ще:still / more|теж:too|також:also|тільки:only|лише:only|де:where|як:how / like|чому:why|коли:when|скільки:how many|його:his / him|її:her|їх:their / them|свій:one’s own|себе:oneself|все:everything|всі:everyone|мені:me / to me|мене:me";
{ const prev = rsGlossMap; rsGlossMap = function (lang) {
  const m = prev(lang); if (!RS_ESV.has(lang) || m._esv) return m; m._esv = true;
  for (const [w, [, g]] of rsEsvLex(lang)) if (g && !m.has(w)) m.set(w, g);
  return m;
}; }
{ const prev = rsGloss; rsGloss = function (word, lang) {
  if (!RS_ESV.has(lang)) return prev(word, lang);
  const w = rsEsvClean(word).replace(/[.,!?;:«»"“”()—–]/g, '');
  return prev(w, lang) || (lang === 'ru' ? prev(w.replace(/ё/g, 'е'), lang) : '') || '';
}; }
