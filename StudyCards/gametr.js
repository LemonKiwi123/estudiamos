'use strict';
/* ================= Game text in your target language =================
   Shared by Lexicon Saga and Wordling Trails. Every line the games show passes through gtLine():
   names and numbers are swapped for {p} and {n}, the rest is looked up in a phrase book (gametr-es.js),
   and the names and numbers go back in. Lines that are not in the phrase book stay in English.
   Setting: S.settings.gameLang = 'en', 'target' (the deck's language, when we have a phrase book for it), or a language
   with a phrase book ('es', 'fr', 'ja'), which then works with any deck. */
const GT_BOOKS = {};   // lang -> { lines: {english template: translation}, names: {English name: translation} }
const gtBase = l => String(l || '').toLowerCase().split(/[-_]/)[0];
function gtWant(deckLang) { const g = S.settings?.gameLang; if (g && g !== 'target' && g !== 'en') return GT_BOOKS[g] ? g : null; return g === 'target' && GT_BOOKS[gtBase(deckLang)] ? gtBase(deckLang) : null; }
/* the 🌐 Game language menu, shared by both games: English, then every language we have a phrase book for (any deck can use any of them) */
function gtLangItems(deckLang, reopen) {
  const cur = gtWant(deckLang) || 'en', mine = gtBase(deckLang), set = v => () => { S.settings.gameLang = v; save(); reopen(); };
  return [{ label: `${cur === 'en' ? '✅ ' : ''}English`, fn: set('en') },
    ...Object.keys(GT_BOOKS).map(l => ({ label: `${cur === l ? '✅ ' : ''}${GT_LANG_NAMES[l] || l}`, fn: set(l === mine ? 'target' : l),
      sub: l === mine ? 'Your deck’s language. Menus, battles and the story in it. Names stay the same.' : 'Menus, battles and the story in this language. Your cards stay as they are.' }))];
}
const GT_LANG_NAMES = { es: 'Español' };
function gtPrep(book) {
  if (book.ready) return book;
  book.map = new Map(); book.loose = new Map();
  for (const [en, tr] of Object.entries(book.lines)) {
    const k = gtKey(en); book.map.set(k, tr); book.loose.set(gtLoose(k), tr);
    // a line with a plain number in it ("4 at most") is looked up with the number as {n}, so it can still match
    const nums = k.replace(/\{[pn]\}/g, '').match(/\d+(?:[.,]\d+)?/g);
    // a line with a known name written into it ("Professor Rowan will give you one") is also looked up with the name as {p}
    const nm = Object.keys(book.names || {}).filter(x => x.length > 1 && k.includes(x)).sort((a, b) => b.length - a.length);
    if (nm.length) { let kn = k, tn = tr, ok = true; for (const x of nm) { const y = book.names[x]; if (!tn.includes(y)) { ok = false; break; } kn = kn.split(x).join('{p}'); tn = tn.split(y).join('{p}'); }
      if (ok && !book.map.has(kn)) { book.map.set(kn, tn); book.loose.set(gtLoose(kn), tn); } }
    if (nums && nums.every(n => tr.includes(n))) { const kn = k.replace(/\d+(?:[.,]\d+)?/g, '{n}'), tn = tr.replace(/\d+(?:[.,]\d+)?/g, '{n}'); if (!book.map.has(kn)) { book.map.set(kn, tn); book.loose.set(gtLoose(kn), tn); } }
  }
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
    if (sp && !/^\{/.test(sp[2])) { const said = gtLine(sp[2], lang, names), who = sp[1].trim(), whoT = book.names?.[who] ?? book.map.get(gtKey(who)) ?? gtName(book, who);   // a name, or a label like "🖍️ Screen colors"
      if (said !== sp[2]) return fx + whoT + ': ' + said; }
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
    if (small) { const main = kids.filter(c => c !== small).map(c => c.outerHTML ?? esc(c.textContent)).join(''), a = gtLine(main, lang, names), s2 = gtLine(small.innerHTML, lang, names);
      gtRemember(lang, main, a); gtRemember(lang, small.innerHTML, s2); n.innerHTML = a + `<small>${s2}</small>`; }
    else { const en = n.innerHTML, t = gtLine(en, lang, names); gtRemember(lang, en, t); n.innerHTML = t; }
  }
  const inp = el.querySelector('#sgType, #trType'); if (inp && GT_BOOKS[lang].lines['Type the word…']) inp.placeholder = GT_BOOKS[lang].lines['Type the word…'];
}
/* the option menu item, shared by both games: returns [label, sub] */
function gtLangLabel(deckLang) { const b = gtBase(deckLang); return gtWant(deckLang) ? GT_LANG_NAMES[b] || b : 'English'; }

/* ---------- 🌐 Report a translation problem: a button on the page under the game (not inside the game box) ----------
   The games remember the last lines they showed (with the English they came from). The report opens a GitHub issue,
   already filled in, like the Feedback page: nothing is sent by the app itself. */
const GT_RECENT = [];
const gtPlain = s => String(s ?? '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
function gtRemember(lang, en, tr, src) {
  const e = gtPlain(en), t = gtPlain(tr); if (!e || !/[A-Za-z]{2}/.test(e)) return;
  const i = GT_RECENT.findIndex(x => x.lang === lang && x.en === e); if (i >= 0) GT_RECENT.splice(i, 1);
  GT_RECENT.unshift({ lang, en: e, tr: t, same: e === t, src }); if (GT_RECENT.length > 30) GT_RECENT.pop();
}
const GT_LANG_ENGLISH = { es: 'Spanish', fr: 'French', ja: 'Japanese' };
function gtReportBtn(deckLang, game) {
  const lang = gtWant(deckLang); if (!lang) return '';
  return `<div class="gt-report"><button type="button" class="btn sm" data-act="gtReport" data-lang="${lang}" data-game="${esc(game)}">🌐 Report a translation problem</button>
    <span class="muted small">Something in ${esc(GT_LANG_ENGLISH[lang] || GT_LANG_NAMES[lang] || lang)} that looks wrong? Tell us.</span></div>`;
}
const GT_PROBLEMS = [['meaning', 'The meaning is wrong'], ['grammar', 'Grammar or spelling mistake'], ['natural', 'It sounds unnatural'], ['english', 'It is still in English'], ['other', 'Something else']];
function gtReportDialog(lang, game) {
  const rows = GT_RECENT.filter(x => x.lang === lang).slice(0, 15);
  const langName = GT_LANG_ENGLISH[lang] || lang;
  const list = rows.length ? `<div class="gt-lines" role="radiogroup" aria-label="Which line?">${rows.map((r, i) => `<label class="gt-line"><input type="radio" name="gtline" value="${i}" ${i === 0 ? 'checked' : ''}>
      <span><b lang="${lang}">${esc(r.tr)}</b>${r.same ? ' <span class="pill">still in English</span>' : `<small class="muted">${esc(r.en)}</small>`}</span></label>`).join('')}</div>`
    : '<p class="muted" style="margin:0">Play a little first: the last lines the game shows (or the sentences you finish) will appear here so you can pick one.</p>';
  openDialog({ title: '🌐 Report a translation problem', wide: true, ok: 'Send report', body: `
      <p class="muted small" style="margin-top:0">Pick the line (newest first), say what’s wrong and, if you can, how it should say it. This opens the Estudiamos page on GitHub with your report filled in; you check it and post it there (a free GitHub account is needed).</p>
      ${list}
      <label class="field">What’s wrong?<select class="inp" name="gtkind">${GT_PROBLEMS.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join('')}</select></label>
      <label class="field">Better wording <span class="muted small">(optional, in ${esc(langName)})</span><textarea class="inp" name="gtfix" rows="2" maxlength="500" lang="${lang}"></textarea></label>
      <label class="field">Anything else? <span class="muted small">(optional)</span><textarea class="inp" name="gtnote" rows="2" maxlength="800"></textarea></label>`,
    onOk: form => {
      const r = rows[+(form.querySelector('input[name=gtline]:checked')?.value ?? -1)];
      const fix = form.elements.gtfix.value.trim(), note = form.elements.gtnote.value.trim(), kind = GT_PROBLEMS.find(p => p[0] === form.elements.gtkind.value)?.[1] || '';
      if (!r && !note) { toast('Pick a line, or describe the problem'); return false; }
      const dev = typeof cmDeviceInfo === 'function' ? cmDeviceInfo() : {};
      if (typeof ghUrl !== 'function' || !ghUrl()) { toast('Reporting isn’t set up yet'); return false; }
      const body = [`**Game:** ${game} · **Language:** ${langName}`, `**App version:** ${dev.version || '?'} · **Device:** ${dev.device || '?'} · **Browser:** ${dev.browser || '?'}`, '',
        `### Problem\n${kind}`, ...(r ? ['', `### The line in the game\n> ${r.tr}`, '', `### The English it comes from\n> ${r.en}`, ...(r.src ? ['', `### Source\n${r.src}`] : [])] : []), ...(fix ? ['', `### Better wording\n> ${fix}`] : []), ...(note ? ['', `### More details\n${note}`] : [])].join('\n');
      const title = `Translation (${langName}): ${(r ? r.tr : note).slice(0, 60)}`;
      cmOpen(ghUrl(`/issues/new?labels=translation&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`));
      toast('Opening GitHub… thank you!');
    } });
}
Object.assign(actions, { gtReport: el => gtReportDialog(el.dataset.lang, el.dataset.game) });
