'use strict';
/* ================= 🔎 Find a free picture for a card (Openverse) =================
   Searches openverse.org, a free library of Creative Commons and public-domain pictures (no account needed).
   "Free for any use" keeps to CC0, public domain, CC BY and CC BY-SA. The chosen picture is saved on the card like a
   picture you added yourself, and its credit (title, creator, license) is added to the card's notes. */
const PIC = { q: '', lic: 'free', page: 1, res: [], busy: false, more: false, ed: null, err: '' };
const PIC_LIC = { cc0: 'CC0', pdm: 'Public domain', by: 'CC BY', 'by-sa': 'CC BY-SA', 'by-nc': 'CC BY-NC', 'by-nd': 'CC BY-ND', 'by-nc-sa': 'CC BY-NC-SA', 'by-nc-nd': 'CC BY-NC-ND' };
function picDlg() { let d = document.getElementById('picDlg'); if (!d) { d = document.createElement('dialog'); d.id = 'picDlg'; d.className = 'pic-dlg'; d.setAttribute('aria-label', 'Find a free picture'); document.body.appendChild(d); } return d; }
const picText = el => (el?.innerText ?? el?.value ?? '').split('\n').map(s => s.trim()).find(Boolean)?.replace(/^(el|la|los|las|un|una|le|les|the|a|an|to)\s+/i, '').slice(0, 60) || '';
function picGuess(edId) {   // start with the English side of the card if there is one, else this side's text
  const ed = document.getElementById(edId), box = ed?.closest('form, dialog, .panel') || document, eds = [...box.querySelectorAll('.ed-area, textarea[lang]')];
  const en = eds.find(x => /^en/i.test(x.getAttribute('lang') || '') && picText(x)); return picText(en) || picText(ed);
}
function picHtml() {
  const lic = r => `${PIC_LIC[r.license] || ('CC ' + r.license.toUpperCase())}${r.license_version ? ' ' + r.license_version : ''}`;
  return `<form method="dialog" class="pic-head" data-pic-form><h3 style="margin:0">🔎 Find a free picture</h3><button type="button" class="icon-btn" data-pic="close" aria-label="Close">✕</button></form>
    <form class="pic-search" data-pic-form><input class="inp" name="q" value="${esc(PIC.q)}" placeholder="Search for a picture (in English works best)" autocomplete="off" aria-label="Search"><button type="submit" class="btn primary">Search</button></form>
    <div class="seg-btns" style="margin:6px 0 8px">${[['free', 'Free for any use'], ['all', 'All Creative Commons']].map(([k, l]) => `<button type="button" class="btn sm ${PIC.lic === k ? 'primary' : ''}" data-pic="lic" data-k="${k}">${l}</button>`).join('')}</div>
    <div class="pic-grid">${PIC.res.map((r, i) => `<button type="button" class="pic-item" data-pic="pick" data-i="${i}" title="${esc(`${r.title || 'Picture'} by ${r.creator || 'unknown'} · ${lic(r)}`)}"><img src="${esc(r.thumbnail)}" alt="${esc(r.title || '')}" loading="lazy"><span>${esc(lic(r))}</span></button>`).join('')}</div>
    ${PIC.busy ? '<p class="muted" style="text-align:center">Searching…</p>' : PIC.err ? `<p class="muted" style="text-align:center">${esc(PIC.err)}</p>` : PIC.q && !PIC.res.length ? '<p class="muted" style="text-align:center">No pictures found. Try a simpler word in English.</p>' : ''}
    ${PIC.more && !PIC.busy ? '<div style="text-align:center"><button type="button" class="btn" data-pic="more">Show more</button></div>' : ''}
    <p class="muted small" style="margin:8px 0 0">Pictures from <b>Openverse</b> (openverse.org), shared under Creative Commons licenses. The picture’s credit is added to the card’s notes.</p>`;
}
function picDraw() { const d = picDlg(); const y = d.querySelector('.pic-grid')?.scrollTop || 0; d.innerHTML = picHtml(); const g = d.querySelector('.pic-grid'); if (g) g.scrollTop = y; }
async function picSearch(more) {
  if (!PIC.q.trim()) return; PIC.busy = true; PIC.err = ''; if (!more) { PIC.page = 1; PIC.res = []; } picDraw();
  try {
    const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(PIC.q.trim())}&page_size=20&page=${PIC.page}&mature=false${PIC.lic === 'free' ? '&license=cc0,pdm,by,by-sa' : ''}`;
    const r = await fetch(u); if (!r.ok) throw new Error(r.status === 429 ? 'Too many searches for now. Wait a minute and try again.' : 'The picture library didn’t answer. Try again in a moment.');
    const j = await r.json(); PIC.res.push(...(j.results || []).filter(x => x.thumbnail)); PIC.more = PIC.page < (j.page_count || 1); PIC.page++;
  } catch (e) { PIC.err = navigator.onLine === false ? 'You’re offline. Finding pictures needs the internet.' : (e.message && !/fetch/i.test(e.message) ? e.message : 'Couldn’t reach the picture library. Check your internet connection.'); }
  PIC.busy = false; picDraw();
}
async function picPick(r) {
  PIC.busy = true; picDraw();
  try {
    const res = await fetch(r.thumbnail); if (!res.ok) throw new Error(); const blob = await res.blob();
    picDlg().close(); await insertPicture(PIC.ed, blob);
    const ed = document.getElementById(PIC.ed), notes = (ed?.closest('form, dialog') || document).querySelector('[name="notes"]');
    const credit = `📷 “${(r.title || 'Picture').slice(0, 80)}” by ${(r.creator || 'unknown').slice(0, 60)}, ${PIC_LIC[r.license] || r.license}${r.license_version ? ' ' + r.license_version : ''} (Openverse)`;
    if (notes && !notes.value.includes(credit)) notes.value = (notes.value.trim() ? notes.value.trim() + '\n' : '') + credit;
    toast('🖼️ Picture added');
  } catch { toast('Couldn’t download that picture. Try another one.'); }
  PIC.busy = false;
}
Object.assign(actions, {
  edWebPic: el => { PIC.ed = el.dataset.ed; const g = picGuess(PIC.ed); if (g && g !== PIC.q) { PIC.q = g; PIC.res = []; } const d = picDlg(); picDraw(); d.showModal(); d.querySelector('[name="q"]')?.focus(); if (PIC.q && !PIC.res.length) picSearch(); },
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-pic]'); if (!b || !b.closest('#picDlg')) return;
  switch (b.dataset.pic) {
    case 'close': return picDlg().close();
    case 'lic': PIC.lic = b.dataset.k; return picSearch();
    case 'more': return picSearch(true);
    case 'pick': { const r = PIC.res[+b.dataset.i]; if (r && !PIC.busy) picPick(r); return; }
  }
});
document.addEventListener('submit', e => { const f = e.target.closest?.('#picDlg .pic-search'); if (!f) return; e.preventDefault(); PIC.q = f.q.value; picSearch(); });
document.addEventListener('click', e => { const d = document.getElementById('picDlg'); if (d?.open && e.target === d) d.close(); });   // a click outside the window closes it
