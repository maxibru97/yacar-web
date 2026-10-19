/* ===================== Portal de subasta para agencias (18/10/2026) =====================
 Pantallas detrás del ingreso (solo agencias aprobadas), con la estructura de las subastas en vivo de Motordil:
  #agencias/subasta        Subasta de hoy: banda con el reloj, accesos, auto destacado, lista con filtros, últimas pujas (sin montos)
  #agencias/auto/Y-0001    Página del auto: ficha completa (galería con zoom, estado, mercado, papeles) + panel para ofertar
  #agencias/ofertas[/tab]  Mis ofertas: activas, esperando al vendedor, ganadas (con "Ir a pagar") y no ganadas
 Reglas: subasta ciega con oferta máxima (paga $50.000 más que la segunda o el mínimo, nunca más que su máximo);
 si no llega al mínimo, el vendedor tiene 24 h (D-47); el fee (1,5%, mínimo $200 mil) se paga recién al ganar (18/10, Maxi).
 Todo es simulado: las otras agencias, el cierre, Mercado Pago y los WhatsApp del bot. Usa lo que expone agencias.js (window.YacarAg). */
(()=>{
const A=window.YacarAg; if(!A) return;
const {S,byId,esc,fmt,fmtM,feeOf,FEE,ZBY,DEMO_BASE,dist,banda}=A;

/* ---------- fotos del 208 de Maxi (Y-0001): patente y personas tapadas, sin GPS ---------- */
const F={
 "34di2":/*@foto:y1_34di2.jpg*/"", frente:/*@foto:y1_frente.jpg*/"", "34di":/*@foto:y1_34di.jpg*/"", "34dd":/*@foto:y1_34dd.jpg*/"",
 lat_i:/*@foto:y1_lat_i.jpg*/"", lat_d:/*@foto:y1_lat_d.jpg*/"", "34ti":/*@foto:y1_34ti.jpg*/"", "34td":/*@foto:y1_34td.jpg*/"",
 tras_d:/*@foto:y1_tras_d.jpg*/"", rayon:/*@foto:y1_rayon.jpg*/"", asientos:/*@foto:y1_asientos.jpg*/"", asientos_t:/*@foto:y1_asientos_t.jpg*/"",
 manejo:/*@foto:y1_manejo.jpg*/"", habitaculo:/*@foto:y1_habitaculo.jpg*/"", tablero:/*@foto:y1_tablero.jpg*/"", motor:/*@foto:y1_motor.jpg*/""
};
const G208=[["34di2","Esquina delantera izq."],["frente","Frente"],["34dd","Esquina delantera der."],["lat_i","Lateral izq. · daño 3"],["lat_d","Lateral der."],["34ti","Esquina trasera izq."],["34td","Esquina trasera der."],["tras_d","Trasero der. · daños 1, 2 y 4"],["rayon","Detalle del raspón · daño 1"],["asientos","Asientos delanteros"],["asientos_t","Asientos traseros"],["manejo","Puesto de manejo"],["habitaculo","Habitáculo"],["tablero","Tablero encendido · 32.379 km"],["motor","Motor"],["34di","Esquina delantera izq. · otra toma"]].map(([k,l])=>({src:F[k],l}));

/* ---------- autos de hoy (el 208 es el real; los otros tres, de ejemplo) ---------- */
const FICHA_PDF=/*@foto:ficha_Y-0001.pdf*/"";   // la ficha para imprimir (subasta/ficha_plantilla, con fotos livianas)
const AUTOS=[
 {id:"Y-0001",t:"Peugeot 208 Feline",a:2022,v:"1.6 automático Tiptronic · tope de gama · titular directo",km:32379,kmNota:"visto en el tablero",z:"belgrano",zl:"Belgrano / Saavedra",
  min:19800000,piso:19100000,techo:21200000,obj:24600000,score:8,sig:12,vistas:41,riv:[19150000,19400000,19600000],fotos:G208,real:true,
  kpi:[["Kilómetros","32.379","visto en el tablero"],["Caja","Automática","Tiptronic"],["Dueños","1","titular directo"],["Services oficiales","Sí","Peugeot SVA CABA",1],["Tapizado","Cuero","sin marcas a la vista"],["Cubiertas","A revisar","falta foto de la banda"]],
  equip:["Pantalla 10\" con CarPlay y Android Auto","Tablero digital 3D","Techo panorámico","Cámara de retroceso","Ópticas full LED","Asistentes de seguridad"],
  desc:"Tope de gama, automático, con todos los services oficiales y siempre en cochera. Un raspón en la puerta trasera derecha y raspones en dos llantas."},
 {id:"Y-0002",t:"Fiat Cronos 1.3 Drive",a:2023,v:"1.3 manual · ejemplo",km:38000,z:"moron",zl:"Morón (zona Haedo)",min:16900000,piso:16300000,techo:18000000,obj:20800000,score:8,sig:9,vistas:27,riv:[16400000,16700000,17100000],fotos:[{src:A.FOTOS.cronos,l:"Esquina delantera"}],
  kpi:[["Kilómetros","38.000","declarados"],["Caja","Manual",""],["Dueños","1",""],["Services oficiales","Sí","",1],["Tapizado","Tela",""],["Cubiertas","Buenas",""]],equip:["Pantalla táctil","Sensores de estacionamiento"],desc:"Sedán con poco uso, services al día."},
 {id:"Y-0003",t:"Toyota Hilux 2.4 DX 4x4",a:2018,v:"2.4 turbodiésel · ejemplo",km:132000,z:"vlopez",zl:"Vicente López",min:29500000,piso:28400000,techo:31000000,obj:36000000,score:6,sig:15,vistas:52,riv:[28600000,29000000],fotos:[{src:A.FOTOS.hilux,l:"Esquina delantera"}],
  kpi:[["Kilómetros","132.000","declarados"],["Caja","Manual",""],["Dueños","2",""],["Services oficiales","No","taller de confianza"],["Tapizado","Tela",""],["Cubiertas","Regulares","cambiar dentro del año"]],equip:["4x4","Enganche"],desc:"Pickup de trabajo, mecánica sana, detalles de uso en la caja."},
 {id:"Y-0004",t:"Honda CR-V 2.4 EX-L 4x4 AT",a:2014,v:"2.4 automática · ejemplo",km:118000,z:"sanisidro",zl:"San Isidro",min:23900000,piso:23000000,techo:25200000,obj:29400000,score:6,sig:7,vistas:23,riv:[23200000,23500000,24000000],fotos:[{src:A.FOTOS.crv,l:"Esquina delantera"}],
  kpi:[["Kilómetros","118.000","declarados"],["Caja","Automática",""],["Dueños","2",""],["Services oficiales","Sí","",1],["Tapizado","Cuero",""],["Cubiertas","Buenas",""]],equip:["Techo solar","Cuero","4x4"],desc:"SUV familiar cuidada, con techo solar."}
];
const BY=Object.fromEntries(AUTOS.map(a=>[a.id,a]));
const AGS=["Villa Urquiza","Caballito","Morón","San Martín","Vicente López","Flores","Núñez","Ramos Mejía"];
const PASO=50000;
const GARANTIA=300000;   // garantía por transferencia para quien no tiene tarjeta de crédito (D: 18/10, "Reserva + garantía")   // la ganadora paga $50.000 más que la segunda

/* ---------- estado del portal ---------- */
const nuevo=()=>({of:{},fav:new Set(["Y-0001"]),cerrada:false,cierre:0,simulada:false,ultimaAvisada:false,bienvenida:false,guia:true,pagados:{},acepta:{},medio:null,saldo:0,res:{},resto:{},cobro:{},
 filtro:"todos",orden:"score",foto:0,panel:false,borr:{},comp:{},err:"",feed:[]});
let ST=nuevo();
function semilla(){
 const now=Date.now(); let i=0;
 ST.feed=[];
 AUTOS.forEach(a=>a.riv.forEach((_,k)=>{ST.feed.push({ts:now-(9+i*13+k*7)*60000,txt:`Una agencia de ${AGS[(i+k)%AGS.length]} ofertó por el <b>${a.t} ${a.a}</b>`});i++}));
 AUTOS.filter(a=>Math.max(...a.riv)>=a.min).forEach(a=>ST.feed.push({ts:now-4*60000,txt:`El <b>${a.t} ${a.a}</b> llegó al mínimo del vendedor`,ok:1}));
 ST.feed.sort((x,y)=>y.ts-x.ts);
 const n=new Date(),h=n.getHours();
 if(h>=10&&h<19){const t=new Date(n);t.setHours(19,0,0,0);ST.cierre=t.getTime();ST.simulada=false}
 else {ST.cierre=now+(2*3600+15*60)*1000;ST.simulada=true}
}
semilla();

/* ---------- reglas ---------- */
const rivMax=a=>Math.max(0,...a.riv);
function est(a){
 const m=ST.of[a.id], top=rivMax(a), n=a.riv.length+(m?1:0), mejor=Math.max(top,m?m.max:0), llego=mejor>=a.min;
 if(!m) return {n,llego,mio:false};
 const gano=m.max>top;   // empate: gana la más temprana (las de las otras agencias llegaron antes)
 const precio=gano?Math.min(m.max,Math.max(top+PASO,a.piso,m.max>=a.min?a.min:0)):null;
 let fin=null;
 if(ST.cerrada) fin=!gano?"perdida":(m.max>=a.min||ST.acepta[a.id])?"ganada":"vendedor";
 return {n,llego,mio:true,gano,precio,max:m.max,fin};
}
const restaMs=()=>Math.max(0,ST.cierre-Date.now());
const hms=ms=>{const s=Math.floor(ms/1000);return [s/3600|0,(s%3600)/60|0,s%60].map(x=>String(x).padStart(2,"0")).join(":")};
const relojTxt=()=>ST.cerrada?"Cerrada":hms(restaMs());
const distTxt=a=>banda(dist(ZBY[a.z],ZBY[S.base||DEMO_BASE]))+" de tu agencia";
const hace=ts=>{const m=Math.max(1,Math.round((Date.now()-ts)/60000));return m<60?`hace ${m} min`:`hace ${Math.round(m/60)} h`};
const misActivas=()=>AUTOS.filter(a=>ST.of[a.id]).length;

// Montos en letras, para que el compromiso quede claro ("diecinueve millones ochocientos mil pesos")
function letras(n){
 const U=["","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve","diez","once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho","diecinueve","veinte","veintiuno","veintidós","veintitrés","veinticuatro","veinticinco","veintiséis","veintisiete","veintiocho","veintinueve"];
 const D=["","","","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa"];
 const C=["","ciento","doscientos","trescientos","cuatrocientos","quinientos","seiscientos","setecientos","ochocientos","novecientos"];
 const t=x=>x<30?U[x]:D[x/10|0]+(x%10?" y "+U[x%10]:"");
 const h=x=>x===100?"cien":(C[x/100|0]+(x%100?" "+t(x%100):"")).trim();
 const ap=s=>s.replace(/veintiuno$/,"veintiún").replace(/uno$/,"un");
 const m=Math.floor(n/1e6), k=Math.floor(n%1e6/1000), r=n%1000, o=[];
 if(m) o.push(m===1?"un millón":ap(h(m))+" millones");
 if(k) o.push(k===1?"mil":ap(h(k))+" mil");
 if(r) o.push(h(r));
 return (o.join(" ")||"cero")+(m&&!k&&!r?" de pesos":" pesos");
}

/* ---------- íconos ---------- */
const IC={
 vivo:`<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="5" fill="currentColor"/><path d="M8.5 8.5a10.6 10.6 0 0 0 0 15M23.5 8.5a10.6 10.6 0 0 1 0 15M4.8 4.8a15.8 15.8 0 0 0 0 22.4M27.2 4.8a15.8 15.8 0 0 1 0 22.4" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`,
 mano:`<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><path d="M9 17V8.5a2 2 0 0 1 4 0V15m0-8.5a2 2 0 0 1 4 0V15m0-6.5a2 2 0 0 1 4 0V16m0-5a2 2 0 0 1 4 0v8.5C25 25 21.5 29 16 29s-8.5-3-10.3-7.4l-1.2-3a2 2 0 0 1 3.6-1.7L9 19" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
 bandera:`<svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true"><path d="M7 29V4M7 5h17l-3.5 5.5L24 16H7" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
 estrella:on=>`<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.6l6.1-.8z" fill="${on?"#B8E04A":"none"}" stroke="${on?"#123F2C":"currentColor"}" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
 lupa:`<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" stroke-width="2.2" fill="none"/><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
 visita:`<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" stroke="currentColor" stroke-width="1.9" fill="none"/><path d="M3.5 10h17M8 3v4M16 3v4M8.5 15l2.3 2.2 4.7-4.7" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
 candado:`<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
 pdf:`<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2.8h8l4.5 4.5v13.9H6z" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linejoin="round"/><path d="M13.5 3v4.8h4.8M12 11v6.5m-2.8-2.8L12 17.5l2.8-2.8" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
};
// Vitrina: sin ingresar (o con la agencia sin aprobar) se ve la subasta con los datos clave difuminados.
// En la web real esos datos no llegan al navegador; acá están en el HTML porque es un prototipo.
const vit=()=>!A.aprobada();
const velo=h=>vit()?`<span class="velo" title="Ingresá con tu agencia para verlo">${h}</span>`:h;
const fotos=a=>vit()?a.fotos.slice(0,4):a.fotos;
const superados=()=>ST.cerrada?[]:AUTOS.filter(a=>{const e=est(a);return e.mio&&!e.gano});
const vivo=(txt="En vivo")=>ST.cerrada?`<span class="envivo off">Cerrada</span>`:`<span class="envivo"><i></i>${txt}</span>`;

/* ---------- avisos (lo que mandaría el bot por WhatsApp) ---------- */
function aviso(tit,txt,link){
 const box=byId("avisos"); if(!box) return;
 const d=document.createElement("div"); d.className="aviso";
 d.innerHTML=`<div class="wa"><span class="wadot"></span>WhatsApp · Yacar Agencias <span class="ptag">Simulado</span></div><b>${tit}</b><p>${txt}</p>${link?`<a href="${link}" class="ver">Ver</a>`:""}<button class="x" aria-label="Cerrar aviso">×</button>`;
 d.querySelector(".x").onclick=()=>d.remove();
 d.querySelector(".ver")?.addEventListener("click",()=>d.remove());
 box.prepend(d);
 [...box.children].slice(3).forEach(x=>x.remove());
 setTimeout(()=>d.classList.add("fuera"),9000); setTimeout(()=>d.remove(),9600);
}

/* ---------- piezas ---------- */
function pills(a,e){
 let h="";
 if(ST.cerrada&&e.mio) h+=({ganada:`<span class="pill ok">Ganaste</span>`,vendedor:`<span class="pill warn">Esperando al vendedor</span>`,perdida:`<span class="pill bad">No ganaste</span>`})[e.fin];
 else if(e.mio) h+=e.gano?`<span class="pill ok">Vas ganando</span>`:`<span class="pill bad">Te superaron</span>`;
 if(e.llego&&!(ST.cerrada&&e.mio)) h+=`<span class="pill min">Llegó al mínimo</span>`;
 return h;
}
function lote(a){
 const e=est(a), fav=ST.fav.has(a.id);
 return `<article class="lote card">
  <a class="lfoto" href="#agencias/auto/${a.id}"><img src="${a.fotos[0].src}" alt="${esc(a.t)}" loading="lazy"><span class="lpills">${pills(a,e)}</span><span class="score sm" title="Yacar Score"><b>${a.score}</b>/10</span></a>
  ${vit()?"":`<button class="favbtn" data-act="fav" data-id="${a.id}" aria-pressed="${fav}" aria-label="${fav?"Dejar de seguir":"Seguir este auto"}">${IC.estrella(fav)}</button>`}
  <a class="linfo" href="#agencias/auto/${a.id}">
   <h3>${esc(a.t)} · ${a.a}</h3>
   <p class="num">${a.km.toLocaleString("es-AR")} km · ${esc(a.zl)}</p>
   <p class="muted">${distTxt(a)}</p>
  </a>
  <div class="lpie"><div><span>Mínimo</span><b class="num">${velo(fmtM(a.min))}</b></div><div><span>Ofertas</span><b class="num">${e.n}</b></div><div><span>Cierra en</span><b class="num" data-clock>${relojTxt()}</b></div></div>
 </article>`;
}
function filtrar(){
 let l=AUTOS.slice();
 if(ST.filtro==="favs") l=l.filter(a=>ST.fav.has(a.id));
 if(ST.filtro==="mias") l=l.filter(a=>ST.of[a.id]);
 if(ST.filtro==="min") l=l.filter(a=>est(a).llego);
 const b=ZBY[S.base||DEMO_BASE];
 const ord={score:(x,y)=>y.score-x.score||x.km-y.km,cerca:(x,y)=>dist(ZBY[x.z],b)-dist(ZBY[y.z],b),min:(x,y)=>x.min-y.min,ofertas:(x,y)=>est(y).n-est(x).n}[ST.orden];
 return l.sort(ord);
}
const proto=extra=>`<div class="proto protorow sim"><span class="ptag">Solo prototipo</span>
 ${ST.cerrada?`<button class="linkbtn" data-act="reabrir">Volver a abrir la subasta</button>`:`${extra||""}<button class="linkbtn" data-act="ultimahora">Pasar a la última hora</button><button class="linkbtn" data-act="cerrar">Cerrar la subasta ahora</button>`}
 ${ST.simulada?`<span class="muted">Fuera del horario de 10 a 19 h el prototipo simula que la subasta está abierta.</span>`:""}</div>`;

/* ---------- Subasta de hoy ---------- */
function avisoVitrina(){
 if(!vit()) return "";
 return S.sesion
  ?`<div class="vitri card"><span class="ic">${IC.candado}</span><div><b>Tu agencia está en revisión.</b> Cuando la aprobemos vas a ver los mínimos, la ficha completa y vas a poder ofertar.</div><div class="vbtns"><a class="btn sec" href="#agencias/estado">Mi agencia</a></div></div>`
  :`<div class="vitri card"><span class="ic">${IC.candado}</span><div><b>Estás viendo la subasta como invitado.</b> Para ver los mínimos, las ${AUTOS[0].fotos.length} fotos, la ficha completa y ofertar, sumá tu agencia.</div><div class="vbtns"><a class="btn pri" href="#agencias/alta">Sumar mi agencia</a><a class="btn sec" href="#agencias/ingresar">Ingresar</a></div></div>`;
}
// Si otra agencia te superó, se ve apenas entrás (además del aviso por WhatsApp).
function avisoSuperado(){
 const l=superados(); if(!l.length||vit()) return "";
 return `<div class="superado card" role="status">${l.map(a=>`<div class="srow"><img src="${a.fotos[0].src}" alt=""><div><b>Te superaron en el ${esc(a.t)} · ${a.a}</b><span>${ST.volviste?"Mientras no estabas, otra agencia":"Otra agencia"} ofertó más que tu máximo de <b class="num">${fmt(ST.of[a.id].max)}</b>. Quedan <b class="num" data-clock>${relojTxt()}</b> para subirla.</span></div><a class="btn pri" href="#agencias/auto/${a.id}">Subir mi oferta</a></div>`).join("")}</div>`;
}
function htmlLista(){
 const d=AUTOS[0], de=est(d), lista=filtrar(), sup=superados().length;
 const chip=(v,l)=>`<button type="button" class="chip sm" data-act="filtro" data-v="${v}" aria-pressed="${ST.filtro===v}">${l}</button>`;
 const seg=AUTOS.slice().sort((x,y)=>(y.sig+ST.fav.has(y.id))-(x.sig+ST.fav.has(x.id)));
 const cards=vit()
  ?`<a class="sbcard" href="#agencias/subasta" data-act="alista"><span class="ic">${IC.vivo}</span><b>Subastas activas</b><span>${AUTOS.length} autos · cierran 19 h</span></a>
   <a class="sbcard" href="#agencias/${S.sesion?"estado":"alta"}"><span class="ic">${IC.mano}</span><b>${S.sesion?"Mi agencia":"Sumá tu agencia"}</b><span>${S.sesion?"En revisión":"Gratis, en 4 pasos"}</span></a>
   <a class="sbcard" href="#agencias/como"><span class="ic">${IC.bandera}</span><b>Cómo funciona</b><span>Subasta ciega, fee solo si ganás</span></a>`
  :`<a class="sbcard" href="#agencias/subasta" data-act="alista"><span class="ic">${IC.vivo}</span><b>Subastas activas</b><span>${AUTOS.length} autos · cierran 19 h</span></a>
   <a class="sbcard${sup?" alerta":""}" href="#agencias/ofertas"><span class="ic">${IC.mano}</span><b>Mis ofertas</b><span>${sup?`Te superaron en ${sup} ${sup===1?"auto":"autos"}`:misActivas()?misActivas()+(misActivas()===1?" oferta":" ofertas")+(ST.cerrada?" en la subasta de hoy":" activas"):"Todavía no ofertaste hoy"}</span></a>
   <a class="sbcard" href="#agencias/ofertas/ganadas"><span class="ic">${IC.bandera}</span><b>Finalizadas</b><span>Ganadas, pagos y visitas</span></a>`;
 return `<section class="sbhero"><div class="wrap">
  <div class="sbtop">
   <div><h1>Subasta de hoy ${vivo()}</h1><p>${AUTOS.length} autos de particulares, revisados por Yacar. ${ST.cerrada?"La subasta de hoy ya cerró.":"Ofertás hasta las 19 h."}</p></div>
   <div class="sbclock"><span>${ST.cerrada?"Estado":"Cierra en"}</span><b class="num" data-clock>${relojTxt()}</b><small>${ST.simulada?"Hora simulada (prototipo)":"Hoy a las 19:00"}</small></div>
  </div>
  <div class="sbcards">${cards}</div>
 </div></section>
 <div class="wrap sbbody">
  ${avisoVitrina()}${avisoSuperado()}
  <div class="destwrap">
   <h2 class="sbh">Destacada</h2>
   <article class="destacada card">
    <a class="dfoto" href="#agencias/auto/${d.id}"><img src="${d.fotos[0].src}" alt="${esc(d.t)}"><span class="lpills">${pills(d,de)}</span></a>
    <div class="dinfo">
     <div class="drow"><h3>${esc(d.t)} · ${d.a}</h3><span class="score"><b>${d.score}</b>/10<small>Yacar Score</small></span></div>
     <p class="muted">${esc(d.v)}</p>
     <p>${esc(d.desc)}</p>
     <ul class="dmeta num"><li><b>${d.km.toLocaleString("es-AR")}</b> km</li><li><b>${esc(d.zl)}</b></li><li><b>${de.n}</b> ofertas</li><li><b>${d.sig+ST.fav.has(d.id)}</b> agencias siguiéndolo</li></ul>
     <div class="dpie"><div><span>Mínimo del vendedor</span><b class="num">${velo(fmt(d.min))}</b></div><div><span>Cierra en</span><b class="num" data-clock>${relojTxt()}</b></div><a class="btn pri" href="#agencias/auto/${d.id}">${vit()?"Ver el auto":ST.of[d.id]?"Ver mi oferta":"Ver y ofertar"}</a></div>
    </div>
   </article>
  </div>
  <div class="sbgrid">
   <div>
    <div class="sbbar" id="lista"><h2 class="sbh">Autos en subasta</h2>
     <div class="chips">${chip("todos","Todos")}${vit()?"":chip("favs","Siguiendo")+chip("mias","Ya oferté")}${chip("min","Llegaron al mínimo")}</div>
     <label class="orden">Ordenar <select data-act="orden">${[["score","Mejor Yacar Score"],["cerca","Más cerca"],["min","Menor mínimo"],["ofertas","Más ofertas"]].map(([v,l])=>`<option value="${v}" ${ST.orden===v?"selected":""}>${l}</option>`).join("")}</select></label>
    </div>
    <div class="lotes">${lista.length?lista.map(lote).join(""):`<p class="vacio">No hay autos con ese filtro.</p>`}</div>
   </div>
   <aside class="sbside">
    ${ST.guia?`<div class="guia"><div><b>¿Primera vez en la subasta?</b> Es ciega: ves cuántas ofertas hay y si vas ganando, no los montos. Ponés lo máximo que pagarías y, si ganás, pagás $50.000 más que la segunda (o el mínimo). El fee se reserva al ofertar, se cobra solo si ganás y <b>vas a ver el auto dentro de las 48 h hábiles</b>.</div><button class="x" data-act="cerrarguia" aria-label="Cerrar">×</button></div>`:""}
    <div class="card feed"><div class="fhead"><h3>Últimas pujas</h3>${vivo()}</div>
     <ul>${ST.feed.slice(0,7).map(f=>`<li class="${f.ok?"ok":""}${f.mia?" mia":""}"><span>${f.txt}</span><small>${hace(f.ts)}</small></li>`).join("")}</ul>
     <p class="muted fnota">Sin montos: la subasta es ciega.</p></div>
    <div class="card seguidos"><h3>Más seguidos</h3><ol>${seg.map(a=>`<li><a href="#agencias/auto/${a.id}"><img src="${a.fotos[0].src}" alt=""><span><b>${esc(a.t)} ${a.a}</b><small>${a.sig+ST.fav.has(a.id)} agencias · ${est(a).n} ofertas</small></span></a></li>`).join("")}</ol></div>
   </aside>
  </div>
  ${vit()?"":proto(`<button class="linkbtn" data-act="rival" data-id="${d.id}">Otra agencia oferta por el 208</button>${ST.of[d.id]?`<button class="linkbtn" data-act="volver">Salir y volver más tarde</button>`:""}`)}
 </div>`;
}

/* ---------- página del auto ---------- */
const DIAG=`<svg viewBox="0 0 200 330" class="diag" role="img" aria-label="Vista de arriba del auto con los daños marcados">
 <text x="100" y="12" text-anchor="middle" class="dt">FRENTE</text>
 <rect x="22" y="62" width="18" height="44" rx="6" fill="#1A201C"/><rect x="160" y="62" width="18" height="44" rx="6" fill="#1A201C"/><rect x="22" y="228" width="18" height="44" rx="6" fill="#1A201C"/><rect x="160" y="228" width="18" height="44" rx="6" fill="#1A201C"/>
 <path d="M60 22 Q100 14 140 22 Q164 28 166 60 L168 280 Q166 312 140 316 L60 316 Q34 312 32 280 L34 60 Q36 28 60 22 Z" fill="#E6F0E8" stroke="#2F6B47" stroke-width="2"/>
 <path d="M52 92 Q100 78 148 92 L142 130 Q100 122 58 130 Z" fill="#C4D3C6"/><rect x="58" y="134" width="84" height="104" rx="10" fill="#fff" stroke="#C4D3C6"/><path d="M58 252 Q100 260 142 252 L146 282 Q100 292 54 282 Z" fill="#C4D3C6"/>
 <text x="100" y="184" text-anchor="middle" class="dt">techo</text><text x="100" y="196" text-anchor="middle" class="dt">panorámico</text>
 <g text-anchor="middle" font-weight="700" font-size="12" fill="#fff"><circle cx="170" cy="212" r="11" fill="#A3261B"/><text x="170" y="216">1</text><circle cx="176" cy="246" r="9" fill="#8A5300"/><text x="176" y="250" font-size="10">2</text><circle cx="20" cy="84" r="11" fill="#8A5300"/><text x="20" y="88">3</text><circle cx="180" cy="270" r="11" fill="#8A5300"/><text x="180" y="274">4</text></g>
 <text x="100" y="328" text-anchor="middle" class="dt">TRASERA</text></svg>`;
const DANOS=[[1,"bad","Raspón en la puerta trasera derecha","Línea corta en el borde de atrás, a la altura de la manija. El dueño lo declara superficial; en la foto parece llegar al fondo.","Puede pedir pintura",8],
 [2,"warn","Saltaduras chicas en el guardabarros trasero derecho","Puntos blancos junto a la puerta. No cambian el precio.","Menor",7],
 [3,"warn","Raspones en la llanta delantera izquierda","En la cara diamantada de varios rayos.","Estético",3],
 [4,"warn","Raspones en la llanta trasera derecha","Mismo tipo de marca que la delantera.","Estético",7]];

function htmlGaleria(a){
 const fs=fotos(a), i=Math.min(ST.foto,fs.length-1), f=fs[i], resto=a.fotos.length-fs.length;
 return `<div class="galx">
  <button class="gmain" data-lb="${i}" aria-label="Ampliar foto ${i+1}"><img src="${f.src}" alt="${esc(f.l)}"><span class="gzoom">${IC.lupa} Ampliar</span><span class="gcount num">${i+1} / ${a.fotos.length}</span></button>
  ${fs.length>1?`<button class="gnav prev" data-act="foto" data-d="-1" aria-label="Foto anterior">‹</button><button class="gnav next" data-act="foto" data-d="1" aria-label="Foto siguiente">›</button>`:""}
  <p class="gcap">${esc(f.l)}</p>
 </div>
 ${a.fotos.length>1?`<div class="gthumbs">${fs.map((x,k)=>`<button data-act="verfoto" data-i="${k}" aria-label="${esc(x.l)}" aria-current="${k===i}"><img src="${x.src}" alt="" loading="lazy"></button>`).join("")}${resto?`<a class="glock" href="#agencias/${S.sesion?"estado":"alta"}"><img src="${a.fotos[fs.length].src}" alt=""><span>${IC.candado}+${resto} fotos</span></a>`:""}</div>`:`<p class="proto" style="margin-top:10px"><span class="ptag">Ejemplo</span> En la web real cada auto tiene las 10 fotos obligatorias y la revisión completa, como el Peugeot 208.</p>`}`;
}
function escala(a){
 const lo=Math.min(a.piso,a.min)*.93, hi=a.obj*1.05, x=v=>((v-lo)/(hi-lo)*100).toFixed(1)+"%";
 const m=v=>(v/1e6).toLocaleString("es-AR",{maximumFractionDigits:1});
 return `<div class="escala num">
  <div class="eje"></div><div class="banda" style="left:${x(a.piso)};width:calc(${x(a.techo)} - ${x(a.piso)})"></div>
  <div class="mk min" style="left:${x(a.min)}"><span>Mínimo · ${m(a.min)} M</span></div>
  <div class="mk obj" style="left:${x(a.obj)}"><span>Venta al público · ~${m(a.obj)} M</span></div>
  <span class="tk" style="left:${x(a.piso)}">${m(a.piso)}</span><span class="tk" style="left:${x(a.techo)}">${m(a.techo)}</span>
 </div>
 <p class="leyenda"><i></i>Lo que pagan las agencias por autos así (estimado Yacar)</p>
 <div class="facts num"><div><span>Precio objetivo de venta al público</span><b>${fmtM(a.obj)}</b></div><div><span>Margen bruto si comprás al mínimo</span><b>${fmtM(a.obj-a.min)} · ${Math.round((a.obj-a.min)/a.min*100)}%</b></div><div><span>Avisos comparables</span><b>—</b></div></div>
 <p class="muted chico">El precio objetivo es la mediana de lo que piden los avisos de Mercado Libre, DeRuedas y Autocosmos del mismo modelo, versión, año y km parecidos. El margen es antes del fee, la transferencia y la preparación. Los avisos comparables con link se suman cuando corre el relevamiento del día.</p>`;
}
const unite=()=>S.sesion?`<a class="btn sec" href="#agencias/estado">Mi agencia</a>`:`<a class="btn pri" href="#agencias/alta">Sumar mi agencia</a><a class="linkbtn" href="#agencias/ingresar">Ya tengo cuenta</a>`;
// En la vitrina, la sección se ve difuminada y con el acceso encima.
const bloq=(h,txt)=>vit()?`<div class="bloq"><div class="bloqin" aria-hidden="true" inert>${h}</div><div class="bloqcta"><span class="ic">${IC.candado}</span><b>${txt}</b><div>${unite()}</div></div></div>`:h;
// Publicada en claude.ai, la descarga pasa por el permiso "downloads"; abierta desde el Drive, por un link normal.
async function bajarFicha(){
 const nombre="Yacar_ficha_Y-0001_Peugeot-208.pdf";
 const blob=await fetch(FICHA_PDF).then(r=>r.blob()).catch(()=>null);
 const dl=window.claude?.use?await window.claude.use("downloads").catch(()=>null):null;
 if(dl&&blob){ try{ await dl.save({filename:nombre,data:blob}); }catch(e){ if(e?.code!=="declined") aviso("No se pudo descargar la ficha","Probá de nuevo en un rato."); } return; }
 const l=document.createElement("a"); l.download=nombre; l.href=blob?URL.createObjectURL(blob):FICHA_PDF; l.click();
 if(blob) setTimeout(()=>URL.revokeObjectURL(l.href),4000);
}
function htmlAuto(a){
 const fav=ST.fav.has(a.id);
 const kpi=a.kpi.map(([l,v,s,ok])=>`<div class="kpi"><span>${l}</span><b class="${ok?"okc":""}">${v}</b>${s?`<small>${s}</small>`:""}</div>`).join("")
  +`<div class="kpi zona"><span>Zona</span><b>${esc(a.zl)}</b><small>${distTxt(a)}</small></div>`;
 const estado=a.real?`
  <section class="asec"><h2>Estado del auto</h2><p class="muted">Lo vimos en las fotos con nuestra revisión (IA + aprobación del equipo) el 15/10. No es una inspección presencial.</p>
   ${bloq(`<div class="estado">${DIAG}<div class="danos">${DANOS.map(([n,c,t,d,tag,fi])=>`<div class="dano"><span class="n ${c}">${n}</span><div><h4>${t}</h4><p>${d}</p><span class="pill ${c}">${tag}</span></div><button class="dfoto" data-lb="${fi}" aria-label="Ver la foto del daño ${n}"><img src="${a.fotos[fi].src}" alt=""></button></div>`).join("")}</div></div>
   <blockquote class="cita">"El auto está realmente hermoso, muy cuidado y listo para subirse y disfrutar sin ponerle un peso encima. Le hice un encerado hace poco."<cite>Comentario del vendedor</cite></blockquote>
   <div class="cols2x"><div class="box"><h3>Declarado por el dueño</h3><ul class="lista v"><li>Services oficiales en Peugeot SVA CABA, en tiempo y forma.</li><li>Siempre en cochera cubierta.</li><li>Papeles al día, titular directo, radicado en CABA.</li><li>2 llaves. Se entrega transferido.</li></ul></div>
   <div class="box"><h3>A confirmar en la visita</h3><ul class="lista"><li>Profundidad del raspón (pulido o pintura).</li><li>Banda de las cubiertas y llanta delantera derecha.</li><li>Baúl y testigos con el motor en marcha.</li><li>Libreta de services.</li></ul></div></div>`,"Ingresá con tu agencia para ver los daños y lo declarado")}
  </section>`
 :`<section class="asec"><h2>Estado del auto</h2><p class="muted">${esc(a.desc)}</p><p class="proto" style="margin-top:10px"><span class="ptag">Ejemplo</span> Revisión de ejemplo. El Peugeot 208 muestra la revisión completa.</p></section>`;
 return `<div class="wrap sbauto">
  <a class="volver" href="#agencias/subasta">← Subasta de hoy</a>
  <div class="autogrid">
   <div class="automain">
    ${htmlGaleria(a)}
    <div class="atitle"><div><h1>${esc(a.t)} · ${a.a}</h1><p class="muted">${esc(a.v)}</p>
     <p class="ameta num"><span>${a.vistas} vistas</span><span>${a.sig+fav} agencias siguiéndolo</span><span>${a.id}</span></p>
     ${a.real&&!vit()?`<button class="linkbtn pdfbtn" data-act="pdf">${IC.pdf} Descargar la ficha en PDF</button>`:""}</div>
     <div class="atr"><span class="score big"><b>${a.score}</b>/10<small>Yacar Score · según km y estado</small></span>
     ${vit()?"":`<button class="btn sec favb" data-act="fav" data-id="${a.id}" aria-pressed="${fav}">${IC.estrella(fav)} ${fav?"Siguiendo":"Seguir"}</button>`}</div></div>
    <div class="kpis">${kpi}</div>
    <div class="equip"><b>Equipamiento</b>${a.equip.map(x=>`<span>${esc(x)}</span>`).join("")}</div>
    ${estado}
    <section class="asec"><h2>Mercado</h2>${bloq(escala(a),"Ingresá con tu agencia para ver el mercado")}</section>
    <section class="asec"><h2>Papeles</h2><p class="muted">El dueño los declara al día. Antes de la subasta revisamos el informe de dominio; multas, deuda y VTV te llegan con el contacto.</p>
     ${bloq(`<div class="papeles">${["Dominio sin prenda ni embargo","Titular coincide con quien vende","Cédula y título","Radicación"].map(x=>`<div><span>${x}</span><span class="pill ${a.real?"na":"ok"}">${a.real?"A verificar":"En regla"}</span></div>`).join("")}</div>`,"Ingresá con tu agencia para ver los papeles")}</section>
    ${a.real?`<section class="asec"><h2>Fotos</h2><div class="cover"><span class="ok">Esquinas y laterales</span><span class="ok">Asientos delanteros y traseros</span><span class="ok">Tablero encendido</span><span class="ok">Motor</span><span class="na">Baúl</span><span class="na">Banda de cubiertas</span></div></section>`:""}
    <details class="asec reglas"><summary><h2>Cómo funciona la subasta</h2></summary>
     <div class="rgrid"><div><b>Ciega, con máximo</b><p>Ves cuántas ofertas hay y si vas ganando, no los montos. Si ganás, pagás $50.000 más que la segunda (o el mínimo), nunca más que tu máximo.</p></div>
     <div><b>Si llega al mínimo, se vende</b><p>Sin volver a preguntarle al vendedor. Si queda por debajo, el vendedor tiene 24 h para aceptar.</p></div>
     <div><b>Fee solo si ganás</b><p>1,5% del precio, con mínimo de $200.000. Al ofertar lo reservamos en tu tarjeta de crédito (o usás tu garantía) y se cobra recién si ganás. Ahí recibís el contacto y la patente.</p></div>
     <div><b>Visita en 48 h hábiles</b><p>Al ofertar te comprometés a ir a verlo dentro de las 48 h hábiles si ganás. Si algo no declarado aparece, proponés un ajuste con fotos. Bajarse sin motivo: se pierde el fee.</p></div></div></details>
   </div>
   <aside class="bidwrap${ST.panel?" abierto":""}" id="bidwrap"><div class="bidpanel card" id="bidpanel">${htmlPanel(a)}</div></aside>
  </div>
  ${vit()?"":proto(`<button class="linkbtn" data-act="rival" data-id="${a.id}">Otra agencia oferta más</button>${ST.of[a.id]?`<button class="linkbtn" data-act="volver">Salir y volver más tarde</button>`:""}`)}
 </div>
 <div class="bidbar" id="bidbar">${htmlBarra(a)}</div>
 <div class="bidfondo" data-act="cerrarpanel"></div>`;
}
function htmlBarra(a){
 const e=est(a);
 if(vit()) return `<div><span class="num" data-clock>${relojTxt()}</span><b>${e.n} ofertas · mínimo ${velo(fmtM(a.min))}</b></div><button class="btn pri" data-act="abrirpanel">Ofertar</button>`;
 const estado=ST.cerrada?(e.mio?({ganada:"Ganaste",vendedor:"Esperando al vendedor",perdida:"No ganaste"})[e.fin]:"Subasta cerrada"):e.mio?(e.gano?"Vas ganando":"Te superaron"):`${e.n} ofertas · mínimo ${fmtM(a.min)}`;
 return `<div><span class="num" data-clock>${relojTxt()}</span><b class="${e.mio&&!ST.cerrada?(e.gano?"okc":"badc"):""}">${estado}</b></div>${ST.cerrada?`<a class="btn pri" href="#agencias/ofertas">Mis ofertas</a>`:`<button class="btn pri" data-act="abrirpanel">${e.mio?"Mi oferta":"Ofertar"}</button>`}`;
}
function htmlPanelVit(a){
 const e=est(a);
 return `<div class="bphead">${vivo()}<button class="x solo-cel" data-act="cerrarpanel" aria-label="Cerrar">×</button></div>
  <div class="bpclock"><span>${ST.cerrada?"Subasta":"Cierra en"}</span><b class="num" data-clock>${relojTxt()}</b></div>
  <div class="bpmin"><span>Mínimo del vendedor</span><b class="num">${velo(fmt(a.min))}</b><small>Lo ven las agencias aprobadas.</small></div>
  <div class="bpstats num"><div><b>${e.n}</b><span>ofertas</span></div><div><b>${a.sig}</b><span>siguiendo</span></div><div><b>${e.llego?"Sí":"No"}</b><span>llegó al mínimo</span></div></div>
  <div class="bpvit"><span class="ic">${IC.candado}</span><b>${S.sesion?"Tu agencia está en revisión":"Para ofertar, sumá tu agencia"}</b><p>${S.sesion?"Cuando la aprobemos vas a ver el mínimo, la ficha completa y vas a poder ofertar.":"Es gratis. Ves los mínimos, las fotos y la revisión completa, y pagás el fee solo si ganás."}</p>${unite()}</div>`;
}
function htmlPanel(a){
 if(vit()) return htmlPanelVit(a);
 const e=est(a), m=ST.of[a.id];
 const minOferta=m?m.max+PASO:a.piso;
 const borr=ST.borr[a.id]??(m?m.max+250000:Math.max(a.min,a.piso));
 let estado="";
 if(ST.cerrada){
  estado=!e.mio?`<div class="note info">La subasta de hoy cerró. ${e.llego?"Este auto se vendió.":"El vendedor está decidiendo si acepta la mejor oferta."}</div>`
   :e.fin==="ganada"?(ST.pagados[a.id]
     ?`<div class="note ok"><b>¡Ganaste!</b> Comprás a <b class="num">${fmt(e.precio)}</b>. ${cobroTxt(a)}</div><button class="btn pri block" data-act="contacto" data-id="${a.id}">Ver el contacto del vendedor</button>`
     :`<div class="note ok"><b>¡Ganaste!</b> Comprás a <b class="num">${fmt(e.precio)}</b>. ${ST.resto[a.id]!=null&&ST.resto[a.id]<feeOf(e.precio)?`Usamos tu garantía y te queda pagar ${fmt(ST.resto[a.id])}`:"Pagá el fee"} para recibir el contacto del vendedor.</div><button class="btn pri block" data-act="pagar" data-id="${a.id}">Ir a pagar · ${fmt(ST.resto[a.id]??feeOf(e.precio))}</button>`)
   :e.fin==="vendedor"?`<div class="note warn"><b>Tu oferta fue la mejor, pero no llegó al mínimo.</b> El vendedor tiene 24 h para aceptarla. Te avisamos por WhatsApp.</div>`
   :`<div class="note bad"><b>No ganaste.</b> Otra agencia ofertó más que tu máximo de ${fmt(e.max)}.</div>`;
 } else if(e.mio){
  estado=e.gano?`<div class="note ok"><b>Vas ganando</b> con tu máximo de <b class="num">${fmt(e.max)}</b>. Si cerrara ahora, pagarías <b class="num">${fmt(e.precio)}</b>${e.max>=a.min?" y el auto es tuyo.":", pero no llega al mínimo: decidiría el vendedor."}</div>`
   :`<div class="note bad"><b>Te superaron.</b> Otra agencia ofertó más que tu máximo de <b class="num">${fmt(e.max)}</b>. Subí tu oferta para volver a ganar.</div>`;
 } else estado=`<div class="note info">Todavía no ofertaste por este auto.</div>`;
 const v48=`<div class="bp48"><span class="ic">${IC.visita}</span><div><b>Si ganás, vas a verlo en 48 h hábiles</b><span>Es parte del compromiso: pagás el fee, recibís el contacto y coordinás la visita.</span></div></div>`;
 const form=ST.cerrada?"":`
  <div class="bform">
   <label for="bpMonto">${m?"Subir mi oferta máxima":"Tu oferta máxima"}</label>
   <div class="monto"><span>$</span><input id="bpMonto" inputmode="numeric" autocomplete="off" value="${borr.toLocaleString("es-AR")}" aria-describedby="bpAyuda"></div>
   <div class="rapidos">${(m?[[m.max+250000,"+ $250 mil"],[m.max+500000,"+ $500 mil"],[m.max+1000000,"+ $1 M"]]:[[a.min,"Al mínimo"],[a.min+250000,"+ $250 mil"],[a.min+500000,"+ $500 mil"]]).map(([v,l])=>`<button type="button" class="chip sm" data-act="rapido" data-v="${v}">${l}</button>`).join("")}</div>
   <p class="ayuda" id="bpAyuda">${m?`Tiene que ser mayor a tu máximo actual (${fmt(m.max)}).`:`Desde ${fmt(a.piso)}. Ponés lo máximo que pagarías: si ganás, pagás $50.000 más que la segunda.`}</p>
   <p class="letras" id="bpLetras">${letras(borr)}</p>
   <dl class="bcalc num"><div><dt>Si ganás, pagás</dt><dd id="bpPagas">entre ${fmtM(Math.min(borr,Math.max(a.piso,rivMax(a)+PASO)))} y ${fmtM(borr)}</dd></div><div><dt>Fee de Yacar si ganás</dt><dd id="bpFee">${fmt(feeOf(borr))}</dd></div></dl>
   <div class="bmedio">${ST.medio?`<span>Fee asegurado con <b>${ST.medio.tipo==="tarjeta"?ST.medio.txt:"tu garantía ("+fmt(ST.saldo)+")"}</b>${m&&ST.res[a.id]?` · reserva de <b class="num">${fmt(ST.res[a.id])}</b>`:""}</span><button class="linkbtn" data-act="medio">Cambiar</button>`:`<span>Antes de tu primera oferta te pedimos una <b>tarjeta de crédito</b> (reservamos el fee, no lo cobramos) o una <b>garantía</b> por transferencia.</span>`}</div>
   <label class="compromiso"><input type="checkbox" id="bpComp" ${ST.comp[a.id]?"checked":""}><span>Si gano, <b>me comprometo a ir a verlo dentro de las 48 h hábiles y a comprarlo</b> a ese precio si está como se describe.</span></label>
   ${ST.err?`<p class="err" role="alert">${ST.err}</p>`:""}
   <button class="btn pri block" data-act="ofertar" data-id="${a.id}">${m?"Subir mi oferta":"Ofertar"}</button>
   ${m?`<button class="linkbtn cancelar" data-act="cancelar" data-id="${a.id}">Cancelar mi oferta</button>`:""}
   <p class="chico muted">Al ofertar reservamos el fee en tu tarjeta de crédito (o usás tu garantía): se cobra solo si ganás. Podés subir o cancelar tu oferta hasta el cierre.</p>
  </div>`;
 return `<div class="bphead">${vivo()}<button class="x solo-cel" data-act="cerrarpanel" aria-label="Cerrar">×</button></div>
  <div class="bpclock"><span>${ST.cerrada?"Subasta":"Cierra en"}</span><b class="num" data-clock>${relojTxt()}</b></div>
  <div class="bpmin"><span>Mínimo del vendedor</span><b class="num">${fmt(a.min)}</b><small>${e.llego?"Ya hay una oferta que llega al mínimo: se vende al cierre.":"Si una oferta llega a este número, se vende sin preguntarle al vendedor."}</small></div>
  <div class="bpstats num"><div><b>${e.n}</b><span>ofertas</span></div><div><b>${a.sig+ST.fav.has(a.id)}</b><span>siguiendo</span></div><div><b>${e.llego?"Sí":"No"}</b><span>llegó al mínimo</span></div></div>
  ${estado}${ST.cerrada?"":v48}${form}`;
}

/* ---------- Mis ofertas ---------- */
const HIST=[
 {t:"Volkswagen Gol Trend 1.6",a:2019,km:71000,zl:"Caballito",max:9600000,precio:9350000,fin:"ganada",pagado:true,cuando:"Ayer",visita:"Visita: mañana a las 11 h"},
 {t:"Chevrolet Onix 1.2 LT",a:2021,km:54000,zl:"Flores",max:12800000,fin:"perdida",cuando:"Ayer"}
];
function htmlOfertas(tab){
 const mias=AUTOS.filter(a=>ST.of[a.id]).map(a=>({a,e:est(a)}));
 const grupos={
  activas:mias.filter(x=>!ST.cerrada),
  vendedor:mias.filter(x=>x.e.fin==="vendedor"),
  ganadas:mias.filter(x=>x.e.fin==="ganada"),
  perdidas:mias.filter(x=>x.e.fin==="perdida")
 };
 const hist=HIST.filter(h=>(tab==="ganadas"&&h.fin==="ganada")||(tab==="perdidas"&&h.fin==="perdida"));
 const tabs=[["activas","Activas"],["vendedor","Esperando al vendedor"],["ganadas","Ganadas"],["perdidas","No ganadas"]];
 const fila=({a,e})=>{
  const pagado=ST.pagados[a.id];
  const acc=ST.cerrada?(e.fin==="ganada"?(pagado?`<button class="btn sec" data-act="contacto" data-id="${a.id}">Ver contacto</button>`:`<button class="btn pri" data-act="pagar" data-id="${a.id}">Ir a pagar ${fmt(ST.resto[a.id]??feeOf(e.precio))}</button>`)
   :e.fin==="vendedor"?`<span class="proto mini"><span class="ptag">Prototipo</span> <button class="linkbtn" data-act="acepta" data-id="${a.id}">El vendedor acepta</button></span>`:"")
   :`<a class="btn ${e.gano?"sec":"pri"}" href="#agencias/auto/${a.id}">${e.gano?"Ver":"Subir mi oferta"}</a>`;
  return `<li class="fila card"><a href="#agencias/auto/${a.id}" class="fth"><img src="${a.fotos[0].src}" alt=""></a>
   <div class="finfo"><b>${esc(a.t)} · ${a.a}</b><span class="num">${a.km.toLocaleString("es-AR")} km · ${esc(a.zl)}</span><span class="fpills">${pills(a,e)}</span></div>
   <dl class="fnum num"><div><dt>Tu máximo</dt><dd>${fmt(e.max)}</dd></div><div><dt>${ST.cerrada&&e.fin==="ganada"?"Comprás a":"Si cerrara ahora"}</dt><dd>${e.gano?fmt(e.precio):"—"}</dd></div><div><dt>${ST.cerrada?"Fee":"Cierra en"}</dt><dd ${ST.cerrada?"":"data-clock"}>${ST.cerrada?(e.fin==="ganada"?(pagado?(ST.cobro[a.id]?.de==="reserva"?"Cobrado de la reserva":ST.cobro[a.id]?.de==="garantia"?"Cubierto con la garantía":"Pagado"):fmt(ST.resto[a.id]??feeOf(e.precio))):"—"):relojTxt()}</dd></div></dl>
   <div class="facc">${acc}</div></li>`;
 };
 const filaH=h=>`<li class="fila card hist"><div class="fth ic">${IC.bandera}</div><div class="finfo"><b>${h.t} · ${h.a}</b><span class="num">${h.km.toLocaleString("es-AR")} km · ${h.zl} · ${h.cuando}</span><span class="fpills">${h.fin==="ganada"?`<span class="pill ok">Ganaste</span><span class="pill min">Fee pagado</span>`:`<span class="pill bad">No ganaste</span>`}</span></div>
  <dl class="fnum num"><div><dt>Tu máximo</dt><dd>${fmt(h.max)}</dd></div><div><dt>${h.fin==="ganada"?"Compraste a":"Resultado"}</dt><dd>${h.fin==="ganada"?fmt(h.precio):"Otra agencia"}</dd></div><div><dt>${h.fin==="ganada"?"Próximo paso":""}</dt><dd>${h.visita||""}</dd></div></dl><div class="facc"></div></li>`;
 const l=grupos[tab]||[];
 return `<section class="sbhero chico"><div class="wrap"><div class="sbtop"><div><h1>Mis ofertas</h1><p>${ST.cerrada?"La subasta de hoy cerró. Acá ves cómo te fue.":"Tus ofertas de la subasta de hoy y las anteriores."}</p></div>
  <div class="sbclock"><span>${ST.cerrada?"Estado":"Cierra en"}</span><b class="num" data-clock>${relojTxt()}</b><small>${ST.simulada?"Hora simulada (prototipo)":"Hoy a las 19:00"}</small></div></div></div></section>
 <div class="wrap sbbody">
  <nav class="tabs" aria-label="Mis ofertas">${tabs.map(([k,n])=>`<a href="#agencias/ofertas/${k}" aria-current="${k===tab}">${n} <span class="num">${(grupos[k]||[]).length+HIST.filter(h=>(k==="ganadas"&&h.fin==="ganada")||(k==="perdidas"&&h.fin==="perdida")).length}</span></a>`).join("")}</nav>
  <ul class="filas">${l.map(fila).join("")}${hist.map(filaH).join("")}</ul>
  ${!l.length&&!hist.length?`<div class="vacio card"><p>${tab==="activas"?(ST.cerrada?"La subasta de hoy ya cerró.":"Todavía no ofertaste hoy."):"No hay nada acá por ahora."}</p>${tab==="activas"&&!ST.cerrada?`<a class="btn pri" href="#agencias/subasta">Ver la subasta de hoy</a>`:""}</div>`:""}
  ${proto()}
 </div>`;
}

/* ---------- modales: confirmar oferta, cancelar, pago y contacto ---------- */
function modal(h){const m=byId("modal");m.innerHTML=`<div class="mfondo" data-mact="cerrar"></div><div class="mcaja card">${h}</div>`;m.hidden=false;m.querySelector("button.pri, button")?.focus()}
function cerrarModal(){const m=byId("modal");m.hidden=true;m.innerHTML=""}
/* ---------- cómo se asegura el fee: reserva en la tarjeta o garantía (Mercado Pago, simulado) ---------- */
// Tarjeta: reserva de fondos (capture=false) por el fee máximo de la oferta; al cierre se captura al ganador
// (puede ser menos de lo reservado) y se cancela al resto. Garantía: $300.000 por transferencia, se usa para el fee.
function aseguraTxt(a,monto){
 const fee=feeOf(monto), prev=ST.res[a.id];
 if(ST.medio?.tipo==="tarjeta") return `Reservamos <b>${fmt(fee)}</b> en tu ${ST.medio.txt}${prev?` (en lugar de ${fmt(prev)})`:""}: es el fee máximo. <b>Se cobra solo si ganás</b>; si no, se libera al cierre.`;
 return fee<=ST.saldo?`Tu garantía de ${fmt(ST.saldo)} cubre el fee (${fmt(fee)} como máximo). <b>Se usa solo si ganás.</b>`
  :`Tu garantía cubre ${fmt(ST.saldo)}. Si ganás, la diferencia (hasta ${fmt(fee-ST.saldo)}) la pagás con Mercado Pago dentro de las 24 h; si no, perdés la garantía.`;
}
function cobroTxt(a){
 const c=ST.cobro[a.id]; if(!c) return "Fee pagado.";
 return c.de==="reserva"?`Cobramos el fee de ${fmt(c.monto)} de tu reserva${c.res>c.monto?` (habías reservado ${fmt(c.res)}; el resto se liberó)`:""}.`:`Usamos ${fmt(c.monto)} de tu garantía para el fee.`;
}
function liquidar(a){
 const fee=feeOf(est(a).precio);
 if(ST.medio?.tipo==="tarjeta"){ ST.cobro[a.id]={de:"reserva",monto:fee,res:ST.res[a.id]||fee}; ST.pagados[a.id]=true; delete ST.res[a.id]; return cobroTxt(a)+" Ya tenés el contacto del vendedor."; }
 const usa=Math.min(fee,ST.saldo); ST.saldo-=usa; ST.resto[a.id]=fee-usa;
 if(!ST.resto[a.id]){ ST.cobro[a.id]={de:"garantia",monto:usa}; ST.pagados[a.id]=true; return `Usamos ${fmt(usa)} de tu garantía para el fee. Ya tenés el contacto del vendedor.`; }
 return `Usamos tu garantía (${fmt(usa)}) y te queda pagar ${fmt(ST.resto[a.id])} con Mercado Pago dentro de las 24 h para recibir el contacto.`;
}
const sinMedio=()=>!ST.medio||(ST.medio.tipo==="garantia"&&ST.saldo<=0);
function medio(a,monto){
 const d=`data-id="${a?.id||""}" data-v="${monto||""}"`;
 modal(`<button class="x" data-mact="cerrar" aria-label="Cerrar">×</button><span class="kicker">${a?"Antes de tu primera oferta":"Medio para asegurar el fee"}</span>
  <h2>¿Cómo asegurás el fee?</h2>
  <p class="muted" style="margin:6px 0 14px">El fee (1,5%, mínimo $200.000) se cobra solo si ganás. Para que cada oferta sea en serio, lo dejamos asegurado antes de ofertar.</p>
  <div class="medios">
   <button class="medio" data-mact="tarjeta" ${d}><span class="mtag">Recomendado</span><b>Tarjeta de crédito</b><span>Reservamos el fee máximo de cada oferta. Si ganás, lo cobramos al cierre; si no, se libera. No es un cobro: lo ves como consumo pendiente.</span></button>
   <button class="medio" data-mact="garantia" ${d}><b>Garantía por transferencia</b><span>Transferís ${fmt(GARANTIA)} una vez. Si ganás, se usa para el fee; si ganás y no pagás, se pierde. Para agencias sin tarjeta de crédito.</span></button>
  </div>
  <p class="proto mini" style="margin-top:12px"><span class="ptag">Prueba</span> Simulado: en la web real va el formulario seguro de Mercado Pago y términos firmados con penalidad.</p>`);
}
function medioTarjeta(d){
 modal(`<button class="x" data-mact="cerrar" aria-label="Cerrar">×</button><span class="kicker">Tarjeta de crédito</span><h2>Cargá tu tarjeta</h2>
  <div class="brick"><div class="mplogo">Mercado Pago</div>
   <label>Número de tarjeta<input value="4509 9535 6623 3704" readonly></label>
   <div class="b2"><label>Vencimiento<input value="11/30" readonly></label><label>Código de seguridad<input value="•••" readonly></label></div>
   <label>Titular<input value="AGENCIA DE PRUEBA SRL" readonly></label></div>
  <p class="muted chico" style="margin-top:10px">Solo de crédito. Reservamos el fee de cada oferta y lo cobramos solo si ganás; la reserva dura hasta que se decide la subasta.</p>
  <div class="mbtns"><button class="btn sec" data-mact="medio" ${d}>Volver</button><button class="btn pri" data-mact="tarjetaok" ${d}>Guardar tarjeta</button></div>
  <p class="proto mini" style="margin-top:10px"><span class="ptag">Prueba</span> Tarjeta de prueba: no se reserva ni se cobra nada.</p>`);
}
function medioGarantia(d){
 modal(`<button class="x" data-mact="cerrar" aria-label="Cerrar">×</button><span class="kicker">Garantía</span><h2>Transferí ${fmt(GARANTIA)}</h2>
  <dl class="mres num"><div><dt>Alias</dt><dd>YACAR.GARANTIA.PRUEBA</dd></div><div><dt>CBU</dt><dd>0000000000000000000000</dd></div><div><dt>Titular</dt><dd>Yacar (prueba)</dd></div></dl>
  <ul class="lista v" style="margin-top:12px"><li>Si ganás, se usa para el fee. Si el fee es mayor, pagás la diferencia con Mercado Pago dentro de las 24 h.</li><li>Si ganás y no pagás, perdés la garantía.</li><li>Te la devolvemos cuando dejes de operar.</li></ul>
  <div class="mbtns"><button class="btn sec" data-mact="medio" ${d}>Volver</button><button class="btn pri" data-mact="garantiaok" ${d}>Ya transferí</button></div>
  <p class="proto mini" style="margin-top:10px"><span class="ptag">Prueba</span> Datos inventados: no transfieras nada.</p>`);
}
function medioListo(a,monto){
 if(a&&monto) return confirmar(a,monto);
 cerrarModal(); pintar();
 aviso("Medio actualizado",ST.medio.tipo==="tarjeta"?`Las próximas reservas van a tu ${ST.medio.txt}.`:`Tu garantía de ${fmt(ST.saldo)} cubre las próximas ofertas.`);
}
function confirmar(a,monto){
 const m=ST.of[a.id];
 modal(`<button class="x" data-mact="cerrar" aria-label="Cerrar">×</button><span class="kicker">${m?"Subir tu oferta":"Confirmá tu oferta"}</span>
  <h2>${esc(a.t)} · ${a.a}</h2>
  <div class="mmonto num">${fmt(monto)}</div><p class="letras">${letras(monto)}</p>
  <ul class="lista v"><li>Es tu oferta <b>máxima</b>: si ganás, pagás $50.000 más que la segunda (o el mínimo), nunca más que esto.</li><li>${monto>=a.min?"Llega al mínimo del vendedor: si ganás, <b>el auto es tuyo</b> sin preguntarle.":"No llega al mínimo del vendedor: si ganás, él tiene 24 h para aceptar."}</li><li>${aseguraTxt(a,monto)}</li><li><b>Es un compromiso:</b> si ganás, vas a ver el auto dentro de las 48 h hábiles y lo comprás si está como se describe.</li></ul>
  <div class="mbtns"><button class="btn sec" data-mact="cerrar">Volver</button><button class="btn pri" data-mact="ok" data-id="${a.id}" data-v="${monto}">Confirmar oferta</button></div>`);
}
function pagar(a){
 const e=est(a), total=feeOf(e.precio), fee=ST.resto[a.id]??total, gar=total-fee;
 modal(`<button class="x" data-mact="cerrar" aria-label="Cerrar">×</button><span class="kicker">Ganaste</span><h2>${esc(a.t)} · ${a.a}</h2>
  <dl class="mres num"><div><dt>Precio de compra</dt><dd>${fmt(e.precio)}</dd></div><div class="sub"><dt>Se lo pagás al vendedor el día de la firma</dt><dd></dd></div>${gar?`<div><dt>Fee de Yacar (1,5%, mínimo $200.000)</dt><dd>${fmt(total)}</dd></div><div><dt>Cubierto con tu garantía</dt><dd>− ${fmt(gar)}</dd></div><div class="tot"><dt>Te queda pagar</dt><dd>${fmt(fee)}</dd></div>`:`<div class="tot"><dt>Fee de Yacar (1,5%, mínimo $200.000)</dt><dd>${fmt(fee)}</dd></div>`}</dl>
  <p class="muted">Al acreditarse el pago te pasamos el nombre, el WhatsApp y la patente, y coordinás la visita dentro de las 48 h hábiles. Si el vendedor declaró mal o se baja, te devolvemos el fee.</p>
  <button class="btn mp block" data-mact="mp" data-id="${a.id}">Pagar ${fmt(fee)} con Mercado Pago</button>
  <p class="proto mini" style="margin-top:10px"><span class="ptag">Prueba</span> No se cobra nada: el pago está simulado. Después va el checkout de Mercado Pago.</p>`);
}
function procesando(a){
 modal(`<div class="mpsim"><div class="mplogo">Mercado Pago</div><span class="spin"></span><p>Procesando el pago…</p><span class="ptag">Simulado</span></div>`);
 setTimeout(()=>{ST.pagados[a.id]=true;ST.resto[a.id]=0;contacto(a,true);aviso("Pago acreditado",`Ya tenés el contacto del vendedor del ${esc(a.t)}. Coordiná la visita dentro de las 48 h hábiles.`,"#agencias/ofertas/ganadas");},1300);
}
function contacto(a,recien){
 const vence=typeof vencePlazoVisita==="function"?vencePlazoVisita(new Date()):null;
 const f=vence?vence.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"numeric"})+" (48 h hábiles)":"48 h hábiles";
 modal(`<button class="x" data-mact="cerrar" aria-label="Cerrar">×</button>${recien?`<div class="note ok"><b>Pago aprobado.</b> Te mandamos todo también por WhatsApp y mail.</div>`:""}
  <h2 style="margin-top:12px">Contacto del vendedor</h2>
  <dl class="mres num"><div><dt>Vendedor</dt><dd>Vendedor de prueba (titular)</dd></div><div><dt>WhatsApp</dt><dd>11 0000-0000</dd></div><div><dt>Patente</dt><dd>AA 000 AA</dd></div><div><dt>Dónde está el auto</dt><dd>${esc(a.zl)}</dd></div><div><dt>Visita, hasta el</dt><dd>${f}</dd></div></dl>
  <p class="proto mini"><span class="ptag">Prueba</span> Datos inventados: nunca mostramos datos reales en el prototipo.</p>
  <div class="mbtns"><button class="btn pri" data-mact="cerrar">Listo</button></div>`);
}

/* ---------- lightbox con zoom ---------- */
let LB={a:null,i:0};
function lbAbrir(a,i){LB={a,i};lbPintar();byId("lb").hidden=false;document.documentElement.style.overflow="hidden";byId("lb").querySelector(".lbx")?.focus()}
function lbCerrar(){byId("lb").hidden=true;document.documentElement.style.overflow="";ST.foto=LB.i;if(vistaActual==="auto") pintar()}
function lbPintar(){
 const fs=fotos(LB.a), f=fs[LB.i], n=fs.length;
 byId("lb").innerHTML=`<div class="lbtop"><span class="num">${LB.i+1} / ${n} · ${esc(f.l)}</span><button class="lbx" data-lb-act="cerrar" aria-label="Cerrar">×</button></div>
  <div class="lbimg" data-lb-act="zoom"><img src="${f.src}" alt="${esc(f.l)}" draggable="false"></div>
  ${n>1?`<button class="lbnav prev" data-lb-act="prev" aria-label="Anterior">‹</button><button class="lbnav next" data-lb-act="next" aria-label="Siguiente">›</button>`:""}
  <p class="lbtip">Tocá la foto para hacer zoom · flechas para pasar</p>`;
}
function lbMover(d){const n=fotos(LB.a).length;LB.i=(LB.i+d+n)%n;lbPintar()}
function initLB(){
 const lb=byId("lb");
 lb.addEventListener("click",e=>{
  const t=e.target.closest("[data-lb-act]"); if(!t){ if(e.target===lb) lbCerrar(); return; }
  const k=t.dataset.lbAct;
  if(k==="cerrar") lbCerrar(); else if(k==="prev") lbMover(-1); else if(k==="next") lbMover(1);
  else if(k==="zoom"){ const z=t.classList.toggle("zoom"); if(z) origen(t,e); }
 });
 const origen=(box,e)=>{const r=box.getBoundingClientRect();box.querySelector("img").style.transformOrigin=`${((e.clientX-r.left)/r.width*100).toFixed(1)}% ${((e.clientY-r.top)/r.height*100).toFixed(1)}%`};
 lb.addEventListener("pointermove",e=>{const b=e.target.closest(".lbimg.zoom");if(b) origen(b,e)});
 let x0=null;
 lb.addEventListener("pointerdown",e=>{x0=e.clientX});
 lb.addEventListener("pointerup",e=>{if(x0!==null&&!lb.querySelector(".lbimg.zoom")&&Math.abs(e.clientX-x0)>60) lbMover(e.clientX<x0?1:-1);x0=null});
 window.addEventListener("keydown",e=>{
  if(!lb.hidden){ if(e.key==="Escape") lbCerrar(); if(e.key==="ArrowRight") lbMover(1); if(e.key==="ArrowLeft") lbMover(-1); return; }
  if(!byId("modal").hidden&&e.key==="Escape") cerrarModal();
 });
}

/* ---------- acciones ---------- */
let vistaActual="", autoActual=null, tabActual="activas";
function pintar(){
 const el=byId("vSubasta");
 const y=window.scrollY;
 el.innerHTML=vistaActual==="subasta"?htmlLista():vistaActual==="auto"?htmlAuto(autoActual):htmlOfertas(tabActual);
 window.scrollTo(0,y);
 bindMonto(); badge();
}
function badge(){ const b=byId("navSuperado"), n=vit()?0:superados().length; if(b){ b.hidden=!n; b.textContent=n; } }
function pintarPanel(){ if(vistaActual!=="auto") return pintar(); byId("bidpanel").innerHTML=htmlPanel(autoActual); byId("bidbar").innerHTML=htmlBarra(autoActual); bindMonto(); }
function bindMonto(){
 const i=byId("bpMonto"); if(!i||!autoActual) return; const a=autoActual;
 i.addEventListener("input",()=>{
  const d=i.value.replace(/\D/g,"").slice(0,10), n=+d||0;
  ST.borr[a.id]=n; i.value=n?n.toLocaleString("es-AR"):"";
  byId("bpLetras").textContent=n?letras(n):"";
  byId("bpFee").textContent=fmt(feeOf(n));
  byId("bpPagas").textContent=`entre ${fmtM(Math.min(n,Math.max(a.piso,rivMax(a)+PASO)))} y ${fmtM(n)}`;
 });
 byId("bpComp")?.addEventListener("change",e=>{ST.comp[a.id]=e.target.checked});
}
function rival(a){
 const m=ST.of[a.id], antes=est(a);
 const v=m?m.max+150000+Math.round(Math.random()*4)*PASO:rivMax(a)+250000;
 a.riv.push(v);
 const ag=AGS[(a.riv.length+3)%AGS.length];
 ST.feed.unshift({ts:Date.now(),txt:`Una agencia de ${ag} ofertó por el <b>${a.t} ${a.a}</b>`});
 if(!antes.llego&&est(a).llego) ST.feed.unshift({ts:Date.now(),txt:`El <b>${a.t} ${a.a}</b> llegó al mínimo del vendedor`,ok:1});
 if(m&&antes.gano) aviso(`Te superaron en el ${esc(a.t)}`,`Otra agencia ofertó más que tu máximo de ${fmt(m.max)}. Quedan ${hms(restaMs())} para subir tu oferta.`,`#agencias/auto/${a.id}`);
 pintar();
}
// Prototipo: la agencia sale, otra la supera mientras no está y, al volver, lo ve arriba de todo.
function volver(){
 AUTOS.forEach(a=>{ const m=ST.of[a.id]; if(m&&est(a).gano){ a.riv.push(m.max+100000+Math.round(Math.random()*3)*PASO); ST.feed.unshift({ts:Date.now()-25*60000,txt:`Una agencia de ${AGS[(a.riv.length+3)%AGS.length]} ofertó por el <b>${a.t} ${a.a}</b>`}); } });
 ST.volviste=true;
 if(vistaActual!=="subasta"){ location.hash="#agencias/subasta"; } else { pintar(); window.scrollTo(0,0); }
 const l=superados();
 if(l.length) setTimeout(()=>aviso("Mientras no estabas",`Te superaron en ${l.map(a=>"el "+esc(a.t)).join(" y ")}. Todavía podés subir tu oferta.`,"#agencias/auto/"+l[0].id),500);
}
function cerrar(){
 ST.cerrada=true;
 AUTOS.forEach(a=>{const e=est(a); if(!e.mio) return;
  const r=ST.res[a.id];
  if(e.fin==="ganada") aviso(`¡Ganaste el ${esc(a.t)}!`,`Comprás a ${fmt(e.precio)}. ${liquidar(a)}`,"#agencias/ofertas/ganadas");
  else if(e.fin==="vendedor") aviso(`Tu oferta por el ${esc(a.t)} fue la mejor`,`No llegó al mínimo: el vendedor tiene 24 h para aceptarla.${r?` La reserva de ${fmt(r)} sigue hasta que decida.`:""}`,"#agencias/ofertas/vendedor");
  else { delete ST.res[a.id]; aviso(`No ganaste el ${esc(a.t)}`,`Otra agencia ofertó más.${r?` Liberamos la reserva de ${fmt(r)}: no se cobra nada.`:""} Mañana a las 9 h te llega la subasta nueva.`); }
 });
 pintar();
}
function onClick(e){
 const t=e.target.closest("[data-act],[data-lb]"); if(!t) return;
 if(t.dataset.lb!==undefined&&!t.dataset.act){ e.preventDefault(); lbAbrir(autoActual,+t.dataset.lb); return; }
 const k=t.dataset.act, a=BY[t.dataset.id]||autoActual;
 if(k==="alista"){ e.preventDefault(); byId("lista")?.scrollIntoView({behavior:"smooth"}); return; }
 if(k==="filtro"){ ST.filtro=t.dataset.v; return pintar(); }
 if(k==="fav"){ e.preventDefault(); ST.fav.has(a.id)?ST.fav.delete(a.id):ST.fav.add(a.id); return pintar(); }
 if(k==="cerrarguia"){ ST.guia=false; return pintar(); }
 if(k==="foto"){ const n=fotos(a).length; ST.foto=(ST.foto+ +t.dataset.d+n)%n; return pintar(); }
 if(k==="verfoto"){ ST.foto=+t.dataset.i; return pintar(); }
 if(k==="abrirpanel"){ ST.panel=true; byId("bidwrap").classList.add("abierto"); byId("vSubasta").classList.add("sheet"); return; }
 if(k==="cerrarpanel"){ ST.panel=false; byId("bidwrap")?.classList.remove("abierto"); byId("vSubasta").classList.remove("sheet"); return; }
 if(k==="rapido"){ ST.borr[a.id]=+t.dataset.v; ST.err=""; return pintarPanel(); }
 if(k==="ofertar"){
  const m=ST.of[a.id], n=ST.borr[a.id]??+(byId("bpMonto").value.replace(/\D/g,""));
  ST.err=!n||n<a.piso?`La oferta mínima para este auto es ${fmt(a.piso)}.`:m&&n<=m.max?`Para subirla, tiene que ser mayor a tu máximo actual (${fmt(m.max)}).`:n>a.obj*1.5?"Revisá el monto: es mucho más que lo que se pide en los avisos.":!ST.comp[a.id]?"Para ofertar, marcá el compromiso de compra.":"";
  if(ST.err) return pintarPanel();
  const monto=Math.round(n/10000)*10000;
  return sinMedio()?medio(a,monto):confirmar(a,monto);
 }
 if(k==="cancelar"){ modal(`<h2>¿Cancelar tu oferta?</h2><p class="muted" style="margin:10px 0 18px">Tu máximo de ${fmt(ST.of[a.id].max)} deja de contar. Podés volver a ofertar hasta el cierre.</p><div class="mbtns"><button class="btn sec" data-mact="cerrar">No, dejarla</button><button class="btn pri" data-mact="cancelar" data-id="${a.id}">Sí, cancelarla</button></div>`); return; }
 if(k==="rival"){ return rival(a); }
 if(k==="volver"){ return volver(); }
 if(k==="pdf"){ return bajarFicha(); }
 if(k==="medio"){ return medio(null,0); }
 if(k==="ultimahora"){ ST.cierre=Date.now()+(59*60+40)*1000; ST.simulada=true; ST.ultimaAvisada=false; return pintar(); }
 if(k==="cerrar"){ return cerrar(); }
 if(k==="reabrir"){ ST.cerrada=false; ST.cierre=Date.now()+(2*3600+15*60)*1000; ST.simulada=true; ST.ultimaAvisada=false; return pintar(); }
 if(k==="pagar"){ return pagar(a); }
 if(k==="contacto"){ return contacto(a,false); }
 if(k==="acepta"){ ST.acepta[a.id]=true; aviso(`El vendedor aceptó tu oferta`,`El ${esc(a.t)} es tuyo a ${fmt(est(a).precio)}. ${liquidar(a)}`,"#agencias/ofertas/ganadas"); return pintar(); }
}
function onModal(e){
 const t=e.target.closest("[data-mact]"); if(!t) return;
 const k=t.dataset.mact, a=BY[t.dataset.id];
 if(k==="cerrar") return cerrarModal();
 if(k==="ok"){
  const v=+t.dataset.v, antes=ST.of[a.id];
  ST.of[a.id]={max:v,at:Date.now()}; ST.borr[a.id]=undefined; ST.err="";
  if(ST.medio?.tipo==="tarjeta") ST.res[a.id]=feeOf(v);
  ST.feed.unshift({ts:Date.now(),txt:`Tu agencia ofertó por el <b>${a.t} ${a.a}</b>`,mia:1});
  cerrarModal(); ST.panel=false; byId("vSubasta").classList.remove("sheet"); pintar();
  const e2=est(a);
  aviso(antes?"Subiste tu oferta":"Oferta confirmada",(e2.gano?`Vas ganando el ${esc(a.t)}. Te avisamos por acá si otra agencia te supera.`:`Otra agencia ofertó más que ${fmt(v)}. Podés subir tu oferta hasta el cierre.`)+(ST.res[a.id]?` Reservamos ${fmt(ST.res[a.id])} en tu tarjeta (se cobra solo si ganás).`:""),`#agencias/auto/${a.id}`);
  return;
 }
 if(k==="cancelar"){ if(ST.res[a.id]) aviso("Liberamos la reserva",`Los ${fmt(ST.res[a.id])} del ${esc(a.t)} vuelven al límite de tu tarjeta.`); delete ST.res[a.id]; delete ST.of[a.id]; ST.feed=ST.feed.filter(f=>!(f.mia&&f.txt.includes(a.t))); cerrarModal(); return pintar(); }
 if(k==="mp") return procesando(a);
 const d=`data-id="${t.dataset.id||""}" data-v="${t.dataset.v||""}"`, monto=+t.dataset.v||0;
 if(k==="medio") return medio(a,monto);
 if(k==="tarjeta") return medioTarjeta(d);
 if(k==="garantia") return medioGarantia(d);
 if(k==="tarjetaok"){
  // si venía de garantía, la garantía queda y se devuelve aparte; las reservas nuevas van a la tarjeta
  ST.medio={tipo:"tarjeta",txt:"Visa •••• 3704"};
  AUTOS.forEach(x=>{ if(ST.of[x.id]&&!ST.cerrada) ST.res[x.id]=feeOf(ST.of[x.id].max); });
  return medioListo(a,monto);
 }
 if(k==="garantiaok"){
  modal(`<div class="mpsim"><span class="spin"></span><p>Buscando tu transferencia…</p><span class="ptag">Simulado</span></div>`);
  setTimeout(()=>{ ST.medio={tipo:"garantia",txt:"tu garantía"}; ST.saldo=GARANTIA; ST.res={}; medioListo(a,monto); },1100);
  return;
 }
}

/* ---------- reloj y aviso de la última hora ---------- */
function tick(){
 if(!vistaActual||byId("vSubasta").hidden) return;
 const ms=restaMs();
 byId("vSubasta").querySelectorAll("[data-clock]").forEach(el=>{el.textContent=relojTxt();el.classList.toggle("ultima",!ST.cerrada&&ms<3600000)});
 if(!ST.cerrada&&ms<3600000&&!ST.ultimaAvisada){
  ST.ultimaAvisada=true;
  const mias=AUTOS.filter(a=>ST.of[a.id]||ST.fav.has(a.id));
  aviso("Queda 1 hora para el cierre",mias.length?`Estás siguiendo ${mias.map(a=>esc(a.t)).join(", ")}. La subasta cierra a las 19 h.`:"La subasta de hoy cierra a las 19 h.","#agencias/subasta");
 }
 if(!ST.cerrada&&ms===0) cerrar();
}

/* ---------- entrada desde el router de agencias.js ---------- */
window.YacarSubasta={
 render(v,parts,prev){
  vistaActual=v; ST.err="";
  const antes=autoActual;
  if(v==="auto"){ autoActual=BY[parts[0]]||null; if(!autoActual){ location.hash="#agencias/subasta"; return; } if(antes!==autoActual){ST.foto=0;ST.panel=false} }
  else autoActual=null;
  if(v==="ofertas") tabActual=["activas","vendedor","ganadas","perdidas"].includes(parts[0])?parts[0]:"activas";
  byId("vSubasta").classList.remove("sheet");
  pintar();
  if(prev!==v||antes!==autoActual){ window.scrollTo(0,0); Suave.entrar(byId("vSubasta"),"fade"); }
  if(!ST.bienvenida&&!vit()){ ST.bienvenida=true; setTimeout(()=>aviso("Subasta de hoy: "+AUTOS.length+" autos","Abre a las 10 h y cierra a las 19 h. El Peugeot 208 Feline 2022 coincide con lo que buscás.","#agencias/auto/Y-0001"),600); }
 },
 reset(){ ST=nuevo(); semilla(); AUTOS.forEach(a=>{a.riv=a.riv.slice(0,a.id==="Y-0003"?2:3)}); }
};
byId("vSubasta").addEventListener("click",onClick);
byId("vSubasta").addEventListener("change",e=>{ if(e.target.matches("select[data-act=orden]")){ ST.orden=e.target.value; pintar(); } });
byId("modal").addEventListener("click",onModal);
initLB();
setInterval(tick,1000);
if(/^#agencias\/(subasta|auto|ofertas)/.test(location.hash)) A.route();
})();
