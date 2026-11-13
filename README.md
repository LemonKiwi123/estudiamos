# Estudiamos

**Flashcards, quizzes and games for learning languages, on your PC and your phone.**
Free, no ads, and your cards stay on your own devices.

[⬇️ Download](https://github.com/LemonKiwi123/estudiamos/releases/latest) ·
[💬 Feedback](https://github.com/LemonKiwi123/estudiamos/issues) ·
[⭐ Reviews](https://github.com/LemonKiwi123/estudiamos/discussions/categories/reviews) ·
☕ Buy me a coffee *(coming soon)*

---

## What it does

- **Smart flashcards:** study a little every day, and each card comes back right before you'd forget it.
- **Quizzes:** multiple choice, typing or listening, with a time limit if you like, and answers shown right away or at the end like a real test.
- **Games:** a Sentence Builder that checks real Spanish grammar, adventures, word games and more, all using your own cards.
- **Rich cards:** pictures, sounds, colors, highlighting, example sentences, and word labels like *noun* or *verb*.
- **Bring your cards:** import from Anki, CSV or text, or scan a printed page with your camera.
- **Phone and PC in sync:** use it on your iPhone, iPad or Android phone, at home on Wi-Fi or anywhere with Tailscale.
- **Updates itself:** checks for new versions, checks they're genuine, backs up your cards, and installs in about 30 seconds.

## Install (Windows 10 or 11)

1. Download **Estudiamos-x.y.z.zip** from [Releases](https://github.com/LemonKiwi123/estudiamos/releases/latest).
2. Right-click it → **Extract All**, somewhere you'll keep it (for example Documents).
3. Double-click **Set up Estudiamos.cmd** and answer the questions.
   If Windows says "Windows protected your PC", click **More info → Run anyway**.

Then open it with the **Estudiamos** icon on your Desktop. A short tour shows you around.
The setup can install [Node.js](https://nodejs.org) for you if it's missing; it's needed for syncing with your phone.

**Your phone:** in Estudiamos on the PC, go to **Settings → Phone & sync → 📖 Setup guide**.

## Your privacy

Your decks, cards and progress are kept in the `EstudiarData` folder on your PC, and on your phone, never on a company's server.
Estudiamos only goes online for these features:

- **Word labels** for unusual words: only that one word is looked up on Wiktionary.
- **Suggested example sentences:** looked up on Tatoeba.
- **Update checks:** reads a small file from this project's GitHub Releases. Nothing about you is sent.
- **Feedback, Reviews and Buy me a coffee:** these only open a web page; nothing is posted unless you post it.

## Feedback and reviews

- 🐞 **Found a problem?** [Report it](https://github.com/LemonKiwi123/estudiamos/issues/new?labels=bug), or use **💬 Feedback** in the app, which fills in your app version for you.
- 💡 **Have an idea?** [Suggest it](https://github.com/LemonKiwi123/estudiamos/issues/new?labels=idea).
- ⭐ **Enjoying it?** [Leave a review](https://github.com/LemonKiwi123/estudiamos/discussions/categories/reviews), or use **⭐ Reviews** in the app.

## For the author: making a release

1. Double-click `Release tools\Make release.cmd`, type the version number and what's new.
2. Upload the two files it makes in `Releases` (the `.zip` and `latest.json`) to a new GitHub release named `v<version>`.

Copies of Estudiamos then find the update by themselves. Every release is signed; keep `Release tools\PRIVATE-signing-key.pem` safe and never upload it (`.gitignore` already blocks it).

## License

Copyright © 2026 LemonKiwi123. **All rights reserved.** You may download and use the app for free; see [LICENSE](LICENSE) for details.
Third-party parts keep their own licenses (Tesseract.js, sql.js, fzstd).
