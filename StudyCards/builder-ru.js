'use strict';
/* Sentence Builder: Russian words (the rules are in builder-eslav.js). Every built-in noun has all twelve forms written
   out (one / many × six cases), so the fleeting vowels (подарок → подарка, девочка → девочек) and the special forms
   (в лесу, братья, друзья) are right; verbs have their six present forms and their perfective partner.
   ё is written where it belongs; typed answers accept е for ё. Loaded after builder-eslav.js. */
function ruAdjTable(m) {
  m = esvStrip(m);
  const stressed = /ой$/.test(m), st = /(ый|ий|ой)$/.test(m) ? m.slice(0, -2) : m, c = st.slice(-1);
  const velar = /[гкх]/.test(c), sib = /[жшчщц]/.test(c), soft = /ий$/.test(m) && !velar && !sib;
  const y = velar || sib || soft ? 'и' : 'ы', o = !stressed && (sib || soft) ? 'е' : 'о', a = soft ? 'я' : 'а', u = soft ? 'ю' : 'у';
  return esvTab(`${st}${stressed ? 'ой' : y + 'й'} ${st}${o}го ${st}${o}му ${st}${y}м ${st}${o}м`, `${st}${a}я ${st}${o}й ${st}${o}й ${st}${u}ю ${st}${o}й ${st}${o}й`, `${st}${o}е`,
    `${st}${y}е ${st}${y}х ${st}${y}м ${st}${y}ми ${st}${y}х`);
}
// the present tense of a verb that isn't in the lists: a best guess from the infinitive (check irregular ones)
function ruConjugate(w) {
  const six = (a, st, e) => [a, st + e[0], st + e[1], st + e[2], st + e[3], st + e[4]];
  if (/[ое]вать$/.test(w)) { const st = w.slice(0, -5) + (/ев/.test(w.slice(-5, -3)) && !/[жшчщц]$/.test(w.slice(0, -5)) ? 'ю' : 'у'); return six(st + 'ю', st, ['ешь', 'ет', 'ем', 'ете', 'ют']); }
  if (/авать$/.test(w)) { const st = w.slice(0, -4); return six(st + 'ю', st, ['ёшь', 'ёт', 'ём', 'ёте', 'ют']); }
  if (/[аяе]ть$/.test(w)) { const st = w.slice(0, -2); return six(st + 'ю', st, ['ешь', 'ет', 'ем', 'ете', 'ют']); }
  if (/ить$/.test(w)) {
    const st = w.slice(0, -3), last = st.slice(-1), sib = /[жшчщ]$/.test(st);
    const one = /ст$/.test(st) ? st.slice(0, -2) + 'щ' : { д: 'ж', т: 'ч', з: 'ж', с: 'ш' }[last] ? st.slice(0, -1) + { д: 'ж', т: 'ч', з: 'ж', с: 'ш' }[last] : /[бпвфм]$/.test(st) ? st + 'л' : st;
    return [one + (/[жшчщ]$/.test(one) ? 'у' : 'ю'), st + 'ишь', st + 'ит', st + 'им', st + 'ите', st + (sib ? 'ат' : 'ят')];
  }
  if (/ти$/.test(w)) { const st = w.slice(0, -2); return six(st + 'у', st, ['ёшь', 'ёт', 'ём', 'ёте', 'ут']); }
  const st = w.replace(/(ть|чь)$/, ''); return six(st + 'у', st, ['ешь', 'ет', 'ем', 'ете', 'ут']);
}
const ruRefl = f => f.map(x => x + (/[аеёиоуыэюя]$/.test(x) ? 'сь' : 'ся'));
// a noun that isn't in the lists: the usual endings for its gender and last letter (no fleeting vowels)
function ruGuessNoun(w, g, anim, mass) {
  const st = w.slice(0, -1), last = w.slice(-1), hush = x => /[гкхжшчщ]$/.test(x), sib = x => /[жшчщц]$/.test(x);
  let sg, pl;
  if (/ия$/.test(w)) { const s = w.slice(0, -2); sg = [w, s + 'ии', s + 'ии', s + 'ию', s + 'ией', s + 'ии']; pl = [s + 'ии', s + 'ий', s + 'иям', s + 'ии', s + 'иями', s + 'иях']; }
  else if (last === 'а') { const y = hush(st) ? 'и' : 'ы'; sg = [w, st + y, st + 'е', st + 'у', st + (sib(st) ? 'ей' : 'ой'), st + 'е']; pl = [st + y, st, st + 'ам', st + y, st + 'ами', st + 'ах']; }
  else if (last === 'я') { sg = [w, st + 'и', st + 'е', st + 'ю', st + 'ей', st + 'е']; pl = [st + 'и', /[аеиоуэюя]$/.test(st) ? st + 'й' : st + 'ь', st + 'ям', st + 'и', st + 'ями', st + 'ях']; }
  else if (last === 'ь' && g === 'f') { sg = [w, st + 'и', st + 'и', w, w + 'ю', st + 'и']; pl = [st + 'и', st + 'ей', st + 'ям', st + 'и', st + 'ями', st + 'ях']; }
  else if (last === 'ь') { sg = [w, st + 'я', st + 'ю', w, st + 'ем', st + 'е']; pl = [st + 'и', st + 'ей', st + 'ям', st + 'и', st + 'ями', st + 'ях']; }
  else if (/ие$/.test(w)) { const s = w.slice(0, -2); sg = [w, s + 'ия', s + 'ию', w, s + 'ием', s + 'ии']; pl = [s + 'ия', s + 'ий', s + 'иям', s + 'ия', s + 'иями', s + 'иях']; }
  else if (last === 'о') { sg = [w, st + 'а', st + 'у', w, st + 'ом', st + 'е']; pl = [st + 'а', st, st + 'ам', st + 'а', st + 'ами', st + 'ах']; }
  else if (last === 'е') { sg = [w, st + 'я', st + 'ю', w, st + 'ем', st + 'е']; pl = [st + 'я', st + 'ей', st + 'ям', st + 'я', st + 'ями', st + 'ях']; }
  else if (last === 'й') { sg = [w, st + 'я', st + 'ю', w, st + 'ем', st + (/ий$/.test(w) ? 'и' : 'е')]; pl = [st + 'и', st + 'ев', st + 'ям', st + 'и', st + 'ями', st + 'ях']; }
  else if (/[бвгджзклмнпрстфхцчшщ]$/.test(w)) { const y = hush(w) ? 'и' : 'ы'; sg = [w, w + 'а', w + 'у', w, w + 'ом', w + 'е']; pl = [w + y, w + (/[жшчщ]$/.test(w) ? 'ей' : /ц$/.test(w) ? 'ев' : 'ов'), w + 'ам', w + y, w + 'ами', w + 'ах']; }
  else { sg = [w, w, w, w, w, w]; pl = null; }   // кофе, метро, радио
  if (anim) { if (g === 'm' && !/[ая]$/.test(w)) sg[3] = sg[1]; if (pl) pl[3] = pl[1]; }
  return esvNounEntry(`${sg.join(',')};${pl && !mass ? pl.join(',') : '-'}|${g}|thing|${w}|`);
}

ESV.ru = { code: 'ru', name: 'Russian', voice: 'ru-RU', pfWord: 'perfective', voc: false,
  caseName: { nom: 'nominative', gen: 'genitive', dat: 'dative', acc: 'accusative', ins: 'instrumental', loc: 'prepositional', voc: 'vocative' },
  person: ['я', 'ты', 'он/она', 'мы', 'вы', 'они'], personEn: ['I', 'you', 'he/she', 'we', 'you', 'they'],
  neg: 'не', very: 'очень', est: 'есть', net: 'нет', eto: 'это', and: ['и'], withW: 'с', inW: 'в', onW: 'на', aboutW: 'о', atW: 'у', toW: 'к', toCase: 'dat',
  homeAt: 'дома', homeTo: 'домой', meGen: 'меня', surfaces: ['стол'],
  zeroNote: '. In the present, Russian leaves out “is”: “Я студент” (I am a student), “Книга на столе” (The book is on the table)',
  adjTable: ruAdjTable, conjugate: ruConjugate, reflForms: ruRefl, guessNoun: ruGuessNoun, isAdj: w => /(ый|ий|ой)$/.test(w), pfMine: {},
  howOK: A => /^(work|play|sing|draw|read|write|talk|cook|learn|run|swim)$/.test(A.en),
  ppForm: { его: 'него', ему: 'нему', её: 'неё', ей: 'ней', их: 'них', им: 'ним' },
  // с / со, к / ко, о / об, в / во
  prepForm(w, next) {
    const n = String(next || '').toLowerCase(), cl = /^[сзшжв][бвгджзклмнпрстфхцчшщ]/.test(n);
    if (w === 'с' && n === 'мной') return 'Say “со мной” (with me): “с” becomes “со” here.';
    if (w === 'со' && !(n === 'мной' || cl)) return `Use “с” here: “с ${n}”. “со” is for “со мной” and before some groups of consonants.`;
    if (w === 'к' && n === 'мне') return 'Say “ко мне” (to me): “к” becomes “ко” here.';
    if (w === 'ко' && !(n === 'мне' || cl)) return `Use “к” here: “к ${n}”.`;
    if (w === 'о' && /^[аоуэиы]/.test(n)) return `Before a vowel, “о” (about) becomes “об”: “об ${n}”.`;
    if (w === 'об' && !/^[аоуэиы]/.test(n)) return `Use “о” here: “о ${n}”. “об” is for words that start with a vowel.`;
    if (w === 'во' && !(n === 'мне' || /^[вф][бвгджзклмнпрстфхцчшщ]/.test(n))) return `Use “в” here: “в ${n}”.`;
    return null;
  },
  fixPreps(words) {
    words.forEach((x, k) => { if (x.k !== 'prep') return; const n = String(words[k + 1]?.w || ''), cl = /^[сзшжв][бвгджзклмнпрстфхцчшщ]/.test(n);
      if (x.w === 'с' && (n === 'мной' || cl)) x.w = 'со'; if (x.w === 'к' && n === 'мне') x.w = 'ко'; if (x.w === 'о' && /^[аоуэиы]/.test(n)) x.w = 'об';
      if (x.w === 'в' && /^[вф][бвгджзклмнпрстфхцчшщ]/.test(n)) x.w = 'во'; });
  },
  //   word     cases          person  number  gender  English  (pp = only after a preposition, np = never after one)
  pron: [['я', 'nom', 1, 's', '', 'I'], ['меня', 'gen acc', 1, 's', '', 'me'], ['мне', 'dat loc', 1, 's', '', 'me'], ['мной', 'ins', 1, 's', '', 'me'],
    ['ты', 'nom', 2, 's', '', 'you'], ['тебя', 'gen acc', 2, 's', '', 'you'], ['тебе', 'dat loc', 2, 's', '', 'you'], ['тобой', 'ins', 2, 's', '', 'you'],
    ['он', 'nom', 3, 's', 'm', 'he'], ['его', 'gen acc', 3, 's', 'm', 'him', 'np'], ['ему', 'dat', 3, 's', 'm', 'him', 'np'], ['него', 'gen acc', 3, 's', 'm', 'him', 'pp'], ['нему', 'dat', 3, 's', 'm', 'him', 'pp'], ['ним', 'ins', 3, 's', 'm', 'him', 'pp'], ['нём', 'loc', 3, 's', 'm', 'him', 'pp'],
    ['она', 'nom', 3, 's', 'f', 'she'], ['её', 'gen acc', 3, 's', 'f', 'her', 'np'], ['ей', 'dat', 3, 's', 'f', 'her', 'np'], ['неё', 'gen acc', 3, 's', 'f', 'her', 'pp'], ['ней', 'dat ins loc', 3, 's', 'f', 'her', 'pp'],
    ['мы', 'nom', 1, 'p', '', 'we'], ['нас', 'gen acc loc', 1, 'p', '', 'us'], ['нам', 'dat', 1, 'p', '', 'us'], ['нами', 'ins', 1, 'p', '', 'us'],
    ['вы', 'nom', 2, 'p', '', 'you'], ['вас', 'gen acc loc', 2, 'p', '', 'you'], ['вам', 'dat', 2, 'p', '', 'you'], ['вами', 'ins', 2, 'p', '', 'you'],
    ['они', 'nom', 3, 'p', '', 'they'], ['их', 'gen acc', 3, 'p', '', 'them', 'np'], ['им', 'dat', 3, 'p', '', 'them', 'np'], ['них', 'gen acc loc', 3, 'p', '', 'them', 'pp'], ['ним', 'dat', 3, 'p', '', 'them', 'pp'], ['ними', 'ins', 3, 'p', '', 'them', 'pp'],
    ['это', 'nom', 3, 's', 'n', 'this', 'eto']],
  //  my / your…: masculine (nom gen dat ins prep), feminine (nom gen dat acc ins prep), neuter, plural (nom gen dat ins prep); his / her / their never change
  poss: [{ en: 'my', per: 1, t: ['мой моего моему моим моём', 'моя моей моей мою моей моей', 'моё', 'мои моих моим моими моих'] },
    { en: 'your', per: 2, t: ['твой твоего твоему твоим твоём', 'твоя твоей твоей твою твоей твоей', 'твоё', 'твои твоих твоим твоими твоих'] },
    { en: 'our', per: 1, t: ['наш нашего нашему нашим нашем', 'наша нашей нашей нашу нашей нашей', 'наше', 'наши наших нашим нашими наших'] },
    { en: 'your', per: 2, t: ['ваш вашего вашему вашим вашем', 'ваша вашей вашей вашу вашей вашей', 'ваше', 'ваши ваших вашим вашими ваших'] },
    { en: 'his', per: 3, inv: true, w: 'его' }, { en: 'her', per: 3, inv: true, w: 'её' }, { en: 'their', per: 3, inv: true, w: 'их' }],
  prep: [{ w: ['в', 'во'], roles: { loc: 'loc', acc: 'dest' }, en: 'in / to' }, { w: ['на'], roles: { loc: 'loc', acc: 'dest' }, en: 'on, at / to' },
    { w: ['к', 'ко'], roles: { dat: 'to' }, en: 'to (someone)' }, { w: ['с', 'со'], roles: { ins: 'with' }, en: 'with' }, { w: ['у'], roles: { gen: 'at' }, en: 'at (someone’s) / has' },
    { w: ['из'], roles: { gen: 'from' }, en: 'from, out of' }, { w: ['о', 'об'], roles: { loc: 'about' }, en: 'about' }, { w: ['без'], roles: { gen: 'without' }, en: 'without' },
    { w: ['для'], roles: { gen: 'for' }, en: 'for' }],
  adv: [['сегодня', 'today', 'time'], ['завтра', 'tomorrow', 'time'], ['сейчас', 'now', 'time'], ['утром', 'in the morning', 'time'], ['вечером', 'in the evening', 'time'],
    ['часто', 'often', 'freq'], ['всегда', 'always', 'freq'], ['иногда', 'sometimes', 'freq'], ['никогда', 'never', 'never'],
    ['хорошо', 'well', 'how'], ['плохо', 'badly', 'how'], ['быстро', 'fast', 'how'], ['медленно', 'slowly', 'how'],
    ['дома', 'at home', 'place'], ['здесь', 'here', 'place'], ['там', 'there', 'place'], ['домой', 'home', 'dest'], ['тоже', 'too', 'too']],
  conj: [['и', 'and', 1], ['а', 'and (while)'], ['но', 'but']],
  //  nom,gen,dat,acc,ins,prep (one) ; the same (many) | gender | kind | English | English many | flags | English "at" | English "to"
  nouns: ['мама,мамы,маме,маму,мамой,маме;мамы,мам,мамам,мам,мамами,мамах|f|person|Mom|moms|name', 'папа,папы,папе,папу,папой,папе;папы,пап,папам,пап,папами,папах|m|person|Dad|dads|name',
    'брат,брата,брату,брата,братом,брате;братья,братьев,братьям,братьев,братьями,братьях|m|person|brother|brothers|sex', 'сестра,сестры,сестре,сестру,сестрой,сестре;сёстры,сестёр,сёстрам,сестёр,сёстрами,сёстрах|f|person|sister|sisters|sex',
    'друг,друга,другу,друга,другом,друге;друзья,друзей,друзьям,друзей,друзьями,друзьях|m|person|friend|friends', 'подруга,подруги,подруге,подругу,подругой,подруге;подруги,подруг,подругам,подруг,подругами,подругах|f|person|friend|friends|sex',
    'учитель,учителя,учителю,учителя,учителем,учителе;учителя,учителей,учителям,учителей,учителями,учителях|m|person|teacher|teachers', 'врач,врача,врачу,врача,врачом,враче;врачи,врачей,врачам,врачей,врачами,врачах|m|person|doctor|doctors',
    'студент,студента,студенту,студента,студентом,студенте;студенты,студентов,студентам,студентов,студентами,студентах|m|person|student|students', 'мальчик,мальчика,мальчику,мальчика,мальчиком,мальчике;мальчики,мальчиков,мальчикам,мальчиков,мальчиками,мальчиках|m|person|boy|boys|sex',
    'девочка,девочки,девочке,девочку,девочкой,девочке;девочки,девочек,девочкам,девочек,девочками,девочках|f|person|girl|girls|sex', 'бабушка,бабушки,бабушке,бабушку,бабушкой,бабушке;бабушки,бабушек,бабушкам,бабушек,бабушками,бабушках|f|person|Grandma|grandmas|name',
    'дедушка,дедушки,дедушке,дедушку,дедушкой,дедушке;дедушки,дедушек,дедушкам,дедушек,дедушками,дедушках|m|person|Grandpa|grandpas|name',
    'кот,кота,коту,кота,котом,коте;коты,котов,котам,котов,котами,котах|m|animal|cat|cats', 'кошка,кошки,кошке,кошку,кошкой,кошке;кошки,кошек,кошкам,кошек,кошками,кошках|f|animal|cat|cats', 'собака,собаки,собаке,собаку,собакой,собаке;собаки,собак,собакам,собак,собаками,собаках|f|animal|dog|dogs',
    'птица,птицы,птице,птицу,птицей,птице;птицы,птиц,птицам,птиц,птицами,птицах|f|animal|bird|birds', 'лошадь,лошади,лошади,лошадь,лошадью,лошади;лошади,лошадей,лошадям,лошадей,лошадьми,лошадях|f|animal|horse|horses',
    'хлеб,хлеба,хлебу,хлеб,хлебом,хлебе;-|m|food|bread', 'суп,супа,супу,суп,супом,супе;-|m|food|soup', 'яблоко,яблока,яблоку,яблоко,яблоком,яблоке;яблоки,яблок,яблокам,яблоки,яблоками,яблоках|n|food|apple|apples',
    'сыр,сыра,сыру,сыр,сыром,сыре;-|m|food|cheese', 'торт,торта,торту,торт,тортом,торте;торты,тортов,тортам,торты,тортами,тортах|m|food|cake|cakes', 'каша,каши,каше,кашу,кашей,каше;-|f|food|porridge',
    'вода,воды,воде,воду,водой,воде;-|f|drink|water', 'молоко,молока,молоку,молоко,молоком,молоке;-|n|drink|milk', 'чай,чая,чаю,чай,чаем,чае;-|m|drink|tea', 'сок,сока,соку,сок,соком,соке;-|m|drink|juice',
    'кофе,кофе,кофе,кофе,кофе,кофе;-|m|drink|coffee',
    'книга,книги,книге,книгу,книгой,книге;книги,книг,книгам,книги,книгами,книгах|f|read|book|books|open', 'письмо,письма,письму,письмо,письмом,письме;письма,писем,письмам,письма,письмами,письмах|n|read|letter|letters|open',
    'газета,газеты,газете,газету,газетой,газете;газеты,газет,газетам,газеты,газетами,газетах|f|read|newspaper|newspapers', 'журнал,журнала,журналу,журнал,журналом,журнале;журналы,журналов,журналам,журналы,журналами,журналах|m|read|magazine|magazines',
    'сказка,сказки,сказке,сказку,сказкой,сказке;сказки,сказок,сказкам,сказки,сказками,сказках|f|read|fairy tale|fairy tales', 'слово,слова,слову,слово,словом,слове;слова,слов,словам,слова,словами,словах|n|read|word|words|abs',
    'песня,песни,песне,песню,песней,песне;песни,песен,песням,песни,песнями,песнях|f|sound|song|songs', 'музыка,музыки,музыке,музыку,музыкой,музыке;-|f|sound|music||abs',
    'фильм,фильма,фильму,фильм,фильмом,фильме;фильмы,фильмов,фильмам,фильмы,фильмами,фильмах|m|show|film|films',
    'стол,стола,столу,стол,столом,столе;столы,столов,столам,столы,столами,столах|m|thing|table|tables', 'ручка,ручки,ручке,ручку,ручкой,ручке;ручки,ручек,ручкам,ручки,ручками,ручках|f|thing|pen|pens',
    'телефон,телефона,телефону,телефон,телефоном,телефоне;телефоны,телефонов,телефонам,телефоны,телефонами,телефонах|m|thing|phone|phones', 'мяч,мяча,мячу,мяч,мячом,мяче;мячи,мячей,мячам,мячи,мячами,мячах|m|thing|ball|balls',
    'окно,окна,окну,окно,окном,окне;окна,окон,окнам,окна,окнами,окнах|n|thing|window|windows|open', 'дверь,двери,двери,дверь,дверью,двери;двери,дверей,дверям,двери,дверями,дверях|f|thing|door|doors|open',
    'машина,машины,машине,машину,машиной,машине;машины,машин,машинам,машины,машинами,машинах|f|thing|car|cars|open', 'подарок,подарка,подарку,подарок,подарком,подарке;подарки,подарков,подаркам,подарки,подарками,подарках|m|thing|present|presents|open',
    'сумка,сумки,сумке,сумку,сумкой,сумке;сумки,сумок,сумкам,сумки,сумками,сумках|f|thing|bag|bags|open', 'ключ,ключа,ключу,ключ,ключом,ключе;ключи,ключей,ключам,ключи,ключами,ключах|m|thing|key|keys',
    'дом,дома,дому,дом,домом,доме;дома,домов,домам,дома,домами,домах|m|place|house|houses', 'школа,школы,школе,школу,школой,школе;школы,школ,школам,школы,школами,школах|f|place|school|schools||at school|to school',
    'парк,парка,парку,парк,парком,парке;парки,парков,паркам,парки,парками,парках|m|place|park|parks', 'магазин,магазина,магазину,магазин,магазином,магазине;магазины,магазинов,магазинам,магазины,магазинами,магазинах|m|place|shop|shops',
    'город,города,городу,город,городом,городе;города,городов,городам,города,городами,городах|m|place|city|cities', 'река,реки,реке,реку,рекой,реке;реки,рек,рекам,реки,реками,реках|f|place|river|rivers',
    'лес,леса,лесу,лес,лесом,лесу;леса,лесов,лесам,леса,лесами,лесах|m|place|forest|forests', 'сад,сада,саду,сад,садом,саду;сады,садов,садам,сады,садами,садах|m|place|garden|gardens',
    'кухня,кухни,кухне,кухню,кухней,кухне;кухни,кухонь,кухням,кухни,кухнями,кухнях|f|place|kitchen|kitchens|na|in the kitchen|to the kitchen',
    'комната,комнаты,комнате,комнату,комнатой,комнате;комнаты,комнат,комнатам,комнаты,комнатами,комнатах|f|place|room|rooms', 'библиотека,библиотеки,библиотеке,библиотеку,библиотекой,библиотеке;библиотеки,библиотек,библиотекам,библиотеки,библиотеками,библиотеках|f|place|library|libraries',
    'работа,работы,работе,работу,работой,работе;-|f|place|work||na|at work|to work', 'море,моря,морю,море,морем,море;моря,морей,морям,моря,морями,морях|n|place|sea|seas|na|at the sea|to the sea',
    'улица,улицы,улице,улицу,улицей,улице;улицы,улиц,улицам,улицы,улицами,улицах|f|place|street|streets|na|outside|outside'],
  // masculine | English | describes: p people · a animals · f food and drink · t things · l places · r things you read · s songs, music, films
  adjs: ['большой|big|patl', 'маленький|small|patl', 'новый|new|trls', 'старый|old|patlr', 'хороший|good|pafrls', 'плохой|bad|pafrs', 'красивый|beautiful|patls', 'интересный|interesting|rs',
    'вкусный|tasty|f', 'молодой|young|pa', 'весёлый|cheerful|pas', 'грустный|sad|pas', 'добрый|kind|pa', 'умный|clever|pa', 'красный|red|t', 'синий|blue|t', 'белый|white|at', 'чёрный|black|at',
    'горячий|hot|f', 'холодный|cold|f', 'дорогой|expensive|t'],
  //  infinitive | я ты он мы вы они | perfective | kind | what it takes | English | he/she form | who | flags (m motion, d to someone, ab about, ! needs an object) | note
  verbs: ['читать|читаю читаешь читает читаем читаете читают|прочитать|tr|read|read|reads|p|ab', 'писать|пишу пишешь пишет пишем пишете пишут|написать|tr|read|write|writes|p|d ab',
    'знать|знаю знаешь знает знаем знаете знают||tr|person,read,sound,place|know|knows|p', 'делать|делаю делаешь делает делаем делаете делают|сделать|tr|food,thing|make|makes|p|!',
    'слушать|слушаю слушаешь слушает слушаем слушаете слушают|послушать|tr|sound,person|listen to|listens to|p', 'играть|играю играешь играет играем играете играют|поиграть|in||play|plays|a',
    'работать|работаю работаешь работает работаем работаете работают|поработать|in||work|works|p', 'гулять|гуляю гуляешь гуляет гуляем гуляете гуляют|погулять|in||go for a walk|goes for a walk|a',
    'понимать|понимаю понимаешь понимает понимаем понимаете понимают|понять|tr|person,read,sound,show|understand|understands|p', 'открывать|открываю открываешь открывает открываем открываете открывают|открыть|tr|open|open|opens|p|!',
    'закрывать|закрываю закрываешь закрывает закрываем закрываете закрывают|закрыть|tr|open|close|closes|p|!', 'покупать|покупаю покупаешь покупает покупаем покупаете покупают|купить|tr|food,drink,read,thing|buy|buys|p|d !',
    'давать|даю даёшь даёт даём даёте дают|дать|tr|food,drink,read,thing|give|gives|p|d !', 'показывать|показываю показываешь показывает показываем показываете показывают|показать|tr|*|show|shows|p|d !',
    'готовить|готовлю готовишь готовит готовим готовите готовят|приготовить|tr|food|cook|cooks|p', 'говорить|говорю говоришь говорит говорим говорите говорят|поговорить|in||talk|talks|p|ab',
    'любить|люблю любишь любит любим любите любят|полюбить|like|*|love|loves|a', 'видеть|вижу видишь видит видим видите видят|увидеть|tr|*|see|sees|a',
    'смотреть|смотрю смотришь смотрит смотрим смотрите смотрят|посмотреть|tr|show,person,animal|watch|watches|a', 'ждать|жду ждёшь ждёт ждём ждёте ждут|подождать|tr|person,animal|wait for|waits for|a|!',
    'искать|ищу ищешь ищет ищем ищете ищут|поискать|tr|*|look for|looks for|a|!', 'спать|сплю спишь спит спим спите спят|поспать|in||sleep|sleeps|a',
    'жить|живу живёшь живёт живём живёте живут|пожить|in||live|lives|a', 'сидеть|сижу сидишь сидит сидим сидите сидят|посидеть|in||sit|sits|a',
    'пить|пью пьёшь пьёт пьём пьёте пьют|выпить|tr|drink|drink|drinks|a', 'есть|ем ешь ест едим едите едят|съесть|tr|food|eat|eats|a',
    'идти|иду идёшь идёт идём идёте идут|пойти|in||go|goes|a|m|on foot', 'ехать|еду едешь едет едем едете едут|поехать|in||go|goes|p|m|by car, bus or train',
    'бежать|бегу бежишь бежит бежим бежите бегут|побежать|in||run|runs|a|m', 'хотеть|хочу хочешь хочет хотим хотите хотят|захотеть|want|food,drink,read,thing,animal,sound,show|want|wants|a',
    'мочь|могу можешь может можем можете могут|смочь|modal||can|can|a', 'учить|учу учишь учит учим учите учат|выучить|tr|read,sound|learn|learns|p',
    'рисовать|рисую рисуешь рисует рисуем рисуете рисуют|нарисовать|tr|person,animal,thing,place|draw|draws|p', 'петь|пою поёшь поёт поём поёте поют|спеть|tr|sound|sing|sings|a',
    'помогать|помогаю помогаешь помогает помогаем помогаете помогают|помочь|dat|person,animal|help|helps|p', 'звонить|звоню звонишь звонит звоним звоните звонят|позвонить|dat|person|call|calls|p',
    'брать|беру берёшь берёт берём берёте берут|взять|tr|food,drink,read,thing|take|takes|p|!', 'думать|думаю думаешь думает думаем думаете думают|подумать|in||think|thinks|p|ab',
    'плавать|плаваю плаваешь плавает плаваем плаваете плавают|поплавать|in||swim|swims|a'],
  formsLabel: 'я, ты, он/она, мы, вы, они (читаю, читаешь, читает, читаем, читаете, читают)',
  mineIntro: 'write verbs as a pair if you like: <i>читать / прочитать</i>; the first one is used). The case endings and verb forms are worked out from the usual patterns; check any that look wrong, because Russian has many small exceptions (подарок → подарка, писать → пишу).',
  order: { rows: [
      ['A basic sentence (who – verb – what)', [['pron', 'who (nominative)'], ['verb', 'verb'], ['adj', '(adjective)'], ['noun', 'what (accusative)']]],
      ['Other orders work too: the endings show who does what', [['noun', 'what (accusative)'], ['verb', 'verb'], ['noun', 'who (nominative)']]],
      ['No “is” in the present', [['pron', 'who'], ['noun', 'what (nominative)']]],
      ['What something is like', [['noun', 'noun'], ['adv', '(очень)'], ['adj', 'adjective']]],
      ['Where (prepositional) and where to (accusative)', [['pron', 'who'], ['verb', 'verb'], ['prep', 'в / на'], ['noun', 'noun']]],
      ['Having something', [['prep', 'у'], ['pron', 'меня / него / неё…'], ['verb', 'есть'], ['noun', 'what (nominative)']]],
      ['Not having it', [['prep', 'у'], ['pron', 'меня'], ['verb', 'нет'], ['noun', 'what (genitive)']]],
      ['Can / want + basic form', [['pron', 'who'], ['verb', 'могу / хочу'], ['verb', 'basic form (-ть)'], ['noun', '(what)']]],
      ['A negative sentence', [['pron', 'who'], ['adv', 'не'], ['verb', 'verb']]],
    ], tips: [
      ['noun', 'The <b>ending</b> shows the job: <b>мама</b> (Mom does it), <b>маму</b> (it is done to Mom), <b>мамы</b> (of Mom), <b>маме</b> (to Mom), <b>с мамой</b> (with Mom), <b>о маме</b> (about Mom).'],
      ['noun', 'For people and animals, “what is done to them” looks like “of”: <b>я вижу брата</b>, <b>я вижу кошек</b>. Things stay as they are: <b>я вижу стол</b>.'],
      ['adj', 'A describing word goes before its noun and matches it: <b>большой дом</b>, <b>большая кошка</b>, <b>большое окно</b>, <b>в большом доме</b>, <b>большую кошку</b>.'],
      ['verb', 'The ending shows who: <b>читаю</b> (I), <b>читаешь</b> (you), <b>читает</b> (he/she), <b>читаем</b> (we), <b>читаете</b> (you all), <b>читают</b> (they).'],
      ['verb', 'Verbs come in pairs: <b>читать</b> (reading, again and again) and <b>прочитать</b> (read to the end, once). The present tense uses the first one.'],
      ['prep', '<b>в / на</b> + prepositional = where (<b>в школе</b>), + accusative = where to (<b>в школу</b>). Some places take <b>на</b>: <b>на работе</b>, <b>на кухне</b>.'],
      ['adv', '<b>не</b> goes right before the verb. <b>никогда</b> needs <b>не</b> too: <b>я никогда не пью кофе</b>.'],
      ['pron', 'Russian has no “the” or “a”: <b>книга</b> is “the book” or “a book”.'] ] } };
esvRegister('ru');
