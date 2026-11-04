// DCVG Campo Pro - service worker
// Objetivo: que la app SIEMPRE abra, con o sin señal, y que una respuesta mala
// del servidor (error, portal de wifi, etc.) nunca reemplace la copia buena guardada.
const C='dcvg-campo-v15-2026-11-04',
F=['./','./DCVG_Campo_Pro.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png'],
CRIT=['./DCVG_Campo_Pro.html'], // solo la app es crítica; lo demás ('./', iconos, manifest) se intenta uno por uno y nunca bloquea la instalación
ESPERA=4000; // ms: con señal mala se abre la copia guardada en vez de quedarse esperando

self.addEventListener('install',e=>{e.waitUntil(
  caches.open(C)
    .then(async c=>{
      for(const u of F){
        try{await Promise.race([c.add(new Request(u,{cache:'reload'})),new Promise((_,no)=>setTimeout(no,6000))])}
        catch(err){if(CRIT.includes(u))throw err}}})
    .then(()=>self.skipWaiting()))});

self.addEventListener('activate',e=>{e.waitUntil(
  caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});

const red=r=>new Promise((ok,no)=>{
  const t=setTimeout(()=>no(new Error('espera')),ESPERA);
  fetch(r,{cache:'no-store'}).then(x=>{clearTimeout(t);ok(x)},x=>{clearTimeout(t);no(x)})});

self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith((async()=>{
    let x=null;
    try{x=await red(r)}catch(_){}
    // Solo se guarda una respuesta correcta del propio sitio (nunca un 404/500 ni una página ajena)
    if(x&&x.ok&&x.type==='basic'){
      const c=x.clone();
      e.waitUntil(caches.open(C).then(k=>k.put(r,c)).catch(()=>{}));
      return x}
    // Sin señal, señal lenta o respuesta mala: se usa la copia guardada
    const m=await caches.match(r,{ignoreSearch:true})||(r.mode==='navigate'?await caches.match('./DCVG_Campo_Pro.html'):null);
    return m||x||Response.error()})())});
