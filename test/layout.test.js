import { test } from "node:test";
import assert from "node:assert/strict";
import { assemble, parsearPlantilla, renderRedes } from "../lib/layout.js";

test("assemble: inserta título y contenido", () => {
  const html = assemble({
    titulo: "Noticias | Club Gualeguay",
    contenido: "<p>Hola</p>",
    navActiva: "noticias",
    anio: 2026,
    assetsRoot: "",
    redes: [{ nombre: "Instagram", url: "#", icono: "IG" }],
  });
  assert.match(html, /<title>Noticias \| Club Gualeguay<\/title>/);
  assert.match(html, /<p>Hola<\/p>/);
});

test("assemble: arma el documento completo (head, header, contenido, footer, scripts)", () => {
  const html = assemble({ titulo: "X", contenido: "<main>contenido</main>", anio: 2026 });
  assert.ok(html.startsWith("<!doctype html>") || html.startsWith("<!DOCTYPE html>"));
  assert.match(html, /<main>contenido<\/main>/);
  assert.ok(html.trimEnd().endsWith("</html>"));
});

test("assemble: marca nav activa solo en la sección correspondiente", () => {
  const html = assemble({ titulo: "X", contenido: "", navActiva: "torneos", anio: 2026, assetsRoot: "../" });
  assert.match(html, /class="nav-link on" href="\.\.\/torneos\/index\.html"/);
  assert.doesNotMatch(html, /class="nav-link on" href="index\.html"/);
});

test("assemble: assetsRoot se aplica a estilos, scripts y al contenido de la plantilla", () => {
  const html = assemble({
    titulo: "X",
    contenido: '<script type="module" src="<!-- ASSETS_ROOT -->assets/js/torneo.js"></script>',
    anio: 2026,
    assetsRoot: "../../../",
  });
  assert.match(html, /\.\.\/\.\.\/\.\.\/assets\/css\/styles\.css/);
  assert.match(html, /\.\.\/\.\.\/\.\.\/assets\/js\/main\.js/);
  assert.match(html, /\.\.\/\.\.\/\.\.\/assets\/js\/torneo\.js/);
  assert.doesNotMatch(html, /<!-- ASSETS_ROOT -->/);
});

test("assemble: escapa el título y renderiza redes y año", () => {
  const html = assemble({
    titulo: 'X & "Y"',
    contenido: "",
    anio: 2026,
    redes: [{ nombre: "Instagram", url: "https://ig", icono: "IG" }],
  });
  assert.match(html, /<title>X &amp; &quot;Y&quot;<\/title>/);
  assert.match(html, /https:\/\/ig/);
  assert.match(html, /© 2026 Club Atlético Gualeguay/);
});

test("renderRedes: lista vacía y escapado de URLs", () => {
  assert.equal(renderRedes([]), "");
  assert.equal(renderRedes(undefined), "");
  assert.match(renderRedes([{ url: 'x" onclick="1', icono: "IG" }]), /&quot;/);
});

test("renderRedes: pinta el logotipo en vez del texto IG/FB/WA", () => {
  const html = renderRedes(
    [{ nombre: "Instagram", url: "https://ig", icono: "assets/img/iconos/instagram.jpg" }],
    "../../"
  );
  assert.match(html, /aria-label="Instagram"/);
  assert.match(html, /<img class="social-icon" src="\.\.\/\.\.\/assets\/img\/iconos\/instagram\.jpg" alt="" width="24" height="24">/);
  assert.doesNotMatch(html, /IG/);
});

test("assemble: los iconos de redes resuelven assetsRoot en header y pie", () => {
  const html = assemble({
    titulo: "X",
    contenido: "",
    anio: 2026,
    assetsRoot: "../",
    redes: [{ nombre: "WhatsApp", url: "https://wa.me/54", icono: "assets/img/iconos/whatsapp.jpg" }],
  });
  assert.match(html, /src="\.\.\/assets\/img\/iconos\/whatsapp\.jpg"/);
});

test("parsearPlantilla: separa metadata y contenido", () => {
  const meta = parsearPlantilla('<!-- PAGINA: Torneos | torneos -->\n<section>hola</section>');
  assert.equal(meta.titulo, "Torneos");
  assert.equal(meta.navActiva, "torneos");
  assert.equal(meta.contenido, "<section>hola</section>");
});

test("parsearPlantilla: sin metadata lanza un error claro", () => {
  assert.throws(() => parsearPlantilla("<section>hola</section>"), /Falta metadata/);
});
