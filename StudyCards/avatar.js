'use strict';
/* ================= Avatar builder: a customizable cartoon character for each profile =================
   Built part by part, like a face-maker: pick a style for each part (face, hair, eyebrows, eyes, nose, mouth, facial hair,
   glasses, clothes, hats), its color, and nudge it bigger or smaller, up or down, closer together or tilted.
   Layers are drawn in an order that keeps parts from cutting through each other:
     background → hood → hair behind the head → neck → clothes → long hair falling in front of the shoulders
     → ears → head → cheeks → eyebrows → hair over the forehead → eyes → nose → beard → mouth + mustache → glasses → hat.
   A hat that sits on the head trims the hair above its brim (no hair poking through), and moves up if the eyebrows do;
   crowns and party hats sit on top of tall hair; mustaches move with the mouth and glasses with the eyes.
   Old avatars (from before these options) still open and look the same. */
const AV = {
  skin: ['#ffe9d9', '#ffe0c7', '#f9cfa8', '#eab88f', '#d9a074', '#c58a5c', '#a86f45', '#8a5634', '#643c24', '#4a2c1a'],
  hairColor: ['#1b1513', '#2b211d', '#4a3426', '#7a4b2a', '#a8673a', '#d9a45a', '#f2d48a', '#e8e1d0', '#b8b8b8', '#e86f4a', '#d64c8a', '#5b6ee1', '#3fae8a', '#9b59d0'],
  eyeColor: ['#3b2a20', '#6b4423', '#8a6a3b', '#4f86c6', '#3a6ea5', '#4c9a74', '#6c7a5a', '#7d8590', '#9468ab'],
  lipColor: ['#c9566b', '#d97a7a', '#b8475e', '#e08ea0', '#a4485a', '#8a4a3c'],
  colors: ['#3b54e8', '#23905a', '#cf3f3f', '#f2c14e', '#ef8354', '#8e44ad', '#16a085', '#ff7aa2', '#475569', '#f5f4f0', '#1f2937', '#7bc67e', '#5bc0eb', '#a0522d'],
  frames: ['#2b2f45', '#6b4423', '#b8b8b8', '#c99a06', '#cf3f3f', '#3b54e8', '#ff7aa2', '#f5f4f0'],
  bg: ['#dbe4ff', '#d8f3dc', '#ffe5d9', '#fff3bf', '#f3d9fa', '#d0ebff', '#e9ecef', '#ffd6e0', '#c3fae8', '#2b2f45'],
  face: [['oval', 'Oval'], ['round', 'Round'], ['long', 'Long'], ['square', 'Square'], ['heart', 'Heart'], ['wide', 'Wide']],
  hair: [['none', 'Bald'], ['short', 'Short'], ['buzz', 'Buzz cut'], ['side', 'Side part'], ['spiky', 'Spiky'], ['mohawk', 'Mohawk'], ['curly', 'Curly'], ['afro', 'Afro'],
    ['bob', 'Bob'], ['fringe', 'Bangs'], ['long', 'Long'], ['wavy', 'Wavy'], ['ponytail', 'Ponytail'], ['pigtails', 'Pigtails'], ['bun', 'Bun']],
  brows: [['soft', 'Soft'], ['thin', 'Thin'], ['thick', 'Thick'], ['arched', 'Arched'], ['straight', 'Straight'], ['angry', 'Serious'], ['worried', 'Worried'], ['none', 'None']],
  eyes: [['round', 'Round'], ['big', 'Big'], ['almond', 'Almond'], ['lashes', 'Lashes'], ['dot', 'Dots'], ['sparkle', 'Sparkly'], ['happy', 'Happy'], ['sleepy', 'Sleepy'], ['wink', 'Wink']],
  nose: [['button', 'Button'], ['curve', 'Curved'], ['long', 'Long'], ['round', 'Round'], ['wide', 'Wide'], ['dots', 'Dots'], ['none', 'None']],
  mouth: [['smile', 'Smile'], ['grin', 'Grin'], ['laugh', 'Laugh'], ['teeth', 'Teeth'], ['lips', 'Lips'], ['flat', 'Calm'], ['o', 'Surprised'], ['smirk', 'Smirk'], ['tongue', 'Silly'], ['frown', 'Frown']],
  mustache: [['none', 'None'], ['classic', 'Classic'], ['handlebar', 'Handlebar'], ['thin', 'Thin']],
  beard: [['none', 'None'], ['full', 'Full'], ['goatee', 'Goatee'], ['chin', 'Chin'], ['stubble', 'Stubble']],
  glasses: [['none', 'None'], ['round', 'Round'], ['square', 'Square'], ['big', 'Big'], ['cat', 'Cat-eye'], ['half', 'Half-rim'], ['sun', 'Sunglasses']],
  top: [['tshirt', 'T-shirt'], ['hoodie', 'Hoodie'], ['sweater', 'Sweater'], ['striped', 'Striped'], ['collar', 'Shirt'], ['jacket', 'Jacket'], ['turtleneck', 'Turtleneck'], ['tank', 'Tank top'], ['blouse', 'Blouse'], ['overalls', 'Overalls']],
  pants: [['jeans', 'Jeans'], ['baggy', 'Baggy pants'], ['cargo', 'Cargo pants'], ['sweats', 'Sweatpants'], ['leggings', 'Leggings'], ['shorts', 'Shorts'], ['skirt', 'Skirt'], ['longskirt', 'Long skirt']],
  shoes: [['sneakers', 'Sneakers'], ['boots', 'Boots'], ['flats', 'Flats'], ['sandals', 'Sandals']],
  pantsColors: ['#3a5a8c', '#24344f', '#1f2937', '#6b7280', '#8a6a3b', '#c2b280', '#f5f4f0', '#cf3f3f', '#23905a', '#8e44ad', '#ff7aa2', '#5bc0eb'],
  shoeColors: ['#e85d4a', '#f5f4f0', '#1f2937', '#6b4423', '#3b54e8', '#f2c14e', '#23905a', '#ff7aa2', '#8a8f98'],
  hat: [['none', 'None'], ['beanie', 'Beanie'], ['cap', 'Cap'], ['grad', 'Grad cap'], ['crown', 'Crown'], ['party', 'Party hat'], ['bow', 'Bow'], ['flower', 'Flower'], ['headphones', 'Headphones']],
  // [key, label, min, max, step, default] for the "adjust" sliders
  adjust: {
    face: [['build', 'Shoulders', 0.7, 1.35, 0.05, 1]],
    brows: [['browSize', 'Size', 0.7, 1.4, 0.05, 1], ['browLift', 'Up / down', 4, 10, 0.5, 6.5], ['browGap', 'Spacing', 6, 13, 0.5, 9], ['browTilt', 'Tilt', -25, 25, 1, 0]],
    eyes: [['eyeSize', 'Size', 0.7, 1.4, 0.05, 1], ['eyeY', 'Up / down', 56, 66, 0.5, 61], ['eyeGap', 'Spacing', 6, 13, 0.5, 9], ['eyeTilt', 'Tilt', -20, 20, 1, 0]],
    nose: [['noseSize', 'Size', 0.6, 1.6, 0.05, 1], ['noseY', 'Up / down', 62, 71, 0.5, 66]],
    mouth: [['mouthSize', 'Size', 0.7, 1.4, 0.05, 1], ['mouthY', 'Up / down', 69, 80, 0.5, 72]],
  },
};
const pick = a => a[Math.floor(Math.random() * a.length)];
const avAdjDefaults = () => Object.fromEntries(Object.values(AV.adjust).flat().map(a => [a[0], a[5]]));
function randomAvatar() {
  const r = (lo, hi, st) => Math.round((lo + Math.random() * (hi - lo)) / st) * st;
  return { ...avAdjDefaults(), skin: pick(AV.skin), face: pick(AV.face)[0], hair: pick(AV.hair.slice(1))[0], hairColor: pick(AV.hairColor.slice(0, 9)), hairFlip: Math.random() < 0.3,
    brows: pick(AV.brows.slice(0, 5))[0], eyes: pick(AV.eyes.slice(0, 7))[0], eyeColor: pick(AV.eyeColor), nose: pick(AV.nose.slice(0, 5))[0], mouth: pick(AV.mouth.slice(0, 5))[0], lipColor: pick(AV.lipColor),
    cheeks: Math.random() < 0.6, freckles: Math.random() < 0.15, mustache: Math.random() < 0.12 ? pick(AV.mustache.slice(1))[0] : 'none', beard: Math.random() < 0.1 ? pick(AV.beard.slice(1))[0] : 'none',
    top: pick(AV.top)[0], topColor: pick(AV.colors), topColor2: pick(['#f5f4f0', '#1f2937', ...AV.colors]), glasses: Math.random() < 0.25 ? pick(AV.glasses.slice(1))[0] : 'none', glassesColor: pick(AV.frames.slice(0, 4)),
    hat: Math.random() < 0.25 ? pick(AV.hat.slice(1))[0] : 'none', hatColor: pick(AV.colors), bg: pick(AV.bg.slice(0, 9)),
    pants: pick(AV.pants)[0], pantsColor: pick(AV.pantsColors), shoes: pick(AV.shoes)[0], shoeColor: pick(AV.shoeColors),
    build: r(0.8, 1.25, 0.05), eyeSize: r(0.9, 1.15, 0.05), eyeGap: r(8, 10, 0.5), mouthY: r(71, 74, 0.5) };
}
const defaultAvatar = () => ({ ...avAdjDefaults(), face: 'oval', skin: AV.skin[2], hair: 'short', hairColor: AV.hairColor[2], hairFlip: false, brows: 'soft', browColor: 'auto',
  eyes: 'round', eyeColor: AV.eyeColor[1], nose: 'button', mouth: 'smile', lipColor: AV.lipColor[0], cheeks: true, freckles: false, mole: false,
  mustache: 'none', beard: 'none', facialColor: 'auto', top: 'hoodie', topColor: AV.colors[0], topColor2: '#f5f4f0', glasses: 'none', glassesColor: AV.frames[0], hat: 'none', hatColor: AV.colors[2], bg: AV.bg[0], pants: 'jeans', pantsColor: '#3a5a8c', shoes: 'sneakers', shoeColor: '#e85d4a' });
/* avatars saved before the part editor: map their old choices onto the new ones */
function avUpgrade(c) {
  c = { ...(c || {}) };
  if (c.build == null && c.body) c.build = { slim: 0.7, regular: 1, broad: 1.34, round: 1.22 }[c.body] || 1;
  if (c.mustache == null && c.beard == null && c.facial) { if (c.facial === 'mustache') c.mustache = 'classic'; if (c.facial === 'beard') { c.beard = 'full'; c.mustache = 'classic'; } }
  if (c.brows == null && c.eyes === 'sleepy') c.brows = 'none';
  return { ...defaultAvatar(), ...c };
}
function shade(hex, amt) { return mix(hex, amt < 0 ? '#000000' : '#ffffff', Math.abs(amt)); }
const avN = (v, d) => Number.isFinite(+v) ? +v : d;
let avUid = 0;
/* opts.view: 'face' zooms in on the face, 'head' on the head and hat (used for the small style pictures) */
function avatarSvg(cfg, size = 96, opts = {}) {
  const c = avUpgrade(cfg), id = 'av' + (++avUid), ink = '#2b2f45';
  const skin = c.skin, sd = shade(skin, -0.16), hc = c.hairColor, hd = shade(hc, -0.2), tc = c.topColor, td = shade(tc, -0.2), t2 = c.topColor2 || '#f5f4f0';
  const A = k => avN(c[k], avAdjDefaults()[k]);
  const eyeY = A('eyeY'), eyeGap = A('eyeGap'), eyeS = A('eyeSize'), eyeT = A('eyeTilt');
  const browS = A('browSize'), browY = eyeY - A('browLift') * (0.7 + 0.3 * eyeS), browGap = A('browGap'), browT = A('browTilt');
  const noseS = A('noseSize'), noseY = A('noseY'), mouthS = A('mouthSize'), mouthY = Math.max(A('mouthY'), noseY + 4 * noseS + 1), build = A('build');
  // ---- face shape: [half width (where the ears go), the head itself]
  const F = {
    oval: [24, `<ellipse cx="60" cy="58" rx="24" ry="27"/>`], round: [27.5, `<ellipse cx="60" cy="59" rx="27.5" ry="25"/>`], long: [21, `<ellipse cx="60" cy="56.5" rx="21" ry="30.5"/>`],
    square: [25, `<rect x="35" y="31" width="50" height="54" rx="11"/>`], heart: [25, `<path d="M35 52 C34 34 47 31 60 31 C73 31 86 34 85 52 C84 70 72 86 60 86 C48 86 36 70 35 52 Z"/>`],
    wide: [29, `<ellipse cx="60" cy="60" rx="29" ry="24.5"/>`],
  }[c.face] || [24, `<ellipse cx="60" cy="58" rx="24" ry="27"/>`];
  const hw = F[0];
  // ---- hair: behind the head, over the forehead, and long hair falling in front of the shoulders
  const back = {
    long: `<path d="M33 58 C29 30 48 22 62 23 C80 24 91 38 87 60 L91 100 C82 105 75 100 74 92 L46 92 C45 100 38 105 29 100 Z"/>`,
    wavy: `<path d="M33 58 C29 30 48 22 62 23 C80 24 91 38 87 60 C92 70 86 78 91 88 C89 98 81 101 76 95 L44 95 C39 101 31 98 29 88 C34 78 28 70 33 58 Z"/>`,
    fringe: `<path d="M32 60 C29 32 47 24 60 25 C75 25 91 33 88 60 L89 86 C80 90 72 88 70 84 L50 84 C48 88 40 90 31 86 Z"/>`,
    bob: `<path d="M32 62 C29 32 47 24 60 25 C75 25 91 33 88 62 L88 80 C82 83 78 79 78 74 L42 74 C42 79 38 83 32 80 Z"/>`,
    afro: `<circle cx="60" cy="50" r="33"/><circle cx="36" cy="64" r="12"/><circle cx="84" cy="64" r="12"/>`,
    ponytail: `<path d="M84 40 C100 44 102 70 92 84 C88 72 88 58 82 50 Z"/>`,
    pigtails: `<circle cx="29" cy="63" r="9"/><circle cx="91" cy="63" r="9"/><circle cx="27" cy="73" r="6.5"/><circle cx="93" cy="73" r="6.5"/>`,
    bun: `<circle cx="60" cy="22" r="11"/><circle cx="60" cy="22" r="11" fill="none" stroke="${hd}" stroke-width="1.5" opacity=".5"/>`,
    curly: [[34, 58], [33, 46], [38, 35], [47, 28], [58, 25], [69, 27], [79, 33], [85, 44], [86, 57]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join(''),
  }[c.hair] || '';
  const front = {
    short: `<path d="M35 58 C32 33 48 25 62 26 C78 27 89 38 85 58 C82 46 74 38 60 39 C48 39 39 46 35 58 Z"/>`,
    buzz: `<path d="M37 53 C37 35 50 30 60 30 C72 30 83 36 83 53 C78 42 70 37 60 37 C50 37 42 42 37 53 Z" opacity=".92"/>`,
    side: `<path d="M35 58 C33 34 48 25 62 26 C78 27 88 37 85 56 C78 42 62 36 48 40 C42 43 37 50 35 58 Z"/><path d="M47 30 C52 34 56 37 66 38" stroke="${hd}" stroke-width="1.4" fill="none" opacity=".55"/>`,
    spiky: `<path d="M35 56 L36 38 L42 42 L44 28 L51 36 L56 24 L61 35 L68 24 L71 37 L78 30 L79 42 L85 40 L85 56 C80 44 72 39 60 39 C49 39 40 45 35 56 Z"/>`,
    mohawk: `<path d="M37 53 C37 37 50 32 60 32 C72 32 83 37 83 53 C78 43 70 39 60 39 C50 39 42 43 37 53 Z" opacity=".55"/><path d="M53 44 C52 30 54 20 60 13 C66 20 68 30 67 44 C64 40 56 40 53 44 Z"/>`,
    curly: [[42, 40], [51, 35], [60, 34], [69, 35], [78, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8"/>`).join(''),
    afro: `<path d="M38 50 C40 36 50 32 60 32 C72 32 80 38 82 50 C74 42 66 40 60 40 C52 40 44 43 38 50 Z"/>`,
    bob: `<path d="M35 54 C36 34 50 29 60 29 C72 29 85 34 85 54 L80 48 L74 46 L66 47 L60 46 L54 47 L46 46 L40 48 Z"/>`,
    fringe: `<path d="M35 50 C36 32 50 28 60 28 C72 28 85 32 85 50 L79 51 L72 50 L66 51 L60 50 L54 51 L48 50 L41 51 Z"/>`,
    long: `<path d="M36 54 C38 34 52 29 62 30 C76 31 84 41 84 55 C77 44 66 39 56 42 C48 44 40 48 36 54 Z"/>`,
    wavy: `<path d="M36 55 C37 34 52 29 62 30 C76 31 85 41 84 56 C80 48 76 50 72 44 C66 46 60 40 54 44 C48 42 42 50 36 55 Z"/>`,
    ponytail: `<path d="M35 56 C33 34 48 26 62 27 C77 28 87 38 85 56 C80 44 72 38 58 39 C48 40 40 46 35 56 Z"/>`,
    pigtails: `<path d="M35 55 C35 34 49 28 60 28 C72 28 85 34 85 55 C80 45 72 40 60 40 C48 40 40 45 35 55 Z"/><path d="M60 28 L60 40" stroke="${hd}" stroke-width="1.3" opacity=".5"/>`,
    bun: `<path d="M35 56 C33 34 48 27 62 28 C77 29 87 38 85 56 C80 45 72 39 58 40 C48 41 40 46 35 56 Z"/>`,
  }[c.hair] || '';
  const lockL = { long: 'M34 64 C33 82 35 98 39 110 C43 109 47 104 47 97 C45 86 44 76 42 66 Z', wavy: 'M34 64 C31 74 37 80 33 90 C34 100 38 106 41 110 C45 107 47 101 46 95 C48 86 43 80 45 72 L42 66 Z' }[c.hair];
  const locks = lockL ? `<path d="${lockL}"/><path d="${lockL}" transform="translate(120 0) scale(-1 1)"/>` : '';
  const hairTop = { none: 31, short: 26, buzz: 30, side: 26, spiky: 24, mohawk: 13, curly: 16, afro: 17, bob: 29, fringe: 25, long: 23, wavy: 23, ponytail: 27, pigtails: 28, bun: 11 }[c.hair] ?? 31;
  const flip = c.hairFlip ? ' transform="translate(120 0) scale(-1 1)"' : '';
  // ---- a hat that sits on the head trims the hair above its brim, and moves up with high eyebrows
  const browTop = browY - 3 * browS;
  const brim = { beanie: 54, cap: 50, grad: 44 }[c.hat];
  const hatDy = brim ? Math.min(0, browTop - 1.5 - brim) : 0;
  const clipLine = { beanie: 47, cap: 46, grad: 39 }[c.hat];
  const hairClip = clipLine != null ? ` clip-path="url(#${id}h)"` : '';
  const topLift = ['crown', 'party'].includes(c.hat) ? Math.min(0, hairTop - 29) : 0;   // sits on top of tall hair
  // ---- eyebrows, eyes, nose, mouth: drawn around (0,0), then moved, sized and tilted (the right side mirrored)
  const browCol = c.browColor && c.browColor !== 'auto' ? c.browColor : c.hair === 'none' ? sd : hd;
  const browD = {
    soft: `<path d="M-4.5 .8 q4.5 -2.6 9 0" stroke-width="1.9"/>`, thin: `<path d="M-4.5 .8 q4.5 -2.4 9 0" stroke-width="1.2"/>`,
    thick: `<path d="M-5 1.6 Q0 -3 5 .4 L5 2.2 Q0 -.8 -5 3.2 Z" fill="${browCol}" stroke="none"/>`, arched: `<path d="M-4.8 1.6 Q-1 -3.4 4.8 .6" stroke-width="2"/>`,
    straight: `<path d="M-4.5 0 H4.5" stroke-width="2.2"/>`, angry: `<path d="M-4.5 -1.4 L4.5 1.8" stroke-width="2.4"/>`, worried: `<path d="M-4.5 1.8 L4.5 -1.4" stroke-width="2.2"/>`,
  }[c.brows] || '';
  const side = (x, y, s, t, inner, mirror) => `<g transform="translate(${x} ${y}) rotate(${mirror ? -t : t}) scale(${mirror ? -s : s} ${s})">${inner}</g>`;
  const brows = browD ? `<g stroke="${browCol}" fill="none" stroke-linecap="round">${side(60 - browGap, browY, browS, browT, browD, false)}${side(60 + browGap, browY, browS, browT, browD, true)}</g>` : '';
  const ec = c.eyeColor || AV.eyeColor[1];
  const EYE = {
    round: `<ellipse rx="3.4" ry="4" fill="${ink}"/><circle cx="1.3" cy="-1.5" r="1.3" fill="#fff"/>`,
    big: `<ellipse rx="5" ry="5.5" fill="#fff" stroke="${ink}" stroke-width="1.2"/><circle cx=".6" r="3.5" fill="${ec}"/><circle cx=".6" r="1.8" fill="${ink}"/><circle cx="1.9" cy="-1.6" r="1.1" fill="#fff"/>`,
    almond: `<path d="M-5.5 0 Q0 -5.2 5.5 0 Q0 4.2 -5.5 0 Z" fill="#fff" stroke="${ink}" stroke-width="1.3"/><circle r="2.6" fill="${ec}"/><circle r="1.3" fill="${ink}"/><circle cx=".9" cy="-.9" r=".7" fill="#fff"/>`,
    lashes: `<ellipse rx="3.4" ry="4" fill="${ink}"/><circle cx="1.3" cy="-1.5" r="1.3" fill="#fff"/><path d="M-3 -2.8 l-2.4 -1.6 M-1.6 -3.8 l-1.4 -2.1" stroke="${ink}" stroke-width="1.3" stroke-linecap="round"/>`,
    dot: `<circle r="2.3" fill="${ink}"/>`,
    sparkle: `<ellipse rx="4.2" ry="5" fill="${ink}"/><circle cx="1.6" cy="-2" r="1.7" fill="#fff"/><circle cx="-1.4" cy="2" r=".8" fill="#fff"/><path d="M-4.5 -3.5 l-2 -2" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>`,
    happy: `<path d="M-4 1 q4 -4.5 8 0" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    sleepy: `<path d="M-4 -.5 q4 4.5 8 0" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  };
  const eL = EYE[c.eyes === 'wink' ? 'round' : c.eyes] || EYE.round, eR = EYE[c.eyes === 'wink' ? 'happy' : c.eyes] || EYE.round;
  const eyes = side(60 - eyeGap, eyeY, eyeS, eyeT, eL, false) + side(60 + eyeGap, eyeY, eyeS, eyeT, eR, true);
  const NOSE = {
    button: `<path d="M-1.5 0 q1.5 2 3 0" stroke="${sd}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    curve: `<path d="M.6 -6 Q-2.6 0 -.6 1.2 Q1 2 2.4 .6" stroke="${sd}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
    long: `<path d="M0 -7.5 L-1.8 .4 Q0 1.7 2 .6" stroke="${sd}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    round: `<ellipse rx="3" ry="2.4" fill="${shade(skin, -0.09)}"/><ellipse cx="-.8" cy="-.8" rx="1" ry=".6" fill="#fff" opacity=".35"/>`,
    wide: `<path d="M-3.6 .2 q1.4 1.8 3.6 .7 q2.2 1.1 3.6 -.7" stroke="${sd}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
    dots: `<circle cx="-1.7" r=".95" fill="${sd}"/><circle cx="1.7" r=".95" fill="${sd}"/>`,
  }[c.nose] || '';
  const nose = NOSE ? `<g transform="translate(60 ${noseY}) scale(${noseS})">${NOSE}</g>` : '';
  const lip = c.lipColor || AV.lipColor[0];
  const MOUTH = {
    smile: `<path d="M-7 0 q7 6 14 0" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    grin: `<path d="M-8 -1 Q0 9 8 -1 Z" fill="#7a2531"/><path d="M-6.5 -.6 h13 l-1 2.4 h-11 z" fill="#fff"/>`,
    laugh: `<path d="M-8.5 -2 Q0 13 8.5 -2 Z" fill="#7a2531"/><path d="M-5 6 q5 4 10 0 q-5 -3 -10 0" fill="#f26f8d"/>`,
    teeth: `<rect x="-6.5" y="-2.2" width="13" height="5.4" rx="2.7" fill="#fff" stroke="${ink}" stroke-width="1.4"/><path d="M-6 .5 h12 M-2 -2 v5 M2 -2 v5" stroke="${ink}" stroke-width=".7"/>`,
    lips: `<path d="M-6.5 0 Q-3 -3.2 0 -1.2 Q3 -3.2 6.5 0 Q0 5.2 -6.5 0 Z" fill="${lip}"/><path d="M-6.5 0 Q0 1.6 6.5 0" stroke="${shade(lip, -0.35)}" stroke-width=".9" fill="none"/><ellipse cx="-2" cy="1.8" rx="1.6" ry=".6" fill="#fff" opacity=".3"/>`,
    flat: `<path d="M-5 1 h10" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/>`,
    o: `<ellipse cy="2" rx="3.4" ry="4.2" fill="#7a2531"/>`,
    smirk: `<path d="M-7 1 q8 3 14 -3" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    tongue: `<path d="M-7 -1 q7 6 14 0" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M-3 2 q3 6 6 0 z" fill="#f26f8d"/>`,
    frown: `<path d="M-6 3 q6 -5 12 0" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
  }[c.mouth] || '';
  const fc = c.facialColor && c.facialColor !== 'auto' ? c.facialColor : c.hair === 'none' ? AV.hairColor[2] : hc;
  const MUST = {
    classic: `<path d="M-10 -3 q5 -4 10 -1 q5 -3 10 1 q-5 3 -10 1 q-5 2 -10 -1 z" fill="${fc}"/>`,
    handlebar: `<path d="M-11.5 -6 q-1 4.5 3 3.4 q4.2 -3.4 8.5 -1.2 q4.3 -2.2 8.5 1.2 q4 1.1 3 -3.4 q-1.6 4.4 -6.2 2.2 q-3.2 -2 -5.3 .2 q-2.1 -2.2 -5.3 -.2 q-4.6 2.2 -6.2 -2.2 z" fill="${fc}"/>`,
    thin: `<path d="M-8.5 -3.4 q8.5 -2.6 17 0" stroke="${fc}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`,
  }[c.mustache] || '';
  const mouthG = `<g transform="translate(60 ${mouthY}) scale(${mouthS})">${c.beard === 'goatee' ? `<path d="M-4.5 4.5 q4.5 9 9 0 q-4.5 2.4 -9 0 z" fill="${fc}"/>` : ''}${MOUTH}${MUST}</g>`;
  const jaw = hw / 24;
  const beardFull = `<path d="M36 62 C36 80 46 90 60 90 C74 90 84 80 84 62 C82 72 76 76 70 77 C66 74 54 74 50 77 C44 76 38 72 36 62 Z"/>`;
  const beard = {
    full: `<g transform="translate(60 ${mouthY - 72}) scale(${jaw} 1) translate(-60 0)" fill="${fc}">${beardFull}</g>`,
    stubble: `<g transform="translate(60 ${mouthY - 72}) scale(${jaw} 1) translate(-60 0)" fill="${fc}" opacity=".26">${beardFull}</g>`,
    chin: `<path d="M${60 - 9 * mouthS} ${mouthY + 6 * mouthS} q${9 * mouthS} ${9 * mouthS} ${18 * mouthS} 0 q-${9 * mouthS} ${4 * mouthS} -${18 * mouthS} 0 z" fill="${fc}"/>`,
  }[c.beard] || '';
  // ---- glasses follow the eyes
  const gc = c.glassesColor || ink, lr = 7.4 * Math.max(0.85, Math.min(1.25, eyeS)), lx1 = 60 - eyeGap, lx2 = 60 + eyeGap, ly = eyeY;
  const arms = (y0) => `<path d="M${lx1 - lr} ${y0} L${60 - hw + 1.5} ${y0 - 3} M${lx2 + lr} ${y0} L${60 + hw - 1.5} ${y0 - 3}" stroke="${gc}" stroke-width="2" stroke-linecap="round"/>`;
  const bridge = `<path d="M${lx1 + lr * 0.95} ${ly - 0.6} Q60 ${ly - 2.6} ${lx2 - lr * 0.95} ${ly - 0.6}" stroke="${gc}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  const lens = (x, k) => ({
    round: `<circle cx="${x}" cy="${ly}" r="${lr}"/>`, big: `<circle cx="${x}" cy="${ly}" r="${lr * 1.2}"/>`,
    square: `<rect x="${x - lr * 1.05}" y="${ly - lr * 0.82}" width="${lr * 2.1}" height="${lr * 1.64}" rx="3"/>`,
    cat: `<path d="M${x - lr} ${ly - lr * 0.5} Q${x} ${ly - lr * 0.9} ${x + lr} ${ly - lr * 0.6} Q${x + lr * 0.9} ${ly + lr * 0.9} ${x} ${ly + lr * 0.75} Q${x - lr} ${ly + lr * 0.7} ${x - lr} ${ly - lr * 0.5} Z" transform="${k ? `translate(${2 * x} 0) scale(-1 1)` : ''}"/>`,
    half: `<path d="M${x - lr} ${ly - lr * 0.35} Q${x} ${ly - lr * 0.75} ${x + lr} ${ly - lr * 0.35}"/>`,
    sun: `<path d="M${x - lr * 1.05} ${ly - lr * 0.65} h${lr * 2.1} v${lr * 0.55} q0 ${lr * 0.95} -${lr * 1.05} ${lr * 0.95} q-${lr * 1.05} 0 -${lr * 1.05} -${lr * 0.95} z"/>`,
  })[c.glasses] || '';
  const glasses = c.glasses === 'none' || !lens(0) ? '' : c.glasses === 'sun'
    ? `<g fill="#1f2433" stroke="${gc}" stroke-width="1.6">${lens(lx1, 0)}${lens(lx2, 1)}</g>${bridge}${arms(ly - lr * 0.55)}<path d="M${lx1 - lr * 0.6} ${ly - lr * 0.1} l${lr * 0.5} -${lr * 0.3}" stroke="#fff" stroke-width="1.4" opacity=".6" stroke-linecap="round"/>`
    : `<g fill="${c.glasses === 'half' ? 'none' : '#fff'}" fill-opacity=".22" stroke="${gc}" stroke-width="${c.glasses === 'half' ? 2.6 : 2}" stroke-linecap="round">${lens(lx1, 0)}${lens(lx2, 1)}</g>${bridge}${arms(ly - 1)}`;
  // ---- hats
  const hcol = c.hatColor, hdk = shade(hcol, -0.2);
  const hat = {
    beanie: `<path d="M34 50 C34 26 48 18 60 18 C72 18 86 26 86 50 Z" fill="${hcol}"/><rect x="32" y="44" width="56" height="10" rx="5" fill="${hdk}"/><circle cx="60" cy="16" r="6" fill="#fff"/>`,
    cap: `<path d="M35 48 C35 28 48 21 60 21 C72 21 85 28 85 48 Z" fill="${hcol}"/><path d="M60 46 C74 44 92 44 100 50 C92 54 74 52 60 50 Z" fill="${hdk}"/><circle cx="60" cy="22" r="2.6" fill="${hdk}"/>`,
    grad: `<path d="M38 40 C38 34 48 31 60 31 C72 31 82 34 82 40 L82 44 C72 41 48 41 38 44 Z" fill="#3a3f5c"/><path d="M30 31 L60 19 L90 31 L60 43 Z" fill="#2b2f45"/><path d="M90 31 v14" stroke="#f2c14e" stroke-width="2"/><circle cx="90" cy="47" r="3" fill="#f2c14e"/>`,
    crown: `<path d="M38 40 L42 20 L51 32 L60 16 L69 32 L78 20 L82 40 Z" fill="#f2c14e" stroke="#d9a520" stroke-width="1.5"/><circle cx="60" cy="31" r="3" fill="#ef476f"/><circle cx="47" cy="35" r="2" fill="#4f9dde"/><circle cx="73" cy="35" r="2" fill="#4f9dde"/>`,
    party: `<path d="M46 36 L60 4 L74 36 Z" fill="${hcol}"/><path d="M50 27 L70 27 M54 18 L66 18" stroke="#fff" stroke-width="2.4"/><circle cx="60" cy="4" r="4" fill="#ffd166"/>`,
    bow: `<path d="M72 30 L62 22 L62 38 Z M72 30 L82 22 L82 38 Z" fill="${hcol}"/><circle cx="72" cy="30" r="3.4" fill="${hdk}"/>`,
    headphones: `<path d="M34 60 C30 ${Math.min(28, hairTop + 6)} 90 ${Math.min(28, hairTop + 6)} 86 60" stroke="${hdk}" stroke-width="5" fill="none"/><rect x="${60 - hw - 4}" y="54" width="11" height="17" rx="5" fill="${hcol}"/><rect x="${60 + hw - 7}" y="54" width="11" height="17" rx="5" fill="${hcol}"/>`,
    flower: `<g transform="translate(80 36)">${[0, 1, 2, 3, 4].map(k => `<circle cx="${(Math.cos(k * 1.26) * 5).toFixed(1)}" cy="${(Math.sin(k * 1.26) * 5).toFixed(1)}" r="4.6" fill="${hcol}"/>`).join('')}<circle r="3.4" fill="#ffd166"/></g>`,
  }[c.hat] || '';
  // crowns and party hats sit on top of the hair; on very tall hair they shrink a little so they still fit in the circle
  const hatFit = { crown: [40, 16], party: [36, 0] }[c.hat];
  const hatT = hatFit && topLift < 0 ? (() => { const [base, tip] = hatFit, nb = base + topLift, s = Math.min(1, Math.max(0.6, (nb - 3) / (base - tip))); return `translate(60 ${nb.toFixed(2)}) scale(${s.toFixed(3)}) translate(-60 -${base})`; })() : `translate(0 ${hatDy.toFixed(2)})`;
  const hatG = hat ? `<g transform="${hatT}">${hat}</g>` : '';
  // ---- clothes, shaped by the shoulders slider.
  // The whole-body picture (editor) is a slim figure under the big head: shoulders narrower than the head, a waist a
  // little wider than the pants (the shirt always covers the waistband), thin arms, slim legs and small shoes.
  const full = !!opts.full || ['torso', 'legs'].includes(opts.view), B = full ? 140 : 122;
  const torsoD = full ? 'M44 140 C43 128 40 112 40 102 C40 94 48 89 60 89 C72 89 80 94 80 102 C80 112 77 128 76 140 Z' : 'M18 122 C18 98 36 88 60 88 C84 88 102 98 102 122 Z';
  const shoulders = `<path d="${torsoD}" fill="${tc}"/>`;
  const jacketL = full ? 'M44 140 C43 128 40 112 40 102 C40 94 48 89 52.5 89 L57 140 Z' : 'M18 122 C18 98 36 88 50 88 L56 122 Z';
  const band = full ? `<rect x="44" y="134.5" width="32" height="5.5" rx="2" fill="${td}"/>` : '';
  const buttons = (col, r) => (full ? [102, 111, 120, 129] : [104, 113]).map(y => `<circle cx="60" cy="${y}" r="${r}" fill="${col}"/>`).join('');
  const top = {
    tshirt: `${shoulders}<path d="M51 89 q9 7 18 0" stroke="${td}" stroke-width="2.6" fill="none"/>`,
    hoodie: `${shoulders}<path d="M53 90 L53 103 M67 90 L67 103" stroke="${t2}" stroke-width="1.8" stroke-linecap="round"/><circle cx="53" cy="104" r="1.6" fill="${t2}"/><circle cx="67" cy="104" r="1.6" fill="${t2}"/>${full ? `<path d="M47 116 h26 v10 q-13 3 -26 0 z" fill="${td}" opacity=".45"/>${band}` : `<path d="M44 114 h32" stroke="${td}" stroke-width="3"/>`}`,
    sweater: `${shoulders}<path d="M24 106 C40 100 80 100 96 106 L98 112 C80 106 40 106 22 112 Z" fill="${t2}" opacity=".8" clip-path="url(#${id}s)"/><path d="M50 89 q10 8 20 0" stroke="${td}" stroke-width="3.4" fill="none"/>${band}`,
    striped: `${shoulders}<g clip-path="url(#${id}s)" fill="${t2}" opacity=".85">${[96, 104, 112, 120, 128, 136].map(y => `<rect x="0" y="${y}" width="120" height="3.6"/>`).join('')}</g><path d="M51 89 q9 7 18 0" stroke="${td}" stroke-width="2.6" fill="none"/>`,
    collar: `${shoulders}<path d="M60 92 L60 ${B}" stroke="${td}" stroke-width="1.4"/><path d="M50 88 L60 96 L70 88 L65 87 L60 92 L55 87 Z" fill="${t2}"/>${buttons(td, 1.4)}`,
    jacket: `<path d="${torsoD}" fill="${t2}"/><path d="${jacketL}" fill="${tc}"/><path d="${jacketL}" transform="translate(120 0) scale(-1 1)" fill="${tc}"/>${full ? `<path d="M52.5 89 L56.5 99 L53.5 102 M67.5 89 L63.5 99 L66.5 102 M44 126 h7 M69 126 h7" stroke="${td}" stroke-width="1.6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>` : `<path d="M50 88 L56 100 L52 104 M70 88 L64 100 L68 104" stroke="${td}" stroke-width="2" fill="none" stroke-linejoin="round"/>`}`,
    turtleneck: `${shoulders}<path d="M46 112 h28" stroke="${td}" stroke-width="1.8" opacity=".6"/>`,
    tank: full ? `<path d="${torsoD}" fill="${skin}"/><path d="M44 140 C43 128 41 112 42 103 L47 96 Q49 93 51 93 Q55 101 60 101 Q65 101 69 93 Q71 93 73 96 L78 103 C79 112 77 128 76 140 Z" fill="${tc}"/>` : `<path d="${torsoD}" fill="${sd}"/><path d="M34 ${B} L36 96 Q40 92 44 92 Q52 102 60 102 Q68 102 76 92 Q80 92 84 96 L86 ${B} Z" fill="${tc}"/>`,
    blouse: `${shoulders}<path d="M47 87 Q53.5 96 60 92 Q66.5 96 73 87 Q66.5 100 60 96 Q53.5 100 47 87 Z" fill="${t2}"/>${buttons(t2, 1.5)}`,
    overalls: full ? `<path d="${torsoD}" fill="${t2}"/><path d="M46 ${B} L46 104 Q60 101 74 104 L74 ${B} Z" fill="${tc}"/><path d="M48 104 L50 91 M72 104 L70 91" stroke="${tc}" stroke-width="4" stroke-linecap="round"/><circle cx="48" cy="104" r="2" fill="#f2c14e"/><circle cx="72" cy="104" r="2" fill="#f2c14e"/><rect x="54" y="108" width="12" height="8" rx="2" fill="${td}"/>`
      : `<path d="${torsoD}" fill="${t2}"/><path d="M38 ${B} L38 104 Q60 100 82 104 L82 ${B} Z" fill="${tc}"/><path d="M42 104 L46 90 M78 104 L74 90" stroke="${tc}" stroke-width="5" stroke-linecap="round"/><circle cx="44" cy="104" r="2.4" fill="#f2c14e"/><circle cx="76" cy="104" r="2.4" fill="#f2c14e"/><rect x="52" y="108" width="16" height="9" rx="2" fill="${td}"/>`,
  }[c.top] || shoulders;
  // ---- the lower half (whole-body picture only): arms, legs, bottoms and shoes
  let bodyArms = '', hands = '', lower = '';
  const bw = 1 + (build - 1) * 0.6;   // whole-body width
  if (full) {
    const sleeve = c.top === 'tank' ? 'bare' : ['tshirt', 'striped', 'blouse', 'overalls'].includes(c.top) ? 'short' : 'long';
    const slc = c.top === 'overalls' ? t2 : tc, aL = 'M42.5 98 C38.5 106 37.5 122 39 135', aR = 'M77.5 98 C81.5 106 82.5 122 81 135';
    const stroke = (d, col, w) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
    bodyArms = stroke(aL, sleeve === 'long' ? slc : skin, 8) + stroke(aR, sleeve === 'long' ? slc : skin, 8)
      + (sleeve === 'short' ? stroke('M42.5 98 C40.6 102 39.6 107 39.1 112', slc, 9.6) + stroke('M77.5 98 C79.4 102 80.4 107 80.9 112', slc, 9.6) : '')
      + (sleeve === 'long' ? stroke('M38.7 131.5 L39 135', shade(slc, -0.2), 8.4) + stroke('M81.3 131.5 L81 135', shade(slc, -0.2), 8.4) : '');
    hands = `<circle cx="39.2" cy="138.6" r="4" fill="${skin}"/><circle cx="80.8" cy="138.6" r="4" fill="${skin}"/>`;
    const pc = c.top === 'overalls' ? tc : c.pantsColor || '#3a5a8c', pd = shade(pc, -0.22), sc = c.shoeColor || '#e85d4a', scd = shade(sc, -0.25);
    const pantsStyle = c.top === 'overalls' && !['jeans', 'baggy', 'cargo', 'sweats', 'shorts'].includes(c.pants) ? 'jeans' : c.pants || 'jeans';
    const legs = `<g fill="${skin}"><rect x="48" y="136" width="10" height="64"/><rect x="62" y="136" width="10" height="64"/></g>`;
    const long = 'M45 134 L75 134 L74 200 L62 200 L60 156 L58 200 L46 200 Z';
    const bottoms = {
      jeans: `<path d="${long}" fill="${pc}"/><path d="M60 140 L60 156" stroke="${pd}" stroke-width="1.1"/><path d="M46 195 h12 M62 195 h12" stroke="${pd}" stroke-width="1.2"/>`,
      sweats: `<path d="${long}" fill="${pc}"/><rect x="46" y="194" width="12" height="6" rx="2.4" fill="${pd}"/><rect x="62" y="194" width="12" height="6" rx="2.4" fill="${pd}"/><path d="M48 141 v51 M72 141 v51" stroke="#fff" stroke-width="1.3" opacity=".55"/>`,
      // baggy: wide legs that bunch a little over the shoes
      baggy: `<path d="M44.5 134 L75.5 134 L79.5 202.5 L61.8 202.5 L60 158 L58.2 202.5 L40.5 202.5 Z" fill="${pc}"/><path d="M60 140 L60 158 M43 186 q6 2.4 13 0 M64 186 q6 2.4 13 0 M42 195 q7 2 14 -.6 M64 194.4 q7 2.6 14 .6" stroke="${pd}" stroke-width="1" fill="none" opacity=".7"/>`,
      // cargo: straight legs with a big pocket on the side of each leg
      cargo: `<path d="M45 134 L75 134 L75.5 200 L62 200 L60 156 L58 200 L44.5 200 Z" fill="${pc}"/><path d="M60 140 L60 156" stroke="${pd}" stroke-width="1.1"/><g fill="${pd}" opacity=".55"><rect x="45.4" y="160" width="5.6" height="13" rx="1"/><rect x="69" y="160" width="5.6" height="13" rx="1"/></g><path d="M45.4 162.6 h5.6 M69 162.6 h5.6" stroke="${pc}" stroke-width="1"/><circle cx="48.2" cy="164.6" r=".8" fill="${pc}"/><circle cx="71.8" cy="164.6" r=".8" fill="${pc}"/><path d="M45 195.5 h13 M62 195.5 h13.5" stroke="${pd}" stroke-width="1.2"/>`,
      leggings: `<path d="M46 134 L74 134 L73 200 L62 200 L60 156 L58 200 L47 200 Z" fill="${pc}"/>`,
      shorts: `<path d="M45 134 L75 134 L75.5 164 L62 164 L60 152 L58 164 L44.5 164 Z" fill="${pc}"/><path d="M60 140 L60 152" stroke="${pd}" stroke-width="1.1"/>`,
      skirt: `<path d="M45 134 L75 134 L82 170 Q60 175 38 170 Z" fill="${pc}"/><path d="M52 139 L49 172 M60 139 V174 M68 139 L71 172" stroke="${pd}" stroke-width=".9" opacity=".6"/>`,
      longskirt: `<path d="M45 134 L75 134 L84 193 Q60 199 36 193 Z" fill="${pc}"/><path d="M52 139 L46 195 M60 139 V197 M68 139 L74 195" stroke="${pd}" stroke-width=".9" opacity=".6"/>`,
    }[pantsStyle] || '';
    const bootsUnder = c.shoes === 'boots' && ['jeans', 'baggy', 'cargo', 'sweats', 'leggings'].includes(pantsStyle);   // long pants go over the boots: only the boot below the hem shows
    const foot = cx => ({
      sneakers: `<path d="M${cx - 6} 199 h11 q2.5 0 2.5 2.5 v3 q0 2.5 -2.5 2.5 h-11 q-2.5 0 -2.5 -2.5 v-3 q0 -2.5 2.5 -2.5 z" fill="${sc}"/><rect x="${cx - 8.5}" y="204.4" width="16" height="2.8" rx="1.4" fill="#fff"/><path d="M${cx - 4} 201.2 h5" stroke="#fff" stroke-width="1"/>`,
      boots: `<path d="M${cx - 5.5} ${bootsUnder ? 196 : 186} h10 v${bootsUnder ? 3 : 13} q3 1 3 4 v3 h-16 v-5 q0 -2 3 -2 z" fill="${sc}"/><rect x="${cx - 8.5}" y="205" width="16" height="2.5" rx="1" fill="${scd}"/>${bootsUnder ? '' : `<path d="M${cx - 5.5} 189.5 h10" stroke="${scd}" stroke-width="1.2"/>`}`,
      flats: `<path d="M${cx - 6} 202.5 q6 -2.5 12 0 q2.5 1 2.5 2.5 v.8 q0 1.7 -2.5 1.7 h-12 q-2.5 0 -2.5 -1.7 v-.8 q0 -1.5 2.5 -2.5 z" fill="${sc}"/>`,
      sandals: `<path d="M${cx - 6} 201.5 h12 q2.5 0 2.5 2.5 v1.5 q0 1.5 -2.5 1.5 h-12 q-2.5 0 -2.5 -1.5 v-1.5 q0 -2.5 2.5 -2.5 z" fill="${skin}"/><path d="M${cx - 6} 203 h12 M${cx - 0.5} 200.5 v3" stroke="${sc}" stroke-width="1.6" stroke-linecap="round"/><rect x="${cx - 8.5}" y="206" width="16" height="2" rx="1" fill="${scd}"/>`,
    })[c.shoes || 'sneakers'] || '';
    const fsx = Math.max(0.9, Math.min(1.1, bw)), fx = Math.max(7.5 * bw, 8.4 * fsx);   // feet stay under the legs and never overlap; shoes keep their shape
    const shoe = cx => `<g transform="translate(${cx.toFixed(2)} 0) scale(${fsx.toFixed(3)} 1) translate(${(-cx).toFixed(2)} 0)">${foot(cx)}</g>`;
    const shoes = shoe(60 - fx) + shoe(60 + fx);
    lower = `<ellipse cx="60" cy="208" rx="${(16 + 6 * bw).toFixed(1)}" ry="2.8" fill="#000" opacity=".12"/><g transform="translate(60 0) scale(${bw} 1) translate(-60 0)">${legs}</g>${shoes}<g transform="translate(60 0) scale(${bw} 1) translate(-60 0)">${bottoms}</g>`;   // legs, then shoes, then bottoms: pant legs and skirt hems cover the tops of boots
  }
  const hood = c.top === 'hoodie' ? `<g transform="translate(60 0) scale(${full ? bw * 0.82 : build} 1) translate(-60 0)"><path d="M38 94 C36 78 84 78 82 94 L74 97 C70 90 50 90 46 97 Z" fill="${td}"/></g>` : '';
  const nk = Math.min(1.15, build), neck = `<rect x="${60 - 7 * nk}" y="78" width="${14 * nk}" height="13" fill="${sd}"/>`;
  const turtle = c.top === 'turtleneck' ? `<rect x="${60 - 8.5 * nk}" y="81" width="${17 * nk}" height="12" rx="4" fill="${tc}"/><path d="M${60 - 8.5 * nk} 86 h${17 * nk}" stroke="${td}" stroke-width="1.2"/>` : '';
  const cheeks = c.cheeks ? `<ellipse cx="${60 - eyeGap - 6}" cy="${eyeY + 8}" rx="4.4" ry="2.8" fill="#f49ab3" opacity=".6"/><ellipse cx="${60 + eyeGap + 6}" cy="${eyeY + 8}" rx="4.4" ry="2.8" fill="#f49ab3" opacity=".6"/>` : '';
  const freckles = c.freckles ? `<g fill="${shade(skin, -0.32)}" opacity=".65">${[[-13, 6], [-10, 8], [-15, 9], [-11.5, 10.6], [13, 6], [10, 8], [15, 9], [11.5, 10.6]].map(([x, y]) => `<circle cx="${60 + x}" cy="${eyeY + y}" r=".85"/>`).join('')}</g>` : '';
  const mole = c.mole ? `<circle cx="${60 + eyeGap + 3}" cy="${mouthY - 2}" r="1.1" fill="${shade(skin, -0.45)}"/>` : '';
  const vb = opts.view === 'face' ? '26 30 68 68' : opts.view === 'head' ? '12 2 96 96' : opts.view === 'torso' ? '22 80 76 76' : opts.view === 'legs' ? '22 132 76 76' : full ? '0 0 120 216' : '0 0 120 120';
  const tall = full && !opts.view, H = tall ? Math.round(size * 216 / 120) : size;   // the whole body is a little wider than the portrait, so wide shoulders and arms still fit
  return `<svg class="avsvg${tall ? ' avfull' : ''}${opts.view === 'legs' ? ' avlegs' : ''}" width="${size}" height="${H}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Avatar">
    <defs><clipPath id="${id}">${full ? '<rect width="120" height="216" rx="16"/>' : '<circle cx="60" cy="60" r="60"/>'}</clipPath>
      ${hairClip ? `<clipPath id="${id}h"><rect x="-10" y="${(clipLine + hatDy).toFixed(2)}" width="140" height="140"/></clipPath>` : ''}
      ${c.top === 'striped' || c.top === 'sweater' ? `<clipPath id="${id}s"><path d="${torsoD}"/></clipPath>` : ''}</defs>
    <g clip-path="url(#${id})">
      <rect x="-20" y="-20" width="160" height="${full ? 272 : 160}" fill="${c.bg}"/>
      ${hood}
      ${back ? `<g fill="${hc}"${hairClip}><g${flip}>${back}</g></g>` : ''}
      ${full ? lower : ''}
      ${neck}<g transform="translate(60 0) scale(${full ? bw : build} 1) translate(-60 0)">${bodyArms}${top}${hands}</g>${turtle}
      ${locks ? `<g fill="${hc}"${hairClip}><g${flip}>${locks}</g></g>` : ''}
      <ellipse cx="${60 - hw + 0.5}" cy="${Math.min(66, eyeY + 1)}" rx="4.6" ry="6" fill="${skin}"/><ellipse cx="${60 + hw - 0.5}" cy="${Math.min(66, eyeY + 1)}" rx="4.6" ry="6" fill="${skin}"/>
      <g fill="${skin}">${F[1]}</g>
      ${cheeks}${freckles}${mole}${brows}
      ${front ? `<g fill="${hc}"${hairClip}><g${flip}>${front}</g></g>` : ''}
      ${eyes}${nose}${beard}${mouthG}${glasses}${hatG}
    </g></svg>`;
}

/* ---------- Builder page ---------- */
let avDraft = null, avUndo = [];
// [tab id, label, style list key (+ the zoom for its pictures), color pickers [key, label, list], extra toggles [key, label]]
const AV_TABS = [
  ['face', '🙂 Face', [['face', 'Face shape', AV.face, 'head']], [['skin', 'Skin tone', AV.skin]], [['cheeks', 'Rosy cheeks'], ['freckles', 'Freckles'], ['mole', 'Beauty mark']]],
  ['hair', '💇 Hair', [['hair', 'Hairstyle', AV.hair, 'head']], [['hairColor', 'Hair color', AV.hairColor]], [['hairFlip', 'Flip the part to the other side']]],
  ['brows', '〰️ Eyebrows', [['brows', 'Eyebrows', AV.brows, 'face']], [['browColor', 'Color', ['auto', ...AV.hairColor]]], []],
  ['eyes', '👁️ Eyes', [['eyes', 'Eyes', AV.eyes, 'face']], [['eyeColor', 'Eye color (Big and Almond eyes)', AV.eyeColor]], []],
  ['nose', '👃 Nose', [['nose', 'Nose', AV.nose, 'face']], [], []],
  ['mouth', '👄 Mouth', [['mouth', 'Mouth', AV.mouth, 'face']], [['lipColor', 'Lip color (Lips)', AV.lipColor]], []],
  ['beard', '🧔 Beard', [['mustache', 'Mustache', AV.mustache, 'face'], ['beard', 'Beard', AV.beard, 'face']], [['facialColor', 'Color', ['auto', ...AV.hairColor]]], []],
  ['glasses', '👓 Glasses', [['glasses', 'Glasses', AV.glasses, 'face']], [['glassesColor', 'Frame color', AV.frames]], []],
  ['clothes', '👕 Tops', [['top', 'Top', AV.top, 'torso']], [['topColor', 'Main color', AV.colors], ['topColor2', 'Second color', [...new Set(['#f5f4f0', '#1f2937', ...AV.colors])]]], []],
  ['pants', '👖 Pants & shoes', [['pants', 'Bottoms', AV.pants, 'legs'], ['shoes', 'Shoes', AV.shoes, 'legs']], [['pantsColor', 'Bottoms color', AV.pantsColors], ['shoeColor', 'Shoe color', AV.shoeColors]], []],
  ['hat', '🎩 Hats', [['hat', 'Hats & accessories', AV.hat, 'head']], [['hatColor', 'Color', AV.colors], ['bg', 'Background', AV.bg]], []],
];
const AV_ADJ_TAB = { face: 'face', brows: 'brows', eyes: 'eyes', nose: 'nose', mouth: 'mouth' };
const avFmt = (k, v) => /Tilt/.test(k) ? `${v > 0 ? '+' : ''}${Math.round(v)}°` : /Size|build/.test(k) ? `${Math.round(v * 100)}%` : '';
function avAdjHtml(tab) {
  const list = AV.adjust[AV_ADJ_TAB[tab]]; if (!list) return '';
  return `<div class="av-group"><b>Adjust</b><div class="av-adj">${list.map(([k, label, lo, hi, st]) => { const v = avN(avDraft[k], avAdjDefaults()[k]);
    return `<div class="av-adj-row"><span>${label}</span><button type="button" class="btn sm" data-act="avNudge" data-k="${k}" data-d="-1" aria-label="${label} less">−</button>
      <input type="range" min="${lo}" max="${hi}" step="${st}" value="${v}" data-av-range="${k}" aria-label="${label}"><button type="button" class="btn sm" data-act="avNudge" data-k="${k}" data-d="1" aria-label="${label} more">+</button>
      <span class="muted small av-adj-v" data-av-v="${k}">${avFmt(k, v)}</span></div>`; }).join('')}
    <button type="button" class="btn sm ghost" data-act="avAdjReset" data-tab="${tab}" style="justify-self:start">↺ Reset these</button></div></div>`;
}
views.avatar = () => {
  const p = profiles.list.find(x => x.id === view.pid) || currentProfile();
  if (!p) { view = { name: 'home' }; return views.home(); }
  avDraft ||= avUpgrade(p.avatarCfg || randomAvatar());
  const tab = AV_TABS.find(t => t[0] === view.tab) ? view.tab : 'face', [, , styles, colors, toggles] = AV_TABS.find(t => t[0] === tab);
  const styleHtml = ([k, label, list, zoom]) => `<div class="av-group"><b>${label}</b><div class="av-options">${list.map(([v, name]) => `<button type="button" class="av-opt ${avDraft[k] === v ? 'on' : ''}" data-act="avSet" data-k="${k}" data-v="${v}" title="${esc(name)}" aria-pressed="${avDraft[k] === v}">${avatarSvg({ ...avDraft, [k]: v }, 64, { view: zoom })}<span class="small">${esc(name)}</span></button>`).join('')}</div></div>`;
  const colorHtml = ([k, label, list]) => `<div class="av-group"><b>${label}</b><div class="av-swatches">${list.map(c => c === 'auto'
    ? `<button type="button" class="av-sw av-auto ${(avDraft[k] || 'auto') === 'auto' ? 'on' : ''}" data-act="avSet" data-k="${k}" data-v="auto" title="Same as the hair">Hair</button>`
    : `<button type="button" class="av-sw ${avDraft[k] === c ? 'on' : ''}" style="background:${c}" data-act="avSet" data-k="${k}" data-v="${c}" title="${c}" aria-label="${c}"></button>`).join('')}
    <label class="av-sw av-custom ${list.includes(avDraft[k]) || (avDraft[k] || 'auto') === 'auto' ? '' : 'on'}" title="Pick any color" ${list.includes(avDraft[k]) || (avDraft[k] || 'auto') === 'auto' ? '' : `style="background:${avDraft[k]}"`}>＋<input type="color" data-av-color="${k}" value="${/^#[0-9a-f]{6}$/i.test(avDraft[k] || '') ? avDraft[k] : '#888888'}"></label></div></div>`;
  return `
    <div class="crumbs"><a data-act="home">Decks</a> / Avatar</div>
    <div class="row-between" style="margin-bottom:14px"><h2>Make your character</h2>
      <div class="row"><button type="button" class="btn" data-act="avCancel">Cancel</button><button type="button" class="btn primary" data-act="avSave">Save avatar</button></div></div>
    <div class="av-layout">
      <section class="panel av-preview">
        <div class="av-big">${avatarSvg(avDraft, 170, { full: true })}</div>
        <b style="font-size:18px">${esc(p.name || 'My profile')}</b>
        <div class="row" style="justify-content:center">
          <button type="button" class="btn" data-act="avRandom">🎲 Randomize</button>
          <button type="button" class="btn" data-act="avUndo" ${avUndo.length ? '' : 'disabled'}>↶ Undo</button>
          <button type="button" class="btn ghost" data-act="avReset">Start over</button>
        </div>
        <div class="muted small">Pick a style, a color, then nudge it into place.</div>
      </section>
      <section class="panel">
        <div class="av-tabs" role="tablist">${AV_TABS.map(([id, label]) => `<button type="button" role="tab" aria-selected="${id === tab}" class="${id === tab ? 'on' : ''}" data-act="avTab" data-tab="${id}">${label}</button>`).join('')}</div>
        <div class="stack">${styles.map(styleHtml).join('')}${avAdjHtml(tab)}${colors.map(colorHtml).join('')}
          ${toggles.map(([k, label]) => `<label class="check"><input type="checkbox" data-av-toggle="${k}" ${avDraft[k] ? 'checked' : ''}><span><b>${label}</b></span></label>`).join('')}</div>
      </section>
    </div>`;
};
function openAvatarBuilder(pid) { avDraft = null; avUndo = []; go({ name: 'avatar', pid: pid || currentProfileId, tab: 'face' }); }
const avRemember = () => { avUndo.push({ ...avDraft }); if (avUndo.length > 40) avUndo.shift(); };
function avLive() {   // redraw only the big picture (keeps a slider you're dragging in your hand)
  const b = document.querySelector('.av-big'); if (b) b.innerHTML = avatarSvg(avDraft, 170, { full: true });
  document.querySelectorAll('[data-av-v]').forEach(s => { s.textContent = avFmt(s.dataset.avV, avN(avDraft[s.dataset.avV], 0)); });
}
Object.assign(actions, {
  avTab: el => { view.tab = el.dataset.tab; render(); document.querySelector('.av-tabs .on')?.scrollIntoView({ inline: 'center', block: 'nearest' }); },   // on a phone the tab row scrolls sideways
  avSet: el => { avRemember(); avDraft[el.dataset.k] = el.dataset.v; render(); },
  avNudge: el => {
    const k = el.dataset.k, a = Object.values(AV.adjust).flat().find(x => x[0] === k); if (!a) return;
    avRemember(); const v = avN(avDraft[k], a[5]) + a[4] * 2 * +el.dataset.d; avDraft[k] = Math.round(Math.max(a[2], Math.min(a[3], v)) * 100) / 100; render();
  },
  avAdjReset: el => { avRemember(); for (const a of AV.adjust[AV_ADJ_TAB[el.dataset.tab]] || []) avDraft[a[0]] = a[5]; render(); },
  avUndo: () => { if (!avUndo.length) return; avDraft = avUndo.pop(); render(); },
  avRandom: () => { avRemember(); avDraft = randomAvatar(); render(); },
  avReset: () => { avRemember(); avDraft = defaultAvatar(); render(); },
  avCancel: () => { avDraft = null; avUndo = []; go({ name: 'home' }); },
  avSave: async () => {
    const p = profiles.list.find(x => x.id === view.pid) || currentProfile(); if (!p) return;
    p.avatarCfg = { ...avDraft }; p.avatarMode = 'built'; avDraft = null; avUndo = [];
    await saveProfiles(); go({ name: 'home' }); toast('Avatar saved! 🎉');
  },
  customizeAvatar: () => openAvatarBuilder(),
});
let avRangeFrom = null;
document.addEventListener('pointerdown', e => { if (e.target.matches?.('[data-av-range]') && avDraft) avRangeFrom = { ...avDraft }; });
document.addEventListener('input', e => {
  const k = e.target.dataset?.avRange; if (k && avDraft) { avDraft[k] = +e.target.value; avLive(); return; }
  const ck = e.target.dataset?.avColor; if (ck && avDraft) { avDraft[ck] = e.target.value; avLive(); }
});
document.addEventListener('change', e => {
  if (!avDraft) return;
  const t = e.target.dataset?.avToggle; if (t) { avRemember(); avDraft[t] = e.target.checked; render(); return; }
  if (e.target.dataset?.avRange) { avUndo.push(avRangeFrom || { ...avDraft }); avRangeFrom = null; render(); return; }
  if (e.target.dataset?.avColor) { avRemember(); render(); }
});
