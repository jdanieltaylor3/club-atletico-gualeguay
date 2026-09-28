// Render de piezas de torneo a HTML.
// Módulo puro: sin DOM, sin Node. Lo usan el build y el navegador, así que
// "cómo se ve un partido" está definido una sola vez para toda la web.
//
// Contrato: todas las funciones devuelven HTML como texto. Los textos que
// vienen de los datos (nombres de equipo) se escapan en la frontera.

import { rutaAsset } from "./rutas.js";
import { vidasEquipo } from "./torneo-modelo.js";
import { escapeHtml as esc } from "./texto.js";
import { ETIQUETA_ZONA } from "./data.js";

export { ETIQUETA_ZONA };

// Hasta 3 iniciales para el escudo de reemplazo cuando el equipo no tiene imagen.
export function iniciales(nombre) {
  return String(nombre)
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

// Escudo del equipo: la imagen si existe, un círculo de iniciales si no.
// `profundidad` = niveles hasta la raíz del sitio, para resolver rutas relativas.
export function escudoHtml(equipo, profundidad = 0) {
  if (!equipo) return "";
  if (equipo.escudo) {
    const src = rutaAsset(equipo.escudo, profundidad);
    return `<img class="equipo-escudo" src="${src}" alt="Escudo de ${esc(equipo.nombre)}" loading="lazy">`;
  }
  return `<span class="equipo-escudo fallback" aria-hidden="true">${esc(iniciales(equipo.nombre))}</span>`;
}

export function badgeVidas(vidas) {
  if (vidas >= 2) return '<span class="badge v2">2 vidas</span>';
  if (vidas === 1) return '<span class="badge v1">1 vida</span>';
  return '<span class="badge elim">Eliminado</span>';
}

export function badge(texto, clase = "") {
  return `<span class="badge${clase ? " " + clase : ""}">${esc(texto)}</span>`;
}

function nombreDe(id, nombres) {
  if (!id) return '<span class="tp-equipo vacio">por definir</span>';
  return esc(nombres[id] || "");
}

function textoResultado(partido) {
  if (partido.estado !== "jugado" || !partido.resultado) return "<strong>vs</strong>";
  const r = partido.resultado;
  let txt = `${r.golesA} – ${r.golesB}`;
  if (partido.penales) txt += ` ${badge(`${partido.penales.a}-${partido.penales.b} pen.`, "pen")}`;
  return txt;
}

function lineaMeta(partido, formatearFecha) {
  if (!partido.fecha) return "Fecha a definir";
  const fecha = formatearFecha ? formatearFecha(partido.fecha) : partido.fecha;
  const hora = partido.hora ? ` ${partido.hora}` : "";
  const cancha = partido.cancha ? ` · ${partido.cancha}` : "";
  return `${fecha}${hora}${cancha}`;
}

/**
 * Tarjeta de un partido. Es la misma para el cuadro, el fixture y la home.
 *
 * opts:
 *   nombres            { id: nombre }            mapa de equipos
 *   equipos            { id: equipo }            para los escudos
 *   torneo             objeto del torneo        necesario si `conVidas`
 *   conVidas           boolean                   muestra el badge de vidas
 *   profundidad        number                    niveles hasta la raíz del sitio
 *   formatearFecha     function                  opcional: "2026-10-03" → texto
 *   omitirSiPaseLibre  boolean                   la home no muestra los pases libres
 */
export function tarjetaPartido(partido, opts = {}) {
  const { nombres = {}, equipos = {}, torneo = null, conVidas = false,
    profundidad = 0, formatearFecha = null, omitirSiPaseLibre = false } = opts;

  if (partido.estado === "pase-libre") {
    if (omitirSiPaseLibre) return "";
    const equipo = equipos[partido.equipoA];
    const quien = equipo ? `${escudoHtml(equipo, profundidad)} ${esc(equipo.nombre)}` : "Equipo";
    return '<div class="tarjeta-partido"><div class="tp-titulo">Pase libre</div>' +
      `<div class="tp-fila"><span class="tp-equipo">${quien} pasa de ronda</span>` +
      badge("Bye", "bye") + "</div></div>";
  }

  const escudo = (id) => (id && equipos[id] ? escudoHtml(equipos[id], profundidad) + " " : "");
  const vidas = (id) => (conVidas && id && torneo ? badgeVidas(vidasEquipo(torneo, id)) : "");

  return '<div class="tarjeta-partido"><div class="tp-titulo">' + lineaMeta(partido, formatearFecha) + "</div>" +
    '<div class="tp-fila"><span class="tp-equipo">' + escudo(partido.equipoA) +
    nombreDe(partido.equipoA, nombres) + vidas(partido.equipoA) + "</span>" +
    '<span class="tp-resultado">' + textoResultado(partido) + "</span>" +
    '<span class="tp-equipo">' + escudo(partido.equipoB) +
    nombreDe(partido.equipoB, nombres) + vidas(partido.equipoB) + "</span></div></div>";
}

// Fila de la vista Equipos: escudo + nombre + badge de vidas.
export function tarjetaEquipo(equipo, profundidad = 0, torneo = null) {
  const badgeVidasHtml = torneo ? " " + badgeVidas(vidasEquipo(torneo, equipo.id)) : "";
  return '<div class="tarjeta-partido"><div class="tp-fila">' +
    `<span class="tp-equipo">${escudoHtml(equipo, profundidad)} ${esc(equipo.nombre)}</span>` +
    `${badgeVidasHtml}</div></div>`;
}

// Tabla de goleadores (el nombre del equipo se resuelve contra el mapa).
export function tablaGoleadores(goleadores, nombres) {
  const filas = [...goleadores]
    .sort((a, b) => b.goles - a.goles)
    .map((g) => `<tr><td>${esc(g.jugador)}</td><td>${esc(nombres[g.equipoId] || g.equipoId)}</td>` +
      `<td><strong>${esc(g.goles)}</strong></td></tr>`)
    .join("");
  return '<table class="tabla"><thead><tr><th>Jugador</th><th>Equipo</th><th>Goles</th></tr></thead>' +
    `<tbody>${filas}</tbody></table>`;
}

// Bloque de estado (cargando / sin datos / error).
export function estadoHTML(mensaje, tipo = "") {
  return `<div class="estado${tipo === "error" ? " error" : ""}"><p>${esc(mensaje)}</p></div>`;
}

// Zona de una ronda: título + tarjetas.
export function zonaHTML(zona, partidos, opts) {
  const [titulo, clase] = ETIQUETA_ZONA[zona];
  const cards = partidos.map((p) => tarjetaPartido(p, opts)).join("");
  return `<div><div class="zona-titulo ${clase}">${titulo}</div>` +
    `${cards || '<p class="tp-titulo">Sin partidos en esta zona.</p>'}</div>`;
}
