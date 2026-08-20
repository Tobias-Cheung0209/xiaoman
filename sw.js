/* 极简离线缓存：缓存应用外壳，导航走网络优先、失败回退缓存 */
const CACHE = 'wb-shell-v19';
const FILES = [
  'index.html', 'css/style.css?v=19', 'css/app-v2.css?v=19', 'js/config.js?v=19', 'js/city-geo.js?v=19', 'js/store.js?v=19',
  'js/topbar.js?v=19', 'js/app.js?v=19', 'js/xiaoman.js?v=19', 'manifest.webmanifest',
  'images/xiaoman-sleeping.png?v=19', 'images/xiaoman-rubbing.png?v=19', 'images/xiaoman-peek.png?v=19',
  'icon.svg?v=19', 'icon-192.png?v=19', 'icon-512.png?v=19', 'apple-touch-icon.png?v=19',
  'startup-1170x2532.png?v=19', 'startup-1290x2796.png?v=19'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
