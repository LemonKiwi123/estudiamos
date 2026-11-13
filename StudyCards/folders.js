'use strict';
/* ================= Deck folders, deck menu, and safe deck deletion ================= */
const FOLDER_COLORS = ['#3b54e8', '#23905a', '#cf3f3f', '#f2a516', '#8e44ad', '#16a085', '#ef8354', '#475569'];
const folders = () => (S.folders ||= []);
const folderById = id => folders().find(f => f.id === id);

/* ---------- Small pop-up menu ---------- */
function popMenu(anchor, items) {
  closePopMenu();
  const m = document.createElement('div'); m.className = 'popmenu'; m.id = 'popmenu';
  m.innerHTML = items.map(([label, act, attrs = '', danger]) => `<button type="button" data-act="${act}" ${attrs} class="${danger ? 'danger' : ''}">${label}</button>`).join('');
  document.body.appendChild(m);
  const r = anchor.getBoundingClientRect(), w = m.offsetWidth, h = m.offsetHeight;
  m.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w)) + 'px';
  m.style.top = (r.bottom + h + 8 > window.innerHeight ? r.top - h - 6 : r.bottom + 6) + 'px';
}
function closePopMenu() { $('#popmenu')?.remove(); }
document.addEventListener('click', e => { if (!e.target.closest('#popmenu') && !e.target.closest('[data-act=deckMenu],[data-act=folderMenu]')) closePopMenu(); else if (e.target.closest('#popmenu button')) setTimeout(closePopMenu, 0); }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopMenu(); });
window.addEventListener('scroll', closePopMenu, { passive: true });

/* ---------- Folders ---------- */
function folderDialog(f) {
  openDialog({
    title: f ? 'Edit folder' : 'New folder', ok: f ? 'Save' : 'Create folder',
    body: `<label class="field">Folder name<input name="name" required maxlength="60" value="${esc(f?.name || '')}" placeholder="e.g. Spanish class, Travel words"></label>
      <div class="field">Color<div class="row" style="gap:6px;margin-top:6px">${FOLDER_COLORS.map(c => `<label class="swatch" style="background:${c}"><input type="radio" name="color" value="${c}" ${(f?.color || FOLDER_COLORS[0]) === c ? 'checked' : ''}></label>`).join('')}</div></div>
      ${S.decks.length ? `<div class="field">Decks in this folder <span class="hint muted">(tick to add, untick to remove)</span><div class="folder-pick">${S.decks.map(d => {
        const other = d.folderId && d.folderId !== f?.id ? folderById(d.folderId) : null;
        return `<label class="check"><input type="checkbox" name="d_${d.id}" ${f && d.folderId === f.id ? 'checked' : ''}><span>${esc(d.name)}${other ? ` <span class="muted small">(now in ${esc(other.name)})</span>` : ''}</span></label>`;
      }).join('')}</div></div>` : ''}
      ${f ? folderVoiceFields(f) : ''}`,
    onOk: form => {
      const name = form.name.value.trim(); if (!name) { toast('Enter a folder name'); return false; }
      let fo = f;
      if (fo) { fo.name = name; fo.color = form.color.value; }
      else { fo = { id: uid(), name, color: form.color.value, created: Date.now(), collapsed: false }; folders().push(fo); }
      S.decks.forEach(d => { const box = form['d_' + d.id]; if (!box) return; if (box.checked) d.folderId = fo.id; else if (d.folderId === fo.id) d.folderId = null; });
      const changed = f ? applyFolderVoices(form, fo) : 0;
      save(); render(); toast(f ? (changed ? `Folder saved · voice settings updated on ${changed} deck${changed === 1 ? '' : 's'} 🔊` : 'Folder saved') : `Folder “${name}” created`);
    },
  });
}
/* Voice settings for every deck in a folder at once. Each choice starts on "Keep each deck's own", so nothing changes unless you pick something. */
function folderVoiceFields(f) {
  const ds = S.decks.filter(d => d.folderId === f.id);
  if (!ds.length) return '<p class="muted small" style="margin:6px 0 0">🔊 Once this folder has decks, you can set the voice options for all of them here.</p>';
  const langs = [...new Set(ds.flatMap(d => [d.frontLang, d.backLang]).filter(Boolean))];
  const keep = '<option value="">Keep each deck’s own</option>', rates = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.5];
  return `<details class="folder-voice"><summary><b>🔊 Voice settings for all ${ds.length} deck${ds.length === 1 ? '' : 's'} in this folder</b></summary>
    <p class="muted small" style="margin:6px 0 10px">Anything you change here is copied to every deck in the folder when you save. Options left on “Keep each deck’s own” aren’t touched.</p>
    <div class="grid2">
      <label class="field">Read cards aloud<select name="fv_tts">${keep}<option value="on">On</option><option value="off">Off</option></select></label>
      <label class="field">Auto-play<select name="fv_auto">${keep}<option value="app">App setting (${S.settings.autoplay ? 'on' : 'off'})</option><option value="on">On</option><option value="off">Off</option></select></label>
      <label class="field">Speed<select name="fv_rate">${keep}<option value="app">App setting (${S.settings.rate.toFixed(2)}×)</option>${rates.map(r => `<option value="${r}">${r.toFixed(1)}×${r === 1 ? ' (normal)' : ''}</option>`).join('')}</select></label>
    </div>
    ${langs.map(l => { const list = typeof voicesFor === 'function' ? voicesFor(l) : [], def = typeof pickVoice === 'function' ? pickVoice(l) : null;
      return `<label class="field" style="margin-top:8px">${esc(langName(l))} voice<select name="fv_voice:${esc(l)}" ${list.length ? '' : 'disabled'}>${keep}
        <option value="__app">App default${def ? ` (${esc(def.name.replace(/^Microsoft /, ''))})` : ''}</option>
        ${list.map(v => `<option value="${esc(v.voiceURI)}">${esc(v.name.replace(/^Microsoft /, ''))}</option>`).join('')}</select>
        ${list.length ? '' : '<span class="muted small">No voice for this language on this device</span>'}</label>`; }).join('')}
  </details>`;
}
function applyFolderVoices(form, fo) {
  const v = n => form.querySelector(`[name="${n}"]`)?.value || '';
  const tts = v('fv_tts'), auto = v('fv_auto'), rate = v('fv_rate'), voices = {};
  form.querySelectorAll('[name^="fv_voice:"]').forEach(s => { if (s.value) voices[s.name.slice(9)] = s.value; });
  if (!tts && !auto && !rate && !Object.keys(voices).length) return 0;
  const ds = S.decks.filter(d => d.folderId === fo.id);
  for (const d of ds) {
    if (tts) d.tts = tts === 'on';
    if (auto) d.autoplay = auto === 'app' ? null : auto === 'on';
    if (rate) d.rate = rate === 'app' ? null : +rate;
    for (const [l, val] of Object.entries(voices)) {
      if (d.frontLang !== l && d.backLang !== l) continue;              // only decks that use that language
      d.voices ||= {}; if (val === '__app') delete d.voices[l]; else d.voices[l] = val;
    }
  }
  return ds.length;
}
function deleteFolder(f) {
  const n = S.decks.filter(d => d.folderId === f.id).length;
  openDialog({
    title: `Delete folder “${f.name}”?`, ok: 'Delete folder', danger: true,
    body: `<p style="margin:0">${n ? `Don’t worry: the <b>${n} deck${n === 1 ? '' : 's'}</b> inside will <b>not</b> be deleted. They’ll just move out of the folder.` : 'This folder is empty.'}</p>`,
    onOk: () => { S.decks.forEach(d => { if (d.folderId === f.id) d.folderId = null; }); S.folders = folders().filter(x => x.id !== f.id); save(); render(); toast('Folder deleted. Your decks are safe.'); },
  });
}
function moveDeckDialog(d) {
  if (!folders().length) { toast('Create a folder first with “+ New folder”'); return; }
  openDialog({
    title: `Move “${d.name}” to…`, ok: 'Move',
    body: `<div class="stack">${[{ id: '', name: 'Not in a folder', color: 'var(--muted)' }, ...folders()].map(f => `<label class="check"><input type="radio" name="folder" value="${f.id}" ${(d.folderId || '') === f.id ? 'checked' : ''}><span><span style="color:${f.color}">${f.id ? '📁' : '🗂️'}</span> ${esc(f.name)}</span></label>`).join('')}</div>`,
    onOk: form => { d.folderId = form.folder.value || null; save(); render(); toast(d.folderId ? `Moved to “${folderById(d.folderId).name}”` : 'Moved out of the folder'); },
  });
}
function folderOptions(sel) {
  return `<option value="">Not in a folder</option>${folders().map(f => `<option value="${f.id}" ${sel === f.id ? 'selected' : ''}>📁 ${esc(f.name)}</option>`).join('')}`;
}
/* Home page: decks grouped into folders. cardFn renders one deck card. */
function deckSections(cardFn) {
  const fs = folders(), loose = S.decks.filter(d => !d.folderId || !folderById(d.folderId));
  if (!fs.length) return `<div class="deck-grid" data-drop="">${S.decks.map(cardFn).join('')}</div>`;
  let html = '';
  for (const f of fs) {
    const ds = S.decks.filter(d => d.folderId === f.id);
    html += `<section class="folder colored" style="--fc:${f.color};--fc-ink:${typeof inkFor === 'function' && /^#[0-9a-f]{6}$/i.test(f.color || '') ? inkFor(f.color) : '#fff'}">
      <div class="folder-head" data-drop="${f.id}" data-act="openFolder" data-id="${f.id}" title="Show only this folder">
        <button type="button" class="folder-toggle" data-act="toggleFolder" data-id="${f.id}" title="${f.collapsed ? 'Open' : 'Close'} folder">${f.collapsed ? '▸' : '▾'}</button>
        <span class="folder-icon">📁</span><b class="folder-name">${esc(f.name)}</b>
        <span class="muted small">${ds.length} deck${ds.length === 1 ? '' : 's'} · ${ds.reduce((a, d) => a + cardsOf(d.id).length, 0)} cards</span>
        <span style="flex:1"></span>
        <button type="button" class="icon-btn" data-act="folderMenu" data-id="${f.id}" title="Folder options">⋯</button>
      </div>
      ${f.collapsed ? '' : ds.length ? `<div class="deck-grid" data-drop="${f.id}">${ds.map(cardFn).join('')}</div>`
        : `<div class="folder-empty" data-drop="${f.id}">This folder is empty. Drag a deck here, or use a deck’s ⋯ menu → Move to folder.</div>`}
    </section>`;
  }
  html += `<section class="folder loose"><div class="folder-head" data-drop=""><span class="folder-icon">🗂️</span><b>Not in a folder</b><span class="muted small">${loose.length} deck${loose.length === 1 ? '' : 's'}</span></div>
    <div class="deck-grid ${loose.length ? '' : 'empty-drop'}" data-drop="">${loose.length ? loose.map(cardFn).join('') : '<div class="folder-empty">Drag a deck here to take it out of its folder.</div>'}</div></section>`;
  return html;
}

/* ---------- Safe deck deletion (warning + type to confirm + undo) ---------- */
function confirmDeleteDeck(d) {
  if (!d) return;
  const cs = cardsOf(d.id), n = cs.length, studied = cs.filter(c => c.state !== 'new').length;
  openDialog({
    title: `Delete “${d.name}”?`, ok: 'Delete deck', danger: true,
    body: `${mascotSays('Wait! Are you sure you want to delete this deck?', 'sleepy', 70)}
      <div class="warn-box">⚠️ This deletes the deck and <b>${n} card${n === 1 ? '' : 's'}</b>${studied ? `, including your study progress on <b>${studied}</b> of them` : ''}. Saved quiz and game results stay.</div>
      ${n ? `<label class="field">Type <b>delete</b> to confirm<input name="confirm" autocomplete="off" spellcheck="false" placeholder="delete"></label>` : ''}
      <p class="muted small" style="margin:0">You’ll have a few seconds to undo. For extra safety, <a data-act="backup">save a backup first</a>.</p>`,
    onOpen: dlg => {
      const ok = dlg.querySelector('button[type=submit]');
      if (n) { ok.disabled = true; dlg.querySelector('[name=confirm]').addEventListener('input', e => { ok.disabled = e.target.value.trim().toLowerCase() !== 'delete'; }); }
    },
    onOk: f => {
      if (n && f.confirm.value.trim().toLowerCase() !== 'delete') return false;
      const idx = S.decks.indexOf(d), removed = cs.slice();
      S.cards = S.cards.filter(c => c.deckId !== d.id); S.decks = S.decks.filter(x => x.id !== d.id);
      save(); go({ name: 'home' });
      undoToast(`Deleted “${d.name}”`, () => { S.decks.splice(Math.max(0, idx), 0, d); S.cards.push(...removed); save(); render(); toast(`“${d.name}” is back!`); });
    },
  });
}
let undoTimer = null;
function undoToast(msg, onUndo) {
  let el = $('#undoToast');
  if (!el) { el = document.createElement('div'); el.id = 'undoToast'; document.body.appendChild(el); }
  el.innerHTML = `<span>${esc(msg)}</span><button type="button" class="btn sm">Undo</button><span class="undo-bar"></span>`;
  el.classList.add('show');
  el.querySelector('button').onclick = () => { clearTimeout(undoTimer); el.classList.remove('show'); onUndo(); };
  clearTimeout(undoTimer); undoTimer = setTimeout(() => el.classList.remove('show'), 10000);
}

/* ---------- Drag decks into folders ---------- */
document.addEventListener('dragstart', e => {
  const card = e.target.closest?.('article.deck[data-deck]'); if (!card) return;
  e.dataTransfer.setData('text/x-deck', card.dataset.deck); e.dataTransfer.effectAllowed = 'move'; card.classList.add('dragging');
});
document.addEventListener('dragend', e => { e.target.closest?.('article.deck')?.classList.remove('dragging'); document.querySelectorAll('.drop-on').forEach(x => x.classList.remove('drop-on')); });
document.addEventListener('dragover', e => {
  const z = e.target.closest?.('[data-drop]'); if (!z || !e.dataTransfer.types.includes('text/x-deck')) return;
  e.preventDefault(); document.querySelectorAll('.drop-on').forEach(x => x !== z && x.classList.remove('drop-on')); z.classList.add('drop-on');
});
document.addEventListener('drop', e => {
  const z = e.target.closest?.('[data-drop]'), id = e.dataTransfer?.getData('text/x-deck'); if (!z || !id) return;
  e.preventDefault(); const d = deckById(id); if (!d) return;
  const to = z.dataset.drop || null; if ((d.folderId || null) === to) { render(); return; }
  d.folderId = to; save(); render(); toast(to ? `Moved to “${folderById(to).name}”` : 'Moved out of the folder');
});

Object.assign(actions, {
  newFolder: () => folderDialog(null),
  openFolder: el => { if (!folderById(el.dataset.id)) return; try { history.pushState({ folderView: el.dataset.id }, ''); } catch {} go({ name: 'home', folderId: el.dataset.id }); },
  folderBack: () => { if (history.state?.folderView) history.back(); else go({ name: 'home' }); },
  toggleFolder: el => { const f = folderById(el.dataset.id); if (f) { f.collapsed = !f.collapsed; save(); render(); } },
  folderMenu: el => { const f = folderById(el.dataset.id); popMenu(el, [['✏️ Rename / edit folder', 'editFolder', `data-id="${f.id}"`], [f.collapsed ? '📂 Open folder' : '📁 Close folder', 'toggleFolder', `data-id="${f.id}"`], ['🗑️ Delete folder', 'deleteFolder', `data-id="${f.id}"`, true]]); },
  editFolder: el => folderDialog(folderById(el.dataset.id)),
  deleteFolder: el => deleteFolder(folderById(el.dataset.id)),
  deckMenu: el => {
    const d = deckById(el.dataset.id);
    popMenu(el, [['📝 Edit cards', 'openDeck', `data-id="${d.id}"`], ['⚙️ Deck settings', 'deckSettings', `data-id="${d.id}"`], ['📁 Move to folder…', 'moveDeck', `data-id="${d.id}"`], ['✨ Add example sentences', 'fillExamples', `data-id="${d.id}"`],
      ['📄 Duplicate deck…', 'duplicateDeck', `data-id="${d.id}"`], ['🔗 Merge a deck into this…', 'mergeDeck', `data-id="${d.id}"`],
      ...(d.merged?.length ? [['✂️ Unmerge…', 'unmergeDeck', `data-id="${d.id}"`]] : []),
      ['📤 Export', 'exportDialog', `data-id="${d.id}"`], ['🗑️ Delete deck…', 'deleteDeck', `data-id="${d.id}"`, true]]);
  },
  moveDeck: el => moveDeckDialog(deckById(el.dataset.id)),
  deleteDeck: el => confirmDeleteDeck(deckById(el.dataset.id)),
});

/* ---------- One folder on its own: the home page shows just this folder's decks ---------- */
function folderHomeView(cardFn, now = Date.now()) {
  const f = folderById(view.folderId); if (!f) return null;
  const ds = S.decks.filter(d => d.folderId === f.id), cards = ds.reduce((a, d) => a + cardsOf(d.id).length, 0);
  const ink = typeof inkFor === 'function' && /^#[0-9a-f]{6}$/i.test(f.color || '') ? inkFor(f.color) : '#fff';
  const list = typeof homeListMode === 'function' && homeListMode();
  const head = `<div class="folder-head" data-drop="${f.id}"><span class="folder-icon">📁</span><b class="folder-name">${esc(f.name)}</b>
        <span class="muted small">${ds.length} deck${ds.length === 1 ? '' : 's'} · ${cards} card${cards === 1 ? '' : 's'}</span><span style="flex:1"></span>
        <button type="button" class="icon-btn" data-act="folderMenu" data-id="${f.id}" title="Folder options">⋯</button></div>`;
  const body = !ds.length ? `<div class="folder-empty" data-drop="${f.id}">This folder is empty. Go back to all folders and drag a deck here, or use a deck’s ⋯ menu → Move to folder.</div>`
    : list ? `<div class="deck-grid" data-drop="${f.id}">${ds.map(d => deckRow(d, now)).join('')}</div>` : '';
  return `<div class="folder-view">
    <div class="row-between fv-top"><button type="button" class="btn" data-act="folderBack" title="Back to all your folders and decks">← All folders</button>
      <div class="row">${typeof deckViewToggle === 'function' && ds.length ? deckViewToggle() : ''}<button type="button" class="btn primary" data-act="newDeck">+ New deck</button></div></div>
    <div class="deck-list"><section class="folder colored" style="--fc:${f.color};--fc-ink:${ink}">${head}${body}</section></div>
    ${ds.length && !list ? `<div class="deck-grid" data-drop="${f.id}" style="margin-top:12px">${ds.map(cardFn).join('')}</div>` : ''}
  </div>`;
}
window.addEventListener('popstate', () => { if (view?.name === 'home' && view.folderId) go({ name: 'home' }); });
