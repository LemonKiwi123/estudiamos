'use strict';
/* ================= 🌎 Social Studies page: world map, flags, capitals, US states and civics =================
   The map and flag data (geodata.js, flags.js) are big, so they load only the first time this page opens. */
const WORLD_TABS = [['map', '🗺️ World map'], ['mapq', '🎯 Map quiz'], ['flags', '🏳️ Flags'], ['caps', '🏙️ Capitals'], ['us', '🗽 US states'], ['civics', '🏛️ Civics'], ['econ', '💰 Economics'], ['cause', '🔀 Cause & effect']];
const WORLD_REGIONS = [['World', '🌐 World'], ['Africa', 'Africa'], ['Asia', 'Asia'], ['Europe', 'Europe'], ['North America', 'North America'], ['South America', 'South America'], ['Oceania', 'Oceania']];
const WORLD_BOX = { Europe: [-25, 34, 50, 71], Asia: [25, -11, 150, 56], Africa: [-20, -36, 55, 38], 'North America': [-170, 5, -50, 84], 'South America': [-92, -56, -30, 14], Oceania: [110, -48, 180, 2] };
const GEO_TERR = new Set('ai as aw ax bl bm bq cc ck cw cx eh fk fo gf gg gi gl gp gs gu hk hm im io je ky mf mo mp mq ms nc nf nu pf pm pn pr re sh sj sx tc tf tk um vg vi wf yt aq bv'.split(' '));
const US_INFO = { '01': ['AL', 'Montgomery', 'South'], '02': ['AK', 'Juneau', 'West'], '04': ['AZ', 'Phoenix', 'West'], '05': ['AR', 'Little Rock', 'South'], '06': ['CA', 'Sacramento', 'West'], '08': ['CO', 'Denver', 'West'],
  '09': ['CT', 'Hartford', 'Northeast'], '10': ['DE', 'Dover', 'South'], '11': ['DC', '', 'South'], '12': ['FL', 'Tallahassee', 'South'], '13': ['GA', 'Atlanta', 'South'], '15': ['HI', 'Honolulu', 'West'], '16': ['ID', 'Boise', 'West'],
  '17': ['IL', 'Springfield', 'Midwest'], '18': ['IN', 'Indianapolis', 'Midwest'], '19': ['IA', 'Des Moines', 'Midwest'], '20': ['KS', 'Topeka', 'Midwest'], '21': ['KY', 'Frankfort', 'South'], '22': ['LA', 'Baton Rouge', 'South'],
  '23': ['ME', 'Augusta', 'Northeast'], '24': ['MD', 'Annapolis', 'South'], '25': ['MA', 'Boston', 'Northeast'], '26': ['MI', 'Lansing', 'Midwest'], '27': ['MN', 'Saint Paul', 'Midwest'], '28': ['MS', 'Jackson', 'South'],
  '29': ['MO', 'Jefferson City', 'Midwest'], '30': ['MT', 'Helena', 'West'], '31': ['NE', 'Lincoln', 'Midwest'], '32': ['NV', 'Carson City', 'West'], '33': ['NH', 'Concord', 'Northeast'], '34': ['NJ', 'Trenton', 'Northeast'],
  '35': ['NM', 'Santa Fe', 'West'], '36': ['NY', 'Albany', 'Northeast'], '37': ['NC', 'Raleigh', 'South'], '38': ['ND', 'Bismarck', 'Midwest'], '39': ['OH', 'Columbus', 'Midwest'], '40': ['OK', 'Oklahoma City', 'South'],
  '41': ['OR', 'Salem', 'West'], '42': ['PA', 'Harrisburg', 'Northeast'], '44': ['RI', 'Providence', 'Northeast'], '45': ['SC', 'Columbia', 'South'], '46': ['SD', 'Pierre', 'Midwest'], '47': ['TN', 'Nashville', 'South'],
  '48': ['TX', 'Austin', 'South'], '49': ['UT', 'Salt Lake City', 'West'], '50': ['VT', 'Montpelier', 'Northeast'], '51': ['VA', 'Richmond', 'South'], '53': ['WA', 'Olympia', 'West'], '54': ['WV', 'Charleston', 'South'],
  '55': ['WI', 'Madison', 'Midwest'], '56': ['WY', 'Cheyenne', 'West'] };
const GEO_DOTS = [['ad', 1.52, 42.51], ['ag', -61.8, 17.08], ['bh', 50.55, 26.07], ['bb', -59.55, 13.18], ['cv', -23.6, 15.1], ['km', 43.3, -11.7], ['dm', -61.36, 15.42], ['fm', 158.2, 6.9], ['gd', -61.68, 12.12],
  ['va', 12.45, 41.9], ['ki', 173, 1.45], ['li', 9.55, 47.15], ['mv', 73.5, 4.2], ['mt', 14.45, 35.9], ['mh', 171.2, 7.1], ['mu', 57.55, -20.25], ['mc', 7.42, 43.74], ['nr', 166.93, -0.53], ['pw', 134.55, 7.5], ['kn', -62.75, 17.3],
  ['lc', -60.98, 13.9], ['vc', -61.2, 13.25], ['ws', -172.1, -13.75], ['sm', 12.46, 43.94], ['st', 6.6, 0.3], ['sc', 55.45, -4.65], ['sg', 103.82, 1.35], ['to', -175.2, -21.15], ['tv', 179.2, -8.5]];   // small countries the outline map is too coarse to show: a dot at about where they are
let geoItemsMemo = null;
const geoItems = () => geoItemsMemo ||= [...GEO_WORLD.c, ...GEO_DOTS.map(([c, lo, la]) => { const [x, y] = geoProj(lo, la); return [c, '', [x, y, x, y]]; })];
function world() { const w = (S.settings.world ||= {}); w.tab ||= 'map'; w.region ||= 'World'; w.sel ??= null; w.terr ??= false; return w; }
const worldSave = () => { clearTimeout(worldSave.t); worldSave.t = setTimeout(() => { try { save(); } catch {} }, 300); };
/* ---------- loading the data ---------- */
const geoLoad = { state: 'no', wait: null };
function geoReady() {
  if (window.GEO_WORLD && window.GEO_FLAGS) return true;
  if (geoLoad.state === 'no') {
    geoLoad.state = 'loading';
    const one = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
    Promise.all([one('geodata.js'), one('flags.js')]).then(() => { geoLoad.state = 'ok'; if (view.name === 'world') render(); }).catch(() => { geoLoad.state = 'no'; geoLoad.err = true; if (view.name === 'world') render(); });
  }
  return false;
}
/* ---------- helpers ---------- */
const gc = code => window.GEO_COUNTRIES?.[code] || [code, '', ''];
const gName = code => gc(code)[0];
const flagImg = (code, cls = 'flag') => window.GEO_FLAGS?.[code] ? `<img class="${cls}" alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(GEO_FLAGS[code])}">` : `<span class="${cls} none"></span>`;
function geoProj(lon, lat) {   // Equal Earth, the same numbers geodata.js was made with
  const A1 = 1.340264, A2 = -0.081106, A3 = 0.000893, A4 = 0.003796, M = Math.sqrt(3) / 2, SC = 1000 / (2 * 2.70663);
  const l = lon * Math.PI / 180, th = Math.asin(M * Math.sin(lat * Math.PI / 180)), t2 = th * th, t6 = t2 ** 3;
  return [2 * Math.sqrt(3) * l * Math.cos(th) / (3 * (9 * A4 * t6 * t2 + 7 * A3 * t6 + 3 * A2 * t2 + A1)) * SC + 500, -th * (A4 * t6 * t2 + A3 * t6 + A2 * t2 + A1) * SC + 1.3173 * SC];
}
function regionVB(r) {
  if (r === 'World' || !WORLD_BOX[r]) return GEO_WORLD.vb;
  const [a, b, c, d] = WORLD_BOX[r], pts = []; for (let i = 0; i <= 8; i++) { const lo = a + (c - a) * i / 8, la = b + (d - b) * i / 8; pts.push(geoProj(lo, b), geoProj(lo, d), geoProj(a, la), geoProj(c, la)); }
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys); return [x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0].map(v => Math.round(v * 10) / 10);
}
const inRegion = (code, r) => r === 'World' || gc(code)[2] === r;
function geoPool(kind) {   // which places a quiz can ask about
  const w = world();
  if (kind === 'map') return geoItems().map(c => c[0]).filter(c => !GEO_TERR.has(c) && inRegion(c, w.region));
  return Object.keys(GEO_COUNTRIES).filter(c => (w.terr || !GEO_TERR.has(c)) && inRegion(c, w.region) && (kind !== 'caps' || gc(c)[1]) && (kind !== 'flags' || GEO_FLAGS[c]));
}
function mapSvg({ items, vb, cls = () => '', label = x => x, act = 'c', tiny = 10, clip = '' }) {   // items: [id, path, bbox]
  const r = Math.max(1.6, vb[2] / 260);
  return `<svg class="geo-map" viewBox="${vb.join(' ')}" role="img" aria-label="Map">${clip ? `<defs><clipPath id="geoClip"><path d="${clip}"/></clipPath></defs><path d="${clip}" class="geo-sea"/><g clip-path="url(#geoClip)">` : ''}${items.map(([id, d, bb]) => {
    const small = (bb[2] - bb[0]) * (bb[3] - bb[1]) < tiny, c = cls(id);
    return `<g class="geo-c ${c}" data-geo-${act}="${id}">${d ? `<path d="${d}"/>` : ''}${small ? `<circle cx="${(bb[0] + bb[2]) / 2}" cy="${(bb[1] + bb[3]) / 2}" r="${r}" class="geo-dot"/>` : ''}<title>${esc(label(id))}</title></g>`; }).join('')}${clip ? '</g>' : ''}</svg>`;
}
const regionBtns = (extra = '') => `<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:8px">${WORLD_REGIONS.map(([k, l]) => `<button type="button" class="btn sm ${world().region === k ? 'primary' : ''}" data-wo="region" data-k="${k}">${l}</button>`).join('')}${extra}</div>`;
function worldMakeDeck(name, rows) {
  let d = S.decks.find(x => x.name === name);
  if (!d) { d = { id: uid(), created: Date.now(), name, frontLang: 'en-US', backLang: 'en-US', newPerDay: 20, direction: 'front', subject: 'history' }; S.decks.push(d); }
  const have = new Set(cardsOf(d.id).map(c => c.front)); let n = 0;
  for (const [f, b, extra] of rows) if (!have.has(f)) { S.cards.push({ id: uid(), deckId: d.id, front: f, back: b, notes: '', example: '', exampleTr: '', state: 'new', due: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0, step: 0, created: Date.now(), ...(extra || {}) }); n++; }
  save(); return [d, n];
}
function worldTimeline(name, events) {
  if (typeof tlAll !== 'function') return; const t = { id: uid(), name, desc: '', subject: 'history', created: Date.now(), style: 'list', events: events.map(e => ({ id: uid(), y: e.y, m: 0, d: 0, title: e.title, note: e.text || '' })) };
  tlAll().push(t); save(); toast('🕰️ Timeline made'); go({ name: 'timeline', tl: t.id });
}
const qMsg = (q, right, wrongTxt) => q?.given ? (q.ok ? `✓ ${right}` : wrongTxt) : '';
const scoreLine = s => `<span class="muted small">Score ${s.right || 0} / ${s.tries || 0} · streak ${s.streak || 0} · best ${s.best || 0}</span>`;
function scoreHit(s, ok) { s.tries = (s.tries || 0) + 1; if (ok) { s.right = (s.right || 0) + 1; s.streak = (s.streak || 0) + 1; s.best = Math.max(s.best || 0, s.streak); if (typeof rightSound === 'function') rightSound(); } else { s.streak = 0; if (typeof sdSound === 'function') sdSound('wrong'); } }
/* ---------- 🗺️ explore the world map ---------- */
function infoCard(code) {
  if (!code) return `<div class="geo-info muted">Tap a country to see its flag and capital.</div>`;
  const [n, cap, cont] = gc(code);
  return `<div class="geo-info">${flagImg(code, 'flag big')}<div><div class="geo-nm">${esc(n)}</div>${cap ? `<div>🏙️ Capital: <b>${esc(cap)}</b></div>` : ''}<div class="muted small">${esc(cont)}${GEO_TERR.has(code) ? ' · territory' : ''}</div>
    <button type="button" class="btn sm ghost" data-wo="say" data-k="${code}" style="margin-top:4px">🔊 Say it</button></div></div>`;
}
function worldMapHtml() {
  const w = world(), vb = regionVB(w.region);
  return `${regionBtns()}
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px"><input class="inp" style="margin:0;max-width:260px" placeholder="🔍 Find a country" data-wo-find value="${esc(w.find || '')}" list="geoList" autocomplete="off">
      <datalist id="geoList">${geoItems().map(c => `<option value="${esc(gName(c[0]))}">`).join('')}</datalist></div>
    <div class="geo-wrap">${mapSvg({ items: geoItems(), clip: GEO_WORLD.clip, vb, cls: c => (c === w.sel ? 'sel' : '') + (inRegion(c, w.region) ? '' : ' dim'), label: gName })}</div>
    <div id="geoInfo">${infoCard(w.sel)}</div>
    <p class="muted small">Some very small countries are shown as dots. The map uses the Equal Earth projection, so countries keep their true sizes compared to each other.</p>`;
}
/* ---------- 🎯 map quiz: find the country ---------- */
function mapQNew() { const w = world(), pool = geoPool('map'), last = w.mq?.code; let c; do c = pool[Math.floor(Math.random() * pool.length)]; while (pool.length > 1 && c === last); w.mq = { ...(w.mq || {}), code: c, miss: 0, given: false, ok: false, wrongs: [] }; }
function worldMapQHtml() {
  const w = world(); if (!w.mq?.code || !inRegion(w.mq.code, w.region)) mapQNew(); const q = w.mq;
  return `${regionBtns()}
    <div class="geo-ask">${q.given ? (q.ok ? `✓ That’s <b>${esc(gName(q.code))}</b>!` : `This is <b>${esc(gName(q.code))}</b>.`) : `Find <b>${esc(gName(q.code))}</b>${q.miss ? ` <span class="muted small">(${3 - q.miss} ${3 - q.miss === 1 ? 'try' : 'tries'} left)</span>` : ''}`}</div>
    <div class="geo-wrap">${mapSvg({ items: geoItems(), clip: GEO_WORLD.clip, vb: regionVB(w.region), cls: c => (q.given && c === q.code ? (q.ok ? 'ok' : 'show') : '') + (q.wrongs.includes(c) ? ' no' : '') + (inRegion(c, w.region) ? '' : ' dim'), label: c => q.given || q.wrongs.includes(c) ? gName(c) : '' , act: 'q' })}</div>
    <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px">${q.given ? '<button type="button" class="btn primary" data-wo="mqNext">Next country →</button>' : '<button type="button" class="btn ghost" data-wo="mqSkip">Show me</button>'}${scoreLine(q)}</div>`;
}
/* ---------- 🏳️ flags ---------- */
function flagQNew() { const w = world(), pool = geoPool('flags'); const c = pool[Math.floor(Math.random() * pool.length)]; w.fq = { ...(w.fq || {}), code: c, opts: shuffle([c, ...shuffle(pool.filter(x => x !== c)).slice(0, 3)]), given: null, ok: false }; }
function worldFlagsHtml() {
  const w = world(); w.fmode ||= 'name'; if (!w.fq?.code || !geoPool('flags').includes(w.fq.code)) flagQNew(); const q = w.fq, rev = w.fmode === 'flag';
  return `${regionBtns(`<label class="check" style="margin-left:6px"><input type="checkbox" data-wo-terr ${w.terr ? 'checked' : ''}><span>Include territories</span></label>`)}
    <div class="seg-btns" style="margin-bottom:10px">${[['name', 'Flag → country'], ['flag', 'Country → flag'], ['all', 'See all flags']].map(([k, l]) => `<button type="button" class="btn sm ${w.fmode === k ? 'primary' : ''}" data-wo="fmode" data-k="${k}">${l}</button>`).join('')}</div>
    ${w.fmode === 'all' ? `<div class="geo-flags">${geoPool('flags').sort((a, b) => gName(a).localeCompare(gName(b))).map(c => `<button type="button" class="geo-fl" data-wo="pick" data-k="${c}">${flagImg(c)}<span>${esc(gName(c))}</span></button>`).join('')}</div>
      <div class="row" style="gap:8px;margin-top:10px"><button type="button" class="btn" data-wo="flagCards">📇 Make flag flashcards (${esc(w.region)})</button></div>` : `
    <div class="geo-q">${rev ? `<div class="geo-ask">Which flag belongs to <b>${esc(gName(q.code))}</b>?</div>
      <div class="geo-fopts">${q.opts.map(c => `<button type="button" class="geo-fopt ${q.given ? (c === q.code ? 'ok' : c === q.given ? 'no' : '') : ''}" data-wo="fans" data-k="${c}" ${q.given ? 'disabled' : ''} aria-label="Flag option">${flagImg(c)}${q.given ? `<span class="small">${esc(gName(c))}</span>` : ''}</button>`).join('')}</div>`
      : `<div class="geo-bigflag">${flagImg(q.code, 'flag huge')}</div><div class="geo-ask">Which country is this?</div>
      <div class="civ-opts">${q.opts.map(c => `<button type="button" class="btn big ${q.given ? (c === q.code ? 'primary' : c === q.given ? 'danger' : '') : ''}" data-wo="fans" data-k="${c}" ${q.given ? 'disabled' : ''}>${esc(gName(c))}</button>`).join('')}</div>`}
      <div class="sm-qmsg">${qMsg(q, `Yes, ${esc(gName(q.code))}!`, `That’s the flag of <b>${esc(gName(q.code))}</b>.`)}</div>
      <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap">${q.given ? '<button type="button" class="btn primary" data-wo="fNext">Next flag →</button>' : ''}${scoreLine(q)}</div></div>`}`;
}
/* ---------- 🏙️ capitals ---------- */
function capQNew() { const w = world(), pool = geoPool('caps'); const c = pool[Math.floor(Math.random() * pool.length)]; w.cq = { ...(w.cq || {}), code: c, opts: shuffle([c, ...shuffle(pool.filter(x => x !== c && gc(x)[1] !== gc(c)[1])).slice(0, 3)]), given: null, ok: false }; }
function worldCapsHtml() {
  const w = world(); w.cmode ||= 'cap'; if (!w.cq?.code || !geoPool('caps').includes(w.cq.code)) capQNew(); const q = w.cq, rev = w.cmode === 'country';
  const list = () => { const f = (w.cfind || '').toLowerCase(); return geoPool('caps').filter(c => !f || (gName(c) + ' ' + gc(c)[1]).toLowerCase().includes(f)).sort((a, b) => gName(a).localeCompare(gName(b))); };
  return `${regionBtns(`<label class="check" style="margin-left:6px"><input type="checkbox" data-wo-terr ${w.terr ? 'checked' : ''}><span>Include territories</span></label>`)}
    <div class="seg-btns" style="margin-bottom:10px">${[['cap', 'Country → capital'], ['country', 'Capital → country'], ['list', 'List']].map(([k, l]) => `<button type="button" class="btn sm ${w.cmode === k ? 'primary' : ''}" data-wo="cmode" data-k="${k}">${l}</button>`).join('')}</div>
    ${w.cmode === 'list' ? `<input class="inp" style="max-width:280px" placeholder="🔍 Search countries and capitals" data-wo-cfind value="${esc(w.cfind || '')}" autocomplete="off">
      <div class="geo-list">${list().map(c => `<div class="geo-row">${flagImg(c)}<b>${esc(gName(c))}</b><span>${esc(gc(c)[1])}</span><span class="muted small">${esc(gc(c)[2])}</span></div>`).join('') || '<p class="muted">Nothing matches.</p>'}</div>
      <button type="button" class="btn" data-wo="capCards" style="margin-top:10px">📇 Make capital flashcards (${esc(w.region)})</button>` : `
    <div class="geo-q"><div class="geo-bigflag">${flagImg(q.code, 'flag mid')}</div>
      <div class="geo-ask">${rev ? `<b>${esc(gc(q.code)[1])}</b> is the capital of…` : `What is the capital of <b>${esc(gName(q.code))}</b>?`}</div>
      <div class="civ-opts">${q.opts.map(c => `<button type="button" class="btn big ${q.given ? (c === q.code ? 'primary' : c === q.given ? 'danger' : '') : ''}" data-wo="cans" data-k="${c}" ${q.given ? 'disabled' : ''}>${esc(rev ? gName(c) : gc(c)[1])}</button>`).join('')}</div>
      <div class="sm-qmsg">${qMsg(q, `${esc(gc(q.code)[1])} is the capital of ${esc(gName(q.code))}.`, `The capital of ${esc(gName(q.code))} is <b>${esc(gc(q.code)[1])}</b>.`)}</div>
      <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap">${q.given ? '<button type="button" class="btn primary" data-wo="cNext">Next →</button>' : ''}${scoreLine(q)}</div></div>`}`;
}
/* ---------- 🇺🇸 US states ---------- */
const usAll = () => GEO_US.s.filter(s => s[0] !== '11');
function usQNew() { const w = world(), pool = usAll(); let s; do s = pool[Math.floor(Math.random() * pool.length)]; while (s[0] === w.uq?.id); const opts = w.umode === 'cap' ? shuffle([s, ...shuffle(pool.filter(x => x !== s)).slice(0, 3)]).map(x => x[0]) : []; w.uq = { ...(w.uq || {}), id: s[0], opts, miss: 0, wrongs: [], given: null, ok: false }; }
function worldUsHtml() {
  const w = world(); w.umode ||= 'explore'; const nm = id => GEO_US.s.find(s => s[0] === id)?.[1] || '', inf = id => US_INFO[id] || ['', '', ''];
  if (w.umode !== 'explore' && !w.uq?.id) usQNew(); const q = w.uq;
  const map = cls => `<div class="geo-wrap us">${mapSvg({ items: GEO_US.s.map(s => [s[0], s[2], s[3]]), vb: GEO_US.vb, cls, label: id => w.umode === 'find' && !q?.given && !q?.wrongs?.includes(id) ? '' : nm(id), act: w.umode === 'explore' ? 'u' : 'uq', tiny: 220 })}</div>`;
  const modes = `<div class="seg-btns" style="margin-bottom:10px">${[['explore', 'Explore'], ['find', 'Find the state'], ['cap', 'State capitals']].map(([k, l]) => `<button type="button" class="btn sm ${w.umode === k ? 'primary' : ''}" data-wo="umode" data-k="${k}">${l}</button>`).join('')}</div>`;
  if (w.umode === 'explore') { const s = w.usel, [ab, cap, reg] = inf(s);
    return `${modes}${map(id => id === s ? 'sel' : '')}
      <div class="geo-info">${s ? `<div class="geo-ab">${ab}</div><div><div class="geo-nm">${esc(nm(s))}</div>${cap ? `<div>🏛️ Capital: <b>${esc(cap)}</b></div>` : '<div>The nation’s capital (not a state)</div>'}<div class="muted small">${reg} region</div></div>` : '<span class="muted">Tap a state to see its capital and abbreviation.</span>'}</div>
      <div class="row" style="gap:8px;margin-top:8px"><button type="button" class="btn" data-wo="usCards">📇 Make state capital flashcards</button></div>`; }
  if (w.umode === 'find') return `${modes}<div class="geo-ask">${q.given ? (q.ok ? `✓ That’s <b>${esc(nm(q.id))}</b>!` : `This is <b>${esc(nm(q.id))}</b>.`) : `Find <b>${esc(nm(q.id))}</b>${q.miss ? ` <span class="muted small">(${3 - q.miss} left)</span>` : ''}`}</div>
    ${map(id => (q.given && id === q.id ? (q.ok ? 'ok' : 'show') : '') + (q.wrongs.includes(id) ? ' no' : ''))}
    <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px">${q.given ? '<button type="button" class="btn primary" data-wo="uNext">Next state →</button>' : '<button type="button" class="btn ghost" data-wo="uSkip">Show me</button>'}${scoreLine(q)}</div>`;
  return `${modes}<div class="geo-q"><div class="geo-ask">What is the capital of <b>${esc(nm(q.id))}</b>?</div>
    <div class="civ-opts">${q.opts.map(id => `<button type="button" class="btn big ${q.given ? (id === q.id ? 'primary' : id === q.given ? 'danger' : '') : ''}" data-wo="uans" data-k="${id}" ${q.given ? 'disabled' : ''}>${esc(inf(id)[1])}</button>`).join('')}</div>
    <div class="sm-qmsg">${qMsg(q, `${esc(inf(q.id)[1])} is the capital of ${esc(nm(q.id))}.`, `The capital of ${esc(nm(q.id))} is <b>${esc(inf(q.id)[1])}</b>.`)}</div>
    <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap">${q.given ? '<button type="button" class="btn primary" data-wo="uNext">Next →</button>' : ''}${scoreLine(q)}</div></div>
    ${map(id => id === q.id ? (q.given ? (q.ok ? 'ok' : 'show') : 'sel') : '')}`;
}
/* ---------- the page ---------- */
views.world = () => {
  const w = world(), ready = ['civics', 'econ', 'cause'].includes(w.tab) || geoReady(); if (w.tab === 'cause') setTimeout(() => typeof cmArrows === 'function' && cmArrows(), 0);
  const body = !ready ? `<div class="panel" style="text-align:center;padding:40px">${geoLoad.err ? 'The maps couldn’t load. Check that Estudiamos is up to date, then try again. <button type="button" class="btn" data-wo="retry">Try again</button>' : '🌎 Loading the maps and flags…'}</div>`
    : `<div class="panel world-panel">${({ map: worldMapHtml, mapq: worldMapQHtml, flags: worldFlagsHtml, caps: worldCapsHtml, us: worldUsHtml, civics: civicsHtml, econ: () => econHtml(), cause: () => causeHtml() })[w.tab]()}</div>`;
  return `<div class="crumbs"><a data-act="homeSubject" data-k="history">🏛️ Social Studies & History</a> / Social Studies</div>
    <div class="row-between" style="margin-bottom:12px"><h2 style="margin:0">🌎 Social Studies</h2>
      <div class="row" style="gap:6px;flex-wrap:wrap">${WORLD_TABS.map(([k, l]) => `<button type="button" class="btn sm ${w.tab === k ? 'primary' : ''}" data-wo="tab" data-k="${k}">${l}</button>`).join('')}</div></div>${body}`;
};
function worldRedraw() { const p = document.querySelector('.world-panel'); if (!p || view.name !== 'world') return render(); const y = window.scrollY; p.innerHTML = ({ map: worldMapHtml, mapq: worldMapQHtml, flags: worldFlagsHtml, caps: worldCapsHtml, us: worldUsHtml, civics: civicsHtml, econ: () => econHtml(), cause: () => causeHtml() })[world().tab](); window.scrollTo(0, y); if (world().tab === 'cause') cmArrows(); }
Object.assign(actions, { world: el => { if (el?.dataset?.t) world().tab = el.dataset.t; go({ name: 'world' }); } });
document.addEventListener('click', e => {
  if (view.name !== 'world') return; const w = world();
  const c = e.target.closest('[data-geo-c]'); if (c) { w.sel = c.dataset.geoC; worldSave(); document.querySelectorAll('.geo-c.sel').forEach(x => x.classList.remove('sel')); c.classList.add('sel'); document.getElementById('geoInfo').innerHTML = infoCard(w.sel); return; }
  const mq = e.target.closest('[data-geo-q]'); if (mq) { const q = w.mq; if (!q || q.given || !inRegion(mq.dataset.geoQ, w.region)) return; const ok = mq.dataset.geoQ === q.code;
    if (ok || q.miss >= 2) { q.given = true; q.ok = ok && true; scoreHit(q, ok && q.miss === 0); } else { q.miss++; if (!q.wrongs.includes(mq.dataset.geoQ)) q.wrongs.push(mq.dataset.geoQ); if (typeof sdSound === 'function') sdSound('wrong'); }
    worldSave(); return worldRedraw(); }
  const uc = e.target.closest('[data-geo-u]'); if (uc) { w.usel = uc.dataset.geoU; worldSave(); return worldRedraw(); }
  const uq = e.target.closest('[data-geo-uq]'); if (uq) { const q = w.uq; if (!q || q.given || w.umode !== 'find') return; const id = uq.dataset.geoUq, ok = id === q.id;
    if (ok || q.miss >= 2) { q.given = true; q.ok = ok; scoreHit(q, ok && q.miss === 0); } else { q.miss++; if (!q.wrongs.includes(id)) q.wrongs.push(id); if (typeof sdSound === 'function') sdSound('wrong'); }
    worldSave(); return worldRedraw(); }
  const b = e.target.closest('[data-wo]'); if (!b) return; const k = b.dataset.k;
  switch (b.dataset.wo) {
    case 'tab': w.tab = k; worldSave(); return render();
    case 'retry': geoLoad.err = false; return render();
    case 'region': w.region = k; if (w.mq) w.mq.code = null; if (w.fq) w.fq.code = null; if (w.cq) w.cq.code = null; break;
    case 'say': if (typeof speak === 'function') speak(gName(k), 'en-US'); return;
    case 'mqNext': mapQNew(); break;
    case 'mqSkip': w.mq.given = true; w.mq.ok = false; scoreHit(w.mq, false); break;
    case 'fmode': w.fmode = k; flagQNew(); break;
    case 'fans': { const q = w.fq; if (q.given) return; q.given = k; q.ok = k === q.code; scoreHit(q, q.ok); break; }
    case 'fNext': flagQNew(); break;
    case 'pick': w.sel = k; w.tab = 'map'; w.region = inRegion(k, w.region) ? w.region : 'World'; worldSave(); return render();
    case 'cmode': w.cmode = k; capQNew(); break;
    case 'cans': { const q = w.cq; if (q.given) return; q.given = k; q.ok = k === q.code; scoreHit(q, q.ok); break; }
    case 'cNext': capQNew(); break;
    case 'umode': w.umode = k; w.uq = { ...(w.uq || {}), id: null }; break;
    case 'uNext': usQNew(); break;
    case 'uSkip': w.uq.given = true; w.uq.ok = false; scoreHit(w.uq, false); break;
    case 'uans': { const q = w.uq; if (q.given) return; q.given = k; q.ok = k === q.id; scoreHit(q, q.ok); break; }
    case 'capCards': { const [d, n] = worldMakeDeck(`Capitals: ${w.region}`, geoPool('caps').map(c => [`Capital of ${gName(c)}`, gc(c)[1]])); toast(n ? `📇 Added ${n} cards to “${d.name}”` : `“${d.name}” already has these cards`); return; }
    case 'usCards': { const [d, n] = worldMakeDeck('US state capitals', usAll().map(s => [`Capital of ${s[1]}`, US_INFO[s[0]][1]])); toast(n ? `📇 Added ${n} cards to “${d.name}”` : `“${d.name}” already has these cards`); return; }
    case 'flagCards': { (async () => {   // each flag is saved as a picture on the front of its card
        const pool = geoPool('flags'), rows = [];
        for (const c of pool) { let id; try { id = await putMedia(new Blob([GEO_FLAGS[c]], { type: 'image/svg+xml' })); } catch { toast('Pictures can’t be saved here'); return; } rows.push([`Flag #${c}`, gName(c), { frontHtml: `<img data-mid="${id}" alt="A flag" style="max-width:260px;border-radius:6px;box-shadow:0 1px 4px #0003">` }]); }
        const [d, n] = worldMakeDeck(`Flags: ${w.region}`, rows); toast(n ? `📇 Added ${n} flag cards to “${d.name}”` : `“${d.name}” already has these cards`); })(); return; }
    default: return;
  }
  worldSave(); worldRedraw();
});
document.addEventListener('change', e => {
  if (view.name !== 'world') return; const w = world();
  if (e.target.matches('[data-wo-terr]')) { w.terr = e.target.checked; w.fq = w.fq && { ...w.fq, code: null }; w.cq = w.cq && { ...w.cq, code: null }; worldSave(); worldRedraw(); }
  if (e.target.matches('[data-wo-find]')) { const v = e.target.value.trim().toLowerCase(), hit = geoItems().find(c => gName(c[0]).toLowerCase() === v) || geoItems().find(c => gName(c[0]).toLowerCase().startsWith(v));
    if (hit) { w.sel = hit[0]; if (!inRegion(hit[0], w.region)) w.region = 'World'; w.find = ''; worldSave(); worldRedraw(); } else toast('No country by that name on the map'); }
});
document.addEventListener('input', e => { if (view.name !== 'world' || !e.target.matches('[data-wo-cfind]')) return; const w = world(); w.cfind = e.target.value; const pos = e.target.selectionStart; worldRedraw(); const i = document.querySelector('[data-wo-cfind]'); i?.focus(); try { i.setSelectionRange(pos, pos); } catch {} });
