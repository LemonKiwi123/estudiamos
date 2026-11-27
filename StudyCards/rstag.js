'use strict';
/* ================= Sentence Builder · 📖 Real sentences: word types and the hot/cold meter =================
   Real sentences don't come with word types, so they are worked out here: closed word lists (articles, pronouns,
   prepositions, particles…), the Sentence Builder's own word lists, your cards' 🏷️ word labels, and safe grammar rules.
   A word that can't be tagged with confidence gets no label rather than a wrong one. Loaded after realsent.js. */
const RS_W = s => new Set(s.split(/\s+/).filter(Boolean));
const RS_DICT_GET = (lang, w) => (typeof RS_DICT !== 'undefined' && RS_DICT[lang]?.get(String(w || '').toLowerCase())) || null;
const RS_CLOSED = {
  es: { art: RS_W('el la los las un una unos unas'),
    det: RS_W('este esta estos estas ese esa esos esas aquel aquella aquellos aquellas mi mis tu tus su sus nuestro nuestra nuestros nuestras vuestro vuestra vuestros vuestras cada otro otra otros otras algún alguna algunos algunas ningún ninguna varios varias cualquier ambos ambas uno dos tres cuatro cinco seis siete ocho nueve diez cien mil'),
    flex: RS_W('mucho mucha muchos muchas poco poca pocos pocas todo toda todos todas tanto tanta tantos tantas demasiado demasiada demasiados demasiadas'),
    pron: RS_W('yo tú él ella usted nosotros nosotras vosotros vosotras ellos ellas ustedes mí ti conmigo contigo esto eso aquello algo nada nadie alguien quién quiénes qué cuál cuáles mío mía míos mías tuyo tuya suyo suya'),
    clitic: RS_W('me te se nos os lo le les'), clArt: RS_W('la las los'),
    prep: RS_W('a ante bajo con contra de desde en entre hacia hasta para por según sin sobre tras al del durante mediante'),
    conj: RS_W('y e o u pero sino que porque aunque si ni pues como cuando mientras donde'),
    adv: RS_W('no sí muy más menos ya también tampoco siempre nunca jamás aquí allí allá ahí acá hoy mañana ayer ahora luego bien mal tan todavía aún casi solo sólo quizás quizá pronto tarde temprano antes después cerca lejos dónde cuándo cómo bastante entonces además apenas así enseguida adónde'),
    verb: RS_W('hay había hubo fue fueron era eras éramos eran estaba estabas estaban estuve estuvo estuvimos tuve tuvo tuvimos hice hizo hicimos dijo dije dijeron he has ha hemos han sé sabe sabes sabemos saben vino vine quiso pude pudo dio di vi vio sea seas sean esté estés haya tenga tengas vaya vayas ser estar ir haber sido estado ido hecho dicho visto puesto vuelto escrito abierto voy vas va vamos van ven haz sal pon ten puedes puede podemos pueden quieres quiere gusta gustan encanta parece') },
  fr: { art: RS_W("le la l' les un une des du"),
    det: RS_W('ce cet cette ces mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs chaque quelques plusieurs aucun aucune certains certaines autre autres quel quelle quels quelles deux trois quatre cinq six sept huit neuf dix cent mille'),
    flex: RS_W('tout toute tous toutes'),
    pron: RS_W("je j' tu il elle on nous vous ils elles moi toi soi eux ça cela ceci qui quoi lequel laquelle celui celle ceux celles rien personne quelqu'un lui y en"),
    clitic: RS_W("me m' te t' se s' leur"), clArt: RS_W('le la les'),
    prep: RS_W("à au aux dans avec pour de d' sans sur sous chez par vers entre pendant depuis avant après contre devant derrière jusqu'à malgré parmi selon envers"),
    conj: RS_W("et ou mais donc ni car que qu' quand si comme lorsque puisque parce"),
    adv: RS_W("ne n' pas plus jamais très trop bien mal assez beaucoup peu toujours souvent parfois déjà encore aussi aujourd'hui demain hier maintenant ici là où comment pourquoi combien vite tôt tard ensemble seulement vraiment peut-être bientôt alors ensuite puis surtout presque non oui"),
    verb: RS_W('est-ce était étais étions étiez étaient avait avais avions aviez avaient fut été eu fait dit pris vu allé allée venu venue être avoir aller faire faut fallait sera seras serons seront aura auras aurons auront serait aurait soit sois ait puisse fasse veuille sache vienne aille voudrais pourrais devrais aimerais aime aimes aimons aimez aiment') },
  ja: { part: RS_W('は が を に で と へ も の か よ ね から まで より や ので けど けれど し って だけ しか など ほど くらい ぐらい さえ でも わ ぞ な さ ね よね かな'),
    adj: RS_W('いい よい 好き 嫌い 大好き 上手 下手 大丈夫 元気 静か 有名 便利 簡単 大切 必要 きれい 綺麗 同じ 本当'),
    noun: RS_W('こと もの 事 物 とき 時 ところ 所 人 方 ほう 今日 明日 昨日 今 毎日'),
    verb: RS_W('だ です でした だった でしょう だろう じゃない ではない ではありません ください 下さい する します した して いる います いた いて ある あります あった なる なります なった 行く 来る くる 言う いう'),
    pron: RS_W('私 わたし 僕 ぼく 俺 おれ 君 きみ あなた 彼 かれ 彼女 かのじょ 彼ら 私たち これ それ あれ どれ ここ そこ あそこ どこ 誰 だれ 何 なに なん こちら そちら どちら 皆 みんな 自分'),
    det: RS_W('この その あの どの こんな そんな あんな どんな'),
    adv: RS_W('とても もう まだ よく 少し すこし 全然 ぜんぜん ちょっと いつも 時々 ときどき すぐ もっと 一緒に いっしょに 本当に ほんとうに ずっと たくさん 必ず きっと ゆっくり 早く まず また なぜ どう'),
    conj: RS_W('そして でも しかし だから それから それに') },
};
const RS_LEX = {};
function rsLex(lang) {
  if (RS_LEX[lang]) return RS_LEX[lang];
  const m = new Map(), put = (w, t) => { if (w && !m.has(String(w).toLowerCase())) m.set(String(w).toLowerCase(), t); };
  const has = name => typeof window[name] !== 'undefined' || (() => { try { return eval('typeof ' + name) !== 'undefined'; } catch { return false; } })();
  const get = name => { try { return eval(name); } catch { return null; } };
  const pairs = { es: ['ES_NOUN', 'ES_ADJ', 'ES_VERB', 'ES_IRREG_FORMS'], fr: ['FR_NOUN', 'FR_ADJ', 'FR_VERB', 'FR_IRREG_FORMS'] }[lang];
  if (pairs) {
    const [N, A, V, IR] = pairs.map(x => has(x) ? get(x) : null);
    (N || []).forEach(n => { put(n[0], 'noun'); put(n[1], 'noun'); });
    (A || []).forEach(a => a.slice(0, 4).forEach(w => put(w, 'adj')));
    (V || []).forEach(v => { put(v[0], 'verb'); (v[1] || []).forEach(w => put(w, 'verb')); });
    Object.entries(IR || {}).forEach(([inf, f]) => { put(inf, 'verb'); String(f).split(/\s+/).forEach(w => put(w, 'verb')); });
  }
  if (lang === 'ja') {
    (get('JA_NOUN') || []).forEach(n => { put(n[0], 'noun'); put(n[1], 'noun'); });
    (get('JA_ADJ') || []).forEach(a => { put(a[0], 'adj'); put(a[1], 'adj'); });
    (get('JA_VERB') || []).forEach(v => { put(v[0], 'verb'); put(v[1], 'verb'); put(v[2], 'verb'); });
    (get('JA_PRON') || []).forEach(p => { put(p[0], 'pron'); put(p[1], 'pron'); });
    (get('JA_ADV') || []).forEach(a => put(a[0], 'adv'));
  }
  // your own cards' word labels (one-word fronts in this language)
  try {
    const ok = new Set(['noun', 'verb', 'adj', 'adv', 'pron', 'det', 'prep', 'conj']);
    for (const d of S.decks) { if (langBase(d.frontLang || '') !== lang) continue;
      for (const c of cardsOf(d.id)) { const f = plainSent(c.front || '').trim().toLowerCase(); if (!f || /\s/.test(f) || m.has(f)) continue;
        const k = typeof clPos === 'function' ? clPos(c) : null; if (ok.has(k)) m.set(f, k); } }
  } catch {}
  return (RS_LEX[lang] = m);
}
function rsTagWord(w, i, low, lang) {
  const C = RS_CLOSED[lang], lex = rsLex(lang);
  if (lang === 'ja') {
    if (C.part.has(w)) return 'part'; if (C.verb.has(w)) return 'verb'; if (C.pron.has(w)) return 'pron'; if (C.det.has(w)) return 'det'; if (C.adv.has(w)) return 'adv'; if (C.conj.has(w)) return 'conj';
    if (RS_DICT_GET(lang, w)) return RS_DICT_GET(lang, w)[0];
    if (C.adj.has(w)) return 'adj'; if (C.noun.has(w)) return 'noun';
    if (/^(です|でした|だ|でしょう)(か|ね|よ)$/.test(w)) return 'verb';
    if (/の$/.test(w) && C.pron.has(w.slice(0, -1))) return 'pron';   // 彼の, 私の
    if (lex.has(w)) return lex.get(w);
    if (/(ます|ました|ません|ませんでした|ましょう|たい|たかった|ている|ています|ていた|てください)$/.test(w)) return 'verb';
    if (/[一-龯々]/.test(w) && /い$/.test(w) && !/ない$/.test(w) && w.length <= 4) return 'adj';
    if (/^[一-龯々]+[ぁ-ん]{0,2}(った|んだ|いた|いだ|した|って|んで|いて|いで|して)$/.test(w) && w.length >= 3) return 'verb';
    if (/^[一-龯々]+[るうくぐすつぬぶむ]$/.test(w) || /^[一-龯々]+[っいきしちにびみり]?[てで]$/.test(w) || /^[一-龯々]+[っいきしちにびみりえけせてねべめれ]た$/.test(w)) return 'verb';
    if (/^[一-龯々]+$/.test(w) || /^[ァ-ヿー]+$/.test(w)) return 'noun';
    return null;
  }
  if (lang === 'fr' && (RS_DICT_GET(lang, w) || C.adv.has(w) || C.pron.has(w))) return RS_DICT_GET(lang, w)?.[0] || (C.adv.has(w) ? 'adv' : 'pron');   // aujourd'hui, quelqu'un: one word
  if (lang === 'fr' && /^[a-zàâçéèêëîïôûùüÿœ]+'[^']/.test(w)) {   // "j'ai", "l'eau", "c'est": tag the word after the apostrophe
    const [head, after] = [w.split("'")[0] + "'", w.split("'").slice(1).join("'")];
    return rsTagWord(after, i, low, lang) || (C.art.has(head) || head === "d'" ? 'noun' : null);
  }
  if (C.art.has(w) && !C.clArt.has(w)) return 'det';
  if (C.clArt.has(w) || C.flex.has(w)) return null;   // decided from the neighbours (article or pronoun, determiner or adverb)
  if (C.clitic.has(w) || C.pron.has(w)) return 'pron';
  if (C.prep.has(w)) return 'prep'; if (C.conj.has(w)) return 'conj'; if (C.adv.has(w)) return 'adv'; if (C.det.has(w)) return 'det'; if (C.verb.has(w)) return 'verb';
  if (RS_DICT_GET(lang, w)) return RS_DICT_GET(lang, w)[0];   // the word list for the built-in sentences (rsdict.js)
  if (lex.has(w)) return lex.get(w);
  if (lang === 'es') {
    const pv = low[i - 1] || '', afterNounMarker = C.art.has(pv) || C.det.has(pv) || C.clArt.has(pv) || (C.prep.has(pv) && pv !== 'a');   // "la panadería", "una librería": nouns, not verbs
    if (/mente$/.test(w) && w.length > 6) return 'adv';
    if (/(ando|iendo|yendo)$/.test(w) && w.length > 5) return 'verb';
    if (!afterNounMarker && /(aron|ieron|asteis|isteis|ábamos|aremos|eremos|iremos)$/.test(w)) return 'verb';
    if (!afterNounMarker && /[aei]r(é|ás|á|emos|án|ía|ías|íamos|ían)$/.test(w) && w.length > 5) return 'verb';
    if (!afterNounMarker && /(aba|abas|aban)$/.test(w) && w.length > 4) return 'verb';
    if (/(ar|er|ir|ír)$/.test(w) && w.length > 3 && !/^(lugar|hogar|collar|placer|taller|mujer|altar|dólar|azúcar|ayer|mar|bar|sur|par|amor|mejor|peor|mayor|menor|señor|color|calor|dolor|favor|flor|olor|valor|honor|error|interior|exterior|alrededor)$/.test(w)) return 'verb';
    if (!afterNounMarker && /[^aeiouáéíóú](ó|é)$/.test(w) && !/^(café|bebé|puré|josé)$/.test(w)) return 'verb';
  }
  if (lang === 'fr') {
    const prev = low[i - 1] || '', prev2 = low[i - 2] || '';
    if (/^(je|tu|il|elle|on|nous|vous|ils|elles|ne|n'|qui|se|s'|me|m'|te|t'|y|en)$/.test(prev)) return 'verb';
    if (/^(le|la|les|lui|leur|me|te|se|nous|vous|l')$/.test(prev) && /^(je|tu|il|elle|on|nous|vous|ils|elles|ne|n'|qui)$/.test(prev2)) return 'verb';   // je le pense
    if (/^(ai|as|a|avons|avez|ont|avait|avais|suis|es|est|sommes|êtes|sont|était|été)$/.test(prev) && /(é|ée|és|ées|i|is|it|u|ue|us|ues)$/.test(w)) return 'verb';
    if (/(er|ir|re)$/.test(w) && w.length > 3 && /^(à|de|d'|pour|sans|peux|peut|pouvons|pouvez|veux|veut|voulons|voulez|dois|doit|devons|devez|vais|va|allons|allez|vont|faut|aime|aimes|aimez|aiment|sais|sait)$/.test(prev)) return 'verb';
  }
  return null;
}
const RS_ES_NUM = RS_W('uno dos tres cuatro cinco seis siete ocho nueve diez once doce cien mil');
/* a capitalized first word that isn't in any list: is it a verb form (Tomo, Escucho, Llegamos) rather than a name?
   Yes when the same stem shows up as a verb (tomar, tomamos, tomó…) in the word lists or the sentences, when it ends
   in -amos/-emos/-imos, or when it ends in -o and the next word isn't a verb, a name or "y" ("Pedro come" stays a name). */
function rsEsVocab() {
  const D = RS_DATA?.es; if (!D?.items) return null;
  if (!D._vocab) { const v = new Set(); for (const it of D.items) for (const t of String(it[1]).toLowerCase().split(/[^\p{L}]+/u)) if (t) v.add(t); D._vocab = v; }
  return D._vocab;
}
function rsEsVerbLike(w, raw, nextTag, nextRaw) {
  const vocab = rsEsVocab(), lex = rsLex('es');
  const known = x => lex.get(x) === 'verb' || RS_DICT_GET('es', x)?.[0] === 'verb' || RS_CLOSED.es.verb.has(x) || !!vocab?.has(x);
  if (/(amos|emos|imos|áis|éis)$/.test(w) && w.length > 5) return true;
  if (/o$/.test(w) && w.length >= 4 && !/[,;:]$/.test(raw || '') && nextTag !== 'verb' && nextTag !== 'conj' && nextRaw && !/^[A-ZÁÉÍÓÚÑ]/.test(nextRaw)) return true;
  const forms = { ar: ['ar', 'amos', 'ando', 'ó', 'aba', 'aron'], er: ['er', 'emos', 'iendo', 'ió', 'ieron'], ir: ['ir', 'imos', 'iendo', 'ió', 'ieron'] };   // endings only verbs have (not -ado/-ido: rosado, querido are adjectives too)
  for (const [end, infs] of [['amos', ['ar']], ['emos', ['er']], ['imos', ['ir']], ['an', ['ar']], ['en', ['er', 'ir']], ['as', ['ar']], ['es', ['er', 'ir']], ['a', ['ar']], ['e', ['er', 'ir']], ['o', ['ar', 'er', 'ir']]]) {
    if (!w.endsWith(end) || w.length < end.length + 2) continue;
    const stem = w.slice(0, -end.length);
    if (infs.some(x => forms[x].some(f => known(stem + f)))) return true;
  }
  return false;
}
/* words the sentence set writes in lowercase somewhere: those aren't names, even when one starts a sentence */
const RS_SEEN_LOWER = {};
function rsSeenLower(lang) {
  const D = typeof RS_DATA !== 'undefined' && RS_DATA[lang]; if (!D?.items) return null;
  if (!RS_SEEN_LOWER[lang]) { const s = new Set(); for (const it of D.items) for (const t of String(it[1]).match(/[\p{L}']+/gu) || []) if (t === t.toLowerCase()) s.add(t); RS_SEEN_LOWER[lang] = s; }
  return RS_SEEN_LOWER[lang];
}
/* Spanish: a sentence can't start with a bare noun followed by "un/una/el/la…" ("Falta una página", "Queda el pan"):
   a word ending like a verb is the verb there, even if the dictionary lists the noun first */
function rsEsFirstVerb(words, out, low) {
  if (out[0] !== 'noun' || !/^[A-ZÁÉÍÓÚÑ]/.test(words[0]) || out[1] !== 'det' || !RS_CLOSED.es.art.has(low[1])) return;
  if (!/(a|e|an|en|o|as|es)$/.test(low[0]) || !/^\p{L}+$/u.test(words[0])) return;   // a verb ending, and no comma after it ("Mamá, la…")
  out[0] = 'verb';
}
function rsTagSentence(words, lang) {
  const C = RS_CLOSED[lang]; if (!C) return words.map(() => null);
  const low = words.map(w => w.toLowerCase().replace(/[.,!?¿¡;:«»"“”()]/g, ''));
  const out = words.map((_, i) => rsTagWord(low[i], i, low, lang));
  for (let i = 0; i < words.length; i++) {   // words that depend on their neighbours
    const w = low[i], next = out[i + 1], prev = out[i - 1];
    if (out[i] == null && lang === 'es' && i === 0 && !C.flex.has(w) && !C.clArt.has(w) && rsEsVerbLike(w, words[0], out[1], words[1])) out[i] = 'verb';   // "Tomo el desayuno…": a verb, not a name
    if (out[i] == null && C.clArt?.has(w)) out[i] = lang === 'es' && C.prep.has(low[i - 1] || '') ? 'det' : next === 'verb' ? 'pron' : 'det';   // Spanish: after a preposition it's always the article (French "pour la voir" is a pronoun)
    if (lang === 'es' && out[i] === 'det' && RS_ES_NUM.has(w) && C.art.has(low[i - 1] || '') && out[i + 1] !== 'noun' && out[i + 1] !== 'adj') out[i] = 'noun';   // "a las ocho": the number stands alone
    if (out[i] == null && C.flex?.has(w)) out[i] = next === 'noun' || next === 'adj' || next === 'det' ? 'det' : next === 'pron' ? 'pron' : 'adv';
    if (out[i] == null && lang !== 'ja' && i === 0 && /^[A-ZÁÉÍÓÚÑÀÂÇÈÊËÎÏÔÛÙÜ]/.test(words[0]) && RS_DATA[lang]?.lower && !RS_DATA[lang].lower.has(w) && !rsSeenLower(lang)?.has(w)) out[i] = 'noun';   // a name starting the sentence (names are never written in lowercase; "Falta…" is)
    if (out[i] == null && lang !== 'ja' && i > 0 && /^[A-ZÁÉÍÓÚÑÀÂÇÈÊËÎÏÔÛÙÜ]/.test(words[i])) out[i] = 'noun';   // a name in the middle of the sentence
    if (out[i] == null && lang !== 'ja' && (prev === 'det' || prev === 'prep') && /^\p{L}+$/u.test(w) && w.length > 2) out[i] = 'noun';
  }
  if (lang === 'es') rsEsFirstVerb(words, out, low);
  return out;
}
const rsTagName = (t, w) => t === 'det' && RS_CLOSED[rs?.lang]?.art?.has(String(w).toLowerCase()) ? 'article' : t === 'part' ? 'particle' : (typeof BLD_TYPES !== 'undefined' && BLD_TYPES[t]?.[0]) || t;

/* ---------- the hot/cold meter: how much of the sentence is in the right place ---------- */
function rsHeat(line) {
  if (!line.length) return { v: 0, label: 'Start building', icon: '🧊' };
  const want = rs.words, n = want.length, k = w => rsKey(w, rs.lang);
  let prefix = 0; while (prefix < line.length && prefix < n && k(line[prefix].w) === k(want[prefix])) prefix++;
  if (prefix === n && line.length === n) return { v: 100, label: 'Hot! Press Check', icon: '🔥' };
  const placed = line.filter((c, i) => i < n && k(c.w) === k(want[i])).length;
  // the longest run of words already in the sentence's order, wherever it is
  const pos = line.map(c => want.findIndex(w => k(w) === k(c.w))); let best = 0, run = 0;
  for (let i = 0; i < pos.length; i++) { run = i && pos[i] >= 0 && pos[i] === pos[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run); }
  let v = 8 + 80 * Math.max(prefix / n, placed / n * 0.8, best / n * 0.6) - 6 * Math.max(0, line.length - Math.max(prefix, placed, best));
  v = Math.round(Math.max(3, Math.min(95, v)));
  const [label, icon] = v >= 80 ? ['Very warm, almost there', '♨️'] : v >= 60 ? ['Warm', '☀️'] : v >= 40 ? ['Cool', '🌤️'] : v >= 20 ? ['Cold', '❄️'] : ['Freezing', '🧊'];
  return { v, label, icon };
}
function rsHeatHTML(line) {
  if (S.settings.bldMeter === false) return '';
  const h = rs.done ? { v: 100, label: 'Correct!', icon: '🔥' } : rsHeat(line), from = rs.heatShown ?? h.v;
  rs.heatShown = h.v;
  return `<div class="bld-heat" role="meter" aria-label="How close you are" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${h.v}" aria-valuetext="${esc(h.label)}">
    <div class="bld-heat-bar"><i style="--from:${from}%;--to:${h.v}%"></i></div>
    <div class="bld-heat-l"><span>❄️ Cold</span><b>${h.icon} ${esc(h.label)}</b><span>Hot 🔥</span></div></div>`;
}
document.addEventListener('change', e => {
  if (view.name !== 'realsent' || !rs) return;
  if (e.target.id === 'rsTags') { S.settings.bldTags = e.target.checked; save(); render(); }
  if (e.target.id === 'rsMeter') { S.settings.bldMeter = e.target.checked; save(); render(); }
  if (e.target.id === 'rsSayWords') { S.settings.rsSayWords = e.target.checked; save(); if (!e.target.checked) speechSynthesis?.cancel?.(); toast(e.target.checked ? '🔊 Words are said out loud as you place them' : '🔇 Words are placed quietly'); }
});

/* ---------- Meanings under the words (like Build your own): the builder's dictionaries, your own cards, common little words ---------- */
const RS_GLOSS_COMMON = {
  es: 'he:I have|has:you have|ha:has|hemos:we have|han:they have|estado:been|sido:been|había:there was / had|tiempo:time|verdad:truth|necesito:I need|vez:time (once)|año:year|día:day|casa:house|gente:people|cosa:thing|trabajo:work|es:is|son:are|está:is|están:are|estoy:I am|estás:you are|soy:I am|eres:you are|somos:we are|era:was|fue:was / went|tengo:I have|tienes:you have|tiene:has|tenemos:we have|tienen:they have|hay:there is / are|voy:I go|vas:you go|va:goes|vamos:we go|quiero:I want|quieres:you want|quiere:wants|puedo:I can|puedes:you can|puede:can|sé:I know|sabe:knows|gusta:likes (is pleasing)|me:me|te:you|se:(him/her)self|lo:it / him|le:(to) him / her|les:(to) them|nos:us|que:that|y:and|o:or|pero:but|porque:because|si:if|cuando:when|como:like / as|muy:very|más:more|menos:less|no:not / no|sí:yes|ya:already|aquí:here|allí:there|eso:that|esto:this|algo:something|nada:nothing|todo:all|también:also|siempre:always|nunca:never|bien:well|mal:badly|ahora:now|hoy:today|mañana:tomorrow|ayer:yesterday|qué:what|quién:who|dónde:where|cómo:how|cuándo:when|por:for / by|para:for|con:with|sin:without|de:of / from|en:in|a:to|al:to the|del:of the|un:a|una:a|el:the|la:the|los:the|las:the|mi:my|tu:your|su:his / her / their|este:this|esta:this|ese:that|esa:that|muchos:many|mucho:a lot|poco:a little|otro:another|otra:another|tan:so|aún:still|todavía:still',
  fr: "est:is|sont:are|suis:am|es:are|sommes:are|êtes:are|était:was|ai:have|as:have|a:has|avons:have|avez:have|ont:have|vais:go|va:goes|allons:go|peux:can|peut:can|veux:want|veut:wants|sais:know|sait:knows|fait:does / did|dit:says / said|ne:not|pas:not|n':not|je:I|j':I|tu:you|il:he / it|elle:she|on:we / one|nous:we|vous:you|ils:they|elles:they|me:me|te:you|se:(him/her)self|le:the / it|la:the / it|les:the / them|l':the|lui:him / her|leur:them|y:there|en:some / of it|que:that|qu':that|qui:who|et:and|ou:or|mais:but|si:if|quand:when|comme:like / as|très:very|plus:more|moins:less|non:no|oui:yes|déjà:already|ici:here|là:there|ça:that|cela:that|ce:this|c':it|tout:all|aussi:also|toujours:always|jamais:never|bien:well|mal:badly|maintenant:now|aujourd'hui:today|demain:tomorrow|hier:yesterday|quoi:what|où:where|comment:how|pourquoi:why|pour:for|par:by|avec:with|sans:without|de:of / from|d':of|du:of the / some|des:some / of the|à:to / at|au:to the|aux:to the|dans:in|sur:on|sous:under|un:a|une:a|mon:my|ma:my|mes:my|ton:your|ta:your|son:his / her|sa:his / her|ses:his / her|notre:our|votre:your|cette:this|ces:these|beaucoup:a lot|peu:a little|trop:too",
  ja: '',
};
const RS_GLOSS = {};
function rsGlossMap(lang) {
  if (RS_GLOSS[lang]) return RS_GLOSS[lang];
  const m = new Map(), put = (w, g) => { if (w && g && !m.has(String(w).toLowerCase())) m.set(String(w).toLowerCase(), String(g)); };
  const get = name => { try { return eval(name); } catch { return null; } };
  for (const part of (RS_GLOSS_COMMON[lang] || '').split('|')) { const i = part.indexOf(':'); if (i > 0) put(part.slice(0, i), part.slice(i + 1)); }
  if (lang === 'es' || lang === 'fr') {
    const P = lang.toUpperCase();
    (get(P + '_NOUN') || []).forEach(n => { put(n[0], n[4]); put(n[1], n[5] || n[4]); });
    (get(P + '_ADJ') || []).forEach(a => a.slice(0, 4).forEach(w => put(w, a[4])));
    (get(P + '_VERB') || []).forEach(v => { put(v[0], 'to ' + v[5]); (v[1] || []).forEach(w => put(w, v[5])); });
    (get(P + '_PRON') || []).forEach(p => put(p[0], lang === 'es' ? p[4] : p[3]));
    (get(P + '_DET') || []).forEach(d => put(d[0], lang === 'es' ? d[5] : d[3]));
    (get(P + '_PREP') || []).forEach(p => put(p[0], p[1]));
    (get(P + '_ADV') || []).forEach(a => put(a[0], a[1]));
  } else if (lang === 'ja') {
    (get('JA_NOUN') || []).forEach(n => { put(n[0], n[4]); put(n[1], n[4]); });
    (get('JA_VERB') || []).forEach(v => { put(v[0], 'to ' + v[7]); put(v[1], v[7]); put(v[2], 'not ' + v[7]); });
    (get('JA_ADJ') || []).forEach(a => { put(a[0], a[4]); put(a[1], a[4]); });
    (get('JA_PRON') || []).forEach(p => { put(p[0], p[3]); put(p[1], p[3]); });
    (get('JA_ADV') || []).forEach(a => put(a[0], a[2]));
    Object.entries(get('JA_PART_SHORT') || {}).forEach(([w, g]) => put(w, g));
    for (const [w, g] of [['です', 'is'], ['でした', 'was'], ['だ', 'is'], ['ます', '(polite)'], ['ない', 'not'], ['これ', 'this'], ['それ', 'that'], ['あれ', 'that (over there)'], ['この', 'this'], ['その', 'that'], ['あの', 'that'], ['ここ', 'here'], ['そこ', 'there'], ['どこ', 'where'], ['何', 'what'], ['誰', 'who'], ['とても', 'very'], ['もう', 'already'], ['まだ', 'still'], ['こと', 'thing'], ['もの', 'thing'], ['好き', 'liked'], ['いい', 'good'], ['ください', 'please'], ['本', 'book'], ['人', 'person'], ['今日', 'today'], ['明日', 'tomorrow']]) put(w, g);
  }
  // your own cards: one-word fronts (and fronts like "el perro") and their meaning
  try {
    for (const d of S.decks) { if (langBase(d.frontLang || '') !== lang) continue;
      for (const c of cardsOf(d.id)) {
        const f = plainSent(c.front || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase(), b = plainSent(c.back || '').split(/[\n;,/]/)[0].trim();
        if (!f || !b || b.length > 30) continue;
        if (!/\s/.test(f)) put(f, b); else { const p = f.split(/\s+/); if (p.length === 2 && /^(el|la|los|las|un|una|le|la|les|un|une)$/.test(p[0])) put(p[1], b.replace(/^(the|a|an) /i, '')); }   // (never over a word we already know)
      } }
  } catch {}
  return (RS_GLOSS[lang] = m);
}
function rsGloss(word, lang) {
  const m = rsGlossMap(lang), w = String(word || '').toLowerCase().replace(/[.,!?¿¡;:«»"“”()]/g, '');
  const dict = RS_DICT_GET(lang, w); if (dict?.[1]) return dict[1];
  if (m.has(w)) return m.get(w);
  if (lang === 'fr' && w.includes("'")) { const [a, b] = [w.split("'")[0] + "'", w.split("'").slice(1).join("'")]; const ga = m.get(a), gb = m.get(b); if (ga || gb) return [ga, gb].filter(Boolean).join(' + '); }
  if (lang === 'ja' && /の$/.test(w) && m.has(w.slice(0, -1))) return m.get(w.slice(0, -1)) + "'s";
  return '';
}

/* ---------- Drag words into place (or out of the sentence), like the old builder ----------
   A quick tap still works. Move your finger or mouse a little and the word comes with you: drop it in the sentence
   where you want it (in Practice, onto a blank), or drag it out of the sentence to take it back. */
(() => {
  let d = null, noClick = false;
  const lineEl = () => document.querySelector('.bld-line');
  const dropIndex = (line, x, y) => {
    const chips = [...line.querySelectorAll('.bld-chip[data-id]')].filter(c => +c.dataset.id !== d.id);
    for (let i = 0; i < chips.length; i++) { const r = chips[i].getBoundingClientRect(); if (y < r.top) return i; if (y <= r.bottom && x < r.left + r.width / 2) return i; }
    return chips.length;
  };
  const clearMark = () => { document.querySelectorAll('.bld-mark').forEach(m => m.remove()); lineEl()?.classList.remove('drop'); document.querySelectorAll('.bld-slot.over').forEach(s => s.classList.remove('over')); };
  const end = () => { if (!d) return; d.ghost?.remove(); d.el.classList.remove('dragging'); clearMark(); document.body.classList.remove('bld-dragging'); d = null; };
  document.addEventListener('pointerdown', e => {
    if (view.name !== 'realsent' || !rs || rs.done || e.button > 0) return;
    const el = e.target.closest('.bld-chip[data-id]'); if (!el || el.disabled) return;
    d = { el, id: +el.dataset.id, from: el.closest('.bld-line') ? 'line' : 'tray', x: e.clientX, y: e.clientY, pid: e.pointerId, moved: false, at: null };
  });
  document.addEventListener('pointermove', e => {
    if (!d || e.pointerId !== d.pid) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
      d.moved = true; const r = d.el.getBoundingClientRect();
      d.dx = d.x - r.left; d.dy = d.y - r.top;
      d.ghost = d.el.cloneNode(true); d.ghost.classList.add('bld-ghost'); d.ghost.classList.remove('hint', 'bad'); d.ghost.style.width = r.width + 'px';
      document.body.append(d.ghost); d.el.classList.add('dragging'); document.body.classList.add('bld-dragging');
    }
    e.preventDefault();
    d.ghost.style.transform = `translate(${e.clientX - d.dx}px, ${e.clientY - d.dy}px)`;
    const line = lineEl(); if (!line) return;
    const lr = line.getBoundingClientRect(), inside = e.clientX > lr.left - 24 && e.clientX < lr.right + 24 && e.clientY > lr.top - 24 && e.clientY < lr.bottom + 24;
    if (rs.frame) {   // Practice: light up the blank under the pointer
      clearMark(); if (inside) line.classList.add('drop');
      d.ghost.style.visibility = 'hidden'; const under = document.elementFromPoint(e.clientX, e.clientY); d.ghost.style.visibility = '';
      under?.closest('.bld-slot')?.classList.add('over'); d.at = inside ? 0 : null; return;
    }
    const at = inside ? dropIndex(line, e.clientX, e.clientY) : null;
    if (at === d.at && inside === line.classList.contains('drop')) return;
    clearMark(); d.at = at;
    if (inside) {
      line.classList.add('drop');
      const chips = [...line.querySelectorAll('.bld-chip[data-id]')].filter(c => +c.dataset.id !== d.id), mark = document.createElement('span'); mark.className = 'bld-mark';
      if (chips[at]) chips[at].before(mark); else (line.querySelector('.rs-end') ? line.querySelector('.rs-end').before(mark) : line.append(mark));
    }
  }, { passive: false });
  document.addEventListener('pointerup', e => {
    if (!d || e.pointerId !== d.pid) return;
    if (!d.moved) { d = null; return; }   // just a tap: the normal click handles it
    noClick = true; setTimeout(() => { noClick = false; }, 400);
    const { id, from, at } = d; d.ghost.style.visibility = 'hidden'; const under = document.elementFromPoint(e.clientX, e.clientY); end();
    const c = rs?.chips?.[id]; if (!c || rs.done) return;
    const wasUsed = c.used, said = () => { if (c.used && !wasUsed && typeof rsSayWord === 'function') rsSayWord(c); };   // 🔊 a word dragged in from the list is said out loud
    if (rs.frame) {
      const was = rs.fill.indexOf(id);
      if (at == null) { if (was >= 0) { rs.fill[was] = null; c.used = false; } }   // dragged out: back to the word list
      else {
        const slot = under?.closest('.bld-slot'), onWord = under?.closest('.bld-line .bld-chip[data-id]');
        let to = slot ? +slot.dataset.i : onWord ? rs.fill.indexOf(+onWord.dataset.id) : rs.frame.findIndex((f, i) => f.blank && rs.fill[i] == null);
        if (to < 0 || !rs.frame[to]?.blank) return render();
        const other = rs.fill[to];
        if (was >= 0) rs.fill[was] = other ?? null; else if (other != null) rs.chips[other].used = false;   // swap, or send the old word back
        rs.fill[to] = id; c.used = true;
      }
      Object.assign(rs, { gap: null, msg: null, bad: -1, hint: -1 }); said();
      return rsComplete() ? rsCheck() : render();
    }
    rs.line = rs.line.filter(x => x !== id);
    if (at != null) { c.used = true; rs.line.splice(Math.min(at, rs.line.length), 0, id); }
    else c.used = false;   // dragged out of the sentence: back to the word list
    Object.assign(rs, { gap: null, msg: null, bad: -1, hint: -1 }); said();
    rsComplete() ? rsCheck() : render();
  });
  document.addEventListener('pointercancel', end);
  // after a drag, don't also treat it as a tap
  document.addEventListener('click', e => { if (noClick && e.target.closest('.bld-chip')) { e.stopPropagation(); e.preventDefault(); noClick = false; } }, true);
})();

/* ---------- Missing words: look them up on Wiktionary (en.wiktionary.org, CC BY-SA) ----------
   Only for words the Sentence Builder doesn't know (mostly words in your own cards' sentences). Only the word is sent.
   Answers are kept on this device, so each word is looked up once. A form like "pars" (= "form of partir") gets the
   meaning of the base word: "to leave (partir)". Switch it off with 🌐 Look up missing words. */
const RS_WIKI_KEY = 'estudiamos.rsWiki';
let RS_WIKI = null;
const rsWikiStore = () => { if (!RS_WIKI) { try { RS_WIKI = JSON.parse(localStorage.getItem(RS_WIKI_KEY) || '{}') || {}; } catch { RS_WIKI = {}; } } return RS_WIKI; };
function rsWikiSave() { try { const k = Object.keys(RS_WIKI); if (k.length > 4000) for (const x of k.slice(0, k.length - 4000)) delete RS_WIKI[x]; localStorage.setItem(RS_WIKI_KEY, JSON.stringify(RS_WIKI)); } catch {} }
const RS_WIKI_POS = { noun: 'noun', 'proper noun': 'noun', verb: 'verb', 'auxiliary verb': 'verb', adjective: 'adj', adverb: 'adv', pronoun: 'pron', determiner: 'det', article: 'det', numeral: 'det', preposition: 'prep', contraction: 'prep', conjunction: 'conj', particle: 'part', postposition: 'part' };
const rsWikiOn = () => S.settings.rsLookup !== false;
const rsStrip = s => String(s || '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
async function rsWikiFetch(word) {
  try { const r = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`); if (r.status === 404) return {}; if (!r.ok) return null; return await r.json(); }
  catch { return null; }
}
const rsFirstDef = list => { for (const e of list || []) { const d = (e.definitions || []).map(x => rsStrip(x.definition)).find(x => x && !/^\(.*\)$/.test(x) && !/^\([^)]*(archaic|obsolete|dated|rare|literary|historical|regional|slang|vulgar)/i.test(x)); if (d) return { def: d, pos: String(e.partOfSpeech || '').toLowerCase() }; } return null; };
async function rsWikiLookup(word, lang) {
  const st = rsWikiStore(), key = lang + '|' + word; if (key in st) return st[key];
  const j = await rsWikiFetch(word); if (j === null) return undefined;   // offline: try again another time
  const list = j[lang] || [], first = rsFirstDef(list);
  let type = null; for (const e of list) { const t = RS_WIKI_POS[String(e.partOfSpeech || '').toLowerCase()]; if (t) { type = t; break; } }
  let gloss = first ? first.def.replace(/\s*\([^)]*\)?/g, '').replace(/:$/, '').trim() : '';
  // "first-person singular present indicative of partir" -> the meaning of partir
  const form = /(form|plural|singular|participle|indicative|subjunctive|imperative|conditional|preterite|imperfect|gerund|person|feminine|masculine|inflection|conjugation|polite|past tense|te-form|negative)\b[^;]*? of ([^\s,;.():]+)/i.exec(gloss);
  if (form) {
    const lemma = form[2], known = typeof rsGloss === 'function' ? rsGloss(lemma, lang) : '';   // our own meaning of the base word first
    if (known) gloss = `${known} (${lemma})`;
    const lj = known ? null : await rsWikiFetch(lemma), ld = known ? null : rsFirstDef(lj?.[lang]);
    if (ld) gloss = `${ld.def.replace(/\s*\([^)]*\)?/g, '').split(/[;.:]/)[0].trim()} (${lemma})`;
  }
  gloss = gloss.split(/[;]/)[0].replace(/\.$/, '').trim().replace(/^([^,(]*,[^,(]*),[^(]*/, '$1 ').replace(/\s+\(/, ' (').trim();
  if (gloss.length > 42) gloss = gloss.slice(0, 40).replace(/\s+\S*$/, '') + '…';
  const v = type || gloss ? [type, gloss] : 0; st[key] = v; rsWikiSave(); return v;
}
async function rsFillMissing() {
  if (!rsWikiOn() || !rs?.chips) return;
  const round = rs.s, need = rs.chips.filter(c => !c.gloss || !c.type); if (!need.length) return;
  let changed = false;
  for (const c of need) {
    const word = String(rs.words[c.id] ?? c.w ?? ''), w = rs.lang === 'ja' ? word : word.replace(/[.,!?¿¡;:«»"“”()]/g, '');
    if (!w || /^\d+$/.test(w)) continue;
    let v = await rsWikiLookup(w, rs.lang);
    if (v === 0 && rs.lang !== 'ja' && w !== w.toLowerCase()) v = await rsWikiLookup(w.toLowerCase(), rs.lang);
    if (!rs || rs.s !== round) return;
    if (!v) continue;
    if (!c.gloss && v[1]) { c.gloss = v[1]; changed = true; }
    if (!c.type && v[0]) { c.type = v[0]; changed = true; }
  }
  if (changed && view.name === 'realsent' && rs?.s === round) render();
}
document.addEventListener('change', e => {
  if (view.name !== 'realsent' || !rs || e.target.id !== 'rsLookup') return;
  S.settings.rsLookup = e.target.checked; save(); if (e.target.checked) rsFillMissing(); render();
});
