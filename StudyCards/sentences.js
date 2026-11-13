'use strict';
/* ================= Example sentences from Tatoeba (tatoeba.org) =================
   Tatoeba is a free collection of real sentences with translations (CC BY 2.0 FR).
   Only the card's word is sent, and only when a deck has "Add example sentences automatically" on,
   or when you press "✨ Suggest a sentence". */
const ISO3 = { es: 'spa', fr: 'fra', de: 'deu', it: 'ita', pt: 'por', ja: 'jpn', ko: 'kor', zh: 'cmn', en: 'eng', ru: 'rus', nl: 'nld', sv: 'swe', nb: 'nob',
  da: 'dan', fi: 'fin', pl: 'pol', cs: 'ces', sk: 'slk', hu: 'hun', ro: 'ron', bg: 'bul', hr: 'hrv', el: 'ell', tr: 'tur', uk: 'ukr', ar: 'ara', he: 'heb',
  fa: 'pes', hi: 'hin', bn: 'ben', ta: 'tam', th: 'tha', vi: 'vie', id: 'ind', ms: 'zsm', fil: 'tgl', sw: 'swh', af: 'afr', ca: 'cat' };
const sentenceCache = new Map();
async function findSentences(word, fromLang, toLang) {
  const from = ISO3[langBase(fromLang)], to = ISO3[langBase(toLang)] || 'eng';
  if (!from) throw new Error(`Automatic sentences aren’t available for ${langName(fromLang)} yet`);
  word = word.replace(/\s*[([{][^()[\]{}]*[)\]}]/g, ' ').trim() || word;   // notes like "(m.)" or "[irregular]" aren't part of the word
  const q = (NOSPACE(fromLang) ? word.trim() : coreOf(word).join(' ')) || word.trim();
  if (!q) throw new Error('Type the word first');
  const key = `${from}|${to}|${q}`;
  if (sentenceCache.has(key)) return sentenceCache.get(key);
  const url = `https://api.tatoeba.org/unstable/sentences?lang=${from}&q=${encodeURIComponent(q)}${from !== to ? `&trans%3Alang=${to}` : ''}&sort=relevance&limit=30`;
  let res = null;
  for (let attempt = 0; attempt < 3 && !(res && res.ok); attempt++) {   // retry brief network hiccups
    if (attempt) await new Promise(r => setTimeout(r, 1200 * attempt));
    try { res = await fetch(url); } catch { res = null; }
  }
  if (!res) throw new Error('Couldn’t reach Tatoeba. Check your internet connection.');
  if (!res.ok) throw new Error('Tatoeba is busy right now. Try again in a moment.');
  const data = (await res.json()).data || [];
  const fq = fold(q);
  // prefer translations made directly from the sentence (indirect ones go through a third language and can drift)
  const all = data.filter(s => !s.is_unapproved && s.text.length <= 90).map(s => {
    const trs = (s.translations || []).flat().filter(t => t && t.lang === to && !t.is_unapproved), direct = trs.find(t => t.is_direct);
    return { text: s.text, tr: from === to ? '' : (direct || trs[0])?.text || '', direct: from === to || !!direct, id: s.id, owner: s.owner };
  }).filter(s => from === to || s.tr);
  const list = (all.some(s => s.direct) ? all.filter(s => s.direct) : all)
    .sort((a, b) => (fold(b.text).includes(fq) - fold(a.text).includes(fq)) || a.text.length - b.text.length);
  sentenceCache.set(key, list);
  return list;
}
async function autoExample(card, quiet) {
  const d = deckById(card.deckId); if (!d || card.example || !card.front) return false;
  try {
    const list = await findSentences(card.front, d.frontLang, d.backLang);
    if (!list.length) return false;
    // prefer a sentence where the word itself appears, so "Finish the sentence" can blank it out
    const s = list.find(x => typeof findBlank === 'function' && findBlank(x.text, card.front, d.frontLang)) || list[0];
    const c = S.cards.find(x => x.id === card.id); if (!c || c.example) return false;
    c.example = s.text; c.exampleTr = s.tr; c.exampleSrc = `Tatoeba #${s.id}${s.owner ? ' by ' + s.owner : ''}`;
    save(); if (view.name === 'deck' && typeof renderCardTable === 'function') renderCardTable();
    if (!quiet) toast(`✨ Example sentence added for “${c.front}”`);
    return true;
  } catch (e) { if (!quiet) toast(e.message); return false; }
}
let filling = false;
async function fillMissingExamples(deck, onlyIds) {
  if (filling) return toast('Already finding example sentences…');
  const todo = cardsOf(deck.id).filter(c => !c.example && c.front && (!onlyIds || onlyIds.has(c.id)));
  if (!todo.length) { toast(onlyIds ? 'The selected cards already have example sentences' : 'Every card in this deck already has an example sentence'); return; }
  filling = true; let added = 0, i = 0;
  for (const c of todo) {
    i++; toast(`✨ Finding example sentences… ${i}/${todo.length}`);
    if (await autoExample(c, true)) added++;
    await new Promise(r => setTimeout(r, 350));   // be gentle with the free service
  }
  filling = false;
  toast(`✨ Added ${added} example sentence${added === 1 ? '' : 's'}${todo.length - added ? ` (${todo.length - added} word${todo.length - added === 1 ? '' : 's'} had no match)` : ''}`);
  if (['deck', 'games'].includes(view.name)) render();
}
/* "✨ Suggest a sentence" button in the card editors: each press shows the next suggestion. */
async function suggestSentence(btn) {
  const deck = deckById(btn.dataset.deck); if (!deck) return;
  const front = readEditor(btn.dataset.front).text, ex = document.getElementById(btn.dataset.target), tr = document.getElementById(btn.dataset.tr);
  if (!front) { toast('Type the word on the front first'); return; }
  btn.disabled = true; const label = btn.textContent; btn.textContent = '✨ Searching…';
  try {
    const list = await findSentences(front, deck.frontLang, deck.backLang);
    if (!list.length) { toast(`No example sentences found for “${front}”. You can type your own.`); return; }
    const n = btn.dataset.word === front ? (+btn.dataset.n + 1) % list.length : 0;
    btn.dataset.word = front; btn.dataset.n = n;
    ex.value = list[n].text; if (tr) tr.value = list[n].tr;
    ex.dataset.src = `Tatoeba #${list[n].id}${list[n].owner ? ' by ' + list[n].owner : ''}`;
    btn.nextElementSibling && (btn.nextElementSibling.textContent = `Sentence ${n + 1} of ${list.length} from Tatoeba · press again for another`);
  } catch (e) { toast(e.message); }
  finally { btn.disabled = false; btn.textContent = label === '✨ Searching…' ? '✨ Suggest a sentence' : label; }
}
function suggestRow(deckId, frontId, exId, trId) {
  return `<div class="row" style="gap:8px;margin-top:6px"><button type="button" class="btn sm" data-act="suggestEx" data-deck="${deckId}" data-front="${frontId}" data-target="${exId}" data-tr="${trId}">✨ Suggest a sentence</button><span class="muted small"></span></div>`;
}
Object.assign(actions, {
  suggestEx: el => suggestSentence(el),
  fillExamples: el => fillMissingExamples(deckById(el.dataset.id)),
});
