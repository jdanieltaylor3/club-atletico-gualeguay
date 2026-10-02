import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assemble, parsearPlantilla, renderRedes } from "../lib/layout.js";
import { leerTexto } from "../lib/utils.js";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSS_LAYOUT = leerTexto(path.join(RAIZ, "assets", "css", "layout.css"));
const CSS_COMPONENTES = leerTexto(path.join(RAIZ, "assets", "css", "components.css"));
const CSS_TOKENS = leerTexto(path.join(RAIZ, "assets", "css", "tokens.css"));
const JS_HEADER = leerTexto(path.join(RAIZ, "assets", "js", "header.js"));

// Saca el bloque de declaraciones de un selector, para poder preguntar por una
// regla concreta sin depender del orden del archivo.
function regla(selector) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = CSS_LAYOUT.match(new RegExp(`(?:^|\\})\\s*${esc}\\s*\\{([^}]*)\\}`, "m"));
  assert.ok(m, `no se encontró la regla ${selector} en css/layout.css`);
  return m[1];
}

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

test("assemble: marca la página en el body para la tipografía", () => {
  assert.match(
    assemble({ titulo: "X", contenido: "", navActiva: "torneos", anio: 2026 }),
    /<body data-pagina="torneos">/
  );
  // Sin nav (404) el atributo queda vacío pero presente, y no sobrevive el
  // placeholder.
  const sinNav = assemble({ titulo: "X", contenido: "", anio: 2026 });
  assert.match(sinNav, /<body data-pagina="">/);
  assert.doesNotMatch(sinNav, /\{\{PAGINA\}\}/);
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

test("renderRedes: pinta la silueta como máscara en vez del texto IG/FB/WA", () => {
  const html = renderRedes(
    [{ nombre: "Instagram", url: "https://ig", icono: "assets/img/iconos/instagram.png" }],
    "../../"
  );
  assert.match(html, /aria-label="Instagram"/);
  // El glifo es un <span> decorativo: el color lo pone el CSS y el PNG va de
  // máscara, así que no lleva src ni width/height.
  assert.match(
    html,
    /<span class="social-icon" aria-hidden="true" style="-webkit-mask-image:url\('\.\.\/\.\.\/assets\/img\/iconos\/instagram\.png'\);mask-image:url\('\.\.\/\.\.\/assets\/img\/iconos\/instagram\.png'\)"><\/span>/
  );
  assert.doesNotMatch(html, /<img/);
  assert.doesNotMatch(html, /IG/);
});

test("assemble: los iconos de redes resuelven assetsRoot en header y pie", () => {
  const html = assemble({
    titulo: "X",
    contenido: "",
    anio: 2026,
    assetsRoot: "../",
    redes: [{ nombre: "WhatsApp", url: "https://wa.me/54", icono: "assets/img/iconos/whatsapp.png" }],
  });
  assert.match(html, /mask-image:url\('\.\.\/assets\/img\/iconos\/whatsapp\.png'\)/);
  // Header y pie: dos apariciones del mismo icono, con la misma ruta.
  assert.equal(html.match(/assets\/img\/iconos\/whatsapp\.png/g).length, 4);
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

/* Huecos entre secciones
   Estas tres reglas dejaron franjas de fondo plano que se veían como un margen
   entre bloques que en realidad van pegados: entre el hero y el video, y entre
   la última sección y el pie. Salían de reglas que no tienen nada que ver con
   separaciones y que conviene no volver a poner. */

test("la sección de video contiene los márgenes de sus hijos", () => {
  // Sin un contexto de formato propio, el margen superior del primer hijo se
  // escapa hacia arriba y empuja la sección entera, dejando el fondo del sitio
  // a la vista entre el hero y el video.
  assert.match(regla(".seccion-video"), /display:\s*flow-root/);
});

test(".site-main no estira con min-height", () => {
  // En las páginas cortas el main se estiraba hasta 60vh y dejaba hasta 148 px
  // de fondo plano entre la última sección y el pie.
  assert.doesNotMatch(CSS_LAYOUT, /\.site-main\s*\{[^}]*min-height/);
});

test("el pie no se separa con margin-top", () => {
  // El filete de arriba ya marca la separación; el margen dejaba 40 px de fondo
  // plano antes del pie en todas las páginas.
  assert.doesNotMatch(regla(".site-footer"), /margin-top/);
});

/* Sistema de forma: cartel de club
   Tres casos y ninguno accidental: lo impreso va recto, las etiquetas van en
   píldora y los escudos son redondos. Ni radios abandonados a mano (el 6px
   de .nav-link), ni sombras sueltas, ni píldoras en bloques impresos. */

test("los bloques van rectos: --radio es 0, --sombra es none", () => {
  assert.match(CSS_TOKENS, /--radio:\s*0px/);
  assert.match(CSS_TOKENS, /--sombra:\s*none/);
});

test("no hay radios escritos a mano ni píldoras en bloques impresos", () => {
  // El único radio literal permitido en los componentes es el de las
  // etiquetas (--radio-tag), que se declara en tokens.css.
  const radiosSueltos = CSS_COMPONENTES.match(/border-radius:\s*\d+px/g);
  assert.equal(radiosSueltos, null, `radios a mano en componentes: ${radiosSueltos}`);
  assert.doesNotMatch(CSS_LAYOUT, /border-radius:\s*\d+px/);
});

test("el header es de cartel: fijo arriba, con regla al despegarse", () => {
  assert.match(regla(".site-header"), /position:\s*sticky/);
  assert.match(regla(".site-header"), /top:\s*0/);
  assert.match(regla(".site-header"), /--alto-header/);
  const marca = regla(".site-header.is-stuck");
  assert.match(marca, /--grosor-regla/);
  assert.match(marca, /--color-primario/);
});

test("el pie cierra con la regla del club", () => {
  const pie = regla(".site-footer");
  assert.match(pie, /border-top:\s*var\(--grosor-regla\)\s+solid\s+var\(--color-primario\)/);
});

test("header.js: si no hay script, el header queda siempre visible", () => {
  // La clase que esconde el header solo la agrega el script: el HTML de la
  // plantilla no debe llevarla, y el script debe respetar el movimiento
  // reducido (ahí no se esconde nunca).
  const plantilla = leerTexto(path.join(RAIZ, "templates", "partials", "_header.html"));
  assert.doesNotMatch(plantilla, /site-header[^>"]*oculto/);
  assert.match(JS_HEADER, /prefers-reduced-motion/);
  assert.match(JS_HEADER, /translateY/);
});
