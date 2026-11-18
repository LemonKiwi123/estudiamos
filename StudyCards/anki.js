'use strict';
/* ================= File import / export: Anki (.apkg/.colpkg), Noji (.ofc), CSV ================= */

/* ---------- ZIP reading/writing (uses the browser's built-in deflate) ---------- */
async function inflateRaw(u8) {
  const s = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(s).arrayBuffer());
}
function unzip(buf) {
  const u8 = new Uint8Array(buf), dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let e = u8.length - 22; const stop = Math.max(0, u8.length - 65558);
  while (e >= stop && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < stop) throw new Error('This file isn’t a valid package (not a zip archive).');
  let n = dv.getUint16(e + 10, true), off = dv.getUint32(e + 16, true);
  if ((off === 0xFFFFFFFF || n === 0xFFFF) && e >= 20 && dv.getUint32(e - 20, true) === 0x07064b50) {
    const z = Number(dv.getBigUint64(e - 12, true)); n = Number(dv.getBigUint64(z + 32, true)); off = Number(dv.getBigUint64(z + 48, true));
  }
  const files = {}, td = new TextDecoder();
  for (let i = 0; i < n && dv.getUint32(off, true) === 0x02014b50; i++) {
    const method = dv.getUint16(off + 10, true), nl = dv.getUint16(off + 28, true), xl = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true);
    let csize = dv.getUint32(off + 20, true), usize = dv.getUint32(off + 24, true), lo = dv.getUint32(off + 42, true);
    const name = td.decode(u8.subarray(off + 46, off + 46 + nl));
    if (csize === 0xFFFFFFFF || usize === 0xFFFFFFFF || lo === 0xFFFFFFFF) {
      for (let p = off + 46 + nl, end = p + xl; p + 4 <= end;) {
        const id = dv.getUint16(p, true), sz = dv.getUint16(p + 2, true);
        if (id === 1) { let q = p + 4;
          if (usize === 0xFFFFFFFF) { usize = Number(dv.getBigUint64(q, true)); q += 8; }
          if (csize === 0xFFFFFFFF) { csize = Number(dv.getBigUint64(q, true)); q += 8; }
          if (lo === 0xFFFFFFFF) lo = Number(dv.getBigUint64(q, true)); }
        p += 4 + sz;
      }
    }
    files[name] = { method, csize, lo };
    off += 46 + nl + xl + cl;
  }
  const names = Object.keys(files);
  return {
    names,
    find: base => names.find(x => x.split('/').pop() === base && !x.includes('__MACOSX')),
    async read(name) {
      const f = files[name]; if (!f) return null;
      const start = f.lo + 30 + dv.getUint16(f.lo + 26, true) + dv.getUint16(f.lo + 28, true);
      const data = u8.subarray(start, start + f.csize);
      if (f.method === 0) return data.slice();
      if (f.method === 8) return inflateRaw(data);
      throw new Error('Unsupported compression inside the package (method ' + f.method + ').');
    },
  };
}
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(u8) { let c = 0xFFFFFFFF; for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function makeZip(files) {
  const enc = new TextEncoder(), parts = [], central = []; let off = 0;
  for (const f of files) {
    const nm = enc.encode(f.name), crc = crc32(f.data), sz = f.data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(12, 0x21, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, sz, true); lh.setUint32(22, sz, true); lh.setUint16(26, nm.length, true);
    parts.push(new Uint8Array(lh.buffer), nm, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(14, 0x21, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
    central.push(new Uint8Array(ch.buffer), nm);
    off += 30 + nm.length + sz;
  }
  const cd = central.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, cd, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
}

/* ---------- SQLite (sql.js), loaded only when needed ---------- */
let sqlPromise = null;
function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Could not load ' + src)); document.head.appendChild(s); });
}
function getSQL() {
  return sqlPromise ||= (async () => {
    await loadScript('lib/sql-wasm.js'); await loadScript('lib/sql-wasm-binary.js');
    const bin = Uint8Array.from(atob(window.SQL_WASM_BASE64), c => c.charCodeAt(0));
    return initSqlJs({ wasmBinary: bin });
  })().catch(e => { sqlPromise = null; throw e; });
}
function rows(db, sql, params) {
  const st = db.prepare(sql); if (params) st.bind(params);
  const out = []; while (st.step()) out.push(st.getAsObject()); st.free(); return out;
}
const hasTable = (db, n) => rows(db, "SELECT name FROM sqlite_master WHERE type='table' AND name=?", [n]).length > 0;

/* ---------- Text cleanup for imported HTML fields ---------- */
function htmlToText(h) {
  h = String(h ?? '').replace(/\[sound:[^\]]*\]/g, '').replace(/<img[^>]*>/gi, '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>|<\/div>|<\/p>|<\/li>/gi, '\n');
  const doc = new DOMParser().parseFromString(h, 'text/html');
  return (doc.body.textContent || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim();
}

/* ---------- Anki import ---------- */
async function readAnkiPackage(buf) {
  const z = unzip(buf);
  let bytes = null, which = null;
  for (const n of ['collection.anki21b', 'collection.anki21', 'collection.anki2']) {
    const nm = z.find(n); if (nm) { bytes = await z.read(nm); which = n; break; }
  }
  if (!bytes) throw new Error('No Anki collection was found inside this file.');
  if (which === 'collection.anki21b') bytes = fzstd.decompress(bytes);
  const media = await ankiMediaMap(z);
  const SQL = await getSQL(), db = new SQL.Database(bytes);
  let res; try { res = extractAnki(db); } finally { db.close(); }
  const cache = new Map();
  for (const d of res.decks) {
    const kept = [];
    for (const c of d.cards) {
      const f = await importHtmlField(c.frontRaw, media, z, cache), b = await importHtmlField(c.backRaw, media, z, cache);
      if (!hasContent(f) || !hasContent(b)) { res.skipped++; continue; }   // e.g. a picture that isn't in the file
      Object.assign(c, { front: f.text, frontHtml: f.html, back: b.text, backHtml: b.html }); delete c.frontRaw; delete c.backRaw;
      kept.push(c);
    }
    d.cards = kept;
  }
  res.decks = res.decks.filter(d => d.cards.length);
  return res;
}
const isZstd = u8 => u8 && u8.length > 4 && u8[0] === 0x28 && u8[1] === 0xb5 && u8[2] === 0x2f && u8[3] === 0xfd;
/* Anki's media index: legacy JSON {"0":"name.jpg"} or (newer) zstd-compressed protobuf list of entries */
async function ankiMediaMap(z) {
  const m = z.find('media'); if (!m) return {};
  let raw = await z.read(m);
  try { const j = JSON.parse(new TextDecoder().decode(raw)); return Object.fromEntries(Object.entries(j).map(([k, name]) => [name, { entry: k }])); } catch {}
  if (isZstd(raw)) raw = fzstd.decompress(raw);
  const out = {}, td = new TextDecoder(); let i = 0, idx = 0;
  const v = () => { let x = 0, s = 0, b; do { b = raw[i++]; x += (b & 127) * 2 ** s; s += 7; } while (b & 128 && i < raw.length); return x; };
  const skip = w => { if (w === 0) v(); else if (w === 1) i += 8; else if (w === 2) { const l = v(); i += l; } else if (w === 5) i += 4; };
  while (i < raw.length) {
    const key = v(), f = Math.floor(key / 8), w = key & 7;
    if (f !== 1 || w !== 2) { skip(w); continue; }
    const len = v(), end = i + len; let name = '', legacy = null;
    while (i < end) {
      const k2 = v(), f2 = Math.floor(k2 / 8), w2 = k2 & 7;
      if (f2 === 1 && w2 === 2) { const l = v(); name = td.decode(raw.subarray(i, i + l)); i += l; }
      else if (f2 === 255 && w2 === 0) legacy = v();
      else skip(w2);
    }
    i = end;
    if (name) out[name] = { entry: String(legacy ?? idx) };
    idx++;
  }
  return out;
}
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', bmp: 'image/bmp', avif: 'image/avif' };
const mimeOf = n => MIME[(n.split('.').pop() || '').toLowerCase()] || 'application/octet-stream';
const safeDecode = s => { try { return decodeURIComponent(s); } catch { return s; } };
/* Turn an imported HTML field into {text, html}, storing its pictures in the app. */
async function importHtmlField(raw, media, z, cache) {
  let h = String(raw ?? '').replace(/\[sound:[^\]]*\]/g, '');
  const IMG = /<img\b[^>]*?\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>/gi;
  for (const m of h.matchAll(IMG)) {
    const n = safeDecode(m[1] || m[2] || m[3]); if (cache.has(n)) continue;
    let id = null; const e = media[n];
    if (e && !/svg/.test(mimeOf(n))) {
      try {
        let bytes = await z.read(z.names.includes(e.entry) ? e.entry : z.find(e.entry));
        if (isZstd(bytes)) bytes = fzstd.decompress(bytes);
        if (bytes?.length) id = await putMedia(new Blob([bytes], { type: mimeOf(n) }));
      } catch (err) { console.warn('picture skipped', n, err); }
    }
    cache.set(n, id);
  }
  h = h.replace(IMG, (m, a, b, c) => { const id = cache.get(safeDecode(a || b || c)); return id ? `<img data-mid="${id}">` : ''; });
  const html = cleanHtml(h, { rich: true, pictures: true });
  return { text: htmlToText(html), html: isPlainHtml(html) ? '' : html };
}
function extractAnki(db) {
  const col = rows(db, 'SELECT * FROM col')[0] || {};
  const crt = Number(col.crt) || Math.floor(startOfDay(Date.now()) / 1000);
  const deckNames = {};
  if (hasTable(db, 'decks')) rows(db, 'SELECT id, name FROM decks').forEach(d => { deckNames[d.id] = String(d.name).split('\x1f').join('::'); });
  else { try { Object.values(JSON.parse(col.decks || '{}')).forEach(d => { deckNames[d.id] = d.name; }); } catch {} }
  const first = {};
  for (const c of rows(db, 'SELECT nid, did, ord, type, queue, due, ivl, factor, reps, lapses, odid, odue FROM cards ORDER BY nid, ord')) if (!(c.nid in first)) first[c.nid] = c;
  const decks = {}; let skipped = 0;
  const clozeQ = s => s.replace(/\{\{c\d+::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g, (m, a, h) => h ? `[… (${h})]` : '[…]');
  const clozeA = s => s.replace(/\{\{c\d+::([\s\S]*?)(?:::[\s\S]*?)?\}\}/g, '$1');
  for (const n of rows(db, 'SELECT id, flds FROM notes')) {
    const c = first[n.id]; if (!c) continue;
    const f = String(n.flds).split('\x1f');
    let frontRaw, backRaw;
    if (/\{\{c\d+::/.test(f[0])) { frontRaw = clozeQ(f[0]); backRaw = clozeA(f[0]) + (htmlToText(f[1]) || /<img/i.test(f[1] || '') ? '<br>' + f[1] : ''); }
    else { frontRaw = f[0] || ''; backRaw = f[1] || ''; }
    const has = h => !!htmlToText(h) || /<img/i.test(h);
    if (!has(frontRaw) || !has(backRaw)) { skipped++; continue; }
    const extra = f.slice(2).map(htmlToText).filter(Boolean).join(' · ');
    const name = (deckNames[c.odid || c.did] || 'Imported from Anki').replace(/::/g, ' › ');
    (decks[name] ||= []).push({ frontRaw, backRaw, notes: extra, progress: ankiProgress(c, crt) });
  }
  if (decks['Default'] && Object.keys(decks).length > 1 && !decks['Default'].length) delete decks['Default'];
  return { decks: Object.entries(decks).map(([name, cards]) => ({ name, cards })), skipped };
}
function ankiProgress(c, crt) {
  if (c.type === 0 || c.queue === 0) return null;
  const base = { reps: c.reps || 0, lapses: c.lapses || 0, ease: c.factor ? Math.max(1.3, c.factor / 1000) : 2.5 };
  const due = c.odid ? c.odue : c.due;
  if (c.type === 2) return { ...base, state: 'review', interval: Math.max(1, c.ivl || 1), due: startOfDay((crt + due * 86400) * 1000) };
  let dueMs = c.queue === 3 ? startOfDay((crt + due * 86400) * 1000) : due * 1000;
  if (!(dueMs > 0) || dueMs > Date.now() + 365 * DAY) dueMs = Date.now();
  return { ...base, state: c.type === 3 ? 'relearning' : 'learning', interval: Math.max(0, c.ivl || 0), step: 0, due: dueMs };
}

/* ---------- Noji (.ofc) import ---------- */
async function readOfc(buf) {
  const z = unzip(buf);
  let bytes;
  if (z.find('deck_data.json')) bytes = await z.read(z.find('deck_data.json'));
  else if (z.find('deck_export_data')) bytes = fzstd.decompress(await z.read(z.find('deck_export_data')));
  else throw new Error('This doesn’t look like a Noji .ofc export (no deck data inside).');
  const data = JSON.parse(new TextDecoder().decode(bytes));
  if (!Array.isArray(data)) throw new Error('Unexpected .ofc contents.');
  const names = {}; data.forEach(d => { names[String(d.id)] = d.name; });
  let att = { names: [], find: () => null, read: async () => null };
  const attName = z.find('attachments.zip');
  if (attName) { try { const b = await z.read(attName); if (b?.length >= 22) att = unzip(b); } catch (e) { console.warn('attachments unreadable', e); } }
  const media = {}; for (const n of att.names) media[n.split('/').pop()] = { entry: n };
  const out = [], cache = new Map(); let skipped = 0;
  for (const d of data) {
    const path = String(d.ancestry || '/').split('/').filter(Boolean).map(id => names[id]).filter(Boolean);
    const cards = [];
    for (const n of d.notes || []) {
      const fl = n.fields || {}; let fr = fl.front_side || '', bk = fl.back_side || '';
      for (const a of n.note_attachments || []) {
        const url = a?.attachment?.media_file?.url; if (!url) continue;
        const tag = `<br><img src="${esc(String(url).split('?')[0].split('/').pop())}">`;
        if (a.field_name === 'front_side') fr += tag; else bk += tag;
      }
      const f = await importHtmlField(fr, media, att, cache), b = await importHtmlField(bk, media, att, cache);
      if (!hasContent(f) || !hasContent(b)) { skipped++; continue; }
      cards.push({ front: f.text, frontHtml: f.html, back: b.text, backHtml: b.html, notes: '', progress: ofcProgress((n.progresses || [])[0]) });
    }
    const st = (d.settings || [])[0] || {};
    const okLang = l => typeof l === 'string' && /^[a-z]{2,3}(-[A-Za-z0-9]+)*$/.test(l) ? l : undefined;
    if (cards.length) out.push({ name: [...path, d.name || 'Noji deck'].join(' › '), cards,
      frontLang: okLang(st.tts_front_side_language), backLang: okLang(st.tts_back_side_language),
      newPerDay: Number.isFinite(st.new_cards_per_day) ? st.new_cards_per_day : undefined });
  }
  return { decks: out, skipped };
}
function ofcProgress(p) {
  if (!p || !p.learning_state || p.learning_state === 'new') return null;
  const due = Date.parse(p.next_review_at) || Date.now(), ease = p.ease_factor ? Math.max(1.3, p.ease_factor / 100) : 2.5;
  if (p.learning_state === 'graduated') return { state: 'review', interval: Math.max(1, Math.round((p.interval || 1440) / 1440)), ease, due: startOfDay(due), reps: 1, lapses: 0 };
  const relearn = p.learning_steps_index == null && p.ease_factor != null;
  return { state: relearn ? 'relearning' : 'learning', interval: Math.max(0, Math.round((p.interval || 0) / 1440)), ease, due, step: 0, reps: 1, lapses: 0 };
}

/* ---------- Import flow ---------- */
function pickBinaryFile(accept, fn) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept;
  inp.onchange = () => { const f = inp.files[0]; if (f) fn(f); };
  inp.click();
}
async function importFile(file, targetDeck) {
  const ext = (file.name.split('.').pop() || '').toLowerCase(), base = file.name.replace(/\.[^.]+$/, '');
  try {
    if (ext === 'json') { restoreBackup(await file.text()); return; }
    let res;
    if (ext === 'apkg' || ext === 'colpkg') { toast('Reading Anki file…'); res = await readAnkiPackage(await file.arrayBuffer()); }
    else if (ext === 'ofc') { toast('Reading Noji file…'); res = await readOfc(await file.arrayBuffer()); }
    else if (['csv', 'tsv', 'txt'].includes(ext)) {
      const text = await file.text();
      const sep = ext === 'csv' ? detectCsvSep(text) : 'auto';
      let cards = parseImport(text, sep); const words = parseImport(text, sep, { allowBlank: true });
      if (words.length > cards.length) cards = words;   // some (or all) rows are just a word with no back: keep them, they can be translated
      res = { decks: [{ name: base, cards }], skipped: 0 };
    } else { toast('Unsupported file type: .' + ext); return; }
    if (!res.decks.some(d => d.cards.length)) { toast('No cards with text were found in that file'); return; }
    importSummary(res, file.name, targetDeck);
  } catch (e) { console.error(e); openDialog({ title: 'Couldn’t import that file', body: `<p style="margin:0">${esc(e.message || String(e))}</p>`, ok: 'OK', onOk: () => {} }); }
}
function detectCsvSep(text) { const l = text.split(/\r?\n/).find(x => x.trim()) || ''; return l.includes('\t') ? '\t' : (l.split(';').length > l.split(',').length ? ';' : ','); }
function importSummary(res, fileName, targetDeck) {
  const total = res.decks.reduce((a, d) => a + d.cards.length, 0), anyProgress = res.decks.some(d => d.cards.some(c => c.progress));
  const blanks = res.decks.reduce((a, d) => a + d.cards.filter(c => !String(c.back || '').trim()).length, 0);
  const last = S.decks.at(-1) || { frontLang: 'es-ES', backLang: 'en-US' };
  const existing = n => S.decks.find(d => d.name.toLowerCase() === n.toLowerCase());
  openDialog({
    title: `Import “${fileName}”`, ok: `Import ${total} card${total === 1 ? '' : 's'}`, wide: true,
    body: `
      <p style="margin:0">Found <b>${total}</b> card${total === 1 ? '' : 's'} in <b>${res.decks.length}</b> deck${res.decks.length === 1 ? '' : 's'}${res.skipped ? `. ${res.skipped} card${res.skipped === 1 ? ' was' : 's were'} skipped because they had no text (images or audio only)` : ''}.</p>
      ${targetDeck ? `<p class="muted small" style="margin:0">All cards will be added to “${esc(targetDeck.name)}”.</p>` : ''}
      <div style="max-height:220px;overflow:auto;border:1px solid var(--border);border-radius:10px;padding:6px 12px">
        ${res.decks.map((d, i) => `<label class="check" style="padding:6px 0"><input type="checkbox" name="deck${i}" checked>
          <span><b>${esc(d.name)}</b> <span class="muted small">· ${d.cards.length} cards${!targetDeck && existing(d.name) ? ' · will be added to your existing deck'
            : !targetDeck && d.frontLang ? ` · ${esc(langName(d.frontLang))} → ${esc(langName(d.backLang))} (from file)` : ''}</span></span></label>`).join('')}
      </div>
      ${targetDeck ? '' : `<div class="grid2">
        <label class="field">Front language (new decks)<select name="frontLang">${langOptions(last.frontLang)}</select></label>
        <label class="field">Back language (new decks)<select name="backLang">${langOptions(last.backLang)}</select></label></div>
      ${res.decks.some(d => d.frontLang) ? '<p class="muted small" style="margin:0">Decks marked “from file” keep the languages saved in the file. You can change them later in deck settings.</p>' : ''}`}
      ${anyProgress ? `<label class="check"><input type="checkbox" name="progress" checked><span>Keep study progress (when cards are due, intervals, ease)</span></label>` : ''}
      <label class="check"><input type="checkbox" name="skipDup" checked><span>Skip cards whose front already exists in the deck</span></label>
      ${blanks ? `<label class="check"><input type="checkbox" name="autoTr" ${typeof txSuggest === 'function' ? 'checked' : 'disabled'}><span><b>🌐 Translate the ${blanks} card${blanks === 1 ? '' : 's'} with no back</b>
        <span class="muted small" style="display:block">${blanks === total ? 'This file is a list of words.' : `${blanks} row${blanks === 1 ? ' has' : 's have'} only one column.`} Each word is translated from the front language into the back language and put on the back. The words are sent to Wiktionary or MyMemory (free translators); you can fix any translation afterwards.</span></span></label>` : ''}`,
    onOk: f => {
      const toTr = [];
      let added = 0, dup = 0, decksMade = 0;
      res.decks.forEach((src, i) => {
        if (!f['deck' + i].checked) return;
        let deck = targetDeck || existing(src.name);
        if (!deck) {
          deck = { id: uid(), name: src.name.slice(0, 120), frontLang: src.frontLang || f.frontLang.value, backLang: src.backLang || f.backLang.value,
            newPerDay: src.newPerDay ?? 20, direction: 'front', created: Date.now() };
          S.decks.push(deck); decksMade++;
        }
        const seen = new Set(cardsOf(deck.id).map(c => c.front.trim().toLowerCase()));
        src.cards.forEach((it, k) => {
          const key = it.front.trim().toLowerCase();
          if (f.skipDup.checked && key && seen.has(key)) { dup++; return; }
          const c = newCard(deck.id, it.front, it.back, it.notes || '', it.example || '', it.exampleTr || '');
          if (it.frontHtml) c.frontHtml = it.frontHtml;
          if (it.backHtml) c.backHtml = it.backHtml;
          c.created = Date.now() + k;
          if (it.progress && f.progress?.checked) Object.assign(c, it.progress);
          S.cards.push(c); seen.add(key); added++;
          if (!String(it.back || '').trim() && !it.backHtml && f.autoTr?.checked) toTr.push({ c, deck });
        });
      });
      save();
      if (toTr.length) setTimeout(() => importTranslate(toTr), 300);
      if (targetDeck) render(); else go({ name: 'home' });
      toast(`Imported ${added} card${added === 1 ? '' : 's'}${decksMade ? ` into ${decksMade} new deck${decksMade === 1 ? '' : 's'}` : ''}${dup ? `, skipped ${dup} duplicates` : ''}`);
    },
  });
}

/* 🌐 fill in the empty backs of just-imported cards, one word at a time, with a window that shows how far along it is */
async function importTranslate(list) {
  const okDeck = d => typeof txCanDeck === 'function' && txCanDeck(d);
  const todo = list.filter(x => okDeck(x.deck)), noLang = list.length - todo.length;
  if (!todo.length) { toast('Give the deck two different languages (Deck settings) to translate its cards'); return; }
  let done = 0, got = 0, stop = false, err = '';
  const msg = () => `<p style="margin:0 0 8px">${stop || done >= todo.length ? `Translated <b>${got}</b> of ${todo.length} card${todo.length === 1 ? '' : 's'}.` : `Translating… <b>${done}</b> of ${todo.length}`}</p>
    <div class="seg-bar" style="height:8px;border-radius:5px;overflow:hidden;background:var(--surface2)"><i style="display:block;height:100%;width:${Math.round(done / todo.length * 100)}%;background:var(--good)"></i></div>
    <p class="muted small" style="margin:8px 0 0">${err ? esc(err) + ' ' : ''}${done >= todo.length || stop ? `${todo.length - got ? `${todo.length - got} card${todo.length - got === 1 ? ' was' : 's were'} left with an empty back to fill in yourself. ` : ''}${noLang ? `${noLang} card${noLang === 1 ? '' : 's'} skipped: their deck needs two different languages. ` : ''}You can change any translation in the card list.` : 'You can keep using Estudiamos. Closing this window stops translating.'}</p>`;
  openDialog({ title: '🌐 Translating your cards', ok: 'Done', body: msg(), onOk: () => {},
    onOpen: dlg => dlg.addEventListener('close', () => { stop = true; }, { once: true }) });
  const draw = () => { const b = $('#dlg .dlg-body'); if (b && $('#dlg').open) b.innerHTML = msg(); };
  for (const { c, deck } of todo) {
    if (stop) break;
    try {
      const r = await txSuggest(c.front, deck.frontLang, deck.backLang), t = r.list[0]?.ins;
      if (t && !String(c.back || '').trim()) { c.back = t; got++; }
    } catch (e) { err = txErrText(e); if (e?.message === 'limit') { done = todo.length; break; } }
    done++; draw(); if (done % 10 === 0) save();
    await new Promise(res => setTimeout(res, 250));   // be gentle with the free services
  }
  done = Math.max(done, stop ? done : todo.length); save(); draw();
  if (!$('#dlg').open) toast(`🌐 Translated ${got} card${got === 1 ? '' : 's'}`);
  render();
}

/* ---------- Export ---------- */
const ANKI_SCHEMA = `
CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null, ver integer not null, dty integer not null, usn integer not null, ls integer not null, conf text not null, models text not null, decks text not null, dconf text not null, tags text not null);
CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null, usn integer not null, tags text not null, flds text not null, sfld integer not null, csum integer not null, flags integer not null, data text not null);
CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null, mod integer not null, usn integer not null, type integer not null, queue integer not null, due integer not null, ivl integer not null, factor integer not null, reps integer not null, lapses integer not null, left integer not null, odue integer not null, odid integer not null, flags integer not null, data text not null);
CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null, ivl integer not null, lastIvl integer not null, factor integer not null, time integer not null, type integer not null);
CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);
CREATE INDEX ix_notes_usn on notes (usn); CREATE INDEX ix_cards_usn on cards (usn); CREATE INDEX ix_revlog_usn on revlog (usn);
CREATE INDEX ix_cards_nid on cards (nid); CREATE INDEX ix_cards_sched on cards (did, queue, due); CREATE INDEX ix_revlog_cid on revlog (cid); CREATE INDEX ix_notes_csum on notes (csum);`;
const ANKI_FIELDS = ['Front', 'Back', 'Notes', 'Example', 'Example translation'];
function ankiGuid() { const a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%&()*+,-./:;<=>?@[]^_`{|}~'; let s = ''; for (let i = 0; i < 10; i++) s += a[Math.floor(Math.random() * a.length)]; return s; }
async function fieldChecksum(text) {
  try { const h = new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text))); return ((h[0] << 24) | (h[1] << 16) | (h[2] << 8) | h[3]) >>> 0; }
  catch { return 0; }
}
const toHtml = s => esc(s).replace(/\n/g, '<br>');
function ankiDeckObj(id, name, now) {
  return { id, name, mod: now, usn: -1, lrnToday: [0, 0], revToday: [0, 0], newToday: [0, 0], timeToday: [0, 0], collapsed: false, browserCollapsed: false, desc: '', dyn: 0, conf: 1, extendNew: 0, extendRev: 0 };
}
function ankiCardSched(c, crt, withProgress, pos) {
  const blank = { type: 0, queue: 0, due: pos, ivl: 0, factor: 0, reps: 0, lapses: 0, left: 0 };
  if (!withProgress || c.state === 'new') return blank;
  const factor = Math.round((c.ease || 2.5) * 1000), common = { reps: c.reps || 0, lapses: c.lapses || 0 };
  if (c.state === 'review') return { ...common, type: 2, queue: 2, due: Math.max(0, Math.round((c.due - crt * 1000) / DAY)), ivl: c.interval || 1, factor, left: 0 };
  return { ...common, type: c.state === 'relearning' ? 3 : 1, queue: 1, due: Math.floor((c.due || Date.now()) / 1000), ivl: c.interval || 0, factor: c.state === 'relearning' ? factor : 0, left: 1001 };
}
async function buildAnkiPackage(decks, withProgress) {
  const SQL = await getSQL(), db = new SQL.Database();
  db.run(ANKI_SCHEMA);
  const nowMs = Date.now(), now = Math.floor(nowMs / 1000), crt = Math.floor(startOfDay(nowMs - 3650 * DAY) / 1000), mid = nowMs;
  const model = {
    id: mid, name: 'Estudiamos', type: 0, mod: now, usn: -1, sortf: 0, did: 1, tags: [], vers: [],
    flds: ANKI_FIELDS.map((name, ord) => ({ name, ord, sticky: false, rtl: false, font: 'Arial', size: 20, media: [], description: '' })),
    tmpls: [{ name: 'Card 1', ord: 0, qfmt: '{{Front}}', bqfmt: '', bafmt: '', did: null, bfont: '', bsize: 0,
      afmt: '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}{{#Example}}<br><br><i>{{Example}}</i>{{/Example}}{{#Example translation}}<br>{{Example translation}}{{/Example translation}}{{#Notes}}<br><br><small>{{Notes}}</small>{{/Notes}}' }],
    css: '.card {\n font-family: arial;\n font-size: 22px;\n text-align: center;\n color: black;\n background-color: white;\n}\n',
    latexPre: '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n',
    latexPost: '\\end{document}', latexsvg: false, req: [[0, 'any', [0]]],
  };
  const deckJson = { 1: ankiDeckObj(1, 'Default', now) }, dids = new Map();
  decks.forEach((d, i) => { const id = nowMs + 1 + i; dids.set(d.id, id); deckJson[id] = ankiDeckObj(id, d.name.replace(/ › /g, '::'), now); });
  const dconf = { 1: { id: 1, name: 'Default', mod: 0, usn: 0, maxTaken: 60, autoplay: true, timer: 0, replayq: true, dyn: false,
    new: { bury: false, delays: S.settings.learnSteps, initialFactor: 2500, ints: [1, 4, 0], order: 1, perDay: 20 },
    rev: { bury: false, ease4: 1.3, ivlFct: 1, maxIvl: 36500, perDay: 200, hardFactor: 1.2 },
    lapse: { delays: [10], leechAction: 1, leechFails: 8, minInt: 1, mult: 0 } } };
  const conf = { activeDecks: [1], curDeck: 1, newSpread: 0, collapseTime: 1200, timeLim: 0, estTimes: true, dueCounts: true, curModel: mid, nextPos: 1, sortType: 'noteFld', sortBackwards: false, addToCur: true };
  db.run('INSERT INTO col VALUES (1,?,?,?,11,0,0,0,?,?,?,?,?)', [crt, nowMs, nowMs, JSON.stringify(conf), JSON.stringify({ [mid]: model }), JSON.stringify(deckJson), JSON.stringify(dconf), '{}']);
  const insN = db.prepare('INSERT INTO notes VALUES (?,?,?,?,?,?,?,?,?,?,?)'), insC = db.prepare('INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
  // Pictures used by the exported cards become Anki media files
  const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'image/bmp': 'bmp', 'image/avif': 'avif' };
  const files = new Map();   // picture id -> { fn, blob }
  for (const d of decks) {
    const ids = usedMediaIds(cardsOf(d.id).map(c => ({ frontHtml: deckPics(d) ? c.frontHtml : '', backHtml: deckPics(d) ? c.backHtml : '' })));
    for (const mid of ids) if (!files.has(mid)) { const b = await getMedia(mid); if (b) files.set(mid, { fn: `${mid}.${EXT[b.type] || 'img'}`, blob: b }); }
  }
  const sideField = (c, side, d) => {
    const h = c[side + 'Html'] ? cleanHtml(c[side + 'Html'], { rich: deckRich(d), pictures: deckPics(d) }) : '';
    if (!h) return toHtml(c[side] || '');
    return h.replace(/<img data-mid="([\w-]+)" alt="">/g, (m, mid) => files.has(mid) ? `<img src="${files.get(mid).fn}">` : '');
  };
  let id = nowMs + 1000, pos = 1, count = 0;
  db.run('BEGIN');
  for (const d of decks) for (const c of cardsOf(d.id).sort((a, b) => a.created - b.created)) {
    const nid = id++, flds = [sideField(c, 'front', d), sideField(c, 'back', d), ...[c.notes, plainSent(c.example), c.exampleTr].map(x => toHtml(x || ''))].join('\x1f');
    insN.run([nid, ankiGuid(), mid, now, -1, '', flds, c.front, await fieldChecksum(c.front), 0, '']);
    const s = ankiCardSched(c, crt, withProgress, pos++);
    insC.run([nid, nid, dids.get(d.id), 0, now, -1, s.type, s.queue, s.due, s.ivl, s.factor, s.reps, s.lapses, s.left, 0, 0, 0, '']);
    count++;
  }
  db.run('COMMIT');
  insN.free(); insC.free();
  const bytes = db.export(); db.close();
  const entries = [{ name: 'collection.anki2', data: bytes }], index = {};
  let k = 0;
  for (const { fn, blob } of files.values()) { index[k] = fn; entries.push({ name: String(k), data: new Uint8Array(await blob.arrayBuffer()) }); k++; }
  entries.push({ name: 'media', data: new TextEncoder().encode(JSON.stringify(index)) });
  return { blob: makeZip(entries), count, pictures: files.size };
}
function csvCell(s) { s = String(s ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
function deckCsv(deck, extra, header) {
  const lines = cardsOf(deck.id).sort((a, b) => a.created - b.created).map(c => (extra ? [c.front, c.back, c.notes, plainSent(c.example), c.exampleTr] : [c.front, c.back]).map(csvCell).join(','));
  if (header) lines.unshift((extra ? ['Front', 'Back', 'Notes', 'Example', 'Example translation'] : ['Front', 'Back']).join(','));
  return '\ufeff' + lines.join('\r\n');
}
const safeName = s => String(s).replace(/[\\/:*?"<>|]/g, '_').slice(0, 80) || 'deck';
function saveBlob(name, blob) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
function exportDialog(deck) {
  const formats = deck
    ? [['apkg', 'Anki deck package (.apkg)', 'Opens in Anki, AnkiDroid and Noji'], ['csv', 'Spreadsheet (.csv)', 'Opens in Excel or Google Sheets; imports into most flashcard apps. Text only (no pictures or formatting).'], ['txt', 'Plain text (.txt)', 'Tab-separated, one card per line']]
    : [['colpkg', 'Anki collection (.colpkg)', 'All decks. In Anki this REPLACES the whole collection.'], ['apkg', 'Anki deck package (.apkg)', 'All decks, added alongside existing Anki decks; also for Noji']];
  openDialog({
    title: deck ? `Export “${deck.name}”` : 'Export all decks', ok: 'Export',
    body: `
      <div class="stack">${formats.map(([v, l, h], i) => `<label class="check"><input type="radio" name="fmt" value="${v}" ${i === 0 ? 'checked' : ''}><span><b>${l}</b><br><span class="muted small">${h}</span></span></label>`).join('')}</div>
      <label class="check"><input type="checkbox" name="progress" checked><span>Include study progress <span class="muted small">(Anki formats)</span></span></label>
      <label class="check"><input type="checkbox" name="extra" checked><span>Include notes and example sentences <span class="muted small">(CSV / text)</span></span></label>
      <label class="check"><input type="checkbox" name="header"><span>Add a header row <span class="muted small">(CSV)</span></span></label>`,
    onOk: f => {
      const fmt = f.fmt.value, decks = deck ? [deck] : S.decks.filter(d => cardsOf(d.id).length);
      const nameBase = deck ? safeName(deck.name) : `estudiar-${dateKey()}`;
      if (fmt === 'csv') { saveBlob(nameBase + '.csv', new Blob([deckCsv(deck, f.extra.checked, f.header.checked)], { type: 'text/csv' })); toast('Saved to Downloads'); return; }
      if (fmt === 'txt') {
        const q = s => /[\t\n"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        const lines = cardsOf(deck.id).map(c => (f.extra.checked ? [c.front, c.back, c.notes, plainSent(c.example), c.exampleTr] : [c.front, c.back]).map(x => q(x || '')).join('\t'));
        saveBlob(nameBase + '.txt', new Blob([lines.join('\n')], { type: 'text/plain' })); toast('Saved to Downloads'); return;
      }
      const withProgress = f.progress.checked;
      toast('Building Anki file…');
      buildAnkiPackage(decks, withProgress).then(({ blob, count, pictures }) => {
        saveBlob(`${nameBase}.${fmt}`, blob); toast(`Exported ${count} cards${pictures ? ` and ${pictures} picture${pictures === 1 ? '' : 's'}` : ''} to Downloads`);
      }).catch(e => { console.error(e); toast('Export failed: ' + e.message); });
    },
  });
}

Object.assign(actions, {
  importFile: () => pickBinaryFile('.apkg,.colpkg,.ofc,.csv,.tsv,.txt,.json', f => importFile(f)),
  importFileInto: el => pickBinaryFile('.apkg,.colpkg,.ofc,.csv,.tsv,.txt', f => importFile(f, deckById(el.dataset.id))),
  exportDialog: el => exportDialog(el.dataset.id ? deckById(el.dataset.id) : null),
});

/* ---------- Drag a file onto the page to import it ----------
   Home page: drop an Anki (.apkg / .colpkg), Noji (.ofc), CSV or text file to import it (same as "Import file…").
   A deck's page: the cards go into that deck (same as its Import button). Pictures dropped into a card editor still work as before.
   Anywhere else a dropped file is ignored, so the browser doesn't open it in place of the app. */
(() => {
  const OK = /\.(apkg|colpkg|ofc|csv|tsv|txt|json)$/i;
  let depth = 0;
  const hasFiles = e => [...(e.dataTransfer?.types || [])].includes('Files');
  const target = () => view?.name === 'home' ? 'home' : view?.name === 'deck' && deckById(view.deckId) ? 'deck' : null;
  const overEditor = e => !!e.target.closest?.('.ed-area, .ed-tools, dialog');
  function show(on) {
    let o = document.getElementById('dropImport');
    if (!on) { o?.remove(); return; }
    if (o) return;
    const d = target() === 'deck' ? deckById(view.deckId) : null;
    o = document.createElement('div'); o.id = 'dropImport';
    o.innerHTML = `<div class="di-box"><div class="di-ico">📥</div><b>Drop to import${d ? ` into “${esc(d.name)}”` : ''}</b><div class="muted small">Anki .apkg / .colpkg, Noji .ofc, CSV or text</div></div>`;
    document.body.append(o);
  }
  document.addEventListener('dragenter', e => { if (!hasFiles(e) || overEditor(e) || !target()) return; e.preventDefault(); depth++; show(true); });
  document.addEventListener('dragover', e => {
    if (!hasFiles(e) || overEditor(e)) return;
    e.preventDefault(); e.dataTransfer.dropEffect = target() ? 'copy' : 'none';
  });
  document.addEventListener('dragleave', e => { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) show(false); });
  document.addEventListener('drop', e => {
    if (!hasFiles(e) || overEditor(e)) return;
    e.preventDefault(); depth = 0; show(false);
    const where = target(); if (!where) return;
    const files = [...e.dataTransfer.files], f = files.find(x => OK.test(x.name));
    if (!f) { toast('That kind of file can’t be imported. Use an Anki .apkg / .colpkg, Noji .ofc, CSV or text file.'); return; }
    if (files.length > 1) toast(`Importing “${f.name}” (one file at a time)`);
    if (where === 'deck' && /\.json$/i.test(f.name)) { toast('Backups (.json) are restored from the home page or Settings'); return; }
    importFile(f, where === 'deck' ? deckById(view.deckId) : undefined);
  });
})();
