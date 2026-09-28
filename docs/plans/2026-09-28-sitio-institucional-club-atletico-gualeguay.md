# Plan de implementación — Sitio institucional Club Atlético Gualeguay

> **Para workers agénticos:** SUB-SKILL REQUERIDO: usar subagent-driven-development (recomendado) o executing-plans para implementar este plan tarea por tarea. Los steps usan la sintaxis de checkbox (`- [ ]`).

**Objetivo:** Construir el sitio estático institucional del Club Atlético Gualeguay (HTML5 + CSS3 + JS vanilla + build en Node sin dependencias) según la spec aprobada en `docs/specs/2026-09-28-sitio-institucional-club-atletico-gualeguay-design.md`, desplegable gratis en GitHub Pages y Cloudflare Pages.

**Arquitectura:** Los datos (torneos por edición, noticias, identidad del sitio) viven en JSON bajo `data/`. `build.js` (Node puro, sin dependencias) ensambla el layout (head/header/footer), genera las páginas de edición de torneo (shells estáticos), las de noticias y la home, y copia las páginas manuscritas y `assets/` a `dist/`. Cada página de edición carga su JSON con `fetch` (mismo origen) y renderiza las tabs (Equipos / Fixture / Cuadro / Goleadores) con JS vanilla. Modo A (generador) y modo B (edición directa de HTML) conviven: el build no altera manuscritas más allá de copiarlas.

**Tech Stack:** HTML5 · CSS3 (variables CSS como tokens de identidad) · JavaScript vanilla (sin ES modules; scripts globales simples) · Node ≥18 (build; v24 disponible) · `node:test` para tests sin dependencias · Git.

**Notas de ejecución (Windows / PowerShell):**
- Si `git` no se reconoce, anteponer `$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH`.
- No usar `npm` (script policy). Build: `node build.js`. Tests: `node --test test/`.
- El directorio de salida `dist/` está en `.gitignore`; se despliega desde CI.

---

## Mapa de archivos

| Ruta | Responsabilidad |
|---|---|
| `build.js` | Generador: lee `data/`, ensambla layout, genera páginas dinámicas, copia manuscritas/assets a `dist/` |
| `lib/utils.js` | Utilidades puras del build (JSON, slug, escape, fechas) — testeadas con node:test |
| `lib/layout.js` | Ensamblado de layout (head/header/footer/nav activa) — testeado con node:test |
| `package.json` | Metadatos + script `"build": "node build.js"` (sin dependencias) |
| `data/sitio.json` | Identidad, redes, edición vigente por categoría, navegación |
| `data/noticias.json` | Noticias (titulo, fecha, resumen, categoria, imagen, contenido) |
| `data/torneos/libres-26-27.json` | Edición vigente Libres (equipos, rondas, goleadores) |
| `data/torneos/veteranos-26-27.json` | Edición vigente Veteranos |
| `templates/partials/_head.html` | `<head>` con meta, título, CSS |
| `templates/partials/_header.html` | Header: escudo, nav, hamburguesa, redes |
| `templates/partials/_footer.html` | Footer con enlaces, redes, año |
| `templates/partials/_scripts.html` | Carga de `main.js` y del JS de página |
| `templates/torneo-edicion.html` | Shell de edición (tabs + slots + JSON embed) |
| `templates/index.html` | Home (hero + última ronda + próximos + resultados + noticias) |
| `templates/noticias-index.html` | Listado + archivo de noticias |
| `templates/noticia.html` | Detalle de nota |
| `templates/torneos-index.html` | Presentación de torneos + histórico de ediciones |
| `templates/instalaciones.html` | Página manuscrita (modo B) |
| `templates/contacto.html` | Página manuscrita (modo B) |
| `templates/404.html` | Página de error 404 |
| `assets/css/styles.css` | Sistema de diseño: tokens, componentes, responsive |
| `assets/js/main.js` | Nav móvil, foco, año en footer |
| `assets/js/torneo.js` | Render de tabs de una edición (Equipos/Cuadro/Fixture/Goleadores) + estados |
| `assets/img/` | Imágenes y placeholders |
| `test/build.test.js` | Tests `node:test` de utilidades del build |
| `test/data.test.js` | Tests de validación de datos JSON |
| `.github/workflows/deploy.yml` | CI: build + publish a GitHub Pages |
| `README.md` | Cómo editar datos, correr el build, desplegar en ambas plataformas |

---

## Esquema de tareas

1. Esqueleto del proyecto (carpetas, package.json) y primer build mínimo
2. Datos JSON de ejemplo (sitio, noticias, libres-26-27, veteranos-26-27)
3. Utilidades del build con tests (node:test, TDD)
4. Ensamblador de layout (partials + assemble) con tests
5. build.js núcleo: dist limpio, copia de assets, `.nojekyll`, páginas de prueba
6. Páginas manuscritas: Instalaciones, Contacto, 404
7. CSS: tokens + base + header/footer/hero (móvil primero)
8. CSS: componentes (badges, tarjeta de partido, tabs, tablas, formulario, estados)
9. JS `main.js`: hamburguesa, menú móvil, foco, footer
10. Shell de edición de torneo (template + generación + índice de ediciones)
11. JS `torneo.js`: vista Equipos
12. JS `torneo.js`: vista Cuadro (rondas por zona, badges, penales, pase libre, navegador de ronda)
13. JS `torneo.js`: vista Fixture + Goleadores + estados (carga/error/vacío)
14. Noticias: listado + detalle + archivo por fecha
15. Home: template `index.html` + generación
16. Torneos: presentación + histórico de ediciones
17. Despliegue: GitHub Actions, Cloudflare Pages, README
### Tarea 1: Esqueleto del proyecto y primer build mínimo

**Archivos:**
- Crear: `package.json`
- Crear: `build.js` (versión mínima de arranque)
- Crear carpetas: `data/torneos/`, `templates/partials/`, `assets/css/`, `assets/js/`, `assets/img/`, `test/`

- [ ] **Paso 1: Crear `package.json`**

```json
{
  "name": "club-atletico-gualeguay",
  "version": "1.0.0",
  "private": true,
  "description": "Sitio institucional del Club Atlético Gualeguay (estático, sin dependencias)",
  "scripts": {
    "build": "node build.js",
    "test": "node --test test/"
  }
}
```

- [ ] **Paso 2: Crear las carpetas del proyecto**

Correr en PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path "data\torneos","templates\partials","assets\css","assets\js","assets\img","test" | Out-Null
```

Verificar: `Get-ChildItem` muestra las 6 carpetas. Nota: si `New-Item` devuelve `False` en `Test-Path` (caso OneDrive), creá una carpeta con la herramienta "write" (archivo `carpeta/.gitkeep`) y seguí.

- [ ] **Paso 3: `build.js` mínimo de arranque**

```js
// build.js — Generador del sitio (Node puro, sin dependencias)
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

function cleanDist() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}

function main() {
  cleanDist();
  console.log("Build OK: dist/ preparado");
}

main();
```

- [ ] **Paso 4: Correr el build y commitear**

```powershell
node build.js
# Esperado: "Build OK: dist/ preparado" y existe dist/
```

```bash
git add package.json build.js
git commit -m "chore: esqueleto del proyecto y build mínimo"
```

### Tarea 2: Datos JSON de ejemplo

**Archivos:**
- Crear: `data/sitio.json`, `data/noticias.json`
- Crear: `data/torneos/libres-26-27.json`, `data/torneos/veteranos-26-27.json`

Modelo: cada edición es autocontenida. La Ronda 1 usa `"zona": "iniciales"` (cruces pareados); Ronda 2+ usa `"ganadores"` o `"perdedores"`. Estados de partido: `por jugar | jugado | pase-libre`. La final al mejor de 2 se carga como partidos normales de la última ronda (dos partidos del mismo cruce); el render no necesita una marca especial.

- [ ] **Paso 1: `data/sitio.json`**

```json
{
  "nombre": "Club Atlético Gualeguay",
  "ciudad": "Villaguay, Entre Ríos",
  "escudo": "assets/img/escudo.svg",
  "colores": { "primario": "#0c5c46", "secundario": "#f7f3e8", "acento": "#c9a227" },
  "redes": [
    { "nombre": "Instagram", "url": "https://instagram.com/tu-club", "icono": "IG" },
    { "nombre": "Facebook", "url": "https://facebook.com/tu-club", "icono": "FB" },
    { "nombre": "WhatsApp", "url": "https://wa.me/54XXXXXXXXXX", "icono": "WA" }
  ],
  "edicionVigente": { "libres": "26/27", "veteranos": "26/27" },
  "contacto": { "email": "info@clubgualeguay.com.ar", "telefono": "+54 9 3455 00-0000", "direccion": "Calle Sarmiento 123, Villaguay" }
}
```

> Los colores son placeholders: se reemplazan por los reales del club cuando se entreguen.

- [ ] **Paso 2: `data/noticias.json`**

```json
[
  {
    "id": 1,
    "titulo": "Arrancó la edición 26/27 de los torneos",
    "fecha": "2026-09-20",
    "resumen": "Se sorteó la ronda inicial con más de 60 equipos en total.",
    "categoria": "torneo",
    "imagen": "assets/img/placeholder-1.svg",
    "contenido": "El Club Atlético Gualeguay dio inicio a la temporada 26/27.\n\nCon 60 equipos en categoría Libre y 20 en Veteranos, la primera ronda se juega este fin de semana.\n\nLos resultados se cargan jornada a jornada por la comisión."
  },
  {
    "id": 2,
    "titulo": "La sede, lista para el arranque",
    "fecha": "2026-09-15",
    "resumen": "Se acondicionaron las canchas y la iluminación de la sede.",
    "categoria": "club",
    "imagen": "assets/img/placeholder-2.svg",
    "contenido": "La comisión trabajó durante la semana para dejar las canchas en condiciones.\n\nLa iluminación de la cancha principal fue renovada."
  }
]
```

> Regla del build: `fecha` ISO `YYYY-MM-DD`; `contenido` con párrafos separados por `\n\n`; `categoria` libre (`torneo | club | ...`).

- [ ] **Paso 3: `data/torneos/libres-26-27.json`**

```json
{
  "id": "libres-26-27",
  "nombre": "Libres",
  "categoria": "libres",
  "temporada": "26/27",
  "edicion": "26/27",
  "estado": "vigente",
  "equipos": [
    { "id": "eq-1", "nombre": "Amistad FC" },
    { "id": "eq-2", "nombre": "Centenario" },
    { "id": "eq-3", "nombre": "La Picada" },
    { "id": "eq-4", "nombre": "Río Uruguay" },
    { "id": "eq-5", "nombre": "Los Amigos" },
    { "id": "eq-6", "nombre": "San Martín" }
  ],
  "rondas": [
    {
      "numero": 1,
      "zona": "iniciales",
      "partidos": [
        { "id": "r1-p1", "equipoA": "eq-1", "equipoB": "eq-2", "estado": "jugado", "resultado": { "golesA": 2, "golesB": 1 }, "penales": null, "fecha": "2026-10-03", "hora": "20:30", "cancha": "Cancha 1" },
        { "id": "r1-p2", "equipoA": "eq-3", "equipoB": "eq-4", "estado": "jugado", "resultado": { "golesA": 0, "golesB": 0 }, "penales": { "a": 3, "b": 2 }, "fecha": "2026-10-03", "hora": "21:30", "cancha": "Cancha 2" },
        { "id": "r1-p3", "equipoA": "eq-5", "equipoB": "eq-6", "estado": "por jugar", "fecha": "2026-10-04", "hora": "19:00", "cancha": "Cancha 1" }
      ]
    },
    {
      "numero": 2,
      "zona": "ganadores",
      "partidos": [
        { "id": "r2-p1", "equipoA": "eq-1", "equipoB": null, "estado": "pase-libre", "fecha": "", "hora": "", "cancha": "" }
      ]
    },
    {
      "numero": 2,
      "zona": "perdedores",
      "partidos": [
        { "id": "r2-p2", "equipoA": "eq-2", "equipoB": "eq-3", "estado": "por jugar", "fecha": "2026-10-10", "hora": "20:30", "cancha": "Cancha 3" }
      ]
    }
  ],
  "goleadores": [
    { "jugador": "López", "equipoId": "eq-1", "goles": 3 },
    { "jugador": "Fernández", "equipoId": "eq-3", "goles": 2 }
  ]
}
```

- [ ] **Paso 4: `data/torneos/veteranos-26-27.json`** (misma estructura, menos equipos)

```json
{
  "id": "veteranos-26-27",
  "nombre": "Veteranos",
  "categoria": "veteranos",
  "temporada": "26/27",
  "edicion": "26/27",
  "estado": "vigente",
  "equipos": [
    { "id": "eq-1", "nombre": "Veteranos A" },
    { "id": "eq-2", "nombre": "Veteranos B" },
    { "id": "eq-3", "nombre": "Ex-River" },
    { "id": "eq-4", "nombre": "La Vieja Guardia" }
  ],
  "rondas": [
    {
      "numero": 1,
      "zona": "iniciales",
      "partidos": [
        { "id": "r1-p1", "equipoA": "eq-1", "equipoB": "eq-2", "estado": "jugado", "resultado": { "golesA": 1, "golesB": 1 }, "penales": { "a": 4, "b": 5 }, "fecha": "2026-10-03", "hora": "17:00", "cancha": "Cancha 3" },
        { "id": "r1-p2", "equipoA": "eq-3", "equipoB": "eq-4", "estado": "por jugar", "fecha": "2026-10-04", "hora": "17:00", "cancha": "Cancha 2" }
      ]
    }
  ],
  "goleadores": []
}
```

- [ ] **Paso 5: Crear los SVGs placeholder** (el header y las noticias los referencian desde el primer build)

`assets/img/escudo.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Escudo del Club Atlético Gualeguay">
  <circle cx="32" cy="32" r="30" fill="#0c5c46"/>
  <circle cx="32" cy="32" r="26" fill="none" stroke="#f7f3e8" stroke-width="2"/>
  <text x="32" y="39" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#f7f3e8">CAG</text>
</svg>
```

`assets/img/placeholder-1.svg` (misma idea, texto "Foto 1") y `assets/img/placeholder-2.svg` ("Foto 2"), reemplazando el `<text>` y el `aria-label`; usar `fill="#c9a227"` para variar.

> Cuando el club entregue el escudo y las fotos reales, se reemplazan estos archivos (mismos nombres) sin tocar código.

- [ ] **Paso 6: Validar que los JSON son válidos y commitear**

```powershell
node -e "for (const f of ['data/sitio.json','data/noticias.json','data/torneos/libres-26-27.json','data/torneos/veteranos-26-27.json']) { JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('OK', f) }"
# Esperado: 4 líneas "OK ..."
```

```bash
git add data/ assets/img/
git commit -m "feat: datos de ejemplo (sitio, noticias, torneos 26/27)"
```

---

### Tarea 3: Utilidades del build (TDD con node:test)

**Archivos:**
- Test: `test/build.test.js`
- Crear: `lib/utils.js`

Funciones: `leerJSON(ruta)`, `slugify(texto)`, `escapeHtml(texto)`, `formatFecha(iso)`, `escribirArchivo(ruta, contenido)`.

- [ ] **Paso 1: Escribir los tests que fallan**

`test/build.test.js`:

```js
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const utils = require("../lib/utils.js");

test("slugify: normaliza tildes, mayúsculas y espacios", () => {
  assert.equal(utils.slugify("Club Atlético Gualeguay 26/27"), "club-atletico-gualeguay-26-27");
  assert.equal(utils.slugify("  Nota de Prensa!  "), "nota-de-prensa");
});

test("escapeHtml: escapa caracteres HTML", () => {
  assert.equal(utils.escapeHtml('<b class="x">A & B</b>'), "&lt;b class=&quot;x&quot;&gt;A &amp; B&lt;/b&gt;");
});

test("formatFecha: ISO a formato español", () => {
  assert.equal(utils.formatFecha("2026-10-03"), "3 de octubre de 2026");
  assert.equal(utils.formatFecha("2026-01-01"), "1 de enero de 2026");
});

test("leerJSON: lanza error claro con ruta", () => {
  assert.throws(() => utils.leerJSON("no-existe.json"), /no-existe\.json|ENOENT/);
});

test("escribirArchivo: crea directorios recursivos", () => {
  const destino = path.join(__dirname, "tmp-output", "sub", "archivo.txt");
  utils.escribirArchivo(destino, "hola");
  assert.equal(require("fs").readFileSync(destino, "utf8"), "hola");
  require("fs").rmSync(path.join(__dirname, "tmp-output"), { recursive: true, force: true });
});
```

Nota (Windows): los acentos en los literales de los `assert.equal` deben coincidir exactamente con la salida.

- [ ] **Paso 2: Correr los tests y verificar que fallan**

```powershell
node --test test/build.test.js
# Esperado: FAIL — "Cannot find module '../lib/utils.js'"
```

- [ ] **Paso 3: Implementar `lib/utils.js`**

```js
"use strict";
const fs = require("fs");
const path = require("path");

function leerJSON(ruta) {
  try {
    return JSON.parse(fs.readFileSync(ruta, "utf8"));
  } catch (e) {
    throw new Error(`No se pudo leer ${ruta}: ${e.message}`);
  }
}

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

function formatFecha(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

function escribirArchivo(ruta, contenido) {
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, contenido, "utf8");
}

module.exports = { leerJSON, slugify, escapeHtml, formatFecha, escribirArchivo };
```

- [ ] **Paso 4: Correr los tests y verificar que pasan**

```powershell
node --test test/build.test.js
# Esperado: 5 tests OK (pass)
```

- [ ] **Paso 5: Commit**

```bash
git add test/build.test.js lib/utils.js
git commit -m "feat: utilidades del build con tests"
```

---

### Tarea 4: Ensamblador de layout (partials + `lib/layout.js`)

**Archivos:**
- Crear: `templates/partials/_head.html`, `_header.html`, `_footer.html`, `_scripts.html`
- Test: `test/layout.test.js`
- Crear: `lib/layout.js`

- [ ] **Paso 1: Crear los partials**

`templates/partials/_head.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><!-- TITULO --></title>
  <meta name="description" content="Sitio oficial del Club Atlético Gualeguay — Villaguay, Entre Ríos.">
  <link rel="stylesheet" href="<!-- ASSETS_ROOT -->assets/css/styles.css">
</head>
<body>
```

`templates/partials/_header.html`:

```html
<header class="site-header">
  <a class="brand" href="<!-- ASSETS_ROOT -->index.html">
    <img class="brand-logo" src="<!-- ASSETS_ROOT -->assets/img/escudo.svg" alt="Escudo del Club Atlético Gualeguay">
    <span class="brand-name">Club Atlético Gualeguay</span>
  </a>
  <button class="nav-toggle" aria-expanded="false" aria-controls="menu-principal" aria-label="Abrir menú">☰</button>
  <nav id="menu-principal" class="site-nav" aria-label="Navegación principal">
    <a class="nav-link" href="<!-- ASSETS_ROOT -->index.html" data-nav="inicio">Inicio</a>
    <a class="nav-link{{ACTIVO:torneos}}" href="<!-- ASSETS_ROOT -->torneos/index.html" data-nav="torneos">Torneos (Fútbol 7) ▾</a>
    <a class="nav-link{{ACTIVO:noticias}}" href="<!-- ASSETS_ROOT -->noticias/index.html" data-nav="noticias">Noticias</a>
    <a class="nav-link{{ACTIVO:instalaciones}}" href="<!-- ASSETS_ROOT -->instalaciones.html" data-nav="instalaciones">Instalaciones</a>
    <a class="nav-link{{ACTIVO:contacto}}" href="<!-- ASSETS_ROOT -->contacto.html" data-nav="contacto">Contacto</a>
    <!-- REDES -->
  </nav>
</header>
<main id="contenido" class="site-main">
```

`templates/partials/_footer.html`:

```html
</main>
<footer class="site-footer">
  <div class="footer-inner">
    <span class="footer-brand">Club Atlético Gualeguay</span>
    <!-- REDES -->
    <span class="footer-copy">© <!-- ANIO --> Club Atlético Gualeguay · Villaguay, Entre Ríos</span>
  </div>
</footer>
```

`templates/partials/_scripts.html`:

```html
<script src="<!-- ASSETS_ROOT -->assets/js/main.js"></script>
</body>
</html>
```

- [ ] **Paso 2: Escribir los tests que fallan**

`test/layout.test.js`:

```js
"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const layout = require("../lib/layout.js");

test("assemble: inserta título y contenido", () => {
  const html = layout.assemble({
    titulo: "Noticias | Club Gualeguay",
    contenido: "<p>Hola</p>",
    navActiva: "noticias",
    anio: 2026,
    assetsRoot: "",
    redes: [{ nombre: "Instagram", url: "#", icono: "IG" }],
  });
  assert.ok(html.includes("<title>Noticias | Club Gualeguay</title>"));
  assert.ok(html.includes("<p>Hola</p>"));
});

test("assemble: marca nav activa", () => {
  const html = layout.assemble({
    titulo: "X", contenido: "", navActiva: "torneos", anio: 2026,
    assetsRoot: "../", redes: [],
  });
  assert.ok(html.includes('class="nav-link on" href="../torneos/index.html"'));
  assert.ok(!html.includes('class="nav-link on" href="index.html"'));
});

test("assemble: renderiza redes y año", () => {
  const html = layout.assemble({
    titulo: "X", contenido: "", navActiva: "inicio", anio: 2026,
    assetsRoot: "", redes: [{ nombre: "Instagram", url: "https://ig", icono: "IG" }],
  });
  assert.ok(html.includes("https://ig"));
  assert.ok(html.includes("© 2026 Club Atlético Gualeguay"));
  assert.ok(html.endsWith("</html>\n"));
});
```

- [ ] **Paso 3: Correr tests y verificar que fallan**

```powershell
node --test test/layout.test.js
# Esperado: FAIL — "Cannot find module '../lib/layout.js'"
```

- [ ] **Paso 4: Implementar `lib/layout.js`**

```js
"use strict";
const fs = require("fs");
const path = require("path");
const { escapeHtml } = require("./utils.js");

const PARTIALS_DIR = path.join(__dirname, "..", "templates", "partials");
const cache = {};
function partial(nombre) {
  if (!cache[nombre]) {
    cache[nombre] = fs.readFileSync(path.join(PARTIALS_DIR, nombre), "utf8");
  }
  return cache[nombre];
}

function renderRedes(redes) {
  return (redes || [])
    .map((r) => `<a class="social-link" href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.icono)}</a>`)
    .join("");
}

function assemble(opts) {
  const { titulo, contenido, navActiva = "", anio, assetsRoot = "", redes = [] } = opts;
  const redesHtml = renderRedes(redes);
  const rellenar = (html) =>
    html
      .replace(/<!-- ASSETS_ROOT -->/g, assetsRoot)
      .replace(/<!-- REDES -->/g, redesHtml)
      .replace(/<!-- ANIO -->/g, String(anio))
      .replace(/<!-- TITULO -->/g, escapeHtml(titulo))
      .replace(/\{\{ACTIVO:(\w+)\}\}/g, (_, id) => (id === navActiva ? " on" : ""));
  return (
    rellenar(partial("_head.html")) +
    rellenar(partial("_header.html")) +
    contenido +
    rellenar(partial("_footer.html")) +
    rellenar(partial("_scripts.html"))
  );
}

module.exports = { assemble, renderRedes };
```

- [ ] **Paso 5: Correr tests y verificar que pasan**

```powershell
node --test test/layout.test.js
# Esperado: 3 tests OK
```

- [ ] **Paso 6: Commit**

```bash
git add templates/partials/ test/layout.test.js lib/layout.js
git commit -m "feat: ensamblador de layout con tests"
```

---

### Tarea 5: build.js núcleo (dist limpio, assets, .nojekyll, pipeline)

**Archivos:**
- Modificar: `build.js`

- [ ] **Paso 1: Implementar `build.js`**

```js
"use strict";
const fs = require("fs");
const path = require("path");
const { leerJSON } = require("./lib/utils.js");
const { assemble } = require("./lib/layout.js");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const DATA = path.join(ROOT, "data");
const TEMPLATES = path.join(ROOT, "templates");
const ASSETS = path.join(ROOT, "assets");

function cleanDist() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}

function copiarAssets() {
  fs.cpSync(ASSETS, path.join(DIST, "assets"), { recursive: true });
}

function escribirPagina(rutaRel, titulo, navActiva, contenidoHtml) {
  const sitio = leerJSON(path.join(DATA, "sitio.json"));
  const dirs = rutaRel.split("/").slice(0, -1).filter(Boolean);
  const assetsRoot = dirs.map(() => "../").join("");
  const html = assemble({
    titulo,
    contenido: contenidoHtml,
    navActiva,
    anio: new Date().getFullYear(),
    assetsRoot,
    redes: sitio.redes,
  });
  fs.mkdirSync(path.dirname(path.join(DIST, rutaRel)), { recursive: true });
  fs.writeFileSync(path.join(DIST, rutaRel), html, "utf8");
  console.log("  →", rutaRel);
}

function main() {
  console.log("Limpiando dist/ …");
  cleanDist();
  console.log("Copiando assets …");
  copiarAssets();
  fs.writeFileSync(path.join(DIST, ".nojekyll"), "", "utf8");

  console.log("Generando páginas …");
  escribirPagina(
    "index.html",
    "Inicio | Club Atlético Gualeguay",
    "inicio",
    '<section class="hero"><h1>Club Atlético Gualeguay</h1><p>Sitio en construcción.</p></section>'
  );

  console.log("Build OK ✔");
}

main();
```

> Nota: `assetsRoot` calcula `../` por cada nivel de profundidad, así las rutas relativas funcionan igual en GitHub Pages y Cloudflare Pages.

- [ ] **Paso 2: Correr el build y verificar la salida**

```powershell
node build.js
Get-ChildItem dist -Recurse -Force | Select-Object FullName
# Esperado: dist/index.html, dist/assets/** (copia completa), dist/.nojekyll
```

- [ ] **Paso 3: Verificar que la home provisional renderiza el layout**

```powershell
Select-String -Path dist\index.html -Pattern "Club Atlético Gualeguay|site-header|site-footer|©"
# Esperado: título, header, footer y año presentes
```

- [ ] **Paso 4: Commit**

```bash
git add build.js
git commit -m "feat: núcleo del build (dist, assets, nojekyll, pipeline de layout)"
```

---

### Tarea 6: Páginas manuscritas — Instalaciones, Contacto, 404 (modo B)

**Archivos:**
- Crear: `templates/instalaciones.html`, `templates/contacto.html`, `templates/404.html`
- Modificar: `build.js`

Convención: la **primera línea** de cada plantilla manuscrita es el metadata: `<!-- PAGINA: <título> | <nav> -->`. El contenido va dentro de `<main>` (el layout ya lo envuelve).

- [ ] **Paso 1: Crear `templates/instalaciones.html`**

```html
<!-- PAGINA: Instalaciones | Club Atlético Gualeguay | instalaciones -->
<section class="page">
  <h1>Instalaciones / Sede</h1>
  <p>La sede del club está en <strong>Calle Sarmiento 123, Villaguay, Entre Ríos</strong>. Contamos con tres canchas de fútbol 7 con iluminación, buffet y estacionamiento.</p>

  <h2>Canchas</h2>
  <ul>
    <li><strong>Cancha 1</strong> — principal, iluminación LED, vestuarios.</li>
    <li><strong>Cancha 2</strong> — secundaria, césped sintético.</li>
    <li><strong>Cancha 3</strong> — cancha de entrenamiento y Veteranos.</li>
  </ul>

  <h2>Horarios</h2>
  <p>La sede se habilita de <strong>lunes a domingo, 16:00 a 00:00</strong> durante los torneos.</p>

  <h2>Ubicación</h2>
  <iframe
    src="https://www.google.com/maps?q=Villaguay,+Entre+Rios&output=embed"
    title="Mapa de Villaguay, Entre Ríos"
    width="100%" height="300" loading="lazy" style="border:0" referrerpolicy="no-referrer-when-downgrade"></iframe>
</section>
```

- [ ] **Paso 2: Crear `templates/contacto.html`**

```html
<!-- PAGINA: Contacto | Club Atlético Gualeguay | contacto -->
<section class="page">
  <h1>Contacto</h1>
  <p>Escribinos o pasate por la sede. Respondemos de lunes a viernes.</p>

  <ul class="contact-list">
    <li>Email: info@clubgualeguay.com.ar</li>
    <li>Teléfono: +54 9 3455 00-0000</li>
    <li>Dirección: Calle Sarmiento 123, Villaguay</li>
  </ul>

  <h2>Mensaje rápido</h2>
  <form class="contact-form" action="mailto:info@clubgualeguay.com.ar" method="post" enctype="text/plain">
    <label for="f-nombre">Nombre</label>
    <input id="f-nombre" name="nombre" type="text" autocomplete="name" required>
    <label for="f-mail">Email</label>
    <input id="f-mail" name="email" type="email" autocomplete="email" required>
    <label for="f-msg">Mensaje</label>
    <textarea id="f-msg" name="mensaje" rows="5" required></textarea>
    <button type="submit">Enviar por correo</button>
    <p class="form-note">El formulario abre tu programa de correo. También podés contactarnos por las redes del header/footer.</p>
  </form>
</section>
```

- [ ] **Paso 3: Crear `templates/404.html`**

```html
<!-- PAGINA: Página no encontrada | Club Atlético Gualeguay |  -->
<section class="page">
  <h1>404</h1>
  <p>La página que buscás no existe o fue movida.</p>
  <p><a class="btn" href="index.html">Volver al inicio</a></p>
</section>
```

- [ ] **Paso 4: Modificar `build.js` para ensamblar manuscritas**

Agregar antes de `function main()`:

```js
function metadataDePlantilla(html) {
  const m = html.match(/^<!-- PAGINA: (.+) \| ([a-z0-9]*) -->\s*\n/i);
  if (!m) throw new Error("Falta metadata <!-- PAGINA: título | nav --> en la plantilla");
  return { titulo: m[1].trim(), navActiva: m[2].trim(), contenido: html.replace(m[0], "") };
}

function copiarManuscritas() {
  for (const nombre of ["instalaciones.html", "contacto.html", "404.html"]) {
    const raw = fs.readFileSync(path.join(TEMPLATES, nombre), "utf8");
    const meta = metadataDePlantilla(raw);
    escribirPagina(nombre, meta.titulo, meta.navActiva, meta.contenido);
  }
}
```

Y al final de `main()`, después del bloque de `index.html` provisional:

```js
  console.log("Copiando páginas manuscritas…");
  copiarManuscritas();
```

- [ ] **Paso 5: Correr el build y verificar las 3 páginas + 404 sin nav activa**

```powershell
node build.js
Test-Path dist\instalaciones.html; Test-Path dist\contacto.html; Test-Path dist\404.html
Select-String -Path dist\instalaciones.html -Pattern "class=\"nav-link on\"" | Measure-Object | Select-Object Count
# Esperado: 3 True; y Count 1 en instalaciones (solo su nav activa)
```

- [ ] **Paso 6: Commit**

```bash
git add templates/instalaciones.html templates/contacto.html templates/404.html build.js
git commit -m "feat: páginas manuscritas Instalaciones, Contacto y 404"
```

---

### Tarea 7: CSS — tokens, base y layout (móvil primero)

**Archivos:**
- Crear: `assets/css/styles.css`

- [ ] **Paso 1: Escribir tokens, reset, header y footer**

`assets/css/styles.css`:

```css
/* ===== Tokens ===== */
:root {
  --color-primario: #0c5c46;        /* reemplazar por colores reales del club */
  --color-primario-oscuro: #084030;
  --color-secundario: #f7f3e8;
  --color-acento: #c9a227;
  --color-texto: #1d1d1f;
  --color-texto-suave: #5b6b7f;
  --color-borde: #d5dce5;
  --color-fondo: #ffffff;
  --radio: 10px;
  --sombra: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* ===== Reset y base ===== */
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  line-height: 1.5;
  color: var(--color-texto);
  background: var(--color-fondo);
}
img { max-width: 100%; height: auto; }
a { color: var(--color-primario); text-decoration: none; }
a:hover { text-decoration: underline; }
h1 { font-size: 1.9rem; margin: 0 0 0.75rem; }
h2 { font-size: 1.3rem; margin: 1.5rem 0 0.5rem; }

/* ===== Header ===== */
.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background: var(--color-primario);
  color: #fff;
}
.brand { display: flex; align-items: center; gap: 0.5rem; color: #fff; }
.brand:hover { text-decoration: none; }
.brand-logo { width: 36px; height: 36px; border-radius: 50%; background: #fff; object-fit: contain; }
.brand-name { font-weight: 700; font-size: 1rem; line-height: 1.1; }

.nav-toggle {
  background: transparent; border: 1px solid rgba(255, 255, 255, 0.5);
  color: #fff; font-size: 1.1rem; border-radius: 8px;
  padding: 0.3rem 0.6rem; cursor: pointer;
}
.site-nav { display: none; flex-direction: column; gap: 0.2rem; }
.site-nav.open {
  display: flex;
  position: absolute; top: 52px; left: 0; right: 0;
  background: var(--color-primario-oscuro);
  padding: 0.6rem 1rem 0.9rem;
  box-shadow: var(--sombra);
  z-index: 20;
}
.nav-link { color: rgba(255, 255, 255, 0.92); padding: 0.5rem 0.6rem; border-radius: 6px; font-weight: 500; }
.nav-link:hover { background: rgba(255, 255, 255, 0.12); text-decoration: none; }
.nav-link.on { background: rgba(255, 255, 255, 0.18); text-decoration: none; }

.social-link {
  display: inline-block; font-size: 0.7rem; font-weight: 700;
  padding: 0.2rem 0.55rem; border-radius: 999px;
  background: rgba(255, 255, 255, 0.15); color: #fff; margin-left: 0.3rem;
}
.social-link:hover { background: rgba(255, 255, 255, 0.28); text-decoration: none; }

/* ===== Footer ===== */
.site-footer {
  background: var(--color-primario-oscuro); color: rgba(255, 255, 255, 0.85);
  padding: 1.25rem 1rem; margin-top: 2.5rem;
}
.footer-inner { max-width: 960px; margin: 0 auto; display: flex; flex-direction: column; gap: 0.5rem; }
.footer-brand { font-weight: 700; }
.footer-copy { font-size: 0.85rem; opacity: 0.8; }

/* ===== Main y secciones ===== */
.site-main { min-height: 60vh; }
.page { max-width: 960px; margin: 0 auto; padding: 1.5rem 1rem; }
.hero {
  background: var(--color-primario); color: #fff;
  padding: 2.5rem 1rem; text-align: center;
}
.hero h1 { margin-bottom: 0.4rem; }
.hero p { opacity: 0.9; max-width: 560px; margin: 0 auto; }

.btn {
  display: inline-block; background: var(--color-acento); color: #1d1d1f;
  font-weight: 700; padding: 0.5rem 1.1rem; border-radius: 999px;
}
.btn:hover { text-decoration: none; filter: brightness(0.95); }
```

- [ ] **Paso 2: Formulario de contacto**

Agregar al final de `styles.css`:

```css
/* ===== Formulario ===== */
.contact-form { display: flex; flex-direction: column; gap: 0.4rem; max-width: 520px; }
.contact-form label { font-weight: 600; font-size: 0.9rem; margin-top: 0.4rem; }
.contact-form input,
.contact-form textarea {
  font: inherit; padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-borde); border-radius: 8px;
}
.contact-form button {
  margin-top: 0.7rem; font: inherit; font-weight: 700; cursor: pointer;
  background: var(--color-primario); color: #fff;
  border: none; border-radius: 8px; padding: 0.6rem 1rem;
}
.form-note { font-size: 0.8rem; color: var(--color-texto-suave); }
.contact-list { line-height: 2; }
```

- [ ] **Paso 3: Correr el build y verificar que styles.css se copia**

```powershell
node build.js
Test-Path dist\assets\css\styles.css
# Esperado: True (las páginas ya referencian el archivo)
```

- [ ] **Paso 4: Commit**

```bash
git add assets/css/styles.css
git commit -m "feat: CSS base, header, footer, hero y formulario (móvil primero)"
```

---

### Tarea 8: CSS — componentes y responsive

**Archivos:**
- Modificar: `assets/css/styles.css`

- [ ] **Paso 1: Badges, tarjeta de partido y tabs**

Agregar al final de `styles.css`:

```css
/* ===== Badges ===== */
.badge {
  display: inline-block; font-size: 0.66rem; font-weight: 700;
  padding: 0.12rem 0.5rem; border-radius: 999px; vertical-align: middle;
}
.badge.v2  { background: #d8f0e4; color: #0b6e4f; }
.badge.v1  { background: #fff3cd; color: #7a5c00; }
.badge.elim{ background: #fbe0e0; color: #a33; }
.badge.gan { background: #e3effc; color: #1f5f9e; }
.badge.perd{ background: #f2e3fb; color: #6b3f9e; }
.badge.pen { background: #fdf3d7; color: #6b4b00; }
.badge.bye { background: #e8eef5; color: #3c4a5a; }

/* ===== Tarjeta de partido ===== */
.tarjeta-partido {
  background: #fff; border: 1px solid var(--color-borde);
  border-radius: var(--radio); box-shadow: var(--sombra);
  padding: 0.6rem 0.8rem; margin: 0 0 0.6rem;
}
.tp-titulo { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--color-texto-suave); margin-bottom: 0.2rem; }
.tp-fila { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
.tp-equipo { font-weight: 600; }
.tp-equipo.vacio { color: var(--color-texto-suave); font-weight: 400; font-style: italic; }
.tp-resultado { font-weight: 800; white-space: nowrap; }
.tp-meta { font-size: 0.78rem; color: var(--color-texto-suave); margin-top: 0.2rem; }

/* ===== Tabs y navegador de ronda ===== */
.tabs { display: flex; gap: 0.4rem; overflow-x: auto; padding-bottom: 0.3rem; margin: 0.75rem 0; }
.tab {
  font: inherit; font-weight: 600; font-size: 0.85rem; white-space: nowrap;
  border: 1px solid var(--color-borde); background: #fff; color: var(--color-texto);
  padding: 0.35rem 0.85rem; border-radius: 999px; cursor: pointer;
}
.tab.on { background: var(--color-primario); border-color: var(--color-primario); color: #fff; }
.nav-ronda { display: flex; align-items: center; gap: 0.5rem; margin: 0.5rem 0 0.75rem; flex-wrap: wrap; }
.nav-ronda .ronda-actual { font-weight: 700; min-width: 5.5rem; text-align: center; }

/* ===== Tablas ===== */
.tabla { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
.tabla th { text-align: left; color: var(--color-texto-suave); border-bottom: 2px solid var(--color-borde); padding: 0.35rem 0.5rem; }
.tabla td { border-bottom: 1px solid var(--color-borde); padding: 0.4rem 0.5rem; }
.tabla tr:nth-child(even) td { background: #f8fafc; }

/* ===== Zonas (cuadro) ===== */
.zonas { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.zona-titulo { font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 0.5rem; padding-bottom: 0.3rem; border-bottom: 2px solid; }
.zona-titulo.ganadores { color: #1f5f9e; border-color: #a3c6ea; }
.zona-titulo.perdedores { color: #6b3f9e; border-color: #cbb3e0; }
.zona-titulo.iniciales { color: #3c4a5a; border-color: #c7d1dc; }

/* ===== Estados vacío / error ===== */
.estado {
  border: 2px dashed var(--color-borde); border-radius: var(--radio);
  padding: 1.6rem 1rem; text-align: center; color: var(--color-texto-suave);
}
.estado.error { border-color: #e0b3b3; color: #a33; background: #fdf6f6; }
```

- [ ] **Paso 2: Breakpoints desktop (mejora progresiva)**

Agregar al final de `styles.css`:

```css
/* ===== Desktop (≥768px) ===== */
@media (min-width: 768px) {
  .nav-toggle { display: none; }
  .site-nav { display: flex; flex-direction: row; align-items: center; gap: 0.15rem; position: static; background: transparent; padding: 0; box-shadow: none; }
  .site-nav.open { position: static; background: transparent; padding: 0; }
  .brand-name { font-size: 1.15rem; }
  .hero { padding: 3.5rem 1rem; }
  .hero h1 { font-size: 2.6rem; }
  .zonas { grid-template-columns: 1fr 1fr; }
  .footer-inner { flex-direction: row; align-items: center; justify-content: space-between; }
}
@media (min-width: 1024px) {
  .site-main, .page { max-width: 1080px; }
}
```

- [ ] **Paso 3: Rebuild y verificación visual mínima**

```powershell
node build.js
# Abrir dist/index.html en el navegador (doble clic o servidor local) y comprobar:
# - Header con nav horizontal en desktop, hamburguesa en móvil (≤767px)
# - Hero centrado, footer al pie
```

- [ ] **Paso 4: Commit**

```bash
git add assets/css/styles.css
git commit -m "feat: componentes CSS (badges, partidos, tabs, tablas, zonas) y responsive"
```

---

### Tarea 9: JS `main.js` — navegación móvil accesible

**Archivos:**
- Crear: `assets/js/main.js`

- [ ] **Paso 1: Crear `assets/js/main.js`**

```js
"use strict";
(function () {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (!toggle || !nav) return;

  function setEstado(abierto) {
    nav.classList.toggle("open", abierto);
    toggle.setAttribute("aria-expanded", String(abierto));
    toggle.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  }

  toggle.addEventListener("click", () => setEstado(!nav.classList.contains("open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setEstado(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setEstado(false); });
})();
```

- [ ] **Paso 2: Rebuild y prueba manual**

```powershell
node build.js
# Abrir dist/index.html y reducir la ventana a ≤767px:
# - Clic en ☰ abre/cierra el menú y cambia aria-expanded
# - Clic en un enlace del menú lo cierra
# - Esc lo cierra
```

- [ ] **Paso 3: Commit**

```bash
git add assets/js/main.js
git commit -m "feat: navegación móvil accesible (JS vanilla)"
```

---

### Tarea 10: Shell de edición de torneo + generación en el build

**Archivos:**
- Crear: `templates/torneo-edicion.html`
- Modificar: `build.js`

La página de edición es un shell estático: carga su JSON con `fetch` y renderiza las 4 vueltas (Cuadro por defecto). El build copia `data/` a `dist/data/` para que el fetch funcione sin backend.

- [ ] **Paso 1: Crear `templates/torneo-edicion.html`**

```html
<!-- PAGINA: <!-- TITULO_EDICION --> | Club Atlético Gualeguay | torneos -->
<section class="page">
  <h1><!-- TITULO_EDICION --></h1>
  <div class="selector-ediciones"><!-- INDICE_EDICIONES --></div>

  <div class="tabs" role="tablist" aria-label="Secciones del torneo">
    <button class="tab on" role="tab" data-vista="cuadro" aria-selected="true">Cuadro</button>
    <button class="tab" role="tab" data-vista="fixture" aria-selected="false">Fixture</button>
    <button class="tab" role="tab" data-vista="equipos" aria-selected="false">Equipos</button>
    <button class="tab" role="tab" data-vista="goleadores" aria-selected="false">Goleadores</button>
  </div>

  <div id="vista-torneo" role="tabpanel" aria-live="polite"></div>
</section>
<script>
  window.__TORNEO__ = { dataUrl: "<!-- DATA_URL -->", nombreTorneo: "<!-- TITULO_EDICION -->" };
</script>
<script src="../../../assets/js/torneo.js"></script>
```

- [ ] **Paso 2: Modificar `build.js` — copiar datos y leer torneos**

Agregar junto a las otras funciones auxiliares:

```js
function copiarDatos() {
  fs.cpSync(path.join(ROOT, "data"), path.join(DIST, "data"), { recursive: true });
}

function leerTorneos() {
  const carpeta = path.join(DATA, "torneos");
  return fs.readdirSync(carpeta)
    .filter((f) => f.endsWith(".json"))
    .map((f) => leerJSON(path.join(carpeta, f)))
    .sort((a, b) => (a.categoria === b.categoria ? b.edicion.localeCompare(a.edicion) : a.categoria.localeCompare(b.categoria)));
}
```

En `main()`, después de `copiarAssets();`:

```js
  console.log("Copiando datos…");
  copiarDatos();
```

- [ ] **Paso 3: Modificar `build.js` — generar las ediciones**

Agregar a las funciones auxiliares:

```js
function slugEdicion(torneo) {
  return torneo.edicion.replace("/", "-");
}

function renderSelector(torneo, torneos) {
  const hermanas = torneos.filter((t) => t.categoria === torneo.categoria);
  return hermanas.map((t) => {
    const activa = t.id === torneo.id;
    const href = activa ? "index.html" : `../${slugEdicion(t)}/index.html`;
    return `<a class="tab${activa ? " on" : ""}" href="${href}">Edición ${t.edicion}${t.estado === "vigente" ? " · vigente" : ""}</a>`;
  }).join("");
}

function generarEdiciones() {
  const torneos = leerTorneos();
  for (const t of torneos) {
    const plantilla = fs.readFileSync(path.join(TEMPLATES, "torneo-edicion.html"), "utf8");
    const meta = metadataDePlantilla(plantilla);
    const titulo = `${t.nombre} · Edición ${t.edicion}`;
    const contenido = meta.contenido
      .replace(/<!-- TITULO_EDICION -->/g, titulo)
      .replace(/<!-- INDICE_EDICIONES -->/g, renderSelector(t, torneos))
      .replace(/<!-- DATA_URL -->/g, `../../../data/torneos/${t.id}.json`);
    escribirPagina(
      `torneos/${t.categoria}/${slugEdicion(t)}/index.html`,
      `${titulo} | Club Atlético Gualeguay`,
      "torneos",
      contenido
    );
  }
  console.log(`  → ${torneos.length} ediciones generadas`);
}
```

En `main()`, después de `copiarManuscritas();`:

```js
  console.log("Generando ediciones de torneo…");
  generarEdiciones();
```

> `metadataDePlantilla` ya existe (Tarea 6). El título de la plantilla contiene `<!-- TITULO_EDICION -->`; el replace de metadata lo deja tal cual hasta el paso siguiente que lo reemplaza por edición. La profundidad de todas las ediciones es constante (`torneos/<categoria>/<edicion>/`), por eso `torneo.js` se referencia como `../../../assets/js/torneo.js`; el bloque que define `window.__TORNEO__` va antes para que `torneo.js` lo encuentre al ejecutarse.

- [ ] **Paso 4: Correr el build y verificar los shells**

```powershell
node build.js
Test-Path dist\torneos\libres\26-27\index.html
Test-Path dist\torneos\veteranos\26-27\index.html
Test-Path dist\data\torneos\libres-26-27.json
Select-String -Path dist\torneos\libres\26-27\index.html -Pattern "dataUrl|Edición 26/27|Cuadro|torneo.js"
# Esperado: 3 True y líneas con los placeholders ya reemplazados
```

- [ ] **Paso 5: Commit**

```bash
git add templates/torneo-edicion.html build.js
git commit -m "feat: shell de edición de torneo generado con selector de ediciones"
```

---

### Tarea 11: JS `torneo.js` — base, estado y vista Equipos

**Archivos:**
- Crear: `assets/js/torneo.js`

- [ ] **Paso 1: Crear `assets/js/torneo.js` (base)**

```js
"use strict";
(function () {
  const contenedor = document.getElementById("vista-torneo");
  if (!contenedor || !window.__TORNEO__) return;

  let torneo = null;
  const $ = (html) => { contenedor.innerHTML = html; };

  function estadoHTML(tipo, mensaje) {
    return `<div class="estado${tipo === "error" ? " error" : ""}"><p>${mensaje}</p></div>`;
  }

  function badgeVidas(vidas) {
    if (vidas >= 2) return '<span class="badge v2">2 vidas</span>';
    if (vidas === 1) return '<span class="badge v1">1 vida</span>';
    return '<span class="badge elim">Eliminado</span>';
  }

  function equiposMap() {
    const m = {};
    for (const e of torneo.equipos) m[e.id] = e.nombre;
    return m;
  }

  function ganaEquipo(partido, equipoId) {
    if (partido.estado !== "jugado" || !partido.resultado) return null;
    const r = partido.resultado;
    if (r.golesA !== r.golesB) return r.golesA > r.golesB ? "A" : "B";
    if (partido.penales) return partido.penales.a > partido.penales.b ? "A" : "B";
    return null;
  }

  function vidasEquipo(equipoId) {
    let vidas = 2;
    for (const ronda of torneo.rondas) {
      for (const p of ronda.partidos) {
        if (p.estado !== "jugado") continue;
        const ganador = ganaEquipo(p, equipoId);
        if (ganador === "A" && p.equipoB === equipoId) vidas -= 1;
        if (ganador === "B" && p.equipoA === equipoId) vidas -= 1;
      }
    }
    return Math.max(vidas, 0);
  }

  function renderEquipos() {
    const lista = torneo.equipos.map((e) =>
      `<div class="tarjeta-partido"><div class="tp-fila">` +
      `<span class="tp-equipo">${e.nombre}</span>${badgeVidas(vidasEquipo(e.id))}` +
      `</div></div>`
    ).join("");
    $("<h2>Equipos</h2>" + (lista || estadoHTML("", "Todavía no hay equipos cargados.")));
  }

  function renderVista(vista) {
    if (vista === "equipos") return renderEquipos();
    // renderCuadro / renderFixture / renderGoleadores llegan en Tareas 12 y 13
    $(estadoHTML("", "Esta sección se habilita en los próximos pasos del plan."));
  }

  function init() {
    const tabs = document.querySelectorAll(".tabs .tab");
    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabs.forEach((b) => {
          b.classList.toggle("on", b === btn);
          b.setAttribute("aria-selected", String(b === btn));
        });
        renderVista(btn.dataset.vista);
      });
    });
  }

  fetch(window.__TORNEO__.dataUrl)
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((data) => { torneo = data; init(); renderVista("cuadro"); })
    .catch((e) => { $(estadoHTML("error", "No se pudo cargar el torneo. Reintentá más tarde.")); console.error(e); });
})();
```

- [ ] **Paso 2: Correr el build y probar en navegador**

```powershell
node build.js
# Servir dist/ localmente (ej: npx es opcional; usar Python o el servidor del companion):
# python -m http.server 8080 --directory dist   (o el equivalente)
# Abrir http://localhost:8080/torneos/libres/26-27/ y verificar:
# - La vista por defecto muestra "Esta sección se habilita…"
# - Clic en "Equipos" lista los 6 equipos con badges de vidas (Ronda 1 jugada aplica -1 vida a los perdedores)
```

- [ ] **Paso 3: Commit**

```bash
git add assets/js/torneo.js
git commit -m "feat: base de torneo.js, fetch de datos y vista Equipos con vidas"
```

---

### Tarea 12: JS `torneo.js` — vista Cuadro (opción A: listas por ronda)

**Archivos:**
- Modificar: `assets/js/torneo.js`

- [ ] **Paso 1: Agregar helpers de rondas y tarjetas**

Insertar después de `renderEquipos()`:

```js
  function rondasAgrupadas() {
    const map = new Map();
    for (const r of torneo.rondas) {
      if (!map.has(r.numero)) map.set(r.numero, { numero: r.numero, zonas: {} });
      map.get(r.numero).zonas[r.zona] = r.partidos;
    }
    return [...map.values()].sort((a, b) => a.numero - b.numero);
  }

  const ETIQUETA_ZONA = {
    iniciales: ["Cruces iniciales", "iniciales"],
    ganadores: ["Zona Ganadores", "ganadores"],
    perdedores: ["Zona Perdedores", "perdedores"],
  };

  function tarjetaPartido(p, nombres) {
    if (p.estado === "pase-libre") {
      return `<div class="tarjeta-partido"><div class="tp-titulo">Pase libre</div>` +
        `<div class="tp-fila"><span class="tp-equipo">⚽ ${nombres[p.equipoA]} pasa de ronda</span>` +
        `<span class="badge bye">Bye</span></div></div>`;
    }
    const meta = p.fecha
      ? `${p.fecha} ${p.hora} · ${p.cancha}`
      : "Fecha y cancha a definir";
    const eq = (id) => id ? nombres[id] : '<span class="tp-equipo vacio">por definir</span>';
    const badge = (id) => (id ? badgeVidas(vidasEquipo(id)) : "");
    const resultado = p.estado === "jugado" ? textoResultado(p) : "<strong>vs</strong>";
    return `<div class="tarjeta-partido"><div class="tp-titulo">${meta}</div>` +
      `<div class="tp-fila"><span class="tp-equipo">⚽ ${eq(p.equipoA)} ${badge(p.equipoA)}</span>` +
      `<span class="tp-resultado">${resultado}</span>` +
      `<span class="tp-equipo">⚽ ${eq(p.equipoB)} ${badge(p.equipoB)}</span></div></div>`;
  }
```

> Necesita `textoResultado()`, que se agrega en el Paso 3 de esta misma tarea.

- [ ] **Paso 2: Reemplazar `renderVista` para incluir el cuadro**

```js
  function renderCuadro() {
    const rondas = rondasAgrupadas();
    if (!rondas.length) { $(estadoHTML("", "Todavía no hay partidos cargados.")); return; }
    const idxMax = rondas.length - 1;
    const actual = cuadroEstado.actual > idxMax ? idxMax : cuadroEstado.actual;
    cuadroEstado.actual = actual;
    const ronda = rondas[actual];
    const nombres = equiposMap();
    const zonas = Object.keys(ETIQUETA_ZONA).filter((z) => ronda.zonas[z]);
    const columnas = zonas.map((z) => {
      const [titulo, clase] = ETIQUETA_ZONA[z];
      const partidos = ronda.zonas[z].map((p) => tarjetaPartido(p, nombres)).join("");
      return `<div><div class="zona-titulo ${clase}">${titulo}</div>${partidos || '<p class="tp-titulo">Sin partidos en esta zona.</p>'}</div>`;
    }).join("");
    const botones = `<button class="tab" data-ronda="-1" ${actual === 0 ? "disabled" : ""}>◀</button>` +
      `<span class="ronda-actual">Ronda ${ronda.numero}</span>` +
      `<button class="tab" data-ronda="1" ${actual === idxMax ? "disabled" : ""}>▶</button>`;
    $(`<h2>Cuadro · Ronda ${ronda.numero}</h2>` +
      `<div class="nav-ronda">${botones}</div>` +
      `<div class="zonas">${columnas}</div>`);
    document.querySelectorAll(".nav-ronda [data-ronda]").forEach((btn) => {
      btn.addEventListener("click", () => {
        cuadroEstado.actual += Number(btn.dataset.ronda);
        renderCuadro();
      });
    });
  }

  function renderVista(vista) {
    if (vista === "equipos") return renderEquipos();
    if (vista === "cuadro") return renderCuadro();
    // renderFixture / renderGoleadores llegan en la Tarea 13
    $(estadoHTML("", "Esta sección se habilita en el próximo paso del plan."));
  }

  const cuadroEstado = { actual: 0 };
```

- [ ] **Paso 3: Agregar `textoResultado`**

Insertar después de `vidasEquipo()`:

```js
  function textoResultado(partido) {
    const r = partido.resultado || { golesA: "-", golesB: "-" };
    let txt = `${r.golesA} – ${r.golesB}`;
    if (partido.penales) txt += ` <span class="badge pen">${partido.penales.a}-${partido.penales.b} pen.</span>`;
    return txt;
  }
```

- [ ] **Paso 4: Rebuild y prueba del cuadro**

```powershell
node build.js
# Servir dist/ y abrir /torneos/libres/26-27/:
# - Vista Cuadro por defecto: Ronda 2 con columnas Ganadores/Perdedores (o la última con datos)
# - Ronda 1 muestra "Cruces iniciales" en una columna
# - Partido por penales muestra el badge; pase libre muestra "Bye"
# - Los equipos perdedores de Ronda 1 figuran con "1 vida"; los ganadores con "2 vidas"
# - Navegador ◀ ▶ cambia de ronda
```

- [ ] **Paso 5: Commit**

```bash
git add assets/js/torneo.js
git commit -m "feat: vista Cuadro por rondas y zonas con navegador, penales y pases libres"
```

---

### Tarea 13: JS `torneo.js` — vista Fixture + Goleadores + estados

**Archivos:**
- Modificar: `assets/js/torneo.js`

- [ ] **Paso 1: Agregar `renderFixture` y `renderGoleadores`**

Insertar después de `renderCuadro()`:

```js
  function renderFixture() {
    const rondas = rondasAgrupadas();
    if (!rondas.length) { $(estadoHTML("", "Todavía no hay partidos cargados.")); return; }
    const nombres = equiposMap();
    const html = rondas.map((r) => {
      const zonas = Object.keys(ETIQUETA_ZONA).filter((z) => r.zonas[z]);
      const secciones = zonas.map((z) => {
        const [titulo, clase] = ETIQUETA_ZONA[z];
        const cards = r.zonas[z]
          .slice()
          .sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""))
          .map((p) => tarjetaPartido(p, nombres)).join("");
        return `<h3 class="zona-titulo ${clase}">Ronda ${r.numero} · ${titulo}</h3>${cards}`;
      }).join("");
      return `<div class="fixture-ronda">${secciones}</div>`;
    }).join("");
    $("<h2>Fixture</h2>" + html);
  }

  function renderGoleadores() {
    const lista = [...(torneo.goleadores || [])].sort((a, b) => b.goles - a.goles);
    if (!lista.length) { $(estadoHTML("", "Aún no se cargaron goleadores.")); return; }
    const nombres = equiposMap();
    const filas = lista.map((x) =>
      `<tr><td>${x.jugador}</td><td>${nombres[x.equipoId] || x.equipoId}</td><td><strong>${x.goles}</strong></td></tr>`
    ).join("");
    $('<h2>Goleadores</h2><table class="tabla"><thead><tr><th>Jugador</th><th>Equipo</th><th>Goles</th></tr></thead><tbody>' +
      filas + "</tbody></table>");
  }
```

- [ ] **Paso 2: Completar `renderVista` (sin placeholders pendientes)**

Reemplazar el `renderVista` actual por:

```js
  function renderVista(vista) {
    if (vista === "equipos") return renderEquipos();
    if (vista === "cuadro") return renderCuadro();
    if (vista === "fixture") return renderFixture();
    if (vista === "goleadores") return renderGoleadores();
  }
```

- [ ] **Paso 3: Rebuild y prueba de las 4 vistas + estados**

```powershell
node build.js
# Servir dist/ y abrir /torneos/libres/26-27/:
# - Fixture: partidos agrupados por ronda y zona, con fecha/hora/cancha y resultado
# - Goleadores: tabla con López (3) primero y Fernández (2)
# - Estados: apuntar temporalmente a un JSON inexistente (cambiar window.__TORNEO__.dataUrl en el HTML y recargar) → se ve "No se pudo cargar el torneo…"
# - Con rondas vacías en un JSON de prueba → "Todavía no hay partidos cargados."
```

- [ ] **Paso 4: Commit**

```bash
git add assets/js/torneo.js
git commit -m "feat: vistas Fixture y Goleadores y estados de carga/error/vacío"
```

---

### Tarea 14: Noticias — listado, detalle y archivo por fecha

**Archivos:**
- Crear: `templates/noticias-index.html`, `templates/noticia.html`
- Modificar: `build.js`

Ruta generada: `noticias/index.html` (listado = archivo por año) y `noticias/<slug>.html` (detalle). `slug = slugify(titulo) + "-" + id`.

- [ ] **Paso 1: Crear las plantillas**

`templates/noticias-index.html`:

```html
<!-- PAGINA: Noticias | Club Atlético Gualeguay | noticias -->
<section class="page">
  <h1>Noticias</h1>
  <div class="noticias-grid"><!-- LISTA_NOTICIAS --></div>
</section>
```

`templates/noticia.html`:

```html
<!-- PAGINA: <!-- NOTICIA_TITULO --> | Club Atlético Gualeguay | noticias -->
<article class="page nota">
  <p class="nota-volver"><a href="index.html">← Volver a noticias</a></p>
  <h1><!-- NOTICIA_TITULO --></h1>
  <p class="nota-meta"><!-- NOTICIA_META --></p>
  <!-- NOTICIA_IMAGEN -->
  <div class="nota-cuerpo"><!-- NOTICIA_CONTENIDO --></div>
</article>
```

- [ ] **Paso 2: Agregar los builders a `build.js`**

Primero ampliar el `require` de utilidades en la cabecera de `build.js`:

```js
const { leerJSON, slugify, escapeHtml, formatFecha } = require("./lib/utils.js");
```

Luego, junto a las funciones auxiliares:

```js
function leerNoticias() {
  return leerJSON(path.join(DATA, "noticias.json"))
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function slugNoticia(n) {
  return `${slugify(n.titulo)}-${n.id}`;
}

function cuerpoNoticia(n) {
  return escapeHtml(n.contenido)
    .split(/\n\s*\n/)
    .map((p) => `<p>${p}</p>`)
    .join("\n");
}

function renderListaNoticias(assetsRoot) {
  const noticias = leerNoticias();
  if (!noticias.length) return '<p>Todavía no hay noticias publicadas.</p>';
  let anioActual = null;
  return noticias.map((n) => {
    const anio = n.fecha.slice(0, 4);
    const separador = anio !== anioActual ? `<h2 class="archivo-anio">${anio}</h2>` : "";
    anioActual = anio;
    const imagen = n.imagen ? `<img class="nota-img" src="${assetsRoot}${n.imagen}" alt="" loading="lazy">` : "";
    return `${separador}<article class="tarjeta-nota">
      ${imagen}
      <div class="tarjeta-nota-body">
        <h3><a href="${slugNoticia(n)}.html">${escapeHtml(n.titulo)}</a></h3>
        <p class="nota-meta">${formatFecha(n.fecha)}<span class="badge">${escapeHtml(n.categoria)}</span></p>
        <p>${escapeHtml(n.resumen)}</p>
      </div>
    </article>`;
  }).join("");
}

function generarNoticias() {
  const plantillaIdx = fs.readFileSync(path.join(TEMPLATES, "noticias-index.html"), "utf8");
  const metaIdx = metadataDePlantilla(plantillaIdx);
  const lista = renderListaNoticias("../");
  escribirPagina("noticias/index.html", metaIdx.titulo, metaIdx.navActiva,
    metaIdx.contenido.replace("<!-- LISTA_NOTICIAS -->", lista));
  for (const n of leerNoticias()) {
    const plantilla = fs.readFileSync(path.join(TEMPLATES, "noticia.html"), "utf8");
    const meta = metadataDePlantilla(plantilla);
    const cuerpo = renderDetalleNoticia(n, "../");
    const contenido = meta.contenido
      .replace(/<!-- NOTICIA_TITULO -->/g, escapeHtml(n.titulo))
      .replace("<!-- NOTICIA_META -->", `${formatFecha(n.fecha)} · <span class="badge">${escapeHtml(n.categoria)}</span>`)
      .replace("<!-- NOTICIA_IMAGEN -->",
        n.imagen ? `<img class="nota-img" src="../${n.imagen}" alt="${escapeHtml(n.titulo)}">` : "")
      .replace("<!-- NOTICIA_CONTENIDO -->", cuerpoNoticia(n));
    escribirPagina(`noticias/${slugNoticia(n)}.html`, `${n.titulo} | Club Atlético Gualeguay`, "noticias", contenido);
  }
}
```

> Ojo: el `<!-- NOTICIA_TITULO -->` aparece dos veces dentro de la misma plantilla (metadata y `<h1>`); el `g` del replace los cubre a ambos.

En `main()`, **antes** de generar la home (para que los links de noticias existan):

```js
  console.log("Generando noticias…");
  generarNoticias();
```

- [ ] **Paso 3: CSS mínimo para noticias**

Agregar al final de `styles.css`:

```css
/* ===== Noticias ===== */
.noticias-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
.tarjeta-nota { border: 1px solid var(--color-borde); border-radius: var(--radio); box-shadow: var(--sombra); overflow: hidden; }
.tarjeta-nota-body { padding: 0.7rem 0.9rem; }
.nota-img { width: 100%; height: 180px; object-fit: cover; display: block; background: var(--color-secundario); }
.nota-meta { font-size: 0.8rem; color: var(--color-texto-suave); display: flex; gap: 0.5rem; align-items: center; }
.nota-cuerpo { line-height: 1.7; }
.archivo-anio { margin-top: 1.5rem; border-bottom: 2px solid var(--color-acento); padding-bottom: 0.2rem; }
@media (min-width: 768px) { .noticias-grid { grid-template-columns: repeat(2, 1fr); } }
```

- [ ] **Paso 4: Rebuild y verificación**

```powershell
node build.js
Test-Path dist\noticias\index.html
Get-ChildItem dist\noticias\*.html | Select-Object Name
# Esperado: index.html + 2 páginas de detalle (slug de cada nota)
# Abrir /noticias/: ingred original separado por año 2026
# Abrir un detalle: título, fecha, badge de categoría, imagen placeholder y 3 párrafos
```

- [ ] **Paso 5: Commit**

```bash
git add templates/noticias-index.html templates/noticia.html build.js assets/css/styles.css
git commit -m "feat: noticias con listado, detalle y archivo por año"
```

---

### Tarea 15: Home — generación estática desde datos

**Archivos:**
- Crear: `templates/index.html`
- Modificar: `build.js`

La home es 100% estática: el build reúne última ronda, próximos partidos, resultados recientes y últimas noticias de las ediciones vigentes.

- [ ] **Paso 1: Crear `templates/index.html`**

```html
<!-- PAGINA: Inicio | Club Atlético Gualeguay | inicio -->
<!-- CONTENIDO_HOME -->
```

- [ ] **Paso 2: Agregar los builders de partidos a `build.js`**

Junto a las funciones auxiliares:

```js
function torneoVigente(categoria) {
  const vigente = leerJSON(path.join(DATA, "sitio.json")).edicionVigente[categoria];
  return leerTorneos().find((t) => t.categoria === categoria && t.edicion === vigente) || null;
}

function nombresDe(torneo) {
  const m = {};
  for (const e of torneo.equipos) m[e.id] = e.nombre;
  return m;
}

function partidoCard(p, nombres) {
  if (p.estado === "pase-libre") return "";
  const eq = (id) => (id ? nombres[id] : "por definir");
  const meta = p.fecha ? `${formatFecha(p.fecha)} ${p.hora} · ${p.cancha}` : "Fecha a definir";
  const res = p.estado === "jugado"
    ? (p.penales
        ? `${p.resultado.golesA}–${p.resultado.golesB} <span class="badge pen">${p.penales.a}-${p.penales.b} pen.</span>`
        : `${p.resultado.golesA}–${p.resultado.golesB}`)
    : "vs";
  return `<div class="tarjeta-partido"><div class="tp-titulo">${meta}</div>` +
    `<div class="tp-fila"><span class="tp-equipo">${eq(p.equipoA)}</span>` +
    `<span class="tp-resultado">${res}</span><span class="tp-equipo">${eq(p.equipoB)}</span></div></div>`;
}

function ultimaRondaPartidos(t) {
  const maxNum = Math.max(...t.rondas.map((r) => r.numero));
  return t.rondas.filter((r) => r.numero === maxNum).flatMap((r) => r.partidos);
}

function proximosPartidos(t, max = 3) {
  return t.rondas.flatMap((r) => r.partidos)
    .filter((p) => p.estado === "por jugar" && p.fecha)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, max);
}

function recientesPartidos(t, max = 3) {
  return t.rondas.flatMap((r) => r.partidos)
    .filter((p) => p.estado === "jugado")
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, max);
}
```

- [ ] **Paso 3: Agregar `generarHome` a `build.js`**

```js
function generarHome() {
  const sitio = leerJSON(path.join(DATA, "sitio.json"));
  const libres = torneoVigente("libres");
  const nombres = libres ? nombresDe(libres) : {};

  let bloqueTorneo = "";
  if (libres) {
    const ultima = ultimaRondaPartidos(libres).map((p) => partidoCard(p, nombres)).join("");
    const proximos = proximosPartidos(libres).map((p) => partidoCard(p, nombres)).join("");
    const recientes = recientesPartidos(libres).map((p) => partidoCard(p, nombres)).join("");
    const urlTorneo = `torneos/${libres.categoria}/${slugEdicion(libres)}/index.html`;
    bloqueTorneo = `
      <section class="page home-grid">
        <article>
          <h2>Última ronda · ${libres.nombre} ${libres.edicion}</h2>
          ${ultima || '<p class="nota-meta">Los cruces se cargan ronda a ronda.</p>'}
          <p><a href="${urlTorneo}">Ver cuadro completo →</a></p>
        </article>
        <article>
          <h2>Próximos partidos</h2>
          ${proximos || '<p class="nota-meta">Todavía no hay partidos programados.</p>'}
        </article>
        <article>
          <h2>Resultados recientes</h2>
          ${recientes || '<p class="nota-meta">Todavía no hay resultados cargados.</p>'}
        </article>
      </section>`;
  } else {
    bloqueTorneo = '<section class="page"><p>Todavía no se cargó el torneo vigente.</p></section>';
  }

  const noticias = leerNoticias().slice(0, 3).map((n) => `
      <article class="tarjeta-nota">
        <div class="tarjeta-nota-body">
          <h3><a href="noticias/${slugNoticia(n)}.html">${escapeHtml(n.titulo)}</a></h3>
          <p class="nota-meta">${formatFecha(n.fecha)}</p>
          <p>${escapeHtml(n.resumen)}</p>
        </div>
      </article>`).join("");
  const bloqueNoticias = `
    <section class="page">
      <h2>Últimas noticias</h2>
      <div class="noticias-grid">${noticias || "<p>Todavía no hay noticias.</p>"}</div>
      <p><a href="noticias/index.html">Ver todas las noticias →</a></p>
    </section>`;

  const hero = `
    <section class="hero">
      <h1>${escapeHtml(sitio.nombre)}</h1>
      <p>${escapeHtml(sitio.ciudad)} — torneos de Fútbol 7, con la doble eliminación por vidas.</p>
      <br>
      <a class="btn" href="torneos/index.html">Ver torneos</a>
    </section>`;

  const plantilla = fs.readFileSync(path.join(TEMPLATES, "index.html"), "utf8");
  const meta = metadataDePlantilla(plantilla);
  const contenido = hero + "\n" + bloqueTorneo + "\n" + bloqueNoticias;
  escribirPagina("index.html", meta.titulo, meta.navActiva, meta.contenido.replace("<!-- CONTENIDO_HOME -->", contenido));
}
```

En `main()`, después de `generarNoticias();`:

```js
  console.log("Generando home…");
  generarHome();
```

> La home ya no usa el `index.html` provisional de la Tarea 5: borrar ese bloque de `main()` al agregar `generarHome()`.

- [ ] **Paso 4: CSS de la grilla de la home**

Agregar al final de `styles.css`:

```css
.home-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-top: 1.5rem; }
@media (min-width: 900px) { .home-grid { grid-template-columns: repeat(3, 1fr); } }
```

- [ ] **Paso 5: Rebuild y verificación**

```powershell
node build.js
# Abrir dist/index.html:
# - Hero con nombre, ciudad y CTA a torneos
# - Última ronda / Próximos / Resultados con datos de libres-26-27
# - Últimas noticias con 2 tarjetas y link al listado
```

- [ ] **Paso 6: Commit**

```bash
git add templates/index.html build.js assets/css/styles.css
git commit -m "feat: home estática con última ronda, próximos, resultados y noticias"
```

---

### Tarea 16: Torneos — presentación y histórico

**Archivos:**
- Crear: `templates/torneos-index.html`
- Modificar: `build.js`

Ruta: `torneos/index.html`. Presenta las dos categorías con la edición vigente destacada y el histórico de ediciones por categoría.

- [ ] **Paso 1: Crear `templates/torneos-index.html`**

```html
<!-- PAGINA: Torneos (Fútbol 7) | Club Atlético Gualeguay | torneos -->
<section class="page">
  <h1>Torneos (Fútbol 7)</h1>
  <p>El club organiza dos torneos por temporada con sistema de doble eliminación por vidas: zona de ganadores con dos vidas y zona de perdedores donde una derrota elimina.</p>
  <!-- CATEGORIAS -->
</section>
```

- [ ] **Paso 2: Agregar `generarTorneosIndex` a `build.js`**

```js
function renderCategoria(categoria, torneos) {
  const nombre = categoria === "libres" ? "Libres" : "Veteranos";
  const lista = torneos.map((t) => {
    const vigente = t.estado === "vigente" ? ' <span class="badge v2">vigente</span>' : "";
    return `<li><a href="${categoria}/${slugEdicion(t)}/index.html">Edición ${t.edicion}</a>${vigente}</li>`;
  }).join("");
  return `<article class="categoria">
    <h2>${nombre}</h2>
    <ul>${lista || "<li>Sin ediciones cargadas.</li>"}</ul>
  </article>`;
}

function generarTorneosIndex() {
  const torneos = leerTorneos();
  const libres = torneos.filter((t) => t.categoria === "libres");
  const veteranos = torneos.filter((t) => t.categoria === "veteranos");
  const plantilla = fs.readFileSync(path.join(TEMPLATES, "torneos-index.html"), "utf8");
  const meta = metadataDePlantilla(plantilla);
  const contenido = meta.contenido.replace("<!-- CATEGORIAS -->",
    renderCategoria("libres", libres) + renderCategoria("veteranos", veteranos));
  escribirPagina("torneos/index.html", meta.titulo, meta.navActiva, contenido);
}
```

En `main()`, después de `generarEdiciones();`:

```js
  console.log("Generando índice de torneos…");
  generarTorneosIndex();
```

- [ ] **Paso 3: Rebuild y verificación**

```powershell
node build.js
Test-Path dist\torneos\index.html
# Abrir /torneos/: dos categorías; Libres con "Edición 26/27 · vigente"; links funcionando
```

- [ ] **Paso 4: Commit**

```bash
git add templates/torneos-index.html build.js
git commit -m "feat: presentación de torneos con histórico de ediciones"
```

---

### Tarea 17: Despliegue — GitHub Actions, Cloudflare Pages y README

**Archivos:**
- Crear: `.github/workflows/deploy.yml`
- Crear: `README.md`

- [ ] **Paso 1: Crear el workflow de GitHub Pages**

`.github/workflows/deploy.yml`:

```yaml
name: Build y deploy a GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: node build.js
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

> El proyecto no usa npm: el workflow solo necesita `node build.js` (sin `npm ci` ni lockfile).

- [ ] **Paso 2: Crear `README.md`**

```markdown
# Club Atlético Gualeguay — sitio institucional

Sitio 100% estático (HTML + CSS + JS vanilla) con generador mínimo en Node sin dependencias. Despliegue gratis en GitHub Pages y Cloudflare Pages.

## Local

- Requisito: Node.js ≥ 18.
- `node build.js` → genera `dist/`.
- `node --test test/` → corre los tests.
- Servir: `npx serve dist` o cualquier HTTP estático.

## Estructura

- `data/sitio.json` — identidad, redes, edición vigente, contacto.
- `data/noticias.json` — noticias (párrafos separados por línea en blanco).
- `data/torneos/<categoria>-<edicion>.json` — una edición por archivo: equipos, rondas (zona `iniciales | ganadores | perdedores`; partido `por jugar | jugado | pase-libre`; penales opcionales) y goleadores.
- `templates/` — layout (partials), páginas manuscritas y plantillas.
- `assets/` — CSS y JS; se copian tal cual a `dist/`.
- `dist/` — salida del build (ver `.gitignore`).

## Cómo cargar un resultado

1. Editar `data/torneos/libres-26-27.json`: `estado: "jugado"`, `resultado: {golesA, golesB}` y `penales` si hubo.
2. `node build.js` → la página de la edición, la home y el cuadro se actualizan.

## Cómo agregar una edición nueva

1. Copiar el JSON anterior a `data/torneos/<categoria>-<edicion-nueva>.json` y ajustar `id`, `edicion` y `estado: "archivo"` en la anterior.
2. Actualizar `edicionVigente` en `data/sitio.json`.
3. `node build.js` → aparece en el selector de ediciones y en Torneos.

## Despliegue

### GitHub Pages (repo público)

1. Crear el repositorio en GitHub y `git push -u origin main`.
2. Settings → Pages → Source: **GitHub Actions**. El workflow en cada push genera `dist/` y publica.

### Cloudflare Pages (gratis)

1. Dashboard → **Pages** → **Create project** → Conectar el repo.
2. Build: comando `node build.js`, directorio de salida `dist/`, rama `main`.
3. Cada push al repo redespliega automáticamente.

> Ambos usan rutas relativas + `.nojekyll` (lo escribe el build), así el sitio funciona igual en las dos plataformas.
```

- [ ] **Paso 3: Rebuild final y prueba de despliegue local**

```powershell
node build.js
node --test test/
# Esperado: todos los tests en verde y build sin errores
```

- [ ] **Paso 4: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "docs: workflow de despliegue y README de mantenimiento"
```

---

### Tarea 18: Verificación final integral

**Archivos:** sin cambios (solo verificación).

- [ ] **Paso 1: Suite de checks automatizados**

```powershell
node --test test/                                  # todos en verde
node build.js                                      # sin errores
node -e "JSON.parse(require('fs').readFileSync('dist/sitio.json'))"  # los datos se copian válidos
```

- [ ] **Paso 2: Chequeo de estructura de `dist/`**

```powershell
Get-ChildItem dist -Recurse -File | Select-Object FullName
# Esperado: index.html, instalaciones.html, contacto.html, 404.html,
# noticias/index.html + detalle(s), torneos/index.html,
# torneos/libres/26-27/, torneos/veteranos/26-27/, data/**, assets/**, .nojekyll
```

- [ ] **Paso 3: Recorrido manual (servidor local)**

```powershell
# Servir dist/ y recorrer con el navegador:
python -m http.server 8080 --directory dist
```

Checklist:

- [ ] Home: hero, última ronda, próximos, resultados, noticias; links correctos
- [ ] Torneos → Libres 26/27: Cuadro (ronda navegable, ganadores/perdedores, penales, bye, badges de vidas), Fixture, Equipos, Goleadores
- [ ] Selector de ediciones en la página de torneo
- [ ] Noticias: listado con archivo por año y detalle
- [ ] Instalaciones y Contacto (formulario → mailto)
- [ ] 404 para rutas inexistentes
- [ ] Mobile (≤375px): hamburguesa, tabs deslizables, sin scroll horizontal
- [ ] Desktop (≥1024px): nav horizontal, grid de home, columnas del cuadro
- [ ] Teclado: tabs y menú operables, foco visible, `Esc` cierra el menú
- [ ] Contraste mínimo de texto sobre fondo (colores del club)

- [ ] **Paso 4: Push final y despliegue**

```bash
git add -A
git commit -m "chore: verificación final del sitio"
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
git push -u origin main
```

- [ ] **Paso 5: Confirmar sitio en línea**

- GitHub Pages: Settings → Pages → Source: GitHub Actions, esperar el primer deploy y abrir la URL.
- Cloudflare Pages: conectar el repo y verificar el primer build.

> Si algo falla en el recorrido, arreglarlo en una tarea surgida de este plan y repetir la verificación.

---

**Definición de completo:** el sitio funciona en local (`node build.js` sin errores, tests en verde) y publicado en al menos una de las dos plataformas, con los datos de ejemplo cargando en las cuatro vistas del torneo. Los datos reales (equipos, colores, escudo, fotos) se cargan después, sin tocar código.