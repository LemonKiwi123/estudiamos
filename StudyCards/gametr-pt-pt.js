'use strict';
/* ================= Game text in European Portuguese =================
   Made from the Brazilian book (gametr-pt.js) when the app starts: the same lines with the words and forms Portugal uses.
   1. phrases that change (the little words me / te / se move after the verb: "se levanta" → "levanta-se"),
   2. words that change (Salvar → Guardar, tela → ecrã, Crônica → Crónica…),
   3. "estar + -ndo" becomes "estar a + the to-form" (está esperando → está à espera, estou copiando → estou a copiar).
   A deck in pt-PT gets this book; the 🌐 Game language menu offers both. Loaded after gametr-pt.js. */
const GT_PT_PHRASES = [
  ['uma tela clássica', 'um ecrã clássico'], ['lançadas dizendo', 'lançadas ao dizer'], ['Aprendi a atirar derrubando', 'Aprendi a atirar ao deitar abaixo'], ['da tela', 'do ecrã'], ['a tela toda', 'o ecrã todo'], ['uma tela', 'um ecrã'], ['do console', 'da consola'],
  ['Os livros me prenderam', 'Os livros prenderam-me'], ['Eu… eu me lembro', 'Eu… eu lembro-me'], ['Os sinos se lembram', 'Os sinos lembram-se'], ['O rio se lembra', 'O rio lembra-se'],
  ['os rios se lembram', 'os rios lembram-se'], ['os sinos se lembram', 'os sinos lembram-se'], ['as pessoas se lembram', 'as pessoas lembram-se'],
  ['feita de tinta se levanta', 'feita de tinta levanta-se'], ['um livro se fecha devagar', 'um livro fecha-se devagar'], ['algo enorme se desenrola', 'algo enorme desenrola-se'],
  ['não podem me deter', 'não me podem deter'], ['estão se escrevendo outra vez', 'estão a escrever-se outra vez'], ['de {p} se levantam do chão', 'de {p} levantam-se do chão'],
  ['Quem reza lá se sente melhor', 'Quem reza lá sente-se melhor'], ['não consegue se mexer', 'não se consegue mexer'], ['Os seus Wordlings se sentem melhor', 'Os seus Wordlings sentem-se melhor'],
  ['em branco se levanta dele', 'em branco levanta-se dele'], ['palavra de fumaça se afasta', 'palavra de fumo afasta-se'], ['dois olhos frios se abrem', 'dois olhos frios abrem-se'],
  ['como árvores se levantam', 'como árvores levantam-se'], ['lama e algas se levanta', 'lama e algas levanta-se'], ['Com um som de livro se abrindo, o portão do Castelo Inescrito se abre', 'Com um som de livro a abrir-se, o portão do Castelo Inescrito abre-se'],
  ['A chama dela se apaga', 'A chama dela apaga-se'], ['da sala do trono se abrem', 'da sala do trono abrem-se'], ['Um papagaio me ensinou', 'Um papagaio ensinou-me'],
  ['Uma Serpe do Cânion se empoleira', 'Uma Serpe do Desfiladeiro empoleira-se'], ['A porta da cela se fecha', 'A porta da cela fecha-se'], ['A porta da cela se abre', 'A porta da cela abre-se'],
  ['Os companheiros se acomodam', 'Os companheiros acomodam-se'], ['A minha avó me ensinou', 'A minha avó ensinou-me'], ['Ela me ensinou a voar', 'Ela ensinou-me a voar'],
  ['a porta vai se lembrar', 'a porta vai lembrar-se'], ['Dois olhos enormes se abrem', 'Dois olhos enormes abrem-se'], ['Os livros me ensinaram', 'Os livros ensinaram-me'],
  ['Um cavaleiro sombrio sem nome o guarda', 'Um cavaleiro sombrio sem nome guarda-o'], ['A Asapalavra desce num voo rasante', 'A Asapalavra desce em voo rasante'],
  ['Pode continuar explorando, lutando e estudando', 'Pode continuar a explorar, a lutar e a estudar'], ['fumaça venenosa', 'fumo venenoso'], ['Fumaça que cega', 'Fumo que cega'],
  ['Nada de patinete dentro de casa!', 'Nada de trotinetes dentro de casa!'], ['Uma barraca aconchegante', 'Uma tenda acolhedora'], ['Monta as barracas', 'Monta as tendas'],
  ['🐾 Equipe', '🐾 Equipa'], ['da equipe', 'da equipa'], ['A equipe', 'A equipa'], ['O seu grou de papel', 'O seu grou de papel'], ['Volta correndo', 'Volta a correr'],
  ['Era para eu estar tirando o pó', 'Devia estar a limpar o pó'], ['Peguei um sapo do tamanho da minha cabeça! Depois foi ele que me pegou.', 'Apanhei um sapo do tamanho da minha cabeça! Depois foi ele que me apanhou.'],
  ['Eu só peguei um pão emprestado', 'Eu só pedi um pão emprestado'], ['Depois peguei a minha pena', 'Depois peguei na minha pena'], ['Ouvi dizer que a comida da cadeia', 'Ouvi dizer que a comida da prisão'],
  ['Em algum lugar', 'Algures'], ['bagunçadas', 'desarrumadas'], ['fofocas', 'mexericos'], ['machuca', 'magoa'], ['Sério. Não cave.', 'A sério. Não cave.'],
  ['na fila', 'na fila'], ['Cuide-se lá fora!', 'Tenha cuidado lá fora!'], ['Ande até o cais', 'Ande até ao cais'], ['Navegue com o {p} até o santuário', 'Navegue com o {p} até ao santuário'],
  ['vai até a selva', 'vai até à selva'], ['até o coração da selva', 'até ao coração da selva'], ['quase seguro', 'quase seguro'], ['Gritei o meu nome quarenta vezes', 'Gritei o meu nome quarenta vezes'],
];
//            Brazil → Portugal (whole words; the first letter's case is kept)
const GT_PT_WORDS = [['salvar', 'guardar'], ['salvo', 'guardado'], ['salva', 'guardada'], ['tela', 'ecrã'], ['console', 'consola'], ['crônica', 'crónica'], ['tônico', 'tónico'], ['tônicos', 'tónicos'],
  ['bônus', 'bónus'], ['gêmeas', 'gémeas'], ['gênio', 'génio'], ['registrar', 'registar'], ['controles', 'controlos'], ['sacou', 'levantou'], ['sacar', 'levantar'], ['conosco', 'connosco'],
  ['fumaça', 'fumo'], ['ensopado', 'guisado'], ['zumbi', 'zombie'], ['terremoto', 'terramoto'], ['cânion', 'desfiladeiro'], ['esfriam', 'arrefecem'], ['esfria', 'arrefece'],
  ['barraca', 'tenda'], ['barracas', 'tendas'], ['serragem', 'serradura'], ['úmida', 'húmida'], ['úmido', 'húmido'], ['sanduíche', 'sanduíche'], ['ônibus', 'autocarro'], ['trem', 'comboio'],
  ['celular', 'telemóvel'], ['suco', 'sumo'], ['sorvete', 'gelado'], ['café da manhã', 'pequeno-almoço'], ['banheiro', 'casa de banho'], ['geladeira', 'frigorífico'], ['time', 'equipa'],
  ['esporte', 'desporto'], ['fato', 'facto'], ['registro', 'registo'], ['econômico', 'económico'], ['fenômeno', 'fenómeno'], ['tênis', 'ténis'], ['bebê', 'bebé'], ['mamãe', 'mãe']];
const GT_PT_NOT_GER = /^(quando|lindo|linda|mundo|segundo|fundo|profundo|comando|bando|brando|ando|tremendo|estupendo|horrendo|rotundo)$/i;
const gtPtCase = (from, to) => from[0] === from[0].toUpperCase() && from[0] !== from[0].toLowerCase() ? to[0].toUpperCase() + to.slice(1) : to;
const GT_PT_WORD_RE = new RegExp(`(?<![\\p{L}-])(${GT_PT_WORDS.map(w => w[0]).sort((a, b) => b.length - a.length).join('|')})(?![\\p{L}-])`, 'giu');
const GT_PT_WORD_MAP = new Map(GT_PT_WORDS.map(([a, b]) => [a, b]));
function gtToPortugal(t) {
  if (typeof t !== 'string') return t;
  for (const [a, b] of GT_PT_PHRASES) if (t.includes(a)) t = t.split(a).join(b);
  t = t.replace(GT_PT_WORD_RE, m => gtPtCase(m, GT_PT_WORD_MAP.get(m.toLowerCase()) || m));
  // esperando → à espera; anything else with -ndo → a + the to-form (estou copiando → estou a copiar, jogando agora → a jogar agora)
  t = t.replace(/(?<![\p{L}-])([Ee])sperando(?![\p{L}-])/gu, (m, e) => e === 'E' ? 'À espera' : 'à espera');
  t = t.replace(/(?<![\p{L}-])(\p{L}+?)(a|e|i)ndo(-(?:se|me|o|a))?(?![\p{L}-])/gu, (m, st, v, cl) => GT_PT_NOT_GER.test(m.replace(/-.*/, '')) ? m : (m[0] === m[0].toUpperCase() ? 'A ' : 'a ') + (st[0].toLowerCase() + st.slice(1)) + v + 'r' + (cl || ''));
  return t.replace(/ a à espera/g, ' à espera');
}
if (GT_BOOKS.pt) {
  const B = GT_BOOKS.pt, map = o => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [k, gtToPortugal(v)]));
  GT_BOOKS['pt-PT'] = { names: map(B.names), lines: map(B.lines), suffix: (B.suffix || []).map(([a, b]) => [a, gtToPortugal(b)]), frag: B.frag };
  Object.assign(GT_BOOKS['pt-PT'].lines, { '🌐 Game language: Português (Brasil)': '🌐 Idioma do jogo: Português (Brasil)', '🌐 Game language: Português (Portugal)': '🌐 Idioma do jogo: Português (Portugal)' });
  Object.assign(GT_LANG_NAMES, { 'pt-PT': 'Português (Portugal)' });
  Object.assign(GT_LANG_ENGLISH, { 'pt-PT': 'Portuguese (Portugal)' });
}
