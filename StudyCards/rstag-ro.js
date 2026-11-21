'use strict';
/* ================= Sentence Builder · 📖 Real sentences: Romanian =================
   Romanian for the Real sentences mode: the closed word lists (articles, pronouns, prepositions…), safe tagging rules,
   a word list with meanings for the words in data/real-ro.json (Tatoeba, CC BY 2.0 FR), and the meanings under the words.
   A word that can't be tagged with confidence gets no label rather than a wrong one. Loaded after rstag.js and builder-ro.js. */
RS_LANGS.ro = 'Romanian';
// Romanian is written with ș and ț (comma below); older texts and keyboards use ş and ţ (cedilla). They are the same letters.
const roCommaS = s => String(s || '').replace(/ş/g, 'ș').replace(/ţ/g, 'ț').replace(/Ş/g, 'Ș').replace(/Ţ/g, 'Ț');
RS_CLOSED.ro = {
  // "o" is "a" before a noun but "her" before a verb (o văd = I see her), so it is decided from the neighbours
  art: RS_W('un o niște'), clArt: RS_W('o'),
  det: RS_W('acest această acești aceste acel acea acei acele cel cea cei cele fiecare orice oricare alt altă alți alte niciun nicio vreun vreo câțiva câteva ambii ambele ' +
    'meu mea mei mele tău ta tăi tale său sa săi sale nostru noastră noștri noastre vostru voastră voștri voastre al ale ' +
    'doi două trei patru cinci șase șapte opt zece unsprezece doisprezece douăsprezece douăzeci treizeci sută mii'),
  flex: RS_W('mult multă mulți multe puțin puțină puțini puține tot toată toți toate destul destulă destui destule atât atâta atâția atâtea'),
  pron: RS_W('eu tu el ea noi voi ei ele dumneata dumneavoastră dânsul dânsa mine tine sine lui lor cine ce care ceva nimic nimeni cineva oricine ' +
    'asta aceasta acesta ăsta ăla aia acela aceea ăștia ălea acestea aceștia aceia acelea același aceeași totul ' +
    'mă mi te ți se îl îi le ne ni vă vi îmi îți își'),
  clitic: RS_W('mă mi te ți se îl îi le ne ni vă vi îmi îți își'),
  prep: RS_W('în la cu de pe din pentru spre fără prin peste sub lângă după până despre între către dintre dinspre printre împotriva contra deasupra înaintea ' +
    'într-un într-o dintr-un dintr-o printr-un printr-o'),
  conj: RS_W('și dar sau ori că să dacă când deși iar nici ci fiindcă deoarece încât decât ca'),
  adv: RS_W('nu da foarte mai prea deja încă acum azi astăzi mâine ieri aici acolo unde cum bine mereu întotdeauna niciodată des uneori adesea deseori chiar doar numai ' +
    'aproape departe repede încet împreună atunci apoi totuși așa astfel sus jos afară înăuntru acasă deloc oricum desigur bineînțeles curând devreme târziu ' +
    'înapoi înainte imediat încotro deci altfel undeva nicăieri oriunde cumva vreodată întotdeauna rar probabil exact'),
  verb: RS_W('sunt ești este e suntem sunteți era erai eram erați erau fost fi fii fie fim fiți am ai are avem aveți au avea aveam aveai aveau avut ' +
    'va vor vom veți vei vreau vrei vrea vrem vreți vrut pot poți poate putem puteți putut trebuie trebuia trebui ' +
    'merg mergi merge mergem mergeți mers face fac faci facem faceți făcut știu știi știe știm știți știut zice zic spune spun spui spus ' +
    'văd vezi vede vedem vedeți văzut dau dai dă dăm dați dat stau stai stă stăm stați stat iau iei ia luăm luați luat vin vii vine venim veniți venit'),
};
// ("a" is "has" in a mâncat, "to" in a mânca and "of" in a mea: too many jobs to label safely, so it gets no label)

/* The Sentence Builder's own Romanian words (builder-ro.js), plus your cards' word labels */
const RS_RO_LEX = (() => {
  const m = new Map(), put = (w, t) => { if (w && !m.has(String(w).toLowerCase())) m.set(String(w).toLowerCase(), t); };
  RO_NOUN.slice(0, RO_BASE.n).forEach(n => n.slice(0, 4).forEach(w => put(w, 'noun')));
  RO_ADJ.slice(0, RO_BASE.a).forEach(a => a.slice(0, 4).forEach(w => put(w, 'adj')));
  RO_VERB.slice(0, RO_BASE.v).forEach(v => v[1].forEach(w => put(w, 'verb')));
  Object.values(RO_IRREG_FORMS).forEach(f => f.split(' ').forEach(w => put(w, 'verb')));
  return m;
})();
/* The tagging rules for Romanian (the other languages go on to rstag.js's own rules) */
const RS_RO_SUBJ = /^(eu|tu|el|ea|noi|voi|ei|ele|nu|să|mă|te|se|ne|vă|îmi|îți|își|îl|îi|le|mi|ți|cine|care|tom|mary)$/;
const RS_RO_AUX = /^(am|ai|a|au|ați|ar|aș|ai|am|v-am|l-am|l-a|m-am|s-a|ne-am|v-ați|s-au|i-am|mi-a|ți-a|le-am)$/;
function rsRoTag(w, i, low) {
  const C = RS_CLOSED.ro, prev = low[i - 1] || '';
  if (C.art.has(w) && !C.clArt.has(w)) return 'det';
  if (C.clArt.has(w) || C.flex.has(w)) return null;   // decided from the neighbours
  if (C.clitic.has(w) || C.pron.has(w)) return 'pron';
  if (C.prep.has(w)) return 'prep'; if (C.conj.has(w)) return 'conj'; if (C.adv.has(w)) return 'adv'; if (C.det.has(w)) return 'det'; if (C.verb.has(w)) return 'verb';
  const dict = RS_DICT_GET('ro', w); if (dict) return dict[0];
  if (RS_RO_LEX.has(w)) return RS_RO_LEX.get(w);
  const lex = typeof rsLex === 'function' ? rsLex('ro') : null; if (lex?.has(w)) return lex.get(w);
  // joined with a hyphen: m-am (I have…), s-a (it has…), l-am văzut (I saw him), nu-i (isn't), dă-mi (give me)
  if (/-/.test(w)) {
    if (/^(într|dintr|printr)-(un|o)$/.test(w)) return 'prep';
    if (/^(m|s|l|i|v|ne|te|ți|mi|le|ni|vi|și)-(am|ai|a|au|ați|ar|aș|e|i)$/.test(w)) return 'verb';
    if (/^[a-zăâîșț]{2,}-(mi|ți|i|l|o|le|ne|vă|se|te|mă)$/.test(w) && RS_RO_LEX.get(w.split('-')[0]) === 'verb') return 'verb';
    return null;
  }
  // after să, after a subject pronoun or nu: a verb (să mănânc, el vine, nu știu)
  if (/^(să|eu|tu|el|ea|noi|voi|nu|mă|te|ne|vă|îmi|îți|își)$/.test(prev) && /^[a-zăâîșț]{2,}$/.test(w) && !/(ul|ului|lor|ile|ii)$/.test(w)) return 'verb';
  // after am / ai / a / au / ați: a past form (am mâncat, a plecat, au văzut, ar fi)
  if (RS_RO_AUX.test(prev) && /(at|ut|it|ât|ăt|s|t)$/.test(w) && w.length > 3) return 'verb';
  // endings only verbs have: -ează (lucrează), -ăm / -ați after a pronoun is covered above
  if (/[^aeiouăâî]ează$/.test(w) && w.length > 5) return 'verb';
  // the "the" ending on a noun: -ul, -ului, -urile, -urilor (parcul, orașului, parcurile)
  if (/[^aeiouăâî]ul(ui)?$/.test(w) && w.length > 4 && !/^(fiul|singur|destul)/.test(w)) return 'noun';
  if (/(urile|urilor)$/.test(w) && w.length > 6) return 'noun';
  return null;
}
{ const prevTag = rsTagWord;
  rsTagWord = function (w, i, low, lang) { return lang === 'ro' ? rsRoTag(roCommaS(w), i, low.map(roCommaS)) : prevTag(w, i, low, lang); }; }

/* Meanings under the words: the Sentence Builder's own Romanian words (the word list in rsdict-ro.js comes first) */
RS_GLOSS_COMMON.ro = [
  ...RO_NOUN.slice(0, RO_BASE.n).flatMap(n => [[n[0], n[6]], [n[1], 'the ' + n[6]], [n[2], n[7]], [n[3], n[7] && 'the ' + n[7]]]),
  ...RO_ADJ.slice(0, RO_BASE.a).flatMap(a => a.slice(0, 4).map(w => [w, a[4]])),
  ...RO_VERB.slice(0, RO_BASE.v).flatMap(v => [[v[0], 'to ' + v[5]], ...v[1].map(w => [w, v[5]])]),
  ...RO_PRON.map(p => [p[0], p[3]]), ...RO_DET.map(d => [d[0], d[4]]), ...RO_POSS.flatMap(p => p.slice(0, 4).map(w => [w, p[4]])),
  ...RO_PREP, ...RO_CONJ, ...RO_ADV.map(a => [a[0], a[1]]), ['nu', 'not'], ['niciodată', 'never'], ['foarte', 'very'],
].filter(([w, g]) => w && g).map(([w, g]) => w + ':' + g).join('|');
// a word written with the old cedilla letters (ş, ţ) gets the same meaning as with ș, ț
{ const prevGloss = rsGloss; rsGloss = function (word, lang) { return prevGloss(lang === 'ro' ? roCommaS(word) : word, lang); }; }
