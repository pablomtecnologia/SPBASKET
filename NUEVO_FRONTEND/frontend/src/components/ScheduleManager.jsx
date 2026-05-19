import { useState, useEffect, useCallback } from 'react'
import { getSchedule, createSchedule, deleteSchedule, getCategories, getJornadas, createJornada, deleteJornada, updateScore, updateScheduleSlot, activateMatch } from '../api'
import PrintableActas from './PrintableActas'

const formatDisplayDate = (date) => date?.includes('-') ? date.split('-').reverse().join('-') : (date || '')

const toDisplayDate = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) return raw
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split('-')
    return `${day}-${month}-${year}`
  }
  return raw
}

const normalizeDateInput = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) return raw

  const normalized = raw.replace(/\./g, '-').replace(/\//g, '-')
  const parts = normalized.split('-').map(part => part.trim()).filter(Boolean)
  if (parts.length !== 3) return raw

  if (parts[0].length === 4) {
    const [year, month, day] = parts
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year.padStart(4, '0')}`
  }

  const [day, month, year] = parts
  if (year.length !== 4) return raw
  return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`
}

const displayDateToIso = (value) => {
  const normalized = normalizeDateInput(value)
  if (!/^\d{2}-\d{2}-\d{4}$/.test(normalized)) return normalized
  const [day, month, year] = normalized.split('-')
  return `${year}-${month}-${day}`
}

const isValidDisplayDate = (value) => /^\d{2}-\d{2}-\d{4}$/.test(value)

const isValidTime = (value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(String(value || '').trim())

const normalizeTimeInput = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (isValidTime(raw)) return raw

  const digits = raw.replace(/\D/g, '')
  if (digits.length === 4) return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`
  if (digits.length === 3) return `0${digits.slice(0, 1)}:${digits.slice(1, 3)}`
  return raw
}

const sortJornadas = (items = []) => [...items].sort((a, b) => {
  const aDate = displayDateToIso(a.date)
  const bDate = displayDateToIso(b.date)
  if (aDate !== bDate) return aDate.localeCompare(bDate)
  return a.startTime.localeCompare(b.startTime)
})

const sortNatural = (values) => [...values].sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' }))

const normalizeHexColor = (hex) => {
  const clean = (hex || '').replace('#', '').trim()
  if (clean.length === 3) return `#${clean.split('').map(char => char + char).join('')}`
  if (clean.length === 6) return `#${clean}`
  return '#e5e7eb'
}

const getContrastText = (hex) => {
  const clean = normalizeHexColor(hex).replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  const luminance = (0.299 * r) + (0.587 * g) + (0.114 * b)
  return luminance > 170 ? '#111827' : '#ffffff'
}

const buildTimeRange = (startTime, endTime, stepMinutes) => {
  const start = normalizeTimeInput(startTime)
  const end = normalizeTimeInput(endTime)
  if (!isValidTime(start) || !isValidTime(end)) return []

  const [startHour, startMinute] = start.split(':').map(Number)
  const [endHour, endMinute] = end.split(':').map(Number)
  const startTotal = (startHour * 60) + startMinute
  const endTotal = (endHour * 60) + endMinute
  const step = Math.max(1, Number(stepMinutes) || 15)
  const result = []

  for (let current = startTotal; current < endTotal; current += step) {
    const hour = String(Math.floor(current / 60)).padStart(2, '0')
    const minute = String(current % 60).padStart(2, '0')
    result.push(`${hour}:${minute}`)
  }

  return result
}

function buildScheduleGridData(slots, categories, jornadas = [], defaultMatchDuration = 15) {
  const scheduledSlots = (slots || []).filter(slot => slot?.match)
  const normalizeGridDate = (value) => toDisplayDate(value)
  const jornadaDates = (jornadas || []).map(j => normalizeGridDate(j?.date)).filter(Boolean)
  const slotDates = scheduledSlots.map(slot => normalizeGridDate(slot.date)).filter(Boolean)
  const dates = sortNatural(new Set([...jornadaDates, ...slotDates]))

  return dates.map(date => {
    const daySlots = scheduledSlots.filter(slot => normalizeGridDate(slot.date) === date)
    const dayJornadas = (jornadas || []).filter(j => normalizeGridDate(j?.date) === date)
    const jornadaTimes = dayJornadas.flatMap(j => buildTimeRange(j.startTime, j.endTime, j.matchDuration || defaultMatchDuration))
    const slotTimes = daySlots.map(slot => slot.startTime).filter(Boolean)
    const times = sortNatural(new Set([...jornadaTimes, ...slotTimes]))
    const courts = sortNatural(new Set(daySlots.map(slot => slot.court).filter(Boolean)))

    const rows = times.map(time => ({
      time,
      cells: courts.map(court => {
        const slot = daySlots.find(item => item.startTime === time && item.court === court)
        const match = slot?.match || null
        const category = categories.find(cat => Number(cat.id) === Number(match?.categoryId))
        return { court, slot, match, category }
      })
    }))

    return { date, times, courts, rows }
  })
}

const getScheduleCellFooter = (category) => {
  if (!category) return 'Sin categoría'
  return `${category.name} · ${category.gender}${category.isVeteran ? ' · VET' : ''}`
}

function getPrintableGridMetrics(courtCount, orientation) {
  const isLandscape = orientation === 'landscape'

  if (isLandscape) {
    if (courtCount >= 8) return { timeWidth: 44, cellHeight: 62, titleFont: '1.15rem', subtitleFont: '0.76rem', headerFont: '0.58rem', timeFont: '0.62rem', topFont: '0.52rem', teamFont: '0.58rem', scoreFont: '0.62rem', footerFont: '0.48rem', padding: '0.18rem' }
    if (courtCount >= 6) return { timeWidth: 48, cellHeight: 70, titleFont: '1.22rem', subtitleFont: '0.8rem', headerFont: '0.62rem', timeFont: '0.68rem', topFont: '0.56rem', teamFont: '0.62rem', scoreFont: '0.68rem', footerFont: '0.5rem', padding: '0.24rem' }
    return { timeWidth: 54, cellHeight: 82, titleFont: '1.3rem', subtitleFont: '0.88rem', headerFont: '0.72rem', timeFont: '0.72rem', topFont: '0.62rem', teamFont: '0.68rem', scoreFont: '0.74rem', footerFont: '0.54rem', padding: '0.3rem' }
  }

  if (courtCount >= 6) return { timeWidth: 46, cellHeight: 64, titleFont: '1.1rem', subtitleFont: '0.74rem', headerFont: '0.56rem', timeFont: '0.6rem', topFont: '0.5rem', teamFont: '0.56rem', scoreFont: '0.6rem', footerFont: '0.46rem', padding: '0.16rem' }
  if (courtCount >= 4) return { timeWidth: 50, cellHeight: 74, titleFont: '1.18rem', subtitleFont: '0.78rem', headerFont: '0.62rem', timeFont: '0.66rem', topFont: '0.56rem', teamFont: '0.6rem', scoreFont: '0.66rem', footerFont: '0.48rem', padding: '0.22rem' }
  return { timeWidth: 56, cellHeight: 90, titleFont: '1.28rem', subtitleFont: '0.86rem', headerFont: '0.72rem', timeFont: '0.72rem', topFont: '0.62rem', teamFont: '0.68rem', scoreFont: '0.74rem', footerFont: '0.54rem', padding: '0.28rem' }
}

function getRecommendedPrintOrientation(gridDays) {
  const maxCourts = Math.max(0, ...(gridDays || []).map(day => day.courts?.length || 0))
  return maxCourts >= 4 ? 'landscape' : 'portrait'
}

function ScheduleGridDay({ day, tournamentName, printable = false, isLast = false, printOrientation = 'landscape' }) {
  const metrics = printable ? getPrintableGridMetrics(day.courts.length || 1, printOrientation) : null

  return (
    <div
      className={printable ? 'schedule-print-day' : 'card'}
      style={{
        marginBottom: printable ? '0' : '1.25rem',
        padding: printable ? '6mm' : '1rem',
        overflowX: printable ? 'visible' : 'auto',
        background: '#ffffff',
        color: '#111827',
        pageBreakAfter: printable && !isLast ? 'always' : 'auto',
        breakAfter: printable && !isLast ? 'page' : 'auto',
        minHeight: printable ? (printOrientation === 'landscape' ? '210mm' : '297mm') : 'auto',
      }}
    >
      <div style={{ marginBottom: '0.9rem', textAlign: 'center' }}>
        <div style={{ fontSize: printable ? metrics.titleFont : '1.3rem', fontWeight: 900, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {tournamentName}
        </div>
        <div style={{ fontSize: printable ? metrics.subtitleFont : '0.9rem', color: '#6b7280', fontWeight: 700, marginTop: '0.2rem' }}>
          Calendario · {formatDisplayDate(day.date)}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: printable ? '100%' : `${Math.max(day.courts.length, 1) * 200 + 80}px` }}>
        <thead>
          <tr>
            <th style={{ width: printable ? `${metrics.timeWidth}px` : '80px', background: '#e5e7eb', color: '#111827', border: '1px solid #9ca3af', padding: printable ? metrics.padding : '0.55rem', fontSize: printable ? metrics.headerFont : 'inherit' }}>Hora</th>
            {day.courts.map(court => (
              <th key={court} style={{ background: '#1f2937', color: '#ffffff', border: '1px solid #9ca3af', padding: printable ? metrics.padding : '0.55rem', fontSize: printable ? metrics.headerFont : '0.85rem', textTransform: 'uppercase' }}>
                {court}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {day.rows.map(row => (
            <tr key={`${day.date}-${row.time}`}>
              <td style={{ border: '1px solid #9ca3af', background: '#f9fafb', padding: printable ? metrics.padding : '0.6rem', textAlign: 'center', fontWeight: 800, fontSize: printable ? metrics.timeFont : 'inherit' }}>
                {row.time}
              </td>
              {row.cells.map(({ court, match, category }) => {
                const bg = match ? normalizeHexColor(category?.color) : '#ffffff'
                const fg = match ? getContrastText(bg) : '#6b7280'
                return (
                  <td
                    key={`${day.date}-${row.time}-${court}`}
                    style={{
                      border: '1px solid #9ca3af',
                      background: bg,
                      color: fg,
                      padding: printable ? metrics.padding : '0.45rem',
                      height: printable ? `${metrics.cellHeight}px` : '110px',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      printColorAdjust: 'exact',
                      WebkitPrintColorAdjust: 'exact',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {match ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', lineHeight: 1.15 }}>
                        <div style={{ fontSize: printable ? metrics.topFont : '0.72rem', fontWeight: 900 }}>
                          {[match.matchNumber ? `#${match.matchNumber}` : '', match.group || `R${match.round || 1}`].filter(Boolean).join(' · ')}
                        </div>
                        <div style={{ fontSize: printable ? metrics.teamFont : '0.76rem', fontWeight: 800 }}>{match.homeTeam?.name || match.homePlaceholder || 'TBD'}</div>
                        <div style={{ fontSize: printable ? metrics.scoreFont : '0.82rem', fontWeight: 900 }}>
                          {match.homeScore != null && match.awayScore != null ? `${match.homeScore} - ${match.awayScore}` : 'vs'}
                        </div>
                        <div style={{ fontSize: printable ? metrics.teamFont : '0.76rem', fontWeight: 800 }}>{match.awayTeam?.name || match.awayPlaceholder || 'TBD'}</div>
                        <div style={{ fontSize: printable ? metrics.footerFont : '0.68rem', fontWeight: 700, opacity: 0.95 }}>
                          {getScheduleCellFooter(category)}
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#9ca3af', fontWeight: 700 }}>-</div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ScheduleManager({ tournament, onScheduleChange, timerState }) {
  const [slots, setSlots] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  // Jornadas — inicializar desde el objeto torneo que ya viene hidratado del backend
  const [jornadas, setJornadas] = useState(tournament.jornadas || [])
  const [jDate, setJDate] = useState('')
  const [jStart, setJStart] = useState('09:00')
  const [jEnd, setJEnd] = useState('14:00')
  const [jMatchDuration, setJMatchDuration] = useState(tournament.matchDuration || 15)
  const [jMatchPlayTime, setJMatchPlayTime] = useState(tournament.matchPlayTime || 10)
  const [jRestRoundsBetweenMatches, setJRestRoundsBetweenMatches] = useState(1)

  // Config form

  const [generating, setGenerating] = useState(false)
  const [matchDuration, setMatchDuration] = useState(tournament.matchDuration || 15)
  const [matchPlayTime, setMatchPlayTime] = useState(tournament.matchPlayTime || 10)

  // Timer State
  const {
    localMatchPlayTime, setLocalMatchPlayTime,
    timeLeft, setTimeLeft,
    timerRunning, setTimerRunning
  } = timerState;

  // Filtros
  const [filterTime, setFilterTime] = useState('')
  const [filterCourt, setFilterCourt] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterDate, setFilterDate] = useState('')

  // Resultados
  const [scores, setScores] = useState({})
  const [editingScoreIds, setEditingScoreIds] = useState([])

  const [editingJornada, setEditingJornada] = useState(null)
  const [jEditDate, setJEditDate] = useState('')
  const [jEditStart, setJEditStart] = useState('')
  const [jEditEnd, setJEditEnd] = useState('')
  const [jEditMatchDuration, setJEditMatchDuration] = useState(tournament.matchDuration || 15)
  const [jEditMatchPlayTime, setJEditMatchPlayTime] = useState(tournament.matchPlayTime || 10)
  const [jEditRestRoundsBetweenMatches, setJEditRestRoundsBetweenMatches] = useState(1)

  // Edición de Slot (Pista/Hora)
  const [editingSlotId, setEditingSlotId] = useState(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editCourt, setEditCourt] = useState('')
  const [showGridPreview, setShowGridPreview] = useState(false)
  const [printOrientation, setPrintOrientation] = useState('landscape')
  const [isPrintingGrid, setIsPrintingGrid] = useState(false)
  const [isPrintingActas, setIsPrintingActas] = useState(false)
  const isEditingSchedule = Boolean(editingJornada || editingSlotId || editingScoreIds.length > 0)

  const load = useCallback(async () => {
    try {
      const [slotsData, catsData, jornadasData] = await Promise.all([
        getSchedule(tournament.id),
        getCategories(tournament.id),
        getJornadas(tournament.id)
      ])
      setSlots(slotsData)
      setCategories(catsData)
      // Solo actualizar jornadas si la API devuelve datos reales
      // NUNCA sobreescribir con array vacío — puede ser un fallo de red
      if (Array.isArray(jornadasData) && jornadasData.length > 0 && !editingJornada) {
        setJornadas(sortJornadas(jornadasData.map(j => ({ ...j, date: toDisplayDate(j.date) }))))
      }
      onScheduleChange(slotsData.length > 0)
    } catch (e) {
      console.error("Error cargando calendario:", e);
      // No mostrar error de jornadas si ya tenemos datos del torneo
    }
    finally { setLoading(false) }
  }, [tournament.id, onScheduleChange, editingJornada])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (isEditingSchedule) return
    const interval = setInterval(() => {
      load();
    }, 10000);
    return () => clearInterval(interval);
  }, [load, isEditingSchedule])

  // Sincronizar jornadas si el prop tournament cambia (p.ej. al editar el torneo)
  useEffect(() => {
    if (!editingJornada && tournament.jornadas && tournament.jornadas.length > 0) {
      setJornadas(sortJornadas(tournament.jornadas.map(j => ({ ...j, date: toDisplayDate(j.date) }))))
    }
  }, [tournament.id, tournament.jornadas, editingJornada])

  useEffect(() => {
    setJMatchDuration(tournament.matchDuration || 15)
    setJMatchPlayTime(tournament.matchPlayTime || 10)
  }, [tournament.matchDuration, tournament.matchPlayTime])

  useEffect(() => {
    const handleAfterPrint = () => {
      setIsPrintingGrid(false)
      setIsPrintingActas(false)
    }
    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])




  const handleAddJornada = async (e) => {
    e.preventDefault()
    setError(null); setInfo(null)
    try {
      const normalizedDate = normalizeDateInput(jDate)
      const normalizedStart = normalizeTimeInput(jStart)
      const normalizedEnd = normalizeTimeInput(jEnd)
      if (!isValidDisplayDate(normalizedDate)) throw new Error('La fecha debe tener formato DD-MM-YYYY.')
      if (!isValidTime(normalizedStart) || !isValidTime(normalizedEnd)) throw new Error('La hora debe tener formato HH:MM.')

      if (parseInt(jMatchPlayTime) > parseInt(jMatchDuration)) throw new Error('El tiempo de partido de la franja no puede ser mayor que la duración de la ronda.')
      const j = await createJornada(tournament.id, {
        date: displayDateToIso(normalizedDate),
        startTime: normalizedStart,
        endTime: normalizedEnd,
        matchDuration: parseInt(jMatchDuration),
        matchPlayTime: parseInt(jMatchPlayTime),
        restRoundsBetweenMatches: Math.max(0, parseInt(jRestRoundsBetweenMatches) || 0)
      })
      setJornadas(prev => [...prev, { ...j, date: toDisplayDate(j.date) }])
      setJDate(''); setJStart('09:00'); setJEnd('14:00')
      setJMatchDuration(tournament.matchDuration || 15)
      setJMatchPlayTime(tournament.matchPlayTime || 10)
      setJRestRoundsBetweenMatches(1)
      setInfo('✅ Jornada añadida')
    } catch (e) { setError(e.message) }
  }

  const handleEditJornada = (j) => {
    setEditingJornada(j.id)
    setJEditDate(j.date)
    setJEditStart(j.startTime)
    setJEditEnd(j.endTime)
    setJEditMatchDuration(j.matchDuration || tournament.matchDuration || 15)
    setJEditMatchPlayTime(j.matchPlayTime || tournament.matchPlayTime || 10)
    setJEditRestRoundsBetweenMatches(j.restRoundsBetweenMatches ?? 1)
  }

  const handleSaveJornadaEdit = async (id) => {
    setError(null); setInfo(null)
    try {
      const normalizedDate = normalizeDateInput(jEditDate)
      const normalizedStart = normalizeTimeInput(jEditStart)
      const normalizedEnd = normalizeTimeInput(jEditEnd)
      if (!isValidDisplayDate(normalizedDate)) throw new Error('La fecha debe tener formato DD-MM-YYYY.')
      if (!isValidTime(normalizedStart) || !isValidTime(normalizedEnd)) throw new Error('La hora debe tener formato HH:MM.')
      if (parseInt(jEditMatchPlayTime) > parseInt(jEditMatchDuration)) throw new Error('El tiempo de partido de la franja no puede ser mayor que la duración de la ronda.')

      const res = await fetch(`/api/tournaments/${tournament.id}/jornadas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: displayDateToIso(normalizedDate),
          startTime: normalizedStart,
          endTime: normalizedEnd,
          matchDuration: parseInt(jEditMatchDuration),
          matchPlayTime: parseInt(jEditMatchPlayTime),
          restRoundsBetweenMatches: Math.max(0, parseInt(jEditRestRoundsBetweenMatches) || 0)
        })
      })
      if (!res.ok) {
        let message = "Error al actualizar jornada"
        try {
          const err = await res.json()
          message = err.error || message
        } catch {}
        throw new Error(message)
      }
      const updated = await res.json()
      setJornadas(prev => prev.map(j => j.id === id ? { ...updated, date: toDisplayDate(updated.date) } : j))
      setEditingJornada(null)
      setInfo('✅ Jornada actualizada')
    } catch (e) { setError(e.message) }
  }

  const handleDeleteJornada = async (id) => {
    setError(null); setInfo(null)
    try {
      await deleteJornada(tournament.id, id)
      setJornadas(jornadas.filter(j => j.id !== id))
    } catch (e) { setError(e.message) }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setError(null); setInfo(null)
    setGenerating(true)
    try {
      if (jornadas.length === 0) throw new Error('Añade al menos una jornada antes de generar el calendario.')
      if (jornadas.some(j => parseInt(j.matchPlayTime ?? tournament.matchPlayTime ?? 10) > parseInt(j.matchDuration ?? tournament.matchDuration ?? 15))) {
        throw new Error('âŒ Hay jornadas donde el tiempo de partido es mayor que la duración de la ronda.')
      }
      if (parseInt(matchPlayTime) > parseInt(matchDuration)) {
        throw new Error('❌ El tiempo de partido no puede ser mayor que el tiempo de ronda.')
      }
      await createSchedule(tournament.id, {
        matchDuration: parseInt(matchDuration),
        matchPlayTime: parseInt(matchPlayTime)
      })
      await load()
      setInfo('✅ Calendario generado correctamente')
    } catch (e) { setError(e.message) }
    finally { setGenerating(false) }
  }

  const handleDelete = async () => {
    const playedMatches = slots.filter(s => s.match?.status === 'played')
    if (playedMatches.length > 0) {
      const matchNums = playedMatches.map(s => s.match.matchNumber).join(', ')
      setError(`❌ No se puede eliminar el calendario porque hay partidos con resultados (#${matchNums}). Borra primero esos resultados.`)
      return
    }
    if (!window.confirm('¿Eliminar el calendario completo? Esto borrará toda la programación de pistas y horarios.')) return
    setError(null)
    try {
      await deleteSchedule(tournament.id)
      setSlots([])
      onScheduleChange(false)
      setInfo('✅ Calendario eliminado')
    } catch (e) { setError(e.message) }
  }

  const checkMatchDependency = (matchId, silent = false) => {
    const currentSlot = slots.find(slot => slot.matchId === matchId)
    const m = currentSlot?.match
    if (!m || m.status !== 'played') return true

    const teamsInvolved = [m.homeTeamId, m.awayTeamId].filter(Boolean)
    const subsequentPlayed = slots.find(s =>
      s.match &&
      s.match.id !== matchId &&
      (s.match.round || 1) > (m.round || 1) &&
      s.match.status === 'played' &&
      (teamsInvolved.includes(s.match.homeTeamId) || teamsInvolved.includes(s.match.awayTeamId))
    )

    if (subsequentPlayed) {
      if (!silent) {
        const stage = subsequentPlayed.match.group || `Ronda ${subsequentPlayed.match.round}`
        setError(`❌ Bloqueado: Los equipos ya han jugado un partido posterior (${stage}).`)
      }
      return false
    }
    return true
  }

  const handleScoreSubmit = async (matchId) => {
    if (!checkMatchDependency(matchId)) return
    const s = scores[matchId]
    const currentSlot = slots.find(slot => slot.matchId === matchId)
    const m = currentSlot?.match
    if (!m) return

    const home = s?.home !== undefined ? s.home : m.homeScore
    const away = s?.away !== undefined ? s.away : m.awayScore

    if (home > 21 || away > 21) {
      setError('❌ El tanteo máximo permitido es 21.')
      return
    }
    const isReset = (home === 0 && away === 0) || (home === null && away === null) || (home === '' && away === '');
    if (home === away && !isReset) {
      setError('❌ No se permiten empates.');
      return
    }

    clearMessages()
    try {
      const observations = s?.obs !== undefined ? s.obs : m.observations
      await updateScore(matchId, home, away, m.homeFouls, m.awayFouls, observations, home !== null ? 'played' : 'pending', 'ADMINISTRADOR')
      await load()
      setEditingScoreIds(prev => prev.filter(id => id !== matchId))
      setInfo('✅ Resultado actualizado')
    } catch (e) { setError(e.message) }
  }

  const handleScoreReset = async (matchId) => {
    if (!checkMatchDependency(matchId)) return
    if (!window.confirm('¿Borrar resultado de este partido?')) return
    clearMessages()

    try {
      const m = slots.find(s => s.matchId === matchId)?.match;
      await updateScore(matchId, null, null, 0, 0, m?.observations || null, 'pending', 'ADMINISTRADOR')
      setInfo('✅ Resultado borrado')
      await load()
    } catch (e) {
      console.error("Error al borrar resultado en calendario:", e)
      setError(e.message)
    }
  }

  const handleMatchActivate = async (matchId, currentActive, court) => {
    try {
      if (slots.find(s => s.matchId === matchId)?.match.status === 'played' && !currentActive) {
        alert('❌ No se puede activar un partido que ya ha finalizado.');
        return;
      }
      const active = !currentActive
      await activateMatch(matchId, active, 'ADMINISTRADOR')
      
      // Actualizar estado local
      setSlots(prev => prev.map(slot => {
        if (slot.matchId === matchId) {
          return { ...slot, match: { ...slot.match, active } }
        }
        // Si activamos uno, desactivamos los demás de la misma pista
        if (active && slot.court === court && slot.matchId !== matchId && slot.match) {
          return { ...slot, match: { ...slot.match, active: false } }
        }
        return slot
      }))
      setInfo(`✅ Partido en ${court} ${active ? 'activado' : 'desactivado'}`)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleSlotSubmit = async (slotId) => {
    clearMessages()
    try {
      const normalizedDate = normalizeDateInput(editDate)
      const normalizedTime = normalizeTimeInput(editTime)
      if (!isValidDisplayDate(normalizedDate)) throw new Error('La fecha debe tener formato DD-MM-YYYY.')
      if (!isValidTime(normalizedTime)) throw new Error('La hora debe tener formato HH:MM.')

      const res = await fetch(`/api/schedule/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: displayDateToIso(normalizedDate),
          startTime: normalizedTime,
          court: editCourt
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar el horario')
      
      setInfo('✅ Horario y pista actualizados correctamente')
      setEditingSlotId(null)
      await load()
    } catch (e) {
      setError(e.message)
    }
  }

  const clearMessages = () => { setError(null); setInfo(null) }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const uniqueDates = Array.from(new Set(slots.map(s => toDisplayDate(s.date)).filter(Boolean))).sort((a, b) => displayDateToIso(a).localeCompare(displayDateToIso(b)))
  const uniqueTimes = Array.from(new Set(slots.map(s => s.startTime))).sort()
  const uniqueCourts = Array.from(new Set(slots.map(s => s.court))).sort((a,b) => a.localeCompare(b, undefined, {numeric: true}))
  const uniqueCategories = Array.from(new Set(slots.map(s => s.match?.categoryId).filter(Boolean)))
  const teamsForFilter = Array.from(new Set(slots.flatMap(s => [s.match?.homeTeam?.name, s.match?.awayTeam?.name]).filter(Boolean))).sort()

  const filteredSlots = slots.filter(slot => {
    if (filterDate && toDisplayDate(slot.date) !== filterDate) return false
    if (filterTime && slot.startTime !== filterTime) return false
    if (filterCourt && slot.court !== filterCourt) return false
    if (filterCategory && slot.match?.categoryId !== parseInt(filterCategory)) return false
    if (filterTeam && slot.match?.homeTeam?.name !== filterTeam && slot.match?.awayTeam?.name !== filterTeam) return false
    return true
  })

  const grouped = filteredSlots.reduce((acc, slot) => {
    const key = `${toDisplayDate(slot.date) || 'Sin fecha'} | ${slot.startTime}`
    if (!acc[key]) acc[key] = []
    acc[key].push(slot)
    return acc
  }, {})

  Object.keys(grouped).forEach(key => {
    grouped[key].sort((a, b) => a.court.localeCompare(b.court, undefined, { numeric: true, sensitivity: 'base' }))
  })

  const timeKeys = Object.keys(grouped).sort()
  const catInfo = (catId) => {
    const c = categories.find(cat => cat.id === catId);
    if (!c) return 'S/C';
    return `${c.name.toUpperCase()} (${c.gender.toUpperCase()}${c.isVeteran ? ' - VET' : ''})`;
  };

  const handleExportMatches = () => {
    try {
      const rows = []
      // No incluimos cabecera por consistencia con la exportación de equipos si el usuario lo prefiere, 
      // pero para listados suele ser útil. Dado que para equipos pidió SIN cabecera, aquí haré lo mismo
      // a menos que sea un listado informativo. El usuario pidió campos específicos.
      // Vamos a poner cabecera en este caso porque es un listado de consulta, no de importación.
      const header = ['Día', 'Hora', 'Pista', 'Categoría', 'Tipo', 'Equipo Local', 'Res. Local', 'Equipo Visitante', 'Res. Visitante', 'Observaciones']
      rows.push(header.join(';'))

      filteredSlots.forEach(slot => {
        const m = slot.match
        if (!m) return

        const cat = categories.find(c => c.id === m.categoryId)
        const catName = cat ? cat.name : 'S/C'
        const catType = cat ? `${cat.gender}${cat.isVeteran ? ' VET' : ''}` : ''
        
        const row = [
          toDisplayDate(slot.date) || '',
          slot.startTime || '',
          slot.court || '',
          catName,
          m.group || `Ronda ${m.round || 1}`,
          m.homeTeam?.name || (m.isPlaceholder ? (m.homePlaceholder || 'TBD') : 'VACÍO'),
          m.homeScore !== null ? m.homeScore : '',
          m.awayTeam?.name || (m.isPlaceholder ? (m.awayPlaceholder || 'TBD') : 'VACÍO'),
          m.awayScore !== null ? m.awayScore : '',
          (m.observations || '').replace(/[\n\r;]/g, ' ') // Limpiar saltos de línea y punto y coma
        ]
        rows.push(row.join(';'))
      })

      const csvContent = "\uFEFF" + rows.join('\n') // BOM para Excel
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `partidos_${tournament.name.replace(/\s+/g, '_')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error("Error exportando partidos:", e)
      setError("Error al exportar los partidos")
    }
  }

  const gridPreviewDays = buildScheduleGridData(filteredSlots, categories, jornadas, matchDuration)
  const recommendedPrintOrientation = getRecommendedPrintOrientation(gridPreviewDays)

  useEffect(() => {
    if (!showGridPreview) {
      setPrintOrientation(recommendedPrintOrientation)
    }
  }, [recommendedPrintOrientation, showGridPreview])

  const handleExportScheduleGrid = () => {
    if (gridPreviewDays.length === 0) {
      setError('No hay partidos programados para previsualizar.')
      return
    }
    setError(null)
    setInfo(null)
    setShowGridPreview(true)
  }

  const handlePrintScheduleGrid = () => {
    try {
      if (gridPreviewDays.length === 0) throw new Error('No hay partidos programados para imprimir.')
      setError(null)
      setIsPrintingActas(false)
      setIsPrintingGrid(true)
      setTimeout(() => window.print(), 80)
    } catch (e) {
      console.error("Error imprimiendo cuadrícula:", e)
      setError(e.message || 'Error al preparar la impresión de la cuadrícula')
    }
  }

  const handlePrintActas = () => {
    try {
      const actaMatches = filteredSlots
        .filter(slot => slot?.match)
        .map(slot => ({
          ...slot.match,
          scheduleSlot: slot,
          category: categories.find(c => c.id === slot.match.categoryId)
        }))

      if (actaMatches.length === 0) throw new Error('No hay partidos para imprimir actas.')
      setError(null)
      setShowGridPreview(false)
      setIsPrintingGrid(false)
      setIsPrintingActas(true)
      setTimeout(() => window.print(), 80)
    } catch (e) {
      console.error("Error imprimiendo actas:", e)
      setError(e.message || 'Error al preparar la impresión de las actas')
    }
  }

  if (loading) return <div className="spinner" />
  const isTimerWarning = timeLeft <= 60

  return (
    <div>
      {(showGridPreview || isPrintingGrid) && gridPreviewDays.length > 0 && (
        <div className="print-container schedule-grid-print">
          <style media="print">{`
            @page {
              size: A4 ${printOrientation};
              margin: 6mm;
            }
            .schedule-grid-print {
              display: block !important;
              position: static !important;
              width: 100%;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
              background: #ffffff !important;
            }
            .schedule-grid-print .schedule-print-day {
              width: 100%;
              page-break-after: always;
              break-after: page;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .schedule-grid-print .schedule-print-day:last-child {
              page-break-after: auto;
              break-after: auto;
            }
          `}</style>
          {gridPreviewDays.map(day => (
            <ScheduleGridDay
              key={`print-${day.date}`}
              day={day}
              tournamentName={tournament.name}
              printable
              printOrientation={printOrientation}
              isLast={day.date === gridPreviewDays[gridPreviewDays.length - 1]?.date}
            />
          ))}
        </div>
      )}

      {showGridPreview && (
        <div
          className="no-print"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            background: 'rgba(2, 6, 23, 0.82)',
            backdropFilter: 'blur(10px)',
            padding: '2rem',
            overflowY: 'auto',
          }}
        >
          <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
            <div
              className="card"
              style={{
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div className="card-title" style={{ marginBottom: '0.35rem' }}>🗂️ Previsualización de Cuadrícula</div>
                <div className="text-muted">
                  Vista preparada para imprimir por día, con franjas horarias a la izquierda y pistas en la cabecera.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="text-muted" style={{ fontWeight: 700 }}>
                  Recomendado: {recommendedPrintOrientation === 'landscape' ? 'Horizontal' : 'Vertical'}
                </div>
                <div className="form-group" style={{ marginBottom: 0, minWidth: '200px' }}>
                  <label className="form-label">Orientación de impresión</label>
                  <select className="form-input" value={printOrientation} onChange={e => setPrintOrientation(e.target.value)}>
                    <option value="portrait">Vertical</option>
                    <option value="landscape">Horizontal</option>
                  </select>
                </div>
                <button className="btn btn-primary" onClick={handlePrintScheduleGrid}>🖨️ Imprimir</button>
                <button className="btn btn-secondary" onClick={() => setShowGridPreview(false)}>✕ Cerrar</button>
              </div>
            </div>

            {gridPreviewDays.map(day => (
              <div
                key={`preview-${day.date}`}
                style={{
                  marginBottom: '1.5rem',
                  display: 'flex',
                  justifyContent: 'center',
                  overflowX: 'auto',
                }}
              >
                <div
                  style={{
                    width: printOrientation === 'landscape' ? '1120px' : '794px',
                    maxWidth: '100%',
                    background: '#ffffff',
                    borderRadius: '18px',
                    boxShadow: '0 20px 45px rgba(15, 23, 42, 0.22)',
                  }}
                >
                  <ScheduleGridDay
                    day={day}
                    tournamentName={tournament.name}
                    printable
                    printOrientation={printOrientation}
                    isLast
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card animate-in" style={{ 
        marginBottom: '1.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        background: timerRunning ? 'rgba(34, 197, 94, 0.05)' : 'rgba(255,255,255,0.02)', 
        border: timerRunning ? '2px solid #22c55e' : '1px solid var(--border)',
        boxShadow: timerRunning ? '0 0 20px rgba(34, 197, 94, 0.2)' : 'var(--shadow)'
      }}>
        <div className={`timer-display ${isTimerWarning ? 'timer-warning' : ''}`} style={{ 
          color: isTimerWarning ? 'var(--red)' : (timerRunning ? '#22c55e' : 'var(--text)'),
          fontSize: '6rem',
          textShadow: isTimerWarning ? '0 0 20px rgba(239, 68, 68, 0.4)' : (timerRunning ? '0 0 20px rgba(34, 197, 94, 0.4)' : 'none')
        }}>
          {formatTime(timeLeft)}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button 
            className={`btn ${timerRunning ? 'btn-secondary' : 'btn-primary'}`} 
            onClick={() => setTimerRunning(!timerRunning)}
            style={{ minWidth: '180px', fontSize: '1.2rem', padding: '1rem' }}
          >
            {timerRunning ? '⏸️ PAUSAR' : '▶️ INICIAR TIEMPO'}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => { setTimerRunning(false); setTimeLeft(localMatchPlayTime * 60); }}
            style={{ fontSize: '1.2rem', padding: '1rem' }}
            title="Reiniciar cronómetro"
          >
            🔄 REINICIAR
          </button>
        </div>
        <div className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.6 }}>
          ⏱️ Cronómetro Global de Competición
        </div>
      </div>

      {error && <div className="alert alert-error animate-in" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {info && <div className="alert alert-success animate-in" style={{ marginBottom: '1.5rem' }}>{info}</div>}

      {!slots.length && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⏰ Jornadas y Franjas Horarias</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>🛠️ Fase de Configuración</span>
          </div>
          {Array.isArray(jornadas) && jornadas.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Inicio</th>
                    <th>Cierre</th>
                    <th>T. Ronda</th>
                    <th>T. Partido</th>
                    <th>Descanso</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {jornadas.map(j => (
                    <tr key={j.id} className="animate-in">
                      {editingJornada === j.id ? (
                        <>
                          <td><div style={{ display: 'flex', gap: '0.25rem' }}><input type="text" className="form-input form-input-sm" value={jEditDate} onChange={e => setJEditDate(e.target.value)} onBlur={e => setJEditDate(normalizeDateInput(e.target.value))} placeholder="DD-MM-YYYY" inputMode="numeric" /><input type="date" value={isValidDisplayDate(jEditDate) ? displayDateToIso(jEditDate) : ''} onChange={e => setJEditDate(toDisplayDate(e.target.value))} tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }} /><button type="button" className="btn btn-secondary btn-sm" onClick={e => { const input = e.currentTarget.previousElementSibling; if (input?.showPicker) input.showPicker(); else input?.click(); }}>📅</button></div></td>
                          <td><div style={{ display: 'flex', gap: '0.25rem' }}><input type="text" className="form-input form-input-sm" value={jEditStart} onChange={e => setJEditStart(e.target.value)} onBlur={e => setJEditStart(normalizeTimeInput(e.target.value))} placeholder="HH:MM" inputMode="numeric" /><input type="time" value={isValidTime(jEditStart) ? jEditStart : ''} onChange={e => setJEditStart(e.target.value)} tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }} /><button type="button" className="btn btn-secondary btn-sm" onClick={e => { const input = e.currentTarget.previousElementSibling; if (input?.showPicker) input.showPicker(); else input?.click(); }}>🕒</button></div></td>
                          <td><div style={{ display: 'flex', gap: '0.25rem' }}><input type="text" className="form-input form-input-sm" value={jEditEnd} onChange={e => setJEditEnd(e.target.value)} onBlur={e => setJEditEnd(normalizeTimeInput(e.target.value))} placeholder="HH:MM" inputMode="numeric" /><input type="time" value={isValidTime(jEditEnd) ? jEditEnd : ''} onChange={e => setJEditEnd(e.target.value)} tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }} /><button type="button" className="btn btn-secondary btn-sm" onClick={e => { const input = e.currentTarget.previousElementSibling; if (input?.showPicker) input.showPicker(); else input?.click(); }}>🕒</button></div></td>
                          <td><input type="number" className="form-input form-input-sm" value={jEditMatchDuration} onChange={e => setJEditMatchDuration(e.target.value)} min="1" /></td>
                          <td><input type="number" className="form-input form-input-sm" value={jEditMatchPlayTime} onChange={e => setJEditMatchPlayTime(e.target.value)} min="1" /></td>
                          <td><input type="number" className="form-input form-input-sm" value={jEditRestRoundsBetweenMatches} onChange={e => setJEditRestRoundsBetweenMatches(e.target.value)} min="0" /></td>
                          <td style={{ textAlign: 'right' }}>
                            <button onClick={() => handleSaveJornadaEdit(j.id)} className="btn btn-primary btn-sm">💾</button>
                            <button onClick={() => setEditingJornada(null)} className="btn btn-secondary btn-sm" style={{ marginLeft: '0.25rem' }}>❌</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{j.date}</td>
                          <td>{j.startTime}</td>
                          <td>{j.endTime}</td>
                          <td>{j.matchDuration ?? tournament.matchDuration ?? 15} min</td>
                          <td>{j.matchPlayTime ?? tournament.matchPlayTime ?? 10} min</td>
                          <td>{j.restRoundsBetweenMatches ?? 1} ronda(s)</td>
                          <td style={{ textAlign: 'right' }}>
                            <button onClick={() => handleEditJornada(j)} className="btn btn-secondary btn-sm" style={{ marginRight: '0.25rem' }}>✏️</button>
                            <button onClick={() => handleDeleteJornada(j.id)} className="btn btn-red btn-sm">🗑️</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
              <div className="text-muted">No hay jornadas definidas. Añade una abajo para empezar.</div>
            </div>
          )}
        </div>
      )}

      {!slots.length && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title">1. Configurar Jornadas</div>
          <form onSubmit={handleAddJornada} className="form-row" style={{ alignItems: 'flex-end', marginBottom: '1.5rem' }}>
            <div className="form-group"><label className="form-label">Día</label><div style={{ display: 'flex', gap: '0.35rem' }}><input className="form-input" type="text" value={jDate} onChange={e => setJDate(e.target.value)} onBlur={e => setJDate(normalizeDateInput(e.target.value))} placeholder="DD-MM-YYYY" inputMode="numeric" required /><input type="date" value={isValidDisplayDate(jDate) ? displayDateToIso(jDate) : ''} onChange={e => setJDate(toDisplayDate(e.target.value))} tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }} /><button type="button" className="btn btn-secondary btn-sm" onClick={e => { const input = e.currentTarget.previousElementSibling; if (input?.showPicker) input.showPicker(); else input?.click(); }}>📅</button></div></div>
            <div className="form-group"><label className="form-label">Inicio</label><div style={{ display: 'flex', gap: '0.35rem' }}><input className="form-input" type="text" value={jStart} onChange={e => setJStart(e.target.value)} onBlur={e => setJStart(normalizeTimeInput(e.target.value))} placeholder="HH:MM" inputMode="numeric" required /><input type="time" value={isValidTime(jStart) ? jStart : ''} onChange={e => setJStart(e.target.value)} tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }} /><button type="button" className="btn btn-secondary btn-sm" onClick={e => { const input = e.currentTarget.previousElementSibling; if (input?.showPicker) input.showPicker(); else input?.click(); }}>🕒</button></div></div>
            <div className="form-group"><label className="form-label">Cierre</label><div style={{ display: 'flex', gap: '0.35rem' }}><input className="form-input" type="text" value={jEnd} onChange={e => setJEnd(e.target.value)} onBlur={e => setJEnd(normalizeTimeInput(e.target.value))} placeholder="HH:MM" inputMode="numeric" required /><input type="time" value={isValidTime(jEnd) ? jEnd : ''} onChange={e => setJEnd(e.target.value)} tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }} /><button type="button" className="btn btn-secondary btn-sm" onClick={e => { const input = e.currentTarget.previousElementSibling; if (input?.showPicker) input.showPicker(); else input?.click(); }}>🕒</button></div></div>
            <div className="form-group"><label className="form-label">Rondas descanso</label><input className="form-input" type="number" min="0" value={jRestRoundsBetweenMatches} onChange={e => setJRestRoundsBetweenMatches(e.target.value)} /></div>
            <button type="submit" className="btn btn-secondary">Añadir Jornada</button>
          </form>

          <div className="card-title">2. Generar Calendario</div>
          <form onSubmit={handleGenerate}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">T. Ronda (min)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={matchDuration} 
                  onChange={e => setMatchDuration(e.target.value)} 
                  min="1"
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">T. Partido (min)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={matchPlayTime} 
                  onChange={e => setMatchPlayTime(e.target.value)} 
                  min="1"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={generating}>{generating ? '⏳ Generando...' : '📅 Generar Calendario Completo'}</button>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text3)' }}>
              * Los tiempos se configuran en la pestaña de Información (F12) o en la lista de Torneos (F6).
            </div>
          </form>
        </div>
      )}

      {slots.length > 0 && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
            <div className="card-title" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>🔍 Filtros de Calendario</div>
            <div className="form-row" style={{ gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {uniqueDates.length > 1 && (
                <div className="form-group" style={{ flex: 1, minWidth: '140px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Día</label>
                  <select className="form-input" value={filterDate} onChange={e => setFilterDate(e.target.value)}>
                    <option value="">Todos los días</option>
                    {uniqueDates.map(d => (
                      <option key={d} value={d}>
                        {d.includes('-') ? d.split('-').reverse().join('-') : d}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group" style={{ flex: 1, minWidth: '100px' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Hora</label>
                <select className="form-input" value={filterTime} onChange={e => setFilterTime(e.target.value)}>
                  <option value="">Todas</option>
                  {uniqueTimes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Pista</label>
                <select className="form-input" value={filterCourt} onChange={e => setFilterCourt(e.target.value)}>
                  <option value="">Todas</option>
                  {uniqueCourts.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Categoría</label>
                <select className="form-input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option value="">Todas</option>
                  {uniqueCategories.map(cid => <option key={cid} value={cid}>{catInfo(cid)}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1.5 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Equipo</label>
                <select className="form-input" value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
                  <option value="">Todos</option>
                  {teamsForFilter.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row" style={{ justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button 
                className="btn btn-red" 
                onClick={handleDelete}
                title="Eliminar toda la programación de horarios y pistas"
              >
                🗑️ Borrar Calendario
              </button>
              <button className="btn btn-secondary" onClick={handleExportMatches}>📊 Exportar Lista</button>
              <button className="btn btn-secondary" onClick={handleExportScheduleGrid}>🗂️ Planificación</button>
              <button className="btn btn-primary" onClick={handlePrintActas}>🖨️ Imprimir Actas</button>
            </div>
          </div>

          {timeKeys.map(timeKey => (
            <div key={timeKey} style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--accent)', background: 'rgba(249,115,22,0.1)', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.75rem' }}>🕐 {timeKey}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {grouped[timeKey].map(slot => {
                  const m = slot.match; if (!m) return null;
                  const catObj = categories.find(c => Number(c.id) === Number(m.categoryId));
                  const cCol = catObj?.color || '#f97316';
                  const homeWon = m.status === 'played' && m.homeScore !== null && m.awayScore !== null && Number(m.homeScore) > Number(m.awayScore);
                  const awayWon = m.status === 'played' && m.homeScore !== null && m.awayScore !== null && Number(m.awayScore) > Number(m.homeScore);
                  const isEditing = editingScoreIds.includes(m.id);

                  return (
                    <div key={slot.id} className="card" style={{ 
                      borderLeft: `6px solid ${cCol}`, 
                      display: 'grid', 
                      gridTemplateColumns: '160px 1fr 150px 200px', 
                      alignItems: 'center', 
                      gap: '1rem', 
                      padding: '1rem',
                      position: 'relative'
                    }}>
                      {m.active && (
                        <div style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '10px',
                          background: m.isLive ? '#ef4444' : '#22c55e',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          zIndex: 1,
                          animation: m.isLive ? 'pulse-live 2s infinite' : 'none'
                        }}>
                          {m.isLive ? 'EN JUEGO' : 'ACTIVO'}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {editingSlotId === slot.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <input type="text" className="form-input form-input-sm" value={editDate} onChange={e => setEditDate(e.target.value)} onBlur={e => setEditDate(normalizeDateInput(e.target.value))} placeholder="DD-MM-YYYY" inputMode="numeric" style={{ fontSize: '0.7rem' }} />
                            <input type="text" className="form-input form-input-sm" value={editTime} onChange={e => setEditTime(e.target.value)} onBlur={e => setEditTime(normalizeTimeInput(e.target.value))} placeholder="HH:MM" inputMode="numeric" style={{ fontSize: '0.7rem' }} />
                            <select className="form-input form-input-sm" value={editCourt} onChange={e => setEditCourt(e.target.value)} style={{ fontSize: '0.7rem' }}>
                              {uniqueCourts.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--text1)' }}>{slot.court}</div>
                            {uniqueDates.length > 1 && <div style={{ fontSize: '0.7rem', color: 'var(--text2)', fontWeight: 600 }}>📅 {toDisplayDate(slot.date)}</div>}
                          </>
                        )}
                        <div style={{
                          fontSize: '0.65rem',
                          color: cCol,
                          fontWeight: 800,
                          background: `${cCol}15`,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'inline-block',
                          border: `1px solid ${cCol}30`
                        }}>
                          {catInfo(m.categoryId)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text2)', fontWeight: 700, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          👤 {m.officialName || '—'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'var(--accent)', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 900 }}>#{m.matchNumber}</div>
                        
                        {/* Equipo Local */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <div 
                            title={m.homeTeam?.name || 'TBD'} 
                            style={{ 
                              width: '100%', textAlign: 'right', padding: '0.5rem', borderRadius: '6px', 
                              background: (m.status === 'played' && homeWon) ? `${cCol}66` : 'transparent', 
                              fontWeight: (m.status === 'played' && homeWon) ? 900 : 500, 
                              border: (m.status === 'played' && homeWon) ? `2px solid ${cCol}` : 'none', 
                              cursor: 'help' 
                            }}
                          >
                            {m.homeTeam?.name || 'TBD'}
                          </div>
                          {tournament.active && m.isLive && (
                            <div style={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 800, 
                              color: m.homeFouls >= 5 ? '#ef4444' : 'var(--text2)',
                              border: m.homeFouls >= 5 ? '1.5px solid #ef4444' : '1px solid transparent',
                              background: m.homeFouls >= 5 ? '#ef444415' : 'transparent',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              marginTop: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}>
                              {m.homeFouls >= 5 && <span>⚠️</span>} FALTAS: {m.homeFouls || 0}
                            </div>
                          )}
                        </div>

                        <div style={{ fontWeight: 800 }}>VS</div>

                        {/* Equipo Visitante */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <div 
                            title={m.awayTeam?.name || 'TBD'} 
                            style={{ 
                              width: '100%', textAlign: 'left', padding: '0.5rem', borderRadius: '6px', 
                              background: (m.status === 'played' && awayWon) ? `${cCol}66` : 'transparent', 
                              fontWeight: (m.status === 'played' && awayWon) ? 900 : 500, 
                              border: (m.status === 'played' && awayWon) ? `2px solid ${cCol}` : 'none', 
                              cursor: 'help' 
                            }}
                          >
                            {m.awayTeam?.name || 'TBD'}
                          </div>
                          {tournament.active && m.isLive && (
                            <div style={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 800, 
                              color: m.awayFouls >= 5 ? '#ef4444' : 'var(--text2)',
                              border: m.awayFouls >= 5 ? '1.5px solid #ef4444' : '1px solid transparent',
                              background: m.awayFouls >= 5 ? '#ef444415' : 'transparent',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              marginTop: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}>
                              FALTAS: {m.awayFouls || 0} {m.awayFouls >= 5 && <span>⚠️</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                              <input type="number" min="0" max="21" className="score-input" value={scores[m.id]?.home ?? m.homeScore ?? ''} onChange={e => setScores({ ...scores, [m.id]: { ...scores[m.id], home: e.target.value === '' ? '' : +e.target.value } })} />
                              <input type="number" min="0" max="21" className="score-input" value={scores[m.id]?.away ?? m.awayScore ?? ''} onChange={e => setScores({ ...scores, [m.id]: { ...scores[m.id], away: e.target.value === '' ? '' : +e.target.value } })} />
                            </div>
                            <input type="text" className="form-input" placeholder="Observaciones..." value={scores[m.id]?.obs ?? m.observations ?? ''} onChange={e => setScores({ ...scores, [m.id]: { ...scores[m.id], obs: e.target.value } })} style={{ width: '100%', fontSize: '0.8rem', padding: '0.2rem' }} />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                              <span style={{ color: (m.status === 'played' && homeWon) ? cCol : 'inherit' }}>{m.homeScore ?? '-'}</span> : <span style={{ color: (m.status === 'played' && awayWon) ? cCol : 'inherit' }}>{m.awayScore ?? '-'}</span>
                            </div>
                            {m.observations && <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: '0.2rem', fontStyle: 'italic' }}>📝 {m.observations}</div>}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: (isEditing || editingSlotId === slot.id) ? '0.5rem' : '0' }}>
                        {isEditing ? (
                          <button className="btn btn-sm btn-green" onClick={() => handleScoreSubmit(m.id)}>💾</button>
                        ) : editingSlotId === slot.id ? (
                          <>
                            <button className="btn btn-sm btn-green" onClick={() => handleSlotSubmit(slot.id)}>💾</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setEditingSlotId(null)}>❌</button>
                          </>
                        ) : (
                          <>
                            {tournament.active && (
                              <button
                                className={`btn btn-sm ${m.active ? 'btn-primary' : 'btn-secondary'}`}
                                disabled={!m.homeTeamId || !m.awayTeamId}
                                title={m.active ? "Partido Activo en Marcador" : "Activar para Marcador"}
                                onClick={() => handleMatchActivate(m.id, m.active, slot.court)}
                              >
                                {m.active ? '🟢' : '⚪'}
                              </button>
                            )}
                            <button
                              className="btn btn-sm btn-secondary"
                              disabled={m.active || !m.homeTeamId || !m.awayTeamId}
                              title={m.active ? "🔒 Partido ACTIVO: Desactívalo para editar" : !m.homeTeamId || !m.awayTeamId ? "🔒 Equipos aún no definidos" : !checkMatchDependency(m.id, true) ? "🔒 Bloqueado: Hay resultados posteriores" : "Editar marcador"}
                              onClick={() => {
                                if (!m.homeTeamId || !m.awayTeamId) return;
                                if (!checkMatchDependency(m.id)) return;
                                setEditingScoreIds([...editingScoreIds, m.id]);
                                setScores({ ...scores, [m.id]: { home: m.homeScore, away: m.awayScore, obs: m.observations || '' } })
                              }}
                            >
                              🔢
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              disabled={m.active || m.status === 'played'}
                              title={m.active ? "🔒 Partido ACTIVO" : m.status === 'played' ? "🔒 Finalizado" : "Editar pista y horario"}
                              onClick={() => {
                                setEditingSlotId(slot.id)
                                setEditDate(slot.date)
                                setEditTime(slot.startTime)
                                setEditCourt(slot.court)
                              }}
                            >
                              📅
                            </button>
                            {(m.status === 'played' || (m.homeScore !== null && m.awayScore !== null)) && (
                              <button
                                className="btn btn-sm btn-red"
                                disabled={m.active}
                                title={m.active ? "🔒 Partido ACTIVO: Desactívalo para borrar" : !checkMatchDependency(m.id, true) ? "🔒 Bloqueado: Hay resultados posteriores" : "Borrar resultado"}
                                onClick={() => handleScoreReset(m.id)}
                              >
                                🗑️
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {isPrintingActas && (
            <PrintableActas matches={filteredSlots.filter(s => s?.match).map(s => ({ ...s.match, scheduleSlot: s, category: categories.find(c => c.id === s.match.categoryId) }))} />
          )}
        </>
      )}
    </div>
  )
}
