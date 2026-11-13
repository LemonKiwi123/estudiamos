'use strict';
/* ================= Wordling Trails chip-tune music =================
   Original little songs, played live with the Web Audio API like an old handheld sound chip:
   a pulse-wave lead, a triangle bass and noise drums. Nothing is downloaded.
   Each song is written in bars of 8 steps (eighth notes): a note like "E5", "-" to hold, "." for silence.
   Drums: k = kick, s = snare, h = hi-hat. */
const TRM_SONGS = {
  town: { bpm: 104, lead: [
      'E5 - G5 - C6 - B5 A5', 'G5 - - - E5 - . .', 'F5 - A5 - D6 - C6 B5', 'A5 - - - G5 - . .',
      'E5 F5 G5 - A5 G5 E5 C5', 'D5 - E5 - F5 - G5 -', 'A5 G5 F5 E5 D5 - G4 -', 'C5 - - - - - . .'],
    bass: ['C3 - G3 - C3 - G3 -', 'C3 - G3 - C3 - E3 -', 'F3 - C4 - F3 - C4 -', 'F3 - C4 - G3 - B2 -',
      'C3 - G3 - A2 - E3 -', 'D3 - A3 - G2 - D3 -', 'F3 - C4 - G3 - D3 -', 'C3 - G3 - C3 - . .'],
    drums: ['k . h . s . h .'], vol: 0.8 },
  route: { bpm: 138, lead: [
      'D5 - G5 - A5 B5 - A5', 'G5 - D5 - B4 - D5 -', 'E5 - C6 - B5 A5 - G5', 'A5 - - - - - D5 -',
      'D5 - G5 - A5 B5 - D6', 'C6 - B5 - A5 - G5 -', 'E5 F#5 G5 A5 B5 - A5 F#5', 'G5 - - - . . D5 E5'],
    bass: ['G2 D3 G3 D3 G2 D3 G3 D3', 'G2 D3 G3 D3 E2 B2 E3 B2', 'C3 G3 C4 G3 C3 G3 C4 G3', 'D3 A3 D4 A3 D3 A3 F#3 A3',
      'G2 D3 G3 D3 B2 F#3 B3 F#3', 'C3 G3 C4 G3 A2 E3 A3 E3', 'C3 G3 C4 G3 D3 A3 D4 A3', 'G2 D3 G3 D3 G2 - . .'],
    drums: ['k h s h k k s h'], vol: 0.9 },
  woods: { bpm: 112, lead: [
      'A4 - C5 - E5 - D5 C5', 'B4 - - - G4 - . .', 'F4 - A4 - C5 - B4 A4', 'G#4 - - - E4 - . .',
      'A4 B4 C5 - E5 - A5 -', 'G5 - F5 - E5 - D5 -', 'C5 D5 E5 C5 B4 - G#4 -', 'A4 - - - - - . .'],
    bass: ['A2 - E3 - A2 - E3 -', 'G2 - D3 - G2 - D3 -', 'F2 - C3 - F2 - C3 -', 'E2 - B2 - E2 - G#2 -',
      'A2 - E3 - C3 - G3 -', 'D3 - A3 - G2 - D3 -', 'F2 - C3 - E2 - B2 -', 'A2 - E3 - A2 - . .'],
    drums: ['k . . h s . . h'], vol: 0.75 },
  battle: { bpm: 168, lead: [
      'A5 - A5 E5 - A5 C6 B5', 'A5 G5 E5 - G5 - E5 -', 'F5 - F5 C5 - F5 A5 G5', 'F5 E5 C5 - E5 - G#5 -',
      'A5 C6 B5 A5 G5 A5 B5 C6', 'D6 - C6 B5 A5 - E5 -', 'F5 G5 A5 F5 E5 F5 G#5 E5', 'A5 - - - A4 - . .'],
    bass: ['A2 A3 A2 A3 A2 A3 A2 A3', 'G2 G3 G2 G3 G2 G3 G2 G3', 'F2 F3 F2 F3 F2 F3 F2 F3', 'E2 E3 E2 E3 E2 E3 G#2 G#3',
      'A2 A3 A2 A3 C3 C4 C3 C4', 'D3 D4 D3 D4 A2 A3 A2 A3', 'F2 F3 F2 F3 E2 E3 E2 E3', 'A2 A3 A2 A3 A2 - . .'],
    drums: ['k h s h k h s s'], vol: 0.85 },
  boss: { bpm: 176, shift: 2, from: 'battle', vol: 0.9 },
  victory: { bpm: 150, once: true, lead: ['C5 E5 G5 C6 - - G5 C6', 'E6 - - - - - . .'], bass: ['C3 - G3 - C3 - E3 -', 'C3 - - - - - . .'], drums: ['k . . . k . s .', 'k . . . . . . .'], vol: 0.9 },
  heal: { bpm: 140, once: true, lead: ['E5 G5 C6 E6 - - . .'], bass: ['C3 - - - - - . .'], drums: ['. . . . . . . .'], vol: 0.8 },
};
const TRM_SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const trmFreq = (n, shift = 0) => { const m = /^([A-G])(#|b)?(\d)$/.exec(n); if (!m) return 0; const semis = TRM_SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12 + shift; return 440 * 2 ** ((semis - 69) / 12); };
const trmSteps = bars => bars.join(' ').split(/\s+/).filter(Boolean);

const trMusic = {
  ctx: null, out: null, song: null, name: null, step: 0, next: 0, timer: 0, pulse: null, noise: null, duck: 1, after: null,
  on() { try { return S.settings?.trMusic !== false; } catch { return true; } },
  init() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    const ac = window.audioCtx ||= new AC(); this.ctx = ac;
    this.out = ac.createGain(); this.out.gain.value = 0.13; this.out.connect(ac.destination);
    // 25% pulse wave, the classic handheld lead sound
    const N = 32, re = new Float32Array(N), im = new Float32Array(N);
    for (let k = 1; k < N; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
    this.pulse = ac.createPeriodicWave(re, im);
    const buf = ac.createBuffer(1, ac.sampleRate * 0.3, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
    return ac;
  },
  resolve(name) {
    const s = TRM_SONGS[name]; if (!s) return null;
    const base = s.from ? TRM_SONGS[s.from] : s;
    return { ...base, ...s, lead: trmSteps(base.lead), bass: trmSteps(base.bass), drums: trmSteps(base.drums), shift: s.shift || 0 };
  },
  play(name, { restart = false } = {}) {
    if (!this.on()) { this.stop(); this.name = name; return; }
    if (this.name === name && this.song && !restart) return;
    const ac = this.init(); if (!ac) return;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    this.song = this.resolve(name); this.name = name; this.step = 0; this.next = ac.currentTime + 0.06;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 25);
  },
  jingle(name, thenName) { this.after = thenName; this.play(name, { restart: true }); },
  stop() { clearInterval(this.timer); this.timer = 0; this.song = null; },
  setDuck(v) { this.duck = v; if (this.out && this.ctx) this.out.gain.setTargetAtTime(0.13 * v, this.ctx.currentTime, 0.05); },
  tick() {
    const ac = this.ctx, s = this.song; if (!ac || !s) return;
    if (document.hidden) { this.next = ac.currentTime + 0.05; return; }
    const stepLen = 60 / s.bpm / 2;
    while (this.next < ac.currentTime + 0.12) {
      const len = s.lead.length;
      if (s.once && this.step >= len) { const back = this.after; this.after = null; this.song = null; if (back) this.play(back, { restart: true }); else this.stop(); return; }
      const i = this.step % len;
      this.voice(s.lead, i, this.pulse, s.shift, 0.55 * s.vol, stepLen);
      this.voice(s.bass, i % s.bass.length, 'triangle', s.shift, 0.9 * s.vol, stepLen);
      this.drum(s.drums[i % s.drums.length], this.next, s.vol);
      this.next += stepLen; this.step++;
    }
  },
  voice(track, i, wave, shift, vol, stepLen) {
    const n = track[i]; if (!n || n === '-' || n === '.') return;
    let hold = 1; while (track[(i + hold) % track.length] === '-' && hold < 8) hold++;
    const ac = this.ctx, t = this.next, dur = stepLen * hold, o = ac.createOscillator(), g = ac.createGain();
    if (typeof wave === 'string') o.type = wave; else o.setPeriodicWave(wave);
    o.frequency.value = trmFreq(n, shift);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.setValueAtTime(vol, t + dur * 0.7); g.gain.linearRampToValueAtTime(0, t + dur * 0.95);
    o.connect(g).connect(this.out); o.start(t); o.stop(t + dur);
  },
  drum(k, t, vol) {
    if (!k || k === '.' || k === '-') return;
    const ac = this.ctx;
    if (k === 'k') { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.09);
      g.gain.setValueAtTime(0.5 * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.11); o.connect(g).connect(this.out); o.start(t); o.stop(t + 0.12); return; }
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), long = k === 's' ? 0.12 : 0.03;
    src.buffer = this.noise; f.type = 'highpass'; f.frequency.value = k === 's' ? 1500 : 6000;
    g.gain.setValueAtTime((k === 's' ? 0.35 : 0.12) * vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + long);
    src.connect(f).connect(g).connect(this.out); src.start(t); src.stop(t + long + 0.01);
  },
};
