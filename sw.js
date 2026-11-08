// DCVG Campo Pro - service worker
// Objetivo: que la app abra al instante, con o sin senal. Primero se usa la copia guardada
// (abre rapido) y la version nueva se baja en segundo plano para la proxima vez.
// IMPORTANTE: el nombre C debe ser igual a SWV dentro de DCVG_Campo_Pro.html.
const C='dcvg-campo-v16-2026-11-06',
F=['./','./DCVG_Campo_Pro.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png'],
CRIT=['./DCVG_Campo_Pro.html'], // solo la app es critica; lo demas se intenta uno por uno
ESPERA=4000;

self.addEventListener('install',e=>{e.waitUntil(
  caches.open(C)
    .then(async c=>{
      for(const u of F){
        try{await Promise.race([c.add(new Request(u,{cache:'reload'})),new Promise((_,no)=>setTimeout(no,6000))])}
        catch(err){if(CRIT.includes(u))throw err}}})
    .then(()=>self.skipWaiting()))});

// Solo se borran copias viejas de la app. NUNCA el mapa guardado (dcvg-tiles-v1).
self.addEventListener('activate',e=>{e.waitUntil(
  caches.keys().then(k=>Promise.all(k.filter(x=>x.indexOf('dcvg-campo-')===0&&x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});

const red=r=>new Promise((ok,no)=>{
  const t=setTimeout(()=>no(new Error('espera')),ESPERA);
  fetch(r,{cache:'no-store'}).then(x=>{clearTimeout(t);ok(x)},x=>{clearTimeout(t);no(x)})});

const guardar=(e,r,x)=>{if(x&&x.ok&&x.type==='basic'){const c=x.clone();e.waitUntil(caches.open(C).then(k=>k.put(r,c)).catch(()=>{}))}};

self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith((async()=>{
    const forzar=(r.cache==='no-store'||r.cache==='reload'); // boton "buscar actualizacion": ir a la red
    const K=await caches.open(C); // solo se busca en la copia de la app, nunca en el mapa guardado (seria lentisimo)
    const m=await K.match(r,{ignoreSearch:true})||(r.mode==='navigate'?await K.match('./DCVG_Campo_Pro.html'):null);
    if(m&&!forzar){
      // abre al instante con la copia guardada; la nueva se baja en segundo plano
      e.waitUntil(red(r).then(x=>guardar(e,r,x)).catch(()=>{}));
      return m}
    let x=null;
    try{x=await red(r)}catch(_){}
    if(x&&x.ok&&x.type==='basic'){guardar(e,r,x);return x}
    return m||x||Response.error()})())});
