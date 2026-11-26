'use strict';
/* ================= Sentence Builder · 📖 Real sentences: Dutch word types and meanings =================
   Closed word lists, the Sentence Builder's Dutch words, the word list in rsdict-nl.js and a few safe rules. Words with
   two jobs (die, dat, zijn, haar, ons, het…) are decided by the word after them. A word the code can't tag with
   confidence gets no label. Loaded after rstag.js, rsdict-nl.js and builder-nl.js. */
RS_LANGS.nl = 'Dutch';
RS_CLOSED.nl = {
  art: RS_W("de het een 't"),
  det: RS_W('deze dit mijn jouw uw onze hun elke ieder iedere alle sommige welk welke zo’n zo\'n zulke beide geen enkele menig'),
  // a determiner before a noun ("die man", "zijn hond"), a pronoun or verb on its own ("die is mooi", "wij zijn moe")
  dp: RS_W('die dat zijn haar ons jullie je'),
  num: RS_W('twee drie vier vijf zes zeven acht negen tien elf twaalf dertien veertien vijftien twintig dertig veertig vijftig honderd duizend'),
  flex: RS_W('veel weinig meer minder genoeg'), clArt: new Set(), clitic: new Set(),
  pron: RS_W("ik jij hij zij ze wij we u mij me jou hem hen zich mezelf jezelf zichzelf onszelf uzelf iemand niemand iets niets alles iedereen wat wie elkaar men mijne jouwe zijne hare onze"),
  prep: RS_W('in op aan naar met voor zonder bij van uit over onder tussen door tegen tot na achter naast om sinds tijdens volgens binnen buiten langs rond vanaf via per boven beneden behalve vanwege ondanks richting'),
  conj: RS_W('en of maar want dus omdat als toen terwijl hoewel zodat voordat nadat totdat tenzij wanneer zodra noch doordat ofschoon mits'),
  adv: RS_W('niet nooit altijd vaak soms ook al nog weer nu hier daar er waar hoe waarom vandaag morgen gisteren erg heel zeer zo graag samen alleen misschien echt toch wel even net pas thuis bijna ongeveer laat vroeg straks meteen ja nee daarom dan eerst later binnenkort overal nergens ergens zeker natuurlijk eigenlijk gewoon helemaal ver dichtbij beneden boven weg terug mee waarschijnlijk vooral zelfs ooit vanavond vanochtend vannacht morgenochtend steeds nogal best opnieuw buiten binnen tegelijk daarna toen'),
  verb: RS_W('ben bent is was waren geweest heb hebt heeft hebben had hadden gehad word wordt worden werd werden geworden kan kun kunt kunnen kon konden gekund wil wilt willen wou wilde wilden moet moeten moest moesten mag mogen mocht mochten zal zult zullen zou zouden ga gaat gaan ging gingen gegaan doe doet doen deed deden gedaan kom komt komen kwam kwamen gekomen weet weten wist wisten geweten zie ziet zien zag zagen gezien sta staat staan stond stonden gestaan zeg zegt zeggen zei zeiden gezegd ken kent kennen kende kenden gekend vind vindt vinden vond vonden gevonden krijg krijgt krijgen kreeg kregen gekregen denk denkt denken dacht dachten gedacht neem neemt nemen nam namen genomen geef geeft geven gaf gaven gegeven blijf blijft blijven bleef bleven gebleven lig ligt liggen lag lagen gelegen zit zitten zat zaten gezeten loop loopt lopen liep liepen gelopen'),
};
// the Sentence Builder's Dutch words and their forms (lowercase), for tags and meanings
let RS_NL_LEX = null;
function rsNlLex() {
  if (RS_NL_LEX) return RS_NL_LEX;
  const m = new Map(), put = (w, t, g) => { w = String(w || '').toLowerCase(); if (w && !m.has(w)) m.set(w, [t, g || '']); };
  if (typeof NL_NOUN !== 'undefined') {
    NL_VERB.forEach(v => { put(v.inf, 'verb', v.t === 'modal' ? v.en : 'to ' + v.en); v.f.forEach((w, i) => put(v.part ? v.part + w : w, 'verb', i === 2 ? v.en3 : v.en)); });
    Object.entries(NL_IRREG_FORMS).forEach(([inf, f]) => { put(inf, 'verb', ''); f.split(' ').forEach(w => put(w, 'verb', '')); });
    NL_NOUN.forEach(n => { put(n.w, 'noun', n.en); put(n.pl, 'noun', n.enPl || n.en); });
    NL_ADJ.forEach(a => { put(a.pred, 'adj', a.en); put(a.attr, 'adj', a.en); });
  }
  return (RS_NL_LEX = m);
}
const rsNlLow = w => String(w || '').toLowerCase().replace(/[.,!?;:«»"“”()]/g, '');
const RS_NL_AUX = /^(ben|bent|is|zijn|was|waren|heb|hebt|heeft|hebben|had|hadden|word|wordt|worden|werd|werden)$/;
const RS_NL_MODAL = /^(kan|kun|kunt|kunnen|kon|konden|wil|wilt|willen|wou|wilde|wilden|moet|moeten|moest|moesten|mag|mogen|mocht|mochten|zal|zult|zullen|zou|zouden|ga|gaat|gaan|ging|gingen|te|om|blijf|blijft|blijven|laat|laten|liet)$/;
const RS_NL_SUBJ = /^(ik|jij|je|hij|zij|ze|wij|we|jullie|u|het|men|er)$/;
function rsNlTag(w, i, low) {
  const C = RS_CLOSED.nl, lex = rsNlLex(), dict = RS_DICT_GET('nl', w);
  if (C.dp.has(w) || C.flex.has(w)) return null;      // decided from the next word
  if (w === 'het' || w === "'t") return null;          // the article or "it"
  if (C.art.has(w)) return 'det';
  if (C.det.has(w)) return 'det';
  if (C.num.has(w)) return 'det';
  if (C.pron.has(w)) return 'pron';
  if (C.prep.has(w)) return /^(op|mee|af|uit|aan|in|door|over|terug|weg|binnen|buiten|langs|na|voor|toe|bij|om)$/.test(w) && i > 1 && i === low.length - 1 ? 'adv' : w === 'om' && low[i + 1] === 'te' ? 'conj' : 'prep';   // "Ik bel je op.": the part of a verb that splits
  if (w === 'te') return null;
  if (C.conj.has(w)) return 'conj';
  if (C.adv.has(w)) return 'adv';
  if (C.verb.has(w)) return 'verb';
  if (dict) return dict[0];
  if (lex.has(w)) return lex.get(w)[0];
  const r = rsLex('nl'); if (r.has(w)) return r.get(w);   // your own cards' word labels
  const prev = low[i - 1] || '';
  if (/^[a-zëéïöü]{3,}(heid|ing|tie|schap|teit|isme|ment)$/.test(w) && !/^(ding|zing|ging)$/.test(w)) return 'noun';   // vrijheid, woning, informatie
  if (/^[a-zëéïöü]{2,}(tje|pje|kje|je|tjes|pjes|kjes|jes)$/.test(w)) return 'noun';                                   // diminutives: huisje, kopjes
  if (/^[a-zëéïöü]{3,}(lijk|lijke|ig|ige|isch|ische|baar|bare|loos|loze|zaam|zame)$/.test(w)) return 'adj';           // moeilijk, gelukkig, eetbaar
  if (prev === 'te' && /[a-zë]{2,}(en|n)$/.test(w)) return 'verb';                                                    // "te eten"
  if (RS_NL_AUX.test(prev) && /^ge[a-zë]{2,}(t|d|en)$/.test(w)) return 'verb';                                        // "heb gegeten", "is gebeurd"
  if (RS_NL_MODAL.test(prev) && /[a-zë]{3,}en$/.test(w)) return 'verb';                                               // "kan zwemmen", "ga slapen"
  if (i === 1 && RS_NL_SUBJ.test(low[0]) && /^[a-zëéïöü]{2,}$/.test(w) && !/(e|en)$/.test(w)) return 'verb';         // "Ik loop…": the verb comes second
  return null;
}
{ const prevTag = rsTagWord; rsTagWord = function (w, i, low, lang) { return lang === 'nl' ? rsNlTag(w, i, low) : prevTag(w, i, low, lang); }; }
{ const prevSent = rsTagSentence;
  rsTagSentence = function (words, lang) {
    if (lang !== 'nl') return prevSent(words, lang);
    const C = RS_CLOSED.nl, low = words.map(rsNlLow), n = words.length;
    const out = words.map((_, i) => rsNlTag(low[i], i, low));
    const isAdj = w => RS_DICT_GET('nl', w)?.[0] === 'adj' || rsNlLex().get(w)?.[0] === 'adj';
    const isNoun = k => out[k] === 'noun' || RS_DICT_GET('nl', low[k])?.[0] === 'noun' || rsNlLex().get(low[k])?.[0] === 'noun';
    // does a noun follow, with only describing words between? (die grote hond, zijn nieuwe auto)
    const nounAfter = i => { for (let k = i + 1; k < Math.min(n, i + 4); k++) { if (/[,;:]$/.test(words[k - 1])) return false; if (isNoun(k) || (k > 0 && /^[A-Z]/.test(words[k]) && k !== 0 && !C.pron.has(low[k]))) return true; if (isAdj(low[k]) || /^(heel|zeer|erg|zo|te)$/.test(low[k])) continue; return false; } return false; };
    for (let i = 0; i < n; i++) {
      const w = low[i];
      if (out[i] != null) continue;
      if (w === 'het' || w === "'t") out[i] = nounAfter(i) ? 'det' : 'pron';
      else if (w === 'zijn') out[i] = nounAfter(i) ? 'det' : 'verb';
      else if (['haar', 'ons', 'jullie', 'je'].includes(w)) out[i] = nounAfter(i) ? 'det' : 'pron';
      else if (w === 'die') out[i] = nounAfter(i) ? 'det' : 'pron';
      else if (w === 'dat') out[i] = nounAfter(i) ? 'det' : i === 0 || /^(is|was|zijn|waren|klopt|weet|kan|moet|wil|heb|heeft|ben)$/.test(low[i + 1] || '') && !/,$/.test(words[i - 1] || '') && i < 2 ? 'pron' : 'conj';
      else if (C.flex.has(w)) out[i] = nounAfter(i) ? 'det' : 'adv';
      else if (w === 'te') out[i] = isAdj(low[i + 1] || '') || /^(veel|weinig|laat|vroeg|snel)$/.test(low[i + 1] || '') ? 'adv' : null;
      // a name in the middle of the sentence
      else if (i > 0 && /^[A-ZÀ-Ý]/.test(words[i])) out[i] = 'noun';
      // after de / het / een / a preposition, a word no list knows is most likely a noun
      else if (i > 0 && (C.art.has(low[i - 1]) || out[i - 1] === 'det') && /^\p{L}{3,}$/u.test(w) && !/e$/.test(w)) out[i] = 'noun';
    }
    // "de grote hond": a word ending in -e between a determiner and a noun is a describing word
    for (let i = 1; i < n - 1; i++) if (out[i] == null && out[i - 1] === 'det' && isNoun(i + 1) && /e$/.test(low[i])) out[i] = 'adj';
    return out;
  };
}

/* meanings for the word tags */
RS_GLOSS_COMMON.nl = "de:the|het:the / it|een:a / one|'t:the / it|deze:this / these|dit:this|die:that / those / who|dat:that|mijn:my|jouw:your|je:you / your|zijn:his / to be / are|haar:her|ons:our / us|onze:our|jullie:you (all) / your|hun:their / them|uw:your (polite)"
  + "|ik:I|jij:you|hij:he|zij:she / they|ze:she / they / them|wij:we|we:we|u:you (polite)|mij:me|me:me|jou:you|hem:him|hen:them|zich:himself / herself / themselves|iemand:someone|niemand:nobody|iets:something|niets:nothing|alles:everything|iedereen:everyone|wat:what|wie:who|elkaar:each other|men:people / one"
  + "|elke:every|ieder:every|iedere:every|alle:all|sommige:some|welk:which|welke:which|geen:no / not a|beide:both|veel:a lot / many|weinig:little / few|meer:more|minder:less|genoeg:enough"
  + "|twee:two|drie:three|vier:four|vijf:five|zes:six|zeven:seven|acht:eight|negen:nine|tien:ten|elf:eleven|twaalf:twelve|twintig:twenty|honderd:hundred|duizend:thousand"
  + "|in:in|op:on / at|aan:on / at|naar:to|met:with|voor:for / before|zonder:without|bij:at / near|van:of / from|uit:out of / from|over:about / over|onder:under|tussen:between|door:through / by|tegen:against|tot:until|na:after|achter:behind|naast:next to|om:at / around|sinds:since|tijdens:during"
  + "|en:and|of:or / if|maar:but|want:because|dus:so|omdat:because|als:if / when / as|toen:when / then|terwijl:while|hoewel:although|zodat:so that|voordat:before|nadat:after|totdat:until|wanneer:when"
  + "|niet:not|nooit:never|altijd:always|vaak:often|soms:sometimes|ook:also|al:already|nog:still / yet|weer:again|nu:now|hier:here|daar:there|er:there|waar:where|hoe:how|waarom:why|vandaag:today|morgen:tomorrow / morning|gisteren:yesterday|erg:very|heel:very / whole|zeer:very|zo:so|te:too / to|graag:gladly (like to)|samen:together|alleen:only / alone|misschien:maybe|echt:really|toch:still / anyway|wel:indeed|even:for a moment|thuis:at home|bijna:almost|laat:late|vroeg:early|dan:then / than|eerst:first|later:later"
  + "|ben:am|bent:are|is:is|was:was|waren:were|geweest:been|heb:have|hebt:have|heeft:has|hebben:to have / have|had:had|hadden:had|gehad:had|word:become|wordt:becomes|worden:to become|werd:became|kan:can|kun:can|kunt:can|kunnen:to be able to|kon:could|wil:want|wilt:want|willen:to want|wilde:wanted|moet:must / have to|moeten:to have to|moest:had to|mag:may|mogen:to be allowed to|mocht:was allowed to|zal:will|zult:will|zullen:will|zou:would|zouden:would"
  + "|ga:go|gaat:goes|gaan:to go|ging:went|gingen:went|gegaan:gone|doe:do|doet:does|doen:to do|deed:did|gedaan:done|kom:come|komt:comes|komen:to come|kwam:came|gekomen:come|weet:know|weten:to know|wist:knew|zie:see|ziet:sees|zien:to see|zag:saw|gezien:seen|zeg:say|zegt:says|zeggen:to say|zei:said|gezegd:said|denk:think|denkt:thinks|dacht:thought|vind:find / think|vindt:finds / thinks|vond:found|krijg:get|krijgt:gets|kreeg:got|geef:give|geeft:gives|gaf:gave|zit:sit|zat:sat|lig:lie|ligt:lies|lag:lay|liep:walked|stond:stood|nam:took|bleef:stayed";
{ const prevMap = rsGlossMap;
  rsGlossMap = function (lang) {
    if (lang !== 'nl' || RS_GLOSS.nl) return prevMap(lang);
    const m = prevMap('nl');
    for (const [w, [, g]] of rsNlLex()) if (g && !m.has(w)) m.set(w, g);
    return m;
  };
}
