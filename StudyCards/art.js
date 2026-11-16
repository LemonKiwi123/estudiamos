'use strict';
/* ================= 🎨 Art studio =================
   ✏️ Sketchpad · 🌈 Color theory & palettes · 🖼️ Reference photo helper · ⏱️ Practice timer · 📐 Perspective & proportion guides · 📚 Art basics
   Works offline; photos you open stay on this device (they aren't saved or sent anywhere). Settings in S.settings.art. */
function art() { const a = (S.settings.art ||= {}); a.tab ||= 'sketch'; a.color ||= '#1c1b19'; a.size ??= 6; a.alpha ??= 100; a.tool ||= 'pencil'; a.sym ||= 'off'; a.palettes ||= []; return a; }
const artSave = () => { clearTimeout(artSave.t); artSave.t = setTimeout(() => { try { save(); } catch {} }, 300); };

/* ---------- 🌈 color helpers ---------- */
const hex2rgb = h => { const n = parseInt(h.replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgb2hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
function hsl2hex(h, s, l) { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return rgb2hex(255 * f(0), 255 * f(8), 255 * f(4)); }
function hex2hsl(hx) { let [r, g, b] = hex2rgb(hx).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)]; }
/* the painter's (RYB) wheel: red, yellow and blue are the primaries, so red's opposite is green */
const RYB_KEYS = [[0, 0], [60, 30], [120, 55], [180, 120], [240, 225], [300, 280], [360, 360]];
const ryb2hue = a => { a = ((a % 360) + 360) % 360; for (let i = 1; i < RYB_KEYS.length; i++) if (a <= RYB_KEYS[i][0]) { const [a0, h0] = RYB_KEYS[i - 1], [a1, h1] = RYB_KEYS[i]; return h0 + (a - a0) / (a1 - a0) * (h1 - h0); } return 0; };
const wheelHex = (angle, mode, s = 85, l = 50) => hsl2hex(mode === 'rgb' ? ((angle % 360) + 360) % 360 : ryb2hue(angle), s, l);
const COLOR_NAMES_RYB = ['Red', 'Red-orange', 'Orange', 'Yellow-orange', 'Yellow', 'Yellow-green', 'Green', 'Blue-green', 'Blue', 'Blue-violet', 'Violet', 'Red-violet'];
const SCHEMES = { comp: ['Complementary', [0, 180], 'Opposite colors: the strongest contrast. They make each other look brighter.'], analog: ['Analogous', [-30, 0, 30], 'Neighbors on the wheel: calm and harmonious.'],
  triad: ['Triadic', [0, 120, 240], 'Three evenly spaced colors: lively but balanced.'], split: ['Split-complementary', [0, 150, 210], 'A color plus the two beside its opposite: contrast that’s easier on the eye.'],
  square: ['Square', [0, 90, 180, 270], 'Four evenly spaced colors: rich; let one lead.'], mono: ['Monochromatic', [0], 'One hue in different tints and shades: simple and unified.'] };
function colorHtml() {
  const a = art(), mode = a.wheel || 'ryb', base = a.hue ?? 0, sch = SCHEMES[a.scheme] ? a.scheme : 'comp';
  const angles = SCHEMES[sch][1].map(d => base + d), colors = sch === 'mono' ? [30, 42, 50, 62, 75].map(l => wheelHex(base, mode, 85, l)) : angles.map(x => wheelHex(x, mode));
  const R = 110, seg = (i, r0, r1) => { const a0 = (i * 30 - 15 - 90) * Math.PI / 180, a1 = (i * 30 + 15 - 90) * Math.PI / 180, p = (r, t) => `${(130 + r * Math.cos(t)).toFixed(1)},${(130 + r * Math.sin(t)).toFixed(1)}`;
    return `M${p(r1, a0)} A${r1},${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0},${r0} 0 0 0 ${p(r0, a0)}Z`; };
  const marks = angles.map(x => { const t = (x - 90) * Math.PI / 180; return `<circle cx="${130 + 86 * Math.cos(t)}" cy="${130 + 86 * Math.sin(t)}" r="9" class="cw-mark"/>`; }).join('');
  const warm = (() => { const h = mode === 'rgb' ? base % 360 : ryb2hue(base); return h < 90 || h > 330; })();
  const baseHex = wheelHex(base, mode), [bh, bs] = hex2hsl(baseHex);
  const strip = (label, list) => `<div class="cs-strip"><span class="muted small">${label}</span><div>${list.map(h => `<button type="button" class="cs-sw" style="background:${h}" data-art="pick" data-c="${h}" title="${h}"></button>`).join('')}</div></div>`;
  return `<div class="art-two"><div class="panel"><div class="row-between"><h3 style="margin:0">Color wheel</h3>
        <div class="seg-btns"><button type="button" class="btn sm ${mode === 'ryb' ? 'primary' : ''}" data-art="wheel" data-k="ryb" title="Mixing paint">🎨 Paint (RYB)</button><button type="button" class="btn sm ${mode === 'rgb' ? 'primary' : ''}" data-art="wheel" data-k="rgb" title="Mixing light on screens">💡 Light (RGB)</button></div></div>
      <svg viewBox="0 0 260 260" class="cw" role="group" aria-label="Color wheel">${Array.from({ length: 12 }, (_, i) => `<path d="${seg(i, 62, R)}" fill="${wheelHex(i * 30, mode)}" class="cw-seg" data-art="hue" data-h="${i * 30}"><title>${mode === 'ryb' ? COLOR_NAMES_RYB[i] : i * 30 + '°'}</title></path>`).join('')}
        ${Array.from({ length: 12 }, (_, i) => `<path d="${seg(i, 40, 62)}" fill="${wheelHex(i * 30, mode, 70, 75)}" class="cw-seg" data-art="hue" data-h="${i * 30}"/>`).join('')}
        <circle cx="130" cy="130" r="38" fill="${baseHex}" stroke="var(--border)"/>${marks}</svg>
      <p class="muted small" style="margin:6px 0 0">Tap a color. ${mode === 'ryb' ? 'On the painter’s wheel the primaries are <b>red, yellow and blue</b>.' : 'On screens the primaries are <b>red, green and blue</b> light.'} This one is a <b>${warm ? 'warm' : 'cool'}</b> color.</p></div>
    <div class="panel"><h3 style="margin-top:0">Color schemes</h3>
      <div class="row" style="gap:6px;flex-wrap:wrap">${Object.entries(SCHEMES).map(([k, [n]]) => `<button type="button" class="btn sm ${sch === k ? 'primary' : ''}" data-art="scheme" data-k="${k}">${n}</button>`).join('')}</div>
      <p class="small" style="margin:8px 0">${esc(SCHEMES[sch][2])}</p>
      <div class="cs-big">${colors.map(h => `<button type="button" class="cs-chip" style="background:${h}" data-art="pick" data-c="${h}" title="Use ${h} in the sketchpad"><span>${h}</span></button>`).join('')}</div>
      <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn sm primary" data-art="palSave" data-c="${colors.join(',')}">💾 Save as a palette</button><button type="button" class="btn sm" data-art="copy" data-c="${colors.join(' ')}">📋 Copy color codes</button></div>
      ${strip('Tints (add white)', [20, 35, 50, 65, 80].map(l => hsl2hex(bh, bs, Math.max(l, 50))).filter((v, i, x) => x.indexOf(v) === i))}
      ${strip('Shades (add black)', [50, 40, 30, 20, 10].map(l => hsl2hex(bh, bs, l)))}
      ${strip('Tones (add gray)', [85, 65, 45, 25, 8].map(s => hsl2hex(bh, s, 50)))}</div></div>
    <div class="art-two" style="margin-top:12px"><div class="panel"><h3 style="margin-top:0">Mixing colors</h3>
      <div class="mix-demo"><div><div class="mix-venn sub"><i style="background:#ffd400"></i><i style="background:#e8132f"></i><i style="background:#1f5fd6"></i></div><b>Paint</b><div class="muted small">Mixing paint makes colors darker: red + yellow = orange, yellow + blue = green, blue + red = violet. All three make brown or black.</div></div>
        <div><div class="mix-venn add"><i style="background:#ff0000"></i><i style="background:#00ff00"></i><i style="background:#0000ff"></i></div><b>Light</b><div class="muted small">Mixing light makes colors brighter: red + green = yellow, green + blue = cyan, blue + red = magenta. All three make white.</div></div></div></div>
    <div class="panel"><h3 style="margin-top:0">My palettes</h3>${a.palettes.length ? a.palettes.map((p, i) => `<div class="pal-row"><div class="pal-sw">${p.colors.map(h => `<button type="button" style="background:${h}" data-art="pick" data-c="${h}" title="${h}"></button>`).join('')}</div>
        <span class="small">${esc(p.name)}</span><span class="row" style="gap:4px;margin-left:auto"><button type="button" class="btn sm" data-art="palUse" data-i="${i}" title="Put these colors in the sketchpad">✏️ Use</button><button type="button" class="btn sm ghost" data-art="copy" data-c="${p.colors.join(' ')}" title="Copy color codes">📋</button><button type="button" class="btn sm ghost" data-art="palDel" data-i="${i}" title="Delete">🗑️</button></span></div>`).join('')
        : '<p class="muted small">Save a color scheme as a palette and it shows up here, ready to use in the sketchpad.</p>'}
      ${a.palettes.length ? `<button type="button" class="btn sm" data-art="palExport" style="margin-top:8px">⬇️ Export palettes</button>` : ''}</div></div>`;
}

/* ---------- ✏️ sketchpad ---------- */
const SK_W = 1200, SK_H = 800;
const skp = { ctx: null, cv: null, undo: [], redo: [], drawing: false, last: null, guide: null };
const SK_TOOLS = [['pencil', '✏️ Pencil'], ['brush', '🖌️ Brush'], ['marker', '🖍️ Marker'], ['eraser', '🧽 Eraser'], ['fill', '🪣 Fill'], ['picker', '💧 Pick color']];
const SK_SYMS = [['off', 'No mirror'], ['v', '↔️ Mirror left-right'], ['quad', '✚ Four ways'], ['r6', '❄️ 6 slices'], ['r8', '✳️ 8 slices']];
function sketchHtml() {
  const a = art(), sw = (a.swatches?.length ? a.swatches : ['#1c1b19', '#ffffff', '#e8132f', '#ff8c1a', '#ffd400', '#2bb24c', '#1f5fd6', '#8a3fd1', '#8b5a2b', '#9aa0a6']);
  return `<div class="sk-tools">
      <div class="seg-btns sk-toolset">${SK_TOOLS.map(([k, l]) => `<button type="button" class="btn sm ${a.tool === k ? 'primary' : ''}" data-art="tool" data-k="${k}">${l}</button>`).join('')}</div>
      <label class="sk-ctl">Color <input type="color" value="${a.color}" data-artf="color"></label>
      <label class="sk-ctl">Size <input type="range" min="1" max="80" value="${a.size}" data-artf="size"><b data-artv="size">${a.size}</b></label>
      <label class="sk-ctl">See-through <input type="range" min="5" max="100" value="${a.alpha}" data-artf="alpha"><b data-artv="alpha">${a.alpha}%</b></label>
      <select class="inp" data-artf="sym" style="margin:0;width:auto" aria-label="Symmetry">${SK_SYMS.map(([k, l]) => `<option value="${k}" ${a.sym === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
      <label class="row small" style="gap:4px"><input type="checkbox" data-artf="grid" ${a.grid ? 'checked' : ''}> Grid</label>
      ${a.guide ? `<label class="row small" style="gap:4px"><input type="checkbox" data-artf="showGuide" ${a.showGuide !== false ? 'checked' : ''}> Guide</label>` : ''}</div>
    <div class="sk-swatches">${sw.map(h => `<button type="button" class="sk-sw ${h.toLowerCase() === a.color.toLowerCase() ? 'on' : ''}" style="background:${h}" data-art="pick" data-c="${h}" title="${h}"></button>`).join('')}</div>
    <div class="sk-wrap"><canvas id="skCanvas" width="${SK_W}" height="${SK_H}" aria-label="Drawing area"></canvas><canvas id="skGuide" width="${SK_W}" height="${SK_H}" aria-hidden="true"></canvas><div class="sk-grid ${a.grid ? 'on' : ''}"></div></div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">
      <button type="button" class="btn sm" data-art="undo">↩️ Undo</button><button type="button" class="btn sm" data-art="redo">↪️ Redo</button>
      <button type="button" class="btn sm" data-art="clear">🧹 Clear</button>
      <button type="button" class="btn sm primary" data-art="png">⬇️ Save picture</button>
      <button type="button" class="btn sm" data-art="toCard" title="Make a flashcard with this drawing on the front">📇 Put on a flashcard</button>
      <span class="muted small" style="margin-left:auto">Your drawing is kept on this device until you clear it.</span></div>`;
}
function skMount() {
  const cv = document.getElementById('skCanvas'); if (!cv) return;
  skp.cv = cv; skp.ctx = cv.getContext('2d', { willReadFrequently: true });
  const a = art();
  if (a.drawing) { const img = new Image(); img.onload = () => { skp.ctx.drawImage(img, 0, 0); }; img.src = a.drawing; }
  else { skp.ctx.fillStyle = '#fff'; skp.ctx.fillRect(0, 0, SK_W, SK_H); }
  skDrawGuide();
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * SK_W / r.width, (e.clientY - r.top) * SK_H / r.height]; };
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); cv.setPointerCapture(e.pointerId); const [x, y] = pos(e), a = art();
    if (a.tool === 'picker') { const d = skp.ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data; artSetColor(rgb2hex(d[0], d[1], d[2])); return; }
    skPush();
    if (a.tool === 'fill') { skFill(Math.round(x), Math.round(y)); skStore(); return; }
    skp.drawing = true; skp.last = [x, y, e.pressure || 0.5]; skStroke(x, y, x + 0.01, y + 0.01, e.pressure || 0.5);
  });
  cv.addEventListener('pointermove', e => { if (!skp.drawing) return; const [x, y] = pos(e), p = e.pressure || 0.5; skStroke(skp.last[0], skp.last[1], x, y, p); skp.last = [x, y, p]; });
  const end = () => { if (skp.drawing) { skp.drawing = false; skStore(); } };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
}
function skMirrors(x, y) {   // where each point is copied for symmetry
  const sym = art().sym, cx = SK_W / 2, cy = SK_H / 2, out = [[x, y]];
  if (sym === 'v') out.push([SK_W - x, y]);
  else if (sym === 'quad') out.push([SK_W - x, y], [x, SK_H - y], [SK_W - x, SK_H - y]);
  else if (sym === 'r6' || sym === 'r8') { const n = sym === 'r6' ? 6 : 8, dx = x - cx, dy = y - cy;
    for (let i = 1; i < n; i++) { const t = i * 2 * Math.PI / n; out.push([cx + dx * Math.cos(t) - dy * Math.sin(t), cy + dx * Math.sin(t) + dy * Math.cos(t)]); } }
  return out;
}
function skStroke(x0, y0, x1, y1, p) {
  const a = art(), g = skp.ctx, A = skMirrors(x0, y0), B = skMirrors(x1, y1);
  g.save(); g.lineCap = g.lineJoin = 'round';
  const alpha = a.alpha / 100;
  if (a.tool === 'eraser') { g.globalCompositeOperation = 'source-over'; g.strokeStyle = '#fff'; g.globalAlpha = 1; g.lineWidth = a.size * 2; }
  else if (a.tool === 'pencil') { g.strokeStyle = a.color; g.globalAlpha = alpha * 0.9; g.lineWidth = Math.max(1, a.size * 0.5); }
  else if (a.tool === 'marker') { g.strokeStyle = a.color; g.globalAlpha = Math.min(alpha, 0.45); g.lineWidth = a.size * 1.6; g.lineCap = 'square'; }
  else { g.strokeStyle = a.color; g.globalAlpha = alpha; g.lineWidth = a.size * (0.5 + p); g.shadowColor = a.color; g.shadowBlur = a.size * 0.35; }
  for (let i = 0; i < A.length; i++) { g.beginPath(); g.moveTo(A[i][0], A[i][1]); g.lineTo(B[i][0], B[i][1]); g.stroke(); }
  g.restore();
}
function skFill(x, y) {   // paint-bucket flood fill (stops at colors that differ a lot)
  const g = skp.ctx, img = g.getImageData(0, 0, SK_W, SK_H), d = img.data, i0 = (y * SK_W + x) * 4, t = [d[i0], d[i0 + 1], d[i0 + 2]], [r, gg, b] = hex2rgb(art().color);
  if (Math.abs(t[0] - r) + Math.abs(t[1] - gg) + Math.abs(t[2] - b) < 6) return;
  const near = i => Math.abs(d[i] - t[0]) + Math.abs(d[i + 1] - t[1]) + Math.abs(d[i + 2] - t[2]) < 60, seen = new Uint8Array(SK_W * SK_H), st = [x, y];
  while (st.length) { const py = st.pop(), px = st.pop(); if (px < 0 || py < 0 || px >= SK_W || py >= SK_H) continue; const k = py * SK_W + px; if (seen[k]) continue; seen[k] = 1; const i = k * 4; if (!near(i)) continue;
    d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255; st.push(px + 1, py, px - 1, py, px, py + 1, px, py - 1); }
  g.putImageData(img, 0, 0);
}
function skPush() { try { skp.undo.push(skp.ctx.getImageData(0, 0, SK_W, SK_H)); if (skp.undo.length > 25) skp.undo.shift(); skp.redo = []; } catch {} }
function skStore() { clearTimeout(skStore.t); skStore.t = setTimeout(() => { try { art().drawing = skp.cv.toDataURL('image/png'); artSave(); } catch {} }, 400); }
function artSetColor(h) { const a = art(); a.color = h; const inp = document.querySelector('[data-artf="color"]'); if (inp) inp.value = h; document.querySelectorAll('.sk-sw').forEach(s => s.classList.toggle('on', s.dataset.c.toLowerCase() === h.toLowerCase())); artSave(); }
function skDrawGuide() {
  const gc = document.getElementById('skGuide'); if (!gc) return; const g = gc.getContext('2d'); g.clearRect(0, 0, SK_W, SK_H);
  const a = art(); if (!a.guide || a.showGuide === false) return;
  guideDraw(g, SK_W, SK_H, a.guide);
}

/* ---------- 📐 perspective and proportion guides ---------- */
const PHI = (1 + Math.sqrt(5)) / 2;
function compDraw(g, W, H, kind, flip) {   // composition guides: where to put the important things
  g.save(); g.lineWidth = 2; g.strokeStyle = 'rgba(207,63,63,.75)'; g.fillStyle = 'rgba(207,63,63,.9)';
  if (flip) { g.translate(W, 0); g.scale(-1, 1); }
  const line = (x0, y0, x1, y1) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const dot = (x, y) => { g.beginPath(); g.arc(x, y, 7, 0, 7); g.fill(); };
  if (kind === 'thirds') { for (const f of [1 / 3, 2 / 3]) { line(W * f, 0, W * f, H); line(0, H * f, W, H * f); } for (const a of [1 / 3, 2 / 3]) for (const c of [1 / 3, 2 / 3]) dot(W * a, H * c); }
  else if (kind === 'phi') { const a = 1 / PHI, c = 1 - a; for (const f of [c, a]) { line(W * f, 0, W * f, H); line(0, H * f, W, H * f); } for (const x of [c, a]) for (const y of [c, a]) dot(W * x, H * y); }
  else if (kind === 'spiral') {   // a golden spiral: quarter circles in squares cut from a golden rectangle, stretched to the picture
    g.save(); g.scale(W / PHI, H); g.lineWidth = 2 / Math.min(W / PHI, H);
    let x = 0, y = 0, w = PHI, h = 1; g.beginPath(); g.strokeStyle = 'rgba(59,84,232,.35)';
    const rects = []; for (let i = 0; i < 10; i++) { const s = Math.min(w, h); rects.push([x, y, w, h, s, i % 4]);
      if (i % 4 === 0) { g.rect(x, y, s, s); x += s; w -= s; } else if (i % 4 === 1) { g.rect(x, y, w, s); y += s; h -= s; } else if (i % 4 === 2) { g.rect(x + w - s, y, s, h); w -= s; } else { g.rect(x, y + h - s, w, s); h -= s; } }
    g.stroke(); g.beginPath(); g.strokeStyle = 'rgba(207,63,63,.85)';
    for (const [rx, ry, rw, rh, s, k] of rects) { if (k === 0) g.arc(rx + s, ry + s, s, Math.PI, Math.PI * 1.5); else if (k === 1) g.arc(rx, ry + s, s, Math.PI * 1.5, Math.PI * 2); else if (k === 2) g.arc(rx + rw - s, ry, s, 0, Math.PI * 0.5); else g.arc(rx + s, ry + rh - s, s, Math.PI * 0.5, Math.PI); }
    g.stroke(); g.restore(); }
  else if (kind === 'diag') {   // the two main diagonals and their "reciprocal" lines (dynamic symmetry)
    line(0, 0, W, H); line(0, H, W, 0);
    g.strokeStyle = 'rgba(59,84,232,.6)'; line(0, H, H * H / W, 0);   // each meets a diagonal at a right angle
    line(W, 0, W - H * H / W, H); line(0, 0, H * H / W, H); line(W, H, W - H * H / W, 0); }
  else if (kind === 'triangle') { line(0, H, W, 0); const t = H * H / (W * W + H * H); line(0, 0, W * t, H - H * t); line(W, H, W - W * t, H * t); }
  else if (kind === 'center') { g.setLineDash([10, 8]); line(W / 2, 0, W / 2, H); line(0, H / 2, W, H / 2); g.setLineDash([]); g.strokeRect(W * 0.1, H * 0.1, W * 0.8, H * 0.8); g.beginPath(); g.arc(W / 2, H / 2, Math.min(W, H) * 0.18, 0, 7); g.stroke(); }
  g.restore();
}
const COMP_KINDS = { thirds: ['Rule of thirds', 'Split the picture into thirds. Put important things on the lines, and the main subject where they cross, instead of right in the middle.'],
  phi: ['Golden ratio', 'Like the rule of thirds, but the lines sit a little closer to the center (about 0.38 and 0.62). Used in painting and design for centuries.'],
  spiral: ['Golden spiral', 'The eye follows the curve into its tightest part. Put your main subject where the spiral curls in. Flip it to curl the other way.'],
  diag: ['Diagonals', 'Lines from corner to corner, plus the shorter lines that meet them at right angles. Lining edges and gazes up with them makes a picture feel full of movement.'],
  triangle: ['Golden triangles', 'One corner-to-corner diagonal, with lines to it from the other two corners. Fits pictures with strong slanting shapes.'],
  center: ['Center and frame', 'The middle of the picture, a margin to keep important things inside, and the center circle for strong, symmetrical pictures.'] };
function guideDraw(g, W, H, cfg) {
  if (COMP_KINDS[cfg.kind]) return compDraw(g, W, H, cfg.kind, cfg.flip);
  g.save(); g.lineWidth = 1.5;
  if (cfg.kind === 'face') {   // classic face proportions (front view)
    const cx = W / 2, top = H * 0.08, bot = H * 0.92, h = bot - top, w = h * 0.68;
    g.strokeStyle = 'rgba(59,84,232,.55)'; g.beginPath(); g.ellipse(cx, top + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); g.stroke();
    const line = (y, label) => { g.beginPath(); g.moveTo(cx - w / 2 - 20, y); g.lineTo(cx + w / 2 + 20, y); g.stroke(); g.fillStyle = 'rgba(59,84,232,.8)'; g.font = '20px system-ui'; g.fillText(label, cx + w / 2 + 26, y + 6); };
    g.setLineDash([8, 6]); g.beginPath(); g.moveTo(cx, top - 10); g.lineTo(cx, bot + 10); g.stroke();
    line(top + h * 0.5, 'eyes (halfway down)'); line(top + h * 0.28, 'hairline'); line(top + h * 0.5 + h * 0.5 * 0.5, 'bottom of the nose'); line(top + h * 0.5 + h * 0.5 * 0.5 + h * 0.25 / 3, 'mouth');
    g.setLineDash([]); for (let i = 1; i < 5; i++) { const x = cx - w / 2 + w * i / 5; g.beginPath(); g.moveTo(x, top + h * 0.5 - 6); g.lineTo(x, top + h * 0.5 + 6); g.stroke(); }
    g.fillText('the face is about 5 eyes wide', cx - w / 2, top + h * 0.5 + 34);
  } else if (cfg.kind === 'figure') {   // an adult is about 8 heads tall
    const top = H * 0.04, hh = (H * 0.92) / 8, cx = W / 2; g.strokeStyle = 'rgba(59,84,232,.55)'; g.fillStyle = 'rgba(59,84,232,.8)'; g.font = '18px system-ui';
    const labels = ['head', 'chest', 'belly button', 'hips', 'mid-thigh', 'knees', 'shins', 'feet'];
    for (let i = 0; i <= 8; i++) { const y = top + hh * i; g.beginPath(); g.moveTo(cx - 180, y); g.lineTo(cx + 180, y); g.stroke(); if (i < 8) g.fillText(`${i + 1}. ${labels[i]}`, cx + 190, y + hh * 0.6); }
    g.beginPath(); g.ellipse(cx, top + hh / 2, hh * 0.38, hh / 2, 0, 0, Math.PI * 2); g.stroke();
    g.setLineDash([8, 6]); g.beginPath(); g.moveTo(cx, top); g.lineTo(cx, top + hh * 8); g.stroke();
  } else {   // perspective: horizon + 1, 2 or 3 vanishing points with lines spreading out
    const hy = H * (cfg.hy ?? 0.45), n = cfg.lines || 14, vps = cfg.kind === 'p1' ? [[W * (cfg.x1 ?? 0.5), hy]] : cfg.kind === 'p2' ? [[W * (cfg.x1 ?? 0.08), hy], [W * (cfg.x2 ?? 0.92), hy]] : [[W * (cfg.x1 ?? 0.08), hy], [W * (cfg.x2 ?? 0.92), hy], [W * 0.5, H * (cfg.y3 ?? 1.6)]];
    g.strokeStyle = 'rgba(207,63,63,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, hy); g.lineTo(W, hy); g.stroke();
    g.fillStyle = 'rgba(207,63,63,.85)'; g.font = '18px system-ui'; g.fillText('horizon line (eye level)', 10, hy - 8);
    const cols = ['rgba(59,84,232,.35)', 'rgba(35,144,90,.35)', 'rgba(201,124,16,.4)'];
    vps.forEach(([vx, vy], k) => { g.strokeStyle = cols[k]; g.lineWidth = 1.2; for (let i = 0; i < n; i++) { const t = (i / (n - 1)) * Math.PI * 2; const ex = vx + Math.cos(t) * 3000, ey = vy + Math.sin(t) * 3000; g.beginPath(); g.moveTo(vx, vy); g.lineTo(ex, ey); g.stroke(); }
      if (vy < H) { g.fillStyle = cols[k].replace(/[\d.]+\)$/, '1)'); g.beginPath(); g.arc(vx, vy, 7, 0, 7); g.fill(); g.fillText(`VP${k + 1}`, vx + 10, vy - 10); } });
  }
  g.restore();
}
function guidesHtml() {
  const a = art(), cfg = a.gcfg ||= { kind: 'p2', hy: 0.45, x1: 0.08, x2: 0.92, lines: 14 };
  const kinds = [['p1', '1-point perspective'], ['p2', '2-point perspective'], ['p3', '3-point perspective'], ['face', 'Face proportions'], ['figure', 'Figure: 8 heads tall']];
  const comp = Object.entries(COMP_KINDS).map(([k, [n]]) => [k, n]);
  const persp = /^p/.test(cfg.kind), help = { p1: 'One vanishing point: great for roads, hallways and rooms seen straight on.', p2: 'Two vanishing points on the horizon: buildings and boxes seen from a corner.', p3: 'Two on the horizon plus one far below (or above): tall buildings seen from high up (or low down).', face: 'Eyes sit halfway down the head. The nose ends halfway between the eyes and chin; the mouth is a third of the way from the nose to the chin. A face is about five eyes wide.', figure: 'An adult is about 8 heads tall; children have bigger heads compared with their bodies.' }[cfg.kind];
  return `<div class="g-groups"><div><span class="muted small">Perspective &amp; proportion</span><div class="row" style="gap:6px;flex-wrap:wrap">${kinds.map(([k, l]) => `<button type="button" class="btn sm ${cfg.kind === k ? 'primary' : ''}" data-art="gkind" data-k="${k}">${l}</button>`).join('')}</div></div>
      <div><span class="muted small">Composition</span><div class="row" style="gap:6px;flex-wrap:wrap">${comp.map(([k, l]) => `<button type="button" class="btn sm ${cfg.kind === k ? 'primary' : ''}" data-art="gkind" data-k="${k}">${l}</button>`).join('')}</div></div></div>
    <p class="small" style="margin:8px 0">${esc(help || COMP_KINDS[cfg.kind]?.[1] || '')}</p>
    ${cfg.kind === 'spiral' || cfg.kind === 'triangle' || cfg.kind === 'diag' ? `<button type="button" class="btn sm" data-art="gflip" style="margin-bottom:8px">↔️ Flip it</button>` : ''}
    ${persp ? `<div class="row" style="gap:14px;flex-wrap:wrap;margin-bottom:8px">
      <label class="sk-ctl">Horizon <input type="range" min="0.1" max="0.9" step="0.01" value="${cfg.hy}" data-artg="hy"></label>
      <label class="sk-ctl">${cfg.kind === 'p1' ? 'Vanishing point' : 'Left point'} <input type="range" min="${cfg.kind === 'p1' ? 0 : -0.5}" max="${cfg.kind === 'p1' ? 1 : 0.5}" step="0.01" value="${cfg.x1 ?? (cfg.kind === 'p1' ? 0.5 : 0.08)}" data-artg="x1"></label>
      ${cfg.kind !== 'p1' ? `<label class="sk-ctl">Right point <input type="range" min="0.5" max="1.5" step="0.01" value="${cfg.x2 ?? 0.92}" data-artg="x2"></label>` : ''}
      ${cfg.kind === 'p3' ? `<label class="sk-ctl">Third point <input type="range" min="-1.5" max="2.5" step="0.05" value="${cfg.y3 ?? 1.6}" data-artg="y3"></label>` : ''}
      <label class="sk-ctl">Lines <input type="range" min="6" max="40" step="1" value="${cfg.lines || 14}" data-artg="lines"></label></div>` : ''}
    <div class="sk-wrap"><canvas id="guideCanvas" width="${SK_W}" height="${SK_H}" aria-label="Guide preview"></canvas></div>
    <div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><button type="button" class="btn primary" data-art="gUse">✏️ Draw on this guide in the sketchpad</button>${a.guide ? `<button type="button" class="btn ghost" data-art="gOff">Remove the guide from the sketchpad</button>` : ''}</div>`;
}
function guideRedraw() { const c = document.getElementById('guideCanvas'); if (!c) return; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, SK_W, SK_H); guideDraw(g, SK_W, SK_H, art().gcfg); }

/* ---------- 🖼️ reference photo helper (the photo stays in this page only) ---------- */
const ph = { img: null, name: '' };
function photoHtml() {
  const a = art(), p = a.photo ||= { grid: 4, gray: false, values: 0, flip: false, gridColor: '#ff3b30' };
  return `<div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><button type="button" class="btn primary" data-art="phOpen">🖼️ Open a photo…</button>
      ${ph.img ? `<span class="muted small">${esc(ph.name)}</span>` : '<span class="muted small">Pick a photo from your device. It stays on this page and isn’t saved or sent anywhere.</span>'}</div>
    ${ph.img ? `<div class="row" style="gap:12px;flex-wrap:wrap;margin:10px 0">
      <label class="sk-ctl">Grid <select class="inp" data-artp="grid" style="margin:0;width:auto">${[[0, 'Off'], [2, '2 × 2'], [3, '3 × 3'], [4, '4 × 4'], [6, '6 × 6'], [8, '8 × 8']].map(([v, l]) => `<option value="${v}" ${+p.grid === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="sk-ctl">Grid color <input type="color" value="${p.gridColor}" data-artp="gridColor"></label>
      <label class="row small" style="gap:4px"><input type="checkbox" data-artp="gray" ${p.gray ? 'checked' : ''}> Gray (values only)</label>
      <label class="sk-ctl">Simplify to <select class="inp" data-artp="values" style="margin:0;width:auto">${[[0, 'All tones'], [2, '2 values (notan)'], [3, '3 values'], [4, '4 values'], [5, '5 values']].map(([v, l]) => `<option value="${v}" ${+p.values === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="row small" style="gap:4px"><input type="checkbox" data-artp="flip" ${p.flip ? 'checked' : ''}> Mirror</label></div>
      <div class="sk-wrap ph-wrap"><canvas id="phCanvas" aria-label="Your reference photo"></canvas></div>
      <div class="row" style="gap:8px;align-items:center;margin-top:8px;flex-wrap:wrap"><span class="muted small">Tap the photo to pick a color from it:</span><span class="ph-picked" id="phPicked"></span></div>` : ''}
    <p class="muted small" style="margin-top:10px"><b>Grid method:</b> draw the same grid lightly on your paper and copy one square at a time. <b>Values:</b> squint, or use gray and 3 values to see the big light and dark shapes. <b>Mirror:</b> flipping shows mistakes you stopped noticing.</p>`;
}
function phDraw() {
  const c = document.getElementById('phCanvas'); if (!c || !ph.img) return;
  const p = art().photo, maxW = 1400, sc = Math.min(1, maxW / ph.img.naturalWidth); c.width = Math.round(ph.img.naturalWidth * sc); c.height = Math.round(ph.img.naturalHeight * sc);
  const g = c.getContext('2d', { willReadFrequently: true }); g.save(); if (p.flip) { g.translate(c.width, 0); g.scale(-1, 1); } g.drawImage(ph.img, 0, 0, c.width, c.height); g.restore();
  if (p.gray || +p.values) { const im = g.getImageData(0, 0, c.width, c.height), d = im.data, n = +p.values;
    for (let i = 0; i < d.length; i += 4) { let v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; if (n) v = Math.round(Math.min(n - 1, Math.floor(v / 256 * n)) * 255 / (n - 1)); if (p.gray || n) d[i] = d[i + 1] = d[i + 2] = v; }
    g.putImageData(im, 0, 0); }
  if (+p.grid) { g.strokeStyle = p.gridColor; g.lineWidth = Math.max(1, c.width / 500); g.globalAlpha = .8;
    for (let i = 1; i < +p.grid; i++) { const x = c.width * i / +p.grid, y = c.height * i / +p.grid; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, c.height); g.moveTo(0, y); g.lineTo(c.width, y); g.stroke(); } }
}

/* ---------- ⏱️ practice timer ---------- */
const PROMPTS = {
  objects: ['a coffee mug', 'your shoe', 'a set of keys', 'a crumpled paper ball', 'a pair of scissors', 'a houseplant', 'a stack of books', 'a backpack', 'a spoon in a glass', 'a lamp', 'an apple cut in half', 'a pair of glasses'],
  animals: ['a cat stretching', 'a sleeping dog', 'a bird about to fly', 'a fish from the side', 'a horse running', 'an owl', 'a turtle', 'a rabbit sitting up', 'an elephant’s head', 'a butterfly'],
  people: ['a hand holding a cup', 'your own hand', 'someone sitting and reading', 'a person running', 'a face looking up', 'a person waving', 'crossed arms', 'a foot from the side', 'someone tying a shoe', 'a profile (side of a face)'],
  places: ['a window with a view', 'a street corner', 'a tree in the wind', 'your desk', 'a doorway', 'clouds over hills', 'a bridge', 'a kitchen counter'],
  imagine: ['a castle on a cloud', 'a robot gardener', 'a dragon made of leaves', 'a house shaped like a shoe', 'a fish that can walk', 'a city under the sea', 'a teapot monster', 'a tree with doors'],
};
const pt = { on: false, left: 0, total: 0, round: 0, prompt: '', timer: 0, paused: false };
function timerHtml() {
  const a = art(), t = a.timer ||= { secs: 60, rounds: 5, cats: ['objects', 'animals', 'people'] };
  if (pt.on) { const pct = pt.total ? pt.left / pt.total : 0, m = Math.floor(pt.left / 60), s = pt.left % 60;
    return `<div class="pt-run"><div class="muted">Round ${pt.round} of ${t.rounds}</div><div class="pt-prompt">Draw ${esc(pt.prompt)}</div>
      <svg viewBox="0 0 120 120" class="pt-ring"><circle cx="60" cy="60" r="52" class="pt-ring-bg"/><circle cx="60" cy="60" r="52" class="pt-ring-fg" style="stroke-dasharray:${(2 * Math.PI * 52).toFixed(1)};stroke-dashoffset:${((1 - pct) * 2 * Math.PI * 52).toFixed(1)}"/><text x="60" y="68" class="pt-time" id="ptTime">${m}:${String(s).padStart(2, '0')}</text></svg>
      <div class="row" style="gap:8px;justify-content:center"><button type="button" class="btn" data-art="tPause">${pt.paused ? '▶ Keep going' : '⏸ Pause'}</button><button type="button" class="btn" data-art="tSkip">⏭ Next prompt</button><button type="button" class="btn ghost" data-art="tStop">⏹ Stop</button></div></div>`; }
  return `<div class="pt-setup"><p class="muted" style="margin-top:0">Quick timed drawings build speed and confidence. Don’t aim for perfect: catch the main shape and movement before the time runs out.</p>
    <div class="row" style="gap:12px;flex-wrap:wrap"><label class="sk-ctl">Time per drawing <select class="inp" data-artt="secs" style="margin:0;width:auto">${[[30, '30 seconds'], [60, '1 minute'], [120, '2 minutes'], [300, '5 minutes'], [600, '10 minutes']].map(([v, l]) => `<option value="${v}" ${+t.secs === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="sk-ctl">Drawings <select class="inp" data-artt="rounds" style="margin:0;width:auto">${[3, 5, 10, 20].map(v => `<option ${+t.rounds === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin:10px 0">${Object.keys(PROMPTS).map(k => `<label class="pill ${t.cats.includes(k) ? 'on' : ''}"><input type="checkbox" data-artcat="${k}" ${t.cats.includes(k) ? 'checked' : ''} hidden> ${({ objects: '☕ Objects', animals: '🐈 Animals', people: '✋ People & hands', places: '🏙️ Places', imagine: '🐉 Imagination' })[k]}</label>`).join('')}</div>
    <button type="button" class="btn primary big" data-art="tStart">⏱️ Start</button>
    <p class="muted small">You’ve done <b>${a.practiceCount || 0}</b> timed drawing${a.practiceCount === 1 ? '' : 's'}. A sound plays when each one ends.</p></div>`;
}
function ptNext() {
  const t = art().timer, pool = t.cats.flatMap(k => PROMPTS[k] || []); pt.round++;
  if (pt.round > t.rounds) { ptStop(true); return; }
  pt.prompt = pool[Math.floor(Math.random() * pool.length)] || 'anything you can see'; pt.left = pt.total = +t.secs; pt.paused = false; artRedraw();
}
function ptStart() { pt.on = true; pt.round = 0; clearInterval(pt.timer); pt.timer = setInterval(ptTick, 1000); ptNext(); }
function ptTick() {
  if (!pt.on || pt.paused) return; if (view.name !== 'art' || art().tab !== 'timer') { ptStop(); return; }
  pt.left--; const el = document.getElementById('ptTime'); const ring = document.querySelector('.pt-ring-fg');
  if (el) el.textContent = `${Math.floor(Math.max(0, pt.left) / 60)}:${String(Math.max(0, pt.left) % 60).padStart(2, '0')}`;
  if (ring) ring.style.strokeDashoffset = ((1 - Math.max(0, pt.left) / pt.total) * 2 * Math.PI * 52).toFixed(1);
  if (pt.left <= 0) { const a = art(); a.practiceCount = (a.practiceCount || 0) + 1; artSave(); if (typeof rightSound === 'function') rightSound(); ptNext(); }
}
function ptStop(done) { pt.on = false; clearInterval(pt.timer); if (done) toast('🎉 Practice done! Nice work.'); artRedraw(); }

/* ---------- 📚 art basics ---------- */
const ART_ELEMENTS = [['Line', 'A mark that moves through space: straight, curved, thick, thin, or implied by edges.', '〰️'], ['Shape', 'A flat, closed area with height and width, like a circle or a leaf outline.', '🔷'],
  ['Form', 'A shape with depth (height, width and depth), like a sphere or a cube.', '🧊'], ['Value', 'How light or dark something is. Value makes things look solid.', '🌗'],
  ['Color', 'Hue (the color itself), how bright or dull it is (saturation), and how light or dark (value).', '🎨'], ['Texture', 'How something feels, or looks like it would feel: rough, smooth, fuzzy.', '🧶'],
  ['Space', 'The area around, between and inside things: positive (objects) and negative (the gaps).', '⬜']];
const ART_PRINCIPLES = [['Balance', 'How visual weight is spread out: symmetrical, asymmetrical or radial.', '⚖️'], ['Contrast', 'Big differences (light vs. dark, big vs. small) that grab attention.', '◐'],
  ['Emphasis', 'The focal point: the part your eye goes to first.', '🎯'], ['Movement', 'How the eye is led around the artwork.', '➰'], ['Pattern', 'A repeated element, like a motif in wallpaper.', '🔁'],
  ['Rhythm', 'Repetition with variety that creates a beat, like music for the eyes.', '🎵'], ['Unity', 'Everything works together and feels complete.', '🧩'], ['Proportion', 'How the sizes of parts relate to each other and the whole.', '📏']];
let abQ = null;
function basicsHtml() {
  if (view.abQuiz) { if (!abQ) abNew(); const a = art();
    return `<div class="mu-ear"><div class="row" style="justify-content:space-between"><button type="button" class="btn sm ghost" data-art="abBack">← Art basics</button><span class="muted small">✓ ${a.abRight || 0} of ${a.abTotal || 0}</span></div>
      <p class="muted" style="margin:14px 0 6px">Which element or principle is this?</p><div class="sci-q" style="font-size:20px">${esc(abQ.def)}</div>
      <div class="mu-opts">${abQ.opts.map(o => `<button type="button" class="btn ${abQ.given ? (o === abQ.answer ? 'right' : o === abQ.given ? 'wrong' : '') : ''}" data-art="abPick" data-v="${esc(o)}" ${abQ.given ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
      ${abQ.given ? `<div class="mu-verdict ${abQ.given === abQ.answer ? 'ok' : 'no'}">${abQ.given === abQ.answer ? '✓ Right!' : `It’s <b>${esc(abQ.answer)}</b>.`}</div><div style="text-align:center;margin-top:10px"><button type="button" class="btn primary big" data-art="abNext">Next ▶</button></div>` : ''}</div>`; }
  const card = ([n, d, e]) => `<div class="ab-card"><span class="ab-e">${e}</span><b>${n}</b><span class="small">${esc(d)}</span></div>`;
  return `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><button type="button" class="btn primary" data-art="abQuiz">🎯 Quiz me</button><button type="button" class="btn" data-art="abCards">📇 Make flashcards</button><button type="button" class="btn" data-act="timeline">🕰️ Art movements timeline</button></div>
    <h3 style="margin:6px 0">Elements of art <span class="muted small">the building blocks</span></h3><div class="ab-grid">${ART_ELEMENTS.map(card).join('')}</div>
    <h3 style="margin:16px 0 6px">Principles of design <span class="muted small">how the blocks are arranged</span></h3><div class="ab-grid">${ART_PRINCIPLES.map(card).join('')}</div>`;
}
function abNew() { const all = [...ART_ELEMENTS, ...ART_PRINCIPLES], x = all[Math.floor(Math.random() * all.length)]; abQ = { def: x[1], answer: x[0], given: null, opts: shuffle([x[0], ...shuffle(all.filter(y => y !== x).map(y => y[0])).slice(0, 3)]) }; }

/* ---------- the Art studio page ---------- */
const ART_TABS = [['sketch', '✏️ Sketchpad'], ['color', '🌈 Color'], ['photo', '🖼️ Photo helper'], ['timer', '⏱️ Practice timer'], ['guides', '📐 Guides'], ['shapes', '🎲 Random shapes'], ['anim', '🎬 Animation tips'], ['basics', '📚 Art basics']];
const ART_VIEWS = { sketch: () => paintHtml(), flip: () => flipHtml(), anim: () => animHtml(), color: colorHtml, photo: photoHtml, timer: timerHtml, guides: guidesHtml, shapes: () => shapesHtml(), basics: basicsHtml };   // paint.js and flipbook.js load after this file
views.art = () => {
  const a = art(); setTimeout(artMount, 0);
  return `<div class="row-between" style="margin-bottom:12px"><h2 style="margin:0">🎨 Art studio</h2>
      <div class="row" style="gap:6px;flex-wrap:wrap">${ART_TABS.map(([k, l]) => `<button type="button" class="btn sm ${a.tab === k ? 'primary' : ''}" data-art="tab" data-k="${k}">${l}</button>`).join('')}</div></div>
    <div class="panel art-panel">${(ART_VIEWS[a.tab] || sketchHtml)()}</div>`;
};
function artMount() { const t = art().tab; if (t === 'sketch') paintMount(); else if (t === 'flip') flipMount(); else if (t === 'anim') animMount(); else if (t === 'guides') guideRedraw(); else if (t === 'photo') phDraw(); else if (t === 'shapes') shRedraw(); }
function artRedraw() { const p = document.querySelector('.art-panel'); if (!p || view.name !== 'art') return; p.innerHTML = (ART_VIEWS[art().tab] || sketchHtml)(); artMount(); }
function artMakeDeck(name, rows) {
  let d = S.decks.find(x => x.name === name);
  if (!d) { d = { id: uid(), created: Date.now(), name, frontLang: 'en-US', backLang: 'en-US', newPerDay: 20, direction: 'front', subject: 'art' }; S.decks.push(d); }
  const have = new Set(cardsOf(d.id).map(c => c.front)); let n = 0;
  for (const [f, b, extra] of rows) if (!have.has(f)) { S.cards.push({ id: uid(), deckId: d.id, front: f, back: b, notes: '', example: '', exampleTr: '', state: 'new', due: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0, step: 0, created: Date.now(), ...(extra || {}) }); n++; }
  save(); return [d, n];
}
Object.assign(actions, { art: el => { const t = el?.dataset?.t; if (t === 'animate') { art().tab = 'sketch'; art().animMode = true; } else if (t) art().tab = t; go({ name: 'art' }); } });   // 'animate' opens the sketchpad's animation workspace
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-art]'); if (!b || view.name !== 'art') return;
  const a = art(), k = b.dataset.k;
  switch (b.dataset.art) {
    case 'tab': if (k === 'flip') { a.tab = 'sketch'; a.animMode = true; artSave(); return render(); } if (k !== 'timer' && pt.on) ptStop(); if (k !== 'flip' && typeof fbStop === 'function') fbStop(); a.tab = k; view.abQuiz = false; artSave(); return render();
    case 'tool': a.tool = k; document.querySelectorAll('[data-art="tool"]').forEach(x => x.classList.toggle('primary', x.dataset.k === k)); artSave(); return;
    case 'pick': artSetColor(b.dataset.c); if (a.tab !== 'sketch') toast(`🎨 ${b.dataset.c} is now your sketchpad color`); return;
    case 'undo': if (!skp.undo.length) return; skp.redo.push(skp.ctx.getImageData(0, 0, SK_W, SK_H)); skp.ctx.putImageData(skp.undo.pop(), 0, 0); skStore(); return;
    case 'redo': if (!skp.redo.length) return; skp.undo.push(skp.ctx.getImageData(0, 0, SK_W, SK_H)); skp.ctx.putImageData(skp.redo.pop(), 0, 0); skStore(); return;
    case 'clear': skPush(); skp.ctx.fillStyle = '#fff'; skp.ctx.fillRect(0, 0, SK_W, SK_H); skStore(); toast('🧹 Cleared (↩️ Undo brings it back)'); return;
    case 'png': { const l = document.createElement('a'); l.href = skp.cv.toDataURL('image/png'); l.download = 'My drawing.png'; l.click(); return; }
    case 'toCard': {
      const title = prompt('What should the back of the card say? (for example the name of what you drew)', ''); if (title == null) return;
      const small = document.createElement('canvas'), sc = Math.min(1, 900 / SK_W); small.width = SK_W * sc; small.height = SK_H * sc; small.getContext('2d').drawImage(skp.cv, 0, 0, small.width, small.height);
      const blob = await new Promise(r => small.toBlob(r, 'image/jpeg', 0.88));
      let id; try { id = await putMedia(blob); } catch { toast('Pictures can’t be saved here'); return; }
      const [d] = artMakeDeck('My drawings', [[`Drawing ${new Date().toLocaleDateString()} ${Date.now() % 1000}`, title.trim() || 'My drawing', { frontHtml: `<img data-mid="${id}" alt="">` }]]);
      toast(`📇 Added to “${d.name}”`); return;
    }
    case 'wheel': a.wheel = k; break;
    case 'hue': a.hue = +b.dataset.h; break;
    case 'scheme': a.scheme = k; break;
    case 'copy': try { await navigator.clipboard.writeText(b.dataset.c); toast('📋 Copied: ' + b.dataset.c); } catch { prompt('Copy these color codes:', b.dataset.c); } return;
    case 'palSave': { const nm = prompt('Name this palette', `${SCHEMES[a.scheme || 'comp'][0]} ${a.palettes.length + 1}`); if (nm == null) return; a.palettes.push({ name: nm.trim().slice(0, 40) || 'Palette', colors: b.dataset.c.split(',') }); toast('💾 Palette saved'); break; }
    case 'palUse': { const p = a.palettes[+b.dataset.i]; if (!p) return; a.swatches = [...p.colors, '#1c1b19', '#ffffff']; a.color = p.colors[0]; a.tab = 'sketch'; artSave(); toast(`✏️ “${p.name}” is in your sketchpad colors`); return render(); }
    case 'palDel': { const [gone] = a.palettes.splice(+b.dataset.i, 1); artSave(); artRedraw(); if (typeof undoToast === 'function') undoToast(`Deleted “${gone.name}”`, () => { a.palettes.splice(+b.dataset.i, 0, gone); artSave(); artRedraw(); }); return; }
    case 'palExport': { const l = document.createElement('a'); l.href = URL.createObjectURL(new Blob([JSON.stringify({ app: 'Estudiamos', type: 'palettes', palettes: a.palettes }, null, 2)], { type: 'application/json' })); l.download = 'Estudiamos palettes.json'; l.click(); return; }
    case 'phOpen': { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = () => { const f = inp.files?.[0]; if (!f || !/^image\//.test(f.type)) return; const img = new Image(); img.onload = () => { ph.img = img; ph.name = f.name; artRedraw(); }; img.src = URL.createObjectURL(f); };
      inp.click(); return; }
    case 'tStart': if (!a.timer.cats.length) { toast('Pick at least one kind of prompt'); return; } return ptStart();
    case 'tPause': pt.paused = !pt.paused; return artRedraw();
    case 'tSkip': return ptNext();
    case 'tStop': return ptStop();
    case 'gkind': a.gcfg = { ...a.gcfg, kind: k }; break;
    case 'gUse': a.guide = { ...a.gcfg }; a.showGuide = true; a.tab = 'sketch'; artSave(); toast('📐 The guide is under your drawing. Untick “Guide” to hide it.'); return render();
    case 'gOff': a.guide = null; break;
    case 'gflip': a.gcfg = { ...a.gcfg, flip: !a.gcfg.flip }; break;
    case 'abQuiz': view.abQuiz = true; abNew(); break;
    case 'abBack': view.abQuiz = false; break;
    case 'abNext': abNew(); break;
    case 'abPick': if (!abQ || abQ.given) return; abQ.given = b.dataset.v; a.abTotal = (a.abTotal || 0) + 1; if (abQ.given === abQ.answer) { a.abRight = (a.abRight || 0) + 1; if (typeof rightSound === 'function') rightSound(); if (typeof addPoints === 'function') addPoints(1); } else if (typeof sdSound === 'function') sdSound('wrong'); break;
    case 'abCards': { const [d, n] = artMakeDeck('Art basics', [...ART_ELEMENTS.map(([t, d]) => [t, d + ' (element of art)']), ...ART_PRINCIPLES.map(([t, d]) => [t, d + ' (principle of design)'])]); toast(n ? `📇 ${n} cards added to “${d.name}”` : 'Those cards are already in the deck'); return go({ name: 'deck', deckId: d.id }); }
    default: return;
  }
  artSave(); artRedraw();
});
document.addEventListener('input', e => {
  if (view.name !== 'art') return; const a = art(), t = e.target;
  if (t.dataset.artf === 'size' || t.dataset.artf === 'alpha') { a[t.dataset.artf] = +t.value; const v = document.querySelector(`[data-artv="${t.dataset.artf}"]`); if (v) v.textContent = t.value + (t.dataset.artf === 'alpha' ? '%' : ''); artSave(); }
  if (t.dataset.artf === 'color') artSetColor(t.value);
  if (t.dataset.artg) { a.gcfg[t.dataset.artg] = +t.value; artSave(); guideRedraw(); }
  if (t.dataset.artp === 'gridColor') { a.photo.gridColor = t.value; phDraw(); }
});
document.addEventListener('change', e => {
  if (view.name !== 'art') return; const a = art(), t = e.target;
  if (t.dataset.artf === 'sym') { a.sym = t.value; artSave(); }
  if (t.dataset.artf === 'grid') { a.grid = t.checked; document.querySelector('.sk-grid')?.classList.toggle('on', t.checked); artSave(); }
  if (t.dataset.artf === 'showGuide') { a.showGuide = t.checked; skDrawGuide(); artSave(); }
  if (t.dataset.artp && t.dataset.artp !== 'gridColor') { a.photo[t.dataset.artp] = t.type === 'checkbox' ? t.checked : t.value; artSave(); phDraw(); }
  if (t.dataset.artt) { a.timer[t.dataset.artt] = +t.value; artSave(); }
  if (t.dataset.artcat) { const cats = a.timer.cats, k = t.dataset.artcat; t.checked ? cats.includes(k) || cats.push(k) : cats.splice(cats.indexOf(k), 1); t.closest('label')?.classList.toggle('on', t.checked); artSave(); }
});
document.addEventListener('click', e => {   // photo color picker
  const c = e.target.closest?.('#phCanvas'); if (!c || view.name !== 'art') return;
  const r = c.getBoundingClientRect(), x = Math.round((e.clientX - r.left) * c.width / r.width), y = Math.round((e.clientY - r.top) * c.height / r.height), d = c.getContext('2d').getImageData(x, y, 1, 1).data, h = rgb2hex(d[0], d[1], d[2]);
  const out = document.getElementById('phPicked'); if (out) out.innerHTML = `<span class="ph-chip" style="background:${h}"></span><b>${h}</b> <button type="button" class="btn sm" data-art="pick" data-c="${h}">✏️ Use in sketchpad</button> <button type="button" class="btn sm ghost" data-art="copy" data-c="${h}">📋 Copy</button>`;
});
