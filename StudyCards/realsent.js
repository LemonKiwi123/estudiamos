'use strict';
/* ================= Sentence Builder: 📖 Real sentences =================
   Rebuild real sentences written by people, instead of sentences the game puts together.
   You see the English; the words of the real sentence are shuffled below; put them back in order.
   Sentences come first from your own cards (their example sentences), then from the built-in sets in data/real-<lang>.json:
     - Tatoeba (tatoeba.org), CC BY 2.0 FR: real sentences with translations checked by its community
     - Spanish Short Sentences (Busto-Castiñeira et al., Zenodo record 13936988), CC BY 4.0: only its natural word-order
       sentences; their English is ours.
   Sentences that use your deck's words come up more often. */
const RS_LANGS = { es: 'Spanish', fr: 'French', ja: 'Japanese' };
const RS_DATA = {};   // lang -> { items, lower: Set of words seen in lowercase }
const rsLow = (w, lang) => lang === 'tr' ? String(w).replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase() : String(w).toLowerCase();   // Turkish: I → ı, İ → i
const RS_NOSPACE = new Set(['ja']), RS_SPLIT = {}, RS_POS_BY = {};   // languages written without spaces (other files add theirs), how to split them into words, and their word types
let rs = null;
async function rsLoad(lang) {
  if (RS_DATA[lang]) return RS_DATA[lang];
  const r = await fetch(`data/real-${lang}.json`); if (!r.ok) throw new Error('missing');
  const j = await r.json(), lower = new Set();
  for (const it of j.items) rsTokens(it[1], lang).slice(1).forEach(w => { if (w === rsLow(w, lang)) lower.add(w); });
  return (RS_DATA[lang] = { items: j.items, credit: j.credit, lower });
}
/* the words of a sentence, without the opening ¿¡ and the closing . ? ! (those are shown for you) */
function rsTokens(text, lang) {
  if (RS_NOSPACE.has(lang)) return String(text).replace(/[。．！？!?]+$/, '').split('|').filter(Boolean);
  return String(text).trim().replace(/^[¿¡\s]+/, '').replace(/[\s.!?…»"]+$/, '').split(/\s+/).filter(Boolean);
}
const rsEnd = (text, lang) => RS_NOSPACE.has(lang) ? (/[。！？]$/.exec(text)?.[0] || '。') : (/[.!?…]+$/.exec(String(text).trim())?.[0] || '.');
const rsPlain = (text, lang) => RS_NOSPACE.has(lang) ? String(text).replace(/\|/g, '') : String(text).trim();
const rsKey = (w, lang) => (RS_NOSPACE.has(lang) ? w : rsLow(w, lang)).replace(/[^\p{L}\p{N}'’-]/gu, '');
/* your deck's cards that have an example sentence in this language (and its English) */
/* Japanese has no spaces: split a sentence into words using the words of the Japanese sentence set (longest match first) */
let RS_JA_VOCAB = null;
function rsSplitJa(text) {
  if (!RS_JA_VOCAB) { RS_JA_VOCAB = new Set(); for (const it of RS_DATA.ja?.items || []) for (const w of rsTokens(it[1], 'ja')) RS_JA_VOCAB.add(w);
    for (const w of 'は が を に で と へ も の か よ ね から まで より や です でした ます ません ました ない'.split(' ')) RS_JA_VOCAB.add(w);
    // the Sentence Builder's Japanese words and your own Japanese cards (kana and kanji), so ねこ stays one word
    for (const m of [typeof rsLex === 'function' ? rsLex('ja') : null, typeof rsGlossMap === 'function' ? rsGlossMap('ja') : null]) for (const w of m?.keys() || []) if (w.length > 1) RS_JA_VOCAB.add(w);
    for (const d of S.decks) if (langBase(d.frontLang || '') === 'ja') for (const c of cardsOf(d.id)) for (const w of plainSent(c.front || '').split(/[\s（）()・、]+/)) if (w.length > 1) RS_JA_VOCAB.add(w); }
  const t = String(text).replace(/[。．！？!?\s]+$/, ''), out = []; let i = 0;
  while (i < t.length) {
    let len = Math.min(8, t.length - i); while (len > 1 && !RS_JA_VOCAB.has(t.slice(i, i + len))) len--;
    if (len === 1 && /^[はがをにでとへものかよね]$/.test(t[i]) && i + 1 < t.length) { for (let L = Math.min(8, t.length - i); L > 1; L--) if (RS_JA_VOCAB.has(t.slice(i, i + L))) { len = L; break; } }
    const piece = t.slice(i, i + len);
    if (len === 1 && !RS_JA_VOCAB.has(piece) && out.length && piece !== '、' && !RS_JA_VOCAB.has(out[out.length - 1])) out[out.length - 1] += piece; else out.push(piece);
    i += len;
  }
  return out.filter(w => !/^[、，\s]+$/.test(w));
}
/* example sentences from your cards in this language (every deck that is in it) */
function rsFromCards(deckId, lang) {
  const out = [];
  for (const d of S.decks) {
    if (langBase(d.frontLang || '') !== lang) continue;
    for (const c of cardsOf(d.id)) {
      const ex = typeof plainSent === 'function' ? plainSent(c.example || '').trim() : String(c.example || '').trim(), tr = typeof plainSent === 'function' ? plainSent(c.exampleTr || '').trim() : String(c.exampleTr || '').trim();
      if (!ex || !tr) continue;
      const text = RS_NOSPACE.has(lang) ? (RS_SPLIT[lang] || rsSplitJa)(ex).join('|') + (/[。！？]$/.test(ex) ? ex.slice(-1) : '。') : ex;
      const n = rsTokens(text, lang).length;
      if (n >= 2 && n <= 14) out.push({ id: 'card:' + c.id, text, en: tr, src: c.exampleSrc ? `${c.exampleSrc} (tatoeba.org, CC BY 2.0 FR)` : `From your card in “${d.name}”`, mine: true });
    }
  }
  return out;
}
/* the Sentence Builder: real sentences in the language you're learning (English decks keep the older word-tray builder) */
function startSentenceBuilder(deckId) {
  const d = deckById(deckId), f = langBase(d?.frontLang || ''), k = langBase(d?.backLang || '');
  if (RS_LANGS[f]) return startRealSentences(deckId, f);
  if (f !== 'en' && RS_LANGS[k]) return startRealSentences(deckId, k);
  if (f === 'en' || k === 'en') return startBuilder(deckId);
  return startRealSentences(deckId, 'es');
}
async function startRealSentences(deckId, lang) {
  const d = deckById(deckId);
  lang = lang || [langBase(d?.frontLang || ''), langBase(d?.backLang || '')].find(l => RS_LANGS[l]) || 'es';
  rs = { deckId, lang, level: S.settings.rsLevel || 0, score: 0, streak: 0, loading: true, seen: new Set(), err: '' };
  go({ name: 'realsent', deckId });
  try { await rsLoad(lang); } catch { rs.err = 'Couldn’t load the sentences. Check your connection to the Estudiamos PC and try again.'; }
  rs.loading = false; rs.mine = rsFromCards(deckId, lang);
  // words from your deck: sentences that use them come up more often
  rs.pref = new Set(); for (const c of cardsOf(deckId)) for (const side of [c.front, c.back]) for (const w of String(side || '').toLowerCase().split(/[^\p{L}]+/u)) if (w.length > 1) rs.pref.add(w);
  if (!rs.err) rsRound();
  if (view.name === 'realsent') render();
}
function rsPick() {
  const D = RS_DATA[rs.lang], lvl = rs.level, fresh = x => !rs.seen.has(x.id);
  if (rsMineOnly() && rs.mine.length) {   // 📚 only the example sentences from your decks
    let pool = rs.mine.filter(fresh); if (!pool.length) { rs.seen.clear(); pool = rs.mine; }
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const mine = rs.mine.filter(fresh);
  if (mine.length && Math.random() < 0.5) return mine[Math.floor(Math.random() * mine.length)];
  const pool = D.items.filter(it => (!lvl || it[3] === lvl) && !rs.seen.has(it[0]));
  if (!pool.length) { rs.seen.clear(); return rsPick(); }
  // try a few: prefer one that uses a word from your deck
  let best = null;
  for (let t = 0; t < 40; t++) {
    const it = pool[Math.floor(Math.random() * pool.length)];
    if (!best) best = it;
    if (rs.pref.size && rsTokens(it[1], rs.lang).some(w => rs.pref.has(rsKey(w, rs.lang)) || (RS_NOSPACE.has(rs.lang) && [...rs.pref].some(p => p.length > 1 && w.includes(p))))) { best = it; break; }
  }
  return { id: best[0], text: best[1], en: best[2], level: best[3],
    src: String(best[0]).startsWith('z') ? D.credit.zenodo : `Tatoeba #${best[0]} (tatoeba.org, CC BY 2.0 FR)` };
}
/* 🎯 Practice: pick word types. The other words of the sentence are put in place (locked); you place only the picked kinds. */
const RS_POS = lang => RS_POS_BY[lang] || (lang === 'ja' ? ['noun', 'verb', 'adj', 'adv', 'pron', 'det', 'part', 'conj'] : ['noun', 'verb', 'adj', 'adv', 'pron', 'det', 'prep', 'conj']);
const rsPosSel = () => { const v = S.settings.rsPos; const ok = Array.isArray(v) ? v.filter(k => RS_POS(rs?.lang).includes(k)) : []; return ok.length && ok.length < RS_POS(rs?.lang).length ? ok : null; };
function rsRound() {
  const D = RS_DATA[rs.lang], focus = rsPosSel();
  let s, words, types, tries = 0;
  do { s = rsPick(); words = rsTokens(s.text, rs.lang); types = typeof rsTagSentence === 'function' ? rsTagSentence(words, rs.lang) : []; }
  while (focus && ++tries < 80 && !types.some(t => focus.includes(t)));
  rs.seen.add(s.id);
  // don't give away the first word with its capital letter (but keep names like Tom or María)
  const shown = words.map((w, i) => i === 0 && rs.lang !== 'ja' && D.lower.has(rsLow(w, rs.lang)) ? rsLow(w, rs.lang) : w);
  const chips = shown.map((w, i) => ({ id: i, w, type: types[i] || null, gloss: typeof rsGloss === 'function' ? rsGloss(words[i], rs.lang) : '', used: false }));
  const frame = focus && types.some(t => focus.includes(t)) ? chips.map(c => ({ blank: focus.includes(c.type) })) : null;
  if (frame) chips.push(...rsDecoys(chips.filter((c, i) => frame[i].blank), words));   // 🎯 a few wrong words of the same kind
  const tray = shuffle(frame ? chips.filter((c, i) => i >= frame.length || frame[i].blank) : chips.slice());
  if (tray.length > 1 && tray.every((c, i, a) => i === 0 || c.id > a[i - 1].id)) tray.push(tray.shift());   // never already in order
  Object.assign(rs, { s, words, chips, frame, tray, fill: frame ? frame.map(() => null) : null, line: [], done: false, fails: 0, bad: -1, hint: -1, hintAt: -1, hintStep: 0, hintSet: null, reading: false, gap: null, heatShown: 0,
    msg: focus && !frame ? 'No sentence with those word types turned up, so this one is the whole sentence.' : null });
  if (typeof rsFillMissing === 'function') setTimeout(rsFillMissing, 0);   // 🌐 look up words we don't know yet
}
/* 🎯 Practice: wrong words of the same kind to choose between (other forms of the same verb first, like como / comes / comemos) */
const RS_POOL = {};
function rsPool(lang) {
  if (RS_POOL[lang]) return RS_POOL[lang];
  const pool = {}, items = (RS_DATA[lang]?.items || []).slice(), texts = [];
  for (let i = 0; i < 1500 && items.length; i++) texts.push(items.splice(Math.floor(Math.random() * items.length), 1)[0][1]);
  for (const s of rs?.mine || []) texts.push(s.text);
  for (const t of texts) {
    const ws = rsTokens(t, lang), ts = typeof rsTagSentence === 'function' ? rsTagSentence(ws, lang) : [];
    ws.forEach((w, i) => { const ty = ts[i]; if (!ty || /^\d+$/.test(w)) return; const k = rsKey(w, lang); (pool[ty] ||= new Map()).set(k, lang === 'ja' || ty === 'noun' && w[0] !== w[0].toLowerCase() && i ? w : w.toLowerCase()); });
  }
  // plus the built-in word list, so small groups (adjectives, prepositions…) still have enough wrong words
  for (const line of (typeof RS_DICT_SRC !== 'undefined' && RS_DICT_SRC[lang] || '').split(/\r?\n/)) {
    const [w, ty] = line.trim().split('|'); if (!w || !ty || /[\s-]/.test(w) && lang !== 'ja') continue;
    const k = rsKey(w, lang); if (!(pool[ty] ||= new Map()).has(k)) pool[ty].set(k, w);
  }
  return RS_POOL[lang] = Object.fromEntries(Object.entries(pool).map(([t, m]) => [t, [...m.values()]]));
}
const rsDecoyRange = () => ({ 1: [2, 3], 3: [10, 11] })[rs.level] || [5, 6];
function rsDecoys(blanks, words) {
  const lang = rs.lang, pool = rsPool(lang), taken = new Set(words.map(w => rsKey(w, lang))), out = [];
  // how many wrong words: ⭐ Easier 2–3, ⭐⭐ Medium (and Any length) 5–6, ⭐⭐⭐ Harder 10–11
  const [lo, hi] = rsDecoyRange(), want = lo + Math.floor(Math.random() * (hi - lo + 1));
  const stem = w => RS_NOSPACE.has(lang) ? w.slice(0, 1) : rsKey(w, lang).slice(0, Math.min(4, Math.max(3, rsKey(w, lang).length - 2)));
  for (let n = 0; out.length < want && n < want * 6; n++) {
    const b = blanks[n % blanks.length], list = pool[b.type] || []; if (!list.length) continue;
    const close = list.filter(w => !taken.has(rsKey(w, lang)) && rsKey(w, lang) !== rsKey(b.w, lang) && stem(w) === stem(b.w));
    const any = list.filter(w => !taken.has(rsKey(w, lang)));
    const from = close.length && Math.random() < 0.7 ? close : any; if (!from.length) continue;
    const w = from[Math.floor(Math.random() * from.length)]; taken.add(rsKey(w, lang));
    out.push({ w, type: b.type, gloss: typeof rsGloss === 'function' ? rsGloss(w, lang) : '', used: false, decoy: true });
  }
  return out.map((c, i) => Object.assign(c, { id: words.length + i }));
}
/* 🎺 the fanfare lives in fanfare.js (shared with other games); then the sentence is read out and "Next sentence" waits for it */
const rsFanfare = () => playFanfare();
function rsReadOut(delay = 0) {
  const d = deckById(rs.deckId), voice = langBase(d?.frontLang || '') === rs.lang ? d.frontLang : ({ es: 'es-ES', fr: 'fr-FR', ja: 'ja-JP' })[rs.lang] || BLD_LANGS[rs.lang]?.voice;
  const text = rsPlain(rs.s.text, rs.lang), round = rs.s;
  rs.reading = true; clearInterval(rs.readT);
  const done = () => { clearInterval(rs.readT); if (rs?.s !== round || !rs.reading) return; rs.reading = false; if (view.name === 'realsent') render(); };
  setTimeout(() => {
    if (rs?.s !== round) return;
    if (typeof speak === 'function') speak(text, voice);
    // wait for the voice to start and then finish (no voice, or reading switched off: carry on after a moment)
    let started = false; const t0 = Date.now();
    rs.readT = setInterval(() => {
      const on = 'speechSynthesis' in window && (speechSynthesis.speaking || speechSynthesis.pending);
      if (on) started = true;
      if (started && !on || !started && Date.now() - t0 > 2500 || Date.now() - t0 > 20000) done();
    }, 150);
  }, delay);
}
const rsMineOnly = () => !!S.settings.rsMineOnly;
const rsChip = id => rs.chips[id];
/* what you've built so far, in order (an empty blank stops the "right so far" count) */
function rsBuilt() {
  if (!rs.frame) return rs.line.map(rsChip);
  return rs.frame.map((f, i) => f.blank ? (rs.fill[i] != null ? rsChip(rs.fill[i]) : { w: '\u0000', empty: true }) : rsChip(i));
}
const rsComplete = () => rs.frame ? rs.fill.every((x, i) => !rs.frame[i].blank || x != null) : rs.line.length === rs.words.length;
function rsCheck() {
  const built = rsBuilt(), want = rs.words, k = w => rsKey(w, rs.lang);
  const bad = want.findIndex((w, i) => !built[i] || built[i].empty || k(w) !== k(built[i].w));
  if (bad < 0 && built.length === want.length) {
    rs.done = true; rs.score++; rs.streak++; rs.bad = -1;
    const pts = rs.fails ? 2 : 3; if (typeof addPoints === 'function') addPoints(pts);
    rs.msg = `🎉 Right! +${pts} points`;
    rsReadOut(rsFanfare());   // 🎺 then the sentence is read out
    if (typeof gtRemember === 'function') gtRemember(rs.lang, rs.s.en, rsPlain(rs.s.text, rs.lang), rs.s.src);
  } else {
    rs.fails++; rs.streak = 0; rs.bad = bad;
    const left = rs.frame ? rs.fill.filter((x, i) => rs.frame[i].blank && x == null).length : want.length - built.length;
    rs.msg = left && (bad < 0 || built[bad]?.empty) ? `So far so good. ${left} more word${left > 1 ? 's' : ''} to go.` : `✋ Not quite: the word in spot ${bad + 1} isn’t right yet.${rs.fails >= 2 ? ' Tap 💡 Hint for help.' : ''}`;
  }
  render();
}
function rsOrderDialog() {
  const O = (typeof BLD_ORDER !== 'undefined' && (BLD_ORDER[rs.lang] || BLD_ORDER.es)); if (!O) return;
  const piece = ([t, l]) => `<span class="bld-op t-${t}${/^\(/.test(l) ? ' bld-opt' : ''}">${esc(l.replace(/[()]/g, ''))}</span>`;
  openDialog({ title: `❓ Word order in ${RS_LANGS[rs.lang]}`, ok: 'Got it', wide: true, onOk: () => {},
    body: `<p class="muted small" style="margin-top:0">Most ${esc(RS_LANGS[rs.lang])} sentences put the kinds of words in this order. Dashed boxes are optional.</p>
      ${O.rows.map(([name, ps]) => `<div class="bld-orow"><div class="small"><b>${esc(name)}</b></div><div class="bld-ops">${ps.map(piece).join('<span class="bld-arr">→</span>')}</div></div>`).join('')}
      <div class="bld-otips">${O.tips.map(([t, s]) => `<div class="t-${t}"><i></i><span>${s}</span></div>`).join('')}</div>` });
  document.querySelector('#dlg [data-dlg=cancel]')?.remove();
}
function rsPosPicker() {
  const sel = rsPosSel(), names = { part: 'particle' };
  return `<div class="bld-pos" role="group" aria-label="Kinds of words to practice"><span class="muted small">🎯 Practice:</span>
    <button type="button" class="bld-pos-b all ${sel ? '' : 'on'}" data-act="rsPos" data-k="all" aria-pressed="${!sel}">All words</button>
    ${RS_POS(rs.lang).filter(k => typeof BLD_TYPES !== 'undefined' && BLD_TYPES[k]).map(k => `<button type="button" class="bld-pos-b t-${k} ${sel?.includes(k) ? 'on' : ''}" data-act="rsPos" data-k="${k}" aria-pressed="${!!sel?.includes(k)}">${esc(names[k] || BLD_TYPES[k][0])}s</button>`).join('')}
    ${sel ? `<span class="muted small">The other words are put in place for you. Careful: ${rsDecoyRange().join('–')} wrong ${sel.length === 1 ? esc(names[sel[0]] || BLD_TYPES[sel[0]]?.[0] || 'word') + 's' : 'words'} are mixed in (the ⭐ level sets how many).</span>` : ''}</div>`;
}
views.realsent = () => {
  if (!rs) { view = { name: 'home' }; return views.home(); }
  const top = `<div class="study-top"><button type="button" class="btn ghost" data-act="games" data-id="${rs.deckId}">← Games</button>
      <div style="flex:1"><b>🧩 Sentence Builder</b> <span class="muted small">· ${esc(RS_LANGS[rs.lang])}</span></div>
      <span class="muted small">✅ ${rs.score}${rs.streak > 1 ? ` · 🔥 ${rs.streak} in a row` : ''}</span></div>`;
  if (rs.loading) return top + '<div class="flash"><p class="muted">Loading sentences…</p></div>';
  if (rs.err) return top + `<div class="flash"><p>${esc(rs.err)}</p></div>`;
  const tags = S.settings.bldTags !== false, meanings = S.settings.bldMeanings !== false;
  const label = c => tags && c.type ? `<span class="t">${esc(rsTagName(c.type, c.w))}</span>` : '';
  const title = c => c.type && typeof BLD_TYPES !== 'undefined' && BLD_TYPES[c.type] ? ` title="${esc(rsTagName(c.type, c.w))}: ${esc(BLD_TYPES[c.type][1] || '')}"` : '';
  const chip = (c, where, i) => `<button type="button" class="bld-chip${c.type ? ' t-' + c.type : ''}${where === 'line' && i === rs.bad ? ' bad' : ''}${where === 'tray' && [].concat(rs.hint).includes(c.id) ? ' hint' : ''}" data-act="${where === 'line' ? 'rsRemove' : 'rsPick'}" data-id="${c.id}" ${rs.done ? 'disabled' : ''} lang="${rs.lang}"${title(c)}>${label(c)}<span class="w">${esc(c.w)}</span>${meanings && where === 'tray' && c.gloss ? `<span class="g">${esc(c.gloss)}</span>` : ''}</button>`;
  const types = [...new Set(rs.chips.map(c => c.type).filter(Boolean))];
  const built = rsBuilt(), s = rs.s, ja = rs.lang === 'ja';
  const lineHtml = rs.frame
    ? rs.frame.map((f, i) => !f.blank ? `<span class="bld-chip locked${rsChip(i).type ? ' t-' + rsChip(i).type : ''}"${title(rsChip(i))}>${label(rsChip(i))}<span class="w">${esc(rsChip(i).w)}</span></span>`
      : rs.fill[i] != null ? chip(rsChip(rs.fill[i]), 'line', i)
      : `<button type="button" class="bld-chip bld-slot${rsChip(i).type ? ' t-' + rsChip(i).type : ''}${rs.gap === i ? ' hint' : ''}${i === rs.bad ? ' bad' : ''}" data-act="rsSlot" data-i="${i}" ${rs.done ? 'disabled' : ''}>${esc(rsTagName(rsChip(i).type, rsChip(i).w))}</button>`).join('')
    : built.length ? built.map((c, i) => (rs.gap === i ? '<span class="bld-gap" aria-label="empty spot"></span>' : '') + chip(c, 'line', i)).join('') : '';
  const anyPlaced = rs.frame ? rs.fill.some(x => x != null) : rs.line.length > 0;
  return top + `
    <div class="flash bld-board" style="min-height:0">
      <div class="muted small">${rs.frame ? `Fill each blank with the right word to say this in ${esc(RS_LANGS[rs.lang])}:` : `Tap or drag the words into order to say this in ${esc(RS_LANGS[rs.lang])}:`}</div>
      <div class="rs-en">“${esc(s.en)}”${s.mine ? ' <span class="pill">from your card</span>' : ''}</div>
      <div class="bld-line ${rs.done ? 'done' : ''}" aria-label="Your sentence">${lineHtml ? lineHtml + `<span class="rs-end">${esc(rsEnd(s.text, rs.lang))}</span>` : '<span class="muted">Your sentence goes here…</span>'}</div>
      ${typeof rsHeatHTML === 'function' ? rsHeatHTML(built) : ''}
      ${rs.msg ? `<div class="bld-msg ${rs.done ? 'ok' : 'no'}">${rs.msg}${rs.done ? `<br><b lang="${rs.lang}">${esc(rsPlain(s.text, rs.lang))}</b>` : ''}</div>` : ''}
      <div class="muted small rs-src">Sentence: ${esc(s.src)}</div>
    </div>
    ${tags && types.length && typeof BLD_TYPES !== 'undefined' ? `<div class="bld-key" aria-label="Color key">${Object.entries(BLD_TYPES).filter(([k]) => types.includes(k)).map(([k, [name, what]]) => `<span class="bld-key-i t-${k}" title="${esc(what)}"><i></i>${k === 'part' ? 'particle' : name}</span>`).join('')}</div>` : ''}
    <div class="bld-tray">${rs.tray.filter(c => !c.used && !c.gone).map(c => chip(c, 'tray')).join('') || '<span class="muted small">All the words are in your sentence.</span>'}</div>
    <div class="bld-actions">
      ${rs.done ? `<button type="button" class="btn" data-act="rsSay" ${rs.reading ? 'disabled' : ''}>🔊 Hear it again</button><button type="button" class="btn primary big" data-act="rsNext" ${rs.reading ? 'disabled aria-busy="true"' : ''}>${rs.reading ? '🔊 Listen…' : 'Next sentence ▶'}</button>` : `
      <button type="button" class="btn" data-act="rsUndo" ${anyPlaced ? '' : 'disabled'}>↩️ Undo</button>
      <button type="button" class="btn" data-act="rsClear" ${anyPlaced ? '' : 'disabled'}>🧹 Clear</button>
      <button type="button" class="btn" data-act="rsHint">💡 Hint</button>
      <button type="button" class="btn" data-act="rsOrder" title="The order the kinds of words usually go in">❓ Word order</button>
      <button type="button" class="btn" data-act="rsSkip">🔀 New sentence</button>
      <button type="button" class="btn primary big" data-act="rsCheck" ${anyPlaced ? '' : 'disabled'}>✅ Check</button>`}
    </div>
    <div class="row" style="justify-content:center;gap:8px;margin-top:10px;flex-wrap:wrap">
      <label class="row muted small" style="gap:6px;font-weight:400"><input type="checkbox" id="rsTags" ${tags ? 'checked' : ''}> Word types</label>
      <label class="row muted small" style="gap:6px;font-weight:400"><input type="checkbox" id="rsMeanings" ${meanings ? 'checked' : ''}> Meanings</label>
      <label class="row muted small" style="gap:6px;font-weight:400"><input type="checkbox" id="rsMeter" ${S.settings.bldMeter !== false ? 'checked' : ''}> Hot/cold meter</label>
      <label class="row muted small" style="gap:6px;font-weight:400" title="Words the Sentence Builder doesn’t know get their meaning and word type from Wiktionary (only the word is sent)"><input type="checkbox" id="rsLookup" ${S.settings.rsLookup !== false ? 'checked' : ''}> 🌐 Look up missing words</label>
      ${fanfarePicker()}
      <select class="inp" id="rsLevel" style="margin:0;width:auto">${[[0, 'Any length'], [1, '⭐ Easier'], [2, '⭐⭐ Medium'], [3, '⭐⭐⭐ Harder']].map(([v, l]) => `<option value="${v}" ${v === rs.level ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <select class="inp" id="rsLang" style="margin:0;width:auto">${Object.entries(RS_LANGS).map(([k, n]) => `<option value="${k}" ${k === rs.lang ? 'selected' : ''}>Build in ${n}</option>`).join('')}</select>
    </div>
    <div class="row" style="justify-content:center;gap:8px;margin-top:10px;flex-wrap:wrap">
      <button type="button" class="btn sm ${rsMineOnly() ? 'primary' : ''}" data-act="rsMine" aria-pressed="${rsMineOnly()}" title="Use only the example sentences from your own decks">📚 ${rsMineOnly() ? 'Using only my decks’ sentences' : 'Use only my decks’ sentences'} (${rs.mine.length})</button>
      ${rsMineOnly() && !rs.mine.length ? `<span class="muted small">None of your ${esc(RS_LANGS[rs.lang])} cards have an example sentence with a translation yet, so these are built-in sentences. Add some with ✨ Add example sentences on your deck’s games page.</span>` : ''}
    </div>
    ${rsPosPicker()}
    ${bldReportBtn(rs.lang)}
    <p class="muted small" style="text-align:center;margin-top:14px">Real sentences from <a href="https://tatoeba.org" target="_blank" rel="noopener">Tatoeba</a> (CC BY 2.0 FR)${rs.lang === 'es' ? ' and the <a href="https://zenodo.org/records/13936988" target="_blank" rel="noopener">Spanish Short Sentences</a> set (CC BY 4.0)' : ''}, plus your own cards’ example sentences.${S.settings.rsLookup !== false ? ' Meanings of words we didn’t know come from <a href="https://en.wiktionary.org" target="_blank" rel="noopener">Wiktionary</a> (CC BY-SA 4.0).' : ''}${ja ? ' Japanese word breaks come from Tatoeba’s word index.' : ''}</p>`;
};
const rsAfterPlace = () => { rs.gap = null; rs.msg = null; rs.bad = -1; rs.hint = -1; if (rsComplete()) return rsCheck(); render(); };
Object.assign(actions, {
  rsPick: el => { const c = rs.tray.find(t => t.id === +el.dataset.id); if (!c || c.used || rs.done) return; c.used = true;
    if (rs.frame) { const at = rs.gap != null && rs.fill[rs.gap] == null ? rs.gap : rs.frame.findIndex((f, i) => f.blank && rs.fill[i] == null); if (at < 0) { c.used = false; return; } rs.fill[at] = c.id; return rsAfterPlace(); }
    if (rs.gap != null && rs.gap <= rs.line.length) rs.line.splice(rs.gap, 0, c.id); else rs.line.push(c.id);
    rsAfterPlace(); },
  rsSlot: el => { if (rs.done) return; rs.gap = +el.dataset.i; rs.msg = '✏️ Now tap the word that goes in that blank.'; render(); },
  rsRemove: el => { if (rs.done) return; const id = +el.dataset.id, c = rs.chips[id]; if (c) c.used = false;
    if (rs.frame) { const at = rs.fill.indexOf(id); if (at >= 0) rs.fill[at] = null; rs.gap = at; rs.msg = null; rs.bad = -1; return render(); }
    const at = rs.line.indexOf(id); rs.line = rs.line.filter(x => x !== id); rs.gap = at < rs.line.length ? at : null; rs.msg = null; rs.bad = -1; render(); },
  rsUndo: () => {
    if (rs.frame) { const at = rs.fill.map((x, i) => x != null ? i : -1).filter(i => i >= 0).pop(); if (at != null && at >= 0) { rs.chips[rs.fill[at]].used = false; rs.fill[at] = null; } }
    else { const id = rs.line.pop(); if (id != null) rs.chips[id].used = false; }
    rs.gap = null; rs.msg = null; rs.bad = -1; render(); },
  rsClear: () => { rs.line = []; if (rs.fill) rs.fill = rs.fill.map(() => null); rs.chips.forEach(c => { c.used = false; }); rs.gap = null; rs.msg = null; rs.bad = -1; render(); },
  rsCheck: () => rsCheck(),
  rsHint: () => {   // step-by-step clues that never just give the word away: 1 rule some out / say the kind, 2 first letter, 3 one of three
    const k = w => rsKey(w, rs.lang);
    let next;
    if (rs.frame) {   // the first blank that is empty or wrong (a wrong word there goes back to the list)
      next = rs.frame.findIndex((f, i) => f.blank && (rs.fill[i] == null || k(rsChip(rs.fill[i]).w) !== k(rs.words[i])));
      if (next >= 0 && rs.fill[next] != null) { rs.chips[rs.fill[next]].used = false; rs.fill[next] = null; }
      rs.gap = next >= 0 ? next : null;
    } else {   // keep the right start of your sentence, then help with the next word
      const got = rs.line.map(rsChip); let ok = 0; while (ok < got.length && k(got[ok].w) === k(rs.words[ok])) ok++;
      for (const c of got.slice(ok)) c.used = false; rs.line = rs.line.slice(0, ok); rs.gap = null; next = ok;
    }
    const want = k(rs.words[next] || ''), c = next >= 0 ? rs.tray.find(t => !t.used && !t.gone && k(t.w) === want) : null;
    rs.fails = Math.max(rs.fails, 1) + 1; rs.hint = -1;
    if (!c) { rs.msg = null; return render(); }
    if (rs.hintAt !== next) rs.hintSet = null;
    rs.hintStep = rs.hintAt === next ? Math.min(3, (rs.hintStep || 0) + 1) : 1; rs.hintAt = next;
    const spot = `${rs.frame ? 'The blank' : `Word ${next + 1}`}`, kind = c.type ? rsTagName(c.type, c.w).toLowerCase() : 'word';
    const left = () => rs.tray.filter(t => !t.used && !t.gone);
    const short = [...c.w].length <= 2;   // "は", "el", "de": the first letter would give it away, so rule more words out instead
    if (rs.hintStep === 1 || rs.hintStep === 2 && short) {
      const wrong = left().filter(t => rs.frame ? t.decoy : k(t.w) !== want && !rs.words.slice(next).some(w => k(w) === k(t.w)));
      if (rs.frame && wrong.length > 1) {   // 🎯 Practice: take away half of the wrong words
        const out = shuffle(wrong.slice()).slice(0, Math.ceil(wrong.length / 2)); out.forEach(t => { t.gone = true; });
        rs.msg = `💡 Took away ${out.length} wrong word${out.length > 1 ? 's' : ''}. Tap 💡 again for another clue.`;
      } else if (rs.hintStep === 2) rs.msg = `💡 ${spot} is short: just ${[...c.w].length} ${RS_NOSPACE.has(rs.lang) ? 'character' : 'letter'}${[...c.w].length > 1 ? 's' : ''}. Tap 💡 again for another clue.`;
      else rs.msg = `💡 ${spot} is a${/^[aeiou]/.test(kind) ? 'n' : ''} <b>${esc(kind)}</b>. Tap 💡 again for another clue.`;
    } else if (rs.hintStep === 2) {
      const w = c.w, ja = RS_NOSPACE.has(rs.lang), n = [...w].length;
      rs.msg = `💡 ${spot} starts with “<b lang="${rs.lang}">${esc([...w][0])}</b>…” and has ${n} ${ja ? 'character' : 'letter'}${n > 1 ? 's' : ''}. Tap 💡 again for another clue.`;
    } else {
      // the same three words every time you ask (new ones each time would give it away)
      const keep = (rs.hintSet || []).filter(id => id !== c.id && left().some(t => t.id === id));
      const others = keep.length >= 2 ? keep.slice(0, 2).map(id => rs.chips[id]) : shuffle(left().filter(t => t !== c && k(t.w) !== want)).slice(0, 2);
      rs.hint = rs.hintSet = shuffle([c.id, ...others.map(t => t.id)]);
      rs.msg = others.length ? `💡 It’s one of the ${others.length + 1} lit-up words.` : `💡 It’s the lit-up word.`;
    }
    render(); },
  rsOrder: () => rsOrderDialog(),
  rsMine: () => { S.settings.rsMineOnly = !rsMineOnly(); save(); rs.seen.clear(); rsRound(); render(); toast(rsMineOnly() ? (rs.mine.length ? `📚 Only your decks’ ${rs.mine.length} example sentences from now on` : 'Your decks have no example sentences in this language yet') : '📖 Back to all the real sentences (yours come first)'); },
  rsPos: el => { const k = el.dataset.k, all = RS_POS(rs.lang);
    let sel = rsPosSel() || [];
    if (k === 'all') sel = []; else sel = sel.includes(k) ? sel.filter(x => x !== k) : [...sel, k];
    S.settings.rsPos = sel.length && sel.length < all.length ? sel : []; save(); rsRound(); render(); },
  rsSkip: () => { rs.streak = 0; rsRound(); render(); },
  rsNext: () => { if (rs.reading) return; rsRound(); render(); },
  rsSay: () => { if (rs.reading) return; rsReadOut(); render(); },
});
document.addEventListener('change', e => {
  if (view.name !== 'realsent' || !rs) return;
  if (e.target.id === 'rsLevel') { rs.level = S.settings.rsLevel = +e.target.value; save(); rs.seen.clear(); rsRound(); render(); }
  if (e.target.id === 'rsLang') startRealSentences(rs.deckId, e.target.value);
  if (e.target.id === 'rsMeanings') { S.settings.bldMeanings = e.target.checked; save(); render(); }
});
/* (the old "Build your own" tab is gone: real sentences are the Sentence Builder now) */
function bldModeTabs() { return ''; }

/* 🌐 report a translation problem (the sentences you finished most recently are listed) */
function bldReportBtn(lang) {
  if (!RS_LANGS[lang] || typeof gtReportDialog !== 'function') return '';
  return `<div class="gt-report"><button type="button" class="btn sm" data-act="gtReport" data-lang="${lang}" data-game="Sentence Builder">🌐 Report a translation problem</button>
    <span class="muted small">A sentence or its English that looks wrong? Tell us.</span></div>`;
}
