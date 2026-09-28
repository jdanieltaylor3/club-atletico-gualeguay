# Club Atlético Gualeguay — sitio institucional

Sitio 100% estático (HTML + CSS + JS vanilla) con generador mínimo en Node sin dependencias. Despliegue gratis en GitHub Pages y Cloudflare Pages.

## Local

- Requisito: Node.js ≥ 18.
- `node build.js` → genera `dist/`.
- `node --test test/` → corre los tests (usar `node --test` en Windows).
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
2. Actualizar `edicionVigente` en `data/sitio.json` (mismo formato que `edicion`, p. ej. `"26/27"`).
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