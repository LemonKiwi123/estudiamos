'use strict';
/* ================= Peanut Millionaire: climb a 15-step prize ladder of word questions =================
   Questions get harder as you climb (harder words, trickier look-alike answers, other question types).
   Safe havens at 5 and 10. Lifelines: 50:50, Ask the animals (poll), Ask Ollie. Walk away any time.
   The peanuts you keep turn into real peanuts for the rewards shop. */
const PM_LADDER = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000];
const PM_SAFE = [4, 9];                                     // index of questions 5 and 10
const PM_REAL = [0, 1, 2, 3, 4, 6, 8, 10, 12, 14, 18, 22, 26, 32, 40, 60];   // real peanuts kept for each level reached (0–15)
let pm = null;
const fmtNuts = n => n.toLocaleString();
function pmQuestion(level, card, d, all) {
  const kinds = level < 5 ? ['meaning'] : level < 10 ? ['meaning', 'reverse', 'listen', 'blank'] : ['reverse', 'listen', 'blank', 'meaning'];
  let kind = kinds[Math.floor(Math.random() * kinds.length)];
  if (kind === 'listen' && (!d.frontLang || d.tts === false)) kind = 'reverse';
  const blank = kind === 'blank' && card.example ? findBlank(card.example, card.front, d.frontLang) : null;
  if (kind === 'blank' && !blank) kind = 'meaning';
  const others = all.filter(x => x.id !== card.id);
  // later questions use look-alike wrong answers
  const tricky = (correct, pool) => {
    const uniq = [...new Map(pool.filter(p => p && norm(p) !== norm(correct)).map(p => [norm(p), p])).values()];
    const ranked = level >= 8 ? uniq.sort((a, b) => lev(norm(a), norm(correct)) - lev(norm(b), norm(correct))) : shuffle(uniq);
    return shuffle([correct, ...ranked.slice(0, 3)]);
  };
  const q = { kind, card, lang: d.frontLang, mlang: d.backLang };
  if (kind === 'meaning' || kind === 'listen') Object.assign(q, { prompt: card.front, promptLang: d.frontLang, answer: card.back, answerLang: d.backLang, options: tricky(card.back, others.map(x => x.back)) });
  else if (kind === 'reverse') Object.assign(q, { prompt: card.back, promptLang: d.backLang, answer: card.front, answerLang: d.frontLang, options: tricky(card.front, others.map(x => x.front)) });
  else Object.assign(q, { blank, prompt: plainSent(card.example), promptLang: d.frontLang, answer: blank.word, answerLang: d.frontLang,
    options: tricky(blank.word.toLocaleLowerCase(), others.map(x => coreOf(x.front).join(' ').toLocaleLowerCase())) });
  if (q.options.length < 4) q.options = shuffle([...q.options, ...['—', '—', '—'].slice(0, 4 - q.options.length)]);
  return q;
}
function startMillionaire(deckId) {
  const d = deckById(deckId), all = runnerPool(deckId);
  if (all.length < 6) { toast('Peanut Millionaire needs at least 6 cards with text on both sides'); return; }
  // easy cards first, hard cards last
  const sorted = shuffle(all).sort((a, b) => sdDifficulty(a) - sdDifficulty(b));
  let picks;
  if (sorted.length >= PM_LADDER.length) picks = PM_LADDER.map((_, i) => sorted[Math.floor(i * sorted.length / PM_LADDER.length)]);   // all different
  else {   // small deck: every card once (easy → hard), then repeats come back later as harder question types
    picks = [...sorted];
    while (picks.length < PM_LADDER.length) { const more = shuffle(sorted).filter(c => c !== picks.at(-1)); picks.push(...more); }
    picks = picks.slice(0, PM_LADDER.length);
  }
  pm = { deckId, d, all, picks, level: 0, q: null, phase: 'q', sel: null, life: { fifty: true, poll: true, ollie: true }, removed: [], poll: null, ollie: null, results: [], start: Date.now() };
  pmNext(); go({ name: 'millionaire' });
}
function pmNext() {
  pm.q = pmQuestion(pm.level, pm.picks[pm.level], pm.d, pm.all);
  pm.phase = 'q'; pm.sel = null; pm.removed = []; pm.poll = null; pm.ollie = null;
  if (pm.q.kind === 'listen' || autoplayOn()) setTimeout(() => speak(pm.q.kind === 'blank' ? pm.q.prompt : pm.q.prompt, pm.q.promptLang), 300);
}
const pmBanked = () => { const safe = PM_SAFE.filter(i => i < pm.level); return safe.length ? safe.at(-1) + 1 : 0; };   // levels kept after a wrong answer
function pmSelect(i) { if (pm?.phase !== 'q' || pm.removed.includes(i) || pm.q.options[i] === '—') return; pm.sel = i; render(); }
function pmLock() {
  if (pm?.phase !== 'q' || pm.sel == null) return;
  pm.phase = 'locked'; render(); pmSound('suspense');
  setTimeout(() => {
    const ok = norm(pm.q.options[pm.sel]) === norm(pm.q.answer);
    pm.results.push({ cardId: pm.q.card.id, q: pm.q.prompt, a: pm.q.answer, given: pm.q.options[pm.sel], ok });
    pm.phase = ok ? 'right' : 'wrong'; pmSound(ok ? 'right' : 'wrong');
    if (ok) { pm.level++; if (pm.level >= PM_LADDER.length) { pm.phase = 'won'; pmFinish(PM_LADDER.length); } }
    else pmFinish(pmBanked());
    render();
    if (ok && autoplayOn()) speak(pm.q.answer, pm.q.answerLang);
  }, 1700);
}
function pmWalk() {
  if (pm?.phase !== 'q') return;
  confirmDlg('Walk away?', `You’ll keep ${fmtNuts(pm.level ? PM_LADDER[pm.level - 1] : 0)} peanuts and the game ends.`, 'Walk away', () => { pm.phase = 'walked'; pmFinish(pm.level); render(); });
}
function pmFinish(levelsKept) {
  pm.kept = levelsKept; pm.prize = levelsKept ? PM_LADDER[levelsKept - 1] : 0; pm.real = PM_REAL[levelsKept];
  if (pm.real && typeof rw === 'function') rw().peanuts += pm.real;
  if (typeof addHistory === 'function') addHistory({ type: 'millionaire', deckId: pm.deckId, deckName: pm.d.name, correct: pm.results.filter(r => r.ok).length, total: pm.results.length,
    score: Math.round(pm.level / PM_LADDER.length * 100), timeMs: Date.now() - pm.start, detail: `reached question ${Math.min(15, pm.level + (pm.phase === 'wrong' ? 1 : 0))} · kept ${fmtNuts(pm.prize)} 🥜`, items: pm.results });
  else save();
}
/* ---------- Lifelines ---------- */
function pmLifeline(kind) {
  if (pm?.phase !== 'q' || !pm.life[kind]) return;
  pm.life[kind] = false;
  const q = pm.q, right = q.options.findIndex(o => norm(o) === norm(q.answer));
  const live = [0, 1, 2, 3].filter(i => !pm.removed.includes(i) && q.options[i] !== '—');
  if (kind === 'fifty') {
    const wrong = shuffle(live.filter(i => i !== right)); pm.removed.push(...wrong.slice(0, Math.max(0, live.length - 2)));
    if (pm.sel != null && pm.removed.includes(pm.sel)) pm.sel = null; friendSound('rabbit');
  } else if (kind === 'poll') {
    const acc = Math.max(0.38, 0.86 - pm.level * 0.035);   // the animals are less sure about harder questions
    const raw = live.map(i => i === right ? acc * 100 : (1 - acc) * 100 * (0.3 + Math.random()));
    const sum = raw.reduce((a, b) => a + b, 0), votes = {}; live.forEach((i, k) => { votes[i] = Math.round(raw[k] / sum * 100); });
    pm.poll = votes; friendSound('monkey');
  } else {
    const sure = Math.max(0.55, 0.95 - pm.level * 0.03), guess = Math.random() < sure ? right : shuffle(live.filter(i => i !== right))[0] ?? right;
    const pct = Math.round((guess === right ? sure : 1 - sure + 0.2) * 100);
    const says = pct >= 85 ? 'I’m very sure' : pct >= 65 ? 'I think' : 'Hmm, I’m not sure… maybe';
    pm.ollie = { guess, text: `${says} it’s <b>${'ABCD'[guess]}: ${esc(q.options[guess])}</b>. Hoo!`, pct }; friendSound('owl');
  }
  render();
}
function pmSound(kind) {
  if (S.settings?.mascotSound === false) return;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  audioCtx ||= new AC(); const ac = audioCtx; if (ac.state === 'suspended') ac.resume();
  const t0 = ac.currentTime + 0.01;
  const tone = (s, dur, f, type = 'sine', vol = 0.18, f2) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0 + s); if (f2) o.frequency.linearRampToValueAtTime(f2, t0 + s + dur);
    g.gain.setValueAtTime(0.0001, t0 + s); g.gain.exponentialRampToValueAtTime(vol, t0 + s + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t0 + s + dur);
    o.connect(g); g.connect(ac.destination); o.start(t0 + s); o.stop(t0 + s + dur + 0.02); };
  if (kind === 'suspense') { tone(0, 1.6, 110, 'sine', 0.22, 130); tone(0, 1.6, 165, 'sine', 0.12, 196); }
  else if (kind === 'right') { [523, 659, 784, 1047].forEach((f, i) => tone(i * 0.09, 0.3, f, 'triangle', 0.17)); }
  else if (kind === 'wrong') { tone(0, 0.6, 220, 'sawtooth', 0.12, 110); }
}

/* ---------- View ---------- */
views.millionaire = () => {
  if (!pm) { view = { name: 'home' }; return views.home(); }
  const q = pm.q, d = pm.d, done = ['won', 'wrong', 'walked'].includes(pm.phase);
  const right = q.options.findIndex(o => norm(o) === norm(q.answer));
  const ladder = PM_LADDER.map((v, i) => `<li class="${i === pm.level && !done ? 'cur' : ''} ${i < pm.level ? 'done' : ''} ${PM_SAFE.includes(i) ? 'safe' : ''}"><span>${i + 1}</span><b>🥜 ${fmtNuts(v)}</b></li>`).reverse().join('');
  const label = { meaning: 'What does this mean?', reverse: `How do you say this in ${langName(d.frontLang)}?`, listen: 'Listen. What does it mean?', blank: 'Which word completes the sentence?' }[q.kind];
  const prompt = q.kind === 'listen' && !['right', 'wrong', 'won'].includes(pm.phase)
    ? `<div class="row" style="justify-content:center">${speakBtn(q.prompt, q.promptLang, true)}<button type="button" class="btn sm" data-act="pmReplay">🐢 Slower</button></div>`
    : q.kind === 'blank' ? `<div class="sentence">${esc(q.blank.before)}<span class="blank">${pm.phase === 'right' || done ? esc(q.blank.word) : '&nbsp;'}</span>${esc(q.blank.after)}</div>`
    : `<div class="row" style="justify-content:center;gap:8px"><span class="pm-word">${esc(q.prompt)}</span>${speakBtn(q.prompt, q.promptLang)}</div>`;
  const opts = q.options.map((o, i) => {
    let cls = '';
    if (pm.removed.includes(i) || o === '—') cls = 'gone';
    else if (pm.phase === 'locked' && pm.sel === i) cls = 'locked';
    else if (['right', 'wrong', 'won', 'walked'].includes(pm.phase) && i === right) cls = 'right';
    else if (pm.phase === 'wrong' && pm.sel === i) cls = 'wrong';
    else if (pm.phase === 'q' && pm.sel === i) cls = 'sel';
    const bar = pm.poll && pm.poll[i] != null ? `<span class="pm-poll" style="width:${pm.poll[i]}%"></span><span class="pm-pct">${pm.poll[i]}%</span>` : '';
    return `<button type="button" class="pm-opt ${cls}" data-act="pmSel" data-i="${i}" ${pm.phase !== 'q' || cls === 'gone' ? 'disabled' : ''}>${bar}<span class="pm-letter">${'ABCD'[i]}</span><span class="pm-text">${cls === 'gone' ? '' : esc(o)}</span></button>`;
  }).join('');
  const life = (k, icon, name) => `<button type="button" class="pm-life" data-act="pmLife" data-k="${k}" ${pm.life[k] && pm.phase === 'q' ? '' : 'disabled'} title="${name}">${icon}<span>${name}</span></button>`;
  let footer = '';
  if (pm.phase === 'q') footer = `<div class="row" style="justify-content:center"><button type="button" class="btn" data-act="pmWalk">🚶 Walk away with 🥜 ${fmtNuts(pm.level ? PM_LADDER[pm.level - 1] : 0)}</button>
      <button type="button" class="btn primary big" data-act="pmLock" ${pm.sel == null ? 'disabled' : ''}>${pm.sel == null ? 'Pick an answer' : `Final answer: ${'ABCD'[pm.sel]}?`}</button></div>`;
  else if (pm.phase === 'locked') footer = `<div class="pm-msg">🥁 Final answer locked in…</div>`;
  else if (pm.phase === 'right') footer = `<div class="pm-msg ok">✅ Correct! You now have 🥜 ${fmtNuts(PM_LADDER[pm.level - 1])}${PM_SAFE.includes(pm.level - 1) ? ' (safe! You’ll keep this even if you miss later)' : ''}</div>
      <div class="row" style="justify-content:center"><button type="button" class="btn primary big" id="pmNextBtn" data-act="pmNext">Next question (${pm.level + 1}/15) <kbd style="background:transparent;color:inherit;border-color:currentColor;opacity:.7">Enter</kbd></button></div>`;
  const results = done ? `<div class="panel tw-over">${mascot(100, pm.phase === 'wrong' && !pm.kept ? 'sleepy' : 'party')}
      <div class="word">${pm.phase === 'won' ? '🎉 You’re a PEANUT MILLIONAIRE! 🎉' : pm.phase === 'walked' ? 'Smart move!' : 'Oh no!'}</div>
      <p class="muted" style="margin:0">${pm.phase === 'wrong' ? `The answer was <b>${esc(q.answer)}</b> (${esc(q.card.front)} = ${esc(q.card.back)}). ` : ''}You won <b>🥜 ${fmtNuts(pm.prize)}</b> pretend peanuts.</p>
      ${pm.real ? `<div class="reward">🥜 +${pm.real} real peanuts added to your rewards!</div>` : ''}
      ${friendTip('monkey', 'result', { pct: pm.level / 15 * 100 }, { compact: true })}
      <div class="row" style="justify-content:center"><button type="button" class="btn primary" data-act="pmAgain">Play again</button><button type="button" class="btn" data-act="games" data-id="${pm.deckId}">Other games</button></div></div>` : '';
  return `
    <div class="study-top"><button type="button" class="btn ghost" data-act="pmQuit">← Games</button><div class="prompt-label muted">🥜 Peanut Millionaire · ${esc(d.name)}</div><span></span></div>
    ${results}
    <div class="pm-layout">
      <section class="pm-main">
        <div class="pm-lifelines">${life('fifty', '½', '50:50')}${life('poll', '🐾', 'Ask the animals')}${life('ollie', '🦉', 'Ask Ollie')}</div>
        ${pm.ollie ? `<div class="friend-tip compact">${friendSvg('owl', 54)}<div class="bubble"><b>Ollie</b> ${pm.ollie.text}</div></div>` : ''}
        ${pm.poll ? `<div class="muted small" style="text-align:center">🐾 The animals voted! (bars on the answers)</div>` : ''}
        <div class="pm-q"><div class="muted small">Question ${Math.min(15, pm.level + (pm.phase === 'right' ? 0 : 1))} of 15 · for 🥜 ${fmtNuts(PM_LADDER[Math.min(14, pm.phase === 'right' ? pm.level - 1 : pm.level)])}</div>
          <div class="prompt-label muted" style="margin-top:6px">${label}</div>${prompt}</div>
        <div class="pm-opts">${opts}</div>
        ${footer}
      </section>
      <ol class="pm-ladder">${ladder}</ol>
    </div>
    <div class="shortcuts">Keys A–D or 1–4 to choose · Enter for final answer</div>`;
};
Object.assign(actions, {
  pmSel: el => pmSelect(+el.dataset.i),
  pmLock: () => pmLock(),
  pmNext: () => { pmNext(); render(); },
  pmWalk: () => pmWalk(),
  pmLife: el => pmLifeline(el.dataset.k),
  pmReplay: () => speak(pm.q.prompt, pm.q.promptLang, 0.65),
  pmAgain: () => startMillionaire(pm.deckId),
  pmQuit: () => { if (pm && pm.phase === 'q' && pm.level) pmWalk(); else go({ name: 'games', deckId: pm.deckId }); },
});
document.addEventListener('keydown', e => {
  if (view.name !== 'millionaire' || !pm || $('#dlg').open || e.ctrlKey || e.altKey) return;
  const k = e.key.toLowerCase(), idx = 'abcd'.indexOf(k) >= 0 ? 'abcd'.indexOf(k) : '1234'.indexOf(k);
  if (pm.phase === 'q' && idx >= 0 && k.length === 1) { e.preventDefault(); pmSelect(idx); }
  else if (pm.phase === 'q' && e.key === 'Enter') { e.preventDefault(); pmLock(); }
  else if (pm.phase === 'right' && e.key === 'Enter') { e.preventDefault(); pmNext(); render(); }
});
