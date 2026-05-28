import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import PublicPortal from './components/PublicPortal'
import DigitalScoreboard from './components/DigitalScoreboard'
import DigitalActa from './components/DigitalActa'
import LiveMonitor from './components/LiveMonitor'
import ErrorBoundary from './components/ErrorBoundary'
import * as api from './api'

const AdminApp = lazy(() => import('./AdminAppNew'))

function Home() {
  const [tournaments, setTournaments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getTournaments()
      .then(setTournaments)
      .catch(e => {
        console.error("Error fetching tournaments:", e)
        setError("No se pudieron cargar los torneos. Asegúrate de que el servidor está corriendo.")
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="home-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'white', padding: '2rem' }}>
      <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" style={{ height: '120px', marginBottom: '2rem' }} />
      <h1 style={{ color: 'var(--accent)', textAlign: 'center', fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase' }}>SPBASKET <span style={{ color: 'white' }}>3×3</span></h1>
      <p style={{ color: 'var(--text2)', marginBottom: '2.5rem', textAlign: 'center', fontSize: '1.2rem' }}>Portal Oficial de Competición</p>
      
      {loading ? (
        <div className="spinner"></div>
      ) : error ? (
        <div className="alert alert-error" style={{ maxWidth: '500px', textAlign: 'center' }}>{error}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px' }}>
          {tournaments.length === 0 ? (
            <p className="text-muted" style={{ textAlign: 'center' }}>No hay torneos activos actualmente.</p>
          ) : (
            tournaments.map(t => (
              <Link key={t.id} to={`/public/${t.id}`} className="btn btn-primary" style={{ 
                padding: '1.25rem',
                fontSize: '1.1rem',
                justifyContent: 'center',
                textDecoration: 'none'
              }}>
                Ir al Torneo: {t.name}
              </Link>
            ))
          )}
        </div>
      )}
      <footer className="footer">
        GESTOR TORNEOS BASKET 3x3 @ JON AMAYUELAS CELAYA 2026
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/3x3">
      <ErrorBoundary>
        <Suspense fallback={
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: 'white' }}>
            <div style={{ textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
              <p>Cargando Panel de Administración...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/public/:tournamentId/*" element={<PublicPortal />} />
            <Route path="/marcador/acta/:tournamentId/:court" element={<DigitalActa />} />
            <Route path="/marcador/:tournamentId" element={<DigitalScoreboard />} />
            <Route path="/marcador" element={<DigitalScoreboard />} />
            <Route path="/live/:tournamentId" element={<LiveMonitor />} />
            <Route path="/public" element={<Home />} />
            <Route path="/gestion-privada-penguin/*" element={<AdminApp />} />
            <Route path="/*" element={<Home />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}
