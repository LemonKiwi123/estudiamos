'use strict';
/* ================= Background themes: landscape scenes behind the whole app =================
   Each profile picks its own (profile.scene). Dark mode shows the night version of the scene. */
const SCENES = [
  { id: 'plain', name: 'Plain', emoji: '⬜' },
  { id: 'meadow', name: 'Meadow', emoji: '🌼', biome: 0 },
  { id: 'savanna', name: 'Savanna', emoji: '🦒', biome: 1 },
  { id: 'desert', name: 'Desert', emoji: '🌵', biome: 2 },
  { id: 'jungle', name: 'Jungle', emoji: '🌴', biome: 3 },
  { id: 'snow', name: 'Snowy peaks', emoji: '🏔️', biome: 4 },
  { id: 'beach', name: 'Beach', emoji: '🏖️', biome: 5 },
  { id: 'night', name: 'Starry night', emoji: '🌙', biome: 0, night: true },
  { id: 'daily', name: 'New one each day', emoji: '🔄' },
  { id: 'custom', name: 'My picture', emoji: '🖼️' },
];
const bgKey = pid => 'bg:' + pid;
/* Shrink a chosen photo so it loads fast but still looks sharp on big screens. */
async function prepBackground(file, max = 2560) {
  const bmp = await createImageBitmap(file), k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(r, 'image/webp', 0.86));
}
async function putBackground(pid, blob) {
  await idbDo('media', 'readwrite', st => st.put(blob, bgKey(pid)));
  const old = mediaURL.get(bgKey(pid)); if (old) URL.revokeObjectURL(old);
  mediaURL.set(bgKey(pid), URL.createObjectURL(blob));
}
async function removeBackground(pid) {
  await idbDo('media', 'readwrite', st => st.delete(bgKey(pid)));
  const old = mediaURL.get(bgKey(pid)); if (old) URL.revokeObjectURL(old);
  mediaURL.delete(bgKey(pid));
}
const SC_W = 1600, SC_H = 900, SC_GY = 780;   // scene size and ground line
function svgHills(base, amp, jag, wave, seed) {
  let d = `M0 ${SC_H} L0 ${base}`;
  for (let x = 0; x <= SC_W; x += 16) {
    const u = (x + seed) / wave, smooth = 0.6 + 0.4 * Math.sin(u) * Math.cos(u * 0.37), tri = 1 - Math.abs((u / Math.PI) % 2 - 1) * 1.6;
    d += ` L${x} ${(base - amp * ((1 - jag) * smooth + jag * Math.max(0.05, tri))).toFixed(1)}`;
  }
  return d + ` L${SC_W} ${SC_H} Z`;
}
function svgProp(type, x, s, dim, hue) {
  const g = (inner) => `<g transform="translate(${x} ${SC_GY}) scale(${s})">${inner}</g>`;
  switch (type) {
    case 'flower': {
      const col = dim(['#ff7aa2', '#ffd166', '#c77dff', '#ffffff'][Math.floor(hue * 4)]);
      return g(`<path d="M0 0V-26" stroke="${dim('#4e9a51')}" stroke-width="3"/>` + [0, 1, 2, 3, 4].map(k => `<circle cx="${(Math.cos(k * 1.26) * 6).toFixed(1)}" cy="${(-28 + Math.sin(k * 1.26) * 6).toFixed(1)}" r="4.5" fill="${col}"/>`).join('') + `<circle cy="-28" r="3.6" fill="${dim('#f5a623')}"/>`);
    }
    case 'acacia': return g(`<rect x="-4" y="-54" width="8" height="54" fill="${dim('#7a5230')}"/><path d="M-2 -40 L-22 -60 L-18 -62 L2 -46Z" fill="${dim('#7a5230')}"/><ellipse cy="-66" rx="46" ry="11" fill="${dim('#6f9a3c')}"/><ellipse cx="-20" cy="-62" rx="24" ry="8" fill="${dim('#6f9a3c')}"/>`);
    case 'cactus': return g(`<g fill="${dim('#4caf6a')}"><rect x="-8" y="-60" width="16" height="60" rx="8"/><rect x="-24" y="-42" width="10" height="24" rx="5"/><rect x="-18" y="-24" width="12" height="8"/><rect x="14" y="-50" width="10" height="22" rx="5"/><rect x="6" y="-32" width="12" height="8"/></g>`);
    case 'palm': return g(`<path d="M0 0 Q10 -40 2 -78" stroke="${dim('#8b6a3e')}" stroke-width="7" fill="none"/>` + [0, 1, 2, 3, 4, 5].map(k => `<ellipse cx="22" rx="24" ry="6" fill="${dim('#2f8f4e')}" transform="translate(2 -78) rotate(${((-2.6 + k * 0.95) * 57.3).toFixed(0)}) rotate(14 22 0)"/>`).join(''));
    case 'pine': return g(`<rect x="-4" y="-14" width="8" height="14" fill="${dim('#6b4a2a')}"/>` + [0, 1, 2].map(k => { const y = -14 - k * 20, w = 30 - k * 7; return `<path d="M${-w} ${y} L0 ${y - 30} L${w} ${y}Z" fill="${dim('#2f6f55')}"/><path d="M${-w * 0.45} ${y - 16} L0 ${y - 30} L${w * 0.45} ${y - 16} Q0 ${y - 12} ${-w * 0.45} ${y - 16}Z" fill="${dim('#ffffff')}"/>`; }).join(''));
    case 'umbrella': {
      const cols = ['#ef476f', '#ffffff', '#4f9dde', '#ffffff'], cx = -6, cy = -54, r = 34;
      const slices = cols.map((c, k) => { const a0 = Math.PI + k * Math.PI / 4, a1 = a0 + Math.PI / 4; return `<path d="M${cx} ${cy} L${(cx + Math.cos(a0) * r).toFixed(1)} ${(cy + Math.sin(a0) * r).toFixed(1)} A${r} ${r} 0 0 1 ${(cx + Math.cos(a1) * r).toFixed(1)} ${(cy + Math.sin(a1) * r).toFixed(1)}Z" fill="${dim(c)}"/>`; }).join('');
      return g(`<path d="M0 0 L-6 -58" stroke="${dim('#8a7a66')}" stroke-width="3"/>${slices}`);
    }
  }
  return '';
}
const isHexColor = c => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
function sceneSvg(scene, night, color) {
  const b = BIOMES[scene.biome ?? 0], dim = c => mix(c, NIGHT_TINT, night ? 0.55 : 0);
  // a chosen background color becomes the sky (darker at night, fading lighter toward the horizon)
  const sky = isHexColor(color) ? (night ? [mix(color, NIGHT_TINT, 0.72), mix(color, NIGHT_TINT, 0.45)] : [color, mix(color, '#ffffff', 0.6)])
    : night ? SKY.night : SKY.day;
  let rnd = (scene.biome + 1) * 9301; const R = () => (rnd = (rnd * 16807) % 2147483647) / 2147483647;
  const stars = night ? Array.from({ length: 90 }, () => `<circle cx="${(R() * SC_W).toFixed(0)}" cy="${(R() * 520).toFixed(0)}" r="${(R() * 1.8 + 0.6).toFixed(1)}" fill="#fff" opacity="${(0.4 + R() * 0.6).toFixed(2)}"/>`).join('') : '';
  const orb = night
    ? `<circle cx="1240" cy="150" r="46" fill="#f4f1dc"/><circle cx="1262" cy="136" r="40" fill="${sky[0]}"/>`
    : `<circle cx="1240" cy="160" r="90" fill="#ffe27a" opacity=".25"/><circle cx="1240" cy="160" r="58" fill="#ffe27a"/>`;
  const cloud = (x, y, s) => [[0, 0, 34, 13], [22, -8, 22, 13], [-20, -4, 18, 10]].map(([dx, dy, rx, ry]) => `<ellipse cx="${x + dx * s}" cy="${y + dy * s}" rx="${rx * s}" ry="${ry * s}"/>`).join('');
  const clouds = `<g fill="${night ? '#3b4470' : '#ffffff'}" opacity="${night ? 0.45 : 0.9}">${cloud(260, 150, 2.4)}${cloud(720, 90, 1.7)}${cloud(1500, 230, 2)}${cloud(1000, 300, 1.3)}</g>`;
  const amp = b.amp * 4.2;
  const far = `<path d="${svgHills(SC_GY - 120, amp * 1.4, b.jag, 300, 40)}" fill="${dim(b.far)}"/>`;
  const snow = b.jag > 0.5 ? `<path d="${svgHills(SC_GY - 120 - amp * 0.95, amp * 0.5, 1, 300, 40)}" fill="#fff" opacity="${night ? 0.45 : 0.8}"/>` : '';
  const near = `<path d="${svgHills(SC_GY - 30, amp * 0.7, b.jag * 0.6, 210, 400)}" fill="${dim(b.near)}"/>`;
  const props = Array.from({ length: 9 }, (_, i) => svgProp(b.prop, 80 + i * 180 + R() * 70, 1.8 + R() * 1.2, dim, R())).join('');
  const ground = `<rect y="${SC_GY}" width="${SC_W}" height="${SC_H - SC_GY}" fill="${dim(b.ground)}"/><rect y="${SC_GY}" width="${SC_W}" height="4" fill="${dim(b.line)}"/>` +
    Array.from({ length: 26 }, (_, i) => `<rect x="${(i * 67 + R() * 30).toFixed(0)}" y="${SC_GY + 26 + (i % 3) * 30}" width="${24 + (i % 4) * 10}" height="6" rx="3" fill="${dim(b.line)}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SC_W} ${SC_H}" preserveAspectRatio="xMidYMax slice">
    <defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
    <rect width="${SC_W}" height="${SC_H}" fill="url(#s)"/>${stars}${orb}${clouds}${far}${snow}${near}${props}${ground}</svg>`;
}
const sceneCache = {};
function sceneUrl(id, night, color) {
  const c = isHexColor(color) ? color.toLowerCase() : '', k = id + (night ? ':n' : ':d') + c;
  return sceneCache[k] ||= 'url("data:image/svg+xml,' + encodeURIComponent(sceneSvg(SCENES.find(s => s.id === id), night, c)) + '")';
}
let scenePreviewColor;   // undefined = use the profile's color; null = theme's own colors (while choosing in the dialog)
function resolveScene(id) {
  if (id === 'daily') { const land = SCENES.filter(s => s.biome != null && !s.night); return land[Math.floor(startOfDay(Date.now()) / DAY) % land.length]; }
  return SCENES.find(s => s.id === id) || SCENES[0];
}
let scenePreview = null, scenePreviewUrl = null;   // live preview while choosing in the profile dialog
function applyScene() {
  let el = $('#scene');
  if (!el) { el = document.createElement('div'); el.id = 'scene'; el.setAttribute('aria-hidden', 'true'); document.body.prepend(el); }
  const p = view.name === 'profiles' ? profiles.list.find(x => x.id === profiles.lastId) : (typeof currentProfile === 'function' ? currentProfile() : null);
  applyThemeColors(p);
  if (typeof applyLook === 'function') applyLook();
  const id = (typeof lookPro === 'function' && lookPro() && scenePreview == null) ? 'plain' : scenePreview ?? p?.scene ?? 'meadow';
  if (id === 'custom') {
    const url = scenePreviewUrl || (p && mediaURL.get(bgKey(p.id)));
    if (url) { el.hidden = false; el.classList.add('photo'); document.body.classList.add('has-scene'); el.style.backgroundImage = `url("${url}")`; return; }
  }
  el.classList.remove('photo', 'solid'); el.style.backgroundColor = '';
  const color = scenePreviewColor !== undefined ? scenePreviewColor : p?.bgColor;
  const sc = resolveScene(id === 'custom' ? 'meadow' : id);
  if (sc.id === 'plain') {
    if (isHexColor(color)) { el.hidden = false; el.classList.add('solid'); document.body.classList.add('has-scene'); el.style.backgroundImage = 'none'; el.style.backgroundColor = color; }
    else { el.hidden = true; document.body.classList.remove('has-scene'); }
    return;
  }
  const night = sc.night || document.documentElement.dataset.theme === 'dark';
  el.hidden = false; document.body.classList.add('has-scene');
  el.style.backgroundImage = sceneUrl(sc.id, night, color);
}
/* Background color row in the profile dialog */
const hexToRgb = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const rgbToHex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(+v || 0))).toString(16).padStart(2, '0')).join('');
function colorPicker({ pfx, color, def, reset, note, hint }) {
  const c = isHexColor(color) ? color.toLowerCase() : '', [r, g, b] = hexToRgb(c || def);
  const ch = (k, name, v) => `<div class="cp-ch"><span class="cp-l">${k}</span>
      <input type="range" min="0" max="255" step="1" value="${v}" data-ch="${k}" aria-label="${name}">
      <input type="number" min="0" max="255" step="1" value="${v}" data-chn="${k}" inputmode="numeric" aria-label="${name} (0 to 255)"></div>`;
  return `<div class="cp ${c ? '' : 'off'}" id="${pfx}ColorPicker">
    <div class="cp-top">
      <label class="cp-swatch" title="Open the color picker"><input type="color" id="${pfx}ColorInput" value="${c || def}"></label>
      <label class="cp-hex">HEX<span class="cp-hexbox">#<input id="${pfx}Hex" maxlength="7" spellcheck="false" autocomplete="off" value="${(c || def).slice(1)}" aria-label="HEX color code"></span></label>
      <button type="button" class="btn sm ghost" id="${pfx}ColorReset" ${c ? '' : 'hidden'}>${reset}</button>
    </div>
    ${ch('R', 'Red', r)}${ch('G', 'Green', g)}${ch('B', 'Blue', b)}
  </div>
  <div class="muted small"><span id="${pfx}ColorNote">${c ? '' : note + ' '}</span>${hint}</div>`;
}
function bgColorPicker(color) {
  return colorPicker({ pfx: 'bg', color, def: '#7cc8ff', reset: 'Use the theme’s colors', note: 'Right now each theme uses its own colors. Change any value to use your own.',
    hint: 'The color fills the sky in the landscape themes, or the whole background with “Plain”. Your own picture isn’t recolored.' });
}
/* Keeps the picker's square, HEX box and R/G/B sliders in step. onChange(hex or null) */
function wireColorPicker(root, pfx, initial, onChange) {
  const box = root.querySelector(`#${pfx}ColorPicker`), hexIn = box.querySelector(`#${pfx}Hex`), sw = box.querySelector(`#${pfx}ColorInput`);
  const ranges = [...box.querySelectorAll('[data-ch]')], nums = [...box.querySelectorAll('[data-chn]')];
  let cur = isHexColor(initial) ? initial.toLowerCase() : null;
  const paint = (c, from) => {
    const shown = c || sw.value, [r, g, b] = hexToRgb(shown), rgb = { R: r, G: g, B: b };
    if (from !== 'swatch') sw.value = shown;
    if (from !== 'hex') hexIn.value = shown.slice(1);
    ranges.forEach(el => { if (from !== 'range' || +el.value !== rgb[el.dataset.ch]) el.value = rgb[el.dataset.ch];
      const lo = rgbToHex(el.dataset.ch === 'R' ? 0 : r, el.dataset.ch === 'G' ? 0 : g, el.dataset.ch === 'B' ? 0 : b), hi = rgbToHex(el.dataset.ch === 'R' ? 255 : r, el.dataset.ch === 'G' ? 255 : g, el.dataset.ch === 'B' ? 255 : b);
      el.style.setProperty('--track', `linear-gradient(90deg,${lo},${hi})`); });
    nums.forEach(el => { if (from !== 'num' || document.activeElement !== el) el.value = rgb[el.dataset.chn]; });
    box.classList.toggle('off', !c);
  };
  const set = (c, from) => { cur = c; paint(c, from); onChange(c); };
  const fromChannels = list => { const v = Object.fromEntries(list.map(el => [el.dataset.ch || el.dataset.chn, el.value])); return rgbToHex(v.R, v.G, v.B); };
  sw.addEventListener('input', () => set(sw.value.toLowerCase(), 'swatch'));
  ranges.forEach(el => el.addEventListener('input', () => set(fromChannels(ranges), 'range')));
  nums.forEach(el => {
    el.addEventListener('input', () => { if (el.value !== '' && +el.value >= 0 && +el.value <= 255) set(fromChannels(nums), 'num'); });
    el.addEventListener('blur', () => paint(cur, null));
  });
  const readHex = () => { let v = hexIn.value.trim().replace(/^#/, '').toLowerCase(); if (/^[0-9a-f]{3}$/.test(v)) v = v.replace(/./g, x => x + x); return /^[0-9a-f]{6}$/.test(v) ? '#' + v : null; };
  hexIn.addEventListener('input', () => { const h = readHex(); hexIn.classList.toggle('bad', !h && hexIn.value.trim() !== ''); if (h) set(h, 'hex'); });
  hexIn.addEventListener('blur', () => { hexIn.classList.remove('bad'); paint(cur, null); });
  // Enter in these boxes applies the value instead of saving the whole profile
  box.querySelectorAll(`#${pfx}Hex,[data-chn]`).forEach(el => el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); el.blur(); } }));
  box.querySelector(`#${pfx}ColorReset`).addEventListener('click', () => set(null, null));
  paint(cur, null);
}
const wireBgColorPicker = (root, initial, onChange) => wireColorPicker(root, 'bg', initial, onChange);

/* ---------- Your own colors for boxes, the sidebar and accents ---------- */
const THEME_COLORS = [
  { key: 'boxColor', pfx: 'box', label: 'Boxes', def: '#ffffff', hint: 'Cards, panels, pop-ups and lists. The text inside switches between dark and light so it stays readable.' },
  { key: 'sideColor', pfx: 'side', label: 'Sidebar', def: '#f5f4f0', hint: 'The menu on the left on a PC, or the bar at the top on a phone.' },
  { key: 'accentColor', pfx: 'acc', label: 'Accents', def: '#3b54e8', hint: 'Buttons, links, highlights, progress bars and the selected menu item.' },
];
let themePreview = {};   // live preview while choosing in the profile dialog: key -> hex or null
const hexMix = (a, b, t) => { const x = hexToRgb(a), y = hexToRgb(b); return rgbToHex(...x.map((v, i) => v + (y[i] - v) * t)); };
const hexLum = h => { const [r, g, b] = hexToRgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const inkFor = h => hexLum(h) > 0.33 ? '#1c1b19' : '#ecebe7';
function applyThemeColors(p) {
  const root = document.documentElement, st = root.style, get = k => k in themePreview ? themePreview[k] : p?.[k];
  ['--bg', '--surface', '--surface2', '--border', '--text', '--muted', '--accent', '--accent-soft', '--accent-ink', '--side-bg', '--side-text', '--side-muted', '--side-border', '--side-hover'].forEach(v => st.removeProperty(v));
  const dark = root.dataset.theme === 'dark', box = get('boxColor'), side = get('sideColor'), acc = get('accentColor');
  if (isHexColor(box)) {
    const ink = inkFor(box);
    st.setProperty('--surface', box); st.setProperty('--surface2', hexMix(box, ink, 0.07)); st.setProperty('--border', hexMix(box, ink, 0.16));
    st.setProperty('--text', ink); st.setProperty('--muted', hexMix(ink, box, 0.4));
    if ((ink === '#1c1b19') === dark) st.setProperty('--bg', hexMix(box, ink, 0.05));   // keep the page readable when boxes and mode differ
  }
  document.body?.classList.toggle('side-custom', isHexColor(side));
  if (isHexColor(side)) {
    const ink = inkFor(side);
    st.setProperty('--side-bg', side); st.setProperty('--side-text', ink); st.setProperty('--side-muted', hexMix(ink, side, 0.35));
    st.setProperty('--side-border', hexMix(side, ink, 0.15)); st.setProperty('--side-hover', hexMix(side, ink, 0.09));
  }
  const meta = document.querySelector('meta[name=theme-color]');
  if (isHexColor(acc)) {
    const base = isHexColor(box) ? box : dark ? '#1d1d1d' : '#ffffff';
    st.setProperty('--accent', acc); st.setProperty('--accent-soft', hexMix(acc, base, 0.84)); st.setProperty('--accent-ink', hexLum(acc) > 0.4 ? '#111111' : '#ffffff');
    meta?.setAttribute('content', acc);
  } else meta?.setAttribute('content', '#3b54e8');
}
function themeColorPickers(prof) {
  return `<details class="feat theme-colors" ${THEME_COLORS.some(t => isHexColor(prof[t.key])) ? 'open' : ''}><summary><h4 style="display:inline">🎨 Theme colors</h4> <span class="muted small">(optional)</span></summary>
    ${THEME_COLORS.map(t => `<div class="field" style="margin-top:10px">${t.label}${colorPicker({ pfx: t.pfx, color: prof[t.key], def: t.def, reset: 'Use the normal color', note: 'Using the normal color right now. Change any value to use your own.', hint: t.hint })}</div>`).join('')}
  </details>`;
}
function wireThemeColorPickers(dlg, prof) {
  themePreview = {};
  const vals = {};
  for (const t of THEME_COLORS) {
    vals[t.key] = isHexColor(prof[t.key]) ? prof[t.key] : null;
    wireColorPicker(dlg, t.pfx, vals[t.key], c => {
      vals[t.key] = c; themePreview[t.key] = c; applyThemeColors(prof);
      $(`#${t.pfx}ColorReset`).hidden = !c;
      const note = $(`#${t.pfx}ColorNote`); if (note) note.textContent = c ? '' : 'Using the normal color right now. Change any value to use your own. ';
    });
  }
  dlg.themeColorValues = () => ({ ...vals });
}
const sceneThumbStyle = (s, color) => s.id === 'plain' ? (isHexColor(color) ? `background:${color}` : 'background:var(--bg)')
  : `background-image:${sceneUrl(s.id === 'daily' ? 'meadow' : s.id, !!s.night, color)}`;
function recolorSceneThumbs(color) {
  document.querySelectorAll('.scene-opt .thumb[data-scene]').forEach(t => { const s = SCENES.find(x => x.id === t.dataset.scene); if (s) { t.style.cssText = sceneThumbStyle(s, color); } });
}
function scenePicker(current, pid, color) {
  return `<div class="scene-grid">${SCENES.map(s => {
    if (s.id === 'custom') {
      const url = pid && mediaURL.get(bgKey(pid));
      return `<label class="scene-opt" title="Use a picture from your computer"><input type="radio" name="scene" value="custom" ${current === 'custom' ? 'checked' : ''}>
        <span class="thumb custom" id="customThumb" style="${url ? esc(`background-image:url("${url}")`) : ''}">${url ? '' : '<span class="plus">＋</span>'}</span>
        <span class="small">🖼️ My picture</span><a class="small" id="customPick" data-has="${url ? 1 : 0}">${url ? 'Change…' : 'Choose…'}</a></label>`;
    }
    return `<label class="scene-opt" title="${esc(s.name)}"><input type="radio" name="scene" value="${s.id}" ${s.id === current ? 'checked' : ''}>
      <span class="thumb" data-scene="${s.id}" style="${esc(sceneThumbStyle(s, color))}">${s.id === 'daily' ? '<span class="daily">🔄</span>' : ''}</span><span class="small">${s.emoji} ${esc(s.name)}</span></label>`;
  }).join('')}</div>`;
}
