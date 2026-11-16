'use strict';
/* ================= 🎲 Random shape generator (Art studio) =================
   Makes a surprise shape to turn into a drawing: a blob, a pile of geometric shapes, a gesture line or a silhouette.
   "What could it be?" gives an idea, and "Draw on it" sends it to the sketchpad as a light shape to draw over. */
const SH_W = 900, SH_H = 600;
const SH_KINDS = [['blob', '🫧 Blob'], ['geo', '🔷 Geometric'], ['line', '〰️ Gesture line'], ['sil', '👤 Silhouette'], ['ink', '💧 Ink blot']];
const SH_IDEAS = ['an animal', 'a monster', 'a cloud with a face', 'a hat', 'a bird in flight', 'a building', 'a vehicle', 'a plant', 'a fish', 'a mountain', 'a dragon', 'a robot', 'a bug', 'a piece of fruit', 'a sleeping cat', 'a shoe', 'an island map', 'a spaceship', 'a character’s hair', 'a teapot'];
let shSeed = Date.now();
const shRand = () => { shSeed = (shSeed * 1664525 + 1013904223) % 4294967296; return shSeed / 4294967296; };   // repeatable for one shape
function shBlob(g, cx, cy, r, pts, wob) {   // a smooth closed blob through random points around a circle
  const p = Array.from({ length: pts }, (_, i) => { const a = i / pts * Math.PI * 2, rr = r * (1 - wob / 2 + shRand() * wob); return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; });
  g.beginPath(); const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; let m = mid(p[pts - 1], p[0]); g.moveTo(...m);
  for (let i = 0; i < pts; i++) { const c = p[i], n = p[(i + 1) % pts]; m = mid(c, n); g.quadraticCurveTo(c[0], c[1], m[0], m[1]); } g.closePath();
}
function shDraw(g, o) {
  shSeed = o.seed; g.save(); g.fillStyle = '#fff'; g.fillRect(0, 0, SH_W, SH_H);
  const col = o.color || '#222', fill = o.style !== 'outline'; g.fillStyle = col; g.strokeStyle = col; g.lineWidth = o.style === 'outline' ? 4 : 2; g.lineJoin = g.lineCap = 'round';
  const paint = () => { fill ? g.fill() : g.stroke(); };
  const n = o.count || 1, cx = SH_W / 2, cy = SH_H / 2, base = Math.min(SH_W, SH_H) * 0.33;
  if (o.kind === 'blob') for (let i = 0; i < n; i++) { const bx = cx + (shRand() - .5) * base * (n > 1 ? 1.4 : 0.2), by = cy + (shRand() - .5) * base * (n > 1 ? 0.9 : 0.2), br = base * (n > 1 ? 0.5 : 0.85) * (0.7 + shRand() * 0.5);
    shBlob(g, bx, by, br, 6 + Math.floor(shRand() * 6), 0.4 + o.wild / 100); paint();
    for (let j = 0, lumps = 1 + Math.floor(shRand() * (2 + o.wild / 30)); j < lumps; j++) { const a = shRand() * Math.PI * 2; shBlob(g, bx + Math.cos(a) * br * 0.8, by + Math.sin(a) * br * 0.75, br * (0.25 + shRand() * 0.3), 6, 0.5); paint(); } }   // lumps make it look like something
  else if (o.kind === 'geo') for (let i = 0; i < n + 2; i++) { const x = cx + (shRand() - .5) * base * 1.5, y = cy + (shRand() - .5) * base * 1.1, s = base * (0.3 + shRand() * 0.6), t = Math.floor(shRand() * 4);
    g.save(); g.translate(x, y); g.rotate((shRand() - .5) * Math.PI * o.wild / 100); g.beginPath();
    if (t === 0) g.rect(-s / 2, -s / 3, s, s * (0.4 + shRand() * 0.6)); else if (t === 1) g.arc(0, 0, s / 2, 0, 7); else if (t === 2) { g.moveTo(0, -s / 2); g.lineTo(s / 2, s / 2); g.lineTo(-s / 2, s / 2); g.closePath(); } else { g.ellipse(0, 0, s / 2, s / 4, 0, 0, 7); }
    if (fill) { g.globalAlpha = 0.85; g.fill(); g.globalAlpha = 1; } else g.stroke(); g.restore(); }
  else if (o.kind === 'line') for (let i = 0; i < n; i++) { g.beginPath(); let x = 80 + shRand() * 120, y = 150 + shRand() * 300; g.moveTo(x, y); g.lineWidth = 6 + shRand() * 4;
    for (let k = 0; k < 4; k++) { const nx = x + 120 + shRand() * 80, ny = 100 + shRand() * 400; g.bezierCurveTo(x + 60, y + (shRand() - .5) * 400 * o.wild / 100 + 50, nx - 60, ny - (shRand() - .5) * 300, nx, ny); x = nx; y = ny; } g.stroke(); }
  else if (o.kind === 'sil') { const body = base * 1.0; shBlob(g, cx, cy + 30, body * 0.75, 8, 0.35 + o.wild / 200); paint();
    for (let i = 0; i < 2 + n; i++) { const a = shRand() * Math.PI * 2, d = body * 0.7; shBlob(g, cx + Math.cos(a) * d, cy + 30 + Math.sin(a) * d * 0.8, body * (0.2 + shRand() * 0.25), 6, 0.6); paint(); } }
  else { for (let i = 0; i < 3 + n * 3; i++) { const a = shRand() * Math.PI * 2, d = shRand() * base * 0.9; shBlob(g, cx + Math.cos(a) * d * 1.3, cy + Math.sin(a) * d, base * (0.12 + shRand() * 0.35), 7, 0.8); paint(); }
    g.save(); g.translate(SH_W, 0); g.scale(-1, 1); g.globalCompositeOperation = 'source-over'; const img = g.getImageData(0, 0, SH_W / 2, SH_H); g.restore();   // ink blots are mirrored, like folded paper
    const c = document.createElement('canvas'); c.width = SH_W / 2; c.height = SH_H; c.getContext('2d').putImageData(img, 0, 0); g.save(); g.translate(SH_W, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); g.restore(); }
  g.restore();
}
function shOpt() { const a = art(); a.sh ||= { kind: 'blob', count: 1, wild: 40, style: 'fill', color: '#222222', seed: Date.now(), idea: SH_IDEAS[0] }; return a.sh; }
function shapesHtml() {
  const o = shOpt();
  return `<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">${SH_KINDS.map(([k, l]) => `<button type="button" class="btn sm ${o.kind === k ? 'primary' : ''}" data-sh="kind" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="row" style="gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:8px">
      <label class="sk-ctl">How many <input type="range" min="1" max="6" value="${o.count}" data-sho="count"><b data-shv="count">${o.count}</b></label>
      <label class="sk-ctl">How wild <input type="range" min="0" max="100" value="${o.wild}" data-sho="wild"><b data-shv="wild">${o.wild}%</b></label>
      <div class="seg-btns">${[['fill', 'Solid'], ['outline', 'Outline']].map(([k, l]) => `<button type="button" class="btn sm ${o.style === k ? 'primary' : ''}" data-sh="style" data-k="${k}">${l}</button>`).join('')}</div>
      <label class="sk-ctl">Color <input type="color" value="${o.color}" data-sho="color"></label></div>
    <div class="sk-wrap"><canvas id="shCanvas" width="${SH_W}" height="${SH_H}" aria-label="A random shape"></canvas></div>
    <div class="sh-idea">💡 What could it be? Maybe <b id="shIdea">${esc(o.idea)}</b> <button type="button" class="btn sm ghost" data-sh="idea">🔁 Another idea</button></div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn primary" data-sh="new">🎲 New shape</button>
      <button type="button" class="btn" data-sh="draw" title="Open it in the sketchpad, faint, to draw over">✏️ Draw on it in the sketchpad</button><button type="button" class="btn" data-sh="png">⬇️ Save picture</button></div>
    <p class="muted small" style="margin:8px 0 0">Turn the shape into something: look at it, turn your head, and add eyes, legs, windows or leaves. There are no wrong answers.</p>`;
}
function shRedraw() { const c = document.getElementById('shCanvas'); if (c) shDraw(c.getContext('2d'), shOpt()); }
document.addEventListener('click', e => {
  const b = e.target.closest('[data-sh]'); if (!b || view.name !== 'art') return; const o = shOpt(), k = b.dataset.k;
  switch (b.dataset.sh) {
    case 'kind': o.kind = k; o.seed = Date.now(); break;
    case 'style': o.style = k; break;
    case 'new': o.seed = Math.floor(Math.random() * 4e9); o.idea = SH_IDEAS[Math.floor(Math.random() * SH_IDEAS.length)]; artSave(); shRedraw(); const i = document.getElementById('shIdea'); if (i) i.textContent = o.idea; return;
    case 'idea': o.idea = SH_IDEAS.filter(x => x !== o.idea)[Math.floor(Math.random() * (SH_IDEAS.length - 1))]; artSave(); document.getElementById('shIdea').textContent = o.idea; return;
    case 'png': { const l = document.createElement('a'); l.href = document.getElementById('shCanvas').toDataURL('image/png'); l.download = 'Random shape.png'; l.click(); return; }
    case 'draw': {   // the shape, faint, as the sketchpad picture (any canvas size)
      const a = art(), w = a.cw || 1200, h = a.ch || 800, c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
      const src = document.getElementById('shCanvas'), sc = Math.min(w / SH_W, h / SH_H); g.globalAlpha = 0.28; g.drawImage(src, (w - SH_W * sc) / 2, (h - SH_H * sc) / 2, SH_W * sc, SH_H * sc);
      a.animMode = false; a.drawing = c.toDataURL('image/png'); a.tab = 'sketch'; artSave(); toast(`✏️ Draw ${o.idea} over the shape!`); return render(); }
    default: return;
  }
  artSave(); artRedraw();
});
document.addEventListener('input', e => { const k = e.target.dataset?.sho; if (!k || view.name !== 'art') return; const o = shOpt(); o[k] = k === 'color' ? e.target.value : +e.target.value;
  const v = document.querySelector(`[data-shv="${k}"]`); if (v) v.textContent = o[k] + (k === 'wild' ? '%' : ''); artSave(); shRedraw(); });
