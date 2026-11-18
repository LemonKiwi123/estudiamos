'use strict';
/* ================= 🔔 Reminders and 🗒️ sticky notes (home page, under your streak) =================
   Reminders ring while Estudiamos is open (a message, a sound and, if you allow it, a notification).
   Repeating reminders move to their next time when you tick them off. Saved in S.settings. */
const remList = () => (S.settings.reminders ||= []);
const noteList = () => (S.settings.stickies ||= []);
const REM_REPEATS = { none: 'Once', daily: 'Every day', weekdays: 'Weekdays', weekly: 'Every week' };
const NOTE_COLORS = ['#fff3a3', '#ffd6e0', '#cdeffd', '#d4f5c8', '#ffe0b8', '#e5dcff'];
function remNext(r) {   // the next time a repeating reminder should ring after it's done
  const d = new Date(r.at), now = Date.now();
  const step = () => { if (r.repeat === 'weekly') d.setDate(d.getDate() + 7); else { d.setDate(d.getDate() + 1); if (r.repeat === 'weekdays') while ([0, 6].includes(d.getDay())) d.setDate(d.getDate() + 1); } };
  do step(); while (d.getTime() <= now);
  return d.getTime();
}
const remWhen = t => { const d = new Date(t), today = new Date(), tom = new Date(); tom.setDate(today.getDate() + 1);
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return d.toDateString() === today.toDateString() ? `Today ${time}` : d.toDateString() === tom.toDateString() ? `Tomorrow ${time}` : `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} ${time}`; };
function localInput(t) { const d = new Date(t - new Date(t).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); }
const hbMin = () => (S.settings.hbMin ||= {});   // which boxes are minimized: { rem: true, notes: false }
const hbToggle = (k, label) => `<button type="button" class="hb-min" data-hb="min" data-k="${k}" aria-expanded="${!hbMin()[k]}" title="${hbMin()[k] ? 'Show' : 'Minimize'} ${label}" aria-label="${hbMin()[k] ? 'Show' : 'Minimize'} ${label}">${hbMin()[k] ? '▸' : '▾'}</button>`;
function remindersHtml() {
  const list = remList().filter(r => !r.done).sort((a, b) => a.at - b.at), now = Date.now(), perm = typeof Notification === 'undefined' ? 'none' : Notification.permission;
  const soon = new Date(); soon.setMinutes(0, 0, 0); soon.setHours(soon.getHours() + 1);
  const min = hbMin().rem, dueN = list.filter(r => r.at <= now).length;
  return `<section class="panel home-box rem-box ${min ? 'min' : ''}">
    <div class="row-between"><h3 style="margin:0" class="hb-title"><span data-hb="min" data-k="rem">🔔 Reminders</span>${min && list.length ? `<span class="hb-count ${dueN ? 'due' : ''}">${dueN ? `⏰ ${dueN} due` : list.length}</span>` : ''}</h3>
      <span class="hb-right">${min ? '' : perm === 'default' ? `<button type="button" class="btn sm ghost" data-hb="notifOn" title="Get a pop-up notification when a reminder is due">🔔 Turn on notifications</button>` : perm === 'denied' ? '<span class="muted small" title="Allow notifications for this site in your browser settings">Notifications are blocked</span>' : ''}${hbToggle('rem', 'reminders')}</span></div>
    <div class="hb-body"><form class="rem-add" data-hb-form="rem">
      <input class="inp" name="text" maxlength="140" placeholder="e.g. Study Spanish verbs" required>
      <input class="inp" type="datetime-local" name="at" value="${localInput(soon.getTime())}" required aria-label="When">
      <select class="inp" name="repeat" aria-label="Repeat">${Object.entries(REM_REPEATS).map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select>
      <button type="submit" class="btn primary sm">＋ Add</button></form>
    ${list.length ? `<ul class="rem-list">${list.slice(0, 8).map(r => { const due = r.at <= now;
      return `<li class="${due ? 'due' : ''}"><button type="button" class="rem-check" data-hb="remDone" data-id="${r.id}" title="${r.repeat !== 'none' ? 'Done for now (it comes back next time)' : 'Done'}" aria-label="Done">✓</button>
        <span class="rem-text">${esc(r.text)}</span><span class="rem-when">${due ? '⏰ Now · ' : ''}${remWhen(r.at)}${r.repeat !== 'none' ? ` · 🔁 ${REM_REPEATS[r.repeat]}` : ''}</span>
        <button type="button" class="btn sm ghost" data-hb="remDel" data-id="${r.id}" title="Delete" aria-label="Delete">✕</button></li>`; }).join('')}</ul>
      ${list.length > 8 ? `<div class="muted small">and ${list.length - 8} more</div>` : ''}`
    : '<p class="muted small" style="margin:6px 0 0">No reminders yet. Add one above, like “Review my flashcards” at 7 pm every day.</p>'}
    <p class="muted small" style="margin:6px 0 0">Reminders ring while Estudiamos is open.</p></div></section>`;
}
function stickiesHtml() {
  const list = noteList();
  const min = hbMin().notes;
  return `<section class="panel home-box note-box ${min ? 'min' : ''}">
    <div class="row-between"><h3 style="margin:0" class="hb-title"><span data-hb="min" data-k="notes">🗒️ Sticky notes</span>${min && list.length ? `<span class="hb-count">${list.length}</span>` : ''}</h3><span class="hb-right">${min ? '' : `<button type="button" class="btn sm" data-hb="noteAdd" ${list.length >= 30 ? 'disabled' : ''}>＋ New note</button>`}${hbToggle('notes', 'sticky notes')}</span></div>
    <div class="hb-body">${list.length ? `<div class="note-grid">${list.map(n => `<div class="sticky" style="--c:${n.color}">
        <textarea data-note="${n.id}" maxlength="600" placeholder="Write something…" aria-label="Sticky note">${esc(n.text)}</textarea>
        <div class="sticky-foot">${NOTE_COLORS.map(c => `<button type="button" class="sticky-c ${c === n.color ? 'on' : ''}" style="background:${c}" data-hb="noteColor" data-id="${n.id}" data-c="${c}" aria-label="Color"></button>`).join('')}
          <button type="button" class="sticky-del" data-hb="noteDel" data-id="${n.id}" title="Delete note" aria-label="Delete note">🗑️</button></div></div>`).join('')}</div>`
      : '<p class="muted small" style="margin:6px 0 0">Jot down quick thoughts, words to look up, or homework. Notes save as you type.</p>'}</div></section>`;
}
function homeBoxesHtml() { return `<div class="home-boxes">${remindersHtml()}${stickiesHtml()}</div>`; }
function homeBoxesRedraw() { document.querySelectorAll('.home-boxes').forEach(el => { const t = document.createElement('div'); t.innerHTML = homeBoxesHtml(); el.replaceWith(t.firstElementChild); }); }   // home and the wide-window right column can both have a copy
const hbVisible = sel => [...document.querySelectorAll(sel)].find(x => x.offsetParent) || document.querySelector(sel);
document.addEventListener('submit', e => {
  const f = e.target.closest?.('[data-hb-form="rem"]'); if (!f) return; e.preventDefault();
  const text = f.text.value.trim(), at = new Date(f.at.value).getTime(); if (!text || !Number.isFinite(at)) return;
  remList().push({ id: uid(), text: text.slice(0, 140), at, repeat: f.repeat.value, done: false, rung: false }); save(); homeBoxesRedraw(); toast(`🔔 Reminder set for ${remWhen(at)}`);
});
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-hb]'); if (!b) return; const id = b.dataset.id;
  switch (b.dataset.hb) {
    case 'min': { const m = hbMin(); m[b.dataset.k] = !m[b.dataset.k]; save(); return homeBoxesRedraw(); }
    case 'notifOn': try { const p = await Notification.requestPermission(); toast(p === 'granted' ? '🔔 Notifications are on' : 'Notifications stay off'); } catch {} return homeBoxesRedraw();
    case 'remDone': { const r = remList().find(x => x.id === id); if (!r) return; if (r.repeat !== 'none') { r.at = remNext(r); r.rung = false; toast(`✓ Next one: ${remWhen(r.at)}`); } else r.done = true; save(); return homeBoxesRedraw(); }
    case 'remDel': { const l = remList(), i = l.findIndex(x => x.id === id); if (i < 0) return; const [gone] = l.splice(i, 1); save(); homeBoxesRedraw();
      if (typeof undoToast === 'function') undoToast('Reminder deleted', () => { l.splice(i, 0, gone); save(); homeBoxesRedraw(); }); return; }
    case 'noteAdd': { const l = noteList(); l.unshift({ id: uid(), text: '', color: NOTE_COLORS[l.length % NOTE_COLORS.length] }); save(); homeBoxesRedraw(); hbVisible('.sticky textarea')?.focus(); return; }
    case 'noteColor': { const n = noteList().find(x => x.id === id); if (!n) return; n.color = b.dataset.c; save(); return homeBoxesRedraw(); }
    case 'noteDel': { const l = noteList(), i = l.findIndex(x => x.id === id); if (i < 0) return; const [gone] = l.splice(i, 1); save(); homeBoxesRedraw();
      if (typeof undoToast === 'function') undoToast('Note deleted', () => { l.splice(i, 0, gone); save(); homeBoxesRedraw(); }); return; }
  }
});
document.addEventListener('input', e => { const id = e.target.dataset?.note; if (!id) return; const n = noteList().find(x => x.id === id); if (!n) return; n.text = e.target.value.slice(0, 600); clearTimeout(homeBoxesRedraw.t); homeBoxesRedraw.t = setTimeout(() => { try { save(); } catch {} }, 500); });
/* ring due reminders (checked every 20 seconds while the app is open) */
function remCheck() {
  const now = Date.now(); let changed = false;
  for (const r of remList()) if (!r.done && !r.rung && r.at <= now && now - r.at < 12 * 3600e3) {
    r.rung = true; changed = true; toast(`🔔 ${r.text}`);
    if (typeof playFanfare === 'function') try { playFanfare('chimes'); } catch {}
    try { if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('Estudiamos reminder', { body: r.text, tag: r.id, icon: 'icon-192.png' }); } catch {}
  }
  if (changed) { save(); if (view?.name === 'home') homeBoxesRedraw(); }
}
setInterval(remCheck, 20000); setTimeout(remCheck, 3000);
