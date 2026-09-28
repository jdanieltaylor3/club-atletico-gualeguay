"use strict";
const fs = require("fs");
const path = require("path");
const { escapeHtml } = require("./utils.js");

const PARTIALS_DIR = path.join(__dirname, "..", "templates", "partials");
const cache = {};
function partial(nombre) {
  if (!cache[nombre]) {
    cache[nombre] = fs.readFileSync(path.join(PARTIALS_DIR, nombre), "utf8");
  }
  return cache[nombre];
}

function renderRedes(redes) {
  return (redes || [])
    .map((r) => `<a class="social-link" href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.icono)}</a>`)
    .join("");
}

function assemble(opts) {
  const { titulo, contenido, navActiva = "", anio, assetsRoot = "", redes = [] } = opts;
  const redesHtml = renderRedes(redes);
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
    contenido +
    rellenar(partial("_footer.html")) +
    rellenar(partial("_scripts.html"))
  );
}

module.exports = { assemble, renderRedes };