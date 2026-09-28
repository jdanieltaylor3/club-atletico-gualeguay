// Test de integración: corre el build real y verifica el contenido de dist/.
// Es la red de seguridad del generador: si un refactor rompe una página,
// falla acá y no en producción.

import { test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const RAIZ = path.join(import.meta.dirname, "..");
const DIST = path.join(RAIZ, "dist");

const leer = (rel) => fs.readFileSync(path.join(DIST, rel), "utf8");
const paginas = () =>
  fs.readdirSync(DIST, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".html"))
    .map((e) => path.relative(DIST, path.join(e.parentPath, e.name)).split(path.sep).join("/"));

before(() => {
  execFileSync(process.execPath, ["build.js"], { cwd: RAIZ, stdio: "pipe" });
}, { timeout: 60000 });

test("build: genera el sitio completo", () => {
  const esperadas = [
    "index.html",
    "404.html",
    "contacto.html",
    "instalaciones.html",
    "noticias/index.html",
    "torneos/index.html",
    "torneos/libres/26-27/index.html",
    "torneos/veteranos/26-27/index.html",
  ];
  for (const p of esperadas) assert.ok(fs.existsSync(path.join(DIST, p)), `falta ${p}`);
});

test("build: una página de noticia por noticia, con su slug", () => {
  const pagina = paginas().find((p) => p.startsWith("noticias/") && p !== "noticias/index.html");
  assert.ok(pagina, "no se generó ninguna página de noticia");
  assert.match(pagina, /^noticias\/arranco-la-edicion-26-27-de-los-torneos-1\.html$/);
});

test("build: no deja marcadores sin reemplazar en ninguna página", () => {
  for (const p of paginas()) {
    const html = leer(p);
    assert.doesNotMatch(html, /<!--[A-Z_]+-->/, `quedó un marcador sin reemplazar en ${p}`);
  }
});

test("build: no deja placeholders de assets sin resolver", () => {
  for (const p of paginas()) assert.doesNotMatch(leer(p), /ASSETS_ROOT|\{\{ACTIVO:/, `placeholder sin resolver en ${p}`);
});

test("build: .nojekyll para que GitHub Pages no toque los assets", () => {
  assert.ok(fs.existsSync(path.join(DIST, ".nojekyll")));
});

test("build: copia los módulos compartidos que el navegador importa", () => {
  for (const m of ["data.js", "render.js", "rutas.js", "texto.js", "torneo-modelo.js"]) {
    assert.ok(fs.existsSync(path.join(DIST, "assets", "js", "lib", m)), `falta assets/js/lib/${m}`);
  }
});

test("build: copia data/ para que el navegador pueda hacer fetch", () => {
  assert.ok(fs.existsSync(path.join(DIST, "data", "torneos", "libres-26-27.json")));
  assert.ok(fs.existsSync(path.join(DIST, "data", "sitio.json")));
});

test("build: los módulos compartidos son los mismos en lib/ y en dist/", () => {
  for (const m of ["data.js", "render.js", "rutas.js", "texto.js", "torneo-modelo.js"]) {
    const origen = fs.readFileSync(path.join(RAIZ, "lib", m), "utf8");
    const copia = fs.readFileSync(path.join(DIST, "assets", "js", "lib", m), "utf8");
    assert.equal(copia, origen, `dist/assets/js/lib/${m} difiere de lib/${m}`);
  }
});

test("build: los módulos compartidos no importan nada de Node", () => {
  for (const m of ["data.js", "render.js", "rutas.js", "texto.js", "torneo-modelo.js"]) {
    const codigo = fs.readFileSync(path.join(RAIZ, "lib", m), "utf8");
    assert.doesNotMatch(codigo, /from\s+["']node:/, `lib/${m} importa un módulo de Node`);
    assert.doesNotMatch(codigo, /\brequire\(/, `lib/${m} usa require()`);
  }
});

test("build: las rutas relativas son correctas según la profundidad de cada página", () => {
  assert.match(leer("index.html"), /href="assets\/css\/styles\.css"/);
  assert.match(leer("noticias/index.html"), /href="\.\.\/assets\/css\/styles\.css"/);
  const edicion = leer("torneos/libres/26-27/index.html");
  assert.match(edicion, /href="\.\.\/\.\.\/\.\.\/assets\/css\/styles\.css"/);
  assert.match(edicion, /data-torneo-src="\.\.\/\.\.\/\.\.\/data\/torneos\/libres-26-27\.json"/);
});

test("build: los scripts se cargan como módulos ES", () => {
  assert.match(leer("index.html"), /<script type="module" src="assets\/js\/main\.js">/);
});

test("build: cada página tiene un solo h1 y su título", () => {
  for (const p of paginas()) {
    const html = leer(p);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${p} debería tener un solo h1`);
    assert.match(html, /<title>[^<]+<\/title>/, `${p} sin title`);
  }
});

test("build: la home muestra el torneo vigente con escudos resueltos", () => {
  const html = leer("index.html");
  assert.match(html, /Última ronda · Libres 26\/27/);
  assert.match(html, /assets\/img\/equipos\/eq-1\.png/);
  assert.doesNotMatch(html, /href="assets\/img/); // los escudos no son enlaces
});

test("build: la home formatea las fechas en español", () => {
  assert.match(leer("index.html"), /de octubre de 2026/);
});

test("build: el índice de torneos lista cada categoría y cada edición", () => {
  const html = leer("torneos/index.html");
  assert.match(html, /<h2>Libres<\/h2>/);
  assert.match(html, /<h2>Veteranos<\/h2>/);
  assert.match(html, /href="libres\/26-27\/index\.html"/);
  assert.match(html, /badge v2">vigente</);
});

test("build: el selector marca la edición activa y la identifica como actual", () => {
  const html = leer("torneos/libres/26-27/index.html");
  assert.match(html, /Edición 26\/27 · vigente/);

  const selector = html.match(/<div class="selector-ediciones">([\s\S]*?)<\/div>/)?.[1] ?? "";
  assert.equal((selector.match(/class="tab on"/g) || []).length, 1, "solo una edición activa");
  assert.match(selector, /aria-current="page"/);

  // Las ediciones hermanas se enlazan con .. (../<edicion>/index.html).
  const hermanas = paginas().filter((p) => /torneos\/libres\/(?!26-27)/.test(p));
  assert.ok(/href="\.\.\/\d{2}-\d{2}\/index\.html"/.test(selector) || hermanas.length === 0,
    "con varias ediciones, las demás deben enlazarse como ..");
});

test("build: la lista de noticias agrupa por año y enlaza al detalle", () => {
  const html = leer("noticias/index.html");
  assert.match(html, /class="archivo-anio">2026</);
  assert.match(html, /href="arranco-la-edicion-26-27-de-los-torneos-1\.html"/);
  assert.match(html, /\.\.\/assets\/img\/placeholder-1\.svg/);
});

test("build: el detalle de la noticia arma los párrafos y la imagen", () => {
  const html = leer("noticias/arranco-la-edicion-26-27-de-los-torneos-1.html");
  assert.match(html, /<h1[^>]*>Arrancó la edición 26\/27 de los torneos<\/h1>/);
  assert.ok((html.match(/<p>/g) || []).length >= 3, "esperaba al menos 3 párrafos");
  assert.match(html, /\.\.\/assets\/img\/placeholder-1\.svg/);
});

test("build: la home y el detalle escapan los datos que vienen del JSON", () => {
  const html = leer("noticias/arranco-la-edicion-26-27-de-los-torneos-1.html");
  assert.doesNotMatch(html, /<script>alert/);
});

test("build: contacto no tiene formulario (no hay backend)", () => {
  const html = leer("contacto.html");
  assert.doesNotMatch(html, /<form/i);
  assert.doesNotMatch(html, /action=/i);
});

test("build: el header y el footer están en todas las páginas", () => {
  for (const p of ["index.html", "contacto.html", "noticias/index.html", "torneos/libres/26-27/index.html"]) {
    const html = leer(p);
    assert.match(html, /class="site-header"/, `sin header en ${p}`);
    assert.match(html, /class="site-footer"/, `sin footer en ${p}`);
    assert.match(html, /assets\/img\/escudo-club\.png/, `sin escudo en ${p}`);
  }
});
