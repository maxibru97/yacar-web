/* ===================== Portal de subasta para agencias (18/10/2026; sobre cerrado desde el 18/10 noche) =====================
 Estructura de Maxi (subastas en vivo de Motordil); reglas cambiadas por Gonzalo el 18/10 a la noche:
  #agencias/subasta        Subasta de hoy
  #agencias/auto/Y-0001    Página del auto + panel para ofertar
  #agencias/ofertas[/tab]  Mis ofertas: enviadas, esperando al vendedor, ganadas y no ganadas
 Quién ve qué (3 niveles):
  0. Sin cuenta: solo que hay subasta hoy, cuántos autos, modelo y año, con un dibujo genérico. Nada más.
  1. Agencia en revisión: la lista con versión, km y distancia, sin fotos, sin barrio y sin ficha.
  2. Agencia aprobada: todo, menos el mínimo del vendedor y lo de las otras agencias.
  En la web real los datos de cada nivel los filtra el servidor (Supabase); acá están en el código porque es un prototipo.
 Reglas (20/10/2026, Maxi: documento "Subasta para agencias: reglas propuestas"; reemplazan el sobre cerrado del 18/10):
  - Cada agencia carga su máximo, que nadie ve. Todos ven el precio actual. El ganador paga la segunda oferta + $50.000
    (o el mínimo del vendedor si es más; con una sola oferta, el precio de salida). Se puede subir el máximo, no bajarlo ni cancelarlo.
  - Precio de salida: 90% del inicio de la franja del motor (85% con pocos avisos), nunca arriba del mínimo del vendedor. Debajo no se oferta.
  - La franja del motor no se muestra (Maxi: no anclar las ofertas en el medio). Solo una frase según dónde cae el máximo, sin números.
  - El mínimo del vendedor no se muestra: cuando un máximo lo alcanza, el precio salta a ese mínimo y sale el cartel "Llegó al mínimo".
    Si la más alta no llega, el vendedor tiene 24 h para aceptar el precio final (D-47).
  - Lanzamiento sin fee (se muestra tachado) y sin tarjeta. Faltas: ganar y no ir a verlo, o no comprarlo si coincide con la ficha. 2 faltas = 30 días afuera.
  - Si el auto no coincide con la ficha, la agencia se baja sin falta, con fotos de la visita que revisa Yacar.
  - Coordinar ofertas entre agencias está prohibido (Ley 27.442, art. 2 inc. d) y es motivo de baja.
 Todo es simulado: las ofertas de las otras agencias, el cierre y los WhatsApp del bot. Usa lo que expone agencias.js (window.YacarAg). */
(()=>{
const A=window.YacarAg; if(!A) return;
const {S,byId,esc,fmt,fmtM,ZBY,DEMO_BASE,dist,banda,carIcon}=A;
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
 {id:"Y-0002",t:"Fiat Cronos 1.3 Drive",a:2023,v:"1.3 manual · ejemplo",km:38000,z:"moron",zl:"Morón (zona Haedo)",min:16900000,piso:16300000,techo:18000000,obj:20800000,score:8,sig:9,vistas:27,riv:[],fotos:[{src:A.FOTOS.cronos,l:"Esquina delantera"}],
  kpi:[["Kilómetros","38.000","declarados"],["Caja","Manual",""],["Dueños","1",""],["Services oficiales","Sí","",1],["Tapizado","Tela",""],["Cubiertas","Buenas",""]],equip:["Pantalla táctil","Sensores de estacionamiento"],desc:"Sedán con poco uso, services al día."},
 {id:"Y-0003",t:"Toyota Hilux 2.4 DX 4x4",a:2018,v:"2.4 turbodiésel · ejemplo",km:132000,z:"vlopez",zl:"Vicente López",min:29500000,piso:28400000,techo:31000000,obj:36000000,score:6,sig:15,vistas:52,riv:[27200000],fotos:[{src:A.FOTOS.hilux,l:"Esquina delantera"}],
  kpi:[["Kilómetros","132.000","declarados"],["Caja","Manual",""],["Dueños","2",""],["Services oficiales","No","taller de confianza"],["Tapizado","Tela",""],["Cubiertas","Regulares","cambiar dentro del año"]],equip:["4x4","Enganche"],desc:"Pickup de trabajo, mecánica sana, detalles de uso en la caja."},
 {id:"Y-0004",t:"Honda CR-V 2.4 EX-L 4x4 AT",a:2014,v:"2.4 automática · ejemplo",km:118000,z:"sanisidro",zl:"San Isidro",min:23900000,piso:23000000,techo:25200000,obj:29400000,score:6,sig:7,vistas:23,riv:[23200000,23500000,24000000],fotos:[{src:A.FOTOS.crv,l:"Esquina delantera"}],
  kpi:[["Kilómetros","118.000","declarados"],["Caja","Automática",""],["Dueños","2",""],["Services oficiales","Sí","",1],["Tapizado","Cuero",""],["Cubiertas","Buenas",""]],equip:["Techo solar","Cuero","4x4"],desc:"SUV familiar cuidada, con techo solar."}
];
const BY=Object.fromEntries(AUTOS.map(a=>[a.id,a]));
const RIV0=Object.fromEntries(AUTOS.map(a=>[a.id,a.riv.slice()]));
// Sondeo de mercado con el que entra cada auto a la subasta: cuántos avisos y de qué día (ejemplo).
const SONDEO={"Y-0001":[23,"17/10"],"Y-0002":[41,"17/10"],"Y-0003":[18,"17/10"],"Y-0004":[12,"17/10"]};
AUTOS.forEach(a=>{[a.nav,a.sondeo]=SONDEO[a.id]||[0,""]});
// Dibujo genérico para quien no está aprobado (sin fotos reales del auto). Una foto del modelo de catálogo tiene derechos: ver PASAR_A_REAL.md.
const DIBUJO={"Y-0001":["#9AA3AA",0],"Y-0002":["#9AA3AA",0],"Y-0003":["#9AA3AA",1],"Y-0004":["#9AA3AA",0]};
const dibujo=(a,w)=>carIcon(DIBUJO[a.id]?.[0]||"#9AA3AA",w,!!DIBUJO[a.id]?.[1]);

/* ---------- estado del portal ---------- */
const nuevo=()=>({of:{},fav:new Set(["Y-0001"]),cerrada:false,cierre:0,simulada:false,ultimaAvisada:false,bienvenida:false,guia:true,acepta:{},subir:{},
 filtro:"todos",orden:"score",foto:0,panel:false,borr:{},venta:{},comp:{},err:""});
let ST=nuevo();
function semilla(){
 const now=Date.now(), h=new Date().getHours();
 if(h>=10&&h<19){const t=new Date();t.setHours(19,0,0,0);ST.cierre=t.getTime();ST.simulada=false}
 else {ST.cierre=now+(2*3600+15*60)*1000;ST.simulada=true}
}
semilla();

/* ---------- reglas (20/10): máximo oculto, precio actual visible, el ganador paga la segunda + $50.000 ---------- */
const SUBA=50000;    // lo que paga el ganador por arriba de la segunda oferta
const POCOS=15;      // con menos avisos en el sondeo, el motor tiene pocos datos: la salida baja al 85%
const r10=v=>Math.round(v/10000)*10000;
const fmtP=n=>"$ "+(n/1e6).toLocaleString("es-AR",{minimumFractionDigits:2,maximumFractionDigits:2})+" M";   // precios con 2 decimales: $ 19,45 M
const salida=a=>Math.min(r10(a.piso*(a.nav<POCOS?.85:.9)),a.min);
// Fee tachado: el de agencias.js (1,5% con mínimo de $200 mil), bonificado en el lanzamiento.
const feeLista=p=>Math.max(p*.015,200000);
// a.riv son los máximos (simulados) de las otras agencias: no se muestran nunca, ni cuántos hay.
function subasta(a){
 const m=ST.of[a.id];
 const of=a.riv.map(v=>({v,yo:false})).concat(m?[{v:m.monto,yo:true}]:[])
  .sort((x,y)=>y.v-x.v||(x.yo?1:0)-(y.yo?1:0));   // empate: gana el máximo cargado antes (los de las otras agencias llegaron antes)
 if(!of.length) return {hay:false,precio:salida(a),minOk:false,lider:false,por:"salida"};
 const [top,seg]=of;
 let precio=seg?Math.min(top.v,seg.v+SUBA):salida(a), por=!seg?"salida":precio===top.v?"tope":"segunda";
 const minOk=top.v>=a.min;
 if(minOk&&precio<a.min){ precio=a.min; por="minimo"; }   // como eBay: al llegar al mínimo, el precio salta a él
 return {hay:true,precio,minOk,lider:top.yo,por};
}
function est(a){
 const m=ST.of[a.id], s=subasta(a);
 if(!m) return {...s,mio:false};
 const gano=s.lider;
 let fin=null;
 if(ST.cerrada) fin=!gano?"perdida":(s.minOk||ST.acepta[a.id])?"ganada":"vendedor";
 return {...s,mio:true,monto:m.monto,at:m.at,gano,fin};
}
// Desde cuánto se puede cargar un máximo: el precio de salida, o el precio actual + $50.000 si ya hay ofertas de otros.
// Quien ya ofertó solo puede subir el suyo.
function desde(a){
 const e=est(a);
 let d=e.hay&&!(e.mio&&e.gano)?e.precio+SUBA:salida(a);
 if(e.mio) d=Math.max(d,e.monto+10000);
 return d;
}
const porTxt={salida:"el precio de salida: fue la única oferta",segunda:"$50.000 más que la segunda oferta",minimo:"el mínimo del vendedor",tope:"tu máximo: la segunda oferta estaba a menos de $50.000"};
const nivel=()=>A.aprobada()?2:S.sesion?1:0;
const restaMs=()=>Math.max(0,ST.cierre-Date.now());
const hms=ms=>{const s=Math.floor(ms/1000);return [s/3600|0,(s%3600)/60|0,s%60].map(x=>String(x).padStart(2,"0")).join(":")};
const relojTxt=()=>ST.cerrada?"Cerrada":hms(restaMs());
const distTxt=a=>banda(dist(ZBY[a.z],ZBY[S.base||DEMO_BASE]))+" de tu agencia";
const hora=ts=>new Date(ts).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit",hour12:false});
const misOfertas=()=>AUTOS.filter(a=>ST.of[a.id]);
const fotos=a=>a.fotos;
const vivo=(txt="En vivo")=>ST.cerrada?`<span class="envivo off">Cerrada</span>`:`<span class="envivo"><i></i>${txt}</span>`;
const pct=(x,b)=>Math.round(x/b*100);
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
 if(ST.cerrada&&e.mio) return ({ganada:`<span class="pill ok">Ganaste</span>`,vendedor:`<span class="pill warn">Esperando al vendedor</span>`,perdida:`<span class="pill bad">No ganaste</span>`})[e.fin];
 if(e.mio) return e.gano?`<span class="pill ok">Vas ganando</span>`:`<span class="pill bad">Te superaron</span>`;
 return "";
}
function lote(a){
 const e=est(a), fav=ST.fav.has(a.id);
 return `<article class="lote card">
  <a class="lfoto" href="#agencias/auto/${a.id}"><img src="${a.fotos[0].src}" alt="${esc(a.t)}" loading="lazy"><span class="lpills">${pills(a,e)}</span><span class="score sm" title="Yacar Score"><b>${a.score}</b>/10</span></a>
  <button class="favbtn" data-act="fav" data-id="${a.id}" aria-pressed="${fav}" aria-label="${fav?"Dejar de seguir":"Seguir este auto"}">${IC.estrella(fav)}</button>
  <a class="linfo" href="#agencias/auto/${a.id}">
   <h3>${esc(a.t)} · ${a.a}</h3>
   <p class="num">${a.km.toLocaleString("es-AR")} km · ${esc(a.zl)}</p>
   <p class="muted">${distTxt(a)}</p>
  </a>
  <div class="lpie"><div><span>Precio particular</span><b class="num">~${fmtM(a.obj)}</b></div><div><span>${e.hay?"Precio actual":"Sale desde"}</span><b class="num">${fmtP(e.precio)}</b></div><div><span>Cierra en</span><b class="num" data-clock>${relojTxt()}</b></div></div>
 </article>`;
}
// Nivel 0 y 1: tarjeta sin foto real, sin barrio y sin ficha.
function loteBloq(a){
 const n=nivel();
 return `<article class="lote card bloqlote">
  <${n?`a href="#agencias/auto/${a.id}"`:"div"} class="lfoto dib" aria-hidden="true">${dibujo(a,150)}<span class="dibtag">Imagen ilustrativa</span></${n?"a":"div"}>
  <div class="linfo">
   <h3>${esc(a.t)} · ${a.a}</h3>
   ${n?`<p class="num">${esc(a.v.split(" · ")[0])} · ${a.km.toLocaleString("es-AR")} km</p><p class="muted">${distTxt(a)}</p>`:`<p class="muted">Fotos, estado, papeles y mercado: solo para agencias aprobadas.</p>`}
  </div>
  <div class="lpie"><div><span>Cierra en</span><b class="num" data-clock>${relojTxt()}</b></div></div>
 </article>`;
}
function filtrar(){
 let l=AUTOS.slice();
 if(ST.filtro==="favs") l=l.filter(a=>ST.fav.has(a.id));
 if(ST.filtro==="mias") l=l.filter(a=>ST.of[a.id]);
 if(ST.filtro==="sin") l=l.filter(a=>!ST.of[a.id]);
 const b=ZBY[S.base||DEMO_BASE];
 const ord={score:(x,y)=>y.score-x.score||x.km-y.km,cerca:(x,y)=>dist(ZBY[x.z],b)-dist(ZBY[y.z],b),km:(x,y)=>x.km-y.km,anio:(x,y)=>y.a-x.a}[ST.orden];
 return l.sort(ord);
}
const proto=extra=>`<div class="proto protorow sim"><span class="ptag">Solo prototipo</span>
 ${ST.cerrada?`<button class="linkbtn" data-act="reabrir">Volver a abrir la subasta</button>`:`${extra||""}<button class="linkbtn" data-act="ultimahora">Pasar a la última hora</button><button class="linkbtn" data-act="cerrar">Cerrar la subasta ahora</button>`}
 <span class="muted">Los máximos de las otras agencias están simulados y no se ven: solo el precio actual.${ST.simulada?" Fuera del horario de 10 a 19 h el prototipo simula que la subasta está abierta.":""}</span></div>`;
const GUIA=`<b>Cómo funciona.</b> Cargás <b>tu máximo</b>, que nadie ve, y todos ven el <b>precio actual</b>. Si ganás, <b>no pagás tu máximo</b>: pagás $50.000 más que la segunda oferta. Podés subirlo hasta las 19 h, pero no bajarlo. Si llega al mínimo del vendedor, se vende sin preguntarle; si no, él decide en 24 h. Si ganás, <b>vas a ver el auto dentro de las 48 h hábiles</b>.`;

/* ---------- Subasta de hoy ---------- */
function heroSub(cards){
 return `<section class="sbhero"><div class="wrap">
  <div class="sbtop">
   <div><h1>Subasta de hoy ${vivo()}</h1><p>${AUTOS.length} autos de particulares, revisados por Yacar. ${ST.cerrada?"La subasta de hoy ya cerró.":"Ofertás hasta las 19 h."}</p></div>
   <div class="sbclock"><span>${ST.cerrada?"Estado":"Cierra en"}</span><b class="num" data-clock>${relojTxt()}</b><small>${ST.simulada?"Hora simulada (prototipo)":"Hoy a las 19:00"}</small></div>
  </div>
  ${cards?`<div class="sbcards">${cards}</div>`:""}
 </div></section>`;
}
function htmlListaBloq(){
 const n=nivel();
 const aviso=n
  ?`<div class="vitri card"><span class="ic">${IC.candado}</span><div><b>Tu agencia está en revisión.</b> Cuando la aprobemos vas a ver las fotos, el estado, los papeles y el mercado de cada auto, y vas a poder ofertar.</div><div class="vbtns"><a class="btn sec" href="#agencias/estado">Mi agencia</a></div></div>`
  :`<div class="vitri card"><span class="ic">${IC.candado}</span><div><b>La subasta la ven solo las agencias aprobadas.</b> Sumá tu agencia: la revisamos a mano y, cuando te aprobemos, ves cada auto completo y ofertás.</div><div class="vbtns"><a class="btn pri" href="#agencias/alta">Sumar mi agencia</a><a class="btn sec" href="#agencias/ingresar">Ingresar</a></div></div>`;
 return heroSub("")+`<div class="wrap sbbody">${aviso}
  <div class="sbbar"><h2 class="sbh">${ST.cerrada?"Autos de la subasta de hoy":`Hoy hay ${AUTOS.length} autos en subasta`}</h2></div>
  <div class="lotes bloq4">${AUTOS.map(loteBloq).join("")}</div>
  <p class="muted chico" style="margin-top:14px">Imágenes ilustrativas: no son los autos de la subasta.</p>
 </div>`;
}
function htmlLista(){
 if(nivel()<2) return htmlListaBloq();
 const d=AUTOS[0], de=est(d), lista=filtrar(), mias=misOfertas();
 const chip=(v,l)=>`<button type="button" class="chip sm" data-act="filtro" data-v="${v}" aria-pressed="${ST.filtro===v}">${l}</button>`;
 const cards=`<a class="sbcard" href="#agencias/subasta" data-act="alista"><span class="ic">${IC.vivo}</span><b>Subastas activas</b><span>${AUTOS.length} autos · cierran 19 h</span></a>
   <a class="sbcard" href="#agencias/ofertas"><span class="ic">${IC.mano}</span><b>Mis ofertas</b><span>${mias.length?mias.length+(mias.length===1?" oferta":" ofertas")+(ST.cerrada?" en la subasta de hoy":" enviadas hoy"):"Todavía no ofertaste hoy"}</span></a>
   <a class="sbcard" href="#agencias/ofertas/ganadas"><span class="ic">${IC.bandera}</span><b>Finalizadas</b><span>Ganadas y visitas</span></a>`;
 return heroSub(cards)+`
 <div class="wrap sbbody">
  <div class="destwrap">
   <h2 class="sbh">Destacada</h2>
   <article class="destacada card">
    <a class="dfoto" href="#agencias/auto/${d.id}"><img src="${d.fotos[0].src}" alt="${esc(d.t)}"><span class="lpills">${pills(d,de)}</span></a>
    <div class="dinfo">
     <div class="drow"><h3>${esc(d.t)} · ${d.a}</h3><span class="score"><b>${d.score}</b>/10<small>Yacar Score</small></span></div>
     <p class="muted">${esc(d.v)}</p>
     <p>${esc(d.desc)}</p>
     <ul class="dmeta num"><li><b>${d.km.toLocaleString("es-AR")}</b> km</li><li><b>${esc(d.zl)}</b></li><li>${distTxt(d)}</li></ul>
     <div class="dpie"><div><span>Precio particular</span><b class="num">~${fmtM(d.obj)}</b></div><div><span>${de.hay?"Precio actual":"Sale desde"}</span><b class="num">${fmtP(de.precio)}</b></div><div><span>Cierra en</span><b class="num" data-clock>${relojTxt()}</b></div><a class="btn pri" href="#agencias/auto/${d.id}">${de.mio?"Ver mi oferta":"Ver y ofertar"}</a></div>
    </div>
   </article>
  </div>
  <div class="sbgrid">
   <div>
    <div class="sbbar" id="lista"><h2 class="sbh">Autos en subasta</h2>
     <div class="chips">${chip("todos","Todos")}${chip("favs","Siguiendo")}${chip("mias","Ya oferté")}${chip("sin","Sin ofertar")}</div>
     <label class="orden">Ordenar <select data-act="orden">${[["score","Mejor Yacar Score"],["cerca","Más cerca"],["km","Menos km"],["anio","Más nuevos"]].map(([v,l])=>`<option value="${v}" ${ST.orden===v?"selected":""}>${l}</option>`).join("")}</select></label>
    </div>
    <div class="lotes">${lista.length?lista.map(lote).join(""):`<p class="vacio">No hay autos con ese filtro.</p>`}</div>
   </div>
   <aside class="sbside">
    ${ST.guia?`<div class="guia"><div>${GUIA}</div><button class="x" data-act="cerrarguia" aria-label="Cerrar">×</button></div>`:""}
    <div class="card feed"><div class="fhead"><h3>Tus ofertas de hoy</h3>${vivo()}</div>
     ${mias.length?`<ul>${mias.map(a=>{const e=est(a);return `<li class="mia"><span><a href="#agencias/auto/${a.id}"><b>${esc(a.t)} ${a.a}</b></a> · tu máximo <b class="num">${fmt(e.monto)}</b></span><small>${ST.cerrada?({ganada:"Ganaste a "+fmtP(e.precio),vendedor:"Esperando al vendedor",perdida:"No ganaste"})[e.fin]:(e.gano?"Vas ganando":"Te superaron")+" · precio actual "+fmtP(e.precio)}</small></li>`}).join("")}</ul>`:`<p class="muted fnota">Todavía no ofertaste. Cargás tu máximo y el precio sube solo hasta ahí si otra agencia oferta.</p>`}
     <p class="muted fnota">No ves los máximos de las demás agencias ni cuántas ofertaron. El precio actual lo ven todas.</p></div>
   </aside>
  </div>
  ${proto("")}
 </div>`;
}
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
// Publicada en claude.ai, la descarga pasa por el permiso "downloads"; abierta desde el Drive, por un link normal.
async function bajarFicha(){
 const nombre="Yacar_ficha_Y-0001_Peugeot-208.pdf";
 const blob=await fetch(FICHA_PDF).then(r=>r.blob()).catch(()=>null);
 const dl=window.claude?.use?await window.claude.use("downloads").catch(()=>null):null;
 if(dl&&blob){ try{ await dl.save({filename:nombre,data:blob}); }catch(e){ if(e?.code!=="declined") aviso("No se pudo descargar la ficha","Probá de nuevo en un rato."); } return; }
 const l=document.createElement("a"); l.download=nombre; l.href=blob?URL.createObjectURL(blob):FICHA_PDF; l.click();
 if(blob) setTimeout(()=>URL.revokeObjectURL(l.href),4000);
}

// Mercado (18/10 noche, Gonzalo; 20/10, Maxi): el sondeo con el que el auto entra a la subasta. Sin la franja del motor ni el
// mínimo del vendedor, para no anclar las ofertas en el medio de la franja.
function escala(a){
 return `<div class="facts num"><div><span>Precio particular (mediana de avisos)</span><b>${fmtM(a.obj)}</b></div><div><span>Precio de salida</span><b>${fmtP(salida(a))}</b></div><div><span>Sondeo</span><b>${a.nav} avisos · ${a.sondeo}</b></div></div>
 <p class="muted chico">Precio particular: lo que piden los avisos de Mercado Libre, DeRuedas y Autocosmos del mismo modelo, versión y año, llevado a los km de este auto, el día que entró a la subasta. Precio de salida: desde ahí se puede ofertar. No es el mínimo del vendedor.</p>`;
}
const PASA=`<details class="asec reglas"><summary><h2>Cómo funciona la subasta</h2></summary>
 <div class="rgrid"><div><b>Tu máximo no lo ve nadie</b><p>Todos ven el precio actual, que sube solo hasta tu máximo si otra agencia oferta. Podés subir tu máximo hasta el cierre, pero no bajarlo ni cancelarlo.</p></div>
 <div><b>No pagás tu máximo</b><p>Si ganás, pagás $50.000 más que la segunda oferta, o el mínimo del vendedor si es más. Con una sola oferta, el precio de salida.</p></div>
 <div><b>El mínimo del vendedor no se ve</b><p>Cuando un máximo lo alcanza, aparece el cartel "Llegó al mínimo del vendedor" y se vende sin preguntarle. Si no, el vendedor tiene 24 h para aceptar.</p></div>
 <div><b>Fee bonificado, sin tarjeta</b><p>En el lanzamiento no cobramos fee ni pedimos tarjeta. Si ganás, te pasamos el contacto del vendedor y la patente.</p></div>
 <div><b>Visita en 48 h hábiles</b><p>Si el auto no coincide con la ficha, te bajás sin falta: mandás fotos de la diferencia y lo revisamos.</p></div>
 <div><b>Faltas</b><p>Ganar y no ir a verlo, o no comprarlo si coincide con la ficha, es una falta. Con 2 faltas, la cuenta queda suspendida 30 días.</p></div>
 <div><b>Ofertas independientes</b><p>Ponerse de acuerdo con otras agencias para ofertar o no ofertar está prohibido por ley (27.442) y es motivo de baja.</p></div></div></details>`;
// Nivel 0 y 1: página del auto sin fotos, estado, mercado ni papeles.
function htmlAutoBloq(a){
 const n=nivel();
 return `<div class="wrap sbauto">
  <a class="volver" href="#agencias/subasta">← Subasta de hoy</a>
  <div class="card bloqauto">
   <div class="dib grande" aria-hidden="true">${dibujo(a,260)}<span class="dibtag">Imagen ilustrativa</span></div>
   <div><h1>${esc(a.t)} · ${a.a}</h1>
    ${n?`<p class="muted">${esc(a.v.split(" · ")[0])} · ${a.km.toLocaleString("es-AR")} km · ${distTxt(a)}</p>`:""}
    <div class="vitri" style="margin-top:16px"><span class="ic">${IC.candado}</span><div>${n?"<b>Tu agencia está en revisión.</b> Cuando la aprobemos vas a ver las fotos, el estado, los papeles y el mercado, y vas a poder ofertar.":"<b>Solo para agencias aprobadas.</b> Sumá tu agencia para ver las fotos, el estado, los papeles y el mercado de cada auto."}</div>
    <div class="vbtns">${n?`<a class="btn sec" href="#agencias/estado">Mi agencia</a>`:`<a class="btn pri" href="#agencias/alta">Sumar mi agencia</a><a class="btn sec" href="#agencias/ingresar">Ingresar</a>`}</div></div>
   </div>
  </div>
 </div>`;
}
function htmlAuto(a){
 if(nivel()<2) return htmlAutoBloq(a);
 const fav=ST.fav.has(a.id);
 const kpi=a.kpi.map(([l,v,s,ok])=>`<div class="kpi"><span>${l}</span><b class="${ok?"okc":""}">${v}</b>${s?`<small>${s}</small>`:""}</div>`).join("")
  +`<div class="kpi zona"><span>Zona</span><b>${esc(a.zl)}</b><small>${distTxt(a)}</small></div>`;
 const estado=a.real?`
  <section class="asec"><h2>Estado del auto</h2><p class="muted">Lo vimos en las fotos con nuestra revisión (IA + aprobación del equipo) el 15/10. No es una inspección presencial.</p>
   <div class="estado">${DIAG}<div class="danos">${DANOS.map(([n,c,t,d,tag,fi])=>`<div class="dano"><span class="n ${c}">${n}</span><div><h4>${t}</h4><p>${d}</p><span class="pill ${c}">${tag}</span></div><button class="dfoto" data-lb="${fi}" aria-label="Ver la foto del daño ${n}"><img src="${a.fotos[fi].src}" alt=""></button></div>`).join("")}</div></div>
   <blockquote class="cita">"El auto está realmente hermoso, muy cuidado y listo para subirse y disfrutar sin ponerle un peso encima. Le hice un encerado hace poco."<cite>Comentario del vendedor</cite></blockquote>
   <div class="cols2x"><div class="box"><h3>Declarado por el dueño</h3><ul class="lista v"><li>Services oficiales en Peugeot SVA CABA, en tiempo y forma.</li><li>Siempre en cochera cubierta.</li><li>Papeles al día, titular directo, radicado en CABA.</li><li>2 llaves. Se entrega transferido.</li></ul></div>
   <div class="box"><h3>A confirmar en la visita</h3><ul class="lista"><li>Profundidad del raspón (pulido o pintura).</li><li>Banda de las cubiertas y llanta delantera derecha.</li><li>Baúl y testigos con el motor en marcha.</li><li>Libreta de services.</li></ul></div></div>
  </section>`
 :`<section class="asec"><h2>Estado del auto</h2><p class="muted">${esc(a.desc)}</p><p class="proto" style="margin-top:10px"><span class="ptag">Ejemplo</span> Revisión de ejemplo. El Peugeot 208 muestra la revisión completa.</p></section>`;
 return `<div class="wrap sbauto">
  <a class="volver" href="#agencias/subasta">← Subasta de hoy</a>
  <div class="autogrid">
   <div class="automain">
    ${ST.cerrada&&est(a).fin==="ganada"?transfHTML(a):""}
    ${htmlGaleria(a)}
    <div class="atitle"><div><h1>${esc(a.t)} · ${a.a}</h1><p class="muted">${esc(a.v)}</p>
     <p class="ameta num"><span>${a.id}</span></p></div>
     <div class="atr"><span class="score big"><b>${a.score}</b>/10<small>Yacar Score · según km y estado</small></span>
     <button class="btn sec favb" data-act="fav" data-id="${a.id}" aria-pressed="${fav}">${IC.estrella(fav)} ${fav?"Siguiendo":"Seguir"}</button></div></div>
    <div class="kpis">${kpi}</div>
    <div class="equip"><b>Equipamiento</b>${a.equip.map(x=>`<span>${esc(x)}</span>`).join("")}</div>
    ${estado}
    <section class="asec"><h2>Mercado</h2>${escala(a)}</section>
    <section class="asec"><h2>Papeles</h2><p class="muted">El dueño los declara al día. Antes de la subasta revisamos el informe de dominio; multas, deuda y VTV te llegan con el contacto.</p>
     <div class="papeles">${["Dominio sin prenda ni embargo","Titular coincide con quien vende","Cédula y título","Radicación"].map(x=>`<div><span>${x}</span><span class="pill ${a.real?"na":"ok"}">${a.real?"A verificar":"En regla"}</span></div>`).join("")}</div></section>
    ${a.real?`<section class="asec"><h2>Fotos</h2><div class="cover"><span class="ok">Esquinas y laterales</span><span class="ok">Asientos delanteros y traseros</span><span class="ok">Tablero encendido</span><span class="ok">Motor</span><span class="na">Baúl</span><span class="na">Banda de cubiertas</span></div></section>`:""}
    ${PASA}
   </div>
   <aside class="bidwrap${ST.panel?" abierto":""}" id="bidwrap"><div class="bidpanel card" id="bidpanel">${htmlPanel(a)}</div></aside>
  </div>
  ${proto(est(a).gano?`<button class="linkbtn" data-act="rival" data-id="${a.id}">Simular que otra agencia sube</button>`:"")}
 </div>
 <div class="bidbar" id="bidbar">${htmlBarra(a)}</div>
 <div class="bidfondo" data-act="cerrarpanel"></div>`;
}
function htmlBarra(a){
 const e=est(a);
 const estado=ST.cerrada?(e.mio?({ganada:"Ganaste",vendedor:"Esperando al vendedor",perdida:"No ganaste"})[e.fin]:"Subasta cerrada"):e.mio?`${e.gano?"Vas ganando":"Te superaron"} · ${fmtP(e.precio)}`:e.hay?`Precio actual ${fmtP(e.precio)}`:`Sale desde ${fmtP(e.precio)}`;
 return `<div><span class="num" data-clock>${relojTxt()}</span><b>${estado}</b></div>${ST.cerrada?`<a class="btn pri" href="#agencias/ofertas">Mis ofertas</a>`:`<button class="btn pri" data-act="abrirpanel">${!e.mio?"Ofertar":e.gano?"Mi máximo":"Subir mi máximo"}</button>`}`;
}
// Margen aproximado con el precio al que la agencia cree que lo vende (arranca en lo que piden los avisos).
function margenTxt(a,oferta){
 const venta=ST.venta[a.id]??a.obj;
 if(!oferta||!venta) return "—";
 const mg=venta-oferta;
 return `${mg<0?"− ":""}${fmtM(Math.abs(mg))} · ${pct(mg,oferta)}%`;
}
// Dónde cae el máximo frente a la franja del motor, en palabras y sin decir dónde empieza ni dónde termina (20/10, Maxi).
function avisoMonto(a,n){
 if(!n) return "";
 if(n<desde(a)) return `<p class="note bad" id="bpAviso">Se puede ofertar desde ${fmt(desde(a))}.</p>`;
 if(n<a.piso) return `<p class="note warn" id="bpAviso"><b>Es difícil que ganes con esta oferta.</b> Está por debajo de lo que esperamos que se venda este auto.</p>`;
 if(n<=a.techo) return `<p class="note info" id="bpAviso">Tenés chances, pero otra agencia puede poner un máximo más alto.</p>`;
 return `<p class="note ok" id="bpAviso"><b>Es probable que ganes.</b> Y si ganás, no pagás tu máximo: pagás $50.000 más que la segunda oferta.</p>`;
}
const V48=`<div class="bp48"><span class="ic">${IC.visita}</span><div><b>Si ganás, vas a verlo en 48 h hábiles</b><span>Te pasamos el contacto del vendedor y coordinás la visita.</span></div></div>`;
function htmlPanel(a){
 const e=est(a);
 const head=`<div class="bphead">${vivo()}<button class="x solo-cel" data-act="cerrarpanel" aria-label="Cerrar">×</button></div>
  <div class="bpclock"><span>${ST.cerrada?"Subasta":"Cierra en"}</span><b class="num" data-clock>${relojTxt()}</b></div>`;
 if(ST.cerrada){
  const r=!e.mio?`<div class="note info">La subasta de hoy cerró. Mañana a las 9 h te llega la nueva.</div>`
   :e.fin==="ganada"?`<div class="note ok"><b>¡Ganaste!</b> Comprás a <b class="num">${fmt(e.precio)}</b>: ${porTxt[e.por]}. Tu máximo era ${fmt(e.monto)}.</div><button class="btn pri block" data-act="contacto" data-id="${a.id}">Ver el contacto del vendedor</button><a class="linkbtn" href="#agencias/auto/${a.id}" data-act="atransf">Ficha para la transferencia</a>`
   :e.fin==="vendedor"?`<div class="note warn"><b>Tu máximo fue el más alto, pero no llegó al mínimo del vendedor.</b> Tiene 24 h para aceptar ${fmt(e.precio)}. Te avisamos por WhatsApp.</div>`
   :`<div class="note bad"><b>No ganaste.</b> Otra agencia puso un máximo más alto que tus ${fmt(e.monto)}.</div>`;
  return head+r;
 }
 const precio=`<div class="bpmin"><span>${e.hay?"Precio actual":"Todavía no hay ofertas"}</span><b class="num">${fmt(e.precio)}</b><small>${e.hay?"Lo ven todas las agencias.":"Se puede ofertar desde acá: es el precio de salida."}</small>${e.minOk?`<p class="minok">${IC.visita} Llegó al mínimo del vendedor: si gana, se vende sin preguntarle.</p>`:""}</div>`;
 const mia=e.mio?`<div class="bpmia ${e.gano?"gana":"pierde"}"><span>Tu máximo</span><b class="num">${fmt(e.monto)}</b><small>${e.gano?`Vas ganando. Si cerrara ahora, pagarías ${fmt(e.precio)}.`:"Te superaron: otra agencia puso un máximo más alto."}</small></div>`:"";
 const fee=`<div><dt>Fee de Yacar</dt><dd><s class="tachado">${fmt(feeLista(e.precio))}</s> $ 0 · bonificado</dd></div>`;
 if(e.mio&&e.gano&&!ST.subir[a.id]) return head+precio+mia+`<button class="btn sec block" data-act="subir" data-id="${a.id}">Subir mi máximo</button>
  <p class="muted chico">Nadie ve tu máximo. Podés subirlo hasta las 19 h, pero no bajarlo ni cancelarlo.</p>
  <dl class="bcalc num"><div><dt>Margen aproximado si lo vendés a ~${fmtM(ST.venta[a.id]??a.obj)}</dt><dd>${margenTxt(a,e.precio)}</dd></div>${fee}</dl>${V48}`;
 const n=ST.borr[a.id]||0, venta=ST.venta[a.id]??a.obj;
 return head+precio+mia+`<div class="bform">
   <label for="bpMonto">${e.mio?"Tu nuevo máximo":"Tu máximo"}</label>
   <div class="monto"><span>$</span><input id="bpMonto" inputmode="numeric" autocomplete="off" value="${n?n.toLocaleString("es-AR"):""}" placeholder="0" aria-describedby="bpAyuda"></div>
   <p class="letras" id="bpLetras">${n?letras(n):""}</p>
   <p class="ayuda" id="bpAyuda">Desde ${fmt(desde(a))}. Nadie ve tu máximo. Si ganás, no pagás tu máximo: pagás $50.000 más que la segunda oferta.</p>
   <div id="bpAvisoW">${avisoMonto(a,n)}</div>
   <label for="bpVenta" style="margin-top:6px">¿A cuánto lo publicarías?</label>
   <div class="monto chico"><span>$</span><input id="bpVenta" inputmode="numeric" autocomplete="off" value="${venta.toLocaleString("es-AR")}"></div>
   <dl class="bcalc num"><div><dt>Margen aproximado si pagás tu máximo</dt><dd id="bpMargen">${margenTxt(a,n)}</dd></div>${fee}</dl>
   <p class="muted chico">El margen es antes de la transferencia y la preparación. El precio de publicación arranca en el precio particular: cambialo por el tuyo. En el lanzamiento no pedimos tarjeta.</p>
   ${V48}
   <label class="compromiso"><input type="checkbox" id="bpComp" ${ST.comp[a.id]?"checked":""}><span><b>Es un compromiso de compra</b>: puedo subir mi máximo pero no bajarlo ni cancelarlo. Si gano, voy a verlo dentro de las 48 h hábiles y <b>lo compro al precio final</b> si coincide con la ficha. Si no, es una falta.</span></label>
   ${ST.err?`<p class="err" role="alert">${ST.err}</p>`:""}
   <button class="btn pri block" data-act="ofertar" data-id="${a.id}">${e.mio?"Subir mi máximo":"Confirmar mi máximo"}</button>
   <p class="chico muted">Nadie ve tu máximo ni cuántas agencias ofertaron.</p>
  </div>`;
}

// Ficha para la transferencia (D-44, 16/10; pasada a "Ganaste" el 19/10): le llega a la agencia que ganó, junto con el contacto.
// Sin DNI, domicilio, estado civil ni carácter del bien del vendedor (PRIVACIDAD_RESUMEN_AGENCIA.md, D-38). Datos de ejemplo.
function transfHTML(a){
 const hoy=new Date(), hab=typeof sumarHabiles==="function"?sumarHabiles:(d,n)=>new Date(d.getTime()+n*1.4*864e5);
 const f=d=>d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"}), fa=d=>d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric"});
 const dl=(filas,cl)=>`<dl${cl?` class="${cl}"`:""}>${filas.map(([t,v,x])=>`<dt>${t}</dt><dd>${v}${x?`<small>${x}</small>`:""}</dd>`).join("")}</dl>`;
 const ver=a.v.split(" · ")[0];
 return `<section class="asec transfp" id="transfP"><span class="kicker">Ganaste este auto</span><h2>Ficha para la transferencia</h2>
  <p class="muted">Quién firma, dónde y qué papeles están listos para el día de la firma.</p>
  <div class="cols2" style="margin-top:14px"><div class="box"><h4>Vendedor y auto</h4>${dl([["Vendedor","Vendedor de prueba · WhatsApp 11 0000-0000"],["Identidad","Validada con el RENAPER (DNI + selfie)"],["Auto",`${esc(a.t)} ${esc(ver)} ${a.a} · ${a.km.toLocaleString("es-AR")} km`],["Patente","AA 000 AA"],["Chasis y motor","Te llegan en el PDF del informe","Para verificar en la visita"]],"trdl")}</div>
  <div class="box"><h4>Quién firma y dónde</h4>${dl([["Dónde","Registro Seccional de la radicación del auto (CABA)"],["Quién firma","Solo el vendedor: es el único titular."],["Formulario 08","Los datos del auto van precargados; los del vendedor salen de su DNI en la firma."]],"trdl")}</div></div>
  <div class="box informe"><h4>Papeles para el día de la firma</h4>${dl([["Certificado de dominio",`Pedido por el vendedor el ${f(hoy)}. Congela el auto hasta el ${fa(hab(hoy,15))}.`,"Lo pide el titular · Registro del Automotor (DNRPA)"],["Título","Digital: el vendedor lo trae impreso.","Declarado por el vendedor"],["Cédula verde","Foto revisada: coincide con el informe.","Revisado por Yacar"],["Prenda","No tiene.","Registro del Automotor (DNRPA)"],["Verificación policial","La hace el vendedor antes de la firma.","Se revisa el formulario 12"],["Deuda de patente y multas","Consultadas al cerrar la venta, con constancias.","Organismos oficiales"],["VTV y GNC","Se informan con las constancias del día.","VTV y ENARGAS"]])}
   <p class="fuente">El DNI y el domicilio del vendedor los ves en la firma.</p></div>
  <p class="proto mini" style="margin-top:12px"><span class="ptag">Prueba</span> Datos de ejemplo.</p></section>`;
}

/* ---------- Mis ofertas ---------- */
const HIST=[
 {t:"Volkswagen Gol Trend 1.6",a:2019,km:71000,zl:"Caballito",monto:9350000,pago:9150000,fin:"ganada",cuando:"Ayer",visita:"Visita: mañana a las 11 h"},
 {t:"Chevrolet Onix 1.2 LT",a:2021,km:54000,zl:"Flores",monto:12800000,fin:"perdida",cuando:"Ayer"}
];
function htmlOfertas(tab){
 const mias=misOfertas().map(a=>({a,e:est(a)}));
 const grupos={
  activas:mias.filter(x=>!ST.cerrada),
  vendedor:mias.filter(x=>x.e.fin==="vendedor"),
  ganadas:mias.filter(x=>x.e.fin==="ganada"),
  perdidas:mias.filter(x=>x.e.fin==="perdida")
 };
 const hist=HIST.filter(h=>(tab==="ganadas"&&h.fin==="ganada")||(tab==="perdidas"&&h.fin==="perdida"));
 const tabs=[["activas","Ofertando hoy"],["vendedor","Esperando al vendedor"],["ganadas","Ganadas"],["perdidas","No ganadas"]];
 const fila=({a,e})=>{
  const acc=ST.cerrada?(e.fin==="ganada"?`<button class="btn pri" data-act="contacto" data-id="${a.id}">Ver contacto</button><a class="linkbtn" href="#agencias/auto/${a.id}" data-act="atransf">Ficha para la transferencia</a>`
   :e.fin==="vendedor"?`<span class="proto mini"><span class="ptag">Prototipo</span> <button class="linkbtn" data-act="acepta" data-id="${a.id}">El vendedor acepta</button></span>`:"")
   :`<a class="btn ${e.gano?"sec":"pri"}" href="#agencias/auto/${a.id}">${e.gano?"Ver":"Subir mi máximo"}</a>`;
  return `<li class="fila card"><a href="#agencias/auto/${a.id}" class="fth"><img src="${a.fotos[0].src}" alt=""></a>
   <div class="finfo"><b>${esc(a.t)} · ${a.a}</b><span class="num">${a.km.toLocaleString("es-AR")} km · ${esc(a.zl)}</span><span class="fpills">${pills(a,e)}</span></div>
   <dl class="fnum num"><div><dt>Tu máximo</dt><dd>${fmt(e.monto)}</dd></div><div><dt>${ST.cerrada?"Resultado":"Precio actual"}</dt><dd>${ST.cerrada?({ganada:"Comprás a "+fmtP(e.precio),vendedor:"Decide el vendedor",perdida:"Otra agencia"})[e.fin]:(e.gano?"Vas ganando · ":"Te superaron · ")+fmtP(e.precio)}</dd></div><div><dt>${ST.cerrada?"":"Cierra en"}</dt><dd ${ST.cerrada?"":"data-clock"}>${ST.cerrada?"":relojTxt()}</dd></div></dl>
   <div class="facc">${acc}</div></li>`;
 };
 const filaH=h=>`<li class="fila card hist"><div class="fth ic">${IC.bandera}</div><div class="finfo"><b>${h.t} · ${h.a}</b><span class="num">${h.km.toLocaleString("es-AR")} km · ${h.zl} · ${h.cuando}</span><span class="fpills">${h.fin==="ganada"?`<span class="pill ok">Ganaste</span>`:`<span class="pill bad">No ganaste</span>`}</span></div>
  <dl class="fnum num"><div><dt>Tu máximo</dt><dd>${fmt(h.monto)}</dd></div><div><dt>Resultado</dt><dd>${h.fin==="ganada"?"Compraste a "+fmtP(h.pago):"Otra agencia"}</dd></div><div><dt>${h.fin==="ganada"?"Próximo paso":""}</dt><dd>${h.visita||""}</dd></div></dl><div class="facc"></div></li>`;
 const l=grupos[tab]||[];
 return `<section class="sbhero chico"><div class="wrap"><div class="sbtop"><div><h1>Mis ofertas</h1><p>${ST.cerrada?"La subasta de hoy cerró. Acá ves cómo te fue.":"Podés subir tu máximo hasta las 19 h."}</p></div>
  <div class="sbclock"><span>${ST.cerrada?"Estado":"Cierra en"}</span><b class="num" data-clock>${relojTxt()}</b><small>${ST.simulada?"Hora simulada (prototipo)":"Hoy a las 19:00"}</small></div></div></div></section>
 <div class="wrap sbbody">
  <nav class="tabs" aria-label="Mis ofertas">${tabs.map(([k,n])=>`<a href="#agencias/ofertas/${k}" aria-current="${k===tab}">${n} <span class="num">${(grupos[k]||[]).length+HIST.filter(h=>(k==="ganadas"&&h.fin==="ganada")||(k==="perdidas"&&h.fin==="perdida")).length}</span></a>`).join("")}</nav>
  <ul class="filas">${l.map(fila).join("")}${hist.map(filaH).join("")}</ul>
  ${!l.length&&!hist.length?`<div class="vacio card"><p>${tab==="activas"?(ST.cerrada?"La subasta de hoy ya cerró.":"Todavía no ofertaste hoy."):"No hay nada acá por ahora."}</p>${tab==="activas"&&!ST.cerrada?`<a class="btn pri" href="#agencias/subasta">Ver la subasta de hoy</a>`:""}</div>`:""}
  ${proto()}
 </div>`;
}

/* ---------- modales: confirmar la oferta y contacto ---------- */
function modal(h){const m=byId("modal");m.innerHTML=`<div class="mfondo" data-mact="cerrar"></div><div class="mcaja card">${h}</div>`;m.hidden=false;m.querySelector("button.pri, button")?.focus()}
function cerrarModal(){const m=byId("modal");m.hidden=true;m.innerHTML=""}
// 20/10: alerta si el máximo queda debajo de lo esperado (con botón para subir; no bloquea) y "¿Seguro?" si pasa 30% el final de la franja.
function confirmar(a,monto,visto){   // visto: ya pasó por la alerta y eligió ofertar igual
 const e=est(a), baja=!visto&&monto<a.piso, alta=!visto&&monto>a.techo*1.3, ok=e.mio?"Subir mi máximo":"Confirmar mi máximo";
 const alerta=baja?`<div class="note warn malerta"><b>Es difícil que ganes con esta oferta.</b> Tu máximo (${fmtP(monto)}) está ${100-pct(monto,a.piso)}% debajo de lo que esperamos que se venda este auto. Si ganás, no pagás tu máximo: pagás $50.000 más que la segunda oferta.</div>`
  :alta?`<div class="note warn malerta"><b>¿Seguro? Pusiste ${fmtP(monto)}.</b> Es mucho más de lo que esperamos que se venda este auto. Revisá que no sobre un cero.</div>`:"";
 const btns=baja?`<button class="btn sec" data-mact="igual" data-id="${a.id}" data-v="${monto}">Ofertar igual</button><button class="btn pri" data-mact="subira" data-id="${a.id}" data-v="${r10(a.piso)}">Subir a ${fmtP(a.piso)}</button>`
  :alta?`<button class="btn sec" data-mact="cerrar">Corregir</button><button class="btn pri" data-mact="igual" data-id="${a.id}" data-v="${monto}">Sí, ${fmtP(monto)}</button>`
  :`<button class="btn sec" data-mact="cerrar">Volver</button><button class="btn pri" data-mact="ok" data-id="${a.id}" data-v="${monto}">${ok}</button>`;
 modal(`<button class="x" data-mact="cerrar" aria-label="Cerrar">×</button><span class="kicker">${e.mio?"Subí tu máximo":"Confirmá tu máximo"}</span>
  <h2>${esc(a.t)} · ${a.a}</h2>${alerta}
  <div class="mmonto num">${fmt(monto)}</div><p class="letras">${letras(monto)}</p>
  ${baja||alta?"":`<ul class="lista v"><li><b>Nadie ve tu máximo.</b> Todos ven el precio actual, que sube solo hasta tu máximo si otra agencia oferta.</li><li>Si ganás, <b>no pagás tu máximo</b>: pagás $50.000 más que la segunda oferta, o el mínimo del vendedor si es más. Si no llega a su mínimo, él decide en 24 h.</li><li>Podés subirlo hasta las 19 h, pero <b>no bajarlo ni cancelarlo</b>.</li><li><b>Es un compromiso:</b> si ganás, vas a ver el auto dentro de las 48 h hábiles y lo comprás si coincide con la ficha. Si no, es una falta (con 2, la cuenta se suspende 30 días).</li><li>Ofertás por tu cuenta: ponerse de acuerdo con otras agencias está prohibido y es motivo de baja.</li></ul>`}
  <div class="mbtns">${btns}</div>`);
}
function contacto(a){
 const vence=typeof vencePlazoVisita==="function"?vencePlazoVisita(new Date()):null;
 const f=vence?vence.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"numeric"})+" (48 h hábiles)":"48 h hábiles";
 modal(`<button class="x" data-mact="cerrar" aria-label="Cerrar">×</button>
  <h2 style="margin-top:4px">Contacto del vendedor</h2>
  <dl class="mres num"><div><dt>Vendedor</dt><dd>Vendedor de prueba (titular)</dd></div><div><dt>WhatsApp</dt><dd>11 0000-0000</dd></div><div><dt>Patente</dt><dd>AA 000 AA</dd></div><div><dt>Dónde está el auto</dt><dd>${esc(a.zl)}</dd></div><div><dt>Visita, hasta el</dt><dd>${f}</dd></div></dl>
  <p class="muted chico">Te lo mandamos también por WhatsApp y mail, con la ficha para la transferencia. En el lanzamiento el fee está bonificado.</p>
  <p class="proto mini"><span class="ptag">Prueba</span> Datos inventados: nunca mostramos datos reales en el prototipo.</p>
  <div class="mbtns"><button class="btn sec" data-mact="transf" data-id="${a.id}">Ficha para la transferencia</button><button class="btn pri" data-mact="cerrar">Listo</button></div>`);
}
// Lleva a la página del auto ganado, a la ficha para la transferencia.
function irTransf(a){ cerrarModal(); const ir=()=>setTimeout(()=>byId("transfP")?.scrollIntoView({behavior:Suave.sinMov()?"auto":"smooth"}),80);
 if(vistaActual==="auto"&&autoActual===a) ir(); else { location.hash="#agencias/auto/"+a.id; setTimeout(ir,150); } }
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
 bindMonto();
 const b=byId("navSuperado"), sup=ST.cerrada?0:misOfertas().filter(a=>!est(a).gano).length;   // 20/10: vuelve "te superaron"
 if(b){ b.hidden=!sup; b.textContent=sup||""; }
}
function pintarPanel(){ if(vistaActual!=="auto"||nivel()<2) return pintar(); byId("bidpanel").innerHTML=htmlPanel(autoActual); byId("bidbar").innerHTML=htmlBarra(autoActual); bindMonto(); }
const num=v=>+String(v).replace(/\D/g,"").slice(0,10)||0;
function bindMonto(){
 const i=byId("bpMonto"), v=byId("bpVenta"); if(!autoActual) return; const a=autoActual;
 const recalc=()=>{const n=ST.borr[a.id]||0; byId("bpMargen").textContent=margenTxt(a,n); byId("bpAvisoW").innerHTML=avisoMonto(a,n);};
 i?.addEventListener("input",()=>{
  const n=num(i.value); ST.borr[a.id]=n; i.value=n?n.toLocaleString("es-AR"):"";
  byId("bpLetras").textContent=n?letras(n):""; recalc();
 });
 v?.addEventListener("input",()=>{ const n=num(v.value); ST.venta[a.id]=n; v.value=n?n.toLocaleString("es-AR"):""; recalc(); });
 byId("bpComp")?.addEventListener("change",e=>{ST.comp[a.id]=e.target.checked});
}
function cerrar(){
 ST.cerrada=true;
 AUTOS.forEach(a=>{const e=est(a); if(!e.mio) return;
  if(e.fin==="ganada") aviso(`¡Ganaste el ${esc(a.t)}!`,`Comprás a ${fmt(e.precio)}: ${porTxt[e.por]}. Ya tenés el contacto del vendedor: coordiná la visita dentro de las 48 h hábiles.`,"#agencias/ofertas/ganadas");
  else if(e.fin==="vendedor") aviso(`Tu máximo por el ${esc(a.t)} fue el más alto`,`No llegó al mínimo del vendedor: tiene 24 h para aceptar ${fmt(e.precio)}.`,"#agencias/ofertas/vendedor");
  else aviso(`No ganaste el ${esc(a.t)}`,`Otra agencia puso un máximo más alto. Mañana a las 9 h te llega la subasta nueva.`);
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
 if(k==="ofertar"){
  const n=r10(ST.borr[a.id]||num(byId("bpMonto").value)), d=desde(a);
  ST.err=!n?"Escribí tu máximo.":n<1000000?"Revisá el monto: parece incompleto.":n<d?`Se puede ofertar desde ${fmt(d)}.`:n>a.obj*3?"Revisá el monto: es varias veces el precio particular.":!ST.comp[a.id]?"Para ofertar, marcá el compromiso de compra.":"";
  if(ST.err) return pintarPanel();
  return confirmar(a,n);
 }
 if(k==="subir"){ ST.subir[a.id]=true; return pintarPanel(); }
 if(k==="rival"){   // prototipo: otra agencia carga un máximo más alto que el tuyo
  a.riv.push(est(a).monto+200000); pintar();
  return aviso(`Te superaron en el ${esc(a.t)}`,`Otra agencia puso un máximo más alto. Precio actual: ${fmt(est(a).precio)}. Podés subir el tuyo hasta las 19 h.`,`#agencias/auto/${a.id}`);
 }
 if(k==="pdf"){ return bajarFicha(); }
 if(k==="ultimahora"){ ST.cierre=Date.now()+(59*60+40)*1000; ST.simulada=true; ST.ultimaAvisada=false; return pintar(); }
 if(k==="cerrar"){ return cerrar(); }
 if(k==="reabrir"){ AUTOS.forEach(x=>x.riv=RIV0[x.id].slice()); ST=Object.assign(nuevo(),{fav:ST.fav,guia:ST.guia}); ST.cierre=Date.now()+(2*3600+15*60)*1000; ST.simulada=true; return pintar(); }
 if(k==="contacto"){ return contacto(a); }
 if(k==="atransf"){ e.preventDefault(); return irTransf(a); }
 if(k==="acepta"){ ST.acepta[a.id]=true; aviso(`El vendedor aceptó tu oferta`,`El ${esc(a.t)} es tuyo a ${fmt(est(a).precio)}. Ya tenés su contacto: coordiná la visita dentro de las 48 h hábiles.`,"#agencias/ofertas/ganadas"); return pintar(); }
}
function onModal(e){
 const t=e.target.closest("[data-mact]"); if(!t) return;
 const k=t.dataset.mact, a=BY[t.dataset.id];
 if(k==="cerrar") return cerrarModal();
 if(k==="transf") return irTransf(a);
 if(k==="igual") return confirmar(a,+t.dataset.v,true);
 if(k==="subira"){ ST.borr[a.id]=+t.dataset.v; return confirmar(a,+t.dataset.v); }
 if(k==="ok"){
  const v=+t.dataset.v, antes=ST.of[a.id];
  if(antes&&v<=antes.monto) return cerrarModal();   // el máximo solo sube
  ST.of[a.id]={monto:v,at:Date.now()}; ST.borr[a.id]=undefined; ST.err=""; ST.subir[a.id]=false;
  cerrarModal(); ST.panel=false; byId("vSubasta").classList.remove("sheet"); pintar();
  const e=est(a);
  aviso(antes?"Subiste tu máximo":"Oferta enviada",e.gano?`Vas ganando el ${esc(a.t)}. Precio actual: ${fmt(e.precio)}. Nadie ve tu máximo.`:`Otra agencia tiene un máximo más alto por el ${esc(a.t)}. Precio actual: ${fmt(e.precio)}. Podés subir el tuyo hasta las 19 h.`,`#agencias/auto/${a.id}`);
 }
}

/* ---------- reloj y aviso de la última hora ---------- */
function tick(){
 if(!vistaActual||byId("vSubasta").hidden) return;
 const ms=restaMs();
 byId("vSubasta").querySelectorAll("[data-clock]").forEach(el=>{el.textContent=relojTxt();el.classList.toggle("ultima",!ST.cerrada&&ms<3600000)});
 if(!ST.cerrada&&ms<3600000&&!ST.ultimaAvisada&&nivel()===2){
  ST.ultimaAvisada=true;
  const pend=AUTOS.filter(a=>ST.fav.has(a.id)&&!ST.of[a.id]);
  aviso("Queda 1 hora para el cierre",pend.length?`Seguís ${pend.map(a=>esc(a.t)).join(", ")} y todavía no ofertaste. La subasta cierra a las 19 h.`:"La subasta de hoy cierra a las 19 h.","#agencias/subasta");
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
  if(!ST.bienvenida&&nivel()===2){ ST.bienvenida=true; setTimeout(()=>aviso("Subasta de hoy: "+AUTOS.length+" autos","Abre a las 10 h y cierra a las 19 h. El Peugeot 208 Feline 2022 coincide con lo que buscás.","#agencias/auto/Y-0001"),600); }
 },
 reset(){ AUTOS.forEach(x=>x.riv=RIV0[x.id].slice()); ST=nuevo(); semilla(); },
 // Para la landing de una agencia aprobada (agencias.js): mismos autos y mismo reloj que el portal.
 autos:()=>AUTOS.map(a=>({t:a.t,a:a.a,km:a.km,zl:a.zl,z:a.z,src:a.fotos[0].src})),
 reloj:()=>relojTxt(), cerrada:()=>ST.cerrada
};
byId("vSubasta").addEventListener("click",onClick);
byId("vSubasta").addEventListener("change",e=>{ if(e.target.matches("select[data-act=orden]")){ ST.orden=e.target.value; pintar(); } });
byId("modal").addEventListener("click",onModal);
initLB();
setInterval(tick,1000);
if(/^#agencias\/(subasta|auto|ofertas)/.test(location.hash)) A.route();
})();
