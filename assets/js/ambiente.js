// Capa ambiente del fondo: dos brillos suaves que se desplazan muy lento al
// hacer scroll (parallax). Módulo ES, sin dependencias.
//
// Sigue las reglas del sistema de movimiento del sitio:
//   - solo transform: se escribe una variable CSS y el CSS la aplica, así el
//     navegador no recalcula estilos en cada scroll;
//   - el scroll se pide con requestAnimationFrame y se escucha como pasivo;
//   - prefers-reduced-motion desactiva el efecto: la capa queda en su sitio;
//   - sin JS la capa sigue siendo visible: no se oculta nada.

const capa = document.querySelector(".ambiente");
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Cuánto baja la capa en todo el recorrido de una pantalla larga. Es
// deliberadamente chico (6% del scroll, tope de 90px): se percibe como
// profundidad, no como movimiento.
const FACTOR = 0.06;
const TOPE = 90;

if (capa && !reduce) {
  let pedido = false;

  function pintar() {
    pedido = false;
    const y = Math.min(window.scrollY * FACTOR, TOPE);
    capa.style.setProperty("--amb-y", `${y.toFixed(1)}px`);
  }

  function pedir() {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(pintar);
  }

  window.addEventListener("scroll", pedir, { passive: true });
  window.addEventListener("resize", pedir, { passive: true });
  pedir();
}
