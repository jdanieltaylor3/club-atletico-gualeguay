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