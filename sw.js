const CACHE_NAME='mia-cafe-pwa-v2';
const CORE=['/mia/bar.html','/mia/content.js','/mia/manifest.json','/mia/mia-pwa.svg'];

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
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req).then(response=>{
        if(response.ok) caches.open(CACHE_NAME).then(cache=>cache.put(req,response.clone()));
        return response;
      }).catch(()=>caches.match(req).then(cached=>cached||caches.match('/mia/bar.html')))
    );
    return;
  }

  const isLiveData = /\\.(?:js|json)$/i.test(url.pathname) ||
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
