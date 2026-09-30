// Comportamiento del header (todas las páginas).
// Módulo ES: sin variables globales, el scope es este archivo.
//
// Dos cosas, o nada si el navegador no coopera:
//   1. "is-stuck": cuando la cabecera se despega del hero, aparece la regla
//      de 3 px del club bajo ella (estilo en css/layout.css).
//   2. En móvil, al bajar se esconde y al subir vuelve. Lo contrario de un
//      menú clásico: el contenido es el protagonista y la cabecera responde.
//
// Respetos del proyecto:
//   - Sin JS la cabecera queda siempre visible: las clases solo las agrega
//     este archivo, ninguna está en el HTML.
//   - Con prefers-reduced-motion no se esconde nunca y no hay transición
//     (base.css ya apaga las transiciones); solo queda is-stuck, que no es
//     movimiento sino un estado.
//   - Al mover la cabecera solo se usa transform (translateY), nunca display.
//   - Mientras el menú está abierto no se esconde: no hay forma de volver a
//     abrir una cabecera que está afuera de la pantalla.

const header = document.querySelector(".site-header");
const nav = document.querySelector(".site-nav");

if (header) {
  const movil = window.matchMedia("(max-width: 767px)");
  const movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Límite para esconderse: no vale la pena ocultarlo si apenas bajaste de
  // la portada; el header vuelve aunque el movimiento sea mínimo.
  const UMBRAL = 120;

  let ultimoY = window.scrollY;
  let enEspera = false;

  const menuAbierto = () => nav ? nav.classList.contains("open") : false;

  const actualizar = () => {
    enEspera = false;
    const y = window.scrollY;

    header.classList.toggle("is-stuck", y > 0);

    // El ocultado es solo móvil, sin movimiento reducido y con el menú
    // cerrado. Si no es el caso, la cabecera está visible siempre.
    if (movil.matches && !movimientoReducido.matches && !menuAbierto()) {
      if (y > ultimoY && y > UMBRAL) header.classList.add("oculto");
      else header.classList.remove("oculto");
    } else {
      header.classList.remove("oculto");
    }

    ultimoY = y;
  };

  // Se encola un solo calculo por frame: el scroll tira mas eventos que
  // frames y no hace falta procesar los intermedios.
  window.addEventListener("scroll", () => {
    if (enEspera) return;
    enEspera = true;
    requestAnimationFrame(actualizar);
  }, { passive: true });

  // Al abrir el menú la cabecera debe aparecer aunque estés bajando.
  document.addEventListener("click", (e) => {
    if (e.target.closest(".nav-toggle")) header.classList.remove("oculto");
  });

  // Al pasar de móvil a escritorio se limpia el estado oculto: un header
  // escondido que nunca vuelve porque nadie scrollea arriba es un bug.
  const alCambiarAncho = () => {
    if (!movil.matches) header.classList.remove("oculto");
  };
  movil.addEventListener("change", alCambiarAncho);

  actualizar();
}