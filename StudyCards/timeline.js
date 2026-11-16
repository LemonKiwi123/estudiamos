'use strict';
/* ================= 🕰️ Timelines (Art, Science, History, and subjects you make) =================
   Make a timeline, add dated events (BCE dates and "about" dates work), see them laid out in time,
   turn them into flashcards, and play "Put them in order". Saved in S.settings.timelines. */
const tlAll = () => (S.settings.timelines ||= []);
const tlById = id => tlAll().find(t => t.id === id);
const TL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const tlNum = e => e.y + ((e.m || 1) - 1) / 12 + ((e.d || 1) - 1) / 365;   // for sorting and spacing
function tlDate(e) {
  const yr = e.y < 0 ? `${-e.y} BCE` : String(e.y);
  return (e.approx ? 'c. ' : '') + (e.m ? (e.d ? `${TL_MONTHS[e.m - 1]} ${e.d}, ` : `${TL_MONTHS[e.m - 1]} `) : '') + yr;
}
const tlSorted = t => t.events.slice().sort((a, b) => tlNum(a) - tlNum(b));
const TL_EXAMPLES = {
  science: ['Space exploration', [[1957, 10, 4, 'Sputnik 1, the first artificial satellite'], [1961, 4, 12, 'Yuri Gagarin, the first person in space'], [1969, 7, 20, 'Apollo 11 lands on the Moon'],
    [1971, 4, 19, 'Salyut 1, the first space station'], [1990, 4, 24, 'The Hubble Space Telescope is launched'], [1998, 11, 20, 'The first part of the International Space Station is launched'], [2012, 8, 6, 'The Curiosity rover lands on Mars']]],
  history: ['Inventions that changed the world', [[1440, 0, 0, 'Gutenberg’s printing press', 1], [1876, 3, 7, 'Alexander Graham Bell is granted a telephone patent'], [1903, 12, 17, 'The Wright brothers’ first powered flight'],
    [1928, 9, 0, 'Alexander Fleming discovers penicillin'], [1969, 10, 29, 'The first message is sent over ARPANET, an early internet'], [1989, 3, 0, 'Tim Berners-Lee proposes the World Wide Web']]],
  art: ['Art movements', [[1400, 0, 0, 'The Early Renaissance begins in Florence', 1], [1600, 0, 0, 'The Baroque period begins', 1], [1874, 4, 15, 'The first Impressionist exhibition opens in Paris'],
    [1907, 0, 0, 'Picasso paints Les Demoiselles d’Avignon, an early step toward Cubism'], [1916, 0, 0, 'Dada begins in Zurich'], [1924, 0, 0, 'The first Surrealist manifesto'], [1955, 0, 0, 'Pop Art starts to appear', 1]]],
};
function tlMakeExample(subject) {
  const [name, evs] = TL_EXAMPLES[subject] || TL_EXAMPLES.history;
  const t = { id: uid(), name, subject: TL_EXAMPLES[subject] ? subject : 'history', created: Date.now(), events: evs.map(([y, m, d, title, approx]) => ({ id: uid(), y, m: m || 0, d: d || 0, title, note: '', approx: !!approx })) };
  tlAll().push(t); save(); return t;
}

/* ---------- the list of timelines ---------- */
const tlSubjOk = k => ['art', 'science', 'history'].includes(k) || /^c-/.test(k);
views.timeline = () => {
  if (view.tl && tlById(view.tl)) return tlOneHtml(tlById(view.tl));
  const cur = typeof homeSubj === 'function' ? homeSubj() : '', list = tlAll().filter(t => !cur || t.subject === cur);
  const sub = k => typeof subjEmoji === 'function' ? `${subjEmoji(k)} ${esc(subjName(k))}` : '';
  return `<div class="row-between" style="margin-bottom:6px"><h2 style="margin:0">🕰️ Timelines${cur ? ` · ${sub(cur)}` : ''}</h2>
      <button type="button" class="btn primary" data-tl="new">＋ New timeline</button></div>
    <p class="muted" style="margin:0 0 14px">Put events in order to see how things connect. Turn any timeline into flashcards, or test yourself with <b>Put them in order</b>.</p>
    ${list.length ? `<div class="tl-list">${list.map(t => { const ev = tlSorted(t);
      return `<button type="button" class="tl-card" data-tl="open" data-id="${t.id}"><b>${esc(t.name)}</b><span class="muted small">${sub(t.subject)} · ${ev.length} event${ev.length === 1 ? '' : 's'}${ev.length ? ` · ${esc(tlDate(ev[0]))} – ${esc(tlDate(ev.at(-1)))}` : ''}</span></button>`; }).join('')}</div>`
      : `<div class="empty subj-empty"><div class="subj-big">🕰️</div><h3>No timelines yet</h3><p class="muted">Make your own, or start with an example you can change.</p>
        <div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" data-tl="new">＋ New timeline</button>
        ${(cur && TL_EXAMPLES[cur] ? [cur] : Object.keys(TL_EXAMPLES)).map(k => `<button type="button" class="btn" data-tl="example" data-k="${k}">${typeof subjEmoji === 'function' ? subjEmoji(k) : ''} Example: ${esc(TL_EXAMPLES[k][0])}</button>`).join('')}</div></div>`}`;
};
/* ---------- one timeline ---------- */
/* two looks: 🌈 gradient (chevron band + a line with pins above and below) and 📋 list (a spine with colored cards) */
const tlYear = e => e.y < 0 ? `${-e.y} BCE` : String(e.y);
const tlHue = f => Math.round(4 + 128 * f);   // red → orange → yellow → green
const tlCol = (f, l = 46) => `hsl(${tlHue(f)} 78% ${l}%)`;
const TL_LIST_COLORS = ['#7c6cf0', '#d9489f', '#3d82f0', '#14907f'];
function tlGradientHtml(t, ev) {
  const n = ev.length, f = i => n > 1 ? i / (n - 1) : 0;
  const groups = Math.min(6, n), per = n / groups, bands = Array.from({ length: groups }, (_, g) => {
    const a = ev[Math.floor(g * per)], z = ev[Math.max(Math.floor(g * per), Math.ceil((g + 1) * per) - 1)];
    return { label: tlYear(a) === tlYear(z) ? tlYear(a) : `${tlYear(a)}–${tlYear(z)}`, f: groups > 1 ? g / (groups - 1) : 0 };
  });
  const line = `linear-gradient(90deg, ${[0, .2, .4, .6, .8, 1].map(x => tlCol(x)).join(', ')})`;
  const item = (e, i, up) => `<button type="button" class="tlg-item ${up ? 'up' : 'down'}" style="grid-column:${i + 1};--c:${tlCol(f(i))}" data-tl="editEv" data-id="${t.id}" data-ev="${e.id}" title="Tap to edit">
      ${up ? '' : '<span class="tlg-stem"></span><span class="tlg-dot"></span>'}
      <span class="tlg-text"><b class="tlg-date">${esc(tlDate(e))}</b><span class="tlg-title">${esc(e.title)}</span>${e.note ? `<span class="tlg-note">${esc(e.note)}</span>` : ''}</span>
      ${up ? '<span class="tlg-dot"></span><span class="tlg-stem"></span>' : ''}</button>`;
  return `<div class="tlg-scroll"><div class="tlg" style="--n:${n}">
      <div class="tlg-band" style="grid-template-columns:repeat(${groups},1fr)">${bands.map((x, g) => `<div class="tlg-chev ${g ? '' : 'first'}" style="background:${tlCol(x.f, 50)}">${esc(x.label)}</div>`).join('')}</div>
      <div class="tlg-stage" style="grid-template-columns:repeat(${n},minmax(130px,1fr))">
        ${ev.map((e, i) => i % 2 === 0 ? item(e, i, true) : '').join('')}
        <div class="tlg-line" style="grid-column:1/-1;background:${line}"></div>
        ${ev.map((e, i) => i % 2 === 1 ? item(e, i, false) : '').join('')}
      </div></div></div>`;
}
function tlListHtml(t, ev) {
  return `<div class="tll-head"><h2>${esc(t.name)}</h2>${t.desc ? `<div class="muted">${esc(t.desc)}</div>` : ''}</div>
    <ol class="tll">${ev.map((e, i) => { const c = TL_LIST_COLORS[i % TL_LIST_COLORS.length];
      return `<li class="tll-row" style="--c:${c}"><div class="tll-date">${esc(tlDate(e))}</div><div class="tll-spine"><span class="tll-dot"></span></div>
        <button type="button" class="tll-card" data-tl="editEv" data-id="${t.id}" data-ev="${e.id}" title="Tap to edit"><b>${esc(e.title)}</b>${e.note ? `<span>${esc(e.note)}</span>` : ''}</button></li>`; }).join('')}</ol>`;
}
function tlOneHtml(t) {
  const ev = tlSorted(t), quiz = view.tlQuiz;
  if (quiz) return tlQuizHtml(t, quiz);
  const style = t.style === 'list' ? 'list' : 'gradient';
  const tools = `<div class="row" style="gap:6px;flex-wrap:wrap">
        <div class="seg-btns" role="group" aria-label="Timeline look"><button type="button" class="btn sm ${style === 'gradient' ? 'primary' : ''}" data-tl="style" data-k="gradient" data-id="${t.id}">🌈 Gradient</button><button type="button" class="btn sm ${style === 'list' ? 'primary' : ''}" data-tl="style" data-k="list" data-id="${t.id}">📋 List</button></div>
        <button type="button" class="btn sm primary" data-tl="add" data-id="${t.id}">＋ Add event</button>
        <button type="button" class="btn sm" data-tl="quiz" data-id="${t.id}" ${ev.length >= 3 ? '' : 'disabled title="Add at least 3 events"'}>🎯 Put them in order</button>
        <button type="button" class="btn sm" data-tl="cards" data-id="${t.id}" ${ev.length ? '' : 'disabled'}>📇 Make flashcards</button>
        <button type="button" class="btn sm ghost" data-tl="edit" data-id="${t.id}" title="Rename, add a description, change subject or delete">⚙️</button></div>`;
  return `<div class="crumbs"><a data-act="timeline">🕰️ Timelines</a> / ${esc(t.name)}</div>
    ${tools}
    <div class="panel tl-panel">${!ev.length ? `<h2 class="tlg-title-h">${esc(t.name)}</h2>${t.desc ? `<p class="muted">${esc(t.desc)}</p>` : ''}<div class="empty"><p class="muted">No events yet. Tap <b>＋ Add event</b>.</p></div>`
      : style === 'list' ? tlListHtml(t, ev)
      : `<h2 class="tlg-title-h">${esc(t.name)}</h2>${t.desc ? `<p class="muted" style="margin:-6px 0 12px">${esc(t.desc)}</p>` : ''}${tlGradientHtml(t, ev)}`}</div>
    <p class="muted small" style="margin-top:10px">Tap an event to change it.${style === 'gradient' && ev.length > 6 ? ' Scroll sideways to see them all.' : ''}</p>`;
}
function tlEventDialog(t, e) {
  const neg = e && e.y < 0, y = e ? Math.abs(e.y) : '';
  openDialog({
    title: e ? 'Edit event' : 'Add an event', ok: e ? 'Save' : 'Add', wide: false,
    body: `<label class="field">What happened<input name="title" required maxlength="160" value="${esc(e?.title || '')}" placeholder="e.g. Apollo 11 lands on the Moon"></label>
      <div class="tl-datef"><label class="field">Year<input name="y" type="number" min="0" max="99999" required value="${y}" placeholder="1969"></label>
        <label class="field">Era<select name="era"><option value="ce" ${neg ? '' : 'selected'}>CE / AD</option><option value="bce" ${neg ? 'selected' : ''}>BCE / BC</option></select></label>
        <label class="field">Month <span class="hint muted">(optional)</span><select name="m"><option value="0">–</option>${TL_MONTHS.map((n, i) => `<option value="${i + 1}" ${e?.m === i + 1 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <label class="field">Day <span class="hint muted">(optional)</span><input name="d" type="number" min="0" max="31" value="${e?.d || ''}"></label></div>
      <label class="check"><input type="checkbox" name="approx" ${e?.approx ? 'checked' : ''}><span>About this date (shows “c.”)</span></label>
      <label class="field">Notes <span class="hint muted">(optional)</span><textarea name="note" rows="2" maxlength="500">${esc(e?.note || '')}</textarea></label>
      ${e ? `<button type="button" class="btn sm danger" id="tlDelEv">🗑️ Delete this event</button>` : ''}`,
    onOpen: dlg => { dlg.querySelector('#tlDelEv')?.addEventListener('click', () => { t.events = t.events.filter(x => x.id !== e.id); save(); dlg.close(); render(); }); },
    onOk: f => {
      const yr = parseInt(f.y.value, 10); if (!Number.isFinite(yr)) { toast('Type a year'); return false; }
      const vals = { title: f.title.value.trim() || 'Untitled event', y: f.era.value === 'bce' ? -yr : yr, m: +f.m.value || 0, d: +f.m.value ? Math.min(31, +f.d.value || 0) : 0, approx: f.approx.checked, note: f.note.value.trim() };
      if (e) Object.assign(e, vals); else t.events.push({ id: uid(), ...vals });
      save(); render(); if (!e) toast('🕰️ Event added');
    },
  });
}
function tlEditDialog(t) {
  const cur = typeof homeSubj === 'function' ? homeSubj() : '', sel = t ? t.subject : tlSubjOk(cur) ? cur : 'history';
  const opts = typeof subjList === 'function' ? subjList().filter(([k]) => tlSubjOk(k)).map(([k, e, n]) => `<option value="${k}" ${k === sel ? 'selected' : ''}>${e} ${esc(n)}</option>`).join('') : '';
  openDialog({
    title: t ? 'Timeline settings' : 'New timeline', ok: t ? 'Save' : 'Create',
    body: `<label class="field">Name<input name="name" required maxlength="80" value="${esc(t?.name || '')}" placeholder="e.g. The Roman Empire"></label>
      <label class="field">Description <span class="hint muted">(optional)</span><input name="desc" maxlength="200" value="${esc(t?.desc || '')}" placeholder="What this timeline is about"></label>
      <label class="field">Subject<select name="subject">${opts}</select></label>
      ${t ? `<button type="button" class="btn sm danger" id="tlDel">🗑️ Delete this timeline</button>` : ''}`,
    onOpen: dlg => dlg.querySelector('#tlDel')?.addEventListener('click', () => {
      if (!confirm(`Delete “${t.name}” and its ${t.events.length} events?`)) return;
      const i = tlAll().indexOf(t); tlAll().splice(i, 1); save(); dlg.close(); go({ name: 'timeline' });
      if (typeof undoToast === 'function') undoToast(`Deleted “${t.name}”`, () => { tlAll().splice(i, 0, t); save(); render(); });
    }),
    onOk: f => {
      if (t) { t.name = f.name.value.trim() || t.name; t.desc = f.desc.value.trim(); t.subject = f.subject.value; save(); render(); return; }
      const nt = { id: uid(), name: f.name.value.trim() || 'My timeline', desc: f.desc.value.trim(), subject: f.subject.value || 'history', created: Date.now(), events: [] };
      tlAll().push(nt); save(); go({ name: 'timeline', tl: nt.id }); setTimeout(() => tlEventDialog(nt), 50);
    },
  });
}
/* 📇 flashcards: front = the event, back = its date (into a new deck, same subject) */
function tlMakeCards(t) {
  const ev = tlSorted(t), name = `${t.name} (timeline)`;
  let d = S.decks.find(x => x.name === name && x.fromTimeline === t.id);
  if (!d) { d = { id: uid(), created: Date.now(), name, frontLang: 'en-US', backLang: 'en-US', newPerDay: 20, direction: 'front', subject: t.subject, fromTimeline: t.id }; S.decks.push(d); }
  const have = new Set(cardsOf(d.id).map(c => c.front)); let n = 0;
  for (const e of ev) if (!have.has(e.title)) { S.cards.push({ id: uid(), deckId: d.id, front: e.title, back: tlDate(e), notes: e.note || '', example: '', exampleTr: '', state: 'new', due: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0, step: 0, created: Date.now() }); n++; }
  save(); toast(n ? `📇 ${n} card${n === 1 ? '' : 's'} added to “${d.name}”` : 'Those cards are already in the deck'); go({ name: 'deck', deckId: d.id });
}
/* 🎯 Put them in order: tap the events from oldest to newest */
function tlQuizStart(t) { const pick = shuffle(t.events.slice()).slice(0, Math.min(6, t.events.length)); view.tlQuiz = { ids: shuffle(pick.map(e => e.id)), chosen: [], done: false, wrong: 0 }; render(); }
function tlQuizHtml(t, q) {
  const byId = id => t.events.find(e => e.id === id), right = q.ids.map(byId).sort((a, b) => tlNum(a) - tlNum(b)).map(e => e.id);
  return `<div class="crumbs"><a data-act="timeline">🕰️ Timelines</a> / <a data-tl="open" data-id="${t.id}">${esc(t.name)}</a> / Put them in order</div>
    <h2 style="margin:0 0 4px">🎯 Put them in order</h2><p class="muted" style="margin:0 0 12px">Tap the events from <b>oldest</b> to <b>newest</b>.</p>
    <ol class="tl-picked">${q.chosen.map((id, i) => `<li class="${q.done ? (id === right[i] ? 'ok' : 'no') : ''}"><b>${esc(byId(id).title)}</b>${q.done ? ` <span class="muted small">${esc(tlDate(byId(id)))}</span>` : ''}</li>`).join('')}</ol>
    ${q.done ? `<div class="bld-msg ${q.wrong ? 'no' : 'ok'}">${q.wrong ? `${q.ids.length - q.wrong} of ${q.ids.length} in the right place.` : '🎉 All in the right order!'}</div>
      ${q.wrong ? `<p class="muted small">The right order: ${right.map(id => `${esc(byId(id).title)} (${esc(tlDate(byId(id)))})`).join(' → ')}</p>` : ''}
      <div class="row" style="gap:8px;margin-top:10px"><button type="button" class="btn primary" data-tl="quiz" data-id="${t.id}">🔁 Again</button><button type="button" class="btn" data-tl="open" data-id="${t.id}">Back to the timeline</button></div>`
    : `<div class="tl-pool">${q.ids.filter(id => !q.chosen.includes(id)).map(id => `<button type="button" class="btn" data-tl="pick" data-id="${t.id}" data-ev="${id}">${esc(byId(id).title)}</button>`).join('')}</div>
      ${q.chosen.length ? `<button type="button" class="btn sm ghost" data-tl="unpick" data-id="${t.id}" style="margin-top:8px">↩️ Undo</button>` : ''}`}`;
}
Object.assign(actions, { timeline: () => go({ name: 'timeline' }) });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tl]'); if (!b || view.name !== 'timeline') return;
  const t = tlById(b.dataset.id);
  switch (b.dataset.tl) {
    case 'new': return tlEditDialog(null);
    case 'example': { const nt = tlMakeExample(b.dataset.k); return go({ name: 'timeline', tl: nt.id }); }
    case 'open': return go({ name: 'timeline', tl: b.dataset.id });
    case 'add': return t && tlEventDialog(t);
    case 'editEv': return t && tlEventDialog(t, t.events.find(x => x.id === b.dataset.ev));
    case 'edit': return t && tlEditDialog(t);
    case 'cards': return t && tlMakeCards(t);
    case 'quiz': return t && tlQuizStart(t);
    case 'pick': { const q = view.tlQuiz; if (!q || q.done) return; q.chosen.push(b.dataset.ev);
      if (q.chosen.length === q.ids.length) { const right = q.ids.map(id => t.events.find(x => x.id === id)).sort((a, c) => tlNum(a) - tlNum(c)).map(x => x.id);
        q.wrong = q.chosen.filter((id, i) => id !== right[i]).length; q.done = true;
        if (!q.wrong) { if (typeof rightSound === 'function') rightSound(); if (typeof addPoints === 'function') addPoints(3); } else if (typeof sdSound === 'function') sdSound('wrong'); }
      return render(); }
    case 'unpick': view.tlQuiz?.chosen.pop(); return render();
    case 'style': if (t) { t.style = b.dataset.k; save(); render(); } return;
  }
});
