/* 极简离线缓存：缓存应用外壳，导航走网络优先、失败回退缓存 */
const CACHE = 'wb-shell-v13';
const FILES = [
  'index.html', 'css/style.css?v=13', 'css/app-v2.css?v=13', 'js/config.js?v=13', 'js/store.js?v=13',
  'js/topbar.js?v=13', 'js/app.js?v=13', 'js/xiaoman.js?v=13', 'manifest.webmanifest',
  'images/xiaoman.svg',
  'icon.svg?v=13', 'icon-192.png?v=13', 'icon-512.png?v=13', 'apple-touch-icon.png?v=13'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
