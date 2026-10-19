"""Arma app/web-yacar.html (un solo archivo, se abre con doble clic) a partir de app/src/.

Uso:   python build.py          (desde app/, o con la ruta completa desde cualquier lado)

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
Las marcas de json y foto son JavaScript válido, así que los .js de src/ se pueden revisar con un editor normal.
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


def foto(nombre):
    ruta = SRC / 'fotos' / nombre
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


def armar():
    html = re.sub(r'^@@incluir:([^@\n]+)@@\n', incluir, leer(SRC / 'base.html'), flags=re.M)
    for nombre in re.findall(r'/\*@json:([^*]+)\*/null', html):
        falta('json', nombre, 'datos')
    for nombre in re.findall(r'/\*@foto:([^*]+)\*/""', html):
        falta('foto', nombre, 'fotos')
    html = re.sub(r'/\*@json:([^*]+)\*/null', lambda m: json_compacto(m[1]), html)
    html = re.sub(r'/\*@foto:([^*]+)\*/""', lambda m: foto(m[1]), html)
    resto = re.findall(r'@@incluir:[^@\n]*@@|/\*@(?:json|foto):[^*]*\*/', html)
    if resto:
        sys.exit(f'ERROR: quedaron marcas sin reemplazar: {resto[:5]}')
    return html


if __name__ == '__main__':
    html = armar()
    SALIDA.write_text(html, encoding='utf-8', newline='\n')
    print(f'OK: {SALIDA.name} armado ({len(html.encode("utf-8")) / 1e6:.2f} MB). Abrilo con doble clic para probarlo.')
