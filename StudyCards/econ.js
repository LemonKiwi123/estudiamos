'use strict';
/* ================= 💰 Economics (a tab of the Social Studies page, geo.js) =================
   Supply and demand you can shift, an inflation calculator, compound interest, a 50/30/20 budget and key words.
   These are learning tools that show how the math works, not money advice. */
const ECON_SECS = [['sd', '📈 Supply & demand'], ['infl', '🎈 Inflation'], ['ci', '🌱 Compound interest'], ['budget', '🧾 Budget'], ['words', '📚 Key words']];
const ECON_SHIFTS = [['d', 1, '🔥 It becomes popular'], ['d', 1, '💵 People earn more'], ['d', -1, '🔻 A cheaper substitute appears'], ['d', -1, '📉 Fewer buyers'],
  ['s', 1, '🤖 New technology makes it cheaper to make'], ['s', 1, '🏭 More sellers join'], ['s', -1, '🧱 Materials cost more'], ['s', -1, '🌪️ A storm hurts production']];
const ECON_CPI = [[1920, 20.0], [1930, 16.7], [1940, 14.0], [1950, 24.1], [1960, 29.6], [1970, 38.8], [1980, 82.4], [1990, 130.7], [2000, 172.2], [2010, 218.1], [2020, 258.8], [2024, 313.7]];   // US consumer price index (CPI-U yearly average, 1982–84 = 100), rounded
const ECON_WORDS = [['Scarcity', 'There isn’t enough of something for everyone who wants it, so people must choose.'], ['Opportunity cost', 'The next-best thing you give up when you make a choice.'],
  ['Supply', 'How much of something sellers are willing to sell at each price.'], ['Demand', 'How much of something buyers want and can afford at each price.'], ['Equilibrium', 'The price where the amount people want to buy equals the amount sellers offer.'],
  ['Shortage', 'When people want more than sellers offer, usually because the price is too low.'], ['Surplus', 'When sellers offer more than people want, usually because the price is too high.'],
  ['Inflation', 'Prices in general rising over time, so the same money buys less.'], ['Deflation', 'Prices in general falling over time.'], ['Interest', 'The cost of borrowing money, or what you earn for saving it.'],
  ['Compound interest', 'Interest earned on your savings and on the interest already added.'], ['GDP', 'Gross domestic product: the value of all goods and services a country makes in a year.'],
  ['Recession', 'A time when the economy shrinks and more people lose jobs, usually for months.'], ['Tax', 'Money people and businesses pay the government to fund public services.'],
  ['Budget', 'A plan for how to spend and save money.'], ['Goods and services', 'Goods are things you can touch (a bike); services are work done for you (a haircut).'],
  ['Producer and consumer', 'A producer makes goods or services; a consumer buys and uses them.'], ['Market economy', 'Buyers and sellers mostly decide what is made and the prices.'],
  ['Command economy', 'The government mostly decides what is made and the prices.'], ['Mixed economy', 'A market economy with some government rules and services (like most countries today).'],
  ['Entrepreneur', 'Someone who starts a business and takes the risk.'], ['Trade', 'Exchanging goods or services, between people or countries.'], ['Tariff', 'A tax on goods brought in from another country.'], ['Monopoly', 'When a single company is the only seller of something.']];
function econ() { const w = world(); w.econ ||= { sec: 'sd', d: 0, s: 0, ctl: false, price: 5, amt: 100, rate: 3, yrs: 10, from: 1990, to: 2024, imode: 'rate', p: 1000, add: 50, r: 5, n: 20, comp: 12, income: 2000 }; return w.econ; }
const econMoney = v => (Math.round(v * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const econNum = (k, label, v, extra = '') => `<label class="field">${label}<input class="inp" inputmode="decimal" data-ec="${k}" value="${esc(String(v))}" ${extra}></label>`;
/* ---------- 📈 supply and demand ---------- */
function econSD() {
  const e = econ(), dA = 90 + e.d * 15, sA = 10 + e.s * 15, P = (dA - sA) / 16, Q = dA - 8 * P;   // demand Q = dA − 8P, supply Q = sA + 8P
  const W = 420, H = 300, L = 46, B = 34, x = q => L + q / 100 * (W - L - 14), y = p => H - B - p / 10 * (H - B - 14);
  const line = (q0, p0, q1, p1, cls) => `<line x1="${x(q0)}" y1="${y(p0)}" x2="${x(q1)}" y2="${y(p1)}" class="${cls}"/>`;
  const dLine = [[dA, 0], [Math.max(0, dA - 80), Math.min(10, dA / 8)]], sLine = [[Math.max(0, sA), Math.max(0, -sA / 8)], [Math.min(100, sA + 80), Math.min(10, (100 - sA) / 8)]];
  let ctl = ''; const pc = e.price;
  if (e.ctl) { const qd = Math.max(0, dA - 8 * pc), qs = Math.max(0, sA + 8 * pc), gap = qd - qs;
    ctl = `<line x1="${x(0)}" y1="${y(pc)}" x2="${x(100)}" y2="${y(pc)}" class="sd-ctl"/>${Math.abs(gap) > 0.5 ? `<line x1="${x(Math.min(qd, qs))}" y1="${y(pc)}" x2="${x(Math.max(qd, qs))}" y2="${y(pc)}" class="sd-gap ${gap > 0 ? 'short' : 'sur'}"/>` : ''}`;
    ctl += `<text x="${x(100) - 4}" y="${y(pc) - 6}" class="sd-lab" text-anchor="end">price set at $${pc.toFixed(2)}</text>`; e._gap = [qd, qs]; }
  const ok = P > 0 && P < 10 && Q > 0;
  const svg = `<svg viewBox="0 0 ${W} ${H}" class="sd-svg" role="img" aria-label="Supply and demand graph">
    <line x1="${L}" y1="${y(0)}" x2="${x(100)}" y2="${y(0)}" class="sd-ax"/><line x1="${L}" y1="${y(0)}" x2="${L}" y2="${y(10)}" class="sd-ax"/>
    ${[0, 2, 4, 6, 8, 10].map(p => `<text x="${L - 6}" y="${y(p) + 4}" class="sd-tick" text-anchor="end">$${p}</text>`).join('')}${[0, 25, 50, 75, 100].map(q => `<text x="${x(q)}" y="${y(0) + 16}" class="sd-tick" text-anchor="middle">${q}</text>`).join('')}
    <text x="${x(50)}" y="${H - 2}" class="sd-lab" text-anchor="middle">Quantity</text><text x="12" y="${y(5)}" class="sd-lab" transform="rotate(-90 12 ${y(5)})" text-anchor="middle">Price</text>
    ${e.d ? line(90, 0, 10, 10, 'sd-old') : ''}${e.s ? line(10, 0, 90, 10, 'sd-old') : ''}
    ${line(dLine[0][0], dLine[0][1], dLine[1][0], dLine[1][1], 'sd-d')}${line(sLine[0][0], sLine[0][1], sLine[1][0], sLine[1][1], 'sd-s')}${ctl}
    ${ok ? `<line x1="${L}" y1="${y(P)}" x2="${x(Q)}" y2="${y(P)}" class="sd-dash"/><line x1="${x(Q)}" y1="${y(P)}" x2="${x(Q)}" y2="${y(0)}" class="sd-dash"/><circle cx="${x(Q)}" cy="${y(P)}" r="6" class="sd-eq"/>` : ''}
    <text x="${x(dLine[1][0]) + 6}" y="${y(dLine[1][1]) + 14}" class="sd-dl">Demand</text><text x="${x(sLine[1][0]) - 6}" y="${y(sLine[1][1]) + 14}" class="sd-sl" text-anchor="end">Supply</text></svg>`;
  const shift = (k, v) => (k === 'd' ? e.d : e.s) + v;
  const gapTxt = e.ctl ? (() => { const [qd, qs] = e._gap, g = Math.round(qd - qs); return g > 0 ? `<b class="sd-short">Shortage of ${g}</b>: at $${pc.toFixed(2)} buyers want ${Math.round(qd)} but sellers offer only ${Math.round(qs)}. Lines form and shelves empty.` : g < 0 ? `<b class="sd-sur">Surplus of ${-g}</b>: at $${pc.toFixed(2)} sellers offer ${Math.round(qs)} but buyers want only ${Math.round(qd)}. Stores have to cut prices.` : 'At this price the market clears: no shortage or surplus.'; })() : '';
  return `<div class="sd-grid"><div class="geo-wrap" style="background:var(--surface)">${svg}</div>
    <div><div class="sd-out">${ok ? `<div><span class="muted small">Price</span><b>$${P.toFixed(2)}</b></div><div><span class="muted small">Quantity sold</span><b>${Math.round(Q)}</b></div>` : '<div class="muted">The lines don’t cross here. Reset to try again.</div>'}</div>
      <div class="sm-cap">What happens if…</div><div class="sd-shifts">${ECON_SHIFTS.map(([k, v, l]) => `<button type="button" class="btn sm" data-ec="shift" data-k="${k}" data-v="${v}" ${Math.abs(shift(k, v)) > 2 ? 'disabled' : ''}>${l}</button>`).join('')}</div>
      <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><button type="button" class="btn sm ghost" data-ec="sdReset">↺ Reset</button>
        <label class="check"><input type="checkbox" data-ec="ctl" ${e.ctl ? 'checked' : ''}><span>Let the government set the price</span></label></div>
      ${e.ctl ? `<label class="sk-ctl" style="margin-top:6px">Price <input type="range" min="0.5" max="9.5" step="0.25" value="${pc}" data-ec="price"></label><p class="small">${gapTxt}</p>` : ''}
      <p class="small">${e.d > 0 ? '📈 <b>Demand went up</b> (the blue line moved right): the price and the amount sold both rise. ' : e.d < 0 ? '📉 <b>Demand went down</b> (the blue line moved left): the price and the amount sold both fall. ' : ''}${e.s > 0 ? '📦 <b>Supply went up</b> (the orange line moved right): the price falls and more is sold. ' : e.s < 0 ? '🧱 <b>Supply went down</b> (the orange line moved left): the price rises and less is sold. ' : ''}${!e.d && !e.s ? 'The dot is the <b>equilibrium</b>: the price where the amount buyers want equals the amount sellers offer. Try a button to shift a line.' : ''}</p></div></div>
    <p class="muted small">The <b>law of demand</b>: when the price goes up, people buy less. The <b>law of supply</b>: when the price goes up, sellers offer more. The faded lines show where things started.</p>`;
}
/* ---------- 🎈 inflation ---------- */
function econInfl() {
  const e = econ(), amt = Math.max(0, parseFloat(e.amt) || 0);
  let res;
  if (e.imode === 'rate') { const r = (parseFloat(e.rate) || 0) / 100, n = Math.max(0, parseFloat(e.yrs) || 0), f = Math.pow(1 + r, n);
    res = `<div class="tip-row total"><span>Costs then</span><b>$${econMoney(amt * f)}</b></div><div class="tip-row"><span>What $${econMoney(amt)} will buy then, in today’s money</span><b>$${econMoney(amt / f)}</b></div>
      <p class="small">At ${(r * 100).toFixed(1)}% a year, prices ${r > 0 ? `double in about <b>${(72 / (r * 100)).toFixed(0)} years</b> (the rule of 72: 72 ÷ the rate)` : 'stay the same'}.</p>`; }
  else { const cpi = yv => ECON_CPI.find(c => c[0] === +yv)?.[1] || 0, a = cpi(e.from), b = cpi(e.to), v = a ? amt * b / a : 0;
    res = `<div class="tip-row total"><span>$${econMoney(amt)} in ${e.from} is about</span><b>$${econMoney(v)}</b></div><div class="muted small">in ${e.to} money. Prices changed about ${a ? Math.round((b / a - 1) * 100) : 0}% in between.</div>`; }
  return `<div class="seg-btns" style="margin-bottom:10px">${[['rate', 'Future prices'], ['hist', 'Prices in the past (US)']].map(([k, l]) => `<button type="button" class="btn sm ${e.imode === k ? 'primary' : ''}" data-ec="imode" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="tip"><div class="tip-in">${econNum('amt', 'Amount ($)', e.amt)}
      ${e.imode === 'rate' ? `${econNum('rate', 'Inflation rate (% a year)', e.rate)}${econNum('yrs', 'Years from now', e.yrs)}`
        : `<div class="row" style="gap:8px">${['from', 'to'].map(k => `<label class="field" style="flex:1">${k === 'from' ? 'From year' : 'To year'}<select class="inp" data-ec="${k}">${ECON_CPI.map(([yv]) => `<option ${+e[k] === yv ? 'selected' : ''}>${yv}</option>`).join('')}</select></label>`).join('')}</div>`}</div>
      <div class="tip-out" id="ecOut">${res}</div></div>
    <div class="sm-cap" style="margin-top:12px">US prices over time (consumer price index)</div>
    <div class="infl-bars">${ECON_CPI.map(([yv, v]) => `<div class="infl-bar"><i style="height:${v / 3.2}%"></i><span>${yv}</span></div>`).join('')}</div>
    <p class="muted small">Inflation means each dollar buys a little less every year. Past prices use rounded US consumer price index averages from the Bureau of Labor Statistics, so the answers are close, not exact.</p>`;
}
/* ---------- 🌱 compound interest ---------- */
function econCI() {
  const e = econ(), P = Math.max(0, parseFloat(e.p) || 0), add = Math.max(0, parseFloat(e.add) || 0), r = Math.max(0, parseFloat(e.r) || 0) / 100, N = Math.min(60, Math.max(1, Math.round(parseFloat(e.n) || 1))), m = +e.comp || 12;
  const rows = []; let bal = P, paid = P;
  for (let yr = 1; yr <= N; yr++) { for (let k = 0; k < 12; k++) { if (m === 12) bal *= 1 + r / 12; bal += add; paid += add; } if (m === 1) bal *= 1 + r; rows.push([yr, paid, bal]); }   // monthly deposits; interest monthly or once a year
  const simple = P * (1 + r * N) + add * 12 * N, last = rows[N - 1], max = last[2] || 1, Wd = 100 / N;
  return `<div class="tip"><div class="tip-in">${econNum('p', 'Starting amount ($)', e.p)}${econNum('add', 'Added every month ($)', e.add)}${econNum('r', 'Interest rate (% a year)', e.r)}${econNum('n', 'Years', e.n)}
      <div class="seg-btns">${[[12, 'Monthly'], [1, 'Yearly']].map(([k, l]) => `<button type="button" class="btn sm ${m === k ? 'primary' : ''}" data-ec="comp" data-k="${k}">${l} interest</button>`).join('')}</div></div>
    <div class="tip-out"><div class="tip-row total"><span>After ${N} year${N > 1 ? 's' : ''}</span><b>$${econMoney(last[2])}</b></div>
      <div class="tip-row"><span>Money you put in</span><b>$${econMoney(last[1])}</b></div><div class="tip-row"><span>Interest earned</span><b class="ci-int">$${econMoney(last[2] - last[1])}</b></div>
      <div class="tip-row sm"><span></span><span>With simple interest instead</span><b>$${econMoney(simple)}</b></div></div></div>
    <div class="ci-chart" role="img" aria-label="Savings each year">${rows.map(([yr, pd, b]) => `<div class="ci-col" style="width:${Wd}%" title="Year ${yr}: $${econMoney(b)}"><i class="int" style="height:${(b - pd) / max * 100}%"></i><i class="in" style="height:${pd / max * 100}%"></i></div>`).join('')}</div>
    <div class="row-between muted small"><span>Year 1</span><span><i class="ci-key in"></i>Put in <i class="ci-key int"></i>Interest</span><span>Year ${N}</span></div>
    <p class="muted small"><b>Compound interest</b> earns interest on the interest too, so the green part grows faster each year. Starting early matters more than starting big. This is a math model; real savings accounts and investments go up and down.</p>`;
}
/* ---------- 🧾 50/30/20 budget ---------- */
function econBudget() {
  const e = econ(), inc = Math.max(0, parseFloat(e.income) || 0), part = [[50, 'Needs', 'Rent or housing, food, bills, transport', '#3b7dd8'], [30, 'Wants', 'Fun, eating out, hobbies, subscriptions', '#e3893a'], [20, 'Savings', 'Emergency fund, goals, paying off debt', '#2e9d5b']];
  return `<div class="tip"><div class="tip-in">${econNum('income', 'Money coming in each month, after taxes ($)', e.income)}
      <p class="small">The <b>50/30/20 rule</b> is one simple way to plan: half for needs, about a third for wants, and a fifth for saving.</p></div>
    <div class="tip-out"><div class="bud-bar">${part.map(([p, , , c]) => `<i style="width:${p}%;background:${c}"></i>`).join('')}</div>
      ${part.map(([p, n, d, c]) => `<div class="tip-row"><span><i class="ci-key" style="background:${c}"></i><b>${n}</b> ${p}%<div class="muted small">${d}</div></span><b>$${econMoney(inc * p / 100)}</b></div>`).join('')}</div></div>
    <p class="muted small">A <b>need</b> is something you must have to live and work; a <b>want</b> is nice to have. Making a budget is about choices, which is <b>opportunity cost</b> in action.</p>`;
}
function econWords() {
  return `<div class="civ-bor">${ECON_WORDS.map(([w, d]) => `<div class="civ-amd" style="grid-template-columns:150px 1fr"><b>${w}</b><span class="small">${d}</span></div>`).join('')}</div>
    <button type="button" class="btn" data-ec="cards" style="margin-top:10px">📇 Make flashcards</button>`;
}
function econHtml() {
  const e = econ(), F = { sd: econSD, infl: econInfl, ci: econCI, budget: econBudget, words: econWords };
  return `<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:12px">${ECON_SECS.map(([k, l]) => `<button type="button" class="btn sm ${e.sec === k ? 'primary' : ''}" data-ec="sec" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="econ-body">${(F[e.sec] || econSD)()}</div>`;
}
function econRedraw(keep) {
  const b = document.querySelector('.econ-body'); if (!b) return worldRedraw(); const f = keep && document.activeElement?.dataset?.ec, pos = f ? document.activeElement.selectionStart : 0;
  b.innerHTML = ({ sd: econSD, infl: econInfl, ci: econCI, budget: econBudget, words: econWords })[econ().sec]();
  if (f) { const el = b.querySelector(`input[data-ec="${f}"]`); el?.focus(); try { el.setSelectionRange(pos, pos); } catch {} }
}
document.addEventListener('click', e => {
  const b = e.target.closest('button[data-ec]'); if (!b || view.name !== 'world') return; const s = econ(), k = b.dataset.k;
  switch (b.dataset.ec) {
    case 'sec': s.sec = k; worldSave(); return worldRedraw();
    case 'shift': s[k] = Math.max(-2, Math.min(2, s[k] + +b.dataset.v)); break;
    case 'sdReset': s.d = 0; s.s = 0; s.ctl = false; break;
    case 'imode': s.imode = k; break;
    case 'comp': s.comp = +k; break;
    case 'cards': { const [d, n] = worldMakeDeck('Economics words', ECON_WORDS); toast(n ? `📇 Added ${n} cards to “${d.name}”` : `“${d.name}” already has these cards`); return; }
    default: return;
  }
  worldSave(); econRedraw();
});
document.addEventListener('input', e => { const k = e.target.dataset?.ec; if (!k || view.name !== 'world' || e.target.tagName === 'BUTTON' || e.target.type === 'checkbox' || e.target.tagName === 'SELECT') return; const s = econ();
  if (k === 'price') { s.price = +e.target.value; worldSave(); return econRedraw(); }
  s[k] = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.'); worldSave(); econRedraw(true); });
document.addEventListener('change', e => { const k = e.target.dataset?.ec; if (!k || view.name !== 'world') return; const s = econ();
  if (e.target.type === 'checkbox') { s[k] = e.target.checked; if (k === 'ctl') s.price = 3; } else if (e.target.tagName === 'SELECT') s[k] = +e.target.value; else return; worldSave(); econRedraw(); });
