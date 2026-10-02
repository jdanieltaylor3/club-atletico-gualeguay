#!/usr/bin/env python3
"""Genera las siluetas monocromas de los iconos de redes.

Por que: los logos de origem son a color (degradado de Instagram, azul de
Facebook, verde de WhatsApp) y pesan 232 KB para tres glifos de 24 px. En un
cartel navy y amarillo sobran tres colores ajenos. Aqui se saca la SILUETA de
cada glifo (una sola figura) en blanco sobre transparente, y el color lo pone
el CSS con mask-image, igual que la costura y la cinta del hero.

De donde sale cada silueta:
  facebook   el "f" es un agujero (transparente) dentro del circulo azul, asi
             que se toma lo que NO es azul y esta dentro del circulo.
  whatsapp   el auricular quedo tambien como agujero cuando se le saco el
             blanco al archivo de origen: se toma lo que NO es verde y esta
             dentro del circulo.
  instagram  el archivo de origen NO tiene la camara dibujada (es un marco
             blanco con un cuadrado de degradado), asi que se dibuja con
             primitivas: cuadrado redondeado con linea, circulo con linea y
             el puntito. Es el glifo clasico de la camara.

Uso:
    python tools/siluetas-redes.py [--fuente DIR] [--salida DIR] [--lado N] [--red NOMBRE]

    --fuente   logos a color de origen (por defecto recursos/iconos-redes)
    --salida   donde guardar los PNG (por defecto assets/img/iconos)
    --lado     lado del PNG (por defecto 96: el icono se ve a 24 px, o sea 4x)
    --red      solo una red (instagram, facebook, whatsapp)

Los logos a color originales van en recursos/iconos-redes/ (carpeta que no se
versiona, como el resto del material de trabajo): los tres PNG que usa el
sitio son las siluetas que genera este script, con el mismo nombre de archivo,
asi que data/sitio.json no cambia. Sin esos originales el script no se puede
volver a correr, pero estan en el historial:
    git show 7d18408:assets/img/iconos/instagram.png > recursos/iconos-redes/instagram.png

Nota para este equipo: la proteccion de Windows (Control de acceso a carpetas /
OneDrive) no deja que python.exe escriba en la carpeta Documents. Si el guardado
falla, generar en una carpeta temporal y copiar los PNG encima.
Requiere Pillow:  python -m pip install pillow
"""
import argparse
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw

# Tolerancia para clasificar un pixel como "del color de la marca".
TOLERANCIA = 60
# Cuanto se mete el circulo hacia adentro para no agarrar el borde del logo.
MARGEN_DISCO = 0.02
# Proporciones del glifo de la camara (fracciones del lado del lienzo).
CAMARA = {
    # x0, y0, x1, y1 del cuadrado redondeado y radio de la esquina
    "cuadrado": (0.08, 0.08, 0.92, 0.92, 0.28),
    "grosor": 0.075,                       # grosor de las lineas
    "circulo": (0.50, 0.50, 0.195),        # centro x, centro y, radio
    "punto": (0.715, 0.285, 0.055),        # centro x, centro y, radio
}
SUPER = 4  # se dibuja 4x mas grande y se reduce: bordes suaves


def es_de_la_marca(r, g, b, objetivo, tolerancia=TOLERANCIA):
    return abs(r - objetivo[0]) <= tolerancia and abs(g - objetivo[1]) <= tolerancia \
        and abs(b - objetivo[2]) <= tolerancia


def circulo_desde(mascara: Image.Image) -> Image.Image:
    """Aproximacion del disco del logo: el cuadrado que envuelve la mascara.

    Los tres logos son un circulo (WhatsApp y Facebook) o un cuadrado con
    esquinas redondeadas (Instagram) llenando el archivo, asi que el disco se
    aproxima con la caja de los pixeles del color de la marca, metida un poco
    hacia adentro para no incluir el borde del logo.
    """
    w, h = mascara.size
    caja = mascara.getbbox()
    if caja is None:
        raise ValueError("no se encuentra el color de la marca")
    x0, y0, x1, y1 = caja
    m = int(max(x1 - x0, y1 - y0) * MARGEN_DISCO)
    lado = max(x1 - x0, y1 - y0) - 2 * m
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    disco = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(disco)
    d.ellipse(
        [cx - lado / 2 - lado * 0.02, cy - lado / 2 - lado * 0.02,
         cx + lado / 2 + lado * 0.02, cy + lado / 2 + lado * 0.02],
        fill=255,
    )
    return disco


def limpiar(mascara: Image.Image, area_minima: float = 0.004) -> Image.Image:
    """Deja solo el componente mas grande y tapa los huequitos sueltos.

    Asi se va el ruido del JPEG y los pedacitos del cuadriculado de fondo que
    quedo grabado en los archivos de origen.
    """
    w, h = mascara.size
    px = mascara.load()
    vistos = set()
    componentes = []
    for y0 in range(h):
        for x0 in range(w):
            if px[x0, y0] == 0 or (x0, y0) in vistos:
                continue
            cola = deque([(x0, y0)])
            vistos.add((x0, y0))
            puntos = []
            while cola:
                x, y = cola.popleft()
                puntos.append((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < w and 0 <= yy < h and px[xx, yy] and (xx, yy) not in vistos:
                        vistos.add((xx, yy))
                        cola.append((xx, yy))
            componentes.append(puntos)
    if not componentes:
        return mascara
    grande = max(componentes, key=len)
    limpio = Image.new("L", (w, h), 0)
    cp = limpio.load()
    for x, y in grande:
        cp[x, y] = 255
    # tapa huecos: cualquier pixel transparente rodeado de glifo se rellena
    relleno = Image.new("L", (w, h), 0)
    rd = ImageDraw.Draw(relleno)
    for x, y in grande:
        rd.point((x, y), fill=255)
    from PIL import ImageFilter
    relleno = relleno.filter(ImageFilter.MaxFilter(3))
    lp = limpio.load()
    rp = relleno.load()
    for y in range(h):
        for x in range(w):
            if lp[x, y] == 0 and rp[x, y]:
                lp[x, y] = 255
    return limpio


def silueta_facebook(origen: Path) -> Image.Image:
    """El "f": lo que no es azul y esta dentro del circulo azul."""
    img = Image.open(origen).convert("RGBA")
    w, h = img.size
    px = img.load()
    azul = (65, 103, 178)
    marca = Image.new("L", (w, h), 0)
    mp = marca.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 40 and es_de_la_marca(r, g, b, azul, 70):
                mp[x, y] = 255
    disco = circulo_desde(marca)
    glifo = Image.new("L", (w, h), 0)
    gp = glifo.load()
    dp = disco.load()
    for y in range(h):
        for x in range(w):
            if not dp[x, y]:
                continue
            r, g, b, a = px[x, y]
            dentro_del_azul = es_de_la_marca(r, g, b, azul, 70) and a > 40
            # el "f" es el agujero: transparente, o blanco (resto del JPEG)
            if dentro_del_azul:
                continue
            if a < 128 or min(r, g, b) >= 150:
                gp[x, y] = 255
    return limpiar(glifo)


def silueta_whatsapp(origen: Path) -> Image.Image:
    """El auricular: lo que NO es verde y esta dentro del circulo verde.

    Igual que el "f" de Facebook, el auricular quedo como agujero al quitarle
    el blanco al archivo de origen, asi que se toma lo transparente o claro
    que hay dentro del disco de la marca.
    """
    img = Image.open(origen).convert("RGBA")
    w, h = img.size
    px = img.load()
    verde = (64, 195, 81)
    marca = Image.new("L", (w, h), 0)
    mp = marca.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 40 and es_de_la_marca(r, g, b, verde, 60):
                mp[x, y] = 255
    disco = circulo_desde(marca)
    glifo = Image.new("L", (w, h), 0)
    gp = glifo.load()
    dp = disco.load()
    for y in range(h):
        for x in range(w):
            if not dp[x, y]:
                continue
            r, g, b, a = px[x, y]
            if a > 40 and es_de_la_marca(r, g, b, verde, 60):
                continue
            if a < 128 or min(r, g, b) >= 150:
                gp[x, y] = 255
    return limpiar(glifo)


def silueta_instagram(lado: int) -> Image.Image:
    """La camara clasica, dibujada con primitivas (el origen no la tiene)."""
    s = lado * SUPER
    glifo = Image.new("L", (s, s), 0)
    d = ImageDraw.Draw(glifo)
    x0, y0, x1, y1, radio = CAMARA["cuadrado"]
    grosor = CAMARA["grosor"]
    d.rounded_rectangle(
        [x0 * s, y0 * s, x1 * s, y1 * s],
        radius=radio * s,
        outline=255,
        width=max(1, round(grosor * s)),
    )
    ccx, ccy, cr = CAMARA["circulo"]
    d.ellipse(
        [(ccx - cr) * s, (ccy - cr) * s, (ccx + cr) * s, (ccy + cr) * s],
        outline=255,
        width=max(1, round(grosor * s)),
    )
    px_, py_, pr = CAMARA["punto"]
    d.ellipse(
        [(px_ - pr) * s, (py_ - pr) * s, (px_ + pr) * s, (py_ + pr) * s],
        fill=255,
    )
    return glifo.resize((lado, lado), Image.LANCZOS)


def normalizar(glifo: Image.Image, lado: int, aire: float = 0.10) -> Image.Image:
    """Recorta al dibujo, lo centra y lo deja con aire dentro de un cuadrado.

    El aire se mide sobre la dimension mayor: asi los tres glifos pesan lo
    mismo a la vista, que es lo que pasa con object-fit: contain.
    """
    caja = glifo.getbbox()
    if caja is None:
        raise ValueError("la silueta salio vacia")
    x0, y0, x1, y1 = caja
    dibujo = glifo.crop(caja)
    destino = max(1, round(lado * (1 - 2 * aire)))
    escala = destino / max(dibujo.size)
    nuevo = (max(1, round(dibujo.width * escala)), max(1, round(dibujo.height * escala)))
    dibujo = dibujo.resize(nuevo, Image.LANCZOS)
    lienzo = Image.new("L", (lado, lado), 0)
    # Ojo: se pega la MASCARA, no el RGBA. Pegar el RGBA dentro de un lienzo
    # "L" tira el canal alfa y deja el glifo macizo.
    lienzo.paste(dibujo, ((lado - nuevo[0]) // 2, (lado - nuevo[1]) // 2))
    return lienzo


def dibujar(mascara: Image.Image) -> Image.Image:
    """Convierte la mascara en un PNG: glifo blanco sobre transparente."""
    rgba = Image.new("RGBA", mascara.size, (255, 255, 255, 0))
    rgba.putalpha(mascara)
    return rgba


def procesar(red: str, origen: Path, destino: Path, lado: int) -> dict:
    if red == "instagram":
        glifo = silueta_instagram(lado * SUPER)
    elif red == "facebook":
        glifo = silueta_facebook(origen)
    else:
        glifo = silueta_whatsapp(origen)
    final = normalizar(glifo, lado)
    dibujar(final).save(destino, "PNG", optimize=True)
    area = sum(1 for p in final.getdata() if p > 128) / (lado * lado)
    caja = final.getbbox()
    return {
        "red": red,
        "salida": str(destino),
        "caja": str(caja),
        "dibujado": f"{caja[2]-caja[0]}x{caja[3]-caja[1]} de {lado}",
        "area": f"{100*area:.1f}%",
        "kb": round(destino.stat().st_size / 1024, 1),
    }


def principal(argv: list | None = None) -> int:
    raiz = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(
        description="Genera las siluetas monocromas de los iconos de redes."
    )
    parser.add_argument("--fuente", type=Path, default=None,
                        help="Carpeta con los logos a color (por defecto recursos/iconos-redes).")
    parser.add_argument("--salida", type=Path, default=None,
                        help="Directorio de salida (por defecto assets/img/iconos).")
    parser.add_argument("--lado", type=int, default=96,
                        help="Lado del PNG en px (por defecto 96 para un icono de 24).")
    parser.add_argument("--red", choices=["instagram", "facebook", "whatsapp"], default=None,
                        help="Generar solo una red.")
    args = parser.parse_args(argv)

    fuente = args.fuente if args.fuente else raiz / "recursos" / "iconos-redes"
    salida = args.salida if args.salida else raiz / "assets" / "img" / "iconos"
    salida.mkdir(parents=True, exist_ok=True)
    redes = [args.red] if args.red else ["instagram", "facebook", "whatsapp"]
    print(f"Fuente: {fuente}\nSalida: {salida}   lado: {args.lado} px")
    ok = True
    for red in redes:
        origen = fuente / f"{red}.png"
        destino = salida / f"{red}.png"
        if red != "instagram" and not origen.exists():
            print(f"  ERROR {red}: no esta el logo a color {origen}\n"
                  "  Se recupera del historial:\n"
                  f'    git show 7d18408:assets/img/iconos/{red}.png > "{origen}"',
                  file=sys.stderr)
            ok = False
            continue
        try:
            info = procesar(red, origen, destino, args.lado)
        except Exception as exc:
            print(f"  ERROR {red}: {exc}", file=sys.stderr)
            ok = False
            continue
        print(
            "  OK {red} -> {salida}  dibujado {dibujado}  ocupa {area} del cuadro  "
            "{kb} KB".format(**info)
        )
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(principal())
