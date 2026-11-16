'use strict';
/* ================= 📚 Subjects: Languages, Math, Science, History, Art, Music, Coding, Other + your own =================
   Each deck has a subject (d.subject). Decks without one are sorted automatically: a deck that goes from one
   language to another is Languages, anything else is Other until you pick.
   - Decks page: subject tabs above your decks (only the decks of that subject show, with their folders)
   - Progress page: "By subject" cards, and the whole page for one subject
   - Study reviews are counted per subject from now on (S.log[day].bySubj) */
const SUBJECTS = [
  ['lang', '🗣️', 'Languages'], ['math', '🧮', 'Math'], ['science', '🔬', 'Science'], ['history', '🏛️', 'Social Studies & History'],
  ['art', '🎨', 'Art'], ['music', '🎵', 'Music'], ['coding', '💻', 'Coding'], ['other', '📚', 'Other'],
];
const subjCustom = () => (S.settings.subjectsCustom ||= []);
const subjList = () => [...SUBJECTS.slice(0, -1), ...subjCustom().map(c => [c.id, c.emoji || '✏️', c.name]), SUBJECTS.at(-1)];
const subjHidden = () => (S.settings.subjectsHidden ||= []);
const subjShown = () => subjList().filter(([k]) => !subjHidden().includes(k));   // the tabs you chose to keep
const subjInfo = k => subjList().find(s => s[0] === k) || SUBJECTS.at(-1);
const subjName = k => subjInfo(k)[2], subjEmoji = k => subjInfo(k)[1];
function deckSubject(d) {
  if (!d) return 'other';
  if (d.subject && subjList().some(s => s[0] === d.subject)) return d.subject;
  const f = langBase(d.frontLang || ''), b = langBase(d.backLang || '');
  return f && b && f !== b ? 'lang' : 'other';
}
const subjOptions = cur => subjList().map(([k, e, n]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${e} ${esc(n)}</option>`).join('') + '<option value="@new">➕ New subject…</option>';
function subjMake(name) {   // a subject of your own (Spanish literature, Driving test…)
  name = String(name || '').trim().slice(0, 40); if (!name) return null;
  const same = subjList().find(s => s[2].toLowerCase() === name.toLowerCase()); if (same) return same[0];
  const id = 'c-' + uid(); subjCustom().push({ id, name, emoji: '✏️' }); return id;
}
/* a <select> that turns into "type a name" when you pick ➕ New subject… */
function subjWire(sel) {
  if (!sel || sel.dataset.wired) return; sel.dataset.wired = 1; let last = sel.value;
  sel.addEventListener('change', () => {
    if (sel.value !== '@new') { last = sel.value; return; }
    const name = prompt('Name of the new subject (for example: Biology, Spanish literature, Driving test)');
    const id = subjMake(name); if (!id) { sel.value = last; return; }
    save(); sel.innerHTML = subjOptions(id); sel.value = id; last = id;
  });
}

/* ---------- Decks page: subject tabs ---------- */
const homeSubj = () => { const k = S.settings.homeSubject; return k && subjShown().some(s => s[0] === k) ? k : ''; };
function subjectTabs() {   // every subject always has a tab (empty ones are dimmed)
  const all = subjAllDecks(), n = {}; for (const d of all) { const k = deckSubject(d); n[k] = (n[k] || 0) + 1; }
  const cur = homeSubj(), used = subjShown();
  const tab = (k, label, count) => `<button type="button" class="subj-tab ${cur === k ? 'on' : ''} ${count ? '' : 'none'}" data-act="homeSubject" data-k="${k}" aria-pressed="${cur === k}">${label}<span class="subj-n">${count}</span></button>`;
  return `<div class="subj-tabs" role="group" aria-label="Show decks by subject">
    ${tab('', '📚 All', all.length)}${used.map(([k, e, name]) => tab(k, `${e} ${esc(name)}`, n[k] || 0)).join('')}
    <button type="button" class="subj-tab ghost" data-act="subjectTabsEdit" title="Choose which subject tabs you see, and add your own">⚙️ Edit tabs</button>
    ${all.length ? `<button type="button" class="subj-tab ghost" data-act="subjectSort" title="Pick a subject for each of your decks">🏷️ Sort decks into subjects</button>` : ''}</div>
    ${cur && subjToolBtns(cur) && S.decks.length ? `<div class="subj-tools"><span class="muted small">${subjEmoji(cur)} ${esc(subjName(cur))} tools:</span>${subjToolBtns(cur)}</div>` : ''}`;
}
/* tools that belong to a subject (shown under its tab) */
const subjToolBtns = k => ({
  lang: `<button type="button" class="btn" data-act="numGame" title="Practice numbers and the alphabet in your target language. No deck needed.">🔢 Numbers &amp; ABC</button>`,
  coding: `<button type="button" class="btn" data-act="code" data-t="play">▶️ Playground</button><button type="button" class="btn" data-act="code" data-t="turtle">🐢 Turtle</button><button type="button" class="btn" data-act="code" data-t="chal">🧠 What does it print?</button><button type="button" class="btn" data-act="code" data-t="sheets">📋 Cheat sheets</button><button type="button" class="btn" data-act="code" data-t="cs">🔢 CS tools</button>`,
  art: `<button type="button" class="btn" data-act="art" data-t="sketch">✏️ Sketchpad</button><button type="button" class="btn" data-act="art" data-t="animate">🎞️ Animation</button><button type="button" class="btn" data-act="art" data-t="color">🌈 Color</button><button type="button" class="btn" data-act="art" data-t="photo">🖼️ Photo helper</button><button type="button" class="btn" data-act="art" data-t="timer">⏱️ Practice timer</button><button type="button" class="btn" data-act="art" data-t="guides">📐 Guides</button><button type="button" class="btn" data-act="art" data-t="anim">🎬 Animation tips</button><button type="button" class="btn" data-act="art" data-t="basics">📚 Art basics</button>`,
  science: `<button type="button" class="btn" data-act="science" data-t="pt">🧪 Periodic table</button><button type="button" class="btn" data-act="science" data-t="rocks">🪨 Rocks &amp; minerals</button><button type="button" class="btn" data-act="science" data-t="space">🔭 Space</button><button type="button" class="btn" data-act="timeline">🕰️ Timelines</button>`,
  math: `<button type="button" class="btn" data-act="math">🧮 Calculator</button><button type="button" class="btn" data-act="mathGraph">📈 Graphing calculator</button>`,
  music: `<button type="button" class="btn" data-act="musicStudio" data-t="theory">🎼 Music theory</button><button type="button" class="btn" data-act="musicStudio" data-t="ear">👂 Ear training</button><button type="button" class="btn" data-act="musicStudio" data-t="tuner">🎙️ Tuner</button><button type="button" class="btn" data-act="musicStudio" data-t="drums">🥁 Drum machine</button><button type="button" class="btn" data-act="musicStudio" data-t="maker">🎹 Music maker</button>`,
})[k] || '';
/* a subject tab with no decks yet */
const SUBJ_IDEAS = {
  lang: 'vocabulary, phrases and verbs in the language you’re learning', math: 'times tables, formulas, geometry words or math vocabulary',
  science: 'the periodic table, body parts, planets or science words', history: 'dates, events, people, countries and capitals',
  art: 'artists and their paintings, colors, styles and art words', music: 'note names, chords, scales, instruments and music words',
  coding: 'keywords, commands, shortcuts and what code does', other: 'anything else you want to remember',
};
function subjEmptyHtml() {
  const k = homeSubj(), [, e, name] = subjInfo(k), tools = subjToolBtns(k);
  return `<div class="empty subj-empty"><div class="subj-big">${e}</div><h3>No ${esc(name)} decks yet</h3>
    <p class="muted">Make a deck for ${esc(SUBJ_IDEAS[k] || 'anything you want to learn')}.${subjAllDecks().length ? ' Or move decks you already have here with 🏷️ Sort decks into subjects.' : ''}</p>
    <div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" data-act="newDeck">+ New ${esc(name)} deck</button>
      ${subjAllDecks().length ? `<button type="button" class="btn" data-act="subjectSort">🏷️ Sort decks into subjects</button>` : ''}${tools}</div></div>`;
}
let SUBJ_ALL = null;   // while the Decks page draws one subject, S.decks holds only those decks; this is the full list
const subjAllDecks = () => SUBJ_ALL || S.decks;
function subjWithDecks(list, fn) {   // run fn with S.decks narrowed to `list`, then put everything back
  const all = S.decks; SUBJ_ALL = all; S.decks = list;
  try { return fn(); } finally { S.decks = all; SUBJ_ALL = null; }
}
{
  const home = views.home;
  views.home = function () {
    const k = homeSubj();
    if (!k || view.folderId) return home.apply(this, arguments);
    return subjWithDecks(S.decks.filter(d => deckSubject(d) === k), () => home.apply(this, arguments));
  };
  if (typeof folderSection === 'function') {   // hide folders that have none of this subject's decks
    const fs = folderSection;
    window.folderSection = function (f) { if (SUBJ_ALL && !folderDecksDeep(f).length) return ''; return fs.apply(this, arguments); };
  }
}
function subjectSortDialog() {
  const list = subjAllDecks().slice().sort((a, b) => a.name.localeCompare(b.name));
  openDialog({
    title: '🏷️ Sort decks into subjects', ok: 'Save', wide: true,
    body: `<p class="muted small" style="margin-top:0">Pick a subject for each deck. Decks that go from one language to another start as Languages.</p>
      <div class="subj-sort">${list.map(d => `<label class="subj-row"><span><b>${esc(d.name)}</b><span class="muted small"> · ${cardsOf(d.id).length} cards</span></span>
        <select class="inp" name="s_${d.id}" data-subj style="margin:0;width:auto">${subjOptions(deckSubject(d))}</select></label>`).join('')}</div>`,
    onOpen: dlg => dlg.querySelectorAll('select[data-subj]').forEach(subjWire),
    onOk: f => {
      let changed = 0;
      for (const d of list) { const v = f['s_' + d.id]?.value; if (v && v !== '@new' && v !== deckSubject(d)) { d.subject = v; changed++; } else if (v && !d.subject) d.subject = v; }
      save(); render(); toast(changed ? `🏷️ ${changed} deck${changed === 1 ? '' : 's'} moved to a new subject` : 'Subjects saved');
    },
  });
}
/* ⚙️ Edit tabs: tick the subjects you want, add your own, remove ones you made */
function subjectTabsDialog() {
  const all = subjAllDecks(), n = {}; for (const d of all) { const k = deckSubject(d); n[k] = (n[k] || 0) + 1; }
  const draft = { hidden: new Set(subjHidden()), custom: subjCustom().map(c => ({ ...c })), removed: new Set() };
  const rows = () => [...SUBJECTS.slice(0, -1), ...draft.custom.map(c => [c.id, c.emoji || '✏️', c.name, true]), SUBJECTS.at(-1)].map(([k, e, name, mine]) => `
    <div class="subj-row"><label class="row" style="gap:10px;flex:1;cursor:pointer"><input type="checkbox" data-k="${k}" ${draft.hidden.has(k) ? '' : 'checked'}>
      <span>${e} <b>${esc(name)}</b> <span class="muted small">${n[k] ? `${n[k]} deck${n[k] === 1 ? '' : 's'}` : 'no decks'}</span></span></label>
      ${mine ? `<button type="button" class="btn sm ghost" data-del="${k}" title="Remove this subject">🗑️</button>` : ''}</div>`).join('');
  openDialog({
    title: '⚙️ Edit subject tabs', ok: 'Save',
    body: `<p class="muted small" style="margin-top:0">Tick the subjects you want as tabs. Hiding a tab doesn’t delete anything: its decks still show under <b>📚 All</b>.</p>
      <div class="subj-sort" id="subjTabRows">${rows()}</div>
      <div class="row" style="gap:8px;margin-top:12px"><input class="inp" id="subjNewName" maxlength="40" placeholder="Add your own subject, e.g. Biology" style="margin:0;flex:1">
        <input class="inp" id="subjNewEmoji" maxlength="4" placeholder="✏️" title="An emoji for it (optional)" style="margin:0;width:64px;text-align:center">
        <button type="button" class="btn" id="subjAdd">＋ Add</button></div>`,
    onOpen: dlg => {
      const box = dlg.querySelector('#subjTabRows'), redraw = () => { box.innerHTML = rows(); };
      box.addEventListener('change', e => { const k = e.target.dataset.k; if (!k) return; e.target.checked ? draft.hidden.delete(k) : draft.hidden.add(k); });
      box.addEventListener('click', e => { const k = e.target.closest('[data-del]')?.dataset.del; if (!k) return;
        if (n[k] && !confirm(`${n[k]} deck${n[k] === 1 ? '' : 's'} use this subject. They will move to Other. Remove it?`)) return;
        draft.custom = draft.custom.filter(c => c.id !== k); draft.removed.add(k); draft.hidden.delete(k); redraw(); });
      const add = () => { const inp = dlg.querySelector('#subjNewName'), name = inp.value.trim(); if (!name) return inp.focus();
        if ([...SUBJECTS, ...draft.custom.map(c => [c.id, '', c.name])].some(s => s[2].toLowerCase() === name.toLowerCase())) { toast('You already have that subject'); return; }
        draft.custom.push({ id: 'c-' + uid(), name: name.slice(0, 40), emoji: dlg.querySelector('#subjNewEmoji').value.trim() || '✏️' }); inp.value = ''; dlg.querySelector('#subjNewEmoji').value = ''; redraw(); };
      dlg.querySelector('#subjAdd').onclick = add;
      dlg.querySelector('#subjNewName').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    },
    onOk: () => {
      S.settings.subjectsCustom = draft.custom;
      for (const d of subjAllDecks()) if (draft.removed.has(d.subject)) d.subject = 'other';
      S.settings.subjectsHidden = [...draft.hidden].filter(k => subjList().some(s => s[0] === k));
      if (draft.hidden.has(S.settings.homeSubject)) S.settings.homeSubject = '';
      save(); render(); toast('Subject tabs saved');
    },
  });
}
Object.assign(actions, {
  subjectTabsEdit: () => subjectTabsDialog(),
  homeSubject: el => { S.settings.homeSubject = el.dataset.k || ''; save(); go({ name: 'home', favOnly: view.favOnly }); },
  subjectSort: () => subjectSortDialog(),
  progSubject: el => { go({ ...view, name: 'progress', subj: el.dataset.k || '' }); },
  mathGraph: () => { if (typeof mathState === 'function') mathState().tab = 'graph'; go({ name: 'math' }); },
});

/* ---------- counting study reviews per subject (from now on) ---------- */
function subjCountReview(deckId) { const log = todayLog(), k = deckSubject(deckById(deckId)); (log.bySubj ||= {})[k] = (log.bySubj[k] || 0) + 1; }

/* ---------- Progress: by subject ---------- */
function subjStats() {
  const hist = S.history || [], decks = S.decks, out = new Map();
  for (const d of decks) { const k = deckSubject(d); if (!out.has(k)) out.set(k, { k, decks: [], cards: [], hist: [], week: 0, last: 0 }); out.get(k).decks.push(d); }
  for (const s of out.values()) {
    const ids = new Set(s.decks.map(d => d.id)); s.cards = S.cards.filter(c => ids.has(c.deckId)); s.hist = hist.filter(h => ids.has(h.deckId));
    for (let i = 0; i < 7; i++) s.week += S.log[dateKey(Date.now() - i * DAY)]?.bySubj?.[s.k] || 0;
    let lastDay = 0; for (let i = 0; i < 120; i++) { const t = Date.now() - i * DAY; if (S.log[dateKey(t)]?.bySubj?.[s.k]) { lastDay = t; break; } }
    s.last = Math.max(lastDay, ...s.hist.map(h => h.when || 0));
  }
  const order = subjList().map(s => s[0]);
  return [...out.values()].sort((a, b) => order.indexOf(a.k) - order.indexOf(b.k));
}
const subjAgo = t => { const d = Math.round((new Date(dateKey()) - new Date(dateKey(t))) / DAY); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`; };
/* Progress opens on the subject cards; tap one for that subject's whole progress page */
function subjProgressHtml() {
  const st = new Map(subjStats().map(s => [s.k, s]));
  const card = ([key, e, name]) => {
    const s = st.get(key);
    if (!s) return `<button type="button" class="subj-card none" data-act="homeSubject" data-k="${key}" title="Make a ${esc(name)} deck">
      <div class="row-between"><b>${e} ${esc(name)}</b><span class="subj-pct muted">–</span></div>
      <div class="muted small">No decks yet · tap to make one</div></button>`;
    const k = levelCounts(s.cards), q = s.hist.filter(isQuizResult).slice(0, 10), qAvg = q.length ? Math.round(q.reduce((a, h) => a + h.score, 0) / q.length) : null;
    return `<button type="button" class="subj-card" data-act="progSubject" data-k="${key}" title="See your ${esc(name)} progress">
      <div class="row-between"><b>${e} ${esc(name)}</b><span class="subj-pct">${k.pct}%</span></div>
      ${levelBar(k)}
      <div class="muted small">${s.decks.length} deck${s.decks.length === 1 ? '' : 's'} · ${k.total} cards · ${k.mastered} mastered</div>
      <div class="muted small">${qAvg == null ? 'No quizzes yet' : `Quiz average <b style="color:${scoreColor(qAvg)}">${qAvg}%</b>`} · ${s.hist.length} quiz${s.hist.length === 1 ? '' : 'zes'} &amp; games</div>
      <div class="muted small">${s.week} review${s.week === 1 ? '' : 's'} this week${s.last ? ` · last studied ${subjAgo(s.last)}` : ''}</div>
      <span class="subj-go">See progress →</span></button>`;
  };
  return `<div class="subj-grid">${subjList().filter(([k]) => st.has(k) || !subjHidden().includes(k)).map(card).join('')}</div>`;
}
{
  const prog = views.progress;
  views.progress = function () {
    const k = view.subj === '@all' ? '@all' : view.subj && subjList().some(s => s[0] === view.subj) ? view.subj : '';
    if (!k) {   // the overview: one card per subject
      const prof = typeof currentProfile === 'function' && currentProfile();
      return `<div class="row-between" style="margin-bottom:6px"><h2>Your progress</h2>
          ${prof ? `<div class="row" style="gap:8px">${avatarHtml(prof, 28)}<b>${esc(prof.name || '')}</b></div>` : ''}</div>
        <p class="muted" style="margin:0 0 14px">Pick a subject to see how you’re doing in it.</p>
        ${subjProgressHtml()}
        <div class="row" style="gap:8px;margin-top:16px;flex-wrap:wrap">
          <button type="button" class="btn" data-act="progSubject" data-k="@all">📊 All subjects together</button>
          ${S.decks.length ? `<button type="button" class="btn ghost" data-act="subjectSort">🏷️ Sort decks into subjects</button>` : ''}</div>`;
    }
    const back = `<button type="button" class="btn sm" data-act="progSubject" data-k="">← All subjects</button>`;
    if (k === '@all') return `<div class="subj-banner">${back} 📊 <b>All subjects together</b></div>` + prog.apply(this, arguments);
    // the whole page for one subject: only its decks, cards and saved results
    const ids = new Set(S.decks.filter(d => deckSubject(d) === k).map(d => d.id));
    const keep = { decks: S.decks, cards: S.cards, history: S.history };
    S.decks = keep.decks.filter(d => ids.has(d.id)); S.cards = keep.cards.filter(c => ids.has(c.deckId)); S.history = (keep.history || []).filter(h => ids.has(h.deckId));
    let html; try { html = prog.apply(this, arguments); } finally { Object.assign(S, keep); }
    html = html.replace('<h2>Your progress</h2>', `<h2>${subjEmoji(k)} ${esc(subjName(k))} progress</h2>`);
    return `<div class="subj-banner">${back}<span class="muted small">The day streak and the study reviews in the activity chart count all subjects.</span></div>` + html;
  };
}

/* ---------- the left menu follows the subject you're in ----------
   Subject tools only show for their subject (Math → 🧮, Music → 🎵, Languages → 📦 Packs …).
   On 📚 All, a tool shows when you have decks in its subject. The page you're on always stays visible. */
const NAV_SUBJ = { math: ['math'], music: ['music'], science: ['science'], art: ['art'], code: ['coding'], packs: ['lang'], timeline: ['art', 'science', 'history', '@custom'] };
function subjNavFits(list, k) { return list.includes(k) || (list.includes('@custom') && /^c-/.test(k)); }
function navBySubject() {
  const cur = homeSubj(), have = new Set(subjAllDecks().map(deckSubject));
  for (const [nav, list] of Object.entries(NAV_SUBJ)) {
    const b = document.querySelector(`nav [data-nav="${nav}"]`); if (!b) continue;
    const here = view.name === nav || (nav === 'packs' && ['packsHome', 'packOpen', 'gallery'].includes(view.name)) || (nav === 'music' && view.name === 'music');
    b.hidden = !(here || (cur ? subjNavFits(list, cur) : [...have].some(k => subjNavFits(list, k))));
  }
}
{ const r = window.render; if (typeof r === 'function') window.render = function () { const out = r.apply(this, arguments); try { navBySubject(); } catch {} return out; }; }

/* ---------- games by subject: every game works with any deck's cards, except these language ones ---------- */
const LANG_ONLY_GAMES = new Set(['builder', 'speak', 'listen', 'numbers']);
const gameFitsSubject = (k, d) => !LANG_ONLY_GAMES.has(k) || deckSubject(d) === 'lang';
