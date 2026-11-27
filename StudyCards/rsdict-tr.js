'use strict';
/* ================= Sentence Builder: Turkish word list for the real sentences =================
   Type and meaning for common Turkish words in the real sentences (data/real-tr.json) that the builder's own word lists
   don't cover. One word per line: word|type|meaning. Types: noun verb adj adv pron det prep conj. Verbs are listed as
   -mak / -mek: rstag-tr.js finds their forms (geliyorum, gitti, okuyacak) from the stem. Nouns and describing words are
   listed plain: their endings (evde, kitabı, arkadaşlarım) are found the same way. Loaded after rsdict.js. */
RS_DICT_SRC.tr = `zorunda|adj|has to / must
ne|pron|what
hakkında|prep|about
değildi|part|was not
musun|part|(question: you)
misin|part|(question: you)
mısın|part|(question: you)
müsün|part|(question: you)
görünmek|verb|to seem / to look
görünüyor|verb|seems / looks
olmadığını|verb|that (it) isn’t / wasn’t
etti|verb|did / made
tam|adj|exact / full / just
muhtemelen|adv|probably
oldukça|adv|quite
biri|pron|someone / one of them
fazla|adv|too much / more
kez|noun|time (once, twice)
üç|det|three
iki|det|two
tekrar|adv|again
birlikte|adv|together
merak|noun|curiosity (merak etmek: to wonder)
kimse|pron|nobody / anybody
geri|adv|back
seninle|pron|with you
onunla|pron|with him / her
buraya|adv|(to) here
hiçbir|det|no / none
neredeyse|adv|almost
az|adv|little / few
sami|noun|Sami
leyla|noun|Leyla
boston|noun|Boston
birkaç|det|a few
geçen|adj|last (week, year)
kabul|noun|acceptance (kabul etmek: to accept)
şekil|noun|shape / way
karar|noun|decision (karar vermek: to decide)
herhangi|det|any
sık|adv|often
asla|adv|never
izin|noun|permission
bütün|det|all / whole
tüm|det|all
birçok|det|many
nedir|pron|what is
ya|conj|or / what about
tek|adj|only / single
kaç|det|how many
ışık|noun|light
tom|noun|Tom
mary|noun|Mary
şey|noun|thing
zaman|noun|time
gün|noun|day
yıl|noun|year
saat|noun|hour / o’clock / watch
dakika|noun|minute
hafta|noun|week
ay|noun|month / moon
akşam|noun|evening
sabah|noun|morning
gece|noun|night
iş|noun|work / job
para|noun|money
yer|noun|place / ground
yol|noun|road / way
şehir|noun|city
ülke|noun|country
dünya|noun|world
insan|noun|person / people
kişi|noun|person
adam|noun|man
erkek|noun|man / boy / male
kadın|noun|woman
kız|noun|girl / daughter
oğul|noun|son
çocuk|noun|child
aile|noun|family
anne|noun|mother
baba|noun|father
kardeş|noun|brother / sister
abla|noun|older sister
ağabey|noun|older brother
dede|noun|grandfather
nine|noun|grandmother
eş|noun|husband / wife
koca|noun|husband
arkadaş|noun|friend
öğretmen|noun|teacher
öğrenci|noun|student
doktor|noun|doctor
ev|noun|house / home
oda|noun|room
kapı|noun|door
pencere|noun|window
masa|noun|table
sandalye|noun|chair
yatak|noun|bed
araba|noun|car
otobüs|noun|bus
tren|noun|train
uçak|noun|plane
okul|noun|school
sınıf|noun|class / classroom
ders|noun|lesson
soru|noun|question
cevap|noun|answer
kitap|noun|book
mektup|noun|letter
kelime|noun|word
söz|noun|word / promise
dil|noun|language / tongue
türkçe|noun|Turkish
ingilizce|noun|English
fransızca|noun|French
almanca|noun|German
japonca|noun|Japanese
isim|noun|name
ad|noun|name
fikir|noun|idea
hayat|noun|life
sorun|noun|problem
problem|noun|problem
yardım|noun|help
haber|noun|news
hikâye|noun|story
müzik|noun|music
şarkı|noun|song
film|noun|film
oyun|noun|game / play
resim|noun|picture
fotoğraf|noun|photo
telefon|noun|phone
bilgisayar|noun|computer
su|noun|water
çay|noun|tea
kahve|noun|coffee
süt|noun|milk
yemek|noun|food / meal
ekmek|noun|bread
et|noun|meat
balık|noun|fish
elma|noun|apple
meyve|noun|fruit
sebze|noun|vegetable
şeker|noun|sugar / sweet
kedi|noun|cat
köpek|noun|dog
kuş|noun|bird
at|noun|horse
hava|noun|weather / air
yağmur|noun|rain
kar|noun|snow
güneş|noun|sun
deniz|noun|sea
göl|noun|lake
nehir|noun|river
dağ|noun|mountain
ağaç|noun|tree
çiçek|noun|flower
bahçe|noun|garden
park|noun|park
mağaza|noun|shop
market|noun|shop / supermarket
hastane|noun|hospital
istasyon|noun|station
havaalanı|noun|airport
kütüphane|noun|library
restoran|noun|restaurant
otel|noun|hotel
oda|noun|room
el|noun|hand
göz|noun|eye
baş|noun|head
kafa|noun|head
ağız|noun|mouth
burun|noun|nose
kulak|noun|ear
ayak|noun|foot
kol|noun|arm
bacak|noun|leg
kalp|noun|heart
yüz|noun|face / hundred
saç|noun|hair
ses|noun|voice / sound
renk|noun|colour
kıyafet|noun|clothes
elbise|noun|dress
ayakkabı|noun|shoe
çanta|noun|bag
anahtar|noun|key
kalem|noun|pen
kâğıt|noun|paper
kağıt|noun|paper
hediye|noun|present
doğum günü|noun|birthday
tatil|noun|holiday
hafta sonu|noun|weekend
bugün|adv|today
yarın|adv|tomorrow
dün|adv|yesterday
iyi|adj|good / well
kötü|adj|bad
güzel|adj|beautiful / nice
büyük|adj|big
küçük|adj|small
yeni|adj|new
eski|adj|old
genç|adj|young
yaşlı|adj|old (people)
uzun|adj|long / tall
kısa|adj|short
sıcak|adj|hot
soğuk|adj|cold
kolay|adj|easy
zor|adj|hard / difficult
mutlu|adj|happy
üzgün|adj|sad
yorgun|adj|tired
hasta|adj|ill
meşgul|adj|busy
hazır|adj|ready
doğru|adj|right / true
yanlış|adj|wrong
önemli|adj|important
pahalı|adj|expensive
ucuz|adj|cheap
zengin|adj|rich
fakir|adj|poor
akıllı|adj|clever
aptal|adj|silly
güçlü|adj|strong
hızlı|adj|fast
yavaş|adj|slow
erken|adj|early
geç|adj|late
boş|adj|empty / free
dolu|adj|full
açık|adj|open
kapalı|adj|closed
temiz|adj|clean
kirli|adj|dirty
lezzetli|adj|delicious
tatlı|adj|sweet
aç|adj|hungry
tok|adj|full (after eating)
susamış|adj|thirsty
ilginç|adj|interesting
harika|adj|wonderful
kırmızı|adj|red
mavi|adj|blue
yeşil|adj|green
sarı|adj|yellow
siyah|adj|black
beyaz|adj|white
ilk|adj|first
son|adj|last / end
başka|adj|other / another
aynı|adj|same
farklı|adj|different
gerçek|adj|real
emin|adj|sure
mümkün|adj|possible
sessiz|adj|quiet
olmak|verb|to be / to become
etmek|verb|to do / to make
yapmak|verb|to do / to make
gitmek|verb|to go
gelmek|verb|to come
dönmek|verb|to return / to turn
görmek|verb|to see
bakmak|verb|to look
izlemek|verb|to watch
duymak|verb|to hear
dinlemek|verb|to listen
bilmek|verb|to know
tanımak|verb|to know (someone)
anlamak|verb|to understand
düşünmek|verb|to think
sanmak|verb|to think / to suppose
inanmak|verb|to believe
istemek|verb|to want
sevmek|verb|to love / to like
beğenmek|verb|to like
söylemek|verb|to say / to tell
demek|verb|to say
konuşmak|verb|to speak / to talk
sormak|verb|to ask
cevaplamak|verb|to answer
anlatmak|verb|to tell / to explain
okumak|verb|to read / to study
yazmak|verb|to write
öğrenmek|verb|to learn
öğretmek|verb|to teach
çalışmak|verb|to work / to study
oynamak|verb|to play
yemek|verb|to eat
içmek|verb|to drink
uyumak|verb|to sleep
uyanmak|verb|to wake up
kalkmak|verb|to get up
oturmak|verb|to sit / to live
durmak|verb|to stop / to stand
beklemek|verb|to wait
almak|verb|to take / to buy
vermek|verb|to give
satmak|verb|to sell
ödemek|verb|to pay
getirmek|verb|to bring
götürmek|verb|to take (somewhere)
bulmak|verb|to find
aramak|verb|to look for / to call
kaybetmek|verb|to lose
kazanmak|verb|to win / to earn
açmak|verb|to open
kapatmak|verb|to close / to turn off
başlamak|verb|to begin
bitirmek|verb|to finish
bitmek|verb|to end
yaşamak|verb|to live
ölmek|verb|to die
koşmak|verb|to run
yürümek|verb|to walk
yüzmek|verb|to swim
binmek|verb|to get on / to ride
inmek|verb|to get off / to go down
girmek|verb|to enter
çıkmak|verb|to go out / to leave
kalmak|verb|to stay
ayrılmak|verb|to leave
gelişmek|verb|to develop
yardım etmek|verb|to help
denemek|verb|to try
unutmak|verb|to forget
hatırlamak|verb|to remember
kullanmak|verb|to use
sürmek|verb|to drive / to last
seyahat etmek|verb|to travel
taşımak|verb|to carry
koymak|verb|to put
bırakmak|verb|to leave / to let go
göstermek|verb|to show
hissetmek|verb|to feel
gülmek|verb|to laugh
ağlamak|verb|to cry
korkmak|verb|to be afraid
sevinmek|verb|to be glad
yorulmak|verb|to get tired
pişirmek|verb|to cook
yıkamak|verb|to wash
temizlemek|verb|to clean
giymek|verb|to wear / to put on
uçmak|verb|to fly
düşmek|verb|to fall
kırmak|verb|to break
tutmak|verb|to hold
çekmek|verb|to pull
itmek|verb|to push
atmak|verb|to throw
evlenmek|verb|to marry
doğmak|verb|to be born
büyümek|verb|to grow
değişmek|verb|to change
gerekmek|verb|to be needed
lazım|adj|needed
nerede|adv|where
neden|adv|why
şimdi|adv|now
çok|adv|very / a lot
burada|adv|here
orada|adv|there
saat|noun|hour / o’clock`;
{ const m = new Map(); for (const line of RS_DICT_SRC.tr.split('\n')) { const [w, t, g] = line.split('|'); if (w && t && !m.has(w.trim())) m.set(w.trim(), [t.trim(), (g || '').trim()]); } RS_DICT.tr = m; }
