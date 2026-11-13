'use strict';
/* ================= Welcome tour for new users =================
   A short guided walk through the app: each step lights up a real button and Ollie explains it.
   Starts by itself for someone new (no study days yet) once their profile is set up.
   Replay any time from Settings → "Take the tour". S.settings.tourDone = true once finished or skipped. */
const firstDeck = () => S.decks[0] || null;
const TOUR_STEPS = [
  { view: 'home', title: '¡Hola! Welcome to Estudiamos', text: 'This app helps you learn words with flashcards, quizzes and games. This quick tour shows you around. It takes about a minute.', mood: 'happy' },
  { view: 'home', sel: '[data-act="newDeck"]', title: 'Make a deck', text: 'A <b>deck</b> is a set of flashcards about one topic, like “Food” or “Verbs”. You pick the language for the front and the back of the cards.' },
  { view: 'home', sel: '[data-act="importFile"]', title: 'Already have cards?', text: 'Bring them in from Anki, a spreadsheet (CSV) or a text list. Inside a deck you can also scan a page with your camera.' },
  { view: 'home', sel: '.deck', needDeck: true, title: 'Your decks', text: 'Each deck shows how many cards are waiting for you today. Press <b>Study</b> to do them. Decks can be sorted into folders and marked as ⭐ favorites.' },
  { view: 'deck', sel: '.add-card', needDeck: true, title: 'Add cards', text: 'Type the word on the front and its meaning on the back. You can add pictures, sounds, colors and an example sentence too.' },
  { view: 'deck', sel: '[data-act="study"]', needDeck: true, title: 'Study a little every day', text: 'When you study, you see the front of a card, think of the answer, then flip it. Tell the app how well you knew it, and it brings the card back <b>right before you would forget it</b>.' },
  { view: 'deck', sel: '[data-act="games"]', needDeck: true, title: 'Practice for fun', text: '<b>Quiz</b>, <b>⚡ Quick review</b> and <b>Games</b> use the same cards. There are lots of games, including adventures and a Sentence Builder.' },
  { view: 'deck', sel: '#cardListHead', needDeck: true, title: 'All your cards', text: 'Search, sort and filter your cards here. Tick some cards to fix many at once, add word labels like <b>noun</b> or <b>verb</b>, and more.' },
  { view: 'home', sel: '[data-nav="dictionary"]', title: 'Dictionary', text: 'Look up any word and add it to a deck in one tap.' },
  { view: 'home', sel: '[data-nav="progress"]', title: 'Progress', text: 'See how many words you know, your study calendar and your streak.' },
  { view: 'home', sel: '[data-nav="rewards"]', title: 'Rewards and packs', text: 'Studying earns points. Spend them on rewards, and open <b>Packs</b> to collect picture cards.' },
  { view: 'home', sel: '[data-nav="settings"]', title: 'Settings', text: 'Change voices, colors and timers, and make backups. <b>Phone & sync → 📖 Setup guide</b> shows how to use Estudiamos on your phone, at home or anywhere. You can replay this tour from here too.' },
  { view: 'home', title: 'You’re ready! 🎉', text: 'Start by making a deck, or open one and press <b>Study</b>. A few minutes a day is all it takes. ¡Buena suerte!', mood: 'happy', last: true },
];
let tour = null;
function tourSteps() { return TOUR_STEPS.filter(s => !s.needDeck || firstDeck()); }
function tourStart() {
  if (tour) tourEnd(false);
  if ($('#dlg').open) $('#dlg').close();
  tour = { i: 0, steps: tourSteps() };
  document.body.insertAdjacentHTML('beforeend', `<div id="tour" role="dialog" aria-modal="true" aria-labelledby="tourTitle"><i class="tour-dim"></i><i class="tour-dim"></i><i class="tour-dim"></i><i class="tour-dim"></i><div class="tour-hole"></div><div class="tour-card"></div></div>`);
  window.addEventListener('resize', tourPlace); window.addEventListener('scroll', tourPlace, true); document.addEventListener('keydown', tourKey);
  tourShow();
}
function tourEnd(done = true) {
  document.getElementById('tour')?.remove();
  window.removeEventListener('resize', tourPlace); window.removeEventListener('scroll', tourPlace, true); document.removeEventListener('keydown', tourKey);
  if (tour) { S.settings.tourDone = true; save(); }
  tour = null;
  if (done && view.name !== 'home') go({ name: 'home' });
}
function tourKey(e) {
  if (!tour) return;
  if (e.key === 'Escape') { e.preventDefault(); tourEnd(); }
  else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); tourNext(1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); tourNext(-1); }
}
function tourNext(dir) {
  if (!tour) return;
  const i = tour.i + dir; if (i < 0) return;
  if (i >= tour.steps.length) return tourEnd();
  tour.i = i; tourShow();
}
function tourShow() {
  const s = tour.steps[tour.i], n = tour.steps.length;
  // go to the screen this step is about
  if (s.view === 'deck' && firstDeck() && !(view.name === 'deck' && deckById(view.deckId))) go({ name: 'deck', deckId: firstDeck().id });
  if (s.view === 'home' && (view.name !== 'home' || view.folderId || view.favOnly)) go({ name: 'home' });
  const box = document.querySelector('#tour .tour-card');
  box.innerHTML = `
    ${typeof mascotSays === 'function' ? `<div class="tour-head">${typeof mascot === 'function' && !(typeof lookPro === 'function' && lookPro()) ? mascot(54, s.mood || 'happy') : ''}<div><div class="muted small">Step ${tour.i + 1} of ${n}</div><h3 id="tourTitle">${s.title}</h3></div></div>` : `<h3 id="tourTitle">${s.title}</h3>`}
    <p>${s.text}</p>
    <div class="tour-dots" aria-hidden="true">${tour.steps.map((_, k) => `<i class="${k === tour.i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="tour-btns">
      ${s.last ? '<span></span>' : '<button type="button" class="btn ghost" data-tour="skip">Skip tour</button>'}
      <div class="row" style="gap:8px">${tour.i ? '<button type="button" class="btn" data-tour="back">← Back</button>' : ''}
      <button type="button" class="btn primary" data-tour="next">${s.last ? 'Let’s go!' : tour.i ? 'Next →' : 'Show me around'}</button></div>
    </div>`;
  box.querySelectorAll('[data-tour]').forEach(b => b.onclick = () => b.dataset.tour === 'skip' ? tourEnd() : tourNext(b.dataset.tour === 'back' ? -1 : 1));
  // bring the button into view (the menu scrolls sideways on phones), then light it up
  const el = tourTarget();
  if (el) { el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }); if (scrollX) scrollTo(0, scrollY); }
  tourPlace();
  setTimeout(() => box.querySelector('[data-tour=next]')?.focus({ preventScroll: true }), 30);
}
function tourTarget() {
  const s = tour?.steps[tour.i]; if (!s?.sel) return null;
  const el = [...document.querySelectorAll(s.sel)].find(x => x.offsetParent !== null || x.getClientRects().length);
  return el || null;
}
function tourPlace() {
  if (!tour) return;
  const wrap = document.getElementById('tour'); if (!wrap) return;
  const hole = wrap.querySelector('.tour-hole'), card = wrap.querySelector('.tour-card'), el = tourTarget(), dims = wrap.querySelectorAll('.tour-dim');
  const W = innerWidth, H = innerHeight, pad = 8;
  if (!el) {   // nothing to point at: card in the middle, whole screen dimmed
    wrap.classList.add('center'); hole.style.cssText = ''; card.style.cssText = ''; dims.forEach(x => { x.style.cssText = ''; }); return;
  }
  wrap.classList.remove('center');
  const r = el.getBoundingClientRect();
  const hx = Math.max(4, r.left - pad), hy = Math.max(4, r.top - pad), hw = Math.min(W - 8, r.width + pad * 2), hh = Math.min(H * 0.6, r.height + pad * 2);
  hole.style.cssText = `left:${hx}px;top:${hy}px;width:${hw}px;height:${hh}px`;
  // dark panels all around the lit-up part (above, below, left, right)
  const box = [[0, 0, W, hy], [0, hy + hh, W, H - hy - hh], [0, hy, hx, hh], [hx + hw, hy, W - hx - hw, hh]];
  dims.forEach((x, k) => { const [l, t, w, h] = box[k]; x.style.cssText = `left:${l}px;top:${t}px;width:${Math.max(0, w)}px;height:${Math.max(0, h)}px`; });
  // put the card below the lit-up part if there is room, otherwise above
  const cw = Math.min(380, W - 24), ch = card.offsetHeight || 220;
  let top = hy + hh + 12; if (top + ch > H - 8) top = Math.max(8, hy - ch - 12);
  if (top + ch > H - 8 && hy - ch - 12 < 8) top = Math.max(8, H - ch - 8);   // no room either way (tall target on a phone)
  const left = Math.min(Math.max(12, hx + hw / 2 - cw / 2), W - cw - 12);
  card.style.cssText = `width:${cw}px;left:${left}px;top:${top}px`;
}
/* start by itself for someone brand new, after the profile setup window (if any) is closed */
function tourMaybe() {
  if (tour || S.settings.tourDone) return;
  const studied = Object.values(S.log || {}).some(l => l && (l.reviews || l.practice || l.points)) || S.cards.some(c => c.state && c.state !== 'new');
  if (studied) { S.settings.tourDone = true; save(); return; }   // not new: never pop up on its own
  const dlg = $('#dlg');
  if (dlg.open) { dlg.addEventListener('close', () => setTimeout(tourMaybe, 700), { once: true }); return; }
  if (view.name !== 'home') return;
  setTimeout(() => { if (!tour && !$('#dlg').open && !S.settings.tourDone) tourStart(); }, 500);
}
Object.assign(actions, { tourStart: () => tourStart() });
