'use strict';
/* ================= Game controllers (USB or Bluetooth) for the handheld games =================
   Works in Wordling Trails and Lexicon Saga. The controller "presses" the same keys the games already use,
   so walking, menus, battles and your own key settings all work as usual.
     D-pad or left stick → move / pick in menus      A (bottom button) → A      B (right button) → B
     Start (or Y, top button) → menu                  X (left button) or Select → scooter (Trails)
   When a question card is open, the D-pad moves a highlight over the answers and A picks one. */
const PAD = { prev: [], dir: null, dirAt: 0, repAt: 0, sel: -1, running: false, game: null, named: new Set() };
const padGame = () => view?.name === 'trails' && typeof tr !== 'undefined' && tr ? { id: 'trails', st: tr }
  : view?.name === 'saga' && typeof sg !== 'undefined' && sg ? { id: 'saga', st: sg } : null;
const padKey = (type, key) => document.body.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }));
const padTap = key => { padKey('keydown', key); padKey('keyup', key); };
const DIR_KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };

/* answer buttons on screen (a question card is open) */
function padOptions() { return [...document.querySelectorAll('.tr-opt, .sg-opt')].filter(b => !b.disabled && b.offsetParent); }
function padHighlight(opts) { opts.forEach((b, i) => b.classList.toggle('pad-sel', i === PAD.sel)); }
function padMoveSel(dir, opts) {
  if (PAD.sel < 0 || PAD.sel >= opts.length) { PAD.sel = 0; return padHighlight(opts); }
  const cols = opts.length > 1 && Math.abs(opts[0].offsetTop - opts[1].offsetTop) < 4 ? Math.max(1, opts.filter(b => Math.abs(b.offsetTop - opts[0].offsetTop) < 4).length) : 1;
  const step = { left: -1, right: 1, up: -cols, down: cols }[dir];
  PAD.sel = Math.min(opts.length - 1, Math.max(0, PAD.sel + step)); padHighlight(opts);
}

function padRead(p) {   // which buttons are down, and which way it points
  const b = i => !!(p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5));
  const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
  const dir = b(12) || ay < -0.55 ? 'up' : b(13) || ay > 0.55 ? 'down' : b(14) || ax < -0.55 ? 'left' : b(15) || ax > 0.55 ? 'right' : null;
  return { dir, a: b(0), b: b(1), x: b(2), y: b(3), select: b(8), start: b(9) };
}
function padLoop() {
  const pads = [...(navigator.getGamepads?.() || [])].filter(Boolean);
  if (!pads.length) { PAD.running = false; padRelease(); return; }
  requestAnimationFrame(padLoop);
  const g = padGame();
  if (!g || document.querySelector('#dlg')?.open || document.querySelector('#scanSheet')?.open) { padRelease(); PAD.prev = []; return; }
  if (PAD.game !== g.id) { padRelease(); PAD.game = g.id; PAD.sel = -1; }
  // all connected controllers together
  const now = pads.map(padRead).reduce((m, r) => ({ dir: m.dir || r.dir, a: m.a || r.a, b: m.b || r.b, x: m.x || r.x, y: m.y || r.y, select: m.select || r.select, start: m.start || r.start }), {});
  const was = PAD.prev, pressed = k => now[k] && !was[k]; PAD.prev = now;
  const t = performance.now(), opts = padOptions();
  if (opts.length) {                                   // answering a question card
    if (PAD.dir) { padKey('keyup', DIR_KEY[PAD.dir]); PAD.dir = null; }
    if (PAD.sel >= opts.length || !opts.some(o => o.classList.contains('pad-sel'))) { if (PAD.sel < 0 || PAD.sel >= opts.length) PAD.sel = 0; padHighlight(opts); }
    if (now.dir && (now.dir !== was.dir || t >= PAD.repAt)) { padMoveSel(now.dir, opts); PAD.repAt = t + (now.dir !== was.dir ? 380 : 150); }
    if (pressed('a')) { const o = opts[PAD.sel]; PAD.sel = -1; o?.click(); }
    return;
  }
  PAD.sel = -1;
  const ui = g.st.ui?.type, keys = typeof trKeys === 'function' ? trKeys() : {};
  // direction: hold it down like a key (walking); in menus it repeats while held
  if (now.dir !== PAD.dir) {
    if (PAD.dir) padKey('keyup', DIR_KEY[PAD.dir]);
    PAD.dir = now.dir; if (now.dir) { padKey('keydown', DIR_KEY[now.dir]); PAD.repAt = t + 380; }
  } else if (now.dir && ui === 'menu' && t >= PAD.repAt) { padKey('keydown', DIR_KEY[now.dir]); PAD.repAt = t + 140; }
  if (pressed('a')) padTap('Enter');
  if (pressed('b')) padTap('Escape');
  if (pressed('start') || pressed('y')) padTap(keys.menu?.[0] || 'm');
  if ((pressed('x') || pressed('select')) && g.id === 'trails') padTap(keys.scoot?.[0] || 'r');
}
function padRelease() { if (PAD.dir) { padKey('keyup', DIR_KEY[PAD.dir]); PAD.dir = null; } document.querySelectorAll('.pad-sel').forEach(b => b.classList.remove('pad-sel')); }
function padStart() { if (!PAD.running) { PAD.running = true; requestAnimationFrame(padLoop); } }
window.addEventListener('gamepadconnected', e => {
  padStart();
  const name = (e.gamepad.id || 'Controller').replace(/\s*\(.*$/, '').trim() || 'Controller';
  if (!PAD.named.has(e.gamepad.index)) { PAD.named.add(e.gamepad.index); toast(`🎮 ${name} connected. Use it in Wordling Trails and Lexicon Saga.`); }
});
window.addEventListener('gamepaddisconnected', e => { PAD.named.delete(e.gamepad.index); padRelease(); toast('🎮 Controller disconnected'); });
// a controller that was already plugged in before the app opened shows up after its first button press
if (navigator.getGamepads && [...navigator.getGamepads()].some(Boolean)) padStart();
