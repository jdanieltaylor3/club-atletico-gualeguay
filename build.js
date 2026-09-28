"use strict";
const fs = require("fs");
const path = require("path");
const { leerJSON, slugify, escapeHtml, formatFecha } = require("./lib/utils.js");
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

function leerNoticias() {
  return leerJSON(path.join(DATA, "noticias.json"))
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function slugNoticia(n) {
  return `${slugify(n.titulo)}-${n.id}`;
}

function cuerpoNoticia(n) {
  return escapeHtml(n.contenido)
    .split(/\n\s*\n/)
    .map((p) => `<p>${p}</p>`)
    .join("\n");
}

function renderListaNoticias(assetsRoot) {
  const noticias = leerNoticias();
  if (!noticias.length) return '<p>Todavía no hay noticias publicadas.</p>';
  let anioActual = null;
  return noticias.map((n) => {
    const anio = n.fecha.slice(0, 4);
    const separador = anio !== anioActual ? `<h2 class="archivo-anio">${anio}</h2>` : "";
    anioActual = anio;
    const imagen = n.imagen ? `<img class="nota-img" src="${assetsRoot}${n.imagen}" alt="" loading="lazy">` : "";
    return `${separador}<article class="tarjeta-nota">
      ${imagen}
      <div class="tarjeta-nota-body">
        <h3><a href="${slugNoticia(n)}.html">${escapeHtml(n.titulo)}</a></h3>
        <p class="nota-meta">${formatFecha(n.fecha)}<span class="badge">${escapeHtml(n.categoria)}</span></p>
        <p>${escapeHtml(n.resumen)}</p>
      </div>
    </article>`;
  }).join("");
}

function generarNoticias() {
  const plantillaIdx = fs.readFileSync(path.join(TEMPLATES, "noticias-index.html"), "utf8");
  const metaIdx = metadataDePlantilla(plantillaIdx);
  const lista = renderListaNoticias("../");
  escribirPagina("noticias/index.html", metaIdx.titulo, metaIdx.navActiva,
    metaIdx.contenido.replace("<!-- LISTA_NOTICIAS -->", lista));
  for (const n of leerNoticias()) {
    const plantilla = fs.readFileSync(path.join(TEMPLATES, "noticia.html"), "utf8");
    const meta = metadataDePlantilla(plantilla);
    const contenido = meta.contenido
      .replace(/<!-- NOTICIA_TITULO -->/g, escapeHtml(n.titulo))
      .replace("<!-- NOTICIA_META -->", `${formatFecha(n.fecha)} · <span class="badge">${escapeHtml(n.categoria)}</span>`)
      .replace("<!-- NOTICIA_IMAGEN -->",
        n.imagen ? `<img class="nota-img" src="../${n.imagen}" alt="${escapeHtml(n.titulo)}">` : "")
      .replace("<!-- NOTICIA_CONTENIDO -->", cuerpoNoticia(n));
    escribirPagina(`noticias/${slugNoticia(n)}.html`, `${n.titulo} | Club Atlético Gualeguay`, "noticias", contenido);
  }
  console.log(`  → ${leerNoticias().length} noticias generadas`);
}

function torneoVigente(categoria) {
  const vigente = leerJSON(path.join(DATA, "sitio.json")).edicionVigente[categoria];
  return leerTorneos().find((t) => t.categoria === categoria && t.edicion === vigente) || null;
}

function nombresDe(torneo) {
  const m = {};
  for (const e of torneo.equipos) m[e.id] = e.nombre;
  return m;
}

function partidoCard(p, nombres) {
  if (p.estado === "pase-libre") return "";
  const eq = (id) => (id ? nombres[id] : "por definir");
  const meta = p.fecha ? `${formatFecha(p.fecha)} ${p.hora} · ${p.cancha}` : "Fecha a definir";
  const res = p.estado === "jugado"
    ? (p.penales
        ? `${p.resultado.golesA}–${p.resultado.golesB} <span class="badge pen">${p.penales.a}-${p.penales.b} pen.</span>`
        : `${p.resultado.golesA}–${p.resultado.golesB}`)
    : "vs";
  return `<div class="tarjeta-partido"><div class="tp-titulo">${meta}</div>` +
    `<div class="tp-fila"><span class="tp-equipo">${eq(p.equipoA)}</span>` +
    `<span class="tp-resultado">${res}</span><span class="tp-equipo">${eq(p.equipoB)}</span></div></div>`;
}

function ultimaRondaPartidos(t) {
  const maxNum = Math.max(...t.rondas.map((r) => r.numero));
  return t.rondas.filter((r) => r.numero === maxNum).flatMap((r) => r.partidos);
}

function proximosPartidos(t, max = 3) {
  return t.rondas.flatMap((r) => r.partidos)
    .filter((p) => p.estado === "por jugar" && p.fecha)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, max);
}

function recientesPartidos(t, max = 3) {
  return t.rondas.flatMap((r) => r.partidos)
    .filter((p) => p.estado === "jugado")
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, max);
}

function renderCategoria(categoria, torneos) {
  const nombre = categoria === "libres" ? "Libres" : "Veteranos";
  const lista = torneos.map((t) => {
    const vigente = t.estado === "vigente" ? ' <span class="badge v2">vigente</span>' : "";
    return `<li><a href="${categoria}/${slugEdicion(t)}/index.html">Edición ${t.edicion}</a>${vigente}</li>`;
  }).join("");
  return `<article class="categoria">
    <h2>${nombre}</h2>
    <ul>${lista || "<li>Sin ediciones cargadas.</li>"}</ul>
  </article>`;
}

function generarTorneosIndex() {
  const torneos = leerTorneos();
  const libres = torneos.filter((t) => t.categoria === "libres");
  const veteranos = torneos.filter((t) => t.categoria === "veteranos");
  const plantilla = fs.readFileSync(path.join(TEMPLATES, "torneos-index.html"), "utf8");
  const meta = metadataDePlantilla(plantilla);
  const contenido = meta.contenido.replace("<!-- CATEGORIAS -->",
    renderCategoria("libres", libres) + renderCategoria("veteranos", veteranos));
  escribirPagina("torneos/index.html", meta.titulo, meta.navActiva, contenido);
}

function generarHome() {
  const sitio = leerJSON(path.join(DATA, "sitio.json"));
  const libres = torneoVigente("libres");
  const nombres = libres ? nombresDe(libres) : {};

  let bloqueTorneo = "";
  if (libres) {
    const ultima = ultimaRondaPartidos(libres).map((p) => partidoCard(p, nombres)).join("");
    const proximos = proximosPartidos(libres).map((p) => partidoCard(p, nombres)).join("");
    const recientes = recientesPartidos(libres).map((p) => partidoCard(p, nombres)).join("");
    const urlTorneo = `torneos/${libres.categoria}/${slugEdicion(libres)}/index.html`;
    bloqueTorneo = `
      <section class="page home-grid">
        <article>
          <h2>Última ronda · ${libres.nombre} ${libres.edicion}</h2>
          ${ultima || '<p class="nota-meta">Los cruces se cargan ronda a ronda.</p>'}
          <p><a href="${urlTorneo}">Ver cuadro completo →</a></p>
        </article>
        <article>
          <h2>Próximos partidos</h2>
          ${proximos || '<p class="nota-meta">Todavía no hay partidos programados.</p>'}
        </article>
        <article>
          <h2>Resultados recientes</h2>
          ${recientes || '<p class="nota-meta">Todavía no hay resultados cargados.</p>'}
        </article>
      </section>`;
  } else {
    bloqueTorneo = '<section class="page"><p>Todavía no se cargó el torneo vigente.</p></section>';
  }

  const noticias = leerNoticias().slice(0, 3).map((n) => `
      <article class="tarjeta-nota">
        <div class="tarjeta-nota-body">
          <h3><a href="noticias/${slugNoticia(n)}.html">${escapeHtml(n.titulo)}</a></h3>
          <p class="nota-meta">${formatFecha(n.fecha)}</p>
          <p>${escapeHtml(n.resumen)}</p>
        </div>
      </article>`).join("");
  const bloqueNoticias = `
    <section class="page">
      <h2>Últimas noticias</h2>
      <div class="noticias-grid">${noticias || "<p>Todavía no hay noticias.</p>"}</div>
      <p><a href="noticias/index.html">Ver todas las noticias →</a></p>
    </section>`;

  const hero = `
    <section class="hero">
      <h1>${escapeHtml(sitio.nombre)}</h1>
      <p>${escapeHtml(sitio.ciudad)} — torneos de Fútbol 7, con la doble eliminación por vidas.</p>
      <br>
      <a class="btn" href="torneos/index.html">Ver torneos</a>
    </section>`;

  const plantilla = fs.readFileSync(path.join(TEMPLATES, "index.html"), "utf8");
  const meta = metadataDePlantilla(plantilla);
  const contenido = hero + "\n" + bloqueTorneo + "\n" + bloqueNoticias;
  escribirPagina("index.html", meta.titulo, meta.navActiva, meta.contenido.replace("<!-- CONTENIDO_HOME -->", contenido));
}

function main() {
  console.log("Limpiando dist/ …");
  cleanDist();
  console.log("Copiando assets …");
  copiarAssets();
  console.log("Copiando datos…");
  copiarDatos();
  fs.writeFileSync(path.join(DIST, ".nojekyll"), "", "utf8");

  console.log("Copiando páginas manuscritas…");
  copiarManuscritas();
  console.log("Generando ediciones de torneo…");
  generarEdiciones();
  console.log("Generando índice de torneos…");
  generarTorneosIndex();
  console.log("Generando noticias…");
  generarNoticias();
  console.log("Generando home…");
  generarHome();

  console.log("Build OK ✔");
}

main();