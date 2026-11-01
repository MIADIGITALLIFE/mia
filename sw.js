const CACHE_NAME='mia-cafe-pwa-v4';
const CORE=['/mia/bar.html','/mia/content.js','/mia/manifest.json','/mia/mia-pwa.svg','/mia/zh/','/mia/zh/index.html'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith('mia-cafe-pwa-') && key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;
  // The English edition has its own narrower worker and cache namespace.
  if(url.pathname.startsWith('/mia/en/')) return;

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req).then(response=>{
        if(response.ok) caches.open(CACHE_NAME).then(cache=>cache.put(req,response.clone()));
        return response;
      }).catch(()=>caches.match(req).then(cached=>cached||(url.pathname.startsWith('/mia/zh/')?caches.match('/mia/zh/index.html'):caches.match('/mia/bar.html'))))
    );
    return;
  }

  const isLiveData = url.pathname.endsWith('.js') || url.pathname.endsWith('.json') ||
    req.destination==='script' ||
    req.destination==='style';

  if(isLiveData){
    // Dynamic scripts and JSON must revalidate online instead of being cache-first forever.
    event.respondWith(
      fetch(req).then(response=>{
        if(response.ok) caches.open(CACHE_NAME).then(cache=>cache.put(req,response.clone()));
        return response;
      }).catch(()=>caches.match(req))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>cached||fetch(req).then(response=>{
      if(response.ok) caches.open(CACHE_NAME).then(cache=>cache.put(req,response.clone()));
      return response;
    }))
  );
});
