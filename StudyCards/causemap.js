'use strict';
/* ================= 🔀 Cause-and-effect maps (a tab of the Social Studies page, geo.js) =================
   Boxes for causes, events and effects, joined by arrows. Drag boxes around, connect them, tidy them into columns,
   save a picture, and turn the boxes that have years into a timeline (or start a map from a timeline). */
const CM_KINDS = { cause: ['Cause', '#e3893a'], event: ['Event', '#3b54e8'], effect: ['Effect', '#2e9d5b'] };
const CM_W = 1000, CM_H = 620, CM_BOX = 170;
const CM_EXAMPLES = {
  rev: ['The American Revolution', [['cause', 'French and Indian War leaves Britain in debt', '1763'], ['cause', 'Stamp Act taxes printed paper', '1765'], ['cause', 'Boston Massacre', '1770'], ['cause', 'Boston Tea Party', '1773'], ['cause', 'Intolerable Acts punish Massachusetts', '1774'],
    ['event', 'American Revolutionary War', '1775'], ['event', 'Declaration of Independence', '1776'], ['effect', 'Treaty of Paris: Britain recognizes US independence', '1783'], ['effect', 'US Constitution written', '1787'], ['effect', 'Inspires the French Revolution', '1789']],
    [[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 6], [6, 7], [7, 8], [6, 9]]],
  ww1: ['World War I', [['cause', 'Militarism: countries build up big armies', ''], ['cause', 'Alliances pull many countries in', ''], ['cause', 'Imperialism: competing for colonies', ''], ['cause', 'Nationalism: strong pride and rivalry', ''],
    ['event', 'Archduke Franz Ferdinand is assassinated in Sarajevo', '1914'], ['event', 'World War I is fought', '1914'], ['effect', 'Treaty of Versailles', '1919'], ['effect', 'League of Nations formed', '1920'], ['effect', 'Empires break up and new countries form in Europe', '1918']],
    [[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 6], [5, 7], [5, 8]]],
};
function cmAll() { const w = world(); w.cmaps ||= []; return w.cmaps; }
function cmCur() { const w = world(), all = cmAll(); let m = all.find(x => x.id === w.cmap); if (!m) { m = all[0]; if (!m) { m = { id: uid(), name: 'My cause and effect map', nodes: [], links: [] }; all.push(m); } w.cmap = m.id; } return m; }
const cmUi = { sel: null, link: null, from: null, drag: null };
function cmTidy(m) {   // causes on the left, events in the middle, effects on the right
  const cols = { cause: [], event: [], effect: [] }; m.nodes.forEach(n => cols[n.kind]?.push(n));
  Object.entries(cols).forEach(([k, list], ci) => { const x = [110, 500, 890][ci], gap = Math.min(110, (CM_H - 80) / Math.max(1, list.length)); list.sort((a, b) => (parseInt(a.yr) || 0) - (parseInt(b.yr) || 0) || a.y - b.y);
    list.forEach((n, i) => { n.x = x; n.y = Math.round(CM_H / 2 + (i - (list.length - 1) / 2) * gap); }); });
}
function cmNew(name, nodes = [], links = []) { const m = { id: uid(), name, nodes: nodes.map(([kind, t, yr]) => ({ id: uid(), kind, t, yr: yr || '', x: 0, y: 0 })), links: [] }; m.links = links.map(([a, b]) => ({ a: m.nodes[a].id, b: m.nodes[b].id })); cmTidy(m); cmAll().push(m); world().cmap = m.id; cmUi.sel = null; return m; }
function cmNodeHtml(n) {
  const [lab, col] = CM_KINDS[n.kind] || CM_KINDS.event;
  return `<div class="cm-node ${cmUi.sel === n.id ? 'sel' : ''} ${cmUi.from === n.id ? 'from' : ''}" data-cmn="${n.id}" style="left:${n.x - CM_BOX / 2}px;top:${n.y}px;--k:${col}" tabindex="0">
    <div class="cm-k">${lab}${n.yr ? ` · ${esc(n.yr)}` : ''}</div><div class="cm-t">${esc(n.t) || '<span class="muted">(empty)</span>'}</div></div>`;
}
function causeHtml() {
  const m = cmCur(), all = cmAll(), tls = typeof tlAll === 'function' ? tlAll().filter(t => t.events?.length) : [], sel = m.nodes.find(n => n.id === cmUi.sel), selL = typeof cmUi.sel === 'number' ? m.links[cmUi.sel] : null;
  return `<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px;align-items:center">
      <select class="inp" data-cm-pick style="margin:0;width:auto;max-width:240px" aria-label="Which map">${all.map(x => `<option value="${x.id}" ${x.id === m.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
      <button type="button" class="btn sm" data-cm="new">＋ New map</button><button type="button" class="btn sm ghost" data-cm="rename">✏️ Rename</button><button type="button" class="btn sm ghost" data-cm="delMap">🗑️ Delete map</button>
      <select class="inp" data-cm-ex style="margin:0;width:auto" aria-label="Start from an example"><option value="">📚 Examples…</option>${Object.entries(CM_EXAMPLES).map(([k, [n]]) => `<option value="${k}">${esc(n)}</option>`).join('')}</select>
      ${tls.length ? `<select class="inp" data-cm-tl style="margin:0;width:auto" aria-label="Start from a timeline"><option value="">🕰️ From a timeline…</option>${tls.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}</select>` : ''}</div>
    <div class="cm-tools">${Object.entries(CM_KINDS).map(([k, [l, c]]) => `<button type="button" class="btn sm" data-cm="add" data-k="${k}" style="border-left:4px solid ${c}">＋ ${l}</button>`).join('')}
      <button type="button" class="btn sm ${cmUi.link ? 'primary' : ''}" data-cm="link">🔗 ${cmUi.link ? (cmUi.from ? 'Now tap where it leads' : 'Tap the first box') : 'Connect boxes'}</button>
      <button type="button" class="btn sm" data-cm="tidy">🧹 Tidy up</button><button type="button" class="btn sm" data-cm="png">⬇️ Save picture</button><button type="button" class="btn sm" data-cm="toTl">🕰️ Make a timeline</button></div>
    <div class="cm-scroll"><div class="cm-board ${cmUi.link ? 'linking' : ''}" style="width:${CM_W}px;height:${CM_H}px">
      <svg class="cm-svg" width="${CM_W}" height="${CM_H}" aria-hidden="true"><defs><marker id="cmArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="cm-head"/></marker></defs><g id="cmLinks"></g></svg>
      ${[['Causes', 110], ['Events', 500], ['Effects', 890]].map(([t, x]) => `<div class="cm-col" style="left:${x - 60}px">${t}</div>`).join('')}
      ${m.nodes.map(cmNodeHtml).join('')}
      ${m.nodes.length ? '' : '<div class="cm-empty">Add a cause, an event and an effect, then connect them with arrows. Or pick an example above.</div>'}</div></div>
    <div class="cm-edit">${sel ? `<label class="field" style="flex:2;min-width:200px">What happened<textarea class="inp" rows="2" data-cme="t" maxlength="140">${esc(sel.t)}</textarea></label>
        <label class="field" style="width:110px">Year<input class="inp" data-cme="yr" value="${esc(sel.yr)}" placeholder="1776" maxlength="8"></label>
        <div class="field">Kind<div class="seg-btns">${Object.entries(CM_KINDS).map(([k, [l]]) => `<button type="button" class="btn sm ${sel.kind === k ? 'primary' : ''}" data-cm="kind" data-k="${k}">${l}</button>`).join('')}</div></div>
        <button type="button" class="btn sm danger" data-cm="delNode">🗑️ Delete box</button>`
      : selL ? `<span>Arrow from <b>${esc(m.nodes.find(n => n.id === selL.a)?.t || '')}</b> to <b>${esc(m.nodes.find(n => n.id === selL.b)?.t || '')}</b></span><button type="button" class="btn sm danger" data-cm="delLink">🗑️ Delete arrow</button>`
      : '<span class="muted small">Tap a box to change it, drag it to move it, or tap an arrow to remove it. Use a year like 1776 or -44 (for 44 BCE) to put it on a timeline.</span>'}</div>`;
}
function cmEdge(n, toward, h) {   // where an arrow meets a box's edge
  const cx = n.x, cy = n.y + h / 2, dx = toward[0] - cx, dy = toward[1] - cy, sx = (CM_BOX / 2 + 4) / Math.abs(dx || 1e-9), sy = (h / 2 + 4) / Math.abs(dy || 1e-9), s = Math.min(sx, sy, 1);
  return [cx + dx * s, cy + dy * s];
}
function cmArrows() {
  const g = document.getElementById('cmLinks'); if (!g) return; const m = cmCur(), hs = {};
  document.querySelectorAll('.cm-node').forEach(el => hs[el.dataset.cmn] = el.offsetHeight);
  g.innerHTML = m.links.map((l, i) => { const a = m.nodes.find(n => n.id === l.a), b = m.nodes.find(n => n.id === l.b); if (!a || !b) return '';
    const ca = [a.x, a.y + (hs[a.id] || 50) / 2], cb = [b.x, b.y + (hs[b.id] || 50) / 2], p = cmEdge(a, cb, hs[a.id] || 50), q = cmEdge(b, ca, hs[b.id] || 50);
    return `<g class="cm-link ${cmUi.sel === i ? 'sel' : ''}" data-cml="${i}"><line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" class="cm-hit"/><line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" class="cm-line" marker-end="url(#cmArrow)"/></g>`; }).join('');
}
function cmRedraw() { const p = document.querySelector('.world-panel'); if (!p || view.name !== 'world' || world().tab !== 'cause') return; const sc = p.querySelector('.cm-scroll'), sl = sc ? [sc.scrollLeft, sc.scrollTop] : null;
  p.innerHTML = causeHtml(); const s2 = p.querySelector('.cm-scroll'); if (sl && s2) [s2.scrollLeft, s2.scrollTop] = sl; cmArrows(); }
function cmFree(kind) { const m = cmCur(), x = { cause: 110, event: 500, effect: 890 }[kind]; let y = 60; while (m.nodes.some(n => Math.abs(n.x - x) < 120 && Math.abs(n.y - y) < 80) && y < CM_H - 80) y += 90; return [x, Math.min(y, CM_H - 80)]; }
function cmPicture() {   // draw the map on a canvas to save as a PNG
  const m = cmCur(), c = document.createElement('canvas'), sc = 2; c.width = CM_W * sc; c.height = CM_H * sc; const g = c.getContext('2d'); g.scale(sc, sc); g.fillStyle = '#fff'; g.fillRect(0, 0, CM_W, CM_H);
  const hs = {}; document.querySelectorAll('.cm-node').forEach(el => hs[el.dataset.cmn] = el.offsetHeight);
  g.strokeStyle = '#555'; g.fillStyle = '#555'; g.lineWidth = 2;
  for (const l of m.links) { const a = m.nodes.find(n => n.id === l.a), b = m.nodes.find(n => n.id === l.b); if (!a || !b) continue; const ha = hs[a.id] || 50, hb = hs[b.id] || 50;
    const p = cmEdge(a, [b.x, b.y + hb / 2], ha), q = cmEdge(b, [a.x, a.y + ha / 2], hb), ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
    g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke(); g.beginPath(); g.moveTo(...q); g.lineTo(q[0] - 11 * Math.cos(ang - 0.4), q[1] - 11 * Math.sin(ang - 0.4)); g.lineTo(q[0] - 11 * Math.cos(ang + 0.4), q[1] - 11 * Math.sin(ang + 0.4)); g.fill(); }
  for (const n of m.nodes) { const [lab, col] = CM_KINDS[n.kind] || CM_KINDS.event, h = hs[n.id] || 50, x = n.x - CM_BOX / 2, y = n.y;
    g.fillStyle = '#fff'; g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); g.roundRect(x, y, CM_BOX, h, 10); g.fill(); g.stroke(); g.fillStyle = col; g.fillRect(x, y + 6, 4, h - 12);
    g.font = 'bold 11px system-ui, sans-serif'; g.fillText(lab.toUpperCase() + (n.yr ? ' · ' + n.yr : ''), x + 12, y + 17);
    g.fillStyle = '#222'; g.font = '13px system-ui, sans-serif'; let line = '', ly = y + 35;
    for (const wd of (n.t || '').split(' ')) { const t = line ? line + ' ' + wd : wd; if (g.measureText(t).width > CM_BOX - 22 && line) { g.fillText(line, x + 12, ly); ly += 17; line = wd; } else line = t; } if (line) g.fillText(line, x + 12, ly); }
  g.fillStyle = '#888'; g.font = 'bold 15px system-ui, sans-serif'; g.fillText(m.name, 14, CM_H - 14);
  const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = `${m.name.replace(/[\\/:*?"<>|]/g, '')}.png`; a.click();
}
document.addEventListener('click', e => {
  if (view.name !== 'world' || world().tab !== 'cause') return;
  const lk = e.target.closest('[data-cml]'); if (lk) { cmUi.sel = +lk.dataset.cml; return cmRedraw(); }
  const b = e.target.closest('[data-cm]'); if (!b) { if (e.target.closest('.cm-board') && !e.target.closest('.cm-node') && cmUi.sel != null) { cmUi.sel = null; cmRedraw(); } return; }
  const m = cmCur(), k = b.dataset.k, sel = m.nodes.find(n => n.id === cmUi.sel);
  switch (b.dataset.cm) {
    case 'new': { const nm = prompt('Name the new map (for example: Causes of the Civil War)', ''); if (nm == null) return; cmNew(nm.trim().slice(0, 60) || 'Cause and effect map'); break; }
    case 'rename': { const nm = prompt('New name for this map', m.name); if (nm == null) return; m.name = nm.trim().slice(0, 60) || m.name; break; }
    case 'delMap': { if (!confirm(`Delete “${m.name}”?`)) return; const all = cmAll(); all.splice(all.indexOf(m), 1); world().cmap = null; cmUi.sel = null; break; }
    case 'add': { const [x, y] = cmFree(k), n = { id: uid(), kind: k, t: '', yr: '', x, y }; m.nodes.push(n); cmUi.sel = n.id; worldSave(); cmRedraw(); document.querySelector('[data-cme="t"]')?.focus(); return; }
    case 'link': cmUi.link = !cmUi.link; cmUi.from = null; break;
    case 'tidy': cmTidy(m); break;
    case 'kind': if (sel) sel.kind = k; break;
    case 'delNode': if (!sel) return; m.nodes = m.nodes.filter(n => n !== sel); m.links = m.links.filter(l => l.a !== sel.id && l.b !== sel.id); cmUi.sel = null; break;
    case 'delLink': if (typeof cmUi.sel === 'number') m.links.splice(cmUi.sel, 1); cmUi.sel = null; break;
    case 'png': return cmPicture();
    case 'toTl': { const ev = m.nodes.filter(n => /^-?\d{1,6}$/.test(String(n.yr).trim()) && n.t); if (!ev.length) return toast('Give some boxes a year first (like 1776)');
      return worldTimeline(m.name, ev.map(n => ({ y: parseInt(n.yr), title: n.t, text: CM_KINDS[n.kind][0] }))); }
    default: return;
  }
  worldSave(); cmRedraw();
});
document.addEventListener('change', e => {
  if (view.name !== 'world' || world().tab !== 'cause') return; const w = world();
  if (e.target.matches('[data-cm-pick]')) { w.cmap = e.target.value; cmUi.sel = null; worldSave(); return cmRedraw(); }
  if (e.target.matches('[data-cm-ex]') && e.target.value) { const [n, nodes, links] = CM_EXAMPLES[e.target.value]; cmNew(n, nodes, links); worldSave(); toast('📚 Example added. Change it however you like.'); return cmRedraw(); }
  if (e.target.matches('[data-cm-tl]') && e.target.value) { const t = tlAll().find(x => x.id === e.target.value); if (!t) return;
    const evs = t.events.slice().sort((a, b) => (a.y || 0) - (b.y || 0)).slice(0, 12), m = cmNew(t.name, evs.map(ev => ['event', (ev.title || '').slice(0, 140), String(ev.y ?? '')]), evs.slice(1).map((_, i) => [i, i + 1]));
    m.nodes.forEach((n, i) => { n.x = 110 + (i % 3) * 390; n.y = 50 + Math.floor(i / 3) * 140; }); worldSave(); toast('🕰️ Made from your timeline. Mark which ones are causes and effects.'); return cmRedraw(); }
});
document.addEventListener('input', e => { const k = e.target.dataset?.cme; if (!k || view.name !== 'world') return; const n = cmCur().nodes.find(x => x.id === cmUi.sel); if (!n) return;
  n[k] = e.target.value; const el = document.querySelector(`[data-cmn="${n.id}"]`); if (el) { const t = document.createElement('div'); t.innerHTML = cmNodeHtml(n); el.innerHTML = t.firstElementChild.innerHTML; } cmArrows(); worldSave(); });
document.addEventListener('pointerdown', e => {
  const el = e.target.closest?.('[data-cmn]'); if (!el || view.name !== 'world') return; const n = cmCur().nodes.find(x => x.id === el.dataset.cmn); if (!n) return;
  cmUi.drag = { n, el, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y, moved: false }; try { el.setPointerCapture(e.pointerId); } catch {}
});
document.addEventListener('pointermove', e => { const d = cmUi.drag; if (!d) return; const dx = e.clientX - d.sx, dy = e.clientY - d.sy; if (!d.moved && Math.abs(dx) + Math.abs(dy) < 5) return; d.moved = true;
  d.n.x = Math.max(CM_BOX / 2, Math.min(CM_W - CM_BOX / 2, d.ox + dx)); d.n.y = Math.max(0, Math.min(CM_H - d.el.offsetHeight, d.oy + dy)); d.el.style.left = d.n.x - CM_BOX / 2 + 'px'; d.el.style.top = d.n.y + 'px'; cmArrows(); });
document.addEventListener('pointerup', () => { const d = cmUi.drag; if (!d) return; cmUi.drag = null; const m = cmCur();
  if (d.moved) { worldSave(); return; }
  if (cmUi.link) { if (!cmUi.from) { cmUi.from = d.n.id; return cmRedraw(); } if (cmUi.from !== d.n.id && !m.links.some(l => l.a === cmUi.from && l.b === d.n.id)) m.links.push({ a: cmUi.from, b: d.n.id }); cmUi.from = null; cmUi.link = false; worldSave(); return cmRedraw(); }
  cmUi.sel = d.n.id; cmRedraw(); });
