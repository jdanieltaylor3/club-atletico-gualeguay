// Comportamiento general del sitio (todas las páginas).
// Módulo ES: sin variables globales, el scope es este archivo.

const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

if (toggle && nav) {
  const abrirMenu = (abierto) => {
    nav.classList.toggle("open", abierto);
    toggle.setAttribute("aria-expanded", String(abierto));
    toggle.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  };

  const estaAbierto = () => nav.classList.contains("open");

  toggle.addEventListener("click", () => abrirMenu(!estaAbierto()));

  // Al navegar a otra página dentro del sitio, el menú se cierra solo.
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) abrirMenu(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") abrirMenu(false);
  });
}
