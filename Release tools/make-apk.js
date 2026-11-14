#!/usr/bin/env node
'use strict';
/* Builds the Android app: Releases\Estudiamos-<version>.apk
   The whole web app (the files listed in StudyCards\sw.js, plus lib\) goes inside the APK and runs offline.
   Uses only the Android SDK and JDK already on this PC (no Gradle, no downloads):
   aapt2 (resources) -> javac -> d8 (dex) -> zipalign -> apksigner.
   The signing key is "Release tools\PRIVATE-android-key.jks" (its password is in PRIVATE-android-key.txt).
   Both are made the first time and must NEVER be shared or uploaded. Keep a backup: every future update
   of the app has to be signed with the same key, or phones will refuse to install it over the old one. */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..'), APP = path.join(ROOT, 'StudyCards'), AND = path.join(ROOT, 'Android app'), OUT = path.join(AND, 'build');
const SDK = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
const newest = dir => fs.readdirSync(dir).filter(x => /^[\d.]+$|^android-\d+$/.test(x)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop();
const BT = path.join(SDK, 'build-tools', newest(path.join(SDK, 'build-tools'))), JAR = path.join(SDK, 'platforms', newest(path.join(SDK, 'platforms')), 'android.jar');
const JAVA = process.env.JAVA_HOME ? path.join(process.env.JAVA_HOME, 'bin') : '';
const tool = n => { for (const p of [path.join(BT, n + '.exe'), path.join(BT, n + '.bat'), path.join(BT, n)]) if (fs.existsSync(p)) return p; throw new Error('Missing build tool ' + n + ' in ' + BT); };
const jtool = n => JAVA && fs.existsSync(path.join(JAVA, n + '.exe')) ? path.join(JAVA, n + '.exe') : n;
const run = (cmd, args) => { const bat = /\.bat$/i.test(cmd); execFileSync(bat ? 'cmd.exe' : cmd, bat ? ['/c', cmd, ...args] : args, { stdio: ['ignore', 'inherit', 'inherit'] }); };
const rm = p => fs.rmSync(p, { recursive: true, force: true });
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

const version = JSON.parse(fs.readFileSync(path.join(APP, 'version.json'), 'utf8')).version;
const [ma, mi, pa] = version.split('.').map(Number), code = ma * 10000 + mi * 100 + pa;
console.log(`Building Estudiamos ${version} for Android (version code ${code})`);
rm(OUT); fs.mkdirSync(OUT, { recursive: true });

// 1. the web app
const sw = fs.readFileSync(path.join(APP, 'sw.js'), 'utf8'), list = JSON.parse(sw.match(/const FILES = (\[[\s\S]*?\]);/)[1].replace(/'/g, '"'));
const www = path.join(OUT, 'assets', 'www');
for (const f of list.filter(f => f !== './')) { const src = path.join(APP, f); if (!fs.existsSync(src)) { console.warn('  (missing, skipped) ' + f); continue; } fs.mkdirSync(path.dirname(path.join(www, f)), { recursive: true }); fs.copyFileSync(src, path.join(www, f)); }
for (const f of walk(path.join(APP, 'lib'))) { const rel = path.relative(APP, f), dst = path.join(www, rel); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(f, dst); }
console.log(`  ${walk(www).length} app files`);

// 2. resources: the launcher icon
const res = path.join(OUT, 'res');
for (const [dpi, icon] of [['mipmap-xxhdpi', 'icon-180.png'], ['mipmap-xxxhdpi', 'icon-192.png']]) { fs.mkdirSync(path.join(res, dpi), { recursive: true }); fs.copyFileSync(path.join(APP, icon), path.join(res, dpi, 'ic_launcher.png')); }
run(tool('aapt2'), ['compile', '--dir', res, '-o', path.join(OUT, 'res.zip')]);
run(tool('aapt2'), ['link', '-o', path.join(OUT, 'unsigned.apk'), '-I', JAR, '--manifest', path.join(AND, 'AndroidManifest.xml'),
  '--java', path.join(OUT, 'gen'), '--version-code', String(code), '--version-name', version, '--min-sdk-version', '24', '--target-sdk-version', '35', '-0', 'wasm', path.join(OUT, 'res.zip')]);

// 3. code
const java = [...walk(path.join(AND, 'src')), ...walk(path.join(OUT, 'gen'))].filter(f => f.endsWith('.java'));
run(jtool('javac'), ['-nowarn', '-source', '11', '-target', '11', '-encoding', 'UTF-8', '-classpath', JAR, '-d', path.join(OUT, 'classes'), ...java]);
fs.mkdirSync(path.join(OUT, 'dex'));
run(tool('d8'), ['--release', '--min-api', '24', '--lib', JAR, '--output', path.join(OUT, 'dex'), ...walk(path.join(OUT, 'classes')).filter(f => f.endsWith('.class'))]);
run(tool('aapt'), ['add', '-k', path.join(OUT, 'unsigned.apk'), path.join(OUT, 'dex', 'classes.dex')]);
// the app files go in with the JDK's jar tool, which always writes forward-slash paths (aapt on Windows would use backslashes)
run(jtool('jar'), ['uf', path.join(OUT, 'unsigned.apk'), '-C', OUT, 'assets']);

// 4. align and sign
run(tool('zipalign'), ['-f', '-p', '4', path.join(OUT, 'unsigned.apk'), path.join(OUT, 'aligned.apk')]);
const ks = path.join(__dirname, 'PRIVATE-android-key.jks'), pwFile = path.join(__dirname, 'PRIVATE-android-key.txt');
if (!fs.existsSync(ks)) {
  const pw = crypto.randomBytes(18).toString('base64url');
  fs.writeFileSync(pwFile, pw + '\n');
  run(jtool('keytool'), ['-genkeypair', '-keystore', ks, '-storepass', pw, '-keypass', pw, '-alias', 'estudiamos', '-keyalg', 'RSA', '-keysize', '3072', '-validity', '10000', '-dname', 'CN=Estudiamos, O=LemonKiwi123']);
  console.log('  Made a new Android signing key. BACK UP Release tools\\PRIVATE-android-key.jks and PRIVATE-android-key.txt!');
}
const pw = fs.readFileSync(pwFile, 'utf8').trim(), rel = path.join(ROOT, 'Releases'); fs.mkdirSync(rel, { recursive: true });
const apk = path.join(rel, `Estudiamos-${version}.apk`);
run(tool('apksigner'), ['sign', '--ks', ks, '--ks-pass', 'pass:' + pw, '--ks-key-alias', 'estudiamos', '--out', apk, path.join(OUT, 'aligned.apk')]);
run(tool('apksigner'), ['verify', apk]);
rm(path.join(rel, `Estudiamos-${version}.apk.idsig`));
const sha = crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');
console.log(`\nDone: ${apk}\n  ${(fs.statSync(apk).size / 1048576).toFixed(1)} MB · SHA-256 ${sha}`);
