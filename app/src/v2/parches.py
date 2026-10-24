# Cambios de la v2 (24/10/2026) sobre el HTML que arma build.py con src/. Cada parche es (dónde, texto viejo, texto nuevo)
# y el texto viejo tiene que aparecer una sola vez en el HTML armado. Lo nuevo de la v2 está en src/v2/ (v2.css, v2.js,
# agencias_v2.css, quienes.html). Los cambios salen de la revisión de la web (22/10): https://claude.ai/artifact/A2iSnnJbyGSmQyq1v8YgiN
WA = 'https://wa.me/5493735627475'
WA_VEND = WA + '?text=Hola%20Maxi%2C%20tengo%20una%20consulta%20sobre%20Yacar'
WA_AG = WA + '?text=Hola%20Maxi%2C%20tengo%20una%20agencia%20y%20quiero%20saber%20m%C3%A1s%20de%20Yacar'
ICO_WA = ('<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2a9.7 9.7 0 0 0-8.3 14.8L2.4 21.6l4.8-1.3A9.7 9.7 0 1 0 12 2.2zm0 17.7a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8 8 0 1 1 12 19.9zm4.4-6c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.8.9c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1z"/></svg>')

F_CUESTA = '<details class="faq"><summary>¿Cuánto cuesta?</summary><p>Cotizar y publicar tu auto es gratis.</p></details>\n'
F_BAJAR = '<details class="faq"><summary>¿Me pueden bajar el precio cuando ven el auto?</summary><p>Si el auto está como lo describiste, no. Solo por algo que no declaraste la agencia puede proponer un ajuste, con fotos. Lo revisamos nosotros y vos podés decir que no.</p></details>\n'
F_COBRO = '<details class="faq"><summary>¿Cómo cobro?</summary><p>Te paga la agencia el día que le entregás el auto.</p></details>\n'

# Logo nuevo (24/10, Maxi): el auto-yacaré. Vectorizado de la imagen que mandó Maxi (verde lima #B8E04A y verde Yacar #123F2C).
YACARE = 'M75.7 51.3 L72.9 52.4 L70.6 54.7 L69.5 57.6 L69.5 60.7 L70.6 63.1 L73.0 65.3 L75.8 66.3 L78.3 66.3 L80.9 65.2 L83.0 63.2 L84.2 60.6 L84.3 57.5 L83.3 54.8 L81.0 52.4 L78.6 51.4Z M76.6 55.6 L77.7 55.7 L78.9 56.3 L79.6 57.1 L80.1 58.6 L79.6 60.5 L78.4 61.6 L77.1 62.0 L76.0 61.9 L74.9 61.3 L73.7 59.4 L73.7 58.1 L74.2 57.0 L75.5 55.9Z M21.2 51.2 L17.9 52.3 L16.0 53.9 L14.4 56.8 L14.2 59.4 L14.7 61.6 L16.6 64.4 L19.9 66.2 L22.7 66.4 L25.8 65.3 L27.5 63.9 L29.0 61.0 L29.2 57.8 L28.3 55.0 L26.4 52.8 L23.8 51.5Z M21.2 55.6 L22.6 55.6 L23.5 56.0 L24.5 57.0 L25.0 58.2 L25.0 59.4 L24.4 60.7 L23.5 61.6 L22.4 62.0 L20.0 61.5 L18.9 60.3 L18.6 59.2 L19.2 56.9 L20.1 56.0Z M86.9 42.6 L86.8 43.2 L87.2 43.8 L88.4 44.5 L89.4 44.3 L89.4 43.4 L88.7 42.5 L87.6 42.2Z M50.2 38.5 L50.7 39.5 L51.3 39.5 L53.6 38.2 L54.4 38.2 L56.3 39.2 L56.9 39.2 L57.4 38.7 L57.4 38.0 L55.9 35.9 L54.7 35.4 L53.2 35.4 L51.9 36.0 L50.9 37.0Z M6.3 39.6 L6.8 43.9 L5.2 52.4 L5.3 55.9 L6.3 58.3 L7.8 59.9 L11.5 61.7 L12.2 61.4 L12.0 58.1 L12.3 56.4 L14.0 52.9 L16.9 50.3 L19.1 49.3 L21.2 48.9 L23.1 49.0 L25.2 49.6 L26.9 50.5 L28.9 52.3 L30.9 55.6 L31.4 57.6 L31.4 61.3 L32.3 62.0 L66.9 62.0 L67.6 61.0 L67.3 59.5 L67.5 56.6 L68.0 54.9 L69.2 52.8 L71.9 50.4 L74.2 49.4 L76.0 49.1 L78.0 49.1 L80.2 49.6 L82.8 51.0 L84.4 52.5 L86.1 56.0 L86.6 58.5 L86.5 61.4 L86.9 61.8 L93.1 61.9 L94.3 61.4 L95.0 60.3 L94.9 59.1 L93.6 57.1 L93.6 52.6 L93.2 51.6 L92.1 50.8 L85.7 48.0 L81.0 46.7 L76.3 46.2 L69.0 46.2 L59.8 46.8 L51.1 46.5 L46.9 45.3 L43.8 43.4 L42.3 41.6 L43.0 39.6 L42.6 38.8 L40.7 38.7 L37.8 40.6 L36.1 38.3 L35.8 36.3 L36.9 35.3 L47.3 34.4 L52.4 32.9 L55.3 32.8 L57.5 33.8 L62.1 39.0 L63.6 39.8 L81.4 43.6 L83.4 43.6 L86.7 41.4 L88.3 41.4 L90.3 43.0 L91.3 46.7 L92.2 48.7 L92.7 49.2 L93.5 48.9 L93.7 45.2 L93.4 43.0 L92.3 40.6 L90.6 39.0 L89.1 38.3 L87.1 38.0 L85.4 38.4 L82.6 40.1 L81.2 40.2 L65.6 37.0 L64.5 36.5 L59.4 31.1 L56.2 29.4 L54.3 29.2 L49.1 30.2 L39.2 31.1 L33.7 29.1 L32.7 29.1 L31.9 29.6 L30.9 31.9 L30.2 32.5 L26.2 31.5 L25.0 31.5 L24.3 31.9 L23.3 34.2 L22.8 34.6 L19.9 34.1 L17.7 34.2 L17.1 34.8 L16.5 36.9 L15.1 38.1 L7.0 39.1Z'
LOGO_V2 = f'<svg width="30" height="29" viewBox="0 0 100 95.6" aria-hidden="true" style="flex:none"><rect width="100" height="95.6" rx="22" fill="#B8E04A"/><path fill="#123F2C" fill-rule="evenodd" d="{YACARE}"/></svg>'
FAVICON = ('data:image/svg+xml,' + LOGO_V2.replace(' aria-hidden="true" style="flex:none"', ' xmlns="http://www.w3.org/2000/svg"')
           .replace('"', "'").replace('#', '%23').replace('<', '%3C').replace('>', '%3E'))
LOGO_V1 = '<svg width="30" height="30" viewBox="0 0 30 30" aria-hidden="true"><rect width="30" height="30" rx="8" fill="#B8E04A"/><path d="M4.5 20.5c2.3-1.5 4.6-1.5 6.9 0s4.6 1.5 6.9 0 4.6-1.5 6.9 0" stroke="#123F2C" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M7.3 18.4a3.8 3.8 0 0 1 7.6 0zM15.1 18.4a3.8 3.8 0 0 1 7.6 0z" fill="#123F2C"/><circle cx="11.5" cy="16.5" r="1.05" fill="#B8E04A"/><circle cx="19.3" cy="16.5" r="1.05" fill="#B8E04A"/></svg>'
AUTITO = '<svg class="autito" width="46" height="30" viewBox="0 0 46 30"><path d="M4 21h38M8 21l4-10c1-3 3-4 6-4h10c3 0 5 1 6 4l4 10" stroke="#123F2C" stroke-width="2.6" fill="#B8E04A" stroke-linejoin="round"></path><circle cx="13" cy="23" r="4" fill="#123F2C"></circle><circle cx="33" cy="23" r="4" fill="#123F2C"></circle></svg>'
PROTO_COT = '<div class="proto"><span class="tag">Solo prototipo</span>${proto}<button type="button" data-ejemplo="cotizar">Completar con un auto de ejemplo y ver el precio</button></div>'

PARCHES = [
 # ---------- armado: estilos, contenido y código de la v2 ----------
 ('estilos v2', '</style>\n</head>', '\n@@incluir:v2/v2.css@@\n</style>\n</head>'),
 ('código v2', '</body>', '<script>\n@@incluir:v2/v2.js@@\n</script>\n</body>'),
 ('estilos v2 en agencias', '</style>\n\n<div id="wrapAg">', '\n@@incluir:v2/agencias_v2.css@@\n</style>\n\n<div id="wrapAg">'),

 # ---------- vendedor: hero sin asterisco ----------
 ('hero: 24 horas sin letra chica', 'Ofertas en 24 horas*</li>', 'Ofertas en un día</li>'),
 ('hero: nota del asterisco', '<p class="nota24">* Desde que entra en la subasta del día (de 10 a 19 h), después de revisar los papeles.</p>\n', ''),
 ('tabla: 24 horas', '<b>24 horas*</b>', '<b>Un día de subasta</b>'),

 # ---------- vendedor: botón de la patente siempre lleno; si falta, avisa al tocarlo ----------
 ('patente: botón lleno', "data-pbuscar aria-live=\"polite\" ${ok && !buscando?'':'disabled'}>", "data-pbuscar aria-live=\"polite\" ${buscando?'disabled':''}>"),
 ('patente: no deshabilitar al escribir', "\n    const b = $('[data-pbuscar]'); if (b) b.disabled = !patOk(S.patente); }", " }"),
 ('patente: avisar si falta', "else if ('pbuscar' in d){ buscarPat(); }",
  "else if ('pbuscar' in d){ if (!patOk(S.patente)){ const e = $('#e_cpat'); if (e) e.textContent = S.patente ? 'Revisá la patente: tiene que ser como ABC 123 o AB 123 CD.' : 'Escribí la patente de tu auto.'; const i = $('#c_patente'); if (i) i.focus(); return; } buscarPat(); }"),

 # ---------- vendedor: preguntas, primero las que frenan ----------
 ('preguntas: sacar cuánto cuesta', F_CUESTA, ''),
 ('preguntas: sacar bajar el precio', F_BAJAR, ''),
 ('preguntas: sacar cómo cobro', F_COBRO, ''),
 ('preguntas: arriba de todo', '<div class="lista">\n<details class="faq"><summary>¿Quién compra mi auto?</summary>',
  '<div class="lista">\n' + F_CUESTA + F_BAJAR + F_COBRO + '<details class="faq"><summary>¿Quién compra mi auto?</summary>'),

 # ---------- vendedor: quiénes somos, contacto en el pie y barra fija del celular ----------
 ('quiénes somos', '<section class="sec" id="preguntas">', '\n@@incluir:v2/quienes.html@@\n<section class="sec" id="preguntas">'),
 ('pie: contacto', '<p>Vendé tu auto a agencias verificadas de CABA y Gran Buenos Aires, sin publicarlo.</p></div>',
  '<p>Vendé tu auto a agencias verificadas de CABA y Gran Buenos Aires, sin publicarlo.</p>'
  f'<p class="pie-contacto"><a href="{WA_VEND}" target="_blank" rel="noopener" data-medir="whatsapp_pie">{ICO_WA}+54 9 3735 62-7475</a><a href="mailto:mxibru97@gmail.com" data-medir="mail_pie">mxibru97@gmail.com</a></p></div>'),
 ('barra fija del celular', '<footer class="pie">',
  '<div class="barcta" id="barCta" aria-hidden="true"><span><b>¿Cuánto vale tu auto?</b>Gratis, en un minuto</span><button class="cta" type="button" id="barCtaBtn" tabindex="-1">Cotizá gratis</button></div>\n<footer class="pie">'),

 # ---------- agencias: en el hero, la subasta de hoy (sin fotos, distancia ni precios para quien no tiene cuenta) ----------
 ('agencias: lotes sin foto', 'function heroLots(){', 'function heroLots(sinFoto){\n if(!window.YacarSubasta&&!heroLots.espera){ heroLots.espera=1; setTimeout(renderLanding,0); }   // v2: la subasta (subasta.js) carga después; se repinta con sus autos'),
 ('agencias: lotes sin foto 2', '${c.src?', '${c.src&&!sinFoto?'),
 ('agencias: lotes sin distancia', '<div class="s num">${banda(dist(ZBY[c.z],b))}</div>', '${sinFoto?"":`<div class="s num">${banda(dist(ZBY[c.z],b))}</div>`}'),
 ('agencias: hero sin ejemplos', ':`<div class="card"><div class="cardhead"><h3>Operaciones cerradas</h3>',
  ':`<div class="card"><div class="cardhead"><h3>Hoy hay ${window.YacarSubasta?YacarSubasta.autos().length:CARS.length} autos en subasta</h3><span class="clock num" id="clock1">--</span></div>'
  '<ul class="lotlist" id="heroLots"></ul><div class="cardfoot"><span>Fotos, estado y ofertas: solo para agencias aprobadas. <a href="#agencias/subasta">Ver la lista</a></span></div></div>`'
  '+(""&&`<div class="card"><div class="cardhead"><h3>Operaciones cerradas</h3>'),
 ('agencias: hero sin ejemplos (cierre)', 'Ejemplos ilustrativos. La subasta la ven solo las agencias aprobadas.</span></div></div>`;',
  'Ejemplos ilustrativos. La subasta la ven solo las agencias aprobadas.</span></div></div>`);'),
 ('agencias: pintar la subasta de hoy', 'if(ok){ heroLots(); tick(); }', 'heroLots(!ok); tick();'),
 ('agencias: sin operaciones de ejemplo', 'byId("operaciones").hidden=ok', 'byId("operaciones").hidden=true'),

 # ---------- agencias: WhatsApp a una persona y sin Yacar Gestión ----------
 ('agencias: WhatsApp en el hero', ':`<button class="btn pri" data-go="alta">Sumar mi agencia</button><a class="btn ondark" href="#agencias/subasta">Ver la subasta de hoy</a>`;',
  f':`<button class="btn pri" data-go="alta">Sumar mi agencia</button><a class="btn ondark wa" href="{WA_AG}" target="_blank" rel="noopener" data-medir="whatsapp_agencias_hero">{ICO_WA}Hablemos por WhatsApp</a>`;'),
 ('agencias: WhatsApp en el cierre',
  '<div class="herobtns"><button class="btn pri" data-go="alta">Sumar mi agencia</button><a class="btn ondark" href="#agencias/subasta">Ver la subasta de hoy</a></div>\n   <p class="lema">Gratis durante el piloto. Te llamamos antes de aprobarte.</p>',
  f'<div class="herobtns"><button class="btn pri" data-go="alta">Sumar mi agencia</button><a class="btn ondark wa" href="{WA_AG}" target="_blank" rel="noopener" data-medir="whatsapp_agencias_cierre">{ICO_WA}Hablemos por WhatsApp</a></div>\n'
  '   <p class="lema">Gratis durante el piloto. Te llamamos antes de aprobarte. También podés escribirnos a <a href="mailto:mxibru97@gmail.com">mxibru97@gmail.com</a>.</p>'),
 ('agencias: sin Yacar Gestión', '   <div class="callout">\n    <div><h3>¿No tenés gestor? Yacar Gestión</h3><p>Hacemos la transferencia por un fee aparte.</p></div>\n    <span class="ptag">Idea a validar · precio a definir</span>\n   </div>\n', ''),
 ('agencias: transferencia', '<p>Tu agencia, con su gestor. Si no tenés, Yacar Gestión.</p>', '<p>Tu agencia, con su gestor.</p>'),
 # ---------- logo nuevo (auto-yacaré) en los dos lados, ícono de la pestaña y yacaré en la barra de carga ----------
 ('logo vendedor', '<a href="#cotizar" class="logo" data-home aria-label="Yacar, volver al inicio">\n' + LOGO_V1, '<a href="#cotizar" class="logo" data-home aria-label="Yacar, volver al inicio">\n' + LOGO_V2),
 ('logo agencias', 'const LOGO=`' + LOGO_V1.replace('aria-hidden="true">', 'aria-hidden="true" style="flex:none">') + '`;', 'const LOGO=`' + LOGO_V2 + '`;'),
 ('ícono de la pestaña', '</head>', f'<link rel="icon" href="{FAVICON}">\n</head>'),
 ('yacaré en la carga', AUTITO, '<svg class="autito yacare" width="64" height="28" viewBox="4 28 92 40"><path fill="#123F2C" fill-rule="evenodd" d="' + YACARE + '"/></svg>'),

 # ---------- cotizador más corto: los atajos del prototipo quedan plegados ----------
 ('atajos del prototipo plegados', PROTO_COT,
  '<details class="proto protopleg"><summary><span class="tag">Solo prototipo</span> Patentes y autos de ejemplo</summary><div class="protolista">${proto}<button type="button" data-ejemplo="cotizar">Completar con un auto de ejemplo y ver el precio</button></div></details>'),
]
