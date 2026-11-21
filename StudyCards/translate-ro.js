'use strict';
/* ================= 🌐 Auto-translate: Romanian =================
   Romanian cards get the same help as Spanish and French (see translate.js): the Sentence Builder's Romanian words
   count as "built-in words", and the built-in Romanian sentences (data/real-ro.json) help pick between meanings.
   ş and ţ (cedilla) are looked up as ș and ț. Loaded after translate.js and builder-ro.js. */
{ const prevCorpus = txCorpus;
  txCorpus = function (lang) {
    if (lang !== 'ro') return prevCorpus(lang);
    return (txCorpusCache.ro ||= fetch('data/real-ro.json').then(r => r.ok ? r.json() : null)
      .then(j => (j?.items || []).map(it => ({ src: String(it[1] || '').toLowerCase(), en: String(it[2] || '').toLowerCase() }))).catch(() => null));
  }; }
{ const prevIndex = txAppIndex;
  txAppIndex = function (lang) {
    const idx = prevIndex(lang);
    if (lang !== 'ro' || idx.roWords || typeof RO_NOUN === 'undefined') return idx;
    idx.roWords = true;
    const add = (w, en) => { w = String(w || '').toLowerCase().trim(); if (!w || !en) return;
      if (!idx.fwd.has(w)) idx.fwd.set(w, []); if (!idx.fwd.get(w).includes(en)) idx.fwd.get(w).push(en);
      const k = txKey(en); if (!k) return; if (!idx.back.has(k)) idx.back.set(k, []); if (!idx.back.get(k).includes(w)) idx.back.get(k).push(w); };
    for (const n of RO_NOUN) { add(n[0], n[6]); add(n[1], 'the ' + n[6]); add(n[2], n[7]); add(n[3], n[7] && 'the ' + n[7]); }
    for (const a of RO_ADJ) for (const w of a.slice(0, 4)) add(w, a[4]);
    for (const v of RO_VERB) { add('a ' + v[0], 'to ' + v[5]); add(v[0], 'to ' + v[5]); v[1].forEach((f, i) => add(f, i === 2 ? v[6] : v[5])); }
    for (const a of [...RO_ADV, ...RO_PREP, ...RO_CONJ]) add(a[0], a[1]);
    return idx;
  }; }
{ const prevSuggest = txSuggest;
  txSuggest = function (text, from, to, opts) { return prevSuggest(txBase(from) === 'ro' ? String(text || '').replace(/ş/g, 'ș').replace(/ţ/g, 'ț').replace(/Ş/g, 'Ș').replace(/Ţ/g, 'Ț') : text, from, to, opts); }; }
