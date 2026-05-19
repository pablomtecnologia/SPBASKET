import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import * as api from '../api'
import GlobalTimer from './GlobalTimer'
import TournamentBranding from './TournamentBranding'
import { getTournamentHeaderLogo } from '../utils/tournamentBranding'

const ACTA_SESSION_STORAGE_KEY = 'spbasket-acta-session-key'

export default function DigitalActa() {
  const { tournamentId, court } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const officialName = searchParams.get('official') || 'Oficial no registrado'

  const [activeMatch, setActiveMatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [gameTime, setGameTime] = useState(null)
  const [tournament, setTournament] = useState(null)
  const [entryNoticeShown, setEntryNoticeShown] = useState(false)
  const [sessionKey, setSessionKey] = useState('')

  const formatGameTime = (seconds) => {
    if (seconds === null) return "--:--"
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    loadActiveMatch()
    const interval = setInterval(loadActiveMatch, 5000)
    return () => clearInterval(interval)
  }, [tournamentId, court])

  useEffect(() => {
    let storedSessionKey = sessionStorage.getItem(ACTA_SESSION_STORAGE_KEY)
    if (!storedSessionKey) {
      storedSessionKey = `acta-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem(ACTA_SESSION_STORAGE_KEY, storedSessionKey)
    }
    setSessionKey(storedSessionKey)
  }, [])

  useEffect(() => {
    api.getTournament(tournamentId)
      .then(setTournament)
      .catch(e => console.error("Error loading tournament branding:", e))
  }, [tournamentId])

  useEffect(() => {
    if (!activeMatch || entryNoticeShown) return

    const homeName = activeMatch.homeTeam?.name || 'EQUIPO LOCAL'
    const awayName = activeMatch.awayTeam?.name || 'EQUIPO VISITANTE'
    window.alert(`Asegúrate de quienes son los jugadores del equipo "${homeName}" y quienes son los jugadores del equipo "${awayName}". Si no lo tienes claro memoriza alguna característica (pelo, zapatillas, color camiseta...) que te permita relacionar un equipo con sus jugadores.`)
    setEntryNoticeShown(true)
  }, [activeMatch, entryNoticeShown])

  const loadActiveMatch = async () => {
    try {
      const match = await api.getActiveMatch(tournamentId, court)
      setActiveMatch(match)
    } catch (e) {
      console.error("Error loading active match:", e)
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleScoreUpdate = async (team, score) => {
    if (!activeMatch || isSyncing) return
    const homeScore = team === 'home' ? score : (activeMatch.homeScore || 0)
    const awayScore = team === 'away' ? score : (activeMatch.awayScore || 0)
    
    setIsSyncing(true)
    try {
      const gTimeStr = formatGameTime(gameTime)
      await api.updateScore(activeMatch.id, homeScore, awayScore, activeMatch.homeFouls, activeMatch.awayFouls, activeMatch.observations, 'playing', officialName, gTimeStr, sessionKey)
      setActiveMatch(prev => ({ ...prev, homeScore, awayScore, status: 'playing' }))
    } catch (e) {
      setError('Error al sincronizar puntos')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleFoulUpdate = async (team, fouls) => {
    if (!activeMatch || isSyncing) return
    const homeFouls = team === 'home' ? fouls : (activeMatch.homeFouls || 0)
    const awayFouls = team === 'away' ? fouls : (activeMatch.awayFouls || 0)

    setIsSyncing(true)
    try {
      const gTimeStr = formatGameTime(gameTime)
      await api.updateScore(activeMatch.id, activeMatch.homeScore, activeMatch.awayScore, homeFouls, awayFouls, activeMatch.observations, 'playing', officialName, gTimeStr, sessionKey)
      setActiveMatch(prev => ({ ...prev, homeFouls, awayFouls, status: 'playing' }))
    } catch (e) {
      setError('Error al sincronizar faltas')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleObservationsUpdate = async (obs) => {
    if (!activeMatch) return
    try {
      await api.updateScore(activeMatch.id, activeMatch.homeScore, activeMatch.awayScore, activeMatch.homeFouls, activeMatch.awayFouls, obs, activeMatch.status || 'playing', officialName, null, sessionKey)
      setActiveMatch(prev => ({ ...prev, observations: obs }))
    } catch (e) {
      console.error("Error updating observations:", e)
    }
  }

  const handleFinalizeMatch = async () => {
    if (!activeMatch) return
    const hasWinner = activeMatch.homeScore !== activeMatch.awayScore
    if (!hasWinner) {
      alert('⚠️ No se puede finalizar un partido en empate.')
      return
    }
    const homeScore = Number(activeMatch.homeScore || 0)
    const awayScore = Number(activeMatch.awayScore || 0)
    const winnerName = homeScore > awayScore
      ? (activeMatch.homeTeam?.name || 'EQUIPO LOCAL')
      : (activeMatch.awayTeam?.name || 'EQUIPO VISITANTE')
    if (!window.confirm(`¿Confirmar que el partido lo ha ganado el equipo "${winnerName}" por un resultado de ${homeScore}-${awayScore}?`)) return
    
    setIsSyncing(true)
    try {
      const gTimeStr = formatGameTime(gameTime)
      await api.updateScore(activeMatch.id, activeMatch.homeScore, activeMatch.awayScore, activeMatch.homeFouls, activeMatch.awayFouls, activeMatch.observations, 'played', officialName, gTimeStr, sessionKey)
      setActiveMatch(prev => ({ ...prev, status: 'played' }))
      alert('✅ Partido finalizado correctamente.')
      navigate('/marcador')
    } catch (e) {
      setError('Error al finalizar el partido')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleResetActa = async () => {
    if (!window.confirm('¿Deseas reiniciar completamente el acta? Se borrarán puntos, faltas y observaciones.')) return
    
    setIsSyncing(true)
    try {
      await api.updateScore(activeMatch.id, 0, 0, 0, 0, '', 'playing', officialName, null, sessionKey)
      setActiveMatch(prev => ({ 
        ...prev, 
        homeScore: 0, 
        awayScore: 0, 
        homeFouls: 0, 
        awayFouls: 0, 
        observations: '',
        status: 'playing'
      }))
    } catch (e) {
      setError('Error al reiniciar el acta')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleExit = async () => {
    if (!window.confirm('¿Estás seguro de que deseas salir del acta? El partido seguirá activo para otros oficiales.')) return;
    try {
      await api.exitMatch(activeMatch.id, officialName, sessionKey);
    } catch (e) {
      console.error("Error on exit:", e);
    } finally {
      navigate('/marcador');
    }
  }

  // Manejo de Pantalla Completa con F4
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F4') {
        e.preventDefault()
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error al intentar activar pantalla completa: ${err.message}`)
          })
        } else {
          document.exitFullscreen()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (loading) return <div className="spinner-container"><div className="spinner"></div></div>

  if (!activeMatch) {
    return (
      <div className="acta-digital-error">
        <h2>⚠️ Sin partido activo</h2>
        <p>No hay ningún partido activado para la <strong>{court}</strong>.</p>
        <button className="btn btn-secondary" onClick={() => navigate('/marcador')}>Volver al Selector</button>
      </div>
    )
  }

  const cat = activeMatch.category
  const catColor = cat?.color || '#fb923c'
  const scoresTopRow = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
  const scoresBottomRow = [12, 13, 14, 15, 16, 17, 18, 19, 20]

  const InteractiveTanteo = ({ label, team, currentScore, currentFouls }) => (
    <div className="tanteo-section-wrapper">
      <div className="tanteo-header-row">
        <div className="tanteo-title-main">{label}</div>
        <div className="bonus-container">
          <span className="bonus-label">BONUS</span>
          <div className="bonus-cells">
            {[1, 2, 3, 4, 5].map(b => (
              <div 
                key={b} 
                className={`bonus-cell ${b === 5 ? 'bonus-five' : ''} ${currentFouls >= b ? 'active-foul' : ''}`}
                onClick={() => handleFoulUpdate(team, currentFouls === b ? b - 1 : b)}
                style={{ cursor: 'pointer' }}
              >
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="score-grid interactive">
        {scoresTopRow.map(s => (
          <div 
            key={s} 
            className={`score-cell ${currentScore >= s ? 'selected' : ''}`}
            onClick={() => handleScoreUpdate(team, s)}
          >
            {s}
          </div>
        ))}
        {scoresBottomRow.map(s => (
          <div 
            key={s} 
            className={`score-cell ${currentScore >= s ? 'selected' : ''}`}
            onClick={() => handleScoreUpdate(team, s)}
          >
            {s}
          </div>
        ))}
        <div 
          className={`score-cell cell-21 ${currentScore >= 21 ? 'selected' : ''}`} 
          onClick={() => handleScoreUpdate(team, 21)}
        >
          21
        </div>
      </div>
    </div>
  )

  return (
    <TournamentBranding tournament={tournament} minHeight="100vh" padding="1rem" backgroundOpacity={0.1} backgroundSize="min(60vw, 760px)">
    <div className="acta-digital-container">
      <div className="acta-paper">
        <div className="acta-header-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={getTournamentHeaderLogo(tournament)} alt="Logo torneo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
            <div className="match-num-box">{activeMatch.matchNumber}</div>
            <GlobalTimer 
              tournamentId={tournamentId} 
              onTick={(t) => setGameTime(t)}
            />
          </div>
          <div className="court-name-top">{court.toUpperCase()}</div>
        </div>

        <div className="acta-main-grid">
          <div className="info-left">
            <div className="team-row">
              <span className="label-text">EQUIPO L:</span>
              <span className="team-name-underline">
                {activeMatch.homeTeam?.name || 'PENDIENTE'}
                <span className="live-score-bubble">{(activeMatch.homeScore || 0)}</span>
              </span>
            </div>
            <div className="team-row" style={{ marginTop: '1.5rem' }}>
              <span className="label-text">EQUIPO V:</span>
              <span className="team-name-underline">
                {activeMatch.awayTeam?.name || 'PENDIENTE'}
                <span className="live-score-bubble">{(activeMatch.awayScore || 0)}</span>
              </span>
            </div>
          </div>

          <div className="info-right">
            <div className="info-box-wrapper">
              <span className="label-text-small">CATEGORIA:</span>
              <div className="rounded-box" style={{ backgroundColor: catColor }}>
                <div className="cat-name-main">{cat?.name}</div>
                <div className="cat-gender-sub">{cat?.gender}</div>
              </div>
            </div>
            <div className="info-box-wrapper" style={{ marginTop: '0.8rem' }}>
              <span className="label-text-small">HORA:</span>
              <div className="rounded-box" style={{ backgroundColor: catColor }}>
                <div className="time-value-big">{activeMatch.scheduleSlot?.startTime || '--:--'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="tanteos-container">
          <InteractiveTanteo 
            label="TANTEO LOCAL" 
            team="home" 
            currentScore={activeMatch.homeScore} 
            currentFouls={activeMatch.homeFouls}
          />
          <div style={{ height: '1.5rem' }}></div>
          <InteractiveTanteo 
            label="TANTEO VISITANTE" 
            team="away" 
            currentScore={activeMatch.awayScore} 
            currentFouls={activeMatch.awayFouls}
          />
        </div>

        <div className="acta-observations">
          <label>OBSERVACIONES:</label>
          <textarea 
            value={activeMatch.observations || ''} 
            onChange={e => handleObservationsUpdate(e.target.value)}
            placeholder="..."
          />
        </div>

        <footer className="acta-footer-digital">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn-exit" onClick={handleExit}>🚪 Salir</button>
            <button className="btn-reset-all" onClick={handleResetActa}>Reiniciar Acta</button>
            {activeMatch.status === 'played' ? (
              <span className="badge-finished">🏁 PARTIDO FINALIZADO</span>
            ) : (
              <button className="btn-finalize" onClick={handleFinalizeMatch}>Finalizar Partido</button>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div>Oficial de Mesa: <strong>{officialName}</strong></div>
            <div className={isSyncing ? 'syncing' : 'synced'}>
              {isSyncing ? '⏳ Guardando...' : '✅ Sincronizado'}
            </div>
          </div>
        </footer>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');

        .acta-digital-container {
          background: #e5e7eb;
          min-height: 100vh;
          padding: 1rem;
          display: flex;
          justify-content: center;
          font-family: 'Inter', sans-serif;
        }

        .acta-paper {
          background: white;
          width: 100%;
          max-width: 900px;
          padding: 1.5rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          color: black;
          border: 1px solid #ddd;
        }

        .acta-header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          border-bottom: 3px solid black;
          padding-bottom: 0.5rem;
        }

        .match-num-box {
          background: black;
          color: white;
          font-size: 2rem;
          font-weight: 900;
          padding: 0.2rem 1.5rem;
          min-width: 60px;
          text-align: center;
        }

        .court-name-top {
          font-size: 1.8rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .acta-main-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .team-row {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .label-text {
          font-weight: 700;
          font-size: 1.1rem;
          white-space: nowrap;
        }

        .team-name-underline {
          font-weight: 900;
          font-size: 1.8rem;
          border-bottom: 2px solid black;
          flex: 1;
          padding-bottom: 2px;
          text-transform: uppercase;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .live-score-bubble {
          background: black;
          color: white;
          border-radius: 999px;
          min-width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          margin-left: 0.8rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .info-box-wrapper {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 1rem;
        }

        .label-text-small {
          font-weight: 700;
          font-size: 0.8rem;
        }

        .rounded-box {
          width: 180px;
          border-radius: 12px;
          padding: 0.5rem;
          text-align: center;
          color: white;
          border: 2px solid black;
        }

        .cat-name-main { font-weight: 900; font-size: 1rem; line-height: 1; text-transform: uppercase; }
        .cat-gender-sub { font-weight: 400; font-size: 0.75rem; margin-top: 2px; }
        .time-value-big { font-weight: 900; font-size: 2rem; letter-spacing: 0.05em; }

        .tanteo-section-wrapper {
          margin-bottom: 1rem;
        }

        .tanteo-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 0.4rem;
        }

        .tanteo-title-main {
          font-weight: 900;
          font-size: 1.4rem;
          letter-spacing: -0.02em;
        }

        .bonus-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .bonus-label { font-weight: 900; font-size: 0.8rem; }
        .bonus-cells { display: flex; border: 1px solid black; }
        .bonus-cell {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid black;
          font-weight: 900;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .bonus-cell:last-child { border-right: none; }
        .bonus-five { color: #ef4444; background: #f3f4f6; }
        
        .active-foul {
          background: #ef4444 !important;
          color: white !important;
        }

        .score-grid {
          display: grid;
          grid-template-columns: repeat(11, 1fr);
          border-top: 1px solid black;
          border-left: 1px solid black;
        }

        .score-cell {
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid black;
          border-bottom: 1px solid black;
          font-weight: 900;
          font-size: 1.1rem;
          cursor: pointer;
          transition: background 0.1s;
        }

        .score-cell.selected {
          background: #e5e7eb;
          color: black;
          position: relative;
        }
        .score-cell.selected::after {
          content: 'X';
          position: absolute;
          font-size: 1.5rem;
          color: #ef4444;
          font-weight: 900;
        }

        .score-grid.interactive .score-cell:hover {
          background: #f3f4f6;
        }

        .cell-21 {
          grid-column: span 2;
          background: #f3f4f6;
        }

        .acta-observations {
          margin-top: 2rem;
          border-top: 2px solid black;
          padding-top: 0.5rem;
        }
        .acta-observations label {
          display: block;
          font-weight: 900;
          font-size: 0.8rem;
          margin-bottom: 0.3rem;
        }
        .acta-observations textarea {
          width: 100%;
          border: none;
          border-bottom: 1px solid #ccc;
          min-height: 50px;
          font-family: inherit;
          font-size: 1rem;
          resize: none;
        }

        .acta-footer-digital {
          margin-top: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;
        }
        
        .btn-finalize {
          background: #22c55e;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 900;
          cursor: pointer;
          font-size: 0.9rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }
        .btn-finalize:hover { background: #16a34a; transform: translateY(-1px); }
        
        .badge-finished {
          background: #000;
          color: #fff;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 900;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-reset-all {
          background: none;
          border: 1px solid #ddd;
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 4px;
          font-size: 0.8rem;
          color: #666;
        }
        .btn-reset-all:hover { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }
        
        .btn-exit {
          background: #64748b;
          color: white;
          border: none;
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 700;
          transition: background 0.2s;
        }
        .btn-exit:hover { background: #475569; }

        @media (max-width: 800px) {
          .acta-main-grid { grid-template-columns: 1fr; gap: 1rem; }
          .info-right { display: flex; justify-content: space-between; gap: 0.5rem; }
          .info-box-wrapper { flex-direction: column; align-items: center; text-align: center; }
          .rounded-box { width: 140px; }
          .score-grid { grid-template-columns: repeat(6, 1fr); }
          .cell-21 { grid-column: span 1; }
        }
      `}} />
    </div>
    </TournamentBranding>
  )
}
