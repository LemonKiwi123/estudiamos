'use strict';
/* ================= Storage: IndexedDB for cards + pictures (localStorage keeps a small safety copy) ================= */
let idb = null; window.idbReady = false;
const mediaURL = new Map();   // picture id -> object URL
function idbOpen() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('studycards', 1);
    r.onupgradeneeded = () => { const db = r.result; db.createObjectStore('kv'); db.createObjectStore('media'); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
function idbDo(store, mode, fn) {
  return new Promise((res, rej) => {
    const tx = idb.transaction(store, mode), req = fn(tx.objectStore(store));
    tx.oncomplete = () => res(req?.result); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('Storage write aborted'));
  });
}
let idbTimer = null;
function idbSaveState() { if (!idb) return; clearTimeout(idbTimer); idbTimer = setTimeout(writeState, 50); }
function writeState() {
  idbTimer = null; if (!idb || !window.currentProfileId) return;
  idbDo('kv', 'readwrite', st => st.put(S, 'state:' + currentProfileId)).catch(e => toast('Could not save: ' + e.message));
}
window.addEventListener('pagehide', () => { if (idbTimer) { clearTimeout(idbTimer); writeState(); } });

async function boot() {
  try {
    idb = await idbOpen();
    const keys = await idbDo('media', 'readonly', st => st.getAllKeys());
    const blobs = await idbDo('media', 'readonly', st => st.getAll());
    keys.forEach((k, i) => mediaURL.set(k, URL.createObjectURL(blobs[i])));
    window.idbReady = true;
    if (typeof syncBoot === 'function') await syncBoot();   // phone & PC sync (sync.js)
    await profilesBoot();
    gcMedia();
  } catch (e) { console.error(e); toast('Browser storage could not be opened. Pictures and profiles are unavailable.'); }
  render();
  if (profiles.setup && currentProfileId) profileDialog(currentProfile(), { setup: true });
  if (typeof tourMaybe === 'function') tourMaybe();   // welcome tour for new users (tour.js)
  if (typeof updBoot === 'function') updBoot();       // new version available? (updates.js)
  if (typeof syncAfterBoot === 'function') syncAfterBoot();
}
async function putMedia(blob) {
  if (!idb) throw new Error('Storage unavailable');
  const id = 'm' + uid();
  await idbDo('media', 'readwrite', st => st.put(blob, id));
  mediaURL.set(id, URL.createObjectURL(blob));
  return id;
}
const getMedia = id => idb ? idbDo('media', 'readonly', st => st.get(id)) : Promise.resolve(null);
function usedMediaIds(cards = S.cards) {
  const ids = new Set();
  for (const c of cards) for (const h of [c.frontHtml, c.backHtml]) if (h) for (const m of h.matchAll(/data-mid="([\w-]+)"/g)) ids.add(m[1]);
  return ids;
}
async function gcMedia() {
  // A picture may belong to any profile, so look through every profile's cards before deleting.
  const all = await idbDo('kv', 'readonly', st => st.getAll());
  const used = usedMediaIds([...S.cards, ...all.filter(x => x && Array.isArray(x.cards)).flatMap(x => x.cards)]);
  const unused = [...mediaURL.keys()].filter(k => !used.has(k) && !k.startsWith('avatar:') && !k.startsWith('bg:'));
  if (!unused.length) return;
  await idbDo('media', 'readwrite', st => { unused.forEach(k => st.delete(k)); });
  unused.forEach(k => { URL.revokeObjectURL(mediaURL.get(k)); mediaURL.delete(k); });
}
function clearAllMedia() { gcMedia(); }   // "Erase everything" empties this profile; pictures no profile uses are removed
const blobToDataURL = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
async function mediaForBackup() {
  const out = {};
  for (const id of usedMediaIds()) { const b = await getMedia(id); if (b) out[id] = await blobToDataURL(b); }
  return out;
}
async function restoreMedia(map) {
  for (const [id, url] of Object.entries(map || {})) {
    if (!/^[\w-]+$/.test(id) || !/^data:image\//.test(url)) continue;
    const b = await (await fetch(url)).blob();
    await idbDo('media', 'readwrite', st => st.put(b, id));
    mediaURL.set(id, URL.createObjectURL(b));
  }
}

/* ================= Safe HTML for card sides ================= */
const KEEP_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SPAN', 'FONT', 'SUB', 'SUP', 'MARK', 'UL', 'OL', 'LI']);
const BLOCK_TAGS = new Set(['DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TR', 'BLOCKQUOTE']);
const STYLE_PROPS = ['color', 'background-color', 'font-family', 'font-size', 'font-weight', 'font-style', 'text-decoration-line'];
const FONT_SIZES = ['x-small', 'small', 'medium', 'large', 'x-large', 'xx-large', 'xxx-large'];
const REL_SIZE = { 'x-small': '0.6em', small: '0.8em', medium: '1em', large: '1.25em', 'x-large': '1.5em', 'xx-large': '2em', 'xxx-large': '2.6em' };
function cleanHtml(html, { rich = true, pictures = true } = {}) {
  const doc = new DOMParser().parseFromString('<body>' + String(html || '') + '</body>', 'text/html');
  const walk = node => {
    let s = '';
    for (const n of node.childNodes) {
      if (n.nodeType === 3) { s += esc(n.nodeValue.replace(/\s*\n\s*/g, ' ')); continue; }
      if (n.nodeType !== 1) continue;
      const t = n.tagName;
      if (t === 'IMG') { const id = n.getAttribute('data-mid'); if (pictures && id && /^[\w-]+$/.test(id)) s += `<img data-mid="${id}" alt="">`; continue; }
      if (t === 'BR') { s += '<br>'; continue; }
      if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'svg', 'SVG', 'TEMPLATE', 'HEAD', 'TITLE', 'META', 'LINK'].includes(t)) continue;
      const inner = walk(n);
      const block = BLOCK_TAGS.has(t) && !(rich && (t === 'LI'));
      if (!rich || !KEEP_TAGS.has(t)) {
        if (block && inner) s += (s && !s.endsWith('<br>') ? '<br>' : '') + inner;
        else s += inner;
        continue;
      }
      let tag = t.toLowerCase();
      const st = [];
      for (const p of STYLE_PROPS) {
        let v = n.style.getPropertyValue(p);
        if (p === 'font-size' && REL_SIZE[v]) v = REL_SIZE[v];   // keyword sizes -> relative, so they scale with the card
        if (v && /^[#\w\s,.%()'"-]+$/.test(v) && !/url|expression/i.test(v)) st.push(`${p}:${v.replace(/"/g, "'")}`);
      }
      if (tag === 'font' || tag === 'mark' || tag === 'strike') {
        if (tag === 'font') {
          const c = n.getAttribute('color'); if (c && /^#?\w+$/.test(c)) st.push('color:' + c);
          const f = n.getAttribute('face'); if (f && /^[\w\s,'-]+$/.test(f)) st.push('font-family:' + f.replace(/"/g, "'"));
          const z = n.getAttribute('size'); if (z && /^[1-7]$/.test(z)) st.push('font-size:' + REL_SIZE[FONT_SIZES[z - 1]]);
        }
        if (tag === 'mark') st.push('background-color:#fff176');
        if (tag === 'strike') st.push('text-decoration-line:line-through');
        tag = 'span';
      }
      if (tag === 'span' && !st.length) { s += inner; continue; }
      if (!inner && tag !== 'li') continue;
      s += `<${tag}${st.length ? ` style="${esc(st.join(';'))}"` : ''}>${inner}</${tag}>`;
    }
    return s;
  };
  return walk(doc.body).replace(/^(<br>)+|(<br>)+$/g, '').trim();
}
const isPlainHtml = h => !/<(?!br>)/i.test(h);
const hasContent = f => !!(f.text || /<img /.test(f.html));
const withMedia = h => h.replace(/<img data-mid="([\w-]+)"/g, (m, id) => `<img data-mid="${id}" src="${mediaURL.get(id) || ''}"`);
const deckRich = d => d?.rich !== false, deckPics = d => d?.pictures !== false;
/* Display HTML for one side of a card, honouring the deck's formatting / pictures switches. */
function sideHtml(card, side, deck) {
  const h = card[side + 'Html'];
  if (h && (deckRich(deck) || deckPics(deck))) {
    const c = cleanHtml(h, { rich: deckRich(deck), pictures: deckPics(deck) });
    if (c) return withMedia(c);
  }
  return esc(card[side] || '').replace(/\n/g, '<br>');
}

/* ================= Per-deck speech ================= */
function currentDeckId() {
  const n = view.name;
  if (n === 'study') return study?.deckId;
  if (n === 'quiz' || n === 'quizResults') return quiz?.deckId;
  if (n === 'game' || n === 'gameResults') return game?.deckId;
  if (n === 'runner') return run?.deckId;
  if (n === 'tower') return tower?.deckId;
  if (n === 'millionaire') return pm?.deckId;
  if (n === 'priceParty') return pp?.deckId;
  if (n === 'spinSpell') return ss?.deckId;
  if (n === 'wordTown') return wt?.q?.card?.deckId || wt?.deckId;
  if (n === 'trails') return tr?.deckId;
  if (n === 'saga') return sg?.deckId;
  if (n === 'showdown') return sd?.q?.card?.deckId || sd?.deckId;
  return view.deckId || null;
}
const ttsDeck = () => deckById(currentDeckId());
const ttsOn = (d = ttsDeck()) => !d || d.tts !== false;
const autoplayOn = (d = ttsDeck()) => ttsOn(d) && (d?.autoplay ?? S.settings.autoplay);
function speakWith(text, lang, voiceURI, rate) {
  if (!text || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text), list = voicesFor(lang);
  const v = list.find(x => x.voiceURI === voiceURI) || pickVoice(lang);
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = lang;
  u.rate = rate; setTimeout(() => speechSynthesis.speak(u), 40);
}
const SAMPLE_SAY = { en: 'Hello! This is how I sound.', es: '¡Hola! Así es como sueno.', fr: 'Bonjour ! Voici ma voix.', de: 'Hallo! So klinge ich.', it: 'Ciao! Questa è la mia voce.', pt: 'Olá! Esta é a minha voz.', ja: 'こんにちは。これが私の声です。', ko: '안녕하세요. 제 목소리입니다.', zh: '你好！这是我的声音。', ru: 'Привет! Вот так звучит мой голос.' };

function deckFeatureFields(d) {
  const chk = (name, on, label, hint) => `<label class="check"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><span><b>${label}</b>${hint ? `<br><span class="muted small">${hint}</span>` : ''}</span></label>`;
  const rates = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.5];
  return `
    <div class="grid2">
      <div class="feat"><h4>Card features</h4>
        ${chk('rich', deckRich(d), 'Formatting toolbar', 'Bold, italic, underline, colors, highlight, fonts and sizes')}
        ${chk('pictures', deckPics(d), 'Pictures', 'Add pictures from a file, by pasting, or by dragging them in')}
        ${chk('autoEx', !!d.autoExamples, 'Example sentences for the whole deck', 'Every card without a sentence (and every new card) gets a real sentence + translation from Tatoeba, ready for “Finish the sentence”. Needs internet; only the word is sent. You can still type or edit sentences yourself.')}
        ${chk('posTags', !!d.posTags, 'Word labels (part of speech)', 'A little label like “noun” or “verb” on each card side with one or two words. Looked up on Wiktionary; needs internet and only the word is sent. You can also turn it on or off for just some cards from the selection bar.')}
        <label class="field" style="margin-top:6px">Label which side<select name="posSide">${Object.entries({ front: 'Front', back: 'Back', both: 'Both sides' }).map(([k, l]) => `<option value="${k}" ${(d.posSide || 'front') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      </div>
      <div class="feat"><h4>Speech</h4>
        ${chk('tts', d.tts !== false, 'Read cards aloud', 'Speaker buttons, auto-play and the listening games')}
        <div id="ttsOpts" style="margin-top:10px">
          <div class="grid2">
            <label class="field">Auto-play<select name="autoplay">
              <option value="" ${d.autoplay == null ? 'selected' : ''}>App setting (${S.settings.autoplay ? 'on' : 'off'})</option>
              <option value="on" ${d.autoplay === true ? 'selected' : ''}>On</option>
              <option value="off" ${d.autoplay === false ? 'selected' : ''}>Off</option></select></label>
            <label class="field">Speed<select name="rate">
              <option value="" ${d.rate == null ? 'selected' : ''}>App setting (${S.settings.rate.toFixed(2)}×)</option>
              ${rates.map(r => `<option value="${r}" ${d.rate === r ? 'selected' : ''}>${r.toFixed(1)}×${r === 1 ? ' (normal)' : ''}</option>`).join('')}</select></label>
          </div>
          <div id="deckVoices"></div>
        </div>
      </div>
    </div>`;
}
function deckVoiceRows(f, d) {
  const langs = [...new Set([f.frontLang.value, f.backLang.value].filter(Boolean))];
  if (!langs.length) return '<p class="muted small" style="margin:8px 0 0">Pick a front or back language to choose voices.</p>';
  return langs.map(l => {
    const list = voicesFor(l), own = d.voices?.[l], def = pickVoice(l);
    return `<label class="field" style="margin-top:10px">${esc(langName(l))} voice
      <div class="row" style="flex-wrap:nowrap;gap:6px;margin-top:5px">
        <select name="voice:${esc(l)}" class="inp" style="margin:0" ${list.length ? '' : 'disabled'}>
          <option value="">App default${def ? ` (${esc(def.name.replace(/^Microsoft /, ''))})` : ''}</option>
          ${list.map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === own ? 'selected' : ''}>${esc(v.name.replace(/^Microsoft /, ''))}</option>`).join('')}
        </select>
        <button type="button" class="icon-btn speak" data-act="testDeckVoice" data-lang="${esc(l)}" title="Test this voice">${ICON.speak}</button>
      </div>${list.length ? '' : '<span class="muted small">No voice for this language on this PC</span>'}</label>`;
  }).join('');
}
function wireDeckFeatureFields(f, d) {
  const upd = () => { const keep = {}; f.querySelectorAll('[name^="voice:"]').forEach(s => { keep[s.name.slice(6)] = s.value; });
    $('#deckVoices').innerHTML = deckVoiceRows(f, { ...d, voices: { ...(d.voices || {}), ...keep } }); };
  const tog = () => { $('#ttsOpts').style.opacity = f.tts.checked ? 1 : 0.45; $('#ttsOpts').querySelectorAll('select,button').forEach(x => { x.disabled = !f.tts.checked; }); };
  f.frontLang.addEventListener('change', upd); f.backLang.addEventListener('change', upd); f.tts.addEventListener('change', tog);
  upd(); tog();
}
function readDeckFeatures(f) {
  const voices = {};
  f.querySelectorAll('[name^="voice:"]').forEach(s => { if (s.value) voices[s.name.slice(6)] = s.value; });
  return {
    rich: f.rich.checked, pictures: f.pictures.checked, tts: f.tts.checked, autoExamples: !!f.autoEx?.checked, posTags: !!f.posTags?.checked, posSide: f.posSide?.value || 'front',
    autoplay: f.autoplay.value === '' ? null : f.autoplay.value === 'on',
    rate: f.rate.value === '' ? null : +f.rate.value,
    voices,
  };
}

/* ================= Editor (toolbar + pictures) ================= */
const EDITOR_FONTS = [['', 'Font'], ['Segoe UI', 'Segoe UI'], ['Arial', 'Arial'], ['Verdana', 'Verdana'], ['Georgia', 'Georgia'], ['Times New Roman', 'Times New Roman'],
  ['Courier New', 'Courier New'], ['Comic Sans MS', 'Comic Sans'], ['Segoe Print', 'Segoe Print'], ['Yu Gothic', 'Yu Gothic (日本語)'], ['Microsoft YaHei', 'Microsoft YaHei (中文)'], ['Malgun Gothic', 'Malgun Gothic (한국어)']];
const EDITOR_SIZES = [['', 'Size'], ['2', 'Small'], ['3', 'Normal'], ['4', 'Medium'], ['5', 'Large'], ['6', 'Extra large'], ['7', 'Huge']];
function editorHtml(id, deck, { html = '', text = '', lang = '', placeholder = '' } = {}) {
  const rich = deckRich(deck), pics = deckPics(deck), canSpeak = lang && ttsOn(deck);
  if (!rich && !pics) {
    return `<div class="inp-wrap" style="margin-top:5px"><textarea id="${id}" rows="2" placeholder="${esc(placeholder)}" lang="${esc(lang)}">${esc(text)}</textarea><button type="button" class="icon-btn scan-btn" data-act="edScan" data-ed="${id}" title="Scan text from a photo">📷</button>${typeof txCanDeck === 'function' && lang && txCanDeck(deck) ? `<button type="button" class="icon-btn scan-btn" data-act="edTranslate" data-ed="${id}" title="Translate into the other side">🌐</button>` : ''}${canSpeak ? `<button type="button" class="icon-btn speak" data-act="speakField" data-field="${id}" data-lang="${esc(lang)}" title="Hear it">${ICON.speak}</button>` : ''}</div>`;
  }
  const tb = (cmd, label, title) => `<button type="button" class="tool" data-act="fmt" data-ed="${id}" data-cmd="${cmd}" title="${title}">${label}</button>`;
  const tools = [];
  if (rich) tools.push(
    tb('bold', '<b>B</b>', 'Bold (Ctrl+B)'), tb('italic', '<i>I</i>', 'Italic (Ctrl+I)'), tb('underline', '<u>U</u>', 'Underline (Ctrl+U)'), tb('strikeThrough', '<s>S</s>', 'Strikethrough'),
    `<button type="button" class="tool" data-act="palette" data-ed="${id}" data-cmd="foreColor" title="Text color"><span style="border-bottom:3px solid #cf6b6b;line-height:1.1">A</span><span class="caret">▾</span></button>`,
    `<button type="button" class="tool" data-act="palette" data-ed="${id}" data-cmd="hiliteColor" title="Highlight"><span class="hl">ab</span><span class="caret">▾</span></button>`,
    `<select class="tool-sel" data-ed="${id}" data-cmd="fontName" title="Font">${EDITOR_FONTS.map(([v, l]) => `<option value="${v}"${v ? ` style="font-family:'${v}'"` : ''}>${l}</option>`).join('')}</select>`,
    `<select class="tool-sel" data-ed="${id}" data-cmd="fontSize" title="Text size">${EDITOR_SIZES.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>`,
    `<button type="button" class="tool dock-only" data-act="edMenu" data-ed="${id}" data-cmd="fontName" title="Font">Font<span class="caret">▾</span></button>`,
    `<button type="button" class="tool dock-only" data-act="edMenu" data-ed="${id}" data-cmd="fontSize" title="Text size">Size<span class="caret">▾</span></button>`,
    tb('removeFormat', 'Tx', 'Clear formatting').replace('class="tool"', 'class="tool clear"'));
  if (pics) tools.push(`<button type="button" class="tool" data-act="edPic" data-ed="${id}" title="Add a picture (you can also paste or drag one in)">🖼️</button>`);
  if (pics) tools.push(`<button type="button" class="tool" data-act="edWebPic" data-ed="${id}" title="Find a free picture online (Creative Commons)">🔎</button>`);
  tools.push(`<button type="button" class="tool" data-act="edScan" data-ed="${id}" title="Scan text from a photo">📷</button>`);
  if (typeof txCanDeck === 'function' && lang && txCanDeck(deck)) tools.push(`<button type="button" class="tool" data-act="edTranslate" data-ed="${id}" title="Translate into the other side">🌐</button>`);
  if (canSpeak) tools.push(`<span class="tool-sp"></span><button type="button" class="tool" data-act="speakField" data-field="${id}" data-lang="${esc(lang)}" title="Hear it">${ICON.speak}</button>`);
  return `<div class="editor"><div class="ed-tools">${tools.join('')}</div><div class="ed-area" id="${id}" contenteditable="true" role="textbox" aria-multiline="true"
    data-rich="${rich ? 1 : 0}" data-pics="${pics ? 1 : 0}" data-placeholder="${esc(placeholder)}" lang="${esc(lang)}">${html}</div></div>`;
}
function readEditor(id) {
  const el = document.getElementById(id); if (!el) return { text: '', html: '' };
  if (!el.isContentEditable) return { text: el.value.trim(), html: '' };
  const html = cleanHtml(el.innerHTML, { rich: el.dataset.rich === '1', pictures: el.dataset.pics === '1' });
  return { text: htmlToText(html), html: isPlainHtml(html) ? '' : html };
}
function clearEditor(id) { const el = document.getElementById(id); if (!el) return; if (el.isContentEditable) el.innerHTML = ''; else el.value = ''; }

let edRange = null, edId = null;
document.addEventListener('selectionchange', () => {
  const sel = getSelection(); if (!sel.rangeCount) return;
  const r = sel.getRangeAt(0), n = r.commonAncestorContainer, el = (n.nodeType === 1 ? n : n.parentElement)?.closest('.ed-area');
  if (!el) return;
  if (r.collapsed && edRange && edId === el.id && !edRange.collapsed && document.activeElement !== el) return;
  edRange = r.cloneRange(); edId = el.id;
});
function restoreRange(id) {
  const el = document.getElementById(id); if (!el) return;
  el.focus();
  const s = getSelection(); s.removeAllRanges();
  if (edRange && edId === id && el.contains(edRange.commonAncestorContainer)) s.addRange(edRange);
  else { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); s.addRange(r); }
}
function applyFormat(id, cmd, val) {
  restoreRange(id);
  document.execCommand('styleWithCSS', false, true);
  document.execCommand(cmd, false, val ?? null);
}
document.addEventListener('mousedown', e => { if (e.target.closest('.ed-tools button, .palette button')) e.preventDefault(); });
document.addEventListener('pointerdown', e => { if (e.target.closest('.ed-tools button, .palette button')) e.preventDefault(); });
document.addEventListener('input', e => { const t = e.target; if (t.matches?.('.ed-tools input[type=color]')) applyFormat(t.dataset.ed, t.dataset.cmd, t.value); });
document.addEventListener('change', e => {
  const t = e.target;
  if (t.matches?.('.ed-tools select')) { if (t.value) applyFormat(t.dataset.ed, t.dataset.cmd, t.value); t.value = ''; }
});
async function shrinkImage(file, max = 1400) {
  if (file.type === 'image/gif' && file.size < 3e6) return file;              // keep animated GIFs
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  if (k === 1 && file.size < 500000 && /^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(r, 'image/webp', 0.88));
}
async function insertPicture(id, file) {
  try {
    const mid = await putMedia(await shrinkImage(file));
    restoreRange(id);
    document.execCommand('insertHTML', false, `<img data-mid="${mid}" src="${mediaURL.get(mid)}" alt="">`);
  } catch (e) { console.error(e); toast('Could not add that picture'); }
}
document.addEventListener('paste', e => {
  const ed = e.target.closest?.('.ed-area'); if (!ed) return;
  e.preventDefault();
  const files = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'));
  if (files.length) { if (ed.dataset.pics === '1') files.forEach(f => insertPicture(ed.id, f)); else toast('Pictures are turned off for this deck'); return; }
  const h = e.clipboardData.getData('text/html');
  if (h && ed.dataset.rich === '1') { const c = cleanHtml(h, { rich: true, pictures: false }); if (c) { document.execCommand('insertHTML', false, c); return; } }
  document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
});
document.addEventListener('dragover', e => { if (e.target.closest?.('.ed-area')) e.preventDefault(); });
document.addEventListener('drop', e => {
  const ed = e.target.closest?.('.ed-area'); if (!ed) return;
  const files = [...(e.dataTransfer?.files || [])].filter(f => f.type.startsWith('image/'));
  if (!files.length) return;
  e.preventDefault();
  if (ed.dataset.pics !== '1') { toast('Pictures are turned off for this deck'); return; }
  const r = document.caretRangeFromPoint?.(e.clientX, e.clientY);
  if (r && ed.contains(r.startContainer)) { edRange = r; edId = ed.id; }
  files.forEach(f => insertPicture(ed.id, f));
});

Object.assign(actions, {
  fmt: el => applyFormat(el.dataset.ed, el.dataset.cmd),
  edPic: el => pickBinaryFile('image/*', f => insertPicture(el.dataset.ed, f)),
  testDeckVoice: el => {
    const f = el.closest('form'), l = el.dataset.lang, sel = f.querySelector(`[name="voice:${CSS.escape(l)}"]`);
    const rate = f.rate.value ? +f.rate.value : S.settings.rate;
    speakWith(SAMPLE_SAY[l.split('-')[0]] || langName(l), l, sel?.value, rate);
  },
});

/* ---------- Color palettes for highlight and text color ---------- */
const HILITE_COLORS = [['#fff176', 'Yellow'], ['#b9f6ca', 'Green'], ['#b3e5fc', 'Blue'], ['#f8bbd0', 'Pink'], ['#ffcc80', 'Orange'], ['#e1bee7', 'Purple'], ['#ff8a80', 'Red'], ['#cfd8dc', 'Gray']];
const TEXT_COLORS = [['#3a3936', 'Black'], ['#85817a', 'Gray'], ['#cf6b6b', 'Red'], ['#dd8a48', 'Orange'], ['#c4a23e', 'Gold'], ['#4c9a74', 'Green'], ['#5288c4', 'Blue'], ['#6473d2', 'Indigo'], ['#9468ab', 'Purple'], ['#cc6898', 'Pink'], ['#97714f', 'Brown'], ['#409d8c', 'Teal']];   // softer shades, still easy to read
let palRange = null;
/* the full palette: a row of grays, a row of main colors, then three lighter and three darker shades of each (like a
   word processor's color picker), plus your own custom colors */
const palHex = (h, s, l) => { s /= 100; l /= 100; const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))).toString(16).padStart(2, '0'); return '#' + f(0) + f(8) + f(4); };
const PAL_HUES = [[355, 'Berry'], [4, 'Red'], [28, 'Orange'], [48, 'Yellow'], [135, 'Green'], [185, 'Cyan'], [213, 'Sky blue'], [228, 'Blue'], [272, 'Purple'], [318, 'Magenta']];
const PAL_GRID = (() => {
  const grays = [['#000000', 'Black'], ['#3d3d3d', 'Dark gray 4'], ['#5e5e5e', 'Dark gray 3'], ['#8a8a8a', 'Dark gray 2'], ['#ababab', 'Dark gray 1'], ['#c6c6c6', 'Gray'], ['#d8d8d8', 'Light gray 1'], ['#e8e8e8', 'Light gray 2'], ['#f3f3f3', 'Light gray 3'], ['#ffffff', 'White']];
  const main = PAL_HUES.map(([h, n], i) => [palHex(h, i ? 66 : 58, i ? (h === 48 ? 56 : 54) : 40), n]);
  const shade = (l, s, w) => PAL_HUES.map(([h, n]) => [palHex(h, s, l), `${n} (${w})`]);
  return [grays, main, shade(91, 70, 'lightest'), shade(82, 66, 'lighter'), shade(70, 62, 'light'), shade(40, 58, 'dark'), shade(30, 60, 'darker'), shade(20, 62, 'darkest')];
})();
const palCustom = () => (S.settings.palCustom ||= []);
function palAddCustom(c) { const l = palCustom(), i = l.indexOf(c); if (i >= 0) l.splice(i, 1); l.unshift(c); l.length = Math.min(l.length, 10); save(); }
const palSw = (c, n) => `<button type="button" class="pal-sw" style="background:${c}" title="${esc(n)}" aria-label="${esc(n)}" data-color="${c}"></button>`;
const palPlus = () => `<label class="pal-add" title="Pick a custom color" aria-label="Pick a custom color">＋<input type="color" data-pal-custom></label>`;
/* the same palette as a form field (radio buttons), for things like a folder's color */
function palFieldHtml(name, current) {
  const cur = (current || '').toLowerCase(), all = PAL_GRID.flat().map(([c]) => c);
  const custom = [...(all.includes(cur) || !/^#[0-9a-f]{6}$/.test(cur) ? [] : [cur]), ...palCustom().filter(c => c !== cur)].slice(0, 10);
  const sw = (c, n) => `<label class="pal-sw pal-pick" style="background:${c}" title="${esc(n)}"><input type="radio" name="${name}" value="${c}" ${c === cur ? 'checked' : ''} aria-label="${esc(n)}"></label>`;
  return `<div class="pal-field" data-pal-field="${name}">${PAL_GRID.map((row, r) => `<div class="pal-grid10${r === 1 ? ' main' : ''}">${row.map(([c, n]) => sw(c, n)).join('')}</div>`).join('')}
    <div class="pal-sub">Custom</div><div class="pal-grid10 pal-cust">${custom.map(c => sw(c, 'Custom ' + c)).join('')}${palPlus()}</div></div>`;
}
document.addEventListener('change', e => {
  const i = e.target.closest?.('.pal-field [data-pal-custom]'); if (!i) return;
  const box = i.closest('.pal-field'), name = box.dataset.palField, c = i.value.toLowerCase(); palAddCustom(c);
  let r = [...box.querySelectorAll('input[type=radio]')].find(x => x.value === c);
  if (!r) { const l = document.createElement('label'); l.className = 'pal-sw pal-pick'; l.style.background = c; l.title = 'Custom ' + c; l.innerHTML = `<input type="radio" name="${name}" value="${c}" aria-label="Custom ${c}">`; box.querySelector('.pal-cust').prepend(l); r = l.querySelector('input'); }
  r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true }));
});
function openPalette(btn) {
  closePalette();
  palRange = edRange && edId === btn.dataset.ed ? edRange.cloneRange() : null;   // remember the selected text now
  const id = btn.dataset.ed, cmd = btn.dataset.cmd, hl = cmd === 'hiliteColor', list = hl ? HILITE_COLORS : TEXT_COLORS;
  const m = document.createElement('div'); m.className = 'palette pal-big'; m.id = 'palette';
  const custom = palCustom().map(c => palSw(c, 'Custom ' + c)).join('');
  m.innerHTML = `<div class="pal-title">${hl ? 'Highlight color' : 'Text color'}</div>
    <button type="button" class="pal-none" data-color="${hl ? 'transparent' : 'reset'}">${hl ? '⌫ No highlight' : '↺ Default color'}</button>
    ${PAL_GRID.map((row, r) => `<div class="pal-grid10${r === 1 ? ' main' : ''}">${row.map(([c, n]) => palSw(c, n)).join('')}</div>`).join('')}
    <div class="pal-sub">Custom</div><div class="pal-grid10">${custom}${palPlus()}</div>`;
  if (btn.closest('.ed-tools.docked')) {
    m.className = `palette pal-strip ${hl ? 'hl' : 'text'}`;
    m.innerHTML = `<button type="button" class="pal-off" data-color="${hl ? 'transparent' : 'reset'}" title="${hl ? 'No highlight' : 'Default color'}" aria-label="${hl ? 'No highlight' : 'Default color'}"></button><span class="pal-div"></span>`
      + palPlus() + custom + list.map(([c, n]) => palSw(c, n)).join('') + '<span class="pal-div"></span>' + PAL_GRID.slice(1).flat().map(([c, n]) => palSw(c, n)).join('');
  }
  (btn.closest('dialog[open]') || document.body).appendChild(m);
  palShow(m, btn);
  const use = c => {
    if (palRange) { edRange = palRange; edId = id; }
    if (c === 'reset') applyFormat(id, 'foreColor', getComputedStyle(document.getElementById(id)).color);
    else applyFormat(id, cmd, c);
    btn.querySelector(hl ? '.hl' : 'span').style[hl ? 'background' : 'borderBottomColor'] = c === 'transparent' || c === 'reset' ? '' : c;
    closePalette();
  };
  m.addEventListener('click', e => { const b = e.target.closest('[data-color]'); if (b) use(b.dataset.color); });
  m.querySelector('[data-pal-custom]').addEventListener('change', e => { const c = e.target.value; palAddCustom(c); use(c); });
}
function closePalette() { $('#palette')?.remove(); document.querySelectorAll('.ed-tools .tool.on').forEach(b => b.classList.remove('on')); }
/* a strip sits across the screen right on top of the docked toolbar; anything else pops up next to its button */
function palShow(m, btn) {
  m._btn = btn;
  if (!m.classList.contains('pal-strip')) return palPlace(m, btn);
  btn.classList.add('on'); palStripPlace(m);
}
function palStripPlace(m) {
  const bar = m._btn?.closest('.ed-tools'); if (!bar?.isConnected) return closePalette();
  const vv = window.visualViewport;
  m.style.width = (vv?.width || innerWidth) + 'px'; m.style.left = (vv?.offsetLeft || 0) + 'px';
  m.style.top = (parseFloat(bar.style.top) - m.offsetHeight) + 'px';   // straight on top of the toolbar
}
/* put a pop-up next to its button: below it, or above it when there is no room or the toolbar sits on the keyboard */
function palPlace(m, btn) {
  const r = btn.getBoundingClientRect(), vv = window.visualViewport, vw = vv?.width || innerWidth, vh = vv?.height || innerHeight, vt = vv?.offsetTop || 0, vl = vv?.offsetLeft || 0;
  const up = !!btn.closest('.ed-tools.docked') || r.bottom + m.offsetHeight + 8 > vt + vh;
  const want = { x: Math.max(vl + 8, Math.min(vl + vw - m.offsetWidth - 8, r.left)), y: up ? Math.max(vt + 8, r.top - m.offsetHeight - 6) : r.bottom + 6 };
  m.style.left = want.x + 'px'; m.style.top = want.y + 'px';
  const got = m.getBoundingClientRect();                                   // a dialog can shift fixed elements; correct for it
  m.style.left = (want.x * 2 - got.left) + 'px'; m.style.top = (want.y * 2 - got.top) + 'px';
}
function openEdMenu(btn) {
  closePalette();
  palRange = edRange && edId === btn.dataset.ed ? edRange.cloneRange() : null;
  const id = btn.dataset.ed, cmd = btn.dataset.cmd, sel = btn.parentNode.querySelector(`select[data-cmd="${cmd}"]`); if (!sel) return;
  const m = document.createElement('div'); m.className = 'palette ed-menu'; m.id = 'palette';
  const items = [...sel.options].filter(o => o.value).map(o => `<button type="button" data-v="${esc(o.value)}"${cmd === 'fontName' ? ` style="font-family:'${esc(o.value)}'"` : ''}>${esc(o.textContent)}</button>`).join('');
  if (btn.closest('.ed-tools.docked')) { m.className = 'palette pal-strip chips'; m.innerHTML = items; }
  else m.innerHTML = `<div class="pal-title">${cmd === 'fontName' ? 'Font' : 'Text size'}</div><div class="ed-menu-list">${items}</div>`;
  (btn.closest('dialog[open]') || document.body).appendChild(m);
  palShow(m, btn);
  m.addEventListener('click', e => {
    const b = e.target.closest('[data-v]'); if (!b) return;
    if (palRange) { edRange = palRange; edId = id; }
    applyFormat(id, cmd, b.dataset.v); closePalette();
  });
}
actions.edMenu = el => { if ($('#palette')?._btn === el) { closePalette(); return; } openEdMenu(el); };
document.addEventListener('click', e => { if (!e.target.closest('#palette') && !e.target.closest('[data-act=palette], [data-act=edMenu]')) closePalette(); }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePalette(); });
actions.palette = el => { if ($('#palette')?._btn === el) { closePalette(); return; } openPalette(el); };

/* ---------- phones: while you type in a card field, the formatting toolbar sits right above the keyboard,
   out of the way of the phone's copy / paste bubble. It goes back in place when you leave the field. ---------- */
const edDockable = () => !!window.visualViewport && matchMedia('(pointer: coarse)').matches;
let edDocked = null;
const edUnder = t => parseFloat(getComputedStyle(t).getPropertyValue('--ed-under')) || 0;
function edPlace() {
  const d = edDocked; if (!d) return;
  if (!d.tools.isConnected) { edDocked = null; return; }
  const vv = window.visualViewport, t = d.tools;
  // only the keyboard's own numbers: Safari measures elements from the visible part of the page, so measuring would double the shift
  t.style.width = vv.width + 'px'; t.style.left = vv.offsetLeft + 'px'; t.style.top = (vv.offsetTop + vv.height - (t.offsetHeight - edUnder(t))) + 'px';   // the white part below the buttons hangs down behind the keyboard
  const strip = document.querySelector('#palette.pal-strip'); if (strip) palStripPlace(strip);
}
function edUndock() {
  const d = edDocked; if (!d) return;
  closePalette(); d.tools.classList.remove('docked'); d.tools.style.left = d.tools.style.top = d.tools.style.width = ''; d.ph.remove(); edDocked = null;
}
function edDock(area) {
  const tools = area.closest('.editor')?.querySelector('.ed-tools'); if (!tools) return;
  if (edDocked?.tools === tools) return edFollow();
  edUndock();
  const ph = document.createElement('div'); ph.className = 'ed-tools-ph';
  tools.before(ph); tools.classList.add('docked'); edDocked = { tools, ph }; edFollow();
}
/* the keyboard takes a moment to slide up, and phones don't always say when it is done:
   keep the bar on the keyboard every frame for a little while after a tap, a cursor move or a resize */
let edFollowUntil = 0;
function edFollow(ms = 1200) {
  const running = performance.now() < edFollowUntil;
  edFollowUntil = Math.max(edFollowUntil, performance.now() + ms);
  if (running) return;
  const tick = () => { if (!edDocked) { edFollowUntil = 0; return; } edPlace(); if (performance.now() < edFollowUntil) requestAnimationFrame(tick); else edFollowUntil = 0; };
  requestAnimationFrame(tick);
}
document.addEventListener('focusin', e => {
  if (!edDockable()) return;
  const a = e.target.closest?.('.ed-area');
  if (a) edDock(a); else if (!e.target.closest?.('.ed-tools, #palette')) edUndock();
});
document.addEventListener('focusout', () => {
  if (!edDocked) return;
  setTimeout(() => { const a = document.activeElement; if (!a?.closest?.('.ed-area, .ed-tools, #palette')) edUndock(); }, 200);
});
window.visualViewport?.addEventListener('resize', () => { edPlace(); if (edDocked) edFollow(600); });
window.visualViewport?.addEventListener('scroll', edPlace);
window.addEventListener('scroll', () => { if (edDocked) edPlace(); }, true);
document.addEventListener('selectionchange', () => { if (edDocked) edFollow(500); });
document.addEventListener('touchend', e => { if (edDocked && e.target.closest?.('.ed-area')) edFollow(); }, { passive: true });
