/**
 * scheduler.js — Lógica de generación de partidos y asignación de calendario
 * FIBA 3x3 round-robin por grupos
 */

/**
 * Genera partidos round-robin para una lista de equipos
 * @param {Array} teams - Array de equipos
 * @param {string} group - Nombre del grupo (ej: "A", "B")
 * @param {number} categoryId
 * @returns {Array} Array de objetos match (sin id, listos para insertar)
 */
function generateRoundRobin(teams, group, categoryId) {
  const matches = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        group,
        round: 1,
        homeTeam: { connect: { id: teams[i].id } },
        awayTeam: { connect: { id: teams[j].id } },
        homeScore: null,
        awayScore: null,
        status: 'pending',
        category: { connect: { id: categoryId } },
      });
    }
  }

  // Regla especial: con 3 equipos se juega doble vuelta
  if (teams.length === 3) {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          group,
          round: 1,
          homeTeam: { connect: { id: teams[j].id } },
          awayTeam: { connect: { id: teams[i].id } },
          homeScore: null,
          awayScore: null,
          status: 'pending',
          category: { connect: { id: categoryId } },
        });
      }
    }
  }

  return matches;
}

function splitIntoGroups(teams) {
  // Mezclamos los equipos aleatoriamente antes de asignar grupos
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const n = shuffled.length;



  const result = [];
  if (n <= 7) {
    result.push({ name: 'Grupo A', teams: shuffled });
  } else if (n === 8) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 4) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(4, 8) });
  } else if (n === 9) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 5) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(5) });
  } else if (n === 10) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 5) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(5) });
  } else if (n === 11) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 6) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(6) });
  } else if (n === 12) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 4) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(4, 8) });
    result.push({ name: 'Grupo C', teams: shuffled.slice(8, 12) });
  } else if (n === 13) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 5) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(5, 9) });
    result.push({ name: 'Grupo C', teams: shuffled.slice(9, 13) });
  } else if (n === 14) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 5) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(5, 10) });
    result.push({ name: 'Grupo C', teams: shuffled.slice(10, 14) });
  } else if (n === 15) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 5) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(5, 10) });
    result.push({ name: 'Grupo C', teams: shuffled.slice(10, 15) });
  } else if (n === 16) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 4) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(4, 8) });
    result.push({ name: 'Grupo C', teams: shuffled.slice(8, 12) });
    result.push({ name: 'Grupo D', teams: shuffled.slice(12, 16) });
  } else if (n === 17) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 5) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(5, 9) });
    result.push({ name: 'Grupo C', teams: shuffled.slice(9, 13) });
    result.push({ name: 'Grupo D', teams: shuffled.slice(13, 17) });
  } else if (n === 18) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 6) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(6, 12) });
    result.push({ name: 'Grupo C', teams: shuffled.slice(12, 18) });
  } else if (n === 19) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 7) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(7, 13) });
    result.push({ name: 'Grupo C', teams: shuffled.slice(13, 19) });
  } else if (n === 20) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 5) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(5, 10) });
    result.push({ name: 'Grupo C', teams: shuffled.slice(10, 15) });
    result.push({ name: 'Grupo D', teams: shuffled.slice(15, 20) });
  } else if (n === 21) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 6) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(6, 11) });
    result.push({ name: 'Grupo C', teams: shuffled.slice(11, 16) });
    result.push({ name: 'Grupo D', teams: shuffled.slice(16, 21) });
  } else if (n === 22) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 6) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(6, 12) });
    result.push({ name: 'Grupo C', teams: shuffled.slice(12, 17) });
    result.push({ name: 'Grupo D', teams: shuffled.slice(17, 22) });
  } else if (n === 23) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 6) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(6, 12) });
    result.push({ name: 'Grupo C', teams: shuffled.slice(12, 18) });
    result.push({ name: 'Grupo D', teams: shuffled.slice(18, 23) });
  } else if (n === 24) {
    result.push({ name: 'Grupo A', teams: shuffled.slice(0, 6) });
    result.push({ name: 'Grupo B', teams: shuffled.slice(6, 12) });
    result.push({ name: 'Grupo C', teams: shuffled.slice(12, 18) });
    result.push({ name: 'Grupo D', teams: shuffled.slice(18, 24) });
  } else {
    // Fallback genérico a un solo grupo
    result.push({ name: 'Grupo A', teams: shuffled });
  }
  return result;
}

/**
 * FASE 1: Genera todos los partidos (sin horario asignado)
 */
function initMatches(groups, categoryId) {
  const allMatches = [];
  groups.forEach((group) => {
    const groupMatches = generateRoundRobin(group.teams, group.name, categoryId);
    allMatches.push(...groupMatches);
  });
  return allMatches;
}

/**
 * FASE 2: Asigna slots de tiempo y pista a un array de partidos.
 * Soporta múltiples jornadas (multi-día).
 * 
 * Principios:
 * - LLENAR PISTAS: Maximizar el uso de todas las pistas en cada franja de 15 min.
 * - Descanso de equipo: Un equipo NO juega 2 franjas consecutivas (mín. 1 slot libre).
 * - Orden de fases: Liga → Octavos → Cuartos → Semis → Final.
 * - No mezclar fases de la misma categoría en el mismo slot.
 * 
 * @param {Array} matches - Partidos con id ya guardados en BD
 * @param {Object} config - { courts, matchDuration, tournamentId, jornadas }
 * @returns {Array} ScheduleSlots listos para insertar
 */
function allocateSchedules(matches, config) {
  const { matchDuration = 15, tournamentId, jornadas, courts = [] } = config;

  if (!jornadas || jornadas.length === 0) {
    throw new Error("Se requiere al menos una jornada (día/hora) para programar.");
  }

  const hasAnyConfig = jornadas.some(j => (j.courtConfigs || []).length > 0);
  if (!hasAnyConfig) {
    console.log("ℹ️ No se detectaron configuraciones de pista. Todas las pistas estarán abiertas para todas las categorías.");
  }

  const parseTime = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const formatTime = (totalMins) => {
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // Enriquecemos las jornadas con sus configuraciones de pista
  const parsedJornadas = jornadas.map(j => {
    // Siempre incluimos todas las pistas del torneo en cada jornada.
    // El estado de cada pista dependerá de si tiene una configuración explícita o no.
    const courtConfigs = courts.map(c => {
      const cc = (j.courtConfigs || []).find(x => x.courtId === c.id);
      if (cc) {
        // Si hay configuración explícita:
        // - Si tiene categorías: solo esas pueden jugar.
        // - Si NO tiene categorías: la pista está CERRADA.
        return {
          courtId: cc.courtId,
          courtName: cc.court.name,
          allowedCategoryIds: new Set(cc.categories.map(cat => cat.id))
        };
      } else {
        // Si NO hay configuración para esta pista en esta jornada:
        // - Por defecto está ABIERTA para todas las categorías.
        return {
          courtId: c.id,
          courtName: c.name,
          allowedCategoryIds: null // null = Todas permitidas
        };
      }
    });

    return {
      id: j.id,
      date: j.date,
      startH: parseTime(j.startTime),
      endH: parseTime(j.endTime),
      courtConfigs
    };
  });


  const getPriority = (m) => {
    const g = (m.group || '').toLowerCase();
    if (g.includes('final')) {
      if (g.includes('semi')) return 3;
      if (g.includes('cuarto')) return 2;
      if (g.includes('octavo')) return 1;
      return 4; // Final
    }
    if (g.includes('cuarto')) return 2;
    if (g.includes('octavo')) return 1;
    return 0; // Liga / Grupos
  };

  let pendingMatches = matches.map(m => ({ ...m, priority: getPriority(m) }));

  const remainingPerCat = new Map();
  pendingMatches.forEach(m => {
    remainingPerCat.set(m.categoryId, (remainingPerCat.get(m.categoryId) || 0) + 1);
  });

  const slots = [];
  let currentJornadaIdx = 0;
  let currentMinute = parsedJornadas[0].startH;
  const teamsInSlot = new Map();

  let safetyCounter = 0;
  const maxIterations = 20000;

  while (pendingMatches.length > 0) {
    safetyCounter++;
    if (safetyCounter > maxIterations) {
      throw new Error(`No se pudieron programar todos los partidos. Quedan ${pendingMatches.length} partidos sin asignar. Revisa la configuración de pistas y categorías.`);
    }

    const currentJornada = parsedJornadas[currentJornadaIdx];
    const availableCourtConfigs = currentJornada.courtConfigs;

    if (availableCourtConfigs.length === 0) {
       // Esto no debería pasar con la lógica de arriba, pero por si acaso saltamos
       currentMinute = currentJornada.endH;
    } else {
      const currentMinPriority = Math.min(...pendingMatches.map(p => p.priority));
      const currentTimeKey = `${currentJornada.date}|${currentMinute}`;
      const prevTimeKey = `${currentJornada.date}|${currentMinute - matchDuration}`;

      const teamsPlayingNow = new Set();
      const catsPlayingNow = new Map();

      const prevTeamsData = teamsInSlot.get(prevTimeKey) || { teams: new Set(), cats: new Map() };
      const teamsWhoPlayedBefore = prevTeamsData.teams;
      const catsWhoPlayedBefore = prevTeamsData.cats;

      // Intentar llenar CADA PISTA configurada para esta jornada
      for (const config of availableCourtConfigs) {
        if (pendingMatches.length === 0) break;

        let bestMatchIdx = -1;
        let bestScore = -Infinity;

        for (let i = 0; i < pendingMatches.length; i++) {
          const m = pendingMatches[i];

          // 1. Filtro de Categoría por Pista (Restricción del usuario)
          // Si config.allowedCategoryIds es null -> Abierta para todos.
          // Si es un Set -> Solo las del Set (si está vacío, PISTA CERRADA).
          if (config.allowedCategoryIds !== null && !config.allowedCategoryIds.has(m.categoryId)) {
            continue;
          }

          if (m.priority > currentMinPriority) continue;

          const hId = m.homeTeam?.connect?.id || m.homeTeamId;
          const aId = m.awayTeam?.connect?.id || m.awayTeamId;

          const isRested =
            (!hId || (!teamsWhoPlayedBefore.has(hId) && !teamsPlayingNow.has(hId))) &&
            (!aId || (!teamsWhoPlayedBefore.has(aId) && !teamsPlayingNow.has(aId)));

          if (!isRested) continue;

          if (catsPlayingNow.has(m.categoryId) && catsPlayingNow.get(m.categoryId) !== m.priority) continue;
          if (catsWhoPlayedBefore.has(m.categoryId) && catsWhoPlayedBefore.get(m.categoryId) !== m.priority) continue;

          let score = 0;
          const catRemaining = remainingPerCat.get(m.categoryId) || 0;
          score += catRemaining * 100;
          if (catsWhoPlayedBefore.has(m.categoryId)) score += 50;

          if (score > bestScore) {
            bestScore = score;
            bestMatchIdx = i;
          }
        }

        if (bestMatchIdx !== -1) {
          const match = pendingMatches.splice(bestMatchIdx, 1)[0];
          const hId = match.homeTeam?.connect?.id || match.homeTeamId;
          const aId = match.awayTeam?.connect?.id || match.awayTeamId;

          if (hId) teamsPlayingNow.add(hId);
          if (aId) teamsPlayingNow.add(aId);
          catsPlayingNow.set(match.categoryId, match.priority);
          remainingPerCat.set(match.categoryId, (remainingPerCat.get(match.categoryId) || 1) - 1);

          slots.push({
            court: config.courtName, // Usamos el nombre de la pista configurada
            date: currentJornada.date,
            startTime: formatTime(currentMinute),
            matchId: match.id,
            tournamentId,
          });
        }
      }

      teamsInSlot.set(currentTimeKey, { teams: teamsPlayingNow, cats: catsPlayingNow });
      currentMinute += matchDuration;
    }

    // Control de cambio de jornada
    if (currentMinute + matchDuration > currentJornada.endH) {
      currentJornadaIdx++;
      if (currentJornadaIdx < parsedJornadas.length) {
        currentMinute = parsedJornadas[currentJornadaIdx].startH;
      } else if (pendingMatches.length > 0) {
        throw new Error(`No hay suficiente tiempo/pistas configuradas para todos los partidos. Quedan ${pendingMatches.length} partidos sin asignar.`);
      }
    }
  }

  return slots;
}


module.exports = { initMatches, allocateSchedules, splitIntoGroups };
