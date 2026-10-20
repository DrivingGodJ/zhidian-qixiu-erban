/* 智电汽修二班 Service Worker · 网络优先 + 离线回退缓存 */
var VERSION='et-v20';
var RUNTIME=VERSION+'-runtime';
/* 仅缓存同源 GET 的文档与静态资源；网络优先，离线时回退缓存 */
self.addEventListener('install',function(e){self.skipWaiting()});
self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if(k!==RUNTIME)return caches.delete(k)
      }))
    }).then(function(){return clients.claim()})
  )
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var url=new URL(e.request.url);
  if(url.origin!==location.origin)return;
  /* 网络优先：永远拿最新；失败（离线）才回退缓存，再失败回退首页（导航请求） */
  e.respondWith(
    fetch(e.request).then(function(res){
      if(res&&res.ok){
        var copy=res.clone();
        caches.open(RUNTIME).then(function(c){c.put(e.request,copy)});
      }
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(hit){
        if(hit)return hit;
        if(e.request.mode==='navigate')return caches.match('./');
        return Response.error();
      });
    })
  );
});
