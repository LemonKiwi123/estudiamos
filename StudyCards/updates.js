'use strict';
/* ================= Updates (Settings → 🔄 Updates, and a note on the home screen) =================
   The real work happens in the PC's server (updater.js). This screen asks it to check, update, update from a file,
   or go back to the previous version, and shows how it's going. Phones and tablets get the new version from the PC by themselves. */
let updInfo = null, updWatching = false;
const updOnPC = () => typeof SYNC !== 'undefined' && SYNC.enabled && SYNC.local && !SYNC_FILE;
const UPD_STAGE = { download: 'Downloading the update…', check: 'Checking that the update is genuine…', backup: 'Backing up your cards…', restarting: 'Restarting Estudiamos… (about 30 seconds)' };

function updSettingsHtml() {
  return `<section class="panel" id="updPanel"><h3>🔄 Updates</h3><div id="updBody">${updOnPC() ? '<p class="muted small">Loading…</p>'
    : `<p class="muted small" style="margin:0">Estudiamos ${esc(APP_VERSION)}. Phones and tablets get new versions from your PC by themselves.</p>`}</div></section>`;
}
function updBanner() {
  const a = updInfo?.available; if (!a || !updOnPC() || updInfo.job) return '';
  return `<div class="banner"><span>🎉 <b>Estudiamos ${esc(a.version)}</b> is ready to install.</span><button type="button" class="btn sm primary" data-act="updOpen">See what’s new</button></div>`;
}
function updBodyHtml() {
  const u = updInfo; if (!u) return '<p class="muted small">Loading…</p>';
  const when = u.lastCheck ? new Date(u.lastCheck).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'not yet';
  const j = u.job, busy = j && j.stage !== 'failed';
  if (busy) return `<div class="upd-run"><b>${esc(UPD_STAGE[j.stage] || 'Working…')}</b>${j.version ? ` <span class="muted small">(version ${esc(j.version)})</span>` : ''}
      <div class="upd-bar"><i style="width:${j.stage === 'download' ? j.pct || 2 : j.stage === 'check' ? 70 : j.stage === 'backup' ? 85 : 100}%"></i></div>
      <div class="muted small">Please keep this window open. Your cards are safe.</div></div>`;
  return `
    ${j?.stage === 'failed' ? `<div class="banner" style="margin:0 0 10px"><span>⚠️ The update didn’t happen: ${esc(j.error || '')}</span><button type="button" class="btn sm" data-act="updAck">OK</button></div>` : ''}
    <div class="set-row"><div><b>Estudiamos ${esc(u.current)}</b><div class="muted small">${u.hasFeed ? `Last checked: ${esc(when)}` : 'This copy has no update address, so it can’t check by itself. Use “Update from file”.'}</div></div>
      <div class="ctl"><button type="button" class="btn" data-act="updCheck" ${u.hasFeed ? '' : 'disabled'}>Check for updates</button></div></div>
    ${u.available ? `<div class="upd-new"><div class="row-between"><b>🎉 Version ${esc(u.available.version)} is ready</b>${u.available.date ? `<span class="muted small">${esc(u.available.date)}</span>` : ''}</div>
      ${u.available.notes ? `<div class="upd-notes">${esc(u.available.notes)}</div>` : ''}
      <div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn primary" data-act="updInstall">Update now</button>
      <span class="muted small">Takes about 30 seconds. Your cards are backed up first.</span></div></div>` : ''}
    <div class="set-row"><div><b>Update from file</b><div class="muted small">Downloaded a new Estudiamos .zip yourself? Pick it here. It’s checked the same way.</div></div>
      <div class="ctl"><button type="button" class="btn" data-act="updFile">Choose .zip…</button><input type="file" id="updFileInput" accept=".zip,application/zip" hidden></div></div>
    ${u.previous && u.previous !== u.current ? `<div class="set-row"><div><b>Go back to version ${esc(u.previous)}</b><div class="muted small">If something isn’t right after an update. Your cards stay as they are.</div></div>
      <div class="ctl"><button type="button" class="btn" data-act="updRollback">Go back</button></div></div>` : ''}
    <div class="set-row"><div><b>Check automatically</b><div class="muted small">Once a day, and tell you when there’s a new version. It never installs without asking.</div></div>
      <div class="ctl"><input type="checkbox" id="updAuto" ${u.autoCheck ? 'checked' : ''} ${u.hasFeed ? '' : 'disabled'} style="width:18px;height:18px;accent-color:var(--accent)"></div></div>
    ${u.canVerify ? '' : '<p class="muted small">⚠️ This copy has no update key, so updates can’t be checked. Install the next version by hand.</p>'}
    ${u.windows ? '' : '<p class="muted small">Automatic updating works on Windows. On this computer, replace the StudyCards folder by hand.</p>'}`;
}
function updRender() { const box = $('#updBody'); if (box) box.innerHTML = updBodyHtml(); }
async function updGet() { updInfo = await syncGetJson('/api/update/status'); return updInfo; }
async function updFill() {
  const box = $('#updBody'); if (!box || box.dataset.filled || !updOnPC()) return;
  box.dataset.filled = '1';
  try { await updGet(); } catch { box.innerHTML = '<p class="muted small">Couldn’t reach the updater. Is Estudiamos running from the desktop shortcut?</p>'; return; }
  updRender(); updShowResult();
  if (updInfo.job && updInfo.job.stage !== 'failed') updWatch();
}
// after a restart: say how it went (once)
function updShowResult() {
  const r = updInfo?.result; if (!r) return;
  if (r.ok) toast(r.mode === 'rollback' ? `↩️ You’re back on Estudiamos ${r.version || ''}` : `✅ Updated to Estudiamos ${r.version || ''}!`);
  else toast(`⚠️ The update didn’t finish, so nothing changed. (${r.message || 'unknown problem'})`);
  syncPost('/api/update/ack', {}).then(s => { updInfo = s; updRender(); }).catch(() => {});
}
// follow an update while it runs, then wait for the new server and reload
async function updWatch() {
  if (updWatching) return; updWatching = true;
  const from = updInfo?.current;
  try {
    for (let i = 0; i < 900; i++) {   // up to 15 minutes for a slow download
      await new Promise(r => setTimeout(r, 800));
      let s; try { s = await updGet(); } catch { break; }   // server went away: it's restarting
      updRender();
      if (!s.job || s.job.stage === 'failed') return;
      if (s.job.stage === 'restarting') break;
    }
    // wait for the server to come back (with the new version, or the old one if the swap failed and was undone)
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 1000));
      try { const p = await syncFetch('/api/ping', {}, 2500).then(r => r.json()); if (p.version && (p.version !== from || i > 20)) break; } catch {}
    }
    try { const reg = await navigator.serviceWorker?.getRegistration(); await reg?.update(); } catch {}
    location.reload();
  } finally { updWatching = false; }
}
async function updStart(path, body, headers) {
  try {
    const r = await syncFetch(path, { method: 'POST', headers: headers || syncHeaders(true), body: body ?? '{}' }, 120000);
    const s = await r.json(); if (!r.ok) throw new Error(s.error || r.status);
    updInfo = s; updRender(); updWatch();
  } catch (e) { toast('⚠️ ' + (e.message || e)); }
}
async function updBoot() {   // on the PC: notice updates for the home screen, and report a finished update
  if (!updOnPC()) return;
  try { await updGet(); } catch { return; }
  updShowResult();
  if (updInfo.available && view.name === 'home') render();
  setTimeout(async () => { const had = updInfo?.available?.version; try { await updGet(); } catch { return; } if (updInfo.available?.version !== had && view.name === 'home') render(); }, 20000);   // the daily check runs in the background
}
Object.assign(actions, {
  updOpen: () => { go({ name: 'settings' });   // scroll down once the panels above have loaded (they change height)
    let n = 0; const t = setInterval(() => { const p = $('#updPanel'); if (p && $('#syncStatusLine') || ++n > 20) { clearInterval(t); setTimeout(() => $('#updPanel')?.scrollIntoView({ block: 'start' }), 250); } }, 150); },
  updCheck: async el => {
    el.disabled = true; el.textContent = 'Checking…';
    try { const s = await syncPost('/api/update/check', {}); updInfo = s; if (s.checkError) toast('⚠️ ' + s.checkError); else if (!s.available) toast(`👍 You have the newest version (${s.current})`); }
    catch (e) { toast('⚠️ Couldn’t check: ' + e.message); }
    updRender(); if (view.name === 'home') render();
  },
  updInstall: () => { const a = updInfo?.available; if (!a) return;
    openDialog({ title: `Update to Estudiamos ${a.version}?`, ok: 'Update now', body: `<p style="margin:0">Estudiamos backs up your cards, installs the new version and restarts. It takes about 30 seconds. Phones get the new version the next time they connect.</p>`,
      onOk: () => { updStart('/api/update/install'); } }); },
  updFile: () => {
    const inp = $('#updFileInput'); if (!inp) return;
    inp.onchange = async () => {
      const f = inp.files?.[0]; inp.value = ''; if (!f) return;
      if (f.size > 55e6) return toast('⚠️ That file is too big to be an Estudiamos update.');
      toast('Checking the file…');
      updStart('/api/update/upload', await f.arrayBuffer(), { ...syncHeaders(false), 'Content-Type': 'application/zip' });
    };
    inp.click();
  },
  updRollback: () => { const v = updInfo?.previous; if (!v) return;
    confirmDlg(`Go back to version ${v}?`, `Estudiamos restarts with version ${v}. Your cards stay as they are (they're backed up first, too).`, 'Go back', () => updStart('/api/update/rollback')); },
  updAck: () => syncPost('/api/update/ack', {}).then(s => { updInfo = s; updRender(); }).catch(() => {}),
});
document.addEventListener('change', e => {
  if (e.target.id === 'updAuto') syncPost('/api/update/settings', { autoCheck: e.target.checked }).then(s => { updInfo = s; toast(e.target.checked ? 'Estudiamos will check for updates once a day' : 'Automatic checks are off'); }).catch(() => {});
});
