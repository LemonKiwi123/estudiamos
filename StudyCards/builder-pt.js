'use strict';
/* ================= Sentence Builder: Portuguese (Brazil and Portugal) =================
   One grammar engine for both. The variant comes from the deck's language (pt-BR or pt-PT); Brazil is the default.
   What changes with the variant: everyday words (ônibus / autocarro, trem / comboio, celular / telemóvel, café da manhã /
   pequeno-almoço, suco / sumo, cachorro / cão), possessives (Portugal puts the article first: "o meu livro"), where me / te / se
   go ("eu me levanto" in Brazil, "eu levanto-me" in Portugal; after não both say "não me levanto"), the -ing form ("estou
   falando" in Brazil, "estou a falar" in Portugal) and the "you" the game picks (você in Brazil, tu in Portugal).
   Checks: o/a/os/as, um/uma, possessives and este/esse/aquele agree with the noun; de + o = do, em + a = na, a + a = à; adjectives
   after the noun (bom and mau can go before it); ser for what something is like, estar for how it is right now and where it is;
   ter fome / sede (or estar com fome); gostar de; ir a / para + a place; no "a" before a person you see; the verb agrees with
   the subject. Loaded after builder.js. */

const PT_VAR = { force: null };   // tests set force: 'BR' or 'PT'
const ptVariantOf = tag => /^pt[-_]pt\b/i.test(String(tag || '')) ? 'PT' : 'BR';
function ptVar() {
  if (PT_VAR.force) return PT_VAR.force;
  try {
    const d = typeof bld !== 'undefined' && bld && typeof deckById === 'function' ? deckById(bld.deckId) : null;
    const t = [d?.frontLang, d?.backLang].find(x => /^pt/i.test(x || '')); if (t) return ptVariantOf(t);
  } catch (e) { /* no deck */ }
  return 'BR';
}
//            word     form gender English  you?       form: 0 eu, 1 tu, 2 ele/ela/você, 3 nós, 4 eles/elas/vocês
const PT_PRON = [['eu', 0, 'x', 'I'], ['tu', 1, 'x', 'you', 1], ['ele', 2, 'm', 'he'], ['ela', 2, 'f', 'she'], ['você', 2, 'x', 'you', 1],
  ['nós', 3, 'x', 'we'], ['eles', 4, 'm', 'they'], ['elas', 4, 'f', 'they'], ['vocês', 4, 'x', 'you', 1]];
const PT_FORM = [[1, 's'], [2, 's'], [3, 's'], [1, 'p'], [3, 'p']];
// determiner families: m sing, f sing, m plural, f plural
const PT_DETF = { o: ['o', 'a', 'os', 'as'], um: ['um', 'uma', 'uns', 'umas'], meu: ['meu', 'minha', 'meus', 'minhas'], teu: ['teu', 'tua', 'teus', 'tuas'],
  seu: ['seu', 'sua', 'seus', 'suas'], nosso: ['nosso', 'nossa', 'nossos', 'nossas'], este: ['este', 'esta', 'estes', 'estas'], esse: ['esse', 'essa', 'esses', 'essas'],
  aquele: ['aquele', 'aquela', 'aqueles', 'aquelas'], dois: [null, null, 'dois', 'duas'], tres: [null, null, 'três', 'três'] };
const PT_DET_EN = { o: ['the', 'the'], um: ['a', 'some'], meu: ['my', 'my'], teu: ['your', 'your'], seu: ['his/her/your', 'his/her/your'], nosso: ['our', 'our'],
  este: ['this', 'these'], esse: ['that', 'those'], aquele: ['that', 'those'], dois: ['two', 'two'], tres: ['three', 'three'] };
const PT_POSS = ['meu', 'teu', 'seu', 'nosso'];
const PT_DET = [];
for (const [fam, ws] of Object.entries(PT_DETF)) ws.forEach((w, k) => { if (w && !PT_DET.some(d => d[0] === w)) PT_DET.push([w, fam, fam === 'o' || fam === 'um' ? 'art' : PT_POSS.includes(fam) ? 'poss' : fam === 'dois' || fam === 'tres' ? 'num' : 'dem', PT_DET_EN[fam][k >= 2 ? 1 : 0]]); });
const ptIdx = (g, num) => (num === 'p' ? 2 : 0) + (g === 'f' ? 1 : 0);
const ptWant = (fam, g, num) => PT_DETF[fam][ptIdx(g, num)] || PT_DETF[fam][ptIdx(g, 'p')];
// contractions: preposition + article in one word
const PT_CONTR = { do: ['de', 'o'], da: ['de', 'a'], dos: ['de', 'os'], das: ['de', 'as'], no: ['em', 'o'], na: ['em', 'a'], nos: ['em', 'os'], nas: ['em', 'as'],
  ao: ['a', 'o'], 'à': ['a', 'a'], aos: ['a', 'os'], 'às': ['a', 'as'] };
const ptContr = (p, art) => Object.keys(PT_CONTR).find(k => PT_CONTR[k][0] === p && PT_CONTR[k][1] === art) || p + ' ' + art;
//            singular   plural     g    kind      English one / many   mass (1 can't count, 2 both)   Portugal: [singular, plural]
const PT_NOUN = [
  ['homem', 'homens', 'm', 'person', 'man', 'men'], ['mulher', 'mulheres', 'f', 'person', 'woman', 'women'], ['menino', 'meninos', 'm', 'person', 'boy', 'boys'], ['menina', 'meninas', 'f', 'person', 'girl', 'girls'],
  ['amigo', 'amigos', 'm', 'person', 'friend', 'friends'], ['amiga', 'amigas', 'f', 'person', 'friend', 'friends'], ['mãe', null, 'f', 'person', 'mother', null], ['pai', null, 'm', 'person', 'father', null],
  ['irmão', 'irmãos', 'm', 'person', 'brother', 'brothers'], ['irmã', 'irmãs', 'f', 'person', 'sister', 'sisters'], ['professor', 'professores', 'm', 'person', 'teacher', 'teachers'],
  ['professora', 'professoras', 'f', 'person', 'teacher', 'teachers'], ['médico', 'médicos', 'm', 'person', 'doctor', 'doctors'], ['criança', 'crianças', 'f', 'person', 'child', 'children'],
  ['cachorro', 'cachorros', 'm', 'animal', 'dog', 'dogs', 0, ['cão', 'cães']], ['gato', 'gatos', 'm', 'animal', 'cat', 'cats'], ['pássaro', 'pássaros', 'm', 'animal', 'bird', 'birds'], ['cavalo', 'cavalos', 'm', 'animal', 'horse', 'horses'],
  ['pão', null, 'm', 'food', 'bread', null, 1], ['arroz', null, 'm', 'food', 'rice', null, 1], ['queijo', null, 'm', 'food', 'cheese', null, 1], ['frango', null, 'm', 'food', 'chicken', null, 1],
  ['carne', null, 'f', 'food', 'meat', null, 1], ['sopa', null, 'f', 'food', 'soup', null, 1], ['maçã', 'maçãs', 'f', 'food', 'apple', 'apples'], ['bolo', 'bolos', 'm', 'food', 'cake', 'cakes'],
  ['laranja', 'laranjas', 'f', 'food', 'orange', 'oranges'], ['sorvete', 'sorvetes', 'm', 'food', 'ice cream', 'ice creams', 0, ['gelado', 'gelados']],
  ['café da manhã', null, 'm', 'food', 'breakfast', null, 0, ['pequeno-almoço', null]],
  ['água', null, 'f', 'drink', 'water', null, 1], ['leite', null, 'm', 'drink', 'milk', null, 1], ['café', null, 'm', 'drink', 'coffee', null, 2], ['suco', null, 'm', 'drink', 'juice', null, 1, ['sumo', null]], ['chá', null, 'm', 'drink', 'tea', null, 1],
  ['livro', 'livros', 'm', 'read', 'book', 'books'], ['carta', 'cartas', 'f', 'read', 'letter', 'letters'], ['revista', 'revistas', 'f', 'read', 'magazine', 'magazines'], ['jornal', 'jornais', 'm', 'read', 'newspaper', 'newspapers'],
  ['casa', 'casas', 'f', 'place', 'house', 'houses'], ['cidade', 'cidades', 'f', 'place', 'town', 'towns'], ['escola', 'escolas', 'f', 'place', 'school', 'schools'], ['parque', 'parques', 'm', 'place', 'park', 'parks'],
  ['praia', 'praias', 'f', 'place', 'beach', 'beaches'], ['loja', 'lojas', 'f', 'place', 'store', 'stores'], ['restaurante', 'restaurantes', 'm', 'place', 'restaurant', 'restaurants'], ['mercado', 'mercados', 'm', 'place', 'market', 'markets'],
  ['escritório', 'escritórios', 'm', 'place', 'office', 'offices'], ['cozinha', 'cozinhas', 'f', 'place', 'kitchen', 'kitchens'], ['biblioteca', 'bibliotecas', 'f', 'place', 'library', 'libraries'], ['igreja', 'igrejas', 'f', 'place', 'church', 'churches'],
  ['carro', 'carros', 'm', 'thing', 'car', 'cars'], ['mesa', 'mesas', 'f', 'thing', 'table', 'tables'], ['cadeira', 'cadeiras', 'f', 'thing', 'chair', 'chairs'], ['celular', 'celulares', 'm', 'thing', 'phone', 'phones', 0, ['telemóvel', 'telemóveis']],
  ['bola', 'bolas', 'f', 'thing', 'ball', 'balls'], ['flor', 'flores', 'f', 'thing', 'flower', 'flowers'], ['porta', 'portas', 'f', 'thing', 'door', 'doors'], ['janela', 'janelas', 'f', 'thing', 'window', 'windows'],
  ['dinheiro', null, 'm', 'thing', 'money', null, 1], ['presente', 'presentes', 'm', 'thing', 'gift', 'gifts'], ['bicicleta', 'bicicletas', 'f', 'thing', 'bike', 'bikes'],
  ['ônibus', 'ônibus', 'm', 'thing', 'bus', 'buses', 0, ['autocarro', 'autocarros']], ['trem', 'trens', 'm', 'thing', 'train', 'trains', 0, ['comboio', 'comboios']],
  // how you feel: "tenho fome" (I have hunger) or "estou com fome", with no article
  ['fome', null, 'f', 'feel', 'hungry'], ['sede', null, 'f', 'feel', 'thirsty'], ['frio', null, 'm', 'feel', 'cold'], ['calor', null, 'm', 'feel', 'hot'], ['medo', null, 'm', 'feel', 'scared'], ['sono', null, 'm', 'feel', 'sleepy']];
const ptNW = (n, num, vr = ptVar()) => { const o = vr === 'PT' && n[7]; return num === 'p' ? (o ? o[1] || o[0] : n[1]) : (o ? o[0] : n[0]); };
const PT_OPENABLE = ['porta', 'janela', 'livro', 'revista', 'loja', 'escritório', 'restaurante', 'biblioteca', 'carta', 'presente', 'jornal'];
const PT_RIDE = ['ônibus', 'trem', 'carro', 'bicicleta'];
//            m sing   f sing   m plural  f plural  English   describes   where (pre = can also go before the noun)   with ser / estar / both
const PT_ADJ = [['bom', 'boa', 'bons', 'boas', 'good', 'pafrl', 'pre', 'both'], ['mau', 'má', 'maus', 'más', 'bad', 'pafr', 'pre', 'ser'],
  ['grande', 'grande', 'grandes', 'grandes', 'big', 'patl', 'post', 'ser'], ['pequeno', 'pequena', 'pequenos', 'pequenas', 'small', 'patl', 'post', 'ser'],
  ['novo', 'nova', 'novos', 'novas', 'new', 'tlr', 'post', 'ser'], ['velho', 'velha', 'velhos', 'velhas', 'old', 'patlr', 'post', 'ser'],
  ['bonito', 'bonita', 'bonitos', 'bonitas', 'pretty', 'patl', 'post', 'both'], ['jovem', 'jovem', 'jovens', 'jovens', 'young', 'pa', 'post', 'ser'], ['alto', 'alta', 'altos', 'altas', 'tall', 'p', 'post', 'ser'],
  ['vermelho', 'vermelha', 'vermelhos', 'vermelhas', 'red', 'tf', 'post', 'ser'], ['azul', 'azul', 'azuis', 'azuis', 'blue', 't', 'post', 'ser'], ['verde', 'verde', 'verdes', 'verdes', 'green', 'tf', 'post', 'ser'],
  ['preto', 'preta', 'pretos', 'pretas', 'black', 'at', 'post', 'ser'], ['branco', 'branca', 'brancos', 'brancas', 'white', 'atf', 'post', 'ser'], ['amarelo', 'amarela', 'amarelos', 'amarelas', 'yellow', 'tf', 'post', 'ser'],
  ['caro', 'cara', 'caros', 'caras', 'expensive', 'tflr', 'post', 'both'], ['barato', 'barata', 'baratos', 'baratas', 'cheap', 'tflr', 'post', 'both'],
  ['fácil', 'fácil', 'fáceis', 'fáceis', 'easy', 'r', 'post', 'ser'], ['difícil', 'difícil', 'difíceis', 'difíceis', 'hard', 'r', 'post', 'ser'],
  ['rápido', 'rápida', 'rápidos', 'rápidas', 'fast', 'pat', 'post', 'ser'], ['simpático', 'simpática', 'simpáticos', 'simpáticas', 'nice', 'p', 'post', 'ser'], ['inteligente', 'inteligente', 'inteligentes', 'inteligentes', 'smart', 'p', 'post', 'ser'],
  ['feliz', 'feliz', 'felizes', 'felizes', 'happy', 'pa', 'post', 'both'], ['triste', 'triste', 'tristes', 'tristes', 'sad', 'pa', 'post', 'both'], ['delicioso', 'deliciosa', 'deliciosos', 'deliciosas', 'delicious', 'f', 'post', 'both'],
  ['frio', 'fria', 'frios', 'frias', 'cold', 'fl', 'post', 'both'], ['quente', 'quente', 'quentes', 'quentes', 'hot', 'f', 'post', 'both'], ['limpo', 'limpa', 'limpos', 'limpas', 'clean', 'tl', 'post', 'both'], ['sujo', 'suja', 'sujos', 'sujas', 'dirty', 'tl', 'post', 'both'],
  ['cansado', 'cansada', 'cansados', 'cansadas', 'tired', 'pa', 'post', 'estar'], ['contente', 'contente', 'contentes', 'contentes', 'glad', 'pa', 'post', 'estar'], ['doente', 'doente', 'doentes', 'doentes', 'sick', 'pa', 'post', 'estar']];
//            infinitive  eu, tu, ele/ela/você, nós, eles/elas/vocês     kind   what it takes   needs one  English   he/she form   who   -se verb
const PT_VERB = [['comer', ['como', 'comes', 'come', 'comemos', 'comem'], 'tr', ['food'], 0, 'eat', 'eats', 'a'],
  ['beber', ['bebo', 'bebes', 'bebe', 'bebemos', 'bebem'], 'tr', ['drink'], 0, 'drink', 'drinks', 'a'],
  ['fazer', ['faço', 'fazes', 'faz', 'fazemos', 'fazem'], 'tr', ['food', 'drink'], 1, 'make', 'makes', 'p'],
  ['ler', ['leio', 'lês', 'lê', 'lemos', 'leem'], 'tr', ['read'], 0, 'read', 'reads', 'p'],
  ['escrever', ['escrevo', 'escreves', 'escreve', 'escrevemos', 'escrevem'], 'tr', ['read'], 0, 'write', 'writes', 'p'],
  ['comprar', ['compro', 'compras', 'compra', 'compramos', 'compram'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'buy', 'buys', 'p'],
  ['vender', ['vendo', 'vendes', 'vende', 'vendemos', 'vendem'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'sell', 'sells', 'p'],
  ['ter', ['tenho', 'tens', 'tem', 'temos', 'têm'], 'ter', ['*'], 1, 'have', 'has', 'a'],
  ['querer', ['quero', 'queres', 'quer', 'queremos', 'querem'], 'tr', ['food', 'drink', 'read', 'thing', 'animal'], 1, 'want', 'wants', 'a'],
  ['procurar', ['procuro', 'procuras', 'procura', 'procuramos', 'procuram'], 'tr', ['*'], 1, 'look for', 'looks for', 'a'],
  ['ver', ['vejo', 'vês', 'vê', 'vemos', 'veem'], 'tr', ['*'], 1, 'see', 'sees', 'a'],
  ['gostar', ['gosto', 'gostas', 'gosta', 'gostamos', 'gostam'], 'gostar', ['*'], 1, 'like', 'likes', 'a'],
  ['visitar', ['visito', 'visitas', 'visita', 'visitamos', 'visitam'], 'tr', ['place', 'person'], 1, 'visit', 'visits', 'p'],
  ['abrir', ['abro', 'abres', 'abre', 'abrimos', 'abrem'], 'tr', ['open'], 1, 'open', 'opens', 'p'],
  ['fechar', ['fecho', 'fechas', 'fecha', 'fechamos', 'fecham'], 'tr', ['open'], 1, 'close', 'closes', 'p'],
  ['falar', ['falo', 'falas', 'fala', 'falamos', 'falam'], 'in', null, 0, 'talk', 'talks', 'p'],
  ['trabalhar', ['trabalho', 'trabalhas', 'trabalha', 'trabalhamos', 'trabalham'], 'in', null, 0, 'work', 'works', 'p'],
  ['estudar', ['estudo', 'estudas', 'estuda', 'estudamos', 'estudam'], 'in', null, 0, 'study', 'studies', 'p'],
  ['brincar', ['brinco', 'brincas', 'brinca', 'brincamos', 'brincam'], 'in', null, 0, 'play', 'plays', 'a'],
  ['correr', ['corro', 'corres', 'corre', 'corremos', 'correm'], 'in', null, 0, 'run', 'runs', 'a'],
  ['andar', ['ando', 'andas', 'anda', 'andamos', 'andam'], 'in', null, 0, 'walk', 'walks', 'a'],
  ['dormir', ['durmo', 'dormes', 'dorme', 'dormimos', 'dormem'], 'in', null, 0, 'sleep', 'sleeps', 'a'],
  ['morar', ['moro', 'moras', 'mora', 'moramos', 'moram'], 'in', null, 0, 'live', 'lives', 'a'],
  ['viver', ['vivo', 'vives', 'vive', 'vivemos', 'vivem'], 'in', null, 0, 'live', 'lives', 'a'],
  ['ir', ['vou', 'vais', 'vai', 'vamos', 'vão'], 'ir', null, 1, 'go', 'goes', 'a'],
  ['ser', ['sou', 'és', 'é', 'somos', 'são'], 'ser', null, 1, 'be', 'is', 'a'],
  ['estar', ['estou', 'estás', 'está', 'estamos', 'estão'], 'estar', null, 1, 'be', 'is', 'a'],
  // -se verbs: the 9th item (1) means they need me / te / se / nos with them
  ['levantar-se', ['levanto', 'levantas', 'levanta', 'levantamos', 'levantam'], 'in', null, 0, 'get up', 'gets up', 'a', 1],
  ['deitar-se', ['deito', 'deitas', 'deita', 'deitamos', 'deitam'], 'in', null, 0, 'go to bed', 'goes to bed', 'p', 1],
  ['lavar-se', ['lavo', 'lavas', 'lava', 'lavamos', 'lavam'], 'in', null, 0, 'wash up', 'washes up', 'p', 1],
  ['vestir-se', ['visto', 'vestes', 'veste', 'vestimos', 'vestem'], 'in', null, 0, 'get dressed', 'gets dressed', 'p', 1],
  ['sentar-se', ['sento', 'sentas', 'senta', 'sentamos', 'sentam'], 'in', null, 0, 'sit down', 'sits down', 'a', 1]];
const PT_REFL = ['me', 'te', 'se', 'nos', 'se'];
const ptInfOf = inf => String(inf).replace(/-se$/, '');
const ptGer = inf => { const b = ptInfOf(inf); return b === 'pôr' ? 'pondo' : b.replace(/r$/, 'ndo'); };
// Portugal puts me / te / se after the verb, with a hyphen: levanto-me, levantamo-nos (the s of -mos drops)
const ptEncl = (form, f) => f === 3 ? form.replace(/s$/, '') + '-nos' : form + '-' + PT_REFL[f];
//            word        English     where it can go: e = start or end, p = right before the verb, v = right after the verb, z = at the end
const PT_ADV = [['hoje', 'today', 'ez'], ['amanhã', 'tomorrow', 'ez'], ['agora', 'now', 'ez'], ['sempre', 'always', 'pv'], ['também', 'too', 'pz'],
  ['bem', 'well', 'vz'], ['muitas vezes', 'often', 'evz'], ['aqui', 'here', 'z']];
const PT_PREP = [['a', 'to'], ['ao', 'to the'], ['à', 'to the'], ['aos', 'to the'], ['às', 'to the'], ['em', 'in / at'], ['no', 'in the / at the'], ['na', 'in the / at the'],
  ['nos', 'in the / at the'], ['nas', 'in the / at the'], ['com', 'with'], ['para', 'for / to'], ['de', 'of / from'], ['do', 'of the'], ['da', 'of the'], ['dos', 'of the'], ['das', 'of the']];
const PT_CONJ = [['e', 'and'], ['mas', 'but'], ['ou', 'or']];
const PT_KIND = { food: 'food', drink: 'drinks', read: 'things you read or write', thing: 'things', place: 'places', animal: 'animals', person: 'people', open: 'things you can open' };
const PT_HOW_VERBS = /^(falar|trabalhar|estudar|brincar|correr|andar|dormir|comer|beber|ler|escrever)$/;   // verbs that go with bem / muito
const ptWhere = a => { const p = a.pos, s = []; if (p.includes('e')) s.push('at the start or the end'); if (p.includes('p')) s.push('right before the verb'); if (p.includes('v')) s.push('right after the verb'); if (p.includes('z') && !p.includes('e')) s.push('at the end'); return s.join(' or '); };

/* chips (each carries its English, so the meanings under the words work) */
const ptChip = o => chip({ gloss: o.en, ...o });
const ptPron = p => ptChip({ k: 'pron', w: p[0], f: p[1], per: PT_FORM[p[1]][0], num: PT_FORM[p[1]][1], g: p[2], en: p[3], you: !!p[4] });
const ptPronW = w => ptPron(PT_PRON.find(p => p[0] === w));
const ptDetW = w => { const d = PT_DET.find(x => x[0] === w); return ptChip({ k: 'det', w, fam: d[1], cls: d[2], en: d[3] }); };
const ptNoun = (n, num) => ptChip({ k: 'noun', w: ptNW(n, num), e: n, g: n[2], num, cat: n[3], mass: n[6] || 0, en: num === 'p' ? n[5] : n[4] });
const ptAdj = (a, w) => ptChip({ k: 'adj', w, e: a, en: a[4], pos: a[6] });
const ptVerb = (v, f) => ptChip({ k: 'verb', w: v[1][f], e: v, f, type: v[2], gloss: 'to ' + v[5] });
const ptVerbEncl = (v, f) => ptChip({ k: 'verb', w: ptEncl(v[1][f], f), e: v, f, type: v[2], encl: 1, gloss: 'to ' + v[5] });
const ptGerC = v => ptChip({ k: 'verb', w: ptGer(v[0]), e: v, f: -1, ger: 1, type: v[2], gloss: ptIng(v[5]) });
const ptInfC = v => ptChip({ k: 'verb', w: ptInfOf(v[0]), e: v, f: -1, inf: 1, type: v[2], gloss: 'to ' + v[5] });
const ptRefl = w => ptChip({ k: 'refl', w, en: 'oneself' });
const ptPrep = w => ptChip({ k: 'prep', w, en: PT_PREP.find(p => p[0] === w)[1] });
const ptConj = w => ptChip({ k: 'conj', w, en: PT_CONJ.find(c => c[0] === w)[1] });
const ptAdv = w => { const a = PT_ADV.find(x => x[0] === w); return ptChip({ k: 'adv', w, en: a[1], pos: a[2] }); };
const ptNeg = w => ptChip({ k: 'neg', w, en: w === 'nunca' ? 'never' : 'not' });
const ptMuito = () => ptChip({ k: 'int', w: 'muito', en: 'very / a lot', pos: 'vz' });
const ptIng = en => en.replace(/^(\w+)/, w => /ie$/.test(w) ? w.slice(0, -2) + 'ying' : /[^aeiou][aeiou][bdgmnprt]$/.test(w) && !/^(visit|open|listen)$/.test(w) ? w + w.slice(-1) + 'ing' : /[^e]e$/.test(w) ? w.slice(0, -1) + 'ing' : w + 'ing');

/* ---------------- Portuguese checker ---------------- */
function ptCheck(T) {
  const VR = ptVar();
  let i = 0;
  const err = (msg, at = i) => ({ ok: false, msg, at: Math.max(0, Math.min(at, T.length - 1)), end: at >= T.length }), peek = (o = 0) => T[i + o], isErr = x => x && x.ok === false;
  if (!T.length) return err('Tap some words to build a sentence.');
  const gName = g => g === 'f' ? 'feminine' : 'masculine', nName = n => n === 'p' ? 'plural' : 'singular';
  const join = (...ws) => ws.filter(Boolean).join(' ');
  const npText = np => np.coord ? np.coord.map(npText).join(' e ') : join(np.det?.w, np.poss?.w, np.pre?.w, np.n.w, np.tres ? 'muito' : '', np.post?.w);
  const ser = f => ['sou', 'és', 'é', 'somos', 'são'][f], estar = f => ['estou', 'estás', 'está', 'estamos', 'estão'][f], ter = f => ['tenho', 'tens', 'tem', 'temos', 'têm'][f];
  // a noun phrase: (article) (possessive) (bom / mau) noun ((muito) adjective) (de / do / da + noun)
  // opt.art: the article is already inside a contraction like "na" (em + a); opt.p is that contraction
  function NP(role, opt = {}) {
    const start = i; let det = null, poss = null, pre = null, post = null, tres = false, of = null;
    if (peek()?.k === 'det') {
      const d = T[i++];
      if (opt.art && d.cls === 'art') return err(`“${opt.p.w}” already has the article in it (${PT_CONTR[opt.p.w].join(' + ')}), so don’t add “${d.w}”.`, i - 1);
      if (d.cls === 'poss') poss = d; else det = d;
      if (peek()?.k === 'det') {
        const d2 = T[i];
        if (det && det.fam === 'o' && d2.cls === 'poss') { poss = d2; i++; }
        else return err(det?.cls === 'poss' || d2.cls === 'poss' ? `The article goes first, then the possessive: “o meu livro”, “a minha casa”.` : 'One determiner is enough here.', i);
      }
    }
    if (peek()?.k === 'int') return err('“muito” (very) goes before a describing word that comes after the noun: “uma casa muito grande”.');
    if (peek()?.k === 'adj') {
      const a = peek();
      if (a.pos !== 'pre') { const n = T.slice(i, i + 3).find(t => t.k === 'noun'); return err(`“${a.e[0]}” goes after the noun in Portuguese${n ? `: “${join(det?.w, poss?.w, n.w, a.w)}”` : ''}. Only a few words like bom and mau can go before it.`); }
      pre = a; i++;
    }
    const n = peek();
    if (!n || n.k !== 'noun') return err(det || poss ? `“${(poss || det).w}” comes before a noun, so a noun has to follow it.` : role === 'subj' ? 'Start with who does it: a pronoun like “eu” or “ela”, or a noun like “o gato”.' : 'A noun (a person, place or thing) should go here.', det || poss ? i - 1 : i);
    i++;
    if (n.cat === 'feel') return err(`“${n.w}” is a feeling. Portuguese says it with ter and no article: “tenho ${n.w}” (or “estou com ${n.w}”).`, start);
    const art = det?.cls === 'art' && det.fam === 'o' ? det.w : opt.art || null;
    if (!det && !poss && !opt.art) {
      if (role === 'subj') return err(`Portuguese needs a word like “${ptWant('o', n.g, n.num)}” or “${ptWant('um', n.g, n.num)}” before “${n.w}” here.`, start);
      if (!(n.mass || n.num === 'p' || opt.bare)) return err(`“${n.w}” needs a word like “${ptWant('um', n.g, n.num)}” (a) or “${ptWant('o', n.g, n.num)}” (the) before it.`, start);
    }
    if (opt.art && opt.art !== ptWant('o', n.g, n.num)) { const c = ptContr(PT_CONTR[opt.p.w][0], ptWant('o', n.g, n.num)); return err(`“${n.w}” is ${gName(n.g)} ${nName(n.num)}, so use “${c}”: “${join(c, poss?.w, n.w)}”.`, start - 1); }
    if (det) {
      if (det.cls === 'num' && n.num === 's') return err(`“${det.w}” means more than one, so the noun must be plural${n.e[1] ? `: “${ptWant(det.fam, n.g, 'p')} ${ptNW(n.e, 'p', VR)}”` : ''}.`, start);
      if (det.fam === 'um' && n.mass === 1) return err(`You can’t count “${n.w}”. Say just “${n.w}”, or “${ptWant('o', n.g, 's')} ${n.w}” (the).`, start);
      const want = ptWant(det.fam, n.g, n.num);
      if (det.w !== want) return err(`“${n.w}” is ${gName(n.g)} ${nName(n.num)}, so use “${want}”: “${join(want, poss && ptWant(poss.fam, n.g, n.num), pre && pre.e[ptIdx(n.g, n.num)], n.w)}”.`, start);
    }
    if (poss) {
      const want = ptWant(poss.fam, n.g, n.num);
      if (poss.w !== want) return err(`“${n.w}” is ${gName(n.g)} ${nName(n.num)}, so use “${want}”: “${join(det && det.w, want, n.w)}”.`, det ? start + 1 : start);
      if (VR === 'PT' && !art && role !== 'pred') return err(`In Portugal, “${poss.w}” comes with the article first: “${join(ptWant('o', n.g, n.num), poss.w, n.w)}”.`, start);
    }
    if (pre) { const w = pre.e[ptIdx(n.g, n.num)]; if (pre.w !== w) return err(`“${pre.w}” has to match “${n.w}” (${gName(n.g)} ${nName(n.num)}): use “${w}”.`, i - 2); }
    if ((peek()?.k === 'int' && peek(1)?.k === 'adj') || peek()?.k === 'adj') {
      const at = i; let t2 = false; if (peek().k === 'int') { t2 = true; i++; }
      const a = T[i];
      if (pre) return err('Use one describing word per noun here.', at);
      const w = a.e[ptIdx(n.g, n.num)]; if (a.w !== w) return err(`“${a.w}” has to match “${n.w}” (${gName(n.g)} ${nName(n.num)}): use “${w}”.`, i);
      post = a; tres = t2; i++;
      if (peek()?.k === 'adj') return err('Use one describing word per noun here.');
    }
    // de + noun: "o livro do menino", "a casa da minha mãe"
    if (role !== 'of' && peek()?.k === 'prep' && ['de', 'do', 'da', 'dos', 'das'].includes(peek().w) && ['det', 'noun', 'adj'].includes(peek(1)?.k)) {
      const p = T[i++];
      if (p.w === 'de' && peek()?.k === 'det' && peek().fam === 'o') return err(`Portuguese joins “de” + “${peek().w}” into “${ptContr('de', peek().w)}”: “${ptContr('de', peek().w)} ${peek(1)?.w || '…'}”.`, i - 1);
      const o = NP('of', p.w === 'de' ? { bare: true } : { art: PT_CONTR[p.w][1], p }); if (isErr(o)) return o;
      of = { ...o, p };
    }
    return { det, poss, n, pre, post, tres, of, art, num: n.num, g: n.g, cat: n.cat };
  }
  function NPs(role, opt) {
    const a = NP(role, opt); if (isErr(a)) return a;
    const c = peek();
    if (c?.k === 'conj' && (c.w === 'e' || c.w === 'ou') && ['det', 'noun', 'pron'].includes(peek(1)?.k)) {
      const save = i; i++;
      if (peek().k === 'pron') { if (role === 'subj') return err('Join two nouns here: “o cachorro e o gato”. (To add a person, start a new sentence part.)', i); i = save; return a; }
      const b = NP(role, opt);
      if (isErr(b) || (role !== 'subj' && ['verb', 'neg', 'pron', 'refl'].includes(peek()?.k))) { i = save; return a; }
      return { coord: [a, b], conj: c, num: 'p', g: a.g === 'm' || b.g === 'm' ? 'm' : 'f', per: 3, cat: a.cat };
    }
    return a;
  }
  // a / ao / à / em / no / na / com / para + a noun phrase
  function PP(p, role) {
    const C = PT_CONTR[p.w];
    if (C) { if (peek()?.k === 'det' && peek().cls === 'art') return err(`“${p.w}” already has the article in it (${C.join(' + ')}), so don’t add “${peek().w}”.`); return NP(role, { art: C[1], p }); }
    if (['de', 'em', 'a'].includes(p.w) && peek()?.k === 'det' && peek().fam === 'o') { const c = ptContr(p.w, peek().w); return err(`Portuguese joins “${p.w}” + “${peek().w}” into “${c}”: “${c} ${peek(1)?.w || '…'}”.`, i - 1); }
    // em casa / para casa: at home, home
    if (['em', 'para', 'a'].includes(p.w) && peek()?.k === 'noun' && peek().e[0] === 'casa' && peek().num === 's' && peek(1)?.k !== 'adj' && !(peek(1)?.k === 'prep' && /^d/.test(peek(1).w))) { const n = T[i++]; return { n, home: true, num: 's', g: 'f', cat: 'place' }; }
    return NP(role, { bare: p.w === 'com' });
  }
  function clause() {
    const C = { lead: [], subj: null, neg: null, pre: [], refl: null, verb: null, v2: null, comp: null, pps: [], tail: [] }, cStart = i;
    while (peek()?.k === 'adv' && /[ep]/.test(peek().pos)) C.lead.push(T[i++]);
    if (peek()?.k === 'adv' || peek()?.k === 'int') return err(`“${peek().w}” goes ${ptWhere(peek())}, not at the start.`);
    if (peek()?.k === 'conj') return err(`“${peek().w}” joins two parts, so it can’t ${i === 0 ? 'start the sentence' : 'go here'}.`);
    if (peek()?.k === 'pron') { const p = T[i++]; C.subj = { pron: p, f: p.f, num: p.num, g: p.g }; }
    else if (['det', 'noun', 'adj', 'int'].includes(peek()?.k)) { const s = NPs('subj'); if (isErr(s)) return s; C.subj = s.coord ? { np: s, f: 4, num: 'p', g: s.g } : { np: s, f: s.num === 'p' ? 4 : 2, num: s.num, g: s.g }; }
    if (peek()?.k === 'pron') return err('A sentence has only one subject (who does it).');
    while (C.subj && peek()?.k === 'adv' && peek().pos.includes('p')) C.pre.push(T[i++]);
    if (peek()?.k === 'adv' && C.subj) return err(`“${peek().w}” goes ${ptWhere(peek())}.`);
    if (peek()?.k === 'neg') {
      C.neg = T[i++];
      if (peek()?.k === 'neg') return err('Use “não” or “nunca” before the verb, not both.', i);
      if (peek()?.k === 'adv') return err(`“${peek().w}” goes before “${C.neg.w}”, or ${ptWhere(peek()).replace('right before the verb or ', '')}.`, i);
      if (!['verb', 'refl'].includes(peek()?.k)) return err(`“${C.neg.w}” goes right before the verb: “eu ${C.neg.w} como”.`, i - 1);
    }
    if (peek()?.k === 'refl') {
      const at = i; C.refl = T[i++];
      if (peek()?.k === 'neg') return err(`“${peek().w}” goes before “${C.refl.w}”: “eu ${peek().w} ${C.refl.w} levanto”.`, i);
      if (peek()?.k !== 'verb') return err(`“${C.refl.w}” goes right next to a verb, like “${C.refl.w} levanto”.`, at);
    }
    const v = peek(), sText = C.subj ? (C.subj.pron ? C.subj.pron.w : npText(C.subj.np)) : '';
    if (!v) return err(C.subj ? 'Now add a verb (an action word like “come” or “é”).' : 'Every sentence needs a verb.');
    if (v.k !== 'verb') {
      if (v.k === 'adv' || v.k === 'int') return err(`“${v.w}” goes ${ptWhere(v)}.`);
      return err(`After ${C.subj ? `“${sText}”` : 'that'} the next word should be a verb. “${v.w}” isn’t a verb.`);
    }
    i++; C.verb = v;
    const sf = C.subj ? C.subj.f : 0;
    if (v.ger) return err(`“${v.w}” is the -ing form. It needs estar before it: “${estar(sf)} ${v.w}”.`, i - 1);
    if (v.inf) return err(`“${v.w}” is the to-form. Use the form that matches the subject: “${v.e[1][sf]}”.`, i - 1);
    // me / te / se / nos
    const R = v.e[8], want = PT_REFL[v.f], attract = C.neg || C.pre[0];
    if (!R && (C.refl || v.encl)) return err(`“${C.refl ? C.refl.w : v.w.split('-')[1]}” only goes with verbs like levantar-se. Take it out: just “${v.e[1][v.f]}”.`, C.refl ? i - 2 : i - 1);
    if (R) {
      const good = attract || VR === 'BR' ? `${want} ${v.e[1][v.f]}` : ptEncl(v.e[1][v.f], v.f);
      if (!C.refl && !v.encl) return err(`“${v.e[0]}” needs “${want}” with it: “${good}”.`, i - 1);
      if (C.refl && C.refl.w !== want) return err(`“${C.refl.w}” doesn’t match “${v.w}”. Use “${good}”.`, i - 2);
      if (v.encl && attract) return err(`After “${attract.w}”, “${want}” goes before the verb: “${attract.w} ${want} ${v.e[1][v.f]}”.`, i - 1);
      if (C.refl && !attract && VR === 'PT') return err(`In Portugal, “${want}” goes after the verb, with a hyphen: “${ptEncl(v.e[1][v.f], v.f)}”.`, i - 2);
      if (C.refl && !attract && !C.subj && !C.lead.length) return err(`A sentence doesn’t start with “${want}”. Add who does it (“eu ${want} ${v.e[1][v.f]}”) or write “${ptEncl(v.e[1][v.f], v.f)}”.`, i - 2);
    }
    if (C.subj && C.subj.f !== v.f) return err(`“${v.w}” doesn’t match the subject “${sText}”. Use “${v.encl ? ptEncl(v.e[1][C.subj.f], C.subj.f) : v.e[1][C.subj.f]}”.`, i - 1);
    // estar + -ing: "estou falando" (Brazil) or "estou a falar" (Portugal)
    let V = v;
    if (v.type === 'estar' && ((peek()?.k === 'verb' && peek().ger) || (peek()?.k === 'prep' && peek().w === 'a' && peek(1)?.k === 'verb' && peek(1).inf))) {
      if (peek().k === 'prep') C.progA = T[i++];
      C.v2 = V = T[i++];
      if (V.e[8] || ['ser', 'estar', 'ir', 'ter', 'gostar'].includes(V.type)) return err(`Keep it simple: say “${V.e[1][v.f]}” without estar.`, i - 1);
    } else if (v.type === 'estar' && peek()?.k === 'verb' && peek().inf) return err(`For “is …ing”, Portugal says “estar a” + the to-form (“${v.w} a ${peek().w}”), and Brazil says “${v.w} ${ptGer(peek().e[0])}”.`, i);
    else if (peek()?.k === 'verb' && peek().ger) return err(`The -ing form goes with estar: “${estar(v.f)} ${peek().w}”.`, i);
    if (C.subj?.np && !['ser', 'estar'].includes(V.type)) for (const part of C.subj.np.coord || [C.subj.np]) {
      const c = part.cat, what = part.num === 'p' ? part.n.en : 'a ' + part.n.en;
      if (c !== 'person' && c !== 'animal') return err(`That doesn’t make sense: ${what} can’t ${V.e[5]}. Use a person or an animal here.`, cStart);
      if (c === 'animal' && V.e[7] === 'p') return err(`That doesn’t make sense: ${what} can’t ${V.e[5]}. Only people ${V.e[5]}.`, cStart);
    }
    const afterVerb = () => { while ((peek()?.k === 'adv' && peek().pos.includes('v')) || (peek()?.k === 'int' && peek(1)?.k !== 'adj')) C.tail.push(T[i++]); };
    afterVerb();
    const nx = peek(), sNum = C.subj ? C.subj.num : PT_FORM[v.f][1], sG = C.subj ? C.subj.g : 'x';
    const adjComp = (verbName) => {
      let tres = false; if (peek()?.k === 'int') { tres = true; i++; }
      const a = T[i], m = a.e[ptIdx('m', sNum)], f = a.e[ptIdx('f', sNum)];
      if (verbName === 'estar' && a.e[7] === 'ser') return err(`“${a.e[0]}” says what someone or something is like, so Portuguese uses ser: “${ser(v.f)} ${a.w}”.`, i);
      if (verbName === 'ser' && a.e[7] === 'estar') return err(`“${a.e[0]}” says how someone is right now, so Portuguese uses estar: “${estar(v.f)} ${a.w}”.`, i);
      if (sG === 'x' ? ![m, f].includes(a.w) : a.w !== a.e[ptIdx(sG, sNum)]) return err(`“${a.w}” has to match the subject (${sG === 'x' ? '' : gName(sG) + ' '}${nName(sNum)}): use “${sG === 'f' ? f : m}”${sG === 'x' && f !== m ? ` or “${f}”` : ''}.`, i);
      i++; C.comp = { adj: a, tres }; return null;
    };
    if (V.type === 'ser') {
      if (!nx || nx.k === 'conj') return err(`“${v.w}” needs something after it: a describing word (“${v.w} ${sNum === 'p' ? 'simpáticos' : 'simpático'}”) or who someone is (“${v.w} professor”).`, i - 1);
      if (nx.k === 'adj' || (nx.k === 'int' && peek(1)?.k === 'adj')) { const e = adjComp('ser'); if (e) return e; }
      else if (nx.k === 'noun' && nx.cat === 'feel') return err(`Portuguese says this with ter: “${ter(v.f)} ${nx.w}” (or “${estar(v.f)} com ${nx.w}”).`);
      else if (['det', 'noun'].includes(nx.k)) {
        const np = NP('pred', { bare: true }); if (isErr(np)) return np;
        if (!np.det && !np.poss && np.cat !== 'person') return err(`Add a word like “${ptWant('um', np.g, np.num)}” before “${np.n.w}”.`, i - 1);
        if (np.num !== sNum && !C.subj?.np?.coord) return err(`“${np.n.w}” has to match the subject (${nName(sNum)}).`, i - 1);
        C.comp = { np };
      } else if (nx.k === 'prep' && /^(em|no|na|nos|nas)$/.test(nx.w)) return err(`For where someone or something is, Portuguese uses estar: “${estar(v.f)} ${nx.w} …”.`);
      else return err(`After “${v.w}”, put a describing word (“${v.w} ${sNum === 'p' ? 'grandes' : 'grande'}”) or a noun (“${v.w} professor”).`);
    } else if (V.type === 'estar') {
      if (!nx || nx.k === 'conj') return err(`“${v.w}” needs something after it: how someone is (“${v.w} ${sNum === 'p' ? 'cansados' : 'cansado'}”) or where (“${v.w} em casa”).`, i - 1);
      if (nx.k === 'adj' || (nx.k === 'int' && peek(1)?.k === 'adj')) { const e = adjComp('estar'); if (e) return e; }
      else if (nx.k === 'prep' && nx.w === 'com' && peek(1)?.k === 'noun' && peek(1).cat === 'feel') { i++; C.comp = { feel: T[i++], com: true }; }
      else if (nx.k === 'noun' && nx.cat === 'feel') return err(`Portuguese says “${estar(v.f)} com ${nx.w}” or “${ter(v.f)} ${nx.w}”.`);
      else if (['det', 'noun'].includes(nx.k)) return err(`After “${v.w}”, put how someone is (“${sNum === 'p' ? 'contentes' : 'contente'}”) or where (“na escola”, “em casa”). For who or what something is, use ser.`);
      else if (!(nx.k === 'prep' && /^(em|no|na|nos|nas)$/.test(nx.w)) && !(nx.k === 'adv' && nx.w === 'aqui')) return err(`After “${v.w}”, put how someone is or where (“em casa”, “na cozinha”).`);
    } else if (V.type === 'ter') {
      if (nx?.k === 'noun' && nx.cat === 'feel') { i++; C.comp = { feel: nx }; }
      else if (nx?.k === 'det' && peek(1)?.k === 'noun' && peek(1).cat === 'feel') return err(`No article here: Portuguese says “${v.w} ${peek(1).w}”.`);
      else if (nx && ['det', 'noun', 'adj', 'int'].includes(nx.k)) { const np = NPs('obj'); if (isErr(np)) return np; C.comp = { np }; }
      else return err(`“${v.w}” needs something after it: “${v.w} um gato”, “${v.w} fome”.`, i - 1);
    } else if (V.type === 'ir') {
      if (!nx || nx.k !== 'prep' || !['a', 'ao', 'à', 'aos', 'às', 'para'].includes(nx.w)) return err(nx?.k === 'prep' && /^(em|no|na|nos|nas)$/.test(nx.w) ? `With ir, use “a” or “para” for where you go: “${v.w} à praia”, “${v.w} para a escola”.${VR === 'BR' ? ' (People often say “na praia” when they talk, but “à praia” is the standard.)' : ''}` : `“${v.w}” (go) needs where you go: “${v.w} à praia” or “${v.w} ao parque”.`, nx ? i : i - 1);
      i++; const np = PP(nx, 'dest'); if (isErr(np)) return np;
      if (np.cat !== 'place') return err(`ir needs a place: “${v.w} à praia”. “${np.n.w}” isn’t a place.`, i - 1);
      C.comp = { dest: np, p: nx };
    } else if (V.type === 'gostar') {
      if (nx && ['det', 'noun', 'adj'].includes(nx.k)) { const n2 = T.slice(i, i + 3).find(t => t.k === 'noun'), d0 = nx.k === 'det' && nx.fam === 'o' ? ptContr('de', nx.w) : 'de'; return err(`Portuguese says “gostar de”: “${V.w} ${d0}${n2 ? ' ' + (nx.k === 'det' && nx.fam !== 'o' ? nx.w + ' ' : '') + n2.w : ''}”.`, i); }
      if (!nx || nx.k !== 'prep' || !['de', 'do', 'da', 'dos', 'das'].includes(nx.w)) return err(`“${V.w}” needs “de” and what you like: “${V.w} de café”, “${V.w} do parque”.`, nx ? i : i - 1);
      i++; const np = NPs('obj', nx.w === 'de' ? { bare: false } : { art: PT_CONTR[nx.w][1], p: nx }); if (isErr(np)) return np;
      if (nx.w === 'de') for (const p of np.coord || [np]) if (p.det?.fam === 'o') return err(`Portuguese joins “de” + “${p.det.w}” into “${ptContr('de', p.det.w)}”.`);
      C.comp = { np, p: nx };
    } else if (V.type === 'tr') {
      if (nx?.k === 'prep' && ['a', 'ao', 'à', 'aos', 'às'].includes(nx.w) && ['det', 'noun'].includes(peek(1)?.k)) {
        const n2 = T.slice(i + 1, i + 4).find(t => t.k === 'noun');
        if (n2 && ['person', 'animal'].includes(n2.cat)) return err(`Portuguese doesn’t put “a” before the person or animal you ${V.e[5]}: “${V.w} ${ptWant('o', n2.g, n2.num)} ${n2.w}”.`, i);
      }
      if (nx && ['det', 'noun', 'adj', 'int'].includes(nx.k)) {
        const np = NPs('obj'); if (isErr(np)) return np;
        for (const p of np.coord || [np]) if (V.e[3][0] === 'open' ? !PT_OPENABLE.includes(p.n.e[0]) : V.e[3][0] !== '*' && !V.e[3].includes(p.cat)) return err(`That doesn’t make sense: you can’t ${V.e[5]} ${p.num === 'p' || p.n.mass ? p.n.en : 'a ' + p.n.en}. “${V.e[0]}” goes with ${V.e[3].map(c => PT_KIND[c]).join(', ')}.`);
        C.comp = { np };
      } else if (V.e[4]) return err(`“${V.w}” needs something after it. What do you ${V.e[5]}? For example “${V.w} ${{ food: 'uma maçã', drink: 'água', read: 'um livro', thing: 'uma bola', place: 'a cidade', animal: 'um gato', person: 'a minha amiga', open: 'a porta', '*': 'um livro' }[V.e[3][0]]}”.`, i - 1);
    } else if (nx && ['det', 'noun', 'adj'].includes(nx.k)) return err(`“${V.e[0]}” (to ${V.e[5]}) doesn’t take an object. You can add a place: “${V.w} no parque”, or a person: “${V.w} com a minha amiga”.`);
    afterVerb();
    // em / no / na + a place, com + someone, para + someone or a place
    while (peek()?.k === 'prep') {
      const p = T[i++];
      if (['de', 'do', 'da', 'dos', 'das'].includes(p.w)) return err('“de” joins two nouns: “o livro do menino”. It needs a noun right before it.', i - 1);
      const toward = ['a', 'ao', 'à', 'aos', 'às'].includes(p.w);
      if (V.type === 'ir' && (toward || p.w === 'para') && !(p.w === 'para' && ['det', 'noun'].includes(peek()?.k) && T.slice(i, i + 3).find(t => t.k === 'noun')?.cat === 'person')) return err('Say where you go only once.', i - 1);
      if (toward && V.type !== 'ir') return err(`“${p.w}” is for where you go (with ir). For where something happens, use “em”: “no parque”, “na escola”.`, i - 1);
      const np = PP(p, 'pp'); if (isErr(np)) return np;
      if (/^(em|no|na|nos|nas)$/.test(p.w) && np.cat !== 'place' && !(np.n && PT_RIDE.includes(np.n.e[0]))) return err(`“${p.w}” + a place: “na cozinha”, “no parque”. “${np.n.w}” isn’t a place.`, i - 1);
      C.pps.push({ p, np });
    }
    while ((peek()?.k === 'adv' && /[ez]/.test(peek().pos)) || (peek()?.k === 'int' && peek(1)?.k !== 'adj')) C.tail.push(T[i++]);
    if (V.type === 'estar' && !C.v2 && !C.comp && !C.pps.length && !C.tail.some(a => a.w === 'aqui')) return err(`“${v.w}” needs something after it: how someone is (“contente”) or where (“em casa”).`, i - 1);
    return C;
  }
  const P = { clauses: [], conjs: [] };
  for (;;) {
    const c = clause(); if (isErr(c)) return c; P.clauses.push(c);
    if (peek()?.k === 'conj') { const cj = T[i++]; if (!peek()) return err(`“${cj.w}” joins two parts, so something has to come after it.`, i - 1); P.conjs.push(cj); continue; }
    break;
  }
  if (i < T.length) {
    const x = T[i];
    return err(x.k === 'adj' ? `“${x.w}” needs to go next to the noun it describes.` : x.k === 'det' ? `“${x.w}” needs its noun right after it, in the right place.` : x.k === 'verb' ? 'One verb per sentence part. Use “e” or “mas” to add another.'
      : x.k === 'pron' ? 'The subject (who does it) goes at the start. To add another sentence, use “e” first.' : x.k === 'neg' ? `“${x.w}” goes right before the verb.` : x.k === 'refl' ? `“${x.w}” goes right next to the verb.`
      : x.k === 'adv' || x.k === 'int' ? `“${x.w}” goes ${ptWhere(x)}.` : x.k === 'prep' ? `“${x.w}” needs a noun after it, in the right place.` : `“${x.w}” doesn’t fit here.`);
  }
  return { ok: true, P };
}

/* English meaning of a correct Portuguese sentence */
function ptEnglish(P) {
  const an = w => /^[aeiou]/i.test(w) ? 'an' : 'a';
  const npEn = np => {
    if (np.coord) return np.coord.map(npEn).join(np.conj?.w === 'ou' ? ' or ' : ' and ');
    if (np.home) return 'home';
    const a = np.pre || np.post, adj = a ? (np.tres ? 'very ' : '') + a.e[4] + ' ' : '', noun = np.n.en;
    let art = '';
    if (np.poss) art = np.poss.en + ' ';
    else if (np.det) art = np.det.fam === 'o' ? 'the ' : np.det.fam === 'um' ? (np.num === 'p' ? 'some ' : an(adj || noun) + ' ') : np.det.en + ' ';
    else if (np.art) art = 'the ';
    const base = art + adj + noun;
    if (np.of) { const o = np.of; return ['person', 'animal'].includes(o.n.cat) && (o.det || o.poss || o.art) ? `${npEn(o)}'s ${adj}${noun}` : `${base} of ${npEn(o)}`; }
    return base;
  };
  const one = C => {
    const v = C.verb, V = C.v2 || v, f = v.f, youS = C.subj?.pron?.you;
    const subj = C.subj ? (C.subj.pron ? C.subj.pron.en : npEn(C.subj.np)) : ['I', 'you', 'he/she', 'we', 'they'][f];
    const third = !youS && (f === 2 || (C.subj?.np && C.subj.num === 's')), never = C.neg?.w === 'nunca';
    const be = f === 0 ? 'am' : third ? 'is' : 'are';
    const all = [...C.pre, ...C.tail], freq = all.filter(a => ['sempre', 'muitas vezes'].includes(a.w)).map(a => a.en).join(' ');
    const endAdv = C.tail.filter(a => ['bem', 'muito', 'aqui'].includes(a.w) || (a.k === 'int')).map(a => a.k === 'int' ? 'a lot' : a.en), too = [...C.lead, ...all].some(a => a.w === 'também');
    let vp;
    if (C.v2) {
      vp = `${be}${never ? ' never' : C.neg ? ' not' : ''}${freq ? ' ' + freq : ''} ${ptIng(V.e[5])}`;
      if (C.comp?.np) vp += ' ' + npEn(C.comp.np);
    } else if (v.type === 'ser' || v.type === 'estar' || C.comp?.feel) {
      const what = C.comp?.adj ? (C.comp.tres ? 'very ' : '') + C.comp.adj.e[4] : C.comp?.feel ? C.comp.feel.e[4] : C.comp?.np ? npEn(C.comp.np.det || C.comp.np.poss ? C.comp.np : { ...C.comp.np, det: { fam: 'um' } }) : '';
      vp = `${be}${never ? ' never' : C.neg ? ' not' : ''}${freq ? ' ' + freq : ''} ${what}`;
    } else {
      const base = v.e[5], s3 = v.e[6];
      vp = never ? `never ${third ? s3 : base}` : C.neg ? `${third ? 'does' : 'do'} not${freq ? ' ' + freq : ''} ${base}` : `${freq ? freq + ' ' : ''}${third ? s3 : base}`;
      if (C.comp?.np) vp += ' ' + npEn(C.comp.np);
      if (C.comp?.dest) vp += (C.comp.dest.home ? ' ' : ' to ') + npEn(C.comp.dest);
    }
    if (endAdv.length) vp += ' ' + endAdv.join(' ');
    for (const { p, np } of C.pps) vp += np.home ? (p.w === 'para' ? ' home' : ' at home') : ` ${/^(no|na|nos|nas|em)$/.test(p.w) ? (np.n && PT_RIDE.includes(np.n.e[0]) ? 'on' : np.cat === 'place' && ['praia', 'escola', 'igreja', 'mercado'].includes(np.n.e[0]) ? 'at' : 'in') : p.w === 'com' ? 'with' : p.w === 'para' ? 'for' : 'to'} ${npEn(np)}`;
    const tail = [...C.lead.filter(a => !['sempre', 'muitas vezes', 'também'].includes(a.w)).map(a => a.en), ...C.tail.filter(a => ['hoje', 'amanhã', 'agora'].includes(a.w)).map(a => a.en), too ? 'too' : ''].filter(Boolean).join(' ');
    const lf = C.lead.filter(a => a.w === 'sempre' || a.w === 'muitas vezes').map(a => a.en).join(' ');
    if (lf && !freq) vp = C.v2 || v.type === 'ser' || v.type === 'estar' || C.comp?.feel ? vp.replace(/^(am|is|are)/, `$1 ${lf}`) : `${lf} ${vp}`;
    return `${subj} ${vp}${tail ? ' ' + tail : ''}`.replace(/\s+/g, ' ').trim();
  };
  let s = one(P.clauses[0]);
  P.conjs.forEach((c, k) => { s += (c.w === 'e' ? ', and ' : c.w === 'mas' ? ', but ' : ', or ') + one(P.clauses[k + 1]); });
  return s[0].toUpperCase() + s.slice(1) + '.';
}

/* ---------------- making a Portuguese tray ---------------- */
function ptGenerate(pref) {
  const VR = ptVar();
  const R = a => a[Math.floor(Math.random() * a.length)], coin = p => Math.random() < p;
  const RP = list => { const fav = list.filter(x => pref.has(x[0]) || (typeof x[1] === 'string' && pref.has(x[1])) || (x[7] && pref.has(x[7][0]))); return fav.length && coin(0.6) ? R(fav) : R(list); };
  const nounOf = cats => RP(PT_NOUN.filter(n => n[3] !== 'feel' && n[0] !== 'café da manhã' && (cats[0] === '*' || cats.includes(n[3]) || (cats[0] === 'open' && PT_OPENABLE.includes(n[0])))));
  const CAT = { person: 'p', animal: 'a', food: 'f', drink: 'f', thing: 't', place: 'l', read: 'r' };
  const adjFor = (cat, wth) => RP(PT_ADJ.filter(a => (!cat || a[5].includes(CAT[cat] || 'p')) && (!wth || a[7] === wth || a[7] === 'both')));
  const extra = [];
  const other = list => { const x = list.filter(Boolean); return x.length ? R(x) : null; };
  const flip = (g, num) => [g === 'm' ? 'f' : 'm', num === 's' ? 'p' : 's'];
  // a noun phrase with a determiner that fits (and a look-alike as a distractor). opts.art: the article is already in a contraction
  const np = (n, num, out, opts = {}) => {
    const g = n[2], mass = n[6] === 1;
    let fam;
    if (opts.art) fam = coin(0.35) ? R(PT_POSS) : null;
    else if (opts.bare && (mass || num === 'p') && coin(0.5)) fam = null;
    else if (num === 'p') fam = R(['o', 'o', 'um', 'meu', 'seu', 'nosso', 'este', 'esse', 'dois', 'tres']);
    else if (mass) fam = R(['o', 'o', 'meu', 'este']);
    else fam = R(['o', 'o', 'um', 'um', 'meu', 'teu', 'seu', 'nosso', 'este', 'esse', 'aquele']);
    if (opts.subj && !fam) fam = 'o';
    const poss = PT_POSS.includes(fam);
    const a = opts.adj !== false && coin(0.35) ? adjFor(n[3]) : null, pre = a && a[6] === 'pre' && coin(0.6), tres = a && !pre && coin(0.2);
    if (poss && !opts.art && (VR === 'PT' || coin(0.3))) out.push(ptDetW(ptWant('o', g, num)));
    if (fam) { const d = ptWant(fam, g, num); out.push(ptDetW(d)); const wrong = other(PT_DETF[fam].filter(x => x && x !== d)); if (wrong) extra.push(ptDetW(wrong)); }
    if (pre) out.push(ptAdj(a, a[ptIdx(g, num)]));
    out.push(ptNoun(n, num));
    if (a && !pre) { if (tres) out.push(ptMuito()); out.push(ptAdj(a, a[ptIdx(g, num)])); }
    if (a) { const [g2, n2] = flip(g, num), w = a[ptIdx(g2, n2)]; extra.push(ptAdj(a, w)); }
    if (opts.of && !poss && n[3] !== 'person' && coin(0.25)) { const o = nounOf(['person']), c = ptContr('de', ptWant('o', o[2], 's')); out.push(ptPrep(c)); np(o, 's', out, { art: true, adj: false }); extra.push(ptPrep('de')); }
  };
  const inPlace = (out, n) => { if (n[0] === 'casa' && coin(0.35)) { out.push(ptPrep('em'), ptNoun(n, 's')); return; } out.push(ptPrep(ptContr('em', ptWant('o', n[2], 's')))); np(n, 's', out, { art: true, adj: false }); extra.push(ptPrep('em'), ptDetW(ptWant('o', n[2], 's'))); };
  const toPlace = (out, n) => {
    if (n[0] === 'casa' && coin(0.4)) { out.push(ptPrep('para'), ptNoun(n, 's')); extra.push(ptPrep('em')); return; }
    if (coin(0.35)) { out.push(ptPrep('para')); np(n, 's', out, { adj: false, subj: true }); }
    else { out.push(ptPrep(ptContr('a', ptWant('o', n[2], 's')))); np(n, 's', out, { art: true, adj: false }); }
    extra.push(ptPrep(ptContr('em', ptWant('o', n[2], 's'))));
  };
  const pick = name => PT_VERB.find(v => v[0] === name);
  const pronList = VR === 'PT' ? ['eu', 'eu', 'tu', 'tu', 'ele', 'ela', 'nós', 'eles', 'elas', 'vocês', 'você'] : ['eu', 'eu', 'você', 'você', 'ele', 'ela', 'nós', 'eles', 'elas', 'vocês'];
  const clause = () => {
    const out = [], kind = R(['tr', 'tr', 'tr', 'in', 'ser', 'estar', 'ter', 'ir', 'refl', 'gostar', 'prog']);
    const verb = kind === 'ser' || kind === 'estar' || kind === 'ter' || kind === 'ir' || kind === 'gostar' ? pick(kind)
      : kind === 'refl' ? RP(PT_VERB.filter(v => v[8])) : kind === 'prog' ? RP(PT_VERB.filter(v => /^(comer|beber|fazer|ler|escrever|comprar|procurar|falar|trabalhar|estudar|brincar|correr|andar|dormir)$/.test(v[0])))
      : RP(PT_VERB.filter(v => v[2] === kind && !v[8] && !(VR === 'BR' ? v[0] === 'viver' : v[0] === 'morar')));
    const subjKinds = verb[7] === 'p' ? ['person'] : ['person', 'animal'];
    let f, g = 'x', subjCat = 'person', dropped = false;
    const ptype = kind === 'prog' ? verb[2] : kind;
    if (coin(0.5)) {
      const p = ptPronW(R(pronList)); f = p.f; g = p.g;
      if (['eu', 'nós', 'tu'].includes(p.w) && coin(VR === 'PT' ? 0.3 : 0.12) && kind !== 'ser') dropped = true; else { out.push(p); extra.push(ptPronW(R(PT_PRON.filter(x => x[1] !== f && (VR === 'PT' || x[0] !== 'tu')))[0])); }
    } else {
      const n = nounOf(subjKinds); g = n[2]; subjCat = n[3]; const num = n[1] && coin(0.3) ? 'p' : 's';
      np(n, num, out, { subj: true, of: true }); f = num === 'p' ? 4 : 2;
      if (coin(0.12)) { const n2 = nounOf(subjKinds); out.push(ptConj('e')); np(n2, 's', out, { subj: true, adj: false }); f = 4; g = g === 'm' || n2[2] === 'm' ? 'm' : 'f'; }
    }
    const neg = coin(0.22) ? (kind === 'ser' || kind === 'estar' ? 'não' : R(['não', 'não', 'nunca'])) : null;
    const preAdv = !neg && coin(0.12) && !dropped && kind !== 'ser' ? R(['sempre', 'também']) : null;
    if (preAdv) out.push(ptAdv(preAdv));
    if (neg) { out.push(ptNeg(neg)); extra.push(ptNeg(neg === 'não' ? 'nunca' : 'não')); }
    if (kind === 'refl') {
      const attract = neg || preAdv, want = PT_REFL[f];
      if (dropped && !attract && VR === 'BR') { out.unshift(ptPronW(f === 0 ? 'eu' : f === 3 ? 'nós' : 'tu')); dropped = false; }
      if (!attract && VR === 'PT') { out.push(ptVerbEncl(verb, f)); extra.push(ptRefl(want), ptVerb(verb, f)); }
      else { out.push(ptRefl(want), ptVerb(verb, f)); extra.push(ptRefl(R(PT_REFL.filter(x => x !== want))), ptVerbEncl(verb, f)); }
    } else if (kind === 'prog') {
      out.push(ptVerb(pick('estar'), f));
      if (VR === 'PT') { out.push(ptPrep('a'), ptInfC(verb)); extra.push(ptGerC(verb)); } else { out.push(ptGerC(verb)); extra.push(ptInfC(verb)); }
    } else { out.push(ptVerb(verb, f)); extra.push(ptVerb(verb, (f + 1 + Math.floor(Math.random() * 4)) % 5)); }
    if (kind === 'ser') {
      const num = PT_FORM[f][1], gg = g === 'x' ? R(['m', 'f']) : g;
      if (subjCat === 'person' && coin(0.25)) { const prof = R(PT_NOUN.filter(n => ['professor', 'professora', 'médico', 'amigo', 'amiga'].includes(n[0]) && n[2] === gg)); if (prof && (num === 's' || prof[1])) { if (num === 's' && (coin(0.4) || prof[0].startsWith('amig'))) out.push(ptDetW(ptWant('um', gg, num))); out.push(ptNoun(prof, num)); extra.push(ptVerb(pick('estar'), f)); } else return null; }
      else { if (coin(0.25)) out.push(ptMuito()); const a = adjFor(subjCat, 'ser'); out.push(ptAdj(a, a[ptIdx(gg, num)])); extra.push(ptAdj(a, a[ptIdx(...flip(gg, num))]), ptVerb(pick('estar'), f)); }
    } else if (kind === 'estar') {
      const num = PT_FORM[f][1], gg = g === 'x' ? R(['m', 'f']) : g, r = Math.random();
      if (r < 0.45) { if (coin(0.25)) out.push(ptMuito()); const a = adjFor(subjCat, 'estar'); out.push(ptAdj(a, a[ptIdx(gg, num)])); extra.push(ptAdj(a, a[ptIdx(...flip(gg, num))]), ptVerb(pick('ser'), f)); }
      else if (r < 0.6 && subjCat === 'person') { out.push(ptPrep('com'), ptNoun(R(PT_NOUN.filter(n => n[3] === 'feel')), 's')); extra.push(ptVerb(pick('ter'), f)); }
      else { inPlace(out, nounOf(['place'])); extra.push(ptVerb(pick('ser'), f)); }
    } else if (kind === 'ter') {
      if (coin(0.35) && subjCat === 'person') { out.push(ptNoun(R(PT_NOUN.filter(n => n[3] === 'feel')), 's')); extra.push(ptPrep('com'), ptDetW('a')); }
      else { const n = nounOf(['thing', 'animal', 'read', 'food', 'drink']), on = n[1] && coin(0.3) ? 'p' : 's'; np(n, on, out, { of: true, bare: true }); }
    } else if (kind === 'ir') {
      toPlace(out, nounOf(['place']));
      if (coin(0.3)) { out.push(ptPrep('com')); np(nounOf(['person']), 's', out, { adj: false }); }
    } else if (kind === 'gostar') {
      const n = nounOf(['*']), on = n[1] && coin(0.4) ? 'p' : 's';
      if ((n[6] === 1 || on === 'p') && coin(0.5)) { out.push(ptPrep('de'), ptNoun(n, on)); }
      else { out.push(ptPrep(ptContr('de', ptWant('o', n[2], on)))); np(n, on, out, { art: true }); }
      extra.push(ptDetW(ptWant('o', n[2], on)));
    } else if (ptype === 'tr') {
      const n = nounOf(verb[3]), on = n[1] && coin(0.3) ? 'p' : 's';
      np(n, on, out, { of: kind !== 'prog', bare: true });
      if (['person', 'animal'].includes(n[3])) extra.push(ptPrep('a'));
      if (coin(0.2)) { out.push(ptPrep(R(['com', 'para']))); np(nounOf(['person']), 's', out, { adj: false }); }
      else if (coin(0.15)) inPlace(out, nounOf(['place']));
      extra.push(ptNoun(nounOf(['*']), 's'));
    } else {
      const r = Math.random();
      if (r < 0.4) inPlace(out, nounOf(['place']));
      else if (r < 0.65) { out.push(ptPrep('com')); np(nounOf(['person', 'animal']), 's', out, { adj: false }); }
    }
    if (coin(0.2) && !['ser', 'estar', 'ir'].includes(kind) && PT_HOW_VERBS.test(verb[0]) && ptype === 'in' && out[out.length - 1]?.k === 'verb') out.push(coin(0.5) ? ptAdv('bem') : ptMuito());
    if (coin(0.22)) { const a = R(PT_ADV.filter(x => /[ez]/.test(x[2]) && x[0] !== 'bem' && !(x[0] === 'também' && preAdv) && !(x[0] === 'aqui' && out.some(c => c?.k === 'prep')))); if (/e/.test(a[2]) && coin(0.4)) out.unshift(ptAdv(a[0])); else out.push(ptAdv(a[0])); }
    return out;
  };
  for (let tries = 0; tries < 150; tries++) {
    extra.length = 0;
    let words = clause(); if (!words) continue;
    if (Math.random() < 0.25) { const c2 = clause(); if (c2) words = [...words, ptConj(R(['e', 'e', 'mas', 'ou'])), ...c2]; }
    if (words.length > 14 || words.length < 3) continue;
    const res = ptCheck(words); if (!res.ok) continue;
    extra.push(ptPronW(R(VR === 'PT' ? ['eu', 'tu', 'ele', 'ela', 'nós', 'eles'] : ['eu', 'você', 'ele', 'ela', 'nós', 'eles'])), ptPrep(R(['em', 'com', 'de', 'para'])));
    if (!words.some(w => w.k === 'conj')) extra.push(ptConj(R(['e', 'mas'])));
    if (!words.some(w => w.k === 'neg')) extra.push(ptNeg('não'));
    const seen = new Set(words.map(w => w.k + w.w)), uniq = [];
    for (const x of extra.sort(() => Math.random() - 0.5)) if (x && !seen.has(x.k + x.w)) { seen.add(x.k + x.w); uniq.push(x); }
    return { words, extra: uniq.slice(0, Math.max(4, 16 - words.length)), english: ptEnglish(res.P) };
  }
  return null;
}

BLD_LANGS.pt = { name: 'Portuguese', check: ptCheck, gen: ptGenerate, get voice() { return ptVar() === 'PT' ? 'pt-PT' : 'pt-BR'; }, english: ptEnglish };
BLD_ORDER.pt = { rows: [
    ['A basic sentence', [['det', 'determiner'], ['noun', 'noun'], ['adj', '(adjective)'], ['verb', 'verb'], ['det', '(determiner)'], ['noun', 'noun'], ['adj', '(adjective)']]],
    ['Starting with a pronoun', [['pron', '(pronoun)'], ['verb', 'verb'], ['det', 'determiner'], ['noun', 'noun']]],
    ['My, your, our…', [['det', '(o / a)'], ['det', 'meu / minha…'], ['noun', 'noun'], ['verb', 'verb']]],
    ['Saying what something is like (ser / estar)', [['det', 'determiner'], ['noun', 'noun'], ['verb', 'ser / estar'], ['adv', '(muito)'], ['adj', 'adjective']]],
    ['A negative sentence', [['pron', 'pronoun'], ['adv', 'não'], ['verb', 'verb'], ['det', 'determiner'], ['noun', 'noun']]],
    ['A verb like levantar-se', [['pron', 'pronoun'], ['pron', 'me / te / se (Brazil)'], ['verb', 'verb'], ['pron', '-me / -te / -se (Portugal)']]],
    ['Doing it right now', [['pron', 'pronoun'], ['verb', 'estar'], ['prep', '(a) (Portugal)'], ['verb', '-ndo (Brazil) / to-form (Portugal)']]],
    ['Going somewhere', [['pron', 'pronoun'], ['verb', 'ir'], ['prep', 'a / ao / à / para'], ['det', '(determiner)'], ['noun', 'place']]],
    ['Joining two sentences', [['verb', 'sentence'], ['conj', 'conjunction'], ['verb', 'sentence']]],
  ], tips: [
    ['pron', 'You can leave out eu, tu and nós: the verb already shows who. Brazil uses <b>você</b> for “you”; Portugal mostly uses <b>tu</b>.'],
    ['adj', 'Most adjectives come <b>after</b> the noun: <b>uma casa grande</b>. <b>bom</b> and <b>mau</b> can go before it: <b>um bom livro</b>.'],
    ['det', 'Possessives match the thing you have: <b>a minha casa</b>, <b>os meus livros</b>. Portugal always puts <b>o / a</b> first; in Brazil it’s up to you.'],
    ['prep', '<b>de + o = do</b>, <b>em + a = na</b>, <b>a + a = à</b>, <b>a + o = ao</b>. Go somewhere with <b>a</b> or <b>para</b>; be somewhere with <b>em</b>.'],
    ['verb', '<b>ser</b>: what something is like (é grande). <b>estar</b>: how it is right now, and where (está cansado, está em casa).'],
    ['adv', '<b>não</b> and <b>nunca</b> go right before the verb. <b>muito</b> before an adjective means “very”; after the verb it means “a lot”.'],
    ['pron', 'me / te / se: <b>eu me levanto</b> (Brazil), <b>eu levanto-me</b> (Portugal). After não, both say <b>não me levanto</b>.'],
    ['noun', 'Feelings use ter: <b>tenho fome</b>, <b>tenho sede</b>, <b>tenho frio</b> (or <b>estou com fome</b>).'] ] };

/* ---------------- Your own Portuguese words (📚 Add my deck's words) ---------------- */
// Present tense of common irregular verbs: eu, tu, ele/ela/você, nós, eles/elas/vocês
const PT_IRREG_FORMS = {
  ser: 'sou és é somos são', estar: 'estou estás está estamos estão', ter: 'tenho tens tem temos têm', ir: 'vou vais vai vamos vão', haver: 'hei hás há havemos hão',
  fazer: 'faço fazes faz fazemos fazem', dizer: 'digo dizes diz dizemos dizem', trazer: 'trago trazes traz trazemos trazem', poder: 'posso podes pode podemos podem',
  querer: 'quero queres quer queremos querem', saber: 'sei sabes sabe sabemos sabem', caber: 'caibo cabes cabe cabemos cabem', ver: 'vejo vês vê vemos veem',
  vir: 'venho vens vem vimos vêm', dar: 'dou dás dá damos dão', ler: 'leio lês lê lemos leem', crer: 'creio crês crê cremos creem', pôr: 'ponho pões põe pomos põem',
  ouvir: 'ouço ouves ouve ouvimos ouvem', pedir: 'peço pedes pede pedimos pedem', medir: 'meço medes mede medimos medem', perder: 'perco perdes perde perdemos perdem',
  valer: 'valho vales vale valemos valem', dormir: 'durmo dormes dorme dormimos dormem', cobrir: 'cubro cobres cobre cobrimos cobrem', descobrir: 'descubro descobres descobre descobrimos descobrem',
  subir: 'subo sobes sobe subimos sobem', fugir: 'fujo foges foge fugimos fogem', sair: 'saio sais sai saímos saem', cair: 'caio cais cai caímos caem', rir: 'rio ris ri rimos riem',
  sentir: 'sinto sentes sente sentimos sentem', mentir: 'minto mentes mente mentimos mentem', preferir: 'prefiro preferes prefere preferimos preferem', vestir: 'visto vestes veste vestimos vestem',
  seguir: 'sigo segues segue seguimos seguem', servir: 'sirvo serves serve servimos servem', repetir: 'repito repetes repete repetimos repetem', divertir: 'divirto divertes diverte divertimos divertem',
  construir: 'construo constróis constrói construímos constroem', destruir: 'destruo destróis destrói destruímos destroem', odiar: 'odeio odeias odeia odiamos odeiam',
};
// eu, tu, ele, nós, eles: the table first, then the regular patterns (-ar, -er, -ir), with the spelling changes (conheço, protejo, sigo)
function ptConjugate(inf) {
  inf = ptInfOf(String(inf).trim());
  if (PT_IRREG_FORMS[inf]) return PT_IRREG_FORMS[inf].split(' ');
  const st = inf.slice(0, -2), e = inf.slice(-2);
  if (e === 'ar') { if (/ear$/.test(inf)) { const b = inf.slice(0, -3); return [b + 'eio', b + 'eias', b + 'eia', b + 'eamos', b + 'eiam']; } return [st + 'o', st + 'as', st + 'a', st + 'amos', st + 'am']; }
  const eu = /c$/.test(st) ? st.slice(0, -1) + 'ço' : /g$/.test(st) ? st.slice(0, -1) + 'jo' : /gu$/.test(st) ? st.slice(0, -1) + 'o' : st + 'o';
  if (e === 'er') return [eu, st + 'es', st + 'e', st + 'emos', st + 'em'];
  if (e === 'ir') return [eu, st + 'es', st + 'e', st + 'imos', st + 'em'];
  return [inf, inf, inf, inf, inf];
}
const PT_PL_EX = { 'mão': 'mãos', 'irmão': 'irmãos', 'cidadão': 'cidadãos', 'pão': 'pães', 'cão': 'cães', 'alemão': 'alemães', 'capitão': 'capitães', 'mês': 'meses', 'país': 'países', 'gás': 'gases' };
const ptPl = w => PT_PL_EX[w] || (/ão$/.test(w) ? w.slice(0, -2) + 'ões' : /m$/.test(w) ? w.slice(0, -1) + 'ns' : /al$/.test(w) ? w.slice(0, -1) + 'is' : /el$/.test(w) ? w.slice(0, -2) + 'éis' : /ol$/.test(w) ? w.slice(0, -2) + 'óis'
  : /ul$/.test(w) ? w.slice(0, -1) + 'is' : /il$/.test(w) ? (/[áéíóúâêô]/.test(w.slice(0, -2)) ? w.slice(0, -2) + 'eis' : w.slice(0, -1) + 's') : /[rz]$/.test(w) ? w + 'es' : /s$/.test(w) ? (/ês$/.test(w) ? w.slice(0, -2) + 'eses' : w) : w + 's');
const ptGenderGuess = w => /(ema|ama|dia|mapa|planeta|sofá)$/.test(w) ? 'm' : /(a|ção|são|dade|gem|ice|ez|ã)$/.test(w) ? 'f' : 'm';
function ptAdjForms(w) {
  const f = /o$/.test(w) ? w.slice(0, -1) + 'a' : /ês$/.test(w) ? w.slice(0, -2) + 'esa' : /or$/.test(w) && !/(maior|menor|melhor|pior|anterior|posterior|superior|inferior|interior|exterior)$/.test(w) ? w + 'a' : /ão$/.test(w) ? w.slice(0, -2) + 'ã' : w;
  return [w, f, ptPl(w).replace(/^(.*)ês$/, '$1eses'), /a$/.test(f) && f !== w ? f + 's' : ptPl(w)];
}
const PT_BASE = { n: PT_NOUN.length, a: PT_ADJ.length, v: PT_VERB.length };
const ptKnown = w => PT_NOUN.slice(0, PT_BASE.n).some(n => n[0] === w || n[1] === w || (n[7] && n[7].includes(w))) || PT_VERB.slice(0, PT_BASE.v).some(v => v[0] === w || ptInfOf(v[0]) === ptInfOf(w) || v[1].includes(w))
  || PT_ADJ.slice(0, PT_BASE.a).some(a => a.slice(0, 4).includes(w)) || [PT_PRON, PT_DET, PT_PREP, PT_CONJ, PT_ADV].some(L => L.some(x => x[0] === w)) || ['não', 'nunca', 'muito'].includes(w);
function ptApplyMine() {
  PT_NOUN.length = PT_BASE.n; PT_ADJ.length = PT_BASE.a; PT_VERB.length = PT_BASE.v;
  for (const m of (typeof S !== 'undefined' && S.bldWords) || []) {
    if (!m || m.lang !== 'pt' || !m.w || !m.en || ptKnown(m.w)) continue;
    if (m.k === 'noun') PT_NOUN.push([m.w, m.pl || null, m.g === 'f' ? 'f' : 'm', m.cat || 'thing', m.en, m.pl ? (m.enPl || bldPlEn(m.en)) : null]);
    if (m.k === 'verb' && Array.isArray(m.forms) && m.forms.length === 5) {
      const refl = /-se$/.test(m.w) ? 1 : 0, type = m.obj === 'in' || refl ? 'in' : 'tr', objs = m.obj === 'trp' ? ['person', 'animal'] : ['thing', 'food', 'drink', 'read', 'place'];
      PT_VERB.push([m.w, m.forms, type, objs, 0, m.en, bld3sEn(m.en), m.who === 'a' ? 'a' : 'p', refl]);
    }
    if (m.k === 'adj') PT_ADJ.push([...ptAdjForms(m.w), m.en, 'patflr', 'post', 'both']);
  }
}
{ const prev = bldApplyMine; bldApplyMine = function () { prev(); ptApplyMine(); }; }
BLD_MINE.pt = { name: 'Portuguese', forms: 'eu, tu, ele/ela/você, nós, eles/elas/vocês', nForms: 5, m: 'o (masculine)', f: 'a (feminine)', conj: w => ptConjugate(w), pl: w => ptPl(w), adj: w => ptAdjForms(w),
  known: w => ptKnown(w), gender: w => ptGenderGuess(w), isVerb: w => /(ar|er|ir|ôr|or)(-se)?$/.test(w) && w.length > 3, refl: w => /-se$/.test(w),
  parse: s => { const m = s.match(/^(o|a|um|uma)\s+(\p{L}[\p{L}-]*)$/u); if (m) return { w: m[2], g: /^(a|uma)$/.test(m[1]) ? 'f' : 'm', art: true };
    const r = s.match(/^(\p{L}+(?:ar|er|ir|ôr))-se$/u); if (r) return { w: s };
    return /^\p{L}[\p{L}-]*$/u.test(s) ? { w: s } : null; },
  intro: 'words with <i>o/a</i> are nouns, and words like <i>“to …”</i> are verbs). Verb forms are filled in for you, including common irregular verbs (sou, tenho, vou, faço…); check any that look wrong. Verbs ending in “-se” (lavar-se) work too: the game adds “me / te / se / nos” for them.' };
