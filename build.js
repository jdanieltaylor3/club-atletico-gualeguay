#!/usr/bin/env node
// Generador del sitio. Es un orquestador: lee data/, aplica las plantillas de
// templates/ y escribe dist/. No sabe cómo se ve un partido ni cómo se calcula
// una vida: eso vive en lib/ y lo comparte con el navegador.
//
// Para agregar una página nueva: una función generarX() que llame a
// escribirPagina() y una línea más en main().

import fs from "node:fs";
import path from "node:path";

import { leerJSON, leerTexto, escribirArchivo, existe } from "./lib/utils.js";
import { escapeHtml, slugify, formatFecha } from "./lib/texto.js";
import { assemble, parsearPlantilla } from "./lib/layout.js";
import { assetsRoot, slugEdicion, rutaPaginaEdicion, urlEdicionHermana, rutaAsset } from "./lib/rutas.js";
import { tarjetaPartido, badge } from "./lib/render.js";
import * as data from "./lib/data.js";

const RAIZ = import.meta.dirname;
const DIST = path.join(RAIZ, "dist");
const DIR_DATA = path.join(RAIZ, "data");
const DIR_TORNEOS = path.join(DIR_DATA, "torneos");
const DIR_TEMPLATES = path.join(RAIZ, "templates");
const DIR_ASSETS = path.join(RAIZ, "assets");

// Módulos de lib/ que son puros (sin node:fs). Se copian a dist/assets/js/lib/
// para que el navegador importe exactamente el mismo código que usa el build.
// Para agregar un módulo compartido: agregarlo acá y a MODULOS_PUROS de lib/.
const MODULOS_COMPARTIDOS = ["data.js", "render.js", "rutas.js", "texto.js", "torneo-modelo.js"];

// --- Datos (se leen una vez por build) ---

const cache = {};
const sitio = () => (cache.sitio ??= leerJSON(path.join(DIR_DATA, "sitio.json")));

const torneos = () =>
  (cache.torneos ??= fs
    .readdirSync(DIR_TORNEOS)
    .filter((f) => f.endsWith(".json"))
    .map((f) => leerJSON(path.join(DIR_TORNEOS, f)))
    .sort((a, b) =>
      a.categoria === b.categoria
        ? b.edicion.localeCompare(a.edicion)
        : a.categoria.localeCompare(b.categoria)));

const noticias = () =>
  (cache.noticias ??= [...leerJSON(path.join(DIR_DATA, "noticias.json"))]
    .sort((a, b) => b.fecha.localeCompare(a.fecha)));

// --- Salida ---

function escribirPagina(rutaRel, titulo, navActiva, contenido) {
  const html = assemble({
    titulo,
    contenido,
    navActiva,
    anio: new Date().getFullYear(),
    assetsRoot: assetsRoot(rutaRel),
    redes: sitio().redes,
  });
  escribirArchivo(path.join(DIST, rutaRel), html);
}

function plantilla(nombre) {
  return parsearPlantilla(leerTexto(path.join(DIR_TEMPLATES, nombre)));
}

// Cantidad de niveles desde la raíz del sitio hasta una página concreta.
function profundidad(rutaPagina) {
  return rutaPagina.split("/").length - 1;
}

// Reemplaza un placeholder. Falla fuerte si no estaba: es mejor romper el build
// que publicar una página con un <!-- NOTICIA --> sin reemplazar.
function rellenar(contenido, reemplazos) {
  let out = contenido;
  for (const [marcador, valor] of Object.entries(reemplazos)) {
    if (!out.includes(marcador)) throw new Error(`Falta el marcador ${marcador} en la plantilla`);
    out = out.split(marcador).join(valor);
  }
  return out;
}

function prepararDist() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  fs.cpSync(DIR_ASSETS, path.join(DIST, "assets"), { recursive: true });
  fs.cpSync(DIR_DATA, path.join(DIST, "data"), { recursive: true });

  const destinoLib = path.join(DIST, "assets", "js", "lib");
  for (const modulo of MODULOS_COMPARTIDOS) {
    const origen = path.join(RAIZ, "lib", modulo);
    if (!existe(origen)) throw new Error(`Falta el módulo compartido lib/${modulo}`);
    escribirArchivo(path.join(destinoLib, modulo), leerTexto(origen));
  }

  escribirArchivo(path.join(DIST, ".nojekyll"), "");
}

// --- Páginas ---

// Páginas escritas a mano en templates/ (sin datos).
function generarManuscritas() {
  for (const nombre of ["instalaciones.html", "contacto.html", "404.html"]) {
    const { titulo, navActiva, contenido } = plantilla(nombre);
    escribirPagina(nombre, titulo, navActiva, contenido);
  }
}

// Una página por archivo de data/torneos/. Es un shell: el navegador carga su
// JSON y arma el cuadro, el fixture, los equipos y los goleadores.
function generarEdiciones() {
  const lista = torneos();
  for (const torneo of lista) {
    const rutaRel = rutaPaginaEdicion(torneo);
    const titulo = `${torneo.nombre} · Edición ${torneo.edicion}`;
    const contenido = rellenar(plantilla("torneo-edicion.html").contenido, {
      "<!-- TITULO_EDICION -->": escapeHtml(titulo),
      "<!-- INDICE_EDICIONES -->": selectorEdiciones(torneo, lista),
      "<!-- DATA_URL -->": `${assetsRoot(rutaRel)}data/torneos/${torneo.id}.json`,
    });
    escribirPagina(rutaRel, `${titulo} | Club Atlético Gualeguay`, "torneos", contenido);
  }
  return lista.length;
}

function selectorEdiciones(activo, lista) {
  return data.edicionesDe(lista, activo.categoria)
    .map((t) => {
      const on = t.id === activo.id;
      const href = on ? "index.html" : urlEdicionHermana(t);
      const vigente = t.estado === "vigente" ? " · vigente" : "";
      return `<a class="tab${on ? " on" : ""}" href="${href}"${on ? ' aria-current="page"' : ""}>` +
        `Edición ${escapeHtml(t.edicion)}${vigente}</a>`;
    })
    .join("");
}

// Índice de torneos. Itera las categorías que existan en los datos: agregar una
// categoría nueva es crear su JSON, no tocar este archivo.
function generarTorneosIndex() {
  const grupos = data.categorias(torneos());
  const contenido = rellenar(plantilla("torneos-index.html").contenido, {
    "<!-- CATEGORIAS -->": Object.entries(grupos)
      .map(([categoria, lista]) => renderCategoria(categoria, lista))
      .join("\n"),
  });
  const { titulo, navActiva } = plantilla("torneos-index.html");
  escribirPagina("torneos/index.html", titulo, navActiva, contenido);
}

function renderCategoria(categoria, lista) {
  const items = lista
    .map((t) => `<li><a href="${categoria}/${slugEdicion(t.edicion)}/index.html">` +
      `Edición ${escapeHtml(t.edicion)}</a>${t.estado === "vigente" ? " " + badge("vigente", "v2") : ""}</li>`)
    .join("");
  return `<article class="categoria">
    <h2>${escapeHtml(data.nombreCategoria(categoria, lista))}</h2>
    <ul>${items || "<li>Sin ediciones cargadas.</li>"}</ul>
  </article>`;
}

// Noticias: el listado agrupado por año + una página por noticia.
function generarNoticias() {
  const rutaRel = "noticias/index.html";
  const { titulo, navActiva, contenido } = plantilla("noticias-index.html");
  escribirPagina(rutaRel, titulo, navActiva, rellenar(contenido, {
    "<!-- LISTA_NOTICIAS -->": listaNoticias(profundidad(rutaRel)),
  }));

  const detalle = plantilla("noticia.html");
  for (const n of noticias()) {
    const slug = `${slugify(n.titulo)}-${n.id}`;
    escribirPagina(`noticias/${slug}.html`, `${n.titulo} | Club Atlético Gualeguay`, "noticias",
      rellenar(detalle.contenido, {
        "<!-- NOTICIA_TITULO -->": escapeHtml(n.titulo),
        "<!-- NOTICIA_META -->": `${formatFecha(n.fecha)} · ${badge(n.categoria)}`,
        "<!-- NOTICIA_IMAGEN -->": n.imagen
          ? `<img class="nota-img" src="${rutaAsset(n.imagen, 1)}" alt="${escapeHtml(n.titulo)}">`
          : "",
        "<!-- NOTICIA_CONTENIDO -->": cuerpoNoticia(n),
      }));
  }
  return noticias().length;
}

// Los párrafos de la nota están separados por líneas en blanco.
function cuerpoNoticia(n) {
  return escapeHtml(n.contenido)
    .split(/\n\s*\n/)
    .map((p) => `<p>${p}</p>`)
    .join("\n");
}

function listaNoticias(profundidadPagina) {
  if (!noticias().length) return '<p class="nota-meta">Todavía no hay noticias publicadas.</p>';
  let anioActual = null;
  return noticias().map((n) => {
    const anio = n.fecha.slice(0, 4);
    const separador = anio !== anioActual ? `<h2 class="archivo-anio">${anio}</h2>` : "";
    anioActual = anio;
    return `${separador}<article class="tarjeta-nota">
      ${n.imagen ? `<img class="nota-img" src="${rutaAsset(n.imagen, profundidadPagina)}" alt="" loading="lazy">` : ""}
      <div class="tarjeta-nota-body">
        <h3><a href="${slugify(n.titulo)}-${n.id}.html">${escapeHtml(n.titulo)}</a></h3>
        <p class="nota-meta">${formatFecha(n.fecha)} ${badge(n.categoria)}</p>
        <p>${escapeHtml(n.resumen)}</p>
      </div>
    </article>`;
  }).join("");
}

// Home: héroe + resumen del torneo vigente + últimas noticias.
function generarHome() {
  const { titulo, navActiva, contenido } = plantilla("index.html");
  escribirPagina("index.html", titulo, navActiva, rellenar(contenido, {
    "<!-- CONTENIDO_HOME -->": [hero(), bloqueTorneo(), bloqueNoticias()].join("\n"),
  }));
}

function hero() {
  const s = sitio();
  return `
    <section class="hero">
      <h1>${escapeHtml(s.nombre)}</h1>
      <p>${escapeHtml(s.ciudad)} — torneos de Fútbol 7, con la doble eliminación por vidas.</p>
      <br>
      <a class="btn" href="torneos/index.html">Ver torneos</a>
    </section>`;
}

// Opciones de render de las tarjetas de la home: sin badges de vidas, con la
// fecha en español y sin los pases libres (no aportan a un resumen).
function opcionesTorneoHome(torneo, profundidad = 0) {
  return {
    nombres: data.mapaNombres(torneo.equipos),
    equipos: data.mapaEquipos(torneo.equipos),
    torneo: null,
    conVidas: false,
    profundidad,
    formatearFecha: formatFecha,
    omitirSiPaseLibre: true,
  };
}

function tarjetas(partidos, torneo, profundidad) {
  const opts = opcionesTorneoHome(torneo, profundidad);
  return partidos.map((p) => tarjetaPartido(p, opts)).join("");
}

function bloqueTorneo() {
  const torneo = data.torneoVigente(sitio(), torneos(), "libres");
  if (!torneo) return '<section class="page"><p>Todavía no se cargó el torneo vigente.</p></section>';

  const url = rutaPaginaEdicion(torneo).replace("/index.html", "");
  const bloque = (titulo, partidos, vacio) =>
    `<h2>${titulo}</h2>\n          ${partidos || `<p class="nota-meta">${vacio}</p>`}`;

  return `
      <section class="page home-grid">
        <article>
          ${bloque(`Última ronda · ${escapeHtml(torneo.nombre)} ${escapeHtml(torneo.edicion)}`,
            tarjetas(data.ultimaRondaPartidos(torneo), torneo, 0), "Los cruces se cargan ronda a ronda.")}
          <p><a href="${url}">Ver cuadro completo →</a></p>
        </article>
        <article>
          ${bloque("Próximos partidos", tarjetas(data.proximosPartidos(torneo), torneo, 0),
            "Todavía no hay partidos programados.")}
        </article>
        <article>
          ${bloque("Resultados recientes", tarjetas(data.recientesPartidos(torneo), torneo, 0),
            "Todavía no hay resultados cargados.")}
        </article>
      </section>`;
}

function bloqueNoticias() {
  const items = noticias().slice(0, 3).map((n) => `
        <article class="tarjeta-nota">
          <div class="tarjeta-nota-body">
            <h3><a href="noticias/${slugify(n.titulo)}-${n.id}.html">${escapeHtml(n.titulo)}</a></h3>
            <p class="nota-meta">${formatFecha(n.fecha)}</p>
            <p>${escapeHtml(n.resumen)}</p>
          </div>
        </article>`).join("");

  return `
    <section class="page">
      <h2>Últimas noticias</h2>
      <div class="noticias-grid">${items || "<p>Todavía no hay noticias.</p>"}</div>
      <p><a href="noticias/index.html">Ver todas las noticias →</a></p>
    </section>`;
}

function main() {
  const t0 = Date.now();
  console.log("Limpiando dist/ …");
  prepararDist();
  console.log("Generando páginas manuscritas…");
  generarManuscritas();
  console.log("Generando ediciones de torneo…");
  console.log(`  → ${generarEdiciones()} ediciones`);
  console.log("Generando índice de torneos…");
  generarTorneosIndex();
  console.log("Generando noticias…");
  console.log(`  → ${generarNoticias()} noticias`);
  console.log("Generando home…");
  generarHome();
  console.log(`Build OK ✔ (${Date.now() - t0} ms)`);
}

main();
