'use strict';
/* ================= Phone setup guide =================
   Step-by-step help for using Estudiamos on a phone:
   1. At home on the same Wi-Fi (quickest), 2. anywhere, securely, with Tailscale (free private network between your own devices),
   3. putting the app on the home screen.
   On the PC it checks each Tailscale step for you (asks the Tailscale program on this PC; nothing is sent anywhere). */
const PG_TS_DOWNLOAD = 'https://tailscale.com/download';
const PG_TS_DNS = 'https://login.tailscale.com/admin/dns';
// made-up examples, so people know what an address looks like (each PC shows its own real one)
const PG_EX_WIFI = 'http://192.168.1.25:5178', PG_EX_TS = 'https://my-pc.tail1234.ts.net';
const pgEx = a => `<span class="pg-ex">for example <code>${a}</code></span>`;
let pgStatus = null;
const pgOnPC = () => typeof SYNC !== 'undefined' && SYNC.enabled && SYNC.local && !SYNC_FILE;
const pgCheck = (ok, unknown) => unknown ? '<span class="pg-st">•</span>' : ok ? '<span class="pg-st ok" title="Done">✓</span>' : '<span class="pg-st todo" title="Not done yet"></span>';

function pgTailscaleSteps() {
  const t = pgStatus?.old ? null : pgStatus, pc = pgOnPC(), u = !pc || !t;   // u = can't check from here
  const phones = t?.phones || [];
  const url = t?.url;
  const step = (ok, title, body) => `<li class="pg-step ${!u && ok ? 'done' : ''}">${pgCheck(ok, u)}<div><b>${title}</b><div class="small">${body}</div></div></li>`;
  return `<ol class="pg-steps">
    ${step(t?.installed, 'Install Tailscale on this PC', `Get the free Windows app from <a href="${PG_TS_DOWNLOAD}" target="_blank" rel="noopener">tailscale.com/download</a> and install it.`)}
    ${step(t?.running, 'Sign in on this PC', `Open Tailscale (its icon is near the clock), choose <b>Log in</b> and sign in with Google, Microsoft or Apple. ${t?.installed && !t?.running && t?.state ? `<span class="muted">Right now Tailscale says: ${esc(t.state)}.</span>` : ''}`)}
    ${step(phones.length, 'Install Tailscale on your phone', `Get <b>Tailscale</b> from the App Store or Google Play and sign in with the <b>same account</b>. Then turn on the switch in the app. ${phones.length ? `<span class="muted">Found: ${phones.map(p => esc(p.name) + (p.online ? '' : ' (offline)')).join(', ')}.</span>` : ''}`)}
    ${step(t?.https, 'Turn on secure (HTTPS) addresses', `Open the <a href="${PG_TS_DNS}" target="_blank" rel="noopener">Tailscale DNS page</a>, make sure <b>MagicDNS</b> is on, then press <b>Enable HTTPS</b>. You only do this once.`)}
    ${step(t?.serving, 'Share Estudiamos on your Tailscale network', pc && t?.running
      ? (t.serving ? `On. Estudiamos is shared at <code class="sync-addr">${esc(url)}</code>` : `<button type="button" class="btn sm primary" data-act="pgServe">Turn it on</button> <span class="muted">Only your own devices signed in to your Tailscale account can open it.</span>`)
      : `Run <b>Set up Estudiamos</b> on the PC again and say Yes to Tailscale, or type <code>tailscale serve --bg 5178</code> in a terminal on the PC.`)}
    ${step(false, 'Open it on your phone', `${url ? `On the phone, open <b>Safari</b> (iPhone) or <b>Chrome</b> (Android) and go to <code class="sync-addr">${esc(url)}</code>. ${pc && t?.serving ? `<div class="pg-qr">${(() => { try { return QR.svg(url, 150); } catch { return ''; } })()}<span class="muted small">Or point the phone’s camera here.</span></div>` : ''}` : `On the phone, open <b>Safari</b> (iPhone) or <b>Chrome</b> (Android) and go to the <b>https://…ts.net</b> address Tailscale shows for this PC, ${pgEx(PG_EX_TS)}.`}
      Then connect with a code${pc ? ' (<a data-act="syncConnect">get one</a>)' : ''} or your connect password.`)}
  </ol>
  ${pc && pgStatus?.old ? '<p class="muted small">To check these steps for you, restart Estudiamos’s sync server: restart the PC (or sign out of Windows and back in), then open this guide again.</p>' : pc && !t ? '<p class="muted small">Checking Tailscale on this PC…</p>' : ''}
  ${pc && (t || pgStatus?.old) ? '<button type="button" class="btn sm ghost" data-act="pgRefresh">🔄 Check again</button>' : ''}`;
}
function pgBody() {
  const pc = pgOnPC(), t = pgStatus;
  return `<p class="muted small" style="margin-top:0">Estudiamos keeps your cards on this PC. A phone gets a copy and stays in sync whenever it can reach the PC, and the PC has to be <b>on and awake</b>.</p>
    <details class="pg-sec" ${!t?.serving ? 'open' : ''}><summary>🏠 At home: same Wi-Fi <span class="muted small">(easiest)</span></summary>
      <ol class="pg-steps plain">
        <li>Connect the phone to the <b>same Wi-Fi</b> as this PC.</li>
        <li>${pc ? 'Press <a data-act="syncConnect"><b>📱 Connect a phone or tablet</b></a> and scan the QR code with the phone’s camera.' : 'On the PC, go to <b>Settings → Phone & sync → Connect a phone or tablet</b> and scan the QR code with the phone’s camera.'}</li>
        <li>No camera? Type the address it shows into Safari or Chrome, ${pgEx(PG_EX_WIFI)}, then enter the code (or your connect password).</li>
        <li>If it won’t connect: Windows may have asked about <b>Node.js</b>; choose <b>Allow</b> on private networks. Your Wi-Fi must be set to <b>Private</b> in Windows, not Public.</li>
      </ol>
      <p class="muted small">This only works while the phone is on your home Wi-Fi. For school, work or mobile data, use Tailscale below.</p></details>
    <details class="pg-sec" ${t?.installed || !pc ? 'open' : ''}><summary>🌍 Anywhere, securely: Tailscale <span class="muted small">(free)</span></summary>
      <p class="small" style="margin:8px 0">Tailscale makes a <b>private, encrypted network</b> between your own devices, so your phone can reach this PC from anywhere: school, work or mobile data. Nothing is opened to the internet, and it gives you a secure <b>https://</b> address. That lets the app work offline on the phone too.</p>
      <div id="pgTs">${pgTailscaleSteps()}</div></details>
    <details class="pg-sec"><summary>📲 Put Estudiamos on your home screen</summary>
      <ol class="pg-steps plain">
        <li><b>iPhone / iPad:</b> in Safari tap <b>Share</b> (the square with an arrow) → <b>Add to Home Screen</b> → <b>Add</b>.</li>
        <li><b>Android:</b> in Chrome tap <b>⋮</b> → <b>Add to Home screen</b> (or <b>Install app</b>).</li>
        <li>Lost the icon? Open the same address again in Safari or Chrome. You stay connected, so you don’t need a new code.</li>
        <li>Using Tailscale? Add the <b>https://…ts.net</b> address (${pgEx(PG_EX_TS)}) to your home screen, not the Wi-Fi one (${pgEx(PG_EX_WIFI)}), so it works everywhere.</li>
      </ol></details>`;
}
async function pgLoad() {
  if (!pgOnPC()) return;
  try { pgStatus = await syncGetJson('/api/tailscale'); } catch { pgStatus = null; }
  if (!pgStatus || !('installed' in pgStatus)) pgStatus = { old: true };   // the sync server was started before this check existed
  const box = $('#pgTs'); if (box) box.innerHTML = pgTailscaleSteps();
}
function phoneGuide() {
  pgStatus = null;
  openDialog({ title: '📱 Set up your phone', ok: 'Close', wide: true, body: `<div id="pgBody">${pgBody()}</div>`, onOk: () => {} });
  $('#dlg').querySelector('[data-dlg=cancel]')?.remove();
  pgLoad().then(() => { const b = $('#pgBody'); if (b && $('#dlg').open) { const open = [...b.querySelectorAll('details')].map(d => d.open); b.innerHTML = pgBody(); b.querySelectorAll('details').forEach((d, i) => { if (open[i]) d.open = true; }); } });
}
Object.assign(actions, {
  phoneGuide: () => phoneGuide(),
  pgRefresh: () => { pgStatus = null; const box = $('#pgTs'); if (box) box.innerHTML = pgTailscaleSteps(); pgLoad(); },
  pgServe: async el => {
    el.disabled = true; el.textContent = 'Turning on…';
    try {
      const r = await syncPost('/api/tailscale/serve', {});
      pgStatus = r.status;
      if (r.status?.serving) toast('🌍 Estudiamos is shared on your Tailscale network');
      else if (r.link) { toast('Tailscale needs one more step: turn on HTTPS'); window.open(r.link, '_blank', 'noopener'); }
      else toast('Tailscale said: ' + (r.message || 'it didn’t work'));
    } catch (e) { toast('Couldn’t reach Tailscale: ' + e.message); }
    const box = $('#pgTs'); if (box) box.innerHTML = pgTailscaleSteps();
  },
});
