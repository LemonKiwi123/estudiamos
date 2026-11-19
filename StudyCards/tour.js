'use strict';
/* ================= Guided tour of the main features =================
   Chapters you can take one at a time or all in a row. Each step lights up a real button and the elephant mascot explains it;
   a step whose button isn't on screen (a phone layout, a deck without pictures) just shows its card in the middle.
   - Someone brand new: the full tour starts by itself once their profile is set up.
   - Someone who already used the app: asked once whether they'd like to see the new tour.
   - Any time: Settings → "Take the tour" opens the chapter list.
   S.settings.tourDone = true once the tour was finished or skipped; S.settings.tour2 = true once the new tour was offered. */
const firstDeck = () => S.decks[0] || null;
const TOUR_CHAPTERS = [
  { id: 'start', icon: '🏠', name: 'Getting started', about: 'Decks, folders and subjects', steps: [
    { view: 'home', sel: '[data-act="newDeck"]', title: 'Make a deck', text: 'A <b>deck</b> is a set of flashcards about one topic, like “Food” or “Verbs”. You pick the language (or subject) for the front and the back of the cards.' },
    { view: 'home', sel: '[data-act="importFile"]', title: 'Already have cards?', text: 'Bring them in from Anki, Quizlet-style lists, a spreadsheet (CSV) or a text file. Inside a deck you can also scan a page with your camera.' },
    { view: 'home', sel: '.subj-tabs', title: 'Subjects', text: 'Decks are sorted by subject: <b>Languages, Math, Science, Social Studies, Art, Music, Coding</b> and more. Each subject tab also has its own tools, like a graphing calculator or a world map.' },
    { view: 'home', sel: '.deck', needDeck: true, title: 'Your decks', text: 'Each deck shows how many cards are waiting for you today. Press <b>Study</b> to do them, or ⭐ to make it a favorite.' },
    { view: 'home', sel: '[data-act="newFolder"]', title: 'Folders', text: 'Group decks into colored folders (and folders inside folders). Drag a deck onto a folder to move it. Pick any color for a folder.' },
    { view: 'home', sel: '#profileBtn', title: 'You and your character', text: 'Tap your picture for your profile. <b>🎨 Make your character</b> from head to toe: face, eyes, hair, glasses, tops, pants and shoes, with sliders to nudge each part into place. Choose <b>☀️ light or 🌙 dark</b> mode and a background there too.' },
  ] },
  { id: 'day', icon: '☀️', name: 'Your day', about: 'Streak, reminders and notes', steps: [
    { view: 'home', sel: '.streak-panel', title: 'Your streak', text: 'Reach your daily goal to keep your <b>streak</b> going. Missed a day? A ❄️ <b>streak freeze</b> saves it. Tap <b>Calendar</b> to see every day you studied.' },
    { view: 'home', sel: '.rem-box', title: 'Reminders', text: 'Add reminders like “Review my flashcards at 7 pm”, once or every day. Turn on notifications to get a pop-up when one is due.' },
    { view: 'home', sel: '.note-box', title: 'Sticky notes', text: 'Jot down words to look up or homework. Notes save as you type. Tap the arrow to fold a box away.' },
    { view: 'home', sel: '.stats', title: 'Today at a glance', text: 'Cards waiting, cards reviewed today, your streak and how many cards you have. You can also switch on a surprise <b>📝 pop quiz</b> in Settings (it stays quiet until you tap 🔊).' },
  ] },
  { id: 'study', icon: '🧠', name: 'Studying', about: 'Study, quick review, quizzes and games', needDeck: true, steps: [
    { view: 'deck', sel: '[data-act="study"]', title: 'Study a little every day', text: 'See the front of a card, think of the answer, then flip it. Tell the app how well you knew it, and it brings the card back <b>right before you would forget it</b>.' },
    { view: 'deck', sel: '[data-act="quickStart"]', title: '⚡ Quick review', text: 'Go through every card and answer <b>Got it</b> or <b>Not quite</b>. The “Not quite” cards come back until you know them all. It can follow your card list’s filters and sort order too.' },
    { view: 'deck', sel: '[data-act="quizSetup"]', title: 'Quiz', text: 'Multiple choice, typing and listening questions, with a score at the end. Pick how many questions and which cards.' },
    { view: 'deck', sel: '[data-act="games"]', title: 'Games', text: 'Lots of games use the same cards, from quick word games to the <b>Lexicon Saga</b> adventure and the <b>Sentence Builder</b>. The 💡 tip box under the games has a new piece of advice every few seconds.' },
  ] },
  { id: 'cards', icon: '✏️', name: 'Making cards', about: 'Formatting, pictures and examples', needDeck: true, steps: [
    { view: 'deck', sel: '.add-card', title: 'Add cards', text: 'Type the word on the front and its meaning on the back, then press <b>Add card</b>. Add an example sentence and notes if you like.' },
    { view: 'deck', sel: '.add-card .ed-tools', title: 'Make it stand out', text: '<b>Bold</b>, <i>italic</i>, highlights, fonts and sizes, and a color picker with shades of every color (＋ adds your own). On a phone this bar sits right above the keyboard.' },
    { view: 'deck', sel: '.add-card [data-act="edWebPic"]', title: '🔎 Free pictures', text: 'Search a free library of Creative Commons pictures and add one to the card in a tap. The picture’s credit goes into the card’s notes. 🖼️ adds a picture from your device. (Turn pictures on in the deck’s settings if you don’t see these.)' },
    { view: 'deck', sel: '.add-card [data-act="edTranslate"]', title: '🌐 Translate', text: 'Type a word on one side and tap 🌐: pick a translation and it goes on the other side. Single words show each meaning, like <i>banco</i> → bank or bench. (Needs the internet.)' },
    { view: 'deck', sel: '.add-card [data-act="edScan"]', title: '📷 Scan text', text: 'Take a photo of a page and the words are typed in for you.' },
    { view: 'deck', sel: '.add-card [data-act="suggestEx"]', title: 'Example sentences', text: 'Get a suggested example sentence for the word, with its translation. Games like the Sentence Builder use them.' },
  ] },
  { id: 'list', icon: '🗂️', name: 'Managing cards', about: 'Search, filter, select and fix many at once', needDeck: true, steps: [
    { view: 'deck', sel: '#cardListHead', title: 'All your cards', text: '<b>Search</b>, <b>sort</b> and <b>filter</b> your cards: by word label (noun, verb…), how well you know them, duplicates, and more.' },
    { view: 'deck', sel: '#cardTable td.sel', title: 'Select cards', text: 'Tap the strip beside a card to select it (it turns blue). Then fix many at once: add or remove text, add labels, <b>🌐 translate</b> them all (you check each one first), or <b>⇄ swap front and back</b>.' },
    { view: 'deck', sel: '[data-act="clFreeze"]', title: 'Freeze a card', text: '❄️ pauses a card so it stops coming up for now. ✏️ edits it, 📄 copies it and 🗑️ deletes it.' },
    { view: 'deck', sel: '[data-act="deckSettings"]', title: 'Deck settings', text: 'Change the deck’s languages, voices, study direction (front first, back first or both), pictures and how many new cards a day.' },
  ] },
  { id: 'explore', icon: '🧭', name: 'Explore', about: 'Dictionary, progress, rewards and settings', steps: [
    { view: 'home', sel: '[data-act="dictionary"]', title: 'Dictionary', text: 'Every word from your decks in one place. Look one up and add it to a deck in one tap.' },
    { view: 'home', sel: '[data-act="progress"]', title: 'Progress', text: 'How many words you know, your study calendar and your streak, for each subject.' },
    { view: 'home', sel: '[data-act="rewards"]', title: 'Rewards and packs', text: 'Studying earns 🥜 points. Spend them in the shop, earn badges, and open <b>Packs</b> to collect picture cards.' },
    { view: 'home', sel: '[data-act="resources"]', title: 'Free resources', text: 'Hand-picked free websites, videos and tools for every subject.' },
    { view: 'home', sel: '[data-act="settings"]', title: 'Settings', text: 'Voices, colors and themes, timers, the 📝 pop quiz and backups. <b>Phone & sync</b> shows how to use Estudiamos on your phone too. You can replay this tour from here any time.' },
  ] },
];
let tour = null;
const tourChapters = () => TOUR_CHAPTERS.filter(c => !c.needDeck || firstDeck());
const tourStepsOf = ch => ch.steps.filter(s => !s.needDeck || firstDeck()).map(s => ({ ...s, ch }));
/* full = every chapter in a row; a chapter id = just that one; nothing = the chapter list */
function tourStart(which) {
  if ($('#dlg').open) $('#dlg').close();
  const again = !!tour;   // moving between the chapter list and a chapter keeps the same tour open
  tour = { i: 0, steps: [], mode: which || 'menu', seen: tour?.seen || new Set() };
  if (which === 'full') tour.steps = tourChapters().flatMap(tourStepsOf).concat([{ title: 'You’re ready! 🎉', text: 'Start by making a deck, or open one and press <b>Study</b>. A few minutes a day is all it takes. ¡Buena suerte!', mood: 'happy', last: true }]);
  else if (which) { const ch = TOUR_CHAPTERS.find(c => c.id === which); if (!ch) return tourStart(); tour.steps = tourStepsOf(ch); }
  if (!document.getElementById('tour')) document.body.insertAdjacentHTML('beforeend', `<div id="tour" role="dialog" aria-modal="true" aria-labelledby="tourTitle"><i class="tour-dim"></i><i class="tour-dim"></i><i class="tour-dim"></i><i class="tour-dim"></i><div class="tour-hole"></div><div class="tour-card"></div></div>`);
  if (!again) { window.addEventListener('resize', tourPlace); window.addEventListener('scroll', tourPlace, true); document.addEventListener('keydown', tourKey); }
  tour.mode === 'menu' ? tourMenu() : tourShow();
}
function tourEnd(done = true) {
  document.getElementById('tour')?.remove();
  window.removeEventListener('resize', tourPlace); window.removeEventListener('scroll', tourPlace, true); document.removeEventListener('keydown', tourKey);
  if (tour) { S.settings.tourDone = true; S.settings.tour2 = true; save(); }
  tour = null;
  if (done && view.name !== 'home') go({ name: 'home' });
}
function tourKey(e) {
  if (!tour) return;
  if (e.key === 'Escape') { e.preventDefault(); tourEnd(); }
  else if (tour.mode === 'menu') return;
  else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); tourNext(1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); tourNext(-1); }
}
function tourNext(dir) {
  if (!tour) return;
  const i = tour.i + dir; if (i < 0) return;
  if (i >= tour.steps.length) return tour.mode === 'full' ? tourEnd() : tourMenu(tour.steps[0]?.ch?.id);
  tour.i = i; tourShow();
}
const tourMascot = mood => typeof mascot === 'function' && !(typeof lookPro === 'function' && lookPro()) ? mascot(54, mood || 'happy') : '';
/* the chapter list (also shown after finishing one chapter, with a tick on the ones you've seen) */
function tourMenu(justDone) {
  tour.mode = 'menu'; tour.steps = []; tour.i = 0; if (justDone) tour.seen.add(justDone);
  if (view.name !== 'home' || view.folderId || view.favOnly) go({ name: 'home' });
  const box = document.querySelector('#tour .tour-card'), chs = tourChapters();
  box.innerHTML = `<div class="tour-head">${tourMascot('happy')}<div><div class="muted small">${justDone ? 'Nice! Pick another chapter, or you’re done' : 'About 3 minutes for everything'}</div><h3 id="tourTitle">${justDone ? 'What next?' : '¡Hola! Let me show you around'}</h3></div></div>
    ${justDone ? '' : '<p>Estudiamos helps you learn with flashcards, quizzes and games. Take the whole tour, or pick the part you want to see.</p>'}
    <div class="tour-chs">${chs.map(c => `<button type="button" class="tour-ch" data-tour-ch="${c.id}"><span class="tour-ch-ic">${tour.seen.has(c.id) ? '✅' : c.icon}</span><span><b>${c.name}</b><span class="muted small">${c.about} · ${tourStepsOf(c).length} steps</span></span></button>`).join('')}</div>
    ${firstDeck() ? '' : '<p class="muted small" style="margin:8px 0 0">Make a deck first to see the chapters about studying and cards.</p>'}
    <div class="tour-btns" style="margin-top:12px"><button type="button" class="btn ghost" data-tour="skip">${justDone ? 'Done' : 'Not now'}</button>
      ${justDone ? '' : '<button type="button" class="btn primary" data-tour="full">▶ Show me everything</button>'}</div>`;
  box.querySelectorAll('[data-tour-ch]').forEach(b => b.onclick = () => tourStart(b.dataset.tourCh));
  box.querySelectorAll('[data-tour]').forEach(b => b.onclick = () => b.dataset.tour === 'skip' ? tourEnd() : tourStart('full'));
  tourPlace();
  setTimeout(() => box.querySelector('[data-tour=full], [data-tour-ch]')?.focus({ preventScroll: true }), 30);
}
function tourShow() {
  const s = tour.steps[tour.i], n = tour.steps.length;
  // go to the screen this step is about
  if (s.view === 'deck' && firstDeck() && !(view.name === 'deck' && deckById(view.deckId))) go({ name: 'deck', deckId: firstDeck().id });
  if (s.view === 'home' && (view.name !== 'home' || view.folderId || view.favOnly)) go({ name: 'home' });
  const box = document.querySelector('#tour .tour-card'), ch = s.ch, chs = tourChapters();
  const label = ch ? (tour.mode === 'full' ? `${ch.icon} ${ch.name} · ${chs.indexOf(ch) + 1} of ${chs.length}` : `${ch.icon} ${ch.name}`) : '';
  box.innerHTML = `
    <div class="tour-head">${tourMascot(s.mood)}<div><div class="muted small">${label ? label + ' · ' : ''}Step ${tour.i + 1} of ${n}</div><h3 id="tourTitle">${s.title}</h3></div></div>
    <p>${s.text}</p>
    <div class="tour-dots" aria-hidden="true">${tour.steps.map((x, k) => `<i class="${k === tour.i ? 'on' : ''}${k && x.ch !== tour.steps[k - 1].ch ? ' gap' : ''}"></i>`).join('')}</div>
    <div class="tour-btns">
      ${s.last ? '<span></span>' : `<button type="button" class="btn ghost" data-tour="skip">${tour.mode === 'full' ? 'Skip tour' : '☰ Chapters'}</button>`}
      <div class="row" style="gap:8px">${tour.i ? '<button type="button" class="btn" data-tour="back">← Back</button>' : ''}
      <button type="button" class="btn primary" data-tour="next">${s.last ? 'Let’s go!' : tour.i === n - 1 && tour.mode !== 'full' ? 'Finish ✓' : 'Next →'}</button></div>
    </div>`;
  box.querySelectorAll('[data-tour]').forEach(b => b.onclick = () => b.dataset.tour === 'skip' ? (tour.mode === 'full' ? tourEnd() : tourMenu()) : tourNext(b.dataset.tour === 'back' ? -1 : 1));
  // decks hidden by a subject tab (say Math with no decks)? show All so there's something to point at
  if (s.view === 'home' && s.sel && !tourTarget()) { const all = document.querySelector('[data-act="homeSubject"][data-k=""]'); if (all) all.click(); }
  // bring the button into view (the menu scrolls sideways on phones), then light it up
  const el = tourTarget();
  if (el) { el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }); if (scrollX) scrollTo(0, scrollY); }
  tourPlace();
  if (el) {   // no room above or below for the card (a big part, or a phone)? scroll it up near the top so the card fits underneath
    const r = el.getBoundingClientRect(), ch = box.offsetHeight + 24;
    if (r.top - 8 < ch && r.bottom + 8 + ch > innerHeight) { scrollBy(0, r.top - Math.max(64, Math.min(120, innerHeight - ch - Math.min(r.height, innerHeight * 0.3) - 16))); tourPlace(); }
  }
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
  const hx = Math.max(4, r.left - pad), hy = Math.max(4, r.top - pad), hw = Math.min(W - 8, r.width + pad * 2), ch0 = card.offsetHeight || 220, hh = Math.min(H * 0.6, r.height + pad * 2, hy - ch0 - 20 >= 8 ? Infinity : Math.max(48, H - hy - ch0 - 24));   // a tall part is only lit as far as leaves room for the card below
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
/* start by itself for someone brand new, after the profile setup window (if any) is closed;
   someone who already uses the app is asked once whether they'd like to see the new tour */
function tourMaybe() {
  if (tour || (S.settings.tourDone && S.settings.tour2)) return;
  const studied = Object.values(S.log || {}).some(l => l && (l.reviews || l.practice || l.points)) || S.cards.some(c => c.state && c.state !== 'new');
  const dlg = $('#dlg');
  if (dlg.open) { dlg.addEventListener('close', () => setTimeout(tourMaybe, 700), { once: true }); return; }
  if (view.name !== 'home') return;
  if (studied || S.settings.tourDone) {
    if (S.settings.tour2) return;
    S.settings.tour2 = true; save();
    setTimeout(() => {
      if (tour || $('#dlg').open) return;
      openDialog({ title: '🧭 New: a tour of Estudiamos', ok: 'Show me',
        body: `<p style="margin:0 0 6px">There’s a new guided tour of the main features: studying, quick review, making cards, free pictures, reminders, the card list and more.</p><p class="muted small" style="margin:0">Take it all, or just the parts you want. You can also start it later from <b>Settings → Take the tour</b>.</p>`,
        onOk: () => setTimeout(() => tourStart(), 0) });
      const c = $('#dlg [data-dlg="cancel"]'); if (c) c.textContent = 'Not now';
    }, 900);
    return;
  }
  setTimeout(() => { if (!tour && !$('#dlg').open && !S.settings.tourDone) tourStart(); }, 500);
}
Object.assign(actions, { tourStart: () => tourStart() });
