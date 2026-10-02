#!/usr/bin/env python3
"""Quita el fondo blanco del escudo del club SIN comerse las letras blancas.

Por que existe: el escudo tiene letras blancas sobre fondo navy. Si se borra
"todo lo blanco" por umbral (como hace tools/procesar-iconos-redes.py), las
letras tambien se borran: quedan transparentes y el escudo aparece perforado
(asi quedo la version del 28/09/2026, con 29.715 agujeros en el medio).

Este script borra unicamente el blanco que esta CONECTADO CON EL BORDE de la
imagen, que es el fondo de la foto. El blanco de adentro (las letras) no llega
al borde, asi que queda opaco.

Uso:
    python tools/quitar-fondo-escudo.py [--fuente RUTA] [--salida RUTA] [--lado N]

    --fuente   JPG original (por defecto recursos/escudo/escudo-original.jpg)
    --salida   PNG de salida (por defecto assets/img/escudo-club.png)
    --lado     lado del PNG final en px (por defecto 512; en pantalla el escudo
               mide hasta 110 px, asi que 512 es de sobra)

Si no esta el JPG original, se recupera del historial:
    git show 0d41c1d:assets/img/escudo-club.jpg > recursos/escudo/escudo-original.jpg

Nota para este equipo: la proteccion de Windows (Control de acceso a carpetas /
OneDrive) no deja que python.exe escriba en la carpeta Documents. Si el guardado
falla, generar en una carpeta temporal y copiar:
    python tools/quitar-fondo-escudo.py --salida "%TEMP%\\escudo.png"
    copy "%TEMP%\\escudo.png" assets\\img\\escudo-club.png

Requiere Pillow:  python -m pip install pillow
"""
import argparse
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

# Un pixel es "blanco" si sus tres canales superan esto. El fondo de la foto es
# un gris claro (240) y las letras son blanco puro (255): los dos quedan arriba.
UMBRAL_BLANCO = 228
# Fin del borde suave: desde UMBRAL_BLANCO (opaco) hasta 255 (transparente).
FINO = 255
# Aire transparente que se deja alrededor del escudo, como fraccion del lado.
MARGEN = 0.008
# Lado de la ventana para buscar el color opaco vecino al borde (anti-halo).
VENTANA = 5


def alcanzables(blancos: Image.Image) -> Image.Image:
    """Marca 255 en el blanco que se puede llegar desde el borde, 0 en el resto.

    Se hace dilatando: desde los pixeles blancos del borde, en cada vuelta se
    suma un anillo de un pixel y se vuelve a intersectar con "lo blanco". Asi
    solo entra el blanco conectado con el borde (el fondo de la foto) y el
    blanco encerrado (las letras del escudo) nunca se alcanza.
    """
    w, h = blancos.size
    alcanzado = Image.new("L", (w, h), 0)
    ap = alcanzado.load()
    bp = blancos.load()
    for x in range(w):
        for y in (0, h - 1):
            if bp[x, y]:
                ap[x, y] = 255
    for y in range(h):
        for x in (0, w - 1):
            if bp[x, y]:
                ap[x, y] = 255
    mascara_no_blanco = Image.eval(blancos, lambda p: 0 if p else 255)
    vueltas = 0
    while True:
        siguiente = alcanzado.filter(ImageFilter.MaxFilter(3))
        siguiente.paste(0, (0, 0, w, h), mascara_no_blanco)
        if siguiente.tobytes() == alcanzado.tobytes():
            return alcanzado
        alcanzado = siguiente
        vueltas += 1
        if vueltas > w + h:
            raise RuntimeError("la inundacion no converge: revisar UMBRAL_BLANCO")


def color_opaco_para_el_borde(rgba: Image.Image, alpha: Image.Image) -> Image.Image:
    """Cambia el color de los pixeles del borde suave por el del escudo al lado.

    Si no, el pixel semitransparente conserva el blanco del fondo y al
    superponerlo sobre el navy del sitio queda un halo claro.
    """
    w, h = rgba.size
    px = rgba.load()
    ap = alpha.load()
    radio = VENTANA // 2
    for y in range(h):
        for x in range(w):
            a = ap[x, y]
            if a >= 250 or a == 0:
                continue
            r = g = b = n = 0
            for dy in range(-radio, radio + 1):
                yy = y + dy
                if yy < 0 or yy >= h:
                    continue
                for dx in range(-radio, radio + 1):
                    xx = x + dx
                    if xx < 0 or xx >= w or ap[xx, yy] < 250:
                        continue
                    c = px[xx, yy]
                    r += c[0]
                    g += c[1]
                    b += c[2]
                    n += 1
            if n:
                px[x, y] = (r // n, g // n, b // n, a)
    return rgba


def procesar(fuente: Path, destino: Path, lado: int) -> dict:
    img = Image.open(fuente).convert("RGB")
    w, h = img.size
    px = img.load()

    # 1. Que pixeles son blancos (candidatos a fondo o a letra).
    blancos = Image.new("L", (w, h), 0)
    bp = blancos.load()
    for y in range(h):
        for x in range(w):
            if min(px[x, y]) >= UMBRAL_BLANCO:
                bp[x, y] = 255

    # 2. De esos, cuales son fondo: los que tocan el borde.
    fondo = alcanzables(blancos)

    # 3. Alfa: suave para el fondo, opaco para todo lo demas.
    fp = fondo.load()
    alpha = Image.new("L", (w, h), 255)
    alp = alpha.load()
    for y in range(h):
        for x in range(w):
            if not fp[x, y]:
                continue
            b = min(px[x, y])
            # de UMBRAL_BLANCO (opaco) a 255 (transparente)
            frac = (b - UMBRAL_BLANCO) / (FINO - UMBRAL_BLANCO)
            alp[x, y] = max(0, min(255, int(round(255 * (1 - frac)))))

    # 4. Recorte: caja de lo que quedo opaco, en un cuadrado con aire.
    caja = alpha.point(lambda p: 255 if p > 128 else 0).getbbox()
    if caja is None:
        return {"error": "la imagen quedo toda transparente"}
    x0, y0, x1, y1 = caja
    ancho, alto = x1 - x0, y1 - y0
    lado_escudo = max(ancho, alto)
    margen = max(2, round(lado_escudo * MARGEN))
    lado_caja = lado_escudo + 2 * margen
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    ex0 = max(0, cx - lado_caja // 2)
    ey0 = max(0, cy - lado_caja // 2)
    ex1 = min(w, ex0 + lado_caja)
    ey1 = min(h, ey0 + lado_caja)

    recorte = (ex0, ey0, ex1, ey1)
    rgba = img.crop(recorte).convert("RGBA")
    rgba.putalpha(alpha.crop(recorte))
    rgba = color_opaco_para_el_borde(rgba, alpha.crop(recorte))

    if lado and max(rgba.size) != lado:
        escala = lado / max(rgba.size)
        rgba = rgba.resize(
            (max(1, round(rgba.width * escala)), max(1, round(rgba.height * escala))),
            Image.LANCZOS,
        )

    destino.parent.mkdir(parents=True, exist_ok=True)
    rgba.save(destino, "PNG", optimize=True)

    return {
        "fuente": str(fuente),
        "salida": str(destino),
        "w": rgba.width,
        "h": rgba.height,
        "recorte": f"{ancho}x{alto}",
        "agujeros": contar_agujeros(rgba),
        "kb": round(destino.stat().st_size / 1024),
    }


def contar_agujeros(rgba: Image.Image) -> int:
    """Pixeles transparentes encerrados dentro de la figura (letras perforadas)."""
    m = rgba.getchannel("A").point(lambda p: 0 if p < 128 else 255)
    w, h = m.size
    mp = m.load()
    cola = deque()
    for x in range(w):
        for y in (0, h - 1):
            if mp[x, y] == 0:
                mp[x, y] = 128
                cola.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if mp[x, y] == 0:
                mp[x, y] = 128
                cola.append((x, y))
    while cola:
        x, y = cola.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            xx, yy = x + dx, y + dy
            if 0 <= xx < w and 0 <= yy < h and mp[xx, yy] == 0:
                mp[xx, yy] = 128
                cola.append((xx, yy))
    return sum(1 for y in range(h) for x in range(w) if mp[x, y] == 0)


def principal(argv: list | None = None) -> int:
    raiz = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(
        description="Quita el fondo del escudo del club conservando las letras blancas."
    )
    parser.add_argument(
        "--fuente",
        type=Path,
        default=raiz / "recursos" / "escudo" / "escudo-original.jpg",
        help="Foto original con el fondo blanco (por defecto recursos/escudo/escudo-original.jpg).",
    )
    parser.add_argument(
        "--salida",
        type=Path,
        default=raiz / "assets" / "img" / "escudo-club.png",
        help="PNG de salida (por defecto assets/img/escudo-club.png).",
    )
    parser.add_argument(
        "--lado", type=int, default=512, help="Lado del PNG final en px (0 = sin cambiar)."
    )
    args = parser.parse_args(argv)

    if not args.fuente.exists():
        print(
            "ERROR: no esta el JPG original.\n"
            "  Se recupera del historial:\n"
            "    git show 0d41c1d:assets/img/escudo-club.jpg > "
            f'"{args.fuente}"\n'
            "  o se pasa otro archivo con --fuente RUTA",
            file=sys.stderr,
        )
        return 1

    try:
        info = procesar(args.fuente, args.salida, args.lado)
    except Exception as exc:
        print(f"  ERROR {exc}", file=sys.stderr)
        return 1
    if "error" in info:
        print(f"  ERROR {info['error']}", file=sys.stderr)
        return 1
    estado = "OK" if info["agujeros"] == 0 else "REVISAR"
    print(
        "  {estado} {salida}  {w}x{h} (escudo {recorte})  "
        "agujeros: {agujeros}  {kb} KB".format(estado=estado, **info)
    )
    if info["agujeros"]:
        print(
            "  AVISO: quedaron pixeles transparentes encerrados: pueden ser "
            "letras perforadas o un hueco real del escudo. Mirlos en el sitio.",
            file=sys.stderr,
        )
    return 0


if __name__ == "__main__":
    sys.exit(principal())
