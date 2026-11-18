'use strict';
/* ================= 💡 Rotating tips =================
   The tip box under the games shows one piece of advice about Estudiamos at a time. Each tip stays up long enough to
   read (longer tips stay longer), then fades into the next one. It waits while you point at it or the window is hidden,
   and ‹ › flip through them by hand. */
const APP_TIPS = [
  ['Add example sentences', '“Finish the sentence” and “Listen &amp; tap” work best when your cards have example sentences. Edit a card and fill in <b>Example sentence</b>. If the word is spelled differently there (for example a verb form), put it in square brackets: <i>Yo [como] pan.</i>'],
  ['A little every day', 'Ten minutes a day beats an hour once a week. The app brings each card back right before you would forget it.'],
  ['⚡ Quick review before a test', 'Quick review goes through every card. Answer <b>Not quite</b> and the card comes back until you know it.'],
  ['Be honest when you study', 'Pick <b>Hard</b> or <b>Again</b> when you weren’t sure. The app shows those cards sooner, so you learn them faster.'],
  ['🔎 Free pictures', 'Turn on pictures in a deck’s settings, then use 🔎 in the card editor to find a free Creative Commons picture. Pictures help words stick.'],
  ['❄️ Streak freezes', 'Buy a streak freeze with peanuts in Rewards. If you miss a day, it saves your streak for you.'],
  ['🔔 Reminders', 'Add a reminder on the home page, like “Review my flashcards” at 7 pm every day, so you never forget to study.'],
  ['📝 Pop quiz', 'Turn on pop quizzes in Settings and Estudiamos asks if you’d like a short surprise quiz when you open it.'],
  ['Hear every word', 'Tap 🔊 to hear a card read aloud. In a deck’s settings you can pick a voice and turn reading aloud on or off.'],
  ['Fix many cards at once', 'In the card list, tap the strip beside cards to select them. Then add labels, move them, or swap front and back all at once.'],
  ['Study direction', 'In a deck’s settings, choose to see the front first, the back first, or both. Learning both ways makes a word really yours.'],
  ['Find mix-ups', 'Filter the card list by <b>Duplicates</b> to find cards with the same front or the same back.'],
  ['❄️ Freeze a card', 'Tap ❄️ beside a card in the list to stop it coming up for a while. Tap again to bring it back.'],
  ['Folders and colors', 'Sort your decks into folders and give each one a color. Drag a deck onto a folder to move it.'],
  ['Bring your cards', 'Already have cards somewhere else? Import them from Anki, a spreadsheet (CSV) or a text list.'],
  ['📷 Scan a page', 'In the card editor, 📷 reads the words from a photo of a page and types them in for you.'],
  ['Use it on your phone', 'Settings → <b>Phone &amp; sync</b> shows how to open Estudiamos on your phone and keep your decks in step.'],
  ['Make a backup', 'Settings has a backup button. Save one now and then so your decks are always safe.'],
  ['Practice for fun', 'Games use the same cards you study. A round of a game is a great way to warm up before studying.'],
  ['Make words stand out', 'Use colors, highlights and bold in the card editor, like red for feminine words and blue for masculine ones.'],
  ['🧭 Take the tour', 'Want a quick look at everything? Settings → <b>Take the tour</b> shows you around, one part at a time.'],
];
const APP_TIP = { i: 0, t: 0, shown: 0, hover: false };
const appTipSecs = i => { const words = APP_TIPS[i][1].replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length; return Math.min(20, Math.max(8, 3 + words * 0.33)); };   // about 3 words a second, plus time to look up
function appTipHtml() {
  const [h, p] = APP_TIPS[APP_TIP.i];
  return `<div class="panel tip-rot" data-tips aria-live="polite" style="margin-top:18px">
    <div class="tip-top"><h3><span class="tip-ic" aria-hidden="true">💡</span> Tip: <span class="tip-h">${h}</span></h3>
      <span class="tip-nav"><button type="button" class="icon-btn" data-tip="-1" aria-label="Previous tip">‹</button><span class="muted small tip-n">${APP_TIP.i + 1} / ${APP_TIPS.length}</span><button type="button" class="icon-btn" data-tip="1" aria-label="Next tip">›</button></span></div>
    <p class="muted small tip-p" style="margin:6px 0 0">${p}</p><i class="tip-bar" style="animation-duration:${appTipSecs(APP_TIP.i)}s"></i></div>`;
}
function appTipGo(step) {
  APP_TIP.i = (APP_TIP.i + step + APP_TIPS.length) % APP_TIPS.length; APP_TIP.shown = Date.now();
  const el = document.querySelector('[data-tips]'); if (!el) return;
  el.classList.add('fade');
  setTimeout(() => { const cur = document.querySelector('[data-tips]'); if (!cur) return; const n = document.createElement('div'); n.innerHTML = appTipHtml(); const fresh = n.firstElementChild; fresh.classList.add('fade'); cur.replaceWith(fresh); requestAnimationFrame(() => fresh.classList.remove('fade')); }, 250);
}
// one clock for all: move on when the tip has been up long enough (paused while pointed at, or the window is hidden)
setInterval(() => {
  const el = document.querySelector('[data-tips]'); if (!el) { APP_TIP.shown = 0; return; }
  if (!APP_TIP.shown) APP_TIP.shown = Date.now();
  if (document.hidden || el.matches(':hover, :has(:focus-visible)')) { APP_TIP.shown += 500; el.classList.add('paused'); return; }
  el.classList.remove('paused');
  if (Date.now() - APP_TIP.shown > appTipSecs(APP_TIP.i) * 1000) appTipGo(1);
}, 500);
document.addEventListener('click', e => { const b = e.target.closest?.('[data-tips] [data-tip]'); if (b) appTipGo(+b.dataset.tip); });
// the games page: its fixed tip box becomes the rotating one
{ const base = views.games; if (typeof base === 'function') views.games = function () {
  const h = base.apply(this, arguments), i = h.indexOf('<div class="panel" style="margin-top:18px"><h3>Tip: add example sentences</h3>');
  if (i < 0) return h; const j = h.indexOf('</p></div>', i); return j < 0 ? h : h.slice(0, i) + appTipHtml() + h.slice(j + 10);
}; }
