// DCVG Campo Pro - service worker
// Objetivo: que la app SIEMPRE abra, con o sin internet, y que una respuesta mala
// del servidor (error, portal de wifi, etc.) nunca reemplace la copia buena guardada.
// Además guarda los cuadros del mapa que ya se vieron, para verlos sin internet.
const C='dcvg-campo-v14-2026-11-03',
T='dcvg-tiles-v1', // mapa guardado: no se borra al actualizar la app
TMAX=2500, // máximo de cuadros de mapa guardados
TILE=/^(server\.arcgisonline\.com|tile\.openstreetmap\.org)$/,
F=['./','./DCVG_Campo_Pro.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png'],
CRIT=['./','./DCVG_Campo_Pro.html'], // si estos fallan, no se instala; los iconos no son críticos
ESPERA=4000; // ms: con señal mala se abre la copia guardada en vez de quedarse esperando

self.addEventListener('install',e=>{e.waitUntil(
  caches.open(C)
    .then(c=>Promise.all(F.map(u=>c.add(new Request(u,{cache:'reload'})).catch(err=>{if(CRIT.includes(u))throw err}))))
    .then(()=>self.skipWaiting()))});

self.addEventListener('activate',e=>{e.waitUntil(
  caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!==T).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});

const red=r=>new Promise((ok,no)=>{
  const t=setTimeout(()=>no(new Error('espera')),ESPERA);
  fetch(r,{cache:'no-store'}).then(x=>{clearTimeout(t);ok(x)},x=>{clearTimeout(t);no(x)})});

// Mapa: primero lo guardado (instantáneo y sin internet); si no está, se pide y se guarda.
async function tile(e,r){
  const k=await caches.open(T),m=await k.match(r.url);
  if(m)return m;
  try{
    const x=await fetch(r);
    if(x&&x.ok){
      const c=x.clone();
      e.waitUntil((async()=>{
        await k.put(r.url,c);
        if(Math.random()<0.02){const ks=await k.keys();if(ks.length>TMAX)await Promise.all(ks.slice(0,ks.length-TMAX+200).map(q=>k.delete(q)))}
      })().catch(()=>{}))}
    return x}
  catch(_){return Response.error()}}

self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(TILE.test(u.hostname)){e.respondWith(tile(e,r));return}
  if(u.origin!==location.origin)return;
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
