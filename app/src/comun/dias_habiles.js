/* ===================== Días hábiles y dólar MEP (16/10/2026, TEC-11, D-47, D-48) =====================
 Lo usan los dos lados. Misma lógica que motor-de-precios/referencias/calendario.py y dolar.py.
 Los datos los arma motor-de-precios/referencias/actualizar.py (feriados de la API de ArgentinaDatos + locales de AMBA
 cargados a mano; dólar MEP "bolsa", venta). En la web real los trae nuestro servidor todos los días.
  - Día hábil: lunes a viernes que no sea feriado ni puente. Por defecto, AMBA: cuentan los feriados locales de CABA y PBA.
  - Plazo de visita de la agencia: 48 h sin contar domingos ni feriados (el sábado cuenta).
  - Dólar MEP del día hábil anterior; si falta, la última cotización anterior, con aviso.
*/
const FERIADOS = /*@json:feriados.json*/null;
const MEP_DATOS = /*@json:mep.json*/null;
const isoDia = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const desdeIso = s => { const [a,m,d] = s.split('-').map(Number); return new Date(a, m-1, d); };
const FERIADO_DE = (() => { const m = {}; for (const [f, alc, nom] of FERIADOS.feriados) (m[f] = m[f] || []).push({alc, nom}); return m; })();
function feriadoDe(d, jur = null){ return (FERIADO_DE[isoDia(d)] || []).find(x => x.alc === 'nacional' || (jur ? x.alc === jur : true)) || null; }
function esHabil(d, jur = null){ const w = d.getDay(); return w !== 0 && w !== 6 && !feriadoDe(d, jur); }
function diaHabilAnterior(d, jur = null){ const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()-1); while (!esHabil(x, jur)) x.setDate(x.getDate()-1); return x; }
function sumarHabiles(desde, n, jur = null){
  const d = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  while (!esHabil(d, jur)) d.setDate(d.getDate()+1);
  for (let k = 0; k < n; ){ d.setDate(d.getDate()+1); if (esHabil(d, jur)) k++; }
  return d;
}
function vencePlazoVisita(desde, horas = 48, jur = null){   // D-47: 48 h hábiles (sin domingos ni feriados)
  let t = new Date(desde), resto = horas*36e5;
  for (;;){
    const fin = new Date(t.getFullYear(), t.getMonth(), t.getDate()+1);
    if (t.getDay() !== 0 && !feriadoDe(t, jur)){ if (t.getTime()+resto <= fin.getTime()) return new Date(t.getTime()+resto); resto -= fin - t; }
    t = fin;
  }
}
function mepPara(fecha){   // D-48: {fecha, valor, fechaFoto, valorFoto, indice, aviso}
  const f = MEP_DATOS.foto, ff = desdeIso(f.fecha_mep), base = {fechaFoto: ff, valorFoto: f.mep};
  const dia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  if (dia <= desdeIso(f.fecha_foto)) return {...base, fecha: ff, valor: f.mep, indice: 1, aviso: ''};
  const buscado = diaHabilAnterior(dia), clave = isoDia(buscado);
  if (clave in MEP_DATOS.serie) return {...base, fecha: buscado, valor: MEP_DATOS.serie[clave], indice: MEP_DATOS.serie[clave]/f.mep, aviso: ''};
  const previa = Object.keys(MEP_DATOS.serie).filter(k => k < isoDia(dia)).sort().pop();
  const v = MEP_DATOS.serie[previa], fp = desdeIso(previa), dm = x => x.toLocaleDateString('es-AR', {day:'2-digit', month:'2-digit'});
  return {...base, fecha: fp, valor: v, indice: v/f.mep, aviso: `Falta el dólar MEP del ${dm(buscado)}: se usó el del ${dm(fp)}.`};
}
