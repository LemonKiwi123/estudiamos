'use strict';
/* ================= Sentence Builder: Russian and Ukrainian (one East Slavic engine) =================
   builder-ru.js and builder-uk.js hold each language's words, endings and small differences and register themselves
   with esvRegister(), the way the Nordic engine serves Swedish, Norwegian and Danish.
   Word order is fairly free: the endings show who does what, so the checker (like the Latin one) works out what each
   ending can mean and tries every way they fit together. New sentences are made in the plain order (who – verb – what).
   Checked: three genders; six cases (nominative subject, accusative object, genitive "of" / after у, из, без, для, нет,
   dative "to / for" / after к, instrumental after с, prepositional (locative) after в, на, о) and the Ukrainian vocative
   for calling someone; animate accusative (вижу брата, большого кота); describing words and my / your agree with their
   noun in case, number and gender and come before it; the present tense by person; хотеть / мочь / любить + the
   infinitive; no "is" in the present (Я студент. Кошка большая. Книга на столе.); у меня есть … / у меня нет + genitive;
   в / на + prepositional for where and + accusative for where to; не right before the verb, and никогда не together.
   Verbs show their perfective partner in the word tag (читать → прочитать). Loaded after builder.js and builder-fr.js. */

const ESV = {};
const ESV_CASES = ['nom', 'gen', 'dat', 'acc', 'ins', 'loc'];
const ESV_KIND = { show: 'films', food: 'food', drink: 'drinks', read: 'things you read or write', thing: 'things', place: 'places', animal: 'animals', person: 'people', sound: 'songs and music', open: 'things you can open' };
const ESV_CAT = { show: 's', person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r', sound: 's' };
const esvStrip = s => String(s || '').normalize('NFD').replace(/[́̀]/g, '').normalize('NFC');
const esvCap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const esvAn = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
const esvGName = g => ({ m: 'masculine', f: 'feminine', n: 'neuter' })[g] || '';
const esvNumName = n => n === 'p' ? 'plural' : 'singular';

/* ---------- reading a language's word tables ----------
   noun: "nom,gen,dat,acc,ins,loc;the same for the plural (or -)|gender|kind|English|English plural|flags|English 'at'|English 'to'"
         a form can have a second spelling after "/" (братові/брату); flags: na (в → на for places), name (Mom, Dad: no "the"),
         v:… (the Ukrainian vocative), open (can be opened)
   adjective: "masculine|English|describes (p a f t l r s)"
   verb: "infinitive|six present forms|perfective|kind|what it takes|English|he/she form|who|flags"
         kind: tr · in · dat (its object is dative) · modal (мочь) · want (хотеть) · like (любить); flags: m = motion, d = to someone, ab = about */
function esvTables(L) {
  L.N = L.nouns.map(esvNounEntry);
  L.A = L.adjs.map(s => { const [m, en, d] = s.split('|'); return { m, en, d: d || 'patflrs', T: L.adjTable(m) }; });
  L.V = L.verbs.map(esvVerbEntry);
  L.P = L.poss.map(p => ({ ...p, T: p.inv ? null : esvTab(...p.t) }));
  L.prep.forEach(p => { p.takes = Object.keys(p.roles); });
  L.BASE = { n: L.N.length, a: L.A.length, v: L.V.length };
}
function esvNounEntry(line) {
  const [forms, g, cat, en, enPl, flags = '', enAt = '', enTo = ''] = line.split('|');
  const [sg, pl] = forms.split(';'), sgA = sg.split(','), plA = pl && pl !== '-' ? pl.split(',') : null, F = {};
  ESV_CASES.forEach((c, k) => { F['s' + c] = (sgA[k] || sgA[0]).split('/'); if (plA) F['p' + c] = (plA[k] || plA[0]).split('/'); });
  const fl = flags.split(' ').filter(Boolean), v = fl.find(x => x.startsWith('v:'));
  return { F, w: F.snom[0], g, cat, en, enPl: enPl || (plA ? bldPlEn(en) : null), mass: !plA, anim: cat === 'person' || cat === 'animal', na: fl.includes('na'),
    name: fl.includes('name'), open: fl.includes('open'), sex: fl.includes('sex') || fl.includes('name'), abs: fl.includes('abs'), voc: v ? v.slice(2).split('/') : null, enAt, enTo };
}
function esvVerbEntry(line) {
  const [inf, forms, pf, t, objs, en, en3, who, flags = '', note = ''] = line.split('|');
  return { inf, forms: forms.split(' '), pf: pf || '', note, t, objs: objs ? objs.split(',') : null, en, en3, who: who || 'a', fl: flags.split(' ').filter(Boolean),
    motion: flags.includes('m'), rec: /\bd\b/.test(flags), about: flags.includes('ab'), need: flags.includes('!') };
}
// a describing word's endings in one table: m and f have all six cases; n nominative (the rest are the m forms); p for every gender
function esvTab(m, f, nNom, p) {
  const M = m.split(' '), Fe = f.split(' '), P = p.split(' '), sp = x => String(x).split('/');
  return { m: { nom: sp(M[0]), gen: sp(M[1]), dat: sp(M[2]), ins: sp(M[3]), loc: sp(M[4]) }, f: { nom: sp(Fe[0]), gen: sp(Fe[1]), dat: sp(Fe[2]), acc: sp(Fe[3]), ins: sp(Fe[4]), loc: sp(Fe[5]) },
    n: { nom: sp(nNom) }, p: { nom: sp(P[0]), gen: sp(P[1]), dat: sp(P[2]), ins: sp(P[3]), loc: sp(P[4]) } };
}
/* every reading of a describing word: [{ w, c, n, g, an }]; an = true (animate) / false / null (doesn't matter).
   The accusative is the nominative for things and the genitive for people and animals (masculine one, and all plurals). */
function esvTabForms(T) {
  const out = [], put = (ws, c, n, g, an = null) => ws.forEach((w, k) => out.push({ w, c, n, g, an, alt: k > 0 }));
  for (const g of ['m', 'n']) for (const c of ['gen', 'dat', 'ins', 'loc']) put(T.m[c], c, 's', g);
  put(T.m.nom, 'nom', 's', 'm'); put(T.m.nom, 'acc', 's', 'm', false); put(T.m.gen, 'acc', 's', 'm', true);
  put(T.n.nom, 'nom', 's', 'n'); put(T.n.nom, 'acc', 's', 'n');
  for (const c of ESV_CASES) if (T.f[c]) put(T.f[c], c, 's', 'f');
  for (const c of ['nom', 'gen', 'dat', 'ins', 'loc']) put(T.p[c], c, 'p', null);
  put(T.p.nom, 'acc', 'p', null, false); put(T.p.gen, 'acc', 'p', null, true);
  return out;
}
// the form that matches a noun's reading (the first spelling)
function esvTabForm(T, c, n, g, an) {
  const r = esvTabForms(T).find(q => !q.alt && q.c === c && q.n === n && (n === 'p' || q.g === g) && (q.an == null || q.an === !!an));
  return r ? r.w : null;
}
const esvModForm = (t, c, n, g, an) => t.e.T ? esvTabForm(t.e.T, c, n, g, an) : t.w;
const esvNounForms = e => { const out = []; for (const n of ['s', 'p']) for (const c of ESV_CASES) (e.F[n + c] || []).forEach((w, k) => out.push({ w, c, n, alt: k > 0 })); return out; };
const esvNounForm = (e, c, n) => (e.F[n + c] || e.F['s' + c] || [null])[0];

/* ---------- chips ---------- */
const esvPfNote = (L, v) => v.pf ? ` · ${L.pfWord}: ${v.pf}` : '';
function esvNounChip(L, e, w, want) {
  const reads = esvNounForms(e).filter(f => f.w === w).map(f => ({ c: f.c, n: f.n }));
  const sg = reads.some(r => r.n === 's'), pl = reads.some(r => r.n === 'p');
  return chip({ k: 'noun', w, e, g: e.g, cat: e.cat, reads, rd: want || null, gloss: sg && pl ? `${e.en} / ${e.enPl}` : pl ? e.enPl : e.en });
}
const esvNoun = (L, e, c, n) => esvNounChip(L, e, esvNounForm(e, c, n), { c, n });
const esvVoc = (L, e) => chip({ k: 'noun', voc: true, w: e.voc[0], e, g: e.g, cat: e.cat, reads: [{ c: 'voc', n: 's' }], gloss: e.en + ' (calling them)' });
function esvAdjChip(L, a, w, want) { const reads = esvTabForms(a.T).filter(f => f.w === w); return chip({ k: 'adj', w, e: a, reads, rd: want || null, gloss: a.en }); }
const esvAdj = (L, a, c, n, g, an) => esvAdjChip(L, a, esvTabForm(a.T, c, n, g, an), { c, n, g });
function esvPossChip(L, p, w) {
  const reads = p.inv ? ESV_CASES.flatMap(c => [...['m', 'f', 'n'].map(g => ({ w, c, n: 's', g, an: null })), { w, c, n: 'p', g: null, an: null }]) : esvTabForms(p.T).filter(f => f.w === w);
  return chip({ k: 'det', fam: 'poss', w, e: p, reads, cls: 'poss', gloss: p.en });
}
const esvPoss = (L, p, c, n, g, an) => esvPossChip(L, p, p.inv ? p.w : esvTabForm(p.T, c, n, g, an));
function esvPronChip(L, w) {
  const reads = L.pron.filter(p => p[0] === w).flatMap(p => p[1].split(' ').map(c => ({ c, per: p[2], n: p[3], g: p[4] || null, en: p[5], only: p[6] || '' })));
  return chip({ k: 'pron', w, reads, eto: reads.some(r => r.only === 'eto'), gloss: [...new Set(reads.map(r => r.en))].join(' / ') });
}
const esvVNote = v => v.note ? ` (${v.note})` : '';
const esvVerb = (L, v, f) => chip({ k: 'verb', w: v.forms[f], e: v, f, gloss: `(${L.person[f]}) ${f === 2 ? v.en3 : v.en}${esvVNote(v)}${esvPfNote(L, v)}` });
const esvInf = (L, v) => chip({ k: 'verb', inf: true, w: v.inf, e: v, gloss: `to ${v.en}${esvVNote(v)}${esvPfNote(L, v)}` });
const esvEst = L => chip({ k: 'verb', w: L.est, e: { t: 'est' }, gloss: 'there is / (I) have' });
const esvNet = L => chip({ k: 'verb', w: L.net, e: { t: 'net' }, gloss: 'there is no / (I) don’t have' });
const esvPrep = (L, w) => { const p = L.prep.find(x => x.w.includes(w)); return chip({ k: 'prep', w, P: p, gloss: p.en }); };
const esvExPlace = L => L.N.find(n => n.cat === 'place' && !n.na);
const esvAdv = (L, w) => { const a = L.adv.find(x => x[0] === w); return chip({ k: 'adv', w, en: a[1], cls: a[2], gloss: a[1] }); };
const esvConj = (L, w) => { const c = L.conj.find(x => x[0] === w); return chip({ k: 'conj', w, cut: !c[2], gloss: c[1] }); };
const esvNeg = L => chip({ k: 'neg', w: L.neg, gloss: 'not' });
const esvVery = L => chip({ k: 'int', w: L.very, gloss: 'very' });

/* every chip a written word can be (for the tests and the real sentences) */
function esvChipsFor(L, word) {
  const w = String(word || '').toLowerCase(), out = [];
  for (const e of L.N) { if (esvNounForms(e).some(f => f.w === w)) out.push(esvNounChip(L, e, w)); if (e.voc?.includes(w)) out.push({ ...esvVoc(L, e), w }); }
  for (const a of L.A) if (esvTabForms(a.T).some(f => f.w === w)) out.push(esvAdjChip(L, a, w));
  for (const p of L.P) if (p.inv ? p.w === w : esvTabForms(p.T).some(f => f.w === w)) out.push(esvPossChip(L, p, w));
  if (L.pron.some(p => p[0] === w)) out.push(esvPronChip(L, w));
  for (const v of L.V) { v.forms.forEach((f, k) => { if (f === w && !out.some(o => o.k === 'verb' && o.e === v && o.f === k)) out.push(esvVerb(L, v, k)); }); if (v.inf === w) out.push(esvInf(L, v)); }
  if (w === L.est) out.push(esvEst(L)); if (w === L.net) out.push(esvNet(L));
  if (L.prep.some(p => p.w.includes(w))) out.push(esvPrep(L, w));
  if (L.adv.some(a => a[0] === w)) out.push(esvAdv(L, w));
  if (L.conj.some(c => c[0] === w)) out.push(esvConj(L, w));
  if (w === L.neg) out.push(esvNeg(L)); if (w === L.very) out.push(esvVery(L));
  return out;
}

/* ---------------- the checker ----------------
   "и" can join two words or two whole sentence parts: both are tried. "а" and "но" always start a new part. */
function esvCheck(L, T) {
  const clampAt = at => Math.max(0, Math.min(at, T.length - 1));
  const err = (msg, at = 0, end = false) => ({ ok: false, msg, at: clampAt(at), end: !!end || at >= T.length });
  if (!T.length) return err('Tap some words to build a sentence.');
  for (let k = 0; k < T.length; k++) {
    const t = T[k], nx = T[k + 1];
    if (t.k === 'conj' && k === 0) return err(`“${t.w}” (${t.gloss}) joins two parts, so it can’t start the sentence.`, 0);
    if (t.k === 'conj' && !nx) return err(`“${t.w}” (${t.gloss}) joins two parts, so something has to come after it.`, k, true);
    if (t.k === 'prep' && !nx) return err(`“${t.w}” (${t.gloss}) needs a noun or a pronoun right after it.`, k, true);
    if (t.k === 'prep' && !['noun', 'adj', 'det', 'pron', 'int'].includes(nx.k)) return err(`“${t.w}” (${t.gloss}) needs its noun right after it.`, k + 1);
    if (t.k === 'prep') { const m = L.prepForm(t.w, nx.w); if (m) return err(m, k); }
    if (t.k === 'neg' && !nx) return err(`“${L.neg}” (not) goes right before the word it makes negative, usually the verb.`, k, true);
    if (t.k === 'int' && !nx) return err(`“${L.very}” (very) goes right before a describing word, like “${L.very} ${L.A[0].m}”.`, k, true);
    if (t.k === 'int' && !['adj', 'adv', 'verb'].includes(nx.k)) return err(`“${L.very}” (very) goes right before a describing word (“${L.very} ${L.A[0].m}”), a word like “${L.adv.find(a => a[2] === 'how')[0]}”, or a verb.`, k);
    if (t.k === 'noun' && t.voc && k > 0 && !(k === T.length - 1)) return err(`“${t.w}” is the form for calling someone, so it goes at the start (or the end): “${esvCap(t.w)}, …”.`, k);
  }
  const ands = T.map((t, i) => t.k === 'conj' && !t.cut ? i : -1).filter(i => i >= 0).slice(0, 4);
  let best = null;
  for (let mask = 0; mask < (1 << ands.length); mask++) {
    const cut = new Set(T.map((t, i) => t.k === 'conj' && (t.cut || (mask & (1 << ands.indexOf(i)))) ? i : -1).filter(i => i >= 0));
    const parts = [[]], conjs = [];
    T.forEach((t, i) => { if (cut.has(i)) { conjs.push(t); parts.push([]); } else parts[parts.length - 1].push({ t, i }); });
    if (parts.some(p => !p.length)) continue;
    const res = parts.map(p => esvClause(L, p)), errs = res.flatMap(r => r.errs), miss = res.reduce((s, r) => s + r.miss, 0);
    const score = errs.length * 1000 + miss;
    if (!best || score < best.score) best = { score, errs, res, conjs };
    if (score === 0) break;
  }
  if (!best) return err(`Something is missing after “${L.and[0]}”.`, T.length - 1, true);
  if (best.errs.length) { const e = best.errs.sort((a, b) => a.at - b.at)[0]; return err(e.msg, e.at, e.end); }
  return { ok: true, P: { clauses: best.res.map(r => r.parse), conjs: best.conjs } };
}

/* one sentence part */
function esvClause(L, toks) {
  const errs = [], E = (msg, at, end) => errs.push({ msg, at, end: !!end });
  const out = () => ({ errs, miss: 0, parse: null });
  const lastAt = toks[toks.length - 1].i, CN = c => L.caseName[c];
  // 1. noun groups: (в) (мой) (очень) (большой) дом · (с) ним · a describing word on its own
  const groups = [], rest = [];
  for (let k = 0; k < toks.length;) {
    const x = toks[k];
    if (!['prep', 'det', 'adj', 'noun', 'pron'].includes(x.t.k) && !(x.t.k === 'int' && toks[k + 1]?.t.k === 'adj')) { rest.push(x); k++; continue; }
    const g = { pp: null, mods: [], very: [], noun: null, pron: null, first: x.i, last: x.i };
    if (x.t.k === 'prep') { g.pp = x; k++; }
    while (k < toks.length && (['det', 'adj'].includes(toks[k].t.k) || (toks[k].t.k === 'int' && toks[k + 1]?.t.k === 'adj'))) { const y = toks[k]; if (y.t.k === 'int') g.very.push(toks[k + 1]); else g.mods.push(y); k++; }
    const y = toks[k];
    if (y && y.t.k === 'noun') { g.noun = y; k++; }
    else if (y && y.t.k === 'pron' && !g.mods.length) { g.pron = y; k++; }
    g.last = toks[k - 1].i;
    if (!g.noun && !g.pron) {
      if (g.pp) { E(`“${g.pp.t.w}” (${g.pp.t.gloss}) needs a noun after it${g.mods.length ? `: “${g.pp.t.w} ${g.mods.map(m => m.t.w).join(' ')} …”` : ''}.`, g.mods.length ? g.mods[0].i : g.pp.i, true); return out(); }
      const poss = g.mods.find(m => m.t.k === 'det');
      if (poss) { E(`“${poss.t.w}” (${poss.t.gloss}) goes right before a noun: “${poss.t.w} ${L.N[0].w}”.`, poss.i); return out(); }
      if (g.mods.length > 1) { E('Use one describing word here, or put a noun after them.', g.mods[1].i); return out(); }
      g.loose = g.mods[0];   // "Кошка большая": what something is like
    }
    groups.push(g);
  }
  // "мама и папа": two noun groups joined by и
  for (let k = 0; k < rest.length; k++) {
    const c = rest[k]; if (c.t.k !== 'conj') continue;
    const a = groups.find(g => g.last === c.i - 1 && !g.loose && !g.coord), b = groups.find(g => g.first === c.i + 1 && !g.loose && !g.pp);
    if (!a || !b) { E(`“${c.t.w}” (and) joins two nouns, or two whole sentence parts. Put a word on each side of it.`, c.i); return out(); }
    groups.splice(groups.indexOf(b), 1); a.coord = b; a.conj = c; a.last = b.last; rest.splice(k--, 1);
  }
  // 2. what each group can be: the noun's endings that its describing words agree with
  for (const g of groups) {
    const R = esvGroupReads(L, g, E); if (!R) return out();
    if (g.coord) { const R2 = esvGroupReads(L, g.coord, E); if (!R2) return out(); g.ownReads = R; g.coord.reads = R2;
      const both = R.filter(r => R2.some(q => q.c === r.c)).map(r => ({ ...r, n: 'p', per: Math.min(r.per || 3, R2.find(q => q.c === r.c).per || 3), g: null }));
      if (!both.length) { E(`“${L.and[0]}” joins two words in the same case: put “${esvGroupText(g.coord)}” in the same form as “${esvGroupText(g)}”.`, g.coord.first); return out(); }
      g.reads = [...new Map(both.map(r => [r.c + r.per, r])).values()];
    } else g.reads = R;
    if (g.pp) {
      const P = g.pp.t.P, ok = g.reads.filter(r => P.takes.includes(r.c));
      if (!ok.length) { E(esvPrepCaseMsg(L, g), g.noun ? g.noun.i : g.pron ? g.pron.i : g.pp.i); return out(); }
      g.reads = ok;
    }
  }
  // 3. the verb
  const verbs = rest.filter(x => x.t.k === 'verb'), finite = verbs.filter(x => !x.t.inf), infs = verbs.filter(x => x.t.inf);
  if (finite.length === 2 && ['modal', 'want', 'like'].includes(finite[0].t.e.t) && finite[1].t.e.forms) { const v2 = finite[1].t; E(`After “${finite[0].t.w}”, use the basic form of the verb: “${v2.e.inf}”, not “${v2.w}”.`, finite[1].i); return out(); }
  if (finite.length > 1) { E(`One verb per sentence part. Use “${L.and[0]}” or “${L.conj.find(c => !c[2])[0]}” to join two sentences.`, finite[1].i); return out(); }
  if (infs.length > 1) { E('Use only one verb in its basic form (to …) here.', infs[1].i); return out(); }
  const V = finite[0]?.t || null, Vi = finite[0]?.i ?? null;
  const kind = !V ? 'zc' : V.e.t === 'est' ? 'est' : V.e.t === 'net' ? 'net' : 'verb';
  let A = V && kind === 'verb' ? V.e : null, Ai = Vi;
  if (kind === 'verb') {
    if (['modal', 'want', 'like'].includes(V.e.t) && infs.length) {
      if (['modal', 'want'].includes(infs[0].t.e.t)) { E(`“${infs[0].t.w}” doesn’t go with “${V.w}”. Pick another verb, like “${V.w} ${L.V.find(v => v.t === 'tr').inf}”.`, infs[0].i); return out(); }
      A = infs[0].t.e; Ai = infs[0].i;
    } else if (V.e.t === 'modal') { E(`“${V.w}” (can) needs a second verb in its basic form: “${V.w} ${L.V.find(v => v.t === 'in').inf}”.`, Vi, true); return out(); }
    else if (infs.length) { E(`“${infs[0].t.w}” is the basic form (to ${infs[0].t.e.en}). It goes after a verb like “${L.V.find(v => v.t === 'want').forms[0]}” (I want) or “${L.V.find(v => v.t === 'modal').forms[0]}” (I can). Or use “${infs[0].t.e.forms[V.f]}”.`, infs[0].i); return out(); }
  } else if (infs.length) {
    const v = infs[0].t.e;
    E(kind === 'zc' ? `“${infs[0].t.w}” is the basic form (to ${v.en}). Use a form like “${v.forms[0]}” (I ${v.en}) or “${v.forms[2]}” (he/she ${v.en3}).` : `“${infs[0].t.w}” doesn’t fit with “${V.w}”.`, infs[0].i, true); return out();
  }
  const negs = rest.filter(x => x.t.k === 'neg'), advs = rest.filter(x => x.t.k === 'adv'), never = advs.find(x => x.t.cls === 'never');
  const ints = rest.filter(x => x.t.k === 'int');
  if (negs.length > 1) { E(`Use “${L.neg}” only once.`, negs[1].i); return out(); }
  if (advs.filter(x => x.t.cls === 'freq' || x.t.cls === 'never').length > 1) { E('Use one word like “often” or “never” per sentence part.', advs.filter(x => ['freq', 'never'].includes(x.t.cls))[1].i); return out(); }
  for (const x of rest.filter(x => x.t.k === 'conj')) { E(`“${x.t.w}” joins two parts. Put a whole sentence part on each side of it.`, x.i); return out(); }
  // try every reading of every group
  const choices = groups.map(g => g.reads);
  let total = choices.reduce((s, c) => s * c.length, 1);
  for (let k = 0; total > 5000 && k < choices.length; k++) if (choices[k].length > 1) { total /= choices[k].length; choices[k] = [choices[k][0]]; }
  const ctx = { L, V, Vi, A, Ai, kind, negs, advs, never, ints, toks, infs, CN };
  let best = null;
  const pick = new Array(groups.length).fill(0);
  for (let combo = 0; combo < total; combo++) {
    let x = combo; for (let k = 0; k < groups.length; k++) { pick[k] = x % choices[k].length; x = Math.floor(x / choices[k].length); }
    const r = esvAssign(groups.map((g, k) => ({ ...g, r: choices[k][pick[k]] })), ctx);
    const score = r.errs.length * 1000 + r.miss;
    if (!best || score < best.score) best = { ...r, score };
    if (score === 0) break;
  }
  if (!groups.length) { const r = esvAssign([], ctx); best = { ...r, score: r.errs.length * 1000 }; }
  errs.push(...best.errs);
  return { errs, miss: best.miss, parse: best.parse };
}
const esvGroupText = g => [g.pp?.t.w, ...g.mods.map(m => m.t.w), g.noun?.t.w, g.pron?.t.w].filter(Boolean).join(' ');
/* the readings a noun group can have: [{ c, n, g, an, per }] */
function esvGroupReads(L, g, E) {
  if (g.loose) { const R = g.loose.t.reads.filter(q => q.c === 'nom').map(q => ({ c: 'nom', n: q.n, g: q.g, an: null, adj: true }));
    if (!R.length) E(`“${g.loose.t.w}” describes a noun: put the noun right after it.`, g.loose.i);
    return R.length ? R : null; }
  if (g.pron) {
    let R = g.pron.t.reads;
    if (g.pp) {
      const bad = R.filter(r => r.only === 'np'), good = R.filter(r => r.only !== 'np' && r.only !== 'eto');
      if (!good.length) { const fix = bad.length && L.ppForm[g.pron.t.w]; E(fix ? `After a preposition, “${g.pron.t.w}” becomes “${fix}”: “${g.pp.t.w} ${fix}”.` : `“${g.pron.t.w}” can’t go after “${g.pp.t.w}”.`, g.pron.i); return null; }
      R = good;
    } else {
      const good = R.filter(r => r.only !== 'pp');
      if (!good.length) { const fix = Object.keys(L.ppForm).find(k => L.ppForm[k] === g.pron.t.w); E(`“${g.pron.t.w}” is only used after a preposition (like “${L.prep.find(p => p.takes.includes(R[0].c))?.w[0] || L.prep[0].w[0]} ${g.pron.t.w}”).${fix ? ` On its own, say “${fix}”.` : ''}`, g.pron.i); return null; }
      R = good;
    }
    return R.map(r => ({ c: r.c, n: r.n, g: r.g, per: r.per, en: r.en, eto: r.only === 'eto', an: true }));
  }
  const N = g.noun.t, e = N.e;
  if (N.voc) { if (g.mods.length || g.pp) { E(`“${N.w}” is the form for calling someone. Here use “${e.w}”.`, N.i); return null; } return [{ c: 'voc', n: 's', g: e.g, an: true }]; }
  const R = N.reads.map(r => ({ c: r.c, n: r.n, g: e.g, an: e.anim, per: 3 }));
  const agrees = (m, r) => m.t.reads.some(q => q.c === r.c && q.n === r.n && (r.n === 'p' || q.g === r.g) && (q.an == null || q.an === r.an));
  const ok = R.filter(r => g.mods.every(m => agrees(m, r)));
  if (ok.length) return ok;
  // which reading was meant: the one most describing words fit (then the one the tray was made with)
  const scored = R.map(r => ({ r, s: g.mods.filter(m => agrees(m, r)).length * 2 + (N.rd && N.rd.c === r.c && N.rd.n === r.n ? 1 : 0) })).sort((a, b) => b.s - a.s);
  const r = scored[0].r, bad = g.mods.find(m => !agrees(m, r)), T = bad.t.k === 'det' ? (bad.t.e.T) : bad.t.e.T;
  const fix = T ? esvTabForm(T, r.c, r.n, r.g, r.an) : null;
  E(`“${bad.t.w}” has to match “${N.w}” (${L.caseName[r.c]} ${esvNumName(r.n)}${r.n === 's' ? ', ' + esvGName(r.g) : ''})${fix ? `: use “${fix}”` : ''}.`, bad.i);
  return null;
}
function esvPrepCaseMsg(L, g) {
  const P = g.pp.t.P, w = g.pp.t.w, N = g.noun?.t, ex = c => N ? esvNounForm(N.e, c, N.reads[0]?.n || 's') : null;
  if (!N) { const r = g.pron.t.reads[0], fix = L.pron.find(p => p[2] === r.per && p[3] === r.n && (p[4] || null) === (r.g || null) && p[1].split(' ').some(c => P.takes.includes(c)) && p[6] !== 'np' && p[6] !== 'eto');
    return fix ? `After “${w}”, use “${fix[0]}”: “${w} ${fix[0]}”.` : `“${g.pron.t.w}” can’t go after “${w}”.`; }
  if (P.takes.includes('loc') && P.takes.includes('acc')) return `“${w}” takes the ${L.caseName.loc} for where something is (“${w} ${ex('loc')}”) and the accusative for where it goes (“${w} ${ex('acc')}”).`;
  const c = P.takes[0];
  return `“${w}” (${P.en}) takes the ${L.caseName[c]}${P.takes[1] ? ` or the ${L.caseName[P.takes[1]]}` : ''}: “${w} ${ex(c)}”.`;
}
/* one reading: its problems and the sentence it means */
function esvAssign(G, C) {
  const { L, V, Vi, A, Ai, kind, negs, advs, never, toks, CN } = C, lastAt = toks[toks.length - 1].i;
  const errs = [], E = (msg, at, end) => errs.push({ msg, at, end: !!end });
  const T = g => esvGroupText(g), gw = g => g.noun?.t.w || g.pron?.t.w || g.loose?.t.w;
  // the reading the tray was made with comes first; "of" and "to" readings only when they're needed
  const miss = (kind === 'verb' ? Math.max(0, G.filter(g => !g.pp && g.r.c === 'nom').length - 1) * 3 : 0) + G.filter(g => g.noun?.t.rd && (g.noun.t.rd.c !== g.r.c || g.noun.t.rd.n !== g.r.n)).length * 10 + G.filter(g => ['gen', 'dat'].includes(g.r.c) && !g.pp).length;
  const pps = G.filter(g => g.pp), bare = G.filter(g => !g.pp);
  const byCase = c => bare.filter(g => g.r.c === c);
  const vocs = byCase('voc');
  for (const g of vocs) if (g.first !== toks[0].i && g.last !== toks[toks.length - 1].i) E(`“${gw(g)}” is the form for calling someone: put it at the start.`, g.first);
  const noms = byCase('nom'), accs = byCase('acc'), dats = byCase('dat'), gens = byCase('gen'), ins = byCase('ins'), locs = byCase('loc');
  for (const g of ins) E(`“${T(g)}” is ${CN('ins')}. Here it needs “${L.withW}” (with) before it.`, g.first);
  for (const g of locs) E(`“${T(g)}” is ${CN('loc')}. It goes after “${L.inW}”, “${L.onW}” or “${L.aboutW}”: “${L.inW} ${T(g)}”.`, g.first);
  // "книга брата": a genitive right after a noun is "of"
  const ofs = [], heads = G.filter(g => g.noun && !g.loose);
  const kids = new Set();
  for (const g of gens) {
    const h = heads.find(x => x !== g && x.last === g.first - 1);
    if (h && !(kind === 'net' && !ofs.length && false)) { ofs.push({ g, h }); kids.add(g); }
  }
  const freeGens = gens.filter(g => !kids.has(g));
  for (const { g, h } of ofs) if (h.mods.some(m => m.t.k === 'det')) E(`Use “${h.mods.find(m => m.t.k === 'det').t.w}” or “${T(g)}” (of …), not both.`, g.first);
  // places and adverbs
  const placeAdv = advs.find(x => x.t.cls === 'place'), destAdv = advs.find(x => x.t.cls === 'dest'), howAdv = advs.find(x => x.t.cls === 'how');
  let parse = { kind, V, A, f: V?.f, subj: null, pred: null, obj: null, dat: null, pps, ofs, advs, neg: negs.length > 0, never: !!never, toks, vocs };
  const isLoc = g => g.pp && g.pp.t.P.roles[g.r.c] === 'loc';
  const isUGen = g => g.pp && g.pp.t.P.roles[g.r.c] === 'at';
  // the prepositional phrases: right case for the verb, right kind of noun
  const motion = A?.motion;
  const exPlace = c => esvNounForm(L.N.find(n => n.cat === 'place' && !n.na), c, 's');
  for (const g of pps) {
    const P = g.pp.t.P, w = g.pp.t.w, N = g.noun?.t, cat = N ? N.cat : g.r.eto ? 'thing' : 'person', place = cat === 'place', role = P.roles[g.r.c], rest = T(g).split(' ').slice(1).join(' ');
    if (role === 'dest') {
      if (!motion) E(`“${w}” + accusative (${w} ${rest}) means where something goes, so it needs a verb like “${L.V.find(v => v.motion).forms[0]}” (I go). For where something is, use the ${CN('loc')}${N ? `: “${w} ${esvNounForm(N.e, 'loc', g.r.n)}”` : ''}.`, g.first);
      else if (!place) E(`“${w}” here needs a place after it, like “${w} ${exPlace('acc')}”.`, g.first);
    }
    if (role === 'loc') {
      if (motion) E(`With “${V.w}” (going somewhere), “${w}” takes the accusative for where to${N ? `: “${w} ${esvNounForm(N.e, 'acc', g.r.n)}”` : ''}.`, g.first);
      else if (!N || !['place', 'thing'].includes(cat)) E(`“${w}” (${P.en}) goes with a place or a thing here, like “${w} ${exPlace('loc')}”.`, g.first);
    }
    if ((role === 'loc' || role === 'dest') && N && place) {
      const want = N.e.na ? L.onW : L.inW;
      if (!P.w.includes(want)) E(`${L.name} says “${want} ${esvNounForm(N.e, g.r.c, g.r.n)}”, not “${w} ${N.w}”.`, g.pp.i);
    }
    if (role === 'to' && !motion) E(`“${w}” (to) needs a verb of going, like “${L.V.find(v => v.motion).forms[0]}” (I go).`, g.pp.i);
    if (role === 'to' && N && !['person', 'place', 'animal'].includes(cat)) E(`“${w}” (to) goes with a person or a place here.`, g.first);
    if (role === 'from' && !motion) E(`“${w}” (from) needs a verb of going, like “${L.V.find(v => v.motion).forms[0]}” (I go).`, g.pp.i);
    if (role === 'from' && !(N && place)) E(`“${w}” (from) goes with a place here, like “${w} ${exPlace('gen')}”.`, g.first);
    if (role === 'with' && N && !['person', 'animal', 'food', 'drink'].includes(cat)) E(`“${w}” (with) goes with people or animals here: “${w} ${esvNounForm(L.N.find(n => n.cat === 'person'), 'ins', 's')}”.`, g.first);
    if (role === 'about' && !(A?.about)) E(`“${w}” (about) goes with a verb like “${L.V.find(v => v.about).forms[0]}” (I ${L.V.find(v => v.about).en}).`, g.pp.i);
    if ((role === 'about' || role === 'at' || role === 'with') && g.r.eto) E(`That doesn’t fit after “${w}”.`, g.first);
    if (role === 'at' && N && !['person', 'animal'].includes(cat)) E(`“${w}” + genitive (at someone’s) goes with a person here: “${w} ${esvNounForm(L.N.find(n => n.cat === 'person'), 'gen', 's')}”.`, g.first);
    if (role === 'at' && kind === 'verb' && motion) E(`“${w} ${rest}” is where someone is. With “${V.w}”, say where to.`, g.first);
  }
  if (destAdv && !motion) E(`“${destAdv.t.w}” (${destAdv.t.en}, where to) needs a verb of going${L.homeAt ? `. For where someone is, use “${L.homeAt}”` : ''}.`, destAdv.i);
  if (placeAdv && motion && placeAdv.t.w === L.homeAt) E(`With “${V.w}” (going somewhere), use “${L.homeTo}” (home), not “${L.homeAt}” (at home).`, placeAdv.i);
  // negation: не right before the verb (or, with no verb, before what something is)
  const negOK = nx => {
    if (!negs.length) return true;
    const n = negs[0], k = toks.findIndex(x => x.i === n.i), next = toks[k + 1];
    return next && nx(next);
  };
  if (kind === 'verb') {
    // who does it
    const subj = noms.filter(g => !g.loose), loose = noms.filter(g => g.loose);
    for (const g of loose) E(`“${g.loose.t.w}” describes a noun, so it goes right before it: “${g.loose.t.w} ${L.N.find(n => n.g === (g.r.g || 'm'))?.w || ''}”.`, g.first);
    if (subj.length === 2 && ['tr', 'want', 'like', 'dat'].includes(A.t) && !accs.length && !(A.t === 'dat' && dats.length)) {
      const vf0 = V.f, fitsV = g => (g.r.per || 3) === vf0 % 3 + 1 && g.r.n === (vf0 < 3 ? 's' : 'p');
      const o = subj.find(g => !g.pron && !fitsV(g) && g !== subj.find(fitsV)) || subj.find(g => !g.pron && g !== subj[0]) || subj[1], c = A.t === 'dat' ? 'dat' : 'acc';
      const fix = o.noun ? [...o.mods.map(m => esvModForm(m.t, c, o.r.n, o.r.g, o.r.an) || m.t.w), esvNounForm(o.noun.t.e, c, o.r.n)].join(' ') : null;
      E(`“${T(o)}” is what ${A.t === 'dat' ? 'gets the help or the call' : 'the action is done to'}, so it goes in the ${CN(c)}${fix ? `: “${fix}”` : ''}.`, o.first);
      subj.splice(subj.indexOf(o), 1);
    }
    if (subj.length > 1) E(`Two subjects: “${T(subj[0])}” and “${T(subj[1])}” are both nominative. Join them with “${L.and[0]}”, or change one of them to another case.`, subj[1].first);
    const s = subj[0] || null;
    if (s && s.r.eto) E(`“${s.pron.t.w}” (this) goes in sentences like “${esvCap(s.pron.t.w)} ${L.N[0].w}” (This is a …). Use “${L.pron.find(p => p[2] === 3 && p[1] === 'nom' && p[4] === 'm')[0]}” or “${L.pron.find(p => p[2] === 3 && p[1] === 'nom' && p[4] === 'f')[0]}” here.`, s.first);
    const per = s ? s.r.per || 3 : null, num = s ? s.r.n : null, vf = V.f, vPer = vf % 3 + 1, vNum = vf < 3 ? 's' : 'p';
    if (s && (per !== vPer || num !== vNum)) E(`“${V.w}” doesn’t match “${T(s)}”. Use “${V.e.forms[(per - 1) + (num === 'p' ? 3 : 0)]}”.`, Vi);
    if (!s && vPer === 3) E(`Who does it? Add a word like “${L.pron.find(p => p[1] === 'nom' && p[2] === 3)[0]}” or “${esvNounForm(L.N[0], 'nom', 's')}” for “${V.w}”.`, Vi);
    if (s && s.noun && !s.coord) {
      const c = s.noun.t.cat;
      if (c !== 'person' && c !== 'animal') E(`That doesn’t make sense: ${s.r.n === 'p' ? s.noun.t.e.enPl : esvAn(s.noun.t.e.en) + ' ' + s.noun.t.e.en} can’t ${A.en}. Use a person or an animal here.`, s.first);
      else if (c === 'animal' && A.who === 'p') E(`That doesn’t make sense: only people ${A.en}.`, s.first);
    }
    // the object: accusative (or dative for помогать / звонить)
    const objCase = A.t === 'dat' ? 'dat' : 'acc', takesObj = ['tr', 'want', 'like', 'dat'].includes(A.t);
    const objs = objCase === 'acc' ? accs : dats, others = objCase === 'acc' ? dats : accs;
    let obj = null;
    if (takesObj) {
      objs.forEach((g, k) => { if (!k) { obj = g; return; }
        if (A.rec && g.noun && ['person', 'animal'].includes(g.noun.t.cat)) E(`“${T(g)}” is who gets it (to whom), so it goes in the dative: “${[...g.mods.map(m => esvModForm(m.t, 'dat', g.r.n, g.r.g, g.r.an) || m.t.w), esvNounForm(g.noun.t.e, 'dat', g.r.n)].join(' ')}”.`, g.first);
        else E(`Only one object here. To have two, join them with “${L.and[0]}”.`, g.first); });
      if (obj) {
        const cats = A.objs || ['*'], fits = x => cats.includes('*') || (x.pron ? cats.includes('person') : cats.includes(x.noun.t.cat) || (cats.includes('open') && x.noun.t.e.open));
        if (!(obj.coord ? [obj, obj.coord] : [obj]).every(fits)) E(`That doesn’t make sense: “${A.forms[0]}” (${A.en}) goes with ${cats.map(c => ESV_KIND[c]).join(' or ')}.`, obj.first);
        if (obj.r.eto) E(`Here, say what it is instead of “${obj.pron.t.w}”.`, obj.first);
      } else if (A.need) E(`“${V.w}” (${A.en}) needs ${objCase === 'dat' ? 'someone in the dative (to whom)' : 'an object (who or what)'}: for example “${V.w} ${esvExampleObj(L, A)}”.`, Ai, true);
    } else for (const g of objs) E(`“${A.forms[0]}” (${A.en}) doesn’t take an object, so “${T(g)}” (${CN(objCase)}) doesn’t fit here.${motion && g.noun ? ` To say where to, put “${g.noun.t.e.na ? L.onW : L.inW}” before it: “${g.noun.t.e.na ? L.onW : L.inW} ${T(g)}”.` : ''}`, g.first);
    let dat = null;
    for (const g of others) {
      if (objCase === 'acc' && A.rec && !dat) { dat = g; if (g.noun && !['person', 'animal'].includes(g.noun.t.cat)) E(`“${T(g)}” is dative (to / for someone): use a person here.`, g.first); }
      else if (objCase === 'dat') E(`“${A.forms[0]}” (${A.en}) takes the dative: “${V.w} ${esvExampleObj(L, A)}”, not the accusative.`, g.first);
      else E(`“${T(g)}” is dative (to / for someone), and “${A.forms[0]}” (${A.en}) doesn’t take one.`, g.first);
    }
    for (const g of freeGens) E(`“${T(g)}” is genitive (“of …”). It goes right after the noun it belongs to, like “${esvNounForm(L.N.find(n => n.cat === 'read'), 'nom', 's')} ${T(g)}”.`, g.first);
    if (!negOK(nx => nx.t.k === 'verb')) E(`“${L.neg}” goes right before the verb: “${L.neg} ${toks.find(x => x.t.k === 'verb' && (x.t.inf || x.i === Vi) && x.i > negs[0].i)?.t.w || V.w}”.`, negs[0].i);
    if (never && !negs.length) E(`${L.name} says “${never.t.w} ${L.neg}” together: “${never.t.w} ${L.neg} ${V.w}” (never ${A.en}).`, never.i);
    parse = { ...parse, subj: s, obj, dat };
    return { errs, miss: miss + (s ? 0 : 1), parse };
  }
  // no verb in the present: "Я студент." "Кошка большая." "Книга на столе." "У меня есть кошка."
  for (const g of [...accs, ...dats]) E(`“${T(g)}” is ${CN(g.r.c)}, and nothing here takes it.${kind === 'zc' ? ` To say what someone does, add a verb.` : ''}`, g.first);
  if (howAdv) E(`“${howAdv.t.w}” (${howAdv.t.en}) needs a verb to describe.`, howAdv.i);
  if (destAdv) E(`“${destAdv.t.w}” (where to) needs a verb of going.`, destAdv.i);
  const where = pps.filter(g => isLoc(g) || isUGen(g));
  if (kind === 'est' || kind === 'net') {
    const owner = where[0] || null, place = owner || (placeAdv ? { adv: placeAdv } : null);
    if (!place) E(`“${V.w}” needs who has it (“${L.atW} ${L.meGen} ${V.w} …”) or where (“${L.inW} ${esvNounForm(esvExPlace(L), 'loc', 's')} ${V.w} …”).`, Vi);
    if (kind === 'est') {
      if (negs.length) E(`For “not have” or “there is no”, ${L.name} uses “${L.net}” + genitive, not “${L.neg} ${V.w}”.`, negs[0].i);
      const things = noms.filter(g => !g.loose);
      if (!things.length) E(`What is there? Add a noun after “${V.w}” (in the nominative): “${V.w} ${esvNounForm(L.N.find(n => n.cat === 'animal'), 'nom', 's')}”.`, Vi, true);
      if (things.length > 1) E(`Use one noun here (or join two with “${L.and[0]}”).`, things[1].first);
      for (const g of noms.filter(g => g.loose)) E(`“${g.loose.t.w}” describes a noun, so it goes right before it.`, g.first);
      for (const g of freeGens) E(`After “${V.w}”, the noun stays in the nominative${g.noun ? `: “${esvNounForm(g.noun.t.e, 'nom', g.r.n)}”` : ''}.`, g.first);
      parse = { ...parse, subj: things[0] || null, owner, place };
    } else {
      if (negs.length) E(`“${V.w}” already means “there is no”: leave out “${L.neg}”.`, negs[0].i);
      for (const g of noms) E(`After “${V.w}” (there is no), the noun is genitive${g.noun ? `: “${V.w} ${esvNounForm(g.noun.t.e, 'gen', g.noun.t.e.mass ? 's' : g.r.n)}”` : ''}.`, g.first);
      if (!freeGens.length && !noms.length) E(`What isn’t there? Add a noun in the genitive after “${V.w}”: “${V.w} ${esvNounForm(L.N.find(n => n.cat === 'food' && n.mass), 'gen', 's')}”.`, Vi, true);
      if (freeGens.length > 1) E('Use one noun here.', freeGens[1].first);
      parse = { ...parse, subj: freeGens[0] || null, owner, place };
    }
    if (never) E(`“${never.t.w}” needs a verb.`, never.i);
    return { errs, miss, parse };
  }
  // zero "is": who + what they are (a noun, a describing word, a place)
  for (const g of freeGens) E(`“${T(g)}” is genitive (“of …”). It goes right after the noun it belongs to.`, g.first);
  const full = noms.filter(g => !g.loose), loose = noms.filter(g => g.loose);
  const s = full[0] || null;
  if (!s) {
    if (loose.length) E(`“${loose[0].loose.t.w}” describes a noun: put the noun right after it, or say who or what is ${loose[0].loose.t.e.en} (“${esvCap(esvNounForm(L.N.find(n => n.g === 'f' && n.cat === 'animal') || L.N[0], 'nom', 's'))} ${esvTabForm(loose[0].loose.t.e.T, 'nom', 's', 'f')}”).`, loose[0].first, true);
    else E(`Every sentence needs a verb (an action word like “${L.V.find(v => v.t === 'tr').forms[0]}”)${L.zeroNote}.`, lastAt, true);
    return { errs, miss, parse };
  }
  let pred = null;
  if (full.length > 2) E(`“${T(full[2])}” is nominative too. A sentence part has one “who” and one “what”.`, full[2].first);
  if (full[1]) pred = { noun: full[1] };
  if (loose[0]) { if (pred) E(`“${loose[0].loose.t.w}” describes a noun, so it goes right before it: “${loose[0].loose.t.w} ${gw(pred.noun)}”.`, loose[0].first); else pred = { adj: loose[0] }; }
  if (loose[1]) E('Use one describing word here.', loose[1].first);
  if (!pred && where.length) pred = { pp: where[0] };
  if (!pred && placeAdv) pred = { adv: placeAdv };
  const withPP = pps.find(g => g.pp.t.P.roles[g.r.c] === 'with');
  if (!pred && withPP) pred = { pp: withPP };
  if (!pred) { E(`Say what ${s.r.eto ? 'this is' : `“${T(s)}” is`}${s.r.eto ? `: “${esvCap(s.pron.t.w)} ${esvNounForm(L.N.find(n => n.cat === 'read'), 'nom', 's')}”` : ` (a noun, a describing word or a place), or add a verb`}.`, lastAt, true); return { errs, miss, parse }; }
  for (const g of where) if (g !== pred.pp && pred.pp) { /* a second place is fine: "Мама дома" + "в городе" rarely; leave it */ }
  // what goes with what
  const sP = s.pron ? s.r : null, sCat = s.pron ? (s.r.eto ? '*' : 'person') : s.noun.t.cat;
  if (pred.noun) {
    const p = pred.noun, pc = p.pron ? 'person' : p.noun.t.cat;
    if (p.r.eto || (p.pron && !s.r.eto)) E(`Put “${T(p)}” first: it says who.`, p.first);
    else if (s.r.eto) { /* это книга: anything */ }
    else if (pc === 'person' && sCat !== 'person') E(`That doesn’t make sense: ${s.noun.t.e.en} can’t be a person.`, p.first);
    else if (pc !== 'person' && sCat === 'person') E(`That doesn’t make sense. To say what this is, start with “${L.eto}”: “${esvCap(L.eto)} ${T(p)}”.`, s.first);
    else if (pc !== 'person' && !s.r.eto) E(`To say what this is, start with “${L.eto}”: “${esvCap(L.eto)} ${T(p)}”.`, s.first);
    if (!s.r.eto && p.r.n !== s.r.n && !p.noun?.t.e.mass) E(`“${T(s)}” and “${T(p)}” should both be ${esvNumName(s.r.n)}.`, p.first);
    const sg = s.pron ? s.r.g : s.noun?.t.e.sex ? s.noun.t.e.g : null;
    if (!s.r.eto && p.noun?.t.e.sex && sg && sg !== p.noun.t.e.g && s.r.n === 's') E(`That doesn’t make sense: “${T(s)}” and “${T(p)}” don’t match (${esvGName(sg)} and ${esvGName(p.noun.t.e.g)}).`, p.first);
  } else if (pred.adj) {
    const a = pred.adj.loose.t, okR = a.reads.filter(q => q.c === 'nom' && q.n === s.r.n && (s.r.n === 'p' || !s.r.g ? true : q.g === s.r.g));
    if (s.r.eto) E(`After “${s.pron.t.w}” (this is), say what it is with a noun: “${esvCap(s.pron.t.w)} ${a.w} ${esvNounForm(L.N.find(n => n.g === (a.reads[0]?.g || 'm')) || L.N[0], 'nom', 's')}”.`, pred.adj.first);
    else if (!okR.length || (s.r.n === 's' && !s.r.g && !a.reads.some(q => q.c === 'nom' && q.n === 's' && q.g !== 'n'))) {
      const fix = esvTabForm(a.e.T, 'nom', s.r.n, s.r.g || 'm', null), fixF = !s.r.g && s.r.n === 's' ? esvTabForm(a.e.T, 'nom', 's', 'f', null) : null;
      E(`“${a.w}” has to match “${T(s)}”: use “${fix}”${fixF ? ` (or “${fixF}” for a woman or a girl)` : ''}.`, pred.adj.first);
    } else if (!a.e.d.includes(ESV_CAT[sCat] || 'p')) E(`That doesn’t make sense: “${a.e.m}” (${a.e.en}) doesn’t describe ${s.pron ? s.r.en === 'I' ? 'a person' : 'a person' : ESV_KIND[sCat] || 'that'}.`, pred.adj.first);
    pred.g = okR[0]?.g || s.r.g;
  }
  // не before what something is
  const predFirst = pred.noun ? pred.noun.first : pred.adj ? pred.adj.first : pred.pp ? pred.pp.first : pred.adv.i;
  if (!negOK(nx => nx.i === predFirst)) E(`“${L.neg}” goes right before what you say isn’t so: “${L.neg} ${toks.find(x => x.i === predFirst)?.t.w}”.`, negs[0].i);
  if (never) E(`“${never.t.w}” needs a verb.`, never.i);
  parse = { ...parse, subj: s, pred };
  return { errs, miss, parse };
}
function esvExampleObj(L, A) {
  const cats = A.objs || ['*'];
  if (A.t === 'dat') return esvNounForm(L.N.find(n => n.cat === 'person' && n.name) || L.N[0], 'dat', 's');
  const n = L.N.find(x => cats.includes('*') ? x.cat === 'read' : cats.includes(x.cat) || (cats.includes('open') && x.open));
  return n ? esvNounForm(n, 'acc', 's') : esvNounForm(L.N[0], 'acc', 's');
}

/* ---------------- the English meaning of a correct sentence ---------------- */
function esvEnglish(L, P) {
  const one = C => {
    const toks = C.toks, veryOf = x => { const k = toks.findIndex(y => y.i === x.i); return k > 0 && toks[k - 1].t.k === 'int' ? 'very ' : ''; };
    const ofs = C.ofs || [];
    // a noun group in English; how: subj · obj · pred · pp
    const np = (g, how = 'subj') => {
      if (!g) return '';
      if (g.coord) { const own = (R, c) => R?.find(x => x.c === c) || R?.[0] || g.r; const a = np({ ...g, coord: null, r: own(g.ownReads, g.r.c) }, how), b = np({ ...g.coord, r: own(g.coord.reads, g.r.c) }, how); return `${a} and ${b}`; }
      if (g.pron) return g.r.eto ? 'this' : how === 'subj' ? g.r.en : esvObjEn(g.r);
      const N = g.noun.t, e = N.e, pl = g.r.n === 'p' && !e.mass;
      const poss = g.mods.find(m => m.t.k === 'det'), adjs = g.mods.filter(m => m.t.k === 'adj').map(m => veryOf(m) + m.t.e.en);
      let base = (adjs.length ? adjs.join(', ') + ' ' : '') + (pl ? e.enPl : e.en);
      const of = ofs.find(o => o.h === g);
      if (of) { const o = np(of.g, 'pp').replace(/^the /, ''); const owner = /s$/.test(o) ? o + '’' : o + '’s'; return `${of.g.noun && !of.g.noun.t.e.name && !of.g.mods.length ? 'the ' : ''}${owner} ${base}`; }
      if (poss) return poss.t.e.en + ' ' + (e.name && !adjs.length ? base.toLowerCase() : base);
      if (e.name && !adjs.length && !pl) return base;
      if (e.name) base = (adjs.length ? adjs.join(', ') + ' ' : '') + e.en.toLowerCase();
      if (how === 'pred' || how === 'have' || (how === 'obj' && !e.anim)) return pl || e.mass ? base : `${esvAn(base)} ${base}`;
      return 'the ' + base;
    };
    const ppEn = g => {
      const P = g.pp.t.P, N = g.noun?.t, e = N?.e, c = g.r.c, role = P.roles[c];
      const inner = () => np({ ...g, pp: null }, 'pp');
      if (role === 'loc') { if (e?.enAt && !g.mods.length && g.r.n === 's') return e.enAt; return (e?.cat !== 'place' && P.w.includes(L.onW) ? 'on ' : e?.na ? 'at ' : 'in ') + inner(); }
      if (role === 'dest') { if (e?.enTo && !g.mods.length && g.r.n === 's') return e.enTo; return 'to ' + inner(); }
      if (role === 'at') { const o = inner(); return 'at ' + (/s$/.test(o) ? o + '’' : o + '’s'); }
      if (role === 'to') return N && e.cat === 'place' ? (e.enTo && !g.mods.length && g.r.n === 's' ? e.enTo : 'to ' + inner()) : 'to see ' + inner();
      return ({ with: 'with', from: 'from', about: 'about', without: 'without', for: 'for' })[role] + ' ' + inner();
    };
    const who3 = C.subj ? !C.subj.coord && (C.subj.pron ? (C.subj.r.per === 3 && C.subj.r.n === 's') : C.subj.r.n === 's') : C.f === 2;
    const advs = C.advs || [], freq = advs.filter(x => x.t.cls === 'freq').map(x => x.t.en), time = advs.filter(x => x.t.cls === 'time').map(x => x.t.en);
    const how = advs.filter(x => x.t.cls === 'how').map(x => veryOf(x) + x.t.en), place = advs.filter(x => ['place', 'dest'].includes(x.t.cls)).map(x => x.t.en), too = advs.some(x => x.t.cls === 'too');
    const tail = [...place, ...time].join(' ') + (too ? ' too' : '');
    const voc = (C.vocs || []).map(g => g.noun.t.e.en.replace(/^\w/, s => s.toUpperCase()));
    let s;
    if (C.kind === 'verb') {
      const who = C.subj ? np(C.subj, 'subj') : L.personEn[C.f], A = C.A, V = C.V.e;
      let vp;
      const base = A.en, s3 = A.en3, f3 = who3;
      if (V.t === 'modal' && A !== V) vp = `${C.never ? 'can never' : C.neg ? 'cannot' : 'can'} ${freq.join(' ')} ${base}`;
      else if (V.t === 'want' && A !== V) vp = C.never ? `never ${f3 ? 'wants' : 'want'} to ${base}` : C.neg ? `${f3 ? 'does' : 'do'} not want to ${base}` : `${freq.length ? freq.join(' ') + ' ' : ''}${f3 ? 'wants' : 'want'} to ${base}`;
      else if (V.t === 'like' && A !== V) vp = C.never ? `never ${f3 ? 'likes' : 'like'} to ${base}` : C.neg ? `${f3 ? 'does' : 'do'} not like to ${base}` : `${freq.length ? freq.join(' ') + ' ' : ''}${f3 ? 'likes' : 'like'} to ${base}`;
      else vp = C.never ? `never ${f3 ? s3 : base}` : C.neg ? `${f3 ? 'does' : 'do'} not${freq.length ? ' ' + freq.join(' ') : ''} ${base}` : `${freq.length ? freq.join(' ') + ' ' : ''}${f3 ? s3 : base}`;
      if (C.obj) vp += ' ' + np(C.obj, A.en === 'have' ? 'have' : 'obj');
      if (C.dat) vp += ' to ' + np(C.dat, 'pp');
      if (how.length) vp += ' ' + how.join(' ');
      for (const g of C.pps) vp += ' ' + ppEn(g);
      s = `${who} ${vp} ${tail}`;
    } else if (C.kind === 'est' || C.kind === 'net') {
      const thing = C.subj, neg = C.kind === 'net';
      const what = thing ? (neg ? np(thing, 'have').replace(/^an? /, '') : np(thing, 'have')) : '';
      if (C.owner && C.owner.pp.t.P.roles[C.owner.r.c] === 'at') {
        const o = C.owner, own = o.pron ? o.r.en === 'me' ? 'I' : esvSubjEn(o.r) : np({ ...o, pp: null }, 'subj'), o3 = o.pron ? o.r.per === 3 && o.r.n === 's' : o.r.n === 's' && !o.coord;
        s = neg ? `${own} ${o3 ? 'does' : 'do'} not have ${thing && (thing.r.n === 'p' || thing.noun?.t.e.mass) ? 'any ' : 'a '}${what}` : `${own} ${o3 ? 'has' : 'have'} ${what}`;
        s = s.replace(/ a (an? )/, ' $1').replace(/ a ([aeiou])/i, ' an $1');
        for (const g of C.pps.filter(g => g !== o)) s += ' ' + ppEn(g);
        s += ' ' + tail;
      } else {
        const pl = thing && thing.r.n === 'p';
        s = neg ? `there ${pl ? 'are' : 'is'} no ${what}` : `there ${pl ? 'are' : 'is'} ${what}`;
        for (const g of C.pps) s += ' ' + ppEn(g);
        s += ' ' + tail;
      }
    } else {
      const sj = C.subj, who = np(sj, 'subj'), pl = sj.r.n === 'p' || !!sj.coord;
      const be = sj.pron && !sj.r.eto ? ({ I: 'am', you: 'are', he: 'is', she: 'is', we: 'are', they: 'are' })[sj.r.en] || 'is' : pl ? 'are' : 'is';
      let what = '';
      if (C.pred.noun) what = np(C.pred.noun, 'pred');
      else if (C.pred.adj) what = veryOf(C.pred.adj.loose) + C.pred.adj.loose.t.e.en;
      else if (C.pred.pp) what = ppEn(C.pred.pp);
      else if (C.pred.adv) what = C.pred.adv.t.en;
      const extra = C.pps.filter(g => g !== C.pred.pp).map(ppEn).join(' ');
      s = `${who} ${be}${C.neg ? ' not' : ''}${freq.length ? ' ' + freq.join(' ') : ''} ${what} ${extra} ${C.pred.adv ? [...time].join(' ') + (too ? ' too' : '') : tail}`;
    }
    s = s.replace(/\s+/g, ' ').trim();
    return voc.length ? `${voc.join(', ')}, ${s}` : s;
  };
  let s = one(P.clauses[0]);
  P.conjs.forEach((c, k) => { s += (c.cut ? (c.gloss.startsWith('but') ? ', but ' : ', and ') : ', and ') + one(P.clauses[k + 1]); });
  return s[0].toUpperCase() + s.slice(1) + '.';
}
const esvObjEn = r => ({ I: 'me', me: 'me', you: 'you', he: 'him', him: 'him', she: 'her', her: 'her', we: 'us', us: 'us', they: 'them', them: 'them', this: 'this' })[r.en] || r.en;
const esvSubjEn = r => ({ me: 'I', you: 'you', him: 'he', her: 'she', us: 'we', them: 'they' })[r.en] || r.en;

/* the sentence as text: commas before а / но and between two sentence parts, after a name you call */
function esvText(L, words) {
  let cuts = null; try { const r = esvCheck(L, words); if (r.ok) cuts = new Set(r.P.conjs); } catch { }
  let s = '';
  words.forEach((w, k) => {
    let sep = k ? ' ' : '';
    if (k && w.k === 'conj') {
      if (cuts) { if (cuts.has(w)) sep = ', '; }
      else { const left = words.slice(0, k), right = words.slice(k + 1); if (w.cut || (left.some(t => t.k === 'verb') && right.some(t => t.k === 'verb'))) sep = ', '; }
    }
    if (k === 1 && words[0].voc) sep = ', ';
    if (k === words.length - 1 && w.voc && k) sep = ', ';
    s += sep + w.w;
  });
  return esvCap(s) + '.';
}

/* ---------------- making a tray ----------------
   The sentence is made in the plain order: (when) who (often) (не) verb what (to whom) (where) (how). The other words
   in the tray are look-alikes: the same noun in another case, the verb for another person, a describing word that
   doesn't agree… */
function esvGenerate(L, pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const fav = (list, key) => { const f = list.filter(x => key(x).some(w => pref.has(w) || pref.has(esvStrip(w)))); return f.length && coin(0.6) ? R(f) : R(list); };
  const used = new Set(), extra = [];
  const nounOf = test => { const all = L.N.filter(test), fresh = all.filter(n => !used.has(n)); const e = fav(fresh.length ? fresh : all, n => [n.w]); used.add(e); return e; };
  const fits = cats => n => cats.includes('*') ? n.cat !== 'place' : cats.includes(n.cat) || (cats.includes('open') && n.open);
  const other = (e, c, n) => { const right = esvNounForm(e, c, n), alts = esvNounForms(e).filter(f => !f.alt && f.w !== right); return alts.length ? R(alts) : null; };
  const adjFor = cat => { const list = L.A.filter(a => a.d.includes(ESV_CAT[cat] || 'p')); return list.length ? fav(list, a => [a.m]) : null; };
  // a noun group: (мой) (очень) (большой) noun (+ "of someone")
  const np = (e, c, n, out, o = {}) => {
    const nn = e.mass || e.name ? 's' : n;
    let poss = false;
    if (o.poss && coin(0.22) && !(e.name && false)) { const p = R(L.P.filter(p => o.poss !== 'no' && !(o.notMe && p.per === 1))); if (p) { poss = true; out.push(esvPoss(L, p, c, nn, e.g, e.anim)); if (!p.inv) { const wr = esvTabForm(p.T, c === 'nom' ? 'acc' : 'nom', nn, e.g === 'f' ? 'm' : 'f', e.anim); if (wr) extra.push(esvPossChip(L, p, wr)); } } }
    else if (o.adj !== false && coin(0.3)) {
      const a = adjFor(e.cat);
      if (a) { if (o.very && coin(0.15)) out.push(esvVery(L)); out.push(esvAdj(L, a, c, nn, e.g, e.anim));
        const wrongG = e.g === 'm' ? 'f' : 'm', wr = esvTabForm(a.T, c, nn, wrongG, e.anim) !== esvTabForm(a.T, c, nn, e.g, e.anim) ? esvTabForm(a.T, c, nn, wrongG, e.anim) : esvTabForm(a.T, c === 'nom' ? 'gen' : 'nom', nn, e.g, e.anim);
        if (wr) extra.push(esvAdjChip(L, a, wr)); }
    }
    out.push(esvNoun(L, e, c, nn));
    const o2 = other(e, c, nn); if (o2) extra.push(esvNounChip(L, e, o2.w));
    if (o.of && !poss && !e.abs && coin(0.12)) { const g = nounOf(n2 => n2.cat === 'person' && n2 !== e); out.push(esvNoun(L, g, 'gen', 's')); extra.push(esvNoun(L, g, 'nom', 's')); }
    return nn;
  };
  const subjPron = () => R(L.pron.filter(p => p[1] === 'nom' && !p[6]));
  const objPron = f => R(L.pron.filter(p => p[1].includes('acc') && p[6] !== 'pp' && !(p[2] === (f % 3 + 1) && p[3] === (f < 3 ? 's' : 'p') && p[2] < 3)));
  const placePP = (out, dest, e0) => {
    const e = e0 || nounOf(n => n.cat === 'place'), c = dest ? 'acc' : 'loc', p = e.na ? L.onW : L.inW;
    out.push(esvPrep(L, p)); np(e, c, 's', out, { adj: !e.enAt, poss: false });
    extra.push(esvNoun(L, e, dest ? 'loc' : 'acc', 's'));
  };
  const clause = () => {
    const out = [], r = Math.random();
    const kinds = ['tr', 'tr', 'tr', 'in', 'motion', 'give', 'dat', 'modal', 'want', 'zc-noun', 'zc-adj', 'zc-loc', 'eto', 'have', 'nohave', ...(L.extraKinds || [])];
    const kind = R(kinds);
    // who
    let f = 2, sg = 'm', subjE = null, sP = null;
    const pickSubj = (only) => {
      if (coin(0.45)) { sP = subjPron(); f = (sP[2] - 1) + (sP[3] === 'p' ? 3 : 0); sg = sP[4] || R(['m', 'f']); out.push(esvPronChip(L, sP[0])); extra.push(esvPronChip(L, R(L.pron.filter(p => p[0] !== sP[0] && p[2] === sP[2] && p[3] === sP[3] && p[1] !== 'nom' && !p[6]))?.[0] || L.pron[1][0])); }
      else { subjE = nounOf(only || (n => n.cat === 'person' || n.cat === 'animal')); const n = coin(0.25) ? 'p' : 's'; const nn = np(subjE, 'nom', n, out, { very: true, poss: true, of: true }); f = nn === 'p' ? 5 : 2; sg = subjE.g; }
    };
    if (kind === 'eto') {
      const ep = L.pron.find(p => p[6] === 'eto'); out.push(esvPronChip(L, ep[0]));
      if (coin(0.2)) out.push(esvNeg(L));
      const e = nounOf(n => n.cat !== 'place' || coin(0.3)); np(e, 'nom', 's', out, { poss: true });
      return out;
    }
    if (kind === 'zc-noun') {
      sP = R(L.pron.filter(p => p[1] === 'nom' && !p[6])); out.push(esvPronChip(L, sP[0]));
      if (coin(0.15)) out.push(esvNeg(L));
      const e = nounOf(n => n.cat === 'person' && !n.name && (!n.sex || !sP[4] || n.g === sP[4]));
      out.push(esvNoun(L, e, 'nom', sP[3])); extra.push(esvNoun(L, e, 'ins', sP[3]));
      return out;
    }
    if (kind === 'zc-adj') {
      subjE = nounOf(n => n.cat !== 'place' || coin(0.4)); const n = subjE.mass ? 's' : coin(0.25) ? 'p' : 's';
      np(subjE, 'nom', n, out, { poss: true, adj: false });
      if (coin(0.15)) out.push(esvNeg(L));
      const a = adjFor(subjE.cat) || L.A[0]; if (coin(0.2)) out.push(esvVery(L));
      out.push(esvAdj(L, a, 'nom', n, subjE.g, subjE.anim)); extra.push(esvAdjChip(L, a, esvTabForm(a.T, 'nom', 's', subjE.g === 'f' ? 'm' : 'f', null)));
      return out;
    }
    if (kind === 'zc-loc') {
      pickSubj(n => n.cat !== 'place');
      if (coin(0.15)) out.push(esvNeg(L));
      if (coin(0.25)) out.push(esvAdv(L, R(L.adv.filter(a => a[2] === 'place'))[0]));
      else if (subjE && !subjE.anim && coin(0.6)) { const t = nounOf(n => n.surface); out.push(esvPrep(L, L.onW)); np(t, 'loc', 's', out, { adj: false }); extra.push(esvNoun(L, t, 'acc', 's')); }
      else placePP(out, false);
      return out;
    }
    if (kind === 'have' || kind === 'nohave') {
      const owner = coin(0.5) ? R(L.pron.filter(p => p[1].includes('gen') && p[6] === 'pp' || (p[1].includes('gen') && p[2] < 3 && !p[6]))) : null;
      if (owner || coin(0.6)) {
        out.push(esvPrep(L, L.atW));
        if (owner) out.push(esvPronChip(L, owner[0])); else { const o = nounOf(n => n.cat === 'person'); np(o, 'gen', 's', out, { adj: false, poss: true }); }
        if (owner) extra.push(esvPronChip(L, L.pron.find(p => p[2] === owner[2] && p[3] === owner[3] && p[1] === 'nom' && (p[4] || '') === (owner[4] || ''))?.[0] || 'я'));
      } else placePP(out, false);
      const thing = nounOf(n => n.cat !== 'place' && n.cat !== 'person' && !n.abs);
      if (kind === 'have') { out.push(esvEst(L)); np(thing, 'nom', thing.mass ? 's' : coin(0.3) ? 'p' : 's', out, {}); extra.push(esvNet(L)); }
      else { out.push(esvNet(L)); out.push(esvNoun(L, thing, 'gen', thing.mass ? 's' : coin(0.3) ? 'p' : 's')); extra.push(esvNoun(L, thing, 'nom', 's'), esvEst(L)); }
      return out;
    }
    // a verb
    let V, A;
    const vOf = test => { const list = L.V.filter(test); return fav(list, v => [v.inf, ...v.forms]); };
    if (kind === 'modal') { V = L.V.find(v => v.t === 'modal'); A = vOf(v => ['tr', 'in'].includes(v.t) && !v.motion && !v.rec); }
    else if (kind === 'want') { V = vOf(v => v.t === 'want' || v.t === 'like'); A = coin(0.5) ? V : vOf(v => ['tr', 'in'].includes(v.t) && !v.rec && (V.t !== 'like' || !v.motion)); }
    else if (kind === 'motion') V = A = vOf(v => v.motion);
    else if (kind === 'give') V = A = vOf(v => v.rec);
    else if (kind === 'dat') V = A = vOf(v => v.t === 'dat');
    else if (kind === 'tr') V = A = vOf(v => v.t === 'tr' && !v.rec);
    else if (L.extraVerb && L.extraVerb[kind]) V = A = L.extraVerb[kind](vOf);
    else V = A = vOf(v => v.t === 'in' && !v.motion);
    pickSubj(A.who === 'p' ? n => n.cat === 'person' : null);
    if (coin(0.2)) out.unshift(esvAdv(L, R(L.adv.filter(a => a[2] === 'time'))[0]));
    const neg = coin(0.18), fr = !neg && coin(0.15) ? R(L.adv.filter(a => a[2] === 'freq' || a[2] === 'never')) : null;
    if (fr) out.push(esvAdv(L, fr[0]));
    if (neg || fr?.[2] === 'never') out.push(esvNeg(L)); else extra.push(esvNeg(L));
    out.push(esvVerb(L, V, f)); extra.push(esvVerb(L, V, (f + 1 + Math.floor(Math.random() * 5)) % 6));
    if (V !== A) { out.push(esvInf(L, A)); }
    else if (['modal', 'want', 'like'].includes(V.t) === false && A.t !== 'modal' && coin(0.25)) extra.push(esvInf(L, A));
    if (A === V ? ['tr', 'want', 'like'].includes(A.t) : A.t === 'tr' && coin(0.85)) {
      if (coin(0.12) && (A.objs?.includes('*') || A.objs?.includes('person'))) out.push(esvPronChip(L, objPron(f)[0]));
      else { const e = nounOf(fits(A.objs || ['*'])); np(e, 'acc', e.mass ? 's' : coin(0.25) ? 'p' : 's', out, { poss: true, of: true }); }
    }
    if (A.t === 'dat') { const e = nounOf(n => n.cat === 'person'); np(e, 'dat', coin(0.2) ? 'p' : 's', out, { poss: true, adj: false }); extra.push(esvNoun(L, e, 'acc', 's')); }
    if (A.rec && V === A && coin(0.7)) { const e = nounOf(n => n.cat === 'person'); np(e, 'dat', 's', out, { poss: true, adj: false }); extra.push(esvNoun(L, e, 'acc', 's')); }
    if (A.motion && V === A) {
      const x = Math.random();
      if (x < 0.15) out.push(esvAdv(L, L.homeTo));
      else if (x < 0.35) { const e = nounOf(n => n.cat === 'person'); out.push(esvPrep(L, L.toW)); np(e, L.toCase, 's', out, { adj: false, poss: true }); extra.push(esvNoun(L, e, 'acc', 's')); }
      else placePP(out, true);
    } else if (!A.motion && V === A && coin(0.35)) {
      if (coin(0.6)) placePP(out, false);
      else { const e = nounOf(n => n.cat === 'person' || n.cat === 'animal'); out.push(esvPrep(L, L.withW)); np(e, 'ins', 's', out, { adj: false, poss: true, notMe: true }); }
    }
    if (coin(0.15) && L.howOK(A)) out.push(esvAdv(L, R(L.adv.filter(a => a[2] === 'how'))[0]));
    return out;
  };
  for (let tries = 0; tries < 200; tries++) {
    extra.length = 0; used.clear();
    let words = clause();
    if (Math.random() < 0.15) words = [...words, esvConj(L, R(L.conjGen || L.conj.map(c => c[0]))), ...clause()];
    if (L.voc && Math.random() < 0.07) { const e = L.N.find(n => n.voc && Math.random() < 0.3) || L.N.find(n => n.voc); if (e && !words.some(w => w.e === e)) words = [esvVoc(L, e), ...words]; }
    L.fixPreps?.(words);
    if (words.length > 13 || words.length < 2) continue;
    const res = esvCheck(L, words); if (!res.ok) continue;
    extra.push(esvPrep(L, R(L.prep.flatMap(p => p.w.slice(0, 1)))), esvPronChip(L, R(L.pron.filter(p => p[1] === 'nom' && !p[6]))[0]));
    if (!words.some(w => w.k === 'conj')) extra.push(esvConj(L, R(L.conjGen || L.conj.map(c => c[0]))));
    const seen = new Set(words.map(w => w.k + w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && x.w && !seen.has(x.k + x.w)) { seen.add(x.k + x.w); uniq.push(x); }
    return { words, extra: uniq.slice(0, Math.max(4, 15 - words.length)), english: esvEnglish(L, res.P) };
  }
  return null;
}

/* ---------------- registering a language ---------------- */
function esvRegister(code) {
  const L = ESV[code];
  esvTables(L);
  L.N.forEach(n => { n.surface = L.surfaces.includes(n.w); });
  BLD_LANGS[code] = { name: L.name, check: T => esvCheck(L, T), gen: pref => esvGenerate(L, pref), voice: L.voice, english: P => esvEnglish(L, P), text: words => esvText(L, words),
    types: ['pron', 'noun', 'verb', 'adj', 'det', 'prep', 'conj', 'adv'] };
  BLD_ORDER[code] = L.order;
  { const prevMine = bldApplyMine; bldApplyMine = function () { prevMine(); esvApplyMine(L, code); }; }
  BLD_MINE[code] = { name: L.name, forms: L.formsLabel, nForms: 6, m: 'masculine', f: 'feminine', n: 'neuter',
    conj: w => esvConjFor(L, w), pl: w => L.guessNoun(esvStrip(w), esvGenderGuess(L, w), false, false).F.pnom?.[0] || w, adj: w => { const T = L.adjTable(w); return [T.m.nom[0], T.f.nom[0], T.n.nom[0], T.p.nom[0]]; },
    known: w => esvKnown(L, esvStrip(w)), gender: w => esvGenderGuess(L, esvStrip(w)), isVerb: w => /(ть|ти|чь)(ся|сь)?$/.test(esvStrip(w)), refl: w => /(ся|сь)$/.test(w), minLen: 2,
    parse: s => {
      s = esvStrip(s).replace(/’/g, "'").replace(/ё/g, L.code === 'ru' ? 'ё' : 'е');
      const parts = s.split(/\s*[\/,;]\s*|\s+-\s+/).filter(Boolean), w = parts[0];
      if (!w || !/^[\p{L}'-]+$/u.test(w)) return null;
      if (parts[1] && /(ть|ти|чь)(ся|сь)?$/.test(w) && /(ть|ти|чь)(ся|сь)?$/.test(parts[1])) L.pfMine[w] = parts[1];   // читать / прочитать
      return { w };
    },
    intro: L.mineIntro };
  if (typeof GAMES !== 'undefined' && GAMES.builder && !GAMES.builder.desc.includes(L.name)) GAMES.builder.desc = GAMES.builder.desc.replace(/,? and (\p{L}+)\.$/u, ', $1 and ' + L.name + '.');
}

/* ---------------- your own words (📚 Add my deck's words) ---------------- */
const esvKnown = (L, w) => L.N.slice(0, L.BASE.n).some(n => esvNounForms(n).some(f => f.w === w)) || L.V.slice(0, L.BASE.v).some(v => v.inf === w || v.forms.includes(w) || v.pf === w)
  || L.A.slice(0, L.BASE.a).some(a => esvTabForms(a.T).some(f => f.w === w)) || L.pron.some(p => p[0] === w) || L.P.some(p => p.inv ? p.w === w : esvTabForms(p.T).some(f => f.w === w))
  || L.adv.some(a => a[0] === w) || L.conj.some(c => c[0] === w) || L.prep.some(p => p.w.includes(w)) || [L.neg, L.very, L.est, L.net].includes(w);
const esvGenderGuess = (L, w) => /[ая]$/.test(w) ? 'f' : /[оеё]$/.test(w) || (L.code === 'uk' && /(.)\1я$|ття$/.test(w)) ? 'n' : /ь$/.test(w) && L.code === 'ru' && /(ость|есть|сть|чь|шь|жь|щь)$/.test(w) ? 'f' : 'm';
function esvConjFor(L, w) {
  w = esvStrip(w);
  const known = L.V.find(v => v.inf === w); if (known) return known.forms;
  const refl = w.match(/^(.*?)(ся|сь)$/), base = refl ? refl[1] : w;
  const f = L.conjugate(base);
  return refl ? L.reflForms(f) : f;
}
function esvApplyMine(L, code) {
  L.N.length = L.BASE.n; L.A.length = L.BASE.a; L.V.length = L.BASE.v;
  for (const m of S.bldWords || []) {
    if (!m || m.lang !== code || !m.w || !m.en) continue;
    const w = esvStrip(m.w).toLowerCase(); if (esvKnown(L, w)) continue;
    if (m.k === 'noun') {
      const cat = m.cat || 'thing', anim = cat === 'person' || cat === 'animal';
      const e = L.guessNoun(w, ['m', 'f', 'n'].includes(m.g) ? m.g : esvGenderGuess(L, w), anim, m.pl === null);
      Object.assign(e, { g: ['m', 'f', 'n'].includes(m.g) ? m.g : esvGenderGuess(L, w), cat, anim, voc: anim && cat === 'person' ? e.voc : null, en: m.en, enPl: m.pl === null ? null : (m.enPl || bldPlEn(m.en)), mine: true });
      if (m.pl && e.F.pnom && m.pl !== e.F.pnom[0]) e.F.pnom = [m.pl];
      e.surface = false; L.N.push(e);
    }
    if (m.k === 'verb' && Array.isArray(m.forms) && m.forms.length === 6) {
      const tr = m.obj !== 'in' && !/(ся|сь)$/.test(w);
      L.V.push({ inf: w, forms: m.forms.map(esvStrip), pf: L.pfMine[w] || '', t: tr ? 'tr' : 'in', objs: tr ? (m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read', 'sound']) : null,
        en: m.en.replace(/^to /, ''), en3: bld3sEn(m.en.replace(/^to /, '')), who: m.who === 'a' ? 'a' : 'p', fl: [], motion: false, rec: false, about: false, need: false, mine: true });
    }
    if (m.k === 'adj' && L.isAdj(w)) L.A.push({ m: w, en: m.en, d: 'patflrs', T: L.adjTable(w), mine: true });
  }
}
/* every word the builder knows, with its meaning (🌐 auto-translate and the word labels) */
function esvWordList(L) {
  const out = [];
  for (const n of L.N) for (const f of esvNounForms(n)) out.push([f.w, f.n === 'p' ? n.enPl || n.en : n.en, 'noun']);
  for (const n of L.N) if (n.voc) for (const w of n.voc) out.push([w, n.en, 'noun']);
  for (const a of L.A) for (const f of esvTabForms(a.T)) out.push([f.w, a.en, 'adj']);
  for (const v of L.V) { out.push([v.inf, 'to ' + v.en, 'verb']); if (v.pf) out.push([v.pf, 'to ' + v.en + ' (perfective)', 'verb']); v.forms.forEach((f, i) => out.push([f, i === 2 ? v.en3 : v.en, 'verb'])); }
  for (const p of L.pron) out.push([p[0], p[5], 'pron']);
  for (const p of L.P) for (const w of p.inv ? [p.w] : esvTabForms(p.T).map(f => f.w)) out.push([w, p.en, 'det']);
  for (const p of L.prep) for (const w of p.w) out.push([w, p.en, 'prep']);
  for (const a of L.adv) out.push([a[0], a[1], 'adv']);
  for (const c of L.conj) out.push([c[0], c[1], 'conj']);
  out.push([L.neg, 'not', 'adv'], [L.very, 'very', 'adv'], [L.est, 'there is / have', 'verb'], [L.net, 'there is no', 'verb']);
  return out;
}
