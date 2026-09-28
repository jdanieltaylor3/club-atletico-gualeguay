// Ensamblado de la página: partials + contenido de la plantilla.
// Solo Node (lee del disco). No se copia a dist/.

import path from "node:path";
import { escapeHtml } from "./texto.js";
import { leerTexto } from "./utils.js";

const PARTIALS_DIR = path.join(import.meta.dirname, "..", "templates", "partials");

const cache = {};
function partial(nombre) {
  if (!cache[nombre]) cache[nombre] = leerTexto(path.join(PARTIALS_DIR, nombre));
  return cache[nombre];
}

// Los enlaces a redes se pintan con el logo de la red (icono = ruta relativa
// a la raíz del sitio) y el nombre queda en aria-label: la imagen lleva alt
// vacío para que el lector de pantalla no lo anuncie dos veces.
export function renderRedes(redes, assetsRoot = "") {
  return (redes || [])
    .map(
      (r) =>
        `<a class="social-link" href="${escapeHtml(r.url)}" target="_blank" rel="noopener" aria-label="${escapeHtml(r.nombre)}">` +
        `<img class="social-icon" src="${escapeHtml(assetsRoot + r.icono)}" alt="" width="24" height="24">` +
        `</a>`
    )
    .join("");
}

export function assemble(opts) {
  const { titulo, contenido, navActiva = "", anio, assetsRoot = "", redes = [] } = opts;
  const redesHtml = renderRedes(redes, assetsRoot);
  // Los marcadores se resuelven en todo el documento, no solo en los partials:
  // así una plantilla puede usar <!-- ASSETS_ROOT --> sin fijar rutas a mano.
  const rellenar = (html) =>
    html
      .replace(/<!-- ASSETS_ROOT -->/g, assetsRoot)
      .replace(/<!-- REDES -->/g, redesHtml)
      .replace(/<!-- ANIO -->/g, String(anio))
      .replace(/<!-- TITULO -->/g, escapeHtml(titulo))
      .replace(/\{\{ACTIVO:(\w+)\}\}/g, (_, id) => (id === navActiva ? " on" : ""));
  return (
    rellenar(partial("_head.html")) +
    rellenar(partial("_header.html")) +
    rellenar(contenido) +
    rellenar(partial("_footer.html")) +
    rellenar(partial("_scripts.html"))
  );
}

// Lee una plantilla de templates/ y separa su metadata del contenido:
//   <!-- PAGINA: Título | nav-activa -->
export function parsearPlantilla(html) {
  const m = html.match(/^<!-- PAGINA: (.+) \| ([a-z0-9]*) -->\s*\n/i);
  if (!m) throw new Error("Falta metadata <!-- PAGINA: título | nav --> en la plantilla");
  return { titulo: m[1].trim(), navActiva: m[2].trim(), contenido: html.replace(m[0], "") };
}
