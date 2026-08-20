/* 极简离线缓存：缓存应用外壳，导航走网络优先、失败回退缓存 */
const CACHE = 'wb-shell-v18';
const FILES = [
  'index.html', 'css/style.css?v=17', 'css/app-v2.css?v=17', 'js/config.js?v=17', 'js/store.js?v=17',
  'js/topbar.js?v=17', 'js/app.js?v=17', 'js/xiaoman.js?v=17', 'manifest.webmanifest',
  'images/xiaoman-sleeping.png?v=17', 'images/xiaoman-rubbing.png?v=17', 'images/xiaoman-peek.png?v=17',
  'icon.svg?v=17', 'icon-192.png?v=17', 'icon-512.png?v=17', 'apple-touch-icon.png?v=17',
  'startup-1170x2532.png?v=17', 'startup-1290x2796.png?v=17'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
