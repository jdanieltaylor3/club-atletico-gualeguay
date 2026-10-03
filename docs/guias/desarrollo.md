# Guía de desarrollo

Cómo está armado el sitio, por qué y cómo agregarle contenido sin romper nada.

## Arquitectura en una frase

Un generador Node sin dependencias que lee `data/*.json`, los rellena en `templates/*.html` y escribe `dist/`. El navegador no recibe JSON: recibe HTML ya armado. La lógica de dominio (tarjetas, escudos, estados, zonas) vive en módulos ES **compartidos** entre el build y el navegador, en `lib/`.

```
data/*.json  ──►  build.js (orquestador)  ──►  dist/  (HTML + CSS + JS + assets)
                      │
lib/*.js ◄────────────┤  (módulos de dominio puros)
   └─► copiados a dist/assets/js/lib/  para que el navegador reúse la misma lógica
templates/*.html ──►  relleno por lib/layout.js
assets/* ──►  se copian tal cual, sin proceso
```

Regla de oro: **el HTML de las tarjetas de partido, escudos, badges de estado, zonas y tablas se genera una sola vez** en `lib/render.js` (junto con el build) y `assets/js/vistas-torneo.js` la reúsa en el navegador para las vistas dinámicas. Si tocás una tarjeta, cambiás la misma pieza en los dos lados.

## Estructura

| Ruta | Qué es |
|---|---|
| `build.js` | Orquestador delgado: lee los JSON, llama a las funciones `generarX()` y escribe `dist/`. Cada función es una sección del sitio. |
| `data/sitio.json` | Identidad, redes, contacto y `edicionVigente` por categoría. |
| `data/noticias.json` | Noticias. Párrafos del contenido separados por línea en blanco. |
| `data/torneos/<categoria>-<edicion>.json` | Un torneo por archivo: equipos, rondas y goleadores. |
| `templates/` | Páginas con marcadores `<!-- MARCADOR -->`. `partials/` son el layout común (head, header, footer, scripts). |
| `lib/` | Lógica pura, sin importar `fs` (salvo `utils` y `layout`). Se testea con `node --test`. |
| `assets/` | CSS (capas) y JS del navegador. Se copian tal cual a `dist/assets/`. |
| `recursos/` | Bandera de entrada para materiales que el club entrega (ver su LEEME). No entra al build. |
| `test/` | Tests con `node:test` y `node:assert` (sin dependencias). |
| `dist/` | Salida del build. Ignorada por git y regenerada en cada build. |

## Propósito de cada módulo

### `lib/` (puros, compartidos por build y navegador)

| Módulo | Armado | Responsabilidad |
|---|---|---|
| `texto.js` | build + navegador | `escapeHtml`, `slugify`, `formatFecha` (ISO → texto en español). |
| `rutas.js` | build + navegador | Rutas relativas: slug de edición, ruta de la página de una edición, `assetsRoot` (cuánto subir según la profundidad de la página), `rutaAsset`. Todo el sitio funciona desde cualquier subcarpeta de GitHub/Cloudflare Pages. |
| `torneo-modelo.js` | build + navegador | Reglas de negocio: `ladoGanador` (qué lado ganó un partido), `chancesEquipo` (las 2 chances del arranque; la zona Perdedores elimina), `estadoEquipo` (ganadores/perdedores/eliminado) y `mostrarEstado`. |
| `data.js` | build + navegador | Consultas sobre los JSON: `mapaEquipos`, `rondasAgrupadas` (zonas en orden canónico `iniciales → ganadores → perdedores`, descartando zonas sin partidos), `proximosPartidos`, `recientesPartidos`, `goleadoresOrdenados`, `edicionesDe`, `categorias`, `nombreCategoria`. |
| `render.js` | build + navegador | HTML de las piezas: `iniciales`, `escudoHtml`, `badgeEstado`, `badge`, `tarjetaPartido` (con opts `formatearFecha` y `omitirSiPaseLibre`), `tarjetaEquipo`, `tablaGoleadores`, `estadoHTML`, `zonaHTML`. **Una sola fuente de verdad para el markup.** |
| `utils.js` | solo build | E/S de archivos: `leerJSON`, `leerTexto`, `escribirArchivo`, `existe`. |
| `layout.js` | solo build | `assemble` (une página + partials y resuelve `ASSETS_ROOT` en todo el HTML), `renderRedes`, `parsearPlantilla`. |

Los 5 módulos puros (`texto`, `rutas`, `data`, `torneo-modelo`, `render`) los copia `build.js` a `dist/assets/js/lib/` para que el navegador los importe (`MODULOS_COMPARTIDOS`).

### `assets/js/` (navegador)

| Archivo | Responsabilidad |
|---|---|
| `main.js` | Menú móvil, enlaces sociales, detalles globales. |
| `torneo.js` | Controlador de la página de edición: trae el JSON (`data-torneo-src` del DOM), arma las tabs (Edición/Equipos/Fixture/Goleadores), el estado y la navegación de rondas. |
| `vistas-torneo.js` | Vistas puras: reciben los datos y devuelven HTML usando `lib/` copiado. No tocan el DOM directamente. |
| `lib/` | Copia del build; los mismos módulos de dominio del generador. |

### `assets/css/` (capas)

| Archivo | Qué contiene |
|---|---|
| `tokens.css` | Únicamente variables: paleta del club, escalas de tipografía y espaciado, forma, anchos, movimiento. Para cambiar el tema, se toca este archivo y nada más. |
| `base.css` | Reset, tipografía y elementos globales. |
| `layout.css` | Estructura: header, navegación, hero, grillas, footer y sus media queries. |
| `components.css` | Piezas repetidas: botones, badges, tarjetas, tabs, tablas, zonas, noticias. |
| `styles.css` | Punto único de `@import` en ese orden (token → base → layout → componentes). |

Los breakpoints (768 / 900 / 1024 px) se usan a mano porque las media queries no admiten variables; están documentados en `tokens.css`.

### Tipografía

Dos familias, con un reparto explícito:

- **Oswald** (`--font-display`): la identidad de cartel del club. Títulos, navegación, botones del índice de torneos y etiquetas en mayúsculas.
- **Archivo** (`--font-text-moderna`): el texto corrido de las páginas interiores (torneos, noticias, instalaciones y contacto). La home mantiene la letra de sistema (`--font-text`); el cuerpo de una nota (`.nota-cuerpo`) también, para que la lectura larga no se agrande.

El `<body>` lleva `data-pagina` con la sección activa (lo completa `assemble`, ver `lib/layout.js`). La regla de `base.css` pasa `.site-main` a Archivo salvo en `data-pagina="inicio"`, así la home queda intacta sin duplicar plantillas. Las dos familias se cargan desde Google Fonts en `_head.html`.

## Cómo ejecutar y probar

Requisito: Node.js ≥ 18 (local se usa cualquier versión actual).

```bash
node build.js     # genera dist/
node --test       # corre los tests (descubrimiento por defecto; node --test test/ falla en Windows)
```

Para ver el sitio siempre **por HTTP** (nunca por `file://`):

```bash
npx serve dist    # o cualquier servidor estático: python -m http.server dist, etc.
```

El build falla fuerte si una plantilla tiene un marcador sin rellenar (`rellenar()` lanza error), así un marcador mal escrito no llega a producción en silencio.

## Cómo agregar contenido

### Una noticia

En `data/noticias.json`, copiar un bloque y ajustar:

```json
{
  "id": 3,
  "titulo": "El título de la noticia",
  "fecha": "2026-10-01",
  "resumen": "Una línea para la portada.",
  "categoria": "torneo",
  "imagen": "assets/img/foto.jpg",
  "contenido": "Primer párrafo.\n\nSegundo párrafo."
}
```

- `id` único y creciente.
- `contenido`: cada párrafo separado por una línea en blanco.
- La imagen va en `assets/img/` (o cualquier ruta del sitio) y se muestra como una banda apaisada arriba de la tarjeta (180 px de alto, recortada con `cover`). **Sin `imagen`, la nota muestra la portada por defecto** (`assets/img/trofeo.jpg`, la copa del torneo): en las tarjetas va como una placa vertical al costado del texto y en el detalle como una placa contenida sobre el navy, siempre con `alt` vacío, porque no es una foto de la nota. La foto del trofeo se regenera con `python tools/preparar-trofeo.py` desde `recursos/fotos/trofeo.png`.

Regenerar con `node build.js`. La home y el índice de noticias se actualizan solos.

### Un resultado

En `data/torneos/<categoria>-<edicion>.json`, buscar el partido en `rondas` y ajustar:

```json
{ "id": "r1-p1", "equipoA": "eq-1", "equipoB": "eq-2",
  "estado": "jugado",
  "resultado": { "golesA": 2, "golesB": 1 },
  "penales": null, "fecha": "2026-10-03", "hora": "20:30" }
```

- `estado`: `por jugar` | `jugado` | `pase-libre`.
- `penales`: solo si fue empate y se definió por penales, p. ej. `{ "a": 3, "b": 2 }`. Marca el badge *Pen*. Sin penales: `null`.
- La cancha **no** va en el partido: el club tiene una sola cancha de fútbol 7, así que repetirla en cada tarjeta no agrega nada. Si algún día hacen falta más, el campo se agrega al JSON y a `lineaMeta` en `lib/render.js`.

Regenerar con `node build.js`: la tarjeta, el cuadro y la home se actualizan.

## Cómo cambiar las redes sociales y el contacto

Todo vive en `data/sitio.json` (un solo lugar, igual que las noticias):

```json
"redes": [
  { "nombre": "Instagram", "url": "https://www.instagram.com/...", "icono": "assets/img/iconos/instagram.png" },
  ...
],
"contacto": { "email": "...", "telefono": "...", "direccion": "..." }
```

- La silueta de cada red se muestra en el encabezado y el pie (reemplaza las siglas IG/FB/WA originales). `icono` es la ruta al PNG dentro del sitio; para cambiar una silueta, reemplazás el archivo en `assets/img/iconos/` o apuntás `icono` a otro archivo.
- Los PNG son **blancos sobre transparente** y el color no lo tiene el archivo: el `<span class="social-icon">` pinta su fondo con `--color-primario` y usa el PNG como máscara (`mask-image`). Por eso un mismo archivo sirve para cualquier color y no hay que regenerar nada al cambiar el color de las redes.
- Para regenerar las siluetas desde los logos oficiales a color: `python tools/siluetas-redes.py` (requiere Pillow). Los logos a color de origen van en `recursos/iconos-redes/` (no se versiona) y el script escribe en `assets/img/iconos/` con el mismo nombre, así que `data/sitio.json` no cambia. Se recuperan del historial con `git show 7d18408:assets/img/iconos/<red>.png`.
- El escudo del club también se procesa con script, pero **no** con un simple "sacar el blanco": `python tools/quitar-fondo-escudo.py` saca solo el fondo de la foto (el blanco que toca el borde) para que las letras blancas de adentro queden opacas. Si se borra todo lo blanco por umbral, el escudo queda perforado.
- La página de Contacto se arma con el bloque `contacto` del mismo JSON. Para ocultar un dato (ej. un teléfono que todavía no hay), el valor es `"-----"`.
- Regenerar con `node build.js`.

## Cómo agregar un torneo

El índice de Torneos (`torneos/index.html`) se genera solo: cada edición es un botón grande (`botonEdicion` en `build.js`) con el nombre de su categoría y su edición, y toda la pieza es el enlace. Agregar una categoría o una edición nueva no requiere tocar el índice.

### Una edición nueva (misma categoría)

1. Copiar el JSON anterior a `data/torneos/<categoria>-<edicion-nueva>.json` y ajustar `id`, `nombre`, `edicion` (p. ej. `"27/28"`), `temporada` y los equipos/rondas.
2. Marcar la edición anterior como `"estado": "archivo"` para que deje de ser la vigente.
3. En `data/sitio.json`, actualizar `edicionVigente.<categoria>` al mismo `edicion` (p. ej. `"27/28"`).
4. `node build.js` → aparece en el selector de ediciones y en Torneos.

### Una categoría nueva (p. ej. Femenino)

1. Crear `data/torneos/femenino-26-27.json` con la misma forma que el resto. La categoría sale del campo `"nombre"` del propio JSON (el build no tiene una tabla de categorías: `categorias()` y `nombreCategoria()` iteran lo que existe).
2. En `data/sitio.json`, agregar la categoría a `edicionVigente`, p. ej. `"femenino": "26/27"`.
3. `node build.js` → la home, el índice de torneos y el selector la toman sola. **No hay que tocar código.**

### La regla de ganadores, perdedores y eliminados (por qué el cuadro funciona como funciona)

- Ronda 1 (zona Iniciales): cada equipo arranca con **2 chances**. Pierde una con cada derrota; si pierde las dos, queda eliminado.
- Zona Ganadores: el que gana **avanza**; el que pierde **baja a Perdedores** (no se elimina).
- Zona Perdedores: una derrota más y quedás eliminado (0 chances).
- El estado visible sale de esas chances: **GAN.** (2, en ganadores), **PER.** (1, en perdedores) y **ELIM.** (0).

Todo eso vive en `lib/torneo-modelo.js` (`chancesEquipo`, `estadoEquipo`, `ladoGanador`) y se reúsa tal cual en el navegador. Cambiás la regla ahí y los tests (`test/torneo-modelo.test.js`) la protegen en el build y en la página.

## Cómo agregar escudos reales

1. Los escudos van en `assets/img/equipos/` (PNG o SVG) y el build los copia tal cual.
2. Entregar las imágenes reales (ver `recursos/LEEME-cargar-escudos.md`) con el mapeo **equipo → archivo**.
3. Copiarlas a `assets/img/equipos/` y ajustar el campo `"escudo"` de cada equipo en `data/torneos/*.json`.
4. Si un equipo no tiene `"escudo"`, se muestra un círculo con sus iniciales (`equipo-escudo.fallback`) — no rompe nada.