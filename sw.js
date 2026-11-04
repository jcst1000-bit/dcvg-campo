/* DCVG Campo Pro - Service Worker (modo SIN INTERNET) */
const V='dcvg-campo-v7',TILES='dcvg-tiles-v1',MAXT=2500;
const ROOT=new URL('./',self.registration.scope).href;
const SHELL=['./','manifest.webmanifest','icon-180.png','icon-192.png'];

self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(V);
    await Promise.all(SHELL.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys()){if(k!==V&&k!==TILES&&k.indexOf('dcvg-campo-')===0)await caches.delete(k)}
    await self.clients.claim();
  })());
});

async function firstHtml(c){
  for(const q of await c.keys()){
    const u=new URL(q.url);
    if(/\.html?$/i.test(u.pathname)||u.pathname.endsWith('/'))return c.match(q);
  }
  return null;
}

/* La app: con internet busca la versión nueva (máx. 3 s); sin internet o con señal mala abre SIEMPRE la copia guardada */
async function nav(e){
  const r=e.request,c=await caches.open(V);
  const fresh=fetch(r.url,{cache:'no-store',credentials:'same-origin'}).then(async res=>{
    if(!res||!res.ok||(res.type!=='basic'&&res.type!=='default'))throw new Error('x');
    await c.put(r,res.clone());await c.put(ROOT,res.clone());return res;
  });
  e.waitUntil(fresh.catch(()=>{}));
  try{return await Promise.race([fresh,new Promise((_,j)=>setTimeout(j,3000))])}catch(_){}
  const hit=(await c.match(r,{ignoreSearch:true}))||(await c.match(ROOT))||(await firstHtml(c));
  if(hit)return hit;
  try{return await fresh}catch(_){}
  return new Response('<meta charset="utf-8"><body style="background:#000;color:#fff;font:18px sans-serif;padding:24px"><h2>Sin conexión</h2><p>La app aún no se guardó en este equipo. Ábrala UNA vez con internet.</p>',{status:503,headers:{'Content-Type':'text/html;charset=utf-8'}});
}

/* Archivos propios (iconos, manifest): primero la copia guardada y se actualiza en segundo plano */
async function asset(e){
  const r=e.request,c=await caches.open(V),hit=await c.match(r,{ignoreSearch:true});
  const net=fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res}).catch(()=>null);
  if(hit){e.waitUntil(net);return hit}
  return (await net)||Response.error();
}

/* Mapa: lo que ya se vio con internet queda guardado y se ve sin internet */
async function tile(e){
  const r=e.request,c=await caches.open(TILES),hit=await c.match(r);
  if(hit)return hit;
  try{
    const res=await fetch(r);
    if(res&&res.ok&&res.type!=='opaque'){
      await c.put(r,res.clone());
      e.waitUntil((async()=>{const k=await c.keys();if(k.length>MAXT)for(let i=0;i<k.length-MAXT;i++)await c.delete(k[i])})());
    }
    return res;
  }catch(_){return Response.error()}
}

self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    if(r.cache==='no-store'||r.cache==='reload')return;
    if(u.pathname.endsWith('/sw.js'))return;
    if(r.mode==='navigate'||r.destination==='document')e.respondWith(nav(e));
    else e.respondWith(asset(e));
    return;
  }
  if(/(^|\.)arcgisonline\.com$|(^|\.)tile\.openstreetmap\.org$/.test(u.hostname))e.respondWith(tile(e));
});
