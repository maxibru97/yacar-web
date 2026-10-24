"""Arma app/web-yacar.html (un solo archivo, se abre con doble clic) a partir de app/src/.

Uso:   python build.py          (desde app/, o con la ruta completa desde cualquier lado)
       python build.py v2       la versión 2 (24/10): ../public/v2/index.html, con las fotos aparte en ../public/v2/img/

Correrlo después de cada cambio en src/. web-yacar.html no se edita a mano: se pisa en cada build.

Qué junta:
  src/base.html                 esqueleto: <head>, fuentes y dónde va cada parte
  src/vendedor/vendedor.*       lado vendedor (cuerpo, estilos, código)
  src/agencias/agencias.*       lado agencias (contenido del <template id="tplAg">, estilos, código)
  src/datos/*.json              catálogo, supuestos de estado, factores por modelo, códigos postales
  src/fotos/*.jpg               fotos de ejemplo (van en base64 adentro del HTML)

Marcas que reemplaza:
  @@incluir:ruta@@              (renglón entero en base.html) → el archivo de src/ tal cual
  /*@json:archivo.json*/null    → el contenido de src/datos/archivo.json, en JSON compacto
  /*@foto:archivo.jpg*/""       → "data:image/jpeg;base64,..." con src/fotos/archivo.jpg (también .pdf, para la ficha)
  /*@foto?:archivo.jpg*/""      → igual, pero si la foto no está queda "" (19/10: fotos opcionales, ej. las de los pasos del inicio)
Las marcas de json y foto son JavaScript válido, así que los .js de src/ se pueden revisar con un editor normal.

v2 (24/10): arma lo mismo y después aplica src/v2/parches.py (cambios de texto sobre el HTML armado, cada uno tiene que
encontrar su texto una sola vez; si Gonzalo cambia ese texto en src/, el build avisa). Así src/ sigue siendo la v1 y los
cambios de src/ pasan solos a la v2. Las fotos no van en base64: quedan como archivos y se bajan solo cuando se ven.
"""
import base64
import json
import re
import sys
from pathlib import Path

APP = Path(__file__).resolve().parent
SRC = APP / 'src'
SALIDA = APP / 'web-yacar.html'


def leer(ruta):
    return ruta.read_text(encoding='utf-8')


def json_compacto(nombre):
    ruta = SRC / 'datos' / nombre
    try:
        dato = json.loads(leer(ruta))
    except json.JSONDecodeError as e:
        sys.exit(f'ERROR: {ruta.relative_to(APP)} no es JSON válido (renglón {e.lineno}, columna {e.colno}): {e.msg}')
    # "</" se escapa para que nunca cierre el <script> que lo contiene
    return json.dumps(dato, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


V2 = None   # en v2, carpeta donde se copian las fotos (public/v2/img)


def foto(nombre):
    ruta = SRC / 'fotos' / nombre
    if V2 is not None:
        V2.mkdir(parents=True, exist_ok=True)
        (V2 / nombre).write_bytes(ruta.read_bytes())
        return f'"/v2/img/{nombre}"'   # con / adelante: anda igual entrando por /v2 o por /v2/
    tipo = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf'}[ruta.suffix.lower()]
    return f'"data:{tipo};base64,{base64.b64encode(ruta.read_bytes()).decode()}"'


def incluir(m):
    ruta = SRC / m[1]
    if not ruta.is_file():
        sys.exit(f'ERROR: base.html pide {m[1]}, que no existe en src/')
    return leer(ruta)


def falta(tipo, nombre, carpeta):
    if not (SRC / carpeta / nombre).is_file():
        sys.exit(f'ERROR: hay una marca @{tipo}:{nombre} pero no existe src/{carpeta}/{nombre}')


def parchear(html):
    ns = {}
    exec(leer(SRC / 'v2' / 'parches.py'), ns)
    for i, (donde, viejo, nuevo) in enumerate(ns['PARCHES'], 1):
        n = html.count(viejo)
        if n != 1:
            sys.exit(f'ERROR v2: el parche {i} ({donde}) encontró su texto {n} veces (tiene que ser 1). ¿Cambió src/? Revisá src/v2/parches.py')
        html = html.replace(viejo, nuevo)
    return html


def armar(v2=False):
    html = re.sub(r'^@@incluir:([^@\n]+)@@\n', incluir, leer(SRC / 'base.html'), flags=re.M)
    if v2:
        html = re.sub(r'^@@incluir:([^@\n]+)@@\n', incluir, parchear(html), flags=re.M)
    for nombre in re.findall(r'/\*@json:([^*]+)\*/null', html):
        falta('json', nombre, 'datos')
    for nombre in re.findall(r'/\*@foto:([^*]+)\*/""', html):
        falta('foto', nombre, 'fotos')
    html = re.sub(r'/\*@json:([^*]+)\*/null', lambda m: json_compacto(m[1]), html)
    html = re.sub(r'/\*@foto:([^*]+)\*/""', lambda m: foto(m[1]), html)
    html = re.sub(r'/\*@foto\?:([^*]+)\*/""', lambda m: foto(m[1]) if (SRC / 'fotos' / m[1]).is_file() else '""', html)
    resto = re.findall(r'@@incluir:[^@\n]*@@|/\*@(?:json|foto\??):[^*]*\*/', html)
    if resto:
        sys.exit(f'ERROR: quedaron marcas sin reemplazar: {resto[:5]}')
    return html


if __name__ == '__main__':
    if sys.argv[1:] == ['v2']:
        destino = APP.parent / 'public' / 'v2'
        V2 = destino / 'img'
        if V2.is_dir():
            for f in V2.iterdir():
                f.unlink()
        html = armar(v2=True)
        (destino / 'index.html').write_text(html, encoding='utf-8', newline='\n')
        fotos = sum(f.stat().st_size for f in V2.iterdir())
        print(f'OK: public/v2/index.html armado ({len(html.encode("utf-8")) / 1e6:.2f} MB, más {fotos / 1e6:.2f} MB de fotos aparte).')
        sys.exit()
    html = armar()
    SALIDA.write_text(html, encoding='utf-8', newline='\n')
    print(f'OK: {SALIDA.name} armado ({len(html.encode("utf-8")) / 1e6:.2f} MB). Abrilo con doble clic para probarlo.')
