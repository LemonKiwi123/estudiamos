'use strict';
/* ================= Scan text from a photo into a card =================
   📷 in the card editor → take or choose a photo → drag a box around the text → the text is read ON THIS DEVICE
   by Tesseract.js (lib/ocr, Apache-2.0; nothing is uploaded) → it goes into the box you were editing, looking close to
   the original: same line breaks, bigger lines stay bigger, colored ink keeps its color, thick text stays bold, and
   highlighter marks stay highlighted. */
const OCR_DIR = 'lib/ocr';
const OCR_LANGS = { es: 'spa', en: 'eng' };          // installed in lib/ocr/lang
const ocrLangFor = lang => OCR_LANGS[langBase(lang || '')] || 'eng';
const ocrWorkers = {};
let ocrLib = null, scan = null;

function ocrLoad() {
  return ocrLib ||= new Promise((ok, fail) => {
    if (window.Tesseract) return ok(window.Tesseract);
    const s = document.createElement('script'); s.src = `${OCR_DIR}/tesseract.min.js`;
    s.onload = () => ok(window.Tesseract); s.onerror = () => { ocrLib = null; fail(new Error('The text reader could not load')); };
    document.head.appendChild(s);
  });
}
async function ocrWorker(code, onProgress) {
  const T = await ocrLoad();
  ocrWorkers[code] ||= T.createWorker(code, 1, {
    workerPath: `${OCR_DIR}/worker.min.js`, corePath: OCR_DIR, langPath: `${OCR_DIR}/lang`, gzip: true, cacheMethod: 'none', workerBlobURL: false,
    logger: m => scan?.onLog?.(m),
  }).catch(e => { delete ocrWorkers[code]; throw e; });
  return ocrWorkers[code];
}

/* ---------- the scan sheet (its own layer, so the card you're editing stays open underneath) ---------- */
function scanOpen(edId) {
  const ed = document.getElementById(edId); if (!ed) return;
  scan = { edId, lang: ed.getAttribute('lang') || '', rich: ed.isContentEditable && ed.dataset.rich === '1', img: null, rot: 0, sel: null, keepStyle: true };
  // its own <dialog>, so it sits on top of the card editor (which is a dialog too) and stays clickable
  let el = $('#scanSheet');
  if (!el) { el = document.createElement('dialog'); el.id = 'scanSheet'; el.className = 'scan-sheet'; document.body.appendChild(el); el.addEventListener('close', () => { el.innerHTML = ''; scan = null; }); }
  scanPick();
  if (!el.open) el.showModal();
}
function scanClose() { const el = $('#scanSheet'); if (el?.open) el.close(); scan = null; }
function scanFrame(title, body, foot = '') {
  $('#scanSheet').innerHTML = `<div class="scan-panel" role="dialog" aria-label="${esc(title)}">
    <div class="scan-head"><b>${title}</b><button type="button" class="icon-btn" data-act="scanClose" title="Close">✕</button></div>
    <div class="scan-body">${body}</div>${foot ? `<div class="scan-foot">${foot}</div>` : ''}</div>`;
}
function scanPick() {
  const name = langName(scan.lang || 'en');
  scanFrame('📷 Scan text', `<p class="muted" style="margin:0 0 12px">Take a photo of a card, a page or a sign. The text is read on this device in <b>${esc(OCR_LANGS[langBase(scan.lang)] ? name : 'English')}</b> and nothing is uploaded.</p>
    ${OCR_LANGS[langBase(scan.lang)] ? '' : `<div class="banner" style="margin-bottom:12px"><span>Reading ${esc(name)} isn’t installed, so it will be read as English. Letters with accents may come out wrong.</span></div>`}
    <div class="scan-pick">
      <button type="button" class="btn primary big" data-act="scanFile" data-cam="1">📷 Take a photo</button>
      <button type="button" class="btn big" data-act="scanFile">🖼️ Choose a photo</button>
    </div>
    <p class="muted small" style="margin:14px 0 0">Tip: hold the phone straight above the card, in good light, and fill the screen with the text.</p>`);
}
function scanChooseFile(camera) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; if (camera) inp.setAttribute('capture', 'environment');
  inp.onchange = () => { const f = inp.files?.[0]; if (f) scanLoad(f); };
  inp.click();
}
async function scanLoad(file) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const k = Math.min(1, 2400 / Math.max(bmp.width, bmp.height)), c = document.createElement('canvas');   // big enough to read, small enough to be quick
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    Object.assign(scan, { img: c, rot: 0, sel: null }); scanCrop();
  } catch (e) { console.error(e); toast('That photo couldn’t be opened. Try another one.'); }
}
const scanRotated = () => {   // the photo turned by scan.rot quarter-turns
  const s = scan.img; if (!scan.rot) return s;
  const c = document.createElement('canvas'), odd = scan.rot % 2;
  c.width = odd ? s.height : s.width; c.height = odd ? s.width : s.height;
  const g = c.getContext('2d'); g.translate(c.width / 2, c.height / 2); g.rotate(scan.rot * Math.PI / 2); g.drawImage(s, -s.width / 2, -s.height / 2);
  return c;
};

/* ---------- crop: drag a box around the text ---------- */
function scanCrop() {
  scanFrame('✂️ Choose the text', `<p class="muted small" style="margin:0 0 8px">Drag a box around the text you want. Or read the whole photo.</p>
    <div class="scan-stage"><canvas id="scanCv"></canvas></div>`,
    `<button type="button" class="btn" data-act="scanRotate" title="Turn the photo">↻ Turn</button>
     <button type="button" class="btn" data-act="scanAgain">Another photo</button>
     <span style="flex:1"></span>
     <button type="button" class="btn" data-act="scanAll">Whole photo</button>
     <button type="button" class="btn primary" data-act="scanRead">Read text</button>`);
  const src = scan.src = scanRotated(), cv = $('#scanCv'), stage = cv.parentElement;
  const W = Math.min(stage.clientWidth || 640, 900), H = Math.min(window.innerHeight * 0.58, 700), k = Math.min(W / src.width, H / src.height);
  cv.width = Math.round(src.width * k); cv.height = Math.round(src.height * k); scan.k = k;
  scan.sel ||= { x: 0, y: 0, w: src.width, h: src.height };
  const draw = () => {
    const g = cv.getContext('2d'), s = scan.sel;
    g.drawImage(src, 0, 0, cv.width, cv.height);
    g.fillStyle = 'rgba(0,0,0,.45)'; g.beginPath(); g.rect(0, 0, cv.width, cv.height); g.rect(s.x * k, s.y * k, s.w * k, s.h * k); g.fill('evenodd');
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.setLineDash([6, 4]); g.strokeRect(s.x * k + 1, s.y * k + 1, s.w * k - 2, s.h * k - 2); g.setLineDash([]);
  };
  draw();
  let start = null;
  const at = e => { const r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(src.width, (e.clientX - r.left) / r.width * src.width)), Math.max(0, Math.min(src.height, (e.clientY - r.top) / r.height * src.height))]; };
  cv.onpointerdown = e => { cv.setPointerCapture(e.pointerId); start = at(e); e.preventDefault(); };
  cv.onpointermove = e => { if (!start) return; const [x, y] = at(e); scan.sel = { x: Math.min(x, start[0]), y: Math.min(y, start[1]), w: Math.abs(x - start[0]), h: Math.abs(y - start[1]) }; draw(); };
  cv.onpointerup = () => { if (start && (scan.sel.w < 12 || scan.sel.h < 12)) scan.sel = { x: 0, y: 0, w: src.width, h: src.height }; start = null; draw(); };
}

/* ---------- read: Tesseract on this device ---------- */
async function scanRead() {
  const s = scan.sel, src = scan.src, c = document.createElement('canvas');
  const up = Math.min(2.5, Math.max(1, 1400 / Math.max(s.w, s.h)));                       // small text reads better a bit bigger
  c.width = Math.round(s.w * up); c.height = Math.round(s.h * up);
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(src, s.x, s.y, s.w, s.h, 0, 0, c.width, c.height);
  scan.crop = c; scan.norm = scanFlatten(c);
  scanFrame('🔎 Reading…', `<div class="scan-reading"><div class="scan-prog"><i id="scanBar" style="width:3%"></i></div><div class="muted small" id="scanStep">Getting the text reader ready…</div></div>`);
  scan.onLog = m => {
    const bar = $('#scanBar'), step = $('#scanStep'); if (!bar) return;
    const loading = /load|initial/i.test(m.status || ''), p = loading ? 0.05 + 0.25 * (m.progress || 0) : 0.3 + 0.7 * (m.progress || 0);
    bar.style.width = Math.round(p * 100) + '%'; step.textContent = loading ? 'Getting the text reader ready… (the first time takes a few seconds)' : 'Reading the text…';
  };
  try {
    const w = await ocrWorker(ocrLangFor(scan.lang));
    const { data } = await w.recognize(scan.norm, {}, { text: true, blocks: true });
    if (!scan) return;
    scan.result = scanRebuild(data, c, scan.norm);
    scanShow();
  } catch (e) { console.error(e); if (scan) scanFrame('😕 Couldn’t read it', `<p>${esc(e.message || 'Something went wrong while reading the photo.')}</p>`, '<button type="button" class="btn" data-act="scanAgain">Try another photo</button>'); }
}

/* A clean black-on-white copy for the reader, made with plain pixel math (no canvas filters, so iPhones behave the same):
   1. grey; a mostly-dark card is flipped so text is dark-on-light
   2. colored bars with light text (a green header with white words…) are found and flipped on their own
   3. shadows and uneven light are evened out
   4. table borders, frames and rule lines are erased so they can't be read as letters */
function scanFlatten(c) {
  const w = c.width, h = c.height, src = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data, n = w * h;
  let G = new Uint8Array(n); for (let i = 0; i < n; i++) G[i] = (src[i * 4] * 77 + src[i * 4 + 1] * 150 + src[i * 4 + 2] * 29) >> 8;
  const shrink = (A, aw, ah, f) => { const sw = Math.max(1, Math.floor(aw / f)), sh = Math.max(1, Math.floor(ah / f)), S = new Uint8Array(sw * sh);
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { let t = 0; for (let dy = 0; dy < f; dy++) { const row = (y * f + dy) * aw + x * f; for (let dx = 0; dx < f; dx++) t += A[row + dx]; } S[y * sw + x] = t / (f * f); } return { S, sw, sh }; };
  const morph = (S, sw, sh, r, max) => { const pass = (A, horiz) => { const O = new Uint8Array(A.length);   // separable max/min filter
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { let m = max ? 0 : 255; for (let k = -r; k <= r; k++) { const xx = horiz ? Math.min(sw - 1, Math.max(0, x + k)) : x, yy = horiz ? y : Math.min(sh - 1, Math.max(0, y + k)), v = A[yy * sw + xx]; if (max ? v > m : v < m) m = v; } O[y * sw + x] = m; } return O; };
    return pass(pass(S, true), false); };
  const median = A => { const hst = new Uint32Array(256); for (let i = 0; i < A.length; i++) hst[A[i]]++; let t = 0; for (let v = 0; v < 256; v++) { t += hst[v]; if (t >= A.length / 2) return v; } return 128; };
  const grow = (S, sw, sh, W, H) => {   // smooth enlarge of a small grey map
    const a2 = document.createElement('canvas'); a2.width = sw; a2.height = sh; const g2 = a2.getContext('2d'), im = g2.createImageData(sw, sh);
    for (let i = 0; i < S.length; i++) { im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = S[i]; im.data[i * 4 + 3] = 255; } g2.putImageData(im, 0, 0);
    const b2 = document.createElement('canvas'); b2.width = W; b2.height = H; const g3 = b2.getContext('2d', { willReadFrequently: true }); g3.imageSmoothingEnabled = true; g3.imageSmoothingQuality = 'high'; g3.drawImage(a2, 0, 0, W, H);
    const d = g3.getImageData(0, 0, W, H).data, O = new Uint8Array(W * H); for (let i = 0; i < O.length; i++) O[i] = d[i * 4]; return O; };
  // even out the light of a dark-on-light grey picture: each pixel compared with the brightest "paper" around it
  const even = (A, aw, ah) => { const f = Math.max(2, Math.round(Math.max(aw, ah) / 90)); let { S, sw, sh } = shrink(A, aw, ah, f);
    S = morph(S, sw, sh, 2, true); const B = new Uint8Array(S.length);   // paper only, then a soft blur
    for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) { let t = 0, k = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < sw && yy < sh) { t += S[yy * sw + xx]; k++; } } B[y * sw + x] = t / k; }
    const L = grow(B, sw, sh, aw, ah), O = new Uint8Array(aw * ah); for (let i = 0; i < O.length; i++) { const v = A[i] / Math.max(40, L[i]) * 245; O[i] = v > 255 ? 255 : v; } return O; };

  // 1. light writing on a dark card: flip everything. Judged from the writing itself (are the thin strokes light or dark?),
  //    not from how dark the photo is - a white card on a dark table must NOT be flipped.
  const f1 = Math.max(2, Math.round(Math.max(w, h) / 400)), sm = shrink(G, w, h, f1);
  { const A = sm.S, hi = morph(A, sm.sw, sm.sh, 1, true), lo = morph(A, sm.sw, sm.sh, 1, false), busy = new Uint8Array(A.length);
    for (let i = 0; i < A.length; i++) busy[i] = hi[i] - lo[i] > 80 ? 255 : 0;                    // cells with writing (strong light/dark change)
    const near = morph(busy, sm.sw, sm.sh, 4, true), hst = new Uint32Array(256); let cnt = 0;     // ...and the area right around them
    for (let i = 0; i < A.length; i++) if (near[i]) { hst[A[i]]++; cnt++; }
    if (cnt > 20) { const at = q => { let t = 0; for (let v = 0; v < 256; v++) { t += hst[v]; if (t >= cnt * q) return v; } return 255; }, mid = (at(0.05) + at(0.95)) / 2;
      let darker = 0, lighter = 0; for (let v = 0; v < 256; v++) { if (v < mid) darker += hst[v]; else lighter += hst[v]; }
      if (darker > lighter * 1.3) { for (let i = 0; i < n; i++) G[i] = 255 - G[i]; for (let i = 0; i < A.length; i++) A[i] = 255 - A[i]; } } }
  // 2. dark bars with light text: remove thin light things (the words), then thin dark things (normal text) -> only solid dark areas are left
  const { S, sw, sh } = sm, solid = morph(morph(morph(morph(S, sw, sh, 3, false), sw, sh, 3, true), sw, sh, 3, true), sw, sh, 3, false);
  const paper = (() => { const hst = new Uint32Array(256); for (let i = 0; i < solid.length; i++) hst[solid[i]]++; let t = 0; for (let v = 255; v >= 0; v--) { t += hst[v]; if (t >= solid.length * 0.2) return v; } return 128; })();   // the light end of the photo
  const dark = new Uint8Array(sw * sh); for (let i = 0; i < dark.length; i++) dark[i] = solid[i] < paper - 55 ? 1 : 0;
  const tone = [0, 1, 2].map(k => { const ch = new Uint8Array(n); for (let i = 0; i < n; i++) ch[i] = src[i * 4 + k]; const t = shrink(ch, w, h, f1).S;
    return morph(morph(morph(morph(t, sw, sh, 3, false), sw, sh, 3, true), sw, sh, 3, true), sw, sh, 3, false); });
  // the color of a cell with its brightness taken out (so a shadow doesn't change it, but green vs brown does)
  const hue = i => { const l = Math.max(20, 0.3 * tone[0][i] + 0.59 * tone[1][i] + 0.11 * tone[2][i]); return [tone[0][i] / l, tone[1][i] / l, tone[2][i] / l]; };
  const hueGap = (a, b2) => Math.hypot(a[0] - b2[0], a[1] - b2[1], a[2] - b2[2]);
  const bars = [], seen = new Uint8Array(sw * sh), stack = new Int32Array(sw * sh), isDark = i => S[i] < paper - 55;
  for (let i0 = 0; i0 < dark.length; i0++) if (isDark(i0) && !seen[i0]) {
    // one area of the same color AND the same darkness (so the letters of a bold word stay separate shapes)
    let top = 0, area = 0, x0 = sw, y0 = sh, x1 = 0, y1 = 0, sum = 0; stack[top++] = i0; seen[i0] = 1; const cells = [], h0 = hue(i0);
    const ok = (i, from) => { if (!isDark(i) || seen[i] || Math.abs(S[i] - S[from]) >= 30) return false; const hi = hue(i); return hueGap(hi, hue(from)) < 0.15 && hueGap(hi, h0) < 0.3; };   // step by step, never across a change of color
    while (top) { const i = stack[--top], x = i % sw, y = (i - x) / sw; area++; sum += S[i]; cells.push(i); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x && ok(i - 1, i)) { seen[i - 1] = 1; stack[top++] = i - 1; } if (x < sw - 1 && ok(i + 1, i)) { seen[i + 1] = 1; stack[top++] = i + 1; }
      if (y && ok(i - sw, i)) { seen[i - sw] = 1; stack[top++] = i - sw; } if (y < sh - 1 && ok(i + sw, i)) { seen[i + sw] = 1; stack[top++] = i + sw; } }
    if (area < sw * sh * 0.012) continue;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, level = sum / area, N = bw * bh, grid = new Uint8Array(N);   // 1 = this area, 2 = outside it, 0 = enclosed inside it
    for (const i of cells) { const x = i % sw, y = (i - x) / sw; grid[(y - y0) * bw + x - x0] = 1; }
    { const q = []; const push = k => { if (!grid[k]) { grid[k] = 2; q.push(k); } };
      for (let x = 0; x < bw; x++) { push(x); push((bh - 1) * bw + x); } for (let y = 0; y < bh; y++) { push(y * bw); push(y * bw + bw - 1); }
      while (q.length) { const k = q.pop(), x = k % bw; if (x) push(k - 1); if (x < bw - 1) push(k + 1); if (k >= bw) push(k - bw); if (k < N - bw) push(k + bw); } }
    // how thick is the slab, and how thick is the light writing enclosed in it? (steps to the nearest edge)
    const dist = inside => { const D = new Uint16Array(N); for (let k = 0; k < N; k++) D[k] = inside(k) ? 9999 : 0;
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { const k = y * bw + x; if (!D[k]) continue; const l = x ? D[k - 1] : 0, u = y ? D[k - bw] : 0; D[k] = Math.min(D[k], l + 1, u + 1); }
      for (let y = bh - 1; y >= 0; y--) for (let x = bw - 1; x >= 0; x--) { const k = y * bw + x; if (!D[k]) continue; const r = x < bw - 1 ? D[k + 1] : 0, d2 = y < bh - 1 ? D[k + bw] : 0; D[k] = Math.min(D[k], r + 1, d2 + 1); }
      return D; };
    const dSlab = dist(k => grid[k] === 1), dHole = dist(k => grid[k] === 0);
    let slab = 0, hole = 0, writing = 0;
    for (let k = 0; k < N; k++) { if (grid[k] === 1 && dSlab[k] > slab) slab = dSlab[k];
      if (grid[k] === 0) { const i = (y0 + Math.floor(k / bw)) * sw + x0 + k % bw; if (S[i] > level + 45) { writing++; if (dHole[k] > hole) hole = dHole[k]; } } }
    // a real bar: a thick slab with thinner light writing enclosed in it (a fat "O" is a thin ring around a big hole; an "H" encloses nothing)
    if (writing >= area * 0.01 && slab >= 2 && slab >= hole * 1.5 && area / N >= 0.4) bars.push({ x: x0 * f1, y: y0 * f1, w: Math.min(w - x0 * f1, bw * f1), h: Math.min(h - y0 * f1, bh * f1) });
  }
  // 3. even the light; each bar is flipped and evened on its own, then put back in place
  const E = even(G, w, h);
  for (const r of bars) { const sub = new Uint8Array(r.w * r.h); for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) sub[y * r.w + x] = 255 - G[(r.y + y) * w + r.x + x];
    const ev = even(sub, r.w, r.h);
    { const q = []; const push = i => { if (ev[i] < 150) { ev[i] = 255; q.push(i); } };
      for (let x = 0; x < r.w; x++) { push(x); push((r.h - 1) * r.w + x); } for (let y = 0; y < r.h; y++) { push(y * r.w); push(y * r.w + r.w - 1); }
      while (q.length) { const i = q.pop(), x = i % r.w; if (x) push(i - 1); if (x < r.w - 1) push(i + 1); if (i >= r.w) push(i - r.w); if (i < r.w * (r.h - 1)) push(i + r.w); } }
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) E[(r.y + y) * w + r.x + x] = ev[y * r.w + x]; }
  // 4. erase long straight things (table borders, frames, the edges of bars): big connected shapes made mostly of long straight runs
  const ink = new Uint8Array(n), long = new Uint8Array(n), RUN = 26; for (let i = 0; i < n; i++) ink[i] = E[i] < 150 ? 1 : 0;
  for (let y = 0; y < h; y++) { let st = -1; for (let x = 0; x <= w; x++) { const on = x < w && ink[y * w + x]; if (on && st < 0) st = x; if (!on && st >= 0) { if (x - st >= RUN) for (let k = st; k < x; k++) long[y * w + k] = 1; st = -1; } } }
  for (let x = 0; x < w; x++) { let st = -1; for (let y = 0; y <= h; y++) { const on = y < h && ink[y * w + x]; if (on && st < 0) st = y; if (!on && st >= 0) { if (y - st >= RUN) for (let k = st; k < y; k++) long[k * w + x] = 1; st = -1; } } }
  const lab = new Uint8Array(n), stk = new Int32Array(n);
  for (let i0 = 0; i0 < n; i0++) if (ink[i0] && !lab[i0]) {
    let top = 0, x0 = w, y0 = h, x1 = 0, y1 = 0, area = 0, lg = 0, edge = 0; const cells = []; stk[top++] = i0; lab[i0] = 1;
    while (top) { const i = stk[--top], x = i % w, y = (i - x) / w; area++; lg += long[i]; cells.push(i); if (!x || x === w - 1 || !y || y === h - 1 || !ink[i - 1] || !ink[i + 1] || !ink[i - w] || !ink[i + w]) edge++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x && ink[i - 1] && !lab[i - 1]) { lab[i - 1] = 1; stk[top++] = i - 1; } if (x < w - 1 && ink[i + 1] && !lab[i + 1]) { lab[i + 1] = 1; stk[top++] = i + 1; }
      if (y && ink[i - w] && !lab[i - w]) { lab[i - w] = 1; stk[top++] = i - w; } if (y < h - 1 && ink[i + w] && !lab[i + w]) { lab[i + w] = 1; stk[top++] = i + w; } }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, big = bw >= Math.max(110, w * 0.22) || bh >= Math.max(110, h * 0.22), thin = Math.max(bw, bh) >= 60 && Math.max(bw, bh) / Math.min(bw, bh) >= 9;
    const pen = edge ? 2 * area / edge : 99;   // how thick the strokes are: borders are thin, the letters of a huge word are fat
    if ((big || thin) && lg / area >= 0.5 && pen <= Math.max(8, Math.max(w, h) * 0.008)) for (const i of cells) { E[i] = 255; if (i % w) E[i - 1] = Math.max(E[i - 1], 235); if (i % w < w - 1) E[i + 1] = Math.max(E[i + 1], 235); if (i >= w) E[i - w] = Math.max(E[i - w], 235); if (i < n - w) E[i + w] = Math.max(E[i + w], 235); }
  }
  const out = document.createElement('canvas'); out.width = w; out.height = h; const o = out.getContext('2d', { willReadFrequently: true }), im = o.createImageData(w, h);
  for (let i = 0; i < n; i++) { im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = E[i]; im.data[i * 4 + 3] = 255; } o.putImageData(im, 0, 0);
  return out;
}

/* Drop bits that aren't really words: lines like "|" from a card's edge, and stray single letters at the very start
   or end of a line that sit right at the photo's edge or far from the next word. */
function scanTidyLine(words, W) {
  let ws = words.filter(w => !/^[|_~=+<>\\/¦‖—–-]+$/.test(w.text.trim()));
  if (ws.length < 2) return ws;
  const gaps = []; for (let i = 1; i < ws.length; i++) gaps.push(ws[i].bbox.x0 - ws[i - 1].bbox.x1);
  const gap = gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)] || 0, h = ws.map(w => w.bbox.y1 - w.bbox.y0).sort((a, b) => a - b)[Math.floor(ws.length / 2)] || 1;
  // a single character that's off on its own; real one-letter words (y, o, a, e, u, I, numbers) only go if they're both at the edge AND far away
  const stray = (w, near, edge) => { const t = w.text.trim(), far = near > Math.max(gap * 2.5, h * 1.2);
    if (t.length !== 1) return false;
    return /^[yoaeuiàéóáúü0-9]$/i.test(t) ? edge && far : edge || far; };
  if (stray(ws[0], ws[1].bbox.x0 - ws[0].bbox.x1, ws[0].bbox.x0 < W * 0.04)) ws = ws.slice(1);
  if (ws.length > 1 && stray(ws[ws.length - 1], ws[ws.length - 1].bbox.x0 - ws[ws.length - 2].bbox.x1, ws[ws.length - 1].bbox.x1 > W * 0.96)) ws = ws.slice(0, -1);
  return ws;
}
/* ---------- rebuild the look: line breaks, sizes, colors, bold, highlights ---------- */
function scanRebuild(data, cv, norm) {
  const g = cv.getContext('2d', { willReadFrequently: true }), gn = (norm || cv).getContext('2d', { willReadFrequently: true }), lines = [];
  // every word the reader found, minus the ones it was almost guessing at (specks, bits of borders…)
  const all = [];
  for (const b of data.blocks || []) for (const p of b.paragraphs || []) for (const l of p.lines || []) for (const w of l.words || []) {
    const t = (w.text || '').trim(); if (!t) continue;
    if (w.confidence < 15 || (w.confidence < 40 && (t.length <= 2 || !/[\p{L}\p{N}]/u.test(t)))) continue;
    all.push(w);
  }
  // put the words back into rows by where they sit on the photo, so a table reads across the way it looks
  const slopes = []; for (const b of data.blocks || []) for (const p of b.paragraphs || []) for (const l of p.lines || []) { const bl = l.baseline; if (bl && bl.x1 - bl.x0 > 80) slopes.push((bl.y1 - bl.y0) / (bl.x1 - bl.x0)); }
  slopes.sort((p, q) => p - q); const slant = slopes.length ? Math.max(-0.2, Math.min(0.2, slopes[Math.floor(slopes.length / 2)])) : 0;
  const level = w => (w.bbox.y0 + w.bbox.y1) / 2 - slant * (w.bbox.x0 + w.bbox.x1) / 2;   // a word's height on the page, with the slant taken out
  const rows = [];
  for (const w of all.slice().sort((p, q) => level(p) - level(q))) {
    const yc = level(w), hw = w.bbox.y1 - w.bbox.y0;
    const row = rows.find(r => Math.abs(yc - r.yc) < Math.min(hw, r.h) * 0.5);
    if (row) { row.words.push(w); row.yc = row.words.reduce((t, x) => t + level(x), 0) / row.words.length; row.h = Math.max(row.h, hw); row.y1 = Math.max(row.y1, w.bbox.y1); }
    else rows.push({ words: [w], yc, h: hw, y0: w.bbox.y0, y1: w.bbox.y1 });
  }
  rows.sort((p, q) => p.yc - q.yc);
  let prev = null;
  for (const r of rows) {
    const words = scanTidyLine(r.words.sort((p, q) => p.bbox.x0 - q.bbox.x0), cv.width); if (!words.length) continue;
    if (words.length === 1 && words[0].text.trim().length === 1 && all.length > 3 && words[0].confidence < 90) continue;   // a lone stray letter on its own line
    if (prev && r.y0 - prev.y1 > Math.min(r.h, prev.h) * 1.1) lines.push({ gap: true });   // a clear empty space = a blank line
    lines.push({ words, h: r.h }); prev = r;
  }
  const real = lines.filter(l => !l.gap); if (!real.length) return { html: '', text: '', words: 0 };
  const med = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)] || 0; };
  const low = a => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)] || 0; };   // "normal" text: titles and bold are the exceptions
  /* Look at the pixels of every word:
     - background = the most common color in the word's box (so a highlighter block counts as background, not ink)
     - ink = pixels much darker/more different than that background (at least half as different as the strongest pixel)
     - from the ink: its color, how tall it is (true letter size) and how thick the pen strokes are (bold) */
  const px = (w) => {
    const { x0, y0, x1, y1 } = w.bbox, ww = Math.max(1, x1 - x0), hh = Math.max(1, y1 - y0), n = ww * hh;
    const d = g.getImageData(x0, y0, ww, hh).data, nd = gn.getImageData(x0, y0, ww, hh).data;   // d: real colors · nd: even-light grey
    // ink from the even-light grey copy: the most common grey is the paper, the darkest is the ink
    const gh = new Uint32Array(256); for (let i = 0; i < n; i++) gh[nd[i * 4]]++;
    const pct = q => { let t = 0; for (let v = 0; v < 256; v++) { t += gh[v]; if (t >= n * q) return v; } return 255; };
    const paper = pct(0.92), mn = pct(0.03);   // paper = the light end, ink = the dark end (a fat bold word can be more ink than paper)
    const cut0 = (paper + mn) / 2; let br = 0, bgc = 0, bb = 0, bn = 0;
    for (let i = 0; i < n; i++) if (nd[i * 4] >= cut0 + (paper - cut0) * 0.5 || paper - mn < 60) { br += d[i * 4]; bgc += d[i * 4 + 1]; bb += d[i * 4 + 2]; bn++; }
    const bg = bn ? [br, bgc, bb].map(v => Math.round(v / bn)) : [255, 255, 255];
    if (paper - mn < 60) return { bg, col: null, top: y0, bot: y1, stroke: 0 };
    const cut = (paper + mn) / 2, deep = mn + (paper - mn) * 0.35, ink = new Uint8Array(n); let area = 0, edges = 0, t = hh, bt = 0, cr = 0, cg = 0, cb = 0, cn = 0;
    for (let i = 0; i < n; i++) if (nd[i * 4] < cut) { ink[i] = 1; area++; const y = Math.floor(i / ww); if (y < t) t = y; if (y > bt) bt = y; if (nd[i * 4] < deep) { cr += d[i * 4]; cg += d[i * 4 + 1]; cb += d[i * 4 + 2]; cn++; } }
    for (let i = 0; i < n; i++) if (ink[i]) { const x = i % ww, y = (i - x) / ww; if (!x || !y || x === ww - 1 || y === hh - 1 || !ink[i - 1] || !ink[i + 1] || !ink[i - ww] || !ink[i + ww]) edges++; }
    return { bg, col: cn ? [cr, cg, cb].map(v => Math.round(v / cn)) : null, top: y0 + t, bot: y0 + bt, stroke: edges ? 2 * area / edges : 0 };
  };
  const hex = c => '#' + c.map(v => Math.min(255, Math.round(v / 16) * 16).toString(16).padStart(2, '0')).join('');   // rounded, so words in the same ink match
  const info = [], lumOf = c => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
  for (const l of real) { for (const w of l.words) w.px = px(w); l.words = l.words.filter(w => w.px.col && w.px.stroke > 0 && Math.abs(lumOf(w.px.col) - lumOf(w.px.bg)) >= 40); }
  for (let i = lines.length - 1; i >= 0; i--) if (!lines[i].gap && !lines[i].words.length) lines.splice(i, 1);
  for (let i = real.length - 1; i >= 0; i--) if (!real[i].words.length) real.splice(i, 1);
  if (!real.length) return { html: '', text: '', words: 0 };
  for (const l of real) { for (const w of l.words) info.push(w); l.ext = Math.max(...l.words.map(w => w.px.bot)) - Math.min(...l.words.map(w => w.px.top)); for (const w of l.words) w.sn = l.ext ? w.px.stroke / l.ext : 0; }
  const H = low(real.map(l => l.ext)), page = [0, 1, 2].map(k => med(info.map(w => w.px.bg[k]))), strokeMed = low(info.map(w => w.sn).filter(Boolean));
  const style = w => {
    const st = {}, { col, bg } = w.px;
    // "how colorful": the gap between the strongest and weakest of red/green/blue (paper grain and grey ink stay low)
    const chroma = c => Math.max(...c) - Math.min(...c), lum = c => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
    if (col && chroma(col) >= 55 && lum(col) > 35 && lum(col) < 225) st.color = hex(col);               // colored ink (not black, grey or white)
    const off = Math.hypot(bg[0] - page[0], bg[1] - page[1], bg[2] - page[2]);
    if (off > 45 && (chroma(bg) >= 50 || lum(bg) < 100)) {   // highlighter marker, or a colored/dark bar behind the words
      st.bg = hex(bg.map(v => Math.min(255, Math.round(v / 32) * 32)));   // (rounded more, so one stroke of marker stays one color)
      if (col && lum(col) - lum(bg) > 60) st.color = lum(col) > 165 && chroma(col) < 45 ? '#ffffff' : hex(col);   // light words on a dark bar stay light, so they can be read
    }
    if (info.length >= 3 && strokeMed && w.sn > strokeMed * (w.lineBold ? 1.1 : 1.3)) st.bold = true;   // noticeably thicker pen strokes than normal text
    return st;
  };
  // when most of a line is bold, its short words (like "El") count as bold too
  for (const l of real) { const b = l.words.filter(w => info.length >= 3 && strokeMed && w.sn > strokeMed * 1.3).length; if (b / l.words.length >= 0.5) l.words.forEach(w => { w.lineBold = true; }); }
  // one bar, one color: neighbouring words that sit on a bar all take the bar's middle color
  for (const l of real) { let i = 0; while (i < l.words.length) { if (!style(l.words[i]).bg) { i++; continue; } let j = i; while (j < l.words.length && style(l.words[j]).bg) j++;
      const grp = l.words.slice(i, j), mid = [0, 1, 2].map(k => med(grp.map(w => w.px.bg[k]))); grp.forEach(w => { w.px.bg = mid; }); i = j; } }
  const sizeFor = h => { const r = H ? h / H : 1; return r >= 1.8 ? '2em' : r >= 1.4 ? '1.5em' : r >= 1.15 ? '1.25em' : r <= 0.72 ? '0.8em' : ''; };
  let html = '', text = '', count = 0, unsure = 0;
  for (const l of lines) {
    if (l.gap) { html += '<br>'; text += '\n'; continue; }
    const size = sizeFor(l.ext); let lineHtml = '', run = null;
    const flush = () => { if (!run) return; const css = [run.st.color && `color:${run.st.color}`, run.st.bg && `background-color:${run.st.bg}`, run.st.bold && 'font-weight:bold'].filter(Boolean).join(';');
      lineHtml += css ? `<span style="${css}">${run.t}</span>` : run.t; run = null; };
    l.words.forEach((w, i) => {
      const st = style(w), key = JSON.stringify(st), t = (i ? ' ' : '') + `<span class="scan-w${w.confidence < 60 ? ' unsure' : ''}">${esc(w.text)}</span>`;
      count++; if (w.confidence < 60) unsure++;
      if (run && run.key === key) run.t += t; else { flush(); run = { key, st, t }; }
    });
    flush();
    html += (html && !html.endsWith('<br>') ? '<br>' : '') + (size ? `<span style="font-size:${size}">${lineHtml}</span>` : lineHtml);
    text += (text && !text.endsWith('\n') ? '\n' : '') + l.words.map(w => w.text).join(' ');
  }
  return { html: html.replace(/(<br>)+$/, ''), text: text.trim(), words: count, unsure };
}
const scanFinalHtml = (r, keepStyle) => {
  const box = document.createElement('div'); box.innerHTML = r.html;
  box.querySelectorAll('.scan-w').forEach(w => w.replaceWith(...w.childNodes));
  if (!keepStyle) return esc(r.text).replace(/\n/g, '<br>');
  return cleanHtml(box.innerHTML, { rich: true, pictures: false });
};

/* ---------- preview, then put it in the card ---------- */
function scanShow() {
  const r = scan.result;
  if (!r.words) return scanFrame('🤔 No text found', '<p>I couldn’t find any words in that part of the photo. Try a closer, brighter photo, or a smaller box around the text.</p>',
    '<button type="button" class="btn" data-act="scanBackCrop">Change the box</button><button type="button" class="btn primary" data-act="scanAgain">Another photo</button>');
  scanFrame('✅ Here’s what I read', `
    ${scan.rich ? `<label class="row" style="gap:8px;font-weight:400;margin-bottom:8px"><input type="checkbox" id="scanKeep" ${scan.keepStyle ? 'checked' : ''}> Keep the look (sizes, colors, bold and highlights)</label>` : '<p class="muted small" style="margin:0 0 8px">This deck has formatting turned off, so the text goes in as plain text with the same line breaks.</p>'}
    <div class="scan-preview rich" id="scanPrev" lang="${esc(scan.lang)}">${scan.rich && scan.keepStyle ? r.html : esc(r.text).replace(/\n/g, '<br>')}</div>
    <p class="muted small" style="margin:8px 0 0">${r.words} word${r.words === 1 ? '' : 's'} found${r.unsure ? ` · <span class="scan-w unsure">${r.unsure} underlined</span> word${r.unsure === 1 ? '' : 's'} might be wrong, so check ${r.unsure === 1 ? 'it' : 'them'} after inserting` : ''}. You can edit everything in the card afterwards.</p>`,
    `<button type="button" class="btn" data-act="scanBackCrop">Change the box</button><span style="flex:1"></span><button type="button" class="btn primary" data-act="scanInsert">Put it in the card</button>`);
  const k = $('#scanKeep'); if (k) k.onchange = () => { scan.keepStyle = k.checked; $('#scanPrev').innerHTML = k.checked ? r.html : esc(r.text).replace(/\n/g, '<br>'); };
}
function scanInsert() {
  const r = scan.result, edId = scan.edId, rich = scan.rich, keep = scan.keepStyle, ed = document.getElementById(edId);
  scanClose();   // close first: while the scan window is open, the editor underneath can't take the text
  if (!ed) return toast('The card editor was closed');
  if (!ed.isContentEditable) {   // plain text box
    const a = ed.selectionStart ?? ed.value.length, b = ed.selectionEnd ?? a;
    ed.value = ed.value.slice(0, a) + (a && !/\s$/.test(ed.value.slice(0, a)) ? '\n' : '') + r.text + ed.value.slice(b); ed.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    const html = rich ? scanFinalHtml(r, keep) : esc(r.text).replace(/\n/g, '<br>');
    const empty = !ed.textContent.trim() && !ed.querySelector('img');
    restoreRange(edId);
    if (!document.execCommand('insertHTML', false, (empty ? '' : '<br>') + html)) ed.insertAdjacentHTML('beforeend', (empty ? '' : '<br>') + html);   // fallback: add at the end
  }
  toast(`📷 Added ${r.words} word${r.words === 1 ? '' : 's'} from the photo`);
}
Object.assign(actions, {
  edScan: el => scanOpen(el.dataset.ed),
  scanClose: () => scanClose(),
  scanFile: el => scanChooseFile(!!el.dataset.cam),
  scanAgain: () => { scan.img = null; scan.sel = null; scanPick(); },
  scanRotate: () => { scan.rot = (scan.rot + 1) % 4; scan.sel = null; scanCrop(); },
  scanAll: () => { scan.sel = { x: 0, y: 0, w: scan.src.width, h: scan.src.height }; scanRead(); },
  scanRead: () => scanRead(),
  scanBackCrop: () => scanCrop(),
  scanInsert: () => scanInsert(),
});
