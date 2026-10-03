# Club Atlético Gualeguay — sitio institucional

Sitio 100% estático (HTML + CSS + JS vanilla) con generador mínimo en Node **sin dependencias** y lógica de dominio compartida entre el build y el navegador (módulos ES puros). Despliegue gratis en GitHub Pages y Cloudflare Pages.

## Local

- Requisito: Node.js ≥ 18.
- `node build.js` → genera `dist/`.
- `node --test` → corre los tests (descubrimiento por defecto; `node --test test/` con barra falla en Windows).
- Servir por HTTP (nunca `file://`): `npx serve dist` o cualquier servidor estático.

> Guía de desarrollo completa (estructura, propósito de cada módulo, cómo agregar contenido, cómo agregar un torneo, regla de ganadores y perdedores): [`docs/guias/desarrollo.md`](docs/guias/desarrollo.md)

## Estructura

```
build.js            Orquestador: lee data/, rellena templates/, escribe dist/
data/*.json         Fuente de verdad (sitio, noticias, torneos)
lib/                Lógica pura compartida por build y navegador
templates/          Páginas con marcadores + partials de layout
assets/css/         Capas: tokens → base → layout → componentes
assets/js/          Módulos del navegador (main, torneo, vistas-torneo)
recursos/           Entrada para materiales del club (no entra al build)
test/               Tests con node:test
dist/               Salida del build (ignorada por git)
```

Puntos clave de la arquitectura:

- **Los JSON son la única fuente de verdad**: nada de contenido hardcodeado en el código.
- **El markup de tarjetas, escudos, estado de los equipos y zonas se genera una sola vez** en `lib/render.js` y el navegador reúsa la misma pieza (el build la copia a `dist/assets/js/lib/`).
- **Rutas relativas + `.nojekyll`** (lo escribe el build): el sitio funciona igual en GitHub Pages y Cloudflare Pages, desde cualquier carpeta.
- **`npm` no es necesario**: el generador y los tests usan solo el runtime de Node (`node build.js`, `node --test`).
- **CSS por capas** con todos los tokens (paleta del club, escalas, forma, movimiento) en `assets/css/tokens.css`.

## Cómo cargar un resultado

1. Editar `data/torneos/libres-26-27.json`: `estado: "jugado"`, `resultado: {golesA, golesB}` y `penales` si hubo.
2. `node build.js` → la página de la edición, la home y el cuadro se actualizan.

## Cómo agregar una edición nueva

1. Copiar el JSON anterior a `data/torneos/<categoria>-<edicion-nueva>.json` y ajustar `id`, `edicion` y `estado: "archivo"` en la anterior.
2. Actualizar `edicionVigente` en `data/sitio.json` (p. ej. `"27/28"`).
3. `node build.js` → aparece en el selector de ediciones y en Torneos.

Una categoría nueva (p. ej. Femenino) no requiere tocar código: se crea su JSON y se agrega a `edicionVigente`; el build la descubre sola.

## Despliegue

> Guía completa con comandos exactos (crear repo, push, activar Pages, Cloudflare, rollback): [`docs/guias/despliegue-github-cloudflare.md`](docs/guias/despliegue-github-cloudflare.md)

### GitHub Pages (repo público)

1. Crear el repositorio en GitHub y `git push -u origin main`.
2. Settings → Pages → Source: **GitHub Actions**. El workflow en cada push genera `dist/` y publica.

### Cloudflare Pages (gratis)

1. Dashboard → **Pages** → **Create project** → Conectar el repo.
2. Build: comando `node build.js`, directorio de salida `dist/`, rama `main`.
3. Cada push al repo redespliega automáticamente.

> Ambos usan rutas relativas + `.nojekyll`, así el sitio funciona igual en las dos plataformas.