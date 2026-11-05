/*
 * See on the web, offline (V3ProblemStates C1): every page you have opened still opens. Pages come from the network
 * when there is one and from here when there isn't; the built files (hashed names) are kept as they are fetched.
 * Your lists are in this browser's storage, not here.
 */
const CACHE = 'see-v1';
const SHELL = ['/', '/app', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // a page: the network first, so a new version arrives; offline, the app's own page
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/app', copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('/app')).then((hit) => hit || caches.match('/'))),
    );
    return;
  }

  // built files never change under the same name: keep the first copy
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/'))) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
