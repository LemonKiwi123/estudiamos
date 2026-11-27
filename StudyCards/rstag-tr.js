'use strict';
/* ================= Sentence Builder · 📖 Real sentences: Turkish word types and meanings =================
   Turkish stacks endings on a word (ev-ler-im-de = in my houses), so most words are found by taking endings off a known
   stem: the Sentence Builder's words, the word list in rsdict-tr.js (verbs listed as -mak / -mek) and your own cards.
   Safe rules only: a known noun or describing word + plural / owner / case / “is” endings; a known verb stem + endings that
   only verbs take (-iyor, -di, -miş, -ecek, -ir / -er, -mez, -meli, -ip, -erek…). If a word could be read both ways, or
   no known stem fits, it gets no label. bu / şu / o before a noun point at it (det), on their own they stand for it (pron).
   Letters are lower-cased the Turkish way (I → ı, İ → i). Loaded after rstag.js, rsdict-tr.js and builder-tr.js. */
RS_LANGS.tr = 'Turkish';
RS_POS_BY.tr = ['noun', 'verb', 'adj', 'adv', 'pron', 'det', 'prep', 'conj', 'part'];
const rsTrLow = s => String(s || '').replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase().replace(/i̇/g, 'i');
RS_CLOSED.tr = {
  pron: RS_W('ne ben beni bana bende benden benim benimle sen seni sana sende senden senin seninle onu ona onda ondan onun onunla biz bizi bize bizde bizden bizim bizimle siz sizi size sizde sizden sizin sizinle onlar onları onlara onlarda onlardan onların onlarla '
    + 'bunu buna bunda bundan bunun bununla bunlar bunları bunlara bunların şunu şuna şunda şundan şunun şunlar şunları kim kimi kime kimde kimden kimin kimse kimseyi kimseye herkes herkesi herkese herkesin hepimiz hepiniz hepsi hepsini biri birisi birini birine birinin birisini '
    + 'kendi kendim kendimi kendime kendin kendini kendine kendisi kendisini kendisine kendimiz kendinizi neyi neye neden nereye nerede nereden nesi hiçbir şey şeyi hiçbiri birbirimizi birbirimize birbirlerini birbirine'),
  dem: RS_W('bu şu o'),
  det: RS_W('bir her birkaç bazı tüm bütün hiçbir hangi birçok iki üç dört beş altı yedi sekiz dokuz on yirmi otuz kırk elli altmış yetmiş seksen doksan yüz bin milyon ilk'),
  prep: RS_W('için ile gibi kadar göre beri doğru karşı rağmen hakkında üzere boyunca dolayı itibaren önce sonra'),
  conj: RS_W('ve veya ya yahut ama fakat ancak çünkü eğer ki hem yoksa oysa sanki ise madem halbuki'),
  adv: RS_W('çok daha en pek hiç bile de da hep şimdi bugün yarın dün burada orada şurada buraya oraya buradan oradan nerede nasıl niçin niye belki sadece yalnızca yalnız artık henüz hâlâ hala zaten hemen sonra önce çabuk yavaş yavaşça gerçekten genellikle bazen sık asla '
    + 'evet hayır tamam lütfen birlikte beraber yine tekrar biraz az fazla oldukça epey bayağı neredeyse aslında galiba herhalde mutlaka kesinlikle elbette tabii tabi hemen hemen erken geç bazen sonunda şöyle böyle öyle iyice ayrıca hatta özellikle nihayet yakında şu an çoktan dışarı içeri yukarı aşağı ileri geri bu gece bu sabah'),
  part: RS_W('mı mi mu mü mısın misin musun müsün mıyım miyim muyum müyüm mıyız miyiz muyuz müyüz mısınız misiniz musunuz müsünüz mıydı miydi muydu müydü mıdır midir mudur müdür değil değilim değilsin değiliz değilsiniz değiller değildi değildir değilse'),
  verb: RS_W('var yok vardı yoktu varsa yoksa vardır yoktur olur olmaz lazım gerek gerekiyor'),
};
// the stems we know: [type, meaning, plain form]
let RS_TR_STEMS = null;
function rsTrStems() {
  if (RS_TR_STEMS) return RS_TR_STEMS;
  const m = new Map(), put = (stem, t, g, w) => { if (stem && stem.length >= 2 && !m.has(stem)) m.set(stem, [t, g, w]); };
  const verb = (inf, g) => { const st = inf.slice(0, -3); put('V:' + st, 'verb', g, inf); };
  for (const [w, [t, g]] of (RS_DICT.tr || new Map())) { if (t === 'verb' && /m[ae]k$/.test(w)) verb(w, g); else if (t === 'noun' || t === 'adj') put(w, t, g, w); }
  if (typeof TR_NOUN !== 'undefined') {
    TR_NOUN.forEach(n => put(n[0], 'noun', n[2], n[0])); TR_ADJ.forEach(a => put(a[0], 'adj', a[4] || a[1], a[0]));
    TR_VERB.forEach(v => verb(v.w, v.be ? 'to be afraid' : 'to ' + v.en[0]));
  }
  // your own cards: one-word Turkish fronts with their meaning
  try {
    for (const d of S.decks) { if (langBase(d.frontLang || '') !== 'tr') continue;
      for (const c of cardsOf(d.id)) { const f = rsTrLow(plainSent(c.front || '').trim()), b = plainSent(c.back || '').split(/[\n;,/]/)[0].trim(); if (!f || /\s/.test(f) || !b || b.length > 30) continue;
        if (/m[ae]k$/.test(f) && /^to /i.test(b)) verb(f, b); else { const k = typeof clPos === 'function' ? clPos(c) : null; if (k === 'noun' || k === 'adj') put(f, k, b.replace(/^(the|a|an) /i, ''), f); } } }
  } catch {}
  return (RS_TR_STEMS = m);
}
/* ---- endings ---- */
const V4 = '[ıiuü]', V2 = '[ae]', PERS = `(?:y?${V4}m|s${V4}n|y?${V4}z|s${V4}n${V4}z|l${V2}r|k)`;
const RS_TR_NOUN_END = new RegExp(`^(?:l${V2}r)?(?:${V4}?m${V4}z|${V4}?n${V4}z|${V4}?m|${V4}?n|s?${V4}|l${V2}r${V4})?`
  + `(?:y?${V4}|n${V4}|y?${V2}|n${V2}|n?[dt]${V2}n?|n?${V4}n|y?l${V2}|y?${V4}nc${V2})?(?:ki)?`
  + `(?:y?${V4}m|s${V4}n|y?${V4}z|s${V4}n${V4}z|l${V2}r|[dt]${V4}r|y?[dt]${V4}(?:m|n|k|n${V4}z|l${V2}r)?|y?m${V4}ş(?:${V4}m|s${V4}n|${V4}z|l${V2}r)?|y?s${V2})?$`);
const RS_TR_VERB_END = new RegExp('^(?:'
  + `(?:m${V4})?${V4}?yor(?:${PERS}|du(?:m|n|k|nuz|lar)?|muş|sa)?`                      // -iyor (okuyorum, gelmiyor, geliyordu)
  + `|(?:m${V2}|y${V2}m${V2}|${V2}m${V2})?y?[dt]${V4}(?:m|n|k|n${V4}z|l${V2}r|ysa)?`     // -di (geldim, gitmedi, okuyamadık)
  + `|(?:m${V2})?y?m${V4}ş(?:${V4}m|s${V4}n|${V4}z|s${V4}n${V4}z|l${V2}r|t${V4}r|t${V4}(?:m|n|k)?)?`      // -miş
  + `|(?:m${V2})?y?${V2}c${V2}[kğ](?:${V4}m|s${V4}n|${V4}z|s${V4}n${V4}z|l${V2}r|t${V4}r|t${V4}(?:m|n|k)?|${V4}n${V4}|${V4})?`   // -ecek (gideceğim)
  + `|(?:${V2}|${V4})?r(?:${V4}m|s${V4}n|${V4}z|s${V4}n${V4}z|l${V2}r|d${V4}(?:m|n|k)?|s${V2}(?:m|n|k)?|k${V2}n)?`   // -ir / -er (gelir, okursun, gelirse, gelirken)
  + `|(?:y?${V2})?m${V2}z(?:s${V4}n|s${V4}n${V4}z|l${V2}r|d${V4}|s${V2})?|(?:y?${V2})?m${V2}m|(?:y?${V2})?m${V2}y${V4}z`   // -mez (gelmez, gelmem, gelemez)
  + `|(?:m${V2})?m${V2}l${V4}(?:y${V4}m|s${V4}n|y${V4}z|s${V4}n${V4}z|l${V2}r|d${V4}r|y${V4}d${V4})?`   // -meli (gelmeliyim)
  + `|m${V2}k(?:t${V2}n?|t${V2}y${V4}m|${V4}|${V2}|l${V2}|s${V4}z|t${V4}r)?|m${V2}(?:y${V4}|y${V2}|s${V4}(?:n${V4}|n${V2})?|d${V2}n|m${V4}z)`   // -mek / -mesi / -meden
  + `|y?${V2}bil(?:${V4}r|iyor|di|ecek|m${V2}k|m${V4}ş|s${V2}|${V4}r${V4}m|${V4}rs${V4}n|${V4}r${V4}z|${V4}rl${V2}r|${V4}r${V4}m|d${V4}m|d${V4}k|ir misin)?\\w*`   // -ebil (gelebilir)
  + `|y?${V4}p|y?${V2}r${V2}k|y?${V4}nc${V2}|y?${V2}n(?:l${V2}r)?|[dt]${V4}ğ${V4}?(?:m|n|m${V4}z|n${V4}z)?(?:${V4}|${V2}|n${V2}|n${V4}|nd${V2}|nd${V2}n)?|[dt]${V4}kt${V2}n|y?${V2}l${V4}m|y?${V4}n(?:${V4}z)?|s${V4}n(?:l${V2}r)?|y?s${V2}(?:m|n|k|n${V4}z|l${V2}r)?`   // -ip -erek -ince -en -diği -elim -in -sin -se
  + ')$');
const RS_TR_SOFT = { b: 'p', c: 'ç', d: 't', ğ: 'k', g: 'k' };
// every stem + ending split of a word that fits what we know
function rsTrSplit(w) {
  const S = rsTrStems(), out = [];
  for (let k = w.length; k >= 2; k--) {
    const head = w.slice(0, k), rest = w.slice(k);
    // nouns and describing words (kitab-ı → kitap, ağz-ı → ağız, kalb-i → kalp)
    const cands = [head];
    if (RS_TR_SOFT[head.slice(-1)] && rest && /^[aeıioöuü]/.test(rest)) cands.push(head.slice(0, -1) + RS_TR_SOFT[head.slice(-1)]);
    if (rest && /^[aeıioöuü]/.test(rest) && /[^aeıioöuü]{2}$/.test(head)) { const v = { a: 'ı', e: 'i', ı: 'ı', i: 'i', o: 'u', u: 'u', ö: 'ü', ü: 'ü' }[rest[0]]; cands.push(head.slice(0, -1) + v + head.slice(-1)); }   // ağzı → ağız, burnu → burun, şehri → şehir
    for (const c of cands) { const e = S.get(c); if (e && (e[0] === 'noun' || e[0] === 'adj') && (rest === '' || RS_TR_NOUN_END.test(rest))) out.push({ t: e[0], g: e[1], stem: c, rest }); }
    // verbs (gid-iyor → git, oku-yor, bekl-iyor → bekle, yi-yor → ye)
    const vc = [head];
    if (RS_TR_SOFT[head.slice(-1)] && /^[aeıioöuü]/.test(rest)) vc.push(head.slice(0, -1) + RS_TR_SOFT[head.slice(-1)]);
    if (/^[ıiuü]?yor/.test(rest) || /^yor/.test(rest)) for (const v of 'aeıioöuü') vc.push(head + v);   // bekl-iyor → bekle
    if (/^y[ae](?:c|bil|m|n|r)/.test(rest) || /^y[ıiuü]p/.test(rest)) vc.push(head);
    for (const c of vc) { const e = S.get('V:' + c); if (e && (rest === '' ? c.length >= 3 : RS_TR_VERB_END.test(rest))) out.push({ t: 'verb', g: e[1], stem: c, rest, inf: e[2] }); }
    if (head === 'yi' && /^yor/.test(rest) || head === 'di' && /^yor/.test(rest)) { const e = S.get('V:' + (head === 'yi' ? 'ye' : 'de')); if (e) out.push({ t: 'verb', g: e[1], stem: head, rest, inf: e[2] }); }
  }
  return out;
}
function rsTrAnalyse(w) {
  const all = rsTrSplit(w); if (!all.length) return null;
  const types = new Set(all.map(a => a.t === 'adj' ? 'noun' : a.t));
  if (types.size > 1) {
    // a longer stem wins when it covers most of the word (gelin = bride, not gel + -in)
    const best = all.reduce((a, b) => b.stem.length > a.stem.length ? b : a);
    if (all.every(a => a === best || a.stem.length + 1 < best.stem.length)) return best;
    return null;
  }
  return all.reduce((a, b) => b.stem.length > a.stem.length ? b : a);
}
function rsTrTag(w, i, low) {
  const C = RS_CLOSED.tr, dict = RS_DICT_GET('tr', w);
  if (C.dem.has(w)) return null;   // decided from the next word
  if (dict && !/m[ae]k$/.test(w)) return dict[0];
  for (const k of ['part', 'pron', 'conj', 'prep', 'adv', 'det', 'verb']) if (C[k].has(w)) return k;
  if (dict) return dict[0];
  const r = rsLex('tr'); if (r.has(w)) return r.get(w);   // your own cards' word labels
  if (/^m[ıiuü](?:s[ıiuü]n|y[ıiuü]m|y[ıiuü]z|s[ıiuü]n[ıiuü]z|yd[ıiuü]|d[ıiuü]r)?$/.test(w)) return 'part';
  if (/^değil/.test(w)) return 'part';
  const a = rsTrAnalyse(w); if (a) return a.t;
  return null;
}
{ const prevTag = rsTagWord; rsTagWord = function (w, i, low, lang) { return lang === 'tr' ? rsTrTag(rsTrLow(w), i, low) : prevTag(w, i, low, lang); }; }
{ const prevSent = rsTagSentence;
  rsTagSentence = function (words, lang) {
    if (lang !== 'tr') return prevSent(words, lang);
    const low = words.map(w => rsTrLow(w).replace(/[.,!?;:«»"“”()]/g, ''));
    const out = low.map((w, i) => w.includes("'") ? 'noun' : rsTrTag(w, i, low));   // Tom'un, İstanbul'da: a name with its ending
    for (let i = 0; i < out.length; i++) {
      const w = low[i];
      // bu / şu / o: before a noun or describing word they point at it; on their own they stand for it
      if (RS_CLOSED.tr.dem.has(w)) out[i] = /^(noun|adj)$/.test(out[i + 1] || '') && !(out[i + 1] === 'noun' && RS_DICT_GET('tr', low[i + 1])?.[0] === 'adv') ? 'det' : 'pron';
      // a name: a capital letter in the middle of the sentence that no list knows
      if (out[i] == null && i > 0 && /^[A-ZÇĞİÖŞÜ]/.test(words[i])) out[i] = 'noun';
      if (out[i] == null && i === 0 && /^[A-ZÇĞİÖŞÜ]/.test(words[0]) && RS_DATA.tr?.lower && !RS_DATA.tr.lower.has(w)) out[i] = 'noun';
    }
    return out;
  };
}

const trCapName = w => w ? String(w[0]).replace('i', 'İ').replace('ı', 'I').toUpperCase() + w.slice(1) : w;
/* meanings for the word tags */
RS_GLOSS_COMMON.tr = 'bir:a / one|ve:and|bu:this|şu:that|o:he / she / it / that|ben:I|sen:you|biz:we|siz:you (all)|onlar:they|beni:me|bana:to me|benim:my|seni:you|sana:to you|senin:your|onu:him / her / it|ona:to him / her|onun:his / her|bizi:us|bize:to us|bizim:our|sizi:you|size:to you|sizin:your|onları:them|onlara:to them|onların:their|'
  + 'bunu:this (one)|buna:to this|bunun:of this|ne:what|kim:who|nerede:where|nereye:where to|nereden:where from|neden:why|niçin:why|niye:why|nasıl:how|hangi:which|kaç:how many|ne zaman:when|'
  + 'mı:(question)|mi:(question)|mu:(question)|mü:(question)|değil:not|değilim:I am not|değilsin:you are not|var:there is / have|yok:there isn’t / don’t have|vardı:there was / had|yoktu:there wasn’t|'
  + 'çok:very / a lot|daha:more / yet|en:most|hiç:never / at all|de:too / also|da:too / also|ki:that|için:for|ile:with|gibi:like|kadar:as … as / until|ama:but|fakat:but|çünkü:because|eğer:if|veya:or|ya da:or|'
  + 'evet:yes|hayır:no|lütfen:please|şimdi:now|bugün:today|yarın:tomorrow|dün:yesterday|burada:here|orada:there|her:every|hep:always|bile:even|sadece:only|artık:now / any more|henüz:yet|hâlâ:still|hala:still|zaten:already|belki:maybe|tamam:OK|kendi:own / self|herkes:everyone|biraz:a little|sonra:after / later|önce:before / ago';
{ const prevMap = rsGlossMap;
  rsGlossMap = function (lang) {
    if (lang !== 'tr' || RS_GLOSS.tr) return prevMap(lang);
    const m = prevMap('tr'), put = (w, g) => { if (w && g && !m.has(w)) m.set(w, String(g)); };
    if (typeof TR_NOUN !== 'undefined') {
      TR_NOUN.forEach(n => put(n[0], n[2])); TR_ADJ.forEach(a => put(a[0], a[4] || a[1])); TR_VERB.forEach(v => put(v.w, v.be ? 'to be afraid' : 'to ' + v.en[0]));
      TR_PRON.forEach(p => put(p[0], p[2])); TR_ADV.forEach(a => put(a[0], a[1]));
    }
    return m;
  };
}
// what the endings add, in a few words
function rsTrEndNote(a) {
  const r = a.rest; if (!r) return '';
  const n = [];
  if (a.t === 'verb') {
    if (/^(m[ıiuü]yor|m[ae]d|m[ae]m|m[ae]z|m[ae]y|y?[ae]m[ae])/.test(r)) n.push('not');
    if (/yor/.test(r)) n.push('-iyor: is …ing');
    else if (/^(m[ae])?y?[dt][ıiuü]/.test(r)) n.push('past');
    else if (/m[ıiuü]ş/.test(r)) n.push('-miş: has / apparently');
    else if (/[ae]c[ae][kğ]/.test(r)) n.push('-ecek: will');
    else if (/bil/.test(r)) n.push('-ebil: can');
    else if (/m[ae]l[ıi]/.test(r)) n.push('-meli: must');
    else if (/^m[ae]k/.test(r)) n.push('to …');
    else if (/^(y?[ıiuü]p)$/.test(r)) n.push('-ip: and');
    else if (/^(y?[ıiuü]nc[ae])$/.test(r)) n.push('-ince: when');
    else if (/^y?[ae]n$/.test(r)) n.push('-en: who / that …');
    else if (/^(y?[ae]|[ıiuü])?r|m[ae]z/.test(r)) n.push('usually / will');
    const per = /(y?[ıiuü]m|[dt][ıiuü]m|ğ[ıiuü]m|m[ae]m)$/.test(r) ? 'I' : /(s[ıiuü]n|[dt][ıiuü]n)$/.test(r) ? 'you' : /(y?[ıiuü]z|[dt][ıiuü]k|ğ[ıiuü]z)$/.test(r) ? 'we' : /s[ıiuü]n[ıiuü]z$/.test(r) ? 'you all' : /l[ae]r$/.test(r) ? 'they' : '';
    if (per) n.push(per);
  } else {
    if (/^l[ae]r/.test(r)) n.push('more than one');
    const x = r.replace(/^l[ae]r/, '');
    if (/^(n|y)?[dt][ae]n/.test(x) || /[dt][ae]n$/.test(x)) n.push('from');
    else if (/^n?[dt][ae]|[ıiuü]?m?[ıiuü]?n?[dt][ae]$/.test(x) || /[dt][ae](ki)?$/.test(x)) n.push('in / at');
    else if (/^(y?[ae]|[ıiuü]?[mn][ae]|s[ıiuü]n[ae]|[ıiuü]n[ae])$/.test(x)) n.push('to');
    else if (/^(n?[ıiuü]n|[ıiuü]n[ıiuü]n|s[ıiuü]n[ıiuü]n)$/.test(x)) n.push('’s');
    else if (/^(y?[ıiuü]|n[ıiuü])$/.test(x)) n.push('the (object) / his, her');
    else if (/^[ıiuü]?m$/.test(x)) n.push('my / I am');
    else if (/^y?l[ae]$/.test(x)) n.push('with');
    else if (/m[ıiuü]z/.test(x)) n.push('our / we are');
    else if (/^[ıiuü]?n$/.test(x)) n.push('your');
    else if (/^s[ıiuü]/.test(x)) n.push('his / her');
  }
  return n.join(', ');
}
{ const prevGloss = rsGloss;
  rsGloss = function (word, lang) {
    if (lang !== 'tr') return prevGloss(word, lang);
    const w = rsTrLow(word).replace(/[.,!?;:«»"“”()]/g, '');
    const g = prevGloss(w, lang); if (g) return g;
    if (w.includes("'")) { const [name, end] = w.split("'"); const n = rsTrEndNote({ t: 'noun', rest: end }); return trCapName(name) + (n ? ` (${n})` : ''); }
    const a = rsTrAnalyse(w); if (!a || !a.g) return '';
    const note = rsTrEndNote(a);
    return note ? `${a.g.replace(/^to /, a.rest && !/^m[ae]k$/.test(a.rest) ? '' : 'to ')} (${note})` : a.g;
  };
}
