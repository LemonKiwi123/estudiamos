'use strict';
/* ================= Sentence Builder · 📖 Real sentences: Latin word types and meanings =================
   Like rstag.js for Spanish and French: closed word lists (prepositions, pronouns, conjunctions…), every form the Latin
   Sentence Builder knows (puella, puellam, puellae…; amō, amās, amat…), the word list in rsdict-la (RS_DICT_SRC.la) and your
   cards' 🏷️ word labels, then a few endings that only verbs have (-unt, -ābat…). A word that can't be tagged with
   confidence gets no label rather than a wrong one. Real Latin sentences are mostly written without macrons and with v,
   so every lookup ignores macrons, i/j and u/v (laFold). Loaded after rstag.js and builder-la.js. */
const laF = w => String(w || '').normalize('NFD').replace(/[̄̆]/g, '').normalize('NFC').toLowerCase().replace(/j/g, 'i').replace(/v/g, 'u');
const LA_RS_W = s => new Set(s.split(/\s+/).filter(Boolean).map(laF));
RS_CLOSED.la = { art: new Set(), clArt: new Set(), flex: new Set(), clitic: new Set(),
  det: LA_RS_W('meus mea meum mei meae meo meam meos meas meorum mearum meis tuus tua tuum tui tuae tuo tuam tuos tuas tuis suus sua suum sui suae suo suam suos suas suis noster nostra nostrum nostri nostrae nostro nostram nostros nostras nostris vester vestra vestrum vestri vestrae vestro vestram vestros vestras vestris omnis omne omnes omnia omnium omnibus nullus nulla nullum multi multae multa multos multas multis alius alia aliud alii aliae aliis unus una unum duo duae tres tria quattuor quinque sex septem octo novem decem centum mille'),
  pron: LA_RS_W('ego me mihi mei mecum tu te tibi tui tecum nos nobis nobiscum vos vobis vobiscum se sibi sese secum is ea id eius ei eum eam eo eos eas eorum earum iis eis quis quid quem cui cuius qui quibus quos quas quorum quarum nemo nihil nil aliquis aliquid quisque quidquam quicquam ipse ipsa ipsum ipsi ipsos ipsas idem eadem'),
  prep: LA_RS_W('in ad ex e ab a abs de sine per post ante sub super inter contra apud propter trans prope circum ob pro prae praeter sine usque erga extra intra iuxta secundum ultra versus'),
  conj: LA_RS_W('et sed aut atque ac nec neque quod quia si nisi enim autem tamen igitur ergo nam vel an seu sive dum donec quamquam etsi quoniam'),
  adv: LA_RS_W('non iam nunc semper saepe numquam umquam hodie cras heri bene male ibi etiam quoque tam valde nimis mox diu tum tunc deinde postea iterum statim cur quomodo quando ita sic minime certe fortasse procul satis magis maxime multum paene vix modo solum tantum adhuc simul interdum cotidie domi foras hinc inde unde quidem ne num nonne mane vesperi ubique semel numquam alibi immo profecto vere facile libenter subito celeriter fortiter'),
  verb: LA_RS_W('sum es est sumus estis sunt eram eras erat eramus eratis erant fui fuisti fuit fuimus fuerunt ero eris erit erimus erunt esse fore sit sint esset essent possum potes potest possumus potestis possunt posse poterat poterant potuit volo vis vult volumus vultis volunt velle nolo non vult nolumus nolunt nolle malo mavult malle eo it imus itis eunt ire ibat iit fero fers fert ferimus fertis ferunt ferre fit fiunt fieri habeo habes habet habemus habetis habent scio scis scit sciunt nescio puto putas putat credo credis credit dicit dico dicunt venit veni venio vidit vidi video amo amas amat amant debeo debes debet debemus debent licet oportet placet') };
/* words that can be two things: decided from the word after them */
const LA_RS_TWO = { cum: 'prep/conj', quod: 'pron/conj', quam: 'pron/adv', quae: 'pron', ubi: 'adv', ut: 'conj', hic: 'det/adv', haec: 'det', hoc: 'det', ille: 'det', illa: 'det', illud: 'det', illi: 'det', illum: 'det', illam: 'det', illos: 'det', illas: 'det', illis: 'det', illorum: 'det', iste: 'det', ista: 'det', istud: 'det', huius: 'det', huic: 'det', hunc: 'det', hanc: 'det', hi: 'det', hae: 'det', hos: 'det', has: 'det', his: 'det', horum: 'det', harum: 'det', illius: 'det' };
let LA_RS_LEX = null, LA_RS_GLOSS = null;
function laRsLex() {
  if (LA_RS_LEX) return LA_RS_LEX;
  const m = new Map(), g = new Map(), two = new Set();
  const put = (w, t, en) => { const k = laF(w); if (!k) return; if (m.has(k) && m.get(k) !== t) two.add(k); else m.set(k, t); if (en && !g.has(k)) g.set(k, en); };
  if (typeof laWordList === 'function') for (const [w, en, t] of laWordList()) put(w, t, en);
  for (const k of two) m.delete(k);   // a form that is two kinds of word (it could be a noun or a verb): no label
  for (const [k, en] of Object.entries(LA_RS_COMMON)) if (!g.has(laF(k))) g.set(laF(k), en);
  LA_RS_GLOSS = g; return (LA_RS_LEX = m);
}
/* meanings of common little words that aren't in the Sentence Builder */
const LA_RS_COMMON = Object.fromEntries(('ego:I|me:me|mihi:to me|tu:you|te:you|tibi:to you|nos:we / us|nobis:to us|vos:you (all)|vobis:to you (all)|se:himself / herself|sibi:to himself / herself|'
  + 'is:he / this|ea:she / this|id:it|eius:his / her|ei:to him / her|eum:him|eam:her|eos:them|eas:them|eorum:their|earum:their|quis:who?|quid:what?|quem:whom|cui:to whom|qui:who|quae:who / which|quod:which / because|'
  + 'nemo:nobody|nihil:nothing|ipse:himself|meus:my|mea:my|meum:my|tuus:your|tua:your|tuum:your|suus:his / her own|sua:his / her own|noster:our|nostra:our|vester:your|omnis:every|omnes:all|omnia:everything|nullus:no|multi:many|multa:many / much|'
  + 'hic:this / here|haec:this / these|hoc:this|ille:that / he|illa:that / she|illud:that|in:in / into|ad:to|ex:out of|e:out of|ab:from / by|a:from / by|de:about / down from|sine:without|per:through|post:after|ante:before|sub:under|super:above|inter:between / among|contra:against|apud:at the house of|propter:because of|trans:across|prope:near|pro:for|'
  + 'et:and|sed:but|aut:or|atque:and|ac:and|nec:and not|neque:and not|quia:because|si:if|nisi:unless|enim:for|autem:however|tamen:however|igitur:therefore|ergo:so|nam:for|vel:or|dum:while|ut:so that / as|cum:with / when|ubi:where / when|'
  + 'non:not|iam:now / already|nunc:now|semper:always|saepe:often|numquam:never|hodie:today|cras:tomorrow|heri:yesterday|bene:well|male:badly|ibi:there|etiam:also / even|quoque:also|tam:so|valde:very|nimis:too much|mox:soon|diu:for a long time|tum:then|deinde:then|postea:afterwards|iterum:again|statim:at once|cur:why|quomodo:how|quando:when|ita:so / yes|sic:so / thus|minime:no / not at all|fortasse:perhaps|satis:enough|magis:more|maxime:most|paene:almost|vix:hardly|modo:only / just|solum:only|tantum:only|adhuc:still|simul:together|cotidie:every day|domi:at home|quam:than / how|ne:not|quidem:indeed|'
  + 'sum:I am|es:you are|est:is|sumus:we are|estis:you (all) are|sunt:are|erat:was|erant:were|fuit:was|esse:to be|possum:I can|potes:you can|potest:can|possunt:they can|posse:to be able|volo:I want|vis:you want|vult:wants|volunt:they want|nolo:I do not want|eo:I go|it:goes|eunt:they go|ire:to go|fert:carries|habet:has|scio:I know|nescio:I do not know|puto:I think|credo:I believe|dicit:says|venit:comes / came|vidit:saw|debeo:I must|debet:must|licet:it is allowed|placet:it pleases').split('|').map(p => { const i = p.indexOf(':'); return [p.slice(0, i), p.slice(i + 1)]; }));
const laRsDict = w => { if (typeof RS_DICT === 'undefined' || !RS_DICT.la) return null; if (!RS_DICT.la._f) { RS_DICT.la._f = new Map([...RS_DICT.la].filter(([k]) => k !== '_f').map(([k, v]) => [laF(k), v])); } return RS_DICT.la._f.get(laF(w)) || null; };
function laRsTag(w, i, low) {
  const C = RS_CLOSED.la, k = laF(w), nx = laF(low[i + 1] || '');
  if (!k || /^\d+$/.test(k)) return null;
  if (k === 'cum') return /(o|a|e|i|is|ibus|ubus|u|me|te|nobis|uobis)$/.test(nx) && !/^(non|ad|in|ex)$/.test(nx) ? 'prep' : null;   // cum + ablative = with; cum + a verb = when
  if (LA_RS_TWO[k] === 'det') { const t = nx ? laRsTag(low[i + 1], i + 1, low) : null; return t === 'noun' ? 'det' : null; }   // "hic liber" = this book; "hic" alone could be "here" or "he"
  if (LA_RS_TWO[k]) return null;
  if (C.prep.has(k)) return 'prep'; if (C.conj.has(k)) return 'conj'; if (C.pron.has(k)) return 'pron'; if (C.adv.has(k)) return 'adv'; if (C.det.has(k)) return 'det'; if (C.verb.has(k)) return 'verb';
  const d = laRsDict(k); if (d) return d[0];
  const lex = laRsLex(); if (lex.has(k)) return lex.get(k);
  const cards = typeof rsLex === 'function' ? rsLex('la') : null; if (cards?.has(String(w).toLowerCase())) return cards.get(String(w).toLowerCase());
  if (/que$/.test(k) && k.length > 5) { const t = laRsTag(k.slice(0, -3), i, low); if (t) return t; }   // "populusque" = "and the people"
  // endings only verbs have (long enough not to be a short noun)
  if (k.length >= 5 && /(unt|abat|abant|ebat|ebant|abam|ebam|auit|auerunt|iuerunt|erunt|isse|issent|isset|arent|erent|aret|eret|antur|untur|atur|amini|abimus|abitis|abunt|ebunt|ebimus)$/.test(k)) return 'verb';
  if (k.length >= 6 && /iter$/.test(k)) return 'adv';   // fortiter, celeriter
  return null;
}
if (typeof rsTagWord === 'function') { const tagAll = rsTagWord; rsTagWord = function (w, i, low, lang) { return lang === 'la' ? laRsTag(w, i, low) : tagAll(w, i, low, lang); }; }
if (typeof rsGloss === 'function') {
  const glossAll = rsGloss;
  rsGloss = function (word, lang) {
    if (lang !== 'la') return glossAll(word, lang);
    const w = String(word || '').toLowerCase().replace(/[.,!?;:«»"“”()]/g, ''), k = laF(w);
    const d = laRsDict(k); if (d?.[1]) return d[1];
    laRsLex(); if (LA_RS_GLOSS.has(k)) return LA_RS_GLOSS.get(k);
    const own = glossAll(word, lang); if (own) return own;
    if (/que$/.test(k) && k.length > 5) { const b = rsGloss(w.slice(0, -3), lang); if (b) return 'and ' + b; }
    return '';
  };
}
