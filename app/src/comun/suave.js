/* ===================== Transiciones suaves (11/10/2026, pedido de Gonzalo) =====================
 Lo usan los dos lados. En vez de reemplazar una pantalla entera con innerHTML (que hace saltar todo), Suave.poner
 compara lo nuevo con lo que ya está y toca solo lo que cambió:
  - lo que no cambió queda quieto (no pierde el foco ni lo que se estaba escribiendo),
  - lo nuevo aparece con un fundido corto,
  - lo que se va se desvanece,
  - lo que se corre de lugar se desliza hasta su nueva posición (técnica FLIP).
 Suave.entrar(el, dir) anima la entrada de una pantalla nueva ("fwd", "back" o "fade").
 Los elementos con data-vivo (por ejemplo el mapa) los maneja su propio código: Suave no toca su contenido.
 Con "reducir movimiento" activado en el sistema, todo cambia sin animación. */
const Suave = (() => {
  const sinMov = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EASE = 'cubic-bezier(.2,.7,.2,1)';
  const firma = n => n.nodeType !== 1 ? '#' + n.nodeType
    : n.nodeName + '|' + (n.id || '') + '|' + (n.getAttribute('data-k') || '') + '|' + (n.classList[0] || '');

  function activo(n){ const r = n.getRootNode(); return r && r.activeElement === n; }

  function morph(a, b, nuevos){
    if (a.nodeType === 3 || a.nodeType === 8){ if (a.data !== b.data) a.data = b.data; return; }
    if (a.nodeType !== 1 || a.isEqualNode(b)) return;
    for (const at of [...a.attributes]){
      if (at.name === 'open' && a.nodeName === 'DETAILS') continue;      // lo abre o cierra la persona
      if (!b.hasAttribute(at.name)) a.removeAttribute(at.name);
    }
    for (const at of [...b.attributes]){
      if (at.name === 'open' && a.nodeName === 'DETAILS') continue;
      if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
    }
    if (a.hasAttribute('data-vivo')) return;
    if (a.nodeName === 'INPUT'){
      if (a.type === 'checkbox' || a.type === 'radio') a.checked = b.hasAttribute('checked');
      else if (a.type !== 'file' && !activo(a)){ const v = b.getAttribute('value') ?? ''; if (a.value !== v) a.value = v; }
      return;
    }
    if (a.nodeName === 'TEXTAREA'){ if (!activo(a) && a.value !== b.textContent) a.value = b.textContent; return; }
    hijos(a, b, nuevos);
    if (a.nodeName === 'SELECT'){ const o = b.querySelector('option[selected]') || b.querySelector('option'); if (o) a.value = o.getAttribute('value') ?? o.textContent; }
  }

  function hijos(a, b, nuevos){
    const viejos = [...a.childNodes].filter(n => !(n.nodeType === 1 && n.dataset.saliendo));
    let prev = null;
    for (const n of [...b.childNodes]){
      const f = firma(n), i = viejos.findIndex(v => firma(v) === f);
      let nodo;
      if (i >= 0){ nodo = viejos.splice(i, 1)[0]; morph(nodo, n, nuevos); }
      else { nodo = n; if (n.nodeType === 1) nuevos.push(n); }
      const lugar = prev ? prev.nextSibling : a.firstChild;
      if (nodo !== lugar) a.insertBefore(nodo, lugar);
      prev = nodo;
    }
    for (const v of viejos) v.__sale = true, (v.nodeType === 1 ? v.__salePadre = a : v.remove());
  }

  // Elementos a medir para el deslizamiento: hasta 4 niveles de profundidad.
  const medibles = root => [...root.querySelectorAll(':scope > *, :scope > * > *, :scope > * > * > *, :scope > * > * > * > *')]
    .filter(e => !e.closest('[data-vivo] *') && !e.dataset.saliendo);

  function poner(root, html){
    const t = document.createElement('template'); t.innerHTML = html;
    if (sinMov() || !root.firstChild){ root.innerHTML = ''; root.appendChild(t.content); return; }
    const antes = new Map(); for (const e of medibles(root)) antes.set(e, e.getBoundingClientRect());
    const rr = root.getBoundingClientRect();
    const nuevos = [];
    hijos(root, t.content, nuevos);
    // lo que se va: se desvanece en su lugar, sin ocupar espacio
    const salen = [];
    (function juntar(n){ for (const c of [...n.childNodes]){ if (c.__sale && c.nodeType === 1) salen.push(c); else if (c.nodeType === 1 && !c.dataset.saliendo) juntar(c); } })(root);
    if (getComputedStyle(root).position === 'static') root.style.position = 'relative';
    for (const el of salen){
      const r = antes.get(el);
      if (!r || !r.height){ el.remove(); continue; }
      el.dataset.saliendo = '1';
      Object.assign(el.style, {position:'absolute', left:(r.left - rr.left - root.clientLeft) + 'px', top:(r.top - rr.top - root.clientTop) + 'px',
        width:r.width + 'px', height:r.height + 'px', margin:'0', pointerEvents:'none', zIndex:'0'});
      root.appendChild(el);
      const an = el.animate([{opacity:1}, {opacity:0}], {duration:170, easing:'ease-out', fill:'forwards'});
      an.onfinish = an.oncancel = () => el.remove();
    }
    // lo que se corrió: se desliza desde donde estaba (los hijos no repiten el movimiento del padre)
    const total = new Map();
    for (const [el, r0] of antes){
      if (!el.isConnected || el.dataset.saliendo || nuevos.includes(el)) continue;
      const r1 = el.getBoundingClientRect();
      if (!r1.width && !r1.height) continue;
      let p = el.parentElement, acum = [0, 0];
      while (p && p !== root){ if (total.has(p)){ acum = total.get(p); break; } p = p.parentElement; }
      const dx = r0.left - r1.left - acum[0], dy = r0.top - r1.top - acum[1];
      total.set(el, [acum[0] + dx, acum[1] + dy]);
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      if (getComputedStyle(el).display === 'inline') continue;
      el.animate([{transform:`translate(${dx}px,${dy}px)`}, {transform:'none'}], {duration:340, easing:EASE});
    }
    // lo nuevo: aparece
    for (const el of nuevos) if (el.isConnected && el.getClientRects().length)
      el.animate([{opacity:0, transform:'translateY(6px)'}, {opacity:1, transform:'none'}], {duration:280, delay:70, easing:EASE, fill:'backwards'});
  }

  function entrar(el, dir = 'fade'){
    if (!el || sinMov()) return;
    const desde = dir === 'fwd' ? 'translateX(28px)' : dir === 'back' ? 'translateX(-28px)' : 'translateY(8px)';
    el.animate([{opacity:0, transform:desde}, {opacity:1, transform:'none'}], {duration:dir === 'fade' ? 320 : 360, easing:EASE});
  }

  // Interpolación con requestAnimationFrame (la usa el mapa para el zoom).
  function tween(dur, cada, fin){
    if (sinMov()){ cada(1); fin && fin(); return () => {}; }
    const t0 = performance.now(); let vivo = true;
    const ease = t => t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
    (function paso(now){ if (!vivo) return; const t = Math.min(1, (now - t0) / dur); cada(ease(t)); if (t < 1) requestAnimationFrame(paso); else fin && fin(); })(t0);
    return () => { vivo = false; };
  }

  return {poner, entrar, tween, sinMov};
})();
