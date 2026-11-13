'use strict';
/* ================= Email sending for the Estudiamos server (no extra packages) =================
   A small SMTP client: implicit TLS (port 465, e.g. Gmail) or STARTTLS (port 587).
   The account password (for Gmail an "app password") is stored encrypted with Windows DPAPI,
   so only your Windows account on this PC can read it. It is never sent to the app or to phones. */
const tls = require('tls'), net = require('net'), fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFile } = require('child_process');

/* ---------- Protecting the password (Windows DPAPI via PowerShell) ---------- */
function ps(script, env) {
  return new Promise((resolve, reject) => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { env: { ...process.env, ...env }, windowsHide: true, timeout: 20000 },
      (err, out) => err ? reject(new Error('Windows could not protect the password')) : resolve(String(out).trim()));
  });
}
async function protect(secret) {
  if (process.platform !== 'win32') return 'b64:' + Buffer.from(secret).toString('base64');
  return 'dpapi:' + await ps('ConvertFrom-SecureString (ConvertTo-SecureString -String $env:EST_SECRET -AsPlainText -Force)', { EST_SECRET: secret });
}
async function unprotect(blob) {
  if (!blob) return '';
  if (blob.startsWith('b64:')) return Buffer.from(blob.slice(4), 'base64').toString();
  if (blob.startsWith('dpapi:')) return ps('$s = ConvertTo-SecureString $env:EST_BLOB; [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))', { EST_BLOB: blob.slice(6) });
  return '';
}

/* ---------- SMTP ---------- */
const b64 = s => Buffer.from(s, 'utf8').toString('base64');
const hdr = s => /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`;
function buildMessage({ from, to, subject, text }) {
  const body = b64(text.replace(/\r?\n/g, '\r\n')).replace(/.{1,76}/g, '$&\r\n');
  const domain = (from.split('@')[1] || 'estudiamos.local').replace(/[^\w.-]/g, '');
  return [`From: ${hdr('Estudiamos')} <${from}>`, `To: <${to}>`, `Subject: ${hdr(subject)}`, `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomBytes(12).toString('hex')}@${domain}>`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: base64', '', body].join('\r\n');
}
function smtpSend({ host, port, user, pass, from, to, subject, text, rejectUnauthorized = true }) {
  return new Promise((resolve, reject) => {
    let sock, buf = '', waiting = null, done = false, pend = [];
    const early = [];
    const fail = e => { if (done) return; done = true; try { sock?.destroy(); } catch {} reject(e instanceof Error ? e : new Error(String(e))); };
    const timer = setTimeout(() => fail(new Error('The mail server did not answer in time.')), 25000);
    const onData = d => {   // replies are lines like "250-..." (more follows) or "250 ..." (last line)
      buf += d.toString('utf8');
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).replace(/\r$/, ''); buf = buf.slice(i + 1);
        const mm = /^(\d{3})([ -]?)(.*)$/.exec(line); if (!mm) continue;
        pend.push(mm[3]);
        if (mm[2] !== '-') { const full = { code: +mm[1], text: pend.join(' ') }; pend = []; const w = waiting; waiting = null; if (w) w(full); else early.push(full); }
      }
    };
    const expect = (codes, cmd) => new Promise((res, rej) => {
      const handle = r => codes.includes(r.code) ? res(r) : rej(new Error(niceError(r)));
      if (cmd != null) sock.write(cmd + '\r\n');
      if (early.length) handle(early.shift()); else waiting = handle;
    });
    const attach = s => { sock = s; s.on('data', onData); s.on('error', e => fail(new Error(e.code === 'ENOTFOUND' ? `Can’t find the mail server “${host}”. Is this PC online?` : e.message))); };
    const run = async () => {
      try {
        const implicit = +port === 465;
        attach(implicit ? tls.connect({ host, port, ...(net.isIP(host) ? {} : { servername: host }), rejectUnauthorized }) : net.connect({ host, port }));
        await expect([220]);
        await expect([250], 'EHLO estudiamos');
        if (!implicit) {
          await expect([220], 'STARTTLS');
          sock.removeListener('data', onData); buf = ''; pend = [];
          const secure = tls.connect({ socket: sock, ...(net.isIP(host) ? {} : { servername: host }), rejectUnauthorized });
          await new Promise((res, rej) => { secure.once('secureConnect', res); secure.once('error', rej); });
          attach(secure); await expect([250], 'EHLO estudiamos');
        }
        await expect([235], 'AUTH PLAIN ' + Buffer.from(`\0${user}\0${pass}`).toString('base64'));
        await expect([250], `MAIL FROM:<${from}>`);
        await expect([250, 251], `RCPT TO:<${to}>`);
        await expect([354], 'DATA');
        const msg = buildMessage({ from, to, subject, text }).replace(/^\./gm, '..');
        await expect([250], msg + '\r\n.');
        sock.write('QUIT\r\n'); done = true; clearTimeout(timer); sock.end(); resolve(true);
      } catch (e) { clearTimeout(timer); fail(e); }
    };
    run();
  });
}
function niceError(r) {
  if (r.code === 535 || r.code === 534) return 'The email address or app password was not accepted. For Gmail, use an app password, not your normal password.';
  if (r.code === 530) return 'The mail server wants a secure sign-in first. Check the server and port.';
  if (r.code >= 550 && r.code < 560) return 'The mail server refused to send to that address.';
  return `The mail server said: ${r.code} ${String(r.text).slice(0, 120)}`;
}

/* ---------- Saved settings ---------- */
function mailStore(dataDir) {
  const file = path.join(dataDir, 'mail.json');
  const read = () => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; } };
  const write = obj => { const tmp = file + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(obj)); fs.renameSync(tmp, file); };
  return {
    get: read,
    publicInfo() { const c = read(); return c ? { from: c.from, to: c.to, host: c.host, port: c.port, lastSent: c.lastSent || null } : null; },
    async save({ from, to, pass, host, port }) {
      const old = read() || {};
      const c = { from: from.trim(), to: (to || from).trim(), host: (host || 'smtp.gmail.com').trim(), port: +port || 465, secret: pass ? await protect(pass.replace(/\s+/g, '')) : old.secret };
      if (!c.secret) throw new Error('Type the app password.');
      write(c); return c;
    },
    off() { try { fs.unlinkSync(file); } catch {} },
    async send(subject, text, opts = {}) {
      const c = read(); if (!c) throw new Error('Email isn’t set up on the PC yet.');
      const pass = await unprotect(c.secret); if (!pass) throw new Error('The saved app password can’t be read on this PC. Set up email again.');
      await smtpSend({ host: c.host, port: c.port, user: c.from, pass, from: c.from, to: c.to, subject, text, ...opts });
      c.lastSent = Date.now(); write(c); return c.to;
    },
  };
}
const maskEmail = e => { const [u, d] = String(e).split('@'); return d ? `${u.slice(0, 1)}•••${u.length > 1 ? u.slice(-1) : ''}@${d}` : '•••'; };
module.exports = { mailStore, maskEmail, smtpSend, protect, unprotect };
