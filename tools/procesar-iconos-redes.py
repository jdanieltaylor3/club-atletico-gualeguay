#!/usr/bin/env python3
"""Recorta el fondo blanco de los logotipos de redes y los guarda como PNG transparentes.

Uso:
    python tools/procesar-iconos-redes.py [--salida DIR]

Para cada assets/img/iconos/<nombre>.jpg genera <nombre>.png:
  - recorta al borde del logotipo (elimina el margen blanco),
  - vuelve transparente el blanco restante con un borde suave,
  - reduce a MAX_LADO (256 px) como máximo: suficiente para el header y el pie.

--salida DIR      directorio donde guardar los PNG (por defecto, junto a los JPEG).

Nota para este equipo: la protección de Windows (Control de acceso a carpetas /
OneDrive) no deja que python.exe escriba en la carpeta Documents. Si el guardado
falla, generar en una carpeta temporal y copiar:

    python tools/procesar-iconos-redes.py --salida "%TEMP%\\iconos"
    copy "%TEMP%\\iconos\\*.png" assets\\img\\iconos\\

Los PNG generados son los que usa el sitio (campo "icono" en data/sitio.json);
los JPEG originales se pueden borrar una vez verificados los resultados.
Requiere Pillow:  python -m pip install pillow
"""
import argparse
import sys
from pathlib import Path

from PIL import Image, ImageChops

UMBRAL_BLANCO = 226  # píxel cuyos tres canales superan esto se considera blanco
MAX_LADO = 256  # lado máximo del PNG de salida


def procesar(origen: Path, destino: Path) -> dict:
    """Recorta y transparenta una imagen; guarda el PNG y devuelve un resumen."""
    img = Image.open(origen).convert("RGB")
    ancho, alto = img.size
    r, g, b = img.split()
    # Canal mínimo por píxel: 255 = blanco puro, menor = color del logotipo.
    minimo = ImageChops.darker(ImageChops.darker(r, g), b)

    # Caja que contiene todo lo que no es blanco (el logotipo).
    no_blanco = minimo.point(lambda p: 255 if p <= UMBRAL_BLANCO else 0)
    caja = no_blanco.getbbox()
    if caja is None:
        return {"archivo": origen.name, "error": "imagen toda blanca, no se recorta"}

    # Transparencia suave: desde UMBRAL_BLANCO hasta el blanco puro el píxel
    # se desvanece de opaco a transparente (quita el borde del JPEG sin halo duro).
    alpha = minimo.point(
        lambda p: 255
        if p <= UMBRAL_BLANCO
        else int(255 * (1 - (p - UMBRAL_BLANCO) / (255 - UMBRAL_BLANCO)))
    ).crop(caja)

    rgba = img.crop(caja).convert("RGBA")
    rgba.putalpha(alpha)

    escala = min(1.0, MAX_LADO / max(rgba.size))
    if escala < 1.0:
        rgba = rgba.resize(
            (max(1, round(rgba.width * escala)), max(1, round(rgba.height * escala))),
            Image.LANCZOS,
        )
    rgba.save(destino, "PNG")
    return {
        "archivo": origen.name,
        "w": rgba.width,
        "h": rgba.height,
        "caja": str(caja),
        "origen": f"{ancho}x{alto}",
    }


def principal(argv: list | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Convierte los logotipos de redes (assets/img/iconos) a PNG transparentes."
    )
    parser.add_argument(
        "--salida",
        metavar="DIR",
        default=None,
        help="Directorio de salida (por defecto, el mismo de los JPEG).",
    )
    args = parser.parse_args(argv)

    raiz = Path(__file__).resolve().parent.parent
    carpeta = raiz / "assets" / "img" / "iconos"
    salida = Path(args.salida) if args.salida else carpeta
    salida.mkdir(parents=True, exist_ok=True)
    print(f"Salida: {salida}")
    ok = True
    for jpg in sorted(carpeta.glob("*.jpg")):
        destino = salida / (jpg.stem + ".png")
        try:
            info = procesar(jpg, destino)
        except Exception as exc:  # reportar y seguir con el resto
            info = {"archivo": jpg.name, "error": str(exc)}
        if "error" in info:
            print("  ERROR {archivo}: {error}".format(**info), file=sys.stderr)
            ok = False
        else:
            print(
                "  OK {archivo} -> {w}x{h} (recorte {caja}, origen {origen})".format(**info)
            )
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(principal())