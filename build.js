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

function copiarDatos() {
  fs.cpSync(path.join(ROOT, "data"), path.join(DIST, "data"), { recursive: true });
}

function leerTorneos() {
  const carpeta = path.join(DATA, "torneos");
  return fs.readdirSync(carpeta)
    .filter((f) => f.endsWith(".json"))
    .map((f) => leerJSON(path.join(carpeta, f)))
    .sort((a, b) => (a.categoria === b.categoria ? b.edicion.localeCompare(a.edicion) : a.categoria.localeCompare(b.categoria)));
}

function slugEdicion(torneo) {
  return torneo.edicion.replace("/", "-");
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

function metadataDePlantilla(html) {
  const m = html.match(/^<!-- PAGINA: (.+) \| ([a-z0-9]*) -->\s*\n/i);
  if (!m) throw new Error("Falta metadata <!-- PAGINA: título | nav --> en la plantilla");
  return { titulo: m[1].trim(), navActiva: m[2].trim(), contenido: html.replace(m[0], "") };
}

function copiarManuscritas() {
  for (const nombre of ["instalaciones.html", "contacto.html", "404.html"]) {
    const raw = fs.readFileSync(path.join(TEMPLATES, nombre), "utf8");
    const meta = metadataDePlantilla(raw);
    escribirPagina(nombre, meta.titulo, meta.navActiva, meta.contenido);
  }
}

function renderSelector(torneo, torneos) {
  const hermanas = torneos.filter((t) => t.categoria === torneo.categoria);
  return hermanas.map((t) => {
    const activa = t.id === torneo.id;
    const href = activa ? "index.html" : `../${slugEdicion(t)}/index.html`;
    return `<a class="tab${activa ? " on" : ""}" href="${href}">Edición ${t.edicion}${t.estado === "vigente" ? " · vigente" : ""}</a>`;
  }).join("");
}

function generarEdiciones() {
  const torneos = leerTorneos();
  for (const t of torneos) {
    const plantilla = fs.readFileSync(path.join(TEMPLATES, "torneo-edicion.html"), "utf8");
    const meta = metadataDePlantilla(plantilla);
    const titulo = `${t.nombre} · Edición ${t.edicion}`;
    const contenido = meta.contenido
      .replace(/<!-- TITULO_EDICION -->/g, titulo)
      .replace(/<!-- INDICE_EDICIONES -->/g, renderSelector(t, torneos))
      .replace(/<!-- DATA_URL -->/g, `../../../data/torneos/${t.id}.json`);
    escribirPagina(
      `torneos/${t.categoria}/${slugEdicion(t)}/index.html`,
      `${titulo} | Club Atlético Gualeguay`,
      "torneos",
      contenido
    );
  }
  console.log(`  → ${torneos.length} ediciones generadas`);
}

function main() {
  console.log("Limpiando dist/ …");
  cleanDist();
  console.log("Copiando assets …");
  copiarAssets();
  console.log("Copiando datos…");
  copiarDatos();
  fs.writeFileSync(path.join(DIST, ".nojekyll"), "", "utf8");

  console.log("Generando páginas …");
  escribirPagina(
    "index.html",
    "Inicio | Club Atlético Gualeguay",
    "inicio",
    '<section class="hero"><h1>Club Atlético Gualeguay</h1><p>Sitio en construcción.</p></section>'
  );

  console.log("Copiando páginas manuscritas…");
  copiarManuscritas();
  console.log("Generando ediciones de torneo…");
  generarEdiciones();

  console.log("Build OK ✔");
}

main();