import { useState, useEffect, useCallback, useMemo } from 'react'
import { getPlayerDirectory, getCategories } from '../api'
import TeamRosterTooltip from './TeamRosterTooltip'
import ValidationIssueTooltip from './ValidationIssueTooltip'
import { getPlayerAgeIssue, teamHasAgeIssue } from '../utils/playerAgeValidation'

const IMPORT_PLAYER_BLOCK_SIZE = 7
const IMPORT_MAX_PLAYERS = 4
const IMPORT_FIXED_COLUMNS = 8
const IMPORT_TOTAL_COLUMNS = IMPORT_FIXED_COLUMNS + (IMPORT_PLAYER_BLOCK_SIZE * IMPORT_MAX_PLAYERS)

function splitLastNames(lastName) {
  const parts = String(lastName || '').trim().split(/\s+/).filter(Boolean)
  return [
    parts[0] || '',
    parts.slice(1).join(' ')
  ]
}

export default function PlayerDirectory({ tournament }) {
  const [players, setPlayers] = useState([])
  const [categories, setCategories] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [fCat, setFCat] = useState('')
  const [fTeam, setFTeam] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50

  const loadInitialData = useCallback(async () => {
    try {
      const cats = await getCategories(tournament.id)
      setCategories(cats)
    } catch (e) {
      setError(e.message)
    }
  }, [tournament.id])

  const loadPlayers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPlayerDirectory(tournament.id, {
        search,
        categoryId: fCat,
        teamId: fTeam
      })
      setPlayers(data)
      setCurrentPage(1)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [tournament.id, search, fCat, fTeam])

  useEffect(() => { loadInitialData() }, [loadInitialData])

  useEffect(() => {
    const t = setTimeout(loadPlayers, 300)
    return () => clearTimeout(t)
  }, [loadPlayers])

  useEffect(() => {
    if (categories.length === 0) {
      setTeams([])
      return
    }

    if (!fCat) {
      const allTeams = categories.flatMap(c => c.teams || [])
      const sortedTeams = [...allTeams].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      setTeams(sortedTeams)
    } else {
      const selectedCat = categories.find(c => c.id === parseInt(fCat))
      if (selectedCat) {
        setTeams(selectedCat.teams || [])
      } else {
        setTeams([])
      }

      if (fTeam) {
        const teamBelongs = selectedCat?.teams?.some(t => t.id === parseInt(fTeam))
        if (!teamBelongs) setFTeam('')
      }
    }
  }, [fCat, categories, fTeam])

  const teamsById = useMemo(() => {
    const map = new Map()
    categories.forEach(category => {
      ;(category.teams || []).forEach(team => {
        map.set(team.id, { ...team, category })
      })
    })
    return map
  }, [categories])

  const requestSort = (key) => {
    let direction = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const sortedPlayers = [...players].sort((a, b) => {
    let aVal = ''
    let bVal = ''

    if (sortConfig.key === 'name') {
      aVal = `${a.lastName || ''} ${a.name || ''}`.toLowerCase()
      bVal = `${b.lastName || ''} ${b.name || ''}`.toLowerCase()
    } else if (sortConfig.key === 'team') {
      aVal = (a.team?.name || '').toLowerCase()
      bVal = (b.team?.name || '').toLowerCase()
    } else if (sortConfig.key === 'category') {
      aVal = (a.team?.category?.name || '').toLowerCase()
      bVal = (b.team?.category?.name || '').toLowerCase()
    } else if (sortConfig.key === 'shirt') {
      aVal = (a.shirtSize || '').toLowerCase()
      bVal = (b.shirtSize || '').toLowerCase()
    } else if (sortConfig.key === 'birth') {
      aVal = a.birthDate || ''
      bVal = b.birthDate || ''
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedPlayers.length / pageSize)
  const paginatedPlayers = sortedPlayers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) return <span style={{ opacity: 0.3, marginLeft: '0.4rem' }}>↕</span>
    return <span style={{ marginLeft: '0.4rem', color: 'var(--accent)' }}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
  }

  const handleExportCSV = () => {
    try {
      const dataToExport = sortedPlayers
      const headers = ['Nombre', 'Apellidos', 'DNI', 'Equipo', 'Categoria', 'Tipo', 'F. Nacimiento', 'Telefono', 'Talla']
      const rows = dataToExport.map(p => [
        p.name,
        p.lastName || '',
        p.dni || '',
        p.team?.name || '',
        p.team?.category?.name || '',
        `${p.team?.category?.gender || ''}${p.team?.category?.isVeteran ? ' VET' : ''}`,
        p.birthDate ? p.birthDate.split('-').reverse().join('-') : '',
        p.phone || '',
        p.shirtSize || ''
      ])

      const csvContent = '\uFEFF' + [
        headers.join(';'),
        ...rows.map(r => r.join(';'))
      ].join('\n')

      const now = new Date()
      const yyyy = now.getFullYear()
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      const hh = String(now.getHours()).padStart(2, '0')
      const mi = String(now.getMinutes()).padStart(2, '0')

      const timestamp = `${dd}-${mm}-${yyyy}-${hh}-${mi}`
      const filename = `${tournament.name.toUpperCase().replace(/\s+/g, '_')}_JUGADORES_${timestamp}.csv`

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error(e)
      alert('Error al exportar jugadores')
    }
  }

  const handleExportTeamsImportFormat = () => {
    try {
      const rows = []
      const categoriesToProcess = fCat
        ? categories.filter(c => c.id === parseInt(fCat))
        : categories

      categoriesToProcess.forEach(cat => {
        if (!cat.teams) return

        const teamsToProcess = fTeam
          ? cat.teams.filter(t => t.id === parseInt(fTeam))
          : cat.teams

        teamsToProcess.forEach(team => {
          const [contactLastName1, contactLastName2] = splitLastNames(team.contactLastName)
          const row = new Array(IMPORT_TOTAL_COLUMNS).fill('')
          row[0] = team.name
          row[1] = cat.name
          row[2] = cat.gender
          row[3] = team.contactName || ''
          row[4] = contactLastName1
          row[5] = contactLastName2
          row[6] = team.contactEmail || ''
          row[7] = team.contactPhone || ''

          if (team.players) {
            team.players.forEach((p, idx) => {
              if (idx >= IMPORT_MAX_PLAYERS) return
              const [playerLastName1, playerLastName2] = splitLastNames(p.lastName)
              const start = IMPORT_FIXED_COLUMNS + (idx * IMPORT_PLAYER_BLOCK_SIZE)
              row[start] = p.name
              row[start + 1] = playerLastName1
              row[start + 2] = playerLastName2
              row[start + 3] = p.phone || ''
              row[start + 4] = p.dni || ''
              row[start + 5] = p.birthDate || ''
              row[start + 6] = p.shirtSize || ''
            })
          }
          rows.push(row.join(';'))
        })
      })

      const csvContent = '\uFEFF' + rows.join('\n')
      const now = new Date()
      const timestamp = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`
      const filename = `${tournament.name.toUpperCase().replace(/\s+/g, '_')}_FORMATO_IMPORTACION_${timestamp}.csv`

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error(e)
      alert('Error al exportar formato importacion')
    }
  }

  return (
    <div className="animate-in">
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>Directorio de Jugadores</h2>
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>{players.length} jugadores encontrados</div>
          </div>
          <div className="flex-gap">
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
              Exportar Jugadores (CSV)
            </button>
            <button className="btn btn-blue btn-sm" onClick={handleExportTeamsImportFormat}>
              Exportar Equipos (CSV)
            </button>
          </div>
        </div>

        <div className="form-row" style={{ gap: '1rem' }}>
          <div className="form-group" style={{ flex: 2 }}>
            <label className="form-label">Buscar por Nombre o Apellidos</label>
            <input
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Escribe para buscar..."
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Categoria</label>
            <select className="form-input" value={fCat} onChange={e => setFCat(e.target.value)}>
              <option value="">Todas</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.gender})</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Equipo</label>
            <select className="form-input" value={fTeam} onChange={e => setFTeam(e.target.value)}>
              <option value="">Todos</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th onClick={() => requestSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>Jugador <SortIcon col="name" /></th>
                <th onClick={() => requestSort('team')} style={{ cursor: 'pointer', userSelect: 'none' }}>Equipo <SortIcon col="team" /></th>
                <th onClick={() => requestSort('category')} style={{ cursor: 'pointer', userSelect: 'none' }}>Categoria <SortIcon col="category" /></th>
                <th onClick={() => requestSort('birth')} style={{ cursor: 'pointer', userSelect: 'none' }}>F. Nacimiento <SortIcon col="birth" /></th>
                <th>DNI</th>
                <th onClick={() => requestSort('shirt')} style={{ cursor: 'pointer', userSelect: 'none' }}>Talla <SortIcon col="shirt" /></th>
                <th>Contacto</th>
              </tr>
            </thead>
            <tbody>
              {loading && players.length === 0 ? (
                <tr><td colSpan={7} className="text-center" style={{ padding: '3rem' }}><div className="spinner" /></td></tr>
              ) : players.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted" style={{ padding: '3rem' }}>No se han encontrado jugadores con estos filtros</td></tr>
              ) : (
                paginatedPlayers.map(player => {
                  const enrichedTeam = teamsById.get(player.team?.id) || player.team
                  const playerAgeIssue = getPlayerAgeIssue(player, player.team?.category)
                  return (
                    <tr key={player.id}>
                      <td>
                        <ValidationIssueTooltip message={playerAgeIssue}>
                          <div style={{ fontWeight: 600, color: playerAgeIssue ? '#ef4444' : undefined }}>
                            {player.lastName}, {player.name}
                          </div>
                        </ValidationIssueTooltip>
                      </td>
                      <td style={{ cursor: 'help' }}>
                        <div style={{ color: player.team.category.color, fontWeight: 500 }}>
                          <TeamRosterTooltip team={enrichedTeam} align="left" />
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: `${player.team.category.color}20`, color: player.team.category.color, border: `1px solid ${player.team.category.color}40` }}>
                          {player.team.category.name} ({player.team.category.gender})
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>{player.birthDate ? player.birthDate.split('-').reverse().join('-') : '—'}</td>
                      <td style={{ fontFamily: 'monospace' }}>{player.dni || '—'}</td>
                      <td style={{ fontWeight: 700 }}>{player.shirtSize || ''}</td>
                      <td>
                        <div style={{ fontSize: '0.75rem' }}>{player.phone || '—'}</div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex-between" style={{ padding: '1rem', background: 'var(--bg3)', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem' }}>
              Mostrando <strong>{(currentPage - 1) * pageSize + 1}</strong> a <strong>{Math.min(currentPage * pageSize, sortedPlayers.length)}</strong> de <strong>{sortedPlayers.length}</strong> jugadores
            </div>
            <div className="flex-gap">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <div style={{ padding: '0 1rem', fontWeight: 700 }}>{currentPage} / {totalPages}</div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
