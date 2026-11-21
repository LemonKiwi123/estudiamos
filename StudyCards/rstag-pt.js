'use strict';
/* ================= Sentence Builder · 📖 Real sentences in Portuguese: word types and meanings =================
   Closed word lists, a word list for the built-in sentences, and safe rules. Portuguese has a few words that can be two
   things ("a" is "the", "to" or "her"; "o" is "the" or "him"; "nos" is "in the" or "us"; "como" is "how" or "I eat";
   "se" is "if" or "himself"): those are decided from the words around them, and left without a label when it isn't clear.
   Brazil and Portugal: the sentences carry a variant mark when they clearly use one (você / ônibus / -ndo vs tu / autocarro /
   "estar a"), and a deck in pt-BR or pt-PT gets the sentences that fit it (plus the ones that fit both).
   Loaded after rstag.js and builder-pt.js. */
RS_LANGS.pt = 'Portuguese';
RS_CLOSED.pt = { art: RS_W('um uma uns umas'),
  clArt: RS_W('o a os as'),
  det: RS_W('este esta estes estas esse essa esses essas aquele aquela aqueles aquelas isto meu minha meus minhas teu tua teus tuas seu sua seus suas nosso nossa nossos nossas vosso vossa vossos vossas cada outro outra outros outras algum alguma alguns algumas nenhum nenhuma vários várias qualquer quaisquer ambos ambas dois duas três quatro cinco seis sete oito nove dez cem mil'),
  flex: RS_W('muito muita muitos muitas pouco pouca poucos poucas todo toda todos todas tanto tanta tantos tantas demasiado'),
  pron: RS_W('eu tu ele ela você nós vós eles elas vocês mim ti si comigo contigo consigo conosco connosco isto isso aquilo algo nada ninguém alguém quem tudo dele dela deles delas mesmo lhe lhes vos'),
  clitic: RS_W('me te lhe lhes vos'), clArt2: RS_W('nos se'),
  prep: RS_W('ante após até com contra de desde em entre para perante por sem sob sobre ao à aos às do da dos das no na nas num numa nuns numas dum duma pelo pela pelos pelas pra pro deste desta destes destas desse dessa desses dessas daquele daquela daqueles daquelas neste nesta nestes nestas nesse nessa nesses nessas naquele naquela naqueles naquelas nisso nisto daqui dali durante'),
  conj: RS_W('e ou mas porém nem que porque embora quando enquanto pois portanto contudo todavia caso'),
  adv: RS_W('não sim mais menos já também tampouco nunca jamais sempre aqui ali lá aí cá hoje amanhã ontem agora depois antes logo bem mal tão ainda quase só somente apenas talvez cedo tarde perto longe onde aonde porquê bastante então além assim devagar depressa juntos juntas realmente afinal sequer demais'),
  verb: RS_W('é são sou és somos está estão estou estás estamos era eras éramos eram foi foram fui fomos estava estavam estive esteve tem têm tenho tens temos tinha tinham tive teve tivemos há havia houve vai vão vou vais vamos ia iam faz fazem faço fiz fez fazemos disse diz digo dizem pode podem posso podes podemos pôde pude quer querem quero queres queria sei sabe sabes sabem sabia vejo vê viu vi veem dá dou deu dão gosta gosto gostas gostam gostei gostaria ser estar ter ir fazer haver dizer poder querer saber ver dar vir sido estado ido feito dito visto posto escrito aberto seja sejam sejas esteja estejam tenha tenham vá vá faça possa queira saiba precisa preciso precisamos parece venha vem vêm veio vim acho acha achas sinto sente consigo')
};
const RS_PT_SUBJ = RS_W('eu tu ele ela você nós eles elas vocês não nunca se me te lhe nos vos também já ainda');
const RS_PT_CLITIC_TAIL = /-(me|te|se|nos|vos|lhe|lhes|o|a|os|as|lo|la|los|las|no|na|nos|nas)$/;
const RS_PT_NOT_VERB = RS_W('lugar mar bar lar par mulher colher prazer açúcar cadáver ar dólar altar colar jantar olhar poder ser haver dever azar éter líder hambúrguer revólver qualquer elixir faquir');
const RS_PT_NOT_GER = RS_W('quando lindo linda bando comando brando mundo segundo fundo profundo rotundo agenda fazenda tremendo horrendo estupendo ando');
/* the Sentence Builder's Portuguese words, both variants */
function rsPtLex() {
  const m = rsLex('pt'), put = (w, t) => { if (w && !m.has(String(w).toLowerCase())) m.set(String(w).toLowerCase(), t); };
  if (m._pt) return m; m._pt = true;
  if (typeof PT_NOUN !== 'undefined') PT_NOUN.forEach(n => { put(n[0], 'noun'); put(n[1], 'noun'); if (n[7]) { put(n[7][0], 'noun'); put(n[7][1], 'noun'); } });
  if (typeof PT_ADJ !== 'undefined') PT_ADJ.forEach(a => a.slice(0, 4).forEach(w => put(w, 'adj')));
  if (typeof PT_VERB !== 'undefined') PT_VERB.forEach(v => { put(ptInfOf(v[0]), 'verb'); v[1].forEach(w => put(w, 'verb')); put(ptGer(v[0]), 'verb'); });
  if (typeof PT_IRREG_FORMS !== 'undefined') Object.entries(PT_IRREG_FORMS).forEach(([inf, f]) => { put(inf, 'verb'); String(f).split(/\s+/).forEach(w => put(w, 'verb')); });
  return m;
}
const RS_PT_FEM = () => rsPtFem || (rsPtFem = new Set([...(typeof PT_NOUN !== 'undefined' ? PT_NOUN : [])].filter(n => n[2] === 'f').flatMap(n => [n[0], n[1], ...(n[7] || [])]).filter(Boolean)));
let rsPtFem = null;
function rsPtTagWord(w, i, low, raw = []) {
  const C = RS_CLOSED.pt, lex = rsPtLex(), prev = low[i - 1] || '';
  if (!w) return null;
  if (/^\d+$/.test(w)) return null;
  if (C.art.has(w)) return 'det';
  if (C.clArt.has(w) || C.flex.has(w) || C.clArt2.has(w) || w === 'como') return null;   // decided from the neighbours
  if (/-/.test(w) && RS_PT_CLITIC_TAIL.test(w)) return 'verb';   // levanto-me, dá-me, fazê-lo
  if (C.clitic.has(w) || C.pron.has(w)) return 'pron';
  if (C.prep.has(w)) return 'prep'; if (C.conj.has(w)) return 'conj'; if (C.adv.has(w)) return 'adv'; if (C.det.has(w)) return 'det'; if (C.verb.has(w)) return 'verb';
  if (RS_DICT_GET('pt', w)) return RS_DICT_GET('pt', w)[0];
  if (lex.has(w)) return lex.get(w);
  const afterNoun = C.art.has(prev) || C.det.has(prev) || C.clArt.has(prev) || (C.prep.has(prev) && !/^(de|para|sem|a|até)$/.test(prev));
  if (/mente$/.test(w) && w.length > 6) return 'adv';
  if (/(ando|endo|indo)$/.test(w) && w.length > 5 && !RS_PT_NOT_GER.has(w)) return 'verb';
  if (RS_PT_SUBJ.has(prev) && !afterNoun && w.length > 1 && !/^\p{Lu}/u.test(raw[i] || '')) return 'verb';
  if (!afterNoun && /[^aeiou]ei$/.test(w) && w.length > 4) return 'verb';   // comecei, falei   // eu falo, não sabe, se lembra
  if (!afterNoun && /(aram|eram|iram|ávamos|íamos|aremos|eremos|iremos|ariam|eriam|iriam|asse|esse|isse)$/.test(w) && w.length > 5) return 'verb';
  if (!afterNoun && /[^o]ou$/.test(w) && w.length > 4) return 'verb';   // falou, chegou (not "ou", "vou": those are listed)
  if (/(ar|er|ir|or)$/.test(w) && w.length > 3 && !RS_PT_NOT_VERB.has(w) && /^(de|para|sem|a|pode|podes|podem|posso|podemos|quer|quero|queres|querem|vou|vai|vais|vamos|vão|preciso|precisa|precisam|gosto|gosta|deve|devo|devemos|devem|tenho|tem|temos|acabou|começou|consigo|consegue|sabe|sei|ir|não)$/.test(prev)) return 'verb';
  return null;
}
function rsPtTagSentence(words) {
  const C = RS_CLOSED.pt, low = words.map(w => w.toLowerCase().replace(/[.,!?¿¡;:«»"“”()]/g, ''));
  const out = low.map((w, i) => rsPtTagWord(w, i, low, words)), lex = rsPtLex();
  const verbish = k => out[k] === 'verb' || (low[k] && /(ar|er|ir)$/.test(low[k]) && low[k].length > 3 && !RS_PT_NOT_VERB.has(low[k]) && lex.get(low[k]) !== 'noun');
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < low.length; i++) {
    if (out[i] != null) continue;
    const w = low[i], prev = out[i - 1], next = out[i + 1], nw = low[i + 1] || '', pw = low[i - 1] || '', cap = /^\p{Lu}/u.test(words[i + 1] || '');
    if (w === 'como') { out[i] = RS_PT_SUBJ.has(pw) && pw !== 'se' ? 'verb' : i === 0 ? 'adv' : pass ? 'conj' : null; continue; }
    if (w === 'se' && /(r|rem|rmos)$/.test(nw) && !C.prep.has(pw)) { out[i] = 'conj'; continue; }   // se chover, se quiser: "if"
    if (w === 'se') { out[i] = next === 'verb' || (pass && verbish(i + 1)) ? (next === 'verb' && /^(eu|tu|ele|ela|você|nós|eles|elas|vocês)$/.test(nw) ? 'conj' : 'pron') : next === 'pron' || next === 'det' ? 'conj' : pass ? null : null; continue; }
    if (w === 'nos' && cap) { out[i] = 'prep'; continue; }
    if (w === 'nos') { out[i] = next === 'noun' || next === 'adj' || next === 'det' ? 'prep' : next === 'verb' || prev === 'verb' ? 'pron' : null; continue; }
    if (w === 'o' || w === 'os' || w === 'as') { out[i] = next === 'verb' && !(lex.get(nw) === 'noun') ? 'pron' : next === 'noun' || next === 'adj' || next === 'det' || (pass && !next && /^\p{L}+$/u.test(nw) && !cap) ? 'det' : null; continue; }
    if (w === 'a') {
      if (cap) { out[i] = 'prep'; continue; }
      if (next === 'det') { out[i] = C.det.has(nw) && /^(minha|tua|sua|nossa|vossa|minhas|tuas|suas|nossas)$/.test(nw) ? 'det' : 'prep'; continue; }
      if (next === 'verb' || (pass && verbish(i + 1))) { out[i] = prev === 'verb' || prev === 'adj' || prev === 'noun' ? 'prep' : prev === 'pron' ? 'pron' : null; continue; }
      if (next === 'noun' || next === 'adj') { out[i] = prev !== 'verb' || RS_PT_FEM().has(nw) ? 'det' : null; continue; }
      continue;
    }
    if (C.flex.has(w)) { out[i] = next === 'noun' || next === 'adj' && /s$/.test(w) || next === 'det' ? 'det' : next === 'adj' ? 'adv' : next === 'pron' ? 'pron' : pass ? 'adv' : null; continue; }
    if (pass && i === 0 && /^\p{Lu}/u.test(words[0]) && RS_DATA.pt?.lower && !RS_DATA.pt.lower.has(w)) { out[i] = 'noun'; continue; }   // a name starting the sentence
    if (pass && i > 0 && /^\p{Lu}/u.test(words[i])) { out[i] = 'noun'; continue; }   // a name in the middle
    if (pass && (prev === 'det' || (prev === 'prep' && !/^(de|para|sem|a|até)$/.test(pw))) && /^\p{L}+$/u.test(w) && w.length > 2) out[i] = 'noun';
  }
  return out;
}
{ const prev = rsTagSentence; rsTagSentence = function (words, lang) { return lang === 'pt' ? rsPtTagSentence(words) : prev(words, lang); }; }

/* meanings under the words */
RS_GLOSS_COMMON.pt = 'é:is|são:are|sou:I am|és:you are|somos:we are|está:is|estão:are|estou:I am|estás:you are|estamos:we are|era:was|foi:was / went|fui:I was / went|estava:was|tem:has|têm:have|tenho:I have|tens:you have|temos:we have|tinha:had|há:there is / are|havia:there was|vai:goes|vão:go|vou:I go|vais:you go|vamos:we go / let\'s|faz:does / makes|faço:I do / make|fez:did|fiz:I did|disse:said|diz:says|pode:can|posso:I can|podes:you can|quer:wants|quero:I want|queres:you want|sei:I know|sabe:knows|sabes:you know|vejo:I see|viu:saw|vi:I saw|gosto:I like|gosta:likes|gostas:you like|preciso:I need|precisa:needs|acho:I think|parece:seems|eu:I|tu:you|ele:he|ela:she|você:you|nós:we|eles:they|elas:they|vocês:you|me:me|te:you|se:if / (him/her)self|lhe:(to) him / her|lhes:(to) them|nos:us / in the|o:the / him|a:the / to / her|os:the / them|as:the / them|um:a|uma:a|uns:some|umas:some|que:that / what|e:and|ou:or|mas:but|porque:because|quando:when|como:how / like|muito:very / a lot|muita:a lot of|muitos:many|mais:more|menos:less|não:not / no|sim:yes|já:already|aqui:here|ali:there|lá:there|isso:that|isto:this|aquilo:that|algo:something|nada:nothing|tudo:everything|todo:all|todos:everyone / all|também:also|sempre:always|nunca:never|bem:well|mal:badly|agora:now|hoje:today|amanhã:tomorrow|ontem:yesterday|quem:who|onde:where|por:for / by|para:for / to|pra:for / to|com:with|sem:without|de:of / from|em:in|ao:to the|à:to the|aos:to the|às:to the|do:of the|da:of the|dos:of the|das:of the|no:in the|na:in the|nas:in the|num:in a|numa:in a|pelo:by the|pela:by the|meu:my|minha:my|meus:my|minhas:my|teu:your|tua:your|seu:his / her / your|sua:his / her / your|nosso:our|nossa:our|dele:his|dela:her|deles:their|este:this|esta:this|esse:that|essa:that|aquele:that|aquela:that|outro:another|outra:another|tão:so|ainda:still|só:only|depois:after|antes:before|até:until|sobre:about|entre:between|mesmo:same / even|cada:each|dois:two|duas:two|três:three|tom:Tom|maria:Mary';
{ const prev = rsGlossMap; rsGlossMap = function (lang) {
  const m = prev(lang); if (lang !== 'pt' || m._pt) return m; m._pt = true;
  const put = (w, g) => { if (w && g && !m.has(String(w).toLowerCase())) m.set(String(w).toLowerCase(), String(g)); };
  (typeof PT_NOUN !== 'undefined' ? PT_NOUN : []).forEach(n => { put(n[0], n[4]); put(n[1], n[5] || n[4]); if (n[7]) { put(n[7][0], n[4]); put(n[7][1], n[5] || n[4]); } });
  (typeof PT_ADJ !== 'undefined' ? PT_ADJ : []).forEach(a => a.slice(0, 4).forEach(w => put(w, a[4])));
  (typeof PT_VERB !== 'undefined' ? PT_VERB : []).forEach(v => { put(ptInfOf(v[0]), 'to ' + v[5]); v[1].forEach(w => put(w, v[5])); put(ptGer(v[0]), ptIng(v[5])); });
  (typeof PT_PRON !== 'undefined' ? PT_PRON : []).forEach(p => put(p[0], p[3]));
  (typeof PT_DET !== 'undefined' ? PT_DET : []).forEach(d => put(d[0], d[3]));
  (typeof PT_PREP !== 'undefined' ? PT_PREP : []).forEach(p => put(p[0], p[1]));
  (typeof PT_ADV !== 'undefined' ? PT_ADV : []).forEach(a => put(a[0], a[1]));
  // your own cards like "o cachorro" / "a casa"
  try { for (const d of S.decks) { if (langBase(d.frontLang || '') !== 'pt') continue;
    for (const c of cardsOf(d.id)) { const f = plainSent(c.front || '').replace(/\s*\([^)]*\)/g, '').trim().toLowerCase(), b = plainSent(c.back || '').split(/[\n;,/]/)[0].trim(), p = f.split(/\s+/);
      if (b && b.length <= 30 && p.length === 2 && /^(o|a|os|as|um|uma)$/.test(p[0])) put(p[1], b.replace(/^(the|a|an) /i, '')); } } } catch {}
  return m;
}; }
{ const prev = rsGloss; rsGloss = function (word, lang) {
  const g = prev(word, lang); if (g || lang !== 'pt') return g;
  const w = String(word || '').toLowerCase().replace(/[.,!?¿¡;:«»"“”()]/g, ''), m = rsGlossMap('pt');
  const h = /^(.+)-(me|te|se|nos|vos|lhe|lhes|o|a|os|as|lo|la|los|las)$/.exec(w);   // levanto-me = levanto + me
  if (h) { const a = m.get(h[1]) || m.get(h[1].replace(/(á|ê|ô)$/, x => ({ á: 'ar', ê: 'er', ô: 'or' })[x])), b = m.get(h[2]) || ({ lo: 'it / him', la: 'it / her', los: 'them', las: 'them' })[h[2]]; if (a || b) return [a, b].filter(Boolean).join(' + '); }
  return '';
}; }

/* Brazil or Portugal: guess a sentence's variant from words that only one side uses (no mark = fine for both) */
const RS_PT_BR = /(?<!\p{L})(você|vocês|ônibus|trem|celular|banheiro|café da manhã|sorvete|suco|time|tênis|econômico|fenômeno|registro|cachorro|garoto|garota|bonde|geladeira|xícara|aeromoça|esporte|mouse|equipe|fato|carona|meia-noite e meia)(?!\p{L})|(?<!\p{L})(estou|está|estás|estamos|estão|estava|estavam|estive|esteve|ficou|fica|ficar|continua|vai|vou|vamos|ando|anda)\s+\S+ndo(?!\p{L})/iu;
const RS_PT_PT = /(?<!\p{L})(autocarro|comboio|telemóvel|casa de banho|pequeno-almoço|gelado|sumo|equipa|ténis|económico|fenómeno|registo|rapariga|miúdo|miúda|fixe|frigorífico|chávena|relva|hospedeira|fato de banho|desporto|ecrã|ficheiro|facto|boleia|connosco|contactar|contacto|óptimo|acção|direcção)(?!\p{L})|(?<!\p{L})(estou|está|estás|estamos|estão|estava|estavam|ficou|fica|continua|anda|andam)\s+a\s+\S+[aei]r(?!\p{L})|\s\S+-(me|te|se|lhe|nos)(?![\p{L}-])/iu;
const rsPtVariantOf = text => { const b = RS_PT_BR.test(text), p = RS_PT_PT.test(text); return b && !p ? 'BR' : p && !b ? 'PT' : ''; };
// a pt-BR deck gets the Brazilian and neutral sentences, a pt-PT deck the Portuguese and neutral ones
{ const prev = rsPick; rsPick = function () {
  if (rs?.lang !== 'pt' || !RS_DATA.pt?.items) return prev();
  const D = RS_DATA.pt, d = deckById(rs.deckId), vr = ptVariantOf([d?.frontLang, d?.backLang].find(x => /^pt/i.test(x || '')) || 'pt-BR');
  if (!D._all) { D._all = D.items; D._by = {}; }
  D.items = D._by[vr] ||= D._all.filter(it => { const v = it[4] || rsPtVariantOf(it[1]); return !v || v === vr; });
  try { return prev(); } finally { D.items = D._all; }
}; }

/* word list for words in the built-in sentences that the builder doesn't know */
RS_DICT.pt = new Map();
for (const line of `tom|noun|Tom
maria|noun|Mary
mary|noun|Mary
john|noun|John
verdade|noun|truth
melhor|adj|better
pior|adj|worse
dizer|verb|to say
tempo|noun|time / weather
coisa|noun|thing
coisas|noun|things
vez|noun|time (once)
vezes|noun|times
dia|noun|day
dias|noun|days
ano|noun|year
anos|noun|years
noite|noun|night
manhã|noun|morning
tarde|adv|late / afternoon
semana|noun|week
hora|noun|hour / time
horas|noun|hours
pessoa|noun|person
pessoas|noun|people
gente|noun|people / we
trabalho|noun|work
problema|noun|problem
ideia|noun|idea
nome|noun|name
francês|noun|French
inglês|noun|English
português|noun|Portuguese
filho|noun|son
filha|noun|daughter
filhos|noun|children
pais|noun|parents
país|noun|country
mundo|noun|world
vida|noun|life
quarto|noun|room
porta|noun|door
dinheiro|noun|money
carro|noun|car
festa|noun|party
música|noun|music
filme|noun|movie
jogo|noun|game
história|noun|story / history
pergunta|noun|question
resposta|noun|answer
fato|noun|fact (Brazil) / suit (Portugal)
facto|noun|fact
ônibus|noun|bus
autocarro|noun|bus
trem|noun|train
comboio|noun|train
celular|noun|cell phone
telemóvel|noun|cell phone
banheiro|noun|bathroom
café da manhã|noun|breakfast
pequeno-almoço|noun|breakfast
equipe|noun|team
equipa|noun|team
rapaz|noun|boy
garoto|noun|boy
garota|noun|girl
cão|noun|dog
cães|noun|dogs
feliz|adj|happy
certo|adj|right / sure
errado|adj|wrong
pronto|adj|ready
ocupado|adj|busy
sozinho|adj|alone
importante|adj|important
possível|adj|possible
impossível|adj|impossible
próximo|adj|next
último|adj|last
primeiro|adj|first
mesma|pron|same
obrigado|adj|thank you (said by a man)
obrigada|adj|thank you (said by a woman)
favor|noun|favor
olá|adv|hello
oi|adv|hi
tchau|adv|bye
adeus|adv|goodbye
desculpe|verb|sorry / excuse me
claro|adv|of course
ainda|adv|still
quase|adv|almost
fazer|verb|to do / make
falar|verb|to speak
falou|verb|spoke
sabia|verb|knew
pensa|verb|thinks
penso|verb|I think
acha|verb|thinks
acho|verb|I think
chegou|verb|arrived
chegar|verb|to arrive
ficar|verb|to stay
fica|verb|stays / is
ficou|verb|stayed / got
deixe|verb|let / leave
deixa|verb|lets / leaves
espere|verb|wait
olhe|verb|look
venha|verb|come
diga|verb|say / tell
sabe|verb|knows
conhece|verb|knows
conheço|verb|I know
ajudar|verb|to help
ajuda|noun|help
trabalha|verb|works
mora|verb|lives
vive|verb|lives
precisamos|verb|we need
estudar|verb|to study
comer|verb|to eat
beber|verb|to drink
dormir|verb|to sleep
ler|verb|to read
escrever|verb|to write
morreu|verb|died
nasceu|verb|was born
perdeu|verb|lost
encontrou|verb|found
comprou|verb|bought
gostaria|verb|would like
poderia|verb|could
deveria|verb|should
seria|verb|would be
teria|verb|would have
estará|verb|will be
será|verb|will be
terá|verb|will have
irá|verb|will go`.split('\n')) { const [w, t, g] = line.split('|'); RS_DICT.pt.set(w.trim().toLowerCase(), [t.trim(), (g || '').trim()]); }
