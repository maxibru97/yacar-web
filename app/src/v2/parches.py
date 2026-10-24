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
 ('agencias: lotes sin foto', 'function heroLots(){', 'function heroLots(sinFoto){'),
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
]
