'use strict';
/* Keeps a copy of the app on the device so it opens with no connection (needs https or localhost).
   Always tries the PC first so updates arrive; falls back to the saved copy when the PC can't be reached. */
const CACHE = 'estudiar-app-v156';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-256.png', 'icon-192.png', 'icon-512.png', 'icon-180.png', 'estudiar.ico',
  'mascot.js', 'rich.js', 'profiles.js', 'quick.js', 'progress.js', 'streak.js', 'rewards.js', 'runner.js', 'themes.js', 'friends.js', 'avatar.js',
  'packs.js', 'dictionary.js', 'folders.js', 'sentences.js', 'tower.js', 'showdown.js', 'millionaire.js', 'calendar.js', 'priceparty.js', 'spinspell.js',
  'wordtown.js', 'trmusic.js', 'trails-data.js', 'trails-dex.js', 'trails.js', 'saga-data.js', 'saga.js', 'bulkedit.js', 'pos.js', 'tour.js', 'phoneguide.js', 'updates.js', 'community.js', 'favs.js', 'scan.js', 'gamepad.js', 'builder.js', 'cardlist.js', 'decktools.js', 'layout.js', 'mobile.js', 'qr.js', 'syncmerge.js', 'sync.js', 'games.js', 'anki.js', 'lib/fzstd.js', 'lib/sql-wasm.js', 'lib/sql-wasm-binary.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // keep the saved copy up to date even when the connection is slow (like Tailscale on mobile data)
    const live = fetch(e.request).then(r => { if (r.ok) cache.put(e.request, r.clone()); return r; });
    e.waitUntil(live.catch(() => {}));
    try {
      return await Promise.race([live, new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 3500))]);
    } catch {
      return (await cache.match(e.request, { ignoreSearch: true })) || (url.pathname.endsWith('/') ? cache.match('index.html') : Response.error());
    }
  })());
});
