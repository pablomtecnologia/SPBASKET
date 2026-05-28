import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getCategories, createCategory, updateCategory, deleteCategory, bulkImport,
  getTeams, createTeam, updateTeam, deleteTeam, bulkCreateTeams,
  createPlayer, updatePlayer, deletePlayer,
  generateMatches, getMatches, deleteCategoryMatches, updateScore,
  getStandings, getFinalRanking, generateFinalPhase, updateScheduleSlot
} from '../api'
import { exportCategoryToExcel } from '../utils/exportCategoryExcel'
import TeamRosterTooltip from './TeamRosterTooltip'
import ValidationIssueTooltip from './ValidationIssueTooltip'
import { getPlayerAgeIssue, getTeamAgeIssue, teamHasAgeIssue } from '../utils/playerAgeValidation'

const COLORS = ['#f97316','#3b82f6','#22c55e','#a855f7','#ec4899','#14b8a6','#f59e0b','#ef4444','#06b6d4','#84cc16']
const IMPORT_PLAYER_BLOCK_SIZE = 7
const IMPORT_MAX_PLAYERS = 4
const IMPORT_FIXED_COLUMNS = 8
const IMPORT_TOTAL_COLUMNS = IMPORT_FIXED_COLUMNS + (IMPORT_PLAYER_BLOCK_SIZE * IMPORT_MAX_PLAYERS)

const getTeamPlayersBadgeStyle = (count) => {
  const total = Number.isInteger(count) ? count : 0
  if (total >= 4) {
    return {
      background: 'rgba(34,197,94,0.18)',
      color: '#86efac',
      border: '1px solid rgba(34,197,94,0.45)'
    }
  }
  if (total === 3) {
    return {
      background: 'rgba(59,130,246,0.18)',
      color: '#93c5fd',
      border: '1px solid rgba(59,130,246,0.45)'
    }
  }
  if (total === 2) {
    return {
      background: 'rgba(245,158,11,0.18)',
      color: '#fcd34d',
      border: '1px solid rgba(245,158,11,0.45)'
    }
  }
  if (total === 1) {
    return {
      background: 'rgba(249,115,22,0.18)',
      color: '#fdba74',
      border: '1px solid rgba(249,115,22,0.45)'
    }
  }
  return {
    background: 'rgba(239,68,68,0.16)',
    color: '#fca5a5',
    border: '1px solid rgba(239,68,68,0.4)'
  }
}

const compareGroupNames = (a, b) => {
  const normalize = (value) => String(value || '').replace(/^Grupo\s+/i, '').trim()
  return normalize(a).localeCompare(normalize(b), undefined, { numeric: true, sensitivity: 'base' })
}

const getMatchRoundLabel = (match) => {
  if (!match) return ''
  if ((match.round || 1) > 1) return ''
  const roundValue = match.groupRound || 1
  const groupValue = match.group || 'Grupo A'
  return `Ronda ${roundValue} (${groupValue})`
}

const compareCompetitionMatches = (a, b) => {
  const byRound = (a.groupRound || 1) - (b.groupRound || 1)
  if (byRound !== 0) return byRound

  const byGroup = compareGroupNames(a.group || 'Grupo A', b.group || 'Grupo A')
  if (byGroup !== 0) return byGroup

  const byOrder = (a.groupMatchOrder || 1) - (b.groupMatchOrder || 1)
  if (byOrder !== 0) return byOrder

  return (a.matchNumber || 999999) - (b.matchNumber || 999999)
}

const getCompetitionRoundBucket = (match) => {
  if ((match.round || 1) === 1) {
    return {
      phaseOrder: 0,
      label: getMatchRoundLabel(match) || (match.group || 'Liga'),
      roundNumber: match.groupRound || 1,
    }
  }

  const groupName = String(match.group || '').toLowerCase()
  if (groupName.includes('octavo')) return { phaseOrder: 1, label: 'Octavos', roundNumber: 0 }
  if (groupName.includes('cuarto')) return { phaseOrder: 2, label: 'Cuartos', roundNumber: 0 }
  if (groupName.includes('semi')) return { phaseOrder: 3, label: 'Semifinales', roundNumber: 0 }
  if (groupName === 'final') return { phaseOrder: 4, label: 'Final', roundNumber: 0 }
  if (groupName.includes('tercer')) return { phaseOrder: 5, label: '3y4 Puesto', roundNumber: 0 }

  return {
    phaseOrder: 99,
    label: match.group || `Ronda ${match.round || 1}`,
    roundNumber: match.round || 0,
  }
}

const getManualGroupLayout = (teamCount) => {
  if (teamCount <= 7) return [{ name: 'Grupo A', size: teamCount }]
  if (teamCount === 8) return [{ name: 'Grupo A', size: 4 }, { name: 'Grupo B', size: 4 }]
  if (teamCount === 9) return [{ name: 'Grupo A', size: 5 }, { name: 'Grupo B', size: 4 }]
  if (teamCount === 10) return [{ name: 'Grupo A', size: 5 }, { name: 'Grupo B', size: 5 }]
  if (teamCount === 11) return [{ name: 'Grupo A', size: 6 }, { name: 'Grupo B', size: 5 }]
  if (teamCount === 12) return [{ name: 'Grupo A', size: 4 }, { name: 'Grupo B', size: 4 }, { name: 'Grupo C', size: 4 }]
  if (teamCount === 13) return [{ name: 'Grupo A', size: 5 }, { name: 'Grupo B', size: 4 }, { name: 'Grupo C', size: 4 }]
  if (teamCount === 14) return [{ name: 'Grupo A', size: 5 }, { name: 'Grupo B', size: 5 }, { name: 'Grupo C', size: 4 }]
  if (teamCount === 15) return [{ name: 'Grupo A', size: 5 }, { name: 'Grupo B', size: 5 }, { name: 'Grupo C', size: 5 }]
  if (teamCount === 16) return [{ name: 'Grupo A', size: 4 }, { name: 'Grupo B', size: 4 }, { name: 'Grupo C', size: 4 }, { name: 'Grupo D', size: 4 }]
  if (teamCount === 17) return [{ name: 'Grupo A', size: 5 }, { name: 'Grupo B', size: 4 }, { name: 'Grupo C', size: 4 }, { name: 'Grupo D', size: 4 }]
  if (teamCount === 18) return [{ name: 'Grupo A', size: 6 }, { name: 'Grupo B', size: 6 }, { name: 'Grupo C', size: 6 }]
  if (teamCount === 19) return [{ name: 'Grupo A', size: 7 }, { name: 'Grupo B', size: 6 }, { name: 'Grupo C', size: 6 }]
  if (teamCount === 20) return [{ name: 'Grupo A', size: 5 }, { name: 'Grupo B', size: 5 }, { name: 'Grupo C', size: 5 }, { name: 'Grupo D', size: 5 }]
  if (teamCount === 21) return [{ name: 'Grupo A', size: 6 }, { name: 'Grupo B', size: 5 }, { name: 'Grupo C', size: 5 }, { name: 'Grupo D', size: 5 }]
  if (teamCount === 22) return [{ name: 'Grupo A', size: 6 }, { name: 'Grupo B', size: 6 }, { name: 'Grupo C', size: 5 }, { name: 'Grupo D', size: 5 }]
  if (teamCount === 23) return [{ name: 'Grupo A', size: 6 }, { name: 'Grupo B', size: 6 }, { name: 'Grupo C', size: 6 }, { name: 'Grupo D', size: 5 }]
  if (teamCount === 24) return [{ name: 'Grupo A', size: 6 }, { name: 'Grupo B', size: 6 }, { name: 'Grupo C', size: 6 }, { name: 'Grupo D', size: 6 }]
  return [{ name: 'Grupo A', size: teamCount }]
}

const downloadCsvTemplate = (tournamentName) => {
  const row = new Array(IMPORT_TOTAL_COLUMNS).fill('')
  row[0] = 'EQUIPO EJEMPLO'
  row[1] = 'BENJAMIN'
  row[2] = 'MIXTO'
  row[3] = 'ANA'
  row[4] = 'GARCIA'
  row[5] = 'LOPEZ'
  row[6] = 'ana@example.com'
  row[7] = '600111222'

  const samplePlayers = [
    ['LUCIA', 'PEREZ', 'MARTIN', '600123123', '12345678A', '2014-05-10', 'M'],
    ['MARIO', 'SANCHEZ', 'RUIZ', '600456456', '23456789B', '2014-09-21', 'L'],
    ['SOFIA', 'DIAZ', 'FERNANDEZ', '600789789', '34567890C', '2015-01-14', 'S']
  ]

  samplePlayers.forEach((player, idx) => {
    const start = IMPORT_FIXED_COLUMNS + (idx * IMPORT_PLAYER_BLOCK_SIZE)
    player.forEach((value, offset) => {
      row[start + offset] = value
    })
  })

  const csvContent = '\uFEFF' + row.join(';')
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const filename = `${(tournamentName || 'TORNEO').toUpperCase().replace(/\s+/g, '_')}_PLANTILLA_IMPORTACION_CSV_${dd}-${mm}-${yyyy}.csv`

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function GroupAssignmentPanel({ enabled, onToggle, teams, counts, layout, onChange, color }) {
  return (
    <div className="card" style={{ marginBottom: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: enabled ? '1rem' : 0 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.92rem', fontWeight: 700 }}>
          <input type="checkbox" checked={!!enabled} onChange={e => onToggle(e.target.checked)} />
          Asignación automática
        </label>
        <div style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
          Los equipos sin grupo preasignado se repartirán automáticamente en los huecos disponibles al generar o regenerar.
        </div>
      </div>

      {enabled && (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {layout.map(group => (
              <span key={group.name} className="badge" style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>
                {group.name}: {counts[group.name] || 0}/{group.size}
              </span>
            ))}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Equipo</th><th>Grupo preasignado</th></tr>
              </thead>
              <tbody>
                {teams.map((team, index) => (
                  <tr key={team.id}>
                    <td style={{ color: 'var(--text2)', width: '36px' }}>{index + 1}</td>
                    <td>{team.name}</td>
                    <td>
                      <select
                        className="form-input"
                        value={team.group || ''}
                        onChange={e => onChange(team, e.target.value)}
                        style={{ minWidth: '180px' }}
                      >
                        <option value="">Sin preasignar</option>
                        {layout
                          .filter(group => (team.group === group.name) || (counts[group.name] < group.size))
                          .map(group => (
                            <option key={group.name} value={group.name}>
                              {group.name} ({counts[group.name]}/{group.size})
                            </option>
                          ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// Componente auxiliar para un partido del bracket
function BracketMatch({ match, color = 'var(--accent)', large = false }) {
  const isWinner = (teamId) => {
    if (match.status !== 'played') return false
    if (teamId === match.homeTeamId) return Number(match.homeScore) > Number(match.awayScore)
    if (teamId === match.awayTeamId) return Number(match.awayScore) > Number(match.homeScore)
    return false
  }
  const homeWon = isWinner(match.homeTeamId)
  const awayWon = isWinner(match.awayTeamId)

  return (
    <div className="bracket-match" style={{ 
      background: 'rgba(255,255,255,0.03)', 
      border: match.status === 'played' ? `2px solid ${color}` : '1px solid var(--border)',
      borderRadius: '8px',
      width: large ? '240px' : '220px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
      overflow: 'hidden',
      transition: '0.3s'
    }}>
      <div style={{ 
        fontSize: '0.6rem', 
        color: 'rgba(255,255,255,0.6)', 
        background: 'rgba(255,255,255,0.05)', 
        padding: '0.2rem 0.6rem', 
        fontWeight: 800, 
        textTransform: 'uppercase', 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>{match.group} · {getMatchRoundLabel(match)}</span>
        {match.scheduleSlot && <span>🕒 {match.scheduleSlot.startTime}</span>}
      </div>
      <div style={{ padding: '0.6rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '0.4rem', 
          fontWeight: homeWon ? 900 : 500,
          color: homeWon ? color : 'inherit',
          opacity: awayWon ? 0.6 : 1,
          fontSize: '0.9rem'
        }}>
          <span 
            title={match.homeTeam?.name || 'TBD'}
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%', cursor: 'help' }}
          >
            {match.homeTeam?.name || 'TBD'}
          </span>
          <span>{match.homeScore ?? '-'}</span>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontWeight: awayWon ? 900 : 500,
          color: awayWon ? color : 'inherit',
          opacity: homeWon ? 0.6 : 1,
          fontSize: '0.9rem'
        }}>
          <span 
            title={match.awayTeam?.name || 'TBD'}
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%', cursor: 'help' }}
          >
            {match.awayTeam?.name || 'TBD'}
          </span>
          <span>{match.awayScore ?? '-'}</span>
        </div>
      </div>
      {match.status === 'played' && <div style={{ height: '3px', background: color }} />}
    </div>
  )
}

const toISO = (d) => {
  if (!d) return ''
  const clean = d.replace(/\//g, '-')
  if (!clean.includes('-')) return ''
  const [day, month, year] = clean.split('-')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}
const toDDMM = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}-${m}-${y}`
}

export default function TournamentManager({ tournament, scheduleActive, onScheduleChange, activeSubTab, onSubTabChange, onRefreshTournament }) {
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [tab, setTab] = useState(activeSubTab || 'equipos')

  // Sincronizar tab interna con prop externa (para atajos de teclado)
  useEffect(() => {
    if (activeSubTab && activeSubTab !== tab) {
      setTab(activeSubTab)
    }
  }, [activeSubTab])

  // Notificar cambios de tab interna hacia afuera
  const handleTabChange = (t) => {
    setTab(t)
    if (onSubTabChange) onSubTabChange(t)
  }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [warning, setWarning] = useState(null)

  // Matches & Standings (Moved Up)
  const [matches, setMatches] = useState([])
  const [allMatches, setAllMatches] = useState([])
  const [competitionOrderMode, setCompetitionOrderMode] = useState('group')
  const [scores, setScores] = useState({})
  const [editingScoreIds, setEditingScoreIds] = useState([])
  const [standings, setStandings] = useState({ global: [], byGroup: {} })
  const [finalRanking, setFinalRanking] = useState([])


  // Category form
  const [catName, setCatName] = useState('')
  const [catColor, setCatColor] = useState(COLORS[0])
  const [catGender, setCatGender] = useState('MIXTO')
  const [catIsVeteran, setCatIsVeteran] = useState(false)
  const [catMinAge, setCatMinAge] = useState('')
  const [catMaxAge, setCatMaxAge] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [showCatForm, setShowCatForm] = useState(false)

  // Team form
  const [teamName, setTeamName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactLastName, setContactLastName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [editingTeam, setEditingTeam] = useState(null)
  const [showTeamForm, setShowTeamForm] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [teams, setTeams] = useState([])

  // Player form
  const [pName, setPName] = useState('')
  const [pLastName, setPLastName] = useState('')
  const [pDni, setPDni] = useState('')
  const [pPhone, setPPhone] = useState('')
  const [pBirthDate, setPBirthDate] = useState('')
  const [pShirtSize, setPShirtSize] = useState('')
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [detailEditMode, setDetailEditMode] = useState('player') // 'player' o 'contact'
  const [hoveredCategoryId, setHoveredCategoryId] = useState(null)
  const categoryHoverTimerRef = useRef(null)




  const clearMessages = () => { setError(null); setInfo(null); setWarning(null) }

  const cancelCategoryHoverTimer = useCallback(() => {
    if (categoryHoverTimerRef.current) {
      clearTimeout(categoryHoverTimerRef.current)
      categoryHoverTimerRef.current = null
    }
  }, [])

  const handleCategoryMouseEnter = useCallback((categoryId) => {
    cancelCategoryHoverTimer()
    categoryHoverTimerRef.current = setTimeout(() => {
      setHoveredCategoryId(categoryId)
      categoryHoverTimerRef.current = null
    }, 2000)
  }, [cancelCategoryHoverTimer])

  const handleCategoryMouseLeave = useCallback(() => {
    cancelCategoryHoverTimer()
    setHoveredCategoryId(null)
  }, [cancelCategoryHoverTimer])

  const loadCategories = useCallback(async () => {
    try {
      const data = await getCategories(tournament.id)
      setCategories(data)
      setActiveCategory(prev => {
        if (!prev) return data[0] || null;
        // Mantener la categoría actual si sigue existiendo
        const current = data.find(c => c.id === prev.id);
        return current || data[0] || null;
      });
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [tournament.id])

  useEffect(() => { loadCategories() }, [loadCategories])

  useEffect(() => () => cancelCategoryHoverTimer(), [cancelCategoryHoverTimer])

  const loadTeams = useCallback(async () => {
    if (!activeCategory) return
    const data = await getTeams(activeCategory.id)
    setTeams(data)
  }, [activeCategory])

  const loadMatches = useCallback(async () => {
    try {
      const all = await getMatches(tournament.id)
      setAllMatches(all)
      if (activeCategory) {
        setMatches(all.filter(m => m.categoryId === activeCategory.id))
      } else {
        setMatches([])
      }
    } catch (e) { console.error('Error cargando partidos:', e) }
  }, [activeCategory, tournament.id])

  // Pistas y jornadas calculadas para los selectores de edición
  const availableCourts = tournament.courts?.length > 0 
    ? tournament.courts.map(c => c.name)
    : ['Pista 1']

  const availableJornadas = tournament.jornadas || []

  const loadStandings = useCallback(async () => {
    if (!activeCategory) return
    const data = await getStandings(activeCategory.id)
    setStandings(data)
  }, [activeCategory])

  const loadFinalRanking = useCallback(async () => {
    if (!activeCategory) return
    try {
      const data = await getFinalRanking(activeCategory.id)
      setFinalRanking(data)
    } catch (e) { console.error("Error cargando ranking final:", e) }
  }, [activeCategory])

  useEffect(() => {
    if (!activeCategory) return
    
    // Al cambiar de categoría, reseteamos estados para evitar que se vean datos de la categoría anterior
    setMatches([])
    setTeams([])
    setSelectedTeam(null)
    setStandings({ global: [], byGroup: {} })
    setFinalRanking([])
    clearMessages()

    const doLoad = () => {
      // Cargamos equipos y partidos siempre para que los botones y estadísticas de la cabecera sean correctos
      loadTeams()
      loadMatches()
      
      if (tab === 'clasificacion') { 
        loadStandings()
        loadFinalRanking()
      }
      if (tab === 'competicion') {
        loadStandings()
        loadFinalRanking()
      }
    }
    doLoad()
    const interval = setInterval(doLoad, 10000)
    return () => clearInterval(interval)
  }, [activeCategory, tab, loadTeams, loadMatches, loadStandings, loadFinalRanking])

  // ── Handlers ──────────────────────────────────────

  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    clearMessages()
    try {
      if (!catName) throw new Error('El nombre es obligatorio')
      if (catIsVeteran && !catMinAge) throw new Error('El "Fecha Desde" es obligatorio para veteranos')
      if (!catIsVeteran && (!catMinAge || !catMaxAge)) throw new Error('Es obligatorio indicar "Fecha Desde" y "Fecha Hasta"')

      const data = { 
        name: catName, 
        color: catColor, 
        gender: catGender,
        isVeteran: catIsVeteran,
        minAge: catMinAge, 
        maxAge: catMaxAge 
      }

      if (editingCategory) {
        const updated = await updateCategory(tournament.id, editingCategory.id, data)
        setCategories(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
        if (activeCategory?.id === updated.id) {
          setActiveCategory(prev => ({ ...prev, ...updated }))
        }
        setInfo('✅ Categoría actualizada')
      } else {
        const cat = await createCategory(tournament.id, data)
        setCategories(prev => [...prev, cat])
        setActiveCategory(cat)
        setInfo('✅ Categoría creada')
      }
      resetCatForm()
      if (onRefreshTournament) onRefreshTournament()
    } catch (e) { setError(e.message) }
  }

  const handleScheduleUpdate = async (slotId) => {
    setError(null); setInfo(null)
    try {
      // Logic for inline slot update if needed
      setInfo('✅ Horario actualizado')
    } catch (e) { setError(e.message) }
  }

  const handleEditCategory = (cat) => {
    // Ya no bloqueamos la edición completa, el bloqueo se hará a nivel de campos en el formulario
    setEditingCategory(cat)
    setCatName(cat.name)
    setCatColor(cat.color)
    setCatGender(cat.gender)
    setCatIsVeteran(cat.isVeteran)
    setCatMinAge(cat.minAge || '')
    setCatMaxAge(cat.maxAge || '')
    setShowCatForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetCatForm = () => {
    setCatName('')
    setCatGender('MIXTO')
    setCatIsVeteran(false)
    setCatMinAge('')
    setCatMaxAge('')
    setEditingCategory(null)
    setCatColor(COLORS[categories.length % COLORS.length])
    setShowCatForm(false)
  }

  const handleDeleteCategory = async (id) => {
    const catScheduled = allMatches.some(m => m.categoryId === id && m.scheduleSlot)
    const catHasMatches = allMatches.some(m => m.categoryId === id)
    if (catScheduled || catHasMatches) return setError('🔒 Categoría con partidos o calendario activo — elimina primero los partidos')
    if (!confirm('¿Eliminar categoría y todos sus equipos/partidos?')) return
    clearMessages()
    try {
      await deleteCategory(tournament.id, id)
      const newCats = categories.filter(c => c.id !== id)
      setCategories(newCats)
      setActiveCategory(newCats[0] || null)
      if (onRefreshTournament) onRefreshTournament()
    } catch (e) { setError(e.message) }
  }

  const resetTeamForm = () => {
    setTeamName(''); setContactName(''); setContactLastName(''); setContactPhone(''); setContactEmail(''); setEditingTeam(null)
    setDetailEditMode('player')
    setShowTeamForm(false)
  }

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    if (isLocked) return setError('🔒 Calendario activo — no se pueden editar equipos')
    clearMessages()
    try {
      const data = { 
        name: teamName, 
        contactName,
        contactLastName,
        contactPhone,
        contactEmail
      }
      if (editingTeam) {
        const updated = await updateTeam(editingTeam.id, data)
        setTeams(prev => prev.map(t => t.id === editingTeam.id ? { ...t, ...updated } : t))
        if (selectedTeam?.id === editingTeam.id) setSelectedTeam(prev => ({ ...prev, ...updated }))
        setInfo('✅ Equipo actualizado')
      } else {
        const team = await createTeam(activeCategory.id, data)
        setTeams(prev => [...prev, team])
        setInfo('✅ Equipo añadido')
      }
      resetTeamForm()
      loadCategories() // Actualizar contadores en las pestañas de categorías
      if (onRefreshTournament) onRefreshTournament()
    } catch (e) { setError(e.message) }
  }

  const handleEditTeam = (team, fromDetail = false) => {
    if (isLocked) return setError('🔒 Calendario activo — no se pueden editar equipos')
    setEditingTeam(team)
    setTeamName(team.name)
    setContactName(team.contactName || '')
    setContactLastName(team.contactLastName || '')
    setContactPhone(team.contactPhone || '')
    setContactEmail(team.contactEmail || '')
    setShowTeamForm(true)
    if (fromDetail) {
      setDetailEditMode('contact')
      setEditingPlayer(null)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleDeleteTeam = async (id) => {
    if (isLocked) return setError('🔒 Calendario activo — elimina primero el calendario')
    if (!confirm('¿Eliminar equipo?')) return
    clearMessages()
    try {
      await deleteTeam(id)
      setTeams(prev => prev.filter(t => t.id !== id))
      if (selectedTeam?.id === id) setSelectedTeam(null)
      setInfo('✅ Equipo eliminado')
      loadCategories() // Actualizar contadores
      if (onRefreshTournament) onRefreshTournament()
    } catch (e) { setError(e.message) }
  }

  const handleCreatePlayer = async (e) => {
    e.preventDefault()
    if (isLocked) return setError('🔒 Calendario activo')
    clearMessages()
    if (!selectedTeam) return
    try {
      const data = {
        name: pName,
        lastName: pLastName,
        dni: pDni,
        phone: pPhone,
        birthDate: pBirthDate,
        shirtSize: pShirtSize
      }
      
      if (editingPlayer) {
        const res = await updatePlayer(editingPlayer.id, data)
        if (res.warning) setWarning(res.warning)
        setInfo('✅ Jugador actualizado')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        
        const updatedPlayers = selectedTeam.players.map(p => p.id === editingPlayer.id ? { ...p, ...res } : p)
        const updatedTeam = { ...selectedTeam, players: updatedPlayers }
        setSelectedTeam(updatedTeam)
        setTeams(prev => prev.map(t => t.id === selectedTeam.id ? updatedTeam : t))
        setEditingPlayer(null)
      } else {
        if (selectedTeam.players?.length >= 4) {
          setError('❌ El equipo ya tiene el máximo de 4 jugadores')
          return
        }
        const res = await createPlayer(selectedTeam.id, { ...data, teamId: selectedTeam.id })
        
        if (res.warning) {
          setWarning(res.warning)
        }
        setInfo('✅ Jugador añadido')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        
        const updatedPlayers = [...(selectedTeam.players || []), res]
        const updatedTeam = { ...selectedTeam, players: updatedPlayers }
        setSelectedTeam(updatedTeam)
        setTeams(prev => prev.map(t => t.id === selectedTeam.id ? updatedTeam : t))
      }
      
      setPName(''); setPLastName(''); setPDni(''); setPPhone(''); setPBirthDate(''); setPShirtSize('');
      loadCategories() // Actualizar contadores de jugadores
      if (onRefreshTournament) onRefreshTournament()
    } catch (e) { setError(e.message) }
  }

  const handleEditPlayer = (player) => {
    if (isLocked) return setError('🔒 Calendario activo')
    setDetailEditMode('player')
    setEditingPlayer(player)
    setPName(player.name)
    setPLastName(player.lastName || '')
    setPDni(player.dni || '')
    setPPhone(player.phone || '')
    setPBirthDate(player.birthDate || '')
    setPShirtSize(player.shirtSize || '')
  }

  const deletePlayerAction = async (pid) => {
    if (isLocked) return setError('🔒 Calendario activo')
    if (!confirm('¿Eliminar jugador?')) return
    try {
      await deletePlayer(pid)
      const updatedPlayers = selectedTeam.players.filter(p => p.id !== pid)
      const updatedTeam = { ...selectedTeam, players: updatedPlayers }
      setSelectedTeam(updatedTeam)
      setTeams(prev => prev.map(t => t.id === selectedTeam.id ? updatedTeam : t))
      setInfo('✅ Jugador eliminado')
      loadCategories() // Actualizar contadores
      if (onRefreshTournament) onRefreshTournament()
    } catch (e) { setError(e.message) }
  }

  const checkMatchDependency = (matchId, silent = false) => {
    const m = matches.find(match => match.id === matchId)
    if (!m || m.status !== 'played') return true

    const teamsInvolved = [m.homeTeamId, m.awayTeamId].filter(Boolean)
    const subsequentPlayed = matches.find(other => 
      other.id !== matchId &&
      (other.round || 1) > (m.round || 1) &&
      other.status === 'played' &&
      (teamsInvolved.includes(other.homeTeamId) || teamsInvolved.includes(other.awayTeamId))
    )

    if (subsequentPlayed) {
      if (!silent) {
        const stage = subsequentPlayed.group || `Ronda ${subsequentPlayed.round}`
        setError(`❌ Bloqueado: Los equipos ya han jugado un partido posterior (${stage}). Borra primero los resultados posteriores.`)
      }
      return false
    }
    return true
  }

  const handleGenerateMatches = async () => {
    clearMessages()

    // Nueva Validación de Integridad del Calendario Global
    const isTournamentScheduled = allMatches.some(m => m.scheduleSlot);
    const categoryHasNoMatches = matches.length === 0;

    if (isTournamentScheduled && categoryHasNoMatches) {
      setError('❌ Bloqueado: No se pueden generar partidos para esta categoría porque el calendario del torneo ya ha sido iniciado. Debes borrar el calendario global si necesitas incluir nuevas categorías con partidos.');
      return;
    }

    try {
      const created = await generateMatches(tournament.id, activeCategory.id)
      setMatches(created)
      setInfo(`✅ ${created.length} partidos generados`)
      handleTabChange('partidos')
      loadCategories() // Actualizar si hay algún contador de partidos (opcional)
      if (onRefreshTournament) onRefreshTournament()
    } catch (e) { setError(e.message) }
  }

  const handleToggleManualGroupAssignment = async (enabled) => {
    clearMessages()
    try {
      const updated = await updateCategory(tournament.id, activeCategory.id, {
        name: activeCategory.name,
        color: activeCategory.color,
        gender: activeCategory.gender,
        isVeteran: activeCategory.isVeteran,
        minAge: activeCategory.minAge,
        maxAge: activeCategory.maxAge,
        manualGroupAssignment: enabled
      })
      setCategories(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
      setActiveCategory(prev => prev ? { ...prev, ...updated } : prev)
      if (!enabled) {
        await Promise.all(teams.filter(team => team.group).map(team => updateTeam(team.id, { group: null })))
        await loadTeams()
      }
      setInfo(enabled ? '✅ Asignación manual de grupos activada' : '✅ Asignación manual de grupos desactivada')
    } catch (e) { setError(e.message) }
  }

  const handleManualGroupChange = async (team, groupName) => {
    clearMessages()
    try {
      const updated = await updateTeam(team.id, { group: groupName || null })
      setTeams(prev => prev.map(t => t.id === team.id ? { ...t, ...updated } : t))
      if (selectedTeam?.id === team.id) setSelectedTeam(prev => ({ ...prev, ...updated }))
    } catch (e) { setError(e.message) }
  }


  const handleScoreSubmit = async (matchId) => {
    if (!checkMatchDependency(matchId)) return
    const s = scores[matchId]
    if (!s && s !== 0 && !editingScoreIds.includes(matchId)) return
    clearMessages()
    
    const m = matches.find(match => match.id === matchId)
    const home = s?.home !== undefined ? s.home : m.homeScore
    const away = s?.away !== undefined ? s.away : m.awayScore

    if (home > 21 || away > 21) {
      setError('❌ El tanteo máximo permitido es 21.')
      return
    }
    const isReset = (home === 0 && away === 0) || (home === null && away === null) || (home === '' && away === '');
    if (home === away && !isReset) {
      setError('❌ No se permiten empates.')
      return
    }

    try {
      const observations = s?.obs !== undefined ? s.obs : m.observations
      const updated = await updateScore(matchId, home, away, m.homeFouls || 0, m.awayFouls || 0, observations, 'played', 'ADMINISTRADOR')
      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, ...updated } : m))
      setEditingScoreIds(prev => prev.filter(id => id !== matchId))
      setInfo('✅ Resultado y observaciones actualizados')
      
      loadMatches()
      loadStandings()
      loadFinalRanking()
    } catch (e) { setError(e.message) }
  }

  const handleScoreReset = async (matchId) => {
    if (!checkMatchDependency(matchId)) return
    if (!window.confirm('¿Borrar resultado de este partido?')) return
    clearMessages()
    
    try {
      const m = matches.find(match => match.id === matchId);
      await updateScore(matchId, null, null, 0, 0, m?.observations || null, 'pending', 'ADMINISTRADOR')
      setInfo('✅ Resultado borrado correctamente')
      await loadMatches()
      if (tab === 'clasificacion') {
        await loadStandings()
        await loadFinalRanking()
      }
    } catch (e) { 
      console.error("Error al borrar resultado:", e)
      setError(e.message) 
    }
  }

  // CSV import (Global)
  const handleCSVImport = async (e) => {
    if (isLocked) return setError('🔒 Calendario activo — no se pueden importar datos')
    const file = e.target.files[0]
    if (!file) return
    clearMessages()
    const text = await file.text()
    const rowsRaw = text.split('\n').map(r => r.trim()).filter(Boolean)
    if (rowsRaw.length === 0) return

    // Detectar delimitador (punto y coma o coma)
    const delimiter = rowsRaw[0].includes(';') ? ';' : ','

    const dataRows = rowsRaw.map(row => row.split(delimiter).map(s => s?.trim())).filter(r => r[0] && r[1])
    
    if (dataRows.length === 0) return setError('CSV vacío o formato incorrecto (requiere Equipo y Categoría)')

    try {
      const res = await bulkImport(tournament.id, dataRows)
      let msg = `✅ Importación completada: ${res.results.categories} cat., ${res.results.teams} eq., ${res.results.players} jug.`
      if (res.results.warnings?.length > 0) {
        setWarning(`⚠️ Avisos de importación:\n${res.results.warnings.join('\n')}`)
      }
      setInfo(msg)
      loadCategories() // Recargar todo
      if (onRefreshTournament) onRefreshTournament()
    } catch (e) { setError(e.message) }
    e.target.value = ''
  }

  const hasResults = matches.some(m => m.status === 'played')
  const isCategoryScheduled = matches.some(m => m.scheduleSlot)
  const hasMatches = matches.length > 0
  const hasFinalPhase = matches.some(m => m.round >= 2)
  const hasAnyMatches = allMatches.length > 0
  const isTournamentScheduled = allMatches.some(m => m.scheduleSlot)
  const isGenerationBlocked = isTournamentScheduled && !hasMatches
  const isLocked = isCategoryScheduled || hasMatches
  const manualGroupLayout = getManualGroupLayout(teams.length)
  const manualGroupCounts = manualGroupLayout.reduce((acc, group) => {
    acc[group.name] = teams.filter(team => team.group === group.name).length
    return acc
  }, {})

  useEffect(() => {
    console.log("🏀 [TournamentManager] Render:", tab, {
      activeCategory: activeCategory?.name,
      matches: matches?.length || 0,
      teams: teams?.length || 0
    })
  }, [tab, activeCategory, matches?.length, teams?.length])

  if (loading) return <div className="spinner" />

  const colorOf = (cat) => categories.find(c => c.id === cat?.id)?.color || '#3b82f6'

  const handleDeleteMatches = async () => {
    if (!activeCategory) return
    const msg = hasResults
      ? '⚠️ ¡ATENCIÓN! Ya hay resultados registrados en esta categoría. Si borras los partidos se perderá toda la información de marcadores y clasificación (Liga y Eliminatorias). ¿Seguro que quieres continuar?'
      : '¿Seguro que deseas borrar todos los partidos de esta categoría? Esta acción eliminará también la programación del calendario vinculada.'
    if (!confirm(msg)) return
    clearMessages()
    try {
      await deleteCategoryMatches(activeCategory.id)
      setMatches([])
      setInfo('🗑️ Partidos eliminados correctamente')
      loadStandings()
      loadFinalRanking()
      loadCategories()
      if (onRefreshTournament) onRefreshTournament()
    } catch (e) { setError(e.message) }
  }

  const handleDeleteFinalPhase = async () => {
    if (!activeCategory) return
    const hasFinalResultsNow = matches.some(m => m.round >= 2 && m.status === 'played')
    if (hasFinalResultsNow) {
      alert('❌ No se puede borrar la Fase Final porque ya hay resultados registrados en el cuadro.')
      return
    }
    if (!confirm('¿Seguro que deseas borrar solo el cuadro de la Fase Final?')) return
    clearMessages()
    try {
      await deleteCategoryMatches(activeCategory.id, 'final')
      setInfo('🗑️ Fase Final eliminada. La Liga se ha mantenido intacta.')
      loadMatches()
      loadStandings()
      loadFinalRanking()
    } catch (e) { setError(e.message) }
  }

  const handleExportExcel = () => {
    if (!activeCategory) return
    try {
      exportCategoryToExcel({
        tournament,
        category: activeCategory,
        matches,
        standings,
        finalRanking
      })
      setInfo('✅ Excel exportado correctamente')
    } catch (e) {
      setError('❌ Error al generar el Excel: ' + e.message)
    }
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, color: 'var(--accent)' }}>{tournament.name}</h2>
            <div className="text-muted" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem', flexWrap: 'wrap' }}>
              {tournament.venue && <span>📍 {tournament.venue}</span>}
              <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '4px', opacity: 0.8 }}>
                  <rect x="2" y="4" width="20" height="16" rx="1" />
                  <path d="M12 4v16" />
                  <circle cx="12" cy="12" r="3" />
                  <path d="M2 9h3v6H2z" />
                  <path d="M22 9h-3v6h3z" />
                </svg>
                {tournament.courts?.length || tournament.numCourts || 1} pistas
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {tournament?.jornadas?.map((j, idx) => (
                  <span key={idx} className="badge badge-pending" style={{ fontSize: '0.75rem' }}>
                    📅 {j?.date && typeof j.date === 'string' ? j.date.split('-').reverse().join('-') : ''} ({j?.startTime || '?'}-{j?.endTime || '?'})
                  </span>
                ))}
              </div>
            </div>
          </div>
          {isCategoryScheduled && (
            <div className="badge" style={{ background: '#7c2d12', color: '#fdba74', padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
              🔒 EN CALENDARIO
            </div>
          )}
          
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
              <button className="btn btn-blue btn-sm" type="button" onClick={() => downloadCsvTemplate(tournament.name)} title="Descargar plantilla CSV de importación">
                Descargar Plantilla CSV
              </button>
            <label className={`btn btn-secondary btn-sm`} style={{ cursor: hasAnyMatches ? 'not-allowed' : 'pointer', opacity: hasAnyMatches ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }} title={hasAnyMatches ? "🔒 Bloqueado: Ya hay partidos generados" : "Importar equipos por CSV"}>
              📂 Importar CSV Global
              {!hasAnyMatches && <input type="file" accept=".csv" onChange={handleCSVImport} style={{ display: 'none' }} />}
            </label>
            </div>
            <div className="text-muted" style={{ fontSize: '0.6rem', marginTop: '0.2rem' }}>
              Equipo;Cat;Gen;ContNom;Ape1;Ape2;Email;Movil... J1(Nom;Ape1;Ape2;Movil;DNI;FecNac;Talla)...
            </div>
          </div>

        </div>
      </div>

      {error && <div className="alert alert-error animate-in" style={{ marginBottom: '1.5rem' }}>{error}</div>}
      {info && <div className="alert alert-success animate-in" style={{ marginBottom: '1.5rem' }}>{info}</div>}

      {isCategoryScheduled && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          🔒 <strong>CATEGORÍA EN CALENDARIO — EDICIÓN LIMITADA.</strong> Ve a la pestaña Calendario para gestionar sus horarios.
        </div>
      )}
      {!isCategoryScheduled && hasMatches && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          🔒 <strong>PARTIDOS GENERADOS.</strong> Esta categoría ya tiene su estructura creada. Puedes re-generarla o borrarla si no hay resultados registrados.
        </div>
      )}

      {/* Nueva Categoría Toggle */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'flex-start' }}>
        <button 
          className={`btn ${showCatForm ? 'btn-secondary' : 'btn-blue'} btn-sm`}
          onClick={() => {
            if (showCatForm && editingCategory) {
              resetCatForm();
            } else {
              setShowCatForm(!showCatForm);
            }
          }}
        >
          {showCatForm ? '✕ Cancelar' : '➕ Crear Categoría'}
        </button>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {categories.map(cat => {
          const catMatches = allMatches.filter(m => m.categoryId === cat.id);
          const totalMatches = catMatches.length;
          const pendingMatches = catMatches.filter(m => m.status !== 'played').length;
          const hasMatches = totalMatches > 0;

          // Desglose por fases
          const groupMatches = catMatches.filter(m => (m.round || 1) === 1);
          const finalMatches = catMatches.filter(m => (m.round || 1) > 1);
          const groupTotal = groupMatches.length;
          const groupPending = groupMatches.filter(m => m.status !== 'played').length;
          const finalTotal = finalMatches.length;
          const finalPending = finalMatches.filter(m => m.status !== 'played').length;

          // Cálculo de horarios
          const getPhaseTimes = (mList) => {
            const scheduled = mList.filter(m => m.scheduleSlot).map(m => m.scheduleSlot.startTime);
            if (scheduled.length === 0) return { start: '--:--', end: '--:--' };
            scheduled.sort();
            const start = scheduled[0];
            const lastStart = scheduled[scheduled.length - 1];
            
            // Calculamos el fin sumando la duración del torneo al último inicio
            const addMinutes = (timeStr, mins) => {
              const [h, m] = timeStr.split(':').map(Number);
              const d = new Date();
              d.setHours(h, m + mins);
              return d.toTimeString().substring(0, 5);
            };
            
            const end = addMinutes(lastStart, tournament.matchDuration || 15);
            return { start, end };
          };

          const groupTimes = getPhaseTimes(groupMatches);
          const finalTimes = getPhaseTimes(finalMatches);

          return (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat); handleTabChange('equipos'); clearMessages() }}
              onMouseEnter={() => handleCategoryMouseEnter(cat.id)}
              onMouseLeave={handleCategoryMouseLeave}
              onFocus={() => handleCategoryMouseEnter(cat.id)}
              onBlur={handleCategoryMouseLeave}
              className="btn category-btn"
              style={{
                background: activeCategory?.id === cat.id ? cat.color : 'var(--bg3)',
                color: 'white',
                border: `1px solid ${cat.color}`,
                position: 'relative',
                padding: '0.4rem 0.8rem',
                minWidth: '160px'
              }}
            >
              {/* Popup Informativo Ampliado */}
              <div className={`category-popup ${hoveredCategoryId === cat.id ? 'visible' : ''}`} style={{ '--cat-color': cat.color }}>
                <div className="category-popup-header">
                  <span className={hasMatches ? "color-dot" : "color-square"} style={{ background: cat.color, border: '1.5px solid rgba(0,0,0,0.8)', boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }} />
                  {cat.name}
                </div>
                <div className="category-popup-body">
                  <div className="popup-info-row">
                    <span className="popup-info-label">👫 Género:</span>
                    <span className="popup-info-value">{cat.gender}</span>
                  </div>
                  <div className="popup-info-row">
                    <span className="popup-info-label">🎂 Edad:</span>
                    <span className="popup-info-value">
                      {cat.isVeteran ? 'VETERANO' : `${cat.minAge} a ${cat.maxAge}`}
                    </span>
                  </div>
                  <div className="popup-info-row" style={{ marginTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.4rem' }}>
                    <span className="popup-info-label">👥 Equipos:</span>
                    <span className="popup-info-value">{cat?.teams?.length || 0}</span>
                  </div>
                  <div className="popup-info-row">
                    <span className="popup-info-label">⛹️ Jugadores:</span>
                    <span className="popup-info-value">
                      {cat?.teams?.reduce((acc, t) => acc + (t?.players?.length || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="popup-info-row" style={{ marginTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.4rem' }}>
                    <span className="popup-info-label">🏀 Partidos Totales:</span>
                    <span className="popup-info-value" style={{ color: 'var(--accent)' }}>{totalMatches}</span>
                  </div>
                  <div className="popup-info-row">
                    <span className="popup-info-label">⏳ Pendientes:</span>
                    <span className="popup-info-value" style={{ color: pendingMatches > 0 ? '#fb923c' : '#22c55e' }}>{pendingMatches}</span>
                  </div>
                  
                  <div style={{ marginTop: '0.6rem', borderTop: '2px dashed rgba(255,255,255,0.1)', paddingTop: '0.6rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--cat-color)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>🏁 Estado de Fases</div>
                    <div className="popup-info-row">
                      <span className="popup-info-label">📋 Grupos:</span>
                      <span className="popup-info-value">
                        {groupTotal} / <span style={{ color: groupPending > 0 ? '#fb923c' : '#22c55e' }}>{groupPending} P.</span>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 400, textAlign: 'right' }}>
                          🕒 {groupTimes.start} - {groupTimes.end}
                        </div>
                      </span>
                    </div>
                    <div className="popup-info-row" style={{ marginTop: '0.4rem' }}>
                      <span className="popup-info-label">🏆 Finales:</span>
                      <span className="popup-info-value">
                        {finalTotal} / <span style={{ color: finalPending > 0 ? '#fb923c' : '#22c55e' }}>{finalPending} P.</span>
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 400, textAlign: 'right' }}>
                          🕒 {finalTimes.start} - {finalTimes.end}
                        </div>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <span className={hasMatches ? "color-dot" : "color-square"} style={{ background: cat.color, marginRight: '0.6rem', width: '12px', height: '12px', border: '1.5px solid rgba(0,0,0,0.8)', boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, whiteSpace: 'nowrap' }}>{cat.name} ({cat.gender})</span>
                <div style={{ fontSize: '0.6rem', opacity: 0.8, fontWeight: 600 }}>
                  {cat.isVeteran ? 'VET ' : ''}{cat.minAge}{cat.maxAge ? `-${cat.maxAge}` : ''} | 👥 {cat?.teams?.length || 0} Eq. | 👤 {cat?.teams?.reduce((acc, t) => acc + (t?.players?.length || 0), 0) || 0} Jug.
                </div>
                <div style={{ fontSize: '0.55rem', opacity: 1, color: 'var(--accent)', fontWeight: 800 }}>
                  🏀 {totalMatches} Partidos
                </div>
              </div>
              {(!allMatches.some(m => m.categoryId === cat.id && m.scheduleSlot) && !allMatches.some(m => m.categoryId === cat.id)) && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.2rem', opacity: 0.7 }}>
                  <span onClick={(e) => { e.stopPropagation(); handleEditCategory(cat) }} style={{ cursor: 'pointer', fontSize: '0.9rem' }}>✏️</span>
                  <span onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id) }} style={{ cursor: 'pointer', fontSize: '1rem' }}>✕</span>
                </div>
              )}
            </button>
          );
        })}
      </div>


      {/* New/Edit Category Form */}
      {showCatForm && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: editingCategory ? `1px solid ${catColor}` : '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{editingCategory ? '✏️ Editar Categoría' : '✨ Crear Nueva Categoría'}</div>
            <button onClick={resetCatForm} className="btn btn-secondary btn-sm">Cerrar</button>
          </div>
          <form onSubmit={handleCategorySubmit}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: '0.75rem', 
              alignItems: 'flex-end' 
            }}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" value={catName} onChange={e => setCatName(e.target.value)} placeholder="Senior, Sub-18..." required />
              </div>
              <div className="form-group">
                <label className="form-label">Género</label>
                <select className="form-input" value={catGender} onChange={e => setCatGender(e.target.value)} disabled={editingCategory && isLocked}>
                  <option value="MASCULINO">MASCULINO</option>
                  <option value="FEMENINO">FEMENINO</option>
                  <option value="MIXTO">MIXTO</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Desde (Fecha Nac.)</label>
                <input type="date" className="form-input" value={toISO(catMinAge)} onChange={e => setCatMinAge(toDDMM(e.target.value))} required disabled={editingCategory && isLocked} />
              </div>
              <div className="form-group">
                <label className="form-label">Hasta (Fecha Nac.)</label>
                <input type="date" className="form-input" value={toISO(catMaxAge)} onChange={e => setCatMaxAge(toDDMM(e.target.value))} required={!catIsVeteran} disabled={editingCategory && isLocked} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', height: '42px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input type="checkbox" id="vet" checked={catIsVeteran} onChange={e => setCatIsVeteran(e.target.checked)} disabled={editingCategory && isLocked} />
                  <label htmlFor="vet" className="form-label" style={{ marginBottom: 0 }}>¿Vet?</label>
                </div>
                <input type="color" value={catColor} onChange={e => setCatColor(e.target.value)} style={{ width: '38px', height: '38px', border: 'none', background: 'none', cursor: 'pointer' }} />
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingCategory ? 'OK' : 'Añadir'}</button>
              </div>
            </div>
            {editingCategory && isLocked && (
              <div style={{ fontSize: '0.65rem', color: '#fb923c', marginTop: '0.5rem', fontWeight: 600 }}>
                ⚠️ Algunos campos están bloqueados porque la categoría ya tiene partidos o calendario.
              </div>
            )}
          </form>
        </div>
      )}


      {error && <div className="alert alert-error">{error}</div>}
      {warning && <div className="alert alert-warning">{warning}</div>}
      {info && <div className="alert alert-success">{info}</div>}

      {!activeCategory ? (
        <div className="card text-center text-muted">Crea una categoría para empezar</div>
      ) : (
        <>
          <div className="card">
          <div className="flex-between" style={{ marginBottom: '1rem' }}>
            <div className="card-title" style={{ color: activeCategory.color, marginBottom: 0 }}>
              <span className="color-dot" style={{ background: activeCategory.color, width: 12, height: 12 }} />
              {activeCategory.name} ({activeCategory.gender})
              <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.8rem' }}>
                {teams.length} equipos
              </span>
            </div>
              <button 
                className={`btn ${hasMatches ? 'btn-secondary' : 'btn-blue'} btn-sm`} 
                onClick={handleGenerateMatches} 
                disabled={isCategoryScheduled || hasResults || isGenerationBlocked}
                title={hasResults ? "🔒 No se puede regenerar con resultados" : isCategoryScheduled ? "🔒 No se puede regenerar con partidos ya calendados" : isGenerationBlocked ? "🔒 Bloqueado: Calendario global ya iniciado" : (hasMatches ? "🔄 Re-generar Estructura" : "⚡ Generar Partidos")}
              >
                {hasMatches ? '🔄 Re-generar Estructura' : '⚡ Generar Partidos'}
              </button>
              {hasMatches && (
                <button 
                  className="btn btn-red btn-sm" 
                  onClick={handleDeleteMatches} 
                  disabled={isCategoryScheduled || hasResults}
                  title={hasResults ? "🔒 No se puede borrar con resultados" : isCategoryScheduled ? "🔒 No se puede borrar con partidos ya calendados" : "Borrar todos los partidos"}
                >
                  🗑️ Borrar Todo
                </button>
              )}
              <button
                className="btn btn-green btn-sm"
                onClick={handleExportExcel}
                disabled={!hasMatches}
              >
                📊 Exportar Excel
              </button>
            </div>
          </div>

          <div className="tabs">
            {['equipos', 'competicion', 'partidos', 'clasificacion'].map(t => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => handleTabChange(t)}>
                {t === 'equipos' ? '👥 Equipos (F1)' : t === 'competicion' ? '🧭 Competición (F2)' : t === 'partidos' ? '🏀 Partidos (F3)' : '🏆 Clasificación (F4)'}
              </button>
            ))}
          </div>

          {tab === 'equipos' && (
            <div>
              {!isLocked && !hasMatches && (
                <div style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'flex-start' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={!!activeCategory.manualGroupAssignment}
                      onChange={e => handleToggleManualGroupAssignment(e.target.checked)}
                    />
                    Asignación manual de grupos
                  </label>
                  <button 
                    className={`btn ${showTeamForm ? 'btn-secondary' : 'btn-blue'} btn-sm`}
                    onClick={() => {
                      if (showTeamForm && editingTeam) {
                        resetTeamForm();
                      } else {
                        setShowTeamForm(!showTeamForm);
                      }
                    }}
                  >
                    {showTeamForm ? '✕ Cancelar' : '➕ Nuevo Equipo'}
                  </button>
                </div>
              )}

              {!isLocked && !hasMatches && showTeamForm && (
                <div className="card animate-in" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.01)' }}>
                  <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9rem' }}>
                    {editingTeam ? '✏️ Editar Equipo' : '➕ Nuevo Equipo'}
                  </div>
                  <form onSubmit={handleCreateTeam}>
                    <div className="form-row" style={{ marginBottom: '0.75rem' }}>
                      <div className="form-group" style={{ flex: 2 }}>
                        <label className="form-label">Nombre del Equipo *</label>
                        <input className="form-input" value={teamName} onChange={e => setTeamName(e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Nombre Contacto</label>
                        <input className="form-input" value={contactName} onChange={e => setContactName(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Apellidos Contacto</label>
                        <input className="form-input" value={contactLastName} onChange={e => setContactLastName(e.target.value)} />
                      </div>
                    </div>
                    <div className="form-row" style={{ marginBottom: '0.75rem' }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Móvil Contacto</label>
                        <input className="form-input" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
                      </div>
                      <div className="form-group" style={{ flex: 2 }}>
                        <label className="form-label">Email Contacto</label>
                        <input className="form-input" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      {editingTeam && <button type="button" className="btn btn-secondary" onClick={resetTeamForm}>Cancelar</button>}
                      <button type="submit" className="btn btn-primary">{editingTeam ? 'Guardar Cambios' : 'Registrar Equipo'}</button>
                    </div>
                  </form>
                </div>
              )}

              {!isLocked && !hasMatches && (
                <GroupAssignmentPanel
                  enabled={!!activeCategory.manualGroupAssignment}
                  onToggle={handleToggleManualGroupAssignment}
                  teams={teams}
                  counts={manualGroupCounts}
                  layout={manualGroupLayout}
                  onChange={handleManualGroupChange}
                  color={activeCategory.color}
                />
              )}

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Equipo</th><th>Persona Contacto</th><th>Jug.</th>{activeCategory.manualGroupAssignment && <th>Grupo</th>}{!isLocked && <th style={{ textAlign: 'right' }}>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((t, i) => {
                      const hasInvalidAgePlayer = teamHasAgeIssue(t, activeCategory)
                      const teamAgeIssue = getTeamAgeIssue(t, activeCategory)
                      return (
                      <tr key={t.id} onClick={() => setSelectedTeam(t)} style={{ cursor: 'pointer', background: selectedTeam?.id === t.id ? 'rgba(59,130,246,0.05)' : '' }}>
                        <td style={{ color: 'var(--text2)', width: '36px' }}>{i + 1}</td>
                        <td>
                          <ValidationIssueTooltip message={hasInvalidAgePlayer ? 'Este equipo tiene al menos un jugador con edad incorrecta para esta categoría.' : ''}>
                            <div style={{ fontWeight: 600, color: hasInvalidAgePlayer ? '#ef4444' : undefined }}>
                              <ValidationIssueTooltip message={teamAgeIssue}>
                                <TeamRosterTooltip team={t} align="left" />
                              </ValidationIssueTooltip>
                            </div>
                          </ValidationIssueTooltip>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t.contactLastName ? `${t.contactLastName}, ` : ''}{t.contactName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text2)', display: 'flex', gap: '0.6rem', marginTop: '0.2rem' }}>
                            {t.contactPhone && <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>📱 {t.contactPhone}</span>}
                            {t.contactEmail && <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>✉️ {t.contactEmail}</span>}
                          </div>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={getTeamPlayersBadgeStyle(t.players?.length || 0)}
                          >
                            {t.players?.length || 0} / 4
                          </span>
                        </td>
                        {activeCategory.manualGroupAssignment && (
                          <td onClick={e => e.stopPropagation()}>
                            <select
                              className="form-input"
                              value={t.group || ''}
                              onChange={e => handleManualGroupChange(t, e.target.value)}
                              style={{ minWidth: '140px' }}
                            >
                              <option value="">Sin asignar</option>
                              {manualGroupLayout
                                .filter(group => (t.group === group.name) || (manualGroupCounts[group.name] < group.size))
                                .map(group => (
                                  <option key={group.name} value={group.name}>
                                    {group.name} ({manualGroupCounts[group.name]}/{group.size})
                                  </option>
                                ))}
                            </select>
                          </td>
                        )}
                        {!isLocked && (
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                              <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); handleEditTeam(t) }}>✏️</button>
                              <button className="btn btn-red btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteTeam(t.id) }}>🗑</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              {selectedTeam && (
                <div className="card animate-in" style={{ marginTop: '2rem', border: '1px solid var(--border)' }}>
                  <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>👥 Jugadores: {selectedTeam.name}</h3>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelectedTeam(null)}>Cerrar Detalle</button>
                  </div>
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.6rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        👤 Persona de Contacto
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.85rem' }}>
                        <div><span className="text-muted" style={{ marginRight: '0.4rem' }}>Nombre:</span> {selectedTeam.contactLastName ? `${selectedTeam.contactLastName}, ` : ''}{selectedTeam.contactName}</div>
                        <div><span className="text-muted" style={{ marginRight: '0.4rem' }}>Móvil:</span> {selectedTeam.contactPhone || '—'}</div>
                        <div><span className="text-muted" style={{ marginRight: '0.4rem' }}>Email:</span> {selectedTeam.contactEmail || '—'}</div>
                      </div>
                    </div>
                    {!isLocked && <button className="btn btn-secondary btn-sm" onClick={() => handleEditTeam(selectedTeam, true)}>✏️ Editar</button>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr><th>Jugador</th><th>DNI</th><th>F. Nacimiento</th><th>Móvil</th><th>Talla</th>{!isLocked && <th></th>}</tr>
                        </thead>
                        <tbody>
                          {selectedTeam.players?.map(p => {
                            const playerAgeIssue = getPlayerAgeIssue(p, activeCategory)
                            return (
                            <tr key={p.id}>
                              <td>
                                <ValidationIssueTooltip message={playerAgeIssue}>
                                  <span style={{ color: playerAgeIssue ? '#ef4444' : undefined, fontWeight: playerAgeIssue ? 600 : undefined }}>
                                    {p.lastName ? `${p.lastName}, ` : ''}{p.name}
                                  </span>
                                </ValidationIssueTooltip>
                              </td>
                              <td>{p.dni || '—'}</td>
                              <td>{p.birthDate ? p.birthDate.split('-').reverse().join('-') : '—'}</td>
                              <td>{p.phone || '—'}</td>
                              <td>{p.shirtSize || ''}</td>
                              <td style={{ textAlign: 'right' }}>
                                {!isLocked && (
                                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button className="btn btn-secondary btn-xs" onClick={() => handleEditPlayer(p)}>✏️</button>
                                    <button className="btn btn-red btn-xs" onClick={() => deletePlayerAction(p.id)}>✕</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )})}
                        </tbody>
                      </table>
                    </div>
                    {!isLocked && (
                      <div className="card" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        {detailEditMode === 'player' ? (
                          <>
                            <div style={{ fontWeight: 600, marginBottom: '1rem' }}>{editingPlayer ? '✏️ Editar Jugador' : '➕ Añadir Jugador'}</div>
                            <form onSubmit={handleCreatePlayer}>
                              <div className="form-group"><label className="form-label">Nombre *</label><input className="form-input" value={pName} onChange={e => setPName(e.target.value)} required /></div>
                              <div className="form-group"><label className="form-label">Apellidos</label><input className="form-input" value={pLastName} onChange={e => setPLastName(e.target.value)} /></div>
                              <div className="form-group"><label className="form-label">DNI</label><input className="form-input" value={pDni} onChange={e => setPDni(e.target.value)} /></div>
                              <div className="form-group"><label className="form-label">F. Nacimiento *</label><input type="date" className="form-input" value={toISO(pBirthDate)} onChange={e => setPBirthDate(toDDMM(e.target.value))} required /></div>
                              <div className="form-group"><label className="form-label">Talla</label><input className="form-input" value={pShirtSize} onChange={e => setPShirtSize(e.target.value)} /></div>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {editingPlayer && <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setEditingPlayer(null); setPName(''); setPLastName(''); setPDni(''); setPBirthDate(''); setPShirtSize(''); }}>Cancelar</button>}
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{editingPlayer ? 'Guardar' : 'Añadir'}</button>
                              </div>
                            </form>
                          </>
                        ) : (
                          <>
                            <div style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--accent)' }}>✏️ Editar Datos de Contacto</div>
                            <form onSubmit={handleCreateTeam}>
                              <div className="form-group"><label className="form-label">Nombre Contacto</label><input className="form-input" value={contactName} onChange={e => setContactName(e.target.value)} /></div>
                              <div className="form-group"><label className="form-label">Apellidos Contacto</label><input className="form-input" value={contactLastName} onChange={e => setContactLastName(e.target.value)} /></div>
                              <div className="form-group"><label className="form-label">Móvil Contacto</label><input className="form-input" value={contactPhone} onChange={e => setContactPhone(e.target.value)} /></div>
                              <div className="form-group"><label className="form-label">Email Contacto</label><input className="form-input" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} /></div>
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setDetailEditMode('player'); setEditingTeam(null); }}>Cancelar</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>Guardar Cambios</button>
                              </div>
                            </form>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'partidos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="card" style={{ padding: '0.9rem 1rem', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, color: 'var(--text)' }}>Ordenar por</span>
                  <select
                    className="form-input"
                    value={competitionOrderMode}
                    onChange={e => setCompetitionOrderMode(e.target.value)}
                    style={{ width: '220px' }}
                  >
                    <option value="group">Grupo</option>
                    <option value="round">Ronda</option>
                  </select>
                </div>
              </div>
              {!isLocked && !hasMatches && (
                <GroupAssignmentPanel
                  enabled={!!activeCategory.manualGroupAssignment}
                  onToggle={handleToggleManualGroupAssignment}
                  teams={teams}
                  counts={manualGroupCounts}
                  layout={manualGroupLayout}
                  onChange={handleManualGroupChange}
                  color={activeCategory.color}
                />
              )}
              {Object.entries(matches.reduce((acc, m) => {
                const key = competitionOrderMode === 'round'
                  ? getCompetitionRoundBucket(m).label
                  : (m.group || 'Liga');
                if (!acc[key]) acc[key] = [];
                acc[key].push(m);
                return acc;
              }, {}))
                .sort(([a], [b]) => {
                  if (competitionOrderMode === 'round') {
                    const sampleA = matches.find(m => getCompetitionRoundBucket(m).label === a)
                    const sampleB = matches.find(m => getCompetitionRoundBucket(m).label === b)
                    const bucketA = getCompetitionRoundBucket(sampleA || {})
                    const bucketB = getCompetitionRoundBucket(sampleB || {})
                    if (bucketA.phaseOrder !== bucketB.phaseOrder) return bucketA.phaseOrder - bucketB.phaseOrder
                    if (bucketA.roundNumber !== bucketB.roundNumber) return bucketA.roundNumber - bucketB.roundNumber
                    return compareGroupNames(a, b)
                  }
                  return compareGroupNames(a, b)
                })
                .map(([group, groupMatches]) => (
                <div key={group}>
                  <h4 style={{ color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>{group}</h4>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Nº</th><th>Horario</th><th>Local</th><th>Resultado</th><th>Visitante</th><th>Oficial</th><th>Estado</th><th>Acción</th></tr>
                      </thead>
                      <tbody>
                        {groupMatches
                          .sort(compareCompetitionMatches)
                          .map(m => {
                            const homeWon = m.status === 'played' && m.homeScore !== null && m.awayScore !== null && Number(m.homeScore) > Number(m.awayScore);
                            const awayWon = m.status === 'played' && m.homeScore !== null && m.awayScore !== null && Number(m.awayScore) > Number(m.homeScore);
                            const isEditing = editingScoreIds.includes(m.id);
                            return (
                              <tr key={m.id} style={{ position: 'relative', background: m.active ? 'rgba(34, 197, 94, 0.05)' : 'transparent' }}>
                                <td style={{ fontWeight: 800, color: 'var(--accent)', verticalAlign: 'middle' }}>
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span>#{m.matchNumber}</span>
                                    {m.active && (
                                      <span style={{ 
                                        background: m.isLive ? '#ef4444' : '#22c55e', 
                                        color: 'white', 
                                        fontSize: '0.6rem', 
                                        padding: '1px 4px', 
                                        borderRadius: '3px',
                                        fontWeight: 900,
                                        animation: m.isLive ? 'pulse-live 2s infinite' : 'none'
                                      }}>
                                        {m.isLive ? 'EN JUEGO' : 'ACTIVO'}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>
                                  <div>{m.scheduleSlot ? `${m.scheduleSlot.startTime} (${m.scheduleSlot.court})` : '—'}</div>
                                  <div style={{ fontSize: '0.7rem', color: 'var(--text2)', fontWeight: 700 }}>{getMatchRoundLabel(m)}</div>
                                </td>
                                <td style={{ fontWeight: (m.status === 'played' && homeWon) ? 900 : 400, color: (m.status === 'played' && homeWon) ? activeCategory.color : 'inherit' }}>
                                  <TeamRosterTooltip team={m.homeTeam} align="right" />
                                </td>
                                <td>
                                  {isEditing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', gap: '0.2rem' }}>
                                        <input type="number" min="0" max="21" className="score-input" value={scores[m.id]?.home ?? ''} onChange={e => setScores({ ...scores, [m.id]: { ...scores[m.id], home: e.target.value === '' ? '' : +e.target.value } })} />
                                        <input type="number" min="0" max="21" className="score-input" value={scores[m.id]?.away ?? ''} onChange={e => setScores({ ...scores, [m.id]: { ...scores[m.id], away: e.target.value === '' ? '' : +e.target.value } })} />
                                      </div>
                                      <input type="text" className="form-input" placeholder="Observaciones..." value={scores[m.id]?.obs ?? m.observations ?? ''} onChange={e => setScores({ ...scores, [m.id]: { ...scores[m.id], obs: e.target.value } })} style={{ width: '100%', fontSize: '0.8rem', padding: '0.2rem' }} />
                                    </div>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                      <div style={{ fontWeight: 800 }}>
                                        <span style={{ color: (m.status === 'played' && homeWon) ? activeCategory.color : 'inherit' }}>{m.homeScore ?? '-'}</span> : <span style={{ color: (m.status === 'played' && awayWon) ? activeCategory.color : 'inherit' }}>{m.awayScore ?? '-'}</span>
                                      </div>
                                      {m.observations && <div style={{ fontSize: '0.75rem', color: 'var(--text2)', marginTop: '0.2rem', fontStyle: 'italic' }}>📝 {m.observations}</div>}
                                    </div>
                                  )}
                                </td>
                                <td style={{ fontWeight: (m.status === 'played' && awayWon) ? 900 : 400, color: (m.status === 'played' && awayWon) ? activeCategory.color : 'inherit' }}>
                                  <TeamRosterTooltip team={m.awayTeam} align="left" />
                                </td>
                                <td style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>{m.officialName || '—'}</td>
                                <td><span className={`badge ${m.status === 'played' ? 'badge-played' : 'badge-pending'}`}>{m.status === 'played' ? '✓' : '...'}</span></td>
                                <td>
                                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    {isEditing ? (
                                      <button className="btn btn-green btn-sm" onClick={() => handleScoreSubmit(m.id)}>💾</button>
                                    ) : (
                                      <>
                                        <button 
                                          className="btn btn-secondary btn-sm" 
                                          disabled={m.active || !m.scheduleSlot || !m.homeTeamId || !m.awayTeamId}
                                          title={m.active ? "🔒 Partido ACTIVO: Desactívalo para editar" : !m.homeTeamId || !m.awayTeamId ? "🔒 Equipos aún no definidos" : !m.scheduleSlot ? "🔒 El partido debe estar programado" : !checkMatchDependency(m.id, true) ? "🔒 Bloqueado: Hay resultados posteriores" : "Editar marcador"}
                                          onClick={() => {
                                            if (!m.homeTeamId || !m.awayTeamId) return;
                                            if (!checkMatchDependency(m.id)) return;
                                            setEditingScoreIds(prev => [...prev, m.id]);
                                            setScores(s => ({ ...s, [m.id]: { home: m.homeScore, away: m.awayScore, obs: m.observations || '' } }));
                                          }}
                                        >
                                          ✏️
                                        </button>
                                        {(m.status === 'played' || (m.homeScore !== null && m.awayScore !== null)) && (
                                          <button 
                                          className="btn btn-red btn-sm" 
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
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'clasificacion' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative', minHeight: '300px' }}>
              {matches.length > 0 && matches.some(m => m.status !== 'played') && (
                <div className="provisional-watermark">PROVISIONAL</div>
              )}
              {Object.entries(standings.byGroup || {}).sort(([a], [b]) => compareGroupNames(a, b)).map(([g, gs]) => (
                <div key={g}>
                  <h4 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>📊 {g}</h4>
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Pos</th><th>Equipo</th><th>PJ</th><th>G</th><th>P</th><th>PF</th><th>PC</th><th>Dif</th></tr></thead>
                      <tbody>
                        {gs
                          .map((s, i) => ({ ...s, originalPos: i + 1 }))
                          .map((s) => (
                          <tr key={s.team.id}>
                            <td>{s.originalPos}º</td><td title={s.team.name} style={{ cursor: 'help' }}>{s.team.name}</td><td>{s.played}</td><td>{s.wins}</td><td>{s.losses}</td><td>{s.pf}</td><td>{s.pa}</td><td>{s.diff}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}


              {/* Clasificación General (Ranking Final) */}
              {finalRanking.length > 0 && (
                <div className="card animate-in" style={{ marginTop: '1rem', padding: '1.5rem', background: 'rgba(249,115,22,0.03)', borderRadius: '12px', border: '1px solid rgba(249,115,22,0.2)', overflowX: 'auto' }}>
                  <h3 style={{ color: 'var(--accent)', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.5rem' }}>
                    🏆 CLASIFICACIÓN GENERAL 🏆
                  </h3>
                  <div className="table-wrap" style={{ background: 'transparent' }}>
                    <table style={{ borderCollapse: 'separate', borderSpacing: '0 8px', width: '100%', minWidth: '600px' }}>
                      <thead>
                        <tr>
                          <th style={{ background: 'transparent', textAlign: 'center' }}>PUESTO</th>
                          <th style={{ background: 'transparent' }}>EQUIPO</th>
                          <th style={{ background: 'transparent' }}>LOGRO / PREMIO</th>
                          <th style={{ background: 'transparent' }}>BALANCE GENERAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {finalRanking
                          .map((r, i) => ({ ...r, originalPos: r.rank })) // Usamos r.rank que ya viene del backend
                          .map((r) => {
                          const isPodium = r.originalPos <= 3;
                          return (
                            <tr key={r.teamId} style={{ 
                              background: isPodium ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                              boxShadow: isPodium ? '0 4px 12px rgba(249,115,22,0.1)' : 'none',
                              transform: isPodium ? 'scale(1.01)' : 'none'
                            }}>
                              <td style={{ 
                                padding: '1rem', 
                                fontSize: isPodium ? '1.4rem' : '1.1rem', 
                                textAlign: 'center', 
                                fontWeight: 800,
                                color: r.rank === 1 ? '#ffd700' : r.rank === 2 ? '#c0c0c0' : r.rank === 3 ? '#cd7f32' : 'var(--text2)'
                              }}>
                                {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
                              </td>
                              <td title={r.team.name} style={{ padding: '1rem', fontWeight: 700, fontSize: isPodium ? '1.1rem' : '0.95rem', cursor: 'help' }}>
                                {r.team.name}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span className={`badge ${r.rank === 1 ? 'badge-success' : r.rank === 2 ? 'badge-blue' : 'badge-pending'}`} style={{ padding: '0.4rem 0.8rem' }}>
                                  {r.note}
                                </span>
                              </td>
                              <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--text2)' }}>
                                 {r.wins}G | {r.diff >= 0 ? '+' : ''}{r.diff} Dif | {r.pf} pts
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'competicion' && (
            <div className="animate-in">
              {!isLocked && !hasMatches && (
                <GroupAssignmentPanel
                  enabled={!!activeCategory.manualGroupAssignment}
                  onToggle={handleToggleManualGroupAssignment}
                  teams={teams}
                  counts={manualGroupCounts}
                  layout={manualGroupLayout}
                  onChange={handleManualGroupChange}
                  color={activeCategory.color}
                />
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                {Array.from(new Set(teams.map(t => t.group || 'Grupo A'))).sort().map(g => (
                  <div key={g} className="card" style={{ background: 'rgba(255,255,255,0.02)', borderTop: `4px solid ${activeCategory?.color || 'var(--accent)'}` }}>
                    <h4 style={{ color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>📋</span> {g}
                    </h4>
                    {teams.filter(t => (t.group || 'Grupo A') === g).map(team => (
                      <div 
                        key={team.id} 
                        title={`${team.name}\n${(team.players || []).map(p => `${p.lastName || ''}, ${p.name || ''}`).join('\n')}`} 
                        style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.03)', marginBottom: '0.4rem', borderRadius: '6px', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.05)', cursor: 'help' }}
                      >
                        {team.name}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* FASES ELIMINATORIAS (CUADRO) */}
              {matches.some(m => m.round > 1) && (
                <div className="card" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)' }}>
                  <h3 style={{ color: 'var(--accent)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    🏆 Fase Final: Cuadro de Eliminatorias
                  </h3>
                  
                  <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '1.5rem', minHeight: '560px', alignItems: 'stretch' }}>
                    {Array.from(new Set(matches.filter(m => m.round > 1).map(m => m.round))).sort((a,b)=>a-b).map(r => {
                      const roundMatches = matches.filter(m => m.round === r);
                      if (roundMatches.length === 0) return null;
                      
                      // Etiqueta inteligente según el nombre del primer partido de la ronda
                      const firstG = roundMatches[0].group.toLowerCase();
                      let label = `RONDA ${r}`;
                      if (firstG.includes('octavo')) label = 'OCTAVOS DE FINAL';
                      else if (firstG.includes('cuarto')) label = 'CUARTOS DE FINAL';
                      else if (firstG.includes('semifinal')) label = 'SEMIFINALES';
                      else if (firstG.includes('final')) label = 'GRAN FINAL';

                      const hasFinal = roundMatches.some(m => m.group === 'Final');
                      const hasThirdPlace = roundMatches.some(m => m.group === 'Tercer y Cuarto Puesto');
                      const isFinalColumnWithThirdPlace = hasFinal && hasThirdPlace;

                      return (
                        <div key={r} style={{ flex: '1', minWidth: '240px', display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
                          <div style={{ 
                            textAlign: 'center', 
                            background: 'var(--bg3)', 
                            padding: '0.5rem', 
                            borderRadius: '6px', 
                            fontSize: '0.75rem', 
                            fontWeight: 800, 
                            color: 'var(--accent)',
                            marginBottom: '1.5rem',
                            border: '1px solid var(--border)',
                            textTransform: 'uppercase'
                          }}>
                            {label}
                          </div>
                          
                          {isFinalColumnWithThirdPlace ? (
                            <div style={{ position: 'relative', flex: 1, minHeight: '420px' }}>
                              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, transform: 'translateY(-50%)' }}>
                                {roundMatches
                                  .filter(m => m.group === 'Final')
                                  .map(m => (
                                    <BracketMatch
                                      key={m.id}
                                      match={m}
                                      color={activeCategory.color}
                                    />
                                  ))}
                              </div>
                              <div style={{ position: 'absolute', top: 'calc(50% + 150px)', left: 0, right: 0 }}>
                                {roundMatches
                                  .filter(m => m.group === 'Tercer y Cuarto Puesto')
                                  .map(m => (
                                    <BracketMatch
                                      key={m.id}
                                      match={m}
                                      color={activeCategory.color}
                                    />
                                  ))}
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'space-around', flex: 1 }}>
                              {roundMatches.sort((a,b) => {
                                if (a.group === 'Final') return -1;
                                if (b.group === 'Final') return 1;
                                return a.id - b.id;
                              }).map(m => (
                                <BracketMatch 
                                  key={m.id} 
                                  match={m} 
                                  color={activeCategory.color} 
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
