import { useState, useEffect } from 'react'
import * as api from '../api'

export default function GlobalTimer({ tournamentId, className = "", onTick }) {
  const [timeLeft, setTimeLeft] = useState(null)
  const [timerRunning, setTimerRunning] = useState(false)

  // Notificar al padre si hay callback
  useEffect(() => {
    if (onTick) onTick(timeLeft)
  }, [timeLeft, onTick])

  const formatTime = (seconds) => {
    if (seconds === null) return "--:--"
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    if (!tournamentId) return

    const fetchTimer = async () => {
      try {
        const t = await api.getTournament(tournamentId)
        if (t) {
          const backendTime = t.timerRemainingSeconds
          const backendRunning = t.timerRunning
          
          // Lógica de corrección inteligente:
          // 1. Si el estado de ejecución (running/paused) cambia, actualizamos siempre
          // 2. Si el tiempo difiere en más de 2 segundos, corregimos (ajuste de deriva)
          // 3. Si el tiempo local es null (inicio), actualizamos
          
          setTimeLeft(prevLocalTime => {
            if (prevLocalTime === null) return backendTime
            
            const diff = Math.abs(prevLocalTime - backendTime)
            if (diff > 2 || timerRunning !== backendRunning) {
              return backendTime
            }
            return prevLocalTime
          })
          
          setTimerRunning(backendRunning)
        }
      } catch (e) {
        console.error("Error fetching timer:", e)
      }
    }

    fetchTimer()
    const pollInterval = setInterval(fetchTimer, 2000) // Sincronización con backend cada 2s
    
    // Segundero local para suavidad visual
    const tickInterval = setInterval(() => {
      setTimerRunning(currentRunning => {
        if (currentRunning) {
          setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : prev))
        }
        return currentRunning
      })
    }, 1000)

    return () => {
      clearInterval(pollInterval)
      clearInterval(tickInterval)
    }
  }, [tournamentId, timerRunning]) // Re-arrancar si cambia el ID o el estado de marcha detectado

  if (timeLeft === null) return null

  return (
    <div className={`global-timer-badge ${className} ${timerRunning ? 'running' : 'paused'} ${timeLeft <= 60 ? 'warning' : ''}`}>
      <span className="timer-icon">⏱️</span>
      <span className="timer-val">{formatTime(timeLeft)}</span>
      
      <style jsx>{`
        .global-timer-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(0,0,0,0.4);
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          font-family: 'Inter', monospace;
          font-weight: 700;
          font-size: 1.1rem;
          color: white;
          transition: all 0.3s ease;
        }
        .timer-icon { font-size: 1rem; }
        .running { 
          border-color: #22c55e;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.2);
        }
        .paused { opacity: 0.7; }
        .warning { 
          color: #ef4444; 
          border-color: #ef4444;
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
