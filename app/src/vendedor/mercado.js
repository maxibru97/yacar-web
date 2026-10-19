// Precio de mercado en el momento (PRE-13, D-49, 17/10/2026). La consulta a las páginas de avisos la hace nuestro
// servidor (app/servidor.py; en la web real, TEC-10): el navegador del vendedor no puede pedirlas. La búsqueda arranca
// apenas se confirma marca, modelo, año y versión, y mientras el vendedor carga los km ya está lista o casi.
// Sin servidor (por ejemplo, el artifact publicado), todo sigue como antes, con el precio de referencia del catálogo.
// Nunca se nombran las fuentes al vendedor.
const MKT = {activo: false, busq: {}, precios: {}, LIMITE_MS: 60000};
(async () => {
  if (!/^https?:$/.test(location.protocol)) return;
  try { const r = await fetch('/api/estado', {cache: 'no-store'}); MKT.activo = r.ok && (await r.json()).ok === true; } catch (e) {}
  if (MKT.activo && typeof S !== 'undefined' && S.vid && S.anio) mktIniciar(S.vid, +S.anio);
})();
const mktClave = (vid, anio, km) => `${vid}|${anio}` + (km == null ? '' : `|${km}`);
function mktIniciar(vid, anio){
  if (!MKT.activo || !vid || !anio || MKT.busq[mktClave(vid, anio)]) return;
  MKT.busq[mktClave(vid, anio)] = Date.now();
  fetch(`/api/mercado/iniciar?version=${encodeURIComponent(vid)}&anio=${anio}`, {cache: 'no-store'}).catch(() => {});
}
async function mktPedir(vid, anio, km){
  const k = mktClave(vid, anio, km);
  if (MKT.precios[k]) return MKT.precios[k];
  try {
    const r = await (await fetch(`/api/mercado/precio?version=${encodeURIComponent(vid)}&anio=${anio}&km=${km}`, {cache: 'no-store'})).json();
    if (r.estado === 'listo' || r.estado === 'error') MKT.precios[k] = r;
    return r;
  } catch (e) { return {estado: 'error'}; }
}
// El precio de mercado (lo que piden, a esos km) si ya está; si no, null y el motor usa el de referencia.
function mktPrecio(vid, anio, km){
  const r = MKT.precios[mktClave(vid, anio, km)];
  return r && r.estado === 'listo' && r.precio_ars ? r.precio_ars : null;
}
// En la pantalla de "Calculando tu precio": espera hasta que esté (o hasta 60 s; después sigue con el de referencia).
function mktEsperar(vid, anio, km, alTerminar){
  if (!MKT.activo || !vid || !(km >= 0)) return alTerminar();
  const t0 = Date.now();
  const paso = async () => {
    const r = await mktPedir(vid, anio, km);
    if (r.estado === 'buscando' && Date.now() - t0 < MKT.LIMITE_MS) { if (!S.mktEsperando){ S.mktEsperando = true; render(); } setTimeout(paso, 1500); }
    else { S.mktEsperando = false; alTerminar(); }
  };
  paso();
}
