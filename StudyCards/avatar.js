'use strict';
/* ================= Avatar builder: a customizable cartoon avatar for each profile ================= */
const AV = {
  skin: ['#ffe0c7', '#f9cfa8', '#eab88f', '#d9a074', '#c58a5c', '#a86f45', '#8a5634', '#643c24'],
  hairColor: ['#2b211d', '#4a3426', '#7a4b2a', '#a8673a', '#d9a45a', '#f2d48a', '#b8b8b8', '#e86f4a', '#d64c8a', '#5b6ee1', '#3fae8a', '#9b59d0'],
  colors: ['#3b54e8', '#23905a', '#cf3f3f', '#f2c14e', '#ef8354', '#8e44ad', '#16a085', '#ff7aa2', '#475569', '#f5f4f0', '#1f2937', '#7bc67e'],
  bg: ['#dbe4ff', '#d8f3dc', '#ffe5d9', '#fff3bf', '#f3d9fa', '#d0ebff', '#e9ecef', '#ffd6e0', '#c3fae8', '#2b2f45'],
  hair: [['none', 'Bald'], ['short', 'Short'], ['buzz', 'Buzz cut'], ['spiky', 'Spiky'], ['curly', 'Curly'], ['afro', 'Afro'], ['bob', 'Bob'], ['long', 'Long'], ['ponytail', 'Ponytail'], ['bun', 'Bun']],
  eyes: [['round', 'Round'], ['happy', 'Happy'], ['wink', 'Wink'], ['sleepy', 'Sleepy'], ['sparkle', 'Sparkly']],
  mouth: [['smile', 'Smile'], ['grin', 'Grin'], ['laugh', 'Laugh'], ['o', 'Surprised'], ['smirk', 'Smirk'], ['tongue', 'Silly']],
  facial: [['none', 'None'], ['mustache', 'Mustache'], ['beard', 'Beard']],
  top: [['tshirt', 'T-shirt'], ['hoodie', 'Hoodie'], ['sweater', 'Sweater'], ['collar', 'Shirt'], ['overalls', 'Overalls']],
  glasses: [['none', 'None'], ['round', 'Round'], ['square', 'Square'], ['sun', 'Sunglasses']],
  body: [['slim', 'Slim'], ['regular', 'Regular'], ['broad', 'Broad'], ['round', 'Round']],
  face: [['oval', 'Oval'], ['round', 'Round'], ['long', 'Long'], ['square', 'Square']],
  hat: [['none', 'None'], ['beanie', 'Beanie'], ['cap', 'Cap'], ['crown', 'Crown'], ['party', 'Party hat'], ['grad', 'Grad cap'], ['bow', 'Bow'], ['headphones', 'Headphones'], ['flower', 'Flower']],
};
const pick = a => a[Math.floor(Math.random() * a.length)];
function randomAvatar() {
  return { skin: pick(AV.skin), hair: pick(AV.hair)[0], hairColor: pick(AV.hairColor), eyes: pick(AV.eyes.slice(0, 2).concat(AV.eyes))[0], mouth: pick(AV.mouth.slice(0, 3))[0],
    cheeks: Math.random() < 0.7, facial: Math.random() < 0.15 ? pick(AV.facial.slice(1))[0] : 'none', top: pick(AV.top)[0], topColor: pick(AV.colors),
    body: pick(AV.body)[0], face: pick(AV.face)[0],
    glasses: Math.random() < 0.3 ? pick(AV.glasses.slice(1))[0] : 'none', hat: Math.random() < 0.35 ? pick(AV.hat.slice(1))[0] : 'none', hatColor: pick(AV.colors), bg: pick(AV.bg.slice(0, 9)) };
}
const defaultAvatar = () => ({ body: 'regular', face: 'oval', skin: AV.skin[1], hair: 'short', hairColor: AV.hairColor[1], eyes: 'round', mouth: 'smile', cheeks: true, facial: 'none', top: 'hoodie', topColor: AV.colors[0], glasses: 'none', hat: 'none', hatColor: AV.colors[2], bg: AV.bg[0] });
function shade(hex, amt) { return mix(hex, amt < 0 ? '#000000' : '#ffffff', Math.abs(amt)); }
let avUid = 0;
function avatarSvg(c, size = 96) {
  c = { ...defaultAvatar(), ...(c || {}) };
  const id = 'av' + (++avUid), skin = c.skin, sd = shade(skin, -0.14), hc = c.hairColor, hd = shade(hc, -0.2), tc = c.topColor, td = shade(tc, -0.2), ink = '#2b2f45';
  // hair drawn behind the head
  const back = {
    long: `<path d="M33 58 C29 30 48 22 62 23 C80 24 91 38 87 60 L91 100 C82 105 75 100 74 92 L46 92 C45 100 38 105 29 100 Z" fill="${hc}"/>`,
    bob: `<path d="M32 62 C29 32 47 24 60 25 C75 25 91 33 88 62 L88 80 C82 83 78 79 78 74 L42 74 C42 79 38 83 32 80 Z" fill="${hc}"/>`,
    afro: `<circle cx="60" cy="50" r="33" fill="${hc}"/><circle cx="36" cy="64" r="12" fill="${hc}"/><circle cx="84" cy="64" r="12" fill="${hc}"/>`,
    ponytail: `<path d="M84 40 C100 44 102 70 92 84 C88 72 88 58 82 50 Z" fill="${hc}"/>`,
    bun: `<circle cx="60" cy="22" r="11" fill="${hc}"/><circle cx="60" cy="22" r="11" fill="none" stroke="${hd}" stroke-width="1.5" opacity=".5"/>`,
    curly: `<g fill="${hc}">${[[34, 58], [33, 46], [38, 35], [47, 28], [58, 25], [69, 27], [79, 33], [85, 44], [86, 57]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</g>`,
  }[c.hair] || '';
  // hair over the forehead
  const front = {
    short: `<path d="M35 58 C32 33 48 25 62 26 C78 27 89 38 85 58 C82 46 74 38 60 39 C48 39 39 46 35 58 Z" fill="${hc}"/>`,
    buzz: `<path d="M37 53 C37 35 50 30 60 30 C72 30 83 36 83 53 C78 42 70 37 60 37 C50 37 42 42 37 53 Z" fill="${hc}" opacity=".92"/>`,
    spiky: `<path d="M35 56 L36 38 L42 42 L44 28 L51 36 L56 24 L61 35 L68 24 L71 37 L78 30 L79 42 L85 40 L85 56 C80 44 72 39 60 39 C49 39 40 45 35 56 Z" fill="${hc}"/>`,
    curly: `<g fill="${hc}">${[[42, 40], [51, 35], [60, 34], [69, 35], [78, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8"/>`).join('')}</g>`,
    afro: `<path d="M38 50 C40 36 50 32 60 32 C72 32 80 38 82 50 C74 42 66 40 60 40 C52 40 44 43 38 50 Z" fill="${hc}"/>`,
    bob: `<path d="M35 54 C36 34 50 29 60 29 C72 29 85 34 85 54 L80 48 L74 46 L66 47 L60 46 L54 47 L46 46 L40 48 Z" fill="${hc}"/>`,
    long: `<path d="M36 54 C38 34 52 29 62 30 C76 31 84 41 84 55 C77 44 66 39 56 42 C48 44 40 48 36 54 Z" fill="${hc}"/>`,
    ponytail: `<path d="M35 56 C33 34 48 26 62 27 C77 28 87 38 85 56 C80 44 72 38 58 39 C48 40 40 46 35 56 Z" fill="${hc}"/>`,
    bun: `<path d="M35 56 C33 34 48 27 62 28 C77 29 87 38 85 56 C80 45 72 39 58 40 C48 41 40 46 35 56 Z" fill="${hc}"/>`,
  }[c.hair] || '';
  const E = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="4" fill="${ink}"/><circle cx="${x + 1.3}" cy="${y - 1.5}" r="1.3" fill="#fff"/>`;
  const closed = (x, y, up) => `<path d="M${x - 4} ${y} q4 ${up ? -4.5 : 4.5} 8 0" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  const eyes = {
    round: E(51, 61) + E(69, 61),
    happy: closed(51, 62, true) + closed(69, 62, true),
    wink: E(51, 61) + closed(69, 62, true),
    sleepy: closed(51, 61, false) + closed(69, 61, false),
    sparkle: `<ellipse cx="51" cy="61" rx="4.2" ry="5" fill="${ink}"/><circle cx="52.6" cy="59" r="1.7" fill="#fff"/><circle cx="49.6" cy="63" r=".8" fill="#fff"/>
      <ellipse cx="69" cy="61" rx="4.2" ry="5" fill="${ink}"/><circle cx="70.6" cy="59" r="1.7" fill="#fff"/><circle cx="67.6" cy="63" r=".8" fill="#fff"/>
      <path d="M46.5 57.5 l-2 -2 M73.5 57.5 l2 -2" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>`,
  }[c.eyes];
  const brows = c.eyes === 'sleepy' ? '' : `<path d="M46.5 54.5 q4.5 -2.6 9 0 M64.5 54.5 q4.5 -2.6 9 0" stroke="${c.hair === 'none' ? sd : hd}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
  const mouth = {
    smile: `<path d="M53 72 q7 6 14 0" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    grin: `<path d="M52 71 Q60 81 68 71 Z" fill="#7a2531"/><path d="M53.5 71.4 h13 l-1 2.4 h-11 z" fill="#fff"/>`,
    laugh: `<path d="M51.5 70 Q60 85 68.5 70 Z" fill="#7a2531"/><path d="M55 78 q5 4 10 0 q-5 -3 -10 0" fill="#f26f8d"/>`,
    o: `<ellipse cx="60" cy="74" rx="3.4" ry="4.2" fill="#7a2531"/>`,
    smirk: `<path d="M53 73 q8 3 14 -3" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    tongue: `<path d="M53 71 q7 6 14 0" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M57 74 q3 6 6 0 z" fill="#f26f8d"/>`,
  }[c.mouth];
  const facial = {
    mustache: `<path d="M50 69 q5 -4 10 -1 q5 -3 10 1 q-5 3 -10 1 q-5 2 -10 -1 z" fill="${hc}"/>`,
    beard: `<path d="M36 62 C36 80 46 90 60 90 C74 90 84 80 84 62 C82 72 76 76 70 77 C66 74 54 74 50 77 C44 76 38 72 36 62 Z" fill="${hc}"/><path d="M52 69 q4 -3 8 -1 q4 -2 8 1 q-4 2 -8 1 q-4 1 -8 -1 z" fill="${hc}"/>`,
  }[c.facial] || '';
  const glasses = {
    round: `<g fill="#fff" fill-opacity=".25" stroke="${ink}" stroke-width="2"><circle cx="51" cy="61" r="7.6"/><circle cx="69" cy="61" r="7.6"/></g><path d="M58.6 60.5 q1.4 -1.6 2.8 0 M43.4 60 L37 57 M76.6 60 L83 57" stroke="${ink}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    square: `<g fill="#fff" fill-opacity=".25" stroke="${ink}" stroke-width="2"><rect x="42.5" y="55" width="16" height="12.5" rx="3"/><rect x="61.5" y="55" width="16" height="12.5" rx="3"/></g><path d="M58.5 60 h3 M42.5 59 L37 57 M77.5 59 L83 57" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`,
    sun: `<g fill="#1f2433" stroke="${ink}" stroke-width="1.6"><path d="M42 56 h16 v5 q0 7 -8 7 q-8 0 -8 -7 z"/><path d="M62 56 h16 v5 q0 7 -8 7 q-8 0 -8 -7 z"/></g><path d="M58 57.5 h4 M42 57 L37 55 M78 57 L83 55" stroke="${ink}" stroke-width="2" stroke-linecap="round"/><path d="M45 59 l4 -2" stroke="#fff" stroke-width="1.4" opacity=".6" stroke-linecap="round"/>`,
  }[c.glasses] || '';
  const hcol = c.hatColor, hdk = shade(hcol, -0.2);
  const hat = {
    beanie: `<path d="M34 50 C34 26 48 18 60 18 C72 18 86 26 86 50 Z" fill="${hcol}"/><rect x="32" y="44" width="56" height="10" rx="5" fill="${hdk}"/><circle cx="60" cy="16" r="6" fill="#fff"/>`,
    cap: `<path d="M35 48 C35 28 48 21 60 21 C72 21 85 28 85 48 Z" fill="${hcol}"/><path d="M60 46 C74 44 92 44 100 50 C92 54 74 52 60 50 Z" fill="${hdk}"/><circle cx="60" cy="22" r="2.6" fill="${hdk}"/>`,
    crown: `<path d="M38 40 L42 20 L51 32 L60 16 L69 32 L78 20 L82 40 Z" fill="#f2c14e" stroke="#d9a520" stroke-width="1.5"/><circle cx="60" cy="31" r="3" fill="#ef476f"/><circle cx="47" cy="35" r="2" fill="#4f9dde"/><circle cx="73" cy="35" r="2" fill="#4f9dde"/>`,
    party: `<path d="M46 36 L60 4 L74 36 Z" fill="${hcol}"/><path d="M50 27 L70 27 M54 18 L66 18" stroke="#fff" stroke-width="2.4"/><circle cx="60" cy="4" r="4" fill="#ffd166"/>`,
    grad: `<path d="M32 30 L60 18 L88 30 L60 42 Z" fill="#2b2f45"/><path d="M44 35 v9 q16 7 32 0 v-9 L60 42 Z" fill="#3a3f5c"/><path d="M88 30 v14" stroke="#f2c14e" stroke-width="2"/><circle cx="88" cy="46" r="3" fill="#f2c14e"/>`,
    bow: `<path d="M72 30 L62 22 L62 38 Z M72 30 L82 22 L82 38 Z" fill="${hcol}"/><circle cx="72" cy="30" r="3.4" fill="${hdk}"/>`,
    headphones: `<path d="M34 60 C30 28 90 28 86 60" stroke="${hdk}" stroke-width="5" fill="none"/><rect x="28" y="54" width="11" height="17" rx="5" fill="${hcol}"/><rect x="81" y="54" width="11" height="17" rx="5" fill="${hcol}"/>`,
    flower: `<g transform="translate(80 36)">${[0, 1, 2, 3, 4].map(k => `<circle cx="${(Math.cos(k * 1.26) * 5).toFixed(1)}" cy="${(Math.sin(k * 1.26) * 5).toFixed(1)}" r="4.6" fill="${hcol}"/>`).join('')}<circle r="3.4" fill="#ffd166"/></g>`,
  }[c.hat] || '';
  // clothing, shaped by body type
  const bodyScale = { slim: 0.7, regular: 1, broad: 1.34, round: 1.22 }[c.body] || 1;
  const neck = `<rect x="${60 - 7 * Math.min(1.15, bodyScale)}" y="78" width="${14 * Math.min(1.15, bodyScale)}" height="12" fill="${sd}"/>`;
  const shoulders = c.body === 'round'
    ? `<path d="M12 122 C2 96 32 86 60 86 C88 86 118 96 108 122 Z" fill="${tc}"/><ellipse cx="60" cy="118" rx="34" ry="16" fill="${tc}"/>`
    : `<path d="M18 122 C18 98 36 88 60 88 C84 88 102 98 102 122 Z" fill="${tc}"/>`;
  const top = {
    tshirt: `${shoulders}<path d="M50 88 q10 8 20 0" stroke="${td}" stroke-width="3" fill="none"/>`,
    hoodie: `<path d="M40 92 C40 80 80 80 80 92 L74 96 C70 90 50 90 46 96 Z" fill="${td}"/>${shoulders}<path d="M52 90 L52 104 M68 90 L68 104" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="52" cy="105" r="1.8" fill="#fff"/><circle cx="68" cy="105" r="1.8" fill="#fff"/><path d="M44 114 h32" stroke="${td}" stroke-width="3"/>`,
    sweater: `${shoulders}<path d="M24 106 C40 100 80 100 96 106 L98 112 C80 106 40 106 22 112 Z" fill="#fff" opacity=".7"/><path d="M48 88 q12 9 24 0" stroke="${td}" stroke-width="4" fill="none"/>`,
    collar: `${shoulders}<path d="M60 92 L60 122" stroke="${td}" stroke-width="1.6"/><path d="M48 87 L60 96 L72 87 L66 86 L60 92 L54 86 Z" fill="#fff"/><circle cx="60" cy="104" r="1.5" fill="${td}"/><circle cx="60" cy="113" r="1.5" fill="${td}"/>`,
    overalls: `<path d="M18 122 C18 98 36 88 60 88 C84 88 102 98 102 122 Z" fill="#f6f8fb"/><path d="M38 122 L38 104 Q60 100 82 104 L82 122 Z" fill="${tc}"/><path d="M42 104 L46 90 M78 104 L74 90" stroke="${tc}" stroke-width="5" stroke-linecap="round"/><circle cx="44" cy="104" r="2.4" fill="#f2c14e"/><circle cx="76" cy="104" r="2.4" fill="#f2c14e"/><rect x="52" y="108" width="16" height="9" rx="2" fill="${td}"/>`,
  }[c.top];
  return `<svg class="avsvg" width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Avatar">
    <defs><clipPath id="${id}"><circle cx="60" cy="60" r="60"/></clipPath></defs>
    <g clip-path="url(#${id})">
      <rect width="120" height="120" fill="${c.bg}"/>
      ${back}${neck}<g transform="translate(60 0) scale(${bodyScale} 1) translate(-60 0)">${top}</g>
      ${(() => {   // ears + head, shaped by face shape
        const f = { oval: [24, 27, 58], round: [27.5, 25, 59], long: [21, 30.5, 56.5], square: [25, 27, 58] }[c.face] || [24, 27, 58];
        const ears = `<ellipse cx="${60 - f[0] - 0.5 + 1}" cy="62" rx="4.6" ry="6" fill="${skin}"/><ellipse cx="${60 + f[0] + 0.5 - 1}" cy="62" rx="4.6" ry="6" fill="${skin}"/>`;
        const head = c.face === 'square' ? `<rect x="35" y="31" width="50" height="54" rx="11" fill="${skin}"/>` : `<ellipse cx="60" cy="${f[2]}" rx="${f[0]}" ry="${f[1]}" fill="${skin}"/>`;
        return ears + head;
      })()}
      ${front}${brows}${eyes}
      <path d="M58.5 66 q1.5 2 3 0" stroke="${sd}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      ${c.cheeks ? `<ellipse cx="45" cy="69" rx="4.4" ry="2.8" fill="#f49ab3" opacity=".6"/><ellipse cx="75" cy="69" rx="4.4" ry="2.8" fill="#f49ab3" opacity=".6"/>` : ''}
      ${facial}${mouth}${glasses}${hat}
    </g></svg>`;
}

/* ---------- Builder page ---------- */
let avDraft = null;
const AV_TABS = [
  ['body', '🧍 Body', [['body', 'Body type', 'option', AV.body], ['face', 'Face shape', 'option', AV.face], ['skin', 'Skin tone', 'swatch', AV.skin]]],
  ['face', '🙂 Face', [['eyes', 'Eyes', 'option', AV.eyes], ['mouth', 'Mouth', 'option', AV.mouth], ['facial', 'Facial hair', 'option', AV.facial], ['cheeks', 'Rosy cheeks', 'toggle']]],
  ['hair', '💇 Hair', [['hair', 'Hairstyle', 'option', AV.hair], ['hairColor', 'Hair color', 'swatch', AV.hairColor]]],
  ['clothes', '👕 Clothes', [['top', 'Top', 'option', AV.top], ['topColor', 'Color', 'swatch', AV.colors]]],
  ['extras', '🎩 Extras', [['glasses', 'Glasses', 'option', AV.glasses], ['hat', 'Hats & accessories', 'option', AV.hat], ['hatColor', 'Accessory color', 'swatch', AV.colors], ['bg', 'Background', 'swatch', AV.bg]]],
];
views.avatar = () => {
  const p = profiles.list.find(x => x.id === view.pid) || currentProfile();
  if (!p) { view = { name: 'home' }; return views.home(); }
  avDraft ||= { ...(p.avatarCfg || randomAvatar()) };
  const tab = view.tab || 'body', [, , groups] = AV_TABS.find(t => t[0] === tab);
  const section = ([k, label, kind, list]) => {
    if (kind === 'toggle') return `<div class="av-group"><label class="check"><input type="checkbox" data-av-toggle="${k}" ${avDraft[k] ? 'checked' : ''}><span><b>${label}</b></span></label></div>`;
    if (kind === 'swatch') return `<div class="av-group"><b>${label}</b><div class="av-swatches">${list.map(c => `<button type="button" class="av-sw ${avDraft[k] === c ? 'on' : ''}" style="background:${c}" data-act="avSet" data-k="${k}" data-v="${c}" title="${c}"></button>`).join('')}</div></div>`;
    return `<div class="av-group"><b>${label}</b><div class="av-options">${list.map(([v, name]) => `<button type="button" class="av-opt ${avDraft[k] === v ? 'on' : ''}" data-act="avSet" data-k="${k}" data-v="${v}" title="${esc(name)}">${avatarSvg({ ...avDraft, [k]: v }, 64)}<span class="small">${esc(name)}</span></button>`).join('')}</div></div>`;
  };
  return `
    <div class="crumbs"><a data-act="home">Decks</a> / Avatar</div>
    <div class="row-between" style="margin-bottom:14px"><h2>Create your avatar</h2>
      <div class="row"><button type="button" class="btn" data-act="avCancel">Cancel</button><button type="button" class="btn primary" data-act="avSave">Save avatar</button></div></div>
    <div class="av-layout">
      <section class="panel av-preview">
        <div class="av-big">${avatarSvg(avDraft, 220)}</div>
        <b style="font-size:18px">${esc(p.name || 'My profile')}</b>
        <div class="row" style="justify-content:center">
          <button type="button" class="btn" data-act="avRandom">🎲 Randomize</button>
          <button type="button" class="btn ghost" data-act="avReset">Start over</button>
        </div>
        ${typeof friendTip === 'function' && friendsOn() ? `<div class="muted small">${mascot(40)} Looking good!</div>` : ''}
      </section>
      <section class="panel">
        <div class="av-tabs">${AV_TABS.map(([id, label]) => `<button type="button" class="${id === tab ? 'on' : ''}" data-act="avTab" data-tab="${id}">${label}</button>`).join('')}</div>
        <div class="stack">${groups.map(section).join('')}</div>
      </section>
    </div>`;
};
function openAvatarBuilder(pid) { avDraft = null; go({ name: 'avatar', pid: pid || currentProfileId, tab: 'body' }); }
Object.assign(actions, {
  avTab: el => { view.tab = el.dataset.tab; render(); },
  avSet: el => { avDraft[el.dataset.k] = el.dataset.v; render(); },
  avRandom: () => { avDraft = randomAvatar(); render(); },
  avReset: () => { avDraft = defaultAvatar(); render(); },
  avCancel: () => { avDraft = null; go({ name: 'home' }); },
  avSave: async () => {
    const p = profiles.list.find(x => x.id === view.pid) || currentProfile(); if (!p) return;
    p.avatarCfg = { ...avDraft }; p.avatarMode = 'built'; avDraft = null;
    await saveProfiles(); go({ name: 'home' }); toast('Avatar saved! 🎉');
  },
  customizeAvatar: () => openAvatarBuilder(),
});
document.addEventListener('change', e => { const k = e.target.dataset?.avToggle; if (k && avDraft) { avDraft[k] = e.target.checked; render(); } });
