'use strict';
/* ================= Sentence Builder: word list for the real sentences =================
   Type and meaning for the words in the built-in sentences that the builder's own word lists don't cover.
   One word per line: word|type|meaning. Types: noun verb adj adv pron det prep conj part. Loaded before rstag.js. */
const RS_DICT_SRC = {
  es: `hacer|verb|to do / make
tom|noun|Tom
verdad|noun|truth
mejor|adj|better
sabes|verb|you know
decir|verb|to say
solo|adv|only
hacerlo|verb|to do it
tiempo|noun|time
dijo|verb|said
nadie|pron|nobody
hecho|verb|done / made
hace|verb|does / makes
hizo|verb|did / made
francés|noun|French
parece|verb|seems
creo|verb|I think
inglés|noun|English
boston|noun|Boston
problema|noun|problem
tarde|adv|late
así|adv|like this
estaba|verb|was
ti|pron|you
mí|pron|me
alguien|pron|someone
quería|verb|wanted
día|noun|day
mismo|adj|same
sabía|verb|knew
hora|noun|hour / time
demasiado|adv|too (much)
vida|noun|life
gustaría|verb|would like
ahí|adv|there
todos|pron|everyone / all
pasado|adj|past / last
mundo|noun|world
debería|verb|should
cuál|pron|which
nombre|noun|name
cuánto|adv|how much
buen|adj|good
uno|det|one
mary|noun|Mary
noche|noun|night
sobre|prep|about / on
favor|noun|favor
tenía|verb|had
antes|adv|before
ni|conj|nor / not even
deberías|verb|you should
conmigo|pron|with me
cosas|noun|things
habitación|noun|room
fuera|adv|outside
maría|noun|María
días|noun|days
gente|noun|people
realmente|adv|really
años|noun|years
hasta|prep|until
sólo|adv|only
gustan|verb|like (are pleasing)
podría|verb|could
contigo|pron|with you
casi|adv|almost
saber|verb|to know
seguro|adj|sure / safe
haber|verb|to have (helper verb)
cada|det|each
pronto|adv|soon
tanto|adv|so much
alguna|det|some
jardinero|noun|gardener
prepara|verb|prepares / makes
arregla|verb|fixes
crea|verb|creates
todas|pron|all
conductor|noun|driver
autobús|noun|bus
informe|noun|report
atleta|noun|athlete
gana|verb|wins
arranca|verb|starts / pulls out
profesora|noun|teacher
enseña|verb|teaches
matemáticas|noun|math
toca|verb|plays (an instrument)
persigue|verb|chases
tuberías|noun|pipes
maneja|verb|drives / handles
medicamentos|noun|medicine
cartero|noun|mail carrier
teje|verb|knits
construye|verb|builds
realiza|verb|carries out
actor|noun|actor
película|noun|movie
corta|verb|cuts
cabello|noun|hair
marca|verb|scores / shows
dirige|verb|directs / leads
graba|verb|records
equipo|noun|team
suena|verb|rings / sounds
bebé|noun|baby
suelo|noun|floor / ground
tomás|noun|Tomás
semana|noun|week
guerrero|noun|warrior
vence|verb|wins / defeats
batallas|noun|battles
joven|noun|young man / young
enorme|adj|huge
consiguen|verb|get / achieve
pierde|verb|loses
detiene|verb|stops
doctor|noun|doctor
redacta|verb|writes (up)
ordenador|noun|computer
averiado|adj|broken
excepcional|adj|exceptional
desierta|adj|deserted
vacas|noun|cows
hierba|noun|grass
tarta|noun|cake
canta|verb|sings
villancico|noun|Christmas carol
competición|noun|competition
pera|noun|pear
comprado|verb|bought
laura|noun|Laura
encuentra|verb|finds
cartera|noun|wallet
chófer|noun|driver
jefe|noun|boss
revisa|verb|reviews / checks
televisión|noun|television
averiada|adj|broken
jaime|noun|Jaime
tímido|adj|shy
plaza|noun|square
abarrotada|adj|packed
fútbol|noun|soccer
juan|noun|Juan
trompeta|noun|trumpet
andrea|noun|Andrea
idiomas|noun|languages
ratón|noun|mouse
platos|noun|dishes
estudiante|noun|student
chef|noun|chef
ladra|verb|barks
extraños|noun|strangers
poda|verb|trims
arbustos|noun|bushes
construyen|verb|build
nidos|noun|nests
desayuno|noun|breakfast
músico|noun|musician
piano|noun|piano
fontanero|noun|plumber
bomberos|noun|firefighters
apagan|verb|put out
fuego|noun|fire
enfermera|noun|nurse
administra|verb|gives / administers
agricultor|noun|farmer
cultiva|verb|grows / farms
tierra|noun|land / earth
arquitecto|noun|architect
diseña|verb|designs
edificios|noun|buildings
pescador|noun|fisherman
atrapa|verb|catches
peces|noun|fish
entrega|verb|delivers
pintor|noun|painter
hermosas|adj|beautiful
pinturas|noun|paintings
abuela|noun|grandmother
suéteres|noun|sweaters
camarero|noun|waiter
sirve|verb|serves
pista|noun|track
carpintero|noun|carpenter
muebles|noun|furniture
escritor|noun|writer
novelas|noun|novels
fotógrafo|noun|photographer
toma|verb|takes
fotografías|noun|photos
electricista|noun|electrician
repara|verb|repairs
cableado|noun|wiring
albañil|noun|bricklayer
muros|noun|walls
farmacéutico|noun|pharmacist
dispensa|verb|hands out
corrige|verb|corrects / grades
exámenes|noun|exams
cantante|noun|singer
interpreta|verb|performs
canciones|noun|songs
mecánico|noun|mechanic
científico|noun|scientist
experimentos|noun|experiments
actúa|verb|acts
dentista|noun|dentist
dientes|noun|teeth
investigadora|noun|researcher
evidencia|noun|evidence
panadero|noun|baker
hornea|verb|bakes
fresco|adj|fresh
peluquero|noun|hairdresser
vendedor|noun|salesperson
muestra|verb|shows
productos|noun|products
político|noun|politician
pronuncia|verb|gives (a speech)
discurso|noun|speech
futbolista|noun|soccer player
gol|noun|goal
modisto|noun|fashion designer
diseños|noun|designs
moda|noun|fashion
director|noun|director
médico|noun|doctor
examina|verb|examines
pacientes|noun|patients
barista|noun|barista
aromático|adj|fragrant
abogada|noun|lawyer
defiende|verb|defends
cliente|noun|client
taxista|noun|taxi driver
conduce|verb|drives
taxi|noun|taxi
estilista|noun|stylist
peina|verb|combs / styles
diseñador|noun|designer
gráfico|adj|graphic
ilustraciones|noun|illustrations
hierbas|noun|herbs / weeds
astronauta|noun|astronaut
explora|verb|explores
espacio|noun|space
voz|noun|voice
diálogos|noun|lines / dialogues
soldado|noun|soldier
protege|verb|protects
país|noun|country
entrenador|noun|coach
joyero|noun|jeweler
fabrica|verb|makes
joyas|noun|jewelry
reportero|noun|reporter
entrevista|verb|interviews
celebridades|noun|celebrities
carnicero|noun|butcher
carne|noun|meat
planta|verb|plants
herrera|noun|blacksmith
forja|verb|forges
herramientas|noun|tools
banquero|noun|banker
transacciones|noun|transactions
financieras|adj|financial
salvavidas|noun|lifeguard
rescata|verb|rescues
nadadores|noun|swimmers
camarógrafo|noun|camera operator
vídeos|noun|videos
recoge|verb|picks up
correo|noun|mail
instructor|noun|instructor
imparte|verb|teaches / gives
clases|noun|classes
guardia|noun|guard
seguridad|noun|security
patrulla|verb|patrols
edificio|noun|building
fontanera|noun|plumber
instala|verb|installs
partido|noun|game / match
cena|noun|dinner
peatón|noun|pedestrian
cruza|verb|crosses
calle|noun|street
viento|noun|wind
mueve|verb|moves
hojas|noun|leaves
sol|noun|sun
ilumina|verb|lights up
río|noun|river
atraviesa|verb|crosses / runs through
valle|noun|valley
constantemente|adv|constantly
llora|verb|cries
atención|noun|attention
reloj|noun|clock / watch
lluvia|noun|rain
moja|verb|wets
avión|noun|plane
vuela|verb|flies
cielo|noun|sky
martillo|noun|hammer
golpea|verb|hits
clavo|noun|nail
música|noun|music
alegra|verb|cheers up
ambiente|noun|mood / atmosphere
campana|noun|bell
iglesia|noun|church
barco|noun|ship / boat
navega|verb|sails
océano|noun|ocean
tren|noun|train
llega|verb|arrives
estación|noun|station
surfista|noun|surfer
monta|verb|rides
olas|noun|waves
mago|noun|magician
truco|noun|trick
gatea|verb|crawls
hacia|prep|toward
juguete|noun|toy
rebota|verb|bounces
anciana|noun|old woman
suéter|noun|sweater
abeja|noun|bee
produce|verb|makes / produces
miel|noun|honey
payaso|noun|clown
reír|verb|to laugh
audiencia|noun|audience
alarma|noun|alarm
anuncia|verb|announces / warns of
peligro|noun|danger`,
  fr: `faire|verb|to do / make
grand|adj|big / tall
grande|adj|big / tall
petit|adj|small
petite|adj|small
beau|adj|beautiful
belle|adj|beautiful
joli|adj|pretty
jolie|adj|pretty
vieux|adj|old
vieille|adj|old
jeune|adj|young
mauvais|adj|bad
mauvaise|adj|bad
heureux|adj|happy
heureuse|adj|happy
triste|adj|sad
facile|adj|easy
difficile|adj|difficult
chaud|adj|hot
froid|adj|cold
long|adj|long
longue|adj|long
court|adj|short
rouge|adj|red
bleu|adj|blue
vert|adj|green
blanc|adj|white
noir|adj|black
fatigué|adj|tired
content|adj|glad
riche|adj|rich
pauvre|adj|poor
gentil|adj|kind
rapide|adj|fast
lent|adj|slow
cher|adj|expensive / dear
dans|prep|in
sur|prep|on
sous|prep|under
avec|prep|with
sans|prep|without
pour|prep|for
chez|prep|at the home of
entre|prep|between
après|prep|after
avant|prep|before
pendant|prep|during
depuis|prep|since / for
vers|prep|towards
contre|prep|against
derrière|prep|behind
devant|prep|in front of
parmi|prep|among
partir|verb|to leave
pars|verb|leave (partir)
part|verb|leaves (partir)
partons|verb|leave (partir)
partez|verb|leave (partir)
partent|verb|leave (partir)
parti|verb|left (partir)
sortir|verb|to go out
sors|verb|go out (sortir)
sort|verb|goes out (sortir)
venir|verb|to come
viens|verb|come (venir)
vient|verb|comes (venir)
venons|verb|come (venir)
venez|verb|come (venir)
viennent|verb|come (venir)
venu|verb|come (venir)
prendre|verb|to take
prends|verb|take (prendre)
prend|verb|takes (prendre)
prenons|verb|take (prendre)
prenez|verb|take (prendre)
prennent|verb|take (prendre)
pris|verb|taken (prendre)
mettre|verb|to put
mets|verb|put (mettre)
met|verb|puts (mettre)
mis|verb|put (mettre)
voir|verb|to see
vois|verb|see (voir)
voit|verb|sees (voir)
voyons|verb|see (voir)
voyez|verb|see (voir)
voient|verb|see (voir)
vu|verb|seen (voir)
savoir|verb|to know
sais|verb|know (savoir)
sait|verb|knows (savoir)
savons|verb|know (savoir)
savez|verb|know (savoir)
savent|verb|know (savoir)
su|verb|known (savoir)
pouvoir|verb|to be able to
peux|verb|can (pouvoir)
peut|verb|can (pouvoir)
pouvons|verb|can (pouvoir)
pouvez|verb|can (pouvoir)
peuvent|verb|can (pouvoir)
pu|verb|been able (pouvoir)
vouloir|verb|to want
veux|verb|want (vouloir)
veut|verb|wants (vouloir)
voulons|verb|want (vouloir)
voulez|verb|want (vouloir)
veulent|verb|want (vouloir)
voulu|verb|wanted (vouloir)
devoir|verb|to have to
dois|verb|must (devoir)
doit|verb|must (devoir)
devons|verb|must (devoir)
devez|verb|must (devoir)
doivent|verb|must (devoir)
dû|verb|had to (devoir)
aller|verb|to go
vais|verb|go (aller)
vas|verb|go (aller)
va|verb|goes (aller)
allons|verb|go (aller)
allez|verb|go (aller)
vont|verb|go (aller)
allé|verb|gone (aller)
manger|verb|to eat
mange|verb|eat (manger)
manges|verb|eat (manger)
mangeons|verb|eat (manger)
mangez|verb|eat (manger)
mangent|verb|eat (manger)
mangé|verb|eaten (manger)
boire|verb|to drink
bois|verb|drink (boire)
boit|verb|drinks (boire)
bu|verb|drunk (boire)
parler|verb|to speak
parle|verb|speak (parler)
parles|verb|speak (parler)
parlons|verb|speak (parler)
parlez|verb|speak (parler)
parlent|verb|speak (parler)
parlé|verb|spoken (parler)
aimer|verb|to like / love
aime|verb|like / love (aimer)
aimes|verb|like / love (aimer)
aimons|verb|like / love (aimer)
aimez|verb|like / love (aimer)
aiment|verb|like / love (aimer)
aimé|verb|liked (aimer)
écrire|verb|to write
écris|verb|write (écrire)
écrit|verb|writes / written (écrire)
lire|verb|to read
lis|verb|read (lire)
lit|verb|reads (lire)
lu|verb|read (lire)
dormir|verb|to sleep
dors|verb|sleep (dormir)
dort|verb|sleeps (dormir)
finir|verb|to finish
finis|verb|finish (finir)
finit|verb|finishes (finir)
fini|verb|finished (finir)
attendre|verb|to wait
attends|verb|wait (attendre)
attend|verb|waits (attendre)
répondre|verb|to answer
comprendre|verb|to understand
comprends|verb|understand (comprendre)
comprend|verb|understands (comprendre)
compris|verb|understood (comprendre)
trouver|verb|to find
trouve|verb|find (trouver)
trouvé|verb|found (trouver)
donner|verb|to give
donne|verb|give (donner)
donné|verb|given (donner)
travailler|verb|to work
travaille|verb|work (travailler)
habiter|verb|to live
habite|verb|live (habiter)
acheter|verb|to buy
achète|verb|buy (acheter)
acheté|verb|bought (acheter)
tom|noun|Tom
rien|pron|nothing
toi|pron|you
moi|pron|me
est-ce|verb|is it
chose|noun|thing
dire|verb|to say
besoin|noun|need
temps|noun|time / weather
quelque|det|some
pense|verb|think
personne|pron|nobody / person
vu|verb|seen
travail|noun|work
vraiment|adv|really
français|noun|French
dois|verb|must / have to
fais|verb|do / make
as-tu|verb|do you have
encore|adv|again / still
faut|verb|must (it is needed)
avez-vous|verb|do you have
monde|noun|world / people
chez|prep|at (someone's place)
problème|noun|problem
aujourd'hui|adv|today
mieux|adv|better
même|adv|even / same
juste|adj|just / fair
ceci|pron|this
êtes-vous|verb|are you
ziri|noun|Ziri
seul|adj|alone / only
avait|verb|had
assez|adv|enough
été|verb|been
plaît|verb|pleases
prendre|verb|to take
vie|noun|life
es-tu|verb|are you
marie|noun|Marie
combien|adv|how much / many
eu|verb|had
tous|pron|all / everyone
puis-je|verb|may I
sami|noun|Sami
a-t-il|verb|does he have / has he
train|noun|train
quel|det|which / what
fois|noun|time (occasion)
pris|verb|taken
passé|adj|past / last
mary|noun|Mary
toutes|pron|all
savoir|verb|to know
chambre|noun|room / bedroom
jour|noun|day
soir|noun|evening
quelle|det|which / what
nuit|noun|night
toute|adj|all / whole
acheté|verb|bought
dû|verb|had to
soit|verb|be`,
  ja: `か|part|(question)
ですか|verb|is it?
には|part|to / at (+ topic)
する|verb|to do
よ|part|(emphasis)
した|verb|did
君|pron|you
のです|verb|it's that…
だった|verb|was
どう|adv|how
たくさん|adv|a lot
している|verb|is doing
仕事|noun|work / job
来る|verb|to come
行く|verb|to go
行った|verb|went
でしょう|verb|probably / right?
彼ら|pron|they
だろう|verb|probably
ね|part|right? / isn't it
知っている|verb|knows
し|part|and (also)
ではない|verb|is not
ない|adj|not / none
忙しい|adj|busy
今|noun|now
テニス|noun|tennis
知らない|verb|don't know
心配|noun|worry
そう|adv|so / like that
思います|verb|I think
英語|noun|English
つもり|noun|plan to / intention
たい|verb|want to
よい|adj|good
僕|pron|I
して|verb|do (and)
昨日|noun|yesterday
持っている|verb|has
思う|verb|to think
君の|pron|your
します|verb|do
について|part|about
行き|verb|go
賛成|noun|agreement
できない|verb|can't
から|part|from / because
なさい|verb|(do it!)
必要|adj|necessary
計画|noun|plan
美しい|adj|beautiful
住んでいる|verb|lives
知っています|verb|knows
時間|noun|time
になる|verb|becomes
天気|noun|weather
言う|verb|to say
成功|noun|success
本当|adj|true
医者|noun|doctor
持っています|verb|has
何か|pron|something
考え|noun|idea
話|noun|talk / story
なんて|part|such a / what a
言った|verb|said
お金|noun|money
近く|noun|nearby
雨|noun|rain
んです|verb|it's that…
買った|verb|bought
健康|noun|health
来た|verb|came
なければならない|verb|must
教えて|verb|tell me / teach me
会った|verb|met
幸せ|adj|happy
下さい|verb|please (give me)
である|verb|is
んだ|verb|it's that…
少し|adv|a little
かもしれない|verb|might
読む|verb|to read
そんな|det|that kind of
いない|verb|isn't here
ところ|noun|place / point
すぐ|adv|soon
事|noun|thing / matter
見た|verb|saw
いかが|adv|how about
満足|noun|satisfaction
すぐに|adv|right away
みんな|pron|everyone
お|part|(polite)
悪い|adj|bad
ロンドン|noun|London
なら|part|if
私達|pron|we
どんな|det|what kind of
宿題|noun|homework
来て|verb|come (and)
一緒に|adv|together
会い|verb|meet
正しい|adj|correct
できる|verb|can
旅行|noun|trip
すばらしい|adj|wonderful
わからない|verb|don't understand
行きます|verb|go
カメラ|noun|camera
楽しい|adj|fun
ではありません|verb|is not
まで|part|until
パーティー|noun|party
しました|verb|did
見る|verb|to see
行って|verb|go (and)
同じ|adj|same
欲しい|adj|want
起こった|verb|happened
東京|noun|Tokyo
どちら|pron|which
理解|noun|understanding
ことがあります|verb|have done before
反対|noun|opposition
問題|noun|problem
したい|verb|want to do
失敗|noun|failure
ん|part|(it's that)
病気|noun|illness
意見|noun|opinion
アメリカ|noun|America
話す|verb|to speak
勉強|noun|study
金持ち|noun|rich person
野球|noun|baseball
日本|noun|Japan
また|adv|again
いた|verb|was there
質問|noun|question
きっと|adv|surely
外出|noun|going out
しない|verb|don't do
名前|noun|name
いつ|adv|when
良い|adj|good
ようだ|verb|seems
どうして|adv|why
ほとんど|adv|almost
より|part|than
前|noun|before / front
食事|noun|meal
ペン|noun|pen
見せて|verb|show me
自分|pron|oneself
べき|verb|should
のに|conj|although
すべき|verb|should do
説明|noun|explanation
なぜ|adv|why
一番|adv|most / number one
らしい|verb|seems
何でも|pron|anything
着いた|verb|arrived
会う|verb|to meet
していた|verb|was doing
ちょっと|adv|a little
くれた|verb|gave (me)
もっと|adv|more
中|noun|inside
あまり|adv|not much
映画|noun|movie
結果|noun|result
ほしい|adj|want
あった|verb|there was
全く|adv|completely
少年|noun|boy
なかった|verb|wasn't / didn't
友人|noun|friend
になった|verb|became
ずっと|adv|all along
本当に|adv|really
見える|verb|can be seen
通り|noun|street / as
ニュース|noun|news
毎日|noun|every day
難しい|adj|difficult
できなかった|verb|couldn't
しています|verb|is doing
でも|part|but / even
何も|pron|nothing
まったく|adv|completely
辞書|noun|dictionary
時計|noun|clock / watch
出席|noun|attendance
だろうか|verb|I wonder
責任|noun|responsibility
写真|noun|photo
くれません|verb|won't (for me)
思った|verb|thought
になり|verb|becoming
間違い|noun|mistake
ことがある|verb|have done before
価値|noun|value
事故|noun|accident
音楽|noun|music
バス|noun|bus
大変|adj|tough / very
まもなく|adv|soon
散歩|noun|walk
提案|noun|suggestion
日曜日|noun|Sunday
いっぱい|adj|full
運転|noun|driving
金|noun|money / gold
だけ|part|only
なった|verb|became
なる|verb|to become
ホテル|noun|hotel
いった|verb|went
注意|noun|caution
しなかった|verb|didn't do
上|noun|top / above
驚いた|verb|was surprised
以前|noun|before
日|noun|day
知らせ|noun|news
試験|noun|exam
絵|noun|picture
ために|part|for / in order to
できます|verb|can
終わった|verb|finished
午後|noun|afternoon
正直|adj|honest
雪|noun|snow
きた|verb|came
道|noun|road / way
聞いて|verb|listen / ask (and)
見て|verb|look (and)
ため|noun|sake / purpose
しまった|verb|ended up doing
どのくらい|adv|how long / much
物|noun|thing
聞いた|verb|heard / asked
よろしい|adj|fine
なんだ|verb|what is it
我慢|noun|patience
今夜|noun|tonight
手伝って|verb|help (me)
会議|noun|meeting
すべて|noun|everything
どうぞ|adv|please (go ahead)
兄|noun|older brother
列車|noun|train
のだ|verb|it's that…
多く|noun|many
最近|noun|recently
家族|noun|family
生徒|noun|student
料理|noun|cooking / dish
長い|adj|long
ひどい|adj|terrible
しよう|verb|let's do
時々|adv|sometimes
幸福|noun|happiness
上手|adj|good at
読み|verb|read
だれ|pron|who
時|noun|time / when
早く|adv|early / quickly
彼らの|pron|their
息子|noun|son
我々|pron|we
誰も|pron|nobody
でしょうか|verb|I wonder / is it?
やった|verb|did
何時|noun|what time
ピアノ|noun|piano
かどうか|part|whether
到着|noun|arrival
わけではない|verb|it's not that
答え|noun|answer
勉強する|verb|to study
とき|noun|when / time
若い|adj|young
テーブル|noun|table
少女|noun|girl
誰か|pron|someone
以上|noun|more than
努力|noun|effort
決して|adv|never
という|part|called / that
人々|noun|people
うまく|adv|well
もらった|verb|received
風|noun|wind
って|part|(quote)
動物|noun|animal
フランス語|noun|French
みな|pron|everyone
ラジオ|noun|radio
いただけます|verb|could I have / could you
方がいい|adj|had better
パリ|noun|Paris
ように|part|so that / like
これらの|det|these
方|noun|way / person / side
よりも|part|than
夜|noun|night
靴|noun|shoes
かなり|adv|quite
言って|verb|say (and)
夏|noun|summer
ましょうか|verb|shall we / shall I
子供たち|noun|children
庭|noun|garden
事実|noun|fact
くれる|verb|give (me)
必ず|adv|definitely
昨夜|noun|last night
歩いて|verb|on foot / walk (and)
皆|pron|everyone
お父さん|noun|father
ニューヨーク|noun|New York
約束|noun|promise
帽子|noun|hat
たいへん|adv|very / tough
休暇|noun|vacation
外国|noun|foreign country
いう|verb|say / called
利用|noun|use
たち|part|(plural)
ご|part|(polite)
いけません|verb|must not
人間|noun|human
ばかり|part|only / just
わ|part|(emphasis)
外|noun|outside
強い|adj|strong
好きな|adj|favorite
助け|noun|help
もう一度|adv|once more
もう少し|adv|a little more
いけない|verb|must not
よう|noun|like / way
川|noun|river
大きな|det|big
目|noun|eye
であった|verb|was
木|noun|tree
非常に|adv|very
後|noun|after / later
返事|noun|reply
大学|noun|university
いくら|adv|how much
夕食|noun|dinner
今朝|noun|this morning
席|noun|seat
他人|noun|others
京都|noun|Kyoto
銀行|noun|bank
どこか|pron|somewhere
ほうがいい|adj|had better
結局|adv|after all
故障|noun|breakdown
書いた|verb|wrote
男|noun|man
手|noun|hand
次の|det|next
山|noun|mountain
試合|noun|game / match
体|noun|body
人生|noun|life
女の子|noun|girl
娘|noun|daughter
冬|noun|winter
箱|noun|box
女性|noun|woman
夢|noun|dream
ほど|part|about / as much as
姉|noun|older sister
だから|conj|so
音|noun|sound
昼食|noun|lunch
妻|noun|wife
忠告|noun|advice
足|noun|foot / leg
真実|noun|truth
やる|verb|to do
じゃない|verb|isn't
会社|noun|company
子|noun|child
ので|part|because
両親|noun|parents
飛行機|noun|airplane
なければ|verb|must / if not
どの|det|which
多い|adj|many
全部|noun|all
すべての|det|all
予定|noun|plan
見えた|verb|could be seen
小さな|det|small
ただ|adv|just / only
来週|noun|next week
なあ|part|(wow / I wish)
すれば|verb|if (you) do
入って|verb|come in / enter
朝|noun|morning
小説|noun|novel
出た|verb|left / came out
歩いた|verb|walked
ことがない|verb|have never
寒い|adj|cold
冗談|noun|joke
食べ物|noun|food
さ|part|(casual emphasis)
始めた|verb|started
顔|noun|face
とは|part|that / as for
にとって|part|for (someone)
老人|noun|old person
危険|noun|danger
のように|part|like
湖|noun|lake
こんな|det|this kind of
させた|verb|made (someone do)
うち|noun|home / inside
一生懸命|adv|as hard as you can
十分|adj|enough
いただけません|verb|can't (have / do)
ドレス|noun|dress
タクシー|noun|taxi
分からない|verb|don't understand
尊敬|noun|respect
一人で|adv|alone
修理|noun|repair
滞在|noun|stay
国|noun|country
にも|part|also (to)
なって|verb|become (and)
言葉|noun|word / language
くれ|verb|give me
行動|noun|action
服|noun|clothes
そんなに|adv|that much
嵐|noun|storm
ついに|adv|finally
電車|noun|train
春|noun|spring
いつでも|adv|any time
心|noun|heart / mind
ことができる|verb|can
クラス|noun|class
できるだけ|adv|as much as possible
男の子|noun|boy
お母さん|noun|mother
所|noun|place
意味|noun|meaning
ちょうど|adv|just / exactly
下|noun|below
コート|noun|coat
たくない|verb|don't want to
しましょう|verb|let's do
村|noun|village
二人|noun|two people
に対して|part|toward / against
うまい|adj|good / tasty
気分|noun|mood / feeling
頭|noun|head
生活|noun|life / living
なければなりません|verb|must
母親|noun|mother
しか|part|only (with not)
になって|verb|become (and)
お願いします|verb|please
橋|noun|bridge
場所|noun|place
誰でも|pron|anyone
月|noun|moon / month
しばしば|adv|often
今晩|noun|this evening
決心|noun|decision
けど|part|but
食べる|verb|to eat
建物|noun|building
風邪|noun|a cold
今年|noun|this year
貸して|verb|lend (me)
出発|noun|departure
したら|verb|if / when (you) do
自分で|adv|by yourself
そうだ|verb|I hear / looks like
やって|verb|do (and)
達|part|(plural)
空|noun|sky
ひどく|adv|terribly
声|noun|voice
速く|adv|fast
年|noun|year
一つ|noun|one (thing)
無駄|adj|useless / a waste
良く|adv|well / often
書く|verb|to write
理由|noun|reason
遅刻|noun|being late
まま|noun|as it is
援助|noun|help / aid
されている|verb|is being done
船|noun|ship
言っている|verb|is saying
昔|noun|long ago
演説|noun|speech
薬|noun|medicine
すぎる|verb|too (much)
突然|adv|suddenly
ような|part|like
によって|part|by / depending on
歌|noun|song
として|part|as
ぞ|part|(emphasis)
とした|verb|tried to
間|noun|between / while
赤ん坊|noun|baby
われわれ|pron|we
研究|noun|research
秘密|noun|secret
ではなかった|verb|wasn't
違う|verb|is different / wrong
朝食|noun|breakfast
準備|noun|preparation
死|noun|death
チーム|noun|team
一人|noun|one person
今度|noun|this / next time
機械|noun|machine
赤ちゃん|noun|baby
似ている|verb|looks like
食べ|verb|eat
出かける|verb|to go out
点|noun|point
よかった|adj|was good / glad
思っている|verb|is thinking
もし|adv|if
コンピューター|noun|computer
どれくらい|adv|how much / long
数学|noun|math
される|verb|is done (to)
など|part|and so on
うれしい|adj|happy
どうしても|adv|no matter what
スキー|noun|skiing`,
};
const RS_DICT = {};
for (const [lang, src] of Object.entries(RS_DICT_SRC)) {
  const m = new Map(); for (const line of src.split('\n')) { const [w, t, g] = line.split('|'); if (w && t) m.set(w.trim().toLowerCase(), [t.trim(), (g || '').trim()]); }
  RS_DICT[lang] = m;
}
