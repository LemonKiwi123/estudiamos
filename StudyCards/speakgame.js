'use strict';
/* ================= 🎙️ Say it! =================
   See a card's meaning, say the word in the language you're learning, and the app listens.
   Uses the browser's speech recognition (Chrome, Edge, Safari) or, in the Android app, the phone's own recognizer
   (window.AndroidSpeech). What it hears is matched to the card: accents, capitals, punctuation and a leading article
   ("el", "la", "the"…) don't matter, and small slips are forgiven. Rounds of 10. */
const SK_ARTICLES = {
  es: ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas'], fr: ['le', 'la', 'les', "l'", 'un', 'une', 'des', 'du', 'de la'], de: ['der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'einen'],
  it: ['il', 'lo', 'la', 'i', 'gli', 'le', "l'", 'un', 'uno', 'una', "un'"], pt: ['o', 'a', 'os', 'as', 'um', 'uma'], en: ['the', 'a', 'an', 'to'], nl: ['de', 'het', 'een'],
};
let sk = null;
const skLang = d => String(d?.frontLang || '').split('-')[0].toLowerCase();
/* the same words written two ways match: no accents, capitals, punctuation or leading article */
/* Japanese: no spaces or punctuation, katakana and hiragana count as the same, and common words written in kanji
   (from the Sentence Builder's word list) are turned back into kana, because the recognizer often answers in kanji */
let skJaMap = null;
function skNormJa(text) {
  if (!skJaMap) { skJaMap = []; for (const L of [typeof JA_NOUN !== 'undefined' && JA_NOUN, typeof JA_ADJ !== 'undefined' && JA_ADJ, typeof JA_PRON !== 'undefined' && JA_PRON]) for (const x of L || []) if (x[1] && x[1] !== x[0]) skJaMap.push([x[1], x[0]]); skJaMap.sort((a, b) => b[0].length - a[0].length); }
  let t = String(text || '').normalize('NFKC').replace(/[\s。、．，！？!?.,「」『』（）()・…〜~"“”]/g, '');
  for (const [kanji, kana] of skJaMap) if (t.includes(kanji)) t = t.split(kanji).join(kana);
  return t.replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));   // katakana → hiragana
}
function skNorm(text, lang) {
  if (lang === 'ja') return skNormJa(text);
  let t = String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿¡!?.,;:"“”«»()\[\]{}…]/g, ' ').replace(/[’`]/g, "'").replace(/\s+/g, ' ').trim();
  for (const a of (SK_ARTICLES[lang] || []).slice().sort((x, y) => y.length - x.length)) {
    const art = a.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (art.endsWith("'") ? t.startsWith(art) : t.startsWith(art + ' ')) { t = t.slice(art.length).trim(); break; }
  }
  return t;
}
function skLev(a, b) {
  const m = a.length, n = b.length, d = [...Array(n + 1).keys()];
  for (let i = 1; i <= m; i++) { let prev = d[0]; d[0] = i; for (let j = 1; j <= n; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } }
  return d[n];
}
/* every way the card can be said: "perro / can" -> ["perro", "can"]; notes in brackets are left out */
function skAnswers(card, lang) {
  if (lang === 'ja') {   // 犬（いぬ）: the word and its reading in brackets both count
    const f = plainSent(card.front), inside = [...f.matchAll(/[（(]([^）)]*)[）)]/g)].map(m => m[1]);
    return [...new Set([f.replace(/[（(][^）)]*[）)]/g, ' '), ...inside].flatMap(x => x.split(/[\/,;|、・]/)).map(x => skNorm(x, lang)).filter(Boolean))];
  }
  const raw = plainSent(card.front).replace(/\([^)]*\)/g, ' ');
  return [...new Set(raw.split(/[\/,;|]|\bor\b/).map(x => skNorm(x, lang)).filter(Boolean))];
}
/* did any of the things the recognizer heard match? exact, the answer said inside a longer phrase, or a small slip */
function skMatch(heard, card, lang) {
  const answers = skAnswers(card, lang);
  let best = { ok: false, close: false, heard: heard[0] || '' };
  for (const h of heard) {
    const said = skNorm(h, lang); if (!said) continue;
    for (const a of answers) {
      if (said === a) return { ok: true, close: false, heard: h };
      if (lang === 'ja' ? a.length >= 2 && said.includes(a) : (' ' + said + ' ').includes(' ' + a + ' ')) return { ok: true, close: false, heard: h };
      const slip = Math.max(1, Math.floor(a.length / 6)), longEnough = lang === 'ja' ? a.length >= 4 : a.length >= 6;   // Japanese words are short in kana
      if (longEnough && skLev(said, a) <= slip && !best.ok) best = { ok: true, close: true, heard: h };
    }
  }
  return best;
}
const skPool = deckId => cardsOf(deckId).filter(c => { const f = plainSent(c.front || '').trim(); return f && !/\n/.test(f) && f.length <= 40 && plainSent(c.back || '').trim(); });

/* ---------- the microphone: the browser's recognizer, or the Android app's ---------- */
function skSupport() {
  if (window.AndroidSpeech) return { ok: true, how: 'android' };
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return { ok: false, why: 'This browser can’t listen to speech. Try Chrome or Edge on a computer, Chrome on Android, or Safari on iPhone.' };
  if (!window.isSecureContext) return { ok: false, why: 'The microphone only works on a secure address. On a phone, open Estudiamos with your PC’s https:// Tailscale address (see Settings › Phone & sync), not the plain Wi-Fi address.' };
  return { ok: true, how: 'browser', SR };
}
/* Listens until the answer is heard, the speaker pauses (about 2.5 s after speaking), the player taps the mic again,
   or 15 s pass with nothing said. h = { check(list) -> true when it matches, done(list), error(code), level(0..1), live(text) } */
const SK_WAIT = 15000, SK_PAUSE = 2500;
function skListen(lang, h) {
  const sup = skSupport();
  if (!sup.ok) { h.error('unsupported'); return { stop() {} }; }
  const deadline = Date.now() + SK_WAIT;
  let finished = false, userStop = false, meter = null, cap = null;
  const finish = (fn, arg) => { if (finished) return; finished = true; clearTimeout(cap); meter?.stop(); fn(arg); };
  const uniq = list => [...new Set(list.map(x => String(x || '').trim()).filter(Boolean))];

  if (sup.how === 'android') {
    const again = () => { try { AndroidSpeech.start(lang || ''); } catch { finish(h.error, 'error'); } };
    window.__androidSpeechPartial = list => {
      if (finished) return; list = uniq(Array.isArray(list) ? list : []);
      if (list[0]) h.live(list[0]);
      if (list.length && h.check(list)) { finish(h.done, list); try { AndroidSpeech.stop(); } catch {} }
    };
    window.__androidSpeechResult = list => {
      if (finished) return; list = uniq(Array.isArray(list) ? list : []);
      if (list.length) finish(h.done, list); else if (!userStop && Date.now() < deadline) again(); else finish(h.error, userStop ? 'stopped' : 'no-speech');
    };
    window.__androidSpeechError = code => {
      if (finished) return; code = String(code || 'error');
      const silent = code === '6' || code === '7' || code === '8';   // nothing heard / not recognized / still busy: keep listening until the time is up
      if (silent && !userStop && Date.now() < deadline) setTimeout(again, 250); else finish(h.error, silent ? (userStop ? 'stopped' : 'no-speech') : code);
    };
    window.__androidSpeechLevel = db => { if (!finished) h.level(Math.max(0, Math.min(1, (Number(db) + 2) / 11))); };
    cap = setTimeout(() => { userStop = true; try { AndroidSpeech.stop(); } catch {} setTimeout(() => finish(h.error, 'no-speech'), 2000); }, SK_WAIT + 5000);
    again();
    return { stop() { if (finished) return; userStop = true; try { AndroidSpeech.stop(); } catch {} setTimeout(() => finish(h.error, 'stopped'), 2500); } };
  }

  const r = new sup.SR(); r.lang = lang || ''; r.interimResults = true; r.maxAlternatives = 5; r.continuous = true;
  let finals = [], finalAlts = [], interim = '', pause = null, running = false;
  const heard = () => uniq([(finals.join(' ') + ' ' + interim).trim(), ...finalAlts, interim]);
  const wrapUp = () => { const list = heard(); if (list.length) finish(h.done, list); else finish(h.error, userStop ? 'stopped' : 'no-speech'); };
  r.onstart = () => { running = true; };
  r.onresult = e => {
    if (finished) return; interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i], alts = [];
      for (let j = 0; j < res.length; j++) alts.push(res[j].transcript);
      if (res.isFinal) { finals.push(alts[0].trim()); finalAlts.push(...alts); } else interim += alts[0];
      if (h.check(uniq(alts))) { finish(h.done, uniq([...alts, ...heard()])); try { r.abort(); } catch {} return; }
    }
    const list = heard(); h.live(list[0] || '');
    if (h.check(list)) { finish(h.done, list); try { r.abort(); } catch {} return; }
    clearTimeout(pause); pause = setTimeout(() => { try { r.stop(); } catch { wrapUp(); } }, SK_PAUSE);   // they stopped talking: check what we have
  };
  r.onerror = e => { if (finished || e.error === 'no-speech' || e.error === 'aborted') return; finish(h.error, e.error || 'error'); };
  r.onend = () => {
    running = false; clearTimeout(pause); if (finished) return;
    if (!heard().length && !userStop && Date.now() < deadline) { try { r.start(); return; } catch {} }   // the browser gave up early: keep listening
    wrapUp();
  };
  cap = setTimeout(() => { try { r.stop(); } catch {} setTimeout(wrapUp, 1500); }, SK_WAIT + 5000);
  try { r.start(); } catch { finish(h.error, 'busy'); return { stop() {} }; }
  meter = skMeter(h.level, r);
  return { stop() { if (finished) return; userStop = true; if (running) { try { r.stop(); } catch { wrapUp(); } setTimeout(wrapUp, 2000); } else wrapUp(); } };
}
/* a live sound level for the meter. Computers: measured from the microphone. Phones: a second microphone user can stop
   the recognizer, so there the meter follows the recognizer itself (listening, sound, speech, words coming in). */
function skMeter(onLevel, rec) {
  const m = { stopped: false, stop() { this.stopped = true; cancelAnimationFrame(this.raf); this.stream?.getTracks().forEach(t => t.stop()); this.ctx?.close().catch(() => {}); } };
  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return rec ? skEventMeter(onLevel, rec, m) : m;
  if (!navigator.mediaDevices?.getUserMedia || !(window.AudioContext || window.webkitAudioContext)) return rec ? skEventMeter(onLevel, rec, m) : m;
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    if (m.stopped) { stream.getTracks().forEach(t => t.stop()); return; }
    m.stream = stream; m.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const an = m.ctx.createAnalyser(); an.fftSize = 1024; m.ctx.createMediaStreamSource(stream).connect(an);
    const buf = new Float32Array(an.fftSize); let lv = 0;
    const tick = () => {
      if (m.stopped) return;
      an.getFloatTimeDomainData(buf); let sum = 0; for (const v of buf) sum += v * v;
      const db = 20 * Math.log10(Math.sqrt(sum / buf.length) || 1e-6), now = Math.max(0, Math.min(1, (db + 60) / 45));
      lv = now > lv ? now : lv * 0.85 + now * 0.15; onLevel(lv); m.raf = requestAnimationFrame(tick);
    };
    tick();
  }).catch(() => {});
  return m;
}
function skEventMeter(onLevel, rec, m) {
  let base = 0, bump = 0, lv = 0;
  const on = (ev, fn) => rec.addEventListener?.(ev, () => { if (!m.stopped) fn(); });
  on('audiostart', () => { base = Math.max(base, 0.06); });
  on('soundstart', () => { base = 0.3; bump = Math.max(bump, 0.45); });
  on('speechstart', () => { base = 0.45; bump = Math.max(bump, 0.7); });
  on('result', () => { base = Math.max(base, 0.4); bump = 0.95; });
  on('speechend', () => { base = 0.06; });
  on('soundend', () => { base = 0.06; });
  on('audioend', () => { base = 0; });
  const tick = () => {
    if (m.stopped) return clearInterval(m.iv);
    bump *= 0.85;
    const target = Math.max(base * (0.75 + Math.random() * 0.5), bump);
    lv = target > lv ? target : lv * 0.75 + target * 0.25;
    onLevel(Math.min(1, lv));
  };
  m.iv = setInterval(tick, 50); tick();
  const stop = m.stop.bind(m); m.stop = () => { clearInterval(m.iv); stop(); };
  return m;
}
const SK_ERRORS = {
  'not-allowed': '🎙️ The microphone is blocked. Allow it in the browser (the 🔒 or 🎙️ icon next to the address) and try again.', 'service-not-allowed': '🎙️ Speech recognition isn’t allowed here. Try Chrome or Edge.',
  'no-speech': '🤫 I didn’t hear anything. Tap the microphone and say the word.', 'audio-capture': '🎙️ No microphone found. Plug one in or check your sound settings.',
  'network': '📶 Speech recognition needs the internet. Check your connection.', 'language-not-supported': '🌐 This browser can’t listen in this language yet.', 'busy': 'One moment, still listening…', 'stopped': 'Stopped. Tap the microphone when you’re ready.',
  '7': '🤫 I didn’t catch a word I know. Try again a little slower.', '6': '🤫 I didn’t hear anything. Tap the microphone and say the word.', '9': '🎙️ The app needs microphone permission. Allow it and try again.', '2': '📶 Speech recognition needs the internet.',
};

/* ---------- the game ---------- */
function startSpeak(deckId) { sk = null; go({ name: 'speakgame', deckId }); }
function skStart() {
  const d = deckById(view.deckId), pool = shuffle(skPool(d.id));
  sk = { deckId: d.id, lang: d.frontLang || '', base: skLang(d), cards: pool.slice(0, Math.min(10, pool.length)), i: 0, right: 0, tries: 0, streak: 0, best: 0, log: [], state: 'ready', heard: null, msg: '' };
  render();
}
const skCur = () => sk?.cards[sk.i];
function skMic() {
  if (!sk || sk.state === 'done') return;
  if (sk.state === 'listening') { sk.rec?.stop(); const s = $('.sk-status'); if (s) s.textContent = 'Stopping…'; return; }   // tap again to stop
  if (!['ready', 'wrong'].includes(sk.state)) return;
  sk.state = 'listening'; sk.msg = ''; sk.loud = 0; render();
  const c = skCur(), t0 = Date.now(), mine = sk;
  sk.rec = skListen(sk.lang, {
    check: list => skMatch(list, c, mine.base).ok,
    done: list => skHeard(list),
    error: err => { if (sk !== mine || sk.state !== 'listening') return; sk.state = sk.tries ? 'wrong' : 'ready'; sk.msg = SK_ERRORS[err] || `Something went wrong (${err}). Try again.`; render(); },
    live: text => { const el = $('#skLive'); if (el && sk === mine) el.textContent = text ? `“${text}”` : ''; },
    level: lv => {
      if (sk !== mine || sk.state !== 'listening') return;
      sk.loud = Math.max(sk.loud, lv);
      const bar = $('#skLevel'), mic = $('.sk-mic.on'), tip = $('#skTip');
      if (bar) { bar.parentNode.hidden = false; bar.style.width = Math.round(lv * 100) + '%'; bar.className = lv > 0.35 ? 'good' : lv > 0.12 ? 'ok' : ''; }
      if (mic) { mic.classList.add('lv'); mic.style.setProperty('--lv', lv.toFixed(2)); }
      if (tip) tip.hidden = !(Date.now() - t0 > 3000 && sk.loud < 0.3);
    },
  });
}
function skHeard(list) {
  if (!sk || sk.state !== 'listening') return;
  const c = skCur(), m = skMatch(list, c, sk.base);
  sk.tries++; sk.heard = { list, m };
  if (m.ok) {
    sk.right++; sk.streak++; sk.best = Math.max(sk.best, sk.streak); sk.state = 'right';
    sk.log.push({ card: c, ok: true, tries: sk.tries, heard: m.heard });
    if (typeof sdSound === 'function') sdSound('right');
  } else {
    sk.streak = 0; sk.state = sk.tries >= 3 ? 'reveal' : 'wrong';
    if (sk.state === 'reveal') sk.log.push({ card: c, ok: false, tries: sk.tries, heard: m.heard });
    if (typeof sdSound === 'function') sdSound('wrong');
  }
  render();
  if (sk.state === 'reveal' || sk.state === 'right') setTimeout(() => sk && speak(plainSent(c.front), sk.lang), 300);
}
function skNext() {
  if (!sk) return;
  if (sk.state === 'wrong') { sk.state = 'reveal'; sk.log.push({ card: skCur(), ok: false, tries: sk.tries, heard: sk.heard?.m.heard || '' }); render(); return; }
  sk.i++; sk.tries = 0; sk.heard = null; sk.msg = ''; sk.hint = false;
  if (sk.i >= sk.cards.length) {
    sk.state = 'done'; const nuts = Math.floor(sk.right / 3); sk.nuts = nuts;
    if (nuts && typeof rw === 'function') rw().peanuts += nuts;
    if (typeof addHistory === 'function') addHistory({ type: 'speak', deckId: sk.deckId, deckName: deckById(sk.deckId)?.name, correct: sk.right, total: sk.cards.length,
      score: Math.round(sk.right / sk.cards.length * 100), timeMs: 0, detail: `Said ${sk.right} of ${sk.cards.length} right${nuts ? ` · 🥜 ${nuts}` : ''}`, items: sk.log.map(l => ({ cardId: l.card.id, q: l.card.back, a: l.card.front, given: l.heard, ok: l.ok })) });
    else save();
  } else sk.state = 'ready';
  render();
}

views.speakgame = () => {
  const d = deckById(view.deckId); if (!d) { view = { name: 'home' }; return views.home(); }
  const crumbs = `<div class="crumbs"><a data-act="home">Decks</a> / <a data-act="openDeck" data-id="${d.id}">${esc(d.name)}</a> / <a data-act="games" data-id="${d.id}">Games</a> / Say it!</div>`;
  const sup = skSupport();
  if (!sk || sk.deckId !== d.id) {
    const n = skPool(d.id).length;
    return `${crumbs}<h2 style="margin-bottom:4px">🎙️ Say it!</h2>
      <p class="muted" style="margin:0 0 14px">See what a word means, then <b>say it out loud in ${esc(langName(d.frontLang) || 'your language')}</b>. Estudiamos listens and checks. Accents, capitals and words like “el” or “la” don’t matter, and small slips are fine.</p>
      <div class="panel stack">
        ${sup.ok ? '' : `<div class="banner" style="background:var(--bad-bg)"><span>⚠️ ${esc(sup.why)}</span></div>`}
        ${!d.frontLang ? '<div class="banner"><span>Set this deck’s front language first (deck settings), so Estudiamos knows which language to listen for.</span></div>' : ''}
        <div class="muted small">🔒 <b>About your voice:</b> ${window.AndroidSpeech ? 'the Android app uses your phone’s own speech recognizer. Depending on the phone, it may send your voice to Google to turn it into text.'
          : 'Chrome and Edge send what you say to Google’s or Microsoft’s speech service to turn it into text, so it needs the internet. Safari on iPhone uses Apple’s. Firefox can’t do this yet.'}
          The microphone only works on secure addresses: on this PC that’s fine, on a phone use the https:// Tailscale address.</div>
        <div class="row-between"><span class="muted small">${n} card${n === 1 ? '' : 's'} can be said (one line on the front) · 10 per round · a peanut for every 3 right</span>
          <button type="button" class="btn primary big" data-act="skStart" ${sup.ok && n >= 1 && d.frontLang ? '' : 'disabled'}>Start 🎙️</button></div>
      </div>`;
  }
  if (sk.state === 'done') {
    const missed = sk.log.filter(l => !l.ok);
    return `${crumbs}<div class="panel stack" style="text-align:center"><div style="font-size:48px">${sk.right >= sk.cards.length * 0.9 ? '🏆' : sk.right >= sk.cards.length * 0.6 ? '🎉' : '💪'}</div>
      <h2 style="margin:0">You said ${sk.right} of ${sk.cards.length} right</h2>
      <p class="muted" style="margin:0">Best streak ${sk.best}${sk.nuts ? ` · +${sk.nuts} 🥜` : ''}</p>
      ${missed.length ? `<div class="sk-review">${missed.map(l => `<div class="sk-miss"><button type="button" class="icon-btn speak" data-act="skHear" data-t="${esc(plainSent(l.card.front))}" title="Hear it">🔊</button><b>${esc(plainSent(l.card.front))}</b> <span class="muted">${esc(plainSent(l.card.back))}</span>${l.heard ? `<small>I heard: “${esc(l.heard)}”</small>` : ''}</div>`).join('')}</div>` : '<p>Every word, perfectly said! ✨</p>'}
      <div class="row" style="justify-content:center"><button type="button" class="btn primary" data-act="skStart">Play again</button><button type="button" class="btn" data-act="games" data-id="${d.id}">Other games</button></div></div>`;
  }
  const c = skCur(), front = plainSent(c.front), st = sk.state, h = sk.heard;
  const ans = skAnswers(c, sk.base)[0] || '', hint = sk.hint && ans ? `<div class="sk-hint">💡 Starts with <b>“${esc(ans[0])}…”</b> · ${ans.replace(/ /g, '').length} letters</div>` : '';
  return `<div class="study-top"><button type="button" class="btn ghost" data-act="games" data-id="${d.id}">← Games</button>
      <div class="prompt-label muted">🎙️ Say it! · ${sk.i + 1}/${sk.cards.length}</div><div class="muted">✓ ${sk.right} · 🔥 ${sk.streak}</div></div>
    <div class="panel sk-card">
      <div class="muted small">Say this in ${esc(langName(d.frontLang) || 'the deck’s language')}:</div>
      <div class="sk-prompt">${esc(plainSent(c.back))}</div>${hint}
      <button type="button" class="sk-mic ${st === 'listening' ? 'on' : ''}" data-act="skMic" ${['ready', 'wrong', 'listening'].includes(st) ? '' : 'disabled'} aria-label="${st === 'listening' ? 'Stop listening' : 'Tap and speak'}">${st === 'listening' ? '👂' : '🎙️'}</button>
      ${st === 'listening' ? '<div class="sk-meter" hidden title="How loud I hear you"><i id="skLevel"></i></div><div id="skLive" class="sk-live"></div><div id="skTip" class="sk-tip" hidden>🔈 I can barely hear you. Move closer to the microphone or speak a little louder.</div>' : ''}
      <div class="sk-status">${st === 'listening' ? 'Listening… say the word. Tap the microphone to stop.' : st === 'ready' ? (sk.msg || 'Tap the microphone, then say the word.') : st === 'wrong' ? (sk.msg || 'Not quite. Try again!') : ''}</div>
      ${h ? `<div class="sk-heard ${h.m.ok ? 'ok' : 'no'}">I heard: <b>“${esc(h.m.heard || h.list[0] || '…')}”</b>${h.list.length > 1 ? `<small>or: ${h.list.slice(1, 4).map(x => '“' + esc(x) + '”').join(', ')}</small>` : ''}</div>` : ''}
      ${st === 'right' ? `<div class="sk-verdict ok">✓ ${h.m.close ? 'Close enough! It’s' : 'Right!'} <b>${esc(front)}</b></div>` : st === 'reveal' ? `<div class="sk-verdict no">It’s <b>${esc(front)}</b>. Listen and repeat it next time!</div>` : ''}
      <div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap">
        <button type="button" class="btn" data-act="skHear" data-t="${esc(front)}">🔊 Hear it</button>
        ${['ready', 'wrong'].includes(st) && !sk.hint ? '<button type="button" class="btn ghost" data-act="skHint">💡 Hint</button>' : ''}
        ${st === 'wrong' ? '<button type="button" class="btn ghost" data-act="skNext">Show the answer</button>' : ''}
        ${['right', 'reveal'].includes(st) ? '<button type="button" class="btn primary" data-act="skNext">Next ▶</button>' : ''}
        ${st === 'ready' && !sk.tries ? '<button type="button" class="btn ghost" data-act="skSkip">Skip</button>' : ''}
      </div></div>`;
};
Object.assign(actions, {
  skStart: () => skStart(), skMic: () => skMic(), skNext: () => skNext(),
  skSkip: () => { if (!sk) return; sk.log.push({ card: skCur(), ok: false, tries: 0, heard: '' }); sk.state = 'reveal'; sk.streak = 0; render(); },
  skHint: () => { if (sk) { sk.hint = true; render(); } },
  skHear: el => speak(el.dataset.t, sk?.lang || deckById(view.deckId)?.frontLang),
});
document.addEventListener('keydown', e => {
  if (view.name !== 'speakgame' || !sk || $('#dlg')?.open || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
  if (e.key === ' ' && ['ready', 'wrong', 'listening'].includes(sk.state)) { e.preventDefault(); skMic(); }
  else if (e.key === 'Enter' && ['right', 'reveal', 'wrong'].includes(sk.state)) { e.preventDefault(); skNext(); }
});
