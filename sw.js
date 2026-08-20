/* 极简离线缓存：缓存应用外壳，导航走网络优先、失败回退缓存 */
const CACHE = 'wb-shell-v14';
const FILES = [
  'index.html', 'css/style.css?v=14', 'css/app-v2.css?v=14', 'js/config.js?v=14', 'js/store.js?v=14',
  'js/topbar.js?v=14', 'js/app.js?v=14', 'js/xiaoman.js?v=14', 'manifest.webmanifest',
  'images/xiaoman-sleeping.png', 'images/xiaoman-peek.png',
  'icon.svg?v=14', 'icon-192.png?v=14', 'icon-512.png?v=14', 'apple-touch-icon.png?v=14'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
