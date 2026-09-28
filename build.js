// build.js — Generador del sitio (Node puro, sin dependencias)
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

function cleanDist() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}

function main() {
  cleanDist();
  console.log("Build OK: dist/ preparado");
}

main();