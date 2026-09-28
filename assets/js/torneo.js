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

  function equiposPorId() {
    const m = {};
    for (const e of torneo.equipos) m[e.id] = e;
    return m;
  }

  function escudoDe(e) {
    if (!e) return "";
    if (e.escudo) {
      return `<img class="equipo-escudo" src="${e.escudo}" alt="Escudo de ${e.nombre}" loading="lazy">`;
    }
    const ini = e.nombre.split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase();
    return `<span class="equipo-escudo fallback" aria-hidden="true">${ini}</span>`;
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
        const perdio = (ganaEquipo(p, equipoId) === "A" && p.equipoB === equipoId) ||
          (ganaEquipo(p, equipoId) === "B" && p.equipoA === equipoId);
        if (!perdio) continue;
        if (ronda.zona === "perdedores") { vidas = 0; continue; }
        vidas -= 1;
      }
    }
    return Math.max(vidas, 0);
  }

  function textoResultado(partido) {
    const r = partido.resultado || { golesA: "-", golesB: "-" };
    let txt = `${r.golesA} – ${r.golesB}`;
    if (partido.penales) txt += ` <span class="badge pen">${partido.penales.a}-${partido.penales.b} pen.</span>`;
    return txt;
  }

  function renderEquipos() {
    const lista = torneo.equipos.map((e) =>
      `<div class="tarjeta-partido"><div class="tp-fila">` +
      `<span class="tp-equipo">${escudoDe(e)} ${e.nombre}</span>${badgeVidas(vidasEquipo(e.id))}` +
      `</div></div>`
    ).join("");
    $("<h2>Equipos</h2>" + (lista || estadoHTML("", "Todavía no hay equipos cargados.")));
  }

  function rondasAgrupadas() {
    const map = new Map();
    for (const r of torneo.rondas) {
      if (!map.has(r.numero)) map.set(r.numero, { numero: r.numero, zonas: {} });
      map.get(r.numero).zonas[r.zona] = r.partidos;
    }
    return [...map.values()].sort((a, b) => a.numero - b.numero);
  }

  const ETIQUETA_ZONA = {
    iniciales: ["Cruces iniciales", "iniciales"],
    ganadores: ["Zona Ganadores", "ganadores"],
    perdedores: ["Zona Perdedores", "perdedores"],
  };

  function tarjetaPartido(p, nombres, conVidas) {
    const porId = equiposPorId();
    if (p.estado === "pase-libre") {
      const e = porId[p.equipoA];
      const quien = e ? `${escudoDe(e)} ${e.nombre}` : "Equipo";
      return `<div class="tarjeta-partido"><div class="tp-titulo">Pase libre</div>` +
        `<div class="tp-fila"><span class="tp-equipo">${quien} pasa de ronda</span>` +
        `<span class="badge bye">Bye</span></div></div>`;
    }
    const meta = p.fecha
      ? `${p.fecha} ${p.hora} · ${p.cancha}`
      : "Fecha y cancha a definir";
    const eq = (id) => id ? nombres[id] : '<span class="tp-equipo vacio">por definir</span>';
    const conEscudo = (id) => (id && porId[id] ? `${escudoDe(porId[id])} ` : "");
    const badge = (id) => (conVidas && id ? badgeVidas(vidasEquipo(id)) : "");
    const resultado = p.estado === "jugado" ? textoResultado(p) : "<strong>vs</strong>";
    return `<div class="tarjeta-partido"><div class="tp-titulo">${meta}</div>` +
      `<div class="tp-fila"><span class="tp-equipo">${conEscudo(p.equipoA)}${eq(p.equipoA)} ${badge(p.equipoA)}</span>` +
      `<span class="tp-resultado">${resultado}</span>` +
      `<span class="tp-equipo">${conEscudo(p.equipoB)}${eq(p.equipoB)} ${badge(p.equipoB)}</span></div></div>`;
  }

  function renderCuadro() {
    const rondas = rondasAgrupadas();
    if (!rondas.length) { $(estadoHTML("", "Todavía no hay partidos cargados.")); return; }
    const idxMax = rondas.length - 1;
    if (cuadroEstado.actual === null || cuadroEstado.actual > idxMax) {
      cuadroEstado.actual = idxMax;
    }
    const actual = cuadroEstado.actual;
    const ronda = rondas[actual];
    const nombres = equiposMap();
    const zonas = Object.keys(ETIQUETA_ZONA).filter((z) => ronda.zonas[z]);
    const columnas = zonas.map((z) => {
      const [titulo, clase] = ETIQUETA_ZONA[z];
      const partidos = ronda.zonas[z].map((p) => tarjetaPartido(p, nombres, z !== "iniciales")).join("");
      return `<div><div class="zona-titulo ${clase}">${titulo}</div>${partidos || '<p class="tp-titulo">Sin partidos en esta zona.</p>'}</div>`;
    }).join("");
    const botones = `<button class="tab" data-ronda="-1" ${actual === 0 ? "disabled" : ""}>◀</button>` +
      `<span class="ronda-actual">Ronda ${ronda.numero}</span>` +
      `<button class="tab" data-ronda="1" ${actual === idxMax ? "disabled" : ""}>▶</button>`;
    $(`<h2>Cuadro · Ronda ${ronda.numero}</h2>` +
      `<div class="nav-ronda">${botones}</div>` +
      `<div class="zonas">${columnas}</div>`);
    document.querySelectorAll(".nav-ronda [data-ronda]").forEach((btn) => {
      btn.addEventListener("click", () => {
        cuadroEstado.actual += Number(btn.dataset.ronda);
        renderCuadro();
      });
    });
  }

  function renderFixture() {
    const rondas = rondasAgrupadas();
    if (!rondas.length) { $(estadoHTML("", "Todavía no hay partidos cargados.")); return; }
    const nombres = equiposMap();
    const html = rondas.map((r) => {
      const zonas = Object.keys(ETIQUETA_ZONA).filter((z) => r.zonas[z]);
      const secciones = zonas.map((z) => {
        const [titulo, clase] = ETIQUETA_ZONA[z];
        const cards = r.zonas[z]
          .slice()
          .sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""))
          .map((p) => tarjetaPartido(p, nombres, z !== "iniciales")).join("");
        return `<h3 class="zona-titulo ${clase}">Ronda ${r.numero} · ${titulo}</h3>${cards}`;
      }).join("");
      return `<div class="fixture-ronda">${secciones}</div>`;
    }).join("");
    $("<h2>Fixture</h2>" + html);
  }

  function renderGoleadores() {
    const lista = [...(torneo.goleadores || [])].sort((a, b) => b.goles - a.goles);
    if (!lista.length) { $(estadoHTML("", "Aún no se cargaron goleadores.")); return; }
    const nombres = equiposMap();
    const filas = lista.map((x) =>
      `<tr><td>${x.jugador}</td><td>${nombres[x.equipoId] || x.equipoId}</td><td><strong>${x.goles}</strong></td></tr>`
    ).join("");
    $('<h2>Goleadores</h2><table class="tabla"><thead><tr><th>Jugador</th><th>Equipo</th><th>Goles</th></tr></thead><tbody>' +
      filas + "</tbody></table>");
  }

  function renderVista(vista) {
    if (vista === "equipos") return renderEquipos();
    if (vista === "cuadro") return renderCuadro();
    if (vista === "fixture") return renderFixture();
    if (vista === "goleadores") return renderGoleadores();
  }

  const cuadroEstado = { actual: null };

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