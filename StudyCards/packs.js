'use strict';
/* ================= Word card packs & collection =================
   A collectible set of 150 illustrated word cards, available in 8 languages.
   Packs: a new pack charges every 12 hours (at most 2 per day). Opening a pack needs a full pack meter
   (40 ⭐ study points). Each pack has 5 cards; the last slot has the best odds. Duplicates give peanuts,
   and 3 copies make a card ✨ shiny. */
const PACK_LANGS = [['es', 'Español', 'es-ES'], ['fr', 'Français', 'fr-FR'], ['de', 'Deutsch', 'de-DE'], ['it', 'Italiano', 'it-IT'],
  ['pt', 'Português', 'pt-BR'], ['ja', '日本語', 'ja-JP'], ['ko', '한국어', 'ko-KR'], ['zh', '中文', 'zh-CN']];
const RARITY = {
  common: { name: 'Common', stars: 1, color: '#9aa5b1' }, uncommon: { name: 'Uncommon', stars: 2, color: '#23905a' },
  rare: { name: 'Rare', stars: 3, color: '#3b82f6' }, epic: { name: 'Epic', stars: 4, color: '#9b59d0' }, legendary: { name: 'Legendary', stars: 5, color: '#f2a516' },
};
const THEME_BG = { animals: ['#fff1d6', '#ffd9a8'], food: ['#ffe3e3', '#ffc2c2'], nature: ['#e3f8e0', '#bfeab5'], home: ['#efe6ff', '#d9c8ff'], school: ['#e0efff', '#bcd8ff'],
  travel: ['#e0f7f7', '#b3ebeb'], weather: ['#e6f0ff', '#c6dcff'], people: ['#ffe8f3', '#ffc9e2'], feelings: ['#fff6cc', '#ffe88a'], colors: ['#f2f2f2', '#dedede'], body: ['#ffeede', '#ffd6b8'],
  music: ['#f1e6ff', '#dcc6ff'], space: ['#1c1f45', '#3a2f7a'], fantasy: ['#ffe6fb', '#f5c3ff'],
  sports: ['#e4f6ea', '#bfe8cc'], clothes: ['#fdeee4', '#f7d3bd'], jobs: ['#e9eef7', '#cdd8ea'] };
/* [id, emoji, English, theme, rarity, es, fr, de, it, pt, ja (word|reading), ko, zh] */
const WORD_CARDS = [
  [1, '🐱', 'cat', 'animals', 'common', 'gato', 'chat', 'Katze', 'gatto', 'gato', '猫|ねこ', '고양이', '猫'],
  [2, '🐶', 'dog', 'animals', 'common', 'perro', 'chien', 'Hund', 'cane', 'cachorro', '犬|いぬ', '개', '狗'],
  [3, '🍎', 'apple', 'food', 'common', 'manzana', 'pomme', 'Apfel', 'mela', 'maçã', 'りんご', '사과', '苹果'],
  [4, '🍞', 'bread', 'food', 'common', 'pan', 'pain', 'Brot', 'pane', 'pão', 'パン', '빵', '面包'],
  [5, '💧', 'water', 'food', 'common', 'agua', 'eau', 'Wasser', 'acqua', 'água', '水|みず', '물', '水'],
  [6, '☀️', 'sun', 'nature', 'common', 'sol', 'soleil', 'Sonne', 'sole', 'sol', '太陽|たいよう', '태양', '太阳'],
  [7, '🌙', 'moon', 'nature', 'common', 'luna', 'lune', 'Mond', 'luna', 'lua', '月|つき', '달', '月亮'],
  [8, '🌳', 'tree', 'nature', 'common', 'árbol', 'arbre', 'Baum', 'albero', 'árvore', '木|き', '나무', '树'],
  [9, '🌸', 'flower', 'nature', 'common', 'flor', 'fleur', 'Blume', 'fiore', 'flor', '花|はな', '꽃', '花'],
  [10, '🏠', 'house', 'home', 'common', 'casa', 'maison', 'Haus', 'casa', 'casa', '家|いえ', '집', '房子'],
  [11, '📚', 'book', 'school', 'common', 'libro', 'livre', 'Buch', 'libro', 'livro', '本|ほん', '책', '书'],
  [12, '🚗', 'car', 'travel', 'common', 'coche', 'voiture', 'Auto', 'macchina', 'carro', '車|くるま', '자동차', '汽车'],
  [13, '🌧️', 'rain', 'weather', 'common', 'lluvia', 'pluie', 'Regen', 'pioggia', 'chuva', '雨|あめ', '비', '雨'],
  [14, '🥛', 'milk', 'food', 'common', 'leche', 'lait', 'Milch', 'latte', 'leite', '牛乳|ぎゅうにゅう', '우유', '牛奶'],
  [15, '🐟', 'fish', 'animals', 'common', 'pez', 'poisson', 'Fisch', 'pesce', 'peixe', '魚|さかな', '물고기', '鱼'],
  [16, '🐦', 'bird', 'animals', 'common', 'pájaro', 'oiseau', 'Vogel', 'uccello', 'pássaro', '鳥|とり', '새', '鸟'],
  [17, '🥚', 'egg', 'food', 'common', 'huevo', 'œuf', 'Ei', 'uovo', 'ovo', '卵|たまご', '달걀', '鸡蛋'],
  [18, '🪑', 'chair', 'home', 'common', 'silla', 'chaise', 'Stuhl', 'sedia', 'cadeira', '椅子|いす', '의자', '椅子'],
  [19, '🚪', 'door', 'home', 'common', 'puerta', 'porte', 'Tür', 'porta', 'porta', 'ドア', '문', '门'],
  [20, '🏫', 'school', 'school', 'common', 'escuela', 'école', 'Schule', 'scuola', 'escola', '学校|がっこう', '학교', '学校'],
  [21, '🤝', 'friend', 'people', 'common', 'amigo', 'ami', 'Freund', 'amico', 'amigo', '友達|ともだち', '친구', '朋友'],
  [22, '😊', 'happy', 'feelings', 'common', 'feliz', 'heureux', 'glücklich', 'felice', 'feliz', '嬉しい|うれしい', '행복한', '快乐'],
  [23, '🟥', 'red', 'colors', 'common', 'rojo', 'rouge', 'rot', 'rosso', 'vermelho', '赤|あか', '빨간색', '红色'],
  [24, '🟦', 'blue', 'colors', 'common', 'azul', 'bleu', 'blau', 'blu', 'azul', '青|あお', '파란색', '蓝色'],
  [25, '🟩', 'green', 'colors', 'common', 'verde', 'vert', 'grün', 'verde', 'verde', '緑|みどり', '초록색', '绿色'],
  [26, '🧀', 'cheese', 'food', 'common', 'queso', 'fromage', 'Käse', 'formaggio', 'queijo', 'チーズ', '치즈', '奶酪'],
  [27, '🛏️', 'bed', 'home', 'common', 'cama', 'lit', 'Bett', 'letto', 'cama', 'ベッド', '침대', '床'],
  [28, '👟', 'shoe', 'home', 'common', 'zapato', 'chaussure', 'Schuh', 'scarpa', 'sapato', '靴|くつ', '신발', '鞋子'],
  [29, '✋', 'hand', 'body', 'common', 'mano', 'main', 'Hand', 'mano', 'mão', '手|て', '손', '手'],
  [30, '❤️', 'heart', 'body', 'common', 'corazón', 'cœur', 'Herz', 'cuore', 'coração', '心|こころ', '마음', '心'],
  [31, '🐴', 'horse', 'animals', 'uncommon', 'caballo', 'cheval', 'Pferd', 'cavallo', 'cavalo', '馬|うま', '말', '马'],
  [32, '🐰', 'rabbit', 'animals', 'uncommon', 'conejo', 'lapin', 'Kaninchen', 'coniglio', 'coelho', 'うさぎ', '토끼', '兔子'],
  [33, '🍓', 'strawberry', 'food', 'uncommon', 'fresa', 'fraise', 'Erdbeere', 'fragola', 'morango', 'いちご', '딸기', '草莓'],
  [34, '🎂', 'cake', 'food', 'uncommon', 'pastel', 'gâteau', 'Kuchen', 'torta', 'bolo', 'ケーキ', '케이크', '蛋糕'],
  [35, '❄️', 'snow', 'weather', 'uncommon', 'nieve', 'neige', 'Schnee', 'neve', 'neve', '雪|ゆき', '눈', '雪'],
  [36, '⛰️', 'mountain', 'nature', 'uncommon', 'montaña', 'montagne', 'Berg', 'montagna', 'montanha', '山|やま', '산', '山'],
  [37, '🌊', 'sea', 'nature', 'uncommon', 'mar', 'mer', 'Meer', 'mare', 'mar', '海|うみ', '바다', '海'],
  [38, '🚆', 'train', 'travel', 'uncommon', 'tren', 'train', 'Zug', 'treno', 'trem', '電車|でんしゃ', '기차', '火车'],
  [39, '✈️', 'airplane', 'travel', 'uncommon', 'avión', 'avion', 'Flugzeug', 'aereo', 'avião', '飛行機|ひこうき', '비행기', '飞机'],
  [40, '🎵', 'music', 'music', 'uncommon', 'música', 'musique', 'Musik', 'musica', 'música', '音楽|おんがく', '음악', '音乐'],
  [41, '⭐', 'star', 'nature', 'uncommon', 'estrella', 'étoile', 'Stern', 'stella', 'estrela', '星|ほし', '별', '星星'],
  [42, '☂️', 'umbrella', 'weather', 'uncommon', 'paraguas', 'parapluie', 'Regenschirm', 'ombrello', 'guarda-chuva', '傘|かさ', '우산', '雨伞'],
  [43, '🍪', 'cookie', 'food', 'uncommon', 'galleta', 'biscuit', 'Keks', 'biscotto', 'biscoito', 'クッキー', '쿠키', '饼干'],
  [44, '🧑‍⚕️', 'doctor', 'people', 'uncommon', 'médico', 'médecin', 'Arzt', 'medico', 'médico', '医者|いしゃ', '의사', '医生'],
  [45, '🦸', 'brave', 'feelings', 'uncommon', 'valiente', 'courageux', 'mutig', 'coraggioso', 'corajoso', '勇敢|ゆうかん', '용감한', '勇敢'],
  [46, '🐘', 'elephant', 'animals', 'rare', 'elefante', 'éléphant', 'Elefant', 'elefante', 'elefante', '象|ぞう', '코끼리', '大象'],
  [47, '🐧', 'penguin', 'animals', 'rare', 'pingüino', 'pingouin', 'Pinguin', 'pinguino', 'pinguim', 'ペンギン', '펭귄', '企鹅'],
  [48, '🦋', 'butterfly', 'animals', 'rare', 'mariposa', 'papillon', 'Schmetterling', 'farfalla', 'borboleta', '蝶|ちょう', '나비', '蝴蝶'],
  [49, '🌈', 'rainbow', 'weather', 'rare', 'arcoíris', 'arc-en-ciel', 'Regenbogen', 'arcobaleno', 'arco-íris', '虹|にじ', '무지개', '彩虹'],
  [50, '🏝️', 'island', 'travel', 'rare', 'isla', 'île', 'Insel', 'isola', 'ilha', '島|しま', '섬', '岛'],
  [51, '🏰', 'castle', 'fantasy', 'rare', 'castillo', 'château', 'Burg', 'castello', 'castelo', '城|しろ', '성', '城堡'],
  [52, '🎸', 'guitar', 'music', 'rare', 'guitarra', 'guitare', 'Gitarre', 'chitarra', 'violão', 'ギター', '기타', '吉他'],
  [53, '⚡', 'lightning', 'weather', 'rare', 'relámpago', 'éclair', 'Blitz', 'fulmine', 'relâmpago', '雷|かみなり', '번개', '闪电'],
  [54, '💎', 'treasure', 'fantasy', 'rare', 'tesoro', 'trésor', 'Schatz', 'tesoro', 'tesouro', '宝物|たからもの', '보물', '宝藏'],
  [55, '🌋', 'volcano', 'nature', 'epic', 'volcán', 'volcan', 'Vulkan', 'vulcano', 'vulcão', '火山|かざん', '화산', '火山'],
  [56, '🚀', 'rocket', 'space', 'epic', 'cohete', 'fusée', 'Rakete', 'razzo', 'foguete', 'ロケット', '로켓', '火箭'],
  [57, '🐋', 'whale', 'animals', 'epic', 'ballena', 'baleine', 'Wal', 'balena', 'baleia', '鯨|くじら', '고래', '鲸鱼'],
  [58, '🦄', 'unicorn', 'fantasy', 'epic', 'unicornio', 'licorne', 'Einhorn', 'unicorno', 'unicórnio', 'ユニコーン', '유니콘', '独角兽'],
  [59, '🐉', 'dragon', 'fantasy', 'legendary', 'dragón', 'dragon', 'Drache', 'drago', 'dragão', '竜|りゅう', '용', '龙'],
  [60, '🌌', 'universe', 'space', 'legendary', 'universo', 'univers', 'Universum', 'universo', 'universo', '宇宙|うちゅう', '우주', '宇宙'],
  [61, '🐭', 'mouse', 'animals', 'common', 'ratón', 'souris', 'Maus', 'topo', 'rato', 'ネズミ', '쥐', '老鼠'],
  [62, '🐮', 'cow', 'animals', 'common', 'vaca', 'vache', 'Kuh', 'mucca', 'vaca', '牛|うし', '소', '牛'],
  [63, '🐷', 'pig', 'animals', 'common', 'cerdo', 'cochon', 'Schwein', 'maiale', 'porco', '豚|ぶた', '돼지', '猪'],
  [64, '🐔', 'hen', 'animals', 'common', 'gallina', 'poule', 'Huhn', 'gallina', 'galinha', '鶏|にわとり', '닭', '鸡'],
  [65, '🐸', 'frog', 'animals', 'common', 'rana', 'grenouille', 'Frosch', 'rana', 'sapo', 'カエル', '개구리', '青蛙'],
  [66, '🦆', 'duck', 'animals', 'common', 'pato', 'canard', 'Ente', 'anatra', 'pato', 'アヒル', '오리', '鸭子'],
  [67, '🍌', 'banana', 'food', 'common', 'plátano', 'banane', 'Banane', 'banana', 'banana', 'バナナ', '바나나', '香蕉'],
  [68, '🍊', 'orange', 'food', 'common', 'naranja', 'orange', 'Orange', 'arancia', 'laranja', 'オレンジ', '오렌지', '橙子'],
  [69, '🍚', 'rice', 'food', 'common', 'arroz', 'riz', 'Reis', 'riso', 'arroz', 'ご飯|ごはん', '밥', '米饭'],
  [70, '🍲', 'soup', 'food', 'common', 'sopa', 'soupe', 'Suppe', 'zuppa', 'sopa', 'スープ', '수프', '汤'],
  [71, '☕', 'coffee', 'food', 'common', 'café', 'café', 'Kaffee', 'caffè', 'café', 'コーヒー', '커피', '咖啡'],
  [72, '🍵', 'tea', 'food', 'common', 'té', 'thé', 'Tee', 'tè', 'chá', 'お茶|おちゃ', '차', '茶'],
  [73, '🧂', 'salt', 'food', 'common', 'sal', 'sel', 'Salz', 'sale', 'sal', '塩|しお', '소금', '盐'],
  [74, '🪟', 'window', 'home', 'common', 'ventana', 'fenêtre', 'Fenster', 'finestra', 'janela', '窓|まど', '창문', '窗户'],
  [75, '🛋️', 'sofa', 'home', 'common', 'sofá', 'canapé', 'Sofa', 'divano', 'sofá', 'ソファ', '소파', '沙发'],
  [76, '🔑', 'key', 'home', 'common', 'llave', 'clé', 'Schlüssel', 'chiave', 'chave', '鍵|かぎ', '열쇠', '钥匙'],
  [77, '⏰', 'clock', 'home', 'common', 'reloj', 'horloge', 'Uhr', 'orologio', 'relógio', '時計|とけい', '시계', '时钟'],
  [78, '✏️', 'pencil', 'school', 'common', 'lápiz', 'crayon', 'Bleistift', 'matita', 'lápis', '鉛筆|えんぴつ', '연필', '铅笔'],
  [79, '📄', 'paper', 'school', 'common', 'papel', 'papier', 'Papier', 'carta', 'papel', '紙|かみ', '종이', '纸'],
  [80, '🎒', 'backpack', 'school', 'common', 'mochila', 'sac à dos', 'Rucksack', 'zaino', 'mochila', 'リュック', '배낭', '背包'],
  [81, '🧑‍🏫', 'teacher', 'people', 'common', 'profesor', 'professeur', 'Lehrer', 'insegnante', 'professor', '先生|せんせい', '선생님', '老师'],
  [82, '👶', 'baby', 'people', 'common', 'bebé', 'bébé', 'Baby', 'bebè', 'bebê', '赤ちゃん|あかちゃん', '아기', '婴儿'],
  [83, '👨‍👩‍👧', 'family', 'people', 'common', 'familia', 'famille', 'Familie', 'famiglia', 'família', '家族|かぞく', '가족', '家庭'],
  [84, '👩', 'mother', 'people', 'common', 'madre', 'mère', 'Mutter', 'madre', 'mãe', 'お母さん|おかあさん', '어머니', '妈妈'],
  [85, '👨', 'father', 'people', 'common', 'padre', 'père', 'Vater', 'padre', 'pai', 'お父さん|おとうさん', '아버지', '爸爸'],
  [86, '😢', 'sad', 'feelings', 'common', 'triste', 'triste', 'traurig', 'triste', 'triste', '悲しい|かなしい', '슬픈', '难过'],
  [87, '😠', 'angry', 'feelings', 'common', 'enfadado', 'en colère', 'wütend', 'arrabbiato', 'zangado', '怒った|おこった', '화난', '生气'],
  [88, '😴', 'tired', 'feelings', 'common', 'cansado', 'fatigué', 'müde', 'stanco', 'cansado', '疲れた|つかれた', '피곤한', '累'],
  [89, '🟨', 'yellow', 'colors', 'common', 'amarillo', 'jaune', 'gelb', 'giallo', 'amarelo', '黄色|きいろ', '노란색', '黄色'],
  [90, '⬛', 'black', 'colors', 'common', 'negro', 'noir', 'schwarz', 'nero', 'preto', '黒|くろ', '검은색', '黑色'],
  [91, '⬜', 'white', 'colors', 'common', 'blanco', 'blanc', 'weiß', 'bianco', 'branco', '白|しろ', '흰색', '白色'],
  [92, '👁️', 'eye', 'body', 'common', 'ojo', 'œil', 'Auge', 'occhio', 'olho', '目|め', '눈', '眼睛'],
  [93, '👃', 'nose', 'body', 'common', 'nariz', 'nez', 'Nase', 'naso', 'nariz', '鼻|はな', '코', '鼻子'],
  [94, '👄', 'mouth', 'body', 'common', 'boca', 'bouche', 'Mund', 'bocca', 'boca', '口|くち', '입', '嘴'],
  [95, '👂', 'ear', 'body', 'common', 'oreja', 'oreille', 'Ohr', 'orecchio', 'orelha', '耳|みみ', '귀', '耳朵'],
  [96, '🦶', 'foot', 'body', 'common', 'pie', 'pied', 'Fuß', 'piede', 'pé', '足|あし', '발', '脚'],
  [97, '☁️', 'cloud', 'weather', 'common', 'nube', 'nuage', 'Wolke', 'nuvola', 'nuvem', '雲|くも', '구름', '云'],
  [98, '🌬️', 'wind', 'weather', 'common', 'viento', 'vent', 'Wind', 'vento', 'vento', '風|かぜ', '바람', '风'],
  [99, '🔥', 'fire', 'nature', 'common', 'fuego', 'feu', 'Feuer', 'fuoco', 'fogo', '火|ひ', '불', '火'],
  [100, '🪨', 'stone', 'nature', 'common', 'piedra', 'pierre', 'Stein', 'pietra', 'pedra', '石|いし', '돌', '石头'],
  [101, '🚌', 'bus', 'travel', 'common', 'autobús', 'bus', 'Bus', 'autobus', 'ônibus', 'バス', '버스', '公交车'],
  [102, '🚲', 'bicycle', 'travel', 'common', 'bicicleta', 'vélo', 'Fahrrad', 'bicicletta', 'bicicleta', '自転車|じてんしゃ', '자전거', '自行车'],
  [103, '🗺️', 'map', 'travel', 'common', 'mapa', 'carte', 'Karte', 'mappa', 'mapa', '地図|ちず', '지도', '地图'],
  [104, '👕', 'shirt', 'clothes', 'common', 'camisa', 'chemise', 'Hemd', 'camicia', 'camisa', 'シャツ', '셔츠', '衬衫'],
  [105, '👒', 'hat', 'clothes', 'common', 'sombrero', 'chapeau', 'Hut', 'cappello', 'chapéu', '帽子|ぼうし', '모자', '帽子'],
  [106, '⚽', 'ball', 'sports', 'common', 'pelota', 'ballon', 'Ball', 'palla', 'bola', 'ボール', '공', '球'],
  [107, '🦁', 'lion', 'animals', 'uncommon', 'león', 'lion', 'Löwe', 'leone', 'leão', 'ライオン', '사자', '狮子'],
  [108, '🐯', 'tiger', 'animals', 'uncommon', 'tigre', 'tigre', 'Tiger', 'tigre', 'tigre', '虎|とら', '호랑이', '老虎'],
  [109, '🐻', 'bear', 'animals', 'uncommon', 'oso', 'ours', 'Bär', 'orso', 'urso', '熊|くま', '곰', '熊'],
  [110, '🐒', 'monkey', 'animals', 'uncommon', 'mono', 'singe', 'Affe', 'scimmia', 'macaco', '猿|さる', '원숭이', '猴子'],
  [111, '🦊', 'fox', 'animals', 'uncommon', 'zorro', 'renard', 'Fuchs', 'volpe', 'raposa', '狐|きつね', '여우', '狐狸'],
  [112, '🐢', 'turtle', 'animals', 'uncommon', 'tortuga', 'tortue', 'Schildkröte', 'tartaruga', 'tartaruga', '亀|かめ', '거북이', '乌龟'],
  [113, '🍕', 'pizza', 'food', 'uncommon', 'pizza', 'pizza', 'Pizza', 'pizza', 'pizza', 'ピザ', '피자', '比萨'],
  [114, '🍦', 'ice cream', 'food', 'uncommon', 'helado', 'glace', 'Eis', 'gelato', 'sorvete', 'アイスクリーム', '아이스크림', '冰淇淋'],
  [115, '🍫', 'chocolate', 'food', 'uncommon', 'chocolate', 'chocolat', 'Schokolade', 'cioccolato', 'chocolate', 'チョコレート', '초콜릿', '巧克力'],
  [116, '🍉', 'watermelon', 'food', 'uncommon', 'sandía', 'pastèque', 'Wassermelone', 'anguria', 'melancia', 'スイカ', '수박', '西瓜'],
  [117, '🌻', 'sunflower', 'nature', 'uncommon', 'girasol', 'tournesol', 'Sonnenblume', 'girasole', 'girassol', 'ひまわり', '해바라기', '向日葵'],
  [118, '🍃', 'leaf', 'nature', 'uncommon', 'hoja', 'feuille', 'Blatt', 'foglia', 'folha', '葉っぱ|はっぱ', '잎', '叶子'],
  [119, '🏖️', 'beach', 'travel', 'uncommon', 'playa', 'plage', 'Strand', 'spiaggia', 'praia', 'ビーチ', '해변', '海滩'],
  [120, '🚢', 'ship', 'travel', 'uncommon', 'barco', 'bateau', 'Schiff', 'nave', 'navio', '船|ふね', '배', '船'],
  [121, '🎹', 'piano', 'music', 'uncommon', 'piano', 'piano', 'Klavier', 'pianoforte', 'piano', 'ピアノ', '피아노', '钢琴'],
  [122, '🥁', 'drum', 'music', 'uncommon', 'tambor', 'tambour', 'Trommel', 'tamburo', 'tambor', '太鼓|たいこ', '북', '鼓'],
  [123, '🧑‍🍳', 'cook', 'jobs', 'uncommon', 'cocinero', 'cuisinier', 'Koch', 'cuoco', 'cozinheiro', 'コック', '요리사', '厨师'],
  [124, '🧑‍🚒', 'firefighter', 'jobs', 'uncommon', 'bombero', 'pompier', 'Feuerwehrmann', 'pompiere', 'bombeiro', '消防士|しょうぼうし', '소방관', '消防员'],
  [125, '👮', 'police officer', 'jobs', 'uncommon', 'policía', 'policier', 'Polizist', 'poliziotto', 'policial', '警察官|けいさつかん', '경찰관', '警察'],
  [126, '😮', 'surprised', 'feelings', 'uncommon', 'sorprendido', 'surpris', 'überrascht', 'sorpreso', 'surpreso', '驚いた|おどろいた', '놀란', '惊讶'],
  [127, '🏀', 'basketball', 'sports', 'uncommon', 'baloncesto', 'basket', 'Basketball', 'pallacanestro', 'basquete', 'バスケットボール', '농구', '篮球'],
  [128, '🧥', 'coat', 'clothes', 'uncommon', 'abrigo', 'manteau', 'Mantel', 'cappotto', 'casaco', 'コート', '코트', '外套'],
  [129, '🦒', 'giraffe', 'animals', 'rare', 'jirafa', 'girafe', 'Giraffe', 'giraffa', 'girafa', 'キリン', '기린', '长颈鹿'],
  [130, '🦓', 'zebra', 'animals', 'rare', 'cebra', 'zèbre', 'Zebra', 'zebra', 'zebra', 'シマウマ', '얼룩말', '斑马'],
  [131, '🦉', 'owl', 'animals', 'rare', 'búho', 'hibou', 'Eule', 'gufo', 'coruja', 'フクロウ', '부엉이', '猫头鹰'],
  [132, '🐙', 'octopus', 'animals', 'rare', 'pulpo', 'pieuvre', 'Krake', 'polpo', 'polvo', 'タコ', '문어', '章鱼'],
  [133, '🦜', 'parrot', 'animals', 'rare', 'loro', 'perroquet', 'Papagei', 'pappagallo', 'papagaio', 'オウム', '앵무새', '鹦鹉'],
  [134, '🌵', 'cactus', 'nature', 'rare', 'cactus', 'cactus', 'Kaktus', 'cactus', 'cacto', 'サボテン', '선인장', '仙人掌'],
  [135, '🏜️', 'desert', 'nature', 'rare', 'desierto', 'désert', 'Wüste', 'deserto', 'deserto', '砂漠|さばく', '사막', '沙漠'],
  [136, '🌪️', 'tornado', 'weather', 'rare', 'tornado', 'tornade', 'Tornado', 'tornado', 'tornado', '竜巻|たつまき', '토네이도', '龙卷风'],
  [137, '🎻', 'violin', 'music', 'rare', 'violín', 'violon', 'Geige', 'violino', 'violino', 'バイオリン', '바이올린', '小提琴'],
  [138, '🧭', 'compass', 'travel', 'rare', 'brújula', 'boussole', 'Kompass', 'bussola', 'bússola', '方位磁針|ほういじしん', '나침반', '指南针'],
  [139, '👑', 'crown', 'fantasy', 'rare', 'corona', 'couronne', 'Krone', 'corona', 'coroa', '王冠|おうかん', '왕관', '王冠'],
  [140, '🧙', 'wizard', 'fantasy', 'rare', 'mago', 'magicien', 'Zauberer', 'mago', 'mago', '魔法使い|まほうつかい', '마법사', '巫师'],
  [141, '🪐', 'planet', 'space', 'rare', 'planeta', 'planète', 'Planet', 'pianeta', 'planeta', '惑星|わくせい', '행성', '行星'],
  [142, '🦈', 'shark', 'animals', 'epic', 'tiburón', 'requin', 'Hai', 'squalo', 'tubarão', 'サメ', '상어', '鲨鱼'],
  [143, '🦅', 'eagle', 'animals', 'epic', 'águila', 'aigle', 'Adler', 'aquila', 'águia', '鷲|わし', '독수리', '鹰'],
  [144, '☄️', 'comet', 'space', 'epic', 'cometa', 'comète', 'Komet', 'cometa', 'cometa', '彗星|すいせい', '혜성', '彗星'],
  [145, '🧜', 'mermaid', 'fantasy', 'epic', 'sirena', 'sirène', 'Meerjungfrau', 'sirena', 'sereia', '人魚|にんぎょ', '인어', '美人鱼'],
  [146, '🧚', 'fairy', 'fantasy', 'epic', 'hada', 'fée', 'Fee', 'fata', 'fada', '妖精|ようせい', '요정', '仙女'],
  [147, '🛸', 'spaceship', 'space', 'epic', 'nave espacial', 'vaisseau spatial', 'Raumschiff', 'astronave', 'nave espacial', '宇宙船|うちゅうせん', '우주선', '宇宙飞船'],
  [148, '🏆', 'champion', 'sports', 'epic', 'campeón', 'champion', 'Meister', 'campione', 'campeão', 'チャンピオン', '챔피언', '冠军'],
  [149, '🦕', 'dinosaur', 'animals', 'legendary', 'dinosaurio', 'dinosaure', 'Dinosaurier', 'dinosauro', 'dinossauro', '恐竜|きょうりゅう', '공룡', '恐龙'],
  [150, '🌠', 'shooting star', 'space', 'legendary', 'estrella fugaz', 'étoile filante', 'Sternschnuppe', 'stella cadente', 'estrela cadente', '流れ星|ながれぼし', '별똥별', '流星'],
];
const LANG_COL = { es: 5, fr: 6, de: 7, it: 8, pt: 9, ja: 10, ko: 11, zh: 12 };
const cardById = id => WORD_CARDS.find(c => c[0] === id);
function cardWord(c, lang) { const [w, reading] = String(c[LANG_COL[lang]]).split('|'); return { word: w, reading: reading || '' }; }
const PACK_SIZE = 5, PACK_COST = 40, PACK_EVERY = 12 * 3600 * 1000, PACKS_PER_DAY = 2, SHINY_AT = 3;
const SLOT_ODDS = [
  { common: 80, uncommon: 18, rare: 2 }, { common: 80, uncommon: 18, rare: 2 }, { common: 80, uncommon: 18, rare: 2 },
  { common: 40, uncommon: 45, rare: 13, epic: 2 }, { uncommon: 50, rare: 35, epic: 12, legendary: 3 },
];

function packState() {
  S.packs ||= {};
  const p = S.packs;
  if (p.charges == null) { p.charges = 1; p.lastCharge = Date.now(); p.meter = PACK_COST; }   // a free first pack to start
  p.collection ||= {}; p.opened ??= 0; p.day ||= { date: dateKey(), count: 0 };
  if (!p.lang) {
    const counts = {}; S.decks.forEach(d => { const k = (d.frontLang || '').split('-')[0]; if (LANG_COL[k]) counts[k] = (counts[k] || 0) + cardsOf(d.id).length; });
    p.lang = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'es';
  }
  if (p.day.date !== dateKey()) p.day = { date: dateKey(), count: 0 };
  // charge a pack every 12 hours (store up to 2)
  if (p.charges >= PACKS_PER_DAY) p.lastCharge = Date.now();
  else {
    const n = Math.floor((Date.now() - p.lastCharge) / PACK_EVERY);
    if (n > 0) { p.charges = Math.min(PACKS_PER_DAY, p.charges + n); p.lastCharge += n * PACK_EVERY; if (p.charges >= PACKS_PER_DAY) p.lastCharge = Date.now(); }
  }
  return p;
}
function packsAddPoints(n) { if (n <= 0) return; const p = packState(); p.meter = Math.min(PACK_COST * PACKS_PER_DAY, (p.meter || 0) + n); }
function packStatus() {
  const p = packState(), left = PACKS_PER_DAY - p.day.count;
  const nextCharge = p.charges >= PACKS_PER_DAY ? null : p.lastCharge + PACK_EVERY;
  const ready = p.charges > 0 && left > 0 && p.meter >= PACK_COST;
  let why = '';
  if (left <= 0) why = 'You’ve opened today’s 2 packs. Come back tomorrow!';
  else if (p.charges <= 0) why = 'Your next pack is still charging.';
  else if (p.meter < PACK_COST) why = `Earn ${PACK_COST - p.meter} more ⭐ study points to open your pack.`;
  return { p, ready, left, nextCharge, why };
}
const collected = lang => packState().collection[lang] || {};
const collectedCount = lang => Object.keys(collected(lang)).length;
function rollRarity(odds) { let r = Math.random() * 100; for (const [k, v] of Object.entries(odds)) { if ((r -= v) < 0) return k; } return 'common'; }
function openPack() {
  const st = packStatus(); if (!st.ready) { toast(st.why); return; }
  const p = st.p, lang = p.lang, col = (p.collection[lang] ||= {});
  p.charges--; p.meter -= PACK_COST; p.day.count++; p.opened++;
  if (p.charges < PACKS_PER_DAY && !p.lastCharge) p.lastCharge = Date.now();
  const pulls = SLOT_ODDS.map(odds => {
    const rar = rollRarity(odds), pool = WORD_CARDS.filter(c => c[4] === rar);
    const c = pool[Math.floor(Math.random() * pool.length)], before = col[c[0]] || 0;
    col[c[0]] = before + 1;
    return { id: c[0], isNew: before === 0, copies: before + 1, shinyNow: before + 1 === SHINY_AT };
  });
  const dupes = pulls.filter(x => !x.isNew).length;
  if (dupes && typeof rw === 'function') rw().peanuts += dupes * 2;
  if (typeof checkBadges === 'function') checkBadges();
  save();
  packOpen = { lang, pulls, revealed: pulls.map(() => false), torn: false, dupes };
  go({ name: 'packOpen' });
}
let packOpen = null;

/* ---------- Card rendering ---------- */
function wordCardHtml(id, lang, { size = 'md', back = false, missing = false, copies = 0, isNew = false } = {}) {
  const c = cardById(id); if (!c) return '';
  if (back) return `<div class="wcard back ${size}"><div class="wc-back-inner">${mascot(size === 'lg' ? 90 : 56)}<b>Estudiamos</b></div></div>`;
  const [, emoji, en, theme, rar] = c, R = RARITY[rar], bg = THEME_BG[theme] || THEME_BG.colors, w = cardWord(c, lang);
  if (missing) return `<div class="wcard missing ${size}" title="Not collected yet"><div class="wc-num">#${String(id).padStart(3, '0')}</div><div class="wc-art"><span style="filter:brightness(0) opacity(.18)">${emoji}</span></div><div class="wc-word">???</div><div class="wc-stars" style="color:${R.color}">${'★'.repeat(R.stars)}</div></div>`;
  const shiny = copies >= SHINY_AT;
  return `<div class="wcard ${size} r-${rar} ${shiny ? 'shiny' : ''}" style="--rc:${R.color}" data-card="${id}">
    ${isNew ? '<span class="wc-new">NEW!</span>' : ''}
    <div class="wc-top"><span class="wc-num">#${String(id).padStart(3, '0')}</span><span class="wc-rar">${R.name}</span></div>
    <div class="wc-art" style="background:linear-gradient(160deg,${bg[0]},${bg[1]})"><span>${emoji}</span></div>
    <div class="wc-word" lang="${lang}">${esc(w.word)}</div>
    ${w.reading ? `<div class="wc-reading">${esc(w.reading)}</div>` : ''}
    <div class="wc-en">${esc(en)}</div>
    <div class="wc-foot"><span class="wc-stars">${'★'.repeat(R.stars)}</span>${copies > 1 ? `<span class="wc-copies">×${copies}${shiny ? ' ✨' : ''}</span>` : ''}</div>
  </div>`;
}
/* The unopened pack: a big, detailed version of the Packs icon in the menu (foil pouch, crimped edges, gold star card) */
const PACK_BODY = (() => {   // pouch outline with crimped (zig-zag) top and bottom edges, in a 240×340 box
  const L = 12, R = 228, top = 22, bot = 318, tooth = 10, n = 18, w = (R - L) / n;
  let d = `M${L} ${top}`;
  for (let i = 0; i < n; i++) d += ` L${(L + w * (i + .5)).toFixed(1)} ${top - tooth} L${(L + w * (i + 1)).toFixed(1)} ${top}`;
  d += ` L${R} ${bot}`;
  for (let i = n - 1; i >= 0; i--) d += ` L${(L + w * (i + .5)).toFixed(1)} ${bot + tooth} L${(L + w * i).toFixed(1)} ${bot}`;
  return d + ' Z';
})();
const starPath = (cx, cy, R, r = R * .45, pts = 5) => { let d = ''; for (let i = 0; i < pts * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / pts, rr = i % 2 ? r : R; d += `${i ? 'L' : 'M'}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)} `; } return d + 'Z'; };
const sparkle = (x, y, s) => `M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z`;
const PACK_SVG = `<svg class="pack-svg" viewBox="0 0 240 340" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="pkFoil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9a6bff"/><stop offset=".48" stop-color="#3b54e8"/><stop offset="1" stop-color="#18a0c8"/></linearGradient>
    <linearGradient id="pkHolo" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff7ad9" stop-opacity="0"/><stop offset=".3" stop-color="#ff7ad9" stop-opacity=".32"/><stop offset=".5" stop-color="#7cf3ff" stop-opacity=".32"/><stop offset=".7" stop-color="#fff38a" stop-opacity=".32"/><stop offset="1" stop-color="#fff38a" stop-opacity="0"/></linearGradient>
    <linearGradient id="pkCard" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset=".55" stop-color="#ffcf3a"/><stop offset="1" stop-color="#f5a623"/></linearGradient>
    <radialGradient id="pkGlow" cx=".5" cy=".46" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <clipPath id="pkClip"><path d="${PACK_BODY}"/></clipPath>
  </defs>
  <path d="${PACK_BODY}" fill="url(#pkFoil)"/>
  <g clip-path="url(#pkClip)">
    <ellipse cx="120" cy="165" rx="110" ry="120" fill="url(#pkGlow)"/>
    <g fill="#fff" opacity=".28">${[[40, 90, 5], [196, 98, 4], [56, 238, 4], [204, 226, 6], [30, 160, 3], [214, 168, 3], [88, 76, 3], [160, 252, 3]].map(([x, y, r]) => `<path d="${sparkle(x, y, r)}"/>`).join('')}</g>
    <polygon points="138,0 176,0 74,340 36,340" fill="#fff" opacity=".16"/><polygon points="188,0 200,0 98,340 86,340" fill="#fff" opacity=".1"/>
    <rect x="0" y="0" width="240" height="64" fill="#0b0f3a" opacity=".26"/><rect x="0" y="276" width="240" height="64" fill="#0b0f3a" opacity=".26"/>
    <rect x="0" y="64" width="240" height="2.5" fill="#fff" opacity=".4"/><rect x="0" y="273.5" width="240" height="2.5" fill="#fff" opacity=".4"/>
    <rect x="0" y="24" width="240" height="2" fill="#fff" opacity=".3"/><rect x="0" y="314" width="240" height="2" fill="#fff" opacity=".3"/>
    <rect class="pk-holo" x="-240" y="0" width="240" height="340" fill="url(#pkHolo)"/>
  </g>
  <text x="120" y="52" text-anchor="middle" fill="#fff" font-family="'Segoe UI',system-ui,sans-serif" font-weight="900" font-size="22" letter-spacing="3">ESTUDIAMOS</text>
  <text x="120" y="304" text-anchor="middle" fill="#fff" font-family="'Segoe UI',system-ui,sans-serif" font-weight="900" font-size="19" letter-spacing="5" opacity=".95">WORD PACK</text>
  <g transform="translate(0 -7) rotate(-9 120 160)">
    <rect x="74" y="94" width="96" height="134" rx="12" fill="#0b0f3a" opacity=".28" transform="translate(5 6)"/>
    <rect x="74" y="94" width="96" height="134" rx="12" fill="#fff"/>
    <rect x="83" y="103" width="78" height="116" rx="8" fill="url(#pkCard)"/>
    <path d="${starPath(122, 160, 33)}" fill="#fff" stroke="#e8a317" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="${starPath(96, 118, 7)}" fill="#fff" opacity=".85"/><path d="${starPath(148, 204, 7)}" fill="#fff" opacity=".85"/>
    <rect x="83" y="103" width="78" height="22" rx="8" fill="#fff" opacity=".22"/>
  </g>
  <path d="${PACK_BODY}" fill="none" stroke="#1d2160" stroke-opacity=".55" stroke-width="3" stroke-linejoin="round"/>
</svg>`;
function packArt(lang, big = true) {
  const L = PACK_LANGS.find(l => l[0] === lang);
  return `<div class="pack ${big ? 'big' : ''}">${PACK_SVG}<div class="pack-lang">${esc(L?.[1] || lang)}</div></div>`;
}
const fmtLeft = ms => { const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m ${String(ss).padStart(2, '0')}s`; };

/* ---------- Views ---------- */
views.packs = () => {
  const st = packStatus(), p = st.p, lang = p.lang, have = collectedCount(lang);
  const recent = (p.recent || []).slice(0, 5);
  return `
    <div class="row-between" style="margin-bottom:14px"><h2>🎴 Word card packs</h2>
      <label class="row small">Collection language
        <select class="inp" id="packLang" style="margin:0;width:auto">${PACK_LANGS.map(([k, n]) => `<option value="${k}" ${k === lang ? 'selected' : ''}>${esc(n)} (${collectedCount(k)}/${WORD_CARDS.length})</option>`).join('')}</select></label></div>
    <section class="panel pack-panel">
      <div class="pack-stage ${st.ready ? 'ready' : ''}" ${st.ready ? 'data-act="openPack"' : ''} title="${st.ready ? 'Open your pack!' : esc(st.why)}">${packArt(lang)}
        ${p.charges > 1 ? '<span class="pack-count">×2</span>' : ''}</div>
      <div class="pack-info">
        <div class="word sm">${st.ready ? 'Your pack is ready!' : 'Next pack'}</div>
        <p class="muted" style="margin:0">${st.ready ? 'Click the pack to tear it open. 5 word cards inside!' : esc(st.why)}</p>
        <div><div class="row-between small"><span>⭐ Pack meter</span><b>${Math.min(p.meter, PACK_COST)}/${PACK_COST}</b></div>
          <div class="seg-bar tall"><div class="g" style="width:${Math.min(100, p.meter / PACK_COST * 100).toFixed(1)}%"></div></div></div>
        <div class="row small" style="gap:18px">
          <span>🎴 Packs ready: <b>${p.charges}</b></span>
          <span>Today: <b>${p.day.count}/${PACKS_PER_DAY}</b> opened</span>
          <span id="packTimer">${st.nextCharge ? `⏳ Next pack charges in <b>${fmtLeft(st.nextCharge - Date.now())}</b>` : '✅ Fully charged'}</span>
        </div>
        <button type="button" class="btn ${st.ready ? 'primary' : ''} big" data-act="openPack" ${st.ready ? '' : 'disabled'}>Open pack</button>
        <p class="muted small" style="margin:0">A new pack charges every 12 hours (up to ${PACKS_PER_DAY} a day). Study to fill the meter: every ⭐ point counts. Duplicates give 🥜 2 peanuts, and ${SHINY_AT} copies make a card ✨ shiny.</p>
      </div>
    </section>
    <section class="panel" style="margin-top:16px">
      <div class="row-between"><h3>My collection: ${esc(PACK_LANGS.find(l => l[0] === lang)[1])}</h3><button type="button" class="btn" data-act="gallery">Open gallery →</button></div>
      <div class="row-between small" style="margin:10px 0 6px"><span>${have} of 60 cards collected</span><b>${Math.round(have / 60 * 100)}%</b></div>
      <div class="seg-bar tall"><div class="m" style="width:${(have / 60 * 100).toFixed(1)}%"></div></div>
      <div class="rarity-row">${Object.entries(RARITY).map(([k, r]) => { const tot = WORD_CARDS.filter(c => c[4] === k).length, got = WORD_CARDS.filter(c => c[4] === k && collected(lang)[c[0]]).length; return `<span style="color:${r.color}">${'★'.repeat(r.stars)} ${r.name} <b>${got}/${tot}</b></span>`; }).join('')}</div>
      ${recent.length ? `<h4 style="margin:16px 0 8px">Last pack</h4><div class="card-row">${recent.map(id => wordCardHtml(id, lang, { size: 'sm', copies: collected(lang)[id] })).join('')}</div>` : ''}
    </section>`;
};
views.packOpen = () => {
  if (!packOpen) { view = { name: 'packs' }; return views.packs(); }
  const { lang, pulls, revealed, torn } = packOpen, all = revealed.every(Boolean);
  if (!torn) return `<div class="pack-open-stage"><div class="word sm" style="margin-bottom:10px">Tap the pack to tear it open!</div>
    <div class="pack-tear" data-act="tearPack">${packArt(lang)}</div></div>`;
  return `<div class="pack-open-stage">
    <div class="word sm">${all ? (pulls.some(x => x.isNew) ? `${pulls.filter(x => x.isNew).length} new card${pulls.filter(x => x.isNew).length === 1 ? '' : 's'} for your collection!` : 'All duplicates. +peanuts!') : 'Tap each card to flip it'}</div>
    <div class="pull-row">${pulls.map((x, i) => `<div class="flip ${revealed[i] ? 'on' : ''} r-${cardById(x.id)[4]}" data-act="flipCard" data-i="${i}" style="animation-delay:${i * 0.08}s">
      <div class="flip-in"><div class="face front">${wordCardHtml(x.id, lang, { size: 'md', back: true })}</div>
      <div class="face backside">${wordCardHtml(x.id, lang, { size: 'md', copies: x.copies, isNew: x.isNew })}${x.shinyNow ? '<div class="shiny-note">✨ Now shiny!</div>' : ''}</div></div></div>`).join('')}</div>
    <div class="row" style="justify-content:center;margin-top:16px">
      ${all ? `${packOpen.dupes ? `<span class="pill">🥜 +${packOpen.dupes * 2} peanuts for duplicates</span>` : ''}
        <button type="button" class="btn" data-act="gallery">View gallery</button><button type="button" class="btn primary" data-act="packsHome">Done</button>`
        : '<button type="button" class="btn" data-act="revealAll">Reveal all</button>'}
    </div></div>`;
};
views.gallery = () => {
  const p = packState(), lang = view.lang || p.lang, col = collected(lang), f = view.gf || 'all';
  const list = WORD_CARDS.filter(c => f === 'all' || (f === 'owned' ? col[c[0]] : f === 'missing' ? !col[c[0]] : c[4] === f));
  const have = Object.keys(col).length;
  return `
    <div class="crumbs"><a data-act="packsHome">Packs</a> / Gallery</div>
    <div class="row-between" style="margin-bottom:12px"><h2>Card gallery</h2>
      <select class="inp" id="galLang" style="margin:0;width:auto">${PACK_LANGS.map(([k, n]) => `<option value="${k}" ${k === lang ? 'selected' : ''}>${esc(n)} (${collectedCount(k)}/${WORD_CARDS.length})</option>`).join('')}</select></div>
    <div class="row-between small" style="margin-bottom:6px"><span>${have}/60 collected · ${Object.values(col).filter(n => n >= SHINY_AT).length} shiny ✨</span><b>${Math.round(have / 60 * 100)}%</b></div>
    <div class="seg-bar tall" style="margin-bottom:14px"><div class="m" style="width:${(have / 60 * 100).toFixed(1)}%"></div></div>
    <div class="seg" style="margin-bottom:14px">${[['all', 'All'], ['owned', 'Collected'], ['missing', 'Missing'], ...Object.entries(RARITY).map(([k, r]) => [k, `${'★'.repeat(r.stars)} ${r.name}`])].map(([k, l]) => `<label><input type="radio" name="gf" value="${k}" ${k === f ? 'checked' : ''}>${l}</label>`).join('')}</div>
    <div class="gallery-grid">${list.map(c => col[c[0]] ? `<div class="gal-item" data-act="cardDetail" data-id="${c[0]}" data-lang="${lang}">${wordCardHtml(c[0], lang, { size: 'sm', copies: col[c[0]] })}</div>` : wordCardHtml(c[0], lang, { size: 'sm', missing: true })).join('')}</div>
    ${have ? `<div style="text-align:center;margin-top:18px"><button type="button" class="btn" data-act="addCollectionDeck" data-lang="${lang}">📚 Add my ${have} collected words to a study deck</button></div>` : ''}`;
};
/* Say a trading card's word out loud (uses the same voice settings as studying) */
function packSay(id, lang) {
  if (typeof ttsOn === 'function' && !ttsOn()) return;
  const L = PACK_LANGS.find(l => l[0] === lang), c = cardById(id); if (!L || !c) return;
  speak(cardWord(c, lang).word, L[2]);
}
function cardDetail(id, lang) {
  const c = cardById(id), copies = collected(lang)[id] || 0, w = cardWord(c, lang), L = PACK_LANGS.find(l => l[0] === lang);
  openDialog({
    title: `${c[1]} ${w.word}`, ok: 'Close',
    body: `<div style="display:flex;justify-content:center;cursor:pointer" data-act="packSay" data-id="${id}" data-lang="${lang}" title="Tap to hear the word">${wordCardHtml(id, lang, { size: 'lg', copies })}</div>
      <div class="row" style="justify-content:center">${speakBtn(w.word, L[2], true)}<span class="muted">You have ${copies} cop${copies === 1 ? 'y' : 'ies'}${copies >= SHINY_AT ? ' ✨' : ` · ${SHINY_AT - copies} more to make it shiny`}</span></div>`,
    onOk: () => {},
  });
  $('#dlg [data-dlg=cancel]')?.remove();
  packSay(id, lang);
}
function addCollectionDeck(lang) {
  const L = PACK_LANGS.find(l => l[0] === lang), name = `🎴 Collection: ${L[1]}`;
  let d = S.decks.find(x => x.name === name);
  if (!d) { d = { id: uid(), name, frontLang: L[2], backLang: 'en-US', newPerDay: 20, direction: 'front', created: Date.now() }; S.decks.push(d); }
  const have = new Set(cardsOf(d.id).map(c => c.front + '\u0000' + c.back));
  let added = 0;
  for (const id of Object.keys(collected(lang)).map(Number)) {
    const c = cardById(id); if (!c) continue; const w = cardWord(c, lang); if (have.has(w.word + '\u0000' + c[2])) continue;
    S.cards.push(newCard(d.id, w.word, c[2], `${c[1]}${w.reading ? ' · ' + w.reading : ''}`)); added++;
  }
  save(); toast(added ? `Added ${added} word${added === 1 ? '' : 's'} to “${name}”` : 'All your collected words are already in that deck');
  go({ name: 'deck', deckId: d.id });
}

/* ---------- Actions & live timer ---------- */
Object.assign(actions, {
  packsHome: () => go({ name: 'packs' }),
  openPack: () => openPack(),
  tearPack: el => {
    el.classList.add('tearing'); if (typeof trumpet === 'function') trumpet();
    setTimeout(() => { packOpen.torn = true; packState().recent = packOpen.pulls.map(x => x.id); save(); render(); }, 650);
  },
  flipCard: el => {
    const i = +el.dataset.i; if (!packOpen) return;
    packSay(packOpen.pulls[i].id, packOpen.lang);
    if (packOpen.revealed[i]) return;
    packOpen.revealed[i] = true; el.classList.add('on');
    const rar = cardById(packOpen.pulls[i].id)[4];
    if (['rare', 'epic', 'legendary'].includes(rar) && typeof friendSound === 'function') friendSound(rar === 'legendary' ? 'monkey' : 'rabbit');
    if (packOpen.revealed.every(Boolean)) setTimeout(render, 700);
  },
  revealAll: () => { if (!packOpen) return; packOpen.revealed = packOpen.revealed.map(() => true); render(); },
  gallery: () => go({ name: 'gallery', lang: packState().lang }),
  cardDetail: el => cardDetail(+el.dataset.id, el.dataset.lang),
  packSay: el => packSay(+el.dataset.id, el.dataset.lang),
  addCollectionDeck: el => addCollectionDeck(el.dataset.lang),
});
document.addEventListener('change', e => {
  if (e.target.id === 'packLang') { packState().lang = e.target.value; save(); render(); }
  if (e.target.id === 'galLang') { view.lang = e.target.value; render(); }
  if (e.target.name === 'gf') { view.gf = e.target.value; render(); }
});
setInterval(() => {
  const el = $('#packTimer'); if (!el || view.name !== 'packs') return;
  const st = packStatus();
  if (st.nextCharge && st.nextCharge - Date.now() <= 0) { render(); return; }
  el.innerHTML = st.nextCharge ? `⏳ Next pack charges in <b>${fmtLeft(st.nextCharge - Date.now())}</b>` : '✅ Fully charged';
}, 1000);
function packsReadyCount() { try { return packStatus().ready ? 1 : 0; } catch { return 0; } }
