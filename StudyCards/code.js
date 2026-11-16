'use strict';
/* ================= 💻 Code lab =================
   ▶️ Playground (HTML/CSS/JS in a sealed-off frame) · 🐢 Turtle drawing · 🧠 What does it print? · 📋 Cheat sheets · 🔢 CS tools
   plus 🧾 code-style card sides for coding decks. Everything runs on this device. Saved in S.settings.code. */
function cl() { const c = (S.settings.code ||= {}); c.tab ||= 'play'; return c; }
const clSave = () => { clearTimeout(clSave.t); clSave.t = setTimeout(() => { try { save(); } catch {} }, 400); };

/* ---------- 🖍️ a small syntax highlighter (for cheat sheets, challenges and code cards) ---------- */
const HL_KEYS = 'abstract async await break case catch class const continue def del elif else except export extends finally for from function global if import in is lambda let new nonlocal not of or pass print raise return self static super switch this throw try typeof var void while with yield and as True False None true false null undefined NaN SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE ORDER BY GROUP JOIN ON LIMIT AS AND OR NOT NULL git'.split(' ');
const HL_RE = new RegExp(`(\\/\\/[^\\n]*|#[^\\n]*|--\\s[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/|<!--[\\s\\S]*?-->)|("(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\`(?:\\\\.|[^\`\\\\])*\`)|(\\b\\d+(?:\\.\\d+)?\\b)|(\\b(?:${HL_KEYS.join('|')})\\b)|(<\\/?[a-zA-Z][\\w-]*|\\/?>)`, 'g');
function hlCode(code) {
  let out = '', last = 0; const s = String(code ?? '');
  for (const m of s.matchAll(HL_RE)) {
    out += esc(s.slice(last, m.index)); last = m.index + m[0].length;
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'n' : m[4] ? 'k' : 't';
    if (m[1] && m[1].startsWith('#') && /^#[0-9a-fA-F]{3,8}\b/.test(m[1])) { out += `<span class="hl-n">${esc(m[0])}</span>`; continue; }   // CSS colors aren't comments
    out += `<span class="hl-${cls}">${esc(m[0])}</span>`;
  }
  return out + esc(s.slice(last));
}

/* ---------- ▶️ playground ---------- */
const PG_EXAMPLES = {
  ball: ['🏀 Bouncing ball', '<canvas id="c" width="400" height="250"></canvas>', 'body { margin: 0; display: grid; place-items: center; height: 100vh; background: #f4f1ea; }\ncanvas { background: white; border-radius: 12px; box-shadow: 0 4px 14px #0002; }',
    'const c = document.getElementById("c"), g = c.getContext("2d");\nlet x = 50, y = 50, dx = 3, dy = 2;\n\nfunction step() {\n  g.clearRect(0, 0, c.width, c.height);\n  g.beginPath();\n  g.arc(x, y, 20, 0, Math.PI * 2);\n  g.fillStyle = "tomato";\n  g.fill();\n  x += dx; y += dy;\n  if (x < 20 || x > c.width - 20) dx = -dx;   // bounce off the sides\n  if (y < 20 || y > c.height - 20) dy = -dy;\n  requestAnimationFrame(step);\n}\nstep();\nconsole.log("Try changing dx, dy or the color!");'],
  todo: ['✅ To-do list', '<h2>My to-do list</h2>\n<input id="task" placeholder="Something to do">\n<button id="add">Add</button>\n<ul id="list"></ul>', 'body { font-family: system-ui; padding: 16px; }\nli { cursor: pointer; padding: 4px 0; }\nli.done { text-decoration: line-through; color: gray; }',
    'const input = document.getElementById("task");\nconst list = document.getElementById("list");\n\ndocument.getElementById("add").onclick = () => {\n  if (!input.value.trim()) return;\n  const li = document.createElement("li");\n  li.textContent = input.value;\n  li.onclick = () => li.classList.toggle("done");   // tap to tick it off\n  list.append(li);\n  console.log("Added:", input.value);\n  input.value = "";\n};'],
  color: ['🎨 Color picker', '<input type="color" id="pick" value="#3b54e8">\n<div id="box">Pick a color!</div>', 'body { font-family: system-ui; padding: 16px; }\n#box { margin-top: 12px; height: 140px; border-radius: 12px; display: grid; place-items: center; color: white; font-size: 22px; }',
    'const pick = document.getElementById("pick"), box = document.getElementById("box");\n\nfunction show() {\n  box.style.background = pick.value;\n  box.textContent = pick.value;\n}\npick.oninput = show;\nshow();'],
  hello: ['👋 Hello', '<h1 id="title">Hello!</h1>\n<button id="btn">Click me</button>', 'body { font-family: system-ui; padding: 16px; }\nh1 { color: #3b54e8; }',
    'let clicks = 0;\ndocument.getElementById("btn").onclick = () => {\n  clicks++;\n  document.getElementById("title").textContent = `Clicked ${clicks} time${clicks === 1 ? "" : "s"}!`;\n  console.log("clicks =", clicks);\n};'],
};
function pgState() { const c = cl(); if (!c.pg) { const e = PG_EXAMPLES.hello; c.pg = { html: e[1], css: e[2], js: e[3], pane: 'js' }; } return c.pg; }
function playHtml() {
  const p = pgState();
  return `<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px"><span class="muted small">Start from:</span>${Object.entries(PG_EXAMPLES).map(([k, [n]]) => `<button type="button" class="btn sm" data-cl="example" data-k="${k}">${n}</button>`).join('')}</div>
    <div class="pg">
      <div class="pg-edit"><div class="seg-btns">${[['html', 'HTML'], ['css', 'CSS'], ['js', 'JavaScript']].map(([k, n]) => `<button type="button" class="btn sm ${p.pane === k ? 'primary' : ''}" data-cl="pane" data-k="${k}">${n}</button>`).join('')}
          <button type="button" class="btn sm" data-cl="run" style="margin-left:auto">▶ Run</button></div>
        <textarea class="pg-code" id="pgCode" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off" aria-label="${p.pane} code">${esc(p[p.pane])}</textarea>
        <label class="row muted small" style="gap:6px"><input type="checkbox" data-clf="auto" ${cl().auto !== false ? 'checked' : ''}> Run as I type</label></div>
      <div class="pg-out"><iframe id="pgFrame" sandbox="allow-scripts allow-modals" title="Your page"></iframe>
        <div class="pg-console" id="pgConsole" aria-live="polite"><span class="muted small">Console: console.log() output and errors show here.</span></div></div></div>
    <p class="muted small" style="margin:6px 0 0">Your code runs in a sealed box: it can’t see or change your cards, settings or anything else. Tab adds spaces.</p>`;
}
function pgRun() {
  const p = pgState(), f = document.getElementById('pgFrame'); if (!f) return;
  const out = document.getElementById('pgConsole'); if (out) out.innerHTML = '';
  const bridge = `<script>(()=>{const send=(k,a)=>parent.postMessage({pg:1,k,a:a.map(v=>{try{return typeof v==='string'?v:JSON.stringify(v)??String(v)}catch{return String(v)}})},'*');
    for(const k of ['log','info','warn','error'])console[k]=(...a)=>send(k,a);
    addEventListener('error',e=>send('error',[e.message||'Error']));})();<\/script>`;
  f.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><style>${p.css}</style>${bridge}</head><body>${p.html}<script>${p.js.replace(/<\/script/gi, '<\\/script')}<\/script></body></html>`;
}
window.addEventListener('message', e => {
  const f = document.getElementById('pgFrame'); if (!f || e.source !== f.contentWindow || !e.data?.pg) return;
  const out = document.getElementById('pgConsole'); if (!out) return;
  const line = document.createElement('div'); line.className = 'pg-line ' + e.data.k; line.textContent = (e.data.k === 'error' ? '⚠️ ' : '› ') + (e.data.a || []).join(' ');
  if (out.querySelector('.muted')) out.innerHTML = ''; out.append(line); if (out.children.length > 200) out.firstChild.remove(); out.scrollTop = out.scrollHeight;
});

/* ---------- 🐢 turtle drawing ---------- */
const TURTLE_CHALLENGES = [
  ['Square', 'repeat 4 [ forward 100 right 90 ]'], ['Triangle', 'repeat 3 [ forward 120 right 120 ]'], ['Star', 'color gold\nwidth 3\nrepeat 5 [ forward 150 right 144 ]'],
  ['Hexagon flower', 'color purple\nrepeat 6 [\n  repeat 6 [ forward 50 right 60 ]\n  right 60\n]'], ['Spiral', 'color teal\nrepeat 60 [ forward repcount * 4 right 89 ]'],
  ['Staircase', 'repeat 5 [ forward 30 left 90 forward 30 right 90 ]'], ['Circle', 'repeat 36 [ forward 12 right 10 ]'],
];
function turtleHtml() {
  const c = cl(); c.turtle ??= TURTLE_CHALLENGES[0][1];
  return `<div class="tt">
    <div class="tt-edit"><div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:6px"><span class="muted small">Try:</span>${TURTLE_CHALLENGES.map(([n], i) => `<button type="button" class="btn sm" data-cl="tEx" data-i="${i}">${n}</button>`).join('')}</div>
      <textarea class="pg-code" id="ttCode" spellcheck="false" autocapitalize="off" rows="10" aria-label="Turtle commands">${esc(c.turtle)}</textarea>
      <div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px"><button type="button" class="btn primary" data-cl="tRun">▶ Draw</button><button type="button" class="btn" data-cl="tFast">⚡ Draw instantly</button>
        <span class="muted small" id="ttMsg"></span></div>
      <details class="tt-help" open><summary>Commands</summary><div class="small">
        <code>forward 100</code> / <code>fd 100</code> · <code>back 50</code> / <code>bk 50</code> · <code>right 90</code> / <code>rt 90</code> · <code>left 45</code> / <code>lt 45</code><br>
        <code>repeat 4 [ … ]</code> does the commands in [ ] 4 times, and <code>repcount</code> is which time it is (1, 2, 3…)<br>
        <code>penup</code> / <code>pendown</code> · <code>color red</code> (or <code>#ff8800</code>) · <code>width 4</code> · <code>home</code> · <code>clear</code><br>
        Numbers can be math: <code>forward repcount * 5</code></div></details></div>
    <div class="tt-stage"><canvas id="ttCanvas" width="600" height="600" aria-label="The turtle’s drawing"></canvas></div></div>`;
}
function ttParse(src) {   // → a list of [command, argument] with repeats unrolled (max 20,000 steps)
  const toks = String(src).replace(/;.*$/gm, '').replace(/\[/g, ' [ ').replace(/\]/g, ' ] ').split(/\s+/).filter(Boolean); let i = 0, steps = 0;
  const num = (tok, rc) => { const v = typeof mathCalc === 'function' ? mathCalc(String(tok).replace(/repcount/gi, String(rc))) : parseFloat(tok); if (!Number.isFinite(v)) throw new Error(`“${tok}” isn’t a number`); return v; };
  const expr = () => {   // a number, or math with spaces like "repcount * 4"
    let s = toks[i++]; if (s == null) return null;
    while (i < toks.length && (/^[*\/+\-^%]/.test(toks[i]) || /[*\/+\-^%(]$/.test(s)) && toks[i] !== '[' && toks[i] !== ']') s += toks[i++];
    return s;
  };
  const block = (rc) => {
    const out = [];
    while (i < toks.length) {
      const t = toks[i++].toLowerCase();
      if (t === ']') return out;
      if (++steps > 20000) throw new Error('That’s too many steps (more than 20,000)');
      if (['forward', 'fd', 'back', 'bk', 'right', 'rt', 'left', 'lt', 'width'].includes(t)) { const arg = expr(); if (arg == null) throw new Error(`${t} needs a number`); out.push([t, num(arg, rc)]); }
      else if (t === 'repeat') { const n = Math.min(500, Math.round(num(expr() ?? '', rc))); if (toks[i++] !== '[') throw new Error('repeat needs [ after the number'); const start = i;
        for (let k = 1; k <= n; k++) { i = start; out.push(...block(k)); } if (n <= 0) { let depth = 1; while (i < toks.length && depth) { if (toks[i] === '[') depth++; if (toks[i] === ']') depth--; i++; } } }
      else if (t === 'color' || t === 'colour') out.push(['color', toks[i++]]);
      else if (['penup', 'pu', 'pendown', 'pd', 'home', 'clear'].includes(t)) out.push([t]);
      else throw new Error(`I don’t know “${toks[i - 1]}”`);
    }
    return out;
  };
  return block(1);
}
let ttAnim = 0;
function ttRun(instant) {
  const cv = document.getElementById('ttCanvas'), msg = document.getElementById('ttMsg'); if (!cv) return;
  const src = document.getElementById('ttCode').value; cl().turtle = src; clSave(); cancelAnimationFrame(ttAnim);
  let prog; try { prog = ttParse(src); } catch (e) { if (msg) { msg.textContent = '⚠️ ' + e.message; msg.className = 'small tt-err'; } return; }
  if (msg) { msg.textContent = `${prog.length} step${prog.length === 1 ? '' : 's'}`; msg.className = 'muted small'; }
  const g = cv.getContext('2d'), T = { x: 300, y: 300, a: -90, pen: true, color: '#1c1b19', width: 2 };
  const reset = () => { g.fillStyle = '#fff'; g.fillRect(0, 0, 600, 600); }; reset();
  const lines = [];   // what's drawn so far (redrawn each frame with the turtle on top)
  const apply = ([c, v]) => {
    if (c === 'forward' || c === 'fd' || c === 'back' || c === 'bk') { const d = (c[0] === 'b' ? -v : v), r = T.a * Math.PI / 180, nx = T.x + d * Math.cos(r), ny = T.y + d * Math.sin(r);
      if (T.pen) lines.push([T.x, T.y, nx, ny, T.color, T.width]); T.x = nx; T.y = ny; }
    else if (c === 'right' || c === 'rt') T.a += v; else if (c === 'left' || c === 'lt') T.a -= v;
    else if (c === 'penup' || c === 'pu') T.pen = false; else if (c === 'pendown' || c === 'pd') T.pen = true;
    else if (c === 'color') T.color = /^#?[0-9a-f]{3,6}$/i.test(v) ? (v[0] === '#' ? v : '#' + v) : v; else if (c === 'width') T.width = Math.max(1, Math.min(30, v));
    else if (c === 'home') { T.x = 300; T.y = 300; T.a = -90; } else if (c === 'clear') lines.length = 0;
  };
  const paint = () => { reset(); g.lineCap = 'round'; for (const [x0, y0, x1, y1, c, w] of lines) { g.strokeStyle = c; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
    g.save(); g.translate(T.x, T.y); g.rotate(T.a * Math.PI / 180); g.fillStyle = '#23905a'; g.beginPath(); g.moveTo(12, 0); g.lineTo(-8, -7); g.lineTo(-8, 7); g.closePath(); g.fill(); g.restore(); };
  if (instant) { prog.forEach(apply); paint(); return; }
  let k = 0; const per = Math.max(1, Math.ceil(prog.length / 240));
  const step = () => { for (let j = 0; j < per && k < prog.length; j++) apply(prog[k++]); paint(); if (k < prog.length && view.name === 'code') ttAnim = requestAnimationFrame(step); else if (k >= prog.length && typeof rightSound === 'function' && prog.length > 6) { cl().turtleDone = (cl().turtleDone || 0) + 1; clSave(); } };
  step();
}

/* ---------- 🧠 What does it print? ---------- */
let cq = null;
function chalNew() {
  const c = cl(), lang = c.cLang || 'js', lvl = c.cLvl || 1, pool = CODE_CHALLENGES.filter(x => x[0] === lang && x[1] === lvl), seen = (c.cSeen ||= []);
  let left = pool.filter(x => !seen.includes(x[2])); if (!left.length) { c.cSeen = seen.filter(s => !pool.some(x => x[2] === s)); left = pool; }
  const x = left[Math.floor(Math.random() * left.length)]; (c.cSeen ||= []).push(x[2]);
  cq = { x, opts: shuffle([x[3], ...x[4]]), given: null };
}
function chalHtml() {
  const c = cl(); if (!cq || cq.x[0] !== (c.cLang || 'js') || cq.x[1] !== (c.cLvl || 1)) chalNew();
  const [lang, , code, ans, , why] = cq.x, st = c.cStats ||= { right: 0, total: 0, streak: 0, best: 0 };
  return `<div class="row-between" style="gap:8px;flex-wrap:wrap"><div class="seg-btns">${[['js', 'JavaScript'], ['py', 'Python']].map(([k, n]) => `<button type="button" class="btn sm ${(c.cLang || 'js') === k ? 'primary' : ''}" data-cl="cLang" data-k="${k}">${n}</button>`).join('')}</div>
      <div class="seg-btns">${[[1, '⭐ Easy'], [2, '⭐⭐ Medium'], [3, '⭐⭐⭐ Hard']].map(([k, n]) => `<button type="button" class="btn sm ${(c.cLvl || 1) === k ? 'primary' : ''}" data-cl="cLvl" data-k="${k}">${n}</button>`).join('')}</div>
      <span class="muted small">✓ ${st.right} of ${st.total} · 🔥 ${st.streak} · best ${st.best}</span></div>
    <p class="muted" style="margin:12px 0 6px">What does this ${lang === 'js' ? 'JavaScript' : 'Python'} code print?</p>
    <pre class="code-box"><code>${hlCode(code)}</code></pre>
    <div class="mu-opts">${cq.opts.map(o => `<button type="button" class="btn code-opt ${cq.given ? (o === ans ? 'right' : o === cq.given ? 'wrong' : '') : ''}" data-cl="cPick" data-v="${esc(o)}" ${cq.given ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
    ${cq.given ? `<div class="mu-verdict ${cq.given === ans ? 'ok' : 'no'}">${cq.given === ans ? '✓ Right!' : `It prints <code>${esc(ans)}</code>.`}</div><p class="small" style="text-align:center;margin:4px 0">💡 ${esc(why)}</p>
      <div style="text-align:center;margin-top:8px"><button type="button" class="btn primary big" data-cl="cNext">Next ▶</button></div>` : ''}`;
}

/* ---------- 📋 cheat sheets ---------- */
const SHEETS = {
  js: ['JavaScript', [['let x = 5;', 'Make a variable you can change'], ['const name = "Ana";', 'Make a variable that can’t be reassigned'], ['console.log(x);', 'Print to the console'],
    ['if (x > 3) { … } else { … }', 'Do something only if a condition is true'], ['for (let i = 0; i < 5; i++) { … }', 'Repeat with a counter'], ['for (const item of list) { … }', 'Go through every item in an array'],
    ['function add(a, b) { return a + b; }', 'Make a function'], ['const add = (a, b) => a + b;', 'An arrow function'], ['const list = [1, 2, 3];', 'Make an array'], ['list.push(4)', 'Add to the end of an array'],
    ['list.map(n => n * 2)', 'Make a new array by changing every item'], ['list.filter(n => n > 1)', 'Keep only the items that pass a test'], ['const user = { name: "Ana", age: 12 };', 'Make an object'],
    ['`Hi ${name}!`', 'A template string (put values inside text)'], ['===', 'Equal (same value and type)'], ['&& / || / !', 'And / or / not'],
    ['document.querySelector("#id")', 'Find an element on the page'], ['el.addEventListener("click", fn)', 'Run fn when the element is clicked'], ['JSON.stringify(obj)', 'Turn an object into JSON text']]],
  py: ['Python', [['x = 5', 'Make a variable'], ['print(x)', 'Print something'], ['if x > 3:\n    ...\nelif x == 3:\n    ...\nelse:\n    ...', 'Choose what to do'],
    ['for i in range(5):', 'Repeat 5 times (i is 0 to 4)'], ['for item in my_list:', 'Go through every item in a list'], ['while x < 10:', 'Repeat while something is true'],
    ['def add(a, b):\n    return a + b', 'Make a function'], ['my_list = [1, 2, 3]', 'Make a list'], ['my_list.append(4)', 'Add to the end of a list'], ['len(my_list)', 'How many items'],
    ['d = {"name": "Ana"}', 'Make a dictionary'], ['d["name"]', 'Get a value from a dictionary'], ['f"Hi {name}!"', 'An f-string (put values inside text)'], ['input("Your name? ")', 'Ask the user to type something'],
    ['int("5") / str(5)', 'Turn text into a number / a number into text'], ['[n * 2 for n in nums]', 'A list comprehension (a new list from another)'], ['import random', 'Use a module'], ['# a comment', 'A note for people; Python ignores it']]],
  html: ['HTML', [['<h1>Title</h1>', 'The biggest heading (h1 to h6)'], ['<p>Text</p>', 'A paragraph'], ['<a href="https://…">Link</a>', 'A link'], ['<img src="cat.png" alt="A cat">', 'A picture (alt describes it)'],
    ['<ul><li>One</li></ul>', 'A bulleted list (ol for numbered)'], ['<button>Click</button>', 'A button'], ['<input type="text">', 'A text box'], ['<div> … </div>', 'A box to group things'],
    ['<span> … </span>', 'Group words inside a line'], ['<br>', 'A line break'], ['class="card"', 'Name a group of elements for CSS'], ['id="main"', 'A unique name for one element'], ['<!-- note -->', 'A comment']]],
  css: ['CSS', [['color: red;', 'Text color'], ['background: #eee;', 'Background color'], ['font-size: 18px;', 'Text size'], ['margin: 10px;', 'Space outside the border'], ['padding: 10px;', 'Space inside the border'],
    ['border: 1px solid black;', 'A border'], ['border-radius: 8px;', 'Rounded corners'], ['display: flex;', 'Line up children in a row (or column)'], ['display: grid;', 'Lay children out in a grid'],
    ['.card { … }', 'Style everything with class="card"'], ['#main { … }', 'Style the element with id="main"'], ['a:hover { … }', 'Style when the mouse is over it'], ['@media (max-width: 600px) { … }', 'Styles only for small screens']]],
  sql: ['SQL', [['SELECT * FROM students;', 'Get every row and column'], ['SELECT name, age FROM students;', 'Get some columns'], ['WHERE age > 12', 'Only rows that match'], ['ORDER BY name', 'Sort the results'],
    ['LIMIT 10', 'Only the first 10 rows'], ['INSERT INTO students (name) VALUES (\'Ana\');', 'Add a row'], ['UPDATE students SET age = 13 WHERE id = 1;', 'Change rows'], ['DELETE FROM students WHERE id = 1;', 'Remove rows'],
    ['COUNT(*)', 'How many rows'], ['GROUP BY class', 'Combine rows into groups'], ['JOIN classes ON …', 'Combine two tables']]],
  git: ['Git', [['git init', 'Start tracking a folder'], ['git status', 'See what has changed'], ['git add .', 'Get all changes ready to save'], ['git commit -m "message"', 'Save a snapshot with a note'],
    ['git log', 'See past commits'], ['git branch new-idea', 'Make a branch'], ['git switch new-idea', 'Move to a branch'], ['git merge new-idea', 'Bring a branch’s changes in'],
    ['git clone <url>', 'Copy a project from the internet'], ['git pull', 'Get the latest changes'], ['git push', 'Send your commits up'], ['git diff', 'See the exact changes']]],
};
function sheetsHtml() {
  const c = cl(), k = SHEETS[c.sheet] ? c.sheet : 'js', [name, rows] = SHEETS[k], q = norm(c.sheetQ || '');
  const list = rows.filter(([a, b]) => !q || norm(a + ' ' + b).includes(q));
  return `<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">${Object.entries(SHEETS).map(([key, [n]]) => `<button type="button" class="btn sm ${key === k ? 'primary' : ''}" data-cl="sheet" data-k="${key}">${n}</button>`).join('')}</div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><input type="search" class="inp" id="sheetQ" placeholder="Search the ${name} sheet…" value="${esc(c.sheetQ || '')}" style="margin:0;max-width:320px">
      <button type="button" class="btn" data-cl="sheetCards">📇 Make flashcards</button><button type="button" class="btn ghost" data-act="keys">⌨️ Keyboard shortcuts</button></div>
    <div class="sheet">${list.map(([a, b]) => `<div class="sheet-row"><pre class="code-box sm"><code>${hlCode(a)}</code></pre><span>${esc(b)}</span></div>`).join('') || '<p class="muted">Nothing matches.</p>'}</div>`;
}

/* ---------- 🔢 computer science tools ---------- */
const GATES = { AND: (a, b) => a & b, OR: (a, b) => a | b, NOT: a => a ^ 1, NAND: (a, b) => (a & b) ^ 1, NOR: (a, b) => (a | b) ^ 1, XOR: (a, b) => a ^ b, XNOR: (a, b) => (a ^ b) ^ 1 };
const GATE_HELP = { AND: 'On only when both inputs are on.', OR: 'On when at least one input is on.', NOT: 'Flips the input: on becomes off.', NAND: 'NOT AND: off only when both are on.', NOR: 'NOT OR: on only when both are off.', XOR: 'On when the inputs are different.', XNOR: 'On when the inputs are the same.' };
function numDetailHtml(n) {   // dividing by 2 step by step, and the 8 bits of a byte
  const steps = []; let v = Math.floor(Math.abs(n)); if (v === 0) steps.push('0 ÷ 2 = 0 remainder <b>0</b>'); while (v > 0 && steps.length < 60) { steps.push(`${v} ÷ 2 = ${Math.floor(v / 2)} remainder <b>${v % 2}</b>`); v = Math.floor(v / 2); }
  const byte = Number.isSafeInteger(n) && n >= 0 && n < 256;
  return `<details style="margin-top:8px" ${cl().numOpen ? 'open' : ''}><summary class="small" data-cl="numOpen">How ${n} becomes binary</summary><div class="small mono" style="margin-top:6px">${steps.join('<br>')}<br>Read the remainders from bottom to top: <b>${n.toString(2)}</b></div></details>
    ${byte ? `<div class="bits">${n.toString(2).padStart(8, '0').split('').map((d, i) => `<span class="${d === '1' ? 'on' : ''}"><b>${d}</b><small>${2 ** (7 - i)}</small></span>`).join('')}</div>
      <p class="muted small" style="margin:4px 0 0">Each bit is worth double the one to its right. Add up the lit ones to get the number.</p>` : '<p class="muted small">Numbers 0 to 255 also show their 8 bits (one byte).</p>'}`;
}
function csHtml() {
  const c = cl(), n = c.num ?? 42, gate = c.gate || 'AND', A = c.gA ?? 1, B = c.gB ?? 0, one = gate === 'NOT', out = GATES[gate](A, B);
  const rx = c.rx ?? '\\b\\w+@\\w+\\.\\w+\\b', rf = c.rf ?? 'g', rt = c.rt ?? 'Email ana@school.org or ben@mail.com for help.';
  let rxOut = '', rxInfo = ''; try { const re = new RegExp(rx, rf.includes('g') ? rf : rf + 'g'); let last = 0, count = 0; for (const m of rt.slice(0, 5000).matchAll(re)) { if (!m[0].length) { if (++count > 5000) break; continue; } rxOut += esc(rt.slice(last, m.index)) + `<mark>${esc(m[0])}</mark>`; last = m.index + m[0].length; count++; } rxOut += esc(rt.slice(last)); rxInfo = `${count} match${count === 1 ? '' : 'es'}`; } catch (e) { rxOut = esc(rt); rxInfo = '⚠️ ' + esc(e.message); }
  const hex = c.hex || '#3b54e8', [r, g, b] = typeof hex2rgb === 'function' ? hex2rgb(hex) : [0, 0, 0], hsl = typeof hex2hsl === 'function' ? hex2hsl(hex) : [0, 0, 0];
  return `<div class="art-two">
    <div class="panel"><h3 style="margin-top:0">🔢 Number converter</h3>
      <div class="cs-nums">${[['dec', 'Decimal (base 10)', 10], ['bin', 'Binary (base 2)', 2], ['hex', 'Hexadecimal (base 16)', 16], ['oct', 'Octal (base 8)', 8]].map(([k, l, base]) => `<label class="field" style="margin:0">${l}<input class="inp mono" data-clnum="${base}" value="${Number.isSafeInteger(n) ? n.toString(base).toUpperCase() : ''}" spellcheck="false" autocomplete="off"></label>`).join('')}</div>
      <div id="numDetail">${numDetailHtml(n)}</div></div>
    <div class="panel"><h3 style="margin-top:0">💡 Logic gates</h3>
      <div class="seg-btns" style="flex-wrap:wrap">${Object.keys(GATES).map(k => `<button type="button" class="btn sm ${gate === k ? 'primary' : ''}" data-cl="gate" data-k="${k}">${k}</button>`).join('')}</div>
      <p class="small" style="margin:8px 0">${GATE_HELP[gate]}</p>
      <div class="gate-demo"><div class="gate-ins"><button type="button" class="gate-in ${A ? 'on' : ''}" data-cl="gA">A = ${A}</button>${one ? '' : `<button type="button" class="gate-in ${B ? 'on' : ''}" data-cl="gB">B = ${B}</button>`}</div>
        <div class="gate-box">${gate}</div><div class="gate-lamp ${out ? 'on' : ''}">💡 ${out}</div></div>
      <table class="sci-table" style="min-width:0;margin-top:8px"><thead><tr><th>A</th>${one ? '' : '<th>B</th>'}<th>${gate}</th></tr></thead><tbody>${(one ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]]).map(([a, b]) => `<tr class="${a === A && (one || b === B) ? 'hl' : ''}"><td>${a}</td>${one ? '' : `<td>${b}</td>`}<td><b>${GATES[gate](a, b ?? 0)}</b></td></tr>`).join('')}</tbody></table></div></div>
    <div class="art-two" style="margin-top:12px"><div class="panel"><h3 style="margin-top:0">🔎 Regex tester</h3>
      <div class="row" style="gap:6px"><input class="inp mono" data-clrx="rx" value="${esc(rx)}" spellcheck="false" style="margin:0;flex:1" aria-label="Pattern"><input class="inp mono" data-clrx="rf" value="${esc(rf)}" style="margin:0;width:64px" aria-label="Flags" title="Flags: g = all, i = ignore case, m = multiline"></div>
      <textarea class="inp" data-clrx="rt" rows="3" style="margin-top:6px" aria-label="Text to search">${esc(rt)}</textarea>
      <div class="rx-out">${rxOut}</div><div class="muted small">${rxInfo} · <code>\\d</code> digit · <code>\\w</code> letter/number · <code>+</code> one or more · <code>*</code> zero or more · <code>[abc]</code> any of · <code>^ $</code> start / end</div></div>
    <div class="panel"><h3 style="margin-top:0">🎨 Color codes</h3>
      <div class="row" style="gap:10px;align-items:center"><input type="color" value="${hex}" data-clcol="pick" style="width:56px;height:44px;border:0;background:none;cursor:pointer"><div class="cc-swatch" style="background:${hex}"></div></div>
      <div class="cs-nums" style="margin-top:8px">${[['Hex', hex], ['RGB', `rgb(${r}, ${g}, ${b})`], ['HSL', `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`]].map(([l, v]) => `<label class="field" style="margin:0">${l}<input class="inp mono" value="${v}" data-clcol="${l}" spellcheck="false"></label>`).join('')}</div>
      <p class="muted small" style="margin:6px 0 0">Hex is red, green and blue in base 16: #3b54e8 means red 3b (59), green 54 (84), blue e8 (232).</p></div></div>`;
}

/* ---------- the Code lab page ---------- */
const CODE_TABS = [['play', '▶️ Playground'], ['turtle', '🐢 Turtle'], ['chal', '🧠 What does it print?'], ['sheets', '📋 Cheat sheets'], ['cs', '🔢 CS tools']];
const CODE_VIEWS = { play: playHtml, turtle: turtleHtml, chal: chalHtml, sheets: sheetsHtml, cs: csHtml };
views.code = () => {
  const c = cl(); setTimeout(codeMount, 0);
  return `<div class="row-between" style="margin-bottom:12px"><h2 style="margin:0">💻 Code lab</h2>
      <div class="row" style="gap:6px;flex-wrap:wrap">${CODE_TABS.map(([k, l]) => `<button type="button" class="btn sm ${c.tab === k ? 'primary' : ''}" data-cl="tab" data-k="${k}">${l}</button>`).join('')}</div></div>
    <div class="panel code-panel">${(CODE_VIEWS[c.tab] || playHtml)()}</div>`;
};
function codeMount() { const t = cl().tab; if (t === 'play') pgRun(); else if (t === 'turtle') ttRun(true); }
function codeRedraw() { const p = document.querySelector('.code-panel'); if (!p || view.name !== 'code') return; p.innerHTML = (CODE_VIEWS[cl().tab] || playHtml)(); codeMount(); }
Object.assign(actions, { code: el => { if (el?.dataset?.t) cl().tab = el.dataset.t; go({ name: 'code' }); } });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cl]'); if (!b || view.name !== 'code') return;
  const c = cl(), k = b.dataset.k;
  switch (b.dataset.cl) {
    case 'tab': c.tab = k; clSave(); return render();
    case 'example': { const ex = PG_EXAMPLES[k]; const p = pgState(); const before = { ...p }; Object.assign(p, { html: ex[1], css: ex[2], js: ex[3], pane: 'js' }); clSave(); codeRedraw();
      if (typeof undoToast === 'function') undoToast(`Loaded “${ex[0]}”`, () => { Object.assign(pgState(), before); clSave(); codeRedraw(); }); return; }
    case 'pane': { const p = pgState(); p.pane = k; const ta = document.getElementById('pgCode'); ta.value = p[k]; ta.setAttribute('aria-label', k + ' code'); document.querySelectorAll('[data-cl="pane"]').forEach(x => x.classList.toggle('primary', x.dataset.k === k)); clSave(); return; }
    case 'run': return pgRun();
    case 'tEx': { document.getElementById('ttCode').value = TURTLE_CHALLENGES[+b.dataset.i][1]; return ttRun(false); }
    case 'tRun': return ttRun(false);
    case 'tFast': return ttRun(true);
    case 'cLang': c.cLang = k; cq = null; break;
    case 'cLvl': c.cLvl = +k; cq = null; break;
    case 'cNext': chalNew(); break;
    case 'cPick': { if (!cq || cq.given) return; cq.given = b.dataset.v; const st = c.cStats; st.total++;
      if (cq.given === cq.x[3]) { st.right++; st.streak++; st.best = Math.max(st.best, st.streak); if (typeof rightSound === 'function') rightSound(); if (typeof addPoints === 'function') addPoints(cq.x[1]); } else { st.streak = 0; if (typeof sdSound === 'function') sdSound('wrong'); } break; }
    case 'sheet': c.sheet = k; c.sheetQ = ''; break;
    case 'sheetCards': { const key = SHEETS[c.sheet] ? c.sheet : 'js', [name, rows] = SHEETS[key], dn = `${name} cheat sheet`;
      let d = S.decks.find(x => x.name === dn); if (!d) { d = { id: uid(), created: Date.now(), name: dn, frontLang: 'en-US', backLang: 'en-US', newPerDay: 20, direction: 'front', subject: 'coding' }; S.decks.push(d); }
      const have = new Set(cardsOf(d.id).map(x => x.front)); let added = 0;
      for (const [a, m] of rows) if (!have.has(a)) { S.cards.push({ id: uid(), deckId: d.id, front: a, back: m, notes: '', example: '', exampleTr: '', state: 'new', due: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0, step: 0, created: Date.now() }); added++; }
      save(); toast(added ? `📇 ${added} cards added to “${dn}”` : 'Those cards are already in the deck'); return go({ name: 'deck', deckId: d.id }); }
    case 'gate': c.gate = k; break;
    case 'numOpen': setTimeout(() => { c.numOpen = !!document.querySelector('#numDetail details')?.open; clSave(); }, 0); return;
    case 'gA': c.gA = (c.gA ?? 1) ^ 1; break;
    case 'gB': c.gB = (c.gB ?? 0) ^ 1; break;
    default: return;
  }
  clSave(); codeRedraw();
});
document.addEventListener('input', e => {
  if (view.name !== 'code') return; const c = cl(), t = e.target;
  if (t.id === 'pgCode') { const p = pgState(); p[p.pane] = t.value; clSave(); if (c.auto !== false) { clearTimeout(pgRun.t); pgRun.t = setTimeout(pgRun, 700); } return; }
  if (t.id === 'ttCode') { c.turtle = t.value; clSave(); return; }
  if (t.id === 'sheetQ') { c.sheetQ = t.value; clearTimeout(sheetsHtml.t); sheetsHtml.t = setTimeout(() => { const pos = t.selectionStart; codeRedraw(); const el = document.getElementById('sheetQ'); el?.focus(); try { el.setSelectionRange(pos, pos); } catch {} }, 200); return; }
  if (t.dataset.clnum) { const v = t.value.trim().replace(/^0[xbo]/i, ''); const n = v === '' ? 0 : parseInt(v, +t.dataset.clnum);
    if (!Number.isNaN(n) && n >= 0 && Number.isSafeInteger(n) && n.toString(+t.dataset.clnum).toUpperCase() === (v.toUpperCase().replace(/^0+(?=.)/, '') || '0')) {
      c.num = n; clSave(); t.classList.remove('bad');
      document.querySelectorAll('[data-clnum]').forEach(x => { if (x !== t) x.value = n.toString(+x.dataset.clnum).toUpperCase(); });
      const box = document.getElementById('numDetail'); if (box) box.innerHTML = numDetailHtml(n); }
    else t.classList.add('bad'); return; }
  if (t.dataset.clrx) { c[t.dataset.clrx] = t.value; clSave(); clearTimeout(csHtml.t); csHtml.t = setTimeout(() => { const pos = t.selectionStart, key = t.dataset.clrx; codeRedraw(); const el = document.querySelector(`[data-clrx="${key}"]`); el?.focus(); try { el.setSelectionRange(pos, pos); } catch {} }, 250); return; }
  if (t.dataset.clcol === 'pick') { c.hex = t.value; clSave(); clearTimeout(csHtml.t2); csHtml.t2 = setTimeout(codeRedraw, 120); return; }
});
document.addEventListener('change', e => {
  if (view.name !== 'code') return; const c = cl(), t = e.target;
  if (t.dataset.clf === 'auto') { c.auto = t.checked; clSave(); }
  if (t.dataset.clcol && t.dataset.clcol !== 'pick') {   // typed a hex, rgb() or hsl() value
    const v = t.value.trim(); let hex = null;
    if (/^#?[0-9a-f]{6}$/i.test(v)) hex = v[0] === '#' ? v : '#' + v; else if (/^#?[0-9a-f]{3}$/i.test(v)) hex = '#' + v.replace('#', '').split('').map(x => x + x).join('');
    else { const m = v.match(/(\d+(?:\.\d+)?)/g); if (m && m.length >= 3) hex = /hsl/i.test(v) && typeof hsl2hex === 'function' ? hsl2hex(+m[0], +m[1], +m[2]) : typeof rgb2hex === 'function' ? rgb2hex(+m[0], +m[1], +m[2]) : null; }
    if (hex) { c.hex = hex.toLowerCase(); clSave(); codeRedraw(); } else toast('That color code doesn’t look right');
  }
});
document.addEventListener('keydown', e => {   // Tab types two spaces in the code boxes
  if (e.key !== 'Tab' || !e.target.matches?.('.pg-code')) return; e.preventDefault();
  const t = e.target, s = t.selectionStart, en = t.selectionEnd; t.setRangeText('  ', s, en, 'end'); t.dispatchEvent(new Event('input', { bubbles: true }));
});

/* ---------- 🧾 code-style card sides for coding decks ---------- */
const looksLikeCode = s => /[{}();=<>[\]]|^\s{2,}|\n\s+\S|\b(def|function|const|let|var|return|print|import|class|SELECT|FROM|git)\b|^\.|^#\w|=>/m.test(s);
{
  const side = window.sideHtml;
  if (typeof side === 'function') window.sideHtml = function (card, which, deck) {
    const d = deck || deckById(card?.deckId), text = card?.[which];
    if (d && typeof deckSubject === 'function' && deckSubject(d) === 'coding' && d.codeCards !== false && text && !card[which + 'Html'] && looksLikeCode(text)) return `<pre class="code-card"><code>${hlCode(text)}</code></pre>`;
    return side.apply(this, arguments);
  };
}
