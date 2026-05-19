import * as XLSX from 'xlsx'

/**
 * Genera y descarga un fichero Excel con los datos de una categoría:
 *  - Hoja 1: Partidos (Liga y Fase Final)
 *  - Hoja 2: Clasificación de Grupos
 *  - Hoja 3: Cuadro Fase Final
 *  - Hoja 4: Ranking Final
 *
 * @param {Object} opts
 * @param {Object} opts.tournament  - objeto torneo { name, ... }
 * @param {Object} opts.category    - objeto categoría { name, gender, ... }
 * @param {Array}  opts.matches     - array de partidos
 * @param {Object} opts.standings   - { byGroup: { [groupName]: [...] }, global: [...] }
 * @param {Array}  opts.finalRanking - array de ranking final
 */
export function exportCategoryToExcel({ tournament, category, matches, standings, finalRanking }) {
  const wb = XLSX.utils.book_new()

  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const dateStamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`

  const safeName = (s) => (s || '').replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s_-]/g, '').trim()

  const fileName = `${safeName(tournament.name)}_${safeName(category.name)}_datos_${dateStamp}.xlsx`

  // ── HOJA 1: PARTIDOS ──────────────────────────────────────────────
  const leagueMatches = matches.filter(m => !m.round || m.round === 1)
  const finalMatches  = matches.filter(m => m.round && m.round >= 2)

  const matchRows = []

  if (leagueMatches.length > 0) {
    matchRows.push(['── LIGA ──', '', '', '', '', '', '', '', ''])
    matchRows.push(['Nº Partido', 'Fase/Grupo', 'Día', 'Horario', 'Pista', 'Equipo Local', 'Marcador L', 'Marcador V', 'Equipo Visitante', 'Estado', 'Observaciones'])
    leagueMatches
      .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0))
      .forEach(m => {
        matchRows.push([
          m.matchNumber ? `#${String(m.matchNumber).padStart(4, '0')}` : '—',
          m.group || '—',
          m.scheduleSlot?.date ? m.scheduleSlot.date.split('-').reverse().join('-') : '—',
          m.scheduleSlot?.startTime || '—',
          m.scheduleSlot?.court || '—',
          m.homeTeam?.name || 'TBD',
          m.homeScore ?? '',
          m.awayScore ?? '',
          m.awayTeam?.name || 'TBD',
          m.status === 'played' ? 'Jugado' : 'Pendiente',
          m.observations || ''
        ])
      })
  }

  if (finalMatches.length > 0) {
    matchRows.push([])
    matchRows.push(['── FASE FINAL ──', '', '', '', '', '', '', '', ''])
    matchRows.push(['Nº Partido', 'Fase/Grupo', 'Día', 'Horario', 'Pista', 'Equipo Local', 'Marcador L', 'Marcador V', 'Equipo Visitante', 'Estado', 'Observaciones'])
    finalMatches
      .sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0))
      .forEach(m => {
        matchRows.push([
          m.matchNumber ? `#${String(m.matchNumber).padStart(4, '0')}` : '—',
          m.group || '—',
          m.scheduleSlot?.date ? m.scheduleSlot.date.split('-').reverse().join('-') : '—',
          m.scheduleSlot?.startTime || '—',
          m.scheduleSlot?.court || '—',
          m.homeTeam?.name || 'TBD',
          m.homeScore ?? '',
          m.awayScore ?? '',
          m.awayTeam?.name || 'TBD',
          m.status === 'played' ? 'Jugado' : 'Pendiente',
          m.observations || ''
        ])
      })
  }

  if (matchRows.length === 0) {
    matchRows.push(['Sin partidos generados'])
  }

  const wsPartidos = XLSX.utils.aoa_to_sheet(matchRows)
  wsPartidos['!cols'] = [
    { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
    { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 22 },
    { wch: 12 }, { wch: 30 }
  ]
  XLSX.utils.book_append_sheet(wb, wsPartidos, 'Partidos')

  // ── HOJA 2: CLASIFICACIÓN DE GRUPOS ───────────────────────────────
  const groupRows = []
  const groupEntries = Object.entries(standings.byGroup || {}).sort()

  if (groupEntries.length > 0) {
    groupEntries.forEach(([groupName, groupStandings]) => {
      groupRows.push([`── ${groupName} ──`, '', '', '', '', '', '', ''])
      groupRows.push(['Pos', 'Equipo', 'PJ', 'G', 'P', 'PF', 'PC', 'Diferencia'])
      groupStandings.forEach((s, i) => {
        groupRows.push([
          `${i + 1}º`,
          s.team.name,
          s.played,
          s.wins,
          s.losses,
          s.pf,
          s.pa,
          s.diff >= 0 ? `+${s.diff}` : String(s.diff)
        ])
      })
      groupRows.push([])
    })
  } else {
    groupRows.push(['Sin datos de clasificación de grupos'])
  }

  const wsGrupos = XLSX.utils.aoa_to_sheet(groupRows)
  wsGrupos['!cols'] = [
    { wch: 6 }, { wch: 24 }, { wch: 6 }, { wch: 6 },
    { wch: 6 }, { wch: 8 }, { wch: 8 }, { wch: 12 }
  ]
  XLSX.utils.book_append_sheet(wb, wsGrupos, 'Clasificación Grupos')

  // ── HOJA 3: CUADRO FASE FINAL ─────────────────────────────────────
  const finalRows = []
  const phases = ['Octavos', 'Cuartos', 'Semifinal', 'Final']

  phases.forEach(phase => {
    const phaseMatches = finalMatches.filter(m => m.group?.toLowerCase().includes(phase.toLowerCase()))
    if (phaseMatches.length > 0) {
      finalRows.push([`── ${phase.toUpperCase()} ──`, '', '', '', '', '', ''])
      finalRows.push(['Nº Partido', 'Día', 'Horario', 'Pista', 'Equipo Local', 'Resultado', 'Equipo Visitante', 'Estado'])
      phaseMatches.sort((a, b) => (a.matchNumber || 0) - (b.matchNumber || 0)).forEach(m => {
        finalRows.push([
          m.matchNumber ? `#${String(m.matchNumber).padStart(4, '0')}` : '—',
          m.scheduleSlot?.date ? m.scheduleSlot.date.split('-').reverse().join('-') : '—',
          m.scheduleSlot?.startTime || '—',
          m.scheduleSlot?.court || '—',
          m.homeTeam?.name || 'TBD',
          m.status === 'played' ? `${m.homeScore} - ${m.awayScore}` : 'Pendiente',
          m.awayTeam?.name || 'TBD',
          m.status === 'played' ? 'Jugado' : 'Pendiente'
        ])
      })
      finalRows.push([])
    }
  })

  if (finalRows.length === 0) {
    finalRows.push(['Sin fase final generada'])
  }

  const wsFinal = XLSX.utils.aoa_to_sheet(finalRows)
  wsFinal['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 12 },
    { wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 12 }
  ]
  XLSX.utils.book_append_sheet(wb, wsFinal, 'Fase Final')

  // ── HOJA 4: RANKING FINAL ─────────────────────────────────────────
  const rankingRows = []

  if (finalRanking.length > 0) {
    rankingRows.push(['Puesto', 'Equipo', 'Logro', 'Victorias', 'Diferencia', 'Puntos Favor'])
    finalRanking.forEach(r => {
      const medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : `${r.rank}º`
      rankingRows.push([
        medal,
        r.team?.name || '—',
        r.note || '',
        r.wins ?? '',
        r.diff != null ? (r.diff >= 0 ? `+${r.diff}` : String(r.diff)) : '',
        r.pf ?? ''
      ])
    })
  } else {
    rankingRows.push(['Sin ranking final disponible'])
  }

  const wsRanking = XLSX.utils.aoa_to_sheet(rankingRows)
  wsRanking['!cols'] = [
    { wch: 8 }, { wch: 26 }, { wch: 18 },
    { wch: 10 }, { wch: 12 }, { wch: 14 }
  ]
  XLSX.utils.book_append_sheet(wb, wsRanking, 'Ranking Final')

  // ── DESCARGAR ─────────────────────────────────────────────────────
  XLSX.writeFile(wb, fileName)
}
