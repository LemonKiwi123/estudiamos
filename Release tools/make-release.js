'use strict';
/* ================= Make an Estudiamos release =================
   node make-release.js 1.1.0 [--notes "What's new"] [--notes-file notes.txt] [--out folder] [--feed URL] [--zip-base URL] [--test]

   1. The first time, makes your signing key:
        PRIVATE-signing-key.pem  stays in this folder. NEVER share it. Back it up (USB stick, password manager).
                                 Without it you can't make updates that existing copies will accept.
        StudyCards\update-key.pem  the matching public key, shipped inside the app so it can check updates.
   2. Copies the app (StudyCards) to a clean folder and stamps the version number into it.
   3. Writes release-manifest.json (every file + its fingerprint) and signs it.
   4. Zips it: Releases\Estudiamos-<version>.zip, with READ ME FIRST.txt and the setup shortcut.
   5. Writes Releases\latest.json: the little file the app reads to find out about new versions.
   Settings live in release-config.json next to this file:
     feed     where copies of the app look for latest.json      e.g. https://github.com/NAME/estudiamos/releases/latest/download/latest.json
     zipBase  where the .zip files can be downloaded from       e.g. https://github.com/NAME/estudiamos/releases/download/v{version}/
   --test     doesn't change your own StudyCards folder (used for trying out the updater). */
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFileSync } = require('child_process');

const TOOLS = __dirname, ROOT = path.dirname(TOOLS);
const args = process.argv.slice(2), flag = n => args.includes('--' + n), opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : undefined; };
const version = args.find(a => /^\d+\.\d+\.\d+$/.test(a));
const fail = m => { console.error('\n✖ ' + m + '\n'); process.exit(1); };
if (!version) fail('Give a version number like 1.1.0, for example:  node make-release.js 1.1.0 --notes "New games"');

const cfgFile = path.join(TOOLS, 'release-config.json');
const cfg = { feed: '', zipBase: '', ...(fs.existsSync(cfgFile) ? JSON.parse(fs.readFileSync(cfgFile, 'utf8')) : {}) };
const SRC = path.resolve(opt('src') || path.join(ROOT, 'StudyCards'));
const OUT = path.resolve(opt('out') || path.join(ROOT, 'Releases'));
const feed = opt('feed') ?? cfg.feed, zipBase = (opt('zip-base') ?? cfg.zipBase).replace(/\{version\}/g, version);
const test = flag('test');
let notes = opt('notes') || (opt('notes-file') && fs.readFileSync(opt('notes-file'), 'utf8')) || '';
const notesFile = path.join(TOOLS, 'notes', version + '.txt'); if (!notes && fs.existsSync(notesFile)) notes = fs.readFileSync(notesFile, 'utf8');
notes = notes.trim() || 'Improvements and fixes.';
if (!fs.existsSync(path.join(SRC, 'server.js'))) fail('Can’t find the app at ' + SRC);

const cmpVer = (a, b) => { const x = a.split('.').map(Number), y = b.split('.').map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
const srcVersion = JSON.parse(fs.readFileSync(path.join(SRC, 'version.json'), 'utf8')).version;
if (!test && cmpVer(version, srcVersion) < 0) fail(`${version} is older than the app’s current version ${srcVersion}.`);

// ---- 1. signing key ----
const KEY = path.join(TOOLS, 'PRIVATE-signing-key.pem');
if (!fs.existsSync(KEY)) {
  const { privateKey } = crypto.generateKeyPairSync('ed25519');
  fs.writeFileSync(KEY, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  console.log('🔑 Made a new signing key: ' + KEY + '\n   Back it up somewhere safe and never share it.');
}
const priv = crypto.createPrivateKey(fs.readFileSync(KEY));
const pubPem = crypto.createPublicKey(priv).export({ type: 'spki', format: 'pem' });
const pubFile = path.join(SRC, 'update-key.pem');
if (!fs.existsSync(pubFile) || fs.readFileSync(pubFile, 'utf8') !== pubPem) { fs.writeFileSync(pubFile, pubPem); console.log('   Put the matching public key in StudyCards\\update-key.pem'); }

// ---- 2. clean copy with the version stamped in ----
const name = `Estudiamos-${version}`, stage = path.join(OUT, name), app = path.join(stage, 'StudyCards');
const SKIP = /^(estudiar-fun\.ico|icon-256-fun\.png|release-manifest\.(json|sig)|node_modules|\..*)$/i;
fs.rmSync(stage, { recursive: true, force: true }); fs.mkdirSync(app, { recursive: true });
(function copy(from, to) {
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP.test(e.name)) continue;
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) { fs.mkdirSync(b, { recursive: true }); copy(a, b); } else fs.copyFileSync(a, b);
  }
})(SRC, app);
const stamp = (file, re, to) => { const f = path.join(app, file), s = fs.readFileSync(f, 'utf8'); if (!re.test(s)) fail(`Couldn’t find the version in ${file}`); fs.writeFileSync(f, s.replace(re, to)); };
fs.writeFileSync(path.join(app, 'version.json'), JSON.stringify({ version }, null, 2) + '\n');
fs.writeFileSync(path.join(app, 'update.json'), JSON.stringify({ feed }, null, 2) + '\n');
stamp('index.html', /const APP_VERSION = '[^']*';/, `const APP_VERSION = '${version}';`);
stamp('sw.js', /const CACHE = 'estudiar-app-v(\d+)[^']*';/, `const CACHE = 'estudiar-app-v$1-${version}';`);   // phones fetch a fresh copy

// ---- 3. signed file list ----
const list = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else list.push(f); } })(app);
const files = {};
for (const f of list.sort()) files[path.relative(app, f).split(path.sep).join('/')] = crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const manifest = Buffer.from(JSON.stringify({ app: 'estudiamos', version, date: new Date().toISOString().slice(0, 10), files }, null, 1));
fs.writeFileSync(path.join(app, 'release-manifest.json'), manifest);
fs.writeFileSync(path.join(app, 'release-manifest.sig'), crypto.sign(null, manifest, priv).toString('base64') + '\n');

// ---- 4. read-me, setup shortcut, zip ----
const tpl = fs.readFileSync(path.join(TOOLS, 'READ ME FIRST.txt'), 'utf8').replace(/\{\{VERSION\}\}/g, version);
fs.writeFileSync(path.join(stage, 'READ ME FIRST.txt'), '﻿' + tpl.replace(/\r?\n/g, '\r\n'));
fs.writeFileSync(path.join(stage, 'Set up Estudiamos.cmd'), '@echo off\r\nrem Installs Estudiamos on this PC. See READ ME FIRST.txt.\r\ncall "%~dp0StudyCards\\Set up Estudiamos.cmd"\r\n');
const zip = path.join(OUT, name + '.zip');
fs.rmSync(zip, { force: true });
execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Compress-Archive -LiteralPath $env:EST_STAGE -DestinationPath $env:EST_ZIP -CompressionLevel Optimal'], { env: { ...process.env, EST_STAGE: stage, EST_ZIP: zip }, stdio: 'inherit' });

// ---- 5. latest.json ----
const zipBuf = fs.readFileSync(zip), sha256 = crypto.createHash('sha256').update(zipBuf).digest('hex');
const latest = { app: 'estudiamos', version, date: new Date().toISOString().slice(0, 10), notes, url: zipBase ? zipBase.replace(/\/?$/, '/') + name + '.zip' : '', sha256, size: zipBuf.length };
fs.writeFileSync(path.join(OUT, 'latest.json'), JSON.stringify(latest, null, 2) + '\n');

// ---- your own copy of the app gets the same version number ----
if (!test) {
  fs.writeFileSync(path.join(SRC, 'version.json'), JSON.stringify({ version }, null, 2) + '\n');
  fs.writeFileSync(path.join(SRC, 'update.json'), JSON.stringify({ feed }, null, 2) + '\n');
  const ix = path.join(SRC, 'index.html'); fs.writeFileSync(ix, fs.readFileSync(ix, 'utf8').replace(/const APP_VERSION = '[^']*';/, `const APP_VERSION = '${version}';`));
}

console.log(`\n✔ Estudiamos ${version} is ready
   ${zip}  (${(zipBuf.length / 1048576).toFixed(1)} MB)
   ${path.join(OUT, 'latest.json')}
   SHA-256: ${sha256}
   Files: ${Object.keys(files).length}, signed.`);
if (!feed) console.log('\n   Note: no update address (feed) is set, so copies of this version can only update "from file".\n   Set "feed" and "zipBase" in release-config.json to turn on automatic updates.');
else console.log(`\n   To publish: upload BOTH files (${name}.zip and latest.json) so that\n     ${feed}  gives latest.json, and\n     ${latest.url || '(set zipBase!)'}  gives the zip.`);
