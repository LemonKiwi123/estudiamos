'use strict';
/* ================= Game text in your target language =================
   Shared by Lexicon Saga and Wordling Trails. Every line the games show passes through gtLine():
   names and numbers are swapped for {p} and {n}, the rest is looked up in a phrase book (gametr-es.js),
   and the names and numbers go back in. Lines that are not in the phrase book stay in English.
   Setting: S.settings.gameLang = 'target' (the deck's language, when we have a phrase book for it) or 'en'. */
const GT_BOOKS = {};   // lang -> { lines: {english template: translation}, names: {English name: translation} }
const gtBase = l => String(l || '').toLowerCase().split(/[-_]/)[0];
function gtWant(deckLang) { return S.settings?.gameLang === 'target' && GT_BOOKS[gtBase(deckLang)] ? gtBase(deckLang) : null; }
const GT_LANG_NAMES = { es: 'Español' };
function gtPrep(book) {
  if (book.ready) return book;
  book.map = new Map(); book.loose = new Map();
  for (const [en, tr] of Object.entries(book.lines)) { const k = gtKey(en); book.map.set(k, tr); book.loose.set(gtLoose(k), tr); }
  book.ready = true; return book;
}
const gtKey = t => t.replace(/\{p\d*\}/g, '{p}').replace(/\{n\d*\}/g, '{n}').replace(/\s+/g, ' ').trim();
const gtLoose = k => k.replace(/^[^A-Za-z{<¿¡“"(]+/, '').replace(/[\s.!…]+$/, '').toLowerCase();
const gtEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* names: proper names that stay (or have their own translation in book.names) */
function gtLine(html, lang, names = []) {
  if (!lang || html == null) return html;
  const book = GT_BOOKS[lang]; if (!book) return html;
  gtPrep(book);
  const str = String(html), fx = (str.match(/^(<i hidden data-fx="[^"]*"><\/i>)/) || [''])[0], body = str.slice(fx.length);
  const P = [], N = [];
  let t = body;
  const all = [...new Set([...names, ...Object.keys(book.names || {})])].filter(x => x && x.length > 1).sort((a, b) => b.length - a.length);
  if (all.length) { const re = gtNameRe(all); t = t.replace(re, m => { P.push(m); return '\u0001'; }); }
  t = t.replace(/\d+(?:[.,]\d+)?/g, m => { N.push(m); return '\u0002'; });
  const key = t.replace(/\u0001/g, '{p}').replace(/\u0002/g, '{n}').replace(/\s+/g, ' ').trim();
  let tr = book.map.get(key), lead = '', tail = '';
  if (tr == null) {   // try again without leading icons and trailing punctuation
    const m = /^([^A-Za-z{<¿¡“"(]*)(.*?)([\s.!…]*)$/s.exec(key); lead = m[1]; tail = m[3];
    tr = book.loose.get(gtLoose(key));
    if (tr != null) { tr = tr.replace(/^[^A-Za-zÀ-ÿ{<¿¡“"(]+/, ''); if (/[.!…?]$/.test(tr)) tail = ''; }
  }
  if (tr == null) {   // "Speaker: what they say" -> translate what they say
    const sp = /^((?:[^:<]|<b>[^<]*<\/b>){1,40}?): (.+)$/s.exec(body);
    if (sp && !/^\{/.test(sp[2])) { const said = gtLine(sp[2], lang, names); if (said !== sp[2]) return fx + gtName(book, sp[1].trim()) + ': ' + said; }
    let out = body.replace(gtNameRe(all.length ? all : ['\u0000']), v => gtName(book, v));
    for (const [re, to] of book.frag || []) out = out.replace(re, to);
    return fx + out;
  }
  let pi = 0, ni = 0;
  const out = tr.replace(/\{p(\d*)\}/g, (_, d) => gtName(book, P[d === '' ? pi++ : +d] ?? ''))
    .replace(/\{n(\d*)\}/g, (_, d) => N[d === '' ? ni++ : +d] ?? '');
  return fx + lead + out + tail;
}
/* a name in the other language: "Blotling A" -> "Manchita A", "Quillhaven · Tavern" -> "Quillhaven · Taberna" */
function gtName(book, v) {
  const n = book.names || {}; if (n[v] != null) return n[v];
  let m = /^(.*) ([ABC])$/.exec(v); if (m && n[m[1]] != null) return n[m[1]] + ' ' + m[2];
  for (const [en, tr] of book.suffix || []) if (v.endsWith(en)) { const base = v.slice(0, -en.length); return (n[base] ?? base) + tr; }
  return v;
}
const gtNameCache = new Map();
function gtNameRe(list) {
  const k = list.join('\u0003'); if (gtNameCache.has(k)) return gtNameCache.get(k);
  const re = new RegExp(`(?<![A-Za-zÀ-ÿ])(?:${list.map(gtEsc).join('|')})(?:\\s[ABC](?![A-Za-z]))?(?![A-Za-zÀ-ÿ])`, 'g');
  if (gtNameCache.size > 20) gtNameCache.clear(); gtNameCache.set(k, re); return re;
}
/* translate a rendered box: every text line, menu label, title and sub-label */
function gtBox(el, lang, names) {
  if (!lang || !el) return;
  for (const n of el.querySelectorAll('.sg-text, .tr-text, .sg-mtitle, .tr-mtitle, .sg-ml, .tr-ml, .tr-mi > small, .sg-back, .tr-back, .sg-verdict, .tr-verdict, .sg-cast, .tr-sub')) {
    if (n.dataset.gt) continue; n.dataset.gt = 1;
    const kids = [...n.childNodes], small = kids.find(c => c.nodeName === 'SMALL');
    if (small) { const main = kids.filter(c => c !== small).map(c => c.outerHTML ?? esc(c.textContent)).join(''); n.innerHTML = gtLine(main, lang, names) + `<small>${gtLine(small.innerHTML, lang, names)}</small>`; }
    else n.innerHTML = gtLine(n.innerHTML, lang, names);
  }
  const inp = el.querySelector('#sgType, #trType'); if (inp && GT_BOOKS[lang].lines['Type the word…']) inp.placeholder = GT_BOOKS[lang].lines['Type the word…'];
}
/* the option menu item, shared by both games: returns [label, sub] */
function gtLangLabel(deckLang) { const b = gtBase(deckLang); return gtWant(deckLang) ? GT_LANG_NAMES[b] || b : 'English'; }
