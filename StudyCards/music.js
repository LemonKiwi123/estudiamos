'use strict';
/* ================= 🎵 Music studio: theory, ear training, drum machine, music maker =================
   All sounds are made on this device with the Web Audio API (no samples, no outside services).
   Opened from the 🎵 Music subject tab on the Decks page (and the Music progress page).
   Saved in S.settings.music so patterns and melodies sync and back up with everything else. */

/* ---------- sound engine ---------- */
let muAC = null, muOut = null, muMeter = null;
const muBuses = {};
const muMasterVol = () => (S.settings.music?.master ?? 100) / 100;
function muBus(key) {   // a channel for one instrument (or the drums): sound → its meter → the master
  if (!muBuses[key]) { const g = muAC.createGain(), an = muAC.createAnalyser(); an.fftSize = 512; g.connect(an); an.connect(muOut); muBuses[key] = { g, an }; }
  return muBuses[key].g;
}
function muCtx() {
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  if (!muAC) {
    muAC = new AC(); muOut = muAC.createGain(); muOut.gain.value = 0.7 * muMasterVol();
    const comp = muAC.createDynamicsCompressor(); muMeter = muAC.createAnalyser(); muMeter.fftSize = 1024;
    muOut.connect(comp); comp.connect(muMeter); muMeter.connect(muAC.destination);
  }
  if (muAC.state === 'suspended') muAC.resume();
  return muAC;
}
const muHz = m => 440 * Math.pow(2, (m - 69) / 12);
let muNoiseBuf = null;
const muNoise = ac => { if (!muNoiseBuf) { muNoiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = muNoiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } const s = ac.createBufferSource(); s.buffer = muNoiseBuf; return s; };
const MU_INSTRUMENTS = { piano: '🎹 Piano', synth: '🎛️ Synth', bass: '🎸 Bass', bells: '🔔 Bells', organ: '⛪ Organ', pluck: '🪕 Pluck',
  strings: '🎻 Strings', flute: '🪈 Flute', brass: '🎺 Brass', marimba: '🪘 Marimba', epiano: '🎼 Electric piano', steel: '🥁 Steel drum' };
/* snd: undefined = this instrument's full sound settings (Music maker), 'shape' = its sound but true pitch (Theory), false = plain (ear training) */
function muNote(midi, when = 0, len = 0.5, inst = 'piano', vol = 0.6, snd) {
  const ac = muCtx(); if (!ac) return;
  const set = snd === false ? null : muSound(inst), pitch = snd === undefined && set;
  if (pitch) midi += set.oct * 12 + set.semi;
  if (set) vol *= set.vol / 100;
  const cents = pitch ? set.cents : 0, wave = set && set.wave !== 'default' ? set.wave : null;
  const t = Math.max(ac.currentTime, when || ac.currentTime) + 0.005, f = muHz(midi), ring = Math.max(1.2, (set?.rel || 0) / 1000 + 0.2);
  // signal: oscillators → g (the instrument's own envelope) → lp (its filter) → tone (brightness) → env (attack / release) → volume → out
  const g = ac.createGain(), lp = ac.createBiquadFilter(), tone = ac.createBiquadFilter(), env = ac.createGain(); lp.type = 'lowpass'; tone.type = 'lowpass';
  tone.frequency.value = set ? 250 * Math.pow(2, set.bright / 100 * 6.3) : 20000; tone.Q.value = set && set.bright < 100 ? 0.9 : 0.0001;
  g.connect(lp); lp.connect(tone); tone.connect(env); env.connect(muBus(inst));
  if (set?.att) { env.gain.setValueAtTime(0.0001, t); env.gain.linearRampToValueAtTime(1, t + set.att / 1000); }
  if (set?.rel) { const end = t + Math.max(len, (set.att || 0) / 1000); env.gain.setValueAtTime(1, end); env.gain.linearRampToValueAtTime(0.0001, end + set.rel / 1000); }
  const osc = (type, mult = 1, v = 1, det = 0) => { const o = ac.createOscillator(), og = ac.createGain(); o.type = wave || type; o.frequency.value = f * mult; o.detune.value = det + cents; og.gain.value = v; o.connect(og); og.connect(g); o.start(t); o.stop(t + len + ring); };
  g.gain.setValueAtTime(0.0001, t);
  switch (inst) {
    case 'synth': lp.frequency.setValueAtTime(600, t); lp.frequency.exponentialRampToValueAtTime(3200, t + 0.05); lp.frequency.exponentialRampToValueAtTime(1200, t + len);
      osc('sawtooth', 1, 0.5, -7); osc('sawtooth', 1, 0.5, 7);
      g.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.02); g.gain.setValueAtTime(vol * 0.4, t + len * 0.8); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.15); break;
    case 'bass': lp.frequency.value = 700; osc('square', 0.5, 0.6); osc('sine', 0.5, 0.6);
      g.gain.exponentialRampToValueAtTime(vol * 0.7, t + 0.01); g.gain.exponentialRampToValueAtTime(vol * 0.3, t + len * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.08); break;
    case 'bells': lp.frequency.value = 9000; osc('sine', 1, 0.6); osc('sine', 2.76, 0.18); osc('sine', 5.4, 0.08);
      g.gain.exponentialRampToValueAtTime(vol * 0.6, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6); break;
    case 'organ': lp.frequency.value = 4000; osc('sine', 1, 0.5); osc('sine', 2, 0.3); osc('sine', 3, 0.15); osc('sine', 4, 0.1);
      g.gain.exponentialRampToValueAtTime(vol * 0.45, t + 0.03); g.gain.setValueAtTime(vol * 0.45, t + len); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.08); break;
    case 'pluck': lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(500, t + 0.4); osc('triangle', 1, 0.7); osc('sawtooth', 1, 0.2);
      g.gain.exponentialRampToValueAtTime(vol * 0.7, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); break;
    case 'strings': {   // soft bow: slow swell, a little vibrato
      lp.frequency.value = 2600; const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 5.5; vg.gain.value = 5; vib.connect(vg); vib.start(t); vib.stop(t + len + 1.2);
      for (const det of [-8, 0, 8]) { const o = ac.createOscillator(), og = ac.createGain(); o.type = wave || 'sawtooth'; o.frequency.value = f; o.detune.value = det + cents; vg.connect(o.detune); og.gain.value = 0.33; o.connect(og); og.connect(g); o.start(t); o.stop(t + len + ring); }
      g.gain.exponentialRampToValueAtTime(vol * 0.42, t + 0.18); g.gain.setValueAtTime(vol * 0.42, t + len); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.35 + (set?.rel || 0) / 1000); break; }
    case 'flute': {   // breathy sine
      lp.frequency.value = 3500; osc('sine', 1, 0.8); osc('sine', 2, 0.08);
      const n = muNoise(ac), bp = ac.createBiquadFilter(), ng = ac.createGain(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 2; ng.gain.value = 0.06; n.connect(bp); bp.connect(ng); ng.connect(g); n.start(t); n.stop(t + len + 0.3);
      g.gain.exponentialRampToValueAtTime(vol * 0.55, t + 0.06); g.gain.setValueAtTime(vol * 0.5, t + len); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.15); break; }
    case 'brass':   // filter opens as the note starts, like a horn
      lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(2400, t + 0.08); lp.frequency.exponentialRampToValueAtTime(1500, t + len);
      osc('sawtooth', 1, 0.6); osc('sawtooth', 1, 0.4, 5);
      g.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.05); g.gain.setValueAtTime(vol * 0.45, t + len); g.gain.exponentialRampToValueAtTime(0.0001, t + len + 0.12); break;
    case 'marimba': lp.frequency.value = 4000; osc('sine', 1, 0.8); osc('sine', 4, 0.12);
      g.gain.exponentialRampToValueAtTime(vol * 0.8, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55); break;
    case 'epiano': lp.frequency.value = 3000; osc('sine', 1, 0.7); osc('sine', 2, 0.15); osc('triangle', 7, 0.04);
      g.gain.exponentialRampToValueAtTime(vol * 0.65, t + 0.004); g.gain.exponentialRampToValueAtTime(vol * 0.25, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.8, len) + 0.4); break;
    case 'steel': lp.frequency.value = 6000; osc('sine', 1, 0.6); osc('sine', 2, 0.25); osc('sine', 3.01, 0.12); osc('triangle', 1, 0.15);
      g.gain.exponentialRampToValueAtTime(vol * 0.65, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); break;
    default:   // piano-like: bright attack that fades
      lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(1400, t + 0.6); osc('triangle', 1, 0.7); osc('sine', 2, 0.2); osc('sine', 3, 0.06);
      g.gain.exponentialRampToValueAtTime(vol * 0.75, t + 0.005); g.gain.exponentialRampToValueAtTime(vol * 0.25, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.6, len) + 0.6);
  }
}
/* each instrument's sound settings (one set per instrument, used everywhere it plays) */
const MU_SND_DEFAULT = { oct: 0, semi: 0, cents: 0, wave: 'default', bright: 100, att: 0, rel: 0, vol: 100 };
function muSound(inst) { const all = ((S.settings.music ||= {}).sound ||= {}); return { ...MU_SND_DEFAULT, ...(all[inst] || {}) }; }
const muSoundChanged = inst => { const s = muSound(inst); return Object.keys(MU_SND_DEFAULT).some(k => s[k] !== MU_SND_DEFAULT[k]); };
function muClick(when, accent) {   // 🕰️ metronome tick (its own channel in the mixer)
  const ac = muCtx(); if (!ac) return;
  const t = Math.max(ac.currentTime, when || ac.currentTime) + 0.002, o = ac.createOscillator(), g = ac.createGain(), v = (S.settings.music?.metroVol ?? 100) / 100;
  o.type = 'square'; o.frequency.value = accent === 2 || accent === true ? 1760 : accent === 1 ? 1400 : 1175; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35 * v + 0.0001, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g); g.connect(muBus('metro')); o.start(t); o.stop(t + 0.07);
}
const MU_DRUMS = [['kick', 'Kick'], ['snare', 'Snare'], ['hat', 'Hi-hat'], ['open', 'Open hat'], ['clap', 'Clap'], ['tomL', 'Low tom'], ['tomH', 'High tom'], ['bell', 'Cowbell']];
function muDrum(kind, when = 0, vol = 1) {
  const ac = muCtx(); if (!ac) return;
  const t = Math.max(ac.currentTime, when || ac.currentTime) + 0.005, g = ac.createGain(), bus = muBus('drums'); g.connect(bus);
  vol *= (S.settings.music?.drumVol ?? 100) / 100;
  const env = (peak, dur) => { g.gain.setValueAtTime(peak * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); };
  const noise = (type, freq, q = 1) => { const n = muNoise(ac), f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; n.connect(f); f.connect(g); n.start(t); n.stop(t + 0.6); };
  const tone = (type, f0, f1, dur, v = 1) => { const o = ac.createOscillator(), og = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur); og.gain.value = v; o.connect(og); og.connect(g); o.start(t); o.stop(t + dur + 0.05); };
  switch (kind) {
    case 'kick': tone('sine', 150, 42, 0.45); env(1.1, 0.45); break;
    case 'snare': noise('bandpass', 1800, 0.7); tone('triangle', 220, 150, 0.12, 0.5); env(0.7, 0.2); break;
    case 'hat': noise('highpass', 7500); env(0.35, 0.05); break;
    case 'open': noise('highpass', 6500); env(0.3, 0.32); break;
    case 'clap': { noise('bandpass', 1300, 1.2); g.gain.setValueAtTime(0.0001, t);
      for (const [d, v] of [[0, 0.8], [0.012, 0.6], [0.024, 0.9]]) { g.gain.setValueAtTime(v * vol, t + d); g.gain.exponentialRampToValueAtTime(0.05, t + d + 0.01); }
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); break; }
    case 'tomL': tone('sine', 140, 80, 0.35); env(0.8, 0.35); break;
    case 'tomH': tone('sine', 240, 140, 0.28); env(0.7, 0.28); break;
    case 'bell': { const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800; g.disconnect(); g.connect(f); f.connect(bus);
      for (const fr of [540, 800]) { const o = ac.createOscillator(); o.type = 'square'; o.frequency.value = fr; o.connect(g); o.start(t); o.stop(t + 0.3); }
      env(0.35, 0.28); break; }
  }
}

/* ---------- music theory data ---------- */
const MU_SHARP = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const MU_FLAT = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const MU_SOLFA = { 'C': 'Do', 'D': 'Re', 'E': 'Mi', 'F': 'Fa', 'G': 'Sol', 'A': 'La', 'B': 'Si' };
const MU_ROOTS = [[0, 'C'], [1, 'C♯ / D♭'], [2, 'D'], [3, 'E♭'], [4, 'E'], [5, 'F'], [6, 'F♯ / G♭'], [7, 'G'], [8, 'A♭'], [9, 'A'], [10, 'B♭'], [11, 'B']];
const MU_SCALES = {
  major: ['Major', [0, 2, 4, 5, 7, 9, 11], 'Happy and bright. Whole, whole, half, whole, whole, whole, half.'],
  minor: ['Natural minor', [0, 2, 3, 5, 7, 8, 10], 'Sad or serious. The relative minor starts on the 6th note of a major scale.'],
  harmonic: ['Harmonic minor', [0, 2, 3, 5, 7, 8, 11], 'Minor with a raised 7th: a big jump between the 6th and 7th notes.'],
  melodic: ['Melodic minor (up)', [0, 2, 3, 5, 7, 9, 11], 'Minor with a raised 6th and 7th on the way up.'],
  pentMaj: ['Major pentatonic', [0, 2, 4, 7, 9], 'Five notes, no half steps. Hard to sound wrong!'],
  pentMin: ['Minor pentatonic', [0, 3, 5, 7, 10], 'Five notes used everywhere in rock and blues solos.'],
  blues: ['Blues', [0, 3, 5, 6, 7, 10], 'Minor pentatonic plus the “blue note” (the flat 5th).'],
  dorian: ['Dorian mode', [0, 2, 3, 5, 7, 9, 10], 'Minor with a brighter 6th.'],
  phrygian: ['Phrygian mode', [0, 1, 3, 5, 7, 8, 10], 'Minor with a flat 2nd: a dark, Spanish sound.'],
  lydian: ['Lydian mode', [0, 2, 4, 6, 7, 9, 11], 'Major with a raised 4th: dreamy.'],
  mixolydian: ['Mixolydian mode', [0, 2, 4, 5, 7, 9, 10], 'Major with a flat 7th: bluesy and rocky.'],
  chromatic: ['Chromatic', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 'All twelve notes, every half step.'],
};
const MU_CHORDS = {
  maj: ['Major', [0, 4, 7], '1 – 3 – 5. Happy.'], min: ['Minor', [0, 3, 7], '1 – ♭3 – 5. Sad.'], dim: ['Diminished', [0, 3, 6], '1 – ♭3 – ♭5. Tense.'], aug: ['Augmented', [0, 4, 8], '1 – 3 – ♯5. Floating, unsettled.'],
  sus2: ['Sus2', [0, 2, 7], '1 – 2 – 5. Open, neither happy nor sad.'], sus4: ['Sus4', [0, 5, 7], '1 – 4 – 5. Wants to resolve to major.'],
  dom7: ['Dominant 7th', [0, 4, 7, 10], '1 – 3 – 5 – ♭7. Wants to move home.'], maj7: ['Major 7th', [0, 4, 7, 11], '1 – 3 – 5 – 7. Soft and jazzy.'],
  min7: ['Minor 7th', [0, 3, 7, 10], '1 – ♭3 – 5 – ♭7. Mellow.'], dim7: ['Diminished 7th', [0, 3, 6, 9], 'All minor thirds. Spooky!'],
};
const MU_INTERVALS = [[1, 'Minor 2nd', 'm2'], [2, 'Major 2nd', 'M2'], [3, 'Minor 3rd', 'm3'], [4, 'Major 3rd', 'M3'], [5, 'Perfect 4th', 'P4'], [6, 'Tritone', 'TT'], [7, 'Perfect 5th', 'P5'], [8, 'Minor 6th', 'm6'], [9, 'Major 6th', 'M6'], [10, 'Minor 7th', 'm7'], [11, 'Major 7th', 'M7'], [12, 'Octave', 'P8']];
const MU_FLAT_KEYS = new Set([5, 10, 3, 8, 1, 6]);   // F, B♭, E♭, A♭, D♭, G♭ majors (and minors spelled from them)
function muSpell(pc, root, minorish) {   // sharps or flats to match the key
  const majRoot = minorish ? (root + 3) % 12 : root;
  return (MU_FLAT_KEYS.has(majRoot) ? MU_FLAT : MU_SHARP)[((pc % 12) + 12) % 12];
}
const muName = (name) => mus().names === 'solfa' ? name.replace(/^[A-G]/, l => MU_SOLFA[l]) : name;
const MU_FIFTHS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];   // C G D A E B F♯ D♭ A♭ E♭ B♭ F
const muKeySig = root => { const i = MU_FIFTHS.indexOf(root); return i <= 6 ? (i ? `${i} sharp${i > 1 ? 's' : ''} (♯)` : 'no sharps or flats') : `${12 - i} flat${12 - i > 1 ? 's' : ''} (♭)`; };

/* ---------- saved state ---------- */
function mus() {
  const m = (S.settings.music ||= {});
  m.tab ||= 'theory'; m.root ??= 0; m.kind ||= 'scale'; m.scale ||= 'major'; m.chord ||= 'maj'; m.interval ??= 7; m.names ||= 'letters';
  m.bpm ||= 100; m.swing ??= 0; m.inst ||= 'piano';
  m.drums ||= muPreset('rock'); m.mute ||= {};
  m.tracks ||= {};   // { instrument: { root, scale, notes: [[step, row]], on } }
  if (Object.getOwnPropertyDescriptor(m, 'mel')?.value) { if (!m.tracks[m.inst]) m.tracks[m.inst] = { ...m.mel, on: true }; delete m.mel; }   // older single melody
  if (!Object.getOwnPropertyDescriptor(m, 'mel')) Object.defineProperty(m, 'mel', { get: () => muTrack(m.inst), enumerable: false, configurable: true });
  m.useDrums ??= true; m.useMel ??= true; m.saved ||= [];
  m.ear ||= { mode: 'interval', right: 0, total: 0, streak: 0, best: 0 };
  return m;
}
function muTrack(inst) {   // a new track starts in the same key and scale as the one you were on
  const m = S.settings.music, prev = Object.values(m.tracks || {})[0];
  return (m.tracks ||= {})[inst] ||= { root: prev?.root ?? 0, scale: prev?.scale || 'major', notes: [], on: true };
}
const muSave = () => { clearTimeout(muSave.t); muSave.t = setTimeout(() => { try { save(); } catch {} }, 300); };

/* ---------- 🎹 the piano keyboard ---------- */
const MU_LOW = 48, MU_HIGH = 84;   // C3 … C6
function muPiano(lit = new Map(), opts = {}) {
  const lo = opts.lo ?? MU_LOW, hi = opts.hi ?? MU_HIGH, whites = [], blacks = [];
  for (let m = lo; m <= hi; m++) (/#|♯/.test(MU_SHARP[m % 12]) ? blacks : whites).push(m);
  const W = 100 / whites.length;
  const label = m => { const L = lit.get(m); return L ? `<span class="pk-lab">${esc(L)}</span>` : (m % 12 === 0 ? `<span class="pk-c">${muName('C')}${Math.floor(m / 12) - 1}</span>` : ''); };
  return `<div class="pk" role="group" aria-label="Piano keyboard">
    ${whites.map(m => `<button type="button" class="pk-w ${lit.has(m) ? 'lit' : ''}" data-mu="key" data-m="${m}" style="width:${W}%" aria-label="${esc(muName(MU_SHARP[m % 12]))}">${label(m)}</button>`).join('')}
    ${blacks.map(m => { const left = whites.filter(w => w < m).length * W; return `<button type="button" class="pk-b ${lit.has(m) ? 'lit' : ''}" data-mu="key" data-m="${m}" style="left:calc(${left}% - ${W * 0.3}%);width:${W * 0.6}%" aria-label="${esc(muName(MU_SHARP[m % 12]))}">${label(m)}</button>`; }).join('')}
  </div>`;
}

/* ---------- 🎼 Theory ---------- */
function muTheoryNotes() {
  const m = mus(), base = 60 + m.root;
  if (m.kind === 'chord') { const [, iv] = MU_CHORDS[m.chord]; const minorish = /min|dim/.test(m.chord); return iv.map(i => ({ midi: base + i, name: muSpell(m.root + i, m.root, minorish) })); }
  if (m.kind === 'interval') { const iv = MU_INTERVALS.find(x => x[0] === +m.interval) || MU_INTERVALS[6]; return [0, iv[0]].map(i => ({ midi: base + i, name: muSpell(m.root + i, m.root, false) })); }
  const [, iv] = MU_SCALES[m.scale], minorish = /minor|harmonic|melodic|pentMin|blues|dorian|phrygian/.test(m.scale) || m.scale === 'minor';
  return [...iv, 12].map(i => ({ midi: base + i, name: muSpell(m.root + i, m.root, minorish) }));
}
function muTheoryHtml() {
  const m = mus(), notes = muTheoryNotes(), lit = new Map(notes.map(n => [n.midi, muName(n.name)]));
  const info = m.kind === 'chord' ? MU_CHORDS[m.chord] : m.kind === 'interval' ? null : MU_SCALES[m.scale];
  const iv = MU_INTERVALS.find(x => x[0] === +m.interval) || MU_INTERVALS[6];
  const rootName = muName(muSpell(m.root, m.root, false));
  const title = m.kind === 'chord' ? `${rootName} ${info[0]} chord` : m.kind === 'interval' ? `${iv[1]} up from ${rootName}` : `${rootName} ${info[0]} scale`;
  const steps = m.kind === 'scale' && m.scale !== 'chromatic' ? MU_SCALES[m.scale][1].concat(12).slice(1).map((v, i, a) => { const d = v - (i ? a[i - 1] : 0); return d === 1 ? 'H' : d === 2 ? 'W' : d === 3 ? 'W+H' : '?'; }).join(' – ') : '';
  return `<div class="mu-controls">
      <label class="field">Starting note<select class="inp" data-mus="root">${MU_ROOTS.map(([v, n]) => `<option value="${v}" ${v === m.root ? 'selected' : ''}>${esc(m.names === 'solfa' ? n.split(' / ').map(muName).join(' / ') : n)}</option>`).join('')}</select></label>
      <div class="field">Show<div class="seg-btns">${[['scale', 'Scales'], ['chord', 'Chords'], ['interval', 'Intervals']].map(([k, l]) => `<button type="button" class="btn sm ${m.kind === k ? 'primary' : ''}" data-mu="kind" data-k="${k}">${l}</button>`).join('')}</div></div>
      ${m.kind === 'scale' ? `<label class="field">Scale<select class="inp" data-mus="scale">${Object.entries(MU_SCALES).map(([k, [n]]) => `<option value="${k}" ${k === m.scale ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` : ''}
      ${m.kind === 'chord' ? `<label class="field">Chord<select class="inp" data-mus="chord">${Object.entries(MU_CHORDS).map(([k, [n]]) => `<option value="${k}" ${k === m.chord ? 'selected' : ''}>${n}</option>`).join('')}</select></label>` : ''}
      ${m.kind === 'interval' ? `<label class="field">Interval<select class="inp" data-mus="interval">${MU_INTERVALS.map(([v, n, s]) => `<option value="${v}" ${v === +m.interval ? 'selected' : ''}>${n} (${s}, ${v} half step${v > 1 ? 's' : ''})</option>`).join('')}</select></label>` : ''}
      <label class="field">Note names<select class="inp" data-mus="names"><option value="letters" ${m.names !== 'solfa' ? 'selected' : ''}>C D E F G A B</option><option value="solfa" ${m.names === 'solfa' ? 'selected' : ''}>Do Re Mi Fa Sol La Si</option></select></label>
    </div>
    <div class="mu-title"><h3 style="margin:0">${esc(title)}</h3>
      <button type="button" class="btn sm primary" data-mu="playTheory">▶ Play</button>${m.kind === 'chord' ? `<button type="button" class="btn sm" data-mu="playArp">Play one by one</button>` : ''}</div>
    <div class="mu-notes">${notes.map(n => `<span class="mu-note">${esc(muName(n.name))}</span>`).join('')}</div>
    ${info ? `<p class="muted small" style="margin:6px 0 0">${esc(info[2])}${steps ? ` <span class="mu-steps">Steps: ${steps}</span> <span class="muted">(W = whole step, H = half step)</span>` : ''}</p>` : `<p class="muted small" style="margin:6px 0 0">${iv[0]} half step${iv[0] > 1 ? 's' : ''} apart.</p>`}
    <div style="margin-top:12px">${muInstTabs()}</div>
    ${muSoundPanel('theory')}
    ${muPiano(lit)}
    <p class="muted small" style="margin:6px 0 14px">Tap any key to hear it. You can also play with your computer keyboard: <b>A S D F G H J K</b> are the white keys from ${muName('C')}, and <b>W E T Y U</b> the black keys.</p>
    <div class="mu-two">
      <div class="panel mu-circle-box"><h3 style="margin-top:0">Circle of fifths</h3>${muCircleSvg()}
        <p class="muted small" style="margin:6px 0 0">Tap a key. Outside: major keys. Inside: their relative minors. <b>${esc(rootName)} major</b> has ${muKeySig(m.root)}; its relative minor is <b>${esc(muName(muSpell(m.root + 9, m.root, false)))} minor</b>.</p></div>
      <div class="panel"><h3 style="margin-top:0">Chords in ${esc(rootName)} major</h3>${muDiatonicHtml()}</div>
    </div>`;
}
function muDiatonicHtml() {   // I ii iii IV V vi vii° built on each note of the major scale
  const m = mus(), sc = MU_SCALES.major[1], roman = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'], kinds = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
  return `<div class="mu-diat">${sc.map((iv, i) => { const r = (m.root + iv) % 12, nm = muName(muSpell(r, m.root, false)) + ({ maj: '', min: 'm', dim: '°' })[kinds[i]];
    return `<button type="button" class="mu-chordbtn ${kinds[i]}" data-mu="diat" data-r="${r}" data-c="${kinds[i]}"><b>${roman[i]}</b><span>${esc(nm)}</span></button>`; }).join('')}</div>
    <p class="muted small" style="margin:8px 0 0">Tap to hear each chord. Many songs use just I, IV, V and vi.</p>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px">${[['I–V–vi–IV', [0, 4, 5, 3]], ['I–IV–V–I', [0, 3, 4, 0]], ['ii–V–I', [1, 4, 0]], ['vi–IV–I–V', [5, 3, 0, 4]]].map(([n, seq]) => `<button type="button" class="btn sm" data-mu="prog" data-seq="${seq.join(',')}">▶ ${n}</button>`).join('')}</div>`;
}
function muCircleSvg() {
  const m = mus(), cx = 110, cy = 110, R = 100, r = 66, ri = 36;
  const seg = (i, r0, r1) => { const a0 = (i - 0.5) * Math.PI / 6 - Math.PI / 2, a1 = (i + 0.5) * Math.PI / 6 - Math.PI / 2;
    const p = (rr, a) => `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
    return `M${p(r1, a0)} A${r1},${r1} 0 0 1 ${p(r1, a1)} L${p(r0, a1)} A${r0},${r0} 0 0 0 ${p(r0, a0)} Z`; };
  const pos = (i, rr) => { const a = i * Math.PI / 6 - Math.PI / 2; return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]; };
  return `<svg viewBox="0 0 220 220" class="mu-circle" role="group" aria-label="Circle of fifths">
    ${MU_FIFTHS.map((pc, i) => { const [x, y] = pos(i, (R + r) / 2), [x2, y2] = pos(i, (r + ri) / 2), mn = (pc + 9) % 12, on = pc === m.root;
      return `<g data-mu="circle" data-r="${pc}" class="mu-seg ${on ? 'on' : ''}"><path d="${seg(i, r, R)}"/><text x="${x}" y="${y}">${esc(muName(muSpell(pc, pc, false)))}</text></g>
        <g data-mu="circleMin" data-r="${mn}" class="mu-seg min ${on ? 'on' : ''}"><path d="${seg(i, ri, r)}"/><text x="${x2}" y="${y2}">${esc(muName(muSpell(mn, mn, true)))}m</text></g>`; }).join('')}
    <circle cx="${cx}" cy="${cy}" r="${ri - 2}" class="mu-hub"/><text x="${cx}" y="${cy}" class="mu-hubt">${MU_FIFTHS.indexOf(m.root) <= 6 ? '♯' : '♭'}</text></svg>`;
}
function muPlayTheory(arp) {
  const m = mus(), ac = muCtx(); if (!ac) return; const notes = muTheoryNotes(), t = ac.currentTime + 0.05;
  if (m.kind === 'chord' && !arp) { notes.forEach(n => muNote(n.midi, t, 1.4, m.inst, 0.45, 'shape')); muFlash(notes.map(n => n.midi), 0, 1400); return; }
  const gap = m.kind === 'interval' ? 0.6 : 0.32;
  notes.forEach((n, i) => { muNote(n.midi, t + i * gap, gap * 0.95, m.inst, 0.55, 'shape'); setTimeout(() => muFlash([n.midi], 0, gap * 900), i * gap * 1000 + 50); });
  if (m.kind === 'interval') notes.forEach(n => muNote(n.midi, t + 2 * gap, 1.2, m.inst, 0.4, 'shape'));
}
function muFlash(midis, delay = 0, len = 300) {
  setTimeout(() => { for (const mi of midis) { const k = document.querySelector(`.pk [data-m="${mi}"]`); if (k) { k.classList.add('down'); setTimeout(() => k.classList.remove('down'), len); } } }, delay);
}

/* ---------- 👂 Ear training ---------- */
const MU_EAR_MODES = { interval: '🎵 Intervals', chord: '🎹 Chords', scale: '🎼 Major or minor scale', note: '🎯 Name the note' };
let muQ = null;
function muEarNew() {
  const m = mus(), mode = m.ear.mode, root = 52 + Math.floor(Math.random() * 14);
  if (mode === 'interval') { const pool = MU_INTERVALS.filter(x => [2, 3, 4, 5, 7, 8, 9, 12].includes(x[0]) || m.ear.right >= 10); const iv = pool[Math.floor(Math.random() * pool.length)];
    muQ = { mode, notes: [root, root + iv[0]], seq: true, answer: iv[1], opts: muEarOpts(iv[1], pool.map(x => x[1])) }; }
  else if (mode === 'chord') { const ks = ['maj', 'min', 'dim', 'aug'], k = ks[Math.floor(Math.random() * ks.length)]; muQ = { mode, notes: MU_CHORDS[k][1].map(i => root + i), seq: false, answer: MU_CHORDS[k][0], opts: ks.map(x => MU_CHORDS[x][0]) }; }
  else if (mode === 'scale') { const k = Math.random() < 0.5 ? 'major' : 'minor'; muQ = { mode, notes: [...MU_SCALES[k][1], 12].map(i => root + i), seq: true, fast: true, answer: MU_SCALES[k][0], opts: ['Major', 'Natural minor'] }; }
  else { const n = 60 + Math.floor(Math.random() * 12), white = [0, 2, 4, 5, 7, 9, 11]; const pc = m.ear.right >= 8 ? n % 12 : white[Math.floor(Math.random() * 7)];
    muQ = { mode, notes: [60 + pc], ref: true, answer: MU_SHARP[pc], opts: (m.ear.right >= 8 ? MU_SHARP : white.map(i => MU_SHARP[i])).slice() }; }
  muQ.given = null; muEarPlay();
}
function muEarOpts(ans, pool) { const others = shuffle(pool.filter(x => x !== ans)).slice(0, 3); return shuffle([ans, ...others]); }
function muEarPlay() {
  const ac = muCtx(); if (!ac || !muQ) return; let t = ac.currentTime + 0.05;
  if (muQ.ref) { muNote(60, t, 0.6, 'piano', 0.5, false); t += 1.0; }   // "this is C", then the mystery note
  if (muQ.seq) muQ.notes.forEach((n, i) => muNote(n, t + i * (muQ.fast ? 0.3 : 0.7), muQ.fast ? 0.3 : 0.7, 'piano', 0.55, false));
  else muQ.notes.forEach(n => muNote(n, t, 1.3, 'piano', 0.42, false));
}
function muEarHtml() {
  const m = mus(), e = m.ear;
  if (!muQ || muQ.mode !== e.mode) muQ = null;
  const pct = e.total ? Math.round(e.right / e.total * 100) : 0;
  return `<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:12px">${Object.entries(MU_EAR_MODES).map(([k, l]) => `<button type="button" class="btn sm ${e.mode === k ? 'primary' : ''}" data-mu="earMode" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="mu-ear">
      <p class="muted" style="margin:0">${({ interval: 'Listen to two notes. How far apart are they?', chord: 'Listen to the chord. What kind is it?', scale: 'Listen to the scale. Is it major or minor?', note: 'First you hear C, then a mystery note. Which note is it?' })[e.mode]}</p>
      ${muQ ? `<div class="row" style="gap:8px;justify-content:center;margin:14px 0"><button type="button" class="btn" data-mu="earAgain">🔁 Hear it again</button></div>
        <div class="mu-opts">${muQ.opts.map(o => `<button type="button" class="btn ${muQ.given ? (o === muQ.answer ? 'right' : o === muQ.given ? 'wrong' : '') : ''}" data-mu="earPick" data-v="${esc(o)}" ${muQ.given ? 'disabled' : ''}>${esc(e.mode === 'note' ? muName(o) : o)}</button>`).join('')}</div>
        ${muQ.given ? `<div class="mu-verdict ${muQ.given === muQ.answer ? 'ok' : 'no'}">${muQ.given === muQ.answer ? '✓ Right!' : `It was <b>${esc(e.mode === 'note' ? muName(muQ.answer) : muQ.answer)}</b>.`}</div>
          <div style="text-align:center;margin-top:10px"><button type="button" class="btn primary big" data-mu="earNext">Next ▶</button></div>` : ''}`
      : `<div style="text-align:center;margin:18px 0"><button type="button" class="btn primary big" data-mu="earNext">▶ Start listening</button></div>`}
      <div class="muted small" style="text-align:center;margin-top:12px">✓ ${e.right} of ${e.total}${e.total ? ` (${pct}%)` : ''} · 🔥 ${e.streak} in a row · best ${e.best}${e.total ? ` · <a data-mu="earReset">reset</a>` : ''}</div>
    </div>`;
}

/* ---------- transport: one clock for the drum machine and the music maker ---------- */
const MU_STEPS = 16;   // 4/4: the size older patterns were made in
/* time signatures: steps are 16th notes; clicks = where the metronome ticks; groups = the strong beats */
const MU_SIGS = {
  '2/4': { steps: 8, clicks: [0, 4], groups: [0] }, '3/4': { steps: 12, clicks: [0, 4, 8], groups: [0] },
  '4/4': { steps: 16, clicks: [0, 4, 8, 12], groups: [0, 8] }, '5/4': { steps: 20, clicks: [0, 4, 8, 12, 16], groups: [0, 12] },
  '6/8': { steps: 12, clicks: [0, 2, 4, 6, 8, 10], groups: [0, 6] }, '7/8': { steps: 14, clicks: [0, 2, 4, 6, 8, 10, 12], groups: [0, 4, 8] },
  '9/8': { steps: 18, clicks: [0, 2, 4, 6, 8, 10, 12, 14, 16], groups: [0, 6, 12] }, '12/8': { steps: 24, clicks: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22], groups: [0, 6, 12, 18] },
};
const muSigOf = sig => MU_SIGS[sig] || MU_SIGS['4/4'];
const muSig = () => muSigOf(S.settings.music?.sig);
const muSteps = () => muSig().steps;
const muBeatCell = (s, sig = muSig()) => sig.clicks.includes(s) ? (sig.groups.includes(s) ? 'beat strong' : 'beat') : '';
function muFitDrums(drums, n) { for (const [k] of MU_DRUMS) { const r = drums[k] ||= []; while (r.length < n) r.push(0); } return drums; }   // longer bars get empty steps (extra steps are kept for later)
const mt = { on: false, step: 0, next: 0, timer: null, queue: [], raf: 0, shown: -1 };
function muStepLen() { return 60 / mus().bpm / 4; }
function muSchedule() {
  const ac = muCtx(), m = mus(); if (!ac) return;
  while (mt.next < ac.currentTime + 0.12) {
    if (mt.endAt != null) { if (ac.currentTime >= mt.endAt) { muStop(); muRedrawTray(); } return; }   // the tray finished (no loop)
    const s = mt.step, swing = s % 2 ? muStepLen() * (m.swing / 100) * 0.5 : 0, t = mt.next + swing;
    const part = mt.tray ? m.tray[mt.part] : null, drums = part ? part.drums : m.drums, tracks = part ? part.tracks : m.tracks, sig = muSigOf(part ? part.sig : m.sig);
    if (m.useDrums || part) for (const [k] of MU_DRUMS) if (drums[k]?.[s] && !m.mute[k]) muDrum(k, t, drums[k][s] === 2 ? 1 : 0.85);
    if (m.useMel || part) for (const [inst, tr] of Object.entries(tracks)) { if (!tr.on || !tr.notes.length) continue; const rows = muRowsFor(tr);
      for (const [st, row] of tr.notes) if (st === s && rows[row] != null) muNote(rows[row], t, muStepLen() * 1.6, inst, 0.45); }
    if (m.metro && sig.clicks.includes(s)) muClick(t, s === 0 ? 2 : sig.groups.includes(s) ? 1 : 0);   // highest click at the start of the bar, middle on strong beats
    mt.queue.push({ s, t, part: mt.tray ? mt.part : -1, beat: sig.clicks.indexOf(s) });
    mt.next += muStepLen(); mt.step = (s + 1) % sig.steps;
    if (mt.tray && mt.step === 0) {   // next part, or loop back, or stop at the end
      if (mt.part + 1 < m.tray.length) mt.part++;
      else if (m.trayLoop) mt.part = 0;
      else { mt.endAt = mt.next + 0.4; }
    }
  }
}
function muDrawHead() {
  const ac = muAC; if (!mt.on || !ac) return;
  while (mt.queue.length && mt.queue[0].t <= ac.currentTime) { const q = mt.queue.shift(); if (q.s !== mt.shown) { mt.shown = q.s;
    document.querySelectorAll('.mu-grid .head').forEach(e => e.classList.remove('head'));
    document.querySelectorAll(`.mu-grid [data-s="${q.s}"]`).forEach(e => e.classList.add('head'));
    if (q.beat >= 0) document.querySelectorAll('.metro-dots i').forEach((d, i) => d.classList.toggle('on', i === q.beat));
    if (q.s === 0) document.querySelectorAll('.tray-slot').forEach(el => el.classList.toggle('playing', +el.dataset.i === q.part)); } }
  mt.raf = requestAnimationFrame(muDrawHead);
}
function muPlay() {
  const ac = muCtx(); if (!ac || mt.on) return;
  mt.on = true; mt.step = 0; mt.next = ac.currentTime + 0.06; mt.queue = []; mt.shown = -1; mt.endAt = null;
  mt.timer = setInterval(muSchedule, 25); muSchedule(); mt.raf = requestAnimationFrame(muDrawHead); muTransportBtns();
}
function muStop() {
  mt.on = false; mt.tray = false; mt.endAt = null; document.querySelectorAll('.tray-slot.playing').forEach(el => el.classList.remove('playing')); clearInterval(mt.timer); cancelAnimationFrame(mt.raf); mt.queue = [];
  document.querySelectorAll('.mu-grid .head').forEach(e => e.classList.remove('head')); document.querySelectorAll('.metro-dots i').forEach(d => d.classList.remove('on')); muTransportBtns();
}
const muTransportBtns = () => {
  document.querySelectorAll('[data-mu="play"]').forEach(b => { b.textContent = mt.on && !mt.tray ? '⏹ Stop' : '▶ Play'; b.classList.toggle('primary', !mt.on); });
  document.querySelectorAll('[data-mu="trayPlay"]').forEach(b => { b.textContent = mt.on && mt.tray ? '⏹ Stop' : '▶ Play tray'; b.classList.toggle('primary', !(mt.on && mt.tray)); });
};
function muPlayTray(from = 0) { const m = mus(); if (!m.tray?.length) return; if (mt.on) muStop(); mt.tray = true; mt.part = Math.min(from, m.tray.length - 1); muPlay(); muTransportBtns(); }
function muTransportHtml(extra = '') {
  const m = mus();
  return `<div class="mu-transport">
    <button type="button" class="btn ${mt.on ? '' : 'primary'}" data-mu="play">${mt.on ? '⏹ Stop' : '▶ Play'}</button>
    <label class="mu-tempo">Tempo <input type="range" min="60" max="180" step="1" value="${m.bpm}" data-mus="bpm" aria-label="Tempo"><b class="mu-bpm">${m.bpm}</b> BPM</label>
    <label class="mu-tempo">Swing <input type="range" min="0" max="60" step="5" value="${m.swing}" data-mus="swing" aria-label="Swing"><b class="mu-swing">${m.swing}%</b></label>
    <button type="button" class="btn sm ${m.metro ? 'primary' : ''}" data-mu="metro" aria-pressed="${!!m.metro}" title="A click on every beat while it plays">🕰️ Metronome ${m.metro ? 'on' : 'off'}</button>
    <span class="metro-dots" aria-hidden="true" title="The beat">${muSig().clicks.map(s => `<i class="${muSig().groups.includes(s) ? 'strong' : ''}"></i>`).join('')}</span>
    <label class="mu-tempo" title="How many beats in a bar">Time <select class="inp" data-mus="sig" style="margin:0;width:auto">${Object.keys(MU_SIGS).map(k => `<option ${k === (m.sig || '4/4') ? 'selected' : ''}>${k}</option>`).join('')}</select></label>
    ${extra}</div>`;
}

/* ---------- 🎚️ mixer ---------- */
function muMixerHtml() {
  const m = mus(), used = Object.keys(MU_INSTRUMENTS).filter(k => m.tracks[k]?.notes.length || k === m.inst);
  const row = (key, label, val, extra = '') => `<div class="mix-row ${extra}"><span class="mix-name">${label}</span>
    <input type="range" min="0" max="150" step="1" value="${val}" data-mix="${key}" aria-label="${esc(label)} volume"><b class="mix-val" data-mixv="${key}">${val}%</b>
    <span class="mix-meter"><i data-meter="${key}"></i></span></div>`;
  return `<details class="mu-mix" ${m.mixOpen !== false ? 'open' : ''}><summary data-mu="mixOpen">🎚️ Mixer</summary>
    <div class="mix-master"><span class="mix-name"><b>🔊 Master</b></span>
      <input type="range" min="0" max="150" step="1" value="${m.master ?? 100}" data-mix="master" aria-label="Master volume"><b class="mix-val" data-mixv="master">${m.master ?? 100}%</b>
      <div class="mix-peak"><div class="mix-peak-bar"><i id="muPeakBar"></i><span id="muPeakHold"></span></div><span class="mix-db" id="muPeakDb">–∞ dB</span><span class="mix-clip" id="muClip" title="Too loud: turn something down">CLIP</span></div></div>
    ${row('drums', '🥁 Drums', m.drumVol ?? 100)}
    ${m.metro ? row('metro', '🕰️ Metronome', m.metroVol ?? 100) : ''}
    ${used.map(k => row(k, MU_INSTRUMENTS[k], muSound(k).vol, m.tracks[k]?.on === false ? 'muted' : '')).join('')}
    <div class="muted small" style="margin-top:4px">The bars show how loud each part is right now. Instruments appear here once their track has notes.</div></details>`;
}
let muMeterRaf = 0;
function muMeterLoop() {   // live meters while the studio is open
  cancelAnimationFrame(muMeterRaf);
  const buf = new Float32Array(1024), hold = { v: 0, t: 0 };
  let clipUntil = 0;
  const peakOf = an => { const n = Math.min(buf.length, an.fftSize); an.getFloatTimeDomainData(buf.subarray(0, n)); let p = 0; for (let i = 0; i < n; i++) { const a = Math.abs(buf[i]); if (a > p) p = a; } return p; };
  const toPct = p => p <= 0.0001 ? 0 : Math.max(0, Math.min(100, (20 * Math.log10(p) + 48) / 48 * 100));   // −48 dB … 0 dB
  const frame = () => {
    if (view.name !== 'music' || !document.querySelector('.mu-mix')) return;
    if (muAC && muMeter) {
      const p = peakOf(muMeter), pct = toPct(p), bar = document.getElementById('muPeakBar'), now = performance.now();
      if (bar) { bar.style.width = pct + '%'; bar.className = pct > 92 ? 'hot' : pct > 75 ? 'warm' : ''; }
      if (pct >= hold.v || now - hold.t > 1200) { hold.v = pct; hold.t = now; }
      const h = document.getElementById('muPeakHold'); if (h) h.style.left = `calc(${hold.v}% - 2px)`;
      const db = document.getElementById('muPeakDb'); if (db) db.textContent = p > 0.0001 ? `${(20 * Math.log10(p)).toFixed(1)} dB` : '–∞ dB';
      if (p >= 0.99) clipUntil = now + 1500;
      document.getElementById('muClip')?.classList.toggle('on', now < clipUntil);
      document.querySelectorAll('[data-meter]').forEach(el => { const bus = muBuses[el.dataset.meter]; const v = bus ? toPct(peakOf(bus.an)) : 0; el.style.width = v + '%'; el.className = v > 92 ? 'hot' : v > 75 ? 'warm' : ''; });
    }
    muMeterRaf = requestAnimationFrame(frame);
  };
  muMeterRaf = requestAnimationFrame(frame);
}
/* ---------- 🥁 Drum machine ---------- */
const MU_PRESETS = {
  rock: ['Rock beat', { kick: [0, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] }],
  pop: ['Four on the floor', { kick: [0, 4, 8, 12], clap: [4, 12], hat: [2, 6, 10, 14], open: [14] }],
  hiphop: ['Boom bap', { kick: [0, 3, 8, 10], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14], open: [7] }],
  latin: ['Latin groove', { kick: [0, 3, 8, 11], snare: [3, 7, 11, 15], hat: [0, 2, 4, 6, 8, 10, 12, 14], bell: [0, 3, 6, 10, 12] }],
  half: ['Half time', { kick: [0, 7, 10], snare: [8], hat: [0, 2, 4, 6, 8, 10, 12, 14], tomL: [14], tomH: [15] }],
  march: ['March', { kick: [0, 8], snare: [4, 6, 12, 13, 14, 15], hat: [0, 4, 8, 12] }],
  empty: ['Empty', {}],
};
function muPreset(k) { const p = MU_PRESETS[k]?.[1] || {}, n = Math.max(MU_STEPS, muSteps()); const out = {}; for (const [d] of MU_DRUMS) { out[d] = Array(n).fill(0); for (const s of p[d] || []) if (s < muSteps()) out[d][s] = 1; } return out; }
function muDrumsHtml() {
  const m = mus();
  return `${muTransportHtml(`<select class="inp" data-mus="preset" style="margin:0;width:auto" aria-label="Start from a beat"><option value="">Start from a beat…</option>${Object.entries(MU_PRESETS).map(([k, [n]]) => `<option value="${k}">${n}</option>`).join('')}</select>`)}
    ${muMixerHtml()}
    <div class="mu-grid drums" style="--steps:${muSteps()}">
      ${MU_DRUMS.map(([k, name]) => `<div class="mu-row"><button type="button" class="mu-rowname ${m.mute[k] ? 'muted' : ''}" data-mu="mute" data-k="${k}" title="${m.mute[k] ? 'Turn back on' : 'Mute this drum'}">${m.mute[k] ? '🔇' : '🔊'} ${name}</button>
        <button type="button" class="mu-hear" data-mu="hearDrum" data-k="${k}" title="Hear it" aria-label="Hear ${name}">▶</button>
        ${Array.from({ length: muSteps() }, (_, s) => `<button type="button" class="mu-cell ${muBeatCell(s)} ${m.drums[k]?.[s] ? 'on' + (m.drums[k][s] === 2 ? ' acc' : '') : ''}" data-mu="cell" data-k="${k}" data-s="${s}" aria-label="${name}, step ${s + 1}" aria-pressed="${!!m.drums[k]?.[s]}"></button>`).join('')}</div>`).join('')}
    </div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px">
      <button type="button" class="btn sm" data-mu="clearDrums">🧹 Clear beat</button>
      <label class="row muted small" style="gap:6px"><input type="checkbox" data-mus="useMel" ${m.useMel ? 'checked' : ''}> Play my music maker tracks too</label>
      <span class="muted small" style="margin-left:auto">Tap a box to add a hit, tap again for a louder hit, a third time to remove it. 4 boxes = 1 beat.</span></div>`;
}

/* instrument tabs (Music maker and the Theory piano) */
const muInstTabs = () => `<div class="mu-inst" role="tablist" aria-label="Instrument">${Object.entries(MU_INSTRUMENTS).map(([k, n]) => `<button type="button" class="mu-inst-b ${k === mus().inst ? 'on' : ''}" data-mu="inst" data-k="${k}" role="tab" aria-selected="${k === mus().inst}">${n}</button>`).join('')}</div>`;
/* 🎛️ sound presets: save a sound with a name, use it on any instrument, export / import them as a .json file */
const MU_PRESETS_BUILTIN = [
  ['8-bit lead', 'synth', { wave: 'square', bright: 70, rel: 120 }], ['Chiptune bass', 'bass', { wave: 'square', oct: -1, bright: 60 }],
  ['Warm pad', 'strings', { att: 600, rel: 1500, bright: 55, vol: 90 }], ['Deep bass', 'bass', { oct: -1, bright: 45, vol: 120 }],
  ['Music box', 'bells', { oct: 1, rel: 900, bright: 90 }], ['Soft flute', 'flute', { att: 120, bright: 60 }],
  ['Retro organ', 'organ', { wave: 'square', bright: 50 }], ['Glass keys', 'epiano', { wave: 'sine', oct: 1, rel: 700 }],
].map(([name, inst, s], i) => ({ id: 'b' + i, name, inst, sound: { ...MU_SND_DEFAULT, ...s }, builtin: true }));
const MU_WAVES = ['default', 'sine', 'triangle', 'square', 'sawtooth'];
const muMyPresets = () => (S.settings.music.presets ||= []);
const muAllPresets = () => [...MU_PRESETS_BUILTIN, ...muMyPresets()];
function muCleanSound(s = {}) {   // keep only real settings, inside their ranges (for imported files)
  const n = (v, lo, hi, d) => { v = Math.round(+v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  return { oct: n(s.oct, -2, 2, 0), semi: n(s.semi, -12, 12, 0), cents: n(s.cents, -50, 50, 0), wave: MU_WAVES.includes(s.wave) ? s.wave : 'default',
    bright: n(s.bright, 0, 100, 100), att: n(s.att, 0, 1500, 0), rel: n(s.rel, 0, 3000, 0), vol: n(s.vol, 0, 150, 100) };
}
function muExportPresets(list) {
  const data = { app: 'Estudiamos', type: 'sound-presets', version: 1, presets: list.map(x => ({ name: x.name, instrument: x.inst, sound: muCleanSound(x.sound) })) };
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = list.length === 1 ? `${list[0].name.replace(/[\\/:*?"<>|]+/g, '-')}.json` : 'Estudiamos sound presets.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`⬇️ ${list.length} preset${list.length === 1 ? '' : 's'} exported`);
}
function muImportPresets() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => {
    const f = inp.files?.[0]; if (!f) return;
    if (f.size > 500000) { toast('That file is too big to be a presets file'); return; }
    let data; try { data = JSON.parse(await f.text()); } catch { toast('That file isn’t a presets file (it isn’t valid JSON)'); return; }
    const list = Array.isArray(data) ? data : data?.type === 'sound-presets' && Array.isArray(data.presets) ? data.presets : null;
    if (!list) { toast('That file has no Estudiamos sound presets in it'); return; }
    const mine = muMyPresets(), key = x => x.name.toLowerCase() + JSON.stringify(x.sound); const have = new Set(mine.map(key)); let added = 0;
    for (const x of list.slice(0, 200)) {
      if (!x || typeof x !== 'object') continue;
      const p = { id: uid(), name: String(x.name || 'Imported sound').trim().slice(0, 40) || 'Imported sound', inst: MU_INSTRUMENTS[x.instrument || x.inst] ? (x.instrument || x.inst) : 'piano', sound: muCleanSound(x.sound || x) };
      if (have.has(key(p))) continue; have.add(key(p)); mine.push(p); added++;
    }
    muSave(); muRedraw(); toast(added ? `⬆️ ${added} preset${added === 1 ? '' : 's'} imported` : 'You already have all the presets in that file');
  };
  inp.click();
}
/* 🎛️ sound settings for the instrument you're on */
function muApplyPreset(x) {   // a preset's settings go onto the instrument you're on
  const m = mus(); (m.sound ||= {})[m.inst] = muCleanSound(x.sound); muSave(); muRedraw(); toast(`🎛️ “${x.name}” is on ${MU_INSTRUMENTS[m.inst]}`);
  const ac = muCtx(); if (ac) [0, 4, 7].forEach((iv, i) => muNote(60 + (m.tab === 'maker' ? m.mel.root : m.root) + iv, ac.currentTime + 0.05 + i * 0.22, 0.3, m.inst, 0.5, m.tab === 'maker' ? undefined : 'shape'));
}
function muSoundPanel(where) {
  const m = mus(), k = m.inst, s = muSound(k), open = m.sndOpen;
  const slider = (key, label, min, max, step, fmt, help) => `<label class="mu-snd-row" title="${esc(help)}"><span>${label}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${s[key]}" data-snd="${key}" aria-label="${label}"><b data-sndv="${key}">${fmt(s[key])}</b></label>`;
  const sign = v => (v > 0 ? '+' : '') + v;
  return `<details class="mu-snd" ${open ? 'open' : ''}><summary data-mu="sndOpen">🎛️ Sound for ${MU_INSTRUMENTS[k]}${muSoundChanged(k) ? ' <span class="mu-snd-dot">changed</span>' : ''}</summary>
    <div class="mu-snd-grid">
      <label class="mu-snd-row"><span>Waveform</span><select class="inp" data-snd="wave" style="margin:0">${[['default', `${MU_INSTRUMENTS[k]}’s own sound`], ['sine', '〰️ Sine: soft and pure'], ['triangle', '🔺 Triangle: mellow'], ['square', '⬛ Square: hollow, 8-bit'], ['sawtooth', '🪚 Sawtooth: buzzy and bright']].map(([v, l]) => `<option value="${v}" ${s.wave === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      ${slider('oct', 'Octave', -2, 2, 1, v => sign(v), 'Move every note up or down by whole octaves')}
      ${slider('semi', 'Pitch (half steps)', -12, 12, 1, v => sign(v), 'Move every note up or down by half steps: +2 plays C as D')}
      ${slider('cents', 'Fine tune (cents)', -50, 50, 1, v => sign(v), 'Make it a little sharp or flat. 100 cents = 1 half step')}
      ${slider('bright', 'Brightness', 0, 100, 1, v => v + '%', 'How bright or muffled it sounds')}
      ${slider('att', 'Attack', 0, 1500, 10, v => v ? v + ' ms' : 'instant', 'How slowly each note starts: 0 = right away, more = a slow swell')}
      ${slider('rel', 'Release', 0, 3000, 10, v => v ? v + ' ms' : 'normal', 'How long each note fades after it ends')}
      ${slider('vol', 'Volume', 0, 150, 1, v => v + '%', 'How loud this instrument is')}
    </div>
    <div class="mu-presets">
      <select class="inp" data-mus="presetUse" style="margin:0;width:auto;max-width:100%" aria-label="Use a preset"><option value="">🎛️ Use a preset…</option>
        <optgroup label="Starter presets">${MU_PRESETS_BUILTIN.map(x => `<option value="${x.id}">${esc(x.name)} (${MU_INSTRUMENTS[x.inst]})</option>`).join('')}</optgroup>
        ${muMyPresets().length ? `<optgroup label="My presets">${muMyPresets().map(x => `<option value="${x.id}">${esc(x.name)} (${MU_INSTRUMENTS[x.inst] || ''})</option>`).join('')}</optgroup>` : ''}</select>
      <button type="button" class="btn sm" data-mu="presetSave" title="Save this instrument’s sound with a name">💾 Save as preset</button>
      <button type="button" class="btn sm" data-mu="presetImport" title="Load presets from a .json file">⬆️ Import</button>
      <button type="button" class="btn sm" data-mu="presetExport" ${muMyPresets().length ? '' : 'disabled title="Save a preset first"'} title="Save your presets to a .json file you can share">⬇️ Export</button></div>
    ${muMyPresets().length ? `<details class="mu-mypresets"><summary>My presets (${muMyPresets().length})</summary>${muMyPresets().map(x => `<div class="mu-preset-row"><span><b>${esc(x.name)}</b> <span class="muted small">made on ${MU_INSTRUMENTS[x.inst] || ''}</span></span>
        <span class="row" style="gap:4px"><button type="button" class="btn sm" data-mu="presetApply" data-id="${x.id}">Use</button><button type="button" class="btn sm ghost" data-mu="presetOne" data-id="${x.id}" title="Export just this one">⬇️</button><button type="button" class="btn sm ghost" data-mu="presetDel" data-id="${x.id}" title="Delete">🗑️</button></span></div>`).join('')}</details>` : ''}
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn sm primary" data-mu="sndPreview">▶ Preview</button><button type="button" class="btn sm" data-mu="sndReset">↺ Back to normal</button>
      <span class="muted small" style="align-self:center">${where === 'theory' ? 'In Theory, notes always play at their real pitch so the lessons stay right; octave, pitch and fine tune change the Music maker.' : 'Saved for this instrument and kept in your saved songs.'}</span></div></details>`;
}
/* one tab per instrument track: tap the name to edit it, tap 🔊/🔇 to turn it on or off */
function muTrackTabs() {
  const m = mus();
  return `<div class="mu-inst mu-tracks" role="tablist" aria-label="Tracks">${Object.entries(MU_INSTRUMENTS).map(([k, n]) => { const tr = m.tracks[k], has = tr?.notes.length, on = tr ? tr.on : true;
    return `<div class="mu-track ${k === m.inst ? 'on' : ''} ${has ? 'has' : ''} ${on ? '' : 'off'}"><button type="button" class="mu-track-pow" data-mu="trackOn" data-k="${k}" title="${on ? 'Playing: tap to mute this track' : 'Muted: tap to play this track'}" aria-pressed="${on}">${on ? '🔊' : '🔇'}</button>
      <button type="button" class="mu-track-name" data-mu="inst" data-k="${k}" role="tab" aria-selected="${k === m.inst}">${n}${has ? `<span class="mu-track-n">${tr.notes.length}</span>` : ''}</button></div>`; }).join('')}</div>
    <div class="muted small" style="margin-top:6px">Each instrument is its own track with its own key and scale. Tap an instrument to write its part; 🔊 / 🔇 chooses which tracks play.${Object.values(m.tracks).some(t => t.notes.length && t.on) ? ` Playing: ${Object.entries(m.tracks).filter(([, t]) => t.notes.length && t.on).map(([k]) => MU_INSTRUMENTS[k]).join(', ')}.` : ''}</div>`;
}
/* ---------- 🎹 Music maker (melody grid in a scale, plays with the drums) ---------- */
const muMelRows = () => muRowsFor(mus().mel);
function muRowsFor(m) {   // two octaves of the track's scale, high notes on top
  const iv = MU_SCALES[m.scale]?.[1] || MU_SCALES.major[1], out = [];
  for (let o = 0; o < 2; o++) for (const i of iv) out.push(60 + m.root + o * 12 + i);
  out.push(60 + m.root + 24);
  return out.reverse();
}
function muMakerHtml() {
  const m = mus(), mel = m.mel, rows = muMelRows(), minorish = /minor|harmonic|melodic|pentMin|blues|dorian|phrygian/.test(mel.scale);
  const has = new Set(mel.notes.map(([s, r]) => s + ':' + r));
  return `${muTransportHtml()}
    ${muMixerHtml()}
    ${muTrackTabs()}
    ${muSoundPanel('maker')}
    <div class="mu-controls" style="margin-top:8px">
      <label class="field">Key<select class="inp" data-mus="melRoot">${MU_ROOTS.map(([v, n]) => `<option value="${v}" ${v === mel.root ? 'selected' : ''}>${esc(m.names === 'solfa' ? n.split(' / ').map(muName).join(' / ') : n)}</option>`).join('')}</select></label>
      <label class="field">Scale<select class="inp" data-mus="melScale">${Object.entries(MU_SCALES).filter(([k]) => k !== 'chromatic').map(([k, [n]]) => `<option value="${k}" ${k === mel.scale ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="row muted small" style="gap:6px;align-self:end;margin-bottom:8px"><input type="checkbox" data-mus="useDrums" ${m.useDrums ? 'checked' : ''}> Play the drum beat too</label>
    </div>
    <div class="mu-grid maker" style="--steps:${muSteps()}">
      ${rows.map((midi, r) => { const nm = muName(muSpell(midi, mel.root, minorish)), isRoot = (midi - mel.root) % 12 === 0;
        return `<div class="mu-row"><button type="button" class="mu-rowname ${isRoot ? 'root' : ''}" data-mu="hearRow" data-m="${midi}">${esc(nm)}<small>${Math.floor(midi / 12) - 1}</small></button>
          ${Array.from({ length: muSteps() }, (_, s) => `<button type="button" class="mu-cell ${muBeatCell(s)} ${isRoot ? 'rootrow' : ''} ${has.has(s + ':' + r) ? 'on' : ''}" data-mu="note" data-r="${r}" data-s="${s}" aria-label="${esc(nm)}, step ${s + 1}" aria-pressed="${has.has(s + ':' + r)}"></button>`).join('')}</div>`; }).join('')}
    </div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px">
      <button type="button" class="btn sm" data-mu="clearMel">🧹 Clear this track</button>
      <button type="button" class="btn sm" data-mu="clearAll" ${Object.values(m.tracks).some(t => t.notes.length) ? '' : 'disabled'}>🗑️ Clear all tracks</button>
      <button type="button" class="btn sm" data-mu="randMel" title="Make up a melody in this scale">🎲 Surprise melody</button>
      ${m.trayEditing != null && m.tray?.[m.trayEditing] ? `<button type="button" class="btn sm primary" data-mu="trayUpdate">💾 Update part ${m.trayEditing + 1}</button><button type="button" class="btn sm ghost" data-mu="trayEditDone">Done editing</button>`
        : `<button type="button" class="btn sm primary" data-mu="trayAdd" ${(m.tray || []).length >= 5 ? 'disabled title="The tray is full (5 parts)"' : ''}>📥 Add to tray</button>`}
      <button type="button" class="btn sm" data-mu="saveSong">💾 Save song</button>
      ${m.saved.length ? `<select class="inp" data-mus="loadSong" style="margin:0;width:auto" aria-label="Open a saved song"><option value="">📂 Open a saved song…</option>${m.saved.map((x, i) => `<option value="${i}">${esc(x.name)}</option>`).join('')}</select>` : ''}
      <span class="muted small" style="margin-left:auto">Every row is a note of the scale, so it always fits. The darker rows are the key note.</span></div>
    <div id="muTray">${muTrayHtml()}</div>`;
}
/* 🎞️ the tray: up to 5 parts (every track + the drum beat), played left to right */
const MU_TRAY_MAX = 5;
function muPartSnapshot(m) { return { id: uid(), sig: m.sig || '4/4', drums: JSON.parse(JSON.stringify(m.drums)), tracks: JSON.parse(JSON.stringify(m.tracks)) }; }
function muMiniSvg(part) {   // a tiny picture of the part: one dot per note, colored by instrument, drums underneath
  const cols = ['#3b54e8', '#cf3f3f', '#23905a', '#c97c10', '#8a3fd1', '#0e8f9a', '#d9489f', '#5a6b7c', '#e3a008', '#14907f', '#7c6cf0', '#b5651d'];
  let dots = '', i = 0; const n = muSigOf(part.sig).steps, w = 96 / n;
  for (const [inst, tr] of Object.entries(part.tracks)) { const c = cols[Object.keys(MU_INSTRUMENTS).indexOf(inst) % cols.length], rows = Math.max(1, muRowsFor(tr).length - 1);
    if (tr.on !== false) for (const [s, r] of tr.notes) if (s < n) dots += `<rect x="${s * w + 1}" y="${2 + r / rows * 30}" width="${Math.max(2, w - 2)}" height="3" rx="1" fill="${c}"/>`; i++; }
  for (const [k] of MU_DRUMS) (part.drums[k] || []).forEach((v, s) => { if (v && s < n) dots += `<rect x="${s * w + 1}" y="38" width="${Math.max(2, w - 2)}" height="4" rx="1" fill="${k === 'kick' ? '#555' : '#999'}"/>`; });
  return `<svg viewBox="0 0 96 44" class="tray-mini" aria-hidden="true"><rect width="96" height="44" rx="4" class="tray-mini-bg"/>${muSigOf(part.sig).clicks.map(s => `<line x1="${s * w}" y1="0" x2="${s * w}" y2="44" class="tray-mini-beat"/>`).join('')}${dots}</svg>`;
}
function muTrayHtml() {
  const m = mus(), tray = (m.tray ||= []), n = tray.length;
  const notes = p => Object.values(p.tracks).reduce((a, t) => a + (t.on !== false ? t.notes.length : 0), 0), beats = p => Object.values(p.drums).reduce((a, r) => a + r.filter(Boolean).length, 0);
  return `<div class="mu-tray"><div class="row-between" style="gap:8px;flex-wrap:wrap"><h3 style="margin:0">🎞️ Tray <span class="muted small">${n} of ${MU_TRAY_MAX} parts</span></h3>
      <div class="row" style="gap:6px;flex-wrap:wrap"><button type="button" class="btn sm ${mt.on && mt.tray ? '' : 'primary'}" data-mu="trayPlay" ${n ? '' : 'disabled'}>${mt.on && mt.tray ? '⏹ Stop' : '▶ Play tray'}</button>
        <button type="button" class="btn sm ${m.trayLoop ? 'primary' : ''}" data-mu="trayLoop" aria-pressed="${!!m.trayLoop}">🔁 Loop ${m.trayLoop ? 'on' : 'off'}</button>
        ${n ? `<button type="button" class="btn sm ghost" data-mu="trayClear">Empty tray</button>` : ''}</div></div>
    <div class="tray-slots">${Array.from({ length: MU_TRAY_MAX }, (_, i) => { const p = tray[i];
      if (!p) return `<div class="tray-slot empty" data-i="${i}" data-drop="${i}"><b class="tray-num">${i + 1}</b><span class="muted small">${i === n ? 'Make a part above, then tap 📥 Add to tray' : 'Empty'}</span></div>`;
      return `<div class="tray-slot ${mt.on && mt.tray && mt.part === i ? 'playing' : ''}" data-i="${i}" data-drop="${i}" draggable="true" title="Drag to change the order">
        <div class="tray-top"><b class="tray-num">${i + 1}</b><span class="pill tray-sig">${esc(p.sig || '4/4')}</span><button type="button" class="tray-name" data-mu="trayName" data-i="${i}" title="Tap to rename (e.g. Verse, Chorus)">${esc(p.name || `Part ${i + 1}`)} ✎</button></div>
        ${muMiniSvg(p)}
        <div class="muted small">${notes(p)} note${notes(p) === 1 ? '' : 's'} · ${beats(p)} drum hit${beats(p) === 1 ? '' : 's'}</div>
        <div class="tray-btns"><button type="button" class="btn sm ghost" data-mu="trayMove" data-i="${i}" data-d="-1" ${i ? '' : 'disabled'} title="Move earlier">◀</button>
          <button type="button" class="btn sm ghost" data-mu="trayFrom" data-i="${i}" title="Play from this part">▶</button>
          <button type="button" class="btn sm ghost" data-mu="trayEdit" data-i="${i}" title="Open this part in the grid to change it">✏️</button>
          <button type="button" class="btn sm ghost" data-mu="trayDel" data-i="${i}" title="Remove from the tray">🗑️</button>
          <button type="button" class="btn sm ghost" data-mu="trayMove" data-i="${i}" data-d="1" ${i < n - 1 ? '' : 'disabled'} title="Move later">▶▶</button></div></div>`; }).join('')}</div>
    <p class="muted small" style="margin:6px 0 0">Each part is one bar of everything in the grid: every track that’s on, plus the drum beat. Drag parts (or use ◀ ▶▶) to change the order. ✏️ opens a part in the grid; change it and tap <b>💾 Update part</b>.</p></div>`;
}
function muTrayMove(i, j) {   // move a part (the one being edited and the one playing follow it)
  const m = mus(), [p] = m.tray.splice(i, 1); m.tray.splice(j, 0, p);
  const follow = x => x === i ? j : (i < x && x <= j) ? x - 1 : (j <= x && x < i) ? x + 1 : x;
  if (m.trayEditing != null) m.trayEditing = follow(m.trayEditing); if (mt.tray) mt.part = follow(mt.part);
  muSave(); muRedrawTray(); muRedraw();
}
/* drag a part onto another slot to move it there */
document.addEventListener('dragstart', e => { const s = e.target.closest?.('.tray-slot[draggable]'); if (!s) return; e.dataTransfer.setData('text/plain', s.dataset.i); e.dataTransfer.effectAllowed = 'move'; s.classList.add('dragging'); });
document.addEventListener('dragend', e => { e.target.closest?.('.tray-slot')?.classList.remove('dragging'); document.querySelectorAll('.tray-slot.over').forEach(x => x.classList.remove('over')); });
document.addEventListener('dragover', e => { const s = e.target.closest?.('.tray-slot[data-drop]'); if (!s || view.name !== 'music') return; e.preventDefault(); document.querySelectorAll('.tray-slot.over').forEach(x => x !== s && x.classList.remove('over')); s.classList.add('over'); });
document.addEventListener('drop', e => { const s = e.target.closest?.('.tray-slot[data-drop]'); if (!s || view.name !== 'music') return; e.preventDefault();
  const i = +e.dataTransfer.getData('text/plain'), m = mus(); let j = Math.min(+s.dataset.drop, m.tray.length - 1); if (Number.isNaN(i) || i === j) return; muTrayMove(i, j); });
function muRedrawTray() { const el = document.getElementById('muTray'); if (el) el.innerHTML = muTrayHtml(); muTransportBtns(); }
function muRandomMelody() {   // simple, singable: steps mostly by small jumps, ending on the key note
  const rows = muMelRows(), n = rows.length, home = rows.findIndex((m, i) => i > 3 && (m - mus().mel.root) % 12 === 0);
  let r = home >= 0 ? home : Math.floor(n / 2); const out = [];
  const len = muSteps();
  for (let s = 0; s < len; s += Math.random() < 0.3 ? 4 : 2) {
    if (s >= len - 2) r = home >= 0 ? home : r;
    out.push([s, r]); r = Math.max(2, Math.min(n - 1, r + [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)]));
  }
  return out;
}

/* ---------- the Music studio page ---------- */
const MU_TABS = [['theory', '🎼 Theory'], ['ear', '👂 Ear training'], ['tuner', '🎙️ Tuner'], ['drums', '🥁 Drum machine'], ['maker', '🎹 Music maker'], ['sheet', '🎼 Sheet music']];
/* ---------- 🎙️ tuner: listens through the microphone and shows the note and how many cents sharp or flat ---------- */
const TUNINGS = {
  chromatic: ['🎯 Any note', []], guitar: ['🎸 Guitar (standard)', [40, 45, 50, 55, 59, 64]], bass: ['🎸 Bass guitar', [28, 33, 38, 43]],
  ukulele: ['🪕 Ukulele', [67, 60, 64, 69]], violin: ['🎻 Violin', [55, 62, 69, 76]], viola: ['🎻 Viola', [48, 55, 62, 69]], cello: ['🎻 Cello', [36, 43, 50, 57]],
};
const tu = { on: false, stream: null, src: null, an: null, raf: 0, hist: [], err: '' };
function tuDetect(buf, rate) {   // autocorrelation pitch finder; returns Hz or 0 when it's too quiet or unclear
  let n = buf.length, rms = 0; for (let i = 0; i < n; i++) rms += buf[i] * buf[i]; rms = Math.sqrt(rms / n); if (rms < 0.01) return 0;
  let a = 0, z = n - 1; const th = 0.2; for (let i = 0; i < n / 2; i++) if (Math.abs(buf[i]) < th) { a = i; break; } for (let i = 1; i < n / 2; i++) if (Math.abs(buf[n - i]) < th) { z = n - i; break; }
  const x = buf.slice(a, z), m = x.length, c = new Float32Array(m);
  for (let lag = 0; lag < m; lag++) { let s = 0; for (let i = 0; i < m - lag; i++) s += x[i] * x[i + lag]; c[lag] = s; }
  let d = 0; while (d < m - 1 && c[d] > c[d + 1]) d++;
  let best = -1, pos = -1; for (let i = d; i < m; i++) if (c[i] > best) { best = c[i]; pos = i; }
  if (pos <= 0 || pos >= m - 1) return 0;
  const y1 = c[pos - 1], y2 = c[pos], y3 = c[pos + 1], A = (y1 + y3 - 2 * y2) / 2, B = (y3 - y1) / 2, T = A ? pos - B / (2 * A) : pos;
  const f = rate / T; return f > 25 && f < 4500 ? f : 0;
}
async function tuStart() {
  if (tu.on) return; tu.err = '';
  const ac = muCtx(); if (!ac) { tu.err = 'This browser can’t make or hear sound.'; return muRedraw(); }
  if (!navigator.mediaDevices?.getUserMedia) { tu.err = 'This browser can’t use the microphone here. Try Chrome or Edge, or open Estudiamos on a secure (https) address.'; return muRedraw(); }
  try {
    tu.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    tu.src = ac.createMediaStreamSource(tu.stream); tu.an = ac.createAnalyser(); tu.an.fftSize = 4096; tu.src.connect(tu.an);   // listen only: nothing goes to the speakers
    tu.on = true; tu.hist = []; muRedraw(); tuLoop();
  } catch (e) { tu.err = e?.name === 'NotAllowedError' ? 'The microphone is blocked. Allow it in your browser’s site settings, then try again.' : 'No microphone was found.'; muRedraw(); }
}
function tuStop() { cancelAnimationFrame(tu.raf); tu.stream?.getTracks().forEach(t => t.stop()); try { tu.src?.disconnect(); } catch {} Object.assign(tu, { on: false, stream: null, src: null, an: null, hist: [] }); }
function tuRead(f) {   // Hz → note, octave and cents
  const a4 = mus().a4 || 440, n = 12 * Math.log2(f / a4) + 69, near = Math.round(n);
  return { f, midi: near, cents: Math.round((n - near) * 100), name: MU_SHARP[((near % 12) + 12) % 12], oct: Math.floor(near / 12) - 1 };
}
function tuLoop() {
  const buf = new Float32Array(tu.an?.fftSize || 4096);
  const step = () => {
    if (!tu.on || view.name !== 'music' || mus().tab !== 'tuner') { tuStop(); return; }
    tu.an.getFloatTimeDomainData(buf); const f = tuDetect(buf, muAC.sampleRate);
    if (f) { tu.hist.push(f); if (tu.hist.length > 7) tu.hist.shift(); } else if (tu.hist.length) tu.hist.shift();
    tuShow(tu.hist.length >= 3 ? tuRead([...tu.hist].sort((a, b) => a - b)[tu.hist.length >> 1]) : null);
    tu.raf = requestAnimationFrame(step);
  };
  tu.raf = requestAnimationFrame(step);
}
function tuShow(r) {
  const note = document.getElementById('tuNote'), hz = document.getElementById('tuHz'), needle = document.getElementById('tuNeedle'), msg = document.getElementById('tuMsg'); if (!note) return;
  const m = mus(), set = TUNINGS[m.tuning] || TUNINGS.chromatic;
  if (!r) { note.innerHTML = '<span class="muted">–</span>'; hz.textContent = 'Play or sing one note'; needle.style.transform = 'rotate(0deg)'; needle.setAttribute('class', 'tu-needle'); msg.textContent = ''; msg.className = 'tu-msg'; document.querySelectorAll('.tu-str').forEach(s => s.classList.remove('near', 'ok')); return; }
  let target = r, cents = r.cents;
  if (set[1].length) {   // with an instrument picked, measure against the nearest string
    const n = 12 * Math.log2(r.f / (m.a4 || 440)) + 69, str = set[1].reduce((a, s) => Math.abs(s - n) < Math.abs(a - n) ? s : a);
    cents = Math.round((n - str) * 100); target = { ...r, midi: str, name: MU_SHARP[str % 12], oct: Math.floor(str / 12) - 1 };
    document.querySelectorAll('.tu-str').forEach(s => { const on = +s.dataset.m === str; s.classList.toggle('near', on); s.classList.toggle('ok', on && Math.abs(cents) <= 5); });
  }
  const c = Math.max(-50, Math.min(50, cents)), ok = Math.abs(cents) <= 5;
  note.innerHTML = `${esc(muName(target.name))}<small>${target.oct}</small>`; note.className = 'tu-note' + (ok ? ' ok' : '');
  hz.textContent = `${r.f.toFixed(1)} Hz · ${cents > 0 ? '+' : ''}${cents} cents`;
  needle.style.transform = `rotate(${c * 1.4}deg)`; needle.setAttribute('class', 'tu-needle' + (ok ? ' ok' : Math.abs(cents) <= 20 ? ' near' : ''));
  msg.textContent = ok ? '✓ In tune!' : Math.abs(cents) > 50 ? (cents < 0 ? 'Much too low' : 'Much too high') : cents < 0 ? '↑ A little low: tighten / go up' : '↓ A little high: loosen / go down';
  msg.className = 'tu-msg' + (ok ? ' ok' : '');
}
function muTunerHtml() {
  const m = mus(), set = TUNINGS[m.tuning] || TUNINGS.chromatic, a4 = m.a4 || 440;
  return `<div class="tu-wrap">
    <div class="tu-dial"><svg viewBox="0 0 240 130" aria-hidden="true"><path d="M20,120 A100,100 0 0 1 220,120" class="tu-arc"/><path d="M113,21 A100,100 0 0 1 127,21" class="tu-green"/>
      ${[-50, -25, 0, 25, 50].map(v => { const a = (v * 1.4 - 90) * Math.PI / 180; return `<line x1="${120 + 92 * Math.cos(a)}" y1="${120 + 92 * Math.sin(a)}" x2="${120 + 104 * Math.cos(a)}" y2="${120 + 104 * Math.sin(a)}" class="tu-tick"/><text x="${120 + 80 * Math.cos(a)}" y="${124 + 80 * Math.sin(a)}" class="tu-lab">${v > 0 ? '+' + v : v}</text>`; }).join('')}
      <g id="tuNeedle" class="tu-needle" style="transform-origin:120px 120px"><line x1="120" y1="120" x2="120" y2="28"/><circle cx="120" cy="120" r="6"/></g></svg>
      <div class="tu-note" id="tuNote"><span class="muted">–</span></div><div class="muted small" id="tuHz">${tu.on ? 'Play or sing one note' : 'Tap Start and allow the microphone'}</div><div class="tu-msg" id="tuMsg"></div></div>
    <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap;margin:10px 0">
      <button type="button" class="btn ${tu.on ? '' : 'primary'} big" data-mu="tuner">${tu.on ? '⏹ Stop listening' : '🎙️ Start tuning'}</button>
      <select class="inp" data-mus="tuning" style="margin:0;width:auto" aria-label="Instrument">${Object.entries(TUNINGS).map(([k, [n]]) => `<option value="${k}" ${(m.tuning || 'chromatic') === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <label class="mu-tempo">A4 = <input type="number" class="inp" min="415" max="466" step="1" value="${a4}" data-mus="a4" style="margin:0;width:76px"> Hz</label></div>
    ${tu.err ? `<div class="bld-msg no">${esc(tu.err)}</div>` : ''}
    ${set[1].length ? `<div class="tu-strings">${set[1].map((s, i) => `<button type="button" class="tu-str" data-mu="tuRef" data-m="${s}" title="Hear this string’s note"><b>${esc(muName(MU_SHARP[s % 12]))}<small>${Math.floor(s / 12) - 1}</small></b><span>string ${set[1].length - i}</span></button>`).join('')}</div>
      <p class="muted small" style="text-align:center;margin:6px 0 0">Tap a string to hear its note. The string you’re closest to lights up, and turns green when it’s in tune.</p>`
      : `<p class="muted small" style="text-align:center;margin:6px 0 0">Shows the nearest note to whatever you play or sing. Pick an instrument to tune its strings.</p>`}
    <p class="muted small" style="text-align:center">The sound from your microphone stays on this device. Within ±5 cents counts as in tune.</p></div>`;
}
views.music = () => {
  const m = mus(); setTimeout(muMeterLoop, 0);
  return `<div class="crumbs"><a data-act="homeSubject" data-k="music">🎵 Music</a> / Music studio</div>
    <div class="row-between" style="margin-bottom:12px"><h2 style="margin:0">🎵 Music studio</h2>
      <div class="row" style="gap:6px;flex-wrap:wrap">${MU_TABS.map(([k, l]) => `<button type="button" class="btn sm ${m.tab === k ? 'primary' : ''}" data-mu="tab" data-k="${k}">${l}</button>`).join('')}</div></div>
    <div class="panel mu-panel">${({ theory: muTheoryHtml, ear: muEarHtml, tuner: muTunerHtml, drums: muDrumsHtml, maker: muMakerHtml, sheet: () => sheetHtml() })[m.tab]()}</div>`;
};
function muRedraw() { const p = document.querySelector('.mu-panel'); if (p && view.name === 'music') { p.innerHTML = ({ theory: muTheoryHtml, ear: muEarHtml, tuner: muTunerHtml, drums: muDrumsHtml, maker: muMakerHtml, sheet: () => sheetHtml() })[mus().tab](); muTransportBtns(); muMeterLoop(); } }
Object.assign(actions, { musicStudio: el => { if (el?.dataset?.t) mus().tab = el.dataset.t; go({ name: 'music' }); } });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-mu]'); if (!b || view.name !== 'music') return;
  const m = mus(), k = b.dataset.k;
  switch (b.dataset.mu) {
    case 'tab': if (k !== 'tuner') tuStop(); m.tab = k; muSave(); return render();
    case 'tuner': if (tu.on) { tuStop(); muRedraw(); } else tuStart(); return;
    case 'tuRef': return muNote(+b.dataset.m, 0, 1.6, 'piano', 0.5, false);
    case 'key': { const mi = +b.dataset.m; muNote(mi, 0, 0.8, m.inst, 0.6, 'shape'); muFlash([mi], 0, 250); return; }
    case 'kind': m.kind = k; break;
    case 'playTheory': return muPlayTheory(false);
    case 'playArp': return muPlayTheory(true);
    case 'circle': m.root = +b.dataset.r; m.kind = 'scale'; m.scale = 'major'; break;
    case 'circleMin': m.root = +b.dataset.r; m.kind = 'scale'; m.scale = 'minor'; break;
    case 'diat': { const r = +b.dataset.r, iv = MU_CHORDS[b.dataset.c][1], base = 60 + r - (r > 7 ? 12 : 0); iv.forEach(i => muNote(base + i, 0, 1.2, 'piano', 0.42, false)); muFlash(iv.map(i => base + i), 0, 900); return; }
    case 'prog': { const ac = muCtx(); if (!ac) return; const sc = MU_SCALES.major[1], kinds = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
      b.dataset.seq.split(',').map(Number).forEach((deg, i) => { let base = 60 + m.root + sc[deg]; if (base > 67) base -= 12;
        MU_CHORDS[kinds[deg]][1].forEach(iv => muNote(base + iv, ac.currentTime + 0.05 + i * 0.9, 0.85, 'piano', 0.38, false)); muNote(base - 12, ac.currentTime + 0.05 + i * 0.9, 0.85, 'bass', 0.4, false); });
      return; }
    case 'earMode': m.ear.mode = k; muQ = null; break;
    case 'earNext': muEarNew(); break;
    case 'earAgain': return muEarPlay();
    case 'earPick': { if (!muQ || muQ.given) return; muQ.given = b.dataset.v; const ok = muQ.given === muQ.answer, e2 = m.ear;
      e2.total++; if (ok) { e2.right++; e2.streak++; e2.best = Math.max(e2.best, e2.streak); if (typeof rightSound === 'function') rightSound(); if (typeof addPoints === 'function') addPoints(1); }
      else { e2.streak = 0; if (typeof sdSound === 'function') sdSound('wrong'); setTimeout(muEarPlay, 500); }
      break; }
    case 'earReset': m.ear = { mode: m.ear.mode, right: 0, total: 0, streak: 0, best: 0 }; muQ = null; break;
    case 'play': if (mt.on) muStop(); else muPlay(); return;
    case 'cell': { const row = m.drums[k] ||= Array(muSteps()).fill(0), s = +b.dataset.s; row[s] = ((row[s] || 0) + 1) % 3; if (row[s]) muDrum(k, 0, row[s] === 2 ? 1 : 0.85);
      b.className = `mu-cell ${muBeatCell(s)} ${row[s] ? 'on' + (row[s] === 2 ? ' acc' : '') : ''}`; b.setAttribute('aria-pressed', !!row[s]); muSave(); return; }
    case 'mute': m.mute[k] = !m.mute[k]; break;
    case 'metro': m.metro = !m.metro; if (m.metro && !mt.on) muClick(0, true); break;
    case 'inst': m.inst = k; muNote(60 + (m.tab === 'maker' ? m.mel.root : m.root), 0, 0.6, k, 0.6, m.tab === 'maker' ? undefined : 'shape');
      if (m.tab === 'maker') break;   // the grid changes to this track
      document.querySelectorAll('.mu-inst-b').forEach(x => { const on = x.dataset.k === k; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); }); muSave(); return;
    case 'trackOn': { const tr = muTrack(k); tr.on = !tr.on; break; }
    case 'sndOpen': setTimeout(() => { m.sndOpen = !!document.querySelector('.mu-snd')?.open; muSave(); }, 0); return;
    case 'sndPreview': { const ac = muCtx(); if (!ac) return; const base = m.tab === 'maker' ? 60 + m.mel.root : 60 + m.root, how = m.tab === 'maker' ? undefined : 'shape';
      [0, 4, 7, 12].forEach((iv, i) => muNote(base + iv, ac.currentTime + 0.05 + i * 0.28, 0.26, m.inst, 0.55, how)); [0, 4, 7].forEach(iv => muNote(base + iv, ac.currentTime + 1.25, 0.9, m.inst, 0.4, how)); return; }
    case 'sndReset': { if (m.sound) delete m.sound[m.inst]; break; }
    case 'presetSave': { const nm = prompt(`Name this sound (it saves ${MU_INSTRUMENTS[m.inst]}’s current settings)`, ''); if (!nm || !nm.trim()) return;
      muMyPresets().push({ id: uid(), name: nm.trim().slice(0, 40), inst: m.inst, sound: muCleanSound(muSound(m.inst)) }); toast(`💾 Preset “${nm.trim()}” saved`); break; }
    case 'presetApply': { const x = muAllPresets().find(p => p.id === b.dataset.id); if (!x) return; muApplyPreset(x); break; }
    case 'presetDel': { const l = muMyPresets(), i = l.findIndex(p => p.id === b.dataset.id); if (i < 0) return; const [gone] = l.splice(i, 1); muSave(); muRedraw();
      if (typeof undoToast === 'function') undoToast(`Deleted “${gone.name}”`, () => { l.splice(i, 0, gone); muSave(); muRedraw(); }); return; }
    case 'presetOne': { const x = muMyPresets().find(p => p.id === b.dataset.id); if (x) muExportPresets([x]); return; }
    case 'presetExport': if (muMyPresets().length) muExportPresets(muMyPresets()); return;
    case 'presetImport': return muImportPresets();
    case 'hearDrum': return muDrum(k);
    case 'clearDrums': m.drums = muPreset('empty'); break;
    case 'hearRow': return muNote(+b.dataset.m, 0, 0.5, m.inst);
    case 'note': { const s = +b.dataset.s, r = +b.dataset.r, i = m.mel.notes.findIndex(([a, c]) => a === s && c === r);
      if (i >= 0) m.mel.notes.splice(i, 1); else { m.mel.notes.push([s, r]); const rows = muMelRows(); muNote(rows[r], 0, 0.4, m.inst); }
      b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', i < 0); muSave(); return; }
    case 'clearMel': m.mel.notes = []; break;
    case 'clearAll': { const before = JSON.parse(JSON.stringify(m.tracks)), n = Object.values(before).reduce((a, t) => a + t.notes.length, 0); if (!n) return;
      if (!confirm(`Clear all ${n} notes on every track? (Sound settings stay.)`)) return;
      for (const t of Object.values(m.tracks)) t.notes = [];
      muSave(); muRedraw(); if (typeof undoToast === 'function') undoToast('🗑️ All tracks cleared', () => { m.tracks = before; muSave(); muRedraw(); }); return; }
    case 'mixOpen': setTimeout(() => { m.mixOpen = !!document.querySelector('.mu-mix')?.open; muSave(); }, 0); return;
    case 'randMel': m.mel.notes = muRandomMelody(); break;
    case 'trayAdd': { const tray = (m.tray ||= []); if (tray.length >= MU_TRAY_MAX) { toast('The tray is full: remove a part first'); return; }
      const hasAny = Object.values(m.tracks).some(t => t.notes.length) || Object.values(m.drums).some(r => r.some(Boolean)); if (!hasAny) { toast('Add some notes or drum hits first'); return; }
      tray.push({ ...muPartSnapshot(m), name: ['Intro', 'Verse', 'Chorus', 'Bridge', 'Outro'][tray.length] || `Part ${tray.length + 1}` }); toast(`📥 Added as part ${tray.length}`); break; }
    case 'trayUpdate': { const i = m.trayEditing; if (m.tray?.[i]) { m.tray[i] = { ...muPartSnapshot(m), name: m.tray[i].name }; toast(`💾 Part ${i + 1} updated`); } break; }
    case 'trayEditDone': m.trayEditing = null; break;
    case 'trayName': { const pt = m.tray[+b.dataset.i]; if (!pt) return; const nm = prompt('Name this part (for example Intro, Verse, Chorus)', pt.name || ''); if (nm == null) return; pt.name = nm.trim().slice(0, 30) || `Part ${+b.dataset.i + 1}`; muSave(); muRedrawTray(); return; }
    case 'trayEdit': { const p = m.tray[+b.dataset.i]; if (!p) return; const keep = muPartSnapshot(m);
      m.tracks = JSON.parse(JSON.stringify(p.tracks)); m.drums = JSON.parse(JSON.stringify(p.drums)); m.sig = p.sig || '4/4'; m.trayEditing = +b.dataset.i;
      if (typeof undoToast === 'function') undoToast(`✏️ Part ${+b.dataset.i + 1} is in the grid`, () => { m.tracks = keep.tracks; m.drums = keep.drums; m.trayEditing = null; muSave(); muRedraw(); }); break; }
    case 'trayDel': { const i = +b.dataset.i, [gone] = m.tray.splice(i, 1); if (m.trayEditing === i) m.trayEditing = null; else if (m.trayEditing > i) m.trayEditing--;
      if (mt.tray) muStop(); muSave(); muRedraw(); if (typeof undoToast === 'function') undoToast('Part removed from the tray', () => { m.tray.splice(i, 0, gone); muSave(); muRedraw(); }); return; }
    case 'trayMove': { const i = +b.dataset.i, j = i + +b.dataset.d; if (j < 0 || j >= m.tray.length) return; muTrayMove(i, j); return; }
    case 'trayPlay': if (mt.on && mt.tray) { muStop(); muRedrawTray(); } else muPlayTray(0); return;
    case 'trayFrom': muPlayTray(+b.dataset.i); return;
    case 'trayLoop': m.trayLoop = !m.trayLoop; muSave(); muRedrawTray(); return;
    case 'trayClear': { if (!confirm('Take all the parts out of the tray?')) return; const keep = m.tray; m.tray = []; m.trayEditing = null; if (mt.tray) muStop(); muSave(); muRedraw();
      if (typeof undoToast === 'function') undoToast('Tray emptied', () => { m.tray = keep; muSave(); muRedraw(); }); return; }
    case 'saveSong': { const name = prompt('Name your song', `My song ${m.saved.length + 1}`); if (!name) return;
      m.saved.push({ name: name.trim().slice(0, 40), bpm: m.bpm, swing: m.swing, inst: m.inst, drums: JSON.parse(JSON.stringify(m.drums)), tracks: JSON.parse(JSON.stringify(m.tracks)), sound: JSON.parse(JSON.stringify(m.sound || {})), tray: JSON.parse(JSON.stringify(m.tray || [])), trayLoop: !!m.trayLoop, sig: m.sig || '4/4' }); if (m.saved.length > 30) m.saved.shift();
      toast?.(`💾 Saved “${name.trim()}”`); break; }
    default: return;
  }
  muSave(); muRedraw();
});
document.addEventListener('input', e => {   // 🎚️ mixer sliders
  const k = e.target.dataset?.mix; if (!k || view.name !== 'music') return;
  const m = mus(), v = +e.target.value;
  if (k === 'master') { m.master = v; if (muAC) muOut.gain.setTargetAtTime(0.7 * v / 100, muAC.currentTime, 0.02); }
  else if (k === 'drums') m.drumVol = v;
  else if (k === 'metro') m.metroVol = v;
  else { ((m.sound ||= {})[k] ||= {}).vol = v; const s = document.querySelector('[data-snd="vol"]'); if (s && k === m.inst) { s.value = v; const o = document.querySelector('[data-sndv="vol"]'); if (o) o.textContent = v + '%'; } }
  document.querySelectorAll(`[data-mixv="${k}"]`).forEach(x => x.textContent = v + '%');
  muSave();
});
document.addEventListener('change', e => { const k = e.target.dataset?.mix; if (!k || k === 'master' || view.name !== 'music' || mt.on) return; k === 'drums' ? muDrum('snare') : k === 'metro' ? muClick(0, true) : muNote(60 + (muTrack(k).root || 0), 0, 0.4, k); });
document.addEventListener('input', e => {   // 🎛️ sound sliders
  const k = e.target.dataset?.snd; if (!k || view.name !== 'music' || e.target.tagName === 'SELECT') return;
  const m = mus(), all = (m.sound ||= {}), cur = (all[m.inst] ||= {}); cur[k] = +e.target.value;
  const v = cur[k], out = document.querySelector(`[data-sndv="${k}"]`);
  if (k === 'vol') { document.querySelectorAll(`[data-mix="${m.inst}"]`).forEach(x => x.value = v); document.querySelectorAll(`[data-mixv="${m.inst}"]`).forEach(x => x.textContent = v + '%'); }
  if (out) out.textContent = { oct: (v > 0 ? '+' : '') + v, semi: (v > 0 ? '+' : '') + v, cents: (v > 0 ? '+' : '') + v, bright: v + '%', att: v ? v + ' ms' : 'instant', rel: v ? v + ' ms' : 'normal', vol: v + '%' }[k];
  muSave();
});
document.addEventListener('change', e => {   // play a short note when you let go of a slider, so you hear the change
  const k = e.target.dataset?.snd; if (!k || view.name !== 'music') return;
  const m = mus(); if (k === 'wave') { ((m.sound ||= {})[m.inst] ||= {}).wave = e.target.value; muSave(); }
  muNote(60 + (m.tab === 'maker' ? m.mel.root : m.root), 0, 0.5, m.inst, 0.55, m.tab === 'maker' ? undefined : 'shape');
  const sum = document.querySelector('.mu-snd summary'); if (sum && !sum.querySelector('.mu-snd-dot') && muSoundChanged(m.inst)) sum.insertAdjacentHTML('beforeend', ' <span class="mu-snd-dot">changed</span>');
});
document.addEventListener('input', e => {
  const el = e.target.closest?.('[data-mus]'); if (!el || view.name !== 'music' || el.type !== 'range') return;
  const m = mus(); if (el.dataset.mus === 'bpm') { m.bpm = +el.value; document.querySelectorAll('.mu-bpm').forEach(x => x.textContent = m.bpm); }
  if (el.dataset.mus === 'swing') { m.swing = +el.value; document.querySelectorAll('.mu-swing').forEach(x => x.textContent = m.swing + '%'); }
  muSave();
});
document.addEventListener('change', e => {
  const el = e.target.closest?.('[data-mus]'); if (!el || view.name !== 'music' || el.type === 'range') return;
  const m = mus(), v = el.type === 'checkbox' ? el.checked : el.value;
  switch (el.dataset.mus) {
    case 'root': m.root = +v; break; case 'scale': m.scale = v; break; case 'chord': m.chord = v; break; case 'interval': m.interval = +v; break; case 'names': m.names = v; break;
    case 'preset': if (!v) return; m.drums = muPreset(v); break;
    case 'inst': m.inst = v; muNote(60 + m.mel.root, 0, 0.5, v); break;
    case 'melRoot': m.mel.root = +v; break;
    case 'melScale': { const old = muMelRows().length; m.mel.scale = v; const n = muMelRows().length; m.mel.notes = m.mel.notes.map(([s, r]) => [s, Math.min(n - 1, Math.round(r * (n - 1) / Math.max(1, old - 1)))]); break; }
    case 'useDrums': m.useDrums = v; break; case 'useMel': m.useMel = v; break;
    case 'tuning': m.tuning = v; break;
    case 'presetUse': { const x = muAllPresets().find(p => p.id === v); if (x) muApplyPreset(x); return; }
    case 'sig': { m.sig = v; muFitDrums(m.drums, muSteps()); const off = Object.values(m.tracks).reduce((a, t) => a + t.notes.filter(([s]) => s >= muSteps()).length, 0);
      if (off) toast(`${off} note${off === 1 ? ' is' : 's are'} past the end of a ${v} bar. ${off === 1 ? 'It’s' : 'They’re'} kept, and come back if you choose a longer bar.`); break; }
    case 'a4': m.a4 = Math.max(415, Math.min(466, +v || 440)); break;
    case 'loadSong': { const x = m.saved[+v]; if (!x) return; Object.assign(m, { bpm: x.bpm, swing: x.swing, inst: x.inst, drums: JSON.parse(JSON.stringify(x.drums)), tracks: JSON.parse(JSON.stringify(x.tracks || { [x.inst || 'piano']: { ...x.mel, on: true } })), ...(x.sound ? { sound: JSON.parse(JSON.stringify(x.sound)) } : {}), tray: JSON.parse(JSON.stringify(x.tray || [])), trayLoop: !!x.trayLoop, trayEditing: null, sig: x.sig || '4/4' }); toast?.(`📂 ${x.name}`); break; }
    default: return;
  }
  muSave(); muRedraw();
});
/* play the piano with the computer keyboard on the Theory tab */
const MU_KEYMAP = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14 };
document.addEventListener('keydown', e => {
  if (view.name !== 'music' || mus().tab !== 'theory' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || /input|select|textarea/i.test(e.target.tagName)) return;
  const off = MU_KEYMAP[e.key.toLowerCase()]; if (off == null) return;
  e.preventDefault(); const mi = 60 + off; muNote(mi, 0, 0.8, mus().inst, 0.6, 'shape'); muFlash([mi], 0, 250);
});
/* stop the music when leaving the studio */
{ const r = window.render; if (typeof r === 'function') window.render = function () { if (mt.on && view.name !== 'music') muStop(); if (tu.on && (view.name !== 'music' || mus().tab !== 'tuner')) tuStop(); return r.apply(this, arguments); }; }
