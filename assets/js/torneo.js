"use strict";
(function () {
  const contenedor = document.getElementById("vista-torneo");
  if (!contenedor || !window.__TORNEO__) return;

  let torneo = null;
  const $ = (html) => { contenedor.innerHTML = html; };

  function estadoHTML(tipo, mensaje) {
    return `<div class="estado${tipo === "error" ? " error" : ""}"><p>${mensaje}</p></div>`;
  }

  function badgeVidas(vidas) {
    if (vidas >= 2) return '<span class="badge v2">2 vidas</span>';
    if (vidas === 1) return '<span class="badge v1">1 vida</span>';
    return '<span class="badge elim">Eliminado</span>';
  }

  function equiposMap() {
    const m = {};
    for (const e of torneo.equipos) m[e.id] = e.nombre;
    return m;
  }

  function ganaEquipo(partido, equipoId) {
    if (partido.estado !== "jugado" || !partido.resultado) return null;
    const r = partido.resultado;
    if (r.golesA !== r.golesB) return r.golesA > r.golesB ? "A" : "B";
    if (partido.penales) return partido.penales.a > partido.penales.b ? "A" : "B";
    return null;
  }

  function vidasEquipo(equipoId) {
    let vidas = 2;
    for (const ronda of torneo.rondas) {
      for (const p of ronda.partidos) {
        if (p.estado !== "jugado") continue;
        const ganador = ganaEquipo(p, equipoId);
        if (ganador === "A" && p.equipoB === equipoId) vidas -= 1;
        if (ganador === "B" && p.equipoA === equipoId) vidas -= 1;
      }
    }
    return Math.max(vidas, 0);
  }

  function renderEquipos() {
    const lista = torneo.equipos.map((e) =>
      `<div class="tarjeta-partido"><div class="tp-fila">` +
      `<span class="tp-equipo">${e.nombre}</span>${badgeVidas(vidasEquipo(e.id))}` +
      `</div></div>`
    ).join("");
    $("<h2>Equipos</h2>" + (lista || estadoHTML("", "Todavía no hay equipos cargados.")));
  }

  function renderVista(vista) {
    if (vista === "equipos") return renderEquipos();
    // renderCuadro / renderFixture / renderGoleadores llegan en Tareas 12 y 13
    $(estadoHTML("", "Esta sección se habilita en los próximos pasos del plan."));
  }

  function init() {
    const tabs = document.querySelectorAll(".tabs .tab");
    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabs.forEach((b) => {
          b.classList.toggle("on", b === btn);
          b.setAttribute("aria-selected", String(b === btn));
        });
        renderVista(btn.dataset.vista);
      });
    });
  }

  fetch(window.__TORNEO__.dataUrl)
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((data) => { torneo = data; init(); renderVista("cuadro"); })
    .catch((e) => { $(estadoHTML("error", "No se pudo cargar el torneo. Reintentá más tarde.")); console.error(e); });
})();