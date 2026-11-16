'use strict';
/* ================= Favorite decks =================
   Star a deck (☆ → ★) to pin it in the left menu. "★ Favorites" shows only starred decks on the Decks page. Stored on the deck (d.fav). */
const favDecks = () => S.decks.filter(d => d.fav);
function favStar(d, extra = '') {
  return `<button type="button" class="icon-btn fav-star${d.fav ? ' on' : ''}${extra ? ' ' + extra : ''}" data-act="favDeck" data-id="${d.id}" aria-pressed="${!!d.fav}" title="${d.fav ? 'Remove from favorites' : 'Add to favorites'}">${d.fav ? '★' : '☆'}</button>`;
}
/* the Favorites section in the left menu (wide screens) */
function renderSideFavs() {
  const el = $('#sideFavs'); if (!el) return;
  const fs = favDecks(), now = Date.now(), on = view.name === 'home' && view.favOnly;
  el.hidden = !currentProfileId || view.name === 'profiles';
  const open = S.settings.favsOpen !== false;
  el.innerHTML = `<div class="sf-top"><button type="button" class="sf-head${on ? ' on' : ''}" data-act="showFavs" title="Show only your favorite decks"><span class="ni" aria-hidden="true">⭐</span><span class="nt">Favorites</span><span class="sf-n">${fs.length}</span></button>
      <button type="button" class="sf-toggle" data-act="favsToggle" aria-expanded="${open}" title="${open ? 'Close the favorites list' : 'Open the favorites list'}">${open ? '▾' : '▸'}</button></div>
    ${!open ? '' : fs.length ? `<div class="sf-list">${fs.map(d => { const c = deckCounts(d, now), due = c.new + c.learn + c.review;
      return `<button type="button" class="sf-deck${view.name === 'deck' && view.deckId === d.id ? ' on' : ''}" data-act="openDeck" data-id="${d.id}" title="Open ${esc(d.name)}"><span class="sf-name">${esc(d.name)}</span>${due ? `<span class="sf-due" title="${due} card${due === 1 ? '' : 's'} to study today">${due}</span>` : '<span class="sf-done" title="Done for today">✓</span>'}</button>`; }).join('')}</div>`
      : '<div class="sf-empty">Tap ☆ on a deck to pin it here.</div>'}`;
}
/* the Decks page when "Favorites" is chosen */
function favHomeList(now, cardFn) {
  const fs = favDecks();
  if (!fs.length) return `<div class="empty"><p>You haven’t starred any decks yet. Tap <b>☆</b> on a deck to add it to your favorites.</p><button type="button" class="btn sm" data-act="home">Show all decks</button></div>`;
  return typeof homeListMode === 'function' && homeListMode() ? `<div class="deck-list"><div class="deck-grid">${fs.map(d => deckRow(d, now)).join('')}</div></div>` : `<div class="deck-grid">${fs.map(cardFn).join('')}</div>`;
}
Object.assign(actions, {
  favDeck: el => { const d = deckById(el.dataset.id); if (!d) return; d.fav = !d.fav; save(); render(); toast(d.fav ? `★ “${d.name}” added to favorites` : `“${d.name}” removed from favorites`); },
  favsToggle: () => { S.settings.favsOpen = S.settings.favsOpen === false; save(); renderSideFavs(); },
  showFavs: () => { const on = view.name === 'home' && view.favOnly; go({ name: 'home', favOnly: !on }); },
});
