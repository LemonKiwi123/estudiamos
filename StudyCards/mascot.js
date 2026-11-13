'use strict';
/* ================= Estudiamos's mascot: a cute elephant (original artwork, inline SVG) =================
   mascot(size, mood): mood = 'happy' | 'party' | 'sleepy' */
function mascot(size = 64, mood = 'happy', opts = {}) {
  // the professional look hides the mascot around the app; games that star the elephant ask for it anyway (opts.always)
  if (!opts.always && typeof lookPro === 'function' && lookPro()) return '';
  const eyes = mood === 'sleepy'
    ? `<path d="M41 55 q6 5 12 0" stroke="#2b2f45" stroke-width="3" fill="none" stroke-linecap="round"/>
       <path d="M67 55 q6 5 12 0" stroke="#2b2f45" stroke-width="3" fill="none" stroke-linecap="round"/>`
    : mood === 'party'
    ? `<path d="M41 56 q6 -7 12 0" stroke="#2b2f45" stroke-width="3.4" fill="none" stroke-linecap="round"/>
       <path d="M67 56 q6 -7 12 0" stroke="#2b2f45" stroke-width="3.4" fill="none" stroke-linecap="round"/>`
    : `<ellipse cx="47" cy="54" rx="5.2" ry="6.4" fill="#2b2f45"/><circle cx="49" cy="51.6" r="2" fill="#fff"/><circle cx="45.6" cy="56.6" r="0.9" fill="#fff"/>
       <ellipse cx="73" cy="54" rx="5.2" ry="6.4" fill="#2b2f45"/><circle cx="75" cy="51.6" r="2" fill="#fff"/><circle cx="71.6" cy="56.6" r="0.9" fill="#fff"/>`;
  const trunk = mood === 'party'
    ? `<path d="M60 66 C62 80 74 84 86 78 C96 73 100 60 94 52 C90 47 84 50 86 56" stroke="#8ea2cb" stroke-width="15" fill="none" stroke-linecap="round"/>
       <path d="M60 66 C62 80 74 84 86 78 C96 73 100 60 94 52 C90 47 84 50 86 56" stroke="#b4c4e4" stroke-width="11.5" fill="none" stroke-linecap="round"/>
       <path d="M70 79 l1.4 -3.4 M78 80 l0 -3.6 M86 76 l-1.2 -3.4" stroke="#93a7cf" stroke-width="1.6" stroke-linecap="round"/>`
    : `<path d="M60 68 C60 80 57 88 64 93 C70 97 78 94 76 87" stroke="#8ea2cb" stroke-width="15" fill="none" stroke-linecap="round"/>
       <path d="M60 62 C60 78 57 88 64 93 C70 97 78 94 76 87" stroke="#b4c4e4" stroke-width="11.5" fill="none" stroke-linecap="round"/>
       <path d="M56 76 l4 0.4 M56.4 82 l4 1 M59 88 l3.6 -1.6" stroke="#93a7cf" stroke-width="1.6" stroke-linecap="round"/>`;
  const extras = mood === 'party'
    ? `<path d="M50 24 L60 4 L70 24 Z" fill="#ff8fab"/><path d="M53 18 L67 18 M55.5 12 L64.5 12" stroke="#fff" stroke-width="2"/><circle cx="60" cy="4" r="3.4" fill="#ffd166"/>
       <path d="M12 18 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" fill="#ffd166"/><path d="M104 14 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z" fill="#7cc8ff"/>
       <circle cx="108" cy="40" r="2.4" fill="#ff8fab"/><circle cx="10" cy="44" r="2" fill="#7cc8ff"/>`
    : mood === 'sleepy'
    ? `<text x="88" y="26" font-family="Segoe UI, sans-serif" font-weight="700" font-size="15" fill="#93a7cf">z</text><text x="99" y="15" font-family="Segoe UI, sans-serif" font-weight="700" font-size="11" fill="#b4c4e4">z</text>`
    : `<path d="M57 26 q3 -7 6 0" stroke="#93a7cf" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return `<svg class="mascot" width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Estudiamos the elephant">
    <ellipse cx="60" cy="112" rx="30" ry="4" fill="#000" opacity=".08"/>
    <ellipse cx="25" cy="54" rx="23" ry="26" fill="#93a7cf" transform="rotate(-12 25 54)"/>
    <ellipse cx="27" cy="55" rx="14" ry="17" fill="#f7b9cb" transform="rotate(-12 27 55)"/>
    <ellipse cx="95" cy="54" rx="23" ry="26" fill="#93a7cf" transform="rotate(12 95 54)"/>
    <ellipse cx="93" cy="55" rx="14" ry="17" fill="#f7b9cb" transform="rotate(12 93 55)"/>
    <path d="M38 80 C36 96 42 106 52 106 L68 106 C78 106 84 96 82 80 Z" fill="#a6b8dc"/>
    <ellipse cx="49" cy="106" rx="7" ry="4" fill="#93a7cf"/><ellipse cx="71" cy="106" rx="7" ry="4" fill="#93a7cf"/>
    <ellipse cx="60" cy="56" rx="31" ry="29" fill="#b4c4e4"/>
    ${extras}
    ${eyes}
    <g class="glasses">
      <path d="M36.6 51 L28.5 46.5 M83.4 51 L91.5 46.5" stroke="#4b4470" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="47" cy="54" r="10.6" fill="#ffffff" fill-opacity=".22" stroke="#4b4470" stroke-width="2.8"/>
      <circle cx="73" cy="54" r="10.6" fill="#ffffff" fill-opacity=".22" stroke="#4b4470" stroke-width="2.8"/>
      <path d="M57.6 52.5 q2.4 -2.6 4.8 0" stroke="#4b4470" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M41 48.5 q2.6 -2.4 5.6 -2.6 M67 48.5 q2.6 -2.4 5.6 -2.6" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".85"/>
    </g>
    <ellipse cx="39" cy="66" rx="5.4" ry="3.4" fill="#f49ab3" opacity=".75"/>
    <ellipse cx="81" cy="66" rx="5.4" ry="3.4" fill="#f49ab3" opacity=".75"/>
    <path d="M49 71 q3.6 3.4 7 1" stroke="#2b2f45" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/>
    ${trunk}
  </svg>`;
}
// Header logo + browser/taskbar icon
(() => {
  const logo = document.querySelector('.brand .logo'); if (logo && !logo.innerHTML) logo.innerHTML = mascot(38);
  const link = document.createElement('link'); link.rel = 'icon'; link.type = 'image/svg+xml';
  link.href = 'data:image/svg+xml,' + encodeURIComponent(mascot(64).replace('<svg class="mascot"', '<svg'));
  document.head.appendChild(link);
})();
/* ---------- Elephant trumpet, synthesised with the Web Audio API (no sound files) ---------- */
let audioCtx = null, lastHonk = 0;
function trumpet() {
  if (typeof S !== 'undefined' && S.settings?.mascotSound === false) return;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const now = performance.now(); if (now - lastHonk < 250) return; lastHonk = now;
  audioCtx ||= new AC(); const ac = audioCtx; if (ac.state === 'suspended') ac.resume();
  const t = ac.currentTime + 0.01, dur = 0.85 + Math.random() * 0.35, base = 290 + Math.random() * 110;
  const out = ac.createGain();
  out.gain.setValueAtTime(0.0001, t); out.gain.exponentialRampToValueAtTime(0.3, t + 0.05);
  out.gain.setValueAtTime(0.27, t + dur * 0.62); out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const body = ac.createBiquadFilter(); body.type = 'bandpass'; body.Q.value = 1.1;
  body.frequency.setValueAtTime(800, t); body.frequency.linearRampToValueAtTime(1700, t + dur * 0.3); body.frequency.linearRampToValueAtTime(1100, t + dur);
  const brass = ac.createWaveShaper(); const k = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; k[i] = Math.tanh(x * 2.6); } brass.curve = k;
  brass.connect(body); body.connect(out); out.connect(ac.destination);
  for (const det of [0, 9, -6]) {
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.detune.value = det;
    o.frequency.setValueAtTime(base * 0.62, t); o.frequency.exponentialRampToValueAtTime(base * 1.55, t + 0.13);
    o.frequency.setValueAtTime(base * 1.55, t + dur * 0.5); o.frequency.exponentialRampToValueAtTime(base * 1.2, t + dur * 0.8); o.frequency.exponentialRampToValueAtTime(base * 0.8, t + dur);
    const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 6.5 + Math.random() * 2; vg.gain.value = base * 0.035;
    vib.connect(vg); vg.connect(o.frequency);
    const og = ac.createGain(); og.gain.value = 0.33; o.connect(og); og.connect(brass);
    vib.start(t); o.start(t); vib.stop(t + dur + 0.05); o.stop(t + dur + 0.05);
  }
  const len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
  const n = ac.createBufferSource(); n.buffer = buf; const ng = ac.createGain(); ng.gain.value = 0.12; n.connect(ng); ng.connect(body); n.start(t); n.stop(t + dur);
}
document.addEventListener('click', e => {
  const m = e.target.closest?.('svg.mascot'); if (!m) return;
  trumpet();
  m.classList.remove('honk'); void m.getBoundingClientRect(); m.classList.add('honk');
});
/* A mascot with a speech bubble, for empty states and encouragement. */
function mascotSays(text, mood = 'happy', size = 84) {
  if (typeof lookPro === 'function' && lookPro()) return `<div class="mascot-say pro-note"><div class="bubble">${text}</div></div>`;
  return `<div class="mascot-say">${mascot(size, mood)}<div class="bubble">${text}</div></div>`;
}
