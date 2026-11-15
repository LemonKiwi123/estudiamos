'use strict';
/* ================= 🔢 Numbers & ABC =================
   Practice numbers and the alphabet in the language you're learning. No deck needed:
   number words are built by rules for each language, and letters come with their names.
   Rounds of 10. Modes: hear it, read it, write it. Opened from the home page or any deck's Games page. */
const NG_LANGS = {
  es: { name: 'Spanish', flag: '🇪🇸', tts: 'es-ES' }, fr: { name: 'French', flag: '🇫🇷', tts: 'fr-FR' }, de: { name: 'German', flag: '🇩🇪', tts: 'de-DE' },
  it: { name: 'Italian', flag: '🇮🇹', tts: 'it-IT' }, pt: { name: 'Portuguese', flag: '🇧🇷', tts: 'pt-BR' }, en: { name: 'English', flag: '🇬🇧', tts: 'en-GB' },
  ja: { name: 'Japanese', flag: '🇯🇵', tts: 'ja-JP', kana: true },
};
/* ---------- number words, 0 to 1000 ---------- */
const NG_WORDS = {
  es(n) {
    const u = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
      'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
    const t = { 3: 'treinta', 4: 'cuarenta', 5: 'cincuenta', 6: 'sesenta', 7: 'setenta', 8: 'ochenta', 9: 'noventa' };
    const h = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    const two = x => x < 30 ? u[x] : t[Math.floor(x / 10)] + (x % 10 ? ' y ' + u[x % 10] : '');
    if (n === 1000) return 'mil'; if (n === 100) return 'cien'; if (n < 100) return two(n);
    return h[Math.floor(n / 100)] + (n % 100 ? ' ' + two(n % 100) : '');
  },
  en(n) {
    const u = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const t = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const two = x => x < 20 ? u[x] : t[Math.floor(x / 10)] + (x % 10 ? '-' + u[x % 10] : '');
    if (n === 1000) return 'one thousand'; if (n < 100) return two(n);
    return u[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + two(n % 100) : '');
  },
  fr(n) {
    const u = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    const t = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
    const two = x => {
      if (x < 20) return u[x];
      if (x < 70) { const d = Math.floor(x / 10), r = x % 10; return t[d] + (r === 1 ? ' et un' : r ? '-' + u[r] : ''); }
      if (x < 80) return 'soixante' + (x === 71 ? ' et onze' : '-' + u[x - 60]);
      if (x === 80) return 'quatre-vingts';
      return 'quatre-vingt-' + u[x - 80];
    };
    if (n === 1000) return 'mille'; if (n < 100) return two(n);
    const c = Math.floor(n / 100), r = n % 100;
    return (c === 1 ? 'cent' : u[c] + (r ? ' cent' : ' cents')) + (r ? ' ' + two(r) : '');
  },
  de(n) {
    const u = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
    const t = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];
    const two = x => x < 20 ? u[x] : (x % 10 ? (x % 10 === 1 ? 'ein' : u[x % 10]) + 'und' : '') + t[Math.floor(x / 10)];
    if (n === 1000) return 'tausend'; if (n < 100) return two(n);
    const c = Math.floor(n / 100), r = n % 100;
    return (c === 1 ? 'hundert' : u[c] + 'hundert') + (r ? two(r) : '');
  },
  it(n) {
    const u = ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci', 'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove'];
    const t = ['', '', 'venti', 'trenta', 'quaranta', 'cinquanta', 'sessanta', 'settanta', 'ottanta', 'novanta'];
    const two = x => { if (x < 20) return u[x]; const d = t[Math.floor(x / 10)], r = x % 10; if (!r) return d; return (r === 1 || r === 8 ? d.slice(0, -1) : d) + (r === 3 ? 'tré' : u[r]); };
    if (n === 1000) return 'mille'; if (n < 100) return two(n);
    const c = Math.floor(n / 100), r = n % 100;
    return (c === 1 ? 'cento' : u[c] + 'cento') + (r ? two(r) : '');
  },
  pt(n) {
    const u = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
    const t = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
    const h = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
    const two = x => x < 20 ? u[x] : t[Math.floor(x / 10)] + (x % 10 ? ' e ' + u[x % 10] : '');
    if (n === 1000) return 'mil'; if (n === 100) return 'cem'; if (n < 100) return two(n);
    return h[Math.floor(n / 100)] + (n % 100 ? ' e ' + two(n % 100) : '');
  },
  ja(n) {   // in kana, written together: にじゅうさん (23), さんびゃく (300), はっぴゃく (800)
    const u = ['ゼロ', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];
    const h = ['', 'ひゃく', 'にひゃく', 'さんびゃく', 'よんひゃく', 'ごひゃく', 'ろっぴゃく', 'ななひゃく', 'はっぴゃく', 'きゅうひゃく'];
    const two = x => x < 10 ? u[x] : (x >= 20 ? u[Math.floor(x / 10)] : '') + 'じゅう' + (x % 10 ? u[x % 10] : '');
    if (n === 1000) return 'せん'; if (n < 100) return two(n);
    return h[Math.floor(n / 100)] + (n % 100 ? two(n % 100) : '');
  },
};
/* ---------- alphabets with the name of each letter ---------- */
const NG_ABC = {
  es: 'a:a b:be c:ce d:de e:e f:efe g:ge h:hache i:i j:jota k:ka l:ele m:eme n:ene ñ:eñe o:o p:pe q:cu r:erre s:ese t:te u:u v:uve w:uve doble x:equis y:ye z:zeta',
  en: 'a:ay b:bee c:see d:dee e:ee f:ef g:jee h:aitch i:eye j:jay k:kay l:el m:em n:en o:oh p:pee q:cue r:ar s:ess t:tee u:you v:vee w:double-u x:ex y:why z:zee',
  fr: 'a:a b:bé c:cé d:dé e:e f:effe g:gé h:ache i:i j:ji k:ka l:elle m:emme n:enne o:o p:pé q:qu r:erre s:esse t:té u:u v:vé w:double vé x:ixe y:i grec z:zède',
  de: 'a:a b:be c:ce d:de e:e f:ef g:ge h:ha i:i j:jot k:ka l:el m:em n:en o:o p:pe q:ku r:er s:es t:te u:u v:vau w:we x:ix y:ypsilon z:zett ä:a-Umlaut ö:o-Umlaut ü:u-Umlaut ß:Eszett',
  it: 'a:a b:bi c:ci d:di e:e f:effe g:gi h:acca i:i j:i lunga k:cappa l:elle m:emme n:enne o:o p:pi q:cu r:erre s:esse t:ti u:u v:vu w:doppia vu x:ics y:ipsilon z:zeta',
  ja: 'あ:a い:i う:u え:e お:o か:ka き:ki く:ku け:ke こ:ko さ:sa し:shi す:su せ:se そ:so た:ta ち:chi つ:tsu て:te と:to な:na に:ni ぬ:nu ね:ne の:no は:ha ひ:hi ふ:fu へ:he ほ:ho ま:ma み:mi む:mu め:me も:mo や:ya ゆ:yu よ:yo ら:ra り:ri る:ru れ:re ろ:ro わ:wa を:wo ん:n',
  pt: 'a:á b:bê c:cê d:dê e:é f:efe g:gê h:agá i:i j:jota k:cá l:ele m:eme n:ene o:ó p:pê q:quê r:erre s:esse t:tê u:u v:vê w:dáblio x:xis y:ípsilon z:zê',
};
const ngAbc = l => NG_ABC[l].split(/ (?=\S:)/).reduce((a, p) => { const i = p.indexOf(':'); a.push([p.slice(0, i), p.slice(i + 1)]); return a; }, []);
const NG_RANGES = [['0–10', 0, 10], ['0–20', 0, 20], ['0–100', 0, 100], ['100–1000', 100, 1000]];
const NG_MODES = {
  hear: { icon: '🔊', label: 'Hear the number', desc: 'Listen, then pick the number you heard.' },
  read: { icon: '👀', label: 'Read the word', desc: 'Read the number word, then pick the digits.' },
  word: { icon: '🔢', label: 'Find the word', desc: 'See the digits, then pick the right word.' },
  type: { icon: '⌨️', label: 'Write the word', desc: 'See the digits, then type the number word.' },
  abcHear: { icon: '🔊', label: 'Hear a letter', desc: 'Listen to the letter’s name, then pick the letter.', abc: true },
  abcName: { icon: '🔤', label: 'Name the letter', desc: 'See a letter, then pick its name.', abc: true },
  abcSpell: { icon: '✍️', label: 'Spell a number', desc: 'Hear a number word spelled letter by letter, then pick the word.', abc: true },
};
let ng = null;
const ngLang = () => NG_LANGS[S.settings?.ngLang] ? S.settings.ngLang : 'es';
function ngDefaultLang(deckId) { const d = deckId && deckById(deckId), b = d ? String(d.frontLang || '').split('-')[0].toLowerCase() : ''; return NG_LANGS[b] ? b : ngLang(); }
function ngSay(text, slow) { if (typeof speak === 'function') speak(text, NG_LANGS[ng.lang].tts, slow ? 0.8 : 1); }
function ngPickNum() { const [, lo, hi] = NG_RANGES[ng.range]; return lo + Math.floor(Math.random() * (hi - lo + 1)); }
function ngNear(n) {   // believable wrong answers: one off, ten off, digits swapped
  const [, lo, hi] = NG_RANGES[ng.range], out = new Set([n]);
  const tries = [n + 1, n - 1, n + 10, n - 10, +String(n).split('').reverse().join(''), n + 2, n - 2, n + 100, n - 100, n + 20, n - 20];
  for (const x of shuffle(tries)) { if (out.size >= 4) break; if (x >= lo && x <= hi && !out.has(x)) out.add(x); }
  while (out.size < 4) { const x = ngPickNum(); out.add(x); }
  return shuffle([...out]);
}
function ngQuestion() {
  const L = ng.lang, words = NG_WORDS[L], q = { mode: ng.mode };
  if (ng.mode === 'abcHear' || ng.mode === 'abcName') {
    const abc = ngAbc(L), pick = abc[Math.floor(Math.random() * abc.length)], others = shuffle(abc.filter(x => x[0] !== pick[0])).slice(0, 3);
    q.letter = pick[0]; q.name = pick[1];
    const kana = NG_LANGS[L].kana, show = l => kana ? l : l.toUpperCase() + ' ' + l;
    q.opts = shuffle([pick, ...others]).map(([l, nm]) => ng.mode === 'abcHear' ? show(l) : nm);
    q.answer = ng.mode === 'abcHear' ? show(pick[0]) : pick[1];
    q.say = kana ? pick[0] : pick[1];
  } else if (ng.mode === 'abcSpell') {
    const n = ngPickNum(), w = words(n), opts = ngNear(n).map(words);
    q.n = n; q.answer = w; q.opts = opts; q.spell = [...w.replace(/[\s-]/g, '')];
    const names = Object.fromEntries(ngAbc(L)); q.say = q.spell.map(ch => NG_LANGS[L].kana ? ch : names[ch.toLowerCase()] || ch).join(', ');
  } else {
    const n = ngPickNum(); q.n = n; q.word = words(n);
    if (ng.mode === 'hear' || ng.mode === 'read') { q.opts = ngNear(n).map(String); q.answer = String(n); }
    else if (ng.mode === 'word') { q.opts = ngNear(n).map(words); q.answer = q.word; }
    else { q.opts = []; q.answer = q.word; }
    q.say = q.word;
  }
  ng.q = q; ng.t0 = Date.now();
  if (['hear', 'abcHear', 'abcSpell'].includes(ng.mode)) setTimeout(() => ng?.q === q && ngSay(q.say, ng.mode === 'abcSpell'), 250);
}
const ngNorm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s-]+/g, ' ').trim();
function ngAnswer(given) {
  const q = ng.q; if (!q || q.given != null) return;
  q.given = given;
  q.ok = ng.mode === 'type' ? ngNorm(given) === ngNorm(q.answer) : given === q.answer;
  q.close = ng.mode === 'type' && !q.ok && ngNorm(given).replace(/ /g, '') === ngNorm(q.answer).replace(/ /g, '');
  if (q.close) q.ok = true;
  q.accentMiss = ng.mode === 'type' && q.ok && String(given).trim().toLowerCase().replace(/[\s-]+/g, ' ') !== q.answer.toLowerCase().replace(/[\s-]+/g, ' ');
  if (q.ok) { ng.right++; ng.streak++; ng.best = Math.max(ng.best, ng.streak); } else ng.streak = 0;
  ng.log.push({ ...q });
  if (typeof sdSound === 'function') sdSound(q.ok ? 'right' : 'wrong');
  if (!['hear', 'abcHear'].includes(ng.mode) || !q.ok) setTimeout(() => ng?.q === q && ngSay(q.say), 200);
  render();
  if (q.ok && !q.accentMiss) setTimeout(() => { if (ng?.q === q) ngNext(); }, 1100);
}
function ngNext() {
  if (!ng) return;
  ng.i++; if (ng.i >= ng.total) return ngFinish();
  ngQuestion(); render(); setTimeout(() => $('#ngType')?.focus(), 50);
}
function ngFinish() {
  const key = ng.lang + ':' + ng.mode + ':' + ng.range, best = (S.ngBest ||= {});
  ng.newBest = ng.right > (best[key] || 0); if (ng.newBest) best[key] = ng.right;
  const nuts = Math.floor(ng.right / 3); if (nuts && typeof rw === 'function') rw().peanuts += nuts; ng.nuts = nuts;
  ng.done = true; ng.q = null; save(); render();
}
function startNumGame(deckId) { ng = null; go({ name: 'numgame', deckId: deckId || null }); }

views.numgame = () => {
  if (!S.settings.ngLang) S.settings.ngLang = ngDefaultLang(view.deckId);
  const back = view.deckId && deckById(view.deckId) ? `<a data-act="games" data-id="${view.deckId}">Games</a>` : '<a data-act="home">Home</a>';
  if (!ng) {
    const L = ngLang(), rng = S.settings.ngRange ?? 1, mode = S.settings.ngMode || 'hear';
    const sample = [7, 15, 42, 99, 365].map(n => `<span class="ng-chip"><b>${n}</b> ${esc(NG_WORDS[L](n))}</span>`).join('');
    return `<div class="crumbs">${back} / Numbers &amp; ABC</div>
      <h2 style="margin-bottom:4px">🔢 Numbers &amp; ABC</h2>
      <p class="muted" style="margin:0 0 14px">Practice numbers and the alphabet in the language you’re learning. No deck needed. Turn your sound on for the listening modes 🔊</p>
      <div class="panel stack">
        <div><b>Language</b><div class="ng-row">${Object.entries(NG_LANGS).map(([k, l]) => `<button type="button" class="btn sm ${k === L ? 'primary' : ''}" data-act="ngLang" data-k="${k}">${l.flag} ${l.name}</button>`).join('')}</div></div>
        <div><b>Numbers</b><div class="ng-modes">${Object.entries(NG_MODES).filter(([, m]) => !m.abc).map(([k, m]) => ngModeBtn(k, m, mode)).join('')}</div></div>
        <div><b>Alphabet</b><div class="ng-modes">${Object.entries(NG_MODES).filter(([, m]) => m.abc).map(([k, m]) => ngModeBtn(k, m, mode)).join('')}</div></div>
        ${NG_MODES[mode].abc && mode !== 'abcSpell' ? '' : `<div><b>Numbers from</b><div class="ng-row">${NG_RANGES.map(([label], i) => `<button type="button" class="btn sm ${i === rng ? 'primary' : ''}" data-act="ngRange" data-i="${i}">${label}</button>`).join('')}</div></div>`}
        <div class="row-between"><div class="muted small">10 questions · a peanut for every 3 right${S.ngBest?.[L + ':' + mode + ':' + rng] ? ` · your best: ${S.ngBest[L + ':' + mode + ':' + rng]}/10` : ''}</div>
          <button type="button" class="btn primary big" data-act="ngStart">Start ▶</button></div>
      </div>
      <details class="panel" style="margin-top:14px"><summary><b>📖 Cheat sheet: ${NG_LANGS[L].name}</b></summary>
        <div class="ng-sheet">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 30, 40, 50, 60, 70, 80, 90, 100, 200, 500, 1000].map(n => `<button type="button" class="ng-cell" data-act="ngSayIt" data-t="${esc(NG_WORDS[L](n))}"><b>${n}</b><span>${esc(NG_WORDS[L](n))}</span></button>`).join('')}</div>
        <div class="ng-sheet abc">${ngAbc(L).map(([l, nm]) => `<button type="button" class="ng-cell" data-act="ngSayIt" data-t="${esc(NG_LANGS[L].kana ? l : nm)}"><b>${NG_LANGS[L].kana ? l : l.toUpperCase() + l}</b><span>${esc(nm)}</span></button>`).join('')}</div>
        <p class="muted small">Tap any box to hear it. Examples: ${sample}</p></details>`;
  }
  if (ng.done) {
    const wrong = ng.log.filter(q => !q.ok);
    return `<div class="crumbs">${back} / Numbers &amp; ABC</div>
      <div class="panel stack" style="text-align:center"><div style="font-size:48px">${ng.right >= 9 ? '🏆' : ng.right >= 6 ? '🎉' : '💪'}</div>
        <h2 style="margin:0">${ng.right} / ${ng.total} right</h2>
        <p class="muted" style="margin:0">${NG_LANGS[ng.lang].flag} ${NG_LANGS[ng.lang].name} · ${NG_MODES[ng.mode].label}${ng.newBest ? ' · ⭐ new best!' : ''}${ng.nuts ? ` · +${ng.nuts} 🥜` : ''} · best streak ${ng.best}</p>
        ${wrong.length ? `<div class="ng-review">${wrong.map(q => `<button type="button" class="ng-cell wrong" data-act="ngSayIt" data-t="${esc(q.say && !q.spell ? q.say : q.answer)}"><b>${q.n != null ? q.n : q.letter ? (NG_LANGS[ng.lang].kana ? q.letter : q.letter.toUpperCase() + q.letter) : ''}</b><span>${esc(q.n != null ? NG_WORDS[ng.lang](q.n) : q.name || q.answer)}</span><small>you: ${esc(q.given || '—')}</small></button>`).join('')}</div>` : '<p>Perfect round! ✨</p>'}
        <div class="row" style="justify-content:center"><button type="button" class="btn primary" data-act="ngStart">Play again</button><button type="button" class="btn" data-act="ngSetup">Change mode</button></div></div>`;
  }
  const q = ng.q, done = q.given != null, M = NG_MODES[ng.mode];
  let prompt;
  if (ng.mode === 'hear' || ng.mode === 'abcHear') prompt = `<button type="button" class="btn big" data-act="ngReplay">🔊 Play again</button><button type="button" class="btn sm ghost" data-act="ngReplay" data-slow="1">🐢 Slower</button>`;
  else if (ng.mode === 'abcSpell') prompt = `<button type="button" class="btn big" data-act="ngReplay" data-slow="1">🔊 Spell it again</button>${done ? `<div class="ng-spell">${q.spell.map(c => `<i>${esc(c)}</i>`).join('')}</div>` : ''}`;
  else if (ng.mode === 'read') prompt = `<div class="ng-big word">${esc(q.word)}</div>`;
  else if (ng.mode === 'abcName') prompt = `<div class="ng-big">${NG_LANGS[ng.lang].kana ? q.letter : q.letter.toUpperCase() + ' ' + q.letter}</div>`;
  else prompt = `<div class="ng-big">${q.n}</div>`;
  const opts = ng.mode === 'type'
    ? `<form class="ng-typeform" id="ngForm"><input id="ngType" autocomplete="off" autocapitalize="off" spellcheck="false" lang="${NG_LANGS[ng.lang].tts}" placeholder="Type it in ${NG_LANGS[ng.lang].name}…" ${done ? 'disabled' : ''} value="${done ? esc(q.given) : ''}"><button type="submit" class="btn primary" ${done ? 'disabled' : ''}>Check</button></form>`
    : `<div class="ng-opts">${q.opts.map((o, i) => { const st = !done ? '' : o === q.answer ? 'right' : o === q.given ? 'wrong' : 'dim';
        return `<button type="button" class="ng-opt ${st}" data-act="ngPick" data-i="${i}" ${done ? 'disabled' : ''}><kbd>${i + 1}</kbd>${esc(o)}</button>`; }).join('')}</div>`;
  const verdict = !done ? '' : q.ok ? (q.accentMiss ? `✓ Right! Watch the spelling: <b>${esc(q.answer)}</b>` : '✓ Right!') : `✗ It’s <b>${esc(q.answer)}</b>${q.n != null && ng.mode !== 'type' && ng.mode !== 'word' && ng.mode !== 'abcSpell' ? ` · ${esc(NG_WORDS[ng.lang](q.n))}` : ''}`;
  return `<div class="study-top"><button type="button" class="btn ghost" data-act="ngSetup">← Quit</button>
      <div class="prompt-label muted">${NG_LANGS[ng.lang].flag} ${M.icon} ${M.label} · ${ng.i + 1}/${ng.total}</div><div class="muted">✓ ${ng.right} · 🔥 ${ng.streak}</div></div>
    <div class="panel ng-card"><div class="muted small">${esc(M.desc)}</div>
      <div class="ng-prompt">${prompt}</div>${opts}
      ${done ? `<div class="ng-verdict ${q.ok ? 'ok' : 'no'}">${verdict} <button type="button" class="btn sm ghost" data-act="ngSayIt" data-t="${esc(q.say && ng.mode !== 'abcSpell' ? q.say : q.answer)}">🔊</button></div>
        ${q.ok && !q.accentMiss ? '' : '<button type="button" class="btn primary" data-act="ngNext">Next ▶</button>'}` : ''}</div>`;
};
const ngModeBtn = (k, m, cur) => `<button type="button" class="ng-mode ${k === cur ? 'on' : ''}" data-act="ngMode" data-k="${k}"><span>${m.icon}</span><b>${m.label}</b><small>${m.desc}</small></button>`;
Object.assign(actions, {
  numGame: el => startNumGame(el?.dataset?.id),
  ngLang: el => { S.settings.ngLang = el.dataset.k; save(); render(); },
  ngMode: el => { S.settings.ngMode = el.dataset.k; save(); render(); },
  ngRange: el => { S.settings.ngRange = +el.dataset.i; save(); render(); },
  ngStart: () => {
    const mode = NG_MODES[S.settings.ngMode] ? S.settings.ngMode : 'hear';
    ng = { lang: ngLang(), mode, range: S.settings.ngRange ?? 1, i: 0, total: 10, right: 0, streak: 0, best: 0, log: [] };
    if (typeof trWakeAudio === 'function') trWakeAudio();
    ngQuestion(); render(); setTimeout(() => $('#ngType')?.focus(), 50);
  },
  ngSetup: () => { ng = null; render(); },
  ngPick: el => { if (ng?.q) ngAnswer(ng.q.opts[+el.dataset.i]); },
  ngNext: () => ngNext(),
  ngReplay: el => { if (ng?.q) ngSay(ng.q.say, !!el.dataset.slow || ng.mode === 'abcSpell'); },
  ngSayIt: el => { if (typeof speak === 'function') speak(el.dataset.t, NG_LANGS[ng?.lang || ngLang()].tts); },
});
document.addEventListener('submit', e => { if (e.target.id !== 'ngForm') return; e.preventDefault(); const v = $('#ngType')?.value || ''; if (v.trim()) ngAnswer(v.trim()); });
document.addEventListener('keydown', e => {
  if (view.name !== 'numgame' || !ng?.q || $('#dlg')?.open || /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
  if (ng.q.given == null && /^[1-4]$/.test(e.key) && ng.q.opts[+e.key - 1] != null) { e.preventDefault(); ngAnswer(ng.q.opts[+e.key - 1]); }
  else if (ng.q.given != null && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); ngNext(); }
  else if (e.key === 'r' || e.key === 'R') ngSay(ng.q.say, ng.mode === 'abcSpell');
});
