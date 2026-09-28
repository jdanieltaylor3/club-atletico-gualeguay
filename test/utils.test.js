import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { leerJSON, leerTexto, escribirArchivo, existe } from "../lib/utils.js";

const RAIZ = path.join(import.meta.dirname, "..");

test("leerJSON: lee un archivo y devuelve el objeto", () => {
  const sitio = leerJSON(path.join(RAIZ, "data", "sitio.json"));
  assert.ok(sitio.nombre);
  assert.ok(Array.isArray(sitio.redes));
});

test("leerJSON: lanza un error claro con la ruta cuando el archivo no existe", () => {
  assert.throws(() => leerJSON("no-existe.json"), /no-existe\.json|ENOENT/);
});

test("leerJSON: un JSON inválido menciona el archivo", () => {
  const dir = path.join(import.meta.dirname, "tmp-io");
  const destino = path.join(dir, "roto.json");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(destino, "{ roto", "utf8");
  assert.throws(() => leerJSON(destino), /roto\.json/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test("leerTexto: devuelve el contenido sin interpretar", () => {
  assert.match(leerTexto(path.join(RAIZ, "templates", "index.html")), /PAGINA:/);
});

test("escribirArchivo: crea los directorios que falten", () => {
  const dir = path.join(import.meta.dirname, "tmp-output");
  const destino = path.join(dir, "sub", "archivo.txt");
  escribirArchivo(destino, "hola");
  assert.equal(fs.readFileSync(destino, "utf8"), "hola");
  assert.ok(existe(destino));
  fs.rmSync(dir, { recursive: true, force: true });
});

test("existe: distingue lo que está de lo que no", () => {
  assert.ok(existe(path.join(RAIZ, "build.js")));
  assert.equal(existe(path.join(RAIZ, "no-existe.js")), false);
});
