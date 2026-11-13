'use strict';
/* ================= Phones and tablets =================
   iPhone and iPad only allow speech after the first tap, so the first tap anywhere quietly "unlocks" it.
   Voices load late on iOS, so the voice lists are refreshed when they arrive. */
(function () {
  const touch = matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0;
  if (!touch || !('speechSynthesis' in window)) return;
  let unlocked = false;
  const unlock = () => {
    if (unlocked) return; unlocked = true;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch {}
    document.removeEventListener('touchend', unlock, true); document.removeEventListener('click', unlock, true);
  };
  document.addEventListener('touchend', unlock, true);
  document.addEventListener('click', unlock, true);
  speechSynthesis.addEventListener?.('voiceschanged', () => { if (typeof view !== 'undefined' && view.name === 'settings' && typeof render === 'function' && !document.querySelector('#dlg')?.open) render(); });
})();
