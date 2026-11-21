'use strict';
/* ================= 🌐 Auto-translate cards =================
   Two free sources, no account needed (both need the internet, and the words you translate are sent to them):
   - Wiktionary (en.wiktionary.org): the best for single words into English. It lists each meaning, like
     banco → "bank", "bench", so you can pick the right one.
   - MyMemory (mymemory.translated.net): phrases and every other language pair. Its answers come with a quality
     score; the best-scored ones are shown first (an unscored crowd answer can be plain wrong).
   In the card editor, 🌐 on one side translates it into the other side (you pick from the suggestions).
   With cards selected in the card list, "🌐 Translate" fills a side for all of them, with a preview to check first. */
const txBase = l => (l || '').split('-')[0].toLowerCase();
const txCache = new Map();
const txClean = s => String(s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/\s+/g, ' ').trim();
/* a grammar note instead of a meaning: "first/third-person singular present subjunctive", "inflection of hablar", "plural of casa"… */
const TX_GRAMMAR = /\b(?:first|second|third)(?:\/(?:first|second|third))*[- ]person\b|\b(?:singular|plural)\b.*\b(?:of|present|past|preterite|imperfect|future|conditional|indicative|subjunctive|imperative)\b|\b(?:indicative|subjunctive|imperative|preterite|gerund|participle|infinitive|conjugation|inflection)\b|\b(?:plural|feminine|masculine|diminutive|augmentative|alternative|obsolete|archaic) (?:form |spelling )?of\b|^(?:plural|feminine|masculine)\b|\bform of\b/i;   // …and any "apocopic form of", "contraction form of"
const txIsGrammar = t => TX_GRAMMAR.test(String(t || ''));
// "dog (any member of … (sometimes …))" → "dog": drop bracketed notes, even nested ones
function txNoParens(s) { let out = '', depth = 0; for (const ch of String(s || '')) { if (ch === '(') depth++; else if (ch === ')') depth = Math.max(0, depth - 1); else if (!depth) out += ch; } return out.replace(/\s+/g, ' ').replace(/\s+([,;.])/g, '$1').trim(); }
// split "to eat; to dine" into separate choices, but not at a ";" inside brackets
function txSplit(s) { const parts = []; let cur = '', depth = 0; for (const ch of String(s || '')) { if (ch === '(') depth++; if (ch === ')') depth = Math.max(0, depth - 1); if (ch === ';' && !depth) { parts.push(cur); cur = ''; } else cur += ch; } parts.push(cur); return parts.map(x => x.trim()).filter(Boolean); }
/* A word that could come from two words (casas: houses, or "you marry"; eres: "you are", or the letter R's plural) is
   decided by real sentences: the built-in Spanish, French and Japanese sentence sets have English translations, so we
   look at sentences with this exact word and see which meaning shows up in their English. If that's a tie, the base word
   that appears more often in those sentences wins, then the one with more meanings. */
const txCorpusCache = {};
async function txCorpus(lang) {
  if (!['es', 'fr', 'ja', 'pt'].includes(lang)) return null;
  return (txCorpusCache[lang] ||= fetch(`data/real-${lang}.json`).then(r => r.ok ? r.json() : null).then(j => (j?.items || []).map(it => ({ src: String(it[1] || '').toLowerCase(), en: String(it[2] || '').toLowerCase() }))).catch(() => null));
}
const txWords = s => String(s || '').toLowerCase().split(/[^\p{L}\p{M}]+/u).filter(Boolean);
async function txRankGroups(text, from, groups) {
  const items = await txCorpus(from), word = text.toLowerCase();
  const withWord = items ? items.filter(it => (from === 'ja' ? it.src.includes(word) : txWords(it.src).includes(word))).slice(0, 400) : [];
  const keyOf = ins => txWords(ins.replace(/^to\s+/i, '').replace(/^(a|an|the)\s+/i, ''))[0] || '';
  for (const g of groups) {
    const keys = [...new Set(g.list.slice(0, 4).map(o => keyOf(o.ins)).filter(k => k.length >= 3))].map(k => k.length > 4 ? k.slice(0, -1) : k);   // "house" → "hous", so "houses" counts too
    const hits = withWord.filter(it => { const en = txWords(it.en); return keys.some(k => en.some(w => w.startsWith(k))); }).length;
    const freq = items ? items.reduce((n, it) => n + (from === 'ja' ? (it.src.includes(g.lem.toLowerCase()) ? 1 : 0) : (txWords(it.src).includes(g.lem.toLowerCase()) ? 1 : 0)), 0) : 0;
    g.score = hits * 1000 + Math.min(999, freq) + (g.list.total || 0) / 100;
  }
  groups.sort((a, c) => c.score - a.score);
}
async function txWiktionary(text, from, depth = 0) {
  const tryWord = async w => {
    if (txWaitAt('wik')) throw new Error('busy');
    const r = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(w)}`); if (r.status === 404) return null;
    if (r.status === 429 || r.status === 503) { const s = +r.headers.get('Retry-After') || 60; txSetWait('wik', Date.now() + Math.min(3600, Math.max(5, s)) * 1000); throw new Error('busy'); }
    if (!r.ok) throw new Error('wiktionary'); return r.json(); };
  let j = await tryWord(text); if (!j?.[from] && text !== text.toLowerCase()) j = await tryWord(text.toLowerCase());
  const out = [], lemmas = []; let total = 0;   // total: how many real meanings the word has (a sign of how common it is)
  for (const e of j?.[from] || []) for (const d of e.definitions || []) {
    const g = txClean(d.definition); if (!g) continue;
    if (!txIsGrammar(g)) total++;
    if (txIsGrammar(g)) {   // a verb form or a plural: remember the word it comes from ("inflection of hablar" → hablar)
      const m = g.match(/\bof ([^\s:;,.()]+)/i); if (m && !lemmas.some(l => l.w === m[1]) && m[1].toLowerCase() !== text.toLowerCase()) lemmas.push({ w: m[1], plural: /\bplural of\b/i.test(g) });
      continue;
    }
    // "bank (financial institution)" → keep the note; split "to eat; to dine" into separate choices
    for (const part of txSplit(g)) { const full = part.replace(/\.$/, '').trim(), ins = txNoParens(full) || full;   // "bank (financial institution)": the card gets "bank", the list shows the note
      const t = full.length > 90 ? full.slice(0, 88).trimEnd() + '…' : full;
      if (out.length < 8 && ins && ins.length <= 60 && !txIsGrammar(ins) && !out.some(o => o.ins.toLowerCase() === ins.toLowerCase())) out.push({ t, ins, note: (e.partOfSpeech || '').toLowerCase() }); }
  }
  // a form of another word: offer that word's meanings too (hable → to speak, labeled "form of hablar")
  if (!depth) {
    const groups = [];
    for (const l of lemmas.slice(0, 3)) { try { groups.push({ lem: l.w, list: await txWiktionary(l.w, from, 1) }); } catch {} }
    if (groups.length > 1) await txRankGroups(text, from, groups);
    for (const { lem, list } of groups) for (const o of list.slice(0, 4)) if (!out.some(x => x.ins.toLowerCase() === o.ins.toLowerCase())) out.push({ ...o, note: `form of ${lem}` });
  }
  const res = out.slice(0, 10); res.total = total; return res;
}
/* 📊 daily limits: MyMemory allows about 5,000 characters a day for free (per internet connection); the app counts what it sends */
const txMMEmail = () => { const e = String(S.settings?.txEmail || '').trim(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : ''; };   // optional: MyMemory gives 10× more with a valid email
const txMMDaily = () => txMMEmail() ? 50000 : 5000;
const txMMKey = () => 'txMM:' + new Date().toISOString().slice(0, 10);
const txMMUsed = () => { try { return +localStorage.getItem(txMMKey()) || 0; } catch { return 0; } };
const txMMAdd = n => { try { localStorage.setItem(txMMKey(), String(txMMUsed() + n)); } catch {} };
/* ⏳ when MyMemory's limit is used up it says exactly when it's back ("NEXT AVAILABLE IN 06 HOURS 21 MINUTES 23 SECONDS");
   that time is saved, MyMemory isn't asked again until then, and a countdown shows it everywhere */
const TX_WAIT_KEY = s => s === 'mm' ? 'txMMReset' : 'txWait:' + s;
const txWaitAt = s => { try { const t = +localStorage.getItem(TX_WAIT_KEY(s)) || 0; return t > Date.now() ? t : 0; } catch { return 0; } };
const txSetWait = (s, at) => { try { localStorage.setItem(TX_WAIT_KEY(s), String(at)); } catch {} };
const txMMResetAt = () => txWaitAt('mm');
// a source that asked us to wait, with its live countdown
const txWaitSpan = s => { const at = txWaitAt(s); return at ? `<span data-tx-countdown="${at}">${txCountdown(at - Date.now())}</span>` : ''; };
const TX_WAIT_WHY = { mm: 'MyMemory’s free daily limit is used up', wik: 'Wiktionary asked us to slow down for a moment' };
function txWaitingHtml(sep = ' · ') { return ['mm', 'wik'].filter(txWaitAt).map(s => `⏳ ${TX_SRC_NAME[s] || s} back in ${txWaitSpan(s)}`).join(sep); }
function txMMSetReset(msg) {
  const m = String(msg || '').match(/NEXT AVAILABLE IN\s+(\d+)\s+HOURS?\s+(\d+)\s+MINUTES?\s+(\d+)\s+SECONDS?/i);
  const at = m ? Date.now() + ((+m[1] * 60 + +m[2]) * 60 + +m[3]) * 1000 : (() => { const d = new Date(); d.setUTCHours(24, 0, 0, 0); return +d; })();   // no time given: guess midnight (UTC)
  txSetWait('mm', at);
}
function txCountdown(ms) {
  if (ms <= 0) return 'a moment';
  const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h ? `${h} h ${String(m).padStart(2, '0')} min` : m ? `${m} min ${String(sec).padStart(2, '0')} s` : `${sec} s`;
}
const txMMWait = () => txWaitSpan('mm');
// every countdown on screen ticks once a second; when it reaches zero it says so
setInterval(() => { for (const el of document.querySelectorAll('[data-tx-countdown]')) { const left = +el.dataset.txCountdown - Date.now(); el.textContent = left > 0 ? txCountdown(left) : 'a moment (try again now)'; } }, 1000);
function txLimitsHtml() {
  const used = txMMUsed(), dev = typeof self.Translator !== 'undefined';
  return `<details class="tx-limits"><summary>📊 Translation sources and daily limits</summary><ul>
    <li><b>Built-in words, your other cards, example sentences</b>: no limit (they’re on your device).</li>
    <li><b>Wiktionary</b>: no daily limit. Estudiamos pauses between words so it never overloads.${txWaitAt('wik') ? ` <b class="tx-wait">⏳ It asked us to slow down: back in ${txWaitSpan('wik')}</b>.` : ''}</li>
    <li><b>Browser translator</b> (Google’s models, on this device): no limit. ${dev ? 'This browser has one; it’s used once its language pack is downloaded.' : 'Not available in this browser (recent Chrome on a computer has it).'}</li>
    <li><b>MyMemory</b>: about ${txMMDaily().toLocaleString()} characters a day for free${txMMEmail() ? ' (raised with your email)' : ', per internet connection'}. Used today on this device: <b>${used.toLocaleString()}</b>.${txMMResetAt() ? ` <b class="tx-wait">⏳ Used up: available again in ${txMMWait()}</b> (the other sources keep working).` : ''} Only asked when the other sources don’t agree.${txMMEmail() ? '' : ' <b>Want 10× more?</b> Add your email in Settings → 🌐 Translation.'}</li>
  </ul></details>`;
}
async function txMyMemory(text, from, to) {
  txMMAdd(Math.min(450, text.length));
  const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 450))}&langpair=${from}|${to}${txMMEmail() ? '&de=' + encodeURIComponent(txMMEmail()) : ''}`);
  const j = await r.json().catch(() => null);
  const warn = `${j?.responseDetails || ''} ${j?.responseData?.translatedText || ''}`;
  if (r.status === 429 || +j?.responseStatus === 429 || /MYMEMORY WARNING/i.test(warn)) { txMMSetReset(warn); throw new Error('limit'); }
  if (!r.ok || !j) throw new Error('mymemory');
  if (/QUERY LENGTH LIMIT/i.test(warn)) throw new Error('mymemory');
  const seen = new Set(), out = [];
  const add = (t, q) => { t = txClean(t); const k = t.toLowerCase(); if (!t || seen.has(k) || k === text.toLowerCase() || txIsGrammar(t)) return; seen.add(k); out.push({ t, q }); };
  const ms = (j.matches || []).map(m => ({ t: m.translation, q: +m.quality || 0, m: +m.match || 0 })).sort((a, b) => (b.q > 0) - (a.q > 0) || b.m - a.m || b.q - a.q);
  ms.filter(m => m.q > 0).forEach(m => add(m.t, m.q));
  if (!out.length) add(j.responseData?.translatedText, 0);   // nothing scored: take its best guess
  ms.filter(m => m.q === 0).forEach(m => add(m.t, 0));
  return out.slice(0, 6).map(o => ({ t: o.t, ins: o.t, note: '' }));
}
/* ---------- 🤝 Consensus: several sources vote, the meaning most of them agree on wins ----------
   Sources: Wiktionary (online), MyMemory (online, only asked when the others don't agree yet: it has a daily limit),
   the app's built-in word lists (Sentence Builder words and dictionary, starter decks), your own cards in other decks,
   and the built-in example sentences (which meaning shows up in the English of sentences with this word).
   "to speak", "speak" and "speaks" count as the same meaning. Each suggestion says which sources agree. */
const TX_SRC_NAME = { wik: 'Wiktionary', mm: 'MyMemory', app: 'built-in words', mine: 'your cards', sent: 'example sentences', dev: 'browser translator (Google, on this device)' };
const txDevCache = {};   // the browser translator for each language pair (or null when it isn't available)
const txKey = ins => {
  const first = String(ins || '').split(/\s*[,;/]\s*|\s+or\s+/i)[0];
  return txWords(txNorm(first).replace(/^(i|you|he|she|it|we|they|y'all)\s+/, '').replace(/^(to|a|an|the)\s+/, '')).map(w => w.length > 4 && /[^s]s$/.test(w) ? w.slice(0, -1) : w).join(' ');
};
// the app's own word lists, made once per language: word → meanings (and meaning → words, for the other direction)
const txAppCache = {};
function txAppIndex(lang) {
  if (txAppCache[lang]) return txAppCache[lang];
  const fwd = new Map(), add = (w, en) => { w = String(w || '').toLowerCase().trim(); if (!w || !en) return; for (const g of String(en).split(/\s*\/\s*/)) { const t = g.trim(); if (!t) continue; if (!fwd.has(w)) fwd.set(w, []); if (!fwd.get(w).includes(t)) fwd.get(w).push(t); } };
  const lists = lang === 'es' ? { noun: typeof ES_NOUN !== 'undefined' && ES_NOUN, adj: typeof ES_ADJ !== 'undefined' && ES_ADJ, verb: typeof ES_VERB !== 'undefined' && ES_VERB, adv: typeof ES_ADV !== 'undefined' && ES_ADV, prep: typeof ES_PREP !== 'undefined' && ES_PREP, conj: typeof ES_CONJ !== 'undefined' && ES_CONJ }
    : lang === 'fr' ? { noun: typeof FR_NOUN !== 'undefined' && FR_NOUN, adj: typeof FR_ADJ !== 'undefined' && FR_ADJ, verb: typeof FR_VERB !== 'undefined' && FR_VERB, adv: typeof FR_ADV !== 'undefined' && FR_ADV, prep: typeof FR_PREP !== 'undefined' && FR_PREP } : {};   // the Sentence Builder's word lists
  for (const n of lists.noun || []) { add(n[0], n[4]); add(n[1], n[5]); }
  for (const a of lists.adj || []) for (const w of a.slice(0, 4)) add(w, a[4]);
  for (const v of lists.verb || []) { add(v[0], 'to ' + v[5]); (v[1] || []).forEach((f, i) => add(f, i === 2 ? v[6] : v[5])); }   // the third form is he/she: "eats"
  for (const a of [...(lists.adv || []), ...(lists.prep || []), ...(lists.conj || [])]) add(a[0], a[1]);
  if (typeof RS_DICT !== 'undefined' && RS_DICT[lang]) for (const [w, [, g]] of RS_DICT[lang]) add(w, g);
  if (typeof STARTERS !== 'undefined') for (const st of Object.values(STARTERS)) if (txBase(st.frontLang) === lang && txBase(st.backLang) === 'en') for (const [f, b] of st.cards || []) { add(f, b); add(String(f).replace(/^(el|la|los|las|le|la|les|l'|un|una|une)\s*/i, ''), b); }
  const back = new Map(); for (const [w, list] of fwd) for (const t of list) { const k = txKey(t); if (!k) continue; if (!back.has(k)) back.set(k, []); if (!back.get(k).includes(w)) back.get(k).push(w); }
  return (txAppCache[lang] = { fwd, back });
}
const txPlain = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
async function txSuggest(text, from, to, opts = {}) {
  text = txClean(text); from = txBase(from); to = txBase(to);
  if (!text || !from || !to || from === to) return { list: [], src: '' };
  const word = text.toLowerCase(), cands = new Map(), short = text.split(/\s+/).length <= 3;
  const vote = (src, o, w) => {
    const key = txKey(o.ins); if (!key || txIsGrammar(o.ins)) return;
    let c = cands.get(key); if (!c) cands.set(key, c = { key, best: null, score: 0, by: {} });
    if (!c.best || (src === 'wik' && c.bestSrc !== 'wik')) { c.best = o; c.bestSrc = src; }
    c.by[src] = Math.max(c.by[src] || 0, w);
  };
  // 1. Wiktionary (meanings in English for words in other languages)
  let wik = [];
  if (to === 'en' && from !== 'en' && short) {
    const k = `wik|${from}|${text}`;
    try { wik = txCache.get(k) || await txWiktionary(text, from); txCache.set(k, wik); } catch {}
    const topNote = wik[0]?.note;
    wik.forEach((o, i) => vote('wik', o, o.note === topNote ? (i < 2 ? 1 : 0.6) : 0.35));
  }
  // 2. the app's own word lists
  if (to === 'en') { for (const g of txAppIndex(from).fwd.get(word) || []) vote('app', { t: g, ins: g, note: '' }, 1); }
  else if (from === 'en') { const idx = txAppIndex(to); for (const w of idx.back.get(txKey(text)) || []) vote('app', { t: w, ins: w, note: '' }, 1); }
  // 3. your own cards in other decks (not the card being checked, and not other auto-translations)
  for (const c of S.cards) {
    if (c.id === opts.exclude || c.autoTr) continue; const d = deckById(c.deckId); if (!d) continue;
    const fl = txBase(d.frontLang), bl = txBase(d.backLang), f = txPlain(c.front).toLowerCase(), b = txPlain(c.back);
    if (fl === from && bl === to && f === word && b && !txIsGrammar(b)) vote('mine', { t: b, ins: b, note: 'your cards' }, 0.8);
    else if (bl === from && fl === to && b.toLowerCase() === word && c.front && !txIsGrammar(c.front)) vote('mine', { t: txPlain(c.front), ins: txPlain(c.front), note: 'your cards' }, 0.8);
  }
  // 4. the browser's own translator (recent Chrome runs Google's translation models right on the device: free, no key,
  //    nothing leaves the computer). Only used when it's already set up; it isn't there in every browser.
  try {
    if (typeof self.Translator !== 'undefined') {
      const pair = `${from}|${to}`;
      const within = (p, ms) => Promise.race([p, new Promise(res => setTimeout(() => res(null), ms))]);   // some browsers have it but never answer: don't wait forever
      if (!(pair in txDevCache)) txDevCache[pair] = await within(self.Translator.availability({ sourceLanguage: from, targetLanguage: to }).then(a => a === 'available' ? within(self.Translator.create({ sourceLanguage: from, targetLanguage: to }), 3000) : null).catch(() => null), 1500);
      const tr = txDevCache[pair]; if (tr) { const t = txClean(await within(tr.translate(text), 3000) || ''); if (t && t.toLowerCase() !== word) vote('dev', { t, ins: t, note: '' }, 1); }
    }
  } catch {}
  // 5. MyMemory, only if nobody agrees yet (it has a small daily limit)
  const agreeing = () => Math.max(0, ...[...cands.values()].map(c => Object.values(c.by).filter(w => w >= 0.5).length));
  let mmErr = null;
  if (agreeing() < 2 && !txMMResetAt()) {   // not while it's waiting for its daily reset
    const k = `mm|${from}|${to}|${text}`;
    try { const mm = txCache.get(k) || await txMyMemory(text, from, to); txCache.set(k, mm); mm.forEach((o, i) => vote('mm', o, i === 0 ? 1 : 0.4)); }
    catch (e) { mmErr = e; }
  }
  // 6. the example sentences: which meaning appears in the English of sentences with this word
  if (to === 'en' && short && cands.size > 1) {
    const items = await txCorpus(from);
    if (items) {
      const withWord = items.filter(it => (from === 'ja' ? it.src.includes(word) : txWords(it.src).includes(word))).slice(0, 400);
      if (withWord.length) for (const c of cands.values()) {
        const k = c.key.split(' ')[0]; if (k.length < 3) continue; const stem = k.length > 4 ? k.slice(0, -1) : k;
        const hits = withWord.filter(it => txWords(it.en).some(w => w.startsWith(stem))).length;
        if (hits >= 2) c.by.sent = Math.min(1, hits / 4);
      }
    }
  }
  if (!cands.size) { if (mmErr) throw mmErr; if (txWaitAt('wik') && !wik.length && to === 'en') throw new Error('busy'); if (txMMResetAt() && agreeing() < 1) throw new Error('limit'); return { list: [], src: '' }; }
  const list = [...cands.values()].map(c => {
    const srcs = Object.entries(c.by).filter(([, w]) => w >= 0.5).map(([s]) => s);
    c.score = Object.values(c.by).reduce((a, w) => a + w, 0) + (c.by.wik ? 0.01 : 0);
    return { ...c.best, agree: srcs.length, sources: srcs, score: c.score };
  }).sort((a, b) => b.score - a.score).slice(0, 10);
  for (const o of list) if (o.agree >= 2) o.note = `✓ ${o.agree} sources agree${o.note && o.note !== 'your cards' ? ' · ' + o.note : ''}`;
  const used = [...new Set(list.flatMap(o => o.sources))].map(s => TX_SRC_NAME[s]);
  return { list, src: used.join(' + ') || 'the dictionary' };
}
const txErrText = e => navigator.onLine === false ? 'You’re offline. Translating needs the internet.' : e?.message === 'limit' ? `MyMemory’s free daily limit is used up. It’s available again in ${txCountdown(txMMResetAt() - Date.now())}.` : e?.message === 'busy' ? `Wiktionary asked us to slow down. It’s available again in ${txCountdown(txWaitAt('wik') - Date.now())}.` : 'Couldn’t reach the translator. Try again in a moment.';
const txErrHtml = e => e?.message === 'busy' && txWaitAt('wik') ? `⏳ Wiktionary asked us to slow down for a moment. It’s available again in <b>${txWaitSpan('wik')}</b>.` : e?.message === 'limit' && txMMResetAt() ? `⏳ MyMemory’s free daily limit is used up. It’s available again in <b>${txMMWait()}</b>.${txMMEmail() ? '' : ' Add your email in Settings → 🌐 Translation for 10× more.'}` : esc(txErrText(e));
const txCanDeck = d => !!(d && txBase(d.frontLang) && txBase(d.backLang) && txBase(d.frontLang) !== txBase(d.backLang));

/* ---------- 🌐 in the card editor ---------- */
const txPartner = id => document.getElementById(/f$/.test(id) ? id.replace(/f$/, 'b') : id.replace(/b$/, 'f'));
function txSetField(el, t) {
  if (el.isContentEditable) el.textContent = t; else el.value = t;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}
actions.edTranslate = async btn => {
  let src = document.getElementById(btn.dataset.ed), dst = src && txPartner(src.id);
  if (!src || !dst) return;
  const val = el => el.isContentEditable ? readEditor(el.id).text : el.value.trim();
  if (!val(src) && val(dst)) [src, dst] = [dst, src];   // this side is empty: translate the other side into it
  const text = val(src); if (!text) return toast('Type a word first, then press 🌐 to translate it');
  const from = src.getAttribute('lang'), to = dst.getAttribute('lang');
  if (!txBase(from) || !txBase(to) || txBase(from) === txBase(to)) return toast('Set two different languages for this deck to translate');
  closePalette();
  const m = document.createElement('div'); m.className = 'palette ed-menu tr-pop'; m.id = 'palette';
  const head = `<div class="pal-title">${esc(langName(from))} → ${esc(langName(to))}</div>`;
  m.innerHTML = head + '<div class="muted small" style="padding:6px 2px">Translating…</div>';
  (btn.closest('dialog[open]') || document.body).appendChild(m); palShow(m, btn);
  let res; try { res = await txSuggest(text, from, to); } catch (e) { m.innerHTML = head + `<div class="muted small" style="padding:6px 2px">${txErrHtml(e)}</div>`; palShow(m, btn); return; }
  if (!m.isConnected) return;
  const had = !!val(dst);
  m.innerHTML = head + (res.list.length
    ? `<div class="ed-menu-list">${res.list.map((o, i) => `<button type="button" data-tr="${i}">${esc(o.t)}${o.note ? ` <span class="muted small">${esc(o.note)}</span>` : ''}</button>`).join('')}</div>
       <div class="muted small" style="margin-top:6px">${had ? 'Replaces what’s on the other side. ' : ''}From ${res.src}. Check it before saving.${res.list[0]?.agree >= 2 ? '' : ' Only one source had it, so double-check.'}${txMMUsed() ? ` · MyMemory today: ${txMMUsed().toLocaleString()} of ~${txMMDaily().toLocaleString()} characters` : ''}${txWaitingHtml() ? ' · ' + txWaitingHtml() : ''}</div>`
    : '<div class="muted small" style="padding:6px 2px">No translation found. Try a simpler word.</div>');
  palShow(m, btn);
  m.addEventListener('click', e => { const b = e.target.closest('[data-tr]'); if (!b) return; txSetField(dst, res.list[+b.dataset.tr].ins); closePalette(); dst.focus?.(); toast('🌐 Translation added'); });
};

/* ---------- 🌐 Translate the selected cards (card list) ----------
   Two ways: fill in the sides that are empty (or only hold a grammar note), or check every card: the ones that need a fix
   are ticked, the ones where the dictionary suggests something different are shown unticked next to what you have now
   (you decide), and the ones that already match are hidden. Nothing changes until you press Apply. */
const txNorm = t => String(t || '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/^\s*(to|a|an|the)\s+/, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
actions.bulkTranslate = () => {
  const ids = [...(bulkSel || [])], d = deckById(view.deckId); if (!ids.length || !d) return;
  if (!txCanDeck(d)) return toast('Give this deck two different languages (Deck settings) to translate its cards');
  const cards = ids.map(id => S.cards.find(c => c.id === id)).filter(Boolean).slice(0, 400);
  const emptyBacks = cards.filter(c => !c.back?.trim()).length, emptyFronts = cards.filter(c => !c.front?.trim()).length;
  let dir = emptyFronts > emptyBacks ? 'bf' : 'fb', mode = 'fill', rows = null, busy = false, stop = false, showSame = false, pauseUntil = 0;
  const fromL = () => dir === 'fb' ? d.frontLang : d.backLang, toL = () => dir === 'fb' ? d.backLang : d.frontLang;
  const srcOf = c => (dir === 'fb' ? c.front : c.back) || '', dstOf = c => (dir === 'fb' ? c.back : c.front) || '';
  const needs = c => !dstOf(c).trim() || txIsGrammar(dstOf(c));   // empty, or a grammar note from an earlier translation
  const todo = () => cards.filter(c => srcOf(c).trim() && (mode === 'review' || needs(c)));
  const side = dir === 'fb' ? 'back' : 'front';
  const body = () => {
    if (!rows) {
      const bad = cards.filter(c => srcOf(c).trim() && dstOf(c).trim() && txIsGrammar(dstOf(c))).length;
      return `<p style="margin:0 0 10px">${cards.length} selected card${cards.length === 1 ? '' : 's'}${ids.length > cards.length ? ` (the first ${cards.length})` : ''}. You’ll see every change before anything is saved.</p>
      <div class="seg" style="margin-bottom:10px">${[['fb', `Front → Back (${langName(d.frontLang)} → ${langName(d.backLang)})`], ['bf', `Back → Front (${langName(d.backLang)} → ${langName(d.frontLang)})`]].map(([v, l]) => `<label><input type="radio" name="trDir" value="${v}" ${dir === v ? 'checked' : ''}>${esc(l)}</label>`).join('')}</div>
      <div class="stack" style="gap:6px">
        <label class="check"><input type="radio" name="trMode" value="fill" ${mode === 'fill' ? 'checked' : ''}><span><b>Fill in what’s missing</b><span class="muted small" style="display:block">Cards whose ${side} is empty${bad ? `, or only has a grammar note like “first-person singular…” (${bad} card${bad === 1 ? '' : 's'})` : ''}.</span></span></label>
        <label class="check"><input type="radio" name="trMode" value="review" ${mode === 'review' ? 'checked' : ''}><span><b>Check every card’s translation</b><span class="muted small" style="display:block">Find cards where the dictionary suggests something different from what you have, and pick which to change.</span></span></label>
      </div>
      <p class="muted small" style="margin:10px 0 6px" id="trCount">${todo().length} card${todo().length === 1 ? '' : 's'} to look up${todo().length > 40 ? ` (about ${Math.ceil(todo().length * 0.45 / 60)} min)` : ''}. Several sources vote and the meaning most of them agree on comes first. Words are sent to Wiktionary, and to MyMemory when the others don’t agree.</p>${txLimitsHtml()}`;
    }
    const done = rows.filter(r => r.done), fix = done.filter(r => r.kind === 'fix').length, diff = done.filter(r => r.kind === 'diff').length, same = done.filter(r => r.kind === 'same').length;
    const shown = rows.filter(r => !r.done || r.kind !== 'same' || showSame);
    return `<div class="tr-prog muted small" id="trProg">${busy ? (pauseUntil > Date.now() ? `⏸ Wiktionary asked us to slow down. Carrying on by itself in <b><span data-tx-countdown="${pauseUntil}">${txCountdown(pauseUntil - Date.now())}</span></b>… (${done.length} of ${rows.length} done)` : `Looking up… ${done.length} of ${rows.length}`) : `Done: <b>${fix}</b> to fix${mode === 'review' ? `, <b>${diff}</b> with a different suggestion (unticked: tick the ones to change)` : ''}${same ? `, ${same} already match` : ''}. You can edit any suggestion.`}</div>
      ${same ? `<label class="check" style="margin:4px 0"><input type="checkbox" name="trShowSame" ${showSame ? 'checked' : ''}><span class="small">Show the ${same} card${same === 1 ? '' : 's'} that already match</span></label>` : ''}
      <div class="tr-rows">${shown.map(r => { const i = rows.indexOf(r); return `<div class="tr-row ${r.kind === 'diff' ? 'tr-diff' : ''}"><input type="checkbox" data-tr-on="${i}" ${r.on ? 'checked' : ''} ${r.list.length ? '' : 'disabled'} aria-label="Use this translation">
        <span class="tr-src">${esc(srcOf(r.c))}</span><span class="tr-arrow">→</span>
        ${r.done ? r.list.length ? `<span class="tr-pick"><input class="inp" data-tr-val="${i}" value="${esc(r.val)}" list="trl${i}"><datalist id="trl${i}">${r.list.map(o => `<option value="${esc(o.ins)}">${esc(o.note ? `${o.t} · ${o.note}` : o.ins !== o.t ? o.t : '')}</option>`).join('')}</datalist>${dstOf(r.c).trim() ? `<span class="muted small">${r.kind === 'same' ? '✓ matches' : 'now'}: ${esc(dstOf(r.c).slice(0, 80))}</span>` : ''}</span>` : `<span class="muted small">${esc(r.err || 'Not found')}</span>` : '<span class="muted small">…</span>'}</div>`; }).join('')}</div>`;
  };
  const redraw = () => { const b = $('#dlg .dlg-body'); if (b) b.innerHTML = body(); const ok = $('#dlg button[type=submit]'); if (ok) { ok.textContent = rows ? busy ? 'Looking up…' : `Apply ${rows.filter(r => r.on).length}` : mode === 'review' ? 'Check' : 'Translate'; ok.disabled = busy || (rows ? !rows.some(r => r.on) : !todo().length); } };
  async function run() {
    busy = true; rows = todo().map(c => ({ c, list: [], val: '', on: false, done: false, kind: '' })); redraw();
    for (const r of rows) {
      if (stop) break;
      // Wiktionary asked for a short pause: wait it out (up to 10 minutes) and carry on, instead of skipping words
      const w = txWaitAt('wik'); if (w && w - Date.now() < 600000) { pauseUntil = w; redraw(); while (!stop && Date.now() < pauseUntil) await new Promise(res => setTimeout(res, 500)); pauseUntil = 0; if (stop) break; }
      try {
        const res = await txSuggest(srcOf(r.c), fromL(), toL(), { exclude: r.c.id }); r.list = res.list; r.val = res.list[0]?.ins || '';   // the card's own translation doesn't vote for itself
        const now = dstOf(r.c);
        if (needs(r.c)) { r.kind = 'fix'; r.on = !!r.val; }
        else if (res.list.filter(o => o.score >= res.list[0].score * 0.8).some(o => txKey(o.ins) && (txKey(o.ins) === txKey(now) || txNorm(now).split(/\s*[,;/]\s*|\s+or\s+/).some(x => txKey(x) === txKey(o.ins))))) { r.kind = 'same'; r.on = false; r.val = now; }   // matches one of the best-supported meanings
        else { r.kind = r.val ? 'diff' : 'same'; r.on = false; }
      } catch (e) { r.err = txErrText(e); if (e?.message === 'limit') { rows.filter(x => !x.done).forEach(x => { x.done = true; x.err = r.err; }); break; } }
      r.done = true; redraw();
      await new Promise(res => setTimeout(res, 250));   // be gentle with the free services
    }
    busy = false; redraw();
  }
  openDialog({ title: '🌐 Translate cards', ok: 'Translate', wide: true, body: body(),
    onOpen: dlg => {
      dlg.addEventListener('change', e => {
        if (e.target.name === 'trDir') { dir = e.target.value; redraw(); }
        else if (e.target.name === 'trMode') { mode = e.target.value; redraw(); }
        else if (e.target.name === 'trShowSame') { showSame = e.target.checked; redraw(); }
        else if (e.target.dataset.trOn != null) { rows[+e.target.dataset.trOn].on = e.target.checked; const ok = $('#dlg button[type=submit]'); if (ok) { ok.textContent = `Apply ${rows.filter(r => r.on).length}`; ok.disabled = !rows.some(r => r.on); } }
      });
      dlg.addEventListener('input', e => { const i = e.target.dataset?.trVal; if (i != null) { rows[+i].val = e.target.value; if (!rows[+i].on && e.target.value.trim()) { rows[+i].on = true; const cb = dlg.querySelector(`[data-tr-on="${i}"]`); if (cb) cb.checked = true; const ok = $('#dlg button[type=submit]'); if (ok) { ok.textContent = `Apply ${rows.filter(r => r.on).length}`; ok.disabled = false; } } } });
      dlg.addEventListener('close', () => { stop = true; }, { once: true });
      redraw();
    },
    onOk: () => {
      if (!rows) { run(); return false; }
      if (busy) return false;
      const use = rows.filter(r => r.on && r.val.trim());
      for (const r of use) { const t = r.val.trim(); if (dir === 'fb') { r.c.back = t; delete r.c.backHtml; } else { r.c.front = t; delete r.c.frontHtml; } r.c.autoTr = 1; }
      save(); render(); toast(`🌐 Updated ${use.length} card${use.length === 1 ? '' : 's'}`);
    } });
};

/* ---------- ⚙️ Settings → 🌐 Translation: an optional email for MyMemory ----------
   MyMemory allows about 5,000 characters a day without an email and about 50,000 with one. The email is kept only in
   this profile on this device and is sent only to MyMemory, with each word it's asked about. Leave it empty to skip. */
function txSettingsHtml() {
  const e = S.settings.txEmail || '', used = txMMUsed();
  return `<section class="panel" id="txSet"><h3>🌐 Translation</h3>
    <div class="set-row"><div><b>Email for MyMemory</b> <span class="muted small">(optional)</span><div class="muted small">MyMemory, one of the free translators, allows about 5,000 characters a day, or about <b>50,000</b> with an email. Your email is kept only on this device and is sent only to MyMemory when it looks up a word. Leave it empty to skip.</div></div>
      <div class="ctl"><input class="inp" type="email" data-tx-email value="${esc(e)}" placeholder="you@example.com" autocomplete="email" style="margin:0;width:220px" aria-label="Email for MyMemory"></div></div>
    <div class="muted small" id="txSetNote">${txMMEmail() ? '✅ Raised to about 50,000 characters a day.' : e ? '⚠️ That doesn’t look like an email address, so it isn’t used.' : 'No email: about 5,000 characters a day.'} Used today on this device: ${used.toLocaleString()}.${txMMResetAt() ? ` ⏳ Used up: available again in <b>${txMMWait()}</b>.` : ''}</div></section>`;
}
{ const base = views.settings; if (typeof base === 'function') views.settings = function () { const h = base.apply(this, arguments); const i = h.indexOf('<section class="panel">\n      <h3>Speech</h3>'); return i < 0 ? h.replace('<div class="stack">', '<div class="stack">' + txSettingsHtml()) : h.slice(0, i) + txSettingsHtml() + h.slice(i); }; }
document.addEventListener('change', e => {
  if (!e.target.matches?.('[data-tx-email]')) return;
  S.settings.txEmail = e.target.value.trim(); save(); if (txMMEmail()) try { localStorage.removeItem('txMMReset'); } catch {}   // a new, bigger limit: try MyMemory again
  const n = $('#txSetNote'); if (n) n.textContent = (txMMEmail() ? '✅ Raised to about 50,000 characters a day.' : S.settings.txEmail ? '⚠️ That doesn’t look like an email address, so it isn’t used.' : 'No email: about 5,000 characters a day.') + ` Used today on this device: ${txMMUsed().toLocaleString()}.`;
  toast(txMMEmail() ? '🌐 MyMemory limit raised to about 50,000 characters a day' : S.settings.txEmail ? 'Check the email address' : 'Email removed');
});
