# Putting Estudiamos on GitHub: checklist

Everything on this list is done on github.com, signed in as **LemonKiwi123**.

## 1. Make the project
1. Go to https://github.com/new
2. **Repository name:** `estudiamos` (the app's links expect exactly this name).
3. Choose **Public** (so people can download it and leave feedback).
4. Don't add a README, .gitignore or license there; this folder already has them.
5. Press **Create repository**.

## 2. Upload the code
Easiest: install **GitHub Desktop** (https://desktop.github.com), then **File → Add local repository** →
choose `Documents\Study Cards`, then **Publish repository**. Keep the name `estudiamos`.
Only the files allowed by `.gitignore` are uploaded: `StudyCards`, `Release tools` (without your private key),
`README.md`, `LICENSE` and this file. Your cards (`EstudiarData`) and downloads (`Releases`) stay on your PC.

## 3. Turn on Reviews
1. On the project page: **Settings → General → Features** → tick **Discussions**.
2. Open the **Discussions** tab → the ✏️ next to **Categories** → **New category**.
3. **Name:** `Reviews` · **Format:** *Open-ended discussion* · press **Create**.
   (Its address must end in `/categories/reviews`; GitHub makes that from the name.)

## 4. Labels for feedback (optional)
**Issues → Labels:** make sure `bug` exists (it does by default) and add one called `idea`.

## 5. Publish version 1.2.0 (or whatever comes next)
1. Run `Release tools\Make release.cmd`.
2. On GitHub: **Releases → Draft a new release** → **Choose a tag** → type `v1.2.0` (with the "v") → **Create new tag**.
3. Title: `Estudiamos 1.2.0`. Paste the "what's new" text.
4. Drag in **both** files from `Releases`: `Estudiamos-1.2.0.zip` and `latest.json`.
5. **Publish release**.

From then on, copies of Estudiamos 1.2.0 and newer check GitHub for updates once a day by themselves.
(Copies of 1.0.0 and 1.1.0 don't know the GitHub address yet: give them the new zip once, through **Settings → Updates → Update from file**.)

## 6. Buy me a coffee
When your page exists (buymeacoffee.com/yourname), open `StudyCards\community.js`, put your name in
`coffee: ''` (for example `coffee: 'lemonkiwi'`), and make a new release.
