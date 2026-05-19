import { useState } from 'react'
import * as api from '../api'

export default function MatchLogsManager({ tournamentId }) {
  const [matchNumber, setMatchNumber] = useState('')
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!matchNumber) return
    if (!tournamentId) {
      setError('Por favor, selecciona primero un torneo en la pestaña 🏆 Torneos.')
      return
    }
    
    setLoading(true)
    setError('')
    try {
      const data = await api.getMatchLogs(tournamentId, matchNumber)
      if (data.length === 0) {
        setError('No se encontraron registros para este número de partido.')
      }
      setLogs(data)
    } catch (err) {
      setError('Error al consultar los registros.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatAction = (action) => {
    switch (action) {
      case 'JOIN': return '📥 Entrada'
      case 'EXIT': return '🚪 Salida'
      case 'UPDATE_SCORE': return '🏀 Marcador'
      case 'FINALIZE': return '🏁 Finalizado'
      case 'RESET': return '🔄 Reinicio'
      default: return action
    }
  }

  return (
    <div className="admin-section animate-fade-in">
      <div className="section-header">
        <h2 className="section-title">📜 Registro de Actas Digitales</h2>
        <p className="section-subtitle">Consulta el historial detallado de acciones por partido</p>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label>Número de Partido (#)</label>
            <input 
              type="number" 
              className="form-control" 
              placeholder="Ej: 10" 
              value={matchNumber}
              onChange={(e) => setMatchNumber(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Buscando...' : '🔍 Consultar Registro'}
          </button>
        </form>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      {logs.length > 0 && (
        <div className="logs-container">
          <div className="match-info-banner card" style={{ marginBottom: '1.5rem', background: 'var(--bg-accent)' }}>
            <h3>Partido #{logs[0].match.matchNumber}</h3>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              {logs[0].match.homeTeam?.name || 'TBD'} vs {logs[0].match.awayTeam?.name || 'TBD'}
            </p>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha/Hora</th>
                  <th>Reloj</th>
                  <th>Oficial</th>
                  <th>Acción</th>
                  <th>Resultado (L-V)</th>
                  <th>Faltas (L-V)</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{log.gameTime || '--:--'}</td>
                    <td><span className="badge-official">{log.officialName}</span></td>
                    <td><strong>{formatAction(log.action)}</strong></td>
                    <td style={{ textAlign: 'center' }}>{log.homeScore ?? '-'} - {log.awayScore ?? '-'}</td>
                    <td style={{ textAlign: 'center' }}>{log.homeFouls} - {log.awayFouls}</td>
                    <td><small>{log.details || '-'}</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {!logs.length && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
          <p>Introduce un número de partido para ver su historial de auditoría.</p>
        </div>
      )}

      <style jsx>{`
        .badge-official {
          background: var(--primary);
          color: white;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: bold;
        }
        .logs-container {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
