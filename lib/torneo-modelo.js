// Reglas de negocio del torneo (doble eliminación por vidas).
// Módulo puro: sin DOM, sin Node, sin formato de salida. Lo usan el build,
// el navegador y las pruebas. Agregar una regla nueva va acá, en un solo lugar.

// Lado ganador del partido: "A", "B" o null si no se puede definir
// (aún no se jugó, o no hay resultado ni penales en un empate).
export function ladoGanador(partido) {
  if (partido.estado !== "jugado" || !partido.resultado) return null;
  const r = partido.resultado;
  if (r.golesA !== r.golesB) return r.golesA > r.golesB ? "A" : "B";
  if (partido.penales) return partido.penales.a > partido.penales.b ? "A" : "B";
  return null;
}

// ¿Perdió este equipo en este partido? Solo cuenta si hay un ganador definido.
function perdio(partido, equipoId) {
  const lado = ladoGanador(partido);
  if (lado === null) return false;
  if (partido.equipoA === equipoId) return lado === "B";
  if (partido.equipoB === equipoId) return lado === "A";
  return false;
}

// Vidas restantes de un equipo (todas arrancan en 2).
// Ronda 1 (zona iniciales) consume una vida al perder; en zona perdedores
// una derrota elimina directo.
export function vidasEquipo(torneo, equipoId) {
  let vidas = 2;
  for (const ronda of torneo.rondas || []) {
    for (const partido of ronda.partidos || []) {
      if (partido.estado !== "jugado" || !perdio(partido, equipoId)) continue;
      if (ronda.zona === "perdedores") { vidas = 0; continue; }
      vidas -= 1;
    }
  }
  return Math.max(vidas, 0);
}

// En la ronda 1 todavía nadie muestra su vida: recién se define en las zonas.
export function mostrarVidas(zona) {
  return zona !== "iniciales";
}
