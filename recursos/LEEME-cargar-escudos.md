# Cargar materiales del club

Carpeta de entrada para los materiales que el club entrega. Los que ya se integraron al sitio figuran abajo con el ✅; no hace falta repetirlos.

## Estado actual

| Material | Estado | Dónde quedó |
|---|---|---|
| Escudo del club (`escudo-cag-f7.jpg`) | ✅ Integrado | `assets/img/escudo-club.jpg` |
| Colores oficiales (azul #0226A6 + amarillo #FDFE03, tema oscuro) | ✅ Aplicados | `assets/css/tokens.css` (paleta) y `data/sitio.json` |
| Escudos de equipos | ✅ Copiados a `assets/img/equipos/` pero ⏳ **son PNG de ejemplo**, todavía no los reales | `assets/img/equipos/eq-*.png`; falta el mapeo equipo → escudo real en `data/torneos/*.json` (campo `"escudo"`) |
| Iconos de redes (Instagram, Facebook, WhatsApp) | ✅ Integrados | `assets/img/iconos/` (ya reemplazan las siglas IG/FB/WA en el encabezado y el pie) |
| Fotos para noticias | ⏳ No hay todavía | — |
| Fixtures del año pasado (paleta) | ✅ Usados solo como referencia de color | Se descartaron de `recursos/` |

## Para entregar algo nuevo (ej. fotos de noticias)

1. Dejá los archivos en una carpeta de acá (por ejemplo `recursos/fotos/`).
2. Avisame en el chat y yo los integro a `assets/img/`, actualizo los JSON y regenero el build.

Uno por uno, por favor: avisá **qué archivo corresponde a qué equipo** (o noticia) junto con la carpeta.