'use strict';
/* ================= 🎼 Sheet music guide (Music studio tab) =================
   The staff and clefs, line and space names, note and rest values, time and key signatures,
   dynamics, tempo words, repeat signs, and a note-reading quiz. Notes on the staff can be tapped to hear them. */
const SM_LET = ['C', 'D', 'E', 'F', 'G', 'A', 'B'], SM_SEMI = [0, 2, 4, 5, 7, 9, 11];
const SM_CLEF = { treble: { base: 30, name: '𝄞 Treble clef', glyph: '𝄞' }, bass: { base: 18, name: '𝄢 Bass clef', glyph: '𝄢' } };   // base = the bottom line (E4 / G2) as a step number
const smLetter = d => SM_LET[((d % 7) + 7) % 7];
const smOct = d => Math.floor(d / 7);
const smMidi = (d, acc = 0) => (smOct(d) + 1) * 12 + SM_SEMI[((d % 7) + 7) % 7] + acc;
const SM_SHARPS = [38, 35, 39, 36, 33, 37, 34], SM_FLATS = [34, 37, 33, 36, 32, 35, 31];   // F C G D A E B / B E A D G C F on the treble staff (the bass staff is 14 steps lower)
const SM_KEYS = [[0, 'C major', 'A minor'], [1, 'G major', 'E minor'], [2, 'D major', 'B minor'], [3, 'A major', 'F♯ minor'], [4, 'E major', 'C♯ minor'], [5, 'B major', 'G♯ minor'], [6, 'F♯ major', 'D♯ minor'], [7, 'C♯ major', 'A♯ minor'],
  [-1, 'F major', 'D minor'], [-2, 'B♭ major', 'G minor'], [-3, 'E♭ major', 'C minor'], [-4, 'A♭ major', 'F minor'], [-5, 'D♭ major', 'B♭ minor'], [-6, 'G♭ major', 'E♭ minor'], [-7, 'C♭ major', 'A♭ minor']];
function smKeyAcc(key) {   // which letters are raised or lowered in this key: { F: 1, C: 1 } or { B: -1 }
  const out = {}; (key > 0 ? 'FCGDAEB' : 'BEADGCF').slice(0, Math.abs(key)).split('').forEach(l => out[l] = key > 0 ? 1 : -1); return out;
}
function smState() { const m = mus(); m.sheet ||= { clef: 'treble', key: 0, sec: 'staff', q: null, right: 0, tries: 0, best: 0, streak: 0, qclef: 'treble', range: 'staff' }; return m.sheet; }
/* ---------- drawing ---------- */
const SM_GAP = 12;
function smStaff({ clef = 'treble', key = 0, notes = [], w = 520, top = 34, sig = '', act = '' }) {
  const c = SM_CLEF[clef], bot = top + SM_GAP * 4, y = d => bot - (d - c.base) * SM_GAP / 2, h = bot + 46;
  let s = `<svg class="sm-staff" viewBox="0 0 ${w} ${h}" role="img" aria-label="${c.name} staff">`;
  for (let i = 0; i < 5; i++) s += `<line x1="4" x2="${w - 4}" y1="${top + i * SM_GAP}" y2="${top + i * SM_GAP}" class="sm-line"/>`;
  s += `<line x1="4" x2="4" y1="${top}" y2="${bot}" class="sm-line"/><line x1="${w - 4}" x2="${w - 4}" y1="${top}" y2="${bot}" class="sm-line"/>`;
  s += clef === 'treble' ? `<text x="8" y="${bot + 9}" class="sm-clef" font-size="66">𝄞</text>` : `<text x="9" y="${top + 31}" class="sm-clef" font-size="44">𝄢</text>`;
  let x = 52; const shift = clef === 'bass' ? -14 : 0;
  (key > 0 ? SM_SHARPS : SM_FLATS).slice(0, Math.abs(key)).forEach(d => { s += `<text x="${x}" y="${y(d + shift) + (key > 0 ? 7 : 5)}" class="sm-acc">${key > 0 ? '♯' : '♭'}</text>`; x += 13; });
  if (sig) { const [a, b] = sig.split('/'); s += `<text x="${x + 6}" y="${top + 21}" class="sm-sig">${a}</text><text x="${x + 6}" y="${top + 45}" class="sm-sig">${b}</text>`; x += 26; }
  const n = notes.length, x0 = x + 22, step = n > 1 ? (w - x0 - 22) / (n - 1) : 0;
  notes.forEach((o, i) => {
    const nx = n > 1 ? x0 + i * step : (x0 + w) / 2 - 10, ny = y(o.d);
    for (let k = c.base - 2; k >= o.d; k -= 2) s += `<line x1="${nx - 11}" x2="${nx + 11}" y1="${y(k)}" y2="${y(k)}" class="sm-line"/>`;   // ledger lines
    for (let k = c.base + 10; k <= o.d; k += 2) s += `<line x1="${nx - 11}" x2="${nx + 11}" y1="${y(k)}" y2="${y(k)}" class="sm-line"/>`;
    const up = o.d < c.base + 4, cls = 'sm-note' + (o.cls ? ' ' + o.cls : '');
    s += `<g class="${cls}" ${act ? `data-smn="${act}" data-d="${o.d}" data-a="${o.acc || 0}" tabindex="0" role="button" aria-label="${smLetter(o.d)}${smOct(o.d)}"` : ''}><rect x="${nx - 13}" y="${top - 30}" width="26" height="${h - top + 22}" fill="transparent"/>`;
    if (o.acc) s += `<text x="${nx - 22}" y="${ny + 5}" class="sm-acc">${o.acc > 0 ? '♯' : '♭'}</text>`;
    s += `<ellipse cx="${nx}" cy="${ny}" rx="6.6" ry="4.8" transform="rotate(-20 ${nx} ${ny})" class="sm-head"/>`;
    s += up ? `<line x1="${nx + 6}" x2="${nx + 6}" y1="${ny - 1}" y2="${ny - 34}" class="sm-stem"/>` : `<line x1="${nx - 6}" x2="${nx - 6}" y1="${ny + 1}" y2="${ny + 34}" class="sm-stem"/>`;
    if (o.label) s += `<text x="${nx}" y="${h - 6}" class="sm-lab">${esc(o.label)}</text>`;
    s += '</g>';
  });
  return s + '</svg>';
}
function smValueSvg(k) {   // one note or rest picture, 60 × 70
  const head = (fill) => `<ellipse cx="24" cy="52" rx="8" ry="6" transform="rotate(-20 24 52)" class="${fill ? 'sm-head' : 'sm-hollow'}"/>`, stem = '<line x1="31" x2="31" y1="50" y2="12" class="sm-stem"/>';
  const flag = y => `<path d="M31,${y} c2,8 14,10 10,24 c2,-10 -6,-14 -10,-16 z" class="sm-head"/>`;
  const P = {
    whole: `<ellipse cx="30" cy="40" rx="10" ry="6.5" class="sm-hollow" stroke-width="3"/>`, half: head(false) + stem, quarter: head(true) + stem, eighth: head(true) + stem + flag(12), sixteenth: head(true) + stem + flag(12) + flag(22),
    dotted: head(false) + stem + '<circle cx="42" cy="50" r="2.6" class="sm-head"/>',
    rwhole: '<line x1="12" x2="48" y1="30" y2="30" class="sm-line"/><line x1="12" x2="48" y1="42" y2="42" class="sm-line"/><rect x="20" y="30" width="20" height="6" class="sm-head"/>',
    rhalf: '<line x1="12" x2="48" y1="30" y2="30" class="sm-line"/><line x1="12" x2="48" y1="42" y2="42" class="sm-line"/><rect x="20" y="36" width="20" height="6" class="sm-head"/>',
    rquarter: '<path d="M26,14 L36,26 L29,35 L37,46 C30,43 26,47 31,56 C21,50 24,40 31,42 L23,31 L30,24 Z" class="sm-head"/>',
    reighth: '<circle cx="24" cy="28" r="4" class="sm-head"/><path d="M24,31 C30,32 34,29 37,24 L28,56" class="sm-stem" fill="none"/>',
    rsixteenth: '<circle cx="22" cy="24" r="3.6" class="sm-head"/><circle cx="19" cy="36" r="3.6" class="sm-head"/><path d="M22,27 C28,28 33,25 38,20 L26,58 M19,39 C25,40 30,37 34,32" class="sm-stem" fill="none"/>',
  };
  return `<svg viewBox="0 0 60 66" class="sm-val" aria-hidden="true">${P[k] || ''}</svg>`;
}
/* ---------- the sections ---------- */
const SM_SECS = [['staff', '🎼 Staff & clefs'], ['values', '⏱️ Note values'], ['time', '🥁 Time signatures'], ['keys', '♯ Key signatures'], ['marks', '📢 Dynamics & tempo'], ['repeat', '🔁 Repeats & road map'], ['quiz', '🎯 Note-reading quiz']];
function smStaffSec() {
  const t = smState(), c = SM_CLEF[t.clef], lines = [0, 2, 4, 6, 8].map(i => c.base + i), spaces = [1, 3, 5, 7].map(i => c.base + i);
  const L = d => muName(smLetter(d)), tips = t.clef === 'treble'
    ? ['<b>Lines</b> (bottom to top): E G B D F — “<b>E</b>very <b>G</b>ood <b>B</b>ird <b>D</b>oes <b>F</b>ly”', '<b>Spaces</b> (bottom to top): F A C E — they spell “<b>FACE</b>”', 'The treble clef curls around the <b>G line</b> (2nd line), so it’s also called the G clef. Middle C sits on one ledger line below the staff.']
    : ['<b>Lines</b> (bottom to top): G B D F A — “<b>G</b>ood <b>B</b>ikes <b>D</b>on’t <b>F</b>all <b>A</b>part”', '<b>Spaces</b> (bottom to top): A C E G — “<b>A</b>ll <b>C</b>ows <b>E</b>at <b>G</b>rass”', 'The bass clef’s two dots sit around the <b>F line</b> (4th line), so it’s also called the F clef. Middle C sits on one ledger line above the staff.'];
  const span = []; for (let d = c.base - 3; d <= c.base + 11; d++) span.push({ d, label: L(d) });
  return `<div class="seg-btns" style="margin-bottom:10px">${Object.entries(SM_CLEF).map(([k, v]) => `<button type="button" class="btn sm ${t.clef === k ? 'primary' : ''}" data-sm="clef" data-k="${k}">${v.name}</button>`).join('')}</div>
    <div class="sm-two"><div><div class="sm-cap">Lines</div>${smStaff({ clef: t.clef, notes: lines.map(d => ({ d, label: L(d) })), w: 300, act: 'play' })}</div>
      <div><div class="sm-cap">Spaces</div>${smStaff({ clef: t.clef, notes: spaces.map(d => ({ d, label: L(d) })), w: 300, act: 'play' })}</div></div>
    <ul class="sm-tips">${tips.map(x => `<li>${x}</li>`).join('')}</ul>
    <div class="sm-cap">Every note from below the staff to above it — tap one to hear it</div>
    <div class="sm-scroll">${smStaff({ clef: t.clef, notes: span, w: 760, act: 'play' })}</div>
    <p class="muted small">Notes go up the alphabet as they go up the staff: A B C D E F G, then back to A. <b>Ledger lines</b> are short extra lines for notes above or below the five lines. Piano music uses both clefs together (the <b>grand staff</b>): treble for the right hand, bass for the left, with middle C between them.</p>`;
}
const SM_VALUES = [['whole', 'Whole note', 4, 'rwhole', 'Hangs below the 4th line'], ['half', 'Half note', 2, 'rhalf', 'Sits on the 3rd line, like a hat'], ['quarter', 'Quarter note', 1, 'rquarter', 'The squiggle'], ['eighth', 'Eighth note', 0.5, 'reighth', 'One flag'], ['sixteenth', 'Sixteenth note', 0.25, 'rsixteenth', 'Two flags']];
function smValuesSec() {
  const fr = b => b >= 1 ? `${b} beat${b > 1 ? 's' : ''}` : b === 0.5 ? '½ beat' : '¼ beat';
  return `<p class="muted small" style="margin-top:0">Counted in 4/4 time, where a quarter note gets one beat. A <b>rest</b> is a silence that lasts just as long as its note.</p>
    <div class="sm-vals">${SM_VALUES.map(([k, n, b, r, tip]) => `<div class="sm-vrow"><button type="button" class="sm-vbtn" data-sm="beat" data-b="${b}" title="Hear how long it lasts">${smValueSvg(k)}</button><div><b>${n}</b><div class="muted small">${fr(b)}</div></div>
      <div class="sm-vbtn rest">${smValueSvg(r)}</div><div><b>${n.replace('note', 'rest')}</b><div class="muted small">${esc(tip)}</div></div></div>`).join('')}</div>
    <div class="sm-tree" aria-label="How notes split">
      <div>1 whole</div><div>= 2 halves</div><div>= 4 quarters</div><div>= 8 eighths</div><div>= 16 sixteenths</div></div>
    <div class="sm-two" style="margin-top:12px"><div class="sm-card"><div class="row" style="gap:8px;align-items:center">${smValueSvg('dotted')}<div><b>Dotted notes</b><div class="small">A dot adds <b>half</b> the note’s value again. Dotted half = 2 + 1 = <b>3 beats</b>. Dotted quarter = 1 + ½ = <b>1½ beats</b>.</div></div></div></div>
      <div class="sm-card"><b>Ties and triplets</b><div class="small">A <b>tie</b> (curved line between two notes of the same pitch) joins them into one long note. A <b>triplet</b> (a little 3) squeezes three notes into the time of two.</div></div></div>
    <p class="muted small">Tap a note to hear how long it lasts at 80 beats a minute.</p>`;
}
function smTimeSec() {
  const T = [['4/4', 'Four quarter-note beats in a bar. The most common one, also written as <b>C</b> (“common time”).', 'ONE two three four'], ['3/4', 'Three beats in a bar: waltzes and many folk songs.', 'ONE two three'], ['2/4', 'Two beats in a bar: marches and polkas.', 'ONE two'],
    ['6/8', 'Six eighth notes, felt as two big beats of three.', 'ONE two three FOUR five six'], ['2/2', 'Two half-note beats. Also written as ¢ (“cut time”). Feels fast.', 'ONE two'], ['5/4', 'Five beats, often felt as 3 + 2 or 2 + 3.', 'ONE two three FOUR five'], ['12/8', 'Four big beats of three eighths each: blues ballads.', 'ONE two three FOUR five six…']];
  return `<p class="muted small" style="margin-top:0">The <b>top number</b> says how many beats are in each bar (measure). The <b>bottom number</b> says which note gets one beat: 4 = quarter note, 8 = eighth note, 2 = half note.</p>
    <div class="sm-grid">${T.map(([s, d, c]) => `<div class="sm-card">${smStaff({ sig: s, w: 120, notes: [] })}<b>${s}</b><div class="small">${d}</div><div class="muted small">Count: ${c}</div></div>`).join('')}</div>
    <p class="muted small"><b>Bar lines</b> divide the music into bars. A <b>double bar line</b> marks the end of a section, and a thin line with a thick one marks the very end. Try these in the Music studio’s drum machine: it has a time signature picker.</p>`;
}
function smKeysSec() {
  const t = smState(), k = SM_KEYS.find(x => x[0] === t.key) || SM_KEYS[0], acc = smKeyAcc(t.key);
  const scale = [], start = SM_LET.indexOf(k[1][0]);   // the major scale from its key letter, with the key's sharps or flats
  for (let i = 0; i <= 7; i++) { const d = 28 + start + i; scale.push({ d: d + (t.clef === 'bass' ? -14 : 0), label: muName(smLetter(d) + (acc[smLetter(d)] > 0 ? '♯' : acc[smLetter(d)] < 0 ? '♭' : '')) }); }
  return `<div class="sm-two"><div class="sm-card"><b>Order of sharps</b><div class="sm-order">F C G D A E B</div><div class="small">“<b>F</b>ather <b>C</b>harles <b>G</b>oes <b>D</b>own <b>A</b>nd <b>E</b>nds <b>B</b>attle”. Trick: the major key is one half step <b>above the last sharp</b>.</div></div>
      <div class="sm-card"><b>Order of flats</b><div class="sm-order">B E A D G C F</div><div class="small">The same words backwards: “<b>B</b>attle <b>E</b>nds <b>A</b>nd <b>D</b>own <b>G</b>oes <b>C</b>harles’ <b>F</b>ather”. Trick: the key is the <b>second-to-last flat</b> (F major has just one flat: B♭).</div></div></div>
    <div class="row" style="gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0">
      <select class="inp" data-smk style="margin:0;width:auto" aria-label="Key">${SM_KEYS.map(([n, a, b]) => `<option value="${n}" ${n === t.key ? 'selected' : ''}>${a} / ${b} — ${n ? Math.abs(n) + (n > 0 ? ' ♯' : ' ♭') : 'none'}</option>`).join('')}</select>
      <div class="seg-btns">${Object.entries(SM_CLEF).map(([c, v]) => `<button type="button" class="btn sm ${t.clef === c ? 'primary' : ''}" data-sm="clef" data-k="${c}">${v.name}</button>`).join('')}</div>
      <button type="button" class="btn sm" data-sm="playScale">▶ Play the scale</button></div>
    <div class="sm-scroll">${smStaff({ clef: t.clef, key: t.key, notes: scale, w: 620, act: 'key' })}</div>
    <p class="small"><b>${k[1]}</b> and <b>${k[2]}</b> share this key signature (they’re <b>relative</b> keys). ${t.key ? `Every ${Object.keys(acc).map(l => muName(l)).join(', ')} is played ${t.key > 0 ? 'sharp' : 'flat'} unless a natural sign (♮) says otherwise.` : 'No sharps or flats: all white keys on a piano.'}</p>
    <p class="muted small">A key signature sits right after the clef on every line. An <b>accidental</b> (♯ sharp, ♭ flat, ♮ natural) written next to a note changes it until the end of that bar.</p>`;
}
const SM_DYN = [['ppp', 'pianississimo', 'as soft as possible'], ['pp', 'pianissimo', 'very soft'], ['p', 'piano', 'soft'], ['mp', 'mezzo-piano', 'medium soft'], ['mf', 'mezzo-forte', 'medium loud'], ['f', 'forte', 'loud'], ['ff', 'fortissimo', 'very loud'], ['fff', 'fortississimo', 'as loud as possible']];
const SM_TEMPO = [['Grave', '20–40', 'very slow and serious'], ['Largo', '40–60', 'slow and broad'], ['Adagio', '66–76', 'slow, at ease'], ['Andante', '76–108', 'at a walking pace'], ['Moderato', '108–120', 'medium speed'], ['Allegretto', '112–120', 'a little lively'], ['Allegro', '120–156', 'fast and bright'], ['Vivace', '156–176', 'lively and fast'], ['Presto', '168–200', 'very fast'], ['Prestissimo', '200+', 'as fast as possible']];
const SM_MORE = [['cresc. / <', 'crescendo', 'get gradually louder'], ['dim. / >', 'diminuendo (decrescendo)', 'get gradually softer'], ['sfz', 'sforzando', 'a sudden strong accent'], ['rit. / rall.', 'ritardando / rallentando', 'gradually slow down'], ['accel.', 'accelerando', 'gradually speed up'], ['a tempo', 'a tempo', 'back to the speed from before'], ['•', 'staccato (dot over a note)', 'short and detached'], ['–', 'tenuto (line over a note)', 'hold it for its full length'], ['>', 'accent', 'play that note stronger'], ['𝄐', 'fermata', 'hold the note longer than written'], ['⌒', 'slur', 'play the notes smoothly connected (legato)']];
function smMarksSec() {
  const row = ([a, b, c], cls = '') => `<div class="sm-mrow"><span class="sm-sym ${cls}">${a}</span><b>${b}</b><span class="muted small">${c}</span></div>`;
  return `<div class="sm-two"><div><div class="sm-cap">Dynamics: how loud</div>${SM_DYN.map(r => row(r, 'dyn')).join('')}<div class="sm-dynbar" aria-hidden="true"></div></div>
      <div><div class="sm-cap">Tempo: how fast (beats per minute)</div>${SM_TEMPO.map(([a, b, c]) => `<div class="sm-mrow"><b>${a}</b><span class="sm-bpm">${b}</span><span class="muted small">${c}</span><button type="button" class="btn sm ghost" data-sm="tempo" data-b="${parseInt(b)}" aria-label="Hear ${a}">▶</button></div>`).join('')}</div></div>
    <div class="sm-cap" style="margin-top:14px">Changes and articulation</div><div class="sm-grid tight">${SM_MORE.map(r => row(r)).join('')}</div>
    <p class="muted small">Most music words are Italian. The ▶ buttons tick at the slow end of each tempo.</p>`;
}
function smRepeatSec() {
  const bar = `<svg viewBox="0 0 60 60" class="sm-val" aria-hidden="true">${[0, 1, 2, 3, 4].map(i => `<line x1="0" x2="60" y1="${10 + i * 10}" y2="${10 + i * 10}" class="sm-line"/>`).join('')}`;
  const start = bar + '<rect x="14" y="10" width="5" height="40" class="sm-head"/><line x1="24" x2="24" y1="10" y2="50" class="sm-stem"/><circle cx="30" cy="25" r="2.6" class="sm-head"/><circle cx="30" cy="35" r="2.6" class="sm-head"/></svg>';
  const end = bar + '<circle cx="30" cy="25" r="2.6" class="sm-head"/><circle cx="30" cy="35" r="2.6" class="sm-head"/><line x1="36" x2="36" y1="10" y2="50" class="sm-stem"/><rect x="41" y="10" width="5" height="40" class="sm-head"/></svg>';
  const R = [[start, 'Start repeat', 'Go back to here when you reach the end-repeat sign.'], [end, 'End repeat', 'Go back to the start-repeat sign (or the beginning) and play that part again.'],
    ['<span class="sm-sym">1. ┐ 2. ┐</span>', '1st and 2nd endings', 'Play the 1st ending the first time. On the repeat, skip it and play the 2nd ending.'], ['<span class="sm-sym">D.C.</span>', 'Da capo', '“From the head”: go back to the very beginning.'],
    ['<span class="sm-sym">D.S. 𝄋</span>', 'Dal segno', '“From the sign”: go back to the 𝄋 sign.'], ['<span class="sm-sym">Fine</span>', 'Fine', '“The end”: stop here after a D.C. or D.S.'],
    ['<span class="sm-sym">𝄌</span>', 'Coda', 'A tail ending. “To coda” means jump ahead to the 𝄌 sign.'], ['<span class="sm-sym">D.C. al Fine</span>', 'Da capo al fine', 'Go back to the beginning and play until Fine.'], ['<span class="sm-sym">D.S. al Coda</span>', 'Dal segno al coda', 'Go back to the sign, play to “To coda”, then jump to the coda.']];
  return `<div class="sm-grid">${R.map(([s, n, d]) => `<div class="sm-card"><div class="sm-rsym">${s}</div><b>${n}</b><div class="small">${d}</div></div>`).join('')}</div>
    <div class="sm-card" style="margin-top:12px"><b>Reading the road map</b><div class="small">Before you play, scan the page for repeat signs, endings, D.C., D.S., Fine and Coda so you know the path. Example: <b>A B :‖ C D.C. al Fine</b> with Fine after B → play A B, A B again, C, then A B and stop.</div></div>`;
}
function smQuizNew() {
  const t = smState(), c = SM_CLEF[t.qclef === 'both' ? (Math.random() < .5 ? 'treble' : 'bass') : t.qclef], lo = t.range === 'staff' ? c.base : c.base - 4, hi = t.range === 'staff' ? c.base + 8 : c.base + 12;
  let d; do d = lo + Math.floor(Math.random() * (hi - lo + 1)); while (t.q && d === t.q.d && Math.random() < .8);
  t.q = { d, clef: c === SM_CLEF.treble ? 'treble' : 'bass', given: null };
}
function smQuizSec() {
  const t = smState(); if (!t.q) smQuizNew(); const q = t.q, ans = smLetter(q.d);
  return `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px">
      <div class="seg-btns">${[['treble', '𝄞 Treble'], ['bass', '𝄢 Bass'], ['both', 'Both']].map(([k, l]) => `<button type="button" class="btn sm ${t.qclef === k ? 'primary' : ''}" data-sm="qclef" data-k="${k}">${l}</button>`).join('')}</div>
      <div class="seg-btns">${[['staff', 'On the staff'], ['ledger', 'With ledger lines']].map(([k, l]) => `<button type="button" class="btn sm ${t.range === k ? 'primary' : ''}" data-sm="range" data-k="${k}">${l}</button>`).join('')}</div></div>
    <div class="sm-quiz">${smStaff({ clef: q.clef, notes: [{ d: q.d, cls: q.given ? (q.given === ans ? 'ok' : 'no') : '' }], w: 260, act: q.given ? 'play' : '' })}</div>
    <div class="sm-ans">${SM_LET.map(l => `<button type="button" class="btn big ${q.given ? (l === ans ? 'primary' : l === q.given ? 'danger' : '') : ''}" data-sm="ans" data-k="${l}" ${q.given ? 'disabled' : ''}>${esc(muName(l))}</button>`).join('')}</div>
    <div class="sm-qmsg">${q.given ? (q.given === ans ? `✓ Yes! That’s ${esc(muName(ans))}${smOct(q.d)}.` : `Not quite: it’s <b>${esc(muName(ans))}</b>${smOct(q.d)}. ${smHint(q)}`) : 'What note is this?'}</div>
    <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap">${q.given ? '<button type="button" class="btn primary" data-sm="qnext">Next note →</button>' : ''}<span class="muted small">Score ${t.right} / ${t.tries} · streak ${t.streak} · best streak ${t.best}</span>${t.tries ? '<button type="button" class="btn sm ghost" data-sm="qreset">Reset</button>' : ''}</div>`;
}
function smHint(q) {
  const c = SM_CLEF[q.clef], off = q.d - c.base, onLine = off % 2 === 0;
  if (off < 0 || off > 8) return 'Count up or down from the nearest line you know, one letter per line or space.';
  return q.clef === 'treble' ? (onLine ? 'Lines: Every Good Bird Does Fly.' : 'Spaces spell FACE.') : (onLine ? 'Lines: Good Bikes Don’t Fall Apart.' : 'Spaces: All Cows Eat Grass.');
}
function sheetHtml() {
  const t = smState(), F = { staff: smStaffSec, values: smValuesSec, time: smTimeSec, keys: smKeysSec, marks: smMarksSec, repeat: smRepeatSec, quiz: smQuizSec };
  return `<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:12px">${SM_SECS.map(([k, l]) => `<button type="button" class="btn sm ${t.sec === k ? 'primary' : ''}" data-sm="sec" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="sm-body">${(F[t.sec] || smStaffSec)()}</div>`;
}
function smRedraw() { const b = document.querySelector('.sm-body'); if (!b) return; if (typeof muRedraw === 'function') muRedraw(); }
document.addEventListener('click', e => {
  if (view.name !== 'music') return;
  const n = e.target.closest('[data-smn]'); if (n) { const t = smState(), d = +n.dataset.d; let acc = 0;
    if (n.dataset.smn === 'key') acc = smKeyAcc(t.key)[smLetter(d)] || 0; muNote(smMidi(d, acc), 0, 0.9, 'piano', 0.6, false); n.classList.add('lit'); setTimeout(() => n.classList.remove('lit'), 300); return; }
  const b = e.target.closest('[data-sm]'); if (!b) return; const t = smState(), k = b.dataset.k;
  switch (b.dataset.sm) {
    case 'sec': t.sec = k; break;
    case 'clef': t.clef = k; break;
    case 'qclef': t.qclef = k; t.q = null; break;
    case 'range': t.range = k; t.q = null; break;
    case 'qnext': smQuizNew(); break;
    case 'qreset': Object.assign(t, { right: 0, tries: 0, streak: 0 }); break;
    case 'ans': { const q = t.q; if (!q || q.given) return; q.given = k; t.tries++; const ok = k === smLetter(q.d);
      if (ok) { t.right++; t.streak++; t.best = Math.max(t.best, t.streak); muNote(smMidi(q.d), 0, 0.9, 'piano', 0.6, false); } else { t.streak = 0; if (typeof sdSound === 'function') sdSound('wrong'); }
      break; }
    case 'beat': { const ac = muCtx(); if (!ac) return; const beat = 60 / 80, len = +b.dataset.b * beat; muNote(67, ac.currentTime + 0.05, len * 0.95, 'piano', 0.55, false);
      for (let i = 0; i < Math.max(1, Math.ceil(+b.dataset.b)); i++) muClick(ac.currentTime + 0.05 + i * beat, i === 0); return; }
    case 'tempo': { const ac = muCtx(); if (!ac) return; const beat = 60 / +b.dataset.b; for (let i = 0; i < 8; i++) muClick(ac.currentTime + 0.05 + i * beat, i % 4 === 0); return; }
    case 'playScale': { const ac = muCtx(); if (!ac) return; const acc = smKeyAcc(t.key), kk = SM_KEYS.find(x => x[0] === t.key) || SM_KEYS[0], start = SM_LET.indexOf(kk[1][0]);
      for (let i = 0; i <= 7; i++) { const d = 28 + start + i - (t.clef === 'bass' ? 14 : 0); muNote(smMidi(d, acc[smLetter(d)] || 0), ac.currentTime + 0.05 + i * 0.35, 0.33, 'piano', 0.55, false); } return; }
    default: return;
  }
  muSave(); smRedraw();
});
document.addEventListener('change', e => { if (view.name !== 'music' || !e.target.matches('[data-smk]')) return; smState().key = +e.target.value; muSave(); smRedraw(); });
document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('[data-smn]')) { e.preventDefault(); e.target.closest('[data-smn]').dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
