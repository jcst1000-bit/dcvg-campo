# DCVG Campo Pro - TODOS los parches (BUSCAR / REEMPLAZAR)

Orden: primero los A (recorrido y sin internet), luego los B (contador de pasos, los suyos). Cada BUSCAR aparece una sola vez.
El HTML ya viene con todo aplicado; este archivo es solo respaldo.

## A1. Tope del trazo (no más recta desde el inicio)

### BUSCAR
```
t.push([+ll[0].toFixed(6),+ll[1].toFixed(6)]);if(t.length>12000)t.splice(1,1);trkSave()}
```

### REEMPLAZAR
```
t.push([+ll[0].toFixed(6),+ll[1].toFixed(6)]);if(t.length>14000){const n=[];for(let i=0;i<7000;i++)if(!(i&1))n.push(t[i]);for(let i=7000;i<t.length;i++)n.push(t[i]);t.length=0;n.forEach(x=>t.push(x))}trkSave()}
/* Registro continuo independiente del detector de pasos: guarda TODA lectura GPS útil mientras la inspección está activa */
let RECBAD=0;
function recAdd(f){if(!E||!f||f.acc>40)return;const ini=(E.pts||[]).some(p=>p.tipo==='inicio'),fin=(E.pts||[]).some(p=>p.tipo==='fin');if(!(odoOn()||(ini&&!fin)))return;
 const r=E.rec=E.rec||[],l=r[r.length-1];
 if(l){const d=Math.hypot((f.lon-l[1])*111320*Math.cos(f.lat*Math.PI/180),(f.lat-l[0])*110540),dt=f.t-l[2];if(d<3&&dt<20000)return;if(d>25&&dt<20000&&d/(Math.max(dt,500)/1000)>12&&RECBAD<3){RECBAD++;return}}
 RECBAD=0;r.push([+f.lat.toFixed(6),+f.lon.toFixed(6),f.t,f.acc]);
 if(r.length>16000){const n=[];for(let i=0;i<8000;i++)if(!(i&1))n.push(r[i]);for(let i=8000;i<r.length;i++)n.push(r[i]);E.rec=n}
 trkSave()}
const GAPM=40;
function recLine(){const r=E.rec||[],o=[];let l=null;for(const q of r){if(!l){o.push([q[0],q[1]]);l=q;continue}const d=Math.hypot((q[1]-l[1])*111320*Math.cos(q[0]*Math.PI/180),(q[0]-l[0])*110540);if(d>=5||(q[2]-l[2]>45000&&d>25)){o.push([q[0],q[1]]);l=q}}return o}
function gmLen(a){let s=0,g=0;for(let i=1;i<a.length;i++){const d=Math.hypot((a[i][1]-a[i-1][1])*111320*Math.cos(a[i][0]*Math.PI/180),(a[i][0]-a[i-1][0])*110540);s+=d;if(d>GAPM)g+=d}return[s,g]}
function gmBase(od){const T=(E.trk||[]).slice(),R=recLine(),M=(E.mig||[]).slice();const C=[T,R,M].filter(a=>a.length>=2);if(!C.length)return[];
 const sc=C.map(a=>{const x=gmLen(a);return{a:a,l:x[0],g:x[1]}});
 sc.forEach(x=>{x.s=od>20?x.g+Math.abs(x.l-od)-(x.a===T?0.03*Math.max(od,x.l):0):x.g*1000-x.l});
 sc.sort((x,y)=>x.s-y.s);return sc[0].a}
```

## A2. gmLine con fuentes de respaldo

### BUSCAR
```
function gmLine(){let t=(E.trk||[]).slice();const pp=gmPts();
 if(t.length<2){t=pp.slice().sort((a,b)=>(a.t||0)-(b.t||0)).map(p=>[+p.lat,+p.lon])}
```

### REEMPLAZAR
```
function gmLine(){const pp=gmPts(),o=E.odo,od=o?(o.est==='fin'?(+o.total||0):(+o.dist||0)):0,kk=(E.trk||[]).length+'|'+(E.rec||[]).length+'|'+(E.mig||[]).length+'|'+Math.round(od)+'|'+pp.length;
 let t;if(GM._lk===kk&&GM._lt)t=GM._lt.slice();else{t=gmBase(od);GM._lk=kk;GM._lt=t.slice()}
 if(t.length<2){t=pp.slice().sort((a,b)=>(a.t||0)-(b.t||0)).map(p=>[+p.lat,+p.lon])}
```

## A3. Dibujo con tramos punteados

### BUSCAR
```
 const L=gmLine();
 if(L.length>1){c.lineJoin='round';c.lineCap='round';c.beginPath();gmPath(c,L.map(q=>P(q[0],q[1])),W,H);
  c.strokeStyle='rgba(0,0,0,.75)';c.lineWidth=8;c.stroke();c.strokeStyle='#ffd400';c.lineWidth=4.5;c.stroke()}
```

### REEMPLAZAR
```
 const L=gmLine();
 if(L.length>1){c.lineJoin='round';c.lineCap='round';const runs=[],gp=[];let cu=[L[0]];
  for(let i=1;i<L.length;i++){if(geoDist(L[i-1][0],L[i-1][1],L[i][0],L[i][1])>GAPM){runs.push(cu);gp.push([L[i-1],L[i]]);cu=[L[i]]}else cu.push(L[i])}runs.push(cu);
  c.beginPath();runs.forEach(r=>{if(r.length>1)gmPath(c,r.map(q=>P(q[0],q[1])),W,H)});
  c.strokeStyle='rgba(0,0,0,.75)';c.lineWidth=8;c.stroke();c.strokeStyle='#ffd400';c.lineWidth=4.5;c.stroke();
  if(gp.length){c.save();c.setLineDash([10,9]);c.lineCap='butt';gp.forEach(g=>{const a=P(g[0][0],g[0][1]),b=P(g[1][0],g[1][1]);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.strokeStyle='rgba(0,0,0,.75)';c.lineWidth=7;c.stroke();c.strokeStyle='#ff3b30';c.lineWidth=3.5;c.stroke()});c.restore()}}
```

## A4. Alimentar registro continuo

### BUSCAR
```
{GM.lastFix=FIX;trkAdd(FIX)}
```

### REEMPLAZAR
```
{GM.lastFix=FIX;try{recAdd(FIX)}catch(e){console.error(e)}trkAdd(FIX)}
```

## A5. Limpiar registro al iniciar

### BUSCAR
```
 E.trkC=1;GM.fitted=false;trkSave();gmDraw()}catch(e){console.error(e)}}
```

### REEMPLAZAR
```
 E.rec=[];RECBAD=0;GM._lk=null;E.trkC=1;GM.fitted=false;trkSave();gmDraw()}catch(e){console.error(e)}}
```

## A6. Limpiar registro al cancelar

### BUSCAR
```
E.mig=[];E.trk=[];E.rawId=null;
```

### REEMPLAZAR
```
E.mig=[];E.trk=[];E.rec=[];GM._lk=null;E.rawId=null;
```

## A7. Aviso de GPS detenido

### BUSCAR
```
else if(odoOn()){odoWL(true);const s=ODO_HID?Date.now()-ODO_HID:0;ODO_HID=0;
 if(s>ODO_GAP){
```

### REEMPLAZAR
```
else if(odoOn()){odoWL(true);const s=ODO_HID?Date.now()-ODO_HID:0;ODO_HID=0;
 if(s>20000&&E.odo.est==='act'){odoEv('gps_detenido',{seg:Math.round(s/1000)});toast('El GPS estuvo detenido '+Math.round(s/1000)+' s (pantalla apagada u otra app). Ese tramo se une con línea punteada ROJA. Mantenga la pantalla encendida.',7000)}
 if(s>ODO_GAP){
```

## A8. Registro del SW con diagnóstico

### BUSCAR
```
navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{});
```

### REEMPLAZAR
```
navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>{try{r.update()}catch(e){}return navigator.serviceWorker.ready}).then(()=>swCachePage()).catch(()=>{if(navigator.onLine)toast('ATENCIÓN: el modo SIN INTERNET no está activo (falta sw.js junto a la app). Avise a soporte.',9000)});
```

## A9. Funciones SW

### BUSCAR
```
/* ---------- arranque ---------- */
```

### REEMPLAZAR
```
const SWV='dcvg-campo-v7';
async function swCachePage(){try{if(!navigator.onLine)return;const c=await caches.open(SWV),rq=new Request(location.pathname,{cache:'reload'}),rs=await fetch(rq);if(rs&&rs.ok){await c.put(rq,rs.clone());await c.put(new URL('./',location.href).href,rs.clone())}}catch(e){}}
/* ---------- arranque ---------- */
```

## A10. Actualizar sin borrar caché

### BUSCAR
```
try{const rr=await fetch(location.pathname,{cache:'no-store'});if(!rr.ok)throw 0}catch(e){toast('No hay conexión con el servidor. No se cambió nada.',5500);return}try{for(const r of await navigator.serviceWorker.getRegistrations())await r.unregister();for(const k of await caches.keys())await caches.delete(k)}catch(e){}location.reload();return}
```

### REEMPLAZAR
```
let rr;try{rr=await fetch(location.pathname,{cache:'no-store'});if(!rr.ok)throw 0}catch(e){toast('No hay conexión con el servidor. No se cambió nada.',5500);return}try{const c=await caches.open(SWV);await c.put(location.pathname,rr.clone());await c.put(new URL('./',location.href).href,rr.clone());const g=await navigator.serviceWorker.getRegistration();if(g)await g.update()}catch(e){}location.reload();return}
```

## B1. Contador de pasos

### BUSCAR
```
const vib=n=>{try{navigator.vibrate&&navigator.vibrate(n||12)}catch(e){}};
```

### REEMPLAZAR
```
var PED_QUIET=0,PED_PERM='';
const vib=n=>{try{PED_QUIET=Math.max(PED_QUIET,Date.now()+(n||12)+400);navigator.vibrate&&navigator.vibrate(n||12)}catch(e){}};
```

## B2. Contador de pasos

### BUSCAR
```
function odoReset(){ODO_KF=null;
```

### REEMPLAZAR
```
function pedReset(){PED_UP=false;PED_S=0;PED_B=null;PED_REG=0;PED_PC=0;PED_T=0;PED_MX=0;PED_A=0.9;PED_N=0;PED_SD=0;ODO_SD0=0;ODO_SEG=null;ODO_PS=null;ODO_W=null;PED_CAL=null;ODO_NF=0;ODO_NR=0}
function odoReset(){pedReset();ODO_KF=null;
```

## B3. Contador de pasos (ajustado: el texto original no existía; el BUSCAR empieza con salto de línea + un espacio)

### BUSCAR
```

 ODO_KF=null;ODO_H=[];ODO_EV=null;ODO_PC=0;ODO_BAD=0;ODO_CUR=null;ODO_QL=false;ODO_SP=0;ODO_W=null;ODO_SEG=null;
```

### REEMPLAZAR
```

 pedReset();ODO_KF=null;ODO_H=[];ODO_EV=null;ODO_PC=0;ODO_BAD=0;ODO_CUR=null;ODO_QL=false;ODO_SP=0;ODO_W=null;ODO_SEG=null;
```

## B4. Contador de pasos

### BUSCAR
```
if(!(odoOn()&&ODOCFG.fuente!=='gps')&&!PED_CALON)return;
```

### REEMPLAZAR
```
if(!(odoOn()&&ODOCFG.fuente!=='gps')&&!PED_CALON){PED_UP=false;PED_S=0;PED_REG=0;return}
```

## B5. Contador de pasos

### BUSCAR
```
 PED_S+=0.35*((m-PED_B)-PED_S);
```

### REEMPLAZAR
```
 PED_S+=0.35*((m-PED_B)-PED_S);
 if(t-PED_MT>1500)PED_A=0.9+(PED_A-0.9)*Math.pow(0.5,dtE/10000);
 if(t<PED_QUIET){PED_UP=false;PED_REG=0;return}
```

## B6. Contador de pasos

### BUSCAR
```
else{if(PED_S>PED_MX){PED_MX=PED_S;PED_MT=t}
```

### REEMPLAZAR
```
else{if(t-PED_UT>1500){PED_UP=false;PED_REG=0;return}if(PED_S>PED_MX){PED_MX=PED_S;PED_MT=t}
```

## B7. Contador de pasos

### BUSCAR
```
PED_A=Math.min(6,Math.max(0.9,PED_A+0.3*(PED_MX-PED_A)));
```

### REEMPLAZAR
```
PED_A=Math.min(4,Math.max(0.9,PED_A+0.3*(Math.min(PED_MX,2*PED_A)-PED_A)));
```

## B8. Contador de pasos

### BUSCAR
```
document.addEventListener('click',()=>{try{if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission==='function')DeviceMotionEvent.requestPermission().catch(()=>{})}catch(e){}},{once:true});
```

### REEMPLAZAR
```
function pedPermiso(){try{if(typeof DeviceMotionEvent!=='undefined'&&typeof DeviceMotionEvent.requestPermission==='function'&&PED_PERM!=='granted'&&PED_PERM!=='pend'&&PED_PERM!=='denied'&&!pedAlive()){PED_PERM='pend';DeviceMotionEvent.requestPermission().then(r=>{PED_PERM=r},()=>{PED_PERM='denied'})}}catch(e){PED_PERM=''}}
document.addEventListener('click',pedPermiso);
['pointerdown','pointerup','keydown'].forEach(n=>document.addEventListener(n,()=>{PED_QUIET=Math.max(PED_QUIET,Date.now()+450)},true));
```

## B9. Contador de pasos

### BUSCAR
```
else if(ODOCFG.fuente==='gps'&&FIX&&Date.now()-FIX.t<=15000)x='GPS ±'
```

### REEMPLAZAR
```
else if(ODOCFG.fuente!=='gps'&&FIX&&Date.now()-FIX.t<=15000)x='⚠ Sin sensor de pasos'+(PED_PERM==='denied'?' (permiso de movimiento denegado)':'')+': midiendo solo con GPS, menos exacto';else if(ODOCFG.fuente==='gps'&&FIX&&Date.now()-FIX.t<=15000)x='GPS ±'
```

## B10. Contador de pasos

### BUSCAR
```
if(ch>=3&&w.s<0.4*ch&&ch-w.s>=2.5){
```

### REEMPLAZAR
```
if(ch>=3&&w.s<0.4*ch&&ch-w.s>=2.5&&ch/((f.t-w.t)/1000)>=0.8){
```
