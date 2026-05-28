import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as api from '../api'
import TournamentBranding from './TournamentBranding'
import { getTournamentHeaderLogo } from '../utils/tournamentBranding'

const ACTA_SESSION_STORAGE_KEY = 'spbasket-acta-session-key'

export default function DigitalScoreboard() {
  const navigate = useNavigate()
  const { tournamentId: routeTournamentId } = useParams()
  const [activeTournament, setActiveTournament] = useState(null)
  const [officials, setOfficials] = useState([])
  const [selectedOfficial, setSelectedOfficial] = useState('')
  const [selectedCourt, setSelectedCourt] = useState('')
  const [activeMatch, setActiveMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [courts, setCourts] = useState([])
  const [isSyncing, setIsSyncing] = useState(false)

  const selectedOfficialData = officials.find(o => `${o.firstName} ${o.lastName}` === selectedOfficial) || null
  const availableCourts = activeTournament?.assignOfficialsToCourt
    ? (selectedOfficialData?.assignedCourt ? [selectedOfficialData.assignedCourt] : [])
    : courts

  useEffect(() => {
    loadInitialData()
  }, [routeTournamentId])

  useEffect(() => {
    let interval
    if (activeTournament && selectedCourt) {
      loadActiveMatch()
      interval = setInterval(loadActiveMatch, 5000)
    }
    return () => clearInterval(interval)
  }, [activeTournament, selectedCourt])

  useEffect(() => {
    if (!activeTournament) return

    if (activeTournament.assignOfficialsToCourt) {
      setSelectedCourt(selectedOfficialData?.assignedCourt?.name || '')
      return
    }

    setSelectedCourt(prev => {
      if (!prev) return prev
      return courts.some(c => c.name === prev) ? prev : ''
    })
  }, [activeTournament, selectedOfficialData, courts])

  const loadInitialData = async () => {
    setLoading(true)
    setError(null)
    try {
      const tournament = routeTournamentId
        ? await api.getTournament(routeTournamentId)
        : await api.getActiveTournament()
      setActiveTournament(tournament)

      if (tournament) {
        const [officialsData, courtsData] = await Promise.all([
          api.getOfficials(tournament.id),
          api.getCourts(tournament.id)
        ])
        setOfficials(officialsData.filter(o => o.isOperational !== false))
        setCourts(courtsData)
      }
    } catch (e) {
      console.error('Error in loadInitialData:', e)
      setError(routeTournamentId ? 'No se pudo cargar el torneo indicado.' : 'Error al cargar datos. Verifica la conexión.')
    } finally {
      setLoading(false)
    }
  }

  const loadActiveMatch = async () => {
    if (!activeTournament || !selectedCourt) return
    try {
      const match = await api.getActiveMatch(activeTournament.id, selectedCourt)
      setActiveMatch(match)
    } catch (e) {
      console.error('Error loading active match:', e)
    }
  }

  const handleScoreUpdate = async (homeScore, awayScore) => {
    if (!activeMatch || isSyncing) return
    setIsSyncing(true)
    try {
      await api.updateScore(
        activeMatch.id,
        homeScore,
        awayScore,
        activeMatch.homeFouls || 0,
        activeMatch.awayFouls || 0,
        activeMatch.observations,
        activeMatch.status
      )
      setActiveMatch(prev => ({ ...prev, homeScore, awayScore }))
    } catch (e) {
      setError('Error al actualizar el marcador.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleResetScore = async () => {
    if (!activeMatch || !window.confirm('¿Reiniciar marcador a 0-0?')) return
    handleScoreUpdate(0, 0)
  }

  const handleMatchSelect = async () => {
    if (!selectedOfficial || !activeMatch) return
    setError(null)
    try {
      let sessionKey = sessionStorage.getItem(ACTA_SESSION_STORAGE_KEY)
      if (!sessionKey) {
        sessionKey = `acta-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        sessionStorage.setItem(ACTA_SESSION_STORAGE_KEY, sessionKey)
      }
      await api.joinMatch(activeMatch.id, selectedOfficial, sessionKey, selectedOfficialData?.id)
      navigate(`/marcador/acta/${activeTournament.id}/${selectedCourt}?official=${encodeURIComponent(selectedOfficial)}`)
    } catch (e) {
      console.error('Error joining match:', e)
      alert(`⚠️ ${e.message || 'No se puede entrar a este partido'}`)
    }
  }

  if (loading) return (
    <TournamentBranding tournament={activeTournament} minHeight="100vh" padding="2rem">
      <div className="scoreboard-container" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
      </div>
    </TournamentBranding>
  )

  if (error) return (
    <TournamentBranding tournament={activeTournament} minHeight="100vh" padding="2rem">
      <div className="scoreboard-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
        <img src={getTournamentHeaderLogo(activeTournament)} alt="Logo torneo" style={{ height: '72px', width: 'auto', objectFit: 'contain', margin: '0 auto 1.5rem' }} />
        <h2 style={{ color: 'var(--red)', marginBottom: '1rem' }}>⚠️ Error</h2>
        <div className="alert alert-error" style={{ display: 'inline-block', marginBottom: '1.5rem' }}>{error}</div>
        <p>Verifica que el servidor esté en marcha y vuelve a intentarlo.</p>
        <button className="btn btn-blue" onClick={loadInitialData} style={{ marginTop: '1.5rem', alignSelf: 'center' }}>🔄 Reintentar</button>
      </div>
    </TournamentBranding>
  )

  if (!activeTournament) return (
    <TournamentBranding tournament={null} minHeight="100vh" padding="2rem">
      <div className="scoreboard-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
        <img src={getTournamentHeaderLogo(null)} alt="Logo" style={{ height: '72px', width: 'auto', objectFit: 'contain', margin: '0 auto 1.5rem' }} />
        <h2 style={{ color: 'var(--accent)' }}>No hay ningún torneo activo</h2>
        <p>Contacta con la organización para activar el torneo.</p>
        <button className="btn btn-secondary" onClick={loadInitialData} style={{ marginTop: '1.5rem', alignSelf: 'center' }}>🔄 Comprobar de nuevo</button>
      </div>
    </TournamentBranding>
  )

  return (
    <TournamentBranding tournament={activeTournament} minHeight="100vh" padding="1rem">
      <div style={{ minHeight: '100vh', color: 'white' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <img src={getTournamentHeaderLogo(activeTournament)} alt="Logo torneo" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ color: 'var(--accent)', margin: 0, textTransform: 'uppercase', letterSpacing: '2px' }}>{activeTournament.name}</h2>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Marcador Digital para Oficiales</div>
          </div>
        </header>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Oficial de Mesa</label>
              <select className="form-input" value={selectedOfficial} onChange={e => setSelectedOfficial(e.target.value)}>
                <option value="">Selecciona tu nombre...</option>
                {officials.map(o => (
                  <option key={o.id} value={`${o.firstName} ${o.lastName}`}>
                    {o.firstName} {o.lastName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Pista</label>
              <select
                className="form-input"
                value={selectedCourt}
                onChange={e => setSelectedCourt(e.target.value)}
                disabled={activeTournament?.assignOfficialsToCourt ? (!selectedOfficial || availableCourts.length === 0) : courts.length === 0}
              >
                <option value="">
                  {activeTournament?.assignOfficialsToCourt
                    ? (!selectedOfficial ? 'Selecciona oficial...' : availableCourts.length === 0 ? 'Sin pista asignada' : 'Pista asignada')
                    : courts.length === 0 ? 'Cargando pistas...' : 'Selecciona pista...'}
                </option>
                {availableCourts.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              {activeTournament?.assignOfficialsToCourt && (
                <p style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '0.5rem' }}>
                  La asignación de oficiales a pista está activada para este torneo.
                </p>
              )}
              {!activeTournament?.assignOfficialsToCourt && courts.length === 0 && !loading && (
                <p style={{ fontSize: '0.8rem', color: '#fb923c', marginTop: '0.5rem' }}>
                  ⚠️ No se han encontrado pistas configuradas en este torneo.
                </p>
              )}
              {activeTournament?.assignOfficialsToCourt && selectedOfficial && availableCourts.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: '#fb923c', marginTop: '0.5rem' }}>
                  Este oficial no tiene una pista asignada en mantenimiento.
                </p>
              )}
            </div>
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.2rem' }}
              disabled={!selectedOfficial || !selectedCourt || !activeMatch}
              onClick={handleMatchSelect}
            >
              🚀 ABRIR ACTA DIGITAL
            </button>
          </div>
        </div>

        <div className="card text-center" style={{ padding: '2rem', opacity: 0.7 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
          <p>Al pulsar el botón se abrirá una <strong>nueva ventana</strong> con el diseño oficial del acta para anotar el partido.</p>
        </div>

        <footer style={{
          marginTop: '3rem',
          textAlign: 'center',
          fontSize: '0.85rem',
          opacity: 0.6,
          borderTop: '1px solid var(--border)',
          paddingTop: '1.5rem',
          color: 'var(--text-secondary)',
          fontWeight: '500'
        }}>
          GESTOR TORNEOS BASKET 3x3 @ JON AMAYUELAS CELAYA 2026
        </footer>
      </div>
    </TournamentBranding>
  )
}
