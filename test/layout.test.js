"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const layout = require("../lib/layout.js");

test("assemble: inserta título y contenido", () => {
  const html = layout.assemble({
    titulo: "Noticias | Club Gualeguay",
    contenido: "<p>Hola</p>",
    navActiva: "noticias",
    anio: 2026,
    assetsRoot: "",
    redes: [{ nombre: "Instagram", url: "#", icono: "IG" }],
  });
  assert.ok(html.includes("<title>Noticias | Club Gualeguay</title>"));
  assert.ok(html.includes("<p>Hola</p>"));
});

test("assemble: marca nav activa", () => {
  const html = layout.assemble({
    titulo: "X",
    contenido: "",
    navActiva: "torneos",
    anio: 2026,
    assetsRoot: "../",
    redes: [],
  });
  assert.ok(html.includes('class="nav-link on" href="../torneos/index.html"'));
  assert.ok(!html.includes('class="nav-link on" href="index.html"'));
});

test("assemble: renderiza redes y año", () => {
  const html = layout.assemble({
    titulo: "X",
    contenido: "",
    navActiva: "inicio",
    anio: 2026,
    assetsRoot: "",
    redes: [{ nombre: "Instagram", url: "https://ig", icono: "IG" }],
  });
  assert.ok(html.includes("https://ig"));
  assert.ok(html.includes("© 2026 Club Atlético Gualeguay"));
  assert.ok(html.endsWith("</html>"));
});