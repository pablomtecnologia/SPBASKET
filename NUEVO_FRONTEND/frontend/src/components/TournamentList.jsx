import { useState, useEffect, useCallback } from 'react'
import { getTournaments, createTournament, updateTournament, deleteTournament, activateTournament, cloneTournament, getGroupLogics } from '../api'

const COLORS = ['#f97316','#3b82f6','#22c55e','#a855f7','#ec4899','#14b8a6','#f59e0b','#ef4444','#06b6d4','#84cc16']

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

const isValidDisplayDate = (value) => /^\d{2}-\d{2}-\d{4}$/.test(String(value || '').trim())

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
  if (!aDate || !bDate) return 0
  if (aDate !== bDate) return aDate.localeCompare(bDate)
  return a.startTime.localeCompare(b.startTime)
})

export default function TournamentList({ onSelect, selected, extraActions = null }) {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [jornadas, setJornadas] = useState([{ date: '', startTime: '09:00', endTime: '14:00', matchDuration: 15, matchPlayTime: 10, restRoundsBetweenMatches: 1 }])
  const [venue, setVenue] = useState('')
  const [numCourts, setNumCourts] = useState(1)
  const [matchDuration, setMatchDuration] = useState(15)
  const [matchPlayTime, setMatchPlayTime] = useState(10)
  const [strictScheduleMode, setStrictScheduleMode] = useState(false)
  const [monitorRefreshTime, setMonitorRefreshTime] = useState(3)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [showCloneForm, setShowCloneForm] = useState(false)
  const [sourceTournamentId, setSourceTournamentId] = useState('')
  const [cloneOptions, setCloneOptions] = useState({
    params: true,
    info: true,
    categories: true,
    teams: false,
    players: false,
    officials: true
  })
  const [error, setError] = useState(null)
  const [groupLogics, setGroupLogics] = useState([])
  const [groupLogicId, setGroupLogicId] = useState('')

  const load = useCallback(async () => {
    try {
      const [data, logics] = await Promise.all([getTournaments(), getGroupLogics()])
      setTournaments(data)
      setGroupLogics(logics)
      setGroupLogicId(prev => prev || String(logics.find(l => l.isDefault)?.id || ''))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const handler = () => load()
    window.addEventListener('group-logics-updated', handler)
    return () => window.removeEventListener('group-logics-updated', handler)
  }, [load])

  const handleAddJornada = () => {
    setJornadas(prev => [...prev, { date: '', startTime: '09:00', endTime: '14:00', matchDuration, matchPlayTime, restRoundsBetweenMatches: 1 }])
  }

  const handleRemoveJornada = (idx) => {
    setJornadas(jornadas.filter((_, i) => i !== idx))
  }

  const handleJornadaChange = (idx, field, value) => {
    const newJ = [...jornadas]
    newJ[idx][field] = value
    // Solo ordenar si el campo editado es fecha u hora de inicio, y ambos están completos
    if (field === 'date' || field === 'startTime') {
       newJ.sort((a, b) => {
         if (!a.date || !b.date) return 0;
         if (a.date !== b.date) return a.date.localeCompare(b.date);
         return a.startTime.localeCompare(b.startTime);
       });
    }
    setJornadas(newJ)
  }

  const handleSafeJornadaChange = (idx, field, value) => {
    setJornadas(prev => prev.map((j, i) => i === idx ? { ...j, [field]: value } : j))
  }

  const resetForm = () => {
    setName('')
    setVenue('')
    setNumCourts(1)
    setMatchDuration(15)
    setMatchPlayTime(10)
    setStrictScheduleMode(false)
    setMonitorRefreshTime(3)
    setGroupLogicId(String(groupLogics.find(l => l.isDefault)?.id || ''))
    setJornadas([{ date: '', startTime: '09:00', endTime: '14:00', matchDuration: 15, matchPlayTime: 10, restRoundsBetweenMatches: 1 }])
    setEditingId(null)
    setError(null)
    setShowForm(false)
  }

  const resetCloneForm = () => {
    setShowCloneModal(false)
    setShowCloneForm(false)
    setSourceTournamentId('')
    setCloneOptions({
      params: true,
      info: true,
      categories: true,
      teams: false,
      players: false,
      officials: true
    })
    setName('')
    setError(null)
  }

  const handleClone = async (e) => {
    e.preventDefault()
    if (!name.trim() || !sourceTournamentId) return
    setCreating(true)
    setError(null)
    try {
      const t = await cloneTournament(sourceTournamentId, { newName: name, options: cloneOptions })
      setTournaments(prev => [t, ...prev])
      resetCloneForm()
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError(null)
    try {
      if (!groupLogicId) throw new Error('Debes seleccionar una lógica de grupos.')
      const normalizedJornadas = jornadas.map(j => ({
        ...j,
        date: normalizeDateInput(j.date),
        startTime: normalizeTimeInput(j.startTime),
        endTime: normalizeTimeInput(j.endTime),
      }))
      if (normalizedJornadas.some(j => !isValidDisplayDate(j.date))) throw new Error('Todas las jornadas deben tener una fecha válida con formato DD-MM-YYYY.')
      if (normalizedJornadas.some(j => !isValidTime(j.startTime) || !isValidTime(j.endTime))) throw new Error('Todas las horas deben tener formato HH:MM.')
      
      // Validar que la hora de fin sea posterior a la de inicio
      for (const j of normalizedJornadas) {
        if (j.startTime >= j.endTime) {
          throw new Error(`En la jornada del día ${j.date}, la hora de fin (${j.endTime}) debe ser posterior a la de inicio (${j.startTime})`)
        }
      }

      // Validar que la duración de ronda no sea menor que el tiempo de juego
      if (matchDuration < matchPlayTime) {
        throw new Error(`La duración de la ronda (${matchDuration} min) no puede ser inferior al tiempo de juego del partido (${matchPlayTime} min)`)
      }
      
      if (editingId) {
        const updated = await updateTournament(editingId, { name, venue, numCourts, matchDuration, matchPlayTime, strictScheduleMode, monitorRefreshTime, groupLogicId: parseInt(groupLogicId), jornadas: normalizedJornadas.map(j => ({ ...j, date: displayDateToIso(j.date) })) })
        setTournaments(prev => prev.map(t => t.id === editingId ? { ...t, ...updated } : t))
        if (selected?.id === editingId) onSelect({ ...selected, ...updated })
        resetForm()
      } else {
        const t = await createTournament({ name, venue, numCourts, matchDuration, matchPlayTime, strictScheduleMode, monitorRefreshTime, groupLogicId: parseInt(groupLogicId), jornadas: normalizedJornadas.map(j => ({ ...j, date: displayDateToIso(j.date) })) })
        setTournaments(prev => [t, ...prev])
        resetForm()
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleEditClick = (t, e) => {
    e.stopPropagation()
    setEditingId(t.id)
    setName(t.name)
    setVenue(t.venue || '')
    setNumCourts(t.numCourts || 1)
    setMatchDuration(t.matchDuration || 15)
    setMatchPlayTime(t.matchPlayTime || 10)
    setStrictScheduleMode(!!t.strictScheduleMode)
    setMonitorRefreshTime(t.monitorRefreshTime || 3)
    setGroupLogicId(t.groupLogicId ? String(t.groupLogicId) : String(groupLogics.find(l => l.isDefault)?.id || ''))
    if (t.jornadas && t.jornadas.length > 0) {
      const sorted = [...t.jornadas].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });
      setJornadas(sorted.map(j => ({
        date: toDisplayDate(j.date),
        startTime: j.startTime,
        endTime: j.endTime,
        matchDuration: j.matchDuration ?? t.matchDuration ?? 15,
        matchPlayTime: j.matchPlayTime ?? t.matchPlayTime ?? 10,
        restRoundsBetweenMatches: j.restRoundsBetweenMatches ?? 1
      })))
    } else {
      setJornadas([{ date: '', startTime: '09:00', endTime: '14:00', matchDuration: t.matchDuration || 15, matchPlayTime: t.matchPlayTime || 10, restRoundsBetweenMatches: 1 }])
    }
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar torneo y todos sus datos?')) return
    try {
      await deleteTournament(id)
      setTournaments(prev => prev.filter(t => t.id !== id))
      if (selected?.id === id) onSelect(null)
    } catch (e) {
      setError(e.message)
    }
  }

  const handleActivate = async (t, e) => {
    e.stopPropagation()
    try {
      const active = !t.active
      await activateTournament(t.id, active)
      // Si activamos este, desactivamos todos los demás localmente
      setTournaments(prev => prev.map(item => ({
        ...item,
        active: item.id === t.id ? active : (active ? false : item.active)
      })))
      if (selected?.id === t.id) onSelect({ ...selected, active })
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button 
          className={`btn ${showForm || showCloneModal || showCloneForm ? 'btn-secondary' : 'btn-blue'} btn-sm`}
          onClick={() => {
            if (showForm || showCloneModal || showCloneForm || editingId) {
              resetForm();
              resetCloneForm();
            } else {
              setShowCloneModal(true);
            }
          }}
        >
          { (showForm || showCloneModal || showCloneForm) ? '✕ Cancelar' : '➕ Nuevo Torneo'}
        </button>
        {extraActions}
        </div>
      </div>

      {showCloneModal && (
        <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center', padding: '2rem', border: '1px solid var(--primary)', background: 'rgba(59, 130, 246, 0.05)' }}>
          <div className="card-title">✨ Crear Nuevo Torneo</div>
          <p className="text-muted">¿Cómo quieres configurar el nuevo evento?</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', minWidth: '180px' }} onClick={() => { resetForm(); setShowCloneModal(false); setGroupLogicId(String(groupLogics.find(l => l.isDefault)?.id || '')); setShowForm(true); }}>
              🆕 Desde Cero
            </button>
            <button className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', minWidth: '180px' }} onClick={() => { setShowCloneModal(false); setShowCloneForm(true); }}>
              👥 Copiar Existente
            </button>
          </div>
        </div>
      )}

      {showCloneForm && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
          <div className="card-title">👥 Copiar Torneo Existente</div>
          <form onSubmit={handleClone}>
            <div className="form-row" style={{ marginBottom: '1.5rem' }}>
              <div className="form-group" style={{ flex: 1.5 }}>
                <label className="form-label">Nombre del Nuevo Torneo *</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: SPBASKET Verano 2026" required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Torneo de Origen *</label>
                <select className="form-input" value={sourceTournamentId} onChange={e => setSourceTournamentId(e.target.value)} required>
                  <option value="">Selecciona un torneo...</option>
                  {tournaments.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Elementos a copiar:</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={cloneOptions.params} onChange={e => setCloneOptions({...cloneOptions, params: e.target.checked})} />
                  <span>⚙️ Parámetros (fechas, pistas...)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={cloneOptions.info} onChange={e => setCloneOptions({...cloneOptions, info: e.target.checked})} />
                  <span>ℹ️ Información General</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={cloneOptions.categories} onChange={e => setCloneOptions({...cloneOptions, categories: e.target.checked})} />
                  <span>🏷️ Categorías</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={cloneOptions.teams} onChange={e => setCloneOptions({...cloneOptions, teams: e.target.checked})} />
                  <span>👥 Equipos</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={cloneOptions.players} onChange={e => setCloneOptions({...cloneOptions, players: e.target.checked})} />
                  <span>👤 Jugadores</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={cloneOptions.officials} onChange={e => setCloneOptions({...cloneOptions, officials: e.target.checked})} />
                  <span>⚖️ Oficiales</span>
                </label>
              </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            <div className="flex-gap">
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? '⏳ Copiando...' : '✓ Iniciar Copia'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetCloneForm}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>⚠️ Error: {error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title">🏆 {editingId ? 'Editar Torneo' : 'Nuevo Torneo'}</div>
          <form onSubmit={handleCreateOrUpdate}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 3 }}>
                <label className="form-label">Nombre del Torneo *</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="SPBASKET 2026" required />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Sede / Ubicación</label>
                <input className="form-input" value={venue} onChange={e => setVenue(e.target.value)} placeholder="Pabellón Municipal" />
              </div>
              <div className="form-group" style={{ flex: 0.8 }}>
                <label className="form-label">Pistas</label>
                <input 
                  className="form-input" 
                  style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 700, textAlign: 'center' }} 
                  value={editingId ? (tournaments.find(t => t.id === editingId)?.courts?.length || 0) : 0} 
                  readOnly 
                />
              </div>
            </div>

            <div className="form-row" style={{ marginTop: '1rem' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Duración Ronda (min)</label>
                <input className="form-input" type="number" min="1" max="60" value={matchDuration} onChange={e => setMatchDuration(parseInt(e.target.value) || 15)} title="Tiempo total asignado a cada partido en el calendario" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Tiempo Juego (min)</label>
                <input className="form-input" type="number" min="1" max="60" value={matchPlayTime} onChange={e => setMatchPlayTime(parseInt(e.target.value) || 10)} title="Tiempo efectivo que aparecerá en el marcador" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Refresco Monitor (s)</label>
                <input className="form-input" type="number" min="2" max="3600" value={monitorRefreshTime} onChange={e => setMonitorRefreshTime(parseInt(e.target.value) || 3)} title="Tiempo de refresco de datos y rotación de publicidad en el monitor" />
              </div>
              <div className="form-group" style={{ flex: 1.4 }}>
                <label className="form-label">Lógica de Grupos</label>
                <select className="form-input" value={groupLogicId} onChange={e => setGroupLogicId(e.target.value)} required>
                  {groupLogics.map(logic => (
                    <option key={logic.id} value={logic.id}>
                      {logic.name}{logic.isDefault ? ' (POR DEFECTO)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <label className="form-label" style={{ marginBottom: '0.2rem', fontSize: '0.75rem' }}>Validación Estricta</label>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={strictScheduleMode} 
                      onChange={e => setStrictScheduleMode(e.target.checked)} 
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>📅 Jornadas (Franjas horarias)</label>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddJornada}>+ Añadir Día</button>
              </div>
              {jornadas.map((j, idx) => (
                <div key={idx} className="form-row" style={{ alignItems: 'flex-end', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '4px' }}>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Día</label>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <input className="form-input" type="text" value={j.date} onChange={e => handleSafeJornadaChange(idx, 'date', e.target.value)} onBlur={e => handleSafeJornadaChange(idx, 'date', normalizeDateInput(e.target.value))} placeholder="DD-MM-YYYY" inputMode="numeric" required />
                      <input type="date" value={isValidDisplayDate(j.date) ? displayDateToIso(j.date) : ''} onChange={e => handleSafeJornadaChange(idx, 'date', toDisplayDate(e.target.value))} tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }} />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={e => { const input = e.currentTarget.previousElementSibling; if (input?.showPicker) input.showPicker(); else input?.click(); }} title="Seleccionar fecha">📅</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Inicio</label>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <input className="form-input" type="text" value={j.startTime} onChange={e => handleSafeJornadaChange(idx, 'startTime', e.target.value)} onBlur={e => handleSafeJornadaChange(idx, 'startTime', normalizeTimeInput(e.target.value))} placeholder="HH:MM" inputMode="numeric" required />
                      <input type="time" value={isValidTime(j.startTime) ? j.startTime : ''} onChange={e => handleSafeJornadaChange(idx, 'startTime', e.target.value)} tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }} />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={e => { const input = e.currentTarget.previousElementSibling; if (input?.showPicker) input.showPicker(); else input?.click(); }} title="Seleccionar hora de inicio">🕒</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Fin</label>
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                      <input className="form-input" type="text" value={j.endTime} onChange={e => handleSafeJornadaChange(idx, 'endTime', e.target.value)} onBlur={e => handleSafeJornadaChange(idx, 'endTime', normalizeTimeInput(e.target.value))} placeholder="HH:MM" inputMode="numeric" required />
                      <input type="time" value={isValidTime(j.endTime) ? j.endTime : ''} onChange={e => handleSafeJornadaChange(idx, 'endTime', e.target.value)} tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }} />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={e => { const input = e.currentTarget.previousElementSibling; if (input?.showPicker) input.showPicker(); else input?.click(); }} title="Seleccionar hora de fin">🕒</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Rondas descanso</label>
                    <input className="form-input" type="number" min="0" value={j.restRoundsBetweenMatches ?? 1} onChange={e => handleSafeJornadaChange(idx, 'restRoundsBetweenMatches', e.target.value)} />
                  </div>
                  {jornadas.length > 1 && (
                    <button type="button" className="btn btn-red btn-sm" style={{ marginBottom: '0.2rem' }} onClick={() => handleRemoveJornada(idx)}>🗑</button>
                  )}
                </div>
              ))}
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            <div className="flex-gap">
              <button type="submit" className="btn btn-primary" disabled={creating}>
                {creating ? '⏳ Procesando...' : editingId ? '✓ Actualizar Torneo' : '+ Crear Torneo'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancelar Edición
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {loading ? <div className="spinner" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {tournaments.length === 0 && (
            <div className="card text-center text-muted">No hay torneos. Crea el primero ↑</div>
          )}
          {tournaments.map((t, i) => (
            <div
              key={t.id}
              className="card"
              onClick={() => onSelect(t)}
              style={{
                cursor: 'pointer',
                border: selected?.id === t.id ? `2px solid ${COLORS[i % COLORS.length]}` : '1px solid var(--border)',
                transition: 'all 0.15s',
              }}
            >
              <div className="flex-between">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{t.name}</div>
                  <div className="text-muted" style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                    {t.jornadas?.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {t.jornadas.map((j, idx) => (
                          <span key={idx} className="badge badge-pending" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                            📅 {j.date ? j.date.split('-').reverse().join('-') : ''} ({j.startTime}-{j.endTime})
                          </span>
                        ))}
                      </div>
                    ) : (
                      t.date && `📅 ${t.date.split('-').reverse().join('-')}`
                    )}
                    <div style={{ marginTop: '0.4rem' }}>
                      {t.venue && `📍 ${t.venue} · `}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '4px', opacity: 0.8 }}>
                        <rect x="2" y="4" width="20" height="16" rx="1" />
                        <path d="M12 4v16" />
                        <circle cx="12" cy="12" r="3" />
                        <path d="M2 9h3v6H2z" />
                        <path d="M22 9h-3v6h3z" />
                      </svg>
                      {t.courts?.length || 0} pistas · 
                      {t.categories?.length || 0} categorías · 
                      {t.categories?.reduce((s, c) => s + (c.teams?.length || 0), 0) || 0} equipos · 
                      <span title="Total de partidos programados">⚽ {t.totalMatches || 0} partidos</span>
                      {t.pendingMatches > 0 ? (
                        <span className="text-warning" style={{ fontWeight: 600, marginLeft: '4px' }} title="Partidos pendientes por jugar">
                          ({t.pendingMatches} pendientes)
                        </span>
                      ) : t.totalMatches > 0 ? (
                        <span className="text-green" style={{ fontWeight: 600, marginLeft: '4px' }}>
                          (Completado)
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex-gap">
                  <button
                    className={`btn btn-sm ${t.active ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={(e) => handleActivate(t, e)}
                    title={t.active ? "Torneo Activo (Marcador Digital)" : "Marcar como Activo para Marcador"}
                    style={{ position: 'relative' }}
                  >
                    {t.active ? '🟢 ACTIVO' : '⚪ INACTIVO'}
                  </button>
                  <a 
                    href={`/public/${t.id}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-primary btn-sm" 
                    title="Abrir vista pública del evento"
                    onClick={(e) => e.stopPropagation()}
                    style={{ textDecoration: 'none' }}
                  >
                    🌐
                  </a>
                  {t._count?.scheduleSlots > 0 && (
                    <span title="Torneo bloqueado por calendario activo" style={{ fontSize: '1.2rem', cursor: 'help' }}>🔒</span>
                  )}
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={(e) => handleEditClick(t, e)} 
                    title={t._count?.scheduleSlots > 0 ? "No se puede editar: partidos programados" : "Editar torneo"}
                    disabled={t._count?.scheduleSlots > 0}
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn btn-red btn-sm" 
                    onClick={(e) => handleDelete(t.id, e)} 
                    title={t._count?.scheduleSlots > 0 ? "No se puede eliminar: partidos programados" : "Eliminar torneo"}
                    disabled={t._count?.scheduleSlots > 0}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
