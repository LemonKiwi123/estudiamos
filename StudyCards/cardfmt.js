'use strict';
/* ================= Card text tools: UPPER / lower case, lists, left / center / right, and focus select =================
   How it is saved, all inside the side's own HTML (frontHtml / backHtml), so it travels with save, sync, backup, copy, swap and Anki files:
   - lists:      <ul data-list="bullet|dash"> or <ol data-list="num">   (older lists have no data-list and look as they always did)
   - alignment:  the whole side sits in <div data-align="left|right">   (no div = centered)
   - focus:      <span data-focus="1">…</span> around the focused text. card.front / card.back then hold ONLY the focused text,
                 so review, read-aloud, typed answers, quizzes and games all use it. The whole text stays in the HTML. */
const hasFocus = h => /<span data-focus="1"/.test(h || '');
const CF_ALIGN = /^<div data-align="(left|right)">([\s\S]*)<\/div>$/;
const cfAlign = h => (CF_ALIGN.exec(h || '') || [])[1] || '';
const cfWrap = (h, align) => h && align ? `<div data-align="${align}">${h}</div>` : h;
const cfBody = h => new DOMParser().parseFromString(`<body>${h}</body>`, 'text/html').body;
/* for showing a side: the saved marker becomes a class that only the big card views use (see .al in index.html) */
const alignShow = h => { const m = CF_ALIGN.exec(h); return m ? `<div class="al al-${m[1]}">${m[2]}</div>` : h; };
/* only the focused parts of a side, as HTML (the same HTML when nothing is focused) */
function focusHtml(h) {
  if (!hasFocus(h)) return h;
  const GAP = '\u0001', m = CF_ALIGN.exec(h), box = cfBody(m ? m[2] : h);
  for (const n of cfLeaves(box)) if (!n.parentElement.closest('[data-focus]')) n.replaceWith(GAP);
  const blank = el => !el.querySelector('[data-focus]') && !el.closest('[data-focus]');
  for (const el of [...box.querySelectorAll('li')]) if (blank(el)) el.remove();
  for (const el of [...box.querySelectorAll('*')].reverse()) if (el.tagName !== 'BR' && blank(el)) el.replaceWith(el.querySelector('br') ? document.createElement('br') : GAP);
  for (const el of [...box.querySelectorAll('[data-focus]')]) { if (el.getAttribute('style')) el.removeAttribute('data-focus'); else el.replaceWith(...el.childNodes); }
  const out = box.innerHTML.replace(/\s*\u0001[\s\u0001]*/g, ' ').replace(/ ?<br>(?:\s|<br>)*/g, '<br>').replace(/(<li[^>]*>)\s+/g, '$1').replace(/\s+<\/li>/g, '</li>')
    .replace(/(<(?:ul|ol)[^>]*>)\s+/g, '$1').replace(/(?:<br>|\s)+(<(?:ul|ol)\b)/g, '$1').replace(/(<\/(?:ul|ol)>)(?:<br>|\s)+/g, '$1').replace(/^(?:<br>|\s)+|(?:<br>|\s)+$/g, '');
  return cfWrap(out, m?.[1]);
}
const sideText = html => htmlToText(focusHtml(html));
/* the whole text of a side, also the part outside the focus (for the editor, search and text exports) */
const cardFull = (c, side) => hasFocus(c[side + 'Html']) ? htmlToText(c[side + 'Html']) : c[side];
/* put new review text on a side (translations): with a focus only the focused text is replaced; the alignment is kept */
function cfSetText(c, side, t) {
  const k = side + 'Html', h = c[k], a = cfAlign(h), html = esc(t).replace(/\n/g, '<br>'); c[side] = t;
  if (hasFocus(h)) {
    const box = cfBody(h), f = [...box.querySelectorAll('[data-focus]')];
    f[0].innerHTML = html; f.slice(1).forEach(x => x.remove()); c[k] = cleanHtml(box.innerHTML);
  } else if (a) c[k] = cfWrap(html, a);
  else delete c[k];
}
/* add HTML at the end of a side, inside its alignment */
const cfAppend = (h, add) => { const m = CF_ALIGN.exec(h), b = m ? m[2] : h; return cfWrap(b + (/<\/[uo]l>$/.test(b) ? add.replace(/^<br>/, '') : add), m?.[1]); };
/* Anki has no styles for these, so the look is written into the exported field (and ignored again on import) */
const cfAnki = h => h.replace(/<div data-align="(left|right)">/g, '<div data-align="$1" style="text-align:$1">')
  .replace(/<(ul|ol) data-list="(bullet|dash|num)"(?: style="([^"]*)")?>/g, (m, tag, kind, st) =>
    `<${tag} data-list="${kind}" style="${st ? st + ';' : ''}text-align:left;width:fit-content;margin:.25em auto${kind === 'dash' ? `;list-style-type:'– '` : ''}">`);

/* ---------- toolbar buttons ---------- */
const CF_SVG = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">${p}</svg>`;
const CF_LINES = { left: 'M4 6h16M4 12h9M4 18h13', center: 'M4 6h16M8 12h8M6 18h12', right: 'M4 6h16M11 12h9M7 18h13' };
const CF_LIST_ICONS = {
  bullet: CF_SVG('<path d="M10 6h10M10 12h10M10 18h10"/><g fill="currentColor" stroke="none"><circle cx="4.6" cy="6" r="1.8"/><circle cx="4.6" cy="12" r="1.8"/><circle cx="4.6" cy="18" r="1.8"/></g>'),
  dash: CF_SVG('<path d="M10 6h10M10 12h10M10 18h10M3 6h3M3 12h3M3 18h3"/>'),
  num: CF_SVG('<path d="M11 6h9M11 12h9M11 18h9"/><g fill="currentColor" stroke="none" font-size="8.5" font-weight="700" font-family="Arial,sans-serif"><text x="2" y="9">1</text><text x="2" y="15.2">2</text><text x="2" y="21.2">3</text></g>'),
};
function cfTools(id, align) {
  const b = (act, v, label, title, on) => `<button type="button" class="tool${on ? ' cf-on' : ''}" data-act="${act}" data-ed="${id}" data-v="${v}" title="${title}" aria-label="${title}"${on == null ? '' : ` aria-pressed="${!!on}"`}>${label}</button>`;
  return [b('edCase', 'up', 'AA', 'UPPER CASE: make the selected letters capitals'), b('edCase', 'low', 'aa', 'lower case: make the selected letters small'),
    b('edList', 'bullet', CF_LIST_ICONS.bullet, 'Bulleted list'), b('edList', 'dash', CF_LIST_ICONS.dash, 'List with dashes'), b('edList', 'num', CF_LIST_ICONS.num, 'Numbered list'),
    ...['left', 'center', 'right'].map(a => b('edAlign', a, CF_SVG(`<path d="${CF_LINES[a]}"/>`), a === 'center' ? 'Center the text on this side (normal)' : `Move the text on this side to the ${a}`, (align || 'center') === a)),
    b('edFocus', '', '🎯', 'Focus select: only the selected text shows in review. The rest stays on the card.')];
}
const cfFocusBar = id => `<div class="ed-focus"><span>🎯 In review, only the marked text shows.</span><button type="button" class="btn sm" data-act="edFocusReset" data-ed="${id}" title="Show all the text of this side in review again">Reset focus</button></div>`;
function cfSetAlign(id, a) {
  const ed = document.getElementById(id); if (!ed) return;
  if (a === 'left' || a === 'right') ed.dataset.align = a; else { a = 'center'; delete ed.dataset.align; }
  ed.closest('.editor')?.querySelectorAll('[data-act=edAlign]').forEach(b => { const on = b.dataset.v === a; b.classList.toggle('cf-on', on); b.setAttribute('aria-pressed', on); });
}

/* ---------- changing the selected text ---------- */
const cfTextNodes = root => { const out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); while (w.nextNode()) out.push(w.currentNode); return out; };
/* every piece of text and every picture inside an element */
function cfLeaves(el) {
  const out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  while (w.nextNode()) if (w.currentNode.nodeType === 3 ? w.currentNode.length : w.currentNode.tagName === 'IMG') out.push(w.currentNode);
  return out;
}
/* the selected pieces: text (with where it starts and ends) and pictures */
function cfSelected(root, r) {
  const out = [];
  for (const n of cfLeaves(root)) {
    if (!r.intersectsNode(n)) continue;
    if (n.nodeType !== 3) { out.push({ n }); continue; }
    const a = n === r.startContainer ? r.startOffset : 0, b = n === r.endContainer ? r.endOffset : n.length;
    if (b > a) out.push({ n, a, b });
  }
  return out;
}
/* Work on a copy of the field, then put it back in one step, so Ctrl+Z in the editor undoes it like typing */
function cfEdit(id, change, needSel = true) {
  const ed = document.getElementById(id); if (!ed?.isContentEditable) return;
  const r = edRange && edId === id && ed.contains(edRange.commonAncestorContainer) && !edRange.collapsed ? edRange : null;
  if (needSel && !(r && cfSelected(ed, r).length)) { toast('Select some text on the card first'); return; }
  const copy = ed.cloneNode(true);
  const same = n => { const path = []; for (; n !== ed; n = n.parentNode) path.unshift([...n.parentNode.childNodes].indexOf(n)); return path.reduce((x, i) => x.childNodes[i], copy); };
  let picked = [];
  if (needSel) { const cr = document.createRange(); cr.setStart(same(r.startContainer), r.startOffset); cr.setEnd(same(r.endContainer), r.endOffset); picked = cfSelected(copy, cr); }
  picked = change(copy, picked, ed) || [];
  const html = copy.innerHTML, opt = { rich: ed.dataset.rich === '1', pictures: ed.dataset.pics === '1' };
  // where the selection is, counted in letters, to select the same text again afterwards
  let pos = 0, from = -1, to = 0;
  for (const t of cfTextNodes(copy)) { if (picked.some(x => x.contains(t))) { if (from < 0) from = pos; to = pos + t.length; } pos += t.length; }
  ed.focus();
  const s = getSelection(), all = document.createRange(); all.selectNodeContents(ed); s.removeAllRanges(); s.addRange(all);
  try { document.execCommand('insertHTML', false, html); } catch {}
  if (cleanHtml(ed.innerHTML, opt) !== cleanHtml(html, opt)) { ed.innerHTML = html; ed.dispatchEvent(new Event('input', { bubbles: true })); }   // the browser changed something on the way: use the exact copy
  if (from < 0) return;
  const back = document.createRange(); let p = 0, started = false;
  for (const t of cfTextNodes(ed)) { if (!started && from < p + t.length) { back.setStart(t, from - p); started = true; } if (started && to <= p + t.length) { back.setEnd(t, to - p); break; } p += t.length; }
  if (started) { s.removeAllRanges(); s.addRange(back); edRange = back.cloneRange(); edId = id; }
}
/* cut a selected piece out as its own text node (or picture) */
const cfCut = ({ n, a, b }) => { if (n.nodeType !== 3) return n; if (b < n.length) n.splitText(b); return a ? n.splitText(a) : n; };
function cfCase(id, up) {
  cfEdit(id, (root, sel, ed) => sel.filter(x => x.n.nodeType === 3).map(x => {
    const t = cfCut(x), v = t.nodeValue;
    try { t.nodeValue = up ? v.toLocaleUpperCase(ed.lang || undefined) : v.toLocaleLowerCase(ed.lang || undefined); } catch { t.nodeValue = up ? v.toUpperCase() : v.toLowerCase(); }
    return t;
  }));
}
const cfMark = n => { const sp = document.createElement('span'); sp.dataset.focus = '1'; n.replaceWith(sp); sp.append(n); };
/* take the focus marks off; any color or size the browser put on the same span stays. Returns the pieces that were marked. */
function cfUnmark(root) {
  const was = [...root.querySelectorAll('[data-focus]')].flatMap(cfLeaves);
  for (const el of [...root.querySelectorAll('[data-focus]')]) { if (el.getAttribute('style')) el.removeAttribute('data-focus'); else el.replaceWith(...el.childNodes); }
  return new Set(was);
}
function cfFocus(id) {
  cfEdit(id, (root, sel) => {
    const off = sel.every(x => x.n.parentElement.closest('[data-focus]') || (x.n.nodeType === 3 && !x.n.nodeValue.slice(x.a, x.b).trim()));   // already all in focus: the button takes it out again
    const pieces = sel.map(cfCut), marked = cfUnmark(root);   // cut the pieces out first, then rebuild the marks one piece of text at a time
    for (const n of pieces) off ? marked.delete(n) : marked.add(n);
    marked.forEach(cfMark);
    for (const el of [...root.querySelectorAll('[data-focus]')]) if (el.isConnected || root.contains(el)) while (el.nextSibling?.nodeType === 1 && el.nextSibling.hasAttribute('data-focus')) { const b = el.nextSibling; el.append(...b.childNodes); b.remove(); }   // join neighbors
    return pieces;
  });
}
function cfList(id, kind) {
  const ed = document.getElementById(id); if (!ed?.isContentEditable) return;
  restoreRange(id);
  const here = () => { const r = getSelection().getRangeAt(0), n = r.commonAncestorContainer, up = (n.nodeType === 1 ? n : n.parentElement).closest('ul,ol'); return up && ed.contains(up) ? [up] : [...ed.querySelectorAll('ul,ol')].filter(l => r.intersectsNode(l)); };
  const now = here(), tag = kind === 'num' ? 'OL' : 'UL', kindOf = l => l.dataset.list || (l.tagName === 'OL' ? 'num' : 'bullet');
  if (now.length && now.every(l => l.tagName === tag) && !now.every(l => kindOf(l) === kind)) { now.forEach(l => { l.dataset.list = kind; }); return; }   // bullets <-> dashes
  document.execCommand(tag === 'OL' ? 'insertOrderedList' : 'insertUnorderedList');
  for (const l of here()) { if (l.tagName === tag) l.dataset.list = kind; else delete l.dataset.list; }
}
Object.assign(actions, {
  edCase: el => cfCase(el.dataset.ed, el.dataset.v === 'up'),
  edList: el => cfList(el.dataset.ed, el.dataset.v),
  edAlign: el => cfSetAlign(el.dataset.ed, el.dataset.v),
  edFocus: el => cfFocus(el.dataset.ed),
  edFocusReset: el => { cfEdit(el.dataset.ed, root => { cfUnmark(root); }, false); toast('Focus reset: all the text shows in review again'); },
});
