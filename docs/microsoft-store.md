# Publishing Estudiamos on the Microsoft Store

## 1. Your part in Partner Center (one time)

1. Sign up at <https://developer.microsoft.com/en-us/windows/publish> as an **Individual** developer (free; Microsoft checks an ID and a selfie).
2. **Apps and games › New product › MSIX or PWA app**, and reserve the name **Estudiamos** (if it's taken, try "Estudiamos Flashcards").
3. Open **Product management › Product identity** and copy three values into `Release tools\store\store-identity.json`:

```json
{ "name": "Package/Identity/Name", "publisher": "Package/Identity/Publisher (starts with CN=)", "publisherName": "Package/Properties/PublisherDisplayName" }
```

## 2. Build the package

```
node "Release tools\make-msix.js"
```

This makes `Releases\Estudiamos-<version>.msix`. Microsoft signs it when you submit it.

## 3. The submission

**Pricing and availability:** Free, all markets.

**Properties**
- Category: **Education** (subcategory: Language)
- Privacy policy URL: <https://github.com/LemonKiwi123/estudiamos/blob/main/docs/privacy.md>
- Website: <https://github.com/LemonKiwi123/estudiamos>
- Support contact: <https://github.com/LemonKiwi123/estudiamos/issues>
- Product declarations: it doesn't collect personal data; it can be installed on removable storage: no

**Age ratings:** answer the questionnaire. Estudiamos has no violence beyond cartoon battles in the word games, no user chat, no purchases and no ads. It usually comes out as **Everyone / 7+**. The "share location", "personal info" and "unrestricted internet" questions are all **No**. "Users can interact" is **No** (feedback opens GitHub in the browser).

**Packages:** upload the `.msix`.

**Why the app needs `runFullTrust`** (Partner Center asks; paste this):
> Estudiamos is a desktop app that runs a small local server (bundled Node.js) so the user's phone can sync their own flashcards with their PC over the home network. The launcher starts that server and opens the app window. It needs full trust to run the bundled server and to open the private-network firewall port the user's phone connects to. No data is sent to the developer.

**Store listing (English)**

*Description:*

> Estudiamos is a free flashcard and language-learning app for your PC and phone.
>
> • Make your own decks with pictures, audio and example sentences, or import from Anki and CSV.
> • Learn with spaced repetition, quizzes and more than a dozen games, including the Lexicon Saga role-playing adventure and Wordling Trails.
> • Sentence Builder: build sentences with grammar checks, or rebuild real sentences written by people (Spanish, French, Japanese and English).
> • Say it!: practise speaking and get instant feedback.
> • Sync with your phone over your home network. Your data stays on your devices: no account, no ads, no tracking.

*Short description:* Flashcards, games and real sentences for learning a language, synced with your phone.

*Features (one per line):*
- Spaced-repetition flashcards with pictures and audio
- More than a dozen learning games, including a full role-playing adventure
- Sentence Builder with grammar checks and real sentences
- Speaking practice with instant feedback
- Phone sync over your own network: no account, no ads
- Import from Anki and CSV

*Search terms:* flashcards, language learning, Spanish, French, Japanese, vocabulary, spaced repetition

*Screenshots:* at least 1 (1366×768 or larger). Use the ones in `docs/screenshots` or take new ones from the app window.

## 4. Updates later

Raise the version as usual with make-release, then run `make-msix.js` and submit the new `.msix` as an update in Partner Center. The Store version doesn't update itself: the Store does it.
