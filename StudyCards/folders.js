'use strict';
/* ================= Deck folders, deck menu, and safe deck deletion ================= */
const FOLDER_COLORS = ['#3b54e8', '#23905a', '#cf3f3f', '#f2a516', '#8e44ad', '#16a085', '#ef8354', '#475569'];
const folders = () => (S.folders ||= []);
const folderById = id => folders().find(f => f.id === id);
/* Folders can hold other folders (f.parentId). A folder whose parent is gone counts as a top-level folder. */
const FOLDER_MAX_DEPTH = 5;
const folderParent = f => f?.parentId && f.parentId !== f.id ? folderById(f.parentId) || null : null;
const subFolders = pid => folders().filter(f => (folderParent(f)?.id || null) === (pid || null));
function folderPath(f) { const out = []; let x = f, n = 0; while (x && n++ < 20) { out.unshift(x); x = folderParent(x); } return out; }   // top … f
function folderDescendants(f) { const out = []; const walk = p => { for (const c of subFolders(p.id)) { if (out.includes(c)) continue; out.push(c); walk(c); } }; if (f) walk(f); return out; }
const folderDecksDeep = f => { const ids = new Set([f.id, ...folderDescendants(f).map(x => x.id)]); return S.decks.filter(d => ids.has(d.folderId)); };
const folderDepth = f => folderPath(f).length;   // 1 = top level
function folderTreeList(skip) {   // every folder in tree order with its depth, leaving out `skip` and everything inside it
  const out = [], bad = new Set(skip ? [skip.id, ...folderDescendants(skip).map(x => x.id)] : []);
  const walk = (pid, depth) => { for (const f of subFolders(pid)) { if (bad.has(f.id)) continue; out.push([f, depth]); walk(f.id, depth + 1); } };
  walk(null, 0); return out;
}

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
function folderDialog(f, parentId) {
  const parentNow = f ? (folderParent(f)?.id || '') : (parentId || '');
  const parents = folderTreeList(f).filter(([x, depth]) => depth + 1 < FOLDER_MAX_DEPTH);
  openDialog({
    title: f ? 'Edit folder' : 'New folder', ok: f ? 'Save' : 'Create folder',
    body: `<label class="field">Folder name<input name="name" required maxlength="60" value="${esc(f?.name || '')}" placeholder="e.g. Spanish class, Travel words"></label>
      ${folders().length && (parents.length || parentNow) ? `<label class="field">Inside folder<select name="parent"><option value="">— Not inside another folder —</option>${parents.map(([x, depth]) => `<option value="${x.id}" ${parentNow === x.id ? 'selected' : ''}>${'\u00a0\u00a0\u00a0'.repeat(depth)}📁 ${esc(x.name)}</option>`).join('')}</select></label>` : ''}
      <div class="field">Color<div class="row" style="gap:6px;margin-top:6px">${FOLDER_COLORS.map(c => `<label class="swatch" style="background:${c}"><input type="radio" name="color" value="${c}" ${(f?.color || FOLDER_COLORS[0]) === c ? 'checked' : ''}></label>`).join('')}</div></div>
      ${S.decks.length ? `<div class="field">Decks in this folder <span class="hint muted">(tick to add, untick to remove)</span><div class="folder-pick">${S.decks.map(d => {
        const other = d.folderId && d.folderId !== f?.id ? folderById(d.folderId) : null;
        return `<label class="check"><input type="checkbox" name="d_${d.id}" ${f && d.folderId === f.id ? 'checked' : ''}><span>${esc(d.name)}${other ? ` <span class="muted small">(now in ${esc(other.name)})</span>` : ''}</span></label>`;
      }).join('')}</div></div>` : ''}
      ${f ? folderVoiceFields(f) : ''}`,
    onOk: form => {
      const name = form.name.value.trim(); if (!name) { toast('Enter a folder name'); return false; }
      let fo = f;
      const parent = form.parent ? form.parent.value || null : (parentId || null);
      if (fo) { fo.name = name; fo.color = form.color.value; fo.parentId = parent; }
      else { fo = { id: uid(), name, color: form.color.value, created: Date.now(), collapsed: false, parentId: parent }; folders().push(fo); }
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
  const n = S.decks.filter(d => d.folderId === f.id).length, subs = subFolders(f.id), up = folderParent(f);
  const where = up ? `into “${esc(up.name)}”` : 'out of the folder';
  openDialog({
    title: `Delete folder “${f.name}”?`, ok: 'Delete folder', danger: true,
    body: `<p style="margin:0">${n || subs.length ? `Don’t worry: nothing inside is deleted. ${n ? `The <b>${n} deck${n === 1 ? '' : 's'}</b>` : ''}${n && subs.length ? ' and ' : ''}${subs.length ? `the <b>${subs.length} folder${subs.length === 1 ? '' : 's'}</b>` : ''} inside will move ${where}.` : 'This folder is empty.'}</p>`,
    onOk: () => {
      S.decks.forEach(d => { if (d.folderId === f.id) d.folderId = up?.id || null; });
      subs.forEach(x => { x.parentId = up?.id || null; });
      S.folders = folders().filter(x => x.id !== f.id); save();
      if (view.name === 'home' && view.folderId === f.id) go(up ? { name: 'home', folderId: up.id } : { name: 'home' }); else render();
      toast('Folder deleted. Your decks are safe.');
    },
  });
}
function moveDeckDialog(d) {
  if (!folders().length) { toast('Create a folder first with “+ New folder”'); return; }
  openDialog({
    title: `Move “${d.name}” to…`, ok: 'Move',
    body: `<div class="stack">${[[{ id: '', name: 'Not in a folder', color: 'var(--muted)' }, 0], ...folderTreeList()].map(([f, depth]) => `<label class="check" style="margin-left:${depth * 18}px"><input type="radio" name="folder" value="${f.id}" ${(d.folderId || '') === f.id ? 'checked' : ''}><span><span style="color:${f.color}">${f.id ? '📁' : '🗂️'}</span> ${esc(f.name)}</span></label>`).join('')}</div>`,
    onOk: form => { d.folderId = form.folder.value || null; save(); render(); toast(d.folderId ? `Moved to “${folderById(d.folderId).name}”` : 'Moved out of the folder'); },
  });
}
function folderOptions(sel) {
  return `<option value="">Not in a folder</option>${folderTreeList().map(([f, depth]) => `<option value="${f.id}" ${sel === f.id ? 'selected' : ''}>${'\u00a0\u00a0\u00a0'.repeat(depth)}📁 ${esc(f.name)}</option>`).join('')}`;
}
/* Home page: decks grouped into folders, with folders inside folders. cardFn renders one deck card. */
function folderSection(f, cardFn, depth = 0) {
  const ds = S.decks.filter(d => d.folderId === f.id), subs = subFolders(f.id), all = folderDecksDeep(f);
  const cards = all.reduce((a, d) => a + cardsOf(d.id).length, 0);
  const ink = typeof inkFor === 'function' && /^#[0-9a-f]{6}$/i.test(f.color || '') ? inkFor(f.color) : '#fff';
  const what = [subs.length ? `${subs.length} folder${subs.length === 1 ? '' : 's'}` : '', `${all.length} deck${all.length === 1 ? '' : 's'}`, `${cards} cards`].filter(Boolean).join(' · ');
  const inside = (subs.length ? `<div class="folder-subs">${subs.map(x => folderSection(x, cardFn, depth + 1)).join('')}</div>` : '')
    + (ds.length ? `<div class="deck-grid" data-drop="${f.id}">${ds.map(cardFn).join('')}</div>` : '')
    + (!ds.length && !subs.length ? `<div class="folder-empty" data-drop="${f.id}">This folder is empty. Drag a deck here, or use a deck’s ⋯ menu → Move to folder.</div>` : '');
  return `<section class="folder colored${depth ? ' sub' : ''}" style="--fc:${f.color};--fc-ink:${ink}">
      <div class="folder-head" data-drop="${f.id}" data-folder="${f.id}" draggable="true" data-act="openFolder" data-id="${f.id}" title="Show only this folder. Drag it onto another folder to put it inside.">
        <button type="button" class="folder-toggle" data-act="toggleFolder" data-id="${f.id}" title="${f.collapsed ? 'Open' : 'Close'} folder">${f.collapsed ? '▸' : '▾'}</button>
        <span class="folder-icon">📁</span><b class="folder-name">${esc(f.name)}</b>
        <span class="muted small">${what}</span>
        <span style="flex:1"></span>
        <button type="button" class="icon-btn" data-act="folderMenu" data-id="${f.id}" title="Folder options">⋯</button>
      </div>
      ${f.collapsed ? '' : inside}
    </section>`;
}
function deckSections(cardFn) {
  const fs = folders(), loose = S.decks.filter(d => !d.folderId || !folderById(d.folderId));
  if (!fs.length) return `<div class="deck-grid" data-drop="">${S.decks.map(cardFn).join('')}</div>`;
  let html = subFolders(null).map(f => folderSection(f, cardFn)).join('');
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

/* ---------- Drag folders into other folders ---------- */
const folderHeight = f => 1 + Math.max(0, ...subFolders(f.id).map(folderHeight));
function folderDropOk(f, toId) {   // not into itself or its own subfolders, and not deeper than the limit
  if (!f) return false;
  if (!toId) return !!folderParent(f);
  const to = folderById(toId); if (!to || to.id === f.id || folderDescendants(f).some(x => x.id === to.id)) return false;
  if (folderParent(f)?.id === to.id) return false;
  return folderDepth(to) + folderHeight(f) <= FOLDER_MAX_DEPTH;
}
let folderDragId = null;
document.addEventListener('dragstart', e => {
  const head = e.target.closest?.('.folder-head[data-folder]'); if (!head || e.target.closest('article.deck')) return;
  folderDragId = head.dataset.folder; e.dataTransfer.setData('text/x-folder', folderDragId); e.dataTransfer.effectAllowed = 'move';
  head.closest('section.folder')?.classList.add('dragging');
});
document.addEventListener('dragend', () => { folderDragId = null; document.querySelectorAll('section.folder.dragging').forEach(x => x.classList.remove('dragging')); document.querySelectorAll('.drop-on, .drop-no').forEach(x => x.classList.remove('drop-on', 'drop-no')); });
document.addEventListener('dragover', e => {
  if (!e.dataTransfer.types.includes('text/x-folder')) return;
  const z = e.target.closest?.('[data-drop]'); document.querySelectorAll('.drop-on, .drop-no').forEach(x => x !== z && x.classList.remove('drop-on', 'drop-no')); if (!z) return;
  if (folderDropOk(folderById(folderDragId), z.dataset.drop || null)) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; z.classList.add('drop-on'); } else z.classList.add('drop-no');
});
document.addEventListener('drop', e => {
  const id = e.dataTransfer?.getData('text/x-folder'); if (!id) return;
  const z = e.target.closest?.('[data-drop]'), f = folderById(id); if (!z || !f) return;
  e.preventDefault(); const to = z.dataset.drop || null;
  if (!folderDropOk(f, to)) { if (to && (to === f.id || folderDescendants(f).some(x => x.id === to))) toast('A folder can’t go inside itself'); else if (to && folderDepth(folderById(to)) + folderHeight(f) > FOLDER_MAX_DEPTH) toast(`Folders can only be ${FOLDER_MAX_DEPTH} levels deep`); render(); return; }
  if (to) { f.parentId = to; const t = folderById(to); if (t.collapsed) t.collapsed = false; } else delete f.parentId;
  save(); render(); toast(to ? `📁 “${f.name}” is now inside “${folderById(to).name}”` : `📁 “${f.name}” moved to the top level`);
});

Object.assign(actions, {
  newFolder: () => folderDialog(null, view.name === 'home' && view.folderId && folderById(view.folderId) ? view.folderId : null),
  openFolder: el => { if (!folderById(el.dataset.id)) return; try { history.pushState({ folderView: el.dataset.id }, ''); } catch {} go({ name: 'home', folderId: el.dataset.id }); },
  folderBack: el => { const to = el?.dataset?.to; if (to && folderById(to)) go({ name: 'home', folderId: to }); else if (history.state?.folderView && !to) history.back(); else go({ name: 'home' }); },
  toggleFolder: el => { const f = folderById(el.dataset.id); if (f) { f.collapsed = !f.collapsed; save(); render(); } },
  folderMenu: el => { const f = folderById(el.dataset.id); popMenu(el, [['✏️ Rename / edit folder', 'editFolder', `data-id="${f.id}"`], ...(folderDepth(f) < FOLDER_MAX_DEPTH ? [['➕ New folder inside', 'newSubFolder', `data-id="${f.id}"`]] : []), [f.collapsed ? '📂 Open folder' : '📁 Close folder', 'toggleFolder', `data-id="${f.id}"`], ['🗑️ Delete folder', 'deleteFolder', `data-id="${f.id}"`, true]]); },
  newSubFolder: el => folderDialog(null, el.dataset.id),
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

/* ---------- One folder on its own: the home page shows just this folder (its folders and decks) ---------- */
function folderHomeView(cardFn, now = Date.now()) {
  const f = folderById(view.folderId); if (!f) return null;
  const ds = S.decks.filter(d => d.folderId === f.id), subs = subFolders(f.id), all = folderDecksDeep(f), cards = all.reduce((a, d) => a + cardsOf(d.id).length, 0);
  const ink = typeof inkFor === 'function' && /^#[0-9a-f]{6}$/i.test(f.color || '') ? inkFor(f.color) : '#fff';
  const list = typeof homeListMode === 'function' && homeListMode(), up = folderParent(f), path = folderPath(f);
  const crumbs = `<div class="crumbs fv-path"><a data-act="folderBack" data-to="">All folders</a>${path.map((x, i) => ` › ${i < path.length - 1 ? `<a data-act="folderBack" data-to="${x.id}">${esc(x.name)}</a>` : `<b>${esc(x.name)}</b>`}`).join('')}</div>`;
  const what = [subs.length ? `${subs.length} folder${subs.length === 1 ? '' : 's'}` : '', `${all.length} deck${all.length === 1 ? '' : 's'}`, `${cards} card${cards === 1 ? '' : 's'}`].filter(Boolean).join(' · ');
  const head = `<div class="folder-head" data-drop="${f.id}"><span class="folder-icon">📁</span><b class="folder-name">${esc(f.name)}</b>
        <span class="muted small">${what}</span><span style="flex:1"></span>
        <button type="button" class="icon-btn" data-act="folderMenu" data-id="${f.id}" title="Folder options">⋯</button></div>`;
  const body = !ds.length && !subs.length ? `<div class="folder-empty" data-drop="${f.id}">This folder is empty. Add a folder or a deck inside it, or move a deck here with its ⋯ menu → Move to folder.</div>`
    : list && ds.length ? `<div class="deck-grid" data-drop="${f.id}">${ds.map(d => deckRow(d, now)).join('')}</div>` : '';
  return `<div class="folder-view">
    ${crumbs}
    <div class="row-between fv-top"><button type="button" class="btn" data-act="folderBack" data-to="${up?.id || ''}" title="Back up one level">← ${up ? esc(up.name) : 'All folders'}</button>
      <div class="row">${typeof deckViewToggle === 'function' && ds.length ? deckViewToggle() : ''}${folderDepth(f) < FOLDER_MAX_DEPTH ? `<button type="button" class="btn" data-act="newSubFolder" data-id="${f.id}">📁 New folder inside</button>` : ''}<button type="button" class="btn primary" data-act="newDeck">+ New deck</button></div></div>
    <div class="deck-list"><section class="folder colored" style="--fc:${f.color};--fc-ink:${ink}">${head}${body}</section></div>
    ${subs.length ? `<div class="folder-subs fv-subs${list ? ' deck-list' : ''}">${subs.map(x => folderSection(x, list ? (d => deckRow(d, now)) : cardFn, 1)).join('')}</div>` : ''}   <!-- (list view: subfolder decks need the list layout too) -->
    ${ds.length && !list ? `<div class="deck-grid" data-drop="${f.id}" style="margin-top:12px">${ds.map(cardFn).join('')}</div>` : ''}
  </div>`;
}
window.addEventListener('popstate', () => { if (view?.name === 'home' && view.folderId) go({ name: 'home' }); });
