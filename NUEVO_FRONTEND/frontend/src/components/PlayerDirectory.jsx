import { useState, useEffect, useCallback } from 'react'
import { getPlayerDirectory, getCategories } from '../api'

export default function PlayerDirectory({ tournament }) {
  const [players, setPlayers] = useState([])
  const [categories, setCategories] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filters
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
    } catch (e) { setError(e.message) }
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
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [tournament.id, search, fCat, fTeam])

  useEffect(() => { loadInitialData() }, [loadInitialData])
  useEffect(() => { 
    const t = setTimeout(loadPlayers, 300)
    return () => clearTimeout(t)
  }, [loadPlayers])

  useEffect(() => {
    // Si no hay categorías cargadas, no hacemos nada aún
    if (categories.length === 0) {
      setTeams([])
      return
    }

    if (!fCat) {
      // Si no hay categoría seleccionada, mostramos TODOS los equipos del torneo
      const allTeams = categories.flatMap(c => c.teams || [])
      // Ordenamos alfabéticamente
      const sortedTeams = [...allTeams].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      setTeams(sortedTeams)
    } else {
      // Si hay categoría, filtramos los equipos de esa categoría
      const selectedCat = categories.find(c => c.id === parseInt(fCat))
      if (selectedCat) {
        setTeams(selectedCat.teams || [])
      } else {
        setTeams([])
      }
      
      // Si el equipo seleccionado actualmente no pertenece a esta categoría, reseteamos el filtro de equipo
      if (fTeam) {
        const teamBelongs = selectedCat?.teams?.some(t => t.id === parseInt(fTeam))
        if (!teamBelongs) setFTeam('')
      }
    }
  }, [fCat, categories, fTeam])

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }

  const sortedPlayers = [...players].sort((a, b) => {
    let aVal = '', bVal = '';
    if (sortConfig.key === 'name') {
      aVal = `${a.lastName || ''} ${a.name || ''}`.toLowerCase();
      bVal = `${b.lastName || ''} ${b.name || ''}`.toLowerCase();
    } else if (sortConfig.key === 'team') {
      aVal = (a.team?.name || '').toLowerCase();
      bVal = (b.team?.name || '').toLowerCase();
    } else if (sortConfig.key === 'category') {
      aVal = (a.team?.category?.name || '').toLowerCase();
      bVal = (b.team?.category?.name || '').toLowerCase();
    } else if (sortConfig.key === 'shirt') {
      aVal = (a.shirtSize || '').toLowerCase();
      bVal = (b.shirtSize || '').toLowerCase();
    } else if (sortConfig.key === 'birth') {
      aVal = (a.birthDate || '');
      bVal = (b.birthDate || '');
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedPlayers.length / pageSize)
  const paginatedPlayers = sortedPlayers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) return <span style={{ opacity: 0.3, marginLeft: '0.4rem' }}>↕</span>
    return <span style={{ marginLeft: '0.4rem', color: 'var(--accent)' }}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
  }

  const handleExportCSV = () => {
    try {
      // Usamos sortedPlayers que ya tiene aplicados los filtros del backend y el orden local
      const dataToExport = sortedPlayers
      
      const headers = ['Nombre', 'Apellidos', 'Equipo', 'Categoría', 'Tipo', 'F. Nacimiento', 'Teléfono', 'Talla']
      const rows = dataToExport.map(p => [
        p.name,
        p.lastName || '',
        p.team?.name || '',
        p.team?.category?.name || '',
        `${p.team?.category?.gender || ''}${p.team?.category?.isVeteran ? ' VET' : ''}`,
        p.birthDate ? p.birthDate.split('-').reverse().join('-') : '',
        p.phone || '',
        p.shirtSize || ''
      ])
      
      const csvContent = "\uFEFF" + [
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
      // No incluimos cabecera para compatibilidad directa con el proceso de importación solicitado
      
      // Filtramos las categorías a procesar según el filtro de la UI
      const categoriesToProcess = fCat 
        ? categories.filter(c => c.id === parseInt(fCat))
        : categories

      categoriesToProcess.forEach(cat => {
        if (!cat.teams) return
        
        // Filtramos los equipos a procesar según el filtro de la UI
        const teamsToProcess = fTeam
          ? cat.teams.filter(t => t.id === parseInt(fTeam))
          : cat.teams

        teamsToProcess.forEach(team => {
          const row = new Array(32).fill('')
          row[0] = team.name
          row[1] = cat.name
          row[2] = cat.gender
          row[3] = team.contactName || ''
          row[4] = team.contactLastName || ''
          row[5] = ''
          row[6] = team.contactEmail || ''
          row[7] = team.contactPhone || ''

          if (team.players) {
            team.players.forEach((p, idx) => {
              if (idx >= 4) return // Formato importación soporta hasta 4
              const start = 8 + (idx * 6)
              row[start] = p.name
              row[start + 1] = p.lastName || ''
              row[start + 2] = ''
              row[start + 3] = p.phone || ''
              row[start + 4] = p.birthDate || ''
              row[start + 5] = p.shirtSize || ''
            })
          }
          rows.push(row.join(';'))
        })
      })

      const csvContent = rows.join('\n')
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
      alert('Error al exportar formato importación')
    }
  }

  return (
    <div className="animate-in">
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="flex-between" style={{ marginBottom: '1rem' }}>
          <div>
            <h2 className="card-title" style={{ marginBottom: '0.25rem' }}>⛹️ Directorio de Jugadores</h2>
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>{players.length} jugadores encontrados</div>
          </div>
          <div className="flex-gap">
            <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
              📥 Exportar Jugadores (CSV)
            </button>
            <button className="btn btn-blue btn-sm" onClick={handleExportTeamsImportFormat}>
              📋 Exportar Equipos (CSV)
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
            <label className="form-label">Categoría</label>
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
                <th onClick={() => requestSort('category')} style={{ cursor: 'pointer', userSelect: 'none' }}>Categoría <SortIcon col="category" /></th>
                <th onClick={() => requestSort('birth')} style={{ cursor: 'pointer', userSelect: 'none' }}>F. Nacimiento <SortIcon col="birth" /></th>
                <th onClick={() => requestSort('shirt')} style={{ cursor: 'pointer', userSelect: 'none' }}>Talla <SortIcon col="shirt" /></th>
                <th>Contacto</th>
              </tr>
            </thead>
            <tbody>
              {loading && players.length === 0 ? (
                <tr><td colSpan={6} className="text-center" style={{ padding: '3rem' }}><div className="spinner" /></td></tr>
              ) : players.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted" style={{ padding: '3rem' }}>No se han encontrado jugadores con estos filtros</td></tr>
              ) : (
                paginatedPlayers.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.lastName}, {p.name}</div>
                    </td>
                    <td title={p.team.name} style={{ cursor: 'help' }}>
                      <div style={{ color: p.team.category.color, fontWeight: 500 }}>{p.team.name}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: `${p.team.category.color}20`, color: p.team.category.color, border: `1px solid ${p.team.category.color}40` }}>
                        {p.team.category.name} ({p.team.category.gender})
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{p.birthDate ? p.birthDate.split('-').reverse().join('-') : '—'}</td>
                    <td style={{ fontWeight: 700 }}>{p.shirtSize || ''}</td>
                    <td>
                      <div style={{ fontSize: '0.75rem' }}>{p.phone || '—'}</div>
                    </td>
                  </tr>
                ))
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
                ◀️ Anterior
              </button>
              <div style={{ padding: '0 1rem', fontWeight: 700 }}>{currentPage} / {totalPages}</div>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente ▶️
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
