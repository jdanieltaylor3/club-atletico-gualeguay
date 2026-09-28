// Lectura y escritura de archivos. Solo Node: nunca se sirve al navegador.

import fs from "node:fs";
import path from "node:path";

export function leerJSON(ruta) {
  try {
    return JSON.parse(fs.readFileSync(ruta, "utf8"));
  } catch (e) {
    throw new Error(`No se pudo leer ${ruta}: ${e.message}`);
  }
}

export function leerTexto(ruta) {
  return fs.readFileSync(ruta, "utf8");
}

export function escribirArchivo(ruta, contenido) {
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, contenido, "utf8");
}

export function existe(ruta) {
  return fs.existsSync(ruta);
}
