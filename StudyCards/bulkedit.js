'use strict';
/* ================= Bulk add: select cards in a deck and add the same text below what's already there =================
   Never removes or replaces existing text: the new text goes on a new line under the original. Undo is offered. */
const bulkSel = new Set();
let bulkDeck = null;
const BULK_FIELDS = { back: 'Back', front: 'Front', notes: 'Notes', example: 'Example sentence', exampleTr: 'Sentence translation' };
let bulkPrefs = { field: 'back', skipDup: true };

function bulkSync() {                       // forget selections from another deck or deleted cards
  if (bulkDeck !== view.deckId) { bulkSel.clear(); bulkDeck = view.deckId; }
  const ids = new Set(cardsOf(view.deckId).map(c => c.id));
  for (const id of [...bulkSel]) if (!ids.has(id)) bulkSel.delete(id);
}
function renderBulkBar() {
  const bar = $('#bulkBar'); if (!bar) return;
  const n = bulkSel.size;
  bar.classList.toggle('show', n > 0);
  bar.innerHTML = n ? `<span><b>${n}</b> card${n === 1 ? '' : 's'} selected</span>
    <div class="row"><button type="button" class="btn sm primary" data-act="bulkAdd">✏️ Add text to selected</button>
    <button type="button" class="btn sm" data-act="bulkStrip" title="Remove notes in ( ) or [ ], and/or clear text formatting, on the selected cards">🧹 Brackets &amp; formatting</button>
    <button type="button" class="btn sm" data-act="bulkPos" title="Show or hide part-of-speech labels (noun, verb…) on the selected cards">🏷️ Word labels</button>
    <button type="button" class="btn sm" data-act="bulkExamples" title="Find a real example sentence + translation for each selected card that doesn’t have one">✨ Add sentences</button>
    <button type="button" class="btn sm" data-act="bulkTranslate" title="Translate the selected cards from one side into the other (you check them first)">🌐 Translate</button>
    <button type="button" class="btn sm" data-act="bulkSwap" title="Swap the front and back of the selected cards">⇄ Swap sides</button>
    <button type="button" class="btn sm" data-act="bulkDup" title="Make a copy of each selected card in this deck">📄 Duplicate cards</button>
    <button type="button" class="btn sm" data-act="deckFromSel" title="Make a new deck with copies of only these cards">📦 New deck from these</button>
    <button type="button" class="btn sm" data-act="bulkFreeze" data-on="1" title="Skip these cards when studying">❄️ Freeze</button>
    <button type="button" class="btn sm" data-act="bulkFreeze" data-on="0">Unfreeze</button>
    <button type="button" class="btn sm danger" data-act="bulkDelete" title="Delete only the selected cards">🗑️ Delete selected</button>
    <button type="button" class="btn sm ghost" data-act="bulkClear">Clear selection</button></div>` : '';
  const fromSel = $('#deckFromSelBtn'); if (fromSel) fromSel.textContent = `📦 New deck from selected${n ? ` (${n})` : ''}`;
  const all = $('#selAll'), shown = [...document.querySelectorAll('.cardSel')];
  if (all) { const k = shown.filter(x => x.checked).length; all.checked = shown.length > 0 && k === shown.length; all.indeterminate = k > 0 && k < shown.length; }
}
const bulkTextToHtml = t => esc(t).replace(/\n/g, '<br>');
function bulkApply(cards, field, text, skipDup) {
  const undo = [], hasDup = c => norm(cardFull(c, field) || '').includes(norm(text));
  let changed = 0, skipped = 0;
  for (const c of cards) {
    if (skipDup && hasDup(c)) { skipped++; continue; }
    undo.push({ c, v: c[field], h: c[field + 'Html'] });
    c[field] = (c[field] || '').trim() ? `${c[field].replace(/\s+$/, '')}\n${text}` : text;
    if ((field === 'front' || field === 'back') && c[field + 'Html']) { c[field + 'Html'] = cfAppend(c[field + 'Html'], '<br>' + bulkTextToHtml(text)); if (hasFocus(c[field + 'Html'])) c[field] = sideText(c[field + 'Html']); }   // focused text stays the only text in review
    changed++;
  }
  return { undo, changed, skipped };
}
function openBulkAdd() {
  const d = deckById(view.deckId), cards = cardsOf(d.id).filter(c => bulkSel.has(c.id));
  if (!cards.length) return toast('Select some cards first');
  const sample = cards[0];
  const preview = () => {
    const f = $('#bulkForm')?.closest('form'); if (!f) return;
    const field = f.field.value, text = f.text.value.trim(), p = $('#bulkPreview');
    $('#bulkFrontWarn').style.display = field === 'front' ? '' : 'none';
    const before = cardFull(sample, field) || '';
    p.innerHTML = `<div class="muted small">Preview on “${esc(plainSent(sample.front).slice(0, 40))}”</div>
      <div class="bulk-prev">${before ? `<div>${esc(before).replace(/\n/g, '<br>')}</div>` : '<div class="muted small">(empty)</div>'}${text ? `<div class="bulk-new">${bulkTextToHtml(text)}</div>` : ''}</div>`;
  };
  openDialog({
    title: `✏️ Add text to ${cards.length} card${cards.length === 1 ? '' : 's'}`,
    body: `<div id="bulkForm" class="stack">
      <p class="muted small" style="margin:0">Your text is added on a new line <b>below</b> what’s already there. Nothing on the cards is removed or replaced.</p>
      <div><b>Add it to</b><div class="seg">${Object.entries(BULK_FIELDS).map(([k, l]) => `<label><input type="radio" name="field" value="${k}" ${bulkPrefs.field === k ? 'checked' : ''}>${l}</label>`).join('')}</div></div>
      <div class="banner" id="bulkFrontWarn" style="display:none"><span>⚠️ The front is what games and quizzes ask about and what is read aloud, so extra text there becomes part of the answer.</span></div>
      <label class="field">Text to add<textarea name="text" rows="3" placeholder="e.g. (informal) or a grammar note or a hint"></textarea></label>
      <label class="row" style="gap:8px;font-weight:400"><input type="checkbox" name="skipDup" ${bulkPrefs.skipDup ? 'checked' : ''}> Skip cards that already contain this text</label>
      <div id="bulkPreview"></div></div>`,
    ok: 'Add text',
    onOpen: () => { const f = $('#bulkForm')?.closest('form'); f.addEventListener('input', preview); f.addEventListener('change', preview); preview(); setTimeout(() => f.text.focus(), 50); },
    onOk: () => {
      const f = $('#bulkForm')?.closest('form'), text = f.text.value.trim(), field = f.field.value;
      if (!text) { toast('Type the text to add'); return false; }
      bulkPrefs = { field, skipDup: f.skipDup.checked };
      const r = bulkApply(cards, field, text, bulkPrefs.skipDup);
      if (!r.changed) { toast('Those cards already have that text, so nothing changed'); return; }
      save(); render();
      const msg = `Added to ${r.changed} card${r.changed === 1 ? '' : 's'}${r.skipped ? ` (${r.skipped} already had it)` : ''}`;
      undoToast(msg, () => { r.undo.forEach(u => { u.c[field] = u.v; if (u.h !== undefined) u.c[field + 'Html'] = u.h; }); save(); render(); toast('Change undone'); });
    },
  });
}
/* ================= Remove brackets: delete ( … ) / [ … ] / { … } and everything inside them =================
   Works on the words only, so colors and highlights in rich text are kept. Brackets without a partner are left alone. */
const STRIP_KINDS = { round: ['(', ')', '( ) parentheses'], square: ['[', ']', '[ ] brackets'], curly: ['{', '}', '{ } curly braces'] };
const STRIP_MODES = { all: ['Brackets and the text inside', '“gato (m.)” → “gato”'], inner: ['Only the text inside (keep the brackets)', '“gato (m.)” → “gato ()”'], marks: ['Only the brackets (keep the text)', '“gato (m.)” → “gato m.”'] };
let stripPrefs = { kinds: ['round', 'square'], fields: ['front', 'back'], mode: 'all', fmt: false };
function stripMask(str, kinds) {   // which characters to delete. kinds.mode: 'all' = the pair + what's inside (+ spaces before it), 'inner' = only what's inside, 'marks' = only the brackets
  const mode = kinds.mode || 'all';
  const open = {}, close = {}; for (const k of kinds) { const [o, c] = STRIP_KINDS[k]; open[o] = c; close[c] = o; }
  const del = new Uint8Array(str.length), stack = [];
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (open[ch]) stack.push([ch, i]);
    else if (close[ch]) {
      const at = stack.map(x => x[0]).lastIndexOf(close[ch]); if (at < 0) continue;
      const from = stack[at][1]; stack.length = at;
      if (mode === 'inner') { for (let j = from + 1; j < i; j++) del[j] = 1; continue; }
      if (mode === 'marks') { del[from] = del[i] = 1; continue; }
      let a = from; while (a > 0 && /[ \t]/.test(str[a - 1])) a--;
      if (a > 0 && !/[\n]/.test(str[a - 1]) && i + 1 < str.length && !/[\s,.;:!?)\]}]/.test(str[i + 1])) a = from;   // "un(a) gato" -> keep the words apart
      for (let j = a; j <= i; j++) del[j] = 1;
    }
  }
  return del;
}
const stripTidy = t => t.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+([,.;:!?])/g, '$1').replace(/^[ \t]+|[ \t]+$/gm, '');
function stripText(str, kinds) { if (!str) return str; const del = stripMask(str, kinds); let out = ''; for (let i = 0; i < str.length; i++) if (!del[i]) out += str[i]; return stripTidy(out).trim(); }
function stripBracketsHtml(html, kinds) {   // the same thing across the text inside rich text, leaving the tags (colors, bold…) alone
  const box = document.createElement('div'); box.innerHTML = html;
  const nodes = [], walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT); while (walk.nextNode()) nodes.push(walk.currentNode);
  const all = nodes.map(n => n.nodeValue).join(''), del = stripMask(all, kinds); let pos = 0;
  for (const n of nodes) { const v = n.nodeValue; let out = ''; for (let i = 0; i < v.length; i++) if (!del[pos + i]) out += v[i]; pos += v.length; n.nodeValue = out.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+([,.;:!?])/g, '$1'); }
  box.querySelectorAll('b,i,u,s,em,strong,span,mark,font,sub,sup').forEach(e => { if (!e.textContent && !e.querySelector('br,img')) e.remove(); });   // drop formatting left with nothing inside
  return box.innerHTML.replace(/(<br>\s*)+$/, '').trim();
}
function stripPlan(cards, fields, kinds) {
  const out = [];
  for (const c of cards) { const ch = {}; for (const f of fields) { const v = cardFull(c, f) || '', nv = stripText(v, kinds); if (nv !== v) ch[f] = nv; } if (Object.keys(ch).length) out.push({ c, ch }); }
  return out;
}
/* Clear formatting: bold, italics, colors, highlights, sizes and fonts go; the words, line breaks and pictures stay */
const fmtHas = html => !!html && /<(?!\/|br\b|img\b|span data-focus="[12]">)/i.test(html);   // a focus mark isn't formatting
function fmtClear(c, f) { const h = cleanHtml(c[f + 'Html'], { rich: false, pictures: true }); if (/<img\b/i.test(h) || hasMark(h)) c[f + 'Html'] = h; else delete c[f + 'Html']; }
function openBulkStrip() {
  const d = deckById(view.deckId), cards = cardsOf(d.id).filter(c => bulkSel.has(c.id));
  if (!cards.length) return toast('Select some cards first');
  const read = () => { const f = $('#stripForm')?.closest('form'), mode = f.mode.value, kinds = mode === 'none' ? [] : Object.keys(STRIP_KINDS).filter(k => f['k_' + k].checked); kinds.mode = mode;
    return { kinds, fields: Object.keys(BULK_FIELDS).filter(k => f['f_' + k].checked), mode, fmt: f.fmt.checked }; };
  // what would change on each card: brackets (ch) and/or formatting (fm)
  const planFor = ({ kinds, fields, fmt }) => { const by = new Map();
    if (kinds.length) for (const x of stripPlan(cards, fields, kinds)) by.set(x.c.id, { c: x.c, ch: x.ch, fm: [] });
    if (fmt) for (const c of cards) { const fm = fields.filter(f => fmtHas(c[f + 'Html'])); if (fm.length) { const e = by.get(c.id) || { c, ch: {}, fm: [] }; e.fm = fm; by.set(c.id, e); } }
    return [...by.values()]; };
  const preview = () => {
    const o = read(), p = $('#stripPreview'), f = $('#stripForm')?.closest('form'); if (!p) return;
    f.querySelector('#stripKinds').style.display = o.mode === 'none' ? 'none' : '';
    if (o.mode === 'none' && !o.fmt) { p.innerHTML = '<div class="muted small">Choose what to delete, or tick “Clear text formatting”.</div>'; return; }
    if ((o.mode !== 'none' && !o.kinds.length) || !o.fields.length) { p.innerHTML = '<div class="muted small">Pick at least one kind of bracket and one part of the card.</div>'; return; }
    const plan = planFor(o), nb = plan.filter(x => Object.keys(x.ch).length).length, nf = plan.filter(x => x.fm.length).length;
    p.innerHTML = plan.length ? `<div class="small"><b>${plan.length}</b> of ${cards.length} selected card${cards.length === 1 ? '' : 's'} will change${nb && nf ? ` (brackets on ${nb}, formatting on ${nf})` : ''}.</div>` +
      plan.slice(0, 3).map(({ c, ch, fm }) => `<div class="bulk-prev">${[...new Set([...Object.keys(ch), ...fm])].map(k => { const nv = k in ch ? ch[k] : cardFull(c, k) || '';
        return `<div class="muted small">${BULK_FIELDS[k]}${fm.includes(k) ? ' · formatting cleared' : ''}</div>${k in ch ? `<div><s>${esc(cardFull(c, k)).replace(/\n/g, '<br>')}</s></div>` : `<div class="rich">${typeof sideHtml === 'function' ? sideHtml(c, k, d, { full: true }) : esc(c[k] || '')}</div>`}<div class="bulk-new" ${fm.includes(k) ? 'style="font-weight:400;color:inherit"' : ''}>${nv ? esc(nv).replace(/\n/g, '<br>') : '<i>(empty)</i>'}</div>`; }).join('')}</div>`).join('') +
      (plan.length > 3 ? `<div class="muted small">…and ${plan.length - 3} more.</div>` : '') +
      (plan.some(x => Object.values(x.ch).some(v => !v)) ? '<div class="banner"><span>⚠️ Some cards would become empty because everything on them is inside brackets.</span></div>' : '')
      : `<div class="muted small">None of the selected cards have ${o.kinds.length ? 'that kind of bracket' : ''}${o.kinds.length && o.fmt ? ' or ' : ''}${o.fmt ? 'any text formatting' : ''} in those parts.</div>`;
  };
  openDialog({
    title: `🧹 Clean up ${cards.length} card${cards.length === 1 ? '' : 's'}`,
    body: `<div id="stripForm" class="stack">
      <p class="muted small" style="margin:0">Tidy all the selected cards at once: remove notes in brackets, clear text formatting, or both. You can undo it afterwards.</p>
      <div><b>Brackets</b><div class="stack" style="gap:4px;margin-top:4px">${Object.entries(STRIP_MODES).map(([k, [l, ex]]) => `<label class="row" style="gap:8px;font-weight:400"><input type="radio" name="mode" value="${k}" ${stripPrefs.mode === k ? 'checked' : ''}> ${l} <span class="muted small">${ex}</span></label>`).join('')}
        <label class="row" style="gap:8px;font-weight:400"><input type="radio" name="mode" value="none" ${stripPrefs.mode === 'none' ? 'checked' : ''}> Leave brackets alone</label></div></div>
      <div id="stripKinds"><b>Which brackets</b><div class="seg">${Object.entries(STRIP_KINDS).map(([k, v]) => `<label><input type="checkbox" name="k_${k}" ${stripPrefs.kinds.includes(k) ? 'checked' : ''}>${v[2]}</label>`).join('')}</div></div>
      <div><b>Formatting</b><label style="display:flex;flex-wrap:nowrap;gap:8px;font-weight:400;margin-top:4px;align-items:flex-start"><input type="checkbox" name="fmt" ${stripPrefs.fmt ? 'checked' : ''} style="margin-top:3px;flex:none"><span>Clear text formatting<br><span class="muted small">Removes bold, italics, underline, colors, highlights, sizes and fonts from the front and back. Words, line breaks and pictures stay.</span></span></label></div>
      <div><b>From</b><div class="seg">${Object.entries(BULK_FIELDS).map(([k, l]) => `<label><input type="checkbox" name="f_${k}" ${stripPrefs.fields.includes(k) ? 'checked' : ''}>${l}</label>`).join('')}</div></div>
      <div id="stripPreview"></div></div>`,
    ok: 'Apply',
    onOpen: () => { const f = $('#stripForm')?.closest('form'); f.addEventListener('change', preview); preview(); },
    onOk: () => {
      const o = read(), { kinds, fields, mode, fmt } = o;
      if (mode === 'none' && !fmt) { toast('Choose what to delete, or tick “Clear text formatting”'); return false; }
      if ((mode !== 'none' && !kinds.length) || !fields.length) { toast('Pick a kind of bracket and a part of the card'); return false; }
      stripPrefs = { kinds: mode === 'none' ? stripPrefs.kinds : [...kinds], fields, mode, fmt };
      const plan = planFor(o);
      if (!plan.length) { toast('Nothing to change on those cards'); return; }
      const undo = plan.map(({ c }) => ({ c, v: Object.fromEntries([...fields, ...fields.map(f => f + 'Html')].map(k => [k, c[k]])) }));
      let nb = 0, nf = 0;
      for (const { c, ch, fm } of plan) {
        for (const [f, nv] of Object.entries(ch)) { c[f] = nv; if (c[f + 'Html']) { const foc = hasFocus(c[f + 'Html']); c[f + 'Html'] = stripBracketsHtml(c[f + 'Html'], kinds); if (foc) c[f] = sideText(c[f + 'Html']); } }
        for (const f of fm) fmtClear(c, f);
        if (Object.keys(ch).length) nb++; if (fm.length) nf++;
      }
      save(); render();
      const msg = [nb ? `removed brackets on ${nb} card${nb === 1 ? '' : 's'}` : '', nf ? `cleared formatting on ${nf} card${nf === 1 ? '' : 's'}` : ''].filter(Boolean).join(' and ');
      undoToast(msg[0].toUpperCase() + msg.slice(1), () => { for (const u of undo) for (const [k, v] of Object.entries(u.v)) { if (v === undefined) delete u.c[k]; else u.c[k] = v; } save(); render(); toast('Change undone'); });
    },
  });
}
Object.assign(actions, {
  bulkAdd: () => openBulkAdd(),
  bulkStrip: () => openBulkStrip(),
  bulkExamples: () => { const d = deckById(view.deckId); if (d && typeof fillMissingExamples === 'function') fillMissingExamples(d, new Set(bulkSel)); },
  bulkDelete: () => {   // delete only the ticked cards (with Undo)
    const ids = new Set(bulkSel), gone = S.cards.filter(c => ids.has(c.id)), n = gone.length; if (!n) return;
    const txt = v => typeof plainSent === 'function' ? plainSent(v || '') : String(v || ''), list = gone.slice(0, 5).map(c => `<li>${esc(txt(c.front))} → ${esc(txt(c.back))}</li>`).join('') + (n > 5 ? `<li class="muted">…and ${n - 5} more</li>` : '');
    openDialog({ title: `Delete ${n} card${n === 1 ? '' : 's'}?`, ok: 'Delete', danger: true, body: `<ul style="margin:0;padding-left:18px">${list}</ul><p class="muted small" style="margin:8px 0 0">Only the selected cards are deleted. The rest of the deck stays.</p>`, onOk: () => {
      const keep = S.cards.map((c, i) => [c, i]).filter(([c]) => ids.has(c.id));
      S.cards = S.cards.filter(c => !ids.has(c.id)); bulkSel.clear(); save(); render();
      undoToast(`Deleted ${n} card${n === 1 ? '' : 's'}`, () => { for (const [c, i] of keep) S.cards.splice(Math.min(i, S.cards.length), 0, c); save(); render(); toast('Cards restored'); });
    } });
  },
  bulkClear: () => { bulkSel.clear(); document.querySelectorAll('.cardSel').forEach(x => x.checked = false); clSelChanged(); renderBulkBar(); },
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.classList?.contains('cardSel')) { t.checked ? bulkSel.add(t.dataset.id) : bulkSel.delete(t.dataset.id); t.closest('tr')?.classList.toggle('sel-on', t.checked); clSelChanged(); renderBulkBar(); }
  else if (t.id === 'selAll') { for (const c of renderCardTable.st?.cs || []) t.checked ? bulkSel.add(c.id) : bulkSel.delete(c.id); document.querySelectorAll('.cardSel').forEach(x => { x.checked = t.checked; t.checked ? bulkSel.add(x.dataset.id) : bulkSel.delete(x.dataset.id); x.closest('tr')?.classList.toggle('sel-on', t.checked); }); clSelChanged(); renderBulkBar(); }
});
// the whole selection strip beside a card is a click target, not only the little box
document.addEventListener('click', e => {
  const td = e.target.closest?.('table.cards td.sel'); if (!td || e.target.matches('input')) return;
  const ck = td.querySelector('input[type=checkbox]'); if (!ck) return;
  ck.checked = !ck.checked; ck.dispatchEvent(new Event('change', { bubbles: true }));
});
