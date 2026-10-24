/* v2 (24/10/2026): medición del embudo y barra fija "Cotizá gratis" en el celular. Va al final, después del resto del código. */

/* ---------- medición (PostHog, plan gratis) ----------
   Los eventos no llevan patente, nombre, teléfono ni ningún dato personal: solo el paso y de dónde vino la visita.
   Para prenderlo: pegar la "Project API key" de PostHog (empieza con phc_) y, si el proyecto es de Europa, cambiar el host.
   Sin clave, los eventos quedan en window.yacarEventos (sirve para probar desde la consola). */
const POSTHOG_KEY = '';
const POSTHOG_HOST = 'https://us.i.posthog.com';   // Europa: 'https://eu.i.posthog.com'
// ?o=wa en el link que se manda por WhatsApp, ?o=ig en Instagram, etc. Sin marca: el sitio de donde vino, o "directo".
const CANAL = (() => {
  const o = new URLSearchParams(location.search).get('o');
  if (o) return o.slice(0, 20);
  try { return document.referrer ? new URL(document.referrer).hostname : 'directo'; } catch (e) { return 'directo'; }
})();
if (POSTHOG_KEY){
  // Snippet oficial de PostHog: deja un "posthog" que guarda los eventos hasta que baja la librería.
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group identify setPersonProperties".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  posthog.init(POSTHOG_KEY, {api_host:POSTHOG_HOST, person_profiles:'identified_only', autocapture:false, capture_pageview:false, disable_session_recording:true, mask_all_text:true});
}
window.yacarEventos = [];
const yaMedido = new Set();
let barraPend = false;   // barra fija (abajo)
function medir(evento, props, unaVez){
  if (unaVez){ if (yaMedido.has(evento)) return; yaMedido.add(evento); }
  const p = Object.assign({canal:CANAL, version:'v2', celular:matchMedia('(max-width:860px)').matches}, props);
  window.yacarEventos.push([evento, p]);
  if (window.posthog && posthog.capture) posthog.capture(evento, p);
}
const lado = () => location.hash.startsWith('#agencias') ? 'agencias' : 'vendedor';
medir('abrio', {lado:lado()}, true);
if (lado()==='vendedor') medir('paso_' + S.paso, null, true);   // la primera pantalla ya se pintó antes de este código

// Vendedor: cada pantalla del flujo una vez por visita (paso_datos = vio el cotizador, paso_rango1 = vio el primer precio,
// paso_registro = tocó "Quiero vender mi auto", paso_codigo = dejó nombre y celular, paso_enviado = terminó la carga).
render = (orig => function(){
  const r = orig.apply(this, arguments);
  if (lado()==='vendedor') medir('paso_' + S.paso, null, true);
  barra();
  return r;
})(render);
buscarPat = (orig => function(){
  if (patOk(S.patente)) medir('busco_patente', null, true);
  return orig.apply(this, arguments);
})(buscarPat);
// Agencias: cada pantalla una vez por visita (agencias_inicio, agencias_alta, agencias_estado, agencias_subasta...).
function medirRuta(){
  const h = location.hash.replace(/^#/, '').split('/');
  if (h[0]==='agencias') medir('agencias_' + (h[1] || 'inicio'), null, true);
  barra();
}
addEventListener('hashchange', medirRuta);
medirRuta();
// Botones de WhatsApp y mail (también los de adentro de la página de agencias)
document.addEventListener('click', ev => {
  const el = ev.composedPath().find(n => n.dataset && n.dataset.medir);
  if (el) medir(el.dataset.medir, {lado:lado()});
}, true);

/* ---------- barra fija "Cotizá gratis" (solo celular, como la de agencias) ----------
   Aparece cuando pasaste el hero y se va cuando se ve el cotizador de abajo o empezás la carga. */
function barra(){
  if (barraPend) return; barraPend = true;
  requestAnimationFrame(() => {
    barraPend = false;
    const inicio = document.getElementById('inicio'), hero = document.getElementById('cotizar'), fin = document.getElementById('cotizar-fin');
    let ver = false;
    if (inicio && !inicio.hidden && inicio.offsetParent!==null && lado()==='vendedor' && hero && fin){
      const vh = innerHeight;
      ver = hero.getBoundingClientRect().bottom < 0 && fin.getBoundingClientRect().top > vh - 40;
    }
    document.body.classList.toggle('con-barra', ver);
    const b = document.getElementById('barCta');
    if (b){ b.setAttribute('aria-hidden', String(!ver)); document.getElementById('barCtaBtn').tabIndex = ver ? 0 : -1; }
  });
}
addEventListener('scroll', barra, {passive:true});
addEventListener('resize', barra);
document.getElementById('barCtaBtn').addEventListener('click', () => {
  medir('barra_cotizar');
  window.scrollTo({top:0, behavior:'smooth'});
  const enfocar = () => { const i = document.getElementById('c_patente'); if (i) i.focus({preventScroll:true}); };
  if ('onscrollend' in window) addEventListener('scrollend', enfocar, {once:true}); else setTimeout(enfocar, 600);
});
barra();
