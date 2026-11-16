'use strict';
/* ================= 🎞️ Flip book (frame-by-frame animation) and 🎬 animation guides =================
   Draw a frame, add the next one and draw again: the last frame shows faintly underneath ("onion skin")
   so you can see what to change. Play it back at any speed, loop it, and save it as a video.
   Frames are kept on this device (browser storage). */
const FB_W = 480, FB_H = 320, FB_MAX = 120, FB_KEY = 'estudiamos.flipbook';
const fb = { frames: [], i: 0, playing: false, timer: 0, ctx: null, cv: null, down: false, last: null, undo: [], loaded: false };
const fbOpt = () => { const a = art(); a.fb ||= { fps: 8, loop: true, onion: 1, next: false, paper: '#fffdf5', pen: '#1c1b19', size: 3, tool: 'pen' }; return a.fb; };
const FB_PENS = ['#1c1b19', '#e8132f', '#1f5fd6', '#2bb24c', '#ff8c1a', '#8a3fd1', '#ffffff'];
const FB_PAPERS = [['#fffdf5', 'Paper'], ['#ffffff', 'White'], ['#fff3c4', 'Yellow'], ['#e6f0ff', 'Blue'], ['#2b2b2b', 'Dark']];
function fbBlank() { const c = document.createElement('canvas'); c.width = FB_W; c.height = FB_H; return c; }   // frames are transparent; the paper is drawn under them
function fbLoad() {
  if (fb.loaded) return; fb.loaded = true;
  let saved = null; try { saved = JSON.parse(localStorage.getItem(FB_KEY) || 'null'); } catch {}
  if (saved?.frames?.length) { fb.frames = saved.frames.map(() => fbBlank()); saved.frames.forEach((url, i) => { if (!url) return; const img = new Image(); img.onload = () => { fb.frames[i].getContext('2d').drawImage(img, 0, 0); if (i === fb.i || Math.abs(i - fb.i) === 1) fbPaint(); fbThumbs(); }; img.src = url; }); }
  else fb.frames = [fbBlank()];
}
function fbStore() {
  clearTimeout(fbStore.t); fbStore.t = setTimeout(() => {
    try { localStorage.setItem(FB_KEY, JSON.stringify({ frames: fb.frames.map(c => c.toDataURL('image/png')) })); }
    catch { toast('This flip book is too big to keep on this device. Save it as a video to keep it.'); }
  }, 600);
}
function flipHtml() {
  fbLoad(); const o = fbOpt(), n = fb.frames.length;
  return `<div class="fb">
    <div class="fb-bar">
      <button type="button" class="btn ${fb.playing ? '' : 'primary'}" data-fb="play">${fb.playing ? '⏹ Stop' : '▶ Play'}</button>
      <label class="sk-ctl">Speed <input type="range" min="1" max="24" value="${o.fps}" data-fbo="fps"><b data-fbv="fps">${o.fps}</b> fps</label>
      <label class="row small" style="gap:4px"><input type="checkbox" data-fbo="loop" ${o.loop ? 'checked' : ''}> Loop</label>
      <label class="sk-ctl">Onion skin <select class="inp" data-fbo="onion" style="margin:0;width:auto">${[[0, 'Off'], [1, '1 frame back'], [2, '2 frames back']].map(([v, l]) => `<option value="${v}" ${+o.onion === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <label class="row small" style="gap:4px"><input type="checkbox" data-fbo="next" ${o.next ? 'checked' : ''}> Show next frame</label>
    </div>
    <div class="fb-main">
      <div class="fb-tools">
        ${[['pen', '✏️', 'Pen'], ['eraser', '🧽', 'Eraser']].map(([k, e, l]) => `<button type="button" class="fb-tool ${o.tool === k ? 'on' : ''}" data-fb="tool" data-k="${k}" title="${l}">${e}</button>`).join('')}
        <div class="fb-sizes">${[1, 3, 6, 12].map(s => `<button type="button" class="${o.size === s ? 'on' : ''}" data-fb="size" data-k="${s}" title="${s} px"><i style="width:${Math.max(3, s)}px;height:${Math.max(3, s)}px"></i></button>`).join('')}</div>
        <div class="fb-pens">${FB_PENS.map(c => `<button type="button" class="${o.pen === c ? 'on' : ''}" style="background:${c}" data-fb="pen" data-k="${c}" title="${c}"></button>`).join('')}</div>
        <button type="button" class="fb-tool" data-fb="undo" title="Undo on this frame">↩️</button>
        <button type="button" class="fb-tool" data-fb="clearF" title="Clear this frame">🧹</button>
      </div>
      <div class="fb-stage" style="background:${o.paper}"><canvas id="fbCanvas" width="${FB_W}" height="${FB_H}" aria-label="Frame ${fb.i + 1}"></canvas><div class="fb-count">${fb.i + 1} / ${n}</div></div>
    </div>
    <div class="fb-frames" id="fbFrames"></div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">
      <button type="button" class="btn sm" data-fb="prev" title="Previous frame (←)">◀ Back</button><button type="button" class="btn sm" data-fb="next" title="Next frame (→)">Next ▶</button>
      <button type="button" class="btn sm primary" data-fb="add" ${n >= FB_MAX ? 'disabled' : ''}>＋ New frame</button>
      <button type="button" class="btn sm" data-fb="dup" ${n >= FB_MAX ? 'disabled' : ''}>⧉ Copy this frame</button>
      <button type="button" class="btn sm" data-fb="moveL" ${fb.i ? '' : 'disabled'}>⇠ Move earlier</button><button type="button" class="btn sm" data-fb="moveR" ${fb.i < n - 1 ? '' : 'disabled'}>Move later ⇢</button>
      <button type="button" class="btn sm ghost" data-fb="del" ${n > 1 ? '' : 'disabled'}>🗑️ Delete frame</button>
      <select class="inp" data-fbo="paper" style="margin:0;width:auto" aria-label="Paper color">${FB_PAPERS.map(([c, l]) => `<option value="${c}" ${o.paper === c ? 'selected' : ''}>📄 ${l}</option>`).join('')}</select>
      <span style="flex:1"></span>
      <button type="button" class="btn sm" data-fb="video">🎬 Save as video</button><button type="button" class="btn sm" data-fb="strip">🖼️ Save frames as a picture</button>
      <button type="button" class="btn sm ghost" data-fb="newBook">🗒️ New flip book</button></div>
    <p class="muted small" style="margin:6px 0 0">Draw, tap <b>＋ New frame</b>, and draw the next step a little changed: the frame before shows faintly underneath. Keys: ← → change frame, Space plays. ${n} of ${FB_MAX} frames.</p></div>`;
}
function fbPaint(showOnion = !fb.playing) {   // paper + onion skins + this frame
  const cv = document.getElementById('fbCanvas'); if (!cv) return; const g = cv.getContext('2d'), o = fbOpt();
  g.clearRect(0, 0, FB_W, FB_H);
  if (showOnion) {
    for (let k = +o.onion; k >= 1; k--) { const f = fb.frames[fb.i - k]; if (f) { g.globalAlpha = k === 1 ? 0.28 : 0.13; g.drawImage(fbTint(f, '#e8132f'), 0, 0); } }
    if (o.next && fb.frames[fb.i + 1]) { g.globalAlpha = 0.22; g.drawImage(fbTint(fb.frames[fb.i + 1], '#1f5fd6'), 0, 0); }
    g.globalAlpha = 1;
  }
  g.drawImage(fb.frames[fb.i], 0, 0);
  const cnt = document.querySelector('.fb-count'); if (cnt) cnt.textContent = `${fb.i + 1} / ${fb.frames.length}`;
}
function fbTint(src, col) { const c = fbBlank(), g = c.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, FB_W, FB_H); return c; }   // ghosts: red = before, blue = after
function fbThumbs() {
  const box = document.getElementById('fbFrames'); if (!box) return; const paper = fbOpt().paper;
  box.innerHTML = fb.frames.map((f, i) => `<button type="button" class="fb-thumb ${i === fb.i ? 'on' : ''}" data-fb="go" data-i="${i}" title="Frame ${i + 1}"><canvas width="96" height="64" data-thumb="${i}" style="background:${paper}"></canvas><span>${i + 1}</span></button>`).join('');
  box.querySelectorAll('[data-thumb]').forEach(c => c.getContext('2d').drawImage(fb.frames[+c.dataset.thumb], 0, 0, 96, 64));
  box.querySelector('.fb-thumb.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}
function fbThumb(i) { const c = document.querySelector(`[data-thumb="${i}"]`); if (!c) return; const g = c.getContext('2d'); g.clearRect(0, 0, 96, 64); g.drawImage(fb.frames[i], 0, 0, 96, 64); }
function flipMount() {
  fbLoad(); const cv = document.getElementById('fbCanvas'); if (!cv) return; fb.cv = cv; fbPaint(); fbThumbs();
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * FB_W / r.width, (e.clientY - r.top) * FB_H / r.height]; };
  cv.addEventListener('pointerdown', e => { if (fb.playing) return; e.preventDefault(); cv.setPointerCapture(e.pointerId); const g = fb.frames[fb.i].getContext('2d');
    try { fb.undo.push({ i: fb.i, img: g.getImageData(0, 0, FB_W, FB_H) }); if (fb.undo.length > 25) fb.undo.shift(); } catch {}
    fb.down = true; fb.last = pos(e); fbLine(fb.last, [fb.last[0] + .01, fb.last[1] + .01]); });
  cv.addEventListener('pointermove', e => { if (!fb.down) return; const p = pos(e); fbLine(fb.last, p); fb.last = p; });
  const up = () => { if (!fb.down) return; fb.down = false; fbThumb(fb.i); fbStore(); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
}
function fbLine(a, b) {
  const o = fbOpt(), g = fb.frames[fb.i].getContext('2d'); g.save(); g.lineCap = g.lineJoin = 'round'; g.lineWidth = o.tool === 'eraser' ? o.size * 3 : o.size;
  if (o.tool === 'eraser') g.globalCompositeOperation = 'destination-out'; g.strokeStyle = o.pen;
  g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); g.restore(); fbPaint();
}
function fbGo(i) { if (fb.playing) fbStop(); fb.i = Math.max(0, Math.min(fb.frames.length - 1, i)); fbPaint(); document.querySelectorAll('.fb-thumb').forEach((t, k) => t.classList.toggle('on', k === fb.i)); document.querySelector('.fb-thumb.on')?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); fbBtns(); }
function fbBtns() { const n = fb.frames.length; const set = (k, on) => { const b = document.querySelector(`[data-fb="${k}"]`); if (b) b.disabled = !on; }; set('moveL', fb.i > 0); set('moveR', fb.i < n - 1); set('del', n > 1); set('add', n < FB_MAX); set('dup', n < FB_MAX); }
function fbPlay() {
  if (fb.frames.length < 2) { toast('Add at least 2 frames to play'); return; }
  fb.playing = true; fb.i = 0; fbPaint(false); artRedraw();
  const tick = () => { if (!fb.playing || view.name !== 'art' || art().tab !== 'flip') { fbStop(); return; }
    let next = fb.i + 1; if (next >= fb.frames.length) { if (!fbOpt().loop) { fbStop(); return; } next = 0; }
    fb.i = next; fbPaint(false); document.querySelectorAll('.fb-thumb').forEach((t, k) => t.classList.toggle('on', k === fb.i));
    fb.timer = setTimeout(tick, 1000 / fbOpt().fps); };
  fb.timer = setTimeout(tick, 1000 / fbOpt().fps);
}
function fbStop() { if (!fb.playing) return; fb.playing = false; clearTimeout(fb.timer); if (view.name === 'art' && art().tab === 'flip') artRedraw(); }
/* 🎬 video: draw each frame on a canvas and record it (WebM, works in Chrome and Edge) */
async function fbVideo() {
  if (fb.frames.length < 2) { toast('Add at least 2 frames first'); return; }
  const c = document.createElement('canvas'); c.width = FB_W; c.height = FB_H; const g = c.getContext('2d'), o = fbOpt();
  if (!c.captureStream || typeof MediaRecorder === 'undefined') { toast('This browser can’t make videos. Try “Save frames as a picture”.'); return; }
  const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find(t => MediaRecorder.isTypeSupported?.(t)); if (!type) { toast('This browser can’t make videos. Try “Save frames as a picture”.'); return; }
  const stream = c.captureStream(o.fps), rec = new MediaRecorder(stream, { mimeType: type }), parts = []; rec.ondataavailable = e => e.data.size && parts.push(e.data);
  const done = new Promise(r => rec.onstop = r); const draw = i => { g.fillStyle = o.paper; g.fillRect(0, 0, FB_W, FB_H); g.drawImage(fb.frames[i], 0, 0); };
  toast('🎬 Making your video…'); draw(0); rec.start();
  const loops = o.loop ? Math.max(1, Math.ceil(3 * o.fps / fb.frames.length)) : 1;   // a short loop plays a few times so the video isn't tiny
  for (let l = 0; l < loops; l++) for (let i = 0; i < fb.frames.length; i++) { draw(i); await new Promise(r => setTimeout(r, 1000 / o.fps)); }
  rec.stop(); await done;
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(parts, { type: type.split(';')[0] })); a.download = `My flip book.${type.includes('mp4') ? 'mp4' : 'webm'}`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function fbStrip() {   // every frame side by side in rows of up to 8
  const n = fb.frames.length, cols = Math.min(8, n), rows = Math.ceil(n / cols), sc = 0.5, c = document.createElement('canvas'); c.width = cols * FB_W * sc; c.height = rows * FB_H * sc;
  const g = c.getContext('2d'); g.fillStyle = fbOpt().paper; g.fillRect(0, 0, c.width, c.height);
  fb.frames.forEach((f, i) => { const x = (i % cols) * FB_W * sc, y = Math.floor(i / cols) * FB_H * sc; g.drawImage(f, x, y, FB_W * sc, FB_H * sc); g.strokeStyle = '#ccc'; g.strokeRect(x + .5, y + .5, FB_W * sc - 1, FB_H * sc - 1); g.fillStyle = '#999'; g.font = '12px system-ui'; g.fillText(i + 1, x + 6, y + 16); });
  const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'My flip book frames.png'; a.click();
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-fb]'); if (!b || view.name !== 'art') return;
  const o = fbOpt(), k = b.dataset.k;
  switch (b.dataset.fb) {
    case 'play': return fb.playing ? fbStop() : fbPlay();
    case 'tool': o.tool = k; break; case 'size': o.size = +k; break; case 'pen': o.pen = k; o.tool = 'pen'; break;
    case 'go': return fbGo(+b.dataset.i);
    case 'prev': return fbGo(fb.i - 1); case 'next': return fbGo(fb.i + 1);
    case 'add': case 'dup': { if (fb.frames.length >= FB_MAX) return; const f = fbBlank(); if (b.dataset.fb === 'dup') f.getContext('2d').drawImage(fb.frames[fb.i], 0, 0); fb.frames.splice(fb.i + 1, 0, f); fb.i++; fbStore(); artSave(); return artRedraw(); }
    case 'del': { if (fb.frames.length < 2) return; const [gone] = fb.frames.splice(fb.i, 1), at = fb.i; fb.i = Math.min(fb.i, fb.frames.length - 1); fbStore(); artRedraw();
      if (typeof undoToast === 'function') undoToast(`Frame ${at + 1} deleted`, () => { fb.frames.splice(at, 0, gone); fb.i = at; fbStore(); artRedraw(); }); return; }
    case 'moveL': case 'moveR': { const j = fb.i + (b.dataset.fb === 'moveL' ? -1 : 1); if (j < 0 || j >= fb.frames.length) return; [fb.frames[fb.i], fb.frames[j]] = [fb.frames[j], fb.frames[fb.i]]; fb.i = j; fbStore(); return artRedraw(); }
    case 'undo': { const u = [...fb.undo].reverse().find(x => x.i === fb.i); if (!u) return; fb.undo.splice(fb.undo.lastIndexOf(u), 1); fb.frames[fb.i].getContext('2d').putImageData(u.img, 0, 0); fbPaint(); fbThumb(fb.i); fbStore(); return; }
    case 'clearF': { const g = fb.frames[fb.i].getContext('2d'); try { fb.undo.push({ i: fb.i, img: g.getImageData(0, 0, FB_W, FB_H) }); } catch {} g.clearRect(0, 0, FB_W, FB_H); fbPaint(); fbThumb(fb.i); fbStore(); return; }
    case 'newBook': { if (!confirm('Start a new flip book? (Save this one as a video first if you want to keep it.)')) return; const keep = fb.frames; fb.frames = [fbBlank()]; fb.i = 0; fb.undo = []; fbStore(); artRedraw();
      if (typeof undoToast === 'function') undoToast('New flip book', () => { fb.frames = keep; fb.i = 0; fbStore(); artRedraw(); }); return; }
    case 'video': return fbVideo();
    case 'strip': return fbStrip();
    default: return;
  }
  artSave(); document.querySelectorAll('.fb-tool[data-fb="tool"]').forEach(x => x.classList.toggle('on', x.dataset.k === o.tool));
  document.querySelectorAll('.fb-sizes button').forEach(x => x.classList.toggle('on', +x.dataset.k === o.size)); document.querySelectorAll('.fb-pens button').forEach(x => x.classList.toggle('on', x.dataset.k === o.pen));
});
document.addEventListener('input', e => { const k = e.target.dataset?.fbo; if (!k || view.name !== 'art') return; const o = fbOpt();
  if (k === 'fps') { o.fps = +e.target.value; const v = document.querySelector('[data-fbv="fps"]'); if (v) v.textContent = o.fps; artSave(); } });
document.addEventListener('change', e => { const k = e.target.dataset?.fbo; if (!k || view.name !== 'art' || k === 'fps') return; const o = fbOpt();
  o[k] = e.target.type === 'checkbox' ? e.target.checked : k === 'onion' ? +e.target.value : e.target.value; artSave();
  if (k === 'paper') { document.querySelector('.fb-stage').style.background = o.paper; fbThumbs(); } fbPaint(); });
document.addEventListener('keydown', e => {
  if (view.name !== 'art' || art().tab !== 'flip' || /input|textarea|select/i.test(e.target.tagName)) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); fbGo(fb.i - 1); } else if (e.key === 'ArrowRight') { e.preventDefault(); fbGo(fb.i + 1); }
  else if (e.key === ' ') { e.preventDefault(); fb.playing ? fbStop() : fbPlay(); }
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); document.querySelector('[data-fb="undo"]')?.click(); }
});

/* ---------- 🎬 animation guides: the 12 principles, with little moving examples ---------- */
const ANIM_PRINCIPLES = [
  ['Squash and stretch', 'Things squash when they hit and stretch when they move fast, but keep the same amount of “stuff”. It makes them feel soft and alive.', 'squash'],
  ['Anticipation', 'A small move the opposite way first: crouch before a jump, wind up before a throw. It tells the viewer what’s coming.', 'antic'],
  ['Staging', 'Show one idea at a time, clearly: a strong silhouette, a clear pose, nothing important hidden.', null],
  ['Straight ahead and pose to pose', 'Straight ahead: draw frame after frame from start to end (wild, lively). Pose to pose: draw the key poses first, then fill in between (planned, clear).', null],
  ['Follow through and overlapping action', 'Parts keep moving after the body stops: hair, tails, clothes. Different parts move at different times.', 'follow'],
  ['Slow in and slow out', 'Things speed up gently and slow down gently. Put more drawings near the start and end of a move.', 'ease'],
  ['Arcs', 'Most natural movement follows curved paths, not straight lines: a swinging arm, a thrown ball.', 'arc'],
  ['Secondary action', 'A smaller action that supports the main one, like swinging arms while walking or whistling while sweeping.', null],
  ['Timing', 'How many frames an action takes. Few frames = fast and light; many frames = slow and heavy.', 'timing'],
  ['Exaggeration', 'Push poses and expressions further than real life so they read clearly and feel fun.', null],
  ['Solid drawing', 'Draw things as 3D shapes with weight and volume, so they don’t look flat when they turn.', null],
  ['Appeal', 'Make characters interesting to watch: clear shapes, personality and charm (not just “cute”).', null],
];
const ANIM_TIPS = [['🎞️ Frame rate', '12 drawings a second (“on twos” at 24 fps) is plenty for smooth hand-drawn animation. Start at 8 fps: it’s quicker to draw and still reads well.'],
  ['🧅 Onion skin', 'Keep it on: the faint red drawing is the frame before (blue is the next one). Change each frame only a little from the ghost.'],
  ['🔑 Key poses first', 'Draw the start and the end of a move, then the middle “breakdown”, then the in-betweens.'],
  ['🔁 Loops', 'Make the last frame lead back into the first: blinking, a flag waving, a walk cycle.']];
const ANIM_EXERCISES = [['⚽ Bouncing ball', 'The classic first exercise: a ball dropping and bouncing, squashing at the floor. 8–12 frames.'], ['🕰️ Pendulum', 'A weight swinging on a string: slow at the ends, fast in the middle (slow in and slow out).'],
  ['👁️ Blink', 'Open, half, closed, half, open. Loop it with a pause.'], ['🚩 Waving flag', 'A wave passing along the flag, looping (follow through).'], ['🚶 Walk cycle', 'Four key poses per step: contact, down, passing, up. Then mirror for the other leg.'],
  ['💥 Jump', 'Crouch (anticipation), stretch up, float, land and squash.']];
let animRaf = 0;
function animHtml() {
  return `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><button type="button" class="btn primary" data-act="art" data-t="animate">🎞️ Open the animation workspace</button></div>
    <h3 style="margin:4px 0 8px">The 12 principles of animation</h3>
    <div class="anim-grid">${ANIM_PRINCIPLES.map(([n, d, demo], i) => `<div class="anim-card">${demo ? `<canvas class="anim-demo" data-demo="${demo}" width="240" height="120" aria-hidden="true"></canvas>` : ''}<b>${i + 1}. ${n}</b><span class="small">${esc(d)}</span></div>`).join('')}</div>
    <div class="art-two" style="margin-top:12px"><div class="panel"><h3 style="margin-top:0">Tips</h3>${ANIM_TIPS.map(([t, d]) => `<p class="small" style="margin:6px 0"><b>${t}:</b> ${esc(d)}</p>`).join('')}</div>
      <div class="panel"><h3 style="margin-top:0">Practice ideas</h3>${ANIM_EXERCISES.map(([t, d]) => `<p class="small" style="margin:6px 0"><b>${t}:</b> ${esc(d)}</p>`).join('')}
        <p class="muted small" style="margin:6px 0 0">These 12 principles were described by animators Ollie Johnston and Frank Thomas in 1981.</p></div></div>`;
}
function animMount() {
  cancelAnimationFrame(animRaf); const cvs = [...document.querySelectorAll('.anim-demo')]; if (!cvs.length) return; const t0 = performance.now();
  const ease = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  const frame = now => {
    if (view.name !== 'art' || art().tab !== 'anim') return; const t = (now - t0) / 1000;
    for (const c of cvs) { const g = c.getContext('2d'), W = c.width, H = c.height; g.clearRect(0, 0, W, H); g.fillStyle = '#f6f3ea'; g.fillRect(0, 0, W, H); const d = c.dataset.demo;
      g.fillStyle = '#e8132f'; g.strokeStyle = '#999';
      if (d === 'squash') { const p = (t % 1.2) / 1.2, h = Math.abs(Math.sin(p * Math.PI)), y = H - 18 - h * 80, sq = h < .12 ? 1 - (0.12 - h) * 3.5 : 1 + h * 0.15 * (1 - h) * 3;
        g.beginPath(); g.moveTo(0, H - 8); g.lineTo(W, H - 8); g.stroke(); g.beginPath(); g.ellipse(W / 2, y + 10 * (1 - sq) + 0, 14 / Math.sqrt(sq), 14 * sq, 0, 0, 7); g.fill(); }
      else if (d === 'antic') { const p = (t % 2) / 2; let x; if (p < .3) x = 60 - Math.sin(p / .3 * Math.PI / 2) * 22; else if (p < .55) x = 38 + ease((p - .3) / .25) * 150; else x = 188;
        g.beginPath(); g.moveTo(0, H - 30); g.lineTo(W, H - 30); g.stroke(); g.beginPath(); g.ellipse(x, H - 46, p < .3 ? 18 : 14, p < .3 ? 12 : 15, 0, 0, 7); g.fill(); }
      else if (d === 'follow') { const p = (t % 2.4) / 2.4, x = 30 + ease(Math.min(1, p / .5)) * 150, lag = ease(Math.min(1, Math.max(0, (p - .08) / .5))) * 150 + 30, wob = p > .5 ? Math.sin((p - .5) * 30) * Math.max(0, 1 - (p - .5) * 3) * 12 : 0;
        g.beginPath(); g.arc(x, 60, 16, 0, 7); g.fill(); g.strokeStyle = '#1f5fd6'; g.lineWidth = 4; g.beginPath(); g.moveTo(x - 14, 60); g.quadraticCurveTo(lag - 30, 60 + wob, lag - 52 + wob, 64 + wob); g.stroke(); g.lineWidth = 1; }
      else if (d === 'ease') { const p = (t % 2) / 2, k = p < .5 ? p * 2 : 2 - p * 2; g.fillStyle = '#999'; g.fillText('even', 8, 34); g.fillText('slow in & out', 8, 86);
        g.fillStyle = '#1f5fd6'; g.beginPath(); g.arc(60 + k * 160, 30, 9, 0, 7); g.fill(); g.fillStyle = '#e8132f'; g.beginPath(); g.arc(60 + ease(k) * 160, 82, 9, 0, 7); g.fill(); }
      else if (d === 'arc') { const a = Math.sin(t * 2.2) * 0.9, px = W / 2 + Math.sin(a) * 80, py = 14 + Math.cos(a) * 80; g.beginPath(); g.moveTo(W / 2, 14); g.lineTo(px, py); g.stroke();
        g.strokeStyle = '#ddd'; g.beginPath(); g.arc(W / 2, 14, 80, Math.PI / 2 - 0.9, Math.PI / 2 + 0.9); g.stroke(); g.beginPath(); g.arc(px, py, 12, 0, 7); g.fill(); }
      else if (d === 'timing') { const fast = (t % 1) / 1, slow = (t % 3) / 3; g.fillStyle = '#999'; g.fillText('few frames: fast', 8, 22); g.fillText('many frames: slow', 8, 74);
        g.fillStyle = '#1f5fd6'; g.beginPath(); g.arc(20 + Math.floor(fast * 4) / 4 * 200, 40, 9, 0, 7); g.fill(); g.fillStyle = '#e8132f'; g.beginPath(); g.arc(20 + Math.floor(slow * 16) / 16 * 200, 92, 9, 0, 7); g.fill(); }
    }
    animRaf = requestAnimationFrame(frame);
  };
  animRaf = requestAnimationFrame(frame);
}
