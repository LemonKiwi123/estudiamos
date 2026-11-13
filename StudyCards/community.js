'use strict';
/* ================= Feedback, Reviews and Buy me a coffee =================
   Estudiamos keeps no data on any server, so feedback and reviews go to the project's public GitHub page:
     Feedback → a new GitHub issue (problem or idea), already filled in with the app version and the kind of device.
     Reviews  → GitHub Discussions, in a "Reviews" category, with the stars and the text already filled in.
   Nothing is sent by the app itself: these buttons only open a page in the browser, and the person decides whether to post. */
const APP_LINKS = {
  github: 'LemonKiwi123/estudiamos',   // GitHub "user/project"
  coffee: '',                          // your Buy Me a Coffee name, e.g. 'lemonkiwi' for buymeacoffee.com/lemonkiwi ('' = not set up yet)
};
const ghUrl = (path = '') => APP_LINKS.github ? `https://github.com/${APP_LINKS.github}${path}` : '';
// Only general facts that help fix problems: never names, cards, or addresses
function cmDeviceInfo() {
  const ua = navigator.userAgent;
  const dev = /iPhone/.test(ua) ? 'iPhone' : /iPad|Macintosh.*Mobile/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows PC' : /Mac/.test(ua) ? 'Mac' : 'Other';
  const br = /Edg\//.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Other';
  return { version: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '?', device: dev, browser: br, app: window.matchMedia('(display-mode: standalone)').matches ? 'home-screen app' : 'browser' };
}
const cmOpen = url => { if (url) window.open(url, '_blank', 'noopener'); };
const cmCard = (icon, title, text, btn) => `<div class="cm-card"><div class="cm-ico">${icon}</div><div><h3>${title}</h3><p class="muted">${text}</p>${btn}</div></div>`;
const cmSoon = what => `<p class="muted small" style="margin:6px 0 0">⏳ ${what} isn’t set up yet. Check back soon!</p>`;

views.feedback = () => {
  const i = cmDeviceInfo();
  return `<h2 style="margin-bottom:6px">💬 Feedback</h2>
    <p class="muted" style="margin-top:0">Found something that doesn’t work, or have an idea? I read every message. Thank you for helping make Estudiamos better!</p>
    <div class="cm-grid">
      ${cmCard('🐞', 'Report a problem', 'Something broken, confusing or slow. Tell us what you did, what you expected, and what happened.',
        ghUrl() ? '<button type="button" class="btn primary" data-act="cmIssue" data-kind="bug">Report a problem</button>' : cmSoon('Reporting'))}
      ${cmCard('💡', 'Suggest an idea', 'A new game, a setting, a better way to study. Big or small, every idea is welcome.',
        ghUrl() ? '<button type="button" class="btn primary" data-act="cmIssue" data-kind="idea">Share an idea</button>' : cmSoon('Ideas'))}
      ${cmCard('📋', 'See what others said', 'Maybe someone already reported it. Add a 👍 to show it matters to you too.',
        ghUrl() ? `<button type="button" class="btn" data-act="cmLink" data-url="${esc(ghUrl('/issues'))}">Open the list</button>` : cmSoon('The list'))}
    </div>
    <p class="muted small">These open the Estudiamos page on GitHub in your browser, where you can write your message. You need a free GitHub account to post.
      To help fix problems, the message starts with your app version and kind of device (<b>${esc(i.version)}, ${esc(i.device)}, ${esc(i.browser)}</b>). Nothing else is included, and you can change it before posting.</p>`;
};
views.reviews = () => {
  const n = view.stars || 0;
  return `<h2 style="margin-bottom:6px">⭐ Reviews</h2>
    <p class="muted" style="margin-top:0">Enjoying Estudiamos? A short review helps other learners find it.</p>
    <div class="panel stack">
      <div><b>How many stars?</b><div class="cm-stars" role="radiogroup" aria-label="Stars">${[1, 2, 3, 4, 5].map(k => `<button type="button" role="radio" aria-checked="${k === n}" aria-label="${k} star${k > 1 ? 's' : ''}" class="cm-star ${k <= n ? 'on' : ''}" data-act="cmStar" data-n="${k}">★</button>`).join('')}</div></div>
      <label class="field">Your review <span class="muted small">(what you like, what could be better)</span><textarea class="inp" id="cmReview" rows="4" maxlength="2000" placeholder="I use it every day for my Spanish class…">${esc(view.reviewText || '')}</textarea></label>
      ${ghUrl() ? `<div class="row" style="gap:8px;flex-wrap:wrap"><button type="button" class="btn primary" data-act="cmPostReview" ${n ? '' : 'disabled'}>Post my review</button>
        <button type="button" class="btn" data-act="cmLink" data-url="${esc(ghUrl('/discussions/categories/reviews'))}">Read reviews</button></div>
        <p class="muted small" style="margin:0">Opens the Reviews page on GitHub with your stars and words filled in. Check it, then press <b>Start discussion</b> to post. Reviews are public; you need a free GitHub account.</p>` : cmSoon('Posting reviews')}
    </div>`;
};
views.coffee = () => {
  const url = APP_LINKS.coffee ? `https://buymeacoffee.com/${encodeURIComponent(APP_LINKS.coffee)}` : '';
  return `<div class="flash cm-coffee" style="min-height:0">
      <div class="cm-cup" aria-hidden="true">☕</div>
      <h2 style="margin:0">Buy me a coffee</h2>
      <p style="max-width:520px">Estudiamos is free, with no ads, and your cards stay on your own devices. If it helps you learn, you can say thanks with a coffee. It keeps the new games and features coming!</p>
      ${url ? `<button type="button" class="btn primary big cm-coffee-btn" data-act="cmLink" data-url="${esc(url)}">☕ Buy me a coffee</button>
        <p class="muted small" style="margin:0">Opens buymeacoffee.com in your browser. Payment happens there, never in this app.</p>` : cmSoon('The coffee page')}
      <p class="muted small" style="margin:6px 0 0">Can’t donate? A review or telling a friend helps just as much. 💛</p>
      <div class="row" style="justify-content:center;gap:8px"><button type="button" class="btn" data-act="reviews">⭐ Write a review</button><button type="button" class="btn" data-act="feedback">💬 Send feedback</button></div>
    </div>`;
};
/* the row of links shown at the bottom of Home and Settings */
function cmLinksHtml() {
  return `<div class="cm-links"><a data-act="feedback">💬 Feedback</a><span aria-hidden="true">·</span><a data-act="reviews">⭐ Reviews</a><span aria-hidden="true">·</span><a data-act="coffee">☕ Buy me a coffee</a></div>`;
}
Object.assign(actions, {
  feedback: () => go({ name: 'feedback' }),
  reviews: () => go({ name: 'reviews', stars: 0 }),
  coffee: () => go({ name: 'coffee' }),
  cmLink: el => cmOpen(el.dataset.url),
  cmIssue: el => {
    const i = cmDeviceInfo(), bug = el.dataset.kind === 'bug';
    const info = `**App version:** ${i.version} · **Device:** ${i.device} · **Browser:** ${i.browser} (${i.app})`;
    const body = bug
      ? `${info}\n\n### What happened?\n\n\n### What did you expect?\n\n\n### How can we make it happen again? (steps)\n1. \n2. \n`
      : `${info}\n\n### Your idea\n\n\n### Why would it help you?\n\n`;
    cmOpen(ghUrl(`/issues/new?labels=${bug ? 'bug' : 'idea'}&title=${encodeURIComponent(bug ? 'Problem: ' : 'Idea: ')}&body=${encodeURIComponent(body)}`));
  },
  cmStar: el => { view.reviewText = $('#cmReview')?.value || ''; view.stars = +el.dataset.n; render(); },
  cmPostReview: () => {
    const n = view.stars || 0; if (!n) return toast('Pick how many stars first');
    const text = ($('#cmReview')?.value || '').trim(), stars = '★'.repeat(n) + '☆'.repeat(5 - n);
    const body = `${stars} (${n} out of 5)\n\n${text || '_(no comment)_'}\n\n<sub>Estudiamos ${cmDeviceInfo().version}</sub>`;
    cmOpen(ghUrl(`/discussions/new?category=reviews&title=${encodeURIComponent(`${stars} ${text ? text.split(/[.!?\n]/)[0].slice(0, 60) : 'My review'}`)}&body=${encodeURIComponent(body)}`));
  },
});
