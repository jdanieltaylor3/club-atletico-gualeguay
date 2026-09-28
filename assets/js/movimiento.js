// Entradas de contenido al hacer scroll (módulo ES, no toca el DOM global).
// Principios:
//   - solo transform + opacity, y una sola vez por elemento;
//   - si el usuario pide menos movimiento (prefers-reduced-motion) no se
//     oculta nada, todo queda visible directamente;
//   - si no hay IntersectionObserver, tampoco se oculta nada;
//   - la clase .js-reveal en <html> marca que este JS está activo: el CSS
//     solo oculta [data-reveal] bajo esa clase, así sin JS no hay "flash".

const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const soportaObserver = "IntersectionObserver" in window;
const revelables = document.querySelectorAll("[data-reveal]");

if (!reduce && soportaObserver && revelables.length) {
  document.documentElement.classList.add("js-reveal");

  const observador = new IntersectionObserver(
    (entradas) => {
      for (const entrada of entradas) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visible");
          observador.unobserve(entrada.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
  );

  // Stagger acotado a 4 pasos: el CSS lo resuelve con var(--reveal-i).
  revelables.forEach((el, i) => {
    el.style.setProperty("--reveal-i", String(Math.min(i, 4)));
    observador.observe(el);
  });
}