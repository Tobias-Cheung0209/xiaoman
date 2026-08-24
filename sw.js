const CACHE = 'wb-shell-v45';
const FILES = [
  'index.html','css/style.css?v=45','css/app-v2.css?v=45','js/config.js?v=45','js/travel-areas.js?v=45','js/city-geo.js?v=45','js/store.js?v=45','js/topbar.js?v=45','js/app.js?v=45','js/xiaoman.js?v=45','manifest.webmanifest',
  'images/xiaoman-sleeping.png?v=45','images/xiaoman-rubbing.png?v=45','images/xiaoman-peek.png?v=45','images/china-map.png?v=45','images/world-map.png?v=45',
  'icon.svg?v=45','icon-192.png?v=45','icon-512.png?v=45','apple-touch-icon.png?v=45','startup-1170x2532.png?v=45','startup-1290x2796.png?v=45'
];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url); if(url.origin!==self.location.origin)return;
  if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('index.html')));return;}
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;})));
});
