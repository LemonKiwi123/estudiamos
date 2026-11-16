'use strict';
/* ================= ⌨️ Keyboard shortcut guides =================
   Excel (with handy formulas for each subject), VS Code, Windows, Mac, web browsers and text editing.
   Each row: [what it does, Windows keys, Mac keys]. "+" joins keys pressed together; "," means one after the other. */
const KEY_SHEETS = {
  excel: ['📊 Excel', 'Microsoft Excel', [
    ['Basics', [['Copy / cut / paste', 'Ctrl+C / Ctrl+X / Ctrl+V', '⌘+C / ⌘+X / ⌘+V'], ['Undo / redo', 'Ctrl+Z / Ctrl+Y', '⌘+Z / ⌘+Y'], ['Save', 'Ctrl+S', '⌘+S'], ['Find / replace', 'Ctrl+F / Ctrl+H', '⌘+F / ⌃+H'], ['Bold / italic / underline', 'Ctrl+B / Ctrl+I / Ctrl+U', '⌘+B / ⌘+I / ⌘+U']]],
    ['Moving and selecting', [['Edit the cell you’re on', 'F2', '⌃+U'], ['Jump to the edge of your data', 'Ctrl+Arrow', '⌘+Arrow'], ['Select to the edge of your data', 'Ctrl+Shift+Arrow', '⌘+⇧+Arrow'], ['Select the whole column', 'Ctrl+Space', '⌃+Space'], ['Select the whole row', 'Shift+Space', '⇧+Space'], ['Go to cell A1', 'Ctrl+Home', '⌃+Home (fn+⌃+←)'], ['Next / previous sheet', 'Ctrl+PageDown / Ctrl+PageUp', '⌥+→ / ⌥+←']]],
    ['Typing in cells', [['New line inside a cell', 'Alt+Enter', '⌥+Return'], ['Fill down / fill right', 'Ctrl+D / Ctrl+R', '⌘+D / ⌘+R'], ['Today’s date', 'Ctrl+;', '⌃+;'], ['The time now', 'Ctrl+Shift+;', '⌘+;'], ['Flash Fill (finish a pattern)', 'Ctrl+E', '⌃+E'], ['Check spelling', 'F7', 'F7']]],
    ['Formulas', [['AutoSum', 'Alt+=', '⌘+⇧+T'], ['Switch A1 → $A$1 → A$1 → $A1', 'F4', '⌘+T'], ['Insert a function', 'Shift+F3', '⇧+F3'], ['Show formulas instead of answers', 'Ctrl+`', '⌃+`']]],
    ['Formatting and tables', [['Format cells', 'Ctrl+1', '⌘+1'], ['Percent format', 'Ctrl+Shift+%', '⌃+⇧+%'], ['Make a table', 'Ctrl+T', '⌃+T'], ['Turn filters on / off', 'Ctrl+Shift+L', '⌘+⇧+F'], ['Hide row / hide column', 'Ctrl+9 / Ctrl+0', '⌃+9 / ⌃+0'], ['New sheet', 'Shift+F11', '⇧+F11'], ['Add a note to a cell', 'Shift+F2', '⇧+F2']]],
  ]],
  vscode: ['🧩 VS Code', 'Visual Studio Code', [
    ['Finding your way', [['Command palette (every command)', 'Ctrl+Shift+P', '⌘+⇧+P'], ['Open a file by name', 'Ctrl+P', '⌘+P'], ['Search in all files', 'Ctrl+Shift+F', '⌘+⇧+F'], ['Go to a line', 'Ctrl+G', '⌃+G'], ['Show / hide the sidebar', 'Ctrl+B', '⌘+B'], ['Show / hide the terminal', 'Ctrl+`', '⌃+`'], ['Split the editor', 'Ctrl+\\', '⌘+\\']]],
    ['Editing lines', [['Comment / uncomment', 'Ctrl+/', '⌘+/'], ['Move a line up / down', 'Alt+↑ / Alt+↓', '⌥+↑ / ⌥+↓'], ['Copy a line down', 'Shift+Alt+↓', '⇧+⌥+↓'], ['Delete a line', 'Ctrl+Shift+K', '⌘+⇧+K'], ['Indent / outdent', 'Tab / Shift+Tab', 'Tab / ⇧+Tab'], ['Fold / unfold a block', 'Ctrl+Shift+[ / ]', '⌥+⌘+[ / ]']]],
    ['Smart editing', [['Select the next match too', 'Ctrl+D', '⌘+D'], ['Add a cursor above / below', 'Ctrl+Alt+↑ / ↓', '⌥+⌘+↑ / ↓'], ['Find / replace', 'Ctrl+F / Ctrl+H', '⌘+F / ⌥+⌘+F'], ['Format the whole file', 'Shift+Alt+F', '⇧+⌥+F'], ['Go to definition', 'F12', 'F12'], ['Rename everywhere', 'F2', 'F2'], ['Suggestions', 'Ctrl+Space', '⌃+Space']]],
  ]],
  text: ['📝 Text editing', 'Most apps (Word, Google Docs, email, code editors)', [
    ['Selecting and moving', [['Select all', 'Ctrl+A', '⌘+A'], ['Jump a word left / right', 'Ctrl+← / Ctrl+→', '⌥+← / ⌥+→'], ['Start / end of the line', 'Home / End', '⌘+← / ⌘+→'], ['Start / end of the document', 'Ctrl+Home / Ctrl+End', '⌘+↑ / ⌘+↓'], ['Select while moving', 'Shift+Arrow', '⇧+Arrow'], ['Select a word at a time', 'Ctrl+Shift+← / →', '⌥+⇧+← / →']]],
    ['Changing text', [['Delete the word before', 'Ctrl+Backspace', '⌥+Delete'], ['Undo / redo', 'Ctrl+Z / Ctrl+Y', '⌘+Z / ⌘+⇧+Z'], ['Paste without formatting', 'Ctrl+Shift+V', '⌘+⇧+⌥+V'], ['Add a link', 'Ctrl+K', '⌘+K'], ['Print', 'Ctrl+P', '⌘+P']]],
  ]],
  browser: ['🌐 Browser', 'Chrome, Edge and most browsers', [
    ['Tabs', [['New tab', 'Ctrl+T', '⌘+T'], ['Reopen a closed tab', 'Ctrl+Shift+T', '⌘+⇧+T'], ['Close the tab', 'Ctrl+W', '⌘+W'], ['Next / previous tab', 'Ctrl+Tab / Ctrl+Shift+Tab', '⌃+Tab / ⌃+⇧+Tab'], ['Go to tab 1–8', 'Ctrl+1 … Ctrl+8', '⌘+1 … ⌘+8']]],
    ['Pages', [['Go to the address bar', 'Ctrl+L', '⌘+L'], ['Find on the page', 'Ctrl+F', '⌘+F'], ['Reload / reload fresh', 'Ctrl+R / Ctrl+Shift+R', '⌘+R / ⌘+⇧+R'], ['Zoom in / out / reset', 'Ctrl++ / Ctrl+− / Ctrl+0', '⌘++ / ⌘+− / ⌘+0'], ['Developer tools', 'F12 or Ctrl+Shift+I', '⌥+⌘+I'], ['View the page’s code', 'Ctrl+U', '⌥+⌘+U']]],
  ]],
  windows: ['🪟 Windows', 'Windows 10 and 11', [
    ['Everyday', [['Switch between apps', 'Alt+Tab', '—'], ['Open File Explorer', 'Win+E', '—'], ['Show the desktop', 'Win+D', '—'], ['Screenshot of part of the screen', 'Win+Shift+S', '—'], ['Clipboard history', 'Win+V', '—'], ['Emoji picker', 'Win+.', '—'], ['Lock the computer', 'Win+L', '—']]],
    ['Windows on screen', [['Snap a window left / right', 'Win+← / Win+→', '—'], ['Maximize / minimize', 'Win+↑ / Win+↓', '—'], ['All open windows', 'Win+Tab', '—'], ['Task Manager', 'Ctrl+Shift+Esc', '—']]],
  ]],
  mac: ['🍎 Mac', 'macOS', [
    ['Everyday', [['Spotlight search', '—', '⌘+Space'], ['Switch between apps', '—', '⌘+Tab'], ['Screenshot of part of the screen', '—', '⌘+⇧+4'], ['Screenshot and recording tools', '—', '⌘+⇧+5'], ['Emoji picker', '—', '⌃+⌘+Space'], ['Lock the screen', '—', '⌃+⌘+Q']]],
    ['Apps and windows', [['Close the window', '—', '⌘+W'], ['Quit the app', '—', '⌘+Q'], ['Hide the app', '—', '⌘+H'], ['Force quit', '—', '⌥+⌘+Esc'], ['App settings', '—', '⌘+,']]],
  ]],
};
/* handy Excel formulas for each subject */
const EXCEL_FOR = {
  math: ['🧮 Math in Excel', [['=SUM(A1:A10)', 'Add up a range'], ['=AVERAGE(A1:A10)', 'The mean'], ['=MEDIAN(A1:A10)', 'The middle value'], ['=ROUND(A1, 2)', 'Round to 2 decimal places'], ['=A1^2  or  =POWER(A1, 2)', 'Squares and powers'], ['=SQRT(A1)', 'Square root'], ['=MOD(A1, 3)', 'The remainder after dividing'], ['=PI()', 'π']]],
  science: ['🔬 Science in Excel', [['=AVERAGE(B2:B6)', 'Average of your trials'], ['=STDEV.S(B2:B6)', 'How spread out the results are'], ['=CONVERT(A1, "m", "ft")', 'Change units (meters to feet)'], ['=SLOPE(B2:B10, A2:A10)', 'Slope of the best-fit line'], ['Insert › Scatter chart, then Trendline', 'Graph results and find the pattern'], ['Format cells › Scientific', 'Show numbers like 6.02E+23']]],
  history: ['🏛️ Social Studies & History in Excel', [['Sort A to Z / by date', 'Data › Sort: put events or people in order'], ['=COUNTIF(C:C, "France")', 'Count how many rows match'], ['=YEAR(A2)', 'The year from a date'], ['=A3-A2', 'Days between two dates'], ['Ctrl+Shift+L (Mac ⌘+⇧+F)', 'Filter a big table of data'], ['Insert › Map chart', 'Color a map by numbers (countries, states)']]],
  lang: ['🗣️ Languages in Excel', [['=XLOOKUP(A2, Words!A:A, Words!B:B)', 'Look up a word’s meaning in another sheet'], ['=LEN(A2)', 'How many letters'], ['=PROPER(A2) / =UPPER(A2)', 'Capitalize words / all caps'], ['=COUNTIF(B:B, "verb")', 'Count words of one type'], ['F7', 'Check spelling (pick the language in Review › Language)'], ['Save as CSV', 'Then import it into Estudiamos as a deck']]],
  coding: ['💻 Coding in Excel', [['=IF(A2>10, "big", "small")', 'An if / else in a cell'], ['=TEXTJOIN(", ", TRUE, A2:A9)', 'Join values with commas'], ['=FILTER(A2:C99, B2:B99="yes")', 'Keep only matching rows'], ['=LET(x, A2*2, x+1)', 'Name a value inside a formula'], ['=LAMBDA(x, x*2)(5)', 'Make your own function'], ['Save as CSV', 'Plain text data any program can read']]],
};
const KEYS_FOR_SUBJ = { coding: ['vscode', 'text', 'browser', 'excel', 'windows', 'mac'], math: ['excel', 'text', 'browser'], science: ['excel', 'text', 'browser'], history: ['excel', 'text', 'browser'], lang: ['excel', 'text', 'browser'] };
function kbd(s) {   // "Ctrl+Shift+T / Ctrl+W" → key caps
  s = String(s); if (s.trim() === '—') return '<span class="muted">—</span>';
  const keys = chunk => { const m = chunk.match(/^(.*?)\s*\((.+)\)$/); if (m) return keys(m[1]) + ` <span class="ksep">(${kbd(m[2])})</span>`;
    return chunk.replace(/\+\+/g, '+PLUS').split('+').map(k => k === 'PLUS' ? '+' : k).filter(k => k !== '').map(k => `<kbd>${esc(k.trim())}</kbd>`).join('<span class="kplus">+</span>'); };
  return s.split(/(\s\/\s|\sor\s|\s…\s)/).map(t => /^\s(\/|or|…)\s$/.test(t) ? `<span class="ksep">${esc(t.trim())}</span>` : keys(t.trim())).join(' ');
}
function keysState() { const s = (S.settings.keys ||= {}); return s; }
views.keys = () => {
  const subj = (typeof homeSubj === 'function' && homeSubj()) || '', mine = KEYS_FOR_SUBJ[subj], st = keysState();
  const order = mine && !view.kall ? mine : [...(mine || []), ...Object.keys(KEY_SHEETS).filter(x => !(mine || []).includes(x))];
  const k = KEY_SHEETS[view.ksheet] ? view.ksheet : order[0], [name, about, groups] = KEY_SHEETS[k], q = norm(st.q || ''), os = st.os || (/Mac|iPhone|iPad/.test(navigator.platform) ? 'mac' : 'win');
  const extra = k === 'excel' ? EXCEL_FOR[subj] : null;
  const rows = groups.map(([g, list]) => [g, list.filter(([w, a, b]) => !q || norm(`${w} ${a} ${b}`).includes(q))]).filter(([, l]) => l.length);
  return `<div class="row-between" style="margin-bottom:8px"><h2 style="margin:0">⌨️ Keyboard shortcuts</h2>
      <div class="seg-btns">${[['win', '🪟 Windows'], ['mac', '🍎 Mac'], ['both', 'Both']].map(([o, l]) => `<button type="button" class="btn sm ${os === o ? 'primary' : ''}" data-keys="os" data-k="${o}">${l}</button>`).join('')}</div></div>
    <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px">${order.map(key => `<button type="button" class="btn sm ${key === k ? 'primary' : ''}" data-keys="sheet" data-k="${key}">${KEY_SHEETS[key][0]}</button>`).join('')}
      ${order.length < Object.keys(KEY_SHEETS).length ? `<button type="button" class="btn sm ghost" data-keys="all" title="Show every shortcut chart">More…</button>` : ''}</div>
    <div class="panel"><div class="row-between" style="gap:8px;flex-wrap:wrap"><div><h3 style="margin:0">${name}</h3><span class="muted small">${esc(about)}</span></div>
        <div class="row" style="gap:6px"><input type="search" class="inp" id="keysQ" placeholder="Search shortcuts…" value="${esc(st.q || '')}" style="margin:0;max-width:220px"><button type="button" class="btn sm" data-keys="cards" title="Make flashcards from this chart">📇 Flashcards</button></div></div>
      ${rows.map(([g, list]) => `<h4 class="keys-group">${esc(g)}</h4><div class="keys-table ${os}">${list.map(([w, a, b]) => `<div class="keys-row"><span class="keys-what">${esc(w)}</span>${os !== 'mac' ? `<span class="keys-k" title="Windows">${kbd(a)}</span>` : ''}${os !== 'win' ? `<span class="keys-k" title="Mac">${kbd(b)}</span>` : ''}</div>`).join('')}</div>`).join('') || '<p class="muted">Nothing matches.</p>'}
      ${os === 'both' ? '<p class="muted small" style="margin:8px 0 0">Left: Windows · Right: Mac (⌘ Command, ⌥ Option, ⌃ Control, ⇧ Shift)</p>' : os === 'mac' ? '<p class="muted small" style="margin:8px 0 0">⌘ Command · ⌥ Option · ⌃ Control · ⇧ Shift</p>' : ''}</div>
    ${extra ? `<div class="panel" style="margin-top:12px"><h3 style="margin-top:0">${extra[0]}</h3><div class="sheet">${extra[1].map(([c, m]) => `<div class="sheet-row"><pre class="code-box sm"><code>${esc(c)}</code></pre><span>${esc(m)}</span></div>`).join('')}</div></div>` : ''}`;
};
Object.assign(actions, { keys: el => go({ name: 'keys', ksheet: el?.dataset?.k || null }) });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-keys]'); if (!b || view.name !== 'keys') return; const st = keysState();
  if (b.dataset.keys === 'os') { st.os = b.dataset.k; save(); return render(); }
  if (b.dataset.keys === 'sheet') { view.ksheet = b.dataset.k; return render(); }
  if (b.dataset.keys === 'all') { view.kall = true; return render(); }
  if (b.dataset.keys === 'cards') {
    const k = KEY_SHEETS[view.ksheet] ? view.ksheet : ((KEYS_FOR_SUBJ[typeof homeSubj === 'function' ? homeSubj() : ''] || Object.keys(KEY_SHEETS))[0]), [name, , groups] = KEY_SHEETS[k], os = st.os || 'win', dn = `${name.replace(/^\S+\s/, '')} shortcuts`;
    const subj = (typeof homeSubj === 'function' && homeSubj()) || (k === 'excel' ? 'other' : 'coding');
    let d = S.decks.find(x => x.name === dn); if (!d) { d = { id: uid(), created: Date.now(), name: dn, frontLang: 'en-US', backLang: 'en-US', newPerDay: 20, direction: 'front', subject: subj }; S.decks.push(d); }
    const have = new Set(cardsOf(d.id).map(c => c.front)); let n = 0;
    for (const [, list] of groups) for (const [w, a, m] of list) { const keys = os === 'mac' ? m : os === 'both' ? `${a}  (Mac: ${m})` : a; if (keys === '—' || have.has(w)) continue; S.cards.push({ id: uid(), deckId: d.id, front: w, back: keys, notes: '', example: '', exampleTr: '', state: 'new', due: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0, step: 0, created: Date.now() }); n++; }
    save(); toast(n ? `📇 ${n} cards added to “${dn}”` : 'Those cards are already in the deck'); return go({ name: 'deck', deckId: d.id });
  }
});
document.addEventListener('input', e => { if (e.target.id !== 'keysQ' || view.name !== 'keys') return; keysState().q = e.target.value; clearTimeout(views.keys.t); views.keys.t = setTimeout(() => { const pos = e.target.selectionStart; render(); const el = document.getElementById('keysQ'); el?.focus(); try { el.setSelectionRange(pos, pos); } catch {} }, 200); });
