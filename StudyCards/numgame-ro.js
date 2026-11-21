'use strict';
/* ================= 🔢 Numbers & ABC: Romanian =================
   Counting words (unu, doi, douăzeci și unu, o sută, două sute, o mie) and the Romanian alphabet with ă, â, î, ș, ț.
   Romanian numbers agree with the noun: one and two have feminine forms (una, două; douăsprezece), so when you type a
   number, the feminine form counts as right too. ş and ţ (with a cedilla, from older keyboards) count as ș and ț.
   Loaded after numgame.js. */
NG_LANGS.ro = { name: 'Romanian', flag: '🇷🇴', tts: 'ro-RO' };
NG_WORDS.ro = function (n) {
  const u = ['zero', 'unu', 'doi', 'trei', 'patru', 'cinci', 'șase', 'șapte', 'opt', 'nouă', 'zece', 'unsprezece', 'doisprezece', 'treisprezece', 'paisprezece', 'cincisprezece',
    'șaisprezece', 'șaptesprezece', 'optsprezece', 'nouăsprezece'];
  const t = ['', '', 'douăzeci', 'treizeci', 'patruzeci', 'cincizeci', 'șaizeci', 'șaptezeci', 'optzeci', 'nouăzeci'];
  const two = x => x < 20 ? u[x] : t[Math.floor(x / 10)] + (x % 10 ? ' și ' + u[x % 10] : '');
  if (n === 1000) return 'o mie'; if (n < 100) return two(n);
  const c = Math.floor(n / 100), r = n % 100;
  // sută is feminine: o sută, două sute, trei sute…
  return (c === 1 ? 'o sută' : (c === 2 ? 'două' : u[c]) + ' sute') + (r ? ' ' + two(r) : '');
};
NG_ABC.ro = 'a:a ă:ă â:â din a b:be c:ce d:de e:e f:fe g:ge h:haș i:i î:î din i j:je k:ca l:le m:me n:ne o:o p:pe q:chiu r:re s:se ș:șe t:te ț:țe u:u v:ve w:dublu ve x:ics y:i grec z:ze';
const roNumComma = s => String(s ?? '').replace(/ş/g, 'ș').replace(/ţ/g, 'ț').replace(/Ş/g, 'Ș').replace(/Ţ/g, 'Ț');
// the feminine way to say the same number: unu → una, doi → două, doisprezece → douăsprezece
const roNumFem = w => String(w).replace(/\bunu$/, 'una').replace(/\bdoi$/, 'două').replace(/\bdoisprezece$/, 'douăsprezece');
{ const prevAnswer = ngAnswer;
  ngAnswer = function (given) {
    if (ng?.lang === 'ro' && ng.mode === 'type' && ng.q && typeof given === 'string') {
      given = roNumComma(given);
      const a = ng.q.answer, fem = roNumFem(a);
      // typed the feminine form (una, două, douăsprezece): right too, so check it as the counting form
      if (fem !== a && ngNorm(given) === ngNorm(fem)) given = given.trim().toLowerCase().replace(/\s+/g, ' ') === fem ? a : ngNorm(a);
    }
    return prevAnswer(given);
  }; }
