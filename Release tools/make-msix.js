#!/usr/bin/env node
'use strict';
/* ================= Build the Microsoft Store package (MSIX) =================
   node "Release tools\make-msix.js"
   Makes Releases\Estudiamos-<version>.msix with:
     Estudiamos.exe   a small launcher (Release tools\store\Launcher.cs, built with Windows' own C# compiler)
     node\node.exe    Node.js, so nothing else needs installing (from Release tools\store-tools\node)
     app\             the StudyCards app (without the setup scripts and the self-updater's feed)
     images\          tiles and logos (Release tools\store\make-images.ps1)
   The package is NOT signed: the Microsoft Store signs it when you submit it.
   Before the real submission, copy your app's identity from Partner Center (Product management > Product identity)
   into Release tools\store\store-identity.json: { "name": "…", "publisher": "CN=…", "publisherName": "…" }. */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), TOOLS = __dirname, STORE = path.join(TOOLS, 'store'), KIT = path.join(TOOLS, 'store-tools');
const SRC = path.join(ROOT, 'StudyCards'), OUT = path.join(ROOT, 'Releases');
const fail = m => { console.error('✖ ' + m); process.exit(1); };

const version = JSON.parse(fs.readFileSync(path.join(SRC, 'version.json'), 'utf8')).version;
if (!/^\d+\.\d+\.\d+$/.test(version)) fail('version.json needs a version like 1.4.4');
const idFile = path.join(STORE, 'store-identity.json');
const id = fs.existsSync(idFile) ? JSON.parse(fs.readFileSync(idFile, 'utf8')) : { name: 'Estudiamos.TestBuild', publisher: 'CN=Estudiamos Test', publisherName: 'Estudiamos', test: true };
const makeappx = path.join(KIT, 'makeappx', 'makeappx.exe'), nodeExe = path.join(KIT, 'node', 'node.exe');
const csc = path.join(process.env.WINDIR || 'C:\\Windows', 'Microsoft.NET', 'Framework64', 'v4.0.30319', 'csc.exe');
for (const [f, what] of [[makeappx, 'MakeAppx'], [nodeExe, 'Node.js'], [csc, 'the C# compiler']]) if (!fs.existsSync(f)) fail(`Can’t find ${what}: ${f}`);

// ---- 1. a clean folder with everything in it ----
const stage = path.join(OUT, 'msix-stage');
fs.rmSync(stage, { recursive: true, force: true });
const app = path.join(stage, 'app'); fs.mkdirSync(app, { recursive: true });
// left out: setup and start scripts (the Store installs it), the update feed (the Store updates it), the fun icons, release files
const SKIP = /^(estudiar-fun\.ico|icon-256-fun\.png|release-manifest\.(json|sig)|update\.json|setup(-gui)?\.ps1|.*\.cmd|.*\.vbs|node_modules|\..*)$/i;
(function copy(from, to) {
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (SKIP.test(e.name)) continue;
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) { fs.mkdirSync(b, { recursive: true }); copy(a, b); } else fs.copyFileSync(a, b);
  }
})(SRC, app);
fs.mkdirSync(path.join(stage, 'node'));
fs.copyFileSync(nodeExe, path.join(stage, 'node', 'node.exe'));
if (fs.existsSync(path.join(KIT, 'node', 'LICENSE'))) fs.copyFileSync(path.join(KIT, 'node', 'LICENSE'), path.join(stage, 'node', 'LICENSE.txt'));

// ---- 2. tiles and logos ----
const imgs = path.join(STORE, 'images');
if (!fs.existsSync(path.join(imgs, 'Square150x150Logo.png'))) execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(STORE, 'make-images.ps1')], { stdio: 'inherit' });
fs.mkdirSync(path.join(stage, 'images'));
for (const f of fs.readdirSync(imgs)) fs.copyFileSync(path.join(imgs, f), path.join(stage, 'images', f));

// ---- 3. the launcher ----
execFileSync(csc, ['/nologo', '/target:winexe', '/optimize+', `/out:${path.join(stage, 'Estudiamos.exe')}`, `/win32icon:${path.join(SRC, 'estudiar.ico')}`,
  '/r:System.Windows.Forms.dll', path.join(STORE, 'Launcher.cs')], { stdio: 'inherit' });

// ---- 4. the package description ----
const xmlEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const manifest = fs.readFileSync(path.join(STORE, 'AppxManifest.template.xml'), 'utf8')
  .replace('{{NAME}}', xmlEsc(id.name)).replace('{{PUBLISHER}}', xmlEsc(id.publisher)).replace('{{PUBLISHER_NAME}}', xmlEsc(id.publisherName))
  .replace('{{VERSION}}', version + '.0');   // the Store wants the 4th number to be 0
fs.writeFileSync(path.join(stage, 'AppxManifest.xml'), manifest);

// ---- 5. pack ----
const out = path.join(OUT, `Estudiamos-${version}${id.test ? '-TEST' : ''}.msix`);
fs.rmSync(out, { force: true });
execFileSync(makeappx, ['pack', '/d', stage, '/p', out, '/o'], { stdio: 'inherit' });
const mb = (fs.statSync(out).size / 1048576).toFixed(1);
console.log(`\n✔ ${out}  (${mb} MB)`);
if (id.test) console.log('   This is a TEST build: copy your identity from Partner Center into Release tools\\store\\store-identity.json, then build again for the Store.');
