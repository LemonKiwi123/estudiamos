'use strict';
/* ================= 🧮 Math: scientific calculator + graphing calculator =================
   Everything runs on this device (no eval, no outside services). Three parts:
   1. mathParse / mathEval: a safe expression reader (2x, sin 30, √9, 5!, |−3|, nCr(5,2), …)
   2. The scientific calculator (Math page, and the floating 🧮 button on every other screen)
   3. The graphing calculator (Math page › Graphing): several y = … lines, zoom, pan, trace, zeros, crossings, highs/lows */

/* ---------- 1. Reading and working out an expression ---------- */
const MATH_FUNS = {
  sin: 1, cos: 1, tan: 1, asin: 1, acos: 1, atan: 1, sinh: 1, cosh: 1, tanh: 1, asinh: 1, acosh: 1, atanh: 1,
  sec: 1, csc: 1, cot: 1, ln: 1, log: 1, log2: 1, log10: 1, sqrt: 1, cbrt: 1, abs: 1, exp: 1, floor: 1, ceil: 1, round: 1, sign: 1,
  fact: 1, ncr: 2, npr: 2, min: -1, max: -1, root: 2, logb: 2, mod: 2, gcd: 2, lcm: 2,
};
const MATH_CONSTS = { pi: Math.PI, 'π': Math.PI, e: Math.E, tau: 2 * Math.PI, 'τ': 2 * Math.PI, phi: (1 + Math.sqrt(5)) / 2, 'φ': (1 + Math.sqrt(5)) / 2 };
const MATH_NAMES = [...Object.keys(MATH_FUNS), ...Object.keys(MATH_CONSTS), 'ans', 'x'].sort((a, b) => b.length - a.length);
class MathError extends Error {}

function mathTokens(src) {
  const s = String(src).replace(/[×·∙]/g, '*').replace(/[÷:]/g, '/').replace(/[−–—]/g, '-').replace(/²/g, '^2').replace(/³/g, '^3')
    .replace(/\*\*/g, '^').replace(/√/g, ' √ ').replace(/∛/g, ' ∛ ');
  const out = []; let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { i++; continue; }
    if (/[0-9.]/.test(ch)) {
      const m = /^(\d+\.?\d*|\.\d+)(E[+-]?\d+)?/.exec(s.slice(i)); if (!m) throw new MathError('A number looks wrong');
      out.push({ t: 'num', v: parseFloat(m[0]) }); i += m[0].length; continue;
    }
    if (/[a-zA-Zπτφ_]/.test(ch)) {   // names: "xsin" = x · sin, "2pi" = 2 · π
      const low = s.slice(i).toLowerCase(), name = MATH_NAMES.find(n => low.startsWith(n));
      if (!name) { const w = /^[a-zA-Z]+/.exec(s.slice(i))?.[0] || ch; throw new MathError(`I don’t know “${w}”`); }
      out.push({ t: MATH_FUNS[name] ? 'fn' : 'id', v: name }); i += name.length; continue;
    }
    if ('+-*/^()!,%|√∛'.includes(ch)) { out.push({ t: 'op', v: ch }); i++; continue; }
    if (ch === '[' || ch === '{') { out.push({ t: 'op', v: '(' }); i++; continue; }
    if (ch === ']' || ch === '}') { out.push({ t: 'op', v: ')' }); i++; continue; }
    if (ch === '=') { i++; continue; }
    throw new MathError(`I can’t use “${ch}”`);
  }
  return out;
}
/* returns a tree: ['num', v] ['id', name] ['neg', a] ['+', a, b] … ['fn', name, [args]] ['!', a] */
function mathParse(src) {
  let s = String(src || '').trim().replace(/^y\s*=/i, '').replace(/^f\s*\(\s*x\s*\)\s*=/i, '');
  if (!s) throw new MathError('Type something to work out');
  const open = (s.match(/[([{]/g) || []).length - (s.match(/[)\]}]/g) || []).length;
  if (open > 0) s += ')'.repeat(open);   // close brackets for you, like a real calculator: sin(30 = sin(30)
  const tk = mathTokens(s); let p = 0, absDepth = 0;
  const peek = () => tk[p], isOp = v => tk[p]?.t === 'op' && tk[p].v === v;
  const eat = v => { if (!isOp(v)) throw new MathError(v === ')' ? 'A “)” is missing' : `Expected “${v}”`); p++; };
  const startsFactor = () => { const t = peek(); if (!t) return false; if (t.t !== 'op') return true; return t.v === '(' || t.v === '√' || t.v === '∛' || (t.v === '|' && absDepth === 0); };
  function expr() {
    let a = term();
    while (isOp('+') || isOp('-')) { const o = tk[p++].v; a = [o, a, term()]; }
    return a;
  }
  function term() {
    let a = unary();
    for (;;) {
      if (isOp('*') || isOp('/')) { const o = tk[p++].v; a = [o, a, unary()]; }
      else if (peek()?.t === 'fn' && peek().v === 'mod' && tk[p + 1]?.v !== '(') { p++; a = ['mod', a, unary()]; }
      else if (startsFactor()) a = ['*', a, power()];   // 2x, 3(4), 2π, x sin x
      else return a;
    }
  }
  function unary() {
    if (isOp('-')) { p++; return ['neg', unary()]; }
    if (isOp('+')) { p++; return unary(); }
    return power();
  }
  function power() {
    const a = postfix();
    if (isOp('^')) { p++; return ['^', a, unary()]; }   // right to left: 2^3^2 = 2^9; -2^2 = -4
    return a;
  }
  function postfix() {
    let a = primary();
    for (;;) {
      if (isOp('!')) { p++; a = ['!', a]; }
      else if (isOp('%')) { p++; a = ['/', a, ['num', 100]]; }
      else return a;
    }
  }
  function primary() {
    const t = peek(); if (!t) throw new MathError('Something is missing at the end');
    if (t.t === 'num') { p++; return ['num', t.v]; }
    if (t.t === 'id') { p++; return ['id', t.v]; }
    if (t.t === 'fn') {
      p++; const name = t.v;
      if (isOp('(')) {
        p++; const args = [expr()]; while (isOp(',')) { p++; args.push(expr()); } eat(')');
        let a = ['fn', name, args];
        if (isOp('^') && /^(sin|cos|tan|sec|csc|cot|sinh|cosh|tanh)$/.test(name)) { p++; a = ['^', a, unary()]; }
        return a;
      }
      if (/^(sin|cos|tan|sec|csc|cot|sinh|cosh|tanh)$/.test(name) && isOp('^')) {   // sin^2 x = (sin x)^2
        p++; const e = unary(); return ['^', ['fn', name, [power()]], e];
      }
      return ['fn', name, [power()]];   // sin 30, ln 2, √ without brackets
    }
    if (t.v === '(') { p++; const a = expr(); eat(')'); return a; }
    if (t.v === '√') { p++; return ['fn', 'sqrt', [power()]]; }
    if (t.v === '∛') { p++; return ['fn', 'cbrt', [power()]]; }
    if (t.v === '|') { p++; absDepth++; const a = expr(); absDepth--; eat('|'); return ['fn', 'abs', [a]]; }
    throw new MathError(`“${t.v}” is in an odd place`);
  }
  const tree = expr();
  if (p < tk.length) throw new MathError(tk[p].v === ')' ? 'There’s an extra “)”' : `“${tk[p].v}” is in an odd place`);
  return tree;
}
function mathGamma(z) {   // Lanczos: 5! = 120, 0.5! = √π/2
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * mathGamma(1 - z));
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  z -= 1; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5; return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}
function mathFact(n) {
  if (Number.isInteger(n)) { if (n < 0) return NaN; if (n > 170) return Infinity; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
  return mathGamma(n + 1);
}
const mathGcd = (a, b) => { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) [a, b] = [b, a % b]; return a; };
/* env: { x, ans, deg } */
function mathEval(tree, env = {}) {
  const deg = !!env.deg, toRad = v => deg ? v * Math.PI / 180 : v, fromRad = v => deg ? v * 180 / Math.PI : v;
  const ev = n => {
    switch (n[0]) {
      case 'num': return n[1];
      case 'id': if (n[1] === 'x') { if (env.x === undefined) throw new MathError('x only works in the graphing calculator'); return env.x; }
        if (n[1] === 'ans') return env.ans ?? 0; return MATH_CONSTS[n[1]];
      case 'neg': return -ev(n[1]);
      case '+': return ev(n[1]) + ev(n[2]);
      case '-': return ev(n[1]) - ev(n[2]);
      case '*': return ev(n[1]) * ev(n[2]);
      case '/': return ev(n[1]) / ev(n[2]);
      case 'mod': { const a = ev(n[1]), b = ev(n[2]); return ((a % b) + b) % b; }
      case '^': { const a = ev(n[1]), b = ev(n[2]);
        if (a < 0 && !Number.isInteger(b)) { const inv = 1 / b, odd = Math.round(inv); if (Math.abs(inv - odd) < 1e-9 && odd % 2) return -Math.pow(-a, b); }   // (−8)^(1/3) = −2
        return Math.pow(a, b); }
      case '!': return mathFact(ev(n[1]));
      case 'fn': {
        const a = n[2].map(ev), [u, v] = a, name = n[1], need = MATH_FUNS[name];
        const shown = { ncr: 'nCr', npr: 'nPr' }[name] || name;
        if (need > 0 && a.length !== need) throw new MathError(`${shown} needs ${need} number${need > 1 ? 's' : ''}, like ${shown}(${need > 1 ? '5, 2' : '9'})`);
        switch (name) {
          case 'sin': return Math.sin(toRad(u)); case 'cos': return Math.cos(toRad(u)); case 'tan': return Math.tan(toRad(u));
          case 'sec': return 1 / Math.cos(toRad(u)); case 'csc': return 1 / Math.sin(toRad(u)); case 'cot': return 1 / Math.tan(toRad(u));
          case 'asin': return fromRad(Math.asin(u)); case 'acos': return fromRad(Math.acos(u)); case 'atan': return fromRad(Math.atan(u));
          case 'sinh': return Math.sinh(u); case 'cosh': return Math.cosh(u); case 'tanh': return Math.tanh(u);
          case 'asinh': return Math.asinh(u); case 'acosh': return Math.acosh(u); case 'atanh': return Math.atanh(u);
          case 'ln': return Math.log(u); case 'log': case 'log10': return Math.log10(u); case 'log2': return Math.log2(u);
          case 'logb': return Math.log(v) / Math.log(u);
          case 'sqrt': return Math.sqrt(u); case 'cbrt': return Math.cbrt(u); case 'root': return Math.abs(u % 2) === 1 ? Math.sign(v) * Math.pow(Math.abs(v), 1 / u) : Math.pow(v, 1 / u);
          case 'abs': return Math.abs(u); case 'exp': return Math.exp(u);
          case 'floor': return Math.floor(u); case 'ceil': return Math.ceil(u); case 'round': return Math.round(u); case 'sign': return Math.sign(u);
          case 'fact': return mathFact(u);
          case 'ncr': return Number.isInteger(u) && Number.isInteger(v) && v >= 0 && v <= u ? Math.round(mathFact(u) / (mathFact(v) * mathFact(u - v))) : NaN;
          case 'npr': return Number.isInteger(u) && Number.isInteger(v) && v >= 0 && v <= u ? Math.round(mathFact(u) / mathFact(u - v)) : NaN;
          case 'min': return Math.min(...a); case 'max': return Math.max(...a);
          case 'mod': return ((u % v) + v) % v;
          case 'gcd': return mathGcd(u, v); case 'lcm': return u && v ? Math.abs(Math.round(u) * Math.round(v)) / mathGcd(u, v) : 0;
        }
      }
    }
    throw new MathError('Something went wrong');
  };
  return ev(tree);
}
/* tidy a result: 0.1 + 0.2 = 0.3, sin 180° = 0, big and tiny numbers in ×10ⁿ */
function mathFmt(v) {
  if (typeof v !== 'number' || Number.isNaN(v)) return 'Not a number';
  if (!Number.isFinite(v)) return v > 0 ? '∞' : '−∞';
  if (Math.abs(v) < 1e-13) return '0';
  let r = parseFloat(v.toPrecision(12));
  const a = Math.abs(r);
  if (a >= 1e12 || a < 1e-6) { const [m, e] = r.toExponential(9).split('e'); return `${String(parseFloat(m))} × 10^${parseInt(e, 10)}`.replace(/-/g, '−'); }
  return String(r).replace('-', '−');
}
const mathCalc = (src, env) => mathEval(mathParse(src), env);
const mathShort = v => mathFmt(Number.isFinite(v) && Math.abs(v) >= 1e-6 && Math.abs(v) < 1e9 ? parseFloat(v.toPrecision(6)) : v);   // for graph points

/* ---------- saved state (in settings, so it syncs and backs up with everything else) ---------- */
const MATH_COLORS = ['#3b54e8', '#cf3f3f', '#23905a', '#c97c10', '#8a3fd1', '#0e8f9a'];
function mathState() {
  const m = (S.settings.math ||= {});
  m.hist ||= []; m.mem ??= 0; m.ans ??= 0; m.deg ??= true; m.expr ??= '';
  m.fns ||= [{ e: 'sin(x)', on: true }, { e: 'x^2/4 - 1', on: true }];
  m.tab ||= 'sci';
  return m;
}
const mathSave = () => { try { save(); } catch {} };

/* ---------- 2. The scientific calculator ---------- */
const MATH_SCI_KEYS = [
  ['sin', 'sin(', 'Sine'], ['cos', 'cos(', 'Cosine'], ['tan', 'tan(', 'Tangent'], ['ln', 'ln(', 'Natural log (base e)'], ['log', 'log(', 'Log base 10'],
  ['sin⁻¹', 'asin(', 'Inverse sine'], ['cos⁻¹', 'acos(', 'Inverse cosine'], ['tan⁻¹', 'atan(', 'Inverse tangent'], ['eˣ', 'e^(', 'e to the power'], ['10ˣ', '10^(', '10 to the power'],
  ['x²', '^2', 'Squared'], ['x³', '^3', 'Cubed'], ['xʸ', '^', 'To the power'], ['√', '√(', 'Square root'], ['∛', '∛(', 'Cube root'],
  ['(', '(', ''], [')', ')', ''], ['|x|', 'abs(', 'Absolute value'], ['n!', '!', 'Factorial'], ['%', '%', 'Percent'],
  ['π', 'π', 'Pi'], ['e', 'e', 'e (2.718…)'], ['Ans', 'Ans', 'The last answer'], ['1/x', '@inv', 'One over'], ['±', '@neg', 'Change sign'],
  ['MC', '@mc', 'Clear memory'], ['MR', '@mr', 'Use the number in memory'], ['M+', '@m+', 'Add the answer to memory'], ['M−', '@m-', 'Take the answer away from memory'], ['EXP', '×10^(', 'Times 10 to the power'],
];
const MATH_PAD_KEYS = [
  ['AC', '@ac', 'Clear'], ['⌫', '@back', 'Delete'], ['mod', ' mod ', 'Remainder'], ['÷', '÷', 'Divide'],
  ['7', '7'], ['8', '8'], ['9', '9'], ['×', '×', 'Times'],
  ['4', '4'], ['5', '5'], ['6', '6'], ['−', '−', 'Minus'],
  ['1', '1'], ['2', '2'], ['3', '3'], ['+', '+', 'Plus'],
  ['0', '0'], ['.', '.'], [',', ',', 'Comma, for nCr(5, 2) or max(1, 2)'], ['=', '@eq', 'Work it out'],
];
function mathPreview(src) {
  const m = mathState(); if (!String(src).trim()) return { ok: true, text: '' };
  try { return { ok: true, text: mathFmt(mathCalc(src, { ans: m.ans, deg: m.deg })) }; }
  catch (e) { return { ok: false, text: e instanceof MathError ? e.message : 'That doesn’t work out' }; }
}
function mathCalcHtml(where) {   // where: 'page' | 'pop'
  const m = mathState(), pv = mathPreview(m.expr);
  const key = ([label, ins, title], cls = '') => `<button type="button" class="mk ${cls}${ins === '@eq' ? ' eq' : ''}${/^\d$|^\.$/.test(label) ? ' num' : ''}" data-mk="${esc(ins)}" ${title ? `title="${esc(title)}"` : ''}>${esc(label)}</button>`;
  const hist = m.hist.slice(-(where === 'pop' ? 3 : 8));
  return `<div class="mcalc ${where}" data-mcalc="${where}">
    <div class="mscreen">
      <div class="mscreen-top"><button type="button" class="mdeg" data-mk="@deg" title="Angles in degrees or radians">${m.deg ? 'DEG' : 'RAD'}</button>
        ${m.mem ? `<span class="mmem" title="Memory: ${esc(mathFmt(m.mem))}">M</span>` : ''}
        ${hist.length ? `<button type="button" class="mhist-clear" data-mk="@hclear" title="Clear the history">🧹</button>` : ''}</div>
      <div class="mhist">${hist.map(h => `<button type="button" class="mh" data-mk="@use" data-v="${esc(h.e)}" title="Use this again"><span>${esc(h.e)}</span><b>= ${esc(h.r)}</b></button>`).join('')}</div>
      <input class="minput" type="text" inputmode="${where === 'pop' ? 'none' : 'text'}" autocomplete="off" spellcheck="false" value="${esc(m.expr)}" placeholder="Type or tap: 2(3+4)^2, sin 30, √2…" aria-label="Calculation">
      <div class="mres ${pv.ok ? '' : 'err'}" aria-live="polite">${pv.text ? (pv.ok ? '= ' : '') + esc(pv.text) : '&nbsp;'}</div>
    </div>
    <div class="mkeys"><div class="mk-sci">${MATH_SCI_KEYS.map(k => key(k, 'fn')).join('')}</div><div class="mk-pad">${MATH_PAD_KEYS.map(k => key(k, /^[A-Z⌫]|mod/.test(k[0]) ? 'op2' : /[÷×−+]/.test(k[0]) ? 'op' : '')).join('')}</div></div>
  </div>`;
}
function mathRefresh(box) {   // redraw one calculator in place, keeping the caret
  const where = box.dataset.mcalc, inp = box.querySelector('.minput'), pos = inp && document.activeElement === inp ? inp.selectionStart : null;
  const tmp = document.createElement('div'); tmp.innerHTML = mathCalcHtml(where); box.replaceWith(tmp.firstElementChild);
  const nb = document.querySelector(`[data-mcalc="${where}"]`), ni = nb?.querySelector('.minput');
  if (ni && pos != null) { ni.focus({ preventScroll: true }); try { ni.setSelectionRange(pos, pos); } catch {} }
}
function mathLivePreview(box) {
  const m = mathState(), pv = mathPreview(m.expr), r = box.querySelector('.mres'); if (!r) return;
  r.className = 'mres' + (pv.ok ? '' : ' err'); r.innerHTML = pv.text ? (pv.ok ? '= ' : '') + esc(pv.text) : '&nbsp;';
}
function mathEquals(box) {
  const m = mathState(), src = m.expr.trim(); if (!src) return;
  try {
    const v = mathCalc(src, { ans: m.ans, deg: m.deg }), r = mathFmt(v);
    m.hist.push({ e: src, r }); if (m.hist.length > 40) m.hist.splice(0, m.hist.length - 40);
    if (Number.isFinite(v)) { m.ans = v; m.expr = /×/.test(r) ? 'Ans' : r.replace('−', '-'); } else m.expr = '';
    m.caret = m.expr.length;
    mathSave(); mathRefresh(box);
  } catch (e) { const res = box.querySelector('.mres'); if (res) { res.className = 'mres err'; res.textContent = e instanceof MathError ? e.message : 'That doesn’t work out'; } }
}
function mathKey(box, k, btn) {
  const m = mathState(), inp = box.querySelector('.minput');
  // where to type: the caret if the box has focus, otherwise where we last were (phones don't focus the box)
  const focused = inp && document.activeElement === inp, s0 = inp ? inp.value : m.expr, keep = Math.min(m.caret ?? s0.length, s0.length);
  let s = s0, a = focused ? inp.selectionStart ?? s.length : keep, b = focused ? inp.selectionEnd ?? s.length : keep;
  const justAnswered = m.hist.length && s === (/×/.test(m.hist.at(-1).r) ? 'Ans' : m.hist.at(-1).r.replace('−', '-')) && a === s.length;
  const put = text => { s = s.slice(0, a) + text + s.slice(b); a = b = a + text.length; };
  switch (k) {
    case '@eq': m.expr = s; return mathEquals(box);
    case '@ac': s = ''; a = b = 0; break;
    case '@back': if (a !== b) put(''); else if (a > 0) { s = s.slice(0, a - 1) + s.slice(a); a = b = a - 1; } break;
    case '@deg': m.deg = !m.deg; break;
    case '@neg': s = s.trim() ? (/^-\(.*\)$/.test(s) ? s.slice(2, -1) : `-(${s})`) : '-'; a = b = s.length; break;
    case '@inv': s = s.trim() ? `1/(${s})` : '1/'; a = b = s.length; break;
    case '@mc': m.mem = 0; break;
    case '@mr': put(mathFmt(m.mem).replace('−', '-').replace(' × 10^', '×10^')); break;
    case '@m+': case '@m-': { let v; try { v = s.trim() ? mathCalc(s, { ans: m.ans, deg: m.deg }) : m.ans; } catch { v = NaN; }
      if (Number.isFinite(v)) { m.mem += k === '@m+' ? v : -v; if (typeof toast === 'function') toast(`Memory: ${mathFmt(m.mem)}`); } break; }
    case '@use': s = btn?.dataset.v || ''; a = b = s.length; break;
    case '@hclear': m.hist = []; break;
    default:
      if (justAnswered && /^[0-9.(√∛πeA]|^[a-z]+\(/.test(k)) { s = ''; a = b = 0; }   // a new number after = starts over
      put(k);
  }
  m.expr = s; m.caret = a; mathSave(); mathRefresh(box);
  const ni = document.querySelector(`[data-mcalc="${box.dataset.mcalc}"] .minput`);
  if (ni && !matchMedia('(hover: none)').matches) { ni.focus({ preventScroll: true }); try { ni.setSelectionRange(a, a); } catch {} }
}
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-mk]'); if (!btn) return;
  const box = btn.closest('[data-mcalc]'); if (!box) return;
  e.preventDefault(); mathKey(box, btn.dataset.mk, btn);
});
document.addEventListener('input', e => {
  if (!e.target.matches('.minput')) return;
  const box = e.target.closest('[data-mcalc]'), m = mathState(); m.expr = e.target.value; m.caret = e.target.selectionStart; mathLivePreview(box);
  clearTimeout(mathKey.t); mathKey.t = setTimeout(mathSave, 600);
});
for (const ev of ['click', 'keyup', 'select']) document.addEventListener(ev, e => { if (e.target.matches?.('.minput')) mathState().caret = e.target.selectionStart; });
document.addEventListener('keydown', e => {
  if (!e.target.matches?.('.minput')) return;
  const box = e.target.closest('[data-mcalc]');
  if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); mathState().expr = e.target.value; mathEquals(box); }
  else if (e.key === 'Escape' && e.target.value) { e.preventDefault(); e.stopPropagation(); mathKey(box, '@ac'); }
});

/* ---------- 3. The graphing calculator ---------- */
const mg = { cx: 0, cy: 0, scale: 40, marks: [], trace: null, drag: null, pts: new Map(), found: null };
function mathGraphHtml() {
  const m = mathState();
  return `<div class="mgraph">
    <div class="mg-fns">${m.fns.map((f, i) => {
      let err = ''; try { if (f.e.trim()) mathParse(f.e); } catch (e) { err = e.message; }
      return `<div class="mg-fn ${f.on ? '' : 'off'}">
        <button type="button" class="mg-dot" data-mg="toggle" data-i="${i}" style="--c:${MATH_COLORS[i % MATH_COLORS.length]}" title="${f.on ? 'Hide' : 'Show'} this line" aria-pressed="${f.on}"></button>
        <span class="mg-y">y =</span>
        <input class="inp mg-in" data-i="${i}" value="${esc(f.e)}" placeholder="like 2x + 1, x^2, sin(x)" autocomplete="off" spellcheck="false" aria-label="Line ${i + 1}">
        <button type="button" class="btn sm ghost" data-mg="del" data-i="${i}" title="Remove this line">✕</button>
        ${err ? `<div class="mg-err">${esc(err)}</div>` : ''}</div>`;
    }).join('')}
      ${m.fns.length < 6 ? `<button type="button" class="btn sm" data-mg="add">＋ Add a line</button>` : ''}</div>
    <div class="mg-wrap"><canvas id="mgCanvas" aria-label="Graph of your lines"></canvas>
      <div class="mg-zoom"><button type="button" class="btn sm" data-mg="in" title="Zoom in">＋</button><button type="button" class="btn sm" data-mg="out" title="Zoom out">－</button><button type="button" class="btn sm" data-mg="home" title="Back to the start">⌂</button></div>
      <div class="mg-read" id="mgRead" aria-live="polite"></div></div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px">
      <button type="button" class="btn sm" data-mg="zeros" title="Where each line crosses the x-axis">⓪ Zeros</button>
      <button type="button" class="btn sm" data-mg="cross" title="Where two lines meet">✖️ Where lines cross</button>
      <button type="button" class="btn sm" data-mg="ext" title="The highest and lowest points (peaks and dips)">⛰️ Highs &amp; lows</button>
      ${mg.found ? `<button type="button" class="btn sm ghost" data-mg="clear">Clear points</button>` : ''}
      <span class="muted small" style="margin-left:auto">Drag to move · scroll or pinch to zoom · tap the graph to trace · angles in radians</span>
    </div>
    ${mg.found ? `<div class="mg-found">${mg.found.title ? `<b>${esc(mg.found.title)}</b>` : ''}${mg.found.list.length ? mg.found.list.map(p => `<button type="button" class="mg-pt" data-mg="goto" data-x="${p.x}" data-y="${p.y}"><i style="background:${p.c}"></i>${esc(p.label)} (${esc(mathShort(p.x))}, ${esc(mathShort(p.y))})</button>`).join('') : '<span class="muted small">None on screen. Try moving or zooming out.</span>'}</div>` : ''}
  </div>`;
}
const mgFns = () => mathState().fns.map((f, i) => { if (!f.on || !f.e.trim()) return null; try { const t = mathParse(f.e); return { i, t, c: MATH_COLORS[i % MATH_COLORS.length], f: x => mathEval(t, { x, deg: false, ans: mathState().ans }) }; } catch { return null; } }).filter(Boolean);
function mgNiceStep(px) {   // a grid step of 1, 2 or 5 × 10ⁿ that is about 80 px wide
  const raw = 80 / px, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
}
function mgDraw() {
  const cv = document.getElementById('mgCanvas'); if (!cv) return;
  const W = cv.clientWidth, H = cv.clientHeight, dpr = window.devicePixelRatio || 1;
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const css = getComputedStyle(document.body), col = n => css.getPropertyValue(n).trim() || '#888';
  const X = x => W / 2 + (x - mg.cx) * mg.scale, Y = y => H / 2 - (y - mg.cy) * mg.scale;
  const ux = px => mg.cx + (px - W / 2) / mg.scale;
  g.fillStyle = col('--surface'); g.fillRect(0, 0, W, H);
  const step = mgNiceStep(mg.scale), x0 = ux(0), x1 = ux(W), y0 = mg.cy - H / 2 / mg.scale, y1 = mg.cy + H / 2 / mg.scale;
  g.lineWidth = 1; g.strokeStyle = col('--border'); g.beginPath();
  for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) { const px = Math.round(X(x)) + .5; g.moveTo(px, 0); g.lineTo(px, H); }
  for (let y = Math.ceil(y0 / step) * step; y <= y1; y += step) { const py = Math.round(Y(y)) + .5; g.moveTo(0, py); g.lineTo(W, py); }
  g.stroke();
  // axes and numbers
  const ax = Math.min(Math.max(X(0), 0), W), ay = Math.min(Math.max(Y(0), 0), H);
  g.strokeStyle = col('--muted'); g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, ay); g.lineTo(W, ay); g.moveTo(ax, 0); g.lineTo(ax, H); g.stroke();
  g.fillStyle = col('--muted'); g.font = '11px system-ui, sans-serif';
  const lab = v => mathFmt(Math.abs(v) < step / 1e6 ? 0 : v).replace(' × 10^', 'e');
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) { if (Math.abs(x) < step / 2) continue; g.fillText(lab(x), X(x), Math.min(ay + 4, H - 14)); }
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let y = Math.ceil(y0 / step) * step; y <= y1; y += step) { if (Math.abs(y) < step / 2) continue; g.fillText(lab(y), Math.max(ax - 4, 30), Y(y)); }
  // the lines: break at gaps and jumps (tan x, 1/x)
  for (const fn of mgFns()) {
    g.strokeStyle = fn.c; g.lineWidth = 2.4; g.beginPath(); let pen = false, lastY = null;
    for (let px = 0; px <= W; px += 1) {
      let y; try { y = fn.f(ux(px)); } catch { y = NaN; }
      if (!Number.isFinite(y)) { pen = false; lastY = null; continue; }
      const py = Y(y);
      if (pen && lastY != null && Math.abs(py - lastY) > H * 2) pen = false;   // a jump, not a steep line
      if (py < -H * 4 || py > H * 5) { if (pen) g.lineTo(px, Math.max(-H, Math.min(2 * H, py))); pen = false; lastY = py; continue; }
      if (pen) g.lineTo(px, py); else g.moveTo(px, py); pen = true; lastY = py;
    }
    g.stroke();
  }
  // found points, then the trace dot
  for (const p of mg.found?.list || []) { g.fillStyle = col('--surface'); g.strokeStyle = p.c; g.lineWidth = 2.5; g.beginPath(); g.arc(X(p.x), Y(p.y), 5, 0, 7); g.fill(); g.stroke(); }
  const t = mg.trace;
  if (t) { g.fillStyle = t.c; g.beginPath(); g.arc(X(t.x), Y(t.y), 5.5, 0, 7); g.fill(); g.strokeStyle = col('--muted'); g.setLineDash([4, 4]); g.lineWidth = 1; g.beginPath(); g.moveTo(X(t.x), 0); g.lineTo(X(t.x), H); g.stroke(); g.setLineDash([]); }
  const rd = document.getElementById('mgRead');
  if (rd) rd.innerHTML = t ? `<i style="background:${t.c}"></i>x = ${esc(mathShort(t.x))}, y = ${esc(mathShort(t.y))}` : '';
}
function mgTraceAt(px, py) {   // the line nearest the pointer, at that x
  const cv = document.getElementById('mgCanvas'); if (!cv) return;
  const W = cv.clientWidth, H = cv.clientHeight, x = mg.cx + (px - W / 2) / mg.scale; let best = null;
  for (const fn of mgFns()) { let y; try { y = fn.f(x); } catch { continue; } if (!Number.isFinite(y)) continue;
    const d = Math.abs(H / 2 - (y - mg.cy) * mg.scale - py); if (!best || d < best.d) best = { d, x, y, c: fn.c }; }
  mg.trace = best; mgDraw();
}
/* numbers: where f changes sign (zeros, crossings) or f' changes sign (highs and lows), refined by halving */
function mgScan(f, x0, x1, n = 900) {
  const out = []; let px = x0, py = f(px);
  for (let k = 1; k <= n; k++) {
    const x = x0 + (x1 - x0) * k / n, y = f(x);
    if (Number.isFinite(py) && Number.isFinite(y)) {
      if (y === 0) out.push(x);
      else if (py * y < 0) {
        let a = px, b = x, fa = py;
        for (let j = 0; j < 60; j++) { const mid = (a + b) / 2, fm = f(mid); if (!Number.isFinite(fm)) break; if (fa * fm <= 0) b = mid; else { a = mid; fa = fm; } }
        const r = (a + b) / 2, scale = Math.max(1, Math.abs(f(px)), Math.abs(f(x)));
        if (Math.abs(f(r)) < 1e-6 * scale) out.push(r);   // a real crossing, not a jump like tan x
      }
    }
    px = x; py = y;
  }
  return out.filter((x, i, a) => !i || Math.abs(x - a[i - 1]) > 1e-9);
}
function mgFind(kind) {
  const cv = document.getElementById('mgCanvas'); if (!cv) return;
  const W = cv.clientWidth, x0 = mg.cx - W / 2 / mg.scale, x1 = mg.cx + W / 2 / mg.scale, fns = mgFns(), list = [];
  const safe = f => x => { try { return f(x); } catch { return NaN; } };
  const tidy = v => Math.abs(v) < 1e-10 ? 0 : v;
  if (kind === 'zeros') for (const fn of fns) for (const x of mgScan(safe(fn.f), x0, x1)) list.push({ x: tidy(x), y: 0, c: fn.c, label: `y${fn.i + 1} zero` });
  if (kind === 'cross') for (let a = 0; a < fns.length; a++) for (let b = a + 1; b < fns.length; b++) {
    const A = safe(fns[a].f), B = safe(fns[b].f);
    for (const x of mgScan(x => A(x) - B(x), x0, x1)) list.push({ x: tidy(x), y: tidy(A(x)), c: fns[a].c, label: `y${fns[a].i + 1} & y${fns[b].i + 1}` });
  }
  if (kind === 'ext') for (const fn of fns) {
    const f = safe(fn.f), h = (x1 - x0) / 1e5, d = x => (f(x + h) - f(x - h)) / (2 * h);
    for (const x of mgScan(d, x0, x1)) { const y = f(x), c = f(x - h * 50), e = f(x + h * 50); if (!Number.isFinite(y)) continue;
      list.push({ x: tidy(x), y: tidy(y), c: fn.c, label: `y${fn.i + 1} ${y > c && y > e ? 'high' : y < c && y < e ? 'low' : 'flat'}` }); }
  }
  mg.found = { title: { zeros: 'Zeros', cross: 'Where lines cross', ext: 'Highs & lows' }[kind] + (list.length > 30 ? ' (first 30)' : ''), list: list.slice(0, 30) };
  if (kind === 'cross' && fns.length < 2) mg.found.title = 'Add a second line to see where they cross';
  mathRedrawGraph();
}
function mathRedrawGraph() {
  const box = document.querySelector('.mgraph'); if (!box) return;
  const focus = document.activeElement?.matches?.('.mg-in') ? { i: document.activeElement.dataset.i, p: document.activeElement.selectionStart } : null;
  const tmp = document.createElement('div'); tmp.innerHTML = mathGraphHtml(); box.replaceWith(tmp.firstElementChild);
  if (focus) { const el = document.querySelector(`.mg-in[data-i="${focus.i}"]`); if (el) { el.focus(); try { el.setSelectionRange(focus.p, focus.p); } catch {} } }
  mgMount();
}
function mgZoom(f, px, py) {
  const cv = document.getElementById('mgCanvas'); if (!cv) return;
  const W = cv.clientWidth, H = cv.clientHeight; px ??= W / 2; py ??= H / 2;
  const x = mg.cx + (px - W / 2) / mg.scale, y = mg.cy - (py - H / 2) / mg.scale;
  mg.scale = Math.min(1e7, Math.max(1e-4, mg.scale * f));
  mg.cx = x - (px - W / 2) / mg.scale; mg.cy = y + (py - H / 2) / mg.scale; mgDraw();
}
function mgMount() {
  const cv = document.getElementById('mgCanvas'); if (!cv || cv.dataset.on) return mgDraw();
  cv.dataset.on = 1; mgDraw();
  const pos = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId); mg.pts.set(e.pointerId, pos(e));
    if (mg.pts.size === 1) { const [x, y] = pos(e); mg.drag = { x, y, cx: mg.cx, cy: mg.cy, moved: false }; }
    else if (mg.pts.size === 2) { const [a, b] = [...mg.pts.values()]; mg.pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: mg.scale }; mg.drag = null; }
  });
  cv.addEventListener('pointermove', e => {
    const [x, y] = pos(e);
    if (mg.pts.has(e.pointerId)) mg.pts.set(e.pointerId, [x, y]);
    if (mg.pinch && mg.pts.size === 2) { const [a, b] = [...mg.pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); mgZoom(mg.pinch.s * d / mg.pinch.d / mg.scale, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); return; }
    if (mg.drag) {
      if (Math.hypot(x - mg.drag.x, y - mg.drag.y) > 4) mg.drag.moved = true;
      if (mg.drag.moved) { mg.cx = mg.drag.cx - (x - mg.drag.x) / mg.scale; mg.cy = mg.drag.cy + (y - mg.drag.y) / mg.scale; mg.trace = null; mgDraw(); }
      return;
    }
    if (e.pointerType === 'mouse') mgTraceAt(x, y);
  });
  const up = e => {
    const [x, y] = pos(e); mg.pts.delete(e.pointerId);
    if (mg.pts.size < 2) mg.pinch = null;
    if (mg.drag && !mg.drag.moved) mgTraceAt(x, y);   // a tap traces
    mg.drag = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' && !mg.drag) { mg.trace = null; mgDraw(); } });
  cv.addEventListener('wheel', e => { e.preventDefault(); const [x, y] = pos(e); mgZoom(Math.exp(-e.deltaY * 0.0015), x, y); }, { passive: false });
}
window.addEventListener('resize', () => { if (document.getElementById('mgCanvas')) mgDraw(); });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-mg]'); if (!b) return;
  const m = mathState(), i = +b.dataset.i;
  switch (b.dataset.mg) {
    case 'toggle': m.fns[i].on = !m.fns[i].on; break;
    case 'del': m.fns.splice(i, 1); if (!m.fns.length) m.fns.push({ e: '', on: true }); break;
    case 'add': m.fns.push({ e: '', on: true }); mathSave(); mathRedrawGraph(); document.querySelector(`.mg-in[data-i="${m.fns.length - 1}"]`)?.focus(); return;
    case 'in': return mgZoom(1.5);
    case 'out': return mgZoom(1 / 1.5);
    case 'home': mg.cx = 0; mg.cy = 0; mg.scale = 40; mg.trace = null; return mgDraw();
    case 'zeros': case 'cross': case 'ext': return mgFind(b.dataset.mg);
    case 'clear': mg.found = null; break;
    case 'goto': mg.cx = +b.dataset.x; mg.cy = +b.dataset.y; mg.trace = null; return mgDraw();
  }
  mg.found = null; mathSave(); mathRedrawGraph();
});
document.addEventListener('input', e => {
  if (!e.target.matches('.mg-in')) return;
  const m = mathState(), i = +e.target.dataset.i; m.fns[i].e = e.target.value; mg.found = null; mg.trace = null;
  mgDraw();
  let err = ''; try { if (e.target.value.trim()) mathParse(e.target.value); } catch (x) { err = x.message; }
  const row = e.target.closest('.mg-fn'); let el = row.querySelector('.mg-err');
  if (err) { if (!el) { el = document.createElement('div'); el.className = 'mg-err'; row.append(el); } el.textContent = err; } else el?.remove();
  clearTimeout(mgDraw.t); mgDraw.t = setTimeout(mathSave, 600);
});

/* ---------- 💵 tip calculator ---------- */
function tipState() { const m = mathState(); m.tipc ||= { bill: '', pct: 18, people: 1, tax: '', afterTax: false, round: false }; return m.tipc; }
function tipCalc() {
  const t = tipState(), bill = Math.max(0, parseFloat(t.bill) || 0), tax = Math.max(0, parseFloat(t.tax) || 0), n = Math.max(1, Math.round(t.people) || 1);
  const base = t.afterTax ? bill + tax : bill, tip = base * (+t.pct || 0) / 100, total = bill + tax + tip;
  let each = total / n, eachTip = tip / n;
  if (t.round) { const r = Math.ceil(each); eachTip += r - each; each = r; }
  return { bill, tax, tip: t.round ? eachTip * n : tip, total: t.round ? each * n : total, each, eachTip, n };
}
const money = v => (Math.round(v * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function tipHtml() {
  const t = tipState(), r = tipCalc();
  return `<div class="tip">
    <div class="tip-in">
      <label class="field">Bill amount<input class="inp tip-big" inputmode="decimal" data-tip="bill" value="${esc(t.bill)}" placeholder="0.00" autocomplete="off"></label>
      <div class="field">Tip<div class="tip-pcts">${[10, 15, 18, 20, 25].map(p => `<button type="button" class="btn ${+t.pct === p ? 'primary' : ''}" data-tipp="${p}">${p}%</button>`).join('')}
        <label class="tip-custom"><input class="inp" inputmode="decimal" data-tip="pct" value="${[10, 15, 18, 20, 25].includes(+t.pct) ? '' : esc(t.pct)}" placeholder="Other" aria-label="Other tip percent">%</label></div></div>
      <div class="field">Split between<div class="tip-people"><button type="button" class="btn" data-tipn="-1" aria-label="Fewer people">−</button><b>${r.n}</b> ${r.n === 1 ? 'person' : 'people'}<button type="button" class="btn" data-tipn="1" aria-label="More people">＋</button></div></div>
      <details ${t.tax ? 'open' : ''}><summary class="small">Tax and rounding</summary>
        <label class="field" style="margin-top:6px">Tax amount (optional)<input class="inp" inputmode="decimal" data-tip="tax" value="${esc(t.tax)}" placeholder="0.00"></label>
        <label class="check"><input type="checkbox" data-tip="afterTax" ${t.afterTax ? 'checked' : ''}><span>Tip on the total after tax</span></label>
        <label class="check"><input type="checkbox" data-tip="round" ${t.round ? 'checked' : ''}><span>Round each person up to a whole amount</span></label></details>
    </div>
    <div class="tip-out">
      <div class="tip-row"><span>Tip (${+t.pct || 0}%)</span><b>${money(r.tip)}</b></div>
      ${r.tax ? `<div class="tip-row"><span>Tax</span><b>${money(r.tax)}</b></div>` : ''}
      <div class="tip-row total"><span>Total</span><b>${money(r.total)}</b></div>
      ${r.n > 1 || t.round ? `<div class="tip-each"><span>Each person pays</span><b>${money(r.each)}</b><span class="muted small">${money(r.eachTip)} of that is tip</span></div>` : ''}
      <div class="tip-table"><div class="muted small">Quick look at this bill</div>${[10, 15, 18, 20, 25].map(p => { const tp = (t.afterTax ? r.bill + r.tax : r.bill) * p / 100; return `<div class="tip-row sm"><span>${p}%</span><span>tip ${money(tp)}</span><b>${money(r.bill + r.tax + tp)}</b></div>`; }).join('')}</div>
    </div></div>`;
}
function tipRedraw(keepFocus) { const box = document.querySelector('.tip'); if (!box) return; const f = keepFocus && document.activeElement?.dataset?.tip, pos = f ? document.activeElement.selectionStart : 0;
  const t = document.createElement('div'); t.innerHTML = tipHtml(); box.replaceWith(t.firstElementChild);
  if (f) { const el = document.querySelector(`[data-tip="${f}"]`); el?.focus(); try { el.setSelectionRange(pos, pos); } catch {} } }
document.addEventListener('input', e => { const k = e.target.dataset?.tip; if (!k || view.name !== 'math' || e.target.type === 'checkbox') return; const t = tipState();
  t[k] = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'); mathSave(); tipRedraw(true); });
document.addEventListener('change', e => { const k = e.target.dataset?.tip; if (!k || view.name !== 'math' || e.target.type !== 'checkbox') return; tipState()[k] = e.target.checked; mathSave(); tipRedraw(); });
document.addEventListener('click', e => { if (view.name !== 'math') return; const t = tipState();
  const p = e.target.closest('[data-tipp]'); if (p) { t.pct = +p.dataset.tipp; mathSave(); return tipRedraw(); }
  const n = e.target.closest('[data-tipn]'); if (n) { t.people = Math.max(1, Math.min(50, (t.people || 1) + +n.dataset.tipn)); mathSave(); return tipRedraw(); } });

/* ---------- the Math page ---------- */
views.math = () => {
  const m = mathState();
  setTimeout(() => { if (m.tab === 'graph') mgMount(); else if (!matchMedia('(hover: none)').matches) document.querySelector('[data-mcalc="page"] .minput')?.focus({ preventScroll: true }); }, 0);
  return `<div class="row-between" style="margin-bottom:12px"><h2 style="margin:0">🧮 Math</h2>
      <div class="seg" role="tablist">
        <button type="button" class="btn sm ${m.tab === 'sci' ? 'primary' : ''}" data-act="mathTab" data-t="sci" role="tab" aria-selected="${m.tab === 'sci'}">🔢 Scientific</button>
        <button type="button" class="btn sm ${m.tab === 'graph' ? 'primary' : ''}" data-act="mathTab" data-t="graph" role="tab" aria-selected="${m.tab === 'graph'}">📈 Graphing</button>
        <button type="button" class="btn sm ${m.tab === 'tip' ? 'primary' : ''}" data-act="mathTab" data-t="tip" role="tab" aria-selected="${m.tab === 'tip'}">💵 Tip</button>
      </div></div>
    <div class="panel">${m.tab === 'graph' ? mathGraphHtml() : m.tab === 'tip' ? tipHtml() : mathCalcHtml('page')}</div>
    <p class="muted small" style="margin-top:12px">${m.tab === 'tip' ? 'Tip is worked out on the bill before tax by default. Tick “after tax” to tip on the whole bill.' : m.tab === 'graph'
      ? 'Type each line in terms of x: <code>2x + 1</code>, <code>x^2 - 4</code>, <code>sin(x)</code>, <code>1/x</code>, <code>√x</code>, <code>|x|</code>, <code>e^x</code>, <code>ln x</code>. Tap a colored dot to hide a line.'
      : 'Type with your keyboard or tap the keys. <b>Enter</b> works it out, <b>Esc</b> clears. You can write <code>2(3+4)</code>, <code>sin 30</code>, <code>5!</code>, <code>√2</code>, <code>|−3|</code>, <code>nCr(5, 2)</code>, <code>nPr(5, 2)</code>, <code>logb(2, 8)</code>, <code>root(3, 27)</code>, <code>gcd(12, 18)</code>, <code>sinh</code>, <code>cosh</code>, <code>tanh</code>. Tap a line in the history to use it again.'}</p>`;
};
Object.assign(actions, {
  math: () => go({ name: 'math' }),
  mathTab: el => { mathState().tab = el.dataset.t; mathSave(); render(); },
});

/* (The floating 🧮 calculator button was removed in 1.5.1: the calculator lives on the 🧮 Math page.) */
document.getElementById('mathFabBtn')?.remove();
