// Helpers de texto y fecha. Módulo puro: lo usan el build, el navegador y las pruebas.
// Vive aparte de lib/utils.js (que toca el disco) para poder servirse al navegador.

export function escapeHtml(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// "Club Atlético Gualeguay 26/27" -> "club-atletico-gualeguay-26-27"
export function slugify(texto) {
  return String(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

// "2026-10-03" -> "3 de octubre de 2026"
export function formatFecha(iso) {
  const [a, m, d] = String(iso).split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}
