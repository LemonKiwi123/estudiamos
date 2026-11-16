'use strict';
/* ================= ✏️ Sketchpad, classic paint-program style =================
   Tools down the left in two columns, a size / fill box under them, the picture on a gray workspace,
   a color palette at the bottom (left-click = front color, right-click = back color) and a status bar.
   Shapes use the front color for outlines and the back color for filling. Symmetry, grid and guides still work. */
let PN_W = 1200, PN_H = 800;   // set from the picture's size (📐 Canvas size…)
const PN_MAX = 3000, PN_PRESETS = [['Small', 640, 480], ['Standard', 1200, 800], ['HD (16:9)', 1920, 1080], ['Square', 1080, 1080], ['Portrait (4:5)', 1080, 1350],
  ['Phone wallpaper', 1080, 1920], ['Letter / A4 page', 1275, 1650], ['Flashcard', 900, 600], ['Banner', 1500, 500], ['Pixel art', 64, 64]];
function pnSize() { const a = art(); PN_W = Math.max(16, Math.min(PN_MAX, a.cw || 1200)); PN_H = Math.max(16, Math.min(PN_MAX, a.ch || 800)); }
const pnUndoMax = () => Math.max(4, Math.min(30, Math.floor(120e6 / (PN_W * PN_H * 4))));   // big pictures keep fewer undo steps (memory)
const pn = { ctx: null, cv: null, tmp: null, undo: [], redo: [], down: false, start: null, last: null, poly: null, curve: null, sel: null, zoom: 1 };
const PN_TOOLS = [
  ['select', 'Select and move', '<path d="M4 4h16v16H4z" fill="none" stroke="currentColor" stroke-dasharray="3 2" stroke-width="1.6"/>'],
  ['eraser', 'Eraser', '<path d="M4 15l8-8 6 6-6 6H8z" fill="#f4a7b9" stroke="currentColor" stroke-width="1.4"/><path d="M8 19h12" stroke="currentColor" stroke-width="1.4"/>'],
  ['fill', 'Fill with color', '<path d="M6 11l6-6 6 6-6 6z" fill="#cfe3ff" stroke="currentColor" stroke-width="1.4"/><path d="M18 13c0 2 1.5 3 1.5 4.5a1.5 1.5 0 0 1-3 0C16.5 16 18 15 18 13z" fill="#3b54e8"/>'],
  ['picker', 'Pick a color', '<path d="M15 4l5 5-2 2-1-1-7 7H7v-3l7-7-1-1z" fill="#ddd" stroke="currentColor" stroke-width="1.4"/><path d="M5 19l2-2" stroke="currentColor" stroke-width="2"/>'],
  ['hand', 'Hand: drag to move around the picture (when zoomed in)', '<path d="M8 12V6.5a1.3 1.3 0 0 1 2.6 0V11m0-5.5V4.8a1.3 1.3 0 0 1 2.6 0V11m0-5V5.8a1.3 1.3 0 0 1 2.6 0V12m0-4.2a1.3 1.3 0 0 1 2.6 0V14c0 3.6-2.4 6-5.8 6h-.8c-2.2 0-3.6-1-4.8-2.8L5 14.2c-.6-1 .6-2.2 1.6-1.4L8 14" fill="#fde2c4" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/>'],
  ['zoom', 'Zoom in and out', '<circle cx="10" cy="10" r="5.5" fill="#e6f0ff" stroke="currentColor" stroke-width="1.6"/><path d="M14 14l6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'],
  ['pencil', 'Pencil', '<path d="M5 19l1-4 10-10 3 3-10 10z" fill="#ffd34d" stroke="currentColor" stroke-width="1.4"/><path d="M5 19l1-4 3 3z" fill="#333"/>'],
  ['brush', 'Brush', '<path d="M14 4l6 6-7 7-6-6z" fill="#c9a26b" stroke="currentColor" stroke-width="1.3"/><path d="M7 11c-2 1-3 3-3 6 0 1 1 3 3 3 3 0 5-2 6-4z" fill="#3b54e8"/>'],
  ['spray', 'Airbrush', '<rect x="9" y="8" width="7" height="12" rx="2" fill="#bbb" stroke="currentColor" stroke-width="1.3"/><rect x="11" y="5" width="3" height="3" fill="currentColor"/><g fill="currentColor"><circle cx="5" cy="5" r="1"/><circle cx="3" cy="8" r="1"/><circle cx="6" cy="9" r="1"/><circle cx="4" cy="12" r="1"/></g>'],
  ['text', 'Text', '<text x="12" y="19" text-anchor="middle" font-size="17" font-weight="800" font-family="Georgia,serif" fill="currentColor">A</text>'],
  ['line', 'Line', '<path d="M5 19L19 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'],
  ['curve', 'Curve (draw a line, then drag to bend it)', '<path d="M5 18C6 6 18 18 19 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'],
  ['rect', 'Rectangle', '<rect x="4" y="6" width="16" height="12" fill="none" stroke="currentColor" stroke-width="2"/>'],
  ['poly', 'Polygon (click the corners; double-click or click the start to finish)', '<path d="M5 18l3-12 11 4-4 8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'],
  ['ellipse', 'Ellipse', '<ellipse cx="12" cy="12" rx="8" ry="6" fill="none" stroke="currentColor" stroke-width="2"/>'],
  ['round', 'Rounded rectangle', '<rect x="4" y="6" width="16" height="12" rx="4" fill="none" stroke="currentColor" stroke-width="2"/>'],
];
const PN_PALETTE = ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000',
  '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff0080', '#ff8040'];
const pnA = () => { const a = art(); a.color ||= '#000000'; a.color2 ||= '#ffffff'; a.tool = PN_TOOLS.some(t => t[0] === a.tool) ? a.tool : 'pencil'; a.fillStyle ||= 'outline'; return a; };
function pnOptionsHtml() {   // the little box under the tools changes with the tool
  const a = pnA(), t = a.tool;
  if (['line', 'curve', 'pencil'].includes(t) || ['rect', 'poly', 'ellipse', 'round'].includes(t)) {
    const widths = t === 'pencil' ? [1, 2, 4, 8] : [1, 3, 5, 8];
    return `${['rect', 'poly', 'ellipse', 'round'].includes(t) ? `<div class="pn-fills">${[['outline', 'Outline'], ['both', 'Outline + fill'], ['fill', 'Fill only']].map(([k, l]) => `<button type="button" class="${a.fillStyle === k ? 'on' : ''}" data-pn="fillStyle" data-k="${k}" title="${l} (fill uses the back color)"><svg viewBox="0 0 24 14"><rect x="3" y="2" width="18" height="10" fill="${k === 'outline' ? 'none' : a.color2}" stroke="${k === 'fill' ? 'none' : a.color}" stroke-width="2"/></svg></button>`).join('')}</div>` : ''}
      <div class="pn-widths">${widths.map(w => `<button type="button" class="${(a.lineW || widths[1]) === w ? 'on' : ''}" data-pn="lineW" data-k="${w}" title="${w} px"><i style="height:${Math.max(1, w)}px"></i></button>`).join('')}</div>`;
  }
  if (t === 'eraser' || t === 'brush' || t === 'spray' || t === 'text') { const sizes = t === 'text' ? [16, 24, 36, 56] : t === 'spray' ? [8, 16, 28, 44] : [4, 8, 16, 32];
    return `<div class="pn-sizes">${sizes.map(s => `<button type="button" class="${(a[t + 'Size'] || sizes[1]) === s ? 'on' : ''}" data-pn="size" data-k="${s}" title="${s}">${t === 'text' ? `<b style="font-size:${8 + s / 6}px">A</b>` : `<i style="width:${Math.min(22, 4 + s / 2)}px;height:${Math.min(22, 4 + s / 2)}px"></i>`}</button>`).join('')}</div>`; }
  if (t === 'hand') return `<div class="pn-opt-help">Drag to move around. Zoom in first: ${[1, 2, 4].map(z => `<button type="button" class="${pn.zoom === z ? 'on' : ''}" data-pn="zoomTo" data-k="${z}">${z}×</button>`).join('')}</div>`;
  if (t === 'zoom') return `<div class="pn-sizes">${[1, 2, 4, 6].map(z => `<button type="button" class="${pn.zoom === z ? 'on' : ''}" data-pn="zoomTo" data-k="${z}">${z}×</button>`).join('')}</div>`;
  if (t === 'select') return `<div class="pn-opt-help">${pn.sel ? 'Drag the box to move it. <b>Delete</b> clears it.' : 'Drag to choose an area.'}</div>`;
  return '';
}
function paintHtml() {
  pnSize(); const a = pnA(), custom = (a.swatches || []).slice(0, 14);
  const menu = (label, items) => `<details class="pn-menu"><summary>${label}</summary><div class="pn-drop">${items.map(([k, l, extra]) => k === '-' ? '<hr>' : `<button type="button" data-pn="${k}" ${extra || ''}>${l}</button>`).join('')}</div></details>`;
  return `<div class="pn">
    <div class="pn-menus">
      ${menu('File', [['new', '🗒️ New picture…'], ['open', '📂 Open a picture…'], ['png', '💾 Save picture'], ['-'], ['toCard', '📇 Put on a flashcard']])}
      ${menu('Edit', [['undo', '↩️ Undo (Ctrl+Z)'], ['redo', '↪️ Redo (Ctrl+Y)'], ['-'], ['selAll', '⬚ Select all'], ['delSel', '🧽 Clear selection'], ['clear', '🧹 Clear the picture']])}
      ${menu('View', [['grid', `${a.grid ? '✅' : '⬜'} Grid`], ['guideT', `${a.guide && a.showGuide !== false ? '✅' : '⬜'} Guide${a.guide ? '' : ' (choose one in 📐 Guides)'}`], ['-'], ['zoomTo', '🔍 Zoom 1×', 'data-k="1"'], ['zoomTo', '🔍 Zoom 2×', 'data-k="2"'], ['zoomTo', '🔍 Zoom 4×', 'data-k="4"']])}
      ${menu('Image', [['canvasSize', '📐 Canvas size…'], ['-'], ['flipH', '↔️ Flip left–right'], ['flipV', '↕️ Flip upside down'], ['invert', '🌗 Invert colors'], ['gray', '⚫ Make it gray']])}
      ${menu('Colors', [['editColor', '🎨 Edit the front color…'], ['editColor2', '🎨 Edit the back color…'], ['swap', '⇄ Swap front and back']])}
      ${menu('Mirror', SK_SYMS.map(([k, l]) => ['sym', `${a.sym === k ? '✅' : '⬜'} ${l}`, `data-k="${k}"`]))}
      ${menu('Workspace', [['wsDraw', `${a.animMode ? '⬜' : '✅'} 🖌️ Drawing`], ['wsAnim', `${a.animMode ? '✅' : '⬜'} 🎞️ Animation`], ['-'], ['animTips', '🎬 Animation tips']])}
      ${menu('Help', [['help', '❓ How to use the tools']])}
    </div>
    <div class="pn-body">
      <div class="pn-side"><div class="pn-tools">${PN_TOOLS.map(([k, l, svg]) => `<button type="button" class="pn-tool ${a.tool === k ? 'on' : ''}" data-pn="tool" data-k="${k}" title="${esc(l)}" aria-label="${esc(l)}" aria-pressed="${a.tool === k}"><svg viewBox="0 0 24 24">${svg}</svg></button>`).join('')}</div>
        <div class="pn-hist"><button type="button" class="pn-tool" data-pn="undo" title="Undo (Ctrl+Z)" aria-label="Undo" ${pn.undo.length ? '' : 'disabled'}><svg viewBox="0 0 24 24"><path d="M9 7H5V3M5 7c2-2.5 4.6-3.5 7.5-3.5A7.5 7.5 0 1 1 5 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
          <button type="button" class="pn-tool" data-pn="redo" title="Redo (Ctrl+Y)" aria-label="Redo" ${pn.redo.length ? '' : 'disabled'}><svg viewBox="0 0 24 24"><path d="M15 7h4V3m0 4c-2-2.5-4.6-3.5-7.5-3.5A7.5 7.5 0 1 0 19 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
        <div class="pn-opts" id="pnOpts">${pnOptionsHtml()}</div></div>
      <div class="pn-work" id="pnWork"><div class="pn-page ${PN_W < 300 && PN_H < 300 ? 'pn-pixel' : ''}" id="pnPage" style="aspect-ratio:${PN_W}/${PN_H}">
        <canvas id="pnCanvas" width="${PN_W}" height="${PN_H}"></canvas><canvas id="pnOnion" width="${PN_W}" height="${PN_H}" aria-hidden="true"></canvas><canvas id="pnGuide" width="${PN_W}" height="${PN_H}" aria-hidden="true"></canvas><canvas id="pnTmp" class="${a.tool === 'hand' ? 'hand' : ''}" width="${PN_W}" height="${PN_H}" aria-hidden="true"></canvas>
        <div class="sk-grid ${a.grid ? 'on' : ''}"></div></div></div>
    </div>
    ${a.animMode ? paBarHtml() : ''}
    <div class="pn-colors ${a.palFloat && pnCanFloat() ? 'float' : ''}">${pnCanFloat() ? `<div class="pn-grip" title="${a.palFloat ? 'Drag to move the colors' : ''}">${a.palFloat ? '<span class="pn-grip-dots">⠿ Colors</span>' : ''}<button type="button" class="pn-dock" data-pn="palFloat" title="${a.palFloat ? 'Put the colors back under the picture' : 'Float the colors so you can move them anywhere'}">${a.palFloat ? '⇲ Dock' : '⇱ Float'}</button></div>` : ''}<div class="pn-cur" title="Front color (left-click a color) and back color (right-click)"><button type="button" class="pn-c2" style="background:${a.color2}" data-pn="editColor2" aria-label="Back color"></button><button type="button" class="pn-c1" style="background:${a.color}" data-pn="editColor" aria-label="Front color"></button></div>
      <button type="button" class="pn-more" data-pn="editColor" title="Pick any color (front color). Right-click for the back color.">🎨</button>
      <div class="pn-pal">${PN_PALETTE.map(h => `<button type="button" style="background:${h}" data-pnc="${h}" title="${h}"></button>`).join('')}</div>
      ${custom.length ? `<div class="pn-pal mine">${custom.map(h => `<button type="button" style="background:${h}" data-pnc="${h}" title="${h} (your palette)"></button>`).join('')}</div>` : ''}
      <input type="color" id="pnColorIn" value="${a.color}" hidden><input type="color" id="pnColorIn2" value="${a.color2}" hidden></div>
    <div class="pn-status">${a.animMode ? '<span class="pa-ws">🎞️ Animation</span>' : ''}<span id="pnPos">${PN_W} × ${PN_H}</span><span id="pnHint">${esc(PN_TOOLS.find(t => t[0] === a.tool)[1])}</span><span class="muted">Left-click a color for the front color, right-click for the back color.</span></div></div>`;
}

/* ---------- 🎨 the sketchpad's own color picker (opens right beside the color box) ---------- */
function rgb2hsv(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [((h * 60) + 360) % 360, mx ? d / mx : 0, mx]; }
function hsv2rgb(h, s, v) { const f = n => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return [f(5), f(3), f(1)].map(x => Math.round(x * 255)); }
const pk = { which: 1, h: 0, s: 0, v: 0, old: '#000000', el: null };
function pnPickerOpen(which, anchor) {
  pnPickerClose(true); const a = pnA(); pk.which = which; pk.old = which === 2 ? a.color2 : a.color; [pk.h, pk.s, pk.v] = rgb2hsv(...hex2rgb(pk.old));
  const el = document.createElement('div'); el.className = 'pn-picker'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', which === 2 ? 'Back color' : 'Front color');
  el.innerHTML = `<div class="pk-head"><b>${which === 2 ? '🎨 Back color' : '🎨 Front color'}</b><button type="button" class="pk-x" data-pk="cancel" aria-label="Close">✕</button></div>
    <div class="pk-main"><canvas class="pk-sv" width="220" height="150" aria-label="Lightness and strength"></canvas><span class="pk-dot"></span></div>
    <div class="pk-huewrap"><canvas class="pk-hue" width="220" height="14" aria-label="Hue"></canvas><span class="pk-hdot"></span></div>
    ${['R', 'G', 'B'].map((c, i) => `<label class="pk-row"><span class="pk-ch ${c}">${c}</span><input type="range" min="0" max="255" data-pkc="${i}"><input type="number" min="0" max="255" class="pk-num" data-pkn="${i}"></label>`).join('')}
    <div class="pk-row2"><label class="pk-hex">#<input type="text" maxlength="7" spellcheck="false" data-pkhex></label>
      <div class="pk-cmp" title="Old (left) and new (right)"><i class="pk-old" style="background:${pk.old}"></i><i class="pk-new"></i></div></div>
    <div class="pk-btns"><button type="button" class="btn sm" data-pk="add" title="Add this color to the row of your colors">＋ My colors</button><span style="flex:1"></span>
      <button type="button" class="btn sm ghost" data-pk="cancel">Cancel</button><button type="button" class="btn sm primary" data-pk="ok">Use</button></div>`;
  document.body.append(el); pk.el = el;
  // beside the color box (or what was clicked), kept on screen
  const r = (anchor || document.querySelector('.pn-cur') || document.querySelector('.pn'))?.getBoundingClientRect() || { left: 20, top: 20, right: 20, bottom: 20 };
  const w = el.offsetWidth, h = el.offsetHeight; let x = r.left, y = r.top - h - 10;   // just above the color box, so the palette stays visible
  if (y < 8) { y = r.bottom + 10; if (y + h > window.innerHeight - 8) { x = r.right + 10; y = r.top + r.height / 2 - h / 2; if (x + w > window.innerWidth - 8) x = r.left - w - 10; } }
  x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
  el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(Math.max(8, Math.min(window.innerHeight - h - 8, y))) + 'px';
  pkDrawHue(); pkUpdate(true);
  const drag = (cv, fn) => cv.addEventListener('pointerdown', e => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch {} const go = ev => { const rc = cv.getBoundingClientRect(); fn(Math.max(0, Math.min(1, (ev.clientX - rc.left) / rc.width)), Math.max(0, Math.min(1, (ev.clientY - rc.top) / rc.height))); pkUpdate(true); };
    go(e); const mv = ev => go(ev), up = () => { cv.removeEventListener('pointermove', mv); cv.removeEventListener('pointerup', up); }; cv.addEventListener('pointermove', mv); cv.addEventListener('pointerup', up); });
  drag(el.querySelector('.pk-sv'), (x, y) => { pk.s = x; pk.v = 1 - y; });
  drag(el.querySelector('.pk-hue'), x => { pk.h = Math.min(359.9, x * 360); });
  el.querySelector('[data-pkhex]').focus({ preventScroll: true });
}
function pkHex() { return rgb2hex(...hsv2rgb(pk.h, pk.s, pk.v)); }
function pkDrawHue() { const c = pk.el?.querySelector('.pk-hue'); if (!c) return; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, c.width, 0); for (let i = 0; i <= 6; i++) gr.addColorStop(i / 6, `hsl(${i * 60},100%,50%)`); g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height); }
function pkUpdate(live, skip) {   // redraw the square, dots, sliders, hex and preview; live = also paint with it now
  const el = pk.el; if (!el) return; const sv = el.querySelector('.pk-sv'), g = sv.getContext('2d'), W = sv.width, H = sv.height, hex = pkHex(), [r, gg, bb] = hex2rgb(hex);
  g.fillStyle = `hsl(${pk.h},100%,50%)`; g.fillRect(0, 0, W, H);
  const wht = g.createLinearGradient(0, 0, W, 0); wht.addColorStop(0, '#fff'); wht.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = wht; g.fillRect(0, 0, W, H);
  const blk = g.createLinearGradient(0, 0, 0, H); blk.addColorStop(0, 'rgba(0,0,0,0)'); blk.addColorStop(1, '#000'); g.fillStyle = blk; g.fillRect(0, 0, W, H);
  const dot = el.querySelector('.pk-dot'); dot.style.left = pk.s * 100 + '%'; dot.style.top = (1 - pk.v) * 100 + '%'; dot.style.background = hex;
  el.querySelector('.pk-hdot').style.left = pk.h / 360 * 100 + '%';
  [r, gg, bb].forEach((v, i) => { if (skip !== 'r' + i) { el.querySelector(`[data-pkc="${i}"]`).value = v; el.querySelector(`[data-pkn="${i}"]`).value = v; }
    el.querySelector(`[data-pkc="${i}"]`).style.setProperty('--track', `linear-gradient(90deg, ${rgb2hex(...[r, gg, bb].map((x, k) => k === i ? 0 : x))}, ${rgb2hex(...[r, gg, bb].map((x, k) => k === i ? 255 : x))})`); });
  if (skip !== 'hex') el.querySelector('[data-pkhex]').value = hex.slice(1).toUpperCase();
  el.querySelector('.pk-new').style.background = hex;
  if (live) (pk.which === 2 ? pnSetColor2 : pnSetColor)(hex);
}
function pnPickerClose(keep) {
  if (!pk.el) return; if (!keep) (pk.which === 2 ? pnSetColor2 : pnSetColor)(pk.old);   // Cancel puts the old color back
  pk.el.remove(); pk.el = null;
}
document.addEventListener('click', e => {
  if (pk.el && !pk.el.contains(e.target) && !e.target.closest('[data-pn="editColor"], [data-pn="editColor2"]')) { pnPickerClose(true); return; }
  const b = e.target.closest?.('[data-pk]'); if (!b || !pk.el) return;
  if (b.dataset.pk === 'cancel') pnPickerClose(false);
  else if (b.dataset.pk === 'ok') pnPickerClose(true);
  else if (b.dataset.pk === 'add') { const a = pnA(), h = pkHex(); a.swatches = [h, ...(a.swatches || []).filter(x => x.toLowerCase() !== h.toLowerCase())].slice(0, 14); artSave(); toast(`＋ ${h} added to your colors`); const keep = { ...pk, el: null }; pk.el.remove(); pk.el = null; render(); }
});
document.addEventListener('input', e => {
  if (!pk.el || !pk.el.contains(e.target)) return; const t = e.target;
  if (t.dataset.pkc != null || t.dataset.pkn != null) { const i = +(t.dataset.pkc ?? t.dataset.pkn), rgb = [0, 1, 2].map(k => +pk.el.querySelector(`[data-pkc="${k}"]`).value); rgb[i] = Math.max(0, Math.min(255, Math.round(+t.value || 0)));
    pk.el.querySelector(`[data-pkc="${i}"]`).value = rgb[i]; if (t.dataset.pkn == null) pk.el.querySelector(`[data-pkn="${i}"]`).value = rgb[i];
    const [h, s, v] = rgb2hsv(...rgb); if (s > 0 && v > 0) pk.h = h; pk.s = s; pk.v = v; pkUpdate(true, t.dataset.pkn != null ? 'r' + i : null); }
  if (t.dataset.pkhex != null) { const v = t.value.replace('#', '').trim(); const full = /^[0-9a-f]{3}$/i.test(v) ? v.split('').map(c => c + c).join('') : v;
    if (/^[0-9a-f]{6}$/i.test(full)) { const [h, s, vv] = rgb2hsv(...hex2rgb('#' + full)); if (s > 0 && vv > 0) pk.h = h; pk.s = s; pk.v = vv; pkUpdate(true, 'hex'); t.classList.remove('bad'); } else t.classList.add('bad'); }
});
document.addEventListener('keydown', e => { if (!pk.el) return; if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); pnPickerClose(false); } else if (e.key === 'Enter' && pk.el.contains(e.target)) { e.preventDefault(); pnPickerClose(true); } }, true);
window.addEventListener('resize', () => pnPickerClose(true));

/* ---------- 📐 canvas size ---------- */
function pnSizeDialog(fresh) {
  pnSize(); const a = pnA();
  openDialog({ title: fresh ? '🗒️ New picture' : '📐 Canvas size', ok: fresh ? 'Make it' : 'Change size', wide: true,
    body: `<div class="pn-presets">${PN_PRESETS.map(([n, w, h]) => `<button type="button" class="pn-preset ${w === PN_W && h === PN_H ? 'on' : ''}" data-w="${w}" data-h="${h}"><span class="pn-shape" style="aspect-ratio:${w}/${h}"></span><b>${n}</b><span class="muted small">${w} × ${h}</span></button>`).join('')}</div>
      <div class="grid2" style="margin-top:10px"><label class="field">Width (pixels)<input name="w" type="number" min="16" max="${PN_MAX}" value="${PN_W}" required></label><label class="field">Height (pixels)<input name="h" type="number" min="16" max="${PN_MAX}" value="${PN_H}" required></label></div>
      <label class="check"><input type="checkbox" name="lock"><span>Keep the shape (change both together)</span></label>
      ${fresh ? '' : `<div class="field">Your drawing<div class="row" style="gap:12px;flex-wrap:wrap;margin-top:4px">${[['keep', 'Keep it as is (crop or add space)'], ['center', 'Keep it in the middle'], ['stretch', 'Stretch it to fit']].map(([k, l], i) => `<label class="row small" style="gap:4px"><input type="radio" name="mode" value="${k}" ${i ? '' : 'checked'}> ${l}</label>`).join('')}</div></div>`}
      <p class="muted small" style="margin:6px 0 0">From 16 to ${PN_MAX} pixels on each side. Very big pictures keep fewer undo steps.</p>`,
    onOpen: dlg => { const f = dlg.querySelector('form'); let ratio = PN_W / PN_H;
      dlg.querySelectorAll('.pn-preset').forEach(b => b.onclick = () => { f.w.value = b.dataset.w; f.h.value = b.dataset.h; ratio = b.dataset.w / b.dataset.h; dlg.querySelectorAll('.pn-preset').forEach(x => x.classList.toggle('on', x === b)); });
      f.w.oninput = () => { if (f.lock.checked) f.h.value = Math.round(f.w.value / ratio) || ''; else ratio = f.w.value / f.h.value || ratio; };
      f.h.oninput = () => { if (f.lock.checked) f.w.value = Math.round(f.h.value * ratio) || ''; else ratio = f.w.value / f.h.value || ratio; }; },
    onOk: f => { const w = Math.round(+f.w.value), h = Math.round(+f.h.value);
      if (!(w >= 16 && h >= 16 && w <= PN_MAX && h <= PN_MAX)) { toast(`Use a size from 16 to ${PN_MAX} pixels`); return false; }
      pnResize(w, h, fresh ? 'blank' : (f.mode?.value || 'keep')); } });
}
function pnResize(w, h, mode) {   // new size; the old picture is kept for Undo
  pnDropSel(); const a = pnA(), old = document.createElement('canvas'); old.width = PN_W; old.height = PN_H; old.getContext('2d').drawImage(pn.cv, 0, 0);
  const before = { cw: PN_W, ch: PN_H, url: old.toDataURL('image/png') };
  a.cw = w; a.ch = h; PN_W = w; PN_H = h;
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  if (mode === 'keep') g.drawImage(old, 0, 0); else if (mode === 'center') g.drawImage(old, Math.round((w - old.width) / 2), Math.round((h - old.height) / 2)); else if (mode === 'stretch') g.drawImage(old, 0, 0, w, h);
  if (a.animMode) {   // every frame gets the same change
    paKeep(); const ow = old.width, oh = old.height;
    pa.frames = pa.frames.map(f => { const n = document.createElement('canvas'); n.width = w; n.height = h; const ng = n.getContext('2d'); ng.fillStyle = '#fff'; ng.fillRect(0, 0, w, h);
      if (mode === 'keep') ng.drawImage(f, 0, 0); else if (mode === 'center') ng.drawImage(f, Math.round((w - ow) / 2), Math.round((h - oh) / 2)); else if (mode === 'stretch') ng.drawImage(f, 0, 0, w, h); return n; });
    if (mode === 'blank') { pa.frames = [pa.frames[0]]; pa.i = 0; } paPersist();
  } else a.drawing = c.toDataURL('image/png');
  pn.undo = []; pn.redo = []; pn.zoom = 1; artSave(); render();
  toast(`📐 ${w} × ${h}`);
  if (typeof undoToast === 'function' && !a.animMode) undoToast(`📐 Canvas is now ${w} × ${h}`, () => { a.cw = before.cw; a.ch = before.ch; a.drawing = before.url; artSave(); render(); });
}
/* ---------- 🎨 the color palette can float anywhere on a big screen ---------- */
const pnCanFloat = () => matchMedia('(min-width: 900px) and (hover: hover)').matches;
function pnPlacePalette() {
  const el = document.querySelector('.pn-colors.float'); if (!el) return; const a = art(), p = a.palPos || { x: window.innerWidth - el.offsetWidth - 40, y: window.innerHeight - el.offsetHeight - 40 };
  const x = Math.max(4, Math.min(window.innerWidth - el.offsetWidth - 4, p.x)), y = Math.max(4, Math.min(window.innerHeight - el.offsetHeight - 4, p.y));
  el.style.left = x + 'px'; el.style.top = y + 'px';
}
document.addEventListener('pointerdown', e => {
  const grip = e.target.closest?.('.pn-grip'); if (!grip || e.target.closest('button')) return;
  const el = grip.closest('.pn-colors'), r = el.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top; e.preventDefault(); try { grip.setPointerCapture(e.pointerId); } catch {} el.classList.add('dragging');
  const move = ev => { el.style.left = Math.max(4, Math.min(window.innerWidth - el.offsetWidth - 4, ev.clientX - dx)) + 'px'; el.style.top = Math.max(4, Math.min(window.innerHeight - el.offsetHeight - 4, ev.clientY - dy)) + 'px'; };
  const up = () => { grip.removeEventListener('pointermove', move); grip.removeEventListener('pointerup', up); el.classList.remove('dragging'); art().palPos = { x: parseFloat(el.style.left), y: parseFloat(el.style.top) }; artSave(); };
  grip.addEventListener('pointermove', move); grip.addEventListener('pointerup', up);
});
window.addEventListener('resize', () => { if (view.name === 'art' && art().tab === 'sketch') { pnPlacePalette(); pnApplyZoom(); } });

/* ================= 🎞️ the animation workspace (Workspace › Animation) =================
   Every frame is a full picture drawn with all the sketchpad tools. The frame before shows as a faint red
   ghost underneath (onion skin), the next one in blue. Frames are kept on this device. */
const PA_KEY = 'estudiamos.paintAnim';
const pa = { frames: [], i: 0, playing: false, timer: 0, loaded: false, saveT: 0 };
const paOpt = () => { const a = art(); a.pa ||= { fps: 8, loop: true, onion: 1, next: false }; return a.pa; };
const paMax = () => Math.max(8, Math.min(120, Math.floor(300e6 / (PN_W * PN_H * 4))));   // big pictures allow fewer frames (memory)
function paBlank() { const c = document.createElement('canvas'); c.width = PN_W; c.height = PN_H; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, PN_W, PN_H); return c; }
function paLoad(done) {
  if (pa.loaded) { done?.(); return; } pa.loaded = true;
  let saved = null; try { saved = JSON.parse(localStorage.getItem(PA_KEY) || 'null'); } catch {}
  if (!saved?.frames?.length) { const c = paBlank(); if (pn.cv) c.getContext('2d').drawImage(pn.cv, 0, 0); pa.frames = [c]; pa.i = 0; done?.(); return; }   // start from the picture on screen
  pa.frames = saved.frames.map(() => paBlank()); pa.i = Math.min(saved.i || 0, pa.frames.length - 1); let left = saved.frames.length;
  saved.frames.forEach((url, k) => { const img = new Image(); img.onload = img.onerror = () => { try { pa.frames[k].getContext('2d').drawImage(img, 0, 0); } catch {} if (--left === 0) done?.(); }; img.src = url; });
}
function paPersist() {
  clearTimeout(pa.saveT); pa.saveT = setTimeout(() => {
    try { localStorage.setItem(PA_KEY, JSON.stringify({ w: PN_W, h: PN_H, i: pa.i, frames: pa.frames.map(c => c.toDataURL('image/png')) })); }
    catch { if (!paPersist.warned) { paPersist.warned = true; toast('This animation is too big to keep on this device. Save it as a video to keep it.'); } }
  }, 700);
}
function paKeep() { const f = pa.frames[pa.i]; if (f && pn.cv) { f.getContext('2d').drawImage(pn.cv, 0, 0); paThumb(pa.i); } }   // the canvas → this frame
function paGhost(src, col) {   // a frame's lines (not its white paper) in one color, for onion skin
  const c = document.createElement('canvas'); c.width = PN_W; c.height = PN_H; const g = c.getContext('2d'); g.drawImage(src, 0, 0);
  const img = g.getImageData(0, 0, PN_W, PN_H), d = img.data, [r, gg, bb] = hex2rgb(col);
  for (let i = 0; i < d.length; i += 4) { const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; if (lum > 235) d[i + 3] = 0; else { d[i] = r; d[i + 1] = gg; d[i + 2] = bb; d[i + 3] = 255; } }
  g.putImageData(img, 0, 0); return c;
}
function paOnion() {
  const oc = document.getElementById('pnOnion'); if (!oc) return; const g = oc.getContext('2d'), o = paOpt(); g.clearRect(0, 0, PN_W, PN_H);
  if (!art().animMode || pa.playing) return;
  for (let k = +o.onion; k >= 1; k--) { const f = pa.frames[pa.i - k]; if (f) { g.globalAlpha = k === 1 ? 0.32 : 0.15; g.drawImage(paGhost(f, '#e8132f'), 0, 0); } }
  if (o.next && pa.frames[pa.i + 1]) { g.globalAlpha = 0.25; g.drawImage(paGhost(pa.frames[pa.i + 1], '#1f5fd6'), 0, 0); }
  g.globalAlpha = 1;
}
function paShow(i) {   // go to frame i
  if (pa.playing) paStop();
  paKeep(); pnDropSel(); pa.i = Math.max(0, Math.min(pa.frames.length - 1, i));
  pn.ctx.drawImage(pa.frames[pa.i], 0, 0); pn.undo = []; pn.redo = []; pnHistBtns(); paOnion(); paStripMark(); paPersist(); paBtns();
}
function paBarHtml() {
  const o = paOpt(), n = pa.frames.length || 1;
  return `<div class="pa-bar">
      <button type="button" class="btn sm ${pa.playing ? '' : 'primary'}" data-pa="play" title="Play (Space)">${pa.playing ? '⏹ Stop' : '▶ Play'}</button>
      <button type="button" class="btn sm" data-pa="prev" title="Previous frame (←)">◀</button><span class="pa-count" id="paCount">${pa.i + 1} / ${n}</span><button type="button" class="btn sm" data-pa="next" title="Next frame (→)">▶</button>
      <button type="button" class="btn sm" data-pa="add" title="Add a blank frame after this one">＋ Frame</button>
      <button type="button" class="btn sm" data-pa="dup" title="Add a copy of this frame after it">⧉ Copy</button>
      <button type="button" class="btn sm ghost" data-pa="moveL" title="Move this frame earlier">⇠</button><button type="button" class="btn sm ghost" data-pa="moveR" title="Move this frame later">⇢</button>
      <button type="button" class="btn sm ghost" data-pa="del" title="Delete this frame">🗑️</button>
      <label class="sk-ctl">Speed <input type="range" min="1" max="24" value="${o.fps}" data-pao="fps"><b data-pav="fps">${o.fps}</b> fps</label>
      <label class="row small" style="gap:4px"><input type="checkbox" data-pao="loop" ${o.loop ? 'checked' : ''}> Loop</label>
      <label class="sk-ctl">Onion skin <select class="inp" data-pao="onion" style="margin:0;width:auto;padding:2px 6px">${[[0, 'Off'], [1, '1 back'], [2, '2 back']].map(([v, l]) => `<option value="${v}" ${+o.onion === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="row small" style="gap:4px"><input type="checkbox" data-pao="next" ${o.next ? 'checked' : ''}> Next frame</label>
      <span style="flex:1"></span>
      <button type="button" class="btn sm" data-pa="video">🎬 Save video</button><button type="button" class="btn sm" data-pa="strip">🖼️ Save frames</button>
      <button type="button" class="btn sm ghost" data-pa="newAnim" title="Start a new animation">🗒️ New</button></div>
    <div class="pa-strip" id="paStrip"></div>`;
}
function paStrip() {
  const box = document.getElementById('paStrip'); if (!box) return; const tw = 96, th = Math.max(24, Math.round(96 * PN_H / PN_W));
  box.innerHTML = pa.frames.map((f, k) => `<button type="button" class="pa-thumb ${k === pa.i ? 'on' : ''}" data-pa="go" data-i="${k}" draggable="true" title="Frame ${k + 1} (drag to move)"><canvas width="${tw}" height="${th}" data-pathumb="${k}"></canvas><span>${k + 1}</span></button>`).join('')
    + (pa.frames.length < paMax() ? `<button type="button" class="pa-thumb add" data-pa="add" title="Add a frame">＋</button>` : '');
  box.querySelectorAll('[data-pathumb]').forEach(c => c.getContext('2d').drawImage(pa.frames[+c.dataset.pathumb], 0, 0, c.width, c.height));
  paStripMark(); paBtns();
}
function paThumb(k) { const c = document.querySelector(`[data-pathumb="${k}"]`); if (c) { const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.drawImage(pa.frames[k], 0, 0, c.width, c.height); } }
function paStripMark() { document.querySelectorAll('.pa-thumb[data-i]').forEach(t => t.classList.toggle('on', +t.dataset.i === pa.i)); document.querySelector('.pa-thumb.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); const c = document.getElementById('paCount'); if (c) c.textContent = `${pa.i + 1} / ${pa.frames.length}`; }
function paBtns() { const n = pa.frames.length, set = (k, on) => document.querySelectorAll(`[data-pa="${k}"]`).forEach(b => b.disabled = !on);
  set('moveL', pa.i > 0); set('moveR', pa.i < n - 1); set('del', n > 1); set('add', n < paMax()); set('dup', n < paMax()); set('prev', pa.i > 0); set('next', pa.i < n - 1); }
function paPlay() {
  paKeep(); if (pa.frames.length < 2) { toast('Add at least 2 frames to play'); return; }
  pnDropSel(); pa.playing = true; pa.playFrom = pa.i; pa.i = 0; pn.ctx.drawImage(pa.frames[0], 0, 0); paOnion(); paStripMark(); paPlayBtn();
  const tick = () => { if (!pa.playing || view.name !== 'art' || art().tab !== 'sketch') { paStop(); return; }
    let n = pa.i + 1; if (n >= pa.frames.length) { if (!paOpt().loop) { paStop(); return; } n = 0; }
    pa.i = n; pn.ctx.drawImage(pa.frames[n], 0, 0); paStripMark(); pa.timer = setTimeout(tick, 1000 / paOpt().fps); };
  pa.timer = setTimeout(tick, 1000 / paOpt().fps);
}
function paStop() { if (!pa.playing) return; pa.playing = false; clearTimeout(pa.timer); pa.i = Math.min(pa.playFrom ?? 0, pa.frames.length - 1); if (pn.cv) pn.ctx.drawImage(pa.frames[pa.i], 0, 0); paOnion(); paStripMark(); paPlayBtn(); }
const paPlayBtn = () => document.querySelectorAll('[data-pa="play"]').forEach(b => { b.textContent = pa.playing ? '⏹ Stop' : '▶ Play'; b.classList.toggle('primary', !pa.playing); });
async function paVideo() {
  paKeep(); if (pa.frames.length < 2) { toast('Add at least 2 frames first'); return; }
  const o = paOpt(), sc = Math.min(1, 1280 / PN_W, 1280 / PN_H), c = document.createElement('canvas'); c.width = Math.round(PN_W * sc / 2) * 2; c.height = Math.round(PN_H * sc / 2) * 2; const g = c.getContext('2d');
  const type = typeof MediaRecorder !== 'undefined' && c.captureStream ? ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(t => MediaRecorder.isTypeSupported?.(t)) : null;
  if (!type) { toast('This browser can’t make videos. Use “Save frames” instead.'); return; }
  const rec = new MediaRecorder(c.captureStream(o.fps), { mimeType: type }), parts = []; rec.ondataavailable = e => e.data.size && parts.push(e.data); const done = new Promise(r => rec.onstop = r);
  const draw = k => g.drawImage(pa.frames[k], 0, 0, c.width, c.height); toast('🎬 Making your video…'); draw(0); rec.start();
  const loops = o.loop ? Math.max(1, Math.ceil(3 * o.fps / pa.frames.length)) : 1;
  for (let l = 0; l < loops; l++) for (let k = 0; k < pa.frames.length; k++) { draw(k); await new Promise(r => setTimeout(r, 1000 / o.fps)); }
  rec.stop(); await done;
  const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob(parts, { type: type.split(';')[0] })); l.download = `My animation.${type.includes('mp4') ? 'mp4' : 'webm'}`; l.click(); setTimeout(() => URL.revokeObjectURL(l.href), 4000);
}
function paStripSave() {
  paKeep(); const n = pa.frames.length, cols = Math.min(6, n), rows = Math.ceil(n / cols), sc = Math.min(0.5, 320 / PN_W), fw = PN_W * sc, fh = PN_H * sc, c = document.createElement('canvas'); c.width = cols * fw; c.height = rows * fh;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  pa.frames.forEach((f, k) => { const x = (k % cols) * fw, y = Math.floor(k / cols) * fh; g.drawImage(f, x, y, fw, fh); g.strokeStyle = '#ccc'; g.strokeRect(x + .5, y + .5, fw - 1, fh - 1); g.fillStyle = '#999'; g.font = '12px system-ui'; g.fillText(k + 1, x + 6, y + 16); });
  const l = document.createElement('a'); l.href = c.toDataURL('image/png'); l.download = 'My animation frames.png'; l.click();
}
function paSetMode(on) {   // switch workspaces (each keeps its own picture)
  const a = pnA(); if (!!a.animMode === on) return;
  if (on) { pnStoreNow(); a.animMode = true; artSave(); pa.loaded = false; pa.frames = []; render(); }
  else { paKeep(); paPersist(); if (pa.playing) paStop(); a.animMode = false; artSave(); render(); }
}
function pnStoreNow() { if (!pn.cv || art().animMode) return; try { const url = pn.cv.toDataURL('image/png'); art().drawing = url.length > 6e6 ? null : url; artSave(); } catch {} }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-pa]'); if (!b || view.name !== 'art' || !art().animMode) return;
  switch (b.dataset.pa) {
    case 'play': return pa.playing ? paStop() : paPlay();
    case 'prev': return paShow(pa.i - 1);
    case 'next': return paShow(pa.i + 1);
    case 'go': return paShow(+b.dataset.i);
    case 'add': case 'dup': { if (pa.frames.length >= paMax()) { toast(`That’s the most frames for a picture this size (${paMax()})`); return; } paKeep(); const f = paBlank(); if (b.dataset.pa === 'dup') f.getContext('2d').drawImage(pa.frames[pa.i], 0, 0);
      pa.frames.splice(pa.i + 1, 0, f); paStrip(); return paShow(pa.i + 1); }
    case 'del': { if (pa.frames.length < 2) return; paKeep(); const at = pa.i, [gone] = pa.frames.splice(at, 1); pa.i = Math.min(at, pa.frames.length - 1); pn.ctx.drawImage(pa.frames[pa.i], 0, 0); paStrip(); paOnion(); paPersist();
      if (typeof undoToast === 'function') undoToast(`Frame ${at + 1} deleted`, () => { paKeep(); pa.frames.splice(at, 0, gone); pa.i = at; pn.ctx.drawImage(gone, 0, 0); paStrip(); paOnion(); paPersist(); }); return; }
    case 'moveL': case 'moveR': { paKeep(); const j = pa.i + (b.dataset.pa === 'moveL' ? -1 : 1); if (j < 0 || j >= pa.frames.length) return; [pa.frames[pa.i], pa.frames[j]] = [pa.frames[j], pa.frames[pa.i]]; pa.i = j; paStrip(); paOnion(); paPersist(); return; }
    case 'video': return paVideo();
    case 'strip': return paStripSave();
    case 'newAnim': { if (!confirm('Start a new animation? (Save this one as a video first if you want to keep it.)')) return; paKeep(); const keep = pa.frames, ki = pa.i; pa.frames = [paBlank()]; pa.i = 0; pn.ctx.drawImage(pa.frames[0], 0, 0); pn.undo = []; paStrip(); paOnion(); paPersist();
      if (typeof undoToast === 'function') undoToast('New animation', () => { pa.frames = keep; pa.i = ki; pn.ctx.drawImage(keep[ki], 0, 0); paStrip(); paOnion(); paPersist(); }); return; }
  }
});
document.addEventListener('input', e => { const k = e.target.dataset?.pao; if (k !== 'fps' || view.name !== 'art') return; paOpt().fps = +e.target.value; const v = document.querySelector('[data-pav="fps"]'); if (v) v.textContent = e.target.value; artSave(); });
document.addEventListener('change', e => { const k = e.target.dataset?.pao; if (!k || k === 'fps' || view.name !== 'art') return; const o = paOpt(); o[k] = e.target.type === 'checkbox' ? e.target.checked : +e.target.value; artSave(); paOnion(); });
/* drag a frame in the strip onto another to move it */
document.addEventListener('dragstart', e => { const t = e.target.closest?.('.pa-thumb[data-i]'); if (!t) return; e.dataTransfer.setData('text/x-pa', t.dataset.i); e.dataTransfer.effectAllowed = 'move'; });
document.addEventListener('dragover', e => { const t = e.target.closest?.('.pa-thumb[data-i]'); if (!t || !e.dataTransfer.types.includes('text/x-pa')) return; e.preventDefault(); });
document.addEventListener('drop', e => { const t = e.target.closest?.('.pa-thumb[data-i]'); if (!t || !e.dataTransfer.types.includes('text/x-pa')) return; e.preventDefault();
  const from = +e.dataTransfer.getData('text/x-pa'), to = +t.dataset.i; if (from === to) return; paKeep(); const [f] = pa.frames.splice(from, 1); pa.frames.splice(to, 0, f); pa.i = to; pn.ctx.drawImage(pa.frames[to], 0, 0); paStrip(); paOnion(); paPersist(); });

/* ---------- drawing ---------- */
const pnPos = (cv, e) => { const r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(PN_W - 1, (e.clientX - r.left) * PN_W / r.width)), Math.max(0, Math.min(PN_H - 1, (e.clientY - r.top) * PN_H / r.height))]; };
function pnPush() { try { pn.undo.push(pn.ctx.getImageData(0, 0, PN_W, PN_H)); while (pn.undo.length > pnUndoMax()) pn.undo.shift(); pn.redo = []; } catch {} pnHistBtns(); }
function pnHistBtns() {   // grey out ↩️ / ↪️ when there's nothing to undo or redo
  document.querySelectorAll('.pn-hist [data-pn="undo"]').forEach(x => x.disabled = !pn.undo.length);
  document.querySelectorAll('.pn-hist [data-pn="redo"]').forEach(x => x.disabled = !pn.redo.length);
}
function pnStore() { if (art().animMode) { paKeep(); paPersist(); return; } clearTimeout(pnStore.t); pnStore.t = setTimeout(() => { try { const url = pn.cv.toDataURL('image/png');
  if (url.length > 6e6) { art().drawing = null; if (!pnStore.warned) { pnStore.warned = true; toast('This picture is too big to keep between visits. Use File › Save picture to keep it.'); } } else art().drawing = url; artSave(); } catch {} }, 500); }
function pnMirrorPts(x, y) {
  const sym = art().sym, cx = PN_W / 2, cy = PN_H / 2, out = [[x, y]];
  if (sym === 'v') out.push([PN_W - x, y]);
  else if (sym === 'quad') out.push([PN_W - x, y], [x, PN_H - y], [PN_W - x, PN_H - y]);
  else if (sym === 'r6' || sym === 'r8') { const n = sym === 'r6' ? 6 : 8, dx = x - cx, dy = y - cy; for (let i = 1; i < n; i++) { const t = i * 2 * Math.PI / n; out.push([cx + dx * Math.cos(t) - dy * Math.sin(t), cy + dx * Math.sin(t) + dy * Math.cos(t)]); } }
  return out;
}
function pnFree(x0, y0, x1, y1, btn) {   // pencil / brush / eraser
  const a = pnA(), g = pn.ctx, col = btn === 2 ? a.color2 : a.color, A = pnMirrorPts(x0, y0), B = pnMirrorPts(x1, y1);
  g.save(); g.lineCap = g.lineJoin = 'round';
  if (a.tool === 'eraser') { g.strokeStyle = a.color2; g.lineWidth = a.eraserSize || 8; g.lineCap = 'square'; }
  else if (a.tool === 'pencil') { g.strokeStyle = col; g.lineWidth = a.lineW || 2; }
  else { g.strokeStyle = col; g.lineWidth = a.brushSize || 8; }
  g.globalAlpha = (a.alpha ?? 100) / 100;
  for (let i = 0; i < A.length; i++) { g.beginPath(); g.moveTo(A[i][0], A[i][1]); g.lineTo(B[i][0], B[i][1]); g.stroke(); }
  g.restore();
}
function pnSpray(x, y, btn) {
  const a = pnA(), g = pn.ctx, r = a.spraySize || 16; g.fillStyle = btn === 2 ? a.color2 : a.color;
  for (const [px, py] of pnMirrorPts(x, y)) for (let i = 0; i < r * 1.2; i++) { const t = Math.random() * 6.283, d = Math.sqrt(Math.random()) * r; g.fillRect(px + Math.cos(t) * d, py + Math.sin(t) * d, 1.3, 1.3); }
}
function pnShape(g, kind, x0, y0, x1, y1, ctrl, btn) {   // line, curve, rectangle, ellipse, rounded rectangle
  const a = pnA(), fg = btn === 2 ? a.color2 : a.color, bg = btn === 2 ? a.color : a.color2, w = a.lineW || 3, st = a.fillStyle;
  g.save(); g.lineWidth = w; g.strokeStyle = fg; g.fillStyle = bg; g.lineCap = 'round'; g.lineJoin = 'round';
  const x = Math.min(x0, x1), y = Math.min(y0, y1), W = Math.abs(x1 - x0), H = Math.abs(y1 - y0);
  g.beginPath();
  if (kind === 'line') { g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.restore(); return; }
  if (kind === 'curve') { g.moveTo(x0, y0); ctrl ? g.quadraticCurveTo(ctrl[0], ctrl[1], x1, y1) : g.lineTo(x1, y1); g.stroke(); g.restore(); return; }
  if (kind === 'rect') g.rect(x, y, W, H);
  else if (kind === 'ellipse') g.ellipse(x + W / 2, y + H / 2, W / 2 || 0.5, H / 2 || 0.5, 0, 0, 7);
  else if (kind === 'round') { const r = Math.min(24, W / 4, H / 4); g.roundRect ? g.roundRect(x, y, W, H, r) : g.rect(x, y, W, H); }
  if (st !== 'outline') g.fill(); if (st !== 'fill') g.stroke();
  g.restore();
}
function pnPolyDraw(g, pts, closed, btn) {
  const a = pnA(); if (pts.length < 2) return; g.save(); g.lineWidth = a.lineW || 3; g.strokeStyle = btn === 2 ? a.color2 : a.color; g.fillStyle = btn === 2 ? a.color : a.color2; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(...pts[0]); for (const p of pts.slice(1)) g.lineTo(...p); if (closed) { g.closePath(); if (a.fillStyle !== 'outline') g.fill(); } if (!closed || a.fillStyle !== 'fill') g.stroke(); g.restore();
}
function pnTmpClear() { const t = pn.tmp?.getContext('2d'); t?.clearRect(0, 0, PN_W, PN_H); return t; }
function pnDrawSel() {   // the dashed box around a selection (and the piece being moved)
  const t = pnTmpClear(); if (!t || !pn.sel) return; const s = pn.sel;
  if (s.img) t.putImageData(s.img, s.x, s.y);
  t.save(); t.setLineDash([6, 4]); t.strokeStyle = '#000'; t.lineWidth = 1.5; t.strokeRect(s.x + .5, s.y + .5, s.w, s.h); t.strokeStyle = '#fff'; t.lineDashOffset = 5; t.strokeRect(s.x + .5, s.y + .5, s.w, s.h); t.restore();
}
function pnDropSel() { const s = pn.sel; if (!s) return; if (s.img && s.moved) { pn.ctx.putImageData(s.img, s.x, s.y); pnStore(); } pn.sel = null; pnTmpClear(); pnRefreshOpts(); }
function pnRefreshOpts() { const o = document.getElementById('pnOpts'); if (o) o.innerHTML = pnOptionsHtml(); }
function paintMount() {
  pnPickerClose(true);
  const cv = document.getElementById('pnCanvas'); if (!cv) return;
  pn.cv = cv; pn.ctx = cv.getContext('2d', { willReadFrequently: true }); pn.tmp = document.getElementById('pnTmp'); pn.sel = null; pn.poly = null; pn.curve = null;
  const a = pnA();
  pn.ctx.fillStyle = '#fff'; pn.ctx.fillRect(0, 0, PN_W, PN_H);
  if (a.animMode) paLoad(() => { pn.ctx.drawImage(pa.frames[pa.i], 0, 0); paStrip(); paOnion(); });
  else if (a.drawing) { const img = new Image(); img.onload = () => pn.ctx.drawImage(img, 0, 0); img.src = a.drawing; }
  pnDrawGuide(); pnApplyZoom();
  if (a.palFloat) pnPlacePalette();
  const top = pn.tmp;   // events land on the top layer
  top.addEventListener('contextmenu', e => e.preventDefault());
  top.addEventListener('pointerdown', e => {
    e.preventDefault(); try { top.setPointerCapture(e.pointerId); } catch {} const [x, y] = pnPos(top, e), a = pnA(), btn = e.button === 2 ? 2 : 0; pn.btn = btn;
    if (a.tool === 'picker') { const d = pn.ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data, h = rgb2hex(d[0], d[1], d[2]); btn === 2 ? pnSetColor2(h) : pnSetColor(h); return; }
    if (a.tool === 'zoom') { pn.zoom = btn === 2 || e.altKey ? Math.max(1, pn.zoom / 2) : Math.min(8, pn.zoom * 2); pnApplyZoom(x, y); return; }
    if (a.tool === 'hand' || e.button === 1) { const w = document.getElementById('pnWork'); pn.down = 'pan'; pn.pan = { x: e.clientX, y: e.clientY, sl: w.scrollLeft, st: w.scrollTop }; top.classList.add('grabbing');   // ✋ (or the middle mouse button)
      if (w.scrollWidth <= w.clientWidth + 1 && w.scrollHeight <= w.clientHeight + 1) { const h = document.getElementById('pnHint'); if (h) h.textContent = 'The whole picture fits: zoom in (🔍) to move around it'; } return; }
    if (a.tool === 'text') { const s = prompt('Type your text', ''); if (!s) return; pnPush(); const g = pn.ctx, size = a.textSize || 24; g.save(); g.fillStyle = btn === 2 ? a.color2 : a.color; g.font = `${size}px system-ui, sans-serif`; g.textBaseline = 'top'; s.split('\n').forEach((ln, i) => g.fillText(ln, x, y + i * size * 1.2)); g.restore(); pnStore(); return; }
    if (a.tool === 'fill') { pnPush(); const keep = a.color; if (btn === 2) a.color = a.color2; skpFillAt(Math.round(x), Math.round(y)); a.color = keep; pnStore(); return; }
    if (a.tool === 'select') {
      if (pn.sel && x >= pn.sel.x && x <= pn.sel.x + pn.sel.w && y >= pn.sel.y && y <= pn.sel.y + pn.sel.h) {   // pick it up to move
        if (!pn.sel.img) { pnPush(); pn.sel.img = pn.ctx.getImageData(pn.sel.x, pn.sel.y, pn.sel.w, pn.sel.h); pn.ctx.save(); pn.ctx.fillStyle = a.color2; pn.ctx.fillRect(pn.sel.x, pn.sel.y, pn.sel.w, pn.sel.h); pn.ctx.restore(); }
        pn.down = 'move'; pn.start = [x - pn.sel.x, y - pn.sel.y]; return; }
      pnDropSel(); pn.down = 'sel'; pn.start = [x, y]; return;
    }
    if (a.tool === 'poly') {
      if (!pn.poly) { pnPush(); pn.poly = [[x, y]]; }
      else { const [sx, sy] = pn.poly[0]; if (Math.hypot(x - sx, y - sy) < 12 && pn.poly.length > 2 || e.detail >= 2) { pnPolyDraw(pn.ctx, pn.poly, true, btn); pn.poly = null; pnTmpClear(); pnStore(); return; } pn.poly.push([x, y]); }
      const t = pnTmpClear(); pnPolyDraw(t, [...pn.poly, [x, y]], false, btn); return;
    }
    if (a.tool === 'curve' && pn.curve) { pn.down = 'bend'; pn.curve.ctrl = [x, y]; const t = pnTmpClear(); pnShape(t, 'curve', ...pn.curve.p0, ...pn.curve.p1, pn.curve.ctrl, btn); return; }
    pnPush(); pn.down = true; pn.start = [x, y]; pn.last = [x, y];
    if (a.tool === 'spray') { pnSpray(x, y, btn); clearInterval(pn.sprayT); pn.sprayT = setInterval(() => pn.down && pnSpray(...pn.last, btn), 40); }
    else if (['pencil', 'brush', 'eraser'].includes(a.tool)) pnFree(x, y, x + .01, y + .01, btn);
  });
  top.addEventListener('pointermove', e => {
    const [x, y] = pnPos(top, e), a = pnA(); const st = document.getElementById('pnPos'); if (st) st.textContent = `${Math.round(x)}, ${Math.round(y)}`;
    if (a.tool === 'poly' && pn.poly) { const t = pnTmpClear(); pnPolyDraw(t, [...pn.poly, [x, y]], false, pn.btn); return; }
    if (!pn.down) return;
    if (pn.down === 'pan') { const w = document.getElementById('pnWork'); w.scrollLeft = pn.pan.sl - (e.clientX - pn.pan.x); w.scrollTop = pn.pan.st - (e.clientY - pn.pan.y); return; }
    if (pn.down === 'sel') { const [sx, sy] = pn.start; pn.sel = { x: Math.round(Math.min(sx, x)), y: Math.round(Math.min(sy, y)), w: Math.round(Math.abs(x - sx)), h: Math.round(Math.abs(y - sy)) }; pnDrawSel(); return; }
    if (pn.down === 'move') { pn.sel.x = Math.round(x - pn.start[0]); pn.sel.y = Math.round(y - pn.start[1]); pn.sel.moved = true; pnDrawSel(); return; }
    if (pn.down === 'bend') { pn.curve.ctrl = [x, y]; const t = pnTmpClear(); pnShape(t, 'curve', ...pn.curve.p0, ...pn.curve.p1, pn.curve.ctrl, pn.btn); return; }
    if (['pencil', 'brush', 'eraser'].includes(a.tool)) { pnFree(...pn.last, x, y, pn.btn); pn.last = [x, y]; return; }
    if (a.tool === 'spray') { pn.last = [x, y]; return; }
    let [sx, sy] = pn.start, ex = x, ey = y;
    if (e.shiftKey && ['rect', 'ellipse', 'round'].includes(a.tool)) { const d = Math.max(Math.abs(x - sx), Math.abs(y - sy)); ex = sx + Math.sign(x - sx) * d; ey = sy + Math.sign(y - sy) * d; }   // Shift = square / circle
    const t = pnTmpClear(); pnShape(t, a.tool, sx, sy, ex, ey, null, pn.btn); pn.last = [ex, ey];
  });
  const up = () => {
    const a = pnA(); clearInterval(pn.sprayT);
    if (pn.down === 'pan') { pn.down = false; top.classList.remove('grabbing'); return; }
    if (pn.down === 'sel') { pn.down = false; if (!pn.sel || pn.sel.w < 2 || pn.sel.h < 2) { pn.sel = null; pnTmpClear(); } pnRefreshOpts(); return; }
    if (pn.down === 'move') { pn.down = false; return; }
    if (pn.down === 'bend') { pn.down = false; pnShape(pn.ctx, 'curve', ...pn.curve.p0, ...pn.curve.p1, pn.curve.ctrl, pn.btn); pn.curve = null; pnTmpClear(); pnStore(); return; }
    if (!pn.down) return; pn.down = false;
    if (['line', 'rect', 'ellipse', 'round'].includes(a.tool)) { pnTmpClear(); pnShape(pn.ctx, a.tool, ...pn.start, ...pn.last, null, pn.btn); }
    if (a.tool === 'curve') { pn.curve = { p0: pn.start, p1: pn.last }; const t = pnTmpClear(); pnShape(t, 'curve', ...pn.start, ...pn.last, null, pn.btn); document.getElementById('pnHint').textContent = 'Now drag to bend the curve'; pn.undo.pop(); pnPush(); return; }
    pnStore();
  };
  top.addEventListener('pointerup', up); top.addEventListener('pointercancel', up);
  top.addEventListener('pointerleave', () => { const st = document.getElementById('pnPos'); if (st) st.textContent = `${PN_W} × ${PN_H}`; });
}
function skpFillAt(x, y) {   // paint bucket: fill the area of similar color
  const g = pn.ctx, W = PN_W, H = PN_H, img = g.getImageData(0, 0, W, H), d = img.data, i0 = (y * W + x) * 4, t = [d[i0], d[i0 + 1], d[i0 + 2]], [r, gg, bb] = hex2rgb(art().color);
  if (Math.abs(t[0] - r) + Math.abs(t[1] - gg) + Math.abs(t[2] - bb) < 6) return;
  const near = i => Math.abs(d[i] - t[0]) + Math.abs(d[i + 1] - t[1]) + Math.abs(d[i + 2] - t[2]) < 60, seen = new Uint8Array(W * H), st = [x, y];
  while (st.length) { const py = st.pop(), px = st.pop(); if (px < 0 || py < 0 || px >= W || py >= H) continue; const k = py * W + px; if (seen[k]) continue; seen[k] = 1; const i = k * 4; if (!near(i)) continue;
    d[i] = r; d[i + 1] = gg; d[i + 2] = bb; d[i + 3] = 255; st.push(px + 1, py, px - 1, py, px, py + 1, px, py - 1); }
  g.putImageData(img, 0, 0);
}
function pnFitWidth() {   // the widest the whole picture can be while fitting in the gray area
  const work = document.getElementById('pnWork'); if (!work) return 600;
  const maxW = work.clientWidth - 16, maxH = Math.max(240, window.innerHeight * 0.7 - 16);
  return Math.max(60, Math.min(maxW, maxH * PN_W / PN_H, PN_W < 400 ? PN_W * Math.floor(maxW / PN_W) || PN_W : Infinity));
}
function pnApplyZoom(x, y) {
  const page = document.getElementById('pnPage'), work = document.getElementById('pnWork'); if (!page) return;
  page.style.width = Math.round(pnFitWidth() * pn.zoom) + 'px'; pnRefreshOpts();
  if (x != null && work) requestAnimationFrame(() => { work.scrollLeft = x / PN_W * page.clientWidth - work.clientWidth / 2; work.scrollTop = y / PN_H * page.clientHeight - work.clientHeight / 2; });
}
function pnDrawGuide() { const gc = document.getElementById('pnGuide'); if (!gc) return; const g = gc.getContext('2d'); g.clearRect(0, 0, PN_W, PN_H); const a = art(); if (a.guide && a.showGuide !== false) guideDraw(g, PN_W, PN_H, a.guide); }
function pnSetColor(h) { const a = pnA(); a.color = h; document.querySelector('.pn-c1')?.style.setProperty('background', h); const i = document.getElementById('pnColorIn'); if (i) i.value = h; pnRefreshOpts(); artSave(); }
function pnSetColor2(h) { const a = pnA(); a.color2 = h; document.querySelector('.pn-c2')?.style.setProperty('background', h); const i = document.getElementById('pnColorIn2'); if (i) i.value = h; pnRefreshOpts(); artSave(); }
function pnImageOp(fn) { pnDropSel(); pnPush(); const g = pn.ctx, img = g.getImageData(0, 0, PN_W, PN_H); fn(img, g); pnStore(); }
document.addEventListener('click', async e => {
  if (view.name !== 'art' || art().tab !== 'sketch') return;
  const sw = e.target.closest('[data-pnc]'); if (sw) { pnSetColor(sw.dataset.pnc); return; }
  const b = e.target.closest('[data-pn]'); if (!b) return;
  const a = pnA(), k = b.dataset.k; b.closest('details.pn-menu')?.removeAttribute('open');
  switch (b.dataset.pn) {
    case 'tool': pnDropSel(); pn.poly = null; pn.curve = null; pnTmpClear(); a.tool = k; document.getElementById('pnTmp')?.classList.toggle('hand', k === 'hand'); document.querySelectorAll('.pn-tool').forEach(x => { const on = x.dataset.k === k; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      const h = document.getElementById('pnHint'); if (h) h.textContent = PN_TOOLS.find(t => t[0] === k)[1]; pnRefreshOpts(); artSave(); return;
    case 'fillStyle': a.fillStyle = k; pnRefreshOpts(); artSave(); return;
    case 'lineW': a.lineW = +k; pnRefreshOpts(); artSave(); return;
    case 'size': a[a.tool + 'Size'] = +k; pnRefreshOpts(); artSave(); return;
    case 'zoomTo': pn.zoom = +k; pnApplyZoom(PN_W / 2, PN_H / 2); return;
    case 'editColor': return pnPickerOpen(1, b.closest('.pn-cur') ? b.closest('.pn-cur') : document.querySelector('.pn-cur'));
    case 'editColor2': return pnPickerOpen(2, b.closest('.pn-cur') ? b.closest('.pn-cur') : document.querySelector('.pn-cur'));
    case 'swap': { const c1 = a.color; pnSetColor(a.color2); pnSetColor2(c1); return; }
    case 'undo': pnDropSel(); if (!pn.undo.length) return; pn.redo.push(pn.ctx.getImageData(0, 0, PN_W, PN_H)); pn.ctx.putImageData(pn.undo.pop(), 0, 0); pnStore(); pnHistBtns(); return;
    case 'redo': if (!pn.redo.length) return; pn.undo.push(pn.ctx.getImageData(0, 0, PN_W, PN_H)); pn.ctx.putImageData(pn.redo.pop(), 0, 0); pnStore(); pnHistBtns(); return;
    case 'canvasSize': return pnSizeDialog(false);
    case 'new': return pnSizeDialog(true);
    case 'clear': pnDropSel(); pnPush(); pn.ctx.fillStyle = '#fff'; pn.ctx.fillRect(0, 0, PN_W, PN_H); pnStore(); toast('🗒️ A fresh page (↩️ Undo brings the old one back)'); return;
    case 'selAll': a.tool = 'select'; render(); setTimeout(() => { pn.sel = { x: 0, y: 0, w: PN_W, h: PN_H }; pnDrawSel(); pnRefreshOpts(); }, 50); return;
    case 'delSel': if (!pn.sel) return; if (!pn.sel.img) pnPush(); pn.ctx.save(); pn.ctx.fillStyle = a.color2; if (!pn.sel.img) pn.ctx.fillRect(pn.sel.x, pn.sel.y, pn.sel.w, pn.sel.h); pn.ctx.restore(); pn.sel = null; pnTmpClear(); pnStore(); pnRefreshOpts(); return;
    case 'grid': a.grid = !a.grid; artSave(); return render();
    case 'palFloat': a.palFloat = !a.palFloat; artSave(); return render();
    case 'wsDraw': return paSetMode(false);
    case 'wsAnim': return paSetMode(true);
    case 'animTips': if (art().animMode) { paKeep(); paPersist(); } a.tab = 'anim'; artSave(); return render();
    case 'guideT': if (!a.guide) { a.tab = 'guides'; artSave(); return render(); } a.showGuide = a.showGuide === false; artSave(); return render();
    case 'sym': a.sym = k; artSave(); return render();
    case 'flipH': return pnImageOp((img, g) => { const c = document.createElement('canvas'); c.width = PN_W; c.height = PN_H; c.getContext('2d').putImageData(img, 0, 0); g.save(); g.translate(PN_W, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); g.restore(); });
    case 'flipV': return pnImageOp((img, g) => { const c = document.createElement('canvas'); c.width = PN_W; c.height = PN_H; c.getContext('2d').putImageData(img, 0, 0); g.save(); g.translate(0, PN_H); g.scale(1, -1); g.drawImage(c, 0, 0); g.restore(); });
    case 'invert': return pnImageOp((img, g) => { const d = img.data; for (let i = 0; i < d.length; i += 4) { d[i] = 255 - d[i]; d[i + 1] = 255 - d[i + 1]; d[i + 2] = 255 - d[i + 2]; } g.putImageData(img, 0, 0); });
    case 'gray': return pnImageOp((img, g) => { const d = img.data; for (let i = 0; i < d.length; i += 4) { const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; d[i] = d[i + 1] = d[i + 2] = v; } g.putImageData(img, 0, 0); });
    case 'open': { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = () => { const f = inp.files?.[0]; if (!f) return; const img = new Image(); img.onload = () => { pnDropSel(); pnPush(); const g = pn.ctx, sc = Math.min(PN_W / img.width, PN_H / img.height, 1); g.fillStyle = '#fff'; g.fillRect(0, 0, PN_W, PN_H); g.drawImage(img, (PN_W - img.width * sc) / 2, (PN_H - img.height * sc) / 2, img.width * sc, img.height * sc); pnStore(); }; img.src = URL.createObjectURL(f); };
      inp.click(); return; }
    case 'png': { pnDropSel(); const l = document.createElement('a'); l.href = pn.cv.toDataURL('image/png'); l.download = 'My drawing.png'; l.click(); return; }
    case 'toCard': {
      pnDropSel(); const title = prompt('What should the back of the card say? (for example the name of what you drew)', ''); if (title == null) return;
      const small = document.createElement('canvas'), sc = Math.min(1, 900 / PN_W); small.width = PN_W * sc; small.height = PN_H * sc; small.getContext('2d').drawImage(pn.cv, 0, 0, small.width, small.height);
      const blob = await new Promise(r => small.toBlob(r, 'image/jpeg', 0.88)); let id; try { id = await putMedia(blob); } catch { toast('Pictures can’t be saved here'); return; }
      const [d] = artMakeDeck('My drawings', [[`Drawing ${new Date().toLocaleDateString()} ${Date.now() % 1000}`, title.trim() || 'My drawing', { frontHtml: `<img data-mid="${id}" alt="">` }]]); toast(`📇 Added to “${d.name}”`); return; }
    case 'help': return openDialog({ title: '❓ Sketchpad tools', ok: 'Got it', wide: true, onOk: () => {}, body: `<ul class="small" style="margin:0;padding-left:18px;line-height:1.7">
      <li><b>Front and back colors:</b> left-click a color for the front color, right-click for the back color. Drawing with the right mouse button uses the back color.</li>
      <li><b>Shapes:</b> drag to draw. Hold <b>Shift</b> for a perfect square or circle. The box under the tools picks outline, outline + fill (with the back color), or fill only, and the line width.</li>
      <li><b>Curve:</b> drag a line, then drag again to bend it. <b>Polygon:</b> click each corner; click the first corner or double-click to finish.</li>
      <li><b>Select:</b> drag a box, then drag inside it to move that part. <b>Delete</b> clears it. Click outside to drop it.</li>
      <li><b>✋ Hand:</b> drag to move around a zoomed-in picture (the middle mouse button works with any tool). <b>↩️ ↪️</b> under the tools undo and redo.</li>
      <li><b>Zoom:</b> click to zoom in, right-click to zoom out. <b>Pick color:</b> click the picture to take a color from it.</li>
      <li><b>Mirror</b> menu: draw with symmetry. <b>View</b> menu: grid and guides (choose guides in 📐 Guides).</li>
      <li>Keyboard: <b>Ctrl+Z</b> undo, <b>Ctrl+Y</b> redo, <b>Delete</b> clears a selection, <b>Esc</b> cancels a polygon or curve.</li></ul>` });
  }
});
document.addEventListener('contextmenu', e => {
  if (view.name !== 'art') return;
  if (e.target.closest?.('.pn-more')) { e.preventDefault(); pnPickerOpen(2, e.target.closest('.pn-cur, .pn-more')); return; }
  const sw = e.target.closest?.('[data-pnc]'); if (!sw) return; e.preventDefault(); pnSetColor2(sw.dataset.pnc); });
document.addEventListener('dblclick', e => { const sw = e.target.closest?.('[data-pnc]'); if (!sw || view.name !== 'art') return; pnSetColor(sw.dataset.pnc); pnPickerOpen(1, sw); });
document.addEventListener('input', e => { if (view.name !== 'art') return; if (e.target.id === 'pnColorIn') pnSetColor(e.target.value); if (e.target.id === 'pnColorIn2') pnSetColor2(e.target.value); });
document.addEventListener('keydown', e => {
  if (view.name !== 'art' || art().tab !== 'sketch' || /input|textarea|select/i.test(e.target.tagName)) return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); document.querySelector('[data-pn="undo"]')?.click(); }
  else if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); document.querySelector('[data-pn="redo"]')?.click(); }
  else if ((k === 'delete' || k === 'backspace') && pn.sel) { e.preventDefault(); document.querySelector('[data-pn="delSel"]')?.click(); }
  else if (art().animMode && (k === 'arrowleft' || k === 'arrowright') && !pn.down) { e.preventDefault(); paShow(pa.i + (k === 'arrowleft' ? -1 : 1)); }
  else if (art().animMode && k === ' ' && !pn.down) { e.preventDefault(); pa.playing ? paStop() : paPlay(); }
  else if (k === 'escape') { if (pn.poly) { pn.poly = null; pnTmpClear(); } if (pn.curve) { pnShape(pn.ctx, 'curve', ...pn.curve.p0, ...pn.curve.p1, null, pn.btn); pn.curve = null; pnTmpClear(); pnStore(); } }
});
document.addEventListener('click', e => { if (!e.target.closest?.('.pn-menu')) document.querySelectorAll('.pn-menu[open]').forEach(d => d.removeAttribute('open')); });
