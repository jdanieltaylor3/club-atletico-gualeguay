"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const utils = require("../lib/utils.js");

test("slugify: normaliza tildes, mayúsculas y espacios", () => {
  assert.equal(utils.slugify("Club Atlético Gualeguay 26/27"), "club-atletico-gualeguay-26-27");
  assert.equal(utils.slugify("  Nota de Prensa!  "), "nota-de-prensa");
});

test("escapeHtml: escapa caracteres HTML", () => {
  assert.equal(utils.escapeHtml('<b class="x">A & B</b>'), "&lt;b class=&quot;x&quot;&gt;A &amp; B&lt;/b&gt;");
});

test("formatFecha: ISO a formato español", () => {
  assert.equal(utils.formatFecha("2026-10-03"), "3 de octubre de 2026");
  assert.equal(utils.formatFecha("2026-01-01"), "1 de enero de 2026");
});

test("leerJSON: lanza error claro con ruta", () => {
  assert.throws(() => utils.leerJSON("no-existe.json"), /no-existe\.json|ENOENT/);
});

test("escribirArchivo: crea directorios recursivos", () => {
  const destino = path.join(__dirname, "tmp-output", "sub", "archivo.txt");
  utils.escribirArchivo(destino, "hola");
  assert.equal(require("fs").readFileSync(destino, "utf8"), "hola");
  require("fs").rmSync(path.join(__dirname, "tmp-output"), { recursive: true, force: true });
});