import { test } from "node:test";
import assert from "node:assert/strict";
import * as rutas from "../lib/rutas.js";

test("slugEdicion: convierte la barra en guion", () => {
  assert.equal(rutas.slugEdicion("26/27"), "26-27");
  assert.equal(rutas.slugEdicion("2026"), "2026");
});

test("assetsRoot: sube un nivel por carpeta de la ruta", () => {
  assert.equal(rutas.assetsRoot("index.html"), "");
  assert.equal(rutas.assetsRoot("noticias/index.html"), "../");
  assert.equal(rutas.assetsRoot("torneos/libres/26-27/index.html"), "../../../");
});

test("rutaPaginaEdicion: arma la ruta de una edición", () => {
  assert.equal(rutas.rutaPaginaEdicion({ categoria: "libres", edicion: "26/27" }),
    "torneos/libres/26-27/index.html");
});

test("urlEdicionHermana: enlace relativo entre ediciones de la misma categoría", () => {
  assert.equal(rutas.urlEdicionHermana({ categoria: "libres", edicion: "25/26" }),
    "../25-26/index.html");
});

test("profundidadDePagina: cuenta los niveles de un path de página", () => {
  assert.equal(rutas.profundidadDePagina("/torneos/libres/26-27/"), 3);
  assert.equal(rutas.profundidadDePagina("/noticias/"), 1);
  assert.equal(rutas.profundidadDePagina("/"), 0);
  assert.equal(rutas.profundidadDePagina(""), 0);
});

test("profundidadDeRutaRelativa: deduce el nivel desde la ruta relativa del HTML", () => {
  assert.equal(rutas.profundidadDeRutaRelativa("../../../data/torneos/libres-26-27.json"), 3);
  assert.equal(rutas.profundidadDeRutaRelativa("../data/x.json"), 1);
  assert.equal(rutas.profundidadDeRutaRelativa("data/x.json"), 0);
  assert.equal(rutas.profundidadDeRutaRelativa(""), 0);
});

test("rutaAsset: antepone la raíz del sitio a rutas relativas", () => {
  assert.equal(rutas.rutaAsset("assets/img/x.png", 3), "../../../assets/img/x.png");
  assert.equal(rutas.rutaAsset("assets/img/x.png", 0), "assets/img/x.png");
  assert.equal(rutas.rutaAsset("assets/img/x.png"), "assets/img/x.png");
});

test("rutaAsset: no toca URLs absolutas ni rutas desde el origen", () => {
  assert.equal(rutas.rutaAsset("https://cdn.com/x.png", 3), "https://cdn.com/x.png");
  assert.equal(rutas.rutaAsset("//cdn.com/x.png", 3), "//cdn.com/x.png");
  assert.equal(rutas.rutaAsset("/assets/x.png", 3), "/assets/x.png");
});

test("rutaAsset: normaliza prefijos ./ y ../ ya presentes", () => {
  assert.equal(rutas.rutaAsset("./assets/x.png", 2), "../../assets/x.png");
  assert.equal(rutas.rutaAsset("../assets/x.png", 2), "../../assets/x.png");
});
