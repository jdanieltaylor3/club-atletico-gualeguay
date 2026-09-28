"use strict";
const fs = require("fs");
const path = require("path");
const { leerJSON } = require("./lib/utils.js");
const { assemble } = require("./lib/layout.js");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");
const DATA = path.join(ROOT, "data");
const TEMPLATES = path.join(ROOT, "templates");
const ASSETS = path.join(ROOT, "assets");

function cleanDist() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}

function copiarAssets() {
  fs.cpSync(ASSETS, path.join(DIST, "assets"), { recursive: true });
}

function escribirPagina(rutaRel, titulo, navActiva, contenidoHtml) {
  const sitio = leerJSON(path.join(DATA, "sitio.json"));
  const dirs = rutaRel.split("/").slice(0, -1).filter(Boolean);
  const assetsRoot = dirs.map(() => "../").join("");
  const html = assemble({
    titulo,
    contenido: contenidoHtml,
    navActiva,
    anio: new Date().getFullYear(),
    assetsRoot,
    redes: sitio.redes,
  });
  fs.mkdirSync(path.dirname(path.join(DIST, rutaRel)), { recursive: true });
  fs.writeFileSync(path.join(DIST, rutaRel), html, "utf8");
  console.log("  →", rutaRel);
}

function main() {
  console.log("Limpiando dist/ …");
  cleanDist();
  console.log("Copiando assets …");
  copiarAssets();
  fs.writeFileSync(path.join(DIST, ".nojekyll"), "", "utf8");

  console.log("Generando páginas …");
  escribirPagina(
    "index.html",
    "Inicio | Club Atlético Gualeguay",
    "inicio",
    '<section class="hero"><h1>Club Atlético Gualeguay</h1><p>Sitio en construcción.</p></section>'
  );

  console.log("Build OK ✔");
}

main();