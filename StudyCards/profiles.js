'use strict';
/* ================= Profiles on this PC =================
   Each profile has its own decks, cards, progress and settings (IndexedDB key "state:<id>").
   The optional PIN only keeps other people on this PC out of a profile in the app; it is not encryption. */
let profiles = { list: [], lastId: null };
window.currentProfileId = null;
const currentProfile = () => profiles.list.find(p => p.id === currentProfileId);
/* App look, per profile: 'fun' (the elephant, animal friends and landscapes) or 'pro' (clean and serious, no animals) */
const lookProfile = () => (typeof view !== 'undefined' && view?.name === 'profiles') ? profiles.list.find(x => x.id === profiles.lastId) : currentProfile();
const lookPro = () => lookProfile()?.look === 'pro';
const PRO_LOGO = `<svg viewBox="0 0 38 38" width="34" height="34" aria-hidden="true"><rect x="9" y="6" width="22" height="26" rx="4" fill="var(--accent)" opacity=".35" transform="rotate(8 20 19)"/><rect x="7" y="7" width="22" height="26" rx="4" fill="var(--accent)"/><path d="M12 15h12M12 20h12M12 25h7" stroke="var(--accent-ink)" stroke-width="2.2" stroke-linecap="round"/></svg>`;
let lookShown = null;
function applyLook() {
  const pro = lookPro();
  document.body?.classList.toggle('look-pro', pro);
  if (lookShown === pro) return; lookShown = pro;
  const logo = document.querySelector('.brand .logo'); if (logo) logo.innerHTML = pro ? PRO_LOGO : mascot(38);
  const icon = document.querySelector('link[rel=icon][type="image/svg+xml"]');
  if (icon) icon.href = 'data:image/svg+xml,' + encodeURIComponent(pro ? PRO_LOGO.replace(/var\(--accent\)/g, '#2f4f86').replace(/var\(--accent-ink\)/g, '#fff').replace('width="34" height="34" ', 'xmlns="http://www.w3.org/2000/svg" ') : mascot(64).replace('<svg class="mascot"', '<svg'));
}
function toggleLook() {
  const p = currentProfile(); if (!p) return;
  p.look = p.look === 'pro' ? 'fun' : 'pro'; saveProfiles(); render();
  toast(p.look === 'pro' ? '💼 Professional look: clean and simple, no animals' : '🎈 Fun look: the elephant and friends are back!');
}
const saveProfiles = () => idb ? idbDo('kv', 'readwrite', st => st.put(profiles, 'profiles')) : Promise.resolve();
const AVATAR_COLORS = ['#3b54e8', '#23905a', '#c97c10', '#cf3f3f', '#8e44ad', '#16a085', '#d35400', '#475569'];
const avatarKey = id => 'avatar:' + id;
function freshState(withSample) {
  const s = { version: 1, decks: [], cards: [], settings: defaultSettings(), log: {}, lastBackup: null };
  if (withSample) seed(s);
  return s;
}
function initials(name) {
  const parts = String(name || '?').trim().split(/\s+/).filter(Boolean);
  return ((parts[0] || '?')[0] + (parts.length > 1 ? parts.at(-1)[0] : '')).toUpperCase();
}
function avatarHtml(p, size = 32) {
  if (p?.avatarMode === 'built' && p.avatarCfg && typeof avatarSvg === 'function')
    return `<span class="avatar" style="width:${size}px;height:${size}px">${avatarSvg(p.avatarCfg, size)}</span>`;
  const url = p?.avatar && p?.avatarMode !== 'initials' && mediaURL.get(avatarKey(p.id));
  const st = `width:${size}px;height:${size}px;font-size:${Math.round(size * 0.4)}px`;
  return url ? `<span class="avatar" style="${st}"><img src="${url}" alt=""></span>`
             : `<span class="avatar" style="${st};background:${esc(p?.color || AVATAR_COLORS[0])}">${esc(initials(p?.name))}</span>`;
}
async function hashPin(pin, salt) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin));
  return [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function putAvatar(pid, blob) {
  await idbDo('media', 'readwrite', st => st.put(blob, avatarKey(pid)));
  const old = mediaURL.get(avatarKey(pid)); if (old) URL.revokeObjectURL(old);
  mediaURL.set(avatarKey(pid), URL.createObjectURL(blob));
}
async function squareImage(file, size = 256) {
  const bmp = await createImageBitmap(file), s = Math.min(bmp.width, bmp.height);
  const c = document.createElement('canvas'); c.width = c.height = size;
  c.getContext('2d').drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, size, size);
  return new Promise(r => c.toBlob(r, 'image/webp', 0.9));
}

async function profilesBoot() {
  const stored = await idbDo('kv', 'readonly', st => st.get('profiles'));
  if (stored?.list?.length) profiles = stored;
  else {
    // First run with profiles: move the existing cards into a first profile.
    const legacy = await idbDo('kv', 'readonly', st => st.get('state'));
    const data = legacy && (legacy.savedAt || 0) >= (S.savedAt || 0) ? migrate(legacy) : S;
    const p = { id: 'p' + uid(), name: '', color: AVATAR_COLORS[0], created: Date.now(), avatar: false, pin: null };
    profiles = { list: [p], lastId: p.id, setup: true };
    await idbDo('kv', 'readwrite', st => st.put(data, 'state:' + p.id));
    await saveProfiles();
  }
  const last = profiles.list.find(p => p.id === profiles.lastId) || profiles.list[0];
  if (profiles.list.length === 1 && !last.pin) await openProfile(last.id);
  else view = { name: 'profiles' };
}
async function openProfile(id) {
  if (idbTimer) { clearTimeout(idbTimer); writeState(); }
  const st = await idbDo('kv', 'readonly', s => s.get('state:' + id));
  currentProfileId = id;
  S = st ? migrate(st) : freshState(true);
  if (!st) await idbDo('kv', 'readwrite', s => s.put(S, 'state:' + id));
  profiles.lastId = id; saveProfiles();
  study = null; quiz = null; game = null; qr = null;
  view = { name: 'home' };
}
async function enterProfile(id) {
  const p = profiles.list.find(x => x.id === id); if (!p) return;
  if (p.pin) {
    openDialog({
      title: `Enter PIN for ${p.name || 'this profile'}`, ok: 'Open',
      body: `<div style="display:flex;justify-content:center">${avatarHtml(p, 72)}</div>
        <label class="field">PIN<input name="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8" required style="font-size:20px;letter-spacing:6px;text-align:center"></label>`,
      onOk: f => {
        hashPin(f.pin.value, p.pin.salt).then(async h => {
          if (h !== p.pin.hash) { toast('Wrong PIN'); return; }
          $('#dlg').close(); await openProfile(id); render();
        });
        return false;
      },
    });
    return;
  }
  await openProfile(id); render();
}
function lockApp() { if (idbTimer) { clearTimeout(idbTimer); writeState(); } if ('speechSynthesis' in window) speechSynthesis.cancel(); view = { name: 'profiles' }; render(); }

function profileDialog(p, { setup = false } = {}) {
  const isNew = !p;
  const prof = p || { id: 'p' + uid(), name: '', color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)], avatar: false, pin: null };
  let pendingAvatar = undefined;    // Blob = new picture, null = remove, undefined = unchanged
  let pendingBg = null;             // a newly chosen background photo (Blob)
  let mode = prof.avatarMode || (prof.avatar ? 'photo' : 'initials');   // what the profile shows: photo | built | initials
  const hasPhoto = () => !!pendingAvatar || (pendingAvatar !== null && !!prof.avatar);
  const preview = () => {
    const tmp = { ...prof, name: $('#pfName')?.value || prof.name, color: document.querySelector('[name=color]:checked')?.value || prof.color, avatarMode: mode };
    document.querySelectorAll('[name=avmode]').forEach(r => { r.checked = r.value === mode; r.disabled = (r.value === 'photo' && !hasPhoto()) || (r.value === 'built' && !prof.avatarCfg); });
    if (mode === 'photo' && pendingAvatar) { $('#pfPreview').innerHTML = `<span class="avatar" style="width:96px;height:96px"><img src="${URL.createObjectURL(pendingAvatar)}" alt=""></span>`; return; }
    if (pendingAvatar === null) tmp.avatar = false;
    $('#pfPreview').innerHTML = avatarHtml(tmp, 96);
  };
  openDialog({
    title: setup ? 'Set up your profile' : isNew ? 'New profile' : 'Edit profile', ok: setup ? 'Save profile' : isNew ? 'Create profile' : 'Save',
    body: `
      ${setup ? mascotSays('Welcome to <b>Estudiamos</b>! Your decks are safe. Choose a username and picture for your profile. You can add profiles for other people on this PC later.', 'happy', 80) : ''}
      <div class="row" style="gap:16px;align-items:center;flex-wrap:nowrap">
        <div id="pfPreview">${avatarHtml(prof, 96)}</div>
        <div class="stack" style="flex:1">
          <div class="row"><button type="button" class="btn sm" id="pfPick">Choose picture…</button>
            ${isNew ? '' : `<button type="button" class="btn sm" id="pfAvatar">🎨 ${prof.avatarCfg ? 'Edit avatar…' : 'Create avatar…'}</button>`}
            <button type="button" class="btn sm ghost" id="pfRemove" ${prof.avatar ? '' : 'hidden'}>Remove picture</button></div>
          <div class="seg" style="margin-top:0">${[['photo', '📷 Photo'], ['built', '🎨 Avatar'], ['initials', '🔤 Initials']].map(([v, l]) => `<label><input type="radio" name="avmode" value="${v}">${l}</label>`).join('')}</div>
          ${isNew ? '<span class="muted small">You can create a cartoon avatar after making the profile.</span>' : ''}
          <div><span class="muted small">Or a color for your initials:</span>
            <div class="row" style="gap:6px;margin-top:4px">${AVATAR_COLORS.map(c => `<label class="swatch" style="background:${c}"><input type="radio" name="color" value="${c}" ${c === prof.color ? 'checked' : ''}></label>`).join('')}</div></div>
        </div>
      </div>
      <label class="field">Username<input name="name" id="pfName" required maxlength="40" value="${esc(prof.name)}" placeholder="Your name"></label>
      <div class="field">Background theme <span class="hint muted">(click one to preview it, or use your own picture)</span>${scenePicker(prof.scene || 'meadow', prof.id, prof.bgColor)}</div>
      <div class="field">Background color <span class="hint muted">(optional)</span>${bgColorPicker(prof.bgColor)}</div>
      ${themeColorPickers(prof)}
      <div class="row" style="gap:10px;align-items:center"><button type="button" class="btn" id="themeDefault">↩️ Default theme</button><span class="muted small">Puts the Meadow background and all the normal colors back. Save to keep it.</span></div>
      <div class="feat"><h4>PIN lock <span class="muted small" style="font-weight:400">(optional)</span></h4>
        <p class="muted small" style="margin:0 0 8px">A 4–8 digit PIN asked when opening this profile. It keeps others on this PC out of your profile in the app, but it is not encryption.</p>
        ${prof.pin ? `<label class="check" style="margin-bottom:8px"><input type="checkbox" name="removePin"><span>Remove the PIN</span></label>` : ''}
        <div class="grid2">
          <label class="field">${prof.pin ? 'New PIN' : 'PIN'}<input name="pin" type="password" inputmode="numeric" autocomplete="new-password" maxlength="8" placeholder="${prof.pin ? 'Leave empty to keep' : 'No PIN'}"></label>
          <label class="field">Repeat PIN<input name="pin2" type="password" inputmode="numeric" autocomplete="new-password" maxlength="8"></label>
        </div></div>
      ${isNew ? `<label class="check"><input type="checkbox" name="sample" checked><span>Start with the Spanish sample deck</span></label>` : ''}
      ${!isNew && !setup && profiles.list.length > 1 ? `<div><a style="color:var(--again)" id="pfDelete">Delete this profile…</a></div>` : ''}`,
    onOpen: dlg => {
      $('#pfName').addEventListener('input', preview);
      const pickBg = () => pickBinaryFile('image/*', async file => {
        try {
          pendingBg = await prepBackground(file);
          if (scenePreviewUrl) URL.revokeObjectURL(scenePreviewUrl);
          scenePreviewUrl = URL.createObjectURL(pendingBg);
          const t = $('#customThumb'); t.style.backgroundImage = `url("${scenePreviewUrl}")`; t.innerHTML = '';
          $('#customPick').textContent = 'Change…';
          dlg.querySelector('[name=scene][value=custom]').checked = true;
          scenePreview = 'custom'; applyScene();
        } catch (e) { console.error(e); toast('Could not use that picture. Try a JPG or PNG.'); }
      });
      dlg.querySelectorAll('[name=scene]').forEach(r => r.addEventListener('change', () => {
        if (r.value === 'custom' && !pendingBg && !mediaURL.get(bgKey(prof.id))) pickBg();
        scenePreview = r.value; applyScene();
      }));
      $('#customPick').addEventListener('click', e => { e.preventDefault(); pickBg(); });
      // background color: preview live while choosing
      scenePreviewColor = undefined;   // never carry a preview over from an earlier dialog
      let bgColor = isHexColor(prof.bgColor) ? prof.bgColor : null;
      wireBgColorPicker(dlg, bgColor, c => {
        bgColor = c; scenePreviewColor = c; applyScene(); recolorSceneThumbs(c);
        $('#bgColorReset').hidden = !c;
        const note = $('#bgColorNote'); if (note) note.textContent = c ? '' : 'Right now each theme uses its own colors. Change any value to use your own. ';
      });
      dlg.bgColorValue = () => bgColor;
      wireThemeColorPickers(dlg, prof);
      $('#themeDefault').addEventListener('click', () => {
        ['bg', 'box', 'side', 'acc'].forEach(k => $(`#${k}ColorReset`)?.click());
        const meadow = dlg.querySelector('[name=scene][value=meadow]');
        if (meadow && !meadow.checked) { meadow.checked = true; meadow.dispatchEvent(new Event('change')); }
        toast('Default theme. Press Save to keep it.');
      });
      dlg.addEventListener('close', () => { scenePreview = null; scenePreviewColor = undefined; themePreview = {}; applyScene(); }, { once: true });
      dlg.querySelectorAll('[name=color]').forEach(r => r.addEventListener('change', () => { if (!pendingAvatar) { pendingAvatar = pendingAvatar === null ? null : undefined; preview(); } }));
      $('#pfPick').onclick = () => pickBinaryFile('image/*', async f => {
        try { pendingAvatar = await squareImage(f); mode = 'photo'; $('#pfRemove').hidden = false; preview(); } catch { toast('Could not use that picture'); }
      });
      $('#pfRemove').onclick = () => { pendingAvatar = null; if (mode === 'photo') mode = prof.avatarCfg ? 'built' : 'initials'; $('#pfRemove').hidden = true; preview(); };
      $('#pfAvatar')?.addEventListener('click', () => { dlg.close(); openAvatarBuilder(prof.id); });
      dlg.querySelectorAll('[name=avmode]').forEach(r => r.addEventListener('change', () => { mode = r.value; preview(); }));
      preview();
      $('#pfDelete')?.addEventListener('click', () => deleteProfile(prof));
    },
    onOk: f => {
      const name = f.name.value.trim();
      if (!name) { toast('Enter a username'); return false; }
      const pin = f.pin.value, pin2 = f.pin2.value;
      if (pin && !/^\d{4,8}$/.test(pin)) { toast('The PIN must be 4–8 digits'); return false; }
      if (pin !== pin2) { toast('The two PINs don’t match'); return false; }
      (async () => {
        const prevScene = prof.scene || 'meadow';
        prof.name = name; prof.color = f.color.value || prof.color; prof.scene = f.scene?.value || prevScene;
        const bgc = $('#dlg').bgColorValue?.(); if (bgc) prof.bgColor = bgc; else delete prof.bgColor;
        const tc = $('#dlg').themeColorValues?.() || {}; for (const [k, v] of Object.entries(tc)) { if (v) prof[k] = v; else delete prof[k]; }
        if (prof.scene === 'custom') {
          if (pendingBg) await putBackground(prof.id, pendingBg);
          else if (!mediaURL.get(bgKey(prof.id))) prof.scene = prevScene === 'custom' ? 'meadow' : prevScene;   // no picture chosen
        }
        if (scenePreviewUrl) { URL.revokeObjectURL(scenePreviewUrl); scenePreviewUrl = null; }
        if (f.removePin?.checked) prof.pin = null;
        else if (pin) { const salt = uid(); prof.pin = { salt, hash: await hashPin(pin, salt) }; }
        prof.avatarMode = mode;
        if (pendingAvatar) { await putAvatar(prof.id, pendingAvatar); prof.avatar = true; }
        else if (pendingAvatar === null) { prof.avatar = false; await idbDo('media', 'readwrite', st => st.delete(avatarKey(prof.id))); mediaURL.delete(avatarKey(prof.id)); }
        if (isNew) {
          prof.created = Date.now(); profiles.list.push(prof);
          await idbDo('kv', 'readwrite', st => st.put(freshState(f.sample.checked), 'state:' + prof.id));
          await saveProfiles(); await openProfile(prof.id); toast(`Welcome, ${name}!`); if (typeof tourMaybe === 'function') setTimeout(tourMaybe, 600);
        } else { delete profiles.setup; await saveProfiles(); toast('Profile saved'); }
        render();
      })().catch(e => toast('Could not save the profile: ' + e.message));
    },
  });
}
function deleteProfile(p) {
  const n = p.id === currentProfileId ? S.cards.length : null;
  confirmDlg(`Delete ${p.name || 'this profile'}?`, `This permanently deletes the profile${n != null ? ` and its ${n} cards` : ' and all its decks and cards'}, progress and pictures. Save a backup first if you might want them back.`, 'Delete profile', async () => {
    profiles.list = profiles.list.filter(x => x.id !== p.id);
    await idbDo('kv', 'readwrite', st => st.delete('state:' + p.id));
    await idbDo('media', 'readwrite', st => st.delete(avatarKey(p.id)));
    await removeBackground(p.id);
    try { localStorage.removeItem(LS_KEY + ':' + p.id); } catch {}
    if (profiles.lastId === p.id) profiles.lastId = profiles.list[0]?.id;
    await saveProfiles();
    if (p.id === currentProfileId) { currentProfileId = null; view = { name: 'profiles' }; }
    render(); gcMedia(); toast('Profile deleted');
  });
}

/* ---------- Views & header ---------- */
views.profiles = () => `
  <div class="profiles-screen">
    <div class="mascot-bob" style="display:inline-block">${mascot(130)}</div>
    <h2 style="margin-top:6px">¡Hola! Who’s studying?</h2>
    <div class="profile-grid">
      ${profiles.list.map(p => `<button type="button" class="profile-tile" data-act="enterProfile" data-id="${p.id}">
        ${avatarHtml(p, 96)}<span class="pname">${esc(p.name || 'My profile')}</span>${p.pin ? '<span class="muted small">🔒 PIN</span>' : ''}</button>`).join('')}
      <button type="button" class="profile-tile add" data-act="newProfile"><span class="avatar" style="width:96px;height:96px;background:var(--surface2);color:var(--muted);font-size:40px">+</span><span class="pname">Add profile</span></button>
    </div>
  </div>`;
function profileGreeting() {
  const p = currentProfile(); if (!p) return '';
  return `<div class="greet">${avatarHtml(p, 44)}<div><div class="muted small">Welcome back</div><b style="font-size:18px">${esc(p.name || 'there')}</b></div></div>`;
}
function renderProfileBtn() {
  const b = $('#profileBtn'), p = currentProfile(), onPicker = view.name === 'profiles';
  document.querySelector('header nav').style.visibility = onPicker ? 'hidden' : '';
  if (!b) return;
  b.hidden = !p || onPicker;
  if (p) b.innerHTML = avatarHtml(p, 30);
  b.title = p ? `${p.name || 'My profile'}: profile menu` : '';
}
function toggleProfileMenu(force) {
  const m = $('#pmenu'), open = force ?? m.hidden;
  if (!open) { m.hidden = true; return; }
  const p = currentProfile(); if (!p) return;
  m.innerHTML = `<div class="pm-head">${avatarHtml(p, 40)}<div><b>${esc(p.name || 'My profile')}</b><div class="muted small">${S.cards.length} cards · ${S.decks.length} decks</div></div></div>
    <button type="button" data-act="editProfile">Edit profile</button>
    <button type="button" data-act="toggleLook" title="Switch the whole app between the playful and the professional design">${p.look === 'pro' ? '🎈 Switch to the Fun look' : '💼 Switch to the Professional look'}</button>
    <button type="button" data-act="customizeAvatar">🎨 ${p.avatarCfg ? 'Customize avatar' : 'Create an avatar'}</button>
    ${profiles.list.length > 1 ? '<button type="button" data-act="switchProfile">Switch profile</button>' : ''}
    <button type="button" data-act="newProfile">Add a profile</button>
    ${p.pin ? '<button type="button" data-act="lockApp">Lock 🔒</button>' : ''}`;
  m.hidden = false;
}
document.addEventListener('click', e => {
  const m = $('#pmenu'); if (!m || m.hidden) return;
  if (!e.target.closest('#pmenu') && !e.target.closest('#profileBtn')) m.hidden = true;
  else if (e.target.closest('#pmenu button')) setTimeout(() => { m.hidden = true; }, 0);
}, true);

Object.assign(actions, {
  enterProfile: el => enterProfile(el.dataset.id),
  newProfile: () => profileDialog(null),
  editProfile: () => profileDialog(currentProfile()),
  switchProfile: () => lockApp(),
  lockApp: () => lockApp(),
  profileMenu: () => toggleProfileMenu(),
  toggleLook: () => toggleLook(),
});
