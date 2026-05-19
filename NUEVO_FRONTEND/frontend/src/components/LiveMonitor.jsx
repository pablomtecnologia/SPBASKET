import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import * as api from '../api'
import GlobalTimer from './GlobalTimer'
import { getTournamentBackgroundLogo, getTournamentHeaderLogo } from '../utils/tournamentBranding'

// Componente para escalar automáticamente el contenido al contenedor
const ScalingContainer = ({ children, matchesCount }) => {
  const containerRef = useRef(null)
  const contentRef = useRef(null)
  const [scale, setScale] = useState(1)

  const updateScale = useCallback(() => {
    if (containerRef.current && contentRef.current) {
      const containerHeight = containerRef.current.offsetHeight
      const contentHeight = contentRef.current.scrollHeight
      
      if (contentHeight > containerHeight && containerHeight > 0) {
        setScale((containerHeight / contentHeight) * 0.98)
      } else {
        setScale(1)
      }
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(updateScale, 100)
    window.addEventListener('resize', updateScale)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateScale)
    }
  }, [children, matchesCount, updateScale])

  return (
    <div ref={containerRef} className="scaling-container-outer">
      <div 
        ref={contentRef} 
        className="scaling-container-inner"
        style={{ 
          transform: `scale(${scale})`, 
          transformOrigin: 'top center',
          width: scale < 1 ? `${100 / scale}%` : '100%',
          left: scale < 1 ? `${(100 - (100 / scale)) / 2}%` : '0'
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default function LiveMonitor() {
  const { tournamentId } = useParams()
  const [monitorData, setMonitorData] = useState({
    tournament: null,
    activeMatches: [],
    upcomingMatches: [],
    lastUpdate: new Date(),
    isSyncing: false,
    syncCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshTimer, setRefreshTimer] = useState(0)
  
  const timerInitialized = useRef(false)
  const tournamentRef = useRef(null)
  const isSyncingRef = useRef(false)
  const isStatsSyncingRef = useRef(false)

  // Publicidad
  const [imagesList, setImagesList] = useState([])
  const [currentAd, setCurrentAd] = useState(null)
  const [showAd, setShowAd] = useState(false)

  const fetchData = useCallback(async () => {
    if (isSyncingRef.current) return
    isSyncingRef.current = true
    setMonitorData(prev => ({ ...prev, isSyncing: true }))

    try {
      const [tData, mData] = await Promise.all([
        api.getTournament(tournamentId),
        api.getMatches(tournamentId)
      ])
      
      tournamentRef.current = tData
      if (!timerInitialized.current) {
        setRefreshTimer(tData.monitorRefreshTime || 3)
        timerInitialized.current = true
      }
      
      const allRounds = [...new Set(mData.filter(m => m.scheduleSlot).map(m => 
        `${m.scheduleSlot.date}|${m.scheduleSlot.startTime}`
      ))].sort()

      let activeRounds = [...new Set(mData.filter(m => m.active && m.scheduleSlot).map(m => 
        `${m.scheduleSlot.date}|${m.scheduleSlot.startTime}`
      ))]

      if (!tData.active || activeRounds.length === 0) {
        const pendingRounds = [...new Set(mData.filter(m => m.status !== 'played' && m.scheduleSlot).map(m => 
          `${m.scheduleSlot.date}|${m.scheduleSlot.startTime}`
        ))].sort()

        if (pendingRounds.length > 0) {
          activeRounds = [pendingRounds[0]]
        }
      }

      const leftMatches = mData.filter(m => 
        m.scheduleSlot && activeRounds.includes(`${m.scheduleSlot.date}|${m.scheduleSlot.startTime}`)
      ).sort((a, b) => {
        if (a.scheduleSlot.startTime !== b.scheduleSlot.startTime) 
          return a.scheduleSlot.startTime.localeCompare(b.scheduleSlot.startTime)
        return a.scheduleSlot.court.localeCompare(b.scheduleSlot.court)
      })

      const remainingRounds = allRounds.filter(r => !activeRounds.includes(r))
      const next2Rounds = remainingRounds.filter(r => {
        if (activeRounds.length > 0) {
          return r.localeCompare(activeRounds[activeRounds.length - 1]) > 0
        }
        return true
      }).slice(0, 2)

      const rightMatches = mData.filter(m => 
        m.scheduleSlot && next2Rounds.includes(`${m.scheduleSlot.date}|${m.scheduleSlot.startTime}`)
      ).sort((a, b) => {
        if (a.scheduleSlot.startTime !== b.scheduleSlot.startTime) 
          return a.scheduleSlot.startTime.localeCompare(b.scheduleSlot.startTime)
        return a.scheduleSlot.court.localeCompare(b.scheduleSlot.court)
      })

      setMonitorData(prev => ({
        tournament: tData,
        activeMatches: leftMatches,
        upcomingMatches: rightMatches,
        lastUpdate: new Date(),
        isSyncing: false,
        syncCount: prev.syncCount + 1
      }))
      setLoading(false)
      isSyncingRef.current = false
    } catch (e) {
      console.error("Monitor fetch error:", e)
      setError("Error al cargar datos del monitor")
      setLoading(false)
      setMonitorData(prev => ({ ...prev, isSyncing: false }))
      isSyncingRef.current = false
    }
  }, [tournamentId])

  // Función para actualizar SOLO marcadores y faltas (Tiempo Real)
  const fetchLiveStats = useCallback(async () => {
    if (isStatsSyncingRef.current) return
    isStatsSyncingRef.current = true
    try {
      const mData = await api.getMatches(tournamentId)
      setMonitorData(prev => {
        const updateMatches = (list) => list.map(m => {
          const fresh = mData.find(f => f.id === m.id)
          if (!fresh) return m
          return {
            ...m,
            homeScore: fresh.homeScore,
            awayScore: fresh.awayScore,
            homeFouls: fresh.homeFouls,
            awayFouls: fresh.awayFouls,
            status: fresh.status,
            active: fresh.active
          }
        })

        return {
          ...prev,
          activeMatches: updateMatches(prev.activeMatches),
          upcomingMatches: updateMatches(prev.upcomingMatches),
          lastUpdate: new Date()
        }
      })
      isStatsSyncingRef.current = false
    } catch (e) {
      console.error("Live stats sync error:", e)
      isStatsSyncingRef.current = false
    }
  }, [tournamentId])

  // Motor de Sincronización Estructural (Reloj Maestro)
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshTimer(prev => {
        if (prev <= 1) {
          fetchData()
          return tournamentRef.current?.monitorRefreshTime || 3
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [fetchData])

  // Motor de Marcadores "Online" (Cada 1 segundo)
  useEffect(() => {
    const statsTimer = setInterval(() => {
      fetchLiveStats()
    }, 1000)
    return () => clearInterval(statsTimer)
  }, [fetchLiveStats])

  // Cargar lista de imágenes y primer fetch
  useEffect(() => {
    fetchData()
    const loadImages = async () => {
      try {
        const response = await fetch('/api/images-list')
        if (response.ok) {
          const data = await response.json()
          setImagesList(data)
        }
      } catch (e) { console.error("Error loading images list:", e) }
    }
    loadImages()
  }, [fetchData])

  // Publicidad
  useEffect(() => {
    if (imagesList.length === 0) return
    const adInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * imagesList.length)
      setCurrentAd(imagesList[randomIndex])
      setShowAd(true)
      setTimeout(() => setShowAd(false), 10000)
    }, 300000)
    return () => clearInterval(adInterval)
  }, [imagesList])

  // Pantalla Completa
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F4') {
        e.preventDefault()
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen()
        } else {
          document.exitFullscreen()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const getScaleClass = (count) => {
    if (count > 16) return 'ultra-mini'
    if (count > 12) return 'mini'
    if (count > 8) return 'compact'
    return 'normal'
  }

  if (loading && !monitorData.tournament) return <div className="monitor-loading"><div className="spinner"></div></div>
  if (error) return <div className="monitor-error">{error}</div>

  const { tournament, activeMatches, upcomingMatches, lastUpdate, isSyncing, syncCount } = monitorData
  if (!tournament) return null

  const leftScale = getScaleClass(activeMatches.length)
  const rightScale = getScaleClass(upcomingMatches.length)

  return (
    <div
      className="live-monitor"
      style={getTournamentBackgroundLogo(tournament) ? {
        backgroundImage: `linear-gradient(180deg, rgba(2,6,23,0.86) 0%, rgba(2,6,23,0.92) 100%), url(${getTournamentBackgroundLogo(tournament)})`,
        backgroundRepeat: 'no-repeat, no-repeat',
        backgroundPosition: 'center center, center center',
        backgroundSize: 'cover, min(70vw, 1100px)',
      } : undefined}
    >
      <header className="monitor-header">
        <div className="monitor-logo-container">
          <img src={getTournamentHeaderLogo(tournament)} alt="Logo" className="monitor-logo" />
        </div>
        <div className="monitor-title-wrap">
          <h1>{tournament.name}</h1>
          <div className="monitor-badge">LIVE MONITOR</div>
        </div>
        <div className="monitor-clock">
          <div className="timer-wrapper" style={{ marginBottom: '0.5rem' }}>
            <GlobalTimer tournamentId={tournamentId} className="monitor-global-timer" />
          </div>
          <div className="next-refresh">
            PRÓXIMA ACTUALIZACIÓN:
            <span className="countdown">
              {Math.floor(refreshTimer / 60)}:{(refreshTimer % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="current-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </header>

      <div className="monitor-grid">
        <section className={`monitor-col active-col scale-${leftScale}`}>
          <h2 className="col-title"><span className="icon">🏀</span> EN JUEGO <span className="dot pulse"></span></h2>
          <div className="matches-list">
            <ScalingContainer matchesCount={activeMatches.length}>
              {activeMatches.length === 0 ? (
                <div className="empty-state">No hay partidos activos en este momento</div>
              ) : (
                Object.entries(activeMatches.reduce((acc, m) => {
                  const key = `${m.scheduleSlot.date}|${m.scheduleSlot.startTime}`
                  if (!acc[key]) acc[key] = []
                  acc[key].push(m)
                  return acc
                }, {})).map(([key, matches]) => {
                  const [date, time] = key.split('|')
                  const formattedDate = date.split('-').reverse().join('/')
                  return (
                    <div key={key} className="round-group">
                      <div className="round-header">
                        <span className="icon">📅</span> {formattedDate} <span className="sep">|</span> <span className="icon">🕒</span> {time}
                      </div>
                      <div className="round-grid">
                        {matches.map(m => (
                          <div key={m.id} className={`monitor-match-card ${m.active ? 'active-card' : 'waiting-card'} animate-slide-in`} style={{ '--accent-color': m.category?.color || '#ff00ff' }}>
                            <div className="match-meta">
                              <span className="court-badge">{m.scheduleSlot?.court || '?'}</span>
                              <span className="category-tag">
                                {m.category?.name?.toUpperCase() || 'CATEGORÍA'}({m.category?.gender?.toUpperCase() || 'MIXTO'}) {m.type && <span className="match-type">— {m.type}</span>}
                              </span>
                              <div className="status-wrap">
                                {m.active && <div className="live-indicator">LIVE</div>}
                                {m.status === 'played' && <div className="finished-badge">FINALIZADO</div>}
                              </div>
                            </div>
                            <div className="match-scoreboard">
                              <div className={`team home ${m.status === 'played' && m.homeScore > m.awayScore ? 'is-winner' : ''}`}>
                                <div className="team-info-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                  <div className="team-name">{m.homeTeam?.name || 'TBD'}</div>
                                  <div className={`fouls-monitor ${m.homeFouls >= 5 ? 'critical' : ''}`}>
                                    {m.homeFouls >= 5 && <span className="warning-icon">⚠️</span>}
                                    FALTAS: {m.homeFouls || 0}
                                  </div>
                                </div>
                                <div className="score">{m.homeScore}</div>
                              </div>
                              <div className="divider">-</div>
                              <div className={`team away ${m.status === 'played' && m.awayScore > m.homeScore ? 'is-winner' : ''}`}>
                                <div className="score">{m.awayScore}</div>
                                <div className="team-info-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                                  <div className="team-name">{m.awayTeam?.name || 'TBD'}</div>
                                  <div className={`fouls-monitor ${m.awayFouls >= 5 ? 'critical' : ''}`}>
                                    FALTAS: {m.awayFouls || 0}
                                    {m.awayFouls >= 5 && <span className="warning-icon">⚠️</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </ScalingContainer>
          </div>
        </section>

        <section className={`monitor-col upcoming-col scale-${rightScale}`}>
          <h2 className="col-title">📅 PRÓXIMOS</h2>
          <div className="matches-list">
            <ScalingContainer matchesCount={upcomingMatches.length}>
              {upcomingMatches.length === 0 ? (
                <div className="empty-state">No hay más partidos programados</div>
              ) : (
                Object.entries(upcomingMatches.reduce((acc, m) => {
                  const key = `${m.scheduleSlot.date}|${m.scheduleSlot.startTime}`
                  if (!acc[key]) acc[key] = []
                  acc[key].push(m)
                  return acc
                }, {})).map(([key, matches]) => {
                  const [date, time] = key.split('|')
                  const formattedDate = date.split('-').reverse().join('/')
                  return (
                    <div key={key} className="round-group upcoming-group">
                      <div className="round-header mini">
                        <span className="icon">📅</span> {formattedDate} <span className="sep">|</span> <span className="icon">🕒</span> {time}
                      </div>
                      <div className="round-grid mini">
                        {matches.map(m => (
                          <div key={m.id} className="monitor-match-card upcoming-card animate-slide-in" style={{ '--accent-color': m.category?.color || '#475569' }}>
                            <div className="match-meta">
                              <span className="court-badge">{m.scheduleSlot?.court || '?'}</span>
                              <span className="category-tag">
                                {m.category?.name?.toUpperCase() || 'CATEGORÍA'}({m.category?.gender?.toUpperCase() || 'MIXTO'}) {m.type && <span className="match-type">— {m.type}</span>}
                              </span>
                            </div>
                            <div className="match-scoreboard mini">
                              <div className="team home">
                                <div className="team-info-mini">
                                  <div className="team-name">{m.homeTeam?.name || 'TBD'}</div>
                                  <div className={`fouls-mini ${m.homeFouls >= 5 ? 'critical' : ''}`}>F: {m.homeFouls || 0}</div>
                                </div>
                                <div className="score-mini">{m.homeScore}</div>
                              </div>
                              <div className="divider">vs</div>
                              <div className="team away">
                                <div className="score-mini">{m.awayScore}</div>
                                <div className="team-info-mini">
                                  <div className="team-name">{m.awayTeam?.name || 'TBD'}</div>
                                  <div className={`fouls-mini ${m.awayFouls >= 5 ? 'critical' : ''}`}>F: {m.awayFouls || 0}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </ScalingContainer>
          </div>
        </section>
      </div>

      <footer className="monitor-footer">
        GESTOR TORNEOS BASKET 3x3 @ JON AMAYUELAS CELAYA 2026
      </footer>

      {showAd && currentAd && (
        <div className="ad-overlay">
          <img src={`/api/tournament-images/${currentAd}`} alt="Publicidad" />
          <div className="ad-timer-bar"></div>
        </div>
      )}

      <style jsx>{`
        .team-info-mini { display: flex; flex-direction: column; overflow: hidden; }
        .score-mini { font-size: 1.5rem; font-weight: 900; color: #f8fafc; background: rgba(0,0,0,0.3); padding: 0.2rem 0.5rem; border-radius: 4px; min-width: 40px; text-align: center; }
        .fouls-mini { font-size: 0.7rem; color: #94a3b8; font-weight: bold; }
        .fouls-mini.critical { color: #ff4d4d; }
        .live-monitor { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #020617; background-image: radial-gradient(at 0% 0%, rgba(30, 58, 138, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%); color: white; font-family: 'Inter', system-ui, sans-serif; display: flex; flex-direction: column; z-index: 9999; overflow: hidden; }
        .monitor-header { display: flex; align-items: center; padding: 0.75rem 2rem; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255, 255, 255, 0.1); gap: 1.5rem; z-index: 10; }
        .monitor-logo { height: 60px; filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.2)); transition: transform 0.3s ease; }
        .monitor-title-wrap h1 { font-size: 2rem; margin: 0; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; background: linear-gradient(to right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .monitor-badge { display: inline-block; background: linear-gradient(90deg, #ff00ff, #7000ff); color: white; padding: 0.25rem 1rem; border-radius: 99px; font-size: 0.8rem; font-weight: 800; margin-top: 0.5rem; letter-spacing: 1px; box-shadow: 0 0 20px rgba(255, 0, 255, 0.3); }
        .monitor-clock { margin-left: auto; text-align: right; display: flex; flex-direction: column; align-items: flex-end; }
        .current-time { font-size: 2.5rem; font-weight: 900; line-height: 1; font-variant-numeric: tabular-nums; background: linear-gradient(to bottom, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .next-refresh { font-size: 0.9rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.25rem; }
        .countdown { color: #fff; font-weight: 800; margin-left: 0.5rem; }
        .monitor-grid { flex: 1; display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 2.5rem; padding: 2rem 3rem; overflow: hidden; }
        .monitor-col { display: flex; flex-direction: column; height: 100%; min-height: 0; }
        .col-title { font-size: 2rem; font-weight: 900; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1.25rem; text-transform: uppercase; letter-spacing: 2px; color: #f8fafc; }
        .matches-list { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; position: relative; }
        .scaling-container-outer { position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; }
        .scaling-container-inner { position: absolute; top: 0; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; gap: 1.5rem; }
        .round-group { display: flex; flex-direction: column; min-height: 0; flex: 1; }
        .round-grid { display: flex; flex-direction: column; gap: 1rem; }
        .round-grid.mini { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
        .monitor-match-card { background: rgba(30, 41, 59, 0.5); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.08); border-left: 6px solid var(--accent-color); border-radius: 20px; padding: 1.5rem; position: relative; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .active-card { background: rgba(30, 41, 59, 0.8); box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4), 0 0 15px var(--accent-color, rgba(255,0,255,0.1)); animation: active-float 3s ease-in-out infinite; }
        @keyframes active-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 25px var(--accent-color, rgba(255,0,255,0.2)); } }
        .waiting-card { opacity: 0.7; transform: scale(0.98); }
        .round-header { font-size: 4rem; font-weight: 950; color: #f1f5f9; margin-bottom: 2.5rem; display: flex; align-items: center; gap: 2rem; background: linear-gradient(90deg, rgba(255,255,255,0.2), transparent); padding: 1.5rem 3rem; border-radius: 25px; width: 100%; border-left: 12px solid #fff; letter-spacing: -2px; line-height: 1; }
        .upcoming-col .round-header { border-left-color: #475569; }
        .upcoming-card { background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.05); border-left: 12px solid var(--accent-color, #475569); padding: 2.5rem; border-radius: 25px; }
        .match-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; gap: 1rem; }
        .status-wrap { display: flex; align-items: center; gap: 0.5rem; min-width: fit-content; }
        .court-badge { background: #f1f5f9; color: #0f172a; padding: 0.75rem 2rem; border-radius: 15px; font-weight: 950; font-size: 2.2rem; box-shadow: 0 8px 16px rgba(0,0,0,0.5); display: inline-block; text-align: center; line-height: 1; }
        .upcoming-col .court-badge { background: #334155; color: #f1f5f9; }
        .category-tag { font-weight: 950; text-transform: uppercase; font-size: 2.2rem; color: var(--accent-color); letter-spacing: 2px; background: rgba(255,255,255,0.12); padding: 0.6rem 1.8rem; border-radius: 12px; line-height: 1; }
        .match-scoreboard { display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-top: 0.5rem; }
        .team { display: flex; align-items: center; gap: 1.5rem; flex: 1; }
        .team.home { justify-content: flex-end; text-align: right; }
        .team.away { justify-content: flex-start; text-align: left; }
        .team-name { font-size: 3.5rem; font-weight: 950; color: #fff; letter-spacing: -2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-transform: uppercase; }
        .score { font-size: 8rem; font-weight: 950; color: #fff; text-shadow: 0 0 30px rgba(255, 255, 255, 0.4); min-width: 150px; text-align: center; font-variant-numeric: tabular-nums; line-height: 1; }
        .divider { font-size: 2.5rem; font-weight: 900; opacity: 0.15; }
        .scale-compact .score { font-size: 4rem; }
        .scale-mini .score { font-size: 2.8rem; min-width: 60px; }
        .scale-ultra-mini .score { font-size: 1.8rem; min-width: 40px; }
        .is-winner { color: var(--accent-color) !important; font-weight: 950 !important; text-shadow: 0 0 25px var(--accent-color); opacity: 1 !important; }
        .fouls-monitor { font-size: 1.8rem; font-weight: 900; color: #94a3b8; background: rgba(255, 255, 255, 0.05); padding: 0.2rem 1rem; border-radius: 8px; display: flex; align-items: center; gap: 0.5rem; }
        .fouls-monitor.critical { color: #ef4444; background: rgba(239, 68, 68, 0.15); border-color: #ef4444; animation: pulse-red 2s infinite; }
        @keyframes pulse-red { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        .finished-badge { border: 4px solid var(--accent-color); color: var(--accent-color); font-size: 1.8rem; font-weight: 950; padding: 0.6rem 1.5rem; border-radius: 12px; }
        .live-indicator { background: #ef4444; color: white; font-size: 1.8rem; font-weight: 950; padding: 0.6rem 1.8rem; border-radius: 12px; animation: blink 1s infinite; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .monitor-footer { padding: 1.25rem 3rem; background: rgba(15, 23, 42, 0.9); text-align: center; font-size: 1rem; color: #94a3b8; }
        .monitor-loading { height: 100vh; display: flex; align-items: center; justify-content: center; background: #020617; color: white; }
        .ad-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #000; z-index: 10000; display: flex; align-items: center; justify-content: center; }
        .ad-timer-bar { position: absolute; bottom: 0; left: 0; height: 8px; background: linear-gradient(90deg, #ff00ff, #7000ff); width: 100%; animation: ad-timer 10s linear forwards; }
        @keyframes ad-timer { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  )
}
