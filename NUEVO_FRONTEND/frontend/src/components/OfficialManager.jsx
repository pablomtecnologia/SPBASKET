import { useEffect, useState } from 'react'
import { createOfficial, deleteOfficial, getCourts, getOfficials, updateOfficial, updateTournament } from '../api'

export default function OfficialManager({ tournament, onTournamentUpdate }) {
  const [officials, setOfficials] = useState([])
  const [courts, setCourts] = useState([])
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [assignOfficialsToCourt, setAssignOfficialsToCourt] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingAssignMode, setSavingAssignMode] = useState(false)
  const [updatingOfficialId, setUpdatingOfficialId] = useState(null)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  useEffect(() => {
    if (tournament?.id) load()
  }, [tournament?.id])

  useEffect(() => {
    setAssignOfficialsToCourt(!!tournament?.assignOfficialsToCourt)
  }, [tournament?.assignOfficialsToCourt])

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const [officialsData, courtsData] = await Promise.all([
        getOfficials(tournament.id),
        getCourts(tournament.id)
      ])
      setOfficials(officialsData)
      setCourts(courtsData)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    try {
      const newOfficial = await createOfficial(tournament.id, { firstName, lastName, isOperational: true, assignedCourtId: null })
      setOfficials(prev => [...prev, newOfficial])
      setFirstName('')
      setLastName('')
      setShowCreateForm(false)
      setInfo('Oficial registrado correctamente')
    } catch (e) {
      setError(e.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este oficial?')) return
    setError(null)
    setInfo(null)
    try {
      await deleteOfficial(tournament.id, id)
      setOfficials(prev => prev.filter(o => o.id !== id))
      setInfo('Oficial eliminado')
    } catch (e) {
      setError(e.message)
    }
  }

  const handleOperationalToggle = async (official, checked) => {
    setError(null)
    setInfo(null)
    setUpdatingOfficialId(official.id)
    try {
      const updated = await updateOfficial(tournament.id, official.id, { isOperational: checked })
      setOfficials(prev => prev.map(item => item.id === official.id ? updated : item))
      setInfo(`Estado actualizado para ${official.firstName} ${official.lastName}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setUpdatingOfficialId(null)
    }
  }

  const handleAssignedCourtChange = async (official, assignedCourtId) => {
    setError(null)
    setInfo(null)
    setUpdatingOfficialId(official.id)
    try {
      const updated = await updateOfficial(tournament.id, official.id, { assignedCourtId: assignedCourtId || null })
      setOfficials(prev => prev.map(item => item.id === official.id ? updated : item))
      setInfo(`Pista asignada actualizada para ${official.firstName} ${official.lastName}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setUpdatingOfficialId(null)
    }
  }

  const handleAssignOfficialsToCourtToggle = async (checked) => {
    setError(null)
    setInfo(null)
    setSavingAssignMode(true)
    try {
      const updatedTournament = await updateTournament(tournament.id, { assignOfficialsToCourt: checked })
      setAssignOfficialsToCourt(checked)
      if (checked) {
        setOfficials(prev => prev.map(item => ({
          ...item,
          assignedCourtId: null,
          assignedCourt: null
        })))
      }
      onTournamentUpdate?.(updatedTournament)
      setInfo(`Asignación de oficiales a pista ${checked ? 'activada' : 'desactivada'}`)
    } catch (e) {
      setAssignOfficialsToCourt(!checked)
      setError(e.message)
    } finally {
      setSavingAssignMode(false)
    }
  }

  if (loading) return <div className="spinner" />

  return (
    <div className="animate-in">
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title">Gestión de Oficiales de Mesa</div>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          Registra a las personas autorizadas para manejar los marcadores digitales de los partidos.
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: showCreateForm ? '1rem' : 0 }}>
          <button
            type="button"
            className={`btn ${showCreateForm ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => {
              setShowCreateForm(prev => !prev)
              setFirstName('')
              setLastName('')
              setError(null)
            }}
          >
            {showCreateForm ? 'Cancelar alta' : 'Añadir oficial'}
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: savingAssignMode ? 'wait' : 'pointer', opacity: savingAssignMode ? 0.7 : 1 }}>
            <span style={{ fontWeight: 600 }}>Asignar oficiales a pista</span>
            <input
              type="checkbox"
              checked={assignOfficialsToCourt}
              disabled={savingAssignMode}
              onChange={e => {
                const checked = e.target.checked
                setAssignOfficialsToCourt(checked)
                handleAssignOfficialsToCourtToggle(checked)
              }}
            />
          </label>
        </div>

        {showCreateForm && (
          <form onSubmit={handleSubmit} className="form-row" style={{ alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Nombre</label>
              <input
                className="form-input"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Ej: Juan"
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Apellidos</label>
              <input
                className="form-input"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Ej: Pérez"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Guardar oficial</button>
          </form>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {info && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{info}</div>}

      <div className="card">
        <div className="card-title">Lista de Oficiales</div>
        {officials.length === 0 ? (
          <p className="text-muted text-center" style={{ padding: '2rem' }}>No hay oficiales registrados.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Nombre y Apellidos</th>
                <th>Operativo</th>
                <th>Pista asignada</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {officials.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600 }}>{o.firstName} {o.lastName}</td>
                  <td>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: updatingOfficialId === o.id ? 'wait' : 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={o.isOperational !== false}
                        disabled={updatingOfficialId === o.id}
                        onChange={e => handleOperationalToggle(o, e.target.checked)}
                      />
                      <span style={{ fontWeight: 600 }}>
                        {o.isOperational !== false ? 'Sí' : 'No'}
                      </span>
                    </label>
                  </td>
                  <td>
                    <select
                      className="form-input"
                      value={assignOfficialsToCourt && o.isOperational !== false ? (o.assignedCourtId || '') : ''}
                      disabled={!assignOfficialsToCourt || updatingOfficialId === o.id || o.isOperational === false}
                      onChange={e => handleAssignedCourtChange(o, e.target.value)}
                      style={{ minWidth: '180px', opacity: (!assignOfficialsToCourt || o.isOperational === false) ? 0.65 : 1 }}
                    >
                      <option value="">
                        {assignOfficialsToCourt
                          ? (o.isOperational === false ? 'Oficial no operativo' : 'Sin asignar...')
                          : 'No aplica'}
                      </option>
                      {courts.map(court => (
                        <option key={court.id} value={court.id}>{court.name}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(o.id)}
                      className="btn btn-red btn-sm"
                      title="Eliminar oficial"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
