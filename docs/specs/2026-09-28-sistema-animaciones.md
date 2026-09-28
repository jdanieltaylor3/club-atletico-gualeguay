# Sistema de animaciones — diseño

Fecha: 2026-09-28 · Sitio estático del Club Atlético Gualeguay (dist/ generado por `node build.js`)

## Objetivo y criterio

Micro-interacciones y entradas profesionales que refuercen la identidad
institucional y la navegación, **sin** sobrecargar la página, **sin**
animaciones permanentes y respetando rendimiento, accesibilidad y lectura
de información deportiva.

Estética buscada: institucional + deportiva + moderna + dinámica + elegante.

## Principios vinculantes

1. **Solo `transform` y `opacity`** en entradas y scroll. Excepción acotada:
   hover de tarjetas interpola `border-color`/`box-shadow` (pintada leve sobre
   pocos elementos, solo durante el hover; sin reflow).
2. **Nada permanente**: cada animación ocurre una vez (entrada, anillo v2) o
   es un ken-burns de 26–30 s que no compite con la lectura.
3. **Scroll = IntersectionObserver**, un solo disparo por elemento, con
   `unobserve()`. Fuera de viewport no hay animación en curso.
4. **`prefers-reduced-motion: reduce`** apaga transiciones y animaciones
   (base.css) y el JS no observa (movimiento.js).
5. **Sin JavaScript, nada se oculta**: el CSS solo aplica el estado oculto
   bajo `html.js-reveal` (clase que agrega el JS), así no hay flash ni
   contenido invisible si el JS no corre.
6. **Tiempos** no bloqueantes: hover 160 ms, estado 220 ms, entradas 500 ms
   (stagger max. 240 ms), ken-burns 26–30 s.

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
| R1 | Hover de tarjetas (noticias, categorías) | lift `-3px` + borde + sombra; imagen escala 1.04 dentro del `overflow:hidden` de `.tarjeta-nota` |
| R2 | Badge "2ª vida" (v2) | anillo `::after` (transform+opacity) que se expande y desvanece una sola vez, 2.2 s |

### 3. Opcionales (descartadas por criterio del usuario)

- Transición fade entre páginas (riesgo de parpadeo + complejidad en estático).
- Contadores animados (no hay métricas vivas).
- Stagger con rotación en grillas (excesivo).
- Cualquier pulso o movimiento permanente (fuera por criterio).

## Archivos tocados

- `assets/css/tokens.css` — tokens de movimiento.
- `assets/css/base.css` — reduced-motion ampliado (transiciones + animaciones).
- `assets/css/layout.css` — hero (E4), menú móvil (E3), sistema de movimiento (E1/E2).
- `assets/css/components.css` — hover de tarjetas (R1), anillo v2 (R2).
- `assets/js/movimiento.js` — nuevo: observador de entradas.
- `assets/js/torneo.js` — re-disparo de `vista-anim` al re-renderizar.
- `templates/partials/_scripts.html` — carga el módulo nuevo.
- `build.js` — `data-reveal` en tarjetas de la home, noticias, categorías y contacto.
- `assets/img/hero-club.png` → renombrado `assets/img/foto-club.png` (foto del frente del club en el hero de contacto).

## Verificación

- `node build.js` + `node --test` (98/98).
- Navegador: hero de home y contacto, aparición de tarjetas al scrollear,
  apertura/cierre del menú móvil, cambio de pestaña/ronda con `vista-anim`,
  anillo v2. Bajo `prefers-reduced-motion` (emulando en DevTools) debe verse
  todo estático y visible.