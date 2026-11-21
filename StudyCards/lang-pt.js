'use strict';
/* ================= Portuguese (Brazil and Portugal) in the smaller games =================
   🔢 Numbers & ABC: Brazil (dezesseis, dezenove) and Portugal (dezasseis, dezanove), each with its own voice.
   🎙️ Say it!: a card in one variant also accepts the other's word (ônibus / autocarro, trem / comboio, celular / telemóvel…),
     the other spelling (fato / facto, ação / acção) and "estou falando" / "estou a falar".
   ✨ Starter decks for both variants, and 🌐 Auto-translate knows the Sentence Builder's Portuguese words.
   Loaded after numgame.js, speakgame.js, starters.js, translate.js and builder-pt.js. */

/* ---------- 🔢 Numbers & ABC ---------- */
if (typeof NG_LANGS !== 'undefined') {
  NG_LANGS.pt.name = 'Portuguese (Brazil)';
  NG_LANGS['pt-PT'] = { name: 'Portuguese (Portugal)', flag: '🇵🇹', tts: 'pt-PT' };
  NG_WORDS['pt-PT'] = n => NG_WORDS.pt(n).replace(/dezesseis/g, 'dezasseis').replace(/dezessete/g, 'dezassete').replace(/dezenove/g, 'dezanove');
  NG_ABC['pt-PT'] = 'a:á b:bê c:cê d:dê e:é f:efe g:guê h:agá i:i j:jota k:capa l:ele m:eme n:ene o:ó p:pê q:quê r:erre s:esse t:tê u:u v:vê w:dâblio x:xis y:ípsilon z:zê';
  // a pt-PT deck starts in Portugal's numbers
  const prev = ngDefaultLang;
  ngDefaultLang = function (deckId) { const d = deckId && deckById(deckId); if (/^pt[-_]pt$/i.test(d?.frontLang || '')) return 'pt-PT'; return prev(deckId); };
}

/* ---------- 🎙️ Say it!: both variants count ---------- */
//            Brazil            Portugal
const PT_VARIANT_PAIRS = [['ônibus', 'autocarro'], ['trem', 'comboio'], ['celular', 'telemóvel'], ['café da manhã', 'pequeno-almoço'], ['suco', 'sumo'], ['sorvete', 'gelado'],
  ['cachorro', 'cão'], ['banheiro', 'casa de banho'], ['geladeira', 'frigorífico'], ['equipe', 'equipa'], ['esporte', 'desporto'], ['registro', 'registo'], ['fato', 'facto'],
  ['tela', 'ecrã'], ['xícara', 'chávena'], ['garoto', 'miúdo'], ['aeromoça', 'hospedeira'], 
  ['arquivo', 'ficheiro'], ['carona', 'boleia'], ['açougue', 'talho'], ['caminhão', 'camião'], ['bonde', 'elétrico'], ['pedestre', 'peão'], ['sanduíche', 'sandes'], ['conosco', 'connosco'],
  ['ação', 'acção'], ['direção', 'direcção'], ['ótimo', 'óptimo'], ['contato', 'contacto'], ['aspecto', 'aspeto'], ['receção', 'recepção'], ['econômico', 'económico'], ['tênis', 'ténis'], ['bebê', 'bebé'], ['gênero', 'género']];
const ptVariantAlts = text => {
  const t = String(text || ''), out = new Set([t]);
  for (const [b, p] of PT_VARIANT_PAIRS) for (const [x, y] of [[b, p], [p, b]]) { const re = new RegExp(`(?<![\\p{L}-])${x}(?![\\p{L}-])`, 'giu'); if (re.test(t)) out.add(t.replace(re, y)); }
  for (const s of [...out]) {
    out.add(s.replace(/(?<![\p{L}])(est\p{L}*) (\p{L}+?)(a|e|i)ndo(?![\p{L}])/gu, '$1 a $2$3r'));   // estou falando → estou a falar
    out.add(s.replace(/(?<![\p{L}])(est\p{L}*) a (\p{L}+?)(a|e|i)r(?![\p{L}])/gu, '$1 $2$3ndo'));   // estou a falar → estou falando
  }
  return [...out];
};
if (typeof skAnswers === 'function') {
  const prev = skAnswers;
  skAnswers = function (card, lang) {
    const base = prev(card, lang); if (lang !== 'pt') return base;
    const raw = plainSent(card.front).replace(/\([^)]*\)/g, ' ').split(/[\/,;|]|\bor\b/);
    return [...new Set([...base, ...raw.flatMap(ptVariantAlts).map(x => skNorm(x, lang)).filter(Boolean)])];
  };
}

/* ---------- ✨ Starter decks ---------- */
if (typeof STARTERS !== 'undefined') {
  const common = [['olá', 'hello'], ['obrigado', 'thank you', 'A woman says obrigada'], ['por favor', 'please'], ['tchau', 'bye', 'Portugal: adeus or até logo'], ['sim', 'yes'], ['não', 'no'],
    ['a casa', 'the house'], ['o gato', 'the cat'], ['a água', 'the water'], ['o pão', 'the bread'], ['a maçã', 'the apple'], ['o livro', 'the book'], ['a escola', 'the school'], ['o amigo', 'the friend', 'A female friend: a amiga'],
    ['comer', 'to eat'], ['beber', 'to drink'], ['falar', 'to speak'], ['ir', 'to go'], ['ver', 'to see'], ['ler', 'to read'], ['ser', 'to be', 'What someone or something is like: sou alto'], ['estar', 'to be', 'How or where someone is right now: estou cansado'],
    ['grande', 'big'], ['pequeno', 'small'], ['bom', 'good'], ['novo', 'new'], ['hoje', 'today'], ['amanhã', 'tomorrow']];
  STARTERS['pt-BR'] = { name: 'Portuguese basics: Brazil (sample)', flag: '🇧🇷', label: 'Portuguese (Brazil)', frontLang: 'pt-BR', backLang: 'en-US', cards: [...common,
    ['o cachorro', 'the dog'], ['o ônibus', 'the bus'], ['o trem', 'the train'], ['o celular', 'the cell phone'], ['o café da manhã', 'breakfast'], ['o suco', 'the juice'], ['o fato', 'the fact'],
    ['você', 'you', 'The everyday “you” in Brazil'], ['Eu estou falando.', 'I am speaking.'], ['Onde fica o banheiro?', 'Where is the bathroom?']] };
  STARTERS['pt-PT'] = { name: 'Portuguese basics: Portugal (sample)', flag: '🇵🇹', label: 'Portuguese (Portugal)', frontLang: 'pt-PT', backLang: 'en-US', cards: [...common.map(c => c[0] === 'tchau' ? ['adeus', 'goodbye', 'Also: até logo (see you later)'] : c),
    ['o cão', 'the dog'], ['o autocarro', 'the bus'], ['o comboio', 'the train'], ['o telemóvel', 'the cell phone'], ['o pequeno-almoço', 'breakfast'], ['o sumo', 'the juice'], ['o facto', 'the fact'],
    ['tu', 'you', 'The everyday “you” in Portugal (with family and friends)'], ['Eu estou a falar.', 'I am speaking.'], ['Onde é a casa de banho?', 'Where is the bathroom?']] };
}

/* ---------- 🌐 Auto-translate: the Sentence Builder's Portuguese words (both variants) ---------- */
if (typeof txAppIndex === 'function') {
  const prev = txAppIndex;
  txAppIndex = function (lang) {
    const r = prev(lang); if (lang !== 'pt' || r._pt) return r; r._pt = true;
    const { fwd, back } = r, add = (w, en) => { w = String(w || '').toLowerCase().trim(); if (!w || !en) return; for (const g of String(en).split(/\s*\/\s*/)) { const t = g.trim(); if (!t) continue;
      if (!fwd.has(w)) fwd.set(w, []); if (!fwd.get(w).includes(t)) fwd.get(w).push(t); const k = txKey(t); if (!k) continue; if (!back.has(k)) back.set(k, []); if (!back.get(k).includes(w)) back.get(k).push(w); } };
    if (typeof PT_NOUN !== 'undefined') for (const n of PT_NOUN) { if (n[3] === 'feel') continue; add(n[0], n[4]); add(n[1], n[5]); if (n[7]) { add(n[7][0], n[4]); add(n[7][1], n[5]); } }
    if (typeof PT_ADJ !== 'undefined') for (const a of PT_ADJ) for (const w of a.slice(0, 4)) add(w, a[4]);
    if (typeof PT_VERB !== 'undefined') for (const v of PT_VERB) { add(v[0], 'to ' + v[5]); add(ptInfOf(v[0]), 'to ' + v[5]); v[1].forEach((f, i) => add(f, i === 2 ? v[6] : v[5])); }
    for (const L of [typeof PT_ADV !== 'undefined' && PT_ADV, typeof PT_PREP !== 'undefined' && PT_PREP, typeof PT_CONJ !== 'undefined' && PT_CONJ]) for (const a of L || []) add(a[0], a[1]);
    for (const st of Object.values(typeof STARTERS !== 'undefined' ? STARTERS : {})) if (txBase(st.frontLang) === 'pt') for (const [f, b] of st.cards || []) add(String(f).replace(/^(o|a|os|as|um|uma)\s+/i, ''), b.replace(/^(the|a|an)\s+/i, ''));
    return r;
  };
}
