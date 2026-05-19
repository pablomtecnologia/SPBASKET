import { useState, useEffect, useCallback, useRef } from 'react'
import TournamentList from './components/TournamentList'
import TournamentManager from './components/TournamentManager'
import ScheduleManager from './components/ScheduleManager'
import PlayerDirectory from './components/PlayerDirectory'
import TournamentInfo from './components/TournamentInfo'
import OfficialManager from './components/OfficialManager'
import MatchLogsManager from './components/MatchLogsManager'
import CourtManager from './components/CourtManager'
import GroupLogicManager from './components/GroupLogicManager'
import ErrorBoundary from './components/ErrorBoundary'
import TournamentBranding, { getTournamentHeaderLogo } from './components/TournamentBranding'
import { getTournamentBackgroundLogo } from './utils/tournamentBranding'

import { getTournament, updateTournamentTimer } from './api'

const TABS = [
  { id: 'torneos', label: '🏆 Torneos (F6)' },
  { id: 'torneo', label: '👥 Categorías (F7)' },
  { id: 'calendario', label: '📅 Calendario (F8)' },
  { id: 'jugadores', label: '⛹️ Jugadores (F9)' },
  { id: 'oficiales', label: '🤝 Oficiales (F10)' },
  { id: 'logs', label: '📜 Registro Actas (F11)' },
  { id: 'pistas', label: '🏟️ Pistas (F12)' },
  { id: 'info', label: 'ℹ️ Información' },
]

export default function AdminApp() {
  const [tab, setTab] = useState('torneos')
  const [subTab, setSubTab] = useState('equipos')
  const [selectedTournament, setSelectedTournament] = useState(null)
  const [scheduleActive, setScheduleActive] = useState(false)
  const [showGroupLogicManager, setShowGroupLogicManager] = useState(false)

  // Timer/Clock
  const [timeLeft, setTimeLeft] = useState(600)
  const [timerRunning, setTimerRunning] = useState(false)
  const [localMatchPlayTime, setLocalMatchPlayTime] = useState(10)

  // Refs para evitar "stale closures" en los intervalos de sincronización
  const timeLeftRef = useRef(timeLeft)
  const timerRunningRef = useRef(timerRunning)

  useEffect(() => { timeLeftRef.current = timeLeft }, [timeLeft])
  useEffect(() => { timerRunningRef.current = timerRunning }, [timerRunning])

  // Sincronizar estado inicial del timer desde el backend al cargar/cambiar torneo
  useEffect(() => {
    if (selectedTournament) {
      const initialTime = selectedTournament.timerRemainingSeconds ?? (selectedTournament.matchPlayTime * 60)
      const initialRunning = selectedTournament.timerRunning ?? false
      setTimeLeft(initialTime)
      setTimerRunning(initialRunning)
      setLocalMatchPlayTime(selectedTournament.matchPlayTime || 10)
    }
  }, [selectedTournament?.id])

  // Sincronizar con el backend periódicamente o al cambiar estado
  useEffect(() => {
    if (!selectedTournament) return

    const syncTimer = async () => {
      try {
        // En cada tick de sincronización (cada segundo), enviamos el valor exacto al backend
        await updateTournamentTimer(selectedTournament.id, timeLeftRef.current, timerRunningRef.current)
      } catch (e) {
        console.error("Error sincronizando timer con backend", e)
      }
    }

    // Sincronizar inmediatamente al cambiar play/pause
    syncTimer()

    // Sincronizar cada segundo mientras está en marcha para máxima precisión en visores
    // O cada 5 segundos si está parado para mantener la conexión viva
    const interval = setInterval(syncTimer, timerRunning ? 1000 : 5000)
    
    return () => clearInterval(interval)
  }, [timerRunning, selectedTournament?.id])

  // Sincronización inmediata ante cambios manuales del tiempo (ej. Reset)
  useEffect(() => {
    if (!selectedTournament) return
    // Si el usuario cambia el tiempo manualmente (mientras está parado o al resetear), 
    // forzamos una sincronización rápida
    const timeout = setTimeout(() => {
      updateTournamentTimer(selectedTournament.id, timeLeft, timerRunning)
        .catch(e => console.error("Error sync manual", e))
    }, 100)
    return () => clearTimeout(timeout)
  }, [timeLeft, selectedTournament?.id])

  // Funciones de sonido programático (Web Audio API)
  const playWarningSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
      osc.start()
      osc.stop(ctx.currentTime + 0.3)
      
      // Segundo beep
      setTimeout(() => {
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(880, ctx.currentTime)
        gain2.gain.setValueAtTime(0, ctx.currentTime)
        gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05)
        gain2.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3)
        osc2.start()
        osc2.stop(ctx.currentTime + 0.3)
      }, 400)
    } catch (e) { console.error("Audio error", e) }
  }

  const playHornSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const duration = 3.0
      // Varias frecuencias para sonido de bocina real
      const freqs = [150, 225, 300]
      freqs.forEach(f => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(f, ctx.currentTime)
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1)
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + duration - 0.5)
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
        osc.start()
        osc.stop(ctx.currentTime + duration)
      })
    } catch (e) { console.error("Horn error", e) }
  }

  // Lógica del segundero local (Admin)
  useEffect(() => {
    let interval
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          const next = prev - 1
          if (next === 60) playWarningSound()
          if (next === 0) playHornSound()
          return next
        })
      }, 1000)
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false)
    }
    return () => clearInterval(interval)
  }, [timerRunning, timeLeft === 0]) // Solo dependemos del estado de marcha y de si llega a cero

  // RESETEAR SOLO cuando cambie la duración base y NO esté corriendo
  useEffect(() => {
    if (!timerRunning) {
      setTimeLeft(localMatchPlayTime * 60)
    }
  }, [localMatchPlayTime])

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSelectTournament = async (t) => {
    if (!t) return setSelectedTournament(null)
    try {
      const freshTournament = await getTournament(t.id)
      setSelectedTournament(freshTournament)
      setScheduleActive(freshTournament?._count?.scheduleSlots > 0)
      setTab('torneo')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      console.error("Error al seleccionar torneo:", e)
      setSelectedTournament(t)
      setScheduleActive(t?._count?.scheduleSlots > 0)
      setTab('torneo')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const refreshSelectedTournament = async () => {
    if (!selectedTournament) return
    try {
      const fresh = await getTournament(selectedTournament.id)
      setSelectedTournament(fresh)
    } catch (e) { console.error("Error refreshing tournament", e) }
  }

  // Keyboard Shortcuts (F1-F11)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable;
      
      const keyMap = {
        'F1': { tab: 'torneo', sub: 'equipos' },
        'F2': { tab: 'torneo', sub: 'competicion' },
        'F3': { tab: 'torneo', sub: 'partidos' },
        'F4': { tab: 'torneo', sub: 'clasificacion' },
        'F6': { tab: 'torneos' },
        'F7': { tab: 'torneo' },
        'F8': { tab: 'calendario' },
        'F9': { tab: 'jugadores' },
        'F10': { tab: 'oficiales' },
        'F11': { tab: 'logs' },
        'F12': { tab: 'pistas' }
      };

      const action = keyMap[e.key];
      if (action) {
        // Bloquear atajos que requieren torneo si no hay uno seleccionado
        const needsTournament = ['F1', 'F2', 'F3', 'F4', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(e.key);
        if (needsTournament && !selectedTournament) return;

        e.preventDefault();
        setTab(action.tab);
        if (action.sub) setSubTab(action.sub);
        
        // No subir al inicio para F1-F4 para mantener la posición en las sub-pestañas de categoría
        if (!['F1', 'F2', 'F3', 'F4'].includes(e.key)) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTournament]);

  return (
    <TournamentBranding tournament={selectedTournament} minHeight="100vh">
    <div className="app">
      {/* Watermark */}
      <img src={getTournamentBackgroundLogo(selectedTournament)} alt="" className="watermark" />

      {/* Navbar */}
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
                  {timerRunning ? '⏸️ PAUSAR' : '▶️ INICIAR'}
                </div>
              </div>
              <button 
                className="btn btn-secondary btn-sm" 
                title="Resetear Reloj"
                onClick={() => { setTimerRunning(false); setTimeLeft(localMatchPlayTime * 60) }}
                style={{ padding: '0.2rem 0.5rem', minWidth: 'auto', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', borderRadius: '6px' }}
              >
                🔄
              </button>
            </div>
          )}

          <div className="navbar-actions">
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => {
                const url = selectedTournament ? `/public/${selectedTournament.id}` : '/'
                window.open(url, '_blank')
              }}
            >
              🏠 Portal
            </button>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => window.open('/marcador', '_blank')}
            >
              ⏱️ Marcador
            </button>
            {selectedTournament && (
              <button 
                className="btn btn-primary btn-sm" 
                style={{ background: 'var(--accent)', borderColor: 'var(--accent)' }}
                onClick={() => window.open(`/live/${selectedTournament.id}`, '_blank')}
              >
                📺 Monitor TV
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          {TABS.map(t => {
            if ((t.id === 'info' || t.id === 'torneo' || t.id === 'calendario' || t.id === 'jugadores' || t.id === 'oficiales' || t.id === 'logs' || t.id === 'pistas') && !selectedTournament) return null
            return (
              <button
                key={t.id}
                className={`tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <main className="main">
        <ErrorBoundary>
          {tab === 'torneos' && (
            <>
              <TournamentList
                onSelect={handleSelectTournament}
                selected={selectedTournament}
                extraActions={
                  <button
                    className={`btn ${showGroupLogicManager ? 'btn-secondary' : 'btn-blue'} btn-sm`}
                    onClick={() => setShowGroupLogicManager(prev => !prev)}
                  >
                    {showGroupLogicManager ? '✖ MANTENIMIENTO LOGICA GRUPOS' : '🧠 MANTENIMIENTO LOGICA GRUPOS'}
                  </button>
                }
              />
              {showGroupLogicManager && <GroupLogicManager />}
            </>
          )}

          {tab === 'info' && selectedTournament && (
            <TournamentInfo tournament={selectedTournament} onUpdate={setSelectedTournament} />
          )}

          {tab === 'pistas' && selectedTournament && (
            <CourtManager tournament={selectedTournament} scheduleActive={scheduleActive} />
          )}

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
              timerState={{
                localMatchPlayTime, setLocalMatchPlayTime,
                timeLeft, setTimeLeft,
                timerRunning, setTimerRunning
              }}
            />
          )}

          {tab === 'jugadores' && selectedTournament && (
            <PlayerDirectory tournament={selectedTournament} />
          )}

          {tab === 'oficiales' && selectedTournament && (
            <OfficialManager tournament={selectedTournament} onTournamentUpdate={setSelectedTournament} />
          )}

          {tab === 'logs' && selectedTournament && (
            <MatchLogsManager tournamentId={selectedTournament.id} />
          )}
        </ErrorBoundary>
      </main>

    <footer className="footer">
        GESTOR TORNEOS BASKET 3x3 @ JON AMAYUELAS CELAYA 2026
      </footer>
    </div>
    </TournamentBranding>
  )
}
