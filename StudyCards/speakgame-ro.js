'use strict';
/* ================= 🎤 Say it!: Romanian =================
   Words like "un", "o", "niște" and the verb marker "a" (a mânca) in front don't matter. Romanian puts "the" on the
   end of the noun, so saying "câinele" for a card that says "câine" (or "casa" for "casă") counts too.
   Accents are already ignored by skNorm, so ș and ş, ț and ţ are the same letter here. Loaded after speakgame.js. */
SK_ARTICLES.ro = ['un', 'o', 'niște', 'a se', 'a'];
// the "the" endings: -ul, -le, -l (oul), -ua (cafeaua), -lor; the plural -i of câinii and the -le of casele
const roSkBare = w => w.length > 4 ? w.replace(/(ului|ilor|lor|ul|le|ua)$/, '').replace(/ii$/, 'i') : w;
{ const prevMatch = skMatch;
  skMatch = function (heard, card, lang) {
    const r = prevMatch(heard, card, lang);
    if (r.ok || String(lang || '').split('-')[0].toLowerCase() !== 'ro') return r;
    const answers = skAnswers(card, lang).map(a => a.split(' ').map(roSkBare).join(' '));
    for (const h of heard) {
      const said = skNorm(h, lang).split(' ').map(roSkBare).join(' ');
      for (const a of answers) if (said === a || (' ' + said + ' ').includes(' ' + a + ' ')) return { ok: true, close: false, heard: h };
    }
    return r;
  }; }
