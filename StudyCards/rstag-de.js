'use strict';
/* ================= Sentence Builder · 📖 Real sentences: German word types and meanings =================
   Closed word lists, the Sentence Builder's German words, the word list in rsdict-de.js and a few safe rules. A capital
   letter inside a sentence means a noun (Hund, das Essen), except Sie / Ihnen / Ihr (the polite "you"). A word the code
   can't tag with confidence gets no label. Loaded after rstag.js and rsdict-de.js. */
RS_LANGS.de = 'German';
RS_CLOSED.de = {
  art: RS_W('der die das den dem des ein eine einen einem einer eines'),
  // a determiner before a noun (mein Buch), a pronoun on its own (das ist meins, alle wissen es)
  det: RS_W('mein meine meinen meinem meiner meines dein deine deinen deinem deiner deines sein seine seinen seinem seiner seines ihr ihre ihren ihrem ihrer ihres unser unsere unseren unserem unserer unseres euer eure euren eurem eurer eures '
    + 'dieser diese dieses diesen diesem jener jene jenes jenen jenem kein keine keinen keinem keiner keines jeder jede jedes jeden jedem welcher welche welches welchen welchem alle allen aller viele vielen wenige wenigen einige einigen einiges mehrere beide beiden solche solchen andere anderen anderer anderes anderem manche'),
  num: RS_W('zwei drei vier fünf sechs sieben acht neun zehn elf zwölf dreizehn zwanzig dreißig hundert tausend'),
  clArt: new Set(), flex: new Set(), clitic: new Set(),
  pron: RS_W('ich du er sie es wir mich dich ihn uns euch mir dir ihm ihnen sich man wer was wen wem wessen etwas nichts jemand jemanden jemandem niemand niemanden niemandem einander irgendetwas irgendwas irgendjemand alles selber deren dessen denen meins deins keins'),
  prep: RS_W('in im ins an am ans auf aufs aus bei beim durch durchs für fürs gegen hinter mit nach neben ohne seit über unter um vom von vor wegen zum zur zwischen trotz außer entlang während bis pro'),
  conj: RS_W('und oder aber sondern dass weil wenn ob obwohl als denn bevor ehe nachdem sobald solange falls indem sodass'),
  adv: RS_W('nicht nie niemals immer schon noch sehr so zu hier da dort heute morgen gestern vorgestern jetzt nun bald oft manchmal häufig wieder mal einmal zweimal dreimal nur auch doch ja nein wohl denn eben mehr weniger viel wenig genug fast kaum gern gerne lieber vielleicht wirklich eigentlich endlich natürlich sogar noch allzu zuerst dann danach damals vorher später früher '
    + 'warum wann wo wie woher wohin wieso weshalb womit wofür wovon woran worüber worauf dabei dafür damit daran darauf daraus darin darüber darum davon davor dazu dagegen hierher dorthin hin her weg zurück fort raus rein los oben unten drin draußen drüben vorne vorn hinten links rechts zusammen gemeinsam miteinander nebenan überall irgendwo irgendwie irgendwann irgendwohin nirgendwo sonst sofort gerade eher etwa ungefähr ziemlich überhaupt besonders zumindest wenigstens also trotzdem deshalb deswegen jedoch '
    + 'abends morgens nachmittags nachts montags sonntags neulich diesmal nochmal anders genauso ebenso bereits bisher seitdem soweit weiter vorbei zuvor zuviel hinaus hinein hinunter herein heraus hinauf hingegen ganz selbst sogleich beinahe normalerweise vermutlich hoffentlich leider zufällig aussen irgend zwar kürzlich gar egal je völlig bestimmt plötzlich jederzeit unbedingt äußerst drinnen umsonst bloß mindestens schließlich anscheinend möglicherweise stundenlang jemals worum wozu wonach heutzutage runter dran soviel zuhause doppelt allmählich knapp'),
  verb: RS_W('bin bist ist sind seid war warst waren wart sei seien wäre wärst wärest wären gewesen habe hast hat haben habt hatte hattest hatten hattet hätte hättest hätten hättet gehabt hab werde wirst wird werden werdet wurde wurden würde würdest würden würdet geworden worden '
    + 'kann kannst können könnt konnte konntest konnten könnte könntest könnten könntet gekonnt will willst wollen wollt wollte wolltest wollten wolltet muss musst müssen müsst musste mussten müsste müssten darf darfst dürfen dürft durfte durften dürfte soll sollst sollen sollt sollte solltest sollten solltet mag magst mögen mögt mochte möchte möchtest möchten möchtet weiß weißt wissen wisst wusste wusstest wussten wüsste gewusst '
    + 'lass lasst gib nimm sieh lies sprich hilf iss vergiss komm geh mach sag hör schau bleib sei warte halt bring hol ruf fang schreib spiel lauf stell setz leg zeig denk glaub kauf frag lern trink wirf tu tue tust tut tun tat täte'),
};
// the Sentence Builder's German words and irregular verb forms (lowercase), for tags
let RS_DE_LEX = null;
function rsDeLex() {
  if (RS_DE_LEX) return RS_DE_LEX;
  const m = new Map(), put = (w, t, g) => { w = String(w || '').toLowerCase(); if (w && !m.has(w)) m.set(w, [t, g]); };
  if (typeof DE_VERB !== 'undefined') {
    DE_VERB.forEach(v => { put(v.inf, 'verb', 'to ' + v.en); v.f.forEach(w => { if (!v.part) put(w, 'verb', v.en); else put(v.part + w, 'verb', v.en); }); });
    Object.entries(DE_IRREG_FORMS).forEach(([inf, f]) => { put(inf, 'verb', ''); f.split(' ').forEach(w => put(w, 'verb', '')); });
    DE_ADJ.forEach(a => { put(a.pred, 'adj', a.en); ['e', 'en', 'er', 'es', 'em'].forEach(e => put(a.stem + e, 'adj', a.en)); });
  }
  return (RS_DE_LEX = m);
}
const rsDeLow = w => String(w || '').toLowerCase().replace(/[.,!?;:«»„"“”()]/g, '');
const RS_DE_POLITE = /^(Sie|Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihres|Du|Dich|Dir|Dein|Deine)$/;
const RS_DE_AUX = /^(bin|bist|ist|sind|seid|war|warst|waren|sei|wäre|wären|habe|hast|hat|haben|habt|hatte|hattest|hatten|hätte|hättest|hätten|hab|werde|wirst|wird|werden|wurde|wurden|würde|worden)$/;
const RS_DE_MODAL = /^(kann|kannst|können|könnt|konnte|konnten|könnte|könntest|könnten|will|willst|wollen|wollt|wollte|wolltest|wollten|muss|musst|müssen|musste|mussten|müsste|darf|darfst|dürfen|durfte|soll|sollst|sollen|sollte|solltest|sollten|möchte|möchtest|möchten|werde|wirst|wird|werden|würde|würdest|würden|lass|lassen|lasst)$/;
const RS_DE_SEP = /^(an|auf|aus|ab|ein|mit|vor|nach|bei|um|durch|über|unter|zu|weg|los|fest|statt|teil|fern|zurück|her|hin|vorbei|heraus|herein)$/;
function rsDeTagSentence(words) {
  const C = RS_CLOSED.de, lex = rsDeLex(), dict = RS_DICT.de, n = words.length, low = words.map(rsDeLow), raw = words.map(w => String(w).replace(/[.,!?;:«»„"“”()]/g, ''));
  const ends = i => i === n - 1 || /[.,!?;:]$/.test(words[i]) || /^(und|oder|aber|als|wie)$/.test(low[i + 1]);   // the end of a clause
  const cap = i => i > 0 && /^[A-ZÄÖÜ]/.test(raw[i]) && !RS_DE_POLITE.test(raw[i]) && !C.conj.has(low[i]);
  const isNoun = i => i >= 0 && i < n && (cap(i) || i === 0 && /^[A-ZÄÖÜ]/.test(raw[0]) && RS_DE_NOUN_MAP.has(raw[0]) && !dict.has(low[0]) && !C.adv.has(low[0]) && !C.verb.has(low[0]));
  const isAdj = w => dict.get(w)?.[0] === 'adj' || lex.get(w)?.[0] === 'adj';
  const known = w => C.art.has(w) || C.det.has(w) || C.pron.has(w) || C.prep.has(w) || C.conj.has(w) || C.adv.has(w) || C.verb.has(w) || dict.has(w) || lex.has(w);
  // does a noun follow, with only describing words between? (das neue Auto, eine sehr gute Idee)
  const nounAfter = i => { for (let k = i + 1; k < Math.min(n, i + 5); k++) { if (isNoun(k)) return true; const w = low[k]; if (/[.,!?;:]$/.test(words[k - 1])) return false;
    if (isAdj(w) || C.num.has(w) || /^(sehr|so|ganz|zu|ziemlich|andere|anderen|anderer|anderes|beiden|vielen|einzige|meisten|selben|gleichen)$/.test(w) || (!known(w) && /(e|en|er|es|em)$/.test(w))) continue; return false; } return false; };
  const out = words.map((_, i) => {
    const w = low[i]; if (!w) return null;
    if (i > 0 && RS_DE_POLITE.test(raw[i])) return /^(Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihres|Dein|Deine)$/.test(raw[i]) && nounAfter(i) ? 'det' : 'pron';
    if (isNoun(i)) return 'noun';
    if (C.art.has(w)) return nounAfter(i) ? 'det' : 'pron';
    if (w === 'sein') return nounAfter(i) ? 'det' : 'verb';
    if (w === 'alles') return 'pron';
    if (C.det.has(w)) return nounAfter(i) ? 'det' : 'pron';
    if (C.num.has(w)) return nounAfter(i) ? 'det' : null;
    if (C.pron.has(w)) return 'pron';
    if (w === 'zu') return /^(sehr|viel|wenig|oft|früh)$/.test(low[i + 1]) || isAdj(low[i + 1] || '') && !nounAfter(i) ? 'adv' : low[i + 1] === 'sein' && !nounAfter(i + 1) ? null : nounAfter(i) || C.art.has(low[i + 1]) || C.det.has(low[i + 1]) || C.pron.has(low[i + 1]) ? 'prep' : null;
    if (w === 'um') return low.slice(i + 1).some((x, k) => x === 'zu' || /^(an|auf|aus|ab|ein|mit|vor)zu/.test(x)) && /[,]$/.test(words[i - 1] || ',') ? 'conj' : ends(i) ? 'adv' : 'prep';
    if (w === 'da' || w === 'damit') return w === 'damit' && /,$/.test(words[i - 1] || '') ? 'conj' : 'adv';
    if (w === 'denn') return /,$/.test(words[i - 1] || '') ? 'conj' : 'adv';
    if (w === 'während' || w === 'bis' || w === 'seit') return C.pron.has(low[i + 1]) && low[i + 1] !== 'uns' ? 'conj' : 'prep';
    if (RS_DE_SEP.test(w) && i > 0 && ends(i)) return 'adv';   // the part of a verb that splits: "Ruf mich an!"
    if (C.prep.has(w)) return 'prep';
    if (C.conj.has(w)) return 'conj';
    if (w === 'morgen' || w === 'recht') return w === 'recht' ? null : 'adv';
    if (C.adv.has(w)) return 'adv';
    if (C.verb.has(w)) return 'verb';
    if (dict.has(w)) return dict.get(w)[0];
    if (lex.has(w)) return lex.get(w)[0];
    const r = rsLex('de'); if (r.has(w)) return r.get(w);   // your own cards' word labels
    const before = low.slice(0, i);
    if (/ier(en|t|te|ten|st)$/.test(w) && w.length > 6) return 'verb';
    if (i === 1 && /^(ich|du|er|sie|es|wir|ihr|man|wer)$/.test(low[0]) && /(e|st|t|en|te|ten)$/.test(w)) return 'verb';   // the verb comes second
    if (ends(i) && before.some(x => RS_DE_AUX.test(x)) && /ge[a-zäöüß]{2,}(t|en)$/.test(w)) return 'verb';   // "habe … gemacht"
    if (ends(i) && before.some(x => RS_DE_MODAL.test(x)) && /[a-zäöüß]{3,}(en|ern|eln)$/.test(w)) return 'verb';        // "will … lernen"
    if (low[i - 1] === 'zu' && /[a-zäöüß]{3,}(en|ern|eln)$/.test(w)) return 'verb';                                     // "zu verstehen"
    if (/[a-z]zu[a-zäöüß]{3,}en$/.test(w) && RS_DE_SEP.test(w.split('zu')[0])) return 'verb';                           // "anzurufen"
    if ((C.art.has(low[i - 1]) || C.det.has(low[i - 1])) && /(e|en|er|es|em)$/.test(w) && isNoun(i + 1)) return 'adj';  // "das alte Haus"
    return null;
  });
  // lowercase words with two jobs, decided by the words around them
  for (let i = 0; i < n; i++) {
    // "einen guten Freund", "das passierte": a word like "arbeitete Mann" never happens, but -e/-en before a noun after an article is a describing word
    if (out[i] === 'verb' && !C.verb.has(low[i]) && (C.art.has(low[i - 1]) || C.det.has(low[i - 1])) && out[i - 1] === 'det' && isNoun(i + 1)) out[i] = 'adj';
    if (out[i] === 'noun' && i === 0 && dict.has(low[0])) out[i] = dict.get(low[0])[0];
  }
  return out;
}
{ const prevSent = rsTagSentence; rsTagSentence = function (words, lang) { return lang === 'de' ? rsDeTagSentence(words) : prevSent(words, lang); }; }
{ const prevTag = rsTagWord; rsTagWord = function (w, i, low, lang) { return lang === 'de' ? (rsDeTagSentence([w])[0]) : prevTag(w, i, low, lang); }; }

/* meanings for the word tags */
RS_GLOSS_COMMON.de = "der:the|die:the|das:the / that|den:the|dem:the (to the)|des:of the|ein:a|eine:a|einen:a|einem:a|einer:a|eines:a / of a|ich:I|du:you|er:he|sie:she / they|es:it|wir:we|ihr:you (all) / her|mich:me|dich:you|ihn:him|uns:us|euch:you (all)|mir:me (to me)|dir:you (to you)|ihm:him (to him)|ihnen:them (to them)|sich:oneself|man:one / people|wer:who|was:what|wen:whom|wem:to whom|etwas:something|nichts:nothing|jemand:someone|jemanden:someone|jemandem:to someone|niemand:nobody|niemanden:nobody|niemandem:to nobody|einander:each other|alles:everything"
  + "|mein:my|meine:my|meinen:my|meinem:my|meiner:my / mine|dein:your|deine:your|deinen:your|deinem:your|deiner:your|sein:his / to be|seine:his|seinen:his|seinem:his|seiner:his|ihre:her / their|ihren:her / their|ihrem:her / their|ihrer:her / their|unser:our|unsere:our|unseren:our|unserem:our|unserer:our|euer:your|eure:your|euren:your|eurem:your|dieser:this|diese:this / these|dieses:this|diesen:this|diesem:this|kein:no|keine:no|keinen:no|keinem:no|keiner:nobody|jeder:every / everyone|jede:every|jedes:every|jeden:every|jedem:every|welche:which|welcher:which|welches:which|welchen:which|alle:all|allen:all|viele:many|vielen:many|einige:some|einigen:some|mehrere:several|beide:both|beiden:both|andere:other|anderen:other|anderer:other|anderes:other|solche:such"
  + "|zwei:two|drei:three|vier:four|fünf:five|sechs:six|sieben:seven|acht:eight|neun:nine|zehn:ten|zwanzig:twenty|dreißig:thirty|hundert:hundred|in:in|im:in the|ins:into the|an:on / at|am:at the / on the|ans:to the|auf:on / at|aufs:onto the|aus:out of / from|bei:at / with|beim:at the / while|durch:through|für:for|fürs:for the|gegen:against|hinter:behind|mit:with|nach:to / after|neben:next to|ohne:without|seit:since|über:over / about|unter:under|um:around / at|vom:from the|von:from / of|vor:in front of / ago|wegen:because of|zum:to the|zur:to the|zwischen:between|trotz:despite|außer:except|während:during / while|bis:until"
  + "|und:and|oder:or|aber:but|sondern:but rather|dass:that|weil:because|wenn:if / when|ob:whether|obwohl:although|als:as / than / when|denn:because / then|bevor:before|ehe:before|nachdem:after|sobald:as soon as|solange:as long as|falls:in case|nicht:not|nie:never|niemals:never|immer:always|schon:already|noch:still|sehr:very|so:so|zu:to / too|hier:here|da:there|dort:there|heute:today|morgen:tomorrow|gestern:yesterday|jetzt:now|nun:now|bald:soon|oft:often|manchmal:sometimes|wieder:again|mal:once / just|einmal:once|nur:only|auch:also|doch:but / after all|ja:yes|nein:no|wohl:probably|mehr:more|weniger:less|viel:much|wenig:little|genug:enough|fast:almost|kaum:hardly|gern:gladly|gerne:gladly|lieber:rather|vielleicht:maybe|wirklich:really|eigentlich:actually|endlich:finally|natürlich:of course|sogar:even|dann:then|danach:after that|damals:back then"
  + "|warum:why|wann:when|wo:where|wie:how / like|woher:from where|wohin:where to|wieso:why|dabei:with it|dafür:for it|damit:with it / so that|daran:of it|darauf:on it|darin:in it|darüber:about it|darum:that’s why|davon:of it|dazu:to it|dagegen:against it|hierher:here|dorthin:there|hin:there|her:here|weg:away|zurück:back|raus:out|los:off|oben:above|unten:below|draußen:outside|drüben:over there|links:left|rechts:right|zusammen:together|überall:everywhere|irgendwo:somewhere|irgendwie:somehow|irgendwann:sometime|sonst:otherwise|sofort:right away|gerade:just now|eher:rather|etwa:about|ungefähr:about|ziemlich:quite|überhaupt:at all|besonders:especially|also:so|trotzdem:anyway|deshalb:that’s why|selbst:self / even|gar:at all|bisschen:a little|egal:all the same|je:ever|völlig:completely|bestimmt:certainly|plötzlich:suddenly|jederzeit:any time|unbedingt:definitely|äußerst:extremely|drinnen:inside|umsonst:for nothing|bloß:just|mindestens:at least|schließlich:finally|anscheinend:apparently|möglicherweise:possibly|jemals:ever|worum:about what|wozu:what for|heutzutage:nowadays|runter:down|dran:at it|zuhause:at home|doppelt:twice as|allmählich:gradually|paar:few|zuerst:first|denen:whom / those|nochmal:again|genauso:just as|morgens:in the morning|abends:in the evening|miteinander:with each other|zweimal:twice|dreimal:three times|meisten:most|normalerweise:normally|allzu:too|nebenan:next door|vermutlich:probably|solltet:should|mochte:liked|wussten:knew|hab:have|seien:be|manche:some|dies:this|meines:my|bereits:already|weiter:further|vorbei:over|beinahe:nearly|leider:unfortunately|zufällig:by chance"
  + "|bin:am|bist:are|ist:is|sind:are|seid:are|war:was|warst:were|waren:were|sei:be|wäre:would be|wären:would be|gewesen:been|habe:have|hast:have|hat:has|haben:have|habt:have|hatte:had|hattest:had|hatten:had|hätte:would have|hättest:would have|hätten:would have|gehabt:had|werde:will|wirst:will|wird:will / becomes|werden:will / become|wurde:was / became|wurden:were / became|würde:would|würdest:would|würden:would|geworden:become|worden:been|kann:can|kannst:can|können:can|könnt:can|konnte:could|konnten:could|könnte:could|könntest:could|könnten:could|will:want|willst:want|wollen:want|wollt:want|wollte:wanted|wolltest:wanted|wollten:wanted|muss:must|musst:must|müssen:must|musste:had to|mussten:had to|müsste:would have to|darf:may|darfst:may|dürfen:may|soll:should|sollst:should|sollen:should|sollte:should|solltest:should|sollten:should|mag:like|magst:like|mögen:like|möchte:would like|möchtest:would like|möchten:would like|weiß:know|weißt:know|wissen:know|wusste:knew|wüsste:would know|gewusst:known|lass:let|lasst:let|tun:to do|tut:does|tat:did|getan:done|gib:give|nimm:take|komm:come|geh:go|mach:do / make|sag:say|hör:listen|schau:look|bleib:stay|warte:wait";
{ const prevGloss = rsGloss;
  rsGloss = function (word, lang) {
    if (lang !== 'de') return prevGloss(word, lang);
    const w = String(word || '').replace(/[.,!?;:«»„"“”()]/g, ''), l = w.toLowerCase(), lowG = rsDeCommon().get(l) || RS_DICT.de.get(l)?.[1] || rsDeLex().get(l)?.[1] || '';
    if (/^(Sie|Ihnen)$/.test(w)) return w === 'Sie' ? 'you (polite) / she / they' : 'you (polite)';
    if (/^[A-ZÄÖÜ]/.test(w)) {
      const bn = typeof DE_NOUN !== 'undefined' ? DE_NOUN.find(x => x.cat !== 'feel' && (x.w === w || x.pl === w)) : null, nounG = RS_DE_NOUN_MAP.get(w) || (bn ? (bn.pl === w && bn.w !== w ? bn.enPl : bn.en) : '');
      if (nounG) return lowG && l !== 'hause' && !nounG.includes(lowG.replace(/^to /, '')) ? `${nounG} / ${lowG}` : nounG;
    }
    return lowG || prevGloss(word, lang);
  };
}
let RS_DE_COMMON = null;
function rsDeCommon() { return RS_DE_COMMON ||= new Map(RS_GLOSS_COMMON.de.split('|').map(x => { const i = x.indexOf(':'); return [x.slice(0, i), x.slice(i + 1)]; })); }
