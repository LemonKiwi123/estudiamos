'use strict';
/* ================= Sentence Builder · 📖 Real sentences: Italian word types and meanings =================
   Closed word lists (articles, pronouns, prepositions with the article joined on: al, del, nel…), the Sentence Builder's
   Italian word lists, the Italian word list in rsdict-it.js and a few safe rules. A word the code can't tag with
   confidence gets no label. Elided words (l'amico, dell'acqua, c'è) are tagged by the word after the apostrophe.
   Loaded after rstag.js and rsdict-it.js; it plugs Italian into rsTagWord, rsTagSentence, rsGlossMap and rsGloss. */
RS_LANGS.it = 'Italian';
RS_CLOSED.it = {
  art: RS_W("il lo la l' i gli le un uno una un'"),
  det: RS_W("ogni qualche alcuni alcune ciascun ciascuna nessun nessuna altro altra altri altre qualsiasi qualunque due tre quattro cinque sette otto nove dieci venti cento mille"),
  // this / that / my…: a determiner before a noun ("questo libro"), a pronoun on its own ("questo è mio")
  dp: RS_W("questo questa questi queste quel quello quell' quella quei quegli quelle mio mia miei mie tuo tua tuoi tue suo sua suoi sue nostro nostra nostri nostre vostro vostra vostri vostre"),
  flex: RS_W('molto molta molti molte poco poca pochi poche tutto tutta tutti tutte tanto tanta tanti tante troppo troppa troppi troppe'),
  pron: RS_W("io tu lui lei noi voi loro me te sé esso essa essi esse ciò qualcosa niente nulla nessuno qualcuno chi cosa ognuno tutti"),
  clitic: RS_W("mi ti si ci vi ne li m' t' s' c' v' glielo gliela glieli gliele gliene me te"), clArt: RS_W("lo la le gli l'"),
  prep: RS_W("a ad di d' da in con su per tra fra senza sopra sotto dopo verso contro dentro durante tranne presso al allo all' alla ai agli alle del dello dell' della dei degli delle dal dallo dall' dalla dai dagli dalle nel nello nell' nella nei negli nelle sul sullo sull' sulla sui sugli sulle col"),
  conj: RS_W('e ed o od ma però perché che se quando mentre come né oppure quindi dunque poiché finché sebbene cioè anzi'),
  adv: RS_W("non sì no più meno già anche ancora sempre mai spesso qui qua lì là oggi domani ieri adesso ora poi presto tardi bene male così quasi solo soltanto davvero insieme forse subito dove allora prima appena mica piuttosto abbastanza neanche nemmeno neppure invece fuori vicino lontano infatti stasera stamattina ecco po' perciò dappertutto finalmente veramente sicuramente purtroppo"),
  verb: RS_W("è sono sei siamo siete era ero eri eravamo eravate erano fu fui furono stato stata stati state essere avere ho hai ha abbiamo avete hanno avevo avevi aveva avevamo avevano avuto andare vado vai va andiamo andate vanno andato andata fare faccio fai fa facciamo fate fanno fatto fatta detto dire dico dici dice diciamo dicono posso puoi può possiamo potete possono voglio vuoi vuole vogliamo volete vogliono devo devi deve dobbiamo dovete devono so sai sa sappiamo sapete sanno sto stai sta stiamo stanno piace piacciono piaceva sembra sembrano bisogna vorrei vorresti vorrebbe potrei potresti potrebbe dovrei dovresti dovrebbe sarà sarò sarebbe saremo saranno avrà avrò avrei c'è c'era ci sono") };
// the Sentence Builder's Italian words (nouns, adjectives, verbs and their forms), for tagging and meanings
let RS_IT_LEX = null;
function rsItLex() {
  if (RS_IT_LEX) return RS_IT_LEX;
  const m = new Map(), put = (w, t) => { if (w && !m.has(String(w).toLowerCase())) m.set(String(w).toLowerCase(), t); };
  if (typeof IT_NOUN !== 'undefined') {
    IT_VERB.forEach(v => { put(v[0], 'verb'); v[1].forEach(w => put(w, 'verb')); });
    Object.entries(IT_IRREG_FORMS).forEach(([inf, f]) => { put(inf, 'verb'); f.split(' ').forEach(w => put(w, 'verb')); });
    IT_NOUN.filter(n => n[3] !== 'feel').forEach(n => { put(n[0], 'noun'); put(n[1], 'noun'); });
    IT_ADJ.forEach(a => a.slice(0, 4).forEach(w => put(w, 'adj')));
    ['bel', "bell'", 'bei', 'begli', 'buon', "buon'"].forEach(w => put(w, 'adj'));
    ['fame', 'sete', 'paura', 'sonno'].forEach(w => put(w, 'noun'));
  }
  return (RS_IT_LEX = m);
}
const RS_IT_AUX = /^(ho|hai|ha|abbiamo|avete|hanno|avevo|avevi|aveva|avevamo|avevano|avrei|avrà)$/;
const RS_IT_MODAL = /^(posso|puoi|può|possiamo|potete|possono|voglio|vuoi|vuole|vogliamo|volete|vogliono|devo|devi|deve|dobbiamo|dovete|devono|so|sai|sa|sappiamo|vorrei|vorresti|vorrebbe|potrei|potresti|potrebbe|dovrei|dovresti|dovrebbe|bisogna|preferisco|preferisci|preferisce|riesco|riesci|riesce|a|ad|di|da|per|senza|prima|non)$/;
const RS_IT_NOT_INF = /^(mare|bicchiere|cameriere|carabiniere|cavaliere|ingegnere|infermiere|giardiniere|quartiere|carcere|genere|piacere|potere|dovere|sapere|essere|avere|messaggere|parere|corriere|consigliere|banchiere|forestiere|straniere|sire|desire|ire)$/;
const RS_IT_NOT_GER = /^(secondo|profondo|rotondo|tremendo|orrendo|stupendo|mondo|biondo|fondo|tondo|giocondo|quando)$/;
function rsItTag(w, i, low) {
  const C = RS_CLOSED.it, lex = rsItLex(), dict = RS_DICT_GET('it', w);
  if (dict) return dict[0];   // d'accordo, po': one word
  if (/^[a-zàèéìòù]+'[^']/.test(w)) {   // "l'amico", "dell'acqua", "c'è", "l'ho": tag the word after the apostrophe
    const head = w.split("'")[0] + "'", after = w.split("'").slice(1).join("'");
    return rsItTag(after, i, low) || (C.art.has(head) || C.prep.has(head) || C.dp.has(head) ? 'noun' : null);
  }
  if (C.art.has(w) && !C.clArt.has(w)) return 'det';
  if (C.clArt.has(w) || C.flex.has(w)) return null;   // decided from the neighbours (article or pronoun, determiner or adverb)
  if (C.dp.has(w) || C.det.has(w)) return 'det';     // questo, mio: turned into a pronoun later when no noun follows
  if (C.clitic.has(w) || C.pron.has(w)) return 'pron';
  if (C.prep.has(w)) return 'prep'; if (C.conj.has(w)) return 'conj'; if (C.adv.has(w)) return 'adv'; if (C.verb.has(w)) return 'verb';
  if (lex.has(w)) return lex.get(w);
  const r = rsLex('it'); if (r.has(w)) return r.get(w);   // your own cards' word labels
  const prev = low[i - 1] || '', prev2 = low[i - 2] || '';
  if (/mente$/.test(w) && w.length > 7) return 'adv';
  if (/(ando|endo)$/.test(w) && w.length > 5 && !RS_IT_NOT_GER.test(w)) return 'verb';
  if (/^(io|tu|noi|voi|non|mi|ti|si|ci|vi|ne|li|m'|t'|s'|c'|v')$/.test(prev)) return /^\p{L}+$/u.test(w) && w.length > 1 ? 'verb' : null;   // "non capisco", "mi chiamo"
  if (/^(lo|la|le|gli|l')$/.test(prev) && /^(io|tu|noi|voi|non|chi|che)$/.test(prev2)) return 'verb';   // "non lo so", "io la vedo"
  if (RS_IT_AUX.test(prev) && /(ato|ata|ati|ate|uto|uta|uti|ute|ito|ita|iti|ite)$/.test(w) && w.length > 4) return 'verb';   // "ho mangiato", "abbiamo visto"
  if (/(are|ere|ire|arsi|ersi|irsi|arlo|erlo|irlo|arla|erla|irla|armi|ermi|irmi|arti|erti|irti)$/.test(w) && w.length > 5 && RS_IT_MODAL.test(prev) && !RS_IT_NOT_INF.test(w)) return 'verb';   // "posso venire", "per mangiare"
  return null;
}
{ const prevTag = rsTagWord; rsTagWord = function (w, i, low, lang) { return lang === 'it' ? rsItTag(w, i, low) : prevTag(w, i, low, lang); }; }
{ const prevSent = rsTagSentence;
  rsTagSentence = function (words, lang) {
    const out = prevSent(words, lang); if (lang !== 'it') return out;
    const C = RS_CLOSED.it, low = words.map(w => w.toLowerCase().replace(/[.,!?;:«»"“”()]/g, ''));
    for (let i = 0; i < out.length; i++) {
      const w = low[i], next = out[i + 1];
      // questo / mio with no noun after it is a pronoun: "questo è mio"
      if (C.dp.has(w) && next !== 'noun' && next !== 'adj' && !(next == null && low[i + 1] && !C.flex.has(low[i + 1]))) out[i] = 'pron';
      // "molto bello": molto before an adjective is an adverb; "molti di loro", "tutti": a pronoun when no noun follows
      if (C.flex.has(w) && /o$/.test(w) && next === 'adj' && !['noun'].includes(out[i + 2])) out[i] = 'adv';
      if (C.flex.has(w) && /[ie]$/.test(w) && out[i] === 'adv') out[i] = 'pron';
      const lex = rsItLex().get(w), prevW = low[i - 1] || '';
      // "il lavoro" is a noun, "io lavoro" a verb: words that can be both follow the word before them
      if (out[i] === 'verb' && lex === 'verb' && !C.verb.has(w) && out[i - 1] === 'det' && (C.art.has(prevW) || C.dp.has(prevW) || C.det.has(prevW))) out[i] = 'noun';
      if (out[i] === 'noun' && lex === 'verb' && /^(io|tu|noi|voi|non|mi|ti|si|ci|vi|ne)$/.test(prevW)) out[i] = 'verb';
      // "un'ora", "l'idea": after an elided article it is a noun
      if (/^(l|un|dell|nell|all|dall|sull|quell)'./.test(w) && (out[i] === 'adv' || out[i] === 'adj' && /^(l|un)'/.test(w) && !/['](altro|altra)$/.test(w))) out[i] = 'noun';
      // a capitalized word in the middle of the sentence that no list knows: a name
      if (i > 0 && /^[A-ZÀÈÉÌÒÙ]/.test(words[i]) && !lex && !RS_DICT_GET('it', w) && !Object.values(C).some(s => s.has(w))) out[i] = 'noun';
    }
    return out;
  };
}

/* meanings for the word tags */
RS_GLOSS_COMMON.it = "è:is|sono:am / are|sei:are|siamo:are|siete:are|era:was|ero:was|erano:were|stato:been|ho:I have|hai:you have|ha:has|abbiamo:we have|avete:you have|hanno:they have|vado:I go|vai:you go|va:goes|andiamo:we go|posso:I can|puoi:you can|può:can|voglio:I want|vuoi:you want|vuole:wants|devo:I must|deve:must|so:I know|sai:you know|sa:knows|fa:does / makes|faccio:I do / make|fatto:done / made|detto:said|dice:says|c'è:there is|ci sono:there are|non:not|io:I|tu:you|lui:he / him|lei:she / her|noi:we / us|voi:you|loro:they / them|mi:me|ti:you|si:(him/her)self|ci:us / there|vi:you|ne:of it|lo:the / it|la:the / it / her|li:them|le:the / them|gli:the / to him|l':the|il:the|i:the|un:a|uno:a|una:a|un':a|che:that / what|chi:who|cosa:what|e:and|o:or|ma:but|se:if|quando:when|come:like / how|perché:because / why|molto:very / a lot|più:more|meno:less|no:no|sì:yes|già:already|qui:here|lì:there|là:there|questo:this|questa:this|quello:that|quella:that|tutto:all|anche:also|sempre:always|mai:never|bene:well|male:badly|adesso:now|ora:now|oggi:today|domani:tomorrow|ieri:yesterday|dove:where|per:for|con:with|senza:without|di:of|d':of|da:from|in:in|a:to / at|su:on|al:to the|alla:to the|del:of the|della:of the|nel:in the|nella:in the|mio:my|mia:my|tuo:your|tua:your|suo:his / her|sua:his / her|nostro:our|vostro:your|po':a little|così:so|ancora:still / again|troppo:too";
{ const prevMap = rsGlossMap;
  rsGlossMap = function (lang) {
    if (lang !== 'it' || RS_GLOSS.it) return prevMap(lang);
    const m = prevMap('it'), put = (w, g) => { if (w && g && !m.has(String(w).toLowerCase())) m.set(String(w).toLowerCase(), String(g)); };
    if (typeof IT_NOUN !== 'undefined') {
      IT_NOUN.forEach(n => { put(n[0], n[4]); put(n[1], n[5] || n[4]); });
      IT_ADJ.forEach(a => a.slice(0, 4).forEach(w => put(w, a[4])));
      IT_VERB.forEach(v => { put(v[0], 'to ' + v[5]); v[1].forEach(w => put(w, v[5])); });
      IT_PRON.forEach(p => put(p[0], p[3])); IT_DET.forEach(d => put(d[0], d[3])); IT_POSS.forEach(r => r.slice(0, 4).forEach(w => put(w, r[4])));
      IT_PREP.forEach(p => put(p[0], p[3])); IT_ADV.forEach(a => put(a[0], a[1]));
    }
    return m;
  };
}
{ const prevGloss = rsGloss;
  rsGloss = function (word, lang) {
    const g = prevGloss(word, lang); if (g || lang !== 'it') return g;
    const w = String(word || '').toLowerCase().replace(/[.,!?;:«»"“”()]/g, '');
    if (w.includes("'")) { const a = w.split("'")[0] + "'", b = w.split("'").slice(1).join("'"); const ga = prevGloss(a, lang), gb = prevGloss(b, lang); if (ga || gb) return [ga, gb].filter(Boolean).join(' + '); }
    return '';
  };
}
