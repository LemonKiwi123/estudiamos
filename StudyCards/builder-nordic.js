'use strict';
/* ================= Sentence Builder: Swedish, Norwegian (Bokmål) and Danish =================
   One engine for all three, the way Portuguese serves pt-BR and pt-PT: builder-sv.js, builder-nb.js and builder-da.js hold
   each language's words and its few differences, and register themselves with noRegister().
   What it checks: en / ett (Danish en / et, Norwegian en / ei / et); "the" is the END of the noun (bilen, huset, bilarna);
   with a describing word, den / det / de comes first and Swedish and Norwegian keep the ending too (den stora bilen,
   det store huset), while Danish drops it (den store bil); describing words agree (en stor bil, ett stort hus, stora bilar,
   bilen är stor, huset är stort); my / your… (min bil, mitt hus, mina bilar; Norwegian also bilen min); the verb comes
   second in a main sentence, so after a starting word like "i dag" the verb comes before who does it (I dag äter jag…);
   inte / ikke and ofta / alltid go after the verb in a main sentence and before it after eftersom / fordi / att;
   one present form for every person (jag talar, du talar, vi talar); kan / vill / måste / ska + the basic form
   (jag vill äta); object pronouns after the verb (mig, honom, dem), and "Jag ser honom inte" as well as "ser inte honom".
   Loaded after builder.js and builder-fr.js (which makes BLD_MINE). */

const NO_LANG = {};
const NO_KIND = { food: 'food', drink: 'drinks', read: 'things you read or write', thing: 'things', place: 'places', animal: 'animals', person: 'people', open: 'things you can open' };
const NO_HOW = /^(play|work|study|sleep|swim|sing|dance|talk|cook|read|write)$/;   // verbs that go with "well"

/* ---------- reading a language's word tables ---------- */
//  noun: word|the-form|plural|the-plural|gender|kind|English|English plural|extra   (extra: i / på = the place word, m1 = can't count, m2 = can say "a" too)
//  adjective: base|neuter|the-form|English|describes|the-form for one (if different)|plural (if different)|feminine (Norwegian, if different)
//  verb: infinitive|present|kind|what it takes|English|English he/she form|who (p people, a people and animals)
function noTables(L) {
  L.N = L.nouns.map(s => { const [w, def, pl, dpl, g, cat, en, enPl, x] = s.split('|');
    return { w, def, pl: pl || null, dpl: dpl || null, g, cat, en, enPl: enPl || null, p: x === 'i' || x === 'på' ? x : null, mass: x === 'm1' ? 1 : x === 'm2' ? 2 : 0 }; });
  L.A = L.adjs.map(s => { const [b, t, e, en, d, dsg, pl, f] = s.split('|'); return { b, t, e, en, d, dsg: dsg || null, pl: pl || null, f: f || null }; });
  L.V = L.verbs.map(s => { const [inf, pres, t, objs, en, en3, who] = s.split('|');
    return { inf, pres, t: t.replace(/1$/, ''), need: /1$/.test(t), objs: objs ? objs.split(',') : null, en, en3, who }; });
  for (const m of L.modals) L.V.push({ inf: m[1], pres: m[0], t: 'modal', need: true, objs: null, en: m[2][0], en3: m[2][1], who: 'a', m: m[2] });
  L.BASE = { n: L.N.length, a: L.A.length, v: L.V.length };
  L.be = L.V.find(v => v.t === 'be').pres;
}
// the forms a describing word takes: after en / ett (or with nothing), after den / min (or for more than one), after "is"
const noAdjIndef = (a, g) => g === 'n' ? [a.t] : g === 'f' && a.f ? [a.f, a.b] : [a.b];
const noAdjDef = (a, num) => [num === 'p' ? a.pl || a.e : a.dsg || a.e];
const noAdjPl = a => [a.pl || a.e];
const noAdjPred = (a, key) => key === 'p' ? noAdjPl(a) : noAdjIndef(a, key);
const noArtOk = (L, g, w) => L.art[g] === w || (L.artAlt?.[g] || []).includes(w);
const noPossWant = (p, key) => p.f.x || p.f[key] || p.f.m;
const noPossOk = (p, key, w) => w === noPossWant(p, key) || (key === 'f' && w === p.f.m) || p.f.x === w;
const noIndefW = (n, num) => num === 'p' ? n.pl : n.w;
const noDefW = (n, num) => num === 'p' ? n.dpl : n.def;
// "an “en” word", "a “ett” word", "plural"
const noGName = (L, key) => key === 'p' ? 'plural' : `${/^[aeiouæøå]/.test(L.art[key]) ? 'an' : 'a'} “${L.art[key]}” word`;
const noCap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

/* ---------- chips (each one carries its own English for the word tag) ---------- */
const noChip = o => chip({ ...o, gloss: o.gloss || o.en });
const noPronC = (L, w) => { const r = L.pron.find(p => p[0] === w || p[1] === w); return noChip({ k: 'pron', w, r, en: r[0] === w ? r[2] : r[3], gloss: [...new Set(L.pron.flatMap(p => [p[0] === w ? p[2] : '', p[1] === w ? p[3] : '']).filter(Boolean))].join(' / ') }); };
const noArtC = w => noChip({ k: 'det', fam: 'en', w, en: 'a', cls: 'art' });
const noDenC = w => noChip({ k: 'det', fam: 'den', w, en: 'the', gloss: 'the (with a describing word)', cls: 'art' });
const noPossC = (p, w) => noChip({ k: 'det', fam: 'poss', w, e: p, en: p.en, cls: 'poss' });
const noNumC = (w, en, fam = 'num') => noChip({ k: 'det', fam, w, en, cls: fam });
const noNounC = (n, num, def) => { const en = num === 'p' ? n.enPl || n.en : n.en; return noChip({ k: 'noun', w: def ? noDefW(n, num) : noIndefW(n, num), e: n, num, def: !!def, en, gloss: def ? 'the ' + en : en }); };
const noAdjC = (a, w) => noChip({ k: 'adj', w, e: a, en: a.en });
const noVerbC = v => noChip({ k: 'verb', w: v.pres, e: v, en: v.en, gloss: v.t === 'modal' ? v.m[0] : 'to ' + v.en });
const noInfC = v => noChip({ k: 'verb', w: v.inf, e: v, inf: true, en: v.en, gloss: 'to ' + v.en + ' (basic form)' });
const noNegC = L => noChip({ k: 'neg', w: L.neg, en: 'not' });
const noNeverC = L => noChip({ k: 'neg', w: L.never, never: true, en: 'never' });
const noVeryC = L => noChip({ k: 'int', w: L.very, en: 'very' });
const noAdvC = (L, w) => { const a = L.adv.find(x => x[0] === w); return noChip({ k: 'adv', w, en: a[1], cls: a[2] }); };
const noPrepC = (L, w) => noChip({ k: 'prep', w, kind: L.prep.loc.includes(w) ? 'loc' : w === L.prep.to ? 'to' : 'with', en: w === L.prep.to ? 'to' : w === L.prep.with ? 'with' : L.prep.locEn[w] });
const noConjC = (L, w) => { const c = L.conj.find(x => x[0] === w); return noChip({ k: 'conj', w, en: c[1], sub: c[2] || '' }); };

/* ---------------- the checker ---------------- */
function noCheck(L, T0) {
  // a few words are spelled like another kind of word: "de" is "they" or "the", Swedish "er" is "you" or "your"
  const T = T0.map((t, k) => {
    const nx = T0[k + 1], nounNext = nx && ['noun', 'adj', 'int'].includes(nx.k);
    if (t.k === 'pron' && nounNext && L.possW.has(t.w)) { const p = L.poss.find(p => Object.values(p.f).includes(t.w)); return { ...t, k: 'det', fam: 'poss', e: p, en: p.en }; }
    if (t.k === 'pron' && t.w === L.defArt.p && nx && ['adj', 'int'].includes(nx.k)) return { ...t, k: 'det', fam: 'den', en: 'the' };
    if (t.k === 'det' && t.fam === 'den' && t.w === L.defArt.p && !nounNext && L.pron.some(p => p[0] === t.w)) { const r = L.pron.find(p => p[0] === t.w); return { ...t, k: 'pron', r, en: r[2] }; }
    if (t.k === 'det' && t.fam === 'poss' && !nounNext && L.pron.some(p => p[1] === t.w) && !(L.postPoss && T0[k - 1]?.k === 'noun')) { const r = L.pron.find(p => p[1] === t.w); return { ...t, k: 'pron', r, en: r[3] }; }
    return t;
  });
  let i = 0;
  const err = (msg, at = i) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length }), peek = (o = 0) => T[i + o], isErr = x => x && x.ok === false;
  if (!T.length) return err('Tap some words to build a sentence.');
  const isMid = t => t && (t.k === 'neg' || (t.k === 'adv' && t.cls === 'freq'));
  const ex = { v: L.V.find(v => v.t === 'tr') };
  const npText = np => np.coord ? np.coord.map(npText).join(' ' + np.conj.w + ' ') : np.pron ? np.pron.w : [np.det?.w, np.very?.w, np.adj?.w, np.n.w, np.poss?.w].filter(Boolean).join(' ');
  const sText = s => s.pron ? s.pron.w : npText(s.np);

  // a noun phrase: (en / den / min / två) (mycket) (describing word) noun (Norwegian: min after the noun)
  // role: subj · obj · have (where "Jag har bil" is fine) · pp (after i / på / med / till)
  function NP(role) {
    const start = i; let det = null, very = null, adj = null, poss = null;
    if (peek()?.k === 'det') det = T[i++];
    if (peek()?.k === 'int') { very = T[i++]; if (peek()?.k !== 'adj') return err(`“${very.w}” (very) goes right before a describing word: “${very.w} ${L.A[0].b}”.`, i - 1); }
    const ai = i; if (peek()?.k === 'adj') adj = T[i++];
    if (peek()?.k === 'adj') return err('Use one describing word per noun here.', i);
    const n = peek();
    if (!n || n.k !== 'noun') return err(det ? `“${det.w}” comes before a noun, so a noun has to follow it.` : adj ? `“${adj.w}” describes a noun, so a noun should come right after it${role === 'subj' ? '' : ' (or put it after “' + L.be + '”)'}.` : role === 'subj' ? `Start with who does it: a word like “${L.pron[0][0]}” or a noun like “${L.N[0].def}”.` : 'A noun (a person, place or thing) should go here.', i);
    i++;
    const e = n.e;
    // barn, hus, brev: one and more than one are spelled the same, so "tre barn" and "barn leker" read as more than one
    let num = n.num; if (num === 's' && !n.def && e.pl === e.w && (det ? ['num', 'some'].includes(det.fam) : role !== 'have')) num = 'p';
    const key = num === 'p' ? 'p' : e.g;
    if (L.postPoss && peek()?.k === 'det' && peek().fam === 'poss') poss = T[i++];
    const adjErr = (wants, why) => adj && !wants.includes(adj.w) ? err(`${why}, the describing word is “${wants[0]}”: “${[det?.w, very?.w, wants[0], n.w, poss?.w].filter(Boolean).join(' ')}”.`, ai) : null;
    let x;
    if (det?.fam === 'en') {
      if (num === 'p') return err(`“${det.w}” means one. For more than one, leave it out or use “${L.some[0]}”: “${L.some[0]} ${n.def ? e.pl : n.w}”.`, start);
      if (n.def) return err(`After “${det.w}”, use the noun without its “the” ending: “${det.w} ${adj ? adj.w + ' ' : ''}${e.w}”.`, i - 1 - (poss ? 1 : 0));
      if (e.mass === 1) return err(`You can’t count “${e.w}”, so leave out “${det.w}”: just “${e.w}”.`, start);
      if (!noArtOk(L, e.g, det.w)) return err(`“${e.w}” is ${noGName(L, e.g)}, so use “${L.art[e.g]}”: “${L.art[e.g]} ${adj ? noAdjIndef(adj.e, e.g)[0] + ' ' : ''}${e.w}”.`, start);
      if ((x = adjErr(noAdjIndef(adj?.e || {}, e.g), `After “${det.w}”`))) return x;
    } else if (det?.fam === 'den') {
      const want = L.defArt[key], nounW = L.dbl ? noDefW(e, num) : noIndefW(e, num), exAdj = adj ? noAdjDef(adj.e, num)[0] : noAdjDef(L.A[0], num)[0];
      if (!adj) {
        if (!(L.denThat && n.def)) return err(`“${det.w}” before a noun needs a describing word: “${want} ${exAdj} ${nounW}”. For “the ${n.en}”, just say “${noDefW(e, num)}”.`, start);
        if (det.w !== want) return err(`“${n.w}” is ${noGName(L, key)}, so use “${want}”: “${want} ${n.w}”.`, start);
      } else {
        if (det.w !== want) return err(`“${e.w}” is ${noGName(L, key)}, so use “${want}”: “${want} ${exAdj} ${nounW}”.`, start);
        if (L.dbl && !n.def) return err(`With “${det.w}” and a describing word, ${L.name} keeps the “the” ending on the noun too: “${want} ${exAdj} ${nounW}”.`, i - 1 - (poss ? 1 : 0));
        if (!L.dbl && n.def) return err(`In Danish, “${det.w}” takes the place of the “the” ending: “${want} ${exAdj} ${nounW}”, not “${n.w}”.`, i - 1);
        if ((x = adjErr(noAdjDef(adj.e, num), `After “${det.w}”`))) return x;
      }
    } else if (det?.fam === 'poss') {
      const want = noPossWant(det.e, key);
      if (n.def) return err(`After “${det.w}”, use the noun without its “the” ending: “${det.w} ${adj ? adj.w + ' ' : ''}${noIndefW(e, num)}”.${L.postPoss ? ` Or put it after the noun: “${n.w} ${want}”.` : ''}`, i - 1);
      if (!noPossOk(det.e, key, det.w)) return err(`“${e.w}” is ${noGName(L, key)}, so use “${want}”: “${want} ${adj ? noAdjDef(adj.e, num)[0] + ' ' : ''}${n.w}”.`, start);
      if ((x = adjErr(noAdjDef(adj?.e || {}, num), `After “${det.w}”`))) return x;
    } else if (det) {   // två / tre / några
      if (num !== 'p') return err(e.pl ? `“${det.w}” means more than one, so the noun must be plural: “${det.w} ${e.pl}”.` : `You can’t count “${e.w}”, so leave out “${det.w}”.`, start);
      if (n.def) return err(`After “${det.w}”, use the noun without its “the” ending: “${det.w} ${adj ? adj.w + ' ' : ''}${e.pl}”.`, i - 1);
      if ((x = adjErr(noAdjPl(adj?.e || {}), `For more than one`))) return x;
    } else if (n.def) {
      if (adj) return err(L.dbl ? `With a describing word, put “${L.defArt[key]}” first: “${L.defArt[key]} ${noAdjDef(adj.e, num)[0]} ${n.w}”.` : `With a describing word, Danish puts “${L.defArt[key]}” first and drops the ending: “${L.defArt[key]} ${noAdjDef(adj.e, num)[0]} ${noIndefW(e, num)}”.`, ai);
    } else if (num === 's' && !e.mass) {
      if (!(role === 'have' && !adj && !poss)) return err(`Say “${L.art[e.g]} ${adj ? noAdjIndef(adj.e, e.g)[0] + ' ' : ''}${e.w}” (a ${n.en}) or “${e.def}” (the ${n.en}). On its own, “${e.w}” needs one of them here.`, start);
    } else if ((x = adjErr(num === 'p' ? noAdjPl(adj?.e || {}) : noAdjIndef(adj?.e || {}, e.g), num === 'p' ? 'For more than one' : `For ${noGName(L, e.g)}`))) return x;
    if (poss) {
      const want = noPossWant(poss.e, key);
      if (!n.def) return err(`When “${poss.w}” comes after the noun, the noun keeps its “the” ending: “${noDefW(e, num)} ${want}”.`, i - 2);
      if (det && det.fam !== 'den') return err(`Use “${det.w}” or “${poss.w}”, not both.`, start);
      if (!noPossOk(poss.e, key, poss.w)) return err(`“${n.w}” is ${noGName(L, key)}, so use “${want}”: “${n.w} ${want}”.`, i - 1);
    }
    return { det, very, adj, n, poss, key, num, cat: e.cat, role, that: det?.fam === 'den' && !adj, en: num === 'p' ? e.enPl || e.en : e.en };
  }
  function NPs(role) {
    const a = NP(role); if (isErr(a)) return a;
    const c = peek();
    if (c?.k === 'conj' && !c.sub && c.w === L.conj[0][0] && ['det', 'noun', 'adj', 'int'].includes(peek(1)?.k)) {
      const save = i; i++;
      const b = NP(role);
      if (isErr(b) || (role === 'subj' && peek()?.k !== 'verb')) { i = save; return a; }
      return { coord: [a, b], conj: c, num: 'p', key: 'p', cat: a.cat, role };
    }
    return a;
  }
  // who does it: a pronoun (jag, not mig) or a noun phrase
  function subject() {
    const t = peek();
    if (t?.k === 'pron') {
      if (t.w !== t.r[0]) return err(`“${t.w}” is the form for after the verb. For who does it, use “${t.r[0]}”.`);
      i++; return { pron: t, key: t.r[4] ? 'p' : L.G[0], per: t.r[5] };
    }
    if (['det', 'noun', 'adj', 'int'].includes(t?.k)) { const s = NPs('subj'); if (isErr(s)) return s; return { np: s, key: s.key, per: s.num === 'p' ? 3 : 2 }; }
    return null;
  }
  // an object: a pronoun in its after-the-verb form, or a noun phrase of the right kind
  function object(V, role) {
    const t = peek();
    if (t?.k === 'pron') {
      if (t.w !== t.r[1]) return err(`After the verb, use “${t.r[1]}” (not “${t.w}”).`);
      if (V.objs && !V.objs.includes('*') && !V.objs.includes('person')) return err(`“${V.pres}” goes with ${V.objs.map(o => NO_KIND[o]).join(' or ')}, not a person.`);
      i++; return { pron: t };
    }
    const at = i, np = NPs(role); if (isErr(np)) return np;
    if (V.objs && !V.objs.includes('*')) {
      const fits = x => V.objs.includes(x.cat) || (V.objs.includes('open') && L.OPEN.includes(x.n.e.w));
      if (!(np.coord || [np]).every(fits)) return err(`“${V.pres}” (${V.en}) goes with ${V.objs.map(o => NO_KIND[o]).join(' or ')}.`, at);
    }
    return { np };
  }
  // "i parken", "på stranden", "med min vän", "till skolan"
  function prepPhrase(V) {
    const p = T[i++];
    if (peek()?.k === 'pron') { if (p.kind !== 'with') return err(`“${p.w}” needs a place after it.`, i); const o = object({ objs: ['*'] }); return isErr(o) ? o : { p, pron: o.pron }; }
    const at = i, np = NPs('pp'); if (isErr(np)) return np;
    if (p.kind === 'loc') {
      if (np.cat !== 'place' || np.coord) return err(`“${p.w}” here needs a place after it, like “${p.w} ${L.N.find(n => n.p === p.w)?.def}”.`, at);
      if (np.n.e.p !== p.w) return err(`${L.name} says “${np.n.e.p} ${np.n.w}”, not “${p.w} ${np.n.w}”.`, at - 1);
    }
    if (p.kind === 'to' && !(np.coord || [np]).every(x => ['place', 'person'].includes(x.cat))) return err(`“${p.w}” (to) needs a place or a person after it.`, at);
    if (p.kind === 'with' && !(np.coord || [np]).every(x => ['person', 'animal'].includes(x.cat))) return err(`“${p.w}” (with) goes with people or animals here.`, at);
    return { p, np };
  }

  function clause(mode, prev) {
    // mode: main · cont (after och: who does it can be left out) · sub (after eftersom / att) · inv (after a part with eftersom at the start)
    const C = { front: null, subj: null, fin: null, verb: null, mids: [], obj: null, comp: null, dest: null, pps: [], ends: [], mode };
    if (mode === 'main' || mode === 'cont') {
      const t = peek();
      if (t?.k === 'adv' && ['time', 'freq', 'here'].includes(t.cls)) {
        C.front = T[i++];
        if (!peek()) return err(`“${C.front.w}” needs a sentence after it.`, i - 1);
        if (peek().k !== 'verb') {
          const s0 = i, s = subject();
          if (s && !isErr(s) && peek()?.k === 'verb') { const vw = peek(); return err(`In a ${L.name} main sentence the verb comes second. After “${C.front.w}”, put the verb first, then who does it: “${noCap(C.front.w)} ${vw.w} ${sText(s)}…”.`, s0); }
          i = s0;
          if (isMid(peek())) return err(`After “${C.front.w}”, the verb comes next: “${noCap(C.front.w)} ${L.V[0].pres} ${L.pron[0][0]} ${peek().w}…”.`);
          return err(`After “${C.front.w}”, the verb comes next.`);
        }
      } else if (t?.k === 'neg' || t?.k === 'int') return err(t.k === 'neg' ? `“${t.w}” goes after the verb: “${L.pron[0][0]} ${L.V[0].pres} ${t.w}”.` : `“${t.w}” (very) goes right before a describing word.`);
      else if (t?.k === 'conj') return err(`“${t.w}” joins two parts, so it can’t ${i === 0 ? 'start the sentence' : 'go here'}.`);
      else if (t?.k === 'prep') return err(`Start with who does it, like “${L.pron[0][0]}” or “${L.N[0].def}”.`);
      else {
        const s = subject(); if (isErr(s)) return s;
        if (s) C.subj = s;
        else if (mode === 'main') return err(peek()?.k === 'verb' ? `Start with who does it (“${L.pron[0][0]} ${peek().w}…”). A sentence that starts with the verb is a question.` : `Start with who does it: a word like “${L.pron[0][0]}” or a noun like “${L.N[0].def}”.`);
        if (C.subj && isMid(peek())) return err(`In a main sentence, “${peek().w}” goes after the verb: “${noCap(sText(C.subj))} ${T.slice(i).find(t => t.k === 'verb')?.w || L.V[0].pres} ${peek().w}”.`);
      }
    } else if (mode === 'sub') {
      const s = subject(); if (isErr(s)) return s;
      if (!s) return err(`After “${prev.conj}”, who does it comes first: “${prev.conj} ${L.pron[0][0]} …”.`);
      C.subj = s;
      while (isMid(peek())) C.mids.push(T[i++]);
    } else if (peek()?.k !== 'verb') {   // inv
      const s0 = i, s = subject();
      if (s && !isErr(s) && peek()?.k === 'verb') return err(`After a part with “${prev.conj}” at the start, the verb comes next and then who does it: “… ${peek().w} ${sText(s)}”.`, s0);
      i = s0; return err('A verb should come next.');
    }
    // the verb (the present form: the same for everyone)
    const v = peek();
    if (!v || v.k !== 'verb') return err(v ? (C.mids.length && v.k === 'pron' ? `After “${prev.conj}”, who does it comes first.` : 'A verb (an action word) should come next.') : 'This sentence needs a verb.', i);
    if (v.inf) return err(`Use the present form here: “${v.e.pres}”. ${L.name} has one present form for everyone: ${L.pron[0][0]} ${v.e.pres}, ${L.pron[1][0]} ${v.e.pres}, ${L.pron[4][0]} ${v.e.pres}.`);
    i++; C.fin = v; C.verb = v;
    if (mode === 'sub' && isMid(peek())) return err(`After “${prev.conj}”, “${peek().w}” goes before the verb: “${prev.conj} ${sText(C.subj)} ${peek().w} ${v.w}”.`);
    if (C.front || mode === 'inv') {
      const s = subject(); if (isErr(s)) return s;
      if (!s) return err(`Who does it? Put it right after the verb: “${noCap(C.front?.w || '…')} ${v.w} ${L.pron[0][0]}…”.`);
      C.subj = s;
    }
    if (!C.subj) { if (mode !== 'cont' || !prev?.subj) return err('Who does it? Add a pronoun or a noun before the verb.'); C.subj = prev.subj; C.shared = true; }
    let V = v.e;
    if (mode !== 'sub') {
      // "Jag ser honom inte": a pronoun object can come before inte
      if (V.t !== 'modal' && ['tr', 'have'].includes(V.t) && peek()?.k === 'pron' && isMid(peek(1))) { const o = object(V, 'obj'); if (isErr(o)) return o; C.obj = o; C.objFirst = true; }
      while (isMid(peek())) C.mids.push(T[i++]);
    }
    const negs = C.mids.filter(t => t.k === 'neg');
    if (negs.length > 1) return err(negs.some(t => t.never) ? `“${L.never}” already means never: leave out “${L.neg}”.` : `One “${L.neg}” is enough.`);
    if (C.mids.filter(t => t.k === 'adv').length > 1) return err('Use one of these words per sentence part.');
    if (V.t === 'modal') {
      const x = peek();
      if (!x || x.k !== 'verb') return err(`“${v.w}” needs a second verb in its basic form: “${v.w} ${ex.v.inf}”.`, x ? i : i - 1);
      if (x.e.t === 'modal' && !x.inf) return err('Use one of these verbs at a time.');
      if (!x.inf) return err(`After “${v.w}”, use the basic form of the verb: “${x.e.inf}”, not “${x.w}”.`);
      if (C.objFirst) return err(`With “${v.w}”, the pronoun goes after the second verb: “${v.w} ${x.w} ${C.obj.pron.w}”.`);
      i++; C.verb = x; V = x.e;
    } else if (peek()?.k === 'verb') return err(peek().inf && peek().e === v.e ? `Use one form of the verb: “${v.w}”.` : `Use one verb per sentence part. To add another, join them with “${L.conj[0][0]}”.`);
    C.V = V;
    // what comes after the verb
    if (V.t === 'be') {
      if (peek()?.k === 'int' || peek()?.k === 'adj') {
        if (peek().k === 'int') { C.very = T[i++]; if (peek()?.k !== 'adj') return err(`“${C.very.w}” (very) goes right before a describing word.`, i - 1); }
        const a = T[i], wants = noAdjPred(a.e, C.subj.key);
        if (!wants.includes(a.w)) return err(`${C.subj.np && !C.subj.np.coord ? `“${C.subj.np.n.w}” is ${noGName(L, C.subj.key)}, so` : C.subj.key === 'p' ? 'For more than one,' : `For “${sText(C.subj)}”,`} the describing word is “${wants[0]}”: “${noCap(sText(C.subj))} ${v.w} ${C.very ? C.very.w + ' ' : ''}${wants[0]}”.`, i);
        if (C.subj.np && !C.subj.np.coord && !(a.e.d || 'patflr').includes({ person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' }[C.subj.np.cat] || 'p')) return err(`“${a.w}” (${a.e.en}) doesn’t describe ${NO_KIND[C.subj.np.cat] || 'that'} here.`, i);
        C.comp = { adj: T[i++] };
      } else if (peek()?.k === 'noun' || peek()?.k === 'det') return err(`This game uses “${v.w}” with a describing word (“${L.A[0].b}”) or a place (“${L.prep.loc[0]} ${L.N.find(n => n.p === L.prep.loc[0]).def}”).`);
    } else if (V.t === 'have' || V.t === 'tr') {
      if (!C.obj && ['pron', 'det', 'noun', 'adj', 'int'].includes(peek()?.k)) { const o = object(V, V.t === 'have' ? 'have' : 'obj'); if (isErr(o)) return o; C.obj = o; }
      if (!C.obj && V.need) return err(`“${C.verb.w}” needs ${V.t === 'have' ? 'what you have' : 'something after it'}: “${C.verb.w} ${V.objs?.includes('person') ? L.pron[2][1] : L.art[L.N.find(n => V.objs?.includes('*') || V.objs?.includes(n.cat) || L.OPEN.includes(n.w))?.g || L.G[0]] + ' ' + (L.N.find(n => V.objs?.includes('*') || V.objs?.includes(n.cat) || L.OPEN.includes(n.w))?.w || '')}”.`, i < T.length ? i : i - 1);
    } else if (V.t === 'go' && ['det', 'noun'].includes(peek()?.k)) return err(`To say where you go, put “${L.prep.to}” first: “${C.verb.w} ${L.prep.to} ${T.slice(i).find(t => t.k === 'noun')?.w || ''}”.`);
    else if (['pron', 'det', 'noun'].includes(peek()?.k) && V.t !== 'say') return err(`“${C.verb.w}” (${V.en}) doesn’t take an object here.`);
    // places and people: i / på / till / med, then words like hem, hemma, här, i dag
    for (;;) {
      const t = peek();
      if (t?.k === 'prep') {
        if (t.kind === 'to' && V.t !== 'go') return err(`“${t.w}” (to) goes with a verb like “${L.V.find(v => v.t === 'go').pres}”.`);
        if (t.kind === 'to' && (C.dest || C.pps.some(p => p.p.kind === 'to'))) return err('One “to” place is enough.');
        if (t.kind === 'loc' && V.t === 'go' && !C.dest) return err(`To say where you go, use “${L.prep.to}”: “${C.verb.w} ${L.prep.to} ${L.N.find(n => n.cat === 'place').def}”.`);
        const pp = prepPhrase(V); if (isErr(pp)) return pp;
        if (pp.p.kind === 'to') C.dest = pp; else C.pps.push(pp);
        continue;
      }
      if (t?.k === 'adv' && ['time', 'here', 'home', 'athome', 'how'].includes(t.cls)) {
        if (t.cls === 'home') { if (V.t !== 'go') return err(`“${t.w}” means (to) home, with a verb like “${L.V.find(v => v.t === 'go').pres}”. To say at home, use “${L.home[1]}”.`); if (C.dest) return err('One place to go is enough.'); C.dest = { home: t }; i++; continue; }
        if (t.cls === 'athome' && V.t === 'go') return err(`For going home, say “${L.home[0]}”: “${C.verb.w} ${L.home[0]}”.`);
        if (t.cls === 'how' && (V.t === 'be' || !NO_HOW.test(V.en))) return err(`“${t.w}” (well) goes with verbs like ${L.V.filter(v => NO_HOW.test(v.en)).slice(0, 2).map(v => '“' + v.pres + '”').join(' or ')}.`);
        if (t.cls === 'time' && (C.front?.cls === 'time' || C.ends.some(a => a.cls === 'time'))) return err('One word for when is enough.');
        if (C.ends.some(a => a.w === t.w)) return err(`“${t.w}” is already in this part.`);
        C.ends.push(T[i++]); continue;
      }
      break;
    }
    if (V.t === 'go' && !C.dest) return err(`“${C.verb.w}” needs where you go: “${C.verb.w} ${L.prep.to} ${L.N.find(n => n.cat === 'place').def}” or “${C.verb.w} ${L.home[0]}”.`, i < T.length ? i : i - 1);
    if (V.t === 'be' && !C.comp && !C.pps.length && !C.ends.some(a => ['here', 'athome'].includes(a.cls))) return err(`“${C.verb.w}” needs something after it: a describing word (“${L.A[0].b}”) or a place (“${L.home[1]}”).`, i < T.length ? i : i - 1);
    if (isMid(peek())) return err(mode === 'sub' ? `After “${prev.conj}”, “${peek().w}” goes before the verb.` : `“${peek().w}” goes right after the verb: “${noCap(sText(C.subj))} ${C.fin.w} ${peek().w}…”.`);
    C.end = i;
    return C;
  }

  const P = { clauses: [], conjs: [] };
  let mode = 'main', prev = null;
  if (peek()?.k === 'conj' && peek().sub === 'because') { const cj = T[i++]; P.subFirst = cj; prev = { conj: cj.w }; mode = 'sub'; }
  for (;;) {
    const c = clause(mode, prev); if (isErr(c)) return c; P.clauses.push(c);
    if (P.subFirst && P.clauses.length === 1) { if (!peek()) return err(`A part with “${P.subFirst.w}” needs the main sentence after it: “${noCap(P.subFirst.w)} ${L.pron[0][0]} ${L.be} ${L.A[0].b}, ${L.V[0].pres} ${L.pron[0][0]} …”.`, i - 1); mode = 'inv'; prev = { conj: P.subFirst.w }; continue; }
    if (peek()?.k === 'conj') {
      const cj = T[i++];
      if (!peek()) return err(`“${cj.w}” joins two parts, so something has to come after it.`, i - 1);
      if (cj.sub === 'that' && c.V.t !== 'say') return err(`“${cj.w}” (that) goes after a verb like “${L.V.find(v => v.t === 'say').pres}”: “${L.pron[0][0]} ${L.V.find(v => v.t === 'say').pres} ${cj.w} …”.`, i - 1);
      P.conjs.push(cj); mode = cj.sub ? 'sub' : 'cont'; prev = { conj: cj.w, subj: c.subj };
      continue;
    }
    break;
  }
  if (i < T.length) {
    const x = T[i];
    return err(x.k === 'adj' ? `“${x.w}” needs to go right before the noun it describes, or after “${L.be}”.` : x.k === 'det' ? `“${x.w}” needs its noun right after it, in the right place.` : x.k === 'verb' ? `One verb per sentence part. Use “${L.conj[0][0]}” or “${L.conj[1][0]}” to add another.`
      : x.k === 'pron' ? `Who does it goes before the verb. To add another sentence, use “${L.conj[0][0]}” first.` : x.k === 'neg' ? `“${x.w}” goes right after the verb.` : x.k === 'int' ? `“${x.w}” goes right before a describing word.`
      : x.k === 'prep' ? `“${x.w}” needs a noun after it, in the right place.` : x.k === 'adv' && x.cls === 'freq' ? `“${x.w}” goes right after the verb.` : x.k === 'noun' ? `“${x.w}” doesn’t fit here. Is something missing before it?` : `“${x.w}” doesn’t fit here.`);
  }
  return { ok: true, P };
}

/* ---------------- English meaning of a correct sentence ---------------- */
function noEnglish(L, P) {
  const an = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
  const npEn = (np, generic) => {
    if (np.pron) return np.pron.en;
    if (np.coord) return np.coord.map(x => npEn(x, generic)).join(np.conj.w === L.conj[2][0] ? ' or ' : ' and ');
    const adj = np.adj ? (np.very ? 'very ' : '') + np.adj.e.en + ' ' : '', noun = np.en || np.n.en, d = np.det;
    let art = '';
    if (np.poss) art = np.poss.e.en + ' ';
    else if (d?.fam === 'en') art = an(adj || noun) + ' ';
    else if (d?.fam === 'den') art = np.that ? (np.num === 'p' ? 'those ' : 'that ') : 'the ';
    else if (d) art = d.en + ' ';
    else if (np.n.def) art = 'the ';
    else if (np.num === 's' && !np.n.e.mass) art = an(adj || noun) + ' ';   // "Jag har bil": I have a car
    return art + adj + noun;
  };
  const sEn = s => s.pron ? s.pron.r[2] : npEn(s.np);
  const one = C => {
    const V = C.V, per = C.subj.per, third = per === 2, modal = C.fin.e.t === 'modal' ? C.fin.e : null;
    const neg = C.mids.find(t => t.k === 'neg'), never = neg?.never, freq = [...C.mids, ...(C.front?.cls === 'freq' ? [C.front] : [])].find(t => t.k === 'adv')?.en || '';
    const pre = [never ? 'never' : '', freq].filter(Boolean).join(' ');
    let vp;
    const base = V.t === 'be' ? 'be' : V.en;
    if (modal) {
      const m = modal.m, mw = neg && !never ? (third ? m[3] : m[2]) : (third ? m[1] : m[0]);
      vp = / to$/.test(mw) ? `${pre ? pre + ' ' : ''}${mw} ${base}` : `${mw}${pre ? ' ' + pre : ''} ${base}`;
    } else if (V.t === 'be') {
      const be = per === 0 ? 'am' : third ? 'is' : 'are';
      vp = `${be}${neg && !never ? ' not' : ''}${pre ? ' ' + pre : ''}`;
    } else vp = neg && !never ? `${third ? 'does' : 'do'} not${freq ? ' ' + freq : ''} ${V.en}` : `${pre ? pre + ' ' : ''}${third ? V.en3 : V.en}`;
    if (C.comp?.adj) vp += ' ' + (C.very ? 'very ' : '') + C.comp.adj.e.en;
    if (C.obj) vp += ' ' + npEn(C.obj.np || C.obj, V.en === 'love' || V.en === 'like');
    if (C.dest) vp += C.dest.home ? ' home' : ' to ' + npEn(C.dest.np);
    for (const pp of C.pps) vp += ` ${pp.p.en} ${pp.pron ? pp.pron.r[3] : npEn(pp.np)}`;
    const ends = [...C.ends, ...(C.front && C.front.cls !== 'freq' ? [C.front] : [])].map(a => a.cls === 'athome' ? 'at home' : a.en);
    return `${C.shared ? '' : sEn(C.subj) + ' '}${vp}${ends.length ? ' ' + ends.join(' ') : ''}`.replace(/\s+/g, ' ').trim();
  };
  let s;
  if (P.subFirst) s = 'because ' + one(P.clauses[0]) + ', ' + one(P.clauses[1]);
  else s = one(P.clauses[0]);
  P.conjs.forEach((c, k) => {
    const C = P.clauses[k + (P.subFirst ? 2 : 1)];
    s += c.sub === 'because' ? ' because ' : c.sub === 'that' ? ' that ' : C.shared ? ` ${c.en} ` : `, ${c.en} `;
    s += one(C);
  });
  return s[0].toUpperCase() + s.slice(1) + '.';
}
// the sentence as text: a comma after a part that starts with eftersom / fordi, and before men
function noText(L, words) {
  const r = noCheck(L, words);
  let parts = words.map(w => w.w);
  if (r.ok) {
    const at = new Set();
    if (r.P.subFirst) at.add(r.P.clauses[0].end - 1);
    words.forEach((w, k) => { if (k && w.k === 'conj' && w.w === L.conj[1][0]) at.add(k - 1); });
    parts = parts.map((p, k) => at.has(k) ? p + ',' : p);
  }
  const s = parts.join(' ');
  return s[0].toUpperCase() + s.slice(1) + '.';
}

/* ---------------- making a tray ---------------- */
function noGenerate(L, pref) {
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = (list, key) => { const fav = list.filter(x => pref.has(key(x))); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
  const nounOf = cats => RP(L.N.filter(n => cats.includes('*') ? n.cat !== 'place' || coin(0.3) : cats.includes(n.cat) || (cats.includes('open') && L.OPEN.includes(n.w))), n => n.w);
  const adjFor = cat => RP(L.A.filter(a => a.d.includes(CAT[cat] || 'p')), a => a.b);
  const extra = [], other = list => { const x = [...new Set(list.filter(Boolean))]; return x.length ? R(x) : null; };
  const wrongAdj = (a, right) => { const w = other([a.b, a.t, a.e, a.pl, a.f].filter(x => x && x !== right)); if (w) extra.push(noAdjC(a, w)); };
  // a noun phrase in one of the language's patterns (and look-alikes for the tray)
  const np = (n, num, out, role) => {
    const mass = n.mass;
    let mode;
    if (num === 'p') mode = R(['def', 'def', 'bare', 'num', 'some', 'poss', 'den', ...(L.postPoss ? ['post'] : [])]);
    else if (mass) mode = R(['bare', 'bare', 'def', ...(mass === 2 ? ['en'] : [])]);
    else mode = R(['def', 'def', 'en', 'en', 'poss', 'den', ...(L.postPoss ? ['post'] : []), ...(role === 'have' && ['thing', 'animal'].includes(n.cat) ? ['bare'] : [])]);
    if (role === 'pp' && mode === 'bare' && !mass) mode = 'def';
    const key = num === 'p' ? 'p' : n.g, a = mode === 'den' || mode !== 'post' && (mode !== 'bare' || num === 'p' || mass) && coin(0.35) ? adjFor(n.cat) : null;
    let p = null;
    if (mode === 'en') { const w = L.art[n.g]; out.push(noArtC(w)); const wr = other(Object.values(L.art).filter(x => x !== w)); if (wr) extra.push(noArtC(wr)); }
    if (mode === 'den') { out.push(noDenC(L.defArt[key])); extra.push(noDenC(other(Object.values(L.defArt).filter(x => x !== L.defArt[key])))); }
    if (mode === 'poss') { p = RP(L.poss, p => p.en); out.push(noPossC(p, noPossWant(p, key))); const wr = other(Object.values(p.f).filter(x => x !== noPossWant(p, key))); if (wr) extra.push(noPossC(p, wr)); }
    if (mode === 'num' || mode === 'some') { const d = mode === 'some' ? L.some : R(L.num); out.push(noNumC(d[0], d[1], mode)); }
    if (a) {
      if (coin(0.15)) out.push(noVeryC(L));
      const right = mode === 'den' || mode === 'poss' ? noAdjDef(a, num)[0] : num === 'p' ? noAdjPl(a)[0] : noAdjIndef(a, n.g)[0];
      out.push(noAdjC(a, right)); wrongAdj(a, right);
    }
    const def = mode === 'def' || mode === 'post' || (mode === 'den' && L.dbl);
    out.push(noNounC(n, num, def)); if (num === 's' ? n.def : n.dpl) extra.push(noNounC(n, num, !def));
    if (mode === 'post') { p = RP(L.poss, p => p.en); out.push(noPossC(p, noPossWant(p, key))); }
    return { key, num };
  };
  const subjOf = (out, kinds) => {
    if (coin(0.55)) { const r = R(L.pron); out.push(noPronC(L, r[0])); if (r[1] !== r[0]) extra.push(noPronC(L, r[1])); return { key: r[4] ? 'p' : L.G[0], cat: 'person' }; }
    const n = nounOf(kinds), num = n.pl && coin(0.3) ? 'p' : 's';
    const r = np(n, num, out, 'subj');
    if (coin(0.1)) { out.push(noConjC(L, L.conj[0][0])); np(nounOf(kinds), 's', out, 'subj'); return { key: 'p', cat: n.cat, coord: true }; }
    return { key: r.key, cat: n.cat };
  };
  const objOf = (V, out, role) => {
    if (V.objs.includes('person') || V.objs.includes('*')) if (coin(0.25)) { const r = R(L.pron); out.push(noPronC(L, r[1])); if (r[1] !== r[0]) extra.push(noPronC(L, r[0])); return 'pron'; }
    const n = nounOf(V.objs); np(n, n.pl && coin(0.3) ? 'p' : 's', out, role); return 'np';
  };
  const placeNP = (out, prep) => { const n = RP(L.N.filter(n => n.cat === 'place' && (!prep || n.p === prep)), n => n.w); out.push(noPrepC(L, prep || n.p)); np(n, 's', out, 'pp'); if (!prep) { const wr = L.prep.loc.find(p => p !== n.p); if (wr) extra.push(noPrepC(L, wr)); } };
  // one sentence part. mode: main · sub · inv (after a part with eftersom at the start) · cont (after och / men)
  const clause = (mode, kindIn) => {
    const kind = kindIn || R(['tr', 'tr', 'tr', 'in', 'be', 'be', 'have', 'go', 'modal']);
    let V = kind === 'modal' ? null : RP(L.V.filter(v => v.t === (kind === 'say' ? 'say' : kind)), v => v.inf);
    let modal = null;
    if (kind === 'modal') { modal = RP(L.V.filter(v => v.t === 'modal'), v => v.pres); V = RP(L.V.filter(v => ['tr', 'in', 'go'].includes(v.t)), v => v.inf); }
    const subj = [], s = subjOf(subj, V.who === 'p' ? ['person'] : ['person', 'animal']);
    const fin = noVerbC(modal || V);
    extra.push(noInfC(modal ? V : V)); if (modal) extra.push(noVerbC(V));
    const mids = [];
    const negR = Math.random();
    if (negR < 0.2) mids.push(noNegC(L)); else if (negR < 0.26 && V.t !== 'be') mids.push(noNeverC(L)); else if (negR < 0.4) mids.push(noAdvC(L, R(L.adv.filter(a => a[2] === 'freq'))[0]));
    if (!mids.some(m => m.k === 'neg')) extra.push(noNegC(L));
    const after = [];
    if (modal) after.push(noInfC(V));
    let objFirst = null;
    if (V.t === 'be') {
      if (coin(0.65)) { const a = adjFor(s.cat), right = noAdjPred(a, s.key)[0]; if (coin(0.2)) after.push(noVeryC(L)); after.push(noAdjC(a, right)); wrongAdj(a, right); }
      else if (coin(0.6)) placeNP(after); else after.push(noAdvC(L, R([L.home[1], L.here])));
    } else if (V.t === 'have') objOf({ objs: ['thing', 'animal', 'food', 'drink', 'read'] }, after, 'have');
    else if (V.t === 'tr') { if (V.need || coin(0.8)) { const k = objOf(V, after, 'obj'); if (k === 'pron' && !modal && mids.length && mode !== 'sub' && coin(0.5)) objFirst = after.pop(); } }
    else if (V.t === 'go') { if (coin(0.7)) { const n = RP(L.N.filter(n => n.cat === 'place'), n => n.w); after.push(noPrepC(L, L.prep.to)); np(n, 's', after, 'pp'); extra.push(noPrepC(L, n.p)); } else after.push(noAdvC(L, L.home[0])); }
    if (V.t !== 'be' && coin(0.25)) { if (coin(0.5) && V.t !== 'go') placeNP(after); else { after.push(noPrepC(L, L.prep.with)); np(nounOf(['person', 'animal']), 's', after, 'pp'); } }
    else if (V.t === 'in' && NO_HOW.test(V.en) && coin(0.25)) after.push(noAdvC(L, L.well));
    let front = null;
    if (mode === 'main' && coin(0.3)) front = noAdvC(L, R(L.adv.filter(a => a[2] === 'time' || (a[2] === 'freq' && !mids.length)))[0]);
    else if (mode !== 'sub' && coin(0.12)) after.push(noAdvC(L, R(L.adv.filter(a => a[2] === 'time'))[0]));
    let out;
    if (mode === 'sub') out = [...subj, ...mids, fin, ...after];
    else if (front || mode === 'inv') out = [...(front ? [front] : []), fin, ...subj, ...(objFirst ? [objFirst] : []), ...mids, ...after];
    else out = [...subj, fin, ...(objFirst ? [objFirst] : []), ...mids, ...after];
    if (front) extra.push(noPronC(L, R(L.pron)[0]));
    return { out, V, kind };
  };
  for (let tries = 0; tries < 150; tries++) {
    extra.length = 0;
    let words;
    const shape = Math.random();
    if (shape < 0.7) words = clause('main').out;
    else if (shape < 0.8) { const a = clause('main'), cj = R(L.conj.filter(c => !c[2])); words = [...a.out, noConjC(L, cj[0]), ...clause('main').out]; }
    else if (shape < 0.87) { const a = clause('main'), b = clause('sub'); words = [...a.out, noConjC(L, L.because), ...b.out]; }
    else if (shape < 0.94) { const a = clause('main', 'say'); a.out = a.out.filter(w => !(w.k === 'adv' && w.cls === 'time')); words = [...a.out, noConjC(L, L.that), ...clause('sub').out]; }
    else { const a = clause('sub', R(['be', 'in', 'tr'])), b = clause('inv'); words = [noConjC(L, L.because), ...a.out, ...b.out]; }
    if (!words || words.some(w => !w) || words.length > 14 || words.length < 2) continue;
    const res = noCheck(L, words); if (!res.ok) continue;
    extra.push(noPrepC(L, R([...L.prep.loc, L.prep.with])), noArtC(R(Object.values(L.art))));
    if (!words.some(w => w.k === 'conj')) extra.push(noConjC(L, R([L.conj[0][0], L.conj[1][0]])));
    const seen = new Set(words.map(w => w.k + w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && !seen.has(x.k + x.w)) { seen.add(x.k + x.w); uniq.push(x); }
    return { words, extra: uniq.slice(0, Math.max(4, 16 - words.length)), english: noEnglish(L, res.P) };
  }
  return null;
}

/* ---------------- registering a language ---------------- */
function noRegister(code) {
  const L = NO_LANG[code];
  noTables(L);
  L.possW = new Set(L.poss.flatMap(p => Object.values(p.f)));
  const ex = (L.N.find(n => n.w === L.exN) || L.N[0]), exA = L.A[0];
  BLD_LANGS[code] = { name: L.name, check: T => noCheck(L, T), gen: pref => noGenerate(L, pref), voice: L.voice, english: P => noEnglish(L, P), text: words => noText(L, words),
    types: ['pron', 'noun', 'verb', 'adj', 'det', 'prep', 'conj', 'adv'] };
  const pr = L.pron, vEat = L.V.find(v => v.t === 'tr'), vGo = L.V.find(v => v.t === 'go'), mod = L.V.find(v => v.t === 'modal'), when = L.adv.find(a => a[2] === 'time')[0];
  BLD_ORDER[code] = { rows: [
      ['A basic sentence', [['pron', 'who (pronoun or noun)'], ['verb', 'verb'], ['det', `(${L.art[L.G[0]]} / ${L.art.n})`], ['adj', '(adjective)'], ['noun', 'noun']]],
      [`Starting with “${when}” (the verb stays second)`, [['adv', when], ['verb', 'verb'], ['pron', 'who'], ['noun', '…']]],
      [`“The” with a describing word`, [['det', `${L.defArt[L.G[0]]} / ${L.defArt.n} / ${L.defArt.p}`], ['adj', 'adjective'], ['noun', L.dbl ? 'noun + “the” ending' : 'noun (no ending)']]],
      ['Saying what something is like', [['noun', 'noun + “the” ending'], ['verb', L.be], ['adv', `(${L.very})`], ['adj', 'adjective']]],
      ['A negative sentence', [['pron', 'who'], ['verb', 'verb'], ['adv', L.neg], ['noun', '…']]],
      [`With “${mod.pres}”`, [['pron', 'who'], ['verb', mod.pres], ['verb', 'basic form'], ['noun', '…']]],
      [`After “${L.because}”`, [['conj', L.because], ['pron', 'who'], ['adv', `(${L.neg})`], ['verb', 'verb']]],
      ['Going somewhere', [['pron', 'who'], ['verb', vGo.pres], ['prep', L.prep.to], ['noun', 'place']]],
    ], tips: [
      ['noun', `“The” is the end of the noun: <b>${ex.w}</b> → <b>${ex.def}</b>, <b>${ex.pl}</b> → <b>${ex.dpl}</b>.`],
      ['det', `Nouns are ${L.G.map(g => `<b>${L.art[g]}</b>`).join(', ').replace(/, ([^,]*)$/, ' or $1')} words: <b>${L.art[ex.g]} ${ex.w}</b>, <b>${L.art.n} ${L.N.find(n => n.g === 'n').w}</b>.${L.artAlt?.f ? ` A feminine noun can take <b>en</b> too: <b>en ${L.N.find(n => n.g === 'f')?.w}</b>.` : ''}`],
      ['adj', `The describing word agrees: <b>${L.art[L.G[0]]} ${exA.b} ${ex.w}</b>, <b>${L.art.n} ${exA.t} ${L.N.find(n => n.g === 'n').w}</b>, <b>${exA.e} ${ex.pl}</b>.`],
      ['det', L.dbl ? `With a describing word, “the” is said twice: <b>${L.defArt[ex.g]} ${exA.e} ${ex.def}</b>.` : `With a describing word, <b>den / det / de</b> comes first and the noun drops its ending: <b>den ${exA.e} ${ex.w}</b>.`],
      ['verb', `One present form for everyone: <b>${pr[0][0]} ${vEat.pres}</b>, <b>${pr[1][0]} ${vEat.pres}</b>, <b>${pr[4][0]} ${vEat.pres}</b>.`],
      ['adv', `The verb comes second: <b>${noCap(when)} ${vEat.pres} ${pr[0][0]}…</b> <b>${L.neg}</b> goes after the verb, but before it after <b>${L.because}</b> and <b>${L.that}</b>.`],
      ['pron', `After the verb use <b>${pr[0][1]}</b>, <b>${pr[2][1]}</b>, <b>${pr[6][1]}</b> (me, him, them).`]] };
  // your own words from your decks
  { const prevMine = bldApplyMine; bldApplyMine = function () { prevMine(); noApplyMine(L, code); }; }
  BLD_MINE[code] = { name: L.name, forms: `the basic form and the present form (${vEat.inf}, ${vEat.pres})`, nForms: 2,
    m: L.G.length === 3 ? 'en (masculine)' : 'en (common)', f: L.G.length === 3 ? 'ei (feminine)' : `${L.art.n} (neuter)`, n: L.G.length === 3 ? 'et (neuter)' : '',
    conj: w => noConjugate(L, w), pl: w => noPlural(L, w, noGenderGuess(L, w)), adj: w => noAdjForms(L, w), known: w => noKnown(L, w),
    gender: w => noGenderGuess(L, w), isVerb: w => noIsVerb(L, w), refl: () => false,
    // "en bil", "ett hus", "att äta", or one word
    parse: s => {
      const m = s.match(/^(\S+)\s+(\p{L}+)$/u);
      if (m && Object.values(L.art).concat(L.artAlt?.f || []).includes(m[1])) { const g = Object.keys(L.art).find(k => L.art[k] === m[1]) || 'm'; return { w: m[2], g: L.G.length === 3 ? g : g === 'n' ? 'f' : 'm', art: true }; }
      if (m && m[1] === L.inf) return { w: m[2] };
      return /^\p{L}+$/u.test(s) ? { w: s } : null;
    },
    intro: `words with <i>${Object.values(L.art).join(' / ')}</i> are nouns, and words like <i>“${L.inf} ${vEat.inf}”</i> are verbs). The “the” forms are made for you (${ex.def}, ${ex.dpl}), and the present form of common irregular verbs (${L.V.find(v => v.t === 'be').pres}, ${L.V.find(v => v.t === 'have').pres}…); check any that look wrong.` };
  if (typeof GAMES !== 'undefined' && GAMES.builder && !GAMES.builder.desc.includes(L.name)) GAMES.builder.desc = GAMES.builder.desc.replace(/,? and (\p{L}+)\.$/u, ', $1 and ' + L.name + '.');
}

/* ---------------- your own words (📚 Add my deck's words) ---------------- */
const noIsVerb = (L, w) => L.isVerb.test(w) || L.V.some(v => v.inf === w) || !!L.irreg[w];
function noConjugate(L, w) {
  w = String(w || '').replace(new RegExp('^' + L.inf + '\\s+'), '');
  const known = L.V.find(v => v.inf === w);
  if (known) return [w, known.pres];
  if (L.irreg[w]) return [w, L.irreg[w]];
  return [w, L.presOf(w)];
}
function noDefGuess(L, w, g) {
  const v = /[aeiouyåäöæø]$/.test(w);
  if (g === 'n') return v ? w + 't' : (L.code === 'sv' && /e[lnr]$/.test(w) ? w.slice(0, -2) + w.slice(-1) + 'et' : w + 'et');
  if (g === 'f') return v ? w.slice(0, -1) + 'a' : w + 'a';
  return v ? w + 'n' : L.code === 'sv' && /e[lr]$/.test(w) ? w + 'n' : w + 'en';
}
function noDefPl(L, pl, w) {
  if (!pl) return null;
  if (L.code === 'sv') return pl === w ? (/are$/.test(w) ? w.slice(0, -1) + 'na' : w + 'en') : /n$/.test(pl) ? pl + 'a' : pl + 'na';
  if (L.code === 'da') return /e$/.test(pl) || /er$/.test(pl) ? pl + 'ne' : pl + 'ene';
  return /er$/.test(pl) ? pl.slice(0, -1) + 'ne' : /e$/.test(pl) ? pl + 'ne' : pl + 'ene';
}
function noPlural(L, w, g) {
  if (L.code === 'sv') return g === 'f' ? (/[aeiouyåäö]$/.test(w) ? w + 'n' : w) : /a$/.test(w) ? w.slice(0, -1) + 'or' : /e$/.test(w) ? w.slice(0, -1) + 'ar' : w + 'ar';
  return /e$/.test(w) ? w + 'r' : w + 'er';
}
const noGenderGuess = (L, w) => L.neutGuess.test(w) ? (L.G.length === 3 ? 'n' : 'f') : 'm';
function noAdjForms(L, w) {
  const known = L.A.find(a => a.b === w); if (known) return [known.b, known.t, known.e];
  let t, e;
  if (L.code === 'sv') { t = /t$/.test(w) ? w : /[aeiouyåäö]$/.test(w) ? w + 'tt' : /[^aeiou]d$/.test(w) ? w.slice(0, -1) + 't' : /d$/.test(w) ? w.slice(0, -1) + 'tt' : w + 't'; e = /a$/.test(w) ? w : /e[lnr]$/.test(w) ? w.slice(0, -2) + w.slice(-1) + 'a' : w + 'a'; }
  else { t = /t$/.test(w) || (L.code === 'nb' && /ig$/.test(w)) ? w : /[aeiouyåæø]$/.test(w) ? w + (L.code === 'nb' ? 'tt' : 't') : w + 't'; e = /e$/.test(w) ? w : w + 'e'; }
  return [w, t, e];
}
const noKnown = (L, w) => L.N.slice(0, L.BASE.n).some(n => [n.w, n.def, n.pl, n.dpl].includes(w)) || L.V.slice(0, L.BASE.v).some(v => v.inf === w || v.pres === w)
  || L.A.slice(0, L.BASE.a).some(a => [a.b, a.t, a.e].includes(w)) || L.pron.some(p => p.includes(w)) || L.possW.has(w) || L.adv.some(a => a[0] === w) || L.conj.some(c => c[0] === w)
  || [L.neg, L.never, L.very, ...L.prep.loc, L.prep.to, L.prep.with, ...Object.values(L.art), ...Object.values(L.defArt)].includes(w);
function noApplyMine(L, code) {
  L.N.length = L.BASE.n; L.A.length = L.BASE.a; L.V.length = L.BASE.v;
  for (const m of S.bldWords || []) {
    if (!m || (m.lang !== code && !(code === 'nb' && m.lang === 'no')) || !m.w || !m.en || noKnown(L, m.w)) continue;
    if (m.k === 'noun') {
      // the dialog's choices are m / f / n; for Swedish and Danish, f is the "ett" (neuter) choice
      const g = L.G.length === 3 ? (['m', 'f', 'n'].includes(m.g) ? m.g : 'm') : m.g === 'f' || m.g === 'n' ? 'n' : 'c';
      L.N.push({ w: m.w, def: noDefGuess(L, m.w, g), pl: m.pl || null, dpl: noDefPl(L, m.pl, m.w), g, cat: m.cat || 'thing', en: m.en, enPl: m.pl ? (m.enPl || bldPlEn(m.en)) : null, p: m.cat === 'place' ? L.prep.loc[0] : null, mass: m.pl ? 0 : 1 });
    }
    if (m.k === 'verb' && Array.isArray(m.forms) && m.forms.length === 2) {
      const tr = m.obj !== 'in';
      L.V.push({ inf: m.forms[0], pres: m.forms[1], t: tr ? 'tr' : 'in', need: false, objs: tr ? (m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read']) : null, en: m.en, en3: bld3sEn(m.en), who: m.who === 'a' ? 'a' : 'p' });
    }
    if (m.k === 'adj') { const [b, t, e] = noAdjForms(L, m.w); L.A.push({ b, t, e, en: m.en, d: 'patflr', dsg: null, pl: null, f: null }); }
  }
}
