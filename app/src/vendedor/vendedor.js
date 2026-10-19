// Motor de precios (port de motor-de-precios/*.py a JS). D-11, D-13, D-17. D-48: × índice MEP (mepPara, comun/dias_habiles.js).
// D-49 (17/10): si el servidor trae el precio de mercado del momento (mercado.js), la base sale de ahí: lo que paga una
// agencia = 0,82 × lo que piden los avisos (0,95 / 1,159). Sin servidor, lista de referencia × factor × km × MEP, como antes.
const MOTOR = {KM_POR_ANIO:15000, TASA:0.0025, TOPE_SUBA:0.075, TOPE_BAJA:-0.15, MES_BASE:7,
  FACTOR_CENTRO:0.95, ANCHO:0.06, REDONDEO:100000, RELACION_GENERAL:1.159,   // D-51 (18/10): rango = centro (piso) a centro + 6%; sugerido = mitad
  // D-51: cuánto le cuesta al particular esperar para venderlo por su cuenta, por mes y como fracción del valor del auto.
  // Desvalorización 0,45% (≈ 5,5% por año de antigüedad: lista CCA de 09/2026, mediana 5%; avisos del Onix a igual km, 6%),
  // patente + seguro 0,5% (iProfesional, Cronos 03/2026: ~$80 mil + ~$70 mil por mes; Onix 2016 en CABA ~$60 mil de patente),
  // plata parada 7% anual ÷ 12 (Gonzalo, 18/10: punto medio entre el plazo fijo en dólares, 4–4,5%, y algo con más riesgo:
  // obligaciones negociables en dólares de empresas grandes, 5–7,5%, Allaria 30/09/2026; bonos del Tesoro en dólares, 9–13%,
  // Banco Provincia 16/10/2026). Auto guardado: sin sumar km. 2 o 3 meses: lado corto de "2 a 6 meses publicado" (Broker Cars, E-02).
  ESPERA:{MESES:[2,3], DESVALORIZACION:0.0045, PATENTE_SEGURO:0.005, PLATA:0.07/12, PLATA_ANUAL:0.07},
  FACTORES_MODELO:/*@json:factores_modelo.json*/null,
  KM_TABLA:/*@json:km_esperados.json*/null,   // 18/10: km esperados por antigüedad (reemplaza KM_POR_ANIO)  // D-23: igual que motor-de-precios/factores_modelo.csv (ronda ML 2026-10)
  MAX_CANT:{chapa_pintura:15, cubiertas:4}};
function r5(x){ return Math.round(x*1e5)/1e5 + 0; }
// 18/10/2026: km esperados por antigüedad, medidos en los avisos (motor-de-precios/km_esperados.py); pickups × factor.
function kmEsperados(edad, pickup){
  const T = MOTOR.KM_TABLA, e = T.edad, k = T.km, n = e.length;
  let km;
  if (edad <= e[0]) km = k[0]*edad/e[0];
  else if (edad >= e[n-1]){ const a = Math.max(0, n-4); km = k[n-1] + (k[n-1]-k[a])/(e[n-1]-e[a])*(edad-e[n-1]); }
  else for (let i=0; i<n-1; i++) if (edad >= e[i] && edad <= e[i+1]){ km = k[i] + (k[i+1]-k[i])*(edad-e[i])/(e[i+1]-e[i]); break; }
  return Math.round(km*(pickup ? T.pickup : 1));
}
const esPickup = vid => /--(d-c|c-s|c-ext|c-d|c-e)-/.test(vid||'');   // cabina simple, doble o extendida
function ajusteKm(anio, km, fecha, pickup=false){
  const meses = (fecha.getFullYear()-anio)*12 + (fecha.getMonth()+1-MOTOR.MES_BASE);
  const edad = Math.max(0, meses/12), esperados = kmEsperados(edad, pickup), desvio = km-esperados;
  const sin = -MOTOR.TASA*desvio/1000 + 0;
  return {edad, esperados, desvio, ajuste: r5(Math.min(MOTOR.TOPE_SUBA, Math.max(MOTOR.TOPE_BAJA, sin)))};
}
function costoOpcion(o, p, grande){
  const taller = (o.pintar*p.valor_pano_pintura + o.dias*p.valor_dia_chapa + o.horas*p.valor_hora_taller)*(1+p.iva);
  const fijo = (grande && o.fijoG != null) ? o.fijoG : o.fijo;
  return (taller+fijo)*p.factor_agencia;
}
function evaluarEstado(resp, base, ref, SUP, etapa='todo'){   // D-25: etapa 'vendedor' (N2) o 'todo' (N3, con la revisión de fotos)
  const p = SUP.par, grande = (ref||base) >= p.umbral_auto_grande;
  let pct = 0, premio = 0, costos = 0; const faltan = [], motivos = [];   // D-40: lo bueno suma (premio) con tope
  for (const q of SUP.preguntas){
    const r = resp[q.id];
    if (r == null){ if (etapa==='todo' || (q.responde||'vendedor')==='vendedor') faltan.push(q.id); continue; }
    const elegidas = q.tipo === 'una_opcion' ? {[r]:1} : Object.fromEntries(Object.entries(r).filter(([,n])=>n));
    for (const [oid,n] of Object.entries(elegidas)){
      const o = q.opciones.find(x=>x.id===oid);
      costos += costoOpcion(o,p,grande)*n; if (o.pct > 0) premio += o.pct*n; else pct += o.pct*n;
      if (o.rev) motivos.push(q.pregunta+' → '+o.texto);
    }
  }
  premio = Math.min(premio, p.tope_premio || 0); pct += premio;
  const completo = !faltan.length; let total = null;
  if (completo){ total = (base*(1+pct)-costos)/base - 1; if (total < p.tope_total) motivos.push('Descuento por estado peor que el tope'); }
  return {completo, faltan, revision: motivos.length>0, motivos, pct: r5(pct), premio: r5(premio), costos: Math.round(costos), total: total==null?null:r5(total)};
}
function redondear(x, hacia){ const f = hacia==='abajo'?Math.floor:hacia==='arriba'?Math.ceil:Math.round; return f(x/MOTOR.REDONDEO)*MOTOR.REDONDEO; }
function estimar({cca, anio, km, resp=null, fotosDocsOk=false, modeloId='', precioMercado=null, pickup=false}, fecha, SUP, mep = mepPara(fecha)){
  const fm = precioMercado ? 1 : (MOTOR.FACTORES_MODELO[modeloId] || 1);
  const k = ajusteKm(anio, km, fecha, pickup);
  const base = precioMercado ? precioMercado/MOTOR.RELACION_GENERAL   // D-49: avisos del momento (km y dólar ya incluidos)
                             : cca*fm*(1+k.ajuste)*mep.indice;          // D-48: precio en pesos al MEP del día hábil anterior
  const ev = resp ? evaluarEstado(resp, base, cca, SUP, 'vendedor') : null;
  const et = resp && fotosDocsOk ? evaluarEstado(resp, base, cca, SUP, 'todo') : null;
  const n2 = !!(ev && ev.completo && !ev.revision), n3 = n2 && !!(et && et.completo && !et.revision);
  const nivel = n3 ? 3 : n2 ? 2 : 1, est = n3 ? et : (et && et.revision ? et : ev);
  const usa = nivel>=2, pct = usa?est.pct:0, arreglos = usa?est.costos:0;
  const referencia = base*(1+pct) - arreglos, centro = referencia*MOTOR.FACTOR_CENTRO;
  const lo = centro, hi = centro*(1+MOTOR.ANCHO);   // D-51: piso = lo que paga una agencia hoy; techo = + 6% (antes D-19: ± 5%)
  const revision = !!((ev && ev.revision) || (et && et.revision));
  return {nivel, centro: Math.round(centro), minimo: redondear(lo,'abajo'), maximo: redondear(hi,'arriba'),
    sugerido: nivel===3 ? redondear(centro*(1+MOTOR.ANCHO/2),'cerca') : null, revision, motivos: est?est.motivos:[],
    km: k, estado: est, referencia, factorModelo: fm, mep, usd: Math.round(centro/mep.valor/100)*100, fuente: precioMercado ? 'mercado' : 'referencia'};
}
if (typeof module !== 'undefined') module.exports = {estimar, MOTOR};

const CAT = JSON.parse(document.getElementById('catalogo').textContent);
const SUP = JSON.parse(document.getElementById('supuestos').textContent);
const HOY = new Date();
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const M = x => '$\u00a0' + (x/1e6).toFixed(1).replace('.', ',') + '\u00a0M';   // 18/10: sin cortes de renglón adentro de la cifra
const P = x => '$ ' + Math.round(x).toLocaleString('es-AR');
const KM = x => Number(x).toLocaleString('es-AR');
const tituloCase = s => s.split(' ').map(w => /[AEIOUÁÉÍÓÚaeiouáéíóú]/.test(w) ? w.toLowerCase().replace(/(^|[\-\/(])([a-záéíóúñ])/g, (m,a,b)=>a+b.toUpperCase()) : w).join(' ');   // 17/10: siglas sin vocales quedan en mayúscula (CC, CR-V, SW4, BMW)

// D-25 (05/10/2026): fotos como Motorway (4 esquinas, asientos, tablero, baúl, dibujo de las cubiertas) + motor.
// 18/10/2026 (Gonzalo): de 14 a 10 obligatorias: 2 cubiertas en lugar de 4 (se cambian de a pares), las llaves pasan a una pregunta y el motor es opcional.
const FOTOS = [['esq_di','Esquina delantera izq.','A 45°, con el auto entero en la foto'],['esq_dd','Esquina delantera der.','A 45°, con el auto entero en la foto'],
  ['esq_ti','Esquina trasera izq.','A 45°, con el auto entero en la foto'],['esq_td','Esquina trasera der.','A 45°, con el auto entero en la foto'],
  ['asientos_del','Asientos delanteros','Desde la puerta del conductor'],['asientos_tras','Asientos traseros','Desde una puerta trasera'],
  ['tablero','Tablero encendido','Motor en marcha: que se lean los km y las luces'],['baul','Baúl','Vacío'],
  ['cub_di','Cubierta delantera','De frente, que se vea el dibujo'],['cub_td','Cubierta trasera','De frente, que se vea el dibujo'],
  ['motor','Motor (opcional)','Capot abierto']];
const OPCIONALES = ['motor'];
const OBLIG = FOTOS.filter(f => !OPCIONALES.includes(f[0]));
// Revisión UX (14/10/2026): las fotos se sacan de a una, en el orden en que se camina alrededor del auto.
// FOTOS (arriba) sigue siendo el orden de la ficha para agencias (D-33); SECUENCIA es solo el orden en que se sacan.
const SECUENCIA = ['esq_di','cub_di','esq_dd','esq_td','cub_td','esq_ti','asientos_del','asientos_tras','tablero','baul','motor'];
const AFUERA = 6;
const TITULO_FOTO = {esq_di:'Esquina delantera izquierda', esq_dd:'Esquina delantera derecha', esq_td:'Esquina trasera derecha', esq_ti:'Esquina trasera izquierda',
  cub_di:'Cubierta delantera', cub_td:'Cubierta trasera',
  asientos_del:'Asientos delanteros', asientos_tras:'Asientos traseros', tablero:'Tablero encendido', baul:'Baúl', motor:'Motor (opcional)'};
const C_ESQ = ['A 45°: que se vean el frente (o la cola) y el costado', 'Que entre el auto entero', 'Celular en horizontal'];
const C_CUB = ['Agachate a la altura de la rueda', 'Que se vea bien el dibujo de la cubierta'];
const CONSEJOS = {esq_di:C_ESQ, esq_dd:C_ESQ, esq_td:C_ESQ, esq_ti:C_ESQ, cub_di:C_CUB, cub_dd:C_CUB, cub_td:C_CUB, cub_ti:C_CUB,
  asientos_del:['Desde la puerta del conductor, abierta', 'Que se vean los dos asientos y el volante'], asientos_tras:['Desde una puerta trasera, abierta', 'Que se vea todo el asiento'],
  tablero:['Con el motor en marcha', 'Que se lean los kilómetros y las luces del tablero'], llaves:['Todas las que tengas, juntas', 'Sobre una mesa o superficie lisa'],
  baul:['Con el baúl abierto y vacío'], motor:['Con el capot abierto', 'Que se vea el motor entero']};
// Dibujos simples (sin fotos reales): el auto visto desde arriba, con el frente hacia arriba, y dónde pararse.
const DONDE = {esq_di:[46,22,110,58], esq_dd:[254,22,190,58], esq_td:[254,212,190,176], esq_ti:[46,212,110,176],
  cub_di:[40,74,100,72], cub_dd:[260,74,200,72], cub_td:[260,166,200,166], cub_ti:[40,166,100,166],
  asientos_del:[40,112,124,108], asientos_tras:[40,142,124,140], baul:[150,226,150,194], motor:[150,12,150,44]};
function dibujo(k){
  const fl = `<defs><marker id="flecha" markerWidth="9" markerHeight="9" refX="5" refY="4.5" orient="auto"><path d="M0 0L9 4.5L0 9z" fill="var(--brand)"/></marker></defs>`;
  if (k==='tablero') return `<svg viewBox="0 0 300 150" role="img" aria-label="Tablero con los kilómetros a la vista">${fl}
    <rect x="30" y="20" width="240" height="110" rx="22" fill="var(--accent-soft)" stroke="var(--brand)" stroke-width="3"/>
    <circle cx="100" cy="72" r="34" fill="#fff" stroke="var(--brand)" stroke-width="3"/><circle cx="200" cy="72" r="34" fill="#fff" stroke="var(--brand)" stroke-width="3"/>
    <path d="M100 72L120 52M200 72L184 50" stroke="var(--brand)" stroke-width="3" stroke-linecap="round"/>
    <rect x="112" y="104" width="76" height="20" rx="4" fill="var(--brand)"/><text x="150" y="119" text-anchor="middle" font-size="13" font-weight="700" fill="var(--cta)" font-family="sans-serif">062.000 km</text></svg>`;
  if (k==='llaves') return `<svg viewBox="0 0 300 150" role="img" aria-label="Las llaves juntas sobre una mesa">
    <rect x="20" y="110" width="260" height="10" rx="5" fill="var(--line)"/>
    <g fill="none" stroke="var(--brand)" stroke-width="4" stroke-linejoin="round"><circle cx="95" cy="70" r="22"/><path d="M117 70h70v14M167 70v10"/><circle cx="205" cy="60" r="18"/><path d="M190 72l-34 26M168 89l8 10"/></g>
    <circle cx="95" cy="70" r="7" fill="var(--cta)"/><circle cx="205" cy="60" r="6" fill="var(--cta)"/></svg>`;
  const p = DONDE[k], cub = k.startsWith('cub_');
  const rueda = (x, y, id) => `<rect x="${x}" y="${y}" width="12" height="30" rx="4" fill="${cub && k==='cub_'+id ? 'var(--cta)' : 'var(--ink)'}" stroke="var(--brand)" stroke-width="${cub && k==='cub_'+id ? 3 : 0}"/>`;
  return `<svg viewBox="0 0 300 252" role="img" aria-label="Dónde pararte para sacar la foto">${fl}
    ${rueda(98,57,'di')}${rueda(190,57,'dd')}${rueda(98,151,'ti')}${rueda(190,151,'td')}
    <rect x="108" y="40" width="84" height="156" rx="30" fill="var(--accent-soft)" stroke="var(--brand)" stroke-width="3"/>
    <rect x="120" y="74" width="60" height="30" rx="8" fill="#fff" stroke="var(--brand)" stroke-width="2"/><rect x="122" y="156" width="56" height="22" rx="7" fill="#fff" stroke="var(--brand)" stroke-width="2"/>
    ${k==='motor' ? '' : `<text x="150" y="60" text-anchor="middle" font-size="12" font-weight="600" fill="var(--muted)" font-family="sans-serif">frente</text>`}
    <line x1="${p[0]}" y1="${p[1]}" x2="${p[2]}" y2="${p[3]}" stroke="var(--brand)" stroke-width="3" stroke-dasharray="6 5" marker-end="url(#flecha)"/>
    <circle cx="${p[0]}" cy="${p[1]}" r="13" fill="var(--cta)" stroke="var(--brand)" stroke-width="3"/>
    ${p[0]===150 ? '' : `<text x="${p[0] < 150 ? 6 : 294}" y="${p[1]+32}" text-anchor="${p[0] < 150 ? 'start' : 'end'}" font-size="13" font-weight="700" fill="var(--brand)" font-family="sans-serif">Parate acá</text>`}
    ${p[0]===150 ? `<text x="168" y="${p[1]+5}" font-size="13" font-weight="700" fill="var(--brand)" font-family="sans-serif">Parate acá</text>` : ''}</svg>`;
}
const REV_LIMPIA = {chapa_pintura:{}, vidrios:'sanos', cubiertas:{}, interior:'normal', testigos:'ninguno'};   // lo que vemos en las fotos (N3)
// D-24 (05/10/2026): datos del auto y detalles del estado que no mueven el precio (van a la ficha para agencias)
const PARTES = [['parag_del','Paragolpes delantero'],['capot','Capot'],['guarda_di','Guardabarros delantero izq.'],['guarda_dd','Guardabarros delantero der.'],
  ['puerta_di','Puerta delantera izq.'],['puerta_dd','Puerta delantera der.'],['puerta_ti','Puerta trasera izq.'],['puerta_td','Puerta trasera der.'],
  ['guarda_ti','Guardabarros trasero izq.'],['guarda_td','Guardabarros trasero der.'],['parag_tras','Paragolpes trasero'],['baul','Baúl o portón'],['techo','Techo'],['caja','Caja (pickup)']];
const PARTIDOS = ['Ciudad de Buenos Aires','Almirante Brown','Avellaneda','Berazategui','Berisso','Brandsen','Campana','Cañuelas','Ensenada','Escobar',
  'Esteban Echeverría','Exaltación de la Cruz','Ezeiza','Florencio Varela','General Las Heras','General Rodríguez','General San Martín','Hurlingham',
  'Ituzaingó','José C. Paz','La Matanza','La Plata','Lanús','Lomas de Zamora','Luján','Malvinas Argentinas','Marcos Paz','Merlo','Moreno','Morón',
  'Pilar','Presidente Perón','Quilmes','San Fernando','San Isidro','San Miguel','San Vicente','Tigre','Tres de Febrero','Vicente López','Zárate'];
const OP = {
  duenos:[['1','Soy el primer dueño'],['2','Segundo dueño'],['3','Tercero o más'],['ns','No sé']],
  gnc:[['no','No tiene'],['vigente','Sí, con la oblea vigente'],['vencida','Sí, con la oblea vencida']],
  uso:[['no','No'],['si','Sí']],
  llaves:[['2','Dos o más'],['1','Una sola']],
  repintado:[['no','No'],['si','Sí'],['ns','No sé']],
  vidrioLado:[['conductor','En el parabrisas, del lado del conductor'],['otro_lado','En el parabrisas, del lado del acompañante o en el medio'],['otro_vidrio','En otro vidrio (ventanilla o luneta)']],
  testigos:[['motor','Motor (check engine)'],['abs','ABS'],['airbag','Airbag'],['otra','Otra']],
  choqueDonde:[['adelante','Adelante'],['atras','Atrás'],['izq','Costado izquierdo'],['der','Costado derecho']],
  svLugar:[['oficial','Siempre en el concesionario oficial'],['mixto','En el oficial durante la garantía y después en un taller'],['taller','Siempre en un taller de confianza'],['ns','No sé / no tengo el historial']],
  svCuando:[['6m','Hace menos de 6 meses'],['1a','Entre 6 meses y 1 año'],['mas','Hace más de 1 año'],['ns','No me acuerdo']],
  daniosResp:[['no','No'],['si','Sí']],
  prenda:[['no','No'],['si','Sí, todavía la estoy pagando'],['ns','No sé']],
  titular:[['yo','Sí, solo a mi nombre'],['compartido','Sí, compartido con otra persona'],['no','No']],
  civil:[['no','No'],['si','Sí']],
  vpol:[['si','Sí, la tengo vigente'],['no','No'],['ns','No sé']],
  titulo:[['papel','Sí, en papel'],['digital','Sí, es digital (lo bajo de la página del Registro)'],['no','No lo encuentro']],   // 16/10 (D-44)
  sexo:[['F','F'],['M','M'],['X','X']]};
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const txt = (lista, v) => (OP[lista].find(x=>x[0]===v)||[,''])[1];
// 12/10/2026: cédula verde (la azul ya no hace falta) + foto del número de chasis grabado en el auto, para comparar con el informe de dominio
const DOCS = [['cedula_f','Cédula verde (frente)','O la cédula digital de Mi Argentina'],['cedula_d','Cédula verde (dorso)',''],
  ['chasis','Número de chasis','Con la patente grabada en el vidrio, si se ve']];
// 16/10/2026 (D-44): identidad con número de DNI + selfie con prueba de vida, comparada con la foto del RENAPER por un proveedor (ej. Didit).
// Las fotos del DNI quedan solo como plan B (si el RENAPER no responde). En la web real, la selfie la saca la pantalla del proveedor.
const DNI = [['dni_f','DNI (frente)',''],['dni_d','DNI (dorso)','']];
const dniNumOk = () => /^\d{7,8}$/.test(String(S.dniNum||'').replace(/\D/g,''));
const identidadOk = () => !!S.dni.selfie && (S.dniPlanB ? DNI.every(d=>S.dni[d[0]]) : dniNumOk() && !!S.dniSexo);
// Flujo del 12/10/2026 (Gonzalo): primero el precio y el mínimo; los papeles van después de aceptar, y recién con el OK final pedimos informe y consultas.
// 13/10/2026 (Gonzalo): el estado se pregunta antes de las fotos, para dar el precio afinado antes de pedirlas.
const PASOS = ['datos','previo','rango1','registro','codigo','auto','estado','rango2','fotos','verificando','precio','confirmar','documentos','enviado','miauto'];
const NOMBRE_PASO = {datos:'Cotizá tu auto',previo:'Mientras buscamos',rango1:'Primer precio',registro:'Tus datos',codigo:'Código de WhatsApp',auto:'Datos del auto',fotos:'Fotos',estado:'Estado',rango2:'Precio afinado',
  verificando:'Revisión de fotos',precio:'Precio sugerido',confirmar:'Confirmación',documentos:'Papeles',enviado:'Chequeo final',miauto:'Mi auto',informe:'Informe del auto'};

const S0 = () => ({paso:'datos', patEstado:'', patAuto:null, patM:null, patCands:[], patSel:'', patNota:'', cuando:'', cp:'', cpTexto:'', cpZona:null, cpEstado:'', cpError:false, localidad:'', qi:{}, anim:'', cargando:false, marca:'', modelo:'', anio:'', vid:'', km:'', nombre:'', email:'', cel:'', fotos:{}, resp:{}, tocadas:{}, docs:{}, dni:{}, codigo:'', civil:'', vpol:'', papeles:'', titulo:'', dniNum:'', dniSexo:'', dniPlanB:false, grabado:'', certDom:'', certFecha:'', consent:false, consultas:'',
  patente:'', partido:'', barrio:'', duenos:'', gnc:'', uso:'', llaves:'', prenda:'', titular:'', abiertos:{}, daniosResp:'', danios:{}, nDanios:1, rev:null, resultado:null, aceptoReglas:false,
  det:{partes:{}, repintado:'', repintadas:[], vidrioLado:'', mecTxt:'', testigos:[], choqueDonde:[], svLugar:'', svCuando:''}, svfoto:{}, duenosInforme:'', ajusteInforme:null,
  
versionOk:false, noCoincide:false, minimo:'', acuerdo:false, terminos:false, avance:0, oferta:null, decision:null, prev:null,
  fotoFase:'', fotoIdx:0, fotoVolver:false, estResumen:false, volverResumen:false, pasoGuardado:'', codEnviado:0, cpLargo:false});   // revisión UX 14/10
let S = S0();

// ------------------------------------------------------------ catálogo
const marcas = () => CAT.map(m => m[0]);
const modelos = ma => (CAT.find(m => m[0]===ma)||[,[]])[1].map(x => x[0]);
const versionesDe = (ma, mo) => ((CAT.find(m => m[0]===ma)||[,[]])[1].find(x => x[0]===mo)||[,[]])[1];
const aniosDe = (ma, mo) => [...new Set(versionesDe(ma,mo).flatMap(v => Object.keys(v[2])))].sort((a,b)=>b-a);
const versionesAnio = (ma, mo, a) => versionesDe(ma,mo).filter(v => v[2][a]);
// 17/10: nombre que ve el vendedor: sin el año de serie y, si en ese año hay dos generaciones con el mismo nombre, con "(línea nueva)" / "(línea anterior)" (armar_catalogo_web.py)
const nomV = (v, anio) => v[1].replace(/\s(19|20)\d\d$/,'') + (v[3] && v[3][anio] ? ` (${v[3][anio]})` : '');
const vActual = () => versionesDe(S.marca,S.modelo).find(v => v[0]===S.vid);
const cca = () => { const v = vActual(); return v ? v[2][S.anio] : null; };
const nombreAuto = () => { const v = vActual(); return v ? `${tituloCase(S.marca)} ${tituloCase(S.modelo)} ${nomV(v, S.anio)} ${S.anio}` : ''; };
const kmNum = () => parseInt(String(S.km).replace(/\D/g,''),10);

function calcular(nivel){
  const base = {cca: cca(), anio: +S.anio, km: kmNum(), modeloId: (vActual()||[''])[0].split('--').slice(0,2).join('--'),
    precioMercado: typeof mktPrecio === 'function' ? mktPrecio(S.vid, +S.anio, kmNum()) : null, pickup: esPickup(S.vid)};   // D-49
  if (nivel>=2) base.resp = respuestasCompletas(nivel>=3);
  if (nivel>=3) base.fotosDocsOk = true;
  return estimar(base, HOY, SUP);
}
function servicioDerivado(){   // D-25: comprobantes + cuándo fue el último → al_dia / atrasado
  const d = S.det;
  if (!d.svLugar || !d.svCuando) return undefined;   // D-40: dónde + cuándo → oficial/mixto/taller al día o atrasado
  return (d.svLugar!=='ns' && (d.svCuando==='6m' || d.svCuando==='1a')) ? d.svLugar + '_al_dia' : 'atrasado';
}
function respuestasCompletas(conRevision){   // N2: lo que responde el vendedor; N3: + lo que vemos en las fotos (S.rev)
  const r = {};
  for (const q of SUP.preguntas){
    if ((q.responde||'vendedor')!=='vendedor') continue;
    if (q.id==='service'){ const v = servicioDerivado(); if (v) r.service = v; }
    else if (q.id==='duenos'){ const v = S.duenosInforme || S.duenos; if (v) r.duenos = v; }   // si el informe dice otra cosa, manda el informe
    else if (q.id==='libreta'){ const v = servicioDerivado(); if (v) r.libreta = (v==='oficial_al_dia' && S.svfoto.libreta) ? 'si' : 'no'; }
    else if (q.id==='cuidado'){ if (S.resp.choques && S.det.repintado) r.cuidado = (S.resp.choques==='nunca' && S.det.repintado==='no') ? 'si' : 'no'; }
    else if (S.resp[q.id]) r[q.id] = S.resp[q.id];
  }
  if (conRevision && S.rev) Object.assign(r, S.rev);
  return r;
}
const ITEMS = () => ['mecanica','choques','repintado','sv_lugar','sv_cuando'];   // D-42: sin el aire
function respOk(id){
  const d = S.det, r = S.resp[id];
  switch (id){
    case 'repintado': return !!d.repintado && (d.repintado!=='si' || d.repintadas.length>0);
    case 'mecanica': return !!r && (r!=='fallas_menores' || d.mecTxt.trim().length>=5);
    case 'choques': return !!r && (r!=='leve' || d.choqueDonde.length>0);
    case 'sv_lugar': return !!d.svLugar;
    case 'sv_cuando': return !!d.svCuando;
    default: return !!r;
  }
}
const respondidas = () => ITEMS().filter(respOk).length;
function updEstado(){
  const n = respondidas(), tot = ITEMS().length, k = $('#estKick'), b = $('[data-go="rango2"]');
  if (k) k.textContent = `Estado · ${n} de ${tot} respondidas`;
  if (b) b.disabled = n!==tot;
  const qb = $('[data-qnext]'); if (qb && QS[S.paso]){ const [l,i] = qActual(); qb.disabled = !l[i].ok(); }
  document.querySelectorAll('fieldset.q[data-id]').forEach(f => f.classList.toggle('ans', respOk(f.dataset.id)));
}

// ------------------------------------------------------------ piezas
function rangoHTML(e, ghost){
  const lo = Math.min(e.minimo, ghost?ghost.minimo:e.minimo), hi = Math.max(e.maximo, ghost?ghost.maximo:e.maximo);
  const span = (hi-lo)||1, pad = span*0.08, a = lo-pad, w = span+2*pad, pos = x => ((x-a)/w*100).toFixed(2)+'%', wid = (x,y) => ((y-x)/w*100).toFixed(2)+'%';
  return `<div class="range">
    <div class="nums"><div><small>Desde</small>${M(e.minimo)}</div><div style="text-align:right"><small>Hasta</small>${M(e.maximo)}</div></div>
    <div class="track" aria-hidden="true">${ghost?`<div class="ghost" style="left:${pos(ghost.minimo)};width:${wid(ghost.minimo,ghost.maximo)}"></div>`:''}
      <div class="band" style="left:${pos(e.minimo)};width:${wid(e.minimo,e.maximo)}"></div>${e.sugerido?`<div class="pin" style="left:${pos(e.sugerido)}"></div>`:''}</div>
    ${ghost?`<p class="fine">Barra clara: tu rango anterior.</p>`:''}
  </div>`;
}
function cifraHTML(e, antes){   // D-51 (18/10): desde N1 se muestra el rango (antes D-20: una sola cifra en N1 y N2)
  const c = e.minimo, a = antes ? antes.minimo : null, mot = a!==null && c < a ? motivosBaja() : '';
  return `<div>${rangoHTML(e, antes && a!==c ? antes : null)}${mot ? `<p class="fine antes" style="margin-top:6px"><b>Bajó por ${esc(mot)}.</b></p>`:''}</div>`;   // la barra clara ya muestra el rango anterior
}
// Revisión UX (14/10, M3): cuando el precio afinado baja, se dice qué pesó, en palabras de la persona y sin montos (D-20, VEN-17).
const FRASE_BAJA = {fallas_menores:'el detalle del auto', leve:'el choque arreglado'};
function motivosBaja(){
  const m = [];
  for (const id of ['mecanica','choques']){ const f = FRASE_BAJA[S.resp[id]]; if (f) m.push(f); }
  if (servicioDerivado()==='atrasado') m.push(S.det.svLugar==='ns' ? 'que no hay historial de service' : 'el service atrasado');
  return m.length > 1 ? m.slice(0,-1).join(', ') + ' y ' + m[m.length-1] : (m[0] || '');
}
const conY = l => l.length > 1 ? l.slice(0,-1).join(', ') + ' y ' + l[l.length-1] : (l[0] || '');
const FALTA_DOC = {cedula_f:'la cédula de frente', cedula_d:'la cédula de dorso', chasis:'el número de chasis', dni_f:'el DNI de frente', dni_d:'el DNI de dorso', selfie:'la selfie'};
function faltaIdentidad(){
  const f = [];
  if (S.dniPlanB) DNI.filter(d=>!S.dni[d[0]]).forEach(d=>f.push(FALTA_DOC[d[0]]));
  else { if (!dniNumOk()) f.push('tu número de DNI'); if (!S.dniSexo) f.push('el sexo que figura en el DNI'); }
  if (!S.dni.selfie) f.push('la selfie');
  return f.length ? 'Falta: ' + conY(f) + '.' : '';
}
const faltaHTML = t => `<p class="falta" id="falta" ${t?'':'hidden'}>${esc(t||'')}</p>`;   // M14: qué falta para seguir
function precision(n){
  const on = n===1?1:n===2?3:5;
  return `<div><div class="meter" aria-label="Precisión de la estimación: ${on} de 5">${[1,2,3,4,5].map(i=>`<i class="${i<=on?'on':''}"></i>`).join('')}</div>
    <p class="fine" style="margin-top:6px">Precisión: ${n===1?'baja':n===2?'media':'alta'}</p></div>`;
}
// D-51 (18/10, Gonzalo): "¿Por qué este precio?" a la vista, con las razones para vender rápido y cuánto cuesta esperar.
const ESPERA_MES = () => MOTOR.ESPERA.DESVALORIZACION + MOTOR.ESPERA.PATENTE_SEGURO + MOTOR.ESPERA.PLATA;
const ICO = {
  reloj:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>`,
  casa:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-6.5 8 6.5M6.5 9.5V19h11V9.5"/></svg>`,
  baja:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7l6 6 4-4 6 6M20 10.5V15h-4.5"/></svg>`};
function porQueHTML(e, plegado){   // 18/10 (menos texto): mismo contenido, más corto. Solo en el primer precio (Gonzalo: la segunda vez no suma)
  const E = MOTOR.ESPERA, [m1, m2] = E.MESES, p1 = m1*ESPERA_MES(), p2 = m2*ESPERA_MES();
  const monto = p => P(Math.round(e.minimo*p/50000)*50000).replace(' ','&nbsp;');
  const f = x => (x*100).toLocaleString('es-AR', {maximumFractionDigits:2}) + '%', medio = x => (Math.round(x*200)/2).toLocaleString('es-AR') + '%';
  const cuerpo = `<p>Es lo que pagan hoy las agencias, que necesitan un margen para revenderlo. A cambio:</p>
  <ul>
    <li>${ICO.reloj}<div><b>Vendés en días, no en meses</b><span>Subasta de un día; la agencia va a verlo en 48 h hábiles.</span></div></li>
    <li>${ICO.baja}<div><b>Esperar también cuesta</b><span>Si tardás ${m1} o ${m2} meses en venderlo por tu cuenta, perdés entre ${medio(p1)} y ${medio(p2)}: <b class="monto">de ${monto(p1)} a ${monto(p2)}</b>.</span></div></li>
    <li>${ICO.casa}<div><b>Sin llamadas ni visitas de desconocidos</b><span>Solo ve el auto la agencia que gana.</span></div></li>
  </ul>
  <details class="why"><summary>Cómo lo calculamos</summary><p>Es una estimación para un auto típico, no una promesa. Supusimos ${m1} o ${m2} meses hasta venderlo y el auto guardado, sin sumar kilómetros. Por mes: se desvaloriza cerca de ${f(E.DESVALORIZACION)} (un auto pierde alrededor de 5% de su valor por cada año de antigüedad), la patente y el seguro son cerca de ${f(E.PATENTE_SEGURO)} de lo que vale y la plata parada deja de rendir cerca de ${f(E.PLATA)}: el ${f(E.PLATA_ANUAL)} anual de una inversión en dólares de bajo riesgo, como los bonos de empresas grandes.</p></details>`;
  return plegado ? `<details class="why porque-det"><summary>¿Por qué este precio?</summary><section class="porque">${cuerpo}</section></details>`
    : `<section class="porque" aria-labelledby="pq_t"><h3 id="pq_t">¿Por qué este precio?</h3>${cuerpo}</section>`;
}
const ACLARA = `<p class="fine">Es una estimación, no una oferta de compra.</p>`;
const placeholder = (t) => `<svg class="ph" viewBox="0 0 160 120" aria-hidden="true"><rect width="160" height="120" fill="var(--accent-soft)"/><path d="M28 78h104l-8-20c-3-7-8-10-15-10H53c-7 0-12 3-15 10z" fill="var(--accent)" opacity=".55"/><circle cx="52" cy="80" r="10" fill="var(--ink)" opacity=".7"/><circle cx="110" cy="80" r="10" fill="var(--ink)" opacity=".7"/><text x="80" y="108" text-anchor="middle" font-size="10" fill="var(--muted)" font-family="sans-serif">${t}</text></svg>`;
// Revisión de las fotos en el momento (13/10/2026), en el celular, sin mandar nada a ningún lado: resolución, luz, nitidez,
// datos de la cámara (EXIF: si falta, si dice que pasó por un editor, si es vieja) y fotos repetidas. Avisa; no frena.
// Lo que no se puede hacer bien en el celular (si parece generada con IA, estado general) va del lado del servidor: ver documentacion/REVISION_DE_FOTOS.md.
const FQ = {};
const EDITORES = /photoshop|lightroom|snapseed|picsart|canva|gimp|facetune|remini|meitu|airbrush|vsco|faceapp|photoroom|picsart/i;
function leerExif(buf){
  const v = new DataView(buf);
  if (v.byteLength < 4 || v.getUint16(0)!==0xFFD8) return {jpeg:false};
  let o = 2;
  while (o < v.byteLength - 10){
    const m = v.getUint16(o), len = v.getUint16(o+2);
    if (m===0xFFE1 && v.getUint32(o+4)===0x45786966) return tiff(v, o+10);
    if ((m & 0xFF00)!==0xFF00 || m===0xFFDA) break;
    o += 2 + len;
  }
  return {jpeg:true, exif:false};
}
function tiff(v, t){
  const le = v.getUint16(t)===0x4949, g16 = x=>v.getUint16(x,le), g32 = x=>v.getUint32(x,le), out = {jpeg:true, exif:true};
  const txt = (off,n)=>{ let r=''; for (let i=0;i<n-1 && off+i<v.byteLength;i++){ const c=v.getUint8(off+i); if (!c) break; r+=String.fromCharCode(c); } return r.trim(); };
  const ifd = (off, cb)=>{ if (t+off+2 > v.byteLength) return; const n = g16(t+off); for (let i=0;i<n;i++){ const e=t+off+2+i*12; if (e+12 > v.byteLength) return; const tag=g16(e), cnt=g32(e+4); cb(tag, cnt, cnt>4 ? t+g32(e+8) : e+8, e); } };
  let sub = 0;
  ifd(g32(t+4), (tag,cnt,vo,e)=>{ if (tag===0x010F) out.marca=txt(vo,cnt); else if (tag===0x0110) out.modelo=txt(vo,cnt); else if (tag===0x0131) out.software=txt(vo,cnt); else if (tag===0x0132) out.fecha=txt(vo,cnt); else if (tag===0x8769) sub=g32(e+8); });
  if (sub) ifd(sub, (tag,cnt,vo)=>{ if (tag===0x9003) out.fecha=txt(vo,cnt); });
  return out;
}
async function analizarFoto(file, vivo){
  const avisos = [], senales = [];   // avisos: los ve el vendedor (calidad). senales: solo para quien revisa (13/10: el resto se decide cuando haya volumen)
  try {
    const ex = leerExif(await file.slice(0, 256*1024).arrayBuffer());
    if (!ex.exif && !vivo) senales.push('Sin datos de la cámara (captura, reenviada o descargada)');   // la cámara de la web no deja EXIF (16/10)
    if (ex.software && EDITORES.test(ex.software)) senales.push(`Pasó por un editor (${ex.software})`);
    const f = ex.fecha && ex.fecha.match(/^(\d{4}):(\d\d):(\d\d)/);
    if (f){ const d = new Date(+f[1], +f[2]-1, +f[3]); if ((HOY - d) > 30*864e5) senales.push(`Sacada el ${fechaCorta(d)}`); }
    const img = await createImageBitmap(file), k = Math.min(1, 320/Math.max(img.width, img.height));
    const w = Math.max(8, Math.round(img.width*k)), h = Math.max(8, Math.round(img.height*k));
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
    const px = x.getImageData(0, 0, w, h).data, g = new Float32Array(w*h);
    let suma = 0; for (let i=0;i<w*h;i++){ g[i] = 0.299*px[i*4] + 0.587*px[i*4+1] + 0.114*px[i*4+2]; suma += g[i]; }
    const brillo = suma/(w*h);
    let m = 0, m2 = 0, n = 0;
    for (let yy=1; yy<h-1; yy++) for (let xx=1; xx<w-1; xx++){ const i=yy*w+xx, l = g[i-1]+g[i+1]+g[i-w]+g[i+w]-4*g[i]; m += l; m2 += l*l; n++; }
    const nitidez = n ? m2/n - (m/n)**2 : 0;
    if (Math.min(img.width, img.height) < 600) avisos.push('Tiene poca resolución: sacala con la cámara del celular, sin achicarla');
    if (brillo < 45) avisos.push('Salió muy oscura: sacala con más luz');
    else if (brillo > 230) avisos.push('Salió muy clara: evitá el sol de frente');
    if (nitidez < 250) avisos.push('Puede haber salido movida o desenfocada');
    // huella de 16×16 para detectar la misma foto subida dos veces (fotos parecidas, como las 4 cubiertas, no llegan a marcarse)
    const c2 = document.createElement('canvas'); c2.width = 16; c2.height = 16; const x2 = c2.getContext('2d'); x2.drawImage(img, 0, 0, 16, 16);
    const q = x2.getImageData(0,0,16,16).data, gs = []; for (let i=0;i<256;i++) gs.push(q[i*4]+q[i*4+1]+q[i*4+2]);
    const med = gs.reduce((a,b)=>a+b,0)/256;
    return {avisos, senales, huella: gs.map(v=>v>med?1:0), datos:{brillo:Math.round(brillo), nitidez:Math.round(nitidez), ancho:img.width, alto:img.height, exif:ex}};
  } catch(e){ return {avisos, senales, huella:null, datos:{error:String(e)}}; }
}
function repetidas(grupo){   // marca las fotos que son casi iguales a otra del mismo paso
  const ks = Object.keys(FQ).filter(k=>k.startsWith(grupo+'|') && FQ[k].huella);
  ks.forEach(k=>{ FQ[k].repetida = ks.some(o=>o!==k && FQ[o].huella.reduce((a,b,i)=>a+(b!==FQ[k].huella[i]),0) <= 8); });
}
const avisosDe = (grupo, key) => { const r = FQ[grupo+'|'+key]; return r ? r.avisos : []; };
// Para quien revisa (no se muestra al vendedor): sin datos de cámara, editor, fecha vieja, repetida.
const senalesDe = (grupo, key) => { const r = FQ[grupo+'|'+key]; return r ? [...r.senales, ...(r.repetida ? ['Igual a otra foto'] : [])] : []; };
const CORTO_FQ = [[/datos de la cámara/,'Sin datos de la cámara'],[/editada/,'Parece editada'],[/foto del/,'Foto vieja'],[/resolución/,'Poca resolución'],[/oscura/,'Muy oscura'],[/clara/,'Muy clara'],[/movida/,'Movida o desenfocada'],[/igual a otra/,'Repetida']];
const corto = a => (CORTO_FQ.find(([r])=>r.test(a))||[,a])[1];
// M2 (14/10): las fotos del auto, solo con la cámara; la selfie, con la cámara de adelante; cédula, DNI, formulario 12 y libreta, cámara o galería.
const CAPTURA = (grupo, key) => key==='selfie' ? 'capture="user"' : (grupo==='fotos' || grupo==='danios') ? 'capture="environment"' : '';
// 16/10 (D-44): el input de archivo queda escondido (cámara del celular o galería, como antes); el botón abre la cámara de la web con la silueta.
const inputArchivo = (grupo, key, label) => `<input type="file" class="vh" id="f_${key}" accept="${grupo==='cert' ? 'image/*,application/pdf' : 'image/*'}" ${CAPTURA(grupo, key)} data-grupo="${grupo}" data-key="${key}" tabindex="-1" aria-label="${esc(label || 'Subir la foto')}">`;
function slot(grupo, key, label, hint){
  const v = S[grupo][key], av = avisosDe(grupo, key);
  return `<button type="button" class="shot ${v?'done':''} ${av.length?'aviso':''}" data-camara="${grupo}|${key}" aria-label="${esc(label)}: ${v?'sacarla de nuevo':'sacar la foto'}">${v ? (v==='ejemplo' ? placeholder('foto de ejemplo') : v==='idb' ? placeholder('cargando…') : `<img src="${v}" alt="">`) : ''}
    ${v?`<span class="ok-tag ${av.length?'warn':''}" aria-hidden="true">${av.length?'!':'✓'}</span>`:''}<b>${label}</b>${av.length?`<em class="fq">${esc(av.map(corto).join(' · '))}</em>`:hint?`<em>${hint}</em>`:''}</button>${inputArchivo(grupo, key, 'Subir ' + label)}`;
}
function ficha(){
  const k = String(kmNum()).padStart(6,'0');
  return `<div class="ficha"><header><span>Tu auto</span><span>${esc(S.anio)}</span></header><dl>
    <dt>Auto</dt><dd>${esc(nombreAuto())}</dd>
    <dt>Kilómetros</dt><dd><span class="odo">${[...k].map(d=>`<b>${d}</b>`).join('')}</span></dd>
    <dt>Patente</dt><dd>${esc(S.patente||'—')}</dd>
    <dt>Zona</dt><dd>${S.partido ? esc(zonaTexto()) + (S.cp ? ` (CP ${esc(S.cp)})` : '') : '—'}</dd>
    <dt>Datos</dt><dd>${esc(resumenAuto())}</dd>
    <dt>Estado</dt><dd>${resumenEstado()}</dd>
    <dt>Fotos</dt><dd>${OBLIG.filter(f=>S.fotos[f[0]]).length} de ${OBLIG.length}${S.fotos.motor ? ' + motor' : ''}</dd>
    <dt>Llaves</dt><dd>${S.llaves ? txt('llaves', S.llaves) : '—'}</dd>
    ${S.vpol==='si' && S.docs.f12 ? `<dt>Verificación</dt><dd>${S.papeles==='ok' ? '<span class="insignia">Verificación policial vigente</span>' : 'Formulario 12 cargado: revisamos la fecha'}</dd>` : ''}</dl></div>`;
}
const CORTO = {rayon_superficial:'rayón superficial', rayon_profundo:'rayón profundo o pintura saltada', abollon:'abollón', oxido:'óxido', granizo:'granizo',
  cambiar:'cubiertas para cambiar', piquete:'piquete chico en el parabrisas', rajado:'parabrisas rajado o vidrio roto', desgaste:'interior gastado',
  roturas:'interior roto o manchado', fallas_menores:'un detalle', falla_importante:'un problema importante', no_enfria:'el aire no enfría',
  alguno:'luz de falla encendida', leve:'choque chico, ya arreglado', grave:'choque fuerte', no_se:'no sabe si chocó'};
const nomParte = id => (PARTES.find(p=>p[0]===id)||[,id])[1].toLowerCase();
function resumenAuto(){
  // 13/10/2026: dueños, prenda y titulares salen del informe de dominio (no se preguntan). 15/10 (D-42): el GNC tampoco se pregunta: sale de la consulta del chequeo final
  const g = S.consultas==='ok' || S.consultas==='deuda' ? ({no:'sin GNC',vigente:'con GNC (oblea vigente)',vencida:'con GNC (oblea vencida)'}[gncConsulta()]) : '';
  const n = S.papeles==='ok' ? duenosInforme() : S.duenos;
  const d = {1:'primer dueño',2:'segundo dueño',3:'tercer dueño o más',ns:'no sabe cuántos dueños'}[n] || '';
  return [d && (d + (S.papeles==='ok' ? ' (según el informe)' : ' (declarado)')), g && g + ' (según la consulta)'].filter(Boolean).join(' · ') || '—';
}
function listaRevision(rev){   // lo que vimos en las fotos, en palabras
  const out = [];
  if (!rev) return out;
  for (const q of SUP.preguntas){
    if ((q.responde||'vendedor')!=='revision' || rev[q.id]==null) continue;
    const r = rev[q.id];
    if (q.tipo==='cantidad'){ for (const [o,n] of Object.entries(r)) if (n) out.push(q.id==='cubiertas' ? `${n} ${n===1?'cubierta':'cubiertas'} para cambiar` : `${n} ${n===1?'parte':'partes'} con ${CORTO[o]||o}`); }
    else { const o = q.opciones.find(x=>x.id===r); if (o && (o.pct || o.rev)) out.push(CORTO[o.id] || o.texto.toLowerCase()); }
  }
  return out;
}
function resumenEstado(){
  const malos = [], d = S.det;
  for (const q of SUP.preguntas){
    if ((q.responde||'vendedor')!=='vendedor') continue;
    if (q.id==='service'){ if (servicioDerivado()==='atrasado') malos.push(d.svLugar==='ns' ? 'sin historial de service' : 'service atrasado'); continue; }
    if (['duenos','libreta','cuidado'].includes(q.id)) continue;
    const o = q.opciones.find(x=>x.id===S.resp[q.id]);
    if (!(o && (o.pct || o.rev || o.id==='no_se'))) continue;
    let extra = '';
    if (q.id==='mecanica' && d.mecTxt) extra = ` (${d.mecTxt.trim()})`;
    if (q.id==='choques' && d.choqueDonde.length) extra = ` (${d.choqueDonde.map(x=>txt('choqueDonde',x).toLowerCase()).join(', ')})`;
    malos.push((CORTO[o.id] || o.texto.split(':')[0].toLowerCase()) + extra);
  }
  if (d.repintado==='si') malos.push('repintado: ' + d.repintadas.map(nomParte).join(', '));
  if (S.rev) malos.push(...listaRevision(S.rev));
  else if (S.daniosResp==='si') malos.push(`declaró daños por fuera (${Object.keys(S.danios).length} ${Object.keys(S.danios).length===1?'foto':'fotos'})`);
  return malos.length ? esc(malos.join('; ')) : 'Sin problemas declarados';
}
function notaInforme(){   // D-40: si lo declarado no coincide con el informe, manda el informe y se recalcula
  const a = S.ajusteInforme; if (!a) return '';
  return `<p class="note warn">En el informe del Registro figuran ${a.duenos} dueños (nos habías dicho ${a.declarado==='1'?'que sos el primero':a.declarado}). Ajustamos tu precio sugerido de ${M(a.antes)} a ${M(a.despues)}.${a.bajarMinimo ? ' Tu mínimo quedó por encima del rango nuevo: bajalo para salir a la subasta.' : ''}</p>`;
}
function notaRevision(e){   // N3: qué vimos en las fotos y cuánto movió el precio respecto de N2 (D-20, D-25)
  const vis = listaRevision(S.rev); if (!vis.length) return '';
  const antes = redondear(calcular(2).centro, 'cerca');
  return `<p class="note info">En las fotos vimos: ${esc(vis.join('; '))}. ${e.sugerido < antes ? `Por eso tu precio pasó de ${M(antes)} a ${M(e.sugerido)}.` : ''}</p>`;
}

// ------------------------------------------------------------ pantallas
const V = {};
// Cotizador por clics (D-28, pedido de Gonzalo 10/10): marca → modelo → año → versión → km, una pregunta por vez.
// Primero se muestran las marcas y modelos más vendidos (los relevados en Mercado Libre, D-22/D-23); "Ver todas" abre el catálogo completo.
const esPopular = mid => mid in MOTOR.FACTORES_MODELO;
const midDe = (ma, mo) => { const v = versionesDe(ma, mo)[0]; return v ? v[0].split('--').slice(0,2).join('--') : ''; };
const marcasPopulares = () => marcas().filter(ma => modelos(ma).some(mo => esPopular(midDe(ma, mo))));
// Patente primero (12/10/2026): patente → "¿Es tu auto?" → km. Si no aparece, la fuente falla o no es su auto: marca → modelo → año → versión → km,
// con la patente guardada y salteando lo que la fuente ya nos dio. patEstado: '' | 'buscando' | 'confirmar' | 'ok' (confirmó) | 'manual'.
function subpasoCotizador(){
  if (S.patEstado==='' || S.patEstado==='buscando') return 'patente';
  if (S.patEstado==='confirmar') return 'confirmar';
  return !S.marca ? 'marca' : !S.modelo ? 'modelo' : !S.anio ? 'anio' : !S.vid ? 'version' : 'km';
}
const ICONO_AUTO = `<svg width="26" height="18" viewBox="0 0 46 30" aria-hidden="true"><path d="M4 21h38M8 21l4-10c1-3 3-4 6-4h10c3 0 5 1 6 4l4 10" stroke="#B8E04A" stroke-width="3" fill="none" stroke-linejoin="round"></path><circle cx="13" cy="23" r="4" fill="#B8E04A"></circle><circle cx="33" cy="23" r="4" fill="#B8E04A"></circle></svg>`;
const ICONO_CANDADO = `<svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><rect x="4" y="9" width="12" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"></rect><path d="M7 9V6.5a3 3 0 0 1 6 0V9" fill="none" stroke="currentColor" stroke-width="1.8"></path></svg>`;
const PAT_PROTO = [['AE123FO','Se encuentra: AE 123 FO (Ford Focus)'],['AC456HL','Dos versiones parecidas: AC 456 HL (Toyota Hilux)'],['AD222RS','La versión se llama distinto en la fuente: AD 222 RS'],
  ['KJR482','Formato viejo, sin versión exacta: KJR 482 (VW Gol Trend)'],['AA000AA','No aparece: AA 000 AA'],['AF999ZZ','La búsqueda falla: AF 999 ZZ']];
const nomVersion = (ma, mo, id, anio) => { const v = versionesDe(ma, mo).find(v => v[0]===id); return v ? nomV(v, anio) : ''; };
function vistaPatente(){
  const buscando = S.patEstado==='buscando', ok = patOk(S.patente), err = S.patente && normPatente(S.patente).length>=6 && !ok;
  return `<h3>¿Cuál es la patente de tu auto?</h3>
    <label class="placa" for="c_patente"><span class="banda" aria-hidden="true">REPÚBLICA ARGENTINA</span>
    <input type="text" id="c_patente" value="${esc(S.patente)}" placeholder="AB 123 CD" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Patente" aria-describedby="h_cpat" ${buscando?'readonly':''}></label>
    <span class="err" id="e_cpat">${err?'Revisá la patente: tiene que ser como ABC 123 o AB 123 CD.':''}</span>
    <button class="btn" type="button" data-pbuscar aria-live="polite" ${ok && !buscando?'':'disabled'}>${buscando?'Buscando tu auto…':'Buscar mi auto'}</button>
    <p class="hint privacidad" id="h_cpat">${ICONO_CANDADO}<span>Las agencias no ven tu patente.</span></p>`;
}
function vistaConfirmar(){
  const m = S.patM, varias = S.patCands.length>1, nom = `${tituloCase(m.marca)} ${tituloCase(m.modelo)} ${m.anio}`;
  return `<h3>¿Es tu auto?</h3>
    <div class="pat-auto"><span class="ic">${ICONO_AUTO}</span><div><b>${esc(nom)}</b>${varias?'':`<small>${esc(nomVersion(m.marca, m.modelo, S.patCands[0], m.anio))}</small>`}</div></div>
    ${varias ? `<p class="hint" style="margin:0;font-size:14px">¿Cuál es tu versión? Figura en la cédula.</p>
      <div class="qops">${S.patCands.map(id => `<button class="qopt ${S.patSel===id?'sel':''}" type="button" data-pcand="${esc(id)}" aria-pressed="${S.patSel===id}">${esc(nomVersion(m.marca, m.modelo, id, m.anio))}</button>`).join('')}<button class="qopt" type="button" data-potraver>Otra versión</button></div>` : ''}
    <p class="hint" style="margin:0">Patente ${esc(fmtPatente(S.patente))}</p>
    <button class="btn" type="button" data-pconf ${S.patSel?'':'disabled'}>Sí, es mi auto</button>
    <button class="btn sec" type="button" data-pno>No es mi auto</button>
    ${varias?'':`<button class="btn link" type="button" data-potraver style="align-self:center">Es otra versión</button>`}`;
}
let patTk = 0;
async function buscarPat(){   // busca la patente y lleva el resultado a nuestro catálogo (patente.js)
  if (!patOk(S.patente) || S.patEstado==='buscando') return;
  S.patente = fmtPatente(S.patente);
  Object.assign(S, {patEstado:'buscando', patAuto:null, patM:null, patCands:[], patSel:'', patNota:'', marca:'', modelo:'', anio:'', vid:''});
  render(); const tk = ++patTk, p = S.patente;
  let r = null;
  try { r = await buscarPatente(p); } catch (e){ r = null; }
  if (tk!==patTk || S.patEstado!=='buscando' || S.paso!=='datos') return;
  if (!r) return aManual(`No pudimos buscar la patente ${p}. Elegí tu auto.`);
  if (!r.encontrada) return aManual(`No encontramos la patente ${p}. Elegí tu auto.`);
  const m = emparejarPatente(r.auto, CAT); S.patAuto = r.auto; S.patM = m;
  if (m.nivel==='version'){
    conTransicion('fwd', ()=>{ Object.assign(S, {patEstado:'confirmar', patCands:m.versiones, patSel:m.versiones.length===1 ? m.versiones[0] : ''}); S.anim='fwd'; render(true); });
    return;
  }
  // Encontrada, pero sin una versión parecida en el catálogo: se precarga lo que coincidió y el vendedor sigue desde ahí.
  const pre = {marca:m.marca, modelo:m.modelo, anio:m.anio};
  if (pre.anio){ const vs = versionesAnio(pre.marca, pre.modelo, pre.anio); if (vs.length===1) pre.vid = vs[0][0]; }
  const que = [tituloCase(m.marca), tituloCase(m.modelo), m.anio].filter(Boolean).join(' ');
  const falta = m.nivel==='anio' ? 'Elegí la versión.' : m.nivel==='modelo' ? 'Elegí el año y la versión.' : 'Elegí el modelo, el año y la versión.';
  aManual(m.nivel==='nada' ? `No encontramos los datos de la patente ${p}. Elegí tu auto.` : `Encontramos un ${que}. ${falta}`, m.nivel==='nada' ? {} : pre);
}
function aManual(nota, pre={}){
  conTransicion('fwd', ()=>{ Object.assign(S, {patEstado:'manual', marca:'', modelo:'', anio:'', vid:'', patNota:nota}, pre); S.anim='fwd'; render(true); });
}
V.datos = () => {
  const sp = subpasoCotizador(), orden = S.patEstado==='manual' ? ['patente','marca','modelo','anio','version','km'] : ['patente','confirmar','km'], n = orden.indexOf(sp)+1;
  const partes = [];
  if (S.patente && sp!=='patente' && sp!=='confirmar') partes.push(fmtPatente(S.patente));
  if (S.marca) partes.push(tituloCase(S.marca) + (S.modelo ? ' ' + tituloCase(S.modelo) : ''));
  if (S.anio) partes.push(S.anio);
  const v = vActual(); if (v) partes.push(nomV(v, S.anio));
  const opcion = (attr, val, txt, extra='') => `<button class="chip" type="button" data-${attr}="${esc(val)}" ${extra}>${esc(txt)}</button>`;
  let cuerpo = '';
  if (sp==='patente') cuerpo = vistaPatente();
  if (sp==='confirmar') cuerpo = vistaConfirmar();
  if (sp==='marca'){
    const pop = marcasPopulares(), lista = S.verTodasMarcas ? marcas() : pop;
    cuerpo = `<h3>¿Qué marca es?</h3><div class="opciones ${S.verTodasMarcas?'largas':''}">${lista.map(ma => opcion('pmarca', ma, tituloCase(ma))).join('')}</div>
      ${S.verTodasMarcas ? '' : `<button class="btn link" type="button" data-ptodas="marcas">Ver todas las marcas (${marcas().length})</button>`}`;
  }
  if (sp==='modelo'){
    const todos = modelos(S.marca), pop = todos.filter(mo => esPopular(midDe(S.marca, mo)));
    const lista = S.verTodosModelos || !pop.length ? todos : pop;
    cuerpo = `<h3>¿Qué modelo?</h3><div class="opciones ${lista.length>12?'largas':''}">${lista.map(mo => opcion('pmodelo', mo, tituloCase(mo))).join('')}</div>
      ${lista.length < todos.length ? `<button class="btn link" type="button" data-ptodas="modelos">Ver todos los modelos de ${esc(tituloCase(S.marca))} (${todos.length})</button>` : ''}`;
  }
  if (sp==='anio'){
    cuerpo = `<h3>¿De qué año?</h3><div class="opciones anios">${aniosDe(S.marca,S.modelo).map(a => opcion('panio', a, a)).join('')}</div>`;
  }
  if (sp==='version'){
    const vs = versionesAnio(S.marca,S.modelo,S.anio);
    cuerpo = `<h3>¿Qué versión?</h3><p class="hint" style="margin:0">Figura en la cédula. Si dudás, elegí la más parecida.</p>
      <div class="opciones lista">${vs.map(x => opcion('pver', x[0], nomV(x, S.anio))).join('')}</div>`;
  }
  if (sp==='km'){
    const km = kmNum(), kmErr = S.km!=='' && (!(km>=0) || km>600000), ok = S.km!=='' && !kmErr;
    cuerpo = `<label class="f" for="s_km"><span style="font-family:var(--f-display);font-size:22px;font-weight:600">¿Cuántos kilómetros tiene?</span>
      <div class="money"><input type="text" inputmode="numeric" id="s_km" value="${esc(S.km)}" placeholder="Por ejemplo, 62.000" autocomplete="off"><span>km</span></div>
      <span class="err" id="e_km">${kmErr?'Revisá los kilómetros: tiene que ser un número entre 0 y 600.000.':''}</span></label>
      <button class="btn" data-go="rango1" type="button" ${ok?'':'disabled'}>Ver cuánto vale</button>`;
  }
  const nota = S.patNota && ['marca','modelo','anio','version'].includes(sp) ? `<p class="note info">${esc(S.patNota)}</p>` : '';
  const proto = sp==='patente' && S.patEstado!=='buscando' ? PAT_PROTO.map(([p,tx]) => `<button type="button" data-pejemplo="${p}">Probar patente · ${esc(tx)}</button>`).join('') : '';
  const seguir = S.pasoGuardado && !EN_INICIO.includes(S.pasoGuardado) ? `<div class="note info seguir"><span>Tenés ${S.vid ? 'tu <b>'+esc(tituloCase(S.marca)+' '+tituloCase(S.modelo))+'</b>' : 'tu auto'} a medio cargar.</span>
    <button class="btn" type="button" data-seguir>Seguir donde quedé</button><button class="btn link" type="button" data-denuevo>Empezar de nuevo</button></div>` : '';
  return `<div class="screen cotizador ${sp==='patente' ? 'paso1' : ''}">${seguir}
    <div class="cot-top"><div><span class="kicker">Gratis · en un minuto</span><h2>Cotizá tu auto</h2></div><span class="count">Paso ${n} de ${orden.length}</span></div>
    <div class="miniprog" aria-hidden="true"><i style="width:${n/orden.length*100}%"></i></div>
    ${partes.length && sp!=='patente' && sp!=='confirmar' ? `<div class="elegido"><span>${esc(partes.join(' · '))}</span><button class="btn link" type="button" data-patras>Cambiar</button></div>` : ''}
    <div class="qcard${S.anim ? ' entra-'+S.anim : ''}">${nota}${cuerpo}</div>
    <div class="proto"><span class="tag">Solo prototipo</span>${proto}<button type="button" data-ejemplo="cotizar">Completar con un auto de ejemplo y ver el precio</button></div></div>`;
};

// D-48 (16/10): con cada precio, el equivalente en dólares y el MEP usado (día hábil anterior). El pago sigue siendo en pesos.
const DIA_SEM = d => `${d.toLocaleDateString('es-AR', {weekday:'long'})} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
const dolarHTML = (e, pesos) => {   // D-51: sin cifra, el rango en dólares
  const u = x => (Math.round(x/e.mep.valor/100)*100).toLocaleString('es-AR');
  const usd = pesos ? u(pesos) : `${u(e.minimo)} a ${u(e.maximo)}`;
  const mep = e.mep.valor.toLocaleString('es-AR', {minimumFractionDigits:2, maximumFractionDigits:2});
  return `<p class="fine dolar">≈ US$&nbsp;${usd} · dólar MEP del ${DIA_SEM(e.mep.fecha)}: $&nbsp;${mep}${e.mep.aviso ? '. ' + esc(e.mep.aviso) : ''}</p>`;
};

// 17/10 (Gonzalo): fuera de AMBA, le ofrecemos avisarle por WhatsApp cuando lleguemos a su zona. Solo el número (y el CP que ya dio).
const celValido = c => { const d = String(c||'').replace(/\D/g,''); return d.length>=10 && d.length<=13; };
function avisoZonaHTML(){
  if (S.avisoZona) return `<p class="note ok">Listo. Te escribimos al <b>${esc(S.cel)}</b> cuando empecemos a trabajar en tu zona.</p>`;
  return `<div class="aviso-zona"><label class="f" for="z_cel"><span style="font-weight:600;font-size:16px">¿Te avisamos por WhatsApp cuando lleguemos a tu zona?</span>
    <input type="tel" id="z_cel" value="${esc(S.cel)}" placeholder="11 2345 6789" autocomplete="tel"></label>
    <button class="btn" type="button" data-avisozona ${celValido(S.cel)?'':'disabled'}>Avisame</button></div>`;
}
V.rango1 = () => {
  const e = calcular(1); S.prev = e;
  return `<div class="screen"><span class="kicker">Tu primer precio</span>
  <p class="phrase">Según nuestro sondeo y el mercado de hoy, un <b>${esc(nombreAuto())}</b> con ${KM(kmNum())} km en buen estado probablemente se venda a agencias entre:</p>
  ${cifraHTML(e)}${dolarHTML(e)}${precision(1)}
  ${porQueHTML(e)}${ACLARA}
  ${S.partido==='otro' ? `<p class="note warn">Por ahora solo conseguimos ofertas en Capital y Gran Buenos Aires.</p>
  ${avisoZonaHTML()}
  <div class="actions"><button class="btn sec" data-cpcambiar1 type="button">Cambiar el código postal</button><button class="btn link" data-go="datos" type="button">Cambiar los datos del auto</button></div></div>` : `
  <p class="lead"><b style="color:var(--ink)">¿Querés ofertas reales?</b> Te lleva unos 20 minutos desde el celular.</p>
  <div class="actions"><button class="btn" data-go="registro" type="button">Quiero vender mi auto</button><button class="btn link" data-go="datos" type="button">Cambiar los datos del auto</button></div></div>`}`;   // 17/10: fuera de AMBA ve el precio pero no puede seguir
};

const CUANDO = [['30dias','En los próximos 30 días'],['meses','En unos meses'],['saber','Solo quería saber cuánto vale']];
// 19/10: en la web publicada (cuenta real con Supabase) el código llega al mail, así que también se pide el mail.
const cuentaReal = () => !!window.YacarCuenta?.real;
const mailOk = m => /^\S+@\S+\.\S+$/.test(String(m||'').trim());
const registroOk = () => { const dg = S.cel.replace(/\D/g,''); return !!(S.nombre.trim() && dg.length>=10 && dg.length<=13 && (!cuentaReal() || mailOk(S.email))); };
V.registro = () => {   // M5 (14/10): solo nombre y celular; "¿cuándo lo querés vender?" pasa a una tarjeta después del código
  const digits = S.cel.replace(/\D/g,''), okCel = digits.length>=10 && digits.length<=13, ok = registroOk();
  return `<div class="screen"><span class="kicker">Para guardar tu cotización</span><h2>¿Cómo te contactamos?</h2>
  <p class="lead">Las agencias no ven tus datos hasta que vendés.</p>
  <label class="f" for="r_nombre">Nombre<input type="text" id="r_nombre" value="${esc(S.nombre)}" autocomplete="given-name" autocapitalize="words"></label>
  <label class="f" for="r_cel">Celular con WhatsApp<input type="tel" id="r_cel" value="${esc(S.cel)}" placeholder="11 2345 6789" autocomplete="tel"><span class="err" id="e_cel">${S.cel&&!okCel?'Escribí el número con código de área (ej. 11 2345 6789).':''}</span></label>
  ${cuentaReal()?`<label class="f" for="r_email">Mail<input type="email" id="r_email" value="${esc(S.email)}" placeholder="nombre@gmail.com" autocomplete="email" inputmode="email"><span class="hint">Te mandamos ahí un código para entrar, sin contraseña.</span></label>`:''}
  <div class="proto"><span class="tag">Solo prototipo</span><button type="button" data-ejemplo="registro">Completar con datos de ejemplo</button></div>
  <div class="actions">${faltaHTML(faltaRegistro())}<button class="btn" data-go="codigo" type="button" ${ok?'':'disabled'}>Seguir</button></div></div>`;
};
function faltaRegistro(){
  const dg = S.cel.replace(/\D/g,''), f = [];
  if (!S.nombre.trim()) f.push('tu nombre');
  if (!(dg.length>=10 && dg.length<=13)) f.push('tu celular con código de área');
  if (cuentaReal() && !mailOk(S.email)) f.push('tu mail');
  return f.length ? 'Falta: ' + f.join(' y ') + '.' : '';
}
function mandarCodigo(){
  YacarCuenta.codigoVendedor(S.email.trim(), {nombre:S.nombre.trim(), celular:S.cel})
    .catch(e => { S.codErr = YacarCuenta.msj(e); S.codEnviado = 0; if (S.paso==='codigo') render(); });
}
function verificarCodigo(){
  if (!/^\d{6}$/.test(S.codigo) || S.codVerif) return;
  S.codVerif = true; S.codErr = ''; render();
  YacarCuenta.verificarVendedor(S.email.trim(), S.codigo)
    .then(() => { S.codVerif = false; if (S.paso==='codigo') go('auto'); })
    .catch(e => { S.codVerif = false; S.codigo = ''; S.codErr = YacarCuenta.msj(e); render(); $('#r_cod')?.focus(); });
}
const segReenvio = () => Math.max(0, 30 - Math.floor((Date.now() - (S.codEnviado||0))/1000));
const txtReenvio = () => { const s = segReenvio(); return s>0 ? `¿No te llegó? Reenviar en 0:${String(s).padStart(2,'0')}` : '¿No te llegó? Reenviar el código'; };
// 12/10/2026: entrar con un código por WhatsApp crea la cuenta (sin contraseña). Si deja la carga a medias, le mandamos un link para seguir.
V.codigo = () => {
  const ok = /^\d{6}$/.test(S.codigo);
  if (cuentaReal()) return `<div class="screen"><span class="kicker">Tu cuenta</span><h2>Te mandamos un código a tu mail</h2>
  <p class="lead">Lo enviamos a <b>${esc(S.email)}</b>. Puede tardar un minuto: si no lo ves, revisá Spam o Promociones. No hace falta contraseña.</p>
  <label class="f" for="r_cod">Código de 6 números<input type="text" id="r_cod" inputmode="numeric" autocomplete="one-time-code" maxlength="6" value="${esc(S.codigo)}" placeholder="123456" style="font-size:24px;letter-spacing:.3em" ${S.codVerif?'disabled':''}></label>
  ${S.codVerif?'<p class="note info" role="status">Revisando el código…</p>':''}${S.codErr?`<p class="note bad" role="alert">${esc(S.codErr)}</p>`:''}
  <div class="reenvio"><button class="btn link" type="button" id="r_reenv" data-reenviar ${segReenvio()>0?'disabled':''}>${txtReenvio()}</button><button class="btn link" type="button" data-go="registro">Cambiar el mail</button></div>
  <div class="actions"><button class="btn" data-codok type="button" id="r_codgo" ${ok&&!S.codVerif?'':'disabled'}>Seguir</button></div></div>`;
  return `<div class="screen"><span class="kicker">Tu cuenta</span><h2>Te mandamos un código por WhatsApp</h2>
  <p class="lead">Lo enviamos al <b>${esc(S.cel||'')}</b>. No hace falta contraseña.</p>
  <label class="f" for="r_cod">Código de 6 números<input type="text" id="r_cod" inputmode="numeric" autocomplete="one-time-code" maxlength="6" value="${esc(S.codigo)}" placeholder="123456" style="font-size:24px;letter-spacing:.3em"></label>
  <div class="reenvio"><button class="btn link" type="button" id="r_reenv" data-reenviar ${segReenvio()>0?'disabled':''}>${txtReenvio()}</button><button class="btn link" type="button" data-sms>Mandármelo por SMS</button><button class="btn link" type="button" data-go="registro">Cambiar el número</button></div>
  <div class="proto"><span class="tag">Solo prototipo</span><button type="button" data-ejemplo="codigo">Completar con un código de ejemplo</button></div>
  <div class="actions"><button class="btn" data-go="auto" type="button" id="r_codgo" ${ok?'':'disabled'}>Seguir</button></div></div>`;
};

const patOk = p => /^[A-Z]{3}\d{3}$|^[A-Z]{2}\d{3}[A-Z]{2}$/.test(String(p).replace(/[\s.-]/g,'').toUpperCase());
const autoOk = () => patOk(S.patente) && S.partido && S.partido!=='otro' && S.duenos;
const radios = (grupo, val, attr) => OP[grupo].map(([v,tx]) => `<label class="opt" for="r_${grupo}_${v}"><input type="radio" name="r_${grupo}" id="r_${grupo}_${v}" value="${v}" ${val===v?'checked':''} ${attr}="${grupo}"><span>${esc(tx)}</span></label>`).join('');
const chipsMulti = (lista, sel, attr, campo) => `<div class="chips">${lista.map(([v,tx]) => `<button type="button" class="chip" ${attr}="${campo}|${v}" aria-pressed="${sel.includes(v)?'true':'false'}">${esc(tx)}</button>`).join('')}</div>`;
const fotosOk = () => OBLIG.every(f=>S.fotos[f[0]]) && !!S.daniosResp && (S.daniosResp==='no' || Object.keys(S.danios).length>0);
const ICONO_CAMARA = `<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.6" fill="none" stroke="currentColor" stroke-width="2"/></svg>`;
function entrarFotos(){   // a dónde entra: lo que falta primero
  if (fotosOk()){ S.fotoFase = 'resumen'; return; }
  if (!S.daniosResp){ S.fotoFase = 'inicio'; return; }
  const i = SECUENCIA.findIndex(k => !S.fotos[k]);
  if (i < 0){ S.fotoFase = S.daniosResp==='si' && !Object.keys(S.danios).length ? 'danios' : 'resumen'; return; }
  S.fotoFase = 'foto'; S.fotoIdx = i;
}
// 18/10 (Gonzalo: "que fluya"): las fotos que faltan, en una sola sesión de cámara (camara.js). Daños después de las de afuera; corte antes de las de adentro.
function listaSesion(){
  const l = [], adentro = SECUENCIA.slice(AFUERA).filter(k => !S.fotos[k]).length;
  SECUENCIA.forEach((k, i) => {
    if (i===AFUERA && S.daniosResp==='si' && !Object.keys(S.danios).length) l.push({g:'danios', k:'d1', corte:['Ahora, los daños', 'Una foto de cerca de cada golpe, rayón o cosa rota.']});
    if (!S.fotos[k]) l.push({g:'fotos', k});
  });
  const j = l.findIndex(p => p.g==='fotos' && SECUENCIA.indexOf(p.k) >= AFUERA);
  if (j > 0) l[j] = Object.assign({}, l[j], {corte:['¡Listo afuera!', 'Ahora las de adentro. Empezá por la puerta del conductor.']});
  if (l[0]) l[0] = Object.assign({}, l[0], {corte:null});
  return l;
}
function empezarSesion(){
  return Camara.sesion(listaSesion(), pausa => {
    S.fotoVolver = false; S.fotoFase = ''; entrarFotos(); ultimaClave = ''; render(true);
    aviso(pausa ? 'Guardamos tus fotos. Seguí cuando quieras.' : fotosOk() ? '¡Listo! Revisá tus fotos.' : 'Te quedan algunas fotos.');
  });
}
function irFase(f, i, dir='fwd'){ conTransicion(dir, ()=>{ S.fotoFase = f; if (i!=null) S.fotoIdx = i; S.anim = dir; render(true); }); }
function fotoSiguiente(){
  const f = S.fotoFase, i = S.fotoIdx;
  if (S.fotoVolver){ S.fotoVolver = false; return irFase('resumen'); }
  if (f==='danios') return irFase('finAfuera');
  if (i===AFUERA-1) return irFase(S.daniosResp==='si' ? 'danios' : 'finAfuera');
  if (i>=SECUENCIA.length-1) return irFase('resumen');
  irFase('foto', i+1);
}
function fotoAtrasLocal(){
  const f = S.fotoFase, i = S.fotoIdx;
  if (f==='inicio' || !f) return go('rango2', {alFinal:true});
  if (f==='foto' && i===0) return irFase('inicio', null, 'back');
  if (f==='foto' && i===AFUERA) return irFase('finAfuera', null, 'back');
  if (f==='foto') return irFase('foto', i-1, 'back');
  if (f==='danios') return irFase('foto', AFUERA-1, 'back');
  if (f==='finAfuera') return irFase(S.daniosResp==='si' ? 'danios' : 'foto', AFUERA-1, 'back');
  return irFase('foto', SECUENCIA.length-1, 'back');
}
function imgFoto(v, alt){ return v==='ejemplo' ? placeholder('foto de ejemplo') : v==='idb' ? placeholder('cargando…') : `<img src="${v}" alt="${esc(alt)}">`; }
function tileFoto(f){   // resumen: cada foto es un botón que lleva a su pantalla (verla o sacarla de nuevo)
  const v = S.fotos[f[0]], av = avisosDe('fotos', f[0]);
  return `<button type="button" class="shot ${v?'done':''} ${av.length?'aviso':''}" data-irfoto="${SECUENCIA.indexOf(f[0])}" aria-label="${esc(f[1])}${v?'':': falta'}">${v ? imgFoto(v, f[1]) : ''}
    ${v?`<span class="ok-tag ${av.length?'warn':''}" aria-hidden="true">${av.length?'!':'✓'}</span>`:''}<b>${esc(f[1])}</b>${av.length?`<em class="fq">${esc(av.map(corto).join(' · '))}</em>`:v?'':OPCIONALES.includes(f[0])?'<em>Opcional</em>':'<em class="falta-tag">Falta</em>'}</button>`;
}
const camBtn = (k, txt, cls='') => `<button class="btn cam ${cls}" type="button" data-camara="fotos|${k}">${ICONO_CAMARA}${txt}</button>${inputArchivo('fotos', k, 'Sacar la foto: ' + TITULO_FOTO[k])}`;
V.fotos = () => {
  if (!S.fotoFase) entrarFotos();
  const f = S.fotoFase, n = OBLIG.filter(x=>S.fotos[x[0]]).length, anim = S.anim ? ' entra-'+S.anim : '';
  let kick = '', cuerpo = '', acciones = '';
  if (f==='inicio'){
    kick = `Fotos · ${n} de ${OBLIG.length}`;
    cuerpo = `<h3 class="ftit">Ahora, las fotos del auto</h3>
      <p class="lead" style="font-size:16px">La cámara te guía foto por foto: 6 de afuera y 4 de adentro (más el motor, si querés). Unos 6 minutos.</p>
      <div class="note info"><ul class="fq-lista"><li>De día, sin sol de frente</li><li>Auto limpio y seco</li><li>Sin filtros ni zoom</li></ul></div>
      <h3 style="font-size:21px;margin-top:4px">¿Tiene golpes, rayones o algo roto por fuera?</h3><p class="hint" style="margin:0">Aunque sea chico.</p>
      <div class="qops">${OP.daniosResp.map(([v,t])=>`<button class="qopt ${S.daniosResp===v?'sel':''}" type="button" data-dr="${v}" aria-pressed="${S.daniosResp===v}">${t}</button>`).join('')}</div>
      ${S.daniosResp==='si' ? '<p class="note info">Después te pedimos una foto de cada daño.</p>' : ''}`;
    acciones = `<div class="actions">${faltaHTML(S.daniosResp ? '' : 'Falta: contarnos si tiene golpes o rayones.')}<button class="btn" type="button" data-fempezar ${S.daniosResp?'':'disabled'}>Empezar con las fotos</button><button class="btn link" type="button" data-go="rango2">Volver a mi precio</button></div>`;
  } else if (f==='foto'){
    const i = S.fotoIdx, k = SECUENCIA[i], v = S.fotos[k], r = FQ['fotos|'+k], afuera = i < AFUERA;
    kick = afuera ? `Afuera · foto ${i+1} de ${AFUERA}` : `Adentro · foto ${i-AFUERA+1} de ${SECUENCIA.length-AFUERA}`;
    if (!v){
      cuerpo = `<h3 class="ftit">${esc(TITULO_FOTO[k])}</h3><div class="dibujo">${dibujo(k)}</div><ul class="consejos">${CONSEJOS[k].map(c=>`<li>${esc(c)}</li>`).join('')}</ul>`;
      acciones = `<div class="actions"><button class="btn cam" type="button" data-fsesion="${k}">${ICONO_CAMARA}Sacar la foto</button>${inputArchivo('fotos', k, 'Sacar la foto: ' + TITULO_FOTO[k])}
        <div class="fila-link"><button class="btn link" type="button" data-fsaltar>Saltear por ahora</button><button class="btn link" type="button" data-fmastarde>Seguir más tarde</button></div></div>`;
    } else {
      const malo = !!(r && r.avisos.length);
      const estado = v==='ejemplo' ? `<p class="note info">Foto de ejemplo del prototipo.</p>` : v==='idb' ? '' : !r ? `<p class="note info" role="status">Revisando la foto…</p>`
        : malo ? `<div class="note warn" role="status"><b>${esc(r.avisos.join('. '))}.</b> Te conviene sacarla de nuevo.</div>`
        : `<p class="note ok" role="status">Se ve bien ✓${S.fotoVolver || v==='ejemplo' ? '' : ' Seguimos…'}</p>`;
      cuerpo = `<h3 class="ftit">${esc(TITULO_FOTO[k])}</h3><div class="fprev">${imgFoto(v, 'Tu foto: '+TITULO_FOTO[k])}<span>Tu foto</span></div>${estado}`;
      const usar = `<button class="btn ${malo?'sec':''}" type="button" data-fsig>${malo ? 'Usar esta igual' : S.fotoVolver ? 'Listo, volver a mis fotos' : 'Usar esta y seguir'}</button>`;
      const otra = camBtn(k, 'Sacarla de nuevo', malo ? '' : 'sec');
      acciones = `<div class="actions">${malo ? otra + usar : usar + otra}</div>`;
    }
  } else if (f==='danios'){
    const nd = Object.keys(S.danios).length, sl = [];
    for (let j=1; j<=S.nDanios; j++) sl.push(slot('danios', 'd'+j, 'Daño '+j, 'De cerca'));
    kick = 'Afuera · daños';
    cuerpo = `<h3 class="ftit">Una foto de cerca de cada daño</h3>
      <div class="grid2">${sl.join('')}</div>${S.nDanios<8 ? '<button type="button" class="chip" data-masdanio="1">Agregar otro daño</button>' : ''}`;
    acciones = `<div class="actions">${faltaHTML(nd ? '' : 'Falta: la foto de al menos un daño.')}<button class="btn" type="button" data-fsig ${nd?'':'disabled'}>Seguir</button><button class="btn link" type="button" data-dr2="no">En realidad no tiene daños</button></div>`;
  } else if (f==='finAfuera'){
    const faltan = SECUENCIA.slice(0, AFUERA).filter(k=>!S.fotos[k]);
    kick = 'Afuera · listo';
    cuerpo = `<h3 class="ftit">¡Listo afuera!</h3>
      <div class="miniaturas">${SECUENCIA.slice(0, AFUERA).map(k=>S.fotos[k] ? `<span>${imgFoto(S.fotos[k], TITULO_FOTO[k])}</span>` : `<span class="vacia">Falta</span>`).join('')}${Object.values(S.danios).map(v=>`<span>${imgFoto(v,'Daño')}</span>`).join('')}</div>
      ${faltan.length ? `<p class="note warn">${faltan.length===1?'Falta':'Faltan'}: ${esc(faltan.map(k=>TITULO_FOTO[k].toLowerCase()).join(', '))}. Podés sacarlas al final.</p>` : ''}
      <p class="note info">Ahora ${SECUENCIA.length-AFUERA} de adentro: unos 3 minutos.</p>`;
    acciones = `<div class="actions"><button class="btn" type="button" data-fadentro>Seguir con las de adentro</button><button class="btn sec" type="button" data-fmastarde>Seguir más tarde</button></div>`;
  } else {   // resumen
    const faltan = OBLIG.filter(x=>!S.fotos[x[0]]).map(x=>x[1]), malas = FOTOS.filter(x=>avisosDe('fotos', x[0]).length);
    const faltaD = S.daniosResp==='si' && !Object.keys(S.danios).length;
    kick = `Fotos · ${n} de ${OBLIG.length}`;
    cuerpo = `<h3 class="ftit">Tus fotos</h3><p class="hint" style="margin:0">Tocá una para verla o cambiarla.</p>
      ${malas.length ? `<p class="note warn"><b>Revisá ${malas.length===1?'1 foto':malas.length+' fotos'}</b> (las del signo !).</p>` : ''}
      <div class="grid2">${FOTOS.map(tileFoto).join('')}</div>
      ${S.daniosResp==='si' ? `<p class="sub-t">Daños</p><div class="grid2">${Array.from({length:S.nDanios}, (_,j)=>slot('danios','d'+(j+1),'Daño '+(j+1),'De cerca')).join('')}</div>${S.nDanios<8 ? '<button type="button" class="chip" data-masdanio="1">Agregar otro daño</button>' : ''}` : ''}`;
    const falta = [...faltan.map(x=>x.toLowerCase()), ...(faltaD ? ['la foto de al menos un daño'] : [])];
    acciones = `<div class="actions">${faltaHTML(falta.length ? 'Falta: ' + conY(falta) + '.' : '')}<button class="btn" data-go="verificando" type="button" ${fotosOk()?'':'disabled'}>Enviar las fotos para revisar</button><button class="btn link" data-go="rango2" type="button">Volver a mi precio</button></div>`;
  }
  return `<div class="screen qscreen fotos-guiadas">
    <div class="qhead"><span class="kicker">${kick}</span>${f!=='inicio' ? '<button class="btn link" type="button" data-fatras>Atrás</button>' : ''}</div>
    <div class="qcard${anim}">${cuerpo}</div>
    <div class="proto"><span class="tag">Solo prototipo</span><button type="button" data-ejemplo="fotos">Completar con fotos de ejemplo, sin daños</button><button type="button" data-ejemplo="fotos2">Completar con fotos de ejemplo y 2 daños</button></div>
    ${acciones}</div>`;
};

// ------------------------------------------------------------ preguntas de a una (v5.2, pedido de Gonzalo 10/10)
// Cada pregunta es una tarjeta: al tocar una opción se guarda y pasa sola a la siguiente, con una transición corta.
// Si la opción necesita un detalle (qué falla, dónde fue el choque, qué partes se repintaron) aparece abajo con "Seguir".

// Código postal → localidad y partido (AMBA). Tabla aproximada armada para el prototipo: siempre se le pide al vendedor que confirme.
// Para la web real: reemplazar por una base oficial de códigos postales (Correo Argentino / localidades INDEC).
const CP_AMBA = /*@json:cp_amba.json*/null;
const BARRIOS_CABA = /*@json:barrios_caba.json*/null;
// CP de CABA → barrios probables (el primero es el más probable). Aproximado: un CP puede cruzar barrios, por eso se ofrece elegir.
const CP_CABA = /*@json:cp_caba.json*/null;
const barriosDeCP = n => (CP_CABA.find(r => n>=r[0] && n<=r[1]) || [,,[]])[2];
function buscarCP(txt){
  const t = String(txt).toUpperCase().replace(/[\s.-]/g,'');
  const m = t.match(/^([A-Z])?(\d{4})([A-Z]{3})?$/);
  if (!m) return {error:true};
  const cp = m[2], n = +cp, letra = m[1];
  if (letra && letra!=='C' && letra!=='B') return {fuera:true, cp};
  if (n>=1000 && n<=1499) return {cp, localidad:'', partido:'Ciudad de Buenos Aires', barrios:barriosDeCP(n)};
  const z = CP_AMBA[cp];
  if (z) return {cp, localidad:z[0], partido:z[1]};
  if (n>=1600 && n<=1999) return {cp, desconocido:true};
  return {fuera:true, cp};
}
const zonaTexto = () => S.partido==='Ciudad de Buenos Aires' ? (S.localidad ? S.localidad+', CABA' : 'Ciudad de Buenos Aires') : [S.localidad && S.localidad!==S.partido ? S.localidad : '', S.partido].filter(Boolean).join(', ');

const Qd = id => SUP.preguntas.find(q=>q.id===id);
// 18/10 (menos texto): en pantalla, las opciones largas del estado van con un título corto y el detalle en chico. Mismo significado.
const OP_CORTA = {fallas_menores:['Sí, un detalle','Un ruido, una vibración, el aire o algo eléctrico'], falla_importante:['Sí, algo importante','Motor o caja, no arranca, pierde aceite o agua'],
  leve:['Un choque chico, ya arreglado','Paragolpes, óptica, puerta o guardabarros'], grave:['Un choque fuerte','Estructura, airbags o destrucción total'], no_se:['No sé','Lo compré usado'],
  mixto:['Oficial y después en un taller',''], oficial:['Siempre en el oficial',''], taller:['Siempre en un taller',''], ns:null};
const opTxt = (q, v, tx) => { const c = (q.id==='mecanica'||q.id==='choques'||q.id==='sv_lugar') && OP_CORTA[v]; return c ? `<span>${esc(c[0])}${c[1] ? `<small class="qsub">${esc(c[1])}</small>` : ''}</span>` : esc(tx); };
const opsQ = id => Qd(id).opciones.map(o=>[o.id, o.texto]);
const QS = {
  auto: () => [
    {id:'cuando', titulo:'¿Cuándo lo querés vender?', ops:()=>CUANDO, get:()=>S.cuando, set:v=>{S.cuando=v;}, ok:()=>!!S.cuando},
    {id:'cp', tipo:'cp', ok:()=>!!S.partido && (S.partido!=='otro' || !!S.cpFueraOk)},   // 17/10: fuera de AMBA puede seguir y ver el precio (no puede vender)
    {id:'duenos', titulo:'¿Sos el primer dueño?', ops:()=>[['1','Sí'],['2','No']], get:()=>S.duenos ? (S.duenos==='1' ? '1' : '2') : '', set:v=>{S.duenos=v;}, ok:()=>!!S.duenos}],   // D-42: el GNC no se pregunta, sale de la consulta. 17/10: "¿Sos el primer dueño?" (Sí → 1, No → 2; el informe de dominio corrige)
  estado: () => [
    {id:'mecanica', titulo:Qd('mecanica').pregunta, hint:'Contalo como está hoy: lo que no declares puede bajar la oferta en la visita.',
      ops:()=>opsQ('mecanica'), get:()=>S.resp.mecanica, set:v=>{S.resp.mecanica=v;}, ok:()=>respOk('mecanica'),
      extra:v=> v==='fallas_menores' ? `<label class="f" for="d_mec">¿Qué es?<textarea id="d_mec" placeholder="Ej.: el aire no enfría">${esc(S.det.mecTxt)}</textarea></label>` : ''},
    {id:'choques', titulo:Qd('choques').pregunta, ops:()=>opsQ('choques'), get:()=>S.resp.choques, set:v=>{S.resp.choques=v;}, ok:()=>respOk('choques'),
      extra:v=> v==='leve' ? `<p class="sub-t">¿Dónde fue?</p>${chipsMulti(OP.choqueDonde, S.det.choqueDonde, 'data-multi', 'choqueDonde')}` : ''},
    {id:'repintado', titulo:'¿Alguna parte fue repintada?', hint:'Aunque haya quedado bien: las agencias lo miden.',
      ops:()=>OP.repintado, get:()=>S.det.repintado, set:v=>{S.det.repintado=v; if (v!=='si') S.det.repintadas=[];}, ok:()=>respOk('repintado'),
      extra:v=> v==='si' ? `<p class="sub-t">¿Cuáles?</p>${chipsMulti(PARTES, S.det.repintadas, 'data-multi', 'repintadas')}` : ''},
    {id:'sv_lugar', titulo:'¿Dónde le hiciste los services?', ops:()=>OP.svLugar, get:()=>S.det.svLugar, set:v=>{S.det.svLugar=v; if (v!=='oficial' && v!=='mixto') S.svfoto={};}, ok:()=>respOk('sv_lugar'),
      extra:v=> (v==='oficial' || v==='mixto') ? `<p class="sub-t">Foto de la libreta sellada (opcional, suma)</p><div class="grid2">${slot('svfoto','libreta','Libreta de service','Las páginas con los sellos')}</div>` : ''},
    {id:'sv_cuando', titulo:'¿Cuándo fue el último service?', ops:()=>OP.svCuando, get:()=>S.det.svCuando, set:v=>{S.det.svCuando=v;}, ok:()=>respOk('sv_cuando')},
    {id:'llaves', titulo:'¿Cuántas llaves tenés?', ops:()=>OP.llaves, get:()=>S.llaves, set:v=>{S.llaves=v;}, ok:()=>!!S.llaves}],   // 18/10: antes era una foto
  documentos: () => [
    {id:'titular', titulo:'¿El auto está a tu nombre?', lead:'Último paso. Prendas, embargos y dueños los sacamos del Registro: no te los preguntamos.',
      ops:()=>OP.titular, get:()=>S.titular, set:v=>{S.titular=v;}, ok:()=>!!S.titular && S.titular!=='no',
      extra:v=> v==='compartido' ? `<p class="note info">Podés publicarlo. El día de la venta firma también el otro titular.</p>`
        : v==='no' ? `<p class="note bad">Por ahora solo publicamos autos a nombre de quien los vende. El titular lo puede cargar con su WhatsApp.</p>` : ''},
    // 16/10 (D-44): el informe trae el número de título, pero no dice si el vendedor lo tiene. Sin título, la transferencia se traba.
    {id:'titulo', titulo:'¿Tenés el título del auto?', hint:'Lo vas a necesitar el día de la venta.',
      ops:()=>OP.titulo, get:()=>S.titulo, set:v=>{S.titulo=v;}, ok:()=>!!S.titulo,
      extra:v=> v==='no' ? `<p class="note info">Podés publicarlo. Antes de la entrega sacás un duplicado: te explicamos cómo.</p>` : ''},
    {id:'vpol', titulo:'¿Tenés la verificación policial vigente?', hint:'Opcional. Si la tenés, tu auto suma una insignia.',
      ops:()=>OP.vpol, get:()=>S.vpol, set:v=>{S.vpol=v; if (v!=='si') delete S.docs.f12;}, ok:()=>!!S.vpol && (S.vpol!=='si' || !!S.docs.f12),
      extra:v=> v==='si' ? `<p class="sub-t">Sacale una foto al formulario 12</p><div class="grid2">${slot('docs','f12','Formulario 12','Que se lea la fecha y la patente')}</div>` : ''},
    {id:'docs', tipo:'docs', ok:()=>DOCS.every(d=>S.docs[d[0]])},
    {id:'dni', tipo:'dni', ok:identidadOk}]
};
QS.previo = QS.auto;   // 17/10: las mismas 3 preguntas, antes de los km
const Q_SIG = {previo:'datos', auto:'estado', estado:'rango2', documentos:'enviado'};
const Q_ANT = {previo:'datos', auto:'codigo', estado:'auto', documentos:'confirmar'};
const Q_TIT = {previo:'Sobre tu auto', auto:'Sobre tu auto', estado:'Estado del auto', documentos:'Papeles'};
const Q_PROTO = {
  previo:`<button type="button" data-ejemplo="previo">Completar con datos de ejemplo y seguir</button>`,
  auto:`<button type="button" data-ejemplo="auto">Completar con datos de ejemplo y seguir</button>`,
  estado:`<button type="button" data-ejemplo="estado">Responder con un auto sin problemas</button><button type="button" data-ejemplo="estado2">Responder con un ruido en el tren delantero y el service atrasado</button>`,
  documentos:`<button type="button" data-ejemplo="docs">Completar con papeles de ejemplo y seguir</button>`};
if (!S.qi) S.qi = {};
const qActual = () => { const l = QS[S.paso](); return [l, Math.min(S.qi[S.paso]||0, l.length-1)]; };

function tarjetaPregunta(q){
  if (q.tipo==='cp'){   // 13/10/2026: una sola tarjeta. Escribe el CP → "Chequear" → abajo dice a qué zona corresponde y confirma ahí mismo
    const e = S.cpEstado||'', okCp = /\d{4}/.test(S.cp||''), z = S.cpZona || {};
    const zona = z.localidad && z.localidad!==z.partido ? `a <b>${esc(z.localidad)}, partido de ${esc(z.partido)}</b>` : `al <b>partido de ${esc(z.partido||'')}</b>`;   // D3: "al partido", no "a el"
    let res = '';
    if (e==='confirmar' && z.partido==='Ciudad de Buenos Aires'){
      const [b0, ...otros] = z.barrios;
      res = `<p class="cp-res"><b>${esc(S.cp)}</b>, Ciudad de Buenos Aires. ¿En qué barrio?</p>
      <div class="qops"><button class="qopt" type="button" data-cpbarrio="${esc(b0)}">${esc(b0)}</button>${otros.map(b=>`<button class="qopt" type="button" data-cpbarrio="${esc(b)}">${esc(b)}</button>`).join('')}<button class="qopt" type="button" data-cpotrobarrio>Otro barrio</button></div>`;
    } else if (e==='confirmar') res = `<p class="cp-res"><b>${esc(S.cp)}</b> corresponde ${zona}. ¿Es correcto?</p>
      <div class="qops"><button class="qopt" type="button" data-cpsi>Sí, seguir</button><button class="qopt" type="button" data-cpno>No, es otra zona</button></div>`;
    else if (e==='barrio') res = `<p class="cp-res">¿En qué barrio de la Ciudad está el auto?</p>
      <div class="qops largas">${BARRIOS_CABA.map(b=>`<button class="qopt" type="button" data-cpbarrio="${esc(b)}">${esc(b)}</button>`).join('')}</div>`;
    else if (e==='elegir') res = `<p class="cp-res">${z.desconocido ? `No encontramos el código postal <b>${esc(S.cp)}</b>. ` : ''}¿En qué partido está el auto?</p>
      <div class="qops largas">${PARTIDOS.map(p=>`<button class="qopt" type="button" data-cppartido="${esc(p)}">${esc(p)}</button>`).join('')}<button class="qopt" type="button" data-cppartido="otro">Fuera de AMBA</button></div>`;
    else if (e==='fuera') res = `<p class="note warn"><b>${esc(S.cp)}</b> queda fuera de Capital y Gran Buenos Aires: todavía no conseguimos ofertas ahí. Igual te mostramos cuánto vale.</p>
      <button class="btn" type="button" data-cpfuerasigue>Seguir y ver el precio</button>
      <button class="btn sec" type="button" data-cpcambiar>Cambiar el código postal</button>`;   // 17/10 (Gonzalo): fuera de AMBA ve el precio con la aclaración
    return `<h3>¿En qué código postal está el auto hoy?</h3>
      <label class="f" for="a_cp">
      <input type="text" id="a_cp" aria-label="Código postal" value="${esc(S.cpTexto||'')}" placeholder="${S.cpLargo ? 'Ej. C1428ABC' : 'Ej. 1428'}" autocomplete="postal-code" autocapitalize="characters" inputmode="${S.cpLargo ? 'text' : 'numeric'}" style="font-size:24px;letter-spacing:.08em">
      <span class="err" id="e_cp">${S.cpError?'Revisá el código postal: son 4 números (o la versión larga, como C1428ABC).':''}</span></label>
      <p class="hint" style="margin:0;font-size:14px">Las agencias ven la zona, nunca tu dirección.</p>
      ${e ? res : `<button class="btn" type="button" data-cpbuscar ${okCp?'':'disabled'}>Chequear</button>
      <div class="fila-link"><button class="btn link" type="button" data-cpnose>No sé el código postal</button>${S.cpLargo ? '' : '<button class="btn link" type="button" data-cplargo>Tengo el código largo</button>'}</div>`}`;
  }
  if (q.tipo==='docs'){
    const n = DOCS.filter(d=>S.docs[d[0]]).length;
    return `<h3>Sacale una foto a los papeles</h3>
      <p class="hint" style="margin:0;font-size:14px">Para confirmar que el auto es el de los papeles. ${n} de ${DOCS.length}.</p>
      <div class="grid2">${DOCS.map(d=>slot('docs',...d)).join('')}</div>
      ${faltaHTML(q.ok() ? '' : 'Falta: ' + conY(DOCS.filter(d=>!S.docs[d[0]]).map(d=>FALTA_DOC[d[0]])) + '.')}
      <div class="actions"><button class="btn" type="button" data-qnext ${q.ok()?'':'disabled'}>Seguir</button></div>`;
  }
  if (q.tipo==='dni'){   // 16/10 (D-44): número de DNI + selfie con prueba de vida contra el RENAPER; fotos del DNI solo como plan B
    const sf = S.dni.selfie, err = S.dniNum && !dniNumOk() ? 'Revisá el número: son 7 u 8 números, sin puntos.' : '';
    const selfie = `<div class="selfie-fila">${sf ? `<div class="selfie-min">${imgFoto(sf, 'Tu selfie')}</div>` : `<div class="selfie-min vacia" aria-hidden="true"><svg viewBox="0 0 60 72"><ellipse cx="30" cy="34" rx="20" ry="26" fill="none" stroke="currentColor" stroke-width="2.5" stroke-dasharray="5 4"/></svg></div>`}
      <div><b>${sf ? 'Selfie lista' : 'Una selfie'}</b><span class="hint" style="font-size:14px">${sf ? '' : 'Con buena luz y sin anteojos de sol.'}</span>
      <button class="btn ${sf?'sec':''} cam" type="button" data-camara="dni|selfie">${ICONO_CAMARA}${sf ? 'Sacarla de nuevo' : 'Sacarme la selfie'}</button>${inputArchivo('dni','selfie')}</div></div>`;
    const datos = S.dniPlanB
      ? `<p class="hint" style="margin:0;font-size:14px">Tu DNI de los dos lados.</p><div class="grid2">${DNI.map(d=>slot('dni',...d)).join('')}</div>
        <button class="btn link" type="button" data-dniplanb="0">Volver a validar con el número de DNI</button>`
      : `<label class="f" for="d_num"><span style="font-weight:600;font-size:16px">Número de DNI</span>
        <input type="text" id="d_num" inputmode="numeric" autocomplete="off" maxlength="10" value="${esc(S.dniNum||'')}" placeholder="Ej. 30123456" style="font-size:22px;letter-spacing:.04em">
        <span class="err" id="e_dni">${err}</span></label>
        <p class="sub-t" style="margin:0">Sexo, como figura en el DNI</p>
        <div class="qops fila3">${OP.sexo.map(([v,t])=>`<button class="qopt ${S.dniSexo===v?'sel':''}" type="button" data-sexo="${v}" aria-pressed="${S.dniSexo===v}">${t}</button>`).join('')}</div>`;
    return `<h3>Confirmá que sos vos</h3>
      <p class="hint" style="margin:0;font-size:14px">Lo validamos con el RENAPER. Las agencias no ven tu DNI ni tu selfie.</p>
      ${datos}${selfie}
      ${S.dniPlanB ? '' : `<p class="fine" style="margin:0">¿No te funciona? <button class="btn link" type="button" data-dniplanb="1" style="font-size:inherit;padding:0">Mandanos fotos del DNI</button></p>`}
      ${faltaHTML(q.ok() ? '' : faltaIdentidad())}
      <div class="actions"><button class="btn" data-go="enviado" type="button" id="dni_go" ${q.ok()?'':'disabled'}>Enviar para el chequeo final</button></div>
      <div class="proto"><span class="tag">Solo prototipo</span><span style="font-size:14px">En la web real, la selfie la saca la pantalla del proveedor de identidad (con prueba de vida: que sea una persona y no una foto) y la compara con el RENAPER. Si el RENAPER no responde, se piden las fotos del DNI.</span></div>`;
  }
  const sel = q.get(), extra = sel && q.extra ? q.extra(sel) : '';
  return `${q.lead && (S.qi[S.paso]||0)===0 ? `<div class="lead" style="font-size:15px">${q.lead}</div>` : ''}
    <h3>${esc(q.titulo)}</h3>${q.hint?`<p class="hint" style="margin:0;font-size:14px">${q.hint}</p>`:''}
    <div class="qops">${q.ops().map(([v,tx]) => `<button class="qopt ${sel===v?'sel':''}" type="button" data-qopt="${esc(v)}" aria-pressed="${sel===v}">${opTxt(q, v, tx)}</button>`).join('')}</div>
    ${extra ? `<div class="qextra">${extra}</div><button class="btn" type="button" data-qnext ${q.ok()?'':'disabled'}>Seguir</button>` : ''}`;
}
function vistaPreguntas(){
  if (S.paso==='estado' && S.estResumen) return resumenRespuestas();
  const [l, i] = qActual(), q = l[i];
  const anim = S.anim ? ' entra-'+S.anim : '';
  const ayuda = S.paso==='documentos' ? `<p class="ayuda-wa">¿Dudas con los papeles? <button class="btn link" type="button" data-ayuda>Escribinos por WhatsApp</button></p>` : '';
  return `<div class="screen qscreen">
    <div class="qhead"><span class="kicker">${Q_TIT[S.paso]} · ${i+1} de ${l.length}</span><button class="btn link" type="button" data-qback>Atrás</button></div>
    ${S.paso==='previo' ? '<p class="q-previo"><i aria-hidden="true"></i>Mientras buscamos precios, contanos un poco más.</p>' : ''}
    <div class="qcard${anim}">${tarjetaPregunta(q)}</div>${ayuda}
    <div class="proto"><span class="tag">Solo prototipo</span>${Q_PROTO[S.paso]}</div></div>`;
}
function textoRespuesta(q){   // D9: la respuesta en palabras cortas, para el resumen
  const v = q.get(), o = (q.ops().find(x=>x[0]===v) || [,'—'])[1].split(':')[0], d = S.det;
  if (q.id==='mecanica' && v==='fallas_menores' && d.mecTxt.trim()) return o + ' (' + d.mecTxt.trim() + ')';
  if (q.id==='choques' && v==='leve' && d.choqueDonde.length) return o + ' (' + d.choqueDonde.map(x=>txt('choqueDonde',x).toLowerCase()).join(', ') + ')';
  if (q.id==='repintado' && v==='si') return 'Sí: ' + d.repintadas.map(nomParte).join(', ');
  return o;
}
function resumenRespuestas(){
  const l = QS.estado();
  return `<div class="screen qscreen"><div class="qhead"><span class="kicker">Estado del auto · tus respuestas</span></div>
    <div class="qcard${S.anim ? ' entra-'+S.anim : ''}"><h3>Revisá tus respuestas</h3><p class="hint" style="margin:0">Tocá "Cambiar" en la que quieras corregir.</p>
    <ul class="resp-lista">${l.map((q,i)=>`<li><div><small>${esc(q.titulo)}</small><b>${esc(textoRespuesta(q))}</b></div><button class="btn link" type="button" data-cambiarq="${i}">Cambiar</button></li>`).join('')}</ul></div>
    <div class="actions"><button class="btn" type="button" data-verprecio>Ver mi precio afinado</button></div></div>`;
}
V.auto = vistaPreguntas; V.estado = vistaPreguntas; V.documentos = vistaPreguntas; V.previo = vistaPreguntas;
const previasOk = () => QS.auto().every(q => q.ok());   // 17/10: cuándo, código postal y primer dueño (se piden mientras corre la búsqueda)

let qLock = false;
function qAvanzar(){
  const [l, i] = qActual();
  if (S.paso==='estado' && S.volverResumen){ conTransicion('fwd', ()=>{ S.volverResumen = false; S.estResumen = true; S.anim = 'fwd'; render(true); }); return; }   // D9
  conTransicion('fwd', ()=>{
    if (S.paso==='previo' && S.previoVolver && previasOk()){ const v = S.previoVolver; S.previoVolver = ''; go(v); return; }   // 17/10: cambió el CP desde el primer precio
    if (i < l.length-1){ S.qi[S.paso] = i+1; S.anim = 'fwd'; render(); enfocarPregunta(); }
    else go(Q_SIG[S.paso]);
  });
}
// Transición: la tarjeta actual sale hacia un costado y recién ahí entra la siguiente.
// Después de cambiar de pregunta, la opción que queda debajo del dedo o del mouse no se marca sola:
// el resaltado vuelve recién cuando el mouse se mueve.
function quieto(){ document.body.classList.add('quieto'); }
['mousemove','touchstart'].forEach(ev => document.addEventListener(ev, e => { if (e.type==='touchstart' || Math.abs(e.movementX)+Math.abs(e.movementY) > 2) document.body.classList.remove('quieto'); }, {passive:true}));
function conTransicion(dir, fn){
  quieto();
  const c = $('#app .qcard');
  if (!c || window.matchMedia('(prefers-reduced-motion: reduce)').matches){ fn(); return; }
  c.classList.add(dir==='back' ? 'sale-back' : 'sale-fwd');
  setTimeout(fn, 190);
}
function qAtras(){
  const [l, i] = qActual();
  if ((S.paso==='auto' || S.paso==='previo') && l[i].tipo==='cp' && S.cpEstado && S.cpEstado!==''){ S.cpEstado=''; S.anim='back'; render(); return; }
  if (S.paso==='previo' && i===0){   // volver a elegir la versión
    conTransicion('back', ()=>{ if (S.patEstado==='ok') S.patEstado = 'confirmar'; else S.vid = ''; S.paso = 'datos'; S.anim = 'back'; render(true); }); return; }
  if (i > 0){ conTransicion('back', ()=>{ S.qi[S.paso] = i-1; S.anim = 'back'; render(); }); }
  else go(Q_ANT[S.paso], {alFinal:true});
}
// B2 (14/10): "Atrás" de la tarjeta = "atrás" del celular, cuando hay un paso anterior en esta visita
function atras(local){
  if (S.paso==='previo' && (S.qi.previo||0)===0){ local(); return; }   // 17/10: vuelve a confirmar la versión
  if ((S.paso==='auto' || S.paso==='previo') && qActual()[0][qActual()[1]].tipo==='cp' && S.cpEstado){ local(); return; }
  const st = history.state; if (st && st.yc && st.d > 0) history.back(); else local();
}
function enfocarPregunta(){ const f = $('.qcard input[type=text]'); if (f && window.matchMedia('(min-width:700px)').matches) f.focus(); }
function qBuscarCP(){
  const r = buscarCP(S.cpTexto||'');
  if (r.error){ S.cpError = true; render(); return; }
  S.cpError = false; S.cp = r.cp; S.cpZona = r; S.cpFueraOk = false;
  S.cpEstado = r.fuera ? 'fuera' : r.desconocido ? 'elegir' : (r.barrios && !r.barrios.length) ? 'barrio' : 'confirmar';
  if (r.fuera) S.partido = 'otro';
  render();
}

V.rango2 = () => {
  const ghost = calcular(1), e = calcular(2);
  if (e.revision) return `<div class="screen"><span class="kicker">Tu precio</span><h2>Preferimos revisarlo con vos</h2>
    <p class="note warn">Por lo que nos contaste, preferimos revisarlo antes de darte un precio. Te escribimos por WhatsApp.</p>
    <div class="actions"><button class="btn sec" data-estresumen type="button">Revisar mis respuestas</button></div></div>`;
  return `<div class="screen"><span class="kicker">Tu precio afinado</span>
  <p class="phrase">Con lo que nos contaste, un <b>${esc(nombreAuto())}</b> probablemente se venda a agencias entre:</p>
  ${cifraHTML(e, ghost)}<p class="fine">Es lo que estimamos que pueden llegar a pagar distintas agencias por un auto en las condiciones que declaraste.</p>
  ${dolarHTML(e)}${e.minimo > ghost.minimo ? `<p class="note ok">Por lo que nos contaste, lo subimos un poco.</p>` : ''}${precision(2)}
  <p class="lead">Falta lo que se ve en las fotos: sacalas y te damos tu precio final.</p>
  ${ACLARA}
  <div class="actions"><button class="btn" data-go="fotos" type="button">${fotosOk() ? 'Ver mis fotos' : Object.keys(S.fotos).length ? 'Seguir con las fotos' : 'Sacar las fotos'}</button><button class="btn link" data-estresumen type="button">Cambiar mis respuestas</button></div></div>`;
};

V.verificando = () => {
  if (S.noCoincide){
    const vs = versionesAnio(S.marca,S.modelo,S.anio);
    return `<div class="screen"><span class="kicker">Revisión de papeles</span><h2>La versión no coincide con la cédula</h2>
    <p class="note warn">Elegí la versión que dice la cédula: recalculamos tu precio y revisás tu mínimo.</p>
    <label class="f" for="v_fix">Versión según la cédula<select id="v_fix">${vs.map(v=>`<option value="${esc(v[0])}" ${v[0]===S.vid?'selected':''}>${esc(v[1])}</option>`).join('')}</select></label>
    <div class="actions"><button class="btn" type="button" data-fix="1">Recalcular con esta versión</button></div></div>`;
  }
  return `<div class="screen"><span class="kicker">Revisión de fotos</span><h2>Estamos revisando tus fotos</h2>
  <p class="lead">Suele llevar menos de un día hábil. Te avisamos por WhatsApp.</p>
  <details class="why"><summary>Ver los datos de tu auto</summary>${ficha()}</details>
  ${(()=>{ const m = FOTOS.map(f=>[f[1], senalesDe('fotos', f[0])]).filter(x=>x[1].length); return m.length ? `<div class="proto"><span class="tag">Solo prototipo · lo que ve quien revisa (el vendedor no)</span><ul class="fq-lista">${m.map(([l,sg])=>`<li><b>${esc(l)}:</b> ${esc(sg.join(' · '))}</li>`).join('')}</ul></div>` : ''; })()}
  <div class="proto"><span class="tag">Solo prototipo · lo hace una persona</span><button type="button" data-rev="ok">Simular: las fotos no muestran daños</button><button type="button" data-rev="danios">Simular: en las fotos vemos 2 rayones profundos y 2 cubiertas gastadas</button></div></div>`;
};

V.precio = () => {
  const e = calcular(3), m = parseInt(String(S.minimo).replace(/\D/g,''),10);
  if (e.revision) return `<div class="screen"><span class="kicker">Tu precio</span><h2>Preferimos revisarlo con vos</h2>
    <p class="note warn">En las fotos vimos algo que preferimos revisar con vos. Te escribimos por WhatsApp.</p></div>`;
  let msg = '', bloquea = false;
  if (m>0){
    if (m > e.maximo){ bloquea = true; msg = `<p class="note bad">Con ese mínimo no podemos publicarlo: bajalo a ${M(e.maximo)} o menos.</p>`; }
    else if (m > e.sugerido) msg = `<p class="note warn">Chances medias de vender. Más cerca de ${M(e.minimo)}, más chances.</p>`;
    else if (m > e.minimo) msg = `<p class="note ok">Buenas chances de vender.</p>`;
    else msg = `<p class="note ok">Las mejores chances de vender. Las agencias igual pueden ofrecer más.</p>`;
  }
  const ok = m>0 && !bloquea;   // 18/10 (menos pasos): tocar "Acepto el rango y sigo" es el acuerdo con el rango (D-18); antes era un tilde aparte
  return `<div class="screen"><span class="kicker">Tu precio sugerido</span>
  <div><div class="sug">${M(e.sugerido)}</div>${dolarHTML(e, e.sugerido)}</div>
  ${rangoHTML(e)}
  ${notaRevision(e)}${notaInforme()}
  <label class="f" for="p_min">¿Cuál es el mínimo que aceptarías?<div class="money"><span>$</span><input type="text" inputmode="numeric" id="p_min" value="${esc(S.minimo)}" placeholder="${KM(e.minimo)}"></div>
    <span class="hint">Más cerca del piso (${M(e.minimo)}), más chances de vender. Las agencias ven tu mínimo; si ninguna llega, no vendés y no pagás nada.</span></label>
  <div class="chips"><button type="button" class="chip" data-min="${e.minimo}">Usar el piso (más chances)</button><button type="button" class="chip" data-min="${e.sugerido}">Usar el sugerido</button></div>
  <div id="minMsg">${msg}</div>
  ${ACLARA}
  <div class="proto"><span class="tag">Solo prototipo</span><button type="button" data-ejemplo="precio">Usar el sugerido como mínimo</button></div>
  <div class="actions">${faltaHTML(ok || bloquea ? '' : 'Falta: tu mínimo.')}<button class="btn" data-go="confirmar" data-acuerdo type="button" id="p_go" ${ok?'':'disabled'}>Acepto el rango y sigo</button></div></div>`;
};

V.confirmar = () => {   // M10 (14/10): las 2 reglas clave a la vista; el resto y los datos del auto, desplegables. Mismos textos.
  const e = calcular(3), m = parseInt(String(S.minimo).replace(/\D/g,''),10), ok = S.aceptoReglas && fotosOk();   // 18/10: un solo tilde; los términos se aceptan con el botón
  return `<div class="screen"><span class="kicker">Confirmación</span><h2>Revisá y confirmá</h2>
  <div class="ficha"><dl class="apilada"><dt>Tu mínimo</dt><dd><b>${P(m)}</b></dd><dt>Rango</dt><dd>${M(e.minimo)} a ${M(e.maximo)}</dd></dl></div>
  <div class="reglas"><p><b>Si la mejor oferta llega a tu mínimo, el auto se vende</b> y le pasamos tu contacto a la agencia.</p>
    <p><b>Si queda abajo, tenés 24 horas para aceptarla.</b> Si no, tu auto vuelve a la subasta en 30 días.</p></div>
  <details class="why"><summary>Ver más reglas</summary>
    <ul class="fq-lista"><li>Antes de la subasta pedimos el informe de dominio. Si vendés, con tu consentimiento revisamos multas, deuda de patente, VTV y GNC: no frenan la venta, se pueden descontar del precio.</li>
    <li>Si el auto está como lo describiste, la oferta se respeta. Solo por algo no declarado la agencia puede proponer un ajuste, con fotos, y vos podés decir que no.</li>
    <li>Las agencias ven fotos (con la patente tapada), datos, estado, zona y tu mínimo.</li></ul></details>
  <label class="check" for="c_reg"><input type="checkbox" id="c_reg" ${S.aceptoReglas?'checked':''}><span>Entiendo que si la mejor oferta llega a mi mínimo, el auto se vende.</span></label>
  <div class="proto"><span class="tag">Solo prototipo</span><button type="button" data-ejemplo="confirmar">Marcar el tilde</button></div>
  ${fotosOk()?'':`<p class="note warn">Faltan fotos: sin las ${OBLIG.length} no podemos publicarlo. <button type="button" class="btn link" data-go="fotos">Ir a las fotos</button></p>`}
  <div class="actions">${faltaHTML(ok || !fotosOk() ? '' : 'Falta: marcar el tilde.')}<button class="btn" data-go="documentos" data-terminos type="button" id="c_go" ${ok?'':'disabled'}>Confirmar y subir los papeles</button>
    <p class="fine" style="text-align:center;margin:0">Al confirmar aceptás los términos y la política de privacidad.</p></div></div>`;
};

const fechaEn = dias => new Date(HOY.getTime() + dias*864e5).toLocaleDateString('es-AR', {day:'numeric', month:'long'});
// Días hábiles (12/10/2026): el informe lo pedimos a mano, por orden de llegada, el mismo día hábil; la DNRPA tarda hasta 48 h hábiles;
// con el informe OK el auto entra en la subasta siguiente. Con los feriados oficiales y los de AMBA (16/10, TEC-11).
// 16/10 (TEC-11): esHabil y sumarHabiles vienen de comun/dias_habiles.js, con los feriados oficiales y los locales de AMBA.
const fechaLarga = d => d.toLocaleDateString('es-AR', {weekday:'long', day:'numeric', month:'long'});
const fechaSubasta = () => fechaLarga(sumarHabiles(HOY, 3));
const fechaCorta = d => d.toLocaleDateString('es-AR', {day:'2-digit', month:'2-digit', year:'numeric'});
V.enviado = () => {
  if (S.papeles==='frena') return `<div class="screen"><span class="kicker">Chequeo final</span><h2>Encontramos algo en el informe del Registro</h2>
    <p class="note bad">El informe muestra un embargo: así no puede salir a la subasta. Te escribimos por WhatsApp para ver cómo seguir.</p></div>`;
  return `<div class="screen"><span class="kicker">Chequeo final</span><h2>Estamos revisando tus papeles</h2>
  <p class="lead">Si está todo bien, tu auto entra a la subasta del <b>${esc(fechaSubasta())}</b>. Te avisamos por WhatsApp.</p>
  <ol class="steps3"><li><div><b>Pedimos el informe de dominio</b> (hasta 2 días hábiles).</div></li>
  <li><div><b>Lo comparamos</b> con tus papeles y tu identidad.</div></li></ol>
  <details class="why"><summary>Ver los datos de tu auto</summary>${ficha()}</details>
  <div class="proto"><span class="tag">Solo prototipo · lo hace una persona</span><button type="button" data-final="ok">Simular: llegó el informe y está todo en regla</button><button type="button" data-final="version">Simular: la versión de la cédula no coincide</button><button type="button" data-final="duenos">Simular: el informe muestra más dueños de los que declaraste</button><button type="button" data-final="frena">Simular: el informe muestra un embargo</button><button type="button" data-final="grabado">Simular: todo en regla, pero no vemos el grabado en las fotos</button></div></div>`;
};
// Lo que guardamos del informe (simulado; formato de documentacion/papeles_formales/lector/leer_informe.py, función minimo()):
// solo lo del auto y lo del vendedor. De cotitulares y dueños anteriores, solo cuántos son.
const gncConsulta = () => S.gncConsulta || 'no';   // D-42: resultado de la consulta de GNC (simulado: sin equipo)
const duenosInforme = () => S.duenosInforme || (['1','2','3'].includes(S.duenos) ? S.duenos : '2');
const SIM_INFORME = {get duenosAnteriores(){ return Math.max(0, +duenosInforme() - 1); }, bienGanancial:false, radicacion:'Chivilcoy', provincia:'Provincia de Buenos Aires', emitido:'', validacion:{registro:'1234', tramite:'000000', control:'ABC123DEF0'}};
// Resultados del chequeo final (simulados). Textos y reglas: documentacion/patentes_multas/REGLAS_RESULTADOS_API.md. Fuente = organismo oficial, nunca el proveedor.
// Informe del auto (D-39, 13/10/2026): lo que verificamos y con lo que el auto entra a la subasta. Lo ven igual el vendedor y las agencias,
// sin datos personales (documentacion/PRIVACIDAD_RESUMEN_AGENCIA.md). Fuente = organismo oficial, nunca el proveedor (REGLAS_RESULTADOS_API.md).
function filasInforme(){
  const caba = S.partido==='Ciudad de Buenos Aires', vtv = new Date(HOY.getTime() + 19*864e5), dias = Math.round((vtv-HOY)/864e5), f = fechaCorta(HOY);
  const DNRPA = 'Registro del Automotor (DNRPA)', da = SIM_INFORME.duenosAnteriores;
  const filas = [
    ['Estado del dominio', 'En regla: sin prendas, embargos, inhibiciones, denuncias de robo ni trámites pendientes. El vendedor es titular (DNI validado).', DNRPA, f],
    ['Dueños anteriores', da ? `${da} ${da===1?'dueño anterior':'dueños anteriores'}.` : 'Ninguno: lo vende su primer dueño.', DNRPA, f],
    ['Radicación', `Registro de ${SIM_INFORME.radicacion} (${SIM_INFORME.provincia}).`, DNRPA, f]];
  // 16/10 (D-45): multas, deuda, VTV y GNC se consultan recién cuando el vendedor acepta vender y da su consentimiento para compartirlas con la agencia
  if (S.consultas==='ok' || S.consultas==='deuda'){
    const deuda = S.consultas==='deuda';
    filas.push(['Multas', deuda ? '1 multa en la Provincia de Buenos Aires: $ 342.150 (exceso de velocidad, 01/2026).' : 'Sin multas en las fuentes principales: Nación (ANSV), Ciudad de Buenos Aires y Provincia de Buenos Aires. Algunas jurisdicciones más chicas no respondieron en este momento.', 'ANSV, CABA y Provincia de Buenos Aires', f],
      ['Deuda de patente', deuda ? (caba ? 'Debe $ 186.400 en AGIP (2 cuotas).' : 'Debe $ 186.400 en ARBA (2 cuotas).') : (caba ? 'Al día en AGIP (Ciudad de Buenos Aires).' : 'Al día en ARBA (Provincia de Buenos Aires).'), caba ? 'AGIP' : 'ARBA', f],
      ['VTV', dias < 30 ? `Vence pronto: el ${fechaCorta(vtv)}.` : `Vigente hasta el ${fechaCorta(vtv)}.`, caba ? 'VTV Ciudad' : 'VTV Provincia', f],
      ['GNC', gncConsulta()==='vigente' ? 'Con equipo y oblea vigente.' : gncConsulta()==='vencida' ? 'Con equipo y oblea vencida.' : 'Sin equipo de GNC registrado.', 'ENARGAS', f]);
  } else filas.push(['Multas, deuda de patente, VTV y GNC', 'Se consultan si el vendedor acepta vender, con su consentimiento.', 'Organismos oficiales, al cerrar la venta', f]);
  if (S.partido && zonaTexto().indexOf(SIM_INFORME.radicacion) < 0) filas.push(['Dónde está hoy', `${zonaTexto()}: distinto de la radicación.`, 'Declarado por el vendedor (código postal)', f]);
  if (S.titular==='compartido') filas.push(['Titulares', 'Tiene otro titular: el día de la venta firman el vendedor y el cotitular.', DNRPA, f]);
  if (SIM_INFORME.bienGanancial) filas.push(['Firma del cónyuge', 'Figura como bien ganancial: el día de la venta firma también el cónyuge del titular.', DNRPA, f]);
  if (S.vpol==='si' && S.docs.f12) filas.push(['Verificación policial', 'Vigente (insignia "Verificación policial vigente").', 'Formulario 12 revisado por Yacar', f]);
  // 16/10 (D-44): grabado de autopartes (lo piden CABA, Ley 3.708, y Provincia, Ley 14.497, para transferir) y título (declarado)
  if (S.grabado) filas.push(['Grabado de autopartes', S.grabado==='no' ? 'No lo vimos en las fotos. Si no lo tiene, se hace antes de la transferencia (una sola vez).' : 'Se ve la patente grabada en los vidrios.', 'Fotos revisadas por Yacar', f]);
  if (S.titulo) filas.push(['Título', S.titulo==='papel' ? 'En papel.' : S.titulo==='digital' ? 'Digital: se descarga e imprime de la página del Registro.' : 'El vendedor no lo encuentra: saca un duplicado antes de la entrega.', 'Declarado por el vendedor', f]);
  return filas;
}
function chequeoFinalHTML(){   // 18/10 (menos texto): plegado; se abre con un toque
  return `<details class="why"><summary>${S.consultas==='ok' || S.consultas==='deuda' ? 'Ver el informe completo de tu auto' : 'Ver el informe con el que entra a la subasta'}</summary><div class="ficha"><header><span>${S.consultas==='ok' || S.consultas==='deuda' ? 'Informe completo de tu auto' : 'Informe con el que tu auto entra a la subasta'}</span><span>${fechaCorta(HOY)}</span></header><dl>
    ${filasInforme().map(f=>`<dt>${f[0]}</dt><dd>${esc(f[1])}<br><small class="fine">Fuente: ${esc(f[2])}</small></dd>`).join('')}</dl>
    <p class="fine" style="padding:0 16px 14px;margin:0">Esto mismo ven las agencias, sin tus datos ni la patente. No es un certificado.</p></div></details>`;
}
// Al vender (D-39): el vendedor recibe el PDF oficial del Registro (lo guardamos cifrado 30 días) y el informe de Yacar para compartir con la agencia.
// 16/10 (D-44): al aceptar vender, el vendedor pide el certificado de dominio (solo lo puede pedir el titular, online, 4 MRPA, llega en 24 h).
// Congela el auto 15 días hábiles: nadie puede anotar un embargo entre que la agencia paga y transfiere. Quién lo paga: a decidir (D-27).
function certDominioHTML(){
  const hasta = fechaCorta(sumarHabiles(HOY, 15));
  if (S.certDom==='subido') return `<p class="note ok"><b>Recibimos tu certificado de dominio.</b> El auto queda congelado hasta el ${hasta}. Ya lo tiene la agencia.</p>`;
  return `<div class="range cert-dom"><span class="kicker">Antes de la visita</span><h3>Pedí el certificado de dominio</h3>
    <p class="fine" style="font-size:15px;color:var(--ink)">Congela el auto 15 días hábiles: nadie puede anotar un embargo y la venta sale más rápido.</p>
    <ol class="steps3 chico"><li><div>En dnrpa.gov.ar, <b>Certificado de dominio</b>, con la patente <b>${esc(S.patente||'')}</b>.</div></li>
      <li><div>Pagalo desde una cuenta a tu nombre (unos $ 4.200).</div></li>
      <li><div>Te llega por mail en 24 horas: subilo acá.</div></li></ol>
    ${S.certDom==='pedido' ? `<p class="note info">Lo pediste el ${esc(S.certFecha)}. Cuando te llegue, subilo.</p>` : ''}
    <div class="actions" style="margin-top:0"><label class="btn" for="f_cert">Subir el certificado</label>${inputArchivo('cert', 'cert', 'Subir el certificado de dominio')}
      ${S.certDom ? '' : '<button class="btn sec" type="button" data-certpedido>Ya lo pedí</button>'}</div>
    <div class="proto"><span class="tag">Solo prototipo</span><span style="font-size:14px">A decidir quién paga el certificado (unos $ 4.200): lo tiene que pagar el titular desde una cuenta a su nombre, pero se lo podemos devolver. En la web real, el botón lleva a la página del Registro.</span></div></div>`;
}
function diaFirmaHTML(){   // 16/10 (D-44): qué llevar el día de la firma y qué hacer después
  const tit = S.titulo==='no' ? 'El título (antes, sacá un duplicado: te ayudamos)' : S.titulo==='digital' ? 'El título digital, impreso' : 'El título';
  const l = ['Tu DNI', tit, 'La cédula verde'];
  if (S.titular==='compartido') l.push('El otro titular, con su DNI: también firma');
  if (SIM_INFORME.bienGanancial) l.push('Tu cónyuge, con su DNI: firma su conformidad');
  if (!(S.vpol==='si' && S.docs.f12)) l.push('La verificación policial (coordiná con la agencia quién lleva el auto)');
  if (S.grabado==='no') l.push('El grabado de autopartes, si el auto no lo tiene (se hace una sola vez)');
  return `<details class="why"><summary>Qué llevar el día de la firma</summary><ul class="fq-lista lista-firma">${l.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
    <p class="fine" style="margin:0"><b>Después:</b> si la agencia no lo pasa a su nombre ese día, hacé la denuncia de venta en el Registro (unos $ 4.200).</p></details>`;
}
// 16/10 (D-45): al vender, el vendedor da su consentimiento y recién ahí consultamos multas, deuda de patente, VTV y GNC (una sola vez).
// Con eso se arma el informe completo, que ven el vendedor y la agencia que compró. Las deudas no frenan: la agencia las puede descontar del precio.
function consentimientoHTML(){
  if (!S.consent) return `<div class="range consent"><span class="kicker">Para cerrar la venta</span><h3>Revisamos multas, deudas, VTV y GNC</h3>
    <p class="fine" style="font-size:15px;color:var(--ink)">Con tu OK, Yacar consulta multas, deuda de patente, VTV y GNC de tu auto y comparte el informe con la agencia que lo compró. No frenan la venta: se descuentan del precio o las pagás antes.</p>
    <div class="actions" style="margin-top:0"><button class="btn" type="button" data-consentir>Doy mi consentimiento</button></div></div>`;   // 18/10: un toque (antes tilde + botón)
  if (S.consultas==='pendiente') return `<div class="range"><span class="kicker">Informe completo</span><p class="note info" role="status" style="margin:0">Consultando multas, deuda, VTV y GNC. Te avisamos por WhatsApp en unos minutos.</p>
    <div class="proto"><span class="tag">Solo prototipo</span><button type="button" data-consultas="ok">Simular: sin multas ni deudas</button><button type="button" data-consultas="deuda">Simular: con deuda de patente y una multa</button></div></div>`;
  if (S.consultas==='deuda') return `<p class="note warn"><b>Deuda de patente ($ 186.400) y una multa ($ 342.150).</b> No frenan la venta: se descuentan del precio o las pagás antes de la visita.</p>`;
  return `<p class="note ok"><b>Sin multas ni deuda de patente.</b> La agencia ya tiene el informe.</p>`;
}
function papelesVentaHTML(){   // 18/10 (menos texto): de a un paso. Hasta que da el consentimiento, solo se ve eso
  if (!S.consent) return consentimientoHTML();
  return `${consentimientoHTML()}${certDominioHTML()}${diaFirmaHTML()}<div class="range"><span class="kicker">Tus papeles para la venta</span>
    <div class="actions" style="margin-top:0"><button class="btn" type="button" data-go="informe">Ver el informe de Yacar</button>
    <button class="btn sec" type="button" data-pdfoficial>Descargar el informe del Registro (PDF oficial)</button></div>
    <p class="fine" id="pdfNota"></p></div>`;
}
V.informe = () => {
  const v = SIM_INFORME.validacion;
  return `<div class="screen informe-yacar"><div class="iy-head"><span class="iy-logo">Yacar</span><span>Informe del auto · ${fechaCorta(HOY)}</span></div>
  <h2>${esc(nombreAuto())}</h2>
  <dl class="iy-datos"><dt>Patente</dt><dd>${esc(S.patente||'—')}</dd><dt>Kilómetros</dt><dd>${KM(kmNum())} (declarados; foto del tablero revisada)</dd><dt>Zona</dt><dd>${esc(zonaTexto()||'—')}</dd></dl>
  <h3>Qué verificamos</h3>
  <table class="iy-tabla"><thead><tr><th>Chequeo</th><th>Resultado</th><th>Fuente y fecha</th></tr></thead><tbody>
    ${filasInforme().map(f=>`<tr><th scope="row">${f[0]}</th><td>${esc(f[1])}</td><td>${esc(f[2])}<br><small>${f[3]}</small></td></tr>`).join('')}
    <tr><th scope="row">Fotos y estado</th><td>${Object.keys(S.fotos).length} fotos revisadas por Yacar; estado declarado por el vendedor.</td><td>Yacar<br><small>${fechaCorta(HOY)}</small></td></tr></tbody></table>
  <h3>Cómo validar el informe del Registro</h3>
  <p class="fine" style="font-size:14px">Entrá a www.dnrpa.gov.ar → Validación Documento Recibido, con: Registro Seccional ${v.registro} · Número de trámite ${v.tramite} · Número de control web ${v.control}.</p>
  <p class="fine">Este informe muestra el estado del auto en la fecha de cada consulta. No es un certificado de dominio ni una garantía: el día de la venta la agencia o el gestor hacen su propio chequeo.</p>
  <div class="actions iy-acciones"><button class="btn" type="button" data-imprimir>Descargar en PDF</button><button class="btn sec" type="button" data-compartir>Compartir con la agencia</button><button class="btn link" type="button" data-go="miauto">Volver a Mi auto</button></div>
  <p class="fine" id="compNota"></p>
  <div class="proto"><span class="tag">Solo prototipo</span><span style="font-size:14px">Los números de validación son de ejemplo. En la web real, "Compartir" manda un link al informe por WhatsApp.</span></div></div>`;
};
function finSubasta(tipo){   // D-25: llega al mínimo → se vende; queda por debajo → decide en 24 horas (D-47, 18/10); si no acepta, 30 días afuera
  const e = calcular(3), m = parseInt(String(S.minimo).replace(/\D/g,''),10);
  S.resultado = tipo;
  if (tipo==='llega'){ const top = Math.max(m, e.sugerido); S.oferta = Math.max(m, redondear(Math.min(e.maximo, top + (e.maximo-top)*0.35), 'abajo')); S.avance = 3; }
  else { S.oferta = redondear(Math.max(e.minimo, m - Math.max(300000, m*0.04)), 'abajo'); if (S.oferta >= m) S.oferta = m - 100000; S.avance = 2; }
}
V.miauto = () => {
  const m = parseInt(String(S.minimo).replace(/\D/g,''),10);
  const pasos = [['Papeles en regla','Entra en la próxima subasta'],['En subasta','De 10 a 19 h'],['Resultado','Te avisamos la mejor oferta'],['Vendido','La agencia te contacta']];
  const li = pasos.map((p,i)=>`<li class="${i<S.avance || (i===3 && S.avance===3) ?'done':i===S.avance?'now':''}"><div><b>${p[0]}</b><small>${p[1]}</small></div></li>`).join('');
  let extra = '', proto = '';
  if (S.avance===0) proto = `<button type="button" data-avanzar="1">Simular: empieza la subasta</button>`;
  if (S.avance===1) proto = `<button type="button" data-fin="llega">Simular: la mejor oferta llega a tu mínimo</button><button type="button" data-fin="bajo">Simular: la mejor oferta queda por debajo de tu mínimo</button>`;
  if (S.resultado==='llega') extra = `<p class="note ok"><b>Vendiste tu auto por ${M(S.oferta)}</b> (tu mínimo: ${M(m)}). La agencia te escribe en las próximas horas para coordinar la visita.</p>${papelesVentaHTML()}`;
  if (S.resultado==='bajo' && !S.decision) extra = `<div class="range"><span class="kicker">Mejor oferta</span><div class="sug">${M(S.oferta)}</div>
    <p class="fine">Quedó abajo de tu mínimo (${M(m)}). Tenés 24 horas para decidir; si no, vuelve a la subasta el ${fechaEn(30)}.</p>
    <div class="actions" style="margin-top:0"><button class="btn" type="button" data-dec="si">Aceptar ${M(S.oferta)}</button><button class="btn sec" type="button" data-dec="no">No, gracias</button></div></div>`;
  if (S.decision==='si') extra = `<p class="note ok"><b>Aceptaste ${M(S.oferta)}.</b> La agencia te escribe en las próximas horas para coordinar la visita.</p>${papelesVentaHTML()}`;
  if (S.decision==='no') extra = `<p class="note info">No vendiste. Tu auto puede volver a la subasta desde el ${fechaEn(30)}.</p>`;
  const avisoGrabado = S.grabado==='no' && !S.resultado ? `<p class="note warn"><b>No vimos el grabado de autopartes en las fotos.</b> Si no lo tiene, hacelo antes de la entrega (lo piden para transferir).</p>` : '';
  return `<div class="screen"><span class="kicker">Mi auto</span><h2>${esc(nombreAuto())}</h2><ol class="tl">${li}</ol>${notaInforme()}${avisoGrabado}${extra}
    ${S.papeles==='ok' ? chequeoFinalHTML() : ''}
    ${proto ? `<div class="proto"><span class="tag">Solo prototipo</span>${proto}</div>` : ''}</div>`;
};

// ------------------------------------------------------------ notas para validar
const N = {
  datos:{t:'Inicio y cotizador (N1)',w:'Una sola página (D-28): el inicio es la landing con el cotizador. 15/10 (D-43): propuesta de valor arriba ("Vendé tu auto. Las agencias compiten por él."), foto del auto bajo el verde, sección del problema, pasos 1-2-3, un celular de ejemplo con el resultado, y estética al estilo chejefe.com (blanco y gris, Outfit + Instrument Sans, botones redondos) sin perder el verde. Patente primero (12/10): el vendedor escribe la patente, buscamos el auto y confirma "¿Es tu auto?" (si hay varias versiones parecidas, elige entre esas); después km. La búsqueda está simulada (patente.js, misma forma que la respuesta de clasific.ar) y lo que devuelve se empareja con nuestro catálogo. Si no aparece, la fuente falla o no es su auto, sigue por clics con la patente guardada: marca → modelo → año → versión → km (primero los 64 modelos relevados; "Ver todas" abre el catálogo completo), salteando lo que la fuente ya dio. Al ver el primer precio, "Quiero vender mi auto" lleva al resto del flujo en la misma página.',ids:['D-28','VEN-02','VEN-03','PRE-01','D-06','DOC-10'],c:['¿Pedir la patente antes del precio frena a alguien? Medirlo en las entrevistas.','Probá las 6 patentes de ejemplo: encontrada, dos versiones, versión con otro nombre, sin versión exacta, no aparece y falla.','¿Las marcas populares alcanzan o falta alguna a la vista?','Los nombres de versión son los de la lista de referencia ("4P 1,3 DRIVE GSE"): ¿alcanzan o hay que traducirlos?','Nombre y logo: placeholder hasta MKT-01. "Gratis" por ahora (D-27 abierta).']},
  previo:{t:'Mientras buscamos precios (17/10)',w:'Apenas se confirma la versión (patente o elección manual), el servidor sale a buscar avisos de autos como el suyo (D-49, tarda entre 10 y 60 s). Ese tiempo se usa para las 3 preguntas que antes iban después del registro: cuándo lo quiere vender, código postal donde hoy está el auto y si es el primer dueño (Sí/No; el informe de dominio lo corrige). No hay "Saltear". Después vienen los km y el primer precio. Si ya las contestó, el paso "Datos del auto" se saltea. Con la patente, la búsqueda arranca antes, mientras confirma que es su auto.',ids:['D-49','PRE-13','D-25','D-40'],c:['¿El texto "Mientras buscamos precios de referencia, te pedimos que nos cuentes unas cosas más" es el que querés?','¿Se entiende que el puntito que late es la búsqueda en curso?','Fuera de AMBA (17/10, Gonzalo): avisa en la tarjeta del CP, deja ver el primer precio y ahí no ofrece seguir (solo cambiar el CP o los datos). Le pide el WhatsApp para avisarle cuando lleguemos a su zona (en la web real: lista de espera por zona con el CP, la marca, el modelo y el año).']},
  rango1:{t:'Primer precio (N1)',w:'D-51 (18/10/2026, Gonzalo): desde N1 se muestra el rango (antes D-20: una sola cifra). Piso = lo que paga una agencia hoy (0,82 × lo que piden los avisos del momento, o 0,95 × lista de referencia × factor del modelo × km × MEP sin servidor); techo = piso + 6%. Frase: "según nuestro sondeo y el mercado de hoy … probablemente se venda a agencias entre". Abajo el equivalente en dólares (D-48). "¿Por qué este precio?" va a la vista con 3 razones, en este orden (Gonzalo): vendés en días, esperar también cuesta (≈ 3% a 4,5% en 2 o 3 meses: desvalorización 0,45%, patente y seguro 0,5% y plata parada 0,58% por mes, 7% anual; cálculo y fuentes en REGLA_RANGO_PRECIO.md) y sin llamadas ni visitas. Nunca se nombran las fuentes de avisos.',ids:['D-51','D-20','D-19','D-49','D-48','VEN-17','VEN-16'],c:['¿Se entiende que el rango es lo probable y no una oferta?','El dato "esperar también cuesta": ¿convence o suena a vendedor?','¿2 o 3 meses es el ejemplo justo? Broker Cars dijo 2 a 6.']},
  registro:{t:'Registro',w:'Revisión UX (14/10, M5): solo nombre y celular con WhatsApp (sin email: la cuenta se crea con el código). "¿Cuándo lo querés vender?" (lo que medimos en la prueba de demanda) pasó a una tarjeta después del código. Si falta algo, abajo del botón dice qué.',ids:['VEN-05','D-06','LEG-04'],c:['¿El email lo pedimos más adelante (para mandar el informe del auto) o nunca?','Falta la política de privacidad (LEG-04) antes de usarlo con gente real.']},
  codigo:{t:'Código por WhatsApp',w:'12/10: el vendedor confirma su número con un código de 6 números que le llega por WhatsApp. Eso crea su cuenta, sin contraseña. Revisión UX (14/10, M6): "¿No te llegó? Reenviar" se habilita a los 30 segundos, y hay "Mandármelo por SMS". En el prototipo cualquier código de 6 números sirve.',ids:['VEN-05','TEC-05'],c:['¿Se entiende que no hace falta contraseña?','Para la web real: proveedor de mensajes de WhatsApp y SMS (costo por mensaje) y límite de intentos.']},
  auto:{t:'Datos del auto',w:'Una pregunta por tarjeta (v5.2): código postal en una sola tarjeta (13/10: escribe el CP, toca Chequear y ahí mismo confirma la zona o elige el barrio o partido) y dueños (autodeclarado; único dueño suma un poco; si el informe dice otra cosa, manda el informe y se recalcula, D-40). 15/10 (D-42): el GNC ya no se pregunta: sale de la consulta del chequeo final (ENARGAS). Al tocar una opción pasa sola a la siguiente. No mueven el precio: van a la ficha para agencias (D-24, D-25). El CP le dice a la agencia qué tan lejos está el auto sin mostrar la dirección.',ids:['D-25','D-24','VEN-06','DOC-11','PRE-09'],c:['En CABA se confirma el barrio (ej. 1428 → "¿Tu auto está en Belgrano, CABA?", con Núñez como alternativa y "Otro barrio").','La tabla de códigos postales es aproximada (armada para el prototipo): por eso se pide confirmar. Para la web real, usar una base oficial.','La patente ya no se pregunta acá: viene del cotizador (12/10). Dueños volvió (13/10, D-40): lo confirma el informe.','Fuera de AMBA se frena con un aviso.']},
  fotos:{t:'Fotos guiadas',w:'18/10 (Gonzalo): 10 obligatorias (4 esquinas, cubierta delantera y trasera, asientos delanteros y traseros, tablero, baúl) + motor opcional; las llaves pasaron a una pregunta del estado. Una sola sesión de cámara: si la foto sale bien, pasa sola a la siguiente. Antes: revisión UX (14/10, M1): las 14 fotos se sacan de a una, en el orden en que se camina alrededor del auto: 8 de afuera (cada esquina con su cubierta) y 6 de adentro. Cada foto tiene un dibujo de dónde pararse, consejos y un botón grande; al sacarla se ve grande con el resultado de la revisión (luz, nitidez, resolución; avisa, no frena) y "Usar esta y seguir" / "Sacarla de nuevo". Se pregunta por daños al empezar y se sacan después de las de afuera. Al final, el resumen con las 14 en el orden de la ficha de agencias (D-33). Cada foto se achica en el celular (1.600 px) y se guarda: si se corta o vuelve otro día, sigue donde quedó. 16/10 (D-44): "Sacar la foto" abre la cámara adentro de la web con una guía dibujada encima: la silueta del auto en ese ángulo (esquinas), el círculo de la rueda (cubiertas), el tablero o un marco. Para la cédula, el chasis y el formulario 12, un recuadro; para la selfie, un óvalo. Si el celular no deja usar la cámara acá, se usa la del celular como antes. Sin indicaciones en vivo ("más cerca", "más lejos"): eso queda para cuando haya volumen.',ids:['D-41','D-25','D-33','D-10','VEN-08','DOC-09'],c:['¿El orden en que se sacan conviene también para la ficha de agencias, o la ficha sigue como está?','¿Dejamos "Saltear por ahora"? Al final igual pide las 14.','14 fotos: Motorway pide 16.']},
  estado:{t:'Checklist de estado',w:'Una pregunta por tarjeta, solo lo que no se ve en las fotos (D-25): si tiene algún problema (15/10, D-42: antes "¿Cómo anda el auto?"; el aire que no enfría entra en "un detalle" y ya no hay pregunta aparte), choques, repintado y service en 2 preguntas (D-40, 13/10): dónde se hicieron (oficial, oficial en garantía y después taller, taller de confianza, no sé) con foto opcional de la libreta sellada si fue en el oficial, y cuándo fue el último. Lo bueno suma un poco, con tope de +3% (único dueño +1%, sin choques ni repintados +1%, services oficiales al día +1,5% y +0,5% con la foto de la libreta, oficial y después taller +1%); al vendedor no se le dice cuánto suma cada cosa.',ids:['D-40','D-25','D-24','VEN-07','PRE-05'],c:['¿Se entiende la pregunta de dónde se hicieron los services?','Probá "Responder con un auto sin problemas": el precio afinado sube un poco respecto del primero.']},
  rango2:{t:'Precio afinado (N2)',w:'13/10: va antes de las fotos. Una sola cifra con lo que declaró el vendedor (D-20); lo bueno suma un poco (D-40). Todavía no incluye lo que se ve en las fotos: eso entra en N3, después de nuestra revisión.',ids:['D-41','D-40','D-25','D-20','VEN-16'],c:['¿Se entiende que lo de las fotos puede mover el precio después?']},
  documentos:{t:'Papeles',w:'12/10: los papeles van después de aceptar el precio y el mínimo, así no le pedimos el DNI a quien no quiere vender. Una pregunta por tarjeta: ¿el auto está a tu nombre? (si no, por ahora no se publica; si es compartido, se publica avisando que también firma el cotitular), verificación policial vigente (si la tiene, foto del formulario 12 e insignia), fotos de cédula verde y número de chasis grabado (anti "mellizos"), y DNI + selfie (RENAPER). 13/10: prenda, estado civil (el informe dice si el bien es ganancial) y foto del título se sacaron: salen del informe de dominio. 16/10 (D-44): vuelve una pregunta: "¿Tenés el título?" (en papel, digital o no lo encuentro), sin foto: el informe trae el número pero no dice si lo tiene. Identidad con número de DNI + sexo + selfie, que el proveedor compara con la foto del RENAPER (con prueba de vida); las fotos del DNI quedan como plan B. La foto del chasis pide que se vea también la patente grabada en el vidrio.',ids:['DOC-01','DOC-02','DOC-10','DOC-18','TEC-08','D-37'],c:['¿Se entiende que lo que no preguntamos lo sacamos del informe?','El auto a nombre de otra persona queda afuera por ahora (12/10): se abre si hace falta.']},
  verificando:{t:'Revisión de fotos',w:'Una persona revisa en las fotos chapa (con granizo), vidrios, cubiertas, interior y luces del tablero (D-25). Lo que encuentra entra en el precio de N3. La versión ya viene de la patente; la cédula se compara después, en el chequeo final (si no coincide, se corrige, se recalcula y el vendedor vuelve a aceptar).',ids:['D-25','DOC-10','DOC-03','DOC-09','TEC-05'],c:['¿Qué tiempo de respuesta prometemos?','Probá "en las fotos vemos 2 rayones y 2 cubiertas" para ver cómo baja el precio sugerido.']},
  precio:{t:'Precio sugerido y mínimo (N3)',w:'D-51 (18/10): rango = piso (lo que paga una agencia hoy, ya con lo que vimos en las fotos) a piso + 6%; precio sugerido = mitad del rango. A la vista: si el mínimo está cerca del piso, más chances de vender. El primer botón es "Usar el piso (más chances)". Si pide más que el techo, no publicamos (D-18). La subasta arranca desde el piso.',ids:['D-51','D-25','VEN-10','D-18','D-20'],c:['¿Se entiende la diferencia entre sugerido, rango y mínimo?','¿Empujar el mínimo hacia el piso se lee como consejo o como presión?','Si pide más que el techo, bloqueamos. ¿El texto es claro sin ser antipático?']},
  confirmar:{t:'Confirmación',w:'Resumen y reglas (D-25 y D-29). Revisión UX (14/10, M10): arriba el mínimo, el rango y la subasta; las 2 reglas clave a la vista (se vende si llega al mínimo; si no, 24 horas para decidir (D-47) y 30 días afuera) y el aviso del chequeo final; el resto de las reglas y los datos del auto, desplegables. Mismos textos que antes. 16/10 (D-45): el aviso dice que antes de la subasta pedimos el informe de dominio y que multas, deuda, VTV y GNC se revisan si vende, con su consentimiento.',ids:['D-25','D-29','D-18','VEN-11','SUB-06','LEG-02','LEG-04'],c:['¿Se leen las 2 reglas clave?','24 horas para decidir (D-47, antes 4 h).','Términos y privacidad: placeholders hasta LEG-02 y LEG-04.']},
  enviado:{t:'Chequeo final',w:'12/10: con el OK final pedimos el informe de dominio a la DNRPA (a mano, por orden de llegada, el mismo día hábil) y lanzamos las consultas de multas, deuda de patente, VTV y GNC de fondo. Fecha probable de subasta: hoy + 3 días hábiles (pedido + hasta 48 h de la DNRPA + la subasta siguiente). Si a los 30 minutos las consultas no terminan, quedan incompletas y las revisa el moderador. 16/10 (D-44): en las fotos se mira el grabado de autopartes (CABA, Ley 3.708; Provincia, Ley 14.497). Si no se ve, se informa y se le avisa al vendedor; no frena. 16/10 (D-45): antes de la subasta solo informe de dominio + identidad (RENAPER). Multas, deuda de patente, VTV y GNC pasan a cuando acepta vender: una sola consulta en lugar de dos, y nada de gasto en los autos que no se venden.',ids:['D-26','DOC-11','DOC-17','DOC-18'],c:['Probá los tres finales: todo en regla, la versión no coincide y un embargo.','16/10 (TEC-11): los días hábiles ya cuentan los feriados oficiales y los locales de AMBA (ej. 9, 10 y 11/11 por la visita del Papa).']},
  informe:{t:'Informe del auto (para el vendedor)',w:'D-39 (13/10): cuando el vendedor acepta vender, recibe el informe de Yacar (qué verificamos, con fuente y fecha, y cómo validar el informe del Registro) y el PDF oficial del Registro. Lo puede descargar en PDF o compartir con la agencia. Las agencias ya vieron estos mismos chequeos (sin datos personales) en la ficha de la subasta.',ids:['D-39','D-38','D-37','AGE-05'],c:['¿El diseño sirve para llevarlo a la visita o mandarlo por WhatsApp?','En la web real: el PDF lo arma el servidor y "Compartir" manda un link.']},
  miauto:{t:'Mi auto',w:'Con los papeles en regla entra a la subasta (D-25): si la mejor oferta llega al mínimo, se vende sin volver a preguntar; si queda por debajo, 24 horas para aceptar (D-47); si no, 30 días afuera. Abajo, el resultado del chequeo final con la fuente oficial de cada dato (nunca el proveedor) y la aclaración de que no es un certificado (REGLAS_RESULTADOS_API.md). La VTV avisa si vence en menos de 30 días. 16/10 (D-44): al vender, "Antes de la visita: pedí el certificado de dominio" (solo lo pide el titular, online, unos $ 4.200, llega en 24 h y congela el auto 15 días hábiles) y "Para el día de la firma" (qué llevar y la denuncia de venta). La agencia recibe la ficha para la transferencia con el contacto. 16/10 (D-45): al vender, primero el consentimiento para consultar multas, deuda, VTV y GNC y compartir el informe completo con la agencia; después, los resultados (simulados: sin deudas o con deuda y una multa) y el informe completo.',ids:['D-25','SUB-06','VEN-12','VEN-13','SUB-04','D-05'],c:['Probá los dos finales: llega al mínimo y queda por debajo.','¿Los textos del chequeo final se entienden?','Al aceptar, ¿qué datos de la agencia le mostramos?']},
};
function notas(){
  const n = N[S.paso];
  $('#nTitle').textContent = n.t; $('#nWhat').textContent = n.w;
  $('#nIds').innerHTML = n.ids.map(i=>`<span>${i}</span>`).join('');
  $('#nCheck').innerHTML = n.c.map(x=>`<li>${esc(x)}</li>`).join('');
  $('#nJump').innerHTML = PASOS.map(p=>`<button type="button" data-jump="${p}" ${p===S.paso?'aria-current="step"':''}>${NOMBRE_PASO[p]}</button>`).join('');
}

// ------------------------------------------------------------ render y eventos
const CARGA_TXT = {
  rango1:['Buscando autos como el tuyo','Ajustando por año y kilómetros','Calculando lo que paga una agencia'],
  rango2:['Sumando lo que nos contaste del estado','Mirando el service y los choques','Afinando tu precio'],
  precio:['Sumando lo que vimos en las fotos','Revisando la versión del auto','Calculando tu precio sugerido y el rango']};
const DURACION = p => p==='precio' ? 3 : 2;   // M9 (14/10): 2 s en N1 y N2, 3 s en N3 (antes 4,4 s)
function cargandoHTML(){
  const t = CARGA_TXT[S.paso], dur = DURACION(S.paso);
  return `<div class="screen cargando" role="status" aria-live="polite">
    <div class="ruta" aria-hidden="true"><svg class="autito" width="46" height="30" viewBox="0 0 46 30"><path d="M4 21h38M8 21l4-10c1-3 3-4 6-4h10c3 0 5 1 6 4l4 10" stroke="#123F2C" stroke-width="2.6" fill="#B8E04A" stroke-linejoin="round"></path><circle cx="13" cy="23" r="4" fill="#123F2C"></circle><circle cx="33" cy="23" r="4" fill="#123F2C"></circle></svg></div>
    <h2>${S.paso==='precio' ? 'Calculando tu precio sugerido' : S.paso==='rango2' ? 'Afinando tu precio' : 'Calculando tu precio'}</h2>
    <ul class="pasoscarga">${t.map((x,i)=>`<li style="animation-delay:${(0.2+i*dur*0.28).toFixed(2)}s">${x}</li>`).join('')}</ul>
    <div class="barracarga" aria-hidden="true"><i style="animation-duration:${dur}s"></i></div>${S.mktEsperando ? '<p class="fine" style="margin-top:14px">Estamos comparando con autos como el tuyo publicados hoy. Puede tardar unos segundos más.</p>' : ''}</div>`;
}
const EN_INICIO = ['datos','previo','rango1'];   // 'previo' (17/10): las 3 preguntas mientras corre la búsqueda de mercado
const FLUJO = PASOS.filter(p => !EN_INICIO.includes(p));
let ultimaClave = '';
// M8 (14/10): una sola guía de avance, en 4 etapas grandes
const ETAPA = {registro:0, codigo:0, auto:0, estado:0, rango2:0, fotos:1, verificando:1, precio:2, confirmar:2, documentos:3, enviado:3};
const ETAPAS = ['Tu auto','Fotos','Precio','Papeles'];
function render(scroll){
  if (S.vid && S.anio) mktIniciar(S.vid, +S.anio);   // D-49: la búsqueda de mercado arranca apenas se sabe la versión
  else if (S.patEstado==='confirmar' && S.patM && (S.patSel || S.patCands.length===1)) mktIniciar(S.patSel || S.patCands[0], +S.patM.anio);   // 17/10: con la patente, antes de confirmar
  if (S.paso==='datos' && subpasoCotizador()==='km' && !previasOk()){   // 17/10: confirmada la versión, las 3 preguntas antes de los km
    S.paso = 'previo'; S.qi.previo = Math.max(0, QS.previo().findIndex(q => !q.ok())); if (!S.anim) S.anim = 'fwd'; }
  const inicio = EN_INICIO.includes(S.paso), card = $('#card');
  const slot = inicio ? $('#slotHero') : $('#slotFlujo');
  if (card.parentNode !== slot) slot.appendChild(card);
  $('#inicio').hidden = !inicio; $('#flujo').hidden = inicio;
  $('#nav').hidden = !inicio; $('#salir').hidden = inicio;
  document.body.classList.toggle('en-flujo', !inicio);
  // Pantalla o pregunta nueva: se reemplaza y entra con su animación. Misma pantalla: se actualiza solo lo que cambió (Suave.poner).
  const clave = S.cargando ? 'carga' : S.paso + (QS[S.paso] ? ':' + (S.qi[S.paso]||0) + ':' + (S.cpEstado||'') + (S.estResumen ? ':r' : '') : '') + (S.paso==='fotos' ? ':' + S.fotoFase + ':' + S.fotoIdx : '');
  const html = S.cargando ? cargandoHTML() : V[S.paso]();
  const nueva = clave !== ultimaClave;
  if (S.anim || nueva) $('#app').innerHTML = html; else Suave.poner($('#app'), html);
  if (nueva && !S.anim && !QS[S.paso] && S.paso!=='fotos') Suave.entrar($('#app').firstElementChild, 'fade');
  if (S.anim && !QS[S.paso] && S.paso!=='datos' && S.paso!=='fotos'){ const sc = $('#app .screen'); if (sc) sc.classList.add('entra-'+S.anim); }
  if (nueva && ultimaClave && !inicio && !S.cargando){ const h = $('#app .qcard h3, #app .ftit, #app .screen h2'); if (h){ h.setAttribute('tabindex','-1'); try { h.focus({preventScroll:true}); } catch(e){} } }   // D12
  ultimaClave = clave;
  S.anim = '';
  const et = ETAPA[S.paso];
  $('.cardtop').hidden = inicio || et==null;
  $('#etapas').innerHTML = et==null ? '' : ETAPAS.map((n,i)=>`<li class="${i<et?'hecha':i===et?'ahora':''}" ${i===et?'aria-current="step"':''}><i></i><span>${n}</span></li>`).join('');
  notas();
  navRegistrar(); guardar();
  if (scroll){
    if (inicio) card.scrollIntoView({block:'nearest', behavior:'smooth'});
    else window.scrollTo({top:0, behavior:'smooth'});
  }
}
// ------------------------------------------------------------ B1 (14/10): guardar el avance en el celular
// El estado va a localStorage; las fotos (ya achicadas) a IndexedDB. En la web real, además, al servidor (link por WhatsApp para seguir).
const GUARDA = 'yacar.vendedor.v1', GRUPOS_FOTO = ['fotos','danios','docs','dni','svfoto'];
function guardar(){
  try {
    const c = JSON.parse(JSON.stringify(S));
    GRUPOS_FOTO.forEach(g => { for (const k in c[g]) if (String(c[g][k]).startsWith('blob:')) c[g][k] = 'idb'; });
    c.cargando = false; c.anim = '';
    if (c.patEstado==='buscando') c.patEstado = '';
    localStorage.setItem(GUARDA, JSON.stringify({s:c, fq:FQ, t:Date.now()}));
  } catch(e){}
}
let tGuardar = 0; const guardarLuego = () => { clearTimeout(tGuardar); tGuardar = setTimeout(guardar, 400); };
const IDB = {
  db: null,
  abrir(){ return this.db || (this.db = new Promise((ok, mal) => { try { const r = indexedDB.open('yacar-fotos', 1); r.onupgradeneeded = () => r.result.createObjectStore('f'); r.onsuccess = () => ok(r.result); r.onerror = () => mal(r.error); } catch(e){ mal(e); } })); },
  async poner(k, b){ try { const db = await this.abrir(); await new Promise((ok, mal) => { const t = db.transaction('f','readwrite'); t.objectStore('f').put(b, k); t.oncomplete = ok; t.onerror = () => mal(t.error); }); } catch(e){} },
  async traer(k){ try { const db = await this.abrir(); return await new Promise(ok => { const r = db.transaction('f').objectStore('f').get(k); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); }); } catch(e){ return null; } },
  async vaciar(){ try { const db = await this.abrir(); db.transaction('f','readwrite').objectStore('f').clear(); } catch(e){} }
};
function recuperar(){   // al abrir la web: vuelve el avance (las fotos llegan un instante después)
  let g = null; try { g = JSON.parse(localStorage.getItem(GUARDA) || 'null'); } catch(e){}
  if (!g || !g.s) return false;
  const base = S0(); S = Object.assign(base, g.s); S.det = Object.assign(S0().det, g.s.det || {});
  Object.assign(FQ, g.fq || {});
  return !EN_INICIO.includes(S.paso) || !!S.pasoGuardado;
}
async function cargarFotosGuardadas(){
  let cambio = false;
  for (const g of GRUPOS_FOTO) for (const k in S[g]) if (S[g][k]==='idb'){ const b = await IDB.traer(g+'|'+k); if (b) S[g][k] = URL.createObjectURL(b); else delete S[g][k]; cambio = true; }
  if (cambio) render();
}
function borrarAvance(){ try { localStorage.removeItem(GUARDA); } catch(e){} IDB.vaciar(); for (const k in FQ) delete FQ[k]; }
// B4 (14/10): cada foto se achica en el celular (lado largo 1.600 px, ~300 KB) antes de guardarla; la revisión de calidad usa la original.
async function achicar(file, max=1600, q=0.82){
  const img = await createImageBitmap(file, {imageOrientation:'from-image'});
  const k = Math.min(1, max/Math.max(img.width, img.height));
  if (k===1 && file.size < 900*1024) return file;
  const c = document.createElement('canvas'); c.width = Math.round(img.width*k); c.height = Math.round(img.height*k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return await new Promise(ok => c.toBlob(b => ok(b || file), 'image/jpeg', q));
}
// 16/10 (D-44): lo mismo para la foto que llega del input (cámara del celular o galería) y la de la cámara de la web (vivo = true)
function procesarArchivo(g, k, file, vivo){
  delete FQ[g+'|'+k];
  if (g==='cert'){ S.certDom = 'subido'; S.certFecha = S.certFecha || fechaCorta(HOY); render(); guardar(); aviso('Listo: recibimos tu certificado de dominio. Se lo pasamos a la agencia.'); return; }
  guardarFoto(g, k, file).then(()=>{ render(); guardar(); });
  if (g==='fotos' || g==='danios') analizarFoto(file, vivo).then(r=>{ FQ[g+'|'+k] = r; repetidas(g); render(); guardar();
    // 18/10 (Gonzalo): si la foto salió bien, pasa sola a la siguiente
    const aca = () => S.paso==='fotos' && S.fotoFase==='foto' && SECUENCIA[S.fotoIdx]===k && !S.fotoVolver;
    if (g==='fotos' && !r.avisos.length && !FQ[g+'|'+k].repetida && aca()) setTimeout(()=>{ if (aca() && S.fotos[k]) fotoSiguiente(); }, 1100); });
}
async function guardarFoto(g, k, file){
  let blob = file; try { blob = await achicar(file); } catch(e){}
  const viejo = S[g][k]; if (viejo && String(viejo).startsWith('blob:')) URL.revokeObjectURL(viejo);
  S[g][k] = URL.createObjectURL(blob); await IDB.poner(g+'|'+k, blob);
}
// ------------------------------------------------------------ B2 (14/10): cada pantalla y cada pregunta es un paso del navegador
let navD = 0, ultimaNav = '', restaurando = false;
function navEstado(){ return {p:S.paso, q:QS[S.paso] ? (S.qi[S.paso]||0) : null, ff:S.paso==='fotos' ? S.fotoFase+':'+S.fotoIdx : '', er:S.estResumen ? 1 : 0}; }
function navRegistrar(){
  if (S.cargando || document.body.classList.contains('modo-ag')) return;
  const n = navEstado(), k = [n.p, n.q, n.ff, n.er].join('|');
  if (k===ultimaNav) return;
  try {
    if (restaurando || !ultimaNav) history.replaceState({yc:n, d:navD}, '');
    else { navD++; history.pushState({yc:n, d:navD}, ''); }
  } catch(e){}
  ultimaNav = k; restaurando = false;
}
window.addEventListener('popstate', ev => {
  const st = ev.state && ev.state.yc;
  if (!st || document.body.classList.contains('modo-ag')) return;
  navD = ev.state.d || 0; restaurando = true;
  if (S.paso==='previo' && st.p==='datos'){ if (S.patEstado==='ok') S.patEstado = 'confirmar'; else S.vid = ''; }   // 17/10: si no, volvería a las preguntas
  S.paso = st.p; S.cargando = false; cargaTk++;
  if (st.q!=null) S.qi[st.p] = st.q;
  if (st.ff){ const [f, i] = st.ff.split(':'); S.fotoFase = f; S.fotoIdx = +i; }
  S.estResumen = !!st.er; S.volverResumen = false;
  S.anim = 'back'; render(true);
});
// Aviso corto abajo de la pantalla
function aviso(t){
  let el = $('#aviso'); if (!el){ el = document.createElement('div'); el.id = 'aviso'; el.className = 'aviso'; el.setAttribute('role','status'); document.body.appendChild(el); }
  el.textContent = t; el.classList.add('ver'); clearTimeout(el._t); el._t = setTimeout(()=>el.classList.remove('ver'), 3600);
}
function salirGuardando(msg){   // M7: "Salir" y "Seguir más tarde" guardan dónde quedó
  if (!EN_INICIO.includes(S.paso)) S.pasoGuardado = S.paso;
  S.paso = 'datos'; S.cargando = false; render(); window.scrollTo({top:0, behavior:'smooth'}); aviso(msg);
}
const PRECIOS = ['rango1','rango2','precio'];
let cargaTk = 0;
function go(p, opts={}){
  const desde = S.paso;
  if (p==='auto' && previasOk()) p = desde==='estado' ? 'codigo' : 'estado';   // 17/10: ya se contestaron antes de los km
  S.paso = p;
  if (QS[p] && desde!==p && !(p==='estado' && S.estResumen)){ const l = QS[p](); S.qi[p] = opts.alFinal ? l.length-1 : Math.max(0, l.findIndex(q=>!q.ok())); }
  if (p==='codigo' && desde!=='codigo' && cuentaReal()){
    if (YacarCuenta.vendedorEs(S.email)) return go('auto');
    S.codigo = ''; S.codErr = ''; mandarCodigo();
  }
  if (p==='codigo' && desde!=='codigo') S.codEnviado = Date.now();
  if (p==='fotos' && desde!=='fotos'){ S.fotoVolver = false; entrarFotos(); }
  if (p==='registro') S.pasoGuardado = '';
  S.anim = desde!==p ? (opts.alFinal ? 'back' : 'fwd') : '';
  if (PRECIOS.includes(p) && desde!==p){
    S.cargando = true; S.mktEsperando = false; const tk = ++cargaTk, rapido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const listo = ()=>{ if (tk===cargaTk && S.cargando){ S.cargando=false; S.anim='fade'; render(); } };
    setTimeout(()=> mktEsperar(S.vid, +S.anio, kmNum(), listo), rapido ? 1000 : DURACION(p)*1000 + 200);   // D-49: si el precio de mercado no llegó, se espera (hasta 60 s)
  } else S.cargando = false;
  render(true);
}
function ejemploDatos(){
  if (!S.vid){ S.marca='FIAT'; S.modelo='CRONOS'; S.anio='2022'; const v = versionesAnio('FIAT','CRONOS','2022').find(v=>/DRIVE GSE 2022/.test(v[1]))||versionesAnio('FIAT','CRONOS','2022')[0]; S.vid=v[0]; S.km='60.000';
    Object.assign(S, {patente:'AF 482 KD', patEstado:'ok', patNota:'', patCands:[v[0]], patSel:v[0], patM:{marca:'FIAT', modelo:'CRONOS', anio:'2022', versiones:[v[0]], nivel:'version'}}); }
  if (!S.nombre){ S.nombre='Lucía'; S.cel='11 2345 6789'; }
}
function completarHasta(p){
  const i = PASOS.indexOf(p), antes = x => i > PASOS.indexOf(x);
  if (i>=1) ejemploDatos();
  if (antes('previo')) ejemploAuto();
  if (antes('auto')){ if (!S.codigo) S.codigo = '482915'; ejemploAuto(); }
  if (antes('fotos')){ FOTOS.forEach(f=>{ if(!S.fotos[f[0]]) S.fotos[f[0]]='ejemplo'; }); if (!S.daniosResp) S.daniosResp='no'; S.fotoFase='resumen'; }
  if (antes('estado') && respondidas()<ITEMS().length) ejemploEstado(false);
  if (antes('verificando')){ S.noCoincide=false; if (!S.rev) S.rev = Object.assign({}, REV_LIMPIA); }
  if (antes('precio')){ if(!S.minimo) S.minimo = KM(calcular(3).sugerido); S.acuerdo=true; }
  if (antes('confirmar')){ S.terminos=true; S.aceptoReglas=true; }
  if (antes('documentos')) ejemploDocs();
  if (antes('enviado')){ S.noCoincide=false; S.papeles='ok'; }
}
function ejemploDocs(){
  DOCS.forEach(d=>{ if(!S.docs[d[0]]) S.docs[d[0]]='ejemplo'; });
  if (!S.titular || S.titular==='no') S.titular='yo'; if (!S.titulo) S.titulo='digital'; if (!S.vpol) S.vpol='no';
  if (S.dniPlanB) DNI.forEach(d=>{ if(!S.dni[d[0]]) S.dni[d[0]]='ejemplo'; }); else { if (!dniNumOk()) S.dniNum='30123456'; if (!S.dniSexo) S.dniSexo='F'; }
  if (!S.dni.selfie) S.dni.selfie='ejemplo';
}
function ejemploAuto(){ if (!S.patente) S.patente='AF 482 KD'; if (!S.cuando) S.cuando='30dias'; if (!S.partido){ S.cp='1708'; S.cpTexto='1708'; S.cpZona={cp:'1708',localidad:'Morón',partido:'Morón'}; S.cpEstado='confirmar'; S.partido='Morón'; S.localidad='Morón'; S.duenos='1'; S.uso='no'; S.llaves='2'; } }
function ejemploEstado(conProblemas){   // D-25: solo lo que responde el vendedor
  for (const q of SUP.preguntas) if ((q.responde||'vendedor')==='vendedor' && q.id!=='service') S.resp[q.id] = q.opciones[0].id;
  Object.assign(S.det, {repintado:'no', repintadas:[], mecTxt:'', choqueDonde:[], svLugar:'oficial', svCuando:'6m'}); if (!S.llaves) S.llaves = '2';
  if (conProblemas){ S.resp.mecanica='fallas_menores'; S.det.mecTxt='Ruido en el tren delantero al pasar lomos de burro'; S.det.svLugar='taller'; S.det.svCuando='mas'; }
}
document.addEventListener('click', ev => {
  const home = ev.target.closest('a[data-home]');
  if (home){ ev.preventDefault(); if (!EN_INICIO.includes(S.paso)) salirGuardando('Guardamos tu avance. Podés seguir cuando quieras.'); else { render(); window.scrollTo({top:0,behavior:'smooth'}); } return; }
  const t = ev.target.closest('button'); if (!t) return;
  if (t.id==='protoBtn'){ const n = $('#notas'); n.hidden = !n.hidden; t.setAttribute('aria-expanded', String(!n.hidden)); return; }
  if (t.id==='menuBtn'){ const h = $('header.site'), ab = !h.classList.contains('abierto'); h.classList.toggle('abierto', ab); t.setAttribute('aria-expanded', String(ab)); t.setAttribute('aria-label', ab ? 'Cerrar el menú' : 'Abrir el menú'); return; }   // 15/10: menú en el celular
  const d = t.dataset;
  if (d.camara){ const [g, k] = d.camara.split('|'); Camara.abrir(g, k); }
  else if (d.go){ if ('acuerdo' in d) S.acuerdo = true; if ('terminos' in d) S.terminos = true; go(d.go); }   // 18/10: el botón vale como acuerdo con el rango / aceptación de términos
  else if (d.jump){ completarHasta(d.jump); go(d.jump); }
  else if (d.ejemplo==='fotos'){ FOTOS.forEach(f=>{ if(!S.fotos[f[0]]) S.fotos[f[0]]='ejemplo'; }); if (!S.daniosResp) S.daniosResp='no'; S.fotoFase='resumen'; S.fotoVolver=false; render(); }
  else if (d.ejemplo==='fotos2'){ FOTOS.forEach(f=>{ if(!S.fotos[f[0]]) S.fotos[f[0]]='ejemplo'; }); S.daniosResp='si'; S.nDanios=2; S.danios={d1:'ejemplo', d2:'ejemplo'}; S.fotoFase='resumen'; S.fotoVolver=false; render(); }
  else if (d.dr){ S.daniosResp = d.dr; if (d.dr==='no'){ S.danios = {}; S.nDanios = 1; } render(); }
  else if (d.dr2){ S.daniosResp = 'no'; S.danios = {}; S.nDanios = 1; irFase('finAfuera'); }
  else if (d.fsesion){ if (!empezarSesion()){ const inp = $('#f_' + d.fsesion); if (inp) inp.click(); } }   // 18/10: sesión de cámara; sin cámara en la web, la del celular
  else if ('fempezar' in d){ if (!S.daniosResp) return; if (empezarSesion()) return; const i = SECUENCIA.findIndex(k=>!S.fotos[k]); if (i<0) irFase(S.daniosResp==='si' && !Object.keys(S.danios).length ? 'danios' : 'resumen'); else irFase('foto', i); }
  else if ('fsig' in d || 'fsaltar' in d){ fotoSiguiente(); }
  else if ('fadentro' in d){ const i = SECUENCIA.findIndex((k,j)=>j>=AFUERA && !S.fotos[k]); irFase(i<0 ? 'resumen' : 'foto', i<0 ? null : i); }
  else if ('fatras' in d){ atras(fotoAtrasLocal); }
  else if ('fmastarde' in d){ salirGuardando('Listo, guardamos tus fotos. Seguí cuando quieras desde acá o desde el link que te mandamos por WhatsApp.'); }
  else if (d.irfoto!=null && d.irfoto!==''){ S.fotoVolver = S.fotoFase==='resumen'; irFase('foto', +d.irfoto); }
  else if ('seguir' in d){ const p = S.pasoGuardado; S.pasoGuardado = ''; go(p); }
  else if ('denuevo' in d){ borrarAvance(); S = S0(); ultimaClave = ''; render(true); }
  else if ('reenviar' in d){ S.codEnviado = Date.now(); if (cuentaReal()){ S.codErr = ''; mandarCodigo(); } render(); aviso(cuentaReal() ? 'Te mandamos un código nuevo a tu mail.' : 'Te mandamos un código nuevo por WhatsApp.'); }
  else if ('codok' in d){ verificarCodigo(); }
  else if ('sms' in d){ S.codEnviado = Date.now(); render(); aviso(`Te mandamos el código por SMS al ${S.cel}.`); }
  else if (d.sexo){ S.dniSexo = d.sexo; render(); }
  else if (d.dniplanb!=null && d.dniplanb!==''){ S.dniPlanB = d.dniplanb==='1'; render(); }
  else if ('consentir' in d){ S.consent = true; S.consultas = 'pendiente'; render(); }
  else if (d.consultas){ S.consultas = d.consultas; render(); }
  else if ('certpedido' in d){ S.certDom = 'pedido'; S.certFecha = fechaCorta(HOY); render(); aviso('Anotado. Cuando te llegue el mail del Registro, subí el certificado acá.'); }
  else if ('ayuda' in d){ aviso('Prototipo: acá se abre un chat de WhatsApp con una persona de Yacar.'); }
  else if ('estresumen' in d){ S.estResumen = true; go('estado'); }
  else if (d.cambiarq!=null && d.cambiarq!==''){ conTransicion('fwd', ()=>{ S.estResumen = false; S.volverResumen = true; S.qi.estado = +d.cambiarq; S.anim = 'fwd'; render(true); }); }
  else if ('verprecio' in d){ S.estResumen = false; go('rango2'); }
  else if ('cplargo' in d){ S.cpLargo = true; render(); const f = $('#a_cp'); if (f) f.focus(); }
  else if ('qopt' in d){ if (qLock) return; const [l,i] = qActual(), q = l[i]; q.set(d.qopt); const ex = q.extra ? q.extra(d.qopt) : ''; render();
    if (!ex){ qLock = true; setTimeout(()=>{ qLock = false; qAvanzar(); }, 280); } }
  else if ('qnext' in d){ const [l,i] = qActual(); if (l[i].ok()) qAvanzar(); }
  else if ('qback' in d){ atras(qAtras); }
  else if ('cpbuscar' in d){ qBuscarCP(); }
  else if ('cpsi' in d){ S.partido = S.cpZona.partido; S.localidad = S.cpZona.localidad; render(); qLock = true; setTimeout(()=>{ qLock=false; qAvanzar(); }, 200); }
  else if (d.cpbarrio){ S.partido = 'Ciudad de Buenos Aires'; S.localidad = d.cpbarrio; render(); qLock = true; setTimeout(()=>{ qLock=false; qAvanzar(); }, 200); }
  else if ('cpotrobarrio' in d){ S.cpEstado = 'barrio'; render(); }
  else if ('cpnose' in d){ S.cpZona = null; S.cp = ''; S.cpTexto = ''; S.cpEstado = 'elegir'; render(); }
  else if ('cpno' in d){ S.cpEstado = 'elegir'; render(); }
  else if ('avisozona' in d){ if (celValido(S.cel)){ S.avisoZona = true; render(); } }
  else if ('cpfuerasigue' in d){ S.cpFueraOk = true; qAvanzar(); }
  else if ('cpcambiar1' in d){ Object.assign(S, {cpEstado:'', partido:'', localidad:'', cpFueraOk:false, previoVolver:'rango1'}); go('previo'); }
  else if ('cpcambiar' in d){ S.cpFueraOk = false; S.cpEstado = ''; S.partido = '';  S.localidad = ''; S.anim = 'back'; render(); const f=$('#a_cp'); if (f) f.focus(); }
  else if (d.cppartido){ if (d.cppartido==='otro'){ S.partido='otro'; S.cpEstado='fuera'; render(); } else if (d.cppartido==='Ciudad de Buenos Aires'){ S.cpEstado='barrio'; render(); } else { S.partido = d.cppartido; S.localidad = ''; qAvanzar(); } }
  else if (d.ejemplo==='auto'){ ejemploAuto(); go('estado'); }
  else if ('pbuscar' in d){ buscarPat(); }
  else if (d.pejemplo){ S.patente = fmtPatente(d.pejemplo); S.patEstado = ''; buscarPat(); }
  else if (d.pcand){ S.patSel = d.pcand; render(); }
  else if ('pconf' in d){ if (!S.patSel || qLock) return; const m = S.patM, vid = S.patSel;
    conTransicion('fwd', ()=>{ Object.assign(S, {marca:m.marca, modelo:m.modelo, anio:m.anio, vid, patEstado:'ok', patNota:''}); S.anim='fwd'; render(true); const k=$('#s_km'); if (k) k.focus(); }); }
  else if ('pno' in d){ aManual('Elegí tu auto.'); }
  else if ('potraver' in d){ const m = S.patM; aManual('Elegí la versión: figura en la cédula.', {marca:m.marca, modelo:m.modelo, anio:m.anio}); }
  else if (d.ejemplo==='cotizar'){ ejemploDatos(); ejemploAuto(); go('rango1'); }
  else if (d.ejemplo==='previo'){ ejemploAuto(); go('datos'); }
  else if (d.ejemplo==='registro'){ S.nombre=S.nombre||'Lucía'; S.cel=S.cel||'11 2345 6789'; render(); }
  else if (d.ejemplo==='precio'){ S.minimo = KM(calcular(3).sugerido); S.acuerdo = true; render(); }
  else if (d.ejemplo==='confirmar'){ S.terminos = true; S.aceptoReglas = true; render(); }
  else if (d.pmarca || d.pmodelo || d.panio || d.pver){ if (qLock) return; qLock = true;
    const v = {pmarca:d.pmarca, pmodelo:d.pmodelo, panio:d.panio, pver:d.pver};
    t.setAttribute('aria-pressed','true');
    setTimeout(()=>conTransicion('fwd', ()=>{ qLock = false; S.anim = 'fwd'; S.patNota = '';
      if (v.pmarca) Object.assign(S, {marca:v.pmarca, modelo:'', anio:'', vid:'', verTodosModelos:false});
      else if (v.pmodelo) Object.assign(S, {modelo:v.pmodelo, anio:'', vid:''});
      else if (v.panio){ S.anio = v.panio; S.vid = ''; const vs = versionesAnio(S.marca,S.modelo,S.anio); if (vs.length===1) S.vid = vs[0][0]; }
      else S.vid = v.pver;
      render(true); if (S.vid){ const k=$('#s_km'); if (k) k.focus(); } }), 180); }
  else if (d.ptodas){ if (d.ptodas==='marcas') S.verTodasMarcas = true; else S.verTodosModelos = true; render(); }
  else if ('patras' in d){ if (qLock) return; conTransicion('back', ()=>{ S.anim='back'; const sp = subpasoCotizador();
    if (S.patEstado==='ok'){ S.patEstado='confirmar'; S.patSel=S.vid; }       // confirmó con la patente: vuelve a "¿Es tu auto?"
    else if (sp==='marca'){ S.patEstado=''; S.patNota=''; }                  // camino manual: vuelve a la patente
    else if (sp==='km'){ const vs = versionesAnio(S.marca,S.modelo,S.anio); S.vid=''; if (vs.length===1) S.anio=''; }
    else if (sp==='version') S.anio='';
    else if (sp==='anio') S.modelo='';
    else S.marca='';
    render(true); }); }
  else if (d.cuando){ S.cuando = S.cuando===d.cuando ? '' : d.cuando; render(); }
  else if (d.masdanio){ S.nDanios++; render(); }
  else if (d.fin){ finSubasta(d.fin); render(); }
  else if (d.ejemplo==='docs'){ ejemploDocs(); go('enviado'); }
  else if (d.ejemplo==='codigo'){ S.codigo = '482915'; render(); }
  else if ('imprimir' in d){ window.print(); }
  else if ('compartir' in d){ const txt = `Informe de Yacar: ${nombreAuto()}, patente ${S.patente}`; if (navigator.share) navigator.share({title:'Informe del auto', text:txt}).catch(()=>{}); else { const n=$('#compNota'); if (n) n.textContent='Prototipo: acá se manda el link del informe por WhatsApp a la agencia.'; } }
  else if ('pdfoficial' in d){ const n=$('#pdfNota'); if (n) n.textContent='Prototipo: acá se descarga el PDF que mandó el Registro del Automotor. Lo guardamos cifrado 30 días desde que se emitió y después se borra.'; }
  else if (d.final==='ok'){ S.papeles='ok'; S.grabado='visto'; S.avance=0; go('miauto'); }
  else if (d.final==='grabado'){ S.papeles='ok'; S.grabado='no'; S.avance=0; go('miauto'); }
  else if (d.final==='version'){ S.noCoincide=true; go('verificando'); }
  else if (d.final==='duenos'){ const antes = calcular(3).sugerido, decl = S.duenos; S.duenosInforme = decl==='1' ? '2' : '3'; const e = calcular(3), m = parseInt(String(S.minimo).replace(/\D/g,''),10);
    S.ajusteInforme = {antes, despues:e.sugerido, duenos:S.duenosInforme==='3'?'3 o más':S.duenosInforme, declarado:decl, bajarMinimo: m > e.maximo};
    if (m > e.maximo){ S.acuerdo=false; go('precio'); } else { S.papeles='ok'; S.avance=0; go('miauto'); } }
  else if (d.final==='frena'){ S.papeles='frena'; render(); }
  else if (d.ejemplo==='estado'){ ejemploEstado(false); go('rango2'); }
  else if (d.ejemplo==='estado2'){ ejemploEstado(true); go('rango2'); }
  else if (d.cnt){ const [q,o,inc] = d.cnt.split('|'); const r = S.resp[q] = S.resp[q]||{}; const max = MOTOR.MAX_CANT[q]||15;
    const tot = Object.values(r).reduce((a,b)=>a+b,0); const nv = Math.max(0,(r[o]||0)+ +inc); if (+inc>0 && tot>=max) return; r[o]=nv; S.tocadas[q]=true; render(); }
  else if (d.ninguno){ S.resp[d.ninguno]={}; S.tocadas[d.ninguno]=true; render(); }
  else if (d.multi){ const [campo,v] = d.multi.split('|'), l = S.det[campo], k = l.indexOf(v); if (k>=0) l.splice(k,1); else l.push(v); render(); }

  else if (d.rev==='ok'){ S.rev = Object.assign({}, REV_LIMPIA); S.versionOk=true; go('precio'); }
  else if (d.rev==='danios'){ S.rev = Object.assign({}, REV_LIMPIA, {chapa_pintura:{rayon_profundo:2}, cubiertas:{cambiar:2}}); S.versionOk=true; S.minimo=''; S.acuerdo=false; go('precio'); }
  else if (d.rev==='no'){ S.noCoincide=true; render(); }
  else if (d.fix){ S.vid = $('#v_fix').value; S.noCoincide=false; S.versionOk=true; if (!S.rev) S.rev = Object.assign({}, REV_LIMPIA); S.minimo=''; S.acuerdo=false; go('precio'); }
  else if (d.min){ S.minimo = KM(+d.min); render(); }
  else if (d.avanzar){ S.avance++; render(); }
  else if (d.dec){ S.decision = d.dec; if (d.dec==='si') S.avance = 3; render(); }
  else if (t.id==='btnReset'){ borrarAvance(); S = S0(); ultimaClave = ''; render(true); }
  else if (t.id==='btnPrueba'){ modoPrueba(true); $('#notas').hidden = true; aviso('Modo prueba: sin recuadros violetas. Para salir, tocá 5 veces "© 2026 Yacar" al pie.'); }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.id==='s_marca'){ S.marca=t.value; S.modelo=S.anio=S.vid=''; render(); }
  else if (t.id==='s_modelo'){ S.modelo=t.value; S.anio=S.vid=''; render(); }
  else if (t.id==='s_anio'){ S.anio=t.value; S.vid=''; const vs = versionesAnio(S.marca,S.modelo,S.anio); if (vs.length===1) S.vid=vs[0][0]; render(); }
  else if (t.id==='s_version'){ S.vid=t.value; render(); }
  else if (t.dataset.q){ S.resp[t.dataset.q]=t.value; render(); }
  else if (t.dataset.a){ S[t.dataset.a]=t.value; render(); }
  else if (t.dataset.det){ S.det[t.dataset.det]=t.value; if (t.dataset.det==='repintado' && t.value!=='si') S.det.repintadas=[]; render(); }
  else if (t.dataset.sv){ S.det[t.dataset.sv]=t.value; render(); }
  else if (t.id==='d_svns'){ S.det.svNoSe=t.checked; render(); }
  else if (t.id==='a_partido'){ S.partido=t.value; if (t.value!=='Ciudad de Buenos Aires') S.barrio=''; render(); }

  else if (t.type==='file' && t.files && t.files[0]){ const g=t.dataset.grupo, k=t.dataset.key, file=t.files[0]; t.value=''; procesarArchivo(g, k, file, false); }
  else if (t.id==='r_cel'){ const dg=S.cel.replace(/\D/g,''); $('#e_cel').textContent = S.cel && (dg.length<10||dg.length>13) ? 'Escribí el número con código de área (ej. 11 2345 6789).' : ''; }
  else if (t.id==='p_ok'){ S.acuerdo=t.checked; render(); }
  else if (t.id==='c_ter'){ S.terminos=t.checked; render(); }
  else if (t.id==='c_reg'){ S.aceptoReglas=t.checked; render(); }
  else if (t.id==='c_cons'){ S.consentTilde=t.checked; render(); }
});
document.addEventListener('keydown', ev => {
  if (ev.key==='Enter' && ev.target.id==='c_patente'){ const b=$('[data-pbuscar]'); if (b && !b.disabled) b.click(); }
  if (ev.key==='Enter' && ev.target.id==='r_cod'){ const b=$('#r_codgo'); if (b && !b.disabled) b.click(); }
  if (ev.key==='Enter' && ev.target.id==='a_cp'){ const b=$('[data-cpbuscar]'); if (b && !b.disabled) b.click(); }
  if (ev.target.id==='s_km' && ev.key==='Enter'){ const b=$('[data-go="rango1"]'); if (b && !b.disabled) b.click(); } });
document.addEventListener('input', ev => {
  const t = ev.target; guardarLuego();
  if (t.id==='s_km'){ const dgt = t.value.replace(/\D/g,'').slice(0,7); S.km = dgt ? KM(+dgt) : ''; t.value = S.km;
    const b = $('[data-go="rango1"]'); const km = kmNum(); if (b) b.disabled = !(S.vid && S.km!=='' && km<=600000);
    $('#e_km').textContent = km>600000 ? 'Revisá los kilómetros: tiene que ser un número entre 0 y 600.000.' : ''; }
  else if (t.id==='c_patente'){ const pos = t.selectionStart; S.patente = t.value.toUpperCase().replace(/[^A-Z0-9 .-]/g,'').slice(0,10); t.value = S.patente; t.setSelectionRange(pos,pos);
    $('#e_cpat').textContent = normPatente(S.patente).length>=6 && !patOk(S.patente) ? 'Revisá la patente: tiene que ser como ABC 123 o AB 123 CD.' : '';
    const b = $('[data-pbuscar]'); if (b) b.disabled = !patOk(S.patente); }
  else if (t.id==='a_cp'){ S.cpTexto = t.value.toUpperCase().slice(0,8); t.value = S.cpTexto; S.cp = (S.cpTexto.match(/\d{4}/)||[''])[0];
    if (S.cpEstado){ S.cpEstado=''; S.partido=''; S.localidad=''; S.cpError=false; render(); const n=$('#a_cp'); if (n){ n.focus(); n.setSelectionRange(n.value.length, n.value.length); } }   // cambió el CP: se vuelve a chequear
    const b = $('[data-cpbuscar]'); if (b) b.disabled = !S.cp;
    if (!S.cpLargo && !S.cpEstado && /^\d{4}$/.test(S.cpTexto)) qBuscarCP(); }   // 18/10 (menos pasos): con los 4 números se chequea solo, sin tocar "Chequear"
  else if (t.id==='a_barrio'){ S.barrio = t.value; }
  else if (t.id==='d_num'){ S.dniNum = t.value.replace(/\D/g,'').slice(0,8); t.value = S.dniNum;
    const b = $('#dni_go'); if (b) b.disabled = !identidadOk(); const f = $('#falta'); if (f){ const tx = identidadOk() ? '' : faltaIdentidad(); f.textContent = tx; f.hidden = !tx; }
    const e = $('#e_dni'); if (e && dniNumOk()) e.textContent = ''; }
  else if (t.id==='d_mec'){ S.det.mecTxt = t.value; updEstado(); }
  else if (t.id==='d_svkm'){ const dgt = t.value.replace(/\D/g,'').slice(0,7); S.det.svKm = dgt ? KM(+dgt) : ''; t.value = S.det.svKm; updEstado(); }
  else if (t.id==='z_cel'){ S.cel = t.value; S.avisoZona = false; const b = $('[data-avisozona]'); if (b) b.disabled = !celValido(S.cel); }
  else if (t.id==='r_cod'){ S.codigo = t.value.replace(/\D/g,'').slice(0,6); t.value = S.codigo; const b = $('#r_codgo'); if (b) b.disabled = !/^\d{6}$/.test(S.codigo);
    if (/^\d{6}$/.test(S.codigo)) setTimeout(()=>{ if (S.paso==='codigo' && /^\d{6}$/.test(S.codigo)) cuentaReal() ? verificarCodigo() : go('auto'); }, 400); }   // 18/10 (menos pasos): con los 6 números sigue solo
  else if (['r_nombre','r_cel','r_email'].includes(t.id)){ S[t.id.slice(2)] = t.value;
    const b = $('[data-go="codigo"]'), fa = $('#falta'), tx = faltaRegistro(); if (b) b.disabled = !registroOk();
    if (fa){ fa.textContent = tx; fa.hidden = !tx; } }
  else if (t.id==='p_min'){ const dgt = t.value.replace(/\D/g,'').slice(0,10); S.minimo = dgt ? KM(+dgt) : ''; t.value = S.minimo;
    clearTimeout(window._mt); window._mt = setTimeout(()=>{ const pos = t.selectionStart; render(); const n=$('#p_min'); if(n){ n.focus(); n.setSelectionRange(n.value.length,n.value.length);} }, 450); }
});
// Navegación del inicio con desplazamiento suave (v5.3) y preguntas frecuentes que se despliegan con animación.
const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function irSuave(destino){
  const y0 = window.scrollY, y1 = destino.getBoundingClientRect().top + window.scrollY - ($('header.site').offsetHeight + 12), dist = y1 - y0;
  if (sinMovimiento() || Math.abs(dist) < 4){ window.scrollTo(0, y1); return; }
  const dur = Math.min(1100, Math.max(500, Math.abs(dist)*0.5)), t0 = performance.now();
  const suave = t => t<.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
  (function paso(now){ const t = Math.min(1, (now-t0)/dur); window.scrollTo(0, y0 + dist*suave(t)); if (t<1) requestAnimationFrame(paso); })(t0);
}
function abrirFaq(det){
  const p = det.querySelector('p');
  det.open = true;
  if (sinMovimiento()) return;
  det.dataset.anim = '1';
  const an = p.animate([{height:'0px', opacity:0, paddingBottom:'0px'}, {height:p.scrollHeight+'px', opacity:1, paddingBottom:'18px'}], {duration:320, easing:'cubic-bezier(.2,.7,.2,1)'});
  an.onfinish = an.oncancel = () => { delete det.dataset.anim; };
}
function cerrarFaq(det){
  const p = det.querySelector('p');
  if (sinMovimiento()){ det.open = false; return; }
  det.dataset.anim = '1';
  const an = p.animate([{height:p.offsetHeight+'px', opacity:1, paddingBottom:'18px'}, {height:'0px', opacity:0, paddingBottom:'0px'}], {duration:260, easing:'ease-in'});
  an.onfinish = an.oncancel = () => { det.open = false; delete det.dataset.anim; };
}
function cerrarMenu(){ const h = $('header.site'); if (h) h.classList.remove('abierto'); const m = $('#menuBtn'); if (m){ m.setAttribute('aria-expanded','false'); m.setAttribute('aria-label','Abrir el menú'); } }
document.addEventListener('click', ev => {
  if (!ev.target.closest('header.site')) cerrarMenu();
  if (ev.target.closest('#nav a')) cerrarMenu();
  const a = ev.target.closest('#nav a[href^="#"]');
  if (a){ const d = document.querySelector(a.getAttribute('href')); if (d){ ev.preventDefault(); irSuave(d); } return; }
  const sum = ev.target.closest('details.faq > summary');
  if (!sum) return;
  ev.preventDefault();
  const det = sum.parentElement;
  if (det.dataset.anim) return;
  if (!det.open) document.querySelectorAll('details.faq[open]').forEach(o => { if (o!==det) cerrarFaq(o); });
  if (det.open) cerrarFaq(det); else abrirFaq(det);
});
// D11 (14/10): modo prueba para probar con gente: esconde el panel de notas y los recuadros violetas que no hacen falta para avanzar.
function modoPrueba(on){ try { if (on) localStorage.setItem('yacar.prueba','1'); else localStorage.removeItem('yacar.prueba'); } catch(e){} document.body.classList.toggle('prueba', !!on); }
(function iniciar(){
  let pr = false;
  try { if (/[#?&]prueba\b/.test(location.href)) localStorage.setItem('yacar.prueba','1'); if (/[#?&]sinprueba\b/.test(location.href)) localStorage.removeItem('yacar.prueba'); pr = localStorage.getItem('yacar.prueba')==='1'; } catch(e){}
  document.body.classList.toggle('prueba', pr);
  if (/#(sin)?prueba\b/.test(location.hash)) try { history.replaceState(null, '', location.pathname + location.search); } catch(e){}
  const habia = recuperar();
  render();
  if (habia && !EN_INICIO.includes(S.paso)) aviso('Seguís donde quedaste.');
  cargarFotosGuardadas();
  let toques = 0, tToques = 0;   // salir del modo prueba: 5 toques seguidos en "© 2026 Yacar"
  const pie = $('#pieMarca'); if (pie) pie.addEventListener('click', () => { toques++; clearTimeout(tToques); tToques = setTimeout(()=>toques=0, 1500); if (toques>=5){ toques = 0; const on = !document.body.classList.contains('prueba'); modoPrueba(on); aviso(on ? 'Modo prueba activado.' : 'Modo prueba desactivado.'); } });
  setInterval(()=>{ const b = $('#r_reenv'); if (!b) return; const s = segReenvio(); b.disabled = s>0; b.textContent = txtReenvio(); }, 1000);   // M6
})();

