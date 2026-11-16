'use strict';
/* ================= 🏛️ Civics guide (a tab of the Social Studies page, geo.js) =================
   US government: the three branches, checks and balances, how a bill becomes law, the Constitution and its amendments,
   levels of government, elections, citizenship, forms of government around the world, and a quiz. */
const CIV_SECS = [['branches', '🏛️ Three branches'], ['bill', '📜 How a bill becomes law'], ['const', '📖 Constitution'], ['rights', '🗽 Bill of Rights & amendments'], ['levels', '🏙️ Levels of government'], ['elect', '🗳️ Elections & citizens'], ['forms', '🌐 Forms of government'], ['quiz', '🎯 Civics quiz']];
const CIV_BRANCH = [
  { k: 'leg', icon: '🏛️', name: 'Legislative', who: 'Congress', art: 'Article I', job: 'Makes the laws',
    parts: ['<b>Senate</b>: 100 senators, 2 from each state, 6-year terms', '<b>House of Representatives</b>: 435 voting members, based on each state’s population, 2-year terms'],
    powers: ['Writes and passes laws', 'Sets taxes and the budget, and borrows money', 'Declares war', 'Senate approves treaties, judges and Cabinet members', 'House can impeach; the Senate holds the trial'] },
  { k: 'exe', icon: '🦅', name: 'Executive', who: 'President, Vice President and Cabinet', art: 'Article II', job: 'Carries out the laws',
    parts: ['<b>President</b>: 4-year term, at most 2 terms; must be 35+, born a US citizen, 14 years living in the US', '<b>Vice President</b>: leads the Senate and breaks tie votes', '<b>Cabinet</b>: heads of the 15 executive departments advise the President'],
    powers: ['Signs or vetoes bills', 'Commander in chief of the military', 'Makes treaties with other countries', 'Chooses judges and officials (the Senate must approve)', 'Can pardon people for federal crimes'] },
  { k: 'jud', icon: '⚖️', name: 'Judicial', who: 'Supreme Court and federal courts', art: 'Article III', job: 'Explains the laws',
    parts: ['<b>Supreme Court</b>: 9 justices (1 Chief Justice + 8 associate justices), serving for life', '<b>Lower federal courts</b>: district courts and courts of appeals'],
    powers: ['Decides what laws mean in real cases', 'Can strike down laws that go against the Constitution (<b>judicial review</b>, from Marbury v. Madison, 1803)', 'Settles disputes between states'] }];
const CIV_CHECKS = [['exe', 'leg', 'The President can <b>veto</b> a bill Congress passed.'], ['leg', 'exe', 'Congress can <b>override a veto</b> with a 2/3 vote of both houses.'], ['leg', 'exe', 'Congress can <b>impeach</b> and remove a President.'],
  ['leg', 'exe', 'The Senate must <b>approve</b> treaties (2/3 vote) and Cabinet members.'], ['leg', 'exe', 'Congress controls the <b>money</b> the executive branch can spend.'], ['exe', 'jud', 'The President <b>nominates</b> Supreme Court justices and federal judges.'],
  ['leg', 'jud', 'The Senate <b>confirms</b> judges, and Congress can impeach them.'], ['jud', 'leg', 'Courts can rule a law <b>unconstitutional</b>.'], ['jud', 'exe', 'Courts can rule a President’s action <b>unconstitutional</b>.']];
const CIV_BILL = [['💡', 'An idea', 'Anyone can suggest a law, but only a member of Congress can <b>introduce</b> a bill. Bills about taxes must start in the House.'],
  ['📂', 'Committee', 'The bill goes to a small group that studies it, holds hearings, changes it and votes. Most bills stop here.'],
  ['🗣️', 'Debate and vote', 'The whole chamber debates it and votes. A simple majority passes it. In the Senate, ending a long debate (a <b>filibuster</b>) takes 60 votes.'],
  ['🔁', 'The other chamber', 'The bill goes to the other house (House → Senate or Senate → House) and repeats the committee and vote steps.'],
  ['🤝', 'Agree on one version', 'Both houses must pass the exact same words. A <b>conference committee</b> can work out the differences.'],
  ['✍️', 'The President', '<b>Signs</b> it → it becomes law. <b>Vetoes</b> it → it goes back to Congress. Does nothing for 10 days (not counting Sundays) while Congress meets → it becomes law anyway. If Congress has adjourned → a <b>pocket veto</b>, and the bill dies.'],
  ['💪', 'Veto override', 'Congress can still make it law if <b>2/3 of the House and 2/3 of the Senate</b> vote for it again.']];
const CIV_ARTS = [['Preamble', 'The opening: “We the People…” lists the goals: a more perfect union, justice, peace at home, defense, the general welfare and liberty.'],
  ['Article I', 'The legislative branch: Congress and its powers.'], ['Article II', 'The executive branch: the President.'], ['Article III', 'The judicial branch: the Supreme Court and other federal courts.'],
  ['Article IV', 'The states: how they treat each other, and how new states join.'], ['Article V', 'How to amend (change) the Constitution.'], ['Article VI', 'The Constitution is the “supreme law of the land”, above state laws.'], ['Article VII', 'Ratification: 9 of the 13 states had to approve it.']];
const CIV_DOCS = [[1776, 'Declaration of Independence', 'Signed July 4, 1776. Mostly written by Thomas Jefferson. Says people have rights to “life, liberty and the pursuit of happiness”.'],
  [1781, 'Articles of Confederation', 'The first plan of government. It made Congress too weak (no power to tax), so it was replaced.'],
  [1787, 'Constitutional Convention', 'Leaders met in Philadelphia and wrote the Constitution. James Madison is called the “Father of the Constitution”.'],
  [1788, 'Constitution ratified', 'Enough states approved it. The new government began in 1789 with George Washington as the first President.'],
  [1791, 'Bill of Rights', 'The first 10 amendments, added to protect people’s rights.']];
const CIV_BOR = [['1st', 'Freedom of religion, speech, the press, peaceful assembly, and to petition the government'], ['2nd', 'The right to keep and bear arms'], ['3rd', 'Soldiers can’t be housed in people’s homes in peacetime without permission'],
  ['4th', 'Protection from unreasonable searches and seizures; warrants need probable cause'], ['5th', 'Due process of law; no being tried twice for the same crime; you can’t be forced to testify against yourself'],
  ['6th', 'A speedy and public trial by jury, a lawyer, and the right to face witnesses'], ['7th', 'A jury trial in many civil (non-criminal) cases'], ['8th', 'No excessive bail or fines, and no cruel and unusual punishment'],
  ['9th', 'People have other rights, even ones not listed in the Constitution'], ['10th', 'Powers not given to the federal government belong to the states or the people']];
const CIV_AMD = [['13th', 1865, 'Ended slavery'], ['14th', 1868, 'Citizenship for everyone born in the US; equal protection of the laws'], ['15th', 1870, 'Voting can’t be denied because of race'], ['16th', 1913, 'Congress can collect an income tax'],
  ['17th', 1913, 'Voters elect their senators directly'], ['18th', 1919, 'Banned alcohol (Prohibition)'], ['19th', 1920, 'Women’s right to vote'], ['21st', 1933, 'Ended Prohibition'], ['22nd', 1951, 'A President can be elected at most twice'],
  ['24th', 1964, 'No poll taxes (paying to vote) in federal elections'], ['25th', 1967, 'What happens if a President dies, resigns or can’t do the job'], ['26th', 1971, 'Voting age lowered to 18']];
const CIV_LEVELS = [['🇺🇸', 'Federal', 'Washington, D.C.', 'President, Congress, federal courts', ['Prints money', 'The military and foreign affairs', 'The postal service', 'Immigration and citizenship', 'Trade between states and countries']],
  ['🏞️', 'State', 'Each state capital', 'Governor, state legislature, state courts', ['Driver’s licenses', 'Public schools', 'State highways and state police', 'Marriage and business licenses', 'Running elections']],
  ['🏘️', 'Local', 'Counties, cities and towns', 'Mayor or county leaders, city council, school board', ['Police and fire departments', 'Trash and recycling, water', 'Parks and libraries', 'Local roads and zoning', 'Running local schools']]];
const CIV_FORMS = [['🗳️', 'Direct democracy', 'Citizens vote on laws themselves. Ancient Athens, and today’s ballot questions.'], ['🏛️', 'Representative democracy (republic)', 'Citizens elect people to make laws for them. The US is a <b>constitutional federal republic</b>.'],
  ['👑', 'Absolute monarchy', 'A king or queen holds all the power, usually by birth.'], ['🎩', 'Constitutional monarchy', 'A monarch is head of state, but elected leaders run the government (for example the United Kingdom, Japan, Spain).'],
  ['🏢', 'Parliamentary system', 'Voters elect a parliament, and its majority picks the prime minister. The leader can be voted out by parliament.'], ['🦅', 'Presidential system', 'Voters elect the president separately from the legislature, for a fixed term.'],
  ['✊', 'Dictatorship', 'One person or small group rules with total power, often by force, without free elections.'], ['💼', 'Oligarchy', 'A small group (rich families, military officers or one party) holds the power.'],
  ['⛪', 'Theocracy', 'Religious leaders rule and religious law is the law of the land.'], ['🧩', 'Federal vs. unitary', 'Federal: power is shared between a national and state governments (US, Germany, Mexico). Unitary: the national government holds most power (France, Japan).']];
const CIV_QUIZ = [['How many senators are in the US Senate?', '100', ['50', '435', '538']], ['How long is a senator’s term?', '6 years', ['2 years', '4 years', 'For life']], ['How long is a representative’s term in the House?', '2 years', ['4 years', '6 years', '1 year']],
  ['How many voting members are in the House of Representatives?', '435', ['100', '50', '538']], ['How long is a President’s term?', '4 years', ['2 years', '6 years', '8 years']], ['How many justices are on the Supreme Court?', '9', ['7', '12', '15']],
  ['Which branch makes the laws?', 'Legislative', ['Executive', 'Judicial', 'The states']], ['Which branch carries out (enforces) the laws?', 'Executive', ['Legislative', 'Judicial', 'Congress']], ['Which branch explains the laws?', 'Judicial', ['Legislative', 'Executive', 'The Cabinet']],
  ['What can Congress do if the President vetoes a bill?', 'Override it with a 2/3 vote of both houses', ['Nothing, the bill is dead', 'Ask the Supreme Court to sign it', 'Pass it with a simple majority']],
  ['Who must approve treaties the President makes?', 'The Senate (2/3 vote)', ['The House', 'The Supreme Court', 'The governors']], ['What are the first 10 amendments called?', 'The Bill of Rights', ['The Preamble', 'The Articles of Confederation', 'The Declaration of Independence']],
  ['Which amendment protects freedom of speech?', '1st', ['2nd', '5th', '10th']], ['Which amendment gave women the right to vote?', '19th', ['13th', '15th', '26th']], ['Which amendment ended slavery?', '13th', ['14th', '15th', '19th']],
  ['Which amendment lowered the voting age to 18?', '26th', ['19th', '22nd', '24th']], ['When was the Declaration of Independence signed?', '1776', ['1787', '1791', '1789']], ['Where was the Constitution written?', 'Philadelphia', ['Washington, D.C.', 'Boston', 'New York City']],
  ['What is the supreme law of the land?', 'The Constitution', ['The Declaration of Independence', 'The Bill of Rights', 'State law']], ['What are the first three words of the Constitution?', 'We the People', ['In God We Trust', 'Four score and', 'When in the']],
  ['What does the Vice President do in the Senate?', 'Leads it and breaks tie votes', ['Writes the bills', 'Picks the senators', 'Nothing']], ['Who is commander in chief of the military?', 'The President', ['The Vice President', 'The Speaker of the House', 'The Chief Justice']],
  ['How many electoral votes does a candidate need to win the presidency?', '270', ['218', '300', '538']], ['How many electors are in the Electoral College?', '538', ['435', '270', '100']], ['Where does a tax bill have to start?', 'The House of Representatives', ['The Senate', 'The President', 'The Supreme Court']],
  ['Who can introduce a bill in Congress?', 'A member of Congress', ['Any citizen', 'The President', 'A Supreme Court justice']], ['What is a pocket veto?', 'The President doesn’t sign a bill and Congress has adjourned, so it dies', ['A veto Congress overrides', 'A veto written on a small card', 'When the Senate rejects a bill']],
  ['Which level of government issues driver’s licenses?', 'State', ['Federal', 'Local', 'All three']], ['Which level of government prints money?', 'Federal', ['State', 'Local', 'Banks']], ['What is judicial review?', 'Courts deciding if a law follows the Constitution', ['Congress reviewing judges', 'The President reviewing court cases', 'Voting on judges']],
  ['How many times can a person be elected President?', 'Twice', ['Once', 'Three times', 'No limit']], ['How old must you be to be President?', '35', ['25', '30', '40']], ['Who is called the “Father of the Constitution”?', 'James Madison', ['George Washington', 'Thomas Jefferson', 'Benjamin Franklin']],
  ['How many states must approve an amendment?', '3/4 of the states (38)', ['Half of the states', 'All 50 states', '2/3 of the states']], ['What were the Articles of Confederation?', 'The first US plan of government', ['The first 10 amendments', 'A treaty with Britain', 'A list of states']],
  ['In which kind of government does a monarch reign but elected leaders run the country?', 'Constitutional monarchy', ['Absolute monarchy', 'Dictatorship', 'Theocracy']]];
function civState() { const w = world(); w.civ ||= { sec: 'branches', q: null, right: 0, tries: 0 }; return w.civ; }
const civCard = (icon, title, body, cls = '') => `<div class="civ-card ${cls}"><div class="civ-ic">${icon}</div><div><b>${title}</b><div class="small">${body}</div></div></div>`;
function civBranches() {
  const nm = k => CIV_BRANCH.find(b => b.k === k).name;
  return `<p class="muted small" style="margin-top:0">The Constitution splits power three ways so no single part of government gets too strong. This is called the <b>separation of powers</b>.</p>
    <div class="civ-branches">${CIV_BRANCH.map(b => `<div class="civ-br ${b.k}"><div class="civ-br-top">${b.icon}<div><b>${b.name}</b><div class="small">${b.who} · ${b.art}</div></div></div>
      <div class="civ-job">${b.job}</div><ul>${b.parts.map(p => `<li>${p}</li>`).join('')}</ul><div class="sm-cap">Powers</div><ul>${b.powers.map(p => `<li>${p}</li>`).join('')}</ul></div>`).join('')}</div>
    <h3 style="margin:16px 0 6px">⚖️ Checks and balances</h3><p class="muted small" style="margin-top:0">Each branch can limit the others.</p>
    <div class="civ-checks">${CIV_CHECKS.map(([a, b, t]) => `<div class="civ-check"><span class="civ-tag ${a}">${nm(a)}</span><span aria-hidden="true">→</span><span class="civ-tag ${b}">${nm(b)}</span><span class="small">${t}</span></div>`).join('')}</div>`;
}
function civBill() {
  return `<div class="civ-flow">${CIV_BILL.map(([i, t, d], n) => `<div class="civ-step"><div class="civ-num">${n + 1}</div><div class="civ-ic">${i}</div><div><b>${t}</b><div class="small">${d}</div></div></div>`).join('<div class="civ-arrow" aria-hidden="true">↓</div>')}</div>
    <p class="muted small">Thousands of bills are introduced in each two-year Congress, and only a few hundred become law.</p>`;
}
function civConst() {
  return `<div class="civ-pre"><b>The Preamble</b><p>“We the People of the United States, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America.”</p></div>
    <div class="sm-grid">${CIV_ARTS.map(([a, d]) => `<div class="sm-card"><b>${a}</b><div class="small">${d}</div></div>`).join('')}</div>
    <div class="sm-card" style="margin-top:10px"><b>Changing the Constitution (Article V)</b><div class="small">An amendment is <b>proposed</b> by 2/3 of both houses of Congress (or by a convention asked for by 2/3 of the states), then <b>ratified</b> by 3/4 of the states (38 of 50). It has been amended <b>27 times</b>.</div></div>
    <h3 style="margin:16px 0 6px">📅 Founding documents</h3>
    <div class="civ-docs">${CIV_DOCS.map(([y, n, d]) => `<div class="civ-doc"><span class="civ-yr">${y}</span><div><b>${n}</b><div class="small">${d}</div></div></div>`).join('')}</div>
    <button type="button" class="btn" data-civ="tl" style="margin-top:8px">🕰️ Put these on a timeline</button>`;
}
function civRights() {
  return `<p class="muted small" style="margin-top:0">The Bill of Rights was added in 1791.</p>
    <div class="civ-bor">${CIV_BOR.map(([n, t]) => `<div class="civ-amd"><span class="civ-n">${n}</span><span>${t}</span></div>`).join('')}</div>
    <h3 style="margin:16px 0 6px">Other important amendments</h3>
    <div class="civ-bor">${CIV_AMD.map(([n, y, t]) => `<div class="civ-amd"><span class="civ-n">${n}</span><span>${t} <span class="muted small">(${y})</span></span></div>`).join('')}</div>`;
}
function civLevels() {
  return `<p class="muted small" style="margin-top:0">The US is a <b>federal</b> system: power is shared between the national government and the states. Some jobs are shared, like collecting taxes, building roads and running courts.</p>
    <div class="civ-branches">${CIV_LEVELS.map(([i, n, w, who, jobs]) => `<div class="civ-br lvl"><div class="civ-br-top">${i}<div><b>${n}</b><div class="small">${w}</div></div></div><div class="small"><b>Led by:</b> ${who}</div><div class="sm-cap">Takes care of</div><ul>${jobs.map(j => `<li>${j}</li>`).join('')}</ul></div>`).join('')}</div>
    <p class="muted small">States are set up like small copies of the federal government: a governor (executive), a legislature (legislative) and state courts (judicial).</p>`;
}
function civElect() {
  return `<div class="sm-grid">
    ${civCard('🗳️', 'Who can vote', 'US citizens who are 18 or older (and registered, in most states). Voting is a right, not a requirement.')}
    ${civCard('📅', 'Election Day', 'The Tuesday after the first Monday in November. Presidents are elected every 4 years; all House seats and about 1/3 of the Senate every 2 years. The years in between are <b>midterms</b>.')}
    ${civCard('🏛️', 'The Electoral College', 'Voters in each state choose <b>electors</b> who cast the votes for President. Each state gets as many electors as it has senators + representatives, and D.C. gets 3. There are <b>538</b>; it takes <b>270</b> to win.')}
    ${civCard('🎉', 'Political parties', 'Groups of people with similar ideas who run candidates. Primaries and caucuses pick each party’s candidates.')}
    ${civCard('✅', 'Rights of citizens', 'Vote in federal elections, run for federal office, free speech and religion, a fair trial, and to petition the government.')}
    ${civCard('🤲', 'Responsibilities', 'Obey the laws, pay taxes, serve on a jury when called, stay informed, and vote. Men 18 to 25 must register with the Selective Service.')}
    ${civCard('🌎', 'Becoming a citizen', 'People born in the US are citizens (14th Amendment). Others can <b>naturalize</b>: usually 5 years as a permanent resident, then an English and civics test and an oath.')}
    ${civCard('📣', 'Getting involved', 'Contact your representatives, go to town meetings, volunteer, sign petitions, or join a student council.')}</div>`;
}
function civForms() { return `<div class="sm-grid">${CIV_FORMS.map(([i, n, d]) => civCard(i, n, d)).join('')}</div>`; }
function civQuizNew() { const t = civState(), pick = CIV_QUIZ.filter((_, i) => i !== t.q?.i); const q = pick[Math.floor(Math.random() * pick.length)], i = CIV_QUIZ.indexOf(q); t.q = { i, opts: shuffle([q[1], ...q[2]]), given: null }; }
function civQuiz() {
  const t = civState(); if (!t.q) civQuizNew(); const q = t.q, [ques, ans] = CIV_QUIZ[q.i];
  return `<div class="civ-q"><div class="civ-qt">${esc(ques)}</div>
    <div class="civ-opts">${q.opts.map(o => `<button type="button" class="btn big ${q.given ? (o === ans ? 'primary' : o === q.given ? 'danger' : '') : ''}" data-civ="ans" data-v="${esc(o)}" ${q.given ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>
    <div class="sm-qmsg">${q.given ? (q.given === ans ? '✓ Correct!' : `The answer is <b>${esc(ans)}</b>.`) : ''}</div>
    <div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap">${q.given ? '<button type="button" class="btn primary" data-civ="next">Next question →</button>' : ''}<span class="muted small">Score ${t.right} / ${t.tries}</span>
      <button type="button" class="btn sm ghost" data-civ="cards">📇 Make flashcards</button></div></div>`;
}
function civicsHtml() {
  const t = civState(), F = { branches: civBranches, bill: civBill, const: civConst, rights: civRights, levels: civLevels, elect: civElect, forms: civForms, quiz: civQuiz };
  return `<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:12px">${CIV_SECS.map(([k, l]) => `<button type="button" class="btn sm ${t.sec === k ? 'primary' : ''}" data-civ="sec" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="civ-body">${(F[t.sec] || civBranches)()}</div>
    <p class="muted small" style="margin-top:12px">About the United States government. The forms-of-government section covers countries around the world.</p>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-civ]'); if (!b || view.name !== 'world') return; const t = civState();
  switch (b.dataset.civ) {
    case 'sec': t.sec = b.dataset.k; break;
    case 'next': civQuizNew(); break;
    case 'ans': { if (!t.q || t.q.given) return; t.q.given = b.dataset.v; t.tries++; if (t.q.given === CIV_QUIZ[t.q.i][1]) { t.right++; if (typeof rightSound === 'function') rightSound(); } else if (typeof sdSound === 'function') sdSound('wrong'); break; }
    case 'cards': { const [d, n] = worldMakeDeck('Civics', CIV_QUIZ.map(([q, a]) => [q, a])); toast(n ? `📇 Added ${n} cards to “${d.name}”` : `“${d.name}” already has these cards`); return; }
    case 'tl': return worldTimeline('US founding documents', CIV_DOCS.map(([y, n, d]) => ({ y, title: n, text: d })));
    default: return;
  }
  worldSave(); worldRedraw();
});
