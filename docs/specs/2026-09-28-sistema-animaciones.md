# Sistema de animaciones — diseño

Fecha: 2026-09-28 · Sitio estático del Club Atlético Gualeguay (dist/ generado por `node build.js`)

## Objetivo y criterio

Micro-interacciones y entradas profesionales que refuercen la identidad
institucional y la navegación, **sin** sobrecargar la página y respetando
rendimiento, accesibilidad y lectura de información deportiva. Por defecto no
hay animaciones permanentes; las excepciones son el fondo azul de Noticias y el
marco amarillo que gira en las tarjetas del sitio (ver más abajo).

Estética buscada: institucional + deportiva + moderna + dinámica + elegante.

## Principios vinculantes

1. **Solo `transform` y `opacity`** en entradas, scroll y las animaciones
   permanentes. Excepción acotada: algunos controles interpolan
   `border-color`/`box-shadow` en el hover (pintada leve sobre pocos elementos,
   solo durante el hover; sin reflow).
2. **Nada permanente por defecto**: cada animación ocurre una vez (entrada,
   anillo v2) o es un ken-burns de 26-30 s que no compite con la lectura. Las
   excepciones son el fondo azul de Noticias (deriva muy lento, también en el
   detalle de cada nota) y el marco amarillo de las tarjetas del sitio, que gira
   lento (12 s) y se acelera en el hover de las tarjetas que son enlace. Todo se
   apaga con `prefers-reduced-motion`.
3. **Scroll = IntersectionObserver**, un solo disparo por elemento, con
   `unobserve()`. Fuera de viewport no hay animación en curso.
4. **`prefers-reduced-motion: reduce`** apaga transiciones y animaciones
   (base.css) y el JS no observa (movimiento.js).
5. **Sin JavaScript, nada se oculta**: el CSS solo aplica el estado oculto
   bajo `html.js-reveal` (clase que agrega el JS), así no hay flash ni
   contenido invisible si el JS no corre.
6. **Tiempos** no bloqueantes: hover 160 ms, estado 220 ms, entradas 500 ms
   (stagger max. 240 ms), ken-burns 26-30 s.

## Tokens nuevos (tokens.css)

- `--dur-medio: 220ms` — cambios de estado (menú, panel, hover de tarjetas).
- `--dur-entrada: 500ms` — entradas de contenido.
- `--ease-entrada: cubic-bezier(0.2, 0.7, 0.3, 1)` — salida suave estándar.

## Clasificación y estado

### 1. Esenciales (implementadas)

| ID | Animación | Cómo |
|----|-----------|------|
| E1 | Aparición progresiva de secciones/cards al entrar en viewport | `[data-reveal]` + `assets/js/movimiento.js` (IntersectionObserver, stagger `--reveal-i` cortado en 4) |
| E2 | Transición del panel del torneo al cambiar pestaña/ronda | `#vista-torneo.vista-anim` re-disparada en `torneo.js` tras cada render |
| E3 | Menú móvil animado | `opacity` + `translateY(-4px)` + `visibility` diferida en `.site-nav` (ya no usa `display`) |
| E4 | Hero | Home: escudo marca de agua (260 px, 12 %) con ken-burns. Contacto: foto del frente del club completa (`contain`) con overlay y ken-burns. Entrada escalonada h1/p/btn |
| E5 | `prefers-reduced-motion` | base.css mata transiciones y animaciones; movimiento.js chequea `matchMedia` y no observa |

### 2. Recomendadas (implementadas)

| ID | Animación | Cómo |
|----|-----------|------|
| R1 | Hover de tarjetas de nota (listado y home) | lift `-2px` y el marco se acelera; la imagen escala 1.04 dentro de `.nota-media`, que la recorta para no tapar el marco |
| R2 | Badges verdes (GAN. y "vigente") | anillo `::after` (transform+opacity) que se expande y desvanece una sola vez, 2.2 s |

### 3. Permanentes (excepción acotada)

| ID | Animación | Cómo |
|----|-----------|------|
| P1 | Fondo azul de Noticias | `.seccion-noticias` (layout.css): azul propio con halos y textura; el `::after` deriva 28 s alternando (`translate3d`+`scale`+`opacity`). Se usa en el listado y en el detalle de cada nota. |
| P2 | Marco amarillo de las tarjetas | `.tarjeta-nota` y `.tarjeta-partido` comparten dos pseudos: el `::before` (gradiente cónico amarillo, `z-index:-2`) queda detrás del `::after` (superficie recortada 3 px, `z-index:-1`), así solo se ve el anillo. El `::before` gira 12 s; en las tarjetas de nota el hover/foco acelera a 3 s. |

### 4. Opcionales (descartadas por criterio del usuario)

- Transición fade entre páginas (riesgo de parpadeo + complejidad en estático).
- Contadores animados (no hay métricas vivas).
- Stagger con rotación en grillas (excesivo).
- Cualquier otro pulso o movimiento permanente fuera de P1/P2 (fuera por criterio).

## Archivos tocados

- `assets/css/tokens.css` — tokens de movimiento y `--font-titulo` (Space Grotesk).
- `assets/css/base.css` — reduced-motion ampliado (transiciones + animaciones).
- `assets/css/layout.css` — hero (E4), menú móvil (E3), sistema de movimiento (E1/E2) y fondo azul de Noticias (P1).
- `assets/css/components.css` — hover de tarjetas (R1), anillo v2 (R2), título del listado y marco amarillo de las tarjetas (P2).
- `assets/js/movimiento.js` — nuevo: observador de entradas.
- `assets/js/torneo.js` — re-disparo de `vista-anim` al re-renderizar.
- `templates/partials/_scripts.html` — carga el módulo nuevo.
- `templates/partials/_head.html` — familia Space Grotesk para el título de Noticias.
- `templates/noticias-index.html` — listado a pantalla completa dentro de `.seccion-noticias`.
- `templates/noticia.html` — el detalle vive en `.seccion-noticias` (mismo fondo azul).
- `build.js` — `data-reveal` en tarjetas y `.nota-media` envolviendo la foto de la tarjeta.
- `assets/img/hero-club.png` → renombrado `assets/img/foto-club.png` (foto del frente del club en el hero de contacto).

## Verificación

- `node build.js` + `node --test` (110/110).
- Navegador: hero de home y contacto, aparición de tarjetas al scrollear,
  apertura/cierre del menú móvil, cambio de pestaña/ronda con `vista-anim`,
  anillo v2. Listado y detalle de Noticias con el fondo azul; marco girando en
  el listado, el detalle y la grilla de Equipos; el hover de una tarjeta de nota
  no deja que la imagen tape el marco. Sin desborde horizontal a 1280, 900 y
  390 px. Bajo `prefers-reduced-motion` (emulando en DevTools) debe verse todo
  estático y visible.