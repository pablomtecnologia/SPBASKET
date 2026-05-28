import { useEffect, useRef, useState } from 'react'
import TournamentList from './components/TournamentList'
import TournamentManager from './components/TournamentManager'
import ScheduleManager from './components/ScheduleManager'
import PlayerDirectory from './components/PlayerDirectory'
import TournamentInfo from './components/TournamentInfo'
import OfficialManager from './components/OfficialManager'
import MatchLogsManager from './components/MatchLogsManager'
import CourtManager from './components/CourtManager'
import GroupLogicManager from './components/GroupLogicManager'
import UserManager from './components/UserManager'
import ErrorBoundary from './components/ErrorBoundary'
import TournamentBranding, { getTournamentHeaderLogo } from './components/TournamentBranding'
import { getTournamentBackgroundLogo } from './utils/tournamentBranding'
import { AUTH_EXPIRED_EVENT, getMe, getTournament, login, logout, updateTournamentTimer } from './api'

const TABS = [
  { id: 'torneos', label: 'Torneos (F6)' },
  { id: 'torneo', label: 'Categorias (F7)' },
  { id: 'calendario', label: 'Calendario (F8)' },
  { id: 'jugadores', label: 'Jugadores (F9)' },
  { id: 'oficiales', label: 'Oficiales (F10)' },
  { id: 'logs', label: 'Registro Actas (F11)' },
  { id: 'pistas', label: 'Pistas (F12)' },
  { id: 'info', label: 'Informacion' },
  { id: 'usuarios', label: 'Usuarios' },
]

function buildAppUrl(path) {
  const cleanPath = String(path || '').startsWith('/') ? String(path || '') : `/${String(path || '')}`
  const pathname = window.location.pathname || '/'
  const adminMarker = '/gestion-privada-penguin'
  const markerIndex = pathname.indexOf(adminMarker)
  const basePath = markerIndex >= 0 ? pathname.slice(0, markerIndex) : ''
  return `${window.location.origin}${basePath}${cleanPath}`
}

export default function AdminApp() {
  const [authLoading, setAuthLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [authError, setAuthError] = useState('')
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [tab, setTab] = useState('torneos')
  const [subTab, setSubTab] = useState('equipos')
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [scheduleActive, setScheduleActive] = useState(false)
  const [tournamentsMaintenanceMode, setTournamentsMaintenanceMode] = useState('tournaments')
  const [timeLeft, setTimeLeft] = useState(600)
  const [timerRunning, setTimerRunning] = useState(false)
  const [localMatchPlayTime, setLocalMatchPlayTime] = useState(10)
  const timeLeftRef = useRef(timeLeft)
  const timerRunningRef = useRef(timerRunning)
  const currentUserRef = useRef(currentUser)
  const initialAuthCheckDoneRef = useRef(false)

  useEffect(() => { timeLeftRef.current = timeLeft }, [timeLeft])
  useEffect(() => { timerRunningRef.current = timerRunning }, [timerRunning])
  useEffect(() => { currentUserRef.current = currentUser }, [currentUser])

  useEffect(() => {
    getMe()
      .then(({ user }) => {
        setCurrentUser(user)
        setAuthError('')
      })
      .catch(() => {
        setCurrentUser(null)
        setAuthError('')
      })
      .finally(() => {
        initialAuthCheckDoneRef.current = true
        setAuthLoading(false)
      })
  }, [])

  useEffect(() => {
    const handleAuthExpired = (event) => {
      setCurrentUser(null)
      setSelectedTournament(null)
      setTab('torneos')
      setTournamentsMaintenanceMode('tournaments')
      if (!initialAuthCheckDoneRef.current && !currentUserRef.current) {
        setAuthError('')
        return
      }
      setAuthError(event?.detail?.message || 'Tu sesión ha caducado por inactividad.')
    }
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired)
  }, [])

  useEffect(() => {
    if (!selectedTournament) return
    const initialTime = selectedTournament.timerRemainingSeconds ?? (selectedTournament.matchPlayTime * 60)
    const initialRunning = selectedTournament.timerRunning ?? false
    setTimeLeft(initialTime)
    setTimerRunning(initialRunning)
    setLocalMatchPlayTime(selectedTournament.matchPlayTime || 10)
  }, [selectedTournament?.id])

  useEffect(() => {
    if (!selectedTournament || !currentUser) return
    const syncTimer = async () => {
      try {
        await updateTournamentTimer(selectedTournament.id, timeLeftRef.current, timerRunningRef.current)
      } catch (e) {
        console.error('Error sincronizando timer con backend', e)
      }
    }
    syncTimer()
    const interval = setInterval(syncTimer, timerRunning ? 1000 : 5000)
    return () => clearInterval(interval)
  }, [timerRunning, selectedTournament?.id, currentUser?.id])

  useEffect(() => {
    if (!selectedTournament || !currentUser) return
    const timeout = setTimeout(() => {
      updateTournamentTimer(selectedTournament.id, timeLeft, timerRunning).catch(e => console.error('Error sync manual', e))
    }, 100)
    return () => clearTimeout(timeout)
  }, [timeLeft, selectedTournament?.id, currentUser?.id])

  useEffect(() => {
    let interval
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false)
    }
    return () => clearInterval(interval)
  }, [timerRunning, timeLeft])

  useEffect(() => {
    if (!timerRunning) setTimeLeft(localMatchPlayTime * 60)
  }, [localMatchPlayTime])

  useEffect(() => {
    const handleKeyDown = (e) => {
      const keyMap = {
        F1: { tab: 'torneo', sub: 'equipos' },
        F2: { tab: 'torneo', sub: 'competicion' },
        F3: { tab: 'torneo', sub: 'partidos' },
        F4: { tab: 'torneo', sub: 'clasificacion' },
        F6: { tab: 'torneos' },
        F7: { tab: 'torneo' },
        F8: { tab: 'calendario' },
        F9: { tab: 'jugadores' },
        F10: { tab: 'oficiales' },
        F11: { tab: 'logs' },
        F12: { tab: 'pistas' }
      }
      const action = keyMap[e.key]
      if (!action) return
      const needsTournament = ['F1', 'F2', 'F3', 'F4', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(e.key)
      if (needsTournament && !selectedTournament) return
      e.preventDefault()
      setTab(action.tab)
      if (action.sub) setSubTab(action.sub)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedTournament])

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    try {
      const { user } = await login(credentials.username, credentials.password)
      setCurrentUser(user)
      setCredentials({ username: '', password: '' })
    } catch (e2) {
      setAuthError(e2.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    setCurrentUser(null)
    setSelectedTournament(null)
    setTab('torneos')
    setTournamentsMaintenanceMode('tournaments')
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSelectTournament = async (tournament) => {
    if (!tournament) return setSelectedTournament(null)
    try {
      const freshTournament = await getTournament(tournament.id)
      setSelectedTournament(freshTournament)
      setScheduleActive(freshTournament?._count?.scheduleSlots > 0)
    } catch (e) {
      console.error('Error al seleccionar torneo:', e)
      setSelectedTournament(tournament)
      setScheduleActive(tournament?._count?.scheduleSlots > 0)
    }
    setTab('torneo')
  }

  const refreshSelectedTournament = async () => {
    if (!selectedTournament) return
    try {
      const fresh = await getTournament(selectedTournament.id)
      setSelectedTournament(fresh)
    } catch (e) {
      console.error('Error refreshing tournament', e)
    }
  }

  if (authLoading && !currentUser) {
    return <div className="spinner" style={{ margin: '4rem auto' }} />
  }

  if (!currentUser) {
    return (
      <TournamentBranding tournament={null} minHeight="100vh">
        <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="card" style={{ width: '100%', maxWidth: '460px' }}>
            <div className="card-title">Acceso Administracion</div>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Usuario</label>
                <input className="form-input" value={credentials.username} onChange={e => setCredentials(prev => ({ ...prev, username: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" value={credentials.password} onChange={e => setCredentials(prev => ({ ...prev, password: e.target.value }))} required />
              </div>
              {authError && <div className="alert alert-error">{authError}</div>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={authLoading}>
                {authLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </TournamentBranding>
    )
  }

  return (
    <TournamentBranding tournament={selectedTournament} minHeight="100vh">
      <div className="app">
        <img src={getTournamentBackgroundLogo(selectedTournament)} alt="" className="watermark" />

        <nav className="navbar">
          <div className="navbar-container">
            <div className="navbar-logo">
              <img src={getTournamentHeaderLogo(selectedTournament)} alt="" className="navbar-logo-img" />
              <span className="navbar-title">ADMIN PANEL</span>
            </div>

            {selectedTournament && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="navbar-timer" onClick={() => setTimerRunning(!timerRunning)} title="Control global de tiempo de partido">
                  <div className={`timer-nav ${timeLeft <= 60 ? 'timer-warning' : (timerRunning ? 'running' : '')}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className="timer-controls">
                    {timerRunning ? 'PAUSAR' : 'INICIAR'}
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setTimerRunning(false); setTimeLeft(localMatchPlayTime * 60) }}
                >
                  Reset
                </button>
              </div>
            )}

            <div className="navbar-actions">
              <div className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {currentUser.firstName} {currentUser.lastName1}
              </div>
              {selectedTournament && (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => window.open(buildAppUrl(`/public/${selectedTournament.id}`), '_blank')}>
                    Portal
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => window.open(buildAppUrl(`/marcador/${selectedTournament.id}`), '_blank')}>
                    Marcador
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => window.open(buildAppUrl(`/live/${selectedTournament.id}`), '_blank')}>
                    Monitor TV
                  </button>
                </>
              )}
              <button className="btn btn-red btn-sm" onClick={handleLogout}>Salir</button>
            </div>
          </div>
        </nav>

        <div className="tabs-container">
          <div className="tabs">
            {TABS.map(item => {
              if (item.id === 'usuarios' && !currentUser.isSuperAdmin) return null
              if (['info', 'torneo', 'calendario', 'jugadores', 'oficiales', 'logs', 'pistas'].includes(item.id) && !selectedTournament) return null
              return (
                <button key={item.id} className={`tab ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        <main className="main">
          <ErrorBoundary>
            {tab === 'torneos' && (
              <>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <button
                    className={`btn btn-sm ${tournamentsMaintenanceMode === 'tournaments' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTournamentsMaintenanceMode('tournaments')}
                  >
                    Mantenimiento de torneos
                  </button>
                  <button
                    className={`btn btn-sm ${tournamentsMaintenanceMode === 'group-logics' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTournamentsMaintenanceMode('group-logics')}
                  >
                    Mantenimiento de logica de grupos
                  </button>
                </div>

                {(!currentUser.isSuperAdmin || tournamentsMaintenanceMode === 'tournaments') && (
                  <TournamentList
                    onSelect={handleSelectTournament}
                    selected={selectedTournament}
                    canCreateTournaments={currentUser.isSuperAdmin}
                  />
                )}

                {tournamentsMaintenanceMode === 'group-logics' && (
                  <GroupLogicManager readOnlyGlobal={!currentUser.isSuperAdmin} />
                )}
              </>
            )}

            {tab === 'info' && selectedTournament && <TournamentInfo tournament={selectedTournament} onUpdate={setSelectedTournament} />}
            {tab === 'pistas' && selectedTournament && <CourtManager tournament={selectedTournament} scheduleActive={scheduleActive} />}
            {tab === 'torneo' && selectedTournament && (
              <TournamentManager
                tournament={selectedTournament}
                scheduleActive={scheduleActive}
                onScheduleChange={setScheduleActive}
                activeSubTab={subTab}
                onSubTabChange={setSubTab}
                onRefreshTournament={refreshSelectedTournament}
              />
            )}
            {tab === 'calendario' && selectedTournament && (
              <ScheduleManager
                tournament={selectedTournament}
                onScheduleChange={setScheduleActive}
                timerState={{ localMatchPlayTime, setLocalMatchPlayTime, timeLeft, setTimeLeft, timerRunning, setTimerRunning }}
              />
            )}
            {tab === 'jugadores' && selectedTournament && <PlayerDirectory tournament={selectedTournament} />}
            {tab === 'oficiales' && selectedTournament && <OfficialManager tournament={selectedTournament} onTournamentUpdate={setSelectedTournament} />}
            {tab === 'logs' && selectedTournament && <MatchLogsManager tournamentId={selectedTournament.id} />}
            {tab === 'usuarios' && currentUser.isSuperAdmin && <UserManager currentUser={currentUser} />}
          </ErrorBoundary>
        </main>

        <footer className="footer">GESTOR TORNEOS BASKET 3x3 @ JON AMAYUELAS CELAYA 2026</footer>
      </div>
    </TournamentBranding>
  )
}
