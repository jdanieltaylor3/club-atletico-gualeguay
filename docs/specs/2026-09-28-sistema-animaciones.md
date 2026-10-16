# Sistema de animaciones — diseño

Fecha: 2026-09-28 · Sitio estático del Club Atlético Gualeguay (dist/ generado por `node build.js`)

## Objetivo y criterio

Micro-interacciones y entradas profesionales que refuercen la identidad
institucional y la navegación, **sin** sobrecargar la página y respetando
rendimiento, accesibilidad y lectura de información deportiva. Por defecto no
hay animaciones permanentes; las excepciones son el fondo azul de Noticias, los
fondos lisos de Instalaciones y Contacto y el marco amarillo que gira en las
tarjetas del sitio (ver más abajo).

Estética buscada: institucional + deportiva + moderna + dinámica + elegante.

## Principios vinculantes

1. **Solo `transform` y `opacity`** en entradas, scroll y las animaciones
   permanentes. Excepción acotada: algunos controles interpolan
   `border-color`/`box-shadow` en el hover (pintada leve sobre pocos elementos,
   solo durante el hover; sin reflow).
2. **Nada permanente por defecto**: cada animación ocurre una vez (entrada,
   anillo v2) o es un ken-burns de 26-30 s que no compite con la lectura (hero,
   detalle de nota y el póster que reemplaza al video en celular). Las
   excepciones son el fondo azul de Noticias (deriva muy lento, también en el
   detalle de cada nota), el fondo con video de la home (se reproduce solo en PC
   y mientras la sección se ve; en celular no se descarga, ver P3), los fondos
   lisos de Instalaciones y Contacto (focos que derivan lento, ver P4) y el marco
   amarillo de las tarjetas: el de las notas gira lento (12 s) y acelera con el
   hover; el de partidos y equipos queda quieto en reposo (pueden ser muchas
   juntas) y gira al pasar el mouse. Todo se apaga con
   `prefers-reduced-motion`.
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
| E4 | Hero | Home: escudo marca de agua (260 px, 12 %) con ken-burns. Instalaciones y Contacto: fondo liso propio con focos que derivan lento (ver P4). Entrada escalonada h1/p/btn |
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
| P2 | Marco amarillo de las tarjetas | `.tarjeta-nota` y `.tarjeta-partido` comparten dos pseudos: el `::before` (gradiente cónico amarillo, `z-index:-2`) queda detrás del `::after` (superficie recortada 3 px, `z-index:-1`), así solo se ve el anillo. En las tarjetas de nota el `::before` gira 12 s (hover/foco acelera a 3 s); en las de partido y equipo queda pausado en reposo y gira a 3 s al pasar el mouse. |
| P3 | Fondo con video de la home | `.seccion-video` + `.video-fondo` (layout.css) y `assets/js/fondo-video.js`: en PC el clip `cancha-largo.mp4` (720×1280, 20 fps, 406 kb/s ≈ 717 KB) se reproduce mientras la sección se ve y se pausa al salir (IntersectionObserver). Sin autoplay y con `preload="none"`, el archivo no se pide hasta que hace falta. En celular (≤767 px) el video queda `display:none`, el JS lo descarta antes de observarlo —no se hace ninguna petición del mp4— y el `::before` muestra el póster (un fotograma real del clip, ~56 KB) con un ken-burns de 26 s. Con `prefers-reduced-motion` tampoco corre ni se descarga. |
| P4 | Fondos lisos de Instalaciones y Contacto | `.fondo-liso` (layout.css) + variantes: cada sección lleva un campo de color propio sin fotos —azul del escudo con un foco amarillo en el hero de Instalaciones (`.fondo-cancha`), azul marino en su contenido (`.fondo-sede`), corona ámbar en el hero de Contacto (`.fondo-contacto`) y grafito en su contenido (`.fondo-redes`)— con focos que derivan 27-46 s (misma técnica que P1: base en `::before`, brillos en `::after`; solo transform/opacidad). La sección es full-width y se estira hasta el pie; con `prefers-reduced-motion` queda un campo liso y quieto. |

### 4. Opcionales (descartadas por criterio del usuario)

- Transición fade entre páginas (riesgo de parpadeo + complejidad en estático).
- Contadores animados (no hay métricas vivas).
- Stagger con rotación en grillas (excesivo).
- Cualquier otro pulso o movimiento permanente fuera de P1/P2/P3/P4 (fuera por criterio).

## Archivos tocados

- `assets/css/tokens.css` — tokens de movimiento, `--font-titulo` (Space Grotesk, para el kicker de sección y la dirección de Instalaciones) y `--font-numeros` (Rye, para los títulos de sección y los números de cartel).
- `assets/css/base.css` — reduced-motion ampliado (transiciones + animaciones).
- `assets/css/layout.css` — hero (E4), menú móvil (E3), sistema de movimiento (E1/E2), fondo azul de Noticias (P1), fondo con video y su póster animado en celular (P3) y los fondos lisos de Instalaciones y Contacto (P4).
- `assets/css/components.css` — hover de tarjetas (R1), anillo v2 (R2), título del listado y marco amarillo de las tarjetas (P2).
- `assets/js/movimiento.js` — nuevo: observador de entradas.
- `assets/js/fondo-video.js` — reproduce el clip solo mientras la sección se ve; ignora el video oculto en celular (así no se descarga).
- `assets/video/cancha-largo.mp4` — recomprimido para PC: 1080×1920/26 fps/2,22 MB → 720×1280/20 fps/717 KB (PSNR ≈ 39,7 dB, SSIM ≈ 0,97).
- `assets/js/torneo.js` — re-disparo de `vista-anim` al re-renderizar.
- `templates/partials/_scripts.html` — carga el módulo nuevo.
- `templates/partials/_head.html` — familias Space Grotesk (kicker de sección) y Rye (títulos y números de cartel).
- `templates/noticias-index.html` — listado a pantalla completa dentro de `.seccion-noticias`.
- `templates/noticia.html` — el detalle vive en `.seccion-noticias` (mismo fondo azul).
- `templates/instalaciones.html` y `templates/contacto.html` — secciones full-width con `.fondo-liso` y su variante (P4); cada `.page` adentro centra el contenido. Los títulos de sección llevan el kicker con dato real. Instalaciones suma los bloques editoriales `.inst` (El predio, con el plano cenital y una tarjeta de servicios con el marco amarillo animado; Horarios, con los números en `--font-numeros`; y Ubicación).
- `assets/img/predio-aereo.jpg` — foto aérea del predio, con las entradas, la cantina y los baños señalizados, para la sub-sección El predio (el original sin optimizar vive en `recursos/`, fuera del repo).
- `build.js` — `data-reveal` en tarjetas y `.nota-media` envolviendo la foto de la tarjeta.
- `assets/img/hero-club.png` → renombrado `assets/img/foto-club.png` (foto del frente del club). Ya no se usa: el hero de Contacto pasó al fondo liso (P4).

## Verificación

- `node build.js` + `node --test` (110/110).
- Navegador: hero de home y contacto, aparición de tarjetas al scrollear,
  apertura/cierre del menú móvil, cambio de pestaña/ronda con `vista-anim`,
  anillo v2. Listado y detalle de Noticias con el fondo azul; marco girando en
  el listado y el detalle, y al pasar el mouse en la grilla de Equipos; el hover
  de una tarjeta de nota no deja que la imagen tape el marco. Sin desborde
  horizontal a 1280, 900 y
  390 px. Bajo `prefers-reduced-motion` (emulando en DevTools) debe verse todo
  estático y visible.
- Video (P3): en PC el clip se reproduce al entrar en viewport y se pausa al
  salir; en celular no se hace ninguna petición del mp4 (se ve el póster con
  ken-burns) y con `prefers-reduced-motion` tampoco se descarga.
- Fondos lisos (P4): Instalaciones y Contacto muestran un campo propio por
  sección (sin fotos ni escudo) con sus focos derivando; la sección llega hasta
  el pie y, con `prefers-reduced-motion`, queda quieta. Sin desborde horizontal
  a 1280, 900 y 390 px.