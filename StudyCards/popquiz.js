'use strict';
/* ================= 📝 Pop quiz =================
   Turned on in Settings: each time you open Estudiamos (or switch to your profile) it asks whether you'd like a short
   surprise quiz. It uses cards you've already studied (or any cards if there aren't enough), from the deck you studied
   last, a random deck, or a deck you pick. */
const popOpt = () => (S.settings.popQuiz ||= { on: false, n: 5, deck: 'last' });
const popAsked = new Set();   // profiles already asked since the app was opened
function popDeck() {
  const o = popOpt(), ok = d => d && cardsOf(d.id).length >= 4;
  if (o.deck !== 'last' && o.deck !== 'random') { const d = deckById(o.deck); if (ok(d)) return d; }
  const decks = S.decks.filter(ok); if (!decks.length) return null;
  if (o.deck === 'random') return decks[Math.floor(Math.random() * decks.length)];
  const hist = S.history || []; for (let i = hist.length - 1; i >= 0; i--) { const d = deckById(hist[i].deckId); if (ok(d)) return d; }
  return decks.slice().sort((a, b) => cardsOf(b.id).filter(c => c.state !== 'new').length - cardsOf(a.id).filter(c => c.state !== 'new').length)[0];
}
function popStart(d) {
  const o = popOpt(), all = cardsOf(d.id), learned = all.filter(c => c.state !== 'new');
  const pool = shuffle(learned.length >= 4 ? learned : all).slice(0, Math.max(3, Math.min(20, +o.n || 5)));
  popStarting = true;
  try { startQuiz(d.id, { ...QUIZ_DEFAULTS, mode: 'mixed', dir: 'mixed', count: 'all', pool: 'all' }, pool.map(c => c.id)); } finally { popStarting = false; }
  if (quiz) quiz.pop = true;
}
/* a pop quiz never plays sound by itself, not even on listening questions: tap 🔊 to hear it */
let popStarting = false;
{ const base = window.speakQuiz; if (typeof base === 'function') window.speakQuiz = function () { if (popStarting || quiz?.pop) return; return base.apply(this, arguments); }; }
function popAsk() {
  const o = popOpt(), pid = typeof currentProfileId !== 'undefined' ? currentProfileId || '-' : '-';
  if (!o.on || popAsked.has(pid) || !S.settings || (typeof currentProfileId !== 'undefined' && !currentProfileId)) return;
  if ($('#dlg').open || document.querySelector('.tour-pop, .tour-card') || !['home', 'deck'].includes(view.name)) { setTimeout(popAsk, 2500); return; }   // wait for welcome messages to close
  popAsked.add(pid); const d = popDeck(); if (!d) return;
  openDialog({ title: '📝 Pop quiz!', ok: 'Let’s go',
    body: `<p style="margin:0 0 6px;font-size:16px">Ready for a quick <b>${+o.n || 5}-question</b> quiz on <b>${esc(d.name)}</b>?</p><p class="muted small" style="margin:0">It’s a mix of multiple choice, typing and listening, using cards you’ve already studied. Turn pop quizzes off in Settings.</p>`,
    onOk: () => { setTimeout(() => popStart(d), 0); } });
  const c = $('#dlg [data-dlg="cancel"]'); if (c) c.textContent = 'Not now';
}
{ const r = window.render; if (typeof r === 'function') window.render = function () { const out = r.apply(this, arguments); try { if (popOpt().on && !popAsk.t) popAsk.t = setTimeout(() => { popAsk.t = 0; popAsk(); }, 1200); } catch {} return out; }; }
/* ---------- Settings section ---------- */
function popSettingsHtml() {
  const o = popOpt(), decks = S.decks.filter(d => cardsOf(d.id).length >= 4);
  return `<section class="panel" id="popSet"><h3>📝 Pop quiz</h3>
    <div class="set-row"><div><b>Ask me to take a pop quiz when I open Estudiamos</b><div class="muted small">A short surprise quiz, if you want one. You can always say “Not now”.</div></div>
      <div class="ctl"><input type="checkbox" data-pop="on" ${o.on ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--accent)"></div></div>
    ${o.on ? `<div class="set-row"><div><b>Questions</b></div><div class="ctl"><select class="inp" data-pop="n" style="margin:0;width:auto">${[3, 5, 10, 15, 20].map(n => `<option ${+o.n === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
    <div class="set-row"><div><b>Which deck</b></div><div class="ctl"><select class="inp" data-pop="deck" style="margin:0;width:auto;max-width:240px"><option value="last" ${o.deck === 'last' ? 'selected' : ''}>The one I studied last</option><option value="random" ${o.deck === 'random' ? 'selected' : ''}>A random deck</option>${decks.map(d => `<option value="${d.id}" ${o.deck === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select></div></div>
    <div class="set-row"><div class="muted small">Try one now</div><div class="ctl"><button type="button" class="btn sm" data-pop="try">📝 Start a pop quiz</button></div></div>` : ''}</section>`;
}
{ const base = views.settings; if (typeof base === 'function') views.settings = function () { const h = base.apply(this, arguments); const i = h.indexOf('<section class="panel">\n      <h3>Speech</h3>'); return i < 0 ? h.replace('<div class="stack">', '<div class="stack">' + popSettingsHtml()) : h.slice(0, i) + popSettingsHtml() + h.slice(i); }; }
document.addEventListener('change', e => { const k = e.target.dataset?.pop; if (!k || view.name !== 'settings') return; const o = popOpt(); o[k] = k === 'on' ? e.target.checked : k === 'n' ? +e.target.value : e.target.value; save(); if (k === 'on') { popAsked.add(typeof currentProfileId !== 'undefined' ? currentProfileId || '-' : '-'); render(); } });
document.addEventListener('click', e => { if (!e.target.closest?.('[data-pop="try"]')) return; const d = popDeck(); if (!d) return toast('Add a deck with at least 4 cards first'); popStart(d); });
