'use strict';
/* ================= Word labels: the part of speech (noun, verb…) shown as a little label on the card =================
   Looked up on Wiktionary (en.wiktionary.org, free, CC BY-SA). Only the word itself is sent, and only for sides with
   one or two words. The label is not part of the card's text, so it never shows up in the editor, games or answers.
   Deck: d.posTags (on for every card), d.posSide ('front' | 'back' | 'both').
   Card: c.posMode ('on' | 'off', or nothing to follow the deck), c.pos = { front: { t: text looked up, v: ['noun'] }, back: … } */
const POS_KINDS = {
  noun: ['noun', 'pos-noun'], 'proper noun': ['proper noun', 'pos-noun'], verb: ['verb', 'pos-verb'], adjective: ['adjective', 'pos-adj'], adverb: ['adverb', 'pos-adv'],
  pronoun: ['pronoun', 'pos-pron'], preposition: ['preposition', 'pos-prep'], conjunction: ['conjunction', 'pos-conj'], interjection: ['interjection', 'pos-int'],
  article: ['article', 'pos-det'], determiner: ['determiner', 'pos-det'], numeral: ['number', 'pos-num'], number: ['number', 'pos-num'], particle: ['particle', 'pos-other'],
  phrase: ['phrase', 'pos-other'], idiom: ['phrase', 'pos-other'], 'prepositional phrase': ['phrase', 'pos-other'], contraction: ['contraction', 'pos-other'],
};
// the groups you can turn on or off (deck setting d.posShow; nothing saved = all of them)
const POS_GROUPS = [['noun', 'noun', 'pos-noun'], ['verb', 'verb', 'pos-verb'], ['adj', 'adjective', 'pos-adj'], ['adv', 'adverb', 'pos-adv'], ['pron', 'pronoun', 'pos-pron'],
  ['det', 'article / determiner', 'pos-det'], ['prep', 'preposition', 'pos-prep'], ['conj', 'conjunction', 'pos-conj'], ['num', 'number', 'pos-num'], ['int', 'interjection', 'pos-int'], ['other', 'other (phrase…)', 'pos-other']];
const posGroup = k => (POS_KINDS[k]?.[1] || 'pos-other').replace('pos-', '');
const posShown = (d, k) => !Array.isArray(d?.posShow) || d.posShow.includes(posGroup(k));

/* ---------- built-in word list: everyday words get the right label with no internet ---------- */
// (Wiktionary lists one-letter words like Spanish "y" and "a" as letters (nouns) first, so these are checked first.)
const POS_BUILTIN = {
  es: { article: 'el la los las un una unos unas', determiner: 'mi mis tu tus su sus nuestro nuestra nuestros nuestras vuestro vuestra este esta estos estas ese esa esos esas aquel aquella aquellos aquellas cada otro otra otros otras todo toda todos todas algún alguna algunos algunas ningún ninguna varios varias mucho mucha muchos muchas poco poca pocos pocas cuánto cuánta cuántos cuántas',
    pronoun: 'yo tú él ella usted nosotros nosotras vosotros vosotras ellos ellas ustedes me te se lo nos os le les mí ti conmigo contigo esto eso aquello algo nada alguien nadie qué quién quiénes cuál cuáles',
    preposition: 'a al de del en con sin para por sobre entre hasta desde hacia contra según durante bajo tras ante',
    conjunction: 'y e o u ni pero sino que porque si aunque mientras cuando pues',
    adverb: 'no sí muy más menos ya todavía también tampoco bien mal siempre nunca jamás aquí allí allá ahí ahora luego después antes hoy ayer temprano pronto quizás quizá casi solo despacio dónde cuándo cómo así bastante demasiado',
    interjection: 'hola adiós ojalá ay vale gracias perdón uf olé',
    number: 'cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte treinta cuarenta cincuenta sesenta setenta ochenta noventa cien ciento mil millón' },
  en: { article: 'the a an', determiner: 'this that these those my your his her its our their some any every each no many much few several all both either neither',
    pronoun: 'i you he she it we they me him us them mine yours hers ours theirs myself yourself himself herself itself ourselves themselves someone something nobody nothing everyone everything who what which',
    preposition: 'in on at to from with without for of about under over between into through after before during behind near across around against',
    conjunction: 'and but or nor because if although though while unless so',
    adverb: 'not very always never often sometimes usually here there now then today tomorrow yesterday soon already still also too well quickly slowly really maybe',
    interjection: 'hello hi bye goodbye wow oh ouch oops hey please thanks',
    number: 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million' },
};
const posDicts = {};
function posDict(lb) {
  if (posDicts[lb]) return posDicts[lb];
  const m = new Map(), add = (w, k) => { w = String(w || '').toLowerCase(); if (w && !m.has(w)) m.set(w, k); };
  for (const [k, list] of Object.entries(POS_BUILTIN[lb] || {})) for (const w of list.split(' ')) add(w, k);
  // the Sentence Builder's everyday words, in all their forms (not words you added yourself)
  const base = typeof BLD_BASE !== 'undefined' ? BLD_BASE : null;
  if (lb === 'es' && typeof ES_NOUN !== 'undefined') {
    for (const v of ES_VERB.slice(0, base ? base.v : ES_VERB.length)) { add(v[0], 'verb'); v[1].forEach(f => add(f, 'verb')); }
    for (const n of ES_NOUN.slice(0, base ? base.n : ES_NOUN.length)) { add(n[0], 'noun'); add(n[1], 'noun'); }
    for (const a of ES_ADJ.slice(0, base ? base.a : ES_ADJ.length)) a.slice(0, 4).forEach(f => add(f, 'adjective'));
  }
  if (lb === 'en' && typeof EN_ADJ !== 'undefined') for (const a of EN_ADJ.slice(0, base ? base.ea : EN_ADJ.length)) add(a[0], 'adjective');
  return posDicts[lb] = m;
}
function posGuess(text, lang) {
  const lb = langBase(lang || ''); if (!POS_BUILTIN[lb]) return null;
  const w = posWords(text).map(x => x.toLowerCase()), D = posDict(lb);
  if (w.length === 1) { if (/^\d+([.,]\d+)?$/.test(w[0])) return ['number']; const k = D.get(w[0]); return k ? [k] : null; }
  if (w.length === 2) {
    if (D.get(w[0]) === 'article' && !['article', 'determiner', 'preposition', 'conjunction', 'pronoun', 'verb'].includes(D.get(w[1]))) return ['noun'];   // el gato, the cat
    if (lb === 'en' && w[0] === 'to' && !D.has(w[1])) return ['verb'];   // to eat
  }
  return null;
}

const POS_SIDES = { front: 'Front', back: 'Back', both: 'Both sides' };
const posSideOn = (d, side) => (d?.posSide || 'front') === 'both' || (d?.posSide || 'front') === side;
const posCardOn = (c, d) => c.posMode === 'on' || (c.posMode !== 'off' && !!d?.posTags);
const posWords = t => (t || '').replace(/\s*[([{][^()[\]{}]*[)\]}]/g, ' ').replace(/[¡¿!?.,;:"“”«»]/g, ' ').trim().split(/\s+/).filter(Boolean);
const posEligible = t => { const w = posWords(t); return w.length >= 1 && w.length <= 2 && w.join(' ').length <= 40; };   // one or two words only
const posLang = (d, side) => side === 'front' ? d.frontLang : d.backLang;

/* the little label(s) drawn on a card side */
function posTag(c, side, d) {
  if (!c || !d || !posCardOn(c, d) || !posSideOn(d, side)) return '';
  if (!posEligible(c[side])) return '';
  // everyday words: the built-in list; other words: what Wiktionary said
  const r = c.pos?.[side], v = posGuess(c[side], posLang(d, side)) || (r && r.t === (c[side] || '') && r.v?.length ? r.v : null);
  if (!v || !posShown(d, v[0])) return '';
  // only the main part of speech (Wiktionary lists the most common one first)
  return `<span class="pos-tags">${v.slice(0, 1).map(k => { const [label, cls] = POS_KINDS[k] || [k, 'pos-other']; return `<span class="pos-tag ${cls}" title="Part of speech">${esc(label)}</span>`; }).join('')}</span>`;
}

/* ---------- looking a word up ---------- */
const posCache = new Map();
async function posFetch(word, lang) {
  const key = lang + '|' + word;
  if (posCache.has(key)) return posCache.get(key);
  let res = null;
  for (let attempt = 0; attempt < 2 && !(res && (res.ok || res.status === 404)); attempt++) {
    if (attempt) await new Promise(r => setTimeout(r, 1200));
    try { res = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`); } catch { res = null; }
  }
  if (!res) throw new Error('offline');
  let out = [];
  if (res.ok) {
    const j = await res.json().catch(() => ({})), list = j[langBase(lang)] || [];
    for (const e of list) { const k = String(e.partOfSpeech || '').toLowerCase(); if (POS_KINDS[k] && !out.some(x => POS_KINDS[x][0] === POS_KINDS[k][0])) out.push(k); }
  }
  out = out.slice(0, 2);
  posCache.set(key, out); return out;
}
async function posLookup(text, lang) {   // tries the whole thing, then without "el/la/the…", then each word
  const words = posWords(text), core = typeof coreOf === 'function' ? coreOf(words.join(' ')) : words;
  const tries = [...new Set([words.join(' '), words.join(' ').toLowerCase(), core.join(' '), core.join(' ').toLowerCase(), ...(core.length === 2 ? core : [])].filter(Boolean))];
  for (const w of tries) { const v = await posFetch(w, lang); if (v.length) return v; }
  return [];
}
const posNeeds = (c, d) => posCardOn(c, d) ? ['front', 'back'].filter(side => posSideOn(d, side) && posEligible(c[side]) && !posGuess(c[side], posLang(d, side)) && c.pos?.[side]?.t !== (c[side] || '')) : [];
let posFilling = false;
async function posFill(d, opts = {}) {
  if (!d || posFilling) return;
  const todo = cardsOf(d.id).filter(c => (!opts.only || opts.only.has(c.id)) && posNeeds(c, d).length);
  if (!todo.length) { if (!opts.quiet) toast('🏷️ Those cards already have their word labels'); return; }
  posFilling = true; let found = 0, i = 0, offline = false;
  try {
    for (const c of todo) {
      i++; if (!opts.quiet || todo.length > 3) toast(`🏷️ Finding parts of speech… ${i}/${todo.length}`);
      for (const side of posNeeds(c, d)) {
        const text = c[side] || '';
        let v; try { v = await posLookup(text, posLang(d, side)); } catch { offline = true; break; }
        const live = S.cards.find(x => x.id === c.id); if (!live || (live[side] || '') !== text) continue;
        (live.pos ||= {})[side] = { t: text, v }; if (v.length) found++;
      }
      if (offline) break;
      save(); if (view.name === 'deck' && view.deckId === d.id && typeof renderCardTable === 'function') renderCardTable();
      await new Promise(r => setTimeout(r, 250));   // be gentle with the free service
    }
  } finally { posFilling = false; }
  if (offline) toast('🏷️ Couldn’t reach Wiktionary. Word labels will be added when you’re back online.');
  else if (!opts.quiet || todo.length > 3) toast(`🏷️ Added ${found} word label${found === 1 ? '' : 's'}`);
  if (['deck', 'study', 'quick'].includes(view.name)) render();
}
const posTried = new Set();
function posMaybeFill(d) {   // quietly fill in labels for new or edited cards when a deck page opens
  if (!d || posFilling || posTried.has(d.id + ':' + cardsOf(d.id).length)) return;
  if (!cardsOf(d.id).some(c => posNeeds(c, d).length)) return;
  posTried.add(d.id + ':' + cardsOf(d.id).length);
  setTimeout(() => posFill(d, { quiet: true }), 400);
}

/* ---------- selection bar: labels on or off for just the selected cards ---------- */
function openBulkPos() {
  const d = deckById(view.deckId), cards = cardsOf(d.id).filter(c => bulkSel.has(c.id));
  if (!cards.length) return toast('Select some cards first');
  const eligible = cards.filter(c => ['front', 'back'].some(s => posEligible(c[s]))).length;
  openDialog({
    title: `🏷️ Word labels for ${cards.length} card${cards.length === 1 ? '' : 's'}`,
    body: `<div id="posForm" class="stack">
      <p class="muted small" style="margin:0">A little label on the card that says what kind of word it is, for sides with one or two words. ${eligible} of the selected cards are short enough. Everyday words are recognized right away; others are looked up on Wiktionary (needs internet; only the word is sent).</p>
      <div><b>For the selected cards</b><div class="stack" style="gap:4px;margin-top:4px">
        <label class="row" style="gap:8px;font-weight:400"><input type="radio" name="mode" value="on" checked> Show word labels</label>
        <label class="row" style="gap:8px;font-weight:400"><input type="radio" name="mode" value="off"> Hide word labels</label>
        <label class="row" style="gap:8px;font-weight:400"><input type="radio" name="mode" value="deck"> Follow the deck setting <span class="muted small">(${d.posTags ? 'on' : 'off'} for this deck)</span></label></div></div>
      <div><b>Which labels to show</b> <span class="muted small">(for the whole deck)</span><div class="row" style="flex-wrap:wrap;gap:6px 12px;margin-top:6px">${POS_GROUPS.map(([k, l, cls]) => `<label class="row" style="gap:5px;font-weight:400"><input type="checkbox" name="show" value="${k}" ${!Array.isArray(d.posShow) || d.posShow.includes(k) ? 'checked' : ''}><span class="pos-tag ${cls}">${esc(l)}</span></label>`).join('')}</div></div>
      <label class="row" style="gap:8px;font-weight:400"><input type="checkbox" name="redo"> Look up these cards’ labels again <span class="muted small">(if some look wrong)</span></label>
      <div><b>Which side gets the label</b> <span class="muted small">(for the whole deck)</span><div class="seg">${Object.entries(POS_SIDES).map(([k, l]) => `<label><input type="radio" name="side" value="${k}" ${(d.posSide || 'front') === k ? 'checked' : ''}>${l}</label>`).join('')}</div></div></div>`,
    ok: 'Apply',
    onOk: f => {
      const mode = f.mode.value, undo = cards.map(c => [c, c.posMode, c.pos]), side0 = d.posSide, show0 = d.posShow;
      const show = [...f.querySelectorAll('[name=show]:checked')].map(x => x.value);
      if (show.length === POS_GROUPS.length) delete d.posShow; else d.posShow = show;
      if (f.redo.checked) for (const c of cards) delete c.pos;
      d.posSide = f.side.value;
      for (const c of cards) { if (mode === 'deck') delete c.posMode; else c.posMode = mode; }
      save(); render();
      undoToast(mode === 'off' ? `Word labels hidden on ${cards.length} card${cards.length === 1 ? '' : 's'}` : `Word labels ${mode === 'on' ? 'turned on' : 'set to follow the deck'} for ${cards.length} card${cards.length === 1 ? '' : 's'}`,
        () => { for (const [c, m, p] of undo) { if (m === undefined) delete c.posMode; else c.posMode = m; if (p) c.pos = p; } d.posSide = side0; if (show0) d.posShow = show0; else delete d.posShow; save(); render(); toast('Change undone'); });
      if (mode !== 'off') setTimeout(() => posFill(d, { only: new Set(cards.map(c => c.id)), quiet: mode === 'deck' && !d.posTags }), 2500);   // let the Undo button show first
    },
  });
}
Object.assign(actions, { bulkPos: () => openBulkPos() });
