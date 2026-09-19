/* FreshKeep service worker: offline cache + background expiry check (Android Chrome periodic sync). */
const CACHE = 'freshkeep-v1';
const SNAP = 'freshkeep-snapshot';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== SNAP).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

/* The page posts a snapshot of items so the worker can check expiry without the page open. */
self.addEventListener('message', e => {
  const d = e.data; if (!d || d.type !== 'snapshot') return;
  e.waitUntil(caches.open(SNAP).then(c => c.put('snapshot', new Response(JSON.stringify(d), { headers: { 'Content-Type': 'application/json' } }))));
});

async function checkExpiry() {
  const c = await caches.open(SNAP);
  const r = await c.match('snapshot'); if (!r) return;
  const d = await r.json(); if (!d.notif) return;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = s => { const [y, m, dd] = s.split('-').map(Number); return Math.round((new Date(y, m - 1, dd) - today) / 86400000); };
  const due = d.items.map(i => ({ ...i, n: days(i.expires) })).filter(i => i.n <= d.lead);
  if (!due.length) return;
  const exp = due.filter(i => i.n < 0), soon = due.filter(i => i.n >= 0);
  const parts = [];
  if (exp.length) parts.push(`${exp.length} expired: ${exp.slice(0, 3).map(i => i.name).join(', ')}${exp.length > 3 ? '…' : ''}`);
  if (soon.length) parts.push(`${soon.length} expiring soon: ${soon.slice(0, 3).map(i => i.name).join(', ')}${soon.length > 3 ? '…' : ''}`);
  await self.registration.showNotification('FreshKeep', { body: parts.join(' · '), tag: 'freshkeep-daily', icon: './icon-192.png', badge: './icon-192.png' });
}
self.addEventListener('periodicsync', e => { if (e.tag === 'freshkeep-check') e.waitUntil(checkExpiry()); });
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const w = list[0];
    if (w) { w.focus(); w.postMessage({ type: 'open-inventory' }); } else self.clients.openWindow('./');
  }));
});
