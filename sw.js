/* 极简离线缓存：缓存应用外壳，导航走网络优先、失败回退缓存 */
const CACHE = 'wb-shell-v7';
const FILES = [
  'index.html', 'css/style.css?v=7', 'js/config.js?v=7', 'js/store.js?v=7',
  'js/topbar.js?v=7', 'js/app.js?v=7', 'manifest.webmanifest', 'icon.svg'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
