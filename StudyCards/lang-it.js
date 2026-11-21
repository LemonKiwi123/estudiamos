'use strict';
/* ================= Italian: the starter deck and auto-translate =================
   The Italian basics deck for the New deck window (starters.js), and Italian in 🌐 Auto-translate (translate.js): the
   Sentence Builder's Italian word lists count as "built-in words", and the Italian real sentences (data/real-it.json)
   help pick between two meanings. Loaded after translate.js. */
STARTERS.it = { name: 'Italian basics (sample)', flag: '🇮🇹', label: 'Italian', frontLang: 'it-IT', backLang: 'en-US', cards: [
  ['ciao', 'hi / bye'], ['buongiorno', 'good morning'], ['grazie', 'thank you'], ['per favore', 'please'], ['arrivederci', 'goodbye'], ['sì', 'yes'], ['no', 'no'],
  ['il cane', 'the dog'], ['il gatto', 'the cat'], ['la casa', 'the house'], ["l'acqua", 'the water', 'Feminine: l’acqua fredda'], ['il pane', 'the bread'], ['la mela', 'the apple'],
  ['il libro', 'the book'], ['la scuola', 'the school'], ["l'amico", 'the friend', 'Masculine (a female friend: l’amica)'], ['lo zaino', 'the backpack', 'Masculine: “lo” before z and s + consonant'],
  ['mangiare', 'to eat'], ['bere', 'to drink'], ['parlare', 'to speak'], ['andare', 'to go'], ['vedere', 'to see'], ['leggere', 'to read'],
  ['grande', 'big'], ['piccolo', 'small'], ['buono', 'good'], ['nuovo', 'new'], ['oggi', 'today'], ['domani', 'tomorrow'], ["Dov'è il bagno?", 'Where is the bathroom?']] };

/* the Italian sentence set helps decide between meanings, like the Spanish, French and Japanese ones */
if (typeof txCorpus === 'function') {
  const prevCorpus = txCorpus;
  txCorpus = async function (lang) {
    if (lang !== 'it') return prevCorpus(lang);
    return (txCorpusCache.it ||= fetch('data/real-it.json').then(r => r.ok ? r.json() : null).then(j => (j?.items || []).map(it => ({ src: String(it[1] || '').toLowerCase(), en: String(it[2] || '').toLowerCase() }))).catch(() => null));
  };
}
/* the Sentence Builder's Italian words as "built-in words" (nouns, adjectives, verb forms, little words) */
if (typeof txAppIndex === 'function') {
  const prevIndex = txAppIndex;
  txAppIndex = function (lang) {
    if (lang !== 'it' || txAppCache.it?.italian) return prevIndex(lang);
    const idx = prevIndex('it'), fwd = idx.fwd;
    const add = (w, en) => { w = String(w || '').toLowerCase().trim(); if (!w || !en) return; for (const g of String(en).split(/\s*\/\s*/)) { const t = g.trim(); if (!t) continue; if (!fwd.has(w)) fwd.set(w, []); if (!fwd.get(w).includes(t)) fwd.get(w).push(t); } };
    if (typeof IT_NOUN !== 'undefined') {
      for (const n of IT_NOUN) if (n[3] !== 'feel') { add(n[0], n[4]); add(n[1], n[5]); }
      for (const a of IT_ADJ) for (const w of a.slice(0, 4)) add(w, a[4]);
      for (const v of IT_VERB) { add(v[0], 'to ' + v[5]); v[1].forEach((f, i) => add(f, i === 2 ? v[6] : v[5])); }
      for (const a of [...IT_ADV, ...IT_CONJ]) add(a[0], a[1]);
      for (const p of IT_PRON) add(p[0], p[3]);
    }
    for (const [f, b] of STARTERS.it.cards) add(String(f).replace(/^(il|lo|la|i|gli|le|un|uno|una)\s+|^(l|un)['’]/i, ''), b);   // "il cane" → cane
    const back = new Map(); for (const [w, list] of fwd) for (const t of list) { const k = txKey(t); if (!k) continue; if (!back.has(k)) back.set(k, []); if (!back.get(k).includes(w)) back.get(k).push(w); }
    return (txAppCache.it = { fwd, back, italian: true });
  };
}
