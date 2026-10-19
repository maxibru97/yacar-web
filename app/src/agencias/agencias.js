/* ===================== Yacar · lado agencias (v2, 11/10/2026) =====================
 Vive en <yacar-agencias> con Shadow DOM: sus estilos y su código no se mezclan con los del vendedor.
 Se entra con el link "Soy agencia" (#agencias). Rutas: #agencias, #agencias/<sección>, #agencias/alta/1..3,
 #agencias/estado, #agencias/perfil, #agencias/preferencias, #agencias/terminos|reglas|privacidad.
 Plan y decisiones: app/agencias/PLAN_LANDING_AGENCIAS.md. Lo violeta ("Solo prototipo") está simulado. */
(()=>{
const LOGO=`<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" style="flex:none"><rect width="30" height="30" rx="8" fill="#B8E04A"/><path d="M4.5 20.5c2.3-1.5 4.6-1.5 6.9 0s4.6 1.5 6.9 0 4.6-1.5 6.9 0" stroke="#123F2C" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M7.3 18.4a3.8 3.8 0 0 1 7.6 0zM15.1 18.4a3.8 3.8 0 0 1 7.6 0z" fill="#123F2C"/><circle cx="11.5" cy="16.5" r="1.05" fill="#B8E04A"/><circle cx="19.3" cy="16.5" r="1.05" fill="#B8E04A"/></svg>`;
const TICK=`<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#B8E04A"/><path d="M6 10.3l2.6 2.6L14.2 7" stroke="#123F2C" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const TICKBIG=`<svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><circle cx="12" cy="12" r="12" fill="#B8E04A"/><path d="M7 12.4l3.2 3.2L17 8.8" stroke="#123F2C" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const tpl=document.getElementById("tplAg");
tpl.innerHTML=tpl.innerHTML.replaceAll("%%LOGO%%",LOGO).replaceAll("%%TICKBIG%%",TICKBIG).replaceAll("%%TICKL%%",TICK).replaceAll("%%TICK%%",TICK);
class YacarAgencias extends HTMLElement{constructor(){super();this.attachShadow({mode:"open"}).appendChild(tpl.content.cloneNode(true))}}
customElements.define("yacar-agencias",YacarAgencias);
const R=document.getElementById("agWeb").shadowRoot;
const $=s=>R.querySelector(s), $$=s=>R.querySelectorAll(s), byId=id=>R.getElementById(id);

/* ---------- zonas de AMBA (puntos aproximados, para el mapa esquemático) ---------- */
const LAT0=-34.61, LON0=-58.44, KX=91.3, KY=111;
const P=(lat,lon)=>[(lon-LON0)*KX,(LAT0-lat)*KY];
const ZONAS_RAW=[
["agronomia","Agronomía",-34.596,-58.490,"b"],["almagro","Almagro",-34.610,-58.420,"b"],["balvanera","Balvanera",-34.609,-58.403,"b"],
["barracas","Barracas",-34.645,-58.383,"b"],["belgrano","Belgrano",-34.562,-58.457,"b"],["boedo","Boedo",-34.630,-58.418,"b"],
["caballito","Caballito",-34.618,-58.442,"b"],["chacarita","Chacarita",-34.587,-58.455,"b"],["coghlan","Coghlan",-34.560,-58.474,"b"],
["colegiales","Colegiales",-34.575,-58.449,"b"],["constitucion","Constitución",-34.627,-58.385,"b"],["flores","Flores",-34.632,-58.462,"b"],
["floresta","Floresta",-34.628,-58.485,"b"],["laboca","La Boca",-34.634,-58.363,"b"],["paternal","La Paternal",-34.597,-58.468,"b"],
["liniers","Liniers",-34.642,-58.520,"b"],["mataderos","Mataderos",-34.660,-58.505,"b"],["montecastro","Monte Castro",-34.618,-58.508,"b"],
["montserrat","Montserrat",-34.613,-58.381,"b"],["pompeya","Nueva Pompeya",-34.650,-58.418,"b"],["nunez","Núñez",-34.545,-58.462,"b"],
["palermo","Palermo",-34.580,-58.425,"b"],["pavellaneda","Parque Avellaneda",-34.647,-58.478,"b"],["pchacabuco","Parque Chacabuco",-34.636,-58.437,"b"],
["pchas","Parque Chas",-34.585,-58.479,"b"],["ppatricios","Parque Patricios",-34.638,-58.402,"b"],["pmadero","Puerto Madero",-34.612,-58.362,"b"],
["recoleta","Recoleta",-34.588,-58.397,"b"],["retiro","Retiro",-34.592,-58.375,"b"],["saavedra","Saavedra",-34.552,-58.485,"b"],
["sancristobal","San Cristóbal",-34.624,-58.402,"b"],["sannicolas","San Nicolás",-34.604,-58.382,"b"],["santelmo","San Telmo",-34.621,-58.372,"b"],
["velez","Vélez Sarsfield",-34.632,-58.493,"b"],["versalles","Versalles",-34.630,-58.520,"b"],["vcrespo","Villa Crespo",-34.599,-58.438,"b"],
["vdelparque","Villa del Parque",-34.605,-58.490,"b"],["vdevoto","Villa Devoto",-34.602,-58.512,"b"],["vmitre","Villa Gral. Mitre",-34.611,-58.468,"b"],
["vlugano","Villa Lugano",-34.676,-58.473,"b"],["vluro","Villa Luro",-34.639,-58.503,"b"],["vortuzar","Villa Ortúzar",-34.581,-58.467,"b"],
["vpueyrredon","Villa Pueyrredón",-34.581,-58.503,"b"],["vreal","Villa Real",-34.620,-58.525,"b"],["vriachuelo","Villa Riachuelo",-34.690,-58.470,"b"],
["vsantarita","Villa Santa Rita",-34.615,-58.482,"b"],["vsoldati","Villa Soldati",-34.666,-58.445,"b"],["vurquiza","Villa Urquiza",-34.573,-58.488,"b"],
["vlopez","Vicente López",-34.527,-58.479,"p"],["sanisidro","San Isidro",-34.471,-58.528,"p"],["sanfernando","San Fernando",-34.441,-58.560,"p"],
["tigre","Tigre",-34.440,-58.620,"p",1],["sanmartin","Gral. San Martín",-34.575,-58.537,"p"],["3defebrero","Tres de Febrero",-34.603,-58.565,"p"],
["hurlingham","Hurlingham",-34.590,-58.639,"p"],["ituzaingo","Ituzaingó",-34.658,-58.667,"p"],["moron","Morón",-34.650,-58.619,"p",1],
["lamatanza","La Matanza",-34.720,-58.590,"p",1],["merlo","Merlo",-34.665,-58.727,"p"],["moreno","Moreno",-34.634,-58.791,"p",1],
["jcpaz","José C. Paz",-34.515,-58.768,"p"],["malvinas","Malvinas Argentinas",-34.490,-58.700,"p"],["sanmiguel","San Miguel",-34.543,-58.712,"p"],
["pilar","Pilar",-34.459,-58.914,"p",1],["escobar","Escobar",-34.348,-58.795,"p",1],["avellaneda","Avellaneda",-34.662,-58.365,"p"],
["lanus","Lanús",-34.700,-58.392,"p"],["lomas","Lomas de Zamora",-34.761,-58.406,"p",1],["quilmes","Quilmes",-34.724,-58.254,"p",1],
["berazategui","Berazategui",-34.763,-58.212,"p"],["fvarela","Florencio Varela",-34.808,-58.276,"p",1],["abrown","Almirante Brown",-34.800,-58.390,"p"],
["eecheverria","Esteban Echeverría",-34.818,-58.465,"p"],["ezeiza","Ezeiza",-34.853,-58.522,"p",1],["pperon","Presidente Perón",-34.920,-58.385,"p"],
["sanvicente","San Vicente",-35.025,-58.423,"p"],["marcospaz","Marcos Paz",-34.780,-58.838,"p"],["grodriguez","Gral. Rodríguez",-34.608,-58.952,"p"],
["canuelas","Cañuelas",-35.052,-58.760,"p",1],["laplata","La Plata",-34.921,-57.955,"p",1],["ensenada","Ensenada",-34.864,-57.912,"p"],
["berisso","Berisso",-34.873,-57.886,"p"]];
const ZONAS=ZONAS_RAW.map(([id,n,lat,lon,t,lbl])=>{const [x,y]=P(lat,lon);return {id,n,x,y,t,lbl:!!lbl,full:t==="b"?n+", CABA":n}});
const ZBY=Object.fromEntries(ZONAS.map(z=>[z.id,z]));
const COAST=[[-34.20,-58.80],[-34.26,-58.80],[-34.36,-58.66],[-34.42,-58.57],[-34.47,-58.50],[-34.52,-58.465],[-34.545,-58.44],[-34.575,-58.40],[-34.595,-58.36],[-34.625,-58.345],[-34.66,-58.32],[-34.70,-58.25],[-34.74,-58.17],[-34.79,-58.06],[-34.84,-57.93],[-34.88,-57.84],[-34.88,-57.60],[-34.20,-57.60]].map(([a,b])=>P(a,b));
const CABA=[[-34.535,-58.465],[-34.546,-58.50],[-34.57,-58.53],[-34.615,-58.53],[-34.655,-58.53],[-34.69,-58.47],[-34.70,-58.46],[-34.66,-58.42],[-34.645,-58.38],[-34.635,-58.355],[-34.61,-58.36],[-34.59,-58.37],[-34.57,-58.40],[-34.545,-58.44]].map(([a,b])=>P(a,b));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const banda=d=>{const a=Math.floor(d/5)*5;return `a ${a}–${a+5} km`};
const fmt=n=>"$ "+Math.round(n).toLocaleString("es-AR");
const fmtM=n=>"$ "+(n/1e6).toLocaleString("es-AR",{minimumFractionDigits:1,maximumFractionDigits:1})+" M";
const esc=s=>String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* Fotos de ejemplo (11/10/2026): el 208 es el auto de prueba de Maxi; Cronos, Hilux y CR-V, fotos de ejemplo. Patentes difuminadas.
 Comprimidas e incrustadas para que la web siga siendo un solo archivo. */
const FOTOS={"p_frente": /*@foto:p_frente.jpg*/"", "p_34izq": /*@foto:p_34izq.jpg*/"", "p_lat_izq": /*@foto:p_lat_izq.jpg*/"", "p_tras34": /*@foto:p_tras34.jpg*/"", "p_lat_der": /*@foto:p_lat_der.jpg*/"", "p_34der": /*@foto:p_34der.jpg*/"", "p_34izq2": /*@foto:p_34izq2.jpg*/"", "p_tablero": /*@foto:p_tablero.jpg*/"", "p_asientos": /*@foto:p_asientos.jpg*/"", "p_interior": /*@foto:p_interior.jpg*/"", "p_puerta": /*@foto:p_puerta.jpg*/"", "cronos": /*@foto:cronos.jpg*/"", "hilux": /*@foto:hilux.jpg*/"", "crv": /*@foto:crv.jpg*/""};
// Cubiertas recortadas de las fotos laterales del 208 de ejemplo (11/10/2026).
const CUB={"cub_di":/*@foto:cub_di.jpg*/"","cub_dd":/*@foto:cub_dd.jpg*/"","cub_ti":/*@foto:cub_ti.jpg*/"","cub_td":/*@foto:cub_td.jpg*/""};
// Las mismas fotos que le pedimos al vendedor (10 obligatorias, 18/10) (FOTOS del lado vendedor), en el mismo orden y con los mismos nombres.
// Tercer dato: la foto de ejemplo que usamos (null = no la tenemos del 208 de ejemplo).
const GALERIA=[["esq_di","Esquina delantera izq.","p_34izq"],["esq_dd","Esquina delantera der.","p_34der"],["esq_ti","Esquina trasera izq.","p_tras34"],["esq_td","Esquina trasera der.","p_lat_der"],["asientos_del","Asientos delanteros","p_asientos"],["asientos_tras","Asientos traseros",null],["tablero","Tablero encendido","p_tablero"],["baul","Baúl",null],["cub_di","Cubierta delantera","cub_di"],["cub_td","Cubierta trasera","cub_td"]];   // 18/10: 10 fotos (+ motor si el vendedor la sacó); llaves = dato declarado
const fotoDe=k=>k?(FOTOS[k]||CUB[k]||null):null;
const CARS=[
 {t:"Peugeot 208 1.6 Allure",a:2021,km:61000,z:"sanmartin",zl:"Gral. San Martín",min:15900000,of:4,col:"#2B4FB0",foto:"p_34der"},
 {t:"Fiat Cronos 1.3 Drive",a:2023,km:38000,z:"moron",zl:"Morón (zona Haedo)",min:16900000,of:3,col:"#B8C2C9",foto:"cronos"},
 {t:"Toyota Hilux 2.4 DX 4x4",a:2018,km:132000,z:"vlopez",zl:"Vicente López",min:29500000,of:2,col:"#EDEDED",pickup:1,foto:"hilux"},
 {t:"Honda CR-V 2.4 EX-L 4x4 AT",a:2014,km:118000,z:"sanisidro",zl:"San Isidro",min:23900000,of:3,col:"#1E1E1E",foto:"crv"}
];

/* ---------- estado ---------- */
const S={
 paso:1, estado:"sin", sesion:false, ingEmail:"", ingPass:"", pass:"", cpTxt:"", cpRes:null, cpOtro:false, web:"", anios:"",
 nombre:"", resp:"", cel:"",
 base:"", radio:20, zonas:new Set(), tocadas:false, fuera:false,
 waModo:"resumen", recordatorio:true, acepT:false, acepC:false,
 cuit:"", cuitVerif:"", arca:null, verificando:false, errPerf:false, fiscal:"", habit:"", numH:"", dir:"", email:"", maps:"", mail:false,
 tipos:new Set(["auto","suv","pickup"]), marcas:new Set(), anioD:2012, anioH:2026, kmMax:"150000", pD:"0", pH:"0", prefsOk:false
};
const S_INICIAL=()=>({paso:1,estado:"sin",sesion:false,ingEmail:"",ingPass:"",linkEnviado:false,errCuenta:"",cargando:false,altaEnviada:false,pass:"",cpTxt:"",cpRes:null,cpOtro:false,web:"",anios:"",nombre:"",resp:"",cel:"",base:"",radio:20,zonas:new Set(),tocadas:false,fuera:false,waModo:"resumen",recordatorio:true,acepT:false,acepC:false,cuit:"",cuitVerif:"",arca:null,verificando:false,errPerf:false,fiscal:"",habit:"",numH:"",dir:"",email:"",maps:"",mail:false,tipos:new Set(["auto","suv","pickup"]),marcas:new Set(),anioD:2012,anioH:2026,kmMax:"150000",pD:"0",pH:"0",prefsOk:false});
const DEMO_BASE="vurquiza";
const celOk=()=>{const d=S.cel.replace(/\D/g,"");return d.length>=10&&d.length<=13};
const emailOk=e=>/^\S+@\S+\.\S+$/.test(String(e||"").trim());
const mapsOk=()=>/(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.)/i.test(S.maps);
const aprobada=()=>S.sesion&&S.estado==="ok";
// Web publicada sin servicio de mail propio todavía: no hay link al mail (ver cuenta.js).
const sinMails=()=>!!(window.YacarCuenta?.real&&!window.YacarCuenta.mails);
const perfilOk=()=>cuitOk(S.cuit)&&S.cuitVerif==="nuevo"&&datosOk();

/* ---------- mapa ----------
 Mapa esquemático en km (1 unidad = 1 km, centro en Caballito). Divisiones aproximadas: celdas armadas a partir del
 punto de cada barrio o partido (diagrama de Voronoi), recortadas por el límite de CABA y la costa. Sirven para ver la
 zona de un vistazo, no son límites oficiales. Con zoom, el encuadre sigue al radio elegido y cambia con una transición. */
const VB=[-50,-44,106,102];
function carIcon(col="#B8C2C9",w=64,pickup=false){
 const body=pickup
  ? `<path d="M6 30l2-8h22l4-8h16l6 8h6a3 3 0 0 1 3 3v5H6z" fill="${col}" stroke="#123F2C" stroke-width="1.5"/>`
  : `<path d="M6 30v-5a3 3 0 0 1 2-3l9-3 7-7h18l8 7 9 2a3 3 0 0 1 2 3v6z" fill="${col}" stroke="#123F2C" stroke-width="1.5"/><path d="M26 14h7v6H20zM36 14h5l6 6H36z" fill="#DDE9E8" stroke="#123F2C" stroke-width="1"/>`;
 return `<svg width="${w}" viewBox="0 0 66 40" aria-hidden="true">${body}<circle cx="18" cy="31" r="5.5" fill="#17261D"/><circle cx="18" cy="31" r="2.2" fill="#CFC8B4"/><circle cx="50" cy="31" r="5.5" fill="#17261D"/><circle cx="50" cy="31" r="2.2" fill="#CFC8B4"/></svg>`;
}
const fotoOIcono=(c,w)=>c.foto&&FOTOS[c.foto]?`<img src="${FOTOS[c.foto]}" alt="${esc(c.t)}">`:carIcon(c.col,w,c.pickup);
function autoZonas(baseId,radio){const b=ZBY[baseId];if(!b) return new Set();return new Set(ZONAS.filter(z=>dist(z,b)<=radio).map(z=>z.id))}
// Celda de cada zona: se recorta un rectángulo con la mediatriz entre la zona y cada una de las otras.
function voronoi(sitios,caja){
 const [x0,y0,w,h]=caja, cel={};
 for(const s of sitios){
  let poly=[[x0,y0],[x0+w,y0],[x0+w,y0+h],[x0,y0+h]];
  for(const t of sitios){
   if(t===s||!poly.length) continue;
   const nx=t.x-s.x, ny=t.y-s.y, c=(t.x*t.x+t.y*t.y-s.x*s.x-s.y*s.y)/2, f=p=>p[0]*nx+p[1]*ny-c, out=[];
   for(let i=0;i<poly.length;i++){
    const p=poly[i], q=poly[(i+1)%poly.length], fp=f(p), fq=f(q);
    if(fp<=0) out.push(p);
    if((fp<0&&fq>0)||(fp>0&&fq<0)){const k=fp/(fp-fq);out.push([p[0]+(q[0]-p[0])*k,p[1]+(q[1]-p[1])*k])}
   }
   poly=out;
  }
  cel[s.id]=poly;
 }
 return cel;
}
const CELDAS=Object.assign(voronoi(ZONAS.filter(z=>z.t==="p"),[-160,-140,330,300]),voronoi(ZONAS.filter(z=>z.t==="b"),[-25,-20,45,40]));
const poly=pts=>pts.map(p=>p.map(v=>v.toFixed(2)).join(",")).join(" ");
// Encuadre según el radio: la zona entera más un margen. Con el radio chico se ve más de cerca.
function encuadre(b,radio){const m=Math.max(radio*1.3,9), hm=m*VB[3]/VB[2];return [b.x-m,b.y-hm,2*m,2*hm]}
const MAPAS=new WeakMap();
function drawMap(svg,{baseId,radio,sel,onToggle,area,vb,labels=true,small=false,zoom=false}){
 const b=ZBY[baseId];
 const destino=vb||(zoom&&b&&radio?encuadre(b,radio):VB);
 const clave=[baseId,area,small,labels,!!onToggle].join("|");
 let st=MAPAS.get(svg);
 if(!st||st.clave!==clave){
  const uid=svg.id||"m"+Math.random().toString(36).slice(2,7);
  let h=`<defs><clipPath id="${uid}-caba"><polygon points="${poly(CABA)}"/></clipPath></defs>`;
  h+=`<rect x="-200" y="-200" width="420" height="420" fill="#F1EEE4"/>`;
  const celda=z=>`<polygon class="cell${z.t==="b"?" b":""}" data-z="${z.id}" points="${poly(CELDAS[z.id])}"><title>${z.full}</title></polygon>`;
  h+=`<g class="cells">${ZONAS.filter(z=>z.t==="p").map(celda).join("")}</g>`;
  h+=`<polygon points="${poly(CABA)}" fill="#ECE7DA"/>`;
  h+=`<g class="cells" clip-path="url(#${uid}-caba)">${ZONAS.filter(z=>z.t==="b").map(celda).join("")}</g>`;
  h+=`<polygon points="${poly(COAST)}" fill="#CDE2E3"/>`;
  h+=`<polygon class="limcaba" points="${poly(CABA)}"/>`;
  if(!small) h+=`<text class="lbl agua" data-px="12" x="32" y="-10">Río de la Plata</text>`;
  h+=`<circle class="radio" cx="${b?b.x:0}" cy="${b?b.y:0}" r="0" ${b&&radio?"":"hidden"}/>`;
  if(area){const z=ZBY[area];h+=`<circle class="area" cx="${z.x}" cy="${z.y}" r="${small?7:4.5}"/>`;}
  if(!small&&labels){
   h+=`<text class="lbl caba" data-px="11" x="-1" y="-0.5">CABA</text>`;
   for(const z of ZONAS.filter(z=>z.lbl&&z.id!==baseId)) h+=`<text class="lbl" data-px="11" data-dy="4" x="${z.x.toFixed(2)}" y="${z.y.toFixed(2)}">${z.n}</text>`;
  }
  if(b) h+=`<g class="base" data-x="${b.x}" data-y="${b.y}"><rect x="-1.7" y="-1.7" width="3.4" height="3.4" rx=".6"/></g>`
   +(small?"":`<text class="lbl base-t" data-px="12" data-dy="-10" x="${b.x.toFixed(2)}" y="${b.y.toFixed(2)}">${b.n}</text>`);
  svg.innerHTML=h;
  svg.dataset.vivo="1";
  if(onToggle){
   svg.classList.add("tocable");
   svg.querySelectorAll(".cell").forEach(c=>{
    c.setAttribute("tabindex","0"); c.setAttribute("role","button");
    const f=()=>st.onToggle&&st.onToggle(c.dataset.z);
    c.addEventListener("click",f);
    c.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();f()}});
   });
  }
  // La primera vez arranca desde el AMBA entero y se acerca a la zona.
  st={clave,vb:st?st.vb:(zoom?VB.slice():destino.slice()),r:st&&st.b===baseId?st.r:0,b:baseId,stop:null};
  MAPAS.set(svg,st);
 }
 st.onToggle=onToggle;
 svg.querySelectorAll(".cell").forEach(c=>{
  const on=!!(sel&&sel.has(c.dataset.z));
  c.classList.toggle("on",on);
  if(onToggle) c.setAttribute("aria-label",ZBY[c.dataset.z].full+(on?" (en tu zona)":""));
 });
 const circ=svg.querySelector(".radio");
 const escala=v=>{
  // Textos y marcador con el mismo tamaño en pantalla, haya zoom o no.
  const ppu=(svg.clientWidth||svg.getBoundingClientRect().width||320)/v[2];
  svg.querySelectorAll(".lbl").forEach(t=>{t.setAttribute("font-size",(+t.dataset.px/ppu).toFixed(3));if(t.dataset.dy) t.setAttribute("dy",(+t.dataset.dy/ppu).toFixed(3))});
  svg.querySelectorAll(".base").forEach(g=>g.setAttribute("transform",`translate(${g.dataset.x} ${g.dataset.y}) scale(${(11/3.4/ppu).toFixed(4)})`));
  // Si un nombre se pisa con el de tu local, se oculta.
  const bt=svg.querySelector(".base-t");
  if(bt){
   const r0=bt.getBBox(), pad=3/ppu, bx=+bt.getAttribute("x"), by=+bt.getAttribute("y"), m=7/ppu;
   const r={x:Math.min(r0.x,bx-m),y:r0.y,width:Math.max(r0.x+r0.width,bx+m)-Math.min(r0.x,bx-m),height:by+m-r0.y};
   svg.querySelectorAll(".lbl:not(.base-t):not(.agua)").forEach(t=>{const q=t.getBBox();
    t.style.visibility=(q.x<r.x+r.width+pad&&q.x+q.width>r.x-pad&&q.y<r.y+r.height+pad&&q.y+q.height>r.y-pad)?"hidden":""});
  }
 };
 if(st.stop) st.stop();
 const v0=st.vb.slice(), r0=st.r, r1=b&&radio?radio:0;
 const igual=v0.every((x,i)=>Math.abs(x-destino[i])<.01)&&Math.abs(r0-r1)<.01;
 const pintar=e=>{
  const v=v0.map((x,i)=>x+(destino[i]-x)*e);
  svg.setAttribute("viewBox",v.map(x=>x.toFixed(3)).join(" "));
  if(circ) circ.setAttribute("r",(r0+(r1-r0)*e).toFixed(3));
  escala(v); st.vb=v; st.r=r0+(r1-r0)*e;
 };
 if(igual||small){pintar(1);return}
 st.stop=Suave.tween(650,pintar,()=>{st.stop=null});
}

/* ---------- landing ---------- */
// Operaciones cerradas de ejemplo (lo que ve cualquiera). Ilustrativas: todavía no hay operaciones reales.
const OPS=[
 {t:"Chevrolet Onix 1.2 LT",a:2021,km:54000,zl:"Caballito",ag:"una agencia de Flores",of:4,compra:13100000,ref:15200000,dias:1,col:"#C9332B"},
 {t:"Volkswagen Amarok 2.0 Highline 4x4",a:2017,km:142000,zl:"Tigre",ag:"una agencia de San Fernando",of:5,compra:24800000,ref:28500000,dias:2,col:"#9AA3AA",pickup:1},
 {t:"Toyota Etios 1.5 XLS",a:2019,km:88000,zl:"Lanús",ag:"una agencia de Avellaneda",of:3,compra:11300000,ref:12900000,dias:2,col:"#EDEDED"},
 {t:"Ford EcoSport 1.6 SE",a:2018,km:97000,zl:"Ramos Mejía",ag:"una agencia de Morón",of:6,compra:12200000,ref:14100000,dias:3,col:"#2B4FB0"}
];
const dias=n=>n+(n===1?" día":" días");
function heroLots(){
 const b=ZBY[S.base||DEMO_BASE];
 byId("heroLots").innerHTML=CARS.slice(0,3).map(c=>`<li class="lot"><div class="thumb">${fotoOIcono(c,66)}</div><div class="info"><div class="t">${c.t} ${c.a}</div><div class="s num">${c.km.toLocaleString("es-AR")} km · ${c.zl}</div><div class="s num">${banda(dist(ZBY[c.z],b))} · ${c.of} ofertas</div></div><div class="p"><span>Mínimo</span><b class="num">${fmtM(c.min)}</b></div></li>`).join("");
}
// La landing y la subasta son públicas; los mínimos, la ficha completa y ofertar, solo para agencias aprobadas (subasta.js, vitrina).
function renderLanding(){
 const ok=aprobada();
 byId("heroBtns").innerHTML=ok
  ?`<a class="btn pri" href="#agencias/subasta">Ver la subasta de hoy</a><a class="btn ondark" href="#agencias/estado">Mi agencia</a>`
  :S.sesion
   ?`<button class="btn pri" data-go="estado">Ver el estado de mi agencia</button><a class="btn ondark" href="#agencias/subasta">Ver la subasta de hoy</a>`
   :`<button class="btn pri" data-go="alta">Sumar mi agencia</button><a class="btn ondark" href="#agencias/subasta">Ver la subasta de hoy</a>`;
 byId("heroCard").innerHTML=ok
  ?`<div class="card"><div class="cardhead"><h3>Subasta de hoy</h3><span class="clock num" id="clock1">--</span></div><ul class="lotlist" id="heroLots"></ul><div class="cardfoot"><span class="ptag">Solo prototipo</span><span>Autos de ejemplo cerca de ${ZBY[S.base||DEMO_BASE].n}</span></div></div>`
  :`<div class="card"><div class="cardhead"><h3>Operaciones cerradas</h3><span class="clock">Ejemplos</span></div><ul class="lotlist">${OPS.slice(0,3).map(o=>`<li class="lot"><div class="thumb">${carIcon(o.col,66,!!o.pickup)}</div><div class="info"><div class="t">${o.t} ${o.a}</div><div class="s num">${o.km.toLocaleString("es-AR")} km · ${o.zl}</div><div class="s">${o.of} ofertas · compra en ${dias(o.dias)}</div></div><div class="p"><span>Compró en</span><b class="num">${fmtM(o.compra)}</b></div></li>`).join("")}</ul><div class="cardfoot"><span class="ptag">Solo prototipo</span><span>Ejemplos ilustrativos. La subasta la ven solo las agencias aprobadas.</span></div></div>`;
 if(ok){ heroLots(); tick(); }
 byId("opsLanding").innerHTML=OPS.map(o=>`<div class="card op"><div class="opth">${carIcon(o.col,96,!!o.pickup)}</div><div class="opi"><b>${o.t} ${o.a}</b><span class="num">${o.km.toLocaleString("es-AR")} km · ${o.zl}</span><span>${o.of} ofertas · la compró ${o.ag}</span></div><dl><div><dt>Compró en</dt><dd class="big num">${fmtM(o.compra)}</dd></div><div><dt>Autos así se publican a</dt><dd class="num">${fmtM(o.ref)}</dd></div><div><dt>De la subasta a la compra</dt><dd>${dias(o.dias)}</dd></div></dl></div>`).join("");
 byId("ficha").hidden=!ok; byId("operaciones").hidden=ok;
}
function ficha(){
 const main=byId("fichaMain");
 const ver=i=>{const [,l,k]=GALERIA[i], src=fotoDe(k);main.querySelector("img")?.remove();main.querySelector(".sinfoto")?.remove();
  main.insertAdjacentHTML("beforeend",src?`<img src="${src}" alt="Peugeot 208: ${l}">`:`<div class="sinfoto"><span class="ptag">Solo prototipo</span><span>No tenemos esta foto del auto de ejemplo.<br>En la web real están siempre las 10.</span></div>`);
  main.querySelector(".tag").textContent=`Foto ${i+1} de ${GALERIA.length} · ${l}`;byId("fichaThumbs").querySelectorAll("button").forEach((b,j)=>b.setAttribute("aria-current",String(j===i)))};
 byId("fichaThumbs").innerHTML=GALERIA.map(([,l,k],i)=>`<button type="button" data-i="${i}" aria-label="Ver foto: ${l}">${fotoDe(k)?`<img src="${fotoDe(k)}" alt="" loading="lazy">`:`<span class="ph">${l}</span>`}</button>`).join("");
 byId("fichaThumbs").querySelectorAll("button").forEach(b=>b.onclick=()=>ver(+b.dataset.i));
 ver(1);
 const ok=`<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#1C7444"/><path d="M6 10.3l2.6 2.6L14.2 7" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 const dot=`<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="5" fill="#A8A08A"/></svg>`;
 const wn=`<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#8A5300"/><path d="M10 5v6M10 14v.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`;
 byId("declarado").innerHTML=["Anda bien, sin ruidos","El aire enfría","Sin choques","Sin repintados","Service al día, con comprobantes (ago. 2026)","2 llaves"].map(t=>`<li>${dot}<span>${t}</span></li>`).join("");
 byId("revisado").innerHTML=[[ok,"Las 10 fotos revisadas: sin daños a la vista y los km del tablero coinciden"],[ok,"Papeles revisados el 10/10: el detalle está en el informe de abajo"],[dot,"Patente tapada en las fotos: te llega con el contacto del vendedor"]].map(([i,t])=>`<li>${i}<span>${t}</span></li>`).join("");
 // Informe con el que el auto entra a la subasta (D-39, 13/10/2026): lo mismo que ve el vendedor, sin datos del titular. Fuente = organismo oficial.
 const INF=[["Estado del dominio","En regla: sin prendas, embargos, inhibiciones, denuncias de robo ni trámites pendientes. El vendedor es titular (DNI validado).","Registro del Automotor (DNRPA) · 10/10"],
  ["Dueños anteriores","1 dueño anterior.","Registro del Automotor (DNRPA) · 10/10"],
  ["Multas, deuda de patente, VTV y GNC","Se consultan cuando el vendedor acepta vender y te llegan con el contacto. Si hay deudas, las podés descontar del precio.","Organismos oficiales, al cerrar la venta"],
  ["GNC a la vista","Sin equipo en las fotos del baúl y del motor.","Fotos revisadas por Yacar · 10/10"],
  ["Radicación","Registro de San Isidro (Provincia de Buenos Aires).","Registro del Automotor (DNRPA) · 10/10"],
  ["Dónde está hoy","Gral. San Martín: distinto de la radicación.","Declarado por el vendedor"],
  ["Verificación policial",'<span class="insignia">Verificación policial vigente</span>',"Formulario 12 revisado por Yacar"]];
 byId("informeAuto").innerHTML=INF.map(([t,v,f])=>`<dt>${t}</dt><dd>${v}<small>${f}</small></dd>`).join("");
 fichaTransferencia();
 fichaMapa();
}
// Ficha para la transferencia (16/10/2026, D-44): le llega a la agencia que ganó, con el contacto, al pagar el fee.
// Sin DNI, domicilio, estado civil ni carácter del bien del titular (PRIVACIDAD_RESUMEN_AGENCIA.md, D-38): quién firma se dice sin esos datos.
function fichaTransferencia(){
 const hoy=new Date(), habiles=sumarHabiles;   // 16/10 (TEC-11): con feriados, comun/dias_habiles.js
 const f=d=>d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"}), fa=d=>d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric"});
 const dl=(id,filas)=>byId(id).innerHTML=filas.map(([t,v,x])=>`<dt>${t}</dt><dd>${v}${x?`<small>${x}</small>`:""}</dd>`).join("");
 dl("trVend",[["Vendedor","Lucía Gómez · WhatsApp 11 2345 6789"],["Identidad","Validada con el RENAPER (DNI + selfie)"],["Auto","Peugeot 208 1.6 Allure 2021 · 61.000 km"],["Patente","AE 123 FO"],["Chasis y motor","8AD2A9HP0MG012345 · 10FX4E1234567","Para verificar en la visita"]]);
 dl("trFirma",[["Dónde","Registro Seccional de San Isidro (radicación del auto)"],["Quién firma","Solo el vendedor: es el único titular. No hace falta otra firma."],["Formulario 08","Los datos del auto van precargados en la ficha; los del vendedor salen de su DNI en la firma."]]);
 dl("trPapeles",[["Certificado de dominio",`Pedido por el vendedor el ${f(hoy)}. Congela el auto hasta el ${fa(habiles(hoy,15))}.`,"Lo pide el titular · Registro del Automotor (DNRPA)"],
  ["Título","Digital: el vendedor lo trae impreso.","Declarado por el vendedor"],
  ["Cédula verde","Foto revisada: coincide con el informe.","Revisado por Yacar"],
  ["Prenda","No tiene.","Registro del Automotor (DNRPA)"],
  ["Verificación policial",'<span class="insignia">Vigente</span> hasta el 12/05/2027.',"Formulario 12 revisado por Yacar"],
  ["Grabado de autopartes","Se ve la patente grabada en los vidrios.","Fotos revisadas por Yacar"],
  ["Deuda de patente y multas","Al día en ARBA. Sin multas en Nación, Ciudad y Provincia.",`Consultadas el ${f(hoy)}, al cerrar la venta · constancias adjuntas`],
  ["VTV","Vigente hasta el 15/03/2027.","VTV Provincia"],
  ["GNC","Sin equipo de GNC registrado.","ENARGAS"]]);
}
function fichaMapa(){
 const b=ZBY[S.base||DEMO_BASE], z=ZBY[CARS[0].z];
 const vb=[Math.min(b.x,z.x)-14,Math.min(b.y,z.y)-11,Math.abs(b.x-z.x)+28,Math.abs(b.y-z.y)+22];
 drawMap(byId("fichaMap"),{baseId:S.base||DEMO_BASE,area:CARS[0].z,vb,small:true});
 byId("fichaDist").textContent=banda(dist(z,b))+" de tu local";
}
let landRadio=20;
function landMap(){
 const base=S.base||DEMO_BASE, sel=autoZonas(base,landRadio);
 Suave.poner(byId("landRadios"),[10,20,30,50].map(r=>`<button class="chip sm" aria-pressed="${r===landRadio}" data-r="${r}">${r} km</button>`).join(""));
 $$("#landRadios .chip").forEach(c=>c.onclick=()=>{landRadio=+c.dataset.r;landMap()});
 drawMap(byId("landMap"),{baseId:base,radio:landRadio,sel,zoom:true});
 const nb=[...sel].filter(id=>ZBY[id].t==="b").length, np=sel.size-nb;
 byId("landSum").innerHTML=`Desde <b>${ZBY[base].full}</b>, ${landRadio} km: <b>${nb}</b> barrios de CABA y <b>${np}</b> partidos del GBA.`;
}
function waMsgs(target){
 const nom=(S.resp||"Martín").split(" ")[0];
 target.innerHTML=`<div class="top">${LOGO}<div><b>Yacar Agencias</b><small>cuenta de empresa</small></div></div>
 <div class="bubble"><b>Buen día, ${esc(nom)}. Subasta de hoy en tu zona</b><br>7 autos nuevos: 3 autos, 2 SUV y 2 pickups.<br>Fotos, estado y papeles revisados.<br>Abre a las 10 h y cierra a las 19 h.<br>Ver los autos: <span class="lnk">yacar.com.ar/hoy</span><div class="h">9:00</div></div>
 <div class="bubble"><b>Queda 1 hora.</b> La subasta cierra a las 19 h y todavía no ofertaste por 2 autos de tu zona.<div class="h">18:00</div></div>
 <div class="bubble"><b>¡Ganaste un auto!</b> Pagá el fee y te pasamos el contacto del vendedor para coordinar la visita.<div class="h">19:02</div></div>`;
}
const VERIF=[
 ["Local en Google Maps","Con reseñas de clientes."],
 ["Web o redes","Que publique autos."],
 ["Años en el rubro",""],
 ["CUIT verificado en ARCA",""],
 ["Una charla con nosotros","Antes de aprobarte."]
];
function vlist(el){
 const ic=`<svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="4" fill="#2F6B47"/></svg>`;
 el.innerHTML=VERIF.map(([t,d])=>`<li><span class="ic">${ic}</span><div><b>${t}</b>${d?`<small>${d}</small>`:""}</div></li>`).join("");
}
// Fee (11/10/2026, puede cambiar): 1,5% del precio de compra, con un mínimo de $200 mil por auto.
const FEE={r:.015,piso:200000};
const feeOf=p=>Math.max(p*FEE.r,FEE.piso);
function calc(){
 const p=+byId("cPrecio").value, f=feeOf(p);
 byId("cPrecioV").textContent=fmt(p);
 byId("cFee").textContent=fmt(f);
 byId("cPct").textContent=f===FEE.piso&&p*FEE.r<FEE.piso?`Se aplica el mínimo de $ 200 mil (${(f/p*100).toLocaleString("es-AR",{maximumFractionDigits:1})}% de este auto)`:"1,5% del precio de compra";
}

/* ---------- formularios ----------
 Alta en 4 pasos (11/10/2026, noche, pedido de Gonzalo): primero lo mínimo (CUIT, tu nombre, email, contraseña y WhatsApp).
 Con el CUIT nos fijamos si la agencia ya está en Yacar: si no está, "¡Con ese CUIT no hay ninguna agencia en Yacar todavía!"
 y recién ahí pedimos los datos para aprobarla. Después la zona de compra y los avisos. El "¡Listo!" va al final. */
const PASOS=4;
const OPC={
 fiscal:[["ri","Responsable inscripto"],["mono","Monotributo"],["otro","Otro"]],
 habit:[["si","Sí, tengo número H"],["tramite","Está en trámite"],["no","No"]],
 tipos:[["auto","Autos"],["suv","SUV"],["pickup","Pickups"],["util","Utilitarios"]],
 marcas:["Volkswagen","Fiat","Chevrolet","Ford","Toyota","Peugeot","Renault","Citroën","Honda","Nissan","Jeep","Hyundai"],
 km:[["80000","Hasta 80.000"],["120000","Hasta 120.000"],["150000","Hasta 150.000"],["200000","Hasta 200.000"],["0","Sin límite"]],
 precios:[["0","Sin mínimo"],["5000000","$ 5 M"],["10000000","$ 10 M"],["15000000","$ 15 M"],["20000000","$ 20 M"],["30000000","$ 30 M"],["50000000","$ 50 M"]],
 wa:[["resumen","Sí, un resumen por día a las 9 h",""],["no","No, gracias","Entro yo a mirar la subasta."]],
 anios:[["0","Menos de 1 año"],["1","De 1 a 3 años"],["3","De 3 a 10 años"],["10","Más de 10 años"]]
};
const MALOS=new Set();   // campos marcados con error: siguen marcados aunque la pantalla se vuelva a dibujar
const chips=(name,list,isOn,sm)=>`<div class="chips" data-name="${name}">${list.map(([v,l])=>`<button type="button" class="chip${sm?" sm":""}" data-v="${v}" aria-pressed="${isOn(v)}">${l}</button>`).join("")}</div>`;
const field=(id,label,type,val,{hint="",err="",ph="",auto=""}={})=>`<div class="field${MALOS.has(id)?" bad":""}" id="f_${id}"><label for="${id}">${label}</label><input type="${type}" id="${id}" value="${esc(val)}" placeholder="${ph}" ${auto?`autocomplete="${auto}"`:""}>${hint?`<span class="hint">${hint}</span>`:""}<span class="err">${err}</span></div>`;
const digv=d=>{const w=[5,4,3,2,7,6,5,4,3,2];let s=0;for(let i=0;i<10;i++) s+=+d[i]*w[i];let v=11-(s%11);if(v===11)v=0;if(v===10)v=9;return v};
function cuitOk(c){const d=String(c).replace(/\D/g,"");return d.length===11&&digv(d)===+d[10]}
const fmtCuit=c=>{const d=c.replace(/\D/g,"").slice(0,11);return d.length>10?`${d.slice(0,2)}-${d.slice(2,10)}-${d.slice(10)}`:d};
const cuitDe=d10=>`${d10.slice(0,2)}-${d10.slice(2)}-${digv(d10)}`;
const soloDig=c=>String(c||"").replace(/\D/g,"");
const CUIT_DEMO=cuitDe("3071234567"), CUIT_EXISTE=cuitDe("3070845123");
// Solo prototipo: simula la búsqueda del CUIT en Yacar y la consulta al padrón de ARCA (razón social y condición fiscal).
function consultarCUIT(c){
 const d=soloDig(c);
 if(d===soloDig(CUIT_EXISTE)) return {existe:true,agencia:"Autos del Oeste",resp:"Laura G."};
 const emp=["30","33","34"].includes(d.slice(0,2)), demo=d===soloDig(CUIT_DEMO);
 return {existe:false,razon:demo?"TRIUNVIRATO AUTOMOTORES S.R.L.":emp?"SOCIEDAD DE EJEMPLO S.R.L.":(S.resp.trim()||"Titular de ejemplo").toUpperCase(),
  fiscal:emp?"ri":"mono",act:"Venta de autos, camionetas y utilitarios usados"};
}
const fiscalTxt=v=>(OPC.fiscal.find(o=>o[0]===v)||[,"-"])[1];
const baseOptions=()=>`<option value="">Elegí el barrio o partido</option><optgroup label="CABA">${ZONAS.filter(z=>z.t==="b").map(z=>`<option value="${z.id}" ${S.base===z.id?"selected":""}>${z.n}</option>`).join("")}</optgroup><optgroup label="GBA">${ZONAS.filter(z=>z.t==="p").sort((a,b)=>a.n.localeCompare(b.n)).map(z=>`<option value="${z.id}" ${S.base===z.id?"selected":""}>${z.n}</option>`).join("")}</optgroup>`;
// Código postal del local → zona del mapa. Usa la misma tabla que el lado vendedor (buscarCP, global).
const nz=x=>String(x).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace("general ","gral. ").replace("monserrat","montserrat");
const ZNOM=Object.fromEntries(ZONAS.map(z=>[nz(z.n),z.id]));
function cpLocal(txt){
 const r=typeof buscarCP==="function"?buscarCP(txt):{error:true};
 if(r.error) return {error:true};
 if(r.fuera) return {fuera:true,cp:r.cp};
 if(r.desconocido) return {desconocido:true,cp:r.cp};
 if(r.barrios) return {cp:r.cp,ops:r.barrios.map(b=>ZNOM[nz(b)]).filter(Boolean).map(id=>({id,txt:ZBY[id].n+", CABA"}))};
 const id=ZNOM[nz(r.partido)];
 const lugar=(r.localidad&&r.localidad!==r.partido?r.localidad+", ":"")+r.partido;
 if(!id) return {lejos:true,cp:r.cp,txt:lugar};
 return {cp:r.cp,ops:[{id,txt:lugar}]};
}
function cpHTML(){
 const r=S.cpRes, sel=t=>`<div class="field" id="f_base"><label for="base">${t}</label><select id="base">${baseOptions()}</select></div>`;
 const err=!soloDig(S.cpTxt)?"Escribí el código postal del local.":S.cpRes&&!S.base?"Confirmá en qué zona está tu local.":"No reconocemos ese código postal. Revisalo: son 4 números, por ejemplo 1431.";
 let h=`<div class="field${MALOS.has("cp")?" bad":""}" id="f_cp"><label for="cpTxt">Código postal del local</label><input type="text" id="cpTxt" inputmode="numeric" maxlength="8" value="${esc(S.cpTxt)}" placeholder="1431" autocomplete="postal-code" style="max-width:200px"><span class="hint">Son 4 números.</span><span class="err">${err}</span></div>`;
 if(!r&&!S.cpOtro) return h+`<p style="margin:-6px 0 0" data-k="cpnose"><button class="linkbtn" data-cp="nose">No sé el código postal</button></p>`;
 if(S.cpOtro||r?.desconocido) return h+sel(r?.desconocido?"No tenemos ese código postal en el mapa. Elegí el barrio o partido de tu local":"Elegí el barrio o partido de tu local");
 if(r.fuera||r.lejos) return h+`<div class="note warn">Por ahora sumamos agencias de CABA y el conurbano${r.lejos?` (${esc(r.txt)} queda afuera del mapa)`:""}. Si tu local está cerca, elegí la zona más cercana.</div>`+sel("Zona más cercana a tu local");
 if(r.ops.length===1) return h+`<div class="cpq"><p class="flabel">¿Tu local está en ${esc(r.ops[0].txt)}?</p>${chips("cpop",[[r.ops[0].id,"Sí"],["otro","No, es otra zona"]],v=>S.base===v)}</div>`;
 return h+`<div class="cpq"><p class="flabel">¿En qué barrio está tu local?</p>${chips("cpop",[...r.ops.map(o=>[o.id,ZBY[o.id].n]),["otro","Otro barrio"]],v=>S.base===v)}</div>`;
}
function zonasLista(lista){
 const cb=lista.filter(z=>z.t==="b"), gp=lista.filter(z=>z.t==="p");
 const btn=z=>`<button type="button" data-z="${z.id}" title="Sacar ${z.n}">${z.n} ✕</button>`;
 let h="";
 if(gp.length) h+=`<div data-k="zgba"><p class="flabel" style="font-size:15px;margin-bottom:6px">Partidos del GBA</p><div class="zchips">${gp.map(btn).join("")}</div></div>`;
 if(cb.length) h+=`<details class="zdet"><summary>${cb.length===48?"Toda CABA (48 barrios)":cb.length+" barrios de CABA"} · ver o sacar</summary><div class="zchips" style="margin-top:8px">${cb.map(btn).join("")}</div></details>`;
 return h;
}
const datosOk=()=>!!(S.nombre.trim()&&S.dir.trim()&&S.base&&mapsOk()&&S.web.trim()&&S.anios&&S.habit);
// Los datos de la agencia y el local (paso 2 del alta y "Datos de tu agencia" desde Mi agencia).
function datosAgenciaHTML(){
 return `${field("nombre","¿Cómo se llama la agencia?","text",S.nombre,{ph:"Autos del Oeste",err:"Completá el nombre de la agencia.",auto:"organization"})}
  ${field("dir","Dirección del local","text",S.dir,{ph:"Av. Triunvirato 4500",err:"Completá la dirección.",auto:"street-address"})}
  ${cpHTML()}
  ${field("maps","Tu local en Google Maps","url",S.maps,{ph:"https://maps.app.goo.gl/…",hint:"En Google Maps, Compartir y pegá el link.",err:"Pegá el link de tu local en Google Maps."})}
  ${field("web","Página web o Instagram de la agencia","text",S.web,{ph:"www.tuagencia.com.ar o @tuagencia",err:"Completá la web o el Instagram de la agencia."})}
  <div id="f_anios"><p class="flabel">¿Cuántos años lleva la agencia en el rubro?</p>${chips("anios",OPC.anios,v=>S.anios===v)}</div>
  <div id="f_habit"><p class="flabel">¿Son comerciantes habitualistas?</p>${chips("habit",OPC.habit,v=>S.habit===v)}</div>
  ${S.habit==="si"?field("numH","Número H (DNRPA)","text",S.numH,{ph:"H-12345",hint:"Opcional."}):""}
  ${S.errPerf&&(!S.anios||!S.habit)?`<div class="note warn" id="perfErr">Elegí ${!S.anios&&!S.habit?"los años en el rubro y si son habitualistas":!S.anios?"los años en el rubro":"si son habitualistas"}.</div>`:""}`;
}
let vista="inicio", ultimaPantalla="", ordenPantalla=0;
const ORDEN=v=>({ingresar:0,alta:1,estado:10,perfil:11,preferencias:12}[v]||0)+(v==="alta"?S.paso:0);
function renderFlujo(){
 const el=byId("flBody");
 const alta=vista==="alta", n=S.paso;
 byId("flTit").textContent=vista==="ingresar"?"Yacar Agencias":alta?"Sumá tu agencia":vista==="perfil"?"Datos de tu agencia":vista==="preferencias"?"Qué autos buscás":"Tu agencia en Yacar";
 byId("pasoTxt").textContent=alta?`Paso ${n} de ${PASOS}`:"";
 byId("progW").hidden=!alta;
 byId("progBar").style.width=(n/PASOS*100)+"%";
 const nav=(label="Seguir",dis=false,back=true)=>`<div class="navrow">${back?`<button class="back" data-act="back">← Volver</button>`:""}<button class="btn pri" data-act="next" ${dis?"disabled":""}>${label}</button></div>`;
 let h="";
 if(alta&&n===1){
  const ex=S.cuitVerif==="existe"&&S.arca;
  h=`<h2>Sumá tu agencia</h2>
  ${field("cuit","CUIT de la agencia","text",S.cuit,{ph:"30-12345678-9",err:"El CUIT no es válido. Revisá los 11 números.",auto:"off"})}
  ${ex?`<div class="note warn" data-k="existe"><b>Ese CUIT ya tiene una cuenta en Yacar: ${esc(S.arca.agencia)}.</b> Si trabajás ahí, pedile a ${esc(S.arca.resp)} que te sume como usuario, o ingresá con tu email.<div class="noteacts"><button class="btn alt" data-go="ingresar">Ingresar</button><button class="linkbtn" data-act="otrocuit">Es otro CUIT</button></div></div>`:""}
  ${field("resp","Tu nombre","text",S.resp,{err:"Completá tu nombre.",auto:"name"})}
  ${field("email","Tu email de trabajo","email",S.email,{ph:"compras@tuagencia.com.ar",hint:"Con este email entrás a Yacar.",err:"Revisá el email.",auto:"email"})}
  ${field("pass","Creá una contraseña","password",S.pass,{hint:"Al menos 8 caracteres.",err:"La contraseña tiene que tener al menos 8 caracteres.",auto:"new-password"})}
  ${field("cel","Tu WhatsApp","tel",S.cel,{ph:"11 2345 6789",hint:"Por acá te llega la subasta del día.",err:"Revisá el número: 10 dígitos, sin 0 ni 15.",auto:"tel"})}
  <div class="proto protorow"><span class="ptag">Solo prototipo</span><button class="linkbtn" data-demo="alta1">Completar con datos de ejemplo</button><button class="linkbtn" data-demo="alta1existe">Probar con un CUIT que ya está en Yacar</button></div>
  <div class="navrow"><button class="btn pri" data-act="next" ${S.verificando?"disabled":""}>${S.verificando?`<span class="spin" aria-hidden="true"></span>Buscando tu CUIT…`:"Seguir"}</button></div>`;
 }
 if(alta&&n===2){
  const a=S.arca||{};
  h=`<div class="okbanner" data-k="okcuit">${TICKBIG}<div><b>¡Con ese CUIT no hay ninguna agencia en Yacar todavía!</b><span>Unos datos más para aprobarte: 2 minutos.</span></div></div>
  <div class="arca"><div class="arcah"><b>Lo que figura en ARCA</b><span class="ptag">Solo prototipo</span></div>
   <dl><div><dt>CUIT</dt><dd class="num">${esc(S.cuit)}</dd></div><div><dt>Razón social</dt><dd>${esc(a.razon)}</dd></div><div><dt>Condición fiscal</dt><dd>${fiscalTxt(S.fiscal)}</dd></div></dl>
   <small>Si algo no coincide, lo vemos en la llamada.</small></div>
  ${S.fiscal==="mono"?`<div class="note warn">Con monotributo hay topes para comprar autos. Lo charlamos en la verificación.</div>`:""}
  ${datosAgenciaHTML()}
  <div class="proto protorow"><span class="ptag">Solo prototipo</span><button class="linkbtn" data-demo="alta2">Completar con datos de ejemplo</button></div>
  ${nav("Seguir")}`;
 }
 if(alta&&n===3){
  if(S.base&&!S.tocadas) S.zonas=autoZonas(S.base,S.radio);
  const nb=[...S.zonas].filter(id=>ZBY[id].t==="b").length, np=S.zonas.size-nb;
  const lista=[...S.zonas].map(id=>ZBY[id]).sort((a,b)=>a.t===b.t?a.n.localeCompare(b.n):a.t==="b"?-1:1);
  h=`<h2>¿Hasta dónde vas a buscar autos?</h2><p class="sub">Desde ${esc(ZBY[S.base]?.full||"tu local")}. Tocá el mapa para sumar o sacar zonas.</p>
  <div>${chips("radio",[["10","10 km"],["20","20 km"],["30","30 km"],["50","50 km"]],v=>+v===S.radio)}</div>
  <div class="mapwrap" style="padding:10px"><svg class="map" id="altaMap" data-vivo="1" role="group" aria-label="Mapa de zonas: tocá una para sumarla o sacarla"></svg>
   <div class="legend"><span><i class="sq on"></i>En tu zona</span><span><i class="sq"></i>Fuera de tu zona</span><span><i style="background:#123F2C;border-radius:2px"></i>Tu local</span></div>
   <p class="mapnota">Divisiones aproximadas, para ubicarte.</p></div>
  <p class="selsum" aria-live="polite"><b>${nb}</b> barrios de CABA y <b>${np}</b> partidos del GBA ${S.tocadas?"(ajustado a mano)":""}</p>
  ${lista.length?zonasLista(lista):`<div class="note warn">No elegiste ninguna zona. Sumá al menos una para recibir autos.</div>`}
  <label class="check"><input type="checkbox" id="fuera" ${S.fuera?"checked":""}><span>Mostrame también los autos de fuera de mi zona (aparecen aparte).</span></label>
  <div class="proto protorow"><span class="ptag">Solo prototipo</span><button class="linkbtn" data-demo="alta3">Completar con una zona de ejemplo</button></div>
  ${nav("Seguir",S.zonas.size===0)}`;
 }
 if(alta&&n===4){
  h=`<h2>Recibí la subasta del día en tu WhatsApp</h2><p class="sub">La subasta abre a las 10 h y cierra a las 19 h.</p>
  <div class="optlist" data-name="wa">${OPC.wa.map(([v,t,s])=>`<button type="button" class="opt" data-v="${v}" aria-pressed="${S.waModo===v}"><span class="dot"></span><span><b>${t}</b>${s?`<small>${s}</small>`:""}</span></button>`).join("")}</div>
  <label class="check"><input type="checkbox" id="recordatorio" ${S.recordatorio&&S.waModo!=="no"?"checked":""} ${S.waModo==="no"?"disabled":""}><span>Avisame una hora antes del cierre (18 h) si no oferté.</span></label>
  <label class="check"><input type="checkbox" id="mail" ${S.mail?"checked":""}><span>Mandame también el resumen de las 9 h por mail.</span></label>
  <label class="check"><input type="checkbox" id="acepT" ${S.acepT&&S.acepC?"checked":""}><span>Si gano un auto como se declaró, lo compro, y lo que vea en Yacar lo compro por Yacar. Acepto los <a href="#agencias/terminos" target="_blank">términos</a>, las <a href="#agencias/reglas" target="_blank">reglas</a> y la <a href="#agencias/privacidad" target="_blank">privacidad</a>.</span></label>
  <div class="proto protorow"><span class="ptag">Solo prototipo</span><button class="linkbtn" data-demo="alta4">Completar con datos de ejemplo</button></div>
  ${nav("Enviar para aprobar",!(S.acepT&&S.acepC))}`;
 }
 if(vista==="perfil"){
  h=`<h2>Datos de tu agencia</h2><p class="sub">CUIT ${esc(S.cuit)}${S.arca?.razon?" · "+esc(S.arca.razon):""} · ${fiscalTxt(S.fiscal)}. Si cambió el CUIT, escribinos.</p>
  ${datosAgenciaHTML()}
  <div class="proto protorow"><span class="ptag">Solo prototipo</span><button class="linkbtn" data-demo="perfil">Completar con datos de ejemplo</button></div>
  ${nav("Guardar")}`;
 }
 if(vista==="preferencias"){
  const yrs=[];for(let y=2026;y>=2005;y--) yrs.push(y);
  h=`<h2>Qué autos buscás</h2><p class="sub">Filtramos la subasta y los avisos con esto. Lo podés cambiar cuando quieras.</p>
  <div><p class="flabel">Tipo</p>${chips("tipos",OPC.tipos,v=>S.tipos.has(v))}</div>
  <div><p class="flabel">Marcas <span style="font-weight:400;color:var(--muted)">(sin elegir = todas)</span></p>${chips("marcas",OPC.marcas.map(m=>[m,m]),v=>S.marcas.has(v),true)}</div>
  <div class="row2">
   <div class="field"><label for="anioD">Año desde</label><select id="anioD">${yrs.map(y=>`<option ${y===S.anioD?"selected":""}>${y}</option>`).join("")}</select></div>
   <div class="field"><label for="anioH">Año hasta</label><select id="anioH">${yrs.map(y=>`<option ${y===S.anioH?"selected":""}>${y}</option>`).join("")}</select></div>
  </div>
  <div><p class="flabel">Kilómetros</p>${chips("km",OPC.km,v=>S.kmMax===v,true)}</div>
  <div class="row2">
   <div class="field"><label for="pD">Precio desde</label><select id="pD">${OPC.precios.map(([v,l])=>`<option value="${v}" ${S.pD===v?"selected":""}>${l}</option>`).join("")}</select></div>
   <div class="field"><label for="pH">Precio hasta</label><select id="pH">${OPC.precios.map(([v,l])=>`<option value="${v}" ${S.pH===v?"selected":""}>${v==="0"?"Sin máximo":l}</option>`).join("")}</select></div>
  </div>
  ${S.anioD>S.anioH?`<div class="note warn">El año "desde" es mayor que el "hasta".</div>`:""}
  <div class="proto protorow"><span class="ptag">Solo prototipo</span><button class="linkbtn" data-demo="preferencias">Completar con datos de ejemplo</button></div>
  ${nav("Guardar",S.tipos.size===0||S.anioD>S.anioH)}`;
 }
 if(vista==="ingresar"){
  h=`<span class="kicker">Solo para agencias</span><h2>Ingresá a Yacar Agencias</h2>
  <p class="sub">La subasta la ven solo las agencias aprobadas.</p>
  ${field("ingEmail","Email","email",S.ingEmail,{ph:"compras@tuagencia.com.ar",auto:"email"})}
  ${field("ingPass","Contraseña","password",S.ingPass,{auto:"current-password",err:"Revisá el email y la contraseña."})}
  ${S.altaEnviada?`<div class="note ok"><b>¡Listo! Te mandamos un mail a ${esc(S.email)}.</b> Tocá el link para confirmar tu cuenta. Revisamos tu agencia en hasta 48 h hábiles y te avisamos.</div>`:""}
  ${S.errCuenta?`<p class="err" role="alert">${esc(S.errCuenta)}</p>`:""}
  <button class="btn pri block" data-act="login" ${S.cargando?"disabled":""}>${S.cargando?"Ingresando…":"Ingresar"}</button>
  ${S.linkEnviado?`<div class="note ok" data-k="link"><b>Te mandamos un link a ${esc(S.ingEmail)}.</b> Abrilo desde este celular o compu y entrás sin contraseña. Vence en 1 hora.${window.YacarCuenta?.real?"":`<div class="noteacts"><span class="ptag">Solo prototipo</span><button class="linkbtn" data-act="abrirlink">Abrir el link del mail</button></div>`}</div>`
   :sinMails()?"":`<button class="btn alt block" data-act="maillink">Entrar sin contraseña: mandame un link al mail</button>`}
  <p style="margin-top:-6px;font-size:14px;color:var(--muted)">${sinMails()?"¿Te olvidaste la contraseña? Escribinos y te ayudamos a entrar.":"¿Te olvidaste la contraseña? Con el link entrás igual y la cambiás desde Mi agencia."}</p>
  <hr class="acc-sep">
  <div class="acc-alt"><h3>¿Tu agencia todavía no está en Yacar?</h3><p class="sub" style="margin-top:0">Lleva unos minutos. La aprobamos en hasta 48 h hábiles.</p>
  <button class="btn alt block" data-go="alta">Sumar mi agencia</button></div>
  <p style="font-size:15px;color:var(--muted)">¿Querés vender tu auto? <a href="#vender">Entrá acá</a>.</p>
  <div class="proto protorow"><span class="ptag">Solo prototipo</span><button class="linkbtn" data-demo="ingresar">Completar con una agencia de ejemplo</button></div>`;
 }
 if(vista==="estado") h=estadoHTML();
 // Pantalla nueva: entra deslizándose. Misma pantalla: se actualiza solo lo que cambió (Suave.poner).
 const clave=vista+(alta?n:""), html=`<div class="screen" data-k="${clave}">${h}</div>`;
 if(clave!==ultimaPantalla){
  const orden=ORDEN(vista), dir=!ultimaPantalla?"fade":orden>=ordenPantalla?"fwd":"back";
  el.innerHTML=html; Suave.entrar(el.firstElementChild,dir);
  ultimaPantalla=clave; ordenPantalla=orden;
 } else Suave.poner(el,html);
 const map=byId("altaMap");
 if(map) drawMap(map,{baseId:S.base,radio:S.radio,sel:S.zonas,zoom:true,onToggle:id=>{S.tocadas=true;S.zonas.has(id)?S.zonas.delete(id):S.zonas.add(id);repintar()}});
 const wa=byId("waAlta"); if(wa&&!wa.firstChild) waMsgs(wa);
}
function estadoHTML(){
 const st=S.estado;
 const tr=`<div class="tracker" aria-label="Estado de la agencia"><div class="s ${st==="sin"?"on":"done"}"><i></i>Sin revisión</div><div class="s ${st==="rev"?"on":st==="ok"?"done":""}"><i></i>En revisión</div><div class="s ${st==="ok"?"done on":""}"><i></i>Aprobada</div></div>`;
 if(st==="sin") return `<span class="badge none">Sin revisión</span><h2>Todavía no sumaste tu agencia</h2><p class="sub">Lleva unos minutos.</p>${tr}<button class="btn pri block" data-go="alta">Sumar mi agencia</button>`;
 const base=ZBY[S.base], nb=[...S.zonas].filter(id=>ZBY[id].t==="b").length, np=S.zonas.size-nb;
 const ok=`<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 10.3l3.2 3.2L15.5 6" stroke="#1C7444" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
 const pend=`<svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="4" fill="#8A5300"/></svg>`;
 const item=(hecho,t,d,act)=>`<li><span class="ic" style="${hecho?"background:var(--ok-soft)":"background:var(--warn-soft)"}">${hecho?ok:pend}</span><div><b>${t}</b><small>${d}</small></div>${act?`<span class="act">${act}</span>`:""}</li>`;
 const pOk=perfilOk();
 const marcas=S.marcas.size?[...S.marcas].join(", "):"todas las marcas";
 const nom=esc(S.resp.trim().split(" ")[0]);
 return (st==="rev"
  ?`<span class="badge rev">En revisión</span><h2>¡Listo${nom?", "+nom:""}! Recibimos los datos de ${esc(S.nombre)||"tu agencia"}</h2><p class="sub">${pOk?`La revisamos y te escribimos al ${esc(S.cel)} para una charla corta. Te aprobamos en hasta 48 h hábiles.`:"Para aprobarte, completá los datos de tu agencia."}</p>`
  :`<span class="badge ok">Aprobada</span><h2>¡${esc(S.nombre)} ya puede ofertar!</h2><p class="sub">Desde mañana te llegan los autos de tu zona a las 9 h.</p>`)
 +tr
 +`<ul class="vlist">
   ${item(cuitOk(S.cuit)&&S.cuitVerif==="nuevo","Cuenta y CUIT",`${esc(S.cuit)}${S.arca?.razon?" · "+esc(S.arca.razon):""} · ${esc(S.email)}`)}
   ${item(pOk,"Datos de la agencia",pOk?`${esc(S.dir)}${S.cpRes?.cp?", CP "+S.cpRes.cp:""} · Google Maps, web y años en el rubro`:"Dirección, Google Maps, web o Instagram y años en el rubro.",pOk?`<button class="linkbtn" data-go="perfil">Editar</button>`:`<button class="btn pri" style="padding:8px 14px;font-size:15px" data-go="perfil">Completar</button>`)}
   ${item(st==="ok","Charla con nosotros",st==="ok"?"Hecha.":"Te escribimos por WhatsApp.")}
   ${item(S.prefsOk,"Qué autos buscás (opcional)",S.prefsOk?`${[...S.tipos].map(t=>OPC.tipos.find(o=>o[0]===t)[1]).join(", ")} · ${marcas} · ${S.anioD}–${S.anioH}`:"Para recibir solo lo que te interesa.",`<button class="linkbtn" data-go="preferencias">${S.prefsOk?"Editar":"Elegir"}</button>`)}
  </ul>`
 +(st==="rev"?`<div class="proto"><span class="ptag">Solo prototipo</span> En el piloto la revisión es manual. ${pOk?`<button class="linkbtn" id="aprobar">Simular: aprobar la agencia</button>`:"Para simular la aprobación, completá primero los datos."}</div>`:"")
 +`<div class="box"><h4>Tu cuenta</h4><ul>
   <li><span><b>Zona:</b> desde ${base?base.full:"-"}${S.cpRes?.cp?" (CP "+S.cpRes.cp+")":""}, ${nb} barrios de CABA y ${np} partidos · <button class="linkbtn" data-go="alta" data-p="3">Editar</button></span></li>
   <li><span><b>Avisos:</b> ${OPC.wa.find(o=>o[0]===S.waModo)[1]}${S.recordatorio&&S.waModo!=="no"?" + recordatorio 18 h":""}${S.mail?" + mail":""} · <button class="linkbtn" data-go="alta" data-p="4">Editar</button></span></li>
   <li><span><b>Fee:</b> 1,5% del precio de compra, mínimo $200 mil · 0 compras este mes</span></li>
  </ul></div>`
 +(st==="ok"?`<a class="btn pri block" href="#agencias/ficha">Ver la subasta de hoy</a><div class="proto"><span class="ptag">Solo prototipo</span> Por ahora la subasta muestra un auto de ejemplo. El portal completo (ofertar, mis ofertas, ganados) se arma después: PROPUESTA_AGENCIAS_Y_SUBASTA.md, pantallas 2 a 8.</div>`:"");
}
// Eventos del flujo: se escuchan una sola vez en el contenedor (la pantalla se actualiza sin reemplazarse entera).
function initFlujo(){
 const el=byId("flBody");
 el.addEventListener("click",e=>{
  const t=e.target;
  const c=t.closest(".chips .chip");
  if(c){
   const name=c.parentElement.dataset.name, v=c.dataset.v;
   if(["fiscal","habit","km","anios"].includes(name)) S[name==="km"?"kmMax":name]=v;
   else if(name==="cpop"){ if(v==="otro"){S.cpOtro=true;S.base=""} else {S.base=v;S.tocadas=false;MALOS.delete("cp")} }
   else if(name==="radio"){S.radio=+v;S.tocadas=false}
   else {const set=S[name];set.has(v)?set.delete(v):set.add(v)}
   repintar(); return;
  }
  const o=t.closest(".optlist .opt"); if(o){S.waModo=o.dataset.v;repintar();return}
  const z=t.closest(".zchips button"); if(z){S.tocadas=true;S.zonas.delete(z.dataset.z);repintar();return}
  if(t.closest('[data-cp="nose"]')){S.cpOtro=true;repintar();byId("base")?.focus();return}
  if(t.closest("#aprobar")){S.estado="ok";repintar();window.scrollTo({top:0,behavior:Suave.sinMov()?"auto":"smooth"});return}
  const d=t.closest("[data-demo]"); if(d){ejemplo(d.dataset.demo);repintar();return}
  const a=t.closest("[data-act]");
  if(a){
   const act=a.dataset.act;
   if(act==="back"){ if(vista==="alta"&&S.paso>1){S.paso--;go("alta")} else go(S.estado==="sin"?"inicio":"estado") }
   else if(act==="next") siguiente();
   else if(act==="login") ingresar();
   else if(act==="maillink"){ if(!emailOk(S.ingEmail)){MALOS.add("ingEmail");byId("f_ingEmail")?.classList.add("bad");return}
    if(window.YacarCuenta?.real){ S.errCuenta=""; YacarCuenta.link(S.ingEmail.trim()).then(()=>{S.linkEnviado=true;repintar()}).catch(e=>{S.errCuenta=YacarCuenta.msj(e);repintar()}); return; }
    S.linkEnviado=true; repintar(); }
   else if(act==="abrirlink"){ S.ingPass=S.ingPass||"link-del-mail"; ingresar(); }
   else if(act==="otrocuit"){S.cuit="";S.cuitVerif="";S.arca=null;repintar();byId("cuit")?.focus()}
  }
 });
 el.addEventListener("input",e=>{
  const i=e.target, k=i.id;
  if(k==="cpTxt"){
   S.cpTxt=i.value; const d=soloDig(i.value), antes=JSON.stringify(S.cpRes);
   S.cpRes=d.length>=4?cpLocal(i.value):null;
   if(S.cpRes?.error){MALOS.add("cp");S.cpRes=null} else MALOS.delete("cp");
   byId("f_cp")?.classList.toggle("bad",MALOS.has("cp"));
   if(JSON.stringify(S.cpRes)!==antes){S.base="";S.cpOtro=false;S.tocadas=false;repintar()}
   return;
  }
  if(!["nombre","resp","cel","numH","dir","email","maps","cuit","pass","web","ingEmail","ingPass"].includes(k)) return;
  if(k==="cuit"){const f=fmtCuit(i.value);if(f!==i.value) i.value=f}
  S[k]=i.value; MALOS.delete(k); byId("f_"+k)?.classList.remove("bad");
  if(k==="ingEmail"){MALOS.delete("ingPass");byId("f_ingPass")?.classList.remove("bad")}
  if(k==="cuit"&&S.cuitVerif){S.cuitVerif="";S.arca=null;repintar()}
 });
 el.addEventListener("change",e=>{
  const t=e.target, k=t.id;
  if(k==="base"){S.base=t.value;S.tocadas=false;MALOS.delete("cp");repintar()}
  else if(k==="anioD"||k==="anioH"){S[k]=+t.value;repintar()}
  else if(k==="pD"||k==="pH") S[k]=t.value;
  else if(["fuera","recordatorio","mail","acepT","acepC"].includes(k)){S[k]=t.checked;if(k==="acepT") S.acepC=t.checked;if(k.startsWith("acep")) repintar()}   // 18/10: un solo tilde para términos y compromiso de compra
 });
 el.addEventListener("keydown",e=>{
  if(e.key!=="Enter") return;
  if(["ingEmail","ingPass"].includes(e.target.id)) ingresar();
  else if(vista==="alta"&&S.paso===1&&e.target.matches("input")) siguiente();
 });
}
function ingresar(){
 if(!emailOk(S.ingEmail)||S.ingPass.length<4){MALOS.add("ingPass");byId("f_ingPass")?.classList.add("bad");return}
 // Web publicada: login real con Supabase (cuenta.js).
 if(window.YacarCuenta?.real){
  S.errCuenta=""; S.cargando=true; repintar();
  YacarCuenta.ingresar(S.ingEmail.trim(),S.ingPass).then(()=>{S.cargando=false;go(aprobada()?"subasta":"estado")}).catch(e=>{S.cargando=false;S.errCuenta=YacarCuenta.msj(e);repintar()});
  return;
 }
 // Prototipo: cualquier email y contraseña sirven; entra como una agencia ya aprobada.
 if(!S.email) S.email=S.ingEmail.trim();
 if(S.estado==="sin"){demo(true);S.estado="ok";S.prefsOk=true}
 S.sesion=true; go(aprobada()?"subasta":"inicio");
}
// "Completar con datos de ejemplo" en cada pantalla (solo prototipo)
function ejemplo(p){
 if(p==="ingresar"){S.ingEmail="compras@autostriunvirato.com.ar";S.ingPass="yacar2026";return}
 if(p==="alta1"||p==="alta1existe"){
  Object.assign(S,{resp:S.resp||"Martín López",email:emailOk(S.email)?S.email:"compras@autostriunvirato.com.ar",pass:S.pass.length>=8?S.pass:"yacar2026",cel:celOk()?S.cel:"11 5432 1098",
   cuit:p==="alta1"?CUIT_DEMO:CUIT_EXISTE,cuitVerif:"",arca:null});
  ["cuit","resp","email","pass","cel"].forEach(k=>MALOS.delete(k));
 }
 if(p==="alta2"||p==="perfil"){
  Object.assign(S,{nombre:S.nombre||"Autos Triunvirato",dir:S.dir||"Av. Triunvirato 4500",maps:mapsOk()?S.maps:"https://maps.app.goo.gl/ejemplo",
   web:S.web||"www.autostriunvirato.com.ar",anios:S.anios||"10",habit:S.habit||"si",numH:S.numH||"H-20145",errPerf:false});
  if(!S.base){S.cpTxt="1431";S.cpRes=cpLocal("1431");S.cpOtro=false;S.base=S.cpRes.ops?.[0]?.id||"vurquiza";S.tocadas=false}
  ["nombre","dir","maps","web","cp"].forEach(k=>MALOS.delete(k));
 }
 if(p==="alta3"){S.radio=20;S.tocadas=false;S.zonas=autoZonas(S.base,S.radio)}
 if(p==="alta4") Object.assign(S,{waModo:"resumen",recordatorio:true,acepT:true,acepC:true});
 if(p==="preferencias") Object.assign(S,{tipos:new Set(["auto","suv"]),marcas:new Set(["Volkswagen","Fiat","Toyota","Peugeot"]),anioD:2014,anioH:2026,kmMax:"150000",pD:"5000000",pH:"30000000"});
}
function repintar(){const y=window.scrollY;renderFlujo();window.scrollTo(0,y)}
function bad(id,cond){if(cond) MALOS.add(id); else MALOS.delete(id);byId("f_"+id)?.classList.toggle("bad",cond);return cond}
function validarDatos(){
 const e=[bad("nombre",!S.nombre.trim()),bad("dir",!S.dir.trim()),bad("cp",!S.base),bad("maps",!mapsOk()),bad("web",!S.web.trim())].some(Boolean);
 S.errPerf=!S.anios||!S.habit;
 if(e||S.errPerf){
  repintar();
  const p=byId("flBody").querySelector(".field.bad, #perfErr");
  if(p) p.scrollIntoView({block:"center",behavior:Suave.sinMov()?"auto":"smooth"});
  return false;
 }
 if(!S.tocadas) S.zonas=autoZonas(S.base,S.radio);
 return true;
}
let verifTk=0;
function siguiente(){
 if(vista==="alta"){
  const n=S.paso;
  if(n===1){
   if([bad("cuit",!cuitOk(S.cuit)),bad("resp",!S.resp.trim()),bad("email",!emailOk(S.email)),bad("pass",S.pass.length<8),bad("cel",!celOk())].some(Boolean)) return;
   if(S.verificando) return;
   if(S.cuitVerif==="nuevo"){S.paso=2;go("alta");return}
   // Buscamos el CUIT (simulado): si no hay ninguna agencia con ese CUIT, seguimos con los datos para aprobarla.
   S.verificando=true; S.cuitVerif=""; S.arca=null; repintar();
   const tk=++verifTk;
   setTimeout(()=>{
    if(tk!==verifTk||vista!=="alta") return;
    const r=consultarCUIT(S.cuit); S.verificando=false; S.arca=r;
    if(r.existe){S.cuitVerif="existe";repintar();return}
    S.cuitVerif="nuevo"; S.fiscal=r.fiscal; S.paso=2; go("alta");
   },Suave.sinMov()?300:1300);
   return;
  }
  if(n===2){ if(!validarDatos()) return; S.paso=3; go("alta"); return; }
  if(n===3){ if(!S.zonas.size) return; S.paso=4; go("alta"); return; }
  if(window.YacarCuenta?.real){
   S.errCuenta=""; S.cargando=true; repintar();
   YacarCuenta.alta().then(r=>{S.cargando=false;S.estado="rev";if(r.confirmar){S.altaEnviada=true;S.ingEmail=S.email;go("ingresar")}else{S.sesion=true;go("estado")}})
    .catch(e=>{S.cargando=false;S.errCuenta=YacarCuenta.msj(e);repintar()});
   return;
  }
  if(S.estado==="sin") S.estado="rev"; S.sesion=true; go("estado"); return;
 }
 if(vista==="perfil"){ if(!validarDatos()) return; YacarCuenta?.real&&YacarCuenta.guardar(); go("estado"); return; }
 if(vista==="preferencias"){S.prefsOk=true;YacarCuenta?.real&&YacarCuenta.guardar();go("estado")}
}

/* ---------- legales ---------- */
const BORR=(t,x)=>`<h1>${t}</h1><p class="upd">Borrador del 11/10/2026</p><div class="proto" style="margin-top:14px"><span class="ptag">Borrador</span> ${x}</div>`;
const LEGAL={
terminos:BORR("Términos para agencias","Lo tiene que revisar un abogado antes de publicarse (LEG-03). Montos y plazos a validar.")+`
<h2>1. Qué es Yacar</h2><p>Yacar es una plataforma que conecta a particulares que quieren vender su auto con agencias de usados. Yacar no compra ni vende autos y no maneja el dinero de la operación: la compraventa es entre la agencia y el vendedor.</p>
<h2>2. Alta y verificación</h2><p>Para ofertar, la agencia tiene que darse de alta y ser aprobada. Una persona de Yacar revisa cada alta: CUIT y condición fiscal, el local y su ficha de Google Maps con reseñas, la página web o las redes, los años en el rubro, el responsable de compras y, si corresponde, la inscripción como comerciante habitualista. Hasta que la aprobamos, la agencia no ve la subasta ni las fichas de los autos. Podemos rechazar o suspender una agencia si la información no es correcta.</p>
<h2>3. Ofertas</h2><p>Cada oferta es un compromiso de compra. Si la agencia gana y el auto está como se declaró, tiene que comprarlo al precio que resulte de la subasta.</p>
<h2>4. Fee</h2><p>La agencia que gana paga un fee para recibir el contacto del vendedor: 1,5% del precio de compra, con un mínimo de $200.000 por auto. El fee se paga por Mercado Pago y se factura.</p>
<h2>5. Devolución del fee</h2><ul><li>Se devuelve si el auto tenía algo importante que no estaba declarado y no se llega a un acuerdo.</li><li>Se devuelve si el vendedor se echa atrás.</li><li>No se devuelve si la agencia decide no comprar un auto que está como se declaró.</li></ul>
<h2>6. Visita y ajustes</h2><p>La visita se hace dentro de las 48 h. Solo se puede proponer un ajuste por algo no declarado, con fotos. Yacar lo revisa y el vendedor puede aceptarlo o no.</p>
<h2>7. Compras por fuera</h2><p>Los autos que la agencia ve en Yacar se compran por Yacar. Si la agencia compra por fuera un auto que vio en la plataforma dentro de los 90 días, paga el fee y una penalidad.</p>
<h2>8. Transferencia</h2><p>La agencia se compromete a transferir el auto a su nombre o a que el vendedor haga la denuncia de venta el mismo día de la entrega.</p>
<h2>9. Datos del vendedor</h2><p>La agencia usa los datos del vendedor solo para esa operación y no los comparte.</p>
<h2>10. Suspensión</h2><p>Con dos avisos (por ejemplo, no comprar un auto ganado sin motivo o ajustes rechazados por no estar justificados), la cuenta se suspende.</p>
<h2>11. Cambios</h2><p>Si cambiamos estos términos, avisamos por mail y WhatsApp con 15 días de anticipación.</p>`,
reglas:BORR("Reglas de la subasta","Reglas en discusión (SUB-01). Ver PROPUESTA_AGENCIAS_Y_SUBASTA.md.")+`
<h2>Horario</h2><p>Hay una subasta por día. A las 9 h te llega el resumen con los autos del día; la subasta abre a las 10 h y cierra a las 19 h. Entran los autos que aprobamos hasta las 8 h de ese día; los que aprobamos después salen en la subasta del día siguiente.</p>
<h2>Qué ves</h2><p>La ficha del auto (las 10 fotos, más el motor si el vendedor la sacó, con la patente tapada), la zona y la distancia aproximada, el mínimo del vendedor y la cantidad de ofertas. No ves los montos de las otras agencias. La patente, la dirección y el contacto del vendedor te llegan cuando ganás y pagás el fee.</p>
<h2>Cómo se oferta</h2><ul><li>Ponés el máximo que pagarías. La oferta más baja permitida es el piso del rango del auto.</li><li>Si ganás, pagás $50.000 más que la segunda oferta, o el mínimo del vendedor si sos la única que lo supera. Nunca más que tu máximo.</li><li>Podés cancelar tu oferta mientras la subasta está abierta.</li><li>Si hay empate, gana la oferta más temprana.</li></ul>
<h2>Al cierre</h2><ul><li>Si la mejor oferta llega al mínimo del vendedor, el auto se vende sin volver a preguntarle.</li><li>Si queda por debajo, el vendedor tiene 24 h para aceptarla.</li><li>La agencia que gana paga el fee y recibe el contacto del vendedor.</li></ul>
<h2>La visita</h2><ul><li>Se coordina dentro de las 48 h.</li><li>Si el auto está como se declaró, la compra se hace al precio de la subasta.</li><li>Solo se puede proponer un ajuste por algo no declarado, con fotos. Lo revisamos y el vendedor decide.</li></ul>`,
privacidad:BORR("Política de privacidad","Texto final con abogado (LEG-04). Evaluar inscripción de la base en la AAIP (Ley 25.326).")+`
<h2>Qué datos pedimos a las agencias</h2><p>Nombre de la agencia, datos del responsable de compras (nombre, email y celular), CUIT, condición fiscal, dirección y código postal del local, ficha de Google Maps, página web o redes, años en el rubro, zona y preferencias de compra.</p>
<h2>Para qué los usamos</h2><p>Para verificar la agencia, mostrarle autos de su zona, mandarle avisos, cobrar el fee y facturar.</p>
<h2>Qué ve el vendedor</h2><p>El nombre de la agencia que ganó y el contacto del responsable, para coordinar la visita.</p>
<h2>Datos de los vendedores</h2><p>Antes de ganar, la agencia ve solo la zona del auto. Nombre, teléfono y dirección se comparten recién después de pagar el fee y solo para esa operación.</p>
<h2>Tus derechos</h2><p>Podés pedir ver, corregir o borrar tus datos escribiéndonos por WhatsApp o mail.</p>`
};

/* ---------- navegación ---------- */
const FLUJO=["ingresar","alta","estado","perfil","preferencias"], LEGALES=["terminos","reglas","privacidad"];
const PUBLICAS=["inicio","ingresar","alta","subasta","auto",...LEGALES];   // 18/10 noche: la subasta se ve sin ingresar, con los datos difuminados
const SUB=["subasta","auto","ofertas"];   // 18/10: portal de subasta (src/agencias/subasta.js). Sin aprobar se ve como vitrina; Mis ofertas, solo aprobadas
function maxPaso(){ if(!(cuitOk(S.cuit)&&S.resp.trim()&&emailOk(S.email)&&S.pass.length>=8&&celOk()&&S.cuitVerif==="nuevo")) return 1; if(!datosOk()) return 2; if(!S.zonas.size) return 3; return 4; }
function go(v,p){
 if(v==="alta"){ if(p) S.paso=p; }
 const h="#agencias"+(v==="inicio"?"":"/"+v+(v==="alta"?"/"+S.paso:""));
 if(location.hash===h) route(); else location.hash=h;
}
function route(){
 const parts=location.hash.replace(/^#agencias\/?/,"").split("/");
 let v=parts[0]||"inicio", seccion=null;
 if(!FLUJO.includes(v)&&!LEGALES.includes(v)&&!SUB.includes(v)){ seccion=v!=="inicio"?v:null; v="inicio"; }
 if(v==="alta"){ const p=+parts[1]; if(p>=1&&p<=PASOS) S.paso=Math.min(p,maxPaso()); else S.paso=Math.min(S.paso,maxPaso()); }
 if(v==="estado"||v==="perfil"||v==="preferencias"){ if(S.estado==="sin"&&v!=="estado") v="estado"; }
 // Sin ingresar se ve la landing sin subastas, Ingresar, el alta y los textos legales.
 if(!S.sesion&&!PUBLICAS.includes(v)){ v="ingresar"; seccion=null; history.replaceState(null,"","#agencias/ingresar"); }
 if(S.sesion&&v==="ingresar") v=aprobada()?"subasta":"inicio";
 if(v==="ofertas"&&S.sesion&&!aprobada()){ v="estado"; history.replaceState(null,"","#agencias/estado"); }
 // La subasta (ficha) solo la ve una agencia aprobada; al resto la mandamos a las operaciones cerradas.
 if(seccion==="ficha"&&!aprobada()) seccion="operaciones";
 if(seccion==="operaciones"&&aprobada()) seccion="ficha";
 $$(".solo-in").forEach(e=>e.hidden=!S.sesion); $$(".solo-out").forEach(e=>e.hidden=S.sesion);
 const prev=vista; vista=v;
 const vistaDe=x=>x==="inicio"?"vInicio":FLUJO.includes(x)?"vFlujo":SUB.includes(x)?"vSubasta":"vLegal";
 byId("vInicio").hidden=v!=="inicio"; byId("vFlujo").hidden=!FLUJO.includes(v); byId("vLegal").hidden=!LEGALES.includes(v); byId("vSubasta").hidden=!SUB.includes(v); byId("wrapAg")?.classList.toggle("sub",SUB.includes(v)); byId("wrapAg")?.classList.toggle("subauto",v==="auto");
 $$(".solo-ok").forEach(e=>e.hidden=!aprobada());
 $$(".site nav [data-nav]").forEach(a=>a.classList.toggle("on",a.dataset.nav===v||(v==="auto"&&a.dataset.nav==="subasta")||(a.dataset.nav==="estado"&&["estado","perfil","preferencias"].includes(v))));
 if(vistaDe(prev)!==vistaDe(v)&&v==="inicio") Suave.entrar(byId("vInicio"),"fade");
 if(LEGALES.includes(v)&&prev!==v) Suave.entrar(byId("vLegal"),"fade");
 if(SUB.includes(v)){ if(window.YacarSubasta) YacarSubasta.render(v,parts.slice(1),prev); }
 if(!FLUJO.includes(v)) ultimaPantalla="";
 $$(".sec-link").forEach(a=>a.hidden=v!=="inicio");
 byId("wrapAg").classList.toggle("lp",v==="inicio");
 if(FLUJO.includes(v)) renderFlujo();
 if(LEGALES.includes(v)) byId("legalBody").innerHTML=LEGAL[v]+`<p style="margin-top:28px"><a href="#agencias">← Volver al inicio</a></p>`;
 if(SUB.includes(v)){}
 else if(v==="inicio"){ renderLanding(); landMap(); fichaMapa(); waMsgs(byId("waLanding"));
  if(seccion){ const t=byId(seccion); if(t) setTimeout(()=>t.scrollIntoView({behavior:"smooth"}),0); }
  else if(prev!=="inicio"||!document.body.dataset.agVisto) window.scrollTo(0,0);
 } else window.scrollTo(0,0);
 document.body.dataset.agVisto="1";
 notasPanel();
}
R.addEventListener("click",e=>{
 const a=e.target.closest("[data-go]");
 if(!a) return;
 e.preventDefault();
 let v=a.dataset.go;
 if(v==="alta"&&S.estado!=="sin"&&!a.dataset.p) v="estado";
 go(v,a.dataset.p?+a.dataset.p:undefined);
});

/* ---------- reloj ---------- */
function tick(){
 const el=byId("clock1"); if(!el) return;
 const now=new Date(), h=now.getHours();
 if(h<10){el.textContent="Abre a las 10 h";return}
 if(h>=19){el.textContent="Cerró · mañana abre a las 10 h";return}
 const t=new Date(now);t.setHours(19,0,0,0);
 const s=Math.floor((t-now)/1000), hh=String(Math.floor(s/3600)).padStart(2,"0"), mm=String(Math.floor(s%3600/60)).padStart(2,"0"), ss=String(s%60).padStart(2,"0");
 el.textContent=`Cierra en ${hh}:${mm}:${ss}`;
}

/* ---------- notas del prototipo ---------- */
const NOTAS={
 subasta:{a:["Portal de subasta (18/10): Subasta de hoy, página de cada auto y Mis ofertas, solo para agencias aprobadas. Estructura inspirada en las subastas en vivo de Motordil.","Subasta ciega con oferta máxima: la agencia ve cuántas ofertas hay, si va ganando y si se llegó al mínimo, nunca los montos de las demás. Las últimas pujas se muestran sin montos.","Si gana, paga $50.000 más que la segunda (o el mínimo del vendedor), nunca más que su máximo. Si no llega al mínimo, el vendedor tiene 24 h para aceptar (D-47).","El fee (1,5%, mínimo $200 mil) se paga recién al ganar, con Mercado Pago (simulado). Al pagarlo se libera el contacto y la patente.","Los avisos (nueva subasta, te superaron, queda 1 hora, ganaste) se muestran como el WhatsApp que mandaría el bot.","Fuera del horario de 10 a 19 h, el prototipo simula que la subasta está abierta y cierra en 2 h 15 min."],v:["¿La subasta ciega con 'vas ganando / te superaron' alcanza, o quieren ver montos?","¿El Yacar Score les sirve para elegir qué mirar?","¿Qué les falta en la página del auto para ofertar sin ir a verlo?","¿Los avisos por WhatsApp son demasiados o pocos?"]},
 inicio:{a:["Landing pública (11/10): la ve cualquiera, pero sin subastas, fichas ni mínimos de vendedores. En su lugar, operaciones cerradas de ejemplo.","La subasta de hoy y la ficha del auto aparecen solo con la sesión de una agencia aprobada.","Una subasta por día: resumen por WhatsApp a las 9 h, abre a las 10 h y cierra a las 19 h (11/10).","Fee: 1,5% del precio de compra con mínimo de $200 mil (11/10, puede cambiar).","Ficha: las mismas 14 fotos que se le piden al vendedor, en el mismo orden; patente tapada.","Zona del auto como área + distancia en franjas de 5 km; nunca un punto.","La barra de arriba queda fija al bajar; el logo vuelve al inicio.","16/10 (D-44): debajo de la ficha, de ejemplo, la ficha para la transferencia que le llega a la agencia que gana: quién firma y dónde, certificado de dominio pedido por el vendedor, título, prenda, verificación, grabado, deuda y multas del día con constancias. Sin DNI ni domicilio del vendedor (D-38)."],v:["¿La ficha para la transferencia tiene lo que necesitan para la firma? ¿Falta algo?","¿Las operaciones cerradas convencen sin ver la subasta?","¿1,5% con mínimo de $200 mil les parece justo?","¿El resumen de las 9 h les alcanza o quieren avisos durante el día?","¿Se entiende la subasta ciega con proxy en una línea?","¿Les interesa Yacar Gestión? ¿Cuánto pagarían?"]},
 alta:{a:["Paso 1, lo mínimo (11/10, noche): CUIT, tu nombre, email, contraseña y WhatsApp. Con el CUIT nos fijamos si la agencia ya está en Yacar.","Si el CUIT es nuevo: «¡Con ese CUIT no hay ninguna agencia en Yacar todavía!» y traemos de ARCA la razón social y la condición fiscal (simulado: no hace falta preguntarla). Si ya existe, se ofrece ingresar o pedir acceso a quien la sumó.","Paso 2: lo necesario para aprobarla: nombre de la agencia, dirección y código postal del local, Google Maps, web o Instagram, años en el rubro y si son habitualistas.","Paso 3: zona de compra con el radio desde el local. El mapa se acerca con el radio chico y se aleja con el grande; las divisiones son aproximadas.","Paso 4: resumen diario por WhatsApp a las 9 h, recordatorio a las 18 h y términos. Recién al enviar: «¡Listo!»."],v:["¿Consultamos ARCA de verdad (padrón, requiere certificado) o alcanza con validar el CUIT y revisarlo a mano?","¿Una agencia puede tener varios usuarios con el mismo CUIT?","¿El mapa esquemático se entiende o hace falta un mapa real?"]},
 estado:{a:["Estados: Sin revisión → En revisión (revisión a mano, hasta 48 h hábiles) → Aprobada.","Para aprobar: CUIT, condición fiscal, dirección, ficha de Google Maps, web o Instagram, años en el rubro y una llamada.","Hasta que está aprobada, la agencia no ve la subasta ni las fichas."],v:["¿Qué umbral de reseñas y antigüedad pedimos (AGE-03)?","¿La charla de verificación es por teléfono o en persona?"]},
 ingresar:{a:["Ingreso con email y contraseña (11/10): más formal que un código por WhatsApp.","Sin ingresar se ven la landing (sin subastas), el alta y los textos legales.","Prototipo: cualquier email y contraseña entran como una agencia ya aprobada.","Al terminar el alta, la agencia queda con sesión iniciada y En revisión: no ve la subasta hasta que la aprobamos."],v:["¿Confirmamos el email con un link antes de dejarla seguir?","¿Les mandamos a las agencias que contactamos un link de invitación?"]},
 legal:{a:["Borradores para mostrar la idea; no son textos finales.","Anti-bypass: fee + penalidad si compra por fuera dentro de 90 días (a definir)."],v:["Revisión del abogado (LEG-03, LEG-04).","Monto de la penalidad por bypass."]}
};
function notasPanel(){
 const k=SUB.includes(vista)?"subasta":vista==="ingresar"?"ingresar":vista==="alta"?"alta":["estado","perfil","preferencias"].includes(vista)?"estado":LEGALES.includes(vista)?"legal":"inicio";
 const n=NOTAS[k], titulo={subasta:"Portal de subasta",ingresar:"Ingresar",inicio:"Landing de agencias",alta:"Alta · paso "+S.paso,estado:"Mi agencia",legal:"Legales"}[k];
 byId("panel").innerHTML=`<button class="x" aria-label="Cerrar" id="pX">×</button><h3>Notas: ${titulo}</h3>
 <h4>Qué aplica</h4><ul>${n.a.map(x=>`<li>${x}</li>`).join("")}</ul>
 <h4>Qué validar</h4><ul>${n.v.map(x=>`<li>${x}</li>`).join("")}</ul>
 <h4>Ir a</h4><div class="jump">
  <button data-j="ingresar">Ingresar</button><button data-j="inicio">Landing</button><button data-j="subasta">Subasta (agencia aprobada)</button>${[1,2,3,4].map(i=>`<button data-j="alta" data-p="${i}">Alta ${i}</button>`).join("")}
  <button data-j="estado">Mi agencia</button><button data-j="perfil">Datos de la agencia</button><button data-j="preferencias">Preferencias</button>
  <button data-j="terminos">Términos</button><button data-j="reglas">Reglas</button><button data-j="privacidad">Privacidad</button><button data-j="vender">Web del vendedor</button>
 </div>
 <h4>Atajos</h4><div class="jump"><button id="demo">Cargar datos de ejemplo</button><button id="reset">Empezar de cero</button></div>`;
 byId("pX").onclick=togglePanel;
 $$("#panel [data-j]").forEach(b=>b.onclick=()=>{
  const j=b.dataset.j;
  if(j==="vender"){location.hash="vender";return}
  if(j==="ingresar"&&S.sesion) S.sesion=false;
  if(j==="subasta"){demo(true);S.estado="ok";S.prefsOk=true;go("subasta");return}
  if(j==="alta"&&+b.dataset.p>maxPaso()) demo(false);
  if(["perfil","preferencias"].includes(j)&&S.estado==="sin"){demo(false);S.estado="rev"}
  go(j,j==="alta"?+b.dataset.p:undefined);
 });
 byId("demo").onclick=()=>{demo(true);route()};
 byId("reset").onclick=()=>{location.hash="agencias";location.reload()};
}
function demo(todo){
 Object.assign(S,{resp:S.resp||"Martín López",email:emailOk(S.email)?S.email:"compras@autostriunvirato.com.ar",pass:S.pass.length>=8?S.pass:"yacar2026",cel:celOk()?S.cel:"11 5432 1098"});
 if(S.cuitVerif!=="nuevo"){S.cuit=CUIT_DEMO;S.arca=consultarCUIT(S.cuit);S.cuitVerif="nuevo";S.fiscal=S.arca.fiscal}
 ejemplo("alta2");
 if(!S.zonas.size){S.tocadas=false;S.zonas=autoZonas(S.base,S.radio)}
 S.verificando=false; S.sesion=true; MALOS.clear();
 if(todo){
  Object.assign(S,{acepT:true,acepC:true});
  if(S.estado==="sin") S.estado="rev";
 }
}
function togglePanel(){const p=byId("panel"),f=byId("fab");p.hidden=!p.hidden;f.setAttribute("aria-expanded",String(!p.hidden))}
byId("fab").onclick=togglePanel;
$$(".logo").forEach(a=>a.addEventListener("click",e=>{e.preventDefault(); if(vista==="inicio"){history.pushState(null,"","#agencias");window.scrollTo({top:0,behavior:"smooth"})} else go("inicio")}));
// Salir: en el prototipo vuelve todo a cero, como si entrara otra agencia.
byId("agSalir").onclick=()=>{window.YacarCuenta?.salir();Object.assign(S,S_INICIAL());MALOS.clear();window.YacarSubasta?.reset();go("ingresar")};

/* ---------- modo: vendedor o agencias ---------- */
function modo(){
 const ag=location.hash.startsWith("#agencias");
 document.body.classList.toggle("modo-ag",ag);
 document.title=ag?"Yacar para agencias":"Yacar · Vendé tu auto";
 return ag;
}
window.addEventListener("hashchange",()=>{
 const antes=document.body.classList.contains("modo-ag"), ahora=modo();
 if(antes!==ahora&&!Suave.sinMov()) document.body.animate([{opacity:0},{opacity:1}],{duration:320,easing:"ease-out"});
 if(ahora) route(); else if(antes) window.scrollTo(0,0);
});
// 18/10: lo que usa el portal de subasta (subasta.js, se carga después)
window.YacarAg={R,S,$,$$,byId,go,route,esc,fmt,fmtM,feeOf,FEE,ZBY,DEMO_BASE,dist,banda,aprobada,FOTOS,CUB,repintar};
ficha(); vlist(byId("vlistLanding")); initFlujo();
byId("cPrecio").addEventListener("input",calc);
calc(); tick(); setInterval(tick,1000);
if(modo()) route(); else notasPanel();
})();

