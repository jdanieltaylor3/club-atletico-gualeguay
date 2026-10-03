// Vistas de la página de un torneo. Cada función devuelve HTML como texto:
// no tocan el DOM, así que se pueden razonar y probar por separado.
// Los datos y las reglas vienen de lib/, que el build también usa.

import {
  rondasAgrupadas, mapaNombres, mapaEquipos, goleadoresOrdenados, ETIQUETA_ZONA,
} from "./lib/data.js";
import { tarjetaPartido, tarjetaEquipo, tablaGoleadores, estadoHTML, zonaHTML } from "./lib/render.js";
import { mostrarEstado } from "./lib/torneo-modelo.js";

// Base de las tarjetas de partido: el mapa de equipos y la profundidad de la
// página (para resolver las rutas de los escudos).
function baseRender(torneo, profundidad, zona) {
  return {
    nombres: mapaNombres(torneo.equipos),
    equipos: mapaEquipos(torneo.equipos),
    torneo,
    profundidad,
    conEstado: mostrarEstado(zona),
  };
}

// --- Cuadro: una ronda por vez, con navegación entre rondas ---
export function vistaCuadro(torneo, indice, profundidad) {
  const rondas = rondasAgrupadas(torneo);
  if (!rondas.length) return estadoHTML("Todavía no hay partidos cargados.");

  const i = Math.min(Math.max(indice, 0), rondas.length - 1);
  const ronda = rondas[i];
  const columnas = ronda.zonas
    .map(({ zona, partidos }) => zonaHTML(zona, partidos, baseRender(torneo, profundidad, zona)))
    .join("");

  return `<h2>Cuadro · Ronda ${ronda.numero}</h2>` +
    `<div class="nav-ronda">${navRonda(i, rondas.length, ronda.numero)}</div>` +
    `<div class="zonas">${columnas}</div>`;
}

function navRonda(actual, total, numero) {
  const prev = `<button class="tab" type="button" data-ronda="-1" ${actual === 0 ? "disabled" : ""} aria-label="Ronda anterior">◀</button>`;
  const next = `<button class="tab" type="button" data-ronda="1" ${actual === total - 1 ? "disabled" : ""} aria-label="Ronda siguiente">▶</button>`;
  return prev + `<span class="ronda-actual">Ronda ${numero}</span>` + next;
}

// --- Fixture: todas las rondas, partidos ordenados por fecha ---
export function vistaFixture(torneo, profundidad) {
  const rondas = rondasAgrupadas(torneo);
  if (!rondas.length) return estadoHTML("Todavía no hay partidos cargados.");

  const html = rondas.map((ronda) => {
    const secciones = ronda.zonas.map(({ zona, partidos }) => {
      const [titulo, clase] = ETIQUETA_ZONA[zona];
      const ordenados = [...partidos].sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
      const cards = ordenados
        .map((p) => tarjetaPartido(p, baseRender(torneo, profundidad, zona)))
        .join("");
      return `<h3 class="zona-titulo ${clase}">Ronda ${ronda.numero} · ${titulo}</h3>${cards}`;
    }).join("");
    return `<div class="fixture-ronda">${secciones}</div>`;
  }).join("");

  return "<h2>Fixture</h2>" + html;
}

// --- Equipos: escudo, nombre y estado (GAN./PER./ELIM.) ---
// La grilla se abre según la cantidad: 1 columna hasta 10 equipos, 2 de 11 a
// 30 y 3 con más de 30. En teléfono el CSS la mantiene en una columna.
export function vistaEquipos(torneo, profundidad) {
  if (!torneo.equipos.length) return estadoHTML("Todavía no hay equipos cargados.");
  const total = torneo.equipos.length;
  const cols = total > 30 ? 3 : total > 10 ? 2 : 1;
  const lista = torneo.equipos.map((e) => tarjetaEquipo(e, profundidad, torneo)).join("");
  return `<h2>Equipos</h2><div class="equipos-grid cols-${cols}">${lista}</div>`;
}

// --- Goleadores ---
export function vistaGoleadores(torneo) {
  const goleadores = goleadoresOrdenados(torneo);
  if (!goleadores.length) return estadoHTML("Aún no se cargaron goleadores.");
  return "<h2>Goleadores</h2>" + tablaGoleadores(goleadores, mapaNombres(torneo.equipos));
}
