'use strict';
/* ================= Sentence Builder · 📖 Real sentences: Korean word types and meanings =================
   Korean words carry their particles and endings (학교에, 먹었어요), so a word is tagged by what's left after the
   particle comes off (학교 + 에 → a noun, “school + to”) or by its verb ending (먹었어요 → 먹다 → a verb, “ate”).
   The word list below gives the commonest words in the Korean sentences; verb and describing-word forms are made from
   their dictionary form by the Sentence Builder's rules (builder-ko.js). A word that can't be tagged with confidence
   gets no label. Loaded after rstag.js and builder-ko.js. */
RS_LANGS.ko = 'Korean';
// word|type|meaning. Verbs and describing words in their dictionary form (-다); their other forms are made below.
const RS_KO_WORDS = `있다|verb|be / have
없다|verb|not be / not have
하다|verb|do
되다|verb|become
않다|verb|not (do)
싶다|verb|want to
같다|adj|same / seem
좋아하다|verb|like
사랑하다|verb|love
알다|verb|know
모르다|verb|not know
가다|verb|go
오다|verb|come
보다|verb|see / watch
주다|verb|give
먹다|verb|eat
마시다|verb|drink
말하다|verb|say / speak
얘기하다|verb|talk
이야기하다|verb|talk
생각하다|verb|think
배우다|verb|learn
공부하다|verb|study
가르치다|verb|teach
살다|verb|live
일하다|verb|work
필요하다|adj|needed
원하다|verb|want
바라다|verb|hope
웃다|verb|laugh / smile
울다|verb|cry
앉다|verb|sit
서다|verb|stand
쓰다|verb|write / use
읽다|verb|read
듣다|verb|hear / listen
만나다|verb|meet
사다|verb|buy
팔다|verb|sell
돕다|verb|help
도와주다|verb|help
기다리다|verb|wait
일어나다|verb|get up
떠나다|verb|leave
시작하다|verb|start
끝나다|verb|end
도착하다|verb|arrive
걸리다|verb|take (time) / catch
믿다|verb|believe
잊다|verb|forget
찾다|verb|look for / find
받다|verb|receive
입다|verb|wear
타다|verb|ride / take
치다|verb|play / hit
놀다|verb|play
자다|verb|sleep
이기다|verb|win
노력하다|verb|try hard
걱정하다|verb|worry
부탁하다|verb|ask a favor
가지다|verb|have / hold
갖다|verb|have
보이다|verb|seem / be seen
들다|verb|lift / hold
들리다|verb|be heard
열다|verb|open
닫다|verb|close
돌아오다|verb|come back
돌아가다|verb|go back
나가다|verb|go out
나오다|verb|come out
들어가다|verb|go in
들어오다|verb|come in
보내다|verb|send / spend
빌리다|verb|borrow
만들다|verb|make
요리하다|verb|cook
수영하다|verb|swim
운동하다|verb|exercise
달리다|verb|run
뛰다|verb|run / jump
걷다|verb|walk
부르다|verb|sing / call
노래하다|verb|sing
춤추다|verb|dance
고르다|verb|choose
사라지다|verb|disappear
살아남다|verb|survive
조심하다|verb|be careful
용서하다|verb|forgive
이해하다|verb|understand
결정하다|verb|decide
대답하다|verb|answer
묻다|verb|ask
전화하다|verb|call
운전하다|verb|drive
청소하다|verb|clean
씻다|verb|wash
잡다|verb|catch
던지다|verb|throw
눕다|verb|lie down
쉬다|verb|rest
준비하다|verb|prepare
사용하다|verb|use
여행하다|verb|travel
방문하다|verb|visit
계속하다|verb|keep doing
그만하다|verb|stop
멈추다|verb|stop
바꾸다|verb|change
잃다|verb|lose
내리다|verb|get off / fall
오르다|verb|climb / rise
생기다|verb|happen / look
계시다|verb|be (polite)
드리다|verb|give (polite)
말씀하다|verb|speak (polite)
보여주다|verb|show
가져오다|verb|bring
데려가다|verb|take (someone)
늙다|verb|get old
오래되다|verb|be old
흐르다|verb|flow
빛나다|verb|shine
지르다|verb|shout
지나다|verb|pass
즐기다|verb|enjoy
성공하다|verb|succeed
실수하다|verb|make a mistake
죽다|verb|die
낫다|adj|better
좋다|adj|good
나쁘다|adj|bad
크다|adj|big
작다|adj|small
많다|adj|many / a lot
적다|adj|few
아프다|adj|sick / sore
바쁘다|adj|busy
어렵다|adj|hard
쉽다|adj|easy
재미있다|adj|fun / interesting
재미없다|adj|boring
맛있다|adj|delicious
맛없다|adj|not tasty
아름답다|adj|beautiful
예쁘다|adj|pretty
귀엽다|adj|cute
무섭다|adj|scary
괜찮다|adj|okay
이상하다|adj|strange
새롭다|adj|new
똑똑하다|adj|smart
멋있다|adj|cool
빠르다|adj|fast
느리다|adj|slow
덥다|adj|hot
춥다|adj|cold
차갑다|adj|cold
뜨겁다|adj|hot
배고프다|adj|hungry
피곤하다|adj|tired
행복하다|adj|happy
슬프다|adj|sad
기쁘다|adj|glad
다르다|adj|different
맞다|verb|be right
미안하다|adj|sorry
죄송하다|adj|sorry
고맙다|adj|thankful
감사하다|adj|thankful
조용하다|adj|quiet
깨끗하다|adj|clean
친절하다|adj|kind
비싸다|adj|expensive
싸다|adj|cheap
길다|adj|long
짧다|adj|short
높다|adj|high / tall
낮다|adj|low
멀다|adj|far
가깝다|adj|close
무겁다|adj|heavy
가볍다|adj|light
밝다|adj|bright
어둡다|adj|dark
젊다|adj|young
어리다|adj|young
유명하다|adj|famous
중요하다|adj|important
충분하다|adj|enough
가능하다|adj|possible
위험하다|adj|dangerous
건강하다|adj|healthy
편하다|adj|comfortable
심심하다|adj|bored
궁금하다|adj|curious
졸리다|adj|sleepy
쉬다|verb|rest
빨갛다|adj|red
하얗다|adj|white
까맣다|adj|black
파랗다|adj|blue
노랗다|adj|yellow
말다|verb|don't
그만두다|verb|quit
틀리다|verb|be wrong
바뀌다|verb|change
다치다|verb|get hurt
잃어버리다|verb|lose
끝내다|verb|finish
주문하다|verb|order
그리다|verb|draw
깊다|adj|deep
좁다|adj|narrow
넓다|adj|wide
강하다|adj|strong
외롭다|adj|lonely
집중하다|verb|focus
대화하다|verb|talk
늦다|adj|late
친하다|adj|close (friends)
일어서다|verb|stand up
기억하다|verb|remember
잃다|verb|lose
알아보다|verb|find out
떨어지다|verb|fall
놓다|verb|put
넣다|verb|put in
켜다|verb|turn on
보다|verb|see / watch
죽이다|verb|kill
피우다|verb|smoke
맡다|verb|take charge / smell
싫다|adj|disliked
싫어하다|verb|hate / dislike
무서워하다|verb|be afraid
행복해하다|verb|be happy
들어보다|verb|hear of
안녕하다|adj|well (hello)`;
// nouns, pronouns, adverbs and the little words: word|type|meaning (also the 🎯 Practice word pool)
RS_DICT_SRC.ko = `사람|noun|person
사람들|noun|people
톰|noun|Tom
메리|noun|Mary
탐|noun|Tom
존|noun|John
프랑스어|noun|French
영어|noun|English
한국어|noun|Korean
일본어|noun|Japanese
중국어|noun|Chinese
독일어|noun|German
스페인어|noun|Spanish
보스턴|noun|Boston
호주|noun|Australia
오스트레일리아|noun|Australia
캐나다|noun|Canada
프랑스|noun|France
일본|noun|Japan
미국|noun|America
한국|noun|Korea
중국|noun|China
영국|noun|England
아프리카|noun|Africa
집|noun|house / home
학교|noun|school
책|noun|book
돈|noun|money
시간|noun|time
일|noun|work / day
말|noun|word / horse
물|noun|water
차|noun|car / tea
비|noun|rain
눈|noun|snow / eye
문제|noun|problem
도움|noun|help
고양이|noun|cat
개|noun|dog
원숭이|noun|monkey
동물|noun|animal
새|noun|bird
음식|noun|food
음악|noun|music
노래|noun|song
친구|noun|friend
선생님|noun|teacher
학생|noun|student
아이|noun|child
아이들|noun|children
남자|noun|man
여자|noun|woman
소년|noun|boy
소녀|noun|girl
가족|noun|family
엄마|noun|mom
아빠|noun|dad
어머니|noun|mother
아버지|noun|father
형제|noun|brother
형|noun|older brother
누나|noun|older sister
언니|noun|older sister
오빠|noun|older brother
동생|noun|younger sibling
이름|noun|name
언어|noun|language
문장|noun|sentence
단어|noun|word
질문|noun|question
대답|noun|answer
생각|noun|thought / idea
꿈|noun|dream
기분|noun|mood / feeling
마음|noun|heart / mind
머리|noun|head / hair
손|noun|hand
발|noun|foot
키|noun|height
얼굴|noun|face
아침|noun|morning / breakfast
점심|noun|lunch
저녁|noun|evening / dinner
밤|noun|night
주말|noun|weekend
월요일|noun|Monday
화요일|noun|Tuesday
수요일|noun|Wednesday
목요일|noun|Thursday
금요일|noun|Friday
토요일|noun|Saturday
일요일|noun|Sunday
날씨|noun|weather
방|noun|room
문|noun|door
창문|noun|window
버스|noun|bus
지하철|noun|subway
기차|noun|train
비행기|noun|plane
은행|noun|bank
아파트|noun|apartment
파티|noun|party
숙제|noun|homework
시계|noun|watch / clock
열쇠|noun|key
컴퓨터|noun|computer
전화|noun|phone / call
핸드폰|noun|phone
사진|noun|photo
영화|noun|movie
게임|noun|game
테니스|noun|tennis
축구|noun|soccer
피아노|noun|piano
기타|noun|guitar
피자|noun|pizza
계란|noun|egg
사과|noun|apple
빵|noun|bread
커피|noun|coffee
우유|noun|milk
밥|noun|rice / meal
고기|noun|meat
생선|noun|fish
약|noun|medicine
병원|noun|hospital
의사|noun|doctor
회사|noun|company
직업|noun|job
세상|noun|world
인생|noun|life
사실|noun|fact / truth
진실|noun|truth
거짓말|noun|lie
실수|noun|mistake
방법|noun|way
이유|noun|reason
기회|noun|chance
가치|noun|value
관심|noun|interest
걱정|noun|worry
공기|noun|air
하늘|noun|sky
바다|noun|sea
산|noun|mountain
강|noun|river
나무|noun|tree
꽃|noun|flower
공원|noun|park
도시|noun|city
나라|noun|country
길|noun|road / way
소설|noun|novel
편지|noun|letter
신문|noun|newspaper
선물|noun|gift
옷|noun|clothes
신발|noun|shoes
안경|noun|glasses
가방|noun|bag
우산|noun|umbrella
배|noun|boat / stomach / pear
수|noun|way (can)
것|noun|thing
거|noun|thing
적|noun|time (ever)
때|noun|time / when
줄|noun|how / that
데|noun|place
중|noun|middle / while
곳|noun|place
번|noun|time(s)
명|noun|people (counter)
살|noun|years old
년|noun|year
달|noun|month / moon
별|noun|star
동안|noun|during
전|noun|before
후|noun|after
다음|noun|next
처음|noun|first time
마지막|noun|last
이상|noun|more than
밖|noun|outside
위|noun|on / above
밑|noun|under
아래|noun|under
앞|noun|front
뒤|noun|behind
옆|noun|next to
근처|noun|near
때문|noun|because of
대해|noun|about
위해|noun|for
비명|noun|scream
두통|noun|headache
감기|noun|cold (illness)
식당|noun|restaurant
가게|noun|store
시장|noun|market
도서관|noun|library
역|noun|station
남편|noun|husband
아내|noun|wife
고등학교|noun|high school
대학교|noun|university
선수|noun|player
경기|noun|game / match
공|noun|ball
자전거|noun|bike
의자|noun|chair
책상|noun|desk
요리|noun|cooking
여행|noun|trip
휴가|noun|vacation
뉴스|noun|news
목소리|noun|voice
소리|noun|sound
색|noun|color
빨간색|noun|red
파란색|noun|blue
여름|noun|summer
겨울|noun|winter
봄|noun|spring
가을|noun|fall
고향|noun|hometown
나이|noun|age
얘기|noun|talk / story
이야기|noun|story
부모님|noun|parents
법|noun|way / law
필요|noun|need
최선|noun|best
안|noun|inside
하나|noun|one
둘|noun|two
셋|noun|three
넷|noun|four
다섯|noun|five
여섯|det|six
일곱|det|seven
여덟|det|eight
아홉|det|nine
열|det|ten
잠|noun|sleep
일주일|noun|a week
어젯밤|noun|last night
생일|noun|birthday
증거|noun|evidence
희망|noun|hope
인기|noun|popularity
과학|noun|science
인간|noun|human
운|noun|luck
춤|noun|dance
소식|noun|news
답장|noun|reply
교수|noun|professor
수영|noun|swimming
운전|noun|driving
설거지|noun|dishes
달리기|noun|running
크리스마스|noun|Christmas
이해|noun|understanding
어려움|noun|difficulty
원인|noun|cause
지도|noun|map
조각|noun|piece
나|pron|I
저|pron|I
너|pron|you
우리|pron|we
저희|pron|we
그|pron|he / that
그녀|pron|she
그들|pron|they
당신|pron|you
너희|pron|you all
자기|pron|oneself
자신|pron|oneself
이것|pron|this
그것|pron|that / it
저것|pron|that
이거|pron|this
그거|pron|that / it
저거|pron|that
여기|pron|here
거기|pron|there
저기|pron|over there
어디|pron|where
누구|pron|who
누가|pron|who
뭐|pron|what
무엇|pron|what
뭔가|pron|something
무언가|pron|something
누군가|pron|someone
아무도|pron|nobody
아무것도|pron|nothing
모두|pron|everyone / all
모두들|pron|everyone
전부|pron|all
누구나|pron|anyone
누구도|pron|nobody
이|det|this
그|det|that
저|det|that
무슨|det|what (kind of)
어떤|det|some / what kind of
어느|det|which
모든|det|all / every
몇|det|a few / how many
다른|det|other
한|det|one / a
두|det|two
세|det|three
네|det|your / four
새|det|new
이런|det|this kind of
그런|det|that kind of
저런|det|that kind of
아무|det|any
여러|det|several
몇몇|det|some
이번|det|this (time)
지난|det|last
안|adv|not
못|adv|can't
왜|adv|why
좀|adv|a little / please
너무|adv|too / so
정말|adv|really
진짜|adv|really
정말로|adv|really
진짜로|adv|really
잘|adv|well
더|adv|more
가장|adv|most
제일|adv|most
아주|adv|very
매우|adv|very
참|adv|really
꽤|adv|quite
지금|adv|now
이제|adv|now
아직|adv|still / yet
아직도|adv|still
계속|adv|keep / all the time
그만|adv|stop
그렇게|adv|like that / so
이렇게|adv|like this / so
이렇게나|adv|this much
얼마나|adv|how (much)
어떻게|adv|how
거의|adv|almost
같이|adv|together
함께|adv|together
다|adv|all
다시|adv|again
다시는|adv|never again
절대|adv|never
열심히|adv|hard
항상|adv|always
늘|adv|always
많이|adv|a lot
바로|adv|right (away)
빨리|adv|quickly
그냥|adv|just
훨씬|adv|much (more)
조금|adv|a little
전혀|adv|(not) at all
곧|adv|soon
또|adv|again / also
별로|adv|(not) very
자주|adv|often
가끔|adv|sometimes
이미|adv|already
벌써|adv|already
한번|adv|once
조용히|adv|quietly
제발|adv|please
일찍|adv|early
늦게|adv|late
혼자|adv|alone
혼자서|adv|alone
오래|adv|long
서로|adv|each other
단지|adv|only
아마|adv|maybe
오직|adv|only
당장|adv|right now
천천히|adv|slowly
가만히|adv|still
먼저|adv|first
충분히|adv|enough
직접|adv|in person
하루종일|adv|all day
보통|adv|usually
막|adv|just
세게|adv|hard
밝게|adv|brightly
마침내|adv|finally
오늘|adv|today
내일|adv|tomorrow
어제|adv|yesterday
매일|adv|every day
언제|adv|when
나중에|adv|later
아까|adv|earlier
방금|adv|just now
한때|adv|once
그러니까|conj|so
그리고|conj|and
그래서|conj|so
하지만|conj|but
그러나|conj|but
그런데|conj|but / by the way
근데|conj|but
그럼|conj|then
그러면|conj|then
또는|conj|or
네|adv|yes
예|adv|yes
아니|adv|no
아니요|adv|no
응|adv|yeah`;
{ const m = new Map(); for (const line of RS_DICT_SRC.ko.split('\n')) { const [w, t, g] = line.split('|'); if (w && t && !m.has(w)) m.set(w, [t, g || '']); } RS_DICT.ko = m; }

/* every form of a verb or describing word: 먹다 → 먹어요, 먹어, 먹었어, 먹는, 먹고, 먹으면, 먹을, 먹습니다… */
function koEu(st, rest) {   // stem + an ending that starts with 으 after a consonant: 먹으면, 가면, 살면 / 사세요, 추우면, 들으면
  const x = koLast(st); if (!x) return st + rest;
  const jamo = { 'ㄴ': 4, 'ㄹ': 8, 'ㅂ': 17 }[rest[0]], tail = jamo ? rest.slice(1) : rest;
  if (!x.T) return jamo ? koSetT(st, jamo) + tail : st + rest;
  if (x.T === 8) { if (jamo) return koSetT(st, jamo) + tail; if (/^[ㅅ세셔시ㄴ니]/.test(rest)) return koSetT(st, 0) + rest; return st + rest; }   // 살다: 산, 살, 사세요, 사니까, 살면
  return st + (jamo ? koMake(11, 18, jamo) + tail : '으' + rest);
}
function koStem2(st) {   // the stem the 으-endings attach to (irregular verbs change it)
  const x = koLast(st); if (!x) return st;
  if (x.T === 17 && !KO_B_REG.test(st)) return koSetT(st, 0) + '우';
  if (x.T === 7 && KO_D_IRR.test(st.slice(-1))) return koSetT(st, 8) + '\u0000';   // 듣 → 들 (but keep 으: 들으면)
  if (x.T === 27 && !KO_H_REG.test(st)) return koSetT(st, 0);
  return st;
}
function koFormsOf(lemma, type) {
  const st = lemma.slice(0, -1), P = koPolite(lemma); if (!P) return [];
  const A = P.replace(/요$/, ''), past = koSetT(A, 20);   // 먹어 → 먹었, 해 → 했, 가 → 갔
  let s2 = koStem2(st); const dIrr = s2.endsWith('\u0000'); s2 = s2.replace('\u0000', '');
  const eu = r => dIrr ? (r[0] === 'ㄴ' || r[0] === 'ㄹ' ? s2 + koMake(11, 18, { 'ㄴ': 4, 'ㄹ': 8 }[r[0]]) + r.slice(1) : s2 + '으' + r) : koEu(s2, r);
  const f = new Map(), add = (w, g) => { if (w && !f.has(w)) f.set(w, g); };
  add(lemma, ''); add(P, ''); add(A, ''); add(A + '서', ''); add(A + '도', '');
  for (const e of ['', '다', '어', '어요', '습니다', '습니까', '는데', '지', '죠', '고', '니', '나요', '네', '을', '으면', '을까', '던', '을지']) add(past + e, 'past');
  const lst = koLast(st)?.T === 8 ? koSetT(st, 0) : null;   // 살다: 사는, 사니, 사네, 삽니다
  for (const e of ['고', '지', '지만', '기', '게', '거나', '잖아', '잖아요', '다가', '던', '겠어', '겠어요', '겠다', '겠습니다', '겠지', '다고', '대']) add(st + e, '');
  for (const e of ['네', '네요', '니']) add((lst || st) + e, '');
  add(A + '야', ''); add(A + '야지', ''); add(A + '서요', '');
  add(koHas(st) && !lst ? st + '습니다' : koSetT(lst || st, 17) + '니다', ''); add(koHas(st) && !lst ? st + '습니까' : koSetT(lst || st, 17) + '니까', '');
  for (const e of ['면', '세요', '셨어요', '셨어', '십니까', '십시오', '니까', 'ㄴ', 'ㄹ', 'ㄹ까', 'ㄹ까요', 'ㄹ게', 'ㄹ게요', 'ㄹ래', 'ㄹ래요', '려고', '러', 'ㄴ데', 'ㄹ거야']) add(eu(e), '');
  if (type === 'verb') {
    for (const e of ['는', '는데', '는지', '나요', '니', '는다고', '는다면', '는구나', '는거야']) add((lst || st) + e, '');
    add(st + '자', '');
    add(koHas(st) && koLast(st).T !== 8 ? st + '는다' : (koLast(st)?.T === 8 ? koSetT(st, 4) : koSetT(st, 4)) + '다', '');   // 먹는다, 간다, 산다
    add(A + '라', ''); add(A + '줘', ''); add(A + '줘요', ''); add(A + '주세요', ''); add(A + '봐', ''); add(A + '봐요', '');
  } else { add(st + '다', ''); add(st + '니', ''); }
  return [...f.entries()];
}
const RS_KO_FORMS = new Map();   // form → [type, meaning, lemma]
{
  const put = (lemma, type, en) => { for (const [w, how] of koFormsOf(lemma, type)) if (!RS_KO_FORMS.has(w)) RS_KO_FORMS.set(w, [type, how === 'past' ? en.split(' / ')[0] + ' (past)' : en, lemma]); };
  for (const line of RS_KO_WORDS.split('\n')) { const [w, t, g] = line.split('|'); if (w && t) put(w, t, g || ''); }
  if (typeof KO_VERB !== 'undefined') { for (const v of KO_VERB) put(v[0], 'verb', v[4]); for (const a of KO_ADJ) put(a[0], 'adj', a[1]); }
  // 이다 (is) and 아니다 (isn't) after a noun: 학생이야, 의사예요, 사람이다, 문제가 아니야
  for (const [w, g] of [['아니야', 'is not'], ['아니에요', 'is not'], ['아닙니다', 'is not'], ['아니다', 'is not'], ['아니었어', 'was not'], ['아냐', 'is not'], ['아니', 'no / not']]) RS_KO_FORMS.set(w, ['verb', g, '아니다']);
}
const RS_KO_COP = /(이에요|예요|이야|야|이다|입니다|이었어|이었다|였어|였다|이었어요|였어요|인가요|인데|이지|이니|일까|이라고|라고|이죠|죠|이네|네)$/;
// particles that come off the end of a noun (longest first), with what they add to the meaning
const RS_KO_PART = [['에서는', 'at / in'], ['에게서', 'from'], ['에서도', 'at … too'], ['한테서', 'from'], ['에게는', 'to'], ['한테는', 'to'], ['에서', 'at / in / from'], ['에게', 'to'], ['한테', 'to'],
  ['까지', 'until / to'], ['부터', 'from'], ['처럼', 'like'], ['보다', 'than'], ['하고', 'and / with'], ['이랑', 'and / with'], ['으로', 'by / to'], ['에는', 'at / in'], ['에도', 'to … too'], ['밖에', 'only'],
  ['만', 'only'], ['랑', 'and / with'], ['로', 'by / to'], ['과', 'and / with'], ['와', 'and / with'], ['의', '’s'], ['에', 'to / at'], ['도', 'too'], ['은', ''], ['는', ''], ['이', ''], ['가', ''], ['을', ''], ['를', '']];
// pronoun forms that change: 내가 (I), 제가 (I), 네가 (you), 난 (I + topic), 날 (me), 이게 (this), 그걸 (that)
const RS_KO_PRON = new Map(Object.entries({ '내가': 'I', '제가': 'I', '네가': 'you', '니가': 'you', '내': 'my', '제': 'my', '네': 'your', '난': 'I', '넌': 'you', '우린': 'we', '날': 'me', '널': 'you', '우릴': 'us', '절': 'me',
  '이건': 'this', '그건': 'that', '저건': 'that', '이게': 'this', '그게': 'that', '저게': 'that', '이걸': 'this', '그걸': 'that', '저걸': 'that', '뭘': 'what', '뭐가': 'what', '건': 'thing', '게': 'thing', '걸': 'thing',
  '누가': 'who', '여기서': 'here', '거기서': 'there', '어디서': 'where', '저기서': 'over there', '걔': 'that kid', '걔는': 'that kid', '얘': 'this kid', '제게': 'to me', '내게': 'to me', '무엇을': 'what', '나랑': 'with me', '너랑': 'with you', '나도': 'me too', '저도': 'me too' }));
const RS_KO_ONLY_NOUN = /(를|에서|에게|한테|에|의|으로|까지|부터|처럼)$/;   // only a noun (or pronoun) takes these
function rsKoSplit(w) {   // 학교에 → [학교, 에, 'to / at'], 친구하고 → [친구, 하고, …]
  for (const [p, g] of RS_KO_PART) if (w.length > p.length && w.endsWith(p)) { const root = w.slice(0, -p.length); return [root, p, g]; }
  return null;
}
function rsKoLook(w) {   // → [type, meaning] or null
  const dict = RS_DICT.ko.get(w); if (dict) return dict;
  if (RS_KO_PRON.has(w)) return ['pron', RS_KO_PRON.get(w)];
  const f = RS_KO_FORMS.get(w); if (f) return [f[0], f[1]];
  if (typeof KO_NOUN !== 'undefined') { const n = KO_NOUN.find(x => x[0] === w); if (n) return ['noun', n[2].replace(/^my /, '')]; }
  const lex = rsLex('ko'); if (lex.has(w)) return [lex.get(w), ''];
  return null;
}
function rsKoTag(raw, i, words) {
  const w = String(raw || '').replace(/[.,!?;:"“”()]/g, '');
  if (!w || !/^[가-힣]+$/.test(w)) return null;
  const sp0 = rsKoSplit(w), pr = sp0 && (RS_DICT.ko.get(sp0[0]) || (RS_KO_PRON.has(sp0[0]) ? ['pron', RS_KO_PRON.get(sp0[0])] : null));
  if (!RS_DICT.ko.has(w) && !RS_KO_PRON.has(w) && pr && (pr[0] === 'pron' || pr[0] === 'noun')) return [pr[0], pr[1] + (sp0[2] ? ' + ' + sp0[2] : '')];   // 나는 = I (not “flying”)
  const direct = rsKoLook(w);
  // 이 / 그 / 저 / 네 / 한 / 새 on their own: before a noun they're determiners (그 책), otherwise unsure
  if (direct && ['이', '그', '저', '네', '한', '새', '두', '세'].includes(w)) return [null, direct[1]];
  if (direct) return direct;
  // noun + particle: 학교에, 사람은, 고양이를, 친구하고 (and two particles: 학교에서는)
  const sp = rsKoSplit(w);
  if (sp) {
    const [root, p, g] = sp, r = rsKoLook(root) || (rsKoSplit(root) && rsKoLook(rsKoSplit(root)[0]));
    if (r && (r[0] === 'noun' || r[0] === 'pron')) return [r[0], r[1] + (g ? ' + ' + g : '')];
    if (r && r[0] === 'adv' && /^(은|는|도|부터|까지|만)$/.test(p) && r[1]) return ['adv', r[1] + (g ? ' + ' + g : '')];   // 오늘은, 어제도
    // only nouns take 를, 에, 에서, 의…: a root we don't know is still a noun (but not a verb stem: 먹을 = will eat)
    if (!r && RS_KO_ONLY_NOUN.test(w) && root.length >= 1 && !RS_KO_FORMS.has(root + '다') && !/(었|았|했|겠)$/.test(root)) return ['noun', ''];
  }
  // noun + 이다: 학생이야, 의사예요, 문제야
  const cop = RS_KO_COP.exec(w);
  if (cop && w.length > cop[0].length) { const root = w.slice(0, -cop[0].length), r = rsKoLook(root); if (r && (r[0] === 'noun' || r[0] === 'pron')) return [r[0], r[1] + ' + is']; }
  // a 하다 verb we don't know: 운전했어, 공부합니다 (but not 하다 describing words, which are in the list)
  const hm = /^([가-힣]{2,})(하다|해요|해|했어|했어요|했다|합니다|하고|하는|한다|할|하지|하세요|했습니다|하러|하면)$/.exec(w);
  if (hm && RS_DICT.ko.get(hm[1])?.[0] === 'noun') return ['verb', RS_DICT.ko.get(hm[1])[1]];
  // the endings only verbs have: -고 있다 is shown by the next word, 먹고 싶어 (the -고 word is a verb)
  return null;
}
{ const prevTag = rsTagWord; rsTagWord = function (w, i, low, lang) { return lang === 'ko' ? (rsKoTag(w, i, low) || [null])[0] : prevTag(w, i, low, lang); }; }
{ const prevSent = rsTagSentence;
  rsTagSentence = function (words, lang) {
    if (lang !== 'ko') return prevSent(words, lang);
    const low = words.map(w => String(w).replace(/[.,!?;:"“”()]/g, ''));
    const out = low.map((w, i) => (rsKoTag(w, i, low) || [null])[0]);
    for (let i = 0; i < out.length; i++) {
      const w = low[i], next = low[i + 1] || '';
      if (out[i] == null && ['이', '그', '저', '한', '두', '세', '새'].includes(w) && out[i + 1] === 'noun') out[i] = 'det';   // 그 책, 이 사람, 한 번
      if (out[i] == null && /고$/.test(w) && /^(싶|있|계)/.test(next)) out[i] = 'verb';                                    // 먹고 싶어, 가고 있어
      if ((out[i] == null || w === '날') && koLast(w)?.T === 8 && next === '수') out[i] = 'verb';              // 할 수 있다
      if (out[i] !== 'verb' && out[i] !== 'adj' && RS_KO_FORMS.has(w) && /^(것|거|수|게|걸|건|적)/.test(next) && !RS_KO_PRON.has(w)) out[i] = RS_KO_FORMS.get(w)[0];   // 줄 것이다, 할 수
      if (out[i] == null && /지$/.test(w) && /^(않|마|못)/.test(next)) out[i] = 'verb';                                   // 가지 않아
      if (out[i] == null && /러$/.test(w) && /^(가|와|갔|왔)/.test(next)) out[i] = 'verb';                                // 먹으러 가요
    }
    return out;
  };
}
/* meanings under the words */
{ const prevGloss = rsGloss;
  rsGloss = function (word, lang) {
    if (lang !== 'ko') return prevGloss(word, lang);
    const w = String(word || '').replace(/[.,!?;:"“”()]/g, ''), r = rsKoTag(w, 0, [w]);
    if (r?.[1]) return r[1];
    const m = rsGlossMap('ko'); if (m.has(w)) return m.get(w);
    const sp = rsKoSplit(w); if (sp && m.has(sp[0])) return m.get(sp[0]) + (sp[2] ? ' + ' + sp[2] : '');
    return '';
  };
}
/* 🌐 Wiktionary knows dictionary words, not 학교에 or 먹었어요: look up the word with its particle taken off */
if (typeof rsWikiLookup === 'function') {
  const prevWiki = rsWikiLookup;
  rsWikiLookup = async function (word, lang) {
    if (lang !== 'ko') return prevWiki(word, lang);
    const sp = rsKoSplit(word), r = sp && sp[0].length >= 2 ? await prevWiki(sp[0], lang) : null;   // the bare word first: one lookup is usually enough
    if (r && (r[0] === 'noun' || r[0] === 'pron')) return [r[0], r[1] ? r[1] + (sp[2] ? ' + ' + sp[2] : '') : ''];
    return prevWiki(word, lang);
  };
}
