'use strict';
/* ================= Phone & PC sync (app side) =================
   When Estudiamos is opened from the PC server (http://localhost:5178 on the PC, or the PC's address on a phone),
   every device keeps its own full copy of the data and works offline. Changes are merged record by record
   (see syncmerge.js): edits to different cards both survive, counters like peanuts add up, deletions stick.
   Changes wait in a queue while the PC can't be reached and go through automatically later. */
const SYNC = {
  enabled: false, base: '', meta: null, baseMap: {}, pts: {}, mbase: {}, mhash: {}, mdirty: new Set(),
  status: 'off', detail: '', pending: 0, lastOk: 0, inflight: false, again: false, es: null,
  needsRender: false, timer: null, mtimer: null, minflight: false, local: false, migrateNonce: null,
};
const SYNC_FILE = location.protocol === 'file:';
const syncUrl = p => SYNC.base + p;
const kvGet = k => idbDo('kv', 'readonly', st => st.get(k));
const kvPut = (k, v) => idbDo('kv', 'readwrite', st => st.put(v, k));
const kvDel = k => idbDo('kv', 'readwrite', st => st.delete(k));
function syncHeaders(json) { const h = {}; if (json) h['Content-Type'] = 'application/json'; if (SYNC.meta?.token) h['X-Estudiar-Token'] = SYNC.meta.token; return h; }
async function syncFetch(path, opts = {}, timeout = 15000) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(syncUrl(path), { cache: 'no-store', ...opts, signal: ctl.signal });
    if (!r.ok) { let msg = r.status; try { msg = (await r.json()).error || msg; } catch {} const e = new Error(msg); e.status = r.status; throw e; }
    return r;
  } finally { clearTimeout(t); }
}
const syncPost = (path, body) => syncFetch(path, { method: 'POST', headers: syncHeaders(true), body: JSON.stringify(body) }).then(r => r.json());
const syncGetJson = path => syncFetch(path, { headers: syncHeaders() }).then(r => r.json());
function syncDeviceGuess() {
  const ua = navigator.userAgent;
  if (/iPad|Macintosh.*Mobile/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad';
  if (/iPhone/.test(ua)) return 'iPhone'; if (/Android/.test(ua)) return 'Android'; if (/Mac/.test(ua)) return 'Mac'; return 'Device';
}

/* ---------- PIN hashing without crypto.subtle (phones on plain http) ---------- */
function sha256Hex(str) {
  const K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  const bytes = new TextEncoder().encode(str), l = bytes.length, n = ((l + 9 + 63) >> 6) << 6, m = new Uint8Array(n);
  m.set(bytes); m[l] = 0x80; const dv = new DataView(m.buffer); dv.setUint32(n - 4, l * 8); dv.setUint32(n - 8, Math.floor(l / 0x20000000));
  let h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const w = new Uint32Array(64), r = (x, k) => (x >>> k) | (x << (32 - k));
  for (let o = 0; o < n; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) { const s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (r(e, 6) ^ r(e, 11) ^ r(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0, t2 = ((r(a, 2) ^ r(a, 13) ^ r(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h = h.map((x, i) => (x + [a, b, c, d, e, f, g, hh][i]) | 0);
  }
  return h.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
}
if (!(window.crypto && crypto.subtle)) window.hashPin = async (pin, salt) => sha256Hex(salt + ':' + pin);

/* ---------- Start-up (called from boot() before profiles load) ---------- */
async function syncBoot() {
  if (SYNC_FILE) { SYNC.migrateNonce = new URLSearchParams(location.search).get('migrate'); return; }
  SYNC.base = location.origin;
  SYNC.meta = (await kvGet('sync:meta')) || { token: null, deviceName: '', seq: 0, mseq: 0, joined: false };
  SYNC.baseMap = (await kvGet('sync:base')) || {};
  SYNC.pts = (await kvGet('sync:pts')) || {};
  SYNC.mbase = (await kvGet('sync:mbase')) || {};
  SYNC.mhash = (await kvGet('sync:mhash')) || {};
  let ping = null;
  try { ping = await syncGetJson('/api/ping'); } catch {}
  if (ping && ping.app !== 'estudiar') ping = null;
  if (!ping && !SYNC.meta.token && !SYNC.meta.joined) return;   // not served by the Estudiamos server: no sync
  SYNC.local = !!ping?.local;
  // A connect link (from the QR code or the email) carries the code after "#pair=": connect without typing
  const linkCode = (location.hash.match(/[#&]pair=(\d{6})/) || [])[1];
  if (linkCode) try { history.replaceState(null, '', location.pathname + location.search); } catch {}
  if (ping && !ping.paired) {
    SYNC.meta.token = null;
    let ok = false;
    if (linkCode) try { await syncPairWith(linkCode, syncDeviceGuess()); ok = true; } catch (e) { SYNC.linkError = e.message; }
    if (!ok && !(await syncPairDialog(linkCode))) return;
  } else if (linkCode && ping?.paired) setTimeout(() => toast('This device is already connected to your PC ✓'), 800);
  SYNC.enabled = true;
  // A new device takes the PC's profiles. That includes a device that only has the blank profile made when the app was first opened.
  if (ping && !SYNC.meta.joined) {
    const reg = await kvGet('profiles'); let blank = true;
    for (const p of reg?.list || []) if (!syncIsPlaceholder(p, await kvGet('state:' + p.id))) { blank = false; break; }
    if (blank) { try { if (await syncAdopt()) for (const p of reg?.list || []) await kvDel('state:' + p.id); } catch (e) { console.error(e); } }
  }
}
/* The blank profile the app makes on first start: no name, PIN or picture, and nothing studied yet */
function syncIsPlaceholder(p, st) {
  if (!p || p.name || p.pin || p.avatar) return false;
  if (!st) return true;
  if (st.rewards?.points || st.rewards?.peanuts || (st.history || []).length) return false;
  if (st.log && Object.keys(st.log).length) return false;
  if ((st.decks || []).length > 1 || (st.cards || []).length > 40) return false;
  return !(st.cards || []).some(c => (c.reps || 0) > 0 || (c.state && c.state !== 'new'));
}
/* If a blank profile ended up next to real ones (a device connected after making its own), remove it everywhere */
async function syncDropPlaceholders(others) {
  if (profiles.list.length < 2) return false;
  const st = p => p.id === currentProfileId ? S : others[p.id];
  const drop = profiles.list.filter(p => syncIsPlaceholder(p, st(p)) && (p.id === currentProfileId || others[p.id] !== undefined));
  if (!drop.length || drop.length === profiles.list.length) return false;
  for (const p of drop) {
    profiles.list.splice(profiles.list.indexOf(p), 1); delete others[p.id];
    try { await kvDel('state:' + p.id); } catch {}
    if (p.id === currentProfileId) { currentProfileId = null; study = null; quiz = null; game = null; view = { name: 'profiles' }; closeDialogIfOpen(); }
  }
  delete profiles.setup;
  if (!profiles.list.some(p => p.id === profiles.lastId)) profiles.lastId = profiles.list[0].id;
  await saveProfiles();
  SYNC.needsRender = true; syncRefresh();
  return true;
}
function closeDialogIfOpen() { const d = document.getElementById('dlg'); if (d?.open) try { d.close(); } catch {} }
function syncAfterBoot() {
  if (SYNC_FILE) {
    if (SYNC.migrateNonce) syncMigrateFromFile(SYNC.migrateNonce);
    else { let moved = false; try { moved = localStorage.getItem('estudiar.movedToServer') === '1'; } catch {}
      if (moved) { const bar = document.createElement('div'); bar.className = 'banner'; bar.style.cssText = 'position:sticky;top:0;z-index:20;margin:0;border-radius:0';
        bar.innerHTML = '<span>⚠️ This is the old copy of Estudiamos. Your decks now live in the new one, which syncs with your phone. Changes made here won’t be kept there.</span><a class="btn sm primary" href="http://localhost:5178/">Open the new Estudiamos</a>';
        document.body.prepend(bar); } }
    return;
  }
  if (!SYNC.enabled) return;
  syncListen();
  setInterval(() => syncNow(), 20000);
  setInterval(() => { if (SYNC.needsRender && syncSafeToRender()) { SYNC.needsRender = false; render(); } }, 1500);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { syncNow(); if (!SYNC.es || SYNC.es.readyState === 2) syncListen(); } else syncNow(); });
  window.addEventListener('online', () => { syncNow(); syncListen(); });
  syncNow().then(() => syncMediaNow());
  renderSyncChip();
}
function syncSaveMeta() { return kvPut('sync:meta', SYNC.meta); }
async function syncSaveAll() { await kvPut('sync:meta', SYNC.meta); await kvPut('sync:base', SYNC.baseMap); await kvPut('sync:pts', SYNC.pts); }

/* ---------- Pairing (phones and tablets) ---------- */
async function syncPairWith(code, name) {
  const r = await syncFetch('/api/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, name }) }).then(r => r.json());
  SYNC.meta.token = r.token; SYNC.meta.deviceName = name; await syncSaveMeta();
  setTimeout(() => toast('Connected to your PC! 🎉'), 600);
}
async function syncPairWithPassword(password, name) {
  const r = await syncFetch('/api/pair-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, name }) }).then(r => r.json());
  SYNC.meta.token = r.token; SYNC.meta.deviceName = name; await syncSaveMeta();
  setTimeout(() => toast('Connected to your PC! 🎉'), 600);
}
async function syncPairDialog(prefill = '') {
  let pwOn = false, mailOn = false;
  try { const pg = await syncGetJson('/api/ping'); pwOn = !!pg.pw; mailOn = !!pg.mail; } catch {}
  return new Promise(resolve => {
    let done = false, way = pwOn && !prefill ? 'pw' : 'code';
    openDialog({
      title: '📱 Connect to Estudiamos on your PC',
      body: `<div style="display:flex;justify-content:center">${typeof mascot === 'function' ? mascot(70) : ''}</div>
        ${SYNC.linkError ? `<div class="banner" style="margin:0"><span>That connect link didn’t work: ${esc(SYNC.linkError)} Make a new code on your PC and scan or type it${pwOn ? ', or use your connect password' : ''}.</span></div>` : ''}
        ${pwOn ? `<div class="seg" style="margin:0"><label><input type="radio" name="way" value="pw" ${way === 'pw' ? 'checked' : ''}>🔑 Connect password</label><label><input type="radio" name="way" value="code" ${way === 'code' ? 'checked' : ''}>🔢 Code from the PC</label></div>` : ''}
        <div data-way="pw" ${way === 'pw' ? '' : 'hidden'} class="stack" style="gap:8px">
          <p style="margin:0">Type the connect password you set on your PC (Settings → Phone & sync).</p>
          <label class="field">Connect password<input name="pw" type="password" autocomplete="current-password" maxlength="200"></label>
        </div>
        <div data-way="code" ${way === 'code' ? '' : 'hidden'} class="stack" style="gap:8px">
          <p style="margin:0">On your PC open Estudiamos, go to <b>Settings → Phone & sync</b> and click <b>Connect a phone or tablet</b>. Then scan the QR code with your camera, or type the 6-digit code here.</p>
          <label class="field">Code<input name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]*" value="${esc(prefill)}" style="font-size:26px;letter-spacing:8px;text-align:center"></label>
          ${mailOn ? `<div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn" id="mailMeBtn">📧 Email me a code</button><span class="muted small" id="mailMeMsg">Not near your PC? It can email you a new code.</span></div>` : ''}
        </div>
        <label class="field">Name for this device<input name="dname" maxlength="40" value="${esc(syncDeviceGuess())}"></label>
        <p class="muted small" style="margin:0">Your decks and progress will be copied to this device and kept in sync.</p>`,
      ok: 'Connect',
      onOpen: dlg => {
        const focus = () => setTimeout(() => dlg.querySelector(way === 'pw' ? '[name=pw]' : '[name=code]')?.focus(), 60);
        dlg.querySelectorAll('[name=way]').forEach(r => r.addEventListener('change', () => {
          way = r.value; dlg.querySelectorAll('[data-way]').forEach(s => { s.hidden = s.dataset.way !== way; }); focus();
        }));
        focus();
        const mb = dlg.querySelector('#mailMeBtn');
        if (mb) mb.onclick = async () => {
          const msg = dlg.querySelector('#mailMeMsg'); mb.disabled = true; msg.textContent = 'Asking your PC to send the email…';
          try {
            const r = await syncFetch('/api/pair/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }, 40000).then(x => x.json());
            msg.innerHTML = `✅ Sent to <b>${esc(r.to)}</b>. Open the email and type the code here (or tap its link). It works for 10 minutes.`;
            setTimeout(() => { mb.disabled = false; }, 60000);
            dlg.querySelector('[name=code]')?.focus();
          } catch (e) { mb.disabled = false; msg.textContent = e.message || 'The PC couldn’t send the email.'; }
        };
        dlg.addEventListener('close', () => { if (!done) { done = true; resolve(false); } }, { once: true });
      },
      onOk: f => {
        const name = f.dname.value.trim() || syncDeviceGuess();
        let job;
        if (way === 'pw') { if (!f.pw.value) { toast('Type your connect password'); return false; } job = syncPairWithPassword(f.pw.value, name); }
        else { const code = f.code.value.replace(/\D/g, ''); if (code.length !== 6) { toast('Type the 6-digit code from your PC'); return false; } job = syncPairWith(code, name); }
        job.then(() => { done = true; $('#dlg').close(); resolve(true); })
          .catch(e => { toast(e.message || 'Could not connect'); if (way === 'pw') { f.pw.value = ''; f.pw.focus(); } });
        return false;
      },
    });
  });
}

/* ---------- First time on a new device: copy everything from the PC ---------- */
async function syncAdopt() {
  const r = await syncPost('/api/sync', { since: 0, now: Date.now(), changes: [] });
  const keys = Object.keys(r.records).filter(k => !r.records[k].del);
  if (!keys.some(k => k.startsWith('["P"'))) return false;   // nothing on the PC yet: this device's data will be uploaded instead
  const reg = { list: [], lastId: null }, states = {}, finalMap = {};
  keys.forEach(k => finalMap[k] = r.records[k].v);
  SyncCore.applyOps(keys.map(k => ({ key: k, v: r.records[k].v })), SyncCore.hasChecker(finalMap), info => info.scope === 'P' ? reg : (states[info.pid] ||= {}));
  for (const [pid, st] of Object.entries(states)) await kvPut('state:' + pid, st);
  reg.lastId = reg.list[0]?.id || null;
  await kvPut('profiles', reg);
  SYNC.baseMap = {};
  for (const k of keys) { const i = SyncCore.splitKey(k); if (!SyncCore.isLocalOnly(i.scope, i.rp)) SYNC.baseMap[k] = JSON.stringify(r.records[k].v); }
  SYNC.pts = {}; SYNC.meta.seq = r.seq; SYNC.meta.joined = true; SYNC.meta.dbId = r.db;
  await syncSaveAll();
  try { await syncMediaNow(true); } catch (e) { console.error(e); }
  return true;
}

/* ---------- Collect the local data as records ---------- */
async function syncLoadOthers() {
  const others = {};
  for (const p of profiles.list) if (p.id !== currentProfileId) others[p.id] = (await kvGet('state:' + p.id)) || null;
  return others;
}
function syncFlatten(others) {
  const states = {};
  for (const [pid, st] of Object.entries(others)) if (st) states[pid] = st;
  if (currentProfileId) states[currentProfileId] = S;
  return SyncCore.flattenAll(profiles, states, false);
}
function syncDiff(local, others) {
  const b = SYNC.baseMap, pts = SYNC.pts, now = Date.now(), regIds = new Set(profiles.list.map(p => p.id)), changed = new Map();
  for (const k in local) { const s = JSON.stringify(local[k]); if (b[k] !== s) changed.set(k, s); }
  for (const k in b) if (!(k in local)) {
    const i = SyncCore.splitKey(k);
    if (i.scope === 'S' && regIds.has(i.pid) && i.pid !== currentProfileId && !others[i.pid]) continue;   // couldn't read that profile right now: don't treat as deleted
    changed.set(k, undefined);
  }
  for (const k of changed.keys()) pts[k] ||= now;
  for (const k in pts) if (!changed.has(k)) delete pts[k];
  const changes = [];
  for (const [k, s] of changed) {
    const i = SyncCore.splitKey(k), mode = SyncCore.modeFor(i.scope, i.rp), v = local[k];
    if (s !== undefined && mode === 'add' && typeof v === 'number') {
      if (!SYNC.meta.joined) changes.push({ k, op: 'max', v });
      else { const bv = b[k] !== undefined ? JSON.parse(b[k]) : 0; changes.push({ k, op: 'add', d: v - (typeof bv === 'number' ? bv : 0) }); }
    } else if (s !== undefined && mode === 'max' && typeof v === 'number') changes.push({ k, op: 'max', v });
    else changes.push(s !== undefined ? { k, v, ts: pts[k] } : { k, del: true, ts: pts[k] });
  }
  return { changes, sentStr: Object.fromEntries(changed) };
}

function syncPendingCount() {   // count changed things (a card, a setting, a day's log), not every single field
  const groups = new Set();
  for (const k of Object.keys(SYNC.pts)) {
    try { const i = SyncCore.splitKey(k), j = i.rest.findIndex(x => x[0] === '#'); groups.add(JSON.stringify([...i.prefix, ...(j >= 0 ? i.rest.slice(0, j + 1) : i.rest.slice(0, 2))])); } catch {}
  }
  return groups.size;
}
/* ---------- One sync round: send my changes, receive everyone else's ---------- */
function syncSoon(ms = 1500) { if (!SYNC.enabled) return; clearTimeout(SYNC.timer); SYNC.timer = setTimeout(syncNow, ms); }
async function syncNow() {
  if (!SYNC.enabled || !window.idbReady) return;
  if (SYNC.inflight) { SYNC.again = true; return; }
  SYNC.inflight = true; clearTimeout(SYNC.timer);
  let changes = [];
  try {
    const others = await syncLoadOthers();
    if (SYNC.meta.joined) await syncDropPlaceholders(others);
    const local = syncFlatten(others), d = syncDiff(local, others);
    changes = d.changes;
    if (changes.length) syncSetStatus('syncing');
    const r = await syncPost('/api/sync', { since: SYNC.meta.seq, now: Date.now(), changes, db: SYNC.meta.dbId || (SYNC.meta.seq ? 'unknown' : undefined) });
    if (r.reset) {   // the PC's data folder is new or was replaced: send this device's whole copy again
      Object.assign(SYNC.meta, { dbId: r.db, seq: 0, joined: false }); SYNC.baseMap = {}; SYNC.pts = {}; SYNC.mbase = {};
      await syncSaveAll(); await kvPut('sync:mbase', {}); SYNC.again = true; return;
    }
    SYNC.meta.dbId = r.db;
    await syncMerge(r, d.sentStr, changes);
    SYNC.meta.seq = r.seq; SYNC.meta.joined = true; SYNC.lastOk = Date.now(); SYNC.pending = syncPendingCount();
    await syncSaveAll();
    syncSetStatus('ok');
  } catch (e) {
    SYNC.pending = syncPendingCount() || changes.length;
    if (e.status === 401) syncSetStatus('unpaired', 'This device was disconnected from the PC.');
    else syncSetStatus('offline', e.name === 'AbortError' ? 'The PC didn’t answer in time.' : 'Can’t reach your PC right now.');
    try { await kvPut('sync:pts', SYNC.pts); } catch {}
  } finally {
    SYNC.inflight = false;
    if (SYNC.again) { SYNC.again = false; syncSoon(300); }
  }
}
async function syncMerge(r, sentStr, changes) {
  const others = await syncLoadOthers();          // async reads first; everything below runs in one go
  const nowMap = syncFlatten(others), b = SYNC.baseMap, ops = [];
  let finalMap = null, regChanged = false;
  const touched = new Set();
  for (const [k, rec] of Object.entries(r.records)) {
    const i = SyncCore.splitKey(k);
    if (SyncCore.isSkipped(i.scope, i.rp, false)) continue;      // device-only values (like voices) stay as they are here
    const pend = k in sentStr ? sentStr[k] : b[k];
    const nowS = k in nowMap ? JSON.stringify(nowMap[k]) : undefined;
    const inFlight = nowS !== pend;                                  // changed here while we were talking to the PC
    const mode = SyncCore.modeFor(i.scope, i.rp);
    let fin = null;
    if (inFlight && mode === 'add' && !rec.del && typeof rec.v === 'number' && typeof nowMap[k] === 'number') {
      const pv = pend !== undefined ? JSON.parse(pend) : 0;
      fin = { v: rec.v + (nowMap[k] - (typeof pv === 'number' ? pv : 0)) };
    } else if (!inFlight) fin = rec.del ? { del: true } : { v: rec.v };
    if (rec.del) delete b[k]; else b[k] = JSON.stringify(rec.v);
    if (!inFlight) delete SYNC.pts[k];
    else SYNC.pts[k] = Date.now();   // changed again while we were talking to the PC: that newer value must not be sent with the old time, or the PC could keep the older one
    if (!fin) continue;
    const finS = fin.del ? undefined : JSON.stringify(fin.v);
    if (finS === nowS) continue;
    finalMap ||= { ...nowMap };
    if (fin.del) delete finalMap[k]; else finalMap[k] = fin.v;
    ops.push({ key: k, del: !!fin.del, v: fin.v });
    if (i.scope === 'P') regChanged = true; else touched.add(i.pid);
  }
  for (const c of changes) if (!(c.k in r.records)) {               // e.g. deleting something the PC never had
    const nowS = c.k in nowMap ? JSON.stringify(nowMap[c.k]) : undefined;
    if (nowS === sentStr[c.k]) { if (nowS === undefined) delete b[c.k]; else b[c.k] = nowS; delete SYNC.pts[c.k]; }
  }
  if (!ops.length) return;
  const deletedRoots = new Set();
  const parsed = SyncCore.applyOps(ops, SyncCore.hasChecker(finalMap), (info, create) => {
    if (info.scope === 'P') return profiles;
    if (info.pid === currentProfileId) return S;
    if (!others[info.pid]) { if (!create) return null; others[info.pid] = {}; }
    return others[info.pid];
  });
  for (const o of parsed) if (o.info.rootDeleted) deletedRoots.add(o.info.pid);
  for (const pid of touched) {
    if (pid === currentProfileId) continue;
    if (deletedRoots.has(pid)) await kvDel('state:' + pid); else if (others[pid]) await kvPut('state:' + pid, others[pid]);
  }
  if (touched.has(currentProfileId)) {
    if (typeof migrate === 'function') migrate(S);
    idbSaveState();
    try { localStorage.setItem(LS_KEY + ':' + currentProfileId, JSON.stringify(S)); } catch {}
  }
  if (regChanged) {
    await saveProfiles();
    if (currentProfileId && !profiles.list.some(p => p.id === currentProfileId)) { currentProfileId = null; view = { name: 'profiles' }; SYNC.needsRender = true; }
  }
  if (touched.has(currentProfileId) || regChanged) syncRefresh();
}
function syncSafeToRender() {
  if ($('#dlg')?.open) return false;
  if (typeof PLAYING !== 'undefined' && PLAYING.includes(view.name)) return false;
  const a = document.activeElement;
  if (a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) return false;
  return true;
}
function syncRefresh() { if (syncSafeToRender()) render(); else SYNC.needsRender = true; }

/* ---------- Pictures (card images, profile photos, backgrounds) ---------- */
function syncMediaSoon(ms = 1200) { if (!SYNC.enabled) return; clearTimeout(SYNC.mtimer); SYNC.mtimer = setTimeout(() => syncMediaNow(), ms); }
for (const [name, keyOf] of [['putMedia', null], ['putAvatar', a => 'avatar:' + a[0]], ['putBackground', a => 'bg:' + a[0]], ['removeBackground', a => 'bg:' + a[0]]]) {
  const f = window[name]; if (typeof f !== 'function') continue;
  window[name] = async function (...a) { const r = await f.apply(this, a); if (keyOf) SYNC.mdirty.add(keyOf(a)); syncMediaSoon(); return r; };
}
async function syncMediaLocal() {
  const keys = await idbDo('media', 'readonly', st => st.getAllKeys()), idx = {};
  for (const k of keys) {
    let c = SYNC.mhash[k];
    if (!c || SYNC.mdirty.has(k)) {
      const b = await idbDo('media', 'readonly', st => st.get(k)); if (!b) continue;
      c = { size: b.size, type: b.type, h: SyncCore.fnvHash(new Uint8Array(await b.arrayBuffer())) }; SYNC.mhash[k] = c;
    }
    idx[k] = c;
  }
  for (const k of Object.keys(SYNC.mhash)) if (!keys.includes(k)) delete SYNC.mhash[k];
  SYNC.mdirty.clear();
  return idx;
}
async function syncMediaNow(quiet) {
  if (!SYNC.enabled || SYNC.minflight) return;
  SYNC.minflight = true;
  let ui = false;
  try {
    const local = await syncMediaLocal(), srv = (await syncGetJson('/api/media')).index || {}, mb = SYNC.mbase;
    for (const k of new Set([...Object.keys(local), ...Object.keys(srv), ...Object.keys(mb)])) {
      const c = local[k], s = srv[k] && !srv[k].del ? srv[k] : null, base = mb[k];
      if (c && s && c.h === s.h) { mb[k] = c.h; continue; }
      if (c && (!s ? !(srv[k]?.del && c.h === base) : s.h === base)) {                       // new or changed here → send it
        const blob = await idbDo('media', 'readonly', st => st.get(k));
        await syncFetch(`/api/media/${encodeURIComponent(k)}?h=${c.h}&ts=${Date.now()}`, { method: 'PUT', headers: { ...syncHeaders(), 'Content-Type': blob.type || 'application/octet-stream' }, body: blob }, 60000);
        mb[k] = c.h;
      } else if (!c && base && s && s.h === base) {                                         // removed here → remove on the PC
        await syncFetch(`/api/media/${encodeURIComponent(k)}`, { method: 'DELETE', headers: syncHeaders() });
        delete mb[k];
      } else if (s) {                                                                        // new or changed elsewhere → fetch it
        const blob = await (await syncFetch(`/api/media/${encodeURIComponent(k)}`, { headers: syncHeaders() }, 60000)).blob();
        await idbDo('media', 'readwrite', st => st.put(blob, k));
        const old = mediaURL.get(k); if (old) URL.revokeObjectURL(old);
        mediaURL.set(k, URL.createObjectURL(blob));
        SYNC.mhash[k] = { size: blob.size, type: blob.type, h: s.h }; mb[k] = s.h; ui = true;
      } else if (c && srv[k]?.del && c.h === base) {                                         // removed elsewhere
        await idbDo('media', 'readwrite', st => st.delete(k));
        const old = mediaURL.get(k); if (old) URL.revokeObjectURL(old); mediaURL.delete(k);
        delete SYNC.mhash[k]; delete mb[k]; ui = true;
      }
    }
    await kvPut('sync:mbase', mb); await kvPut('sync:mhash', SYNC.mhash);
  } catch (e) { if (!quiet) console.warn('Picture sync:', e.message); }
  finally { SYNC.minflight = false; }
  if (ui) { if (typeof applyScene === 'function') applyScene(); syncRefresh(); }
}

/* ---------- Instant updates from the PC ---------- */
function syncListen() {
  if (!window.EventSource || !SYNC.enabled) return;
  try { SYNC.es?.close(); } catch {}
  const es = new EventSource(syncUrl('/api/events') + (SYNC.meta.token ? '?token=' + encodeURIComponent(SYNC.meta.token) : ''));
  es.onmessage = e => {
    try {
      const m = JSON.parse(e.data);
      if (m.seq > SYNC.meta.seq) syncSoon(80);
      if ((m.mseq || 0) !== (SYNC.meta.mseq || 0)) { SYNC.meta.mseq = m.mseq || 0; syncMediaSoon(300); }
    } catch {}
  };
  es.onopen = () => { if (SYNC.status === 'offline') syncNow(); };
  SYNC.es = es;
}

/* ---------- Status chip in the header ---------- */
function syncSetStatus(s, detail = '') { SYNC.status = s; SYNC.detail = detail; renderSyncChip(); const p = $('#syncStatusLine'); if (p) p.innerHTML = syncStatusText(); }
function syncStatusText() {
  const when = SYNC.lastOk ? new Date(SYNC.lastOk).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  switch (SYNC.status) {
    case 'ok': return `✅ Everything is synced${when ? ` (${when})` : ''}.`;
    case 'syncing': return '🔄 Syncing…';
    case 'offline': return `📴 ${esc(SYNC.detail)} ${SYNC.pending ? `<b>${SYNC.pending}</b> change${SYNC.pending === 1 ? '' : 's'} waiting. They’ll sync automatically.` : 'Your changes are saved on this device.'}`;
    case 'unpaired': return `🔗 ${esc(SYNC.detail || 'Not connected.')}`;
    default: return 'Sync is off.';
  }
}
function renderSyncChip() {
  let el = $('#syncChip');
  if (!SYNC.enabled) { el?.remove(); return; }
  if (!el) {
    const anchor = $('#streakBtn'); if (!anchor) return;
    el = document.createElement('button'); el.type = 'button'; el.id = 'syncChip'; el.className = 'sync-chip'; el.dataset.act = 'syncChip';
    anchor.parentNode.insertBefore(el, anchor);
  }
  const icon = { ok: '✓', syncing: '⟳', offline: '⚠', unpaired: '🔗' }[SYNC.status] || '⟳';
  el.className = 'sync-chip ' + SYNC.status;
  el.innerHTML = `<span class="ic">${icon}</span>${SYNC.status === 'offline' && SYNC.pending ? `<span>${SYNC.pending}</span>` : ''}`;
  el.title = syncStatusText().replace(/<[^>]+>/g, '');
}

/* ---------- Settings → Phone & sync ---------- */
function syncSettingsHtml() {
  return `<section class="panel" id="syncPanel"><div class="row-between"><h3 style="margin:0">📱 Phone & sync</h3><button type="button" class="btn sm" data-act="phoneGuide" title="Step-by-step: connect your phone at home or anywhere with Tailscale">📖 Setup guide</button></div><div id="syncPanelBody"><p class="muted small">Loading…</p></div></section>`;
}
let syncInfoCache = null;
async function syncFillPanel() {
  const box = $('#syncPanelBody'); if (!box || box.dataset.filled) return;
  box.dataset.filled = '1';
  try { await syncFillPanelInner(box); } catch (e) { console.error(e); box.innerHTML = `<p class="muted small">Couldn’t show sync details: ${esc(e.message)}</p>`; }
}
async function syncFillPanelInner(box) {
  if (SYNC_FILE) { box.innerHTML = `<p class="muted small" style="margin:0">This window was opened straight from the app file, so syncing is off. Start Estudiamos with the <b>desktop shortcut</b> to use it on your phone too.</p>`; return; }
  if (!SYNC.enabled) { box.innerHTML = `<p class="muted small" style="margin:0">Sync is off on this device.</p>${SYNC.base ? '<button type="button" class="btn" data-act="syncPair">Connect to my PC</button>' : ''}`; return; }
  const offlineOk = window.isSecureContext && 'serviceWorker' in navigator;
  const status = `<div class="set-row"><div><b>Status</b><div class="muted small" id="syncStatusLine">${syncStatusText()}</div></div><div class="ctl"><button type="button" class="btn" data-act="syncNowBtn">🔄 Sync now</button></div></div>`;
  if (!SYNC.local) {
    box.innerHTML = `${status}
      <div class="set-row"><div><b>This device</b><div class="muted small">${esc(SYNC.meta.deviceName || syncDeviceGuess())} · connected to your PC</div></div><div class="ctl"><button type="button" class="btn ghost" style="color:var(--again)" data-act="syncForget">Disconnect</button></div></div>
      <p class="muted small" style="margin:6px 0 0">${offlineOk ? '✈️ Works offline: open it any time, and changes sync when your PC is reachable again.' : '💡 Your data is kept on this device, but the app itself only opens while your PC is reachable. For full offline use, open Estudiamos with your PC’s Tailscale <b>https://</b> address (see Settings on the PC).'}</p>
      <p class="muted small" style="margin:4px 0 0">Tip: in Safari tap <b>Share → Add to Home Screen</b> to get an Estudiamos app icon.</p>`;
    return;
  }
  try { syncInfoCache = await syncGetJson('/api/info'); } catch (e) { box.innerHTML = `${status}<p class="muted small">Couldn’t reach the sync server.</p>`; return; }
  const info = syncInfoCache, ago = t => t ? new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'never';
  box.innerHTML = `${status}
    <div class="set-row"><div><b>Use Estudiamos on your phone or tablet</b><div class="muted small">Connect an iPhone, iPad or other device. It gets a copy of everything and stays in sync.</div></div>
      <div class="ctl"><button type="button" class="btn primary" data-act="syncConnect">📱 Connect a phone or tablet</button></div></div>
    <div class="set-row"><div><b>🔑 Connect password</b><div class="muted small">${info.connectPw
        ? `On${info.connectPw.set ? ` since ${esc(new Date(info.connectPw.set).toLocaleDateString([], { dateStyle: 'medium' }))}` : ''}. A phone on your Wi-Fi can connect by typing this password, without a code from this screen.${info.connectPw.locked ? ' <b>Locked for now after too many wrong tries.</b>' : ''}`
        : 'Off. Set one to connect a phone from anywhere in the house, without a code from this screen.'}</div></div>
      <div class="ctl">${info.connectPw ? '<button type="button" class="btn sm" data-act="syncSetPw">Change</button><button type="button" class="btn sm ghost" style="color:var(--again)" data-act="syncPwOff">Turn off</button>' : '<button type="button" class="btn sm" data-act="syncSetPw">Set a password</button>'}</div></div>
    <div class="set-row"><div><b>📧 Email me a code</b><div class="muted small">${info.mail
        ? `On. When a phone taps <b>Email me a code</b>, this PC emails a new code to <b>${esc(info.mail.to)}</b>${info.mail.lastSent ? ` (last sent ${esc(ago(info.mail.lastSent))})` : ''}.`
        : 'Off. Set it up so a phone can ask this PC to email you a connect code.'}</div></div>
      <div class="ctl">${info.mail ? '<button type="button" class="btn sm" data-act="syncMailSetup">Change</button><button type="button" class="btn sm ghost" style="color:var(--again)" data-act="syncMailOff">Turn off</button>' : '<button type="button" class="btn sm" data-act="syncMailSetup">Set up email</button>'}</div></div>
    <div class="set-row" style="align-items:flex-start"><div style="flex:1"><b>Connected devices</b>
      ${info.devices.length ? `<div class="sync-list">${info.devices.map(d => `<div class="sync-item"><span>${/iPad/.test(d.name) ? '📲' : '📱'} <b>${esc(d.name)}</b> <span class="muted small">last seen ${esc(ago(d.lastSeen))}</span></span><button type="button" class="btn sm ghost" data-act="syncRemoveDevice" data-id="${esc(d.id)}" data-name="${esc(d.name)}">Remove</button></div>`).join('')}</div>` : '<div class="muted small">None yet.</div>'}</div></div>
    <div class="set-row" style="align-items:flex-start"><div style="flex:1"><b>Automatic backups</b><div class="muted small">Saved on this PC before the first change each day. The last 14 days are kept.</div>
      ${info.backups.length ? `<div class="sync-list">${info.backups.map(b => `<div class="sync-item"><span>🗓️ ${esc(new Date(b.day + 'T12:00').toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }))} <span class="muted small">${Math.max(1, Math.round(b.size / 1024))} KB</span></span><button type="button" class="btn sm ghost" data-act="syncRestore" data-name="${esc(b.name)}" data-day="${esc(b.day)}">Restore</button></div>`).join('')}</div>` : '<div class="muted small">The first backup is made the first time something changes.</div>'}</div>
      <div class="ctl"><button type="button" class="btn sm" data-act="syncBackupNow">Back up now</button></div></div>
    <details class="sync-help"><summary><b>Use it away from home (optional): Tailscale</b></summary>
      <ol class="small">
        <li>Install the free <b>Tailscale</b> app on this PC and on your phone, and sign in to the same account on both.</li>
        <li>On the PC, open Command Prompt and run: <code>tailscale serve --bg 5178</code></li>
        <li>On your phone, open the <b>https://…ts.net</b> address that it shows, connect with a code from here, then tap <b>Share → Add to Home Screen</b>.</li>
      </ol>
      <p class="small muted">With the https address the app also opens with no connection at all, and syncs when it can reach your PC again. Your data stays on your own devices.</p>
      ${info.addresses.some(a => a.tailscale) ? `<p class="small">✅ Tailscale is running on this PC (${info.addresses.filter(a => a.tailscale).map(a => esc(a.ip)).join(', ')}).</p>` : ''}</details>
    <details class="sync-help"><summary><b>Moving Estudiamos to another PC</b></summary>
      <ol class="small">
        <li>Close Estudiamos on this PC.</li>
        <li>Copy two folders to the new PC, side by side in the same place: <b>StudyCards</b> (the app) and <b>EstudiarData</b> (your decks, progress, pictures and connected devices).</li>
        <li>On the new PC, double-click <b>Set up Estudiamos</b> in the StudyCards folder. It checks for Node.js, makes the shortcuts, lets phones connect and shows the new address.</li>
        <li>On your phone, open the new address and connect again with your connect password or a QR code. Your phone gets everything back from the new PC.</li>
      </ol>
      <p class="small muted">Only run the app on one PC at a time with the same data, so changes don’t split in two.</p></details>
    <p class="muted small" style="margin:8px 0 0">Your phone can only reach Estudiamos while this PC is on and awake. Data folder: <code>${esc(info.dataDir)}</code></p>`;
}
function syncConnectDialog() {
  syncPost('/api/pair/code', {}).then(async ({ code, until }) => {
    const info = syncInfoCache || await syncGetJson('/api/info'), before = info.devices.length;
    const addrs = info.addresses.filter(a => !a.tailscale), ts = info.addresses.filter(a => a.tailscale);
    const linkFor = a => `http://${a.ip}:${info.port}/#pair=${code}`;
    let pick = 0;
    const qrBox = () => {
      const a = addrs[pick]; if (!a) return '';
      let pic = ''; try { pic = QR.svg(linkFor(a), 210); } catch {}
      return `${pic}<div class="small muted">Point your iPhone camera here and tap the link that pops up.</div>
        ${addrs.length > 1 ? `<div class="small">Not working? <a data-act="syncQrNext">Try the next address (${pick + 1} of ${addrs.length})</a></div>` : ''}`;
    };
    const mailLink = () => {
      const a = addrs[pick] || ts[0], when = new Date(until).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      const body = `Open this link on your phone (on the same Wi-Fi as the PC) to connect Estudiamos:\n\n${a ? linkFor(a) : ''}\n\nOr type the code ${code.slice(0, 3)} ${code.slice(3)} when it asks.\nThe code works until ${when} and only once.`;
      return `mailto:?subject=${encodeURIComponent('Connect Estudiamos on my phone')}&body=${encodeURIComponent(body)}`;
    };
    SYNC.qrNext = () => { pick = (pick + 1) % addrs.length; const b = $('#syncQr'); if (b) b.innerHTML = qrBox(); const m = $('#syncMail'); if (m) m.href = mailLink(); };
    openDialog({
      title: '📱 Connect a phone or tablet', ok: 'Done', wide: true,
      body: `${addrs.length ? `<div class="sync-qr-wrap"><div id="syncQr" class="sync-qr">${qrBox()}</div>
        <div class="stack" style="gap:8px"><b>Fastest: scan the QR code</b>
          <div class="small">Your phone has to be on the <b>same Wi-Fi</b> as this PC. The phone connects by itself, without typing anything.</div>
          <div class="row" style="flex-wrap:wrap;gap:8px"><a class="btn sm" id="syncMail" href="${esc(mailLink())}">✉️ Email the link to me</a>
            <button type="button" class="btn sm ghost" data-act="syncCopyLink">📋 Copy link</button></div>
          <div class="muted small">Emailing opens your email program with the link ready. Type your address, send it, then open the email on your phone.</div>
        </div></div><hr style="border:0;border-top:1px solid var(--border);margin:12px 0">
        <div class="muted small" style="margin-bottom:8px">Or do it by hand:</div>` : ''}
        <ol class="sync-steps">
        <li>Make sure the phone is on the <b>same Wi-Fi</b> as this PC.</li>
        <li>On the phone, open <b>Safari</b> and type ${addrs.length ? addrs.map(a => `<code class="sync-addr">http://${esc(a.ip)}:${info.port}</code>`).join(' or ') : '<i>(this PC isn’t on a network right now)</i>'}${ts.length ? `<br><span class="muted small">Using Tailscale? Use your https://…ts.net address, or <code>http://${esc(ts[0].ip)}:${info.port}</code></span>` : ''}</li>
        <li>Type this code when it asks:<div class="sync-code">${code.slice(0, 3)} ${code.slice(3)}</div><div class="muted small" id="syncCodeTimer"></div></li>
        <li>Tap <b>Share → Add to Home Screen</b> for an Estudiamos app icon.</li></ol>
        <p class="muted small" style="margin:0">If Windows asked whether to allow “Node.js” on networks, choose <b>Allow</b> for private networks, or the phone can’t connect.</p>`,
      onOpen: () => {
        const t = setInterval(async () => {
          const el = $('#syncCodeTimer'); if (!el || !$('#dlg').open) { clearInterval(t); return; }
          const left = Math.max(0, until - Date.now()); el.textContent = left ? `Code works for ${Math.ceil(left / 60000)} more minute${left > 60000 ? 's' : ''}.` : 'This code ran out. Close this and make a new one.';
          try { const i = await syncGetJson('/api/info'); if (i.devices.length > before) { clearInterval(t); syncInfoCache = i; $('#dlg').close(); toast(`📱 ${i.devices.at(-1).name} is connected!`); if (typeof trumpet === 'function') trumpet(); syncRepaint(); } } catch {}
        }, 2500);
      },
      onOk: () => {},
    });
    $('#dlg').querySelector('[data-dlg=cancel]')?.remove?.();
  }).catch(e => toast('Couldn’t make a code: ' + e.message));
}
function syncRepaint() { const box = $('#syncPanelBody'); if (box) { delete box.dataset.filled; syncFillPanel(); } }
Object.assign(actions, {
  syncSetPw: () => openDialog({
    title: '🔑 Connect password', ok: 'Save password',
    body: `<p style="margin:0">Phones on your Wi-Fi can connect to this PC by typing this password. Pick something only you know, at least 6 characters.</p>
      <label class="field">Password<input name="pw" type="password" autocomplete="new-password" minlength="6" maxlength="200" required></label>
      <label class="field">Repeat password<input name="pw2" type="password" autocomplete="new-password" maxlength="200" required></label>
      <label class="check"><input type="checkbox" id="pwShow"><span>Show the password</span></label>
      <p class="muted small" style="margin:0">After 5 wrong tries it locks for 15 minutes. Phones already connected stay connected if you change or turn off the password.</p>`,
    onOpen: dlg => { dlg.querySelector('#pwShow').onchange = e => dlg.querySelectorAll('[type=password],[data-pw]').forEach(i => { i.dataset.pw = 1; i.type = e.target.checked ? 'text' : 'password'; }); },
    onOk: f => {
      const pw = f.pw.value;
      if (pw.length < 6) { toast('Use at least 6 characters'); return false; }
      if (pw !== f.pw2.value) { toast('The two passwords don’t match'); return false; }
      syncPost('/api/connect-password', { password: pw }).then(() => { toast('Connect password saved 🔑'); syncRepaint(); }).catch(e => toast(e.message));
    },
  }),
  syncPwOff: () => confirmDlg('Turn off the connect password?', 'New phones will need a code or QR code from this PC to connect. Phones already connected stay connected.', 'Turn off',
    () => syncPost('/api/connect-password', { password: null }).then(() => { toast('Connect password turned off'); syncRepaint(); }).catch(e => toast(e.message))),
  syncMailSetup: () => {
    const m = syncInfoCache?.mail || {};
    openDialog({
      title: '📧 Email connect codes to me', ok: 'Save and send a test email', wide: true,
      body: `<p style="margin:0">Your PC will send emails from your own email account, and only to the address below. It uses <b>Gmail</b> by default.</p>
        <ol class="small sync-steps" style="margin:0">
          <li>In your Google account, turn on <b>2-Step Verification</b> (needed for the next step).</li>
          <li>Go to <b>myaccount.google.com/apppasswords</b>, create an app password named <b>Estudiamos</b>, and copy the 16 letters it shows.</li>
          <li>Paste them below. Don’t use your normal Gmail password, because Google won’t accept it here.</li>
        </ol>
        <div class="grid2">
          <label class="field">Your Gmail address (sends the email)<input name="from" type="email" autocomplete="email" required value="${esc(m.from || '')}" placeholder="you@gmail.com"></label>
          <label class="field">Send codes to<input name="to" type="email" value="${esc(m.to || '')}" placeholder="Same as your address"></label>
        </div>
        <label class="field">App password${m.from ? ' <span class="hint muted">(leave empty to keep the saved one)</span>' : ''}<input name="pass" type="password" autocomplete="new-password" spellcheck="false" ${m.from ? '' : 'required'} placeholder="xxxx xxxx xxxx xxxx"></label>
        <details><summary class="small">Not using Gmail?</summary>
          <div class="grid2" style="margin-top:8px"><label class="field">Mail server<input name="host" value="${esc(m.host || 'smtp.gmail.com')}"></label>
            <label class="field">Port<select name="port"><option value="465" ${(m.port || 465) == 465 ? 'selected' : ''}>465 (SSL)</option><option value="587" ${m.port == 587 ? 'selected' : ''}>587 (STARTTLS)</option></select></label></div>
          <p class="muted small" style="margin:4px 0 0">Ask your email provider for its “SMTP” server name and an app password.</p></details>
        <p class="muted small" style="margin:0">🔒 The app password is locked to your Windows account on this PC. It is never sent to your phone or shown again. Copying the data folder to another PC won’t copy a usable password, so you’d set it up again there.</p>`,
      onOk: f => {
        const btn = $('#dlg button[type=submit]'); btn.disabled = true; btn.textContent = 'Sending a test email…';
        syncPost('/api/mail/save', { from: f.from.value, to: f.to.value, pass: f.pass.value, host: f.host.value, port: f.port.value, test: true })
          .then(r => {
            if (r.tested) { $('#dlg').close(); toast(`Test email sent to ${r.to} ✅`); syncRepaint(); }
            else { btn.disabled = false; btn.textContent = 'Save and send a test email'; toast(`Saved, but the test email failed: ${r.error}`); syncRepaint(); }
          })
          .catch(e => { btn.disabled = false; btn.textContent = 'Save and send a test email'; toast(e.message); });
        return false;
      },
    });
  },
  syncMailOff: () => confirmDlg('Turn off emailed codes?', 'Phones won’t be able to ask for a code by email. The saved app password is deleted from this PC.', 'Turn off',
    () => syncPost('/api/mail/off', {}).then(() => { toast('Emailed codes turned off'); syncRepaint(); }).catch(e => toast(e.message))),
  syncQrNext: () => SYNC.qrNext?.(),
  syncCopyLink: () => {
    const href = decodeURIComponent(($('#syncMail')?.href || '').split('body=')[1] || '').match(/https?:\/\/\S+/)?.[0];
    if (!href) return;
    navigator.clipboard?.writeText(href).then(() => toast('Link copied 📋'), () => toast(href));
  },
  syncChip: () => {
    if (SYNC.status === 'unpaired') return actions.syncPair();
    go({ name: 'settings' }); setTimeout(() => $('#syncPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    syncNow();
  },
  syncNowBtn: async () => { syncSetStatus('syncing'); await syncNow(); await syncMediaNow(); toast(SYNC.status === 'ok' ? 'Synced ✓' : 'Couldn’t sync right now'); },
  syncConnect: () => syncConnectDialog(),
  syncRemoveDevice: el => confirmDlg(`Remove ${el.dataset.name}?`, 'That device stops syncing. Its own copy of the data stays on it. You can connect it again with a new code.', 'Remove', async () => {
    await syncPost('/api/devices/remove', { id: el.dataset.id }); syncRepaint(); toast('Device removed');
  }),
  syncBackupNow: async () => { await syncPost('/api/backup-now', {}); syncRepaint(); toast('Backup saved'); },
  syncRestore: el => confirmDlg(`Go back to ${el.dataset.day}?`, 'All your devices will go back to how your decks, cards and progress were on that day. Changes made after it are replaced. (A copy of how things are now is saved first.)', 'Restore', async () => {
    await syncPost('/api/restore', { name: el.dataset.name }); await syncNow(); toast('Restored ✓'); syncRepaint(); render();
  }),
  syncPair: async () => { if (await syncPairDialog()) { SYNC.enabled = true; syncSetStatus('syncing'); await syncNow(); syncListen(); syncMediaNow(); syncRepaint(); } },
  syncForget: () => confirmDlg('Disconnect this device?', 'It stops syncing with your PC. Everything stays on this device, and you can connect again later with a new code.', 'Disconnect', async () => {
    SYNC.meta.token = null; SYNC.enabled = false; try { SYNC.es?.close(); } catch {} await syncSaveMeta(); renderSyncChip(); syncRepaint();
  }),
});

/* ---------- Moving the data out of the old copy (opened from a file) ---------- */
async function syncMigrateFromFile(nonce) {
  const target = 'http://localhost:5178';
  const box = document.createElement('div'); box.className = 'sync-migrate';
  box.innerHTML = `<div class="panel stack" style="max-width:420px;text-align:center;align-items:center">${typeof mascot === 'function' ? mascot(90, 'happy') : ''}<h3>Getting Estudiamos ready for your phone…</h3><p class="muted small" id="migMsg">Copying your decks and progress. This only happens once.</p></div>`;
  document.body.appendChild(box);
  const fail = msg => { $('#migMsg').innerHTML = `⚠️ ${esc(msg)}<br>Your data is safe in this window. Close it and use the desktop shortcut again.`; };
  try {
    if (idbTimer) { clearTimeout(idbTimer); writeState(); }
    const reg = await kvGet('profiles'), states = {};
    for (const p of reg?.list || []) states[p.id] = p.id === currentProfileId ? S : await kvGet('state:' + p.id);
    const keys = await idbDo('media', 'readonly', st => st.getAllKeys()), media = {};
    for (const k of keys) media[k] = await idbDo('media', 'readonly', st => st.get(k));
    const fr = document.createElement('iframe'); fr.style.display = 'none'; fr.src = `${target}/migrate.html#${nonce}`;
    const timer = setTimeout(() => fail('The Estudiamos server didn’t answer.'), 30000);
    window.addEventListener('message', e => {
      if (e.origin !== target || !e.data) return;
      if (e.data.type === 'estudiar-migrate-ready') fr.contentWindow.postMessage({ type: 'estudiar-migrate', nonce, profiles: reg, states, media }, target);
      if (e.data.type === 'estudiar-migrate-progress') $('#migMsg').textContent = `Copying pictures… ${e.data.done} of ${e.data.total}`;
      if (e.data.type === 'estudiar-migrate-done') { clearTimeout(timer); if (e.data.ok) { try { localStorage.setItem('estudiar.movedToServer', '1'); } catch {} $('#migMsg').textContent = 'Done! Opening Estudiamos…'; setTimeout(() => location.href = target + '/', 600); } else fail(e.data.error || 'Something went wrong.'); }
    });
    document.body.appendChild(fr);
  } catch (e) { fail(e.message); }
}

/* ---------- Offline app (needs https or localhost) ---------- */
if (!SYNC_FILE && 'serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
