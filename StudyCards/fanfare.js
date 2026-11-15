'use strict';
/* ================= 🎺 Fanfares for a right answer =================
   Shared by the Sentence Builder, Match words, Finish the sentence, Listen & tap, Say it! and Numbers & ABC.
   One choice for all of them (the sound menu in each game). playFanfare() returns how long it lasts in ms (0 = no sound),
   so a game can wait before reading the answer aloud. Off with the mascot sound setting, or "No sound". */
let fanAC = null;
const FANFARES = { trumpets: '🎺 Trumpets', chimes: '🔔 Chimes', arcade: '👾 Arcade', harp: '🪕 Harp', marimba: '🎶 Marimba', organ: '⛪ Organ', sparkle: '✨ Sparkle', off: '🔇 No sound' };
const fanfareName = () => { const k = S.settings.fanfare ?? S.settings.rsFanfare; return FANFARES[k] ? k : 'trumpets'; };
function playFanfare(name = fanfareName()) {
  if (S.settings?.mascotSound === false || name === 'off') return 0;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return 0;
  try {
    fanAC ||= new AC(); const ac = fanAC; if (ac.state === 'suspended') ac.resume();
    const t0 = ac.currentTime + 0.03, out = ac.createGain(); out.gain.value = 0.16; out.connect(ac.destination);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.connect(out);
    const F = n => 440 * Math.pow(2, (n - 69) / 12);   // MIDI note -> Hz
    // one note: layers of [wave, detune, volume], attack, how long it rings, and how it fades
    const note = (n, at, len, { waves = [['sawtooth', -6, 0.5], ['sawtooth', 6, 0.5], ['square', 0, 0.25]], vol = 1, att = 0.03, pluck = false, bend = 0 } = {}) => {
      for (const [type, det, v] of waves) {
        const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = F(n); o.detune.value = det;
        const s = t0 + at; if (bend) { o.frequency.setValueAtTime(F(n) * bend, s); o.frequency.exponentialRampToValueAtTime(F(n), s + 0.06); }
        g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(v * vol, s + att);
        if (pluck) g.gain.exponentialRampToValueAtTime(0.0001, s + len);
        else { g.gain.setValueAtTime(v * vol * 0.8, s + len * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, s + len); }
        o.connect(g); g.connect(lp); o.start(s); o.stop(s + len + 0.05);
      }
    };
    const run = (notes, step, len, opt) => notes.forEach((n, i) => note(n, i * step, len, opt));
    const bell = { waves: [['sine', 0, 0.7], ['sine', 1200, 0.18], ['triangle', 2400, 0.08]], att: 0.005, pluck: true };
    switch (name) {
      case 'chimes': lp.frequency.value = 6000;
        run([84, 88, 91, 96], 0.16, 1.1, bell); note(91, 0.72, 1.4, bell); note(96, 0.72, 1.6, { ...bell, vol: 0.8 }); return 1900;
      case 'arcade': lp.frequency.value = 5000;
        run([72, 76, 79, 84, 79, 84, 88, 91], 0.07, 0.08, { waves: [['square', 0, 0.35]], att: 0.005 });
        note(96, 0.6, 0.45, { waves: [['square', 0, 0.3], ['square', 7, 0.2]], att: 0.005, bend: 0.5 }); return 1100;
      case 'harp': lp.frequency.value = 4500;
        run([60, 64, 67, 72, 76, 79, 84, 88], 0.06, 1.2, { waves: [['triangle', 0, 0.6], ['sine', 1200, 0.1]], att: 0.004, pluck: true });
        for (const n of [72, 76, 79, 84]) note(n, 0.6, 1.3, { waves: [['triangle', 0, 0.4]], att: 0.004, pluck: true }); return 1800;
      case 'marimba': lp.frequency.value = 3500;
        { const m = { waves: [['sine', 0, 0.8], ['sine', 2400, 0.12]], att: 0.003, pluck: true };
          [[72, 0], [76, 0.12], [79, 0.24], [76, 0.36], [79, 0.48], [84, 0.6]].forEach(([n, at]) => note(n, at, 0.35, m));
          for (const n of [72, 79, 84]) note(n, 0.84, 0.6, m); } return 1350;
      case 'organ': lp.frequency.value = 3000;
        { const o = { waves: [['sine', 0, 0.45], ['sine', 1200, 0.25], ['sine', 1902, 0.12], ['sine', 2400, 0.1]], att: 0.04 };
          note(60, 0, 0.42, o); note(64, 0, 0.42, o); note(67, 0, 0.42, o);
          note(65, 0.45, 0.42, o); note(69, 0.45, 0.42, o); note(72, 0.45, 0.42, o);
          for (const n of [60, 64, 67, 72]) note(n, 0.9, 1.0, o); } return 1950;
      case 'sparkle': lp.frequency.value = 8000;
        run([96, 91, 100, 96, 103, 100, 108], 0.07, 0.5, { ...bell, vol: 0.6 }); note(103, 0.55, 1.1, { ...bell, vol: 0.5 }); note(108, 0.62, 1.2, { ...bell, vol: 0.4 }); return 1500;
      default:   // trumpets
        note(67, 0, 0.13); note(72, 0.14, 0.13); note(76, 0.28, 0.13); note(79, 0.42, 0.24);
        note(76, 0.68, 0.12); note(79, 0.81, 0.12);
        for (const n of [72, 76, 79, 84]) note(n, 0.95, 0.75, { vol: 0.6 }); return 1550;
    }
  } catch { return 0; }
}
/* the sound menu: the same choice in every game; you hear it when you pick it */
const fanfarePicker = () => `<select class="inp fanfare-pick" data-fanfare style="margin:0;width:auto" title="The sound when you get it right (you hear it when you pick one)" aria-label="Sound for a right answer">${Object.entries(FANFARES).map(([k, l]) => `<option value="${k}" ${k === fanfareName() ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
document.addEventListener('change', e => {
  if (!e.target.matches?.('select[data-fanfare]')) return;
  S.settings.fanfare = e.target.value; save(); playFanfare(e.target.value);
});
/* the sound for a right answer: the fanfare, or the small "ding" if the fanfare is set to No sound */
function rightSound() { const ms = playFanfare(); if (!ms && typeof sdSound === 'function') sdSound('right'); return ms; }
