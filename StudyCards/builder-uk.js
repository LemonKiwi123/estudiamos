'use strict';
/* Sentence Builder: Ukrainian words (the rules are in builder-eslav.js). Every built-in noun has all twelve forms written
   out, with the second spelling Ukrainian often allows (братові / брату, у саду / у саді) and the vocative for people
   (мамо, тату, друже). в / у, з / із / зі and і / й are all accepted (they change only for an easier sound); new
   sentences pick the usual one. Both "У мене є кіт" and "Я маю кота" are taught. Loaded after builder-eslav.js. */
function ukAdjTable(m) {
  m = esvStrip(m);
  if (/ій$/.test(m)) { const st = m.slice(0, -2);   // синій
    return esvTab(`${st}ій ${st}ього ${st}ьому ${st}ім ${st}ьому/${st}ім`, `${st}я ${st}ьої ${st}ій ${st}ю ${st}ьою ${st}ій`, `${st}є`, `${st}і ${st}іх ${st}ім ${st}іми ${st}іх`); }
  const st = /ий$/.test(m) ? m.slice(0, -2) : m;
  return esvTab(`${st}ий ${st}ого ${st}ому ${st}им ${st}ому/${st}ім`, `${st}а ${st}ої ${st}ій ${st}у ${st}ою ${st}ій`, `${st}е`, `${st}і ${st}их ${st}им ${st}ими ${st}их`);
}
function ukConjugate(w) {
  const six = (a, st, e) => [a, st + e[0], st + e[1], st + e[2], st + e[3], st + e[4]], one = ['єш', 'є', 'ємо', 'єте', 'ють'];
  if (/[ую]вати$/.test(w)) { const st = w.slice(0, -4); return six(st + 'ю', st, one); }   // купувати → купую, малювати → малюю
  if (/авати$/.test(w)) { const st = w.slice(0, -4); return six(st + 'ю', st, one); }   // давати → даю
  if (/[аяі]ти$/.test(w)) { const st = w.slice(0, -2); return six(st + 'ю', st, one); }   // читати → читаю, розуміти → розумію
  if (/ити$/.test(w)) {
    const st = w.slice(0, -3), last = st.slice(-1), lab = /[бпвфм]$/.test(st), sib = /[жчшщ]$/.test(st);
    const alt = { д: 'дж', т: 'ч', з: 'ж', с: 'ш' }, a1 = /ст$/.test(st) ? st.slice(0, -2) + 'щ' : alt[last] ? st.slice(0, -1) + alt[last] : lab ? st + 'л' : st;
    return [a1 + (/(ж|ч|ш|щ|дж)$/.test(a1) ? 'у' : 'ю'), st + 'иш', st + 'ить', st + 'имо', st + 'ите', lab ? st + 'лять' : st + (sib ? 'ать' : 'ять')];
  }
  const st = w.replace(/(ти|ть)$/, ''); return six(st + 'у', st, ['еш', 'е', 'емо', 'ете', 'уть']);   // нести → несу
}
const ukRefl = f => f.map((x, k) => k === 2 && /[єе]$/.test(x) ? x + 'ться' : x + 'ся');
function ukGuessNoun(w, g, anim, mass) {
  const st = w.slice(0, -1), alt = s => s.replace(/г$/, 'з').replace(/к$/, 'ц').replace(/х$/, 'с');
  let sg, pl, voc = null;
  if (/ія$/.test(w)) { const s = w.slice(0, -2); sg = [w, s + 'ії', s + 'ії', s + 'ію', s + 'ією', s + 'ії']; pl = [s + 'ії', s + 'ій', s + 'іям', s + 'ії', s + 'іями', s + 'іях']; voc = s + 'іє'; }
  else if (g === 'n' && /я$/.test(w)) { sg = [w, w, st + 'ю', w, st + 'ям', st + 'і']; pl = [w, st.slice(0, -1) + 'ь', st + 'ям', w, st + 'ями', st + 'ях']; }   // завдання → завдань
  else if (/а$/.test(w)) { const mix = /[жчшщ]$/.test(st);
    sg = mix ? [w, st + 'і', st + 'і', st + 'у', st + 'ею', st + 'і'] : [w, st + 'и', alt(st) + 'і', st + 'у', st + 'ою', alt(st) + 'і'];
    pl = mix ? [st + 'і', st, st + 'ам', st + 'і', st + 'ами', st + 'ах'] : [st + 'и', st, st + 'ам', st + 'и', st + 'ами', st + 'ах']; voc = mix ? st + 'е' : st + 'о'; }
  else if (/я$/.test(w)) { sg = [w, st + 'і', st + 'і', st + 'ю', st + 'ею', st + 'і']; pl = [st + 'і', /[аеиоуі]$/.test(st) ? st + 'й' : st + 'ь', st + 'ям', st + 'і', st + 'ями', st + 'ях']; voc = st + 'ю'; }
  else if (/о$/.test(w) && g === 'm') { sg = [w, st + 'а', st + 'ові', st + 'а', st + 'ом', st + 'ові']; pl = [st + 'и', st + 'ів', st + 'ам', st + 'ів', st + 'ами', st + 'ах']; voc = st + 'у'; }
  else if (/о$/.test(w)) { sg = [w, st + 'а', st + 'у', w, st + 'ом', alt(st) + 'і']; pl = [st + 'а', st, st + 'ам', st + 'а', st + 'ами', st + 'ах']; }
  else if (/е$/.test(w)) { sg = [w, st + 'я', st + 'ю', w, st + 'ем', st + 'і']; pl = [st + 'я', st + 'ів', st + 'ям', st + 'я', st + 'ями', st + 'ях']; }
  else if (/ь$/.test(w) && g === 'f') { sg = [w, st + 'і', st + 'і', w, st + 'ю', st + 'і']; pl = [st + 'і', st + 'ей', st + 'ям', st + 'і', st + 'ями', st + 'ях']; }
  else if (/ь$/.test(w)) { sg = [w, st + 'я', anim ? st + 'еві/' + st + 'ю' : st + 'ю', w, st + 'ем', st + 'і']; pl = [st + 'і', st + 'ів', st + 'ям', st + 'і', st + 'ями', st + 'ях']; voc = st + 'ю'; }
  else if (/й$/.test(w)) { sg = [w, st + 'я', st + 'ю', w, st + 'єм', st + 'ї']; pl = [st + 'ї', st + 'їв', st + 'ям', st + 'ї', st + 'ями', st + 'ях']; voc = st + 'ю'; }
  else if (/[бвгґджзклмнпрстфхцчшщ]$/.test(w)) { const sib = /[жчшщ]$/.test(w), velar = /[гкх]$/.test(w);
    sg = [w, w + 'а', anim ? w + 'ові/' + w + 'у' : w + 'у', w, w + (sib ? 'ем' : 'ом'), anim ? w + 'ові' : velar ? w + 'у' : w + 'і'];
    pl = [w + (sib ? 'і' : 'и'), w + 'ів', w + 'ам', w + (sib ? 'і' : 'и'), w + 'ами', w + 'ах'];
    voc = /(ик|ок)$/.test(w) ? w + 'у' : velar ? w.slice(0, -1) + { г: 'же', к: 'че', х: 'ше' }[w.slice(-1)] : sib ? w + 'у' : w + 'е'; }
  else { sg = [w, w, w, w, w, w]; pl = null; }   // кафе, метро, радіо
  if (anim) { if (g === 'm' && !/[ая]$/.test(w)) sg[3] = sg[1]; if (pl) pl[3] = pl[1]; }
  return esvNounEntry(`${sg.join(',')};${pl && !mass ? pl.join(',') : '-'}|${g}|thing|${w}||${anim && voc ? 'v:' + voc : ''}`);
}
const UK_V = /[аеєиіїоуюя]$/;
ESV.uk = { code: 'uk', name: 'Ukrainian', voice: 'uk-UA', pfWord: 'perfective', voc: true,
  caseName: { nom: 'nominative', gen: 'genitive', dat: 'dative', acc: 'accusative', ins: 'instrumental', loc: 'locative', voc: 'vocative' },
  person: ['я', 'ти', 'він/вона', 'ми', 'ви', 'вони'], personEn: ['I', 'you', 'he/she', 'we', 'you', 'they'],
  neg: 'не', very: 'дуже', est: 'є', net: 'немає', eto: 'це', and: ['і', 'й'], conjGen: ['і', 'а', 'але'], withW: 'з', inW: 'у', onW: 'на', aboutW: 'про', atW: 'у', toW: 'до', toCase: 'gen',
  homeAt: 'вдома', homeTo: 'додому', meGen: 'мене', surfaces: ['стіл'],
  zeroNote: '. In the present, Ukrainian usually leaves out “is”: “Я студент” (I am a student), “Книга на столі” (The book is on the table)',
  adjTable: ukAdjTable, conjugate: ukConjugate, reflForms: ukRefl, guessNoun: ukGuessNoun, isAdj: w => /(ий|ій)$/.test(w), pfMine: {},
  howOK: A => /^(work|play|sing|draw|read|write|talk|cook|learn|run|swim)$/.test(A.en),
  ppForm: { його: 'нього', її: 'неї', їх: 'них' },
  prepForm: () => null,   // в / у, з / із / зі: all accepted
  // the usual choice for an easy sound: "у" after a consonant, "в" after a vowel; "зі мною", "із сестрою"
  fixPreps(words) {
    words.forEach((x, k) => {
      const prev = String(words[k - 1]?.w || ''), next = String(words[k + 1]?.w || '');
      if (x.k === 'prep' && (x.w === 'в' || x.w === 'у')) x.w = k && UK_V.test(prev) && !/^[вфу]|^(льв|св|тв|хв)/.test(next) && !/^[аеєиіїоуюя]/.test(next) ? 'в' : k && UK_V.test(prev) && /^[аеєиіїоуюя]/.test(next) ? 'в' : 'у';
      if (x.k === 'prep' && ['з', 'із', 'зі'].includes(x.w)) x.w = next === 'мною' || /^[зсцчшщ][^аеєиіїоуюя']/.test(next) ? 'зі' : /^[зсцчшщ]/.test(next) ? 'із' : 'з';
    });
  },
  pron: [['я', 'nom', 1, 's', '', 'I'], ['мене', 'gen acc', 1, 's', '', 'me'], ['мені', 'dat loc', 1, 's', '', 'me'], ['мною', 'ins', 1, 's', '', 'me'],
    ['ти', 'nom', 2, 's', '', 'you'], ['тебе', 'gen acc', 2, 's', '', 'you'], ['тобі', 'dat loc', 2, 's', '', 'you'], ['тобою', 'ins', 2, 's', '', 'you'],
    ['він', 'nom', 3, 's', 'm', 'he'], ['його', 'gen acc', 3, 's', 'm', 'him', 'np'], ['йому', 'dat', 3, 's', 'm', 'him'], ['нього', 'gen acc', 3, 's', 'm', 'him', 'pp'], ['ним', 'ins', 3, 's', 'm', 'him'], ['ньому', 'loc', 3, 's', 'm', 'him', 'pp'],
    ['вона', 'nom', 3, 's', 'f', 'she'], ['її', 'gen acc', 3, 's', 'f', 'her', 'np'], ['їй', 'dat', 3, 's', 'f', 'her'], ['неї', 'gen acc', 3, 's', 'f', 'her', 'pp'], ['нею', 'ins', 3, 's', 'f', 'her'], ['ній', 'loc', 3, 's', 'f', 'her', 'pp'],
    ['ми', 'nom', 1, 'p', '', 'we'], ['нас', 'gen acc loc', 1, 'p', '', 'us'], ['нам', 'dat', 1, 'p', '', 'us'], ['нами', 'ins', 1, 'p', '', 'us'],
    ['ви', 'nom', 2, 'p', '', 'you'], ['вас', 'gen acc loc', 2, 'p', '', 'you'], ['вам', 'dat', 2, 'p', '', 'you'], ['вами', 'ins', 2, 'p', '', 'you'],
    ['вони', 'nom', 3, 'p', '', 'they'], ['їх', 'gen acc', 3, 'p', '', 'them', 'np'], ['їм', 'dat', 3, 'p', '', 'them'], ['них', 'gen acc loc', 3, 'p', '', 'them', 'pp'], ['ними', 'ins', 3, 'p', '', 'them'],
    ['це', 'nom', 3, 's', 'n', 'this', 'eto']],
  poss: [{ en: 'my', per: 1, t: ['мій мого моєму моїм моєму/моїм', 'моя моєї моїй мою моєю моїй', 'моє', 'мої моїх моїм моїми моїх'] },
    { en: 'your', per: 2, t: ['твій твого твоєму твоїм твоєму/твоїм', 'твоя твоєї твоїй твою твоєю твоїй', 'твоє', 'твої твоїх твоїм твоїми твоїх'] },
    { en: 'our', per: 1, t: ['наш нашого нашому нашим нашому/нашім', 'наша нашої нашій нашу нашою нашій', 'наше', 'наші наших нашим нашими наших'] },
    { en: 'your', per: 2, t: ['ваш вашого вашому вашим вашому/вашім', 'ваша вашої вашій вашу вашою вашій', 'ваше', 'ваші ваших вашим вашими ваших'] },
    { en: 'their', per: 3, t: ['їхній їхнього їхньому їхнім їхньому/їхнім', 'їхня їхньої їхній їхню їхньою їхній', 'їхнє', 'їхні їхніх їхнім їхніми їхніх'] },
    { en: 'his', per: 3, inv: true, w: 'його' }, { en: 'her', per: 3, inv: true, w: 'її' }],
  prep: [{ w: ['у', 'в'], roles: { loc: 'loc', acc: 'dest', gen: 'at' }, en: 'in / to / at (someone’s)' }, { w: ['на'], roles: { loc: 'loc', acc: 'dest' }, en: 'on, at / to' },
    { w: ['до'], roles: { gen: 'to' }, en: 'to' }, { w: ['з', 'із', 'зі'], roles: { ins: 'with', gen: 'from' }, en: 'with / from' }, { w: ['про'], roles: { acc: 'about' }, en: 'about' },
    { w: ['без'], roles: { gen: 'without' }, en: 'without' }, { w: ['для'], roles: { gen: 'for' }, en: 'for' }],
  adv: [['сьогодні', 'today', 'time'], ['завтра', 'tomorrow', 'time'], ['зараз', 'now', 'time'], ['вранці', 'in the morning', 'time'], ['увечері', 'in the evening', 'time'],
    ['часто', 'often', 'freq'], ['завжди', 'always', 'freq'], ['іноді', 'sometimes', 'freq'], ['ніколи', 'never', 'never'],
    ['добре', 'well', 'how'], ['погано', 'badly', 'how'], ['швидко', 'fast', 'how'], ['повільно', 'slowly', 'how'],
    ['вдома', 'at home', 'place'], ['тут', 'here', 'place'], ['там', 'there', 'place'], ['додому', 'home', 'dest'], ['теж', 'too', 'too'], ['також', 'also', 'too']],
  conj: [['і', 'and', 1], ['й', 'and', 1], ['а', 'and (while)'], ['але', 'but']],
  nouns: ['мама,мами,мамі,маму,мамою,мамі;мами,мам,мамам,мам,мамами,мамах|f|person|Mom|moms|name v:мамо', 'тато,тата,татові/тату,тата,татом,татові/тату;тати,татів,татам,татів,татами,татах|m|person|Dad|dads|name v:тату',
    'брат,брата,братові/брату,брата,братом,братові/браті;брати,братів,братам,братів,братами,братах|m|person|brother|brothers|sex v:брате', 'сестра,сестри,сестрі,сестру,сестрою,сестрі;сестри,сестер,сестрам,сестер,сестрами,сестрах|f|person|sister|sisters|sex v:сестро',
    'друг,друга,другові/другу,друга,другом,другові/друзі;друзі,друзів,друзям,друзів,друзями,друзях|m|person|friend|friends|v:друже', 'подруга,подруги,подрузі,подругу,подругою,подрузі;подруги,подруг,подругам,подруг,подругами,подругах|f|person|friend|friends|sex v:подруго',
    'вчитель,вчителя,вчителеві/вчителю,вчителя,вчителем,вчителеві/вчителі;вчителі,вчителів,вчителям,вчителів,вчителями,вчителях|m|person|teacher|teachers|v:вчителю', 'лікар,лікаря,лікареві/лікарю,лікаря,лікарем,лікареві/лікарі;лікарі,лікарів,лікарям,лікарів,лікарями,лікарях|m|person|doctor|doctors|v:лікарю',
    'студент,студента,студентові/студенту,студента,студентом,студентові/студенті;студенти,студентів,студентам,студентів,студентами,студентах|m|person|student|students|v:студенте',
    'хлопчик,хлопчика,хлопчикові/хлопчику,хлопчика,хлопчиком,хлопчикові/хлопчику;хлопчики,хлопчиків,хлопчикам,хлопчиків,хлопчиками,хлопчиках|m|person|boy|boys|sex v:хлопчику',
    'дівчинка,дівчинки,дівчинці,дівчинку,дівчинкою,дівчинці;дівчатка,дівчаток,дівчаткам,дівчаток,дівчатками,дівчатках|f|person|girl|girls|sex v:дівчинко',
    'бабуся,бабусі,бабусі,бабусю,бабусею,бабусі;бабусі,бабусь,бабусям,бабусь,бабусями,бабусях|f|person|Grandma|grandmas|name v:бабусю', 'дідусь,дідуся,дідусеві/дідусю,дідуся,дідусем,дідусеві/дідусі;дідусі,дідусів,дідусям,дідусів,дідусями,дідусях|m|person|Grandpa|grandpas|name v:дідусю',
    'кіт,кота,котові/коту,кота,котом,котові/коті;коти,котів,котам,котів,котами,котах|m|animal|cat|cats', 'кішка,кішки,кішці,кішку,кішкою,кішці;кішки,кішок,кішкам,кішок,кішками,кішках|f|animal|cat|cats', 'собака,собаки,собаці,собаку,собакою,собаці;собаки,собак,собакам,собак,собаками,собаках|m|animal|dog|dogs',
    'птах,птаха,птахові/птаху,птаха,птахом,птахові/птаху;птахи,птахів,птахам,птахів,птахами,птахах|m|animal|bird|birds', 'кінь,коня,коневі/коню,коня,конем,коневі/коні;коні,коней,коням,коней,кіньми,конях|m|animal|horse|horses',
    'хліб,хліба,хлібу,хліб,хлібом,хлібі;-|m|food|bread', 'суп,супу,супу,суп,супом,супі;-|m|food|soup', 'яблуко,яблука,яблуку,яблуко,яблуком,яблуці/яблуку;яблука,яблук,яблукам,яблука,яблуками,яблуках|n|food|apple|apples',
    'сир,сиру,сиру,сир,сиром,сирі;-|m|food|cheese', 'торт,торта,торту,торт,тортом,торті;торти,тортів,тортам,торти,тортами,тортах|m|food|cake|cakes', 'каша,каші,каші,кашу,кашею,каші;-|f|food|porridge',
    'вода,води,воді,воду,водою,воді;-|f|drink|water', 'молоко,молока,молоку,молоко,молоком,молоці;-|n|drink|milk', 'чай,чаю,чаю,чай,чаєм,чаї;-|m|drink|tea', 'сік,соку,соку,сік,соком,соку;-|m|drink|juice',
    'кава,кави,каві,каву,кавою,каві;-|f|drink|coffee',
    'книга,книги,книзі,книгу,книгою,книзі;книги,книг,книгам,книги,книгами,книгах|f|read|book|books|open', 'лист,листа,листу/листові,лист,листом,листі;листи,листів,листам,листи,листами,листах|m|read|letter|letters|open',
    'газета,газети,газеті,газету,газетою,газеті;газети,газет,газетам,газети,газетами,газетах|f|read|newspaper|newspapers', 'журнал,журналу,журналу,журнал,журналом,журналі;журнали,журналів,журналам,журнали,журналами,журналах|m|read|magazine|magazines',
    'казка,казки,казці,казку,казкою,казці;казки,казок,казкам,казки,казками,казках|f|read|fairy tale|fairy tales', 'слово,слова,слову,слово,словом,слові;слова,слів,словам,слова,словами,словах|n|read|word|words|abs',
    'пісня,пісні,пісні,пісню,піснею,пісні;пісні,пісень,пісням,пісні,піснями,піснях|f|sound|song|songs', 'музика,музики,музиці,музику,музикою,музиці;-|f|sound|music||abs',
    'фільм,фільму,фільму,фільм,фільмом,фільмі;фільми,фільмів,фільмам,фільми,фільмами,фільмах|m|show|film|films',
    'стіл,стола,столу,стіл,столом,столі;столи,столів,столам,столи,столами,столах|m|thing|table|tables', 'ручка,ручки,ручці,ручку,ручкою,ручці;ручки,ручок,ручкам,ручки,ручками,ручках|f|thing|pen|pens',
    'телефон,телефону,телефону,телефон,телефоном,телефоні;телефони,телефонів,телефонам,телефони,телефонами,телефонах|m|thing|phone|phones', "м'яч,м'яча,м'ячу,м'яч,м'ячем,м'ячі;м'ячі,м'ячів,м'ячам,м'ячі,м'ячами,м'ячах|m|thing|ball|balls",
    'вікно,вікна,вікну,вікно,вікном,вікні;вікна,вікон,вікнам,вікна,вікнами,вікнах|n|thing|window|windows|open', 'коробка,коробки,коробці,коробку,коробкою,коробці;коробки,коробок,коробкам,коробки,коробками,коробках|f|thing|box|boxes|open',
    'машина,машини,машині,машину,машиною,машині;машини,машин,машинам,машини,машинами,машинах|f|thing|car|cars|open', 'подарунок,подарунка,подарунку,подарунок,подарунком,подарунку;подарунки,подарунків,подарункам,подарунки,подарунками,подарунках|m|thing|present|presents|open',
    'сумка,сумки,сумці,сумку,сумкою,сумці;сумки,сумок,сумкам,сумки,сумками,сумках|f|thing|bag|bags|open', 'ключ,ключа,ключу/ключеві,ключ,ключем,ключі;ключі,ключів,ключам,ключі,ключами,ключах|m|thing|key|keys',
    'будинок,будинку,будинку,будинок,будинком,будинку;будинки,будинків,будинкам,будинки,будинками,будинках|m|place|house|houses', 'школа,школи,школі,школу,школою,школі;школи,шкіл,школам,школи,школами,школах|f|place|school|schools||at school|to school',
    'парк,парку,парку,парк,парком,парку;парки,парків,паркам,парки,парками,парках|m|place|park|parks', 'магазин,магазину,магазину,магазин,магазином,магазині;магазини,магазинів,магазинам,магазини,магазинами,магазинах|m|place|shop|shops',
    'місто,міста,місту,місто,містом,місті;міста,міст,містам,міста,містами,містах|n|place|city|cities', 'річка,річки,річці,річку,річкою,річці;річки,річок,річкам,річки,річками,річках|f|place|river|rivers',
    'ліс,лісу,лісу,ліс,лісом,лісі;ліси,лісів,лісам,ліси,лісами,лісах|m|place|forest|forests', 'сад,саду,саду,сад,садом,саду/саді;сади,садів,садам,сади,садами,садах|m|place|garden|gardens',
    'кухня,кухні,кухні,кухню,кухнею,кухні;кухні,кухонь,кухням,кухні,кухнями,кухнях|f|place|kitchen|kitchens|na|in the kitchen|to the kitchen',
    'кімната,кімнати,кімнаті,кімнату,кімнатою,кімнаті;кімнати,кімнат,кімнатам,кімнати,кімнатами,кімнатах|f|place|room|rooms', 'бібліотека,бібліотеки,бібліотеці,бібліотеку,бібліотекою,бібліотеці;бібліотеки,бібліотек,бібліотекам,бібліотеки,бібліотеками,бібліотеках|f|place|library|libraries',
    'робота,роботи,роботі,роботу,роботою,роботі;-|f|place|work||na|at work|to work', 'море,моря,морю,море,морем,морі;моря,морів,морям,моря,морями,морях|n|place|sea|seas|na|at the sea|to the sea',
    'вулиця,вулиці,вулиці,вулицю,вулицею,вулиці;вулиці,вулиць,вулицям,вулиці,вулицями,вулицях|f|place|street|streets|na|outside|outside'],
  adjs: ['великий|big|patl', 'маленький|small|patl', 'новий|new|trls', 'старий|old|patlr', 'хороший|good|pafrls', 'поганий|bad|pafrs', 'гарний|beautiful|patls', 'цікавий|interesting|rs',
    'смачний|tasty|f', 'молодий|young|pa', 'веселий|cheerful|pas', 'сумний|sad|pas', 'добрий|kind|pa', 'розумний|clever|pa', 'червоний|red|t', 'синій|blue|t', 'білий|white|at', 'чорний|black|at',
    'гарячий|hot|f', 'холодний|cold|f', 'дорогий|expensive|t'],
  verbs: ['читати|читаю читаєш читає читаємо читаєте читають|прочитати|tr|read|read|reads|p|ab', 'писати|пишу пишеш пише пишемо пишете пишуть|написати|tr|read|write|writes|p|d ab',
    'знати|знаю знаєш знає знаємо знаєте знають||tr|person,read,sound,place|know|knows|p', 'робити|роблю робиш робить робимо робите роблять|зробити|tr|food,thing|make|makes|p|!',
    'слухати|слухаю слухаєш слухає слухаємо слухаєте слухають|послухати|tr|sound,person|listen to|listens to|p', 'грати|граю граєш грає граємо граєте грають|пограти|in||play|plays|a',
    'працювати|працюю працюєш працює працюємо працюєте працюють|попрацювати|in||work|works|p', 'гуляти|гуляю гуляєш гуляє гуляємо гуляєте гуляють|погуляти|in||go for a walk|goes for a walk|a',
    'розуміти|розумію розумієш розуміє розуміємо розумієте розуміють|зрозуміти|tr|person,read,sound,show|understand|understands|p', 'відкривати|відкриваю відкриваєш відкриває відкриваємо відкриваєте відкривають|відкрити|tr|open|open|opens|p|!',
    'закривати|закриваю закриваєш закриває закриваємо закриваєте закривають|закрити|tr|open|close|closes|p|!', 'купувати|купую купуєш купує купуємо купуєте купують|купити|tr|food,drink,read,thing|buy|buys|p|d !',
    'давати|даю даєш дає даємо даєте дають|дати|tr|food,drink,read,thing|give|gives|p|d !', 'показувати|показую показуєш показує показуємо показуєте показують|показати|tr|*|show|shows|p|d !',
    'готувати|готую готуєш готує готуємо готуєте готують|приготувати|tr|food|cook|cooks|p', 'говорити|говорю говориш говорить говоримо говорите говорять|поговорити|in||talk|talks|p|ab',
    'любити|люблю любиш любить любимо любите люблять|полюбити|like|*|love|loves|a', 'бачити|бачу бачиш бачить бачимо бачите бачать|побачити|tr|*|see|sees|a',
    'чекати|чекаю чекаєш чекає чекаємо чекаєте чекають|почекати|tr|person,animal|wait for|waits for|a|!', 'шукати|шукаю шукаєш шукає шукаємо шукаєте шукають|пошукати|tr|*|look for|looks for|a|!',
    'спати|сплю спиш спить спимо спите сплять|поспати|in||sleep|sleeps|a', 'жити|живу живеш живе живемо живете живуть|пожити|in||live|lives|a',
    'сидіти|сиджу сидиш сидить сидимо сидите сидять|посидіти|in||sit|sits|a', "пити|п'ю п'єш п'є п'ємо п'єте п'ють|випити|tr|drink|drink|drinks|a",
    "їсти|їм їси їсть їмо їсте їдять|з'їсти|tr|food|eat|eats|a", 'йти|йду йдеш йде йдемо йдете йдуть|піти|in||go|goes|a|m|on foot',
    'їхати|їду їдеш їде їдемо їдете їдуть|поїхати|in||go|goes|p|m|by car, bus or train', 'бігти|біжу біжиш біжить біжимо біжите біжать|побігти|in||run|runs|a|m',
    'хотіти|хочу хочеш хоче хочемо хочете хочуть|захотіти|want|food,drink,read,thing,animal,sound,show|want|wants|a', 'могти|можу можеш може можемо можете можуть|змогти|modal||can|can|a',
    'вчити|вчу вчиш вчить вчимо вчите вчать|вивчити|tr|read,sound|learn|learns|p', 'малювати|малюю малюєш малює малюємо малюєте малюють|намалювати|tr|person,animal,thing,place|draw|draws|p',
    'співати|співаю співаєш співає співаємо співаєте співають|заспівати|tr|sound|sing|sings|a', 'допомагати|допомагаю допомагаєш допомагає допомагаємо допомагаєте допомагають|допомогти|dat|person,animal|help|helps|p',
    'дзвонити|дзвоню дзвониш дзвонить дзвонимо дзвоните дзвонять|подзвонити|dat|person|call|calls|p', 'брати|беру береш бере беремо берете беруть|взяти|tr|food,drink,read,thing|take|takes|p|!',
    'думати|думаю думаєш думає думаємо думаєте думають|подумати|in||think|thinks|p|ab', 'плавати|плаваю плаваєш плаває плаваємо плаваєте плавають|поплавати|in||swim|swims|a',
    'мати|маю маєш має маємо маєте мають||tr|food,drink,read,thing,animal,sound|have|has|p|!'],
  formsLabel: 'я, ти, він/вона, ми, ви, вони (читаю, читаєш, читає, читаємо, читаєте, читають)',
  mineIntro: 'write verbs as a pair if you like: <i>читати / прочитати</i>; the first one is used). The case endings, the calling form (мамо, друже) and the verb forms are worked out from the usual patterns; check any that look wrong, because Ukrainian has many small exceptions (стіл → стола, писати → пишу).',
  order: { rows: [
      ['A basic sentence (who – verb – what)', [['pron', 'who (nominative)'], ['verb', 'verb'], ['adj', '(adjective)'], ['noun', 'what (accusative)']]],
      ['Other orders work too: the endings show who does what', [['noun', 'what (accusative)'], ['verb', 'verb'], ['noun', 'who (nominative)']]],
      ['No “is” in the present', [['pron', 'who'], ['noun', 'what (nominative)']]],
      ['What something is like', [['noun', 'noun'], ['adv', '(дуже)'], ['adj', 'adjective']]],
      ['Where (locative) and where to (accusative or до)', [['pron', 'who'], ['verb', 'verb'], ['prep', 'у / на / до'], ['noun', 'noun']]],
      ['Having something', [['prep', 'у'], ['pron', 'мене / нього / неї…'], ['verb', 'є'], ['noun', 'what (nominative)']]],
      ['… or with мати', [['pron', 'who'], ['verb', 'маю'], ['noun', 'what (accusative)']]],
      ['Not having it', [['prep', 'у'], ['pron', 'мене'], ['verb', 'немає'], ['noun', 'what (genitive)']]],
      ['Calling someone (vocative)', [['noun', 'мамо / друже'], ['pron', 'who'], ['verb', 'verb']]],
      ['Can / want + basic form', [['pron', 'who'], ['verb', 'можу / хочу'], ['verb', 'basic form (-ти)'], ['noun', '(what)']]],
    ], tips: [
      ['noun', 'The <b>ending</b> shows the job: <b>мама</b> (Mom does it), <b>маму</b> (it is done to Mom), <b>мами</b> (of Mom), <b>мамі</b> (to Mom), <b>з мамою</b> (with Mom), <b>мамо!</b> (calling her).'],
      ['noun', 'For people and animals, “what is done to them” looks like “of”: <b>я бачу брата</b>, <b>я бачу кішок</b>. Things stay as they are: <b>я бачу стіл</b>.'],
      ['adj', 'A describing word goes before its noun and matches it: <b>великий будинок</b>, <b>велика кішка</b>, <b>велике вікно</b>, <b>у великому будинку</b>.'],
      ['verb', 'The ending shows who: <b>читаю</b> (I), <b>читаєш</b> (you), <b>читає</b> (he/she), <b>читаємо</b> (we), <b>читаєте</b> (you all), <b>читають</b> (they).'],
      ['verb', 'Verbs come in pairs: <b>читати</b> (reading, again and again) and <b>прочитати</b> (read to the end, once). The present tense uses the first one.'],
      ['prep', '<b>у / в</b> and <b>з / із / зі</b> are the same word: Ukrainian picks the one that is easier to say (<b>я живу в місті</b>, <b>брат у школі</b>, <b>зі мною</b>).'],
      ['adv', '<b>не</b> goes right before the verb. <b>ніколи</b> needs <b>не</b> too: <b>я ніколи не п\'ю каву</b>.'],
      ['pron', 'Ukrainian has no “the” or “a”: <b>книга</b> is “the book” or “a book”.'] ] } };
esvRegister('uk');
