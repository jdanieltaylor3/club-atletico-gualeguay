# Estrategia de subida a GitHub y despliegue del sitio

> Documento de referencia para el momento de publicar el sitio. **Nada de esto se ejecuta todavía**: el repositorio remoto no existe ni se configuró, y el plan es terminar la validación local primero.
> Cuando llegue el momento, seguí esta guía paso a paso desde la carpeta del proyecto (`C:\Users\jose_\OneDrive\Documentos\Proyecto predeterminado`).

## Estado actual del proyecto (resumen)

- Repositorio git local en rama `main`, historial lineal y limpio (16 commits de implementación + spec + plan).
- Identidad de commits ya configurada: `Jose Daniel Taylor <jdanieltaylor3@gmail.com>`.
- `dist/` NO se versiona (está en `.gitignore`); lo genera el workflow en CI y lo publica GitHub Pages.
- El workflow `.github/workflows/deploy.yml` corre `node --test` (validación) + `node build.js` en cada push a `main`.
- No hacen falta secretos ni tokens: GitHub Pages usa OIDC y el `id-token` del propio workflow.

---

## Paso 0 — Precondiciones

1. Usuario de GitHub con acceso web (o GitHub CLI `gh` instalado).
2. Nombre de repo sugerido: `club-atletico-gualeguay` (público → Pages gratis sin límites de banda).
3. Tener a mano la URL del sitio esperada: `https://<USUARIO>.github.io/club-atletico-gualeguay/`.

> Si el nombre del usuario o del repo fuera otro, solo cambia la URL de Pages, no el código: las rutas son relativas y sirven igual bajo cualquier subruta o dominio.

---

## Paso 1 — Crear el repositorio en GitHub

### Opción A: con GitHub CLI (`gh`)

```powershell
gh auth login
gh repo create club-atletico-gualeguay --public --source . --remote origin --push
```

El `--push` hace exactamente el push inicial de `main`. (Si preferís pushear manualmente, omití `--push` y hacé el Paso 2.)

### Opción B: desde la web (sin instalar nada)

1. `github.com` → **New repository**.
2. Nombre: `club-atletico-gualeguay` · Visibilidad: **Public**.
3. **No inicializar** con README, `.gitignore` ni licencia (el repo ya tiene todo).
4. En local, conectar y pushear:

```powershell
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH     # si git no se reconoce
git remote add origin https://github.com/<USUARIO>/club-atletico-gualeguay.git
git push -u origin main
```

> El `-u` deja `main` como la rama de seguimiento: de ahí en más cada actualización es `git push`.

---

## Paso 2 — Activar GitHub Pages

1. Repo → **Settings** → **Pages** (columna izquierda).
2. **Build and deployment → Source**: elegir **GitHub Actions** (¡no "Deploy from a branch"!).
3. No hace falta más configuración: el workflow `deploy.yml` ya está en el repo y se dispara con cada push a `main`.

En **Actions** vas a ver el run **"Build y deploy a GitHub Pages"** que:
1. `node --test` → corre los 8 tests (falla el deploy si algo se rompe).
2. `node build.js` → genera `dist/`.
3. Sube `dist/` como artefacto y `actions/deploy-pages` lo publica.

Cuando el run termine en ✓, el sitio queda en línea en:
`https://<USUARIO>.github.io/club-atletico-gualeguay/`

---

## Paso 3 — Validación post-despliegue (checklist)

- [ ] Abrir la raíz: hero, última ronda / próximos / resultados / noticias con estilo.
- [ ] `Torneos → Libres 26/27`: las 4 pestañas (Cuadro, Fixture, Equipos, Goleadores) cargan el JSON por `fetch`.
- [ ] Una noticia de detalle y el listado con archivo por año.
- [ ] `Instalaciones` y `Contacto` (datos y redes, sin formulario).
- [ ] Ruta inexistente → página 404 personalizada (GitHub Pages la toma de `404.html`).
- [ ] Consola del navegador: **cero errores** (en especial nada de 404 de `assets/` ni de los JSON).
- [ ] Probar en celu (ancho ≤375px): hamburguesa, tabs deslizables, sin scroll horizontal.
- [ ] El favicon/escudo cargando en el header.

---

## Paso 4 — Cloudflare Pages (opcional, gratis, segunda red)

1. Dashboard Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** (o **Upload assets**).
2. Autorizar el acceso al repo `club-atletico-gualeguay`.
3. Configuración del build:
   - Build command: `node build.js`
   - Build output directory: `dist`
   - Production branch: `main`
4. Cada push a `main` redespliega (igual que GitHub Pages).

Queda en `https://club-atletico-gualeguay.pages.dev`.

> El sitio usa rutas relativas + `.nojekyll`, así que funciona idéntico en las dos plataformas sin tocar el código.

---

## Paso 5 — Actualizaciones futuras (el flujo diario)

Cualquier cambio de contenido (resultados, equipos, noticias, edición vigente) sigue siempre el mismo patrón:

```powershell
# 1) editar los JSON en data/ (o templates/ si es estructura)
node build.js                         # 2) comprobar en local (dist/)
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
git add -A
git commit -m "feat: resultados de la fecha"
git push origin main                  # 3) GitHub Actions despliega solo
```

No hace falta tocar `dist/`, ni idealmente `git push --force` en main, ni generar PRs para contenido.

---

## Paso 6 — Rollback (si algo sale mal)

- **GitHub Actions**: en la pestaña Actions, re-ejecutar (`Re-run jobs`) el último run que terminó en ✓; o `git revert` del commit problemático y push (cuidado con los mensajes de los commits si el contenido es de datos, conviene un `commit` nuevo).
- **Cloudflare Pages**: pestaña **Deployments** → menú contextual del deploy bueno → **Rollback to this deployment**.
- En local, siempre se puede regenerar y verificar antes de pushear (es el flujo del Paso 5).

---

## Paso 7 — Dominio personalizado (fase posterior, solo si el club tiene dominio)

1. En GitHub: Settings → Pages → **Custom domain** → agregar `www.clubgualeguay.com.ar` (o el que sea) y **Save** (esto crea un commit con el `CNAME`).
2. En el DNS del dominio: registros `CNAME` hacia `<USUARIO>.github.io` (o reglas DNS de Cloudflare apuntando al proyecto Pages).
3. Activar **Enforce HTTPS**.

> Recomendación: no hacer esto en el primer despliegue; primero estabilizar en las URL gratuitas.

---

## Cosas que NO se tocan

- `dist/` (generado), `node_modules` (no existe) y `.opencode/` están ignorados por git.
- El workflow no necesita secretos.
- No convertir el sitio a framework ni agregar dependencias: el zero-dependency es lo que lo mantiene gratis, simple y replicable.