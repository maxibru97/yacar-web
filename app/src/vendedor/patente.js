// "Patente primero" (decidido el 12/10/2026, ver documentacion/PREGUNTAS_VENDEDOR_VS_FUENTES.md).
// Dos partes:
//   1. buscarPatente(patente): trae marca, modelo y año de la fuente. En el prototipo es SIMULADA (no llama a ninguna API).
//   2. emparejarPatente(dato, CAT): lleva lo que devolvió la fuente a nuestro catálogo (datos/catalogo.json).

// ------------------------------------------------------------ 1. búsqueda (simulada)
// Misma forma que la respuesta de clasific.ar (GET /v2/vehicles/:plate, prueba del 12/10 en
// documentacion/patentes_multas/PRUEBA_PATENTE_AR.md): make, model, year, firstRegistered.
// En esa respuesta la versión viene pegada al modelo ("FOCUS 5P 2.0L N AT SE"); si otra fuente la trae aparte,
// puede venir en "version" y emparejarPatente la usa igual.
//
// Para la web real se reemplaza SOLO el cuerpo de buscarPatente por una llamada a NUESTRO servidor:
//     const r = await fetch('/api/patente/' + p);          // el servidor llama al proveedor con la llave guardada allá
//     if (r.status === 404) return {encontrada:false};
//     if (!r.ok) throw new Error('fuente');
//     return {encontrada:true, auto: await r.json()};
// La llave del proveedor nunca va en la web. Las patentes de abajo son inventadas.
const PATENTES_EJEMPLO = {
  AE123FO: {make:'FORD', model:'FOCUS 5P 2.0L N AT SE', year:2019, firstRegistered:'2019-06-28'},             // una versión, coincide
  AC456HL: {make:'TOYOTA', model:'HILUX 4X4 D/C SRX 2.8 TDI', year:2020, firstRegistered:'2020-03-11'},        // dos parecidas (automática o manual)
  KJR482:  {make:'VOLKSWAGEN', model:'GOL TREND 1.6 MSI', year:2015, firstRegistered:'2015-09-02'},           // formato viejo; versión que no está en el catálogo
  AF482KD: {make:'FIAT', model:'CRONOS 4P 1.3 GSE DRIVE MT', year:2022, firstRegistered:'2022-05-04'},        // la del auto de ejemplo
  AD222RS: {make:'RENAULT', model:'SANDERO 1.6 16V ZEN', year:2021, firstRegistered:'2021-01-19'},           // en el catálogo se llama distinto (ZEN PH2)
  AF999ZZ: 'falla'                                                                                            // la fuente no responde
};                                                                                                            // cualquier otra: no encontrada
const normPatente = p => String(p||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const fmtPatente = p => { const n = normPatente(p); return /^[A-Z]{3}\d{3}$/.test(n) ? n.slice(0,3)+' '+n.slice(3) : /^[A-Z]{2}\d{3}[A-Z]{2}$/.test(n) ? n.slice(0,2)+' '+n.slice(2,5)+' '+n.slice(5) : n; };
function buscarPatente(patente){
  const p = normPatente(patente);
  return new Promise((ok, mal) => setTimeout(() => {
    const d = PATENTES_EJEMPLO[p];
    if (d === 'falla') mal(new Error('La fuente no respondió'));
    else ok(d ? {encontrada:true, auto:Object.assign({plate:p}, d)} : {encontrada:false});
  }, 900));
}

// ------------------------------------------------------------ 2. emparejar con el catálogo
// Devuelve {marca, modelo, anio, versiones:[ids], nivel}:
//   nivel 'version' → hay 1 a 3 versiones del catálogo que coinciden (si es 1, se confirma; si son más, el vendedor elige)
//   nivel 'anio'    → marca, modelo y año están en el catálogo, pero ninguna versión se parece lo suficiente
//   nivel 'modelo' / 'marca' → solo llegamos hasta ahí (por ejemplo, ese año no está)
//   nivel 'nada'    → la marca no está en el catálogo
// Con lo que se encontró se precarga el camino manual: el vendedor nunca vuelve a elegir lo que ya sabemos.
const MARCAS_ALIAS = {VW:'VOLKSWAGEN', 'MERCEDES BENZ':'MERCEDES-BENZ', MERCEDES:'MERCEDES-BENZ', 'GENERAL MOTORS':'CHEVROLET', GM:'CHEVROLET', 'CITROËN':'CITROEN', DS:'DS AUTOMOBILES'};
const sinTildes = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'');
const limpiar = s => sinTildes(s).toUpperCase().replace(/(\d),(\d)/g,'$1.$2').replace(/\s+/g,' ').trim();
const compacto = s => limpiar(s).replace(/[^A-Z0-9]/g,'');
// Palabras de una versión, en una forma común para las dos fuentes.
function tokensVersion(s){
  let t = ' ' + limpiar(s).replace(/\s(19|20)\d\d$/,'') + ' ';
  t = t.replace(/\b([AM])\s*\/\s*T\b/g, '$1T')                  // A/T, M/T
       .replace(/(^|\s)(\d)\s+(AT|MT)\b/g, '$1$2$3')            // "6 AT" → 6AT (no toca "1.3 MT")
       .replace(/\b(\d\.\d)\s*(L|N|T|TSI|TDI|JTD)?\b/g, (m, cc, suf) => ' ' + cc + (suf && suf!=='L' ? ' ' + suf : '') + ' ')   // 2.0L, 1.4N
       .replace(/\b(\d)\s*P(TAS|UERTAS)?\b/g, '$1P')            // 5 PTAS → 5P
       .replace(/\bD\s*\/\s*C\b|\bDOBLE CABINA\b|\bDC\b/g, 'D/C').replace(/\bC\s*\/\s*S\b|\bCABINA SIMPLE\b|\bCS\b/g, 'C/S').replace(/\bC\s*\/\s*C\b/g, 'C/C')
       .replace(/\b4\s*X\s*4\b/g, '4X4').replace(/\b4\s*X\s*2\b/g, '4X2');
  const out = [];
  for (let w of t.split(/[\s\-]+/)){
    if (!w) continue;
    if (/^\d?AT$|^AUT(O|OMATICO|OMATICA)?$|^TIPT\d?$|^TIPTRONIC$|^\d?TIPT$/.test(w)) w = 'AT';
    else if (/^\d?MT$|^MAN(UAL)?$/.test(w)) w = 'MT';
    else if (w === 'TDI' || w === 'TD') w = 'TDI';
    if (['N','L','NAFTA','PICK-UP','PICKUP','PU','SEDAN','HB','HATCHBACK','CV'].includes(w)) continue;   // no distinguen versiones dentro de un modelo
    if (!out.includes(w)) out.push(w);
  }
  return out;
}
const CAJA_AUTO = ['AT','CVT','DSG','DCT'];
const cajaDe = ts => ts.some(w => CAJA_AUTO.includes(w)) ? 'auto' : ts.includes('MT') ? 'manual' : null;
const motorDe = ts => ts.find(w => /^\d\.\d$/.test(w)) || null;
const puertasDe = ts => ts.find(w => /^\dP$/.test(w)) || null;
const cabinaDe = ts => ts.find(w => ['D/C','C/S','C/C'].includes(w)) || null;
const tracDe = ts => ts.find(w => ['4X4','4X2'].includes(w)) || null;
// Parecido entre la versión de la fuente y una del catálogo (0 a 1). Lo que choca (motor, caja, puertas, cabina, tracción) descarta.
function parecido(src, cat){
  const cc = cajaDe(cat) || 'manual';                                          // en la lista CCA, sin caja = manual
  if (cajaDe(src) && cajaDe(src) !== cc) return 0;
  for (const f of [motorDe, puertasDe, cabinaDe, tracDe]){ const a = f(src), b = f(cat); if (a && b && a !== b) return 0; }
  const ignora = w => ['AT','MT','CVT'].includes(w);                          // la caja ya se comparó arriba
  const s = src.filter(w => !ignora(w)), c = cat.filter(w => !ignora(w));
  const igual = (a, b) => a === b || (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a)));   // HIGH = HIGHLINE, COMF = COMFORTLINE
  const comunes = c.filter(w => s.some(x => igual(w, x))).length;
  if (!c.length) return 0;
  return 0.65*(comunes/c.length) + 0.35*(s.length ? Math.min(1, comunes/s.length) : 0);
}
function emparejarPatente(dato, CAT){
  const r = {marca:'', modelo:'', anio:'', versiones:[], nivel:'nada'};
  if (!dato) return r;
  const mk = limpiar(dato.make), mkA = MARCAS_ALIAS[mk] || mk;
  const marca = CAT.find(m => compacto(m[0]) === compacto(mkA)) || CAT.find(m => compacto(m[0]).startsWith(compacto(mkA)) || compacto(mkA).startsWith(compacto(m[0])));
  if (!marca) return r;
  r.marca = marca[0]; r.nivel = 'marca';
  // Modelo: el nombre del catálogo más largo con el que empieza el modelo de la fuente ("GOL TREND 5P..." → GOL TREND, no GOL).
  const mo = limpiar(dato.model), moC = compacto(mo);
  // Primero por palabras enteras; si ninguno coincide, sin espacios ni signos ("GOLTREND").
  const largo = l => l.sort((a,b) => limpiar(b[0]).length - limpiar(a[0]).length)[0];
  let modelo = largo(marca[1].filter(x => { const n = limpiar(x[0]); return mo === n || mo.startsWith(n + ' '); })), resto = '';
  if (modelo) resto = mo.slice(limpiar(modelo[0]).length);
  else modelo = largo(marca[1].filter(x => compacto(x[0]).length >= 3 && moC.startsWith(compacto(x[0]))));
  if (!modelo) return r;
  r.modelo = modelo[0]; r.nivel = 'modelo';
  const anio = String(dato.year || '');
  if (!modelo[1].some(v => v[2][anio])) return r;
  r.anio = anio; r.nivel = 'anio';
  const src = tokensVersion(dato.version || resto);
  if (!src.length) return r;
  // Puntaje de cada versión del catálogo con precio para ese año. Las que se llaman igual (cambia solo el año del nombre) cuentan una vez.
  const vistas = {}, puntos = [];
  for (const v of modelo[1]){
    if (!v[2][anio]) continue;
    const nombre = v[1].replace(/\s(19|20)\d\d$/,'') + (v[3] && v[3][anio] ? '|' + v[3][anio] : ''), sufijo = (v[1].match(/\s((19|20)\d\d)$/)||[])[1];   // 17/10: dos generaciones con el mismo nombre cuentan aparte
    const p = parecido(src, tokensVersion(v[1]));
    if (vistas[nombre]){ const o = vistas[nombre]; if (sufijo && sufijo <= anio && (!o.sufijo || o.sufijo > anio || sufijo > o.sufijo)) Object.assign(o, {id:v[0], sufijo}); continue; }
    vistas[nombre] = {id:v[0], sufijo, p}; puntos.push(vistas[nombre]);
  }
  puntos.sort((a,b) => b.p - a.p);
  const mejor = puntos[0];
  if (!mejor || mejor.p < 0.55) return r;
  r.versiones = puntos.filter(x => x.p >= mejor.p - 0.08).slice(0, 3).map(x => x.id);
  r.nivel = 'version';
  return r;
}
if (typeof module !== 'undefined') module.exports = {buscarPatente, emparejarPatente, tokensVersion, normPatente, fmtPatente, PATENTES_EJEMPLO};
