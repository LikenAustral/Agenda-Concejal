// Service worker: cachea el app shell para que abra offline/con mala señal,
// y muestra las notificaciones push que llegan aunque la app esté cerrada.

const CACHE_NAME = 'agenda-concejal-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Para la página principal: red primero (así siempre ves la versión más nueva
// de la app apenas la subes a GitHub), y si no hay señal, usa la copia guardada
// para que la app igual pueda abrir. Para íconos/manifest: caché primero (casi
// nunca cambian) con la red como respaldo.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const isPagina = event.request.mode === 'navigate' || event.request.url.indexOf('index.html') !== -1;
  if (isPagina) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resp.clone()));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => cached);
    })
  );
});

// --- Notificaciones push (recordatorios reales, app cerrada) ---
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: 'Recordatorio', body: event.data ? event.data.text() : '' }; }
  const title = data.title || '🔔 Recordatorio — Agenda Concejal';
  const options = {
    body: data.body || '',
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: { url: data.url || './index.html' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});