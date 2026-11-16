'use strict';
/* ================= 🔬 Science lab: periodic table, rocks & minerals, space =================
   Reference data is built in (works offline). Atomic weights are standard values rounded;
   [brackets] = mass number of the most stable isotope. Planet facts from NASA fact sheets. */

/* ---------- 🧪 the periodic table ---------- */
const PT_RAW = `H,Hydrogen,1.008|He,Helium,4.0026|Li,Lithium,6.94|Be,Beryllium,9.0122|B,Boron,10.81|C,Carbon,12.011|N,Nitrogen,14.007|O,Oxygen,15.999|F,Fluorine,18.998|Ne,Neon,20.180|Na,Sodium,22.990|Mg,Magnesium,24.305|Al,Aluminum,26.982|Si,Silicon,28.085|P,Phosphorus,30.974|S,Sulfur,32.06|Cl,Chlorine,35.45|Ar,Argon,39.95|K,Potassium,39.098|Ca,Calcium,40.078|Sc,Scandium,44.956|Ti,Titanium,47.867|V,Vanadium,50.942|Cr,Chromium,51.996|Mn,Manganese,54.938|Fe,Iron,55.845|Co,Cobalt,58.933|Ni,Nickel,58.693|Cu,Copper,63.546|Zn,Zinc,65.38|Ga,Gallium,69.723|Ge,Germanium,72.630|As,Arsenic,74.922|Se,Selenium,78.971|Br,Bromine,79.904|Kr,Krypton,83.798|Rb,Rubidium,85.468|Sr,Strontium,87.62|Y,Yttrium,88.906|Zr,Zirconium,91.224|Nb,Niobium,92.906|Mo,Molybdenum,95.95|Tc,Technetium,[98]|Ru,Ruthenium,101.07|Rh,Rhodium,102.91|Pd,Palladium,106.42|Ag,Silver,107.87|Cd,Cadmium,112.41|In,Indium,114.82|Sn,Tin,118.71|Sb,Antimony,121.76|Te,Tellurium,127.60|I,Iodine,126.90|Xe,Xenon,131.29|Cs,Cesium,132.91|Ba,Barium,137.33|La,Lanthanum,138.91|Ce,Cerium,140.12|Pr,Praseodymium,140.91|Nd,Neodymium,144.24|Pm,Promethium,[145]|Sm,Samarium,150.36|Eu,Europium,151.96|Gd,Gadolinium,157.25|Tb,Terbium,158.93|Dy,Dysprosium,162.50|Ho,Holmium,164.93|Er,Erbium,167.26|Tm,Thulium,168.93|Yb,Ytterbium,173.05|Lu,Lutetium,174.97|Hf,Hafnium,178.49|Ta,Tantalum,180.95|W,Tungsten,183.84|Re,Rhenium,186.21|Os,Osmium,190.23|Ir,Iridium,192.22|Pt,Platinum,195.08|Au,Gold,196.97|Hg,Mercury,200.59|Tl,Thallium,204.38|Pb,Lead,207.2|Bi,Bismuth,208.98|Po,Polonium,[209]|At,Astatine,[210]|Rn,Radon,[222]|Fr,Francium,[223]|Ra,Radium,[226]|Ac,Actinium,[227]|Th,Thorium,232.04|Pa,Protactinium,231.04|U,Uranium,238.03|Np,Neptunium,[237]|Pu,Plutonium,[244]|Am,Americium,[243]|Cm,Curium,[247]|Bk,Berkelium,[247]|Cf,Californium,[251]|Es,Einsteinium,[252]|Fm,Fermium,[257]|Md,Mendelevium,[258]|No,Nobelium,[259]|Lr,Lawrencium,[266]|Rf,Rutherfordium,[267]|Db,Dubnium,[268]|Sg,Seaborgium,[269]|Bh,Bohrium,[270]|Hs,Hassium,[269]|Mt,Meitnerium,[278]|Ds,Darmstadtium,[281]|Rg,Roentgenium,[282]|Cn,Copernicium,[285]|Nh,Nihonium,[286]|Fl,Flerovium,[289]|Mc,Moscovium,[290]|Lv,Livermorium,[293]|Ts,Tennessine,[294]|Og,Oganesson,[294]`;
const PT_CATS = {
  alkali: ['Alkali metal', '#ff8a7a', [3, 11, 19, 37, 55, 87]], alkaline: ['Alkaline earth metal', '#ffbf6b', [4, 12, 20, 38, 56, 88]],
  transition: ['Transition metal', '#f5d76e', [...ptRange(21, 30), ...ptRange(39, 48), ...ptRange(72, 80), ...ptRange(104, 108)]],
  post: ['Post-transition metal', '#9fd4a3', [13, 31, 49, 50, 81, 82, 83, 84]], metalloid: ['Metalloid', '#7fd1c7', [5, 14, 32, 33, 51, 52]],
  nonmetal: ['Other nonmetal', '#8ec5ff', [1, 6, 7, 8, 15, 16, 34]], halogen: ['Halogen', '#b9a7ff', [9, 17, 35, 53, 85]],
  noble: ['Noble gas', '#e2a6ff', [2, 10, 18, 36, 54, 86]], lanthanide: ['Lanthanide', '#ffb3d1', ptRange(57, 71)], actinide: ['Actinide', '#ff9ec0', ptRange(89, 103)],
  unknown: ['Properties not yet known', '#d5d5d5', ptRange(109, 118)],
};
function ptRange(a, b) { return Array.from({ length: b - a + 1 }, (_, i) => a + i); }
const PT_GAS = new Set([1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86]), PT_LIQ = new Set([35, 80]);
const PT = PT_RAW.split('|').map((s, i) => {
  const [sym, name, mass] = s.split(','), n = i + 1, cat = Object.keys(PT_CATS).find(k => PT_CATS[k][2].includes(n)) || 'unknown';
  const ends = [2, 10, 18, 36, 54, 86, 118], period = ends.findIndex(e => n <= e) + 1, start = period === 1 ? 1 : ends[period - 2] + 1, end = ends[period - 1];
  let group, row = period, col;
  if (n >= 57 && n <= 71) { row = 9; col = 3 + (n - 57); group = null; }
  else if (n >= 89 && n <= 103) { row = 10; col = 3 + (n - 89); group = null; }
  else if (period === 1) group = n === 1 ? 1 : 18;
  else if (n - start < 2) group = n - start + 1;
  else group = 18 - (end - n);
  return { n, sym, name, mass, cat, period, group, row, col: col ?? group, phase: n > 108 ? 'Unknown' : PT_GAS.has(n) ? 'Gas' : PT_LIQ.has(n) ? 'Liquid' : 'Solid' };
});
function ptHtml() {
  const s = sci(), sel = PT.find(e => e.n === s.el) || PT[0], q = norm(s.ptq || ''), hi = s.cat;
  const match = e => (!q || norm(`${e.sym} ${e.name} ${e.n}`).includes(q)) && (!hi || e.cat === hi);
  const cell = e => `<button type="button" class="pt-el ${e.n === sel.n ? 'on' : ''} ${match(e) ? '' : 'dim'}" style="grid-row:${e.row};grid-column:${e.col};--c:${PT_CATS[e.cat][1]}" data-sci="el" data-n="${e.n}" title="${e.n} ${esc(e.name)}"><span class="pt-n">${e.n}</span><b>${e.sym}</b><span class="pt-name">${esc(e.name)}</span></button>`;
  return `<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:10px"><input type="search" class="inp" id="ptQ" placeholder="Find an element: name, symbol or number" value="${esc(s.ptq || '')}" style="margin:0;max-width:320px">
      <button type="button" class="btn" data-sci="ptQuiz">🎯 Element quiz</button><button type="button" class="btn" data-sci="ptCards">📇 Make flashcards</button></div>
    <div class="pt-scroll"><div class="pt">
      ${PT.map(cell).join('')}
      <div class="pt-gap" style="grid-row:6;grid-column:3">57–71</div><div class="pt-gap" style="grid-row:7;grid-column:3">89–103</div>
      <div class="pt-info" style="grid-row:1 / span 3;grid-column:3 / span 10">${ptInfoHtml(sel)}</div>
    </div></div>
    <div class="pt-info-m">${ptInfoHtml(sel)}</div>
    <div class="pt-legend">${Object.entries(PT_CATS).map(([k, [n, c]]) => `<button type="button" class="pt-key ${hi === k ? 'on' : ''}" style="--c:${c}" data-sci="cat" data-k="${k}"><i></i>${n}</button>`).join('')}</div>
    <p class="muted small">Tap an element for details, or a color to light up that family. Masses in [brackets] are for the most stable form of a radioactive element.</p>`;
}
function ptInfoHtml(e) {
  return `<div class="pt-big" style="--c:${PT_CATS[e.cat][1]}"><span>${e.n}</span><b>${e.sym}</b><span>${esc(e.mass)}</span></div>
    <div class="pt-facts"><h3 style="margin:0">${esc(e.name)}</h3>
      <div class="small">${esc(PT_CATS[e.cat][0])} · ${e.phase} at room temperature</div>
      <div class="small muted">Atomic number ${e.n} · atomic mass ${esc(e.mass)} · period ${e.period}${e.group ? ` · group ${e.group}` : ' · f-block'}</div>
      <div class="small muted">${e.n} proton${e.n > 1 ? 's' : ''} and, in a neutral atom, ${e.n} electron${e.n > 1 ? 's' : ''}.</div></div>`;
}
/* 🎯 element quiz: symbol → name (and name → symbol), common elements first */
let ptQ = null;
function ptQuizNew() {
  const s = sci(), pool = PT.filter(e => e.n <= (s.ptRight >= 15 ? 86 : 36)), e = pool[Math.floor(Math.random() * pool.length)], flip = Math.random() < 0.5;
  const wrong = shuffle(pool.filter(x => x.n !== e.n)).slice(0, 3);
  ptQ = { e, flip, opts: shuffle([e, ...wrong]).map(x => flip ? x.sym : x.name), answer: flip ? e.sym : e.name, given: null };
}
function ptQuizHtml() {
  const s = sci(); if (!ptQ) ptQuizNew();
  return `<div class="mu-ear"><div class="row" style="justify-content:space-between"><button type="button" class="btn sm ghost" data-sci="ptBack">← Periodic table</button><span class="muted small">✓ ${s.ptRight || 0} of ${s.ptTotal || 0}</span></div>
    <p class="muted" style="margin:14px 0 6px">${ptQ.flip ? 'What is the symbol for…' : 'Which element has the symbol…'}</p>
    <div class="sci-q">${ptQ.flip ? esc(ptQ.e.name) : `<span class="pt-big" style="--c:${PT_CATS[ptQ.e.cat][1]};display:inline-flex"><b>${ptQ.e.sym}</b></span>`}</div>
    <div class="mu-opts">${ptQ.opts.map(o => `<button type="button" class="btn ${ptQ.given ? (o === ptQ.answer ? 'right' : o === ptQ.given ? 'wrong' : '') : ''}" data-sci="ptPick" data-v="${esc(o)}" ${ptQ.given ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
    ${ptQ.given ? `<div class="mu-verdict ${ptQ.given === ptQ.answer ? 'ok' : 'no'}">${ptQ.given === ptQ.answer ? '✓ Right!' : `It’s <b>${esc(ptQ.answer)}</b>.`} ${esc(ptQ.e.name)} (${ptQ.e.sym}) is number ${ptQ.e.n}.</div>
      <div style="text-align:center;margin-top:10px"><button type="button" class="btn primary big" data-sci="ptNext">Next ▶</button></div>` : ''}</div>`;
}

/* ---------- 🪨 rocks & minerals ---------- */
const ROCKS = {
  igneous: ['🌋 Igneous', 'Forms when melted rock (magma or lava) cools and hardens.', [['Granite', 'Cooled slowly underground, so it has big crystals you can see. Used for countertops.'], ['Basalt', 'Cooled quickly from lava. Dark and fine-grained; it makes up most of the ocean floor.'], ['Obsidian', 'Lava that cooled so fast it became natural glass, with sharp edges.'], ['Pumice', 'Lava full of gas bubbles. So light that it can float on water.']]],
  sedimentary: ['🏜️ Sedimentary', 'Forms from bits of sand, mud, shells and other sediment pressed and cemented together in layers.', [['Sandstone', 'Made of sand grains cemented together.'], ['Limestone', 'Mostly calcite, often from shells and coral. It fizzes in acid.'], ['Shale', 'Made of mud and clay. Breaks into thin layers.'], ['Conglomerate', 'Rounded pebbles cemented together.']]],
  metamorphic: ['🔥 Metamorphic', 'Forms when another rock is changed by heat and pressure deep underground, without melting.', [['Marble', 'Limestone changed by heat and pressure. Used for statues.'], ['Slate', 'Shale changed into hard, flat sheets. Used for roofs.'], ['Quartzite', 'Sandstone changed into a very hard rock.'], ['Gneiss', 'Has light and dark bands, often from granite.']]],
};
const MOHS = [[1, 'Talc'], [2, 'Gypsum'], [3, 'Calcite'], [4, 'Fluorite'], [5, 'Apatite'], [6, 'Orthoclase feldspar'], [7, 'Quartz'], [8, 'Topaz'], [9, 'Corundum'], [10, 'Diamond']];
const MOHS_TOOLS = [[2.5, '💅 Fingernail'], [3.5, '🪙 Copper coin'], [5.5, '🔪 Glass / steel knife'], [6.5, '🛠️ Steel file']];
/* name, formula, hardness [min,max], luster, streak, what helps you spot it */
const MINERALS = [
  ['Quartz', 'SiO₂', [7, 7], 'Glassy', 'White', 'Very common; scratches glass; no cleavage'],
  ['Orthoclase feldspar', 'KAlSi₃O₈', [6, 6], 'Glassy', 'White', 'Often pink; breaks along flat faces'],
  ['Calcite', 'CaCO₃', [3, 3], 'Glassy', 'White', 'Fizzes in weak acid; breaks into slanted boxes'],
  ['Halite', 'NaCl', [2.5, 2.5], 'Glassy', 'White', 'Rock salt: salty taste, cube-shaped crystals'],
  ['Gypsum', 'CaSO₄·2H₂O', [2, 2], 'Glassy to pearly', 'White', 'Soft enough to scratch with a fingernail'],
  ['Muscovite mica', 'KAl₂(AlSi₃O₁₀)(OH)₂', [2, 2.5], 'Pearly', 'White', 'Peels into thin, see-through sheets'],
  ['Talc', 'Mg₃Si₄O₁₀(OH)₂', [1, 1], 'Pearly to greasy', 'White', 'Feels soapy; the softest mineral'],
  ['Fluorite', 'CaF₂', [4, 4], 'Glassy', 'White', 'Often purple or green; may glow under UV light'],
  ['Pyrite', 'FeS₂', [6, 6.5], 'Metallic', 'Greenish black', '“Fool’s gold”: brassy yellow, often in cubes'],
  ['Hematite', 'Fe₂O₃', [5.5, 6.5], 'Metallic to dull', 'Reddish brown', 'Red-brown streak even when the rock looks gray'],
  ['Magnetite', 'Fe₃O₄', [5.5, 6.5], 'Metallic', 'Black', 'Magnetic: it pulls a magnet'],
  ['Galena', 'PbS', [2.5, 2.5], 'Metallic', 'Lead gray', 'Very heavy; shiny silver-gray cubes'],
  ['Graphite', 'C', [1, 2], 'Metallic', 'Black to gray', 'Soft and greasy; it’s the “lead” in pencils'],
  ['Diamond', 'C', [10, 10], 'Adamantine (brilliant)', 'None (too hard)', 'The hardest natural mineral'],
  ['Corundum', 'Al₂O₃', [9, 9], 'Glassy to brilliant', 'None (too hard)', 'Rubies and sapphires are corundum'],
  ['Topaz', 'Al₂SiO₄(F,OH)₂', [8, 8], 'Glassy', 'None (too hard)', 'Hard gemstone, often clear, yellow or blue'],
];
function rockCycleSvg() {   // a ring: magma → igneous → sediment → sedimentary → metamorphic → magma, plus igneous → metamorphic
  const node = (x, y, label, c) => `<g><rect x="${x - 62}" y="${y - 20}" width="124" height="40" rx="12" fill="${c}"/><text x="${x}" y="${y + 5}" class="rc-t">${label}</text></g>`;
  const arrow = (d, label, lx, ly) => `<path d="${d}" class="rc-a" marker-end="url(#rcA)"/>${label ? `<text x="${lx}" y="${ly}" class="rc-l">${label}</text>` : ''}`;
  return `<svg viewBox="0 0 520 330" class="rock-cycle" role="img" aria-label="The rock cycle: magma cools into igneous rock; weathering and erosion break rock into sediment; sediment is pressed and cemented into sedimentary rock; heat and pressure change rock into metamorphic rock; metamorphic rock melts back into magma">
    <defs><marker id="rcA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="rc-head"/></marker></defs>
    ${arrow('M200,58 L122,128', 'cooling', 136, 82)}
    ${arrow('M92,172 L148,268', 'weathering &amp; erosion', 70, 236)}
    ${arrow('M222,290 L296,290', 'pressing &amp; cementing', 260, 322)}
    ${arrow('M372,268 L428,172', 'heat &amp; pressure', 462, 236)}
    ${arrow('M418,128 L322,58', 'melting', 392, 82)}
    ${arrow('M144,150 L376,150', 'heat &amp; pressure', 260, 140)}
    ${node(260, 40, '🔥 Magma', '#ffb38a')}${node(80, 150, '🌋 Igneous', '#ff8a7a')}${node(440, 150, '💎 Metamorphic', '#b9a7ff')}
    ${node(160, 290, '🪨 Sediment', '#e7d3a8')}${node(360, 290, '🏜️ Sedimentary', '#f5d76e')}</svg>`;
}
function rocksHtml() {
  const s = sci(), f = s.minF || {};
  const fits = m => (!f.luster || (f.luster === 'metallic') === /^Metallic/.test(m[3]))
    && (!f.hard || (f.hard === 'soft' ? m[2][0] < 2.5 : f.hard === 'mid' ? m[2][1] >= 2.5 && m[2][0] <= 5.5 : m[2][1] > 5.5))
    && (!f.streak || (f.streak === 'white' ? /white/i.test(m[4]) : f.streak === 'none' ? /none/i.test(m[4]) : !/white|none/i.test(m[4])));
  const list = MINERALS.filter(fits);
  return `<div class="mu-two"><div class="panel"><h3 style="margin-top:0">The rock cycle</h3>${rockCycleSvg()}
      <p class="muted small" style="margin:6px 0 0">Rocks slowly change from one kind to another over thousands to millions of years.</p></div>
    <div class="panel"><h3 style="margin-top:0">Mohs hardness scale</h3>
      <div class="mohs">${MOHS.map(([h, n]) => `<div class="mohs-row"><b>${h}</b><div class="mohs-bar"><i style="width:${h * 10}%"></i></div><span>${esc(n)}</span></div>`).join('')}</div>
      <p class="muted small" style="margin:8px 0 4px">A mineral scratches anything softer than itself. Everyday things to test with:</p>
      <div class="row" style="gap:6px;flex-wrap:wrap">${MOHS_TOOLS.map(([h, n]) => `<span class="pill">${n} ≈ ${h}</span>`).join('')}</div></div></div>
    <h3 style="margin:18px 0 8px">The three kinds of rock</h3>
    <div class="rock-grid">${Object.values(ROCKS).map(([name, how, ex]) => `<div class="panel"><h3 style="margin:0">${name}</h3><p class="muted small" style="margin:4px 0 8px">${esc(how)}</p>
      ${ex.map(([n, d]) => `<div class="rock-ex"><b>${esc(n)}</b> <span class="small">${esc(d)}</span></div>`).join('')}</div>`).join('')}</div>
    <div class="row-between" style="margin:18px 0 8px"><h3 style="margin:0">Minerals chart · identify a mineral</h3><button type="button" class="btn sm" data-sci="minCards">📇 Make flashcards</button></div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:8px">
      <select class="inp" data-scif="luster" style="margin:0;width:auto"><option value="">Any shine (luster)</option><option value="metallic" ${f.luster === 'metallic' ? 'selected' : ''}>Shiny like metal</option><option value="non" ${f.luster === 'non' ? 'selected' : ''}>Not like metal</option></select>
      <select class="inp" data-scif="hard" style="margin:0;width:auto"><option value="">Any hardness</option><option value="soft" ${f.hard === 'soft' ? 'selected' : ''}>Fingernail scratches it (under 2.5)</option><option value="mid" ${f.hard === 'mid' ? 'selected' : ''}>Knife scratches it (2.5–5.5)</option><option value="hard" ${f.hard === 'hard' ? 'selected' : ''}>It scratches glass (over 5.5)</option></select>
      <select class="inp" data-scif="streak" style="margin:0;width:auto"><option value="">Any streak color</option><option value="white" ${f.streak === 'white' ? 'selected' : ''}>White streak</option><option value="color" ${f.streak === 'color' ? 'selected' : ''}>Colored or dark streak</option><option value="none" ${f.streak === 'none' ? 'selected' : ''}>No streak (too hard)</option></select>
      ${f.luster || f.hard || f.streak ? `<button type="button" class="btn sm ghost" data-sci="minClear">Clear</button>` : ''}
      <span class="muted small" style="align-self:center">${list.length} of ${MINERALS.length} minerals</span></div>
    <div class="sci-table-wrap"><table class="sci-table"><thead><tr><th>Mineral</th><th>Formula</th><th>Hardness</th><th>Luster</th><th>Streak</th><th>How to spot it</th></tr></thead>
      <tbody>${list.map(m => `<tr><td><b>${esc(m[0])}</b></td><td>${esc(m[1])}</td><td>${m[2][0] === m[2][1] ? m[2][0] : `${m[2][0]}–${m[2][1]}`}</td><td>${esc(m[3])}</td><td>${esc(m[4])}</td><td class="small">${esc(m[5])}</td></tr>`).join('')}</tbody></table></div>
    <p class="muted small">Streak is the color of a mineral’s powder when you rub it on a rough white tile.</p>`;
}

/* ---------- 🔭 space ---------- */
/* name, emoji, AU from Sun, diameter km, known moons, day length, year length, surface gravity m/s², color, fact */
const PLANETS = [
  ['Mercury', '☿️', 0.39, 4879, '0', '59 Earth days to spin once', '88 days', 3.7, '#a8a29e', 'The smallest planet and closest to the Sun.'],
  ['Venus', '♀️', 0.72, 12104, '0', '243 Earth days (it spins backward)', '225 days', 8.87, '#e8c27a', 'The hottest planet: its thick clouds trap heat.'],
  ['Earth', '🌍', 1, 12756, '1', '24 hours', '365.25 days', 9.81, '#4b8df5', 'The only planet we know has life.'],
  ['Mars', '♂️', 1.52, 6792, '2', '24.6 hours', '687 days', 3.71, '#d9603b', 'Home of Olympus Mons, the tallest volcano in the solar system.'],
  ['Jupiter', '♃', 5.2, 142984, '95+', '9.9 hours', '11.9 years', 24.79, '#d8a979', 'The biggest planet. Its Great Red Spot is a giant storm.'],
  ['Saturn', '🪐', 9.54, 120536, '274', '10.7 hours', '29.5 years', 10.44, '#e8d08f', 'Famous for its bright rings of ice and rock.'],
  ['Uranus', '⛢', 19.2, 51118, '28', '17.2 hours', '84 years', 8.69, '#8fd5e0', 'It spins on its side.'],
  ['Neptune', '♆', 30.06, 49528, '16', '16.1 hours', '165 years', 11.15, '#4f72e8', 'The windiest planet, with the fastest winds measured.'],
];
const MOON_G = 1.62;
function moonPhase(date) {   // days since a known new moon (Jan 6, 2000 18:14 UTC), on a 29.53-day cycle
  const P = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14), age = (((date - ref) / 86400000) % P + P) % P, f = age / P;
  const illum = (1 - Math.cos(2 * Math.PI * f)) / 2;
  const names = [[0.0339, '🌑 New moon'], [0.2161, '🌒 Waxing crescent'], [0.2839, '🌓 First quarter'], [0.4661, '🌔 Waxing gibbous'], [0.5339, '🌕 Full moon'], [0.7161, '🌖 Waning gibbous'], [0.7839, '🌗 Last quarter'], [0.9661, '🌘 Waning crescent'], [1.01, '🌑 New moon']];
  return { age, f, illum, name: names.find(([x]) => f < x)[1], nextFull: (0.5 - f + (f > 0.5 ? 1 : 0)) * P, nextNew: (1 - f) * P };
}
function moonSvg(f) {   // lit part of the Moon as seen from the Northern Hemisphere
  const r = 60, k = Math.cos(2 * Math.PI * f), waxing = f < 0.5, rx = Math.abs(k) * r;
  const lit = waxing ? `M60,0 A${r},${r} 0 0 1 60,120 A${rx},${r} 0 0 ${k > 0 ? 0 : 1} 60,0` : `M60,0 A${r},${r} 0 0 0 60,120 A${rx},${r} 0 0 ${k > 0 ? 1 : 0} 60,0`;
  return `<svg viewBox="0 0 120 120" class="moon-svg" aria-hidden="true"><circle cx="60" cy="60" r="60" fill="#2b2f3a"/><path d="${lit}" fill="#f2efe4"/></svg>`;
}
function spaceHtml() {
  const s = sci(), p = PLANETS.find(x => x[0] === s.planet) || PLANETS[2], maxD = 142984;
  const today = new Date(), dStr = s.moonDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`, mp = moonPhase(new Date(dStr + 'T12:00:00'));
  const w = +s.weight || 0;
  return `<div class="panel"><h3 style="margin-top:0">The planets</h3>
      <div class="planets">${PLANETS.map(x => { const size = Math.round(14 + 66 * Math.sqrt(x[3] / maxD)); return `<button type="button" class="planet ${x === p ? 'on' : ''}" data-sci="planet" data-k="${x[0]}" title="${x[0]}"><span class="pl-ball" style="width:${size}px;height:${size}px;background:radial-gradient(circle at 35% 35%, #fff8, ${x[8]} 45%, ${x[8]})"></span><span class="small">${x[0]}</span></button>`; }).join('')}</div>
      <div class="planet-info"><h3 style="margin:0">${p[1]} ${p[0]}</h3><p style="margin:4px 0 8px">${esc(p[9])}</p>
        <div class="pl-facts">${[['Distance from the Sun', `${p[2]} AU (${Math.round(p[2] * 149.6).toLocaleString()} million km)`], ['Width', `${p[3].toLocaleString()} km (${(p[3] / 12756).toFixed(2)} × Earth)`], ['Known moons', p[4]], ['One day', p[5]], ['One year', p[6]], ['Gravity', `${p[7]} m/s² (${(p[7] / 9.81).toFixed(2)} × Earth)`]]
          .map(([a, b]) => `<div><span class="muted small">${a}</span><b>${esc(b)}</b></div>`).join('')}</div></div>
      <p class="muted small" style="margin:8px 0 0">Planet sizes are drawn to scale with each other, not distances. 1 AU is the distance from Earth to the Sun. Moon counts keep growing as astronomers find small ones.</p></div>
    <div class="mu-two" style="margin-top:12px">
      <div class="panel"><h3 style="margin-top:0">Moon phase</h3>
        <div class="row" style="gap:14px;align-items:center;flex-wrap:wrap">${moonSvg(mp.f)}
          <div><div style="font-size:20px;font-weight:700">${mp.name}</div><div class="muted small">${Math.round(mp.illum * 100)}% lit · ${mp.age.toFixed(1)} days into the cycle</div>
            <div class="small" style="margin-top:6px">Next full moon in about <b>${Math.round(mp.nextFull)}</b> day${Math.round(mp.nextFull) === 1 ? '' : 's'}, next new moon in about <b>${Math.round(mp.nextNew)}</b>.</div>
            <label class="field" style="margin-top:8px">Pick a date<input type="date" class="inp" data-scif="moonDate" value="${dStr}"></label></div></div>
        <p class="muted small" style="margin:6px 0 0">Shown as seen from the Northern Hemisphere. The Moon goes through all its phases about every 29.5 days.</p></div>
      <div class="panel"><h3 style="margin-top:0">Your weight on other worlds</h3>
        <label class="field">Your weight on Earth<input type="number" class="inp" data-scif="weight" min="0" max="2000" value="${w || ''}" placeholder="e.g. 60"></label>
        <div class="wt-list">${[...PLANETS.map(x => [x[1] + ' ' + x[0], x[7]]), ['🌕 The Moon', MOON_G]].map(([n, g]) => `<div class="wt-row"><span>${n}</span><b>${w ? (w * g / 9.81).toFixed(1) : '–'}</b></div>`).join('')}</div>
        <p class="muted small" style="margin:6px 0 0">Your mass stays the same everywhere; your weight changes with each world’s gravity. Uses the same unit you typed (kg or lb).</p></div></div>`;
}


/* ---------- ⚗️ chemistry: molar mass, grams ↔ moles, balancing equations, the pH scale ---------- */
const PT_MASS = Object.fromEntries(PT.map(e => [e.sym, parseFloat(String(e.mass).replace(/[\[\]]/g, ''))]));
function chemParse(f) {   // "Ca(OH)2", "CuSO4·5H2O" → Map(element → count)
  const src = String(f).replace(/\s+/g, '').replace(/[·•*]/g, '.'); if (!src) throw new Error('Type a formula, like H2O');
  const add = (m, k, n) => m.set(k, (m.get(k) || 0) + n);
  const part = s => { let i = 0; const read = () => { const out = new Map();
      while (i < s.length) { const ch = s[i];
        if (ch === '(' || ch === '[') { i++; const inner = read(); if (s[i] !== ')' && s[i] !== ']') throw new Error('A bracket is missing'); i++; const n = num(); for (const [k, v] of inner) add(out, k, v * n); }
        else if (ch === ')' || ch === ']') return out;
        else if (/[A-Z]/.test(ch)) { let sym = ch; i++; if (/[a-z]/.test(s[i] || '')) sym += s[i++]; if (!(sym in PT_MASS)) throw new Error(`“${sym}” isn’t an element symbol`); add(out, sym, num()); }
        else throw new Error(`“${ch}” doesn’t belong in a formula`); }
      return out; };
    const num = () => { let d = ''; while (/\d/.test(s[i] || '')) d += s[i++]; return d ? +d : 1; };
    const m = read(); if (i < s.length) throw new Error('There’s an extra “)”'); return m; };
  const total = new Map();
  for (const chunk of src.split('.')) { if (!chunk) continue; const c = chunk.match(/^(\d+)(.*)$/), n = c ? +c[1] : 1, body = c ? c[2] : chunk; for (const [k, v] of part(body)) add(total, k, v * n); }
  if (!total.size) throw new Error('Type a formula, like H2O'); return total;
}
const chemMass = m => [...m].reduce((a, [k, n]) => a + PT_MASS[k] * n, 0);
const fmt4 = v => (Math.round(v * 1000) / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 });
const subN = s => String(s).replace(/(?<=[A-Za-z)\]])(\d+)/g, '<sub>$1</sub>');
/* balancing: find whole-number coefficients with fractions (exact), via row reduction of the element table */
function chemBalance(eq) {
  const [L, R] = String(eq).split(/\s*(?:->|→|=|⟶)\s*/); if (!R) throw new Error('Use an arrow: like H2 + O2 -> H2O');
  const side = s => s.split(/\s+\+\s+|\s*\+\s*(?=[A-Z(\[\d])/).map(x => x.trim().replace(/^\d+\s*(?=[A-Z(\[])/, '')).filter(Boolean);
  const left = side(L), right = side(R), all = [...left, ...right], comps = all.map(chemParse);
  const els = [...new Set(comps.flatMap(m => [...m.keys()]))];
  for (const e of els) if (!left.some((_, i) => comps[i].has(e)) || !right.some((_, i) => comps[left.length + i].has(e))) throw new Error(`${e} is only on one side, so this can’t balance`);
  const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
  const fr = (n, d = 1n) => { if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return [n / g, d / g]; };
  const sub = (a, b) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]), mul = (a, b) => fr(a[0] * b[0], a[1] * b[1]), div = (a, b) => fr(a[0] * b[1], a[1] * b[0]);
  const M = els.map(e => all.map((_, j) => fr(BigInt((comps[j].get(e) || 0) * (j < left.length ? 1 : -1)))));
  const rows = M.length, cols = all.length, piv = []; let r = 0;
  for (let c = 0; c < cols && r < rows; c++) {
    let p = r; while (p < rows && M[p][c][0] === 0n) p++; if (p === rows) continue;
    [M[r], M[p]] = [M[p], M[r]]; const pv = M[r][c]; M[r] = M[r].map(x => div(x, pv));
    for (let k = 0; k < rows; k++) if (k !== r && M[k][c][0] !== 0n) { const f = M[k][c]; M[k] = M[k].map((x, j) => sub(x, mul(f, M[r][j]))); }
    piv.push(c); r++;
  }
  const free = [...Array(cols).keys()].filter(c => !piv.includes(c));
  if (free.length !== 1) throw new Error(free.length ? 'This one has more than one way to balance: check the formulas' : 'This can’t be balanced: check the formulas');
  const x = Array(cols).fill(null); x[free[0]] = fr(1n);
  piv.forEach((c, i) => { x[c] = fr(-M[i][free[0]][0], M[i][free[0]][1]); });
  const lcm = x.reduce((a, [, d]) => a / gcd(a, d) * d, 1n); let ints = x.map(([n, d]) => n * lcm / d);
  if (ints.some(v => v <= 0n)) { if (ints.every(v => v <= 0n)) ints = ints.map(v => -v); else throw new Error('This can’t be balanced with these formulas'); }
  const g = ints.reduce((a, v) => gcd(a, v)); ints = ints.map(v => Number(v / g));
  return { left, right, coef: ints };
}
const PH = [[0, 'Battery acid'], [1, 'Stomach acid'], [2, 'Lemon juice, vinegar'], [3, 'Orange juice, soda'], [4, 'Tomato juice'], [5, 'Black coffee'], [6, 'Milk'], [7, 'Pure water (neutral)'], [8, 'Sea water, eggs'], [9, 'Baking soda'], [10, 'Milk of magnesia'], [11, 'Ammonia cleaner'], [12, 'Soapy water'], [13, 'Bleach'], [14, 'Drain cleaner']];
function chemHtml() {
  const s = sci(), f = s.chemF ?? 'C6H12O6', eq = s.chemEq ?? 'C3H8 + O2 -> CO2 + H2O';
  let mm = '', mmErr = '', mass = 0; try { const m = chemParse(f); mass = chemMass(m);
    mm = `<div class="chem-big">${subN(esc(f.replace(/\s+/g, '')))} = <b>${fmt4(mass)}</b> g/mol</div><table class="sci-table chem-tab"><thead><tr><th>Element</th><th>Atoms</th><th>Mass</th><th>% of the mass</th></tr></thead><tbody>${[...m].map(([k, n]) => `<tr><td><b>${k}</b> ${esc(PT.find(e => e.sym === k).name)}</td><td>${n}</td><td>${fmt4(PT_MASS[k] * n)}</td><td>${(PT_MASS[k] * n / mass * 100).toFixed(1)}%</td></tr>`).join('')}</tbody></table>`; } catch (e) { mmErr = e.message; }
  let bal = '', balErr = ''; try { const { left, right, coef } = chemBalance(eq), t = (list, off) => list.map((x, i) => `${coef[off + i] > 1 ? `<b class="chem-co">${coef[off + i]}</b>` : ''}${subN(esc(x))}`).join(' + ');
    bal = `<div class="chem-big">${t(left, 0)} → ${t(right, left.length)}</div><p class="muted small" style="margin:4px 0 0">Each side now has the same number of every kind of atom.</p>`; } catch (e) { balErr = e.message; }
  const g = s.chemG ?? '', mol = s.chemMol ?? '';
  return `<div class="art-two"><div class="panel"><h3 style="margin-top:0">⚖️ Molar mass</h3>
      <input class="inp mono" data-chem="chemF" value="${esc(f)}" placeholder="e.g. H2O, Ca(OH)2, CuSO4·5H2O" spellcheck="false" autocomplete="off">
      <div id="chemMM">${mmErr ? `<p class="tt-err small">⚠️ ${esc(mmErr)}</p>` : mm}</div>
      <h4 style="margin:12px 0 4px">Grams ↔ moles of ${subN(esc(f))}</h4>
      <div class="row" style="gap:8px;flex-wrap:wrap"><label class="field" style="margin:0">Grams<input class="inp" inputmode="decimal" data-chem="chemG" value="${esc(g)}" placeholder="e.g. 90"></label>
        <label class="field" style="margin:0">Moles<input class="inp" inputmode="decimal" data-chem="chemMol" value="${esc(mol)}" placeholder="e.g. 0.5"></label></div>
      <p class="small" id="chemConv">${mass && (g || mol) ? (() => { const n = g ? +g / mass : +mol; return `${fmt4(n * mass)} g = <b>${fmt4(n)}</b> mol = <b>${(n * 6.02214076e23).toExponential(3).replace('e+', ' × 10^')}</b> molecules`; })() : '<span class="muted">Type grams or moles. 1 mole = 6.022 × 10²³ particles.</span>'}</p></div>
    <div class="panel"><h3 style="margin-top:0">🧮 Balance an equation</h3>
      <input class="inp mono" data-chem="chemEq" value="${esc(eq)}" placeholder="e.g. Fe + O2 -> Fe2O3" spellcheck="false" autocomplete="off">
      <div class="row" style="gap:6px;flex-wrap:wrap;margin:6px 0">${['H2 + O2 -> H2O', 'Fe + O2 -> Fe2O3', 'CH4 + O2 -> CO2 + H2O', 'Al + HCl -> AlCl3 + H2', 'C6H12O6 + O2 -> CO2 + H2O'].map(x => `<button type="button" class="btn sm ghost mono" data-sci="chemEx" data-k="${esc(x)}">${subN(esc(x))}</button>`).join('')}</div>
      <div id="chemBal">${balErr ? `<p class="tt-err small">⚠️ ${esc(balErr)}</p>` : bal}</div>
      <p class="muted small" style="margin:8px 0 0">Use + between things and -> for the arrow. Write formulas with capital letters: Co is cobalt, CO is carbon monoxide.</p></div></div>
    <div class="panel" style="margin-top:12px"><h3 style="margin-top:0">🧪 The pH scale</h3>
      <div class="ph-bar">${PH.map(([v]) => `<div style="background:${['#d7191c', '#e8432a', '#f46d43', '#f99652', '#fdae61', '#fdd28a', '#e6f598', '#abdda4', '#88cfa4', '#66c2a5', '#4ba9b5', '#3288bd', '#4a6fb7', '#5e4fa2', '#4a2a7a'][v]}"><b>${v}</b></div>`).join('')}</div>
      <div class="ph-labels"><span>⬅ Acid</span><span>Neutral</span><span>Base (alkaline) ➡</span></div>
      <div class="ph-list">${PH.map(([v, t]) => `<div><b>${v}</b> ${esc(t)}</div>`).join('')}</div>
      <p class="muted small" style="margin:6px 0 0">Each step is 10 times stronger: pH 3 is 10× more acidic than pH 4. Values are typical; real ones vary.</p></div>`;
}
/* ---------- 🌍 geology: the geologic time scale, Earth's layers, plate boundaries, earthquakes ---------- */
const GEO_TIME = [   // [name, level, starts (million years ago), ends, color, what happened]
  ['Hadean', 'eon', 4567, 4000, '#ae027e', 'Earth forms; the Moon forms; a molten surface slowly cools.'],
  ['Archean', 'eon', 4000, 2500, '#f0047f', 'Oldest rocks and the first simple life (bacteria).'],
  ['Proterozoic', 'eon', 2500, 539, '#f73563', 'Oxygen builds up in the air; the first cells with a nucleus; the first many-celled life.'],
  ['Cambrian', 'period', 539, 485, '#7fa056', 'The “Cambrian explosion”: most animal groups appear, in the sea.'],
  ['Ordovician', 'period', 485, 444, '#009270', 'Fish without jaws; the first land plants. Ends with a mass extinction.'],
  ['Silurian', 'period', 444, 419, '#b3e1b6', 'Fish with jaws; plants and small animals spread onto land.'],
  ['Devonian', 'period', 419, 359, '#cb8c37', 'The “Age of Fish”; the first forests and four-legged animals.'],
  ['Carboniferous', 'period', 359, 299, '#67a599', 'Huge swamp forests (today’s coal); the first reptiles; giant insects.'],
  ['Permian', 'period', 299, 252, '#f04028', 'The supercontinent Pangaea. Ends with the biggest mass extinction ever.'],
  ['Triassic', 'period', 252, 201, '#812b92', 'The first dinosaurs and mammals.'],
  ['Jurassic', 'period', 201, 145, '#34b2c9', 'Giant dinosaurs; the first birds; Pangaea breaks apart.'],
  ['Cretaceous', 'period', 145, 66, '#7fc64e', 'Flowering plants; T. rex. Ends with the asteroid that wiped out most dinosaurs.'],
  ['Paleogene', 'period', 66, 23, '#fd9a52', 'Mammals spread and grow bigger; early primates and whales.'],
  ['Neogene', 'period', 23, 2.6, '#ffe619', 'Grasslands spread; early human ancestors.'],
  ['Quaternary', 'period', 2.6, 0, '#f9f97f', 'Ice ages; modern humans (Homo sapiens) appear.'],
];
const GEO_ERAS = [['Paleozoic era', 539, 252], ['Mesozoic era', 252, 66], ['Cenozoic era', 66, 0]];
const GEO_LAYERS = [['Crust', '5–70 km thick', 'Solid rock. Thin under oceans, thicker under continents.', '#a0785a'], ['Mantle', 'to about 2,900 km', 'Hot rock that flows very slowly, moving the plates above it.', '#e86a33'],
  ['Outer core', '2,900–5,150 km', 'Liquid iron and nickel. Its swirling makes Earth’s magnetic field.', '#f5a623'], ['Inner core', '5,150–6,371 km', 'Solid iron and nickel, about as hot as the Sun’s surface.', '#ffd84d']];
const GEO_PLATES = [['↔️ Divergent', 'Plates pull apart. Magma rises and makes new crust.', 'Mid-Atlantic Ridge; East African Rift'], ['➡️⬅️ Convergent', 'Plates push together: one dives under the other, or both crumple up into mountains.', 'Andes; Himalayas; Japan’s volcanoes'], ['⇅ Transform', 'Plates slide past each other sideways, causing earthquakes.', 'San Andreas Fault (California)']];
const GEO_QUAKES = [['Under 3', 'Usually not felt'], ['3–3.9', 'Felt by some; like a truck passing'], ['4–4.9', 'Felt by most; things rattle'], ['5–5.9', 'Damage to weak buildings'], ['6–6.9', 'Strong; damage over a wide area'], ['7–7.9', 'Major; serious damage'], ['8 and up', 'Great; can destroy whole areas']];
function geoHtml() {
  const span = 4567, pct = v => (v / span * 100);
  return `<div class="panel"><h3 style="margin-top:0">🕰️ The geologic time scale</h3>
      <p class="muted small" style="margin:0 0 8px">Earth is about 4.6 billion years old. Ma = millions of years ago (rounded).</p>
      <div class="geo-bar" title="All of Earth’s history to scale">${GEO_TIME.filter(t => t[1] === 'eon').map(t => `<div style="width:${pct(t[2] - t[3])}%;background:${t[4]}">${t[0]}</div>`).join('')}<div style="width:${pct(539)}%;background:#9ad9dd" title="Phanerozoic: the last 539 million years">Phan.</div></div>
      <p class="muted small" style="margin:4px 0 10px">To scale: everything with animals you can see (the Phanerozoic) fits in that thin last strip.</p>
      <div class="geo-eras">${GEO_ERAS.map(([n, a, z]) => `<div><b>${n}</b> <span class="muted small">${a}–${z} Ma</span></div>`).join('')}</div>
      <div class="geo-list">${GEO_TIME.map(([n, lvl, a, z, c, w]) => `<div class="geo-row ${lvl}"><i style="background:${c}"></i><b>${n}</b><span class="geo-ma">${a.toLocaleString()}–${z} Ma</span><span class="small">${esc(w)}</span></div>`).join('')}</div>
      <div class="row" style="gap:6px;margin-top:8px"><button type="button" class="btn sm" data-sci="geoCards">📇 Make flashcards</button><button type="button" class="btn sm" data-sci="geoTimeline">🕰️ Make it a timeline</button></div></div>
    <div class="art-two" style="margin-top:12px"><div class="panel"><h3 style="margin-top:0">🌍 Earth’s layers</h3>
      <svg viewBox="0 0 200 200" class="geo-earth" aria-hidden="true">${GEO_LAYERS.map((l, i) => `<circle cx="100" cy="100" r="${[96, 90, 54, 24][i]}" fill="${l[3]}"/>`).join('')}<path d="M100 100 L100 2 A98 98 0 0 1 198 100 Z" fill="var(--surface)" opacity=".0"/></svg>
      ${GEO_LAYERS.map(([n, d, t, c]) => `<div class="geo-layer"><i style="background:${c}"></i><div><b>${n}</b> <span class="muted small">${d}</span><div class="small">${esc(t)}</div></div></div>`).join('')}</div>
    <div class="panel"><h3 style="margin-top:0">🧩 Plate boundaries</h3>${GEO_PLATES.map(([n, d, ex]) => `<div class="geo-layer"><div><b>${n}</b><div class="small">${esc(d)}</div><div class="muted small">Example: ${esc(ex)}</div></div></div>`).join('')}
      <h3 style="margin:14px 0 6px">📈 Earthquake size (magnitude)</h3><table class="sci-table" style="min-width:0"><tbody>${GEO_QUAKES.map(([m, e]) => `<tr><td><b>${m}</b></td><td class="small">${esc(e)}</td></tr>`).join('')}</tbody></table>
      <p class="muted small" style="margin:6px 0 0">Each step up is about 32 times more energy.</p></div></div>`;
}

/* ---------- the Science lab page ---------- */
function sci() { const s = (S.settings.sci ||= {}); s.tab ||= 'pt'; s.el ??= 1; return s; }
const SCI_TABS = [['pt', '🧪 Periodic table'], ['chem', '⚗️ Chemistry'], ['rocks', '🪨 Rocks & minerals'], ['geo', '🌍 Geology'], ['space', '🔭 Space']];
views.science = () => {
  const s = sci();
  return `<div class="row-between" style="margin-bottom:12px"><h2 style="margin:0">🔬 Science lab</h2>
      <div class="row" style="gap:6px;flex-wrap:wrap">${SCI_TABS.map(([k, l]) => `<button type="button" class="btn sm ${s.tab === k ? 'primary' : ''}" data-sci="tab" data-k="${k}">${l}</button>`).join('')}</div></div>
    <div class="sci-panel">${s.tab === 'pt' ? `<div class="panel">${view.ptQuiz ? ptQuizHtml() : ptHtml()}</div>` : s.tab === 'rocks' ? rocksHtml() : s.tab === 'chem' ? chemHtml() : s.tab === 'geo' ? geoHtml() : spaceHtml()}</div>`;
};
function sciMakeDeck(name, rows) {
  let d = S.decks.find(x => x.name === name);
  if (!d) { d = { id: uid(), created: Date.now(), name, frontLang: 'en-US', backLang: 'en-US', newPerDay: 20, direction: 'front', subject: 'science' }; S.decks.push(d); }
  const have = new Set(cardsOf(d.id).map(c => c.front)); let n = 0;
  for (const [f, b, note] of rows) if (!have.has(f)) { S.cards.push({ id: uid(), deckId: d.id, front: f, back: b, notes: note || '', example: '', exampleTr: '', state: 'new', due: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0, step: 0, created: Date.now() }); n++; }
  save(); toast(n ? `📇 ${n} card${n === 1 ? '' : 's'} added to “${name}”` : 'Those cards are already in the deck'); go({ name: 'deck', deckId: d.id });
}
Object.assign(actions, { science: el => { if (el?.dataset?.t) sci().tab = el.dataset.t; go({ name: 'science' }); } });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-sci]'); if (!b || view.name !== 'science') return;
  const s = sci();
  switch (b.dataset.sci) {
    case 'tab': s.tab = b.dataset.k; view.ptQuiz = false; break;
    case 'el': s.el = +b.dataset.n; { document.querySelectorAll('.pt-el.on').forEach(x => x.classList.remove('on')); b.classList.add('on'); document.querySelectorAll('.pt-info, .pt-info-m').forEach(box => box.innerHTML = ptInfoHtml(PT[s.el - 1])); } save(); return;
    case 'cat': s.cat = s.cat === b.dataset.k ? '' : b.dataset.k; break;
    case 'ptQuiz': view.ptQuiz = true; ptQuizNew(); break;
    case 'ptBack': view.ptQuiz = false; break;
    case 'ptNext': ptQuizNew(); break;
    case 'ptPick': { if (!ptQ || ptQ.given) return; ptQ.given = b.dataset.v; s.ptTotal = (s.ptTotal || 0) + 1;
      if (ptQ.given === ptQ.answer) { s.ptRight = (s.ptRight || 0) + 1; if (typeof rightSound === 'function') rightSound(); if (typeof addPoints === 'function') addPoints(1); } else if (typeof sdSound === 'function') sdSound('wrong'); break; }
    case 'ptCards': return sciMakeDeck('Periodic table', PT.map(x => [`${x.sym}`, `${x.name} (number ${x.n})`, `${PT_CATS[x.cat][0]}, atomic mass ${x.mass}`]));
    case 'minCards': return sciMakeDeck('Minerals', MINERALS.map(m => [m[0], `Hardness ${m[2][0] === m[2][1] ? m[2][0] : m[2].join('–')} · ${m[3]} luster · ${m[4]} streak`, `${m[1]}. ${m[5]}`]));
    case 'minClear': s.minF = {}; break;
    case 'planet': s.planet = b.dataset.k; break;
    case 'chemEx': s.chemEq = b.dataset.k; break;
    case 'geoCards': return sciMakeDeck('Geologic time', GEO_TIME.map(([n, lvl, a, z, , w]) => [n, `${lvl === 'eon' ? 'Eon' : 'Period'}, ${a.toLocaleString()}–${z} million years ago`, w]));
    case 'geoTimeline': { if (typeof tlAll !== 'function') return; const t = { id: uid(), name: 'Geologic time', desc: 'From Earth’s beginning to today (years are approximate)', subject: 'science', created: Date.now(), style: 'list',
        events: GEO_TIME.map(([n, , a, , , w]) => ({ id: uid(), y: -Math.round(a * 1e6), m: 0, d: 0, approx: true, title: n, note: w })) };
      tlAll().push(t); save(); toast('🕰️ Timeline made'); return go({ name: 'timeline', tl: t.id }); }
    default: return;
  }
  save(); render();
});
document.addEventListener('input', e => {
  if (view.name !== 'science') return;
  if (e.target.id === 'ptQ') { sci().ptq = e.target.value; const q = norm(e.target.value), hi = sci().cat;
    document.querySelectorAll('.pt-el').forEach(el => { const x = PT[+el.dataset.n - 1]; el.classList.toggle('dim', !((!q || norm(`${x.sym} ${x.name} ${x.n}`).includes(q)) && (!hi || x.cat === hi))); });
    const hit = q && PT.filter(x => norm(`${x.sym} ${x.name} ${x.n}`).includes(q)); if (hit && hit.length === 1) { sci().el = hit[0].n; document.querySelectorAll('.pt-info, .pt-info-m').forEach(box => box.innerHTML = ptInfoHtml(hit[0])); }
    return; }
  if (e.target.dataset.scif === 'weight') { sci().weight = e.target.value; const w = +e.target.value || 0;
    document.querySelectorAll('.wt-row b').forEach((el, i) => { const g = i < PLANETS.length ? PLANETS[i][7] : MOON_G; el.textContent = w ? (w * g / 9.81).toFixed(1) : '–'; }); save(); }
});
document.addEventListener('input', e => {   // chemistry boxes redraw as you type
  const k = e.target.dataset?.chem; if (!k || view.name !== 'science') return; const s = sci();
  s[k] = e.target.value; if (k === 'chemG') s.chemMol = ''; if (k === 'chemMol') s.chemG = ''; save();
  clearTimeout(chemHtml.t); chemHtml.t = setTimeout(() => { const pos = e.target.selectionStart, keep = k; const p = document.querySelector('.sci-panel'); if (!p) return; p.innerHTML = chemHtml(); const el = document.querySelector(`[data-chem="${keep}"]`); el?.focus(); try { el.setSelectionRange(pos, pos); } catch {} }, 250);
});
document.addEventListener('change', e => {
  const k = e.target.dataset?.scif; if (!k || view.name !== 'science' || k === 'weight') return;
  const s = sci(); if (k === 'moonDate') s.moonDate = e.target.value; else s.minF = { ...(s.minF || {}), [k]: e.target.value };
  save(); render();
});
