'use strict';
/* ================= 🔗 Free resources for each subject =================
   A short list of well-known free learning sites per subject, plus links you save yourself
   (S.settings.resources[subject]). Links open in your browser; Estudiamos sends nothing to them. */
const RES_FREE = {
  lang: [['Tatoeba', 'https://tatoeba.org', 'Millions of real example sentences with translations (the Sentence Builder uses it).'],
    ['Wiktionary', 'https://en.wiktionary.org', 'A free dictionary for almost every language, with conjugations and pronunciation.'],
    ['Language Transfer', 'https://www.languagetransfer.org', 'Free audio courses that teach you to think in the language.'],
    ['Forvo', 'https://forvo.com', 'Hear words said by native speakers.'],
    ['Duolingo', 'https://www.duolingo.com', 'Short daily lessons (free with ads).']],
  math: [['Khan Academy: Math', 'https://www.khanacademy.org/math', 'Free videos and practice from counting to calculus.'],
    ['Desmos Graphing Calculator', 'https://www.desmos.com/calculator', 'A powerful free online graphing calculator.'],
    ['GeoGebra', 'https://www.geogebra.org', 'Geometry, graphing and 3D math tools with lessons.'],
    ['OpenStax Math', 'https://openstax.org/subjects/math', 'Free, peer-reviewed math textbooks to read online.'],
    ['Wolfram|Alpha', 'https://www.wolframalpha.com', 'Type a math question and get the answer, with steps on some problems.']],
  science: [['PhET Simulations', 'https://phet.colorado.edu', 'Free interactive science and math simulations.'],
    ['Khan Academy: Science', 'https://www.khanacademy.org/science', 'Biology, chemistry, physics and more.'],
    ['NASA Space Place', 'https://spaceplace.nasa.gov', 'Space and Earth science from NASA.'],
    ['OpenStax Science', 'https://openstax.org/subjects/science', 'Free science textbooks to read online.'],
    ['CK-12', 'https://www.ck12.org', 'Free lessons and practice for school science and math.']],
  history: [['World History Encyclopedia', 'https://www.worldhistory.org', 'Articles, maps and timelines about world history.'],
    ['Khan Academy: Humanities', 'https://www.khanacademy.org/humanities', 'World and US history, government and civics.'],
    ['Library of Congress', 'https://www.loc.gov', 'Historic photos, maps, documents and recordings.'],
    ['National Archives (US)', 'https://www.archives.gov', 'Original historical documents.'],
    ['Crash Course', 'https://thecrashcourse.com', 'Fast, fun video courses on history and more.']],
  art: [['Smarthistory', 'https://smarthistory.org', 'Free art history essays and videos.'],
    ['Google Arts & Culture', 'https://artsandculture.google.com', 'Zoom into famous artworks from museums around the world.'],
    ['The Met Collection', 'https://www.metmuseum.org/art/collection', 'Browse hundreds of thousands of artworks.'],
    ['Drawabox', 'https://drawabox.com', 'A free course on the basics of drawing.']],
  music: [['musictheory.net', 'https://www.musictheory.net', 'Free music theory lessons and ear-training exercises.'],
    ['Chrome Music Lab', 'https://musiclab.chromeexperiments.com', 'Play with music and sound right in your browser.'],
    ['MuseScore', 'https://musescore.org', 'Free software to write and play sheet music.'],
    ['IMSLP', 'https://imslp.org', 'Free public-domain sheet music.']],
  coding: [['freeCodeCamp', 'https://www.freecodecamp.org', 'Free courses and certificates in web development and more.'],
    ['MDN Web Docs', 'https://developer.mozilla.org', 'The reference for HTML, CSS and JavaScript.'],
    ['CS50', 'https://cs50.harvard.edu', 'Harvard’s free introduction to computer science.'],
    ['Scratch', 'https://scratch.mit.edu', 'Learn to code by making games and stories with blocks.'],
    ['The Odin Project', 'https://www.theodinproject.com', 'A free full-stack web development course.'],
    ['Python Tutorial', 'https://docs.python.org/3/tutorial/', 'The official beginner’s guide to Python.']],
  other: [['Wikipedia', 'https://www.wikipedia.org', 'The free encyclopedia.'],
    ['MIT OpenCourseWare', 'https://ocw.mit.edu', 'Free materials from MIT courses.'],
    ['Project Gutenberg', 'https://www.gutenberg.org', 'Free e-books of classic literature.'],
    ['Internet Archive', 'https://archive.org', 'Free books, movies, music and old websites.']],
};
const resMine = k => ((S.settings.resources ||= {})[k] ||= []);
function resSubject() { const k = view.rs ?? (typeof homeSubj === 'function' ? homeSubj() : ''); return k; }
views.resources = () => {
  const k = resSubject(), subs = (typeof subjShown === 'function' ? subjShown() : SUBJECTS);
  const show = k ? subs.filter(s => s[0] === k) : subs;
  const card = (title, url, note, extra = '') => { let host = ''; try { host = new URL(url).hostname.replace(/^www\./, ''); } catch {}
    return `<div class="res-card"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer"><b>${esc(title)}</b> <span class="muted small">↗ ${esc(host)}</span></a>${note ? `<div class="muted small">${esc(note)}</div>` : ''}${extra}</div>`; };
  return `<div class="row-between" style="margin-bottom:6px"><h2 style="margin:0">🔗 Free resources</h2>
      <button type="button" class="btn primary" data-res="add">＋ Save a link</button></div>
    <p class="muted" style="margin:0 0 12px">Free sites to learn more. They open in your browser. Save your own favorite links too.</p>
    <div class="subj-tabs">${[['', '📚', 'All']].concat(subs).map(([s, e, n]) => `<button type="button" class="subj-tab ${k === s ? 'on' : ''}" data-res="subj" data-k="${s}">${e} ${esc(n)}</button>`).join('')}</div>
    ${show.map(([s, e, n]) => { const free = RES_FREE[s] || (/^c-/.test(s) ? RES_FREE.other : []), mine = resMine(s);
      return `<section class="panel" style="margin-top:12px"><h3 style="margin-top:0">${e} ${esc(n)}</h3>
        ${mine.length ? `<div class="muted small" style="margin-bottom:6px">⭐ Your links</div><div class="res-grid">${mine.map(r => card(r.title, r.url, r.note, `<button type="button" class="btn sm ghost res-del" data-res="del" data-k="${s}" data-id="${r.id}" title="Remove this link">✕</button>`)).join('')}</div>
          <div class="muted small" style="margin:10px 0 6px">Free sites we suggest</div>` : ''}
        <div class="res-grid">${free.map(([t, u, d]) => card(t, u, d)).join('')}</div></section>`; }).join('')}
    <p class="muted small" style="margin-top:12px">Estudiamos isn’t connected to these sites. Some are free with ads or ask you to make a free account.</p>`;
};
function resAddDialog() {
  const k = resSubject() || 'other', subs = typeof subjShown === 'function' ? subjShown() : SUBJECTS;
  openDialog({ title: '⭐ Save a link', ok: 'Save',
    body: `<label class="field">Name<input name="title" required maxlength="80" placeholder="e.g. My teacher’s videos"></label>
      <label class="field">Web address<input name="url" required maxlength="500" placeholder="https://…" inputmode="url"></label>
      <label class="field">Note <span class="hint muted">(optional)</span><input name="note" maxlength="200"></label>
      <label class="field">Subject<select name="subj">${subs.map(([s, e, n]) => `<option value="${s}" ${s === k ? 'selected' : ''}>${e} ${esc(n)}</option>`).join('')}</select></label>`,
    onOk: f => {
      let url = f.url.value.trim(); if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      try { const u = new URL(url); if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) throw 0; } catch { toast('That web address doesn’t look right'); return false; }
      resMine(f.subj.value).push({ id: uid(), title: f.title.value.trim() || url, url, note: f.note.value.trim() }); save(); render(); toast('⭐ Link saved');
    } });
}
Object.assign(actions, { resources: () => go({ name: 'resources' }) });
document.addEventListener('click', e => {
  const b = e.target.closest('[data-res]'); if (!b || view.name !== 'resources') return;
  if (b.dataset.res === 'subj') { view.rs = b.dataset.k; return render(); }
  if (b.dataset.res === 'add') return resAddDialog();
  if (b.dataset.res === 'del') { const l = resMine(b.dataset.k), i = l.findIndex(r => r.id === b.dataset.id); if (i < 0) return; const [r] = l.splice(i, 1); save(); render();
    if (typeof undoToast === 'function') undoToast(`Removed “${r.title}”`, () => { l.splice(i, 0, r); save(); render(); }); }
});
