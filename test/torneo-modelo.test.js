import { test } from "node:test";
import assert from "node:assert/strict";
import * as modelo from "../lib/torneo-modelo.js";

function torneoDe(rondas) {
  return { equipos: [{ id: "eq-1", nombre: "A" }, { id: "eq-2", nombre: "B" }], rondas };
}

const perdido = (zona, numero = 1) => ({
  numero,
  zona,
  partidos: [{ equipoA: "eq-1", equipoB: "eq-2", estado: "jugado", resultado: { golesA: 0, golesB: 2 } }],
});

test("ladoGanador: devuelve A o B según los goles", () => {
  assert.equal(modelo.ladoGanador({ estado: "jugado", resultado: { golesA: 2, golesB: 1 } }), "A");
  assert.equal(modelo.ladoGanador({ estado: "jugado", resultado: { golesA: 1, golesB: 2 } }), "B");
});

test("ladoGanador: el desempate se define por penales", () => {
  const base = { estado: "jugado", resultado: { golesA: 0, golesB: 0 } };
  assert.equal(modelo.ladoGanador({ ...base, penales: { a: 3, b: 2 } }), "A");
  assert.equal(modelo.ladoGanador({ ...base, penales: { a: 2, b: 3 } }), "B");
});

test("ladoGanador: sin resultado, sin estado jugado o empatado sin penales devuelve null", () => {
  assert.equal(modelo.ladoGanador({ estado: "por jugar" }), null);
  assert.equal(modelo.ladoGanador({ estado: "jugado" }), null);
  assert.equal(modelo.ladoGanador({ estado: "jugado", resultado: { golesA: 1, golesB: 1 } }), null);
});

test("vidasEquipo: todos arrancan con 2 vidas", () => {
  assert.equal(modelo.vidasEquipo(torneoDe([]), "eq-1"), 2);
});

test("vidasEquipo: perder en Ronda 1 consume una vida", () => {
  const t = torneoDe([perdido("iniciales")]);
  assert.equal(modelo.vidasEquipo(t, "eq-1"), 1);
  assert.equal(modelo.vidasEquipo(t, "eq-2"), 2);
});

test("vidasEquipo: perder en zona perdedores elimina", () => {
  assert.equal(modelo.vidasEquipo(torneoDe([perdido("perdedores", 2)]), "eq-1"), 0);
});

test("vidasEquipo: nunca baja de 0 vidas", () => {
  const t = torneoDe([perdido("iniciales"), perdido("ganadores", 2)]);
  assert.equal(modelo.vidasEquipo(t, "eq-1"), 0);
});

test("vidasEquipo: no cuenta partidos no jugados", () => {
  const t = torneoDe([{ numero: 1, zona: "iniciales", partidos: [
    { equipoA: "eq-1", equipoB: "eq-2", estado: "por jugar", fecha: "2026-10-04" },
  ] }]);
  assert.equal(modelo.vidasEquipo(t, "eq-1"), 2);
});

test("vidasEquipo: un equipo que no aparece en los partidos conserva sus 2 vidas", () => {
  assert.equal(modelo.vidasEquipo(torneoDe([perdido("iniciales")]), "eq-99"), 2);
});

test("mostrarVidas: solo a partir de las zonas ganadores/perdedores", () => {
  assert.equal(modelo.mostrarVidas("iniciales"), false);
  assert.equal(modelo.mostrarVidas("ganadores"), true);
  assert.equal(modelo.mostrarVidas("perdedores"), true);
});
