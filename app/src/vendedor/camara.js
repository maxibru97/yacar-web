// ------------------------------------------------------------ Cámara dentro de la web con silueta (16/10/2026, D-44)
// El botón "Sacar la foto" abre la cámara adentro de la página con una guía dibujada encima: la silueta del auto en ese ángulo,
// el círculo de la rueda, el recuadro de la cédula o el óvalo de la selfie. No hay indicaciones en vivo ("más cerca", "más lejos"):
// eso es la opción C, para cuando haya volumen. Si el celular no deja usar la cámara acá, se usa la del celular (el input de siempre).
// Las fotos sacadas acá no traen datos EXIF: por eso no se marcan como "sin datos de la cámara" para quien revisa.
// 18/10/2026 (Gonzalo: "que fluya"): sesión de fotos. La cámara se abre UNA vez para todas las fotos del auto (10 + motor opcional): cada foto se revisa en el momento
// (luz, nitidez, resolución); si sale bien, aparece un ✓ y pasa sola a la siguiente silueta. Si no, muestra qué pasó con "Repetir" / "Usar igual".
// Arriba: "Foto 3 de 10", qué sacar, un consejo y un mapita de dónde pararse. Entre afuera y adentro (y antes de los daños) hay un corte corto.
// Inspirado en Motorway (siluetas + revisión en segundos con ✓ o un consejo) y en las apps de inspección guiada (una sola sesión de cámara).
const Camara = (() => {
  let ov = null, stream = null, act = null, ignorarPop = false, ses = null, ocupado = false;
  const AUTO = {esq_di:'izq', esq_td:'izq', esq_dd:'der', esq_ti:'der'};   // de qué lado queda el frente (o la cola) en la foto
  const ETIQ = {cedula_f:'Cédula verde (frente)', cedula_d:'Cédula verde (dorso)', chasis:'Número de chasis', dni_f:'DNI (frente)', dni_d:'DNI (dorso)',
    selfie:'Tu selfie', f12:'Formulario 12', libreta:'Libreta de service'};
  function guia(g, k){
    if (g==='fotos' && AUTO[k]) return {tipo:'auto', cara:AUTO[k], horizontal:true, tip:'Que el auto entero entre en la silueta'};
    if (g==='fotos' && k.startsWith('cub_')) return {tipo:'rueda', tip:'Que la rueda llene el círculo y se vea el dibujo'};
    if (g==='fotos' && k==='tablero') return {tipo:'tablero', horizontal:true, tip:'Que se lean los kilómetros y las luces'};
    if (g==='fotos') return {tipo:'marco', horizontal:k!=='llaves', tip:(CONSEJOS[k]||[''])[(k==='asientos_del'||k==='asientos_tras') ? 1 : 0]};
    if (g==='danios') return {tipo:'marco', tip:'De cerca: que se vea bien el daño'};
    if (k==='selfie') return {tipo:'cara', frontal:true, tip:'Tu cara dentro del óvalo, mirando a la cámara'};
    if (k==='chasis') return {tipo:'tira', tip:'Que se lea el número entero. Si se ve, también la patente grabada en el vidrio'};
    if (k==='f12' || k==='libreta') return {tipo:'hoja', tip:k==='f12' ? 'Que se lean la fecha y la patente' : 'Las páginas con los sellos'};
    return {tipo:'tarjeta', tip:'Que la tarjeta llene el recuadro, sin reflejos'};
  }
  const titulo = (g, k) => g==='fotos' ? TITULO_FOTO[k] : g==='danios' ? 'Daño ' + k.replace(/\D/g,'') : (ETIQ[k] || 'Foto');
  const galeria = g => !(g==='fotos' || g==='danios');   // las del auto, solo con la cámara (como antes); papeles, cámara o galería

  // ---------------------------------------------------------- guías (SVG con el mismo tamaño que el video)
  const LINEA = 'fill="none" stroke="#fff" stroke-width="3" vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"';
  const mascara = (W, H, hueco) => `<path d="M0 0H${W}V${H}H0Z ${hueco}" fill="rgba(0,0,0,.42)" fill-rule="evenodd"/><path d="${hueco}" ${LINEA}/>`;
  const rrect = (x, y, w, h, r) => `M${x+r} ${y}H${x+w-r}Q${x+w} ${y} ${x+w} ${y+r}V${y+h-r}Q${x+w} ${y+h} ${x+w-r} ${y+h}H${x+r}Q${x} ${y+h} ${x} ${y+h-r}V${y+r}Q${x} ${y} ${x+r} ${y}Z`;
  function dibujar(gd, W, H){
    const cx = W/2, cy = H/2, m = Math.min(W, H);
    if (gd.tipo==='auto'){   // auto a 45°, dibujado en 1000 × 500 con la cara (frente o cola) a la izquierda; se espeja para el otro lado
      const s = Math.min(W*0.88/900, H*0.74/340), tx = cx - 500*s, ty = cy - 310*s;
      const espejo = gd.cara==='der' ? ' transform="matrix(-1 0 0 1 1000 0)"' : '';
      return `<g transform="translate(${tx} ${ty}) scale(${s})" class="cam-auto"><g${espejo}>
        <path d="M90 410L85 322Q88 296 112 290L250 230L362 150Q372 144 386 144L770 148Q790 150 800 160L880 244L908 258Q920 264 920 280L920 372Q920 386 906 388L842 392A44 44 0 0 0 756 394L502 408A60 60 0 0 0 384 412L350 422L100 420Q90 418 90 410Z" ${LINEA}/>
        <path d="M112 290L332 300L350 422M332 300L500 238M250 230L500 238M500 238L590 152" ${LINEA}/>
        <path d="M522 246L602 166L774 166L850 250Z" ${LINEA}/><path d="M690 166V248" ${LINEA}/>
        <path d="M100 318L170 322L168 340L98 336ZM250 326L318 330L320 348L252 344ZM180 362L282 366" ${LINEA}/>
        <circle cx="443" cy="412" r="52" ${LINEA}/><circle cx="799" cy="392" r="40" ${LINEA}/>
        <path d="M40 474H960" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-dasharray="10 9" vector-effect="non-scaling-stroke"/></g></g>`;
    }
    if (gd.tipo==='rueda'){ const r = m*0.37; return `<circle cx="${cx}" cy="${cy}" r="${r}" ${LINEA}/><circle cx="${cx}" cy="${cy}" r="${r*0.6}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-dasharray="8 7" vector-effect="non-scaling-stroke"/>`; }
    if (gd.tipo==='tablero'){ const w = W*0.8, h = Math.min(H*0.56, w*0.42), x = cx-w/2, y = cy-h/2, r = h*0.34;
      return `<path d="${rrect(x, y, w, h, h*0.2)}" ${LINEA}/><circle cx="${cx-w*0.2}" cy="${cy}" r="${r}" ${LINEA}/><circle cx="${cx+w*0.2}" cy="${cy}" r="${r}" ${LINEA}/>`; }
    if (gd.tipo==='cara'){ const ry = Math.min(H*0.34, W*0.42*1.3), rx = ry/1.3;
      return mascara(W, H, `M${cx-rx} ${cy}A${rx} ${ry} 0 1 0 ${cx+rx} ${cy}A${rx} ${ry} 0 1 0 ${cx-rx} ${cy}Z`); }
    if (gd.tipo==='tarjeta' || gd.tipo==='tira' || gd.tipo==='hoja'){
      const ar = gd.tipo==='tarjeta' ? 1.586 : gd.tipo==='tira' ? 4.5 : 0.707;
      let w = W*0.84, h = w/ar; if (h > H*0.8){ h = H*0.8; w = h*ar; }
      return mascara(W, H, rrect(cx-w/2, cy-h/2, w, h, Math.min(w, h)*0.06));
    }
    const i = m*0.08, l = m*0.12;   // marco: 4 esquinas
    return [[i, i, 1, 1], [W-i, i, -1, 1], [i, H-i, 1, -1], [W-i, H-i, -1, -1]].map(([x, y, sx, sy]) => `<path d="M${x} ${y+sy*l}V${y}H${x+sx*l}" ${LINEA}/>`).join('');
  }

  // ---------------------------------------------------------- abrir, acomodar, sacar, cerrar
  const hayCamara = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  function abrir(g, k){
    const input = document.getElementById('f_' + k);
    if (!hayCamara()){ if (input) input.click(); return; }   // sin cámara en la web: la del celular
    cerrar(); ses = null; montar(g, k);
  }
  // lista: [{g, k, corte?}] en el orden en que se sacan; fin(pausa) se llama al terminar o al pausar
  function sesion(lista, fin){
    if (!hayCamara() || !lista.length) return false;
    cerrar(); ses = {lista, i:0, fin}; montar(lista[0].g, lista[0].k);
    return true;
  }
  function montar(g, k){
    const gd = guia(g, k); act = {g, k, gd};
    ov = document.createElement('div'); ov.className = 'cam-ov' + (gd.frontal ? ' frontal' : '');
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Cámara: ' + titulo(g, k));
    ov.innerHTML = `${ses ? '<div class="cam-barra" aria-hidden="true"><i></i></div>' : ''}<div class="cam-top"><div class="cam-txt">${ses ? '<small class="cam-prog"></small>' : ''}<b class="cam-tit">${esc(titulo(g, k))}</b><span class="cam-tip">${esc(gd.tip)}</span></div>${ses ? '<div class="cam-mapa" aria-hidden="true"></div>' : ''}<button type="button" class="cam-x" aria-label="${ses ? 'Pausar las fotos' : 'Cerrar la cámara'}">✕</button></div>
      <div class="cam-stage"><div class="cam-box"><video playsinline muted autoplay></video><svg class="cam-guia" aria-hidden="true"></svg><div class="cam-flash"></div></div>
        <p class="cam-girar" hidden>Girá el celular: esta foto va en horizontal</p><div class="cam-msg" role="status">Abriendo la cámara…</div>
        <div class="cam-ok" hidden role="status">✓ Bien</div><div class="cam-panel" hidden role="dialog"></div></div>
      <div class="cam-bot">${ses ? '<button type="button" class="cam-alt cam-pausa">Pausar</button>' : `<label class="cam-alt" for="f_${k}">${galeria(g) ? 'Cámara del celular o galería' : 'Usar la cámara del celular'}</label>`}
        <button type="button" class="cam-disparo" aria-label="Sacar la foto" disabled></button>${ses ? '<button type="button" class="cam-alt cam-saltar">Saltear</button>' : '<span class="cam-esp"></span>'}</div>`;
    document.body.appendChild(ov); document.body.classList.add('cam-abierta');
    const video = ov.querySelector('video');
    ov.querySelector('.cam-x').addEventListener('click', ev => { ev.stopPropagation(); ses ? pausar() : cerrar(); });
    ov.querySelector('.cam-disparo').addEventListener('click', ev => { ev.stopPropagation(); ses ? dispararSes() : disparar(); });
    if (ses){ ov.querySelector('.cam-pausa').addEventListener('click', ev => { ev.stopPropagation(); pausar(); });
      ov.querySelector('.cam-saltar').addEventListener('click', ev => { ev.stopPropagation(); if (!ocupado) siguiente(); }); ponerPaso(); }
    else ov.querySelector('.cam-alt').addEventListener('click', () => setTimeout(cerrar, 300));   // la cámara del celular toma la posta (mismo input de antes)
    ov.addEventListener('click', ev => ev.stopPropagation());
    try { history.pushState(Object.assign({}, history.state, {cam:1}), ''); } catch(e){}
    navigator.mediaDevices.getUserMedia({audio:false, video:{facingMode: gd.frontal ? 'user' : {ideal:'environment'}, width:{ideal:1920}, height:{ideal:1080}}})
      .then(st => {
        if (!ov){ st.getTracks().forEach(t => t.stop()); return; }
        stream = st; video.srcObject = st;
        video.addEventListener('loadedmetadata', () => { acomodar(); ov.querySelector('.cam-msg').hidden = true; ov.querySelector('.cam-disparo').disabled = !ov.querySelector('.cam-panel').hidden; ov.querySelector('.cam-disparo').focus(); }, {once:true});
      })
      .catch(err => {
        if (!ov) return;
        const msg = ov.querySelector('.cam-msg');
        msg.innerHTML = `<b>${err && err.name==='NotAllowedError' ? 'No nos diste permiso para usar la cámara acá.' : 'No pudimos abrir la cámara acá.'}</b><span>Podés sacarla con la cámara del celular:</span><label class="btn" for="f_${k}">${galeria(g) ? 'Usar la cámara o la galería' : 'Usar la cámara del celular'}</label>`;
        msg.querySelector('label').addEventListener('click', () => setTimeout(()=>{ const s = ses; cerrar(false, () => { if (s) s.fin(true); }); }, 300));
        ov.querySelector('.cam-box').hidden = true;
      });
  }
  function acomodar(){
    if (!ov) return;
    const video = ov.querySelector('video'), box = ov.querySelector('.cam-box'), stage = ov.querySelector('.cam-stage');
    const vw = video.videoWidth, vh = video.videoHeight; if (!vw || !vh) return;
    const r = stage.getBoundingClientRect(), ar = vw/vh;
    let w = r.width, h = w/ar; if (h > r.height){ h = r.height; w = h*ar; }
    box.style.width = Math.floor(w) + 'px'; box.style.height = Math.floor(h) + 'px';
    const W = 1000, H = Math.round(1000/ar), svg = ov.querySelector('.cam-guia');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = dibujar(act.gd, W, H);
    ov.querySelector('.cam-girar').hidden = !(act.gd.horizontal && vh > vw);
  }
  function disparar(){
    if (!ov || !stream) return;
    const video = ov.querySelector('video'), c = document.createElement('canvas');
    c.width = video.videoWidth; c.height = video.videoHeight; c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
    const {g, k} = act; ov.querySelector('.cam-flash').classList.add('on'); ov.querySelector('.cam-disparo').disabled = true;
    c.toBlob(b => {
      cerrar();
      if (!b) return;
      const file = new File([b], `${k}.jpg`, {type:'image/jpeg', lastModified:Date.now()});
      procesarArchivo(g, k, file, true);
    }, 'image/jpeg', 0.92);
  }
  // ---------------------------------------------------------- sesión de fotos (18/10)
  function ponerPaso(){
    if (!ov || !ses) return;
    const p = ses.lista[ses.i], gd = guia(p.g, p.k); act = {g:p.g, k:p.k, gd};
    const hechas = OBLIG.filter(f => S.fotos[f[0]]).length;
    ov.querySelector('.cam-prog').textContent = p.g==='danios' ? 'Daños' : OPCIONALES.includes(p.k) ? 'Opcional · podés saltearla' : `Foto ${SECUENCIA.indexOf(p.k) + 1} de ${OBLIG.length} · ${SECUENCIA.indexOf(p.k) < AFUERA ? 'Afuera' : 'Adentro'}`;
    ov.querySelector('.cam-barra i').style.width = (Math.min(1, hechas / OBLIG.length) * 100) + '%';
    ov.querySelector('.cam-tit').textContent = titulo(p.g, p.k);
    ov.querySelector('.cam-tip').textContent = gd.tip;
    ov.querySelector('.cam-mapa').innerHTML = p.g==='fotos' ? dibujo(p.k) : '';
    ov.setAttribute('aria-label', 'Cámara: ' + titulo(p.g, p.k));
    ov.querySelector('.cam-saltar').hidden = p.g==='danios';
    acomodar();
    const b = ov.querySelector('.cam-disparo'); if (stream) b.disabled = false;
  }
  function panel(html, botones){   // tarjeta sobre la cámara: revisar una foto o un corte entre etapas
    const el = ov.querySelector('.cam-panel'); el.innerHTML = html + `<div class="cam-acc">${botones.map((b, i) => `<button type="button" class="btn ${i ? 'sec' : ''}" data-i="${i}">${esc(b[0])}</button>`).join('')}</div>`;
    el.hidden = false; ov.querySelector('.cam-disparo').disabled = true;
    el.querySelectorAll('button').forEach(x => x.addEventListener('click', ev => { ev.stopPropagation(); el.hidden = true; botones[+x.dataset.i][1](); }));
    const f = el.querySelector('button'); if (f) f.focus();
  }
  async function dispararSes(){
    if (!ov || !stream || ocupado) return;
    ocupado = true;
    const video = ov.querySelector('video'), c = document.createElement('canvas'), {g, k} = act;
    c.width = video.videoWidth; c.height = video.videoHeight; c.getContext('2d').drawImage(video, 0, 0, c.width, c.height);
    const fl = ov.querySelector('.cam-flash'); fl.classList.add('on'); setTimeout(() => fl.classList.remove('on'), 160);
    ov.querySelector('.cam-disparo').disabled = true;
    const b = await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.92));
    if (!b || !ov){ ocupado = false; return; }
    const file = new File([b], `${k}.jpg`, {type:'image/jpeg', lastModified:Date.now()});
    const r = await analizarFoto(file, true);
    FQ[g+'|'+k] = r; repetidas(g);
    await guardarFoto(g, k, file); guardar();
    ocupado = false;
    if (!ov) return;
    const av = [...r.avisos, ...(FQ[g+'|'+k].repetida ? ['Parece igual a otra foto'] : [])];
    if (av.length){
      panel(`<img src="${S[g][k]}" alt="Tu foto"><p><b>${esc(av.join('. '))}.</b></p>`,
        [['Repetir', () => { delete S[g][k]; delete FQ[g+'|'+k]; ponerPaso(); }], ['Usar igual', siguiente]]);
      return;
    }
    const okEl = ov.querySelector('.cam-ok'); okEl.hidden = false;
    setTimeout(() => { if (!ov) return; okEl.hidden = true; siguiente(); }, 650);
  }
  function siguiente(){
    if (!ov || !ses) return;
    const p = ses.lista[ses.i];
    if (p.g==='danios' && S.danios[p.k]){   // después de cada daño: ¿hay otro?
      return panel('<p><b>¿Tiene otro golpe, rayón o algo roto?</b></p>', [['No, seguir', avanzar], ['Sacar otro', () => {
        const n = Object.keys(S.danios).length + 1; S.nDanios = Math.max(S.nDanios || 1, n);
        ses.lista.splice(ses.i + 1, 0, {g:'danios', k:'d' + n}); avanzar(); }]]);
    }
    avanzar();
  }
  function avanzar(){
    ses.i++;
    if (ses.i >= ses.lista.length) return terminar(false);
    const q = ses.lista[ses.i];
    if (q.corte) panel(`<p><b>${esc(q.corte[0])}</b></p><p>${esc(q.corte[1])}</p>`, [['Seguir', ponerPaso]]);
    else ponerPaso();
  }
  function terminar(pausa){ const s = ses; cerrar(false, () => { if (s) s.fin(pausa); }); }   // fin recién cuando el navegador volvió del paso de la cámara
  function pausar(){ if (!ocupado) terminar(true); }

  let trasPop = null;
  function cerrar(desdeAtras, luego){
    if (stream){ stream.getTracks().forEach(t => t.stop()); stream = null; }
    if (!ov){ if (luego) luego(); return; }
    ov.remove(); ov = null; act = null; ses = null; ocupado = false; document.body.classList.remove('cam-abierta');
    if (!desdeAtras && history.state && history.state.cam){ ignorarPop = true; trasPop = luego || null; history.back();
      if (luego) setTimeout(() => { if (trasPop===luego){ trasPop = null; luego(); } }, 600); }
    else if (luego) luego();
  }
  // "Atrás" del celular con la cámara abierta: cierra la cámara y no mueve el resto de la web (va antes que el manejo de la web)
  window.addEventListener('popstate', ev => {
    if (ignorarPop){ ignorarPop = false; ev.stopImmediatePropagation(); const f = trasPop; trasPop = null; if (f) f(); return; }
    if (ov){ ev.stopImmediatePropagation(); const s = ses; cerrar(true); if (s) s.fin(true); }
  }, true);
  window.addEventListener('resize', () => requestAnimationFrame(acomodar));
  document.addEventListener('keydown', ev => { if (ov && ev.key==='Escape'){ if (ses) pausar(); else cerrar(); } });
  return {abrir, sesion, cerrar, hayCamara, abierta: () => !!ov};
})();
