'use strict';
/* ================= Sentence Builder · 📖 Real sentences: Swedish, Norwegian and Danish word types and meanings =================
   One file for all three: each language's closed word lists, the Sentence Builder's words (NO_LANG), the word lists in
   rsdict-nordic.js and a few safe rules. Words that can be two things are decided from their neighbours or left without a
   label: den / det / de ("the" or "it / they"), för / for, om, så, var, ved. Danish "I" (you, always a capital letter) is a
   pronoun, not a name. Loaded after rstag.js, rsdict-nordic.js and the builder-nordic.js files. */
RS_LANGS.sv = 'Swedish'; RS_LANGS.nb = 'Norwegian'; RS_LANGS.da = 'Danish';
RS_CLOSED.sv = { art: RS_W('en ett'), clArt: RS_W('den det de'), flex: new Set(), clitic: new Set(),
  det: RS_W('min mitt mina din ditt dina hans hennes dess vår vårt våra ert era deras denna detta dessa varje alla några ingen inget inga någon något båda andra annan annat sådan sådant sådana vilken vilket vilka två tre fyra fem sex sju åtta nio tio hundra tusen'),
  pron: RS_W('jag du han hon vi ni mig dig honom henne oss dem sig hen vem vad ingenting allting själv varandra mej dej'),
  prep: RS_W('i på till från med av under över efter före utan mot vid hos genom mellan bakom framför bredvid åt ur kring trots inom längs'),
  conj: RS_W('och men eller att eftersom när som medan fast innan tills både varken'),
  adv: RS_W('inte aldrig alltid ofta redan också bara mycket väldigt jättegärna gärna här där nu då idag imorgon igår snart kanske verkligen nog ju bort hem hemma ute inne upp ner ut in fortfarande igen tillsammans ganska mer mest hur varför ja nej tyvärr kvar ännu sen sent tidigt hit dit därför heller förstås väl lika precis'),
  verb: RS_W('är var vara varit blir blev bli blivit har hade ha haft kan kunde kunna vill ville vilja ska skulle måste får fick få gör gjorde göra gjort går gick gå kommer kom komma ser såg se säger sa sade säga vet visste veta tror trodde tycker tyckte heter finns fanns står stod ligger låg tar tog ge ger gav brukar behöver vet') };
RS_CLOSED.da = { art: RS_W('en et'), clArt: RS_W('den det de'), flex: new Set(), clitic: new Set(),
  det: RS_W('min mit mine din dit dine hans hendes dens dets vores jeres deres denne dette disse hver alle nogle ingen intet nogen noget begge anden andet andre sådan sådanne hvilken hvilket hvilke to tre fire fem seks syv otte ni ti hundrede tusind'),
  pron: RS_W('jeg du han hun vi mig dig ham hende os jer dem sig man hvem hvad ingenting alting selv hinanden'),
  prep: RS_W('i på til fra med af over under efter uden mod hos gennem mellem bag foran langs blandt'),
  conj: RS_W('og men eller at fordi når mens som hvis indtil både hverken'),
  adv: RS_W('ikke aldrig altid ofte allerede også bare meget her der nu snart måske virkelig nok jo væk hjem hjemme ude inde op ned ud ind stadig igen sammen ret mere mest hvordan hvorfor hvor ja nej gerne tit desværre lige endnu sent tidligt derfor heller selvfølgelig vel lidt'),
  verb: RS_W('er var være været bliver blev blive blevet har havde have haft kan kunne vil ville skal skulle må måtte får fik få gør gjorde gøre gjort går gik gå kommer kom komme ser sagde siger sige vidste vide tror troede synes syntes hedder findes står stod ligger lå tager tog giver gav plejer') };
RS_CLOSED.nb = { art: RS_W('en ei et'), clArt: RS_W('den det de'), flex: new Set(), clitic: new Set(),
  det: RS_W('min mi mitt mine din di ditt dine hans hennes dens dets vår vårt våre deres denne dette disse hver alle noen ingen noe begge annen annet andre sånn sånne hvilken hvilket hvilke to tre fire fem seks sju syv åtte ni ti hundre tusen'),
  pron: RS_W('jeg du han hun vi dere meg deg ham henne oss dem seg man hvem hva ingenting selv hverandre'),
  prep: RS_W('i på til fra med av over under etter uten mot hos gjennom mellom bak foran langs blant'),
  conj: RS_W('og men eller at fordi når da mens som hvis enten både verken'),
  adv: RS_W('ikke aldri alltid ofte allerede også bare veldig her der nå snart kanskje virkelig nok jo bort hjem hjemme ute inne opp ned ut inn fortsatt igjen sammen ganske litt mer mest hvordan hvorfor hvor ja nei gjerne dessverre ennå sent tidlig derfor heller selvfølgelig vel akkurat'),
  verb: RS_W('er var være vært blir ble bli blitt har hadde ha hatt kan kunne vil ville skal skulle må måtte får fikk få gjør gjorde gjøre gjort går gikk gå kommer kom komme ser sa sier si vet visste vite tror trodde synes syntes heter fins finnes står sto stod ligger lå tar tok gir ga pleier') };
const RS_NO = new Set(['sv', 'nb', 'da']);
const RS_NO_SUBJ = { sv: RS_W('jag du han hon vi ni de man hen'), nb: RS_W('jeg du han hun vi dere de man'), da: RS_W('jeg du han hun vi i de man') };
const RS_NO_INF = { sv: 'att', nb: 'å', da: 'at' };
// the Sentence Builder's words, for types and meanings
const RS_NO_LEX = {};
function rsNoLex(lang) {
  if (RS_NO_LEX[lang]) return RS_NO_LEX[lang];
  const m = new Map(), L = typeof NO_LANG !== 'undefined' ? NO_LANG[lang] : null, put = (w, t, g) => { w = String(w || '').toLowerCase(); if (w && !m.has(w)) m.set(w, [t, g || '']); };
  if (L) {
    L.N.forEach(n => { put(n.w, 'noun', n.en); put(n.def, 'noun', 'the ' + n.en); if (n.pl) { put(n.pl, 'noun', n.enPl); put(n.dpl, 'noun', 'the ' + n.enPl); } });
    L.V.forEach(v => { put(v.inf, 'verb', v.t === 'modal' ? v.en : 'to ' + v.en); put(v.pres, 'verb', v.t === 'modal' ? v.en : v.en); });
    Object.entries(L.irreg).forEach(([inf, p]) => { put(inf, 'verb'); put(p, 'verb'); });
    L.A.forEach(a => [a.b, a.t, a.e, a.dsg, a.pl, a.f].forEach(w => put(w, 'adj', a.en)));
    L.adv.forEach(a => put(a[0], 'adv', a[1]));
    L.pron.forEach(p => { put(p[0], 'pron', p[2]); put(p[1], 'pron', p[3]); });
    L.poss.forEach(p => Object.values(p.f).forEach(w => put(w, 'det', p.en)));
  }
  return (RS_NO_LEX[lang] = m);
}
function rsNoTag(w, i, low, lang) {
  const C = RS_CLOSED[lang], prev = low[i - 1] || '', lex = rsNoLex(lang);
  if (lex.has(w) && !C.clArt.has(w)) return lex.get(w)[0];
  if (/^(\p{L}+)(lig|ligt|liga|lige)$/u.test(w) && w.length > 5) return 'adj';
  if (RS_NO_SUBJ[lang].has(prev) && /(ar|er|ir|or|ur|de|te|dde|tte)$/.test(w) && w.length > 3) return 'verb';   // jag talar, han spiser, vi pratade
  if (prev === RS_NO_INF[lang] && (lang === 'nb' ? /e$|[åai]$/.test(w) : lang === 'sv' ? /a$/.test(w) : /e$/.test(w)) && w.length > 2) return 'verb';   // att springa, å løpe, at løbe
  return null;
}
{ const prev = rsTagWord; rsTagWord = function (w, i, low, lang) { const t = prev(w, i, low, lang); if (!RS_NO.has(lang) || t != null || RS_CLOSED[lang].clArt.has(w)) return t; return rsNoTag(w, i, low, lang); }; }
{ const prev = rsTagSentence; rsTagSentence = function (words, lang) {
  const out = prev(words, lang); if (!RS_NO.has(lang)) return out;
  const low = words.map(w => w.toLowerCase().replace(/[.,!?;:«»"“”()]/g, ''));
  for (let i = 0; i < words.length; i++) {
    if (lang === 'da' && /^I$/.test(words[i].replace(/[.,!?;:]/g, '')) && (i > 0 || RS_CLOSED.da.verb.has(low[1] || '') || out[1] === 'verb') && !/^(går|morgen|dag|aften|nat|år)$/.test(low[i + 1] || '')) out[i] = 'pron';   // Danish "I" = you (all of you)
    if (RS_CLOSED[lang].clArt.has(low[i]) && out[i + 1] === 'verb' && out[i] === 'det') out[i] = 'pron';
    if (low[i] === 'i' && /^(går|igår|dag|morgon|morgen|kveld|kväll|aften|natt|nat|fjor|år)$/.test(low[i + 1] || '')) { out[i] = 'adv'; out[i + 1] = 'adv'; }   // i går, i morgon, i dag: one adverb
  }
  return out;
}; }
/* meanings under the words */
RS_GLOSS_COMMON.sv = 'är:is / are|var:was / were|vara:to be|har:has / have|hade:had|kan:can|kunde:could|vill:want(s)|ville:wanted|ska:will / shall|skulle:would|måste:must|får:may / gets|fick:got|gör:does / makes|gjorde:did|går:goes|gick:went|kommer:comes|kom:came|ser:sees|såg:saw|säger:says|sa:said|vet:knows|tror:thinks|tycker:thinks (feels)|heter:is called|finns:there is / are|det:it / the|den:it / the|de:they / the|inte:not|och:and|men:but|att:that / to|som:who / that / as|om:about / if|för:for / too|så:so|en:a / one|ett:a / one|i:in|på:on / at|till:to|med:with|av:of / by|från:from|här:here|där:there|nu:now|mycket:very / a lot|bara:only / just|också:also|alla:all / everyone|man:one / man|mig:me|dig:you|sig:oneself|vad:what|vem:who|hur:how|varför:why|när:when|ja:yes|nej:no|tom:Tom|mary:Mary';
RS_GLOSS_COMMON.nb = 'er:is / are|var:was / were|være:to be|har:has / have|hadde:had|kan:can|kunne:could|vil:want(s) / will|ville:wanted|skal:will / shall|skulle:would|må:must|får:gets / may|fikk:got|gjør:does / makes|gjorde:did|går:goes|gikk:went|kommer:comes|kom:came|ser:sees|så:saw / so|sier:says|sa:said|vet:knows|tror:thinks|synes:thinks (feels)|heter:is called|det:it / the|den:it / the|de:they / the|ikke:not|og:and|men:but|at:that|å:to|som:who / that / as|om:about / if|for:for / too|en:a / one|ei:a / one|et:a / one|i:in|på:on / at|til:to|med:with|av:of / by|fra:from|her:here|der:there|nå:now|veldig:very|bare:only / just|også:also|alle:all / everyone|man:one|meg:me|deg:you|seg:oneself|hva:what|hvem:who|hvordan:how|hvorfor:why|når:when|ja:yes|nei:no|tom:Tom|mary:Mary';
RS_GLOSS_COMMON.da = 'er:is / are|var:was / were|være:to be|har:has / have|havde:had|kan:can|kunne:could|vil:want(s) / will|ville:wanted|skal:will / shall|skulle:would|må:may / must|får:gets|fik:got|gør:does / makes|gjorde:did|går:goes|gik:went|kommer:comes|kom:came|ser:sees|så:saw / so|siger:says|sagde:said|ved:knows / by|tror:thinks|synes:thinks (feels)|hedder:is called|det:it / the|den:it / the|de:they / the|ikke:not|og:and|men:but|at:that / to|som:who / that / as|om:about / if|for:for / too|en:a / one|et:a / one|i:in|på:on / at|til:to|med:with|af:of / by|fra:from|her:here|der:there|nu:now|meget:very / a lot|bare:only / just|også:also|alle:all / everyone|man:one|mig:me|dig:you|sig:oneself|hvad:what|hvem:who|hvordan:how|hvorfor:why|når:when|ja:yes|nej:no|tom:Tom|mary:Mary';
{ const prev = rsGlossMap; rsGlossMap = function (lang) {
  const m = prev(lang); if (!RS_NO.has(lang) || m._no) return m; m._no = true;
  for (const [w, [, g]] of rsNoLex(lang)) if (g && !m.has(w)) m.set(w, g);
  return m;
}; }
