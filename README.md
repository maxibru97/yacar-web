# Yacar · web

La web de Yacar en un solo archivo: lado vendedor y, en `#agencias`, el portal de subasta para agencias.

- `app/src/`: el código fuente (vendedor, agencias, datos, fotos).
- `app/build.py`: arma `app/web-yacar.html` a partir de `app/src/`.
- `public/index.html`: lo que publica Vercel (copia del archivo armado).

## Publicar un cambio

```
python app/build.py
cp app/web-yacar.html public/index.html
git commit -am "..." && git push
```

Vercel publica solo cada push a `main` (plan Hobby, sin paso de build).

## Cuenta de agencias

En la web publicada el ingreso y el alta de agencias usan Supabase (proyecto `yacar`), ver `app/src/agencias/cuenta.js`.
Abierta con doble clic, dentro de claude.ai o con `?demo=1`, todo sigue simulado como prototipo.
La subasta (autos y ofertas) todavía es de ejemplo.

Mientras sea prototipo la web no se indexa en buscadores (`X-Robots-Tag: noindex` en `vercel.json`).
