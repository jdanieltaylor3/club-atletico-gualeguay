#!/usr/bin/env python3
"""Prepara la foto del trofeo para usarla como portada por defecto.

Por que: recursos/fotos/trofeo.png es una foto (186x504, 162 KB en PNG) que se
usa como portada de las noticias que todavia no tienen imagen propia. El PNG
pesa 162 KB por el ruido de una foto; el mismo cuadro en JPEG progresivo pesa
24 KB y a la vista no se nota, que es el mismo trato que ya tienen las otras
fotos del sitio (arcos.jpg, banco-suplentes.jpg).

No recorta ni cambia la medida: la foto ya viene del tamanio justo para
mostrarse a 1:1. Tampoco le saca el fondo: el fondo de la foto es negro casi
puro (0,0,0 a (9,9,9) de luminancia) y la banda donde se muestra usa el navy
mas oscuro del tema (#040819, luminancia 9), asi que el borde de la foto se
funde solo y no hace falta recortar nada.

Uso:
    python tools/preparar-trofeo.py [--fuente ARCHIVO] [--salida ARCHIVO]
                                    [--calidad N] [--ancho N]

    --fuente    foto de origen (por defecto recursos/fotos/trofeo.png)
    --salida    JPEG de destino (por defecto assets/img/trofeo.jpg)
    --calidad   calidad del JPEG (por defecto 88)
    --ancho     ancho de salida en px; sin esto queda la medida original

El original vive en recursos/fotos/ (carpeta que no se versiona, como el resto
del material de trabajo). Sin el, el script no se puede volver a correr.

Nota para este equipo: la proteccion de Windows (Control de acceso a carpetas /
OneDrive) no deja que python.exe escriba en la carpeta Documents. Si el guardado
falla, generar en una carpeta temporal y copiar el JPEG encima.
Requiere Pillow:  python -m pip install pillow
"""

import argparse
import sys
from pathlib import Path

from PIL import Image


def luminancia(pixel) -> float:
    return (pixel[0] * 299 + pixel[1] * 587 + pixel[2] * 114) / 1000


def medir_fondo(img: Image.Image) -> dict:
    """Mide el fondo (los cuatro bordes) para avisar si dejo de ser oscuro.

    Es la unica condicion que hace falta para que la foto se funda con la
    banda navy: si el fondo se aclara, el rectangulo de la foto se va a ver.
    """
    w, h = img.size
    px = img.load()
    muestras = []
    for x in range(0, w, max(1, w // 24)):
        muestras.append(px[x, 0])
        muestras.append(px[x, h - 1])
    for y in range(0, h, max(1, h // 24)):
        muestras.append(px[0, y])
        muestras.append(px[w - 1, y])
    vals = [luminancia(p) for p in muestras]
    return {
        "borde_lum": sum(vals) / len(vals),
        "borde_max": max(vals),
    }


def procesar(origen: Path, destino: Path, calidad: int, ancho: int | None) -> dict:
    img = Image.open(origen).convert("RGB")
    original = img.size
    if ancho and ancho != img.width:
        alto = max(1, round(img.height * ancho / img.width))
        img = img.resize((ancho, alto), Image.LANCZOS)
    destino.parent.mkdir(parents=True, exist_ok=True)
    img.save(destino, "JPEG", quality=calidad, optimize=True, progressive=True)
    fondo = medir_fondo(img)
    return {
        "original": f"{original[0]}x{original[1]}",
        "salida": f"{img.width}x{img.height}",
        "kb": round(destino.stat().st_size / 1024, 1),
        "origen_kb": round(origen.stat().st_size / 1024, 1),
        **fondo,
    }


def principal(argv: list | None = None) -> int:
    raiz = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(
        description="Convierte la foto del trofeo en el JPEG que usa el sitio."
    )
    parser.add_argument("--fuente", type=Path, default=None,
                        help="Foto de origen (por defecto recursos/fotos/trofeo.png).")
    parser.add_argument("--salida", type=Path, default=None,
                        help="JPEG de destino (por defecto assets/img/trofeo.jpg).")
    parser.add_argument("--calidad", type=int, default=88,
                        help="Calidad del JPEG (por defecto 88).")
    parser.add_argument("--ancho", type=int, default=None,
                        help="Ancho de salida en px (por defecto la medida original).")
    args = parser.parse_args(argv)

    fuente = args.fuente if args.fuente else raiz / "recursos" / "fotos" / "trofeo.png"
    salida = args.salida if args.salida else raiz / "assets" / "img" / "trofeo.jpg"
    if not fuente.exists():
        print(f"ERROR: no esta la foto de origen {fuente}", file=sys.stderr)
        return 1
    try:
        info = procesar(fuente, salida, args.calidad, args.ancho)
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    print(
        "OK {original} -> {salida}  {origen_kb} KB -> {kb} KB  "
        "fondo: lum media {borde_lum:.1f}, max {borde_max:.0f}".format(**info)
    )
    if info["borde_lum"] > 24:
        print("  AVISO: el fondo ya no es oscuro; la foto se va a ver como un "
              "rectangulo sobre la banda navy.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(principal())
