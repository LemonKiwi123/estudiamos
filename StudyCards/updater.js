'use strict';
/* ================= Estudiamos updater (runs inside the PC's sync server) =================
   1. Check:    reads a small "latest.json" from the update address in update.json (only that file is fetched; nothing about you is sent).
   2. Download: gets the new .zip and checks its fingerprint (SHA-256).
   3. Verify:   the package must carry release-manifest.json, signed with the publisher's private key. It is checked against
                update-key.pem from the version that is ALREADY installed, and every file must match the manifest. A changed or fake
                package is refused.
   4. Backup:   your cards (sync.json) are copied to EstudiarData\updates before anything changes.
   5. Swap:     a small helper waits for this server to stop, keeps the current app as "StudyCards.previous", copies the new version in,
                and starts the server again. If anything fails, it puts the old version back.
   Your data folder (EstudiarData) is never touched by the swap. Only this PC can use these commands, never a phone. */
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFile, spawn } = require('child_process');

const cmpVer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };
const validVer = v => /^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(String(v));
const okUrl = u => /^https:\/\//i.test(u) || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(u);   // http only for testing on this PC
const run = (file, args, opts = {}) => new Promise(resolve => execFile(file, args, { windowsHide: true, timeout: 120000, maxBuffer: 8e6, ...opts }, (err, out, errOut) => resolve({ err, out: String(out || ''), errOut: String(errOut || '') })));
const sha256File = f => new Promise((resolve, reject) => { const h = crypto.createHash('sha256'); fs.createReadStream(f).on('data', d => h.update(d)).on('end', () => resolve(h.digest('hex'))).on('error', reject); });
const SKIP_IN_MANIFEST = new Set(['release-manifest.json', 'release-manifest.sig']);
function listFiles(dir, base = dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) listFiles(f, base, out); else out.push(path.relative(base, f).split(path.sep).join('/'));
  }
  return out;
}

module.exports = function makeUpdater({ APP, DATA, PORT, readJson, writeJsonAtomic, beforeSwap, exitNow }) {
  const UP = path.join(DATA, 'updates'); fs.mkdirSync(UP, { recursive: true });
  const STATE = path.join(UP, 'state.json'), RESULT = path.join(UP, 'result.json');
  const PREV = path.join(path.dirname(APP), path.basename(APP) + '.previous');
  const current = () => readJson(path.join(APP, 'version.json'), { version: '0.0.0' }).version;
  const feed = () => String(readJson(path.join(APP, 'update.json'), {}).feed || '').trim();
  const pubKey = () => { try { return crypto.createPublicKey(fs.readFileSync(path.join(APP, 'update-key.pem'))); } catch { return null; } };
  const prevVersion = () => fs.existsSync(path.join(PREV, 'server.js')) ? readJson(path.join(PREV, 'version.json'), { version: null }).version : null;
  let state = { autoCheck: true, lastCheck: 0, available: null, ...readJson(STATE, {}) };
  let result = readJson(RESULT, null);   // what the helper reported after the last swap (shown once)
  let job = null;                        // { stage, pct, error, version }
  const save = () => writeJsonAtomic(STATE, state);
  if (state.available && cmpVer(state.available.version, current()) <= 0) { state.available = null; save(); }

  async function check() {
    const f = feed();
    if (!f) throw new Error('This copy of Estudiamos has no update address. You can still use “Update from file”.');
    if (!okUrl(f)) throw new Error('The update address must start with https://');
    const r = await fetch(f, { cache: 'no-store', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Estudiamos-updater' } });
    if (!r.ok) throw new Error(`The update site answered “${r.status}”. Try again later.`);
    const j = await r.json().catch(() => null);
    if (!j || j.app !== 'estudiamos' || !validVer(j.version) || !/^[0-9a-f]{64}$/i.test(j.sha256 || '') || !okUrl(j.url || '')) throw new Error('The update information looks wrong, so it was ignored.');
    state.lastCheck = Date.now();
    state.available = cmpVer(j.version, current()) > 0 ? { version: j.version, notes: String(j.notes || '').slice(0, 4000), date: String(j.date || ''), url: j.url, sha256: j.sha256.toLowerCase(), size: +j.size || 0 } : null;
    save(); return state.available;
  }
  function maybeAutoCheck() {
    if (!state.autoCheck || job || !feed() || Date.now() - (state.lastCheck || 0) < 20 * 3600e3) return;
    state.lastCheck = Date.now(); save();   // don't ask again right away if it fails
    check().catch(() => {});
  }

  async function download(url, sha, size, dest) {
    const r = await fetch(url, { signal: AbortSignal.timeout(10 * 60e3), headers: { 'User-Agent': 'Estudiamos-updater' } });
    if (!r.ok || !r.body) throw new Error(`The download didn't work (the site answered “${r.status}”).`);
    const total = +r.headers.get('content-length') || size || 0, h = crypto.createHash('sha256'), out = fs.createWriteStream(dest);
    let got = 0;
    for await (const chunk of r.body) {
      got += chunk.length; if (got > 300e6) throw new Error('The download is much bigger than expected, so it was stopped.');
      h.update(chunk); if (!out.write(chunk)) await new Promise(res => out.once('drain', res));
      if (total) job.pct = Math.min(99, Math.round(got / total * 100));
    }
    await new Promise((res, rej) => out.end(err => err ? rej(err) : res()));
    if (h.digest('hex') !== sha) throw new Error('The downloaded file doesn’t match its fingerprint. It may be damaged; try again.');
  }
  async function unzip(zip, dir) {
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const r = process.platform === 'win32'
      ? await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:EST_ZIP -DestinationPath $env:EST_DIR -Force'], { env: { ...process.env, EST_ZIP: zip, EST_DIR: dir } })
      : await run('unzip', ['-q', '-o', zip, '-d', dir]);
    if (r.err) throw new Error('The update file couldn’t be opened. Is it an Estudiamos .zip?');
  }
  function findApp(dir) {   // the StudyCards folder inside the unzipped package
    const has = d => fs.existsSync(path.join(d, 'release-manifest.json')) && fs.existsSync(path.join(d, 'server.js'));
    if (has(dir)) return dir;
    for (const a of fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory())) {
      const d1 = path.join(dir, a.name); if (has(d1)) return d1;
      for (const b of fs.readdirSync(d1, { withFileTypes: true }).filter(e => e.isDirectory())) { const d2 = path.join(d1, b.name); if (has(d2)) return d2; }
    }
    throw new Error('This isn’t an Estudiamos update package (it has no signed file list).');
  }
  async function verify(app) {
    const key = pubKey(); if (!key) throw new Error('This copy of Estudiamos has no update key, so it can’t check updates. Install the new version by hand.');
    const text = fs.readFileSync(path.join(app, 'release-manifest.json'));
    let sig; try { sig = Buffer.from(fs.readFileSync(path.join(app, 'release-manifest.sig'), 'utf8').trim(), 'base64'); } catch { sig = null; }
    if (!sig || !crypto.verify(null, text, key, sig)) throw new Error('The update’s signature is wrong, so it was refused. It may not come from the real publisher.');
    const m = JSON.parse(text);
    if (m.app !== 'estudiamos' || !validVer(m.version) || !m.files) throw new Error('The update’s file list looks wrong.');
    const ver = readJson(path.join(app, 'version.json'), {}).version; if (ver !== m.version) throw new Error('The update’s version number doesn’t match its file list.');
    const have = listFiles(app).filter(f => !SKIP_IN_MANIFEST.has(f));
    const want = Object.keys(m.files);
    const extra = have.filter(f => !(f in m.files)), missing = want.filter(f => !have.includes(f));
    if (extra.length || missing.length) throw new Error(`The update has ${extra.length ? 'files that shouldn’t be there' : 'missing files'}, so it was refused.`);
    for (const [f, h] of Object.entries(m.files)) if (await sha256File(path.join(app, ...f.split('/'))) !== h) throw new Error(`“${f}” in the update was changed, so it was refused.`);
    // the new server has to at least start: check its code for mistakes
    for (const f of ['server.js', 'updater.js', 'syncmerge.js', 'mailer.js'].filter(f => fs.existsSync(path.join(app, f)))) {
      const r = await run(process.execPath, ['--check', path.join(app, f)]); if (r.err) throw new Error(`The update’s ${f} has a mistake in it, so it was refused.`);
    }
    return m.version;
  }
  function backupCards(tag) {
    beforeSwap();   // write everything to disk first
    const src = path.join(DATA, 'sync.json');
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(UP, `cards-before-${tag}-${Date.now()}.json`));
    const old = fs.readdirSync(UP).filter(n => /^cards-before-/.test(n)).sort((a, b) => fs.statSync(path.join(UP, a)).mtimeMs - fs.statSync(path.join(UP, b)).mtimeMs);
    for (const n of old.slice(0, Math.max(0, old.length - 3))) fs.rmSync(path.join(UP, n), { force: true });
  }
  async function swap(mode, newApp) {
    if (process.platform !== 'win32') throw new Error('Updating by itself only works on Windows. Replace the StudyCards folder by hand.');
    const helper = path.join(UP, 'apply-update.ps1');
    fs.writeFileSync(helper, HELPER_PS1);
    fs.rmSync(RESULT, { force: true });
    const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', helper, '-ProcId', String(process.pid), '-App', APP, '-Prev', PREV, '-Mode', mode,
      '-Result', RESULT, '-Node', process.execPath, '-Port', String(PORT), '-Data', DATA, ...(newApp ? ['-New', newApp] : [])];
    // Start the helper through Windows itself (WMI), so it keeps running after this server stops, however the server was started.
    // (A program started the normal way can be closed together with the server.) The plain way is the fallback.
    const line = 'powershell.exe ' + args.map(a => /[\s"]/.test(a) ? '"' + a.replace(/"/g, '') + '"' : a).join(' ');
    const r = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
      '$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = $env:EST_CMD; CurrentDirectory = $env:EST_DIR }; exit $r.ReturnValue'],
      { env: { ...process.env, EST_CMD: line, EST_DIR: UP }, timeout: 30000 });
    if (r.err) spawn('powershell.exe', args, { detached: true, stdio: 'ignore', cwd: UP, windowsHide: true }).unref();
    job.stage = 'restarting';
    setTimeout(exitNow, 600);   // let the answer reach the app first
  }
  async function install(source) {
    if (job && !['failed'].includes(job.stage)) throw new Error('An update is already running.');
    job = { stage: 'download', pct: 0, version: source.version || null, error: null };
    (async () => {
      try {
        let zip = source.zip;
        if (!zip) { zip = path.join(UP, 'download.zip'); await download(source.url, source.sha256, source.size, zip); }
        job.stage = 'check'; job.pct = 100;
        const dir = path.join(UP, 'new'); await unzip(zip, dir);
        const app = findApp(dir), ver = await verify(app);
        if (cmpVer(ver, current()) <= 0) throw new Error(`That’s version ${ver}, and you already have ${current()}.`);
        job.version = ver; job.stage = 'backup'; backupCards(ver);
        await swap('update', app);
      } catch (e) { job.stage = 'failed'; job.error = String(e.message || e); }
    })();
  }
  const status = () => ({ current: current(), hasFeed: !!feed(), canVerify: !!pubKey(), windows: process.platform === 'win32', autoCheck: state.autoCheck !== false, lastCheck: state.lastCheck || 0,
    available: state.available, previous: prevVersion(), job, result });

  async function handle(p, req, res, send, readBody) {
    if (p === '/api/update/status') { maybeAutoCheck(); return send(res, 200, status()); }
    if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
    if (p === '/api/update/check') { try { await check(); return send(res, 200, status()); } catch (e) { return send(res, 200, { ...status(), checkError: String(e.message || e) }); } }
    if (p === '/api/update/install') { const a = state.available; if (!a) return send(res, 400, { error: 'There’s no update to install. Check for updates first.' }); await install(a); return send(res, 200, status()); }
    if (p === '/api/update/upload') {
      const buf = await readBody(req); if (buf.length < 100 || buf[0] !== 0x50 || buf[1] !== 0x4b) return send(res, 400, { error: 'That isn’t a .zip file.' });
      const zip = path.join(UP, 'upload.zip'); fs.writeFileSync(zip, buf); await install({ zip }); return send(res, 200, status());
    }
    if (p === '/api/update/rollback') {
      const pv = prevVersion(); if (!pv) return send(res, 400, { error: 'There’s no earlier version saved on this PC.' });
      if (job && job.stage !== 'failed') return send(res, 400, { error: 'An update is already running.' });
      job = { stage: 'backup', pct: 100, version: pv, error: null };
      try { backupCards('rollback'); await swap('rollback'); } catch (e) { job.stage = 'failed'; job.error = String(e.message || e); }
      return send(res, 200, status());
    }
    if (p === '/api/update/settings') { const b = JSON.parse((await readBody(req)).toString() || '{}'); if ('autoCheck' in b) state.autoCheck = !!b.autoCheck; save(); return send(res, 200, status()); }
    if (p === '/api/update/ack') { result = null; fs.rmSync(RESULT, { force: true }); if (job?.stage === 'failed') job = null; return send(res, 200, status()); }
    return send(res, 404, { error: 'Unknown update command' });
  }
  return { handle, current };
};

/* The helper that does the swap after the server has stopped (the app folder can't change while the server runs from it). */
const HELPER_PS1 = String.raw`param([int]$ProcId, [string]$App, [string]$New = '', [string]$Prev, [string]$Mode, [string]$Result, [string]$Node, [string]$Port = '', [string]$Data = '')
$ErrorActionPreference = 'Stop'
function Report($ok, $msg, $ver) { @{ ok = $ok; mode = $Mode; message = $msg; version = $ver; time = (Get-Date).ToString('o') } | ConvertTo-Json | Set-Content -Encoding UTF8 -LiteralPath $Result }
function Mirror($from, $to) { robocopy $from $to /MIR /R:5 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null; if ($LASTEXITCODE -ge 8) { throw "copy failed ($LASTEXITCODE)" } }
try { Wait-Process -Id $ProcId -Timeout 40 -ErrorAction SilentlyContinue } catch {}
Start-Sleep -Milliseconds 400
$ver = $null
try {
  if ($Mode -eq 'update') {
    Mirror $App $Prev          # keep the version you have now, so you can go back
    Mirror $New $App
  } else {
    Mirror $Prev $App          # go back to the saved version
  }
  try { $ver = (Get-Content -Raw -LiteralPath (Join-Path $App 'version.json') | ConvertFrom-Json).version } catch {}
  Report $true '' $ver
} catch {
  $err = "$_"
  if ($Mode -eq 'update' -and (Test-Path (Join-Path $Prev 'server.js'))) { try { Mirror $Prev $App } catch {} }
  Report $false $err $null
}
if ($New -and (Test-Path $New)) { Remove-Item -LiteralPath (Split-Path -Parent $New) -Recurse -Force -ErrorAction SilentlyContinue }
if ($Port) { $env:ESTUDIAR_PORT = $Port }   # the same port and data folder as before
if ($Data) { $env:ESTUDIAR_DATA = $Data }
Start-Process -FilePath $Node -ArgumentList ('"' + (Join-Path $App 'server.js') + '"') -WorkingDirectory $App -WindowStyle Hidden
`;
