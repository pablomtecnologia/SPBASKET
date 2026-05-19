import { useState, useEffect } from 'react'
import { getCourts, createCourt, deleteCourt, updateCourtConfigs, getJornadas, getCategories } from '../api'

export default function CourtManager({ tournament, scheduleActive }) {
  const [courts, setCourts] = useState([])
  const [jornadas, setJornadas] = useState([])
  const [categories, setCategories] = useState([])
  const [activeJornadaId, setActiveJornadaId] = useState(null)
  const [newCourtName, setNewCourtName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  // Local state for configuration (to be saved)
  // { [jornadaId]: { [courtId]: [categoryIds] } }
  const [configs, setConfigs] = useState({})

  useEffect(() => {
    loadData()
  }, [tournament.id])

  async function loadData() {
    setLoading(true)
    setError(null)
    try {
      const [cData, jData, catData] = await Promise.all([
        getCourts(tournament.id),
        getJornadas(tournament.id),
        getCategories(tournament.id)
      ])
      setCourts(cData)
      const sortedJornadas = [...jData].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      });
      setJornadas(sortedJornadas)
      setCategories(catData)
      
      if (jData.length > 0) {
        setActiveJornadaId(jData[0].id)
      }

      // Initialize configs from jData
      const initialConfigs = {}
      if (Array.isArray(jData)) {
        jData.forEach(j => {
          initialConfigs[j.id] = {}
          if (j.courtConfigs && Array.isArray(j.courtConfigs)) {
            j.courtConfigs.forEach(conf => {
              if (conf.categories) {
                initialConfigs[j.id][conf.courtId] = conf.categories.map(cat => cat.id)
              }
            })
          }
        })
      }
      setConfigs(initialConfigs)

    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCourt = async (e) => {
    e.preventDefault()
    if (!newCourtName.trim()) return
    try {
      const created = await createCourt(tournament.id, { name: newCourtName })
      setCourts([...courts, created])
      setNewCourtName('')
      setInfo('✅ Pista añadida')
      setTimeout(() => setInfo(null), 3000)
    } catch (e) { setError(e.message) }
  }

  const handleDeleteCourt = async (id) => {
    if (!confirm('¿Seguro que quieres eliminar esta pista? Se eliminarán sus configuraciones asociadas.')) return
    try {
      await deleteCourt(tournament.id, id)
      setCourts(courts.filter(c => c.id !== id))
      setInfo('🗑️ Pista eliminada')
      setTimeout(() => setInfo(null), 3000)
    } catch (e) { setError(e.message) }
  }

  const toggleCategory = (jornadaId, courtId, categoryId) => {
    setConfigs(prev => {
      const jConf = prev[jornadaId] || {}
      const cConf = jConf[courtId] || []
      const newCConf = cConf.includes(categoryId)
        ? cConf.filter(id => id !== categoryId)
        : [...cConf, categoryId]
      
      return {
        ...prev,
        [jornadaId]: {
          ...jConf,
          [courtId]: newCConf
        }
      }
    })
  }

  const handleCloseAllGlobal = () => {
    if (window.confirm("¿Estás seguro de que quieres CERRAR todas las pistas en TODAS las jornadas? 🚫")) {
      const newConfigs = {};
      jornadas.forEach(j => {
        newConfigs[j.id] = {};
        courts.forEach(c => {
          newConfigs[j.id][c.id] = [];
        });
      });
      setConfigs(newConfigs);
    }
  };

  const handleOpenAllGlobal = () => {
    if (window.confirm("¿Quieres ABRIR todas las pistas en TODAS las jornadas? (Disponibles para todas las categorías) ✅")) {
      setConfigs({});
    }
  };

  const handleCloseCurrentJornada = () => {
    if (!activeJornada) return;
    const newConfigs = { ...configs };
    newConfigs[activeJornada.id] = {};
    courts.forEach(c => {
      newConfigs[activeJornada.id][c.id] = [];
    });
    setConfigs(newConfigs);
  };

  const handleOpenCurrentJornada = () => {
    if (!activeJornada) return;
    const newConfigs = { ...configs };
    delete newConfigs[activeJornada.id];
    setConfigs(newConfigs);
  };

  const handleSaveConfigs = async () => {
    setSaving(true)
    setError(null)
    setInfo(null)
    try {
      // Flatten configs for API
      const payload = []
      Object.entries(configs).forEach(([jId, courtMap]) => {
        Object.entries(courtMap).forEach(([cId, catIds]) => {
          // Enviamos la configuración si existe, incluso si está vacía (vacía = CERRADA)
          if (catIds !== undefined && catIds !== null) {
            payload.push({
              jornadaId: parseInt(jId),
              courtId: parseInt(cId),
              categoryIds: catIds
            })
          }
        })
      })

      await updateCourtConfigs(tournament.id, { configs: payload })
      setInfo('✅ Configuración de pistas guardada correctamente')
      // Reload to ensure state is synced with DB
      loadData()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading">Cargando gestión de pistas...</div>

  const activeJornada = jornadas.find(j => j.id === activeJornadaId)

  return (
    <div className="court-manager">
      <header className="section-header" style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏟️ Gestión de Pistas y Disponibilidad
        </h2>
        <p className="text-muted">Configura qué pistas están disponibles en cada franja y qué categorías pueden jugar en ellas.</p>
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem',
          marginTop: '1rem',
          flexWrap: 'wrap',
          background: 'rgba(255,255,255,0.02)',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid var(--border)'
        }}>
          <button className="btn btn-red btn-sm" onClick={handleCloseAllGlobal} disabled={scheduleActive} style={{ fontSize: '0.75rem', opacity: scheduleActive ? 0.5 : 1 }}>
            🚫 Cerrar Todo (Global)
          </button>
          <button className="btn btn-green btn-sm" onClick={handleOpenAllGlobal} disabled={scheduleActive} style={{ fontSize: '0.75rem', opacity: scheduleActive ? 0.5 : 1 }}>
            ✅ Abrir Todo (Global)
          </button>
          <div style={{ width: '1px', height: '24px', background: 'var(--border)', margin: '0 0.5rem' }} />
          <button className="btn btn-outline-danger btn-sm" onClick={handleCloseCurrentJornada} disabled={scheduleActive} style={{ fontSize: '0.75rem', opacity: scheduleActive ? 0.5 : 1 }}>
            ✖️ Cerrar Franja Actual
          </button>
          <button className="btn btn-outline-success btn-sm" onClick={handleOpenCurrentJornada} disabled={scheduleActive} style={{ fontSize: '0.75rem', opacity: scheduleActive ? 0.5 : 1 }}>
            ✔️ Abrir Franja Actual
          </button>
        </div>
      </header>

      {scheduleActive && (
        <div className="alert alert-warning" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', border: '2px solid #f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
          <span style={{ fontSize: '2rem' }}>🔒</span>
          <div>
            <h4 style={{ margin: 0, color: '#f59e0b' }}>CALENDARIO ACTIVO — EDICIÓN BLOQUEADA</h4>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>No se puede modificar la configuración de pistas porque ya hay partidos programados. Para realizar cambios, primero debes eliminar el calendario en la pestaña <strong>Calendario (F8)</strong>.</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Lado Izquierdo: Mantenimiento de Pistas */}
        <aside className="card" style={{ position: 'sticky', top: '2rem' }}>
          <h3 style={{ marginTop: 0, fontSize: '1.1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            📍 Listado de Pistas
          </h3>
          
          <form onSubmit={handleAddCourt} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder={scheduleActive ? "Edición bloqueada" : "Nombre (ej: Pista Central)"}
              value={newCourtName}
              onChange={e => setNewCourtName(e.target.value)}
              style={{ flex: 1 }}
              disabled={scheduleActive}
            />
            <button className="btn btn-primary btn-sm" type="submit" disabled={scheduleActive}>Añadir</button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {courts.length === 0 && <p className="text-muted" style={{ textAlign: 'center', padding: '1rem' }}>No hay pistas definidas.</p>}
            {courts.map(c => (
              <div key={c.id} className="court-item" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                <span style={{ fontWeight: 600 }}>{c.name}</span>
                <button 
                  className="btn btn-red btn-sm" 
                  onClick={() => handleDeleteCourt(c.id)}
                  style={{ padding: '4px 8px', opacity: scheduleActive ? 0.5 : 1 }}
                  disabled={scheduleActive}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Lado Derecho: Configuración por Jornada */}
        <main>
          {jornadas.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
              <h3>No hay jornadas configuradas</h3>
              <p className="text-muted">Primero debes definir las jornadas (días y horas) en la pestaña "Configuración (F6)".</p>
            </div>
          ) : (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>⚙️ Configuración de Disponibilidad</h3>
                <button 
                  className="btn btn-primary" 
                  onClick={handleSaveConfigs}
                  disabled={saving || scheduleActive}
                >
                  {saving ? '⌛ Guardando...' : scheduleActive ? '🔒 Configuración Bloqueada' : '💾 Guardar Configuración'}
                </button>
              </div>

              {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
              {info && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{info}</div>}

              {/* Selector de Jornada */}
              <div className="jornada-tabs" style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                overflowX: 'auto', 
                paddingBottom: '0.5rem',
                marginBottom: '1.5rem',
                borderBottom: '1px solid var(--border)'
              }}>
                {jornadas.map(j => (
                  <button
                    key={j.id}
                    className={`btn btn-sm ${activeJornadaId === j.id ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveJornadaId(j.id)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {j.name} ({j.date.split('-').reverse().join('/')} | {j.startTime}-{j.endTime})
                  </button>
                ))}
              </div>



              {activeJornada && (
                <>
                  <div style={{ 
                    marginBottom: '1.5rem', 
                    padding: '1rem', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '8px', 
                    borderLeft: '4px solid var(--accent)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text)' }}>{activeJornada.name}</h3>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text2)' }}>
                      <span>📅 <strong>Día:</strong> {activeJornada.date.split('-').reverse().join('/')}</span>
                      <span>🕒 <strong>Desde:</strong> {activeJornada.startTime}</span>
                      <span>🕒 <strong>Hasta:</strong> {activeJornada.endTime}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem', fontStyle: 'italic' }}>
                    * Si una pista no tiene categorías seleccionadas, se considerará abierta para <strong>todas</strong> las categorías.
                  </p>
                  <div className="table-responsive">
                    <table className="table">


                    <thead>
                      <tr>
                        <th style={{ width: '200px' }}>Pista</th>
                        <th>Categorías Permitidas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courts.map(court => {
                        const selectedCats = configs[activeJornada.id]?.[court.id] || []
                        return (
                          <tr key={court.id}>
                            <td style={{ fontWeight: 600 }}>
                              {court.name}
                              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                                <button 
                                  onClick={() => !scheduleActive && setConfigs({
                                    ...configs, 
                                    [activeJornada.id]: {
                                      ...configs[activeJornada.id], 
                                      [court.id]: [] 
                                    }
                                  })}
                                  disabled={scheduleActive}
                                  title={scheduleActive ? "Bloqueado" : "Cerrar pista para esta franja"}
                                  style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', cursor: scheduleActive ? 'not-allowed' : 'pointer', opacity: scheduleActive ? 0.5 : 1 }}
                                >
                                  ⛔ Cerrar
                                </button>
                                <button 
                                  onClick={() => {
                                    if (scheduleActive) return
                                    const newJConf = { ...configs[activeJornada.id] }
                                    delete newJConf[court.id]
                                    setConfigs({ ...configs, [activeJornada.id]: newJConf })
                                  }}
                                  disabled={scheduleActive}
                                  title={scheduleActive ? "Bloqueado" : "Abrir para todas las categorías"}
                                  style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', color: '#22c55e', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', cursor: scheduleActive ? 'not-allowed' : 'pointer', opacity: scheduleActive ? 0.5 : 1 }}
                                >
                                  🔓 Abrir (Toda Cat.)
                                </button>
                              </div>
                            </td>
                            <td>

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {categories.length === 0 && <span className="text-muted">No hay categorías.</span>}
                                {categories.map(cat => {
                                  const isSelected = selectedCats.includes(cat.id)
                                  return (
                                    <button
                                      key={cat.id}
                                      onClick={() => !scheduleActive && toggleCategory(activeJornada.id, court.id, cat.id)}
                                      disabled={scheduleActive}
                                      style={{
                                        background: isSelected ? cat.color : 'rgba(255,255,255,0.05)',
                                        color: isSelected ? 'white' : 'var(--text2)',
                                        border: `1px solid ${isSelected ? cat.color : 'var(--border)'}`,
                                        padding: '4px 10px',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        cursor: scheduleActive ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        fontWeight: isSelected ? 700 : 400,
                                        boxShadow: isSelected ? `0 0 10px ${cat.color}44` : 'none',
                                        opacity: scheduleActive ? 0.7 : 1
                                      }}
                                    >
                                      {cat.name} ({cat.gender})
                                    </button>
                                  )
                                })}
                                {selectedCats.length === 0 && configs[activeJornada.id]?.[court.id] !== undefined && (
                                  <div style={{ padding: '4px 12px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #ef4444' }}>
                                    🔒 PISTA CERRADA
                                  </div>
                                )}
                                {configs[activeJornada.id]?.[court.id] === undefined && categories.length > 0 && (
                                  <div style={{ fontSize: '0.7rem', color: 'var(--accent2)', fontStyle: 'italic', marginTop: '4px', width: '100%' }}>
                                    ✨ Disponible para TODAS las categorías (por defecto)
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}


              <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(249,115,22,0.05)', borderRadius: '8px', border: '1px border var(--accent)' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent)', fontSize: '0.9rem' }}>💡 Consejos de uso:</h4>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.6 }}>
                  <li>Si no marcas ninguna categoría en una pista, el sistema la considerará **disponible para todos** los partidos.</li>
                  <li>Usa esta pantalla para **reservar pistas específicas** para categorías concretas (ej: Pista 1 solo para Deporte Inclusivo).</li>
                  <li>El programador automático (F8) respetará estrictamente estas restricciones al asignar horarios.</li>
                  <li>Si una jornada no tiene pistas configuradas, no se programarán partidos en ella.</li>
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
