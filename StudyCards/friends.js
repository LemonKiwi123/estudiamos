'use strict';
/* ================= The elephant's animal friends (original artwork) =================
   Each friend lives in a part of the app and cheers you on with messages that react to your progress.
   Click a friend to hear it and get a new message. */
const EYE = (x, y, r = 5.4) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.15}" fill="#2b2f45"/><circle cx="${x + r * 0.38}" cy="${y - r * 0.45}" r="${r * 0.38}" fill="#fff"/><circle cx="${x - r * 0.3}" cy="${y + r * 0.5}" r="${r * 0.17}" fill="#fff"/>`;
const CHEEKS = (x1, x2, y) => `<ellipse cx="${x1}" cy="${y}" rx="5" ry="3.2" fill="#f49ab3" opacity=".7"/><ellipse cx="${x2}" cy="${y}" rx="5" ry="3.2" fill="#f49ab3" opacity=".7"/>`;
const SHADOW = `<ellipse cx="60" cy="113" rx="28" ry="4" fill="#000" opacity=".08"/>`;
const FRIENDS = {
  owl: { name: 'Ollie', kind: 'owl', home: 'Study & quizzes', art: () => `${SHADOW}
    <ellipse cx="31" cy="78" rx="9" ry="20" fill="#7d5d9c" transform="rotate(14 31 78)"/><ellipse cx="89" cy="78" rx="9" ry="20" fill="#7d5d9c" transform="rotate(-14 89 78)"/>
    <ellipse cx="60" cy="72" rx="33" ry="38" fill="#9b7bb8"/>
    <ellipse cx="60" cy="86" rx="21" ry="21" fill="#ece0f5"/>
    <path d="M51 82 q3 3 6 0 M63 82 q3 3 6 0 M57 92 q3 3 6 0" stroke="#c9b3dc" stroke-width="2" fill="none" stroke-linecap="round"/>
    <circle cx="46" cy="58" r="14.5" fill="#f7f0fc"/><circle cx="74" cy="58" r="14.5" fill="#f7f0fc"/>
    ${EYE(46, 58, 6.2)}${EYE(74, 58, 6.2)}
    <path d="M55.5 66 L64.5 66 L60 74 Z" fill="#f5a623"/>
    ${CHEEKS(34, 86, 70)}
    <ellipse cx="51" cy="109" rx="6" ry="3.5" fill="#f5a623"/><ellipse cx="69" cy="109" rx="6" ry="3.5" fill="#f5a623"/>
    <path d="M36 30 L60 19 L84 30 L60 41 Z" fill="#2b2f45"/><path d="M48 35 v8 q12 6 24 0 v-8 L60 41 Z" fill="#3a3f5c"/>
    <path d="M84 30 L84 42" stroke="#f2c14e" stroke-width="2"/><circle cx="84" cy="44" r="3" fill="#f2c14e"/>` },
  monkey: { name: 'Momo', kind: 'monkey', home: 'Games', art: () => `${SHADOW}
    <path d="M80 98 C104 100 108 72 94 66 C88 64 86 70 90 72" stroke="#8d5b3e" stroke-width="6" fill="none" stroke-linecap="round"/>
    <ellipse cx="60" cy="92" rx="22" ry="19" fill="#9c6b4a"/><ellipse cx="60" cy="96" rx="13" ry="12" fill="#f2d6b3"/>
    <ellipse cx="46" cy="109" rx="7" ry="4" fill="#8d5b3e"/><ellipse cx="74" cy="109" rx="7" ry="4" fill="#8d5b3e"/>
    <circle cx="29" cy="54" r="12" fill="#9c6b4a"/><circle cx="29" cy="54" r="7" fill="#f2d6b3"/>
    <circle cx="91" cy="54" r="12" fill="#9c6b4a"/><circle cx="91" cy="54" r="7" fill="#f2d6b3"/>
    <circle cx="60" cy="52" r="28" fill="#9c6b4a"/>
    <path d="M55 26 q5 -8 10 0" stroke="#8d5b3e" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M60 44 C53 33 35 39 38 55 C40 69 50 76 60 76 C70 76 80 69 82 55 C85 39 67 33 60 44 Z" fill="#f2d6b3"/>
    ${EYE(51, 53)}${EYE(69, 53)}
    <circle cx="57" cy="62" r="1.4" fill="#8d5b3e"/><circle cx="63" cy="62" r="1.4" fill="#8d5b3e"/>
    <path d="M52 67 q8 7 16 0" stroke="#2b2f45" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    ${CHEEKS(43, 77, 63)}` },
  giraffe: { name: 'Gigi', kind: 'giraffe', home: 'Progress', art: () => `${SHADOW}
    <rect x="44" y="94" width="7" height="18" rx="3" fill="#e8b23f"/><rect x="71" y="94" width="7" height="18" rx="3" fill="#e8b23f"/>
    <ellipse cx="61" cy="94" rx="24" ry="13" fill="#f6c453"/>
    <rect x="51" y="40" width="20" height="56" rx="9" fill="#f6c453"/>
    <rect x="54" y="52" width="7" height="6" rx="2.5" fill="#c98a3c"/><rect x="63" y="64" width="6" height="7" rx="2.5" fill="#c98a3c"/><rect x="54" y="76" width="7" height="6" rx="2.5" fill="#c98a3c"/>
    <rect x="70" y="88" width="8" height="6" rx="2.5" fill="#c98a3c"/><rect x="46" y="90" width="7" height="5" rx="2.5" fill="#c98a3c"/>
    <path d="M52 20 L50 8 M68 20 L70 8" stroke="#c98a3c" stroke-width="3.4" stroke-linecap="round"/><circle cx="50" cy="7" r="3.6" fill="#a86f2c"/><circle cx="70" cy="7" r="3.6" fill="#a86f2c"/>
    <ellipse cx="38" cy="25" rx="9" ry="4.5" fill="#f6c453" transform="rotate(-20 38 25)"/><ellipse cx="82" cy="25" rx="9" ry="4.5" fill="#f6c453" transform="rotate(20 82 25)"/>
    <ellipse cx="60" cy="31" rx="20" ry="17" fill="#f6c453"/>
    <ellipse cx="60" cy="42" rx="13" ry="8.5" fill="#fadf9c"/><circle cx="56" cy="41" r="1.5" fill="#a86f2c"/><circle cx="64" cy="41" r="1.5" fill="#a86f2c"/>
    ${EYE(51, 29, 4.4)}${EYE(69, 29, 4.4)}${CHEEKS(44, 76, 37)}` },
  rabbit: { name: 'Rosie', kind: 'rabbit', home: 'Quick review', art: () => `${SHADOW}
    <g stroke="#ddd3e6" stroke-width="2">
      <ellipse cx="47" cy="27" rx="9" ry="24" fill="#f6f2f8" transform="rotate(-10 47 27)"/><ellipse cx="73" cy="27" rx="9" ry="24" fill="#f6f2f8" transform="rotate(10 73 27)"/>
      <ellipse cx="60" cy="96" rx="22" ry="16" fill="#f6f2f8"/>
      <circle cx="60" cy="62" r="26" fill="#f6f2f8"/>
    </g>
    <ellipse cx="47" cy="27" rx="4.5" ry="17" fill="#f7c1d1" transform="rotate(-10 47 27)"/><ellipse cx="73" cy="27" rx="4.5" ry="17" fill="#f7c1d1" transform="rotate(10 73 27)"/>
    <ellipse cx="47" cy="110" rx="8" ry="4" fill="#ede6f2"/><ellipse cx="73" cy="110" rx="8" ry="4" fill="#ede6f2"/>
    ${EYE(50, 60)}${EYE(70, 60)}
    <path d="M57 68 h6 l-3 3.4 z" fill="#f48aa8"/><path d="M60 71 v3 M60 74 q-4 3 -7 0 M60 74 q4 3 7 0" stroke="#2b2f45" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <rect x="57.8" y="74.5" width="4.4" height="4.5" rx="1" fill="#fff" stroke="#ddd3e6"/>
    ${CHEEKS(42, 78, 69)}
    <path d="M82 92 l10 -14" stroke="#4caf50" stroke-width="3" stroke-linecap="round"/><path d="M76 104 L86 86 L92 90 Z" fill="#f28c38"/>` },
  squirrel: { name: 'Nutmeg', kind: 'squirrel', home: 'Rewards shop', art: () => `${SHADOW}
    <path d="M78 106 C112 100 114 50 92 38 C78 31 68 46 78 54 C90 63 94 86 74 98 Z" fill="#d9773b"/>
    <path d="M84 96 C102 88 104 58 92 48" stroke="#f0a86b" stroke-width="5" fill="none" stroke-linecap="round" opacity=".8"/>
    <ellipse cx="56" cy="90" rx="22" ry="20" fill="#e9a065"/><ellipse cx="56" cy="95" rx="13" ry="13" fill="#fbe1c6"/>
    <ellipse cx="45" cy="109" rx="7" ry="4" fill="#d98b52"/><ellipse cx="67" cy="109" rx="7" ry="4" fill="#d98b52"/>
    <path d="M38 42 L36 22 L50 34 Z M70 34 L76 20 L78 40 Z" fill="#e9a065"/><path d="M39 38 L38 27 L46 34 Z M72 34 L75 26 L76 37 Z" fill="#f7c9a0"/>
    <circle cx="56" cy="56" r="23" fill="#e9a065"/>
    <ellipse cx="56" cy="64" rx="14" ry="10" fill="#fbe1c6"/>
    ${EYE(47, 54)}${EYE(65, 54)}
    <ellipse cx="56" cy="62" rx="2.6" ry="1.8" fill="#6b3e22"/><path d="M52 66 q4 3.6 8 0" stroke="#2b2f45" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    ${CHEEKS(39, 73, 63)}
    <path d="M50 82 c-5 0 -7 5 -5 9 c1 2 1 4 0 6 c-2 4 0 9 5 9 c5 0 7 -5 5 -9 c-1 -2 -1 -4 0 -6 c2 -4 0 -9 -5 -9 z" fill="#d9b27a" stroke="#b98d55" stroke-width="1.4"/>
    <ellipse cx="43" cy="92" rx="5" ry="4" fill="#e9a065"/><ellipse cx="58" cy="92" rx="5" ry="4" fill="#e9a065"/>` },
  turtle: { name: 'Tito', kind: 'turtle', home: 'Daily streak', art: () => `${SHADOW}
    <ellipse cx="28" cy="102" rx="9" ry="6" fill="#7bc67e"/><ellipse cx="92" cy="102" rx="9" ry="6" fill="#7bc67e"/>
    <path d="M18 96 C18 50 102 50 102 96 Z" fill="#4f9d63"/>
    <path d="M60 60 l12 7 v14 l-12 7 l-12 -7 v-14 z M36 74 l8 -4 M84 74 l-8 -4 M44 92 l4 -4 M76 92 l-4 -4" stroke="#7cc58e" stroke-width="3" fill="none" stroke-linejoin="round"/>
    <rect x="16" y="93" width="88" height="9" rx="4.5" fill="#3e8452"/>
    <circle cx="60" cy="80" r="19" fill="#9ad79c"/>
    <path d="M42 72 q18 -10 36 0" stroke="#ef476f" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${EYE(53, 80, 4.6)}${EYE(67, 80, 4.6)}
    <path d="M54 89 q6 5 12 0" stroke="#2b2f45" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${CHEEKS(47, 73, 88)}
    <ellipse cx="45" cy="110" rx="8" ry="4.5" fill="#7bc67e"/><ellipse cx="75" cy="110" rx="8" ry="4.5" fill="#7bc67e"/>` },
  penguin: { name: 'Pip', kind: 'penguin', home: 'Settings', art: () => `${SHADOW}
    <ellipse cx="29" cy="76" rx="8" ry="19" fill="#2f3a5a" transform="rotate(20 29 76)"/><ellipse cx="91" cy="76" rx="8" ry="19" fill="#2f3a5a" transform="rotate(-20 91 76)"/>
    <ellipse cx="60" cy="68" rx="31" ry="40" fill="#2f3a5a"/>
    <path d="M60 40 C44 34 34 48 40 62 C36 78 42 102 60 104 C78 102 84 78 80 62 C86 48 76 34 60 40 Z" fill="#f6f8fb"/>
    ${EYE(50, 54)}${EYE(70, 54)}
    <path d="M55 62 L65 62 L60 69 Z" fill="#f5a623"/>
    ${CHEEKS(43, 77, 64)}
    <path d="M36 74 Q60 86 84 74 L84 82 Q60 94 36 82 Z" fill="#ef476f"/><path d="M74 82 l6 16 l-8 1 z" fill="#d83a60"/>
    <ellipse cx="50" cy="109" rx="8" ry="4" fill="#f5a623"/><ellipse cx="70" cy="109" rx="8" ry="4" fill="#f5a623"/>` },
};
function friendSvg(id, size = 64) {
  const f = FRIENDS[id]; if (!f) return '';
  return `<svg class="friend" data-friend="${id}" width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(f.name)} the ${f.kind}">${f.art()}</svg>`;
}
const friendsOn = () => S.settings?.friends !== false && !(typeof lookPro === 'function' && lookPro());

/* ---------- Messages that react to your progress ---------- */
function friendLines(id, ctx, data = {}) {
  const goal = typeof dailyGoal === 'function' ? dailyGoal() : 10, act = typeof dayActivity === 'function' ? dayActivity() : 0;
  const st = typeof displayStreak === 'function' ? displayStreak() : { n: 0 }, left = Math.max(0, goal - act);
  switch (`${id}:${ctx}`) {
    case 'turtle:home':
      if (act >= goal) return ['Goal done for today! Slow and steady wins the race. 🐢', 'You did it! See you tomorrow, same time?', `That’s ${st.n} day${st.n === 1 ? '' : 's'} in a row. I’m so proud of you!`];
      if (st.n > 0) return [`Just ${left} more card${left === 1 ? '' : 's'} to keep your ${st.n}-day streak going!`, 'A few cards a day keeps the forgetting away!', 'Even I can do a few cards a day. You’ve got this!'];
      return ['Every big journey starts with one card. Let’s go!', `Study ${goal} cards today to start a streak!`, 'Slow and steady wins the race. Start with just a few cards!'];
    case 'owl:deck': {
      const { due = 0, fresh = 0, total = 0 } = data;
      if (!total) return ['Hoo! Add a few cards and I’ll help you learn them.', 'Tip: add an example sentence to each card. It makes words stick!'];
      if (due) return [`Hoo! ${due} card${due === 1 ? ' is' : 's are'} waiting. Let’s review while they’re fresh.`, 'Reviewing right before you forget is the secret to remembering!', 'Wise learners review a little every day. Hoo hoo!'];
      if (fresh) return [`${fresh} new card${fresh === 1 ? ' is' : 's are'} ready to learn. Shall we?`, 'New words are like seeds. Let’s plant some today!'];
      return ['All caught up! Try a game or a quick review for extra practice.', 'Nothing due right now. Hoo! Your memory is in great shape.'];
    }
    case 'owl:dict': {
      const { learned = 0, mastered = 0 } = data;
      if (!learned) return ['Hoo! Every word you study will be written here. Let’s fill these pages!'];
      return [`Hoo! You’ve learned ${learned} word${learned === 1 ? '' : 's'} so far. What a library!`, `${mastered} of them are mastered: they’re in your long-term memory now.`, 'Tip: search for a word to see its example sentence and hear it again.'];
    }
    case 'owl:studyDone': return [`Wise work! You reviewed ${data.n || 0} card${data.n === 1 ? '' : 's'}.`, 'Your brain is building new paths. Hoo hoo!', 'Rest now. Sleep helps your brain keep what you learned!'];
    case 'owl:quiz': {
      const p = data.pct ?? 0;
      if (p === 100) return ['Hoo-ray! A perfect score!', 'Not a single mistake. You’re a wise one!'];
      if (p >= 80) return ['Excellent work! Just a few to polish.', 'Hoo! You really know these words.'];
      if (p >= 50) return ['Good effort! Review the missed ones and try again.', 'Mistakes help you learn. Let’s practice the tricky ones!'];
      return ['Every quiz makes you stronger. Try the missed words again!', 'Don’t worry, even owls had to learn to fly. Keep going!'];
    }
    case 'owl:cheer': return [`${data.n} cards done! Hoo hoo, keep going!`, 'You’re on a roll!', 'Wise choice to study today!', 'Your future self says thank you!'];
    case 'squirrel:price': return ['Ooh, shopping! Name the products to win chips. Nom nom!', 'Aim for the middle of the board. That’s the 5,000 slot!', 'Every chip could be a jackpot!'];
    case 'giraffe:town': return ['I can see the whole board from up here! Welcome to Word Town!', 'Tip: own every place in a color to build bookshelves!', 'Answer words right to pay only half rent!'];
    case 'rabbit:spin': return ['Spin, spell and hop to victory!', 'Tip: guess common letters first, like S, R, N and T!', 'Save some points to buy vowels!'];
    case 'monkey:showdown': return ['Ooh ooh! Welcome to the show! Big numbers mean big points!', 'Psst… one tile hides a Double Down. Ooh!', 'Wrong answer? Your friend can steal it. Stay sharp!'];
    case 'monkey:tower': return ['Ooh ooh! Steady hands and sharp memory. Don’t knock it over!', 'Take turns, read carefully, and pull the right block!', 'The taller it gets, the wobblier it gets. Ooh!'];
    case 'monkey:games': return ['Ooh ooh! Pick a game. I love Elephant run!', 'Games are a fun way to remember words. Let’s play!', 'Match words is my favorite. How fast can you go?'];
    case 'monkey:result': {
      const p = data.pct ?? 0;
      if (p >= 90) return ['Ooh ooh aah aah! That was amazing!', 'You’re a word champion! Banana break? 🍌'];
      if (p >= 60) return ['Nice playing! One more round?', 'Ooh! You’re getting better every game!'];
      return ['Swing back in and try again! You’ll get it!', 'Practice makes progress. Let’s go again!'];
    }
    case 'rabbit:quick': return ['Hop through every card as fast as you can!', 'Not sure? Pick “Not quite” and I’ll bring it back.', 'Quick reviews are perfect before a test!'];
    case 'rabbit:done': return ['Hop hop hooray! You got them all!', 'Speedy and smart! 🥕', 'That was fast! Want to go again?'];
    case 'rabbit:cheer': return [`${data.n} cards! Zoom zoom!`, 'Hop to it! You’re doing great!', 'Keep hopping!'];
    case 'giraffe:progress': {
      const k = typeof levelCounts === 'function' ? levelCounts(S.cards) : { pct: 0, mastered: 0 };
      return [`Look how far you’ve come: ${k.pct}% of your cards studied!`, `From up here I can see ${k.mastered} mastered card${k.mastered === 1 ? '' : 's'}. What a view!`, 'Small steps every day add up to big progress.'];
    }
    case 'squirrel:shop': {
      const nuts = S.rewards?.peanuts || 0, price = typeof FREEZE_PRICE !== 'undefined' ? FREEZE_PRICE : 100;
      if (nuts >= price) return [`You have ${nuts} peanuts. That’s enough for a streak freeze!`, 'Ooh, shiny peanuts! A streak freeze could protect your streak.'];
      return [`You have ${nuts} peanut${nuts === 1 ? '' : 's'}. Streak freezes cost ${price}. Keep studying!`, 'Every 5 points gives you a peanut. Nom nom!', 'Save your peanuts for a rainy day… or a missed day!'];
    }
    case 'penguin:settings': return ['Make Estudiamos feel like home! Pick a background in your profile.', 'Tip: turn on auto-play to hear every word.', 'Brr-illiant! You can change the daily goal here too.'];
  }
  return ['You’re doing great!'];
}
const friendIdx = {};
function friendTip(id, ctx, data, opts = {}) {
  if (!friendsOn() || !FRIENDS[id]) return '';
  const key = `${id}:${ctx}`, lines = friendLines(id, ctx, data);
  friendIdx[key] ??= Math.floor(Math.random() * lines.length);
  const text = lines[friendIdx[key] % lines.length];
  return `<div class="friend-tip ${opts.compact ? 'compact' : ''}" data-friend="${id}" data-ctx="${ctx}" data-data="${esc(JSON.stringify(data || {}))}">
    ${friendSvg(id, opts.size || 60)}<div class="bubble"><b>${esc(FRIENDS[id].name)}</b> ${esc(text)}</div></div>`;
}
let friendToastTimer = null;
function friendToast(id, ctx, data) {
  if (!friendsOn()) return;
  const lines = friendLines(id, ctx, data), text = lines[Math.floor(Math.random() * lines.length)];
  let el = $('#friendToast');
  if (!el) { el = document.createElement('div'); el.id = 'friendToast'; document.body.appendChild(el); }
  el.innerHTML = `${friendSvg(id, 54)}<div class="bubble"><b>${esc(FRIENDS[id].name)}</b> ${esc(text)}</div>`;
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  clearTimeout(friendToastTimer); friendToastTimer = setTimeout(() => el.classList.remove('show'), 3600);
}

/* ---------- Friend sounds (synthesised) ---------- */
function friendSound(id) {
  if (S.settings?.mascotSound === false) return;
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  audioCtx ||= new AC(); const ac = audioCtx; if (ac.state === 'suspended') ac.resume();
  const t0 = ac.currentTime + 0.01;
  const tone = (start, dur, f0, f1, type = 'sine', vol = 0.25, vib = 0) => {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t0 + start); o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + start + dur);
    if (vib) { const v = ac.createOscillator(), vg = ac.createGain(); v.frequency.value = vib; vg.gain.value = f0 * 0.03; v.connect(vg); vg.connect(o.frequency); v.start(t0 + start); v.stop(t0 + start + dur); }
    g.gain.setValueAtTime(0.0001, t0 + start); g.gain.exponentialRampToValueAtTime(vol, t0 + start + Math.min(0.04, dur / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + dur);
    o.connect(g); g.connect(ac.destination); o.start(t0 + start); o.stop(t0 + start + dur + 0.02);
  };
  switch (id) {
    case 'owl': tone(0, 0.32, 430, 380, 'sine', 0.3, 5); tone(0.42, 0.55, 400, 330, 'sine', 0.3, 5); break;                    // hoo… hoo
    case 'monkey': tone(0, 0.14, 500, 820, 'triangle', 0.22); tone(0.17, 0.14, 520, 860, 'triangle', 0.22); tone(0.36, 0.32, 700, 1100, 'triangle', 0.22); break;   // ooh ooh aah
    case 'giraffe': tone(0, 0.6, 150, 135, 'sine', 0.35, 4); break;                                                            // soft hum
    case 'rabbit': [0, 0.09, 0.18].forEach((s, i) => tone(s, 0.07, 1400 + i * 180, 1800 + i * 180, 'sine', 0.16)); break;      // squeaks
    case 'squirrel': for (let i = 0; i < 6; i++) tone(i * 0.055, 0.04, 2200 + (i % 2) * 400, 2600, 'square', 0.06); break;       // chitter
    case 'turtle': tone(0, 0.22, 220, 330, 'sine', 0.28); tone(0.26, 0.3, 330, 200, 'sine', 0.25); break;                     // bloop
    case 'penguin': tone(0, 0.16, 620, 520, 'sawtooth', 0.12); tone(0.2, 0.22, 660, 500, 'sawtooth', 0.12); break;            // honk honk
  }
}
document.addEventListener('click', e => {
  const svg = e.target.closest?.('svg.friend'); if (!svg) return;
  const id = svg.dataset.friend; friendSound(id);
  svg.classList.remove('honk'); void svg.getBoundingClientRect(); svg.classList.add('honk');
  const tip = svg.closest('.friend-tip');
  if (tip) {
    const key = `${id}:${tip.dataset.ctx}`, data = JSON.parse(tip.dataset.data || '{}'), lines = friendLines(id, tip.dataset.ctx, data);
    friendIdx[key] = ((friendIdx[key] ?? 0) + 1) % lines.length;
    tip.querySelector('.bubble').innerHTML = `<b>${esc(FRIENDS[id].name)}</b> ${esc(lines[friendIdx[key]])}`;
  }
});
