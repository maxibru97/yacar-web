/* ---------- Cuenta real de agencias con Supabase (19/10/2026) ----------
   Solo en la web publicada (http/https). Abierta con doble clic o dentro de claude.ai sigue todo simulado.
   Proyecto Supabase "yacar" (sa-east-1). La clave de acá es la publicable: está hecha para ir en el navegador;
   lo que protege los datos son las reglas de acceso (RLS) de la base. Con ?demo=1 se fuerza el modo prototipo.
   Alta: los datos de la agencia viajan en el registro y la base crea la agencia "pendiente" (trigger crear_perfil).
   La subasta (autos, ofertas) sigue siendo de ejemplo: eso se conecta después. */
(function(){
const A=window.YacarAg; if(!A) return;
const {S,go,byId}=A;
const SB_URL="https://arvhblngphminssaupfu.supabase.co";
const SB_KEY="sb_publishable_RAJerx4YqVF8l50t17CLow_xBz6qKR6";
// Mails de Supabase: el servicio que trae de fábrica solo manda a los miembros del equipo. Hasta tener uno propio
// (Resend + dominio) en Supabase va "Confirm email" apagado y no se ofrece el link al mail. Con SMTP propio: true.
const MAILS=false;
const real=/^https?:$/.test(location.protocol)&&!/(^|\.)claude\.ai$|claudeusercontent\.com$/.test(location.hostname)&&!/[?&]demo=1/.test(location.search);
if(real){ byId("wrapAg")?.classList.add("real"); document.body.classList.add("cuenta-real"); }   // esconde los atajos "Solo prototipo" del alta y el ingreso (y del registro del vendedor)

let sb=null, listo=null, sesionMail="";
function cargar(){
 if(listo) return listo;
 listo=new Promise((ok,mal)=>{
  const s=document.createElement("script");
  s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
  s.onload=()=>{ sb=window.supabase.createClient(SB_URL,SB_KEY,{auth:{flowType:"pkce",detectSessionInUrl:true,persistSession:true}});
   // Avisa al lado vendedor cuando alguien entra (también si entró en otra pestaña con el link del mail).
   sb.auth.onAuthStateChange((ev,ses)=>{ if(ses?.user){ sesionMail=ses.user.email||""; setTimeout(()=>window.dispatchEvent(new CustomEvent("yacar:sesion"))); } });
   ok(sb); };
  s.onerror=()=>{ listo=null; mal(new Error("sin conexión")); };
  document.head.appendChild(s);
 });
 return listo;
}
const volverA=()=>location.origin+location.pathname+"#agencias/ingresar";

function msj(e){
 const m=String(e?.message||e||"");
 if(/Invalid login/i.test(m)) return "El mail o la contraseña no coinciden.";
 if(/not confirmed/i.test(m)) return "Todavía no confirmaste tu mail: buscá el mail de Yacar y tocá el link.";
 if(/already (been )?registered/i.test(m)) return "Ya hay una cuenta con ese mail. Probá ingresar.";
 if(/Database error saving new user/i.test(m)) return "Ya hay una agencia registrada con ese CUIT.";
 if(/rate limit|too many|security purposes/i.test(m)) return "Pediste muchos mails seguidos. Probá de nuevo en unos minutos.";
 if(/expired|invalid.*(otp|token)|token.*(expired|invalid)/i.test(m)) return "El código no es correcto o ya venció. Revisalo o pedí uno nuevo.";
 if(/Email address .*invalid|invalid.*email/i.test(m)) return "Revisá el mail: parece que tiene un error.";
 if(/Signups not allowed|not found/i.test(m)) return "No encontramos una agencia con ese mail. ¿Ya la sumaste a Yacar?";
 if(/sin conexión|Failed to fetch|NetworkError/i.test(m)) return "No pudimos conectarnos. Revisá tu conexión y probá de nuevo.";
 return "No pudimos completar el paso. Probá de nuevo.";
}

const prefs=()=>({tipos:[...S.tipos],marcas:[...S.marcas],anioD:S.anioD,anioH:S.anioH,kmMax:S.kmMax,pD:S.pD,pH:S.pH,waModo:S.waModo,recordatorio:S.recordatorio});
const datosAgencia=()=>({nombre:S.nombre,responsable:S.resp,celular:S.cel,cuit:S.cuit,razon_social:S.fiscal,habilitacion:S.habit,numero_habilitacion:S.numH,
 direccion:S.dir,link_maps:S.maps,web:S.web,anios:S.anios,barrio_base:S.base,radio_km:S.radio,zonas:[...S.zonas],preferencias:prefs(),terminos:!!(S.acepT&&S.acepC)});

// De la fila de la base a lo que usa la web (S).
function aS(ag,email){
 if(!ag){ S.estado="sin"; S.email=email||S.email; return; }
 const p=ag.preferencias||{};
 Object.assign(S,{nombre:ag.nombre||"",resp:ag.responsable||"",email:ag.email||email||"",cel:ag.celular||"",cuit:ag.cuit||"",cuitVerif:"nuevo",
  fiscal:ag.razon_social||"",habit:ag.habilitacion||"",numH:ag.numero_habilitacion||"",dir:ag.direccion||"",maps:ag.link_maps||"",web:ag.web||"",
  anios:ag.anios_en_el_rubro?String(ag.anios_en_el_rubro):"",base:ag.barrio_base||S.base,radio:ag.radio_km||20,zonas:new Set(ag.zonas||[]),
  acepT:!!ag.terminos_aceptados_en,acepC:!!ag.terminos_aceptados_en,estado:ag.estado==="aprobada"?"ok":"rev"});
 if(p.tipos){ S.tipos=new Set(p.tipos); S.prefsOk=true; }
 if(p.marcas) S.marcas=new Set(p.marcas);
 ["anioD","anioH","kmMax","pD","pH","waModo","recordatorio"].forEach(k=>{ if(p[k]!==undefined) S[k]=p[k]; });
}
async function traerAgencia(user){
 const {data,error}=await sb.from("agencias").select("*").eq("usuario_id",user.id).maybeSingle();
 if(error) throw error;
 aS(data,user.email); S.sesion=true;
}

async function ingresar(email,pass){
 await cargar();
 const {data,error}=await sb.auth.signInWithPassword({email,password:pass});
 if(error) throw error;
 await traerAgencia(data.user);
}
async function link(email){
 await cargar();
 const {error}=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:volverA()}});
 if(error) throw error;
}
async function alta(){
 await cargar();
 const {data,error}=await sb.auth.signUp({email:S.email.trim(),password:S.pass,
  options:{emailRedirectTo:volverA(),data:{rol:"agencia",nombre:S.resp,celular:S.cel,agencia:datosAgencia()}}});
 if(error) throw error;
 // Supabase no avisa si el mail ya existía (para no revelarlo): llega un usuario sin identidades.
 if(data.user&&Array.isArray(data.user.identities)&&!data.user.identities.length) throw new Error("already registered");
 if(data.session) await traerAgencia(data.user);
 return {confirmar:!data.session};
}
async function guardar(){
 if(!sb) return;
 const {data:{user}}=await sb.auth.getUser(); if(!user) return;
 const {error}=await sb.from("agencias").update({nombre:S.nombre,responsable:S.resp,celular:S.cel,razon_social:S.fiscal,habilitacion:S.habit,
  numero_habilitacion:S.numH,direccion:S.dir,link_maps:S.maps,web:S.web,anios_en_el_rubro:+String(S.anios).replace(/\D/g,"")||null,
  barrio_base:S.base,radio_km:S.radio,zonas:[...S.zonas],preferencias:prefs()}).eq("usuario_id",user.id);
 if(error) console.warn("No se guardó el perfil",error);
}
// Vendedores (19/10): entran con un código de 6 números que les llega al mail; la primera vez crea la cuenta (perfil "vendedor").
// La plantilla "Magic Link" de Supabase tiene que mostrar {{ .Token }} para que llegue el código; para editarla Supabase pide
// SMTP propio. Hasta entonces (MAILS=false) llega el link: vuelve a la web con ?code= y la sesión avisa con "yacar:sesion".
async function codigoVendedor(email,{nombre,celular}){
 await cargar();
 const {error}=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:true,emailRedirectTo:location.origin+location.pathname,data:{rol:"vendedor",nombre,celular}}});
 if(error) throw error;
}
async function verificarVendedor(email,token){
 await cargar();
 const {data,error}=await sb.auth.verifyOtp({email,token,type:"email"});
 if(error) throw error;
 sesionMail=data.user?.email||email;
}
const vendedorEs=email=>!!sesionMail&&sesionMail.toLowerCase()===String(email||"").trim().toLowerCase();
async function salir(){ if(sb) await sb.auth.signOut(); }

// Al abrir la web, o al volver del link del mail (?code=...), recupera la sesión.
async function iniciar(){
 const vieneDelMail=/[?&]code=/.test(location.search);
 const guardada=Object.keys(localStorage).some(k=>/^sb-.*-auth-token/.test(k));
 if(!vieneDelMail&&!guardada) return;   // nadie entró antes en este navegador: no cargamos nada
 await cargar();
 const {data:{session}}=await sb.auth.getSession();
 if(vieneDelMail) history.replaceState(null,"",location.pathname+location.hash);
 if(!session) return;
 sesionMail=session.user.email||"";
 if(!/^#agencias/.test(location.hash)) return;   // lado vendedor: alcanza con saber quién entró (avisa onAuthStateChange)
 await traerAgencia(session.user);
 if(vieneDelMail||/^#agencias/.test(location.hash)) go(A.aprobada()?"subasta":"estado");
}

window.YacarCuenta={real,mails:MAILS,codigoVendedor,verificarVendedor,vendedorEs,ingresar,link,alta,guardar,salir,msj};
if(real){
 if(location.hash.startsWith("#agencias")) A.route();   // la primera pantalla se dibujó antes de que existiera YacarCuenta
 iniciar().catch(e=>console.warn("Sesión no recuperada",e));
}
})();
