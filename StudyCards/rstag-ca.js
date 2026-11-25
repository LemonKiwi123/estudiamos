'use strict';
/* ================= Sentence Builder · 📖 Real sentences: Catalan word types and meanings =================
   Closed word lists (articles, pronouns, prepositions with the article joined on: al, del, pel…), the Sentence Builder's
   Catalan word lists, the Catalan word list in rsdict-ca.js and a few safe rules. A word the code can't tag with
   confidence gets no label. Elided words (l'home, d'aigua, m'agrada) are tagged by the word after the apostrophe, and
   pronouns joined on with a hyphen (menjar-ho, dona'm) by the word before it.
   Loaded after rstag.js and rsdict-ca.js; it plugs Catalan into rsTagWord, rsTagSentence, rsGlossMap and rsGloss. */
RS_LANGS.ca = 'Catalan';
RS_CLOSED.ca = {
  art: RS_W("el la l' els les un una uns unes en na"),
  det: RS_W("cada algun alguna alguns algunes cap altre altra altres qualsevol cert certa certs certes ambdós ambdues dos dues tres quatre cinc sis vuit deu vint cent mil quin quina quins quines"),
  // this / that / my…: a determiner before a noun ("aquest llibre"), a pronoun on its own ("aquest és meu")
  dp: RS_W("aquest aquesta aquests aquestes aquell aquella aquells aquelles meu meva meus meves teu teva teus teves seu seva seus seves nostre nostra nostres vostre vostra vostres llur llurs mon ma mos mes ton ta tos tes son sa sos ses"),
  flex: RS_W('molt molta molts moltes poc poca pocs poques tot tota tots totes tant tanta tants tantes massa bastant bastants força'),
  pron: RS_W("jo tu ell ella nosaltres vosaltres ells elles vostè vostès mi això allò algú ningú res tothom qui què cadascú"),
  clitic: RS_W("em m' et t' es s' ens ns us vos li els ho hi en n' me te se ne 'm 'n 's 't"), clArt: RS_W("el la els les l'"),
  prep: RS_W("a amb de d' per en sense sobre sota fins contra entre durant des després abans darrere davant dins fora segons cap al als del dels pel pels"),
  conj: RS_W('i o però perquè que si quan mentre com ni doncs sinó'),
  adv: RS_W("no sí més menys ja també tampoc sempre mai sovint aquí allà allí avui demà ahir ara després abans aviat tard bé malament així gairebé només sols potser encara junts juntes molt ràpid lluny prop on quan com enlloc arreu segurament realment finalment aleshores llavors sobretot també tan"),
  verb: RS_W("és són soc sóc ets som sou era eres érem éreu eren eres fou va vaig vas vam vau van vàrem vàreu he has ha hem heu han havia havies havíem havien hagi hagués estat estic estàs està estem esteu estan estava estaves estàvem estaven tinc tens té tenim teniu tenen tenia tenies teníem tenien fer faig fas fa fem feu fan feia fet dit puc pots pot podem podeu poden podia podria vull vols vol volem voleu volen volia voldria sé saps sap sabem sabeu saben sabia vaig vas hi ha hi havia cal calia serà seré seria sigui siguis siguin estigui tingui pugui vulgui sàpiga") };
// the Sentence Builder's Catalan words (nouns, adjectives, verbs and their forms), for tagging and meanings
let RS_CA_LEX = null;
function rsCaLex() {
  if (RS_CA_LEX) return RS_CA_LEX;
  const m = new Map(), put = (w, t) => { if (w && !m.has(String(w).toLowerCase())) m.set(String(w).toLowerCase(), t); };
  if (typeof CA_NOUN !== 'undefined') {
    CA_VERB.forEach(v => { put(caInf(v), 'verb'); v[1].forEach(w => put(w, 'verb')); });
    Object.entries(CA_IRREG_FORMS).forEach(([inf, f]) => { put(inf, 'verb'); f.split(' ').forEach(w => put(w, 'verb')); });
    CA_NOUN.forEach(n => { put(n[0], 'noun'); put(n[1], 'noun'); });
    CA_ADJ.forEach(a => a.slice(0, 4).forEach(w => put(w, 'adj')));
    put('bon', 'adj');
  }
  return (RS_CA_LEX = m);
}
const RS_CA_MODAL = /^(puc|pots|pot|podem|podeu|poden|podia|podria|vull|vols|vol|volem|voleu|volen|volia|voldria|sé|saps|sap|sabem|saben|vaig|vas|va|vam|vau|van|vàrem|vàreu|cal|calia|he|has|ha|hem|heu|han|anem|aneu|a|de|d'|per|sense|abans|després|haig|hauria|hauries|haurien|hem|deu|deus|solia|sol|m'agrada|t'agrada|li|agrada|agraden|prefereixo|intenta|intento|comença|comencen)$/;
const RS_CA_AUX = /^(he|has|ha|hem|heu|han|havia|havies|havíem|havien|hagi|hauria|hagués)$/;
const RS_CA_NOT_INF = /^(mar|par|bar|lloc|clar|car|dolor|calor|color|flor|amor|por|senyor|senyora|professor|doctor|ordinador|cor|sopar|dinar|esmorzar|lloguer|carrer|cuiner|mercader|forner|paper|primer|darrer|altre|pare|mare|sobre|entre|febrer|plaer|poder|deure|ser|ésser|haver)$/;
function rsCaTag(w, i, low) {
  const C = RS_CLOSED.ca, lex = rsCaLex(), dict = RS_DICT_GET('ca', w);
  if (dict) return dict[0];   // d'acord, avui: one word
  if (/^[a-zàèéíïòóúüç·]+'[^']/.test(w)) {   // "l'home", "d'aigua", "m'agrada", "s'aixeca": tag the word after the apostrophe
    const head = w.split("'")[0] + "'", after = w.split("'").slice(1).join("'");
    return rsCaTag(after, i, low) || (C.art.has(head) || C.prep.has(head) ? 'noun' : C.clitic.has(head) ? 'verb' : null);
  }
  if (/^[a-zàèéíïòóúüç·]+-(me|te|se|ho|hi|ne|nos|vos|los|les|la|lo|li|en|el|m'|t'|s'|l'|n')/.test(w) || /^[a-zàèéíïòóúüç·]+'(m|t|s|n|l|ns|ls|hi|ho)$/.test(w)) return 'verb';   // menjar-ho, dona'm, aixecar-se
  if (C.art.has(w) && !C.clArt.has(w)) return w === 'en' || w === 'na' ? null : 'det';   // "en" is also "in" and "of it": decided later
  if (C.clArt.has(w) || C.flex.has(w)) return null;   // decided from the neighbours (article or pronoun, determiner or adverb)
  if (C.dp.has(w) || C.det.has(w)) return 'det';     // aquest, meu: turned into a pronoun later when no noun follows
  if (C.pron.has(w)) return 'pron';
  if (C.clitic.has(w)) return 'pron';
  if (C.prep.has(w)) return 'prep'; if (C.conj.has(w)) return 'conj'; if (C.adv.has(w)) return 'adv'; if (C.verb.has(w)) return 'verb';
  if (lex.has(w)) return lex.get(w);
  const r = rsLex('ca'); if (r.has(w)) return r.get(w);   // your own cards' word labels
  const prev = low[i - 1] || '', prev2 = low[i - 2] || '';
  if (/ment$/.test(w) && w.length > 7) return 'adv';   // ràpidament
  if (/(ant|ent|int)$/.test(w) && w.length > 6 && /^(està|estic|estàs|estem|esteu|estan|estava|estaven|seguir|segueix|continua)$/.test(prev)) return 'verb';   // "està menjant"
  if (/^(jo|tu|nosaltres|vosaltres|no)$/.test(prev) && /^\p{L}+$/u.test(w) && w.length > 1) return 'verb';   // "no entenc", "jo crec"
  if (/^(em|et|ens|us|li|ho|hi)$/.test(prev) && /^(no|jo|tu|nosaltres|vosaltres|que)$/.test(prev2) && /^\p{L}+$/u.test(w)) return 'verb';   // "no ho sé", "que em digui"
  if (RS_CA_AUX.test(prev) && /(at|ada|ats|ades|it|ida|its|ides|ut|uda|uts|udes|st|ert|ès|ort)$/.test(w) && w.length > 3) return 'verb';   // "he menjat", "hem vist"
  if (/(ar|er|re|ir)$/.test(w) && w.length > 3 && RS_CA_MODAL.test(prev) && !RS_CA_NOT_INF.test(w)) return 'verb';   // "puc venir", "vaig menjar", "per jugar"
  return null;
}
{ const prevTag = rsTagWord; rsTagWord = function (w, i, low, lang) { return lang === 'ca' ? rsCaTag(w, i, low) : prevTag(w, i, low, lang); }; }
{ const prevSent = rsTagSentence;
  rsTagSentence = function (words, lang) {
    const out = prevSent(words, lang); if (lang !== 'ca') return out;
    const C = RS_CLOSED.ca, low = words.map(w => w.toLowerCase().replace(/[.,!?;:«»"“”()]/g, ''));
    for (let i = 0; i < out.length; i++) {
      const w = low[i], next = out[i + 1], prevW = low[i - 1] || '';
      // aquest / meu with no noun after it is a pronoun: "aquest és meu", "és meu"
      if (C.dp.has(w) && next !== 'noun' && next !== 'adj' && !(next == null && low[i + 1] && !C.flex.has(low[i + 1]))) out[i] = 'pron';
      // "molt bonic": molt before an adjective is an adverb; "molts de nosaltres", "tots": a pronoun when no noun follows
      if (C.flex.has(w) && /^(molt|poc|tant|massa|bastant|força)$/.test(w) && next === 'adj' && out[i + 2] !== 'noun') out[i] = 'adv';
      if (C.flex.has(w) && /(s|es)$/.test(w) && out[i] === 'adv') out[i] = 'pron';
      // el / la / els / les / l' before a verb is a pronoun ("la veig", "l'he vist"): rstag.js already does this for el / la; "en" before a verb is "of it"
      if ((w === 'en' || w === "n'") && next === 'verb') out[i] = 'pron';
      if (w === 'en' && out[i] == null) out[i] = /^[A-ZÀÈÉÍÒÓÚÇ]/.test(words[i + 1] || '') ? 'det' : 'prep';   // "en Joan" (a name), "en tren"
      if (w === 'na' && out[i] == null && /^[A-ZÀÈÉÍÒÓÚÇ]/.test(words[i + 1] || '')) out[i] = 'det';
      const lex = rsCaLex().get(w);
      // "el treball" is a noun, "jo treballo" a verb: words that can be both follow the word before them
      if (out[i] === 'verb' && lex === 'verb' && !C.verb.has(w) && out[i - 1] === 'det' && (C.art.has(prevW) || C.dp.has(prevW) || C.det.has(prevW))) out[i] = 'noun';
      if (out[i] === 'noun' && lex === 'verb' && /^(jo|tu|nosaltres|vosaltres|no|em|et|es|ens|us)$/.test(prevW)) out[i] = 'verb';
      // a capitalized word in the middle of the sentence that no list knows: a name
      if (i > 0 && /^[A-ZÀÈÉÍÒÓÚÇ]/.test(words[i]) && !lex && !RS_DICT_GET('ca', w) && !Object.values(C).some(s => s.has(w))) out[i] = 'noun';
    }
    return out;
  };
}

/* meanings for the word tags */
RS_GLOSS_COMMON.ca = "és:is|són:are|soc:am|sóc:am|ets:are|som:are|sou:are|era:was|eren:were|estat:been|he:I have|has:you have|ha:has|hem:we have|heu:you have|han:they have|vaig:I go / I did|vas:you go / you did|va:goes / did|vam:we did|vau:you did|van:they go / they did|puc:I can|pots:you can|pot:can|vull:I want|vols:you want|vol:wants|sé:I know|saps:you know|sap:knows|fa:does / makes|faig:I do / make|fet:done / made|dit:said|diu:says|hi ha:there is / are|cal:you need to|no:not / no|jo:I|tu:you|ell:he / him|ella:she / her|nosaltres:we / us|vosaltres:you|ells:they / them|elles:they / them|vostè:you (polite)|em:me|m':me|et:you|t':you|es:(him/her)self|s':(him/her)self|ens:us|us:you|li:to him / her|ho:it|hi:there|en:in / of it|n':of it|el:the / him|la:the / her|els:the / them|les:the / them|l':the / it|un:a|una:a|uns:some|unes:some|que:that / what|qui:who|què:what|i:and|o:or|però:but|si:if|quan:when|com:like / how|perquè:because|per què:why|molt:very / a lot|més:more|menys:less|sí:yes|ja:already|aquí:here|allà:there|aquest:this|aquesta:this|aquell:that|aquella:that|això:this / that|allò:that|tot:all|també:also|sempre:always|mai:never|bé:well|ara:now|avui:today|demà:tomorrow|ahir:yesterday|on:where|per:for / by|amb:with|sense:without|de:of / from|d':of|a:to / at|al:to the|als:to the|del:of the|dels:of the|pel:through the|meu:my|meva:my|teu:your|teva:your|seu:his / her|seva:his / her|nostre:our|vostre:your|encara:still|massa:too";
{ const prevMap = rsGlossMap;
  rsGlossMap = function (lang) {
    if (lang !== 'ca' || RS_GLOSS.ca) return prevMap(lang);
    const m = prevMap('ca'), put = (w, g) => { if (w && g && !m.has(String(w).toLowerCase())) m.set(String(w).toLowerCase(), String(g)); };
    if (typeof CA_NOUN !== 'undefined') {
      CA_NOUN.forEach(n => { put(n[0], n[4]); put(n[1], n[5] || n[4]); });
      CA_ADJ.forEach(a => a.slice(0, 4).forEach(w => put(w, a[4])));
      CA_VERB.forEach(v => { put(caInf(v), 'to ' + v[5]); v[1].forEach(w => put(w, v[5])); });
      CA_PRON.forEach(p => put(p[0], p[3])); CA_DET.forEach(d => put(d[0], d[3])); CA_POSS.forEach(r => r.slice(0, 4).forEach(w => put(w, r[4])));
      CA_PREP.forEach(p => put(p[0], p[3])); CA_ADV.forEach(a => put(a[0], a[1]));
    }
    return m;
  };
}
{ const prevGloss = rsGloss;
  rsGloss = function (word, lang) {
    const g = prevGloss(word, lang); if (g || lang !== 'ca') return g;
    const w = String(word || '').toLowerCase().replace(/[.,!?;:«»"“”()]/g, '');
    if (w.includes("'")) { const a = w.split("'")[0] + "'", b = w.split("'").slice(1).join("'"); const ga = prevGloss(a, lang), gb = prevGloss(b, lang); if (ga || gb) return [ga, gb].filter(Boolean).join(' + '); }
    if (w.includes('-')) { const [a, ...b] = w.split('-'); const ga = prevGloss(a, lang); if (ga) return ga + ' + ' + b.join('-'); }
    return '';
  };
}
