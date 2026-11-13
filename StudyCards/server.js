'use strict';
/* ================= Estudiamos sync server =================
   Runs on your PC. It serves the app to your phone/tablet over Wi-Fi (or Tailscale) and keeps everyone in sync.
   - Data lives next to the app in ..\EstudiarData (sync.json, media\, backups\, devices.json).
   - Only this PC (localhost) and devices paired with a 6-digit code can read or change data.
   - Before the first change of each day a backup is saved; the last 14 days are kept.
   No extra packages needed: just Node.js. */
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const Core = require('./syncmerge.js');
const Mail = require('./mailer.js');

const PORT = +process.env.ESTUDIAR_PORT || 5178;
const APP = __dirname;
const DATA = process.env.ESTUDIAR_DATA || path.join(APP, '..', 'EstudiarData');
const MEDIA = path.join(DATA, 'media'), BACKUPS = path.join(DATA, 'backups');
const KEEP_BACKUPS = 14, MAX_BODY = 60 * 1024 * 1024;
for (const d of [DATA, MEDIA, BACKUPS]) fs.mkdirSync(d, { recursive: true });

const readJson = (f, dflt) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return dflt; } };
function writeJsonAtomic(f, obj) { const tmp = f + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(obj)); fs.renameSync(tmp, f); }

const DB_FILE = path.join(DATA, 'sync.json'), DEV_FILE = path.join(DATA, 'devices.json'), MIDX_FILE = path.join(DATA, 'media.json');
let db = readJson(DB_FILE, { seq: 0, records: {} });          // records: key -> { v, ts, seq, del }
let devices = readJson(DEV_FILE, { devices: {} });             // token -> { name, added, lastSeen }
let mediaIdx = readJson(MIDX_FILE, {});                        // key -> { h, ts, type, size, seq }
if (!db.id) { db.id = crypto.randomBytes(8).toString('hex'); writeJsonAtomic(DB_FILE, db); }   // lets devices notice a new/replaced data folder
let dirty = false, saveTimer = null;
function persist() { dirty = true; clearTimeout(saveTimer); saveTimer = setTimeout(flush, 300); }
function flush() { if (!dirty) return; dirty = false; writeJsonAtomic(DB_FILE, db); writeJsonAtomic(DEV_FILE, devices); writeJsonAtomic(MIDX_FILE, mediaIdx); }
/* Updates (updater.js): check, download, verify the signature, back up, swap. PC-only. */
const Updater = require('./updater.js')({ APP, DATA, PORT, readJson, writeJsonAtomic, beforeSwap: () => flush(), exitNow: () => { flush(); try { server.close(); } catch {} process.exit(0); } });
process.on('SIGINT', () => { flush(); process.exit(0); });
process.on('SIGTERM', () => { flush(); process.exit(0); });

/* ---------- Daily backups ---------- */
const dayKey = (t = new Date()) => `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
function backupIfNeeded() {
  const f = path.join(BACKUPS, `sync-${dayKey()}.json`);
  if (fs.existsSync(f) || !Object.keys(db.records).length) return;
  writeJsonAtomic(f, db);
  const all = fs.readdirSync(BACKUPS).filter(n => /^sync-\d{4}-\d\d-\d\d\.json$/.test(n)).sort();
  for (const old of all.slice(0, Math.max(0, all.length - KEEP_BACKUPS))) fs.unlinkSync(path.join(BACKUPS, old));
}
function listBackups() {
  return fs.readdirSync(BACKUPS).filter(n => /^sync-\d{4}-\d\d-\d\d\.json$/.test(n)).sort().reverse()
    .map(n => ({ name: n, day: n.slice(5, 15), size: fs.statSync(path.join(BACKUPS, n)).size }));
}

/* ---------- Tailscale (optional): reach the PC from anywhere over a private, encrypted network ---------- */
// Only asks the Tailscale program on this PC what it knows; nothing is sent anywhere. Used by the phone setup guide.
const { execFile } = require('child_process');
function tsExe() {
  const win = 'C:\\Program Files\\Tailscale\\tailscale.exe';
  return process.platform === 'win32' && fs.existsSync(win) ? win : 'tailscale';
}
function tsRun(args, timeout = 8000) {
  return new Promise(resolve => {
    execFile(tsExe(), args, { timeout, windowsHide: true }, (err, stdout, stderr) => resolve({ err, out: String(stdout || ''), errOut: String(stderr || '') }));
  });
}
async function tsStatus() {
  const st = await tsRun(['status', '--json']);
  if (st.err && /ENOENT|not recognized|cannot find/i.test(String(st.err.message) + st.errOut)) return { installed: false };
  let j = null; try { j = JSON.parse(st.out); } catch {}
  if (!j) return { installed: true, running: false };
  const self = j.Self || {}, dns = String(self.DNSName || '').replace(/\.$/, '');
  const phones = Object.values(j.Peer || {}).filter(x => /ios|android/i.test(x.OS || '')).map(x => ({ name: x.HostName === 'localhost' ? (x.OS === 'iOS' ? 'iPhone / iPad' : 'Android phone') : x.HostName, os: x.OS, online: !!x.Online }));
  const sv = await tsRun(['serve', 'status', '--json']);
  let serving = false; try { serving = JSON.stringify(JSON.parse(sv.out || '{}')).includes(`127.0.0.1:${PORT}`) || JSON.stringify(JSON.parse(sv.out || '{}')).includes(`localhost:${PORT}`); } catch {}
  return { installed: true, running: j.BackendState === 'Running', state: j.BackendState, dns, https: !!(j.CertDomains || []).length, phones, serving, url: dns ? `https://${dns}` : null };
}
async function tsServe() {
  // "tailscale serve" waits if HTTPS isn't turned on for the account yet, and prints a link to turn it on
  const r = await tsRun(['serve', '--bg', String(PORT)], 20000);
  const link = (r.out + r.errOut).match(/https:\/\/login\.tailscale\.com\/\S+/);
  return { ok: !r.err, link: link ? link[0] : null, message: (r.errOut || r.out).trim().slice(0, 400) };
}

/* ---------- Who is asking? ---------- */
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;
function isLocal(req) {
  const a = req.socket.remoteAddress || '';
  if (!/^(::1|127\.|::ffff:127\.)/.test(a)) return false;
  if (req.headers['x-forwarded-for'] || req.headers['forwarded'] || req.headers['tailscale-user-login']) return false;   // proxied (e.g. tailscale serve)
  if (!LOCAL_HOST.test(req.headers.host || '')) return false;                                                           // DNS-rebinding guard
  const o = req.headers.origin;
  if (o && !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(o)) return false;                             // other websites can't use it
  return true;
}
function migrateNonceOk(t) {
  if (!t) return false;
  const f = path.join(DATA, 'migrate-nonce.txt');
  try { const st = fs.statSync(f); if (Date.now() - st.mtimeMs > 15 * 60e3) return false; return fs.readFileSync(f, 'utf8').trim() === t; } catch { return false; }
}
function who(req, url) {
  if (isLocal(req)) return { local: true, name: 'This PC', id: 'local' };
  const t = req.headers['x-estudiar-token'] || url.searchParams.get('token');
  if (t && devices.devices[t]) { const d = devices.devices[t]; d.lastSeen = Date.now(); return { local: false, name: d.name, id: t.slice(0, 8) }; }
  return null;
}

/* ---------- Pairing ---------- */
let pairCode = null;   // { code, until, tries }
function newPairCode() { pairCode = { code: String(crypto.randomInt(0, 1e6)).padStart(6, '0'), until: Date.now() + 10 * 60e3, tries: 0 }; return pairCode; }

/* Connect password: lets a phone connect without a code from the PC screen. Only a salted scrypt hash is stored.
   5 wrong tries lock it for 15 minutes (each further lockout doubles, up to a day). */
const PW_FILE = path.join(DATA, 'connect.json');
let connectPw = readJson(PW_FILE, null);                          // { salt, hash } or null
const pwLock = { fails: 0, until: 0, level: 0 };
const pwHash = (pw, salt) => crypto.scryptSync(String(pw), salt, 32).toString('hex');
function pwMatches(pw) {
  if (!connectPw) return false;
  const a = Buffer.from(pwHash(pw, connectPw.salt), 'hex'), b = Buffer.from(connectPw.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function setConnectPw(pw) {
  if (!pw) { connectPw = null; try { fs.unlinkSync(PW_FILE); } catch {} return; }
  const salt = crypto.randomBytes(16).toString('hex');
  connectPw = { salt, hash: pwHash(pw, salt), set: Date.now() }; writeJsonAtomic(PW_FILE, connectPw);
  Object.assign(pwLock, { fails: 0, until: 0, level: 0 });
}
const addDevice = name => { const token = crypto.randomBytes(24).toString('hex'); devices.devices[token] = { name: String(name || 'Phone').slice(0, 40), added: Date.now(), lastSeen: Date.now() }; persist(); return token; };
const wait = ms => new Promise(r => setTimeout(r, ms));

/* Email a connect code: the phone presses a button, the PC emails a fresh code to the owner's saved address.
   Codes only ever go to that address, and requests are limited (1 per minute, 6 per hour). */
const mail = Mail.mailStore(DATA);
const mailLimit = { times: [] };
function mailAllowed() {
  const now = Date.now(); mailLimit.times = mailLimit.times.filter(t => now - t < 3600e3);
  if (mailLimit.times.length && now - mailLimit.times.at(-1) < 60e3) return 'Please wait a minute before asking for another email.';
  if (mailLimit.times.length >= 6) return 'Too many emails this hour. Try again later, or use the connect password.';
  mailLimit.times.push(now); return null;
}
function linkHost(req) {   // the address the phone used, if it really is this PC; otherwise this PC's Wi-Fi address
  const h = String(req.headers.host || ''), ip = h.replace(/:\d+$/, '').replace(/^\[|\]$/g, '');
  if (lanAddresses().some(a => a.ip === ip) || /\.ts\.net$/i.test(ip)) return h;
  const a = lanAddresses().find(x => !x.tailscale) || lanAddresses()[0]; return a ? `${a.ip}:${PORT}` : `localhost:${PORT}`;
}
function codeEmail(code, host, until) {
  const when = new Date(until).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), nice = `${code.slice(0, 3)} ${code.slice(3)}`;
  return { subject: `Your Estudiamos connect code: ${nice}`,
    text: `Someone (hopefully you) asked to connect a phone or tablet to Estudiamos on your PC.

Type this code in Estudiamos on the phone:

    ${nice}

Or open this link on the phone (on the same Wi-Fi as the PC):
http://${host}/#pair=${code}

The code works until ${when} and only once.
If this wasn't you, you can ignore this email. Nobody can connect without the code.` };
}

/* ---------- Live updates (Server-Sent Events) ---------- */
const listeners = new Set();
function broadcast(from) { const msg = `data: ${JSON.stringify({ seq: db.seq, mseq: mediaSeq(), from })}\n\n`; for (const l of listeners) { try { l.res.write(msg); } catch {} } }
const mediaSeq = () => Object.values(mediaIdx).reduce((a, m) => Math.max(a, m.seq || 0), 0);

/* ---------- Merge ---------- */
function applyChanges(changes, offset, from) {
  backupIfNeeded();
  const now = Date.now(), touched = new Set();
  for (const ch of changes) {
    if (!ch || typeof ch.k !== 'string') continue;
    const rec = db.records[ch.k], ts = Math.min(now, (+ch.ts || now) + offset);
    let next = null;
    if (ch.op === 'add') {                         // counters: add the other device's change on top
      const base = rec && !rec.del && typeof rec.v === 'number' ? rec.v : 0;
      next = { v: Math.round((base + (+ch.d || 0)) * 1000) / 1000, ts: now };
    } else if (ch.op === 'max') {
      const cur = rec && !rec.del && typeof rec.v === 'number' ? rec.v : -Infinity;
      if (typeof ch.v === 'number' && ch.v > cur) next = { v: ch.v, ts: now };
    } else if (!rec || ts >= rec.ts || (from && rec.by === from)) {   // everything else: the newest change wins (a device's own later change always replaces its earlier one)
      next = ch.del ? { del: true, ts } : { v: ch.v, ts };
      if (rec && !rec.del && !ch.del && JSON.stringify(rec.v) === JSON.stringify(ch.v)) next = null;
      if (rec && rec.del && ch.del) next = null;
    }
    if (next) { next.seq = ++db.seq; next.by = from; db.records[ch.k] = next; }
    touched.add(ch.k);
  }
  return touched;
}
function recordsSince(since, extraKeys) {
  const out = {};
  for (const [k, r] of Object.entries(db.records)) if (r.seq > since || extraKeys?.has(k)) out[k] = r.del ? { del: true, ts: r.ts } : { v: r.v, ts: r.ts };
  return out;
}

/* ---------- HTTP helpers ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon', '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8' };
function send(res, code, body, headers = {}) {
  const isBuf = Buffer.isBuffer(body), data = isBuf ? body : typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(code, { 'Content-Type': isBuf ? 'application/octet-stream' : typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json', 'Cache-Control': 'no-store', ...headers });
  res.end(data);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > MAX_BODY) { reject(new Error('too big')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks))); req.on('error', reject);
  });
}
const readJsonBody = async req => JSON.parse((await readBody(req)).toString('utf8') || '{}');
const safeMediaKey = k => typeof k === 'string' && /^[\w:.-]{1,120}$/.test(k);
const mediaFile = k => path.join(MEDIA, k.replace(/:/g, '~') + '.bin');
function lanAddresses() {
  const out = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) for (const a of list || []) {
    if (a.family !== 'IPv4' || a.internal) continue;
    out.push({ ip: a.address, name, tailscale: /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(a.address) || /tailscale/i.test(name) });
  }
  return out;
}

/* ---------- Routes ---------- */
async function api(req, res, url) {
  const p = url.pathname, me = who(req, url);
  if (p === '/api/ping') return send(res, 200, { ok: true, app: 'estudiar', version: Updater.current(), paired: !!me, local: !!me?.local, seq: db.seq, db: db.id, pw: !!connectPw, mail: !!mail.get() });
  if (p === '/api/pair/email' && req.method === 'POST') {
    if (!mail.get()) return send(res, 400, { error: 'Email isn’t set up on the PC yet.' });
    const no = mailAllowed(); if (no) return send(res, 429, { error: no });
    const c = newPairCode(), m = codeEmail(c.code, linkHost(req), c.until);
    try { const to = await mail.send(m.subject, m.text); return send(res, 200, { ok: true, to: Mail.maskEmail(to), until: c.until }); }
    catch (e) { return send(res, 502, { error: 'The PC couldn’t send the email: ' + e.message }); }
  }
  if (p === '/api/pair-password' && req.method === 'POST') {
    const b = await readJsonBody(req);
    if (!connectPw) return send(res, 400, { error: 'No connect password is set on the PC.' });
    if (Date.now() < pwLock.until) return send(res, 429, { error: `Too many wrong tries. Try again in ${Math.ceil((pwLock.until - Date.now()) / 60000)} minutes.` });
    await wait(400);                                              // slows down guessing
    if (!pwMatches(b.password || '')) {
      if (++pwLock.fails >= 5) { pwLock.until = Date.now() + Math.min(24 * 60, 15 * 2 ** pwLock.level) * 60e3; pwLock.level++; pwLock.fails = 0; }
      return send(res, 403, { error: 'That password isn’t right.' + (pwLock.fails ? ` ${5 - pwLock.fails} tr${5 - pwLock.fails === 1 ? 'y' : 'ies'} left before it locks for a while.` : ' It’s locked for a while now.') });
    }
    Object.assign(pwLock, { fails: 0, until: 0, level: 0 });
    return send(res, 200, { token: addDevice(b.name) });
  }
  if (p === '/api/pair' && req.method === 'POST') {
    const b = await readJsonBody(req);
    if (!pairCode || Date.now() > pairCode.until) return send(res, 400, { error: 'That code has run out or was already used.' });
    if (++pairCode.tries > 8) { pairCode = null; return send(res, 429, { error: 'Too many tries. Make a new code on your PC.' }); }
    if (String(b.code || '').trim() !== pairCode.code) return send(res, 403, { error: 'That code doesn’t match. Check the code on your PC.' });
    pairCode = null;
    return send(res, 200, { token: addDevice(b.name) });
  }
  if (!me) return send(res, 401, { error: 'not paired' });

  if (p === '/api/sync' && req.method === 'POST') {
    const b = await readJsonBody(req);
    if (b.db && b.db !== db.id) return send(res, 200, { reset: true, db: db.id, seq: db.seq, records: {} });   // device knew a different data folder: it will upload everything again
    const offset = typeof b.now === 'number' ? Date.now() - b.now : 0;
    const touched = Array.isArray(b.changes) && b.changes.length ? applyChanges(b.changes, offset, me.id) : new Set();
    const before = +b.since || 0, recs = recordsSince(before, touched);
    if (touched.size) { persist(); broadcast(me.id); }
    return send(res, 200, { seq: db.seq, records: recs, serverNow: Date.now(), db: db.id });
  }
  if (p === '/api/media' && req.method === 'GET') return send(res, 200, { index: mediaIdx });
  const mm = p.match(/^\/api\/media\/(.+)$/);
  if (mm) {
    const key = decodeURIComponent(mm[1]); if (!safeMediaKey(key)) return send(res, 400, { error: 'bad key' });
    if (req.method === 'GET') {
      const m = mediaIdx[key]; if (!m || m.del) return send(res, 404, { error: 'missing' });
      try { return send(res, 200, fs.readFileSync(mediaFile(key)), { 'Content-Type': m.type || 'application/octet-stream' }); } catch { return send(res, 404, { error: 'missing' }); }
    }
    if (req.method === 'PUT') {
      const buf = await readBody(req), h = url.searchParams.get('h') || '', ts = +url.searchParams.get('ts') || Date.now();
      const cur = mediaIdx[key];
      if (cur && cur.h !== h && cur.ts > ts) return send(res, 200, { kept: 'server' });
      fs.writeFileSync(mediaFile(key), buf);
      mediaIdx[key] = { h, ts, type: String(req.headers['content-type'] || 'application/octet-stream').slice(0, 60), size: buf.length, seq: mediaSeq() + 1 };
      persist(); broadcast(me.id);
      return send(res, 200, { ok: true });
    }
    if (req.method === 'DELETE') {
      if (mediaIdx[key] && !mediaIdx[key].del) { mediaIdx[key] = { del: true, ts: Date.now(), seq: mediaSeq() + 1 }; try { fs.unlinkSync(mediaFile(key)); } catch {} persist(); broadcast(me.id); }
      return send(res, 200, { ok: true });
    }
  }
  if (p === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' });
    res.write(`retry: 4000\ndata: ${JSON.stringify({ seq: db.seq, mseq: mediaSeq() })}\n\n`);
    const l = { res }; listeners.add(l);
    const ka = setInterval(() => { try { res.write(': ping\n\n'); } catch {} }, 25000);
    req.on('close', () => { clearInterval(ka); listeners.delete(l); });
    return;
  }
  if (p === '/api/migrate' && req.method === 'POST') {   // one-time move of the data from the old copy of the app (opened from a file)
    if (!me.local || !migrateNonceOk(req.headers['x-estudiar-token'])) return send(res, 403, { error: 'Not allowed' });
    const b = await readJsonBody(req), map = Core.flattenAll(b.profiles, b.states, true), now = Date.now();
    backupIfNeeded();
    for (const [k, v] of Object.entries(map)) { const cur = db.records[k]; if (cur && !cur.del && JSON.stringify(cur.v) === JSON.stringify(v)) continue; db.records[k] = { v, ts: now, seq: ++db.seq, by: 'migrate' }; }
    persist(); broadcast('migrate');
    return send(res, 200, { ok: true, records: Object.keys(map).length });
  }
  if (p === '/api/migrate-done' && me.local && migrateNonceOk(req.headers['x-estudiar-token'])) { try { fs.unlinkSync(path.join(DATA, 'migrate-nonce.txt')); } catch {} fs.writeFileSync(path.join(DATA, 'migrated.flag'), new Date().toISOString()); return send(res, 200, { ok: true }); }

  // ----- PC-only management -----
  if (!me.local) return send(res, 403, { error: 'Only on the PC' });
  if (p === '/api/info') return send(res, 200, { port: PORT, host: os.hostname(), addresses: lanAddresses(), dataDir: DATA, devices: Object.entries(devices.devices).map(([t, d]) => ({ id: t.slice(0, 8), ...d })), backups: listBackups(), records: Object.keys(db.records).length, migrated: fs.existsSync(path.join(DATA, 'migrated.flag')), connectPw: connectPw ? { set: connectPw.set || null, locked: Date.now() < pwLock.until } : null, mail: mail.publicInfo() });
  if (p === '/api/mail/save' && req.method === 'POST') {
    const b = await readJsonBody(req), okMail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '').trim());
    if (!okMail(b.from)) return send(res, 400, { error: 'Type your full email address.' });
    if (b.to && !okMail(b.to)) return send(res, 400, { error: 'The “send codes to” address doesn’t look right.' });
    if (b.port && ![465, 587].includes(+b.port)) return send(res, 400, { error: 'Use port 465 or 587.' });
    if (b.host && !/^[a-z0-9.-]+$/i.test(b.host)) return send(res, 400, { error: 'That mail server name doesn’t look right.' });
    try { await mail.save(b); } catch (e) { return send(res, 400, { error: e.message }); }
    if (b.test) {
      try { const to = await mail.send('Estudiamos email test ✅', 'It works! Your PC can now email you connect codes when you ask for one on your phone.\n\nOn the phone: open Estudiamos, then tap "Email me a code".'); return send(res, 200, { ok: true, tested: true, to }); }
      catch (e) { return send(res, 200, { ok: true, tested: false, error: e.message }); }
    }
    return send(res, 200, { ok: true });
  }
  if (p.startsWith('/api/update/')) return Updater.handle(p, req, res, send, readBody);
  if (p === '/api/tailscale') return send(res, 200, await tsStatus());
  if (p === '/api/tailscale/serve' && req.method === 'POST') { const r = await tsServe(); return send(res, 200, { ...r, status: await tsStatus() }); }
  if (p === '/api/mail/off' && req.method === 'POST') { mail.off(); return send(res, 200, { ok: true }); }
  if (p === '/api/connect-password' && req.method === 'POST') {
    const b = await readJsonBody(req), pw = b.password == null ? '' : String(b.password);
    if (pw && pw.length < 6) return send(res, 400, { error: 'Use at least 6 characters.' });
    if (pw.length > 200) return send(res, 400, { error: 'That password is too long.' });
    setConnectPw(pw); return send(res, 200, { ok: true, on: !!connectPw });
  }
  if (p === '/api/pair/code' && req.method === 'POST') { const c = newPairCode(); return send(res, 200, { code: c.code, until: c.until }); }
  if (p === '/api/devices/remove' && req.method === 'POST') {
    const b = await readJsonBody(req);
    for (const t of Object.keys(devices.devices)) if (t.slice(0, 8) === b.id) delete devices.devices[t];
    persist(); return send(res, 200, { ok: true });
  }
  if (p === '/api/backup-now' && req.method === 'POST') { const f = path.join(BACKUPS, `sync-${dayKey()}.json`); writeJsonAtomic(f, db); return send(res, 200, { ok: true, backups: listBackups() }); }
  if (p === '/api/restore' && req.method === 'POST') {
    const b = await readJsonBody(req);
    if (!/^sync-\d{4}-\d\d-\d\d\.json$/.test(b.name || '')) return send(res, 400, { error: 'bad name' });
    const old = readJson(path.join(BACKUPS, b.name), null); if (!old) return send(res, 404, { error: 'missing' });
    writeJsonAtomic(path.join(BACKUPS, `before-restore-${Date.now()}.json`), db);   // so a restore can be undone by hand
    const now = Date.now();
    for (const k of new Set([...Object.keys(db.records), ...Object.keys(old.records)])) {
      const o = old.records[k], cur = db.records[k];
      if (o && !o.del) { if (!cur || cur.del || JSON.stringify(cur.v) !== JSON.stringify(o.v)) db.records[k] = { v: o.v, ts: now, seq: ++db.seq, by: 'restore' }; }
      else if (cur && !cur.del) db.records[k] = { del: true, ts: now, seq: ++db.seq, by: 'restore' };
    }
    persist(); broadcast('restore');
    return send(res, 200, { ok: true });
  }
  return send(res, 404, { error: 'unknown' });
}

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/' || rel === '') rel = '/index.html';
  const file = path.normalize(path.join(APP, rel));
  if (!file.startsWith(APP + path.sep) || /[\\/]\.|(server|mailer|updater)\.js$|\.(cmd|ps1|vbs)$/i.test(rel)) return send(res, 404, 'Not found');
  fs.readFile(file, (e, data) => {
    if (e) return send(res, 404, 'Not found');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) await api(req, res, url);
    else serveStatic(req, res, url);
  } catch (e) { console.error(e); if (!res.headersSent) send(res, 500, { error: String(e.message || e) }); }
});
server.on('error', e => {
  if (e.code === 'EADDRINUSE') { console.log(`Estudiamos's server is already running on port ${PORT}.`); process.exit(0); }
  throw e;
});
server.listen(PORT, '::', () => {   // '::' answers on both IPv4 and IPv6 (Windows tries both for "localhost")
  console.log(`Estudiamos server is running. Keep this window open (you can minimize it).`);
  console.log(`  On this PC:   http://localhost:${PORT}`);
  for (const a of lanAddresses()) console.log(`  ${a.tailscale ? 'Tailscale:   ' : 'Wi-Fi:       '} http://${a.ip}:${PORT}`);
  console.log(`  Data folder:  ${DATA}`);
});
