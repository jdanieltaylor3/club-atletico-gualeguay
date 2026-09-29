// Resolución de rutas del sitio. Módulo puro: lo usan el build y el navegador.
//
// Regla del proyecto: todo es relativo a la raíz del sitio y se sirve por HTTP
// (nunca con file://), para que funcione igual en GitHub Pages y Cloudflare Pages.

export function slugEdicion(edicion) {
  return String(edicion).replace(/\//g, "-");
}

// Ruta de la página de una edición, relativa a la raíz del repo.
export function rutaPaginaEdicion(torneo) {
  return `torneos/${torneo.categoria}/${slugEdicion(torneo.edicion)}/index.html`;
}

// Enlace a otra edición de la misma categoría, desde dentro de una edición.
export function urlEdicionHermana(torneo) {
  return `../${slugEdicion(torneo.edicion)}/index.html`;
}

// Cuántos "../" necesita una página para llegar a la raíz del sitio.
// "torneos/libres/26-27/index.html" -> "../../../"
export function assetsRoot(rutaPagina) {
  const carpetas = String(rutaPagina).split("/").slice(0, -1).filter(Boolean);
  return carpetas.map(() => "../").join("");
}

// Niveles de una URL de página: "/torneos/libres/26-27/" -> 3, "/" -> 0.
// Válido solo cuando el sitio se sirve en la raíz del dominio (localhost,
// dominio propio). En GitHub Pages el pathname incluye la carpeta base
// ("/club-atletico-gualeguay/torneos/..."), por eso el navegador usa
// profundidadDeRutaRelativa en lugar de esta función.
export function profundidadDePagina(pathname) {
  return Math.max(String(pathname).split("/").length - 2, 0);
}

// Profundidad de una página deducida de una ruta relativa que el build dejó
// en el HTML (ej. data-torneo-src="../../../data/..."): cuenta cuántos "../"
// tiene por delante. No depende de location.pathname, así que funciona igual
// con el sitio en la raíz o bajo una carpeta (GitHub Pages).
export function profundidadDeRutaRelativa(rutaRelativa) {
  const m = String(rutaRelativa || "").match(/^(?:\.\.\/)*/);
  return m ? m[0].length / 3 : 0;
}

// Convierte una ruta guardada en los datos ("assets/img/x.png") en una ruta
// usable desde una página que está N niveles más abajo.
export function rutaAsset(ruta, profundidad) {
  if (!ruta) return ruta;
  if (/^(https?:)?\/\//.test(ruta) || ruta.startsWith("/")) return ruta;
  const limpia = String(ruta).replace(/^(\.\.\/|\.\/)+/, "");
  return "../".repeat(Math.max(profundidad, 0)) + limpia;
}
